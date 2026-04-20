// frontend/advancedNotifications.js
// Web API for advanced notification settings feature
import api, { apiRequest, notificationsAPI } from './api';

export const saveNotificationSettings = async (data, token) => api.post('/api/notifications/settings', data, { headers: { Authorization: `Bearer ${token}` } });
export const getNotificationSettings = async (token) => api.get('/api/notifications/settings', { headers: { Authorization: `Bearer ${token}` } });
