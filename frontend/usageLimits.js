// frontend/usageLimits.js
// Web API for usage limits & quotas feature
import api, { apiRequest, notificationsAPI } from './api';

export const setUsageLimit = async (data, token) => api.post('/api/usage-limits', data, { headers: { Authorization: `Bearer ${token}` } });
export const getUsageLimits = async (token) => api.get('/api/usage-limits', { headers: { Authorization: `Bearer ${token}` } });
