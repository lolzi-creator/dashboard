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
    const [activeTab, setActiveTab] = useState('overview');

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
                prepareChartData(logsData.logs || []);

                setLoading(false);
            } catch (err) {
                setError(err.message);
                setLoading(false);
            }
        };

        fetchData();

        // Poll for updates
        const interval = setInterval(fetchData, 20000);
        return () => clearInterval(interval);
    }, [jobId]);

    const prepareChartData = (logs) => {
        if (!logs || logs.length === 0) return;

        // Filter only success logs for transactions
        const successLogs = logs.filter(log => log.type === 'success');

        // Group logs by hour
        const logsByHour = {};
        const buyVsSell = { buy: 0, sell: 0 };

        successLogs.forEach(log => {
            // Count buys vs sells
            if (log.isBuy) {
                buyVsSell.buy++;
            } else {
                buyVsSell.sell++;
            }

            // Group by hour for time-based chart
            const timestamp = new Date(log.timestamp);
            const hour = timestamp.getHours();

            if (!logsByHour[hour]) {
                logsByHour[hour] = { count: 0, timestamp };
            }

            logsByHour[hour].count++;
        });

        // Sort hours
        const sortedHours = Object.keys(logsByHour).sort((a, b) => a - b);

        // Create time-based data
        const timeLabels = sortedHours.map(hour => `${hour}:00`);
        const transactionCounts = sortedHours.map(hour => logsByHour[hour].count);

        // Success rate data
        const totalTxs = job ? job.transactionCount : 0;
        const successRate = job && totalTxs > 0 ?
            (job.successfulTransactions / totalTxs * 100) : 0;
        const failRate = totalTxs > 0 ? 100 - successRate : 0;

        setChartData({
            transactions: {
                labels: timeLabels,
                datasets: [
                    {
                        label: 'Transactions per Hour',
                        data: transactionCounts,
                        borderColor: 'rgba(75, 192, 192, 1)',
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        tension: 0.4
                    }
                ]
            },
            successRate: {
                labels: ['Success', 'Failed'],
                datasets: [
                    {
                        label: 'Transaction Success Rate',
                        data: [successRate, failRate],
                        backgroundColor: [
                            'rgba(75, 192, 192, 0.6)',
                            'rgba(255, 99, 132, 0.6)'
                        ],
                        borderColor: [
                            'rgba(75, 192, 192, 1)',
                            'rgba(255, 99, 132, 1)'
                        ],
                        borderWidth: 1
                    }
                ]
            },
            buyVsSell: {
                labels: ['Buy', 'Sell'],
                datasets: [
                    {
                        label: 'Buy vs Sell Transactions',
                        data: [buyVsSell.buy, buyVsSell.sell],
                        backgroundColor: [
                            'rgba(54, 162, 235, 0.6)',
                            'rgba(255, 159, 64, 0.6)'
                        ],
                        borderColor: [
                            'rgba(54, 162, 235, 1)',
                            'rgba(255, 159, 64, 1)'
                        ],
                        borderWidth: 1
                    }
                ]
            }
        });
    };

    const handleStop = async () => {
        if (window.confirm('Are you sure you want to stop this ranking job?')) {
            try {
                await stopRankingJob(jobId);
                navigate('/ranking');
            } catch (err) {
                setError(`Failed to stop ranking job: ${err.message}`);
            }
        }
    };

    if (loading) return <LoadingSpinner />;
    if (error) return <p className="error-message">Error: {error}</p>;
    if (!job) return <p>Ranking job not found</p>;

    return (
        <div className="ranking-job-details">
            <div className="detail-header">
                <h2>Ranking Job Details</h2>
                {job.active && (
                    <button className="button button-danger" onClick={handleStop}>
                        Stop Job
                    </button>
                )}
            </div>

            <div className="detail-card">
                <div className="detail-summary">
                    <div className="detail-row">
                        <span className="detail-label">Job ID:</span>
                        <span className="detail-value">{job.id}</span>
                    </div>
                    <div className="detail-row">
                        <span className="detail-label">Token:</span>
                        <span className="detail-value">{job.tokenAddress}</span>
                    </div>
                    <div className="detail-row">
                        <span className="detail-label">DEX Type:</span>
                        <span className="detail-value">{job.dexType}</span>
                    </div>
                    <div className="detail-row">
                        <span className="detail-label">Status:</span>
                        <StatusBadge status={job.active ? 'active' : 'inactive'} />
                    </div>
                    <div className="detail-row">
                        <span className="detail-label">Progress:</span>
                        <div className="progress-bar">
                            <div
                                className="progress-fill"
                                style={{width: `${job.progress || 0}%`}}
                            ></div>
                            <span>{job.progress || 0}%</span>
                        </div>
                    </div>
                    <div className="detail-row">
                        <span className="detail-label">Transactions:</span>
                        <span className="detail-value">{job.transactionCount || 0}</span>
                    </div>
                    <div className="detail-row">
                        <span className="detail-label">Successful:</span>
                        <span className="detail-value">{job.successfulTransactions || 0}</span>
                    </div>
                    <div className="detail-row">
                        <span className="detail-label">Failed:</span>
                        <span className="detail-value">{job.failedTransactions || 0}</span>
                    </div>
                    <div className="detail-row">
                        <span className="detail-label">Success Rate:</span>
                        <span className="detail-value">
                            {job.transactionCount > 0
                                ? `${((job.successfulTransactions / job.transactionCount) * 100).toFixed(1)}%`
                                : '0.0%'}
                        </span>
                    </div>
                    <div className="detail-row">
                        <span className="detail-label">Start Time:</span>
                        <span className="detail-value">{new Date(job.startTime).toLocaleString()}</span>
                    </div>
                    <div className="detail-row">
                        <span className="detail-label">End Time:</span>
                        <span className="detail-value">{new Date(job.endTime).toLocaleString()}</span>
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
                            <h3>Ranking Strategy</h3>

                            <div className="strategy-summary">
                                <div className="detail-row">
                                    <span className="detail-label">DEX Type:</span>
                                    <span className="detail-value">{job.dexType}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">Transactions Per Hour:</span>
                                    <span className="detail-value">{job.transactionsPerHour}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">Trade Size:</span>
                                    <span className="detail-value">${job.tradeSize}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">Maker Only:</span>
                                    <span className="detail-value">{job.makerOnly ? 'Yes' : 'No'}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">Staggered Execution:</span>
                                    <span className="detail-value">{job.staggered ? 'Yes' : 'No'}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">Duration:</span>
                                    <span className="detail-value">{job.duration} hours</span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label">Wallet Batch:</span>
                                    <span className="detail-value">{job.walletBatchId}</span>
                                </div>
                            </div>

                            <h3>Progress Statistics</h3>

                            <div className="stats-summary">
                                <div className="stat-card">
                                    <h4>Success Rate</h4>
                                    <div className="big-number">
                                        {job.transactionCount > 0
                                            ? `${((job.successfulTransactions / job.transactionCount) * 100).toFixed(1)}%`
                                            : '0.0%'}
                                    </div>
                                    <div className="stat-details">
                                        <div>Success: {job.successfulTransactions || 0}</div>
                                        <div>Failed: {job.failedTransactions || 0}</div>
                                    </div>
                                </div>

                                <div className="stat-card">
                                    <h4>Estimated Volume</h4>
                                    <div className="big-number">${(job.transactionCount * job.tradeSize).toFixed(2)}</div>
                                    <div className="stat-details">
                                        <div>{job.transactionCount || 0} transactions</div>
                                        <div>${job.tradeSize} per transaction</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'charts' && (
                        <div className="charts-container">
                            <h3>Performance Charts</h3>

                            {chartData ? (
                                <div className="charts-grid">
                                    <div className="chart-box">
                                        <h4>Transactions by Hour</h4>
                                        <div className="chart-wrapper" style={{ height: '250px' }}>
                                            <Line
                                                data={chartData.transactions}
                                                options={{
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
                                                                color: '#a8a8bd'
                                                            }
                                                        }
                                                    },
                                                    plugins: {
                                                        legend: {
                                                            labels: {
                                                                color: '#fff'
                                                            }
                                                        },
                                                        title: {
                                                            display: true,
                                                            text: 'Transaction Volume by Hour',
                                                            color: '#fff'
                                                        }
                                                    }
                                                }}
                                            />
                                        </div>
                                    </div>

                                    <div className="chart-box">
                                        <h4>Success Rate</h4>
                                        <div className="chart-wrapper" style={{ height: '250px' }}>
                                            <Bar
                                                data={chartData.successRate}
                                                options={{
                                                    maintainAspectRatio: false,
                                                    scales: {
                                                        y: {
                                                            beginAtZero: true,
                                                            max: 100,
                                                            grid: {
                                                                color: 'rgba(255, 255, 255, 0.1)'
                                                            },
                                                            ticks: {
                                                                color: '#a8a8bd',
                                                                callback: (value) => value + '%'
                                                            }
                                                        },
                                                        x: {
                                                            grid: {
                                                                color: 'rgba(255, 255, 255, 0.1)'
                                                            },
                                                            ticks: {
                                                                color: '#a8a8bd'
                                                            }
                                                        }
                                                    },
                                                    plugins: {
                                                        legend: {
                                                            display: false
                                                        },
                                                        title: {
                                                            display: true,
                                                            text: 'Transaction Success Rate',
                                                            color: '#fff'
                                                        }
                                                    }
                                                }}
                                            />
                                        </div>
                                    </div>

                                    <div className="chart-box">
                                        <h4>Buy vs Sell Distribution</h4>
                                        <div className="chart-wrapper" style={{ height: '250px' }}>
                                            <Bar
                                                data={chartData.buyVsSell}
                                                options={{
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
                                                                color: '#a8a8bd'
                                                            }
                                                        }
                                                    },
                                                    plugins: {
                                                        legend: {
                                                            display: false
                                                        },
                                                        title: {
                                                            display: true,
                                                            text: 'Buy vs Sell Transactions',
                                                            color: '#fff'
                                                        }
                                                    }
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <p>No chart data available yet. This will populate as transactions are processed.</p>
                            )}
                        </div>
                    )}

                    {activeTab === 'logs' && (
                        <div className="logs-container">
                            <h3>Transaction Logs</h3>

                            {logs.length === 0 ? (
                                <p>No logs found for this ranking job.</p>
                            ) : (
                                <div className="logs-list">
                                    {logs.map((log, index) => (
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
                                                ) : log.type === 'start' ? (
                                                    <span>{log.message}</span>
                                                ) : log.type === 'end' ? (
                                                    <span>{log.message}</span>
                                                ) : (
                                                    <pre>{JSON.stringify(log, null, 2)}</pre>
                                                )}
                                            </div>
                                        </div>
                                    ))}
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