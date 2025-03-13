import React from 'react';
import Card from '../common/Card';

const DashboardSummary = ({ activeBoosts, completedBoosts }) => {
    // Calculate statistics
    const totalActive = activeBoosts.length;

    const totalVolume = activeBoosts.reduce((sum, boost) =>
        sum + (parseFloat(boost.currentVolume) || 0), 0);

    const totalTrades = activeBoosts.reduce((sum, boost) =>
        sum + (boost.successfulTrades || 0) + (boost.failedTrades || 0), 0);

    const successfulTrades = activeBoosts.reduce((sum, boost) =>
        sum + (boost.successfulTrades || 0), 0);

    const failedTrades = activeBoosts.reduce((sum, boost) =>
        sum + (boost.failedTrades || 0), 0);

    const successRate = totalTrades > 0
        ? (successfulTrades / totalTrades * 100).toFixed(1)
        : "0.0";

    const buyVolume = activeBoosts.reduce((sum, boost) =>
        sum + (parseFloat(boost.buyVolume) || 0), 0);

    const sellVolume = activeBoosts.reduce((sum, boost) =>
        sum + (parseFloat(boost.sellVolume) || 0), 0);

    const completedCount = completedBoosts.length;

    return (
        <div className="dashboard-summary">
            <Card
                title="Active Boosts"
                value={totalActive}
                icon="rocket"
            />
            <Card
                title="Total Volume"
                value={`$${totalVolume.toFixed(2)}`}
                icon="chart-line"
            />
            <Card
                title="Trades"
                value={totalTrades}
                icon="exchange-alt"
            />
            <Card
                title="Success Rate"
                value={`${successRate}%`}
                icon="check-circle"
            />
            <Card
                title="Buy Volume"
                value={`$${buyVolume.toFixed(2)}`}
                icon="arrow-up"
                className="buy-card"
            />
            <Card
                title="Sell Volume"
                value={`$${sellVolume.toFixed(2)}`}
                icon="arrow-down"
                className="sell-card"
            />
        </div>
    );
};

export default DashboardSummary;