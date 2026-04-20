// frontend/advancedChecklistExport.js
// Web API for advanced checklist export feature
import api, { apiRequest, notificationsAPI } from './api';

export const startAdvancedChecklistExport = async (data, token) => api.post('/api/checklist-export/advanced', data, { headers: { Authorization: `Bearer ${token}` } });
export const getAdvancedChecklistExportStatus = async (token) => api.get('/api/checklist-export/advanced/status', { headers: { Authorization: `Bearer ${token}` } });
