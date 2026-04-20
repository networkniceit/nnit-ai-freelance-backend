// frontend/mfa.js
// React API calls for Multi-factor Authentication (MFA)
import api, { apiRequest, notificationsAPI } from './api'; // Your axios instance

export async function setupMFA(token) {
    try {
        const response = await api.post('/api/mfa/setup', {}, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data; // { message, secret, qr }
    } catch (error) {
        throw error.response ? error.response.data : error;
    }
}

export async function verifyMFA(token, mfaToken) {
    try {
        const response = await api.post('/api/mfa/verify', { token: mfaToken }, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : error;
    }
}

export async function loginWithMFA({ email, password, mfaToken }) {
    try {
        const response = await api.post('/api/auth/login-mfa', { email, password, token: mfaToken });
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : error;
    }
}

// Usage in a React component:
// import { setupMFA, verifyMFA, loginWithMFA } from './mfa';
// const { qr } = await setupMFA(token);
// await verifyMFA(token, mfaToken);
// const loginResult = await loginWithMFA({ email, password, mfaToken });
