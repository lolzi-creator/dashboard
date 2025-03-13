import React, { useState, useEffect } from 'react';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { getSettings, updateSettings } from '../api/settingsService';

const Settings = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // Settings state organized by category
    const [apiSettings, setApiSettings] = useState({
        apiUrl: 'http://localhost:3000',
        rpcEndpoint: ''
    });

    const [boostSettings, setBoostSettings] = useState({
        defaultPackage: 'basic',
        buyToSellRatio: 3,
        minTradeSize: 0.0001,
        maxTradeSize: 0.001,
        tradesPerMinute: 1,
    });

    const [jupiterSettings, setJupiterSettings] = useState({
        defaultSlippage: 1.0,
        useJupiterRouting: true,
        prioritizeTopRoutes: true
    });

    const [notificationSettings, setNotificationSettings] = useState({
        enableNotifications: false,
        notifyOnBoostStart: true,
        notifyOnBoostEnd: true,
        notifyOnError: true,
        webhookUrl: ''
    });

    const [uiSettings, setUiSettings] = useState({
        refreshInterval: 30,
        darkMode: true,
        compactMode: false
    });

    // Load settings on component mount
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                setLoading(true);

                // Get settings from API
                const response = await getSettings();

                if (response.success) {
                    // Update states with fetched settings
                    if (response.settings.api) setApiSettings(response.settings.api);
                    if (response.settings.boost) setBoostSettings(response.settings.boost);
                    if (response.settings.jupiter) setJupiterSettings(response.settings.jupiter);
                    if (response.settings.notification) setNotificationSettings(response.settings.notification);
                    if (response.settings.ui) setUiSettings(response.settings.ui);
                } else {
                    setError('Failed to load settings: ' + response.message);
                }

                setLoading(false);
            } catch (err) {
                setError(`Error loading settings: ${err.message}`);
                setLoading(false);
            }
        };

        fetchSettings();
    }, []);

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setSaving(true);
            setError(null);
            setSuccess(null);

            // Combine all settings
            const allSettings = {
                api: apiSettings,
                boost: boostSettings,
                jupiter: jupiterSettings,
                notification: notificationSettings,
                ui: uiSettings
            };

            // Save settings to backend
            const response = await updateSettings(allSettings);

            if (response.success) {
                setSuccess('Settings saved successfully!');

                // Clear success message after 3 seconds
                setTimeout(() => setSuccess(null), 3000);
            } else {
                setError(`Failed to save settings: ${response.message}`);
            }

            setSaving(false);
        } catch (err) {
            setError(`Error saving settings: ${err.message}`);
            setSaving(false);
        }
    };

    // Handle input changes for API settings
    const handleApiChange = (e) => {
        const { name, value } = e.target;
        setApiSettings(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Handle input changes for boost settings
    const handleBoostChange = (e) => {
        const { name, value, type } = e.target;
        setBoostSettings(prev => ({
            ...prev,
            [name]: type === 'number' ? parseFloat(value) : value
        }));
    };

    // Handle input changes for Jupiter settings
    const handleJupiterChange = (e) => {
        const { name, value, type, checked } = e.target;
        setJupiterSettings(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : type === 'number' ? parseFloat(value) : value
        }));
    };

    // Handle input changes for notification settings
    const handleNotificationChange = (e) => {
        const { name, value, type, checked } = e.target;
        setNotificationSettings(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    // Handle input changes for UI settings
    const handleUiChange = (e) => {
        const { name, value, type, checked } = e.target;
        setUiSettings(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : type === 'number' ? parseInt(value) : value
        }));
    };

    // Handle reset to defaults
    const handleReset = () => {
        if (window.confirm('Are you sure you want to reset all settings to defaults?')) {
            // Reset to default settings
            setApiSettings({
                apiUrl: 'http://localhost:3000',
                rpcEndpoint: ''
            });

            setBoostSettings({
                defaultPackage: 'basic',
                buyToSellRatio: 3,
                minTradeSize: 0.0001,
                maxTradeSize: 0.001,
                tradesPerMinute: 1,
            });

            setJupiterSettings({
                defaultSlippage: 1.0,
                useJupiterRouting: true,
                prioritizeTopRoutes: true
            });

            setNotificationSettings({
                enableNotifications: false,
                notifyOnBoostStart: true,
                notifyOnBoostEnd: true,
                notifyOnError: true,
                webhookUrl: ''
            });

            setUiSettings({
                refreshInterval: 30,
                darkMode: true,
                compactMode: false
            });

            setSuccess('Settings reset to defaults');

            // Clear success message after 3 seconds
            setTimeout(() => setSuccess(null), 3000);
        }
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="settings-page">
            <div className="page-header">
                <h1>Settings</h1>
                <div className="header-actions">
                    <button
                        className="button button-danger"
                        onClick={handleReset}
                    >
                        Reset to Defaults
                    </button>
                </div>
            </div>

            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            <form onSubmit={handleSubmit}>
                <div className="settings-section card">
                    <h2>API Settings</h2>
                    <div className="form-group">
                        <label htmlFor="apiUrl">API URL:</label>
                        <input
                            type="text"
                            id="apiUrl"
                            name="apiUrl"
                            value={apiSettings.apiUrl}
                            onChange={handleApiChange}
                            placeholder="http://localhost:3000"
                        />
                        <small>The URL where the volume bot API is running</small>
                    </div>

                    <div className="form-group">
                        <label htmlFor="rpcEndpoint">Solana RPC Endpoint:</label>
                        <input
                            type="text"
                            id="rpcEndpoint"
                            name="rpcEndpoint"
                            value={apiSettings.rpcEndpoint}
                            onChange={handleApiChange}
                            placeholder="https://api.mainnet-beta.solana.com"
                        />
                        <small>Custom RPC endpoint for Solana (leave empty to use the one from .env)</small>
                    </div>
                </div>

                <div className="settings-section card">
                    <h2>Boost Settings</h2>
                    <div className="form-grid">
                        <div className="form-group">
                            <label htmlFor="defaultPackage">Default Package:</label>
                            <select
                                id="defaultPackage"
                                name="defaultPackage"
                                value={boostSettings.defaultPackage}
                                onChange={handleBoostChange}
                            >
                                <option value="basic">Basic</option>
                                <option value="premium">Premium</option>
                                <option value="custom">Custom</option>
                            </select>
                            <small>Default boost package for new boosts</small>
                        </div>

                        <div className="form-group">
                            <label htmlFor="buyToSellRatio">Buy/Sell Ratio:</label>
                            <div className="slider-with-value">
                                <input
                                    type="range"
                                    id="buyToSellRatio"
                                    name="buyToSellRatio"
                                    min="1"
                                    max="10"
                                    step="1"
                                    value={boostSettings.buyToSellRatio}
                                    onChange={handleBoostChange}
                                />
                                <span className="range-value">{boostSettings.buyToSellRatio}:1</span>
                            </div>
                            <small>Ratio of buy orders to sell orders</small>
                        </div>

                        <div className="form-group">
                            <label htmlFor="minTradeSize">Minimum Trade Size:</label>
                            <input
                                type="number"
                                id="minTradeSize"
                                name="minTradeSize"
                                min="0.0001"
                                step="0.0001"
                                value={boostSettings.minTradeSize}
                                onChange={handleBoostChange}
                            />
                            <small>Minimum size for each trade</small>
                        </div>

                        <div className="form-group">
                            <label htmlFor="maxTradeSize">Maximum Trade Size:</label>
                            <input
                                type="number"
                                id="maxTradeSize"
                                name="maxTradeSize"
                                min="0.0001"
                                step="0.0001"
                                value={boostSettings.maxTradeSize}
                                onChange={handleBoostChange}
                            />
                            <small>Maximum size for each trade</small>
                        </div>

                        <div className="form-group">
                            <label htmlFor="tradesPerMinute">Trades Per Minute:</label>
                            <input
                                type="number"
                                id="tradesPerMinute"
                                name="tradesPerMinute"
                                min="0.1"
                                max="10"
                                step="0.1"
                                value={boostSettings.tradesPerMinute}
                                onChange={handleBoostChange}
                            />
                            <small>Average number of trades per minute</small>
                        </div>
                    </div>
                </div>

                <div className="settings-section card">
                    <h2>Jupiter Settings</h2>
                    <div className="form-group">
                        <label htmlFor="defaultSlippage">Default Slippage (%):</label>
                        <input
                            type="number"
                            id="defaultSlippage"
                            name="defaultSlippage"
                            min="0.1"
                            max="5"
                            step="0.1"
                            value={jupiterSettings.defaultSlippage}
                            onChange={handleJupiterChange}
                        />
                        <small>Default slippage tolerance for Jupiter swaps</small>
                    </div>

                    <div className="form-group checkbox-group">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                name="useJupiterRouting"
                                checked={jupiterSettings.useJupiterRouting}
                                onChange={handleJupiterChange}
                            />
                            Use Jupiter Smart Routing
                        </label>
                        <small>Let Jupiter find the best route for swaps</small>
                    </div>

                    <div className="form-group checkbox-group">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                name="prioritizeTopRoutes"
                                checked={jupiterSettings.prioritizeTopRoutes}
                                onChange={handleJupiterChange}
                            />
                            Prioritize Top Routes
                        </label>
                        <small>Prioritize routes with highest liquidity</small>
                    </div>
                </div>

                <div className="settings-section card">
                    <h2>Notification Settings</h2>
                    <div className="form-group checkbox-group">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                name="enableNotifications"
                                checked={notificationSettings.enableNotifications}
                                onChange={handleNotificationChange}
                            />
                            Enable Notifications
                        </label>
                        <small>Send notifications for important events</small>
                    </div>

                    <div className="notification-options" style={{ opacity: notificationSettings.enableNotifications ? 1 : 0.5 }}>
                        <div className="form-group checkbox-group">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    name="notifyOnBoostStart"
                                    checked={notificationSettings.notifyOnBoostStart}
                                    onChange={handleNotificationChange}
                                    disabled={!notificationSettings.enableNotifications}
                                />
                                Notify on Boost Start
                            </label>
                        </div>

                        <div className="form-group checkbox-group">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    name="notifyOnBoostEnd"
                                    checked={notificationSettings.notifyOnBoostEnd}
                                    onChange={handleNotificationChange}
                                    disabled={!notificationSettings.enableNotifications}
                                />
                                Notify on Boost End
                            </label>
                        </div>

                        <div className="form-group checkbox-group">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    name="notifyOnError"
                                    checked={notificationSettings.notifyOnError}
                                    onChange={handleNotificationChange}
                                    disabled={!notificationSettings.enableNotifications}
                                />
                                Notify on Errors
                            </label>
                        </div>

                        <div className="form-group">
                            <label htmlFor="webhookUrl">Webhook URL:</label>
                            <input
                                type="text"
                                id="webhookUrl"
                                name="webhookUrl"
                                value={notificationSettings.webhookUrl}
                                onChange={handleNotificationChange}
                                placeholder="https://discord.com/api/webhooks/..."
                                disabled={!notificationSettings.enableNotifications}
                            />
                            <small>Discord or Slack webhook URL for notifications</small>
                        </div>
                    </div>
                </div>

                <div className="settings-section card">
                    <h2>UI Settings</h2>
                    <div className="form-group">
                        <label htmlFor="refreshInterval">Dashboard Refresh Interval (seconds):</label>
                        <input
                            type="number"
                            id="refreshInterval"
                            name="refreshInterval"
                            min="5"
                            max="120"
                            step="5"
                            value={uiSettings.refreshInterval}
                            onChange={handleUiChange}
                        />
                        <small>How often dashboard data refreshes</small>
                    </div>

                    <div className="form-group checkbox-group">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                name="darkMode"
                                checked={uiSettings.darkMode}
                                onChange={handleUiChange}
                            />
                            Dark Mode
                        </label>
                        <small>Use dark theme for dashboard</small>
                    </div>

                    <div className="form-group checkbox-group">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                name="compactMode"
                                checked={uiSettings.compactMode}
                                onChange={handleUiChange}
                            />
                            Compact Mode
                        </label>
                        <small>Use more compact display for lists and tables</small>
                    </div>
                </div>

                <div className="form-actions">
                    <button
                        type="submit"
                        className="button button-primary"
                        disabled={saving}
                    >
                        {saving ? 'Saving...' : 'Save Settings'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default Settings;