import XLSX from 'xlsx';
import { storage } from '../storage';
import type { InsertKdpRoyaltiesEstimatorData } from '@shared/schema';

interface KdpRoyaltiesSheet {
  name: string;
  headers: string[];
  data: any[][];
  hasTransactionType: boolean;
}

export class KdpRoyaltiesEstimatorProcessor {
  private static TARGET_TRANSACTION_TYPES = [
    'Free - Promotion',
    'Expanded Distribution Channels'
  ];

  /**
   * Détecte si un fichier Excel est un KDP_Royalties_Estimator
   * en analysant la structure des colonnes dans les onglets
   */
  static detectKdpRoyaltiesEstimator(workbook: XLSX.WorkBook): boolean {
    const requiredSheets = ['eBook Royalty', 'Paperback Royalty', 'Hardcover Royalty'];
    const sheetNames = workbook.SheetNames;
    
    // Vérifier que les onglets de royalties existent
    const hasRoyaltySheets = requiredSheets.some(name => sheetNames.includes(name));
    if (!hasRoyaltySheets) return false;

    // Vérifier la structure d'au moins un onglet royalty
    for (const sheetName of sheetNames) {
      if (sheetName.toLowerCase().includes('royalty')) {
        const sheet = workbook.Sheets[sheetName];
        const headerRow = XLSX.utils.sheet_to_json(sheet, { header: 1, range: 0 })[0] as string[];
        
        // Vérifier la présence des colonnes clés
        const hasRoyaltyDate = headerRow.some(header => 
          header && header.toLowerCase().includes('royalty date')
        );
        const hasTransactionType = headerRow.some(header => 
          header && header.toLowerCase().includes('transaction type')
        );
        
        if (hasRoyaltyDate && hasTransactionType) {
          return true;
        }
      }
    }
    
    return false;
  }

  /**
   * Analyse tous les onglets du fichier KDP_Royalties_Estimator
   */
  static analyzeWorkbook(workbook: XLSX.WorkBook): KdpRoyaltiesSheet[] {
    const royaltySheets: KdpRoyaltiesSheet[] = [];
    
    const targetSheetNames = [
      'Combined Sales',
      'eBook Royalty', 
      'Paperback Royalty',
      'Hardcover Royalty'
    ];

    for (const sheetName of targetSheetNames) {
      if (workbook.SheetNames.includes(sheetName)) {
        const sheet = workbook.Sheets[sheetName];
        const fullData = XLSX.utils.sheet_to_json(sheet, { 
          header: 1, 
          defval: '', 
          raw: false // Obtenir les valeurs formatées comme strings
        }) as any[][];
        
        if (fullData.length > 0) {
          const headers = fullData[0] as string[];
          const data = fullData.slice(1);
          
          const hasTransactionType = headers.some(header => 
            header && header.toLowerCase().includes('transaction type')
          );

          royaltySheets.push({
            name: sheetName,
            headers,
            data,
            hasTransactionType
          });
        }
      }
    }

    return royaltySheets;
  }

  /**
   * Traite et filtre les données selon les Transaction Types ciblés
   */
  static async processKdpRoyaltiesEstimator(
    workbook: XLSX.WorkBook,
    importId: string,
    userId: string
  ): Promise<{
    totalProcessed: number;
    filteredRecords: number;
    processedSheets: string[];
    errors: string[];
  }> {
    const sheets = this.analyzeWorkbook(workbook);
    const errors: string[] = [];
    let totalProcessed = 0;
    let filteredRecords = 0;
    const processedSheets: string[] = [];

    for (const sheet of sheets) {
      try {
        console.log(`[KDP_ROYALTIES] Traitement onglet: ${sheet.name}`);
        
        if (!sheet.hasTransactionType) {
          console.log(`[KDP_ROYALTIES] Onglet ${sheet.name} ignoré: pas de colonne Transaction Type`);
          continue;
        }

        const transactionTypeIndex = sheet.headers.findIndex(header => 
          header && header.toLowerCase().includes('transaction type')
        );

        if (transactionTypeIndex === -1) {
          errors.push(`Colonne Transaction Type non trouvée dans ${sheet.name}`);
          continue;
        }

        // Filtrer les lignes selon les Transaction Types ciblés
        const filteredRows = sheet.data.filter(row => {
          const transactionType = row[transactionTypeIndex];
          return transactionType && this.TARGET_TRANSACTION_TYPES.includes(transactionType);
        });

        console.log(`[KDP_ROYALTIES] ${sheet.name}: ${filteredRows.length} lignes filtrées sur ${sheet.data.length} total`);

        // Traiter chaque ligne filtrée
        for (let i = 0; i < filteredRows.length; i++) {
          const row = filteredRows[i];
          
          try {
            const mappedData = this.mapRowToSchema(sheet.name, sheet.headers, row, importId, userId, i);
            console.log(`[KDP_ROYALTIES] Sauvegarde ligne ${i + 1} de ${sheet.name}:`, {
              transactionType: mappedData.transactionType,
              title: mappedData.title,
              asin: mappedData.asin || 'N/A',
              royalty: mappedData.royalty
            });
            
            const savedRecord = await storage.createKdpRoyaltiesEstimatorData(mappedData);
            console.log(`[KDP_ROYALTIES] ✅ Ligne sauvegardée avec ID: ${savedRecord.id}`);
            filteredRecords++;
          } catch (error) {
            console.log(`[KDP_ROYALTIES] ❌ Erreur sauvegarde ligne ${i + 1}:`, error);
            errors.push(`Erreur ligne ${i + 1} de ${sheet.name}: ${error}`);
          }
        }

        totalProcessed += sheet.data.length;
        processedSheets.push(sheet.name);
        
      } catch (error) {
        errors.push(`Erreur traitement onglet ${sheet.name}: ${error}`);
      }
    }

    console.log(`[KDP_ROYALTIES] RÉSUMÉ FINAL: ${filteredRecords} lignes filtrées sur ${totalProcessed} total`);
    
    return {
      totalProcessed,
      filteredRecords,
      processedSheets,
      errors
    };
  }

  /**
   * Mappe une ligne de données vers le schéma de la base de données
   */
  private static mapRowToSchema(
    sheetName: string,
    headers: string[],
    row: any[],
    importId: string,
    userId: string,
    rowIndex: number
  ): InsertKdpRoyaltiesEstimatorData {
    const getColumnValue = (columnName: string): any => {
      const index = headers.findIndex(h => 
        h && h.toLowerCase() === columnName.toLowerCase()
      );
      return index !== -1 ? row[index] : null;
    };

    const getColumnValuePartial = (partialName: string): any => {
      const index = headers.findIndex(h => 
        h && h.toLowerCase().includes(partialName.toLowerCase())
      );
      return index !== -1 ? row[index] : null;
    };

    // Mapping des champs communs
    const commonData = {
      importId,
      userId, 
      sheetName,
      rowIndex,
      rawData: { headers, row },
      
      // Champs communs
      royaltyDate: getColumnValue('Royalty Date'),
      title: getColumnValue('Title'),
      authorName: getColumnValue('Author Name'),
      marketplace: getColumnValue('Marketplace'),
      royaltyType: getColumnValue('Royalty Type'),
      transactionType: getColumnValue('Transaction Type'), // Ce champ est obligatoire
      unitsSold: parseInt(getColumnValue('Units Sold')) || 0,
      unitsRefunded: parseInt(getColumnValue('Units Refunded')) || 0,
      netUnitsSold: parseInt(getColumnValue('Net Units Sold')) || 0,
      avgListPriceWithoutTax: getColumnValuePartial('Avg. List Price'),
      avgOfferPriceWithoutTax: getColumnValuePartial('Avg. Offer Price'),
      royalty: getColumnValue('Royalty'),
      currency: getColumnValue('Currency'),
    };

    // Mapping spécifique selon l'onglet
    if (sheetName === 'eBook Royalty') {
      return {
        ...commonData,
        asin: getColumnValue('ASIN'),
        avgFileSizeMb: getColumnValuePartial('Avg. File Size'),
        avgDeliveryCost: getColumnValuePartial('Avg. Delivery Cost'),
      };
    } else if (sheetName === 'Combined Sales') {
      return {
        ...commonData,
        asinIsbn: getColumnValue('ASIN/ISBN'),
        avgDeliveryCost: getColumnValuePartial('Avg. Delivery'),
      };
    } else if (sheetName === 'Paperback Royalty' || sheetName === 'Hardcover Royalty') {
      return {
        ...commonData,
        orderDate: getColumnValue('Order Date'),
        isbn: getColumnValue('ISBN'),
        avgManufacturingCost: getColumnValuePartial('Avg. Manufacturing Cost'),
        asinRef: getColumnValue('ASIN'),
      };
    }

    return {
      ...commonData,
      // Champs par défaut pour les cas non couverts
    } as InsertKdpRoyaltiesEstimatorData;
  }
}