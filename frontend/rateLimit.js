// frontend/rateLimit.js
// React API call for admin rate limit monitoring
import api, { apiRequest, notificationsAPI } from './api';

export async function getRateLimitLogs(token) {
    try {
        const response = await api.get('/api/admin/rate-limit-logs', {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data.logs;
    } catch (error) {
        throw error.response ? error.response.data : error;
    }
}

// Usage in a React component (admin only):
// import { getRateLimitLogs } from './rateLimit';
// const logs = await getRateLimitLogs(token);
