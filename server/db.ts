import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Use DATABASE_URL from environment, or fallback to REPLIT_DB_URL, or use a default local connection
const databaseUrl = process.env.DATABASE_URL || process.env.REPLIT_DB_URL || 'postgresql://localhost:5432/defaultdb';

if (!process.env.DATABASE_URL && !process.env.REPLIT_DB_URL) {
  console.warn('Warning: No DATABASE_URL or REPLIT_DB_URL found. Using default local connection.');
}

export const pool = new Pool({ connectionString: databaseUrl });
export const db = drizzle({ client: pool, schema });