// mobile/Auth.js
import axios from 'axios';
const API_URL = 'https://your-api-url.com/api/auth';
export const login = async (credentials) => axios.post(`${API_URL}/login`, credentials);
export const register = async (data) => axios.post(`${API_URL}/register`, data);
export const refreshToken = async (token) => axios.post(`${API_URL}/refresh`, {}, { headers: { Authorization: `Bearer ${token}` } });
