// src/api/walletService.js - Complete updated version with funding features
import api from './api';

// Set to false to use real API
const MOCK_MODE = false;

// Get all wallet batches
export const getWalletBatches = () => {
    if (MOCK_MODE) {
        return Promise.resolve({
            success: true,
            batches: [
                { id: 'batch1', name: 'Trading Wallets', wallets: [{}, {}, {}] },
                { id: 'batch2', name: 'Reserve Wallets', wallets: [{}, {}] }
            ]
        });
    }
    return api.get('/wallets/batches');
};

// Get wallet details
export const getWalletDetails = (walletId, batchId) => {
    if (MOCK_MODE) {
        return Promise.resolve({
            success: true,
            wallet: {
                id: walletId,
                address: `sol-wallet-${walletId}`,
                balance: 0.25,
                tokens: [
                    { symbol: 'SOL', balance: 0.25 },
                    { symbol: 'USDC', balance: 10.5 },
                    { symbol: 'TOKEN', balance: 125 }
                ]
            }
        });
    }
    return api.get(`/wallets/details?walletId=${walletId}&batchId=${batchId}`);
};

// Generate new wallets
export const generateWallets = (batchName, walletCount) => {
    if (MOCK_MODE) {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve({
                    success: true,
                    message: `Successfully generated ${walletCount} wallets in batch "${batchName}"`
                });
            }, 1500);
        });
    }

    return api.post('/wallets/generate', { batchName, walletCount });
};

// Fund wallets
export const fundWallets = (batchId, amount, token) => {
    if (MOCK_MODE) {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve({
                    success: true,
                    message: `Successfully sent funding request for batch ${batchId}`,
                    fundingId: `funding-${Date.now()}`
                });
            }, 1500);
        });
    }

    return api.post('/wallets/fund', { batchId, amount, token });
};

// Get funding status
export const getFundingStatus = (fundingId) => {
    if (MOCK_MODE) {
        // Generate mock funding status
        const walletCount = 5;
        const completedCount = Math.min(walletCount, Math.floor(Math.random() * (walletCount + 1)));
        const wallets = Array.from({ length: walletCount }, (_, i) => {
            const status = i < completedCount ? 'completed' : 'pending';
            return {
                id: `wallet-${i}`,
                address: `sol-wallet-${i}`,
                status,
                txid: status === 'completed' ? `tx-${Date.now()}-${i}` : null,
                error: null
            };
        });

        return Promise.resolve({
            success: true,
            funding: {
                id: fundingId,
                batchId: 'batch1',
                batchName: 'Test Batch',
                token: 'SOL',
                amountPerWallet: 0.1,
                totalAmount: 0.1 * walletCount,
                timestamp: new Date().toISOString(),
                status: completedCount === walletCount ? 'completed' : 'processing',
                completedAt: completedCount === walletCount ? new Date().toISOString() : null,
                wallets
            }
        });
    }

    return api.get(`/wallets/funding/${fundingId}`);
};

// Get all funding operations
export const getAllFundingOperations = () => {
    if (MOCK_MODE) {
        return Promise.resolve({
            success: true,
            funding: [
                {
                    id: `funding-${Date.now() - 3600000}`,
                    batchId: 'batch1',
                    batchName: 'Test Batch',
                    token: 'SOL',
                    amountPerWallet: 0.1,
                    totalAmount: 0.3,
                    timestamp: new Date(Date.now() - 3600000).toISOString(),
                    status: 'completed',
                    completedAt: new Date(Date.now() - 3540000).toISOString(),
                    walletCount: 3,
                    walletStatuses: { completed: 3, failed: 0, pending: 0 }
                },
                {
                    id: `funding-${Date.now() - 7200000}`,
                    batchId: 'batch2',
                    batchName: 'Reserve Wallets',
                    token: 'USDC',
                    amountPerWallet: 10,
                    totalAmount: 20,
                    timestamp: new Date(Date.now() - 7200000).toISOString(),
                    status: 'completed_with_errors',
                    completedAt: new Date(Date.now() - 7140000).toISOString(),
                    walletCount: 2,
                    walletStatuses: { completed: 1, failed: 1, pending: 0 }
                }
            ]
        });
    }

    return api.get('/wallets/funding');
};