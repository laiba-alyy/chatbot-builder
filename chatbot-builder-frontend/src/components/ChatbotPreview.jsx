import { useState, useEffect, useRef } from 'react';
import './ChatbotPreview.css';

function ChatbotPreview({ chatbotData }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // Default chatbot data
  const defaultData = {
    name: 'ChatBot',
    welcomeMessage: 'Hello! How can I help you today?',
    primaryColor: '#667eea',
    position: 'bottom-right',
    avatar: '',
    placeholder: 'Type your message...',
    responseTime: 'instant',
    allowFileUpload: false,
    showBranding: true
  };

  const data = { ...defaultData, ...chatbotData };

  // Initialize with welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: 1,
          text: data.welcomeMessage,
          sender: 'bot',
          timestamp: new Date()
        }
      ]);
    }
  }, [isOpen, data.welcomeMessage, messages.length]);

  // Auto scroll to bottom
   const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

 

  // Toggle chat window
  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  // Handle sending message
  const handleSendMessage = (e) => {
    e.preventDefault();

    if (!inputMessage.trim()) return;

    // Add user message
    const userMessage = {
      id: Date.now(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);

    setInputMessage('');

    // Simulate bot response
   setIsTyping(true);

    // Get response time delay
    const delayMap = {
  instant: 500,
  '1s': 1000,
  '2s': 2000,
  '3s': 3000
};
const delay = delayMap[data.responseTime] || 1000;


    setTimeout(() => {
      const botMessage = {
        id: Date.now() + 1,
        text: generateBotResponse(inputMessage),
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    }, delay);
  };

  // Generate demo bot response
  const generateBotResponse = (userMsg) => {
    const lowerMsg = userMsg.toLowerCase();
    
    if (lowerMsg.includes('hello') || lowerMsg.includes('hi')) {
      return 'Hello! How can I assist you today?';
    } else if (lowerMsg.includes('help')) {
      return 'I\'m here to help! What do you need assistance with?';
    } else if (lowerMsg.includes('bye') || lowerMsg.includes('goodbye')) {
      return 'Goodbye! Have a great day!';
    } else if (lowerMsg.includes('price') || lowerMsg.includes('cost')) {
      return 'Our pricing starts at $29/month. Would you like to know more?';
    } else if (lowerMsg.includes('thank')) {
      return 'You\'re welcome! Is there anything else I can help you with?';
    } else {
      return 'Thanks for your message! This is a preview of how your chatbot will respond.';
    }
  };

  // Format timestamp
  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className={`chatbot-preview-container position-${data.position}`}>
      {/* Chat Widget Button */}
      {!isOpen && (
        <button 
          className="chat-widget-button"
          onClick={toggleChat}
          style={{ backgroundColor: data.primaryColor }}
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="chat-window">
          {/* Chat Header */}
          <div 
            className="chat-header"
            style={{ backgroundColor: data.primaryColor }}
          >
            <div className="chat-header-info">
              {data.avatar ? (
                <img src={data.avatar} alt="Bot Avatar" className="chat-avatar" />
              ) : (
                <div className="chat-avatar-placeholder">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="20" 
                    height="20" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
              )}
              <div className="chat-header-text">
                <h4>{data.name}</h4>
                <span className="chat-status">Online</span>
              </div>
            </div>
            <button className="chat-close-button" onClick={toggleChat}>
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="20" 
                height="20" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Chat Messages */}
          <div className="chat-messages">
            {messages.map((message) => (
              <div 
                key={message.id} 
                className={`message message-${message.sender}`}
              >
                {message.sender === 'bot' && (
                  <div className="message-avatar">
                    {data.avatar ? (
                      <img src={data.avatar} alt="Bot" />
                    ) : (
                      <div className="message-avatar-placeholder">🤖</div>
                    )}
                  </div>
                )}
                <div className="message-content">
                  <div 
                    className="message-bubble"
                    style={message.sender === 'user' ? { backgroundColor: data.primaryColor } : {}}
                  >
                    {message.text}
                  </div>
                  <span className="message-time">{formatTime(message.timestamp)}</span>
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="message message-bot">
                <div className="message-avatar">
                  <div className="message-avatar-placeholder">🤖</div>
                </div>
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          <div className="chat-input-container">
            <form onSubmit={handleSendMessage} className="chat-input-form">
              {data.allowFileUpload && (
                <button type="button" className="chat-attach-button">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="20" 
                    height="20" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2"
                  >
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                  </svg>
                </button>
              )}
              
              <input
                type="text"
                className="chat-input"
                placeholder={data.placeholder}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
              />
              
              <button 
                type="submit" 
                className="chat-send-button"
                style={{ backgroundColor: data.primaryColor }}
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="20" 
                  height="20" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2"
                >
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </form>

            {/* Branding */}
            {data.showBranding && (
              <div className="chat-branding">
                Powered by <strong>ChatBot Builder</strong>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatbotPreview;