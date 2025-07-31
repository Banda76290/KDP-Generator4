import { readFileSync } from 'fs';
import { db } from './db.js';
import { marketplaceCategories } from '@shared/schema';
import { sql } from 'drizzle-orm';

/**
 * Seeds the database with initial data required for the application
 * This runs automatically during deployment and on first startup
 */
export async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Check if categories already exist
    const existingCategories = await db.select().from(marketplaceCategories).limit(1);
    
    if (existingCategories.length > 0) {
      console.log('✅ Database already seeded, skipping...');
      return;
    }
    
    console.log('📦 Seeding marketplace categories...');
    
    // Read and execute the SQL file
    const sqlContent = readFileSync('./complete-categories.sql', 'utf-8');
    
    // Split SQL into individual statements and execute them
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    for (const statement of statements) {
      if (statement.trim()) {
        await db.execute(sql.raw(statement));
      }
    }
    
    // Verify seeding
    const categoryCount = await db.select().from(marketplaceCategories);
    console.log(`✅ Successfully seeded ${categoryCount.length} marketplace categories`);
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    // Don't throw error to prevent app from crashing
    // Log and continue - the app can still function without categories
  }
}

/**
 * Force re-seed the database (useful for development/updates)
 */
export async function forceSeedDatabase() {
  try {
    console.log('🔄 Force re-seeding database...');
    
    // Clear existing categories
    await db.delete(marketplaceCategories);
    console.log('🗑️ Cleared existing categories');
    
    // Re-seed
    await seedDatabase();
    
  } catch (error) {
    console.error('❌ Error force re-seeding database:', error);
    throw error;
  }
}