// frontend/stripeSubscription.js
// Stripe subscription API integration for frontend
import api, { apiRequest, notificationsAPI } from './api';

// Start a Stripe subscription checkout session
export const startSubscription = async (priceId, token) => {
  const response = await api.post(
    '/api/payments/create-subscription-session',
    { priceId },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data.url;
};
