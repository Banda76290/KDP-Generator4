import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { seedDatabase } from "./seedDatabase.js";
import { cronService } from "./services/cronService";

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
  
  const server = await registerRoutes(app);
  
  // Start exchange rate cron service
  cronService.start();

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // temporarily serve a simple HTML page to test basic routing
  app.get("*", (req, res) => {
    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>KDP Generator - Test Mode</title>
    </head>
    <body>
      <h1>KDP Generator - Test Mode</h1>
      <p>Server is running successfully!</p>
      <p>Current path: ${req.path}</p>
      <div>
        <a href="/">Home</a> | 
        <a href="/import-management">Import Management</a> | 
        <a href="/projects">Projects</a>
      </div>
      ${req.path === '/import-management' ? '<h2>✅ Import Management Page - This works!</h2>' : ''}
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
