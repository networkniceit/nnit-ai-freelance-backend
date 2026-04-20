// frontend/auth.js
// React API calls for registration and login
import api, { apiRequest, notificationsAPI } from './api'; // Your axios instance

export async function registerUser({ email, password, full_name }) {
    try {
        const response = await api.post('/api/auth/register', { email, password, full_name });
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : error;
    }
}

export async function loginUser({ email, password }) {
    try {
        const response = await api.post('/api/auth/login', { email, password });
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : error;
    }
}

// Usage in a React component:
// import { registerUser, loginUser } from './auth';
// const regResult = await registerUser({ email, password, full_name });
// const loginResult = await loginUser({ email, password });
