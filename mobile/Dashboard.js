// mobile/Dashboard.js
import axios from 'axios';
const API_URL = 'https://your-api-url.com/api/dashboard';
export const getDashboardData = async (token) => axios.get(`${API_URL}`, { headers: { Authorization: `Bearer ${token}` } });
