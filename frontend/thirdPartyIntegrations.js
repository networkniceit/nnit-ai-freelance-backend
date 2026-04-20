// frontend/thirdPartyIntegrations.js
// Web API for third-party integrations feature
import api, { apiRequest, notificationsAPI } from './api';

export const addIntegration = async (data, token) => api.post('/api/integrations', data, { headers: { Authorization: `Bearer ${token}` } });
export const getIntegrations = async (token) => api.get('/api/integrations', { headers: { Authorization: `Bearer ${token}` } });
export const removeIntegration = async (id, token) => api.delete(`/api/integrations/${id}`, { headers: { Authorization: `Bearer ${token}` } });
