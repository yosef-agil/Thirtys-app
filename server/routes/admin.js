import express from 'express';
import { 
  getDashboardStats,
  getMonthlyRevenue
} from '../controllers/adminController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/stats', authenticateToken, getDashboardStats);
router.get('/revenue', authenticateToken, getMonthlyRevenue);

export default router;