// frontend/webhooks.js
// React API calls for webhooks (admin only)
import api, { apiRequest, notificationsAPI } from './api'; // Your axios instance

export async function registerWebhook({ url, event }, token) {
    try {
        const response = await api.post('/api/webhooks', { url, event }, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : error;
    }
}

export async function getWebhooks(token) {
    try {
        const response = await api.get('/api/webhooks', {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data.webhooks;
    } catch (error) {
        throw error.response ? error.response.data : error;
    }
}

// Usage in a React component (admin only):
// import { registerWebhook, getWebhooks } from './webhooks';
// await registerWebhook({ url, event }, token);
// const webhooks = await getWebhooks(token);
