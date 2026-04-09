import React, { useState } from 'react';
import './NotificationCenter.css';

const NotificationCenter = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'bot_alert',
      title: 'Bot Performance Alert',
      message: 'Your "E-commerce Assistant" bot has handled 10,000 conversations today!',
      timestamp: '2024-02-19T09:30:00',
      read: false,
      priority: 'high',
      category: 'bot',
      action: {
        label: 'View Analytics',
        link: '/analytics'
      },
      icon: '🤖',
      color: '#40e0d0'
    },
    {
      id: 2,
      type: 'training_complete',
      title: 'Training Completed',
      message: 'Training for "Support Bot" has been successfully completed with 98.5% accuracy.',
      timestamp: '2024-02-19T08:15:00',
      read: false,
      priority: 'medium',
      category: 'training',
      action: {
        label: 'Review Results',
        link: '/training'
      },
      icon: '🧠',
      color: '#6464ff'
    },
    {
      id: 3,
      type: 'integration_success',
      title: 'Integration Connected',
      message: 'Your Slack workspace "Acme Corp" has been successfully connected to "Sales Bot".',
      timestamp: '2024-02-19T07:45:00',
      read: true,
      priority: 'low',
      category: 'integration',
      action: {
        label: 'Configure',
        link: '/integrations'
      },
      icon: '🔌',
      color: '#9333ea'
    },
    {
      id: 4,
      type: 'team_update',
      title: 'New Team Member',
      message: 'Sarah Chen has joined your team as an Editor.',
      timestamp: '2024-02-18T16:20:00',
      read: true,
      priority: 'medium',
      category: 'team',
      action: {
        label: 'View Team',
        link: '/team'
      },
      icon: '👥',
      color: '#ff6b6b'
    },
    {
      id: 5,
      type: 'billing_alert',
      title: 'Upcoming Renewal',
      message: 'Your Pro plan subscription will renew on March 15, 2024.',
      timestamp: '2024-02-18T14:00:00',
      read: true,
      priority: 'medium',
      category: 'billing',
      action: {
        label: 'Manage Billing',
        link: '/billing'
      },
      icon: '💰',
      color: '#ffa444'
    },
    {
      id: 6,
      type: 'system_update',
      title: 'System Maintenance',
      message: 'Scheduled maintenance on February 20, 2024 from 2:00 AM to 4:00 AM EST.',
      timestamp: '2024-02-18T10:30:00',
      read: false,
      priority: 'low',
      category: 'system',
      action: {
        label: 'Learn More',
        link: '/status'
      },
      icon: '🔧',
      color: '#40e0d0'
    },
    {
      id: 7,
      type: 'bot_error',
      title: 'Bot Error Detected',
      message: '"Real Estate Bot" encountered an error while processing user queries. Please check the logs.',
      timestamp: '2024-02-18T09:15:00',
      read: true,
      priority: 'high',
      category: 'bot',
      action: {
        label: 'View Logs',
        link: '/logs'
      },
      icon: '⚠️',
      color: '#ff6b6b'
    },
    {
      id: 8,
      type: 'feature_update',
      title: 'New Feature Available',
      message: 'Try our new AI training optimization feature for better bot performance!',
      timestamp: '2024-02-17T15:45:00',
      read: true,
      priority: 'low',
      category: 'product',
      action: {
        label: 'Learn More',
        link: '/features'
      },
      icon: '✨',
      color: '#6464ff'
    },
    {
      id: 9,
      type: 'weekly_report',
      title: 'Weekly Analytics Report',
      message: 'Your bots handled 15,234 conversations this week with 94% satisfaction rate.',
      timestamp: '2024-02-17T08:00:00',
      read: false,
      priority: 'medium',
      category: 'analytics',
      action: {
        label: 'View Report',
        link: '/analytics'
      },
      icon: '📊',
      color: '#40e0d0'
    }
  ]);

  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    desktopNotifications: false,
    soundEnabled: true,
    digestEmail: 'daily',
    
    // Categories
    botAlerts: true,
    trainingUpdates: true,
    integrationUpdates: true,
    teamUpdates: true,
    billingAlerts: true,
    systemUpdates: true,
    productUpdates: true,
    
    // Priority levels
    highPriority: 'all',
    mediumPriority: 'all',
    lowPriority: 'push',
    
    // Quiet hours
    quietHoursEnabled: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00'
  });

  const [showSettingsSaved, setShowSettingsSaved] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAsRead = (id) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const handleMarkAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const handleDelete = (id) => {
    setNotifications(notifications.filter(n => n.id !== id));
    setShowDeleteModal(false);
  };

  const handleDeleteAll = () => {
    setNotifications([]);
  };

  const handleSaveSettings = () => {
    setShowSettingsSaved(true);
    setTimeout(() => setShowSettingsSaved(false), 3000);
  };

  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now - then;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return then.toLocaleDateString();
  };

  const getPriorityBadge = (priority) => {
    switch(priority) {
      case 'high':
        return <span className="priority-badge high">High</span>;
      case 'medium':
        return <span className="priority-badge medium">Medium</span>;
      case 'low':
        return <span className="priority-badge low">Low</span>;
      default:
        return null;
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'all') return true;
    if (activeTab === 'unread') return !n.read;
    return n.category === activeTab;
  });

  const tabs = [
    { id: 'all', label: 'All', icon: '🔔', count: notifications.length },
    { id: 'unread', label: 'Unread', icon: '📫', count: unreadCount },
    { id: 'bot', label: 'Bots', icon: '🤖' },
    { id: 'training', label: 'Training', icon: '🧠' },
    { id: 'integration', label: 'Integrations', icon: '🔌' },
    { id: 'team', label: 'Team', icon: '👥' },
    { id: 'billing', label: 'Billing', icon: '💰' },
    { id: 'system', label: 'System', icon: '🔧' }
  ];

  return (
    <div className="notification-center">
      {/* Header */}
      <div className="notifications-header">
        <div>
          <h1>Notifications</h1>
          <p>Stay updated with your bot activity and platform updates</p>
        </div>
        <div className="header-actions">
          <button 
            className="settings-btn"
            onClick={() => setShowSettings(!showSettings)}
          >
            <span className="btn-icon">⚙️</span>
            Settings
          </button>
          <button 
            className="mark-read-btn"
            onClick={handleMarkAllAsRead}
            disabled={unreadCount === 0}
          >
            <span className="btn-icon">✓</span>
            Mark all as read
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="settings-panel">
          <div className="settings-header">
            <h3>Notification Settings</h3>
            <button className="close-settings" onClick={() => setShowSettings(false)}>✕</button>
          </div>

          {showSettingsSaved && (
            <div className="settings-saved-message">
              ✓ Settings saved successfully
            </div>
          )}

          <div className="settings-section">
            <h4>Delivery Methods</h4>
            <div className="settings-grid">
              <div className="setting-item">
                <div className="setting-info">
                  <span className="setting-label">Email Notifications</span>
                  <span className="setting-description">Receive notifications via email</span>
                </div>
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={notificationSettings.emailNotifications}
                    onChange={(e) => setNotificationSettings({
                      ...notificationSettings,
                      emailNotifications: e.target.checked
                    })}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <span className="setting-label">Push Notifications</span>
                  <span className="setting-description">Browser push notifications</span>
                </div>
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={notificationSettings.pushNotifications}
                    onChange={(e) => setNotificationSettings({
                      ...notificationSettings,
                      pushNotifications: e.target.checked
                    })}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <span className="setting-label">Desktop Notifications</span>
                  <span className="setting-description">System notifications</span>
                </div>
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={notificationSettings.desktopNotifications}
                    onChange={(e) => setNotificationSettings({
                      ...notificationSettings,
                      desktopNotifications: e.target.checked
                    })}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <span className="setting-label">Sound</span>
                  <span className="setting-description">Play sound for new notifications</span>
                </div>
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={notificationSettings.soundEnabled}
                    onChange={(e) => setNotificationSettings({
                      ...notificationSettings,
                      soundEnabled: e.target.checked
                    })}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
          </div>

          <div className="settings-section">
            <h4>Notification Categories</h4>
            <div className="settings-grid">
              <div className="setting-item">
                <div className="setting-info">
                  <span className="setting-label">Bot Alerts</span>
                  <span className="setting-description">Performance, errors, updates</span>
                </div>
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={notificationSettings.botAlerts}
                    onChange={(e) => setNotificationSettings({
                      ...notificationSettings,
                      botAlerts: e.target.checked
                    })}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <span className="setting-label">Training Updates</span>
                  <span className="setting-description">Training completion, progress</span>
                </div>
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={notificationSettings.trainingUpdates}
                    onChange={(e) => setNotificationSettings({
                      ...notificationSettings,
                      trainingUpdates: e.target.checked
                    })}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <span className="setting-label">Integrations</span>
                  <span className="setting-description">Connection status, errors</span>
                </div>
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={notificationSettings.integrationUpdates}
                    onChange={(e) => setNotificationSettings({
                      ...notificationSettings,
                      integrationUpdates: e.target.checked
                    })}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <span className="setting-label">Team Updates</span>
                  <span className="setting-description">Member activity, invitations</span>
                </div>
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={notificationSettings.teamUpdates}
                    onChange={(e) => setNotificationSettings({
                      ...notificationSettings,
                      teamUpdates: e.target.checked
                    })}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <span className="setting-label">Billing Alerts</span>
                  <span className="setting-description">Payments, invoices, renewals</span>
                </div>
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={notificationSettings.billingAlerts}
                    onChange={(e) => setNotificationSettings({
                      ...notificationSettings,
                      billingAlerts: e.target.checked
                    })}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <span className="setting-label">System Updates</span>
                  <span className="setting-description">Maintenance, status changes</span>
                </div>
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={notificationSettings.systemUpdates}
                    onChange={(e) => setNotificationSettings({
                      ...notificationSettings,
                      systemUpdates: e.target.checked
                    })}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <span className="setting-label">Product Updates</span>
                  <span className="setting-description">New features, improvements</span>
                </div>
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={notificationSettings.productUpdates}
                    onChange={(e) => setNotificationSettings({
                      ...notificationSettings,
                      productUpdates: e.target.checked
                    })}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
          </div>

          <div className="settings-section">
            <h4>Quiet Hours</h4>
            <div className="quiet-hours">
              <div className="setting-item">
                <div className="setting-info">
                  <span className="setting-label">Enable Quiet Hours</span>
                  <span className="setting-description">Mute notifications during selected hours</span>
                </div>
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={notificationSettings.quietHoursEnabled}
                    onChange={(e) => setNotificationSettings({
                      ...notificationSettings,
                      quietHoursEnabled: e.target.checked
                    })}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              {notificationSettings.quietHoursEnabled && (
                <div className="quiet-hours-times">
                  <div className="time-select">
                    <label>From</label>
                    <input 
                      type="time" 
                      value={notificationSettings.quietHoursStart}
                      onChange={(e) => setNotificationSettings({
                        ...notificationSettings,
                        quietHoursStart: e.target.value
                      })}
                      className="time-input"
                    />
                  </div>
                  <div className="time-select">
                    <label>To</label>
                    <input 
                      type="time" 
                      value={notificationSettings.quietHoursEnd}
                      onChange={(e) => setNotificationSettings({
                        ...notificationSettings,
                        quietHoursEnd: e.target.value
                      })}
                      className="time-input"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="settings-actions">
            <button 
              className="save-settings-btn"
              onClick={handleSaveSettings}
            >
              Save Settings
            </button>
            <button 
              className="reset-settings-btn"
              onClick={() => setShowSettings(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="notifications-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
            {tab.count !== undefined && tab.count > 0 && (
              <span className="tab-count">{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="notifications-list">
        {filteredNotifications.length === 0 ? (
          <div className="no-notifications">
            <div className="no-notifications-icon">🔔</div>
            <h3>No notifications</h3>
            <p>You're all caught up! Check back later for updates.</p>
          </div>
        ) : (
          filteredNotifications.map(notification => (
            <div
              key={notification.id}
              className={`notification-item ${notification.read ? 'read' : 'unread'}`}
              onClick={() => setSelectedNotification(notification)}
            >
              <div 
                className="notification-icon"
                style={{ backgroundColor: notification.color + '20' }}
              >
                <span style={{ color: notification.color }}>{notification.icon}</span>
              </div>

              <div className="notification-content">
                <div className="notification-header">
                  <h4>{notification.title}</h4>
                  <div className="notification-meta">
                    {getPriorityBadge(notification.priority)}
                    <span className="notification-time">
                      {getTimeAgo(notification.timestamp)}
                    </span>
                  </div>
                </div>

                <p className="notification-message">{notification.message}</p>

                <div className="notification-footer">
                  {notification.action && (
                    <a href={notification.action.link} className="notification-action">
                      {notification.action.label} →
                    </a>
                  )}
                  <div className="notification-actions">
                    {!notification.read && (
                      <button 
                        className="mark-read"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsRead(notification.id);
                        }}
                      >
                        Mark as read
                      </button>
                    )}
                    <button 
                      className="delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedNotification(notification);
                        setShowDeleteModal(true);
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Bulk Actions */}
      {notifications.length > 0 && (
        <div className="bulk-actions">
          <button 
            className="bulk-btn"
            onClick={handleMarkAllAsRead}
            disabled={unreadCount === 0}
          >
            <span className="btn-icon">✓</span>
            Mark all as read
          </button>
          <button 
            className="bulk-btn delete"
            onClick={handleDeleteAll}
          >
            <span className="btn-icon">🗑️</span>
            Delete all
          </button>
        </div>
      )}

      {/* Notification Detail Modal */}
      {selectedNotification && (
        <div className="notification-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Notification Details</h2>
              <button 
                className="close-modal"
                onClick={() => setSelectedNotification(null)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="detail-header">
                <div 
                  className="detail-icon"
                  style={{ backgroundColor: selectedNotification.color + '20' }}
                >
                  <span style={{ color: selectedNotification.color }}>
                    {selectedNotification.icon}
                  </span>
                </div>
                <div className="detail-title">
                  <h3>{selectedNotification.title}</h3>
                  <div className="detail-meta">
                    {getPriorityBadge(selectedNotification.priority)}
                    <span className="detail-time">
                      {new Date(selectedNotification.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <p className="detail-message">{selectedNotification.message}</p>

              {selectedNotification.action && (
                <a 
                  href={selectedNotification.action.link} 
                  className="detail-action"
                  onClick={() => setSelectedNotification(null)}
                >
                  {selectedNotification.action.label} →
                </a>
              )}

              <div className="detail-footer">
                <button 
                  className="mark-read-btn"
                  onClick={() => {
                    handleMarkAsRead(selectedNotification.id);
                    setSelectedNotification(null);
                  }}
                >
                  Mark as read
                </button>
                <button 
                  className="delete-btn"
                  onClick={() => {
                    setShowDeleteModal(true);
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedNotification && (
        <div className="delete-modal">
          <div className="modal-content small">
            <div className="modal-header">
              <h2>Delete Notification</h2>
              <button 
                className="close-modal"
                onClick={() => setShowDeleteModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <p>Are you sure you want to delete this notification?</p>
              <p className="warning">This action cannot be undone.</p>
            </div>

            <div className="modal-footer">
              <button 
                className="cancel-btn"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button 
                className="delete-confirm-btn"
                onClick={() => handleDelete(selectedNotification.id)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;