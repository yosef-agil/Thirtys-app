import express from 'express';
import { login, createAdmin } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/login', login);
router.post('/create-admin', authenticateToken, createAdmin);

// Temporary endpoint untuk create admin (HAPUS SETELAH SELESAI)
router.post('/setup-admin', async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    // Delete existing admin
    await db.execute('DELETE FROM admins WHERE username = ?', ['admin']);
    
    // Create new admin
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