// mobile/AdvancedGDPRExport.js
// React Native API for advanced GDPR export feature
import axios from 'axios';
const API_URL = 'https://your-api-url.com/api/gdpr-export/advanced';
export const startAdvancedGDPRExport = async (data, token) => axios.post(`${API_URL}`, data, { headers: { Authorization: `Bearer ${token}` } });
export const getAdvancedGDPRExportStatus = async (token) => axios.get(`${API_URL}/status`, { headers: { Authorization: `Bearer ${token}` } });
