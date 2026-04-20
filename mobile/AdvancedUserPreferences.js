// mobile/AdvancedUserPreferences.js
// React Native API for advanced user preferences feature
import axios from 'axios';
const API_URL = 'https://your-api-url.com/api/user-preferences';
export const saveUserPreferences = async (data, token) => axios.post(`${API_URL}`, data, { headers: { Authorization: `Bearer ${token}` } });
export const getUserPreferences = async (token) => axios.get(`${API_URL}`, { headers: { Authorization: `Bearer ${token}` } });
