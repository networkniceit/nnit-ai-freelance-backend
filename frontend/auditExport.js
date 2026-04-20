// frontend/auditExport.js
// React API calls for audit log export (PDF, CSV)
import api, { apiRequest, notificationsAPI } from './api';

export async function downloadAuditLogsCSV(token) {
    const response = await api.get('/api/admin/audit-logs/csv', {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
    });
    return response.data;
}

export async function downloadAuditLogsPDF(token) {
    const response = await api.get('/api/admin/audit-logs/pdf', {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
    });
    return response.data;
}

// Usage in a React component (admin only):
// import { downloadAuditLogsCSV, downloadAuditLogsPDF } from './auditExport';
// const csvBlob = await downloadAuditLogsCSV(token);
// const pdfBlob = await downloadAuditLogsPDF(token);
// Use URL.createObjectURL(blob) to trigger download in browser
