import { db } from '../db';
import { 
  kdpImportData, 
  marketplaces, 
  bookIdentifiers, 
  productVariants, 
  salesEvents,
  kenpReads,
  books,
  kdpImports
} from '@shared/schema';
import { eq, and, isNull, desc, sql, inArray } from 'drizzle-orm';

/**
 * Service for analytics using the normalized schema
 * This service preserves original currency amounts and handles proper temporal accumulation
 */
export class AnalyticsNormalizedService {
  
  /**
   * Get marketplace mapping for normalization
   */
  private async getOrCreateMarketplace(rawName: string) {
    // Try to find existing marketplace
    const [existing] = await db
      .select()
      .from(marketplaces)
      .where(eq(marketplaces.rawName, rawName))
      .limit(1);
    
    if (existing) return existing;

    // Create new marketplace with intelligent mapping
    const marketplaceData = this.parseMarketplace(rawName);
    
    const [created] = await db
      .insert(marketplaces)
      .values(marketplaceData)
      .returning();
      
    return created;
  }

  /**
   * Parse marketplace raw name to extract code, country, currency
   */
  private parseMarketplace(rawName: string) {
    const marketplaceMap: Record<string, { code: string; country: string; currency: string; languageHint: string }> = {
      'Amazon.com': { code: 'US', country: 'United States', currency: 'USD', languageHint: 'en' },
      'Amazon.co.uk': { code: 'UK', country: 'United Kingdom', currency: 'GBP', languageHint: 'en' },
      'Amazon.de': { code: 'DE', country: 'Germany', currency: 'EUR', languageHint: 'de' },
      'Amazon.fr': { code: 'FR', country: 'France', currency: 'EUR', languageHint: 'fr' },
      'Amazon.es': { code: 'ES', country: 'Spain', currency: 'EUR', languageHint: 'es' },
      'Amazon.it': { code: 'IT', country: 'Italy', currency: 'EUR', languageHint: 'it' },
      'Amazon.ca': { code: 'CA', country: 'Canada', currency: 'CAD', languageHint: 'en' },
      'Amazon.com.au': { code: 'AU', country: 'Australia', currency: 'AUD', languageHint: 'en' },
      'Amazon.co.jp': { code: 'JP', country: 'Japan', currency: 'JPY', languageHint: 'ja' },
      'Amazon.com.br': { code: 'BR', country: 'Brazil', currency: 'BRL', languageHint: 'pt' },
      'Amazon.in': { code: 'IN', country: 'India', currency: 'INR', languageHint: 'en' },
      'Amazon.com.mx': { code: 'MX', country: 'Mexico', currency: 'MXN', languageHint: 'es' },
      'Amazon.nl': { code: 'NL', country: 'Netherlands', currency: 'EUR', languageHint: 'nl' },
    };

    const mapped = marketplaceMap[rawName];
    if (mapped) {
      return {
        rawName,
        ...mapped,
      };
    }

    // Default fallback for unknown marketplaces
    return {
      rawName,
      code: rawName.split('.').pop()?.toUpperCase() || 'XX',
      country: rawName,
      currency: 'USD',  // Default currency
      languageHint: 'en',
    };
  }

  /**
   * Determine if identifier is ASIN or ISBN
   */
  private identifyIdentifierType(value: string): 'ASIN' | 'ISBN' {
    if (!value) return 'ASIN';
    
    // ISBN patterns (10 or 13 digits, may include hyphens)
    const isbn10Pattern = /^(?:\d{9}[\dX]|\d{1,5}-\d{1,7}-\d{1,7}-[\dX])$/;
    const isbn13Pattern = /^(?:978|979)\d{10}$|^(?:978|979)-\d{1,5}-\d{1,7}-\d{1,7}-\d$/;
    
    const cleanValue = value.replace(/-/g, '');
    
    if (isbn13Pattern.test(value) || (cleanValue.length === 13 && /^(978|979)/.test(cleanValue))) {
      return 'ISBN';
    }
    
    if (isbn10Pattern.test(value) || (cleanValue.length === 10)) {
      return 'ISBN';
    }
    
    // ASIN pattern (usually 10 alphanumeric characters, often starting with B0)
    if (/^[A-Z0-9]{10}$/.test(value) || value.startsWith('B0')) {
      return 'ASIN';
    }
    
    // Default to ASIN for Amazon-like identifiers
    return 'ASIN';
  }

  /**
   * Get or create book variant
   */
  private async getOrCreateVariant(
    bookId: string, 
    format: string, 
    marketplaceId: string, 
    asin?: string, 
    isbn?: string
  ) {
    // Try to find existing variant
    const [existing] = await db
      .select()
      .from(productVariants)
      .where(and(
        eq(productVariants.bookId, bookId),
        eq(productVariants.format, format as any),
        eq(productVariants.marketplaceId, marketplaceId)
      ))
      .limit(1);
    
    if (existing) return existing;

    // Create new variant
    const [created] = await db
      .insert(productVariants)
      .values({
        bookId,
        format: format as any,
        marketplaceId,
        asin,
        isbn,
        isActive: true,
      })
      .returning();
      
    return created;
  }

  /**
   * Migrate legacy data to normalized structure
   * This preserves original amounts and properly handles temporal data
   */
  async migrateLegacyData(userId: string) {
    console.log(`[ANALYTICS] Starting migration to normalized structure for user: ${userId}...`);
    
    // Get all legacy import data excluding payments (cumulative data)
    const legacyData = await db
      .select({
        importData: kdpImportData,
        import: kdpImports,
      })
      .from(kdpImportData)
      .innerJoin(kdpImports, eq(kdpImportData.importId, kdpImports.id))
      .where(and(
        eq(kdpImportData.userId, userId),
        eq(kdpImportData.isDuplicate, false),
        // Exclude payments files - they contain cumulative historical data
        sql`${kdpImports.detectedType} != 'payments'`
      ))
      .orderBy(desc(kdpImportData.createdAt));

    console.log(`[ANALYTICS] Found ${legacyData.length} legacy records to migrate`);
    
    if (legacyData.length === 0) {
      console.log('[ANALYTICS] No legacy data found - checking available data...');
      
      // Debug: Check what's available
      const allImports = await db
        .select()
        .from(kdpImports)
        .limit(5);
      console.log(`[ANALYTICS] Found ${allImports.length} imports for user ${userId}`, allImports.map(i => ({ id: i.id, type: i.detectedType, fileName: i.fileName })));
      
      const allImportData = await db
        .select()
        .from(kdpImportData)
        .where(eq(kdpImportData.userId, userId))
        .limit(5);
      console.log(`[ANALYTICS] Found ${allImportData.length} import data records for user`, allImportData.map(d => ({ royalty: d.royalty, currency: d.currency, marketplace: d.marketplace })));
      
      return { migratedCount: 0, skippedCount: 0 };
    }

    let migratedCount = 0;
    let skippedCount = 0;

    for (const { importData, import: importRecord } of legacyData) {
      try {
        // Skip records without royalty data
        if (!importData.royalty || parseFloat(importData.royalty) === 0) {
          skippedCount++;
          continue;
        }

        // Get or create marketplace
        const marketplace = await this.getOrCreateMarketplace(importData.marketplace || 'Amazon.com');
        
        // Create book identifiers if we have ASIN or ISBN
        const identifiers = [];
        if (importData.asin) {
          identifiers.push({
            type: this.identifyIdentifierType(importData.asin),
            value: importData.asin,
            marketplaceId: marketplace.id,
          });
        }
        if (importData.isbn && importData.isbn !== importData.asin) {
          identifiers.push({
            type: this.identifyIdentifierType(importData.isbn),
            value: importData.isbn,
            marketplaceId: marketplace.id,
          });
        }

        // Create book if needed (try to find existing first)
        let book;
        if (importData.matchedBookId) {
          [book] = await db
            .select()
            .from(books)
            .where(eq(books.id, importData.matchedBookId))
            .limit(1);
        }

        if (!book && (importData.asin || importData.isbn)) {
          // Try to find book by ASIN/ISBN
          const existingIdentifier = await db
            .select({ bookId: bookIdentifiers.bookId })
            .from(bookIdentifiers)
            .where(
              inArray(bookIdentifiers.value, [importData.asin, importData.isbn].filter(Boolean) as string[])
            )
            .limit(1);

          if (existingIdentifier.length > 0) {
            [book] = await db
              .select()
              .from(books)
              .where(eq(books.id, existingIdentifier[0].bookId!))
              .limit(1);
          }
        }

        if (!book) {
          // Create new book
          [book] = await db
            .insert(books)
            .values({
              userId,
              title: importData.title || 'Unknown Title',
              language: this.detectLanguage(importData.title || ''),
              format: (importData.format || 'ebook') as any,
            })
            .returning();

          // Add identifiers to the new book
          for (const identifier of identifiers) {
            await db
              .insert(bookIdentifiers)
              .values({
                bookId: book.id,
                ...identifier,
              })
              .onConflictDoNothing();
          }
        }

        // Get or create product variant
        const variant = await this.getOrCreateVariant(
          book.id,
          importData.format || 'ebook',
          marketplace.id,
          importData.asin || undefined,
          importData.isbn || undefined
        );

        // Extract reporting period from import metadata or date
        const reportingPeriod = this.extractReportingPeriod(importRecord, importData);

        // Create sales event with PRESERVED ORIGINAL AMOUNTS
        if (importRecord.detectedType === 'kenp_read' && importData.kenpRead) {
          // KENP Read event
          await db
            .insert(kenpReads)
            .values({
              variantId: variant.id,
              importId: importRecord.id,
              userId,
              readDate: importData.salesDate,
              reportingPeriod,
              kenpPages: importData.kenpRead,
              originalCurrency: importData.currency || 'USD',
              originalRoyalty: importData.royalty,
              sourceType: importRecord.detectedType,
              isDuplicate: false,
            })
            .onConflictDoNothing();
        } else {
          // Sales event
          await db
            .insert(salesEvents)
            .values({
              variantId: variant.id,
              importId: importRecord.id,
              userId,
              eventDate: importData.salesDate,
              reportingPeriod,
              unitsSold: importData.unitsSold || 0,
              unitsRefunded: importData.unitsRefunded || 0,
              netUnitsSold: importData.netUnitsSold || 0,
              originalCurrency: importData.currency || 'USD',
              originalRoyalty: importData.royalty,
              originalListPrice: importData.listPrice,
              originalOfferPrice: importData.offerPrice,
              deliveryCost: importData.deliveryCost,
              manufacturingCost: importData.manufacturingCost,
              royaltyRate: importData.royaltyRate,
              transactionType: importData.transactionType,
              fileSize: importData.fileSize,
              sourceType: importRecord.detectedType,
              sheetName: importData.sheetName,
              rowIndex: importData.rowIndex,
              isDuplicate: false,
            })
            .onConflictDoNothing();
        }

        migratedCount++;
      } catch (error) {
        console.error(`[ANALYTICS] Error migrating record ${importData.id}:`, error);
        skippedCount++;
      }
    }

    console.log(`[ANALYTICS] Migration completed: ${migratedCount} migrated, ${skippedCount} skipped`);
    return { migratedCount, skippedCount };
  }

  /**
   * Extract reporting period from import data
   */
  private extractReportingPeriod(importRecord: any, importData: any): string {
    // Try to extract from filename
    const fileName = importRecord.fileName || '';
    const dateMatch = fileName.match(/(\d{4}-\d{2})/);
    if (dateMatch) {
      return dateMatch[1];
    }

    // Try to extract from sales date
    if (importData.salesDate) {
      const date = new Date(importData.salesDate);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }

    // Default to current period
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  /**
   * Simple language detection from title
   */
  private detectLanguage(title: string): string {
    if (!title) return 'en';
    
    // German indicators
    if (/\b(ein|eine|der|die|das|mit|und|zu|für|von|über|buch|schreibt?en?)\b/i.test(title)) {
      return 'de';
    }
    
    // French indicators
    if (/\b(un|une|le|la|les|avec|et|pour|de|du|sur|livre|écrire?)\b/i.test(title)) {
      return 'fr';
    }
    
    // Spanish indicators
    if (/\b(un|una|el|la|los|con|y|para|de|del|sobre|libro|escribir?)\b/i.test(title)) {
      return 'es';
    }
    
    // Italian indicators
    if (/\b(un|una|il|la|gli|con|e|per|di|del|su|libro|scrivere?)\b/i.test(title)) {
      return 'it';
    }
    
    // Portuguese indicators
    if (/\b(um|uma|o|a|os|com|e|para|de|do|sobre|livro|escrever?)\b/i.test(title)) {
      return 'pt';
    }
    
    // Default to English
    return 'en';
  }

  /**
   * Get analytics overview using normalized data with preserved original amounts
   */
  async getAnalyticsOverview(userId: string) {
    console.log('[ANALYTICS] Generating overview from normalized data...');

    // Get total statistics
    const totals = await db
      .select({
        totalRecords: sql<number>`count(*)`,
        totalRoyalties: sql<number>`sum(${salesEvents.originalRoyalty})`,
        uniqueBooks: sql<number>`count(distinct ${productVariants.bookId})`,
        uniqueMarketplaces: sql<number>`count(distinct ${productVariants.marketplaceId})`,
      })
      .from(salesEvents)
      .innerJoin(productVariants, eq(salesEvents.variantId, productVariants.id))
      .where(and(
        eq(salesEvents.userId, userId),
        eq(salesEvents.isDuplicate, false)
      ));

    // Get royalties by currency (preserved original amounts)
    const royaltiesByCurrency = await db
      .select({
        currency: salesEvents.originalCurrency,
        amount: sql<number>`sum(${salesEvents.originalRoyalty})`,
        transactions: sql<number>`count(*)`,
      })
      .from(salesEvents)
      .where(and(
        eq(salesEvents.userId, userId),
        eq(salesEvents.isDuplicate, false)
      ))
      .groupBy(salesEvents.originalCurrency)
      .orderBy(desc(sql`sum(${salesEvents.originalRoyalty})`));

    return {
      totalRecords: totals[0]?.totalRecords || 0,
      totalRoyalties: totals[0]?.totalRoyalties || 0,
      uniqueBooks: totals[0]?.uniqueBooks || 0,
      uniqueMarketplaces: totals[0]?.uniqueMarketplaces || 0,
      royaltiesByCurrency: royaltiesByCurrency.map(row => ({
        currency: row.currency,
        originalAmount: row.amount,
        originalCurrency: row.currency,
        transactions: row.transactions,
      })),
    };
  }

  /**
   * Get top performing books by original revenue
   */
  async getTopPerformers(userId: string, limit: number = 10) {
    return await db
      .select({
        title: books.title,
        format: productVariants.format,
        totalRevenue: sql<number>`sum(${salesEvents.originalRoyalty})`,
        currency: salesEvents.originalCurrency,
        totalSales: sql<number>`sum(${salesEvents.unitsSold})`,
        marketplaces: sql<number>`count(distinct ${productVariants.marketplaceId})`,
      })
      .from(salesEvents)
      .innerJoin(productVariants, eq(salesEvents.variantId, productVariants.id))
      .innerJoin(books, eq(productVariants.bookId, books.id))
      .where(and(
        eq(salesEvents.userId, userId),
        eq(salesEvents.isDuplicate, false)
      ))
      .groupBy(books.id, books.title, productVariants.format, salesEvents.originalCurrency)
      .orderBy(desc(sql`sum(${salesEvents.originalRoyalty})`))
      .limit(limit);
  }

  /**
   * Get marketplace breakdown with preserved original amounts
   */
  async getMarketplaceBreakdown(userId: string) {
    return await db
      .select({
        marketplace: marketplaces.rawName,
        code: marketplaces.code,
        revenue: sql<number>`sum(${salesEvents.originalRoyalty})`,
        currency: salesEvents.originalCurrency,
        transactions: sql<number>`count(*)`,
        books: sql<number>`count(distinct ${productVariants.bookId})`,
      })
      .from(salesEvents)
      .innerJoin(productVariants, eq(salesEvents.variantId, productVariants.id))
      .innerJoin(marketplaces, eq(productVariants.marketplaceId, marketplaces.id))
      .where(and(
        eq(salesEvents.userId, userId),
        eq(salesEvents.isDuplicate, false)
      ))
      .groupBy(marketplaces.id, marketplaces.rawName, marketplaces.code, salesEvents.originalCurrency)
      .orderBy(desc(sql`sum(${salesEvents.originalRoyalty})`));
  }
}

export const analyticsNormalizedService = new AnalyticsNormalizedService();