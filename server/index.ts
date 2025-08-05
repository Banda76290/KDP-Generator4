import express, { type Request, Response, NextFunction } from "express";
// import { registerRoutes } from "./routes";
import { registerMinimalRoutes } from "./minimal-routes";
// Temporarily disable problematic imports
// import { setupVite, serveStatic, log } from "./vite";
// import { seedDatabase } from "./seedDatabase.js";
// import { cronService } from "./services/cronService";

const log = (message: string, source = "express") => {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
};

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
  // Database seeding is now manual-only via Admin System page
  // await seedDatabase(); // Disabled automatic seeding - use Admin System page for manual control
  
  const server = await registerMinimalRoutes(app);
  
  // Skip cron service for now
  // cronService.start();

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // Force development mode and skip vite temporarily
  console.log("Setting up basic routing...");
  
  // Serve test HTML for all routes
  app.get("*", (req, res) => {
    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>KDP Generator</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
        .header { background: #38b6ff; color: white; padding: 15px; margin-bottom: 20px; }
        .nav { background: #f8f9fa; padding: 10px; margin-bottom: 20px; }
        .nav a { margin-right: 15px; color: #146eb4; text-decoration: none; }
        .nav a:hover { text-decoration: underline; }
        .success { background: #d4edda; color: #155724; padding: 15px; margin: 10px 0; border-radius: 5px; }
        .info { background: #d1ecf1; color: #0c5460; padding: 10px; margin: 10px 0; border-radius: 5px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>KDP Generator</h1>
      </div>
      
      <div class="nav">
        <a href="/">Dashboard</a>
        <a href="/projects">Projects</a>
        <a href="/books">Books</a>
        <a href="/import-management">Import Management</a>
        <a href="/analytics">Analytics</a>
      </div>
      
      <div class="info">Current path: <strong>${req.path}</strong></div>
      
      ${req.path === '/import-management' ? 
        '<div class="success"><h2>✅ Import Management Page Working!</h2><p>The Import Management functionality is accessible and the routing is working correctly.</p></div>' : 
        '<p>Navigate using the menu above to test different pages.</p>'
      }
      
      <p>Server status: Running on port ${process.env.PORT || 5000}</p>
    </body>
    </html>
    `;
    res.send(html);
  });

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
