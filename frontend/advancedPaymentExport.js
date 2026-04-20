// frontend/advancedPaymentExport.js
// Web API for advanced payment export feature
import api, { apiRequest, notificationsAPI } from './api';

export const startAdvancedPaymentExport = async (data, token) => api.post('/api/payments-export/advanced', data, { headers: { Authorization: `Bearer ${token}` } });
export const getAdvancedPaymentExportStatus = async (token) => api.get('/api/payments-export/advanced/status', { headers: { Authorization: `Bearer ${token}` } });
