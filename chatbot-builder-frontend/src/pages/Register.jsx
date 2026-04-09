// src/pages/Register.jsx
import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import useAuth  from '../hooks/useAuth';
import './Register.css';

const Register = () => {
  const navigate = useNavigate();
  const { register, user } = useAuth();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    company: '',
    agreeTerms: false
  });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState(''); // ✅ backend error
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  // Already logged in — redirect to dashboard
  if (user) return <Navigate to="/dashboard" replace />;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
    if (errors[name]) setErrors({ ...errors, [name]: '' });
    if (apiError) setApiError('');
    if (name === 'password') calculatePasswordStrength(value);
  };

  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (password.match(/[a-z]+/)) strength += 25;
    if (password.match(/[A-Z]+/)) strength += 25;
    if (password.match(/[0-9]+/)) strength += 15;
    if (password.match(/[$@#&!]+/)) strength += 10;
    setPasswordStrength(strength);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Please enter a valid email';
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    if (!formData.agreeTerms) newErrors.agreeTerms = 'You must agree to the terms';
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateForm();

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    setApiError('');

    try {
      await register(formData.fullName, formData.email, formData.password);
      navigate('/dashboard');
    } catch (err) {
      setApiError(err.message || 'Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getStrengthColor = () => {
    if (passwordStrength < 30) return '#ff4444';
    if (passwordStrength < 60) return '#ffa444';
    if (passwordStrength < 80) return '#40e0d0';
    return '#6464ff';
  };

  const getStrengthText = () => {
    if (passwordStrength < 30) return 'Weak';
    if (passwordStrength < 60) return 'Fair';
    if (passwordStrength < 80) return 'Good';
    return 'Strong';
  };

  return (
    <section className="signup-section">
      <div className="signup-bg-glow"></div>
      <div className="signup-neural-grid"></div>

      <div className="signup-floating-elements">
        <div className="floating-element element1"></div>
        <div className="floating-element element2"></div>
        <div className="floating-element element3"></div>
        <div className="floating-element element4"></div>
        <div className="floating-element element5"></div>
      </div>

      <div className="signup-container">
        {/* Left Side */}
        <div className="signup-welcome">
          <div className="welcome-content">
            <div className="welcome-badge">
              <span className="badge-icon">🚀</span>
              Join the Future
            </div>

            <h1 className="welcome-title">
              Start Building
              <span className="gradient-text"> Smarter Bots</span>
              <span className="welcome-title-small">Today</span>
            </h1>

            <p className="welcome-description">
              Create your free account and get access to our AI-powered no-code platform.
              No credit card required.
            </p>

            <div className="benefits-list">
              {[
                { title: '14-day free trial', desc: 'Full access to all features' },
                { title: 'No credit card', desc: 'Start building immediately' },
                { title: 'Cancel anytime', desc: 'No contracts or commitments' },
                { title: '24/7 support', desc: "We're here to help you grow" }
              ].map((b, i) => (
                <div className="benefit-item" key={i}>
                  <div className="benefit-icon">✓</div>
                  <div className="benefit-text">
                    <h4>{b.title}</h4>
                    <p>{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="welcome-testimonial">
              <div className="testimonial-avatars">
                {[1, 2, 3, 4].map(i => (
                  <img key={i} src={`https://i.pravatar.cc/32?img=${i}`} alt="user" />
                ))}
              </div>
              <p className="testimonial-text">
                <span className="highlight">10,000+</span> developers already building
              </p>
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="signup-form-panel">
          <div className="form-glow"></div>

          <div className="form-header">
            <h2>Create Account</h2>
            <p>Get started with your free trial</p>
          </div>

          {/* social signup buttons removed until backend is available */}
          <div className="divider">
            <span>or sign up with email</span>
          </div>

          {/* ✅ API Error */}
          {apiError && (
            <div style={{
              background: 'rgba(255, 68, 68, 0.1)',
              border: '1px solid rgba(255, 68, 68, 0.3)',
              color: '#ff6b6b',
              padding: '10px 14px',
              borderRadius: '8px',
              marginBottom: '16px',
              fontSize: '14px'
            }}>
              {apiError}
            </div>
          )}

          <form className="signup-form" onSubmit={handleSubmit}>
            {/* Full Name */}
            <div className="form-group">
              <label htmlFor="fullName">Full Name <span className="required">*</span></label>
              <div className="input-wrapper">
                <span className="input-icon">👤</span>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className={errors.fullName ? 'error' : ''}
                />
                <div className="input-glow"></div>
              </div>
              {errors.fullName && <span className="error-message">{errors.fullName}</span>}
            </div>

            {/* Email */}
            <div className="form-group">
              <label htmlFor="email">Email Address <span className="required">*</span></label>
              <div className="input-wrapper">
                <span className="input-icon">✉️</span>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="hello@company.com"
                  className={errors.email ? 'error' : ''}
                />
                <div className="input-glow"></div>
              </div>
              {errors.email && <span className="error-message">{errors.email}</span>}
            </div>

            {/* Company */}
            <div className="form-group">
              <label htmlFor="company">Company (Optional)</label>
              <div className="input-wrapper">
                <span className="input-icon">🏢</span>
                <input
                  type="text"
                  id="company"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  placeholder="Your Company"
                />
                <div className="input-glow"></div>
              </div>
            </div>

            {/* Password */}
            <div className="form-group">
              <label htmlFor="password">Password <span className="required">*</span></label>
              <div className="input-wrapper">
                <span className="input-icon">🔒</span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className={errors.password ? 'error' : ''}
                />
                <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
                <div className="input-glow"></div>
              </div>

              {formData.password && (
                <div className="password-strength">
                  <div className="strength-bar">
                    <div className="strength-fill" style={{ width: `${passwordStrength}%`, backgroundColor: getStrengthColor() }}></div>
                  </div>
                  <span className="strength-text" style={{ color: getStrengthColor() }}>{getStrengthText()}</span>
                </div>
              )}
              {errors.password && <span className="error-message">{errors.password}</span>}
            </div>

            {/* Confirm Password */}
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password <span className="required">*</span></label>
              <div className="input-wrapper">
                <span className="input-icon">🔒</span>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className={errors.confirmPassword ? 'error' : ''}
                />
                <button type="button" className="password-toggle" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                  {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                </button>
                <div className="input-glow"></div>
              </div>
              {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
            </div>

            {/* Terms */}
            <div className="form-group checkbox-group">
              <label className="checkbox-container">
                <input
                  type="checkbox"
                  name="agreeTerms"
                  checked={formData.agreeTerms}
                  onChange={handleChange}
                />
                <span className="checkbox-custom"></span>
                <span className="checkbox-label">
                  I agree to the <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>
                </span>
              </label>
              {errors.agreeTerms && <span className="error-message">{errors.agreeTerms}</span>}
            </div>

            <button type="submit" className="signup-submit-btn" disabled={isLoading}>
              {isLoading ? (
                <><span className="loader"></span> Creating Account...</>
              ) : (
                <>Create Free Account <span className="btn-icon">→</span></>
              )}
              <div className="btn-glow"></div>
            </button>

            <div className="login-link">
              <p>
                Already have an account?{' '}
                <a onClick={() => navigate('/login')} style={{ cursor: 'pointer' }}>Sign in</a>
              </p>
            </div>
          </form>

          <div className="security-badge">
            <span className="security-icon">🔒</span>
            <span>Your information is encrypted and secure</span>
          </div>
        </div>
      </div>

      <div className="signup-progress">
        <div className="progress-step active">
          <span className="step-number">1</span>
          <span className="step-label">Account</span>
        </div>
        <div className="progress-line"></div>
        <div className="progress-step">
          <span className="step-number">2</span>
          <span className="step-label">Preferences</span>
        </div>
        <div className="progress-line"></div>
        <div className="progress-step">
          <span className="step-number">3</span>
          <span className="step-label">Complete</span>
        </div>
      </div>
    </section>
  );
};

export default Register;
