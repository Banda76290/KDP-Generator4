import { Client } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';

const { DATABASE_URL, DRIZZLE_MIGRATIONS_FOLDER = './migrations' } = process.env;
if (!DATABASE_URL) { console.error('DATABASE_URL manquant'); process.exit(1); }

const client = new Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });
await client.connect();
const db = drizzle(client, { logger: true });

try {
  await migrate(db, { migrationsFolder: DRIZZLE_MIGRATIONS_FOLDER });
  console.log('✅ migrations appliquées (ou déjà à jour)');
} catch (err) {
  console.error('❌ échec des migrations drizzle (node-postgres) :', err?.message || err);
  process.exit(1);
} finally {
  await client.end();
}