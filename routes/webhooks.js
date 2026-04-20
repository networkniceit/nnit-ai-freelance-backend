// routes/webhooks.js
// Webhooks for external integrations (trigger on events)
const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('../middleware/authenticateJWT');
const Webhook = require('../models/Webhook'); // Replace with your Webhook model
const axios = require('axios');

// Register a webhook (admin only)
router.post('/api/webhooks', authenticateJWT, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
    const { url, event } = req.body;
    try {
        const webhook = new Webhook({ url, event, created_at: new Date() });
        await webhook.save();
        res.status(201).json({ message: 'Webhook registered', webhook });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// List all webhooks (admin only)
router.get('/api/webhooks', authenticateJWT, async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
    try {
        const webhooks = await Webhook.find();
        res.json({ webhooks });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Trigger webhooks (to be called from your business logic)
async function triggerWebhooks(event, payload) {
    const webhooks = await Webhook.find({ event });
    for (const webhook of webhooks) {
        try {
            await axios.post(webhook.url, payload);
        } catch (err) {
            // Log or handle failed webhook delivery
        }
    }
}

module.exports = router;
