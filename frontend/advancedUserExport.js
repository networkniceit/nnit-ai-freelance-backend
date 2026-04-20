// frontend/advancedUserExport.js
// Web API for advanced user export feature
import api, { apiRequest, notificationsAPI } from './api';

export const startAdvancedUserExport = async (data, token) => api.post('/api/users-export/advanced', data, { headers: { Authorization: `Bearer ${token}` } });
export const getAdvancedUserExportStatus = async (token) => api.get('/api/users-export/advanced/status', { headers: { Authorization: `Bearer ${token}` } });
