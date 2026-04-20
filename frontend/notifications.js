// frontend/notifications.js
// React API calls for notifications (in-app, email)
import api, { apiRequest, notificationsAPI } from './api'; // Your axios instance

export async function sendNotification(data, token) {
    try {
        const response = await api.post('/api/notifications', data, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : error;
    }
}

export async function getNotifications(token) {
    try {
        const response = await api.get('/api/notifications', {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data.notifs;
    } catch (error) {
        throw error.response ? error.response.data : error;
    }
}

export async function sendEmailNotification({ user_id, subject, message, email }, token) {
    try {
        const response = await api.post('/api/notifications/email', { user_id, subject, message, email }, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : error;
    }
}

// Usage in a React component:
// import { sendNotification, getNotifications, sendEmailNotification } from './notifications';
// await sendNotification({ user_id, type: 'in-app', message }, token);
// const notifs = await getNotifications(token);
// await sendEmailNotification({ user_id, subject, message, email }, token);
