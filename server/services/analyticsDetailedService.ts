import { db } from '../db';
import { kdpImportData, kdpImports } from '@shared/schema';
import { eq, and, sql, inArray } from 'drizzle-orm';

/**
 * Service for detailed analytics using the correct method from KDP_Royalties_Estimator
 * This service extracts data from the detailed sheets (ebook, paperback, hardcover)
 * and preserves original currency amounts without conversion
 */
export class AnalyticsDetailedService {

  /**
   * Get detailed royalties by currency from KDP_Royalties_Estimator sheets
   * This follows the exact method used by the advanced AI system
   */
  async getDetailedRoyaltiesByCurrency(userId: string) {
    console.log('[ANALYTICS-DETAILED] Extracting royalties from detailed sheets...');

    // Extract data from the three detailed royalty sheets
    const detailedSheets = ['eBook Royalty', 'Paperback Royalty', 'Hardcover Royalty'];
    
    const royaltiesData = await db
      .select({
        sheetName: kdpImportData.sheetName,
        currency: kdpImportData.currency,
        royalty: kdpImportData.royalty,
        title: kdpImportData.title,
        marketplace: kdpImportData.marketplace,
        asin: kdpImportData.asin,
      })
      .from(kdpImportData)
      .innerJoin(kdpImports, eq(kdpImportData.importId, kdpImports.id))
      .where(and(
        eq(kdpImportData.userId, userId),
        sql`${kdpImports.fileName} LIKE '%Royalties_Estimator%'`,
        inArray(kdpImportData.sheetName, detailedSheets)
      ));

    console.log(`[ANALYTICS-DETAILED] Found ${royaltiesData.length} detailed royalty records`);

    // Group by currency and sum up royalties (preserving original amounts)
    const royaltiesByCurrency = new Map<string, {
      currency: string;
      totalRoyalty: number;
      transactionCount: number;
      formats: Set<string>;
      books: Set<string>;
    }>();

    for (const record of royaltiesData) {
      const currency = record.currency || 'USD';
      const royalty = parseFloat(record.royalty || '0');
      
      if (royalty === 0) continue;

      if (!royaltiesByCurrency.has(currency)) {
        royaltiesByCurrency.set(currency, {
          currency,
          totalRoyalty: 0,
          transactionCount: 0,
          formats: new Set(),
          books: new Set(),
        });
      }

      const currencyData = royaltiesByCurrency.get(currency)!;
      currencyData.totalRoyalty += royalty;
      currencyData.transactionCount += 1;
      currencyData.formats.add(record.sheetName || 'Unknown');
      currencyData.books.add(record.title || 'Unknown Title');
    }

    // Convert to array and sort by total royalty descending
    const result = Array.from(royaltiesByCurrency.values())
      .map(data => ({
        currency: data.currency,
        totalRoyalty: data.totalRoyalty,
        transactionCount: data.transactionCount,
        formatsCount: data.formats.size,
        booksCount: data.books.size,
        formats: Array.from(data.formats),
      }))
      .sort((a, b) => b.totalRoyalty - a.totalRoyalty);

    return result;
  }

  /**
   * Get total royalties in EUR using current exchange rates
   */
  async getTotalRoyaltiesInEUR(userId: string) {
    const royaltiesByCurrency = await this.getDetailedRoyaltiesByCurrency(userId);
    
    // BCE exchange rates (1 EUR = X foreign currency) as of August 1, 2025
    const exchangeRates: Record<string, number> = {
      'EUR': 1.0000,
      'JPY': 171.61,
      'USD': 1.1404,
      'GBP': 0.8665,
      'CAD': 1.5822,
      'AUD': 1.7756,
      'INR': 99.79,
      'MXN': 21.6158,
      'BRL': 6.4129,
    };

    let totalInEUR = 0;
    const conversions = [];

    for (const currencyData of royaltiesByCurrency) {
      const rate = exchangeRates[currencyData.currency];
      let amountInEUR = 0;

      if (rate) {
        // Convert: amount in foreign currency / rate = amount in EUR
        amountInEUR = currencyData.totalRoyalty / rate;
        totalInEUR += amountInEUR;
      } else {
        console.warn(`[ANALYTICS-DETAILED] No exchange rate found for ${currencyData.currency}`);
        // Fallback: assume 1:1 with EUR (should not happen with proper data)
        amountInEUR = currencyData.totalRoyalty;
        totalInEUR += amountInEUR;
      }

      conversions.push({
        currency: currencyData.currency,
        originalAmount: currencyData.totalRoyalty,
        exchangeRate: rate || 1,
        amountInEUR: Math.round(amountInEUR * 100) / 100, // Round to 2 decimals
        transactionCount: currencyData.transactionCount,
        formatsCount: currencyData.formatsCount,
        booksCount: currencyData.booksCount,
      });
    }

    return {
      totalInEUR: Math.round(totalInEUR * 100) / 100,
      conversions,
      totalCurrencies: royaltiesByCurrency.length,
      totalTransactions: royaltiesByCurrency.reduce((sum, c) => sum + c.transactionCount, 0),
    };
  }

  /**
   * Get overview using the detailed method (like the advanced AI)
   */
  async getDetailedAnalyticsOverview(userId: string) {
    console.log('[ANALYTICS-DETAILED] Generating detailed analytics overview...');

    const royaltiesByCurrency = await this.getDetailedRoyaltiesByCurrency(userId);
    const totalInEUR = await this.getTotalRoyaltiesInEUR(userId);

    // Get additional stats
    const stats = await db
      .select({
        totalRecords: sql<number>`COUNT(*)`,
        uniqueBooks: sql<number>`COUNT(DISTINCT ${kdpImportData.title})`,
        uniqueMarketplaces: sql<number>`COUNT(DISTINCT ${kdpImportData.marketplace})`,
        uniqueFormats: sql<number>`COUNT(DISTINCT ${kdpImportData.sheetName})`,
      })
      .from(kdpImportData)
      .innerJoin(kdpImports, eq(kdpImportData.importId, kdpImports.id))
      .where(and(
        eq(kdpImportData.userId, userId),
        sql`${kdpImports.fileName} LIKE '%Royalties_Estimator%'`,
        inArray(kdpImportData.sheetName, ['eBook Royalty', 'Paperback Royalty', 'Hardcover Royalty'])
      ));

    return {
      method: 'detailed_sheets_extraction',
      description: 'Extraction directe des onglets détaillés (eBook, Paperback, Hardcover)',
      totalRecords: stats[0]?.totalRecords || 0,
      uniqueBooks: stats[0]?.uniqueBooks || 0,
      uniqueMarketplaces: stats[0]?.uniqueMarketplaces || 0,
      uniqueFormats: stats[0]?.uniqueFormats || 0,
      royaltiesByCurrency,
      totalInEUR: totalInEUR.totalInEUR,
      conversions: totalInEUR.conversions,
      totalCurrencies: totalInEUR.totalCurrencies,
      totalTransactions: totalInEUR.totalTransactions,
    };
  }
}

export const analyticsDetailedService = new AnalyticsDetailedService();