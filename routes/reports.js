// routes/reports.js
// Advanced reporting/export (PDF, CSV)
const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('../middleware/authenticateJWT');
const Job = require('../models/Job');
const Certificate = require('../models/Certificate');
const User = require('../models/User');
const { Parser } = require('json2csv');
const PDFDocument = require('pdfkit');

// Export jobs as CSV
router.get('/api/reports/jobs/csv', authenticateJWT, async (req, res) => {
    try {
        const jobs = await Job.find({ user_id: req.user.userId });
        const parser = new Parser();
        const csv = parser.parse(jobs.map(j => j.toObject()));
        res.header('Content-Type', 'text/csv');
        res.attachment('jobs.csv');
        res.send(csv);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Export certificates as CSV
router.get('/api/reports/certificates/csv', authenticateJWT, async (req, res) => {
    try {
        const certs = await Certificate.find({ user_id: req.user.userId });
        const parser = new Parser();
        const csv = parser.parse(certs.map(c => c.toObject()));
        res.header('Content-Type', 'text/csv');
        res.attachment('certificates.csv');
        res.send(csv);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Export jobs as PDF
router.get('/api/reports/jobs/pdf', authenticateJWT, async (req, res) => {
    try {
        const jobs = await Job.find({ user_id: req.user.userId });
        const doc = new PDFDocument();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=jobs.pdf');
        doc.pipe(res);
        doc.fontSize(18).text('Jobs Report', { align: 'center' });
        doc.moveDown();
        jobs.forEach(job => {
            doc.fontSize(12).text(`Title: ${job.title}`);
            doc.text(`Description: ${job.description}`);
            doc.text(`Status: ${job.status}`);
            doc.text(`Budget: ${job.budget}`);
            doc.moveDown();
        });
        doc.end();
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
