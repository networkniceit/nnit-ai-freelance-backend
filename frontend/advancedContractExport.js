// frontend/advancedContractExport.js
// Web API for advanced contract export feature
import api, { apiRequest, notificationsAPI } from './api';

export const startAdvancedContractExport = async (data, token) => api.post('/api/contracts-export/advanced', data, { headers: { Authorization: `Bearer ${token}` } });
export const getAdvancedContractExportStatus = async (token) => api.get('/api/contracts-export/advanced/status', { headers: { Authorization: `Bearer ${token}` } });
