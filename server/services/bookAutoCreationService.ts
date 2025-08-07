import { storage } from '../storage';
import type { InsertBook, InsertAuthor, SelectKdpRoyaltiesEstimatorData } from '@shared/schema';
import { nanoid } from 'nanoid';

export interface BookCreationResult {
  booksCreated: number;
  booksUpdated: number;
  authorsCreated: number;
  authorsUpdated: number;
  errors: string[];
  skipped: number; // Books without ASIN/ISBN
}

export interface AutoCreationOptions {
  updateExistingBooks: boolean;
  updateExistingSalesData: boolean;
}

export class BookAutoCreationService {
  /**
   * Parse author name: first term = firstName, last term = lastName
   */
  static parseAuthorName(authorName: string): { firstName: string; lastName: string } {
    if (!authorName || authorName.trim() === '') {
      return { firstName: '', lastName: '' };
    }
    
    const nameParts = authorName.trim().split(/\s+/);
    
    if (nameParts.length === 1) {
      // Single name - use as firstName
      return { firstName: nameParts[0], lastName: '' };
    }
    
    // First term = firstName, last term = lastName
    const firstName = nameParts[0];
    const lastName = nameParts[nameParts.length - 1];
    
    return { firstName, lastName };
  }

  /**
   * Extract format from sheet name
   */
  static extractFormatFromSheet(sheetName: string): 'ebook' | 'paperback' | 'hardcover' {
    const sheetLower = sheetName.toLowerCase();
    
    if (sheetLower.includes('ebook')) {
      return 'ebook';
    } else if (sheetLower.includes('paperback')) {
      return 'paperback';
    } else if (sheetLower.includes('hardcover')) {
      return 'hardcover';
    }
    
    // Default fallback based on common patterns
    if (sheetLower.includes('kindle') || sheetLower.includes('digital')) {
      return 'ebook';
    }
    
    return 'ebook'; // Default to ebook
  }

  /**
   * Find or create author
   */
  static async findOrCreateAuthor(
    userId: string, 
    authorName: string, 
    updateExisting: boolean = false
  ): Promise<{ authorId: string; created: boolean; updated: boolean }> {
    if (!authorName || authorName.trim() === '') {
      throw new Error('Author name is required');
    }

    const { firstName, lastName } = this.parseAuthorName(authorName);
    
    if (!firstName && !lastName) {
      throw new Error('Unable to parse author name');
    }

    // For now, we'll skip author creation/updating - focus on books only
    // TODO: Implement proper author finding and creation
    throw new Error('Author creation not yet implemented in this version');
  }

  /**
   * Process KDP Royalties Estimator data to create/update books
   */
  static async processKdpRoyaltiesForBooks(
    userId: string,
    importId: string,
    options: AutoCreationOptions
  ): Promise<BookCreationResult> {
    const result: BookCreationResult = {
      booksCreated: 0,
      booksUpdated: 0,
      authorsCreated: 0,
      authorsUpdated: 0,
      errors: [],
      skipped: 0
    };

    try {
      // Get all KDP royalties data for this import
      const royaltiesData = await storage.getKdpRoyaltiesEstimatorData(importId);
      
      // Group by unique book identifier (ASIN or ISBN)
      const bookGroups = new Map<string, SelectKdpRoyaltiesEstimatorData[]>();
      
      for (const record of royaltiesData) {
        // Skip if no ASIN and no ISBN
        if (!record.asin && !record.isbn) {
          result.skipped++;
          continue;
        }
        
        // Use ASIN as primary identifier, fallback to ISBN
        const bookId = record.asin || record.isbn;
        if (!bookId) continue;
        
        if (!bookGroups.has(bookId)) {
          bookGroups.set(bookId, []);
        }
        bookGroups.get(bookId)!.push(record);
      }

      // Process each unique book
      for (const [bookIdentifier, records] of Array.from(bookGroups.entries())) {
        try {
          // Use the first record as primary data source
          const primaryRecord = records[0];
          
          if (!primaryRecord.title || !primaryRecord.authorName) {
            result.errors.push(`Book ${bookIdentifier}: Missing title or author name`);
            continue;
          }

          // Determine format from sheet name
          const format = this.extractFormatFromSheet(primaryRecord.sheetName || '');
          
          // Check if book already exists (by ASIN or ISBN + userId)
          const existingBook = await storage.findBookByAsinOrIsbn(
            userId, 
            primaryRecord.asin || undefined, 
            primaryRecord.isbn || undefined
          );

          if (existingBook) {
            if (options.updateExistingBooks) {
              // Update existing book
              const { firstName, lastName } = this.parseAuthorName(primaryRecord.authorName);
              
              const updateData: Partial<InsertBook> = {
                title: primaryRecord.title,
                authorFirstName: firstName,
                authorLastName: lastName,
                primaryMarketplace: primaryRecord.marketplace || undefined,
                format,
                // Update ASIN/ISBN if missing
                asin: existingBook.asin || primaryRecord.asin || undefined,
                isbn: existingBook.isbn || primaryRecord.isbn || undefined,
              };

              await storage.updateBook(existingBook.id, userId, updateData);
              result.booksUpdated++;
            }
            // If not updating, just count as processed (no action taken)
          } else {
            // Create new book
            const { firstName, lastName } = this.parseAuthorName(primaryRecord.authorName);
            
            const newBook: InsertBook = {
              userId,
              title: primaryRecord.title,
              authorFirstName: firstName,
              authorLastName: lastName,
              format,
              asin: primaryRecord.asin || undefined,
              isbn: primaryRecord.isbn || undefined,
              primaryMarketplace: primaryRecord.marketplace || 'Amazon.com',
              status: 'published', // Assume published since we have sales data
              publishingRights: 'owned',
              hasExplicitContent: false,
              previouslyPublished: false,
              releaseOption: 'immediate',
              useAI: false,
              language: 'English' // Default, could be enhanced later
            };

            await storage.createBook(newBook);
            result.booksCreated++;
          }

        } catch (bookError) {
          result.errors.push(`Book ${bookIdentifier}: ${bookError instanceof Error ? bookError.message : 'Unknown error'}`);
        }
      }

      return result;

    } catch (error) {
      result.errors.push(`General processing error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return result;
    }
  }

  /**
   * Generate preview of what will be imported/updated
   */
  static async generateImportPreview(
    userId: string,
    importId: string
  ): Promise<{
    totalBooks: number;
    existingBooks: number;
    newBooks: number;
    booksWithoutId: number;
    totalSalesData: number;
    duplicateSalesData: number;
    missingAuthorData: number;
  }> {
    try {
      const royaltiesData = await storage.getKdpRoyaltiesEstimatorData(importId);
      
      // Group by unique book identifier
      const bookIdentifiers = new Set<string>();
      let booksWithoutId = 0;
      let missingAuthorData = 0;
      
      for (const record of royaltiesData) {
        if (!record.asin && !record.isbn) {
          booksWithoutId++;
          continue;
        }
        
        const bookId = record.asin || record.isbn;
        if (bookId) {
          bookIdentifiers.add(bookId);
        }
        
        if (!record.authorName || record.authorName.trim() === '') {
          missingAuthorData++;
        }
      }

      // Check which books already exist
      let existingBooks = 0;
      for (const identifier of Array.from(bookIdentifiers)) {
        // Try to find by ASIN first, then ISBN
        let existingBook;
        if (identifier.length === 10 || identifier.toUpperCase().startsWith('B0')) {
          // Likely ASIN
          existingBook = await storage.findBookByAsinOrIsbn(userId, identifier, undefined);
        } else {
          // Likely ISBN
          existingBook = await storage.findBookByAsinOrIsbn(userId, undefined, identifier);
        }
        
        if (existingBook) {
          existingBooks++;
        }
      }

      const totalBooks = bookIdentifiers.size;
      const newBooks = totalBooks - existingBooks;

      return {
        totalBooks,
        existingBooks,
        newBooks,
        booksWithoutId,
        totalSalesData: royaltiesData.length,
        duplicateSalesData: 0, // TODO: Implement duplicate detection logic
        missingAuthorData
      };

    } catch (error) {
      console.error('Error generating import preview:', error);
      return {
        totalBooks: 0,
        existingBooks: 0,
        newBooks: 0,
        booksWithoutId: 0,
        totalSalesData: 0,
        duplicateSalesData: 0,
        missingAuthorData: 0
      };
    }
  }
}