// mobile/Admin.js
// React Native API for admin feature
import axios from 'axios';
const API_URL = 'https://your-api-url.com/api/admin';
export const getAdminData = async (token) => axios.get(`${API_URL}/data`, { headers: { Authorization: `Bearer ${token}` } });
export const updateAdminData = async (data, token) => axios.post(`${API_URL}/update`, data, { headers: { Authorization: `Bearer ${token}` } });
