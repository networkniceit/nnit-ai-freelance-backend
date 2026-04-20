// mobile/AuditExport.js
import axios from 'axios';
const API_URL = 'https://your-api-url.com/api/audit-export';
export const exportAudit = async (params, token) => axios.get(`${API_URL}`, { params, headers: { Authorization: `Bearer ${token}` } });
