// src/components/Ranking/RankingJobList.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { stopRankingJob } from '../../api/rankingService';
import StatusBadge from '../common/StatusBadge';
import LoadingSpinner from '../common/LoadingSpinner';

const RankingJobList = ({ jobs, setSuccess, setError }) => {
    const [loading, setLoading] = useState(false);
    const [stoppingJob, setStoppingJob] = useState(null);

    // Handle job stopping
    const handleStopJob = async (jobId, e) => {
        // Prevent the row click from being triggered
        if (e) e.stopPropagation();

        if (!window.confirm('Are you sure you want to stop this ranking job?')) {
            return;
        }

        try {
            setStoppingJob(jobId);
            setError(null);
            setSuccess(null);

            const result = await stopRankingJob(jobId);

            if (result.success) {
                setSuccess(`Ranking job ${jobId} stopped successfully`);
            } else {
                setError(result.message || 'Failed to stop ranking job');
            }

            setStoppingJob(null);
        } catch (err) {
            setError(`Error stopping ranking job: ${err.message}`);
            setStoppingJob(null);
        }
    };

    if (loading) return <LoadingSpinner />;
    if (!jobs || jobs.length === 0) return <p>No active ranking jobs found.</p>;

    return (
        <div className="ranking-job-list">
            <div className="table-header">
                <div className="th">ID</div>
                <div className="th">Token</div>
                <div className="th">DEX</div>
                <div className="th">Progress</div>
                <div className="th">Transactions</div>
                <div className="th">Success Rate</div>
                <div className="th">Status</div>
                <div className="th">Actions</div>
            </div>

            <div className="table-body">
                {jobs.map(job => {
                    const progress = parseFloat(job.progress) || 0;
                    const successRate = job.transactionCount > 0
                        ? ((job.successfulTransactions / job.transactionCount) * 100).toFixed(1)
                        : "0.0";

                    return (
                        <div key={job.id} className="table-row">
                            <div className="td id-cell">
                                {job.id.substring(0, 10)}...
                            </div>
                            <div className="td token-cell">
                                {job.tokenAddress.substring(0, 8)}...
                            </div>
                            <div className="td">
                                {job.dexType}
                            </div>
                            <div className="td progress-cell">
                                <div className="progress-container">
                                    <div className="progress-bar">
                                        <div
                                            className="progress-fill"
                                            style={{
                                                width: `${progress}%`,
                                                background: 'linear-gradient(90deg, #3a86ff 0%, #8b5cf6 100%)'
                                            }}
                                        ></div>
                                    </div>
                                    <span className="progress-text">{progress.toFixed(1)}%</span>
                                </div>
                            </div>
                            <div className="td">
                                {job.transactionCount || 0}
                            </div>
                            <div className="td">
                                {successRate}%
                            </div>
                            <div className="td status-cell">
                                <span className={`status-badge ${job.active ? 'active' : 'inactive'}`}>
                                    {job.active ? 'ACTIVE' : 'INACTIVE'}
                                </span>
                            </div>
                            <div className="td actions-cell">
                                <Link
                                    to={`/ranking/${job.id}`}
                                    className="button button-small"
                                >
                                    Details
                                </Link>
                                <button
                                    className="button button-small button-danger"
                                    onClick={(e) => handleStopJob(job.id, e)}
                                    disabled={stoppingJob === job.id || !job.active}
                                >
                                    {stoppingJob === job.id ? 'Stopping...' : 'Stop'}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default RankingJobList;