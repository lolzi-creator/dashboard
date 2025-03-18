// src/components/Ranking/RankingJobDetails.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getRankingJob, getRankingJobLogs, stopRankingJob } from '../../api/rankingService';
import StatusBadge from '../common/StatusBadge';
import LoadingSpinner from '../common/LoadingSpinner';
import { Line, Bar } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend } from 'chart.js';

// Register Chart.js components
Chart.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

const RankingJobDetails = () => {
    const { jobId } = useParams();
    const navigate = useNavigate();

    const [job, setJob] = useState(null);
    const [logs, setLogs] = useState([]);
    const [chartData, setChartData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [stopping, setStopping] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // Fetch job details
                const jobData = await getRankingJob(jobId);
                setJob(jobData.job);

                // Fetch logs
                const logsData = await getRankingJobLogs(jobId);
                setLogs(logsData.logs || []);

                // Prepare chart data from logs
                prepareChartData(logsData.logs || [], jobData.job);

                setLoading(false);
            } catch (err) {
                setError(err.message);
                setLoading(false);
            }
        };

        fetchData();

        // Poll for updates if job is active
        const interval = setInterval(() => {
            if (job && job.active) {
                fetchData();
            }
        }, 10000);

        return () => clearInterval(interval);
    }, [jobId, job.active, job]);

    const prepareChartData = (logs, jobData) => {
        if (!logs || logs.length === 0 || !jobData) return;

        // Filter only success and error logs for transactions
        const txLogs = logs.filter(log => log.type === 'success' || (log.type === 'error' && log.message));

        // Group logs by hour
        const logsByHour = {};
        const successByHour = {};
        const failureByHour = {};

        // Initialize with empty hours to fill gaps
        const startTime = new Date(jobData.startTime);
        const endTime = new Date(Math.min(Date.now(), jobData.endTime));
        const hourDiff = Math.ceil((endTime - startTime) / (60 * 60 * 1000));

        for (let i = 0; i <= hourDiff; i++) {
            const hourDate = new Date(startTime.getTime() + i * 60 * 60 * 1000);
            const hourKey = hourDate.toISOString().slice(0, 13); // YYYY-MM-DDTHH format

            logsByHour[hourKey] = 0;
            successByHour[hourKey] = 0;
            failureByHour[hourKey] = 0;
        }

        // Count transactions by hour
        txLogs.forEach(log => {
            const timestamp = new Date(log.timestamp);
            const hourKey = timestamp.toISOString().slice(0, 13);

            if (hourKey in logsByHour) {
                logsByHour[hourKey]++;

                if (log.type === 'success') {
                    successByHour[hourKey]++;
                } else {
                    failureByHour[hourKey]++;
                }
            }
        });

        // Sort hours chronologically
        const sortedHours = Object.keys(logsByHour).sort();

        // Format hour labels for display
        const hourLabels = sortedHours.map(hourKey => {
            const date = new Date(hourKey);
            return `${date.getHours()}:00`;
        });

        // Prepare datasets
        const timelineData = {
            labels: hourLabels,
            datasets: [
                {
                    label: 'Transactions',
                    data: sortedHours.map(hour => logsByHour[hour]),
                    borderColor: 'rgba(59, 130, 246, 1)',
                    backgroundColor: 'rgba(59, 130, 246, 0.5)',
                    tension: 0.3,
                    pointRadius: 3
                },
                {
                    label: 'Successful',
                    data: sortedHours.map(hour => successByHour[hour]),
                    borderColor: 'rgba(16, 185, 129, 1)',
                    backgroundColor: 'rgba(16, 185, 129, 0.5)',
                    tension: 0.3,
                    pointRadius: 3
                },
                {
                    label: 'Failed',
                    data: sortedHours.map(hour => failureByHour[hour]),
                    borderColor: 'rgba(239, 68, 68, 1)',
                    backgroundColor: 'rgba(239, 68, 68, 0.5)',
                    tension: 0.3,
                    pointRadius: 3
                }
            ]
        };

        // Success vs. failure rate
        const successRate = {
            labels: ['Successful', 'Failed'],
            datasets: [
                {
                    label: 'Transactions',
                    data: [
                        jobData.successfulTransactions || 0,
                        jobData.failedTransactions || 0
                    ],
                    backgroundColor: [
                        'rgba(16, 185, 129, 0.6)',
                        'rgba(239, 68, 68, 0.6)'
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
            timeline: timelineData,
            successRate: successRate
        });
    };

    const handleStop = async () => {
        if (!window.confirm('Are you sure you want to stop this ranking job?')) {
            return;
        }

        try {
            setStopping(true);
            setError(null);
            setSuccess(null);

            const result = await stopRankingJob(jobId);

            if (result.success) {
                setSuccess(`Job ${jobId} stopped successfully`);

                // Refresh job data to show updated status
                const jobData = await getRankingJob(jobId);
                setJob(jobData.job);
            } else {
                setError(result.message || 'Failed to stop job');
            }

            setStopping(false);
        } catch (err) {
            setError(`Failed to stop ranking job: ${err.message}`);
            setStopping(false);
        }
    };

    const calculateSuccessRate = () => {
        if (!job || job.transactionCount === 0) return '0.0';
        return ((job.successfulTransactions / job.transactionCount) * 100).toFixed(1);
    };

    const formatElapsedTime = () => {
        if (!job) return 'Unknown';

        const elapsed = job.active
            ? Date.now() - job.startTime
            : job.endTime - job.startTime;

        const hours = Math.floor(elapsed / (60 * 60 * 1000));
        const minutes = Math.floor((elapsed % (60 * 60 * 1000)) / (60 * 1000));

        return `${hours}h ${minutes}m`;
    };

    if (loading) return <LoadingSpinner />;
    if (error && !job) return <div className="error-message">Error: {error}</div>;
    if (!job) return <div className="error-message">Job not found</div>;

    return (
        <div className="job-details-page">
            <div className="page-header">
                <div>
                    <h1>Ranking Job Details</h1>
                    <p>Job ID: {job.id}</p>
                </div>
                <div className="header-actions">
                    <button
                        className="button"
                        onClick={() => navigate('/ranking')}
                    >
                        Back to Ranking
                    </button>
                    {job.active && (
                        <button
                            className="button button-danger"
                            onClick={handleStop}
                            disabled={stopping}
                        >
                            {stopping ? 'Stopping...' : 'Stop Job'}
                        </button>
                    )}
                </div>
            </div>

            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            <div className="job-stats-grid">
                <div className="job-stat-card" style={{
                    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.3) 0%, rgba(30, 58, 138, 0.1) 100%)',
                    borderLeft: '3px solid #3b82f6'
                }}>
                    <h3>Status</h3>
                    <div className="job-stat-value">
                        <StatusBadge status={job.active ? 'active' : 'stopped'} />
                    </div>
                    <div className="job-stat-label">
                        {job.active ? 'Running' : 'Completed'}
                    </div>
                </div>

                <div className="job-stat-card" style={{
                    background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.3) 0%, rgba(76, 29, 149, 0.1) 100%)',
                    borderLeft: '3px solid #8b5cf6'
                }}>
                    <h3>Progress</h3>
                    <div className="job-stat-value">{job.progress || '0.0'}%</div>
                    <div className="job-stat-label">Completion</div>
                </div>

                <div className="job-stat-card" style={{
                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.3) 0%, rgba(6, 95, 70, 0.1) 100%)',
                    borderLeft: '3px solid #10b981'
                }}>
                    <h3>Success Rate</h3>
                    <div className="job-stat-value">{calculateSuccessRate()}%</div>
                    <div className="job-stat-label">
                        {job.successfulTransactions || 0} of {job.transactionCount || 0} transactions
                    </div>
                </div>

                <div className="job-stat-card" style={{
                    background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.3) 0%, rgba(146, 64, 14, 0.1) 100%)',
                    borderLeft: '3px solid #f59e0b'
                }}>
                    <h3>Running Time</h3>
                    <div className="job-stat-value">{formatElapsedTime()}</div>
                    <div className="job-stat-label">
                        Started: {new Date(job.startTime).toLocaleString()}
                    </div>
                </div>
            </div>
            <div className="modern-progress">
                <div
                    className="progress-fill"
                    style={{
                        width: `${calculateSuccessRate()}%`,
                        background: 'linear-gradient(90deg, #10b981 0%, #3b82f6 100%)'
                    }}
                ></div>
            </div>

            <div className="detail-card">
                <div className="detail-summary">
                    <div className="detail-row">
                        <span className="detail-label">Token:</span>
                        <span className="detail-value">{job.tokenAddress}</span>
                    </div>
                    <div className="detail-row">
                        <span className="detail-label">DEX Type:</span>
                        <span className="detail-value">{job.dexType}</span>
                    </div>
                    <div className="detail-row">
                        <span className="detail-label">Wallet Batch:</span>
                        <span className="detail-value">{job.walletBatchId}</span>
                    </div>
                    <div className="detail-row">
                        <span className="detail-label">Transactions/Hour:</span>
                        <span className="detail-value">{job.transactionsPerHour || 'Unknown'}</span>
                    </div>
                    <div className="detail-row">
                        <span className="detail-label">Maker Only:</span>
                        <span className="detail-value">{job.makerOnly ? 'Yes' : 'No'}</span>
                    </div>
                    <div className="detail-row">
                        <span className="detail-label">Staggered Execution:</span>
                        <span className="detail-value">{job.staggered ? 'Yes' : 'No'}</span>
                    </div>
                </div>
            </div>

            <div className="tab-container">
                <div className="tab-navigation">
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
                        Charts
                    </button>
                    <button
                        className={activeTab === 'logs' ? 'active' : ''}
                        onClick={() => setActiveTab('logs')}
                    >
                        Logs
                    </button>
                </div>

                <div className="tab-content">
                    {activeTab === 'overview' && (
                        <div className="overview-tab">
                            <h3>Job Overview</h3>

                            <div className="progress-card">
                                <h3>Transaction Progress</h3>
                                <div className="progress-container">
                                    <div className="modern-progress">
                                        <div
                                            className="progress-fill"
                                            style={{
                                                width: `${job.progress || 0}%`,
                                                background: 'linear-gradient(90deg, #8b5cf6 0%, #3b82f6 100%)'
                                            }}
                                        ></div>
                                    </div>
                                    <div className="progress-stats">
                                        <div className="progress-label">
                                            {job.progress || 0}% Complete
                                        </div>
                                        <div className="progress-values">
                                            {job.transactionCount || 0} Transactions
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {job.active && (
                                <div className="strategy-details">
                                    <h3>Job Configuration</h3>
                                    <p>
                                        This job is configured to execute {job.transactionsPerHour || 0} transactions per hour
                                        on {job.dexType} for the token {job.tokenAddress.substring(0, 8)}...
                                    </p>
                                    <p>
                                        <strong>Trade Size:</strong> ${job.tradeSize || 0} per transaction
                                    </p>
                                    <p>
                                        <strong>Estimated Completion:</strong> {new Date(job.endTime).toLocaleString()}
                                    </p>
                                </div>
                            )}

                            <div className="success-rate-card" style={{marginTop: '1.5rem'}}>
                                <h3>Transaction Success Rate</h3>

                                <div className="success-rate-stats">
                                    <div className="stats-row" style={{display: 'flex', justifyContent: 'space-between', marginBottom: '1rem'}}>
                                        <div className="stat-item">
                                            <div className="stat-label">Total Transactions</div>
                                            <div className="stat-value" style={{fontSize: '1.5rem', fontWeight: '600'}}>{job.transactionCount || 0}</div>
                                        </div>

                                        <div className="stat-item">
                                            <div className="stat-label">Successful</div>
                                            <div className="stat-value success-text" style={{fontSize: '1.5rem', fontWeight: '600', color: 'var(--color-green)'}}>{job.successfulTransactions || 0}</div>
                                        </div>

                                        <div className="stat-item">
                                            <div className="stat-label">Failed</div>
                                            <div className="stat-value error-text" style={{fontSize: '1.5rem', fontWeight: '600', color: 'var(--color-red)'}}>{job.failedTransactions || 0}</div>
                                        </div>

                                        <div className="stat-item">
                                            <div className="stat-label">Success Rate</div>
                                            <div className="stat-value" style={{fontSize: '1.5rem', fontWeight: '600'}}>{calculateSuccessRate()}%</div>
                                        </div>
                                    </div>

                                    <div className="success-rate-bar" style={{marginTop: '1rem'}}>
                                        <div className="modern-progress">
                                            <div
                                                className="progress-fill"
                                                style={{
                                                    width: `${calculateSuccessRate()}%`,
                                                    background: 'linear-gradient(90deg, var(--color-green) 0%, var(--color-blue) 100%)'
                                                }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'charts' && (
                        <div className="charts-tab">
                            {chartData ? (
                                <div className="charts-grid">
                                    <div className="chart-box">
                                        <h3>Transactions Over Time</h3>
                                        <div className="chart-wrapper" style={{ height: '300px' }}>
                                            <Line
                                                data={chartData.timeline}
                                                options={{
                                                    responsive: true,
                                                    maintainAspectRatio: false,
                                                    plugins: {
                                                        legend: {
                                                            position: 'top',
                                                            labels: {
                                                                color: '#f8fafc'
                                                            }
                                                        },
                                                        tooltip: {
                                                            backgroundColor: '#1e293b',
                                                            titleColor: '#f8fafc',
                                                            bodyColor: '#f8fafc',
                                                            borderColor: '#334155',
                                                            borderWidth: 1
                                                        }
                                                    },
                                                    scales: {
                                                        y: {
                                                            beginAtZero: true,
                                                            grid: {
                                                                color: 'rgba(255, 255, 255, 0.1)'
                                                            },
                                                            ticks: {
                                                                color: '#94a3b8'
                                                            }
                                                        },
                                                        x: {
                                                            grid: {
                                                                color: 'rgba(255, 255, 255, 0.1)'
                                                            },
                                                            ticks: {
                                                                color: '#94a3b8'
                                                            }
                                                        }
                                                    }
                                                }}
                                            />
                                        </div>
                                    </div>

                                    <div className="chart-box">
                                        <h3>Success Rate</h3>
                                        <div className="chart-wrapper" style={{ height: '300px' }}>
                                            <Bar
                                                data={chartData.successRate}
                                                options={{
                                                    responsive: true,
                                                    maintainAspectRatio: false,
                                                    plugins: {
                                                        legend: {
                                                            display: false
                                                        },
                                                        tooltip: {
                                                            backgroundColor: '#1e293b',
                                                            titleColor: '#f8fafc',
                                                            bodyColor: '#f8fafc',
                                                            borderColor: '#334155',
                                                            borderWidth: 1
                                                        }
                                                    },
                                                    scales: {
                                                        y: {
                                                            beginAtZero: true,
                                                            grid: {
                                                                color: 'rgba(255, 255, 255, 0.1)'
                                                            },
                                                            ticks: {
                                                                color: '#94a3b8'
                                                            }
                                                        },
                                                        x: {
                                                            grid: {
                                                                display: false
                                                            },
                                                            ticks: {
                                                                color: '#94a3b8'
                                                            }
                                                        }
                                                    }
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="empty-state">
                                    <div className="empty-icon">📊</div>
                                    <p className="empty-text">No chart data available</p>
                                    <p className="empty-text">Charts will appear when transaction data is available</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'logs' && (
                        <div className="logs-tab">
                            <h3>Transaction Logs</h3>

                            {logs.length === 0 ? (
                                <div className="empty-state">
                                    <div className="empty-icon">📋</div>
                                    <p className="empty-text">No logs found for this ranking job.</p>
                                </div>
                            ) : (
                                <div className="logs-container">
                                    <div className="logs-list">
                                        {logs.slice().reverse().map((log, index) => (
                                            <div key={index} className={`log-entry ${log.type}`}>
                                                <span className="log-time">{new Date(log.timestamp).toLocaleString()}</span>
                                                <span className="log-type">{log.type.toUpperCase()}</span>
                                                <div className="log-content">
                                                    {log.type === 'error' ? (
                                                        <span className="error-message">{log.message}</span>
                                                    ) : log.type === 'success' ? (
                                                        <span>
                                                            Transaction successful - {log.txid && <span>Tx: {log.txid.substring(0, 8)}...</span>}
                                                        </span>
                                                    ) : log.type === 'attempt' ? (
                                                        <span>Attempt for wallet {log.walletAddress?.substring(0, 8)}...</span>
                                                    ) : (
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

export default RankingJobDetails;