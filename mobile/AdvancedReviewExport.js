// mobile/AdvancedReviewExport.js
// React Native API for advanced review export feature
import axios from 'axios';
const API_URL = 'https://your-api-url.com/api/review-export/advanced';
export const startAdvancedReviewExport = async (data, token) => axios.post(`${API_URL}`, data, { headers: { Authorization: `Bearer ${token}` } });
export const getAdvancedReviewExportStatus = async (token) => axios.get(`${API_URL}/status`, { headers: { Authorization: `Bearer ${token}` } });
