// routes/recommendation.js
// API endpoints for AI-powered recommendations
const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('../middleware/authenticateJWT');
const { getJobRecommendations, getCertificateRecommendations } = require('../services/recommendation');

router.get('/api/recommendations/jobs', authenticateJWT, async (req, res) => {
    try {
        const recs = await getJobRecommendations(req.user.userId);
        res.json({ recommendations: recs });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/api/recommendations/certificates', authenticateJWT, async (req, res) => {
    try {
        const recs = await getCertificateRecommendations(req.user.userId);
        res.json({ recommendations: recs });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
