// src/components/Ranking/AddRankingForm.js
import React, { useState, useEffect } from 'react';
import { startRankingJob } from '../../api/rankingService';
import { getWalletBatches } from '../../api/walletService';


const AddRankingForm = ({ setActiveTab, setSuccess, setError, refreshJobs }) => {
    const [formData, setFormData] = useState({
        tokenAddress: '',
        dexType: 'OPENBOOK',
        transactionsPerHour: 1000,
        transactionsPerSecond: 0.28, // New field for transactions per second
        priceRange: 0.1,
        tradeSize: 0.01,
        duration: 24,
        makerOnly: true,
        staggered: true,
        walletBatchId: ''
    });

    const [walletBatches, setWalletBatches] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fetchingWallets, setFetchingWallets] = useState(true);
    const [usePerSecond, setUsePerSecond] = useState(false); // Toggle between per hour and per second

    // Fetch wallet batches on component mount
    useEffect(() => {
        const fetchWalletBatches = async () => {
            try {
                setFetchingWallets(true);
                const response = await getWalletBatches();
                setWalletBatches(response.batches || []);
                setFetchingWallets(false);
            } catch (err) {
                console.error('Error fetching wallet batches:', err);
                setError('Error fetching wallet batches: ' + err.message);
                setFetchingWallets(false);
            }
        };

        fetchWalletBatches();
    }, [setError]);

    // Sync transactions per hour/second when either one changes
    useEffect(() => {
        if (usePerSecond) {
            // When using per second, update per hour
            const perHour = Math.round(formData.transactionsPerSecond * 3600);
            setFormData(prev => ({
                ...prev,
                transactionsPerHour: perHour
            }));
        } else {
            // When using per hour, update per second
            const perSecond = parseFloat((formData.transactionsPerHour / 3600).toFixed(2));
            setFormData(prev => ({
                ...prev,
                transactionsPerSecond: perSecond
            }));
        }
    }, [usePerSecond, formData.transactionsPerHour, formData.transactionsPerSecond]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        if (name === 'transactionsPerHour' && !usePerSecond) {
            // Update transactions per hour directly
            const perHour = parseInt(value);
            const perSecond = parseFloat((perHour / 3600).toFixed(2));
            setFormData(prev => ({
                ...prev,
                transactionsPerHour: perHour,
                transactionsPerSecond: perSecond
            }));
        } else if (name === 'transactionsPerSecond' && usePerSecond) {
            // Update transactions per second directly
            const perSecond = parseFloat(value);
            const perHour = Math.round(perSecond * 3600);
            setFormData(prev => ({
                ...prev,
                transactionsPerSecond: perSecond,
                transactionsPerHour: perHour
            }));
        } else {
            // Handle other form inputs
            setFormData(prev => ({
                ...prev,
                [name]: type === 'checkbox'
                    ? checked
                    : type === 'number'
                        ? parseFloat(value)
                        : value
            }));
        }
    };

    const validateForm = () => {
        if (!formData.tokenAddress) {
            setError('Token address is required');
            return false;
        }

        if (!formData.walletBatchId) {
            setError('Wallet batch is required');
            return false;
        }

        // Due to RPC limits, set a max reasonable rate
        if (formData.transactionsPerHour > 5400) {
            setError('Maximum transaction rate is 5,400 per hour (1.5 per second) due to RPC rate limits');
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

            // Start the ranking job
            const result = await startRankingJob(formData);

            if (result.success) {
                setSuccess(`Ranking job started successfully! Job ID: ${result.jobId}`);

                // Reset form
                setFormData({
                    tokenAddress: '',
                    dexType: 'OPENBOOK',
                    transactionsPerHour: 1000,
                    transactionsPerSecond: 0.28,
                    priceRange: 0.1,
                    tradeSize: 0.01,
                    duration: 24,
                    makerOnly: true,
                    staggered: true,
                    walletBatchId: ''
                });

                // Refresh jobs list and switch to active tab
                refreshJobs();
                refreshJobs();
                setActiveTab('active');
            } else {
                setError(result.message || 'Failed to start ranking job');
            }

            setLoading(false);
        } catch (err) {
            setError(`Error: ${err.message}`);
            setLoading(false);
        }
    };

    // Toggle between transactions per hour and per second
    const toggleRateUnit = () => {
        setUsePerSecond(!usePerSecond);
    };

    return (
        <div className="add-ranking-form">
            <h2>Start New DEX Ranking Job</h2>

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
                        <small>The SPL token address for the token to rank</small>
                    </div>

                    <div className="form-group">
                        <label htmlFor="dexType">DEX Type:</label>
                        <select
                            id="dexType"
                            name="dexType"
                            value={formData.dexType}
                            onChange={handleChange}
                        >
                            <option value="OPENBOOK">OpenBook (Serum)</option>
                            <option value="RAYDIUM">Raydium</option>
                            <option value="ORCA">Orca</option>
                            <option value="JUPITER">Jupiter (Recommended)</option>
                        </select>
                        <small>The DEX to target for ranking</small>
                    </div>

                    <div className="form-group">
                        <label>
                            Transaction Rate:
                            <button
                                type="button"
                                className="unit-toggle"
                                onClick={toggleRateUnit}
                                style={{marginLeft: '10px', fontSize: '12px'}}
                            >
                                Switch to {usePerSecond ? 'per hour' : 'per second'}
                            </button>
                        </label>

                        {usePerSecond ? (
                            <>
                                <input
                                    type="number"
                                    id="transactionsPerSecond"
                                    name="transactionsPerSecond"
                                    value={formData.transactionsPerSecond}
                                    onChange={handleChange}
                                    min="0.01"
                                    max="1.5"
                                    step="0.1"
                                    required
                                />
                                <small>Transactions per second (max 1.5) = {formData.transactionsPerHour} per hour</small>
                            </>
                        ) : (
                            <>
                                <input
                                    type="number"
                                    id="transactionsPerHour"
                                    name="transactionsPerHour"
                                    value={formData.transactionsPerHour}
                                    onChange={handleChange}
                                    min="1"
                                    max="5400"
                                    required
                                />
                                <small>Transactions per hour (max 5,400) = {formData.transactionsPerSecond} per second</small>
                            </>
                        )}
                    </div>

                    <div className="form-group">
                        <label htmlFor="priceRange">Price Range (%):</label>
                        <input
                            type="number"
                            id="priceRange"
                            name="priceRange"
                            value={formData.priceRange}
                            onChange={handleChange}
                            min="0.01"
                            max="5"
                            step="0.01"
                            required
                        />
                        <small>Price range as a percentage of market price</small>
                    </div>

                    <div className="form-group">
                        <label htmlFor="tradeSize">Trade Size (USD):</label>
                        <input
                            type="number"
                            id="tradeSize"
                            name="tradeSize"
                            value={formData.tradeSize}
                            onChange={handleChange}
                            min="0.01"
                            step="0.01"
                            required
                        />
                        <small>Size of each trade in USD</small>
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
                        <small>How long the ranking job should run (1-168 hours)</small>
                    </div>

                    <div className="form-group">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                name="makerOnly"
                                checked={formData.makerOnly}
                                onChange={handleChange}
                            />
                            Maker Only (Limit Orders)
                        </label>
                        <small>Only place maker orders to avoid paying fees</small>
                    </div>

                    <div className="form-group">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                name="staggered"
                                checked={formData.staggered}
                                onChange={handleChange}
                            />
                            Staggered Execution
                        </label>
                        <small>Evenly distribute transactions over time</small>
                    </div>

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
                                required
                            >
                                <option value="">-- Select a wallet batch --</option>
                                {walletBatches.map(batch => (
                                    <option key={batch.id} value={batch.id}>
                                        {batch.name} ({batch.wallets?.length || 0} wallets)
                                    </option>
                                ))}
                            </select>
                        )}
                        <small>Wallet batch to use for ranking transactions</small>
                    </div>
                </div>

                <div className="strategy-details">
                    <h3>Strategy Details</h3>
                    <p>
                        This ranking strategy will execute {formData.transactionsPerHour} transactions per hour
                        ({formData.transactionsPerSecond} per second) for {formData.duration} hours, using
                        { formData.makerOnly ? ' maker (limit)' : ' taker (market)' } orders
                        with trade sizes of ${formData.tradeSize} each. Transactions will be
                        { formData.staggered ? ' staggered evenly' : ' executed in bursts' }.
                    </p>
                    <p>
                        <strong>Estimated Total Volume:</strong> ${(formData.transactionsPerHour * formData.duration * formData.tradeSize).toFixed(2)}
                    </p>
                    <p>
                        <strong>Note:</strong> Make sure your wallets are funded with enough SOL and tokens!
                    </p>
                </div>

                <div className="form-actions">
                    <button
                        type="submit"
                        className="button"
                        disabled={loading}
                    >
                        {loading ? 'Starting...' : 'Start Ranking Job'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AddRankingForm;