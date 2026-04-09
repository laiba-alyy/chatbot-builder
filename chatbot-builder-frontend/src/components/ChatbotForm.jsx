import { useState } from 'react';
import Button from './Button';
import './ChatbotForm.css';

function ChatbotForm({ onSubmit, initialData = null, isEditing = false }) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    welcomeMessage: initialData?.welcomeMessage || 'Hello! How can I help you today?',
    primaryColor: initialData?.primaryColor || '#667eea',
    position: initialData?.position || 'bottom-right',
    avatar: initialData?.avatar || '',
    placeholder: initialData?.placeholder || 'Type your message...',
    responseTime: initialData?.responseTime || 'instant',
    language: initialData?.language || 'en',
    allowFileUpload: initialData?.allowFileUpload || false,
    collectEmail: initialData?.collectEmail || false,
    showBranding: initialData?.showBranding || true
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });

    // Clear error for this field
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Chatbot name is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.welcomeMessage.trim()) {
      newErrors.welcomeMessage = 'Welcome message is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="chatbot-form" onSubmit={handleSubmit}>
      {/* Basic Information Section */}
      <div className="form-section">
        <h3 className="form-section-title">Basic Information</h3>

        <div className="form-group">
          <label className="form-label" htmlFor="name">
            Chatbot Name <span className="required">*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            className={`form-control ${errors.name ? 'form-control-error' : ''}`}
            placeholder="e.g., Customer Support Bot"
            value={formData.name}
            onChange={handleChange}
          />
          {errors.name && <span className="form-error">{errors.name}</span>}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="description">
            Description <span className="required">*</span>
          </label>
          <textarea
            id="description"
            name="description"
            className={`form-control ${errors.description ? 'form-control-error' : ''}`}
            placeholder="Brief description of your chatbot's purpose"
            rows="4"
            value={formData.description}
            onChange={handleChange}
          />
          {errors.description && <span className="form-error">{errors.description}</span>}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="welcomeMessage">
            Welcome Message <span className="required">*</span>
          </label>
          <textarea
            id="welcomeMessage"
            name="welcomeMessage"
            className={`form-control ${errors.welcomeMessage ? 'form-control-error' : ''}`}
            placeholder="First message users will see"
            rows="3"
            value={formData.welcomeMessage}
            onChange={handleChange}
          />
          {errors.welcomeMessage && <span className="form-error">{errors.welcomeMessage}</span>}
        </div>
      </div>

      {/* Appearance Section */}
      <div className="form-section">
        <h3 className="form-section-title">Appearance</h3>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label" htmlFor="primaryColor">
              Primary Color
            </label>
            <div className="color-picker-wrapper">
              <input
                type="color"
                id="primaryColor"
                name="primaryColor"
                className="color-picker"
                value={formData.primaryColor}
                onChange={handleChange}
              />
              <input
                type="text"
                className="form-control color-input"
                value={formData.primaryColor}
                onChange={handleChange}
                name="primaryColor"
                placeholder="#667eea"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="position">
              Widget Position
            </label>
            <select
              id="position"
              name="position"
              className="form-control"
              value={formData.position}
              onChange={handleChange}
            >
              <option value="bottom-right">Bottom Right</option>
              <option value="bottom-left">Bottom Left</option>
              <option value="top-right">Top Right</option>
              <option value="top-left">Top Left</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="avatar">
            Avatar URL (Optional)
          </label>
          <input
            type="url"
            id="avatar"
            name="avatar"
            className="form-control"
            placeholder="https://example.com/avatar.png"
            value={formData.avatar}
            onChange={handleChange}
          />
          <small className="form-hint">Recommended size: 40x40px</small>
        </div>
      </div>

      {/* Behavior Section */}
      <div className="form-section">
        <h3 className="form-section-title">Behavior</h3>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label" htmlFor="placeholder">
              Input Placeholder
            </label>
            <input
              type="text"
              id="placeholder"
              name="placeholder"
              className="form-control"
              placeholder="Type your message..."
              value={formData.placeholder}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="responseTime">
              Response Time
            </label>
            <select
              id="responseTime"
              name="responseTime"
              className="form-control"
              value={formData.responseTime}
              onChange={handleChange}
            >
              <option value="instant">Instant</option>
              <option value="1s">1 Second</option>
              <option value="2s">2 Seconds</option>
              <option value="3s">3 Seconds</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="language">
            Language
          </label>
          <select
            id="language"
            name="language"
            className="form-control"
            value={formData.language}
            onChange={handleChange}
          >
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="de">German</option>
            <option value="pt">Portuguese</option>
            <option value="ar">Arabic</option>
            <option value="hi">Hindi</option>
            <option value="zh">Chinese</option>
          </select>
        </div>
      </div>

      {/* Features Section */}
      <div className="form-section">
        <h3 className="form-section-title">Features</h3>

        <div className="form-checkbox-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="allowFileUpload"
              checked={formData.allowFileUpload}
              onChange={handleChange}
            />
            <span className="checkbox-text">
              <strong>Allow File Upload</strong>
              <small>Let users upload files in chat</small>
            </span>
          </label>

          <label className="checkbox-label">
            <input
              type="checkbox"
              name="collectEmail"
              checked={formData.collectEmail}
              onChange={handleChange}
            />
            <span className="checkbox-text">
              <strong>Collect Email</strong>
              <small>Ask for user's email before chat</small>
            </span>
          </label>

          <label className="checkbox-label">
            <input
              type="checkbox"
              name="showBranding"
              checked={formData.showBranding}
              onChange={handleChange}
            />
            <span className="checkbox-text">
              <strong>Show Branding</strong>
              <small>Display "Powered by" branding</small>
            </span>
          </label>
        </div>
      </div>

      {/* Form Actions */}
      <div className="form-actions">
        <Button 
          type="submit" 
          variant="primary" 
          size="large"
          loading={isSubmitting}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : (isEditing ? 'Update Chatbot' : 'Create Chatbot')}
        </Button>
      </div>
    </form>
  );
}

export default ChatbotForm;