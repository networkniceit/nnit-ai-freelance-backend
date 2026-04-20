// frontend/scheduler.js
// (No direct frontend code for backend cron jobs, but you can show job status in the UI)
import api, { apiRequest, notificationsAPI } from './api';

export async function getOverdueJobs(token) {
    try {
        const response = await api.get('/api/jobs?status=overdue', {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data.jobs;
    } catch (error) {
        throw error.response ? error.response.data : error;
    }
}

// Usage in a React component:
// import { getOverdueJobs } from './scheduler';
// const overdueJobs = await getOverdueJobs(token);
