// frontend/jobs.js
// React API calls for job automation (create, process, list jobs)
import api, { apiRequest, notificationsAPI } from './api'; // Your axios instance

export async function createJob(data, token) {
    try {
        const response = await api.post('/api/jobs', data, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : error;
    }
}

export async function processJob(jobId, token) {
    try {
        const response = await api.post(`/api/jobs/${jobId}/process`, {}, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : error;
    }
}

export async function getJobs(token) {
    try {
        const response = await api.get('/api/jobs', {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data.jobs;
    } catch (error) {
        throw error.response ? error.response.data : error;
    }
}

// Usage in a React component:
// import { createJob, processJob, getJobs } from './jobs';
// await createJob({ title, description, budget }, token);
// await processJob(jobId, token);
// const jobs = await getJobs(token);
