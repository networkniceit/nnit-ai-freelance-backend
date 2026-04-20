// frontend/multiTenant.js
// Web API for multi-tenant feature
import api, { apiRequest, notificationsAPI } from './api';

export const createTenant = async (data, token) => api.post('/api/tenants', data, { headers: { Authorization: `Bearer ${token}` } });
export const getTenants = async (token) => api.get('/api/tenants', { headers: { Authorization: `Bearer ${token}` } });
export const updateTenant = async (id, data, token) => api.put(`/api/tenants/${id}`, data, { headers: { Authorization: `Bearer ${token}` } });
export const deleteTenant = async (id, token) => api.delete(`/api/tenants/${id}`, { headers: { Authorization: `Bearer ${token}` } });
