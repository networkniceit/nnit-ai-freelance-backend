// frontend/advancedMilestoneExport.js
// Web API for advanced milestone export feature
import api, { apiRequest, notificationsAPI } from './api';

export const startAdvancedMilestoneExport = async (data, token) => api.post('/api/milestone-export/advanced', data, { headers: { Authorization: `Bearer ${token}` } });
export const getAdvancedMilestoneExportStatus = async (token) => api.get('/api/milestone-export/advanced/status', { headers: { Authorization: `Bearer ${token}` } });
