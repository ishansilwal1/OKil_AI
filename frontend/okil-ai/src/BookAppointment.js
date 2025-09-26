import React, { useState } from 'react';
import './BookAppointment.css';

const BookAppointment = ({ onNavigate }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    preferredDate: '',
    preferredTime: '',
    issue: ''
  });
  const [isPopupVisible, setIsPopupVisible] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  // Simple working function
  const bookAppointment = () => {
    // Show success popup
    setIsPopupVisible(true);
    
    // After 2 seconds, hide popup and redirect
    setTimeout(() => {
      setIsPopupVisible(false);
      // Navigate back to talk-to-lawyer page
      if (onNavigate) {
        onNavigate('talk-to-lawyer');
      }
    }, 2000);
  };

  const handleBackToLawyers = () => {
    if (onNavigate) {
      onNavigate('talk-to-lawyer');
    }
  };

  return (
    <div 
      className="book-appointment-container"
      style={{
        backgroundImage: `url(${process.env.PUBLIC_URL}/Background.png)`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center center',
        backgroundSize: 'cover'
      }}
    >
      <div className="appointment-header">
        <h1 className="appointment-title">Talk To Lawyer</h1>
        <p className="appointment-subtitle">Please provide your details. A Lawyer will contact by shortly.</p>
      </div>

      <div className="appointment-form-container">
        <div className="form-card">
          <h2 className="form-title">Book an appointment to talk with lawyer</h2>
          
          <form className="appointment-form">
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
                placeholder="Enter Your Name"
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
              <label htmlFor="preferredDate" className="form-label">
                <span className="required">*</span> Your Preferred Date
              </label>
              <input
                type="date"
                id="preferredDate"
                name="preferredDate"
                value={formData.preferredDate}
                onChange={handleInputChange}
                placeholder="Select Your Preferred Date"
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="preferredTime" className="form-label">
                <span className="required">*</span> Your Preferred Time
              </label>
              <input
                type="time"
                id="preferredTime"
                name="preferredTime"
                value={formData.preferredTime}
                onChange={handleInputChange}
                placeholder="Select your preferred time"
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="issue" className="form-label">
                <span className="required">*</span> Your Issue
              </label>
              <textarea
                id="issue"
                name="issue"
                value={formData.issue}
                onChange={handleInputChange}
                placeholder="Briefly Describe Your Issue"
                className="form-textarea"
                rows="4"
                required
              />
            </div>

            <button 
              className="book-appointment-btn"
              onClick={bookAppointment}
            >
              Book Appointment
            </button>
          </form>
        </div>
      </div>

      {/* Success Popup */}
      {isPopupVisible && (
        <div className="popup-overlay">
          <div className="popup-content">
            <div className="popup-icon">✓</div>
            <h3 className="popup-title">Appointment Booked!</h3>
            <p className="popup-message">Your appointment has been successfully booked. A lawyer will contact you shortly.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookAppointment;