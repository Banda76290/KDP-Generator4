import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { type Server } from "http";

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  log("Vite not available - using fallback static server mode", "vite-fallback");
  
  // Serve static client files from dist if built
  const distPath = path.resolve(import.meta.dirname, "..", "dist", "public");
  
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    log(`Serving static files from ${distPath}`, "vite-fallback");
  } else {
    // Serve a simple development page
    app.get("*", (req, res) => {
      res.send(`
        <html>
          <head>
            <title>KDP Generator - Development Mode</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
              .container { max-width: 800px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
              .status { padding: 20px; background: #e3f2fd; border-left: 4px solid #2196f3; margin: 20px 0; }
              .error { background: #ffebee; border-left-color: #f44336; }
              .api-link { display: inline-block; margin: 10px 10px 10px 0; padding: 10px 15px; background: #38b6ff; color: white; text-decoration: none; border-radius: 4px; }
              .api-link:hover { background: #146eb4; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>🚀 KDP Generator</h1>
              <p>Development server is running in fallback mode.</p>
              
              <div class="status">
                <strong>Server Status:</strong> Running on port ${process.env.PORT || 5000}<br>
                <strong>Environment:</strong> ${process.env.NODE_ENV || 'development'}<br>
                <strong>Mode:</strong> Fallback (Vite unavailable)
              </div>

              <h2>Available API Endpoints:</h2>
              <div>
                <a href="/api/health" class="api-link">Health Check</a>
                <a href="/api/auth/user" class="api-link">User Auth</a>
                <a href="/api/dashboard/stats" class="api-link">Dashboard Stats</a>
                <a href="/api/projects" class="api-link">Projects</a>
              </div>

              <div class="status error">
                <strong>Note:</strong> The full client application requires Vite to be properly installed. 
                This is a temporary fallback interface while dependencies are being resolved.
              </div>
            </div>
          </body>
        </html>
      `);
    });
    log("Serving fallback development page", "vite-fallback");
  }
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(import.meta.dirname, "..", "dist", "public");

  if (!fs.existsSync(distPath)) {
    log(`Build directory not found: ${distPath}`, "static");
    return;
  }

  app.use(express.static(distPath));
  log(`Serving static files from ${distPath}`, "static");
}