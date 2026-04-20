// frontend/gdpr.js
// React API calls for GDPR/CCPA compliance (data export/delete)
import api, { apiRequest, notificationsAPI } from './api';

export async function exportUserData(token, format = 'json') {
    const response = await api.get(`/api/gdpr/export?format=${format}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: format === 'csv' ? 'blob' : 'json',
    });
    return response.data;
}

export async function deleteUserData(token) {
    const response = await api.delete('/api/gdpr/delete', {
        headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
}

// Usage in a React component:
// import { exportUserData, deleteUserData } from './gdpr';
// const data = await exportUserData(token, 'json');
// const csvBlob = await exportUserData(token, 'csv');
// await deleteUserData(token);
