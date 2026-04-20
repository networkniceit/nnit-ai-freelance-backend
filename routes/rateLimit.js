// routes/rateLimit.js
// Monitoring dashboard for API rate limiting
const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('../middleware/authenticateJWT');
const RateLimitLog = require('../models/RateLimitLog'); // Replace with your model

// Admin-only: Get recent rate limit events
router.get('/api/admin/rate-limit-logs', authenticateJWT, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
    try {
        const logs = await RateLimitLog.find().sort({ timestamp: -1 }).limit(100);
        res.json({ logs });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
