import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getActiveBoosts, cancelBoost, getQueuedBoosts, startQueuedBoost } from '../api/boostService';
import { getWalletBatches } from '../api/walletService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import AddBoostForm from '../components/Boosts/AddBoostForm';

const Boosts = () => {
    const [activeTab, setActiveTab] = useState('active');
    const [activeBoosts, setActiveBoosts] = useState([]);
    const [queuedBoosts, setQueuedBoosts] = useState([]);
    const [walletBatches, setWalletBatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [selectedBoostId, setSelectedBoostId] = useState(null);
    const [selectedWalletBatch, setSelectedWalletBatch] = useState(null);
    const [isStartingBoost, setIsStartingBoost] = useState(false);
    const [isCancellingBoost, setIsCancellingBoost] = useState(false);

    // Fetch data on component mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);

                // Fetch active boosts
                const boostsData = await getActiveBoosts();
                setActiveBoosts(boostsData.boosts || []);

                // Fetch queued boosts
                const queuedData = await getQueuedBoosts();
                setQueuedBoosts(queuedData.boosts || []);

                // Fetch wallet batches
                const walletsData = await getWalletBatches();
                setWalletBatches(walletsData.batches || []);

                setLoading(false);
            } catch (err) {
                setError(`Error fetching data: ${err.message}`);
                setLoading(false);
            }
        };

        fetchData();

        // Refresh data every 30 seconds
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, []);

    // Handle boost cancellation
    const handleCancelBoost = async (boostId, e) => {
        if (e) e.stopPropagation();

        if (!window.confirm('Are you sure you want to cancel this boost?')) {
            return;
        }

        try {
            setIsCancellingBoost(true);
            setError(null);
            setSuccess(null);

            const result = await cancelBoost(boostId);

            if (result.success) {
                setSuccess(`Boost ${boostId} cancelled successfully`);

                // Update the active boosts list
                setActiveBoosts(prevBoosts => prevBoosts.filter(boost => boost.boostId !== boostId));
            } else {
                setError(result.message || 'Failed to cancel boost');
            }

            setIsCancellingBoost(false);
        } catch (err) {
            setError(`Error cancelling boost: ${err.message}`);
            setIsCancellingBoost(false);
        }
    };

    // Handle starting a queued boost
    const handleStartQueuedBoost = async () => {
        if (!selectedBoostId || !selectedWalletBatch) {
            setError('Please select both a boost and a wallet batch');
            return;
        }

        try {
            setIsStartingBoost(true);
            setError(null);
            setSuccess(null);

            const result = await startQueuedBoost(selectedBoostId, selectedWalletBatch);

            if (result.success) {
                setSuccess(`Boost started successfully! Boost ID: ${result.boostId}`);

                // Remove from queued boosts
                setQueuedBoosts(prevBoosts => prevBoosts.filter(boost => boost.id !== selectedBoostId));

                // Reset selections
                setSelectedBoostId(null);
                setSelectedWalletBatch(null);

                // Refresh active boosts
                const boostsData = await getActiveBoosts();
                setActiveBoosts(boostsData.boosts || []);
            } else {
                setError(result.message || 'Failed to start boost');
            }

            setIsStartingBoost(false);
        } catch (err) {
            setError(`Error starting boost: ${err.message}`);
            setIsStartingBoost(false);
        }
    };

    // Function to get token display string
    const getTokenDisplay = (boost) => {
        if (boost.tokenAddress) {
            return `${boost.tokenAddress.substring(0, 8)}...`;
        }
        if (boost.token) {
            return `${boost.token.substring(0, 8)}...`;
        }
        return 'Unknown token';
    };

    // If loading, show spinner
    if (loading) return <LoadingSpinner />;

    return (
        <div className="boosts-page">
            <div className="page-header">
                <div>
                    <h1>Boosts</h1>
                    <p>Manage volume boosting operations</p>
                </div>
                <button
                    className="button"
                    onClick={() => setActiveTab('add')}
                >
                    Add New Boost
                </button>
            </div>

            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            <div className="tab-container">
                <div className="tab-navigation">
                    <button
                        className={activeTab === 'active' ? 'active' : ''}
                        onClick={() => setActiveTab('active')}
                    >
                        Active Boosts
                    </button>
                    <button
                        className={activeTab === 'queued' ? 'active' : ''}
                        onClick={() => setActiveTab('queued')}
                    >
                        Queued Boosts
                    </button>
                    <button
                        className={activeTab === 'add' ? 'active' : ''}
                        onClick={() => setActiveTab('add')}
                    >
                        Add New Boost
                    </button>
                </div>

                <div className="tab-content">
                    {activeTab === 'active' && (
                        <div className="active-boosts-tab">
                            {activeBoosts.length === 0 ? (
                                <div className="empty-state">
                                    <div className="empty-icon">🚀</div>
                                    <p className="empty-text">No active boosts found</p>
                                    <button
                                        className="button"
                                        onClick={() => setActiveTab('add')}
                                    >
                                        Create Your First Boost
                                    </button>
                                </div>
                            ) : (
                                <div className="boosts-table">
                                    <div className="table-header">
                                        <div className="th">ID</div>
                                        <div className="th">Token</div>
                                        <div className="th">Progress</div>
                                        <div className="th">Volume</div>
                                        <div className="th">Status</div>
                                        <div className="th">Actions</div>
                                    </div>

                                    <div className="table-body">
                                        {activeBoosts.map(boost => {
                                            const progress = parseFloat(boost.volumeProgress) || 0;

                                            return (
                                                <div key={boost.boostId} className="table-row">
                                                    <div className="td id-cell">
                                                        {boost.boostId.substring(0, 10)}...
                                                    </div>
                                                    <div className="td token-cell">
                                                        {boost.token.substring(0, 8)}...
                                                    </div>
                                                    <div className="td progress-cell">
                                                        <div className="progress-container">
                                                            <div className="progress-bar">
                                                                <div
                                                                    className="progress-fill"
                                                                    style={{ width: `${progress}%` }}
                                                                ></div>
                                                            </div>
                                                            <span className="progress-text">{progress.toFixed(1)}%</span>
                                                        </div>
                                                    </div>
                                                    <div className="td volume-cell">
                                                        ${(boost.currentVolume || 0).toFixed(2)} / ${boost.targetVolume}
                                                    </div>
                                                    <div className="td status-cell">
                                                        <span className={`status-badge ${boost.active ? 'active' : 'inactive'}`}>
                                                            {boost.active ? 'ACTIVE' : 'INACTIVE'}
                                                        </span>
                                                    </div>
                                                    <div className="td actions-cell">
                                                        <Link
                                                            to={`/boosts/${boost.boostId}`}
                                                            className="button button-small"
                                                        >
                                                            Details
                                                        </Link>
                                                        <button
                                                            className="button button-small button-danger"
                                                            onClick={(e) => handleCancelBoost(boost.boostId, e)}
                                                            disabled={isCancellingBoost || !boost.active}
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'queued' && (
                        <div className="queued-boosts-tab">
                            {queuedBoosts.length === 0 ? (
                                <div className="empty-state">
                                    <div className="empty-icon">📋</div>
                                    <p className="empty-text">No queued boosts found</p>
                                    <button
                                        className="button"
                                        onClick={() => setActiveTab('add')}
                                    >
                                        Add a Boost to Queue
                                    </button>
                                </div>
                            ) : (
                                <div className="queued-boosts-container">
                                    <div className="start-boost-card">
                                        <h3>Start a Queued Boost</h3>

                                        <div className="form-group">
                                            <label>Select Boost:</label>
                                            <select
                                                value={selectedBoostId || ''}
                                                onChange={e => setSelectedBoostId(e.target.value)}
                                                className="select-input"
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
                                                className="select-input"
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
                                            onClick={handleStartQueuedBoost}
                                            disabled={isStartingBoost || !selectedBoostId || !selectedWalletBatch}
                                        >
                                            {isStartingBoost ? 'Starting...' : 'Start Boost'}
                                        </button>
                                    </div>

                                    <div className="queue-list">
                                        <h3>All Queued Boosts</h3>

                                        <div className="boosts-table">
                                            <div className="table-header">
                                                <div className="th">ID</div>
                                                <div className="th">Token</div>
                                                <div className="th">Target Volume</div>
                                                <div className="th">Duration</div>
                                                <div className="th">Package</div>
                                                <div className="th">Queued At</div>
                                            </div>

                                            <div className="table-body">
                                                {queuedBoosts.map(boost => (
                                                    <div
                                                        key={boost.id}
                                                        className={`table-row ${selectedBoostId === boost.id ? 'selected-row' : ''}`}
                                                        onClick={() => setSelectedBoostId(boost.id)}
                                                    >
                                                        <div className="td">{boost.id ? boost.id.substring(0, 10) : 'Unknown'}...</div>
                                                        <div className="td">{getTokenDisplay(boost)}</div>
                                                        <div className="td">${boost.targetVolume || 0}</div>
                                                        <div className="td">{boost.duration || 0} hours</div>
                                                        <div className="td">{boost.boostPackage || 'Unknown'}</div>
                                                        <div className="td">{boost.queuedAt ? new Date(boost.queuedAt).toLocaleString() : 'Unknown'}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'add' && (
                        <div className="add-boost-tab">
                            <AddBoostForm />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Boosts;