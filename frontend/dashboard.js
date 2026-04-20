// frontend/dashboard.js
// React API calls and sample component for custom user dashboards/widgets

import api, { apiRequest, notificationsAPI } from './api';
import React, { useEffect, useState } from 'react';
// Fetch jobs from backend
export async function fetchJobs(token) {
    try {
        const response = await api.get('/api/jobs', {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data.jobs || response.data;
    } catch (error) {
        throw error.response ? error.response.data : error;
    }
}

// Fetch dashboard stats from backend
export async function fetchDashboardStats(token) {
    try {
        const response = await api.get('/api/dashboard/stats', {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : error;
    }
}

export async function saveDashboardWidgets(widgets, token) {
    try {
        const response = await api.post('/api/dashboard/widgets', { widgets }, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data.widgets;
    } catch (error) {
        throw error.response ? error.response.data : error;
    }
}

export async function loadDashboardWidgets(token) {
    try {
        const response = await api.get('/api/dashboard/widgets', {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data.widgets;
    } catch (error) {
        throw error.response ? error.response.data : error;
    }
}

// Sample React component for rendering widgets

export function UserDashboard({ token }) {
    const [widgets, setWidgets] = useState([]);
    const [jobs, setJobs] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        setLoading(true);
        setError(null);
        Promise.all([
            loadDashboardWidgets(token).catch(() => []),
            fetchJobs(token).catch(() => []),
            fetchDashboardStats(token).catch(() => null),
        ])
            .then(([widgets, jobs, stats]) => {
                setWidgets(widgets);
                setJobs(jobs);
                setStats(stats);
                setLoading(false);
            })
            .catch((e) => {
                setError('Failed to load dashboard data.');
                setLoading(false);
            });
    }, [token]);

    if (loading) return <div>Loading dashboard...</div>;
    if (error) return <div style={{ color: 'red' }}>{error}</div>;

    return (
        <div style={{ fontFamily: 'Segoe UI, Arial, sans-serif', padding: 24, background: '#f7f9fa', minHeight: '100vh' }}>
            <h2 style={{ marginBottom: 24 }}>Your Dashboard</h2>
            {/* Stats Section */}
            {stats && (
                <div style={{ display: 'flex', gap: 32, marginBottom: 32 }}>
                    {Object.entries(stats).map(([key, value]) => (
                        <div key={key} style={{ background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #e0e0e0', padding: 24, minWidth: 120, textAlign: 'center' }}>
                            <div style={{ fontSize: 28, fontWeight: 600, color: '#1976d2' }}>{value}</div>
                            <div style={{ fontSize: 14, color: '#555', marginTop: 8 }}>{key.replace(/([A-Z])/g, ' $1')}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* Jobs Section */}
            <div style={{ marginBottom: 32 }}>
                <h3 style={{ marginBottom: 12 }}>Recent Jobs</h3>
                {jobs.length === 0 ? (
                    <div style={{ color: '#888' }}>No jobs found.</div>
                ) : (
                    <table style={{ width: '100%', background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #e0e0e0', overflow: 'hidden' }}>
                        <thead>
                            <tr style={{ background: '#f0f4f8', textAlign: 'left' }}>
                                <th style={{ padding: '12px 16px' }}>Job Name</th>
                                <th style={{ padding: '12px 16px' }}>Status</th>
                                <th style={{ padding: '12px 16px' }}>Created</th>
                            </tr>
                        </thead>
                        <tbody>
                            {jobs.slice(0, 5).map((job, i) => (
                                <tr key={job._id || i}>
                                    <td style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0' }}>{job.name || job.title || 'Untitled'}</td>
                                    <td style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0' }}>{job.status || 'N/A'}</td>
                                    <td style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0' }}>{job.createdAt ? new Date(job.createdAt).toLocaleString() : 'N/A'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Widgets Section */}
            <div>
                <h3 style={{ marginBottom: 12 }}>Custom Widgets</h3>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    {widgets.length === 0 ? (
                        <div style={{ color: '#888' }}>No widgets configured.</div>
                    ) : (
                        widgets.map((w, i) => (
                            <div key={i} style={{ border: '1px solid #ccc', borderRadius: 8, background: '#fff', padding: 20, minWidth: 200, marginBottom: 16 }}>
                                <h4 style={{ margin: 0, marginBottom: 8 }}>{w.title}</h4>
                                <div>{w.content}</div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

// Usage:
// <UserDashboard token={userToken} />
