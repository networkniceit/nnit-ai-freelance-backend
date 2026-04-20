// services/freelanceSyncService.js
// NNIT Cloud backend: Service for freelance sync endpoints

const logger = require('../utils/logger');
const Job = require('../models/Job');
const Agent = require('../models/Agent');
const User = require('../models/User');

module.exports = {
  // Scheduled sync: upsert jobs
  async syncJobs(jobs = []) {
    try {
      for (const job of jobs) {
        await Job.findOneAndUpdate(
          { id: job.id },
          { $set: job },
          { upsert: true, new: true }
        );
      }
      logger.info('syncJobs: Jobs synced successfully', { count: jobs.length });
      return { message: 'Jobs synced successfully', count: jobs.length };
    } catch (error) {
      logger.error('syncJobs: Failed to sync jobs', { error });
      throw error;
    }
  },

  // Webhook handler: upsert single job
  async handleJobWebhook(jobData) {
    try {
      await Job.findOneAndUpdate(
        { id: jobData.id },
        { $set: jobData },
        { upsert: true, new: true }
      );
      logger.info('handleJobWebhook: Job processed', { jobId: jobData.id });
      return { message: 'Job processed', jobId: jobData.id };
    } catch (error) {
      logger.error('handleJobWebhook: Failed to process job', { error });
      throw error;
    }
  },

  // Scheduled sync: upsert agents
  async syncAgents(agents = []) {
    try {
      for (const agent of agents) {
        await Agent.findOneAndUpdate(
          { id: agent.id },
          { $set: agent },
          { upsert: true, new: true }
        );
      }
      logger.info('syncAgents: Agents synced successfully', { count: agents.length });
      return { message: 'Agents synced successfully', count: agents.length };
    } catch (error) {
      logger.error('syncAgents: Failed to sync agents', { error });
      throw error;
    }
  },

  // Webhook handler: upsert single agent
  async handleAgentWebhook(agentData) {
    try {
      await Agent.findOneAndUpdate(
        { id: agentData.id },
        { $set: agentData },
        { upsert: true, new: true }
      );
      logger.info('handleAgentWebhook: Agent processed', { agentId: agentData.id });
      return { message: 'Agent processed', agentId: agentData.id };
    } catch (error) {
      logger.error('handleAgentWebhook: Failed to process agent', { error });
      throw error;
    }
  },

  // Scheduled sync: upsert users
  async syncUsers(users = []) {
    try {
      for (const user of users) {
        await User.findOneAndUpdate(
          { id: user.id },
          { $set: user },
          { upsert: true, new: true }
        );
      }
      logger.info('syncUsers: Users synced successfully', { count: users.length });
      return { message: 'Users synced successfully', count: users.length };
    } catch (error) {
      logger.error('syncUsers: Failed to sync users', { error });
      throw error;
    }
  },

  // Webhook handler: upsert single user
  async handleUserWebhook(userData) {
    try {
      await User.findOneAndUpdate(
        { id: userData.id },
        { $set: userData },
        { upsert: true, new: true }
      );
      logger.info('handleUserWebhook: User processed', { userId: userData.id });
      return { message: 'User processed', userId: userData.id };
    } catch (error) {
      logger.error('handleUserWebhook: Failed to process user', { error });
      throw error;
    }
  },
};
