// frontend/advancedObjectiveExport.js
// Web API for advanced objective export feature
import api, { apiRequest, notificationsAPI } from './api';

export const startAdvancedObjectiveExport = async (data, token) => api.post('/api/objective-export/advanced', data, { headers: { Authorization: `Bearer ${token}` } });
export const getAdvancedObjectiveExportStatus = async (token) => api.get('/api/objective-export/advanced/status', { headers: { Authorization: `Bearer ${token}` } });
