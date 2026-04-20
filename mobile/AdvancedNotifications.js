// mobile/AdvancedNotifications.js
// React Native API for advanced notification settings feature
import axios from 'axios';
const API_URL = 'https://your-api-url.com/api/notifications/settings';
export const saveNotificationSettings = async (data, token) => axios.post(`${API_URL}`, data, { headers: { Authorization: `Bearer ${token}` } });
export const getNotificationSettings = async (token) => axios.get(`${API_URL}`, { headers: { Authorization: `Bearer ${token}` } });
