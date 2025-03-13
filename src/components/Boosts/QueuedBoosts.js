// src/components/Boosts/QueuedBoosts.js - Fixed version
import React, { useState, useEffect } from 'react';
import { getQueuedBoosts, startQueuedBoost } from '../../api/boostService';
import { getWalletBatches } from '../../api/walletService';
import LoadingSpinner from '../common/LoadingSpinner';

const QueuedBoosts = () => {
    const [queuedBoosts, setQueuedBoosts] = useState([]);
    const [walletBatches, setWalletBatches] = useState([]);
    const [selectedBoostId, setSelectedBoostId] = useState(null);
    const [selectedWalletBatch, setSelectedWalletBatch] = useState(null);
    const [loading, setLoading] = useState(true);
    const [startingBoost, setStartingBoost] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // Fetch queued boosts
                console.log("Fetching queued boosts...");
                const boostsData = await getQueuedBoosts();
                console.log("Queued boosts data:", boostsData);
                setQueuedBoosts(boostsData.boosts || []);

                // Fetch wallet batches
                console.log("Fetching wallet batches...");
                const walletsData = await getWalletBatches();
                console.log("Wallet batches data:", walletsData);
                setWalletBatches(walletsData.batches || []);

                setLoading(false);
            } catch (err) {
                console.error("Error fetching data:", err);
                setError(err.message);
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleStartBoost = async () => {
        if (!selectedBoostId || !selectedWalletBatch) {
            setError('Please select both a boost and a wallet batch');
            return;
        }

        try {
            setStartingBoost(true);
            setError(null);
            setSuccess(null);

            console.log(`Starting queued boost: ${selectedBoostId} with wallet batch: ${selectedWalletBatch}`);

            const result = await startQueuedBoost(selectedBoostId, selectedWalletBatch);
            console.log("Start queued boost result:", result);

            if (result.success) {
                setSuccess(`Boost started successfully! Boost ID: ${result.boostId}`);

                // Refresh queued boosts after starting one
                const boostsData = await getQueuedBoosts();
                setQueuedBoosts(boostsData.boosts || []);

                // Reset selections
                setSelectedBoostId(null);
                setSelectedWalletBatch(null);
            } else {
                setError(result.message || 'Failed to start boost');
            }

            setStartingBoost(false);
        } catch (err) {
            console.error("Error starting boost:", err);
            setError(`Error starting boost: ${err.message}`);
            setStartingBoost(false);
        }
    };

    // Helper function to safely display token addresses
    const safeSubstring = (str, start, end) => {
        if (!str) return 'Unknown';
        return str.substring(start, end);
    };

    // Helper to get token display string
    const getTokenDisplay = (boost) => {
        // Check for various possible token address properties
        if (boost.tokenAddress) {
            return `${safeSubstring(boost.tokenAddress, 0, 8)}...`;
        }
        if (boost.token) {
            return `${safeSubstring(boost.token, 0, 8)}...`;
        }
        return 'Unknown token';
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="queued-boosts">
            <h2>Queued Boosts</h2>

            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            {queuedBoosts.length === 0 ? (
                <p>No queued boosts found.</p>
            ) : (
                <>
                    <div className="card">
                        <h3>Start a Queued Boost</h3>

                        <div className="form-group">
                            <label>Select Boost:</label>
                            <select
                                value={selectedBoostId || ''}
                                onChange={e => setSelectedBoostId(e.target.value)}
                            >
                                <option value="">-- Select a boost --</option>
                                {queuedBoosts.map(boost => (
                                    <option key={boost.id} value={boost.id}>
                                        {getTokenDisplay(boost)} - {boost.queuedAt ? new Date(boost.queuedAt).toLocaleString() : 'Unknown date'}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Select Wallet Batch:</label>
                            <select
                                value={selectedWalletBatch || ''}
                                onChange={e => setSelectedWalletBatch(e.target.value)}
                            >
                                <option value="">-- Select a wallet batch --</option>
                                {walletBatches.map(batch => (
                                    <option key={batch.id} value={batch.id}>
                                        {batch.name} ({batch.wallets ? batch.wallets.length : 0} wallets)
                                    </option>
                                ))}
                            </select>
                        </div>

                        <button
                            className="button"
                            onClick={handleStartBoost}
                            disabled={startingBoost || !selectedBoostId || !selectedWalletBatch}
                        >
                            {startingBoost ? 'Starting...' : 'Start Boost'}
                        </button>
                    </div>

                    <div className="queue-list">
                        <h3>All Queued Boosts</h3>

                        <table className="data-table">
                            <thead>
                            <tr>
                                <th>ID</th>
                                <th>Token</th>
                                <th>Target Volume</th>
                                <th>Duration</th>
                                <th>Package</th>
                                <th>Queued At</th>
                            </tr>
                            </thead>
                            <tbody>
                            {queuedBoosts.map(boost => (
                                <tr key={boost.id}
                                    className={selectedBoostId === boost.id ? 'selected-row' : ''}
                                    onClick={() => setSelectedBoostId(boost.id)}
                                >
                                    <td>{boost.id ? safeSubstring(boost.id, 0, 10) : 'Unknown'}...</td>
                                    <td>{getTokenDisplay(boost)}</td>
                                    <td>${boost.targetVolume || 0}</td>
                                    <td>{boost.duration || 0} hours</td>
                                    <td>{boost.boostPackage || 'Unknown'}</td>
                                    <td>{boost.queuedAt ? new Date(boost.queuedAt).toLocaleString() : 'Unknown'}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
};

export default QueuedBoosts;