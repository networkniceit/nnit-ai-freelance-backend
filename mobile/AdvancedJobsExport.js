// mobile/AdvancedJobsExport.js
// React Native API for advanced jobs export feature
import axios from 'axios';
const API_URL = 'https://your-api-url.com/api/jobs-export/advanced';
export const startAdvancedJobsExport = async (data, token) => axios.post(`${API_URL}`, data, { headers: { Authorization: `Bearer ${token}` } });
export const getAdvancedJobsExportStatus = async (token) => axios.get(`${API_URL}/status`, { headers: { Authorization: `Bearer ${token}` } });
