import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getRecentTransactions, getBoostTransactions } from '../api/transactionService';
import { getActiveBoosts } from '../api/boostService';
import { getActiveRankingJobs } from '../api/rankingService';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import LoadingSpinner from '../components/common/LoadingSpinner';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

const Transactions = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
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
    // Track data source
    const [dataSource, setDataSource] = useState('all');
    const [debugMessage, setDebugMessage] = useState(null);

    useEffect(() => {
        fetchTransactions();

        // Refresh data periodically
        const interval = setInterval(fetchTransactions, 30000);
        return () => clearInterval(interval);
    }, [filterTimeframe, dataSource]);

    const fetchTransactions = async () => {
        try {
            setLoading(true);
            setError(null);
            console.log("Fetching transaction data...");

            let transactionsData = [];

            // Try the standard transactions endpoint first
            try {
                const data = await getRecentTransactions(100);
                console.log("Recent transactions API response:", data);
                if (data && data.transactions && data.transactions.length > 0) {
                    transactionsData = data.transactions.map(tx => ({
                        ...tx,
                        source: tx.boostId ? 'boost' : (tx.jobId ? 'ranking' : 'unknown'),
                        sourceId: tx.boostId || tx.jobId || null
                    }));
                }
            } catch (err) {
                console.warn("Error fetching from transactions endpoint:", err);
            }

            // If we need to collect from boost sources or have no transactions yet
            if (dataSource === 'all' || dataSource === 'boosts' || transactionsData.length === 0) {
                try {
                    // Get active boosts
                    const boostsData = await getActiveBoosts();
                    console.log("Active boosts:", boostsData);

                    if (boostsData && boostsData.boosts && boostsData.boosts.length > 0) {
                        // For each boost, fetch its transactions
                        for (const boost of boostsData.boosts) {
                            try {
                                const boostTxResponse = await getBoostTransactions(boost.boostId);
                                console.log(`Transactions for boost ${boost.boostId}:`, boostTxResponse);

                                if (boostTxResponse && boostTxResponse.transactions) {
                                    // Add source info to each transaction
                                    const txsWithSource = boostTxResponse.transactions.map(tx => ({
                                        ...tx,
                                        source: 'boost',
                                        sourceId: boost.boostId
                                    }));

                                    transactionsData = [...transactionsData, ...txsWithSource];
                                }
                            } catch (boostErr) {
                                console.warn(`Error fetching transactions for boost ${boost.boostId}:`, boostErr);
                            }
                        }
                    }
                } catch (boostsErr) {
                    console.warn("Error fetching boosts:", boostsErr);
                }
            }

            // If we need to collect from ranking jobs or have no transactions yet
            if (dataSource === 'all' || dataSource === 'ranking' || transactionsData.length === 0) {
                try {
                    // Get active ranking jobs
                    const rankingData = await getActiveRankingJobs();
                    console.log("Active ranking jobs:", rankingData);

                    if (rankingData && rankingData.jobs && rankingData.jobs.length > 0) {
                        // For each job, we would fetch its transactions
                        // This requires your API to have an endpoint for ranking job transactions
                        for (const job of rankingData.jobs) {
                            try {
                                // Replace this with your actual API call once implemented
                                // const jobTxs = await getRankingJobTransactions(job.id);

                                // For now, we'll just check if job has transactions directly
                                if (job.transactions) {
                                    const txsWithSource = job.transactions.map(tx => ({
                                        ...tx,
                                        source: 'ranking',
                                        sourceId: job.id
                                    }));

                                    transactionsData = [...transactionsData, ...txsWithSource];
                                }
                            } catch (jobErr) {
                                console.warn(`Error with ranking job ${job.id} transactions:`, jobErr);
                            }
                        }
                    }
                } catch (rankingErr) {
                    console.warn("Error fetching ranking jobs:", rankingErr);
                }
            }

            // Remove duplicate transactions based on signature/txid
            const uniqueTransactions = removeDuplicateTransactions(transactionsData);

            // Sort transactions by timestamp (newest first)
            uniqueTransactions.sort((a, b) => {
                const timeA = new Date(a.timestamp || a.time || 0).getTime();
                const timeB = new Date(b.timestamp || b.time || 0).getTime();
                return timeB - timeA;
            });

            console.log("Combined unique transactions:", uniqueTransactions);

            if (uniqueTransactions.length === 0) {
                setDebugMessage("No transactions found from any source. Try changing the data source.");
            } else {
                setDebugMessage(null);
            }

            setTransactions(uniqueTransactions);
            prepareChartData(uniqueTransactions);
            calculateStats(uniqueTransactions);
            setLoading(false);
        } catch (err) {
            console.error("Error in transaction fetching:", err);
            setError(`Error loading transactions: ${err.message}`);
            setDebugMessage(`Error: ${err.message}. Try a different data source.`);
            setLoading(false);
        }
    };

    // Helper function to remove duplicate transactions
    const removeDuplicateTransactions = (txList) => {
        const uniqueTxMap = new Map();

        txList.forEach(tx => {
            const uniqueKey = tx.signature || tx.txid || `${tx.timestamp || tx.time}-${tx.side || tx.type}-${tx.value}`;
            if (!uniqueTxMap.has(uniqueKey)) {
                uniqueTxMap.set(uniqueKey, tx);
            }
        });

        return Array.from(uniqueTxMap.values());
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
            const txTime = tx.timestamp || tx.time;
            if (!txTime) return;

            const txDate = new Date(txTime);
            // Skip transactions outside our timeframe
            if (now.getTime() - txDate.getTime() > timeframeHours * 60 * 60 * 1000) return;

            const hourKey = txDate.toISOString().substring(0, 13);

            // Skip if hour is not in our initialized data (outside timeframe)
            if (!hourlyData[hourKey]) return;

            hourlyData[hourKey].count += 1;

            const txType = (tx.side || tx.type || '').toLowerCase();
            if (txType === 'buy') {
                hourlyData[hourKey].buys += 1;
                hourlyData[hourKey].buyVolume += (tx.value || 0);
            } else if (txType === 'sell') {
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
        const successCount = txData.filter(tx => {
            return tx.success || tx.status === 'success' || tx.status === 'completed';
        }).length;
        const failedCount = totalCount - successCount;
        const successRate = totalCount > 0 ? (successCount / totalCount) * 100 : 0;

        let buyVolume = 0;
        let sellVolume = 0;

        txData.forEach(tx => {
            const txType = (tx.side || tx.type || '').toLowerCase();
            if (txType === 'buy') {
                buyVolume += (tx.value || 0);
            } else if (txType === 'sell') {
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
                const txType = (tx.side || tx.type || '').toLowerCase();
                if (txType !== filterType.toLowerCase()) {
                    return false;
                }
            }

            // Apply status filter
            if (filterStatus !== 'all') {
                const txSuccess = tx.success || tx.status === 'success' || tx.status === 'completed';
                if (filterStatus === 'success' && !txSuccess) return false;
                if (filterStatus === 'failed' && txSuccess) return false;
            }

            // Apply timeframe filter
            if (filterTimeframe !== 'all') {
                const txTime = tx.timestamp || tx.time;
                if (!txTime) return false;

                const txDate = new Date(txTime).getTime();
                const now = new Date().getTime();
                let timeframeMs = 24 * 60 * 60 * 1000; // Default to 24h

                if (filterTimeframe === '1h') timeframeMs = 1 * 60 * 60 * 1000;
                if (filterTimeframe === '6h') timeframeMs = 6 * 60 * 60 * 1000;
                if (filterTimeframe === '24h') timeframeMs = 24 * 60 * 60 * 1000;
                if (filterTimeframe === '7d') timeframeMs = 7 * 24 * 60 * 60 * 1000;

                if (now - txDate > timeframeMs) return false;
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
        if (filterName === 'source') setDataSource(value);

        // Reset to first page when filters change
        setCurrentPage(1);
    };

    // Render a transaction row
    const renderTransactionRow = (tx, index) => {
        // Standardize transaction type/side
        const txType = (tx.side || tx.type || '').toLowerCase();
        const txTypeDisplay = txType.toUpperCase();
        const isBuy = txType === 'buy';

        // Standardize timestamp
        const timestamp = tx.timestamp || tx.time || null;
        const formattedTime = timestamp ? new Date(timestamp).toLocaleString() : 'Unknown time';

        // Determine transaction success status
        // Check multiple possible formats
        const isSuccess = tx.success || tx.status === 'success' || tx.status === 'completed';

        return (
            <tr key={tx.signature || tx.txid || index} className={isSuccess ? '' : 'error-row'}>
                <td>{formattedTime}</td>
                <td>
                    {tx.sourceId ? (
                        <Link to={`/${tx.source === 'ranking' ? 'ranking' : 'boosts'}/${tx.sourceId}`} className="tx-link">
                            {tx.sourceId.substring(0, 8)}...
                        </Link>
                    ) : (
                        'Unknown'
                    )}
                </td>
                <td className={isBuy ? 'buy-text' : 'sell-text'}>
                    {txTypeDisplay}
                </td>
                <td>
                    {typeof tx.size === 'number' ? tx.size.toFixed(6) : (typeof tx.amount === 'number' ? tx.amount.toFixed(6) : '0.000000')}
                </td>
                <td>
                    ${typeof tx.price === 'number' ? tx.price.toFixed(2) : '0.00'}
                </td>
                <td>
                    ${typeof tx.value === 'number' ? tx.value.toFixed(2) : '0.00'}
                </td>
                <td>
                    <span className={`status-badge ${isSuccess ? 'success' : 'failed'}`}>
                        {isSuccess ? 'SUCCESS' : 'FAILED'}
                    </span>
                </td>
                <td>
                    {(tx.signature || tx.txid) ? (
                        <a
                            href={`https://solscan.io/tx/${tx.signature || tx.txid}`}
                            target="_blank"
                            rel="noreferrer"
                            className="tx-link"
                        >
                            {(tx.signature || tx.txid).substring(0, 8)}...
                        </a>
                    ) : (
                        'N/A'
                    )}
                </td>
            </tr>
        );
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
                        onClick={() => fetchTransactions()}
                        title="Refresh transactions"
                    >
                        Refresh Data
                    </button>
                </div>
            </div>

            {debugMessage && (
                <div className="info-message">
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

                        <div className="filters-group">
                            <label>Data Source:</label>
                            <select
                                value={dataSource}
                                onChange={(e) => handleFilterChange('source', e.target.value)}
                            >
                                <option value="all">All Sources</option>
                                <option value="api">Transactions API</option>
                                <option value="boosts">Volume Boosts</option>
                                <option value="ranking">Ranking Jobs</option>
                            </select>
                        </div>
                    </div>

                    <div className="transactions-table-wrapper">
                        {transactions.length === 0 ? (
                            <div className="empty-state">
                                <div className="empty-icon">💼</div>
                                <p>No transactions found</p>
                                <p className="empty-subtext">Transactions will appear here once trading begins</p>
                                <button
                                    className="button button-small"
                                    onClick={fetchTransactions}
                                >
                                    Refresh Transactions
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
                                    <th>Source</th>
                                    <th>Type</th>
                                    <th>Amount</th>
                                    <th>Price</th>
                                    <th>Value</th>
                                    <th>Status</th>
                                    <th>Transaction</th>
                                </tr>
                                </thead>
                                <tbody>
                                {currentTransactions.map((tx, index) => renderTransactionRow(tx, index))}
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