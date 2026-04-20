// frontend/profile.js
// React API calls for updating profile and uploading avatar
import api, { apiRequest, notificationsAPI } from './api'; // Your axios instance

export async function updateProfile(data, token) {
    try {
        const response = await api.put('/api/profile', data, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : error;
    }
}

export async function uploadAvatar(file, token) {
    const formData = new FormData();
    formData.append('avatar', file);
    try {
        const response = await api.post('/api/profile/avatar', formData, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : error;
    }
}

// Usage in a React component:
// import { updateProfile, uploadAvatar } from './profile';
// await updateProfile({ full_name, contact_email }, token);
// await uploadAvatar(file, token);
