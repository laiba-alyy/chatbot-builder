import React from 'react';
import './Features.css';

// You can replace these with your actual icons/images
const Features = () => {
  const features = [
    {
      icon: "🤖",
      title: "Drag & Drop Builder",
      description: "Visual workflow builder with 50+ pre-built AI blocks. Connect, configure, and deploy in minutes.",
      color: "#40e0d0"
    },
    {
      icon: "⚡",
      title: "Real-Time Training",
      description: "Train custom models instantly with your data. See improvements in real-time as you add content.",
      color: "#6464ff"
    },
    {
      icon: "🔌",
      title: "100+ Integrations",
      description: "Connect with Shopify, WordPress, Slack, and more. API access included with every plan.",
      color: "#9333ea"
    },
    {
      icon: "🎯",
      title: "Industry Templates",
      description: "Pre-built bots for E-commerce, Real Estate, Healthcare, and SaaS. Customize with zero code.",
      color: "#40e0d0"
    },
    {
      icon: "📊",
      title: "Analytics Dashboard",
      description: "Track conversations, user satisfaction, and ROI with beautiful real-time visualizations.",
      color: "#6464ff"
    },
    {
      icon: "🛡️",
      title: "Enterprise Security",
      description: "GDPR compliant, SOC2 certified, and end-to-end encryption. Your data stays private.",
      color: "#9333ea"
    }
  ];

  return (
    <section className="features-section">
      {/* Background Effects */}
      <div className="features-bg-glow"></div>
      <div className="features-neural-grid"></div>
      
      <div className="features-container">
        {/* Section Header */}
        <div className="features-header">
          <div className="features-badge">
            <span className="badge-icon">✨</span>
            Why Choose Us
          </div>
          <h2 className="features-title">
            Powerful Features for{" "}
            <span className="gradient-text">Modern AI Bots</span>
          </h2>
          <p className="features-subtitle">
            Everything you need to build, train, and deploy intelligent chatbots 
            that drive real business results.
          </p>
        </div>

        {/* Features Grid */}
        <div className="features-grid">
          {features.map((feature, index) => (
            <div 
              className="feature-card" 
              key={index}
              style={{ '--card-accent': feature.color }}
            >
              <div className="card-inner">
                <div className="card-glow"></div>
                <div className="card-icon-wrapper" style={{ background: `linear-gradient(135deg, ${feature.color}20, ${feature.color}05)` }}>
                  <span className="card-icon">{feature.icon}</span>
                  <div className="icon-glow" style={{ background: feature.color }}></div>
                </div>
                <h3 className="card-title">{feature.title}</h3>
                <p className="card-description">{feature.description}</p>
                
                {/* Hover effect elements */}
                <div className="card-lines">
                  <div className="line line-1"></div>
                  <div className="line line-2"></div>
                </div>
                
                {/* Corner accents */}
                <div className="corner top-left"></div>
                <div className="corner top-right"></div>
                <div className="corner bottom-left"></div>
                <div className="corner bottom-right"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Stats Section */}
        <div className="stats-container">
          <div className="stat-item">
            <div className="stat-number">
              <span className="stat-value">10k+</span>
              <span className="stat-plus">+</span>
            </div>
            <p className="stat-label">Active Bots</p>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-item">
            <div className="stat-number">
              <span className="stat-value">50M</span>
              <span className="stat-plus">+</span>
            </div>
            <p className="stat-label">Conversations</p>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-item">
            <div className="stat-number">
              <span className="stat-value">99.9</span>
              <span className="stat-plus">%</span>
            </div>
            <p className="stat-label">Uptime</p>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-item">
            <div className="stat-number">
              <span className="stat-value">24/7</span>
            </div>
            <p className="stat-label">Support</p>
          </div>
        </div>

        {/* CTA Banner */}
        <div className="features-cta">
          <div className="cta-glow"></div>
          <div className="cta-content">
            <h3>Ready to build your first AI bot?</h3>
            <p>Join 10,000+ businesses already using our platform</p>
            <button className="cta-button">
              Start Building Free
              <span className="button-arrow">→</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;