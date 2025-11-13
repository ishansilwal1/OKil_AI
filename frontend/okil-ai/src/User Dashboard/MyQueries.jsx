import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../Sidebar/Sidebar';
import ConfirmationModal from '../components/ConfirmationModal';
import './MyQueries.css';

const MyQueries = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [queries, setQueries] = useState([]);
  const [recentChats, setRecentChats] = useState([]);
  const [role, setRole] = useState('user');
  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [chatToDelete, setChatToDelete] = useState(null);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('okil_token');
    const user = JSON.parse(localStorage.getItem('okil_user') || '{}');

    if (!token) {
      navigate('/login');
      return;
    }

    setRole(user.role || 'user');
    loadRecentChats();
    fetchQueries();
  }, [navigate]);

  const loadRecentChats = async () => {
    const token = localStorage.getItem('okil_token');
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE}/api/v1/chat/sessions`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const sessions = await response.json();
        const formattedChats = sessions.map(session => ({
          id: `db-${session.id}`,
          title: session.title,
          date: new Date(session.updated_at).toLocaleDateString(),
          messageCount: session.message_count,
          timestamp: new Date(session.updated_at).getTime()
        }));
        setRecentChats(formattedChats);
      }
    } catch (error) {
      console.error('Failed to load chats:', error);
    }
  };

  const fetchQueries = async () => {
    const token = localStorage.getItem('okil_token');
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE}/queries`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setQueries(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Failed to fetch queries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewChat = () => {
    navigate('/user-dashboard');
  };

  const handleLoadChat = (chatId) => {
    navigate('/user-dashboard', { state: { loadChatId: chatId } });
  };

  const handleDeleteChat = async (chatId) => {
    // Show confirmation modal
    setChatToDelete(chatId);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!chatToDelete) return;

    const token = localStorage.getItem('okil_token');
    if (!token) return;

    const sessionId = chatToDelete.replace('db-', '');
    
    try {
      await fetch(`${API_BASE}/api/v1/chat/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      setRecentChats(prev => prev.filter(chat => chat.id !== chatToDelete));
    } catch (error) {
      console.error('Failed to delete chat:', error);
    }

    // Close modal
    setShowDeleteModal(false);
    setChatToDelete(null);
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setChatToDelete(null);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'answered':
        return '#10b981';
      case 'pending':
        return '#f59e0b';
      case 'closed':
        return '#6b7280';
      default:
        return '#6b7280';
    }
  };

  if (loading) {
    return <div className="queries-loading">Loading...</div>;
  }

  return (
    <>
    <div className="queries-wrapper">
      <Sidebar 
        role={role}
        activeMenu="queries"
        recentChats={recentChats}
        onNewChat={handleNewChat}
        onLoadChat={handleLoadChat}
        onDeleteChat={handleDeleteChat}
      />

      <div className="queries-main-content">
        <div className="queries-header">
          <h1 className="queries-title">My Queries</h1>
          <p className="queries-subtitle">Track your legal questions and responses</p>
        </div>

        <div className="queries-list">
          {queries.length === 0 ? (
            <div className="no-queries">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="10"/>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              <h3>No Queries Yet</h3>
              <p>Submit your first legal question to a lawyer</p>
              <button onClick={() => navigate('/talk-to-lawyer')} className="submit-query-btn">
                Submit Query
              </button>
            </div>
          ) : (
            queries.map(query => (
              <div key={query.id} className="query-card">
                <div className="query-card-header">
                  <h3>{query.query_text || 'Legal Query'}</h3>
                  <span 
                    className="query-status"
                    style={{ backgroundColor: getStatusColor(query.status) }}
                  >
                    {query.status || 'Pending'}
                  </span>
                </div>

                <div className="query-details">
                  {query.query_detail && (
                    <div className="query-detail-item">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                        <line x1="16" y1="13" x2="8" y2="13"/>
                        <line x1="16" y1="17" x2="8" y2="17"/>
                        <polyline points="10 9 9 9 8 9"/>
                      </svg>
                      <span className="query-detail-text">{query.query_detail}</span>
                    </div>
                  )}

                  <div className="query-meta">
                    <div className="query-detail-item">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                      </svg>
                      <span>Lawyer: {query.lawyer_name || 'Not assigned'}</span>
                    </div>

                    <div className="query-detail-item">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/>
                        <line x1="8" y1="2" x2="8" y2="6"/>
                        <line x1="3" y1="10" x2="21" y2="10"/>
                      </svg>
                      <span>{new Date(query.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {query.answer && (
                  <div className="query-answer">
                    <div className="answer-header">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      <span>Answer:</span>
                    </div>
                    <p>{query.answer}</p>
                  </div>
                )}

                <div className="query-actions">
                  {query.status === 'answered' && (
                    <button className="action-btn primary">
                      View Full Answer
                    </button>
                  )}
                  {query.status === 'pending' && (
                    <button className="action-btn secondary" disabled>
                      Waiting for Response
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>

    <ConfirmationModal
      isOpen={showDeleteModal}
      onConfirm={confirmDelete}
      onCancel={cancelDelete}
      title="Delete Chat"
      message="Are you sure you want to delete this chat? This action cannot be undone."
    />
    </>
  );
};

export default MyQueries;
