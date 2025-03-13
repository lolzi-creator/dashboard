import api from './api';
const MOCK_MODE = false;

// Get all active boosts
export const getActiveBoosts = () => {
    return api.get('/boosts');
};

// Get queued boosts
export const getQueuedBoosts = () => {
    return api.get('/queued');
};

// Get details for a specific boost
export const getBoostDetails = (boostId) => {
    return api.get(`/boost/${boostId}`);
};

// Start a new boost
export const startBoost = (boostData) => {
    return api.post('/boost/start', boostData);
};

// Start a queued boost
// src/api/boostService.js - Make sure your startQueuedBoost function is like this:

// Start a queued boost
export const startQueuedBoost = (boostId, walletBatchId) => {
    console.log(`Starting queued boost: ${boostId} with wallet batch: ${walletBatchId}`);

    // Verify parameters before sending to API
    if (!boostId) {
        console.error('No boostId provided to startQueuedBoost');
        return Promise.reject(new Error('Boost ID is required'));
    }

    if (!walletBatchId) {
        console.error('No walletBatchId provided to startQueuedBoost');
        return Promise.reject(new Error('Wallet batch ID is required'));
    }

    return api.post('/queued/start', { boostId, walletBatchId });
};
// Cancel a boost
export const cancelBoost = (boostId) => {
    console.log(`Cancelling boost: ${boostId}`);

    if (!boostId) {
        console.error('No boostId provided to cancelBoost');
        return Promise.reject(new Error('Boost ID is required'));
    }

    return api.post(`/boost/${boostId}/cancel`);
};