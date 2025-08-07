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
    let totalProcessedSoFar = 0; // Compteur global pour la progression
    let newRecords = 0; // Nouveaux records ajoutés
    let duplicateRecords = 0; // Records existants mis à jour
    let errorRecords = 0;
    const processedSheets: string[] = [];
    
    // Calculer le nombre total de lignes à traiter
    const totalRows = sheets.reduce((sum, sheet) => {
      const transactionTypeIndex = sheet.headers.findIndex(header => 
        header && header.toLowerCase().includes('transaction type')
      );
      if (transactionTypeIndex === -1) return sum;
      
      const filteredRows = sheet.name === 'Combined Sales' 
        ? sheet.data.filter(row => {
            const transactionType = row[transactionTypeIndex];
            return transactionType && this.TARGET_TRANSACTION_TYPES.includes(transactionType);
          })
        : sheet.data.filter(row => {
            const transactionType = row[transactionTypeIndex];
            return transactionType && transactionType.trim() !== '';
          });
      return sum + filteredRows.length;
    }, 0);

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

        // Filtrer selon l'onglet :
        // - Combined Sales : filtrer par Transaction Types
        // - Autres onglets : prendre toutes les lignes
        const filteredRows = sheet.name === 'Combined Sales' 
          ? sheet.data.filter(row => {
              const transactionType = row[transactionTypeIndex];
              return transactionType && this.TARGET_TRANSACTION_TYPES.includes(transactionType);
            })
          : sheet.data.filter(row => {
              // Pour les autres onglets, prendre toutes les lignes avec des données valides
              const transactionType = row[transactionTypeIndex];
              return transactionType && transactionType.trim() !== '';
            });

        console.log(`[KDP_ROYALTIES] ${sheet.name}: ${filteredRows.length} lignes filtrées sur ${sheet.data.length} total`);

        // Traiter chaque ligne filtrée avec déduplication et progression en temps réel
        for (let i = 0; i < filteredRows.length; i++) {
          const row = filteredRows[i];
          
          try {
            const mappedData = this.mapRowToSchema(sheet.name, sheet.headers, row, importId, userId, i);
            
            // Créer une clé unique pour détecter les doublons
            const uniqueKey = this.createUniqueKey(mappedData);
            
            // Vérifier si l'enregistrement existe déjà
            const existingRecord = await storage.findKdpRoyaltiesEstimatorDataByKey(
              mappedData.userId,
              uniqueKey
            );
            
            if (existingRecord) {
              console.log(`[KDP_ROYALTIES] 🔄 Mise à jour ligne ${i + 1} de ${sheet.name} (existe déjà)`);
              const updatedRecord = await storage.updateKdpRoyaltiesEstimatorData(
                existingRecord.id,
                mappedData
              );
              console.log(`[KDP_ROYALTIES] ✅ Ligne mise à jour avec ID: ${updatedRecord.id}`);
              duplicateRecords++;
            } else {
              console.log(`[KDP_ROYALTIES] ➕ Nouvelle ligne ${i + 1} de ${sheet.name}`);
              // Ajouter la clé unique aux données à sauver
              const dataWithKey = { ...mappedData, uniqueKey };
              const savedRecord = await storage.createKdpRoyaltiesEstimatorData(dataWithKey);
              console.log(`[KDP_ROYALTIES] ✅ Ligne sauvegardée avec ID: ${savedRecord.id}`);
              newRecords++;
            }
            
            filteredRecords++;
            totalProcessedSoFar++; // Compteur global pour toutes les lignes traitées
            
            // Mettre à jour la progression toutes les 10 lignes traitées
            if ((totalProcessedSoFar % 10 === 0) || (totalProcessedSoFar === totalRows)) {
              const progress = Math.round((totalProcessedSoFar / totalRows) * 100);
              console.log(`[KDP_ROYALTIES] 📊 Progression: ${totalProcessedSoFar}/${totalRows} (${progress}%)`);
              await storage.updateKdpImport(importId, {
                status: 'processing',
                progress,
                processedRecords: newRecords, // Seulement les nouveaux records
                totalRecords: totalRows, // Total des lignes du fichier
                errorRecords,
                duplicateRecords,
                errorLog: errors
              });
            }
            
          } catch (error) {
            console.log(`[KDP_ROYALTIES] ❌ Erreur traitement ligne ${i + 1}:`, error);
            errors.push(`Erreur ligne ${i + 1} de ${sheet.name}: ${error}`);
            errorRecords++;
          }
        }

        totalProcessed += sheet.data.length;
        processedSheets.push(sheet.name);
        
      } catch (error) {
        errors.push(`Erreur traitement onglet ${sheet.name}: ${error}`);
      }
    }

    console.log(`[KDP_ROYALTIES] RÉSUMÉ FINAL: ${newRecords} nouveaux records, ${duplicateRecords} duplicates, ${errorRecords} erreurs sur ${totalRows} lignes totales`);
    
    // Mise à jour finale du statut
    await storage.updateKdpImport(importId, {
      status: 'completed',
      progress: 100,
      processedRecords: newRecords, // Seulement les nouveaux records
      totalRecords: totalRows, // Total des lignes du fichier
      errorRecords,
      duplicateRecords,
      errorLog: errors
    });
    
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

    // Fonction helper pour convertir des valeurs numériques en tolérant "N/A"
    const parseNumericValue = (value: any): number => {
      if (!value || value === 'N/A' || value === '' || value === null || value === undefined) {
        return 0;
      }
      const parsed = parseFloat(String(value).replace(/[^\d.-]/g, ''));
      return isNaN(parsed) ? 0 : parsed;
    };

    const parseStringValue = (value: any): string => {
      if (!value || value === 'N/A' || value === null || value === undefined) {
        return '';
      }
      return String(value).trim();
    };

    // Mapping des champs communs
    const commonData = {
      importId,
      userId, 
      sheetName,
      rowIndex,
      rawData: { headers, row },
      
      // Champs communs avec gestion des "N/A"
      royaltyDate: parseStringValue(getColumnValue('Royalty Date')),
      title: parseStringValue(getColumnValue('Title')),
      authorName: parseStringValue(getColumnValue('Author Name')),
      marketplace: parseStringValue(getColumnValue('Marketplace')),
      royaltyType: parseStringValue(getColumnValue('Royalty Type')),
      transactionType: parseStringValue(getColumnValue('Transaction Type')), // Ce champ est obligatoire
      unitsSold: parseNumericValue(getColumnValue('Units Sold')).toString(),
      unitsRefunded: parseNumericValue(getColumnValue('Units Refunded')).toString(),
      netUnitsSold: parseNumericValue(getColumnValue('Net Units Sold')).toString(),
      avgListPriceWithoutTax: parseNumericValue(getColumnValuePartial('Avg. List Price')).toString(),
      avgOfferPriceWithoutTax: parseNumericValue(getColumnValuePartial('Avg. Offer Price')).toString(),
      royalty: parseNumericValue(getColumnValue('Royalty')).toString(),
      currency: parseStringValue(getColumnValue('Currency')),
    };

    // Mapping spécifique selon l'onglet avec gestion des "N/A"
    if (sheetName === 'eBook Royalty') {
      return {
        ...commonData,
        asin: parseStringValue(getColumnValue('ASIN')), // ASIN pour eBooks
        avgFileSizeMb: parseNumericValue(getColumnValuePartial('Avg. File Size')).toString(),
        avgDeliveryCost: parseNumericValue(getColumnValuePartial('Avg. Delivery Cost')).toString(),
      };
    } else if (sheetName === 'Combined Sales') {
      return {
        ...commonData,
        asin: parseStringValue(getColumnValue('ASIN/ISBN')), // Dans Combined Sales, c'est un ASIN
        avgDeliveryCost: parseNumericValue(getColumnValuePartial('Avg. Delivery')).toString(),
      };
    } else if (sheetName === 'Paperback Royalty' || sheetName === 'Hardcover Royalty') {
      return {
        ...commonData,
        isbn: parseStringValue(getColumnValue('ISBN')), // ISBN pour livres imprimés
        orderDate: parseStringValue(getColumnValue('Order Date')),
        avgManufacturingCost: parseNumericValue(getColumnValuePartial('Avg. Manufacturing Cost')).toString(),
      };
    }

    return {
      ...commonData,
      // Champs par défaut pour les cas non couverts
    } as InsertKdpRoyaltiesEstimatorData;
  }

  /**
   * Crée une clé unique pour identifier les doublons selon les 5 champs spécifiés
   */
  private static createUniqueKey(data: InsertKdpRoyaltiesEstimatorData): string {
    // Les 5 champs pour la déduplication
    const keyComponents = [
      data.royaltyDate || '',
      data.asin || data.isbn || '', // ASIN ou ISBN selon l'onglet
      data.marketplace || '',
      data.royaltyType || '',
      data.transactionType || ''
    ];
    
    return Buffer.from(keyComponents.join('|')).toString('base64').slice(0, 50);
  }
}