// frontend/advancedSearch.js
// Web API for advanced search feature
import api, { apiRequest, notificationsAPI } from './api';

export const advancedSearch = async (data, token) => api.post('/api/advanced-search', data, { headers: { Authorization: `Bearer ${token}` } });
