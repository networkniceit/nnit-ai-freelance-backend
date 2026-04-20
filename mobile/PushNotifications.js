// mobile/PushNotifications.js
import axios from 'axios';
const API_URL = 'https://your-api-url.com/api/push-notifications';
export const subscribePush = async (data, token) => axios.post(`${API_URL}/subscribe`, data, { headers: { Authorization: `Bearer ${token}` } });
export const unsubscribePush = async (data, token) => axios.post(`${API_URL}/unsubscribe`, data, { headers: { Authorization: `Bearer ${token}` } });
