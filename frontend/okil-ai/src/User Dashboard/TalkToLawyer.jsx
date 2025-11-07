import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../Sidebar/Sidebar';
import './TalkToLawyer.css';

const TalkToLawyer = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [recentChats, setRecentChats] = useState([]);
  const [currentView, setCurrentView] = useState('list'); // 'list', 'appointment', 'query'
  const [recordsView, setRecordsView] = useState(null); // null | 'appointments' | 'queries'
  const [selectedLawyer, setSelectedLawyer] = useState(null);
  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';
  const [availability, setAvailability] = useState([]); // list of slots
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlotId, setSelectedSlotId] = useState(null);
  const [myAppointments, setMyAppointments] = useState([]);
  const [apptLoading, setApptLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    preferredDate: '',
    preferredTime: '',
    query: '',
    queryDetail: '',
    issue: ''
  });
  const [lawyers, setLawyers] = useState([]);
  const [myQueries, setMyQueries] = useState([]);
  const [qLoading, setQLoading] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('okil_token');
    const user = JSON.parse(localStorage.getItem('okil_user') || '{}');

    if (!token) {
      // App uses Auth at '/'; keep it consistent
      navigate('/');
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

    // Fetch lawyers list from backend
    (async function fetchLawyers() {
      try {
        const res = await fetch(`${API_BASE}/lawyers`);
        if (!res.ok) throw new Error('Failed to load lawyers');
        const data = await res.json();
        setLawyers(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error(e);
        setLawyers([]);
      } finally {
        setLoading(false);
      }
    })();

    // Fetch my appointments
    fetchMyAppointments();
    // Fetch my queries
    fetchMyQueries();
  }, [navigate]);

  const handleTalkToLawyerClick = (lawyer) => {
    setSelectedLawyer(lawyer);
    setCurrentView('appointment');
    fetchAvailability(lawyer.id);
  };

  const toLocalDate = (iso) => {
    const d = new Date(iso);
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  };

  const fetchAvailability = async (lawyerId) => {
    try {
      const res = await fetch(`${API_BASE}/lawyers/${lawyerId}/availability`, {
        headers: { 'Cache-Control': 'no-store' }
      });
      const data = await res.json();
      const slots = Array.isArray(data) ? data : [];
      setAvailability(slots);
      if (slots.length > 0) {
        const firstDate = toLocalDate(slots[0].start_at);
        setSelectedDate(firstDate);
        setSelectedSlotId(slots[0].id);
      } else {
        setSelectedDate('');
        setSelectedSlotId(null);
      }
    } catch (e) {
      setAvailability([]);
      setSelectedDate('');
      setSelectedSlotId(null);
    }
  };

  const handleLeaveQuery = (lawyer) => {
    setSelectedLawyer(lawyer);
    setCurrentView('query');
  };

  const fetchMyAppointments = async () => {
    const token = localStorage.getItem('okil_token');
    if (!token) return;
    setApptLoading(true);
    try {
      const res = await fetch(`${API_BASE}/appointments`, { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      setMyAppointments(Array.isArray(data) ? data : []);
    } catch (e) {
      setMyAppointments([]);
    } finally {
      setApptLoading(false);
    }
  };

  const fetchMyQueries = async () => {
    const token = localStorage.getItem('okil_token');
    if (!token) return;
    setQLoading(true);
    try {
      const res = await fetch(`${API_BASE}/queries`, { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      setMyQueries(Array.isArray(data) ? data : []);
    } catch (e) {
      setMyQueries([]);
    } finally {
      setQLoading(false);
    }
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
    if (!selectedLawyer) return;

    const token = localStorage.getItem('okil_token');
    const { issue } = formData;

    (async () => {
      try {
        const res = await fetch(`${API_BASE}/appointments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            lawyer_id: selectedLawyer.id,
            slot_id: selectedSlotId || undefined,
            message: issue || undefined,
          })
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.detail || 'Failed to create appointment');
        }
        await res.json();
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
        setSelectedSlotId(null);
      } catch (error) {
        alert(error.message || 'Failed to book appointment');
      }
    })();
  };

  const handleSubmitQuery = (e) => {
    e.preventDefault();
    const token = localStorage.getItem('okil_token');
    const { query, queryDetail } = formData;

    (async () => {
      try {
        const res = await fetch(`${API_BASE}/queries`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            title: query,
            content: queryDetail,
            lawyer_id: selectedLawyer?.id || undefined,
          })
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.detail || 'Failed to submit query');
        }
        await res.json();
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
      } catch (error) {
        console.error('Submit query error:', error);
        alert(error.message || 'Failed to submit query');
      }
    })();
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
            <div className="lawyer-page-header" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
              <h1 className="lawyer-page-title" style={{ margin:0 }}>Talk To Lawyer</h1>
              <div className="record-toggle">
                <button className={`record-btn ${recordsView==='appointments' ? 'active' : ''}`} onClick={()=> setRecordsView('appointments')}>My Appointments</button>
                <button className={`record-btn ${recordsView==='queries' ? 'active' : ''}`} onClick={()=> setRecordsView('queries')}>My Queries</button>
                {recordsView && (
                  <button className="record-btn secondary" onClick={()=> setRecordsView(null)}>Close</button>
                )}
              </div>
            </div>

            {/* Removed default My Appointments summary to only show when toggled */}

            {/* Records Panels */}
            {recordsView === 'appointments' && (
              <div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                  <h2 style={{ fontSize:18, margin:0 }}>My Appointments</h2>
                  <button className="refresh-btn" onClick={fetchMyAppointments}>Refresh</button>
                </div>
                {apptLoading && <div style={{ fontSize:13, color:'#666' }}>Loading appointments...</div>}
                {!apptLoading && myAppointments.length === 0 && (
                  <div style={{ fontSize:13, color:'#666' }}>You have no appointments yet.</div>
                )}
                {!apptLoading && myAppointments.length > 0 && (
                  <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                    {myAppointments.map(a => {
                      const dateStr = a.date ? new Date(a.date).toLocaleDateString() : '—';
                      const timeStr = a.time || '';
                      return (
                        <div key={a.id} className="user-appt-row">
                          <div className="user-appt-main">
                            <span className="user-appt-title">Lawyer #{a.lawyer_id}</span>
                            <span className="user-appt-meta">{dateStr} {timeStr}</span>
                          </div>
                          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                            <span className={`user-appt-status status-${a.status}`}>{a.status}</span>
                            <button className="back-btn" onClick={()=> navigate(`/user/appointments/${a.id}`)}>View</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {recordsView === 'queries' && (
              <div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                  <h2 style={{ fontSize:18, margin:0 }}>My Queries</h2>
                  <button className="refresh-btn" onClick={fetchMyQueries}>Refresh</button>
                </div>
                {qLoading && <div style={{ fontSize:13, color:'#666' }}>Loading queries...</div>}
                {!qLoading && myQueries.length === 0 && (
                  <div style={{ fontSize:13, color:'#666' }}>You have no queries yet.</div>
                )}
                {!qLoading && myQueries.length > 0 && (
                  <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                    {myQueries.map(q => (
                      <div key={q.id} className="user-query-row">
                        <div className="user-query-main">
                          <span className="user-query-title">{q.subject || `Query #${q.id}`}</span>
                          <span className="user-query-meta">to Lawyer #{q.lawyer_id || '—'}</span>
                        </div>
                        <span className={`user-query-status q-${q.status}`}>{q.status}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Lawyers Grid (only when not viewing records) */}
            {recordsView === null && (
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
                      <span className="lawyer-value">{lawyer.barCouncilNumber || '—'}</span>
                    </div>
                    <div className="lawyer-field">
                      <span className="lawyer-label">Expertise:</span>
                      <span className="lawyer-value">{lawyer.expertise || '—'}</span>
                    </div>
                    <div className="lawyer-field">
                      <span className="lawyer-label">Mail address:</span>
                      <span className="lawyer-value">{lawyer.email || lawyer.mailAddress || ''}</span>
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
            )}

            {/* Removed default My Queries summary to only show when toggled */}
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
                    <span className="required">*</span> Select Date
                  </label>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <select
                    className="form-input"
                    value={selectedDate}
                    onChange={(e) => {
                      const d = e.target.value;
                      setSelectedDate(d);
                      const daySlots = availability.filter(s => toLocalDate(s.start_at) === d);
                      setSelectedSlotId(daySlots[0]?.id || null);
                    }}
                    required
                  >
                    <option value="" disabled>Select a date</option>
                    {[...new Set(availability.map(s => {
                        const d = new Date(s.start_at);
                        const pad = (n) => String(n).padStart(2, '0');
                        return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
                      }))]
                      .map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                  </select>
                  <button type="button" className="submit-btn" onClick={() => selectedLawyer && fetchAvailability(selectedLawyer.id)}>Refresh</button>
                  </div>
                  {availability.length === 0 && (
                    <small style={{ color: '#888' }}>No available dates from this lawyer right now.</small>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <span className="required">*</span> Select Time
                  </label>
                  <select
                    className="form-input"
                    value={selectedSlotId || ''}
                    onChange={(e) => setSelectedSlotId(parseInt(e.target.value, 10))}
                    required
                  >
                    <option value="" disabled>Select a time</option>
                    {availability
                      .filter(s => {
                        const d = new Date(s.start_at);
                        const pad = (n) => String(n).padStart(2, '0');
                        const ds = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
                        return ds === selectedDate;
                      })
                      .map(s => {
                        const t = new Date(s.start_at);
                        const label = t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        return <option key={s.id} value={s.id}>{label}</option>
                      })}
                  </select>
                  {selectedDate && availability.filter(s => {
                      const d = new Date(s.start_at);
                      const pad = (n) => String(n).padStart(2, '0');
                      const ds = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
                      return ds === selectedDate;
                    }).length === 0 && (
                    <small style={{ color: '#888' }}>No times for the selected date.</small>
                  )}
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
                  <button type="submit" className="submit-btn" disabled={!selectedSlotId}>Book Appointment</button>
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
