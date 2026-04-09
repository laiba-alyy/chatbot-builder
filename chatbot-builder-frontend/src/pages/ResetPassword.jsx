// src/pages/ResetPassword.jsx
import React, { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import './ResetPassword.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const calcStrength = (pass) => {
  let s = 0;
  if (pass.length >= 8)          s += 25;
  if (/[a-z]/.test(pass))        s += 25;
  if (/[A-Z]/.test(pass))        s += 25;
  if (/[0-9]/.test(pass))        s += 15;
  if (/[$@#&!]/.test(pass))      s += 10;
  return Math.min(s, 100);
};

const strengthMeta = (s) => {
  if (s < 30) return { label:'Weak',  color:'#ff6b6b' };
  if (s < 60) return { label:'Fair',  color:'#ffa444' };
  if (s < 80) return { label:'Good',  color:'#40e0d0' };
  return            { label:'Strong', color:'#6464ff' };
};

const ResetPassword = () => {
  const navigate  = useNavigate();
  const { token } = useParams();           // present when coming from email link

  const [step, setStep]                   = useState(token ? 'reset' : 'request');
  const [email, setEmail]                 = useState('');
  const [password, setPassword]           = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw]               = useState(false);
  const [showCPw, setShowCPw]             = useState(false);
  const [isLoading, setIsLoading]         = useState(false);
  const [errors, setErrors]               = useState({});
  const [apiError, setApiError]           = useState('');

  const strength = calcStrength(password);
  const { label: strengthLabel, color: strengthColor } = strengthMeta(strength);

  // ─── Request reset email ──────────────────────────────────────────────────
  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    const errs = {};
    if (!email)                          errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = 'Please enter a valid email';
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/forgot-password`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email }),
      });
      const data = await res.json();
      // Always move to "sent" even on 404 — avoids email enumeration
      if (!res.ok && res.status !== 404) {
        setApiError(data.message || 'Something went wrong. Please try again.');
      } else {
        setStep('sent');
      }
    } catch {
      setApiError('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Resend email ──────────────────────────────────────────────────────────
  const handleResend = async () => {
    setIsLoading(true);
    setApiError('');
    try {
      await fetch(`${API_URL}/auth/forgot-password`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email }),
      });
    } catch {}
    finally { setIsLoading(false); }
    // Always show sent again
    setStep('request');
    setTimeout(() => setStep('sent'), 50);
  };

  // ─── Submit new password ───────────────────────────────────────────────────
  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    const errs = {};
    if (!password)                  errs.password = 'Password is required';
    else if (password.length < 8)   errs.password = 'Password must be at least 8 characters';
    else if (strength < 60)         errs.password = 'Password is too weak';
    if (!confirmPassword)           errs.confirmPassword = 'Please confirm your password';
    else if (password !== confirmPassword) errs.confirmPassword = 'Passwords do not match';
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/reset-password/${token}`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) {
        // Token expired or invalid
        if (res.status === 400 || res.status === 401) {
          setStep('invalid');
        } else {
          setApiError(data.message || 'Failed to reset password. Please try again.');
        }
      } else {
        setStep('success');
      }
    } catch {
      setApiError('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Steps ─────────────────────────────────────────────────────────────────
  const renderRequest = () => (
    <div className="reset-card">
      <div className="reset-header">
        <h2>Reset your password</h2>
        <p>Enter your email address and we'll send you instructions to reset your password.</p>
      </div>

      <form onSubmit={handleRequestSubmit} className="reset-form">
        <div className="form-group">
          <label htmlFor="email">Email Address</label>
          <div className="input-wrapper">
            <span className="input-icon">✉️</span>
            <input
              type="email"
              id="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setErrors({}); setApiError(''); }}
              placeholder="you@example.com"
              className={errors.email ? 'error' : ''}
              disabled={isLoading}
            />
          </div>
          {errors.email && <span className="error-message">{errors.email}</span>}
        </div>

        {apiError && <div className="api-error">{apiError}</div>}

        <button type="submit" className="submit-btn" disabled={isLoading}>
          {isLoading ? <><span className="loader"></span>Sending...</> : 'Send Reset Instructions'}
        </button>
      </form>

      <div className="reset-footer">
        <Link to="/login" className="back-link">← Back to Login</Link>
      </div>
    </div>
  );

  const renderSent = () => (
    <div className="reset-card">
      <div className="success-icon">✓</div>
      <div className="reset-header">
        <h2>Check your email</h2>
        <p>We've sent password reset instructions to:</p>
        <strong className="sent-email">{email}</strong>
      </div>

      <div className="info-box">
        <span className="info-icon">⏱️</span>
        <p>The link will expire in 1 hour. If you don't see the email, check your spam folder.</p>
      </div>

      <div className="reset-actions">
        <button className="resend-btn" onClick={handleResend} disabled={isLoading}>
          {isLoading ? 'Sending...' : 'Resend Email'}
        </button>
        <Link to="/login" className="back-to-login">Back to Login</Link>
      </div>
    </div>
  );

  const renderReset = () => (
    <div className="reset-card">
      <div className="reset-header">
        <h2>Create new password</h2>
        <p>Please enter a new password for your account.</p>
      </div>

      <form onSubmit={handleResetSubmit} className="reset-form">
        {/* New password */}
        <div className="form-group">
          <label htmlFor="password">New Password</label>
          <div className="input-wrapper">
            <span className="input-icon">🔒</span>
            <input
              type={showPw ? 'text' : 'password'}
              id="password"
              value={password}
              onChange={e => { setPassword(e.target.value); setErrors({}); setApiError(''); }}
              placeholder="••••••••"
              className={errors.password ? 'error' : ''}
              disabled={isLoading}
            />
            <button type="button" className="password-toggle" onClick={() => setShowPw(p => !p)}>
              {showPw ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>

          {password && (
            <div className="password-strength">
              <div className="strength-bar">
                <div className="strength-fill" style={{ width:`${strength}%`, backgroundColor:strengthColor }}></div>
              </div>
              <span className="strength-text" style={{ color:strengthColor }}>{strengthLabel}</span>
            </div>
          )}

          {errors.password && <span className="error-message">{errors.password}</span>}

          <ul className="password-requirements">
            <li className={password.length >= 8 ? 'met' : ''}>At least 8 characters</li>
            <li className={/[a-z]/.test(password)   ? 'met' : ''}>One lowercase letter</li>
            <li className={/[A-Z]/.test(password)   ? 'met' : ''}>One uppercase letter</li>
            <li className={/[0-9]/.test(password)   ? 'met' : ''}>One number</li>
            <li className={/[$@#&!]/.test(password) ? 'met' : ''}>One special character ($@#&!)</li>
          </ul>
        </div>

        {/* Confirm password */}
        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm Password</label>
          <div className="input-wrapper">
            <span className="input-icon">🔒</span>
            <input
              type={showCPw ? 'text' : 'password'}
              id="confirmPassword"
              value={confirmPassword}
              onChange={e => { setConfirmPassword(e.target.value); setErrors(errs => ({ ...errs, confirmPassword:'' })); }}
              placeholder="••••••••"
              className={errors.confirmPassword ? 'error' : ''}
              disabled={isLoading}
            />
            <button type="button" className="password-toggle" onClick={() => setShowCPw(p => !p)}>
              {showCPw ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
          {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
        </div>

        {apiError && <div className="api-error">{apiError}</div>}

        <button type="submit" className="submit-btn" disabled={isLoading}>
          {isLoading ? <><span className="loader"></span>Resetting...</> : 'Reset Password'}
        </button>
      </form>
    </div>
  );

  const renderSuccess = () => (
    <div className="reset-card">
      <div className="success-icon">✓</div>
      <div className="reset-header">
        <h2>Password reset successful!</h2>
        <p>Your password has been changed successfully. You can now log in with your new password.</p>
      </div>
      <button className="login-now-btn" onClick={() => navigate('/login')}>Log In Now</button>
      <div className="reset-footer">
        <Link to="/" className="back-home">Return to Homepage</Link>
      </div>
    </div>
  );

  const renderInvalid = () => (
    <div className="reset-card">
      <div className="error-icon">⚠️</div>
      <div className="reset-header">
        <h2>Invalid or expired link</h2>
        <p>The password reset link you used is invalid or has expired. Reset links are only valid for 1 hour.</p>
      </div>
      <button className="request-new-btn" onClick={() => { setStep('request'); navigate('/reset-password'); }}>
        Request New Link
      </button>
      <div className="reset-footer">
        <Link to="/login" className="back-link">← Back to Login</Link>
      </div>
    </div>
  );

  return (
    <div className="reset-password-page">
      <div className="reset-bg-glow"></div>
      <div className="reset-neural-grid"></div>
      <div className="reset-orbs">
        <div className="orb orb1"></div>
        <div className="orb orb2"></div>
        <div className="orb orb3"></div>
      </div>

      <div className="reset-container">
        <Link to="/" className="reset-logo">
          <span className="logo-text">BuildSmart</span>
          <div className="logo-glow"></div>
        </Link>

        <div className="reset-card-container">
          {step === 'request' && renderRequest()}
          {step === 'sent'    && renderSent()}
          {step === 'reset'   && renderReset()}
          {step === 'success' && renderSuccess()}
          {step === 'invalid' && renderInvalid()}
        </div>

        <div className="security-note">
          <span className="security-icon">🔒</span>
          <span>Your information is encrypted and secure</span>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;