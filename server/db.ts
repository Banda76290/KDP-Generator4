import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Use Replit's built-in database URL or fallback for development
const databaseUrl = process.env.DATABASE_URL || process.env.REPLIT_DB_URL;

// Create a mock database connection if no URL is provided
let pool: Pool;
let db: any;

if (databaseUrl) {
  pool = new Pool({ connectionString: databaseUrl });
  db = drizzle({ client: pool, schema });
} else {
  console.warn("No database URL found. Running in mock mode - some features will be limited.");
  // Create a mock database that doesn't crash the app
  pool = null as any;
  db = new Proxy({}, {
    get() {
      return () => Promise.resolve([]);
    }
  });
}

export { pool, db };