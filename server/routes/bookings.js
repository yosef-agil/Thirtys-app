import express from 'express';
import { 
  createBooking, 
  getAllBookings, 
  getBookingById,
  updateBookingStatus,
  deleteBooking
} from '../controllers/bookingController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

router.post('/', upload.single('paymentProof'), createBooking);
router.get('/', authenticateToken, requireAdmin, getAllBookings); // Tambahkan requireAdmin
router.get('/:id', authenticateToken, requireAdmin, getBookingById); // Tambahkan requireAdmin
router.patch('/:id/status', authenticateToken, requireAdmin, updateBookingStatus); // Tambahkan requireAdmin
router.delete('/:id', authenticateToken, requireAdmin, deleteBooking); // Tambahkan requireAdmin

export default router;