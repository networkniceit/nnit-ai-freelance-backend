// Express route for saving user info (production-ready)
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
// Replace with your actual User model (Postgres/MongoDB)
const User = require('../models/User');
const { authenticateJWT } = require('../middleware/authenticateJWT');

// Validation schema
const userSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8),
    full_name: Joi.string().required(),
    // Add more fields as needed
});

// Save (create/update) user info
router.post('/api/users', authenticateJWT, async (req, res) => {
    // Validate input
    const { error } = userSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    try {
        const { email, password, full_name } = req.body;
        let user = await User.findOne({ email });
        if (user) {
            // Update existing user
            if (password) user.password_hash = await bcrypt.hash(password, 10);
            user.full_name = full_name;
            // ...update other fields
            await user.save();
            return res.json({ message: 'User updated', user });
        } else {
            // Create new user
            const password_hash = password ? await bcrypt.hash(password, 10) : undefined;
            user = new User({ email, password_hash, full_name });
            await user.save();
            return res.status(201).json({ message: 'User created', user });
        }
    } catch (err) {
        return res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
