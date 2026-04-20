// mobile/WhiteLabel.js
// React Native API for white-label feature
import axios from 'axios';

const API_URL = 'https://your-api-url.com/api/white-label';

export const saveWhiteLabelSettings = async (settings, token) => {
    return axios.post(`${API_URL}/settings`, settings, {
        headers: { Authorization: `Bearer ${token}` },
    });
};

export const getWhiteLabelSettings = async (token) => {
    return axios.get(`${API_URL}/settings`, {
        headers: { Authorization: `Bearer ${token}` },
    });
};
