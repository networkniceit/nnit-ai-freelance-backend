// mobile/WhiteLabelDomain.js
// React Native API for custom white-label domain feature
import axios from 'axios';
const API_URL = 'https://your-api-url.com/api/white-label-domain';
export const saveCustomDomain = async (data, token) => axios.post(`${API_URL}`, data, { headers: { Authorization: `Bearer ${token}` } });
export const getCustomDomain = async (token) => axios.get(`${API_URL}`, { headers: { Authorization: `Bearer ${token}` } });
