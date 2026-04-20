// mobile/Analytics.js
import axios from 'axios';
const API_URL = 'https://your-api-url.com/api/analytics';
export const getAnalytics = async (token) => axios.get(`${API_URL}`, { headers: { Authorization: `Bearer ${token}` } });
