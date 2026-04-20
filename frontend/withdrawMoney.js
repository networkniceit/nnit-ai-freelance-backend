// Example: React API call to withdraw money via Stripe
import api, { apiRequest, notificationsAPI } from './api'; // Your axios instance

export async function withdrawMoney({ amount, currency, destination }, token) {
    try {
        const response = await api.post('/api/payments/withdraw', { amount, currency, destination }, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : error;
    }
}

// Usage in a React component:
// import { withdrawMoney } from './withdrawMoney';
// const result = await withdrawMoney({ amount: 100, currency: 'usd', destination: 'acct_xxx' }, token);
