/**
 * Deployment Start Script
 * Special entry point for deployment that bypasses database operations
 */

import express, { type Request, Response, NextFunction } from "express";
import { setupVite, serveStatic, log } from "./vite";

const app = express();

// Basic middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Simple logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (req.path.startsWith("/api")) {
      log(`${req.method} ${req.path} ${res.statusCode} in ${duration}ms`);
    }
  });
  next();
});

// Health check endpoints only during deployment
app.get('/health', (req: Request, res: Response) => {
  res.status(503).json({
    status: 'deploying',
    timestamp: new Date().toISOString(),
    message: 'Application is currently being deployed'
  });
});

app.get('/ready', (req: Request, res: Response) => {
  res.status(503).json({
    ready: false,
    reason: 'deployment_in_progress'
  });
});

app.get('/live', (req: Request, res: Response) => {
  res.status(200).json({
    alive: true,
    timestamp: new Date().toISOString()
  });
});

// Default response for all other routes during deployment
app.use('/api/*', (req: Request, res: Response) => {
  res.status(503).json({
    message: 'Service temporarily unavailable during deployment',
    error: 'DEPLOYMENT_IN_PROGRESS'
  });
});

// Static files only in production
if (process.env.NODE_ENV === 'production') {
  serveStatic(app);
}

// Error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ message });
});

// Start server
const port = parseInt(process.env.PORT || '5000', 10);
const server = app.listen({
  port,
  host: "0.0.0.0"
}, () => {
  console.log(`[DEPLOY] Deployment server running on port ${port}`);
  console.log(`[DEPLOY] Database operations are disabled during deployment`);
});

export { app, server };