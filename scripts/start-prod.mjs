// scripts/start-prod.mjs - Point d'entrée pour la production
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { migrate } from 'drizzle-orm/neon-http/migrator';
import { spawn } from 'child_process';

const { DATABASE_URL, DRIZZLE_MIGRATIONS_FOLDER = './migrations' } = process.env;

async function runMigrations() {
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
}

async function startServer() {
  console.log('🚀 Démarrage du serveur...');
  const server = spawn('node', ['dist/index.js'], {
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'production' }
  });

  server.on('error', (err) => {
    console.error('❌ Erreur serveur :', err);
    process.exit(1);
  });

  server.on('exit', (code) => {
    process.exit(code);
  });
}

// Exécution séquentielle : migrations puis serveur
await runMigrations();
await startServer();