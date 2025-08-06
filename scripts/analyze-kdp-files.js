import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

// List of KDP files to analyze
const kdpFiles = [
  'KDP_Payments_aa145357-437c-494b-a9f5-65fb0015831c_1754147905746.xlsx',
  'KDP_Prior_Month_Royalties-2025-01-01-7ec5e6a9-aa18-487d-bf75-4c191c47f333_1754147912278.xlsx',
  'KDP_KENP_Read-759ca322-e705-46c4-9899-26d45dd2ff7c_1754147917241.xlsx',
  'KDP_Dashboard-325dc47b-3608-499a-83dd-ba9f00615ea2_1754147927891.xlsx',
  'KDP_Royalties_Estimator-eb8d0632-c67a-44ff-bf18-40639556d72e_1754147956798.xlsx',
  'KDP_Orders-92f5cd47-8c2e-4a52-bd2f-403815d8752f_1754148030632.xlsx'
];

function analyzeFile(filePath) {
  console.log(`\n=== Analyzing ${path.basename(filePath)} ===`);
  
  try {
    const workbook = XLSX.readFile(filePath);
    console.log(`Sheets: ${workbook.SheetNames.join(', ')}`);
    
    workbook.SheetNames.forEach(sheetName => {
      console.log(`\n--- Sheet: ${sheetName} ---`);
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      if (data.length > 0) {
        console.log(`Rows: ${data.length}`);
        console.log(`Headers: ${JSON.stringify(data[0])}`);
        
        // Show sample data (first 3 rows after headers)
        if (data.length > 1) {
          console.log('Sample data:');
          for (let i = 1; i <= Math.min(3, data.length - 1); i++) {
            console.log(`Row ${i}: ${JSON.stringify(data[i])}`);
          }
        }
      } else {
        console.log('Empty sheet');
      }
    });
    
  } catch (error) {
    console.error(`Error analyzing ${filePath}: ${error.message}`);
  }
}

// Analyze all KDP files
kdpFiles.forEach(filename => {
  const filePath = path.join('attached_assets', filename);
  if (fs.existsSync(filePath)) {
    analyzeFile(filePath);
  } else {
    console.log(`File not found: ${filePath}`);
  }
});