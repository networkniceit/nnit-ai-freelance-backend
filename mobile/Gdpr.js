// mobile/Gdpr.js
import axios from 'axios';
const API_URL = 'https://your-api-url.com/api/gdpr';
export const requestDataExport = async (token) => axios.post(`${API_URL}/export`, {}, { headers: { Authorization: `Bearer ${token}` } });
export const requestDataDelete = async (token) => axios.post(`${API_URL}/delete`, {}, { headers: { Authorization: `Bearer ${token}` } });
