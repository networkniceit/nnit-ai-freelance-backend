// frontend/advancedAuditExport.js
// Web API for advanced audit export feature
import api, { apiRequest, notificationsAPI } from './api';

export const startAdvancedAuditExport = async (data, token) => api.post('/api/audit-export/advanced', data, { headers: { Authorization: `Bearer ${token}` } });
export const getAdvancedAuditExportStatus = async (token) => api.get('/api/audit-export/advanced/status', { headers: { Authorization: `Bearer ${token}` } });
