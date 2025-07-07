import express from 'express';
import { 
  getAllServices, 
  getServiceById, 
  getAvailableTimeSlots,
  updateService,
  updatePackage
} from '../controllers/serviceController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getAllServices);
router.get('/time-slots', getAvailableTimeSlots);
router.get('/:id', getServiceById);
router.put('/:id', authenticateToken, updateService);
router.put('/package/:id', authenticateToken, updatePackage);

export default router;