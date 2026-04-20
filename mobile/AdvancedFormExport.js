// mobile/AdvancedFormExport.js
// React Native API for advanced form export feature
import axios from 'axios';
const API_URL = 'https://your-api-url.com/api/form-export/advanced';
export const startAdvancedFormExport = async (data, token) => axios.post(`${API_URL}`, data, { headers: { Authorization: `Bearer ${token}` } });
export const getAdvancedFormExportStatus = async (token) => axios.get(`${API_URL}/status`, { headers: { Authorization: `Bearer ${token}` } });
