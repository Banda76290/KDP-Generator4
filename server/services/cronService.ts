import { exchangeRateService } from "./exchangeRateService";

export class CronService {
  private intervalId: NodeJS.Timeout | null = null;
  
  /**
   * Start the cron service
   */
  start(): void {
    console.log('[CRON] Starting exchange rate update service');
    
    // Run immediately on startup
    this.updateExchangeRates();
    
    // Run every 24 hours (86400000 ms)
    this.intervalId = setInterval(() => {
      this.updateExchangeRates();
    }, 24 * 60 * 60 * 1000);
    
    console.log('[CRON] Exchange rate updates scheduled every 24 hours');
  }
  
  /**
   * Stop the cron service
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('[CRON] Exchange rate update service stopped');
    }
  }
  
  /**
   * Update exchange rates
   */
  private async updateExchangeRates(): Promise<void> {
    try {
      await exchangeRateService.updateExchangeRates();
    } catch (error) {
      console.error('[CRON] Exchange rate update failed:', error);
    }
  }
  
  /**
   * Force update exchange rates manually
   */
  async forceUpdate(): Promise<void> {
    console.log('[CRON] Manual exchange rate update requested');
    await this.updateExchangeRates();
  }
}

export const cronService = new CronService();