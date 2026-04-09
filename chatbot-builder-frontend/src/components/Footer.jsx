import React, { useState } from 'react';
import './Footer.css';

const Footer = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    message: ''
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission here
    console.log('Form submitted:', formData);
    setIsSubmitted(true);
    setTimeout(() => setIsSubmitted(false), 3000);
    setFormData({ name: '', email: '', company: '', message: '' });
  };

  const quickLinks = [
    { name: 'Home', link: '#' },
    { name: 'Features', link: '#features' },
    { name: 'Testimonials', link: '#testimonials' },
    { name: 'Pricing', link: '#pricing' },
    { name: 'Blog', link: '#blog' }
  ];

  const solutions = [
    { name: 'E-commerce Bots', link: '#' },
    { name: 'Real Estate Bots', link: '#' },
    { name: 'SaaS Assistants', link: '#' },
    { name: 'Healthcare Bots', link: '#' },
    { name: 'Custom Solutions', link: '#' }
  ];

  const resources = [
    { name: 'Documentation', link: '#' },
    { name: 'API Reference', link: '#' },
    { name: 'Tutorials', link: '#' },
    { name: 'Community', link: '#' },
    { name: 'Support', link: '#' }
  ];

  const socialIcons = [
    { name: 'Twitter', icon: '𝕏', link: '#', color: '#40e0d0' },
    { name: 'LinkedIn', icon: 'in', link: '#', color: '#6464ff' },
    { name: 'GitHub', icon: '⌨️', link: '#', color: '#9333ea' },
    { name: 'Discord', icon: '💬', link: '#', color: '#40e0d0' },
    { name: 'YouTube', icon: '▶', link: '#', color: '#6464ff' }
  ];

  return (
    <footer className="contact-footer-section">
      {/* Background Effects */}
      <div className="footer-bg-glow"></div>
      <div className="footer-neural-grid"></div>
      
      {/* Animated Waves */}
      <div className="footer-waves">
        <div className="wave wave1"></div>
        <div className="wave wave2"></div>
        <div className="wave wave3"></div>
      </div>

      <div className="footer-container">
        {/* Contact Section */}
        <div className="contact-section">
          <div className="contact-header">
            <div className="contact-badge">
              <span className="badge-icon">📬</span>
              Get In Touch
            </div>
            <h2 className="contact-title">
              Ready to <span className="gradient-text">Transform</span> Your Business?
            </h2>
            <p className="contact-subtitle">
              Join thousands of companies already building smarter bots. 
              Get started today with a free consultation.
            </p>
          </div>

          <div className="contact-wrapper">
            {/* Contact Form */}
            <div className="contact-form-container">
              <div className="form-glow"></div>
              <form className="contact-form" onSubmit={handleSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="name">Full Name</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="John Doe"
                      required
                    />
                    <div className="input-glow"></div>
                  </div>
                  <div className="form-group">
                    <label htmlFor="email">Email Address</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="john@company.com"
                      required
                    />
                    <div className="input-glow"></div>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="company">Company Name</label>
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

                <div className="form-group">
                  <label htmlFor="message">Message</label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Tell us about your project..."
                    rows="5"
                    required
                  ></textarea>
                  <div className="input-glow"></div>
                </div>

                <button type="submit" className="submit-btn">
                  <span>Send Message</span>
                  <span className="btn-icon">→</span>
                  <div className="btn-glow"></div>
                </button>

                {isSubmitted && (
                  <div className="success-message">
                    <span className="success-icon">✓</span>
                    Message sent successfully! We'll get back to you soon.
                  </div>
                )}
              </form>
            </div>

            {/* Contact Info Cards */}
            <div className="contact-info">
              <div className="info-card">
                <div className="info-icon" style={{ background: 'linear-gradient(135deg, #40e0d020, #40e0d005)' }}>
                  <span className="icon">📧</span>
                </div>
                <h4>Email Us</h4>
                <p>hello@buildsmart.com</p>
                <p>support@buildsmart.com</p>
              </div>

              <div className="info-card">
                <div className="info-icon" style={{ background: 'linear-gradient(135deg, #6464ff20, #6464ff05)' }}>
                  <span className="icon">📞</span>
                </div>
                <h4>Call Us</h4>
                <p>+1 (800) 123-4567</p>
                <p>Mon-Fri, 9am-6pm EST</p>
              </div>

              <div className="info-card">
                <div className="info-icon" style={{ background: 'linear-gradient(135deg, #9333ea20, #9333ea05)' }}>
                  <span className="icon">📍</span>
                </div>
                <h4>Visit Us</h4>
                <p>123 AI Avenue</p>
                <p>San Francisco, CA 94105</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Links */}
        <div className="footer-links-section">
          <div className="footer-grid">
            {/* Company Info */}
            <div className="footer-col company-info">
              <div className="footer-logo">
                <span className="logo-text">BuildSmart</span>
                <div className="logo-glow"></div>
              </div>
              <p className="company-description">
                Build smarter bots in minutes with our AI-powered no-code platform. 
                Empowering businesses to create intelligent conversational experiences.
              </p>
              <div className="social-links">
                {socialIcons.map((social, index) => (
                  <a
                    key={index}
                    href={social.link}
                    className="social-link"
                    style={{ '--social-color': social.color }}
                  >
                    <span className="social-icon">{social.icon}</span>
                    <div className="social-glow"></div>
                  </a>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div className="footer-col">
              <h4 className="footer-col-title">Quick Links</h4>
              <ul className="footer-links">
                {quickLinks.map((link, index) => (
                  <li key={index}>
                    <a href={link.link} className="footer-link">
                      <span className="link-arrow">→</span>
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Solutions */}
            <div className="footer-col">
              <h4 className="footer-col-title">Solutions</h4>
              <ul className="footer-links">
                {solutions.map((link, index) => (
                  <li key={index}>
                    <a href={link.link} className="footer-link">
                      <span className="link-arrow">→</span>
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Resources */}
            <div className="footer-col">
              <h4 className="footer-col-title">Resources</h4>
              <ul className="footer-links">
                {resources.map((link, index) => (
                  <li key={index}>
                    <a href={link.link} className="footer-link">
                      <span className="link-arrow">→</span>
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Newsletter */}
          <div className="newsletter-section">
            <div className="newsletter-glow"></div>
            <div className="newsletter-content">
              <h4>Stay in the loop</h4>
              <p>Get the latest updates, features, and AI insights delivered weekly.</p>
              <form className="newsletter-form">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="newsletter-input"
                />
                <button type="submit" className="newsletter-btn">
                  Subscribe
                </button>
              </form>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="footer-bottom">
            <p className="copyright">
              © {new Date().getFullYear()} BuildSmart. All rights reserved.
            </p>
            <div className="legal-links">
              <a href="#">Privacy Policy</a>
              <span className="separator">•</span>
              <a href="#">Terms of Service</a>
              <span className="separator">•</span>
              <a href="#">Cookie Policy</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;