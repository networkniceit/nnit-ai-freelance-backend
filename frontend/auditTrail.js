// frontend/auditTrail.js
// React API call for admin audit trail logs
import api, { apiRequest, notificationsAPI } from './api';

export async function getAuditTrailLogs(token) {
    try {
        const response = await api.get('/api/admin/audit-logs', {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data.logs;
    } catch (error) {
        throw error.response ? error.response.data : error;
    }
}

// Usage in a React component (admin only):
// import { getAuditTrailLogs } from './auditTrail';
// const logs = await getAuditTrailLogs(token);
