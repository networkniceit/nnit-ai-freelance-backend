// mobile/ConsentManagement.js
// React Native API for consent management feature
import axios from 'axios';
const API_URL = 'https://your-api-url.com/api/consent';
export const saveConsent = async (data, token) => axios.post(`${API_URL}`, data, { headers: { Authorization: `Bearer ${token}` } });
export const getConsent = async (token) => axios.get(`${API_URL}`, { headers: { Authorization: `Bearer ${token}` } });
