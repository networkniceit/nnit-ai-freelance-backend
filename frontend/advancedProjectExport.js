// frontend/advancedProjectExport.js
// Web API for advanced project export feature
import api, { apiRequest, notificationsAPI } from './api';

export const startAdvancedProjectExport = async (data, token) => api.post('/api/projects-export/advanced', data, { headers: { Authorization: `Bearer ${token}` } });
export const getAdvancedProjectExportStatus = async (token) => api.get('/api/projects-export/advanced/status', { headers: { Authorization: `Bearer ${token}` } });
