import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Construct DATABASE_URL from individual PostgreSQL variables if not provided
let databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl && process.env.PGHOST && process.env.PGDATABASE && process.env.PGUSER && process.env.PGPASSWORD) {
  const { PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD } = process.env;
  databaseUrl = `postgresql://${PGUSER}:${PGPASSWORD}@${PGHOST}:${PGPORT || 5432}/${PGDATABASE}?sslmode=require`;
  console.log("DATABASE_URL constructed from individual PG variables");
}

if (!databaseUrl) {
  console.error("DATABASE_URL environment variable is not set and cannot be constructed");
  console.error("Available environment variables:", Object.keys(process.env).filter(key => key.includes('PG') || key.includes('DATABASE')));
  throw new Error(
    "DATABASE_URL must be set or PostgreSQL connection variables (PGHOST, PGDATABASE, PGUSER, PGPASSWORD) must be provided.",
  );
}

export const pool = new Pool({ connectionString: databaseUrl });
export const db = drizzle({ client: pool, schema });