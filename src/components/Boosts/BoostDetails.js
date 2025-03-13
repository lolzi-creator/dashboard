import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getBoostDetails, cancelBoost } from '../../api/boostService';
import { getBoostTransactions } from '../../api/transactionService';
import { getBoostLogs } from '../../api/transactionService';
import StatusBadge from '../common/StatusBadge';
import LoadingSpinner from '../common/LoadingSpinner';

const BoostDetails = () => {
    const { boostId } = useParams();
    const navigate = useNavigate();

    const [boost, setBoost] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');

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
    }, [boostId]);

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

    if (loading) return <LoadingSpinner />;
    if (error) return <p className="error-message">Error: {error}</p>;
    if (!boost) return <p>Boost not found</p>;

    return (
        <div className="boost-details">
            <div className="detail-header">
                <h2>Boost Details</h2>
                {boost.active && (
                    <button className="button button-danger" onClick={handleCancel}>
                        Cancel Boost
                    </button>
                )}
            </div>

            <div className="detail-card">
                <div className="detail-summary">
                    <div className="detail-row">
                        <span className="detail-label">Boost ID:</span>
                        <span className="detail-value">{boost.boostId}</span>
                    </div>
                    <div className="detail-row">
                        <span className="detail-label">Token:</span>
                        <span className="detail-value">{boost.token}</span>
                    </div>
                    <div className="detail-row">
                        <span className="detail-label">Status:</span>
                        <StatusBadge status={boost.active ? 'active' : 'inactive'} />
                    </div>
                    <div className="detail-row">
                        <span className="detail-label">Progress:</span>
                        <div className="progress-bar">
                            <div
                                className="progress-fill"
                                style={{width: `${boost.volumeProgress || 0}%`}}
                            ></div>
                            <span>{boost.volumeProgress || 0}%</span>
                        </div>
                    </div>
                    <div className="detail-row">
                        <span className="detail-label">Volume:</span>
                        <span className="detail-value">
              ${boost.currentVolume?.toFixed(2) || 0} / ${boost.targetVolume || 0}
            </span>
                    </div>
                    <div className="detail-row">
                        <span className="detail-label">Buy Volume:</span>
                        <span className="detail-value">${boost.buyVolume?.toFixed(2) || 0}</span>
                    </div>
                    <div className="detail-row">
                        <span className="detail-label">Sell Volume:</span>
                        <span className="detail-value">${boost.sellVolume?.toFixed(2) || 0}</span>
                    </div>
                    <div className="detail-row">
                        <span className="detail-label">Trades:</span>
                        <span className="detail-value">{boost.totalTrades || 0}</span>
                    </div>
                    <div className="detail-row">
                        <span className="detail-label">Success Rate:</span>
                        <span className="detail-value">{boost.successRate || 0}%</span>
                    </div>
                    <div className="detail-row">
                        <span className="detail-label">Remaining Time:</span>
                        <span className="detail-value">{boost.remainingTime || 'N/A'}</span>
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
                            <h3>Trading Statistics</h3>

                            <div className="stats-summary">
                                <div className="stat-card">
                                    <h4>Buy/Sell Ratio</h4>
                                    <div className="ratio-bar">
                                        <div
                                            className="buy-ratio"
                                            style={{
                                                width: `${boost.buyVolume > 0 || boost.sellVolume > 0 ?
                                                    (boost.buyVolume / (boost.buyVolume + boost.sellVolume) * 100) :
                                                    0}%`
                                            }}
                                        ></div>
                                    </div>
                                    <div className="ratio-labels">
                                        <span>Buy: {((boost.buyVolume || 0) / ((boost.buyVolume || 0) + (boost.sellVolume || 0)) * 100).toFixed(1)}%</span>
                                        <span>Sell: {((boost.sellVolume || 0) / ((boost.buyVolume || 0) + (boost.sellVolume || 0)) * 100).toFixed(1)}%</span>
                                    </div>
                                </div>

                                <div className="stat-card">
                                    <h4>Success Rate</h4>
                                    <div className="big-number">{boost.successRate || 0}%</div>
                                    <div className="stat-details">
                                        <div>Success: {boost.successfulTrades || 0}</div>
                                        <div>Failed: {boost.failedTrades || 0}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'transactions' && (
                        <div className="transactions-list">
                            <h3>Recent Transactions</h3>

                            {transactions.length === 0 ? (
                                <p>No transactions found for this boost.</p>
                            ) : (
                                <table className="data-table">
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
                                            <td>{tx.price}</td>
                                            <td>${tx.value?.toFixed(2) || 0}</td>
                                            <td>
                                                <StatusBadge status={tx.success ? 'success' : 'failed'} />
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
                            )}
                        </div>
                    )}

                    {activeTab === 'logs' && (
                        <div className="logs-container">
                            <h3>Transaction Logs</h3>

                            {logs.length === 0 ? (
                                <p>No logs found for this boost.</p>
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