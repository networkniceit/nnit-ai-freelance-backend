// mobile/Impersonate.js
import axios from 'axios';
const API_URL = 'https://your-api-url.com/api/impersonate';
export const impersonateUser = async (userId, token) => axios.post(`${API_URL}/${userId}`, {}, { headers: { Authorization: `Bearer ${token}` } });
