// src/components/Wallets/FundingList.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllFundingOperations } from '../../api/walletService';
import StatusBadge from '../common/StatusBadge';
import LoadingSpinner from '../common/LoadingSpinner';

const FundingList = () => {
    const [fundingList, setFundingList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchFundingList = async () => {
            try {
                setLoading(true);
                const response = await getAllFundingOperations();
                setFundingList(response.funding || []);
                setLoading(false);
            } catch (err) {
                setError(err.message);
                setLoading(false);
            }
        };

        fetchFundingList();
    }, []);

    if (loading) return <LoadingSpinner />;
    if (error) return <div className="error-message">Error loading funding operations: {error}</div>;

    return (
        <div className="funding-list">
            <h2>Funding Operations</h2>

            {fundingList.length === 0 ? (
                <p>No funding operations found.</p>
            ) : (
                <table className="data-table">
                    <thead>
                    <tr>
                        <th>ID</th>
                        <th>Batch</th>
                        <th>Token</th>
                        <th>Amount/Wallet</th>
                        <th>Total</th>
                        <th>Timestamp</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                    </thead>
                    <tbody>
                    {fundingList.map(funding => {
                        // Calculate completion percentage
                        const totalWallets = funding.walletCount;
                        const completedWallets = funding.walletStatuses?.completed || 0;
                        const progress = totalWallets > 0 ? Math.round((completedWallets / totalWallets) * 100) : 0;

                        return (
                            <tr key={funding.id}>
                                <td>{funding.id.substring(0, 8)}...</td>
                                <td>{funding.batchName}</td>
                                <td>{funding.token}</td>
                                <td>{funding.amountPerWallet} {funding.token}</td>
                                <td>{funding.totalAmount} {funding.token}</td>
                                <td>{new Date(funding.timestamp).toLocaleString()}</td>
                                <td>
                                    <StatusBadge status={funding.status} />
                                    {funding.status === 'processing' && (
                                        <span className="progress-text"> ({progress}%)</span>
                                    )}
                                </td>
                                <td>
                                    <Link
                                        to={`/wallets/funding/${funding.id}`}
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
            )}
        </div>
    );
};

export default FundingList;