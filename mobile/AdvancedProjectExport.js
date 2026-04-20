// mobile/AdvancedProjectExport.js
// React Native API for advanced project export feature
import axios from 'axios';
const API_URL = 'https://your-api-url.com/api/projects-export/advanced';
export const startAdvancedProjectExport = async (data, token) => axios.post(`${API_URL}`, data, { headers: { Authorization: `Bearer ${token}` } });
export const getAdvancedProjectExportStatus = async (token) => axios.get(`${API_URL}/status`, { headers: { Authorization: `Bearer ${token}` } });
