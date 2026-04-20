import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3003', // Project convention: backend runs on port 3003
  // Add interceptors here for JWT, etc., if needed
});

export default api;

// Usage examples (frontend modules should use the shared api helper):
// await api.get('/api/auditLog');
// await api.post('/api/someRoute', data, { headers: { Authorization: `Bearer ${token}` } });