// mobile/Recommendation.js
import axios from 'axios';
const API_URL = 'https://your-api-url.com/api/recommendation';
export const getRecommendations = async (token) => axios.get(`${API_URL}`, { headers: { Authorization: `Bearer ${token}` } });
