// frontend/advancedScheduling.js
// Web API for advanced scheduling feature
import api, { apiRequest, notificationsAPI } from './api';

export const createScheduledJob = async (data, token) => api.post('/api/advanced-scheduling', data, { headers: { Authorization: `Bearer ${token}` } });
export const getScheduledJobs = async (token) => api.get('/api/advanced-scheduling', { headers: { Authorization: `Bearer ${token}` } });
export const deleteScheduledJob = async (id, token) => api.delete(`/api/advanced-scheduling/${id}`, { headers: { Authorization: `Bearer ${token}` } });
