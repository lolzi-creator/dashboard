import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Chart, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend } from 'chart.js';
import { Line, Bar } from 'react-chartjs-2'; // Added Bar import here
import { getActiveBoosts } from '../api/boostService';
import { getRecentTransactions } from '../api/transactionService';
import LoadingSpinner from '../components/common/LoadingSpinner';

// Register Chart.js components
Chart.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend);

const Dashboard = () => {
    const [activeBoosts, setActiveBoosts] = useState([]);
    const [recentTransactions, setRecentTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // Fetch active boosts
                const boostsData = await getActiveBoosts();
                setActiveBoosts(boostsData.boosts || []);

                // Fetch recent transactions
                const txData = await getRecentTransactions(5);
                setRecentTransactions(txData.transactions || []);

                setLoading(false);
            } catch (err) {
                setError('Failed to load dashboard data');
                setLoading(false);
            }
        };

        fetchData();

        // Refresh data every 30 seconds
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, []);

    // Calculate statistics
    const totalActiveVolume = activeBoosts.reduce((sum, boost) =>
        sum + (parseFloat(boost.currentVolume) || 0), 0);

    const totalTargetVolume = activeBoosts.reduce((sum, boost) =>
        sum + (parseFloat(boost.targetVolume) || 0), 0);

    const overallProgress = totalTargetVolume > 0
        ? (totalActiveVolume / totalTargetVolume) * 100
        : 0;

    // Buy/sell data for chart
    const buyVolume = activeBoosts.reduce((sum, boost) =>
        sum + (parseFloat(boost.buyVolume) || 0), 0);

    const sellVolume = activeBoosts.reduce((sum, boost) =>
        sum + (parseFloat(boost.sellVolume) || 0), 0);

    const totalTrades = activeBoosts.reduce((sum, boost) =>
        sum + (boost.tradeCount || 0), 0);

    const successRate = activeBoosts.reduce((sum, boost) => {
        const boostRate = boost.successRate ? parseFloat(boost.successRate) : 0;
        return sum + boostRate;
    }, 0) / (activeBoosts.length || 1);

    // Chart data
    const volumeData = {
        labels: ['Buy Volume', 'Sell Volume'],
        datasets: [
            {
                data: [buyVolume, sellVolume],
                backgroundColor: ['rgba(59, 130, 246, 0.6)', 'rgba(239, 68, 68, 0.6)'],
                borderColor: ['rgba(59, 130, 246, 1)', 'rgba(239, 68, 68, 1)'],
                borderWidth: 1
            }
        ]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    color: '#94a3b8',
                    font: {
                        size: 12,
                        family: "'Inter', sans-serif"
                    },
                    padding: 20
                }
            },
            tooltip: {
                backgroundColor: '#1e293b',
                titleFont: {
                    size: 14,
                    family: "'Inter', sans-serif"
                },
                bodyFont: {
                    size: 12,
                    family: "'Inter', sans-serif"
                },
                padding: 12,
                boxPadding: 6
            }
        }
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="dashboard-page">
            <div className="dashboard-header">
                <div>
                    <h1>Dashboard</h1>
                    <p>Real-time trading metrics and performance</p>
                </div>
                <Link to="/boosts" className="button">
                    Manage Boosts
                </Link>
            </div>

            <div className="metrics-grid">
                <div className="metric-card active-boosts">
                    <div className="metric-header">
                        <h3 className="metric-title">Active Boosts</h3>
                        <div className="metric-icon">🚀</div>
                    </div>
                    <div className="metric-value">{activeBoosts.length}</div>
                </div>

                <div className="metric-card total-volume">
                    <div className="metric-header">
                        <h3 className="metric-title">Total Volume</h3>
                        <div className="metric-icon">📊</div>
                    </div>
                    <div className="metric-value">${totalActiveVolume.toFixed(2)}</div>
                </div>

                <div className="metric-card success-rate">
                    <div className="metric-header">
                        <h3 className="metric-title">Success Rate</h3>
                        <div className="metric-icon">✓</div>
                    </div>
                    <div className="metric-value">{successRate.toFixed(1)}%</div>
                </div>

                <div className="metric-card total-trades">
                    <div className="metric-header">
                        <h3 className="metric-title">Total Trades</h3>
                        <div className="metric-icon">🔄</div>
                    </div>
                    <div className="metric-value">{totalTrades}</div>
                </div>
            </div>

            <div className="progress-card">
                <h2>Volume Progress</h2>
                <div className="progress-container">
                    <div className="modern-progress">
                        <div
                            className="progress-fill"
                            style={{ width: `${Math.min(overallProgress, 100)}%` }}
                        ></div>
                    </div>
                    <div className="progress-stats">
                        <div className="progress-label">
                            {overallProgress.toFixed(1)}% Complete
                        </div>
                        <div className="progress-values">
                            ${totalActiveVolume.toFixed(2)} / ${totalTargetVolume.toFixed(2)}
                        </div>
                    </div>
                </div>
            </div>

            <div className="dashboard-grid">
                <div className="chart-card">
                    <div className="card-header">
                        <h2>Volume Distribution</h2>
                    </div>
                    <div className="chart-container">
                        {buyVolume > 0 || sellVolume > 0 ? (
                            <div style={{ height: '100%', width: '100%' }}>
                                <Bar data={volumeData} options={chartOptions} />
                            </div>
                        ) : (
                            <div className="empty-state">
                                <div className="empty-icon">📊</div>
                                <p className="empty-text">No volume data available</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="transactions-card">
                    <div className="card-header">
                        <h2>Recent Transactions</h2>
                        <Link to="/transactions" className="view-all">
                            View All
                        </Link>
                    </div>
                    {recentTransactions.length > 0 ? (
                        <div className="transactions-list">
                            {recentTransactions.map((tx, index) => (
                                <div key={index} className="transaction-item">
                                    <div className="transaction-icon">
                                        <span className={tx.type === 'BUY' ? 'buy-icon' : 'sell-icon'}>
                                            {tx.type === 'BUY' ? '↑' : '↓'}
                                        </span>
                                    </div>
                                    <div className="transaction-details">
                                        <div className="transaction-main">
                                            <span className={tx.type === 'BUY' ? 'buy-text' : 'sell-text'}>
                                                {tx.type}
                                            </span>
                                            <span className="transaction-amount">
                                                ${tx.value?.toFixed(2) || '0.00'}
                                            </span>
                                        </div>
                                        <div className="transaction-meta">
                                            <span className="transaction-time">
                                                {new Date(tx.time).toLocaleTimeString()}
                                            </span>
                                            <span className={`transaction-status ${tx.status}`}>
                                                {tx.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-state">
                            <div className="empty-icon">📝</div>
                            <p className="empty-text">No recent transactions found</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;