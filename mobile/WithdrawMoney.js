// mobile/WithdrawMoney.js
import axios from 'axios';
const API_URL = 'https://your-api-url.com/api/payments';
export const withdrawMoney = async (data, token) => axios.post(`${API_URL}/withdraw`, data, { headers: { Authorization: `Bearer ${token}` } });
