import { exchangeRateService } from "./exchangeRateService";
import { db } from "../db";
import { cronJobs, cronJobLogs, type CronJob, type InsertCronJobLog } from "../../shared/schema.js";
import { eq, desc } from "drizzle-orm";

export class CronService {
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private isInitialized = false;
  
  /**
   * Initialize and start the cron service
   */
  async start(): Promise<void> {
    if (this.isInitialized) return;
    
    console.log('[CRON] Initializing cron service...');
    
    // Initialize default cron jobs in database
    await this.initializeDefaultJobs();
    
    // Load and start enabled jobs
    await this.loadAndStartJobs();
    
    this.isInitialized = true;
    console.log('[CRON] Cron service initialized successfully');
  }
  
  /**
   * Stop all cron jobs
   */
  stop(): void {
    this.intervals.forEach((intervalId, jobType) => {
      clearInterval(intervalId);
      console.log(`[CRON] Stopped job: ${jobType}`);
    });
    this.intervals.clear();
    this.isInitialized = false;
    console.log('[CRON] All cron jobs stopped');
  }
  
  /**
   * Initialize default cron jobs in database
   */
  private async initializeDefaultJobs(): Promise<void> {
    const defaultJobs = [
      {
        jobType: 'exchange_rates_update' as const,
        name: 'Exchange Rates Update',
        description: 'Updates currency exchange rates from external API',
        enabled: false, // Disabled by default
        intervalHours: "24",
      }
    ];

    for (const job of defaultJobs) {
      try {
        await db
          .insert(cronJobs)
          .values(job)
          .onConflictDoUpdate({
            target: [cronJobs.jobType],
            set: {
              name: job.name,
              description: job.description,
              // Keep existing enabled status and interval
              updatedAt: new Date()
            }
          });
      } catch (error) {
        console.error(`[CRON] Failed to initialize job ${job.jobType}:`, error);
      }
    }
  }
  
  /**
   * Load jobs from database and start enabled ones
   */
  private async loadAndStartJobs(): Promise<void> {
    try {
      const jobs = await db.select().from(cronJobs);
      
      for (const job of jobs) {
        if (job.enabled) {
          await this.startJob(job);
        }
      }
    } catch (error) {
      console.error('[CRON] Failed to load jobs:', error);
    }
  }
  
  /**
   * Start a specific job
   */
  private async startJob(job: CronJob): Promise<void> {
    // Stop existing job if running
    if (this.intervals.has(job.jobType)) {
      clearInterval(this.intervals.get(job.jobType)!);
    }
    
    const intervalMs = (parseFloat(job.intervalHours || "24")) * 60 * 60 * 1000;
    
    console.log(`[CRON] Starting job: ${job.name} (every ${job.intervalHours}h)`);
    
    // Update next run time
    await this.updateJobNextRun(job.jobType, new Date(Date.now() + intervalMs));
    
    const intervalId = setInterval(async () => {
      await this.executeJob(job.jobType);
    }, intervalMs);
    
    this.intervals.set(job.jobType, intervalId);
  }
  
  /**
   * Stop a specific job
   */
  private async stopJob(jobType: string): Promise<void> {
    if (this.intervals.has(jobType)) {
      clearInterval(this.intervals.get(jobType)!);
      this.intervals.delete(jobType);
      console.log(`[CRON] Stopped job: ${jobType}`);
    }
  }
  
  /**
   * Execute a job by type
   */
  private async executeJob(jobType: string): Promise<void> {
    const startTime = Date.now();
    let logData: InsertCronJobLog = {
      jobId: '', // Will be updated below
      jobType: jobType as any,
      status: 'started',
      message: `Job ${jobType} started`,
      startedAt: new Date()
    };

    try {
      // Get job details
      const job = await db.select().from(cronJobs).where(eq(cronJobs.jobType, jobType as any)).limit(1);
      if (!job.length) {
        throw new Error(`Job ${jobType} not found in database`);
      }

      logData.jobId = job[0].id;

      // Log job start
      await db.insert(cronJobLogs).values(logData);

      // Update job status to running
      await db.update(cronJobs)
        .set({ 
          lastStatus: 'running',
          lastRun: new Date(),
          runCount: (job[0].runCount || 0) + 1
        })
        .where(eq(cronJobs.jobType, jobType as any));

      // Execute specific job logic
      switch (jobType) {
        case 'exchange_rates_update':
          await exchangeRateService.updateExchangeRates();
          break;
        default:
          throw new Error(`Unknown job type: ${jobType}`);
      }

      const duration = Date.now() - startTime;
      
      // Log successful completion
      await db.insert(cronJobLogs).values({
        ...logData,
        status: 'completed',
        message: `Job ${jobType} completed successfully`,
        duration: duration,
        completedAt: new Date()
      });

      // Update job status and next run
      const nextRun = new Date(Date.now() + ((parseFloat(job[0].intervalHours || "24")) * 60 * 60 * 1000));
      await db.update(cronJobs)
        .set({ 
          lastStatus: 'completed',
          nextRun,
          lastError: null
        })
        .where(eq(cronJobs.jobType, jobType as any));

      console.log(`[CRON] Job ${jobType} completed successfully in ${duration}ms`);

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Log error
      await db.insert(cronJobLogs).values({
        ...logData,
        status: 'failed',
        message: `Job ${jobType} failed`,
        error: errorMessage,
        duration: duration,
        completedAt: new Date()
      });

      // Update job status with error
      await db.update(cronJobs)
        .set({ 
          lastStatus: 'error',
          lastError: errorMessage
        })
        .where(eq(cronJobs.jobType, jobType as any));

      console.error(`[CRON] Job ${jobType} failed after ${duration}ms:`, error);
    }
  }
  
  /**
   * Update job next run time
   */
  private async updateJobNextRun(jobType: string, nextRun: Date): Promise<void> {
    await db.update(cronJobs)
      .set({ nextRun })
      .where(eq(cronJobs.jobType, jobType as any));
  }
  
  /**
   * Get all jobs from database
   */
  async getAllJobs(): Promise<CronJob[]> {
    return await db.select().from(cronJobs).orderBy(cronJobs.name);
  }
  
  /**
   * Get job logs
   */
  async getJobLogs(limit: number = 50): Promise<any[]> {
    return await db.select().from(cronJobLogs)
      .orderBy(desc(cronJobLogs.startedAt))
      .limit(limit);
  }
  
  /**
   * Toggle job enabled status
   */
  async toggleJob(jobId: string, enabled: boolean): Promise<void> {
    const job = await db.select().from(cronJobs).where(eq(cronJobs.id, jobId)).limit(1);
    if (!job.length) {
      throw new Error('Job not found');
    }

    await db.update(cronJobs)
      .set({ enabled, updatedAt: new Date() })
      .where(eq(cronJobs.id, jobId));

    if (enabled) {
      await this.startJob(job[0]);
    } else {
      await this.stopJob(job[0].jobType);
      await db.update(cronJobs)
        .set({ lastStatus: 'stopped', nextRun: null })
        .where(eq(cronJobs.id, jobId));
    }

    console.log(`[CRON] Job ${job[0].name} ${enabled ? 'enabled' : 'disabled'}`);
  }
  
  /**
   * Update job configuration
   */
  async updateJobConfig(jobId: string, intervalHours: number): Promise<void> {
    console.log(`[CRON] Looking for job with ID: ${jobId}`);
    const job = await db.select().from(cronJobs).where(eq(cronJobs.id, jobId)).limit(1);
    console.log(`[CRON] Found ${job.length} jobs`);
    if (!job.length) {
      // Liste tous les jobs pour debugging
      const allJobs = await db.select().from(cronJobs);
      console.log(`[CRON] Available job IDs:`, allJobs.map(j => j.id));
      throw new Error('Job not found');
    }

    await db.update(cronJobs)
      .set({ 
        intervalHours: intervalHours.toString(),
        updatedAt: new Date(),
        nextRun: job[0].enabled ? new Date(Date.now() + (intervalHours * 60 * 60 * 1000)) : null
      })
      .where(eq(cronJobs.id, jobId));

    // Restart job if enabled to apply new interval
    if (job[0].enabled) {
      await this.stopJob(job[0].jobType);
      await this.startJob({ ...job[0], intervalHours: intervalHours.toString() });
    }

    console.log(`[CRON] Job ${job[0].name} interval updated to ${intervalHours} hours`);
  }
  
  /**
   * Force run a job manually
   */
  async forceRunJob(jobId: string): Promise<void> {
    const job = await db.select().from(cronJobs).where(eq(cronJobs.id, jobId)).limit(1);
    if (!job.length) {
      throw new Error('Job not found');
    }

    console.log(`[CRON] Manual execution requested for job: ${job[0].name}`);
    await this.executeJob(job[0].jobType);
  }
  
  /**
   * Legacy method for backwards compatibility
   */
  async forceUpdate(): Promise<void> {
    // Find exchange rates job and run it
    const jobs = await db.select().from(cronJobs).where(eq(cronJobs.jobType, 'exchange_rates_update'));
    if (jobs.length > 0) {
      await this.forceRunJob(jobs[0].id);
    } else {
      // Fallback to direct execution
      await exchangeRateService.updateExchangeRates();
    }
  }
}

export const cronService = new CronService();