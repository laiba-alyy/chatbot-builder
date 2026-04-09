// src/pages/Login.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const { login, user } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // ✅ FIX: Navigate once user state is actually set after login
  useEffect(() => {
    if (user) navigate('/dashboard', { replace: true });
  }, [user]);

  // Already logged in — redirect to dashboard
  if (user) return <Navigate to="/dashboard" replace />;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
    if (errors[name]) setErrors({ ...errors, [name]: '' });
    if (apiError) setApiError('');
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
    if (!formData.password) newErrors.password = 'Password is required';
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
      await login(formData.email, formData.password);
      // ✅ FIX: Removed navigate('/dashboard') from here
      //    useEffect above handles navigation once user state is set
    } catch (err) {
      setApiError(err.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="auth-section">
      {/* Background Effects */}
      <div className="auth-bg-glow"></div>
      <div className="auth-neural-grid"></div>

      {/* Animated Orbs */}
      <div className="auth-orbs">
        <div className="orb orb1"></div>
        <div className="orb orb2"></div>
        <div className="orb orb3"></div>
        <div className="orb orb4"></div>
      </div>

      <div className="auth-container">
        {/* Left Side - Brand Showcase */}
        <div className="auth-brand">
          <div className="brand-content">
            <div className="brand-logo">
              <span className="logo-text">BuildSmart</span>
              <div className="logo-glow"></div>
            </div>

            <h1 className="brand-title">
              Welcome to the Future of
              <span className="gradient-text"> AI Development</span>
            </h1>

            <p className="brand-description">
              Join thousands of developers and businesses building intelligent bots with our no-code platform.
            </p>

            <div className="brand-features">
              <div className="brand-feature">
                <div className="feature-icon">🚀</div>
                <div className="feature-text">
                  <h4>Lightning Fast</h4>
                  <p>Deploy bots in minutes, not months</p>
                </div>
              </div>
              <div className="brand-feature">
                <div className="feature-icon">🔒</div>
                <div className="feature-text">
                  <h4>Enterprise Security</h4>
                  <p>Your data is always protected</p>
                </div>
              </div>
              <div className="brand-feature">
                <div className="feature-icon">💡</div>
                <div className="feature-text">
                  <h4>No-Code Required</h4>
                  <p>Build visually with drag & drop</p>
                </div>
              </div>
            </div>

            <div className="brand-testimonials">
              <div className="testimonial-avatars">
                <img src="https://i.pravatar.cc/40?img=1" alt="user" />
                <img src="https://i.pravatar.cc/40?img=2" alt="user" />
                <img src="https://i.pravatar.cc/40?img=3" alt="user" />
                <img src="https://i.pravatar.cc/40?img=4" alt="user" />
                <span className="avatar-count">+10k</span>
              </div>
              <p className="brand-stats">Trusted by 10,000+ companies worldwide</p>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="auth-form-container">
          <div className="form-glow"></div>

          <div className="form-header">
            <h2>Welcome Back</h2>
            <p>Please enter your details to sign in</p>
          </div>

          {/* ✅ API Error Message */}
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

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <div className="input-wrapper">
                <span className="input-icon">✉️</span>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="hello@example.com"
                  className={errors.email ? 'error' : ''}
                />
                <div className="input-glow"></div>
              </div>
              {errors.email && <span className="error-message">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
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
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
                <div className="input-glow"></div>
              </div>
              {errors.password && <span className="error-message">{errors.password}</span>}
            </div>

            <div className="form-options">
              <label className="checkbox-container">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                />
                <span className="checkbox-custom"></span>
                <span className="checkbox-label">Remember me</span>
              </label>
              <a href="#" className="forgot-password">Forgot password?</a>
            </div>

            <button
              type="submit"
              className="auth-submit-btn"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="loader"></span>
              ) : (
                <>
                  Sign In
                  <span className="btn-icon">→</span>
                </>
              )}
              <div className="btn-glow"></div>
            </button>
          </form>

          <div className="auth-footer">
            <p>
              Don't have an account?
              <button onClick={() => navigate('/register')} className="toggle-mode">
                Sign up
              </button>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Login;