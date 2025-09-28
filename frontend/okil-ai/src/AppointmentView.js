import React, { useState } from 'react';
import './AppointmentView.css';

const AppointmentView = ({ appointment, onBack, user }) => {
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Default appointment data if none provided
  const appointmentData = appointment || {
    id: 1,
    clientName: 'John Smith',
    email: 'johnsmith@gmail.com',
    date: '2025 Sept 25',
    time: '11:05 A.M - 11:25 A.M',
    issue: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry\'s standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it'
  };

  const handleAcceptAppointment = async () => {
    setIsProcessing(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert(`Appointment with ${appointmentData.clientName} has been accepted successfully!`);
      // You can extend this to:
      // - Send confirmation email to client
      // - Update appointment status in database
      // - Add to calendar
      console.log('Appointment accepted:', appointmentData);
    } catch (error) {
      alert('Failed to accept appointment. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReschedule = () => {
    const newDate = prompt('Please enter new preferred date (YYYY MMM DD format):', appointmentData.date);
    const newTime = prompt('Please enter new preferred time (HH:MM A.M - HH:MM A.M format):', appointmentData.time);
    
    if (newDate && newTime) {
      alert(`Appointment rescheduled to ${newDate} at ${newTime}\nClient will be notified via email.`);
      // You can extend this to:
      // - Update appointment in database
      // - Send rescheduling email to client
      // - Update calendar
      console.log('Appointment rescheduled:', { ...appointmentData, date: newDate, time: newTime });
    }
  };

  const handleDeclineAppointment = () => {
    const reason = prompt('Please provide a reason for declining (optional):');
    const confirmed = window.confirm('Are you sure you want to decline this appointment?');
    
    if (confirmed) {
      alert(`Appointment with ${appointmentData.clientName} has been declined.\nClient will be notified via email.`);
      // You can extend this to:
      // - Update appointment status in database
      // - Send decline notification to client
      // - Log decline reason
      console.log('Appointment declined:', { ...appointmentData, declineReason: reason });
      if (onBack) {
        onBack();
      }
    }
  };

  const handleNotesChange = (e) => {
    setNotes(e.target.value);
  };

  const handleBackToDashboard = () => {
    if (onBack) {
      onBack();
    }
  };

  return (
    <div 
      className="appointment-view"
      style={{
        backgroundImage: `url(${process.env.PUBLIC_URL}/Background.png)`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Sidebar - Same as Dashboard */}
      <div className="sidebar">
        <div className="logo-section">
          <img src="/logo.png" alt="OKIL AI" className="logo" />
          <span className="logo-text">OKIL AI</span>
        </div>
        
        <nav className="nav-menu">
          <div 
            className="nav-item"
            onClick={handleBackToDashboard}
          >
            <span className="nav-icon-text">📊</span>
            <span>Dashboard</span>
          </div>
          <div className="nav-item">
            <img src="/new chat.png" alt="New Chat" className="nav-icon" />
            <span>New chat</span>
          </div>
          <div className="nav-item">
            <img src="/Library.png" alt="Library" className="nav-icon" />
            <span>Library</span>
          </div>
          
          <div className="recent-chats">
            <h4>RECENT CHATS</h4>
          </div>
        </nav>

        {/* Bottom Section - Settings and Sign Out */}
        <div className="sidebar-bottom">
          <div className="nav-item settings-item">
            <span className="nav-icon-text">⚙️</span>
            <span>Settings</span>
          </div>
          <div className="nav-item signout-item">
            <span className="nav-icon-text">🚪</span>
            <span>Sign Out</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <div className="appointment-content">
          <h1 className="page-title">Appointment Details</h1>
          
          {/* Appointment Details Card */}
          <div className="appointment-details-frame">
            <div className="appointment-card">
              <div className="appointment-info">
                <div className="info-row">
                  <span className="info-label">Name:</span>
                  <span className="info-value">{appointmentData.clientName}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Email Address:</span>
                  <span className="info-value">{appointmentData.email}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Preferred Date:</span>
                  <span className="info-value">{appointmentData.date}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Preferred Time:</span>
                  <span className="info-value">{appointmentData.time}</span>
                </div>
                <div className="info-row issue-row">
                  <span className="info-label">Issue:</span>
                </div>
                <div className="issue-description">
                  {appointmentData.issue}
                </div>
              </div>
            </div>

            {/* Lawyer Actions */}
            <div className="lawyer-actions">
              <h3 className="actions-title">Lawyer Actions</h3>
              <div className="action-buttons">
                <button 
                  className="action-btn accept-btn"
                  onClick={handleAcceptAppointment}
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Processing...' : 'Accept Appointment'}
                </button>
                <button 
                  className="action-btn reschedule-btn"
                  onClick={handleReschedule}
                  disabled={isProcessing}
                >
                  Reschedule
                </button>
                <button 
                  className="action-btn decline-btn"
                  onClick={handleDeclineAppointment}
                  disabled={isProcessing}
                >
                  Decline Appointment
                </button>
              </div>
            </div>

            {/* Notes Section */}
            <div className="notes-section">
              <h3 className="notes-title">Notes for Lawyer ( internal only )</h3>
              <textarea
                className="notes-textarea"
                placeholder="Add your private notes here..."
                value={notes}
                onChange={handleNotesChange}
                rows={4}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentView;
