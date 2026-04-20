// frontend/social.js
// React API call for Google social login
import api, { apiRequest, notificationsAPI } from './api'; // Your axios instance

export async function googleLogin(tokenId) {
    try {
        const response = await api.post('/api/auth/google', { tokenId });
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : error;
    }
}

// Usage in a React component:
// import { googleLogin } from './social';
// const result = await googleLogin(tokenId);
// result.token contains your JWT for the session
