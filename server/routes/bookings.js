import express from 'express';
import { uploadCloud } from '../config/cloudinary.js';
import { 
  createBooking, 
  getAllBookings, 
  getBookingById,
  updateBookingStatus,
  deleteBooking,
  getBookingsWithPagination // Add this import
} from '../controllers/bookingController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Public route - no auth needed for creating booking
router.post('/', uploadCloud.single('paymentProof'), createBooking);

// Admin routes
router.get('/', authenticateToken, requireAdmin, getAllBookings);
router.get('/paginated', authenticateToken, requireAdmin, getBookingsWithPagination);
router.get('/:id', authenticateToken, requireAdmin, getBookingById);
router.patch('/:id/status', authenticateToken, requireAdmin, updateBookingStatus);
router.delete('/:id', authenticateToken, requireAdmin, deleteBooking);

export default router;