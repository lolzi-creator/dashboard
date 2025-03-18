import React, { useState, useEffect } from 'react';
import { startBoost } from '../../api/boostService';
import { getWalletBatches } from '../../api/walletService';

const AddBoostForm = () => {
    const [formData, setFormData] = useState({
        tokenAddress: '',
        marketAddress: '',
        duration: 24,
        targetVolume: 5000,
        boostPackage: 'basic',
        startNow: false, // Option to start immediately or queue
        walletBatchId: '' // Only needed when starting immediately
    });

    const [walletBatches, setWalletBatches] = useState([]);
    const [packages] = useState([
        { id: 'basic', name: 'Basic', description: 'Standard volume boost with 1 trade per minute' },
        { id: 'premium', name: 'Premium', description: 'Enhanced volume boost with 2 trades per minute' },
        { id: 'custom', name: 'Custom', description: 'Customized settings for your specific needs' }
    ]);

    const [loading, setLoading] = useState(false);
    const [fetchingWallets, setFetchingWallets] = useState(true);
    const [success, setSuccess] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchWalletBatches = async () => {
            try {
                setFetchingWallets(true);
                const response = await getWalletBatches();
                setWalletBatches(response.batches || []);
                setFetchingWallets(false);
            } catch (err) {
                console.error('Error fetching wallet batches:', err);
                setFetchingWallets(false);
            }
        };

        fetchWalletBatches();
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const validateForm = () => {
        if (!formData.tokenAddress) {
            setError('Token address is required');
            return false;
        }

        if (!formData.marketAddress) {
            setError('Market address is required');
            return false;
        }

        if (formData.startNow && !formData.walletBatchId) {
            setError('Wallet batch is required when starting immediately');
            return false;
        }

        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        try {
            setLoading(true);
            setError(null);
            setSuccess(null);

            // Determine endpoint based on whether to start now or queue
            if (formData.startNow) {
                // Include wallet batch ID when starting immediately
                const result = await startBoost({
                    tokenAddress: formData.tokenAddress,
                    marketAddress: formData.marketAddress,
                    duration: parseInt(formData.duration),
                    targetVolume: parseFloat(formData.targetVolume),
                    boostPackage: formData.boostPackage,
                    walletBatchId: formData.walletBatchId
                });

                if (result.success) {
                    setSuccess(`Boost started successfully! Boost ID: ${result.boostId}`);
                    // Reset form
                    setFormData({
                        tokenAddress: '',
                        marketAddress: '',
                        duration: 24,
                        targetVolume: 5000,
                        boostPackage: 'basic',
                        startNow: false,
                        walletBatchId: ''
                    });
                } else {
                    setError(result.message || 'Failed to start boost');
                }
            } else {
                // Use queued endpoint
                // You need to implement this endpoint in your API
                const response = await fetch('http://localhost:3000/api/queued/add', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        tokenAddress: formData.tokenAddress,
                        marketAddress: formData.marketAddress,
                        duration: parseInt(formData.duration),
                        targetVolume: parseFloat(formData.targetVolume),
                        boostPackage: formData.boostPackage,
                        queuedAt: new Date().toISOString()
                    })
                });

                const result = await response.json();

                if (result.success) {
                    setSuccess('Boost added to queue successfully!');
                    // Reset form
                    setFormData({
                        tokenAddress: '',
                        marketAddress: '',
                        duration: 24,
                        targetVolume: 5000,
                        boostPackage: 'basic',
                        startNow: false,
                        walletBatchId: ''
                    });
                } else {
                    setError(result.message || 'Failed to queue boost');
                }
            }

            setLoading(false);
        } catch (err) {
            setError(`Error: ${err.message}`);
            setLoading(false);
        }
    };

    return (
        <div className="add-boost-form">
            <h2>Add New Boost</h2>

            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            <form onSubmit={handleSubmit}>
                <div className="form-grid">
                    <div className="form-group">
                        <label htmlFor="tokenAddress">Token Address:</label>
                        <input
                            type="text"
                            id="tokenAddress"
                            name="tokenAddress"
                            value={formData.tokenAddress}
                            onChange={handleChange}
                            placeholder="Enter token address (Mint ID)"
                            required
                        />
                        <small>The SPL token address for the token you want to boost</small>
                    </div>

                    <div className="form-group">
                        <label htmlFor="marketAddress">Market Address:</label>
                        <input
                            type="text"
                            id="marketAddress"
                            name="marketAddress"
                            value={formData.marketAddress}
                            onChange={handleChange}
                            placeholder="Enter market address"
                            required
                        />
                        <small>The Serum/Raydium market address for trading</small>
                    </div>

                    <div className="form-group">
                        <label htmlFor="targetVolume">Target Volume ($):</label>
                        <input
                            type="number"
                            id="targetVolume"
                            name="targetVolume"
                            value={formData.targetVolume}
                            onChange={handleChange}
                            min="100"
                            required
                        />
                        <small>Total trading volume to generate (USD)</small>
                    </div>

                    <div className="form-group">
                        <label htmlFor="duration">Duration (hours):</label>
                        <input
                            type="number"
                            id="duration"
                            name="duration"
                            value={formData.duration}
                            onChange={handleChange}
                            min="1"
                            max="168"
                            required
                        />
                        <small>How long the boost should run (1-168 hours)</small>
                    </div>

                    <div className="form-group">
                        <label htmlFor="boostPackage">Boost Package:</label>
                        <select
                            id="boostPackage"
                            name="boostPackage"
                            value={formData.boostPackage}
                            onChange={handleChange}
                            required
                        >
                            {packages.map(pkg => (
                                <option key={pkg.id} value={pkg.id}>{pkg.name}</option>
                            ))}
                        </select>
                        <small>The trading intensity and pattern profile</small>
                    </div>

                    <div className="form-group">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                name="startNow"
                                checked={formData.startNow}
                                onChange={handleChange}
                            />
                            Start boost immediately (otherwise queue for later)
                        </label>
                    </div>

                    {formData.startNow && (
                        <div className="form-group">
                            <label htmlFor="walletBatchId">Wallet Batch:</label>
                            {fetchingWallets ? (
                                <div className="loading-inline">Loading wallet batches...</div>
                            ) : (
                                <select
                                    id="walletBatchId"
                                    name="walletBatchId"
                                    value={formData.walletBatchId}
                                    onChange={handleChange}
                                    required={formData.startNow}
                                >
                                    <option value="">-- Select a wallet batch --</option>
                                    {walletBatches.map(batch => (
                                        <option key={batch.id} value={batch.id}>
                                            {batch.name} ({batch.wallets?.length || 0} wallets)
                                        </option>
                                    ))}
                                </select>
                            )}
                            <small>Required for immediate start - select wallet batch to use</small>
                        </div>
                    )}
                </div>

                <div className="package-details">
                    <h3>Package Details</h3>
                    <div className="package-info">
                        {packages.find(p => p.id === formData.boostPackage)?.description}
                    </div>
                </div>

                <div className="form-actions">
                    <button
                        type="submit"
                        className="button"
                        disabled={loading}
                    >
                        {loading ? 'Processing...' : formData.startNow ? 'Start Boost Now' : 'Add to Queue'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AddBoostForm;