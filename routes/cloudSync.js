const express = require('express');
const router = express.Router();
const axios = require('axios');
const { validateCloudToken } = require('../middleware/auth');
const logger = require('../utils/logger');
const freelanceSyncService = require('../services/freelanceSyncService');

// Scheduled sync: Pull jobs from NNIT Cloud and upsert
router.get('/api/cloud/sync-jobs', validateCloudToken, async (req, res) => {
  try {
    const { data } = await axios.get(`${process.env.CLOUD_API_URL}/api/jobs`, {
      headers: { Authorization: `Bearer ${process.env.CLOUD_API_TOKEN}` }
    });
    const result = await freelanceSyncService.syncJobs(data);
    logger.info('Pulled jobs from NNIT Cloud', { count: Array.isArray(data) ? data.length : undefined });
    res.json({ jobs: data, sync: result });
  } catch (err) {
    logger.error('Cloud job sync failed', { error: err.message });
    res.status(500).json({ error: 'Cloud job sync failed', details: err.message });
  }
});

// Scheduled sync: Pull agents from NNIT Cloud and upsert
router.get('/api/cloud/sync-agents', validateCloudToken, async (req, res) => {
  try {
    const { data } = await axios.get(`${process.env.CLOUD_API_URL}/api/agents`, {
      headers: { Authorization: `Bearer ${process.env.CLOUD_API_TOKEN}` }
    });
    const result = await freelanceSyncService.syncAgents(data);
    logger.info('Pulled agents from NNIT Cloud', { count: Array.isArray(data) ? data.length : undefined });
    res.json({ agents: data, sync: result });
  } catch (err) {
    logger.error('Cloud agent sync failed', { error: err.message });
    res.status(500).json({ error: 'Cloud agent sync failed', details: err.message });
  }
});

// Scheduled sync: Pull users from NNIT Cloud and upsert
router.get('/api/cloud/sync-users', validateCloudToken, async (req, res) => {
  try {
    const { data } = await axios.get(`${process.env.CLOUD_API_URL}/api/users`, {
      headers: { Authorization: `Bearer ${process.env.CLOUD_API_TOKEN}` }
    });
    const result = await freelanceSyncService.syncUsers(data);
    logger.info('Pulled users from NNIT Cloud', { count: Array.isArray(data) ? data.length : undefined });
    res.json({ users: data, sync: result });
  } catch (err) {
    logger.error('Cloud user sync failed', { error: err.message });
    res.status(500).json({ error: 'Cloud user sync failed', details: err.message });
  }
});

// Webhook: Receive job updates from NNIT Cloud and upsert
router.post('/api/cloud/webhook/job', validateCloudToken, async (req, res) => {
  try {
    const result = await freelanceSyncService.handleJobWebhook(req.body);
    logger.info('Received job webhook from NNIT Cloud', { job: req.body });
    res.json({ status: 'received', data: req.body, sync: result });
  } catch (err) {
    logger.error('Job webhook processing failed', { error: err.message });
    res.status(500).json({ error: 'Job webhook failed', details: err.message });
  }
});

// Webhook: Receive agent updates from NNIT Cloud and upsert
router.post('/api/cloud/webhook/agent', validateCloudToken, async (req, res) => {
  try {
    const result = await freelanceSyncService.handleAgentWebhook(req.body);
    logger.info('Received agent webhook from NNIT Cloud', { agent: req.body });
    res.json({ status: 'received', data: req.body, sync: result });
  } catch (err) {
    logger.error('Agent webhook processing failed', { error: err.message });
    res.status(500).json({ error: 'Agent webhook failed', details: err.message });
  }
});

// Webhook: Receive user updates from NNIT Cloud and upsert
router.post('/api/cloud/webhook/user', validateCloudToken, async (req, res) => {
  try {
    const result = await freelanceSyncService.handleUserWebhook(req.body);
    logger.info('Received user webhook from NNIT Cloud', { user: req.body });
    res.json({ status: 'received', data: req.body, sync: result });
  } catch (err) {
    logger.error('User webhook processing failed', { error: err.message });
    res.status(500).json({ error: 'User webhook failed', details: err.message });
  }
});



module.exports = router;