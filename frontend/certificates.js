// frontend/certificates.js
// React API calls for certificate management (issue, view, verify)
import api, { apiRequest, notificationsAPI } from './api'; // Your axios instance

export async function issueCertificate(data, token) {
    try {
        const response = await api.post('/api/certificates/issue', data, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : error;
    }
}

export async function getCertificates(userId, token) {
    try {
        const response = await api.get(`/api/certificates/${userId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data.certs;
    } catch (error) {
        throw error.response ? error.response.data : error;
    }
}

export async function verifyCertificate(certId) {
    try {
        const response = await api.get(`/api/certificates/verify/${certId}`);
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : error;
    }
}

// Usage in a React component:
// import { issueCertificate, getCertificates, verifyCertificate } from './certificates';
// await issueCertificate({ user_id, type, issued_by, valid_from, valid_to }, token);
// const certs = await getCertificates(userId, token);
// const result = await verifyCertificate(certId);
