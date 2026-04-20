// Example: React API call to withdraw money via PayPal
import api, { apiRequest, notificationsAPI } from './api'; // Your axios instance

export async function withdrawPayPal({ amount, currency, payee_email }, token) {
    try {
        const response = await api.post('/api/payments/paypal/withdraw', { amount, currency, payee_email }, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : error;
    }
}

// Usage in a React component:
// import { withdrawPayPal } from './withdrawPayPal';
// const result = await withdrawPayPal({ amount: 100, currency: 'USD', payee_email: 'user@example.com' }, token);
