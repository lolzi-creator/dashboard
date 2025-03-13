import React from 'react';

const Header = () => {
    return (
        <header className="header">
            <div className="header-left">
                <h1>Solana Volume Bot Dashboard</h1>
            </div>
            <div className="header-right">
        <span className="connection-status connected">
          Connected to API
        </span>
            </div>
        </header>
    );
};

export default Header;