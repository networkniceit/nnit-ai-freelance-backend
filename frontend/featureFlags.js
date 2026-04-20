// frontend/featureFlags.js
// Web API for feature flags feature
import api, { apiRequest, notificationsAPI } from './api';

export const saveFeatureFlag = async (data, token) => api.post('/api/feature-flags', data, { headers: { Authorization: `Bearer ${token}` } });
export const getFeatureFlags = async (token) => api.get('/api/feature-flags', { headers: { Authorization: `Bearer ${token}` } });
export const deleteFeatureFlag = async (key, token) => api.delete(`/api/feature-flags/${key}`, { headers: { Authorization: `Bearer ${token}` } });
