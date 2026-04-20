// frontend/advancedUserActivity.js
// Web API for advanced user activity tracking feature
import api, { apiRequest, notificationsAPI } from './api';

export const logUserActivity = async (data, token) => api.post('/api/user-activity', data, { headers: { Authorization: `Bearer ${token}` } });
export const getUserActivities = async (token) => api.get('/api/user-activity', { headers: { Authorization: `Bearer ${token}` } });
