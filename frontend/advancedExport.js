// frontend/advancedExport.js
// Web API for advanced data export feature
import api, { apiRequest, notificationsAPI } from './api';

export const startExport = async (data, token) => api.post('/api/advanced-export', data, { headers: { Authorization: `Bearer ${token}` } });
export const getExportStatus = async (token) => api.get('/api/advanced-export/status', { headers: { Authorization: `Bearer ${token}` } });
