// mobile/AdvancedScorecardExport.js
// React Native API for advanced scorecard export feature
import axios from 'axios';
const API_URL = 'https://your-api-url.com/api/scorecard-export/advanced';
export const startAdvancedScorecardExport = async (data, token) => axios.post(`${API_URL}`, data, { headers: { Authorization: `Bearer ${token}` } });
export const getAdvancedScorecardExportStatus = async (token) => axios.get(`${API_URL}/status`, { headers: { Authorization: `Bearer ${token}` } });
