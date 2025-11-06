import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import './UserDashboard.css';

const UserDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [recentChats, setRecentChats] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [isChatSaved, setIsChatSaved] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('okil_token');
    const userInfo = localStorage.getItem('okil_user');
    
    if (!token || !userInfo) {
      navigate('/');
      return;
    }

    const parsedUser = JSON.parse(userInfo);
    
    // Ensure user has correct role
    if (parsedUser.role !== 'user') {
      navigate('/lawyer-dashboard');
      return;
    }
    
    setUser(parsedUser);

    // Load recent chats from localStorage
    const savedChats = localStorage.getItem('okil_recent_chats');
    if (savedChats) {
      setRecentChats(JSON.parse(savedChats));
    }

    // Check if we need to load a specific chat (from navigation state)
    if (location.state?.loadChatId) {
      const chatToLoad = JSON.parse(savedChats || '[]').find(c => c.id === location.state.loadChatId);
      if (chatToLoad) {
        setChatHistory(chatToLoad.messages);
        setCurrentChatId(chatToLoad.id);
        setIsChatSaved(true);
      }
      // Clear the state after loading
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [navigate, location]);

  const handleLogout = () => {
    localStorage.removeItem('okil_token');
    localStorage.removeItem('okil_user');
    navigate('/');
  };

  // Create a new chat
  const handleNewChat = () => {
    // Save current chat if it has messages
    if (chatHistory.length > 0 && !isChatSaved) {
      saveCurrentChat();
    }
    
    // Reset to new chat
    setChatHistory([]);
    setCurrentChatId(null);
    setIsChatSaved(false);
    setMessage('');
  };

  // Save current chat to recent chats
  const saveCurrentChat = () => {
    if (chatHistory.length === 0) return;

    const chatId = currentChatId || Date.now().toString();
    const firstUserMessage = chatHistory.find(msg => msg.type === 'user');
    const chatTitle = firstUserMessage 
      ? firstUserMessage.text.substring(0, 50) + (firstUserMessage.text.length > 50 ? '...' : '')
      : 'New Chat';

    const newChat = {
      id: chatId,
      title: chatTitle,
      date: new Date().toLocaleDateString(),
      messages: chatHistory,
      timestamp: Date.now()
    };

    const updatedChats = [newChat, ...recentChats.filter(chat => chat.id !== chatId)];
    const limitedChats = updatedChats.slice(0, 20); // Keep only last 20 chats

    setRecentChats(limitedChats);
    localStorage.setItem('okil_recent_chats', JSON.stringify(limitedChats));
    setIsChatSaved(true);
  };

  // Load a chat from recent chats
  const handleLoadChat = (chatId) => {
    // Save current chat before loading a new one
    if (chatHistory.length > 0 && !isChatSaved && currentChatId !== chatId) {
      saveCurrentChat();
    }

    const chat = recentChats.find(c => c.id === chatId);
    if (chat) {
      setChatHistory(chat.messages);
      setCurrentChatId(chat.id);
      setIsChatSaved(true);
    }
  };

  // Delete a chat from recent chats
  const handleDeleteChat = (chatId) => {
    const updatedChats = recentChats.filter(chat => chat.id !== chatId);
    setRecentChats(updatedChats);
    localStorage.setItem('okil_recent_chats', JSON.stringify(updatedChats));
    
    // If deleting the current chat, reset
    if (currentChatId === chatId) {
      setChatHistory([]);
      setCurrentChatId(null);
      setIsChatSaved(false);
    }
  };

  const handleSendMessage = async () => {
    if (message.trim()) {
      const userMessage = message.trim();
      const newChatHistory = [...chatHistory, { type: 'user', text: userMessage }];
      setChatHistory(newChatHistory);
      setMessage('');
      
      // Auto-save to recent chats when first message is sent
      if (chatHistory.length === 0) {
        setCurrentChatId(Date.now().toString());
        setIsChatSaved(false);
      } else {
        setIsChatSaved(false); // Mark as unsaved when chat is modified
      }
      
      // Add loading message
      setChatHistory(prev => [...prev, { 
        type: 'ai', 
        text: '🔍 खोजी गर्दै... / Searching...',
        loading: true
      }]);
      
      try {
        // Call actual legal chat API
        const response = await fetch('http://localhost:8000/api/v1/legal/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: userMessage,
            history: chatHistory.map(msg => ({
              role: msg.type === 'user' ? 'user' : 'assistant',
              content: msg.text
            })),
            top_k: 3
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        // Replace loading message with actual answer
        setChatHistory(prev => {
          const withoutLoading = prev.filter(msg => !msg.loading);
          return [...withoutLoading, { 
            type: 'ai', 
            text: data.answer,
            sources: data.sources
          }];
        });
        setIsChatSaved(false); // Mark as unsaved after AI response
        
      } catch (error) {
        console.error('Error calling chat API:', error);
        // Replace loading message with error message
        setChatHistory(prev => {
          const withoutLoading = prev.filter(msg => !msg.loading);
          return [...withoutLoading, { 
            type: 'ai', 
            text: '❌ माफ गर्नुहोस्, त्रुटि भयो। कृपया पुन: प्रयास गर्नुहोस्।\n\nSorry, an error occurred. Please try again.'
          }];
        });
        setIsChatSaved(false);
      }
    }
  };

  // Auto-save chat when navigating away or closing
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (chatHistory.length > 0 && !isChatSaved) {
        saveCurrentChat();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [chatHistory, isChatSaved]);

  // Auto-save whenever chat history changes (debounced)
  useEffect(() => {
    if (chatHistory.length > 0 && !isChatSaved) {
      const t = setTimeout(() => {
        saveCurrentChat();
      }, 600); // debounce to avoid excessive writes
      return () => clearTimeout(t);
    }
  }, [chatHistory, isChatSaved]);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  if (!user) {
    return <div className="dashboard-loading">Loading...</div>;
  }

  return (
    <div className="user-dashboard-wrapper">
      <div className="user-dashboard">
        {/* Sidebar */}
        <Sidebar 
          activeMenu={currentChatId ? "recentchat" : "newchat"} 
          recentChats={recentChats}
          onNewChat={handleNewChat}
          onLoadChat={handleLoadChat}
          onDeleteChat={handleDeleteChat}
          currentChatId={currentChatId}
        />

      {/* Main Content */}
      <div className="dashboard-main-content">
        {/* Chat Area */}
        <div className="dashboard-chat-container">
          {chatHistory.length === 0 ? (
            <div className="dashboard-intro-section">
              <h2 className="dashboard-intro-text">Hey, How can I help you Today</h2>
            </div>
          ) : (
            <div className="dashboard-chat-messages">
              {chatHistory.map((msg, index) => (
                <div key={index} className={`dashboard-message dashboard-message-${msg.type}`}>
                  <div className="dashboard-message-content">{msg.text}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="dashboard-input-section">
          <div className="dashboard-input-box">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about legal matter..."
              className="dashboard-message-input"
            />
            <button onClick={handleSendMessage} className="dashboard-send-btn">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
};

export default UserDashboard;