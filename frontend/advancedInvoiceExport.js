// frontend/advancedInvoiceExport.js
// Web API for advanced invoice export feature
import api, { apiRequest, notificationsAPI } from './api';

export const startAdvancedInvoiceExport = async (data, token) => api.post('/api/invoices-export/advanced', data, { headers: { Authorization: `Bearer ${token}` } });
export const getAdvancedInvoiceExportStatus = async (token) => api.get('/api/invoices-export/advanced/status', { headers: { Authorization: `Bearer ${token}` } });
