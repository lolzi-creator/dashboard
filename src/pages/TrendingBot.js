// src/pages/TrendingBot.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import LoadingSpinner from '../components/common/LoadingSpinner';
import StatusBadge from '../components/common/StatusBadge';

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

const TrendingBot = () => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const [activeJobs, setActiveJobs] = useState([]);
    const [completedJobs, setCompletedJobs] = useState([]);
    const [proxies, setProxies] = useState([]);

    // Form state for new job
    const [newJobForm, setNewJobForm] = useState({
        tokenId: '',
        platform: 'coingecko',
        duration: 72,
        intensity: 'medium',
        useProxies: true,
        description: ''
    });

    // Form state for adding proxies
    const [proxyForm, setProxyForm] = useState({
        proxies: ''
    });

    // Fetch data on component mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);

                // Fetch active jobs
                const activeJobsData = await api.get('/jobs');
                setActiveJobs(activeJobsData.jobs || []);

                // Fetch completed jobs
                const completedJobsData = await api.get('/jobs/completed');
                setCompletedJobs(completedJobsData.jobs || []);

                // Fetch proxies
                const proxiesData = await api.get('/proxies');
                setProxies(proxiesData.proxies || []);

                setLoading(false);
            } catch (err) {
                setError(`Error fetching data: ${err.message}`);
                setLoading(false);
            }
        };

        fetchData();

        // Refresh data every 30 seconds
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, []);

    // Handle new job form change
    const handleNewJobChange = (e) => {
        const { name, value, type, checked } = e.target;
        setNewJobForm(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    // Handle new job form submit
    const handleNewJobSubmit = async (e) => {
        e.preventDefault();

        try {
            setLoading(true);
            setError(null);
            setSuccess(null);

            // Validate form
            if (!newJobForm.tokenId) {
                setError('Token ID is required');
                setLoading(false);
                return;
            }

            // Submit form
            const result = await api.post('/job/start', newJobForm);

            if (result.success) {
                setSuccess(`Job started successfully with ID: ${result.jobId}`);

                // Reset form
                setNewJobForm({
                    tokenId: '',
                    platform: 'coingecko',
                    duration: 72,
                    intensity: 'medium',
                    useProxies: true,
                    description: ''
                });

                // Refresh active jobs
                const activeJobsData = await api.get('/jobs');
                setActiveJobs(activeJobsData.jobs || []);

                // Switch to dashboard tab
                setActiveTab('dashboard');
            } else {
                setError(result.message || 'Failed to start job');
            }

            setLoading(false);
        } catch (err) {
            setError(`Error starting job: ${err.message}`);
            setLoading(false);
        }
    };

    // Handle proxy form change
    const handleProxyFormChange = (e) => {
        setProxyForm(prev => ({
            ...prev,
            proxies: e.target.value
        }));
    };

    // Handle proxy form submit
    const handleProxyFormSubmit = async (e) => {
        e.preventDefault();

        try {
            setLoading(true);
            setError(null);
            setSuccess(null);

            // Parse proxies
            const proxyList = proxyForm.proxies
                .split('\n')
                .map(line => line.trim())
                .filter(line => line.length > 0);

            if (proxyList.length === 0) {
                setError('No valid proxies provided');
                setLoading(false);
                return;
            }

            // Submit form
            const result = await api.post('/proxies/add', { proxies: proxyList });

            if (result.success) {
                setSuccess(`Added ${result.added} proxies successfully`);

                // Reset form
                setProxyForm({ proxies: '' });

                // Refresh proxies
                const proxiesData = await api.get('/proxies');
                setProxies(proxiesData.proxies || []);
            } else {
                setError(result.message || 'Failed to add proxies');
            }

            setLoading(false);
        } catch (err) {
            setError(`Error adding proxies: ${err.message}`);
            setLoading(false);
        }
    };

    // Handle stopping a job
    const handleStopJob = async (jobId) => {
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

                // Refresh jobs
                const activeJobsData = await api.get('/jobs');
                setActiveJobs(activeJobsData.jobs || []);

                const completedJobsData = await api.get('/jobs/completed');
                setCompletedJobs(completedJobsData.jobs || []);
            } else {
                setError(result.message || 'Failed to stop job');
            }

            setLoading(false);
        } catch (err) {
            setError(`Error stopping job: ${err.message}`);
            setLoading(false);
        }
    };

    // Handle removing a proxy
    const handleRemoveProxy = async (proxyId) => {
        if (!window.confirm('Are you sure you want to remove this proxy?')) {
            return;
        }

        try {
            setLoading(true);
            setError(null);
            setSuccess(null);

            const result = await api.delete(`/proxy/${proxyId}`);

            if (result.success) {
                setSuccess('Proxy removed successfully');

                // Refresh proxies
                const proxiesData = await api.get('/proxies');
                setProxies(proxiesData.proxies || []);
            } else {
                setError(result.message || 'Failed to remove proxy');
            }

            setLoading(false);
        } catch (err) {
            setError(`Error removing proxy: ${err.message}`);
            setLoading(false);
        }
    };

    // Format remaining time
    const formatRemainingTime = (job) => {
        if (!job.progress || !job.progress.remainingHours) {
            return 'Unknown';
        }

        const hours = Math.floor(job.progress.remainingHours);
        const minutes = Math.floor((job.progress.remainingHours % 1) * 60);

        return `${hours}h ${minutes}m`;
    };

    // Calculate success rate
    const calculateSuccessRate = (job) => {
        if (!job.actions) return '0%';

        const total = (job.actions.views?.completed || 0) +
            (job.actions.searches?.completed || 0) +
            (job.actions.favorites?.completed || 0) +
            (job.actions.views?.failed || 0) +
            (job.actions.searches?.failed || 0) +
            (job.actions.favorites?.failed || 0);

        if (total === 0) return '0%';

        const successful = (job.actions.views?.completed || 0) +
            (job.actions.searches?.completed || 0) +
            (job.actions.favorites?.completed || 0);

        return `${Math.round((successful / total) * 100)}%`;
    };

    // Helper to count successful actions
    const countSuccessfulActions = (job) => {
        if (!job.actions) return 0;

        return (job.actions.views?.completed || 0) +
            (job.actions.searches?.completed || 0) +
            (job.actions.favorites?.completed || 0);
    };

    // Helper to count total planned actions
    const countTotalPlannedActions = (job) => {
        if (!job.actions) return 0;

        return (job.actions.views?.planned || 0) +
            (job.actions.searches?.planned || 0) +
            (job.actions.favorites?.planned || 0);
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

    if (loading && activeJobs.length === 0 && completedJobs.length === 0) {
        return <LoadingSpinner />;
    }

    return (
        <div className="trending-bot-page">
            <div className="page-header">
                <div>
                    <h1>CoinGecko/CMC Trending Bot</h1>
                    <p>Boost your token's visibility on CoinGecko and CoinMarketCap</p>
                </div>
                <div className="header-actions">
                    <button
                        className="button"
                        onClick={() => setActiveTab('new-job')}
                    >
                        Start New Job
                    </button>
                </div>
            </div>

            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            <div className="tab-navigation">
                <button
                    className={activeTab === 'dashboard' ? 'active' : ''}
                    onClick={() => setActiveTab('dashboard')}
                >
                    Dashboard
                </button>
                <button
                    className={activeTab === 'new-job' ? 'active' : ''}
                    onClick={() => setActiveTab('new-job')}
                >
                    New Job
                </button>
                <button
                    className={activeTab === 'completed' ? 'active' : ''}
                    onClick={() => setActiveTab('completed')}
                >
                    Completed Jobs
                </button>
                <button
                    className={activeTab === 'proxies' ? 'active' : ''}
                    onClick={() => setActiveTab('proxies')}
                >
                    Proxy Management
                </button>
            </div>

            <div className="tab-content">
                {activeTab === 'dashboard' && (
                    <div className="dashboard-tab">
                        <h2>Active Trending Jobs</h2>

                        {activeJobs.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-icon">📈</div>
                                <p>No active trending jobs found</p>
                                <button
                                    className="button"
                                    onClick={() => setActiveTab('new-job')}
                                >
                                    Start Your First Job
                                </button>
                            </div>
                        ) : (
                            <div className="jobs-list">
                                <table className="data-table">
                                    <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Token</th>
                                        <th>Platform</th>
                                        <th>Progress</th>
                                        <th>Actions</th>
                                        <th>Success Rate</th>
                                        <th>Remaining</th>
                                        <th>Controls</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {activeJobs.map(job => (
                                        <tr key={job.id}>
                                            <td>{job.id.substring(0, 10)}...</td>
                                            <td>{job.tokenId}</td>
                                            <td>{formatPlatform(job.platform)}</td>
                                            <td>
                                                <div className="progress-bar">
                                                    <div
                                                        className="progress-fill"
                                                        style={{
                                                            width: `${job.progress?.percent || 0}%`
                                                        }}
                                                    ></div>
                                                    <span>{job.progress?.percent || 0}%</span>
                                                </div>
                                            </td>
                                            <td>
                                                {countSuccessfulActions(job)} / {countTotalPlannedActions(job)}
                                            </td>
                                            <td>{calculateSuccessRate(job)}</td>
                                            <td>{formatRemainingTime(job)}</td>
                                            <td>
                                                <div className="actions-cell">
                                                    <Link
                                                        to={`/trending/job/${job.id}`}
                                                        className="button button-small"
                                                    >
                                                        Details
                                                    </Link>
                                                    <button
                                                        className="button button-small button-danger"
                                                        onClick={() => handleStopJob(job.id)}
                                                    >
                                                        Stop
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        <div className="stats-summary">
                            <div className="card">
                                <h3>Overall Stats</h3>
                                <div className="stats-grid">
                                    <div className="stat-item">
                                        <div className="stat-label">Active Jobs</div>
                                        <div className="stat-value">{activeJobs.length}</div>
                                    </div>
                                    <div className="stat-item">
                                        <div className="stat-label">Total Actions</div>
                                        <div className="stat-value">
                                            {activeJobs.reduce((sum, job) => sum + countSuccessfulActions(job), 0)}
                                        </div>
                                    </div>
                                    <div className="stat-item">
                                        <div className="stat-label">Success Rate</div>
                                        <div className="stat-value">
                                            {activeJobs.length > 0 ?
                                                Math.round(
                                                    activeJobs.reduce((sum, job) => {
                                                        const rate = job.progress?.successRate || 0;
                                                        return sum + rate;
                                                    }, 0) / activeJobs.length
                                                ) + '%' :
                                                'N/A'
                                            }
                                        </div>
                                    </div>
                                    <div className="stat-item">
                                        <div className="stat-label">Proxies Used</div>
                                        <div className="stat-value">
                                            {activeJobs.reduce((sum, job) => sum + (job.stats?.proxiesUsed || 0), 0)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'new-job' && (
                    <div className="new-job-tab">
                        <h2>Start New Trending Job</h2>

                        <form onSubmit={handleNewJobSubmit} className="trending-form">
                            <div className="form-group">
                                <label htmlFor="tokenId">Token ID:</label>
                                <input
                                    type="text"
                                    id="tokenId"
                                    name="tokenId"
                                    value={newJobForm.tokenId}
                                    onChange={handleNewJobChange}
                                    placeholder="e.g., bitcoin, ethereum, your-token-id"
                                    required
                                />
                                <small>The token ID used in the platform URL (check your token's page URL)</small>
                            </div>

                            <div className="form-group">
                                <label htmlFor="platform">Platform:</label>
                                <select
                                    id="platform"
                                    name="platform"
                                    value={newJobForm.platform}
                                    onChange={handleNewJobChange}
                                    required
                                >
                                    <option value="coingecko">CoinGecko</option>
                                    <option value="coinmarketcap">CoinMarketCap</option>
                                    <option value="both">Both</option>
                                </select>
                                <small>Select the platform(s) you want to target</small>
                            </div>

                            <div className="form-group">
                                <label htmlFor="duration">Duration (hours):</label>
                                <input
                                    type="number"
                                    id="duration"
                                    name="duration"
                                    value={newJobForm.duration}
                                    onChange={handleNewJobChange}
                                    min="12"
                                    max="168"
                                    required
                                />
                                <small>How long the trending campaign should run (12-168 hours)</small>
                            </div>

                            <div className="form-group">
                                <label htmlFor="intensity">Intensity:</label>
                                <select
                                    id="intensity"
                                    name="intensity"
                                    value={newJobForm.intensity}
                                    onChange={handleNewJobChange}
                                    required
                                >
                                    <option value="low">Low (Safe)</option>
                                    <option value="medium">Medium (Recommended)</option>
                                    <option value="high">High (Aggressive)</option>
                                </select>
                                <small>Higher intensity means more actions but higher risk of detection</small>
                            </div>

                            <div className="form-group checkbox-group">
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        name="useProxies"
                                        checked={newJobForm.useProxies}
                                        onChange={handleNewJobChange}
                                    />
                                    Use Proxies
                                </label>
                                <small>Uses rotating proxies to avoid IP detection (recommended)</small>
                            </div>

                            <div className="form-group">
                                <label htmlFor="description">Description (optional):</label>
                                <textarea
                                    id="description"
                                    name="description"
                                    value={newJobForm.description}
                                    onChange={handleNewJobChange}
                                    placeholder="Enter a description for this job"
                                    rows="3"
                                />
                            </div>

                            <div className="job-summary">
                                <h3>Job Summary</h3>
                                <div className="summary-details">
                                    <p>
                                        This will start a trending campaign for <strong>{newJobForm.tokenId || 'your token'}</strong> on <strong>{formatPlatform(newJobForm.platform)}</strong> for <strong>{newJobForm.duration} hours</strong> at <strong>{newJobForm.intensity} intensity</strong>.
                                    </p>

                                    <p>
                                        {newJobForm.useProxies ?
                                            'Rotating proxies will be used to avoid IP detection.' :
                                            'WARNING: Not using proxies may result in lower effectiveness and possible IP blocking.'
                                        }
                                    </p>

                                    {newJobForm.useProxies && proxies.length === 0 && (
                                        <div className="warning-message">
                                            No proxies are currently configured. Please add proxies in the Proxy Management tab.
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="form-actions">
                                <button
                                    type="submit"
                                    className="button"
                                    disabled={loading || (newJobForm.useProxies && proxies.length === 0)}
                                >
                                    {loading ? 'Starting...' : 'Start Trending Job'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {activeTab === 'completed' && (
                    <div className="completed-tab">
                        <h2>Completed Trending Jobs</h2>

                        {completedJobs.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-icon">🏁</div>
                                <p>No completed trending jobs found</p>
                            </div>
                        ) : (
                            <div className="jobs-list">
                                <table className="data-table">
                                    <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Token</th>
                                        <th>Platform</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                        <th>Success Rate</th>
                                        <th>Duration</th>
                                        <th>End Time</th>
                                        <th>Actions</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {completedJobs.map(job => {
                                        const duration = job.endTime && job.startTime
                                            ? ((job.endTime - job.startTime) / (60 * 60 * 1000)).toFixed(1)
                                            : 'Unknown';

                                        return (
                                            <tr key={job.id}>
                                                <td>{job.id.substring(0, 10)}...</td>
                                                <td>{job.tokenId}</td>
                                                <td>{formatPlatform(job.platform)}</td>
                                                <td>
                                                    <StatusBadge status={job.status === 'completed' ? 'success' : 'stopped'} />
                                                </td>
                                                <td>{countSuccessfulActions(job)} / {countTotalPlannedActions(job)}</td>
                                                <td>{calculateSuccessRate(job)}</td>
                                                <td>{duration} hours</td>
                                                <td>{job.endTime ? new Date(job.endTime).toLocaleString() : 'Unknown'}</td>
                                                <td>
                                                    <Link
                                                        to={`/trending/job/${job.id}`}
                                                        className="button button-small"
                                                    >
                                                        Details
                                                    </Link>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'proxies' && (
                    <div className="proxies-tab">
                        <h2>Proxy Management</h2>

                        <div className="proxy-management">
                            <div className="proxy-list-section">
                                <h3>Current Proxies ({proxies.length})</h3>

                                {proxies.length === 0 ? (
                                    <div className="empty-state">
                                        <div className="empty-icon">🔄</div>
                                        <p>No proxies configured</p>
                                        <p>Add proxies to improve trending effectiveness</p>
                                    </div>
                                ) : (
                                    <div className="proxy-list">
                                        <table className="data-table">
                                            <thead>
                                            <tr>
                                                <th>URL</th>
                                                <th>Type</th>
                                                <th>Status</th>
                                                <th>Success</th>
                                                <th>Failures</th>
                                                <th>Last Used</th>
                                                <th>Actions</th>
                                            </tr>
                                            </thead>
                                            <tbody>
                                            {proxies.map(proxy => {
                                                // Mask proxy credentials in URL
                                                const displayUrl = proxy.url.replace(
                                                    /(socks5|http|https):\/\/([^:@\/]+:[^:@\/]+@)?([^:@\/]+)(:[0-9]+)/,
                                                    '$1://*****@$3$4'
                                                );

                                                return (
                                                    <tr key={proxy.id}>
                                                        <td>{displayUrl}</td>
                                                        <td>{proxy.type.toUpperCase()}</td>
                                                        <td>
                                                            <StatusBadge status={
                                                                proxy.status === 'working' ? 'success' :
                                                                    proxy.status === 'failed' ? 'failed' : 'warning'
                                                            } />
                                                        </td>
                                                        <td>{proxy.successCount}</td>
                                                        <td>{proxy.failCount}</td>
                                                        <td>{proxy.lastUsed ? new Date(proxy.lastUsed).toLocaleString() : 'Never'}</td>
                                                        <td>
                                                            <button
                                                                className="button button-small button-danger"
                                                                onClick={() => handleRemoveProxy(proxy.id)}
                                                            >
                                                                Remove
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                            <div className="add-proxy-section card">
                                <h3>Add New Proxies</h3>

                                <form onSubmit={handleProxyFormSubmit} className="proxy-form">
                                    <div className="form-group">
                                        <label htmlFor="proxies">Proxy List (One per line):</label>
                                        <textarea
                                            id="proxies"
                                            name="proxies"
                                            value={proxyForm.proxies}
                                            onChange={handleProxyFormChange}
                                            placeholder="socks5://user:pass@host:port&#10;http://user:pass@host:port"
                                            rows="10"
                                            required
                                        ></textarea>
                                        <small>
                                            Supported formats:<br />
                                            - socks5://username:password@host:port<br />
                                            - http://username:password@host:port<br />
                                            - https://username:password@host:port
                                        </small>
                                    </div>

                                    <div className="form-actions">
                                        <button
                                            type="submit"
                                            className="button"
                                            disabled={loading}
                                        >
                                            {loading ? 'Adding...' : 'Add Proxies'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TrendingBot;