// mobile/AdvancedCertificatesExport.js
// React Native API for advanced certificates export feature
import axios from 'axios';
const API_URL = 'https://your-api-url.com/api/certificates-export/advanced';
export const startAdvancedCertificatesExport = async (data, token) => axios.post(`${API_URL}`, data, { headers: { Authorization: `Bearer ${token}` } });
export const getAdvancedCertificatesExportStatus = async (token) => axios.get(`${API_URL}/status`, { headers: { Authorization: `Bearer ${token}` } });
