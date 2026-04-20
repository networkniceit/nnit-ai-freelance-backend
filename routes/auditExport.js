// routes/auditExport.js
// Audit log export (PDF/CSV)
const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('../middleware/authenticateJWT');
const AuditLog = require('../models/AuditLog');
const { Parser } = require('json2csv');
const PDFDocument = require('pdfkit');

// Export audit logs as CSV (admin only)
router.get('/api/admin/audit-logs/csv', authenticateJWT, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
    try {
        const logs = await AuditLog.find().sort({ timestamp: -1 }).limit(1000);
        const parser = new Parser();
        const csv = parser.parse(logs.map(l => l.toObject()));
        res.header('Content-Type', 'text/csv');
        res.attachment('audit-logs.csv');
        res.send(csv);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Export audit logs as PDF (admin only)
router.get('/api/admin/audit-logs/pdf', authenticateJWT, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
    try {
        const logs = await AuditLog.find().sort({ timestamp: -1 }).limit(1000);
        const doc = new PDFDocument();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=audit-logs.pdf');
        doc.pipe(res);
        doc.fontSize(18).text('Audit Log Export', { align: 'center' });
        doc.moveDown();
        logs.forEach(log => {
            doc.fontSize(10).text(`User: ${log.user_id} | Action: ${log.action} | Collection: ${log.collection}`);
            doc.text(`Before: ${JSON.stringify(log.before)}`);
            doc.text(`After: ${JSON.stringify(log.after)}`);
            doc.text(`Timestamp: ${log.timestamp}`);
            doc.moveDown();
        });
        doc.end();
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
