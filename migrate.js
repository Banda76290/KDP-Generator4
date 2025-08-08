import { drizzle } from 'drizzle-orm/neon-serverless';
import { migrate } from 'drizzle-orm/neon-serverless/migrator';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

// Configuration pour Neon avec WebSocket
neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL must be set');
}

async function runMigrations() {
  console.log('🔄 Starting database migration...');
  
  try {
    // Créer une connexion pour les migrations avec un pool minimal
    const migrationPool = new Pool({ 
      connectionString: process.env.DATABASE_URL,
      max: 1 // Limite à 1 connexion pour les migrations
    });
    
    const db = drizzle({ client: migrationPool });
    
    console.log('📂 Running migrations from ./migrations folder...');
    
    await migrate(db, {
      migrationsFolder: './migrations'
    });
    
    console.log('✅ Database migration completed successfully!');
    
    // Fermer la connexion
    await migrationPool.end();
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Exécuter les migrations si le script est appelé directement
if (process.argv[1].endsWith('migrate.js')) {
  runMigrations().catch(console.error);
}

export { runMigrations };