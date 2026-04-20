// mobile/AdvancedAPIAccess.js
// React Native API for advanced API access management feature
import axios from 'axios';
const API_URL = 'https://your-api-url.com/api/advanced-api-access';
export const createApiKey = async (data, token) => axios.post(`${API_URL}/key`, data, { headers: { Authorization: `Bearer ${token}` } });
export const getApiKeys = async (token) => axios.get(`${API_URL}/keys`, { headers: { Authorization: `Bearer ${token}` } });
export const deleteApiKey = async (id, token) => axios.delete(`${API_URL}/key/${id}`, { headers: { Authorization: `Bearer ${token}` } });
