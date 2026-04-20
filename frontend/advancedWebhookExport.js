// frontend/advancedWebhookExport.js
// Web API for advanced webhook export feature
import api from './api';

export const startAdvancedWebhookExport = async (data, token) => api.post('/api/webhook-export/advanced', data, { headers: { Authorization: `Bearer ${token}` } });
export const getAdvancedWebhookExportStatus = async (token) => api.get('/api/webhook-export/advanced/status', { headers: { Authorization: `Bearer ${token}` } });
