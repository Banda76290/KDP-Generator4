#!/usr/bin/env node

/**
 * Standalone migration runner for Replit Deployments
 * This script can be executed independently during deployment
 * to handle database schema initialization when Drizzle migrations fail
 */

import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const log = (message) => {
  console.log(`[Standalone Migration] ${new Date().toISOString()} - ${message}`);
};

async function runStandaloneMigration() {
  try {
    log('=== Starting Standalone Database Migration ===');
    
    // Check if DATABASE_URL is available
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    
    log('Database URL found, proceeding with migration...');
    
    // Execute the TypeScript migration script
    const migrationScript = join(__dirname, 'server', 'scripts', 'migrate.ts');
    const command = `npx tsx "${migrationScript}"`;
    
    log(`Executing: ${command}`);
    
    execSync(command, {
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'production' }
    });
    
    log('=== Standalone Migration Completed Successfully ===');
    
  } catch (error) {
    log('=== Standalone Migration Failed ===');
    log(`Error: ${error.message}`);
    
    // Don't exit with error code to allow deployment to continue
    // This allows the application to start even if migration fails
    log('Continuing with deployment despite migration failure...');
  }
}

// Execute if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runStandaloneMigration();
}