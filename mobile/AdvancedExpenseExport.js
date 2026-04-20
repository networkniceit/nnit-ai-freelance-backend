// mobile/AdvancedExpenseExport.js
// React Native API for advanced expense export feature
import axios from 'axios';
const API_URL = 'https://your-api-url.com/api/expenses-export/advanced';
export const startAdvancedExpenseExport = async (data, token) => axios.post(`${API_URL}`, data, { headers: { Authorization: `Bearer ${token}` } });
export const getAdvancedExpenseExportStatus = async (token) => axios.get(`${API_URL}/status`, { headers: { Authorization: `Bearer ${token}` } });
