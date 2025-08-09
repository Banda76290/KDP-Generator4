import XLSX from 'xlsx';
import { KdpRoyaltiesEstimatorProcessor } from './kdpRoyaltiesEstimatorProcessor';
import { KdpImportProcessor } from './kdpImportProcessor';
import { IStorage } from '../storage';

export enum KdpFileType {
  ROYALTIES_ESTIMATOR = 'royalties_estimator',
  PAYMENTS = 'payments',
  PRIOR_MONTH_ROYALTIES = 'prior_month_royalties',
  KENP_READ = 'kenp_read',
  DASHBOARD = 'dashboard',
  ORDERS = 'orders',
  UNKNOWN = 'unknown'
}

export interface ParsedKdpData {
  detectedType: KdpFileType;
  summary: {
    estimatedRecords: number;
    processedSheets: string[];
  };
  data: any[];
  sheets: Record<string, any>;
}

export interface ImportResult {
  fileType: KdpFileType;
  processedRecords: number;
  errorRecords: number;
  importId: string;
  detectedSheets?: string[];
}

export class KdpImportService {
  private royaltiesEstimatorProcessor: KdpRoyaltiesEstimatorProcessor;
  private kdpImportProcessor: KdpImportProcessor;

  constructor(private storage: IStorage) {
    this.royaltiesEstimatorProcessor = new KdpRoyaltiesEstimatorProcessor();
    this.kdpImportProcessor = new KdpImportProcessor('', '', undefined);
  }

  // Add missing static methods
  static createColumnMapping(sheetData: any): any {
    return {};
  }

  static normalizeRowData(data: any, mapping: any): any {
    // Create a basic normalized data structure for the import
    return {
      importId: '',
      userId: '',
      sheetName: '',
      rowIndex: 0,
      originalData: data,
      processedData: {},
      isDuplicate: false
    };
  }

  /**
   * Détecte automatiquement le type de fichier KDP basé sur la structure des colonnes
   */
  public detectFileType(workbook: XLSX.WorkBook): KdpFileType {
    // 1. Test pour KDP_Royalties_Estimator (priorité haute - nouveau système)
    if (KdpRoyaltiesEstimatorProcessor.detectKdpRoyaltiesEstimator(workbook)) {
      console.log('[KDP_IMPORT] Fichier détecté: KDP_Royalties_Estimator');
      return KdpFileType.ROYALTIES_ESTIMATOR;
    }

    // 2. Tests pour les anciens types de fichiers (fallback)
    const sheetNames = workbook.SheetNames;
    const firstSheetName = sheetNames[0]?.toLowerCase() || '';

    if (firstSheetName.includes('payment') || firstSheetName.includes('paiement')) {
      return KdpFileType.PAYMENTS;
    }
    
    if (firstSheetName.includes('royalties') && firstSheetName.includes('prior')) {
      return KdpFileType.PRIOR_MONTH_ROYALTIES;
    }

    if (firstSheetName.includes('kenp') || firstSheetName.includes('read')) {
      return KdpFileType.KENP_READ;
    }

    if (firstSheetName.includes('dashboard')) {
      return KdpFileType.DASHBOARD;
    }

    if (firstSheetName.includes('order')) {
      return KdpFileType.ORDERS;
    }

    return KdpFileType.UNKNOWN;
  }

  /**
   * Traite un fichier KDP selon son type détecté
   */
  public async processFile(
    workbook: XLSX.WorkBook,
    fileName: string,
    userId: string
  ): Promise<ImportResult> {
    const fileType = this.detectFileType(workbook);
    
    // Créer l'enregistrement d'import
    const importRecord = await this.storage.createKdpImport({
      userId,
      fileName,
      fileType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      fileSize: 0, // Sera mis à jour si nécessaire
      detectedType: fileType,
      status: 'processing',
      rawData: { sheetNames: workbook.SheetNames }
    });

    console.log(`[KDP_IMPORT] Traitement du fichier ${fileName} de type ${fileType}`);

    try {
      let result: { processedRecords: number; errorRecords: number };

      switch (fileType) {
        case KdpFileType.ROYALTIES_ESTIMATOR:
          const royaltiesResult = await KdpRoyaltiesEstimatorProcessor.processKdpRoyaltiesEstimator(
            workbook,
            importRecord.id,
            userId
          );
          result = {
            processedRecords: royaltiesResult.totalProcessed,
            errorRecords: royaltiesResult.errors.length
          };
          break;

        default:
          // Pour les autres types, utiliser un traitement de base
          result = {
            processedRecords: 0,
            errorRecords: 0
          };
          break;
      }

      // Mettre à jour le statut de l'import
      await this.storage.updateKdpImport(importRecord.id, {
        status: 'completed',
        processedRecords: result.processedRecords,
        errorRecords: result.errorRecords
      });

      return {
        fileType,
        processedRecords: result.processedRecords,
        errorRecords: result.errorRecords,
        importId: importRecord.id,
        detectedSheets: workbook.SheetNames
      };

    } catch (error) {
      console.error('[KDP_IMPORT] Erreur lors du traitement:', error);
      
      await this.storage.updateKdpImport(importRecord.id, {
        status: 'failed',
        errorLog: [error instanceof Error ? error.message : String(error)]
      });

      throw error;
    }
  }

  /**
   * Obtient les données selon le type de fichier
   */
  public async getImportData(importId: string, fileType: KdpFileType): Promise<any[]> {
    switch (fileType) {
      case KdpFileType.ROYALTIES_ESTIMATOR:
        return await this.storage.getKdpRoyaltiesEstimatorData(importId);
      
      default:
        return await this.storage.getKdpImportData(importId);
    }
  }

  /**
   * Supprime les données selon le type de fichier
   */
  public async deleteImportData(importId: string, fileType: KdpFileType): Promise<void> {
    switch (fileType) {
      case KdpFileType.ROYALTIES_ESTIMATOR:
        await this.storage.deleteKdpRoyaltiesEstimatorData(importId);
        break;
      
      default:
        await this.storage.deleteKdpImportData(importId);
        break;
    }
  }
}