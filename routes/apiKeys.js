// routes/apiKeys.js
// API key management for external integrations
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { authenticateJWT } = require('../middleware/authenticateJWT');
const ApiKey = require('../models/ApiKey');

// Generate new API key
router.post('/api/api-keys', authenticateJWT, async (req, res) => {
    const key = crypto.randomBytes(32).toString('hex');
    const apiKey = new ApiKey({
        user_id: req.user.userId,
        key,
        label: req.body.label || 'API Key',
        created_at: new Date(),
        active: true,
    });
    await apiKey.save();
    res.status(201).json({ apiKey });
});

// List user's API keys
router.get('/api/api-keys', authenticateJWT, async (req, res) => {
    const keys = await ApiKey.find({ user_id: req.user.userId });
    res.json({ apiKeys: keys });
});

// Revoke API key
router.delete('/api/api-keys/:keyId', authenticateJWT, async (req, res) => {
    await ApiKey.deleteOne({ _id: req.params.keyId, user_id: req.user.userId });
    res.json({ message: 'API key revoked' });
});

module.exports = router;
