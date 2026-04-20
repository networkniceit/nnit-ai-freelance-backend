// mobile/AdvancedKPIExport.js
// React Native API for advanced KPI export feature
import axios from 'axios';
const API_URL = 'https://your-api-url.com/api/kpi-export/advanced';
export const startAdvancedKPIExport = async (data, token) => axios.post(`${API_URL}`, data, { headers: { Authorization: `Bearer ${token}` } });
export const getAdvancedKPIExportStatus = async (token) => axios.get(`${API_URL}/status`, { headers: { Authorization: `Bearer ${token}` } });
