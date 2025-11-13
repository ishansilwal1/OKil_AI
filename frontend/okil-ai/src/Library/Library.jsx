import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../Sidebar/Sidebar';
import ConfirmationModal from '../components/ConfirmationModal';
import './Library.css';

const Library = () => {
  const navigate = useNavigate();
  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState('user');
  const [activeTab, setActiveTab] = useState('acts'); // 'acts', 'ordinances', 'formats'
  const [recentChats, setRecentChats] = useState([]);
  const [documents, setDocuments] = useState({
    acts: [],
    ordinances: [],
    formats: []
  });
  const [fetchError, setFetchError] = useState(null);
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

    // Load recent chats from backend
    loadRecentChats();

    // Fetch documents from backend
    fetchDocuments();
  }, [navigate]);

  const loadRecentChats = async () => {
    const token = localStorage.getItem('okil_token');
    if (!token) return;

    const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';
    
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

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setFetchError(null);

      // Fetch documents for each category
      const [actsRes, ordinancesRes, formatsRes] = await Promise.all([
        fetch(`${API_BASE}/documents?category=Acts`),
        fetch(`${API_BASE}/documents?category=ordinance`),
        fetch(`${API_BASE}/documents?category=formats`)
      ]);

      const actsData = await actsRes.json();
      const ordinancesData = await ordinancesRes.json();
      const formatsData = await formatsRes.json();

      setDocuments({
        acts: Array.isArray(actsData) ? actsData : [],
        ordinances: Array.isArray(ordinancesData) ? ordinancesData : [],
        formats: Array.isArray(formatsData) ? formatsData : []
      });
    } catch (error) {
      console.error('Error fetching documents:', error);
      setFetchError('Failed to load documents. Please try again later.');
      setDocuments({ acts: [], ordinances: [], formats: [] });
    } finally {
      setLoading(false);
    }
  };

  const handleView = (doc) => {
    // Open PDF in new tab
    const pdfUrl = `${API_BASE}/documents/${doc.id}`;
    window.open(pdfUrl, '_blank');
  };

  const handleDownload = async (doc) => {
    try {
      // Fetch the PDF
      const response = await fetch(`${API_BASE}/documents/${doc.id}`);
      
      if (!response.ok) {
        throw new Error('Failed to download document');
      }
      
      const blob = await response.blob();
      
      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = doc.filename || 'document.pdf';
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(link);
      }, 100);
    } catch (error) {
      console.error('Error downloading document:', error);
      alert('Failed to download document. Please try again.');
    }
  };

  const handleNewChat = () => {
    // Both users and lawyers should go to user-dashboard (chat interface) for new chats
    navigate('/user-dashboard');
  };

  const handleLoadChat = (chatId) => {
    // Both users and lawyers should go to user-dashboard (chat interface) to view chats
    navigate(`/user-dashboard?chatId=${chatId}`);
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

    const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';
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

  const getActiveDocuments = () => {
    return documents[activeTab] || [];
  };

  return (
    <>
    <div className="library-wrapper">
      <div className="library-page">
        {/* Sidebar */}
        <Sidebar 
          role={role}
          activeMenu="library" 
          recentChats={recentChats}
          onNewChat={handleNewChat}
          onLoadChat={handleLoadChat}
          onDeleteChat={handleDeleteChat}
        />

      {/* Main Content */}
      <div className="library-main-content">
        <div className="library-header">
          <h1 className="library-title">Library</h1>
          <p className="library-subtitle">Explore the legal documents, Laws and templates.</p>
        </div>

        {/* Tab Navigation */}
        <div className="library-tabs-container">
          <div className="library-tabs">
            <button
              className={`library-tab ${activeTab === 'acts' ? 'active' : ''}`}
              onClick={() => setActiveTab('acts')}
            >
              ACTS ({documents.acts.length})
            </button>
            <button
              className={`library-tab ${activeTab === 'ordinances' ? 'active' : ''}`}
              onClick={() => setActiveTab('ordinances')}
            >
              Ordinances ({documents.ordinances.length})
            </button>
            <button
              className={`library-tab ${activeTab === 'formats' ? 'active' : ''}`}
              onClick={() => setActiveTab('formats')}
            >
              Formats ({documents.formats.length})
            </button>
          </div>

          {/* Error Message */}
          {fetchError && (
            <div className="library-error">
              <p>{fetchError}</p>
              <button onClick={fetchDocuments} className="library-retry-btn">
                Retry
              </button>
            </div>
          )}

          {/* Documents List */}
          <div className="library-documents">
            {loading ? (
              <div className="library-loading">Loading documents...</div>
            ) : getActiveDocuments().length === 0 ? (
              <div className="library-no-documents">
                <p>No documents available in this category.</p>
              </div>
            ) : (
              getActiveDocuments().map((doc) => (
                <div key={doc.id} className="library-document-item">
                  <span className="library-document-title">{doc.filename}</span>
                  <div className="library-document-actions">
                    <button
                      className="library-view-btn"
                      onClick={() => handleView(doc)}
                    >
                      View
                    </button>
                    <button
                      className="library-download-btn"
                      onClick={() => handleDownload(doc)}
                    >
                      Download
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
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

export default Library;
