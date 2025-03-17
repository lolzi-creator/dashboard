import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    getWalletBatches,
    getBatchWallets,
    generateWallets,
    fundWallets,
    getAllFundingOperations
} from '../api/walletService';
import WalletDetails from '../components/Wallets/WalletDetails';
import FundingHistory from '../components/Wallets/FundingHistory';

const Wallets = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('wallets');
    const [batches, setBatches] = useState([]);
    const [selectedBatch, setSelectedBatch] = useState(null);
    const [expandedBatch, setExpandedBatch] = useState(null);
    const [wallets, setWallets] = useState({});
    const [selectedWallet, setSelectedWallet] = useState(null);
    const [loading, setLoading] = useState(true);
    const [batchLoading, setBatchLoading] = useState({});
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [fundingHistory, setFundingHistory] = useState([]);
    const [stats, setStats] = useState({
        totalWallets: 0,
        totalBatches: 0,
        averageBalance: 0,
        fundedWallets: 0
    });

    // New wallet form state
    const [newWalletForm, setNewWalletForm] = useState({
        batchName: '',
        walletCount: 3
    });

    // Fund wallets form state
    const [fundWalletForm, setFundWalletForm] = useState({
        batchId: '',
        amount: 0.1,
        token: 'SOL'
    });

    // Form submission states
    const [generatingWallets, setGeneratingWallets] = useState(false);
    const [fundingWallets, setFundingWallets] = useState(false);

    useEffect(() => {
        fetchWalletData();
    }, []);

    const fetchWalletData = async () => {
        try {
            setLoading(true);
            setError(null);

            // Fetch wallet batches
            const batchesData = await getWalletBatches();
            setBatches(batchesData.batches || []);

            // Calculate statistics
            calculateStats(batchesData.batches || []);

            // Fetch funding history
            const fundingData = await getAllFundingOperations();
            setFundingHistory(fundingData.funding || []);

            setLoading(false);
        } catch (err) {
            setError(`Error loading wallet data: ${err.message}`);
            setLoading(false);
        }
    };

    const calculateStats = (batchesData) => {
        let totalWallets = 0;
        let totalBalance = 0;
        let fundedWallets = 0;

        batchesData.forEach(batch => {
            if (batch.wallets) {
                totalWallets += batch.wallets.length;

                batch.wallets.forEach(wallet => {
                    const balance = parseFloat(wallet.balance || 0);
                    totalBalance += balance;
                    if (balance > 0) fundedWallets++;
                });
            }
        });

        setStats({
            totalWallets,
            totalBatches: batchesData.length,
            averageBalance: totalWallets > 0 ? totalBalance / totalWallets : 0,
            fundedWallets
        });
    };

    const toggleBatch = async (batchId) => {
        // If already expanded, collapse it
        if (expandedBatch === batchId) {
            setExpandedBatch(null);
            return;
        }

        // Expand the batch and load its wallets if not already loaded
        setExpandedBatch(batchId);
        setSelectedBatch(batchId);

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

    const handleWalletSelect = (walletId) => {
        setSelectedWallet(walletId);
        setActiveTab('details');
    };

    const handleNewWalletChange = (e) => {
        const { name, value } = e.target;
        setNewWalletForm(prev => ({
            ...prev,
            [name]: name === 'walletCount' ? parseInt(value) : value
        }));
    };

    const handleFundWalletChange = (e) => {
        const { name, value } = e.target;
        setFundWalletForm(prev => ({
            ...prev,
            [name]: name === 'amount' ? parseFloat(value) : value
        }));
    };

    const handleGenerateWallets = async (e) => {
        e.preventDefault();
        setGeneratingWallets(true);
        setSuccess(null);
        setError(null);

        try {
            const { batchName, walletCount } = newWalletForm;

            if (!batchName) {
                throw new Error('Batch name is required');
            }

            if (walletCount < 1 || walletCount > 50) {
                throw new Error('Wallet count must be between 1 and 50');
            }

            const result = await generateWallets(batchName, walletCount);

            if (result.success) {
                setSuccess(`Successfully generated ${walletCount} wallets in batch "${batchName}"`);

                // Reset form
                setNewWalletForm({
                    batchName: '',
                    walletCount: 3
                });

                // Refresh data
                fetchWalletData();
            } else {
                throw new Error(result.message || 'Failed to generate wallets');
            }
        } catch (err) {
            setError(`Error generating wallets: ${err.message}`);
        } finally {
            setGeneratingWallets(false);
        }
    };

    const handleFundWallets = async (e) => {
        e.preventDefault();
        setFundingWallets(true);
        setSuccess(null);
        setError(null);

        try {
            const { batchId, amount, token } = fundWalletForm;

            if (!batchId) {
                throw new Error('Please select a wallet batch');
            }

            if (amount <= 0) {
                throw new Error('Amount must be greater than 0');
            }

            const result = await fundWallets(batchId, amount, token);

            if (result.success) {
                setSuccess(`Successfully initiated funding of ${token} to wallets in batch. Funding ID: ${result.fundingId}`);

                // Optionally navigate to funding status
                if (result.fundingId) {
                    navigate(`/wallets/funding/${result.fundingId}`);
                }

                // Reset form
                setFundWalletForm({
                    batchId: '',
                    amount: 0.1,
                    token: 'SOL'
                });

                // Refresh data
                fetchWalletData();
            } else {
                throw new Error(result.message || 'Failed to fund wallets');
            }
        } catch (err) {
            setError(`Error funding wallets: ${err.message}`);
        } finally {
            setFundingWallets(false);
        }
    };

    // Find the selected batch name for the funding summary
    const selectedBatchName = batches.find(b => b.id === fundWalletForm.batchId)?.name || '';
    const selectedBatchWalletCount = batches.find(b => b.id === fundWalletForm.batchId)?.wallets?.length || 0;
    const totalFundingAmount = (fundWalletForm.amount * selectedBatchWalletCount).toFixed(4);

    if (loading && batches.length === 0) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Loading wallet data...</p>
            </div>
        );
    }

    return (
        <div className="wallets-page">
            <div className="page-header">
                <div>
                    <h1>Wallet Management</h1>
                    <p className="subtitle">Manage and fund your trading wallets</p>
                </div>
                <div className="header-actions">
                    <button className="button" onClick={() => setActiveTab('generate')}>
                        Generate New Wallets
                    </button>
                    <button className="button" onClick={() => setActiveTab('fund')}>
                        Fund Wallets
                    </button>
                </div>
            </div>

            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            <div className="wallet-summary">
                <div className="summary-card">
                    <div className="summary-icon">💼</div>
                    <div className="summary-details">
                        <h3>Total Wallets</h3>
                        <div className="summary-value">{stats.totalWallets}</div>
                        <div className="summary-subtext">In {stats.totalBatches} batches</div>
                    </div>
                </div>

                <div className="summary-card">
                    <div className="summary-icon">💰</div>
                    <div className="summary-details">
                        <h3>Average Balance</h3>
                        <div className="summary-value">{stats.averageBalance.toFixed(4)} SOL</div>
                        <div className="summary-subtext">{stats.fundedWallets} funded wallets</div>
                    </div>
                </div>

                <div className="summary-card">
                    <div className="summary-icon">🔐</div>
                    <div className="summary-details">
                        <h3>Security</h3>
                        <div className="summary-value">Encrypted</div>
                        <div className="summary-subtext">Private keys securely stored</div>
                    </div>
                </div>

                <div className="summary-card">
                    <div className="summary-icon">📝</div>
                    <div className="summary-details">
                        <h3>Recent Activity</h3>
                        <div className="summary-value">{fundingHistory.length}</div>
                        <div className="summary-subtext">Funding operations</div>
                    </div>
                </div>
            </div>

            <div className="tab-container">
                <div className="tab-navigation">
                    <button
                        className={activeTab === 'wallets' ? 'active' : ''}
                        onClick={() => setActiveTab('wallets')}
                    >
                        Wallet Batches
                    </button>
                    {selectedWallet && (
                        <button
                            className={activeTab === 'details' ? 'active' : ''}
                            onClick={() => setActiveTab('details')}
                        >
                            Wallet Details
                        </button>
                    )}
                    <button
                        className={activeTab === 'generate' ? 'active' : ''}
                        onClick={() => setActiveTab('generate')}
                    >
                        Generate Wallets
                    </button>
                    <button
                        className={activeTab === 'fund' ? 'active' : ''}
                        onClick={() => setActiveTab('fund')}
                    >
                        Fund Wallets
                    </button>
                    <button
                        className={activeTab === 'history' ? 'active' : ''}
                        onClick={() => setActiveTab('history')}
                    >
                        Funding History
                    </button>
                </div>

                <div className="tab-content">
                    {activeTab === 'wallets' && (
                        <div className="wallets-tab">
                            <h2>Wallet Batches</h2>

                            {batches.length === 0 ? (
                                <div className="empty-state">
                                    <div className="empty-icon">💼</div>
                                    <p>No wallet batches found</p>
                                    <button
                                        className="button button-primary"
                                        onClick={() => setActiveTab('generate')}
                                    >
                                        Generate Your First Wallets
                                    </button>
                                </div>
                            ) : (
                                <div className="wallet-batches">
                                    {batches.map(batch => (
                                        <div key={batch.id} className="wallet-batch-card">
                                            <div
                                                className={`batch-header ${expandedBatch === batch.id ? 'expanded' : ''}`}
                                                onClick={() => toggleBatch(batch.id)}
                                            >
                                                <div className="batch-info">
                                                    <h3>{batch.name}</h3>
                                                    <span className="wallet-count">
                                                        {batch.wallets?.length || 0} wallets
                                                    </span>
                                                </div>
                                                <div className="batch-actions">
                                                    <span className="expand-icon">
                                                        {expandedBatch === batch.id ? '▼' : '▶'}
                                                    </span>
                                                </div>
                                            </div>

                                            {expandedBatch === batch.id && (
                                                <div className="batch-content">
                                                    {batchLoading[batch.id] ? (
                                                        <div className="loading-inline">
                                                            <div className="spinner-sm"></div>
                                                            <span>Loading wallets...</span>
                                                        </div>
                                                    ) : wallets[batch.id] === 'error' ? (
                                                        <div className="error-message">Error loading wallet data</div>
                                                    ) : wallets[batch.id] ? (
                                                        <>
                                                            <div className="batch-actions-bar">
                                                                <button
                                                                    className="button button-small"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setFundWalletForm(prev => ({
                                                                            ...prev,
                                                                            batchId: batch.id
                                                                        }));
                                                                        setActiveTab('fund');
                                                                    }}
                                                                >
                                                                    Fund Batch
                                                                </button>
                                                                <button
                                                                    className="button button-small button-secondary"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                >
                                                                    Export Keys
                                                                </button>
                                                            </div>

                                                            <div className="wallets-table-container">
                                                                <table className="wallets-table">
                                                                    <thead>
                                                                    <tr>
                                                                        <th>Address</th>
                                                                        <th>SOL Balance</th>
                                                                        <th>Tokens</th>
                                                                        <th>Actions</th>
                                                                    </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                    {wallets[batch.id].map(wallet => (
                                                                        <tr key={wallet.id}>
                                                                            <td className="address-cell">
                                                                                {wallet.address}
                                                                                <button
                                                                                    className="copy-button"
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        navigator.clipboard.writeText(wallet.address);
                                                                                    }}
                                                                                    title="Copy address"
                                                                                >
                                                                                    📋
                                                                                </button>
                                                                            </td>
                                                                            <td className={parseFloat(wallet.balance) > 0 ? 'balance-positive' : ''}>
                                                                                {wallet.balance} SOL
                                                                            </td>
                                                                            <td>
                                                                                {wallet.tokens?.length ? (
                                                                                    <div className="token-badges">
                                                                                        {wallet.tokens.map((token, i) => (
                                                                                            <span key={i} className="token-badge">
                                                                                                    {token.symbol}: {token.balance}
                                                                                                </span>
                                                                                        ))}
                                                                                    </div>
                                                                                ) : (
                                                                                    <span className="no-tokens">No tokens</span>
                                                                                )}
                                                                            </td>
                                                                            <td>
                                                                                <button
                                                                                    className="button button-small"
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        handleWalletSelect(wallet.id);
                                                                                    }}
                                                                                >
                                                                                    Details
                                                                                </button>
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <div className="loading-inline">
                                                            <div className="spinner-sm"></div>
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
                    )}

                    {activeTab === 'details' && selectedWallet && (
                        <div className="wallet-details-tab">
                            <WalletDetails walletId={selectedWallet} batchId={selectedBatch} />
                        </div>
                    )}

                    {activeTab === 'generate' && (
                        <div className="generate-wallets-tab">
                            <h2>Generate New Wallets</h2>

                            <div className="info-card">
                                <div className="info-icon">ℹ️</div>
                                <div className="info-content">
                                    <p>Generate new Solana wallets for use with the volume bot. Wallets are created in batches for easier management.</p>
                                    <p>All wallet private keys are encrypted and stored securely on the server. Never share your private keys with anyone.</p>
                                </div>
                            </div>

                            <form onSubmit={handleGenerateWallets} className="wallet-form">
                                <div className="form-group">
                                    <label htmlFor="batchName">Batch Name:</label>
                                    <input
                                        type="text"
                                        id="batchName"
                                        name="batchName"
                                        value={newWalletForm.batchName}
                                        onChange={handleNewWalletChange}
                                        placeholder="e.g., Trading Wallets March 2025"
                                        required
                                    />
                                    <small>A descriptive name to identify this group of wallets</small>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="walletCount">Number of Wallets:</label>
                                    <input
                                        type="number"
                                        id="walletCount"
                                        name="walletCount"
                                        value={newWalletForm.walletCount}
                                        onChange={handleNewWalletChange}
                                        min="1"
                                        max="50"
                                        required
                                    />
                                    <small>How many wallets to generate in this batch (1-50)</small>
                                </div>

                                <div className="form-actions">
                                    <button
                                        type="submit"
                                        className="button"
                                        disabled={generatingWallets}
                                    >
                                        {generatingWallets ? 'Generating...' : 'Generate Wallets'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {activeTab === 'fund' && (
                        <div className="fund-wallets-tab">
                            <h2>Fund Wallets</h2>

                            <div className="info-card">
                                <div className="info-icon">ℹ️</div>
                                <div className="info-content">
                                    <p>Send funds to all wallets in a batch at once. This will distribute the specified amount to each wallet in the selected batch.</p>
                                    <p>Make sure your connected wallet has sufficient balance to cover the total funding amount.</p>
                                </div>
                            </div>

                            <form onSubmit={handleFundWallets} className="wallet-form">
                                <div className="form-group">
                                    <label htmlFor="batchId">Wallet Batch:</label>
                                    <select
                                        id="batchId"
                                        name="batchId"
                                        value={fundWalletForm.batchId}
                                        onChange={handleFundWalletChange}
                                        required
                                    >
                                        <option value="">-- Select a wallet batch --</option>
                                        {batches.map(batch => (
                                            <option key={batch.id} value={batch.id}>
                                                {batch.name} ({batch.wallets?.length || 0} wallets)
                                            </option>
                                        ))}
                                    </select>
                                    <small>Select which batch of wallets to fund</small>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="amount">Amount per Wallet:</label>
                                    <input
                                        type="number"
                                        id="amount"
                                        name="amount"
                                        value={fundWalletForm.amount}
                                        onChange={handleFundWalletChange}
                                        min="0.001"
                                        step="0.001"
                                        required
                                    />
                                    <small>Amount to send to each wallet in the batch</small>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="token">Token:</label>
                                    <select
                                        id="token"
                                        name="token"
                                        value={fundWalletForm.token}
                                        onChange={handleFundWalletChange}
                                        required
                                    >
                                        <option value="SOL">SOL</option>
                                        <option value="USDC">USDC</option>
                                    </select>
                                    <small>Token to send to the wallets</small>
                                </div>

                                {fundWalletForm.batchId && (
                                    <div className="funding-summary">
                                        <h3>Funding Summary</h3>
                                        <div className="summary-item">
                                            <span>Selected Batch:</span>
                                            <span>{selectedBatchName}</span>
                                        </div>
                                        <div className="summary-item">
                                            <span>Number of Wallets:</span>
                                            <span>{selectedBatchWalletCount}</span>
                                        </div>
                                        <div className="summary-item">
                                            <span>Amount per Wallet:</span>
                                            <span>{fundWalletForm.amount} {fundWalletForm.token}</span>
                                        </div>
                                        <div className="summary-item total">
                                            <span>Total Amount:</span>
                                            <span>{totalFundingAmount} {fundWalletForm.token}</span>
                                        </div>
                                    </div>
                                )}

                                <div className="form-actions">
                                    <button
                                        type="submit"
                                        className="button"
                                        disabled={fundingWallets || !fundWalletForm.batchId}
                                    >
                                        {fundingWallets ? 'Processing...' : 'Fund Wallets'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {activeTab === 'history' && (
                        <div className="funding-history-tab">
                            <FundingHistory fundingHistory={fundingHistory} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Wallets;