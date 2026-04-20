// mobile/Certificates.js
import axios from 'axios';
const API_URL = 'https://your-api-url.com/api/certificates';
export const getCertificates = async (token) => axios.get(`${API_URL}`, { headers: { Authorization: `Bearer ${token}` } });
export const addCertificate = async (data, token) => axios.post(`${API_URL}`, data, { headers: { Authorization: `Bearer ${token}` } });
