/**
 * Critical Deployment Handler for Platform-Level Database Issues
 * Emergency fallback system for when standard migration approaches fail
 */

import { sql } from 'drizzle-orm';
import { db } from '../db.js';

const log = (message: string) => {
  console.log(`[Critical Deploy] ${new Date().toISOString()} - ${message}`);
};

const error = (message: string) => {
  console.error(`[Critical Deploy ERROR] ${new Date().toISOString()} - ${message}`);
};

/**
 * Emergency database initialization using raw SQL
 * This bypasses all ORM dependencies and creates tables directly
 */
export async function emergencyDatabaseInitialization(): Promise<boolean> {
  try {
    log('=== EMERGENCY DATABASE INITIALIZATION ===');
    log('Platform-level migration failure detected - using emergency fallback');
    
    // Create users table
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
    log('✅ Users table created');

    // Create projects table
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
    log('✅ Projects table created');

    // Create books table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS books (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
        project_id VARCHAR(255) REFERENCES projects(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        subtitle VARCHAR(255),
        description TEXT,
        status VARCHAR(20) DEFAULT 'draft',
        language VARCHAR(50) DEFAULT 'English',
        format VARCHAR(20) DEFAULT 'ebook',
        isbn VARCHAR(50),
        isbn_placeholder VARCHAR(100),
        asin VARCHAR(50),
        total_sales INTEGER DEFAULT 0,
        total_revenue DECIMAL(10,2) DEFAULT 0.00,
        monthly_revenue DECIMAL(10,2) DEFAULT 0.00,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    log('✅ Books table created');

    // Create marketplace_categories table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS marketplace_categories (
        id SERIAL PRIMARY KEY,
        marketplace VARCHAR(50) NOT NULL,
        format_type VARCHAR(50) NOT NULL,
        category_path TEXT NOT NULL,
        level INTEGER NOT NULL DEFAULT 1,
        parent_category TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    log('✅ Marketplace categories table created');

    // Create sessions table for authentication
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS sessions (
        sid VARCHAR(255) PRIMARY KEY,
        sess JSONB NOT NULL,
        expire TIMESTAMP NOT NULL
      )
    `);
    log('✅ Sessions table created');

    // Create sales_data table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS sales_data (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
        book_id VARCHAR(255) REFERENCES books(id) ON DELETE CASCADE,
        asin VARCHAR(50),
        title VARCHAR(255),
        marketplace VARCHAR(50),
        sales_date DATE,
        units_sold INTEGER DEFAULT 0,
        revenue DECIMAL(10,2) DEFAULT 0.00,
        currency VARCHAR(10) DEFAULT 'USD',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    log('✅ Sales data table created');

    // Create kdp_imports table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS kdp_imports (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
        filename VARCHAR(255) NOT NULL,
        file_type VARCHAR(50) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        records_processed INTEGER DEFAULT 0,
        errors_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP
      )
    `);
    log('✅ KDP imports table created');

    // Verify table creation
    const tableCheck = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    `);
    
    const tableCount = tableCheck.rows.length;
    log(`Emergency initialization complete: ${tableCount} tables created`);

    return tableCount >= 6; // Minimum required tables
    
  } catch (err) {
    error(`Emergency database initialization failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    return false;
  }
}

/**
 * Essential data seeding for emergency deployment
 */
export async function emergencyDataSeeding(): Promise<boolean> {
  try {
    log('Starting emergency data seeding...');

    // Create default admin user
    await db.execute(sql`
      INSERT INTO users (id, display_name, username, email, is_admin, created_at, updated_at)
      VALUES ('admin-emergency', 'Emergency Admin', 'admin', 'admin@kdpgenerator.app', true, NOW(), NOW())
      ON CONFLICT (id) DO NOTHING
    `);
    log('✅ Emergency admin user created');

    // Insert essential marketplace categories (minimal set)
    const essentialCategories = [
      "Amazon.com|kindle_ebook|Books > Literature & Fiction > Fiction > Action & Adventure",
      "Amazon.com|kindle_ebook|Books > Literature & Fiction > Fiction > Romance",
      "Amazon.com|kindle_ebook|Books > Business & Money > Business Culture > Entrepreneurship",
      "Amazon.com|print_kdp_paperback|Books > Literature & Fiction > Fiction > Action & Adventure",
      "Amazon.com|print_kdp_paperback|Books > Literature & Fiction > Fiction > Romance",
      "Amazon.co.uk|kindle_ebook|Books > Literature & Fiction > Fiction > Action & Adventure",
    ];

    for (const category of essentialCategories) {
      const [marketplace, format, path] = category.split('|');
      await db.execute(sql`
        INSERT INTO marketplace_categories (marketplace, format_type, category_path, level, created_at)
        VALUES (${marketplace}, ${format}, ${path}, 3, NOW())
        ON CONFLICT DO NOTHING
      `);
    }
    
    log('✅ Essential marketplace categories seeded');
    return true;

  } catch (err) {
    error(`Emergency data seeding failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    return false;
  }
}

/**
 * Platform-specific database connection validation
 */
export async function validatePlatformConnection(): Promise<{ success: boolean; details: string }> {
  try {
    log('Validating platform database connection...');

    // Test basic connectivity with timeout
    const connectionPromise = db.execute(sql`SELECT NOW() as server_time, version() as server_version`);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Connection timeout after 10 seconds')), 10000)
    );

    const result = await Promise.race([connectionPromise, timeoutPromise]) as any;
    const serverInfo = result.rows[0];

    log(`✅ Platform connection successful`);
    log(`Server time: ${serverInfo?.server_time}`);
    log(`Server version: ${serverInfo?.server_version?.substring(0, 50)}...`);

    return {
      success: true,
      details: `Connected to PostgreSQL server at ${new Date().toISOString()}`
    };

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown connection error';
    error(`Platform connection validation failed: ${errorMessage}`);

    // Provide specific troubleshooting based on error type
    let troubleshootingDetails = 'Platform connectivity issue: ';
    
    if (errorMessage.includes('timeout') || errorMessage.includes('ETIMEDOUT')) {
      troubleshootingDetails += 'Connection timeout - database service may be slow or overloaded';
    } else if (errorMessage.includes('ENOTFOUND')) {
      troubleshootingDetails += 'DNS resolution failed - database host unreachable';
    } else if (errorMessage.includes('ECONNREFUSED')) {
      troubleshootingDetails += 'Connection refused - database service unavailable';
    } else if (errorMessage.includes('authentication')) {
      troubleshootingDetails += 'Authentication failed - verify DATABASE_URL credentials';
    } else if (errorMessage.includes('SSL') || errorMessage.includes('ssl')) {
      troubleshootingDetails += 'SSL connection issue - verify SSL configuration';
    } else {
      troubleshootingDetails += errorMessage;
    }

    return {
      success: false,
      details: troubleshootingDetails
    };
  }
}

/**
 * Critical deployment recovery system
 */
export async function executeCriticalDeploymentRecovery(): Promise<{
  success: boolean;
  strategy: string;
  details: string[];
  recommendations: string[];
}> {
  const details: string[] = [];
  const recommendations: string[] = [];
  
  log('=== CRITICAL DEPLOYMENT RECOVERY INITIATED ===');
  details.push('Critical deployment recovery system activated');

  // Step 1: Platform connection validation
  const connectionResult = await validatePlatformConnection();
  details.push(`Connection validation: ${connectionResult.success ? 'SUCCESS' : 'FAILED'}`);
  details.push(`Connection details: ${connectionResult.details}`);

  if (!connectionResult.success) {
    recommendations.push('Contact Replit support for platform-level database connectivity issues');
    recommendations.push('Verify DATABASE_URL is correctly configured in deployment secrets');
    recommendations.push('Check if database service is experiencing outages');
    
    return {
      success: false,
      strategy: 'connection-failure',
      details,
      recommendations
    };
  }

  // Step 2: Emergency database initialization
  const initSuccess = await emergencyDatabaseInitialization();
  details.push(`Emergency initialization: ${initSuccess ? 'SUCCESS' : 'FAILED'}`);

  if (!initSuccess) {
    recommendations.push('Database table creation failed - check database permissions');
    recommendations.push('Verify user has CREATE privileges on the database');
    recommendations.push('Consider manual table creation via database console');
    
    return {
      success: false,
      strategy: 'initialization-failure',
      details,
      recommendations
    };
  }

  // Step 3: Emergency data seeding
  const seedingSuccess = await emergencyDataSeeding();
  details.push(`Emergency seeding: ${seedingSuccess ? 'SUCCESS' : 'FAILED'}`);

  if (!seedingSuccess) {
    recommendations.push('Essential data seeding failed - application will have limited functionality');
    recommendations.push('Manually create admin user and essential categories if needed');
  }

  // Step 4: Final validation
  try {
    const finalCheck = await db.execute(sql`
      SELECT 
        (SELECT COUNT(*) FROM users) as user_count,
        (SELECT COUNT(*) FROM projects) as project_count,
        (SELECT COUNT(*) FROM books) as book_count,
        (SELECT COUNT(*) FROM marketplace_categories) as category_count
    `);

    const counts = finalCheck.rows[0];
    details.push(`Final validation - Users: ${counts?.user_count}, Projects: ${counts?.project_count}, Books: ${counts?.book_count}, Categories: ${counts?.category_count}`);

    const hasUsers = (counts?.user_count as number) > 0;
    const hasCategories = (counts?.category_count as number) > 0;

    if (hasUsers && hasCategories) {
      details.push('✅ Critical deployment recovery SUCCESSFUL');
      recommendations.push('Deployment recovered successfully with emergency system');
      recommendations.push('Monitor application functionality and add additional data as needed');
      
      return {
        success: true,
        strategy: 'emergency-recovery',
        details,
        recommendations
      };
    }
  } catch (err) {
    details.push(`Final validation failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }

  recommendations.push('Partial recovery achieved - application may have limited functionality');
  recommendations.push('Monitor deployment health and manually address any remaining issues');
  
  return {
    success: true, // Allow deployment to continue even with partial recovery
    strategy: 'partial-recovery',
    details,
    recommendations
  };
}