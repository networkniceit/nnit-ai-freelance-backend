// mobile/AdvancedContractExport.js
// React Native API for advanced contract export feature
import axios from 'axios';
const API_URL = 'https://your-api-url.com/api/contracts-export/advanced';
export const startAdvancedContractExport = async (data, token) => axios.post(`${API_URL}`, data, { headers: { Authorization: `Bearer ${token}` } });
export const getAdvancedContractExportStatus = async (token) => axios.get(`${API_URL}/status`, { headers: { Authorization: `Bearer ${token}` } });
