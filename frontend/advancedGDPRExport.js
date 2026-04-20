// frontend/advancedGDPRExport.js
// Web API for advanced GDPR export feature
import api, { apiRequest, notificationsAPI } from './api';

export const startAdvancedGDPRExport = async (data, token) => api.post('/api/gdpr-export/advanced', data, { headers: { Authorization: `Bearer ${token}` } });
export const getAdvancedGDPRExportStatus = async (token) => api.get('/api/gdpr-export/advanced/status', { headers: { Authorization: `Bearer ${token}` } });
