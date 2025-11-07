import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Sidebar from '../Sidebar/Sidebar';
import './Details.css';

export default function AppointmentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';

  const [recentChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [rsDate, setRsDate] = useState('');
  const [rsTime, setRsTime] = useState('');

  const loadAppointment = async () => {
    const token = localStorage.getItem('okil_token');
    if (!token) return navigate('/');
    try {
      const res = await fetch(`${API_BASE}/appointments`, { headers: { 'Authorization': `Bearer ${token}` } });
      const all = await res.json();
      const appt = (Array.isArray(all) ? all : []).find(a => String(a.id) === String(id));
      if (!appt) throw new Error('Appointment not found');
      setDetail({
        id: appt.id,
        client: { name: `Client #${appt.user_id}`, email: '' },
        date: appt.date,
        time: appt.time,
        description: appt.description,
        status: appt.status,
      });
    } catch (e) {
      setDetail(null);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('okil_token');
    const user = JSON.parse(localStorage.getItem('okil_user') || '{}');
    if (!token) return navigate('/');
    if (user.role !== 'lawyer') return navigate('/user-dashboard');

    (async () => {
      await loadAppointment();
      setLoading(false);
    })();
  }, [id, navigate]);

  const patchAppointment = async (payload) => {
    const token = localStorage.getItem('okil_token');
    if (!token) return navigate('/');
    const res = await fetch(`${API_BASE}/appointments/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      let msg = 'Failed to update appointment';
      try { const j = await res.json(); msg = j.detail || msg; } catch {}
      throw new Error(msg);
    }
    return res.json();
  };

  const handleAccept = async () => {
    try {
      await patchAppointment({ status: 'approved' });
      await loadAppointment();
      alert('Appointment accepted');
    } catch (e) { alert(e.message); }
  };
  const handleDecline = async () => {
    try {
      await patchAppointment({ status: 'rejected' });
      await loadAppointment();
      alert('Appointment declined');
    } catch (e) { alert(e.message); }
  };
  const handleReschedule = async (e) => {
    e.preventDefault();
    if (!rsDate || !rsTime) { alert('Pick date and time'); return; }
    try {
      await patchAppointment({ date: rsDate, time: rsTime });
      await loadAppointment();
      setRescheduleOpen(false);
      setRsDate(''); setRsTime('');
      alert('Appointment rescheduled');
    } catch (e) { alert(e.message); }
  };

  return (
    <div className="details-wrapper">
      <Sidebar role="lawyer" activeMenu="dashboard" recentChats={recentChats} />
      <main className="details-main">
        <div className="details-container">
          <div className="details-title">Appointment Details</div>
          <div className="details-shell">
          {loading && <div>Loading...</div>}
          {!loading && detail && (
            <>
              <div className="details-card">
                <div className="details-row"><b>Name:</b> {detail.client.name}</div>
                <div className="details-row"><b>Email Address:</b> {detail.client.email || '—'}</div>
                <div className="details-row"><b>Preferred Date:</b> {detail.date ? new Date(detail.date).toLocaleDateString() : '—'}</div>
                <div className="details-row"><b>Preferred Time:</b> {detail.time || '—'}</div>
                <div className="details-row"><b>Issue:</b></div>
                <div className="details-issue">{detail.description || '—'}</div>
              </div>

              {detail.status === 'cancelled' ? (
                <div className="details-banner" style={{
                  background:'#FEF3C7',
                  border:'1px solid #FCD34D',
                  color:'#92400E',
                  borderRadius:8,
                  padding:'10px 12px',
                  margin:'8px 0 16px 0'
                }}>
                  Appointment cancelled by user. Further actions are disabled.
                </div>
              ) : (
                <>
                  <div className="details-section-label">Lawyer Actions</div>
                  <div className="details-actions">
                    <button className="btn btn-accept" onClick={handleAccept}>Accept Appointment</button>
                    <button className="btn btn-reschedule" onClick={() => setRescheduleOpen(v=>!v)}>Reschedule</button>
                    <button className="btn btn-decline" onClick={handleDecline}>Decline Appointment</button>
                  </div>

                  {rescheduleOpen && (
                    <form onSubmit={handleReschedule} style={{ display:'flex', gap:8, alignItems:'end', marginBottom: 12 }}>
                      <div>
                        <label className="details-section-label">New Date</label>
                        <input type="date" value={rsDate} onChange={e=>setRsDate(e.target.value)} />
                      </div>
                      <div>
                        <label className="details-section-label">New Time</label>
                        <input type="time" value={rsTime} onChange={e=>setRsTime(e.target.value)} />
                      </div>
                      <div>
                        <button className="btn btn-reschedule" type="submit">Save</button>
                      </div>
                    </form>
                  )}
                </>
              )}

              <div className="details-notes">
                <div className="details-section-label">Notes for Lawyer ( internal only )</div>
                <textarea placeholder="Add your private notes here …" />
              </div>
            </>
          )}
          {!loading && !detail && (
            <div>Not found</div>
          )}
          </div>
        </div>
      </main>
    </div>
  );
}
