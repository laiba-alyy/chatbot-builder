// src/pages/HelpSupport.jsx
import React, { useState, useEffect, useRef } from 'react';
import './HelpSupport.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const token = () => localStorage.getItem('token');

const authFetch = (path, opts = {}) =>
  fetch(`${API_URL}${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}`, ...(opts.headers || {}) },
  });

// ─── Static content (no backend needed) ───────────────────────────────────────
const CATEGORIES = [
  { id: 'all',             name: 'All Articles',       icon: '📚', count: 45 },
  { id: 'getting-started', name: 'Getting Started',    icon: '🚀', count: 8  },
  { id: 'bot-building',    name: 'Bot Building',       icon: '🤖', count: 12 },
  { id: 'integrations',    name: 'Integrations',       icon: '🔌', count: 10 },
  { id: 'training',        name: 'Training & AI',      icon: '🧠', count: 6  },
  { id: 'analytics',       name: 'Analytics',          icon: '📊', count: 4  },
  { id: 'account',         name: 'Account & Billing',  icon: '💰', count: 5  },
];

const ARTICLES = [
  { id:1, title:'Creating Your First Bot',            description:'Learn how to create and configure your first chatbot in minutes',        category:'getting-started', readTime:'5 min',  views:1234, likes:89,  featured:true  },
  { id:2, title:'Understanding Bot Personalities',    description:'How to set up different tones and personalities for your bots',           category:'bot-building',    readTime:'8 min',  views:892,  likes:67,  featured:true  },
  { id:3, title:'Connecting to Slack',                description:'Step-by-step guide to integrate your bot with Slack workspace',           category:'integrations',    readTime:'6 min',  views:756,  likes:45,  featured:false },
  { id:4, title:'Training Your Bot with Custom Data', description:'Advanced techniques for training your bot with specific knowledge',       category:'training',        readTime:'10 min', views:623,  likes:78,  featured:true  },
  { id:5, title:'Understanding Analytics Dashboard',  description:'How to read and interpret your bot performance metrics',                  category:'analytics',       readTime:'7 min',  views:445,  likes:34,  featured:false },
  { id:6, title:'Managing Team Members',              description:'How to add and manage team members and permissions',                      category:'account',         readTime:'4 min',  views:567,  likes:41,  featured:false },
  { id:7, title:'Using Variables in Bot Responses',   description:'Dynamic responses using user data and variables',                        category:'bot-building',    readTime:'6 min',  views:389,  likes:52,  featured:false },
  { id:8, title:'Setting Up Webhooks',                description:'Configure webhooks for real-time integrations',                         category:'integrations',    readTime:'5 min',  views:678,  likes:63,  featured:false },
];

const FAQS = [
  { id:1, question:'How do I create my first bot?',                    answer:'Creating your first bot is easy! Click on "Create New Bot" in the dashboard, choose a template or start from scratch, configure your bot\'s personality, add training data, and publish.',                                                             category:'getting-started' },
  { id:2, question:'What training data formats are supported?',        answer:'We support PDF, DOCX, TXT, CSV, and Markdown. You can also import FAQs directly, add website URLs for crawling, or paste text directly into the training interface.',                                                                                   category:'training'        },
  { id:3, question:'How do I integrate with Slack?',                   answer:'Go to Integrations, select Slack, and click Configure. You\'ll be guided through the OAuth process to connect your workspace. Once connected, choose which channels your bot can access.',                                                             category:'integrations'    },
  { id:4, question:'What happens if I exceed my conversation limit?',  answer:'You\'ll receive email notifications at 80%, 90%, and 100% usage. If you exceed your limit, you can upgrade your plan or wait until your next billing cycle resets the counter. Overage charges may apply.',                                           category:'billing'         },
  { id:5, question:'Can I export my bot\'s conversation data?',        answer:'Yes! Export conversation data in CSV or JSON format from the Analytics section. This includes all messages, timestamps, user information, and satisfaction ratings.',                                                                                   category:'analytics'       },
  { id:6, question:'How do I cancel my subscription?',                 answer:'Go to Settings > Billing, click "Cancel Subscription". Your subscription will remain active until the end of your current billing period.',                                                                                                            category:'account'         },
  { id:7, question:'Is my data secure?',                               answer:'Absolutely! We use enterprise-grade encryption for all data at rest and in transit. We\'re SOC2 compliant and regularly undergo security audits. Your data is never shared with third parties without your consent.',                                    category:'account'         },
  { id:8, question:'Can I try the platform for free?',                 answer:'Yes! We offer a 14-day free trial on all paid plans with full access to all features. No credit card required to start your trial.',                                                                                                                   category:'getting-started' },
];

const COMMUNITY = [
  { title:'Bot Builders Community', description:'Join our Discord to connect with other builders',   icon:'💬', stat:'2,345 members', link:'#' },
  { title:'Developer Forum',        description:'Ask questions and share knowledge',                  icon:'📝', stat:'1,243 posts',   link:'#' },
  { title:'GitHub Examples',        description:'Explore open-source examples and templates',         icon:'🐙', stat:'45 repos',      link:'#' },
  { title:'Monthly Webinars',       description:'Join live training sessions with our experts',       icon:'🎥', stat:'Next: Mar 15',  link:'#' },
];

const PRIORITY_COLOR = { low:'#40e0d0', medium:'#f59e0b', high:'#ff6b6b', urgent:'#ff4444' };

const HelpSupport = () => {
  const [activeTab, setActiveTab]           = useState('documentation');
  const [searchQuery, setSearchQuery]       = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showContactModal, setShowContactModal] = useState(false);
  const [showTicketModal, setShowTicketModal]   = useState(false);
  const [expandedFaq, setExpandedFaq]       = useState(null);
  const [helpfulFaqs, setHelpfulFaqs]       = useState({});   // { faqId: 'up'|'down' }

  // Tickets
  const [tickets, setTickets]               = useState([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);

  // System status
  const [sysStatus, setSysStatus]           = useState(null);

  // New ticket form
  const [ticketForm, setTicketForm]         = useState({ subject:'', category:'Technical Issue', priority:'Medium', description:'', includeLogs:false });
  const [ticketFiles, setTicketFiles]       = useState([]);
  const [ticketLoading, setTicketLoading]   = useState(false);
  const [ticketError, setTicketError]       = useState('');
  const fileInputRef = useRef();

  // Contact form
  const [contactForm, setContactForm]       = useState({ name:'', email:'', message:'' });
  const [contactLoading, setContactLoading] = useState(false);
  const [contactSuccess, setContactSuccess] = useState(false);

  // ─── Load system status on mount ─────────────────────────────────────────
  useEffect(() => {
    fetch(`${API_URL}/health`)
      .then(r => r.json())
      .then(d => setSysStatus(d))
      .catch(() => setSysStatus({ api:'operational', botEngine:'operational', training:'operational', database:'operational' }));
  }, []);

  // ─── Load tickets when tab opens ──────────────────────────────────────────
  useEffect(() => {
    if (activeTab !== 'tickets') return;
    setTicketsLoading(true);
    authFetch('/support/tickets')
      .then(r => r.json())
      .then(d => setTickets(d.data || d || []))
      .catch(() => setTickets([]))
      .finally(() => setTicketsLoading(false));
  }, [activeTab]);

  // ─── Submit ticket ────────────────────────────────────────────────────────
  const handleSubmitTicket = async () => {
    if (!ticketForm.subject.trim())      { setTicketError('Subject is required'); return; }
    if (!ticketForm.description.trim())  { setTicketError('Description is required'); return; }
    setTicketLoading(true);
    setTicketError('');
    try {
      const fd = new FormData();
      Object.entries(ticketForm).forEach(([k, v]) => fd.append(k, v));
      ticketFiles.forEach(f => fd.append('attachments', f));

      const res = await fetch(`${API_URL}/support/tickets`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token()}` },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Submission failed');
      setTickets(prev => [data.data || data, ...prev]);
      setShowTicketModal(false);
      setTicketForm({ subject:'', category:'Technical Issue', priority:'Medium', description:'', includeLogs:false });
      setTicketFiles([]);
      setActiveTab('tickets');
    } catch (err) {
      setTicketError(err.message);
    } finally {
      setTicketLoading(false);
    }
  };

  // ─── Send contact email ────────────────────────────────────────────────────
  const handleContactSubmit = async () => {
    if (!contactForm.message.trim()) return;
    setContactLoading(true);
    try {
      await authFetch('/support/contact', {
        method: 'POST',
        body: JSON.stringify(contactForm),
      });
      setContactSuccess(true);
      setTimeout(() => { setContactSuccess(false); setShowContactModal(false); }, 2500);
    } catch {
      alert('Failed to send message. Please email support@buildsmart.ai directly.');
    } finally {
      setContactLoading(false);
    }
  };

  // ─── FAQ helpful vote ─────────────────────────────────────────────────────
  const voteFaq = (id, vote) => {
    if (helpfulFaqs[id]) return; // already voted
    setHelpfulFaqs(prev => ({ ...prev, [id]: vote }));
    authFetch(`/support/faq/${id}/vote`, { method:'POST', body: JSON.stringify({ vote }) }).catch(() => {});
  };

  // ─── Filters ──────────────────────────────────────────────────────────────
  const filteredArticles = ARTICLES.filter(a => {
    if (selectedCategory !== 'all' && a.category !== selectedCategory) return false;
    if (searchQuery) { const q = searchQuery.toLowerCase(); return a.title.toLowerCase().includes(q) || a.description.toLowerCase().includes(q); }
    return true;
  });

  const filteredFaqs = FAQS.filter(f => {
    if (selectedCategory !== 'all' && f.category !== selectedCategory) return false;
    if (searchQuery) { const q = searchQuery.toLowerCase(); return f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q); }
    return true;
  });

  const statusColor = (s) => ({ operational:'#40e0d0', degraded:'#ffa444', down:'#ff6b6b' })[s] || '#40e0d0';
  const statusLabel = (s) => ({ operational:'✅ Operational', degraded:'⚠️ Degraded', down:'❌ Down' })[s] || '✅ Operational';

  const ticketStatusBadge = (s) => (
    <span className={`ticket-status ${s}`}>{{ open:'Open', 'in-progress':'In Progress', resolved:'Resolved', closed:'Closed' }[s] || s}</span>
  );

  return (
    <div className="help-support">
      <div className="help-header">
        <div><h1>Help & Support</h1><p>Find answers, get help, and connect with our community</p></div>
      </div>

      {/* Search */}
      <div className="help-search">
        <div className="search-container">
          <span className="search-icon">🔍</span>
          <input type="text" placeholder="Search for articles, FAQs, or topics..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          {searchQuery && <button className="clear-search" onClick={() => setSearchQuery('')}>✕</button>}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        {[
          ['💬','Contact Support',  'Get help from our team',  () => setShowContactModal(true)],
          ['🎫','Submit Ticket',    'Create a support ticket', () => setShowTicketModal(true)],
          ['📚','Documentation',    'Browse our guides',       () => setActiveTab('documentation')],
          ['👥','Community',        'Join our Discord',        () => setActiveTab('community')],
        ].map(([icon,h3,p,fn]) => (
          <div key={h3} className="quick-action-card" onClick={fn}>
            <div className="action-icon">{icon}</div>
            <div className="action-info"><h3>{h3}</h3><p>{p}</p></div>
          </div>
        ))}
      </div>

      {/* System Status */}
      <div className="system-status">
        <h3>System Status</h3>
        <div className="status-grid">
          {[
            ['API',              sysStatus?.api        || 'operational'],
            ['Website',          sysStatus?.website    || 'operational'],
            ['Bot Engine',       sysStatus?.botEngine  || 'operational'],
            ['Training Service', sysStatus?.training   || 'operational'],
          ].map(([label, status]) => (
            <div key={label} className="status-item">
              <span className="status-label">{label}</span>
              <span className="status-value" style={{ color: statusColor(status) }}>{statusLabel(status)}</span>
            </div>
          ))}
        </div>
        <p className="status-note">
          <a href="https://status.buildsmart.ai" target="_blank" rel="noopener noreferrer" style={{ color:'rgba(255,255,255,0.4)', fontSize:'12px' }}>
            View full status page →
          </a>
        </p>
      </div>

      {/* Tabs */}
      <div className="help-tabs">
        {[['documentation','📚','Documentation'],['faq','❓','FAQ'],['tickets','🎫','My Tickets'],['community','👥','Community']].map(([id,icon,label])=>(
          <button key={id} className={`tab-btn ${activeTab===id?'active':''}`} onClick={()=>setActiveTab(id)}>
            <span className="tab-icon">{icon}</span>{label}
          </button>
        ))}
      </div>

      <div className="tab-content">

        {/* ── DOCUMENTATION ── */}
        {activeTab === 'documentation' && (
          <div className="documentation-tab">
            <div className="docs-sidebar">
              <h3>Categories</h3>
              {CATEGORIES.map(cat => (
                <div key={cat.id} className={`category-item ${selectedCategory===cat.id?'active':''}`} onClick={()=>setSelectedCategory(cat.id)}>
                  <span className="category-icon">{cat.icon}</span>
                  <span className="category-name">{cat.name}</span>
                  <span className="category-count">{cat.count}</span>
                </div>
              ))}
            </div>

            <div className="docs-content">
              {searchQuery && <p className="search-results">Found {filteredArticles.length} articles for "{searchQuery}"</p>}
              {filteredArticles.length === 0 ? (
                <div className="no-results"><div className="no-results-icon">🔍</div><h3>No articles found</h3><p>Try different keywords or browse categories</p></div>
              ) : (
                <div className="articles-grid">
                  {filteredArticles.map(article => (
                    <div key={article.id} className="article-card">
                      {article.featured && <div className="featured-badge">Featured</div>}
                      <div className="article-category">{CATEGORIES.find(c=>c.id===article.category)?.name}</div>
                      <h3 className="article-title">{article.title}</h3>
                      <p className="article-description">{article.description}</p>
                      <div className="article-meta">
                        <span className="read-time">⏱️ {article.readTime}</span>
                        <span className="views">👁️ {article.views}</span>
                        <span className="likes">❤️ {article.likes}</span>
                      </div>
                      <button className="read-more-btn" onClick={() => alert('Full article viewer coming soon!')}>Read Article →</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── FAQ ── */}
        {activeTab === 'faq' && (
          <div className="faq-tab">
            <div className="faq-categories">
              {[['all','All FAQs'],['getting-started','Getting Started'],['training','Training'],['integrations','Integrations'],['billing','Billing'],['account','Account']].map(([id,label])=>(
                <button key={id} className={`faq-category-btn ${selectedCategory===id?'active':''}`} onClick={()=>setSelectedCategory(id)}>{label}</button>
              ))}
            </div>

            <div className="faq-list">
              {filteredFaqs.length === 0 ? (
                <div className="no-results"><div className="no-results-icon">❓</div><h3>No FAQs found</h3><p>Try different keywords or contact support</p></div>
              ) : filteredFaqs.map(faq => (
                <div key={faq.id} className="faq-item">
                  <div className={`faq-question ${expandedFaq===faq.id?'expanded':''}`} onClick={()=>setExpandedFaq(expandedFaq===faq.id?null:faq.id)}>
                    <span className="question-text">{faq.question}</span>
                    <span className="expand-icon">{expandedFaq===faq.id?'−':'+'}</span>
                  </div>
                  {expandedFaq===faq.id && (
                    <div className="faq-answer">
                      <p>{faq.answer}</p>
                      <div className="faq-actions">
                        <button
                          className="helpful-btn"
                          onClick={() => voteFaq(faq.id, 'up')}
                          disabled={!!helpfulFaqs[faq.id]}
                          style={{ opacity: helpfulFaqs[faq.id] && helpfulFaqs[faq.id]!=='up' ? 0.4 : 1 }}
                        >
                          👍 {helpfulFaqs[faq.id]==='up' ? 'Thanks!' : 'Helpful'}
                        </button>
                        <button
                          className="not-helpful-btn"
                          onClick={() => voteFaq(faq.id, 'down')}
                          disabled={!!helpfulFaqs[faq.id]}
                          style={{ opacity: helpfulFaqs[faq.id] && helpfulFaqs[faq.id]!=='down' ? 0.4 : 1 }}
                        >
                          👎 {helpfulFaqs[faq.id]==='down' ? 'Noted' : 'Not Helpful'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="faq-contact">
              <p>Still need help? <button onClick={() => setShowContactModal(true)}>Contact Support</button></p>
            </div>
          </div>
        )}

        {/* ── TICKETS ── */}
        {activeTab === 'tickets' && (
          <div className="tickets-tab">
            <div className="tickets-header">
              <h3>My Support Tickets</h3>
              <button className="new-ticket-btn" onClick={()=>{ setTicketError(''); setShowTicketModal(true); }}>
                <span className="btn-icon">+</span>New Ticket
              </button>
            </div>

            {ticketsLoading ? (
              <div style={{ textAlign:'center', padding:'40px', color:'rgba(255,255,255,0.4)' }}>Loading tickets...</div>
            ) : tickets.length === 0 ? (
              <div className="no-tickets">
                <div className="no-tickets-icon">🎫</div>
                <h3>No tickets yet</h3>
                <p>Create your first support ticket</p>
                <button className="create-ticket-btn" onClick={()=>setShowTicketModal(true)}>Create Ticket</button>
              </div>
            ) : (
              <div className="tickets-list">
                {tickets.map(ticket => (
                  <div key={ticket._id || ticket.id} className="ticket-card">
                    <div className="ticket-header">
                      <div className="ticket-id">{ticket.ticketNumber || ticket.id || ticket._id?.slice(-8).toUpperCase()}</div>
                      {ticketStatusBadge(ticket.status)}
                    </div>
                    <h4 className="ticket-subject">{ticket.subject}</h4>
                    <div className="ticket-meta">
                      <span className="ticket-priority">
                        <span className="priority-dot" style={{ background: PRIORITY_COLOR[(ticket.priority||'medium').toLowerCase()] }}></span>
                        {ticket.priority || 'Medium'} priority
                      </span>
                      <span className="ticket-category">{ticket.category}</span>
                      <span className="ticket-messages">💬 {ticket.messageCount || ticket.messages || 0} messages</span>
                    </div>
                    <div className="ticket-footer">
                      <span className="ticket-update">
                        Last updated: {ticket.updatedAt ? new Date(ticket.updatedAt).toLocaleDateString() : ticket.lastUpdate || '-'}
                      </span>
                      <button className="view-ticket-btn" onClick={() => alert(`Ticket viewer for ${ticket._id || ticket.id} coming soon!`)}>
                        View Ticket
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── COMMUNITY ── */}
        {activeTab === 'community' && (
          <div className="community-tab">
            <div className="community-grid">
              {COMMUNITY.map(r => (
                <div key={r.title} className="community-card">
                  <div className="community-icon">{r.icon}</div>
                  <h3>{r.title}</h3>
                  <p>{r.description}</p>
                  <div className="community-stats"><span>{r.stat}</span></div>
                  <a href={r.link} className="community-link" target="_blank" rel="noopener noreferrer">Join Now →</a>
                </div>
              ))}
            </div>

            <div className="community-events">
              <h3>Upcoming Events</h3>
              <div className="events-list">
                {[
                  { day:'15', month:'MAR', title:'Monthly Webinar: Advanced Bot Building', desc:'Learn advanced techniques for creating complex conversation flows', time:'2:00 PM EST', spots:'45 spots left' },
                  { day:'22', month:'MAR', title:'Community Q&A Session',                  desc:'Live Q&A with our product team and founders',                    time:'1:00 PM EST', spots:'Unlimited' },
                  { day:'29', month:'MAR', title:'Workshop: Integrations Deep Dive',       desc:'Hands-on workshop for setting up advanced integrations',          time:'3:00 PM EST', spots:'30 spots left' },
                ].map(e => (
                  <div key={e.day} className="event-item">
                    <div className="event-date"><span className="event-day">{e.day}</span><span className="event-month">{e.month}</span></div>
                    <div className="event-details">
                      <h4>{e.title}</h4><p>{e.desc}</p>
                      <div className="event-meta"><span>⏰ {e.time}</span><span>👥 {e.spots}</span></div>
                    </div>
                    <button className="event-rsvp" onClick={()=>alert('RSVP coming soon!')}>RSVP</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Contact Modal ── */}
      {showContactModal && (
        <div className="contact-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Contact Support</h2>
              <button className="close-modal" onClick={()=>setShowContactModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              {contactSuccess ? (
                <div style={{ textAlign:'center', padding:'30px' }}>
                  <div style={{ fontSize:'48px', marginBottom:'12px' }}>✅</div>
                  <h3 style={{ color:'#40e0d0' }}>Message sent!</h3>
                  <p style={{ color:'rgba(255,255,255,0.5)' }}>We'll get back to you within 2-4 hours.</p>
                </div>
              ) : (
                <>
                  <div className="contact-options" style={{ marginBottom:'20px' }}>
                    <div className="contact-option">
                      <div className="option-icon">📧</div>
                      <div className="option-details">
                        <h3>Email Support</h3>
                        <p>Get a response within 2-4 hours</p>
                        <div className="availability">Mon-Fri 9AM-8PM EST</div>
                      </div>
                    </div>
                  </div>
                  <div className="settings-form">
                    <div className="form-group">
                      <label style={{ color:'rgba(255,255,255,0.6)', fontSize:'13px', display:'block', marginBottom:'6px' }}>Your Message</label>
                      <textarea
                        className="form-textarea"
                        rows="5"
                        placeholder="Describe your issue or question..."
                        value={contactForm.message}
                        onChange={e => setContactForm(p => ({ ...p, message: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div style={{ marginTop:'16px', display:'flex', gap:'10px', justifyContent:'flex-end' }}>
                    <button className="cancel-btn" onClick={()=>setShowContactModal(false)}>Cancel</button>
                    <button className="start-chat-btn" onClick={handleContactSubmit} disabled={contactLoading || !contactForm.message.trim()}>
                      {contactLoading ? 'Sending...' : '📧 Send Message'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── New Ticket Modal ── */}
      {showTicketModal && (
        <div className="ticket-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Create Support Ticket</h2>
              <button className="close-modal" onClick={()=>setShowTicketModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="ticket-form">
                <div className="form-group">
                  <label>Subject <span style={{ color:'#ff6b6b' }}>*</span></label>
                  <input type="text" className="form-input" placeholder="Brief description of your issue" value={ticketForm.subject} onChange={e=>setTicketForm(p=>({...p,subject:e.target.value}))} />
                </div>
                <div className="form-row">
                  <div className="form-group half">
                    <label>Category</label>
                    <select className="form-select" value={ticketForm.category} onChange={e=>setTicketForm(p=>({...p,category:e.target.value}))}>
                      {['Technical Issue','Billing Question','Account Help','Feature Request','Bug Report','Other'].map(c=><option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="form-group half">
                    <label>Priority</label>
                    <select className="form-select" value={ticketForm.priority} onChange={e=>setTicketForm(p=>({...p,priority:e.target.value}))}>
                      {['Low','Medium','High','Urgent'].map(p=><option key={p}>{p}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Description <span style={{ color:'#ff6b6b' }}>*</span></label>
                  <textarea className="form-textarea" rows="6" placeholder="Please provide detailed information about your issue..." value={ticketForm.description} onChange={e=>setTicketForm(p=>({...p,description:e.target.value}))} />
                </div>
                <div className="form-group">
                  <label>Attachments (Optional)</label>
                  <div className="file-upload" onClick={()=>fileInputRef.current?.click()} style={{ cursor:'pointer' }}>
                    <input type="file" ref={fileInputRef} style={{ display:'none' }} multiple onChange={e=>setTicketFiles(Array.from(e.target.files))} />
                    <label className="file-upload-label" style={{ cursor:'pointer' }}>
                      <span className="upload-icon">📎</span>
                      <span>{ticketFiles.length > 0 ? `${ticketFiles.length} file(s) selected` : 'Click to upload or drag and drop'}</span>
                      <span className="file-hint">Max 10MB per file</span>
                    </label>
                  </div>
                </div>
                <label className="checkbox-label" style={{ display:'flex', gap:'8px', alignItems:'center', cursor:'pointer' }}>
                  <input type="checkbox" checked={ticketForm.includeLogs} onChange={e=>setTicketForm(p=>({...p,includeLogs:e.target.checked}))} style={{ accentColor:'#40e0d0' }} />
                  <span>Include system logs and diagnostics</span>
                </label>
                {ticketError && <div style={{ color:'#ff6b6b', fontSize:'13px', marginTop:'10px', background:'rgba(255,68,68,0.1)', padding:'8px 12px', borderRadius:'8px' }}>{ticketError}</div>}
              </div>
            </div>
            <div className="modal-footer">
              <button className="cancel-btn" onClick={()=>setShowTicketModal(false)}>Cancel</button>
              <button className="submit-ticket-btn" onClick={handleSubmitTicket} disabled={ticketLoading}>
                {ticketLoading ? '⏳ Submitting...' : '🎫 Submit Ticket'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HelpSupport;