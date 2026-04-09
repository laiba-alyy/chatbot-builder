// src/pages/MyBot.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { botsAPI } from '../services/api';
import './MyBot.css';

const CATEGORIES = [
  { id: 'all',         name: 'All',         icon: '🔍' },
  { id: 'ecommerce',   name: 'E-commerce',  icon: '🛍️' },
  { id: 'support',     name: 'Support',     icon: '🎧' },
  { id: 'sales',       name: 'Sales',       icon: '📈' },
  { id: 'realestate',  name: 'Real Estate', icon: '🏠' },
  { id: 'healthcare',  name: 'Healthcare',  icon: '🏥' },
  { id: 'hr',          name: 'HR',          icon: '👥' },
  { id: 'custom',      name: 'Custom',      icon: '⚙️' },
];

const STATUS_COLOR = {
  active:   '#40e0d0',
  training: '#ffa444',
  paused:   '#ff6b6b',
  draft:    '#9333ea',
};

const getCategoryIcon = (cat) => CATEGORIES.find(c => c.id === cat)?.icon || '🤖';

const MyBot = () => {
  const navigate = useNavigate();

  const [viewMode,      setViewMode]      = useState('grid');
  const [filterStatus,  setFilterStatus]  = useState('all');
  const [searchQuery,   setSearchQuery]   = useState('');
  const [selectedBots,  setSelectedBots]  = useState([]);
  const [bots,          setBots]          = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  // ── Fetch ───────────────────────────────────────────────────────────────────
  useEffect(() => { fetchBots(); }, []);

  const fetchBots = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await botsAPI.getAll();
      setBots(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load bots');
    } finally {
      setLoading(false);
    }
  };

  // ── Single Actions ───────────────────────────────────────────────────────────
  const handleBotAction = async (action, botId) => {
    // edit feature disabled – no navigation
    if (action === 'analytics') { navigate(`/analytics?bot=${botId}`); return; }
    if (action === 'train')     { navigate(`/training?bot=${botId}`); return; }

    if (action === 'delete') {
      if (!window.confirm('Delete this bot? This cannot be undone.')) return;
      setActionLoading(botId);
      try {
        await botsAPI.delete(botId);
        setBots(prev => prev.filter(b => b._id !== botId));
        setSelectedBots(prev => prev.filter(id => id !== botId));
      } catch (err) { alert(err.message || 'Failed to delete bot'); }
      finally { setActionLoading(null); }
      return;
    }

    if (['pause','resume','activate'].includes(action)) {
      const newStatus = action === 'pause' ? 'paused' : 'active';
      setActionLoading(botId);
      try {
        await botsAPI.update(botId, { status: newStatus });
        setBots(prev => prev.map(b => b._id === botId ? { ...b, status: newStatus } : b));
        // if we changed status and the current filter wouldn't show the bot,
        // switch to the matching tab so the user still sees the card
        if (filterStatus !== 'all' && filterStatus !== newStatus) {
          setFilterStatus(newStatus);
        }
      } catch (err) { alert(err.message || `Failed to ${action} bot`); }
      finally { setActionLoading(null); }
      return;
    }

    if (action === 'duplicate') {
      const orig = bots.find(b => b._id === botId);
      if (!orig) return;
      setActionLoading(botId);
      try {
        const res = await botsAPI.create({
          name:        `${orig.name} (Copy)`,
          description: orig.description,
          category:    orig.category,
          language:    orig.language,
          settings:    orig.settings,
          platforms:   orig.platforms,
        });
        setBots(prev => [...prev, res.data]);
      } catch (err) { alert(err.message || 'Failed to duplicate bot'); }
      finally { setActionLoading(null); }
    }
  };

  // ── Bulk Actions ─────────────────────────────────────────────────────────────
  const bulkAction = async (action) => {
    if (action === 'delete') {
      if (!window.confirm(`Delete ${selectedBots.length} bot(s)? This cannot be undone.`)) return;
    }
    try {
      await Promise.all(selectedBots.map(id =>
        action === 'delete'
          ? botsAPI.delete(id)
          : botsAPI.update(id, { status: 'paused' })
      ));
      if (action === 'delete') {
        setBots(prev => prev.filter(b => !selectedBots.includes(b._id)));
      } else {
        setBots(prev => prev.map(b => selectedBots.includes(b._id) ? { ...b, status: 'paused' } : b));
      }
      setSelectedBots([]);
    } catch (err) { alert(err.message || `Bulk ${action} failed`); }
  };

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const toggleSelect = (id) =>
    setSelectedBots(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const filteredBots = bots.filter(bot => {
    if (filterStatus !== 'all' && bot.status !== filterStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return bot.name.toLowerCase().includes(q) ||
             (bot.description || '').toLowerCase().includes(q);
    }
    return true;
  });

  // ── Summary stats ─────────────────────────────────────────────────────────────
  const totalConvs   = bots.reduce((s, b) => s + (b.stats?.totalConversations || 0), 0);
  const activeBots   = bots.filter(b => b.status === 'active').length;
  const avgSat       = bots.length
    ? (bots.reduce((s, b) => s + (b.stats?.satisfactionRate || 0), 0) / bots.length).toFixed(1)
    : 0;

  // ── Loading ───────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:'60vh', color:'#40e0d0', fontSize:'1rem', gap:'10px' }}>
        <span style={{ animation:'spin 1s linear infinite', display:'inline-block' }}>⏳</span>
        Loading bots…
      </div>
    );
  }

  return (
    <div className="my-bots">

      {/* ── Header ── */}
      <div className="bots-header">
        <div>
          <h1>My Bots</h1>
          <p>Manage and monitor all your chatbot assistants</p>
        </div>
        <button className="create-new-btn" onClick={() => navigate('/new-chatbot')}>
          <span className="btn-icon">+</span>
          Create New Bot
        </button>
      </div>

      {/* ── Error ── */}
      {error && (
        <div style={{ background:'rgba(255,68,68,0.08)', border:'1px solid rgba(255,68,68,0.25)', color:'#ff6b6b', padding:'11px 16px', borderRadius:'12px', marginBottom:'1.4rem', fontSize:'0.88rem', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <span>{error}</span>
          <button onClick={fetchBots} style={{ color:'#40e0d0', background:'none', border:'none', cursor:'pointer', fontWeight:600, fontSize:'0.85rem' }}>Retry →</button>
        </div>
      )}

      {/* ── Stats ── */}
      <div className="bots-stats">
        {[
          { value: bots.length,              label: 'Total Bots'         },
          { value: activeBots,               label: 'Active'             },
          { value: totalConvs.toLocaleString(), label: 'Conversations'   },
          { value: `${avgSat}%`,             label: 'Avg. Satisfaction'  },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <span className="stat-value">{s.value}</span>
            <span className="stat-label">{s.label}</span>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div className="bots-filters">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search bots by name or description…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="clear-search" onClick={() => setSearchQuery('')}>✕</button>
          )}
        </div>

        <div className="filter-tabs">
          {['all', 'active', 'training', 'paused', 'draft'].map(s => (
            <button
              key={s}
              className={`filter-tab ${filterStatus === s ? 'active' : ''}`}
              onClick={() => setFilterStatus(s)}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        <div className="view-options">
          <button className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')}>⊞ Grid</button>
          <button className={`view-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')}>☰ List</button>
        </div>
      </div>

      {/* ── Bulk Actions Bar ── */}
      {selectedBots.length > 0 && (
        <div className="bulk-actions">
          <span className="selected-count">{selectedBots.length} selected</span>
          <div className="bulk-buttons">
            <button onClick={() => bulkAction('pause')}>Pause</button>
            <button className="danger" onClick={() => bulkAction('delete')}>Delete</button>
          </div>
          <button className="clear-selection" onClick={() => setSelectedBots([])}>✕</button>
        </div>
      )}

      {/* ── Bots Grid / List ── */}
      {filteredBots.length === 0 ? (
        <div className="no-bots">
          <span className="no-bots-icon">🤖</span>
          <h3>{searchQuery ? 'No bots match your search' : 'No bots yet'}</h3>
          <p>{searchQuery ? 'Try a different search term or clear the filter.' : 'Create your first chatbot to get started.'}</p>
          {!searchQuery && (
            <button className="create-first-btn" onClick={() => navigate('/new-chatbot')}>
              Create Your First Bot
            </button>
          )}
        </div>
      ) : (
        <div className={`bots-container ${viewMode}`}>
          {filteredBots.map(bot => (
            <div
              key={bot._id}
              className={`bot-card ${viewMode}${selectedBots.includes(bot._id) ? ' selected' : ''}${actionLoading === bot._id ? ' loading' : ''}`}
              style={{ '--bot-color': bot.settings?.primaryColor || '#40e0d0' }}
            >
              {/* Checkbox */}
              <div className="bot-select">
                <input
                  type="checkbox"
                  checked={selectedBots.includes(bot._id)}
                  onChange={() => toggleSelect(bot._id)}
                />
              </div>

              {/* Avatar */}
              <div
                className="bot-avatar"
                style={{ backgroundColor: (bot.settings?.primaryColor || '#40e0d0') + '18' }}
              >
                <span className="bot-avatar-icon">{getCategoryIcon(bot.category)}</span>
                <div
                  className="bot-status"
                  style={{ backgroundColor: STATUS_COLOR[bot.status] || '#6464ff', color: STATUS_COLOR[bot.status] || '#6464ff' }}
                  title={bot.status}
                >
                  <span className="status-tooltip">{bot.status}</span>
                </div>
              </div>

              {/* Info */}
              <div className="bot-info">
                <div className="bot-header">
                  <h3 className="bot-name">{bot.name}</h3>
                  <span className="bot-category">
                    {getCategoryIcon(bot.category)} {bot.category}
                  </span>
                </div>

                <p className="bot-description">{bot.description || 'No description provided.'}</p>

                <div className="bot-quick-stats">
                  <div className="stat" title="Conversations">
                    <span className="stat-icon">💬</span>
                    <span>{(bot.stats?.totalConversations || 0).toLocaleString()}</span>
                  </div>
                  <div className="stat" title="Satisfaction">
                    <span className="stat-icon">⭐</span>
                    <span>{bot.stats?.satisfactionRate || 0}%</span>
                  </div>
                  <div className="stat" title="Response Time">
                    <span className="stat-icon">⚡</span>
                    <span>{bot.stats?.avgResponseTime || 0}s</span>
                  </div>
                  <div className="stat" title="Platforms">
                    <span className="stat-icon">🔌</span>
                    <span>{(bot.platforms || []).length}</span>
                  </div>
                </div>

                <div className="bot-meta">
                  <span className="last-active">
                    Created {new Date(bot.createdAt).toLocaleDateString()}
                  </span>
                  <span className={`status-badge status-${bot.status}`}>{bot.status}</span>
                </div>

                {/* Actions */}
                <div className="bot-actions">
                  {/* edit button removed */}
                  <button
                    className="action-btn"
                    onClick={() => handleBotAction('train', bot._id)}
                    title="Train model"
                  >
                    🧠
                  </button>
                  <button
                    className="action-btn"
                    onClick={() => handleBotAction('analytics', bot._id)}
                    title="View analytics"
                  >
                    📊
                  </button>

                  <div className="more-actions">
                    <button className="more-btn" title="More options">⋯</button>
                                    <div className="more-dropdown">
                      <button onClick={() => handleBotAction('duplicate', bot._id)}>
                        📋 Duplicate
                      </button>
                      <button onClick={() => handleBotAction(
                          bot.status === 'paused' ? 'resume' :
                          bot.status === 'draft' ? 'activate' :
                          'pause',
                          bot._id
                        )}
                      >
                        {bot.status === 'paused'
                          ? '▶ Resume'
                          : bot.status === 'draft'
                          ? '▶ Activate'
                          : '⏸ Pause'}
                      </button>
                      <button className="danger" onClick={() => handleBotAction('delete', bot._id)}>
                        🗑 Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {filteredBots.length > 10 && (
        <div className="pagination">
          <button className="page-btn active">1</button>
        </div>
      )}
    </div>
  );
};

export default MyBot;