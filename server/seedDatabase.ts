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
    
    // Check if categories already exist (mais seulement lors du seeding normal, pas force)
    console.log(`[${timestamp}] 🔍 [SEED-DB] Vérification des catégories existantes...`);
    const existingCategories = await db.select().from(marketplaceCategories).limit(1);
    
    // Dans forceSeedDatabase, on passe cette vérification puisque la table est déjà vidée
    const isForceSeeding = existingCategories.length === 0;
    
    if (!isForceSeeding && existingCategories.length > 0) {
      const totalCount = await db.select().from(marketplaceCategories);
      console.log(`[${timestamp}] ✅ [SEED-DB] Base déjà peuplée avec ${totalCount.length} catégories, arrêt du seeding`);
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
    
    // 1. Vérifier l'état initial de la base
    console.log(`[${timestamp}] 🔍 [FORCE-SEED] ÉTAPE 1: Vérification de l'état initial...`);
    const initialCount = await db.select().from(marketplaceCategories);
    console.log(`[${timestamp}] 📊 [FORCE-SEED] État initial: ${initialCount.length} catégories existantes`);
    
    // 2. Vérifier la structure de la table
    console.log(`[${timestamp}] 🏗️ [FORCE-SEED] ÉTAPE 2: Vérification de la structure de la table...`);
    try {
      const tableSchema = await db.execute(sql.raw(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'marketplace_categories' 
        ORDER BY ordinal_position;
      `));
      console.log(`[${timestamp}] 📋 [FORCE-SEED] Structure de la table marketplace_categories:`);
      const schemaRows = (tableSchema as any).rows || tableSchema;
      for (const column of schemaRows) {
        console.log(`[${timestamp}] 📋 [FORCE-SEED] - ${column.column_name}: ${column.data_type} (nullable: ${column.is_nullable})`);
      }
    } catch (schemaError) {
      console.log(`[${timestamp}] ⚠️ [FORCE-SEED] Impossible de récupérer le schéma de la table:`, schemaError);
    }
    
    // 3. Clear existing categories
    console.log(`[${timestamp}] 🗑️ [FORCE-SEED] ÉTAPE 3: Suppression de toutes les catégories existantes...`);
    const deleteResult = await db.delete(marketplaceCategories);
    console.log(`[${timestamp}] ✅ [FORCE-SEED] Suppression terminée avec succès`);
    
    // 4. Vérifier que la suppression a fonctionné
    console.log(`[${timestamp}] 🔍 [FORCE-SEED] ÉTAPE 4: Vérification de la suppression...`);
    const afterDeleteCount = await db.select().from(marketplaceCategories);
    console.log(`[${timestamp}] 📊 [FORCE-SEED] Après suppression: ${afterDeleteCount.length} catégories restantes`);
    
    if (afterDeleteCount.length > 0) {
      console.log(`[${timestamp}] ⚠️ [FORCE-SEED] ATTENTION: ${afterDeleteCount.length} catégories non supprimées!`);
    }
    
    // 5. Re-seed
    console.log(`[${timestamp}] 🔄 [FORCE-SEED] ÉTAPE 5: Lancement du seeding complet...`);
    await seedDatabase();
    
    // 6. Vérification finale complète
    console.log(`[${timestamp}] 🔍 [FORCE-SEED] ÉTAPE 6: Vérification finale complète...`);
    const finalCount = await db.select().from(marketplaceCategories);
    console.log(`[${timestamp}] 📊 [FORCE-SEED] État final: ${finalCount.length} catégories dans la base`);
    
    // 7. Analyse détaillée des données insérées
    console.log(`[${timestamp}] 🔍 [FORCE-SEED] ÉTAPE 7: Analyse des données insérées...`);
    
    const marketplaceStats = await db.execute(sql.raw(`
      SELECT marketplace, COUNT(*) as count 
      FROM marketplace_categories 
      GROUP BY marketplace 
      ORDER BY marketplace;
    `));
    
    const levelStats = await db.execute(sql.raw(`
      SELECT level, COUNT(*) as count 
      FROM marketplace_categories 
      GROUP BY level 
      ORDER BY level;
    `));
    
    const formatStats = await db.execute(sql.raw(`
      SELECT 
        CASE 
          WHEN category_path LIKE '%kindle_ebook%' THEN 'kindle_ebook'
          WHEN category_path LIKE '%paperback%' THEN 'paperback'
          ELSE 'autres'
        END as format,
        COUNT(*) as count
      FROM marketplace_categories 
      GROUP BY format 
      ORDER BY format;
    `));
    
    console.log(`[${timestamp}] 📊 [FORCE-SEED] Répartition par marketplace:`);
    const marketplaceRows = (marketplaceStats as any).rows || marketplaceStats;
    for (const stat of marketplaceRows) {
      console.log(`[${timestamp}] 📊 [FORCE-SEED] - ${stat.marketplace}: ${stat.count} catégories`);
    }
    
    console.log(`[${timestamp}] 📊 [FORCE-SEED] Répartition par niveau:`);
    const levelRows = (levelStats as any).rows || levelStats;
    for (const stat of levelRows) {
      console.log(`[${timestamp}] 📊 [FORCE-SEED] - Niveau ${stat.level}: ${stat.count} catégories`);
    }
    
    console.log(`[${timestamp}] 📊 [FORCE-SEED] Répartition par format:`);
    const formatRows = (formatStats as any).rows || formatStats;
    for (const stat of formatRows) {
      console.log(`[${timestamp}] 📊 [FORCE-SEED] - ${stat.format}: ${stat.count} catégories`);
    }
    
    // 8. Test d'accès aux données
    console.log(`[${timestamp}] 🧪 [FORCE-SEED] ÉTAPE 8: Test d'accès aux données...`);
    const testCategory = await db.select().from(marketplaceCategories).limit(1);
    if (testCategory.length > 0) {
      console.log(`[${timestamp}] ✅ [FORCE-SEED] Test d'accès réussi - Exemple de catégorie:`);
      console.log(`[${timestamp}] 📋 [FORCE-SEED] ID: ${testCategory[0].id}`);
      console.log(`[${timestamp}] 📋 [FORCE-SEED] Marketplace: ${testCategory[0].marketplace}`);
      console.log(`[${timestamp}] 📋 [FORCE-SEED] Chemin: ${testCategory[0].categoryPath}`);
      console.log(`[${timestamp}] 📋 [FORCE-SEED] Niveau: ${testCategory[0].level}`);
    } else {
      console.log(`[${timestamp}] ❌ [FORCE-SEED] ÉCHEC: Aucune catégorie accessible après seeding!`);
    }
    
    console.log(`[${timestamp}] ✅ [FORCE-SEED] Force seeding terminé avec succès`);
    console.log(`[${timestamp}] 🎯 [FORCE-SEED] Base de données complètement reconstruite avec ${finalCount.length} catégories`);
    
  } catch (error) {
    console.error(`[${timestamp}] ❌ [FORCE-SEED] Erreur critique lors du force seeding:`, error);
    console.error(`[${timestamp}] 🔍 [FORCE-SEED] Stack trace:`, error instanceof Error ? error.stack : 'Non disponible');
    console.error(`[${timestamp}] 🚨 [FORCE-SEED] ÉTAT DE LA BASE INCERTAIN - DONNÉES POSSIBLEMENT CORROMPUES`);
    throw error;
  }
}