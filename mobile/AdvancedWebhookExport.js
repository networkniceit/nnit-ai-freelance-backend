// mobile/AdvancedWebhookExport.js
// React Native API for advanced webhook export feature
import axios from 'axios';
const API_URL = 'https://your-api-url.com/api/webhook-export/advanced';
export const startAdvancedWebhookExport = async (data, token) => axios.post(`${API_URL}`, data, { headers: { Authorization: `Bearer ${token}` } });
export const getAdvancedWebhookExportStatus = async (token) => axios.get(`${API_URL}/status`, { headers: { Authorization: `Bearer ${token}` } });
