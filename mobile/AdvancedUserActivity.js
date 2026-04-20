// mobile/AdvancedUserActivity.js
// React Native API for advanced user activity tracking feature
import axios from 'axios';
const API_URL = 'https://your-api-url.com/api/user-activity';
export const logUserActivity = async (data, token) => axios.post(`${API_URL}`, data, { headers: { Authorization: `Bearer ${token}` } });
export const getUserActivities = async (token) => axios.get(`${API_URL}`, { headers: { Authorization: `Bearer ${token}` } });
