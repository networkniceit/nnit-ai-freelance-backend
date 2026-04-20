// frontend/branding.js
// Web API for custom branding feature
import api, { apiRequest, notificationsAPI } from './api';

export const saveBranding = async (data, token) => api.post('/api/branding', data, { headers: { Authorization: `Bearer ${token}` } });
export const getBranding = async (token) => api.get('/api/branding', { headers: { Authorization: `Bearer ${token}` } });
