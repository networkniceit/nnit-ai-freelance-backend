// routes/gdpr.js
// GDPR/CCPA compliance tools: data export/delete
const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('../middleware/authenticateJWT');
const User = require('../models/User');
const Job = require('../models/Job');
const Certificate = require('../models/Certificate');
const { Parser } = require('json2csv');

// Export user data (JSON/CSV)
router.get('/api/gdpr/export', authenticateJWT, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).lean();
        const jobs = await Job.find({ user_id: req.user.userId }).lean();
        const certs = await Certificate.find({ user_id: req.user.userId }).lean();
        const data = { user, jobs, certificates: certs };
        if (req.query.format === 'csv') {
            const parser = new Parser();
            const csv = parser.parse([...jobs, ...certs]);
            res.header('Content-Type', 'text/csv');
            res.attachment('user-data.csv');
            res.send(csv);
        } else {
            res.json(data);
        }
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete user data (right to be forgotten)
router.delete('/api/gdpr/delete', authenticateJWT, async (req, res) => {
    try {
        await Job.deleteMany({ user_id: req.user.userId });
        await Certificate.deleteMany({ user_id: req.user.userId });
        await User.deleteOne({ _id: req.user.userId });
        res.json({ message: 'User data deleted' });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
