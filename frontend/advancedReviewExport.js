// frontend/advancedReviewExport.js
// Web API for advanced review export feature
import api, { apiRequest, notificationsAPI } from './api';

export const startAdvancedReviewExport = async (data, token) => api.post('/api/review-export/advanced', data, { headers: { Authorization: `Bearer ${token}` } });
export const getAdvancedReviewExportStatus = async (token) => api.get('/api/review-export/advanced/status', { headers: { Authorization: `Bearer ${token}` } });
