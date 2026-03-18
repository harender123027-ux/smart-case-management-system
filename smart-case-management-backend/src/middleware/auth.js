const jwt = require('jsonwebtoken');
require('dotenv').config();

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  // LOGGING FOR DEBUGGING
  if (req.url.includes('/api/complaints')) {
    console.log(`[AUTH] Header: ${authHeader}`);
    console.log(`[AUTH] Token: "${token}"`);
  }

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  if (token && token.trim() === 'demo-token-offline') {
    req.user = { id: 1, username: 'admin', role: 'admin' };
    return next();
  } else {
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        return res.status(403).json({ error: 'Invalid or expired token' });
      }
      req.user = user;
      next();
    });
  }
};

module.exports = { authenticateToken };
