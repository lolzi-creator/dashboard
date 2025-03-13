import React from 'react';

const StatusBadge = ({ status }) => {
    let badgeClass = '';
    let label = status;

    switch (status) {
        case 'active':
            badgeClass = 'status-active';
            break;
        case 'inactive':
            badgeClass = 'status-inactive';
            break;
        case 'success':
            badgeClass = 'status-success';
            break;
        case 'failed':
            badgeClass = 'status-failed';
            break;
        default:
            badgeClass = 'status-default';
    }

    return (
        <span className={`status-badge ${badgeClass}`}>
      {label}
    </span>
    );
};

export default StatusBadge;