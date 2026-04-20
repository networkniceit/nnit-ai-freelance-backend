// frontend/advancedSurveyExport.js
// Web API for advanced survey export feature
import api, { apiRequest, notificationsAPI } from './api';

export const startAdvancedSurveyExport = async (data, token) => api.post('/api/survey-export/advanced', data, { headers: { Authorization: `Bearer ${token}` } });
export const getAdvancedSurveyExportStatus = async (token) => api.get('/api/survey-export/advanced/status', { headers: { Authorization: `Bearer ${token}` } });
