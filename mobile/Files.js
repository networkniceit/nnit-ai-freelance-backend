// mobile/Files.js
import axios from 'axios';
const API_URL = 'https://your-api-url.com/api/files';
export const uploadFile = async (file, token) => {
    const formData = new FormData();
    formData.append('file', file);
    return axios.post(`${API_URL}/upload`, formData, { headers: { Authorization: `Bearer ${token}` } });
};
export const getFiles = async (token) => axios.get(`${API_URL}`, { headers: { Authorization: `Bearer ${token}` } });
