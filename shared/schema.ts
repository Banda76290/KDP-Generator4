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

// Projects table
export const projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  subtitle: text("subtitle"),
  description: text("description"),
  categories: text("categories").array(),
  keywords: text("keywords").array(),
  status: projectStatusEnum("status").default("draft"),
  
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
  
  // Original fields
  formats: formatEnum("formats").array(),
  publicationInfo: jsonb("publication_info"),
  coverImageUrl: varchar("cover_image_url"),
  totalSales: integer("total_sales").default(0),
  totalRevenue: decimal("total_revenue", { precision: 10, scale: 2 }).default("0.00"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Contributors table
export const contributors = pgTable("contributors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  role: varchar("role").notNull(), // author, co-author, editor, illustrator
  createdAt: timestamp("created_at").defaultNow(),
});

// KDP Sales Data table
export const salesData = pgTable("sales_data", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  projectId: varchar("project_id").references(() => projects.id, { onDelete: "cascade" }),
  reportDate: timestamp("report_date").notNull(),
  format: formatEnum("format").notNull(),
  marketplace: varchar("marketplace").notNull(),
  unitsSold: integer("units_sold").default(0),
  revenue: decimal("revenue", { precision: 10, scale: 2 }).default("0.00"),
  royalty: decimal("royalty", { precision: 10, scale: 2 }).default("0.00"),
  fileName: varchar("file_name"),
  createdAt: timestamp("created_at").defaultNow(),
});

// AI Generations table
export const aiGenerations = pgTable("ai_generations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  projectId: varchar("project_id").references(() => projects.id, { onDelete: "cascade" }),
  type: varchar("type").notNull(), // structure, description, marketing, chapters
  prompt: text("prompt").notNull(),
  response: text("response").notNull(),
  tokensUsed: integer("tokens_used").default(0),
  createdAt: timestamp("created_at").defaultNow(),
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

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  projects: many(projects),
  salesData: many(salesData),
  aiGenerations: many(aiGenerations),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  user: one(users, {
    fields: [projects.userId],
    references: [users.id],
  }),
  contributors: many(contributors),
  salesData: many(salesData),
  aiGenerations: many(aiGenerations),
}));

export const contributorsRelations = relations(contributors, ({ one }) => ({
  project: one(projects, {
    fields: [contributors.projectId],
    references: [projects.id],
  }),
}));

export const salesDataRelations = relations(salesData, ({ one }) => ({
  user: one(users, {
    fields: [salesData.userId],
    references: [users.id],
  }),
  project: one(projects, {
    fields: [salesData.projectId],
    references: [projects.id],
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
export type InsertContributor = z.infer<typeof insertContributorSchema>;
export type Contributor = typeof contributors.$inferSelect;
export type InsertSalesData = z.infer<typeof insertSalesDataSchema>;
export type SalesData = typeof salesData.$inferSelect;
export type InsertAiGeneration = z.infer<typeof insertAiGenerationSchema>;
export type AiGeneration = typeof aiGenerations.$inferSelect;
export type InsertSystemConfig = z.infer<typeof insertSystemConfigSchema>;
export type SystemConfig = typeof systemConfig.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof adminAuditLog.$inferSelect;

// Project with relations type
export type ProjectWithRelations = Project & {
  contributors: Contributor[];
  salesData: SalesData[];
  user: User;
};
