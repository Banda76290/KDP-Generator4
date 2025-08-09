/**
 * Deployment Monitoring and Health Verification System
 * Comprehensive monitoring for Replit Deployment success and database health
 */

import { sql } from 'drizzle-orm';
import { db } from '../db.js';

const log = (message: string) => {
  console.log(`[Deployment Monitor] ${new Date().toISOString()} - ${message}`);
};

const warn = (message: string) => {
  console.warn(`[Deployment Monitor WARN] ${new Date().toISOString()} - ${message}`);
};

const error = (message: string) => {
  console.error(`[Deployment Monitor ERROR] ${new Date().toISOString()} - ${message}`);
};

/**
 * Comprehensive deployment health check for platform monitoring
 */
export async function runDeploymentHealthMonitor(): Promise<{
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  environment: string;
  checks: {
    database_connection: boolean;
    schema_integrity: boolean;
    data_seeding: boolean;
    environment_variables: boolean;
    performance: boolean;
  };
  metrics: {
    connection_time_ms: number;
    schema_table_count: number;
    category_count: number;
  };
  recommendations: string[];
}> {
  const startTime = Date.now();
  log('=== Deployment Health Monitor Started ===');
  
  const checks = {
    database_connection: false,
    schema_integrity: false,
    data_seeding: false,
    environment_variables: false,
    performance: false
  };
  
  const metrics = {
    connection_time_ms: 0,
    schema_table_count: 0,
    category_count: 0
  };
  
  const recommendations: string[] = [];
  
  // Check 1: Database Connection
  try {
    const dbStart = Date.now();
    await db.execute(sql`SELECT 1 as health_check`);
    metrics.connection_time_ms = Date.now() - dbStart;
    checks.database_connection = true;
    log(`✅ Database connection: ${metrics.connection_time_ms}ms`);
  } catch (err) {
    error(`❌ Database connection failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    recommendations.push('Verify DATABASE_URL in production secrets');
    recommendations.push('Check database service availability');
  }
  
  // Check 2: Schema Integrity
  if (checks.database_connection) {
    try {
      const schemaResult = await db.execute(sql`
        SELECT COUNT(*) as table_count 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
      `);
      
      metrics.schema_table_count = schemaResult.rows[0]?.table_count as number || 0;
      checks.schema_integrity = metrics.schema_table_count >= 8; // Minimum expected tables
      
      log(`${checks.schema_integrity ? '✅' : '❌'} Schema integrity: ${metrics.schema_table_count} tables found`);
      
      if (!checks.schema_integrity) {
        recommendations.push('Run database migration to create missing tables');
        recommendations.push('Check migration logs for schema creation errors');
      }
    } catch (err) {
      error(`Schema integrity check failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }
  
  // Check 3: Data Seeding
  if (checks.schema_integrity) {
    try {
      const seedingResult = await db.execute(sql`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_name = 'marketplace_categories'
        ) as categories_table_exists
      `);
      
      if (seedingResult.rows[0]?.categories_table_exists) {
        const categoryCountResult = await db.execute(sql`
          SELECT COUNT(*) as count FROM marketplace_categories
        `);
        
        metrics.category_count = categoryCountResult.rows[0]?.count as number || 0;
        checks.data_seeding = metrics.category_count > 200; // Expect 249 categories
        
        log(`${checks.data_seeding ? '✅' : '❌'} Data seeding: ${metrics.category_count} categories loaded`);
        
        if (!checks.data_seeding) {
          recommendations.push('Run database seeding to populate marketplace categories');
          recommendations.push('Verify complete-categories.sql file is accessible');
        }
      } else {
        log('❌ Data seeding: marketplace_categories table not found');
        recommendations.push('Create marketplace_categories table via migration');
      }
    } catch (err) {
      error(`Data seeding check failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }
  
  // Check 4: Environment Variables
  const requiredEnvVars = ['DATABASE_URL', 'OPENAI_API_KEY'];
  const presentEnvVars = requiredEnvVars.filter(envVar => !!process.env[envVar]);
  checks.environment_variables = presentEnvVars.length === requiredEnvVars.length;
  
  log(`${checks.environment_variables ? '✅' : '❌'} Environment variables: ${presentEnvVars.length}/${requiredEnvVars.length} present`);
  
  if (!checks.environment_variables) {
    const missingVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
    recommendations.push(`Configure missing environment variables: ${missingVars.join(', ')}`);
    recommendations.push('Verify secrets are properly set in Replit Deployments panel');
  }
  
  // Check 5: Performance
  const totalTime = Date.now() - startTime;
  checks.performance = totalTime < 5000 && metrics.connection_time_ms < 1000;
  
  log(`${checks.performance ? '✅' : '❌'} Performance: Health check completed in ${totalTime}ms`);
  
  if (!checks.performance) {
    recommendations.push('Monitor database connection latency');
    recommendations.push('Consider database optimization if response times are consistently slow');
  }
  
  // Determine overall status
  const healthyChecks = Object.values(checks).filter(check => check).length;
  const totalChecks = Object.keys(checks).length;
  
  let status: 'healthy' | 'degraded' | 'unhealthy';
  if (healthyChecks === totalChecks) {
    status = 'healthy';
  } else if (healthyChecks >= 3 && checks.database_connection) {
    status = 'degraded';
  } else {
    status = 'unhealthy';
  }
  
  log(`=== Deployment Health Status: ${status.toUpperCase()} (${healthyChecks}/${totalChecks} checks passed) ===`);
  
  return {
    status,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    checks,
    metrics,
    recommendations
  };
}

/**
 * Format health check results for logging
 */
export function formatHealthMonitorResults(health: Awaited<ReturnType<typeof runDeploymentHealthMonitor>>): string {
  let output = `\n=== Deployment Health Monitor Results ===\n`;
  output += `Status: ${health.status.toUpperCase()}\n`;
  output += `Environment: ${health.environment}\n`;
  output += `Timestamp: ${health.timestamp}\n`;
  output += `\nChecks:\n`;
  
  Object.entries(health.checks).forEach(([check, passed]) => {
    output += `  ${passed ? '✅' : '❌'} ${check.replace(/_/g, ' ')}\n`;
  });
  
  output += `\nMetrics:\n`;
  output += `  Connection Time: ${health.metrics.connection_time_ms}ms\n`;
  output += `  Schema Tables: ${health.metrics.schema_table_count}\n`;
  output += `  Categories: ${health.metrics.category_count}\n`;
  
  if (health.recommendations.length > 0) {
    output += `\nRecommendations:\n`;
    health.recommendations.forEach(rec => {
      output += `  • ${rec}\n`;
    });
  }
  
  return output;
}

/**
 * Continuous deployment monitoring (for production)
 */
export function startDeploymentMonitoring(): void {
  if (process.env.NODE_ENV !== 'production') {
    return;
  }
  
  log('Starting continuous deployment monitoring...');
  
  // Initial health check
  setTimeout(async () => {
    try {
      const health = await runDeploymentHealthMonitor();
      log(formatHealthMonitorResults(health));
      
      if (health.status === 'unhealthy') {
        error('CRITICAL: Deployment is in unhealthy state');
        error('Immediate attention required for production stability');
      }
    } catch (err) {
      error(`Initial health check failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }, 10000); // 10 second delay to allow startup completion
  
  // Periodic health checks (every 5 minutes)
  setInterval(async () => {
    try {
      const health = await runDeploymentHealthMonitor();
      
      // Only log if status changed or unhealthy
      if (health.status === 'unhealthy') {
        warn('Deployment health degraded - requires attention');
        warn(formatHealthMonitorResults(health));
      }
    } catch (err) {
      error(`Periodic health check failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }, 300000); // 5 minutes
}