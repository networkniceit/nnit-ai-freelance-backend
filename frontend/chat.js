// frontend/chat.js
// React API calls for chat (REST fallback)
import api, { apiRequest, notificationsAPI } from './api'; // Your axios instance

export async function getChatHistory(userId, token) {
    try {
        const response = await api.get(`/api/chat/${userId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data.messages;
    } catch (error) {
        throw error.response ? error.response.data : error;
    }
}

export async function sendMessage(userId, text, token) {
    try {
        const response = await api.post(`/api/chat/${userId}`, { text }, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data.message;
    } catch (error) {
        throw error.response ? error.response.data : error;
    }
}

// Usage in a React component:
// import { getChatHistory, sendMessage } from './chat';
// const messages = await getChatHistory(otherUserId, token);
// await sendMessage(otherUserId, 'Hello!', token);
