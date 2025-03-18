import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getActiveBoosts } from '../api/boostService';
import { getActiveRankingJobs } from '../api/rankingService';
import { getRecentTransactions } from '../api/transactionService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
);

const Dashboard = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview');
    const [volumeSubTab, setVolumeSubTab] = useState('active');
    const [rankingSubTab, setRankingSubTab] = useState('active');

    const [activeBoosts, setActiveBoosts] = useState([]);
    const [activeRankingJobs, setActiveRankingJobs] = useState([]);
    const [recentTransactions, setRecentTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // Fetch active boosts
                const boostsData = await getActiveBoosts();
                setActiveBoosts(boostsData.boosts || []);

                // Fetch active ranking jobs
                const rankingData = await getActiveRankingJobs();
                setActiveRankingJobs(rankingData.jobs || []);

                // Fetch recent transactions
                const txData = await getRecentTransactions(5);
                setRecentTransactions(txData.transactions || []);

                setLoading(false);
            } catch (err) {
                console.error("Error loading dashboard data:", err);
                setError('Failed to load dashboard data');
                setLoading(false);
            }
        };

        fetchData();

        // Refresh data every 30 seconds
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, [setError]);

    // Calculate volume statistics
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

    const successRate = activeBoosts.length > 0 ?
        activeBoosts.reduce((sum, boost) => {
            const boostRate = boost.successRate ? parseFloat(boost.successRate) : 0;
            return sum + boostRate;
        }, 0) / activeBoosts.length : 0;

    // Ranking statistics
    const totalRankingJobs = activeRankingJobs.length;
    const totalRankingTx = activeRankingJobs.reduce((sum, job) => sum + (job.transactionCount || 0), 0);
    const totalSuccessfulTx = activeRankingJobs.reduce((sum, job) => sum + (job.successfulTransactions || 0), 0);
    const rankingSuccessRate = totalRankingTx > 0 ? (totalSuccessfulTx / totalRankingTx) * 100 : 0;

    // Volume Distribution Chart data
    const volumeData = {
        labels: ['Buy Volume', 'Sell Volume'],
        datasets: [
            {
                data: [buyVolume, sellVolume],
                backgroundColor: ['rgba(16, 185, 129, 0.6)', 'rgba(239, 68, 68, 0.6)'],
                borderColor: ['rgba(16, 185, 129, 1)', 'rgba(239, 68, 68, 1)'],
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

    // Main Subnav
    const renderMainSubnav = () => (
        <div className="main-subnav">
            <button
                className={`subnav-button ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => setActiveTab('overview')}
            >
                Overview
            </button>
            <button
                className={`subnav-button ${activeTab === 'volume' ? 'active' : ''}`}
                onClick={() => setActiveTab('volume')}
            >
                Volume Bot
            </button>
            <button
                className={`subnav-button ${activeTab === 'ranking' ? 'active' : ''}`}
                onClick={() => setActiveTab('ranking')}
            >
                Ranking Bot
            </button>
        </div>
    );

    // Volume Subnav
    const renderVolumeSubnav = () => (
        <div className="secondary-subnav">
            <button
                className={`subnav-button-secondary ${volumeSubTab === 'active' ? 'active' : ''}`}
                onClick={() => setVolumeSubTab('active')}
            >
                Active Boosts
            </button>
            <button
                className={`subnav-button-secondary ${volumeSubTab === 'queued' ? 'active' : ''}`}
                onClick={() => setVolumeSubTab('queued')}
            >
                Queued Boosts
            </button>
            <button
                className={`subnav-button-secondary ${volumeSubTab === 'completed' ? 'active' : ''}`}
                onClick={() => setVolumeSubTab('completed')}
            >
                Completed
            </button>
            <button
                className="subnav-button-secondary action"
                onClick={() => navigate('/boosts')}
            >
                + New Boost
            </button>
        </div>
    );

    // Ranking Subnav
    const renderRankingSubnav = () => (
        <div className="secondary-subnav">
            <button
                className={`subnav-button-secondary ${rankingSubTab === 'active' ? 'active' : ''}`}
                onClick={() => setRankingSubTab('active')}
            >
                Active Jobs
            </button>
            <button
                className={`subnav-button-secondary ${rankingSubTab === 'completed' ? 'active' : ''}`}
                onClick={() => setRankingSubTab('completed')}
            >
                Completed Jobs
            </button>
            <button
                className="subnav-button-secondary action"
                onClick={() => navigate('/ranking')}
            >
                + New Job
            </button>
        </div>
    );

    // Overview Tab Content
    const renderOverviewTab = () => (
        <>
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

                <div className="metric-card rankings">
                    <div className="metric-header">
                        <h3 className="metric-title">Ranking Jobs</h3>
                        <div className="metric-icon">📈</div>
                    </div>
                    <div className="metric-value">{activeRankingJobs.length}</div>
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
                            {recentTransactions.map((tx, index) => {
                                const txType = tx.side || tx.type;
                                return (
                                    <div key={index} className="transaction-item">
                                        <div className="transaction-icon">
                                        <span className={txType === 'buy' || txType === 'BUY' ? 'buy-icon' : 'sell-icon'}>
                                            {txType === 'buy' || txType === 'BUY' ? '↑' : '↓'}
                                        </span>
                                        </div>
                                        <div className="transaction-details">
                                            <div className="transaction-main">
                                            <span className={txType === 'buy' || txType === 'BUY' ? 'buy-text' : 'sell-text'}>
                                                {txType?.toUpperCase()}
                                            </span>
                                                <span className="transaction-amount">
                                                ${tx.value?.toFixed(2) || '0.00'}
                                            </span>
                                            </div>
                                            <div className="transaction-meta">
                                            <span className="transaction-time">
                                                {new Date(tx.timestamp || tx.time).toLocaleTimeString()}
                                            </span>
                                                <span className={`transaction-status ${tx.success ? 'success' : 'failed'}`}>
                                                {tx.success ? 'SUCCESS' : 'FAILED'}
                                            </span>
                                            </div>
                                        </div>
                                    </div>
                                )})}
                        </div>
                    ) : (
                        <div className="empty-state">
                            <div className="empty-icon">📝</div>
                            <p className="empty-text">No recent transactions found</p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );

    // Volume Tab Content
    const renderVolumeTab = () => (
        <>
            {renderVolumeSubnav()}

            {volumeSubTab === 'active' && (
                <div className="volume-active-container">
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

                    <div className="card">
                        <div className="card-header">
                            <h2>Active Boosts</h2>
                            <Link to="/boosts" className="view-all">View All</Link>
                        </div>
                        <div className="card-content">
                            {activeBoosts.length === 0 ? (
                                <div className="empty-state">
                                    <div className="empty-icon">🚀</div>
                                    <p className="empty-text">No active boosts found</p>
                                    <button
                                        className="button"
                                        onClick={() => navigate('/boosts')}
                                    >
                                        Create Your First Boost
                                    </button>
                                </div>
                            ) : (
                                <table className="data-table">
                                    <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Token</th>
                                        <th>Progress</th>
                                        <th>Volume</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {activeBoosts.map(boost => {
                                        const progress = parseFloat(boost.volumeProgress) || 0;
                                        return (
                                            <tr key={boost.boostId}>
                                                <td>{boost.boostId.substring(0, 8)}...</td>
                                                <td>{boost.token.substring(0, 8)}...</td>
                                                <td>
                                                    <div className="progress-bar">
                                                        <div
                                                            className="progress-fill"
                                                            style={{ width: `${progress}%` }}
                                                        ></div>
                                                        <span>{progress.toFixed(1)}%</span>
                                                    </div>
                                                </td>
                                                <td>${(boost.currentVolume || 0).toFixed(2)}/${boost.targetVolume}</td>
                                                <td>
                                                        <span className={`status-badge ${boost.active ? 'status-active' : 'status-inactive'}`}>
                                                            {boost.active ? 'Active' : 'Inactive'}
                                                        </span>
                                                </td>
                                                <td>
                                                    <Link to={`/boosts/${boost.boostId}`} className="button button-small">
                                                        Details
                                                    </Link>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {volumeSubTab === 'queued' && (
                <div className="volume-queued-container">
                    <div className="card">
                        <div className="card-header">
                            <h2>Queued Boosts</h2>
                        </div>
                        <div className="card-content">
                            <div className="empty-state">
                                <div className="empty-icon">⏱️</div>
                                <p className="empty-text">No queued boosts at the moment</p>
                                <button
                                    className="button"
                                    onClick={() => navigate('/boosts')}
                                >
                                    Add a Boost to Queue
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {volumeSubTab === 'completed' && (
                <div className="volume-completed-container">
                    <div className="card">
                        <div className="card-header">
                            <h2>Completed Boosts</h2>
                        </div>
                        <div className="card-content">
                            <div className="empty-state">
                                <div className="empty-icon">✅</div>
                                <p className="empty-text">No completed boosts to display</p>
                                <Link to="/boosts" className="button">
                                    Go to Boosts
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );

    // Ranking Tab Content
    const renderRankingTab = () => (
        <>
            {renderRankingSubnav()}

            {rankingSubTab === 'active' && (
                <div className="ranking-active-container">
                    <div className="metrics-grid">
                        <div className="metric-card" style={{
                            background: 'linear-gradient(135deg, rgba(15, 118, 110, 1) 0%, rgba(15, 118, 110, 0.3) 100%)'
                        }}>
                            <div className="metric-header">
                                <h3 className="metric-title">Active Jobs</h3>
                                <div className="metric-icon">📈</div>
                            </div>
                            <div className="metric-value">{totalRankingJobs}</div>
                        </div>

                        <div className="metric-card" style={{
                            background: 'linear-gradient(135deg, rgba(126, 34, 206, 1) 0%, rgba(126, 34, 206, 0.3) 100%)'
                        }}>
                            <div className="metric-header">
                                <h3 className="metric-title">Transactions</h3>
                                <div className="metric-icon">🔄</div>
                            </div>
                            <div className="metric-value">{totalRankingTx}</div>
                        </div>

                        <div className="metric-card" style={{
                            background: 'linear-gradient(135deg, rgba(30, 58, 138, 1) 0%, rgba(30, 58, 138, 0.3) 100%)'
                        }}>
                            <div className="metric-header">
                                <h3 className="metric-title">Success Rate</h3>
                                <div className="metric-icon">✓</div>
                            </div>
                            <div className="metric-value">{rankingSuccessRate.toFixed(1)}%</div>
                        </div>

                        <div className="metric-card" style={{
                            background: 'linear-gradient(135deg, rgba(124, 45, 18, 1) 0%, rgba(124, 45, 18, 0.3) 100%)'
                        }}>
                            <div className="metric-header">
                                <h3 className="metric-title">Completed Jobs</h3>
                                <div className="metric-icon">🏁</div>
                            </div>
                            <div className="metric-value">0</div>
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-header">
                            <h2>Active Ranking Jobs</h2>
                            <Link to="/ranking" className="view-all">View All</Link>
                        </div>
                        <div className="card-content">
                            {activeRankingJobs.length === 0 ? (
                                <div className="empty-state">
                                    <div className="empty-icon">📊</div>
                                    <p className="empty-text">No active ranking jobs found</p>
                                    <button
                                        className="button"
                                        onClick={() => navigate('/ranking')}
                                    >
                                        Create Your First Ranking Job
                                    </button>
                                </div>
                            ) : (
                                <table className="data-table">
                                    <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Token</th>
                                        <th>DEX</th>
                                        <th>Progress</th>
                                        <th>Transactions</th>
                                        <th>Actions</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {activeRankingJobs.map(job => {
                                        const progress = parseFloat(job.progress) || 0;
                                        return (
                                            <tr key={job.id}>
                                                <td>{job.id.substring(0, 8)}...</td>
                                                <td>{job.tokenAddress.substring(0, 8)}...</td>
                                                <td>{job.dexType}</td>
                                                <td>
                                                    <div className="progress-bar">
                                                        <div
                                                            className="progress-fill"
                                                            style={{
                                                                width: `${progress}%`,
                                                                background: 'linear-gradient(90deg, #3a86ff 0%, #8b5cf6 100%)'
                                                            }}
                                                        ></div>
                                                        <span>{progress.toFixed(1)}%</span>
                                                    </div>
                                                </td>
                                                <td>{job.transactionCount || 0}</td>
                                                <td>
                                                    <Link to={`/ranking/${job.id}`} className="button button-small">
                                                        Details
                                                    </Link>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {rankingSubTab === 'completed' && (
                <div className="ranking-completed-container">
                    <div className="card">
                        <div className="card-header">
                            <h2>Completed Ranking Jobs</h2>
                        </div>
                        <div className="card-content">
                            <div className="empty-state">
                                <div className="empty-icon">🏆</div>
                                <p className="empty-text">No completed ranking jobs to display</p>
                                <Link to="/ranking" className="button">
                                    Go to Ranking Jobs
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );

    if (loading && activeBoosts.length === 0 && activeRankingJobs.length === 0) {
        return <LoadingSpinner />;
    }

    return (
        <div className="dashboard-page">
            <div className="dashboard-header">
                <div>
                    <h1>Dashboard</h1>
                    <p>Real-time trading metrics and performance</p>
                </div>
                <div className="dashboard-actions">
                    <button
                        className="button"
                        onClick={() => navigate('/boosts')}
                    >
                        Create Boost
                    </button>
                    <button
                        className="button"
                        onClick={() => navigate('/ranking')}
                        style={{marginLeft: '0.75rem'}}
                    >
                        Create Ranking Job
                    </button>
                </div>
            </div>

            {renderMainSubnav()}

            <div className="dashboard-content">
                {activeTab === 'overview' && renderOverviewTab()}
                {activeTab === 'volume' && renderVolumeTab()}
                {activeTab === 'ranking' && renderRankingTab()}
            </div>
        </div>
    );
};

export default Dashboard;