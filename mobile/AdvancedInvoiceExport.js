// mobile/AdvancedInvoiceExport.js
// React Native API for advanced invoice export feature
import axios from 'axios';
const API_URL = 'https://your-api-url.com/api/invoices-export/advanced';
export const startAdvancedInvoiceExport = async (data, token) => axios.post(`${API_URL}`, data, { headers: { Authorization: `Bearer ${token}` } });
export const getAdvancedInvoiceExportStatus = async (token) => axios.get(`${API_URL}/status`, { headers: { Authorization: `Bearer ${token}` } });
