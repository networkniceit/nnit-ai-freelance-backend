// frontend/advancedReporting.js
// Web API for advanced reporting feature
import api, { apiRequest, notificationsAPI } from './api';

export const startReport = async (data, token) => api.post('/api/advanced-reporting', data, { headers: { Authorization: `Bearer ${token}` } });
export const getReportStatus = async (token) => api.get('/api/advanced-reporting/status', { headers: { Authorization: `Bearer ${token}` } });
