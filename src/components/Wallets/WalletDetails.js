import React, { useState, useEffect } from 'react';
import { getWalletDetails } from '../../api/walletService';

const WalletDetails = ({ walletId, batchId }) => {
    const [wallet, setWallet] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        const fetchWalletDetails = async () => {
            try {
                setLoading(true);
                setError(null);

                // Fetch wallet details
                const response = await getWalletDetails(walletId, batchId);

                if (response.success && response.wallet) {
                    setWallet(response.wallet);

                    // If wallet has transactions data
                    if (response.transactions) {
                        setTransactions(response.transactions);
                    }
                } else {
                    throw new Error(response.message || 'Failed to load wallet details');
                }

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

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner-sm"></div>
                <p>Loading wallet details...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="error-message">
                Error loading wallet details: {error}
            </div>
        );
    }

    if (!wallet) {
        return (
            <div className="error-message">
                Wallet not found
            </div>
        );
    }

    return (
        <div className="wallet-details">
            <div className="wallet-header">
                <h2>Wallet Details</h2>
                <div className="header-actions">
                    <button
                        className="button button-small button-secondary"
                        onClick={() => navigator.clipboard.writeText(wallet.address)}
                    >
                        Copy Address
                    </button>
                    <a
                        href={`https://solscan.io/account/${wallet.address}`}
                        target="_blank"
                        rel="noreferrer"
                        className="button button-small"
                    >
                        View on Solscan
                    </a>
                </div>
            </div>

            <div className="wallet-address-card">
                <div className="address-label">Wallet Address</div>
                <div className="address-value">{wallet.address}</div>
            </div>

            <div className="wallet-detail-tabs">
                <div className="tab-navigation small">
                    <button
                        className={activeTab === 'overview' ? 'active' : ''}
                        onClick={() => setActiveTab('overview')}
                    >
                        Overview
                    </button>
                    <button
                        className={activeTab === 'tokens' ? 'active' : ''}
                        onClick={() => setActiveTab('tokens')}
                    >
                        Tokens
                    </button>
                    <button
                        className={activeTab === 'transactions' ? 'active' : ''}
                        onClick={() => setActiveTab('transactions')}
                    >
                        Transactions
                    </button>
                </div>

                <div className="wallet-tab-content">
                    {activeTab === 'overview' && (
                        <div className="overview-tab">
                            <div className="balance-cards">
                                <div className="balance-card">
                                    <div className="balance-header">
                                        <h3>SOL Balance</h3>
                                        <div className="sol-icon">◎</div>
                                    </div>
                                    <div className="balance-amount">{wallet.balance} SOL</div>
                                    <div className="balance-usd">
                                        ≈ ${(parseFloat(wallet.balance) * 150).toFixed(2)} USD
                                    </div>
                                </div>

                                <div className="balance-card">
                                    <div className="balance-header">
                                        <h3>Token Count</h3>
                                        <div className="token-icon">🪙</div>
                                    </div>
                                    <div className="balance-amount">
                                        {wallet.tokens?.length || 0}
                                    </div>
                                    <div className="balance-subtext">
                                        {wallet.tokens?.length > 0 ? 'Tokens found' : 'No tokens found'}
                                    </div>
                                </div>

                                <div className="balance-card">
                                    <div className="balance-header">
                                        <h3>Transaction Count</h3>
                                        <div className="tx-icon">🔄</div>
                                    </div>
                                    <div className="balance-amount">
                                        {transactions.length || 0}
                                    </div>
                                    <div className="balance-subtext">
                                        {transactions.length > 0 ? 'Recent transactions' : 'No transactions'}
                                    </div>
                                </div>
                            </div>

                            <div className="nft-section">
                                <h3>NFTs</h3>
                                {wallet.nfts && wallet.nfts.length > 0 ? (
                                    <div className="nft-grid">
                                        {wallet.nfts.map((nft, index) => (
                                            <div key={index} className="nft-card">
                                                <div className="nft-image">
                                                    {nft.imageUrl ? (
                                                        <img src={nft.imageUrl} alt={nft.name} />
                                                    ) : (
                                                        <div className="nft-placeholder">🖼️</div>
                                                    )}
                                                </div>
                                                <div className="nft-info">
                                                    <div className="nft-name">{nft.name || 'Unnamed NFT'}</div>
                                                    <div className="nft-collection">{nft.collection || 'Unknown Collection'}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="empty-section">
                                        <p>No NFTs found in this wallet</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'tokens' && (
                        <div className="tokens-tab">
                            <h3>Token Balances</h3>

                            {wallet.tokens && wallet.tokens.length > 0 ? (
                                <div className="tokens-table-container">
                                    <table className="tokens-table">
                                        <thead>
                                        <tr>
                                            <th>Token</th>
                                            <th>Symbol</th>
                                            <th>Balance</th>
                                            <th>Value (USD)</th>
                                            <th>Actions</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {wallet.tokens.map((token, index) => (
                                            <tr key={index}>
                                                <td className="token-name">
                                                    {token.name || token.symbol || token.mintAddress}
                                                </td>
                                                <td>{token.symbol}</td>
                                                <td>{token.balance}</td>
                                                <td>
                                                    {token.usdValue ?
                                                        `$${token.usdValue.toFixed(2)}` :
                                                        'Unknown'
                                                    }
                                                </td>
                                                <td>
                                                    <a
                                                        href={`https://solscan.io/token/${token.mintAddress}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="button button-small"
                                                    >
                                                        View
                                                    </a>
                                                </td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="empty-section">
                                    <p>No tokens found in this wallet</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'transactions' && (
                        <div className="transactions-tab">
                            <h3>Recent Transactions</h3>

                            {transactions && transactions.length > 0 ? (
                                <div className="wallet-transactions-table-container">
                                    <table className="wallet-transactions-table">
                                        <thead>
                                        <tr>
                                            <th>Time</th>
                                            <th>Type</th>
                                            <th>Amount</th>
                                            <th>Status</th>
                                            <th>Signature</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {transactions.map((tx, index) => (
                                            <tr key={index} className={tx.success ? '' : 'error-row'}>
                                                <td>{new Date(tx.timestamp).toLocaleString()}</td>
                                                <td className={tx.type.toLowerCase() === 'receive' ? 'receive-text' : 'send-text'}>
                                                    {tx.type}
                                                </td>
                                                <td>
                                                    {tx.amount} {tx.token || 'SOL'}
                                                </td>
                                                <td>
                                                        <span className={`status-badge ${tx.success ? 'success' : 'failed'}`}>
                                                            {tx.success ? 'Success' : 'Failed'}
                                                        </span>
                                                </td>
                                                <td>
                                                    <a
                                                        href={`https://solscan.io/tx/${tx.signature}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="tx-link"
                                                    >
                                                        {tx.signature.substring(0, 8)}...
                                                    </a>
                                                </td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="empty-section">
                                    <p>No transactions found for this wallet</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WalletDetails;