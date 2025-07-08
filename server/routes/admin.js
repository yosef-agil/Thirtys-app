import express from 'express';
import { 
  getDashboardStats,
  getMonthlyRevenue
} from '../controllers/adminController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Gunakan kedua middleware
router.get('/stats', authenticateToken, requireAdmin, getDashboardStats);
router.get('/revenue', authenticateToken, requireAdmin, getMonthlyRevenue);

export default router;