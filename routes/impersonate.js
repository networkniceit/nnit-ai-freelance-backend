// routes/impersonate.js
// User impersonation (admin feature)
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { authenticateJWT } = require('../middleware/authenticateJWT');
const User = require('../models/User');

// Admin-only: Impersonate a user (issue a JWT for that user)
router.post('/api/admin/impersonate', authenticateJWT, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
    const { userId } = req.body;
    try {
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ error: 'User not found' });
        const token = jwt.sign({ userId: user._id, email: user.email, role: user.role, impersonated: true }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ message: 'Impersonation token issued', token, user: { email: user.email, full_name: user.full_name } });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
