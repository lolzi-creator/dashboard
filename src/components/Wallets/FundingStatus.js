import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getFundingStatus } from '../../api/walletService';
import StatusBadge from '../common/StatusBadge';
import LoadingSpinner from '../common/LoadingSpinner';

const FundingStatus = () => {
    const { fundingId } = useParams();
    const navigate = useNavigate();
    const [funding, setFunding] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    console.log("Funding Status Component - Params:", { fundingId });

    useEffect(() => {
        const fetchFundingStatus = async () => {
            if (!fundingId) {
                console.error("No funding ID provided");
                setError("No funding ID provided");
                setLoading(false);
                return;
            }

            try {
                console.log("Fetching funding status for ID:", fundingId);
                const response = await getFundingStatus(fundingId);
                console.log("Funding status response:", response);

                if (response && response.funding) {
                    setFunding(response.funding);
                } else {
                    setError("Invalid response from server");
                }

                setLoading(false);
            } catch (err) {
                console.error("Error fetching funding status:", err);
                setError(err.message || "Failed to load funding status");
                setLoading(false);
            }
        };

        fetchFundingStatus();
    }, [fundingId]);

    if (loading) return <LoadingSpinner />;

    if (error) {
        return (
            <div className="funding-status">
                <div className="error-message">Error loading funding status: {error}</div>
                <div className="actions">
                    <button
                        className="button"
                        onClick={() => navigate('/wallets')}
                    >
                        Back to Wallets
                    </button>
                </div>
            </div>
        );
    }

    if (!funding) {
        return (
            <div className="funding-status">
                <div className="error-message">Funding record not found</div>
                <div className="actions">
                    <button
                        className="button"
                        onClick={() => navigate('/wallets')}
                    >
                        Back to Wallets
                    </button>
                </div>
            </div>
        );
    }

    // Calculate progress
    const completedCount = funding.wallets?.filter(w => w.status === 'completed').length || 0;
    const failedCount = funding.wallets?.filter(w => w.status === 'failed').length || 0;
    const pendingCount = funding.wallets?.filter(w => w.status === 'pending').length || 0;
    const totalCount = funding.wallets?.length || 0;
    const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    return (
        <div className="funding-status">
            <div className="page-header">
                <h2>Funding Status</h2>
                <div className="header-actions">
                    <Link to="/wallets" className="button button-small">Back to Wallets</Link>
                </div>
            </div>

            <div className="status-card">
                <div className="status-header">
                    <h3>Funding Operation: {funding.id}</h3>
                    <StatusBadge status={funding.status || 'unknown'} />
                </div>

                <div className="detail-summary">
                    <div className="detail-row">
                        <span className="detail-label">Batch:</span>
                        <span className="detail-value">{funding.batchName || 'Unknown'}</span>
                    </div>
                    <div className="detail-row">
                        <span className="detail-label">Token:</span>
                        <span className="detail-value">{funding.token || 'Unknown'}</span>
                    </div>
                    <div className="detail-row">
                        <span className="detail-label">Amount Per Wallet:</span>
                        <span className="detail-value">{funding.amountPerWallet} {funding.token}</span>
                    </div>
                    <div className="detail-row">
                        <span className="detail-label">Total Amount:</span>
                        <span className="detail-value">{funding.totalAmount} {funding.token}</span>
                    </div>
                    <div className="detail-row">
                        <span className="detail-label">Started:</span>
                        <span className="detail-value">{funding.timestamp ? new Date(funding.timestamp).toLocaleString() : 'Unknown'}</span>
                    </div>
                    {funding.completedAt && (
                        <div className="detail-row">
                            <span className="detail-label">Completed:</span>
                            <span className="detail-value">{new Date(funding.completedAt).toLocaleString()}</span>
                        </div>
                    )}
                </div>

                {funding.wallets && funding.wallets.length > 0 && (
                    <>
                        <div className="progress-section">
                            <h4>Progress: {progress}%</h4>
                            <div className="progress-bar">
                                <div
                                    className="progress-fill"
                                    style={{width: `${progress}%`}}
                                ></div>
                            </div>
                            <div className="progress-stats">
                                <div className="progress-stat">
                                    <span className="stat-label">Completed:</span>
                                    <span className="stat-value success">{completedCount}</span>
                                </div>
                                <div className="progress-stat">
                                    <span className="stat-label">Failed:</span>
                                    <span className="stat-value error">{failedCount}</span>
                                </div>
                                <div className="progress-stat">
                                    <span className="stat-label">Pending:</span>
                                    <span className="stat-value warning">{pendingCount}</span>
                                </div>
                                <div className="progress-stat">
                                    <span className="stat-label">Total:</span>
                                    <span className="stat-value">{totalCount}</span>
                                </div>
                            </div>
                        </div>

                        <div className="wallet-status-list">
                            <h3>Wallet Funding Status</h3>

                            <table className="data-table">
                                <thead>
                                <tr>
                                    <th>Wallet</th>
                                    <th>Status</th>
                                    <th>Transaction</th>
                                    <th>Error</th>
                                </tr>
                                </thead>
                                <tbody>
                                {funding.wallets.map((wallet, index) => (
                                    <tr key={wallet.id || index} className={wallet.status === 'failed' ? 'error-row' : ''}>
                                        <td>{wallet.address}</td>
                                        <td>
                                            <StatusBadge status={
                                                wallet.status === 'completed' ? 'success' :
                                                    wallet.status === 'failed' ? 'failed' :
                                                        'pending'
                                            } />
                                        </td>
                                        <td>
                                            {wallet.txid ? (
                                                <a
                                                    href={`https://solscan.io/tx/${wallet.txid}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="tx-link"
                                                >
                                                    {wallet.txid.substring(0, 8)}...
                                                </a>
                                            ) : 'N/A'}
                                        </td>
                                        <td>{wallet.error || '-'}</td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default FundingStatus;