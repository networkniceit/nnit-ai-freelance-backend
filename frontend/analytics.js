// frontend/analytics.js
// React API calls for analytics (summary, per user)
import api, { apiRequest, notificationsAPI } from './api'; // Your axios instance

export async function getAnalyticsSummary(token) {
    try {
        const response = await api.get('/api/analytics/summary', {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : error;
    }
}

export async function getUserAnalytics(userId, token) {
    try {
        const response = await api.get(`/api/analytics/user/${userId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : error;
    }
}

// Usage in a React component:
// import { getAnalyticsSummary, getUserAnalytics } from './analytics';
// const summary = await getAnalyticsSummary(token);
// const userStats = await getUserAnalytics(userId, token);
