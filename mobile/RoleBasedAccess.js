// mobile/RoleBasedAccess.js
// React Native API for role-based access control feature
import axios from 'axios';
const API_URL = 'https://your-api-url.com/api/roles';
export const createRole = async (data, token) => axios.post(`${API_URL}`, data, { headers: { Authorization: `Bearer ${token}` } });
export const getRoles = async (token) => axios.get(`${API_URL}`, { headers: { Authorization: `Bearer ${token}` } });
export const updateRole = async (id, data, token) => axios.put(`${API_URL}/${id}`, data, { headers: { Authorization: `Bearer ${token}` } });
export const deleteRole = async (id, token) => axios.delete(`${API_URL}/${id}`, { headers: { Authorization: `Bearer ${token}` } });
