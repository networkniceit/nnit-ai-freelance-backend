// frontend/crmIntegration.js
// React API call for CRM integration (Salesforce example)
import api, { apiRequest, notificationsAPI } from './api';

export async function pushUserToSalesforce({ salesforceAccessToken, salesforceInstanceUrl }, token) {
    try {
        const response = await api.post('/api/crm/salesforce/push-user', { salesforceAccessToken, salesforceInstanceUrl }, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : error;
    }
}

// Usage in a React component:
// import { pushUserToSalesforce } from './crmIntegration';
// await pushUserToSalesforce({ salesforceAccessToken, salesforceInstanceUrl }, token);
