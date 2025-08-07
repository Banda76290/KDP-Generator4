import XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';
import { KdpRoyaltiesEstimatorProcessor } from './server/services/kdpRoyaltiesEstimatorProcessor.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test complet du système avec le fichier réel
const filePath = path.join(__dirname, 'attached_assets', 'KDP_Royalties_Estimator-220b6953-068f-43da-9ffb-b76f37306c23_1754552046164.xlsx');

console.log('=== TEST COMPLET DU SYSTÈME KDP ROYALTIES ESTIMATOR ===');
console.log('Fichier:', filePath);

try {
  const workbook = XLSX.readFile(filePath);
  
  // 1. Test de détection
  const isDetected = KdpRoyaltiesEstimatorProcessor.detectKdpRoyaltiesEstimator(workbook);
  console.log('\n1. DÉTECTION:', isDetected ? 'RÉUSSIE ✅' : 'ÉCHOUÉE ❌');
  
  if (isDetected) {
    // 2. Simulation du traitement complet
    console.log('\n2. TRAITEMENT COMPLET:');
    
    const importId = 'test-import-' + Date.now();
    const userId = 'test-user-123';
    
    console.log(`   Import ID: ${importId}`);
    console.log(`   User ID: ${userId}`);
    
    try {
      const result = await KdpRoyaltiesEstimatorProcessor.processKdpRoyaltiesEstimator(
        workbook,
        importId,
        userId
      );
      
      console.log('\n✅ TRAITEMENT RÉUSSI:');
      console.log(`   📊 Total lignes traitées: ${result.totalProcessed}`);
      console.log(`   🎯 Lignes filtrées sauvées: ${result.filteredRecords}`);
      console.log(`   📄 Onglets traités: ${result.processedSheets.join(', ')}`);
      
      // 3. Vérification des résultats attendus
      console.log('\n3. VÉRIFICATION DES RÉSULTATS:');
      
      const expectedFilteredCount = 44; // Basé sur notre analyse précédente
      const actualFilteredCount = result.filteredRecords;
      
      if (actualFilteredCount === expectedFilteredCount) {
        console.log(`   ✅ Nombre de lignes filtrées CORRECT: ${actualFilteredCount}`);
      } else {
        console.log(`   ❌ Nombre de lignes filtrées INCORRECT:`);
        console.log(`      Attendu: ${expectedFilteredCount}`);
        console.log(`      Reçu: ${actualFilteredCount}`);
      }
      
      // 4. Vérification des onglets traités
      const expectedSheets = ['Combined Sales', 'eBook Royalty', 'Paperback Royalty', 'Hardcover Royalty'];
      const actualSheets = result.processedSheets;
      
      const allSheetsProcessed = expectedSheets.every(sheet => actualSheets.includes(sheet));
      
      if (allSheetsProcessed) {
        console.log(`   ✅ Tous les onglets attendus traités: ${actualSheets.join(', ')}`);
      } else {
        console.log(`   ❌ Onglets manquants:`);
        expectedSheets.forEach(sheet => {
          if (!actualSheets.includes(sheet)) {
            console.log(`      - ${sheet}`);
          }
        });
      }
      
      // 5. Vérification des erreurs
      if (result.errors.length === 0) {
        console.log(`   ✅ Aucune erreur de traitement`);
      } else {
        console.log(`   ⚠️  ${result.errors.length} erreurs détectées:`);
        result.errors.slice(0, 5).forEach((error, index) => {
          console.log(`      ${index + 1}. ${error}`);
        });
      }
      
      console.log('\n=== RÉSUMÉ FINAL ===');
      
      const isSuccess = (
        actualFilteredCount === expectedFilteredCount &&
        allSheetsProcessed &&
        result.errors.length === 0
      );
      
      if (isSuccess) {
        console.log('🎉 SYSTÈME ENTIÈREMENT FONCTIONNEL!');
        console.log('   ✓ Détection correcte du fichier KDP_Royalties_Estimator');
        console.log('   ✓ Filtrage précis des transaction types ciblés');
        console.log('   ✓ Traitement de tous les onglets royalty');
        console.log('   ✓ Aucune erreur de traitement');
        console.log('\n🚀 Le système est prêt pour traiter de vrais revenus KDP avec:');
        console.log('   - Free - Promotion (eBook)');
        console.log('   - Expanded Distribution Channels (Paperback)');
      } else {
        console.log('❌ DES AMÉLIORATIONS SONT NÉCESSAIRES');
      }
      
    } catch (processingError) {
      console.log('❌ ERREUR TRAITEMENT:', processingError.message);
      console.log('   Stack:', processingError.stack);
    }
    
  } else {
    console.log('❌ Impossible de continuer: détection échouée');
  }
  
} catch (error) {
  console.error('❌ ERREUR SYSTÈME:', error.message);
  console.error('   Stack:', error.stack);
}