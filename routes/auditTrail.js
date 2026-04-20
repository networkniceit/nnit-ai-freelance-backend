// routes/auditTrail.js
// Admin route to view audit trail logs
const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('../middleware/authenticateJWT');
const AuditLog = require('../models/AuditLog'); // Replace with your model

// Admin-only: Get recent audit logs
router.get('/api/admin/audit-logs', authenticateJWT, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
    try {
        const logs = await AuditLog.find().sort({ timestamp: -1 }).limit(100);
        res.json({ logs });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
