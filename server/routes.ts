import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertProjectSchema, insertContributorSchema, insertSalesDataSchema, insertBookSchema, insertSeriesSchema, insertAuthorSchema, insertAuthorBiographySchema } from "@shared/schema";
import { aiService } from "./services/aiService";
import { parseKDPReport } from "./services/kdpParser";
import { generateUniqueIsbnPlaceholder, ensureIsbnPlaceholder } from "./utils/isbnGenerator";
import { seedDatabase, forceSeedDatabase } from "./seedDatabase.js";
import { z } from "zod";
import OpenAI from "openai";

// Global logs storage for persistent logging
interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  category?: string;
}

const globalLogs: LogEntry[] = [];
const MAX_LOGS = 1000; // Keep last 1000 logs

// Enhanced logging function
export const systemLog = (message: string, level: 'info' | 'warn' | 'error' | 'debug' = 'info', category?: string) => {
  const logEntry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    category
  };
  
  globalLogs.push(logEntry);
  
  // Keep only last MAX_LOGS entries
  if (globalLogs.length > MAX_LOGS) {
    globalLogs.splice(0, globalLogs.length - MAX_LOGS);
  }
  
  // Also log to console with timestamp
  const timestamp = new Date().toLocaleTimeString('fr-FR');
  const prefix = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : level === 'debug' ? '🔍' : 'ℹ️';
  console.log(`[${timestamp}] ${prefix} ${category ? `[${category}] ` : ''}${message}`);
};

// Get logs function
export const getSystemLogs = () => globalLogs

const clearSystemLogs = () => {
  globalLogs.length = 0; // Clear the array while keeping the reference
};

// Extend Express Request type to include authenticated user
interface AuthenticatedRequest extends Request {
  user?: any; // Simplified to avoid type conflicts
  admin?: any;
}

// Admin middleware to check if user has admin or superadmin role
const isAdmin = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.claims?.sub || req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }
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
  // Initialize system logs
  systemLog('🚀 Démarrage du serveur KDP Generator', 'info', 'SYSTEM');
  systemLog('🔧 Configuration des routes API...', 'info', 'SYSTEM');
  
  // Setup authentication
  await setupAuth(app);
  systemLog('🔐 Authentification configurée', 'info', 'AUTH');

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });



  // Dashboard routes
  app.get('/api/dashboard/stats', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      const stats = await storage.getUserDashboardStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Project routes
  app.get('/api/projects', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      const projects = await storage.getUserProjects(userId);
      res.json(projects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.get('/api/projects/:id', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
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

  app.post('/api/projects', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

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
  app.post('/api/projects/:id/duplicate', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
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

  app.put('/api/projects/:id', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
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

  app.delete('/api/projects/:id', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
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
  app.post('/api/books', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      console.log('Creating book for user:', userId);
      console.log('Book data:', req.body);
      
      const bookData = insertBookSchema.parse({ ...req.body, userId });
      console.log('Parsed book data:', bookData);
      
      const book = await storage.createBook(bookData);
      console.log('Created book:', book);
      
      // Generate ISBN placeholder if book doesn't have an official ISBN
      if (!book.isbn || book.isbn.startsWith('PlaceHolder-')) {
        const isbnPlaceholder = await ensureIsbnPlaceholder(book.id, book.isbn);
        if (isbnPlaceholder) {
          console.log('Generated ISBN placeholder:', isbnPlaceholder);
        }
      }
      
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

  app.get('/api/books', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      const books = await storage.getUserBooks(userId);
      res.json(books);
    } catch (error) {
      console.error("Error fetching books:", error);
      res.status(500).json({ message: "Failed to fetch books" });
    }
  });

  app.get('/api/books/:id', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
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

  app.put('/api/books/:id', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      const updates = insertBookSchema.partial().parse(req.body);
      
      const book = await storage.updateBook(req.params.id, userId, updates);
      
      // Generate or ensure ISBN placeholder if book doesn't have an official ISBN
      if (!book.isbn || book.isbn.startsWith('PlaceHolder-')) {
        const isbnPlaceholder = await ensureIsbnPlaceholder(book.id, book.isbn);
        if (isbnPlaceholder) {
          console.log('Ensured ISBN placeholder:', isbnPlaceholder);
        }
      }
      
      res.json(book);
    } catch (error) {
      console.error("Error updating book:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid book data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update book" });
    }
  });

  app.patch('/api/books/:id', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      const updates = insertBookSchema.partial().parse(req.body);
      
      const book = await storage.updateBook(req.params.id, userId, updates);
      
      // Generate or ensure ISBN placeholder if book doesn't have an official ISBN
      if (!book.isbn || book.isbn.startsWith('PlaceHolder-')) {
        const isbnPlaceholder = await ensureIsbnPlaceholder(book.id, book.isbn);
        if (isbnPlaceholder) {
          console.log('Ensured ISBN placeholder:', isbnPlaceholder);
        }
      }
      
      res.json(book);
    } catch (error) {
      console.error("Error updating book:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid book data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update book" });
    }
  });

  app.delete('/api/books/:id', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      await storage.deleteBook(req.params.id, userId);
      res.json({ message: "Book deleted successfully" });
    } catch (error) {
      console.error("Error deleting book:", error);
      res.status(500).json({ message: "Failed to delete book" });
    }
  });

  // Check ISBN uniqueness across all users
  app.get('/api/books/check-isbn/:isbn', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { isbn } = req.params;
      const { excludeBookId } = req.query;
      
      if (!isbn || isbn.trim() === '') {
        return res.status(400).json({ message: "ISBN is required" });
      }
      
      const existingBook = await storage.checkIsbnExists(isbn.trim(), excludeBookId as string);
      
      res.json({ 
        exists: !!existingBook,
        bookId: existingBook?.id || null
      });
    } catch (error) {
      console.error("Error checking ISBN:", error);
      res.status(500).json({ message: "Failed to check ISBN uniqueness" });
    }
  });

  // New route for duplicating books
  app.post('/api/books/:id/duplicate', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
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
  app.post('/api/contributors', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      console.log('Received contributor data:', req.body);
      const validatedData = insertContributorSchema.parse(req.body);
      console.log('Validated contributor data:', validatedData);
      const contributor = await storage.addContributor(validatedData);
      res.json(contributor);
    } catch (error) {
      console.error("Error adding contributor:", error);
      res.status(500).json({ message: "Failed to add contributor" });
    }
  });

  app.get('/api/contributors/book/:bookId', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { bookId } = req.params;
      const contributors = await storage.getBookContributors(bookId);
      res.json(contributors);
    } catch (error) {
      console.error("Error fetching contributors:", error);
      res.status(500).json({ message: "Failed to fetch contributors" });
    }
  });

  app.delete('/api/contributors/:id/:bookId', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id, bookId } = req.params;
      await storage.removeContributor(id, bookId);
      res.json({ message: "Contributor removed successfully" });
    } catch (error) {
      console.error("Error removing contributor:", error);
      res.status(500).json({ message: "Failed to remove contributor" });
    }
  });

  // KDP Reports routes
  app.post('/api/kdp-reports/upload', isAuthenticated, upload.single('kdpReport'), async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
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

  app.get('/api/sales-data', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
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
  app.post('/api/ai/generate', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
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

  app.get('/api/ai/generations', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      const generations = await storage.getUserAiGenerations(userId);
      res.json(generations);
    } catch (error) {
      console.error("Error fetching AI generations:", error);
      res.status(500).json({ message: "Failed to fetch AI generations" });
    }
  });

  // Subscription routes
  app.post('/api/create-subscription', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
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
  app.get('/api/series', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      const series = await storage.getUserSeries(userId);
      res.json(series);
    } catch (error) {
      console.error("Error fetching series:", error);
      res.status(500).json({ message: "Failed to fetch series" });
    }
  });

  app.get('/api/series/:id', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      const seriesId = req.params.id;
      
      const series = await storage.getSeries(seriesId, userId);
      
      if (!series) {
        return res.status(404).json({ message: "Series not found" });
      }
      
      res.json(series);
    } catch (error) {
      console.error("Error fetching series:", error);
      res.status(500).json({ message: "Failed to fetch series" });
    }
  });

  app.post('/api/series', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      if (!userId) {
        console.error('No userId found in request. User object:', JSON.stringify(req.user));
        return res.status(401).json({ message: "User not authenticated" });
      }
      
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

  app.put('/api/series/:id', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      const seriesId = req.params.id;
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const updateData = req.body;
      
      const updatedSeries = await storage.updateSeries(seriesId, userId, updateData);
      
      if (!updatedSeries) {
        return res.status(404).json({ message: "Series not found" });
      }
      
      res.json(updatedSeries);
    } catch (error) {
      console.error("Error updating series:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid series data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update series" });
      }
    }
  });

  app.delete('/api/series/:id', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      const seriesId = req.params.id;
      
      // Check if series exists first
      const existingSeries = await storage.getSeries(seriesId, userId);
      if (!existingSeries) {
        return res.status(404).json({ message: "Series not found" });
      }
      
      await storage.deleteSeries(seriesId, userId);
      
      res.json({ message: "Series deleted successfully" });
    } catch (error) {
      console.error("Error deleting series:", error);
      res.status(500).json({ message: "Failed to delete series" });
    }
  });

  // Get marketplace categories with format filter
  app.get('/api/marketplace-categories/:marketplace', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { marketplace } = req.params;
      const { format } = req.query;
      
      if (!marketplace) {
        return res.status(400).json({ message: "Marketplace parameter is required" });
      }

      const categories = await storage.getMarketplaceCategoriesWithFormat(marketplace, format as string);
      res.json(categories);
    } catch (error) {
      console.error("Error fetching marketplace categories:", error);
      res.status(500).json({ message: "Failed to fetch marketplace categories" });
    }
  });

  // Admin routes
  app.get('/api/admin/stats', isAuthenticated, isAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const stats = await storage.getSystemStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching system stats:", error);
      res.status(500).json({ message: "Failed to fetch system stats" });
    }
  });

  // Admin AI Configuration Routes
  app.get('/api/admin/ai/stats', isAuthenticated, isAdmin, async (req: AuthenticatedRequest, res: Response) => {
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
  app.get('/api/admin/ai/prompts', isAuthenticated, isAdmin, async (req: AuthenticatedRequest, res: Response) => {
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
  app.get('/api/admin/ai/models', isAuthenticated, isAdmin, async (req: AuthenticatedRequest, res: Response) => {
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
  app.get('/api/admin/ai/limits', isAuthenticated, isAdmin, async (req: AuthenticatedRequest, res: Response) => {
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

  app.get('/api/admin/users', isAuthenticated, isAdmin, async (req: AuthenticatedRequest, res: Response) => {
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

  app.put('/api/admin/users/:userId/role', isAuthenticated, isAdmin, async (req: AuthenticatedRequest, res: Response) => {
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

  app.put('/api/admin/users/:userId/deactivate', isAuthenticated, isAdmin, async (req: AuthenticatedRequest, res: Response) => {
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

  app.put('/api/admin/users/:userId/reactivate', isAuthenticated, isAdmin, async (req: AuthenticatedRequest, res: Response) => {
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

  app.get('/api/admin/projects', isAuthenticated, isAdmin, async (req: AuthenticatedRequest, res: Response) => {
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

  app.get('/api/admin/config', isAuthenticated, isAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const config = await storage.getSystemConfig();
      res.json(config);
    } catch (error) {
      console.error("Error fetching system config:", error);
      res.status(500).json({ message: "Failed to fetch system config" });
    }
  });

  app.put('/api/admin/config', isAuthenticated, isAdmin, async (req: AuthenticatedRequest, res: Response) => {
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

  app.get('/api/admin/audit-logs', isAuthenticated, isAdmin, async (req: AuthenticatedRequest, res: Response) => {
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

  // System logs endpoint (admin only)
  app.get('/api/admin/system/logs', isAuthenticated, isAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { limit = 100 } = req.query;
      const limitNum = parseInt(limit as string);
      const logs = getSystemLogs();
      
      // Return last N logs, most recent first
      const recentLogs = logs.slice(-limitNum).reverse();
      
      res.json({
        logs: recentLogs,
        total: logs.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      systemLog(`Erreur lors de la récupération des logs: ${error}`, 'error', 'API');
      res.status(500).json({ message: "Failed to fetch system logs" });
    }
  });

  // Clear system logs endpoint (admin only)
  app.delete('/api/admin/system/logs', isAuthenticated, isAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const previousCount = getSystemLogs().length;
      clearSystemLogs(); // Clear the logs array
      
      systemLog('📝 Logs système effacés par l\'administrateur', 'info', 'ADMIN');
      
      res.json({ 
        message: 'System logs cleared successfully',
        previousCount,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      systemLog(`Erreur lors de l'effacement des logs: ${error}`, 'error', 'API');
      res.status(500).json({ message: 'Failed to clear system logs' });
    }
  });

  // System health endpoint with enhanced logging
  app.get('/api/admin/system/health', isAuthenticated, isAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      systemLog('Vérification de la santé du système demandée', 'info', 'HEALTH');
      
      const { db } = await import('./db.js');
      const { marketplaceCategories, users, projects, books } = await import('@shared/schema');
      
      const [categoriesCount, usersCount, projectsCount, booksCount] = await Promise.all([
        db.select().from(marketplaceCategories),
        db.select().from(users),
        db.select().from(projects),
        db.select().from(books)
      ]);

      const uptime = process.uptime();
      const memoryUsage = process.memoryUsage();

      const health = {
        database: categoriesCount.length > 0 ? 'healthy' : 'error',
        categories: categoriesCount.length,
        totalUsers: usersCount.length,
        totalProjects: projectsCount.length,
        totalBooks: booksCount.length,
        uptime: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`,
        memoryUsage: {
          used: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
          total: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
          percentage: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100)
        },
        lastSeeded: new Date().toISOString(),
        timestamp: new Date().toISOString()
      };

      systemLog(`Santé système: ${health.database}, ${health.categories} catégories, ${health.totalUsers} utilisateurs`, 'info', 'HEALTH');
      
      res.json(health);
    } catch (error) {
      systemLog(`Erreur lors de la vérification de santé: ${error}`, 'error', 'HEALTH');
      res.status(500).json({ message: "Failed to check system health" });
    }
  });

  // Blog admin routes
  app.get('/api/admin/blog/categories', isAuthenticated, isAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const categories = await storage.getBlogCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching blog categories:", error);
      res.status(500).json({ message: "Failed to fetch blog categories" });
    }
  });

  app.post('/api/admin/blog/categories', isAuthenticated, isAdmin, async (req: AuthenticatedRequest, res: Response) => {
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

  app.put('/api/admin/blog/categories/:id', isAuthenticated, isAdmin, async (req: AuthenticatedRequest, res: Response) => {
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

  app.delete('/api/admin/blog/categories/:id', isAuthenticated, isAdmin, async (req: AuthenticatedRequest, res: Response) => {
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

  app.get('/api/admin/blog/posts', isAuthenticated, isAdmin, async (req: AuthenticatedRequest, res: Response) => {
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

  app.get('/api/admin/blog/posts/:id', isAuthenticated, isAdmin, async (req: AuthenticatedRequest, res: Response) => {
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

  app.post('/api/admin/blog/posts', isAuthenticated, isAdmin, async (req: AuthenticatedRequest, res: Response) => {
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

  app.put('/api/admin/blog/posts/:id', isAuthenticated, isAdmin, async (req: AuthenticatedRequest, res: Response) => {
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

  app.put('/api/admin/blog/posts/:id/status', isAuthenticated, isAdmin, async (req: AuthenticatedRequest, res: Response) => {
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

  app.delete('/api/admin/blog/posts/:id', isAuthenticated, isAdmin, async (req: AuthenticatedRequest, res: Response) => {
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

  // Author routes
  app.get('/api/authors', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const authors = await storage.getUserAuthors(userId);
      res.json(authors);
    } catch (error) {
      console.error("Error fetching authors:", error);
      res.status(500).json({ message: "Failed to fetch authors" });
    }
  });

  app.get('/api/authors/:authorId', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      const { authorId } = req.params;
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const author = await storage.getAuthor(authorId, userId);
      if (!author) {
        return res.status(404).json({ message: "Author not found" });
      }

      res.json(author);
    } catch (error) {
      console.error("Error fetching author:", error);
      res.status(500).json({ message: "Failed to fetch author" });
    }
  });

  app.post('/api/authors', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const authorData = insertAuthorSchema.parse({ ...req.body, userId });
      const author = await storage.createAuthor(authorData);
      res.json(author);
    } catch (error) {
      console.error("Error creating author:", error);
      res.status(500).json({ message: "Failed to create author" });
    }
  });

  app.put('/api/authors/:authorId', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      const { authorId } = req.params;
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const updates = insertAuthorSchema.partial().parse(req.body);
      const author = await storage.updateAuthor(authorId, userId, updates);
      res.json(author);
    } catch (error) {
      console.error("Error updating author:", error);
      res.status(500).json({ message: "Failed to update author" });
    }
  });

  app.delete('/api/authors/:authorId', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      const { authorId } = req.params;
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      await storage.deleteAuthor(authorId, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting author:", error);
      res.status(500).json({ message: "Failed to delete author" });
    }
  });

  app.get('/api/authors/:authorId/biography/:language', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      const { authorId, language } = req.params;
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      // Verify user owns the author
      const author = await storage.getAuthor(authorId, userId);
      if (!author) {
        return res.status(404).json({ message: "Author not found" });
      }

      const biography = await storage.getAuthorBiography(authorId, language);
      res.json(biography || { authorId, language, biography: '' });
    } catch (error) {
      console.error("Error fetching author biography:", error);
      res.status(500).json({ message: "Failed to fetch author biography" });
    }
  });

  app.put('/api/authors/:authorId/biography/:language', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      const { authorId, language } = req.params;
      const { biography } = req.body;
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      // Verify user owns the author
      const author = await storage.getAuthor(authorId, userId);
      if (!author) {
        return res.status(404).json({ message: "Author not found" });
      }

      const biographyData = insertAuthorBiographySchema.parse({ authorId, language, biography });
      const savedBiography = await storage.upsertAuthorBiography(biographyData);
      res.json(savedBiography);
    } catch (error) {
      console.error("Error saving author biography:", error);
      res.status(500).json({ message: "Failed to save author biography" });
    }
  });

  app.get('/api/authors/:authorId/projects', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      const { authorId } = req.params;
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const projects = await storage.getAuthorProjects(authorId, userId);
      res.json(projects);
    } catch (error) {
      console.error("Error fetching author projects:", error);
      res.status(500).json({ message: "Failed to fetch author projects" });
    }
  });

  app.get('/api/authors/:authorId/books', isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      const { authorId } = req.params;
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const books = await storage.getAuthorBooks(authorId, userId);
      res.json(books);
    } catch (error) {
      console.error("Error fetching author books:", error);
      res.status(500).json({ message: "Failed to fetch author books" });
    }
  });

  // New AI Configuration routes for database fields
  app.post("/api/ai/generate-configured", isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { functionType, context, customPrompt, customModel } = req.body;
      
      if (!functionType) {
        return res.status(400).json({ message: "Function type is required" });
      }

      // Import the AI service
      const { aiConfigService } = await import('./services/aiConfigService');
      
      const result = await aiConfigService.generateContent({
        functionType,
        context: context || { userId: req.user?.id },
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
      const userId = req.user?.replit?.id;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
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
  app.post("/api/ai/field-values", isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
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

  // System health endpoint (admin only)
  app.get('/api/admin/system/health', isAuthenticated, isAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { db } = await import('./db.js');
      const { marketplaceCategories, users, projects, books } = await import('@shared/schema');
      
      // Get database counts
      const [categoriesCount, usersCount, projectsCount, booksCount] = await Promise.all([
        db.select().from(marketplaceCategories),
        db.select().from(users),
        db.select().from(projects),
        db.select().from(books)
      ]);

      // Get system metrics
      const memUsage = process.memoryUsage();
      const uptime = process.uptime();
      
      // Calculate uptime in human readable format
      const uptimeHours = Math.floor(uptime / 3600);
      const uptimeMinutes = Math.floor((uptime % 3600) / 60);
      const uptimeFormatted = `${uptimeHours}h ${uptimeMinutes}m`;
      
      // Memory usage in MB
      const memUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
      const memTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
      const memPercentage = Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100);
      
      const health = {
        database: categoriesCount.length > 0 ? 'healthy' : 'warning',
        categories: categoriesCount.length,
        totalUsers: usersCount.length,
        totalProjects: projectsCount.length,
        totalBooks: booksCount.length,
        lastSeeded: categoriesCount.length > 0 ? new Date().toISOString() : null,
        uptime: uptimeFormatted,
        memoryUsage: {
          used: `${memUsedMB} MB`,
          total: `${memTotalMB} MB`,
          percentage: memPercentage
        }
      };
      
      res.json(health);
    } catch (error) {
      console.error("Error checking system health:", error);
      res.status(500).json({ 
        database: 'error',
        categories: 0,
        totalUsers: 0,
        totalProjects: 0,
        totalBooks: 0,
        lastSeeded: null,
        uptime: '0h 0m',
        memoryUsage: { used: '0 MB', total: '0 MB', percentage: 0 },
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // Database stats endpoint (admin only) - Real data only
  app.get('/api/admin/database/stats', isAuthenticated, isAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { db } = await import('./db.js');
      const { marketplaceCategories, users, projects, books } = await import('@shared/schema');
      
      // Get real database statistics
      const [categoriesCount, usersCount, projectsCount, booksCount] = await Promise.all([
        db.select().from(marketplaceCategories),
        db.select().from(users),
        db.select().from(projects),
        db.select().from(books)
      ]);

      const stats = {
        timestamp: new Date().toISOString(),
        categories: categoriesCount.length,
        users: usersCount.length,
        projects: projectsCount.length,
        books: booksCount.length
      };

      res.json(stats);
    } catch (error) {
      console.error("Error getting database stats:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Stats fetch failed' });
    }
  });

  // System configuration endpoint (admin only) - Read-only
  app.get('/api/admin/system/config', isAuthenticated, isAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const config = {
        environment: process.env.NODE_ENV || 'development',
        database: {
          connected: true,
          type: 'PostgreSQL'
        },
        features: {
          autoSeeding: true,
          cacheEnabled: true,
          aiIntegration: !!process.env.OPENAI_API_KEY
        },
        version: process.env.npm_package_version || '1.0.0',
        uptime: Math.floor(process.uptime()),
        memoryUsage: process.memoryUsage()
      };
      
      res.json(config);
    } catch (error) {
      console.error("Error getting system config:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Config fetch failed' });
    }
  });

  // Database seeding endpoints (admin only)
  app.post('/api/admin/database/seed', isAuthenticated, isAdmin, async (req: AuthenticatedRequest, res: Response) => {
    const startTime = Date.now();
    
    try {
      systemLog('🚀 Début de la synchronisation de la base de données', 'info', 'SEED');
      systemLog(`👤 Demande initiée par l'utilisateur: ${req.user?.email || 'Inconnu'}`, 'info', 'SEED');
      systemLog('🔍 Vérification des catégories existantes...', 'info', 'SEED');
      
      await seedDatabase();
      
      const duration = Date.now() - startTime;
      systemLog(`✅ Synchronisation terminée avec succès en ${duration}ms`, 'info', 'SEED');
      systemLog('📊 Opération complète, retour de la réponse positive', 'info', 'SEED');
      
      res.json({ 
        message: 'Database seeding completed successfully',
        success: true,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      systemLog(`❌ Erreur lors de la synchronisation: ${error}`, 'error', 'SEED');
      systemLog(`🔍 Stack trace: ${error instanceof Error ? error.stack : 'Non disponible'}`, 'error', 'SEED');
      systemLog(`⏱️ Échec après ${duration}ms`, 'error', 'SEED');
      
      res.status(500).json({ 
        message: "Failed to seed database",
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Admin Category Migration Routes
  app.post('/api/admin/categories/backup', isAuthenticated, isAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const success = await storage.backupMarketplaceCategories();
      if (success) {
        res.json({ message: 'Categories backed up successfully', success: true });
      } else {
        res.status(500).json({ message: 'Failed to backup categories', success: false });
      }
    } catch (error) {
      console.error("Error backing up categories:", error);
      res.status(500).json({ message: "Failed to backup categories", success: false });
    }
  });

  app.post('/api/admin/categories/rollback', isAuthenticated, isAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const success = await storage.rollbackMarketplaceCategories();
      if (success) {
        res.json({ message: 'Categories rolled back successfully', success: true });
      } else {
        res.status(500).json({ message: 'Failed to rollback categories', success: false });
      }
    } catch (error) {
      console.error("Error rolling back categories:", error);
      res.status(500).json({ message: "Failed to rollback categories", success: false });
    }
  });

  app.post('/api/admin/categories/validate', isAuthenticated, isAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { categories } = req.body;
      const validation = await storage.validateCategoryStructure(categories);
      res.json(validation);
    } catch (error) {
      console.error("Error validating categories:", error);
      res.status(500).json({ isValid: false, errors: ['Validation failed'] });
    }
  });

  app.post('/api/admin/categories/migrate', isAuthenticated, isAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { categories } = req.body;
      if (!categories || !Array.isArray(categories)) {
        return res.status(400).json({ success: false, errors: ['Categories array is required'] });
      }

      const result = await storage.migrateMarketplaceCategoriesWithFormats(categories);
      
      if (result.success) {
        res.json({ 
          message: `Successfully migrated ${categories.length} categories`,
          success: true,
          categoriesCount: categories.length
        });
      } else {
        res.status(400).json({
          message: 'Migration failed',
          success: false,
          errors: result.errors
        });
      }
    } catch (error) {
      console.error("Error migrating categories:", error);
      res.status(500).json({ 
        message: "Migration failed", 
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      });
    }
  });

  // Export current categories for dev-to-production sync
  app.get('/api/admin/categories/export', isAuthenticated, isAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      systemLog('📤 Export des catégories demandé', 'info', 'EXPORT');
      systemLog(`👤 Demande initiée par: ${req.user?.email || 'Inconnu'}`, 'info', 'EXPORT');
      
      const categories = await storage.exportAllMarketplaceCategories();
      systemLog(`📊 ${categories.length} catégories exportées`, 'info', 'EXPORT');
      
      res.json({
        success: true,
        categories,
        count: categories.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      systemLog(`❌ Erreur lors de l'export: ${error}`, 'error', 'EXPORT');
      console.error("Error exporting categories:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to export categories",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Sync categories from development to production
  app.post('/api/admin/categories/sync-to-production', isAuthenticated, isAdmin, async (req: AuthenticatedRequest, res: Response) => {
    const startTime = Date.now();
    
    try {
      const { productionUrl, categories } = req.body;
      
      if (!productionUrl || !categories || !Array.isArray(categories)) {
        return res.status(400).json({ 
          success: false, 
          errors: ['Production URL and categories array are required'] 
        });
      }

      systemLog('🔄 Début de la synchronisation Dev → Production', 'info', 'SYNC');
      systemLog(`👤 Demande initiée par: ${req.user?.email || 'Inconnu'}`, 'info', 'SYNC');
      systemLog(`🎯 URL de production: ${productionUrl}`, 'info', 'SYNC');
      systemLog(`📊 ${categories.length} catégories à synchroniser`, 'info', 'SYNC');

      const result = await storage.syncCategoriesToProduction(productionUrl, categories);
      
      const duration = Date.now() - startTime;
      
      if (result.success) {
        systemLog(`✅ Synchronisation réussie en ${duration}ms`, 'info', 'SYNC');
        systemLog(`📊 ${result.syncedCount || categories.length} catégories synchronisées`, 'info', 'SYNC');
        
        res.json({
          success: true,
          message: `Successfully synced ${result.syncedCount || categories.length} categories to production`,
          syncedCount: result.syncedCount || categories.length,
          duration: `${duration}ms`,
          timestamp: new Date().toISOString()
        });
      } else {
        systemLog(`❌ Échec de la synchronisation: ${result.error}`, 'error', 'SYNC');
        res.status(500).json({
          success: false,
          message: 'Failed to sync categories to production',
          error: result.error,
          duration: `${duration}ms`
        });
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      systemLog(`❌ Erreur critique lors de la synchronisation: ${error}`, 'error', 'SYNC');
      console.error("Error syncing to production:", error);
      res.status(500).json({ 
        success: false,
        message: "Failed to sync categories to production",
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: `${duration}ms`
      });
    }
  });

  app.post('/api/admin/database/reset', isAuthenticated, isAdmin, async (req: AuthenticatedRequest, res: Response) => {
    const startTime = Date.now();
    const timestamp = new Date().toISOString();
    
    try {
      systemLog('⚠️ DÉBUT DU RESET COMPLET DE LA BASE DE DONNÉES', 'warn', 'RESET');
      systemLog(`👤 Demande initiée par l'utilisateur: ${req.user?.email || 'Inconnu'}`, 'info', 'RESET');
      systemLog('🔥 ATTENTION: Toutes les catégories vont être supprimées', 'warn', 'RESET');
      systemLog('🔍 Lancement de forceSeedDatabase()...', 'info', 'RESET');
      
      await forceSeedDatabase();
      
      const duration = Date.now() - startTime;
      systemLog(`✅ Reset et re-synchronisation terminés avec succès en ${duration}ms`, 'info', 'RESET');
      systemLog('📊 Toutes les données ont été remplacées, retour de la réponse positive', 'info', 'RESET');
      
      res.json({ 
        message: 'Database reset and re-seeding completed successfully',
        success: true,
        duration: `${duration}ms`,
        timestamp: timestamp
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      systemLog(`❌ Erreur critique lors du reset: ${error}`, 'error', 'RESET');
      systemLog(`🔍 Stack trace: ${error instanceof Error ? error.stack : 'Non disponible'}`, 'error', 'RESET');
      systemLog(`⏱️ Échec après ${duration}ms`, 'error', 'RESET');
      systemLog('🚨 ÉTAT DE LA BASE INCERTAIN - VÉRIFICATION REQUISE', 'error', 'RESET');
      
      res.status(500).json({ 
        message: "Failed to reset database",
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false,
        duration: `${duration}ms`,
        timestamp: timestamp
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
