// mobile/CustomReports.js
import axios from 'axios';
const API_URL = 'https://your-api-url.com/api/custom-reports';
export const getCustomReports = async (token) => axios.get(`${API_URL}`, { headers: { Authorization: `Bearer ${token}` } });
export const createCustomReport = async (data, token) => axios.post(`${API_URL}`, data, { headers: { Authorization: `Bearer ${token}` } });
