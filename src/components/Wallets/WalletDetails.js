import React, { useState, useEffect } from 'react';
import { getWalletDetails } from '../../api/walletService';
import LoadingSpinner from '../common/LoadingSpinner';

const WalletDetails = ({ walletId, batchId }) => {
    const [wallet, setWallet] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchWalletDetails = async () => {
            try {
                setLoading(true);
                const response = await getWalletDetails(walletId, batchId);

                console.log("Response from API:", response);
                setWallet(response.wallet || null);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching wallet details:', err);
                setError(err.message || 'Failed to load wallet details');
                setLoading(false);
            }
        };

        if (walletId && batchId) {
            fetchWalletDetails();
        } else {
            setLoading(false);
            setError('Wallet ID and batch ID are required');
        }
    }, [walletId, batchId]);

    if (loading) return <LoadingSpinner />;
    if (error) return <div className="error-message">Error loading wallet details: {error}</div>;
    if (!wallet) return <div className="error-message">Wallet not found</div>;

    return (
        <div className="wallet-details">
            <h2>Wallet Details</h2>

            <div className="card">
                <h3>Basic Information</h3>
                <div><strong>Address:</strong> {wallet.address}</div>
                <div><strong>Balance:</strong> {wallet.balance} SOL</div>

                <h3>Tokens</h3>
                <div>
                    {wallet.tokens && wallet.tokens.map(token => (
                        <div key={token.symbol}>
                            <strong>{token.symbol}:</strong> {token.balance}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default WalletDetails;