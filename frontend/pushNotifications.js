// frontend/pushNotifications.js
// React API calls for mobile push notifications (FCM)
import api, { apiRequest, notificationsAPI } from './api';

export async function registerFcmToken(fcmToken, token) {
    try {
        const response = await api.post('/api/push/register', { fcmToken }, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : error;
    }
}

export async function sendPushNotification({ userId, title, body }, token) {
    try {
        const response = await api.post('/api/push/send', { userId, title, body }, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : error;
    }
}

// Usage in a React component:
// import { registerFcmToken, sendPushNotification } from './pushNotifications';
// await registerFcmToken(fcmToken, token);
// await sendPushNotification({ userId, title, body }, token);
