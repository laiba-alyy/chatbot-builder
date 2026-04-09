// src/pages/Training.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { trainingAPI, botsAPI } from '../services/api';
import './Training.css';

const Training = () => {
  const [searchParams] = useSearchParams();
  const preselectedBot = searchParams.get('bot') || 'all';

  const [selectedBot, setSelectedBot] = useState(preselectedBot);
  const [activeTab, setActiveTab] = useState('overview');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [trainingType, setTrainingType] = useState('full');
  const [selectedModel, setSelectedModel] = useState('gpt-4');
  const [modalBotId, setModalBotId] = useState(preselectedBot !== 'all' ? preselectedBot : '');
  const [activeTrainingJob, setActiveTrainingJob] = useState(null);

  const [bots, setBots] = useState([]);
  const [trainingJobs, setTrainingJobs] = useState([]);
  const [knowledgeBase, setKnowledgeBase] = useState([]);
  const [trainingHistory, setTrainingHistory] = useState([]);
  const [overview, setOverview] = useState(null);

  const [loadingJobs, setLoadingJobs] = useState(true);
  const [loadingKb, setLoadingKb] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [jobError, setJobError] = useState('');

  const models = [
    { id: 'gpt-4', name: 'GPT-4', description: 'Most accurate, higher cost', speed: 85, accuracy: 98, cost: 'High' },
    { id: 'gpt-3.5', name: 'GPT-3.5', description: 'Balanced performance', speed: 95, accuracy: 92, cost: 'Medium' },
    { id: 'custom', name: 'Custom LLM', description: 'Specialized for your domain', speed: 90, accuracy: 94, cost: 'Custom' },
  ];

  // ─── Load bots ─────────────────────────────────────────────────────────────
  useEffect(() => {
    botsAPI.getAll()
      .then(res => setBots(res.data || []))
      .catch(() => {});
  }, []);

  // ─── Load training jobs ────────────────────────────────────────────────────
  const fetchJobs = useCallback(async () => {
    setLoadingJobs(true);
    setError('');
    try {
      const params = selectedBot !== 'all' ? `?botId=${selectedBot}` : '';
      const res = await trainingAPI.getJobs(params);
      const data = res.data || [];
      setTrainingJobs(Array.isArray(data) ? data : data.jobs || []);

      // compute history from jobs
      const byDate = {};
      (Array.isArray(data) ? data : data.jobs || []).forEach(job => {
        const d = job.createdAt?.slice(0, 10) || 'unknown';
        if (!byDate[d]) byDate[d] = { date: d, jobs: 0, success: 0, tokens: 0 };
        byDate[d].jobs++;
        if (job.status === 'completed') byDate[d].success++;
        byDate[d].tokens += job.tokensUsed || 0;
      });
      setTrainingHistory(Object.values(byDate).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 7));
    } catch (err) {
      setError(err.message || 'Failed to load training jobs');
    } finally {
      setLoadingJobs(false);
    }
  }, [selectedBot]);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  // ─── Load knowledge base ───────────────────────────────────────────────────
  const fetchKnowledgeBase = useCallback(async () => {
    setLoadingKb(true);
    try {
      const params = selectedBot !== 'all' ? `?botId=${selectedBot}` : '';
      const res = await trainingAPI.getKnowledgeBase(params);
      setKnowledgeBase(res.data?.documents || res.data || []);
    } catch {
      setKnowledgeBase([]);
    } finally {
      setLoadingKb(false);
    }
  }, [selectedBot]);

  useEffect(() => {
    if (activeTab === 'knowledge') fetchKnowledgeBase();
  }, [activeTab, fetchKnowledgeBase]);

  // ─── Overview stats from jobs ──────────────────────────────────────────────
  useEffect(() => {
    if (!trainingJobs.length) return;
    const completed = trainingJobs.filter(j => j.status === 'completed');
    setOverview({
      total: trainingJobs.length,
      successRate: trainingJobs.length ? Math.round((completed.length / trainingJobs.length) * 100) : 0,
      avgAccuracy: completed.length
        ? (completed.reduce((s, j) => s + (j.accuracy || 0), 0) / completed.length).toFixed(1)
        : 0,
      tokensUsed: trainingJobs.reduce((s, j) => s + (j.tokensUsed || 0), 0),
      totalDocs: trainingJobs.reduce((s, j) => s + (j.documentsCount || 0), 0),
    });
  }, [trainingJobs]);

  // ─── Poll in-progress jobs ────────────────────────────────────────────────
  useEffect(() => {
    const inProgress = trainingJobs.filter(j => j.status === 'in_progress' || j.status === 'processing');
    if (!inProgress.length) return;

    const interval = setInterval(async () => {
      try {
        const updates = await Promise.all(
          inProgress.map(j => trainingAPI.getJobStatus(j._id))
        );
        setTrainingJobs(prev => prev.map(job => {
          const update = updates.find(u => u.data?._id === job._id);
          return update ? { ...job, ...update.data } : job;
        }));
      } catch {}
    }, 4000);

    return () => clearInterval(interval);
  }, [trainingJobs]);

  // ─── Upload + start training ───────────────────────────────────────────────
  const startTraining = async () => {
    if (!modalBotId) { setJobError('Please select a bot'); return; }
    if (selectedFiles.length === 0) { setJobError('Please select files to upload'); return; }

    setUploading(true);
    setJobError('');
    setUploadProgress(0);

    try {
      // 1. Upload files to knowledge base
      const formData = new FormData();
      selectedFiles.forEach(f => formData.append('files', f));
      formData.append('botId', modalBotId);
      formData.append('type', 'document');

      // Fake upload progress while uploading
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 15, 85));
      }, 300);

      await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/training/knowledge-base/upload`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          body: formData
        }
      );
      clearInterval(progressInterval);
      setUploadProgress(90);

      // 2. Create training job
      const jobRes = await trainingAPI.createJob({
        botId: modalBotId,
        type: trainingType,
        model: selectedModel,
        documentsCount: selectedFiles.length,
      });

      setUploadProgress(100);
      setActiveTrainingJob(jobRes.data);

      // Refresh jobs list after short delay
      setTimeout(() => {
        fetchJobs();
        setShowUploadModal(false);
        setSelectedFiles([]);
        setUploadProgress(0);
        setActiveTrainingJob(null);
        setActiveTab('jobs');
      }, 1500);

    } catch (err) {
      setJobError(err.message || 'Training failed to start');
    } finally {
      setUploading(false);
    }
  };

  // ─── Retry failed job ──────────────────────────────────────────────────────
  const retryJob = async (jobId) => {
    try {
      await trainingAPI.retryJob(jobId);
      fetchJobs();
    } catch (err) {
      alert(err.message || 'Failed to retry job');
    }
  };

  // ─── Delete knowledge base doc ─────────────────────────────────────────────
  const deleteDocument = async (docId) => {
    if (!window.confirm('Delete this document from the knowledge base?')) return;
    try {
      await trainingAPI.deleteKnowledgeBaseItem(docId);
      setKnowledgeBase(prev => prev.filter(d => d._id !== docId));
    } catch (err) {
      alert(err.message || 'Failed to delete document');
    }
  };

  // ─── Helpers ───────────────────────────────────────────────────────────────
  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': case 'processed': return '✅';
      case 'in_progress': case 'processing': return '🔄';
      case 'pending': return '⏳';
      case 'failed': return '❌';
      default: return '📄';
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'completed': case 'processed': return 'status-success';
      case 'in_progress': case 'processing': return 'status-warning';
      case 'pending': return 'status-info';
      case 'failed': return 'status-error';
      default: return '';
    }
  };

  const getDocIcon = (type) => {
    const icons = { pdf: '📕', csv: '📊', excel: '📗', xlsx: '📗', markdown: '📘', md: '📘', text: '📄', txt: '📄' };
    return icons[type] || '📄';
  };

  const getBotName = (botId) => bots.find(b => b._id === botId)?.name || 'Unknown Bot';
  const getBotIcon = (cat) => ({ ecommerce: '🛍️', support: '🎧', sales: '📈', realestate: '🏠', healthcare: '🏥', hr: '👥' }[cat] || '🤖');

  const formatDate = (d) => {
    if (!d) return '-';
    try { return new Date(d).toLocaleString(); }
    catch { return d; }
  };

  const activeJobs = trainingJobs.filter(j => ['in_progress', 'pending', 'processing'].includes(j.status));

  return (
    <div className="training">
      {/* Header */}
      <div className="training-header">
        <div>
          <h1>Training Center</h1>
          <p>Manage training data and improve your bots' intelligence</p>
        </div>
        <button className="new-training-btn" onClick={() => setShowUploadModal(true)}>
          <span className="btn-icon">+</span>
          New Training Job
        </button>
      </div>

      {/* Bot Selector */}
      <div className="bot-selector">
        <button className={`bot-tab ${selectedBot === 'all' ? 'active' : ''}`} onClick={() => setSelectedBot('all')}>
          All Bots
        </button>
        {bots.map(bot => (
          <button
            key={bot._id}
            className={`bot-tab ${selectedBot === bot._id ? 'active' : ''}`}
            onClick={() => setSelectedBot(bot._id)}
            style={{ '--bot-color': bot.settings?.primaryColor || '#40e0d0' }}
          >
            <span className="bot-avatar-small">{getBotIcon(bot.category)}</span>
            {bot.name}
          </button>
        ))}
      </div>

      {/* Tab Navigation */}
      <div className="training-tabs">
        {[
          { id: 'overview', label: '📊 Overview' },
          { id: 'jobs', label: '🔄 Training Jobs' },
          { id: 'knowledge', label: '📚 Knowledge Base' },
          { id: 'models', label: '🧠 Models' },
          { id: 'history', label: '📈 History' },
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

      {/* Error */}
      {error && (
        <div style={{ background: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.3)', color: '#ff6b6b', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>
          {error} <button onClick={fetchJobs} style={{ marginLeft: '8px', color: '#40e0d0', background: 'none', border: 'none', cursor: 'pointer' }}>Retry</button>
        </div>
      )}

      {/* Tab Content */}
      <div className="tab-content">

        {/* ── OVERVIEW ── */}
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <div className="stats-grid">
              {[
                ['📊', 'Total Training Jobs', overview?.total ?? trainingJobs.length],
                ['✅', 'Success Rate', `${overview?.successRate ?? 0}%`],
                ['📄', 'Documents', overview?.totalDocs?.toLocaleString() ?? 0],
                ['🎯', 'Avg. Accuracy', `${overview?.avgAccuracy ?? 0}%`],
                ['💰', 'Tokens Used', `${((overview?.tokensUsed || 0) / 1000).toFixed(1)}K`],
                ['🔄', 'Active Jobs', activeJobs.length],
              ].map(([icon, label, value]) => (
                <div key={label} className="stat-card">
                  <div className="stat-icon">{icon}</div>
                  <div className="stat-content">
                    <span className="stat-label">{label}</span>
                    <span className="stat-value">{loadingJobs ? '...' : value}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Active jobs */}
            {activeJobs.length > 0 && (
              <div className="active-training">
                <h3>Active Training Jobs</h3>
                <div className="jobs-list">
                  {activeJobs.map(job => (
                    <div key={job._id} className={`job-card ${job.status}`}>
                      <div className="job-header">
                        <div className="job-info">
                          <h4>{getBotName(job.botId)}</h4>
                          <span className={`job-status ${getStatusClass(job.status)}`}>
                            {getStatusIcon(job.status)} {job.status.replace('_', ' ')}
                          </span>
                        </div>
                        <span className="job-type">{job.type || 'full'} training</span>
                      </div>
                      <div className="job-progress">
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width: `${job.progress || 0}%` }}></div>
                        </div>
                        <span className="progress-text">{job.progress || 0}%</span>
                      </div>
                      {job.currentPhase && (
                        <div className="job-phase">
                          <span className="phase-label">Phase:</span>
                          <span className="phase-name">{job.currentPhase}</span>
                        </div>
                      )}
                      <div className="job-details">
                        <span>📄 {job.documentsCount || 0} docs</span>
                        <span>🎯 {((job.tokensUsed || 0) / 1000).toFixed(1)}K tokens</span>
                        <span>🧠 {job.model || 'GPT-4'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Model comparison (static — informational) */}
            <div className="model-performance">
              <h3>Model Performance Comparison</h3>
              <div className="model-grid">
                {models.map(model => (
                  <div key={model.id} className="model-card">
                    <h4>{model.name}</h4>
                    <p className="model-description">{model.description}</p>
                    <div className="model-metrics">
                      {[['Speed', model.speed], ['Accuracy', model.accuracy]].map(([label, val]) => (
                        <div key={label} className="metric">
                          <span className="metric-label">{label}</span>
                          <div className="metric-bar">
                            <div className="metric-fill" style={{ width: `${val}%` }}></div>
                          </div>
                          <span className="metric-value">{val}%</span>
                        </div>
                      ))}
                      <div className="metric-cost">
                        <span className="cost-label">Cost:</span>
                        <span className={`cost-value ${model.cost.toLowerCase()}`}>{model.cost}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── JOBS ── */}
        {activeTab === 'jobs' && (
          <div className="jobs-tab">
            <div className="jobs-header">
              <h3>All Training Jobs</h3>
            </div>
            {loadingJobs ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.4)' }}>Loading jobs...</div>
            ) : trainingJobs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.4)' }}>
                No training jobs yet. <button onClick={() => setShowUploadModal(true)} style={{ color: '#40e0d0', background: 'none', border: 'none', cursor: 'pointer' }}>Start one →</button>
              </div>
            ) : (
              <div className="jobs-table">
                <table>
                  <thead>
                    <tr>
                      <th>Bot</th>
                      <th>Status</th>
                      <th>Type</th>
                      <th>Progress</th>
                      <th>Docs</th>
                      <th>Tokens</th>
                      <th>Accuracy</th>
                      <th>Started</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trainingJobs.map(job => (
                      <tr key={job._id}>
                        <td>
                          <div className="cell-bot">
                            <span className="bot-avatar">{getBotIcon(bots.find(b => b._id === job.botId)?.category)}</span>
                            {getBotName(job.botId)}
                          </div>
                        </td>
                        <td>
                          <span className={`status-badge ${getStatusClass(job.status)}`}>
                            {getStatusIcon(job.status)} {job.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td>{job.type || 'full'}</td>
                        <td>
                          <div className="cell-progress">
                            <div className="progress-bar small">
                              <div className="progress-fill" style={{ width: `${job.progress || 0}%` }}></div>
                            </div>
                            <span>{job.progress || 0}%</span>
                          </div>
                        </td>
                        <td>{job.documentsCount || 0}</td>
                        <td>{((job.tokensUsed || 0) / 1000).toFixed(1)}K</td>
                        <td>{job.accuracy ? `${job.accuracy}%` : '-'}</td>
                        <td style={{ fontSize: '12px' }}>{formatDate(job.createdAt)}</td>
                        <td>
                          {job.status === 'failed' && (
                            <button className="action-btn" title="Retry" onClick={() => retryJob(job._id)}>🔄</button>
                          )}
                          {job.error && (
                            <span title={job.error} style={{ cursor: 'help', fontSize: '16px' }}>⚠️</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── KNOWLEDGE BASE ── */}
        {activeTab === 'knowledge' && (
          <div className="knowledge-tab">
            <div className="knowledge-header">
              <h3>Knowledge Base Documents</h3>
              <button className="upload-btn" onClick={() => setShowUploadModal(true)}>
                <span className="btn-icon">📤</span>
                Upload Documents
              </button>
            </div>

            {loadingKb ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.4)' }}>Loading...</div>
            ) : knowledgeBase.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.4)' }}>
                No documents yet. <button onClick={() => setShowUploadModal(true)} style={{ color: '#40e0d0', background: 'none', border: 'none', cursor: 'pointer' }}>Upload one →</button>
              </div>
            ) : (
              <div className="documents-grid">
                {knowledgeBase.map(doc => (
                  <div key={doc._id} className="document-card">
                    <div className="doc-icon">{getDocIcon(doc.fileType || doc.type)}</div>
                    <div className="doc-info">
                      <h4>{doc.name || doc.fileName}</h4>
                      <div className="doc-meta">
                        <span>{doc.size || doc.fileSize}</span>
                        {doc.pages && <span>• {doc.pages} pages</span>}
                        {doc.rows && <span>• {doc.rows} rows</span>}
                      </div>
                    </div>
                    <div className="doc-status">
                      <span className={`status-badge ${getStatusClass(doc.status)}`}>
                        {getStatusIcon(doc.status)} {doc.status}
                      </span>
                      {doc.accuracy != null && (
                        <span className="doc-accuracy">🎯 {doc.accuracy}%</span>
                      )}
                    </div>
                    {doc.status === 'processing' && (
                      <div className="doc-progress">
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width: `${doc.progress || 0}%` }}></div>
                        </div>
                      </div>
                    )}
                    {doc.error && <div className="doc-error">⚠️ {doc.error}</div>}
                    <div className="doc-footer">
                      <span className="doc-date">Updated: {doc.updatedAt?.slice(0, 10) || doc.lastUpdated || '-'}</span>
                      <div className="doc-actions">
                        <button className="doc-action" title="Delete" onClick={() => deleteDocument(doc._id)}>🗑️</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── MODELS ── */}
        {activeTab === 'models' && (
          <div className="models-tab">
            <h3>Available Models</h3>
            <div className="models-comparison">
              {models.map(model => (
                <div key={model.id} className="model-detail-card">
                  <div className="model-header">
                    <h4>{model.name}</h4>
                    {model.id === 'gpt-4' && <span className="model-badge">Recommended</span>}
                  </div>
                  <p className="model-description">{model.description}</p>
                  <div className="model-specs">
                    {[['Speed', `${model.speed}%`], ['Accuracy', `${model.accuracy}%`], ['Context Window', '8K tokens'], ['Cost per 1K', '$0.03']].map(([l, v]) => (
                      <div key={l} className="spec">
                        <span className="spec-label">{l}</span>
                        <span className="spec-value">{v}</span>
                      </div>
                    ))}
                  </div>
                  <div className="model-features">
                    <h5>Features</h5>
                    <ul>
                      {['Multilingual support', 'Code generation', 'Reasoning & logic', 'Function calling'].map(f => (
                        <li key={f}>✓ {f}</li>
                      ))}
                    </ul>
                  </div>
                  <button className="select-model-btn" onClick={() => { setSelectedModel(model.id); setShowUploadModal(true); }}>
                    Use This Model
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── HISTORY ── */}
        {activeTab === 'history' && (
          <div className="history-tab">
            <h3>Training History</h3>
            {trainingHistory.length > 0 ? (
              <>
                <div className="history-chart">
                  <div className="bar-chart">
                    {trainingHistory.map((day, i) => (
                      <div key={i} className="chart-bar-container">
                        <div className="chart-bar" style={{ height: `${(day.jobs / Math.max(...trainingHistory.map(d => d.jobs), 1)) * 100}%` }}>
                          <span className="bar-value">{day.jobs}</span>
                        </div>
                        <span className="bar-label">{day.date.slice(5)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="history-list">
                  <table className="history-table">
                    <thead>
                      <tr><th>Date</th><th>Jobs</th><th>Success</th><th>Success Rate</th><th>Tokens</th></tr>
                    </thead>
                    <tbody>
                      {trainingHistory.map((day, i) => (
                        <tr key={i}>
                          <td>{day.date}</td>
                          <td>{day.jobs}</td>
                          <td>{day.success}</td>
                          <td><span className="success-rate">{((day.success / day.jobs) * 100).toFixed(1)}%</span></td>
                          <td>{(day.tokens / 1000).toFixed(1)}K</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.4)' }}>
                No training history yet.
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Upload Modal ── */}
      {showUploadModal && (
        <div className="upload-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Upload Training Data</h2>
              <button className="close-modal" onClick={() => { setShowUploadModal(false); setSelectedFiles([]); setJobError(''); setUploadProgress(0); setActiveTrainingJob(null); }}>✕</button>
            </div>

            <div className="modal-body">
              {/* Bot selector */}
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', display: 'block', marginBottom: '8px' }}>
                  Select Bot <span style={{ color: '#ff6b6b' }}>*</span>
                </label>
                <select
                  className="model-dropdown"
                  value={modalBotId}
                  onChange={e => setModalBotId(e.target.value)}
                >
                  <option value="">-- Select a bot --</option>
                  {bots.map(bot => (
                    <option key={bot._id} value={bot._id}>{bot.name}</option>
                  ))}
                </select>
              </div>

              {/* File upload */}
              <div className="upload-area">
                <input
                  type="file"
                  id="file-upload"
                  multiple
                  onChange={e => setSelectedFiles(prev => [...prev, ...Array.from(e.target.files)])}
                  style={{ display: 'none' }}
                  accept=".pdf,.doc,.docx,.txt,.csv,.xlsx,.md"
                />
                <label htmlFor="file-upload" className="upload-label">
                  <div className="upload-icon">📤</div>
                  <h4>Drag & drop files or click to browse</h4>
                  <p>PDF, DOC, DOCX, TXT, CSV, XLSX, MD (Max 50MB each)</p>
                </label>
              </div>

              {selectedFiles.length > 0 && (
                <div className="selected-files">
                  <h4>Selected Files ({selectedFiles.length})</h4>
                  <div className="files-list">
                    {selectedFiles.map((file, i) => (
                      <div key={i} className="file-item">
                        <span className="file-icon">📄</span>
                        <div className="file-info">
                          <span className="file-name">{file.name}</span>
                          <span className="file-size">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                        </div>
                        <button className="remove-file" onClick={() => setSelectedFiles(prev => prev.filter((_, idx) => idx !== i))}>✕</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Training options */}
              <div className="training-options">
                <h4>Training Type</h4>
                <div className="options-grid">
                  {[['full', 'Full training'], ['incremental', 'Incremental update'], ['fine-tuning', 'Fine-tuning']].map(([val, label]) => (
                    <label key={val} className="option-label">
                      <input type="radio" name="training-type" value={val} checked={trainingType === val} onChange={() => setTrainingType(val)} />
                      <span className="option-text">{label}</span>
                    </label>
                  ))}
                </div>

                <div className="model-select" style={{ marginTop: '14px' }}>
                  <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', display: 'block', marginBottom: '8px' }}>Select Model</label>
                  <select className="model-dropdown" value={selectedModel} onChange={e => setSelectedModel(e.target.value)}>
                    {models.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Upload progress */}
              {uploading && (
                <div className="active-training-modal">
                  <h4>Uploading & starting training...</h4>
                  <div className="job-progress">
                    <div className="progress-bar large">
                      <div className="progress-fill" style={{ width: `${uploadProgress}%` }}></div>
                    </div>
                    <span className="progress-percent">{uploadProgress}%</span>
                  </div>
                </div>
              )}

              {activeTrainingJob && !uploading && (
                <div className="active-training-modal" style={{ background: 'rgba(64,224,208,0.1)', borderRadius: '10px', padding: '14px', marginTop: '14px' }}>
                  <p style={{ color: '#40e0d0', margin: 0 }}>✅ Training job created! Redirecting to Jobs tab...</p>
                </div>
              )}

              {/* Error */}
              {jobError && (
                <div style={{ color: '#ff6b6b', fontSize: '13px', marginTop: '10px', background: 'rgba(255,68,68,0.1)', padding: '8px 12px', borderRadius: '8px' }}>
                  {jobError}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => { setShowUploadModal(false); setSelectedFiles([]); setJobError(''); }}>
                Cancel
              </button>
              <button
                className="start-training-btn"
                onClick={startTraining}
                disabled={selectedFiles.length === 0 || uploading || !!activeTrainingJob}
              >
                {uploading ? 'Starting...' : activeTrainingJob ? 'Done!' : 'Start Training'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Training;