// routes/organizations.js
// Multi-tenant support: organizations/teams
const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('../middleware/authenticateJWT');
const Organization = require('../models/Organization');
const User = require('../models/User');

// Create organization
router.post('/api/organizations', authenticateJWT, async (req, res) => {
    const { name } = req.body;
    try {
        const org = new Organization({ name, owner: req.user.userId, members: [req.user.userId], created_at: new Date() });
        await org.save();
        // Add org to user
        const user = await User.findById(req.user.userId);
        user.organization = org._id;
        await user.save();
        res.status(201).json({ message: 'Organization created', org });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Add member to organization (owner only)
router.post('/api/organizations/:orgId/members', authenticateJWT, async (req, res) => {
    const { userId } = req.body;
    try {
        const org = await Organization.findById(req.params.orgId);
        if (!org) return res.status(404).json({ error: 'Organization not found' });
        if (org.owner.toString() !== req.user.userId) return res.status(403).json({ error: 'Only owner can add members' });
        if (!org.members.includes(userId)) org.members.push(userId);
        await org.save();
        const user = await User.findById(userId);
        user.organization = org._id;
        await user.save();
        res.json({ message: 'Member added', org });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// List organizations for user
router.get('/api/organizations', authenticateJWT, async (req, res) => {
    try {
        const orgs = await Organization.find({ members: req.user.userId });
        res.json({ orgs });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
