// routes/admin.js
// Admin Features: user management, audit logs
const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('../middleware/authenticateJWT');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog'); // Replace with your AuditLog model
const Transaction = require('../models/Transaction');
const Invoice = require('../models/Invoice');

// Middleware to check admin role
function requireAdmin(req, res, next) {
    if (req.user && req.user.role === 'admin') return next();
    return res.status(403).json({ error: 'Admin access required' });
}

// List all users
router.get('/api/admin/users', authenticateJWT, requireAdmin, async (req, res) => {
    try {
        const users = await User.find({}, '-password_hash');
        res.json({ users });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Update user role
router.put('/api/admin/users/:userId/role', authenticateJWT, requireAdmin, async (req, res) => {
    const { role } = req.body;
    try {
        const user = await User.findById(req.params.userId);
        if (!user) return res.status(404).json({ error: 'User not found' });
        user.role = role;
        await user.save();
        res.json({ message: 'User role updated', user });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Get audit logs
router.get('/api/admin/audit-logs', authenticateJWT, requireAdmin, async (req, res) => {
    try {
        const logs = await AuditLog.find().sort({ created_at: -1 }).limit(100);
        res.json({ logs });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Admin summary: users count, recent audit, basic billing placeholder
router.get('/api/admin/summary', authenticateJWT, requireAdmin, async (req, res) => {
    try {
        const usersCount = await User.countDocuments();
        const recentAudits = await AuditLog.find().sort({ created_at: -1 }).limit(10);

        // Billing & notifications placeholders (may be implemented with real models)
        const billingSummary = { invoiceCount: 0, outstanding: 0 };
        const notificationsSummary = { unread: 0 };

        res.json({
            usersCount,
            recentAudits,
            billing: billingSummary,
            notifications: notificationsSummary
        });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Dev-only mock endpoints for income/transactions/audit
if (process.env.NODE_ENV !== 'production') {
    // Mock income summary
    router.get('/api/admin/mock-income', (req, res) => {
        res.json({
            totalRevenue: 12345.67,
            monthly: [
                { month: '2025-09', revenue: 1200.00 },
                { month: '2025-10', revenue: 2100.50 },
                { month: '2025-11', revenue: 3050.00 },
                { month: '2025-12', revenue: 3100.00 },
                { month: '2026-01', revenue: 3895.17 }
            ],
            outstandingInvoices: 4
        });
    });

    // Mock transactions list
    router.get('/api/admin/mock-transactions', (req, res) => {
        res.json({
            transactions: [
                { id: 'tx_001', amount: 250.00, currency: 'USD', type: 'credit', date: '2026-01-10' },
                { id: 'tx_002', amount: 75.50, currency: 'USD', type: 'debit', date: '2026-01-09' },
                { id: 'tx_003', amount: 1000.00, currency: 'USD', type: 'credit', date: '2026-01-05' }
            ]
        });
    });

    // Mock audit events summary
    router.get('/api/admin/mock-audit', (req, res) => {
        res.json({
            recent: [
                { id: 'a1', user: 'alice', action: 'login', at: '2026-01-11T08:00:00Z' },
                { id: 'a2', user: 'bob', action: 'create_invoice', at: '2026-01-11T07:45:00Z' },
                { id: 'a3', user: 'carol', action: 'update_user', at: '2026-01-10T18:30:00Z' }
            ]
        });
    });
}

// Dev-only unauthenticated endpoints for local testing (bypass auth)
if (process.env.NODE_ENV !== 'production') {
    router.get('/api/admin/income-dev', async (req, res) => {
        try {
            const agg = await Transaction.aggregate([
                { $project: { amount: 1, month: { $dateToString: { format: "%Y-%m", date: "$date" } } } },
                { $group: { _id: "$month", revenue: { $sum: "$amount" } } },
                { $sort: { _id: 1 } }
            ]);
            const monthly = agg.map(a=>({ month: a._id, revenue: a.revenue }));
            const totalRevenue = monthly.reduce((s,m)=>s + (m.revenue||0), 0);
            const outstandingInvoices = await Invoice.countDocuments({ status: 'unpaid' }).catch(()=>0);
            return res.json({ totalRevenue, monthly, outstandingInvoices });
        } catch (err) {
            return res.json({
                totalRevenue: 12345.67,
                monthly: [
                    { month: '2025-09', revenue: 1200.00 },
                    { month: '2025-10', revenue: 2100.50 },
                    { month: '2025-11', revenue: 3050.00 },
                    { month: '2025-12', revenue: 3100.00 },
                    { month: '2026-01', revenue: 3895.17 }
                ],
                outstandingInvoices: 4,
                _fallback: true
            });
        }
    });

    router.get('/api/admin/transactions-dev', async (req, res) => {
        try {
            const page = Math.max(0, parseInt(req.query.page || '0'));
            const limit = Math.min(100, parseInt(req.query.limit || '50'));
            const skip = page * limit;
            const [transactions, total] = await Promise.all([
                Transaction.find().sort({ date: -1 }).skip(skip).limit(limit).lean(),
                Transaction.countDocuments()
            ]);
            return res.json({ transactions, total, page, limit });
        } catch (err) {
            return res.json({
                transactions: [
                    { id: 'tx_001', amount: 250.00, currency: 'USD', type: 'credit', date: '2026-01-10' },
                    { id: 'tx_002', amount: 75.50, currency: 'USD', type: 'debit', date: '2026-01-09' },
                    { id: 'tx_003', amount: 1000.00, currency: 'USD', type: 'credit', date: '2026-01-05' }
                ],
                total: 3,
                page: 0,
                limit: 50,
                _fallback: true
            });
        }
    });
}

// DB-backed income endpoint with graceful fallback to mock
router.get('/api/admin/income', authenticateJWT, requireAdmin, async (req, res) => {
    try {
        // aggregate monthly revenue (YYYY-MM)
        const agg = await Transaction.aggregate([
            { $project: { amount: 1, month: { $dateToString: { format: "%Y-%m", date: "$date" } } } },
            { $group: { _id: "$month", revenue: { $sum: "$amount" } } },
            { $sort: { _id: 1 } }
        ]);
        const monthly = agg.map(a=>({ month: a._id, revenue: a.revenue }));
        const totalRevenue = monthly.reduce((s,m)=>s + (m.revenue||0), 0);
        const outstandingInvoices = await Invoice.countDocuments({ status: 'unpaid' }).catch(()=>0);
        return res.json({ totalRevenue, monthly, outstandingInvoices });
    } catch (err) {
        // fallback to mock data when DB not available or on error
        return res.json({
            totalRevenue: 12345.67,
            monthly: [
                { month: '2025-09', revenue: 1200.00 },
                { month: '2025-10', revenue: 2100.50 },
                { month: '2025-11', revenue: 3050.00 },
                { month: '2025-12', revenue: 3100.00 },
                { month: '2026-01', revenue: 3895.17 }
            ],
            outstandingInvoices: 4,
            _fallback: true
        });
    }
});

// DB-backed transactions list with pagination and fallback
router.get('/api/admin/transactions', authenticateJWT, requireAdmin, async (req, res) => {
    try {
        const page = Math.max(0, parseInt(req.query.page || '0'));
        const limit = Math.min(100, parseInt(req.query.limit || '50'));
        const skip = page * limit;
        const [transactions, total] = await Promise.all([
            Transaction.find().sort({ date: -1 }).skip(skip).limit(limit).lean(),
            Transaction.countDocuments()
        ]);
        return res.json({ transactions, total, page, limit });
    } catch (err) {
        // fallback to mock
        return res.json({
            transactions: [
                { id: 'tx_001', amount: 250.00, currency: 'USD', type: 'credit', date: '2026-01-10' },
                { id: 'tx_002', amount: 75.50, currency: 'USD', type: 'debit', date: '2026-01-09' },
                { id: 'tx_003', amount: 1000.00, currency: 'USD', type: 'credit', date: '2026-01-05' }
            ],
            total: 3,
            page: 0,
            limit: 50,
            _fallback: true
        });
    }
});

module.exports = router;

// Dev-only summary (no auth) for local testing
if (process.env.NODE_ENV !== 'production') {
    router.get('/api/admin/summary-dev', async (req, res) => {
        try {
            const usersCount = await User.countDocuments();
            const recentAudits = await AuditLog.find().sort({ created_at: -1 }).limit(10);
            const billingSummary = { invoiceCount: 0, outstanding: 0 };
            const notificationsSummary = { unread: 0 };
            res.json({ usersCount, recentAudits, billing: billingSummary, notifications: notificationsSummary, dev: true });
        } catch (err) {
            res.status(500).json({ error: 'Server error' });
        }
    });
}
