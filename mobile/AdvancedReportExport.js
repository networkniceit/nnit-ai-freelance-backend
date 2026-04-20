// mobile/AdvancedReportExport.js
// React Native API for advanced report export feature
import axios from 'axios';
const API_URL = 'https://your-api-url.com/api/reports-export/advanced';
export const startAdvancedReportExport = async (data, token) => axios.post(`${API_URL}`, data, { headers: { Authorization: `Bearer ${token}` } });
export const getAdvancedReportExportStatus = async (token) => axios.get(`${API_URL}/status`, { headers: { Authorization: `Bearer ${token}` } });
