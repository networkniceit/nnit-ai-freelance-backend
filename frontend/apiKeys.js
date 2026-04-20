// frontend/apiKeys.js
// React API calls for API key management
import api, { apiRequest, notificationsAPI } from './api';

export async function createApiKey(label, token) {
    try {
        const response = await api.post('/api/api-keys', { label }, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data.apiKey;
    } catch (error) {
        throw error.response ? error.response.data : error;
    }
}

export async function listApiKeys(token) {
    try {
        const response = await api.get('/api/api-keys', {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data.apiKeys;
    } catch (error) {
        throw error.response ? error.response.data : error;
    }
}

export async function revokeApiKey(keyId, token) {
    try {
        const response = await api.delete(`/api/api-keys/${keyId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : error;
    }
}

// Usage in a React component:
// import { createApiKey, listApiKeys, revokeApiKey } from './apiKeys';
// await createApiKey('My Integration', token);
// const keys = await listApiKeys(token);
// await revokeApiKey(keyId, token);
