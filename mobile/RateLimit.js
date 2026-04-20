// mobile/RateLimit.js
import axios from 'axios';
const API_URL = 'https://your-api-url.com/api/rate-limit';
export const getRateLimitStatus = async (token) => axios.get(`${API_URL}/status`, { headers: { Authorization: `Bearer ${token}` } });
