// Update src/components/Layout/Layout.js to include Watchlist link
import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';

const Layout = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    return (
        <div className="app-container">
            <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
                <div className="logo">
                    <h2>Volume Bot</h2>
                </div>
                <nav className="nav-menu">
                    <ul>
                        <li>
                            <NavLink to="/" end className={({ isActive }) => isActive ? 'active' : ''}>
                                <span className="nav-icon">📊</span>
                                Dashboard
                            </NavLink>
                        </li>
                        <li>
                            <NavLink to="/boosts" className={({ isActive }) => isActive ? 'active' : ''}>
                                <span className="nav-icon">🚀</span>
                                Boosts
                            </NavLink>
                        </li>
                        <li>
                            <NavLink to="/ranking" className={({ isActive }) => isActive ? 'active' : ''}>
                                <span className="nav-icon">📈</span>
                                DEX Ranking
                            </NavLink>
                        </li>
                        <li>
                            <NavLink to="/transactions" className={({ isActive }) => isActive ? 'active' : ''}>
                                <span className="nav-icon">🔄</span>
                                Transactions
                            </NavLink>
                        </li>
                        <li>
                            <NavLink to="/wallets" className={({ isActive }) => isActive ? 'active' : ''}>
                                <span className="nav-icon">💰</span>
                                Wallets
                            </NavLink>
                        </li>
                        <li>
                            <NavLink to="/settings" className={({ isActive }) => isActive ? 'active' : ''}>
                                <span className="nav-icon">⚙️</span>
                                Settings
                            </NavLink>
                        </li>
                    </ul>
                </nav>
            </aside>

            <div className="main-content">
                <header className="header">
                    <div className="header-left">
                        <button className="menu-button" onClick={toggleSidebar}>
                            <span className="menu-icon">≡</span>
                        </button>
                        <h1>Solana Volume Bot Dashboard</h1>
                    </div>
                    <div className="header-right">
                        <span className="connection-status connected">
                            Connected to API
                        </span>
                    </div>
                </header>

                <main className="content-area">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default Layout;