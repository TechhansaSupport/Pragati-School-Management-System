import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Header = () => {
  const location = useLocation();
  
  const navItems = [
    'Dashboard', 'Students', 'Staff', 'Academics', 'Finance', 'Reports'
  ];

  return (
    <div className="top-header">
      <div className="brand">
        <div className="brand-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path></svg>
        </div>
        Pragati
      </div>
      
      <div className="top-nav">
        {navItems.map(item => {
          const path = item === 'Dashboard' ? '/' : `/${item.toLowerCase()}`;
          const isActive = location.pathname === path || (path !== '/' && location.pathname.startsWith(path));
          
          return (
            <Link 
              key={item} 
              to={path}
              className={`nav-item ${isActive ? 'active' : ''}`}
            >
              {item}
            </Link>
          );
        })}
      </div>

      <div className="header-right">
        <button className="btn-outline">Generate Report</button>
        <div className="user-avatar">
          <img src="https://ui-avatars.com/api/?name=Admin+User&background=f3f4f6&color=111827" alt="Admin" />
        </div>
      </div>
    </div>
  );
};

export default Header;
