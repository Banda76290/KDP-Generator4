/**
 * Enhanced Error Handler for Deployment
 * Provides graceful error handling during deployment and runtime
 */

import { Request, Response, NextFunction } from 'express';
import { isDatabaseAvailable } from '../db';

export function createDeploymentErrorHandler() {
  return (error: any, req: Request, res: Response, next: NextFunction) => {
    // Check if this is a database-related error during deployment
    const isDatabaseError = error.message?.includes('Database') || 
                           error.message?.includes('CONNECTION') ||
                           error.code === 'ECONNREFUSED';
    
    const isDeployment = process.env.NODE_ENV === 'production' && !process.env.REPLIT_DEPLOYMENT_COMPLETE;
    
    if (isDatabaseError && (isDeployment || !isDatabaseAvailable())) {
      console.warn(`[DEPLOY-ERROR] Database operation failed during deployment: ${error.message}`);
      
      // Return a meaningful response instead of crashing
      res.status(503).json({
        message: 'Service temporarily unavailable during deployment',
        error: 'DATABASE_UNAVAILABLE',
        retry: true
      });
      return;
    }
    
    // Handle other deployment-related errors gracefully
    if (isDeployment) {
      console.warn(`[DEPLOY-ERROR] Operation failed during deployment: ${error.message}`);
      res.status(503).json({
        message: 'Service temporarily unavailable during deployment',
        error: 'DEPLOYMENT_IN_PROGRESS',
        retry: true
      });
      return;
    }
    
    // Standard error handling for runtime
    const status = error.status || error.statusCode || 500;
    const message = error.message || "Internal Server Error";
    
    console.error(`[ERROR] ${req.method} ${req.path}:`, message);
    res.status(status).json({ message });
    
    // Don't throw in deployment mode to prevent crashes
    if (!isDeployment) {
      throw error;
    }
  };
}

export function createDatabaseCheckMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Check if the route requires database access
    const requiresDatabase = req.path.startsWith('/api/') && 
                            !req.path.includes('/health') &&
                            !req.path.includes('/status');
    
    if (requiresDatabase && !isDatabaseAvailable()) {
      const isDeployment = process.env.NODE_ENV === 'production' && !process.env.REPLIT_DEPLOYMENT_COMPLETE;
      
      if (isDeployment) {
        return res.status(503).json({
          message: 'Database not available during deployment',
          error: 'DEPLOYMENT_IN_PROGRESS',
          retry: true
        });
      } else {
        return res.status(503).json({
          message: 'Database connection not available',
          error: 'DATABASE_UNAVAILABLE',
          retry: true
        });
      }
    }
    
    next();
  };
}