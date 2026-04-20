// mobile/AdvancedGoalExport.js
// React Native API for advanced goal export feature
import axios from 'axios';
const API_URL = 'https://your-api-url.com/api/goal-export/advanced';
export const startAdvancedGoalExport = async (data, token) => axios.post(`${API_URL}`, data, { headers: { Authorization: `Bearer ${token}` } });
export const getAdvancedGoalExportStatus = async (token) => axios.get(`${API_URL}/status`, { headers: { Authorization: `Bearer ${token}` } });
