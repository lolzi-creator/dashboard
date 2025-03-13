import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Line, Doughnut } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Legend } from 'chart.js';
import DashboardSummary from '../components/Dashboard/DashboardSummary';
import BoostList from '../components/Boosts/BoostList';
import { getActiveBoosts } from '../api/boostService';
import { getCompletedBoosts } from '../api/transactionService';
import { getRecentTransactions } from '../api/transactionService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import StatusBadge from '../components/common/StatusBadge';

// Register Chart.js components
Chart.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Legend);

const Dashboard = () => {
    const [activeBoosts, setActiveBoosts] = useState([]);
    const [completedBoosts, setCompletedBoosts] = useState([]);
    const [recentTransactions, setRecentTransactions] = useState([]);
    const [volumeData, setVolumeData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // Fetch active boosts
                const boostsData = await getActiveBoosts();
                setActiveBoosts(boostsData.boosts || []);

                // Fetch completed boosts
                const completedData = await getCompletedBoosts(5);
                setCompletedBoosts(completedData.boosts || []);

                // Fetch recent transactions
                const txData = await getRecentTransactions(20);
                setRecentTransactions(txData.transactions || []);

                // Create chart data from completed boosts
                const chartData = {
                    labels: completedData.boosts.map(b => b.token.substring(0, 8)),
                    datasets: [
                        {
                            label: 'Target Volume',
                            data: completedData.boosts.map(b => b.targetVolume),
                            backgroundColor: 'rgba(75, 192, 192, 0.2)',
                            borderColor: 'rgba(75, 192, 192, 1)',
                            borderWidth: 2,
                            tension: 0.4
                        },
                        {
                            label: 'Achieved Volume',
                            data: completedData.boosts.map(b => b.achievedVolume),
                            backgroundColor: 'rgba(54, 162, 235, 0.2)',
                            borderColor: 'rgba(54, 162, 235, 1)',
                            borderWidth: 2,
                            tension: 0.4
                        }
                    ]
                };

                setVolumeData(chartData);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching dashboard data:', err);
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

    // Prepare buy/sell data for pie chart
    const buyVolume = activeBoosts.reduce((sum, boost) => sum + (parseFloat(boost.buyVolume) || 0), 0);
    const sellVolume = activeBoosts.reduce((sum, boost) => sum + (parseFloat(boost.sellVolume) || 0), 0);

    const buyVsSellData = {
        labels: ['Buy Volume', 'Sell Volume'],
        datasets: [
            {
                data: [buyVolume, sellVolume],
                backgroundColor: [
                    'rgba(75, 192, 192, 0.6)',
                    'rgba(255, 99, 132, 0.6)',
                ],
                borderColor: [
                    'rgba(75, 192, 192, 1)',
                    'rgba(255, 99, 132, 1)',
                ],
                borderWidth: 1,
            },
        ],
    };

    if (loading) return <LoadingSpinner />;
    if (error) return <div className="error-message">{error}</div>;

    return (
        <div className="dashboard-page">
            <div className="page-header">
                <h1>Dashboard</h1>
                <div className="header-actions">
                    <Link to="/boosts" className="button">View All Boosts</Link>
                </div>
            </div>

            <DashboardSummary
                activeBoosts={activeBoosts}
                completedBoosts={completedBoosts}
            />

            <div className="dashboard-charts">
                <div className="dashboard-card chart-container">
                    <h2>Overall Progress</h2>
                    <div className="big-progress">
                        <div className="progress-bar">
                            <div
                                className="progress-fill"
                                style={{width: `${overallProgress}%`}}
                            ></div>
                            <span>{overallProgress.toFixed(1)}%</span>
                        </div>
                        <div className="progress-labels">
                            <span>${totalActiveVolume.toFixed(2)} / ${totalTargetVolume.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                <div className="dashboard-card chart-container">
                    <h2>Buy vs Sell Volume</h2>
                    <div className="chart-wrapper" style={{ height: '250px' }}>
                        <Doughnut
                            data={buyVsSellData}
                            options={{
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: {
                                        position: 'bottom',
                                        labels: {
                                            color: '#fff'
                                        }
                                    }
                                }
                            }}
                        />
                    </div>
                </div>
            </div>

            <div className="dashboard-grid">
                <div className="dashboard-column">
                    <div className="dashboard-card">
                        <h2>Active Boosts</h2>
                        {activeBoosts.length === 0 ? (
                            <p>No active boosts found.</p>
                        ) : (
                            <BoostList boosts={activeBoosts} compact={true} />
                        )}
                    </div>
                </div>

                <div className="dashboard-column">
                    <div className="dashboard-card">
                        <h2>Recent Transactions</h2>
                        {recentTransactions.length === 0 ? (
                            <p>No recent transactions found.</p>
                        ) : (
                            <div className="transaction-list">
                                <table className="data-table compact">
                                    <thead>
                                    <tr>
                                        <th>Time</th>
                                        <th>Type</th>
                                        <th>Amount</th>
                                        <th>Status</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {recentTransactions.slice(0, 7).map((tx, index) => (
                                        <tr key={index}>
                                            <td>{tx.time}</td>
                                            <td className={tx.type === 'BUY' ? 'buy-text' : 'sell-text'}>
                                                {tx.type}
                                            </td>
                                            <td>${tx.amount.toFixed(6)}</td>
                                            <td>
                                                <StatusBadge status={tx.status} />
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                                <div className="view-all">
                                    <Link to="/transactions">View All Transactions</Link>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {completedBoosts.length > 0 && volumeData && (
                <div className="dashboard-card chart-container">
                    <h2>Completed Boosts Performance</h2>
                    <div className="chart-wrapper" style={{ height: '300px' }}>
                        <Line
                            data={volumeData}
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
                                    }
                                }
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;