// mobile/Organizations.js
import axios from 'axios';
const API_URL = 'https://your-api-url.com/api/organizations';
export const getOrganizations = async (token) => axios.get(`${API_URL}`, { headers: { Authorization: `Bearer ${token}` } });
export const createOrganization = async (data, token) => axios.post(`${API_URL}`, data, { headers: { Authorization: `Bearer ${token}` } });
