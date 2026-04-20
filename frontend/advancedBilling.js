// frontend/advancedBilling.js
// Web API for advanced billing & invoicing feature
import api, { apiRequest, notificationsAPI } from './api';

export const createInvoice = async (data, token) => api.post('/api/advanced-billing/invoice', data, { headers: { Authorization: `Bearer ${token}` } });
export const getInvoices = async (token) => api.get('/api/advanced-billing/invoices', { headers: { Authorization: `Bearer ${token}` } });
export const processPayment = async (data, token) => api.post('/api/advanced-billing/payment', data, { headers: { Authorization: `Bearer ${token}` } });
