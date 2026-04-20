// frontend/customReports.js
// React API calls for custom reporting builder
import api, { apiRequest, notificationsAPI } from './api';

export async function saveCustomReport({ name, query, fields }, token) {
    try {
        const response = await api.post('/api/custom-reports', { name, query, fields }, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data.report;
    } catch (error) {
        throw error.response ? error.response.data : error;
    }
}

export async function listCustomReports(token) {
    try {
        const response = await api.get('/api/custom-reports', {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data.reports;
    } catch (error) {
        throw error.response ? error.response.data : error;
    }
}

export async function runCustomReport({ query, fields }, token) {
    try {
        const response = await api.post('/api/custom-reports/run', { query, fields }, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data.results;
    } catch (error) {
        throw error.response ? error.response.data : error;
    }
}

// Usage in a React component:
// import { saveCustomReport, listCustomReports, runCustomReport } from './customReports';
// await saveCustomReport({ name, query, fields }, token);
// const reports = await listCustomReports(token);
// const results = await runCustomReport({ query, fields }, token);
