const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('../middleware/authenticateJWT');
const Job = require('../models/Job');

router.get('/', async (req, res) => {
  try {
    if (Job.db.readyState !== 1) return res.status(503).json({ success: false, message: 'Project database temporarily unavailable.' });
    const jobs = await Job.find({ title: { $exists: true, $ne: '' } })
      .sort({ createdAt: -1, _id: -1 }).limit(100).lean();
    return res.json({ success: true, jobs });
  } catch {
    return res.status(503).json({ success: false, message: 'Projects could not be loaded.' });
  }
});

router.post('/', authenticateJWT, async (req, res) => {
  try {
    const owner = req.user && (req.user.id || req.user._id || req.user.sub);
    if (!owner) return res.status(401).json({ success: false, message: 'Account ID missing from verified session.' });
    const { title, description, budget, skills } = req.body || {};
    const amount = typeof budget === 'number' || typeof budget === 'string' ? Number(budget) : NaN;
    if (typeof title !== 'string' || !title.trim() || title.length > 200 ||
        typeof description !== 'string' || !description.trim() || description.length > 10000 ||
        budget === '' || (typeof budget === 'string' && !budget.trim()) || !Number.isFinite(amount) || amount < 0 ||
        !Array.isArray(skills) || skills.length > 50 ||
        skills.some(s => typeof s !== 'string' || s.length > 80)) {
      return res.status(400).json({ success: false, message: 'Provide a title, description, non-negative budget and skills list.' });
    }
    if (Job.db.readyState !== 1) return res.status(503).json({ success: false, message: 'Project database temporarily unavailable.' });
    const job = await Job.create({
      title: title.trim(), description: description.trim(), budget: amount,
      skills: [...new Set(skills.map(s => s.trim()).filter(Boolean))],
      userId: String(owner), status: 'open'
    });
    return res.status(201).json({ success: true, job });
  } catch {
    return res.status(503).json({ success: false, message: 'Project was not confirmed saved. Check the project list before retrying.' });
  }
});

const JobApplication = require('../models/JobApplication');
router.post('/:id/apply', authenticateJWT, async (req, res) => {
  try {
    const owner = req.user && (req.user.id || req.user._id || req.user.sub);
    if (!owner) return res.status(401).json({ success: false, message: 'Account ID missing from verified session.' });
    if (!/^[0-9a-f]{24}$/i.test(req.params.id || '')) {
      return res.status(400).json({ success: false, message: 'Invalid project ID.' });
    }
    if (Job.db.readyState !== 1 || JobApplication.db.readyState !== 1) {
      return res.status(503).json({ success: false, message: 'Application database temporarily unavailable.' });
    }
    const job = await Job.findById(req.params.id).select('_id').lean();
    if (!job) return res.status(404).json({ success: false, message: 'Project not found.' });
    await JobApplication.init();
    const application = await JobApplication.create({
      jobId: job._id, applicantId: String(owner), status: 'pending'
    });
    return res.status(201).json({
      success: true, message: 'Application saved.',
      application: {
        id: application._id, jobId: application.jobId,
        status: application.status, createdAt: application.createdAt
      }
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'You have already applied to this project.' });
    }
    return res.status(503).json({
      success: false,
      message: 'Application was not confirmed saved. Check before retrying.'
    });
  }
});
module.exports = router;