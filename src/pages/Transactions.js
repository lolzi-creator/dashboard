import React, { useState, useEffect } from 'react';
import { getRecentTransactions } from '../api/transactionService';
import StatusBadge from '../components/common/StatusBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';

const Transactions = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filterType, setFilterType] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [transactionsPerPage] = useState(20);

    useEffect(() => {
        const fetchTransactions = async () => {
            try {
                setLoading(true);
                const data = await getRecentTransactions(100);
                setTransactions(data.transactions || []);
                setLoading(false);
            } catch (err) {
                setError(err.message);
                setLoading(false);
            }
        };

        fetchTransactions();

        const interval = setInterval(fetchTransactions, 20000);
        return () => clearInterval(interval);
    }, []);

    const filteredTransactions = transactions.filter(tx => {
        if (filterType !== 'all' && tx.side !== filterType.toLowerCase()) return false;
        if (filterStatus !== 'all') {
            if (filterStatus === 'success' && !tx.success) return false;
            if (filterStatus === 'failed' && tx.success) return false;
        }
        return true;
    });

    const indexOfLastTransaction = currentPage * transactionsPerPage;
    const indexOfFirstTransaction = indexOfLastTransaction - transactionsPerPage;
    const currentTransactions = filteredTransactions.slice(
        indexOfFirstTransaction,
        indexOfLastTransaction
    );

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    if (loading) return <LoadingSpinner />;
    if (error) return <div className="error-message">Error loading transactions: {error}</div>;

    const totalPages = Math.ceil(filteredTransactions.length / transactionsPerPage);

    return (
        <div className="transactions-page">
            <div className="page-header">
                <h1>Transactions</h1>
            </div>

            <div className="filters-bar">
                <div className="filter-group">
                    <label>Type:</label>
                    <select
                        value={filterType}
                        onChange={e => {
                            setFilterType(e.target.value);
                            setCurrentPage(1);
                        }}
                    >
                        <option value="all">All Types</option>
                        <option value="buy">Buy</option>
                        <option value="sell">Sell</option>
                    </select>
                </div>

                <div className="filter-group">
                    <label>Status:</label>
                    <select
                        value={filterStatus}
                        onChange={e => {
                            setFilterStatus(e.target.value);
                            setCurrentPage(1);
                        }}
                    >
                        <option value="all">All Status</option>
                        <option value="success">Success</option>
                        <option value="failed">Failed</option>
                    </select>
                </div>
            </div>

            <div className="card transaction-list">
                <h2>Recent Transactions</h2>

                {filteredTransactions.length === 0 ? (
                    <p>No transactions found matching your filters.</p>
                ) : (
                    <>
                        <table className="data-table">
                            <thead>
                            <tr>
                                <th>Time</th>
                                <th>Boost ID</th>
                                <th>Type</th>
                                <th>Amount</th>
                                <th>Price</th>
                                <th>Value</th>
                                <th>Status</th>
                                <th>Transaction</th>
                            </tr>
                            </thead>
                            <tbody>
                            {currentTransactions.map((tx, index) => (
                                <tr
                                    key={index}
                                    className={tx.success ? '' : 'error-row'}
                                >
                                    <td>{new Date(tx.time).toLocaleString()}</td>
                                    <td>{tx.boostId.substring(0, 8)}</td>
                                    <td
                                        className={
                                            tx.type === 'BUY' ? 'buy-text' : 'sell-text'
                                        }
                                    >
                                        {tx.type?.toUpperCase()}
                                    </td>
                                    <td>
                                        ${typeof tx.amount === 'number'
                                        ? tx.amount.toFixed(6)
                                        : '0.000000'}
                                    </td>
                                    <td>
                                        ${typeof tx.price === 'number'
                                        ? tx.price.toFixed(2)
                                        : '0.00'}
                                    </td>
                                    <td>
                                        ${typeof tx.value === 'number'
                                        ? tx.value.toFixed(2)
                                        : '0.00'}
                                    </td>
                                    <td>
                                        <StatusBadge
                                            status={tx.status ? 'success' : 'failed'}
                                        />
                                    </td>
                                    <td>
                                        {tx.transaction ? (
                                            <a
                                                href={`https://solscan.io/tx/${tx.transaction}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="tx-link"
                                            >
                                                {tx.transaction.substring(0, 8)}...
                                            </a>
                                        ) : 'N/A'}
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>

                        <div className="pagination">
                            <button
                                onClick={() => paginate(currentPage - 1)}
                                disabled={currentPage === 1}
                            >
                                Previous
                            </button>
                            <span>
                                Page {currentPage} of {totalPages}
                            </span>
                            <button
                                onClick={() => paginate(currentPage + 1)}
                                disabled={currentPage === totalPages}
                            >
                                Next
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default Transactions;