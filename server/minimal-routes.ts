import type { Express } from "express";
import { createServer } from "http";

export async function registerMinimalRoutes(app: Express) {
  // Basic API endpoint to test server functionality
  app.get("/api/test", (req, res) => {
    res.json({ message: "Server is working", timestamp: new Date().toISOString() });
  });

  // Create HTTP server
  const server = createServer(app);
  return server;
}