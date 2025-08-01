import { readFileSync } from 'fs';
import { db } from './db.js';
import { marketplaceCategories } from '@shared/schema';
import { sql } from 'drizzle-orm';

/**
 * Seeds the database with initial data required for the application
 * This runs automatically during deployment and on first startup
 */
export async function seedDatabase() {
  const timestamp = new Date().toISOString();
  
  try {
    console.log(`[${timestamp}] 🌱 [SEED-DB] Démarrage du seeding de la base de données...`);
    
    // Check if categories already exist
    console.log(`[${timestamp}] 🔍 [SEED-DB] Vérification des catégories existantes...`);
    const existingCategories = await db.select().from(marketplaceCategories).limit(1);
    
    if (existingCategories.length > 0) {
      console.log(`[${timestamp}] ✅ [SEED-DB] Base déjà peuplée, arrêt du seeding`);
      console.log(`[${timestamp}] 📊 [SEED-DB] Catégories trouvées, pas de modification nécessaire`);
      return;
    }
    
    console.log(`[${timestamp}] 📦 [SEED-DB] Base vide détectée, début du peuplement...`);
    console.log(`[${timestamp}] 📖 [SEED-DB] Lecture du fichier complete-categories.sql...`);
    
    // Read and execute the SQL file
    const sqlContent = readFileSync('./complete-categories.sql', 'utf-8');
    console.log(`[${timestamp}] 📏 [SEED-DB] Fichier SQL lu: ${sqlContent.length} caractères`);
    
    // Split SQL into individual statements and execute them
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`[${timestamp}] 🔢 [SEED-DB] ${statements.length} instructions SQL identifiées`);
    console.log(`[${timestamp}] ⚡ [SEED-DB] Exécution des instructions SQL...`);
    
    let insertCount = 0;
    let deleteCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i].trim();
      if (stmt) {
        try {
          await db.execute(sql.raw(stmt));
          
          if (stmt.startsWith('DELETE')) {
            deleteCount++;
            if (deleteCount === 1) console.log(`[${timestamp}] 🗑️ [SEED-DB] Suppression des données existantes...`);
          } else if (stmt.startsWith('INSERT')) {
            insertCount++;
            if (insertCount === 1) console.log(`[${timestamp}] 📝 [SEED-DB] Début des insertions...`);
            if (insertCount % 50 === 0) console.log(`[${timestamp}] 📊 [SEED-DB] ${insertCount} catégories insérées...`);
          }
          
          if (i === statements.length - 1) console.log(`[${timestamp}] 🏁 [SEED-DB] Dernière instruction exécutée`);
        } catch (error) {
          console.error(`[${timestamp}] ❌ [SEED-DB] Erreur instruction ${i + 1}: ${stmt.substring(0, 100)}...`);
          console.error(`[${timestamp}] 🔍 [SEED-DB] Erreur détaillée:`, error);
          throw error;
        }
      }
    }
    
    console.log(`[${timestamp}] 📈 [SEED-DB] Statistiques: ${deleteCount} suppressions, ${insertCount} insertions`);
    
    // Verify seeding
    console.log(`[${timestamp}] 🔍 [SEED-DB] Vérification du résultat...`);
    const categoryCount = await db.select().from(marketplaceCategories);
    console.log(`[${timestamp}] ✅ [SEED-DB] Succès! ${categoryCount.length} catégories marketplace insérées`);
    console.log(`[${timestamp}] 🎯 [SEED-DB] Seeding terminé avec succès`);
    
  } catch (error) {
    console.error(`[${timestamp}] ❌ [SEED-DB] Erreur lors du seeding:`, error);
    console.error(`[${timestamp}] 🔍 [SEED-DB] Stack trace:`, error instanceof Error ? error.stack : 'Non disponible');
    console.error(`[${timestamp}] ⚠️ [SEED-DB] L'application peut fonctionner sans catégories`);
    // Don't throw error to prevent app from crashing
    // Log and continue - the app can still function without categories
  }
}

/**
 * Force re-seed the database (useful for development/updates)
 */
export async function forceSeedDatabase() {
  const timestamp = new Date().toISOString();
  
  try {
    console.log(`[${timestamp}] 🔥 [FORCE-SEED] DÉBUT DU FORCE SEEDING (suppression complète)`);
    console.log(`[${timestamp}] ⚠️ [FORCE-SEED] ATTENTION: Toutes les catégories vont être supprimées`);
    
    // Clear existing categories
    console.log(`[${timestamp}] 🗑️ [FORCE-SEED] Suppression de toutes les catégories existantes...`);
    const deleteResult = await db.delete(marketplaceCategories);
    console.log(`[${timestamp}] ✅ [FORCE-SEED] Suppression terminée`);
    console.log(`[${timestamp}] 📊 [FORCE-SEED] Toutes les données de catégories ont été effacées`);
    
    // Re-seed without checking for existing data
    console.log(`[${timestamp}] 🔄 [FORCE-SEED] Lancement du seeding complet...`);
    console.log(`[${timestamp}] 📖 [FORCE-SEED] Lecture du fichier complete-categories.sql...`);
    
    // Read and execute the SQL file directly (bypass existing data check)
    const sqlContent = readFileSync('./complete-categories.sql', 'utf-8');
    console.log(`[${timestamp}] 📏 [FORCE-SEED] Fichier SQL lu: ${sqlContent.length} caractères`);
    
    // Split SQL into individual statements and execute them (skip DELETE statements since we already cleared)
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.startsWith('DELETE'));
    
    console.log(`[${timestamp}] 🔢 [FORCE-SEED] ${statements.length} instructions SQL identifiées (DELETE ignorées car déjà supprimé)`);
    console.log(`[${timestamp}] ⚡ [FORCE-SEED] Exécution des instructions SQL...`);
    
    let insertCount = 0;
    let deleteCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i].trim();
      if (stmt) {
        try {
          await db.execute(sql.raw(stmt));
          
          if (stmt.startsWith('DELETE')) {
            deleteCount++;
            if (deleteCount === 1) console.log(`[${timestamp}] 🗑️ [FORCE-SEED] Suppression des données existantes...`);
          } else if (stmt.startsWith('INSERT')) {
            insertCount++;
            if (insertCount === 1) console.log(`[${timestamp}] 📝 [FORCE-SEED] Début des insertions...`);
            if (insertCount % 50 === 0) console.log(`[${timestamp}] 📊 [FORCE-SEED] ${insertCount} catégories insérées...`);
          }
          
          if (i === statements.length - 1) console.log(`[${timestamp}] 🏁 [FORCE-SEED] Dernière instruction exécutée`);
        } catch (error) {
          console.error(`[${timestamp}] ❌ [FORCE-SEED] Erreur instruction ${i + 1}: ${stmt.substring(0, 100)}...`);
          console.error(`[${timestamp}] 🔍 [FORCE-SEED] Erreur détaillée:`, error);
          throw error;
        }
      }
    }
    
    console.log(`[${timestamp}] 📈 [FORCE-SEED] Statistiques: ${deleteCount} suppressions, ${insertCount} insertions`);
    
    // Verify seeding
    console.log(`[${timestamp}] 🔍 [FORCE-SEED] Vérification du résultat final...`);
    const categoryCount = await db.select().from(marketplaceCategories);
    console.log(`[${timestamp}] ✅ [FORCE-SEED] Succès! ${categoryCount.length} catégories marketplace insérées`);
    
    if (categoryCount.length !== 249) {
      console.error(`[${timestamp}] ⚠️ [FORCE-SEED] ATTENTION: ${categoryCount.length} catégories au lieu de 249 attendues`);
    }
    
    console.log(`[${timestamp}] ✅ [FORCE-SEED] Force seeding terminé avec succès`);
    console.log(`[${timestamp}] 🎯 [FORCE-SEED] Base de données complètement reconstruite`);
  } catch (error) {
    console.error(`[${timestamp}] ❌ [FORCE-SEED] Erreur critique lors du force seeding:`, error);
    console.error(`[${timestamp}] 🔍 [FORCE-SEED] Stack trace:`, error instanceof Error ? error.stack : 'Non disponible');
    console.error(`[${timestamp}] 🚨 [FORCE-SEED] ÉTAT DE LA BASE INCERTAIN - DONNÉES POSSIBLEMENT CORROMPUES`);
    throw error;
  }
}