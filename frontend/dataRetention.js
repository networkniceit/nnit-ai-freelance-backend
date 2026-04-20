// frontend/dataRetention.js
// Web API for data retention policies feature
import api, { apiRequest, notificationsAPI } from './api';

export const setDataRetentionPolicy = async (data, token) => api.post('/api/data-retention', data, { headers: { Authorization: `Bearer ${token}` } });
export const getDataRetentionPolicy = async (token) => api.get('/api/data-retention', { headers: { Authorization: `Bearer ${token}` } });
