// mobile/CrmIntegration.js
import axios from 'axios';
const API_URL = 'https://your-api-url.com/api/crm-integration';
export const syncCrm = async (data, token) => axios.post(`${API_URL}/sync`, data, { headers: { Authorization: `Bearer ${token}` } });
