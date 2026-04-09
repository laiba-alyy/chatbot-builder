// src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { analyticsAPI, botsAPI, teamAPI } from '../services/api';
import './Dashboard.css';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const COLORS = ['#40e0d0', '#6464ff', '#9333ea', '#ff6b6b', '#ffa444'];

const fallbackConversationData = [
  { name: 'Mon', conversations: 45 },
  { name: 'Tue', conversations: 52 },
  { name: 'Wed', conversations: 48 },
  { name: 'Thu', conversations: 61 },
  { name: 'Fri', conversations: 55 },
  { name: 'Sat', conversations: 38 },
  { name: 'Sun', conversations: 42 },
];

const fallbackIntentData = [
  { name: 'Product Info', value: 35 },
  { name: 'Pricing',      value: 25 },
  { name: 'Support',      value: 20 },
  { name: 'Sales',        value: 12 },
  { name: 'Other',        value: 8  },
];

const NAV_LINKS = [
  { icon: '🤖', label: 'My Bots',       path: '/my-bots',      badge: true  },
  { icon: '💬', label: 'Conversations', path: '/conversations'              },
  { icon: '📈', label: 'Analytics',     path: '/analytics'                  },
  { icon: '🧠', label: 'Training',      path: '/training'                   },
  { icon: '', label: 'Team',          path: '/teams'                      },
  { icon: '⚙️', label: 'Settings',      path: '/settings'                   },
];

const activityIcon = (action) => ({
  member_invited:   '👥',
  settings_updated: '⚙️',
  member_joined:    '✅',
  role_changed:     '🔄',
  member_removed:   '❌',
})[action] || '📋';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [stats, setStats]                   = useState(null);
  const [bots, setBots]                     = useState([]);
  const [activities, setActivities]         = useState([]);
  const [conversationData, setConversationData] = useState(fallbackConversationData);
  const [intentData, setIntentData]         = useState(fallbackIntentData);
  const [loading, setLoading]               = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [analyticsRes, botsRes, activityRes] = await Promise.allSettled([
          analyticsAPI.getOverview(),
          botsAPI.getAll(),
          teamAPI.getActivity('?limit=6'),
        ]);

        if (analyticsRes.status === 'fulfilled') {
          const d = analyticsRes.value.data;
          setStats({
            totalConversations: d.totalConversations ?? 0,
            activeUsers:        d.activeUsers        ?? 0,
            satisfactionRate:   d.satisfactionRate   ?? 0,
            avgResponseTime:    d.avgResponseTime    ?? 0,
            conversationTrend:  d.conversationTrend  ?? null,
            userTrend:          d.userTrend          ?? null,
            satisfactionTrend:  d.satisfactionTrend  ?? null,
          });
          if (d.conversationsByDay?.length) setConversationData(d.conversationsByDay);
          if (d.intentDistribution?.length) setIntentData(d.intentDistribution);
        }
        if (botsRes.status     === 'fulfilled') setBots(botsRes.value.data || []);
        if (activityRes.status === 'fulfilled') setActivities(activityRes.value.data || []);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [selectedPeriod]);

  const handleLogout = () => { logout(); navigate('/login'); };

  const usagePct = stats
    ? Math.min(((stats.totalConversations / 10000) * 100), 100).toFixed(0)
    : 0;

  const statCards = [
    {
      icon: '💬', color: '#40e0d0', bg: 'rgba(64,224,208,0.1)',
      label: 'Total Conversations',
      value: loading ? '…' : (stats?.totalConversations?.toLocaleString() || '0'),
      trend: stats?.conversationTrend,
    },
    {
      icon: '👥', color: '#6464ff', bg: 'rgba(100,100,255,0.1)',
      label: 'Active Users',
      value: loading ? '…' : (stats?.activeUsers?.toLocaleString() || '0'),
      trend: stats?.userTrend,
    },
    {
      icon: '⭐', color: '#9333ea', bg: 'rgba(147,51,234,0.1)',
      label: 'Satisfaction Rate',
      value: loading ? '…' : `${stats?.satisfactionRate || 0}%`,
      trend: stats?.satisfactionTrend,
    },
    {
      icon: '⏱️', color: '#ffa444', bg: 'rgba(255,164,68,0.1)',
      label: 'Avg Response Time',
      value: loading ? '…' : `${stats?.avgResponseTime || 0}s`,
      trend: null,
    },
  ];

  return (
    <div className="dashboard">

      {/* ══════════ SIDEBAR ══════════ */}
      <aside className="dashboard-sidebar">

        {/* User profile — TOP */}
        <div className="user-profile" onClick={() => navigate('/settings')}>
          <div className="user-avatar-wrap">
            <img
              src={
                user?.avatar ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'U')}&background=40e0d0&color=07080f&bold=true&size=80`
              }
              alt="avatar"
              className="user-avatar"
            />
            <span className="user-online-dot" />
          </div>
          <div className="user-info">
            <span className="user-name">{user?.fullName || 'User'}</span>
            {/* plan label removed; will show billing data when available */}
          </div>
          {/* logout button removed for cleaner profile display */}
        </div>

        {/* Logo */}
        <div className="sidebar-logo">
          <span className="logo-text">BuildSmart</span>
          <span className="logo-tagline">AI Chatbot Platform</span>
        </div>

        {/* Overview nav item (current page) */}
        <nav className="sidebar-nav">
          <div className="nav-item active">
            <span className="nav-icon">📊</span>
            <span className="nav-label">Overview</span>
          </div>

          {NAV_LINKS.map(item => (
            <Link key={item.label} to={item.path} className="nav-item">
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
              {item.badge && bots.length > 0 && (
                <span className="nav-badge">{bots.length}</span>
              )}
            </Link>
          ))}
        </nav>

        {/* Usage footer */}
        <div className="sidebar-footer">
          <div className="usage-card">
            <div className="usage-title">
              <span>Monthly Usage</span>
              <span className="usage-percent">{usagePct}%</span>
            </div>
            <div className="usage-bar">
              <div className="usage-fill" style={{ width: `${usagePct}%` }} />
            </div>
            <div className="usage-stats">
              <span>{stats?.totalConversations?.toLocaleString() || 0} / 10,000</span>
              <span>conversations</span>
            </div>
            <button className="upgrade-btn" onClick={() => navigate('/billing')}>
              Upgrade Plan ✨
            </button>
          </div>
        </div>
      </aside>

      {/* ══════════ MAIN ══════════ */}
      <main className="dashboard-main">

        {/* Header */}
        <div className="dashboard-header">
          <div className="header-title">
            
            <h2>
              Welcome back,{' '}
              <strong style={{ color: 'rgba(255,255,255,0.85)' }}>
                {user?.fullName?.split(' ')[0] || 'there'}
              </strong>
              ! Here's what's happening with your bots.
            </h2>
          </div>
          <div className="header-actions">
            <div className="period-selector">
              {['day', 'week', 'month'].map(p => (
                <button
                  key={p}
                  className={selectedPeriod === p ? 'active' : ''}
                  onClick={() => setSelectedPeriod(p)}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
            <button className="create-bot-btn" onClick={() => navigate('/new-chatbot')}>
              <span className="btn-icon">+</span>
              New Bot
            </button>
          </div>
        </div>

        {/* ── Stats ── */}
        <div className="stats-grid">
          {statCards.map(card => (
            <div key={card.label} className="stat-card">
              <div className="stat-icon" style={{ background: card.bg }}>
                <span style={{ color: card.color }}>{card.icon}</span>
              </div>
              <div className="stat-content">
                <span className="stat-label">{card.label}</span>
                <span className="stat-value">{card.value}</span>
                {card.trend != null && (
                  <span className={`stat-trend ${card.trend >= 0 ? 'positive' : 'negative'}`}>
                    {card.trend >= 0 ? '↑' : '↓'} {Math.abs(card.trend)}% vs last week
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* ── Charts row 1 ── */}
        <div className="charts-row">
          <div className="chart-card">
            <div className="chart-header"><h3>Conversation Trends</h3></div>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={270}>
                <AreaChart data={conversationData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#40e0d0" stopOpacity={0.45} />
                      <stop offset="95%" stopColor="#40e0d0" stopOpacity={0}    />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="conversations" stroke="#40e0d0" strokeWidth={2} fill="url(#areaGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="chart-card">
            <div className="chart-header"><h3>User Intent Distribution</h3></div>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={270}>
                <PieChart>
                  <Pie
                    data={intentData}
                    cx="50%" cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={85}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {intentData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* ── Charts row 2 (only if bots exist) ── */}
        {bots.length > 1 && (
          <div className="charts-row">
            <div className="chart-card full-width">
              <div className="chart-header"><h3>Bot Performance Comparison</h3></div>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={270}>
                  <BarChart
                    data={bots.slice(0, 5).map(b => ({
                      name:          b.name,
                      conversations: b.stats?.totalConversations || 0,
                      users:         b.stats?.uniqueUsers        || 0,
                    }))}
                    margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="users"         fill="#40e0d0" radius={[4,4,0,0]} />
                    <Bar dataKey="conversations" fill="#6464ff" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* ── Bottom grid ── */}
        <div className="bottom-grid">
          <div className="activity-card">
            <div className="card-header">
              <h3>Recent Activity</h3>
              <Link to="/teams" className="view-all">View all →</Link>
            </div>
            <div className="activity-list">
              {activities.length > 0 ? activities.map(a => (
                <div key={a._id} className="activity-item">
                  <div className="activity-icon">{activityIcon(a.action)}</div>
                  <div className="activity-details">
                    <p className="activity-description">{a.description}</p>
                    <span className="activity-time">{new Date(a.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              )) : (
                <p style={{ color: 'var(--text-lo)', padding: '20px', textAlign: 'center', fontSize: '0.85rem', margin: 0 }}>
                  No recent activity yet.
                </p>
              )}
            </div>
          </div>

          <div className="top-bots-card">
            <h3>Top Performing Bots</h3>
            <div className="bots-list">
              {bots.length > 0 ? bots.slice(0, 4).map((bot, i) => (
                <div key={bot._id} className="bot-item">
                  <div className="bot-rank">#{i + 1}</div>
                  <div className="bot-info">
                    <span className="bot-name">{bot.name}</span>
                    <span className="bot-stats">{(bot.stats?.totalConversations || 0).toLocaleString()} convs</span>
                  </div>
                  <div className="bot-satisfaction">
                    <span className="satisfaction-value">{bot.stats?.satisfactionRate || 0}%</span>
                    <span className="satisfaction-label">satisfied</span>
                  </div>
                </div>
              )) : (
                <p style={{ color: 'var(--text-lo)', padding: '20px', textAlign: 'center', fontSize: '0.85rem', margin: 0 }}>
                  No bots yet.{' '}
                  <button
                    onClick={() => navigate('/new-chatbot')}
                    style={{ color: 'var(--teal)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, padding: 0 }}
                  >
                    Create one!
                  </button>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── AI Insights ── */}
        <div className="insights-card">
          <div className="insights-header">
            <h3>🤖 AI Insights & Recommendations</h3>
            <span className="insights-badge">Upgrade now</span>
          </div>
          <div className="insights-grid">
            {[
              {
                icon: '📈',
                title: 'Product Questions Up 23%',
                body: 'Consider updating your product catalog in the training data to handle the increased volume better.',
              },
              {
                icon: '⚠️',
                title: 'High Drop-off at Pricing',
                body: 'Users frequently leave after pricing queries. Adding detailed pricing info can significantly improve retention.',
              },
              {
                icon: '⏰',
                title: 'Peak Hours: 2 – 4 PM',
                body: 'Your bots are busiest in the early afternoon. Ensure your infrastructure can handle peak load during these hours.',
              },
            ].map(item => (
              <div key={item.title} className="insight-item">
                <span className="insight-icon">{item.icon}</span>
                <div className="insight-content">
                  <h4>{item.title}</h4>
                  <p>{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </main>
    </div>
  );
};

export default Dashboard;