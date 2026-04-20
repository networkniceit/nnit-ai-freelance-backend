// frontend/consentManagement.js
// Web API for consent management feature
import api, { apiRequest, notificationsAPI } from './api';

export const saveConsent = async (data, token) => api.post('/api/consent', data, { headers: { Authorization: `Bearer ${token}` } });
export const getConsent = async (token) => api.get('/api/consent', { headers: { Authorization: `Bearer ${token}` } });
