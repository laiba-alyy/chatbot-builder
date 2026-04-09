// src/pages/Conversations.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { conversationsAPI, botsAPI } from '../services/api';
import './Conversations.css';

const Conversations = () => {
  const [selectedBot, setSelectedBot] = useState('all');
  const [dateRange, setDateRange] = useState('today');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  const [conversations, setConversations] = useState([]);
  const [bots, setBots] = useState([{ _id: 'all', name: 'All Bots', avatar: '🤖' }]);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [exporting, setExporting] = useState(false);

  const dateRanges = [
    { id: 'today', name: 'Today' },
    { id: 'yesterday', name: 'Yesterday' },
    { id: 'last7', name: 'Last 7 days' },
    { id: 'last30', name: 'Last 30 days' },
    { id: 'thisMonth', name: 'This month' },
  ];

  const statuses = [
    { id: 'all', name: 'All Status', icon: '🔄' },
    { id: 'active', name: 'Active', icon: '⏳' },
    { id: 'resolved', name: 'Resolved', icon: '✅' },
    { id: 'escalated', name: 'Escalated', icon: '⚠️' },
  ];

  // ─── Load bots for filter ─────────────────────────────────────────────────
  useEffect(() => {
    botsAPI.getAll()
      .then(res => {
        const botList = res.data || [];
        setBots([{ _id: 'all', name: 'All Bots', avatar: '🤖' }, ...botList]);
      })
      .catch(() => {}); // bots filter is non-critical
  }, []);

  // ─── Load conversations ───────────────────────────────────────────────────
  const fetchConversations = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (selectedBot !== 'all') params.set('botId', selectedBot);
      if (filterStatus !== 'all') params.set('status', filterStatus);
      if (searchQuery) params.set('search', searchQuery);
      if (dateRange !== 'all') params.set('period', dateRange);
      params.set('page', page);
      params.set('limit', 20);

      const response = await conversationsAPI.getAll(`?${params.toString()}`);
      const data = response.data;

      // API may return { conversations, total, pages } or just an array
      if (Array.isArray(data)) {
        setConversations(data);
        setTotalPages(1);
      } else {
        setConversations(data.conversations || data.data || []);
        setTotalPages(data.pages || data.totalPages || 1);
      }
    } catch (err) {
      setError(err.message || 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  }, [selectedBot, filterStatus, dateRange, page, searchQuery]);

  useEffect(() => {
    const timer = setTimeout(fetchConversations, searchQuery ? 400 : 0);
    return () => clearTimeout(timer);
  }, [fetchConversations]);

  // ─── Load full conversation messages ─────────────────────────────────────
  const openConversation = async (conv) => {
    // If messages already loaded, just select
    if (conv.messages?.length > 0) {
      setSelectedConversation(conv);
      return;
    }
    setLoadingMessages(true);
    setSelectedConversation({ ...conv, messages: [] });
    try {
      const response = await conversationsAPI.getById(conv._id);
      setSelectedConversation(response.data);
    } catch {
      setSelectedConversation(conv);
    } finally {
      setLoadingMessages(false);
    }
  };

  // ─── Export ───────────────────────────────────────────────────────────────
  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/conversations/export?format=csv`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      if (!response.ok) throw new Error('Export failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `conversations-${Date.now()}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(err.message || 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  // ─── Helpers ──────────────────────────────────────────────────────────────
  const getStatusIcon = (status) => {
    switch (status) {
      case 'resolved': return '✅';
      case 'active':
      case 'ongoing': return '⏳';
      case 'escalated': return '⚠️';
      default: return '🔄';
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'resolved': return 'status-resolved';
      case 'active':
      case 'ongoing': return 'status-ongoing';
      case 'escalated': return 'status-escalated';
      default: return '';
    }
  };

  const getSentimentIcon = (sentiment) => {
    switch (sentiment) {
      case 'positive': return '😊';
      case 'negative': return '😞';
      case 'neutral': return '😐';
      default: return '😐';
    }
  };

  const formatTime = (ts) => {
    if (!ts) return '';
    try { return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
    catch { return ts; }
  };

  const formatDate = (ts) => {
    if (!ts) return '';
    try {
      const d = new Date(ts);
      const now = new Date();
      const diff = now - d;
      if (diff < 86400000) return formatTime(ts);
      if (diff < 172800000) return 'Yesterday';
      return d.toLocaleDateString();
    } catch { return ts; }
  };

  const getBotIcon = (conv) => {
    if (conv.botId?.category) {
      const icons = { ecommerce: '🛍️', support: '🎧', sales: '📈', realestate: '🏠', healthcare: '🏥', hr: '👥' };
      return icons[conv.botId.category] || '🤖';
    }
    return '🤖';
  };

  const getBotColor = (conv) => conv.botId?.settings?.primaryColor || '#40e0d0';

  // ─── Stats ────────────────────────────────────────────────────────────────
  const stats = {
    total: conversations.length,
    resolved: conversations.filter(c => c.status === 'resolved').length,
    ongoing: conversations.filter(c => ['active','ongoing'].includes(c.status)).length,
    escalated: conversations.filter(c => c.status === 'escalated').length,
    avgSatisfaction: (() => {
      const rated = conversations.filter(c => c.satisfaction);
      return rated.length ? (rated.reduce((s, c) => s + c.satisfaction, 0) / rated.length).toFixed(1) : 'N/A';
    })(),
  };

  // ─── Preview text ─────────────────────────────────────────────────────────
  const getPreview = (conv) => {
    const msgs = conv.messages || [];
    if (msgs.length > 0) return (msgs[0].content || '').substring(0, 80);
    return conv.lastMessage || 'No messages yet';
  };

  return (
    <div className="conversations">
      {/* Header */}
      <div className="conv-header">
        <div>
          <h1>Conversations</h1>
          <p>Monitor and analyze all chat interactions</p>
        </div>
        <button className="export-btn" onClick={handleExport} disabled={exporting}>
          <span className="btn-icon">📥</span>
          {exporting ? 'Exporting...' : 'Export Data'}
        </button>
      </div>

      {/* Stats */}
      <div className="conv-stats">
        <div className="stat-card"><span className="stat-value">{stats.total}</span><span className="stat-label">Total</span></div>
        <div className="stat-card"><span className="stat-value">{stats.resolved}</span><span className="stat-label">Resolved</span></div>
        <div className="stat-card"><span className="stat-value">{stats.ongoing}</span><span className="stat-label">Ongoing</span></div>
        <div className="stat-card"><span className="stat-value">{stats.escalated}</span><span className="stat-label">Escalated</span></div>
        <div className="stat-card"><span className="stat-value">{stats.avgSatisfaction}{stats.avgSatisfaction !== 'N/A' ? '⭐' : ''}</span><span className="stat-label">Avg. Satisfaction</span></div>
      </div>

      {/* Error */}
      {error && (
        <div style={{ background: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.3)', color: '#ff6b6b', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>
          {error} <button onClick={fetchConversations} style={{ marginLeft: '8px', color: '#40e0d0', background: 'none', border: 'none', cursor: 'pointer' }}>Retry</button>
        </div>
      )}

      {/* Filters Bar */}
      <div className="filters-bar">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search conversations by user, message, or tags..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery && <button className="clear-search" onClick={() => setSearchQuery('')}>✕</button>}
        </div>
        <button className="filter-toggle" onClick={() => setShowFilters(v => !v)}>
          <span className="filter-icon">⚙️</span>
          Filters {showFilters ? '▲' : '▼'}
        </button>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="advanced-filters">
          <div className="filter-group">
            <label>Bot</label>
            <div className="bot-filter-options">
              {bots.map(bot => (
                <button
                  key={bot._id}
                  className={`bot-filter-btn ${selectedBot === bot._id ? 'active' : ''}`}
                  onClick={() => { setSelectedBot(bot._id); setPage(1); }}
                >
                  <span className="bot-avatar-small">{bot.avatar || getBotIcon({ botId: bot })}</span>
                  {bot.name}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <label>Date Range</label>
            <div className="date-range-options">
              {dateRanges.map(r => (
                <button
                  key={r.id}
                  className={`date-range-btn ${dateRange === r.id ? 'active' : ''}`}
                  onClick={() => { setDateRange(r.id); setPage(1); }}
                >
                  {r.name}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <label>Status</label>
            <div className="status-filter-options">
              {statuses.map(s => (
                <button
                  key={s.id}
                  className={`status-filter-btn ${filterStatus === s.id ? 'active' : ''}`}
                  onClick={() => { setFilterStatus(s.id); setPage(1); }}
                >
                  <span>{s.icon}</span> {s.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="conv-content">
        {/* List */}
        <div className={`conv-list ${selectedConversation ? 'with-details' : ''}`}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
              Loading conversations...
            </div>
          ) : conversations.length === 0 ? (
            <div className="no-conversations">
              <div className="no-conv-icon">💬</div>
              <h3>No conversations found</h3>
              <p>{searchQuery ? 'Try different search terms' : 'No conversations match your filters'}</p>
            </div>
          ) : (
            <>
              {conversations.map(conv => (
                <div
                  key={conv._id}
                  className={`conv-item ${selectedConversation?._id === conv._id ? 'selected' : ''}`}
                  onClick={() => openConversation(conv)}
                >
                  <div className="conv-item-header">
                    <div className="conv-user-info">
                      <div className="conv-avatar" style={{ backgroundColor: getBotColor(conv) + '20' }}>
                        {getBotIcon(conv)}
                      </div>
                      <div className="conv-user-details">
                        <h4>{conv.userId?.name || conv.visitorName || 'Anonymous'}</h4>
                        <span className="conv-user-email">{conv.userId?.email || conv.visitorEmail || ''}</span>
                      </div>
                    </div>
                    <span className={`conv-status ${getStatusClass(conv.status)}`}>
                      {getStatusIcon(conv.status)} {conv.status}
                    </span>
                  </div>

                  <div className="conv-preview">
                    <p>{getPreview(conv)}{getPreview(conv).length >= 80 ? '...' : ''}</p>
                  </div>

                  <div className="conv-meta">
                    <div className="conv-bot-info">
                      <span className="conv-bot-name">{conv.botId?.name || 'Unknown Bot'}</span>
                      <span className="conv-time">{formatDate(conv.createdAt)}</span>
                    </div>
                    {conv.tags?.length > 0 && (
                      <div className="conv-tags">
                        {conv.tags.slice(0, 2).map((tag, i) => (
                          <span key={i} className="tag">#{tag}</span>
                        ))}
                        {conv.tags.length > 2 && <span className="tag-more">+{conv.tags.length - 2}</span>}
                      </div>
                    )}
                  </div>

                  {conv.satisfaction && (
                    <div className="conv-satisfaction">{'⭐'.repeat(conv.satisfaction)}</div>
                  )}
                </div>
              ))}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="conv-pagination">
                  <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="page-btn">←</button>
                  <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>Page {page} of {totalPages}</span>
                  <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="page-btn">→</button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Details Panel */}
        {selectedConversation ? (
          <div className="conv-details">
            <div className="details-header">
              <button className="close-details" onClick={() => setSelectedConversation(null)}>✕</button>
              <h2>Conversation Details</h2>
            </div>

            <div className="details-content">
              {/* User Info */}
              <div className="details-section user-info">
                <h3>User Information</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">Name</span>
                    <span className="info-value">{selectedConversation.userId?.name || selectedConversation.visitorName || 'Anonymous'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Email</span>
                    <span className="info-value">{selectedConversation.userId?.email || selectedConversation.visitorEmail || 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Location</span>
                    <span className="info-value">{selectedConversation.metadata?.location || 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Device</span>
                    <span className="info-value">{selectedConversation.metadata?.device || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Conv Stats */}
              <div className="details-section">
                <h3>Conversation Stats</h3>
                <div className="stats-mini-grid">
                  <div className="stat-mini">
                    <span className="stat-mini-label">Started</span>
                    <span className="stat-mini-value">{formatDate(selectedConversation.createdAt)}</span>
                  </div>
                  <div className="stat-mini">
                    <span className="stat-mini-label">Messages</span>
                    <span className="stat-mini-value">{selectedConversation.messages?.length || 0}</span>
                  </div>
                  <div className="stat-mini">
                    <span className="stat-mini-label">Status</span>
                    <span className={`stat-mini-value ${getStatusClass(selectedConversation.status)}`}>
                      {selectedConversation.status}
                    </span>
                  </div>
                  <div className="stat-mini">
                    <span className="stat-mini-label">Satisfaction</span>
                    <span className="stat-mini-value">
                      {selectedConversation.satisfaction ? '⭐'.repeat(selectedConversation.satisfaction) : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tags */}
              {selectedConversation.tags?.length > 0 && (
                <div className="details-section">
                  <h3>Tags</h3>
                  <div className="tags-container">
                    {selectedConversation.tags.map((tag, i) => (
                      <span key={i} className="tag-large">#{tag}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Messages */}
              <div className="details-section message-thread">
                <h3>Message Thread</h3>
                {loadingMessages ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: 'rgba(255,255,255,0.4)' }}>
                    Loading messages...
                  </div>
                ) : (
                  <div className="messages-container">
                    {(selectedConversation.messages || []).map((msg, i) => (
                      <div key={msg._id || i} className={`message ${msg.role}`}>
                        <div className="message-avatar">
                          {msg.role === 'bot' || msg.role === 'assistant' ? getBotIcon(selectedConversation) : '👤'}
                        </div>
                        <div className="message-content">
                          <div className="message-header">
                            <span className="message-role">
                              {msg.role === 'bot' || msg.role === 'assistant'
                                ? (selectedConversation.botId?.name || 'Bot')
                                : (selectedConversation.userId?.name || 'User')}
                            </span>
                            <span className="message-time">{formatTime(msg.createdAt || msg.timestamp)}</span>
                            {msg.sentiment && (
                              <span className="message-sentiment" title={`Sentiment: ${msg.sentiment}`}>
                                {getSentimentIcon(msg.sentiment)}
                              </span>
                            )}
                          </div>
                          <p className="message-text">{msg.content}</p>
                        </div>
                      </div>
                    ))}
                    {(!selectedConversation.messages || selectedConversation.messages.length === 0) && (
                      <div style={{ textAlign: 'center', padding: '20px', color: 'rgba(255,255,255,0.3)' }}>
                        No messages in this conversation
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="details-actions">
                <button className="action-btn-primary">
                  <span className="btn-icon">📧</span>
                  Email Transcript
                </button>
                <button className="action-btn-secondary">
                  <span className="btn-icon">🏷️</span>
                  Add Tags
                </button>
                <button className="action-btn-secondary">
                  <span className="btn-icon">📊</span>
                  View Analytics
                </button>
                <button className="action-btn-danger">
                  <span className="btn-icon">⚠️</span>
                  Report Issue
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="conv-details-placeholder">
            <div className="placeholder-content">
              <span className="placeholder-icon">💬</span>
              <h3>Select a conversation</h3>
              <p>Choose a conversation from the list to view details</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Conversations;