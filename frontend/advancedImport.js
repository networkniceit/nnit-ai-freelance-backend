// frontend/advancedImport.js
// Web API for advanced data import feature
import api, { apiRequest, notificationsAPI } from './api';

export const startImport = async (data, token) => api.post('/api/advanced-import', data, { headers: { Authorization: `Bearer ${token}` } });
export const getImportStatus = async (token) => api.get('/api/advanced-import/status', { headers: { Authorization: `Bearer ${token}` } });
