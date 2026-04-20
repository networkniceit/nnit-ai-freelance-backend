// frontend/impersonate.js
// React API call for admin user impersonation
import api, { apiRequest, notificationsAPI } from './api';

export async function impersonateUser(userId, token) {
    try {
        const response = await api.post('/api/admin/impersonate', { userId }, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data; // { token, user }
    } catch (error) {
        throw error.response ? error.response.data : error;
    }
}

// Usage in a React component (admin only):
// import { impersonateUser } from './impersonate';
// const { token, user } = await impersonateUser(targetUserId, adminToken);
// Use the returned token to act as the user
