// mobile/Social.js
import axios from 'axios';
const API_URL = 'https://your-api-url.com/api/social';
export const getSocialLinks = async (token) => axios.get(`${API_URL}`, { headers: { Authorization: `Bearer ${token}` } });
export const updateSocialLinks = async (data, token) => axios.post(`${API_URL}`, data, { headers: { Authorization: `Bearer ${token}` } });
