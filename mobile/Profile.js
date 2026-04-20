// mobile/Profile.js
import axios from 'axios';
const API_URL = 'https://your-api-url.com/api/profile';
export const getProfile = async (token) => axios.get(`${API_URL}`, { headers: { Authorization: `Bearer ${token}` } });
export const updateProfile = async (data, token) => axios.post(`${API_URL}`, data, { headers: { Authorization: `Bearer ${token}` } });
