// mobile/FeatureFlags.js
// React Native API for feature flags feature
import axios from 'axios';
const API_URL = 'https://your-api-url.com/api/feature-flags';
export const saveFeatureFlag = async (data, token) => axios.post(`${API_URL}`, data, { headers: { Authorization: `Bearer ${token}` } });
export const getFeatureFlags = async (token) => axios.get(`${API_URL}`, { headers: { Authorization: `Bearer ${token}` } });
export const deleteFeatureFlag = async (key, token) => axios.delete(`${API_URL}/${key}`, { headers: { Authorization: `Bearer ${token}` } });
