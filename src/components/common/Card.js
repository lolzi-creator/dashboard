import React from 'react';
import PropTypes from 'prop-types';
import './Card.css';

const Card = ({
                  title,
                  value,
                  icon,
                  trend,
                  trendValue,
                  className = '',
                  loading = false,
                  onClick
              }) => {
    // Determine trend class
    const trendClass = trend === 'up' ? 'trend-up' : trend === 'down' ? 'trend-down' : '';

    return (
        <div
            className={`modern-card ${className} ${onClick ? 'clickable' : ''}`}
            onClick={onClick}
        >
            {loading ? (
                <div className="card-skeleton">
                    <div className="skeleton-title"></div>
                    <div className="skeleton-value"></div>
                    <div className="skeleton-footer"></div>
                </div>
            ) : (
                <>
                    <div className="card-header">
                        <h3 className="card-title">{title}</h3>
                        {icon && <span className={`card-icon icon-${icon}`}></span>}
                    </div>

                    <div className="card-body">
                        <div className="card-value">{value}</div>

                        {trend && trendValue && (
                            <div className={`card-trend ${trendClass}`}>
                <span className="trend-arrow">
                  {trend === 'up' ? '↑' : trend === 'down' ? '↓' : ''}
                </span>
                                <span className="trend-value">{trendValue}</span>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

Card.propTypes = {
    title: PropTypes.string.isRequired,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    icon: PropTypes.string,
    trend: PropTypes.oneOf(['up', 'down', 'neutral']),
    trendValue: PropTypes.string,
    className: PropTypes.string,
    loading: PropTypes.bool,
    onClick: PropTypes.func
};

export default Card;