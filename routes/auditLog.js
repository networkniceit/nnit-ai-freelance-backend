// NNIT - Audit Log Routes
const express = require('express');
const router = express.Router();
const {
  getAuditLogs,
  createAuditLog,
  getUserAuditLogs,
  getAuditStats
} = require('../controllers/auditLogController');
const { authenticateJWT } = require('../middleware/authenticateJWT');

// All routes require authentication
router.use(authenticateJWT);

// GET /api/auditLog/ - Get all audit logs
router.get('/', getAuditLogs);

// GET /api/auditLog/stats - Get audit statistics
router.get('/stats', getAuditStats);

// GET /api/auditLog/user/:userId - Get specific user's audit logs
router.get('/user/:userId', getUserAuditLogs);

// POST /api/auditLog/ - Create audit log entry
router.post('/', createAuditLog);

module.exports = router;
