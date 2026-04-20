// frontend/advancedWidgetExport.js
// API module for advanced widget export (web)
import api, { apiRequest, notificationsAPI } from './api';

export const startAdvancedWidgetExport = async (filters, format, token) => {
    return api.post('/api/widget-export/advanced', { filters, format }, {
        headers: { Authorization: `Bearer ${token}` }
    });
};

export const getAdvancedWidgetExportStatus = async (exportId, token) => {
    return api.get('/api/widget-export/advanced/status', {
        params: { exportId },
        headers: { Authorization: `Bearer ${token}` }
    });
};
