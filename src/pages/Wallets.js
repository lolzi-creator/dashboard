// Fix for Wallets.js page - make sure batchId is being passed correctly
import React, { useState } from 'react';
import WalletList from '../components/Wallets/WalletList';
import WalletDetails from '../components/Wallets/WalletDetails';
import WalletGenerator from '../components/Wallets/WalletGenerator';
import WalletFunder from '../components/Wallets/WalletFunder';
import FundingList from '../components/Wallets/FundingList';

const Wallets = () => {
    const [activeTab, setActiveTab] = useState('batches');
    const [selectedWallet, setSelectedWallet] = useState(null);
    const [selectedBatch, setSelectedBatch] = useState(null);

    // Handle wallet selection
    const handleWalletSelect = (walletId, batchId) => {
        console.log(`Selected wallet ${walletId} from batch ${batchId}`);
        setSelectedWallet(walletId);
        setSelectedBatch(batchId);
        setActiveTab('details');
    };

    // Handle tab changes
    const changeTab = (tab) => {
        setActiveTab(tab);
        if (tab !== 'details') {
            setSelectedWallet(null);
            setSelectedBatch(null);
        }
    };

    return (
        <div className="wallets-page">
            <div className="page-header">
                <h1>Wallet Management</h1>
            </div>

            <div className="tab-navigation">
                <button
                    className={activeTab === 'batches' ? 'active' : ''}
                    onClick={() => changeTab('batches')}
                >
                    Wallet Batches
                </button>
                {selectedWallet && selectedBatch && (
                    <button
                        className={activeTab === 'details' ? 'active' : ''}
                        onClick={() => changeTab('details')}
                    >
                        Wallet Details
                    </button>
                )}
                <button
                    className={activeTab === 'generate' ? 'active' : ''}
                    onClick={() => changeTab('generate')}
                >
                    Generate Wallets
                </button>
                <button
                    className={activeTab === 'fund' ? 'active' : ''}
                    onClick={() => changeTab('fund')}
                >
                    Fund Wallets
                </button>
                <button
                    className={activeTab === 'funding-history' ? 'active' : ''}
                    onClick={() => changeTab('funding-history')}
                >
                    Funding History
                </button>
            </div>

            <div className="tab-content">
                {activeTab === 'batches' && (
                    <WalletList onWalletSelect={handleWalletSelect} />
                )}

                {activeTab === 'details' && selectedWallet && selectedBatch && (
                    <WalletDetails walletId={selectedWallet} batchId={selectedBatch} />
                )}

                {activeTab === 'generate' && (
                    <WalletGenerator />
                )}

                {activeTab === 'fund' && (
                    <WalletFunder />
                )}

                {activeTab === 'funding-history' && (
                    <FundingList />
                )}
            </div>
        </div>
    );
};

export default Wallets;