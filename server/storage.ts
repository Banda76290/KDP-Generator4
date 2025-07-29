import {
  users,
  projects,
  books,
  contributors,
  salesData,
  aiGenerations,
  systemConfig,
  adminAuditLog,
  blogCategories,
  blogPosts,
  blogComments,
  type User,
  type UpsertUser,
  type Project,
  type InsertProject,
  type ProjectWithRelations,
  type Book,
  type InsertBook,
  type Contributor,
  type InsertContributor,
  type SalesData,
  type InsertSalesData,
  type AiGeneration,
  type InsertAiGeneration,
  type SystemConfig,
  type InsertSystemConfig,
  type AuditLog,
  type InsertAuditLog,
  type BlogCategory,
  type InsertBlogCategory,
  type BlogPost,
  type InsertBlogPost,
  type BlogPostWithRelations,
  type BlogComment,
  type InsertBlogComment,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte, sql, sum, count, like, or } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser & { id: string }): Promise<User>;
  updateUserStripeInfo(userId: string, stripeCustomerId: string, stripeSubscriptionId?: string): Promise<User>;

  // Project operations
  getUserProjects(userId: string): Promise<ProjectWithRelations[]>;
  getProject(projectId: string, userId: string): Promise<ProjectWithRelations | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(projectId: string, userId: string, updates: Partial<InsertProject>): Promise<Project>;
  deleteProject(projectId: string, userId: string): Promise<void>;

  // Book operations
  getUserBooks(userId: string): Promise<Book[]>;
  getBook(bookId: string, userId: string): Promise<Book | undefined>;
  createBook(book: InsertBook): Promise<Book>;
  updateBook(bookId: string, userId: string, updates: Partial<InsertBook>): Promise<Book>;
  deleteBook(bookId: string, userId: string): Promise<void>;

  // Contributor operations
  getBookContributors(bookId: string): Promise<Contributor[]>;
  addContributor(contributor: InsertContributor): Promise<Contributor>;
  removeContributor(contributorId: string, bookId: string): Promise<void>;

  // Sales data operations
  getUserSalesData(userId: string, startDate?: Date, endDate?: Date): Promise<SalesData[]>;
  addSalesData(salesData: InsertSalesData): Promise<SalesData>;
  getUserDashboardStats(userId: string): Promise<{
    activeProjects: number;
    monthlyRevenue: number;
    totalBooksSold: number;
    aiGenerations: number;
    salesOverTime: Array<{ month: string; revenue: number }>;
    formatDistribution: Array<{ format: string; percentage: number }>;
  }>;

  // AI operations
  getUserAiGenerations(userId: string): Promise<AiGeneration[]>;
  addAiGeneration(generation: InsertAiGeneration): Promise<AiGeneration>;

  // Admin operations
  getAllUsers(searchTerm?: string, limit?: number, offset?: number): Promise<{users: User[], total: number}>;
  updateUserRole(userId: string, role: "user" | "admin" | "superadmin"): Promise<User>;
  deactivateUser(userId: string): Promise<User>;
  reactivateUser(userId: string): Promise<User>;
  getAllProjects(limit?: number, offset?: number): Promise<{projects: ProjectWithRelations[], total: number}>;
  getSystemStats(): Promise<{
    totalUsers: number;
    totalProjects: number;
    totalRevenue: number;
    aiGenerationsCount: number;
    activeUsers: number;
    recentSignups: number;
  }>;
  
  // System configuration
  getSystemConfig(): Promise<SystemConfig[]>;
  updateSystemConfig(key: string, value: string, description?: string, updatedBy?: string): Promise<SystemConfig>;
  
  // Audit log
  addAuditLog(log: InsertAuditLog): Promise<AuditLog>;
  getAuditLogs(limit?: number, offset?: number): Promise<{logs: AuditLog[], total: number}>;

  // Blog operations
  getBlogCategories(): Promise<BlogCategory[]>;
  createBlogCategory(category: InsertBlogCategory): Promise<BlogCategory>;
  updateBlogCategory(id: string, category: Partial<InsertBlogCategory>): Promise<BlogCategory>;
  deleteBlogCategory(id: string): Promise<void>;
  
  getBlogPosts(filters?: {
    status?: string;
    search?: string;
    categoryId?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ posts: BlogPostWithRelations[]; total: number }>;
  getBlogPost(id: string): Promise<BlogPostWithRelations | undefined>;
  createBlogPost(post: InsertBlogPost): Promise<BlogPost>;
  updateBlogPost(id: string, post: Partial<InsertBlogPost>): Promise<BlogPost>;
  deleteBlogPost(id: string): Promise<void>;
  updateBlogPostStatus(id: string, status: string): Promise<BlogPost>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser & { id: string }): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserStripeInfo(userId: string, stripeCustomerId: string, stripeSubscriptionId?: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        stripeCustomerId,
        stripeSubscriptionId,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async getUserProjects(userId: string): Promise<ProjectWithRelations[]> {
    // Simple query without relations for now to avoid relation errors
    const userProjects = await db.select().from(projects).where(eq(projects.userId, userId));
    // TODO: Add books relation when books table is properly set up
    return userProjects.map(project => ({
      ...project,
      books: [], // Empty for now, will populate when books API is ready
      user: { id: userId } as User, // Minimal user data
    })) as ProjectWithRelations[];
  }

  async getProject(projectId: string, userId: string): Promise<ProjectWithRelations | undefined> {
    const [project] = await db.select().from(projects).where(and(eq(projects.id, projectId), eq(projects.userId, userId)));
    if (!project) return undefined;
    
    return {
      ...project,
      books: [], // Empty for now, will populate when books API is ready
      user: { id: userId } as User, // Minimal user data
    } as ProjectWithRelations;
  }

  async createProject(project: InsertProject): Promise<Project> {
    const [newProject] = await db.insert(projects).values(project).returning();
    return newProject;
  }

  async updateProject(projectId: string, userId: string, updates: Partial<InsertProject>): Promise<Project> {
    const [updatedProject] = await db
      .update(projects)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
      .returning();
    return updatedProject;
  }

  async deleteProject(projectId: string, userId: string): Promise<void> {
    await db.delete(projects).where(and(eq(projects.id, projectId), eq(projects.userId, userId)));
  }

  // Book operations
  async getUserBooks(userId: string): Promise<Book[]> {
    return await db.select().from(books).where(eq(books.userId, userId)).orderBy(desc(books.updatedAt));
  }

  async getBook(bookId: string, userId: string): Promise<Book | undefined> {
    const [book] = await db.select().from(books).where(and(eq(books.id, bookId), eq(books.userId, userId)));
    return book;
  }

  async createBook(book: InsertBook): Promise<Book> {
    const [newBook] = await db.insert(books).values(book).returning();
    return newBook;
  }

  async updateBook(bookId: string, userId: string, updates: Partial<InsertBook>): Promise<Book> {
    const [updatedBook] = await db
      .update(books)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(books.id, bookId), eq(books.userId, userId)))
      .returning();
    return updatedBook;
  }

  async deleteBook(bookId: string, userId: string): Promise<void> {
    await db.delete(books).where(and(eq(books.id, bookId), eq(books.userId, userId)));
  }

  async getBookContributors(bookId: string): Promise<Contributor[]> {
    return await db.select().from(contributors).where(eq(contributors.bookId, bookId));
  }

  async addContributor(contributor: InsertContributor): Promise<Contributor> {
    const [newContributor] = await db.insert(contributors).values(contributor).returning();
    return newContributor;
  }

  async removeContributor(contributorId: string, bookId: string): Promise<void> {
    await db.delete(contributors).where(
      and(eq(contributors.id, contributorId), eq(contributors.bookId, bookId))
    );
  }

  async getUserSalesData(userId: string, startDate?: Date, endDate?: Date): Promise<SalesData[]> {
    let query;
    
    if (startDate && endDate) {
      query = db.select().from(salesData).where(
        and(
          eq(salesData.userId, userId),
          gte(salesData.reportDate, startDate),
          lte(salesData.reportDate, endDate)
        )
      );
    } else {
      query = db.select().from(salesData).where(eq(salesData.userId, userId));
    }

    return await query.orderBy(desc(salesData.reportDate));
  }

  async addSalesData(data: InsertSalesData): Promise<SalesData> {
    const [newSalesData] = await db.insert(salesData).values(data).returning();
    return newSalesData;
  }

  async getUserDashboardStats(userId: string): Promise<{
    activeProjects: number;
    monthlyRevenue: number;
    totalBooksSold: number;
    aiGenerations: number;
    salesOverTime: Array<{ month: string; revenue: number }>;
    formatDistribution: Array<{ format: string; percentage: number }>;
  }> {
    // Active projects count
    const [activeProjectsResult] = await db
      .select({ count: count() })
      .from(projects)
      .where(and(eq(projects.userId, userId), eq(projects.status, 'published')));

    // Monthly revenue (current month)
    const currentMonth = new Date();
    currentMonth.setDate(1);
    const [monthlyRevenueResult] = await db
      .select({ total: sum(salesData.revenue) })
      .from(salesData)
      .where(and(eq(salesData.userId, userId), gte(salesData.reportDate, currentMonth)));

    // Total books sold
    const [totalSalesResult] = await db
      .select({ total: sum(salesData.unitsSold) })
      .from(salesData)
      .where(eq(salesData.userId, userId));

    // AI generations count
    const [aiGenerationsResult] = await db
      .select({ count: count() })
      .from(aiGenerations)
      .where(eq(aiGenerations.userId, userId));

    // Sales over time (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const salesOverTime = await db
      .select({
        month: sql<string>`TO_CHAR(${salesData.reportDate}, 'Mon')`,
        revenue: sum(salesData.revenue),
      })
      .from(salesData)
      .where(and(eq(salesData.userId, userId), gte(salesData.reportDate, sixMonthsAgo)))
      .groupBy(sql`TO_CHAR(${salesData.reportDate}, 'Mon'), EXTRACT(MONTH FROM ${salesData.reportDate})`)
      .orderBy(sql`EXTRACT(MONTH FROM ${salesData.reportDate})`);

    // Format distribution
    const formatDist = await db
      .select({
        format: salesData.format,
        total: sum(salesData.unitsSold),
      })
      .from(salesData)
      .where(eq(salesData.userId, userId))
      .groupBy(salesData.format);

    const totalSales = formatDist.reduce((acc, item) => acc + Number(item.total || 0), 0);
    const formatDistribution = formatDist.map(item => ({
      format: item.format,
      percentage: totalSales > 0 ? Math.round((Number(item.total || 0) / totalSales) * 100) : 0,
    }));

    return {
      activeProjects: activeProjectsResult.count,
      monthlyRevenue: Number(monthlyRevenueResult.total || 0),
      totalBooksSold: Number(totalSalesResult.total || 0),
      aiGenerations: aiGenerationsResult.count,
      salesOverTime: salesOverTime.map(item => ({
        month: item.month,
        revenue: Number(item.revenue || 0),
      })),
      formatDistribution,
    };
  }

  async getUserAiGenerations(userId: string): Promise<AiGeneration[]> {
    return await db.select().from(aiGenerations).where(eq(aiGenerations.userId, userId)).orderBy(desc(aiGenerations.createdAt));
  }

  async addAiGeneration(generation: InsertAiGeneration): Promise<AiGeneration> {
    const [newGeneration] = await db.insert(aiGenerations).values(generation).returning();
    return newGeneration;
  }

  // Admin operations implementation
  async getAllUsers(searchTerm?: string, limit = 50, offset = 0): Promise<{users: User[], total: number}> {
    let whereCondition;
    if (searchTerm) {
      whereCondition = or(
        like(users.email, `%${searchTerm}%`),
        like(users.firstName, `%${searchTerm}%`),
        like(users.lastName, `%${searchTerm}%`)
      );
    }

    const [userList, totalResult] = await Promise.all([
      db.select().from(users)
        .where(whereCondition)
        .limit(limit)
        .offset(offset)
        .orderBy(desc(users.createdAt)),
      db.select({ count: count() }).from(users).where(whereCondition)
    ]);

    return {
      users: userList,
      total: totalResult[0].count as number
    };
  }

  async updateUserRole(userId: string, role: "user" | "admin" | "superadmin"): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async deactivateUser(userId: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async reactivateUser(userId: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ isActive: true, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async getAllProjects(limit = 50, offset = 0): Promise<{projects: ProjectWithRelations[], total: number}> {
    const [projectList, totalResult] = await Promise.all([
      db.select().from(projects).limit(limit).offset(offset).orderBy(desc(projects.createdAt)),
      db.select({ count: count() }).from(projects)
    ]);

    return {
      projects: projectList.map(project => ({
        ...project,
        books: [],
        user: { id: project.userId } as User,
      })) as ProjectWithRelations[],
      total: totalResult[0].count as number
    };
  }

  async getSystemStats(): Promise<{
    totalUsers: number;
    totalProjects: number;
    totalRevenue: number;
    aiGenerationsCount: number;
    activeUsers: number;
    recentSignups: number;
  }> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      totalUsersResult,
      totalProjectsResult,
      totalRevenueResult,
      aiGenerationsResult,
      activeUsersResult,
      recentSignupsResult,
    ] = await Promise.all([
      db.select({ count: count() }).from(users),
      db.select({ count: count() }).from(projects),
      db.select({ total: sum(salesData.revenue) }).from(salesData),
      db.select({ count: count() }).from(aiGenerations),
      db.select({ count: count() }).from(users).where(eq(users.isActive, true)),
      db.select({ count: count() }).from(users).where(gte(users.createdAt, thirtyDaysAgo)),
    ]);

    return {
      totalUsers: totalUsersResult[0].count as number,
      totalProjects: totalProjectsResult[0].count as number,
      totalRevenue: Number(totalRevenueResult[0].total || 0),
      aiGenerationsCount: aiGenerationsResult[0].count as number,
      activeUsers: activeUsersResult[0].count as number,
      recentSignups: recentSignupsResult[0].count as number,
    };
  }

  async getSystemConfig(): Promise<SystemConfig[]> {
    return await db.select().from(systemConfig).orderBy(systemConfig.key);
  }

  async updateSystemConfig(key: string, value: string, description?: string, updatedBy?: string): Promise<SystemConfig> {
    const [config] = await db
      .insert(systemConfig)
      .values({ key, value, description, updatedBy, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: systemConfig.key,
        set: { value, description, updatedBy, updatedAt: new Date() }
      })
      .returning();
    return config;
  }

  async addAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    const [auditLog] = await db.insert(adminAuditLog).values(log).returning();
    return auditLog;
  }

  async getAuditLogs(limit = 100, offset = 0): Promise<{logs: AuditLog[], total: number}> {
    const [logs, totalResult] = await Promise.all([
      db.query.adminAuditLog.findMany({
        with: { user: true },
        limit,
        offset,
        orderBy: [desc(adminAuditLog.createdAt)],
      }),
      db.select({ count: count() }).from(adminAuditLog)
    ]);

    return {
      logs: logs as AuditLog[],
      total: totalResult[0].count as number
    };
  }

  // Blog operations
  async getBlogCategories(): Promise<BlogCategory[]> {
    return await db.select().from(blogCategories).orderBy(blogCategories.name);
  }

  async createBlogCategory(category: InsertBlogCategory): Promise<BlogCategory> {
    const [newCategory] = await db.insert(blogCategories).values(category).returning();
    return newCategory;
  }

  async updateBlogCategory(id: string, categoryData: Partial<InsertBlogCategory>): Promise<BlogCategory> {
    const [updatedCategory] = await db
      .update(blogCategories)
      .set({ ...categoryData, updatedAt: new Date() })
      .where(eq(blogCategories.id, id))
      .returning();
    return updatedCategory;
  }

  async deleteBlogCategory(id: string): Promise<void> {
    await db.delete(blogCategories).where(eq(blogCategories.id, id));
  }

  async getBlogPosts(filters?: {
    status?: string;
    search?: string;
    categoryId?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ posts: BlogPostWithRelations[]; total: number }> {
    const limit = filters?.limit || 20;
    const offset = filters?.offset || 0;

    let whereConditions = [];

    if (filters?.status && filters.status !== "all") {
      whereConditions.push(eq(blogPosts.status, filters.status));
    }

    if (filters?.search) {
      whereConditions.push(
        or(
          like(blogPosts.title, `%${filters.search}%`),
          like(blogPosts.content, `%${filters.search}%`)
        )
      );
    }

    if (filters?.categoryId) {
      whereConditions.push(eq(blogPosts.categoryId, filters.categoryId));
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    const [posts, totalResult] = await Promise.all([
      db.query.blogPosts.findMany({
        where: whereClause,
        with: {
          author: true,
          category: true,
          comments: true,
        },
        limit,
        offset,
        orderBy: [desc(blogPosts.createdAt)],
      }),
      db.select({ count: count() }).from(blogPosts).where(whereClause)
    ]);

    return {
      posts: posts as BlogPostWithRelations[],
      total: totalResult[0].count as number
    };
  }

  async getBlogPost(id: string): Promise<BlogPostWithRelations | undefined> {
    const post = await db.query.blogPosts.findFirst({
      where: eq(blogPosts.id, id),
      with: {
        author: true,
        category: true,
        comments: true,
      },
    });
    return post as BlogPostWithRelations | undefined;
  }

  async createBlogPost(post: InsertBlogPost): Promise<BlogPost> {
    const [newPost] = await db.insert(blogPosts).values(post).returning();
    return newPost;
  }

  async updateBlogPost(id: string, postData: Partial<InsertBlogPost>): Promise<BlogPost> {
    const [updatedPost] = await db
      .update(blogPosts)
      .set({ ...postData, updatedAt: new Date() })
      .where(eq(blogPosts.id, id))
      .returning();
    return updatedPost;
  }

  async deleteBlogPost(id: string): Promise<void> {
    await db.delete(blogPosts).where(eq(blogPosts.id, id));
  }

  async updateBlogPostStatus(id: string, status: string): Promise<BlogPost> {
    const [updatedPost] = await db
      .update(blogPosts)
      .set({ 
        status, 
        publishedAt: status === "published" ? new Date() : null,
        updatedAt: new Date() 
      })
      .where(eq(blogPosts.id, id))
      .returning();
    return updatedPost;
  }
}

export const storage = new DatabaseStorage();
