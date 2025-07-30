import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Check for valid database URL
const databaseUrl = process.env.DATABASE_URL || process.env.REPLIT_DB_URL;

// Validate that we have a proper database URL
if (!databaseUrl || databaseUrl === 'undefined' || databaseUrl === '') {
  console.warn('⚠️  No database URL found. Please provision a database in Replit.');
  console.warn('   Go to the Database tab in Replit and create a PostgreSQL database.');
  console.warn('   The application will run in limited mode without database functionality.');
}

// Only create pool and db if we have a valid database URL
let pool: Pool | null = null;
let db: any = null;

if (databaseUrl && databaseUrl !== 'undefined' && databaseUrl !== '') {
  try {
    pool = new Pool({ connectionString: databaseUrl });
    db = drizzle({ client: pool, schema });
    console.log('✅ Database connection established');
  } catch (error) {
    console.error('❌ Failed to establish database connection:', error);
    console.warn('   Application will run in limited mode without database functionality.');
  }
}

export { pool, db };