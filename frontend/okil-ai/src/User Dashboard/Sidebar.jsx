import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = ({ 
  role: roleProp, // 'user' | 'lawyer' (optional, will auto-detect if not provided)
  activeMenu = 'newchat', 
  recentChats = [],
  onNewChat,
  onLoadChat,
  onDeleteChat,
  currentChatId
}) => {
  const navigate = useNavigate();

  // Detect role from localStorage if not explicitly provided
  const role = useMemo(() => {
    if (roleProp) return roleProp;
    try {
      const stored = localStorage.getItem('okil_user');
      if (!stored) return 'user';
      const parsed = JSON.parse(stored);
      return parsed?.role === 'lawyer' ? 'lawyer' : 'user';
    } catch {
      return 'user';
    }
  }, [roleProp]);

  const handleNewChat = () => {
    if (onNewChat) {
      onNewChat(); // Call parent's new chat handler
    } else {
      // Navigate to role-appropriate dashboard
      navigate(role === 'lawyer' ? '/lawyer-dashboard' : '/user-dashboard');
    }
  };

  const handleDashboard = () => {
    navigate('/lawyer-dashboard');
  };

  const handleTalkToLawyer = () => {
    navigate('/talk-to-lawyer');
  };

  const handleLibrary = () => {
    navigate('/library');
  };

  const handleSettings = () => {
    // TODO: Navigate to settings page
    console.log('Navigate to settings');
  };

  const handleSignOut = () => {
    localStorage.removeItem('okil_token');
    localStorage.removeItem('okil_user');
    navigate('/');
  };

  // Build menu based on role
  const menuItems = role === 'lawyer'
    ? [
        { key: 'dashboard', label: 'Dashboard', onClick: handleDashboard, icon: '/Dashboard.png' },
        { key: 'newchat', label: 'New chat', onClick: handleNewChat, icon: '/NewChat.png' },
        { key: 'library', label: 'Library', onClick: handleLibrary, icon: '/Library.png' },
      ]
    : [
        { key: 'newchat', label: 'New chat', onClick: handleNewChat, icon: '/NewChat.png' },
        { key: 'talktolawyer', label: 'Talk to lawyer', onClick: handleTalkToLawyer, icon: '/TalkToLawyer.png' },
        { key: 'library', label: 'Library', onClick: handleLibrary, icon: '/Library.png' },
      ];

  return (
    <div className="sidebar">
      {/* Logo Section */}
      <div className="sidebar-header">
        <div className="sidebar-logo-container">
          <div className="sidebar-logo-box">
            <img src="/logo.png" alt="Okil AI Logo" className="sidebar-logo-image" />
          </div>
          <span className="sidebar-logo-text">OKIL AI</span>
        </div>
      </div>

      {/* Menu Items */}
      <div className="sidebar-menu">
        {menuItems.map((item) => (
          <div
            key={item.key}
            className={`sidebar-menu-item ${activeMenu === item.key ? 'active' : ''}`}
            onClick={item.onClick}
          >
            {item.icon ? (
              <img src={item.icon} alt={item.label} className="sidebar-menu-icon-img" />
            ) : (
              <span style={{ width: 20 }} />
            )}
            <span className="sidebar-menu-text">{item.label}</span>
          </div>
        ))}
      </div>

      {/* Recent Chats */}
      <div className="sidebar-recent-chats">
        <h3>RECENT CHATS</h3>
        {recentChats.length === 0 ? (
          <p className="sidebar-no-chats">No recent chats</p>
        ) : (
          recentChats.map((chat) => (
            <div 
              key={chat.id} 
              className={`sidebar-chat-item ${currentChatId === chat.id ? 'active' : ''}`}
              onClick={() => onLoadChat && onLoadChat(chat.id)}
            >
              <div className="sidebar-chat-content">
                <div className="sidebar-chat-title">{chat.title}</div>
              </div>
              <button 
                className="sidebar-chat-delete"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteChat && onDeleteChat(chat.id);
                }}
                title="Delete chat"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                  <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                </svg>
              </button>
            </div>
          ))
        )}
      </div>

      {/* Bottom Menu */}
      <div className="sidebar-bottom-menu">
        <div className="sidebar-menu-item" onClick={handleSettings}>
          <img src="/Settings.png" alt="Settings" className="sidebar-menu-icon-img" />
          <span className="sidebar-menu-text">Settings</span>
        </div>
        <div className="sidebar-menu-item" onClick={handleSignOut}>
          <img src="/Logout.png" alt="Sign Out" className="sidebar-menu-icon-img" />
          <span className="sidebar-menu-text">Sign Out</span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
