// frontend/advancedLocalization.js
// Web API for advanced localization & i18n feature
import api, { apiRequest, notificationsAPI } from './api';

export const saveLocalization = async (data, token) => api.post('/api/localization', data, { headers: { Authorization: `Bearer ${token}` } });
export const getLocalization = async (token) => api.get('/api/localization', { headers: { Authorization: `Bearer ${token}` } });
