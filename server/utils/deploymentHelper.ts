/**
 * Deployment Helper Utilities
 * Provides functions to handle deployment-specific logic and database operations
 */

export function isDeploymentMode(): boolean {
  // Check if we're in deployment mode (Cloud Run build phase)
  const isProduction = process.env.NODE_ENV === 'production';
  const isReplit = process.env.REPLIT_DOMAINS !== undefined;
  const isCloudRun = process.env.K_SERVICE !== undefined;
  const deploymentComplete = process.env.REPLIT_DEPLOYMENT_COMPLETE === 'true';
  
  // We're deploying if we're in production on Cloud Run and deployment isn't complete
  return isProduction && (isCloudRun || isReplit) && !deploymentComplete;
}

export function shouldSkipDatabaseOps(): boolean {
  // Skip database operations during deployment or if DATABASE_URL is missing
  return isDeploymentMode() || !process.env.DATABASE_URL;
}

export async function waitForDatabase(maxAttempts = 10, delay = 2000): Promise<boolean> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const { Pool } = await import('@neondatabase/serverless');
      const pool = new Pool({ connectionString: process.env.DATABASE_URL });
      await pool.query('SELECT 1');
      await pool.end();
      console.log(`[DB] Connection established after ${i + 1} attempts`);
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.log(`[DB] Attempt ${i + 1}/${maxAttempts} failed:`, errorMessage);
      if (i < maxAttempts - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  console.warn(`[DB] Failed to establish connection after ${maxAttempts} attempts`);
  return false;
}

export function createDatabaseMiddleware() {
  return (req: any, res: any, next: any) => {
    // Add database availability check to requests
    req.isDatabaseAvailable = !shouldSkipDatabaseOps();
    
    // Add helper to check database before operations
    req.requireDatabase = () => {
      if (!req.isDatabaseAvailable) {
        throw new Error('Database operations not available during deployment');
      }
    };
    
    next();
  };
}