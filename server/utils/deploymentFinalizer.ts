/**
 * Deployment Finalizer System
 * Final verification and setup completion for production deployment
 */

import { sql } from 'drizzle-orm';
import { db } from '../db.js';

const log = (message: string) => {
  console.log(`[Deploy Finalizer] ${new Date().toISOString()} - ${message}`);
};

/**
 * Complete deployment verification and setup
 */
export async function finalizeDeployment(): Promise<{
  success: boolean;
  status: 'ready' | 'partial' | 'degraded';
  summary: string[];
  recommendations: string[];
}> {
  const summary: string[] = [];
  const recommendations: string[] = [];
  
  try {
    log('=== Deployment Finalization Starting ===');
    summary.push('Starting deployment finalization process');
    
    // Verify database connectivity
    await db.execute(sql`SELECT 1 as finalization_test`);
    summary.push('✅ Database connectivity confirmed');
    
    // Check core table structure
    const tableCheck = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    const tables = tableCheck.rows.map(row => row.table_name);
    const requiredTables = [
      'users', 'projects', 'books', 'marketplace_categories', 
      'sessions', 'sales_data', 'kdp_imports'
    ];
    
    const missingTables = requiredTables.filter(table => !tables.includes(table));
    const presentTables = requiredTables.filter(table => tables.includes(table));
    
    summary.push(`Database tables: ${presentTables.length}/${requiredTables.length} core tables present`);
    
    if (missingTables.length > 0) {
      summary.push(`⚠️ Missing tables: ${missingTables.join(', ')}`);
      recommendations.push('Some features may be limited due to missing database tables');
    }
    
    // Check for essential data
    let hasEssentialData = false;
    try {
      const userCount = await db.execute(sql`SELECT COUNT(*) as count FROM users`);
      const categoryCount = await db.execute(sql`SELECT COUNT(*) as count FROM marketplace_categories`);
      
      const users = userCount.rows[0]?.count as number || 0;
      const categories = categoryCount.rows[0]?.count as number || 0;
      
      hasEssentialData = users > 0 && categories > 0;
      summary.push(`Essential data: ${users} users, ${categories} categories`);
      
      if (!hasEssentialData) {
        recommendations.push('Run database seeding to populate marketplace categories');
        recommendations.push('Create admin user through application interface');
      }
    } catch (err) {
      summary.push('⚠️ Could not verify essential data - table access limited');
    }
    
    // Environment validation
    const requiredEnvVars = ['DATABASE_URL', 'OPENAI_API_KEY'];
    const presentEnvVars = requiredEnvVars.filter(envVar => !!process.env[envVar]);
    
    summary.push(`Environment: ${presentEnvVars.length}/${requiredEnvVars.length} required variables configured`);
    
    if (presentEnvVars.length < requiredEnvVars.length) {
      const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);
      recommendations.push(`Configure missing environment variables: ${missing.join(', ')}`);
    }
    
    // Determine deployment status
    let status: 'ready' | 'partial' | 'degraded';
    if (presentTables.length === requiredTables.length && hasEssentialData && presentEnvVars.length === requiredEnvVars.length) {
      status = 'ready';
      summary.push('✅ Deployment fully ready for production use');
    } else if (presentTables.length >= 5 && presentEnvVars.length > 0) {
      status = 'partial';
      summary.push('⚠️ Deployment partially ready - some features may be limited');
    } else {
      status = 'degraded';
      summary.push('⚠️ Deployment in degraded state - manual setup required');
    }
    
    log(`=== Deployment Finalization Complete: ${status.toUpperCase()} ===`);
    
    return {
      success: true,
      status,
      summary,
      recommendations
    };
    
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    summary.push(`❌ Deployment finalization failed: ${errorMsg}`);
    recommendations.push('Contact support for deployment assistance');
    
    return {
      success: false,
      status: 'degraded',
      summary,
      recommendations
    };
  }
}

/**
 * Generate deployment summary report
 */
export function generateDeploymentReport(finalization: Awaited<ReturnType<typeof finalizeDeployment>>): string {
  let report = '\n=== KDP Generator Deployment Report ===\n';
  report += `Status: ${finalization.status.toUpperCase()}\n`;
  report += `Timestamp: ${new Date().toISOString()}\n`;
  report += `Environment: ${process.env.NODE_ENV || 'development'}\n\n`;
  
  report += 'Summary:\n';
  finalization.summary.forEach(item => {
    report += `  ${item}\n`;
  });
  
  if (finalization.recommendations.length > 0) {
    report += '\nRecommendations:\n';
    finalization.recommendations.forEach(rec => {
      report += `  • ${rec}\n`;
    });
  }
  
  report += '\n=== End Deployment Report ===\n';
  return report;
}