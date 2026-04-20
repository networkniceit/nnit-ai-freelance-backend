// mobile/Mfa.js
import axios from 'axios';
const API_URL = 'https://your-api-url.com/api/mfa';
export const enableMfa = async (token) => axios.post(`${API_URL}/enable`, {}, { headers: { Authorization: `Bearer ${token}` } });
export const disableMfa = async (token) => axios.post(`${API_URL}/disable`, {}, { headers: { Authorization: `Bearer ${token}` } });
export const verifyMfa = async (code, token) => axios.post(`${API_URL}/verify`, { code }, { headers: { Authorization: `Bearer ${token}` } });
