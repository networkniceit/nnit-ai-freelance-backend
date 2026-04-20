// routes/mfa.js
// Multi-factor Authentication (MFA) with TOTP (e.g., Google Authenticator)
const express = require('express');
const router = express.Router();
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const { authenticateJWT } = require('../middleware/authenticateJWT');
const User = require('../models/User');

// Enable MFA for user (generate secret and QR code)
router.post('/api/mfa/setup', authenticateJWT, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user) return res.status(404).json({ error: 'User not found' });
        const secret = speakeasy.generateSecret({ name: `NNIT Platform (${user.email})` });
        user.mfa_secret = secret.base32;
        await user.save();
        const qr = await qrcode.toDataURL(secret.otpauth_url);
        res.json({ message: 'MFA setup', secret: secret.base32, qr });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Verify MFA token
router.post('/api/mfa/verify', authenticateJWT, async (req, res) => {
    const { token } = req.body;
    try {
        const user = await User.findById(req.user.userId);
        if (!user || !user.mfa_secret) return res.status(400).json({ error: 'MFA not setup' });
        const verified = speakeasy.totp.verify({
            secret: user.mfa_secret,
            encoding: 'base32',
            token,
            window: 1,
        });
        if (!verified) return res.status(401).json({ error: 'Invalid MFA token' });
        user.mfa_enabled = true;
        await user.save();
        res.json({ message: 'MFA verified and enabled' });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Login with MFA (after password)
router.post('/api/auth/login-mfa', async (req, res) => {
    const { email, password, token } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(401).json({ error: 'Invalid credentials' });
        const valid = await require('bcrypt').compare(password, user.password_hash);
        if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
        if (user.mfa_enabled) {
            const verified = speakeasy.totp.verify({
                secret: user.mfa_secret,
                encoding: 'base32',
                token,
                window: 1,
            });
            if (!verified) return res.status(401).json({ error: 'Invalid MFA token' });
        }
        const jwt = require('jsonwebtoken');
        const tokenJwt = jwt.sign({ userId: user._id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.json({ message: 'Login successful', token: tokenJwt, user: { email: user.email, full_name: user.full_name } });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
