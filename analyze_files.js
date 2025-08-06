import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

// Liste des fichiers à analyser
const files = [
  'attached_assets/KDP_Payments_aa145357-437c-494b-a9f5-65fb0015831c_1754155403694.xlsx',
  'attached_assets/KDP_Prior_Month_Royalties-2025-01-01-7ec5e6a9-aa18-487d-bf75-4c191c47f333_1754155418444.xlsx',
  'attached_assets/KDP_Royalties_Estimator-eb8d0632-c67a-44ff-bf18-40639556d72e_1754155427740.xlsx',
  'attached_assets/KDP_KENP_Read-759ca322-e705-46c4-9899-26d45dd2ff7c_1754155434752.xlsx',
  'attached_assets/KDP_Orders-92f5cd47-8c2e-4a52-bd2f-403815d8752f_1754155442820.xlsx',
  'attached_assets/KDP_Dashboard-325dc47b-3608-499a-83dd-ba9f00615ea2_1754155449072.xlsx'
];

console.log('=== ANALYSE DES FICHIERS KDP D\'ORIGINE ===\n');

files.forEach(filePath => {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`❌ Fichier non trouvé: ${filePath}`);
      return;
    }

    console.log(`\n📁 ANALYSE: ${path.basename(filePath)}`);
    console.log('='.repeat(60));

    const workbook = XLSX.readFile(filePath);
    const sheetNames = workbook.SheetNames;
    
    console.log(`Nombre de feuilles: ${sheetNames.length}`);
    console.log(`Noms des feuilles: ${sheetNames.join(', ')}`);

    sheetNames.forEach(sheetName => {
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      if (data.length === 0) {
        console.log(`  📄 ${sheetName}: VIDE`);
        return;
      }

      const headers = data[0] || [];
      const rows = data.slice(1).filter(row => row.some(cell => cell !== undefined && cell !== ''));
      
      console.log(`\n  📄 FEUILLE: ${sheetName}`);
      console.log(`     Colonnes (${headers.length}): ${headers.slice(0, 10).join(', ')}${headers.length > 10 ? '...' : ''}`);
      console.log(`     Lignes de données: ${rows.length}`);

      // Rechercher des colonnes de revenus
      const revenueColumns = headers.map((h, i) => ({ name: h, index: i }))
        .filter(col => {
          const name = (col.name || '').toString().toLowerCase();
          return name.includes('royalty') || name.includes('earnings') || 
                 name.includes('revenue') || name.includes('amount') ||
                 name.includes('royalties') || name.includes('net') ||
                 name.includes('total');
        });

      if (revenueColumns.length > 0) {
        console.log(`     Colonnes de revenus potentielles:`);
        revenueColumns.forEach(col => {
          console.log(`       - ${col.name} (colonne ${col.index})`);
          
          // Calculer la somme des valeurs non-nulles
          const values = rows.map(row => {
            const value = row[col.index];
            if (value === undefined || value === null || value === '') return 0;
            const num = parseFloat(value.toString().replace(/[^\d.-]/g, ''));
            return isNaN(num) ? 0 : num;
          });
          
          const total = values.reduce((sum, val) => sum + val, 0);
          const nonZeroCount = values.filter(v => v !== 0).length;
          
          console.log(`         Total: ${total.toFixed(2)} (${nonZeroCount} valeurs non-nulles)`);
        });
      }

      // Rechercher des colonnes d'identifiants
      const identifierColumns = headers.map((h, i) => ({ name: h, index: i }))
        .filter(col => {
          const name = (col.name || '').toString().toLowerCase();
          return name.includes('asin') || name.includes('isbn') || 
                 name.includes('title') || name.includes('marketplace');
        });

      if (identifierColumns.length > 0) {
        console.log(`     Colonnes d'identifiants:`);
        identifierColumns.forEach(col => {
          const uniqueValues = [...new Set(rows.map(row => row[col.index]).filter(v => v))];
          console.log(`       - ${col.name}: ${uniqueValues.length} valeurs uniques`);
        });
      }

      // Afficher quelques exemples de lignes
      if (rows.length > 0) {
        console.log(`     Exemple de données (3 premières lignes):`);
        rows.slice(0, 3).forEach((row, i) => {
          const limitedRow = row.slice(0, 5).map(cell => 
            cell === undefined || cell === null ? '' : cell.toString().substring(0, 30)
          );
          console.log(`       ${i + 1}: [${limitedRow.join(', ')}${row.length > 5 ? ', ...' : ''}]`);
        });
      }
    });

  } catch (error) {
    console.log(`❌ Erreur lors de l'analyse de ${filePath}:`, error.message);
  }
});

console.log('\n=== ANALYSE TERMINÉE ===');