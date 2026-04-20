// mobile/AdvancedSurveyExport.js
// React Native API for advanced survey export feature
import axios from 'axios';
const API_URL = 'https://your-api-url.com/api/survey-export/advanced';
export const startAdvancedSurveyExport = async (data, token) => axios.post(`${API_URL}`, data, { headers: { Authorization: `Bearer ${token}` } });
export const getAdvancedSurveyExportStatus = async (token) => axios.get(`${API_URL}/status`, { headers: { Authorization: `Bearer ${token}` } });
