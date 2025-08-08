import { Router } from 'express';
import { storage } from '../storage';
import { requireAuth } from '../middleware/auth';

const router = Router();

/**
 * GET /api/master-books
 * Récupère tous les master books pour l'utilisateur connecté
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const masterBooks = await storage.getMasterBooks(userId);
    
    res.json(masterBooks);
  } catch (error) {
    console.error('Error fetching master books:', error);
    res.status(500).json({ error: 'Failed to fetch master books' });
  }
});

/**
 * GET /api/master-books/:asin
 * Récupère un master book spécifique par ASIN
 */
router.get('/:asin', requireAuth, async (req, res) => {
  try {
    const { asin } = req.params;
    const masterBook = await storage.getMasterBookByAsin(asin);
    
    if (!masterBook) {
      return res.status(404).json({ error: 'Master book not found' });
    }
    
    res.json(masterBook);
  } catch (error) {
    console.error('Error fetching master book:', error);
    res.status(500).json({ error: 'Failed to fetch master book' });
  }
});

/**
 * POST /api/master-books/update/:importId
 * Met à jour les master books à partir d'un import spécifique
 */
router.post('/update/:importId', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { importId } = req.params;
    
    await storage.updateMasterBooksFromImport(userId, importId);
    
    res.json({ message: 'Master books updated successfully' });
  } catch (error) {
    console.error('Error updating master books:', error);
    res.status(500).json({ error: 'Failed to update master books' });
  }
});

export default router;