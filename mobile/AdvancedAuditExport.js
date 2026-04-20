// mobile/AdvancedAuditExport.js
// React Native API for advanced audit export feature
import axios from 'axios';
const API_URL = 'https://your-api-url.com/api/audit-export/advanced';
export const startAdvancedAuditExport = async (data, token) => axios.post(`${API_URL}`, data, { headers: { Authorization: `Bearer ${token}` } });
export const getAdvancedAuditExportStatus = async (token) => axios.get(`${API_URL}/status`, { headers: { Authorization: `Bearer ${token}` } });
