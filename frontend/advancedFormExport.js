// frontend/advancedFormExport.js
// Web API for advanced form export feature
import api, { apiRequest, notificationsAPI } from './api';

export const startAdvancedFormExport = async (data, token) => api.post('/api/form-export/advanced', data, { headers: { Authorization: `Bearer ${token}` } });
export const getAdvancedFormExportStatus = async (token) => api.get('/api/form-export/advanced/status', { headers: { Authorization: `Bearer ${token}` } });
