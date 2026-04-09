import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './NotFound.css';

const NotFound = () => {
  const navigate = useNavigate();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [glitchText, setGlitchText] = useState('404');
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Glitch effect on mount
  useEffect(() => {
    const glitchInterval = setInterval(() => {
      setGlitchText(prev => {
        if (prev === '404') return '4̷0̷4̷';
        if (prev === '4̷0̷4̷') return '4̴0̴4̴';
        if (prev === '4̴0̴4̴') return '4͛0͛4͛';
        if (prev === '4͛0͛4͛') return '4̿0̿4̿';
        return '404';
      });
    }, 300);

    // Show suggestions after a delay
    const timer = setTimeout(() => {
      setShowSuggestions(true);
    }, 500);

    return () => {
      clearInterval(glitchInterval);
      clearTimeout(timer);
    };
  }, []);

  // Mouse move effect for parallax
  const handleMouseMove = (e) => {
    const x = (e.clientX / window.innerWidth - 0.5) * 20;
    const y = (e.clientY / window.innerHeight - 0.5) * 20;
    setMousePosition({ x, y });
  };

  // Random 404 messages
  const errorMessages = [
    "Looks like this page went on vacation without leaving a forwarding address.",
    "Houston, we have a problem. This page is lost in space.",
    "This page doesn't exist. But you exist, and that's beautiful.",
    "The page you're looking for is in another castle.",
    "404: Page not found. Also, our server is now feeling guilty.",
    "This page has been abducted by aliens. We're negotiating its return.",
    "You've found the secret 404 page! Just kidding, it's just a 404.",
    "This page is playing hide and seek. And it's really good at hiding.",
    "404: The page equivalent of 'the dog ate my homework'.",
    "This page has joined the witness protection program."
  ];

  const randomMessage = errorMessages[Math.floor(Math.random() * errorMessages.length)];

  // Suggested pages
  const suggestions = [
    { path: '/', name: 'Home', icon: '🏠', color: '#40e0d0' },
    { path: '/dashboard', name: 'Dashboard', icon: '📊', color: '#6464ff' },
    { path: '/my-bots', name: 'My Bots', icon: '🤖', color: '#9333ea' },
    { path: '/pricing', name: 'Pricing', icon: '💰', color: '#ff6b6b' },
    { path: '/help', name: 'Help Center', icon: '📚', color: '#40e0d0' }
  ];

  // Fun facts
  const funFacts = [
    "The first 404 error was reported in 1992 at CERN.",
    "404 is the area code for Atlanta, Georgia.",
    "In some cultures, 404 is considered a lucky number.",
    "The HTTP 404 status code was named after room 404 at CERN.",
    "There's a restaurant in Tokyo called '404 Not Found'."
  ];

  const randomFact = funFacts[Math.floor(Math.random() * funFacts.length)];

  return (
    <div className="not-found-page" onMouseMove={handleMouseMove}>
      {/* Animated Background */}
      <div className="not-found-bg">
        <div className="bg-grid"></div>
        <div className="bg-glow"></div>
        <div className="bg-particles">
          {[...Array(50)].map((_, i) => (
            <div 
              key={i} 
              className="particle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${Math.random() * 10 + 5}s`
              }}
            ></div>
          ))}
        </div>
      </div>

      {/* Floating Elements */}
      <div className="floating-elements">
        <div 
          className="floating-element robot"
          style={{ transform: `translate(${mousePosition.x * 0.5}px, ${mousePosition.y * 0.5}px)` }}
        >
          🤖
        </div>
        <div 
          className="floating-element cloud"
          style={{ transform: `translate(${mousePosition.x * -0.3}px, ${mousePosition.y * -0.3}px)` }}
        >
          ☁️
        </div>
        <div 
          className="floating-element star"
          style={{ transform: `translate(${mousePosition.x * 0.2}px, ${mousePosition.y * 0.2}px)` }}
        >
          ⭐
        </div>
        <div 
          className="floating-element ufo"
          style={{ transform: `translate(${mousePosition.x * -0.4}px, ${mousePosition.y * -0.4}px)` }}
        >
          🛸
        </div>
        <div 
          className="floating-element rocket"
          style={{ transform: `translate(${mousePosition.x * 0.3}px, ${mousePosition.y * 0.3}px)` }}
        >
          🚀
        </div>
      </div>

      {/* Main Content */}
      <div className="not-found-content">
        {/* Error Code */}
        <div className="error-code-container">
          <h1 className="error-code glitch" data-text={glitchText}>
            {glitchText}
          </h1>
          <div className="error-badge">
            <span className="badge-text">Page Not Found</span>
          </div>
        </div>

        {/* Error Message */}
        <p className="error-message">{randomMessage}</p>

        {/* Fun Fact */}
        <div className="fun-fact">
          <span className="fact-icon">💡</span>
          <p>Did you know? {randomFact}</p>
        </div>

        {/* Search Suggestions */}
        {showSuggestions && (
          <div className="suggestions-section">
            <h3>You might be looking for:</h3>
            <div className="suggestions-grid">
              {suggestions.map((item, index) => (
                <Link
                  key={index}
                  to={item.path}
                  className="suggestion-card"
                  style={{ '--card-color': item.color }}
                >
                  <span className="suggestion-icon">{item.icon}</span>
                  <span className="suggestion-name">{item.name}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="action-buttons">
          <button onClick={() => navigate(-1)} className="btn-secondary">
            <span className="btn-icon">←</span>
            Go Back
          </button>
          <button onClick={() => navigate('/')} className="btn-primary">
            <span className="btn-icon">🏠</span>
            Go Home
          </button>
        </div>

        {/* Search Bar */}
        <div className="search-section">
          <p>Or try searching:</p>
          <div className="search-container">
            <input 
              type="text" 
              placeholder="Search for pages..." 
              className="search-input"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  // Handle search
                  console.log('Searching for:', e.target.value);
                }
              }}
            />
            <button className="search-btn">Search</button>
          </div>
        </div>
      </div>

      {/* Status Code Info */}
      <div className="status-info">
        <div className="info-item">
          <span className="info-label">Status Code</span>
          <span className="info-value">404</span>
        </div>
        <div className="info-item">
          <span className="info-label">Timestamp</span>
          <span className="info-value">{new Date().toLocaleTimeString()}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Path</span>
          <span className="info-value">{window.location.pathname}</span>
        </div>
      </div>

      {/* Easter Egg */}
      <div 
        className="easter-egg"
        onClick={() => {
          alert('🎉 You found the secret! Here\'s a joke: Why did the 404 page go to therapy? It had unresolved issues!');
        }}
      >
        <span className="egg-tooltip">Secret Area (Click me!)</span>
        <span className="egg-icon">🥚</span>
      </div>
    </div>
  );
};

export default NotFound;