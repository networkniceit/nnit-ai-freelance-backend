// mobile/AdvancedTaskExport.js
// React Native API for advanced task export feature
import axios from 'axios';
const API_URL = 'https://your-api-url.com/api/task-export/advanced';
export const startAdvancedTaskExport = async (data, token) => axios.post(`${API_URL}`, data, { headers: { Authorization: `Bearer ${token}` } });
export const getAdvancedTaskExportStatus = async (token) => axios.get(`${API_URL}/status`, { headers: { Authorization: `Bearer ${token}` } });
