// mobile/AdvancedTimeExport.js
// React Native API for advanced time export feature
import axios from 'axios';
const API_URL = 'https://your-api-url.com/api/time-export/advanced';
export const startAdvancedTimeExport = async (data, token) => axios.post(`${API_URL}`, data, { headers: { Authorization: `Bearer ${token}` } });
export const getAdvancedTimeExportStatus = async (token) => axios.get(`${API_URL}/status`, { headers: { Authorization: `Bearer ${token}` } });
