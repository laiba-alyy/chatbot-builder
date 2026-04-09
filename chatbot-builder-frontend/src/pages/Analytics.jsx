// src/pages/Analytics.jsx
import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  AreaChart, Area, ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { analyticsAPI } from '../services/api';
import './Analytics.css';

// ─── Fallback static data ─────────────────────────────────────────────────────
const fallbackTrends = [
  { date: '2024-02-01', conversations: 145, satisfaction: 92, responseTime: 1.2 },
  { date: '2024-02-02', conversations: 162, satisfaction: 94, responseTime: 1.1 },
  { date: '2024-02-03', conversations: 158, satisfaction: 93, responseTime: 1.3 },
  { date: '2024-02-04', conversations: 184, satisfaction: 95, responseTime: 1.0 },
  { date: '2024-02-05', conversations: 176, satisfaction: 94, responseTime: 1.1 },
  { date: '2024-02-06', conversations: 195, satisfaction: 96, responseTime: 0.9 },
  { date: '2024-02-07', conversations: 203, satisfaction: 95, responseTime: 1.0 },
];

const fallbackHourly = Array.from({ length: 24 }, (_, i) => ({
  hour: String(i).padStart(2, '0'),
  conversations: Math.floor(Math.random() * 150) + 10,
  satisfaction: Math.floor(Math.random() * 10) + 90
}));

const fallbackIntents = [
  { name: 'Product Info', value: 35, color: '#40e0d0' },
  { name: 'Pricing', value: 25, color: '#6464ff' },
  { name: 'Support', value: 20, color: '#9333ea' },
  { name: 'Sales', value: 12, color: '#ff6b6b' },
  { name: 'Other', value: 8, color: '#ffa444' },
];

const fallbackSentiment = [
  { date: 'Week 1', positive: 72, neutral: 20, negative: 8 },
  { date: 'Week 2', positive: 75, neutral: 18, negative: 7 },
  { date: 'Week 3', positive: 78, neutral: 16, negative: 6 },
  { date: 'Week 4', positive: 80, neutral: 15, negative: 5 },
];

const fallbackRetention = [
  { month: 'Month 1', percentage: 100 },
  { month: 'Month 2', percentage: 78 },
  { month: 'Month 3', percentage: 65 },
  { month: 'Month 4', percentage: 58 },
  { month: 'Month 5', percentage: 52 },
  { month: 'Month 6', percentage: 48 },
];

const fallbackGeo = [
  { country: 'USA', users: 2450, conversations: 5230 },
  { country: 'UK', users: 890, conversations: 2100 },
  { country: 'Canada', users: 670, conversations: 1450 },
  { country: 'Australia', users: 540, conversations: 1120 },
  { country: 'Germany', users: 430, conversations: 890 },
];

const fallbackDevice = [
  { name: 'Mobile', value: 55, color: '#40e0d0' },
  { name: 'Desktop', value: 35, color: '#6464ff' },
  { name: 'Tablet', value: 10, color: '#9333ea' },
];

const periods = [
  { id: '24h', name: 'Last 24 Hours' },
  { id: '7d', name: 'Last 7 Days' },
  { id: '30d', name: 'Last 30 Days' },
  { id: '90d', name: 'Last 90 Days' },
  { id: '12m', name: 'Last 12 Months' },
];

const metrics = [
  { id: 'conversations', name: 'Conversations', icon: '💬' },
  { id: 'satisfaction', name: 'Satisfaction', icon: '⭐' },
  { id: 'responseTime', name: 'Response Time', icon: '⚡' },
  { id: 'users', name: 'Active Users', icon: '👥' },
];

const Analytics = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [selectedMetric, setSelectedMetric] = useState('conversations');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // ─── Data state ───────────────────────────────────────────────────────────
  const [stats, setStats] = useState(null);
  const [trends, setTrends] = useState(fallbackTrends);
  const [hourlyData, setHourlyData] = useState(fallbackHourly);
  const [intentData, setIntentData] = useState(fallbackIntents);
  const [sentimentData, setSentimentData] = useState(fallbackSentiment);
  const [retentionData, setRetentionData] = useState(fallbackRetention);
  const [geoData, setGeoData] = useState(fallbackGeo);
  const [deviceData, setDeviceData] = useState(fallbackDevice);
  const [botPerformance, setBotPerformance] = useState([]);
  const [topQuestions, setTopQuestions] = useState([]);

  // ─── Fetch data ───────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [overviewRes, detailedRes, realtimeRes] = await Promise.allSettled([
          analyticsAPI.getOverview(`?period=${selectedPeriod}`),
          analyticsAPI.getDetailed(`?period=${selectedPeriod}`),
          analyticsAPI.getRealtime()
        ]);

        // Overview stats
        if (overviewRes.status === 'fulfilled') {
          const d = overviewRes.value.data;
          setStats({
            totalConversations: d.totalConversations || 0,
            avgSatisfaction: d.satisfactionRate || 0,
            avgResponseTime: d.avgResponseTime || 0,
            activeUsers: d.activeUsers || 0,
            retentionRate: d.retentionRate || 0,
            totalRevenue: d.revenue || 0,
            peakHour: d.peakHour || 'N/A',
            popularIntent: d.popularIntent || 'N/A',
            topCountry: d.topCountry || 'N/A',
            mobilePercentage: d.mobilePercentage || 0,
            conversationTrend: d.conversationTrend || 0,
            satisfactionTrend: d.satisfactionTrend || 0,
            userTrend: d.userTrend || 0
          });

          if (d.conversationsByDay?.length > 0) setTrends(d.conversationsByDay);
          if (d.intentDistribution?.length > 0) setIntentData(d.intentDistribution);
          if (d.deviceBreakdown?.length > 0) setDeviceData(d.deviceBreakdown);
          if (d.geoDistribution?.length > 0) setGeoData(d.geoDistribution);
          if (d.sentimentTrends?.length > 0) setSentimentData(d.sentimentTrends);
          if (d.retentionData?.length > 0) setRetentionData(d.retentionData);
          if (d.botPerformance?.length > 0) setBotPerformance(d.botPerformance);
          if (d.topQuestions?.length > 0) setTopQuestions(d.topQuestions);
        }

        // Detailed / hourly
        if (detailedRes.status === 'fulfilled') {
          const d = detailedRes.value.data;
          if (d.hourlyActivity?.length > 0) setHourlyData(d.hourlyActivity);
        }

        // Realtime
        if (realtimeRes.status === 'fulfilled') {
          // realtime data can be used for live indicators if needed
        }

      } catch (err) {
        console.error('Analytics fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedPeriod]);

  // ─── Export handler ───────────────────────────────────────────────────────
  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/analytics/export?format=csv&period=${selectedPeriod}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-${selectedPeriod}-${Date.now()}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export error:', err);
      alert('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const tooltipStyle = {
    contentStyle: {
      background: 'rgba(10,10,26,0.9)',
      border: '1px solid rgba(64,224,208,0.2)',
      borderRadius: '8px',
      color: '#fff'
    }
  };

  return (
    <div className="analytics">
      {/* Header */}
      <div className="analytics-header">
        <div>
          <h1>Analytics Dashboard</h1>
          <p>Deep insights into your bot performance and user behavior</p>
        </div>
        <div className="header-actions">
          <button className="export-btn" onClick={handleExport} disabled={exporting}>
            <span className="btn-icon">📥</span>
            {exporting ? 'Exporting...' : 'Export Report'}
          </button>
        </div>
      </div>

      {/* Period Selector */}
      <div className="period-selector">
        {periods.map(period => (
          <button
            key={period.id}
            className={`period-btn ${selectedPeriod === period.id ? 'active' : ''}`}
            onClick={() => setSelectedPeriod(period.id)}
          >
            {period.name}
          </button>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="summary-stats">
        <div className="stat-card large">
          <div className="stat-icon">💬</div>
          <div className="stat-content">
            <span className="stat-label">Total Conversations</span>
            <span className="stat-value">
              {loading ? '...' : (stats?.totalConversations?.toLocaleString() || '0')}
            </span>
            {stats?.conversationTrend !== undefined && (
              <span className={`stat-trend ${stats.conversationTrend >= 0 ? 'positive' : 'negative'}`}>
                {stats.conversationTrend >= 0 ? '↑' : '↓'} {Math.abs(stats.conversationTrend)}% from last period
              </span>
            )}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⭐</div>
          <div className="stat-content">
            <span className="stat-label">Satisfaction</span>
            <span className="stat-value">{loading ? '...' : `${stats?.avgSatisfaction || 0}%`}</span>
            {stats?.satisfactionTrend !== undefined && (
              <span className={`stat-trend ${stats.satisfactionTrend >= 0 ? 'positive' : 'negative'}`}>
                {stats.satisfactionTrend >= 0 ? '↑' : '↓'} {Math.abs(stats.satisfactionTrend)}%
              </span>
            )}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⚡</div>
          <div className="stat-content">
            <span className="stat-label">Response Time</span>
            <span className="stat-value">{loading ? '...' : `${stats?.avgResponseTime || 0}s`}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <span className="stat-label">Active Users</span>
            <span className="stat-value">
              {loading ? '...' : (stats?.activeUsers?.toLocaleString() || '0')}
            </span>
            {stats?.userTrend !== undefined && (
              <span className={`stat-trend ${stats.userTrend >= 0 ? 'positive' : 'negative'}`}>
                {stats.userTrend >= 0 ? '↑' : '↓'} {Math.abs(stats.userTrend)}%
              </span>
            )}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🔄</div>
          <div className="stat-content">
            <span className="stat-label">Retention</span>
            <span className="stat-value">{loading ? '...' : `${stats?.retentionRate || 0}%`}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <span className="stat-label">Revenue</span>
            <span className="stat-value">
              {loading ? '...' : `$${(stats?.totalRevenue || 0).toLocaleString()}`}
            </span>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="charts-grid">

        {/* Conversation Trends */}
        <div className="chart-card full-width">
          <div className="chart-header">
            <div>
              <h3>Conversation Trends</h3>
              <p className="chart-subtitle">Daily conversation volume and satisfaction</p>
            </div>
            <div className="chart-controls">
              <select
                className="metric-selector"
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value)}
              >
                {metrics.map(m => (
                  <option key={m.id} value={m.id}>{m.icon} {m.name}</option>
                ))}
              </select>
              <button className="advanced-toggle" onClick={() => setShowAdvanced(!showAdvanced)}>
                {showAdvanced ? 'Simple View' : 'Advanced View'}
              </button>
            </div>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={400}>
              <ComposedChart data={trends}>
                <defs>
                  <linearGradient id="colorConversations" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#40e0d0" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#40e0d0" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="date" stroke="rgba(255,255,255,0.5)" />
                <YAxis yAxisId="left" stroke="rgba(255,255,255,0.5)" />
                <YAxis yAxisId="right" orientation="right" stroke="rgba(255,255,255,0.5)" />
                <Tooltip {...tooltipStyle} />
                <Legend />
                <Area yAxisId="left" type="monotone" dataKey="conversations" stroke="#40e0d0" fill="url(#colorConversations)" name="Conversations" />
                <Line yAxisId="right" type="monotone" dataKey="satisfaction" stroke="#6464ff" name="Satisfaction %" strokeWidth={2} />
                {showAdvanced && (
                  <Bar yAxisId="left" dataKey="responseTime" fill="#9333ea" name="Response Time (s)" opacity={0.5} />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bot Performance */}
        {botPerformance.length > 0 && (
          <div className="chart-card">
            <div className="chart-header">
              <h3>Bot Performance</h3>
              <p className="chart-subtitle">Compare bot metrics</p>
            </div>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={botPerformance} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis type="number" stroke="rgba(255,255,255,0.5)" />
                  <YAxis dataKey="name" type="category" stroke="rgba(255,255,255,0.5)" />
                  <Tooltip {...tooltipStyle} />
                  <Legend />
                  <Bar dataKey="conversations" fill="#40e0d0" name="Conversations" />
                  <Bar dataKey="users" fill="#6464ff" name="Users" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Intent Distribution */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>User Intent</h3>
            <p className="chart-subtitle">What users are asking about</p>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={intentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {intentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || ['#40e0d0','#6464ff','#9333ea','#ff6b6b','#ffa444'][index % 5]} />
                  ))}
                </Pie>
                <Tooltip {...tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Hourly Activity */}
        <div className="chart-card full-width">
          <div className="chart-header">
            <h3>Hourly Activity</h3>
            <p className="chart-subtitle">Conversation volume by hour</p>
          </div>
          <div className="chart-container">
            <defs>
              <linearGradient id="colorHourly" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#40e0d0" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#40e0d0" stopOpacity={0} />
              </linearGradient>
            </defs>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="hour" stroke="rgba(255,255,255,0.5)" />
                <YAxis stroke="rgba(255,255,255,0.5)" />
                <Tooltip {...tooltipStyle} />
                <Area type="monotone" dataKey="conversations" stroke="#40e0d0" fill="rgba(64,224,208,0.2)" name="Conversations" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* User Retention */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>User Retention</h3>
            <p className="chart-subtitle">Cohort analysis</p>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={retentionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="month" stroke="rgba(255,255,255,0.5)" />
                <YAxis stroke="rgba(255,255,255,0.5)" />
                <Tooltip {...tooltipStyle} />
                <Line type="monotone" dataKey="percentage" stroke="#6464ff" strokeWidth={3} dot={{ fill: '#40e0d0', strokeWidth: 2 }} name="Retention %" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Device Breakdown */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>Device Usage</h3>
            <p className="chart-subtitle">User device distribution</p>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={deviceData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {deviceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || ['#40e0d0','#6464ff','#9333ea'][index % 3]} />
                  ))}
                </Pie>
                <Tooltip {...tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Geographic Distribution */}
        <div className="chart-card full-width">
          <div className="chart-header">
            <h3>Geographic Distribution</h3>
            <p className="chart-subtitle">Top countries by user count</p>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={geoData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis type="number" stroke="rgba(255,255,255,0.5)" />
                <YAxis dataKey="country" type="category" stroke="rgba(255,255,255,0.5)" />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="users" fill="#40e0d0" name="Users" />
                <Bar dataKey="conversations" fill="#6464ff" name="Conversations" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sentiment Trends */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>Sentiment Analysis</h3>
            <p className="chart-subtitle">User sentiment over time</p>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={sentimentData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="date" stroke="rgba(255,255,255,0.5)" />
                <YAxis stroke="rgba(255,255,255,0.5)" />
                <Tooltip {...tooltipStyle} />
                <Area stackId="1" type="monotone" dataKey="positive" stroke="#40e0d0" fill="#40e0d0" fillOpacity={0.6} name="Positive" />
                <Area stackId="1" type="monotone" dataKey="neutral" stroke="#6464ff" fill="#6464ff" fillOpacity={0.6} name="Neutral" />
                <Area stackId="1" type="monotone" dataKey="negative" stroke="#ff6b6b" fill="#ff6b6b" fillOpacity={0.6} name="Negative" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Questions */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>Top Questions</h3>
            <p className="chart-subtitle">Most frequently asked</p>
          </div>
          <div className="top-questions-list">
            {topQuestions.length > 0 ? topQuestions.map((q, i) => (
              <div key={i} className="question-item">
                <div className="question-rank">#{i + 1}</div>
                <div className="question-content">
                  <span className="question-text">{q.question}</span>
                  <div className="question-stats">
                    <span className="question-count">{q.count} times</span>
                    {q.trend && (
                      <span className={`question-trend ${q.trend.startsWith('+') ? 'positive' : 'negative'}`}>
                        {q.trend}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )) : (
              <div style={{ color: 'rgba(255,255,255,0.4)', padding: '20px', textAlign: 'center' }}>
                No data yet
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Insights */}
      <div className="insights-section">
        <h2>AI-Powered Insights</h2>
        <div className="insights-grid">
          <div className="insight-card">
            <div className="insight-icon">📈</div>
            <div className="insight-content">
              <h4>Peak Performance</h4>
              <p>Conversations peak at {stats?.peakHour || 'N/A'} with highest satisfaction rates.</p>
              <span className="insight-meta">Based on last {selectedPeriod} data</span>
            </div>
          </div>
          <div className="insight-card">
            <div className="insight-icon">🎯</div>
            <div className="insight-content">
              <h4>Top Intent: {stats?.popularIntent || 'N/A'}</h4>
              <p>Users are most interested in this topic. Expand your knowledge base for better results.</p>
              <span className="insight-meta">Most common conversation topic</span>
            </div>
          </div>
          <div className="insight-card">
            <div className="insight-icon">🌍</div>
            <div className="insight-content">
              <h4>Top Country: {stats?.topCountry || 'N/A'}</h4>
              <p>This market shows the highest engagement. Consider localizing your bot.</p>
              <span className="insight-meta">Based on user location data</span>
            </div>
          </div>
          <div className="insight-card">
            <div className="insight-icon">📱</div>
            <div className="insight-content">
              <h4>Mobile First</h4>
              <p>{stats?.mobilePercentage || 0}% of users access via mobile. Ensure mobile optimization.</p>
              <span className="insight-meta">Device breakdown analysis</span>
            </div>
          </div>
          <div className="insight-card">
            <div className="insight-icon">⭐</div>
            <div className="insight-content">
              <h4>Satisfaction Rate</h4>
              <p>Current satisfaction rate is {stats?.avgSatisfaction || 0}%. Keep improving response quality.</p>
              <span className="insight-meta">Based on user feedback</span>
            </div>
          </div>
          <div className="insight-card">
            <div className="insight-icon">💰</div>
            <div className="insight-content">
              <h4>Revenue Tracking</h4>
              <p>Total revenue: ${(stats?.totalRevenue || 0).toLocaleString()}. Consider upselling features.</p>
              <span className="insight-meta">From commerce-enabled bots</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;