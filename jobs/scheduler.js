// jobs/scheduler.js
// Scheduled/recurring jobs using node-cron
const cron = require('node-cron');
const { triggerWebhooks } = require('../routes/webhooks');
const Job = require('../models/Job');

// Example: Run every day at midnight to check for overdue jobs
cron.schedule('0 0 * * *', async () => {
    const overdueJobs = await Job.find({ status: 'pending', due_date: { $lt: new Date() } });
    for (const job of overdueJobs) {
        // Mark as overdue, notify, or trigger webhook
        job.status = 'overdue';
        await job.save();
        await triggerWebhooks('job.overdue', { jobId: job._id, userId: job.user_id });
    }
    console.log(`[Scheduler] Processed ${overdueJobs.length} overdue jobs at ${new Date().toISOString()}`);
});


// Best-of-the-best: Every hour, sync jobs from NNIT Cloud
const axios = require('axios');
cron.schedule('0 * * * *', async () => {
    try {
        await axios.get('http://localhost:3003/api/cloud/sync-jobs');
        console.log(`[Scheduler] Synced jobs from NNIT Cloud at ${new Date().toISOString()}`);
    } catch (err) {
        console.error('[Scheduler] Scheduled sync failed:', err.message);
    }
});

module.exports = cron;
