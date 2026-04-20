// routes/notifications.js
// Notification System: in-app, email (Nodemailer), push (placeholder)
const express = require('express');
const router = express.Router();
const Joi = require('joi');
const { authenticateJWT } = require('../middleware/authenticateJWT');
const Notification = require('../models/Notification'); // Replace with your Notification model
const nodemailer = require('nodemailer');

const notifSchema = Joi.object({
    user_id: Joi.string().required(),
    type: Joi.string().valid('in-app', 'email', 'push').required(),
    message: Joi.string().required(),
    subject: Joi.string().optional(),
});

// In-app notification
router.post('/api/notifications', authenticateJWT, async (req, res) => {
    const { error } = notifSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });
    try {
        const notif = new Notification({
            ...req.body,
            created_at: new Date(),
            read: false,
        });
        await notif.save();
        res.status(201).json({ message: 'Notification sent', notif });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Get all notifications for a user
router.get('/api/notifications', authenticateJWT, async (req, res) => {
    try {
        const notifs = await Notification.find({ user_id: req.user.userId });
        res.json({ notifs });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Email notification (using Nodemailer)
router.post('/api/notifications/email', authenticateJWT, async (req, res) => {
    const { user_id, subject, message } = req.body;
    // You would look up the user's email in your User model
    // For demo, use a placeholder
    const userEmail = req.body.email || 'user@example.com';
    try {
        let transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: userEmail,
            subject: subject || 'Notification',
            text: message,
        });
        res.json({ message: 'Email sent' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Example endpoint
router.get('/', (req, res) => {
  res.json({ success: true, message: 'Notifications endpoint works!' });
});

module.exports = router;
