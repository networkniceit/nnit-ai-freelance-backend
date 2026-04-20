// routes/social.js
// Social Login (Google OAuth2 example)
const express = require('express');
const router = express.Router();
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Google login endpoint
router.post('/api/auth/google', async (req, res) => {
    const { tokenId } = req.body;
    try {
        const ticket = await client.verifyIdToken({
            idToken: tokenId,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        let user = await User.findOne({ email: payload.email });
        if (!user) {
            user = new User({
                email: payload.email,
                full_name: payload.name,
                avatar: payload.picture,
                password_hash: '', // Not used for social login
                social: { google: true },
            });
            await user.save();
        }
        const token = jwt.sign({ userId: user._id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.json({ message: 'Google login successful', token, user: { email: user.email, full_name: user.full_name } });
    } catch (err) {
        res.status(401).json({ error: 'Invalid Google token' });
    }
});

module.exports = router;
