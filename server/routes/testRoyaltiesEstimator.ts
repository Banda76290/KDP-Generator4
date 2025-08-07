import { Router } from 'express';
import { KdpImportService } from '../services/kdpImportService';
import { storage } from '../storage';
import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

const router = Router();

// Route de test pour le nouveau système KDP_Royalties_Estimator
router.post('/test-royalties-estimator', async (req, res) => {
  try {
    const userId = 'dev-user-123'; // User de développement
    
    console.log('[TEST] Début du test KDP_Royalties_Estimator');
    
    // Charger le fichier exemple
    const filePath = path.join(process.cwd(), 'attached_assets', 'KDP_Royalties_Estimator-eb8d0632-c67a-44ff-bf18-40639556d72e_1754155427740.xlsx');
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Fichier de test non trouvé' });
    }

    const workbook = XLSX.readFile(filePath);
    const importService = new KdpImportService(storage);
    
    // Test de détection
    const detectedType = importService.detectFileType(workbook);
    console.log('[TEST] Type détecté:', detectedType);
    
    // Test de traitement
    const result = await importService.processFile(
      workbook,
      'TEST_KDP_Royalties_Estimator.xlsx',
      userId
    );
    
    console.log('[TEST] Résultat:', result);
    
    // Récupérer les données traitées
    const processedData = await importService.getImportData(
      result.importId,
      result.fileType
    );
    
    console.log('[TEST] Nombre d\'enregistrements traités:', processedData.length);
    
    // Filtrer pour voir les "Free - Promotion" et "Expanded Distribution Channels"
    const filteredData = processedData.filter(record => 
      record.transactionType === 'Free - Promotion' || 
      record.transactionType === 'Expanded Distribution Channels'
    );
    
    console.log('[TEST] Enregistrements filtrés:', filteredData.length);
    
    res.json({
      success: true,
      detectedType: detectedType,
      totalProcessed: result.processedRecords,
      errors: result.errorRecords,
      importId: result.importId,
      detectedSheets: result.detectedSheets,
      filteredRecords: filteredData.length,
      sampleRecords: filteredData.slice(0, 3) // Premiers exemples
    });
    
  } catch (error) {
    console.error('[TEST] Erreur:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Erreur inconnue',
      stack: error instanceof Error ? error.stack : undefined
    });
  }
});

// Route pour obtenir les statistiques des données traitées
router.get('/royalties-estimator-stats/:importId', async (req, res) => {
  try {
    const { importId } = req.params;
    
    const data = await storage.getKdpRoyaltiesEstimatorData(importId);
    
    // Statistiques par type de transaction
    const transactionStats = data.reduce((acc, record) => {
      const type = record.transactionType || 'Unknown';
      if (!acc[type]) {
        acc[type] = { count: 0, totalRoyalty: 0 };
      }
      acc[type].count++;
      acc[type].totalRoyalty += parseFloat(record.royalty || '0');
      return acc;
    }, {} as Record<string, { count: number; totalRoyalty: number }>);
    
    // Statistiques par onglet
    const sheetStats = data.reduce((acc, record) => {
      const sheet = record.sheetName || 'Unknown';
      if (!acc[sheet]) {
        acc[sheet] = { count: 0, totalRoyalty: 0 };
      }
      acc[sheet].count++;
      acc[sheet].totalRoyalty += parseFloat(record.royalty || '0');
      return acc;
    }, {} as Record<string, { count: number; totalRoyalty: number }>);
    
    res.json({
      importId,
      totalRecords: data.length,
      transactionStats,
      sheetStats,
      targetTransactions: {
        'Free - Promotion': transactionStats['Free - Promotion'] || { count: 0, totalRoyalty: 0 },
        'Expanded Distribution Channels': transactionStats['Expanded Distribution Channels'] || { count: 0, totalRoyalty: 0 }
      }
    });
    
  } catch (error) {
    console.error('[STATS] Erreur:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Erreur inconnue' });
  }
});

export default router;