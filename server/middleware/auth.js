// server/middleware/auth.js
import jwt from 'jsonwebtoken';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || '7b1X8zZRsRAxvrrQLD3m0knH773By7KHaI0YAYLvtNw', (err, user) => {
    if (err) {
      console.error('Token verification error:', err);
      return res.status(403).json({ error: 'Invalid token' });
    }
    
    // Log untuk debug
    console.log('Authenticated user:', user);
    
    req.user = user;
    next();
  });
};

export const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  // Check role from token
  if (req.user.role !== 'admin') {
    console.error('Access denied. User role:', req.user.role);
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  next();
};