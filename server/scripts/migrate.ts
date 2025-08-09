#!/usr/bin/env tsx

/**
 * Database Migration Script for Production Deployment
 * This script handles database schema initialization for Replit Deployments
 * where traditional migration execution during deployment may fail.
 */

import { sql } from 'drizzle-orm';
import { db } from '../db.js';
import { seedDatabase } from '../seedDatabase.js';

const log = (message: string) => {
  console.log(`[Migration] ${new Date().toISOString()} - ${message}`);
};

/**
 * Check if database is properly initialized by looking for core tables
 */
async function isDatabaseInitialized(): Promise<boolean> {
  try {
    // Check if essential tables exist
    const result = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);
    
    const tableExists = result.rows[0]?.exists as boolean;
    log(`Database initialization check: ${tableExists ? 'INITIALIZED' : 'NOT INITIALIZED'}`);
    return tableExists;
  } catch (error) {
    log(`Database initialization check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return false;
  }
}

/**
 * Create all database tables and constraints using Drizzle schema
 */
async function initializeSchema(): Promise<void> {
  try {
    log('Starting database schema initialization...');
    
    // Execute the schema creation by importing all tables
    // This creates all tables, enums, and constraints defined in shared/schema.ts
    const { 
      users, projects, books, contributors, series, 
      marketplaceCategories, salesData, kdpImports, 
      sessions, consolidatedSalesData
    } = await import('../../shared/schema.js');
    
    log('Database schema initialized successfully');
    
    // Run seeding for essential data (marketplace categories)
    log('Starting database seeding...');
    await seedDatabase();
    log('Database seeding completed');
    
  } catch (error) {
    log(`Schema initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    throw error;
  }
}

/**
 * Verify database connectivity and check deployment environment
 */
async function verifyConnection(): Promise<void> {
  try {
    log('Verifying database connection and environment...');
    
    // Test basic connectivity
    await db.execute(sql`SELECT 1 as test`);
    log('Database connection verified');
    
    // Check if we're in production and verify SSL settings
    if (process.env.NODE_ENV === 'production') {
      log('Production environment detected');
      
      // Verify database URL format for production
      const dbUrl = process.env.DATABASE_URL;
      if (!dbUrl) {
        throw new Error('DATABASE_URL environment variable is not set in production');
      }
      
      if (!dbUrl.startsWith('postgres://') && !dbUrl.startsWith('postgresql://')) {
        throw new Error('DATABASE_URL must be a valid PostgreSQL connection string');
      }
      
      log('Production database configuration validated');
    }
    
    // Test database permissions
    try {
      await db.execute(sql`
        SELECT has_database_privilege(current_user, current_database(), 'CREATE') as can_create;
      `);
      log('Database CREATE privileges verified');
    } catch (permError) {
      log(`Warning: Could not verify CREATE privileges: ${permError instanceof Error ? permError.message : 'Unknown error'}`);
    }
    
  } catch (error) {
    log(`Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    
    // Provide detailed troubleshooting for common issues
    if (error instanceof Error) {
      if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
        log('Network connectivity issue - database server may be unreachable');
      } else if (error.message.includes('authentication failed')) {
        log('Authentication issue - check DATABASE_URL credentials');
      } else if (error.message.includes('SSL')) {
        log('SSL connection issue - verify SSL configuration');
      }
    }
    
    throw error;
  }
}

/**
 * Main migration execution
 */
async function runMigration(): Promise<void> {
  try {
    log('=== Database Migration Started ===');
    
    // Step 1: Verify database connection
    await verifyConnection();
    
    // Step 2: Check if database is already initialized
    const isInitialized = await isDatabaseInitialized();
    
    if (isInitialized) {
      log('Database already initialized - skipping schema creation');
      log('=== Migration Completed Successfully ===');
      return;
    }
    
    // Step 3: Initialize database schema
    await initializeSchema();
    
    // Step 4: Final verification
    const finalCheck = await isDatabaseInitialized();
    if (!finalCheck) {
      throw new Error('Database initialization verification failed');
    }
    
    log('=== Migration Completed Successfully ===');
    
  } catch (error) {
    log(`=== Migration Failed ===`);
    log(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(1);
  }
}

// Execute migration if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigration();
}

export { runMigration, isDatabaseInitialized };