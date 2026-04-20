// mobile/AdvancedPaymentExport.js
// React Native API for advanced payment export feature
import axios from 'axios';
const API_URL = 'https://your-api-url.com/api/payments-export/advanced';
export const startAdvancedPaymentExport = async (data, token) => axios.post(`${API_URL}`, data, { headers: { Authorization: `Bearer ${token}` } });
export const getAdvancedPaymentExportStatus = async (token) => axios.get(`${API_URL}/status`, { headers: { Authorization: `Bearer ${token}` } });
