import express from 'express';
import bcrypt from 'bcryptjs';  // Tambahkan ini
import { login, createAdmin } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';
import db from '../config/database.js';  // Tambahkan ini

const router = express.Router();

router.post('/login', login);
router.post('/create-admin', authenticateToken, createAdmin);

// Temporary endpoint untuk create admin
router.post('/setup-admin', async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    await db.execute('DELETE FROM admins WHERE username = ?', ['admin']);
    
    await db.execute(
      'INSERT INTO admins (username, password) VALUES (?, ?)',
      ['admin', hashedPassword]
    );
    
    res.json({ message: 'Admin created successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;