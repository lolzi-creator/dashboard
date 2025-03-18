import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getFundingStatus } from '../../api/walletService';

const FundingStatus = () => {
    const { fundingId } = useParams();
    const navigate = useNavigate();
    const [funding, setFunding] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const [statusInterval, setStatusInterval] = useState(null);

    useEffect(() => {
        fetchFundingStatus();

        // Clean up any existing interval
        return () => {
            if (statusInterval) {
                clearInterval(statusInterval);
            }
        };
    }, [fundingId]);

    // Effect for auto-refreshing status
    useEffect(() => {
        let interval = null;

        // Set up periodic refresh if status is processing
        if (funding && (funding.status === 'processing' || funding.status === 'pending')) {
            interval = setInterval(() => {
                setRefreshing(true);
                fetchFundingStatus(false);
            }, 10000); // Refresh every 10 seconds if processing

            setStatusInterval(interval);
        }

        return () => {
            if (interval) {
                clearInterval(interval);
            }
        };
    }, [funding?.status]);

    const fetchFundingStatus = async (showLoading = true) => {
        if (!fundingId) {
            setError("No funding ID provided");
            setLoading(false);
            return;
        }

        try {
            if (showLoading) setLoading(true);

            const response = await getFundingStatus(fundingId);

            if (response && response.funding) {
                setFunding(response.funding);
            } else {
                setError("Invalid response from server");
            }

            setLoading(false);
            setRefreshing(false);
        } catch (err) {
            console.error("Error fetching funding status:", err);
            setError(err.message || "Failed to load funding status");
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleManualRefresh = () => {
        setRefreshing(true);
        fetchFundingStatus(false);
    };

    const determineActualStatus = (funding) => {
        if (!funding || !funding.wallets || funding.wallets.length === 0) {
            return funding?.status || 'unknown';
        }

        const completedCount = funding.wallets.filter(w => w.status === 'completed').length;
        const failedCount = funding.wallets.filter(w => w.status === 'failed').length;
        const totalCount = funding.wallets.length;

        // If any wallet failed, but API reports success, correct it
        if (failedCount > 0 && funding.status === 'completed') {
            return 'completed_with_errors';
        }

        // If all wallets failed, but API doesn't report failure, correct it
        if (failedCount === totalCount && funding.status !== 'failed') {
            return 'failed';
        }

        // If all wallets completed successfully, but API doesn't report success
        if (completedCount === totalCount && funding.status !== 'completed') {
            return 'completed';
        }

        return funding.status;
    };

    // Calculate progress and stats
    const calculateStats = () => {
        if (!funding || !funding.wallets) return { completedCount: 0, failedCount: 0, pendingCount: 0, totalCount: 0, progress: 0 };

        const completedCount = funding.wallets.filter(w => w.status === 'completed').length;
        const failedCount = funding.wallets.filter(w => w.status === 'failed').length;
        const pendingCount = funding.wallets.filter(w => w.status === 'pending').length;
        const totalCount = funding.wallets.length;
        const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
        const actualStatus = determineActualStatus(funding);

        return { completedCount, failedCount, pendingCount, totalCount, progress };
    };

    // Safe date formatter
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';

        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                return 'Invalid date';
            }
            return date.toLocaleString();
        } catch (err) {
            console.error("Error formatting date:", err);
            return 'Error formatting date';
        }
    };

    if (loading && !funding) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Loading funding status...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="error-container">
                <div className="error-icon">⚠️</div>
                <h3>Error Loading Funding Status</h3>
                <p>{error}</p>
                <div className="error-actions">
                    <button
                        className="button"
                        onClick={() => navigate('/wallets')}
                    >
                        Back to Wallets
                    </button>
                    <button
                        className="button button-secondary"
                        onClick={() => fetchFundingStatus()}
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    if (!funding) {
        return (
            <div className="not-found-container">
                <div className="error-icon">🔍</div>
                <h3>Funding Record Not Found</h3>
                <p>The funding operation you're looking for doesn't exist or was removed.</p>
                <button
                    className="button"
                    onClick={() => navigate('/wallets')}
                >
                    Back to Wallets
                </button>
            </div>
        );
    }

    const { completedCount, failedCount, pendingCount, totalCount, progress } = calculateStats();
    const isProcessing = funding.status === 'processing' || funding.status === 'pending';

    const actualStatus = determineActualStatus(funding);
    return (
        <div className="funding-status-page">
            <div className="page-header">
                <div>
                    <h1>Funding Status</h1>
                    <p className="subtitle">Tracking wallet funding operation</p>
                </div>
                <div className="header-actions">
                    {isProcessing && (
                        <button
                            className="button button-secondary"
                            onClick={handleManualRefresh}
                            disabled={refreshing}
                        >
                            {refreshing ? 'Refreshing...' : 'Refresh Status'}
                        </button>
                    )}
                    <Link to="/wallets" className="button">
                        Back to Wallets
                    </Link>
                </div>
            </div>

            <div className="funding-summary-cards">
                <div className="summary-card">
                    <div className="summary-icon">📑</div>
                    <div className="summary-details">
                        <h3>Funding ID</h3>
                        <div className="summary-value id-value">{funding.id}</div>
                    </div>
                </div>

                <div className="summary-card">
                    <div className="summary-icon">💰</div>
                    <div className="summary-details">
                        <h3>Amount</h3>
                        <div className="summary-value">
                            {funding.amountPerWallet} {funding.token}
                            <span className="per-wallet">per wallet</span>
                        </div>
                        <div className="summary-subtext">
                            Total: {funding.totalAmount} {funding.token}
                        </div>
                    </div>
                </div>

                <div className="summary-card">
                    <div className="summary-icon batch-icon">💼</div>
                    <div className="summary-details">
                        <h3>Batch</h3>
                        <div className="summary-value">{funding.batchName}</div>
                        <div className="summary-subtext">{totalCount} wallets</div>
                    </div>
                </div>

                <div className="summary-card">
                    <div className={`summary-icon status-icon ${funding.status}`}>
                        {funding.status === 'completed' ? '✅' :
                            funding.status === 'processing' || funding.status === 'pending' ? '⏱️' :
                                funding.status === 'completed_with_errors' ? '⚠️' : '❌'}
                    </div>
                    <div className="summary-details">
                        <h3>Status</h3>
                        <div className="summary-value">
                            <span className={`status-badge ${actualStatus}`}>
                            {formatStatus(actualStatus)}
                            </span>
                        </div>
                        {funding.completedAt && (
                            <div className="summary-subtext">
                                Completed at: {formatDate(funding.completedAt)}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="funding-details-card">
                <div className="funding-progress-section">
                    <div className="progress-header">
                        <h2>Funding Progress</h2>
                        <div className="progress-stat">{progress}% Complete</div>
                    </div>

                    <div className="progress-bar-container">
                        <div className="progress-bar">
                            <div
                                className={`progress-fill ${funding.status}`}
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>
                    </div>

                    <div className="progress-stats">
                        <div className="stat-item">
                            <div className="stat-value completed">{completedCount}</div>
                            <div className="stat-label">Completed</div>
                        </div>
                        <div className="stat-item">
                            <div className="stat-value failed">{failedCount}</div>
                            <div className="stat-label">Failed</div>
                        </div>
                        <div className="stat-item">
                            <div className="stat-value pending">{pendingCount}</div>
                            <div className="stat-label">Pending</div>
                        </div>
                        <div className="stat-item">
                            <div className="stat-value">{totalCount}</div>
                            <div className="stat-label">Total</div>
                        </div>
                    </div>
                </div>

                <div className="wallet-status-section">
                    <h2>Wallet Status Details</h2>

                    <div className="wallet-status-table-container">
                        <table className="wallet-status-table">
                            <thead>
                            <tr>
                                <th>Wallet Address</th>
                                <th>Status</th>
                                <th>Transaction</th>
                                <th>Error (if any)</th>
                            </tr>
                            </thead>
                            <tbody>
                            {funding.wallets.map((wallet, index) => (
                                <tr key={wallet.id || index} className={`wallet-row ${wallet.status}`}>
                                    <td className="address-cell">
                                        {wallet.address}
                                        <button
                                            className="copy-button"
                                            onClick={() => navigator.clipboard.writeText(wallet.address)}
                                            title="Copy address"
                                        >
                                            📋
                                        </button>
                                    </td>
                                    <td>
                                        <span className={`status-badge ${wallet.status}`}>
                                            {formatWalletStatus(wallet.status)}
                                        </span>
                                    </td>
                                    <td>
                                        {wallet.txid ? (
                                            <a
                                                href={`https://solscan.io/tx/${wallet.txid}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="tx-link"
                                            >
                                                View Transaction
                                            </a>
                                        ) : wallet.status === 'pending' ? (
                                            <span className="pending-text">Pending...</span>
                                        ) : (
                                            <span className="na-text">N/A</span>
                                        )}
                                    </td>
                                    <td className="error-cell">
                                        {wallet.error ? (
                                            <div className="error-message-small">{wallet.error}</div>
                                        ) : (
                                            <span className="na-text">-</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Helper function to format status strings
const formatStatus = (status) => {
    switch (status) {
        case 'completed':
            return 'Completed';
        case 'processing':
        case 'pending':
            return 'Processing';
        case 'completed_with_errors':
            return 'Completed With Errors';
        case 'failed':
            return 'Failed';
        default:
            return status ? (status.charAt(0).toUpperCase() + status.slice(1)) : 'Unknown';
    }
};

// Helper function to format wallet status
const formatWalletStatus = (status) => {
    switch (status) {
        case 'completed':
            return 'Completed';
        case 'pending':
            return 'Pending';
        case 'failed':
            return 'Failed';
        default:
            return status ? (status.charAt(0).toUpperCase() + status.slice(1)) : 'Unknown';
    }
};

export default FundingStatus;