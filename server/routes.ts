import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertProjectSchema, insertContributorSchema, insertSalesDataSchema } from "@shared/schema";
import { aiService } from "./services/aiService";
import { parseKDPReport } from "./services/kdpParser";
import { z } from "zod";

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
      console.log('Creating project for user:', userId);
      console.log('Project data:', req.body);
      const projectData = insertProjectSchema.parse({ ...req.body, userId });
      
      console.log('Parsed project data:', projectData);
      const project = await storage.createProject(projectData);
      console.log('Created project:', project);
      
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
      console.log('Returning full project:', fullProject);
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

  const httpServer = createServer(app);
  return httpServer;
}
