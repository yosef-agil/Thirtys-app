import express from 'express';
import { 
  createBooking, 
  getAllBookings, 
  getBookingById,
  updateBookingStatus,
  deleteBooking
} from '../controllers/bookingController.js';
import { authenticateToken } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

router.post('/', upload.single('paymentProof'), createBooking);
router.get('/', authenticateToken, getAllBookings);
router.get('/:id', authenticateToken, getBookingById);
router.patch('/:id/status', authenticateToken, updateBookingStatus);
router.delete('/:id', authenticateToken, deleteBooking);

export default router;