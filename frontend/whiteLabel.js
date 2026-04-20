// frontend/whiteLabel.js
// Web API for white-label feature
import api, { apiRequest, notificationsAPI } from './api';

export const saveWhiteLabelSettings = async (settings, token) => {
    return api.post('/api/white-label/settings', settings, {
        headers: { Authorization: `Bearer ${token}` },
    });
};

export const getWhiteLabelSettings = async (token) => {
    return api.get('/api/white-label/settings', {
        headers: { Authorization: `Bearer ${token}` },
    });
};
