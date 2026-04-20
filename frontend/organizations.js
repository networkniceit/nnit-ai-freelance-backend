// frontend/organizations.js
// React API calls for multi-tenant organizations/teams
import api, { apiRequest, notificationsAPI } from './api';

export async function createOrganization(name, token) {
    try {
        const response = await api.post('/api/organizations', { name }, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data.org;
    } catch (error) {
        throw error.response ? error.response.data : error;
    }
}

export async function addMemberToOrganization(orgId, userId, token) {
    try {
        const response = await api.post(`/api/organizations/${orgId}/members`, { userId }, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data.org;
    } catch (error) {
        throw error.response ? error.response.data : error;
    }
}

export async function listOrganizations(token) {
    try {
        const response = await api.get('/api/organizations', {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data.orgs;
    } catch (error) {
        throw error.response ? error.response.data : error;
    }
}

// Usage in a React component:
// import { createOrganization, addMemberToOrganization, listOrganizations } from './organizations';
// await createOrganization('My Org', token);
// await addMemberToOrganization(orgId, userId, token);
// const orgs = await listOrganizations(token);
