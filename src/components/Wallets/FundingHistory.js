import React from 'react';
import { Link } from 'react-router-dom';

const FundingHistory = ({ fundingHistory }) => {
    if (!fundingHistory || fundingHistory.length === 0) {
        return (
            <div className="empty-state">
                <div className="empty-icon">📜</div>
                <p>No funding operations found</p>
                <p className="empty-subtext">Funding operations will appear here once you fund your wallets</p>
            </div>
        );
    }

    return (
        <div className="funding-history">
            <h2>Funding Operations History</h2>

            <div className="funding-table-container">
                <table className="funding-table">
                    <thead>
                    <tr>
                        <th>Date</th>
                        <th>Batch</th>
                        <th>Token</th>
                        <th>Amount/Wallet</th>
                        <th>Total</th>
                        <th>Wallets</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                    </thead>
                    <tbody>
                    {fundingHistory.map(operation => {
                        // Calculate completion percentage
                        const completedCount = operation.walletStatuses?.completed || 0;
                        const totalCount = operation.walletCount || 0;
                        const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

                        return (
                            <tr key={operation.id}>
                                <td>{new Date(operation.timestamp).toLocaleString()}</td>
                                <td>{operation.batchName}</td>
                                <td>{operation.token}</td>
                                <td>{operation.amountPerWallet} {operation.token}</td>
                                <td>{operation.totalAmount} {operation.token}</td>
                                <td>
                                    <div className="wallet-counts">
                                        <span className="total-count">{totalCount} total</span>
                                        {operation.walletStatuses && (
                                            <div className="status-counts">
                                                    <span className="success-count">
                                                        ✓ {operation.walletStatuses.completed || 0}
                                                    </span>
                                                {operation.walletStatuses.failed > 0 && (
                                                    <span className="failed-count">
                                                            ✗ {operation.walletStatuses.failed}
                                                        </span>
                                                )}
                                                {operation.walletStatuses.pending > 0 && (
                                                    <span className="pending-count">
                                                            ⏱ {operation.walletStatuses.pending}
                                                        </span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </td>
                                <td>
                                    <div className="status-with-progress">
                                            <span className={`status-badge ${operation.status}`}>
                                                {formatStatus(operation.status)}
                                            </span>
                                        {operation.status === 'processing' && (
                                            <div className="mini-progress">
                                                <div
                                                    className="mini-progress-fill"
                                                    style={{width: `${progress}%`}}
                                                ></div>
                                            </div>
                                        )}
                                    </div>
                                </td>
                                <td>
                                    <Link
                                        to={`/wallets/funding/${operation.id}`}
                                        className="button button-small"
                                    >
                                        Details
                                    </Link>
                                </td>
                            </tr>
                        );
                    })}
                    </tbody>
                </table>
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
            return 'Processing';
        case 'completed_with_errors':
            return 'Partial Success';
        case 'failed':
            return 'Failed';
        default:
            return status.charAt(0).toUpperCase() + status.slice(1);
    }
};

export default FundingHistory;