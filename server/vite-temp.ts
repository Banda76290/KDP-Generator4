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

// Temporary placeholder for setupVite - skips vite setup for now
export async function setupVite(app: Express, server: Server) {
  log("Vite setup temporarily disabled - running in basic mode", "vite");
  
  // Basic static file serving fallback
  app.use("*", (req, res) => {
    res.status(404).json({ message: "Client not available - vite setup disabled" });
  });
}

// Temporary placeholder for serveStatic
export function serveStatic(app: Express) {
  log("Static file serving temporarily disabled", "static");
  
  app.use("*", (req, res) => {
    res.status(404).json({ message: "Static files not available" });
  });
}