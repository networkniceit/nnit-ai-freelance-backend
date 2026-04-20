// frontend/aiAssistance.js
// Web API for AI assistance feature
import api, { apiRequest, notificationsAPI } from './api';

export const aiAssist = async (data, token) => api.post('/api/ai/assist', data, { headers: { Authorization: `Bearer ${token}` } });
