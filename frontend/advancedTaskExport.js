// frontend/advancedTaskExport.js
// Web API for advanced task export feature
import api, { apiRequest, notificationsAPI } from './api';

export const startAdvancedTaskExport = async (data, token) => api.post('/api/task-export/advanced', data, { headers: { Authorization: `Bearer ${token}` } });
export const getAdvancedTaskExportStatus = async (token) => api.get('/api/task-export/advanced/status', { headers: { Authorization: `Bearer ${token}` } });
