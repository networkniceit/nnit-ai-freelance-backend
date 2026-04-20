// mobile/Reports.js
import axios from 'axios';
const API_URL = 'https://your-api-url.com/api/reports';
export const getReports = async (token) => axios.get(`${API_URL}`, { headers: { Authorization: `Bearer ${token}` } });
export const downloadReport = async (id, token) => axios.get(`${API_URL}/${id}/download`, { headers: { Authorization: `Bearer ${token}` }, responseType: 'blob' });
