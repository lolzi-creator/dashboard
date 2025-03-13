import api from './api';

// Set to true for mock data
const MOCK_MODE = true;

// Get all settings
export const getSettings = async () => {
    if (MOCK_MODE) {
        // Return mock settings data
        return Promise.resolve({
            success: true,
            settings: {
                api: {
                    apiUrl: 'http://localhost:3000',
                    rpcEndpoint: 'https://api.mainnet-beta.solana.com'
                },
                boost: {
                    defaultPackage: 'basic',
                    buyToSellRatio: 3,
                    minTradeSize: 0.0002,
                    maxTradeSize: 0.0015,
                    tradesPerMinute: 1.2
                },
                jupiter: {
                    defaultSlippage: 1.0,
                    useJupiterRouting: true,
                    prioritizeTopRoutes: true
                },
                notification: {
                    enableNotifications: false,
                    notifyOnBoostStart: true,
                    notifyOnBoostEnd: true,
                    notifyOnError: true,
                    webhookUrl: ''
                },
                ui: {
                    refreshInterval: 30,
                    darkMode: true,
                    compactMode: false
                }
            }
        });
    }

    return api.get('/settings');
};

// Update settings
export const updateSettings = async (settingsData) => {
    if (MOCK_MODE) {
        // Simulate API delay
        return new Promise(resolve => {
            setTimeout(() => {
                console.log('Settings would be updated with:', settingsData);
                resolve({
                    success: true,
                    message: 'Settings updated successfully'
                });
            }, 800);
        });
    }

    return api.post('/settings', settingsData);
};

// Additional settings endpoints can be added here:

// Get only API settings
export const getApiSettings = async () => {
    if (MOCK_MODE) {
        const response = await getSettings();
        return {
            success: true,
            settings: response.settings.api
        };
    }

    return api.get('/settings/api');
};

// Update only API settings
export const updateApiSettings = async (apiSettings) => {
    if (MOCK_MODE) {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve({
                    success: true,
                    message: 'API settings updated successfully'
                });
            }, 800);
        });
    }

    return api.post('/settings/api', apiSettings);
};

// Reset settings to defaults
export const resetSettings = async () => {
    if (MOCK_MODE) {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve({
                    success: true,
                    message: 'All settings reset to defaults'
                });
            }, 800);
        });
    }

    return api.post('/settings/reset');
};