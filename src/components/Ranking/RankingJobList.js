// src/components/Ranking/RankingJobList.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getActiveRankingJobs, stopRankingJob } from '../../api/rankingService';
import StatusBadge from '../common/StatusBadge';
import LoadingSpinner from '../common/LoadingSpinner';

const RankingJobList = ({ compact = false }) => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const fetchJobs = async () => {
        try {
            setLoading(true);
            const data = await getActiveRankingJobs();
            setJobs(data.jobs || []);
            setLoading(false);
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchJobs();

        // Poll for updates every 20 seconds
        const interval = setInterval(fetchJobs, 20000);
        return () => clearInterval(interval);
    }, []);

    // Handle job stopping
    const handleStopJob = async (jobId, e) => {
        // Prevent the row click from being triggered
        e.stopPropagation();

        if (!window.confirm('Are you sure you want to stop this ranking job?')) {
            return;
        }

        try {
            setRefreshing(true);
            setError(null);
            setSuccess(null);

            const result = await stopRankingJob(jobId);

            if (result.success) {
                setSuccess(`Ranking job ${jobId} stopped successfully`);
                // Refresh the job list
                fetchJobs();
            } else {
                setError(result.message || 'Failed to stop ranking job');
            }

            setRefreshing(false);
        } catch (err) {
            setError(`Error stopping ranking job: ${err.message}`);
            setRefreshing(false);
        }
    };

    if (loading) return <LoadingSpinner />;
    if (error) return <p className="error-message">Error loading ranking jobs: {error}</p>;

    if (jobs.length === 0) {
        return <p>No active ranking jobs found.</p>;
    }

    return (
        <div className="ranking-job-list">
            {!compact && <h2>Active Ranking Jobs</h2>}
            {success && <div className="success-message">{success}</div>}
            {error && <div className="error-message">{error}</div>}

            <table className="data-table">
                <thead>
                <tr>
                    <th>ID</th>
                    <th>Token</th>
                    <th>DEX</th>
                    <th>Progress</th>
                    <th>Transactions</th>
                    <th>Success Rate</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
                </thead>
                <tbody>
                {jobs.map(job => (
                    <tr key={job.id}>
                        <td>{job.id.substring(0, 8)}...</td>
                        <td>{job.tokenAddress.substring(0, 8)}...</td>
                        <td>{job.dexType}</td>
                        <td>
                            <div className="progress-bar">
                                <div
                                    className="progress-fill"
                                    style={{width: `${job.progress || 0}%`}}
                                ></div>
                                <span>{job.progress || 0}%</span>
                            </div>
                        </td>
                        <td>{job.transactionCount || 0}</td>
                        <td>
                            {job.transactionCount > 0
                                ? `${((job.successfulTransactions / job.transactionCount) * 100).toFixed(1)}%`
                                : '0.0%'}
                        </td>
                        <td><StatusBadge status={job.active ? 'active' : 'inactive'} /></td>
                        <td className="actions-cell">
                            <Link to={`/ranking/${job.id}`} className="button button-small">
                                Details
                            </Link>
                            <button
                                className="button button-small button-danger"
                                onClick={(e) => handleStopJob(job.id, e)}
                                disabled={refreshing || !job.active}
                            >
                                Stop
                            </button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
};

export default RankingJobList;