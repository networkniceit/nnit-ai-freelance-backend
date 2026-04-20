// frontend/advancedDashboardExport.js
// Web API for advanced dashboard export feature
import api, { apiRequest, notificationsAPI } from './api';

export const startAdvancedDashboardExport = async (data, token) => api.post('/api/dashboard-export/advanced', data, { headers: { Authorization: `Bearer ${token}` } });
export const getAdvancedDashboardExportStatus = async (token) => api.get('/api/dashboard-export/advanced/status', { headers: { Authorization: `Bearer ${token}` } });
