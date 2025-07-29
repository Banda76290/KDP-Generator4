import { sql } from 'drizzle-orm';
import {
  index,
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
  name: text("name").notNull(),
  description: text("description"),
  status: projectStatusEnum("status").default("draft"),
  totalSales: integer("total_sales").default(0),
  totalRevenue: decimal("total_revenue", { precision: 10, scale: 2 }).default("0.00"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
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
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  
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
  bookId: varchar("book_id").notNull().references(() => books.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  role: varchar("role").notNull(), // author, co-author, editor, illustrator
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

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  projects: many(projects),
  books: many(books),
  salesData: many(salesData),
  aiGenerations: many(aiGenerations),
  blogPosts: many(blogPosts),
  blogComments: many(blogComments),
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

// Types
export type UpsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
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
