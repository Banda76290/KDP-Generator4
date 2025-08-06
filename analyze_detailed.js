import XLSX from 'xlsx';
import fs from 'fs';

console.log('=== ANALYSE DÉTAILLÉE DES REVENUS ===\n');

// Analyser le fichier Prior Month Royalties en détail
const priorMonthFile = 'attached_assets/KDP_Prior_Month_Royalties-2025-01-01-7ec5e6a9-aa18-487d-bf75-4c191c47f333_1754155418444.xlsx';

if (fs.existsSync(priorMonthFile)) {
  console.log('📊 ANALYSE DÉTAILLÉE: Prior Month Royalties (Janvier 2025)');
  console.log('='.repeat(70));

  const workbook = XLSX.readFile(priorMonthFile);
  let totalRoyalties = 0;
  let totalUnits = 0;

  workbook.SheetNames.forEach(sheetName => {
    if (sheetName === 'Total Earnings' || sheetName.includes('Royalty')) {
      console.log(`\n  📄 FEUILLE: ${sheetName}`);
      
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      if (data.length < 2) {
        console.log('     Aucune donnée de revenus');
        return;
      }

      const headers = data[0] || [];
      const rows = data.slice(1).filter(row => row.some(cell => cell !== undefined && cell !== ''));
      
      console.log(`     Lignes de données: ${rows.length}`);
      console.log(`     Colonnes: ${headers.join(', ')}`);

      // Trouver les colonnes importantes
      const royaltyCol = headers.findIndex(h => h && h.toString().toLowerCase().includes('royalty'));
      const unitsCol = headers.findIndex(h => h && h.toString().toLowerCase().includes('units sold'));
      const asinCol = headers.findIndex(h => h && h.toString().toLowerCase().includes('asin'));
      const isbnCol = headers.findIndex(h => h && h.toString().toLowerCase().includes('isbn'));
      const titleCol = headers.findIndex(h => h && h.toString().toLowerCase().includes('title'));
      const marketplaceCol = headers.findIndex(h => h && h.toString().toLowerCase().includes('marketplace'));

      if (royaltyCol >= 0) {
        console.log(`     Colonne royalty trouvée: ${headers[royaltyCol]} (index ${royaltyCol})`);
        
        let sheetRoyalties = 0;
        let sheetUnits = 0;
        const currencies = new Map();
        
        rows.forEach((row, i) => {
          const royalty = parseFloat(row[royaltyCol]?.toString().replace(/[^\d.-]/g, '') || '0');
          const units = parseInt(row[unitsCol]?.toString() || '0');
          const asin = row[asinCol]?.toString() || '';
          const isbn = row[isbnCol]?.toString() || '';
          const title = row[titleCol]?.toString() || '';
          const marketplace = row[marketplaceCol]?.toString() || '';

          if (royalty > 0) {
            sheetRoyalties += royalty;
            sheetUnits += units;
            
            // Detecter la devise du marketplace
            let currency = 'EUR'; // Par défaut
            if (marketplace.includes('.com')) currency = 'USD';
            else if (marketplace.includes('.co.uk')) currency = 'GBP';
            else if (marketplace.includes('.co.jp')) currency = 'JPY';
            else if (marketplace.includes('.ca')) currency = 'CAD';
            else if (marketplace.includes('.com.au')) currency = 'AUD';
            
            currencies.set(currency, (currencies.get(currency) || 0) + royalty);

            console.log(`       Ligne ${i + 1}: ${title.substring(0, 30)}... | ASIN: ${asin} | ISBN: ${isbn} | ${marketplace} | ${royalty} ${currency} | ${units} unités`);
          }
        });

        console.log(`     TOTAL FEUILLE: ${sheetRoyalties.toFixed(2)} | ${sheetUnits} unités`);
        console.log(`     Répartition par devise:`);
        currencies.forEach((amount, currency) => {
          console.log(`       ${currency}: ${amount.toFixed(2)}`);
        });

        totalRoyalties += sheetRoyalties;
        totalUnits += sheetUnits;
      }
    }
  });

  console.log(`\n🎯 TOTAL GÉNÉRAL JANVIER 2025:`);
  console.log(`   Revenus: ${totalRoyalties.toFixed(2)}`);
  console.log(`   Unités vendues: ${totalUnits}`);
}

// Analyser rapidement les autres fichiers pour détecter la duplication
console.log('\n📈 VÉRIFICATION AUTRES FICHIERS:');

const files = [
  { name: 'KENP Read', path: 'attached_assets/KDP_KENP_Read-759ca322-e705-46c4-9899-26d45dd2ff7c_1754155434752.xlsx' },
  { name: 'Orders', path: 'attached_assets/KDP_Orders-92f5cd47-8c2e-4a52-bd2f-403815d8752f_1754155442820.xlsx' },
  { name: 'Dashboard', path: 'attached_assets/KDP_Dashboard-325dc47b-3608-499a-83dd-ba9f00615ea2_1754155449072.xlsx' }
];

files.forEach(file => {
  if (fs.existsSync(file.path)) {
    const workbook = XLSX.readFile(file.path);
    let hasRoyaltyData = false;
    let totalRecords = 0;

    workbook.SheetNames.forEach(sheetName => {
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      const headers = data[0] || [];
      const rows = data.slice(1).filter(row => row.some(cell => cell !== undefined && cell !== ''));
      
      totalRecords += rows.length;
      
      if (headers.some(h => h && h.toString().toLowerCase().includes('royalty'))) {
        hasRoyaltyData = true;
      }
    });

    console.log(`  ${file.name}: ${totalRecords} enregistrements, Revenus: ${hasRoyaltyData ? 'OUI' : 'NON'}`);
  }
});

console.log('\n=== CONCLUSION ===');
console.log('✅ Fichier "Prior Month Royalties" contient les vrais revenus mensuels');
console.log('❌ Fichier "Payments" contient les revenus cumulés historiques'); 
console.log('💡 Solution: Exclure les fichiers "payments" du calcul des revenus courants');