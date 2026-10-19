'use strict';
const router = require('express').Router();
const { protect } = require('../middleware/auth');
const Job = require('../models/Job');
const Application = require('../models/JobApplication');
const Profile = require('../models/MarketplaceProfile');
const User = require('../models/User');
const idOK = id => typeof id === 'string' && /^[0-9a-f]{24}$/i.test(id);
const owner = req => String(req.user._id || req.user.id);
const publicProfile = 'name skills hourlyRate bio experience available updatedAt';
const run = fn => async (req, res) => {
  try {
    if (Job.db.readyState !== 1) return res.status(503).json({ success: false, message: 'Marketplace database temporarily unavailable.' });
    return await fn(req, res);
  } catch (e) {
    if (e.code === 11000) return res.status(409).json({ success: false, message: 'This record already exists. Reload before retrying.' });
    return res.status(503).json({ success: false, message: 'Request could not be confirmed. Reload the saved records before retrying.' });
  }
};
router.get('/summary', run(async (req, res) => {
  const [projects, freelancers] = await Promise.all([
    Job.countDocuments({ title: { $exists: true, $ne: '' } }),
    Profile.countDocuments({ available: true })
  ]);
  res.json({ success: true, projects, freelancers });
}));
router.get('/freelancers', run(async (req, res) => {
  const freelancers = await Profile.find({ available: true }).select(publicProfile)
    .sort({ updatedAt: -1, _id: -1 }).limit(100).lean();
  res.json({ success: true, freelancers });
}));
router.use(protect);
router.get('/profile', run(async (req, res) => {
  const profile = await Profile.findOne({ userId: owner(req) }).select(publicProfile).lean();
  res.json({ success: true, profile });
}));
router.put('/profile', run(async (req, res) => {
  const { name, skills, hourlyRate, bio = '', experience = '', available = true } = req.body || {};
  const rate = typeof hourlyRate === 'number' || typeof hourlyRate === 'string' ? Number(hourlyRate) : NaN;
  if (typeof name !== 'string' || !name.trim() || name.length > 200 || !Array.isArray(skills) ||
      !skills.length || skills.length > 50 || skills.some(s => typeof s !== 'string' || !s.trim() || s.length > 80) ||
      hourlyRate === '' || (typeof hourlyRate === 'string' && !hourlyRate.trim()) || !Number.isFinite(rate) || rate < 0 ||
      typeof bio !== 'string' || bio.length > 5000 || typeof experience !== 'string' || experience.length > 5000 ||
      typeof available !== 'boolean') {
    return res.status(400).json({ success: false, message: 'Provide a name, skills, non-negative hourly rate and valid profile text.' });
  }
  await Profile.init();
  const profile = await Profile.findOneAndUpdate({ userId: owner(req) }, { $set: {
    name: name.trim(), skills: [...new Set(skills.map(s => s.trim()))], hourlyRate: rate,
    bio: bio.trim(), experience: experience.trim(), available
  } }, { upsert: true, new: true, runValidators: true }).select(publicProfile).lean();
  res.json({ success: true, profile });
}));
router.get('/applications', run(async (req, res) => {
  const applications = await Application.find({ applicantId: owner(req) })
    .sort({ createdAt: -1, _id: -1 }).limit(100)
    .populate('jobId', 'title budget status userId').lean();
  res.json({ success: true, applications: applications.map(a => ({
    id: a._id, status: a.status, createdAt: a.createdAt,
    project: a.jobId ? { id: a.jobId._id, title: a.jobId.title, budget: a.jobId.budget, status: a.jobId.status } : null
  })) });
}));
router.get('/projects', run(async (req, res) => {
  const projects = await Job.find({ userId: owner(req), title: { $exists: true, $ne: '' } })
    .sort({ createdAt: -1, _id: -1 }).limit(100).lean();
  res.json({ success: true, projects });
}));
router.patch('/projects/:id', run(async (req, res) => {
  if (!idOK(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid project ID.' });
  const body = req.body || {};
  const fields = Object.keys(body);
  if (!fields.length || fields.some(k => !['title', 'description', 'budget', 'skills', 'status'].includes(k))) {
    return res.status(400).json({ success: false, message: 'Unexpected project fields.' });
  }
  const update = {};
  if ('title' in body) {
    if (typeof body.title !== 'string' || !body.title.trim() || body.title.length > 200) return res.status(400).json({ success: false, message: 'Invalid title.' });
    update.title = body.title.trim();
  }
  if ('description' in body) {
    if (typeof body.description !== 'string' || !body.description.trim() || body.description.length > 10000) return res.status(400).json({ success: false, message: 'Invalid description.' });
    update.description = body.description.trim();
  }
  if ('budget' in body) {
    if (!['number', 'string'].includes(typeof body.budget) || String(body.budget).trim() === '' || !Number.isFinite(Number(body.budget)) || Number(body.budget) < 0) return res.status(400).json({ success: false, message: 'Invalid budget.' });
    update.budget = Number(body.budget);
  }
  if ('skills' in body) {
    if (!Array.isArray(body.skills) || body.skills.length > 50 || body.skills.some(s => typeof s !== 'string' || s.length > 80)) return res.status(400).json({ success: false, message: 'Invalid skills.' });
    update.skills = [...new Set(body.skills.map(s => s.trim()).filter(Boolean))];
  }
  if ('status' in body) {
    if (!['open', 'closed'].includes(body.status)) return res.status(400).json({ success: false, message: 'Use open or closed status.' });
    update.status = body.status;
  }
  const project = await Job.findOneAndUpdate({ _id: req.params.id, userId: owner(req) }, { $set: update }, { new: true, runValidators: true }).lean();
  if (!project) return res.status(404).json({ success: false, message: 'Owned project not found.' });
  res.json({ success: true, project });
}));
router.get('/projects/:id/applications', run(async (req, res) => {
  if (!idOK(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid project ID.' });
  const project = await Job.findOne({ _id: req.params.id, userId: owner(req) }).select('_id title').lean();
  if (!project) return res.status(404).json({ success: false, message: 'Owned project not found.' });
  const applications = await Application.find({ jobId: project._id }).sort({ createdAt: -1, _id: -1 }).limit(100).lean();
  const ids = [...new Set(applications.map(a => a.applicantId).filter(idOK))];
  const users = ids.length ? await User.find({ _id: { $in: ids } }).select('_id name').lean() : [];
  const names = new Map(users.map(u => [String(u._id), u.name]));
  res.json({ success: true, project, applications: applications.map(a => ({
    id: a._id, applicantName: names.get(a.applicantId) || 'Account unavailable', status: a.status, createdAt: a.createdAt
  })) });
}));
router.patch('/projects/:id/applications/:applicationId', run(async (req, res) => {
  if (!idOK(req.params.id) || !idOK(req.params.applicationId)) return res.status(400).json({ success: false, message: 'Invalid record ID.' });
  const status = req.body?.status;
  if (!['accepted', 'rejected'].includes(status)) return res.status(400).json({ success: false, message: 'Choose accepted or rejected.' });
  const project = await Job.findOne({ _id: req.params.id, userId: owner(req) }).select('_id').lean();
  if (!project) return res.status(404).json({ success: false, message: 'Owned project not found.' });
  const application = await Application.findOneAndUpdate({ _id: req.params.applicationId, jobId: project._id, status: 'pending' }, { $set: { status } }, { new: true, runValidators: true }).select('_id status').lean();
  if (!application) return res.status(409).json({ success: false, message: 'Application missing or already decided. Reload the list.' });
  res.json({ success: true, application });
}));
router.get('/notifications', run(async (req, res) => {
  const mine = await Application.find({ applicantId: owner(req) }).sort({ createdAt: -1 }).limit(50).populate('jobId', 'title').lean();
  const projects = await Job.find({ userId: owner(req) }).select('_id title').lean();
  const projectNames = new Map(projects.map(p => [String(p._id), p.title]));
  const incoming = projects.length ? await Application.find({ jobId: { $in: projects.map(p => p._id) } }).sort({ createdAt: -1 }).limit(50).lean() : [];
  const notifications = [
    ...mine.map(a => ({ id: 'own-' + a._id, message: 'Your application: ' + (a.jobId?.title || 'Project unavailable') + ' — ' + a.status, createdAt: a.createdAt })),
    ...incoming.map(a => ({ id: 'received-' + a._id, message: 'Application received: ' + (projectNames.get(String(a.jobId)) || 'Project') + ' — ' + a.status, createdAt: a.createdAt }))
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 100);
  res.json({ success: true, notifications });
}));
// NNIT_DELIVERY_V1
router.use(require('./workDelivery'));
module.exports = router;
