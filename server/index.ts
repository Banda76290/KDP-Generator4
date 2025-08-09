import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes.js";
import { setupVite, serveStatic, log } from "./vite.js";
import { seedDatabase } from "./seedDatabase.js";
import { cronService } from "./services/cronService.js";
import { runMigration } from "./scripts/migrate.js";
import { runDeploymentHealthCheck, formatHealthCheckForLog } from "./utils/deploymentHealth.js";

const app = express();
// Increase payload limit to handle rich text content (10MB)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

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
  // Enhanced database migration system for production deployment
  if (process.env.NODE_ENV === 'production') {
    log('=== Production Deployment Migration System ===');
    log('Environment: Production');
    log(`Timestamp: ${new Date().toISOString()}`);
    
    // Validate essential environment variables first
    const requiredEnvVars = ['DATABASE_URL'];
    const missingVars = requiredEnvVars.filter(variable => !process.env[variable]);
    
    if (missingVars.length > 0) {
      log(`❌ CRITICAL: Missing required environment variables: ${missingVars.join(', ')}`);
      log('Server will start in degraded state - database functionality will be limited');
    } else {
      log('✅ Environment variables validated');
      log('Production environment detected - proceeding with migration');
      
      try {
        log('🔄 Starting database migration process...');
        await runMigration();
        log('✅ Database migration completed successfully');
        
        // Run comprehensive health check
        log('🔍 Running deployment health check...');
        const healthCheck = await runDeploymentHealthCheck();
        log(formatHealthCheckForLog(healthCheck));
        
        if (healthCheck.overall === 'unhealthy') {
          log('⚠️  DEPLOYMENT HEALTH WARNING: Critical issues detected');
          log('   Deployment may have limited functionality');
        } else if (healthCheck.overall === 'degraded') {
          log('⚠️  DEPLOYMENT HEALTH NOTICE: Minor issues detected');
          log('   Some features may be affected');
        } else {
          log('✅ DEPLOYMENT HEALTH: All systems operational');
          log('   Application is ready for production use');
        }
        
      } catch (error) {
        log(`❌ Database migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        
        // Provide detailed error information
        if (error instanceof Error) {
          log(`Error details: ${error.stack}`);
          
          // Specific error handling recommendations
          if (error.message.includes('DATABASE_URL')) {
            log('💡 Fix: Ensure DATABASE_URL is properly set in production secrets');
          } else if (error.message.includes('connection')) {
            log('💡 Fix: Check database connectivity and network configuration');
          } else if (error.message.includes('permission')) {
            log('💡 Fix: Verify database user has sufficient privileges');
          } else if (error.message.includes('SSL')) {
            log('💡 Fix: Check SSL configuration for database connection');
          }
        }
        
        log('🔄 Server startup will continue in degraded mode');
        log('📋 Manual database setup may be required');
        
        // Still run health check to see what's working
        try {
          log('🔍 Running partial health check...');
          const healthCheck = await runDeploymentHealthCheck();
          log(formatHealthCheckForLog(healthCheck));
        } catch (healthError) {
          log(`❌ Health check also failed: ${healthError instanceof Error ? healthError.message : 'Unknown error'}`);
          log('⚠️  Application may have significant functionality issues');
        }
      }
    }
    
    log('=== Migration System Complete ===');
  } else {
    // Database seeding is now manual-only via Admin System page in development
    // await seedDatabase(); // Disabled automatic seeding - use Admin System page for manual control
  }
  
  const server = await registerRoutes(app);
  
  // Start exchange rate cron service
  cronService.start();

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

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
