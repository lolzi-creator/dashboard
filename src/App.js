// src/App.js - Updated with Trending Bot routes
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';
import Boosts from './pages/Boosts';
import BoostDetails from './components/Boosts/BoostDetails';
import Transactions from './pages/Transactions';
import Wallets from './pages/Wallets';
import Settings from './pages/Settings';
import FundingStatus from './components/Wallets/FundingStatus';
import Ranking from './pages/Ranking';
import RankingJobDetails from './components/Ranking/RankingJobDetails';

// Import our new Trending Bot components
import TrendingBot from './pages/TrendingBot';
import TrendingJobDetails from './components/Trending/TrendingJobDetails';

import './styles.css';
import './trending-styles.css';

function App() {
    return (
        <Router>
            <Layout>
                <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/boosts" element={<Boosts />} />
                    <Route path="/boosts/:boostId" element={<BoostDetails />} />
                    <Route path="/transactions" element={<Transactions />} />
                    <Route path="/wallets" element={<Wallets />} />
                    <Route path="/wallets/funding/:fundingId" element={<FundingStatus />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/ranking" element={<Ranking />} />
                    <Route path="/ranking/:jobId" element={<RankingJobDetails />} />

                    {/* New Trending Bot routes */}
                    <Route path="/trending" element={<TrendingBot />} />
                    <Route path="/trending/job/:jobId" element={<TrendingJobDetails />} />
                </Routes>
            </Layout>
        </Router>
    );
}

export default App;