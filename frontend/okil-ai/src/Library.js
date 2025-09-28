import React, { useState } from 'react';
import './Library.css';

const Library = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState('acts');

  // Document data for each category
  const documentData = {
    acts: [
      { id: 1, name: 'Nepal Vehicle Act' },
      { id: 2, name: 'Nepal Labour Act' },
      { id: 3, name: 'Nepal Human Right Act' },
      { id: 4, name: 'Nepal Constitution Act' },
      { id: 5, name: 'Nepal Civil Code Act' }
    ],
    ordinances: [
      { id: 1, name: 'Traffic Management Ordinance' },
      { id: 2, name: 'Employment Ordinance' },
      { id: 3, name: 'Business Registration Ordinance' },
      { id: 4, name: 'Tax Collection Ordinance' }
    ],
    formats: [
      { id: 1, name: 'Court Application Format' },
      { id: 2, name: 'Legal Notice Format' },
      { id: 3, name: 'Power of Attorney Format' },
      { id: 4, name: 'Agreement Template Format' }
    ]
  };

  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };

  const handleViewDocument = (document) => {
    console.log('Viewing document:', document.name);
    // Here you would typically open a document viewer or navigate to document details
    alert(`Opening ${document.name} for viewing...`);
  };

  const handleDownloadDocument = (document) => {
    console.log('Downloading document:', document.name);
    // Here you would typically trigger a download
    alert(`Downloading ${document.name}...`);
  };

  const getCurrentDocuments = () => {
    return documentData[activeTab] || [];
  };

  return (
    <div 
      className="library-container"
      style={{
        backgroundImage: `url(${process.env.PUBLIC_URL}/Background.png)`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center center',
        backgroundSize: 'cover'
      }}
    >
      {/* Header Section */}
      <div className="library-header">
        <h1 className="library-title">Library</h1>
        <p className="library-subtitle">Explore the legal documents, Laws and templates.</p>
      </div>

      {/* Main Content Area */}
      <div className="library-content">
        <div className="library-card">
          {/* Tab Navigation */}
          <div className="tab-navigation">
            <button 
              className={`tab-button ${activeTab === 'acts' ? 'active' : ''}`}
              onClick={() => handleTabClick('acts')}
            >
              ACTS
            </button>
            <button 
              className={`tab-button ${activeTab === 'ordinances' ? 'active' : ''}`}
              onClick={() => handleTabClick('ordinances')}
            >
              Ordinances
            </button>
            <button 
              className={`tab-button ${activeTab === 'formats' ? 'active' : ''}`}
              onClick={() => handleTabClick('formats')}
            >
              Formats
            </button>
          </div>

          {/* Document List */}
          <div className="document-list">
            {getCurrentDocuments().map((document) => (
              <div key={document.id} className="document-item">
                <div className="document-name">
                  {document.name}
                </div>
                <div className="document-actions">
                  <button 
                    className="view-btn"
                    onClick={() => handleViewDocument(document)}
                  >
                    View
                  </button>
                  <button 
                    className="download-btn"
                    onClick={() => handleDownloadDocument(document)}
                  >
                    Download
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Library;