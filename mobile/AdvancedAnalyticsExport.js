// mobile/AdvancedAnalyticsExport.js
// React Native API for advanced analytics export feature
import axios from 'axios';
const API_URL = 'https://your-api-url.com/api/analytics-export/advanced';
export const startAdvancedAnalyticsExport = async (data, token) => axios.post(`${API_URL}`, data, { headers: { Authorization: `Bearer ${token}` } });
export const getAdvancedAnalyticsExportStatus = async (token) => axios.get(`${API_URL}/status`, { headers: { Authorization: `Bearer ${token}` } });
