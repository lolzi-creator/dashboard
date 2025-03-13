import React from 'react';
import { NavLink } from 'react-router-dom';

const Sidebar = () => {
    return (
        <aside className="sidebar">
            <div className="logo">
                <h2>Volume Bot</h2>
            </div>
            <nav className="nav-menu">
                <ul>
                    <li>
                        <NavLink to="/" end className={({ isActive }) => isActive ? 'active' : ''}>
                            Dashboard
                        </NavLink>
                    </li>
                    <li>
                        <NavLink to="/boosts" className={({ isActive }) => isActive ? 'active' : ''}>
                            Boosts
                        </NavLink>
                    </li>
                    <li>
                        <NavLink to="/ranking" className={({ isActive }) => isActive ? 'active' : ''}>
                            DEX Ranking
                        </NavLink>
                    </li>
                    <li>
                        <NavLink to="/transactions" className={({ isActive }) => isActive ? 'active' : ''}>
                            Transactions
                        </NavLink>
                    </li>
                    <li>
                        <NavLink to="/wallets" className={({ isActive }) => isActive ? 'active' : ''}>
                            Wallets
                        </NavLink>
                    </li>
                    <li>
                        <NavLink to="/settings" className={({ isActive }) => isActive ? 'active' : ''}>
                            Settings
                        </NavLink>
                    </li>
                </ul>
            </nav>
        </aside>
    );
};

export default Sidebar;