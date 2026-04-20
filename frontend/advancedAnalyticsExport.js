// frontend/advancedAnalyticsExport.js
// Web API for advanced analytics export feature
import api, { apiRequest, notificationsAPI } from './api';

export const startAdvancedAnalyticsExport = async (data, token) => api.post('/api/analytics-export/advanced', data, { headers: { Authorization: `Bearer ${token}` } });
export const getAdvancedAnalyticsExportStatus = async (token) => api.get('/api/analytics-export/advanced/status', { headers: { Authorization: `Bearer ${token}` } });
