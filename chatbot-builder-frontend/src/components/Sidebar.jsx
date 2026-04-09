import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Sidebar.css';

function Sidebar({ isOpen, toggleSidebar }) {
  const location = useLocation();

  // Check if a link is active
  const isActive = (path) => {
    return location.pathname === path;
  };

  // Menu items
  const menuItems = [
    {
      title: 'Dashboard',
      path: '/dashboard',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
        </svg>
      )
    },
    {
      title: 'My Chatbots',
      path: '/my-chatbots',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      ),
      badge: '5'
    },
    {
      title: 'Create Chatbot',
      path: '/create-chatbot',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="16" />
          <line x1="8" y1="12" x2="16" y2="12" />
        </svg>
      )
    },
    {
      title: 'Conversations',
      path: '/conversations',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        </svg>
      ),
      badge: '12'
    },
   
  ];

  const settingsItems = [
    {
      title: 'Settings',
      path: '/settings',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 1v6m0 6v6" />
          <path d="M12 1v6m0 6v6" />
        </svg>
      )
    },
    {
      title: 'Billing',
      path: '/billing',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
          <line x1="1" y1="10" x2="23" y2="10" />
        </svg>
      )
    },
    {
      title: 'Help & Support',
      path: '/support',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      )
    }
  ];

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="sidebar-overlay" 
          onClick={toggleSidebar}
        ></div>
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        {/* Sidebar Header */}
        <div className="sidebar-header">
          <Link to="/" className="sidebar-logo">
            <span className="logo-icon">🤖</span>
            <span className="logo-text">ChatBot Builder</span>
          </Link>
          <button 
            className="sidebar-close"
            onClick={toggleSidebar}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Sidebar Content */}
        <div className="sidebar-content">
          {/* Main Menu */}
          <nav className="sidebar-nav">
            <ul className="sidebar-menu">
              {menuItems.map((item, index) => (
                <li key={index}>
                  <Link 
                    to={item.path}
                    className={`sidebar-link ${isActive(item.path) ? 'active' : ''}`}
                    onClick={() => {
                      if (window.innerWidth < 768) {
                        toggleSidebar();
                      }
                    }}
                  >
                    <span className="sidebar-link-icon">{item.icon}</span>
                    <span className="sidebar-link-text">{item.title}</span>
                    {item.badge && (
                      <span className="sidebar-badge">{item.badge}</span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Divider */}
          <div className="sidebar-divider"></div>

          {/* Settings Menu */}
          <nav className="sidebar-nav">
            <p className="sidebar-section-title">SETTINGS</p>
            <ul className="sidebar-menu">
              {settingsItems.map((item, index) => (
                <li key={index}>
                  <Link 
                    to={item.path}
                    className={`sidebar-link ${isActive(item.path) ? 'active' : ''}`}
                    onClick={() => {
                      if (window.innerWidth < 768) {
                        toggleSidebar();
                      }
                    }}
                  >
                    <span className="sidebar-link-icon">{item.icon}</span>
                    <span className="sidebar-link-text">{item.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="sidebar-footer">
          <div className="upgrade-card">
            <div className="upgrade-icon">⭐</div>
            <h4 className="upgrade-title">Upgrade to Pro</h4>
            <p className="upgrade-text">Get unlimited chatbots and premium features</p>
            <Link to="/billing" className="upgrade-button">
              Upgrade Now
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;