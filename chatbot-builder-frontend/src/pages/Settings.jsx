// src/pages/Settings.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { apiKeysAPI, billingAPI, teamAPI } from '../services/api';
import './Settings.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const token = () => localStorage.getItem('token');

const authFetch = (path, opts = {}) =>
  fetch(`${API_URL}${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}`, ...(opts.headers || {}) },
  });

const pwStrength = (pw) => {
  if (!pw) return { pct: 0, label: '', color: '' };
  let score = 0;
  if (pw.length >= 8)  score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const map = [
    { pct: 20,  label: 'Very Weak', color: '#ff4444' },
    { pct: 40,  label: 'Weak',      color: '#ff6b6b' },
    { pct: 60,  label: 'Fair',      color: '#f59e0b' },
    { pct: 80,  label: 'Strong',    color: '#40e0d0' },
    { pct: 100, label: 'Very Strong', color: '#10b981' },
  ];
  return map[Math.min(score, 4)];
};

const Settings = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const avatarInputRef = useRef();

  const [activeTab, setActiveTab] = useState('account');
  const [showDeleteModal, setShowDeleteModal]   = useState(false);
  const [deleteConfirm, setDeleteConfirm]       = useState('');
  const [showApiModal, setShowApiModal]         = useState(false);
  const [successMsg, setSuccessMsg]             = useState('');
  const [errorMsg, setErrorMsg]                 = useState('');

  // ── Profile form ───────────────────────────────────────────────────────────
  const [profileForm, setProfileForm] = useState({
    name:       user?.name       || '',
    email:      user?.email      || '',
    company:    user?.profile?.company  || '',
    jobTitle:   user?.profile?.jobTitle || '',
    phone:      user?.profile?.phone    || '',
    timezone:   user?.profile?.timezone || 'America/New_York',
    language:   user?.profile?.language || 'en',
    bio:        user?.profile?.bio      || '',
  });
  const [profileSaving, setProfileSaving] = useState(false);

  // ── Password form ──────────────────────────────────────────────────────────
  const [passwordForm, setPasswordForm] = useState({ currentPassword:'', newPassword:'', confirmPassword:'' });
  const [pwLoading, setPwLoading]       = useState(false);
  const [pwError, setPwError]           = useState('');
  const [pwSuccess, setPwSuccess]       = useState(false);
  const strength = pwStrength(passwordForm.newPassword);

  // ── Notifications ──────────────────────────────────────────────────────────
  const [notifications, setNotifications] = useState({
    emailNotifications: true, marketingEmails: false, securityAlerts: true,
    weeklyReports: true, newFeatureAnnouncements: true, botActivity: true,
    teamActivity: true, billingAlerts: true,
  });
  const [notifSaving, setNotifSaving] = useState(false);

  // ── Privacy ────────────────────────────────────────────────────────────────
  const [privacy, setPrivacy] = useState({
    profileVisibility: 'public', showEmail: false, showActivity: true,
    dataCollection: true, cookieConsent: true, analyticsTracking: true,
  });
  const [privacySaving, setPrivacySaving] = useState(false);

  // ── Appearance ─────────────────────────────────────────────────────────────
  const [appearance, setAppearance] = useState({
    theme: localStorage.getItem('theme') || 'dark',
    compactMode: false, fontSize: 'medium', animations: true,
  });

  // ── API keys ───────────────────────────────────────────────────────────────
  const [apiKeys, setApiKeys]               = useState([]);
  const [apiKeysLoading, setApiKeysLoading] = useState(false);
  const [newKeyName, setNewKeyName]         = useState('');
  const [newKeyPerms, setNewKeyPerms]       = useState(['read']);
  const [newKeyExpiry, setNewKeyExpiry]     = useState('');
  const [generatedKey, setGeneratedKey]     = useState(null);
  const [keyLoading, setKeyLoading]         = useState(false);

  // ── Billing ────────────────────────────────────────────────────────────────
  const [billing, setBilling]               = useState(null);
  const [invoices, setInvoices]             = useState([]);
  const [billingLoading, setBillingLoading] = useState(false);

  // ── Team ───────────────────────────────────────────────────────────────────
  const [teamForm, setTeamForm] = useState({ teamName:'', teamEmail:'', defaultRole:'viewer', require2FA:false, ipWhitelisting:false, sessionTimeout:'60' });
  const [teamSaving, setTeamSaving] = useState(false);

  // ── Load data per tab ──────────────────────────────────────────────────────
  useEffect(() => {
    if (activeTab === 'api') {
      setApiKeysLoading(true);
      apiKeysAPI.getAll().then(r => setApiKeys(r.data || [])).catch(() => {}).finally(() => setApiKeysLoading(false));
    }
    if (activeTab === 'billing') {
      setBillingLoading(true);
      Promise.allSettled([billingAPI.getSubscription(), billingAPI.getInvoices()])
        .then(([subRes, invRes]) => {
          if (subRes.status === 'fulfilled') setBilling(subRes.value.data);
          if (invRes.status === 'fulfilled') setInvoices(invRes.value.data?.invoices || invRes.value.data || []);
        })
        .finally(() => setBillingLoading(false));
    }
    if (activeTab === 'team') {
      teamAPI.getTeam().then(r => {
        const t = r.data?.team || {};
        const s = t.settings || {};
        setTeamForm({
          teamName: t.name || '', teamEmail: t.email || '',
          defaultRole: s.defaultRole || 'viewer', require2FA: !!s.require2FA,
          ipWhitelisting: !!s.ipWhitelisting, sessionTimeout: s.sessionTimeout || '60'
        });
      }).catch(() => {});
    }
    if (activeTab === 'privacy') {
      authFetch('/auth/settings/privacy').then(r => r.json()).then(d => { if (d.data) setPrivacy(p => ({ ...p, ...d.data })); }).catch(() => {});
    }
  }, [activeTab]);

  // ── Apply theme ────────────────────────────────────────────────────────────
  useEffect(() => {
    document.documentElement.classList.remove('theme-dark','theme-light','theme-system');
    document.documentElement.classList.add(appearance.theme === 'system' ? 'theme-system' : `theme-${appearance.theme}`);
    localStorage.setItem('theme', appearance.theme);
  }, [appearance.theme]);

  const flash = (msg, isError = false) => {
    if (isError) setErrorMsg(msg); else setSuccessMsg(msg);
    setTimeout(() => { setSuccessMsg(''); setErrorMsg(''); }, 3500);
  };

  // ── Handlers ───────────────────────────────────────────────────────────────
  const saveProfile = async () => {
    setProfileSaving(true);
    try {
      const res = await authFetch('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({ name: profileForm.name, profile: { company: profileForm.company, jobTitle: profileForm.jobTitle, phone: profileForm.phone, timezone: profileForm.timezone, language: profileForm.language, bio: profileForm.bio } }),
      });
      if (!res.ok) throw new Error((await res.json()).message || 'Save failed');
      flash('Profile saved successfully');
    } catch (e) { flash(e.message, true); }
    finally { setProfileSaving(false); }
  };

  const changePassword = async () => {
    setPwError(''); setPwSuccess(false);
    if (passwordForm.newPassword !== passwordForm.confirmPassword) { setPwError('Passwords do not match'); return; }
    if (passwordForm.newPassword.length < 6) { setPwError('Min 6 characters'); return; }
    setPwLoading(true);
    try {
      const res = await authFetch('/auth/change-password', { method:'PUT', body: JSON.stringify({ currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword }) });
      if (!res.ok) throw new Error((await res.json()).message || 'Failed');
      setPwSuccess(true);
      setPasswordForm({ currentPassword:'', newPassword:'', confirmPassword:'' });
      setTimeout(() => setPwSuccess(false), 3000);
    } catch (e) { setPwError(e.message); }
    finally { setPwLoading(false); }
  };

  const saveNotifications = async () => {
    setNotifSaving(true);
    flash('Notification preferences saved (locally)');
    setTimeout(() => setNotifSaving(false), 500);
  };

  const savePrivacy = async () => {
    setPrivacySaving(true);
    try {
      await authFetch('/auth/settings/privacy', { method:'PUT', body: JSON.stringify(privacy) });
      flash('Privacy settings saved');
    } catch (e) { flash(e.message, true); }
    finally { setPrivacySaving(false); }
  };

  const generateKey = async () => {
    if (!newKeyName.trim()) { alert('Enter a key name'); return; }
    setKeyLoading(true);
    try {
      const res = await apiKeysAPI.create({ name: newKeyName, permissions: newKeyPerms, expiresIn: newKeyExpiry || null });
      setGeneratedKey(res.data);
      setApiKeys(prev => [...prev, res.data]);
      setNewKeyName(''); setNewKeyPerms(['read']); setNewKeyExpiry('');
    } catch (e) { alert(e.message || 'Failed'); }
    finally { setKeyLoading(false); }
  };

  const revokeKey = async (id) => {
    if (!window.confirm('Revoke this key? Apps using it will stop working.')) return;
    try { await apiKeysAPI.delete(id); setApiKeys(prev => prev.filter(k => k._id !== id)); }
    catch (e) { alert(e.message); }
  };

  const deleteAccount = async () => {
    if (deleteConfirm !== 'DELETE') return;
    try {
      const res = await authFetch('/auth/account', { method:'DELETE' });
      if (!res.ok) throw new Error('Failed');
      logout(); navigate('/login');
    } catch (e) { alert(e.message); }
  };

  const uploadAvatar = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    const fd = new FormData(); fd.append('avatar', file);
    try {
      const res = await fetch(`${API_URL}/auth/avatar`, { method:'POST', headers:{ Authorization:`Bearer ${token()}` }, body:fd });
      if (!res.ok) throw new Error('Upload failed');
      flash('Avatar updated'); window.location.reload();
    } catch (err) { alert(err.message); }
  };

  const saveTeam = async () => {
    setTeamSaving(true);
    try {
      await teamAPI.updateSettings({ teamName: teamForm.teamName, teamEmail: teamForm.teamEmail, defaultRole: teamForm.defaultRole, require2FA: teamForm.require2FA, ipWhitelist: teamForm.ipWhitelisting, sessionTimeout: teamForm.sessionTimeout });
      flash('Team settings saved');
    } catch (e) { flash(e.message, true); }
    finally { setTeamSaving(false); }
  };

  const exportData = async () => {
    try {
      const res = await authFetch('/auth/export');
      const blob = new Blob([JSON.stringify(await res.json(), null, 2)], { type:'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'my-data.json'; a.click();
    } catch (e) { alert('Export failed: ' + e.message); }
  };

  // ── ✅ Logout handler ──────────────────────────────────────────────────────
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { id:'account',       icon:'👤', label:'Account' },
    { id:'profile',       icon:'📋', label:'Profile' },
    { id:'notifications', icon:'🔔', label:'Notifications' },
    { id:'api',           icon:'🔑', label:'API Keys' },
    { id:'billing',       icon:'💰', label:'Billing' },
    { id:'team',          icon:'👥', label:'Team' },
    { id:'appearance',    icon:'🎨', label:'Appearance' },
    { id:'privacy',       icon:'🔒', label:'Privacy' },
    { id:'security',      icon:'🛡️', label:'Security' },
  ];

  const featuresList = (() => {
    const f = billing?.features;
    if (Array.isArray(f)) return f;
    if (f && typeof f === 'object') {
      return Object.entries(f).map(([k,v]) => {
        const label = k.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ');
        if (typeof v === 'boolean') return `${label}${v ? '' : ' (no)'}`;
        return `${label}: ${v}`;
      });
    }
    return ['Basic features','Community support'];
  })();

  const Toggle = ({ checked, onChange, disabled }) => (
    <label className="toggle-switch">
      <input type="checkbox" checked={checked} onChange={onChange} disabled={disabled} />
      <span className="toggle-slider"></span>
    </label>
  );

  return (
    <div className="settings">

      {/* ✅ UPDATED HEADER — with logout button */}
      <div className="settings-header">
        <div>
          <h1>Settings</h1>
          <p>Manage your account, preferences, and configurations</p>
        </div>
        <button
          onClick={handleLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            background: 'rgba(255, 68, 68, 0.1)',
            border: '1px solid rgba(255, 68, 68, 0.3)',
            borderRadius: '8px',
            color: '#ff6b6b',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
          }}
        >
          🚪 Logout
        </button>
      </div>

      {successMsg && <div className="success-message"><span className="success-icon">✓</span> {successMsg}</div>}
      {errorMsg   && <div className="success-message" style={{ background:'rgba(255,68,68,0.1)', border:'1px solid rgba(255,68,68,0.3)', color:'#ff6b6b' }}>⚠️ {errorMsg}</div>}

      <div className="settings-nav">
        {navItems.map(n => (
          <button key={n.id} className={`nav-btn ${activeTab === n.id ? 'active' : ''}`} onClick={() => setActiveTab(n.id)}>
            <span className="nav-icon">{n.icon}</span>{n.label}
          </button>
        ))}
      </div>

      <div className="settings-content">

        {/* ── ACCOUNT ── */}
        {activeTab === 'account' && (
          <div className="settings-section">
            <h2>Account Settings</h2>
            <div className="settings-card">
              <h3>Account Information</h3>
              <div className="settings-form">
                <div className="form-group">
                  <label>Email Address</label>
                  <input type="email" value={profileForm.email} onChange={e => setProfileForm(p=>({...p,email:e.target.value}))} className="form-input" />
                  <p className="input-hint">Used for login and notifications</p>
                </div>
                <div className="form-group">
                  <label>Account Created</label>
                  <input type="text" value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'}) : '-'} className="form-input" disabled />
                </div>
                <div className="form-group">
                  <label>Account Status</label>
                  <div className="status-badge active"><span className="status-dot"></span>Active</div>
                </div>
              </div>
            </div>

            <div className="settings-card">
              <h3>Change Password</h3>
              <div className="settings-form">
                {[['currentPassword','Current Password'],['newPassword','New Password'],['confirmPassword','Confirm New Password']].map(([k,lbl]) => (
                  <div key={k} className="form-group">
                    <label>{lbl}</label>
                    <input type="password" name={k} value={passwordForm[k]} onChange={e => setPasswordForm(p=>({...p,[k]:e.target.value}))} className="form-input" placeholder={`Enter ${lbl.toLowerCase()}`} />
                    {k === 'newPassword' && passwordForm.newPassword && (
                      <div className="password-strength">
                        <div className="strength-bar"><div className="strength-fill" style={{ width:`${strength.pct}%`, background:strength.color }}></div></div>
                        <span className="strength-text" style={{ color:strength.color }}>{strength.label}</span>
                      </div>
                    )}
                  </div>
                ))}
                {pwError  && <p style={{ color:'#ff6b6b', fontSize:'13px' }}>{pwError}</p>}
                {pwSuccess && <p style={{ color:'#40e0d0', fontSize:'13px' }}>✓ Password updated</p>}
                <button className="update-password-btn" onClick={changePassword} disabled={pwLoading}>
                  {pwLoading ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </div>

            <div className="settings-card danger-zone">
              <h3>Danger Zone</h3>
              <div className="danger-actions">

                {/* ✅ NEW — Sign Out option in danger zone */}
                <div className="danger-item">
                  <div className="danger-info">
                    <h4>Sign Out</h4>
                    <p>Sign out of your account on this device</p>
                  </div>
                  <button
                    className="danger-btn"
                    onClick={handleLogout}
                    style={{ background: 'rgba(255,164,68,0.1)', borderColor: 'rgba(255,164,68,0.3)', color: '#ffa444' }}
                  >
                    🚪 Sign Out
                  </button>
                </div>

                <div className="danger-item">
                  <div className="danger-info"><h4>Delete Account</h4><p>Permanently delete your account and all associated data. This cannot be undone.</p></div>
                  <button className="danger-btn delete" onClick={() => { setDeleteConfirm(''); setShowDeleteModal(true); }}>Delete Account</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── PROFILE ── */}
        {activeTab === 'profile' && (
          <div className="settings-section">
            <h2>Profile Settings</h2>
            <div className="settings-card">
              <h3>Profile Picture</h3>
              <div className="avatar-upload">
                <div className="current-avatar">
                  {user?.avatar
                    ? <img src={user.avatar} alt="Profile" />
                    : <div style={{ width:80, height:80, borderRadius:'50%', background:'linear-gradient(135deg,#40e0d0,#6464ff)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'28px', fontWeight:700, color:'#fff' }}>
                        {(user?.name||'U')[0].toUpperCase()}
                      </div>
                  }
                </div>
                <div className="avatar-actions">
                  <input type="file" ref={avatarInputRef} style={{ display:'none' }} accept="image/*" onChange={uploadAvatar} />
                  <button className="upload-avatar-btn" onClick={() => avatarInputRef.current?.click()}>Upload New Photo</button>
                  <p className="avatar-hint">JPG, PNG or GIF. Max 2MB.</p>
                </div>
              </div>
            </div>

            <div className="settings-card">
              <h3>Personal Information</h3>
              <div className="settings-form">
                <div className="form-row">
                  <div className="form-group half"><label>Full Name</label><input type="text" value={profileForm.name} onChange={e=>setProfileForm(p=>({...p,name:e.target.value}))} className="form-input" /></div>
                  <div className="form-group half"><label>Job Title</label><input type="text" value={profileForm.jobTitle} onChange={e=>setProfileForm(p=>({...p,jobTitle:e.target.value}))} className="form-input" /></div>
                </div>
                <div className="form-row">
                  <div className="form-group half"><label>Company</label><input type="text" value={profileForm.company} onChange={e=>setProfileForm(p=>({...p,company:e.target.value}))} className="form-input" /></div>
                  <div className="form-group half"><label>Phone Number</label><input type="tel" value={profileForm.phone} onChange={e=>setProfileForm(p=>({...p,phone:e.target.value}))} className="form-input" /></div>
                </div>
                <div className="form-row">
                  <div className="form-group half">
                    <label>Timezone</label>
                    <select value={profileForm.timezone} onChange={e=>setProfileForm(p=>({...p,timezone:e.target.value}))} className="form-select">
                      {['America/New_York','America/Chicago','America/Denver','America/Los_Angeles','Europe/London','Europe/Paris','Asia/Tokyo','Asia/Singapore'].map(tz=><option key={tz} value={tz}>{tz.replace('_',' ')}</option>)}
                    </select>
                  </div>
                  <div className="form-group half">
                    <label>Language</label>
                    <select value={profileForm.language} onChange={e=>setProfileForm(p=>({...p,language:e.target.value}))} className="form-select">
                      {[['en','English'],['es','Spanish'],['fr','French'],['de','German'],['ja','Japanese']].map(([v,l])=><option key={v} value={v}>{l}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group"><label>Bio</label><textarea value={profileForm.bio} onChange={e=>setProfileForm(p=>({...p,bio:e.target.value}))} className="form-textarea" rows="4" placeholder="Tell us a little about yourself" /></div>
              </div>
              <div style={{ marginTop:'16px', display:'flex', justifyContent:'flex-end' }}>
                <button className="save-all-btn" onClick={saveProfile} disabled={profileSaving}>
                  {profileSaving ? '⏳ Saving...' : '💾 Save Profile'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── NOTIFICATIONS ── */}
        {activeTab === 'notifications' && (
          <div className="settings-section">
            <h2>Notification Settings</h2>
            {[
              { title:'Email Notifications', items:[['emailNotifications','Email Notifications','Receive notifications via email'],['marketingEmails','Marketing Emails','Receive product updates and offers'],['securityAlerts','Security Alerts','Get notified about security events'],['weeklyReports','Weekly Reports','Receive weekly analytics summary']] },
              { title:'In-App Notifications', items:[['botActivity','Bot Activity','Notifications about bot conversations'],['teamActivity','Team Activity','Team member actions and updates'],['billingAlerts','Billing Alerts','Payment and subscription updates'],['newFeatureAnnouncements','New Features','Product updates and announcements']] },
            ].map(group => (
              <div key={group.title} className="settings-card">
                <h3>{group.title}</h3>
                <div className="notifications-list">
                  {group.items.map(([key,h4,p]) => (
                    <div key={key} className="notification-item">
                      <div className="notification-info"><h4>{h4}</h4><p>{p}</p></div>
                      <Toggle checked={notifications[key]} onChange={() => setNotifications(n=>({...n,[key]:!n[key]}))} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <div style={{ display:'flex', justifyContent:'flex-end' }}>
              <button className="save-all-btn" onClick={saveNotifications} disabled={notifSaving}>
                {notifSaving ? '⏳ Saving...' : '💾 Save Notifications'}
              </button>
            </div>
          </div>
        )}

        {/* ── API KEYS ── */}
        {activeTab === 'api' && (
          <div className="settings-section">
            <div className="section-header">
              <h2>API Keys</h2>
              <button className="generate-key-btn" onClick={() => { setGeneratedKey(null); setShowApiModal(true); }}>
                <span className="btn-icon">+</span>Generate New Key
              </button>
            </div>
            {apiKeysLoading ? (
              <div style={{ textAlign:'center', padding:'30px', color:'rgba(255,255,255,0.4)' }}>Loading keys...</div>
            ) : (
              <div className="api-keys-list">
                {apiKeys.length === 0 && <div style={{ textAlign:'center', padding:'30px', color:'rgba(255,255,255,0.3)' }}>No API keys yet.</div>}
                {apiKeys.map(key => (
                  <div key={key._id} className="api-key-card">
                    <div className="api-key-header">
                      <div>
                        <h3>{key.name}</h3>
                        <span className="api-key-value">sk_••••••••••••••••••••</span>
                      </div>
                      <div className="api-key-actions">
                        <button className="delete-key-btn" title="Revoke" onClick={() => revokeKey(key._id)}>🗑️</button>
                      </div>
                    </div>
                    <div className="api-key-details">
                      <div className="detail"><span className="detail-label">Created:</span><span className="detail-value">{key.createdAt?.slice(0,10)||'-'}</span></div>
                      <div className="detail"><span className="detail-label">Last Used:</span><span className="detail-value">{key.lastUsed ? new Date(key.lastUsed).toLocaleDateString() : 'Never'}</span></div>
                      <div className="detail"><span className="detail-label">Permissions:</span><div className="permission-badges">{(key.permissions||[]).map(p=><span key={p} className="permission-badge">{p}</span>)}</div></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── BILLING ── */}
        {activeTab === 'billing' && (
          <div className="settings-section">
            <h2>Billing & Subscription</h2>
            {billingLoading ? (
              <div style={{ textAlign:'center', padding:'40px', color:'rgba(255,255,255,0.4)' }}>Loading billing info...</div>
            ) : (
              <>
                <div className="settings-card">
                  <h3>Current Plan</h3>
                  <div className="plan-info">
                    <div className={`plan-badge ${billing?.plan||'free'}`}>
                      <span className="plan-name">{(billing?.plan||'Free').charAt(0).toUpperCase()+(billing?.plan||'free').slice(1)} Plan</span>
                      <span className="plan-price">{billing?.amount ? `$${billing.amount}/${billing.interval||'month'}` : 'Free'}</span>
                    </div>
                    <div className="plan-features">
                      {featuresList.map((f,i)=>(<div key={i} className="feature"><span className="feature-check">✓</span><span>{f}</span></div>))}
                    </div>
                    <button className="change-plan-btn" onClick={() => navigate('/billing')}>Change Plan</button>
                  </div>
                </div>
                {billing?.paymentMethod && (
                  <div className="settings-card">
                    <h3>Payment Method</h3>
                    <div className="payment-method">
                      <div className="card-info">
                        <span className="card-icon">💳</span>
                        <div>
                          <span className="card-type">{billing.paymentMethod.brand||'Card'} •••• {billing.paymentMethod.last4}</span>
                          <span className="card-expiry">Expires {billing.paymentMethod.expMonth}/{billing.paymentMethod.expYear}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div className="settings-card">
                  <h3>Billing History</h3>
                  <div className="billing-history">
                    {invoices.length === 0 ? (
                      <p style={{ color:'rgba(255,255,255,0.4)', padding:'16px 0' }}>No invoices yet.</p>
                    ) : (
                      <table className="history-table">
                        <thead><tr><th>Date</th><th>Description</th><th>Amount</th><th>Status</th><th>Invoice</th></tr></thead>
                        <tbody>
                          {invoices.map(inv => (
                            <tr key={inv._id||inv.id}>
                              <td>{inv.createdAt?.slice(0,10)||inv.date||'-'}</td>
                              <td>{inv.description||`${inv.plan||'Plan'} - ${inv.interval||'Monthly'}`}</td>
                              <td>${(inv.amount||0).toFixed(2)}</td>
                              <td><span className={`status-badge ${inv.status==='paid'?'paid':''}`}>{inv.status||'paid'}</span></td>
                              <td>{inv.invoiceUrl ? <a href={inv.invoiceUrl} target="_blank" rel="noopener noreferrer" className="invoice-link">PDF</a> : '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── TEAM ── */}
        {activeTab === 'team' && (
          <div className="settings-section">
            <h2>Team Settings</h2>
            <div className="settings-card">
              <h3>Team Information</h3>
              <div className="settings-form">
                <div className="form-group"><label>Team Name</label><input type="text" value={teamForm.teamName} onChange={e=>setTeamForm(p=>({...p,teamName:e.target.value}))} className="form-input" /></div>
                <div className="form-group"><label>Team Email</label><input type="email" value={teamForm.teamEmail} onChange={e=>setTeamForm(p=>({...p,teamEmail:e.target.value}))} className="form-input" /></div>
                <div className="form-group"><label>Default Member Role</label>
                  <select value={teamForm.defaultRole} onChange={e=>setTeamForm(p=>({...p,defaultRole:e.target.value}))} className="form-select">
                    <option value="viewer">Viewer</option><option value="editor">Editor</option><option value="admin">Admin</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="settings-card">
              <h3>Security Settings</h3>
              <div className="settings-form">
                {[['require2FA','Require Two-Factor Authentication','All team members must enable 2FA'],['ipWhitelisting','IP Whitelisting','Restrict access to specific IP addresses']].map(([k,h,d])=>(
                  <div key={k} className="toggle-item">
                    <div className="toggle-info"><h4>{h}</h4><p>{d}</p></div>
                    <Toggle checked={teamForm[k]} onChange={e=>setTeamForm(p=>({...p,[k]:e.target.checked}))} />
                  </div>
                ))}
                <div className="form-group"><label>Session Timeout</label>
                  <select value={teamForm.sessionTimeout} onChange={e=>setTeamForm(p=>({...p,sessionTimeout:e.target.value}))} className="form-select">
                    <option value="30">30 minutes</option><option value="60">1 hour</option><option value="120">2 hours</option><option value="240">4 hours</option><option value="480">8 hours</option>
                  </select>
                </div>
              </div>
            </div>
            <div style={{ display:'flex', justifyContent:'flex-end', marginTop:'8px' }}>
              <button className="save-all-btn" onClick={saveTeam} disabled={teamSaving}>
                {teamSaving ? '⏳ Saving...' : '💾 Save Team Settings'}
              </button>
            </div>
          </div>
        )}

        {/* ── APPEARANCE ── */}
        {activeTab === 'appearance' && (
          <div className="settings-section">
            <h2>Appearance Settings</h2>
            <div className="settings-card">
              <h3>Theme</h3>
              <div className="theme-options">
                {['dark','light','system'].map(t => (
                  <div key={t} className={`theme-option ${appearance.theme===t?'active':''}`} onClick={()=>setAppearance(p=>({...p,theme:t}))}>
                    <div className={`theme-preview ${t}`}><div className="preview-header"></div><div className="preview-content"></div></div>
                    <span>{t.charAt(0).toUpperCase()+t.slice(1)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="settings-card">
              <h3>Display Options</h3>
              <div className="settings-form">
                {[['compactMode','Compact Mode','Show more content with reduced spacing'],['animations','Animations','Enable UI animations and transitions']].map(([k,h,d])=>(
                  <div key={k} className="toggle-item">
                    <div className="toggle-info"><h4>{h}</h4><p>{d}</p></div>
                    <Toggle checked={appearance[k]} onChange={e=>setAppearance(p=>({...p,[k]:e.target.checked}))} />
                  </div>
                ))}
                <div className="form-group"><label>Font Size</label>
                  <select value={appearance.fontSize} onChange={e=>setAppearance(p=>({...p,fontSize:e.target.value}))} className="form-select">
                    <option value="small">Small</option><option value="medium">Medium</option><option value="large">Large</option>
                  </select>
                </div>
              </div>
            </div>
            <p style={{ color:'rgba(255,255,255,0.3)', fontSize:'12px', marginTop:'8px' }}>Appearance changes are stored locally in your browser.</p>
          </div>
        )}

        {/* ── PRIVACY ── */}
        {activeTab === 'privacy' && (
          <div className="settings-section">
            <h2>Privacy Settings</h2>
            <div className="settings-card">
              <h3>Profile Privacy</h3>
              <div className="settings-form">
                <div className="form-group"><label>Profile Visibility</label>
                  <select value={privacy.profileVisibility} onChange={e=>setPrivacy(p=>({...p,profileVisibility:e.target.value}))} className="form-select">
                    <option value="public">Public</option><option value="team">Team Only</option><option value="private">Private</option>
                  </select>
                </div>
                {[['showEmail','Show Email Address','Display your email on your public profile'],['showActivity','Show Activity Status','Let others see when you\'re active']].map(([k,h,d])=>(
                  <div key={k} className="toggle-item">
                    <div className="toggle-info"><h4>{h}</h4><p>{d}</p></div>
                    <Toggle checked={privacy[k]} onChange={e=>setPrivacy(p=>({...p,[k]:e.target.checked}))} />
                  </div>
                ))}
              </div>
            </div>
            <div className="settings-card">
              <h3>Data & Analytics</h3>
              <div className="settings-form">
                {[['dataCollection','Data Collection','Allow us to collect usage data to improve the product'],['analyticsTracking','Analytics Tracking','Enable analytics to help us understand usage patterns']].map(([k,h,d])=>(
                  <div key={k} className="toggle-item">
                    <div className="toggle-info"><h4>{h}</h4><p>{d}</p></div>
                    <Toggle checked={privacy[k]} onChange={e=>setPrivacy(p=>({...p,[k]:e.target.checked}))} />
                  </div>
                ))}
                <div className="toggle-item">
                  <div className="toggle-info"><h4>Cookie Consent</h4><p>Required for basic functionality</p></div>
                  <Toggle checked={true} onChange={()=>{}} disabled />
                </div>
              </div>
            </div>
            <div className="settings-card">
              <h3>Data Export</h3>
              <div className="export-data">
                <p>Download all your data in a portable format</p>
                <button className="export-data-btn" onClick={exportData}><span className="btn-icon">📥</span>Export My Data</button>
              </div>
            </div>
            <div style={{ display:'flex', justifyContent:'flex-end', marginTop:'8px' }}>
              <button className="save-all-btn" onClick={savePrivacy} disabled={privacySaving}>
                {privacySaving ? '⏳ Saving...' : '💾 Save Privacy Settings'}
              </button>
            </div>
          </div>
        )}

        {/* ── SECURITY ── */}
        {activeTab === 'security' && (
          <div className="settings-section">
            <h2>Security Settings</h2>
            <div className="settings-card">
              <h3>Two-Factor Authentication</h3>
              <div className="two-factor-status">
                <div className="status-info">
                  <span className="status-badge disabled">Disabled</span>
                  <p>Add an extra layer of security to your account</p>
                </div>
                <button className="enable-2fa-btn">Enable 2FA</button>
              </div>
            </div>
            <div className="settings-card">
              <h3>Change Password</h3>
              <div className="settings-form">
                {[['currentPassword','Current Password'],['newPassword','New Password'],['confirmPassword','Confirm New Password']].map(([k,lbl])=>(
                  <div key={k} className="form-group">
                    <label>{lbl}</label>
                    <input type="password" value={passwordForm[k]} onChange={e=>setPasswordForm(p=>({...p,[k]:e.target.value}))} className="form-input" placeholder={`Enter ${lbl.toLowerCase()}`} />
                    {k==='newPassword' && passwordForm.newPassword && (
                      <div className="password-strength">
                        <div className="strength-bar"><div className="strength-fill" style={{ width:`${strength.pct}%`, background:strength.color }}></div></div>
                        <span className="strength-text" style={{ color:strength.color }}>{strength.label}</span>
                      </div>
                    )}
                  </div>
                ))}
                {pwError  && <p style={{ color:'#ff6b6b', fontSize:'13px' }}>{pwError}</p>}
                {pwSuccess && <p style={{ color:'#40e0d0', fontSize:'13px' }}>✓ Password updated</p>}
                <button className="update-password-btn" onClick={changePassword} disabled={pwLoading}>{pwLoading?'Updating...':'Update Password'}</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Delete Modal ── */}
      {showDeleteModal && (
        <div className="delete-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Delete Account</h2>
              <button className="close-modal" onClick={()=>setShowDeleteModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="warning-icon">⚠️</div>
              <h3>Are you absolutely sure?</h3>
              <p>This will permanently delete your account and all associated data including bots, conversations, and team memberships. This cannot be undone.</p>
              <div className="delete-form">
                <label>Type "DELETE" to confirm</label>
                <input type="text" className="form-input" placeholder="DELETE" value={deleteConfirm} onChange={e=>setDeleteConfirm(e.target.value)} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="cancel-btn" onClick={()=>setShowDeleteModal(false)}>Cancel</button>
              <button className="delete-confirm-btn" onClick={deleteAccount} disabled={deleteConfirm!=='DELETE'} style={{ opacity:deleteConfirm!=='DELETE'?0.4:1 }}>
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Generate API Key Modal ── */}
      {showApiModal && (
        <div className="api-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Generate New API Key</h2>
              <button className="close-modal" onClick={()=>setShowApiModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              {generatedKey?.key ? (
                <div style={{ background:'rgba(64,224,208,0.1)', border:'1px solid rgba(64,224,208,0.3)', borderRadius:'8px', padding:'16px' }}>
                  <p style={{ color:'#40e0d0', margin:'0 0 10px', fontSize:'13px' }}>⚠️ Copy this key now — it won't be shown again:</p>
                  <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
                    <code style={{ flex:1, color:'#fff', fontFamily:'monospace', fontSize:'12px', wordBreak:'break-all' }}>{generatedKey.key}</code>
                    <button onClick={()=>navigator.clipboard.writeText(generatedKey.key)} style={{ padding:'4px 12px', background:'rgba(64,224,208,0.2)', border:'1px solid rgba(64,224,208,0.3)', borderRadius:'6px', color:'#40e0d0', cursor:'pointer', fontSize:'12px', whiteSpace:'nowrap' }}>Copy</button>
                  </div>
                  <button onClick={()=>setShowApiModal(false)} style={{ marginTop:'12px', width:'100%', padding:'8px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'8px', color:'rgba(255,255,255,0.7)', cursor:'pointer' }}>Done</button>
                </div>
              ) : (
                <>
                  <div className="form-group">
                    <label>Key Name</label>
                    <input type="text" className="form-input" placeholder="e.g., Production Key" value={newKeyName} onChange={e=>setNewKeyName(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Permissions</label>
                    <div className="permissions-checkboxes">
                      {['read','write','delete','webhooks'].map(p=>(
                        <label key={p} className="checkbox-label">
                          <input type="checkbox" checked={newKeyPerms.includes(p)} onChange={e=>setNewKeyPerms(prev=>e.target.checked?[...prev,p]:prev.filter(x=>x!==p))} /> {p}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Expiration (Optional)</label>
                    <select className="form-select" value={newKeyExpiry} onChange={e=>setNewKeyExpiry(e.target.value)}>
                      <option value="">No expiration</option>
                      <option value="30d">30 days</option>
                      <option value="60d">60 days</option>
                      <option value="90d">90 days</option>
                      <option value="365d">1 year</option>
                    </select>
                  </div>
                </>
              )}
            </div>
            {!generatedKey?.key && (
              <div className="modal-footer">
                <button className="cancel-btn" onClick={()=>setShowApiModal(false)}>Cancel</button>
                <button className="generate-btn" onClick={generateKey} disabled={keyLoading}>
                  {keyLoading ? '⏳ Generating...' : '🔑 Generate Key'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;