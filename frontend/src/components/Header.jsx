import React from 'react';
import { NavLink } from 'react-router-dom';

const Header = () => {
  return (
    <header className="header">
      <div className="header-container">
        <div className="header-logo">
          <span>🏭</span> HPCL <span>Procurement</span>
        </div>
        
        <nav>
          <ul className="header-nav">
            <li>
              <NavLink to="/" className={({ isActive }) => isActive ? 'active' : ''}>
                Dashboard
              </NavLink>
            </li>
            <li>
              <NavLink to="/purchase-requests" className={({ isActive }) => isActive ? 'active' : ''}>
                Purchase Requests
              </NavLink>
            </li>
            <li>
              <NavLink to="/approvals" className={({ isActive }) => isActive ? 'active' : ''}>
                Approvals
              </NavLink>
            </li>
            <li>
              <NavLink to="/rules" className={({ isActive }) => isActive ? 'active' : ''}>
                Rules
              </NavLink>
            </li>
            <li>
              <NavLink to="/reports" className={({ isActive }) => isActive ? 'active' : ''}>
                Reports
              </NavLink>
            </li>
            <li>
              <NavLink to="/exceptions" className={({ isActive }) => isActive ? 'active' : ''}>
                Exceptions
              </NavLink>
            </li>
          </ul>
        </nav>
        
        <div className="header-user">
          <div className="notification-icon">
            🔔
            <span className="notification-badge">3</span>
          </div>
          <div>👤 Admin</div>
        </div>
      </div>
    </header>
  );
};

export default Header;
