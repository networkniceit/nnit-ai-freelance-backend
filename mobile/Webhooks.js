// mobile/Webhooks.js
import axios from 'axios';
const API_URL = 'https://your-api-url.com/api/webhooks';
export const getWebhooks = async (token) => axios.get(`${API_URL}`, { headers: { Authorization: `Bearer ${token}` } });
export const createWebhook = async (data, token) => axios.post(`${API_URL}`, data, { headers: { Authorization: `Bearer ${token}` } });
export const deleteWebhook = async (id, token) => axios.delete(`${API_URL}/${id}`, { headers: { Authorization: `Bearer ${token}` } });
