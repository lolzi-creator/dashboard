// Update App.js to include watchlist routes
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

import './styles.css';
// You might want to add watchlist-specific styles if needed

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
                </Routes>
            </Layout>
        </Router>
    );
}

export default App;