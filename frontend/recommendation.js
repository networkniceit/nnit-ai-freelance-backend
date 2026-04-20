// frontend/recommendation.js
// React API calls for AI-powered recommendations
import api, { apiRequest, notificationsAPI } from './api';

export async function getJobRecommendations(token) {
    try {
        const response = await api.get('/api/recommendations/jobs', {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data.recommendations;
    } catch (error) {
        throw error.response ? error.response.data : error;
    }
}

export async function getCertificateRecommendations(token) {
    try {
        const response = await api.get('/api/recommendations/certificates', {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data.recommendations;
    } catch (error) {
        throw error.response ? error.response.data : error;
    }
}

// Usage in a React component:
// import { getJobRecommendations, getCertificateRecommendations } from './recommendation';
// const jobs = await getJobRecommendations(token);
// const certs = await getCertificateRecommendations(token);
