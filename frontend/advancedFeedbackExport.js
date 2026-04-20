// frontend/advancedFeedbackExport.js
// Web API for advanced feedback export feature
import api, { apiRequest, notificationsAPI } from './api';

export const startAdvancedFeedbackExport = async (data, token) => api.post('/api/feedback-export/advanced', data, { headers: { Authorization: `Bearer ${token}` } });
export const getAdvancedFeedbackExportStatus = async (token) => api.get('/api/feedback-export/advanced/status', { headers: { Authorization: `Bearer ${token}` } });
