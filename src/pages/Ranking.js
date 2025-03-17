// src/pages/Ranking.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import RankingJobList from '../components/Ranking/RankingJobList';
import AddRankingForm from '../components/Ranking/AddRankingForm';
import { getActiveRankingJobs, getCompletedRankingJobs } from '../api/rankingService';
import LoadingSpinner from '../components/common/LoadingSpinner';

const Ranking = () => {
    const [activeTab, setActiveTab] = useState('active');
    const [activeJobs, setActiveJobs] = useState([]);
    const [completedJobs, setCompletedJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);

                // Fetch active jobs
                const activeData = await getActiveRankingJobs();
                setActiveJobs(activeData.jobs || []);

                // Fetch completed jobs
                const completedData = await getCompletedRankingJobs();
                setCompletedJobs(completedData.jobs || []);

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

    // Calculate some statistics for the dashboard cards
    const totalJobs = activeJobs.length;
    const totalTransactions = activeJobs.reduce((sum, job) => sum + (job.transactionCount || 0), 0);
    const totalSuccessful = activeJobs.reduce((sum, job) => sum + (job.successfulTransactions || 0), 0);
    const successRate = totalTransactions > 0 ? ((totalSuccessful / totalTransactions) * 100).toFixed(1) : '0.0';

    if (loading && activeJobs.length === 0 && completedJobs.length === 0) {
        return <LoadingSpinner />;
    }

    return (
        <div className="ranking-page">
            <div className="page-header">
                <div>
                    <h1>DEX Ranking</h1>
                    <p>Boost your token ranking on DEX aggregators</p>
                </div>
                <button
                    className="button"
                    onClick={() => setActiveTab('add')}
                >
                    Start New Job
                </button>
            </div>

            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            {/* Overview Cards */}
            <div className="metrics-grid">
                <div className="metric-card active-boosts" style={{
                    background: 'linear-gradient(135deg, rgba(30, 58, 138, 1) 0%, rgba(30, 58, 138, 0.3) 100%)'
                }}>
                    <div className="metric-header">
                        <h3 className="metric-title">Active Jobs</h3>
                        <div className="metric-icon">📈</div>
                    </div>
                    <div className="metric-value">{totalJobs}</div>
                </div>

                <div className="metric-card total-volume" style={{
                    background: 'linear-gradient(135deg, rgba(15, 118, 110, 1) 0%, rgba(15, 118, 110, 0.3) 100%)'
                }}>
                    <div className="metric-header">
                        <h3 className="metric-title">Transactions</h3>
                        <div className="metric-icon">🔄</div>
                    </div>
                    <div className="metric-value">{totalTransactions}</div>
                </div>

                <div className="metric-card success-rate" style={{
                    background: 'linear-gradient(135deg, rgba(126, 34, 206, 1) 0%, rgba(126, 34, 206, 0.3) 100%)'
                }}>
                    <div className="metric-header">
                        <h3 className="metric-title">Success Rate</h3>
                        <div className="metric-icon">✓</div>
                    </div>
                    <div className="metric-value">{successRate}%</div>
                </div>

                <div className="metric-card total-trades" style={{
                    background: 'linear-gradient(135deg, rgba(124, 45, 18, 1) 0%, rgba(124, 45, 18, 0.3) 100%)'
                }}>
                    <div className="metric-header">
                        <h3 className="metric-title">Completed Jobs</h3>
                        <div className="metric-icon">🏁</div>
                    </div>
                    <div className="metric-value">{completedJobs.length}</div>
                </div>
            </div>

            <div className="tab-container">
                <div className="tab-navigation">
                    <button
                        className={activeTab === 'active' ? 'active' : ''}
                        onClick={() => setActiveTab('active')}
                    >
                        Active Jobs
                    </button>
                    <button
                        className={activeTab === 'completed' ? 'active' : ''}
                        onClick={() => setActiveTab('completed')}
                    >
                        Completed Jobs
                    </button>
                    <button
                        className={activeTab === 'add' ? 'active' : ''}
                        onClick={() => setActiveTab('add')}
                    >
                        Add New Job
                    </button>
                </div>

                <div className="tab-content">
                    {activeTab === 'active' && (
                        <div className="active-jobs-tab">
                            {activeJobs.length === 0 ? (
                                <div className="empty-state">
                                    <div className="empty-icon">📊</div>
                                    <p className="empty-text">No active ranking jobs found</p>
                                    <button
                                        className="button"
                                        onClick={() => setActiveTab('add')}
                                    >
                                        Create Your First Ranking Job
                                    </button>
                                </div>
                            ) : (
                                <RankingJobList jobs={activeJobs} setSuccess={setSuccess} setError={setError} />
                            )}
                        </div>
                    )}

                    {activeTab === 'completed' && (
                        <div className="completed-jobs-tab">
                            {completedJobs.length === 0 ? (
                                <div className="empty-state">
                                    <div className="empty-icon">🏆</div>
                                    <p className="empty-text">No completed ranking jobs found</p>
                                </div>
                            ) : (
                                <div className="jobs-list">
                                    <table className="data-table">
                                        <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Token</th>
                                            <th>DEX</th>
                                            <th>Transactions</th>
                                            <th>Success Rate</th>
                                            <th>Duration</th>
                                            <th>End Date</th>
                                            <th>Actions</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {completedJobs.map(job => {
                                            const successRate = job.transactionCount > 0
                                                ? ((job.successfulTransactions / job.transactionCount) * 100).toFixed(1)
                                                : '0.0';

                                            return (
                                                <tr key={job.id}>
                                                    <td>{job.id.substring(0, 8)}...</td>
                                                    <td>{job.tokenAddress.substring(0, 8)}...</td>
                                                    <td>{job.dexType}</td>
                                                    <td>{job.transactionCount || 0}</td>
                                                    <td>{successRate}%</td>
                                                    <td>
                                                        {job.endTime && job.startTime
                                                            ? ((new Date(job.endTime) - new Date(job.startTime)) / (60 * 60 * 1000)).toFixed(1) + 'h'
                                                            : 'Unknown'
                                                        }
                                                    </td>
                                                    <td>{job.endTime ? new Date(job.endTime).toLocaleString() : 'Unknown'}</td>
                                                    <td>
                                                        <Link
                                                            to={`/ranking/${job.id}`}
                                                            className="button button-small"
                                                        >
                                                            Details
                                                        </Link>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'add' && (
                        <div className="add-job-tab">
                            <AddRankingForm
                                setActiveTab={setActiveTab}
                                setSuccess={setSuccess}
                                setError={setError}
                                refreshJobs={() => getActiveRankingJobs().then(data => setActiveJobs(data.jobs || []))}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Ranking;