// src/pages/Team.jsx
import React, { useState, useEffect, useRef } from 'react';
import { teamAPI } from '../services/api';
import useAuth from '../hooks/useAuth';
import './Team.css';

const ROLE_PERMISSIONS = {
  owner:  ['full_access','manage_team','manage_billing','manage_bots','manage_integrations','view_analytics','create_bots','edit_bots','delete_bots'],
  admin:  ['manage_team','manage_bots','manage_integrations','view_analytics','create_bots','edit_bots'],
  editor: ['create_bots','edit_bots','view_analytics','view_conversations'],
  viewer: ['view_analytics','view_conversations','view_bots'],
};

const getRoleBadgeClass = (role) => ({ owner:'role-owner', admin:'role-admin', editor:'role-editor', viewer:'role-viewer', pending:'role-pending' })[role] || '';
const getStatusIcon    = (s) => ({ active:'🟢', away:'🟡', offline:'⚪', pending:'⏳' })[s] || '⚪';
const getStatusClass   = (s) => ({ active:'status-active', away:'status-away', offline:'status-offline', pending:'status-pending' })[s] || '';
const getActivityIcon  = (t) => ({ create:'➕', edit:'✏️', integration:'🔌', team:'👥', export:'📊', delete:'🗑️', login:'🔐' })[t] || '📌';

const ROLES = [
  { type:'admin',  name:'Admin',  description:'Administrative access with some restrictions' },
  { type:'editor', name:'Editor', description:'Can create and edit bots, view analytics' },
  { type:'viewer', name:'Viewer', description:'Read-only access to analytics and conversations' },
];

const ALL_PERMISSIONS = [
  { id:'full_access',          name:'Full Access' },
  { id:'manage_team',          name:'Manage Team' },
  { id:'manage_billing',       name:'Manage Billing' },
  { id:'manage_bots',          name:'Manage Bots' },
  { id:'manage_integrations',  name:'Manage Integrations' },
  { id:'view_analytics',       name:'View Analytics' },
  { id:'create_bots',          name:'Create Bots' },
  { id:'edit_bots',            name:'Edit Bots' },
  { id:'delete_bots',          name:'Delete Bots' },
  { id:'view_conversations',   name:'View Conversations' },
  { id:'view_bots',            name:'View Bots' },
];

const Team = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab]         = useState('members');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showRoleModal, setShowRoleModal]     = useState(false);
  const [selectedMember, setSelectedMember]   = useState(null);
  const [searchQuery, setSearchQuery]         = useState('');

  // Data
  const [teamData, setTeamData]     = useState(null);
  const [members, setMembers]       = useState([]);
  const [roles, setRoles]           = useState([]);
  const [activityLog, setActivityLog] = useState([]);
  // settings state removed (no backend support)
  const [loading, setLoading]       = useState(true);

  // Invite form
  const [inviteEmail, setInviteEmail]     = useState('');
  const [inviteRole, setInviteRole]       = useState('editor');
  const [inviteMessage, setInviteMessage] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError]     = useState('');
  const [inviteSuccess, setInviteSuccess] = useState(false);

  // Edit role form
  const [selectedRole, setSelectedRole]   = useState('');
  const [roleLoading, setRoleLoading]     = useState(false);
  const [roleError, setRoleError]         = useState('');

  // Settings form
  // settings form state removed

  // Action loading
  const [actionLoading, setActionLoading] = useState(null);

  // ─── Load team data ───────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [teamRes, rolesRes] = await Promise.allSettled([
          teamAPI.getTeam(),
          teamAPI.getRoles(),
        ]);
        if (teamRes.status === 'fulfilled') {
          const t = teamRes.value.data;
          setTeamData(t);
          setMembers(t.members || []);
        }
        if (rolesRes.status === 'fulfilled') {
          setRoles(rolesRes.value.data || []);
        }
      } catch {}
      finally { setLoading(false); }
    };
    load();
  }, []);

  // Load activity when tab opens
  useEffect(() => {
    if (activeTab !== 'activity') return;
    teamAPI.getActivity()
      .then(res => setActivityLog(res.data?.activities || res.data || []))
      .catch(() => {});
  }, [activeTab]);


  // ─── Invite member ─────────────────────────────────────────────────────────
  const handleInvite = async () => {
    if (!inviteEmail.trim()) { setInviteError('Email is required'); return; }
    setInviteLoading(true);
    setInviteError('');
    try {
      const res = await teamAPI.invite({ email: inviteEmail, role: inviteRole, message: inviteMessage });
      // Optimistically add as pending
      setMembers(prev => [...prev, {
        _id: res.data?._id || Date.now(),
        name: inviteEmail.split('@')[0],
        email: inviteEmail,
        role: inviteRole,
        status: 'pending',
        joinedAt: new Date().toISOString(),
        permissions: ROLE_PERMISSIONS[inviteRole] || [],
      }]);
      setInviteSuccess(true);
      setInviteEmail('');
      setInviteMessage('');
      setTimeout(() => { setInviteSuccess(false); setShowInviteModal(false); }, 2000);
    } catch (err) {
      setInviteError(err.message || 'Failed to send invitation');
    } finally {
      setInviteLoading(false);
    }
  };

  // ─── Update member role ────────────────────────────────────────────────────
  const handleRoleSave = async () => {
    if (!selectedRole || !selectedMember) return;
    setRoleLoading(true);
    setRoleError('');
    try {
      await teamAPI.updateMemberRole(selectedMember._id || selectedMember.id, selectedRole);
      setMembers(prev => prev.map(m =>
        (m._id || m.id) === (selectedMember._id || selectedMember.id)
          ? { ...m, role: selectedRole, permissions: ROLE_PERMISSIONS[selectedRole] || [] }
          : m
      ));
      setShowRoleModal(false);
      setSelectedMember(null);
    } catch (err) {
      setRoleError(err.message || 'Failed to update role');
    } finally {
      setRoleLoading(false);
    }
  };

  // ─── Remove member ─────────────────────────────────────────────────────────
  const handleRemoveMember = async (member) => {
    if (!window.confirm(`Remove ${member.name || member.email} from the team?`)) return;
    const id = member._id || member.id;
    setActionLoading(id);
    try {
      await teamAPI.removeMember(id);
      setMembers(prev => prev.filter(m => (m._id || m.id) !== id));
    } catch (err) {
      alert(err.message || 'Failed to remove member');
    } finally {
      setActionLoading(null);
    }
  };

  // ─── Export activity ───────────────────────────────────────────────────────
  const handleExport = async () => {
    try {
      const res = await teamAPI.exportData();
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'team-activity.json'; a.click();
    } catch (err) {
      alert(err.message || 'Export failed');
    }
  };


  // ─── Helpers ───────────────────────────────────────────────────────────────
  const filteredMembers = members.filter(m => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (m.name || '').toLowerCase().includes(q) || (m.email || '').toLowerCase().includes(q);
  });

  const totalBots    = members.reduce((s, m) => s + (m.bots || m.botCount || 0), 0);
  const twoFACount   = members.filter(m => m.twoFactorEnabled).length;
  const twoFAPct     = members.length ? Math.round((twoFACount / members.length) * 100) : 0;
  const activeCount  = members.filter(m => m.status === 'active').length;
  const pendingCount = members.filter(m => m.status === 'pending').length;

  const openRoleModal = (member) => {
    setSelectedMember(member);
    setSelectedRole(member.role);
    setRoleError('');
    setShowRoleModal(true);
  };

  const initials = (name) => (name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const avatarColors = ['#40e0d0','#6464ff','#9333ea','#ff6b6b','#f59e0b','#10b981'];
  const avatarColor  = (id) => avatarColors[(String(id).charCodeAt(0) || 0) % avatarColors.length];

  return (
    <div className="team">
      {/* Header */}
      <div className="team-header">
        <div>
          <h1>Team Management</h1>
          <p>Manage your team members, roles, and permissions</p>
        </div>
        <button className="invite-btn" onClick={() => { setInviteError(''); setInviteSuccess(false); setShowInviteModal(true); }}>
          <span className="btn-icon">+</span>Invite Member
        </button>
      </div>

      {/* Stats */}
      <div className="team-stats">
        {[
          ['👥', 'Total Members', loading ? '...' : members.length],
          ['🟢', 'Active Members', loading ? '...' : activeCount],
          ['⏳', 'Pending Invites', loading ? '...' : pendingCount],
          ['👑', 'Roles',         roles.length || ROLES.length + 1],
          ['🤖', 'Total Bots',    loading ? '...' : totalBots],
          ['✅', '2FA Enabled',   loading ? '...' : `${twoFAPct}%`],
        ].map(([icon, label, value]) => (
          <div key={label} className="stat-card">
            <div className="stat-icon">{icon}</div>
            <div className="stat-content">
              <span className="stat-value">{value}</span>
              <span className="stat-label">{label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="team-tabs">
        {[
          { id:'members',  label:'👥 Team Members' },
          { id:'roles',    label:'👑 Roles & Permissions' },
          { id:'activity', label:'📋 Activity Log' },
        ].map(tab => (
          <button key={tab.id} className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="tab-content">

        {/* ── MEMBERS ── */}
        {activeTab === 'members' && (
          <div className="members-tab">
            <div className="members-header">
              <div className="search-box">
                <span className="search-icon">🔍</span>
                <input type="text" placeholder="Search by name or email..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                {searchQuery && <button className="clear-search" onClick={() => setSearchQuery('')}>✕</button>}
              </div>
            </div>

            {loading ? (
              <div style={{ textAlign:'center', padding:'40px', color:'rgba(255,255,255,0.4)' }}>Loading members...</div>
            ) : (
              <div className="members-grid">
                {filteredMembers.map(member => {
                  const id = member._id || member.id;
                  const perms = member.permissions || ROLE_PERMISSIONS[member.role] || [];
                  return (
                    <div key={id} className="member-card">
                      <div className="member-card-header">
                        {member.status === 'pending' && (
                          <div className="pending-banner">Invitation pending</div>
                        )}
                        <div className="member-avatar">
                          {member.avatar
                            ? <img src={member.avatar} alt={member.name} />
                            : <div style={{ width:'100%', height:'100%', borderRadius:'50%', background:`linear-gradient(135deg, ${avatarColor(id)}, ${avatarColor(id)}88)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px', fontWeight:700, color:'#fff' }}>
                                {initials(member.name || member.email)}
                              </div>
                          }
                          <div className={`member-status ${getStatusClass(member.status)}`}>
                            {getStatusIcon(member.status)}
                          </div>
                        </div>
                        <div className="member-info">
                          <h3>{member.name || member.email}</h3>
                          <span className="member-email">{member.email}</span>
                        </div>
                      </div>

                      <div className="member-badges">
                        <span className={`role-badge ${getRoleBadgeClass(member.role)}`}>{member.role}</span>
                        {member.twoFactorEnabled && <span className="badge-2fa" title="2FA Enabled">🔒</span>}
                      </div>

                      <div className="member-stats">
                        <div className="stat">
                          <span className="stat-label">Bots</span>
                          <span className="stat-value">{member.bots || member.botCount || 0}</span>
                        </div>
                        <div className="stat">
                          <span className="stat-label">Joined</span>
                          <span className="stat-value">{member.joinedAt?.slice(0,10) || member.createdAt?.slice(0,10) || '-'}</span>
                        </div>
                        <div className="stat">
                          <span className="stat-label">Last Active</span>
                          <span className="stat-value">{member.lastActive || (member.status === 'pending' ? 'Never' : '-')}</span>
                        </div>
                      </div>

                      <div className="member-permissions">
                        <h4>Permissions</h4>
                        <div className="permission-tags">
                          {perms.slice(0, 3).map(p => (
                            <span key={p} className="permission-tag">{p.replace(/_/g,' ')}</span>
                          ))}
                          {perms.length > 3 && <span className="permission-tag more">+{perms.length - 3}</span>}
                        </div>
                      </div>

                      <div className="member-actions">
                        {member.role !== 'owner' && (
                          <>
                            <button className="action-btn edit" onClick={() => openRoleModal(member)}>Edit Role</button>
                            <button
                              className="action-btn remove"
                              onClick={() => handleRemoveMember(member)}
                              disabled={actionLoading === id}
                            >
                              {actionLoading === id ? '...' : 'Remove'}
                            </button>
                          </>
                        )}
                        {member.role === 'owner' && (
                          <span style={{ fontSize:'12px', color:'rgba(255,255,255,0.3)', padding:'6px 0' }}>Account owner</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── ROLES ── */}
        {activeTab === 'roles' && (
          <div className="roles-tab">
            <div className="roles-header">
              <h3>Roles & Permissions</h3>
            </div>

            <div className="roles-grid">
              {/* Build role cards from static definitions enriched with real member counts */}
              {['owner', 'admin', 'editor', 'viewer'].map(roleType => {
                const def = ROLES.find(r => r.type === roleType) || { name: 'Owner', description: 'Full access to all features', type: 'owner' };
                const memberCount = members.filter(m => m.role === roleType).length;
                const perms = ALL_PERMISSIONS.map(p => ({
                  ...p,
                  enabled: (ROLE_PERMISSIONS[roleType] || []).includes(p.id),
                }));
                return (
                  <div key={roleType} className="role-card">
                    <div className="role-card-header">
                      <div>
                        <h4>{roleType.charAt(0).toUpperCase() + roleType.slice(1)}</h4>
                        <span className="role-members">{memberCount} member{memberCount !== 1 ? 's' : ''}</span>
                      </div>
                      <span className={`role-type-badge ${roleType}`}>{roleType}</span>
                    </div>
                    <p className="role-description">{def.description || ''}</p>
                    <div className="role-permissions">
                      <h5>Permissions</h5>
                      <div className="permissions-list">
                        {perms.map(p => (
                          <div key={p.id} className="permission-item">
                            <span className={`permission-toggle ${p.enabled ? 'enabled' : 'disabled'}`}>{p.enabled ? '✓' : '✕'}</span>
                            <span className="permission-name">{p.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="permissions-info">
              <h4>Permission Descriptions</h4>
              <div className="info-grid">
                {[
                  ['Full Access',          'Complete control over all features and settings'],
                  ['Manage Team',          'Add/remove members, modify roles'],
                  ['Manage Billing',       'View and modify subscription, payment methods'],
                  ['Manage Bots',          'Create, edit, delete, and train bots'],
                  ['Manage Integrations',  'Connect and manage third-party integrations'],
                  ['View Analytics',       'Access all analytics and reports'],
                ].map(([term, desc]) => (
                  <div key={term} className="info-item">
                    <span className="info-term">{term}</span>
                    <span className="info-desc">{desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── ACTIVITY ── */}
        {activeTab === 'activity' && (
          <div className="activity-tab">
            <div className="activity-header">
              <h3>Team Activity Log</h3>
              <div className="activity-filters">
                <button className="export-log-btn" onClick={handleExport}>
                  <span className="btn-icon">📥</span>Export
                </button>
              </div>
            </div>

            {activityLog.length === 0 ? (
              <div style={{ textAlign:'center', padding:'40px', color:'rgba(255,255,255,0.3)' }}>No activity recorded yet.</div>
            ) : (
              <div className="activity-timeline">
                {activityLog.map((item, i) => (
                  <div key={item._id || i} className="activity-item">
                    <div className={`activity-icon ${item.type || ''}`}>
                      {getActivityIcon(item.type)}
                    </div>
                    <div className="activity-content">
                      <div className="activity-header">
                        <span className="activity-user">{item.user?.name || item.user || 'Unknown'}</span>
                        <span className="activity-time">
                          {item.createdAt ? new Date(item.createdAt).toLocaleString() : item.time || ''}
                        </span>
                      </div>
                      <p className="activity-action">{item.action || item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── SETTINGS ── */}
        {activeTab === 'settings' && (
          <div className="settings-tab">
            <div className="settings-section">
              <h3>General Settings</h3>
              <div className="settings-form">
                <div className="form-group">
                  <label>Team Name</label>
                  <input type="text" className="form-input" value={settingsForm.teamName || ''} onChange={e => setSettingsForm(p => ({ ...p, teamName: e.target.value }))} placeholder="Your team name" />
                </div>
                <div className="form-group">
                  <label>Team Email</label>
                  <input type="email" className="form-input" value={settingsForm.teamEmail || ''} onChange={e => setSettingsForm(p => ({ ...p, teamEmail: e.target.value }))} placeholder="team@company.com" />
                </div>
                <div className="form-group">
                  <label>Default Role for New Members</label>
                  <select className="form-select" value={settingsForm.defaultRole || 'viewer'} onChange={e => setSettingsForm(p => ({ ...p, defaultRole: e.target.value }))}>
                    <option value="viewer">Viewer</option>
                    <option value="editor">Editor</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="settings-section">
              <h3>Security Settings</h3>
              <div className="settings-form">
                {[
                  ['require2FA', 'Require Two-Factor Authentication', 'All team members must enable 2FA'],
                  ['ipWhitelist', 'IP Whitelisting', 'Restrict access to specific IP addresses'],
                ].map(([key, title, desc]) => (
                  <div key={key} className="toggle-item">
                    <div className="toggle-info"><h4>{title}</h4><p>{desc}</p></div>
                    <label className="toggle-switch">
                      <input type="checkbox" checked={!!settingsForm[key]} onChange={e => setSettingsForm(p => ({ ...p, [key]: e.target.checked }))} />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                ))}
                <div className="toggle-item">
                  <div className="toggle-info"><h4>Session Timeout</h4><p>Auto logout inactive members</p></div>
                  <select className="timeout-select" value={settingsForm.sessionTimeout || '60'} onChange={e => setSettingsForm(p => ({ ...p, sessionTimeout: e.target.value }))}>
                    <option value="30">30 minutes</option>
                    <option value="60">1 hour</option>
                    <option value="120">2 hours</option>
                    <option value="240">4 hours</option>
                    <option value="480">8 hours</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="settings-section">
              <h3>Notification Settings</h3>
              <div className="settings-form">
                <div className="toggle-item">
                  <div className="toggle-info"><h4>Email Notifications</h4><p>Receive email alerts for team activities</p></div>
                  <label className="toggle-switch">
                    <input type="checkbox" checked={!!settingsForm.emailNotifications} onChange={e => setSettingsForm(p => ({ ...p, emailNotifications: e.target.checked }))} />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
                <div className="checkbox-group">
                  {[
                    ['notifyNewMember',     'New member joined'],
                    ['notifyRoleChange',    'Role changes'],
                    ['notifySecurityAlert', 'Security alerts'],
                    ['notifyWeeklySummary', 'Weekly summary'],
                  ].map(([key, label]) => (
                    <label key={key} className="checkbox-label">
                      <input type="checkbox" checked={!!settingsForm[key]} onChange={e => setSettingsForm(p => ({ ...p, [key]: e.target.checked }))} />
                      <span className="checkbox-text">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {settingsSuccess && <div style={{ color:'#40e0d0', background:'rgba(64,224,208,0.1)', border:'1px solid rgba(64,224,208,0.3)', padding:'10px 16px', borderRadius:'8px', marginBottom:'16px' }}>✓ Settings saved</div>}

            <div className="settings-actions">
              <button className="save-settings-btn" onClick={handleSaveSettings} disabled={settingsSaving}>
                {settingsSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Invite Modal ── */}
      {showInviteModal && (
        <div className="invite-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Invite Team Member</h2>
              <button className="close-modal" onClick={() => setShowInviteModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="invite-form">
                <div className="form-group">
                  <label>Email Address <span style={{ color:'#ff6b6b' }}>*</span></label>
                  <input type="email" placeholder="colleague@company.com" className="form-input" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Role</label>
                  <select className="form-select" value={inviteRole} onChange={e => setInviteRole(e.target.value)}>
                    <option value="editor">Editor</option>
                    <option value="admin">Admin</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Message (Optional)</label>
                  <textarea placeholder="Add a personal message..." className="form-textarea" rows="3" value={inviteMessage} onChange={e => setInviteMessage(e.target.value)} />
                </div>
                <div className="permissions-summary">
                  <h4>This user will have:</h4>
                  <ul>
                    {(ROLE_PERMISSIONS[inviteRole] || []).map(p => (
                      <li key={p}>✓ {p.replace(/_/g,' ')}</li>
                    ))}
                  </ul>
                </div>

                {inviteError   && <div style={{ color:'#ff6b6b', fontSize:'13px', marginTop:'10px' }}>{inviteError}</div>}
                {inviteSuccess && <div style={{ color:'#40e0d0', fontSize:'13px', marginTop:'10px' }}>✓ Invitation sent!</div>}
              </div>
            </div>
            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setShowInviteModal(false)}>Cancel</button>
              <button className="send-invite-btn" onClick={handleInvite} disabled={inviteLoading}>
                {inviteLoading ? '⏳ Sending...' : '✉️ Send Invitation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Role Modal ── */}
      {showRoleModal && selectedMember && (
        <div className="role-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Edit Member Role</h2>
              <button className="close-modal" onClick={() => { setShowRoleModal(false); setSelectedMember(null); }}>✕</button>
            </div>
            <div className="modal-body">
              <div className="member-info-compact">
                {selectedMember.avatar
                  ? <img src={selectedMember.avatar} alt={selectedMember.name} style={{ width:48, height:48, borderRadius:'50%' }} />
                  : <div style={{ width:48, height:48, borderRadius:'50%', background:'linear-gradient(135deg,#40e0d0,#6464ff)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, color:'#fff', fontSize:'16px' }}>
                      {initials(selectedMember.name || selectedMember.email)}
                    </div>
                }
                <div>
                  <h3>{selectedMember.name || selectedMember.email}</h3>
                  <span>{selectedMember.email}</span>
                </div>
              </div>

              <div className="role-selector">
                <h4>Select Role</h4>
                {ROLES.map(role => (
                  <label key={role.type} className="role-option">
                    <input type="radio" name="role" value={role.type} checked={selectedRole === role.type} onChange={() => setSelectedRole(role.type)} />
                    <div className="role-info">
                      <span className="role-name">{role.name}</span>
                      <span className="role-desc">{role.description}</span>
                    </div>
                  </label>
                ))}
              </div>

              {roleError && <div style={{ color:'#ff6b6b', fontSize:'13px', marginTop:'10px' }}>{roleError}</div>}
            </div>
            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => { setShowRoleModal(false); setSelectedMember(null); }}>Cancel</button>
              <button className="save-role-btn" onClick={handleRoleSave} disabled={roleLoading}>
                {roleLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Team;