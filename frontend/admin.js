// frontend/admin.js
// React API calls for admin features (user management, audit logs)
import api, { apiRequest, notificationsAPI } from './api'; // Your axios instance

export async function getAllUsers(token) {
    try {
        const response = await api.get('/api/admin/users', {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data.users;
    } catch (error) {
        throw error.response ? error.response.data : error;
    }
}

export async function updateUserRole(userId, role, token) {
    try {
        const response = await api.put(`/api/admin/users/${userId}/role`, { role }, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : error;
    }
}

export async function getAuditLogs(token) {
    try {
        const response = await api.get('/api/admin/audit-logs', {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data.logs;
    } catch (error) {
        throw error.response ? error.response.data : error;
    }
}

// Usage in a React component:
// import { getAllUsers, updateUserRole, getAuditLogs } from './admin';
// const users = await getAllUsers(token);
// await updateUserRole(userId, 'admin', token);
// const logs = await getAuditLogs(token);
