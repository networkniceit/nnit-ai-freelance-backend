// frontend/advancedReportExport.js
// Web API for advanced report export feature
import api, { apiRequest, notificationsAPI } from './api';

export const startAdvancedReportExport = async (data, token) => api.post('/api/reports-export/advanced', data, { headers: { Authorization: `Bearer ${token}` } });
export const getAdvancedReportExportStatus = async (token) => api.get('/api/reports-export/advanced/status', { headers: { Authorization: `Bearer ${token}` } });
