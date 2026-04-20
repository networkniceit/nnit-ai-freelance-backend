// routes/pushNotifications.js
// Mobile push notifications with Firebase Cloud Messaging (FCM)
const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('../middleware/authenticateJWT');
const admin = require('firebase-admin');
const User = require('../models/User');

// Save FCM token for user
router.post('/api/push/register', authenticateJWT, async (req, res) => {
    const { fcmToken } = req.body;
    const user = await User.findById(req.user.userId);
    user.fcm_token = fcmToken;
    await user.save();
    res.json({ message: 'FCM token saved' });
});

// Send push notification to a user
router.post('/api/push/send', authenticateJWT, async (req, res) => {
    const { userId, title, body } = req.body;
    const user = await User.findById(userId);
    if (!user.fcm_token) return res.status(400).json({ error: 'User has no FCM token' });
    const message = {
        token: user.fcm_token,
        notification: { title, body },
    };
    try {
        await admin.messaging().send(message);
        res.json({ message: 'Push notification sent' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
