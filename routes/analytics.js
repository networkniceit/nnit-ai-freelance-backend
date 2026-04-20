// routes/analytics.js
// Analytics: user/job/certificate stats
const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('../middleware/authenticateJWT');
const User = require('../models/User');
const Job = require('../models/Job');
const Certificate = require('../models/Certificate');

// Get analytics summary
router.get('/api/analytics/summary', authenticateJWT, async (req, res) => {
    try {
        const userCount = await User.countDocuments();
        const jobCount = await Job.countDocuments();
        const certCount = await Certificate.countDocuments();
        const completedJobs = await Job.countDocuments({ status: 'completed' });
        const activeCerts = await Certificate.countDocuments({ status: 'active' });
        res.json({
            users: userCount,
            jobs: jobCount,
            completedJobs,
            certificates: certCount,
            activeCertificates: activeCerts,
        });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Get analytics for a specific user
router.get('/api/analytics/user/:userId', authenticateJWT, async (req, res) => {
    try {
        const jobs = await Job.countDocuments({ user_id: req.params.userId });
        const completedJobs = await Job.countDocuments({ user_id: req.params.userId, status: 'completed' });
        const certs = await Certificate.countDocuments({ user_id: req.params.userId });
        res.json({
            jobs,
            completedJobs,
            certificates: certs,
        });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
