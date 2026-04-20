// mobile/AdvancedPushExport.js
// React Native API for advanced push notification export feature
import axios from 'axios';
const API_URL = 'https://your-api-url.com/api/push-export/advanced';
export const startAdvancedPushExport = async (data, token) => axios.post(`${API_URL}`, data, { headers: { Authorization: `Bearer ${token}` } });
export const getAdvancedPushExportStatus = async (token) => axios.get(`${API_URL}/status`, { headers: { Authorization: `Bearer ${token}` } });
