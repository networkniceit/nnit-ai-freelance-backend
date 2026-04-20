// mobile/AdvancedScheduling.js
// React Native API for advanced scheduling feature
import axios from 'axios';
const API_URL = 'https://your-api-url.com/api/advanced-scheduling';
export const createScheduledJob = async (data, token) => axios.post(`${API_URL}`, data, { headers: { Authorization: `Bearer ${token}` } });
export const getScheduledJobs = async (token) => axios.get(`${API_URL}`, { headers: { Authorization: `Bearer ${token}` } });
export const deleteScheduledJob = async (id, token) => axios.delete(`${API_URL}/${id}`, { headers: { Authorization: `Bearer ${token}` } });
