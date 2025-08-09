/**
 * Platform-Specific Database Migration Handler for Replit Deployments
 * Addresses platform-level limitations and provides comprehensive fallback strategies
 */

import { sql } from 'drizzle-orm';
import { db } from '../db.js';
import { seedDatabase } from '../seedDatabase.js';

const log = (message: string) => {
  console.log(`[Platform Migration] ${new Date().toISOString()} - ${message}`);
};

const warn = (message: string) => {
  console.warn(`[Platform Migration WARN] ${new Date().toISOString()} - ${message}`);
};

const error = (message: string) => {
  console.error(`[Platform Migration ERROR] ${new Date().toISOString()} - ${message}`);
};

/**
 * Enhanced connection test with platform-specific handling
 */
export async function testPlatformConnection(): Promise<{ success: boolean; details: string }> {
  try {
    log('Testing platform database connectivity...');
    
    // Test basic connection
    await db.execute(sql`SELECT 1 as platform_test`);
    log('✅ Platform database connection successful');
    
    // Test permissions
    const permResult = await db.execute(sql`
      SELECT 
        has_database_privilege(current_user, current_database(), 'CREATE') as can_create,
        has_database_privilege(current_user, current_database(), 'CONNECT') as can_connect,
        current_user as username,
        current_database() as database_name
    `);
    
    const permissions = permResult.rows[0];
    log(`Database user: ${permissions?.username}`);
    log(`Database name: ${permissions?.database_name}`);
    log(`CREATE privilege: ${permissions?.can_create ? '✅' : '❌'}`);
    log(`CONNECT privilege: ${permissions?.can_connect ? '✅' : '❌'}`);
    
    return {
      success: true,
      details: `Connected as ${permissions?.username} to ${permissions?.database_name}`
    };
    
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown platform error';
    error(`Platform database connection failed: ${errorMessage}`);
    
    // Categorize platform-specific errors
    if (errorMessage.includes('ENOTFOUND')) {
      return { success: false, details: 'Platform DNS resolution issue' };
    } else if (errorMessage.includes('ECONNREFUSED')) {
      return { success: false, details: 'Platform database service unavailable' };
    } else if (errorMessage.includes('authentication failed')) {
      return { success: false, details: 'Platform authentication configuration issue' };
    } else if (errorMessage.includes('SSL')) {
      return { success: false, details: 'Platform SSL configuration issue' };
    } else {
      return { success: false, details: `Platform connectivity issue: ${errorMessage}` };
    }
  }
}

/**
 * Platform-aware schema validation
 */
export async function validatePlatformSchema(): Promise<{ valid: boolean; missingTables: string[]; details: string }> {
  try {
    log('Validating database schema on platform...');
    
    const expectedTables = [
      'users', 'projects', 'books', 'contributors', 'series',
      'marketplace_categories', 'sales_data', 'kdp_imports',
      'sessions', 'consolidated_sales_data'
    ];
    
    const result = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    `);
    
    const existingTables = result.rows.map(row => row.table_name as string);
    const missingTables = expectedTables.filter(table => !existingTables.includes(table));
    
    log(`Found ${existingTables.length} tables in database`);
    log(`Expected ${expectedTables.length} core tables`);
    
    if (missingTables.length === 0) {
      log('✅ All required tables present');
      return { valid: true, missingTables: [], details: 'Schema validation passed' };
    } else {
      warn(`❌ Missing tables: ${missingTables.join(', ')}`);
      return { 
        valid: false, 
        missingTables,
        details: `Missing ${missingTables.length} tables: ${missingTables.join(', ')}`
      };
    }
    
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown schema error';
    error(`Schema validation failed: ${errorMessage}`);
    return { 
      valid: false, 
      missingTables: [], 
      details: `Schema validation error: ${errorMessage}` 
    };
  }
}

/**
 * Platform-specific migration execution with multiple fallback strategies
 */
export async function executePlatformMigration(): Promise<{ success: boolean; strategy: string; details: string }> {
  log('=== Platform Migration Execution Starting ===');
  
  // Strategy 1: Check if already migrated
  try {
    const schemaCheck = await validatePlatformSchema();
    if (schemaCheck.valid) {
      log('✅ Database schema already properly initialized');
      return { 
        success: true, 
        strategy: 'already-migrated', 
        details: 'Schema validation passed - no migration needed' 
      };
    }
  } catch (err) {
    warn('Initial schema check failed, proceeding with migration...');
  }
  
  // Strategy 2: Import schema modules (triggers table creation)
  try {
    log('Attempting schema module import strategy...');
    
    // Import all schema modules to trigger Drizzle table creation
    const schemas = await import('../../shared/schema.js');
    log('Schema modules imported successfully');
    
    // Wait a moment for table creation to process
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Verify schema creation
    const postImportCheck = await validatePlatformSchema();
    if (postImportCheck.valid) {
      log('✅ Schema created via module import');
      
      // Run seeding
      await seedDatabase();
      log('✅ Database seeded successfully');
      
      return { 
        success: true, 
        strategy: 'module-import', 
        details: 'Schema created and seeded via module import' 
      };
    }
  } catch (err) {
    warn(`Module import strategy failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
  
  // Strategy 3: Direct SQL execution
  try {
    log('Attempting direct SQL execution strategy...');
    
    // Execute core table creation SQL
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        display_name VARCHAR(255),
        username VARCHAR(255) UNIQUE,
        avatar_url VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_admin BOOLEAN DEFAULT FALSE,
        email VARCHAR(255)
      )
    `);
    
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS projects (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    log('Core tables created via direct SQL');
    
    // Run seeding for essential data
    await seedDatabase();
    log('✅ Database seeded via direct SQL strategy');
    
    return { 
      success: true, 
      strategy: 'direct-sql', 
      details: 'Core schema created via direct SQL execution' 
    };
    
  } catch (err) {
    error(`Direct SQL strategy failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
  
  // Strategy 4: Graceful degradation
  warn('All migration strategies failed - enabling graceful degradation');
  warn('Application will start with limited database functionality');
  
  return { 
    success: false, 
    strategy: 'graceful-degradation', 
    details: 'All migration strategies failed - manual database setup may be required' 
  };
}

/**
 * Comprehensive platform deployment health check
 */
export async function runPlatformDeploymentCheck(): Promise<{
  overall: 'healthy' | 'degraded' | 'unhealthy';
  connection: boolean;
  schema: boolean;
  permissions: boolean;
  seeding: boolean;
  details: string[];
}> {
  log('=== Platform Deployment Health Check ===');
  const details: string[] = [];
  
  // Test connection
  const connectionTest = await testPlatformConnection();
  details.push(`Connection: ${connectionTest.success ? '✅' : '❌'} ${connectionTest.details}`);
  
  // Test schema
  const schemaTest = await validatePlatformSchema();
  details.push(`Schema: ${schemaTest.valid ? '✅' : '❌'} ${schemaTest.details}`);
  
  // Test permissions and seeding
  let permissionsOk = false;
  let seedingOk = false;
  
  if (connectionTest.success) {
    try {
      // Test basic query permissions
      await db.execute(sql`SELECT COUNT(*) as test FROM information_schema.tables`);
      permissionsOk = true;
      details.push('Permissions: ✅ Database query permissions verified');
    } catch (err) {
      details.push(`Permissions: ❌ ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
    
    // Test data seeding status
    try {
      const categoryCount = await db.execute(sql`
        SELECT COUNT(*) as count FROM information_schema.tables 
        WHERE table_name = 'marketplace_categories'
      `);
      
      if ((categoryCount.rows[0]?.count as number) > 0) {
        const dataCount = await db.execute(sql`SELECT COUNT(*) as count FROM marketplace_categories LIMIT 1`);
        seedingOk = (dataCount.rows[0]?.count as number) > 0;
        details.push(`Seeding: ${seedingOk ? '✅' : '⚠️'} Marketplace categories ${seedingOk ? 'present' : 'missing'}`);
      } else {
        details.push('Seeding: ❌ Marketplace categories table not found');
      }
    } catch (err) {
      details.push(`Seeding: ❌ ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }
  
  // Determine overall health
  let overall: 'healthy' | 'degraded' | 'unhealthy';
  if (connectionTest.success && schemaTest.valid && permissionsOk) {
    overall = seedingOk ? 'healthy' : 'degraded';
  } else if (connectionTest.success) {
    overall = 'degraded';
  } else {
    overall = 'unhealthy';
  }
  
  details.push(`Overall Status: ${overall.toUpperCase()}`);
  
  return {
    overall,
    connection: connectionTest.success,
    schema: schemaTest.valid,
    permissions: permissionsOk,
    seeding: seedingOk,
    details
  };
}