// routes/chat.js
// Real-time chat/messaging using Socket.IO and REST fallback
const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('../middleware/authenticateJWT');
const Message = require('../models/Message'); // Replace with your Message model

// REST: Get chat history between two users
router.get('/api/chat/:userId', authenticateJWT, async (req, res) => {
    try {
        const messages = await Message.find({
            $or: [
                { from: req.user.userId, to: req.params.userId },
                { from: req.params.userId, to: req.user.userId },
            ],
        }).sort({ created_at: 1 });
        res.json({ messages });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// REST: Send a message (for non-realtime fallback)
router.post('/api/chat/:userId', authenticateJWT, async (req, res) => {
    const { text } = req.body;
    try {
        const message = new Message({
            from: req.user.userId,
            to: req.params.userId,
            text,
            created_at: new Date(),
        });
        await message.save();
        // Optionally emit via Socket.IO here if you want REST to trigger real-time
        res.status(201).json({ message });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
