/**
 * Health Check Routes for Deployment
 * Provides endpoints to check application and database status
 */

import { Request, Response } from 'express';
import { isDatabaseAvailable } from '../db';
import { isDeploymentMode } from '../utils/deploymentHelper';

export function setupHealthRoutes(app: any) {
  // Basic health check
  app.get('/health', (req: Request, res: Response) => {
    const isDeployment = isDeploymentMode();
    const dbAvailable = isDatabaseAvailable();
    
    const status = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      deployment: isDeployment,
      database: dbAvailable,
      services: {
        api: 'healthy',
        database: dbAvailable ? 'connected' : 'unavailable'
      }
    };
    
    // Return different status codes based on deployment state
    if (isDeployment) {
      res.status(503).json({
        ...status,
        status: 'deploying',
        message: 'Application is currently deploying'
      });
    } else if (!dbAvailable) {
      res.status(503).json({
        ...status,
        status: 'degraded',
        message: 'Application is running with limited functionality'
      });
    } else {
      res.status(200).json(status);
    }
  });
  
  // Readiness probe for deployment systems
  app.get('/ready', (req: Request, res: Response) => {
    const isDeployment = isDeploymentMode();
    const dbAvailable = isDatabaseAvailable();
    
    if (isDeployment) {
      res.status(503).json({
        ready: false,
        reason: 'deployment_in_progress'
      });
    } else if (!dbAvailable) {
      res.status(503).json({
        ready: false,
        reason: 'database_unavailable'
      });
    } else {
      res.status(200).json({
        ready: true,
        services: ['api', 'database']
      });
    }
  });
  
  // Liveness probe
  app.get('/live', (req: Request, res: Response) => {
    res.status(200).json({
      alive: true,
      timestamp: new Date().toISOString()
    });
  });
}