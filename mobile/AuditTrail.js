// mobile/AuditTrail.js
import axios from 'axios';
const API_URL = 'https://your-api-url.com/api/audit-trail';
export const getAuditTrail = async (token) => axios.get(`${API_URL}`, { headers: { Authorization: `Bearer ${token}` } });
