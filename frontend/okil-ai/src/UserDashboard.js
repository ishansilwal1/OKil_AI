import React, { useState } from 'react';
import './UserDashboard.css';

const UserDashboard = ({ user, onLogout }) => {
  const [currentChatId, setCurrentChatId] = useState(null);
  const [message, setMessage] = useState('');
  const [allChats, setAllChats] = useState({}); // Store all chat conversations
  const [recentChats, setRecentChats] = useState([]);

  // Get current chat history
  const chatHistory = currentChatId && allChats[currentChatId] ? allChats[currentChatId].messages : [];

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (message.trim()) {
      let chatId = currentChatId;
      
      // Create new chat if no active chat
      if (!chatId) {
        chatId = Date.now();
        const chatTitle = message.length > 30 ? message.substring(0, 30) + '...' : message;
        
        // Add to recent chats
        setRecentChats(prev => [{ id: chatId, title: chatTitle }, ...prev.slice(0, 9)]);
        
        // Initialize new chat
        setAllChats(prev => ({
          ...prev,
          [chatId]: { id: chatId, title: chatTitle, messages: [] }
        }));
        
        setCurrentChatId(chatId);
      }
      
      const userMessage = { id: Date.now(), text: message, type: 'user' };
      
      // Update chat with new message
      setAllChats(prev => ({
        ...prev,
        [chatId]: {
          ...prev[chatId],
          messages: [...(prev[chatId]?.messages || []), userMessage]
        }
      }));
      
      setMessage('');
      
      // Simulate AI response
      setTimeout(() => {
        const aiResponse = {
          id: Date.now() + 1,
          text: getAIResponse(userMessage.text),
          type: 'ai'
        };
        
        setAllChats(prev => ({
          ...prev,
          [chatId]: {
            ...prev[chatId],
            messages: [...prev[chatId].messages, aiResponse]
          }
        }));
      }, 1000);
    }
  };

  const getAIResponse = (userMessage) => {
    if (userMessage.toLowerCase().includes('human rights') || userMessage.toLowerCase().includes('nepal')) {
      return "The Human Rights Act of Nepal provides a legal framework to protect, promote, and enforce the fundamental rights and freedoms of individuals as guaranteed by the Constitution. It also establishes the National Human Rights Commission to investigate violations and ensure accountability.";
    }
    return "I'm here to help you with legal matters. Could you please provide more details about your question?";
  };

  const handleNewChat = () => {
    setCurrentChatId(null);
  };

  const handleChatSelect = (chatId) => {
    setCurrentChatId(chatId);
  };

  return (
    <div className="user-dashboard">
      {/* Sidebar */}
      <div className="sidebar">
        {/* Logo Section */}
        <div className="sidebar-header">
          <div className="logo-container">
            <img src="/logo.png" alt="OKIL AI" className="sidebar-logo" />
            <span className="sidebar-logo-text">OKIL AI</span>
          </div>
        </div>

        {/* Navigation Menu */}
        <div className="sidebar-menu">
          <div className="menu-item active" onClick={handleNewChat}>
            <img src="/new chat.png" alt="New chat" className="menu-icon" />
            <span>New chat</span>
          </div>

          <div className="menu-item">
            <img src="/talk.png" alt="Talk to lawyer" className="menu-icon" />
            <span>Talk to lawyer</span>
          </div>

          <div className="menu-item">
            <img src="/library.png" alt="Library" className="menu-icon" />
            <span>Library</span>
          </div>
        </div>

        {/* Recent Chats Section */}
        <div className="recent-chats-section">
          <h3 className="recent-chats-title">RECENT CHATS</h3>
          <div className="recent-chats-list">
            {recentChats.map(chat => (
              <div 
                key={chat.id} 
                className={`recent-chat-item ${
                  currentChatId === chat.id ? 'active' : ''
                }`}
                onClick={() => handleChatSelect(chat.id)}
              >
                {chat.title}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Menu */}
        <div className="sidebar-footer">
          <div className="menu-item">
            <svg className="menu-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
            <span>Settings</span>
          </div>

          <div className="menu-item" onClick={onLogout}>
            <svg className="menu-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16,17 21,12 16,7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            <span>Sign Out</span>
          </div>
        </div>
      </div>

      {/* Main Content Area - No Header */}
      <div className="main-content">
        {/* Chat Container */}
        <div className="chat-container">
          <div className="chat-messages">
            {chatHistory.length === 0 ? (
              <div className="welcome-message">
                <h2>Hey, How can I help you Today</h2>
              </div>
            ) : (
              <div className="message-list">
                {chatHistory.map(msg => (
                  <div key={msg.id} className={`message-container ${msg.type}`}>
                    <div className={`message-bubble ${msg.type}-bubble`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="chat-input-container">
            <form onSubmit={handleSendMessage} className="chat-form">
              <div className="input-wrapper">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ask me anything about legal matter..."
                  className="chat-input"
                />
                <button type="submit" className="send-button" disabled={!message.trim()}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2"/>
                    <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;