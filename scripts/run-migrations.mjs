// scripts/run-migrations.mjs
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { migrate } from 'drizzle-orm/neon-http/migrator';

const { DATABASE_URL, DRIZZLE_MIGRATIONS_FOLDER = './migrations' } = process.env;
if (!DATABASE_URL) {
  console.error('DATABASE_URL manquant');
  process.exit(1);
}

const sql = neon(DATABASE_URL);
const db = drizzle(sql, { logger: true });

try {
  await migrate(db, { migrationsFolder: DRIZZLE_MIGRATIONS_FOLDER });
  console.log('✅ migrations appliquées (ou déjà à jour)');
} catch (err) {
  console.error('❌ échec des migrations drizzle :', err?.message || err);
  process.exit(1);
}