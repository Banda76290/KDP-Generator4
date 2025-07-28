import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertProjectSchema, insertContributorSchema, insertSalesDataSchema } from "@shared/schema";
import { aiService } from "./services/aiService";
import { parseKDPReport } from "./services/kdpParser";
import { z } from "zod";

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
  // Auth middleware
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
      const userId = req.user.claims.sub;
      const projectData = insertProjectSchema.parse({ ...req.body, userId });
      
      const project = await storage.createProject(projectData);
      
      // Add contributors if provided
      if (req.body.contributors && Array.isArray(req.body.contributors)) {
        for (const contributorData of req.body.contributors) {
          if (contributorData.name && contributorData.role) {
            await storage.addContributor({
              projectId: project.id,
              name: contributorData.name,
              role: contributorData.role,
            });
          }
        }
      }

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
        return res.status(400).json({ message: "Invalid project data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create project" });
    }
  });

  app.put('/api/projects/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const updates = insertProjectSchema.partial().parse(req.body);
      
      const project = await storage.updateProject(req.params.id, userId, updates);
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
      await storage.deleteProject(req.params.id, userId);
      res.json({ message: "Project deleted successfully" });
    } catch (error) {
      console.error("Error deleting project:", error);
      res.status(500).json({ message: "Failed to delete project" });
    }
  });

  // Contributors routes
  app.post('/api/projects/:projectId/contributors', isAuthenticated, async (req: any, res) => {
    try {
      const contributorData = insertContributorSchema.parse({
        ...req.body,
        projectId: req.params.projectId,
      });
      
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
          projectId: record.projectId,
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
      res.status(500).json({ message: "Failed to process KDP report", error: error.message });
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
      res.status(500).json({ message: "Failed to generate AI content", error: error.message });
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

  const httpServer = createServer(app);
  return httpServer;
}
