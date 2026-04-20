// frontend/advancedScorecardExport.js
// Web API for advanced scorecard export feature
import api, { apiRequest, notificationsAPI } from './api';

export const startAdvancedScorecardExport = async (data, token) => api.post('/api/scorecard-export/advanced', data, { headers: { Authorization: `Bearer ${token}` } });
export const getAdvancedScorecardExportStatus = async (token) => api.get('/api/scorecard-export/advanced/status', { headers: { Authorization: `Bearer ${token}` } });
