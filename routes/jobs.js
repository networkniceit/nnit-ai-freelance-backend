const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('../middleware/authenticateJWT');

let jobs = [
  { _id: '1', title: 'React Developer Needed', description: 'Build a modern dashboard', budget: 500, skills: ['React', 'CSS'], createdAt: new Date() },
  { _id: '2', title: 'Node.js Backend Engineer', description: 'REST API development', budget: 800, skills: ['Node.js', 'MongoDB'], createdAt: new Date() },
  { _id: '3', title: 'UI/UX Designer', description: 'Design mobile app screens', budget: 300, skills: ['Figma', 'Design'], createdAt: new Date() }
];

router.get('/', (req, res) => res.json({ success: true, jobs }));
router.post('/', authenticateJWT, (req, res) => {
  const job = { _id: Date.now().toString(), ...req.body, createdAt: new Date() };
  jobs.push(job);
  res.json({ success: true, job });
});
router.post('/:id/apply', authenticateJWT, (req, res) => {
  res.json({ success: true, message: 'Application submitted!' });
});

module.exports = router; 