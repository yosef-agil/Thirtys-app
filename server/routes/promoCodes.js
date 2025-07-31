import express from 'express';
import { 
  createPromoCode, 
  getAllPromoCodes, 
  updatePromoCode, 
  deletePromoCode, 
  validatePromoCode,
  getPromoStats,
  bulkCreatePromoCodes,
  bulkDeletePromoCodes,
  exportPromoCodes
} from '../controllers/promoCodeController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Admin routes (protected)
router.post('/create', authenticateToken, requireAdmin, createPromoCode);
router.post('/bulk-create', authenticateToken, requireAdmin, bulkCreatePromoCodes);
router.post('/bulk-delete', authenticateToken, requireAdmin, bulkDeletePromoCodes);
router.get('/all', authenticateToken, requireAdmin, getAllPromoCodes);
router.get('/export', authenticateToken, requireAdmin, exportPromoCodes);
router.put('/update/:id', authenticateToken, requireAdmin, updatePromoCode);
router.delete('/delete/:id', authenticateToken, requireAdmin, deletePromoCode);
router.get('/stats/:id', authenticateToken, requireAdmin, getPromoStats);

// User routes (public)
router.post('/validate', validatePromoCode);

export default router;