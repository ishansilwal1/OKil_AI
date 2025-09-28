import React, { useState } from 'react';
import './LawyerDashboard.css';
import AppointmentView from './AppointmentView';

const LawyerDashboard = ({ user, onLogout }) => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  // Sample data for appointments and queries
  const appointmentsData = [
    { 
      id: 1, 
      clientName: 'Client one', 
      date: '2025-09-27', 
      time: '10:00 AM',
      email: 'clientone@gmail.com',
      issue: 'Property dispute regarding boundary lines with neighboring property. Need legal consultation on land rights and potential resolution options.'
    },
    { 
      id: 2, 
      clientName: 'Client two', 
      date: '2025-09-27', 
      time: '11:30 AM',
      email: 'clienttwo@gmail.com',
      issue: 'Employment contract review and negotiation assistance. Concerns about non-compete clauses and termination conditions.'
    },
    { 
      id: 3, 
      clientName: 'Client three', 
      date: '2025-09-27', 
      time: '02:00 PM',
      email: 'clientthree@gmail.com',
      issue: 'Divorce proceedings consultation. Need guidance on asset division and child custody arrangements.'
    }
  ];

  const queriesData = [
    { id: 1, clientName: 'Client one', query: 'Property dispute query', date: '2025-09-27' },
    { id: 2, clientName: 'Client two', query: 'Employment law question', date: '2025-09-26' },
    { id: 3, clientName: 'Client three', query: 'Contract review needed', date: '2025-09-26' }
  ];

  // Get current date and time
  const getCurrentTime = () => {
    const now = new Date();
    const hours = now.getHours();
    if (hours < 12) return 'Good Morning';
    if (hours < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Calendar data - September 2025
  const currentMonth = 'September';
  const currentYear = 2025;
  
  // Generate calendar days for September 2025
  const generateCalendarDays = () => {
    const firstDay = new Date(2025, 8, 1); // September 1, 2025
    const daysInMonth = 30;
    const startingDayOfWeek = firstDay.getDay(); // Sunday = 0
    
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    return days;
  };

  const handleViewAppointment = (appointment) => {
    // Navigate to appointment view with appointment data
    setSelectedAppointment({
      ...appointment,
      // Format the data to match the Figma design
      clientName: appointment.clientName,
      email: appointment.email,
      date: appointment.date.replace('-', ' ').replace('-', ' '), // Format: 2025 Sept 27
      time: `${appointment.time} - ${appointment.time.replace(/(\d+):(\d+)/, (match, hour, minute) => {
        const endHour = parseInt(hour) < 12 ? parseInt(hour) + 1 : parseInt(hour) + 1;
        return `${endHour}:${minute}`;
      })}`, // Format: 10:00 AM - 11:00 AM
      issue: appointment.issue
    });
    setCurrentView('appointmentView');
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
    setSelectedAppointment(null);
  };

  const handleViewQuery = (query) => {
    // Enhanced functionality for viewing queries
    const queryDetails = `
Query Details:
Client: ${query.clientName}
Query: ${query.query}
Date: ${query.date}
Status: Pending Review
    `.trim();
    
    alert(queryDetails);
    
    // You can extend this functionality to:
    // - Open a modal with query details
    // - Navigate to a detailed query page
    // - Update query status
    console.log('Viewing query:', query);
  };

  const handleNewChat = () => {
    // Navigate to new chat functionality
    setCurrentView('newchat');
    alert('Starting new chat...');
  };

  const handleLibraryAccess = () => {
    // Navigate to library functionality
    setCurrentView('library');
    alert('Accessing library...');
  };

  const handleSettings = () => {
    // Navigate to settings functionality
    setCurrentView('settings');
    alert('Opening Settings...');
    // You can extend this to:
    // - Open settings modal
    // - Navigate to settings page
    // - Show user preferences
  };

  const handleSignOut = () => {
    // Handle sign out functionality
    const confirmSignOut = window.confirm('Are you sure you want to sign out?');
    if (confirmSignOut) {
      // Clear user session, redirect to login
      if (onLogout) {
        onLogout();
      } else {
        alert('Signing out...');
        // You can extend this to:
        // - Clear localStorage/sessionStorage
        // - Redirect to login page
        // - Clear user state
      }
    }
  };

  // Conditional rendering based on current view
  if (currentView === 'appointmentView' && selectedAppointment) {
    return (
      <AppointmentView 
        appointment={selectedAppointment}
        onBack={handleBackToDashboard}
        user={user}
      />
    );
  }

  return (
    <div 
      className="lawyer-dashboard"
      style={{
        backgroundImage: `url(${process.env.PUBLIC_URL}/Background.png)`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Sidebar */}
      <div className="sidebar">
        <div className="logo-section">
          <img src="/logo.png" alt="OKIL AI" className="logo" />
          <span className="logo-text">OKIL AI</span>
        </div>
        
        <nav className="nav-menu">
          <div 
            className={`nav-item ${currentView === 'dashboard' ? 'active' : ''}`}
            onClick={() => setCurrentView('dashboard')}
          >
            <span className="nav-icon-text">📊</span>
            <span>Dashboard</span>
          </div>
          <div 
            className="nav-item"
            onClick={handleNewChat}
          >
            <img src="/new chat.png" alt="New Chat" className="nav-icon" />
            <span>New chat</span>
          </div>
          <div 
            className="nav-item"
            onClick={handleLibraryAccess}
          >
            <img src="/Library.png" alt="Library" className="nav-icon" />
            <span>Library</span>
          </div>
          
          <div className="recent-chats">
            <h4>RECENT CHATS</h4>
          </div>
        </nav>

        {/* Bottom Section - Settings and Sign Out */}
        <div className="sidebar-bottom">
          <div 
            className="nav-item settings-item"
            onClick={handleSettings}
          >
            <span className="nav-icon-text">⚙️</span>
            <span>Settings</span>
          </div>
          <div 
            className="nav-item signout-item"
            onClick={handleSignOut}
          >
            <span className="nav-icon-text">🚪</span>
            <span>Sign Out</span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="main-content">
        <div className="content-wrapper">
          {/* Left Content */}
          <div className="left-content">
            {/* Main Info Frame - Combined Greeting and Stats */}
            <div className="main-info-frame">
              <div className="greeting-section">
                <h1 className="greeting">{getCurrentTime()} <span className="advocate-name">Mr. Advocate!</span></h1>
                <p className="appointments-text">Appointments and Queries for Today:</p>
                <div className="today-count">4</div>
              </div>

              {/* Stats Cards */}
              <div className="stats-container">
                <div className="stat-card appointments-card">
                  <div className="stat-label">Total Appointments</div>
                  <div className="stat-number">40</div>
                </div>
                <div className="stat-card queries-card">
                  <div className="stat-label">Total Queries</div>
                  <div className="stat-number">64</div>
                </div>
              </div>
            </div>

            {/* Bottom Sections */}
            <div className="bottom-sections">
              <div className="appointments-section">
                <h3 className="section-title">Appointments Booked</h3>
                <div className="appointments-list">
                  {appointmentsData.map(appointment => (
                    <div key={appointment.id} className="appointment-item">
                      <span className="client-name">{appointment.clientName}</span>
                      <button 
                        className="view-btn"
                        onClick={() => handleViewAppointment(appointment)}
                      >
                        View
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="queries-section">
                <h3 className="section-title">Queries Received</h3>
                <div className="queries-list">
                  {queriesData.map(query => (
                    <div key={query.id} className="query-item">
                      <span className="client-name">{query.clientName}</span>
                      <button 
                        className="view-query-btn"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('Button clicked for query:', query);
                          handleViewQuery(query);
                        }}
                        type="button"
                        style={{ cursor: 'pointer', zIndex: 10 }}
                      >
                        View Query
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Content - Calendar */}
          <div className="right-content">
            <div className="calendar-section">
              <div className="calendar-header">
                <h3>Calendar</h3>
                <span className="calendar-month">{currentMonth} {currentYear}</span>
              </div>
              <div className="calendar-widget">
                <div className="weekdays">
                  <div className="weekday">Sun</div>
                  <div className="weekday">Mon</div>
                  <div className="weekday">Tue</div>
                  <div className="weekday">Wed</div>
                  <div className="weekday">Thu</div>
                  <div className="weekday">Fri</div>
                  <div className="weekday">Sat</div>
                </div>
                <div className="calendar-grid">
                  {generateCalendarDays().map((day, index) => (
                    <div 
                      key={index} 
                      className={`calendar-day ${day === 28 ? 'today' : ''} ${day === null ? 'empty' : ''}`}
                    >
                      {day}
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="upcoming-section">
                <div className="upcoming-header">
                  <h4>Upcoming</h4>
                  <span className="view-all">View All</span>
                </div>
                <div className="upcoming-item">
                  <div className="upcoming-number">11</div>
                  <div className="upcoming-details">
                    <div className="upcoming-title">Monthly lawyer's meet</div>
                    <div className="upcoming-time">at Sept. 2025 / 11:30 PM</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LawyerDashboard;