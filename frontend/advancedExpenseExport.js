// frontend/advancedExpenseExport.js
// Web API for advanced expense export feature
import api, { apiRequest, notificationsAPI } from './api';

export const startAdvancedExpenseExport = async (data, token) => api.post('/api/expenses-export/advanced', data, { headers: { Authorization: `Bearer ${token}` } });
export const getAdvancedExpenseExportStatus = async (token) => api.get('/api/expenses-export/advanced/status', { headers: { Authorization: `Bearer ${token}` } });
