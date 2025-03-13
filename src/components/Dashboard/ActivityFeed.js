import React from 'react';
import { Link } from 'react-router-dom';

const ActivityFeed = ({ completedBoosts }) => {
    if (!completedBoosts || completedBoosts.length === 0) {
        return <p>No recent activity to display.</p>;
    }

    return (
        <div className="activity-feed">
            {completedBoosts.map(boost => {
                const completionPercentage = boost.targetVolume > 0
                    ? ((boost.achievedVolume / boost.targetVolume) * 100).toFixed(1)
                    : 0;

                return (
                    <div key={boost.boostId} className="activity-item">
                        <div className="activity-time">
                            {new Date(boost.endTime).toLocaleString()}
                        </div>
                        <div className="activity-content">
                            <div className="activity-title">
                                Boost completed: {boost.token.substring(0, 8)}...
                            </div>
                            <div className="activity-details">
                                Volume: ${boost.achievedVolume?.toFixed(2) || 0} / ${boost.targetVolume}
                                ({completionPercentage}%)
                            </div>
                            <div className="activity-meta">
                                {boost.tradeCount} trades • {boost.successRate || '0'}% success rate
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default ActivityFeed;