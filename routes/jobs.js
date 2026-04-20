// routes/jobs.js
// Job Automation: create, process, complete jobs
const express = require('express');
const router = express.Router();
const Joi = require('joi');
const { authenticateJWT } = require('../middleware/authenticateJWT');
const Job = require('../models/Job'); // Replace with your Job model

const jobSchema = Joi.object({
    title: Joi.string().required(),
    description: Joi.string().required(),
    budget: Joi.number().min(0).required(),
});

// Create a new job
router.post('/api/jobs', authenticateJWT, async (req, res) => {
    const { error } = jobSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });
    try {
        const job = new Job({
            ...req.body,
            user_id: req.user.userId,
            status: 'pending',
            created_at: new Date(),
        });
        await job.save();
        res.status(201).json({ message: 'Job created', job });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Process a job (simulate AI automation)
router.post('/api/jobs/:id/process', authenticateJWT, async (req, res) => {
    try {
        const job = await Job.findById(req.params.id);
        if (!job) return res.status(404).json({ error: 'Job not found' });
        if (job.status !== 'pending') return res.status(400).json({ error: 'Job already processed' });
        // Simulate AI processing (replace with real logic)
        job.status = 'completed';
        job.progress = 100;
        job.completed_at = new Date();
        await job.save();
        res.json({ message: 'Job processed and completed', job });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Get all jobs for the user
router.get('/api/jobs', authenticateJWT, async (req, res) => {
    try {
        const jobs = await Job.find({ user_id: req.user.userId });
        res.json({ jobs });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
