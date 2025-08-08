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

console.log('🔄 Creating all missing tables...');

try {
  // AI Generations table
  console.log('📦 Creating ai_generations table...');
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "ai_generations" (
      "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
      "user_id" varchar NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
      "project_id" varchar REFERENCES "projects"("id") ON DELETE CASCADE,
      "book_id" varchar REFERENCES "books"("id") ON DELETE CASCADE,
      "prompt_text" text NOT NULL,
      "generated_content" text,
      "content_type" varchar NOT NULL,
      "status" varchar DEFAULT 'pending',
      "tokens_used" integer DEFAULT 0,
      "model_used" varchar,
      "generation_time_ms" integer,
      "error_message" text,
      "metadata" jsonb,
      "created_at" timestamp DEFAULT now(),
      "updated_at" timestamp DEFAULT now()
    );
  `);

  // KDP Import Data table
  console.log('📦 Creating kdp_import_data table...');
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "kdp_import_data" (
      "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
      "import_id" varchar NOT NULL REFERENCES "kdp_imports"("id") ON DELETE CASCADE,
      "user_id" varchar NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
      "asin" varchar,
      "isbn" varchar,
      "title" text,
      "author_name" varchar,
      "marketplace" varchar,
      "sales_date" date,
      "units_sold" integer DEFAULT 0,
      "units_refunded" integer DEFAULT 0,
      "net_units_sold" integer DEFAULT 0,
      "currency" varchar,
      "list_price" decimal(10,2),
      "offer_price" decimal(10,2),
      "royalty" decimal(10,2),
      "royalty_rate" varchar,
      "earnings" decimal(10,2),
      "kenp_read" integer DEFAULT 0,
      "transaction_type" varchar,
      "payment_status" varchar,
      "format" varchar,
      "file_size" decimal(6,2),
      "delivery_cost" decimal(10,2),
      "manufacturing_cost" decimal(10,2),
      "row_index" integer,
      "sheet_name" varchar,
      "raw_row_data" jsonb,
      "is_processed" boolean DEFAULT false,
      "is_duplicate" boolean DEFAULT false,
      "matched_book_id" varchar REFERENCES "books"("id"),
      "created_at" timestamp DEFAULT now()
    );
  `);

  // Consolidated Sales Data table
  console.log('📦 Creating consolidated_sales_data table...');
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "consolidated_sales_data" (
      "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
      "user_id" varchar NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
      "period_start" date NOT NULL,
      "period_end" date NOT NULL,
      "currency" varchar NOT NULL,
      "marketplace" varchar NOT NULL,
      "total_earnings" decimal(15,2) NOT NULL DEFAULT 0,
      "total_earnings_usd" decimal(15,2) NOT NULL DEFAULT 0,
      "exchange_rate" decimal(10,6),
      "payment_count" integer DEFAULT 0,
      "source_imports" text[] DEFAULT '{}',
      "created_at" timestamp DEFAULT now(),
      "updated_at" timestamp DEFAULT now()
    );
  `);

  // AI Prompts table
  console.log('📦 Creating ai_prompts table...');
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "ai_prompts" (
      "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
      "name" varchar NOT NULL,
      "description" text,
      "category" varchar NOT NULL,
      "prompt_template" text NOT NULL,
      "variables" jsonb DEFAULT '[]',
      "model_config" jsonb,
      "is_active" boolean DEFAULT true,
      "usage_count" integer DEFAULT 0,
      "created_at" timestamp DEFAULT now(),
      "updated_at" timestamp DEFAULT now()
    );
  `);

  // Blog Categories table  
  console.log('📦 Creating blog_categories table...');
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "blog_categories" (
      "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
      "name" varchar NOT NULL,
      "slug" varchar NOT NULL UNIQUE,
      "description" text,
      "color" varchar DEFAULT '#3b82f6',
      "is_active" boolean DEFAULT true,
      "post_count" integer DEFAULT 0,
      "created_at" timestamp DEFAULT now(),
      "updated_at" timestamp DEFAULT now()
    );
  `);

  // Blog Posts table
  console.log('📦 Creating blog_posts table...');
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "blog_posts" (
      "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
      "title" varchar NOT NULL,
      "slug" varchar NOT NULL UNIQUE,
      "excerpt" text,
      "content" text NOT NULL,
      "featured_image" varchar,
      "author_id" varchar NOT NULL REFERENCES "users"("id"),
      "category_id" varchar REFERENCES "blog_categories"("id"),
      "status" varchar DEFAULT 'draft',
      "published_at" timestamp,
      "meta_title" varchar,
      "meta_description" text,
      "tags" text[] DEFAULT '{}',
      "view_count" integer DEFAULT 0,
      "is_comment_enabled" boolean DEFAULT true,
      "is_featured" boolean DEFAULT false,
      "created_at" timestamp DEFAULT now(),
      "updated_at" timestamp DEFAULT now()
    );
  `);

  // Blog Comments table
  console.log('📦 Creating blog_comments table...');
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "blog_comments" (
      "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
      "post_id" varchar NOT NULL REFERENCES "blog_posts"("id") ON DELETE CASCADE,
      "author_id" varchar REFERENCES "users"("id"),
      "author_name" varchar,
      "author_email" varchar,
      "content" text NOT NULL,
      "status" varchar DEFAULT 'pending',
      "parent_id" varchar,
      "is_verified" boolean DEFAULT false,
      "created_at" timestamp DEFAULT now(),
      "updated_at" timestamp DEFAULT now()
    );
  `);

  // Authors table
  console.log('📦 Creating authors table...');
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "authors" (
      "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
      "user_id" varchar NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
      "prefix" varchar,
      "first_name" varchar NOT NULL,
      "middle_name" varchar,
      "last_name" varchar NOT NULL,
      "suffix" varchar,
      "full_name" varchar NOT NULL,
      "profile_image_url" varchar,
      "is_active" boolean DEFAULT true,
      "created_at" timestamp DEFAULT now(),
      "updated_at" timestamp DEFAULT now()
    );
  `);

  // Author Biographies table
  console.log('📦 Creating author_biographies table...');
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "author_biographies" (
      "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
      "author_id" varchar NOT NULL REFERENCES "authors"("id") ON DELETE CASCADE,
      "language" varchar NOT NULL,
      "biography" text,
      "created_at" timestamp DEFAULT now(),
      "updated_at" timestamp DEFAULT now()
    );
  `);

  console.log('✅ All tables created successfully!');
  process.exit(0);
} catch (error) {
  console.error('❌ Migration failed:', error);
  process.exit(1);
}