import XLSX from 'xlsx';
import type { KdpImport, InsertKdpImport, InsertKdpImportData } from '@shared/schema';

export interface ParsedKdpData {
  detectedType: string;
  sheets: {
    [sheetName: string]: {
      headers: string[];
      data: any[][];
      totalRows: number;
    };
  };
  summary: {
    totalSheets: number;
    totalRows: number;
    estimatedRecords: number;
  };
}

export interface ImportProcessResult {
  success: boolean;
  totalRecords: number;
  processedRecords: number;
  errorRecords: number;
  duplicateRecords: number;
  errors: string[];
}

export class KdpImportService {
  /**
   * Detect KDP file type based on filename and content
   */
  static detectFileType(filename: string, sheets: { [key: string]: any }): string {
    const lowercaseFilename = filename.toLowerCase();
    
    // Check filename patterns
    if (lowercaseFilename.includes('payment')) return 'payments';
    if (lowercaseFilename.includes('prior_month_royalties') || lowercaseFilename.includes('royalties')) return 'prior_month_royalties';
    if (lowercaseFilename.includes('kenp_read')) return 'kenp_read';
    if (lowercaseFilename.includes('dashboard')) return 'dashboard';
    if (lowercaseFilename.includes('estimator')) return 'royalties_estimator';
    if (lowercaseFilename.includes('orders')) return 'orders';
    
    // Check sheet names and headers
    const sheetNames = Object.keys(sheets);
    const allHeaders = Object.values(sheets).map((sheet: any) => sheet.headers).flat();
    
    // Prior Month Royalties detection
    if (sheetNames.some(name => name.toLowerCase().includes('royalty')) ||
        sheetNames.some(name => name.toLowerCase().includes('kenp')) ||
        sheetNames.some(name => name.toLowerCase().includes('earnings'))) {
      return 'prior_month_royalties';
    }
    
    // Payments detection
    if (allHeaders.some(h => h?.toLowerCase().includes('payment')) ||
        allHeaders.some(h => h?.toLowerCase().includes('net earnings'))) {
      return 'payments';
    }
    
    // KENP Read detection
    if (allHeaders.some(h => h?.toLowerCase().includes('kenp')) ||
        allHeaders.some(h => h?.toLowerCase().includes('normalized page'))) {
      return 'kenp_read';
    }
    
    // Dashboard detection
    if (sheetNames.some(name => name.toLowerCase().includes('orders')) ||
        sheetNames.some(name => name.toLowerCase().includes('ebook'))) {
      return 'dashboard';
    }
    
    // Orders detection
    if (allHeaders.some(h => h?.toLowerCase().includes('paid units')) ||
        allHeaders.some(h => h?.toLowerCase().includes('free units'))) {
      return 'orders';
    }
    
    return 'unknown';
  }

  /**
   * Parse KDP file and extract structured data
   */
  static parseKdpFile(fileBuffer: Buffer, filename: string): ParsedKdpData {
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheets: { [sheetName: string]: { headers: string[]; data: any[][]; totalRows: number } } = {};
    let totalRows = 0;
    let estimatedRecords = 0;

    // Process each sheet
    workbook.SheetNames.forEach(sheetName => {
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
      
      if (data.length > 0) {
        const headers = data[0] as string[];
        const rowData = data.slice(1);
        
        sheets[sheetName] = {
          headers: headers || [],
          data: rowData,
          totalRows: data.length
        };
        
        totalRows += data.length;
        // Estimate records (excluding header and empty rows)
        estimatedRecords += Math.max(0, data.length - 1);
      }
    });

    const detectedType = this.detectFileType(filename, sheets);

    return {
      detectedType,
      sheets,
      summary: {
        totalSheets: workbook.SheetNames.length,
        totalRows,
        estimatedRecords
      }
    };
  }

  /**
   * Normalize column name for mapping
   */
  private static normalizeColumnName(columnName: string): string {
    return columnName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  }

  /**
   * Create column mapping configuration
   */
  static createColumnMapping(headers: string[]): { [key: string]: string } {
    const mapping: { [key: string]: string } = {};
    
    // Define common column mappings
    const columnMappings = {
      // Identifiers
      'asin': ['asin', 'amazon_standard_identification_number'],
      'isbn': ['isbn', 'international_standard_book_number'],
      'title': ['title', 'book_title', 'publication_title'],
      'author_name': ['author', 'author_name', 'author_name_s'],
      
      // Sales data
      'marketplace': ['marketplace', 'market_place', 'country'],
      'sales_date': ['date', 'sales_date', 'order_date', 'royalty_date'],
      'units_sold': ['units_sold', 'paid_units'],
      'units_refunded': ['units_refunded', 'refunded_units'],
      'net_units_sold': ['net_units_sold', 'net_units'],
      
      // Financial data
      'currency': ['currency'],
      'list_price': ['list_price', 'avg_list_price_without_tax'],
      'offer_price': ['offer_price', 'avg_offer_price_without_tax'],
      'royalty': ['royalty', 'earnings'],
      'royalty_rate': ['royalty_type', 'royalty_rate'],
      
      // KDP specific
      'kenp_read': ['kenp_read', 'kindle_edition_normalized_page_kenp_read'],
      'transaction_type': ['transaction_type'],
      'payment_status': ['payment_status'],
      
      // Format and costs
      'file_size': ['avg_file_size_mb', 'file_size'],
      'delivery_cost': ['avg_delivery_cost', 'delivery_cost'],
      'manufacturing_cost': ['avg_manufacturing_cost', 'manufacturing_cost']
    };

    // Map headers to normalized field names
    headers.forEach(header => {
      if (!header) return;
      
      const normalizedHeader = this.normalizeColumnName(header);
      
      // Find matching field
      for (const [fieldName, patterns] of Object.entries(columnMappings)) {
        if (patterns.some(pattern => normalizedHeader.includes(pattern))) {
          mapping[header] = fieldName;
          break;
        }
      }
      
      // If no mapping found, keep original (normalized)
      if (!mapping[header]) {
        mapping[header] = normalizedHeader;
      }
    });

    return mapping;
  }

  /**
   * Convert row data to normalized import data
   */
  static normalizeRowData(
    rowData: any[], 
    headers: string[], 
    mapping: { [key: string]: string },
    importId: string,
    userId: string,
    sheetName: string,
    rowIndex: number
  ): InsertKdpImportData {
    const normalizedData: any = {
      importId,
      userId,
      sheetName,
      rowIndex,
      rawRowData: Object.fromEntries(headers.map((h, i) => [h, rowData[i]])),
    };

    // Map each column to normalized field
    headers.forEach((header, index) => {
      const value = rowData[index];
      if (value === null || value === undefined || value === '') return;

      const fieldName = mapping[header];
      if (!fieldName) return;

      // Type conversion based on field
      switch (fieldName) {
        case 'asin':
        case 'isbn':
        case 'title':
        case 'author_name':
        case 'marketplace':
        case 'currency':
        case 'royalty_rate':
        case 'transaction_type':
        case 'payment_status':
          normalizedData[fieldName] = String(value);
          break;
          
        case 'sales_date':
          // Handle various date formats
          const dateValue = this.parseDate(value);
          if (dateValue) normalizedData[fieldName] = dateValue;
          break;
          
        case 'units_sold':
        case 'units_refunded':  
        case 'net_units_sold':
        case 'kenp_read':
          const intValue = parseInt(String(value));
          if (!isNaN(intValue)) normalizedData[fieldName] = intValue;
          break;
          
        case 'list_price':
        case 'offer_price':
        case 'royalty':
        case 'file_size':
        case 'delivery_cost':
        case 'manufacturing_cost':
          const floatValue = parseFloat(String(value));
          if (!isNaN(floatValue)) normalizedData[fieldName] = floatValue;
          break;
          
        default:
          // Store as string for unmapped fields
          normalizedData[fieldName] = String(value);
      }
    });

    // Infer format from context
    if (!normalizedData.format) {
      if (normalizedData.kenp_read > 0 || normalizedData.file_size) {
        normalizedData.format = 'ebook';
      } else if (normalizedData.manufacturing_cost) {
        normalizedData.format = normalizedData.manufacturing_cost > 5 ? 'hardcover' : 'paperback';
      }
    }

    return normalizedData as InsertKdpImportData;
  }

  /**
   * Parse date from various formats
   */
  private static parseDate(value: any): string | null {
    if (!value) return null;
    
    try {
      // Handle Excel date numbers
      if (typeof value === 'number') {
        const date = XLSX.SSF.parse_date_code(value);
        return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
      }
      
      // Handle string dates
      const str = String(value);
      
      // YYYY-MM-DD format
      if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
        return str;
      }
      
      // MM/DD/YYYY or DD/MM/YYYY format
      const dateMatch = str.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
      if (dateMatch) {
        const [, first, second, year] = dateMatch;
        // Assume MM/DD/YYYY (US format) for KDP files
        return `${year}-${String(first).padStart(2, '0')}-${String(second).padStart(2, '0')}`;
      }
      
      // YYYY-MM format (monthly data)
      if (/^\d{4}-\d{2}$/.test(str)) {
        return `${str}-01`; // Use first day of month
      }
      
      return null;
    } catch (error) {
      console.error('Date parsing error:', error);
      return null;
    }
  }

  /**
   * Check for duplicates based on ASIN/ISBN and date
   */
  static isDuplicate(
    newRecord: InsertKdpImportData,
    existingRecords: InsertKdpImportData[]
  ): boolean {
    return existingRecords.some(existing => {
      // Match by ASIN or ISBN
      const identifierMatch = (newRecord.asin && newRecord.asin === existing.asin) ||
                             (newRecord.isbn && newRecord.isbn === existing.isbn);
      
      // Match by sales date  
      const dateMatch = newRecord.salesDate === existing.salesDate;
      
      // Match by marketplace
      const marketplaceMatch = newRecord.marketplace === existing.marketplace;
      
      return identifierMatch && dateMatch && marketplaceMatch;
    });
  }
}