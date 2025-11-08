import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Sidebar from '../Sidebar/Sidebar';
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
  const [lastSavedMessageCount, setLastSavedMessageCount] = useState(0); // Track how many messages were saved
  const [isWaitingForAI, setIsWaitingForAI] = useState(false); // Track if waiting for AI response
  const chatContainerRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('okil_token');
    const userInfo = localStorage.getItem('okil_user');
    
    if (!token || !userInfo) {
      navigate('/login');
      return;
    }

    const parsedUser = JSON.parse(userInfo);
    
    // Allow both users and lawyers to access chat
    setUser(parsedUser);

    // Load recent chats from database
    loadRecentChats();

    // Check if we need to load a specific chat (from navigation state)
    if (location.state?.loadChatId) {
      handleLoadChat(location.state.loadChatId);
      // Clear the state after loading
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [navigate, location]);

  // Auto-scroll to bottom when chat history changes
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory]);

  const handleLogout = () => {
    localStorage.removeItem('okil_token');
    localStorage.removeItem('okil_user');
    navigate('/login');
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
    setLastSavedMessageCount(0);
    setMessage('');
  };

  // Save current chat to database
  const saveCurrentChat = async () => {
    if (chatHistory.length === 0) {
      console.log('⚠️ No chat history to save');
      return;
    }

    const token = localStorage.getItem('okil_token');
    if (!token) {
      console.log('❌ No token, cannot save chat');
      return;
    }

    console.log('💾 Saving chat to database...');
    console.log('Current chat ID:', currentChatId);
    console.log('Chat history length:', chatHistory.length);
    console.log('📋 Full chat history:', chatHistory);

    const firstUserMessage = chatHistory.find(msg => msg.type === 'user');
    const chatTitle = firstUserMessage 
      ? firstUserMessage.text.substring(0, 50) + (firstUserMessage.text.length > 50 ? '...' : '')
      : 'New Chat';

    // Filter out loading messages before saving
    const filteredHistory = chatHistory.filter(msg => !msg.loading);
    console.log('🔍 Filtered history (no loading):', filteredHistory);
    
    const messages = filteredHistory.map(msg => ({
      role: msg.type === 'user' ? 'user' : 'assistant',
      content: msg.text
    }));
    console.log('📤 Messages to save:', messages);

    // Don't save if there are no valid messages
    if (messages.length === 0) {
      console.log('⚠️ No valid messages to save (only loading messages)');
      return;
    }

    try {
      if (currentChatId && currentChatId.startsWith('db-')) {
        // Update existing session - send only NEW messages
        const sessionId = currentChatId.replace('db-', '');
        const newMessages = messages.slice(lastSavedMessageCount);
        
        if (newMessages.length === 0) {
          console.log('⏭️ No new messages to save');
          setIsChatSaved(true);
          return;
        }
        
        console.log(`🔄 Updating session with ${newMessages.length} new messages`);
        const response = await fetch(`http://localhost:8000/api/v1/chat/sessions/${sessionId}/messages`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(newMessages)
        });
        
        console.log('📥 Update response status:', response.status);
        
        if (response.ok) {
          console.log(`✅ Added ${newMessages.length} new messages`);
          setLastSavedMessageCount(messages.length);
        } else {
          const errorText = await response.text();
          console.error('❌ Failed to update session:', errorText);
        }
        setIsChatSaved(true);
      } else {
        // Create new session in database
        console.log('➕ Creating new session');
        const response = await fetch('http://localhost:8000/api/v1/chat/sessions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            title: chatTitle,
            messages: messages
          })
        });

        console.log('📥 Create response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ Session created:', data);
          setCurrentChatId(`db-${data.id}`);
          setLastSavedMessageCount(messages.length);
        } else {
          const errorText = await response.text();
          console.error('❌ Failed to create session:', errorText);
        }
        setIsChatSaved(true);
      }
      // Refresh recent chats from database
      loadRecentChats();
    } catch (error) {
      console.error('❌ Failed to save chat:', error);
      // Fallback to localStorage
      saveToLocalStorage();
    }
  };

  // Fallback: Save to localStorage
  const saveToLocalStorage = () => {
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
    const limitedChats = updatedChats.slice(0, 20);

    setRecentChats(limitedChats);
    localStorage.setItem('okil_recent_chats', JSON.stringify(limitedChats));
    setIsChatSaved(true);
  };

  // Load recent chats from database
  const loadRecentChats = async () => {
    const token = localStorage.getItem('okil_token');
    if (!token) {
      console.log('❌ No token found, cannot load chats');
      return;
    }

    console.log('🔄 Loading recent chats from database...');
    try {
      const response = await fetch('http://localhost:8000/api/v1/chat/sessions', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('📥 Response status:', response.status);
      
      if (response.ok) {
        const sessions = await response.json();
        console.log('✅ Loaded sessions:', sessions);
        const formattedChats = sessions.map(session => ({
          id: `db-${session.id}`,
          title: session.title,
          date: new Date(session.updated_at).toLocaleDateString(),
          messageCount: session.message_count,
          timestamp: new Date(session.updated_at).getTime()
        }));
        console.log('📝 Formatted chats:', formattedChats);
        setRecentChats(formattedChats);
      } else {
        console.error('❌ Failed to load chats, status:', response.status);
      }
    } catch (error) {
      console.error('❌ Failed to load chats:', error);
      // Fallback to localStorage
      const savedChats = localStorage.getItem('okil_recent_chats');
      if (savedChats) {
        console.log('📦 Using localStorage fallback');
        setRecentChats(JSON.parse(savedChats));
      }
    }
  };

  // Load a chat from database or recent chats
  const handleLoadChat = async (chatId) => {
    // Save current chat before loading a new one
    if (chatHistory.length > 0 && !isChatSaved && currentChatId !== chatId) {
      await saveCurrentChat();
    }

    const token = localStorage.getItem('okil_token');
    
    // If it's a database chat (starts with 'db-'), fetch from API
    if (chatId.startsWith('db-') && token) {
      const sessionId = chatId.replace('db-', '');
      
      try {
        console.log('🔄 Loading chat session:', sessionId);
        const response = await fetch(`http://localhost:8000/api/v1/chat/sessions/${sessionId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        console.log('📥 Load response status:', response.status);

        if (response.ok) {
          const session = await response.json();
          console.log('📦 Session data:', session);
          console.log('📨 Messages count:', session.messages?.length);
          
          const messages = session.messages.map(msg => ({
            type: msg.role === 'assistant' ? 'ai' : msg.role,
            text: msg.content
          }));
          
          console.log('✅ Mapped messages:', messages);
          setChatHistory(messages);
          setCurrentChatId(chatId);
          setIsChatSaved(true);
          setLastSavedMessageCount(messages.length); // Set count to loaded messages
          return;
        } else {
          const errorText = await response.text();
          console.error('❌ Failed to load session:', errorText);
        }
      } catch (error) {
        console.error('❌ Failed to load chat from database:', error);
      }
    }

    // Fallback to local storage
    const chat = recentChats.find(c => c.id === chatId);
    if (chat && chat.messages) {
      setChatHistory(chat.messages);
      setCurrentChatId(chat.id);
      setIsChatSaved(true);
    }
  };

  // Delete a chat from database and recent chats
  const handleDeleteChat = async (chatId) => {
    const token = localStorage.getItem('okil_token');
    
    // If it's a database chat, delete from API
    if (chatId.startsWith('db-') && token) {
      const sessionId = chatId.replace('db-', '');
      
      try {
        await fetch(`http://localhost:8000/api/v1/chat/sessions/${sessionId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      } catch (error) {
        console.error('Failed to delete chat from database:', error);
      }
    }

    // Update local state
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
      setIsWaitingForAI(true); // Set flag to prevent auto-save during AI response
      setChatHistory(prev => [...prev, { 
        type: 'ai', 
        text: '🔍 खोजी गर्दै... / Searching...',
        loading: true
      }]);
      
      try {
        // Call actual legal chat API
        // Only send last 4 messages (2 exchanges) to avoid huge request body
        const recentHistory = chatHistory.slice(-4).map(msg => ({
          role: msg.type === 'user' ? 'user' : 'assistant',
          content: msg.text.substring(0, 500) // Truncate long responses to 500 chars
        }));
        
        const response = await fetch('http://localhost:8000/api/v1/legal/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: userMessage,
            history: recentHistory,
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
        setIsWaitingForAI(false); // Clear flag - AI response received
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
        setIsWaitingForAI(false); // Clear flag even on error
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
    if (chatHistory.length > 0 && !isChatSaved && !isWaitingForAI) {
      const t = setTimeout(() => {
        saveCurrentChat();
      }, 1000); // Wait 1 second before auto-save
      return () => clearTimeout(t);
    }
  }, [chatHistory, isChatSaved, isWaitingForAI]);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  // Format message text with proper styling for headers
  const formatMessageText = (text) => {
    if (!text) return text;
    
    // Split by lines and format headers
    const lines = text.split('\n');
    const formatted = [];
    
    lines.forEach((line, idx) => {
      const trimmedLine = line.trim();
      
      // Check if line contains ** markers
      const hasBoldMarkers = trimmedLine.includes('**');
      
      if (hasBoldMarkers) {
        // Check if line starts with numbering (like "१. **text**" or "1. **text**")
        const numberedMatch = trimmedLine.match(/^([०-९0-9]+\.)\s*\*\*(.+?)\*\*/);
        
        if (numberedMatch) {
          const number = numberedMatch[1]; // "१." or "1."
          const headerText = numberedMatch[2]; // Text inside **
          
          // Get remaining text after the ** markers
          const afterBold = trimmedLine.substring(numberedMatch[0].length).trim();
          
          // Show number and header together in blue, then content below if exists
          formatted.push(
            <div key={`${idx}-header`} className="message-heading">
              {number} {headerText}
            </div>
          );
          
          if (afterBold) {
            formatted.push(
              <div key={`${idx}-content`} style={{ marginLeft: '20px', marginTop: '6px' }}>
                {afterBold}
              </div>
            );
          }
        } else {
          // Regular ** without numbering
          const boldMatches = trimmedLine.match(/\*\*(.+?)\*\*/g);
          
          if (boldMatches) {
            // Process each bold section
            boldMatches.forEach((match, matchIdx) => {
              const headerText = match.replace(/\*\*/g, '');
              
              // Show the header in blue
              formatted.push(
                <div key={`${idx}-header-${matchIdx}`} className="message-heading">
                  {headerText}
                </div>
              );
            });
            
            // Get the remaining text after all ** markers
            let remainingText = trimmedLine;
            boldMatches.forEach(match => {
              remainingText = remainingText.replace(match, '').trim();
            });
            
            // Show remaining text in normal color if it exists
            if (remainingText) {
              formatted.push(
                <div key={`${idx}-content`} style={{ marginTop: '6px' }}>
                  {remainingText}
                </div>
              );
            }
          }
        }
      } else if (trimmedLine === '') {
        // Empty line for spacing
        formatted.push(<div key={idx} style={{ height: '8px' }}></div>);
      } else {
        // Regular text without ** markers
        formatted.push(<div key={idx}>{line || '\u00A0'}</div>);
      }
    });
    
    return formatted;
  };

  if (!user) {
    return <div className="dashboard-loading">Loading...</div>;
  }

  return (
    <div className="user-dashboard-wrapper">
      <div className="user-dashboard">
        {/* Sidebar */}
        <Sidebar 
          role={user?.role}
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
        <div className="dashboard-chat-container" ref={chatContainerRef}>
          {chatHistory.length === 0 ? (
            <div className="dashboard-intro-section">
              <h2 className="dashboard-intro-text">Hey, How can I help you today?</h2>
            </div>
          ) : (
            <div className="dashboard-chat-messages">
              {chatHistory.map((msg, index) => (
                <div key={index} className={`dashboard-message dashboard-message-${msg.type}`}>
                  <div className="dashboard-message-content">
                    {msg.type === 'ai' ? formatMessageText(msg.text) : msg.text}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
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
              placeholder="Ask me anything about legal matters..."
              className="dashboard-message-input"
            />
            <button onClick={handleSendMessage} className="dashboard-send-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
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