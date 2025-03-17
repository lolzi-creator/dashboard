import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getBoostDetails, cancelBoost } from '../../api/boostService';
import { getBoostTransactions, getBoostLogs } from '../../api/transactionService';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const BoostDetails = () => {
    const { boostId } = useParams();
    const navigate = useNavigate();

    const [boost, setBoost] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [chartData, setChartData] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // Fetch boost details
                const boostData = await getBoostDetails(boostId);
                setBoost(boostData);

                // Fetch transactions
                const txData = await getBoostTransactions(boostId);
                setTransactions(txData.transactions || []);

                // Fetch logs
                const logsData = await getBoostLogs(boostId);
                setLogs(logsData.logs || []);

                // Prepare chart data if transactions exist
                if (txData.transactions && txData.transactions.length > 0) {
                    prepareChartData(txData.transactions);
                }

                setLoading(false);
            } catch (err) {
                setError(err.message);
                setLoading(false);
            }
        };

        fetchData();

        // Poll for updates every 20 seconds
        const interval = setInterval(fetchData, 20000);
        return () => clearInterval(interval);
    }, [boostId]);

    const prepareChartData = (txData) => {
        // Group transactions by hour for time series
        const txByHour = {};
        const buyVolume = {};
        const sellVolume = {};

        txData.forEach(tx => {
            const date = new Date(tx.timestamp);
            const hourKey = `${date.getMonth()+1}/${date.getDate()} ${date.getHours()}:00`;

            txByHour[hourKey] = (txByHour[hourKey] || 0) + 1;

            if (tx.side === 'buy') {
                buyVolume[hourKey] = (buyVolume[hourKey] || 0) + (tx.value || 0);
            } else {
                sellVolume[hourKey] = (sellVolume[hourKey] || 0) + (tx.value || 0);
            }
        });

        // Sort hours chronologically
        const sortedHours = Object.keys(txByHour).sort((a, b) => {
            const dateA = new Date(a);
            const dateB = new Date(b);
            return dateA - dateB;
        });

        setChartData({
            labels: sortedHours,
            datasets: [
                {
                    label: 'Buy Volume ($)',
                    data: sortedHours.map(hour => buyVolume[hour] || 0),
                    borderColor: 'rgba(16, 185, 129, 1)',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'Sell Volume ($)',
                    data: sortedHours.map(hour => sellVolume[hour] || 0),
                    borderColor: 'rgba(239, 68, 68, 1)',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    tension: 0.4,
                    fill: true
                }
            ]
        });
    };

    const handleCancel = async () => {
        if (window.confirm('Are you sure you want to cancel this boost?')) {
            try {
                await cancelBoost(boostId);
                navigate('/boosts');
            } catch (err) {
                setError(`Failed to cancel boost: ${err.message}`);
            }
        }
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner">
                    <div className="spinner-border" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
                <p>Loading boost details...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="error-container">
                <div className="error-icon">⚠️</div>
                <h3>Error Loading Boost Details</h3>
                <p>{error}</p>
                <button
                    className="button button-primary"
                    onClick={() => navigate('/boosts')}
                >
                    Back to Boosts
                </button>
            </div>
        );
    }

    if (!boost) {
        return (
            <div className="not-found-container">
                <div className="error-icon">🔍</div>
                <h3>Boost Not Found</h3>
                <p>The boost you're looking for doesn't exist or was removed.</p>
                <button
                    className="button button-primary"
                    onClick={() => navigate('/boosts')}
                >
                    Back to Boosts
                </button>
            </div>
        );
    }

    const calculatedRatio = () => {
        if (!boost.buyVolume && !boost.sellVolume) return 0;
        return boost.buyVolume / (boost.buyVolume + boost.sellVolume) * 100;
    };

    return (
        <div className="boost-details-page">
            <div className="page-header">
                <div className="header-content">
                    <h1>Boost Details</h1>
                    <p className="token-id">Token: {boost.token}</p>
                </div>
                <div className="header-actions">
                    <button
                        className="button"
                        onClick={() => navigate('/boosts')}
                    >
                        Back to Boosts
                    </button>
                    {boost.active && (
                        <button
                            className="button button-danger"
                            onClick={handleCancel}
                        >
                            Cancel Boost
                        </button>
                    )}
                </div>
            </div>

            <div className="boost-summary-cards">
                <div className="boost-card">
                    <div className="boost-card-header">
                        <h3>Boost ID</h3>
                    </div>
                    <div className="boost-card-value">{boost.boostId}</div>
                    <div className="boost-card-footer">
                        <div className={`status-badge ${boost.active ? 'active' : 'inactive'}`}>
                            {boost.active ? 'Active' : 'Inactive'}
                        </div>
                    </div>
                </div>

                <div className="boost-card volume-card">
                    <div className="boost-card-header">
                        <h3>Volume</h3>
                    </div>
                    <div className="boost-card-value">${boost.currentVolume ? boost.currentVolume.toFixed(2) : '0.00'}</div>
                    <div className="boost-card-footer">
                        <div className="progress-container">
                            <div className="modern-progress">
                                <div
                                    className="progress-fill"
                                    style={{width: `${boost.volumeProgress || 0}%`}}
                                ></div>
                            </div>
                            <div className="progress-stats">
                                <span className="progress-text">
                                    {boost.volumeProgress || 0}% of ${boost.targetVolume}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="boost-card success-card">
                    <div className="boost-card-header">
                        <h3>Success Rate</h3>
                    </div>
                    <div className="boost-card-value">{boost.successRate || 0}%</div>
                    <div className="boost-card-footer">
                        <span className="trades-summary">
                            {boost.successfulTrades || 0} successful / {boost.failedTrades || 0} failed
                        </span>
                    </div>
                </div>

                <div className="boost-card time-card">
                    <div className="boost-card-header">
                        <h3>Remaining Time</h3>
                    </div>
                    <div className="boost-card-value">{boost.remainingTime || '0h 0m'}</div>
                    <div className="boost-card-footer">
                        <span className="trades-count">
                            {boost.totalTrades || 0} total trades
                        </span>
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
                        className={activeTab === 'transactions' ? 'active' : ''}
                        onClick={() => setActiveTab('transactions')}
                    >
                        Transactions
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
                            <div className="stats-row">
                                <div className="stat-card">
                                    <h3>Trading Statistics</h3>
                                    <div className="stats-grid">
                                        <div className="stat-item">
                                            <span className="stat-label">Buy Volume</span>
                                            <span className="stat-value buy-text">
                                                ${boost.buyVolume ? boost.buyVolume.toFixed(2) : '0.00'}
                                            </span>
                                        </div>
                                        <div className="stat-item">
                                            <span className="stat-label">Sell Volume</span>
                                            <span className="stat-value sell-text">
                                                ${boost.sellVolume ? boost.sellVolume.toFixed(2) : '0.00'}
                                            </span>
                                        </div>
                                        <div className="stat-item">
                                            <span className="stat-label">Total Trades</span>
                                            <span className="stat-value">
                                                {boost.totalTrades || 0}
                                            </span>
                                        </div>
                                        <div className="stat-item">
                                            <span className="stat-label">Average Trade Size</span>
                                            <span className="stat-value">
                                                ${boost.totalTrades ? (boost.currentVolume / boost.totalTrades).toFixed(2) : '0.00'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="ratio-card">
                                    <h3>Buy/Sell Ratio</h3>
                                    <div className="ratio-container">
                                        <div className="ratio-bar">
                                            <div
                                                className="buy-ratio"
                                                style={{width: `${calculatedRatio()}%`}}
                                            ></div>
                                        </div>
                                        <div className="ratio-labels">
                                            <span className="buy-label">Buy: {calculatedRatio().toFixed(1)}%</span>
                                            <span className="sell-label">Sell: {(100 - calculatedRatio()).toFixed(1)}%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {chartData && (
                                <div className="chart-container">
                                    <h3>Volume Over Time</h3>
                                    <div className="chart-wrapper">
                                        <Line
                                            data={chartData}
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
                            )}
                        </div>
                    )}

                    {activeTab === 'transactions' && (
                        <div className="transactions-tab">
                            <h3>Transactions</h3>
                            {transactions.length === 0 ? (
                                <div className="empty-state">
                                    <div className="empty-icon">💸</div>
                                    <p>No transactions recorded yet</p>
                                    <p className="empty-subtext">Transactions will appear here once trading begins</p>
                                </div>
                            ) : (
                                <div className="transactions-table-container">
                                    <table className="modern-table">
                                        <thead>
                                        <tr>
                                            <th>Time</th>
                                            <th>Type</th>
                                            <th>Amount</th>
                                            <th>Price</th>
                                            <th>Value</th>
                                            <th>Status</th>
                                            <th>Transaction</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {transactions.map((tx, index) => (
                                            <tr key={index} className={tx.success ? '' : 'error-row'}>
                                                <td>{new Date(tx.timestamp).toLocaleString()}</td>
                                                <td className={tx.side === 'buy' ? 'buy-text' : 'sell-text'}>
                                                    {tx.side?.toUpperCase()}
                                                </td>
                                                <td>{tx.size}</td>
                                                <td>${typeof tx.price === 'number' ? tx.price.toFixed(2) : '0.00'}</td>
                                                <td>${typeof tx.value === 'number' ? tx.value.toFixed(2) : '0.00'}</td>
                                                <td>
                                                        <span className={`status-badge ${tx.success ? 'success' : 'failed'}`}>
                                                            {tx.success ? 'Success' : 'Failed'}
                                                        </span>
                                                </td>
                                                <td>
                                                    {tx.signature ? (
                                                        <a
                                                            href={`https://solscan.io/tx/${tx.signature}`}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="tx-link"
                                                        >
                                                            {tx.signature.substring(0, 8)}...
                                                        </a>
                                                    ) : 'N/A'}
                                                </td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'logs' && (
                        <div className="logs-tab">
                            <h3>Transaction Logs</h3>
                            {logs.length === 0 ? (
                                <div className="empty-state">
                                    <div className="empty-icon">📝</div>
                                    <p>No logs recorded yet</p>
                                    <p className="empty-subtext">Operation logs will appear here once trading begins</p>
                                </div>
                            ) : (
                                <div className="logs-container">
                                    {logs.map((log, index) => (
                                        <div key={index} className={`log-entry ${log.type}`}>
                                            <div className="log-header">
                                                <span className="log-time">{new Date(log.timestamp).toLocaleString()}</span>
                                                <span className="log-type">{log.type.toUpperCase()}</span>
                                            </div>
                                            <div className="log-content">
                                                {log.type === 'error' ? (
                                                    <span className="error-message">{log.message}</span>
                                                ) : log.type === 'success' ? (
                                                    <span>
                                                        {log.side?.toUpperCase()} successful for {log.amount}
                                                        {log.txid && <span> - Tx: {log.txid.substring(0, 8)}...</span>}
                                                    </span>
                                                ) : log.type === 'transaction' ? (
                                                    <span>Transaction sent: {log.txid.substring(0, 8)}...</span>
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

export default BoostDetails;