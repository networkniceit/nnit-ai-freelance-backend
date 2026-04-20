// frontend/advancedGoalExport.js
// Web API for advanced goal export feature
import api, { apiRequest, notificationsAPI } from './api';

export const startAdvancedGoalExport = async (data, token) => api.post('/api/goal-export/advanced', data, { headers: { Authorization: `Bearer ${token}` } });
export const getAdvancedGoalExportStatus = async (token) => api.get('/api/goal-export/advanced/status', { headers: { Authorization: `Bearer ${token}` } });
