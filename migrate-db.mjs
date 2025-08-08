#!/usr/bin/env node
import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { sql } from 'drizzle-orm';
import ws from 'ws';

const neonConfig = await import('@neondatabase/serverless');
neonConfig.neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL must be set');
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle({ client: pool });

console.log('🔄 Starting database migration...');

try {
  // Create enums first
  console.log('📦 Creating enums...');
  try {
    await db.execute(sql`CREATE TYPE "user_role" AS ENUM('user', 'admin', 'superadmin');`);
  } catch (e) { /* ignore if exists */ }
  try {
    await db.execute(sql`CREATE TYPE "project_status" AS ENUM('draft', 'in_review', 'published', 'archived');`);
  } catch (e) { /* ignore if exists */ }
  try {
    await db.execute(sql`CREATE TYPE "format" AS ENUM('ebook', 'paperback', 'hardcover');`);
  } catch (e) { /* ignore if exists */ }
  try {
    await db.execute(sql`CREATE TYPE "book_status" AS ENUM('draft', 'writing', 'editing', 'design', 'formatting', 'marketing', 'in_review', 'published', 'archived');`);
  } catch (e) { /* ignore if exists */ }
  try {
    await db.execute(sql`CREATE TYPE "cron_job_type" AS ENUM('exchange_rates_update', 'data_cleanup', 'backup_generation');`);
  } catch (e) { /* ignore if exists */ }

  // Create basic tables
  console.log('📦 Creating core tables...');
  
  // Users table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "users" (
      "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
      "email" varchar UNIQUE,
      "first_name" varchar,
      "last_name" varchar,
      "profile_image_url" varchar,
      "role" "user_role" DEFAULT 'user',
      "subscription_tier" varchar DEFAULT 'free',
      "stripe_customer_id" varchar,
      "stripe_subscription_id" varchar,
      "is_active" boolean DEFAULT true,
      "last_login_at" timestamp,
      "created_at" timestamp DEFAULT now(),
      "updated_at" timestamp DEFAULT now()
    );
  `);

  // Sessions table for auth
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "sessions" (
      "sid" varchar PRIMARY KEY,
      "sess" jsonb NOT NULL,
      "expire" timestamp NOT NULL
    );
    CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "sessions" ("expire");
  `);

  // Projects table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "projects" (
      "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
      "user_id" varchar NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
      "title" text NOT NULL,
      "subtitle" text,
      "description" text,
      "categories" text[],
      "keywords" text[],
      "status" "project_status" DEFAULT 'draft',
      "use_ai" boolean DEFAULT false,
      "ai_prompt" text,
      "ai_content_type" varchar,
      "formats" text[],
      "publication_info" jsonb,
      "cover_image_url" varchar,
      "total_sales" integer DEFAULT 0,
      "total_revenue" decimal(10,2) DEFAULT 0.00,
      "created_at" timestamp DEFAULT now(),
      "updated_at" timestamp DEFAULT now(),
      "language" varchar DEFAULT 'English',
      "series_title" varchar,
      "series_number" integer,
      "edition_number" varchar,
      "author_prefix" varchar,
      "author_first_name" varchar,
      "author_middle_name" varchar,
      "author_last_name" varchar,
      "author_suffix" varchar,
      "publishing_rights" varchar DEFAULT 'owned',
      "has_explicit_content" boolean DEFAULT false,
      "reading_age_min" varchar,
      "reading_age_max" varchar,
      "primary_marketplace" varchar DEFAULT 'Amazon.com',
      "is_low_content_book" boolean DEFAULT false,
      "is_large_print_book" boolean DEFAULT false,
      "publication_date" date,
      "previously_published" boolean DEFAULT false,
      "previous_publication_date" date,
      "release_option" varchar DEFAULT 'immediate',
      "scheduled_release_date" date,
      "name" text
    );
  `);

  // Books table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "books" (
      "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
      "user_id" varchar NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
      "project_id" varchar REFERENCES "projects"("id") ON DELETE CASCADE,
      "title" text NOT NULL,
      "subtitle" text,
      "description" text,
      "categories" text[],
      "keywords" text[],
      "status" "book_status" DEFAULT 'draft',
      "language" varchar DEFAULT 'English',
      "series_title" varchar,
      "series_number" integer,
      "edition_number" varchar,
      "author_prefix" varchar,
      "author_first_name" varchar,
      "author_middle_name" varchar,
      "author_last_name" varchar,
      "author_suffix" varchar,
      "publishing_rights" varchar DEFAULT 'owned',
      "has_explicit_content" boolean DEFAULT false,
      "reading_age_min" varchar,
      "reading_age_max" varchar,
      "primary_marketplace" varchar DEFAULT 'Amazon.com',
      "is_low_content_book" boolean DEFAULT false,
      "is_large_print_book" boolean DEFAULT false,
      "publication_date" date,
      "previously_published" boolean DEFAULT false,
      "previous_publication_date" date,
      "release_option" varchar DEFAULT 'immediate',
      "scheduled_release_date" date,
      "use_ai" boolean DEFAULT false,
      "ai_prompt" text,
      "ai_content_type" varchar,
      "format" "format" DEFAULT 'ebook',
      "publication_info" jsonb,
      "cover_image_url" varchar,
      "isbn" varchar,
      "isbn_placeholder" varchar,
      "asin" varchar,
      "total_sales" integer DEFAULT 0,
      "total_revenue" decimal(10,2) DEFAULT 0.00,
      "monthly_revenue" decimal(10,2) DEFAULT 0.00,
      "created_at" timestamp DEFAULT now(),
      "updated_at" timestamp DEFAULT now()
    );
  `);

  // Import file type and status enums
  try {
    await db.execute(sql`CREATE TYPE "import_file_type" AS ENUM('sales_data', 'royalty_payments', 'advertisement_report', 'other');`);
  } catch (e) { /* ignore if exists */ }
  try {
    await db.execute(sql`CREATE TYPE "import_status" AS ENUM('pending', 'processing', 'completed', 'failed', 'cancelled');`);
  } catch (e) { /* ignore if exists */ }

  // KDP imports table (complete)
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "kdp_imports" (
      "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
      "user_id" varchar NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
      "file_name" varchar NOT NULL,
      "file_type" varchar NOT NULL,
      "file_size" integer NOT NULL,
      "detected_type" "import_file_type",
      "status" "import_status" DEFAULT 'pending',
      "progress" integer DEFAULT 0,
      "total_records" integer DEFAULT 0,
      "processed_records" integer DEFAULT 0,
      "error_records" integer DEFAULT 0,
      "duplicate_records" integer DEFAULT 0,
      "raw_data" jsonb,
      "mapping_config" jsonb,
      "error_log" text[] DEFAULT '{}',
      "summary" jsonb,
      "created_at" timestamp DEFAULT now(),
      "updated_at" timestamp DEFAULT now(),
      "completed_at" timestamp
    );
  `);

  // Sales data table  
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "sales_data" (
      "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
      "user_id" varchar NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
      "book_id" varchar NOT NULL REFERENCES "books"("id") ON DELETE CASCADE,
      "report_date" timestamp NOT NULL,
      "format" "format" NOT NULL,
      "marketplace" varchar NOT NULL,
      "units_sold" integer DEFAULT 0,
      "revenue" decimal(10,2) DEFAULT 0.00,
      "royalty" decimal(10,2) DEFAULT 0.00,
      "file_name" varchar,
      "created_at" timestamp DEFAULT now()
    );
  `);

  // Contributors table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "contributors" (
      "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
      "project_id" varchar,
      "book_id" varchar REFERENCES "books"("id") ON DELETE CASCADE,
      "name" text NOT NULL,
      "role" varchar NOT NULL,
      "prefix" varchar,
      "first_name" varchar NOT NULL,
      "middle_name" varchar,
      "last_name" varchar NOT NULL,
      "suffix" varchar,
      "created_at" timestamp DEFAULT now()
    );
  `);

  // Marketplace categories table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "marketplace_categories" (
      "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
      "marketplace" varchar NOT NULL,
      "category_path" text NOT NULL,
      "parent_path" text,
      "level" integer NOT NULL DEFAULT 1,
      "display_name" varchar NOT NULL,
      "is_selectable" boolean DEFAULT true,
      "sort_order" integer DEFAULT 0,
      "is_active" boolean DEFAULT true,
      "created_at" timestamp DEFAULT now(),
      "updated_at" timestamp DEFAULT now()
    );
  `);

  // Cron jobs table  
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "cron_jobs" (
      "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
      "job_type" "cron_job_type" NOT NULL UNIQUE,
      "name" varchar NOT NULL,
      "description" text,
      "enabled" boolean DEFAULT false,
      "interval_hours" decimal(10,2) DEFAULT 24,
      "last_run" timestamp,
      "next_run" timestamp,
      "last_status" varchar DEFAULT 'stopped',
      "last_error" text,
      "run_count" integer DEFAULT 0,
      "created_at" timestamp DEFAULT now(),
      "updated_at" timestamp DEFAULT now()
    );
  `);
  
  console.log('✅ Database migration completed successfully!');
  process.exit(0);
} catch (error) {
  console.error('❌ Migration failed:', error);
  process.exit(1);
}