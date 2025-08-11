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
    get(target, prop) {
      // Mock common database operations with proper method chaining
      if (prop === 'insert') {
        return () => ({
          values: () => ({
            returning: () => ({
              execute: () => Promise.resolve([])
            }),
            onConflictDoUpdate: () => ({
              returning: () => ({
                execute: () => Promise.resolve([])
              }),
              execute: () => Promise.resolve([])
            }),
            execute: () => Promise.resolve([])
          }),
          execute: () => Promise.resolve([])
        });
      }
      if (prop === 'select') {
        return () => ({
          from: () => ({
            where: () => ({
              execute: () => Promise.resolve([])
            }),
            execute: () => Promise.resolve([])
          }),
          execute: () => Promise.resolve([])
        });
      }
      if (prop === 'update') {
        return () => ({
          set: () => ({
            where: () => ({
              returning: () => ({
                execute: () => Promise.resolve([])
              }),
              execute: () => Promise.resolve([])
            }),
            execute: () => Promise.resolve([])
          }),
          execute: () => Promise.resolve([])
        });
      }
      if (prop === 'delete') {
        return () => ({
          where: () => ({
            execute: () => Promise.resolve([])
          }),
          execute: () => Promise.resolve([])
        });
      }
      // Default fallback for any other methods
      return () => Promise.resolve([]);
    }
  });
}

export { pool, db };