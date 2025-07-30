import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertProjectSchema, insertContributorSchema, insertSalesDataSchema, insertBookSchema, insertSeriesSchema } from "@shared/schema";
import { aiService } from "./services/aiService";
import { parseKDPReport } from "./services/kdpParser";
import { z } from "zod";
import OpenAI from "openai";

// Admin middleware to check if user has admin or superadmin role
const isAdmin = async (req: any, res: any, next: any) => {
  try {
    const userId = req.user.claims.sub;
    const user = await storage.getUser(userId);
    
    if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
      return res.status(403).json({ message: "Admin access required" });
    }
    
    req.admin = user;
    next();
  } catch (error) {
    console.error("Error checking admin permissions:", error);
    res.status(500).json({ message: "Failed to verify admin permissions" });
  }
};

// Configure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only Excel and CSV files are allowed.'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Dashboard routes
  app.get('/api/dashboard/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stats = await storage.getUserDashboardStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Project routes
  app.get('/api/projects', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const projects = await storage.getUserProjects(userId);
      res.json(projects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.get('/api/projects/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const project = await storage.getProject(req.params.id, userId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      console.error("Error fetching project:", error);
      res.status(500).json({ message: "Failed to fetch project" });
    }
  });

  app.post('/api/projects', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id || "test-user-id";

      // Validate and prepare project data
      if (!req.body.name) {
        return res.status(400).json({ message: "Project name is required" });
      }
      
      const projectData = {
        title: req.body.name, // Frontend sends 'name', database expects 'title'
        name: req.body.name,  // Also store in 'name' field for consistency
        description: req.body.description || null,
        userId,
        status: 'draft' as const,
        totalSales: 0,
        totalRevenue: '0.00',
        language: 'English',
        publishingRights: 'owned',
        hasExplicitContent: false,
        primaryMarketplace: 'Amazon.com',
        isLowContentBook: false,
        isLargePrintBook: false,
        previouslyPublished: false,
        releaseOption: 'immediate',
        useAi: false
      };
      
      const project = await storage.createProject(projectData);
      
      // Contributors are now handled at book level, not project level

      // Generate AI content if requested
      if (req.body.useAI && req.body.aiPrompt && req.body.aiContentType) {
        try {
          const user = await storage.getUser(userId);
          if (user?.subscriptionTier === 'premium' || user?.subscriptionTier === 'pro') {
            const aiResponse = await aiService.generateContent(
              req.body.aiContentType,
              req.body.aiPrompt,
              req.body.title
            );

            await storage.addAiGeneration({
              userId,
              projectId: project.id,
              type: req.body.aiContentType,
              prompt: req.body.aiPrompt,
              response: aiResponse.content,
              tokensUsed: aiResponse.tokensUsed,
            });
          }
        } catch (aiError) {
          console.error("AI generation error:", aiError);
          // Don't fail the project creation if AI fails
        }
      }

      const fullProject = await storage.getProject(project.id, userId);
      res.json(fullProject);
    } catch (error) {
      console.error("Error creating project:", error);
      if (error instanceof z.ZodError) {
        console.log('Validation errors:', error.errors);
        return res.status(400).json({ message: "Invalid project data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create project" });
    }
  });

  // New route for duplicating projects with all books
  app.post('/api/projects/:id/duplicate', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id || "test-user-id";
      const projectId = req.params.id;
      
      console.log(`Duplicating project ${projectId} for user ${userId}`);
      
      const duplicatedProject = await storage.duplicateProject(projectId, userId);
      
      console.log(`Successfully duplicated project: ${duplicatedProject.id}`);
      res.json(duplicatedProject);
    } catch (error) {
      console.error("Error duplicating project:", error);
      res.status(500).json({ message: "Failed to duplicate project" });
    }
  });

  app.put('/api/projects/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      console.log('Updating project:', req.params.id, req.body);
      
      // Map frontend fields to database fields
      const updates: any = {};
      if (req.body.name !== undefined) {
        updates.title = req.body.name; // Frontend sends 'name', database expects 'title'
        updates.name = req.body.name;  // Also update the 'name' field for consistency
      }
      if (req.body.description !== undefined) {
        updates.description = req.body.description;
      }
      
      console.log('Parsed updates:', updates);
      const project = await storage.updateProject(req.params.id, userId, updates);
      console.log('Updated project:', project);
      
      res.json(project);
    } catch (error) {
      console.error("Error updating project:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid project data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update project" });
    }
  });

  app.delete('/api/projects/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const deleteBooks = req.query.deleteBooks === 'true';
      
      console.log(`Deleting project ${req.params.id} for user ${userId}, deleteBooks: ${deleteBooks}`);
      
      await storage.deleteProject(req.params.id, userId, deleteBooks);
      
      const message = deleteBooks 
        ? "Project and associated books deleted successfully"
        : "Project deleted successfully, books have been unlinked";
      
      res.json({ message });
    } catch (error) {
      console.error("Error deleting project:", error);
      res.status(500).json({ message: "Failed to delete project" });
    }
  });

  // Books routes
  app.post('/api/books', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      console.log('Creating book for user:', userId);
      console.log('Book data:', req.body);
      
      const bookData = insertBookSchema.parse({ ...req.body, userId });
      console.log('Parsed book data:', bookData);
      
      const book = await storage.createBook(bookData);
      console.log('Created book:', book);
      
      res.json(book);
    } catch (error) {
      console.error("Error creating book:", error);
      if (error instanceof z.ZodError) {
        console.log('Book validation errors:', error.errors);
        return res.status(400).json({ message: "Invalid book data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create book" });
    }
  });

  app.get('/api/books', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const books = await storage.getUserBooks(userId);
      res.json(books);
    } catch (error) {
      console.error("Error fetching books:", error);
      res.status(500).json({ message: "Failed to fetch books" });
    }
  });

  app.get('/api/books/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const book = await storage.getBook(req.params.id, userId);
      if (!book) {
        return res.status(404).json({ message: "Book not found" });
      }
      res.json(book);
    } catch (error) {
      console.error("Error fetching book:", error);
      res.status(500).json({ message: "Failed to fetch book" });
    }
  });

  app.put('/api/books/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const updates = insertBookSchema.partial().parse(req.body);
      
      const book = await storage.updateBook(req.params.id, userId, updates);
      res.json(book);
    } catch (error) {
      console.error("Error updating book:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid book data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update book" });
    }
  });

  app.patch('/api/books/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const updates = insertBookSchema.partial().parse(req.body);
      
      const book = await storage.updateBook(req.params.id, userId, updates);
      res.json(book);
    } catch (error) {
      console.error("Error updating book:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid book data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update book" });
    }
  });

  app.delete('/api/books/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.deleteBook(req.params.id, userId);
      res.json({ message: "Book deleted successfully" });
    } catch (error) {
      console.error("Error deleting book:", error);
      res.status(500).json({ message: "Failed to delete book" });
    }
  });

  // New route for duplicating books
  app.post('/api/books/:id/duplicate', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id || "test-user-id";
      const bookId = req.params.id;
      
      console.log(`Duplicating book ${bookId} for user ${userId}`);
      
      const duplicatedBook = await storage.duplicateBook(bookId, userId);
      
      console.log(`Successfully duplicated book: ${duplicatedBook.id}`);
      res.json(duplicatedBook);
    } catch (error) {
      console.error("Error duplicating book:", error);
      res.status(500).json({ message: "Failed to duplicate book" });
    }
  });

  // Contributors routes
  app.post('/api/contributors', isAuthenticated, async (req: any, res) => {
    try {
      const contributorData = insertContributorSchema.parse(req.body);
      const contributor = await storage.addContributor(contributorData);
      res.json(contributor);
    } catch (error) {
      console.error("Error adding contributor:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid contributor data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to add contributor" });
    }
  });

  app.delete('/api/contributors/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { projectId } = req.body;
      await storage.removeContributor(req.params.id, projectId);
      res.json({ message: "Contributor removed successfully" });
    } catch (error) {
      console.error("Error removing contributor:", error);
      res.status(500).json({ message: "Failed to remove contributor" });
    }
  });

  // KDP Reports routes
  app.post('/api/kdp-reports/upload', isAuthenticated, upload.single('kdpReport'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const userId = req.user.claims.sub;
      const salesRecords = await parseKDPReport(req.file.buffer, req.file.mimetype);

      // Save each sales record to database
      const savedRecords = [];
      for (const record of salesRecords) {
        const salesData = await storage.addSalesData({
          userId,
          bookId: record.projectId || record.asin || record.title || '', // Use fallback values
          reportDate: record.reportDate,
          format: record.format,
          marketplace: record.marketplace,
          unitsSold: record.unitsSold,
          revenue: record.revenue.toString(),
          royalty: record.royalty.toString(),
          fileName: req.file.originalname,
        });
        savedRecords.push(salesData);
      }

      res.json({ 
        message: "KDP report processed successfully", 
        recordsProcessed: savedRecords.length,
        records: savedRecords 
      });
    } catch (error) {
      console.error("Error processing KDP report:", error);
      res.status(500).json({ message: "Failed to process KDP report", error: (error as Error).message });
    }
  });

  app.get('/api/sales-data', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { startDate, endDate } = req.query;
      
      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;
      
      const salesData = await storage.getUserSalesData(userId, start, end);
      res.json(salesData);
    } catch (error) {
      console.error("Error fetching sales data:", error);
      res.status(500).json({ message: "Failed to fetch sales data" });
    }
  });

  // AI Assistant routes
  app.post('/api/ai/generate', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      // Temporarily allow AI access for all users for testing
      // if (user?.subscriptionTier === 'free') {
      //   return res.status(403).json({ message: "AI features require a premium subscription" });
      // }

      const { type, prompt, title } = req.body;
      if (!type || !prompt) {
        return res.status(400).json({ message: "Type and prompt are required" });
      }

      const result = await aiService.generateContent(type, prompt, title);
      
      // Save generation to database
      await storage.addAiGeneration({
        userId,
        projectId: req.body.projectId || null,
        type,
        prompt,
        response: result.content,
        tokensUsed: result.tokensUsed,
      });

      res.json(result);
    } catch (error) {
      console.error("Error generating AI content:", error);
      res.status(500).json({ message: "Failed to generate AI content", error: (error as Error).message });
    }
  });

  app.get('/api/ai/generations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const generations = await storage.getUserAiGenerations(userId);
      res.json(generations);
    } catch (error) {
      console.error("Error fetching AI generations:", error);
      res.status(500).json({ message: "Failed to fetch AI generations" });
    }
  });

  // Subscription routes
  app.post('/api/create-subscription', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user?.email) {
        return res.status(400).json({ message: "User email is required" });
      }

      // For now, just redirect to a placeholder or handle subscription logic
      // This would integrate with Stripe in a real implementation
      res.json({ 
        message: "Subscription feature coming soon",
        redirectUrl: "/subscription"
      });
    } catch (error) {
      console.error("Error creating subscription:", error);
      res.status(500).json({ message: "Failed to create subscription" });
    }
  });

  // Series routes
  app.get('/api/series', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const series = await storage.getUserSeries(userId);
      res.json(series);
    } catch (error) {
      console.error("Error fetching series:", error);
      res.status(500).json({ message: "Failed to fetch series" });
    }
  });

  app.post('/api/series', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const seriesData = insertSeriesSchema.parse({
        ...req.body,
        userId
      });
      
      const newSeries = await storage.createSeries(seriesData);
      
      res.status(201).json(newSeries);
    } catch (error) {
      console.error("Error creating series:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid series data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create series" });
      }
    }
  });

  // Admin routes
  app.get('/api/admin/stats', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const stats = await storage.getSystemStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching system stats:", error);
      res.status(500).json({ message: "Failed to fetch system stats" });
    }
  });

  // Admin AI Configuration Routes
  app.get('/api/admin/ai/stats', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const stats = {
        totalTokensUsed: 0, // Will be calculated from database
        totalCost: 0, // Will be calculated from database  
        monthlyRequests: 0, // Will be calculated from database
        activeTemplates: 0 // Will be calculated from database
      };
      res.json(stats);
    } catch (error) {
      console.error("Error fetching AI stats:", error);
      res.status(500).json({ message: "Failed to fetch AI stats" });
    }
  });

  // Mock prompt templates for initial interface
  app.get('/api/admin/ai/prompts', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const templates = [
        {
          id: "1",
          name: "Book Structure Generator",
          type: "structure",
          systemPrompt: "You are an expert book structure consultant. Create detailed outlines for books.",
          userPromptTemplate: "Create a structure for a {type} book about {topic}. Include chapters, sections, and key points.",
          model: "gpt-4o",
          maxTokens: 2000,
          temperature: 0.7,
          isActive: true,
          isDefault: true
        },
        {
          id: "2", 
          name: "Book Description Writer",
          type: "description",
          systemPrompt: "You are a marketing copywriter specializing in book descriptions that convert browsers into buyers.",
          userPromptTemplate: "Write a compelling book description for '{title}' - {description}. Make it engaging and sales-focused.",
          model: "gpt-4o",
          maxTokens: 1000,
          temperature: 0.8,
          isActive: true,
          isDefault: false
        }
      ];
      res.json(templates);
    } catch (error) {
      console.error("Error fetching prompt templates:", error);
      res.status(500).json({ message: "Failed to fetch prompt templates" });
    }
  });

  // Mock AI models for initial interface
  app.get('/api/admin/ai/models', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const models = [
        {
          id: "1",
          name: "gpt-4o",
          displayName: "GPT-4o",
          provider: "openai",
          inputPricePer1kTokens: 0.005,
          outputPricePer1kTokens: 0.015,
          maxTokens: 4096,
          contextWindow: 128000,
          isAvailable: true
        },
        {
          id: "2",
          name: "gpt-4o-mini",
          displayName: "GPT-4o Mini",
          provider: "openai", 
          inputPricePer1kTokens: 0.00015,
          outputPricePer1kTokens: 0.0006,
          maxTokens: 4096,
          contextWindow: 128000,
          isAvailable: true
        }
      ];
      res.json(models);
    } catch (error) {
      console.error("Error fetching AI models:", error);
      res.status(500).json({ message: "Failed to fetch AI models" });
    }
  });

  // Mock usage limits for initial interface
  app.get('/api/admin/ai/limits', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const limits = [
        {
          id: "1",
          subscriptionTier: "free",
          monthlyTokenLimit: 5000,
          dailyRequestLimit: 5,
          maxTokensPerRequest: 1000,
          allowedModels: ["gpt-4o-mini"]
        },
        {
          id: "2", 
          subscriptionTier: "premium",
          monthlyTokenLimit: 50000,
          dailyRequestLimit: 50,
          maxTokensPerRequest: 4000,
          allowedModels: ["gpt-4o", "gpt-4o-mini"]
        },
        {
          id: "3",
          subscriptionTier: "enterprise", 
          monthlyTokenLimit: null, // unlimited
          dailyRequestLimit: null, // unlimited
          maxTokensPerRequest: 8000,
          allowedModels: ["gpt-4o", "gpt-4o-mini"]
        }
      ];
      res.json(limits);
    } catch (error) {
      console.error("Error fetching usage limits:", error);
      res.status(500).json({ message: "Failed to fetch usage limits" });
    }
  });

  app.get('/api/admin/users', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { search, limit = 50, offset = 0 } = req.query;
      const result = await storage.getAllUsers(
        search as string,
        parseInt(limit as string),
        parseInt(offset as string)
      );
      res.json(result);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.put('/api/admin/users/:userId/role', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { role } = req.body;
      const { userId } = req.params;
      const adminUser = req.admin;

      if (!['user', 'admin', 'superadmin'].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }

      // Only superadmin can assign superadmin role
      if (role === 'superadmin' && adminUser.role !== 'superadmin') {
        return res.status(403).json({ message: "Only superadmin can assign superadmin role" });
      }

      const updatedUser = await storage.updateUserRole(userId, role);
      
      // Log admin action
      await storage.addAuditLog({
        userId: adminUser.id,
        action: 'update',
        resource: 'user',
        resourceId: userId,
        details: { oldRole: updatedUser.role, newRole: role },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  app.put('/api/admin/users/:userId/deactivate', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const adminUser = req.admin;

      const updatedUser = await storage.deactivateUser(userId);
      
      // Log admin action
      await storage.addAuditLog({
        userId: adminUser.id,
        action: 'update',
        resource: 'user',
        resourceId: userId,
        details: { action: 'deactivated' },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      res.json(updatedUser);
    } catch (error) {
      console.error("Error deactivating user:", error);
      res.status(500).json({ message: "Failed to deactivate user" });
    }
  });

  app.put('/api/admin/users/:userId/reactivate', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const adminUser = req.admin;

      const updatedUser = await storage.reactivateUser(userId);
      
      // Log admin action
      await storage.addAuditLog({
        userId: adminUser.id,
        action: 'update',
        resource: 'user',
        resourceId: userId,
        details: { action: 'reactivated' },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      res.json(updatedUser);
    } catch (error) {
      console.error("Error reactivating user:", error);
      res.status(500).json({ message: "Failed to reactivate user" });
    }
  });

  app.get('/api/admin/projects', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { limit = 50, offset = 0 } = req.query;
      const result = await storage.getAllProjects(
        parseInt(limit as string),
        parseInt(offset as string)
      );
      res.json(result);
    } catch (error) {
      console.error("Error fetching all projects:", error);
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.get('/api/admin/config', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const config = await storage.getSystemConfig();
      res.json(config);
    } catch (error) {
      console.error("Error fetching system config:", error);
      res.status(500).json({ message: "Failed to fetch system config" });
    }
  });

  app.put('/api/admin/config', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { key, value, description } = req.body;
      const adminUser = req.admin;

      if (!key || !value) {
        return res.status(400).json({ message: "Key and value are required" });
      }

      const config = await storage.updateSystemConfig(key, value, description, adminUser.id);
      
      // Log admin action
      await storage.addAuditLog({
        userId: adminUser.id,
        action: 'update',
        resource: 'system_config',
        resourceId: key,
        details: { key, value, description },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      res.json(config);
    } catch (error) {
      console.error("Error updating system config:", error);
      res.status(500).json({ message: "Failed to update system config" });
    }
  });

  app.get('/api/admin/audit-logs', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { limit = 100, offset = 0 } = req.query;
      const result = await storage.getAuditLogs(
        parseInt(limit as string),
        parseInt(offset as string)
      );
      res.json(result);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      res.status(500).json({ message: "Failed to fetch audit logs" });
    }
  });

  // Blog admin routes
  app.get('/api/admin/blog/categories', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const categories = await storage.getBlogCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching blog categories:", error);
      res.status(500).json({ message: "Failed to fetch blog categories" });
    }
  });

  app.post('/api/admin/blog/categories', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const adminUser = req.admin;
      const category = await storage.createBlogCategory(req.body);
      
      // Log admin action
      await storage.addAuditLog({
        userId: adminUser.id,
        action: 'create',
        resource: 'blog_category',
        resourceId: category.id,
        details: { name: category.name, slug: category.slug },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      res.json(category);
    } catch (error) {
      console.error("Error creating blog category:", error);
      res.status(500).json({ message: "Failed to create blog category" });
    }
  });

  app.put('/api/admin/blog/categories/:id', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const adminUser = req.admin;
      const category = await storage.updateBlogCategory(id, req.body);
      
      // Log admin action
      await storage.addAuditLog({
        userId: adminUser.id,
        action: 'update',
        resource: 'blog_category',
        resourceId: id,
        details: req.body,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      res.json(category);
    } catch (error) {
      console.error("Error updating blog category:", error);
      res.status(500).json({ message: "Failed to update blog category" });
    }
  });

  app.delete('/api/admin/blog/categories/:id', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const adminUser = req.admin;
      
      await storage.deleteBlogCategory(id);
      
      // Log admin action
      await storage.addAuditLog({
        userId: adminUser.id,
        action: 'delete',
        resource: 'blog_category',
        resourceId: id,
        details: {},
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting blog category:", error);
      res.status(500).json({ message: "Failed to delete blog category" });
    }
  });

  app.get('/api/admin/blog/posts', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { search, status, limit = 20, offset = 0 } = req.query;
      const result = await storage.getBlogPosts({
        search: search as string,
        status: status as string,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      });
      res.json(result);
    } catch (error) {
      console.error("Error fetching blog posts:", error);
      res.status(500).json({ message: "Failed to fetch blog posts" });
    }
  });

  app.get('/api/admin/blog/posts/:id', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const post = await storage.getBlogPost(id);
      if (!post) {
        return res.status(404).json({ message: "Blog post not found" });
      }
      res.json(post);
    } catch (error) {
      console.error("Error fetching blog post:", error);
      res.status(500).json({ message: "Failed to fetch blog post" });
    }
  });

  app.post('/api/admin/blog/posts', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const adminUser = req.admin;
      const postData = {
        ...req.body,
        authorId: adminUser.id,
      };
      const post = await storage.createBlogPost(postData);
      
      // Log admin action
      await storage.addAuditLog({
        userId: adminUser.id,
        action: 'create',
        resource: 'blog_post',
        resourceId: post.id,
        details: { title: post.title, status: post.status },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      res.json(post);
    } catch (error) {
      console.error("Error creating blog post:", error);
      res.status(500).json({ message: "Failed to create blog post" });
    }
  });

  app.put('/api/admin/blog/posts/:id', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const adminUser = req.admin;
      const post = await storage.updateBlogPost(id, req.body);
      
      // Log admin action
      await storage.addAuditLog({
        userId: adminUser.id,
        action: 'update',
        resource: 'blog_post',
        resourceId: id,
        details: req.body,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      res.json(post);
    } catch (error) {
      console.error("Error updating blog post:", error);
      res.status(500).json({ message: "Failed to update blog post" });
    }
  });

  app.put('/api/admin/blog/posts/:id/status', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const adminUser = req.admin;
      
      const post = await storage.updateBlogPostStatus(id, status);
      
      // Log admin action
      await storage.addAuditLog({
        userId: adminUser.id,
        action: 'update',
        resource: 'blog_post',
        resourceId: id,
        details: { action: 'status_change', status },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      res.json(post);
    } catch (error) {
      console.error("Error updating blog post status:", error);
      res.status(500).json({ message: "Failed to update blog post status" });
    }
  });

  app.delete('/api/admin/blog/posts/:id', isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const adminUser = req.admin;
      
      await storage.deleteBlogPost(id);
      
      // Log admin action
      await storage.addAuditLog({
        userId: adminUser.id,
        action: 'delete',
        resource: 'blog_post',
        resourceId: id,
        details: {},
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting blog post:", error);
      res.status(500).json({ message: "Failed to delete blog post" });
    }
  });

  // New AI Configuration routes for database fields
  app.post("/api/ai/generate-configured", isAuthenticated, async (req: any, res) => {
    try {
      const { functionType, context, customPrompt, customModel } = req.body;
      
      if (!functionType) {
        return res.status(400).json({ message: "Function type is required" });
      }

      // Import the AI service
      const { aiConfigService } = await import('./services/aiConfigService');
      
      const result = await aiConfigService.generateContent({
        functionType,
        context: context || { userId: req.user?.claims?.sub },
        customPrompt,
        customModel
      });

      res.json(result);
    } catch (error) {
      console.error("AI generation error:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to generate AI content" 
      });
    }
  });

  // Get available AI functions (dynamic from site features)
  app.get("/api/ai/functions", isAuthenticated, async (req, res) => {
    try {
      const { aiFunctionsService } = await import('./services/aiFunctionsService');
      const functions = aiFunctionsService.getAvailableFunctions();
      res.json(functions);
    } catch (error) {
      console.error("Error fetching AI functions:", error);
      res.status(500).json({ message: "Failed to fetch AI functions" });
    }
  });

  // Get AI functions by category (for admin configuration)
  app.get("/api/admin/ai/functions", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { aiFunctionsService } = await import('./services/aiFunctionsService');
      const functionsByCategory = aiFunctionsService.getFunctionsByCategory();
      res.json(functionsByCategory);
    } catch (error) {
      console.error("Error fetching AI functions by category:", error);
      res.status(500).json({ message: "Failed to fetch AI functions" });
    }
  });

  // Generate AI content using configured functions
  app.post("/api/ai/generate", isAuthenticated, async (req, res) => {
    try {
      const { functionKey, bookId, projectId, customPrompt, customModel, customTemperature } = req.body;
      const userId = req.user?.claims?.sub;
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Get the AI function configuration
      const { aiFunctionsService } = await import('./services/aiFunctionsService');
      const aiFunction = aiFunctionsService.getFunctionByKey(functionKey);
      
      if (!aiFunction) {
        return res.status(404).json({ message: "AI function not found" });
      }

      // Check if user's subscription tier can access this function
      const user = await storage.getUser(userId);
      if (!user || !aiFunction.availableForTiers.includes(user.subscriptionTier || 'free')) {
        return res.status(403).json({ message: "Subscription tier not allowed for this function" });
      }

      // Get context data if required
      let contextData: any = { user };
      
      if (aiFunction.requiresBookContext && bookId) {
        const book = await storage.getBook(bookId, userId);
        if (!book || book.userId !== userId) {
          return res.status(404).json({ message: "Book not found" });
        }
        contextData.book = book;
      }

      if (aiFunction.requiresProjectContext && projectId) {
        const project = await storage.getProject(projectId, userId);
        if (!project || project.userId !== userId) {
          return res.status(404).json({ message: "Project not found" });
        }
        contextData.project = project;
        
        // Get project books for additional context
        const books = await storage.getUserBooks(userId);
        const projectBooks = books.filter(book => book.projectId === projectId);
        contextData.projectBooks = projectBooks;
      }

      // Replace variables in the prompt template  
      const { databaseFieldsService } = await import('./services/databaseFieldsService');
      let finalPrompt = customPrompt || aiFunction.defaultUserPromptTemplate;
      
      // Prepare context values for variable replacement
      const contextValues: Record<string, any> = {};
      
      if (contextData.book) {
        Object.keys(contextData.book).forEach(key => {
          contextValues[key] = contextData.book[key];
        });
        // Add computed book fields
        contextValues.bookFullTitle = `${contextData.book.title}${contextData.book.subtitle ? ' - ' + contextData.book.subtitle : ''}`;
      }
      
      if (contextData.project) {
        Object.keys(contextData.project).forEach(key => {
          contextValues[key] = contextData.project[key];
        });
      }
      
      if (contextData.user) {
        Object.keys(contextData.user).forEach(key => {
          contextValues[key] = contextData.user[key];
        });
        contextValues.fullAuthorName = `${contextData.user.firstName || ''} ${contextData.user.lastName || ''}`.trim();
      }
      
      // Add system values
      contextValues.currentDate = new Date().toLocaleDateString('fr-FR');
      contextValues.currentYear = new Date().getFullYear();
      
      finalPrompt = databaseFieldsService.replaceVariables(finalPrompt, contextValues);

      // Use OpenAI to generate content
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      
      const completion = await openai.chat.completions.create({
        model: customModel || aiFunction.defaultModel,
        messages: [
          {
            role: "system",
            content: aiFunction.defaultSystemPrompt
          },
          {
            role: "user",
            content: finalPrompt
          }
        ],
        max_tokens: aiFunction.maxTokens,
        temperature: customTemperature !== undefined ? customTemperature : aiFunction.temperature,
      });

      const generatedContent = completion.choices[0]?.message?.content || '';
      
      // Track AI generation for analytics (simplified - would need to implement trackAIGeneration in storage)
      // await storage.trackAIGeneration({
      //   userId,
      //   functionKey,
      //   bookId: bookId || null,
      //   projectId: projectId || null,
      //   prompt: finalPrompt,
      //   response: generatedContent,
      //   model: customModel || aiFunction.defaultModel,
      //   tokensUsed: completion.usage?.total_tokens || 0,
      //   cost: calculateCost(completion.usage?.total_tokens || 0, customModel || aiFunction.defaultModel)
      // });

      res.json({
        content: generatedContent,
        tokensUsed: completion.usage?.total_tokens || 0,
        functionUsed: aiFunction.name
      });

    } catch (error) {
      console.error("Error generating AI content:", error);
      res.status(500).json({ message: "Failed to generate content" });
    }
  });

  // Get database fields for AI prompts (Admin only)
  app.get("/api/ai/database-fields", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { databaseFieldsService } = await import('./services/databaseFieldsService');
      const fields = databaseFieldsService.getCategorizedFields();
      res.json(fields);
    } catch (error) {
      console.error("Error fetching database fields:", error);
      res.status(500).json({ message: "Failed to fetch database fields" });
    }
  });

  // Get field values for a specific context
  app.post("/api/ai/field-values", isAuthenticated, async (req: any, res) => {
    try {
      const { context } = req.body;
      const { databaseFieldsService } = await import('./services/databaseFieldsService');
      
      const finalContext = {
        ...context,
        userId: context?.userId || req.user?.claims?.sub
      };
      
      const values = await databaseFieldsService.getFieldValues(finalContext);
      res.json(values);
    } catch (error) {
      console.error("Error fetching field values:", error);
      res.status(500).json({ message: "Failed to fetch field values" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
