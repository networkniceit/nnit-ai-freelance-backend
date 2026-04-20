// frontend/advancedJobsExport.js
// Web API for advanced jobs export feature
import api, { apiRequest, notificationsAPI } from './api';

export const startAdvancedJobsExport = async (data, token) => api.post('/api/jobs-export/advanced', data, { headers: { Authorization: `Bearer ${token}` } });
export const getAdvancedJobsExportStatus = async (token) => api.get('/api/jobs-export/advanced/status', { headers: { Authorization: `Bearer ${token}` } });
