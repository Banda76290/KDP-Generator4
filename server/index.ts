import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { seedDatabase } from "./seedDatabase.js";
import { cronService } from "./services/cronService";
import { isDeploymentMode, createDatabaseMiddleware } from "./utils/deploymentHelper";
import { createDeploymentErrorHandler, createDatabaseCheckMiddleware } from "./middleware/errorHandler";
import { setupHealthRoutes } from "./routes/health";

const app = express();
// Increase payload limit to handle rich text content (10MB)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Add deployment-aware database middleware
app.use(createDatabaseMiddleware());
app.use(createDatabaseCheckMiddleware());

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const isDeployment = isDeploymentMode();
  const isBuildPhase = process.env.REPLIT_BUILD === 'true';
  
  console.log(`[${new Date().toTimeString().split(' ')[0]}] [SYSTEM] Starting KDP Generator server`);
  console.log(`[${new Date().toTimeString().split(' ')[0]}] [SYSTEM] Environment: ${process.env.NODE_ENV || 'development'}`);
  
  if (isBuildPhase) {
    console.log("[BUILD] Build phase detected - all database and service operations bypassed");
    console.log("[BUILD] Server will run in minimal mode for deployment");
  } else if (isDeployment) {
    console.log("[DEPLOY] Deployment mode detected - database operations deferred");
  } else {
    console.log("[INIT] Normal mode - full functionality available");
  }
  
  const server = await registerRoutes(app);
  
  console.log(`[07:${new Date().getMinutes().toString().padStart(2, '0')}:${new Date().getSeconds().toString().padStart(2, '0')}] ℹ️ [AUTH] 🔐 Authentification configurée`);
  
  // Start exchange rate cron service only if not deploying
  if (!isDeployment) {
    try {
      console.log("[CRON] Initializing cron service...");
      cronService.start();
      console.log("[CRON] Cron service initialized successfully");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.warn("[CRON] Failed to start exchange rate service:", errorMessage);
    }
  } else {
    console.log("[DEPLOY] Skipping cron service startup during deployment");
  }

  // Use deployment-aware error handler
  app.use(createDeploymentErrorHandler());

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
