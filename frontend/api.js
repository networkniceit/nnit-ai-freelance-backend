import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3003/api', // Fixed: Add /api prefix and correct port
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;

// Generic API request helper
export const apiRequest = (method, url, data, config = {}) => {
  return api.request({ method, url, data, ...config });
};

// Explicit notifications API
export const notificationsAPI = {
  getAll: (params) => api.get('/notifications', { params }),
  markRead: (id) => api.post(`/notifications/${id}/mark-read`),
};

// Backwards compatibility: attach helpers to default export
api.apiRequest = apiRequest;
api.notificationsAPI = notificationsAPI;
