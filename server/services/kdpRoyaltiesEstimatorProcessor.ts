import XLSX from 'xlsx';
import { IStorage } from '../storage';
import { nanoid } from 'nanoid';

export interface RoyaltiesEstimatorConfig {
  // Signatures de colonnes pour reconnaissance automatique
  combinedSalesSignature: string[];
  ebookRoyaltySignature: string[];
  paperbackRoyaltySignature: string[];
  hardcoverRoyaltySignature: string[];
  kenpReadSignature: string[];
  ordersPlacedSignature: string[];
}

// Configuration des signatures de colonnes exactes pour reconnaissance
const ROYALTIES_ESTIMATOR_SIGNATURES: RoyaltiesEstimatorConfig = {
  combinedSalesSignature: [
    "Royalty Date",
    "Title", 
    "Author Name",
    "ASIN/ISBN",
    "Marketplace",
    "Royalty Type",
    "Transaction Type",
    "Units Sold",
    "Units Refunded",
    "Net Units Sold",
    "Avg. List Price without tax",
    "Avg. Offer Price without tax",
    "Avg. Delivery/Manufacturing cost",
    "Royalty",
    "Currency"
  ],
  ebookRoyaltySignature: [
    "Royalty Date",
    "Title",
    "Author Name", 
    "ASIN",
    "Marketplace",
    "Royalty Type",
    "Transaction Type",
    "Units Sold",
    "Units Refunded",
    "Net Units Sold",
    "Avg. List Price without tax",
    "Avg. Offer Price without tax",
    "Avg. File Size (MB)",
    "Avg. Delivery Cost",
    "Royalty",
    "Currency"
  ],
  paperbackRoyaltySignature: [
    "Royalty Date",
    "Order Date",
    "Title",
    "Author Name",
    "ISBN",
    "Marketplace",
    "Units Sold",
    "Units Refunded"
    // Note: Structure tronquée dans l'exemple, mais on vérifie les premiers champs
  ],
  hardcoverRoyaltySignature: [
    "Royalty Date",
    "Order Date", 
    "Title",
    "Author Name",
    "ISBN",
    "Marketplace"
    // Structure similaire à paperback
  ],
  kenpReadSignature: [
    "Date",
    "Title",
    "Author Name",
    "ASIN",
    "Marketplace",
    "Kindle Edition Normalized Page (KENP) Read"
  ],
  ordersPlacedSignature: [
    "Date",
    "Title", 
    "Author Name",
    "ASIN",
    "Marketplace",
    "Paid Units",
    "Free Units"
  ]
};

export class KdpRoyaltiesEstimatorProcessor {
  constructor(private storage: IStorage) {}

  /**
   * Détecte si un fichier est un KDP_Royalties_Estimator basé sur la structure des colonnes
   */
  public static detectFileType(workbook: XLSX.WorkBook): boolean {
    const sheetNames = workbook.SheetNames;
    
    // Vérifier la présence des onglets caractéristiques
    const requiredSheets = ['Combined Sales', 'eBook Royalty'];
    const hasRequiredSheets = requiredSheets.every(sheet => sheetNames.includes(sheet));
    
    if (!hasRequiredSheets) {
      return false;
    }

    // Vérifier la signature des colonnes de Combined Sales
    const combinedSalesSheet = workbook.Sheets['Combined Sales'];
    if (!combinedSalesSheet) return false;

    const data = XLSX.utils.sheet_to_json(combinedSalesSheet, { header: 1 });
    if (data.length === 0) return false;

    const headers = data[0] as string[];
    
    // Vérifier que les premières colonnes correspondent à la signature
    const expectedHeaders = ROYALTIES_ESTIMATOR_SIGNATURES.combinedSalesSignature.slice(0, 8);
    const actualHeaders = headers.slice(0, 8);
    
    return expectedHeaders.every((expected, index) => 
      actualHeaders[index] === expected
    );
  }

  /**
   * Traite un fichier KDP_Royalties_Estimator complet
   */
  public async processFile(
    workbook: XLSX.WorkBook,
    importId: string,
    userId: string
  ): Promise<{ processedRecords: number; errorRecords: number }> {
    let totalProcessed = 0;
    let totalErrors = 0;

    console.log('[ROYALTIES_ESTIMATOR] Début du traitement du fichier');

    // Traiter chaque onglet pertinent
    const sheetsToProcess = [
      'Combined Sales',
      'eBook Royalty', 
      'Paperback Royalty',
      'Hardcover Royalty',
      'KENP Read',
      'eBook Orders Placed'
    ];

    for (const sheetName of sheetsToProcess) {
      if (workbook.Sheets[sheetName]) {
        console.log(`[ROYALTIES_ESTIMATOR] Traitement de l'onglet: ${sheetName}`);
        const { processed, errors } = await this.processSheet(
          workbook.Sheets[sheetName],
          sheetName,
          importId,
          userId
        );
        totalProcessed += processed;
        totalErrors += errors;
      }
    }

    console.log(`[ROYALTIES_ESTIMATOR] Terminé: ${totalProcessed} enregistrements traités, ${totalErrors} erreurs`);
    return { processedRecords: totalProcessed, errorRecords: totalErrors };
  }

  /**
   * Traite un onglet spécifique
   */
  private async processSheet(
    worksheet: XLSX.WorkSheet,
    sheetName: string,
    importId: string,
    userId: string
  ): Promise<{ processed: number; errors: number }> {
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    if (data.length <= 1) {
      return { processed: 0, errors: 0 };
    }

    const headers = data[0] as string[];
    const rows = data.slice(1);
    
    let processed = 0;
    let errors = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i] as any[];
      
      try {
        const record = await this.parseRowToRecord(row, headers, sheetName, importId, userId, i + 2);
        
        // FILTRAGE CRITÈRE: Ne traiter que les types de transactions spécifiés
        if (record.transactionType && 
            !['Free - Promotion', 'Expanded Distribution Channels'].includes(record.transactionType)) {
          continue; // Ignorer les autres types de transactions
        }

        await this.storage.createKdpRoyaltiesEstimatorRecord(record);
        processed++;
        
      } catch (error) {
        console.error(`[ROYALTIES_ESTIMATOR] Erreur ligne ${i + 2}:`, error);
        errors++;
      }
    }

    return { processed, errors };
  }

  /**
   * Parse une ligne en enregistrement formaté
   */
  private async parseRowToRecord(
    row: any[],
    headers: string[],
    sheetName: string,
    importId: string,
    userId: string,
    rowIndex: number
  ): Promise<any> {
    const record: any = {
      id: nanoid(),
      userId,
      importId,
      sheetName,
      rowIndex,
      rawRowData: JSON.stringify(row)
    };

    // Mapping des colonnes selon l'onglet
    for (let i = 0; i < headers.length; i++) {
      const header = headers[i];
      const value = row[i];

      if (value === undefined || value === null || value === '') continue;

      // Mapping des champs communs
      switch (header) {
        case 'Royalty Date':
        case 'Date':
          record.royaltyDate = this.parseDate(value);
          break;
        case 'Order Date':
          record.orderDate = this.parseDate(value);
          break;
        case 'Title':
          record.title = String(value);
          break;
        case 'Author Name':
          record.authorName = String(value);
          break;
        case 'ASIN/ISBN':
        case 'ASIN':
        case 'ISBN':
          record.asinIsbn = String(value);
          break;
        case 'Marketplace':
          record.marketplace = String(value);
          break;
        case 'Royalty Type':
          record.royaltyType = String(value);
          break;
        case 'Transaction Type':
          record.transactionType = String(value);
          break;
        case 'Units Sold':
          record.unitsSold = this.parseInteger(value);
          break;
        case 'Units Refunded':
          record.unitsRefunded = this.parseInteger(value);
          break;
        case 'Net Units Sold':
          record.netUnitsSold = this.parseInteger(value);
          break;
        case 'Avg. List Price without tax':
          record.avgListPriceWithoutTax = this.parseDecimal(value);
          break;
        case 'Avg. Offer Price without tax':
          record.avgOfferPriceWithoutTax = this.parseDecimal(value);
          break;
        case 'Avg. Delivery/Manufacturing cost':
          record.avgDeliveryManufacturingCost = this.parseDecimal(value);
          break;
        case 'Avg. File Size (MB)':
          record.avgFileSizeMb = this.parseDecimal(value);
          break;
        case 'Avg. Delivery Cost':
          record.avgDeliveryCost = this.parseDecimal(value);
          break;
        case 'Printing Cost':
          record.printingCost = this.parseDecimal(value);
          break;
        case 'Expanded Distribution Cost':
          record.expandedDistributionCost = this.parseDecimal(value);
          break;
        case 'Royalty':
          record.royalty = this.parseDecimal(value);
          break;
        case 'Currency':
          record.currency = String(value);
          break;
        case 'Kindle Edition Normalized Page (KENP) Read':
          record.kenpRead = this.parseInteger(value);
          break;
        case 'Paid Units':
          record.paidUnits = this.parseInteger(value);
          break;
        case 'Free Units':
          record.freeUnits = this.parseInteger(value);
          break;
      }
    }

    return record;
  }

  private parseDate(value: any): string | null {
    if (!value) return null;
    if (value instanceof Date) return value.toISOString().split('T')[0];
    return String(value);
  }

  private parseInteger(value: any): number | null {
    if (value === null || value === undefined || value === '') return null;
    const parsed = parseInt(String(value), 10);
    return isNaN(parsed) ? null : parsed;
  }

  private parseDecimal(value: any): string | null {
    if (value === null || value === undefined || value === '') return null;
    const parsed = parseFloat(String(value));
    return isNaN(parsed) ? null : String(parsed);
  }
}