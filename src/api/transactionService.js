// src/api/transactionService.js - Make sure this file has the full content:

import api from './api';

// Temporary mock mode
const MOCK_MODE = false;

// Get transactions for a boost
export const getBoostTransactions = (boostId) => {

    if (MOCK_MODE) {
        // Generate mock transaction data
        const transactions = [];
        const sides = ['buy', 'sell'];

        for (let i = 0; i < 20; i++) {
            const timestamp = new Date(Date.now() - (i * 5 * 60 * 1000)); // 5 min intervals
            const side = sides[Math.floor(Math.random() * sides.length)];
            const success = Math.random() > 0.1; // 90% success rate

            transactions.push({
                timestamp: timestamp.toISOString(),
                side,
                size: side === 'buy' ? 0.0002 + (Math.random() * 0.0003) : 0.01 + (Math.random() * 0.04),
                price: side === 'buy' ? 25 + (Math.random() * 5) : 24 + (Math.random() * 5),
                value: side === 'buy' ? 0.005 : 0.25,
                success,
                signature: success ? `tx-${Math.floor(1000000000 + Math.random() * 9000000000)}` : null
            });
        }

        return Promise.resolve({
            success: true,
            transactions
        });
    }

    return api.get(`/boost/${boostId}/transactions`);
};

// Get logs for a boost
export const getBoostLogs = (boostId) => {
    if (MOCK_MODE) {
        // Generate mock log data
        const logs = [];
        const types = ['attempt', 'quote', 'transaction', 'success', 'error'];

        for (let i = 0; i < 30; i++) {
            const timestamp = new Date(Date.now() - (i * 3 * 60 * 1000)); // 3 min intervals
            const type = types[Math.floor(Math.random() * types.length)];

            let logEntry = {
                timestamp: timestamp.toISOString(),
                type
            };

            switch (type) {
                case 'attempt':
                    logEntry = {
                        ...logEntry,
                        side: Math.random() > 0.5 ? 'buy' : 'sell',
                        tokenAddress: 'Ddm4DTxNZxABUYm2A87TFLY6GDG2ktM2eJhGZS3EbzHM',
                        amount: Math.random() > 0.5 ? 0.0003 : 0.02
                    };
                    break;
                case 'quote':
                    logEntry = {
                        ...logEntry,
                        inAmount: Math.floor(300000 + Math.random() * 200000),
                        outAmount: Math.floor(8000 + Math.random() * 3000)
                    };
                    break;
                case 'transaction':
                    logEntry = {
                        ...logEntry,
                        txid: `tx-${Math.floor(1000000000 + Math.random() * 9000000000)}`
                    };
                    break;
                case 'success':
                    logEntry = {
                        ...logEntry,
                        side: Math.random() > 0.5 ? 'buy' : 'sell',
                        amount: Math.random() > 0.5 ? 0.0003 : 0.02,
                        txid: `tx-${Math.floor(1000000000 + Math.random() * 9000000000)}`
                    };
                    break;
                case 'error':
                    logEntry = {
                        ...logEntry,
                        message: 'Jupiter quote failed: 429 Too Many Requests'
                    };
                    break;
            }

            logs.push(logEntry);
        }

        return Promise.resolve({
            success: true,
            logs
        });
    }

    return api.get(`/boost/${boostId}/logs`);
};

// Get all completed boosts
export const getCompletedBoosts = (limit = 10) => {

    if (MOCK_MODE) {

        const completedBoosts = [];

        for (let i = 0; i < limit; i++) {
            const endTime = new Date(Date.now() - (i * 12 * 60 * 60 * 1000)); // 12 hour intervals
            const startTime = new Date(endTime - (24 * 60 * 60 * 1000)); // 24 hour duration

            const targetVolume = 1000 + Math.floor(Math.random() * 9000);
            const completion = 0.7 + (Math.random() * 0.3); // 70-100% completion
            const achievedVolume = targetVolume * completion;

            completedBoosts.push({
                boostId: `boost-${Math.floor(1000000000 + Math.random() * 9000000000)}`,
                token: 'Ddm4DTxNZxABUYm2A87TFLY6GDG2ktM2eJhGZS3EbzHM',
                package: Math.random() > 0.5 ? 'basic' : 'premium',
                duration: 24,
                targetVolume,
                achievedVolume,
                buyVolume: achievedVolume * 0.7,
                sellVolume: achievedVolume * 0.3,
                completion: completion * 100,
                successfulTrades: 50 + Math.floor(Math.random() * 100),
                failedTrades: Math.floor(Math.random() * 10),
                tradeCount: 50 + Math.floor(Math.random() * 110),
                successRate: (90 + Math.random() * 9).toFixed(1),
                startTime: startTime.toISOString(),
                endTime: endTime.toISOString()
            });
        }

        return Promise.resolve({
            success: true,
            count: completedBoosts.length,
            boosts: completedBoosts
        });
    }

    return api.get(`/completed?limit=${limit}`);
};

// Get recent transactions across all boosts
export const getRecentTransactions = (limit = 20) => {

    if (MOCK_MODE) {

        // Generate mock transaction data
        const transactions = [];
        const sides = ['buy', 'sell'];

        for (let i = 0; i < limit; i++) {
            const timestamp = new Date(Date.now() - (i * 5 * 60 * 1000)); // 5 min intervals
            const side = sides[Math.floor(Math.random() * sides.length)];
            const success = Math.random() > 0.1; // 90% success rate

            transactions.push({
                timestamp: timestamp.toISOString(),
                side,
                size: side === 'buy' ? 0.0002 + (Math.random() * 0.0003) : 0.01 + (Math.random() * 0.04),
                price: side === 'buy' ? 25 + (Math.random() * 5) : 24 + (Math.random() * 5),
                value: side === 'buy' ? 0.005 : 0.25,
                success,
                boostId: `boost-${Math.floor(1000000000 + Math.random() * 9000000000)}`,
                signature: success ? `tx-${Math.floor(1000000000 + Math.random() * 9000000000)}` : null
            });
        }

        return Promise.resolve({
            success: true,
            transactions
        });
    }

    return api.get(`/transactions?limit=${limit}`);
};