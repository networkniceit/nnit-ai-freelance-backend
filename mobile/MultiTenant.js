// mobile/MultiTenant.js
// React Native API for multi-tenant feature
import axios from 'axios';
const API_URL = 'https://your-api-url.com/api/tenants';
export const createTenant = async (data, token) => axios.post(`${API_URL}`, data, { headers: { Authorization: `Bearer ${token}` } });
export const getTenants = async (token) => axios.get(`${API_URL}`, { headers: { Authorization: `Bearer ${token}` } });
export const updateTenant = async (id, data, token) => axios.put(`${API_URL}/${id}`, data, { headers: { Authorization: `Bearer ${token}` } });
export const deleteTenant = async (id, token) => axios.delete(`${API_URL}/${id}`, { headers: { Authorization: `Bearer ${token}` } });
