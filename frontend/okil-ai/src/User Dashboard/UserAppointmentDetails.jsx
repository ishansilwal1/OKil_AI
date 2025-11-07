import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Sidebar from './Sidebar';
import '../Lawyer Dashboard/Details.css';

export default function UserAppointmentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';

  const [recentChats, setRecentChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('okil_token');
    const user = JSON.parse(localStorage.getItem('okil_user') || '{}');
    if (!token) return navigate('/');
    if ((user.role || 'user') !== 'user') return navigate('/lawyer-dashboard');

    // Load recent chats if present
    const savedChats = localStorage.getItem('okil_recent_chats');
    if (savedChats) setRecentChats(JSON.parse(savedChats));

    (async () => {
      try {
        const res = await fetch(`${API_BASE}/appointments`, { headers: { 'Authorization': `Bearer ${token}` } });
        const all = await res.json();
        const appt = (Array.isArray(all) ? all : []).find(a => String(a.id) === String(id));
        if (!appt) throw new Error('Appointment not found');
        setDetail({
          id: appt.id,
          lawyer: { name: `Lawyer #${appt.lawyer_id}` },
          date: appt.date,
          time: appt.time,
          description: appt.description,
          status: appt.status,
        });
      } catch (e) {
        setDetail(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, navigate, API_BASE]);

  const canCancel = (d) => {
    if (!d) return false;
    if (!d.date || !d.time) return false;
    try {
      const dt = new Date(`${d.date}T${d.time}`);
      return ['pending','approved'].includes(d.status) && dt.getTime() > Date.now();
    } catch {
      return ['pending','approved'].includes(d.status);
    }
  };

  const handleCancel = async () => {
    if (!detail) return;
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
    const token = localStorage.getItem('okil_token');
    setBusy(true);
    try {
      const res = await fetch(`${API_BASE}/appointments/${detail.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'cancelled' })
      });
      if (!res.ok) {
        const err = await res.json().catch(()=>({}));
        throw new Error(err.detail || 'Failed to cancel');
      }
      const updated = await res.json();
      setDetail(prev => ({ ...prev, status: updated.status }));
      alert('Appointment cancelled. The time will be made available if it has not passed.');
    } catch (e) {
      alert(e.message || 'Failed to cancel');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="details-wrapper">
      <Sidebar role="user" activeMenu="talktolawyer" recentChats={recentChats} />
      <main className="details-main">
        <div className="details-container">
          <div className="details-title">Appointment Details</div>
          <div className="details-shell">
            {loading && <div>Loading...</div>}
            {!loading && detail && (
              <>
                <div className="details-card">
                  <div className="details-row"><b>Lawyer:</b> {detail.lawyer.name}</div>
                  <div className="details-row"><b>Status:</b> {detail.status || '—'}</div>
                  <div className="details-row"><b>Date:</b> {detail.date ? new Date(detail.date).toLocaleDateString() : '—'}</div>
                  <div className="details-row"><b>Time:</b> {detail.time || '—'}</div>
                  <div className="details-row"><b>Your Issue:</b></div>
                  <div className="details-issue">{detail.description || '—'}</div>
                </div>
                <div style={{ display:'flex', gap:10, marginTop:16 }}>
                  <button className="back-btn" onClick={() => navigate(-1)}>Back</button>
                  {canCancel(detail) && (
                    <button className="submit-btn" disabled={busy} onClick={handleCancel}>
                      {busy ? 'Cancelling...' : 'Cancel Appointment'}
                    </button>
                  )}
                </div>
              </>
            )}
            {!loading && !detail && (<div>Not found</div>)}
          </div>
        </div>
      </main>
    </div>
  );
}
