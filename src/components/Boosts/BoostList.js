// src/components/Boosts/BoostList.js - Updated with cancel button
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getActiveBoosts, cancelBoost } from '../../api/boostService';
import StatusBadge from '../common/StatusBadge';
import LoadingSpinner from '../common/LoadingSpinner';

const BoostList = ({ compact = false }) => {
    const [boosts, setBoosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const fetchBoosts = async () => {
        try {
            setLoading(true);
            const data = await getActiveBoosts();
            setBoosts(data.boosts || []);
            setLoading(false);
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBoosts();

        // Poll for updates every 20 seconds
        const interval = setInterval(fetchBoosts, 20000);
        return () => clearInterval(interval);
    }, []);

    // Handle boost cancellation
    const handleCancelBoost = async (boostId, e) => {
        // Prevent the row click from being triggered (which would navigate to details)
        e.stopPropagation();

        if (!window.confirm('Are you sure you want to cancel this boost?')) {
            return;
        }

        try {
            setRefreshing(true);
            setError(null);
            setSuccess(null);

            const result = await cancelBoost(boostId);

            if (result.success) {
                setSuccess(`Boost ${boostId} cancelled successfully`);
                // Refresh the boost list
                fetchBoosts();
            } else {
                setError(result.message || 'Failed to cancel boost');
            }

            setRefreshing(false);
        } catch (err) {
            setError(`Error cancelling boost: ${err.message}`);
            setRefreshing(false);
        }
    };

    if (loading) return <LoadingSpinner />;
    if (error) return <p className="error-message">Error loading boosts: {error}</p>;

    if (boosts.length === 0) {
        return <p>No active boosts found.</p>;
    }

    return (
        <div className="boost-list">
            {!compact && <h2>Active Boosts</h2>}
            {success && <div className="success-message">{success}</div>}
            {error && <div className="error-message">{error}</div>}

            <table className="data-table">
                <thead>
                <tr>
                    <th>ID</th>
                    <th>Token</th>
                    <th>Progress</th>
                    <th>Volume</th>
                    {!compact && <th>Trades</th>}
                    {!compact && <th>Buy/Sell</th>}
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
                </thead>
                <tbody>
                {boosts.map(boost => (
                    <tr key={boost.boostId}>
                        <td>{boost.boostId.substring(0, 8)}...</td>
                        <td>{boost.token.substring(0, 8)}...</td>
                        <td>
                            <div className="progress-bar">
                                <div
                                    className="progress-fill"
                                    style={{width: `${boost.volumeProgress || 0}%`}}
                                ></div>
                                <span>{boost.volumeProgress || 0}%</span>
                            </div>
                        </td>
                        <td>${boost.currentVolume?.toFixed(2) || 0} / ${boost.targetVolume}</td>
                        {!compact && <td>{boost.tradeCount || 0}</td>}
                        {!compact && (
                            <td>
                                {boost.buyVolume > 0 || boost.sellVolume > 0 ?
                                    `${((boost.buyVolume / (boost.buyVolume + boost.sellVolume)) * 100).toFixed(1)}% / ${((boost.sellVolume / (boost.buyVolume + boost.sellVolume)) * 100).toFixed(1)}%` :
                                    'N/A'}
                            </td>
                        )}
                        <td><StatusBadge status={boost.active ? 'active' : 'inactive'} /></td>
                        <td className="actions-cell">
                            <Link to={`/boosts/${boost.boostId}`} className="button button-small">
                                Details
                            </Link>
                            <button
                                className="button button-small button-danger"
                                onClick={(e) => handleCancelBoost(boost.boostId, e)}
                                disabled={refreshing || !boost.active}
                            >
                                Cancel
                            </button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
};

export default BoostList;