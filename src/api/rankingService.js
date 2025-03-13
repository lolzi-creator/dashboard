// src/api/rankingService.js
import api from './api';

// Get all active ranking jobs
export const getActiveRankingJobs = () => {
    return api.get('/ranking/jobs');
};

// Get a specific ranking job
export const getRankingJob = (jobId) => {
    return api.get(`/ranking/job/${jobId}`);
};

// Get logs for a ranking job
export const getRankingJobLogs = (jobId) => {
    return api.get(`/ranking/job/${jobId}/logs`);
};

// Start a new ranking job
export const startRankingJob = (params) => {
    return api.post('/ranking/start', params);
};

// Stop a ranking job
export const stopRankingJob = (jobId) => {
    return api.post(`/ranking/job/${jobId}/stop`);
};

// Get completed ranking jobs
export const getCompletedRankingJobs = () => {
    return api.get('/ranking/completed');
};