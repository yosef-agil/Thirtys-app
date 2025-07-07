import express from 'express';
import { login, createAdmin } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/login', login);
router.post('/create-admin', authenticateToken, createAdmin);

export default router;