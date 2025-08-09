/**
 * Deployment Health Check Utilities
 * Provides comprehensive health checks for deployment verification
 */

import { sql } from 'drizzle-orm';
import { db } from '../db.js';

export interface HealthCheck {
  name: string;
  status: 'success' | 'warning' | 'error';
  message: string;
  details?: any;
}

export interface DeploymentHealth {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  checks: HealthCheck[];
  timestamp: string;
}

/**
 * Check database connectivity
 */
async function checkDatabaseConnection(): Promise<HealthCheck> {
  try {
    await db.execute(sql`SELECT 1 as test`);
    return {
      name: 'Database Connection',
      status: 'success',
      message: 'Database is accessible and responding'
    };
  } catch (error) {
    return {
      name: 'Database Connection',
      status: 'error',
      message: 'Database connection failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Check if essential tables exist
 */
async function checkDatabaseSchema(): Promise<HealthCheck> {
  try {
    const essentialTables = ['users', 'projects', 'books', 'marketplace_categories'];
    const results = await Promise.all(
      essentialTables.map(async (tableName) => {
        const result = await db.execute(sql`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = ${tableName}
          );
        `);
        return { table: tableName, exists: result.rows[0]?.exists as boolean };
      })
    );

    const missingTables = results.filter(r => !r.exists).map(r => r.table);
    
    if (missingTables.length === 0) {
      return {
        name: 'Database Schema',
        status: 'success',
        message: 'All essential tables exist'
      };
    } else if (missingTables.length < essentialTables.length) {
      return {
        name: 'Database Schema',
        status: 'warning',
        message: `Some tables missing: ${missingTables.join(', ')}`,
        details: { missingTables }
      };
    } else {
      return {
        name: 'Database Schema',
        status: 'error',
        message: 'Database schema not initialized',
        details: { missingTables }
      };
    }
  } catch (error) {
    return {
      name: 'Database Schema',
      status: 'error',
      message: 'Schema check failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Check if marketplace categories are seeded
 */
async function checkMarketplaceData(): Promise<HealthCheck> {
  try {
    const result = await db.execute(sql`
      SELECT COUNT(*) as count FROM marketplace_categories
    `);
    
    const count = parseInt(result.rows[0]?.count as string || '0');
    
    if (count >= 200) {
      return {
        name: 'Marketplace Data',
        status: 'success',
        message: `${count} marketplace categories loaded`
      };
    } else if (count > 0) {
      return {
        name: 'Marketplace Data',
        status: 'warning',
        message: `Only ${count} categories loaded (expected ~249)`,
        details: { count }
      };
    } else {
      return {
        name: 'Marketplace Data',
        status: 'error',
        message: 'No marketplace categories found',
        details: { count }
      };
    }
  } catch (error) {
    return {
      name: 'Marketplace Data',
      status: 'error',
      message: 'Marketplace data check failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Check environment variables
 */
function checkEnvironmentVariables(): HealthCheck {
  const requiredVars = ['DATABASE_URL', 'NODE_ENV'];
  const optionalVars = ['OPENAI_API_KEY', 'STRIPE_SECRET_KEY'];
  
  const missing = requiredVars.filter(varName => !process.env[varName]);
  const present = optionalVars.filter(varName => process.env[varName]);
  
  if (missing.length === 0) {
    return {
      name: 'Environment Variables',
      status: 'success',
      message: `All required variables present. Optional: ${present.join(', ') || 'none'}`,
      details: { present }
    };
  } else {
    return {
      name: 'Environment Variables',
      status: 'error',
      message: `Missing required variables: ${missing.join(', ')}`,
      details: { missing }
    };
  }
}

/**
 * Run comprehensive deployment health check
 */
export async function runDeploymentHealthCheck(): Promise<DeploymentHealth> {
  const checks: HealthCheck[] = [];
  
  // Run all health checks
  checks.push(checkEnvironmentVariables());
  checks.push(await checkDatabaseConnection());
  checks.push(await checkDatabaseSchema());
  checks.push(await checkMarketplaceData());
  
  // Determine overall health
  const hasErrors = checks.some(check => check.status === 'error');
  const hasWarnings = checks.some(check => check.status === 'warning');
  
  let overall: 'healthy' | 'degraded' | 'unhealthy';
  if (hasErrors) {
    overall = 'unhealthy';
  } else if (hasWarnings) {
    overall = 'degraded';
  } else {
    overall = 'healthy';
  }
  
  return {
    overall,
    checks,
    timestamp: new Date().toISOString()
  };
}

/**
 * Format health check results for logging
 */
export function formatHealthCheckForLog(health: DeploymentHealth): string {
  const lines = [
    `=== Deployment Health Check (${health.overall.toUpperCase()}) ===`,
    `Timestamp: ${health.timestamp}`,
    ''
  ];
  
  health.checks.forEach(check => {
    const status = check.status === 'success' ? '✅' : 
                  check.status === 'warning' ? '⚠️' : '❌';
    lines.push(`${status} ${check.name}: ${check.message}`);
    if (check.details) {
      lines.push(`   Details: ${JSON.stringify(check.details)}`);
    }
  });
  
  lines.push('');
  return lines.join('\n');
}