// mobile/ThirdPartyIntegrations.js
// React Native API for third-party integrations feature
import axios from 'axios';
const API_URL = 'https://your-api-url.com/api/integrations';
export const addIntegration = async (data, token) => axios.post(`${API_URL}`, data, { headers: { Authorization: `Bearer ${token}` } });
export const getIntegrations = async (token) => axios.get(`${API_URL}`, { headers: { Authorization: `Bearer ${token}` } });
export const removeIntegration = async (id, token) => axios.delete(`${API_URL}/${id}`, { headers: { Authorization: `Bearer ${token}` } });
