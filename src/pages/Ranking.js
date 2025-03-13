// src/pages/Ranking.js
import React, { useState } from 'react';
import RankingJobList from '../components/Ranking/RankingJobList';
import AddRankingForm from '../components/Ranking/AddRankingForm';

const Ranking = () => {
    const [activeTab, setActiveTab] = useState('active');

    return (
        <div className="ranking-page">
            <div className="page-header">
                <h1>DEX Ranking</h1>
            </div>

            <div className="tab-navigation">
                <button
                    className={activeTab === 'active' ? 'active' : ''}
                    onClick={() => setActiveTab('active')}
                >
                    Active Jobs
                </button>
                <button
                    className={activeTab === 'add' ? 'active' : ''}
                    onClick={() => setActiveTab('add')}
                >
                    Add New Job
                </button>
            </div>

            <div className="tab-content">
                {activeTab === 'active' && <RankingJobList />}
                {activeTab === 'add' && <AddRankingForm />}
            </div>
        </div>
    );
};

export default Ranking;