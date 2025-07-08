import jwt from 'jsonwebtoken';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  console.log('Auth header:', authHeader); // Debug
  console.log('Token:', token); // Debug

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.log('JWT Error:', err); // Debug
      return res.status(403).json({ error: 'Invalid token' });
    }
    console.log('Decoded user:', user); // Debug
    req.user = user;
    next();
  });
};

export const requireAdmin = (req, res, next) => {
  console.log('RequireAdmin - User:', req.user); // Debug
  
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  if (req.user.role !== 'admin') {
    console.log('User role:', req.user.role); // Debug
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  next();
};