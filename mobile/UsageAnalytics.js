// mobile/UsageAnalytics.js
// React Native API for usage analytics feature
import axios from 'axios';
const API_URL = 'https://your-api-url.com/api/usage-analytics';
export const logUsageEvent = async (data, token) => axios.post(`${API_URL}/event`, data, { headers: { Authorization: `Bearer ${token}` } });
export const getUsageStats = async (params, token) => axios.get(`${API_URL}/stats`, { params, headers: { Authorization: `Bearer ${token}` } });
