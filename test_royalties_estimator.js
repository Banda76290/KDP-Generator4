import XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';
// Test unitaire du processeur KDP Royalties Estimator

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test avec le fichier réel fourni
const filePath = path.join(__dirname, 'attached_assets', 'KDP_Royalties_Estimator-220b6953-068f-43da-9ffb-b76f37306c23_1754552046164.xlsx');

console.log('=== TEST DU SYSTÈME KDP ROYALTIES ESTIMATOR ===');
console.log('Fichier de test:', filePath);

try {
  const workbook = XLSX.readFile(filePath);
  
  // Test de détection direct
  const requiredSheets = ['eBook Royalty', 'Paperback Royalty', 'Hardcover Royalty'];
  const sheetNames = workbook.SheetNames;
  
  const hasRoyaltySheets = requiredSheets.some(name => sheetNames.includes(name));
  console.log('✓ Détection (a des onglets royalty):', hasRoyaltySheets ? 'RÉUSSIE' : 'ÉCHOUÉE');
  
  if (hasRoyaltySheets) {
    // Analyse manuelle des onglets
    const targetSheetNames = ['Combined Sales', 'eBook Royalty', 'Paperback Royalty', 'Hardcover Royalty'];
    const sheets = [];
    
    for (const sheetName of targetSheetNames) {
      if (workbook.SheetNames.includes(sheetName)) {
        const sheet = workbook.Sheets[sheetName];
        const fullData = XLSX.utils.sheet_to_json(sheet, { 
          header: 1, 
          defval: '', 
          raw: false 
        });
        
        if (fullData.length > 0) {
          const headers = fullData[0];
          const data = fullData.slice(1);
          
          const hasTransactionType = headers.some(header => 
            header && header.toLowerCase().includes('transaction type')
          );

          sheets.push({
            name: sheetName,
            headers,
            data,
            hasTransactionType
          });
        }
      }
    }
    
    console.log('\n=== ONGLETS ANALYSÉS ===');
    
    sheets.forEach(sheet => {
      console.log(`\n📄 ${sheet.name}:`);
      console.log(`   - Nombre de lignes: ${sheet.data.length}`);
      console.log(`   - A Transaction Type: ${sheet.hasTransactionType ? 'OUI' : 'NON'}`);
      
      if (sheet.hasTransactionType) {
        const transactionTypeIndex = sheet.headers.findIndex(h => 
          h && h.toLowerCase().includes('transaction type')
        );
        
        if (transactionTypeIndex !== -1) {
          // Compter les types de transaction
          const transactionTypes = new Map();
          sheet.data.forEach(row => {
            const transactionType = row[transactionTypeIndex];
            if (transactionType) {
              transactionTypes.set(transactionType, (transactionTypes.get(transactionType) || 0) + 1);
            }
          });
          
          console.log('   - Types de Transaction trouvés:');
          for (const [type, count] of transactionTypes) {
            console.log(`     * "${type}": ${count} lignes`);
          }
          
          // Vérifier nos types ciblés
          const targetTypes = ['Free - Promotion', 'Expanded Distribution Channels'];
          const filteredCount = sheet.data.filter(row => {
            const transactionType = row[transactionTypeIndex];
            return transactionType && targetTypes.includes(transactionType);
          }).length;
          
          console.log(`   - 🎯 Lignes filtrées (Free - Promotion + Expanded Distribution): ${filteredCount}`);
        }
      }
    });
    
    // Calcul total des lignes filtrées à travers tous les onglets
    let totalFiltered = 0;
    const targetTypes = ['Free - Promotion', 'Expanded Distribution Channels'];
    
    sheets.forEach(sheet => {
      if (sheet.hasTransactionType) {
        const transactionTypeIndex = sheet.headers.findIndex(h => 
          h && h.toLowerCase().includes('transaction type')
        );
        
        if (transactionTypeIndex !== -1) {
          const filteredCount = sheet.data.filter(row => {
            const transactionType = row[transactionTypeIndex];
            return transactionType && targetTypes.includes(transactionType);
          }).length;
          totalFiltered += filteredCount;
        }
      }
    });
    
    console.log('\n=== RÉSUMÉ DU FILTRAGE ===');
    console.log(`✅ Total lignes ciblées trouvées: ${totalFiltered}`);
    console.log(`   Filtres: "Free - Promotion", "Expanded Distribution Channels"`);
    
    if (totalFiltered > 0) {
      console.log('🎯 Le système devrait traiter ces lignes pour le calcul des revenus');
    } else {
      console.log('⚠️  Aucune ligne correspondant aux filtres dans ce fichier');
    }
    
  } else {
    console.log('❌ Le fichier n\'a pas été détecté comme KDP_Royalties_Estimator');
  }
  
} catch (error) {
  console.error('❌ ERREUR:', error.message);
}