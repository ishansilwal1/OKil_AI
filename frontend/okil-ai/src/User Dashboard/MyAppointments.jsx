import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import './MyAppointments.css';

const MyAppointments = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [recentChats, setRecentChats] = useState([]);
  const [role, setRole] = useState('user');
  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';

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
    fetchAppointments();
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

  const fetchAppointments = async () => {
    const token = localStorage.getItem('okil_token');
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE}/appointments`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAppointments(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Failed to fetch appointments:', error);
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
    const token = localStorage.getItem('okil_token');
    if (!token) return;

    const sessionId = chatId.replace('db-', '');
    
    try {
      await fetch(`${API_BASE}/api/v1/chat/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      setRecentChats(prev => prev.filter(chat => chat.id !== chatId));
    } catch (error) {
      console.error('Failed to delete chat:', error);
    }
  };

  const isAppointmentExpired = (date) => {
    if (!date) return false;
    const appointmentDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return appointmentDate < today;
  };

  const getAppointmentStatus = (appointment) => {
    if (isAppointmentExpired(appointment.date)) {
      return 'expired';
    }
    return appointment.status?.toLowerCase() || 'pending';
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return '#10b981';
      case 'pending':
        return '#f59e0b';
      case 'rejected':
        return '#ef4444';
      case 'expired':
        return '#6b7280';
      default:
        return '#6b7280';
    }
  };

  if (loading) {
    return <div className="appointments-loading">Loading...</div>;
  }

  return (
    <div className="appointments-wrapper">
      <Sidebar 
        role={role}
        activeMenu="appointments"
        recentChats={recentChats}
        onNewChat={handleNewChat}
        onLoadChat={handleLoadChat}
        onDeleteChat={handleDeleteChat}
      />

      <div className="appointments-main-content">
        <div className="appointments-header">
          <h1 className="appointments-title">My Appointments</h1>
          <p className="appointments-subtitle">View and manage your lawyer consultations</p>
        </div>

        <div className="appointments-list">
          {appointments.length === 0 ? (
            <div className="no-appointments">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              <h3>No Appointments Yet</h3>
              <p>Book your first appointment with a lawyer</p>
              <button onClick={() => navigate('/talk-to-lawyer')} className="book-appointment-btn">
                Book Appointment
              </button>
            </div>
          ) : (
            appointments.map(appointment => {
              const displayStatus = getAppointmentStatus(appointment);
              return (
                <div key={appointment.id} className={`appointment-card ${displayStatus === 'expired' ? 'expired' : ''}`}>
                  <div className="appointment-card-header">
                    <h3>{appointment.description || 'Legal Consultation'}</h3>
                    <span 
                      className="appointment-status"
                      style={{ backgroundColor: getStatusColor(displayStatus) }}
                    >
                      {displayStatus.charAt(0).toUpperCase() + displayStatus.slice(1)}
                    </span>
                  </div>

                <div className="appointment-details">
                  <div className="appointment-detail-item">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                      <line x1="16" y1="2" x2="16" y2="6"/>
                      <line x1="8" y1="2" x2="8" y2="6"/>
                      <line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                    <span>{appointment.date || 'Date not set'}</span>
                  </div>

                  <div className="appointment-detail-item">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <circle cx="12" cy="12" r="10"/>
                      <polyline points="12 6 12 12 16 14"/>
                    </svg>
                    <span>{appointment.time || 'Time not set'}</span>
                  </div>

                  <div className="appointment-detail-item">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                    <span>Lawyer: {appointment.lawyer_name || 'TBD'}</span>
                  </div>
                </div>

                <div className="appointment-actions">
                  {displayStatus === 'approved' && (
                    <button className="action-btn primary">
                      View Details
                    </button>
                  )}
                  {displayStatus === 'pending' && (
                    <button className="action-btn secondary" disabled>
                      Waiting for Approval
                    </button>
                  )}
                  {displayStatus === 'expired' && (
                    <button className="action-btn secondary" disabled>
                      Expired
                    </button>
                  )}
                </div>
              </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default MyAppointments;
