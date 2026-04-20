// mobile/AdvancedNotificationsExport.js
// React Native API for advanced notifications export feature
import axios from 'axios';
const API_URL = 'https://your-api-url.com/api/notifications-export/advanced';
export const startAdvancedNotificationsExport = async (data, token) => axios.post(`${API_URL}`, data, { headers: { Authorization: `Bearer ${token}` } });
export const getAdvancedNotificationsExportStatus = async (token) => axios.get(`${API_URL}/status`, { headers: { Authorization: `Bearer ${token}` } });
