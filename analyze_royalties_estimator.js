import XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Charger le nouveau fichier fourni par l'utilisateur
const filePath = path.join(__dirname, 'attached_assets', 'KDP_Royalties_Estimator-220b6953-068f-43da-9ffb-b76f37306c23_1754552046164.xlsx');

console.log('=== ANALYSE DU FICHIER KDP_ROYALTIES_ESTIMATOR ===');
console.log('Fichier:', filePath);

try {
  const workbook = XLSX.readFile(filePath);
  console.log('\n=== ONGLETS TROUVÉS ===');
  console.log(workbook.SheetNames);

  // Analyser chaque onglet
  workbook.SheetNames.forEach((sheetName, index) => {
    console.log(`\n=== ONGLET ${index + 1}: ${sheetName} ===`);
    
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { 
      header: 1, 
      defval: '', 
      range: 0 
    });
    
    if (data.length > 0) {
      console.log('En-têtes (première ligne):');
      console.log(data[0]);
      
      console.log('\nNombre de lignes:', data.length);
      
      // Si c'est un onglet avec des données de royalties, afficher quelques exemples
      if (data.length > 1 && data[0].some(header => 
        header && header.toString().toLowerCase().includes('transaction')
      )) {
        console.log('\nExemples de Transaction Type dans cet onglet:');
        const transactionTypeIndex = data[0].findIndex(header => 
          header && header.toString().toLowerCase().includes('transaction')
        );
        
        if (transactionTypeIndex !== -1) {
          const uniqueTransactionTypes = new Set();
          for (let i = 1; i < Math.min(data.length, 100); i++) {
            if (data[i][transactionTypeIndex]) {
              uniqueTransactionTypes.add(data[i][transactionTypeIndex]);
            }
          }
          console.log([...uniqueTransactionTypes].slice(0, 10));
        }
      }
    } else {
      console.log('Onglet vide');
    }
  });

} catch (error) {
  console.error('Erreur lors de l\'analyse:', error);
}