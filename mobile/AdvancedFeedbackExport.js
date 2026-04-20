// mobile/AdvancedFeedbackExport.js
// React Native API for advanced feedback export feature
import axios from 'axios';
const API_URL = 'https://your-api-url.com/api/feedback-export/advanced';
export const startAdvancedFeedbackExport = async (data, token) => axios.post(`${API_URL}`, data, { headers: { Authorization: `Bearer ${token}` } });
export const getAdvancedFeedbackExportStatus = async (token) => axios.get(`${API_URL}/status`, { headers: { Authorization: `Bearer ${token}` } });
