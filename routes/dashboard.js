// routes/dashboard.js
// Custom user dashboards/widgets
const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('../middleware/authenticateJWT');
const User = require('../models/User');

// Save user dashboard/widget preferences
router.post('/api/dashboard/widgets', authenticateJWT, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user) return res.status(404).json({ error: 'User not found' });
        user.dashboard_widgets = req.body.widgets; // Array of widget configs
        await user.save();
        res.json({ message: 'Dashboard widgets saved', widgets: user.dashboard_widgets });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Load user dashboard/widget preferences
router.get('/api/dashboard/widgets', authenticateJWT, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json({ widgets: user.dashboard_widgets || [] });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
