// src/components/Wallets/WalletFunder.js - Updated to use the API service
import React, { useState, useEffect } from 'react';
import { getWalletBatches, fundWallets } from '../../api/walletService';
import LoadingSpinner from '../common/LoadingSpinner';

const WalletFunder = () => {
    const [batches, setBatches] = useState([]);
    const [formData, setFormData] = useState({
        batchId: '',
        amount: 0.1,
        token: 'SOL'
    });

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(null);
    const [error, setError] = useState(null);

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

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'amount' ? parseFloat(value) : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.batchId) {
            setError('Please select a wallet batch');
            return;
        }

        try {
            setSubmitting(true);
            setError(null);
            setSuccess(null);

            // Call the API service
            const result = await fundWallets(
                formData.batchId,
                formData.amount,
                formData.token
            );

            if (result.success) {
                const selectedBatch = batches.find(b => b.id === formData.batchId);
                const walletCount = selectedBatch.wallets.length;

                setSuccess(result.message || `Successfully funded ${walletCount} wallets with ${formData.amount} ${formData.token} each`);

                // Reset form
                setFormData({
                    batchId: '',
                    amount: 0.1,
                    token: 'SOL'
                });
            } else {
                setError(result.message || 'Failed to fund wallets');
            }

            setSubmitting(false);
        } catch (err) {
            setError(`Error funding wallets: ${err.message}`);
            setSubmitting(false);
        }
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="wallet-funder">
            <h2>Fund Wallets</h2>

            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            <div className="funder-info">
                <p>Send funds to all wallets in a batch at once. This will distribute the specified amount to each wallet in the batch.</p>
            </div>

            <form onSubmit={handleSubmit} className="fund-form">
                <div className="form-group">
                    <label htmlFor="batchId">Wallet Batch:</label>
                    <select
                        id="batchId"
                        name="batchId"
                        value={formData.batchId}
                        onChange={handleChange}
                        required
                    >
                        <option value="">-- Select a wallet batch --</option>
                        {batches.map(batch => (
                            <option key={batch.id} value={batch.id}>
                                {batch.name} ({batch.wallets.length} wallets)
                            </option>
                        ))}
                    </select>
                </div>

                <div className="form-group">
                    <label htmlFor="amount">Amount per Wallet:</label>
                    <input
                        type="number"
                        id="amount"
                        name="amount"
                        value={formData.amount}
                        onChange={handleChange}
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
                        value={formData.token}
                        onChange={handleChange}
                        required
                    >
                        <option value="SOL">SOL</option>
                        <option value="USDC">USDC</option>
                    </select>
                </div>

                <div className="form-actions">
                    <button
                        type="submit"
                        className="button"
                        disabled={submitting}
                    >
                        {submitting ? 'Funding...' : 'Fund Wallets'}
                    </button>
                </div>

                {formData.batchId && (
                    <div className="funding-summary">
                        <h4>Funding Summary</h4>
                        <div className="summary-item">
                            <span>Selected Batch:</span>
                            <span>{batches.find(b => b.id === formData.batchId)?.name}</span>
                        </div>
                        <div className="summary-item">
                            <span>Number of Wallets:</span>
                            <span>{batches.find(b => b.id === formData.batchId)?.wallets.length}</span>
                        </div>
                        <div className="summary-item">
                            <span>Amount per Wallet:</span>
                            <span>{formData.amount} {formData.token}</span>
                        </div>
                        <div className="summary-item total">
                            <span>Total Amount:</span>
                            <span>
                {(formData.amount * batches.find(b => b.id === formData.batchId)?.wallets.length).toFixed(4)} {formData.token}
              </span>
                        </div>
                    </div>
                )}
            </form>
        </div>
    );
};

export default WalletFunder;