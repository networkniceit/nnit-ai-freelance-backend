// frontend/advancedTimeExport.js
// Web API for advanced time export feature
import api, { apiRequest, notificationsAPI } from './api';

export const startAdvancedTimeExport = async (data, token) => api.post('/api/time-export/advanced', data, { headers: { Authorization: `Bearer ${token}` } });
export const getAdvancedTimeExportStatus = async (token) => api.get('/api/time-export/advanced/status', { headers: { Authorization: `Bearer ${token}` } });
