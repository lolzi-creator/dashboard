import React, { useState, useEffect } from 'react';
import { getWalletDetails } from '../../api/walletService';
import LoadingSpinner from '../common/LoadingSpinner';

const WalletDetails = ({ walletId, batchId }) => {
    const [wallet, setWallet] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [transactions, setTransactions] = useState([]);

    useEffect(() => {
        const fetchWalletDetails = async () => {
            try {
                setLoading(true);
                const response = await getWalletDetails(walletId);
                setWallet(response.wallet || null);

                // Mock recent transactions
                const mockTransactions = Array.from({ length: 5 }, (_, i) => ({
                    id: `tx-${i}`,
                    timestamp: new Date(Date.now() - (i * 3600000)).toISOString(),
                    type: Math.random() > 0.5 ? 'RECEIVE' : 'SEND',
                    amount: (Math.random() * 0.5).toFixed(4),
                    token: i % 3 === 0 ? 'USDC' : 'SOL'
                }));

                setTransactions(mockTransactions);
                setLoading(false);
            } catch (err) {
                setError(err.message);
                setLoading(false);
            }
        };

        if (walletId) {
            fetchWalletDetails();
        }
    }, [walletId]);

    if (loading) return <LoadingSpinner />;
    if (error) return <div className="error-message">Error loading wallet details: {error}</div>;
    if (!wallet) return <div className="error-message">Wallet not found</div>;

    return (
        <div className="wallet-details">
            <h2>Wallet Details</h2>

            <div className="detail-card">
                <div className="detail-header">
                    <h3>Wallet Information</h3>
                    <a
                        href={`https://solscan.io/account/${wallet.address}`}
                        target="_blank"
                        rel="noreferrer"
                        className="button button-small"
                    >
                        View on Explorer
                    </a>
                </div>

                <div className="detail-row">
                    <span className="detail-label">Address:</span>
                    <span className="detail-value">{wallet.address}</span>
                </div>

                <div className="detail-row">
                    <span className="detail-label">Balance:</span>
                    <span className="detail-value">{wallet.balance} SOL</span>
                </div>
            </div>

            <div className="tokens-card">
                <h3>Token Balances</h3>

                <table className="data-table">
                    <thead>
                    <tr>
                        <th>Token</th>
                        <th>Balance</th>
                    </tr>
                    </thead>
                    <tbody>
                    {wallet.tokens.map(token => (
                        <tr key={token.symbol}>
                            <td>{token.symbol}</td>
                            <td>{token.balance}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            <div className="transactions-card">
                <h3>Recent Transactions</h3>

                <table className="data-table">
                    <thead>
                    <tr>
                        <th>Time</th>
                        <th>Type</th>
                        <th>Amount</th>
                        <th>Token</th>
                    </tr>
                    </thead>
                    <tbody>
                    {transactions.map(tx => (
                        <tr key={tx.id}>
                            <td>{new Date(tx.timestamp).toLocaleString()}</td>
                            <td className={tx.type === 'RECEIVE' ? 'receive-text' : 'send-text'}>
                                {tx.type}
                            </td>
                            <td>{tx.amount}</td>
                            <td>{tx.token}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default WalletDetails;