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
    
    // Count existing categories first
    const existingCount = await db.select().from(marketplaceCategories);
    console.log(`[${timestamp}] 📊 [FORCE-SEED] Catégories existantes trouvées: ${existingCount.length}`);
    
    if (existingCount.length > 0) {
      console.log(`[${timestamp}] 🔍 [FORCE-SEED] Échantillon de catégories existantes:`);
      existingCount.slice(0, 3).forEach((cat, i) => {
        console.log(`[${timestamp}] 📝 [FORCE-SEED] ${i+1}. ID: ${cat.id}, Path: ${cat.categoryPath}, Level: ${cat.level}`);
      });
    }

    // Clear existing categories
    console.log(`[${timestamp}] 🗑️ [FORCE-SEED] Début de la suppression de ${existingCount.length} catégories existantes...`);
    const deleteResult = await db.delete(marketplaceCategories);
    console.log(`[${timestamp}] ✅ [FORCE-SEED] Suppression terminée - Résultat: ${JSON.stringify(deleteResult)}`);
    
    // Verify deletion
    const verifyEmpty = await db.select().from(marketplaceCategories);
    console.log(`[${timestamp}] 🔍 [FORCE-SEED] Vérification post-suppression: ${verifyEmpty.length} catégories restantes`);
    if (verifyEmpty.length > 0) {
      console.error(`[${timestamp}] ⚠️ [FORCE-SEED] PROBLÈME: ${verifyEmpty.length} catégories n'ont pas été supprimées!`);
    } else {
      console.log(`[${timestamp}] ✅ [FORCE-SEED] Table complètement vidée`);
    }
    
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
        console.log(`[${timestamp}] 🔄 [FORCE-SEED] Exécution instruction ${i + 1}/${statements.length}: ${stmt.substring(0, 150)}...`);
        
        try {
          const result = await db.execute(sql.raw(stmt));
          console.log(`[${timestamp}] ✅ [FORCE-SEED] Instruction ${i + 1} exécutée - Résultat: ${JSON.stringify(result)}`);
          
          if (stmt.startsWith('DELETE')) {
            deleteCount++;
            console.log(`[${timestamp}] 🗑️ [FORCE-SEED] Suppression ${deleteCount} effectuée`);
          } else if (stmt.startsWith('INSERT')) {
            insertCount++;
            console.log(`[${timestamp}] 📝 [FORCE-SEED] Insertion ${insertCount} effectuée`);
            
            // Vérifier les 10 premières insertions en détail
            if (insertCount <= 10) {
              const match = stmt.match(/VALUES\s*\('([^']+)',\s*'([^']+)',\s*'([^']+)',\s*'([^']+)',\s*(\d+)/);
              if (match) {
                console.log(`[${timestamp}] 🔍 [FORCE-SEED] Détails insertion ${insertCount}: ID=${match[1]}, Marketplace=${match[2]}, Path=${match[3]}, Parent=${match[4]}, Level=${match[5]}`);
              }
            }
            
            // Logs de progression
            if (insertCount % 25 === 0) console.log(`[${timestamp}] 📊 [FORCE-SEED] Progression: ${insertCount}/${statements.length} catégories insérées (${Math.round((insertCount/statements.length)*100)}%)`);
          }
          
          // Vérifier l'état de la base après chaque insertion des 5 premières
          if (insertCount <= 5) {
            const currentCount = await db.select().from(marketplaceCategories);
            console.log(`[${timestamp}] 📈 [FORCE-SEED] État actuel de la base: ${currentCount.length} catégories total`);
          }
          
          if (i === statements.length - 1) {
            console.log(`[${timestamp}] 🏁 [FORCE-SEED] Dernière instruction exécutée avec succès`);
          }
        } catch (error) {
          console.error(`[${timestamp}] ❌ [FORCE-SEED] ERREUR instruction ${i + 1}/${statements.length}`);
          console.error(`[${timestamp}] 📄 [FORCE-SEED] Instruction échouée: ${stmt}`);
          console.error(`[${timestamp}] 🔍 [FORCE-SEED] Type d'erreur: ${error instanceof Error ? error.constructor.name : typeof error}`);
          console.error(`[${timestamp}] 💬 [FORCE-SEED] Message d'erreur: ${error instanceof Error ? error.message : String(error)}`);
          console.error(`[${timestamp}] 📍 [FORCE-SEED] Stack trace:`, error instanceof Error ? error.stack : 'Non disponible');
          
          // Vérifier l'état de la base en cas d'erreur
          const errorCount = await db.select().from(marketplaceCategories);
          console.error(`[${timestamp}] 📊 [FORCE-SEED] État de la base lors de l'erreur: ${errorCount.length} catégories`);
          
          throw error;
        }
      }
    }
    
    console.log(`[${timestamp}] 📈 [FORCE-SEED] Statistiques: ${deleteCount} suppressions, ${insertCount} insertions`);
    
    // Verify seeding with detailed analysis
    console.log(`[${timestamp}] 🔍 [FORCE-SEED] Début de la vérification complète du résultat...`);
    const categoryCount = await db.select().from(marketplaceCategories);
    console.log(`[${timestamp}] 📊 [FORCE-SEED] Nombre total de catégories insérées: ${categoryCount.length}`);
    
    // Analyser par niveau (utilisation d'ORM plutôt que SQL brut)
    try {
      console.log(`[${timestamp}] 📈 [FORCE-SEED] Répartition par niveau:`);
      const level1Count = categoryCount.filter(c => c.level === 1).length;
      const level2Count = categoryCount.filter(c => c.level === 2).length;
      const level3Count = categoryCount.filter(c => c.level === 3).length;
      const level4Count = categoryCount.filter(c => c.level === 4).length;
      const level5Count = categoryCount.filter(c => c.level === 5).length;
      const level6PlusCount = categoryCount.filter(c => c.level >= 6).length;
      
      console.log(`[${timestamp}] 📊 [FORCE-SEED] Niveau 1: ${level1Count} catégories`);
      console.log(`[${timestamp}] 📊 [FORCE-SEED] Niveau 2: ${level2Count} catégories`);
      console.log(`[${timestamp}] 📊 [FORCE-SEED] Niveau 3: ${level3Count} catégories`);
      console.log(`[${timestamp}] 📊 [FORCE-SEED] Niveau 4: ${level4Count} catégories`);
      console.log(`[${timestamp}] 📊 [FORCE-SEED] Niveau 5: ${level5Count} catégories`);
      console.log(`[${timestamp}] 📊 [FORCE-SEED] Niveau 6+: ${level6PlusCount} catégories`);
    } catch (levelError) {
      console.error(`[${timestamp}] ⚠️ [FORCE-SEED] Erreur lors de l'analyse par niveau:`, levelError);
    }
    
    // Analyser par marketplace (utilisation d'ORM plutôt que SQL brut)
    try {
      console.log(`[${timestamp}] 🌍 [FORCE-SEED] Répartition par marketplace:`);
      const marketplaces = [...new Set(categoryCount.map(c => c.marketplace))];
      
      marketplaces.forEach(marketplace => {
        const count = categoryCount.filter(c => c.marketplace === marketplace).length;
        console.log(`[${timestamp}] 📊 [FORCE-SEED] ${marketplace}: ${count} catégories`);
      });
    } catch (marketplaceError) {
      console.error(`[${timestamp}] ⚠️ [FORCE-SEED] Erreur lors de l'analyse par marketplace:`, marketplaceError);
    }
    
    // Vérifier l'intégrité des données
    console.log(`[${timestamp}] 🔍 [FORCE-SEED] Vérification de l'intégrité des données...`);
    
    // Échantillon des catégories créées
    const sampleCategories = categoryCount.slice(0, 5);
    console.log(`[${timestamp}] 📝 [FORCE-SEED] Échantillon des catégories créées:`);
    sampleCategories.forEach((cat, i) => {
      console.log(`[${timestamp}] 📄 [FORCE-SEED] ${i+1}. ID: "${cat.id}", Marketplace: "${cat.marketplace}", Path: "${cat.categoryPath}", Level: ${cat.level}, Sélectionnable: ${cat.isSelectable}`);
    });
    
    // Vérifier les niveaux racines critiques
    const level1Count = categoryCount.filter(c => c.level === 1).length;
    const level2Count = categoryCount.filter(c => c.level === 2).length;
    const level3Count = categoryCount.filter(c => c.level === 3).length;
    
    console.log(`[${timestamp}] 🌳 [FORCE-SEED] Vérification hiérarchie:`);
    console.log(`[${timestamp}] 📊 [FORCE-SEED] Niveau 1 (racines): ${level1Count} catégories`);
    console.log(`[${timestamp}] 📊 [FORCE-SEED] Niveau 2 (sous-catégories): ${level2Count} catégories`);
    console.log(`[${timestamp}] 📊 [FORCE-SEED] Niveau 3 (branches): ${level3Count} catégories`);
    
    // Statut final
    if (categoryCount.length === 249) {
      console.log(`[${timestamp}] ✅ [FORCE-SEED] SUCCÈS COMPLET: 249 catégories insérées comme attendu`);
      if (level1Count > 0 && level2Count > 0 && level3Count > 0) {
        console.log(`[${timestamp}] ✅ [FORCE-SEED] Hiérarchie complète confirmée avec tous les niveaux racines`);
      } else {
        console.log(`[${timestamp}] ⚠️ [FORCE-SEED] ATTENTION: Hiérarchie incomplète détectée`);
      }
    } else {
      console.error(`[${timestamp}] ❌ [FORCE-SEED] PROBLÈME: ${categoryCount.length} catégories au lieu de 249 attendues`);
      console.error(`[${timestamp}] 🔍 [FORCE-SEED] Différence: ${249 - categoryCount.length} catégories manquantes`);
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