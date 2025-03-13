// src/components/Wallets/WalletGenerator.js - Updated to use the API service
import React, { useState } from 'react';
import { generateWallets } from '../../api/walletService';

const WalletGenerator = () => {
    const [formData, setFormData] = useState({
        batchName: '',
        walletCount: 3,
    });

    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(null);
    const [error, setError] = useState(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'walletCount' ? parseInt(value) : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.batchName) {
            setError('Batch name is required');
            return;
        }

        try {
            setLoading(true);
            setError(null);
            setSuccess(null);

            // Call the API service
            const result = await generateWallets(formData.batchName, formData.walletCount);

            if (result.success) {
                setSuccess(result.message || `Successfully generated ${formData.walletCount} wallets in batch "${formData.batchName}"`);

                // Reset form
                setFormData({
                    batchName: '',
                    walletCount: 3
                });
            } else {
                setError(result.message || 'Failed to generate wallets');
            }

            setLoading(false);
        } catch (err) {
            setError(`Error generating wallets: ${err.message}`);
            setLoading(false);
        }
    };

    return (
        <div className="wallet-generator">
            <h2>Generate New Wallets</h2>

            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            <div className="generator-info">
                <p>Generate new Solana wallets for use with the volume bot. Wallets are created in batches for easier management.</p>
            </div>

            <form onSubmit={handleSubmit} className="generate-form">
                <div className="form-group">
                    <label htmlFor="batchName">Batch Name:</label>
                    <input
                        type="text"
                        id="batchName"
                        name="batchName"
                        value={formData.batchName}
                        onChange={handleChange}
                        placeholder="e.g., Trading Wallets March 2025"
                        required
                    />
                    <small>A descriptive name to identify this group of wallets</small>
                </div>

                <div className="form-group">
                    <label htmlFor="walletCount">Number of Wallets:</label>
                    <input
                        type="number"
                        id="walletCount"
                        name="walletCount"
                        value={formData.walletCount}
                        onChange={handleChange}
                        min="1"
                        max="50"
                        required
                    />
                    <small>How many wallets to generate in this batch (1-50)</small>
                </div>

                <div className="form-actions">
                    <button
                        type="submit"
                        className="button"
                        disabled={loading}
                    >
                        {loading ? 'Generating...' : 'Generate Wallets'}
                    </button>
                </div>
            </form>

            <div className="security-notice">
                <h3>Security Notice</h3>
                <p>All wallet private keys are encrypted and stored securely on the server. Never share your private keys or seed phrases with anyone.</p>
            </div>
        </div>
    );
};

export default WalletGenerator;