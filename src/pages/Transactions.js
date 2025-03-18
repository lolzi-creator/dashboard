import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getRecentTransactions } from '../api/transactionService';
import { getActiveBoosts } from '../api/boostService';
import { getActiveRankingJobs } from '../api/rankingService';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, BarElement } from 'chart.js';
import { Bar } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

const Transactions = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [setError] = useState(null);
    const [filterType, setFilterType] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterTimeframe, setFilterTimeframe] = useState('24h');
    const [currentPage, setCurrentPage] = useState(1);
    const [transactionsPerPage] = useState(10);
    const [chartData, setChartData] = useState(null);
    const [stats, setStats] = useState({
        totalTransactions: 0,
        successRate: 0,
        buyVolume: 0,
        sellVolume: 0,
        failedCount: 0
    });
    // Add data source tracking
    const [dataSource, setDataSource] = useState('transactions');
    const [debugMessage, setDebugMessage] = useState(null);

    useEffect(() => {
        fetchTransactions();

        // Refresh data periodically
        const interval = setInterval(fetchTransactions, 30000);
        return () => clearInterval(interval);
    }, [dataSource]);

    const fetchTransactions = async () => {
        try {
            setLoading(true);
            setError(null);

            let transactionsData = [];

            if (dataSource === 'transactions') {
                // Try the standard transactions endpoint first
                const data = await getRecentTransactions(100);
                if (data && data.transactions) {
                    transactionsData = data.transactions;
                }
            } else if (dataSource === 'boosts') {
                // Fallback to collecting transactions from active boosts
                const boostsData = await getActiveBoosts();
                if (boostsData && boostsData.boosts && boostsData.boosts.length > 0) {
                    for (const boost of boostsData.boosts) {
                        try {
                            const boostTxResponse = await fetch(`/api/boost/${boost.boostId}/transactions`);
                            const boostTxData = await boostTxResponse.json();
                            if (boostTxData && boostTxData.transactions) {
                                transactionsData = [...transactionsData, ...boostTxData.transactions];
                            }
                        } catch (boostErr) {
                            console.warn(`Error fetching transactions for boost ${boost.boostId}:`, boostErr);
                        }
                    }
                }
            } else if (dataSource === 'ranking') {
                // Try collecting transactions from ranking jobs
                const rankingData = await getActiveRankingJobs();
                if (rankingData && rankingData.jobs && rankingData.jobs.length > 0) {
                    // This is a placeholder - you'll need to implement an API endpoint to get ranking job transactions
                    transactionsData = [];
                    setDebugMessage('Ranking jobs found, but transaction data cannot be retrieved yet.');
                }
            }

            // If we still don't have transactions, try other data sources
            if (transactionsData.length === 0 && dataSource === 'transactions') {
                setDataSource('boosts');
                setLoading(false);
                return;
            } else if (transactionsData.length === 0 && dataSource === 'boosts') {
                setDataSource('ranking');
                setLoading(false);
                return;
            }

            setTransactions(transactionsData);

            if (transactionsData.length > 0) {
                prepareChartData(transactionsData);
                calculateStats(transactionsData);
            }

            setLoading(false);
        } catch (err) {
            console.error("Error fetching transactions:", err);
            setError(`Error loading transactions: ${err.message}`);
            setLoading(false);

            // Try alternative data source if current one fails
            if (dataSource === 'transactions') {
                setDataSource('boosts');
            } else if (dataSource === 'boosts') {
                setDataSource('ranking');
            }
        }
    };

    const prepareChartData = (txData) => {
        // Group transactions by hour
        const hourlyData = {};
        const now = new Date();
        let timeframeHours = 24;

        if (filterTimeframe === '1h') timeframeHours = 1;
        if (filterTimeframe === '6h') timeframeHours = 6;
        if (filterTimeframe === '24h') timeframeHours = 24;
        if (filterTimeframe === '7d') timeframeHours = 168;

        // Initialize empty bins for the time periods
        for (let i = timeframeHours - 1; i >= 0; i--) {
            const date = new Date(now.getTime() - (i * 60 * 60 * 1000));
            const hourKey = date.toISOString().substring(0, 13);
            hourlyData[hourKey] = { buys: 0, sells: 0, buyVolume: 0, sellVolume: 0, count: 0 };
        }

        // Fill data from transactions
        txData.forEach(tx => {
            const txDate = new Date(tx.timestamp || tx.time);
            // Skip transactions outside our timeframe
            if (now.getTime() - txDate.getTime() > timeframeHours * 60 * 60 * 1000) return;

            const hourKey = txDate.toISOString().substring(0, 13);

            // Skip if hour is not in our initialized data (outside timeframe)
            if (!hourlyData[hourKey]) return;

            hourlyData[hourKey].count += 1;

            if (tx.side === 'buy' || tx.type === 'BUY') {
                hourlyData[hourKey].buys += 1;
                hourlyData[hourKey].buyVolume += (tx.value || 0);
            } else {
                hourlyData[hourKey].sells += 1;
                hourlyData[hourKey].sellVolume += (tx.value || 0);
            }
        });

        // Extract sorted keys and prepare chart data
        const sortedHours = Object.keys(hourlyData).sort();
        const labels = sortedHours.map(hour => {
            const date = new Date(hour);
            return `${date.getHours()}:00`;
        });

        setChartData({
            labels,
            datasets: [
                {
                    label: 'Buy Volume',
                    data: sortedHours.map(hour => hourlyData[hour].buyVolume),
                    backgroundColor: 'rgba(16, 185, 129, 0.6)',
                    borderColor: 'rgba(16, 185, 129, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Sell Volume',
                    data: sortedHours.map(hour => hourlyData[hour].sellVolume),
                    backgroundColor: 'rgba(239, 68, 68, 0.6)',
                    borderColor: 'rgba(239, 68, 68, 1)',
                    borderWidth: 1
                }
            ]
        });
    };

    const calculateStats = (txData) => {
        const totalCount = txData.length;
        const successCount = txData.filter(tx => tx.success || tx.status === 'success').length;
        const failedCount = totalCount - successCount;
        const successRate = totalCount > 0 ? (successCount / totalCount) * 100 : 0;

        let buyVolume = 0;
        let sellVolume = 0;

        txData.forEach(tx => {
            if (tx.side === 'buy' || tx.type === 'BUY') {
                buyVolume += (tx.value || 0);
            } else {
                sellVolume += (tx.value || 0);
            }
        });

        setStats({
            totalTransactions: totalCount,
            successRate,
            buyVolume,
            sellVolume,
            failedCount
        });
    };

    const getFilteredTransactions = () => {
        return transactions.filter(tx => {
            // Apply type filter
            if (filterType !== 'all') {
                const txType = tx.side || tx.type;
                if (txType && txType.toLowerCase() !== filterType.toLowerCase()) {
                    return false;
                }
            }

            // Apply status filter
            if (filterStatus !== 'all') {
                const txSuccess = tx.success || tx.status === 'success';
                if (filterStatus === 'success' && !txSuccess) return false;
                if (filterStatus === 'failed' && txSuccess) return false;
            }

            // Apply timeframe filter
            if (filterTimeframe !== 'all') {
                const txTime = new Date(tx.timestamp || tx.time).getTime();
                const now = new Date().getTime();
                let timeframeMs = 24 * 60 * 60 * 1000; // Default to 24h

                if (filterTimeframe === '1h') timeframeMs = 60 * 60 * 1000;
                if (filterTimeframe === '6h') timeframeMs = 6 * 60 * 60 * 1000;
                if (filterTimeframe === '24h') timeframeMs = 24 * 60 * 60 * 1000;
                if (filterTimeframe === '7d') timeframeMs = 7 * 24 * 60 * 60 * 1000;

                if (now - txTime > timeframeMs) return false;
            }

            return true;
        });
    };

    // Get current transactions
    const filteredTransactions = getFilteredTransactions();
    const indexOfLastTransaction = currentPage * transactionsPerPage;
    const indexOfFirstTransaction = indexOfLastTransaction - transactionsPerPage;
    const currentTransactions = filteredTransactions.slice(indexOfFirstTransaction, indexOfLastTransaction);
    const totalPages = Math.ceil(filteredTransactions.length / transactionsPerPage);

    // Change page
    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    // Handle filter changes
    const handleFilterChange = (filterName, value) => {
        if (filterName === 'type') setFilterType(value);
        if (filterName === 'status') setFilterStatus(value);
        if (filterName === 'timeframe') {
            setFilterTimeframe(value);
            prepareChartData(transactions);
        }

        // Reset to first page when filters change
        setCurrentPage(1);
    };

    // Helper function to find source of transaction data
    const tryOtherDataSource = () => {
        if (dataSource === 'transactions') {
            setDataSource('boosts');
        } else if (dataSource === 'boosts') {
            setDataSource('ranking');
        } else {
            setDataSource('transactions');
        }
    };

    if (loading && transactions.length === 0) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Loading transactions...</p>
            </div>
        );
    }

    return (
        <div className="transactions-page">
            <div className="page-header">
                <div>
                    <h1>Transactions</h1>
                    <p className="subtitle">View and analyze trading activity</p>
                </div>
                <div className="header-actions">
                    <button
                        className="button button-small"
                        onClick={tryOtherDataSource}
                        title="Try alternative data source if transactions aren't showing"
                    >
                        Try Other Source
                    </button>
                    <button className="button">
                        Export Data
                    </button>
                </div>
            </div>

            {debugMessage && (
                <div className="debug-message">
                    {debugMessage}
                </div>
            )}

            <div className="transactions-summary">
                <div className="summary-card">
                    <div className="summary-icon">🔄</div>
                    <div className="summary-details">
                        <h3>Total Transactions</h3>
                        <div className="summary-value">{stats.totalTransactions}</div>
                    </div>
                </div>

                <div className="summary-card">
                    <div className="summary-icon success-icon">✓</div>
                    <div className="summary-details">
                        <h3>Success Rate</h3>
                        <div className="summary-value">{stats.successRate.toFixed(1)}%</div>
                        <div className="summary-subtext">{stats.failedCount} failed transactions</div>
                    </div>
                </div>

                <div className="summary-card">
                    <div className="summary-icon buy-icon">↑</div>
                    <div className="summary-details">
                        <h3>Buy Volume</h3>
                        <div className="summary-value">${stats.buyVolume.toFixed(2)}</div>
                    </div>
                </div>

                <div className="summary-card">
                    <div className="summary-icon sell-icon">↓</div>
                    <div className="summary-details">
                        <h3>Sell Volume</h3>
                        <div className="summary-value">${stats.sellVolume.toFixed(2)}</div>
                    </div>
                </div>
            </div>

            <div className="transactions-container">
                <div className="transactions-chart-container">
                    <div className="chart-header">
                        <h2>Transaction Volume</h2>
                        <div className="timeframe-selector">
                            <button
                                className={filterTimeframe === '1h' ? 'active' : ''}
                                onClick={() => handleFilterChange('timeframe', '1h')}
                            >
                                1H
                            </button>
                            <button
                                className={filterTimeframe === '6h' ? 'active' : ''}
                                onClick={() => handleFilterChange('timeframe', '6h')}
                            >
                                6H
                            </button>
                            <button
                                className={filterTimeframe === '24h' ? 'active' : ''}
                                onClick={() => handleFilterChange('timeframe', '24h')}
                            >
                                24H
                            </button>
                            <button
                                className={filterTimeframe === '7d' ? 'active' : ''}
                                onClick={() => handleFilterChange('timeframe', '7d')}
                            >
                                7D
                            </button>
                        </div>
                    </div>

                    {transactions.length > 0 && chartData ? (
                        <div className="chart-wrapper">
                            <Bar
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
                    ) : (
                        <div className="empty-chart">
                            <p>No transaction data available for the selected timeframe</p>
                            {dataSource !== 'transactions' && (
                                <p className="info-message">Currently checking {dataSource} for transaction data</p>
                            )}
                        </div>
                    )}
                </div>

                <div className="transactions-list-container">
                    <div className="filters-bar">
                        <div className="filters-group">
                            <label>Transaction Type:</label>
                            <select
                                value={filterType}
                                onChange={(e) => handleFilterChange('type', e.target.value)}
                            >
                                <option value="all">All Types</option>
                                <option value="buy">Buys</option>
                                <option value="sell">Sells</option>
                            </select>
                        </div>

                        <div className="filters-group">
                            <label>Status:</label>
                            <select
                                value={filterStatus}
                                onChange={(e) => handleFilterChange('status', e.target.value)}
                            >
                                <option value="all">All Status</option>
                                <option value="success">Success</option>
                                <option value="failed">Failed</option>
                            </select>
                        </div>
                    </div>

                    <div className="transactions-table-wrapper">
                        {transactions.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-icon">💼</div>
                                <p>No transactions found</p>
                                <p className="empty-subtext">Transactions will appear here once trading begins</p>
                                <p className="data-source-info">Data source: {dataSource}</p>
                                <button
                                    className="button button-small"
                                    onClick={tryOtherDataSource}
                                >
                                    Try Another Data Source
                                </button>
                            </div>
                        ) : filteredTransactions.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-icon">🔍</div>
                                <p>No transactions match your filters</p>
                                <button
                                    className="button button-small"
                                    onClick={() => {
                                        setFilterType('all');
                                        setFilterStatus('all');
                                    }}
                                >
                                    Reset Filters
                                </button>
                            </div>
                        ) : (
                            <table className="transactions-table">
                                <thead>
                                <tr>
                                    <th>Time</th>
                                    <th>Boost/Job ID</th>
                                    <th>Type</th>
                                    <th>Amount</th>
                                    <th>Price</th>
                                    <th>Value</th>
                                    <th>Status</th>
                                    <th>Transaction</th>
                                </tr>
                                </thead>
                                <tbody>
                                {currentTransactions.map((tx, index) => {
                                    const txTime = new Date(tx.timestamp || tx.time);
                                    const txSuccess = tx.success || tx.status === 'success';
                                    const txType = tx.side || tx.type;
                                    const txId = tx.boostId || tx.jobId || 'Unknown';

                                    return (
                                        <tr key={index} className={!txSuccess ? 'error-row' : ''}>
                                            <td>{txTime.toLocaleString()}</td>
                                            <td>
                                                {txId !== 'Unknown' ? (
                                                    <Link to={`/${txId.startsWith('boost') ? 'boosts' : 'ranking'}/${txId}`} className="tx-link">
                                                        {txId.substring(0, 8)}...
                                                    </Link>
                                                ) : 'Unknown'}
                                            </td>
                                            <td className={txType?.toLowerCase() === 'buy' ? 'buy-text' : 'sell-text'}>
                                                {txType?.toUpperCase()}
                                            </td>
                                            <td>
                                                {typeof tx.size === 'number' ? tx.size.toFixed(6) : (tx.amount ? tx.amount.toFixed(6) : '0.000000')}
                                            </td>
                                            <td>
                                                ${typeof tx.price === 'number' ? tx.price.toFixed(2) : '0.00'}
                                            </td>
                                            <td>
                                                ${typeof tx.value === 'number' ? tx.value.toFixed(2) : '0.00'}
                                            </td>
                                            <td>
                                                    <span className={`status-badge ${txSuccess ? 'success' : 'failed'}`}>
                                                        {txSuccess ? 'Success' : 'Failed'}
                                                    </span>
                                            </td>
                                            <td>
                                                {tx.signature || tx.txid ? (
                                                    <a
                                                        href={`https://solscan.io/tx/${tx.signature || tx.txid}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="tx-link"
                                                    >
                                                        {(tx.signature || tx.txid).substring(0, 8)}...
                                                    </a>
                                                ) : 'N/A'}
                                            </td>
                                        </tr>
                                    );
                                })}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {filteredTransactions.length > 0 && (
                        <div className="pagination">
                            <button
                                onClick={() => paginate(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="page-button"
                            >
                                &laquo; Previous
                            </button>

                            <div className="page-info">
                                Page {currentPage} of {totalPages}
                            </div>

                            <button
                                onClick={() => paginate(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="page-button"
                            >
                                Next &raquo;
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Transactions;