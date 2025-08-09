import * as XLSX from 'xlsx';

export interface KDPSalesRecord {
  projectId?: string;
  reportDate: Date;
  format: 'ebook' | 'paperback' | 'hardcover';
  marketplace: string;
  unitsSold: number;
  revenue: number;
  royalty: number;
  title?: string;
  asin?: string;
}

export async function parseKDPReport(buffer: Buffer, mimeType: string): Promise<KDPSalesRecord[]> {
  try {
    let workbook: XLSX.WorkBook;

    if (mimeType === 'text/csv') {
      const csvData = buffer.toString('utf8');
      workbook = XLSX.read(csvData, { type: 'string' });
    } else {
      workbook = XLSX.read(buffer, { type: 'buffer' });
    }

    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

    if (data.length < 2) {
      throw new Error('Invalid KDP report format: insufficient data');
    }

    const headers = data[0].map((h: string) => h?.toLowerCase().trim());
    const records: KDPSalesRecord[] = [];

    // Map common KDP report headers to our fields
    const headerMap = {
      title: findHeaderIndex(headers, ['title', 'book title', 'product title']),
      asin: findHeaderIndex(headers, ['asin', 'product asin']),
      marketplace: findHeaderIndex(headers, ['marketplace', 'country']),
      format: findHeaderIndex(headers, ['format', 'product format', 'type']),
      unitsSold: findHeaderIndex(headers, ['units sold', 'quantity', 'sales']),
      revenue: findHeaderIndex(headers, ['net revenue', 'revenue', 'earnings']),
      royalty: findHeaderIndex(headers, ['royalty', 'author royalty']),
      date: findHeaderIndex(headers, ['date', 'report date', 'sale date']),
    };

    // Validate required headers exist
    if (headerMap.unitsSold === -1 || headerMap.revenue === -1) {
      throw new Error('Invalid KDP report format: missing required columns (units sold, revenue)');
    }

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length === 0) continue;

      try {
        const record: KDPSalesRecord = {
          reportDate: parseDate(row[headerMap.date] || new Date()),
          format: parseFormat(row[headerMap.format]),
          marketplace: String(row[headerMap.marketplace] || 'Unknown').trim(),
          unitsSold: parseInt(String(row[headerMap.unitsSold] || '0')) || 0,
          revenue: parseFloat(String(row[headerMap.revenue] || '0')) || 0,
          royalty: parseFloat(String(row[headerMap.royalty] || '0')) || 0,
          title: headerMap.title !== -1 ? String(row[headerMap.title] || '').trim() : undefined,
          asin: headerMap.asin !== -1 ? String(row[headerMap.asin] || '').trim() : undefined,
        };

        // Only add records with actual sales
        if (record.unitsSold > 0 || record.revenue > 0) {
          records.push(record);
        }
      } catch (rowError) {
        console.warn(`Skipping invalid row ${i}:`, rowError instanceof Error ? rowError.message : 'Unknown error');
        continue;
      }
    }

    if (records.length === 0) {
      throw new Error('No valid sales records found in the report');
    }

    return records;

  } catch (error) {
    console.error('KDP parsing error:', error);
    throw new Error(`Failed to parse KDP report: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

function findHeaderIndex(headers: string[], possibleNames: string[]): number {
  for (const name of possibleNames) {
    const index = headers.findIndex(h => h && h.includes(name));
    if (index !== -1) return index;
  }
  return -1;
}

function parseDate(dateValue: any): Date {
  if (dateValue instanceof Date) return dateValue;
  if (typeof dateValue === 'number') {
    // Excel date serial number
    return new Date((dateValue - 25569) * 86400 * 1000);
  }
  if (typeof dateValue === 'string') {
    const parsed = new Date(dateValue);
    if (!isNaN(parsed.getTime())) return parsed;
  }
  return new Date(); // fallback to current date
}

function parseFormat(formatValue: any): 'ebook' | 'paperback' | 'hardcover' {
  const format = String(formatValue || '').toLowerCase().trim();
  
  if (format.includes('ebook') || format.includes('kindle') || format.includes('digital')) {
    return 'ebook';
  }
  if (format.includes('hardcover') || format.includes('hard cover') || format.includes('hardback')) {
    return 'hardcover';
  }
  // Default to paperback for anything else
  return 'paperback';
}
