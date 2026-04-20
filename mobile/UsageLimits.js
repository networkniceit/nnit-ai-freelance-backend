// mobile/UsageLimits.js
// React Native API for usage limits & quotas feature
import axios from 'axios';
const API_URL = 'https://your-api-url.com/api/usage-limits';
export const setUsageLimit = async (data, token) => axios.post(`${API_URL}`, data, { headers: { Authorization: `Bearer ${token}` } });
export const getUsageLimits = async (token) => axios.get(`${API_URL}`, { headers: { Authorization: `Bearer ${token}` } });
