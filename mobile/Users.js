// mobile/Users.js
import axios from 'axios';
const API_URL = 'https://your-api-url.com/api/users';
export const getUserInfo = async (token) => axios.get(`${API_URL}/me`, { headers: { Authorization: `Bearer ${token}` } });
export const updateUserInfo = async (data, token) => axios.post(`${API_URL}/me`, data, { headers: { Authorization: `Bearer ${token}` } });
