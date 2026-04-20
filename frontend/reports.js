// frontend/reports.js
// React API calls for advanced reporting/export (PDF, CSV)
import api, { apiRequest, notificationsAPI } from './api';

export async function downloadJobsCSV(token) {
    const response = await api.get('/api/reports/jobs/csv', {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
    });
    return response.data;
}

export async function downloadCertificatesCSV(token) {
    const response = await api.get('/api/reports/certificates/csv', {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
    });
    return response.data;
}

export async function downloadJobsPDF(token) {
    const response = await api.get('/api/reports/jobs/pdf', {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
    });
    return response.data;
}

// Usage in a React component:
// import { downloadJobsCSV, downloadCertificatesCSV, downloadJobsPDF } from './reports';
// const csvBlob = await downloadJobsCSV(token);
// const pdfBlob = await downloadJobsPDF(token);
// Use URL.createObjectURL(blob) to trigger download in browser
