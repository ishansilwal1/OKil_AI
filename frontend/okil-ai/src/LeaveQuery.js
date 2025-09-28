import React, { useState } from 'react';
import './LeaveQuery.css';

const LeaveQuery = ({ onNavigate }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    query: '',
    queryDetail: ''
  });
  const [isPopupVisible, setIsPopupVisible] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const submitQuery = (e) => {
    // Prevent any default behavior
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    console.log('Submit Query clicked');
    console.log('Form data:', formData);
    
    // Check if all fields are filled
    if (formData.name && formData.email && formData.query && formData.queryDetail) {
      // Show success popup
      setIsPopupVisible(true);
      console.log('Query submitted successfully');
      
      // After 3 seconds, hide popup and redirect
      setTimeout(() => {
        console.log('Hiding popup and navigating back');
        setIsPopupVisible(false);
        
        // Navigate back to talk-to-lawyer page
        setTimeout(() => {
          if (onNavigate && typeof onNavigate === 'function') {
            console.log('Calling onNavigate with talk-to-lawyer');
            onNavigate('talk-to-lawyer');
          } else {
            console.error('onNavigate is not available:', onNavigate);
          }
        }, 100);
      }, 3000);
    } else {
      // Show alert for missing fields
      const missingFields = [];
      if (!formData.name) missingFields.push('Name');
      if (!formData.email) missingFields.push('Mail Address');
      if (!formData.query) missingFields.push('Your Query');
      if (!formData.queryDetail) missingFields.push('Query in Detail');
      
      alert(`Please fill in the following fields: ${missingFields.join(', ')}`);
    }
  };

  return (
    <div 
      className="leave-query-container"
      style={{
        backgroundImage: `url(${process.env.PUBLIC_URL}/Background.png)`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center center',
        backgroundSize: 'cover'
      }}
    >
      <div className="query-header">
        <h1 className="query-title">Submit Your Legal Query</h1>
        <p className="query-subtitle">Please provide your question and contact details. A Lawyer will respond via email.</p>
      </div>

      <div className="query-form-container">
        <div className="form-card">
          <h2 className="form-title">Leave Your Legal Query</h2>
          
          <form className="query-form" onSubmit={(e) => e.preventDefault()}>
            <div className="form-group">
              <label htmlFor="name" className="form-label">
                <span className="required">*</span> Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter Full Name"
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email" className="form-label">
                <span className="required">*</span> Mail Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter your mail address"
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="query" className="form-label">
                <span className="required">*</span> Your Query
              </label>
              <input
                type="text"
                id="query"
                name="query"
                value={formData.query}
                onChange={handleInputChange}
                placeholder="Subject your preferred one"
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="queryDetail" className="form-label">
                <span className="required">*</span> Your Query in Detail
              </label>
              <textarea
                id="queryDetail"
                name="queryDetail"
                value={formData.queryDetail}
                onChange={handleInputChange}
                placeholder="Briefly Describe Your Query"
                className="form-textarea"
                rows="4"
                required
              />
            </div>

            <button 
              type="button"
              className="submit-query-btn"
              onClick={submitQuery}
            >
              Submit Query
            </button>
          </form>
        </div>
      </div>

      {/* Success Popup */}
      {isPopupVisible && (
        <div className="popup-overlay" style={{ zIndex: 9999 }}>
          <div className="popup-content">
            <div className="popup-icon">✓</div>
            <h3 className="popup-title">Query Submitted!</h3>
            <p className="popup-message">Your legal query has been successfully submitted. A lawyer will respond via email shortly.</p>
            <p style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
              Redirecting to Talk to Lawyer page in 3 seconds...
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveQuery;