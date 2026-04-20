// mobile/Jobs.js
import axios from 'axios';
const API_URL = 'https://your-api-url.com/api/jobs';
export const getJobs = async (token) => axios.get(`${API_URL}`, { headers: { Authorization: `Bearer ${token}` } });
export const applyJob = async (jobId, data, token) => axios.post(`${API_URL}/${jobId}/apply`, data, { headers: { Authorization: `Bearer ${token}` } });
