// mobile/ApiKeys.js
import axios from 'axios';
const API_URL = 'https://your-api-url.com/api/api-keys';
export const getApiKeys = async (token) => axios.get(`${API_URL}`, { headers: { Authorization: `Bearer ${token}` } });
export const createApiKey = async (data, token) => axios.post(`${API_URL}`, data, { headers: { Authorization: `Bearer ${token}` } });
export const deleteApiKey = async (id, token) => axios.delete(`${API_URL}/${id}`, { headers: { Authorization: `Bearer ${token}` } });
