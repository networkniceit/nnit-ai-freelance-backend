// frontend/roleBasedAccess.js
// Web API for role-based access control feature
import api, { apiRequest, notificationsAPI } from './api';

export const createRole = async (data, token) => api.post('/api/roles', data, { headers: { Authorization: `Bearer ${token}` } });
export const getRoles = async (token) => api.get('/api/roles', { headers: { Authorization: `Bearer ${token}` } });
export const updateRole = async (id, data, token) => api.put(`/api/roles/${id}`, data, { headers: { Authorization: `Bearer ${token}` } });
export const deleteRole = async (id, token) => api.delete(`/api/roles/${id}`, { headers: { Authorization: `Bearer ${token}` } });
