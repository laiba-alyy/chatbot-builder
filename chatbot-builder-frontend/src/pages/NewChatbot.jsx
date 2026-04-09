// src/pages/NewChatbot.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { botsAPI } from '../services/api';
import './NewChatbot.css';

const NewChatbot = () => {
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(1);
  const [isCreating, setIsCreating] = useState(false);
  const [apiError, setApiError] = useState('');

  const [botData, setBotData] = useState({
    name: '',
    description: '',
    category: 'ecommerce',
    language: 'en',
    tone: 'professional',
    personality: ['helpful', 'friendly'],
    customPrompt: '',
    knowledgeSource: 'upload',
    documents: [],
    websiteUrl: '',
    faqs: [],
    trainingData: '',
    platforms: [],
    customDomain: '',
    primaryColor: '#40e0d0',
    secondaryColor: '#6464ff',
    botName: '',
    welcomeMessage: 'Hello! How can I help you today?',
    avatar: 'default',
  });

  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const categories = [
    { id: 'ecommerce', name: 'E-commerce', icon: '🛍️', description: 'Product recommendations, orders, support' },
    { id: 'support', name: 'Customer Support', icon: '🎧', description: 'Tickets, FAQs, issue resolution' },
    { id: 'sales', name: 'Sales & Lead Gen', icon: '📈', description: 'Lead qualification, product info' },
    { id: 'realestate', name: 'Real Estate', icon: '🏠', description: 'Property listings, tours, inquiries' },
    { id: 'healthcare', name: 'Healthcare', icon: '🏥', description: 'Appointments, symptoms, info' },
    { id: 'education', name: 'Education', icon: '📚', description: 'Courses, student support, resources' },
    { id: 'hr', name: 'HR & Recruitment', icon: '👥', description: 'Job applications, employee queries' },
    { id: 'custom', name: 'Custom', icon: '⚙️', description: 'Build from scratch' },
  ];

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'it', name: 'Italian' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'ja', name: 'Japanese' },
    { code: 'zh', name: 'Chinese' },
  ];

  const tones = [
    { id: 'professional', name: 'Professional', icon: '👔', description: 'Formal and business-like' },
    { id: 'friendly', name: 'Friendly', icon: '😊', description: 'Warm and approachable' },
    { id: 'casual', name: 'Casual', icon: '😎', description: 'Relaxed and informal' },
    { id: 'humorous', name: 'Humorous', icon: '😂', description: 'Funny and entertaining' },
    { id: 'empathetic', name: 'Empathetic', icon: '🤗', description: 'Understanding and caring' },
    { id: 'enthusiastic', name: 'Enthusiastic', icon: '🎉', description: 'Energetic and excited' },
  ];

  const personalities = [
    { id: 'helpful', name: 'Helpful', icon: '🤝' },
    { id: 'friendly', name: 'Friendly', icon: '😊' },
    { id: 'concise', name: 'Concise', icon: '✂️' },
    { id: 'detailed', name: 'Detailed', icon: '📝' },
    { id: 'patient', name: 'Patient', icon: '🧘' },
    { id: 'proactive', name: 'Proactive', icon: '⚡' },
    { id: 'creative', name: 'Creative', icon: '🎨' },
    { id: 'analytical', name: 'Analytical', icon: '📊' },
  ];

  const platforms = [
    { id: 'website', name: 'Website', icon: '🌐', description: 'Embed on your website' },
    { id: 'slack', name: 'Slack', icon: '💬', description: 'Connect to Slack workspace' },
    { id: 'discord', name: 'Discord', icon: '🎮', description: 'Add to Discord server' },
    { id: 'telegram', name: 'Telegram', icon: '📱', description: 'Telegram bot' },
    { id: 'whatsapp', name: 'WhatsApp', icon: '📞', description: 'WhatsApp Business API' },
    { id: 'messenger', name: 'Facebook Messenger', icon: '💭', description: 'Facebook page integration' },
    { id: 'instagram', name: 'Instagram', icon: '📷', description: 'Instagram DMs' },
    { id: 'api', name: 'Custom API', icon: '🔌', description: 'Build your own integration' },
  ];

  const avatars = [
    { id: 'default', icon: '🤖', color: '#40e0d0' },
    { id: 'friendly', icon: '😊', color: '#6464ff' },
    { id: 'professional', icon: '👔', color: '#9333ea' },
    { id: 'cute', icon: '🐶', color: '#ff6b6b' },
    { id: 'tech', icon: '⚡', color: '#40e0d0' },
    { id: 'custom', icon: '✨', color: '#6464ff' },
  ];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      if (checked) {
        setBotData({ ...botData, [name]: [...botData[name], value] });
      } else {
        setBotData({ ...botData, [name]: botData[name].filter(item => item !== value) });
      }
    } else {
      setBotData({ ...botData, [name]: value });
    }
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    setIsUploading(true);
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setUploadProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        setIsUploading(false);
        setBotData({ ...botData, documents: [...botData.documents, ...files] });
      }
    }, 200);
  };

  const removeDocument = (index) => {
    setBotData({
      ...botData,
      documents: botData.documents.filter((_, i) => i !== index)
    });
  };

  const addFaq = () => {
    setBotData({
      ...botData,
      faqs: [...botData.faqs, { question: '', answer: '' }]
    });
  };

  const updateFaq = (index, field, value) => {
    const updated = botData.faqs.map((faq, i) =>
      i === index ? { ...faq, [field]: value } : faq
    );
    setBotData({ ...botData, faqs: updated });
  };

  const removeFaq = (index) => {
    setBotData({ ...botData, faqs: botData.faqs.filter((_, i) => i !== index) });
  };

  const validateStep1 = () => {
    if (!botData.name.trim()) {
      setApiError('Bot name is required');
      return false;
    }
    setApiError('');
    return true;
  };

  const nextStep = () => {
    if (currentStep === 1 && !validateStep1()) return;
    setApiError('');
    setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    setApiError('');
    setCurrentStep(currentStep - 1);
  };

  // ✅ Create bot - connected to backend
  const createBot = async () => {
    if (!botData.name.trim()) {
      setApiError('Bot name is required');
      return;
    }

    setIsCreating(true);
    setApiError('');

    try {
      // ensure website platform is included if the user provided a URL
    if (botData.websiteUrl && !botData.platforms.includes('website')) {
      botData.platforms = [...botData.platforms, 'website'];
    }

    const payload = {
        name: botData.name,
        description: botData.description,
        category: botData.category,
        language: botData.language,
        websiteUrl: botData.websiteUrl,
        // if the user has picked at least one platform we assume the
        // bot should be made active immediately; otherwise leave it as draft
        status: botData.platforms && botData.platforms.length > 0 ? 'active' : 'draft',
        settings: {
          tone: botData.tone,
          personality: botData.personality,
          customPrompt: botData.customPrompt,
          welcomeMessage: botData.welcomeMessage,
          primaryColor: botData.primaryColor,
          secondaryColor: botData.secondaryColor,
          botName: botData.botName || botData.name,
          avatar: botData.avatar,
        },
        platforms: botData.platforms,
        customDomain: botData.customDomain || undefined,
      };

      const response = await botsAPI.create(payload);
      const createdBot = response.data;

      // If user uploaded documents, trigger training
      if (botData.documents.length > 0 && createdBot._id) {
        try {
          const formData = new FormData();
          botData.documents.forEach(file => formData.append('files', file));
          formData.append('botId', createdBot._id);
          formData.append('type', 'document');

          await fetch(
            `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/training/knowledge-base/upload`,
            {
              method: 'POST',
              headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
              body: formData
            }
          );
        } catch (uploadErr) {
          console.warn('Document upload failed (bot still created):', uploadErr);
        }
      }

      // If user entered training text, create training job
      if (botData.trainingData.trim() && createdBot._id) {
        try {
          await fetch(
            `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/training/jobs`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${localStorage.getItem('token')}`
              },
              body: JSON.stringify({
                botId: createdBot._id,
                type: 'text',
                data: botData.trainingData
              })
            }
          );
        } catch (trainErr) {
          console.warn('Training job failed (bot still created):', trainErr);
        }
      }

      navigate('/my-bots');

    } catch (err) {
      setApiError(err.message || 'Failed to create bot. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="step-indicator">
      {[
        { n: 1, label: 'Basic Info' },
        { n: 2, label: 'Personality' },
        { n: 3, label: 'Knowledge' },
        { n: 4, label: 'Integrations' },
        { n: 5, label: 'Customize' },
        { n: 6, label: 'Review' },
      ].map((step, i, arr) => (
        <React.Fragment key={step.n}>
          <div className={`step-item ${currentStep >= step.n ? 'completed' : ''} ${currentStep === step.n ? 'active' : ''}`}>
            <div className="step-number">{step.n}</div>
            <div className="step-label">{step.label}</div>
          </div>
          {i < arr.length - 1 && (
            <div className={`step-line ${currentStep > step.n ? 'completed' : ''}`}></div>
          )}
        </React.Fragment>
      ))}
    </div>
  );

  const renderStep1 = () => (
    <div className="step-content">
      <h2>Basic Information</h2>
      <p className="step-description">Let's start with the fundamentals of your chatbot</p>

      <div className="form-group">
        <label>Bot Name <span className="required">*</span></label>
        <input
          type="text"
          name="name"
          value={botData.name}
          onChange={handleInputChange}
          placeholder="e.g., Customer Support Bot, Sales Assistant"
          className="form-input"
        />
        <span className="input-hint">Give your bot a unique, descriptive name</span>
      </div>

      <div className="form-group">
        <label>Description</label>
        <textarea
          name="description"
          value={botData.description}
          onChange={handleInputChange}
          placeholder="What will this bot do? Describe its purpose..."
          className="form-textarea"
          rows="3"
        />
      </div>

      <div className="form-row">
        <div className="form-group half">
          <label>Category</label>
          <div className="category-grid">
            {categories.map(cat => (
              <div
                key={cat.id}
                className={`category-card ${botData.category === cat.id ? 'selected' : ''}`}
                onClick={() => setBotData({ ...botData, category: cat.id })}
              >
                <span className="category-icon">{cat.icon}</span>
                <span className="category-name">{cat.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="form-group half">
          <label>Primary Language</label>
          <select name="language" value={botData.language} onChange={handleInputChange} className="form-select">
            {languages.map(lang => (
              <option key={lang.code} value={lang.code}>{lang.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="tips-box">
        <div className="tips-icon">💡</div>
        <div className="tips-content">
          <h4>Pro Tips</h4>
          <ul>
            <li>Choose a name that reflects your bot's purpose</li>
            <li>Select the category that best matches your use case</li>
            <li>You can always change these settings later</li>
          </ul>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="step-content">
      <h2>Personality & Tone</h2>
      <p className="step-description">Define how your bot should communicate</p>

      <div className="form-group">
        <label>Communication Tone</label>
        <div className="tone-grid">
          {tones.map(t => (
            <div
              key={t.id}
              className={`tone-card ${botData.tone === t.id ? 'selected' : ''}`}
              onClick={() => setBotData({ ...botData, tone: t.id })}
            >
              <span className="tone-icon">{t.icon}</span>
              <div className="tone-info">
                <span className="tone-name">{t.name}</span>
                <span className="tone-description">{t.description}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label>Personality Traits (select multiple)</label>
        <div className="personality-grid">
          {personalities.map(p => (
            <div
              key={p.id}
              className={`personality-chip ${botData.personality.includes(p.id) ? 'selected' : ''}`}
              onClick={() => {
                const updated = botData.personality.includes(p.id)
                  ? botData.personality.filter(item => item !== p.id)
                  : [...botData.personality, p.id];
                setBotData({ ...botData, personality: updated });
              }}
            >
              <span className="personality-icon">{p.icon}</span>
              <span className="personality-name">{p.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label>Custom Instructions (Optional)</label>
        <textarea
          name="customPrompt"
          value={botData.customPrompt}
          onChange={handleInputChange}
          placeholder="Add specific instructions for your bot's behavior..."
          className="form-textarea"
          rows="4"
        />
      </div>

      <div className="preview-box">
        <h4>Live Preview</h4>
        <div className="preview-message">
          <div className="preview-avatar">{avatars.find(a => a.id === 'default').icon}</div>
          <div className="preview-bubble">
            <p>Hi there! I'm your {botData.name || 'New Bot'}.</p>
            <p className="preview-tone" style={{ color: '#40e0d0' }}>
              Tone: {tones.find(t => t.id === botData.tone)?.name || 'Professional'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="step-content">
      <h2>Knowledge Base</h2>
      <p className="step-description">Train your bot with data and information</p>

      <div className="knowledge-source-tabs">
        {[
          { id: 'upload', label: 'Upload Files', icon: '📁' },
          { id: 'website', label: 'Website URL', icon: '🌐' },
          { id: 'text', label: 'Text Input', icon: '📝' },
          { id: 'faq', label: 'FAQ Builder', icon: '❓' },
        ].map(tab => (
          <button
            key={tab.id}
            className={`source-tab ${botData.knowledgeSource === tab.id ? 'active' : ''}`}
            onClick={() => setBotData({ ...botData, knowledgeSource: tab.id })}
          >
            <span className="tab-icon">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {botData.knowledgeSource === 'upload' && (
        <div className="upload-area">
          <input
            type="file"
            id="file-upload"
            multiple
            onChange={handleFileUpload}
            style={{ display: 'none' }}
            accept=".pdf,.doc,.docx,.txt,.csv,.xlsx"
          />
          <label htmlFor="file-upload" className="upload-label">
            <div className="upload-icon">📤</div>
            <h4>Drag & drop files or click to browse</h4>
            <p>Support: PDF, DOC, DOCX, TXT, CSV, XLSX (Max 10MB each)</p>
          </label>

          {isUploading && (
            <div className="upload-progress">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${uploadProgress}%` }}></div>
              </div>
              <span className="progress-text">Uploading... {uploadProgress}%</span>
            </div>
          )}

          {botData.documents.length > 0 && (
            <div className="uploaded-files">
              <h4>Selected Files ({botData.documents.length})</h4>
              {botData.documents.map((file, index) => (
                <div key={index} className="file-item">
                  <span className="file-icon">📄</span>
                  <span className="file-name">{file.name}</span>
                  <span className="file-size">{(file.size / 1024).toFixed(1)} KB</span>
                  <button className="file-remove" onClick={() => removeDocument(index)}>✕</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {botData.knowledgeSource === 'website' && (
        <div className="website-input">
          <div className="form-group">
            <label>Website URL</label>
            <input
              type="url"
              name="websiteUrl"
              value={botData.websiteUrl}
              onChange={handleInputChange}
              placeholder="https://example.com"
              className="form-input"
            />
            <span className="input-hint">We'll crawl this website and index its content</span>
          </div>
          <div className="crawl-options">
            <label className="checkbox-label"><input type="checkbox" /> Include subpages</label>
            <label className="checkbox-label"><input type="checkbox" /> Follow external links</label>
          </div>
          <button className="crawl-btn">Start Crawling</button>
        </div>
      )}

      {botData.knowledgeSource === 'text' && (
        <div className="text-input">
          <textarea
            name="trainingData"
            value={botData.trainingData}
            onChange={handleInputChange}
            placeholder="Paste your training text here..."
            className="form-textarea"
            rows="8"
          />
        </div>
      )}

      {botData.knowledgeSource === 'faq' && (
        <div className="faq-builder">
          <div className="faq-list">
            {botData.faqs.map((faq, index) => (
              <div key={index} className="faq-item">
                <input
                  type="text"
                  placeholder="Question"
                  value={faq.question}
                  onChange={(e) => updateFaq(index, 'question', e.target.value)}
                  className="faq-question"
                />
                <textarea
                  placeholder="Answer"
                  value={faq.answer}
                  onChange={(e) => updateFaq(index, 'answer', e.target.value)}
                  className="faq-answer"
                  rows="2"
                />
                <button className="faq-remove" onClick={() => removeFaq(index)}>✕</button>
              </div>
            ))}
          </div>
          <button className="add-faq-btn" onClick={addFaq}>
            <span className="btn-icon">+</span>
            Add FAQ
          </button>
        </div>
      )}
    </div>
  );

  const renderStep4 = () => (
    <div className="step-content">
      <h2>Integrations</h2>
      <p className="step-description">Choose where you want to deploy your bot</p>

      <div className="platforms-grid">
        {platforms.map(platform => (
          <div
            key={platform.id}
            className={`platform-card ${botData.platforms.includes(platform.id) ? 'selected' : ''}`}
            onClick={() => {
              const updated = botData.platforms.includes(platform.id)
                ? botData.platforms.filter(p => p !== platform.id)
                : [...botData.platforms, platform.id];
              setBotData({ ...botData, platforms: updated });
            }}
          >
            <span className="platform-icon">{platform.icon}</span>
            <div className="platform-info">
              <h4>{platform.name}</h4>
              <p>{platform.description}</p>
            </div>
            <div className="platform-check">
              {botData.platforms.includes(platform.id) && '✓'}
            </div>
          </div>
        ))}
      </div>

      {botData.platforms.includes('website') && (
        <div className="integration-details">
          <h4>Website Integration</h4>
          <div className="code-snippet">
            <pre>{`<script src="https://cdn.buildsmart.com/bot.js" data-bot-id="pending-creation"></script>`}</pre>
            <button className="copy-btn" onClick={() => navigator.clipboard.writeText(`<script src="https://cdn.buildsmart.com/bot.js"></script>`)}>
              Copy
            </button>
          </div>
          <p className="integration-note">Paste this code just before the closing &lt;/body&gt; tag</p>
        </div>
      )}

      <div className="custom-domain">
        <h4>Custom Domain (Optional)</h4>
        <input
          type="text"
          name="customDomain"
          value={botData.customDomain}
          onChange={handleInputChange}
          placeholder="bot.yourdomain.com"
          className="form-input"
        />
        <span className="input-hint">Configure CNAME record to point to app.buildsmart.com</span>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="step-content">
      <h2>Customization</h2>
      <p className="step-description">Make your bot look and feel unique</p>

      <div className="customization-grid">
        <div className="customization-preview">
          <div className="preview-widget">
            <div className="preview-header" style={{ backgroundColor: botData.primaryColor }}>
              <span className="preview-avatar">{avatars.find(a => a.id === botData.avatar)?.icon || '🤖'}</span>
              <span className="preview-bot-name">{botData.botName || botData.name || 'ChatBot'}</span>
            </div>
            <div className="preview-body">
              <div className="preview-message bot">
                <div className="message-bubble" style={{ backgroundColor: botData.primaryColor + '20' }}>
                  {botData.welcomeMessage}
                </div>
              </div>
              <div className="preview-message user">
                <div className="message-bubble" style={{ borderColor: botData.primaryColor }}>
                  I need help with...
                </div>
              </div>
            </div>
            <div className="preview-input" style={{ borderColor: botData.primaryColor }}>
              <input type="text" placeholder="Type a message..." disabled />
              <button style={{ color: botData.primaryColor }}>Send</button>
            </div>
          </div>
        </div>

        <div className="customization-controls">
          <div className="form-group">
            <label>Primary Color</label>
            <div className="color-picker">
              <input type="color" name="primaryColor" value={botData.primaryColor} onChange={handleInputChange} />
              <input type="text" name="primaryColor" value={botData.primaryColor} onChange={handleInputChange} className="color-input" />
            </div>
          </div>

          <div className="form-group">
            <label>Secondary Color</label>
            <div className="color-picker">
              <input type="color" name="secondaryColor" value={botData.secondaryColor} onChange={handleInputChange} />
              <input type="text" name="secondaryColor" value={botData.secondaryColor} onChange={handleInputChange} className="color-input" />
            </div>
          </div>

          <div className="form-group">
            <label>Bot Display Name</label>
            <input
              type="text"
              name="botName"
              value={botData.botName}
              onChange={handleInputChange}
              placeholder="Assistant"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Welcome Message</label>
            <textarea
              name="welcomeMessage"
              value={botData.welcomeMessage}
              onChange={handleInputChange}
              className="form-textarea"
              rows="2"
            />
          </div>

          <div className="form-group">
            <label>Avatar Style</label>
            <div className="avatar-grid">
              {avatars.map(avatar => (
                <div
                  key={avatar.id}
                  className={`avatar-option ${botData.avatar === avatar.id ? 'selected' : ''}`}
                  onClick={() => setBotData({ ...botData, avatar: avatar.id })}
                  style={{ '--avatar-color': avatar.color }}
                >
                  <span className="avatar-icon">{avatar.icon}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep6 = () => (
    <div className="step-content">
      <h2>Review & Create</h2>
      <p className="step-description">Double-check everything before launching</p>

      <div className="review-grid">
        <div className="review-section">
          <h3>Basic Information</h3>
          <div className="review-item">
            <span className="review-label">Name:</span>
            <span className="review-value">{botData.name || 'Not set'}</span>
          </div>
          <div className="review-item">
            <span className="review-label">Category:</span>
            <span className="review-value">{categories.find(c => c.id === botData.category)?.name}</span>
          </div>
          <div className="review-item">
            <span className="review-label">Language:</span>
            <span className="review-value">{languages.find(l => l.code === botData.language)?.name}</span>
          </div>
          <div className="review-item">
            <span className="review-label">Description:</span>
            <span className="review-value">{botData.description || 'No description'}</span>
          </div>
        </div>

        <div className="review-section">
          <h3>Personality</h3>
          <div className="review-item">
            <span className="review-label">Tone:</span>
            <span className="review-value">{tones.find(t => t.id === botData.tone)?.name}</span>
          </div>
          <div className="review-item">
            <span className="review-label">Traits:</span>
            <span className="review-value">
              {botData.personality.map(p => personalities.find(per => per.id === p)?.name).join(', ')}
            </span>
          </div>
        </div>

        <div className="review-section">
          <h3>Knowledge</h3>
          <div className="review-item">
            <span className="review-label">Source:</span>
            <span className="review-value">{botData.knowledgeSource}</span>
          </div>
          <div className="review-item">
            <span className="review-label">Files:</span>
            <span className="review-value">{botData.documents.length} documents</span>
          </div>
        </div>

        <div className="review-section">
          <h3>Integrations</h3>
          <div className="review-item">
            <span className="review-label">Platforms:</span>
            <span className="review-value">
              {botData.platforms.map(p => platforms.find(plat => plat.id === p)?.name).join(', ') || 'None selected'}
            </span>
          </div>
        </div>

        <div className="review-section full-width">
          <h3>Customization</h3>
          <div className="review-colors">
            <div className="color-sample" style={{ backgroundColor: botData.primaryColor }}>
              <span>Primary</span>
            </div>
            <div className="color-sample" style={{ backgroundColor: botData.secondaryColor }}>
              <span>Secondary</span>
            </div>
          </div>
        </div>
      </div>

      <div className="terms-checkbox">
        <label className="checkbox-label">
          <input type="checkbox" required />
          <span className="checkbox-custom"></span>
          <span>I agree to the <a href="#">Terms of Service</a> and <a href="#">AI Usage Policy</a></span>
        </label>
      </div>
    </div>
  );

  return (
    <div className="new-chatbot">
      <div className="new-chatbot-header">
        <h1>Create New Chatbot</h1>
        <p>Build your intelligent assistant in minutes</p>
      </div>

      {renderStepIndicator()}

      <div className="step-container">
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}
        {currentStep === 5 && renderStep5()}
        {currentStep === 6 && renderStep6()}

        {/* ✅ API Error */}
        {apiError && (
          <div style={{
            background: 'rgba(255,68,68,0.1)',
            border: '1px solid rgba(255,68,68,0.3)',
            color: '#ff6b6b',
            padding: '10px 14px',
            borderRadius: '8px',
            margin: '16px 0',
            fontSize: '14px'
          }}>
            {apiError}
          </div>
        )}

        <div className="step-actions">
          {currentStep > 1 && (
            <button className="btn-secondary" onClick={prevStep} disabled={isCreating}>
              ← Previous
            </button>
          )}
          {currentStep < 6 ? (
            <button className="btn-primary" onClick={nextStep}>
              Continue →
            </button>
          ) : (
            <button className="btn-primary btn-create" onClick={createBot} disabled={isCreating}>
              {isCreating ? (
                <>⏳ Creating Bot...</>
              ) : (
                <>✨ Create Chatbot</>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewChatbot;