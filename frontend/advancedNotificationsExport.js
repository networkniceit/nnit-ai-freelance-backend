// frontend/advancedNotifications.js
// Web API for advanced notification settings and export features
import api, { apiRequest, notificationsAPI } from './api';

// Notification Settings
export const saveNotificationSettings = async (data, token) =>
	api.post('/api/notifications/settings', data, { headers: { Authorization: `Bearer ${token}` } });
export const getNotificationSettings = async (token) =>
	api.get('/api/notifications/settings', { headers: { Authorization: `Bearer ${token}` } });

// Advanced Notifications Export
export const startAdvancedNotificationsExport = async (data, token) =>
	api.post('/api/notifications-export/advanced', data, { headers: { Authorization: `Bearer ${token}` } });
export const getAdvancedNotificationsExportStatus = async (token) =>
	api.get('/api/notifications-export/advanced/status', { headers: { Authorization: `Bearer ${token}` } });
