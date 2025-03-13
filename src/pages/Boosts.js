import React, { useState } from 'react';
import BoostList from '../components/Boosts/BoostList';
import QueuedBoosts from '../components/Boosts/QueuedBoosts';
import AddBoostForm from '../components/Boosts/AddBoostForm';

const Boosts = () => {
    const [activeTab, setActiveTab] = useState('active');

    return (
        <div className="boosts-page">
            <div className="page-header">
                <h1>Boosts</h1>
            </div>

            <div className="tab-navigation">
                <button
                    className={activeTab === 'active' ? 'active' : ''}
                    onClick={() => setActiveTab('active')}
                >
                    Active Boosts
                </button>
                <button
                    className={activeTab === 'queued' ? 'active' : ''}
                    onClick={() => setActiveTab('queued')}
                >
                    Queued Boosts
                </button>
                <button
                    className={activeTab === 'add' ? 'active' : ''}
                    onClick={() => setActiveTab('add')}
                >
                    Add New Boost
                </button>
            </div>

            <div className="tab-content">
                {activeTab === 'active' && <BoostList />}
                {activeTab === 'queued' && <QueuedBoosts />}
                {activeTab === 'add' && <AddBoostForm />}
            </div>
        </div>
    );
};

export default Boosts;