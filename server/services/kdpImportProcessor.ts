import { storage } from '../storage';
import { KdpImportService, type ParsedKdpData } from './kdpImportService';
import type { KdpImport, InsertKdpImportData } from '@shared/schema';

export interface ProcessingProgress {
  currentStep: string;
  progress: number;
  processedRecords: number;
  totalRecords: number;
  errors: string[];
}

export class KdpImportProcessor {
  private importId: string;
  private userId: string;
  private onProgress?: (progress: ProcessingProgress) => void;

  constructor(importId: string, userId: string, onProgress?: (progress: ProcessingProgress) => void) {
    this.importId = importId;
    this.userId = userId;
    this.onProgress = onProgress;
  }

  /**
   * Process a parsed KDP file and store the data
   */
  async processImport(parsedData: ParsedKdpData): Promise<void> {
    try {
      await this.updateProgress('Initializing import process...', 0, 0, parsedData.summary.estimatedRecords);

      // Update import record with detected type and summary
      await storage.updateKdpImport(this.importId, {
        detectedType: parsedData.detectedType as any,
        status: 'processing',
        totalRecords: parsedData.summary.estimatedRecords,
        summary: parsedData.summary,
        rawData: parsedData.sheets,
      });

      let processedRecords = 0;
      const allImportData: InsertKdpImportData[] = [];
      const errors: string[] = [];

      // Process each sheet
      for (const [sheetName, sheetData] of Object.entries(parsedData.sheets)) {
        await this.updateProgress(`Processing sheet: ${sheetName}...`, 
          Math.round((processedRecords / parsedData.summary.estimatedRecords) * 100), 
          processedRecords, 
          parsedData.summary.estimatedRecords
        );

        if (sheetData.headers.length === 0 || sheetData.data.length === 0) {
          console.log(`Skipping empty sheet: ${sheetName}`);
          continue;
        }

        // Create column mapping for this sheet
        const columnMapping = KdpImportService.createColumnMapping(sheetData.headers);

        // Process each row
        sheetData.data.forEach((rowData, rowIndex) => {
          try {
            // Skip empty rows
            if (rowData.every(cell => !cell || cell === '')) {
              return;
            }

            const normalizedData = KdpImportService.normalizeRowData(
              rowData,
              sheetData.headers,
              columnMapping,
              this.importId,
              this.userId,
              sheetName,
              rowIndex + 2 // +2 because rowIndex is 0-based and we skip header row
            );

            allImportData.push(normalizedData);
            processedRecords++;

          } catch (error) {
            const errorMsg = `Error processing row ${rowIndex + 2} in sheet ${sheetName}: ${error instanceof Error ? error.message : 'Unknown error'}`;
            errors.push(errorMsg);
            console.error(errorMsg, error);
          }
        });
      }

      await this.updateProgress('Checking for duplicates...', 75, processedRecords, parsedData.summary.estimatedRecords);

      // Check for duplicates against existing data and within current import
      const duplicates = await this.findDuplicatesInDatabase(allImportData);
      duplicates.forEach(index => {
        allImportData[index].isDuplicate = true;
      });

      await this.updateProgress('Saving import data...', 85, processedRecords, parsedData.summary.estimatedRecords);

      // Only insert non-duplicate records
      const nonDuplicateData = allImportData.filter(record => !record.isDuplicate);
      const savedData = await storage.createKdpImportData(nonDuplicateData);
      
      // Log duplicate information
      const duplicateCount = allImportData.length - nonDuplicateData.length;
      if (duplicateCount > 0) {
        console.log(`[IMPORT ${this.importId.slice(0, 8)}] Skipped ${duplicateCount} duplicate records`);
      }

      await this.updateProgress('Updating master books...', 90, processedRecords, parsedData.summary.estimatedRecords);

      // Mise à jour de la table master books avec les nouvelles données
      if (savedData.length > 0) {
        try {
          await storage.updateMasterBooksFromImport(this.userId, this.importId);
          console.log(`[IMPORT ${this.importId.slice(0, 8)}] Master books mis à jour avec succès`);
        } catch (error) {
          console.error(`[IMPORT ${this.importId.slice(0, 8)}] Erreur mise à jour master books:`, error);
          // Ne pas échouer l'import entier pour cette erreur
        }
      }

      await this.updateProgress('Finalizing import...', 95, processedRecords, parsedData.summary.estimatedRecords);

      // Update final import status
      await storage.updateKdpImport(this.importId, {
        status: errors.length > 0 ? 'completed' : 'completed', // Even with errors, mark as completed if we processed some data
        progress: 100,
        processedRecords: savedData.length,
        errorRecords: errors.length,
        duplicateRecords: duplicates.length,
        errorLog: errors,
        // completedAt: new Date(), // This field doesn't exist in the schema
        mappingConfig: Object.values(parsedData.sheets).map(sheet => ({
          sheetName: sheet.headers,
          mapping: KdpImportService.createColumnMapping(sheet.headers)
        })),
      });

      await this.updateProgress('Import completed successfully', 100, processedRecords, parsedData.summary.estimatedRecords);

    } catch (error) {
      console.error('Import processing failed:', error);
      
      // Update import status to failed
      await storage.updateKdpImport(this.importId, {
        status: 'failed',
        errorLog: [error instanceof Error ? error.message : 'Unknown processing error'],
      });

      throw error;
    }
  }

  /**
   * Find duplicate records by checking against existing database data
   */
  private async findDuplicatesInDatabase(importData: InsertKdpImportData[]): Promise<number[]> {
    const duplicateIndexes: number[] = [];
    const seen = new Set<string>();

    // Get all existing records for this user to check for duplicates
    const existingRecords = await storage.getAllKdpImportDataForUser(this.userId);
    
    // Create a set of existing unique keys
    const existingKeys = new Set<string>();
    existingRecords.forEach(record => {
      // Include ALL distinctive identifiers including date and amount
      const coreIdentifiers = [
        record.asin,
        record.isbn,
        record.title,
        record.marketplace,
        record.format,
        record.salesDate,
        record.royalty,
        record.currency
      ].filter(Boolean);
      
      if (coreIdentifiers.length > 0) {
        const uniqueKey = coreIdentifiers.join('|').toLowerCase();
        existingKeys.add(uniqueKey);
      }
    });

    // Check each import record for duplicates
    importData.forEach((record, index) => {
      // Create unique key based on ALL distinctive identifiers including date and amount
      const coreIdentifiers = [
        record.asin,
        record.isbn,
        record.title,
        record.marketplace,
        record.format,
        record.salesDate,
        record.royalty,
        record.currency
      ].filter(Boolean);

      const uniqueKey = coreIdentifiers.length > 0 
        ? coreIdentifiers.join('|').toLowerCase()
        : null;

      if (!uniqueKey) return;

      // Check against existing data in database
      if (existingKeys.has(uniqueKey)) {
        duplicateIndexes.push(index);
        console.log(`[IMPORT ${this.importId.slice(0, 8)}] Found duplicate record at index ${index}: ${uniqueKey}`);
      }
      // Check against already processed records in current import
      else if (seen.has(uniqueKey)) {
        duplicateIndexes.push(index);
        console.log(`[IMPORT ${this.importId.slice(0, 8)}] Found duplicate within import at index ${index}: ${uniqueKey}`);
      } else {
        seen.add(uniqueKey);
      }
    });

    console.log(`[IMPORT ${this.importId.slice(0, 8)}] Found ${duplicateIndexes.length} duplicate records out of ${importData.length} total records`);
    return duplicateIndexes;
  }

  /**
   * Update processing progress
   */
  private async updateProgress(
    step: string, 
    progress: number, 
    processedRecords: number, 
    totalRecords: number, 
    errors: string[] = []
  ): Promise<void> {
    console.log(`[IMPORT ${this.importId.slice(0, 8)}] ${step} (${progress}%)`);
    
    // Update database
    await storage.updateKdpImport(this.importId, {
      progress,
      processedRecords,
    });

    // Call progress callback if provided
    if (this.onProgress) {
      this.onProgress({
        currentStep: step,
        progress,
        processedRecords,
        totalRecords,
        errors,
      });
    }
  }

  /**
   * Validate import data integrity
   */
  static validateImportData(importData: InsertKdpImportData[]): { 
    isValid: boolean; 
    errors: string[]; 
    warnings: string[] 
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for required fields
    importData.forEach((record, index) => {
      if (!record.title && !record.asin && !record.isbn) {
        errors.push(`Row ${index + 1}: Missing title, ASIN, and ISBN - at least one identifier is required`);
      }

      if (record.royalty && Number(record.royalty) < 0) {
        warnings.push(`Row ${index + 1}: Negative royalty amount (${record.royalty})`);
      }

      if (record.unitsSold && record.unitsSold < 0) {
        warnings.push(`Row ${index + 1}: Negative units sold (${record.unitsSold})`);
      }
    });

    // Check for suspicious patterns
    const uniqueTitles = new Set(importData.map(r => r.title).filter(Boolean));
    if (uniqueTitles.size < importData.length * 0.1) {
      warnings.push('Very few unique titles detected - this may indicate processing errors');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }
}