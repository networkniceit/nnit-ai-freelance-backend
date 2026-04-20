// mobile/Scheduler.js
import axios from 'axios';
const API_URL = 'https://your-api-url.com/api/scheduler';
export const getScheduledJobs = async (token) => axios.get(`${API_URL}`, { headers: { Authorization: `Bearer ${token}` } });
export const scheduleJob = async (data, token) => axios.post(`${API_URL}`, data, { headers: { Authorization: `Bearer ${token}` } });
