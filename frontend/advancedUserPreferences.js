// frontend/advancedUserPreferences.js
// Web API for advanced user preferences feature
import api, { apiRequest, notificationsAPI } from './api';

export const saveUserPreferences = async (data, token) => api.post('/api/user-preferences', data, { headers: { Authorization: `Bearer ${token}` } });
export const getUserPreferences = async (token) => api.get('/api/user-preferences', { headers: { Authorization: `Bearer ${token}` } });
