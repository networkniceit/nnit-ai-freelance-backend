// frontend/advancedAudit.js
// Web API for advanced audit feature
import api, { apiRequest, notificationsAPI } from './api';

export const saveAuditLog = async (data, token) => api.post('/api/audit/log', data, { headers: { Authorization: `Bearer ${token}` } });
export const getAuditLogs = async (params, token) => api.get('/api/audit/logs', { params, headers: { Authorization: `Bearer ${token}` } });
