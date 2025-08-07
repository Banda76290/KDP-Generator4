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
  series,
  marketplaceCategories,
  authors,
  authorBiographies,
  contentRecommendations,
  aiPromptTemplates,
  kdpImports,
  kdpImportData,
  kdpRoyaltiesEstimatorData,
  consolidatedSalesData,
  masterBooks,
  exchangeRates,
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
  type Series,
  type InsertSeries,
  type MarketplaceCategory,
  type Author,
  type InsertAuthor,
  type AuthorWithRelations,
  type AuthorBiography,
  type InsertAuthorBiography,
  type ContentRecommendation,
  type InsertContentRecommendation,
  type AiPromptTemplate,
  type InsertAiPromptTemplate,
  type KdpImport,
  type InsertKdpImport,
  type KdpImportData,
  type InsertKdpImportData,
  type KdpImportWithRelations,
  type InsertKdpRoyaltiesEstimatorData,
  type SelectKdpRoyaltiesEstimatorData,
  insertConsolidatedSalesDataSchema,
  type MasterBook,
  type InsertMasterBook,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte, sql, sum, count, like, or, isNotNull, asc, inArray } from "drizzle-orm";
import { generateUniqueIsbnPlaceholder } from "./utils/isbnGenerator";
import { nanoid } from "nanoid";

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
  deleteProject(projectId: string, userId: string, deleteBooks?: boolean): Promise<void>;
  duplicateProject(projectId: string, userId: string): Promise<ProjectWithRelations>;

  // Book operations
  getUserBooks(userId: string): Promise<Book[]>;
  getBook(bookId: string, userId: string): Promise<Book | undefined>;
  createBook(book: InsertBook): Promise<Book>;
  updateBook(bookId: string, userId: string, updates: Partial<InsertBook>): Promise<Book>;
  deleteBook(bookId: string, userId: string): Promise<void>;
  checkIsbnExists(isbn: string, excludeBookId?: string): Promise<Book | undefined>;

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

  // Series operations
  getUserSeries(userId: string): Promise<(Series & { books: Book[] })[]>;
  getSeries(seriesId: string, userId: string): Promise<Series | undefined>;
  createSeries(series: InsertSeries): Promise<Series>;
  updateSeries(seriesId: string, userId: string, updates: Partial<InsertSeries>): Promise<Series>;
  deleteSeries(seriesId: string, userId: string): Promise<void>;

  // Author operations
  getUserAuthors(userId: string): Promise<AuthorWithRelations[]>;
  getAuthor(authorId: string, userId: string): Promise<AuthorWithRelations | undefined>;
  createAuthor(author: InsertAuthor): Promise<Author>;
  updateAuthor(authorId: string, userId: string, updates: Partial<InsertAuthor>): Promise<Author>;
  deleteAuthor(authorId: string, userId: string): Promise<void>;
  getAuthorBiography(authorId: string, language: string): Promise<AuthorBiography | undefined>;
  upsertAuthorBiography(biography: InsertAuthorBiography): Promise<AuthorBiography>;
  getAuthorProjects(authorId: string, userId: string): Promise<ProjectWithRelations[]>;
  getAuthorBooks(authorId: string, userId: string): Promise<Book[]>;

  // Marketplace Categories operations
  getMarketplaceCategories(marketplace: string): Promise<MarketplaceCategory[]>;
  getMarketplaceCategoriesWithFormat(marketplace: string, format?: string): Promise<MarketplaceCategory[]>;
  
  // Category migration utilities
  backupMarketplaceCategories(): Promise<boolean>;
  validateCategoryStructure(categories: any[]): Promise<{isValid: boolean, errors: string[]}>;
  rollbackMarketplaceCategories(): Promise<boolean>;
  migrateMarketplaceCategoriesWithFormats(newCategories: any[]): Promise<{success: boolean, errors: string[]}>;

  // Content Recommendations operations
  getBookRecommendations(bookId: string, userId: string): Promise<ContentRecommendation[]>;
  createContentRecommendation(recommendation: InsertContentRecommendation): Promise<ContentRecommendation>;
  updateRecommendationFeedback(recommendationId: string, isUseful: boolean, isApplied?: boolean): Promise<ContentRecommendation>;
  deleteRecommendation(recommendationId: string, userId: string): Promise<void>;
  
  // AI Prompt Templates operations  
  getAiPromptTemplates(): Promise<AiPromptTemplate[]>;
  getAllAiPromptTemplates(): Promise<AiPromptTemplate[]>;
  getAiPromptTemplate(id: string): Promise<AiPromptTemplate | undefined>;
  createAiPromptTemplate(template: InsertAiPromptTemplate): Promise<AiPromptTemplate>;
  updateAiPromptTemplate(id: string, updates: Partial<InsertAiPromptTemplate>): Promise<AiPromptTemplate>;
  deleteAiPromptTemplate(id: string): Promise<void>;
  getAiPromptTemplateByType(type: string): Promise<AiPromptTemplate | undefined>;
  
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

  // KDP Import operations
  getUserKdpImports(userId: string): Promise<KdpImportWithRelations[]>;
  getAllKdpImportsForUser(userId: string): Promise<KdpImport[]>;
  getKdpImport(importId: string, userId: string): Promise<KdpImportWithRelations | undefined>;
  createKdpImport(importData: InsertKdpImport): Promise<KdpImport>;
  updateKdpImport(importId: string, updates: Partial<InsertKdpImport>): Promise<KdpImport>;
  deleteKdpImport(importId: string, userId: string): Promise<void>;
  
  createKdpImportData(data: InsertKdpImportData[]): Promise<KdpImportData[]>;
  getKdpImportData(importId: string): Promise<KdpImportData[]>;
  deleteKdpImportData(importId: string): Promise<void>;
  
  // KDP Royalties Estimator operations
  createKdpRoyaltiesEstimatorData(data: InsertKdpRoyaltiesEstimatorData): Promise<SelectKdpRoyaltiesEstimatorData>;
  getKdpRoyaltiesEstimatorData(importId: string): Promise<SelectKdpRoyaltiesEstimatorData[]>;
  deleteKdpRoyaltiesEstimatorData(importId: string): Promise<void>;
  getUserKdpRoyaltiesEstimatorData(userId: string): Promise<SelectKdpRoyaltiesEstimatorData[]>;
  
  // Consolidated Sales Data operations
  consolidateKdpData(userId: string, exchangeRateService?: any): Promise<{ processed: number; updated: number }>;
  getConsolidatedSalesOverview(userId: string): Promise<any>;

  // Master Books operations
  getMasterBooks(userId: string): Promise<MasterBook[]>;
  getMasterBookByAsin(asin: string): Promise<MasterBook | null>;
  updateMasterBooksFromImport(userId: string, importId: string): Promise<void>;
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
    const userProjects = await db.select().from(projects).where(eq(projects.userId, userId));
    
    // Get books for each project with sales data
    const projectsWithBooks = await Promise.all(userProjects.map(async (project) => {
      // Get books for this project
      const projectBooks = await db.select().from(books).where(eq(books.projectId, project.id));
      
      // Calculate revenue and sales for each book
      const booksWithStats = await Promise.all(projectBooks.map(async (book) => {
        // Get sales data for this book
        const bookSales = await db.select().from(salesData).where(eq(salesData.bookId, book.id));
        
        const totalRevenue = bookSales.reduce((sum, sale) => sum + parseFloat(sale.royalty || '0'), 0);
        const totalSales = bookSales.reduce((sum, sale) => sum + (sale.unitsSold || 0), 0);
        
        // Calculate monthly revenue (current month)
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const monthlyRevenue = bookSales
          .filter(sale => {
            const saleDate = new Date(sale.reportDate);
            return saleDate.getMonth() === currentMonth && saleDate.getFullYear() === currentYear;
          })
          .reduce((sum, sale) => sum + parseFloat(sale.royalty || '0'), 0);
        
        const monthlySales = bookSales
          .filter(sale => {
            const saleDate = new Date(sale.reportDate);
            return saleDate.getMonth() === currentMonth && saleDate.getFullYear() === currentYear;
          })
          .reduce((sum, sale) => sum + (sale.unitsSold || 0), 0);
        
        return {
          ...book,
          totalRevenue: totalRevenue.toString(),
          totalSales,
          monthlyRevenue: monthlyRevenue.toString(),
          monthlySales,
        };
      }));
      
      // Calculate project totals
      const projectTotalRevenue = booksWithStats.reduce((sum, book) => sum + parseFloat(book.totalRevenue), 0);
      const projectTotalSales = booksWithStats.reduce((sum, book) => sum + book.totalSales, 0);
      const projectMonthlyRevenue = booksWithStats.reduce((sum, book) => sum + parseFloat(book.monthlyRevenue), 0);
      const projectMonthlySales = booksWithStats.reduce((sum, book) => sum + book.monthlySales, 0);
      
      return {
        ...project,
        books: booksWithStats,
        user: { id: userId } as User,
        totalRevenue: projectTotalRevenue.toString(),
        totalSales: projectTotalSales,
        monthlyRevenue: projectMonthlyRevenue.toString(),
        monthlySales: projectMonthlySales,
      };
    }));
    
    return projectsWithBooks as ProjectWithRelations[];
  }

  async getProject(projectId: string, userId: string): Promise<ProjectWithRelations | undefined> {
    const [project] = await db.select().from(projects).where(and(eq(projects.id, projectId), eq(projects.userId, userId)));
    if (!project) return undefined;
    
    // Get books for this project with full data
    const projectBooks = await db.select().from(books).where(eq(books.projectId, project.id));
    
    // Calculate revenue and sales for each book
    const booksWithStats = await Promise.all(projectBooks.map(async (book) => {
      // Get sales data for this book
      const bookSales = await db.select().from(salesData).where(eq(salesData.bookId, book.id));
      
      const totalRevenue = bookSales.reduce((sum, sale) => sum + parseFloat(sale.royalty || '0'), 0);
      const totalSales = bookSales.reduce((sum, sale) => sum + (sale.unitsSold || 0), 0);
      
      // Calculate monthly revenue (current month)
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const monthlyRevenue = bookSales
        .filter(sale => {
          const saleDate = new Date(sale.reportDate);
          return saleDate.getMonth() === currentMonth && saleDate.getFullYear() === currentYear;
        })
        .reduce((sum, sale) => sum + parseFloat(sale.royalty || '0'), 0);
      
      const monthlySales = bookSales
        .filter(sale => {
          const saleDate = new Date(sale.reportDate);
          return saleDate.getMonth() === currentMonth && saleDate.getFullYear() === currentYear;
        })
        .reduce((sum, sale) => sum + (sale.unitsSold || 0), 0);
      
      return {
        ...book,
        totalRevenue: totalRevenue.toString(),
        totalSales,
        monthlyRevenue: monthlyRevenue.toString(),
        monthlySales,
      };
    }));
    
    // Calculate project totals
    const projectTotalRevenue = booksWithStats.reduce((sum, book) => sum + parseFloat(book.totalRevenue), 0);
    const projectTotalSales = booksWithStats.reduce((sum, book) => sum + book.totalSales, 0);
    const projectMonthlyRevenue = booksWithStats.reduce((sum, book) => sum + parseFloat(book.monthlyRevenue), 0);
    const projectMonthlySales = booksWithStats.reduce((sum, book) => sum + book.monthlySales, 0);
    
    return {
      ...project,
      books: booksWithStats,
      user: { id: userId } as User,
      totalRevenue: projectTotalRevenue.toString(),
      totalSales: projectTotalSales,
      monthlyRevenue: projectMonthlyRevenue.toString(),
      monthlySales: projectMonthlySales,
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

  async deleteProject(projectId: string, userId: string, deleteBooks = false): Promise<void> {
    if (deleteBooks) {
      // First delete contributors associated with books in this project
      await db.delete(contributors).where(
        sql`book_id IN (SELECT id FROM books WHERE project_id = ${projectId} AND user_id = ${userId})`
      );
      
      // Then delete the books themselves
      await db.delete(books).where(and(eq(books.projectId, projectId), eq(books.userId, userId)));
    } else {
      // Just unlink books from the project
      await db.update(books)
        .set({ projectId: null })
        .where(and(eq(books.projectId, projectId), eq(books.userId, userId)));
    }
    
    // Finally delete the project
    await db.delete(projects).where(and(eq(projects.id, projectId), eq(projects.userId, userId)));
  }

  async duplicateProject(projectId: string, userId: string): Promise<ProjectWithRelations> {
    // Get the original project
    const originalProject = await this.getProject(projectId, userId);
    if (!originalProject) {
      throw new Error("Project not found");
    }

    // Get all user projects to check for naming conflicts
    const userProjects = await this.getUserProjects(userId);
    
    // Generate unique name with appropriate suffix
    const generateUniqueName = (baseName: string): string => {
      // Remove existing copy suffix if present
      const cleanName = baseName.replace(/ \(copy.*?\)$/, '');
      
      let newName = `${cleanName} (copy)`;
      let counter = 2;
      
      while (userProjects.some(p => p.name === newName || p.title === newName)) {
        newName = `${cleanName} (copy ${counter})`;
        counter++;
      }
      
      return newName;
    };

    const newProjectName = generateUniqueName(originalProject.name || originalProject.title);

    // Create the new project with unique name
    const duplicatedProjectData: InsertProject = {
      title: newProjectName,
      name: newProjectName,
      description: originalProject.description,
      userId,
      categories: originalProject.categories,
      keywords: originalProject.keywords,
      status: originalProject.status,
      useAi: originalProject.useAi,
      aiPrompt: originalProject.aiPrompt,
      aiContentType: originalProject.aiContentType,
      formats: originalProject.formats,
      publicationInfo: originalProject.publicationInfo as any,
      coverImageUrl: originalProject.coverImageUrl,

      language: originalProject.language,
      seriesTitle: originalProject.seriesTitle,
      seriesNumber: originalProject.seriesNumber,
      editionNumber: originalProject.editionNumber,
      authorPrefix: originalProject.authorPrefix,
      authorFirstName: originalProject.authorFirstName,
      authorMiddleName: originalProject.authorMiddleName,
      authorLastName: originalProject.authorLastName,
      authorSuffix: originalProject.authorSuffix,
      publishingRights: originalProject.publishingRights,
      hasExplicitContent: originalProject.hasExplicitContent,
      readingAgeMin: originalProject.readingAgeMin,
      readingAgeMax: originalProject.readingAgeMax,
      primaryMarketplace: originalProject.primaryMarketplace,
      isLowContentBook: originalProject.isLowContentBook,
      isLargePrintBook: originalProject.isLargePrintBook,
      publicationDate: originalProject.publicationDate,
      previouslyPublished: originalProject.previouslyPublished,
      previousPublicationDate: originalProject.previousPublicationDate,
      releaseOption: originalProject.releaseOption,
      scheduledReleaseDate: originalProject.scheduledReleaseDate,
    };

    const newProject = await this.createProject(duplicatedProjectData);

    // Get all existing books for name conflict checking
    const existingBooks = await this.getUserBooks(userId);
    
    // Helper function to generate unique book names
    const generateUniqueBookName = (baseName: string): string => {
      const cleanName = baseName.replace(/ \(copy.*?\)$/, '');
      let newName = `${cleanName} (copy)`;
      let counter = 2;
      
      while (existingBooks.some(b => b.title === newName)) {
        newName = `${cleanName} (copy ${counter})`;
        counter++;
      }
      
      // Add this new name to the list to avoid conflicts within this duplication
      existingBooks.push({ title: newName } as any);
      return newName;
    };

    // Duplicate all books from the original project
    console.log(`Duplicating ${originalProject.books.length} books for project ${newProjectName}`);
    
    for (const originalBook of originalProject.books) {
      const newBookTitle = generateUniqueBookName(originalBook.title);
      console.log(`Duplicating book: ${originalBook.title} -> ${newBookTitle}`);

      const duplicatedBookData: InsertBook = {
        userId,
        projectId: newProject.id,
        title: newBookTitle,
        subtitle: originalBook.subtitle,
        description: originalBook.description,
        categories: originalBook.categories,
        keywords: originalBook.keywords,
        status: originalBook.status,
        language: originalBook.language,
        seriesTitle: originalBook.seriesTitle,
        seriesNumber: originalBook.seriesNumber,
        editionNumber: originalBook.editionNumber,
        authorPrefix: originalBook.authorPrefix,
        authorFirstName: originalBook.authorFirstName,
        authorMiddleName: originalBook.authorMiddleName,
        authorLastName: originalBook.authorLastName,
        authorSuffix: originalBook.authorSuffix,
        publishingRights: originalBook.publishingRights,
        hasExplicitContent: originalBook.hasExplicitContent,
        readingAgeMin: originalBook.readingAgeMin,
        readingAgeMax: originalBook.readingAgeMax,
        primaryMarketplace: originalBook.primaryMarketplace,
        isLowContentBook: originalBook.isLowContentBook,
        isLargePrintBook: originalBook.isLargePrintBook,
        publicationDate: originalBook.publicationDate,
        previouslyPublished: originalBook.previouslyPublished,
        previousPublicationDate: originalBook.previousPublicationDate,
        releaseOption: originalBook.releaseOption,
        scheduledReleaseDate: originalBook.scheduledReleaseDate,
        useAI: originalBook.useAI,
        aiPrompt: originalBook.aiPrompt,
        aiContentType: originalBook.aiContentType,
        format: originalBook.format,
        publicationInfo: originalBook.publicationInfo as any,
        coverImageUrl: originalBook.coverImageUrl,

      };

      const newBook = await this.createBook(duplicatedBookData);
      console.log(`Created new book: ${newBook.id} - ${newBook.title}`);

      // Duplicate contributors for this book
      const originalContributors = await this.getBookContributors(originalBook.id);
      console.log(`Found ${originalContributors.length} contributors for book ${originalBook.title}`);
      
      for (const contributor of originalContributors) {
        await this.addContributor({
          projectId: newProject.id, // Include the project ID from the new project
          bookId: newBook.id,
          name: contributor.name,
          role: contributor.role,
          firstName: contributor.firstName,
          lastName: contributor.lastName,
          prefix: contributor.prefix,
          middleName: contributor.middleName,
          suffix: contributor.suffix,
        });
        console.log(`Added contributor: ${contributor.firstName} ${contributor.lastName} (${contributor.role})`);
      }
    }
    
    console.log(`Completed duplication. Created project ${newProject.id} with ${originalProject.books.length} books`);

    // Return the complete duplicated project with all relations
    const duplicatedProject = await this.getProject(newProject.id, userId);
    if (!duplicatedProject) {
      throw new Error("Failed to retrieve duplicated project");
    }

    return duplicatedProject;
  }

  // Book operations
  async getUserBooks(userId: string): Promise<Book[]> {
    return await db.select().from(books).where(eq(books.userId, userId)).orderBy(desc(books.updatedAt));
  }

  async getBook(bookId: string, userId: string): Promise<(Book & { contributors?: Contributor[] }) | undefined> {
    const [book] = await db.select().from(books).where(and(eq(books.id, bookId), eq(books.userId, userId)));
    if (!book) return undefined;
    
    // Get contributors for this book
    const bookContributors = await db.select().from(contributors).where(eq(contributors.bookId, bookId));
    
    return {
      ...book,
      contributors: bookContributors
    };
  }

  async createBook(book: InsertBook): Promise<Book> {
    // Generate unique ISBN placeholder if not provided
    if (!book.isbnPlaceholder) {
      book.isbnPlaceholder = await generateUniqueIsbnPlaceholder();
    }
    
    const [newBook] = await db.insert(books).values(book).returning();
    return newBook;
  }

  async duplicateBook(bookId: string, userId: string): Promise<Book> {
    console.log(`Duplicating book ${bookId} for user ${userId}`);
    
    // Get the original book
    const originalBook = await this.getBook(bookId, userId);
    if (!originalBook) {
      throw new Error("Book not found");
    }

    // Get all books in the same project to avoid title conflicts
    const projectBooks = originalBook.projectId 
      ? await db.select().from(books).where(eq(books.projectId, originalBook.projectId))
      : [];
    
    // Generate unique book name
    const generateUniqueBookName = (baseName: string): string => {
      const cleanName = baseName.replace(/ \(copy( \d+)?\)$/, '');
      let newName = `${cleanName} (copy)`;
      
      // Check if this name already exists
      if (!projectBooks.some(b => b.title === newName)) {
        return newName;
      }
      
      // Find the next available number
      let counter = 2;
      while (projectBooks.some(b => b.title === `${cleanName} (copy ${counter})`)) {
        counter++;
      }
      
      return `${cleanName} (copy ${counter})`;
    };

    const newBookTitle = generateUniqueBookName(originalBook.title);
    console.log(`Duplicating book: ${originalBook.title} -> ${newBookTitle}`);

    // Create duplicated book data
    const duplicatedBookData: InsertBook = {
      userId,
      projectId: originalBook.projectId,
      title: newBookTitle,
      subtitle: originalBook.subtitle,
      description: originalBook.description,
      categories: originalBook.categories,
      keywords: originalBook.keywords,
      status: originalBook.status,
      language: originalBook.language,
      seriesTitle: originalBook.seriesTitle,
      seriesNumber: originalBook.seriesNumber,
      editionNumber: originalBook.editionNumber,
      authorPrefix: originalBook.authorPrefix,
      authorFirstName: originalBook.authorFirstName,
      authorMiddleName: originalBook.authorMiddleName,
      authorLastName: originalBook.authorLastName,
      authorSuffix: originalBook.authorSuffix,
      publishingRights: originalBook.publishingRights,
      hasExplicitContent: originalBook.hasExplicitContent,
      readingAgeMin: originalBook.readingAgeMin,
      readingAgeMax: originalBook.readingAgeMax,
      primaryMarketplace: originalBook.primaryMarketplace,
      isLowContentBook: originalBook.isLowContentBook,
      isLargePrintBook: originalBook.isLargePrintBook,
      publicationDate: originalBook.publicationDate,
      previouslyPublished: originalBook.previouslyPublished,
      previousPublicationDate: originalBook.previousPublicationDate,
      releaseOption: originalBook.releaseOption,
      scheduledReleaseDate: originalBook.scheduledReleaseDate,
      useAI: originalBook.useAI,
      aiPrompt: originalBook.aiPrompt,
      aiContentType: originalBook.aiContentType,
      format: originalBook.format,
      publicationInfo: originalBook.publicationInfo as any,
      coverImageUrl: originalBook.coverImageUrl,

    };

    const newBook = await this.createBook(duplicatedBookData);
    console.log(`Created new book: ${newBook.id} - ${newBook.title}`);

    // Duplicate contributors for this book
    const originalContributors = await this.getBookContributors(originalBook.id);
    console.log(`Found ${originalContributors.length} contributors for book ${originalBook.title}`);
    
    for (const contributor of originalContributors) {
      await this.addContributor({
        projectId: newBook.projectId, // Include the project ID from the new book
        bookId: newBook.id,
        name: contributor.name,
        role: contributor.role,
        firstName: contributor.firstName,
        lastName: contributor.lastName,
        prefix: contributor.prefix,
        middleName: contributor.middleName,
        suffix: contributor.suffix,
      });
      console.log(`Added contributor: ${contributor.firstName} ${contributor.lastName} (${contributor.role})`);
    }

    console.log(`Completed book duplication: ${newBook.id}`);
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

  async checkIsbnExists(isbn: string, excludeBookId?: string): Promise<Book | undefined> {
    if (excludeBookId) {
      const result = await db.select().from(books)
        .where(and(eq(books.isbn, isbn), sql`${books.id} != ${excludeBookId}`));
      return result[0];
    }
    
    const result = await db.select().from(books).where(eq(books.isbn, isbn));
    return result[0];
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

  // Category migration and backup utilities
  async backupMarketplaceCategories(): Promise<boolean> {
    try {
      // Create backup table if it doesn't exist
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS marketplace_categories_backup AS 
        SELECT * FROM marketplace_categories
      `);
      
      // Clear and repopulate backup
      await db.execute(sql`DELETE FROM marketplace_categories_backup`);
      await db.execute(sql`
        INSERT INTO marketplace_categories_backup 
        SELECT * FROM marketplace_categories
      `);
      
      console.log('[BACKUP] Marketplace categories backed up successfully');
      return true;
    } catch (error) {
      console.error('[BACKUP] Failed to backup marketplace categories:', error);
      return false;
    }
  }

  async validateCategoryStructure(categories: any[]): Promise<{isValid: boolean, errors: string[]}> {
    const errors: string[] = [];
    
    if (!Array.isArray(categories)) {
      errors.push('Categories must be an array');
      return { isValid: false, errors };
    }

    for (let i = 0; i < categories.length; i++) {
      const cat = categories[i];
      
      if (!cat.marketplace || typeof cat.marketplace !== 'string') {
        errors.push(`Category ${i}: Invalid marketplace`);
      }
      
      if (!cat.categoryPath || typeof cat.categoryPath !== 'string') {
        errors.push(`Category ${i}: Invalid categoryPath`);
      }
      
      if (!cat.displayName || typeof cat.displayName !== 'string') {
        errors.push(`Category ${i}: Invalid displayName`);
      }
      
      // FIXED: Update validation for proper level range 
      if (typeof cat.level !== 'number' || cat.level < 2) {
        errors.push(`Category ${i}: Invalid level (must be >= 2)`);
      }
      
      // FIXED: Validate required fields for virtual hierarchy
      if (typeof cat.isSelectable !== 'boolean') {
        errors.push(`Category ${i}: Missing isSelectable field`);
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  async rollbackMarketplaceCategories(): Promise<boolean> {
    try {
      // Check if backup exists
      const backupExists = await db.execute(sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'marketplace_categories_backup'
        )
      `);
      
      if (!backupExists) {
        console.error('[ROLLBACK] No backup table found');
        return false;
      }

      // Restore from backup
      await db.execute(sql`DELETE FROM marketplace_categories`);
      await db.execute(sql`
        INSERT INTO marketplace_categories 
        SELECT * FROM marketplace_categories_backup
      `);
      
      console.log('[ROLLBACK] Marketplace categories restored from backup');
      return true;
    } catch (error) {
      console.error('[ROLLBACK] Failed to rollback marketplace categories:', error);
      return false;
    }
  }

  async migrateMarketplaceCategoriesWithFormats(newCategories: any[]): Promise<{success: boolean, errors: string[]}> {
    try {
      console.log(`[MIGRATION] Starting complete replacement with ${newCategories.length} categories`);
      
      // Step 1: Transform the raw data from spreadsheet format to our database structure
      const transformedCategories = newCategories.map(cat => {
        // Build the category path from the spreadsheet columns
        const pathParts = [
          'Books', // Always start with Books
          cat.type_livre || cat['Type livre'] || '',  // kindle_ebook or print_kdp_paperback
          cat.categorie_principale || cat['Catégorie principale'] || '',
          cat.sous_categorie1 || cat['Sous-catégorie 1'] || '',
          cat.sous_categorie2 || cat['Sous-catégorie 2'] || '',
          cat.sous_categorie3 || cat['Sous-catégorie 3'] || '',
          cat.sous_categorie4 || cat['Sous-catégorie 4'] || '',
          cat.sous_categorie5 || cat['Sous-catégorie 5'] || '',
          cat.sous_categorie6 || cat['Sous-catégorie 6'] || '',
          cat.sous_categorie7 || cat['Sous-catégorie 7'] || '',
          cat.sous_categorie8 || cat['Sous-catégorie 8'] || '',
          cat.sous_categorie9 || cat['Sous-catégorie 9'] || '',
          cat.sous_categorie10 || cat['Sous-catégorie 10'] || ''
        ].filter(part => part && part.trim() !== '');
        
        const categoryPath = pathParts.join(' > ');
        
        // FIXED: Calculate level correctly for virtual hierarchy
        // Level = actual depth in the path (Books=1, discriminant=2, category1=3, etc.)
        // But we store the actual level for database consistency
        const level = pathParts.length;
        
        const displayName = pathParts[pathParts.length - 1] || '';
        const marketplace = cat.marketplace || cat['Marketplace'] || '';
        
        return {
          id: nanoid(),
          marketplace: marketplace.toLowerCase(), // Normalize marketplace name
          displayName: displayName,
          categoryPath: categoryPath,
          level: level,
          parentPath: pathParts.slice(0, -1).join(' > ') || null,
          isSelectable: true, // FIXED: Add missing isSelectable field (all categories selectable)
          sortOrder: 0,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        };
      });

      // Step 2: Validate the transformed structure (basic checks)
      console.log(`[MIGRATION] Validating ${transformedCategories.length} transformed categories`);
      const invalidCategories = transformedCategories.filter(cat => 
        !cat.marketplace || !cat.displayName || !cat.categoryPath
      );
      
      if (invalidCategories.length > 0) {
        return { 
          success: false, 
          errors: [`${invalidCategories.length} categories have missing required fields`] 
        };
      }

      // Step 3: Create backup before making changes
      const backupSuccess = await this.backupMarketplaceCategories();
      if (!backupSuccess) {
        return { success: false, errors: ['Failed to create backup'] };
      }

      // Step 4: Perform the complete replacement in a transaction
      await db.transaction(async (tx) => {
        // Delete all existing categories
        await tx.delete(marketplaceCategories);
        console.log(`[MIGRATION] Deleted all existing categories`);
        
        // Insert new categories in batches
        const batchSize = 100;
        for (let i = 0; i < transformedCategories.length; i += batchSize) {
          const batch = transformedCategories.slice(i, i + batchSize);
          await tx.insert(marketplaceCategories).values(batch);
          console.log(`[MIGRATION] Inserted batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(transformedCategories.length/batchSize)}`);
        }
      });

      console.log(`[MIGRATION] Successfully replaced all categories with ${transformedCategories.length} new ones with format discriminants`);
      return { success: true, errors: [] };
    } catch (error) {
      console.error('[MIGRATION] Failed to migrate categories:', error);
      // Attempt rollback on failure
      await this.rollbackMarketplaceCategories();
      return { success: false, errors: [`Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`] };
    }
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

  // Series operations
  async getUserSeries(userId: string): Promise<(Series & { books: Book[] })[]> {
    const userSeries = await db
      .select()
      .from(series)
      .where(eq(series.userId, userId))
      .orderBy(desc(series.createdAt));

    // Get books for each series
    const seriesWithBooks = await Promise.all(
      userSeries.map(async (seriesItem) => {
        const seriesBooks = await db
          .select()
          .from(books)
          .where(and(
            eq(books.userId, userId),
            eq(books.seriesTitle, seriesItem.title)
          ))
          .orderBy(books.seriesNumber);
        
        return {
          ...seriesItem,
          books: seriesBooks
        };
      })
    );

    return seriesWithBooks;
  }

  async getSeries(seriesId: string, userId: string): Promise<Series | undefined> {
    const [seriesResult] = await db
      .select()
      .from(series)
      .where(and(eq(series.id, seriesId), eq(series.userId, userId)));
    return seriesResult;
  }

  async createSeries(seriesData: InsertSeries): Promise<Series> {
    const [newSeries] = await db
      .insert(series)
      .values(seriesData)
      .returning();
    return newSeries;
  }

  async updateSeries(seriesId: string, userId: string, updates: Partial<InsertSeries>): Promise<Series> {
    const [updatedSeries] = await db
      .update(series)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(series.id, seriesId), eq(series.userId, userId)))
      .returning();
    return updatedSeries;
  }

  async deleteSeries(seriesId: string, userId: string): Promise<void> {
    // First, get the series to find its title
    const existingSeries = await this.getSeries(seriesId, userId);
    if (!existingSeries) {
      return; // Series doesn't exist, nothing to delete
    }
    
    // Remove all books from this series by clearing their seriesTitle and seriesNumber
    await db
      .update(books)
      .set({ 
        seriesTitle: "", 
        seriesNumber: null,
        updatedAt: new Date()
      })
      .where(and(
        eq(books.userId, userId),
        eq(books.seriesTitle, existingSeries.title)
      ));
    
    // Now delete the series
    await db
      .delete(series)
      .where(and(eq(series.id, seriesId), eq(series.userId, userId)));
  }

  // Marketplace Categories operations
  async getMarketplaceCategories(marketplace: string): Promise<MarketplaceCategory[]> {
    return await db
      .select()
      .from(marketplaceCategories)
      .where(and(
        eq(marketplaceCategories.marketplace, marketplace),
        eq(marketplaceCategories.isActive, true)
      ))
      .orderBy(marketplaceCategories.level, marketplaceCategories.sortOrder, marketplaceCategories.displayName);
  }

  async getMarketplaceCategoriesWithFormat(marketplace: string, format?: string): Promise<MarketplaceCategory[]> {
    // Map format to discriminant
    const discriminant = format === 'ebook' ? 'kindle_ebook' : 
                        (format === 'paperback' || format === 'hardcover') ? 'print_kdp_paperback' : 
                        null;

    // Normalize marketplace name to lowercase for database query
    const normalizedMarketplace = marketplace.toLowerCase();

    let categories = await db
      .select()
      .from(marketplaceCategories)
      .where(and(
        eq(marketplaceCategories.marketplace, normalizedMarketplace),
        eq(marketplaceCategories.isActive, true)
      ))
      .orderBy(marketplaceCategories.level, marketplaceCategories.sortOrder, marketplaceCategories.displayName);

    // If format is provided, try to filter categories based on discriminant
    if (discriminant) {
      const filteredCategories = categories.filter(cat => {
        // NEVER include the discriminants themselves as selectable categories
        const isDiscriminant = cat.displayName === 'kindle_ebook' || cat.displayName === 'print_kdp_paperback';
        
        if (isDiscriminant) {
          return false; // Exclude discriminants from selectable categories
        }
        
        // Only include categories that belong to the correct format path
        const belongsToPath = cat.categoryPath.includes(`> ${discriminant} >`) || 
                             cat.categoryPath === `Books > ${discriminant}`;
        
        return belongsToPath;
      });
      
      console.log(`Found ${filteredCategories.length} categories for ${discriminant} in ${normalizedMarketplace}`);
      
      // RÉTROCOMPATIBILITÉ: Si aucune catégorie filtrée n'est trouvée, 
      // retourner toutes les catégories pour éviter de casser l'interface
      if (filteredCategories.length === 0) {
        console.log(`[COMPAT] No format-specific categories found for ${discriminant}, returning all categories for backward compatibility`);
        return categories;
      }
      
      return filteredCategories;
    }

    return categories;
  }

  async exportAllMarketplaceCategories(): Promise<any[]> {
    try {
      const categories = await db.select().from(marketplaceCategories).orderBy(
        marketplaceCategories.marketplace,
        marketplaceCategories.level,
        marketplaceCategories.sortOrder,
        marketplaceCategories.displayName
      );
      
      return categories.map(cat => ({
        marketplace: cat.marketplace,
        categoryPath: cat.categoryPath,
        parentPath: cat.parentPath,
        level: cat.level,
        displayName: cat.displayName,
        isSelectable: cat.isSelectable,
        sortOrder: cat.sortOrder,
        isActive: cat.isActive
      }));
    } catch (error) {
      console.error('Error exporting categories:', error);
      throw error;
    }
  }

  async syncCategoriesToProduction(productionUrl: string, categories: any[]): Promise<{
    success: boolean;
    error?: string;
    syncedCount?: number;
  }> {
    try {
      // Clean up production URL
      const cleanUrl = productionUrl.replace(/\/$/, '');
      const endpoint = `${cleanUrl}/api/admin/categories/migrate`;
      
      console.log(`[SYNC] 🚀 Début de la synchronisation`);
      console.log(`[SYNC] 📊 ${categories.length} catégories à synchroniser`);
      console.log(`[SYNC] 🎯 Endpoint cible: ${endpoint}`);
      
      // Prepare request payload
      const payload = { categories };
      const headers = {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'Accept': 'application/json',
        'User-Agent': 'KDP-Generator-DevSync/1.0',
        'Origin': process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS}` : 'http://localhost:5000'
      };
      
      console.log(`[SYNC] 📦 Headers préparés:`, JSON.stringify(headers, null, 2));
      console.log(`[SYNC] 📄 Payload size: ${JSON.stringify(payload).length} caractères`);
      
      // Make the API call to production
      console.log(`[SYNC] 🌐 Envoi de la requête POST...`);
      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      console.log(`[SYNC] 📡 Réponse reçue - Status: ${response.status} ${response.statusText}`);
      console.log(`[SYNC] 📋 Response headers:`, JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2));

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[SYNC] ❌ Erreur de l'API de production (${response.status}): ${errorText}`);
        
        // Provide specific error messages for common issues
        let errorMessage = `Erreur API Production (${response.status}): ${errorText}`;
        
        if (response.status === 403) {
          errorMessage = `🚫 Accès refusé (403):\n- Vérifiez l'URL de production\n- Authentification requise sur le serveur cible\n- CORS policy peut bloquer la requête\n- Détails: ${errorText}`;
        } else if (response.status === 404) {
          errorMessage = `🔍 Endpoint non trouvé (404):\n- URL: ${endpoint}\n- Vérifiez que l'API /api/admin/categories/migrate existe\n- Le serveur de production doit être déployé avec cette route`;
        } else if (response.status === 500) {
          errorMessage = `💥 Erreur serveur de production (500):\n- Problème côté serveur de production\n- Vérifiez les logs du serveur cible\n- Détails: ${errorText}`;
        } else if (response.status === 401) {
          errorMessage = `🔐 Non autorisé (401):\n- Authentification requise\n- Token ou session invalide\n- Détails: ${errorText}`;
        }
        
        return {
          success: false,
          error: errorMessage
        };
      }

      const result = await response.json();
      console.log(`[SYNC] ✅ Synchronisation réussie:`, result);
      
      return {
        success: true,
        syncedCount: result.categoriesCount || result.count || categories.length
      };
    } catch (error) {
      console.error('[SYNC] 💥 Erreur critique lors de la synchronisation:', error);
      
      let errorMessage = 'Erreur de connexion inconnue';
      if (error instanceof Error) {
        if (error.message.includes('fetch')) {
          errorMessage = `🌐 Erreur de connexion réseau:\n- Impossible de joindre ${productionUrl}\n- Vérifiez l'URL et la connectivité\n- Détails: ${error.message}`;
        } else if (error.message.includes('CORS')) {
          errorMessage = `🚫 Erreur CORS:\n- Le serveur de production bloque les requêtes cross-origin\n- Configurez CORS sur le serveur cible\n- Détails: ${error.message}`;
        } else {
          errorMessage = `❌ Erreur: ${error.message}`;
        }
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  // Author operations implementation
  async getUserAuthors(userId: string): Promise<AuthorWithRelations[]> {
    const userAuthors = await db
      .select()
      .from(authors)
      .where(and(eq(authors.userId, userId), eq(authors.isActive, true)));

    return await Promise.all(userAuthors.map(async (author) => {
      const [user] = await db.select().from(users).where(eq(users.id, author.userId));
      const biographies = await db.select().from(authorBiographies).where(eq(authorBiographies.authorId, author.id));
      
      return {
        ...author,
        user,
        biographies,
      };
    }));
  }

  async getUserAuthorsWithCounts(userId: string): Promise<(AuthorWithRelations & { bookCount: number; projectCount: number })[]> {
    const userAuthors = await db
      .select()
      .from(authors)
      .where(and(eq(authors.userId, userId), eq(authors.isActive, true)));

    return await Promise.all(userAuthors.map(async (author) => {
      const [user] = await db.select().from(users).where(eq(users.id, author.userId));
      const biographies = await db.select().from(authorBiographies).where(eq(authorBiographies.authorId, author.id));
      
      // Count books for this author
      const authorBooks = await db
        .select({ count: sql<number>`count(*)` })
        .from(books)
        .where(and(
          eq(books.userId, userId),
          eq(books.authorPrefix, author.prefix || ''),
          eq(books.authorFirstName, author.firstName),
          eq(books.authorMiddleName, author.middleName || ''),
          eq(books.authorLastName, author.lastName),
          eq(books.authorSuffix, author.suffix || '')
        ));

      // Count projects for this author (through books table since books contain author info)
      const authorProjects = await db
        .select({ count: sql<number>`count(distinct ${books.projectId})` })
        .from(books)
        .where(and(
          eq(books.userId, userId),
          sql`COALESCE(${books.authorPrefix}, '') = ${author.prefix || ''}`,
          eq(books.authorFirstName, author.firstName),
          sql`COALESCE(${books.authorMiddleName}, '') = ${author.middleName || ''}`,
          eq(books.authorLastName, author.lastName),
          sql`COALESCE(${books.authorSuffix}, '') = ${author.suffix || ''}`,
          isNotNull(books.projectId)
        ));
      
      return {
        ...author,
        user,
        biographies,
        bookCount: Number(authorBooks[0]?.count || 0),
        projectCount: Number(authorProjects[0]?.count || 0),
      };
    }));
  }

  async getAuthor(authorId: string, userId: string): Promise<AuthorWithRelations | undefined> {
    const [author] = await db
      .select()
      .from(authors)
      .where(and(eq(authors.id, authorId), eq(authors.userId, userId), eq(authors.isActive, true)));

    if (!author) return undefined;

    const [user] = await db.select().from(users).where(eq(users.id, author.userId));
    const biographies = await db.select().from(authorBiographies).where(eq(authorBiographies.authorId, author.id));

    return {
      ...author,
      user,
      biographies,
    };
  }

  async createAuthor(author: InsertAuthor): Promise<Author> {
    const fullName = `${author.prefix || ''} ${author.firstName} ${author.middleName || ''} ${author.lastName} ${author.suffix || ''}`.replace(/\s+/g, ' ').trim();
    
    const [newAuthor] = await db
      .insert(authors)
      .values({
        ...author,
        fullName,
      })
      .returning();
    return newAuthor;
  }

  async updateAuthor(authorId: string, userId: string, updates: Partial<InsertAuthor>): Promise<Author> {
    const updateData: any = { ...updates };
    
    if (updates.prefix || updates.firstName || updates.middleName || updates.lastName || updates.suffix) {
      const currentAuthor = await this.getAuthor(authorId, userId);
      if (currentAuthor) {
        const fullName = `${updates.prefix || currentAuthor.prefix || ''} ${updates.firstName || currentAuthor.firstName} ${updates.middleName || currentAuthor.middleName || ''} ${updates.lastName || currentAuthor.lastName} ${updates.suffix || currentAuthor.suffix || ''}`.replace(/\s+/g, ' ').trim();
        updateData.fullName = fullName;
      }
    }

    const [updatedAuthor] = await db
      .update(authors)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(and(eq(authors.id, authorId), eq(authors.userId, userId)))
      .returning();
    return updatedAuthor;
  }

  async deleteAuthor(authorId: string, userId: string): Promise<void> {
    await db
      .update(authors)
      .set({ 
        isActive: false,
        updatedAt: new Date() 
      })
      .where(and(eq(authors.id, authorId), eq(authors.userId, userId)));
  }

  async getAuthorBiography(authorId: string, language: string): Promise<AuthorBiography | undefined> {
    const [biography] = await db
      .select()
      .from(authorBiographies)
      .where(and(eq(authorBiographies.authorId, authorId), eq(authorBiographies.language, language)));
    return biography;
  }

  async upsertAuthorBiography(biography: InsertAuthorBiography): Promise<AuthorBiography> {
    const [upsertedBiography] = await db
      .insert(authorBiographies)
      .values(biography)
      .onConflictDoUpdate({
        target: [authorBiographies.authorId, authorBiographies.language],
        set: {
          biography: biography.biography,
          updatedAt: new Date(),
        },
      })
      .returning();
    return upsertedBiography;
  }

  async getAuthorProjects(authorId: string, userId: string): Promise<ProjectWithRelations[]> {
    // Get all projects where the author appears in books as main author or contributor
    const authorData = await this.getAuthor(authorId, userId);
    if (!authorData) return [];

    const authorFullName = authorData.fullName;

    // Find books where this author is listed as main author or contributor
    const bookAuthors = await db
      .select()
      .from(books)
      .where(and(
        eq(books.userId, userId),
        or(
          sql`TRIM(CONCAT(COALESCE(${books.authorPrefix}, ''), ' ', ${books.authorFirstName}, ' ', COALESCE(${books.authorMiddleName}, ''), ' ', ${books.authorLastName}, ' ', COALESCE(${books.authorSuffix}, ''))) = ${authorFullName}`,
        )
      ));

    const bookContributors = await db
      .select({ bookId: contributors.bookId })
      .from(contributors)
      .where(eq(contributors.name, authorFullName));

    const authorBookIds = new Set([
      ...bookAuthors.map(book => book.id),
      ...bookContributors.map(contrib => contrib.bookId).filter(Boolean)
    ]);

    if (authorBookIds.size === 0) return [];

    // Get unique project IDs from these books
    const authorProjectIds = new Set(
      bookAuthors
        .filter(book => authorBookIds.has(book.id))
        .map(book => book.projectId)
        .filter(Boolean)
    );

    if (authorProjectIds.size === 0) return [];

    // Get projects and their books
    const authorProjects = await Promise.all(
      Array.from(authorProjectIds).map(async (projectId) => {
        const project = await this.getProject(projectId!, userId);
        if (project) {
          // Filter books to only include those where the author is involved
          project.books = project.books.filter(book => authorBookIds.has(book.id));
        }
        return project;
      })
    );

    return authorProjects.filter(Boolean) as ProjectWithRelations[];
  }

  async getAuthorBooks(authorId: string, userId: string): Promise<Book[]> {
    const authorData = await this.getAuthor(authorId, userId);
    if (!authorData) return [];

    const authorFullName = authorData.fullName;

    // Find books where this author is the main author
    const mainAuthorBooks = await db
      .select()
      .from(books)
      .where(and(
        eq(books.userId, userId),
        sql`TRIM(CONCAT(COALESCE(${books.authorPrefix}, ''), ' ', ${books.authorFirstName}, ' ', COALESCE(${books.authorMiddleName}, ''), ' ', ${books.authorLastName}, ' ', COALESCE(${books.authorSuffix}, ''))) = ${authorFullName}`
      ));

    // Find books where this author is a contributor
    const contributorBookIds = await db
      .select({ bookId: contributors.bookId })
      .from(contributors)
      .where(eq(contributors.name, authorFullName));

    const contributorBooks = await Promise.all(
      contributorBookIds
        .map(contrib => contrib.bookId)
        .filter(Boolean)
        .map(async (bookId) => {
          const [book] = await db.select().from(books).where(and(eq(books.id, bookId!), eq(books.userId, userId)));
          return book;
        })
    );

    // Combine and deduplicate
    const allBooks = [...mainAuthorBooks, ...contributorBooks.filter(Boolean)];
    const uniqueBooks = Array.from(
      new Map(allBooks.map(book => [book.id, book])).values()
    );

    return uniqueBooks;
  }
  // Content Recommendations operations implementation
  async getBookRecommendations(bookId: string, userId: string): Promise<ContentRecommendation[]> {
    return await db
      .select()
      .from(contentRecommendations)
      .where(
        and(
          eq(contentRecommendations.bookId, bookId),
          eq(contentRecommendations.userId, userId)
        )
      )
      .orderBy(desc(contentRecommendations.createdAt));
  }

  async createContentRecommendation(recommendation: InsertContentRecommendation): Promise<ContentRecommendation> {
    const [newRecommendation] = await db
      .insert(contentRecommendations)
      .values(recommendation)
      .returning();
    return newRecommendation;
  }

  async updateRecommendationFeedback(
    recommendationId: string, 
    isUseful: boolean, 
    isApplied?: boolean
  ): Promise<ContentRecommendation> {
    const updateData: any = { 
      isUseful, 
      updatedAt: new Date() 
    };
    
    if (isApplied !== undefined) {
      updateData.isApplied = isApplied;
    }

    const [updatedRecommendation] = await db
      .update(contentRecommendations)
      .set(updateData)
      .where(eq(contentRecommendations.id, recommendationId))
      .returning();
    
    return updatedRecommendation;
  }

  async deleteRecommendation(recommendationId: string, userId: string): Promise<void> {
    await db
      .delete(contentRecommendations)
      .where(
        and(
          eq(contentRecommendations.id, recommendationId),
          eq(contentRecommendations.userId, userId)
        )
      );
  }

  // AI Prompt Templates operations
  async getAiPromptTemplates(): Promise<AiPromptTemplate[]> {
    return await db
      .select()
      .from(aiPromptTemplates)
      .orderBy(aiPromptTemplates.type, aiPromptTemplates.name);
  }

  async getAllAiPromptTemplates(): Promise<AiPromptTemplate[]> {
    return await db
      .select()
      .from(aiPromptTemplates)
      .orderBy(aiPromptTemplates.type, aiPromptTemplates.name);
  }

  async getAiPromptTemplate(id: string): Promise<AiPromptTemplate | undefined> {
    const [template] = await db
      .select()
      .from(aiPromptTemplates)
      .where(eq(aiPromptTemplates.id, id));
    return template;
  }

  async createAiPromptTemplate(template: InsertAiPromptTemplate): Promise<AiPromptTemplate> {
    const [newTemplate] = await db
      .insert(aiPromptTemplates)
      .values(template)
      .returning();
    return newTemplate;
  }

  async updateAiPromptTemplate(id: string, updates: Partial<InsertAiPromptTemplate>): Promise<AiPromptTemplate> {
    const [updatedTemplate] = await db
      .update(aiPromptTemplates)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(aiPromptTemplates.id, id))
      .returning();
    return updatedTemplate;
  }

  async deleteAiPromptTemplate(id: string): Promise<void> {
    await db
      .delete(aiPromptTemplates)
      .where(eq(aiPromptTemplates.id, id));
  }

  async getAiPromptTemplateByType(type: string): Promise<AiPromptTemplate | undefined> {
    const [template] = await db
      .select()
      .from(aiPromptTemplates)
      .where(
        and(
          eq(aiPromptTemplates.type, type),
          eq(aiPromptTemplates.isActive, true)
        )
      )
      .orderBy(aiPromptTemplates.isDefault ? sql`1` : sql`2`, aiPromptTemplates.name)
      .limit(1);
    return template;
  }

  // KDP Import operations
  async getUserKdpImports(userId: string, limit = 20): Promise<KdpImportWithRelations[]> {
    const userImports = await db
      .select()
      .from(kdpImports)
      .where(eq(kdpImports.userId, userId))
      .orderBy(desc(kdpImports.createdAt))
      .limit(limit);

    return await Promise.all(userImports.map(async (importRecord) => {
      const [user] = await db.select().from(users).where(eq(users.id, importRecord.userId));
      // Don't load import data by default for performance - only on demand
      
      return {
        ...importRecord,
        user,
        importData: [], // Empty by default
      };
    }));
  }

  async getAllKdpImportsForUser(userId: string): Promise<KdpImport[]> {
    return await db
      .select()
      .from(kdpImports)
      .where(eq(kdpImports.userId, userId))
      .orderBy(desc(kdpImports.createdAt));
  }

  async getKdpImport(importId: string, userId: string): Promise<KdpImportWithRelations | undefined> {
    const [importRecord] = await db
      .select()
      .from(kdpImports)
      .where(and(eq(kdpImports.id, importId), eq(kdpImports.userId, userId)));

    if (!importRecord) return undefined;

    const [user] = await db.select().from(users).where(eq(users.id, importRecord.userId));
    const importData = await db.select().from(kdpImportData).where(eq(kdpImportData.importId, importRecord.id));

    return {
      ...importRecord,
      user,
      importData,
    };
  }

  async createKdpImport(importData: InsertKdpImport): Promise<KdpImport> {
    const [newImport] = await db
      .insert(kdpImports)
      .values(importData)
      .returning();
    return newImport;
  }

  async updateKdpImport(importId: string, updates: Partial<InsertKdpImport>): Promise<KdpImport> {
    const [updatedImport] = await db
      .update(kdpImports)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(kdpImports.id, importId))
      .returning();
    return updatedImport;
  }

  async deleteKdpImport(importId: string, userId: string): Promise<void> {
    // Delete related import data first
    await db.delete(kdpImportData).where(eq(kdpImportData.importId, importId));
    
    // Delete the main import record
    await db
      .delete(kdpImports)
      .where(and(eq(kdpImports.id, importId), eq(kdpImports.userId, userId)));
  }

  async createKdpImportData(data: InsertKdpImportData[]): Promise<KdpImportData[]> {
    if (data.length === 0) return [];
    
    const insertedData = await db
      .insert(kdpImportData)
      .values(data)
      .returning();
    return insertedData;
  }

  async getKdpImportData(importId: string): Promise<KdpImportData[]> {
    return await db
      .select()
      .from(kdpImportData)
      .where(eq(kdpImportData.importId, importId))
      .orderBy(kdpImportData.rowIndex);
  }

  async deleteKdpImportData(importId: string): Promise<void> {
    await db
      .delete(kdpImportData)
      .where(eq(kdpImportData.importId, importId));
  }

  // === KDP ROYALTIES ESTIMATOR MANAGEMENT ===
  async createKdpRoyaltiesEstimatorData(data: InsertKdpRoyaltiesEstimatorData): Promise<SelectKdpRoyaltiesEstimatorData> {
    const [result] = await db
      .insert(kdpRoyaltiesEstimatorData)
      .values(data)
      .returning();
    return result;
  }

  async getKdpRoyaltiesEstimatorData(importId: string): Promise<SelectKdpRoyaltiesEstimatorData[]> {
    return await db
      .select()
      .from(kdpRoyaltiesEstimatorData)
      .where(eq(kdpRoyaltiesEstimatorData.importId, importId))
      .orderBy(kdpRoyaltiesEstimatorData.rowIndex);
  }

  async getKdpRoyaltiesEstimatorDataByTransactionType(
    userId: string, 
    transactionTypes: string[]
  ): Promise<SelectKdpRoyaltiesEstimatorData[]> {
    return await db
      .select()
      .from(kdpRoyaltiesEstimatorData)
      .where(
        and(
          eq(kdpRoyaltiesEstimatorData.userId, userId),
          sql`${kdpRoyaltiesEstimatorData.transactionType} = ANY(${transactionTypes})`
        )
      )
      .orderBy(kdpRoyaltiesEstimatorData.royaltyDate);
  }

  async deleteKdpRoyaltiesEstimatorData(importId: string): Promise<void> {
    await db
      .delete(kdpRoyaltiesEstimatorData)
      .where(eq(kdpRoyaltiesEstimatorData.importId, importId));
  }

  async findKdpRoyaltiesEstimatorDataByKey(userId: string, uniqueKey: string): Promise<SelectKdpRoyaltiesEstimatorData | undefined> {
    const [result] = await db
      .select()
      .from(kdpRoyaltiesEstimatorData)
      .where(
        and(
          eq(kdpRoyaltiesEstimatorData.userId, userId),
          eq(kdpRoyaltiesEstimatorData.uniqueKey, uniqueKey)
        )
      )
      .limit(1);
    return result;
  }

  async updateKdpRoyaltiesEstimatorData(id: string, data: Partial<InsertKdpRoyaltiesEstimatorData>): Promise<SelectKdpRoyaltiesEstimatorData> {
    const [result] = await db
      .update(kdpRoyaltiesEstimatorData)
      .set(data)
      .where(eq(kdpRoyaltiesEstimatorData.id, id))
      .returning();
    return result;
  }

  async getUserKdpRoyaltiesEstimatorData(userId: string): Promise<SelectKdpRoyaltiesEstimatorData[]> {
    return await db
      .select()
      .from(kdpRoyaltiesEstimatorData)
      .where(eq(kdpRoyaltiesEstimatorData.userId, userId))
      .orderBy(desc(kdpRoyaltiesEstimatorData.createdAt));
  }

  async getAllKdpImportDataForUser(userId: string): Promise<KdpImportData[]> {
    return await db
      .select()
      .from(kdpImportData)
      .where(and(
        eq(kdpImportData.userId, userId),
        eq(kdpImportData.isDuplicate, false)
      ));
  }
  // KDP Analytics methods - using real imported data with currency handling
  async getAnalyticsOverview(userId: string): Promise<any> {
    const totalImports = await db.select({
      count: sql<number>`count(*)`
    }).from(kdpImports).where(eq(kdpImports.userId, userId));

    const totalRecords = await db.select({
      count: sql<number>`count(*)`
    }).from(kdpRoyaltiesEstimatorData)
    .innerJoin(kdpImports, eq(kdpRoyaltiesEstimatorData.importId, kdpImports.id))
    .where(and(
      eq(kdpImports.userId, userId),
      sql`${kdpImports.detectedType} = 'payments'`
    ));

    // Using kdp_royalties_estimator_data for analytics
    const royaltiesByCurrency = await db.select({
      currency: kdpRoyaltiesEstimatorData.currency,
      sum: sql<number>`coalesce(sum(${kdpRoyaltiesEstimatorData.royalty}), 0)`,
      count: sql<number>`count(*)`
    }).from(kdpRoyaltiesEstimatorData)
    .innerJoin(kdpImports, eq(kdpRoyaltiesEstimatorData.importId, kdpImports.id))
    .where(and(
      eq(kdpImports.userId, userId),
      sql`${kdpImports.detectedType} = 'payments'`,
      isNotNull(kdpRoyaltiesEstimatorData.royalty),
      sql`${kdpRoyaltiesEstimatorData.royalty} > 0`
    ))
    .groupBy(kdpRoyaltiesEstimatorData.currency);

    const uniqueBooks = await db.select({
      count: sql<number>`count(distinct ${kdpRoyaltiesEstimatorData.asin})`
    }).from(kdpRoyaltiesEstimatorData)
    .innerJoin(kdpImports, eq(kdpRoyaltiesEstimatorData.importId, kdpImports.id))
    .where(and(
      eq(kdpImports.userId, userId),
      sql`${kdpImports.detectedType} = 'payments'`,
      isNotNull(kdpRoyaltiesEstimatorData.asin),
      sql`${kdpRoyaltiesEstimatorData.asin} != ''`
    ));

    // Nouveau calcul du Total Revenue en USD
    const totalRevenueUSD = await db.select({
      sum: sql<number>`coalesce(sum(${kdpRoyaltiesEstimatorData.royaltyUsd}::decimal), 0)`
    }).from(kdpRoyaltiesEstimatorData)
    .innerJoin(kdpImports, eq(kdpRoyaltiesEstimatorData.importId, kdpImports.id))
    .where(and(
      eq(kdpImports.userId, userId),
      sql`${kdpImports.detectedType} = 'payments'`,
      isNotNull(kdpRoyaltiesEstimatorData.royaltyUsd),
      sql`${kdpRoyaltiesEstimatorData.royaltyUsd} > 0`
    ));

    return {
      totalImports: totalImports[0]?.count || 0,
      totalRecords: totalRecords[0]?.count || 0,
      royaltiesByCurrency: royaltiesByCurrency.map(r => ({
        currency: r.currency || 'USD',
        amount: Number(r.sum),
        transactions: Number(r.count)
      })),
      uniqueBooks: uniqueBooks[0]?.count || 0,
      totalRevenueUSD: Number(totalRevenueUSD[0]?.sum || 0)
    };
  }

  /**
   * Calcule le Total Revenue à partir de royalty_usd converti dans la devise spécifiée
   */
  async getTotalRevenue(userId: string, targetCurrency: string = 'USD'): Promise<{ totalRevenue: number; currency: string }> {
    // D'abord récupérer le total en USD - INCLUT TOUTES les royalties (positives ET négatives)
    const totalRevenueUSD = await db.select({
      sum: sql<number>`coalesce(sum(${kdpRoyaltiesEstimatorData.royaltyUsd}::decimal), 0)`
    }).from(kdpRoyaltiesEstimatorData)
    .innerJoin(kdpImports, eq(kdpRoyaltiesEstimatorData.importId, kdpImports.id))
    .where(and(
      eq(kdpImports.userId, userId),
      isNotNull(kdpRoyaltiesEstimatorData.royaltyUsd)
    ));

    const totalUSD = Number(totalRevenueUSD[0]?.sum || 0);

    // Si la devise cible est USD, retourner directement
    if (targetCurrency === 'USD') {
      return { totalRevenue: totalUSD, currency: 'USD' };
    }

    // Sinon, convertir vers la devise cible
    try {
      const { ExchangeRateService } = await import('./services/exchangeRateService');
      const exchangeService = new ExchangeRateService();
      const convertedAmount = await exchangeService.convertCurrency(totalUSD, 'USD', targetCurrency);
      
      return { totalRevenue: convertedAmount, currency: targetCurrency };
    } catch (error) {
      console.warn(`[TOTAL_REVENUE] Échec conversion USD -> ${targetCurrency}:`, error);
      // En cas d'échec, retourner le montant USD
      return { totalRevenue: totalUSD, currency: 'USD' };
    }
  }

  async getSalesTrends(userId: string, days: number): Promise<any[]> {
    // Group by import type and date to understand data better
    const salesData = await db.select({
      date: sql<string>`date(${kdpImports.createdAt})`,
      importType: kdpImports.detectedType,
      sales: sql<number>`count(*)`,
      royalty: sql<number>`coalesce(sum(${kdpRoyaltiesEstimatorData.royalty}), 0)`
    })
    .from(kdpRoyaltiesEstimatorData)
    .innerJoin(kdpImports, eq(kdpRoyaltiesEstimatorData.importId, kdpImports.id))
    .where(and(
      eq(kdpImports.userId, userId),
      sql`${kdpImports.detectedType} != 'payments'`,
      sql`${kdpImports.createdAt} >= current_date - interval '${days} days'`,
      isNotNull(kdpImports.createdAt)
    ))
    .groupBy(sql`date(${kdpImports.createdAt})`, kdpImports.detectedType)
    .orderBy(sql`date(${kdpImports.createdAt})`);

    // Aggregate by date (combine all import types per day)
    const dateMap = new Map();
    salesData.forEach(item => {
      const date = item.date;
      if (!dateMap.has(date)) {
        dateMap.set(date, { date, sales: 0, royalty: 0, units: 0 });
      }
      const existing = dateMap.get(date);
      existing.sales += Number(item.sales);
      existing.royalty += Number(item.royalty);
    });

    return Array.from(dateMap.values()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  async getTopPerformers(userId: string, limit: number): Promise<any[]> {
    // Get top performers with currency information to avoid mixing currencies
    const topBooks = await db.select({
      title: kdpRoyaltiesEstimatorData.title,
      asin: kdpRoyaltiesEstimatorData.asin,
      currency: kdpRoyaltiesEstimatorData.currency,  
      marketplace: kdpRoyaltiesEstimatorData.marketplace,
      totalSales: sql<number>`count(*)`,
      totalRoyalty: sql<number>`coalesce(sum(${kdpRoyaltiesEstimatorData.royalty}), 0)`,
      avgRoyalty: sql<number>`coalesce(avg(${kdpRoyaltiesEstimatorData.royalty}), 0)`
    })
    .from(kdpRoyaltiesEstimatorData)
    .innerJoin(kdpImports, eq(kdpRoyaltiesEstimatorData.importId, kdpImports.id))
    .where(and(
      eq(kdpImports.userId, userId),
      sql`${kdpImports.detectedType} != 'payments'`,
      isNotNull(kdpRoyaltiesEstimatorData.asin),
      isNotNull(kdpRoyaltiesEstimatorData.title),
      sql`${kdpRoyaltiesEstimatorData.royalty} > 0`
    ))
    .groupBy(kdpRoyaltiesEstimatorData.asin, kdpRoyaltiesEstimatorData.title, kdpRoyaltiesEstimatorData.currency, kdpRoyaltiesEstimatorData.marketplace)
    .orderBy(sql`coalesce(sum(${kdpRoyaltiesEstimatorData.royalty}), 0) desc`)
    .limit(limit);

    return topBooks.map(book => ({
      title: book.title,
      asin: book.asin,
      currency: book.currency || 'USD',
      marketplace: book.marketplace || 'N/A',
      totalSales: Number(book.totalSales),
      totalRoyalty: Number(book.totalRoyalty),
      totalUnits: 0,
      avgRoyaltyRate: Number(book.avgRoyalty)
    }));
  }

  async getMarketplaceBreakdown(userId: string): Promise<any[]> {
    // Group by marketplace AND currency to avoid mixing currencies
    const marketplaceData = await db.select({
      marketplace: kdpRoyaltiesEstimatorData.marketplace,
      currency: kdpRoyaltiesEstimatorData.currency,
      totalSales: sql<number>`count(*)`,
      totalRoyalty: sql<number>`coalesce(sum(${kdpRoyaltiesEstimatorData.royalty}), 0)`,
      uniqueBooks: sql<number>`count(distinct ${kdpRoyaltiesEstimatorData.asin})`
    })
    .from(kdpRoyaltiesEstimatorData)
    .innerJoin(kdpImports, eq(kdpRoyaltiesEstimatorData.importId, kdpImports.id))
    .where(and(
      eq(kdpImports.userId, userId),
      sql`${kdpImports.detectedType} != 'payments'`,
      isNotNull(kdpRoyaltiesEstimatorData.marketplace),
      sql`${kdpRoyaltiesEstimatorData.marketplace} != ''`,
      sql`${kdpRoyaltiesEstimatorData.royalty} > 0`
    ))
    .groupBy(kdpRoyaltiesEstimatorData.marketplace, kdpRoyaltiesEstimatorData.currency)
    .orderBy(sql`coalesce(sum(${kdpRoyaltiesEstimatorData.royalty}), 0) desc`);

    return marketplaceData.map(item => ({
      marketplace: item.marketplace,
      currency: item.currency || 'USD',
      totalSales: Number(item.totalSales),
      totalRoyalty: Number(item.totalRoyalty),
      totalUnits: 0,
      uniqueBooks: Number(item.uniqueBooks)
    }));
  }

  // Enhanced analytics methods with real USD currency conversion
  async getAnalyticsOverviewUSD(userId: string, exchangeRateService?: any): Promise<any> {
    const basicOverview = await this.getAnalyticsOverview(userId);
    
    if (!exchangeRateService) {
      return basicOverview;
    }

    // Convert all currency amounts to USD
    const convertedRoyalties = await Promise.all(
      basicOverview.royaltiesByCurrency.map(async (item: any) => {
        try {
          const convertedAmount = await exchangeRateService.convertCurrency(
            item.amount,
            item.currency,
            'USD'
          );
          return {
            ...item,
            amountUSD: convertedAmount,
            originalAmount: item.amount,
            originalCurrency: item.currency
          };
        } catch (error) {
          console.warn(`Failed to convert ${item.currency} to USD:`, error);
          return {
            ...item,
            amountUSD: item.currency === 'USD' ? item.amount : 0,
            originalAmount: item.amount,
            originalCurrency: item.currency
          };
        }
      })
    );

    return {
      ...basicOverview,
      royaltiesByCurrency: convertedRoyalties,
      totalRoyaltiesUSD: convertedRoyalties.reduce((sum, item) => sum + item.amountUSD, 0)
    };
  }

  async getTopPerformersUSD(userId: string, limit: number = 10, exchangeRateService?: any): Promise<any[]> {
    const basicPerformers = await this.getTopPerformers(userId, limit);
    
    if (!exchangeRateService) {
      return basicPerformers;
    }

    // Convert all performer royalties to USD
    const convertedPerformers = await Promise.all(
      basicPerformers.map(async (performer: any) => {
        try {
          const convertedRoyalty = await exchangeRateService.convertCurrency(
            performer.totalRoyalty,
            performer.currency,
            'USD'
          );
          return {
            ...performer,
            totalRoyaltyUSD: convertedRoyalty,
            originalRoyalty: performer.totalRoyalty,
            originalCurrency: performer.currency
          };
        } catch (error) {
          console.warn(`Failed to convert ${performer.currency} to USD:`, error);
          return {
            ...performer,
            totalRoyaltyUSD: performer.currency === 'USD' ? performer.totalRoyalty : 0,
            originalRoyalty: performer.totalRoyalty,
            originalCurrency: performer.currency
          };
        }
      })
    );

    // Sort by USD royalty amount
    return convertedPerformers.sort((a, b) => b.totalRoyaltyUSD - a.totalRoyaltyUSD);
  }

  async getMarketplaceBreakdownUSD(userId: string, exchangeRateService?: any): Promise<any[]> {
    const basicBreakdown = await this.getMarketplaceBreakdown(userId);
    
    if (!exchangeRateService) {
      return basicBreakdown;
    }

    // Convert all marketplace royalties to USD
    const convertedBreakdown = await Promise.all(
      basicBreakdown.map(async (marketplace: any) => {
        try {
          const convertedRoyalty = await exchangeRateService.convertCurrency(
            marketplace.totalRoyalty,
            marketplace.currency,
            'USD'
          );
          return {
            ...marketplace,
            totalRoyaltyUSD: convertedRoyalty,
            originalRoyalty: marketplace.totalRoyalty,
            originalCurrency: marketplace.currency
          };
        } catch (error) {
          console.warn(`Failed to convert ${marketplace.currency} to USD:`, error);
          return {
            ...marketplace,
            totalRoyaltyUSD: marketplace.currency === 'USD' ? marketplace.totalRoyalty : 0,
            originalRoyalty: marketplace.totalRoyalty,
            originalCurrency: marketplace.currency
          };
        }
      })
    );

    return convertedBreakdown.sort((a, b) => b.totalRoyaltyUSD - a.totalRoyaltyUSD);
  }

  async getSalesTrendsUSD(userId: string, days: number, exchangeRateService?: any): Promise<any[]> {
    const basicTrends = await this.getSalesTrends(userId, days);
    
    if (!exchangeRateService) {
      return basicTrends;
    }

    // For trends, we'll use a default currency conversion approach
    // Since trends don't have currency info, we'll assume they're in the user's primary currency
    // and convert to USD. For now, we'll return the basic trends as-is since they're aggregated.
    return basicTrends;
  }

  // NOUVELLES MÉTHODES : Consolidation des données de vente
  async consolidateKdpData(userId: string, exchangeRateService?: any): Promise<{ processed: number; updated: number }> {
    console.log(`[CONSOLIDATION] Démarrage de la consolidation pour l'utilisateur ${userId}`);
    
    // Les données "payments" sont des paiements agrégés par devise et marketplace
    // On va consolider par devise et marketplace plutôt que par ASIN
    const rawData = await db.select({
      currency: kdpImportData.currency,
      marketplace: kdpImportData.marketplace,
      totalRoyalty: sql<number>`COALESCE(SUM(${kdpImportData.royalty}), 0)`,
      totalUnits: sql<number>`COALESCE(SUM(${kdpImportData.netUnitsSold}), 0)`,
      importIds: sql<string[]>`array_agg(DISTINCT ${kdpImportData.importId})`,
      recordCount: sql<number>`COUNT(*)`,
    }).from(kdpImportData)
    .innerJoin(kdpImports, eq(kdpImportData.importId, kdpImports.id))
    .where(and(
      eq(kdpImports.userId, userId),
      eq(kdpImportData.isDuplicate, false),
      // INCLURE uniquement les fichiers "payments" pour éviter les doublons
      sql`${kdpImports.detectedType} = 'payments'`,
      isNotNull(kdpImportData.currency),
      sql`${kdpImportData.royalty} > 0`
    ))
    .groupBy(
      kdpImportData.currency,
      kdpImportData.marketplace
    );

    console.log(`[CONSOLIDATION] ${rawData.length} entrées uniques trouvées`);

    let processed = 0;
    let updated = 0;

    for (const data of rawData) {
      try {
        // Créer une clé unique pour les paiements agrégés
        const consolidatedKey = `PAYMENTS_${data.currency}_${data.marketplace || 'UNKNOWN'}`;
        
        // Calculer la conversion USD si un service de taux de change est disponible
        let royaltyUSD = data.totalRoyalty;
        let exchangeRate = 1.0;
        let exchangeRateDate = new Date().toISOString().split('T')[0];

        if (exchangeRateService && data.currency !== 'USD') {
          try {
            const rate = await exchangeRateService.getExchangeRate(data.currency, 'USD');
            if (rate && rate > 0) {
              royaltyUSD = data.totalRoyalty * rate;
              exchangeRate = rate;
            }
          } catch (error) {
            console.warn(`[CONSOLIDATION] Échec conversion ${data.currency} -> USD pour ${consolidatedKey}:`, error);
          }
        }
        
        // Upsert dans la table consolidée
        await db
          .insert(consolidatedSalesData)
          .values({
            user_id: userId,
            title: `Paiements agrégés ${data.currency}`,
            authorName: 'Données de paiement',
            currency: data.currency,
            totalRoyalty: data.totalRoyalty.toString(),
            totalUnitsSold: data.totalUnits,
            totalRoyaltyUSD: royaltyUSD.toString(),
            exchangeRate: exchangeRate.toString(),
            exchangeRateDate,
            marketplace: data.marketplace || 'Multiple',
            format: 'payments',
            lastUpdateDate: new Date().toISOString().split('T')[0],
            sourceImportIds: data.importIds,
          })
          .onConflictDoUpdate({
            target: [consolidatedSalesData.asin, consolidatedSalesData.currency, consolidatedSalesData.userId],
            set: {
              totalRoyalty: data.totalRoyalty.toString(),
              totalUnitsSold: data.totalUnits,
              totalRoyaltyUSD: royaltyUSD.toString(),
              exchangeRate: exchangeRate.toString(),
              exchangeRateDate,
              lastUpdateDate: new Date().toISOString().split('T')[0],
              sourceImportIds: data.importIds,
              updatedAt: new Date(),
            }
          });

        processed++;
        if (data.totalRoyalty > 0) updated++;
      } catch (error) {
        console.error(`[CONSOLIDATION] Erreur pour ${data.currency}:`, error);
      }
    }

    console.log(`[CONSOLIDATION] Terminé : ${processed} traités, ${updated} avec revenus`);
    return { processed, updated };
  }

  async getConsolidatedSalesOverview(userId: string): Promise<any> {
    console.log(`[CONSOLIDATION] Récupération overview pour utilisateur: ${userId}`);
    
    // Récupérer les données consolidées par devise
    const salesByCurrency = await db.select({
      currency: consolidatedSalesData.currency,
      totalRoyalty: sql<number>`COALESCE(SUM(${consolidatedSalesData.totalRoyalty}::decimal), 0)`,
      totalRoyaltyUSD: sql<number>`COALESCE(SUM(${consolidatedSalesData.totalRoyaltyUSD}::decimal), 0)`,
      totalUnits: sql<number>`COALESCE(SUM(${consolidatedSalesData.totalUnitsSold}), 0)`,
      bookCount: sql<number>`COUNT(DISTINCT ${consolidatedSalesData.asin})`
    }).from(consolidatedSalesData)
    .where(eq(consolidatedSalesData.userId, userId))
    .groupBy(consolidatedSalesData.currency);

    console.log(`[CONSOLIDATION] Trouvé ${salesByCurrency.length} devises`);

    // Statistiques générales
    const totalStats = await db.select({
      totalRecords: sql<number>`COUNT(*)`,
      uniqueBooks: sql<number>`COUNT(DISTINCT ${consolidatedSalesData.asin})`,
      totalUSDRevenue: sql<number>`COALESCE(SUM(${consolidatedSalesData.totalRoyaltyUSD}::decimal), 0)`,
    }).from(consolidatedSalesData)
    .where(eq(consolidatedSalesData.userId, userId));

    const result = {
      salesByCurrency: salesByCurrency.map(item => ({
        currency: item.currency,
        amount: Number(item.totalRoyalty),
        amountUSD: Number(item.totalRoyaltyUSD),
        transactions: Number(item.bookCount),
        units: Number(item.totalUnits)
      })),
      totalRecords: Number(totalStats[0]?.totalRecords || 0),
      uniqueBooks: Number(totalStats[0]?.uniqueBooks || 0),
      totalRoyaltiesUSD: Number(totalStats[0]?.totalUSDRevenue || 0)
    };

    console.log(`[CONSOLIDATION] Retour: ${result.totalRoyaltiesUSD} USD total`);
    return result;
  }

  // Master Books operations
  async getMasterBooks(userId: string): Promise<MasterBook[]> {
    return await db.select()
      .from(masterBooks)
      .where(eq(masterBooks.userId, userId))
      .orderBy(sql`${masterBooks.totalRoyaltiesUSD} DESC`);
  }

  async getMasterBookByAsin(asin: string): Promise<MasterBook | null> {
    const result = await db.select()
      .from(masterBooks)
      .where(eq(masterBooks.asin, asin))
      .limit(1);
    
    return result[0] || null;
  }

  async updateMasterBooksFromImport(userId: string, importId: string): Promise<void> {
    // Import du service MasterBooks
    const { MasterBooksService } = await import('./services/masterBooksService');
    await MasterBooksService.init();
    await MasterBooksService.updateFromImportData(userId, importId);
  }

  async getCurrenciesForUserPreferences(): Promise<Array<{code: string, name: string, symbol: string}>> {
    // Define the 8 major currencies in the specified order
    const majorCurrencies = ['USD', 'EUR', 'CNY', 'JPY', 'GBP', 'CHF', 'CAD', 'AUD'];

    // Get all available currencies alphabetically for the remaining ones
    const allCurrencies = await db
      .select({
        currency: exchangeRates.toCurrency
      })
      .from(exchangeRates)
      .groupBy(exchangeRates.toCurrency)
      .orderBy(asc(exchangeRates.toCurrency));

    const otherCurrencies = allCurrencies
      .filter(c => !majorCurrencies.includes(c.currency))
      .map(c => c.currency);

    // Currency mappings with names and symbols
    const currencyMappings: Record<string, {name: string, symbol: string}> = {
      'USD': { name: 'US Dollar', symbol: '$' },
      'EUR': { name: 'Euro', symbol: '€' },
      'CNY': { name: 'Chinese Yuan', symbol: '¥' },
      'JPY': { name: 'Japanese Yen', symbol: '¥' },
      'GBP': { name: 'British Pound', symbol: '£' },
      'CHF': { name: 'Swiss Franc', symbol: 'CHF' },
      'CAD': { name: 'Canadian Dollar', symbol: 'C$' },
      'AUD': { name: 'Australian Dollar', symbol: 'A$' },
      'SEK': { name: 'Swedish Krona', symbol: 'kr' },
      'NOK': { name: 'Norwegian Krone', symbol: 'kr' },
      'DKK': { name: 'Danish Krone', symbol: 'kr' },
      'KWD': { name: 'Kuwaiti Dinar', symbol: 'KWD' },
      'BHD': { name: 'Bahraini Dinar', symbol: 'BHD' },
      'OMR': { name: 'Omani Rial', symbol: 'OMR' },
      'JOD': { name: 'Jordanian Dinar', symbol: 'JOD' },
      'XDR': { name: 'Special Drawing Rights', symbol: 'XDR' },
      'JEP': { name: 'Jersey Pound', symbol: '£' },
      'SHP': { name: 'Saint Helena Pound', symbol: '£' },
      'FKP': { name: 'Falkland Islands Pound', symbol: '£' }
    };

    // Combine major currencies first, then others alphabetically
    const finalOrder = [...majorCurrencies, ...otherCurrencies];
    
    return finalOrder.map(code => ({
      code,
      name: currencyMappings[code]?.name || code,
      symbol: currencyMappings[code]?.symbol || code
    }));
  }
}

export const storage = new DatabaseStorage();
