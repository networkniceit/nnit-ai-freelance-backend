
// NNIT - JWT Authentication Middleware
// Location: middleware/auth.js

const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - verify JWT token
const protect = async (req, res, next) => {
  let token;

  // Check if token exists in Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header (format: "Bearer TOKEN")
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token (exclude password)
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      next();
    } catch (error) {
      console.error('Auth middleware error:', error);
      
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Invalid token'
        });
      }
      
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token expired'
        });
      }

      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }
  }

  // No token found
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token provided'
    });
  }
};

// Authorize specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role}' is not authorized to access this route`
      });
    }
    next();
  };
};

// Validate Cloud API token
const validateCloudToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = req.headers['x-cloud-token'] || (authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null);
  
  if (!token) {
    return res.status(401).json({ error: 'Cloud token required' });
  }
  
  // In production, verify against actual cloud token
  if (token !== process.env.CLOUD_API_TOKEN) {
    return res.status(403).json({ error: 'Invalid cloud token' });
  }
  
  next();
};

module.exports = { protect, authorize, validateCloudToken };
