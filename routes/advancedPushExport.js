// routes/advancedPushExport.js
// Advanced Feature: Advanced Push Notification Export (step 56)
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        const token = authHeader.split(' ')[1];
        jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
            if (err) return res.sendStatus(403);
            req.user = user;
            next();
        });
    } else {
        res.sendStatus(401);
    }
};

// POST /api/push-export/advanced
router.post('/', authenticateJWT, async (req, res) => {
    try {
        const { filters, format } = req.body;
        if (!filters || !format) {
            return res.status(400).json({ success: false, message: 'Missing filters or format.' });
        }
        const exportId = 'exp_' + Date.now();
        res.json({ success: true, exportId, message: 'Advanced push export started.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Export failed.', error: error.message });
    }
});

// GET /api/push-export/advanced/status
router.get('/status', authenticateJWT, async (req, res) => {
    try {
        const { exportId } = req.query;
        if (!exportId) {
            return res.status(400).json({ success: false, message: 'Missing exportId.' });
        }
        res.json({ exportId, status: 'completed', downloadUrl: `/downloads/${exportId}.zip` });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Status check failed.', error: error.message });
    }
});

module.exports = router;
