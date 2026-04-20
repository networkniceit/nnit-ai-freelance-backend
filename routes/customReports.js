// routes/customReports.js
// Custom reporting builder: user-defined reports
const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('../middleware/authenticateJWT');
const CustomReport = require('../models/CustomReport');

// Save a custom report definition
router.post('/api/custom-reports', authenticateJWT, async (req, res) => {
    const { name, query, fields } = req.body;
    const report = new CustomReport({
        user_id: req.user.userId,
        name,
        query,
        fields,
        created_at: new Date(),
    });
    await report.save();
    res.status(201).json({ report });
});

// List user's custom reports
router.get('/api/custom-reports', authenticateJWT, async (req, res) => {
    const reports = await CustomReport.find({ user_id: req.user.userId });
    res.json({ reports });
});

// Run a custom report (very basic, for demo)
router.post('/api/custom-reports/run', authenticateJWT, async (req, res) => {
    const { query, fields } = req.body;
    // For demo: only allow querying jobs (in production, validate and sanitize!)
    const Job = require('../models/Job');
    const jobs = await Job.find(query, fields);
    res.json({ results: jobs });
});

module.exports = router;
