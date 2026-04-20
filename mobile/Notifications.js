// mobile/Notifications.js
import axios from 'axios';
const API_URL = 'https://your-api-url.com/api/notifications';
export const getNotifications = async (token) => axios.get(`${API_URL}`, { headers: { Authorization: `Bearer ${token}` } });
export const markAsRead = async (id, token) => axios.post(`${API_URL}/${id}/read`, {}, { headers: { Authorization: `Bearer ${token}` } });
