import { sql } from 'drizzle-orm';
import {
  index,
  uniqueIndex,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  decimal,
  boolean,
  pgEnum,
  date,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User role enum
export const userRoleEnum = pgEnum("user_role", [
  "user",
  "admin",
  "superadmin"
]);

// User storage table.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: userRoleEnum("role").default("user"),
  subscriptionTier: varchar("subscription_tier").default("free"),
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  isActive: boolean("is_active").default(true),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Project status enum
export const projectStatusEnum = pgEnum("project_status", [
  "draft",
  "in_review", 
  "published",
  "archived"
]);

// Publication format enum
export const formatEnum = pgEnum("format", [
  "ebook",
  "paperback", 
  "hardcover"
]);

// Projects table - Simplified container for books
export const projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(), // Legacy field, maps to name in frontend
  subtitle: text("subtitle"),
  description: text("description"),
  categories: text("categories").array(),
  keywords: text("keywords").array(),
  status: projectStatusEnum("status").default("draft"),
  useAi: boolean("use_ai").default(false),
  aiPrompt: text("ai_prompt"),
  aiContentType: varchar("ai_content_type"),
  formats: text("formats").array(),
  publicationInfo: jsonb("publication_info"),
  coverImageUrl: varchar("cover_image_url"),
  totalSales: integer("total_sales").default(0),
  totalRevenue: decimal("total_revenue", { precision: 10, scale: 2 }).default("0.00"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  language: varchar("language").default("English"),
  seriesTitle: varchar("series_title"),
  seriesNumber: integer("series_number"),
  editionNumber: varchar("edition_number"),
  authorPrefix: varchar("author_prefix"),
  authorFirstName: varchar("author_first_name"),
  authorMiddleName: varchar("author_middle_name"),
  authorLastName: varchar("author_last_name"),
  authorSuffix: varchar("author_suffix"),
  publishingRights: varchar("publishing_rights").default("owned"),
  hasExplicitContent: boolean("has_explicit_content").default(false),
  readingAgeMin: varchar("reading_age_min"),
  readingAgeMax: varchar("reading_age_max"),
  primaryMarketplace: varchar("primary_marketplace").default("Amazon.com"),
  isLowContentBook: boolean("is_low_content_book").default(false),
  isLargePrintBook: boolean("is_large_print_book").default(false),
  publicationDate: date("publication_date"),
  previouslyPublished: boolean("previously_published").default(false),
  previousPublicationDate: date("previous_publication_date"),
  releaseOption: varchar("release_option").default("immediate"),
  scheduledReleaseDate: date("scheduled_release_date"),
  name: text("name"), // New field for simplified projects
});

// Book status enum
export const bookStatusEnum = pgEnum("book_status", [
  "draft",
  "writing",
  "editing", 
  "design",
  "formatting",
  "marketing",
  "in_review",
  "published",
  "archived"
]);

// Books table - Contains all KDP details
export const books = pgTable("books", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  projectId: varchar("project_id").references(() => projects.id, { onDelete: "cascade" }),
  
  // Basic Information
  title: text("title").notNull(),
  subtitle: text("subtitle"),
  description: text("description"),
  categories: text("categories").array(),
  keywords: text("keywords").array(),
  status: bookStatusEnum("status").default("draft"),
  
  // Language and Region
  language: varchar("language").default("English"),
  
  // Series Information
  seriesTitle: varchar("series_title"),
  seriesNumber: integer("series_number"),
  
  // Edition and Version
  editionNumber: varchar("edition_number"),
  
  // Author Information
  authorPrefix: varchar("author_prefix"),
  authorFirstName: varchar("author_first_name"),
  authorMiddleName: varchar("author_middle_name"),
  authorLastName: varchar("author_last_name"),
  authorSuffix: varchar("author_suffix"),
  
  // Publishing Rights
  publishingRights: varchar("publishing_rights").default("owned"), // "owned" or "public_domain"
  
  // Audience Information
  hasExplicitContent: boolean("has_explicit_content").default(false),
  readingAgeMin: varchar("reading_age_min"),
  readingAgeMax: varchar("reading_age_max"),
  
  // Marketplace
  primaryMarketplace: varchar("primary_marketplace").default("Amazon.com"),
  
  // Content Classification
  isLowContentBook: boolean("is_low_content_book").default(false),
  isLargePrintBook: boolean("is_large_print_book").default(false),
  
  // Publication Dates
  publicationDate: date("publication_date"),
  previouslyPublished: boolean("previously_published").default(false),
  previousPublicationDate: date("previous_publication_date"),
  releaseOption: varchar("release_option").default("immediate"), // "immediate" or "scheduled"
  scheduledReleaseDate: date("scheduled_release_date"),
  
  // AI Integration
  useAI: boolean("use_ai").default(false),
  aiPrompt: text("ai_prompt"),
  aiContentType: varchar("ai_content_type"),
  
  // Format and Publication
  format: formatEnum("format").notNull(), // Single format per book
  publicationInfo: jsonb("publication_info"),
  coverImageUrl: varchar("cover_image_url"),
  
  // ISBN Information
  isbn: varchar("isbn").unique(),
  isbnPlaceholder: varchar("isbn_placeholder").unique(),
  
  // Sales tracking
  totalSales: integer("total_sales").default(0),
  totalRevenue: decimal("total_revenue", { precision: 10, scale: 2 }).default("0.00"),
  monthlyRevenue: decimal("monthly_revenue", { precision: 10, scale: 2 }).default("0.00"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Contributors table - Now linked to books
export const contributors = pgTable("contributors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id"), // For database compatibility - can be null
  bookId: varchar("book_id").references(() => books.id, { onDelete: "cascade" }), // Changed to nullable for DB compatibility
  name: text("name").notNull(), // For database compatibility
  role: varchar("role").notNull(), // Author, Editor, Foreword, Illustrator, Introduction, Narrator, Photographer, Preface, Translator, Contributions by
  prefix: varchar("prefix"),
  firstName: varchar("first_name").notNull(),
  middleName: varchar("middle_name"),
  lastName: varchar("last_name").notNull(),
  suffix: varchar("suffix"),
  createdAt: timestamp("created_at").defaultNow(),
});

// KDP Sales Data table - Now linked to books
export const salesData = pgTable("sales_data", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  bookId: varchar("book_id").notNull().references(() => books.id, { onDelete: "cascade" }),
  reportDate: timestamp("report_date").notNull(),
  format: formatEnum("format").notNull(),
  marketplace: varchar("marketplace").notNull(),
  unitsSold: integer("units_sold").default(0),
  revenue: decimal("revenue", { precision: 10, scale: 2 }).default("0.00"),
  royalty: decimal("royalty", { precision: 10, scale: 2 }).default("0.00"),
  fileName: varchar("file_name"),
  createdAt: timestamp("created_at").defaultNow(),
});

// AI Generations table - Can be linked to both projects and books
export const aiGenerations = pgTable("ai_generations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  projectId: varchar("project_id").references(() => projects.id, { onDelete: "cascade" }),
  bookId: varchar("book_id").references(() => books.id, { onDelete: "cascade" }),
  type: varchar("type").notNull(), // structure, description, marketing, chapters
  prompt: text("prompt").notNull(),
  response: text("response").notNull(),
  tokensUsed: integer("tokens_used").default(0),
  model: varchar("model").default("gpt-4o"),
  cost: decimal("cost", { precision: 10, scale: 4 }).default("0.0000"),
  createdAt: timestamp("created_at").defaultNow(),
});

// AI Configuration for different content types
export const aiPromptTemplates = pgTable("ai_prompt_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull().unique(),
  type: varchar("type").notNull(), // "structure", "description", "marketing", etc.
  systemPrompt: text("system_prompt").notNull(),
  userPromptTemplate: text("user_prompt_template").notNull(),
  model: varchar("model").default("gpt-4o"),
  maxTokens: integer("max_tokens").default(2000),
  temperature: decimal("temperature", { precision: 3, scale: 2 }).default("0.7"),
  isActive: boolean("is_active").default(true),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// AI Model Configuration and Pricing
export const aiModels = pgTable("ai_models", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull().unique(), // "gpt-4o", "gpt-4o-mini", etc.
  displayName: varchar("display_name").notNull(),
  provider: varchar("provider").default("openai"),
  inputPricePer1kTokens: decimal("input_price_per_1k_tokens", { precision: 10, scale: 6 }),
  outputPricePer1kTokens: decimal("output_price_per_1k_tokens", { precision: 10, scale: 6 }),
  maxTokens: integer("max_tokens").default(4096),
  contextWindow: integer("context_window").default(128000),
  isAvailable: boolean("is_available").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// AI Usage Limits per subscription tier
export const aiUsageLimits = pgTable("ai_usage_limits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  subscriptionTier: varchar("subscription_tier").notNull().unique(),
  monthlyTokenLimit: integer("monthly_token_limit"),
  dailyRequestLimit: integer("daily_request_limit"),
  maxTokensPerRequest: integer("max_tokens_per_request").default(4000),
  allowedModels: text("allowed_models").array(), // JSON array of allowed model names
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Series table for book series management
export const series = pgTable("series", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  language: varchar("language").notNull().default("english"),
  readingOrder: varchar("reading_order").notNull().default("unordered"), // "ordered" or "unordered"
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Marketplace Categories table for dynamic category loading
export const marketplaceCategories = pgTable("marketplace_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  marketplace: varchar("marketplace").notNull(), // "Amazon.com", "Amazon.co.uk", etc.
  categoryPath: text("category_path").notNull(), // Full path: "Books > Fiction > Romance"
  parentPath: text("parent_path"), // Parent category path if any
  level: integer("level").notNull().default(1), // Hierarchy level (1=root, 2=subcategory, etc.)
  displayName: varchar("display_name").notNull(), // Category name to display
  isSelectable: boolean("is_selectable").default(true), // Can be selected as final category
  sortOrder: integer("sort_order").default(0), // For custom ordering
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});



// Content Recommendations table - AI-powered recommendations for books
export const contentRecommendations = pgTable("content_recommendations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  bookId: varchar("book_id").notNull().references(() => books.id, { onDelete: "cascade" }),
  recommendationType: varchar("recommendation_type").notNull(), // "keywords", "categories", "title", "description", "marketing", "series", "pricing"
  title: varchar("title").notNull(),
  suggestion: text("suggestion").notNull(),
  reasoning: text("reasoning"),
  confidence: decimal("confidence", { precision: 3, scale: 2 }).default("0.5"), // 0-1 confidence score
  isApplied: boolean("is_applied").default(false),
  isUseful: boolean("is_useful"), // User feedback
  metadata: jsonb("metadata"), // Additional data like original values, alternatives, etc.
  aiModel: varchar("ai_model").default("gpt-4o"),
  tokensUsed: integer("tokens_used").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// System configuration table for admin settings
export const systemConfig = pgTable("system_config", {
  key: varchar("key").primaryKey(),
  value: text("value"),
  description: text("description"),
  updatedBy: varchar("updated_by").references(() => users.id),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Admin audit log table
export const adminAuditLog = pgTable("admin_audit_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  action: varchar("action").notNull(), // create, update, delete, login, export
  resource: varchar("resource").notNull(), // user, project, system_config
  resourceId: varchar("resource_id"),
  details: jsonb("details"),
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Blog system tables
export const blogCategories = pgTable("blog_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull().unique(),
  slug: varchar("slug").notNull().unique(),
  description: text("description"),
  color: varchar("color").default("#3B82F6"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const blogPosts = pgTable("blog_posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  slug: varchar("slug").notNull().unique(),
  excerpt: text("excerpt"),
  content: text("content").notNull(),
  featuredImage: varchar("featured_image"),
  authorId: varchar("author_id").notNull().references(() => users.id),
  categoryId: varchar("category_id").references(() => blogCategories.id),
  status: varchar("status").default("draft"), // draft, published, archived
  publishedAt: timestamp("published_at"),
  metaTitle: varchar("meta_title"),
  metaDescription: text("meta_description"),
  tags: text("tags").array(),
  viewCount: integer("view_count").default(0),
  isCommentEnabled: boolean("is_comment_enabled").default(true),
  isFeatured: boolean("is_featured").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const blogComments = pgTable("blog_comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  postId: varchar("post_id").notNull().references(() => blogPosts.id, { onDelete: "cascade" }),
  authorId: varchar("author_id").references(() => users.id),
  authorName: varchar("author_name"),
  authorEmail: varchar("author_email"),
  content: text("content").notNull(),
  status: varchar("status").default("pending"), // pending, approved, rejected, spam
  parentId: varchar("parent_id"),
  isVerified: boolean("is_verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Authors table for managing author profiles and multilingual biographies
export const authors = pgTable("authors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  prefix: varchar("prefix"),
  firstName: varchar("first_name").notNull(),
  middleName: varchar("middle_name"),
  lastName: varchar("last_name").notNull(),
  suffix: varchar("suffix"),
  fullName: varchar("full_name").notNull(), // Computed field for easy searching
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Author biographies table for multilingual content
export const authorBiographies = pgTable("author_biographies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  authorId: varchar("author_id").notNull().references(() => authors.id, { onDelete: "cascade" }),
  language: varchar("language").notNull(), // English, Spanish, German, French, Italian, Portuguese, Japanese
  biography: text("biography"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// KDP Import status enum
export const importStatusEnum = pgEnum("import_status", [
  "pending",
  "processing", 
  "completed",
  "failed"
]);

// KDP Import file type enum
export const importFileTypeEnum = pgEnum("import_file_type", [
  "payments",
  "prior_month_royalties",
  "kenp_read", 
  "dashboard",
  "royalties_estimator",
  "orders",
  "unknown"
]);

// KDP Imports table - Main import tracking
export const kdpImports = pgTable("kdp_imports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  fileName: varchar("file_name").notNull(),
  fileType: varchar("file_type").notNull(), // MIME type
  fileSize: integer("file_size").notNull(), // in bytes
  detectedType: importFileTypeEnum("detected_type"),
  status: importStatusEnum("status").default("pending"),
  progress: integer("progress").default(0), // 0-100 percentage
  totalRecords: integer("total_records").default(0),
  processedRecords: integer("processed_records").default(0),
  errorRecords: integer("error_records").default(0),
  duplicateRecords: integer("duplicate_records").default(0),
  rawData: jsonb("raw_data"), // Store original file data
  mappingConfig: jsonb("mapping_config"), // Column mappings and transformation rules
  errorLog: text("error_log").array().default([]), // Array of error messages
  summary: jsonb("summary"), // Import summary statistics
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// KDP Import Data table - Normalized import data
export const kdpImportData = pgTable("kdp_import_data", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  importId: varchar("import_id").notNull().references(() => kdpImports.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  // Universal identifiers
  asin: varchar("asin"), // Amazon Standard Identification Number
  isbn: varchar("isbn"), // International Standard Book Number
  title: text("title"),
  authorName: varchar("author_name"),
  
  // Sales data
  marketplace: varchar("marketplace"), // Amazon.com, Amazon.co.uk, etc.
  salesDate: date("sales_date"),
  unitsSold: integer("units_sold").default(0),
  unitsRefunded: integer("units_refunded").default(0),
  netUnitsSold: integer("net_units_sold").default(0),
  
  // Financial data  
  currency: varchar("currency"), // USD, EUR, GBP, etc.
  listPrice: decimal("list_price", { precision: 10, scale: 2 }),
  offerPrice: decimal("offer_price", { precision: 10, scale: 2 }),
  royalty: decimal("royalty", { precision: 10, scale: 2 }),
  royaltyRate: varchar("royalty_rate"), // 35%, 70%, etc.
  earnings: decimal("earnings", { precision: 10, scale: 2 }),
  
  // KDP specific data
  kenpRead: integer("kenp_read").default(0), // Kindle Edition Normalized Pages
  transactionType: varchar("transaction_type"), // Standard, Expanded Distribution
  paymentStatus: varchar("payment_status"), // Paid, Pending
  
  // Format information
  format: formatEnum("format"), // ebook, paperback, hardcover
  fileSize: decimal("file_size", { precision: 6, scale: 2 }), // in MB
  deliveryCost: decimal("delivery_cost", { precision: 10, scale: 2 }),
  manufacturingCost: decimal("manufacturing_cost", { precision: 10, scale: 2 }),
  
  // Raw data reference
  rowIndex: integer("row_index"), // Position in original file
  sheetName: varchar("sheet_name"), // Excel sheet name
  rawRowData: jsonb("raw_row_data"), // Original row data for debugging
  
  // Processing metadata
  isProcessed: boolean("is_processed").default(false),
  isDuplicate: boolean("is_duplicate").default(false),
  matchedBookId: varchar("matched_book_id").references(() => books.id),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Table KDP_Royalties_Estimator basée sur l'analyse du fichier réel fourni
export const kdpRoyaltiesEstimatorData = pgTable("kdp_royalties_estimator_data", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  importId: varchar("import_id").notNull().references(() => kdpImports.id, { onDelete: "cascade" }),
  sheetName: varchar("sheet_name").notNull(), // "Combined Sales", "eBook Royalty", "Paperback Royalty", "Hardcover Royalty"
  
  // === CHAMPS COMMUNS À TOUS LES ONGLETS ROYALTY ===
  royaltyDate: varchar("royalty_date"), // "Royalty Date" - présent dans tous les onglets royalty
  title: text("title"), // "Title"
  authorName: varchar("author_name"), // "Author Name"
  marketplace: varchar("marketplace"), // "Marketplace"
  royaltyType: varchar("royalty_type"), // "Royalty Type"
  transactionType: varchar("transaction_type"), // "Transaction Type" - FILTRE: "Free - Promotion" et "Expanded Distribution Channels"
  unitsSold: integer("units_sold"), // "Units Sold"
  unitsRefunded: integer("units_refunded"), // "Units Refunded"
  netUnitsSold: integer("net_units_sold"), // "Net Units Sold"
  avgListPriceWithoutTax: decimal("avg_list_price_without_tax", { precision: 12, scale: 4 }), // "Avg. List Price without tax"
  avgOfferPriceWithoutTax: decimal("avg_offer_price_without_tax", { precision: 12, scale: 4 }), // "Avg. Offer Price without tax"
  royalty: decimal("royalty", { precision: 12, scale: 4 }), // "Royalty"
  currency: varchar("currency"), // "Currency"
  
  // === COLONNES USD CONVERTIES AUTOMATIQUEMENT ===
  avgListPriceWithoutTaxUsd: decimal("avg_list_price_without_tax_usd", { precision: 12, scale: 4 }), // Version USD de "Avg. List Price without tax"
  avgOfferPriceWithoutTaxUsd: decimal("avg_offer_price_without_tax_usd", { precision: 12, scale: 4 }), // Version USD de "Avg. Offer Price without tax"
  royaltyUsd: decimal("royalty_usd", { precision: 12, scale: 4 }), // Version USD de "Royalty"
  
  // === IDENTIFICATEURS PRODUITS (DISTINCTS POUR DÉDUPLICATION) ===
  asin: varchar("asin"), // ASIN pour eBooks (eBook Royalty) et Combined Sales
  isbn: varchar("isbn"), // ISBN pour livres imprimés (Paperback/Hardcover Royalty)
  
  // === CHAMPS SPÉCIFIQUES AUX eBOOKS ===
  avgFileSizeMb: decimal("avg_file_size_mb", { precision: 8, scale: 3 }), // "Avg. File Size (MB)" - eBook seulement
  avgDeliveryCost: decimal("avg_delivery_cost", { precision: 12, scale: 6 }), // "Avg. Delivery Cost" - eBook seulement
  avgDeliveryCostUsd: decimal("avg_delivery_cost_usd", { precision: 12, scale: 6 }), // Version USD de "Avg. Delivery Cost"
  
  // === CHAMPS SPÉCIFIQUES AUX LIVRES IMPRIMÉS ===
  orderDate: varchar("order_date"), // "Order Date" - Paperback/Hardcover seulement
  avgManufacturingCost: decimal("avg_manufacturing_cost", { precision: 12, scale: 4 }), // "Avg. Manufacturing Cost" - Print seulement
  avgManufacturingCostUsd: decimal("avg_manufacturing_cost_usd", { precision: 12, scale: 4 }), // Version USD de "Avg. Manufacturing Cost"
  
  // === MÉTADONNÉES ===
  rowIndex: integer("row_index"), // Position ligne dans le fichier Excel
  rawData: jsonb("raw_data"), // Données brutes pour débogage
  uniqueKey: varchar("unique_key", { length: 50 }), // Clé unique pour déduplication
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  // Index optimisés pour les requêtes de filtrage
  index("idx_kdp_royalties_estimator_import").on(table.importId),
  index("idx_kdp_royalties_estimator_transaction_type").on(table.transactionType), // Pour filtrer "Free - Promotion" et "Expanded Distribution Channels"
  index("idx_kdp_royalties_estimator_sheet").on(table.sheetName),
  index("idx_kdp_royalties_estimator_user_transaction").on(table.userId, table.transactionType),
]);

// Consolidated Sales Data - Table dédiée pour les données consolidées sans duplication
export const consolidatedSalesData = pgTable("consolidated_sales_data", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  // Identifiants uniques
  asin: varchar("asin").notNull(),
  title: text("title").notNull(),
  authorName: varchar("author_name"),
  
  // Données de vente par devise originale
  currency: varchar("currency").notNull(), // Devise originale du fichier
  totalRoyalty: decimal("total_royalty", { precision: 10, scale: 2 }).notNull().default("0.00"),
  totalUnitsSold: integer("total_units_sold").default(0),
  
  // Conversion USD (champ séparé)
  totalRoyaltyUSD: decimal("total_royalty_usd", { precision: 10, scale: 2 }).default("0.00"),
  exchangeRate: decimal("exchange_rate", { precision: 8, scale: 4 }).default("1.0000"), // Taux utilisé pour la conversion
  exchangeRateDate: date("exchange_rate_date"), // Date du taux de change
  
  // Métadonnées
  marketplace: varchar("marketplace"),
  format: formatEnum("format"),
  lastUpdateDate: date("last_update_date"), // Dernière mise à jour des données
  sourceImportIds: text("source_import_ids").array().default([]), // IDs des imports sources pour tracking
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  // Index unique sur ASIN + devise pour éviter les doublons
  index("idx_consolidated_asin_currency").on(table.asin, table.currency, table.userId),
]);

// Master Books Table - Table maître avec ASIN comme discriminant principal
export const masterBooks = pgTable("master_books", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  // Identifiant unique principal
  asin: varchar("asin").notNull(), // Discriminant principal (combiné avec format)
  isbn: varchar("isbn"),
  
  // Informations du livre
  title: text("title").notNull(),
  authorName: varchar("author_name"),
  format: formatEnum("format"),
  
  // Données de vente agrégées (dates de vente, pas de paiement)
  firstSaleDate: date("first_sale_date"), // Première vente enregistrée
  lastSaleDate: date("last_sale_date"), // Dernière vente enregistrée
  totalUnitsSold: integer("total_units_sold").default(0), // Ventes totales de livres
  totalUnitsRefunded: integer("total_units_refunded").default(0),
  netUnitsSold: integer("net_units_sold").default(0),
  
  // KENP (Kindle Edition Normalized Pages) - Pages lues
  totalKenpRead: integer("total_kenp_read").default(0), // Total pages lues KU
  
  // Données financières par devise (devise d'origine)
  totalRoyaltiesOriginal: jsonb("total_royalties_original"), // {"USD": 123.45, "EUR": 67.89}
  totalRoyaltiesUSD: decimal("total_royalties_usd", { precision: 12, scale: 2 }).default("0.00"),
  
  // Répartition par marketplace
  marketplaceBreakdown: jsonb("marketplace_breakdown"), // {"Amazon.com": {...}, "Amazon.fr": {...}}
  
  // Répartition par type de transaction
  salesBreakdown: jsonb("sales_breakdown"), // {"book_sales": {...}, "kenp_reads": {...}}
  
  // Métadonnées de mise à jour
  lastImportDate: date("last_import_date"), // Dernière mise à jour via import
  sourceImportIds: text("source_import_ids").array().default([]), // Tracking des imports sources
  
  // Données de prix (plus récentes)
  currentListPrice: decimal("current_list_price", { precision: 10, scale: 2 }),
  currentOfferPrice: decimal("current_offer_price", { precision: 10, scale: 2 }),
  currentCurrency: varchar("current_currency"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  // Index sur ASIN pour recherches rapides
  index("idx_master_books_asin").on(table.asin),
  index("idx_master_books_user_asin").on(table.userId, table.asin),
  // Contrainte unique sur la combinaison ASIN+Format pour permettre plusieurs formats par ASIN
  uniqueIndex("idx_master_books_asin_format_unique").on(table.asin, table.format),
]);

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  projects: many(projects),
  books: many(books),
  salesData: many(salesData),
  aiGenerations: many(aiGenerations),
  blogPosts: many(blogPosts),
  blogComments: many(blogComments),
  series: many(series),
  authors: many(authors),
  contentRecommendations: many(contentRecommendations),
  kdpImports: many(kdpImports),
  kdpImportData: many(kdpImportData),
  consolidatedSalesData: many(consolidatedSalesData),
  masterBooks: many(masterBooks),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  user: one(users, {
    fields: [projects.userId],
    references: [users.id],
  }),
  books: many(books),
  aiGenerations: many(aiGenerations),
}));

export const booksRelations = relations(books, ({ one, many }) => ({
  user: one(users, {
    fields: [books.userId],
    references: [users.id],
  }),
  project: one(projects, {
    fields: [books.projectId],
    references: [projects.id],
  }),
  contributors: many(contributors),
  salesData: many(salesData),
  aiGenerations: many(aiGenerations),
  contentRecommendations: many(contentRecommendations),
}));

export const contributorsRelations = relations(contributors, ({ one }) => ({
  book: one(books, {
    fields: [contributors.bookId],
    references: [books.id],
  }),
}));

export const salesDataRelations = relations(salesData, ({ one }) => ({
  user: one(users, {
    fields: [salesData.userId],
    references: [users.id],
  }),
  book: one(books, {
    fields: [salesData.bookId],
    references: [books.id],
  }),
}));

export const aiGenerationsRelations = relations(aiGenerations, ({ one }) => ({
  user: one(users, {
    fields: [aiGenerations.userId],
    references: [users.id],
  }),
  project: one(projects, {
    fields: [aiGenerations.projectId],
    references: [projects.id],
  }),
  book: one(books, {
    fields: [aiGenerations.bookId],
    references: [books.id],
  }),
}));

// Blog relations
export const blogCategoriesRelations = relations(blogCategories, ({ many }) => ({
  posts: many(blogPosts),
}));

export const blogPostsRelations = relations(blogPosts, ({ one, many }) => ({
  author: one(users, {
    fields: [blogPosts.authorId],
    references: [users.id],
  }),
  category: one(blogCategories, {
    fields: [blogPosts.categoryId],
    references: [blogCategories.id],
  }),
  comments: many(blogComments),
}));

export const blogCommentsRelations = relations(blogComments, ({ one, many }) => ({
  post: one(blogPosts, {
    fields: [blogComments.postId],
    references: [blogPosts.id],
  }),
  author: one(users, {
    fields: [blogComments.authorId],
    references: [users.id],
  }),
  parent: one(blogComments, {
    fields: [blogComments.parentId],
    references: [blogComments.id],
  }),
  replies: many(blogComments),
}));

export const systemConfigRelations = relations(systemConfig, ({ one }) => ({
  updatedByUser: one(users, {
    fields: [systemConfig.updatedBy],
    references: [users.id],
  }),
}));

export const adminAuditLogRelations = relations(adminAuditLog, ({ one }) => ({
  user: one(users, {
    fields: [adminAuditLog.userId],
    references: [users.id],
  }),
}));

// Author relations
export const authorsRelations = relations(authors, ({ one, many }) => ({
  user: one(users, {
    fields: [authors.userId],
    references: [users.id],
  }),
  biographies: many(authorBiographies),
}));

export const authorBiographiesRelations = relations(authorBiographies, ({ one }) => ({
  author: one(authors, {
    fields: [authorBiographies.authorId],
    references: [authors.id],
  }),
}));

export const seriesRelations = relations(series, ({ one }) => ({
  user: one(users, {
    fields: [series.userId],
    references: [users.id],
  }),
}));

export const contentRecommendationsRelations = relations(contentRecommendations, ({ one }) => ({
  user: one(users, {
    fields: [contentRecommendations.userId],
    references: [users.id],
  }),
  book: one(books, {
    fields: [contentRecommendations.bookId],
    references: [books.id],
  }),
}));

// KDP Import relations
export const kdpImportsRelations = relations(kdpImports, ({ one, many }) => ({
  user: one(users, {
    fields: [kdpImports.userId],
    references: [users.id],
  }),
  importData: many(kdpImportData),
}));

export const kdpImportDataRelations = relations(kdpImportData, ({ one }) => ({
  user: one(users, {
    fields: [kdpImportData.userId],
    references: [users.id],
  }),
  import: one(kdpImports, {
    fields: [kdpImportData.importId],
    references: [kdpImports.id],
  }),
  matchedBook: one(books, {
    fields: [kdpImportData.matchedBookId],
    references: [books.id],
  }),
}));

export const consolidatedSalesDataRelations = relations(consolidatedSalesData, ({ one }) => ({
  user: one(users, {
    fields: [consolidatedSalesData.userId],
    references: [users.id],
  }),
}));

export const masterBooksRelations = relations(masterBooks, ({ one }) => ({
  user: one(users, {
    fields: [masterBooks.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  totalSales: true,
  totalRevenue: true,
});

export const insertBookSchema = createInsertSchema(books).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  totalSales: true,
  totalRevenue: true,
  monthlyRevenue: true,
}).extend({
  contributors: z.array(z.object({
    name: z.string().min(1, "Name is required"),
    role: z.string().min(1, "Role is required"),
    prefix: z.string().optional(),
    firstName: z.string().optional(),
    middleName: z.string().optional(),
    lastName: z.string().optional(),
    suffix: z.string().optional(),
  })).optional(),
});

export const insertContentRecommendationSchema = createInsertSchema(contentRecommendations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertContributorSchema = createInsertSchema(contributors).omit({
  id: true,
  createdAt: true,
});

export const insertSalesDataSchema = createInsertSchema(salesData).omit({
  id: true,
  createdAt: true,
});

export const insertAiGenerationSchema = createInsertSchema(aiGenerations).omit({
  id: true,
  createdAt: true,
});

export const insertAiPromptTemplateSchema = createInsertSchema(aiPromptTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAiModelSchema = createInsertSchema(aiModels).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAiUsageLimitSchema = createInsertSchema(aiUsageLimits).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSystemConfigSchema = createInsertSchema(systemConfig);

export const insertAuditLogSchema = createInsertSchema(adminAuditLog).omit({
  id: true,
  createdAt: true,
});

export const insertMasterBookSchema = createInsertSchema(masterBooks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertConsolidatedSalesDataSchema = createInsertSchema(consolidatedSalesData).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type UpsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Exchange rates table for currency conversion
export const exchangeRates = pgTable("exchange_rates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fromCurrency: varchar("from_currency", { length: 3 }).notNull(),
  toCurrency: varchar("to_currency", { length: 3 }).notNull(),
  rate: decimal("rate", { precision: 12, scale: 6 }).notNull(),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD format
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_exchange_rates_currencies_date").on(table.fromCurrency, table.toCurrency, table.date),
]);

// Cron Jobs Configuration table
export const cronJobsEnum = pgEnum("cron_job_type", [
  "exchange_rates_update",
  "data_cleanup",
  "backup_generation"
]);

export const cronJobs = pgTable("cron_jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jobType: cronJobsEnum("job_type").notNull().unique(),
  name: varchar("name").notNull(),
  description: text("description"),
  enabled: boolean("enabled").default(false),
  intervalHours: decimal("interval_hours", { precision: 10, scale: 2 }).default("24"),
  lastRun: timestamp("last_run"),
  nextRun: timestamp("next_run"),
  lastStatus: varchar("last_status").default("stopped"), // running, stopped, error, completed
  lastError: text("last_error"),
  runCount: integer("run_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Cron Job Logs table
export const cronJobLogs = pgTable("cron_job_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jobId: varchar("job_id").notNull().references(() => cronJobs.id, { onDelete: "cascade" }),
  jobType: cronJobsEnum("job_type").notNull(),
  status: varchar("status").notNull(), // started, completed, failed
  message: text("message"),
  error: text("error"),
  duration: integer("duration_ms"), // Duration in milliseconds
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export type InsertExchangeRate = typeof exchangeRates.$inferInsert;
export type ExchangeRate = typeof exchangeRates.$inferSelect;

// Cron Job types
export type CronJob = typeof cronJobs.$inferSelect;
export type InsertCronJob = typeof cronJobs.$inferInsert;
export type CronJobLog = typeof cronJobLogs.$inferSelect;
export type InsertCronJobLog = typeof cronJobLogs.$inferInsert;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;
export type InsertBook = z.infer<typeof insertBookSchema>;
export type Book = typeof books.$inferSelect;
export type InsertContributor = z.infer<typeof insertContributorSchema>;
export type Contributor = typeof contributors.$inferSelect;
export type InsertSalesData = z.infer<typeof insertSalesDataSchema>;
export type SalesData = typeof salesData.$inferSelect;
export type InsertAiGeneration = z.infer<typeof insertAiGenerationSchema>;
export type AiGeneration = typeof aiGenerations.$inferSelect;
export type InsertAiPromptTemplate = z.infer<typeof insertAiPromptTemplateSchema>;
export type AiPromptTemplate = typeof aiPromptTemplates.$inferSelect;
export type InsertAiModel = z.infer<typeof insertAiModelSchema>;
export type AiModel = typeof aiModels.$inferSelect;
export type InsertAiUsageLimit = z.infer<typeof insertAiUsageLimitSchema>;
export type AiUsageLimit = typeof aiUsageLimits.$inferSelect;
export type InsertContentRecommendation = z.infer<typeof insertContentRecommendationSchema>;
export type ContentRecommendation = typeof contentRecommendations.$inferSelect;
export type InsertSystemConfig = z.infer<typeof insertSystemConfigSchema>;
export type SystemConfig = typeof systemConfig.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof adminAuditLog.$inferSelect;

// Project with relations type
export type ProjectWithRelations = Project & {
  books: Book[];
  user: User;
};

// Book with relations type
export type BookWithRelations = Book & {
  contributors: Contributor[];
  salesData: SalesData[];
  project: Project;
  user: User;
};

// Blog types
export type BlogCategory = typeof blogCategories.$inferSelect;
export type InsertBlogCategory = z.infer<typeof insertBlogCategorySchema>;
export type BlogPost = typeof blogPosts.$inferSelect;
export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;
export type BlogComment = typeof blogComments.$inferSelect;
export type InsertBlogComment = z.infer<typeof insertBlogCommentSchema>;

export const insertSeriesSchema = createInsertSchema(series).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type Series = typeof series.$inferSelect;
export type InsertSeries = z.infer<typeof insertSeriesSchema>;

// Author Zod schemas
export const insertAuthorSchema = createInsertSchema(authors).omit({
  id: true,
  fullName: true,
  createdAt: true,
  updatedAt: true,
});
export type Author = typeof authors.$inferSelect;
export type InsertAuthor = z.infer<typeof insertAuthorSchema>;

export const insertAuthorBiographySchema = createInsertSchema(authorBiographies).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type AuthorBiography = typeof authorBiographies.$inferSelect;
export type InsertAuthorBiography = z.infer<typeof insertAuthorBiographySchema>;

// Master Books types
export type MasterBook = typeof masterBooks.$inferSelect;
export type InsertMasterBook = z.infer<typeof insertMasterBookSchema>;

// Author with relations type
export type AuthorWithRelations = Author & {
  user: User;
  biographies: AuthorBiography[];
};

export const insertMarketplaceCategorySchema = createInsertSchema(marketplaceCategories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type MarketplaceCategory = typeof marketplaceCategories.$inferSelect;
export type InsertMarketplaceCategory = z.infer<typeof insertMarketplaceCategorySchema>;

// Blog Zod schemas
export const insertBlogCategorySchema = createInsertSchema(blogCategories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBlogPostSchema = createInsertSchema(blogPosts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  viewCount: true,
});

export const insertBlogCommentSchema = createInsertSchema(blogComments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Blog post with relations
export type BlogPostWithRelations = BlogPost & {
  author: User;
  category?: BlogCategory;
  comments: BlogComment[];
};

// KDP Import Zod schemas
export const insertKdpImportSchema = createInsertSchema(kdpImports).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  completedAt: true,
});

export const insertKdpImportDataSchema = createInsertSchema(kdpImportData).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// KDP Import types
export type KdpImport = typeof kdpImports.$inferSelect;
export type InsertKdpImport = z.infer<typeof insertKdpImportSchema>;
export type KdpImportData = typeof kdpImportData.$inferSelect;
export type InsertKdpImportData = z.infer<typeof insertKdpImportDataSchema>;

// KDP Import with relations
export type KdpImportWithRelations = KdpImport & {
  user: User;
  importData: KdpImportData[];
};

// KDP Royalties Estimator Data schemas
export const insertKdpRoyaltiesEstimatorDataSchema = createInsertSchema(kdpRoyaltiesEstimatorData).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertKdpRoyaltiesEstimatorData = z.infer<typeof insertKdpRoyaltiesEstimatorDataSchema>;
export type SelectKdpRoyaltiesEstimatorData = typeof kdpRoyaltiesEstimatorData.$inferSelect;

// Cron Job schemas
export const insertCronJobSchema = createInsertSchema(cronJobs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCronJobLogSchema = createInsertSchema(cronJobLogs).omit({
  id: true,
});

// Cron Job with relations
export type CronJobWithLogs = CronJob & {
  logs: CronJobLog[];
};
