// routes/profile.js
// User Profile Management (update info, upload avatar)
const express = require('express');
const router = express.Router();
const multer = require('multer');
const Joi = require('joi');
const { authenticateJWT } = require('../middleware/authenticateJWT');
const User = require('../models/User'); // Replace with your User model

// Multer setup for avatar uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/avatars/');
    },
    filename: function (req, file, cb) {
        cb(null, req.user.userId + '_' + Date.now() + '_' + file.originalname);
    },
});
const upload = multer({ storage });

const profileSchema = Joi.object({
    full_name: Joi.string().optional(),
    contact_email: Joi.string().email().optional(),
    // Add more fields as needed
});

// Update profile info
router.put('/api/profile', authenticateJWT, async (req, res) => {
    const { error } = profileSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });
    try {
        const user = await User.findById(req.user.userId);
        if (!user) return res.status(404).json({ error: 'User not found' });
        Object.assign(user, req.body);
        await user.save();
        res.json({ message: 'Profile updated', user });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Upload avatar
router.post('/api/profile/avatar', authenticateJWT, upload.single('avatar'), async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user) return res.status(404).json({ error: 'User not found' });
        user.avatar = req.file.path;
        await user.save();
        res.json({ message: 'Avatar uploaded', avatar: req.file.path });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
