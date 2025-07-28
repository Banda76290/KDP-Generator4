import {
  users,
  projects,
  contributors,
  salesData,
  aiGenerations,
  type User,
  type UpsertUser,
  type Project,
  type InsertProject,
  type ProjectWithRelations,
  type Contributor,
  type InsertContributor,
  type SalesData,
  type InsertSalesData,
  type AiGeneration,
  type InsertAiGeneration,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte, sql, sum, count } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserStripeInfo(userId: string, stripeCustomerId: string, stripeSubscriptionId?: string): Promise<User>;

  // Project operations
  getUserProjects(userId: string): Promise<ProjectWithRelations[]>;
  getProject(projectId: string, userId: string): Promise<ProjectWithRelations | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(projectId: string, userId: string, updates: Partial<InsertProject>): Promise<Project>;
  deleteProject(projectId: string, userId: string): Promise<void>;

  // Contributor operations
  getProjectContributors(projectId: string): Promise<Contributor[]>;
  addContributor(contributor: InsertContributor): Promise<Contributor>;
  removeContributor(contributorId: string, projectId: string): Promise<void>;

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
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
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
    const userProjects = await db.query.projects.findMany({
      where: eq(projects.userId, userId),
      with: {
        contributors: true,
        salesData: true,
        user: true,
      },
      orderBy: [desc(projects.updatedAt)],
    });
    return userProjects;
  }

  async getProject(projectId: string, userId: string): Promise<ProjectWithRelations | undefined> {
    const project = await db.query.projects.findFirst({
      where: and(eq(projects.id, projectId), eq(projects.userId, userId)),
      with: {
        contributors: true,
        salesData: true,
        user: true,
      },
    });
    return project;
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

  async getProjectContributors(projectId: string): Promise<Contributor[]> {
    return await db.select().from(contributors).where(eq(contributors.projectId, projectId));
  }

  async addContributor(contributor: InsertContributor): Promise<Contributor> {
    const [newContributor] = await db.insert(contributors).values(contributor).returning();
    return newContributor;
  }

  async removeContributor(contributorId: string, projectId: string): Promise<void> {
    await db.delete(contributors).where(
      and(eq(contributors.id, contributorId), eq(contributors.projectId, projectId))
    );
  }

  async getUserSalesData(userId: string, startDate?: Date, endDate?: Date): Promise<SalesData[]> {
    let query = db.select().from(salesData).where(eq(salesData.userId, userId));
    
    if (startDate && endDate) {
      query = query.where(
        and(
          eq(salesData.userId, userId),
          gte(salesData.reportDate, startDate),
          lte(salesData.reportDate, endDate)
        )
      );
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
}

export const storage = new DatabaseStorage();
