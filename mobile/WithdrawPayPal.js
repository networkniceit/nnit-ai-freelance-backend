// mobile/WithdrawPayPal.js
import axios from 'axios';
const API_URL = 'https://your-api-url.com/api/paypal';
export const withdrawPayPal = async (data, token) => axios.post(`${API_URL}/withdraw`, data, { headers: { Authorization: `Bearer ${token}` } });
