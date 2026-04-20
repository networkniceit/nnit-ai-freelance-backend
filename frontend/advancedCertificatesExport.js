// frontend/advancedCertificatesExport.js
// Web API for advanced certificates export feature
import api, { apiRequest, notificationsAPI } from './api';

export const startAdvancedCertificatesExport = async (data, token) => api.post('/api/certificates-export/advanced', data, { headers: { Authorization: `Bearer ${token}` } });
export const getAdvancedCertificatesExportStatus = async (token) => api.get('/api/certificates-export/advanced/status', { headers: { Authorization: `Bearer ${token}` } });
