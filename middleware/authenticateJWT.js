// middleware/authenticateJWT.js
// Middleware to authenticate JWT tokens for protected routes

require('dotenv').config();
const jwt = require('jsonwebtoken');

const authenticateJWT = function(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing or invalid Authorization header' });
  }
  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'whsec_uzB4JOa1dKevpwHBNxiPJo0dtKU2YP0o' });
    }
    req.user = user;
    next();
  });
};

module.exports = { authenticateJWT };
