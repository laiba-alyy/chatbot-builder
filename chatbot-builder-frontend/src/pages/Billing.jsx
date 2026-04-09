// src/pages/Billing.jsx
import React, { useState, useEffect } from 'react';
import { billingAPI, botsAPI, teamAPI } from '../services/api';
import './Billing.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const token = () => localStorage.getItem('token');

const fmt = (n) => new Intl.NumberFormat('en-US', { style:'currency', currency:'USD', minimumFractionDigits:0 }).format(n);

// ─── Static plan catalogue ────────────────────────────────────────────────────
const PLANS = [
  {
    id: 'free', name: 'Free', price: 0, yearlyPrice: 0, icon: '🌟', color: '#40e0d0',
    features: [
      { name:'1 bot', included:true },{ name:'500 conversations/month', included:true },
      { name:'Basic analytics', included:true },{ name:'Email support', included:true },
      { name:'Custom branding', included:false },{ name:'Advanced integrations', included:false },
      { name:'Team members', included:false },{ name:'API access', included:false },
    ],
    limits: { bots:1, conversations:500, teamMembers:1, integrations:0 },
  },
  {
    id: 'starter', name: 'Starter', price: 19, yearlyPrice: 190, icon: '🚀', color: '#6464ff',
    features: [
      { name:'3 bots', included:true },{ name:'2,500 conversations/month', included:true },
      { name:'Advanced analytics', included:true },{ name:'Priority email support', included:true },
      { name:'Custom branding', included:false },{ name:'Advanced integrations', included:true },
      { name:'Team members (2)', included:true },{ name:'API access', included:false },
    ],
    limits: { bots:3, conversations:2500, teamMembers:2, integrations:5 },
  },
  {
    id: 'pro', name: 'Professional', price: 49, yearlyPrice: 490, icon: '⚡', color: '#9333ea', popular: true,
    features: [
      { name:'10 bots', included:true },{ name:'10,000 conversations/month', included:true },
      { name:'Advanced analytics', included:true },{ name:'Priority support', included:true },
      { name:'Custom branding', included:true },{ name:'Advanced integrations', included:true },
      { name:'Team members (5)', included:true },{ name:'API access', included:true },
    ],
    limits: { bots:10, conversations:10000, teamMembers:5, integrations:20 },
  },
  {
    id: 'enterprise', name: 'Enterprise', price: 99, yearlyPrice: 990, icon: '🏢', color: '#ff6b6b',
    features: [
      { name:'Unlimited bots', included:true },{ name:'Unlimited conversations', included:true },
      { name:'Advanced analytics', included:true },{ name:'24/7 priority support', included:true },
      { name:'Custom branding', included:true },{ name:'Advanced integrations', included:true },
      { name:'Unlimited team members', included:true },{ name:'API access', included:true },
    ],
    limits: { bots:-1, conversations:-1, teamMembers:-1, integrations:-1 },
  },
];

const getPlan = (id) => PLANS.find(p => p.id === id) || PLANS[2];

const UsageBar = ({ label, used, limit, unit = '' }) => {
  const unlimited = limit === -1;
  const pct       = unlimited ? 0 : Math.min((used / limit) * 100, 100);
  const warn      = pct >= 90;
  const color     = pct >= 90 ? '#ff6b6b' : pct >= 70 ? '#f59e0b' : '#40e0d0';
  return (
    <div className="usage-item">
      <div className="usage-header">
        <span className="usage-label">{label}</span>
        <span className="usage-value">
          {typeof used === 'number' ? used.toLocaleString() : used}
          {unit ? ` ${unit}` : ''} /&nbsp;
          {unlimited ? '∞' : (typeof limit === 'number' ? limit.toLocaleString() : limit)}{unit ? ` ${unit}` : ''}
        </span>
      </div>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width:`${pct}%`, background: color }}></div>
      </div>
      {warn && !unlimited && <span style={{ fontSize:'11px', color:'#ff6b6b' }}>⚠️ Near limit</span>}
    </div>
  );
};

const Billing = () => {
  const [activeTab, setActiveTab]           = useState('plans');
  const [billingCycle, setBillingCycle]     = useState('monthly');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCancelModal, setShowCancelModal]   = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [selectedPlan, setSelectedPlan]     = useState(null);
  const [cancelReason, setCancelReason]     = useState('Too expensive');

  // Data
  const [subscription, setSubscription]     = useState(null);
  const [invoices, setInvoices]             = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [usage, setUsage]                   = useState(null);
  const [loading, setLoading]               = useState(true);

  // Checkout state
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError]     = useState('');

  // Cancel state
  const [cancelLoading, setCancelLoading]   = useState(false);

  // ─── Load on mount ─────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [subRes, usageRes] = await Promise.allSettled([
          billingAPI.getSubscription(),
          billingAPI.getUsage(),
        ]);
        if (subRes.status === 'fulfilled') {
          const s = subRes.value.data;
          setSubscription(s);
          setBillingCycle(s.billingCycle || 'monthly');
        }
        if (usageRes.status === 'fulfilled') setUsage(usageRes.value.data);
      } catch {}
      finally { setLoading(false); }
    };
    load();
  }, []);

  // Load invoices when tab opens
  useEffect(() => {
    if (activeTab !== 'invoices') return;
    billingAPI.getInvoices()
      .then(r => setInvoices(r.data?.invoices || r.data || []))
      .catch(() => {});
  }, [activeTab]);

  // Load payment methods when tab opens
  useEffect(() => {
    if (activeTab !== 'payment') return;
    fetch(`${API_URL}/billing/payment-methods`, { headers:{ Authorization:`Bearer ${token()}` } })
      .then(r => r.json())
      .then(d => setPaymentMethods(d.data || []))
      .catch(() => {});
  }, [activeTab]);

  // ─── Select plan → open modal or go to Stripe checkout ───────────────────
  const handlePlanSelect = (planId) => {
    if (planId === (subscription?.plan || 'free')) return;
    setSelectedPlan(planId);
    setCheckoutError('');
    setShowPaymentModal(true);
  };

  // ─── Stripe checkout ────────────────────────────────────────────────────────
  const handleCheckout = async () => {
    setCheckoutLoading(true);
    setCheckoutError('');
    try {
      const res = await billingAPI.createCheckout({
        plan:     selectedPlan,
        interval: billingCycle,
      });
      const { url, sessionId } = res.data;
      if (url) {
        // Redirect to Stripe hosted checkout
        window.location.href = url;
      } else if (sessionId) {
        // If Stripe.js is loaded separately
        alert('Redirect to Stripe checkout: ' + sessionId);
      } else {
        // No Stripe configured — optimistic local update for dev
        setSubscription(prev => ({ ...prev, plan: selectedPlan, billingCycle }));
        setShowPaymentModal(false);
        setShowSuccessModal(true);
        setTimeout(() => setShowSuccessModal(false), 3000);
      }
    } catch (err) {
      setCheckoutError(err.message || 'Failed to start checkout. Please try again.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  // ─── Cancel subscription ────────────────────────────────────────────────────
  const handleCancel = async () => {
    setCancelLoading(true);
    try {
      await billingAPI.cancelSubscription({ reason: cancelReason });
      setSubscription(prev => ({ ...prev, cancelAtPeriodEnd: true }));
      setShowCancelModal(false);
    } catch (err) {
      alert(err.message || 'Failed to cancel subscription');
    } finally {
      setCancelLoading(false);
    }
  };

  // ─── Remove payment method ─────────────────────────────────────────────────
  const handleRemovePayment = async (id) => {
    if (!window.confirm('Remove this payment method?')) return;
    try {
      await fetch(`${API_URL}/billing/payment-methods/${id}`, { method:'DELETE', headers:{ Authorization:`Bearer ${token()}` } });
      setPaymentMethods(prev => prev.filter(m => m.id !== id));
    } catch (err) { alert(err.message); }
  };

  // ─── Set default payment method ────────────────────────────────────────────
  const handleSetDefault = async (id) => {
    try {
      await fetch(`${API_URL}/billing/payment-methods/${id}/default`, { method:'PUT', headers:{ Authorization:`Bearer ${token()}` } });
      setPaymentMethods(prev => prev.map(m => ({ ...m, isDefault: m.id === id })));
    } catch (err) { alert(err.message); }
  };

  // ─── Download invoice ──────────────────────────────────────────────────────
  const handleDownloadInvoice = async (invoiceId, url) => {
    if (url && url !== '#') { window.open(url, '_blank'); return; }
    try {
      const res = await fetch(`${API_URL}/billing/invoices/${invoiceId}/download`, { headers:{ Authorization:`Bearer ${token()}` } });
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `invoice-${invoiceId}.pdf`; link.click();
    } catch (err) { alert(err.message); }
  };

  const currentPlanMeta = getPlan(subscription?.plan || 'free');

  // ─── Compute usage from real data + plan limits ────────────────────────────
  const planLimits  = currentPlanMeta.limits;
  const liveUsage   = {
    conversations: { used: usage?.conversations || 0,   limit: planLimits.conversations },
    bots:          { used: usage?.bots          || 0,   limit: planLimits.bots },
    teamMembers:   { used: usage?.teamMembers   || 0,   limit: planLimits.teamMembers },
    integrations:  { used: usage?.integrations  || 0,   limit: planLimits.integrations },
    storage:       { used: usage?.storageMB ? (usage.storageMB / 1024).toFixed(1) : 0, limit: 10, unit:'GB' },
    apiCalls:      { used: usage?.apiCalls      || 0,   limit: 100000 },
  };

  return (
    <div className="billing">
      {/* Header */}
      <div className="billing-header">
        <div>
          <h1>Billing & Subscription</h1>
          <p>Manage your plan, payment methods, and billing history</p>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign:'center', padding:'60px', color:'rgba(255,255,255,0.4)' }}>Loading billing info...</div>
      ) : (
        <>
          {/* Current Plan Card */}
          <div className="current-plan-card">
            <div className="plan-info">
              <div className="plan-icon" style={{ backgroundColor: currentPlanMeta.color + '20' }}>
                <span style={{ color: currentPlanMeta.color }}>{currentPlanMeta.icon}</span>
              </div>
              <div className="plan-details">
                <h2>{currentPlanMeta.name} Plan</h2>
                <div className="plan-price">
                  <span className="amount">{fmt(subscription?.amount || 0)}</span>
                  <span className="cycle">/{subscription?.billingCycle || 'month'}</span>
                </div>
                <div className="plan-status">
                  <span className={`status-badge ${subscription?.status || 'active'}`}>
                    {{ active:'✅ Active', past_due:'⚠️ Past Due', canceled:'❌ Canceled', trialing:'🔵 Trial' }[subscription?.status] || '✅ Active'}
                  </span>
                  {subscription?.cancelAtPeriodEnd && (
                    <span className="cancellation-notice">Cancels on {subscription.nextBilling?.slice(0,10)}</span>
                  )}
                  {subscription?.nextBilling && !subscription?.cancelAtPeriodEnd && (
                    <span style={{ fontSize:'12px', color:'rgba(255,255,255,0.4)', marginLeft:'10px' }}>
                      Next billing: {subscription.nextBilling.slice(0,10)}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="plan-actions">
              <button className="change-plan-btn" onClick={() => setActiveTab('plans')}>Change Plan</button>
              {!subscription?.cancelAtPeriodEnd && subscription?.plan !== 'free' && (
                <button className="cancel-plan-btn" onClick={() => setShowCancelModal(true)}>Cancel Subscription</button>
              )}
            </div>
          </div>

          {/* Usage Overview */}
          <div className="usage-overview">
            <h3>Usage Overview</h3>
            <div className="usage-grid">
              <UsageBar label="Conversations" used={liveUsage.conversations.used} limit={liveUsage.conversations.limit} />
              <UsageBar label="Bots"          used={liveUsage.bots.used}          limit={liveUsage.bots.limit} />
              <UsageBar label="Team Members"  used={liveUsage.teamMembers.used}   limit={liveUsage.teamMembers.limit} />
              <UsageBar label="Integrations"  used={liveUsage.integrations.used}  limit={liveUsage.integrations.limit} />
              <UsageBar label="Storage"       used={liveUsage.storage.used}       limit={liveUsage.storage.limit}  unit="GB" />
              <UsageBar label="API Calls"     used={liveUsage.apiCalls.used}      limit={liveUsage.apiCalls.limit} />
            </div>
          </div>

          {/* Tabs */}
          <div className="billing-tabs">
            {[['plans','📊','Plans'],['payment','💳','Payment Methods'],['invoices','📄','Invoices'],['usage','📈','Usage Details']].map(([id,icon,label])=>(
              <button key={id} className={`tab-btn ${activeTab===id?'active':''}`} onClick={()=>setActiveTab(id)}>
                <span className="tab-icon">{icon}</span>{label}
              </button>
            ))}
          </div>

          <div className="tab-content">

            {/* ── PLANS ── */}
            {activeTab === 'plans' && (
              <div className="plans-tab">
                <div className="billing-toggle">
                  <button className={`toggle-btn ${billingCycle==='monthly'?'active':''}`} onClick={()=>setBillingCycle('monthly')}>Monthly</button>
                  <button className={`toggle-btn ${billingCycle==='yearly'?'active':''}`}  onClick={()=>setBillingCycle('yearly')}>
                    Yearly <span className="save-badge">Save 20%</span>
                  </button>
                </div>

                <div className="plans-grid">
                  {PLANS.map(plan => {
                    const isCurrent = plan.id === (subscription?.plan || 'free');
                    return (
                      <div key={plan.id} className={`plan-card ${plan.popular?'popular':''} ${isCurrent?'selected':''}`} style={{ '--plan-color': plan.color }}>
                        {plan.popular && <div className="popular-badge">Most Popular</div>}
                        <div className="plan-card-header">
                          <div className="plan-icon-large" style={{ backgroundColor: plan.color+'20' }}>
                            <span style={{ color: plan.color }}>{plan.icon}</span>
                          </div>
                          <h3>{plan.name}</h3>
                          <div className="plan-card-price">
                            <span className="amount">{fmt(billingCycle==='monthly' ? plan.price : plan.yearlyPrice)}</span>
                            <span className="period">/{billingCycle==='monthly'?'mo':'yr'}</span>
                          </div>
                          {billingCycle==='yearly' && plan.price>0 && (
                            <div className="yearly-savings">Save {fmt(plan.price*12 - plan.yearlyPrice)}/year</div>
                          )}
                        </div>
                        <div className="plan-features">
                          {plan.features.map((f,i)=>(
                            <div key={i} className="feature-item">
                              <span className={`feature-icon ${f.included?'included':'excluded'}`}>{f.included?'✓':'✕'}</span>
                              <span className={`feature-name ${!f.included?'excluded':''}`}>{f.name}</span>
                            </div>
                          ))}
                        </div>
                        <button className="select-plan-btn" onClick={()=>handlePlanSelect(plan.id)} disabled={isCurrent}>
                          {isCurrent ? 'Current Plan' : plan.price === 0 ? 'Downgrade' : 'Select Plan'}
                        </button>
                      </div>
                    );
                  })}
                </div>

                <div className="enterprise-contact">
                  <h4>Need a custom plan?</h4>
                  <p>Contact us for enterprise pricing and custom requirements</p>
                  <button className="contact-sales-btn" onClick={() => window.open('mailto:sales@buildsmart.ai')}>Contact Sales</button>
                </div>
              </div>
            )}

            {/* ── PAYMENT METHODS ── */}
            {activeTab === 'payment' && (
              <div className="payment-tab">
                <div className="payment-methods">
                  <h3>Saved Payment Methods</h3>
                  {paymentMethods.length === 0 ? (
                    <div style={{ color:'rgba(255,255,255,0.3)', padding:'20px 0' }}>No payment methods on file.</div>
                  ) : paymentMethods.map(method => (
                    <div key={method.id} className="payment-method-card">
                      <div className="method-info">
                        <span className="card-icon">💳</span>
                        <div className="method-details">
                          <span className="card-type">{(method.brand || method.type || 'Card').toUpperCase()} •••• {method.last4}</span>
                          <span className="card-expiry">Expires {method.expMonth}/{method.expYear || method.expDate}</span>
                          {method.name && <span className="card-name">{method.name}</span>}
                        </div>
                        {method.isDefault && <span className="default-badge">Default</span>}
                      </div>
                      <div className="method-actions">
                        {!method.isDefault && <button className="method-action" onClick={()=>handleSetDefault(method.id)}>Set Default</button>}
                        <button className="method-action delete" onClick={()=>handleRemovePayment(method.id)}>Remove</button>
                      </div>
                    </div>
                  ))}
                  <button className="add-payment-btn" onClick={() => {
                    // Redirect to Stripe billing portal or a checkout session for adding a card
                    fetch(`${API_URL}/billing/portal`, { method:'POST', headers:{ Authorization:`Bearer ${token()}` } })
                      .then(r=>r.json())
                      .then(d=>{ if(d.url) window.location.href = d.url; })
                      .catch(()=>alert('Billing portal unavailable. Please contact support.'));
                  }}>
                    <span className="btn-icon">+</span>Add Payment Method
                  </button>
                </div>
              </div>
            )}

            {/* ── INVOICES ── */}
            {activeTab === 'invoices' && (
              <div className="invoices-tab">
                <h3>Billing History</h3>
                {invoices.length === 0 ? (
                  <div style={{ color:'rgba(255,255,255,0.3)', padding:'20px 0' }}>No invoices yet.</div>
                ) : (
                  <div className="invoices-list">
                    <table className="invoices-table">
                      <thead><tr><th>Invoice</th><th>Date</th><th>Amount</th><th>Status</th><th>Download</th></tr></thead>
                      <tbody>
                        {invoices.map(inv => (
                          <tr key={inv._id || inv.id}>
                            <td>{inv.invoiceNumber || inv.id || inv._id?.slice(-8)}</td>
                            <td>{inv.createdAt?.slice(0,10) || inv.date || '-'}</td>
                            <td>{fmt(inv.amount || 0)}</td>
                            <td><span className={`invoice-status ${inv.status}`}>{inv.status}</span></td>
                            <td>
                              {(inv.invoiceUrl || inv.pdf) ? (
                                <button onClick={()=>handleDownloadInvoice(inv._id||inv.id, inv.invoiceUrl||inv.pdf)} className="download-link" style={{ background:'none', border:'none', cursor:'pointer', color:'#40e0d0' }}>
                                  📥 PDF
                                </button>
                              ) : <span className="no-pdf">-</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <div className="tax-info"><p>Need a VAT receipt or have tax questions? <a href="mailto:support@buildsmart.ai">Contact support</a></p></div>
              </div>
            )}

            {/* ── USAGE DETAILS ── */}
            {activeTab === 'usage' && (
              <div className="usage-tab">
                <h3>Detailed Usage</h3>
                <div className="usage-details-grid">
                  {[
                    ['Conversations', liveUsage.conversations.used, liveUsage.conversations.limit, '', `Resets on ${subscription?.nextBilling?.slice(0,10) || '-'}`],
                    ['API Calls',     liveUsage.apiCalls.used,      liveUsage.apiCalls.limit,     '', 'Resets daily'],
                    ['Storage',       liveUsage.storage.used,       liveUsage.storage.limit,      'GB', ''],
                    ['Team Members',  liveUsage.teamMembers.used,   liveUsage.teamMembers.limit,  '', ''],
                    ['Bots',          liveUsage.bots.used,          liveUsage.bots.limit,         '', ''],
                    ['Integrations',  liveUsage.integrations.used,  liveUsage.integrations.limit, '', ''],
                  ].map(([label, used, limit, unit, note]) => {
                    const unlimited = limit === -1;
                    const pct       = unlimited ? 0 : Math.min((used / limit) * 100, 100);
                    const color     = pct >= 90 ? '#ff6b6b' : pct >= 70 ? '#f59e0b' : '#40e0d0';
                    return (
                      <div key={label} className="usage-detail-card">
                        <h4>{label}</h4>
                        <div className="detail-stats">
                          <span className="detail-used">{typeof used === 'number' ? used.toLocaleString() : used}{unit?' '+unit:''}</span>
                          <span className="detail-limit">/ {unlimited ? '∞' : (typeof limit === 'number' ? limit.toLocaleString() : limit)}{unit?' '+unit:''}</span>
                        </div>
                        <div className="progress-bar large">
                          <div className="progress-fill" style={{ width:`${pct}%`, background:color }}></div>
                        </div>
                        {note && <p className="reset-date">{note}</p>}
                      </div>
                    );
                  })}
                </div>
                <div className="usage-notes">
                  <h4>Notes</h4>
                  <ul>
                    <li>Usage resets on your billing date: {subscription?.nextBilling?.slice(0,10) || '-'}</li>
                    <li>Overage charges apply at $0.01 per additional conversation</li>
                    <li>You'll receive email notifications at 80%, 90%, and 100% usage</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Payment / Upgrade Modal ── */}
      {showPaymentModal && selectedPlan && (
        <div className="payment-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Confirm Plan Change</h2>
              <button className="close-modal" onClick={()=>setShowPaymentModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="order-summary">
                <h3>Order Summary</h3>
                <div className="summary-item"><span>Plan:</span><span className="summary-value">{getPlan(selectedPlan).name}</span></div>
                <div className="summary-item"><span>Billing:</span><span className="summary-value">{billingCycle === 'monthly' ? 'Monthly' : 'Yearly'}</span></div>
                <div className="summary-item total">
                  <span>Total:</span>
                  <span className="summary-value">
                    {fmt(billingCycle==='monthly' ? getPlan(selectedPlan).price : getPlan(selectedPlan).yearlyPrice)}
                    /{billingCycle==='monthly'?'mo':'yr'}
                  </span>
                </div>
              </div>

              <p style={{ color:'rgba(255,255,255,0.5)', fontSize:'13px', marginTop:'16px', lineHeight:'1.5' }}>
                You'll be redirected to our secure checkout page to complete your payment. Your subscription will be updated immediately after payment.
              </p>

              {checkoutError && (
                <div style={{ color:'#ff6b6b', background:'rgba(255,68,68,0.1)', border:'1px solid rgba(255,68,68,0.3)', borderRadius:'8px', padding:'10px 14px', marginTop:'14px', fontSize:'13px' }}>
                  {checkoutError}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="cancel-btn" onClick={()=>setShowPaymentModal(false)}>Cancel</button>
              <button className="pay-btn" onClick={handleCheckout} disabled={checkoutLoading}>
                {checkoutLoading
                  ? '⏳ Redirecting...'
                  : `Pay ${fmt(billingCycle==='monthly' ? getPlan(selectedPlan).price : getPlan(selectedPlan).yearlyPrice)}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Cancel Modal ── */}
      {showCancelModal && (
        <div className="cancel-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Cancel Subscription</h2>
              <button className="close-modal" onClick={()=>setShowCancelModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="warning-icon">⚠️</div>
              <h3>Are you sure?</h3>
              <p>Your subscription will be cancelled and you'll lose access to premium features at the end of your billing period ({subscription?.nextBilling?.slice(0,10)}).</p>
              <div className="cancel-options">
                {['Too expensive','Missing features','Not using enough','Other'].map(r=>(
                  <label key={r} className="radio-label">
                    <input type="radio" name="cancelReason" checked={cancelReason===r} onChange={()=>setCancelReason(r)} />
                    <span>{r}</span>
                  </label>
                ))}
              </div>
              <div className="retry-offer">
                <h4>Wait! Before you go...</h4>
                <p>Would you consider:</p>
                <ul>
                  <li>Downgrading to a lower plan?</li>
                  <li>Speaking with our support team?</li>
                </ul>
              </div>
            </div>
            <div className="modal-footer">
              <button className="keep-plan-btn" onClick={()=>setShowCancelModal(false)}>Keep My Plan</button>
              <button className="confirm-cancel-btn" onClick={handleCancel} disabled={cancelLoading}>
                {cancelLoading ? '⏳ Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Success Modal ── */}
      {showSuccessModal && (
        <div className="success-modal">
          <div className="modal-content small">
            <div className="success-icon">✓</div>
            <h3>Plan Updated!</h3>
            <p>Your subscription has been updated successfully.</p>
            <button className="close-success-btn" onClick={()=>setShowSuccessModal(false)}>Done</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Billing;