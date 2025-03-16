// src/components/Trending/TrendingJobDetails.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import {
    Chart,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import LoadingSpinner from '../common/LoadingSpinner';
import StatusBadge from '../common/StatusBadge';

// Register Chart.js components
Chart.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

// API service for trending bot
const api = axios.create({
    baseURL: 'http://localhost:3000/api/trending',
    timeout: 10000
});

// Error handling interceptor
api.interceptors.response.use(
    response => response.data,
    error => {
        const errorMessage = error.response?.data?.message || error.message;
        console.error('API Error:', errorMessage);
        throw new Error(errorMessage);
    }
);

const TrendingJobDetails = () => {
    const { jobId } = useParams();
    const navigate = useNavigate();

    const [job, setJob] = useState(null);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [chartData, setChartData] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);

                // Fetch job details
                const jobData = await api.get(`/job/${jobId}`);
                setJob(jobData.job);

                // Fetch job logs
                const logsData = await api.get(`/job/${jobId}/logs`);
                setLogs(logsData.logs || []);

                // Process logs for charts
                processLogsForCharts(logsData.logs || []);

                setLoading(false);
            } catch (err) {
                setError(`Error fetching job data: ${err.message}`);
                setLoading(false);
            }
        };

        fetchData();

        // Poll for updates every 30 seconds if job is active
        const interval = setInterval(() => {
            if (job && job.status === 'running') {
                fetchData();
            }
        }, 30000);

        return () => clearInterval(interval);
    }, [jobId]);

    // Process logs to generate chart data
    const processLogsForCharts = (logs) => {
        if (!logs || logs.length === 0) return;

        // Group logs by hour for timeline
        const hourlyData = {};
        const actionTypes = {
            view: { label: 'Page Views', color: 'rgba(59, 130, 246, 0.5)' },
            search: { label: 'Searches', color: 'rgba(16, 185, 129, 0.5)' },
            favorite: { label: 'Favorites', color: 'rgba(249, 115, 22, 0.5)' }
        };

        // Initialize hourly buckets
        const startTime = new Date(logs[0].timestamp);
        const endTime = new Date(logs[logs.length - 1].timestamp);
        const hourDiff = Math.ceil((endTime - startTime) / (60 * 60 * 1000)) + 1;

        for (let i = 0; i < hourDiff; i++) {
            const hourTimestamp = new Date(startTime.getTime() + i * 60 * 60 * 1000);
            const hourKey = hourTimestamp.toISOString().substring(0, 13); // YYYY-MM-DDTHH format

            hourlyData[hourKey] = {
                timestamp: hourTimestamp,
                view: { success: 0, failed: 0 },
                search: { success: 0, failed: 0 },
                favorite: { success: 0, failed: 0 }
            };
        }

        // Process logs
        logs.forEach(log => {
            if (['view', 'search', 'favorite'].includes(log.type)) {
                const timestamp = new Date(log.timestamp);
                const hourKey = timestamp.toISOString().substring(0, 13);

                if (hourlyData[hourKey]) {
                    const status = log.success ? 'success' : 'failed';
                    hourlyData[hourKey][log.type][status]++;
                }
            }
        });

        // Convert to chart format
        const sortedHours = Object.keys(hourlyData).sort();
        const labels = sortedHours.map(hour => {
            const date = new Date(hour);
            return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:00`;
        });

        const datasets = Object.keys(actionTypes).map(action => {
            return {
                label: actionTypes[action].label,
                data: sortedHours.map(hour => hourlyData[hour][action].success),
                backgroundColor: actionTypes[action].color,
                borderColor: actionTypes[action].color.replace('0.5', '1'),
                borderWidth: 1,
                tension: 0.4
            };
        });

        // Success vs failure data
        const successData = {
            labels: ['Success', 'Failed'],
            datasets: [
                {
                    data: [
                        logs.filter(log => ['view', 'search', 'favorite'].includes(log.type) && log.success).length,
                        logs.filter(log => ['view', 'search', 'favorite'].includes(log.type) && !log.success).length
                    ],
                    backgroundColor: [
                        'rgba(16, 185, 129, 0.5)',
                        'rgba(239, 68, 68, 0.5)'
                    ],
                    borderColor: [
                        'rgba(16, 185, 129, 1)',
                        'rgba(239, 68, 68, 1)'
                    ],
                    borderWidth: 1
                }
            ]
        };

        setChartData({
            timeline: {
                labels,
                datasets
            },
            successRate: successData
        });
    };

    // Handle stopping the job
    const handleStopJob = async () => {
        if (!window.confirm('Are you sure you want to stop this job?')) {
            return;
        }

        try {
            setLoading(true);
            setError(null);
            setSuccess(null);

            const result = await api.post(`/job/${jobId}/stop`);

            if (result.success) {
                setSuccess(`Job ${jobId} stopped successfully`);

                // Refresh job data
                const jobData = await api.get(`/job/${jobId}`);
                setJob(jobData.job);
            } else {
                setError(result.message || 'Failed to stop job');
            }

            setLoading(false);
        } catch (err) {
            setError(`Error stopping job: ${err.message}`);
            setLoading(false);
        }
    };

    // Helper to format platform name
    const formatPlatform = (platform) => {
        switch (platform) {
            case 'coingecko':
                return 'CoinGecko';
            case 'coinmarketcap':
                return 'CoinMarketCap';
            case 'both':
                return 'Both';
            default:
                return platform;
        }
    };

    if (loading && !job) {
        return <LoadingSpinner />;
    }

    if (error && !job) {
        return <div className="error-message">{error}</div>;
    }

    if (!job) {
        return <div className="error-message">Job not found</div>;
    }

    return (
        <div className="job-details-page">
            <div className="page-header">
                <div>
                    <h1>Job Details: {job.tokenId}</h1>
                    <p>{job.description || `Trending job for ${job.tokenId} on ${formatPlatform(job.platform)}`}</p>
                </div>
                <div className="header-actions">
                    <Link to="/trending" className="button button-small">
                        Back to Dashboard
                    </Link>
                    {job.status === 'running' && (
                        <button
                            className="button button-small button-danger"
                            onClick={handleStopJob}
                        >
                            Stop Job
                        </button>
                    )}
                </div>
            </div>

            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            <div className="details-summary card">
                <div className="detail-grid">
                    <div className="detail-item">
                        <div className="detail-label">Status</div>
                        <div className="detail-value">
                            <StatusBadge status={
                                job.status === 'running' ? 'active' :
                                    job.status === 'completed' ? 'success' : 'stopped'
                            } />
                        </div>
                    </div>
                    <div className="detail-item">
                        <div className="detail-label">Token ID</div>
                        <div className="detail-value">{job.tokenId}</div>
                    </div>
                    <div className="detail-item">
                        <div className="detail-label">Platform</div>
                        <div className="detail-value">{formatPlatform(job.platform)}</div>
                    </div>
                    <div className="detail-item">
                        <div className="detail-label">Started</div>
                        <div className="detail-value">{new Date(job.startTime).toLocaleString()}</div>
                    </div>
                    <div className="detail-item">
                        <div className="detail-label">Duration</div>
                        <div className="detail-value">
                            {job.duration} hours
                            {job.status === 'running' && job.progress?.remainingHours && (
                                <span> ({job.progress.remainingHours.toFixed(1)} remaining)</span>
                            )}
                        </div>
                    </div>
                    <div className="detail-item">
                        <div className="detail-label">Progress</div>
                        <div className="detail-value progress-cell">
                            <div className="progress-bar">
                                <div
                                    className="progress-fill"
                                    style={{ width: `${job.progress?.percent || 0}%` }}
                                ></div>
                                <span>{job.progress?.percent || 0}%</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="detail-tabs">
                <div className="tab-header">
                    <button
                        className={activeTab === 'overview' ? 'active' : ''}
                        onClick={() => setActiveTab('overview')}
                    >
                        Overview
                    </button>
                    <button
                        className={activeTab === 'charts' ? 'active' : ''}
                        onClick={() => setActiveTab('charts')}
                    >
                        Analytics
                    </button>
                    <button
                        className={activeTab === 'logs' ? 'active' : ''}
                        onClick={() => setActiveTab('logs')}
                    >
                        Activity Logs
                    </button>
                </div>

                <div className="tab-content">
                    {activeTab === 'overview' && (
                        <div className="overview-tab">
                            <div className="stats-grid">
                                <div className="stats-card">
                                    <h3>Page Views</h3>
                                    <div className="big-stat">{job.actions?.views?.completed || 0}</div>
                                    <div className="stat-meta">of {job.actions?.views?.planned || 0} planned</div>
                                    <div className="stat-meta success-rate">
                                        {job.actions?.views?.completed > 0 &&
                                            `${Math.round((job.actions.views.completed /
                                                (job.actions.views.completed + job.actions.views.failed)) * 100)}% success rate`
                                        }
                                    </div>
                                </div>

                                <div className="stats-card">
                                    <h3>Searches</h3>
                                    <div className="big-stat">{job.actions?.searches?.completed || 0}</div>
                                    <div className="stat-meta">of {job.actions?.searches?.planned || 0} planned</div>
                                    <div className="stat-meta success-rate">
                                        {job.actions?.searches?.completed > 0 &&
                                            `${Math.round((job.actions.searches.completed /
                                                (job.actions.searches.completed + job.actions.searches.failed)) * 100)}% success rate`
                                        }
                                    </div>
                                </div>

                                <div className="stats-card">
                                    <h3>Favorites</h3>
                                    <div className="big-stat">{job.actions?.favorites?.completed || 0}</div>
                                    <div className="stat-meta">of {job.actions?.favorites?.planned || 0} planned</div>
                                    <div className="stat-meta success-rate">
                                        {job.actions?.favorites?.completed > 0 &&
                                            `${Math.round((job.actions.favorites.completed /
                                                (job.actions.favorites.completed + job.actions.favorites.failed)) * 100)}% success rate`
                                        }
                                    </div>
                                </div>

                                <div className="stats-card">
                                    <h3>Proxies Used</h3>
                                    <div className="big-stat">{job.stats?.proxiesUsed || 0}</div>
                                    <div className="stat-meta">requests distributed via proxy</div>
                                </div>
                            </div>

                            <div className="job-configuration card">
                                <h3>Job Configuration</h3>
                                <table className="config-table">
                                    <tbody>
                                    <tr>
                                        <td>Token ID:</td>
                                        <td>{job.tokenId}</td>
                                    </tr>
                                    <tr>
                                        <td>Platform:</td>
                                        <td>{formatPlatform(job.platform)}</td>
                                    </tr>
                                    <tr>
                                        <td>Duration:</td>
                                        <td>{job.duration} hours</td>
                                    </tr>
                                    <tr>
                                        <td>Intensity:</td>
                                        <td>{job.intensity}</td>
                                    </tr>
                                    <tr>
                                        <td>Using Proxies:</td>
                                        <td>{job.useProxies ? 'Yes' : 'No'}</td>
                                    </tr>
                                    <tr>
                                        <td>Page Views per Hour:</td>
                                        <td>{job.hourlyActions?.views || 0}</td>
                                    </tr>
                                    <tr>
                                        <td>Searches per Hour:</td>
                                        <td>{job.hourlyActions?.searches || 0}</td>
                                    </tr>
                                    <tr>
                                        <td>Favorites per Hour:</td>
                                        <td>{job.hourlyActions?.favs || 0}</td>
                                    </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'charts' && (
                        <div className="charts-tab">
                            <div className="charts-container">
                                {chartData ? (
                                    <>
                                        <div className="chart-box">
                                            <h3>Actions Over Time</h3>
                                            <div className="chart-wrapper" style={{ height: '300px' }}>
                                                <Line
                                                    data={chartData.timeline}
                                                    options={{
                                                        responsive: true,
                                                        maintainAspectRatio: false,
                                                        scales: {
                                                            y: {
                                                                beginAtZero: true,
                                                                grid: {
                                                                    color: 'rgba(255, 255, 255, 0.1)'
                                                                },
                                                                ticks: {
                                                                    color: '#a8a8bd'
                                                                }
                                                            },
                                                            x: {
                                                                grid: {
                                                                    color: 'rgba(255, 255, 255, 0.1)'
                                                                },
                                                                ticks: {
                                                                    color: '#a8a8bd',
                                                                    maxRotation: 45,
                                                                    minRotation: 45
                                                                }
                                                            }
                                                        },
                                                        plugins: {
                                                            legend: {
                                                                position: 'top',
                                                                labels: {
                                                                    color: '#f8fafc'
                                                                }
                                                            },
                                                            title: {
                                                                display: true,
                                                                text: 'Actions Performed Over Time',
                                                                color: '#f8fafc'
                                                            }
                                                        }
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        <div className="stats-summary">
                                            <div className="stats-box">
                                                <h3>Success Rate</h3>
                                                <table className="stats-table">
                                                    <thead>
                                                    <tr>
                                                        <th>Action Type</th>
                                                        <th>Success</th>
                                                        <th>Failed</th>
                                                        <th>Rate</th>
                                                    </tr>
                                                    </thead>
                                                    <tbody>
                                                    <tr>
                                                        <td>Page Views</td>
                                                        <td>{job.actions?.views?.completed || 0}</td>
                                                        <td>{job.actions?.views?.failed || 0}</td>
                                                        <td>
                                                            {job.actions?.views?.completed > 0 ?
                                                                `${Math.round((job.actions.views.completed /
                                                                    (job.actions.views.completed + job.actions.views.failed)) * 100)}%` :
                                                                'N/A'
                                                            }
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td>Searches</td>
                                                        <td>{job.actions?.searches?.completed || 0}</td>
                                                        <td>{job.actions?.searches?.failed || 0}</td>
                                                        <td>
                                                            {job.actions?.searches?.completed > 0 ?
                                                                `${Math.round((job.actions.searches.completed /
                                                                    (job.actions.searches.completed + job.actions.searches.failed)) * 100)}%` :
                                                                'N/A'
                                                            }
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td>Favorites</td>
                                                        <td>{job.actions?.favorites?.completed || 0}</td>
                                                        <td>{job.actions?.favorites?.failed || 0}</td>
                                                        <td>
                                                            {job.actions?.favorites?.completed > 0 ?
                                                                `${Math.round((job.actions.favorites.completed /
                                                                    (job.actions.favorites.completed + job.actions.favorites.failed)) * 100)}%` :
                                                                'N/A'
                                                            }
                                                        </td>
                                                    </tr>
                                                    <tr className="total-row">
                                                        <td>TOTAL</td>
                                                        <td>
                                                            {(job.actions?.views?.completed || 0) +
                                                                (job.actions?.searches?.completed || 0) +
                                                                (job.actions?.favorites?.completed || 0)}
                                                        </td>
                                                        <td>
                                                            {(job.actions?.views?.failed || 0) +
                                                                (job.actions?.searches?.failed || 0) +
                                                                (job.actions?.favorites?.failed || 0)}
                                                        </td>
                                                        <td>
                                                            {job.progress?.successRate || 0}%
                                                        </td>
                                                    </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="empty-state">
                                        <div className="empty-icon">📊</div>
                                        <p>No chart data available yet</p>
                                        <p>Data will populate as actions are performed</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'logs' && (
                        <div className="logs-tab">
                            <h3>Activity Logs</h3>
                            {logs.length === 0 ? (
                                <div className="empty-state">
                                    <div className="empty-icon">📋</div>
                                    <p>No logs available</p>
                                </div>
                            ) : (
                                <div className="logs-container">
                                    <div className="filters">
                                        <div className="filter-count">
                                            Showing {logs.length} log entries
                                        </div>
                                    </div>

                                    <div className="logs-list">
                                        {logs.map((log, index) => (
                                            <div key={index} className={`log-entry ${log.type}`}>
                                                <div className="log-header">
                                                    <span className="log-time">{new Date(log.timestamp).toLocaleString()}</span>
                                                    <span className={`log-type type-${log.type}`}>{log.type.toUpperCase()}</span>
                                                    {log.success !== undefined && (
                                                        <span className={`log-status ${log.success ? 'success' : 'error'}`}>
                                                            {log.success ? 'SUCCESS' : 'FAILED'}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="log-content">
                                                    {log.type === 'view' && (
                                                        <div>
                                                            Page view for {log.platform}
                                                            {log.url && <span> - URL: {log.url}</span>}
                                                            {log.proxy && <span> - Proxy: {log.proxy}</span>}
                                                            {log.error && <div className="log-error">Error: {log.error}</div>}
                                                        </div>
                                                    )}

                                                    {log.type === 'search' && (
                                                        <div>
                                                            Search on {log.platform}: "{log.term}"
                                                            {log.proxy && <span> - Proxy: {log.proxy}</span>}
                                                            {log.error && <div className="log-error">Error: {log.error}</div>}
                                                        </div>
                                                    )}

                                                    {log.type === 'favorite' && (
                                                        <div>
                                                            Favorite action for {log.tokenId} on {log.platform}
                                                            {log.proxy && <span> - Proxy: {log.proxy}</span>}
                                                            {log.error && <div className="log-error">Error: {log.error}</div>}
                                                        </div>
                                                    )}

                                                    {log.type === 'error' && (
                                                        <div className="log-error">
                                                            Error: {log.message}
                                                            {log.action && <span> during {log.action} action</span>}
                                                        </div>
                                                    )}

                                                    {log.type === 'status' && (
                                                        <div>
                                                            Status update: Progress {log.progress},
                                                            Success rate {log.successRate},
                                                            Remaining {log.remainingHours} hours
                                                        </div>
                                                    )}

                                                    {(log.type === 'start' || log.type === 'stop' || log.type === 'complete') && (
                                                        <div>
                                                            {log.message}
                                                        </div>
                                                    )}

                                                    {!['view', 'search', 'favorite', 'error', 'status', 'start', 'stop', 'complete'].includes(log.type) && (
                                                        <pre>{JSON.stringify(log, null, 2)}</pre>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TrendingJobDetails;