// mobile/DataRetention.js
// React Native API for data retention policies feature
import axios from 'axios';
const API_URL = 'https://your-api-url.com/api/data-retention';
export const setDataRetentionPolicy = async (data, token) => axios.post(`${API_URL}`, data, { headers: { Authorization: `Bearer ${token}` } });
export const getDataRetentionPolicy = async (token) => axios.get(`${API_URL}`, { headers: { Authorization: `Bearer ${token}` } });
