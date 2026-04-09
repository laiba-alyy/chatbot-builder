import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Onboarding.css';

const Onboarding = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [onboardingData, setOnboardingData] = useState({
    // Step 1: Welcome & Introduction
    completedWelcome: false,
    
    // Step 2: User Profile
    fullName: 'Alex Johnson',
    company: 'Acme Corporation',
    role: 'product_manager',
    teamSize: '11-50',
    
    // Step 3: Use Case
    primaryUseCase: 'customer_support',
    otherUseCase: '',
    industry: 'technology',
    
    // Step 4: First Bot
    botName: 'Support Assistant',
    botPurpose: 'customer_service',
    botTemplate: 'support',
    
    // Step 5: Integration
    platforms: [],
    website: '',
    
    // Step 6: Preferences
    notifications: true,
    newsletter: true,
    weeklyReports: false,
    
    // Step 7: Complete
    completed: false
  });

  const [selectedTemplate, setSelectedTemplate] = useState('support');
  const [selectedPlatforms, setSelectedPlatforms] = useState([]);
  const [showSkipModal, setShowSkipModal] = useState(false);

  // User roles
  const roles = [
    { id: 'developer', name: 'Developer / Engineer', icon: '👨‍💻' },
    { id: 'product_manager', name: 'Product Manager', icon: '📊' },
    { id: 'marketing', name: 'Marketing', icon: '📈' },
    { id: 'sales', name: 'Sales', icon: '🤝' },
    { id: 'support', name: 'Customer Support', icon: '🎧' },
    { id: 'executive', name: 'Executive', icon: '👔' },
    { id: 'other', name: 'Other', icon: '✨' }
  ];

  // Team sizes
  const teamSizes = [
    { id: '1', name: 'Just me' },
    { id: '2-10', name: '2-10 people' },
    { id: '11-50', name: '11-50 people' },
    { id: '51-200', name: '51-200 people' },
    { id: '201-500', name: '201-500 people' },
    { id: '500+', name: '500+ people' }
  ];

  // Use cases
  const useCases = [
    { id: 'customer_support', name: 'Customer Support', icon: '🎧', description: 'Handle customer inquiries and support tickets' },
    { id: 'sales', name: 'Sales & Lead Generation', icon: '📈', description: 'Qualify leads and assist with sales' },
    { id: 'ecommerce', name: 'E-commerce', icon: '🛍️', description: 'Product recommendations and order help' },
    { id: 'internal', name: 'Internal Employee Support', icon: '👥', description: 'HR, IT, and internal knowledge base' },
    { id: 'education', name: 'Education & Training', icon: '📚', description: 'Course support and student assistance' },
    { id: 'healthcare', name: 'Healthcare', icon: '🏥', description: 'Patient scheduling and information' },
    { id: 'realestate', name: 'Real Estate', icon: '🏠', description: 'Property inquiries and tours' },
    { id: 'other', name: 'Other', icon: '✨', description: 'Something else' }
  ];

  // Industries
  const industries = [
    { id: 'technology', name: 'Technology / SaaS' },
    { id: 'retail', name: 'Retail / E-commerce' },
    { id: 'healthcare', name: 'Healthcare' },
    { id: 'finance', name: 'Finance / Banking' },
    { id: 'education', name: 'Education' },
    { id: 'realestate', name: 'Real Estate' },
    { id: 'manufacturing', name: 'Manufacturing' },
    { id: 'other', name: 'Other' }
  ];

  // Bot templates
  const templates = [
    { 
      id: 'support', 
      name: 'Customer Support', 
      icon: '🎧', 
      color: '#40e0d0',
      description: 'Handle FAQs, support tickets, and customer inquiries',
      features: ['Ticket management', 'FAQ automation', 'Handoff to human']
    },
    { 
      id: 'sales', 
      name: 'Sales Assistant', 
      icon: '📈', 
      color: '#6464ff',
      description: 'Qualify leads, answer product questions, schedule demos',
      features: ['Lead qualification', 'Product info', 'Calendar integration']
    },
    { 
      id: 'ecommerce', 
      name: 'E-commerce', 
      icon: '🛍️', 
      color: '#9333ea',
      description: 'Product recommendations, order tracking, customer service',
      features: ['Product search', 'Order status', 'Cart assistance']
    },
    { 
      id: 'blank', 
      name: 'Start from Scratch', 
      icon: '✨', 
      color: '#ff6b6b',
      description: 'Build a custom bot exactly how you want it',
      features: ['Full customization', 'All features', 'Complete control']
    }
  ];

  // Platforms
  const platforms = [
    { id: 'website', name: 'Website', icon: '🌐' },
    { id: 'slack', name: 'Slack', icon: '💬' },
    { id: 'discord', name: 'Discord', icon: '🎮' },
    { id: 'whatsapp', name: 'WhatsApp', icon: '📱' },
    { id: 'messenger', name: 'Messenger', icon: '💭' },
    { id: 'telegram', name: 'Telegram', icon: '✈️' }
  ];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setOnboardingData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handlePlatformToggle = (platformId) => {
    setSelectedPlatforms(prev => {
      if (prev.includes(platformId)) {
        return prev.filter(p => p !== platformId);
      } else {
        return [...prev, platformId];
      }
    });
    setOnboardingData(prev => ({
      ...prev,
      platforms: selectedPlatforms.includes(platformId) 
        ? selectedPlatforms.filter(p => p !== platformId)
        : [...selectedPlatforms, platformId]
    }));
  };

  const nextStep = () => {
    setCurrentStep(prev => Math.min(prev + 1, 7));
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const skipOnboarding = () => {
    navigate('/dashboard');
  };

  const completeOnboarding = () => {
    // Here you would typically save the data to your backend
    console.log('Onboarding completed:', onboardingData);
    navigate('/dashboard?welcome=true');
  };

  const renderStepIndicator = () => (
    <div className="onboarding-progress">
      <div className="progress-steps">
        <div className={`step ${currentStep >= 1 ? 'completed' : ''} ${currentStep === 1 ? 'active' : ''}`}>
          <div className="step-number">1</div>
          <div className="step-label">Welcome</div>
        </div>
        <div className={`step-line ${currentStep >= 2 ? 'completed' : ''}`}></div>
        
        <div className={`step ${currentStep >= 2 ? 'completed' : ''} ${currentStep === 2 ? 'active' : ''}`}>
          <div className="step-number">2</div>
          <div className="step-label">Profile</div>
        </div>
        <div className={`step-line ${currentStep >= 3 ? 'completed' : ''}`}></div>
        
        <div className={`step ${currentStep >= 3 ? 'completed' : ''} ${currentStep === 3 ? 'active' : ''}`}>
          <div className="step-number">3</div>
          <div className="step-label">Use Case</div>
        </div>
        <div className={`step-line ${currentStep >= 4 ? 'completed' : ''}`}></div>
        
        <div className={`step ${currentStep >= 4 ? 'completed' : ''} ${currentStep === 4 ? 'active' : ''}`}>
          <div className="step-number">4</div>
          <div className="step-label">First Bot</div>
        </div>
        <div className={`step-line ${currentStep >= 5 ? 'completed' : ''}`}></div>
        
        <div className={`step ${currentStep >= 5 ? 'completed' : ''} ${currentStep === 5 ? 'active' : ''}`}>
          <div className="step-number">5</div>
          <div className="step-label">Integrations</div>
        </div>
        <div className={`step-line ${currentStep >= 6 ? 'completed' : ''}`}></div>
        
        <div className={`step ${currentStep >= 6 ? 'completed' : ''} ${currentStep === 6 ? 'active' : ''}`}>
          <div className="step-number">6</div>
          <div className="step-label">Preferences</div>
        </div>
        <div className={`step-line ${currentStep >= 7 ? 'completed' : ''}`}></div>
        
        <div className={`step ${currentStep === 7 ? 'active' : ''}`}>
          <div className="step-number">7</div>
          <div className="step-label">Complete</div>
        </div>
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="onboarding-step">
      <div className="step-content">
        <div className="welcome-icon">🚀</div>
        <h2>Welcome to BuildSmart!</h2>
        <p className="welcome-text">We're excited to help you create amazing chatbots. Let's get you set up in just a few minutes.</p>
        
        <div className="welcome-features">
          <div className="feature">
            <div className="feature-icon">🤖</div>
            <div className="feature-text">
              <h4>Create your first bot</h4>
              <p>We'll guide you through building your first chatbot</p>
            </div>
          </div>
          
          <div className="feature">
            <div className="feature-icon">🎯</div>
            <div className="feature-text">
              <h4>Personalize your experience</h4>
              <p>Tell us about your use case for tailored recommendations</p>
            </div>
          </div>
          
          <div className="feature">
            <div className="feature-icon">🔌</div>
            <div className="feature-text">
              <h4>Connect your platforms</h4>
              <p>Set up integrations with your favorite tools</p>
            </div>
          </div>
        </div>

        <div className="time-estimate">
          <span className="time-icon">⏱️</span>
          <span>This will take about 3 minutes</span>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="onboarding-step">
      <div className="step-content">
        <h2>Tell us about yourself</h2>
        <p className="step-description">Help us personalize your experience</p>

        <div className="form-group">
          <label>Full Name</label>
          <input
            type="text"
            name="fullName"
            value={onboardingData.fullName}
            onChange={handleInputChange}
            className="form-input"
            placeholder="Enter your full name"
          />
        </div>

        <div className="form-group">
          <label>Company Name</label>
          <input
            type="text"
            name="company"
            value={onboardingData.company}
            onChange={handleInputChange}
            className="form-input"
            placeholder="Enter your company name"
          />
        </div>

        <div className="form-group">
          <label>Your Role</label>
          <div className="options-grid roles">
            {roles.map(role => (
              <div
                key={role.id}
                className={`option-card ${onboardingData.role === role.id ? 'selected' : ''}`}
                onClick={() => setOnboardingData(prev => ({ ...prev, role: role.id }))}
              >
                <span className="option-icon">{role.icon}</span>
                <span className="option-name">{role.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>Team Size</label>
          <div className="options-grid team-sizes">
            {teamSizes.map(size => (
              <div
                key={size.id}
                className={`option-card ${onboardingData.teamSize === size.id ? 'selected' : ''}`}
                onClick={() => setOnboardingData(prev => ({ ...prev, teamSize: size.id }))}
              >
                <span className="option-name">{size.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="onboarding-step">
      <div className="step-content">
        <h2>What will you use chatbots for?</h2>
        <p className="step-description">Select your primary use case</p>

        <div className="use-cases-grid">
          {useCases.map(useCase => (
            <div
              key={useCase.id}
              className={`use-case-card ${onboardingData.primaryUseCase === useCase.id ? 'selected' : ''}`}
              onClick={() => setOnboardingData(prev => ({ ...prev, primaryUseCase: useCase.id }))}
            >
              <div className="use-case-icon">{useCase.icon}</div>
              <div className="use-case-info">
                <h4>{useCase.name}</h4>
                <p>{useCase.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="form-group">
          <label>Industry</label>
          <select
            name="industry"
            value={onboardingData.industry}
            onChange={handleInputChange}
            className="form-select"
          >
            {industries.map(ind => (
              <option key={ind.id} value={ind.id}>{ind.name}</option>
            ))}
          </select>
        </div>

        {onboardingData.primaryUseCase === 'other' && (
          <div className="form-group">
            <label>Please specify</label>
            <input
              type="text"
              name="otherUseCase"
              value={onboardingData.otherUseCase}
              onChange={handleInputChange}
              className="form-input"
              placeholder="Tell us more about your use case"
            />
          </div>
        )}
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="onboarding-step">
      <div className="step-content">
        <h2>Create your first bot</h2>
        <p className="step-description">Choose a template or start from scratch</p>

        <div className="templates-grid">
          {templates.map(template => (
            <div
              key={template.id}
              className={`template-card ${selectedTemplate === template.id ? 'selected' : ''}`}
              style={{ '--template-color': template.color }}
              onClick={() => setSelectedTemplate(template.id)}
            >
              <div className="template-header">
                <span className="template-icon">{template.icon}</span>
                <h4>{template.name}</h4>
              </div>
              <p className="template-description">{template.description}</p>
              <div className="template-features">
                {template.features.map((feature, i) => (
                  <span key={i} className="feature-tag">✓ {feature}</span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="form-group">
          <label>Bot Name</label>
          <input
            type="text"
            name="botName"
            value={onboardingData.botName}
            onChange={handleInputChange}
            className="form-input"
            placeholder="Give your bot a name"
          />
        </div>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="onboarding-step">
      <div className="step-content">
        <h2>Connect your platforms</h2>
        <p className="step-description">Choose where you want to deploy your bot (you can change this later)</p>

        <div className="platforms-grid">
          {platforms.map(platform => (
            <div
              key={platform.id}
              className={`platform-card ${selectedPlatforms.includes(platform.id) ? 'selected' : ''}`}
              onClick={() => handlePlatformToggle(platform.id)}
            >
              <span className="platform-icon">{platform.icon}</span>
              <span className="platform-name">{platform.name}</span>
              {selectedPlatforms.includes(platform.id) && (
                <span className="platform-check">✓</span>
              )}
            </div>
          ))}
        </div>

        <div className="form-group">
          <label>Your Website (Optional)</label>
          <input
            type="url"
            name="website"
            value={onboardingData.website}
            onChange={handleInputChange}
            className="form-input"
            placeholder="https://yourcompany.com"
          />
          <p className="input-hint">We'll use this to customize your bot's knowledge</p>
        </div>
      </div>
    </div>
  );

  const renderStep6 = () => (
    <div className="onboarding-step">
      <div className="step-content">
        <h2>Almost there!</h2>
        <p className="step-description">Set your preferences</p>

        <div className="preferences">
          <div className="preference-item">
            <div className="preference-info">
              <h4>Email Notifications</h4>
              <p>Receive updates about your bot activity</p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                name="notifications"
                checked={onboardingData.notifications}
                onChange={handleInputChange}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="preference-item">
            <div className="preference-info">
              <h4>Product Newsletter</h4>
              <p>Get tips, updates, and new features</p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                name="newsletter"
                checked={onboardingData.newsletter}
                onChange={handleInputChange}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="preference-item">
            <div className="preference-info">
              <h4>Weekly Reports</h4>
              <p>Receive weekly analytics summary</p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                name="weeklyReports"
                checked={onboardingData.weeklyReports}
                onChange={handleInputChange}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>

        <div className="data-summary">
          <h4>We'll use this information to:</h4>
          <ul>
            <li>✓ Personalize your dashboard and recommendations</li>
            <li>✓ Suggest relevant templates and features</li>
            <li>✓ Help you get started faster with pre-configured settings</li>
          </ul>
        </div>
      </div>
    </div>
  );

  const renderStep7 = () => (
    <div className="onboarding-step">
      <div className="step-content complete">
        <div className="complete-icon">🎉</div>
        <h2>You're all set!</h2>
        <p className="complete-text">Your account is ready. Let's start building amazing chatbots!</p>

        <div className="next-steps">
          <h3>What's next?</h3>
          <div className="next-step-item">
            <div className="step-marker">1</div>
            <div className="step-info">
              <h4>Explore your dashboard</h4>
              <p>Get familiar with all the features</p>
            </div>
          </div>

          <div className="next-step-item">
            <div className="step-marker">2</div>
            <div className="step-info">
              <h4>Train your first bot</h4>
              <p>Add knowledge and customize responses</p>
            </div>
          </div>

          <div className="next-step-item">
            <div className="step-marker">3</div>
            <div className="step-info">
              <h4>Deploy and test</h4>
              <p>Put your bot to work and see results</p>
            </div>
          </div>
        </div>

        <div className="quick-tip">
          <span className="tip-icon">💡</span>
          <p>Need help? Check out our <a href="#">getting started guide</a> or <a href="#">watch tutorials</a></p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="onboarding">
      {/* Header */}
      <div className="onboarding-header">
        <div className="logo">BuildSmart</div>
        <button className="skip-btn" onClick={() => setShowSkipModal(true)}>
          Skip for now
        </button>
      </div>

      {/* Progress Indicator */}
      {renderStepIndicator()}

      {/* Main Content */}
      <div className="onboarding-main">
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}
        {currentStep === 5 && renderStep5()}
        {currentStep === 6 && renderStep6()}
        {currentStep === 7 && renderStep7()}

        {/* Navigation */}
        <div className="step-navigation">
          {currentStep > 1 && (
            <button className="nav-btn prev" onClick={prevStep}>
              ← Back
            </button>
          )}
          
          {currentStep < 7 ? (
            <button className="nav-btn next" onClick={nextStep}>
              Continue →
            </button>
          ) : (
            <button className="nav-btn finish" onClick={completeOnboarding}>
              Go to Dashboard →
            </button>
          )}
        </div>
      </div>

      {/* Skip Modal */}
      {showSkipModal && (
        <div className="skip-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Skip Onboarding?</h2>
              <button className="close-modal" onClick={() => setShowSkipModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p>You can always complete your profile and set up your preferences later from the settings page.</p>
              <p className="warning">Are you sure you want to skip?</p>
            </div>
            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setShowSkipModal(false)}>
                Continue Onboarding
              </button>
              <button className="skip-confirm-btn" onClick={skipOnboarding}>
                Skip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Onboarding;