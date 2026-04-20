// Example: React API call to save user info (production-ready)
import api, { apiRequest, notificationsAPI } from './api'; // Your axios instance

export async function saveUserInfo(userData, token) {
    try {
        const response = await api.post('/api/users', userData, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    } catch (error) {
        // Handle error (show message to user, etc.)
        throw error.response ? error.response.data : error;
    }
}

// Usage in a React component:
// import { saveUserInfo } from './saveUserInfo';
// const result = await saveUserInfo({ email, password, full_name }, token);
