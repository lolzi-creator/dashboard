import React, { useState, useEffect } from 'react';
import { getWalletBatches, getBatchWallets } from '../../api/walletService';
import LoadingSpinner from '../common/LoadingSpinner';

const WalletList = ({ onWalletSelect }) => {
    const [batches, setBatches] = useState([]);
    const [expandedBatch, setExpandedBatch] = useState(null);
    const [wallets, setWallets] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [batchLoading, setBatchLoading] = useState({});

    useEffect(() => {
        const fetchBatches = async () => {
            try {
                setLoading(true);
                const response = await getWalletBatches();
                setBatches(response.batches || []);
                setLoading(false);
            } catch (err) {
                setError(err.message);
                setLoading(false);
            }
        };

        fetchBatches();
    }, []);

    const toggleBatch = async (batchId) => {
        // If already expanded, collapse it
        if (expandedBatch === batchId) {
            setExpandedBatch(null);
            return;
        }

        // Expand the batch and load its wallets if they're not already loaded
        setExpandedBatch(batchId);

        if (!wallets[batchId]) {
            try {
                setBatchLoading(prev => ({ ...prev, [batchId]: true }));

                // Fetch the wallet balances for this batch
                const response = await getBatchWallets(batchId);

                if (response.success && response.wallets) {
                    setWallets(prev => ({
                        ...prev,
                        [batchId]: response.wallets
                    }));
                } else {
                    throw new Error(response.message || 'Failed to load wallet data');
                }

                setBatchLoading(prev => ({ ...prev, [batchId]: false }));
            } catch (err) {
                console.error(`Error loading wallets for batch ${batchId}:`, err);
                setBatchLoading(prev => ({ ...prev, [batchId]: false }));

                // Set error state for this batch
                setWallets(prev => ({
                    ...prev,
                    [batchId]: 'error'
                }));
            }
        }
    };

    if (loading) return <LoadingSpinner />;
    if (error) return <div className="error-message">Error loading wallet batches: {error}</div>;

    return (
        <div className="wallet-list">
            <h2>Wallet Batches</h2>

            {batches.length === 0 ? (
                <p>No wallet batches found. Generate some wallets to get started.</p>
            ) : (
                <div className="wallet-batches">
                    {batches.map(batch => (
                        <div key={batch.id} className="wallet-batch-card">
                            <div
                                className="batch-header"
                                onClick={() => toggleBatch(batch.id)}
                            >
                                <h3>{batch.name}</h3>
                                <div className="batch-meta">
                                    <span>{batch.wallets.length} wallets</span>
                                    <span className="expand-icon">
                                        {expandedBatch === batch.id ? '▼' : '▶'}
                                    </span>
                                </div>
                            </div>

                            {expandedBatch === batch.id && (
                                <div className="batch-wallets">
                                    {batchLoading[batch.id] ? (
                                        <div className="loading-spinner-small">
                                            <div className="spinner-small"></div>
                                            <span>Loading wallets...</span>
                                        </div>
                                    ) : wallets[batch.id] === 'error' ? (
                                        <div className="error-message">Error loading wallet data</div>
                                    ) : wallets[batch.id] ? (
                                        <table className="data-table">
                                            <thead>
                                            <tr>
                                                <th>Address</th>
                                                <th>Balance</th>
                                                <th>Actions</th>
                                            </tr>
                                            </thead>
                                            <tbody>
                                            {wallets[batch.id].map(wallet => (
                                                <tr key={wallet.id}>
                                                    <td>{wallet.address}</td>
                                                    <td>{wallet.balance} SOL</td>
                                                    <td>
                                                        <button
                                                            className="button button-small"
                                                            onClick={() => onWalletSelect(wallet.id, batch.id)}
                                                        >
                                                            Details
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            </tbody>
                                        </table>
                                    ) : (
                                        <div className="loading-spinner-small">
                                            <div className="spinner-small"></div>
                                            <span>Loading wallets...</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default WalletList;