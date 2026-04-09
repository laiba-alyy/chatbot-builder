// src/pages/UserProfile.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { botsAPI, analyticsAPI } from '../services/api';
import './UserProfile.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const token = () => localStorage.getItem('token');

const UserProfile = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const avatarInputRef = useRef();

  // Password change
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);

  // Real stats
  const [botStats, setBotStats] = useState({ total: 0, active: 0 });
  const [analyticsStats, setAnalyticsStats] = useState({ conversations: 0, satisfaction: 0, apiCalls: 0 });
  const [activity, setActivity] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);

  // Editable form — seeded from auth context
  const [editForm, setEditForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    jobTitle: user?.profile?.jobTitle || '',
    company: user?.profile?.company || '',
    department: user?.profile?.department || '',
    location: user?.profile?.location || '',
    timezone: user?.profile?.timezone || 'America/Los_Angeles',
    language: user?.profile?.language || 'English (US)',
    bio: user?.profile?.bio || '',
    phone: user?.profile?.phone || '',
    website: user?.profile?.website || '',
    github: user?.profile?.github || '',
    twitter: user?.profile?.twitter || '',
    linkedin: user?.profile?.linkedin || '',
  });

  // Static display data
  const badges = [
    { id: 1, name: 'Verified', icon: '✅', color: '#40e0d0' },
    { id: 2, name: user?.subscription?.plan === 'pro' ? 'Pro Member' : 'Free Plan', icon: '⭐', color: '#6464ff' },
  ];

  const achievements = [
    { id: 1, name: 'Bot Builder', description: 'Create 5 bots', icon: '🏆', unlocked: botStats.total >= 5, progress: Math.min((botStats.total / 5) * 100, 100) },
    { id: 2, name: 'Conversation Master', description: 'Handle 10K conversations', icon: '💬', unlocked: analyticsStats.conversations >= 10000, progress: Math.min((analyticsStats.conversations / 10000) * 100, 100) },
    { id: 3, name: 'First Bot', description: 'Create your first bot', icon: '🤖', unlocked: botStats.total >= 1, progress: botStats.total >= 1 ? 100 : 0 },
    { id: 4, name: 'High Satisfaction', description: 'Reach 90% satisfaction', icon: '⭐', unlocked: analyticsStats.satisfaction >= 90, progress: Math.min(analyticsStats.satisfaction, 100) },
  ];

  // ─── Load stats ────────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoadingStats(true);
      try {
        const [botsRes, analyticsRes] = await Promise.allSettled([
          botsAPI.getAll(),
          analyticsAPI.getOverview('?period=30d'),
        ]);

        if (botsRes.status === 'fulfilled') {
          const bots = botsRes.value.data || [];
          setBotStats({ total: bots.length, active: bots.filter(b => b.status === 'active').length });
        }

        if (analyticsRes.status === 'fulfilled') {
          const d = analyticsRes.value.data;
          setAnalyticsStats({
            conversations: d.totalConversations || 0,
            satisfaction: d.satisfactionRate || 0,
            apiCalls: d.apiCalls || 0,
          });
        }
      } catch {}
      finally { setLoadingStats(false); }
    };
    load();
  }, []);

  // ─── Load activity ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (activeTab !== 'activity') return;
    fetch(`${API_URL}/auth/activity`, { headers: { Authorization: `Bearer ${token()}` } })
      .then(r => r.json())
      .then(d => setActivity(d.data || d || []))
      .catch(() => setActivity([]));
  }, [activeTab]);

  // ─── Save profile ──────────────────────────────────────────────────────────
  const handleSave = async () => {
    setIsSaving(true);
    setSaveError('');
    setSaveSuccess(false);
    try {
      const res = await fetch(`${API_URL}/auth/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({
          name: editForm.name,
          profile: {
            jobTitle: editForm.jobTitle,
            company: editForm.company,
            department: editForm.department,
            location: editForm.location,
            timezone: editForm.timezone,
            language: editForm.language,
            bio: editForm.bio,
            phone: editForm.phone,
            website: editForm.website,
            github: editForm.github,
            twitter: editForm.twitter,
            linkedin: editForm.linkedin,
          }
        })
      });
      if (!res.ok) throw new Error((await res.json()).message || 'Save failed');
      setSaveSuccess(true);
      setIsEditing(false);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // ─── Change password ───────────────────────────────────────────────────────
  const handlePasswordChange = async () => {
    setPwError('');
    setPwSuccess(false);
    if (pwForm.newPw !== pwForm.confirm) { setPwError('Passwords do not match'); return; }
    if (pwForm.newPw.length < 6) { setPwError('Password must be at least 6 characters'); return; }
    setPwLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/change-password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ currentPassword: pwForm.current, newPassword: pwForm.newPw })
      });
      if (!res.ok) throw new Error((await res.json()).message || 'Failed');
      setPwSuccess(true);
      setPwForm({ current: '', newPw: '', confirm: '' });
      setTimeout(() => setPwSuccess(false), 3000);
    } catch (err) {
      setPwError(err.message);
    } finally {
      setPwLoading(false);
    }
  };

  // ─── Delete account ────────────────────────────────────────────────────────
  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETE') return;
    try {
      const res = await fetch(`${API_URL}/auth/account`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token()}` }
      });
      if (!res.ok) throw new Error('Failed to delete account');
      logout();
      navigate('/login');
    } catch (err) {
      alert(err.message);
    }
  };

  // ─── Avatar upload ─────────────────────────────────────────────────────────
  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('avatar', file);
    try {
      const res = await fetch(`${API_URL}/auth/avatar`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token()}` },
        body: formData
      });
      if (!res.ok) throw new Error('Upload failed');
      setShowAvatarModal(false);
      // Refresh page to show new avatar from auth context
      window.location.reload();
    } catch (err) {
      alert(err.message);
    }
  };

  const formatDate = (d) => {
    if (!d) return '';
    try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }); }
    catch { return d; }
  };

  const getActivityIcon = (type) => ({
    bot_created: '🤖', bot_trained: '🧠', integration_added: '🔌',
    api_key_generated: '🔑', team_member_added: '👥', plan_upgraded: '🚀',
    login: '🔐', bot_deleted: '🗑️'
  })[type] || '📌';

  const stat = (val) => loadingStats ? '...' : val;

  return (
    <div className="user-profile">
      {/* Cover */}
      <div className="profile-cover">
        <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #0a0a1a 0%, #1a1a3e 50%, #0d1117 100%)' }} />
      </div>

      {/* Profile Header */}
      <div className="profile-header">
        <div className="profile-avatar-section">
          <div className="profile-avatar">
            {user?.avatar
              ? <img src={user.avatar} alt={user.name} />
              : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#40e0d0,#6464ff)', fontSize: '36px', color: '#fff', fontWeight: 700 }}>
                  {(user?.name || 'U')[0].toUpperCase()}
                </div>
            }
            <button className="change-avatar-btn" onClick={() => setShowAvatarModal(true)}>📷</button>
          </div>
          <div className="profile-name-section">
            <h1>{user?.name || 'User'}</h1>
            <p className="profile-username">@{(user?.name || 'user').toLowerCase().replace(/\s+/g, '')}</p>
            <p className="profile-title">
              {editForm.jobTitle || 'No title set'}
              {editForm.company ? ` at ${editForm.company}` : ''}
            </p>
            <div className="profile-badges">
              {badges.map(badge => (
                <span key={badge.id} className="badge" style={{ backgroundColor: badge.color + '20', color: badge.color }}>
                  {badge.icon} {badge.name}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="profile-actions">
          {isEditing ? (
            <>
              <button className="edit-profile-btn" onClick={handleSave} disabled={isSaving}>
                {isSaving ? '⏳ Saving...' : '💾 Save Changes'}
              </button>
              <button className="share-profile-btn" onClick={() => { setIsEditing(false); setSaveError(''); }}>
                ✕ Cancel
              </button>
            </>
          ) : (
            <>
              <button className="edit-profile-btn" onClick={() => setIsEditing(true)}>✎ Edit Profile</button>
            </>
          )}
        </div>
      </div>

      {/* Banners */}
      {saveSuccess && <div style={{ background: 'rgba(64,224,208,0.1)', border: '1px solid rgba(64,224,208,0.3)', color: '#40e0d0', padding: '10px 16px', borderRadius: '8px', marginBottom: '16px' }}>✓ Profile saved</div>}
      {saveError && <div style={{ background: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.3)', color: '#ff6b6b', padding: '10px 16px', borderRadius: '8px', marginBottom: '16px' }}>{saveError}</div>}

      {/* Stats */}
      <div className="profile-stats">
        {[
          ['📅', 'Member Since', user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'N/A'],
          ['🤖', 'Total Bots', stat(botStats.total)],
          ['✅', 'Active Bots', stat(botStats.active)],
          ['💬', 'Conversations', stat(analyticsStats.conversations.toLocaleString())],
          ['⭐', 'Satisfaction', stat(`${analyticsStats.satisfaction}%`)],
          ['🔌', 'API Calls', stat(analyticsStats.apiCalls.toLocaleString())],
        ].map(([icon, label, value]) => (
          <div key={label} className="stat-card">
            <div className="stat-icon">{icon}</div>
            <div className="stat-content">
              <span className="stat-label">{label}</span>
              <span className="stat-value">{value}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="profile-tabs">
        {[
          { id: 'profile', label: '👤 Profile Info' },
          { id: 'activity', label: '📊 Activity' },
          { id: 'achievements', label: '🏆 Achievements' },
          { id: 'security', label: '🛡️ Security' },
        ].map(tab => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="profile-content">

        {/* ── PROFILE INFO ── */}
        {activeTab === 'profile' && (
          <div className="profile-info-tab">
            <div className="info-section">
              <h3>Personal Information</h3>
              <div className="info-grid">
                {[
                  ['Full Name', 'name', 'text'],
                  ['Email Address', 'email', 'email'],
                  ['Phone', 'phone', 'tel'],
                  ['Job Title', 'jobTitle', 'text'],
                  ['Company', 'company', 'text'],
                  ['Department', 'department', 'text'],
                  ['Location', 'location', 'text'],
                ].map(([label, field, type]) => (
                  <div key={field} className="info-item">
                    <span className="info-label">{label}</span>
                    {isEditing ? (
                      <input type={type} name={field} value={editForm[field]} onChange={e => setEditForm(prev => ({ ...prev, [field]: e.target.value }))} className="edit-input" />
                    ) : (
                      <span className="info-value">{editForm[field] || <span style={{ color: 'rgba(255,255,255,0.3)' }}>Not set</span>}</span>
                    )}
                  </div>
                ))}

                <div className="info-item">
                  <span className="info-label">Timezone</span>
                  {isEditing ? (
                    <select name="timezone" value={editForm.timezone} onChange={e => setEditForm(prev => ({ ...prev, timezone: e.target.value }))} className="edit-select">
                      {['America/Los_Angeles','America/Denver','America/Chicago','America/New_York','Europe/London','Asia/Tokyo','Asia/Singapore'].map(tz => (
                        <option key={tz} value={tz}>{tz.replace('_', ' ')}</option>
                      ))}
                    </select>
                  ) : (
                    <span className="info-value">{editForm.timezone}</span>
                  )}
                </div>

                <div className="info-item">
                  <span className="info-label">Language</span>
                  {isEditing ? (
                    <select name="language" value={editForm.language} onChange={e => setEditForm(prev => ({ ...prev, language: e.target.value }))} className="edit-select">
                      {['English (US)','English (UK)','Spanish','French','German','Japanese'].map(l => (
                        <option key={l} value={l}>{l}</option>
                      ))}
                    </select>
                  ) : (
                    <span className="info-value">{editForm.language}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="info-section">
              <h3>Bio</h3>
              {isEditing ? (
                <textarea name="bio" value={editForm.bio} onChange={e => setEditForm(prev => ({ ...prev, bio: e.target.value }))} className="edit-textarea" rows="4" placeholder="Tell others about yourself..." />
              ) : (
                <p className="bio-text">{editForm.bio || <span style={{ color: 'rgba(255,255,255,0.3)' }}>No bio added yet.</span>}</p>
              )}
            </div>

            <div className="info-section">
              <h3>Social Links</h3>
              <div className="social-grid">
                {[
                  ['🌐', 'website', 'Website URL'],
                  ['🐙', 'github', 'GitHub username'],
                  ['🐦', 'twitter', 'Twitter handle'],
                  ['🔗', 'linkedin', 'LinkedIn username'],
                ].map(([icon, field, placeholder]) => (
                  <div key={field} className="social-item">
                    <span className="social-icon">{icon}</span>
                    {isEditing ? (
                      <input type="text" name={field} value={editForm[field]} onChange={e => setEditForm(prev => ({ ...prev, [field]: e.target.value }))} className="edit-input" placeholder={placeholder} />
                    ) : editForm[field] ? (
                      <a href={field === 'website' ? editForm[field] : `https://${field}.com/${editForm[field].replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="social-link">
                        {editForm[field]}
                      </a>
                    ) : (
                      <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>Not set</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── ACTIVITY ── */}
        {activeTab === 'activity' && (
          <div className="activity-tab">
            <div className="activity-timeline">
              {activity.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.3)' }}>
                  No activity recorded yet.
                </div>
              ) : activity.map((item, i) => (
                <div key={item._id || i} className="activity-item">
                  <div className={`activity-icon ${item.status || 'info'}`}>
                    {getActivityIcon(item.type)}
                  </div>
                  <div className="activity-content">
                    <p className="activity-description">{item.description || item.action}</p>
                    <span className="activity-date">{formatDate(item.createdAt || item.date)}</span>
                  </div>
                  <div className={`activity-status ${item.status || ''}`}>
                    {item.status || ''}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── ACHIEVEMENTS ── */}
        {activeTab === 'achievements' && (
          <div className="achievements-tab">
            <div className="achievements-stats">
              <div className="stat">
                <span className="stat-value">{achievements.filter(a => a.unlocked).length}</span>
                <span className="stat-label">Unlocked</span>
              </div>
              <div className="stat">
                <span className="stat-value">{achievements.length}</span>
                <span className="stat-label">Total</span>
              </div>
              <div className="stat">
                <span className="stat-value">{Math.round((achievements.filter(a => a.unlocked).length / achievements.length) * 100)}%</span>
                <span className="stat-label">Completion</span>
              </div>
            </div>

            <div className="achievements-grid">
              {achievements.map(a => (
                <div key={a.id} className={`achievement-card ${a.unlocked ? 'unlocked' : 'locked'}`}>
                  <div className="achievement-icon" style={{ backgroundColor: a.unlocked ? '#40e0d0' : 'rgba(255,255,255,0.05)' }}>
                    {a.icon}
                  </div>
                  <div className="achievement-info">
                    <h4>{a.name}</h4>
                    <p>{a.description}</p>
                    {a.unlocked ? (
                      <span className="achievement-date">✅ Unlocked</span>
                    ) : (
                      <div className="achievement-progress">
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width: `${a.progress}%` }}></div>
                        </div>
                        <span className="progress-text">{Math.round(a.progress)}%</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── SECURITY ── */}
        {activeTab === 'security' && (
          <div className="security-tab">
            <div className="security-section">
              <h3>Change Password</h3>
              <div className="password-form">
                {[
                  ['Current Password', 'current'],
                  ['New Password', 'newPw'],
                  ['Confirm New Password', 'confirm'],
                ].map(([label, field]) => (
                  <div key={field} className="form-group">
                    <label>{label}</label>
                    <input
                      type="password"
                      className="form-input"
                      placeholder={`Enter ${label.toLowerCase()}`}
                      value={pwForm[field]}
                      onChange={e => setPwForm(prev => ({ ...prev, [field]: e.target.value }))}
                    />
                  </div>
                ))}
                {pwError && <div style={{ color: '#ff6b6b', fontSize: '13px', marginBottom: '10px' }}>{pwError}</div>}
                {pwSuccess && <div style={{ color: '#40e0d0', fontSize: '13px', marginBottom: '10px' }}>✓ Password updated</div>}
                <button className="update-password-btn" onClick={handlePasswordChange} disabled={pwLoading}>
                  {pwLoading ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </div>

            <div className="security-section">
              <h3>Two-Factor Authentication</h3>
              <div className="security-setting">
                <div className="setting-info">
                  <h4>Two-Factor Authentication</h4>
                  <p>Add an extra layer of security to your account</p>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>

            <div className="security-section danger">
              <h3>Danger Zone</h3>
              <div className="danger-item">
                <div className="danger-info">
                  <h4>Delete Account</h4>
                  <p>Permanently delete your account and all associated data</p>
                </div>
                <button className="delete-account-btn" onClick={() => setShowDeleteModal(true)}>
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Avatar Modal ── */}
      {showAvatarModal && (
        <div className="avatar-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Change Profile Picture</h2>
              <button className="close-modal" onClick={() => setShowAvatarModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="current-avatar-preview">
                {user?.avatar
                  ? <img src={user.avatar} alt="avatar" />
                  : <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'linear-gradient(135deg,#40e0d0,#6464ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px', color: '#fff', margin: '0 auto' }}>
                      {(user?.name || 'U')[0].toUpperCase()}
                    </div>
                }
              </div>
              <input type="file" ref={avatarInputRef} style={{ display: 'none' }} accept="image/*" onChange={handleAvatarUpload} />
              <div className="upload-options">
                <button className="upload-btn" onClick={() => avatarInputRef.current?.click()}>
                  📤 Upload New Photo
                </button>
              </div>
              <p className="upload-hint">JPG, PNG or GIF. Max 2MB.</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Modal ── */}
      {showDeleteModal && (
        <div className="delete-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Delete Account</h2>
              <button className="close-modal" onClick={() => setShowDeleteModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="warning-icon">⚠️</div>
              <h3>Are you absolutely sure?</h3>
              <p>This will permanently delete your account, all bots, conversations, and data. This cannot be undone.</p>
              <div className="delete-confirm">
                <label>Type "DELETE" to confirm</label>
                <input
                  type="text"
                  className="confirm-input"
                  placeholder="DELETE"
                  value={deleteConfirm}
                  onChange={e => setDeleteConfirm(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setShowDeleteModal(false)}>Cancel</button>
              <button
                className="delete-confirm-btn"
                onClick={handleDeleteAccount}
                disabled={deleteConfirm !== 'DELETE'}
                style={{ opacity: deleteConfirm !== 'DELETE' ? 0.4 : 1 }}
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;