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
    
    console.log('🔧 Fixing category level mapping for frontend compatibility...');
    
    // Fix the level mapping issue: discriminants (kindle_ebook/print_kdp_paperback) should not offset levels
    // The frontend expects main categories to start at level 2, but discriminants create an offset
    
    // Step 1: Reduce levels by 1 for all categories that come after discriminants
    await db.execute(sql.raw(`
      UPDATE marketplace_categories 
      SET level = level - 1 
      WHERE level > 2 
      AND (category_path LIKE 'Books > kindle_ebook > %' OR category_path LIKE 'Books > print_kdp_paperback > %')
    `));
    
    // Step 2: Update parent paths to remove the intermediate discriminant level
    await db.execute(sql.raw(`
      UPDATE marketplace_categories 
      SET parent_path = CASE
        WHEN parent_path = 'Books > kindle_ebook' THEN NULL
        WHEN parent_path = 'Books > print_kdp_paperback' THEN NULL
        WHEN parent_path LIKE 'Books > kindle_ebook > %' THEN 
          SUBSTRING(parent_path FROM POSITION(' > ' IN SUBSTRING(parent_path FROM 18)) + 18)
        WHEN parent_path LIKE 'Books > print_kdp_paperback > %' THEN 
          SUBSTRING(parent_path FROM POSITION(' > ' IN SUBSTRING(parent_path FROM 24)) + 24)
        ELSE parent_path
      END
      WHERE (category_path LIKE 'Books > kindle_ebook > %' OR category_path LIKE 'Books > print_kdp_paperback > %')
    `));
    
    // Step 3: Update category paths to remove discriminant for actual categories
    await db.execute(sql.raw(`
      UPDATE marketplace_categories 
      SET category_path = CASE
        WHEN category_path LIKE 'Books > kindle_ebook > %' THEN 
          'Books > ' || SUBSTRING(category_path FROM 18)
        WHEN category_path LIKE 'Books > print_kdp_paperback > %' THEN 
          'Books > ' || SUBSTRING(category_path FROM 24)
        ELSE category_path
      END
      WHERE (category_path LIKE 'Books > kindle_ebook > %' OR category_path LIKE 'Books > print_kdp_paperback > %')
    `));
    
    // Verify seeding
    const categoryCount = await db.select().from(marketplaceCategories);
    console.log(`✅ Successfully seeded ${categoryCount.length} marketplace categories with corrected level mapping`);
    
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