import { db } from "../db";
import { exchangeRates, type InsertExchangeRate } from "../../shared/schema";
import { eq, and, desc } from "drizzle-orm";

export class ExchangeRateService {
  private readonly API_BASE = "https://api.exchangerate-api.com/v4/latest";
  
  // Fallback exchange rates (approximate values as of 2025)
  private readonly FALLBACK_RATES = {
    'USD': 1.0,
    'EUR': 0.95,
    'JPY': 160.0,
    'GBP': 0.83,
    'CAD': 1.45,
    'INR': 88.0,
    'AUD': 1.65,
    'BRL': 6.2,
    'MXN': 21.0
  };
  
  /**
   * Fetch current exchange rates from exchangerate.host API
   */
  async fetchExchangeRates(baseCurrency: string = 'USD'): Promise<Record<string, number>> {
    try {
      // Try multiple APIs in sequence
      const apis = [
        `${this.API_BASE}/${baseCurrency}`,
        `https://api.fixer.io/latest?base=${baseCurrency}&access_key=${process.env.FIXER_API_KEY || ''}`,
      ];

      for (const url of apis) {
        try {
          console.log(`[EXCHANGE] Fetching rates from: ${url.replace(/access_key=[^&]*/, 'access_key=***')}`);
          
          const response = await fetch(url);
          console.log(`[EXCHANGE] Response status: ${response.status}`);
          
          if (!response.ok) {
            console.log(`[EXCHANGE] API failed with status ${response.status}, trying next...`);
            continue;
          }
          
          const data = await response.json();
          
          // Handle different API response formats
          if (data.rates) {
            console.log(`[EXCHANGE] Successfully fetched ${Object.keys(data.rates).length} exchange rates`);
            return data.rates;
          }
          
          console.log('[EXCHANGE] API response missing rates field, trying next...');
        } catch (apiError) {
          console.log(`[EXCHANGE] API request failed: ${apiError}, trying next...`);
          continue;
        }
      }
      
      // If all APIs fail, use fallback rates
      console.log('[EXCHANGE] All APIs failed, using fallback rates');
      return this.generateFallbackRates(baseCurrency);
      
    } catch (error) {
      console.error('[EXCHANGE] Failed to fetch exchange rates:', error);
      // Return fallback rates instead of throwing
      return this.generateFallbackRates(baseCurrency);
    }
  }

  private generateFallbackRates(baseCurrency: string): Record<string, number> {
    const baseRate = this.FALLBACK_RATES[baseCurrency as keyof typeof this.FALLBACK_RATES] || 1;
    const rates: Record<string, number> = {};
    
    for (const [currency, rate] of Object.entries(this.FALLBACK_RATES)) {
      rates[currency] = rate / baseRate;
    }
    
    console.log(`[EXCHANGE] Generated fallback rates for base ${baseCurrency}:`, rates);
    return rates;
  }

  /**
   * Store exchange rates in database
   */
  async storeExchangeRates(rates: Record<string, number>, baseCurrency: string = 'USD'): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    
    for (const [currency, rate] of Object.entries(rates)) {
      try {
        await db
          .insert(exchangeRates)
          .values({
            fromCurrency: baseCurrency,
            toCurrency: currency,
            rate: rate.toString(),
            date: today
          })
          .onConflictDoUpdate({
            target: [exchangeRates.fromCurrency, exchangeRates.toCurrency, exchangeRates.date],
            set: {
              rate: rate.toString(),
              updatedAt: new Date()
            }
          });
      } catch (error) {
        console.error(`Failed to store rate for ${currency}:`, error);
      }
    }
  }

  /**
   * Get latest exchange rate between two currencies
   */
  async getExchangeRate(fromCurrency: string, toCurrency: string): Promise<number | null> {
    if (fromCurrency === toCurrency) {
      return 1;
    }

    const rate = await db
      .select()
      .from(exchangeRates)
      .where(and(
        eq(exchangeRates.fromCurrency, fromCurrency),
        eq(exchangeRates.toCurrency, toCurrency)
      ))
      .orderBy(desc(exchangeRates.date))
      .limit(1);

    return rate[0] ? parseFloat(rate[0].rate) : null;
  }

  /**
   * Convert amount from one currency to another
   */
  async convertCurrency(amount: number, fromCurrency: string, toCurrency: string): Promise<number> {
    if (fromCurrency === toCurrency) {
      return amount;
    }

    const rate = await this.getExchangeRate(fromCurrency, toCurrency);
    if (rate === null) {
      throw new Error(`No exchange rate found for ${fromCurrency} to ${toCurrency}`);
    }

    return amount * rate;
  }

  /**
   * Convert all amounts to base currency (USD by default)
   */
  async convertToBaseCurrency(amounts: Array<{amount: number, currency: string}>, baseCurrency: string = 'USD'): Promise<number> {
    let total = 0;
    
    for (const item of amounts) {
      try {
        const convertedAmount = await this.convertCurrency(item.amount, item.currency, baseCurrency);
        total += convertedAmount;
      } catch (error) {
        console.error(`Failed to convert ${item.amount} ${item.currency} to ${baseCurrency}:`, error);
        // Skip this amount if conversion fails
      }
    }
    
    return total;
  }

  /**
   * Update exchange rates (called by cron job)
   */
  async updateExchangeRates(): Promise<void> {
    console.log('[EXCHANGE] Updating exchange rates...');
    
    try {
      const rates = await this.fetchExchangeRates('USD');
      await this.storeExchangeRates(rates, 'USD');
      
      console.log(`[EXCHANGE] Successfully updated ${Object.keys(rates).length} exchange rates`);
    } catch (error) {
      console.error('[EXCHANGE] Failed to update exchange rates:', error);
      throw error;
    }
  }

  /**
   * Get all supported currencies with latest rates
   */
  async getSupportedCurrencies(): Promise<Array<{currency: string, rate: string, updatedAt: string}>> {
    const rates = await db
      .select({
        currency: exchangeRates.toCurrency,
        rate: exchangeRates.rate,
        updatedAt: exchangeRates.updatedAt
      })
      .from(exchangeRates)
      .where(eq(exchangeRates.fromCurrency, 'USD'))
      .orderBy(desc(exchangeRates.updatedAt), exchangeRates.toCurrency);

    // Group by currency and take the latest rate
    const latestRates = new Map();
    for (const rate of rates) {
      if (!latestRates.has(rate.currency)) {
        latestRates.set(rate.currency, {
          currency: rate.currency,
          rate: rate.rate,
          updatedAt: rate.updatedAt?.toISOString() || new Date().toISOString()
        });
      }
    }

    return Array.from(latestRates.values());
  }
}

export const exchangeRateService = new ExchangeRateService();