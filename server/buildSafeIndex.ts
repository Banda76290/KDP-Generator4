import express, { type Request, Response, NextFunction } from "express";
import { setupVite, serveStatic, log } from "./vite";

/**
 * Build-Safe Server Entry Point
 * 
 * This version completely bypasses all database operations, imports, and services
 * during the Cloud Run build phase to prevent deployment conflicts.
 */

const app = express();

// Basic middleware setup
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Build-safe logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      log(`${req.method} ${path} ${res.statusCode} in ${duration}ms`);
    }
  });

  next();
});

// Health check endpoints for deployment monitoring
app.get('/health', (req: Request, res: Response) => {
  res.status(503).json({
    status: 'building',
    message: 'Application is building - database not available',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/ready', (req: Request, res: Response) => {
  res.status(503).json({
    status: 'not-ready',
    message: 'Application build in progress',
    timestamp: new Date().toISOString()
  });
});

app.get('/live', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'alive',
    message: 'Application is running in build mode',
    timestamp: new Date().toISOString()
  });
});

// Catch-all API route handler for build phase
app.use('/api/*', (req: Request, res: Response) => {
  res.status(503).json({
    message: 'Service unavailable during build phase',
    error: 'BUILD_IN_PROGRESS',
    retry: true,
    timestamp: new Date().toISOString()
  });
});

// Build-safe error handler
app.use((error: any, req: Request, res: Response, next: NextFunction) => {
  console.warn(`[BUILD-ERROR] ${req.method} ${req.path}:`, error.message);
  res.status(503).json({
    message: 'Service temporarily unavailable during build',
    error: 'BUILD_IN_PROGRESS',
    retry: true
  });
});

(async () => {
  console.log("[BUILD] Starting build-safe server");
  console.log("[BUILD] All database operations bypassed");
  console.log("[BUILD] All external services bypassed");
  
  // Setup static serving without any database dependencies
  if (app.get("env") === "development") {
    await setupVite(app);
  } else {
    serveStatic(app);
  }

  const port = parseInt(process.env.PORT || '5000', 10);
  
  const server = app.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`[BUILD] Build-safe server running on port ${port}`);
    log("[BUILD] Ready for deployment");
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log("[BUILD] Received SIGTERM, shutting down gracefully");
    server.close(() => {
      console.log("[BUILD] Server closed");
      process.exit(0);
    });
  });
})();