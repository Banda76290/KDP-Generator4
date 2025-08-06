import XLSX from 'xlsx';
import fs from 'fs';

console.log('=== ANALYSE INTELLIGENTE DES REVENUS ===\n');

const priorMonthFile = 'attached_assets/KDP_Prior_Month_Royalties-2025-01-01-7ec5e6a9-aa18-487d-bf75-4c191c47f333_1754155418444.xlsx';

if (fs.existsSync(priorMonthFile)) {
  console.log('📊 PRIOR MONTH ROYALTIES - STRUCTURE DÉTAILLÉE');
  console.log('='.repeat(70));

  const workbook = XLSX.readFile(priorMonthFile);
  let grandTotal = 0;

  workbook.SheetNames.forEach(sheetName => {
    console.log(`\n  📄 FEUILLE: ${sheetName}`);
    
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false });
    
    if (data.length < 3) {
      console.log('     Pas assez de données');
      return;
    }

    // Afficher la structure exacte
    console.log('     Structure des 10 premières lignes:');
    data.slice(0, 10).forEach((row, i) => {
      const limitedRow = (row || []).slice(0, 6).map(cell => 
        cell === undefined || cell === null ? '""' : `"${cell.toString().substring(0, 20)}"`
      );
      console.log(`       ${i}: [${limitedRow.join(', ')}]`);
    });

    // Détecter automatiquement les colonnes de données
    let dataStartRow = -1;
    let dataColumns = [];
    
    // Rechercher une ligne avec "Title", "Author", etc.
    for (let i = 0; i < data.length; i++) {
      const row = data[i] || [];
      if (row.some(cell => cell && cell.toString().toLowerCase().includes('title'))) {
        dataStartRow = i;
        dataColumns = row;
        break;
      }
    }

    if (dataStartRow >= 0) {
      console.log(`     En-têtes détectés ligne ${dataStartRow}: ${dataColumns.join(' | ')}`);
      
      // Analyser les données
      const dataRows = data.slice(dataStartRow + 1).filter(row => 
        row && row.some(cell => cell !== undefined && cell !== '')
      );
      
      console.log(`     ${dataRows.length} lignes de données trouvées`);
      
      // Calculer les totaux par colonne numérique
      dataColumns.forEach((header, colIndex) => {
        if (!header) return;
        
        const values = dataRows.map(row => {
          const value = (row || [])[colIndex];
          if (!value) return 0;
          const num = parseFloat(value.toString().replace(/[^\d.-]/g, ''));
          return isNaN(num) ? 0 : num;
        });
        
        const total = values.reduce((sum, val) => sum + val, 0);
        const nonZeroCount = values.filter(v => v > 0).length;
        
        if (total > 0) {
          console.log(`       ${header}: ${total.toFixed(2)} (${nonZeroCount} entrées non-nulles)`);
          
          // Si c'est une colonne de royalty, l'ajouter au total général
          if (header.toLowerCase().includes('royalty') || 
              header.toLowerCase().includes('earnings') ||
              header.toLowerCase().includes('january')) {
            grandTotal += total;
          }
        }
      });

      // Afficher quelques exemples de lignes avec données
      if (dataRows.length > 0) {
        console.log(`     Exemples de données:`);
        dataRows.slice(0, 3).forEach((row, i) => {
          const exampleRow = (row || []).slice(0, 8).map(cell => 
            cell === undefined || cell === null ? '""' : `"${cell.toString().substring(0, 15)}"`
          );
          console.log(`       ${i + 1}: [${exampleRow.join(', ')}]`);
        });
      }
    }
  });

  console.log(`\n🎯 ESTIMATION TOTAL REVENUS: ${grandTotal.toFixed(2)}`);
}

// Analyser le fichier Payments pour comprendre la différence
const paymentsFile = 'attached_assets/KDP_Payments_aa145357-437c-494b-a9f5-65fb0015831c_1754155403694.xlsx';

if (fs.existsSync(paymentsFile)) {
  console.log('\n📊 PAYMENTS - ANALYSE DES PÉRIODES');
  console.log('='.repeat(50));

  const workbook = XLSX.readFile(paymentsFile);
  const worksheet = workbook.Sheets['Payments'];
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false });
  
  if (data.length > 1) {
    const headers = data[0] || [];
    const rows = data.slice(1).filter(row => row && row.some(cell => cell !== undefined && cell !== ''));
    
    console.log(`  ${rows.length} paiements trouvés`);
    console.log(`  Colonnes: ${headers.join(' | ')}`);
    
    // Analyser les périodes
    const periodCol = headers.findIndex(h => h && h.toString().includes('Sales Period'));
    const royaltyCol = headers.findIndex(h => h && h.toString().includes('Accrued Royalty'));
    
    if (periodCol >= 0 && royaltyCol >= 0) {
      const periods = new Map();
      
      rows.forEach(row => {
        const period = (row[periodCol] || '').toString();
        const royalty = parseFloat((row[royaltyCol] || '0').toString().replace(/[^\d.-]/g, ''));
        
        if (period && royalty > 0) {
          periods.set(period, (periods.get(period) || 0) + royalty);
        }
      });
      
      console.log(`  Revenus par période:`);
      [...periods.entries()].sort().forEach(([period, amount]) => {
        console.log(`    ${period}: ${amount.toFixed(2)}`);
      });
    }
  }
}

console.log('\n=== RECOMMANDATIONS ===');
console.log('1. Utiliser uniquement "Prior Month Royalties" pour les revenus courants');
console.log('2. Exclure "Payments" des calculs (données cumulées historiques)');
console.log('3. Séparer les champs ASIN et ISBN dans le schéma de base');
console.log('4. Reconfigurer les analytics pour les bonnes sources de données');