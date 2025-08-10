import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Database connection with graceful fallback for deployment
let pool: Pool | null = null;
let db: ReturnType<typeof drizzle> | null = null;
let databaseAvailable = false;

async function initializeDatabase() {
  try {
    if (!process.env.DATABASE_URL) {
      console.warn("[DB] DATABASE_URL not set - running without database functionality");
      return false;
    }

    // Test connection during deployment
    const isDeployment = process.env.NODE_ENV === 'production' && !process.env.REPLIT_DEPLOYMENT_COMPLETE;
    const isBuildPhase = process.env.REPLIT_BUILD === 'true';
    
    if (isDeployment || isBuildPhase) {
      console.log("[DB] Deployment/Build mode detected - deferring database initialization");
      return false;
    }

    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    db = drizzle({ client: pool, schema });
    
    // Test the connection
    await pool.query('SELECT 1');
    databaseAvailable = true;
    console.log("[DB] Database connection established successfully");
    return true;
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.warn("[DB] Database connection failed:", errorMessage);
    console.warn("[DB] Application will continue with limited functionality");
    databaseAvailable = false;
    return false;
  }
}

// Initialize database connection only if not in build phase
if (process.env.REPLIT_BUILD !== 'true') {
  initializeDatabase().catch(console.error);
} else {
  console.log("[DB] Build phase detected - skipping database initialization");
}

// Export database with fallback
export { pool };
export const getDb = () => {
  if (!databaseAvailable || !db) {
    throw new Error("Database not available - please ensure DATABASE_URL is set and accessible");
  }
  return db;
};

export const isDatabaseAvailable = () => databaseAvailable;

// For backward compatibility, export db but with checks
export { db };