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
// NNIT_PLAN_ACCESS_V1
router.post('/:id/apply', require('../middleware/auth').protect, require('../services/nnitPlanAccess').submit);
module.exports = router;
