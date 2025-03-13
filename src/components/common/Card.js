import React from 'react';

const Card = ({ title, value, icon, className }) => {
    return (
        <div className={`stat-card ${className || ''}`}>
            <div className="card-content">
                <div className="card-icon">
                    {icon && <span className={`icon icon-${icon}`}></span>}
                </div>
                <div className="card-info">
                    <h3 className="card-title">{title}</h3>
                    <div className="card-value">{value}</div>
                </div>
            </div>
        </div>
    );
};

export default Card;