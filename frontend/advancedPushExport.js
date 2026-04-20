// frontend/advancedPushExport.js
// Web API for advanced push notification export feature
import api from './api';

export const startAdvancedPushExport = async (data, token) => api.post('/api/push-export/advanced', data, { headers: { Authorization: `Bearer ${token}` } });
export const getAdvancedPushExportStatus = async (token) => api.get('/api/push-export/advanced/status', { headers: { Authorization: `Bearer ${token}` } });
