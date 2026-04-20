// mobile/AdvancedUserExport.js
// React Native API for advanced user export feature
import axios from 'axios';
const API_URL = 'https://your-api-url.com/api/users-export/advanced';
export const startAdvancedUserExport = async (data, token) => axios.post(`${API_URL}`, data, { headers: { Authorization: `Bearer ${token}` } });
export const getAdvancedUserExportStatus = async (token) => axios.get(`${API_URL}/status`, { headers: { Authorization: `Bearer ${token}` } });
