// frontend/SubscriptionButton.js
// React component for starting a Stripe subscription
import React from 'react';
import { startSubscription } from './stripeSubscription';

export default function SubscriptionButton({ priceId, token }) {
  const handleSubscribe = async () => {
    try {
      const url = await startSubscription(priceId, token);
      window.location.href = url; // Redirect to Stripe Checkout
    } catch (err) {
      alert('Failed to start subscription: ' + (err.response?.data?.error || err.message));
    }
  };

  return (
    <button onClick={handleSubscribe} style={{ padding: '12px 24px', background: '#635bff', color: '#fff', border: 'none', borderRadius: 6, fontSize: 16, cursor: 'pointer' }}>
      Subscribe Now
    </button>
  );
}
