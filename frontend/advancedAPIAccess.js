// frontend/advancedAPIAccess.js
// Web API for advanced API access management feature
import api, { apiRequest, notificationsAPI } from './api';

export const createApiKey = async (data, token) => api.post('/api/advanced-api-access/key', data, { headers: { Authorization: `Bearer ${token}` } });
export const getApiKeys = async (token) => api.get('/api/advanced-api-access/keys', { headers: { Authorization: `Bearer ${token}` } });
export const deleteApiKey = async (id, token) => api.delete(`/api/advanced-api-access/key/${id}`, { headers: { Authorization: `Bearer ${token}` } });
