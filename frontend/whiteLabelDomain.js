// frontend/whiteLabelDomain.js
// Web API for custom white-label domain feature
import api, { apiRequest, notificationsAPI } from './api';

export const saveCustomDomain = async (data, token) => api.post('/api/white-label-domain', data, { headers: { Authorization: `Bearer ${token}` } });
export const getCustomDomain = async (token) => api.get('/api/white-label-domain', { headers: { Authorization: `Bearer ${token}` } });
