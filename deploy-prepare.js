/**
 * Script de préparation au déploiement Replit
 * Optimise la configuration pour éviter les erreurs de migration en production
 */

import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

// Configuration Neon pour production
neonConfig.webSocketConstructor = ws;

async function prepareDeploy() {
  console.log('🚀 Preparing deployment configuration...');
  
  try {
    if (!process.env.DATABASE_URL) {
      console.error('❌ DATABASE_URL not found');
      process.exit(1);
    }

    // Test de connexion à la base de données
    const testPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 1
    });

    console.log('🔍 Testing database connection...');
    
    const db = drizzle({ client: testPool });
    
    // Test simple de requête
    await testPool.query('SELECT NOW()');
    
    console.log('✅ Database connection successful');
    console.log('✅ Deployment preparation complete');
    
    await testPool.end();
    
  } catch (error) {
    console.error('❌ Deployment preparation failed:', error.message);
    process.exit(1);
  }
}

if (process.argv[1].endsWith('deploy-prepare.js')) {
  prepareDeploy().catch(console.error);
}