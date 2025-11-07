import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../Sidebar/Sidebar';
import './Library.css';

const Library = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState('user');
  const [activeTab, setActiveTab] = useState('acts'); // 'acts', 'ordinances', 'formats'
  const [recentChats, setRecentChats] = useState([]);
  const [documents, setDocuments] = useState({
    acts: [
      { id: 1, title: 'Nepal Vehicle Act', file: '/documents/nepal-vehicle-act.pdf' },
      { id: 2, title: 'Nepal Labout Act', file: '/documents/nepal-labour-act.pdf' },
      { id: 3, title: 'Nepal Human Right Act', file: '/documents/nepal-human-right-act.pdf' }
    ],
    ordinances: [
      // Add ordinances here
    ],
    formats: [
      // Add formats here
    ]
  });

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('okil_token');
    const user = JSON.parse(localStorage.getItem('okil_user') || '{}');

    if (!token) {
      navigate('/');
      return;
    }
    setRole(user.role || 'user');

    // Load recent chats only for normal users; lawyers shouldn't see user chats here
    if ((user.role || 'user') !== 'lawyer') {
      const savedChats = localStorage.getItem('okil_recent_chats');
      if (savedChats) {
        setRecentChats(JSON.parse(savedChats));
      }
    } else {
      setRecentChats([]);
    }

    setLoading(false);
    
    // TODO: Fetch documents from backend
    // fetchDocuments();
  }, [navigate]);

  const handleView = (document) => {
    // TODO: Open document viewer modal or new tab
    console.log('View document:', document);
    alert(`Viewing: ${document.title}`);
  };

  const handleDownload = (document) => {
    // TODO: Download document
    console.log('Download document:', document);
    alert(`Downloading: ${document.title}`);
  };

  const handleNewChat = () => {
    navigate(role === 'lawyer' ? '/lawyer-dashboard' : '/user-dashboard');
  };

  const handleLoadChat = (chatId) => {
    const target = role === 'lawyer' ? '/lawyer-dashboard' : '/user-dashboard';
    navigate(target, { state: { loadChatId: chatId } });
  };

  const getActiveDocuments = () => {
    return documents[activeTab] || [];
  };

  if (loading) {
    return <div className="library-loading">Loading...</div>;
  }

  return (
    <div className="library-wrapper">
      <div className="library-page">
        {/* Sidebar */}
        <Sidebar 
          role={role}
          activeMenu="library" 
          recentChats={recentChats}
          onNewChat={handleNewChat}
          onLoadChat={handleLoadChat}
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
              ACTS
            </button>
            <button
              className={`library-tab ${activeTab === 'ordinances' ? 'active' : ''}`}
              onClick={() => setActiveTab('ordinances')}
            >
              Ordinances
            </button>
            <button
              className={`library-tab ${activeTab === 'formats' ? 'active' : ''}`}
              onClick={() => setActiveTab('formats')}
            >
              Formats
            </button>
          </div>

          {/* Documents List */}
          <div className="library-documents">
            {getActiveDocuments().length === 0 ? (
              <div className="library-no-documents">
                <p>No documents available in this category.</p>
              </div>
            ) : (
              getActiveDocuments().map((doc) => (
                <div key={doc.id} className="library-document-item">
                  <span className="library-document-title">{doc.title}</span>
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
  );
};

export default Library;
