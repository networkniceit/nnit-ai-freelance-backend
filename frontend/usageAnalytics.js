// frontend/usageAnalytics.js
// Web API for usage analytics feature
import api, { apiRequest, notificationsAPI } from './api';

export const logUsageEvent = async (data, token) => api.post('/api/usage-analytics/event', data, { headers: { Authorization: `Bearer ${token}` } });
export const getUsageStats = async (params, token) => api.get('/api/usage-analytics/stats', { params, headers: { Authorization: `Bearer ${token}` } });
