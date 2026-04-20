// frontend/files.js
// React API calls for file upload/list/download (S3)
import api, { apiRequest, notificationsAPI } from './api'; // Your axios instance

export async function uploadFile(file, token) {
    const formData = new FormData();
    formData.append('file', file);
    try {
        const response = await api.post('/api/files/upload', formData, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data.file;
    } catch (error) {
        throw error.response ? error.response.data : error;
    }
}

export async function listFiles(token) {
    try {
        const response = await api.get('/api/files', {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data.files;
    } catch (error) {
        throw error.response ? error.response.data : error;
    }
}

export async function getDownloadUrl(key, token) {
    try {
        const response = await api.get(`/api/files/download/${key}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data.url;
    } catch (error) {
        throw error.response ? error.response.data : error;
    }
}

// Usage in a React component:
// import { uploadFile, listFiles, getDownloadUrl } from './files';
// await uploadFile(file, token);
// const files = await listFiles(token);
// const url = await getDownloadUrl(fileKey, token);
