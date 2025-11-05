import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import './TalkToLawyer.css';

const TalkToLawyer = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [recentChats, setRecentChats] = useState([]);
  const [currentView, setCurrentView] = useState('list'); // 'list', 'appointment', 'query'
  const [selectedLawyer, setSelectedLawyer] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    preferredDate: '',
    preferredTime: '',
    query: '',
    queryDetail: '',
    issue: ''
  });
  const [lawyers, setLawyers] = useState([
    {
      id: 1,
      name: '',
      barCouncilNumber: '',
      expertise: '',
      mailAddress: ''
    },
    {
      id: 2,
      name: '',
      barCouncilNumber: '',
      expertise: '',
      mailAddress: ''
    },
    {
      id: 3,
      name: '',
      barCouncilNumber: '',
      expertise: '',
      mailAddress: ''
    },
    {
      id: 4,
      name: '',
      barCouncilNumber: '',
      expertise: '',
      mailAddress: ''
    }
  ]);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('okil_token');
    const user = JSON.parse(localStorage.getItem('okil_user') || '{}');

    if (!token) {
      navigate('/login');
      return;
    }

    // Redirect lawyers to their dashboard
    if (user.role === 'lawyer') {
      navigate('/lawyer-dashboard');
      return;
    }

    // Load recent chats from localStorage
    const savedChats = localStorage.getItem('okil_recent_chats');
    if (savedChats) {
      setRecentChats(JSON.parse(savedChats));
    }

    setLoading(false);
    
    // TODO: Fetch lawyers list from backend
    // fetchLawyers();
  }, [navigate]);

  const handleTalkToLawyerClick = (lawyer) => {
    setSelectedLawyer(lawyer);
    setCurrentView('appointment');
  };

  const handleLeaveQuery = (lawyer) => {
    setSelectedLawyer(lawyer);
    setCurrentView('query');
  };

  const handleNewChat = () => {
    navigate('/user-dashboard');
  };

  const handleLoadChat = (chatId) => {
    navigate('/user-dashboard', { state: { loadChatId: chatId } });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleBookAppointment = (e) => {
    e.preventDefault();
    // TODO: Submit appointment booking to backend
    console.log('Booking appointment:', { ...formData, lawyer: selectedLawyer });
    alert('Appointment request sent! A lawyer will contact you shortly.');
    setCurrentView('list');
    setFormData({
      name: '',
      email: '',
      preferredDate: '',
      preferredTime: '',
      query: '',
      queryDetail: '',
      issue: ''
    });
  };

  const handleSubmitQuery = (e) => {
    e.preventDefault();
    // TODO: Submit query to backend
    console.log('Submitting query:', { ...formData, lawyer: selectedLawyer });
    alert('Query submitted! A lawyer will respond via email.');
    setCurrentView('list');
    setFormData({
      name: '',
      email: '',
      preferredDate: '',
      preferredTime: '',
      query: '',
      queryDetail: '',
      issue: ''
    });
  };

  const handleBackToList = () => {
    setCurrentView('list');
    setSelectedLawyer(null);
  };

  if (loading) {
    return <div className="lawyer-loading">Loading...</div>;
  }

  return (
    <div className="talk-to-lawyer-wrapper">
      <div className="talk-to-lawyer-page">
        {/* Sidebar */}
        <Sidebar 
          activeMenu="talktolawyer" 
          recentChats={recentChats}
          onNewChat={handleNewChat}
          onLoadChat={handleLoadChat}
        />

      {/* Main Content */}
      <div className="lawyer-main-content">
        {currentView === 'list' && (
          <>
            <div className="lawyer-page-header">
              <h1 className="lawyer-page-title">Talk To Lawyer</h1>
            </div>

            {/* Lawyers Grid */}
            <div className="lawyers-grid">
              {lawyers.map((lawyer) => (
                <div key={lawyer.id} className="lawyer-card">
                  <div className="lawyer-info">
                    <div className="lawyer-field">
                      <span className="lawyer-label">Name:</span>
                      <span className="lawyer-value">{lawyer.name || ''}</span>
                    </div>
                    <div className="lawyer-field">
                      <span className="lawyer-label">BAR council number:</span>
                      <span className="lawyer-value">{lawyer.barCouncilNumber || ''}</span>
                    </div>
                    <div className="lawyer-field">
                      <span className="lawyer-label">Expertise:</span>
                      <span className="lawyer-value">{lawyer.expertise || ''}</span>
                    </div>
                    <div className="lawyer-field">
                      <span className="lawyer-label">Mail address:</span>
                      <span className="lawyer-value">{lawyer.mailAddress || ''}</span>
                    </div>
                  </div>
                  <div className="lawyer-actions">
                    <button 
                      className="lawyer-talk-btn"
                      onClick={() => handleTalkToLawyerClick(lawyer)}
                    >
                      Talk To Lawyer
                    </button>
                    <button 
                      className="lawyer-query-btn"
                      onClick={() => handleLeaveQuery(lawyer)}
                    >
                      Leave a query
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {currentView === 'appointment' && (
          <div className="appointment-view">
            <div className="appointment-header">
              <h1 className="appointment-title">Talk To Lawyer</h1>
              <p className="appointment-subtitle">Please provide your details. A Lawyer will contact by shortly.</p>
            </div>

            <div className="appointment-form-container">
              <form onSubmit={handleBookAppointment} className="appointment-form">
                <h2 className="form-title">Book an appointment to talk with lawyer</h2>
                
                <div className="form-group">
                  <label className="form-label">
                    <span className="required">*</span> Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter full name"
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <span className="required">*</span> Mail Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="enter your mail address"
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <span className="required">*</span> Your Preffered Date
                  </label>
                  <input
                    type="text"
                    name="preferredDate"
                    value={formData.preferredDate}
                    onChange={handleInputChange}
                    placeholder="select your preffered date"
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <span className="required">*</span> Your Preffered Time
                  </label>
                  <input
                    type="text"
                    name="preferredTime"
                    value={formData.preferredTime}
                    onChange={handleInputChange}
                    placeholder="select your preffered time"
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <span className="required">*</span> Your Issue
                  </label>
                  <textarea
                    name="issue"
                    value={formData.issue}
                    onChange={handleInputChange}
                    placeholder="Briefly Describe Your Issue"
                    className="form-textarea"
                    rows="4"
                    required
                  />
                </div>

                <div className="form-actions">
                  <button type="submit" className="submit-btn">Book Appointment</button>
                  <button type="button" onClick={handleBackToList} className="back-btn">Back</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {currentView === 'query' && (
          <div className="query-view">
            <div className="query-header">
              <h1 className="query-title">Submit Your Legal Query</h1>
              <p className="query-subtitle">Please provide your question and contact details. A Lawyer will respond via email.</p>
            </div>

            <div className="query-form-container">
              <form onSubmit={handleSubmitQuery} className="query-form">
                <h2 className="form-title">What Is Your Legal Query?</h2>
                
                <div className="form-group">
                  <label className="form-label">
                    <span className="required">*</span> Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="enter full name"
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <span className="required">*</span> Mail Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="enter your mail address"
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <span className="required">*</span> Your Query
                  </label>
                  <input
                    type="text"
                    name="query"
                    value={formData.query}
                    onChange={handleInputChange}
                    placeholder="select your preffered date"
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <span className="required">*</span> Your Query in Detail
                  </label>
                  <textarea
                    name="queryDetail"
                    value={formData.queryDetail}
                    onChange={handleInputChange}
                    placeholder="Briefly Describe Your Query"
                    className="form-textarea"
                    rows="4"
                    required
                  />
                </div>

                <div className="form-actions">
                  <button type="submit" className="submit-btn">Submit Query</button>
                  <button type="button" onClick={handleBackToList} className="back-btn">Back</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
    </div>
  );
};

export default TalkToLawyer;
