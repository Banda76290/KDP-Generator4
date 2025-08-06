import { db } from '../db';
import { masterBooks, kdpImportData } from '../../shared/schema';
import { eq, and, sql } from 'drizzle-orm';
import type { InsertMasterBook, MasterBook } from '../../shared/schema';
import { ExchangeRateService } from './exchangeRateService';

export class MasterBooksService {
  private static exchangeRateService?: ExchangeRateService;

  static async init() {
    this.exchangeRateService = new ExchangeRateService();
  }

  /**
   * Met à jour ou crée un enregistrement master book à partir des données d'import KDP
   */
  static async updateFromImportData(userId: string, importId: string): Promise<void> {
    console.log(`[MASTER_BOOKS] Début de la mise à jour pour l'import ${importId.slice(0, 8)}...`);

    // Récupérer toutes les données de cet import qui ont un ASIN
    const importData = await db.select()
      .from(kdpImportData)
      .where(and(
        eq(kdpImportData.importId, importId),
        eq(kdpImportData.userId, userId),
        sql`${kdpImportData.asin} IS NOT NULL AND ${kdpImportData.asin} != ''`
      ));

    console.log(`[MASTER_BOOKS] ${importData.length} enregistrements avec ASIN trouvés`);

    // Grouper par ASIN ET FORMAT pour gérer ebook/paperback/hardcover séparément
    const asinFormatGroups = new Map<string, typeof importData>();
    
    importData.forEach(record => {
      if (!record.asin) return;
      
      // Normaliser le format : utiliser 'ebook' par défaut pour les formats vides/inconnus
      let format = record.format;
      if (!format || format.trim() === '' || format === 'unknown') {
        format = 'ebook'; // Par défaut, supposer ebook pour les formats vides
      }
      
      const key = `${record.asin}|${format}`;
      
      if (!asinFormatGroups.has(key)) {
        asinFormatGroups.set(key, []);
      }
      asinFormatGroups.get(key)!.push(record);
    });

    console.log(`[MASTER_BOOKS] ${asinFormatGroups.size} combinaisons ASIN+Format trouvées`);

    let processed = 0;
    let updated = 0;

    // Traiter chaque combinaison ASIN+Format
    for (const [key, records] of Array.from(asinFormatGroups.entries())) {
      try {
        const [asin, format] = key.split('|');
        await this.processAsinFormatGroup(userId, asin, format, records, importId);
        processed++;
        updated++;
      } catch (error) {
        console.error(`[MASTER_BOOKS] Erreur pour ${key}:`, error);
        processed++;
      }
    }

    console.log(`[MASTER_BOOKS] Terminé : ${processed} ASIN traités, ${updated} mis à jour`);
  }

  /**
   * Traite un groupe de données pour une combinaison ASIN+Format spécifique
   */
  private static async processAsinFormatGroup(
    userId: string, 
    asin: string, 
    format: string,
    records: any[], 
    importId: string
  ): Promise<void> {
    // Obtenir le premier enregistrement pour les métadonnées de base
    const firstRecord = records[0];
    
    // Calculer les agrégations
    const aggregations = this.calculateAggregations(records);
    
    // Chercher un enregistrement master existant pour cette combinaison ASIN+Format
    const existingMaster = await db.select()
      .from(masterBooks)
      .where(and(
        eq(masterBooks.asin, asin),
        eq(masterBooks.format, format as any)
      ))
      .limit(1);

    if (existingMaster.length > 0) {
      // Mise à jour d'un enregistrement existant
      await this.updateExistingMaster(existingMaster[0], aggregations, importId);
    } else {
      // Création d'un nouvel enregistrement master
      await this.createNewMaster(userId, asin, format, firstRecord, aggregations, importId);
    }
  }

  /**
   * Calcule les agrégations pour un groupe d'enregistrements
   */
  private static calculateAggregations(records: any[]) {
    const aggregations = {
      totalUnitsSold: 0,
      totalUnitsRefunded: 0,
      netUnitsSold: 0,
      totalKenpRead: 0,
      firstSaleDate: null as Date | null,
      lastSaleDate: null as Date | null,
      totalRoyaltiesOriginal: {} as Record<string, number>,
      totalRoyaltiesUSD: 0,
      marketplaceBreakdown: {} as Record<string, any>,
      salesBreakdown: { book_sales: {}, kenp_reads: {} } as any,
      currentListPrice: null as number | null,
      currentOfferPrice: null as number | null,
      currentCurrency: null as string | null,
    };

    records.forEach(record => {
      // Agrégation des unités
      if (record.unitsSold) aggregations.totalUnitsSold += record.unitsSold;
      if (record.unitsRefunded) aggregations.totalUnitsRefunded += record.unitsRefunded;
      if (record.netUnitsSold) aggregations.netUnitsSold += record.netUnitsSold;
      if (record.kenpRead) aggregations.totalKenpRead += record.kenpRead;

      // Dates de vente (distinguer des dates de paiement)
      if (record.salesDate) {
        const saleDate = new Date(record.salesDate);
        if (!aggregations.firstSaleDate || saleDate < aggregations.firstSaleDate) {
          aggregations.firstSaleDate = saleDate;
        }
        if (!aggregations.lastSaleDate || saleDate > aggregations.lastSaleDate) {
          aggregations.lastSaleDate = saleDate;
        }
      }

      // Agrégation par devise
      if (record.royalty && record.currency) {
        if (!aggregations.totalRoyaltiesOriginal[record.currency]) {
          aggregations.totalRoyaltiesOriginal[record.currency] = 0;
        }
        aggregations.totalRoyaltiesOriginal[record.currency] += parseFloat(record.royalty);
      }

      // Agrégation par marketplace
      if (record.marketplace) {
        if (!aggregations.marketplaceBreakdown[record.marketplace]) {
          aggregations.marketplaceBreakdown[record.marketplace] = {
            unitsSold: 0,
            royalties: 0,
            currency: record.currency
          };
        }
        const marketplaceData = aggregations.marketplaceBreakdown[record.marketplace];
        if (record.unitsSold) marketplaceData.unitsSold += record.unitsSold;
        if (record.royalty) marketplaceData.royalties += parseFloat(record.royalty);
      }

      // Distinction ventes de livres vs pages lues
      const isKenpRead = record.kenpRead && record.kenpRead > 0;
      const salesType = isKenpRead ? 'kenp_reads' : 'book_sales';
      
      if (!aggregations.salesBreakdown[salesType][record.currency]) {
        aggregations.salesBreakdown[salesType][record.currency] = {
          units: isKenpRead ? record.kenpRead : (record.unitsSold || 0),
          royalties: parseFloat(record.royalty || 0)
        };
      } else {
        aggregations.salesBreakdown[salesType][record.currency].units += 
          isKenpRead ? (record.kenpRead || 0) : (record.unitsSold || 0);
        aggregations.salesBreakdown[salesType][record.currency].royalties += 
          parseFloat(record.royalty || 0);
      }

      // Prix actuels (prendre les plus récents)
      if (record.listPrice) {
        aggregations.currentListPrice = parseFloat(record.listPrice);
        aggregations.currentCurrency = record.currency;
      }
      if (record.offerPrice) {
        aggregations.currentOfferPrice = parseFloat(record.offerPrice);
      }
    });

    return aggregations;
  }

  /**
   * Calcule le total USD en convertissant toutes les devises
   */
  private static async calculateTotalUSD(royaltiesOriginal: Record<string, number>): Promise<number> {
    let totalUSD = 0;

    for (const [currency, amount] of Object.entries(royaltiesOriginal)) {
      if (currency === 'USD') {
        totalUSD += amount;
      } else if (this.exchangeRateService) {
        try {
          const rate = await this.exchangeRateService.getExchangeRate(currency, 'USD');
          if (rate && rate > 0) {
            totalUSD += amount * rate;
          }
        } catch (error) {
          console.warn(`[MASTER_BOOKS] Conversion échouée ${currency} -> USD:`, error);
        }
      }
    }

    return totalUSD;
  }

  /**
   * Met à jour un enregistrement master existant
   */
  private static async updateExistingMaster(
    existingMaster: MasterBook,
    aggregations: any,
    importId: string
  ): Promise<void> {
    // Fusionner les données existantes avec les nouvelles
    const mergedRoyaltiesOriginal = { ...existingMaster.totalRoyaltiesOriginal as any };
    
    for (const [currency, amount] of Object.entries(aggregations.totalRoyaltiesOriginal)) {
      if (mergedRoyaltiesOriginal[currency]) {
        mergedRoyaltiesOriginal[currency] += amount as number;
      } else {
        mergedRoyaltiesOriginal[currency] = amount as number;
      }
    }

    const totalRoyaltiesUSD = await this.calculateTotalUSD(mergedRoyaltiesOriginal);

    // Fusionner les source import IDs
    const sourceImportIds = [...(existingMaster.sourceImportIds || [])];
    if (!sourceImportIds.includes(importId)) {
      sourceImportIds.push(importId);
    }

    await db.update(masterBooks)
      .set({
        totalUnitsSold: (existingMaster.totalUnitsSold || 0) + aggregations.totalUnitsSold,
        totalUnitsRefunded: (existingMaster.totalUnitsRefunded || 0) + aggregations.totalUnitsRefunded,
        netUnitsSold: (existingMaster.netUnitsSold || 0) + aggregations.netUnitsSold,
        totalKenpRead: (existingMaster.totalKenpRead || 0) + aggregations.totalKenpRead,
        firstSaleDate: aggregations.firstSaleDate && (!existingMaster.firstSaleDate || 
          aggregations.firstSaleDate < new Date(existingMaster.firstSaleDate)) 
          ? aggregations.firstSaleDate.toISOString().split('T')[0]
          : existingMaster.firstSaleDate,
        lastSaleDate: aggregations.lastSaleDate && (!existingMaster.lastSaleDate || 
          aggregations.lastSaleDate > new Date(existingMaster.lastSaleDate))
          ? aggregations.lastSaleDate.toISOString().split('T')[0] 
          : existingMaster.lastSaleDate,
        totalRoyaltiesOriginal: mergedRoyaltiesOriginal,
        totalRoyaltiesUSD: totalRoyaltiesUSD.toString(),
        marketplaceBreakdown: aggregations.marketplaceBreakdown,
        salesBreakdown: aggregations.salesBreakdown,
        currentListPrice: aggregations.currentListPrice?.toString(),
        currentOfferPrice: aggregations.currentOfferPrice?.toString(),
        currentCurrency: aggregations.currentCurrency,
        lastImportDate: new Date().toISOString().split('T')[0],
        sourceImportIds: sourceImportIds,
        updatedAt: new Date(),
      })
      .where(eq(masterBooks.id, existingMaster.id));
  }

  /**
   * Crée un nouvel enregistrement master
   */
  private static async createNewMaster(
    userId: string,
    asin: string,
    format: string,
    firstRecord: any,
    aggregations: any,
    importId: string
  ): Promise<void> {
    const totalRoyaltiesUSD = await this.calculateTotalUSD(aggregations.totalRoyaltiesOriginal);

    const newMasterBook: InsertMasterBook = {
      userId,
      asin,
      isbn: firstRecord.isbn,
      title: firstRecord.title,
      format: format as any,
      authorName: firstRecord.authorName,
      firstSaleDate: aggregations.firstSaleDate?.toISOString().split('T')[0],
      lastSaleDate: aggregations.lastSaleDate?.toISOString().split('T')[0],
      totalUnitsSold: aggregations.totalUnitsSold,
      totalUnitsRefunded: aggregations.totalUnitsRefunded,
      netUnitsSold: aggregations.netUnitsSold,
      totalKenpRead: aggregations.totalKenpRead,
      totalRoyaltiesOriginal: aggregations.totalRoyaltiesOriginal,
      totalRoyaltiesUSD: totalRoyaltiesUSD.toString(),
      marketplaceBreakdown: aggregations.marketplaceBreakdown,
      salesBreakdown: aggregations.salesBreakdown,
      currentListPrice: aggregations.currentListPrice?.toString(),
      currentOfferPrice: aggregations.currentOfferPrice?.toString(),
      currentCurrency: aggregations.currentCurrency,
      lastImportDate: new Date().toISOString().split('T')[0],
      sourceImportIds: [importId],
    };

    await db.insert(masterBooks).values(newMasterBook);
  }

  /**
   * Récupère tous les master books pour un utilisateur
   */
  static async getMasterBooksForUser(userId: string): Promise<MasterBook[]> {
    return db.select()
      .from(masterBooks)
      .where(eq(masterBooks.userId, userId))
      .orderBy(sql`${masterBooks.totalRoyaltiesUSD} DESC`);
  }

  /**
   * Récupère un master book par ASIN
   */
  static async getMasterBookByAsin(asin: string): Promise<MasterBook | null> {
    const result = await db.select()
      .from(masterBooks)
      .where(eq(masterBooks.asin, asin))
      .limit(1);
    
    return result[0] || null;
  }
}