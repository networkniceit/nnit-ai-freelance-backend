// frontend/advancedConsentExport.js
// Web API for advanced consent export feature
import api, { apiRequest, notificationsAPI } from './api';

export const startAdvancedConsentExport = async (data, token) => api.post('/api/consent-export/advanced', data, { headers: { Authorization: `Bearer ${token}` } });
export const getAdvancedConsentExportStatus = async (token) => api.get('/api/consent-export/advanced/status', { headers: { Authorization: `Bearer ${token}` } });
