// frontend/advancedKPIExport.js
// Web API for advanced KPI export feature
import api, { apiRequest, notificationsAPI } from './api';

export const startAdvancedKPIExport = async (data, token) => api.post('/api/kpi-export/advanced', data, { headers: { Authorization: `Bearer ${token}` } });
export const getAdvancedKPIExportStatus = async (token) => api.get('/api/kpi-export/advanced/status', { headers: { Authorization: `Bearer ${token}` } });
