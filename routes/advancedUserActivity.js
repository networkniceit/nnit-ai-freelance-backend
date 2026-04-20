// routes/advancedUserActivity.js
// Advanced Feature: Advanced User Activity Tracking (step 52)
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        const token = authHeader.split(' ')[1];
        jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
            if (err) return res.sendStatus(403);
            req.user = user;
            next();
        });
    } else {
        res.sendStatus(401);
    }
};

// POST /api/user-activity
router.post('/', authenticateJWT, async (req, res) => {
    // Log user activity (actions, navigation, etc.)
    // ... Activity logic here ...
    res.json({ success: true, message: 'User activity logged.' });
});

// GET /api/user-activity
router.get('/', authenticateJWT, async (req, res) => {
    // Fetch user activity logs
    // ... Activity logic here ...
    res.json({ activities: [] });
});

module.exports = router;
