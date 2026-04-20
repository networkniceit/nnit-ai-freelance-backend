// routes/certificates.js
// Certificate Management: issue, view, verify certificates
const express = require('express');
const router = express.Router();
const Joi = require('joi');
const { authenticateJWT } = require('../middleware/authenticateJWT');
const Certificate = require('../models/Certificate'); // Replace with your Certificate model

const certSchema = Joi.object({
    user_id: Joi.string().required(),
    type: Joi.string().required(),
    issued_by: Joi.string().required(),
    valid_from: Joi.date().required(),
    valid_to: Joi.date().required(),
});

// Issue a new certificate
router.post('/api/certificates/issue', authenticateJWT, async (req, res) => {
    const { error } = certSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });
    try {
        const cert = new Certificate({
            ...req.body,
            status: 'active',
            issued_at: new Date(),
        });
        await cert.save();
        res.status(201).json({ message: 'Certificate issued', cert });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// View all certificates for a user
router.get('/api/certificates/:userId', authenticateJWT, async (req, res) => {
    try {
        const certs = await Certificate.find({ user_id: req.params.userId });
        res.json({ certs });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Verify a certificate by ID
router.get('/api/certificates/verify/:certId', async (req, res) => {
    try {
        const cert = await Certificate.findById(req.params.certId);
        if (!cert) return res.status(404).json({ error: 'Certificate not found' });
        res.json({ valid: cert.status === 'active', cert });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
