import React, { useEffect, useState, useMemo } from 'react';
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
  const [daySlots, setDaySlots] = useState([]); // availability slots for selected reschedule date

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
        lawyer_id: appt.lawyer_id,
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

  const redirectWithToast = (message, type='success') => {
    navigate('/lawyer-dashboard', { state: { toast: { message, type } } });
  };

  const handleAccept = async () => {
    try {
      await patchAppointment({ status: 'approved' });
      redirectWithToast('Appointment accepted', 'success');
    } catch (e) {
      redirectWithToast(e.message || 'Failed to accept appointment', 'error');
    }
  };
  const handleDecline = async () => {
    try {
      await patchAppointment({ status: 'rejected' });
      redirectWithToast('Appointment rejected', 'warning');
    } catch (e) {
      redirectWithToast(e.message || 'Failed to reject appointment', 'error');
    }
  };
  const handleReschedule = async (e) => {
    e.preventDefault();
    if (!rsDate || (!rsTime && daySlots.length === 0)) { alert('Pick date and time'); return; }
    try {
      let payload;
      if (daySlots.length > 0 && rsTime === '' && daySlots[0]) {
        // fallback: first slot
        payload = { date: rsDate, time: daySlots[0].start_at.slice(11,16) };
      } else {
        payload = { date: rsDate, time: rsTime };
      }
      await patchAppointment(payload);
      setRescheduleOpen(false);
      setRsDate(''); setRsTime('');
      redirectWithToast('Appointment rescheduled', 'success');
    } catch (e) {
      redirectWithToast(e.message || 'Failed to reschedule appointment', 'error');
    }
  };

  // Fetch availability slots for lawyer when reschedule date changes
  useEffect(() => {
    const fetchSlots = async () => {
      if (!rsDate || !detail) { setDaySlots([]); return; }
      try {
        const res = await fetch(`${API_BASE}/lawyers/${detail.lawyer_id}/availability`);
        const slots = await res.json().catch(()=>[]);
        const filtered = (Array.isArray(slots)?slots:[]).filter(s => {
          const d = new Date(s.start_at);
          const pad = n=>String(n).padStart(2,'0');
          const ds = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
          return ds === rsDate;
        });
        setDaySlots(filtered);
      } catch { setDaySlots([]); }
    };
    fetchSlots();
  }, [rsDate, detail, API_BASE]);

  const slotLabel = s => {
    const d = new Date(s.start_at);
    return d.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
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
                    <form onSubmit={handleReschedule} style={{ display:'flex', flexDirection:'column', gap:12, marginBottom: 12 }}>
                      <div style={{ display:'flex', gap:12 }}>
                        <div>
                          <label className="details-section-label">New Date</label>
                          <input type="date" value={rsDate} onChange={e=>{setRsDate(e.target.value); setRsTime('');}} />
                        </div>
                        <div>
                          <label className="details-section-label">Manual Time (optional)</label>
                          <input type="time" value={rsTime} onChange={e=>setRsTime(e.target.value)} />
                        </div>
                      </div>
                      <div>
                        <label className="details-section-label">Available Slots For Selected Date</label>
                        {rsDate && daySlots.length === 0 && (
                          <div style={{ fontSize:12, color:'#666' }}>No generated availability slots for this date.</div>
                        )}
                        {daySlots.length > 0 && (
                          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(80px,1fr))', gap:8 }}>
                            {daySlots.map(s => (
                              <button type="button" key={s.id} onClick={()=>{ const t = new Date(s.start_at); const hh = String(t.getHours()).padStart(2,'0'); const mm = String(t.getMinutes()).padStart(2,'0'); setRsTime(`${hh}:${mm}`); }}
                                className="slot-btn-mini"
                                style={{
                                  padding:'8px 6px',
                                  border:'1px solid '+(rsTime === (new Date(s.start_at).getHours().toString().padStart(2,'0')+":"+new Date(s.start_at).getMinutes().toString().padStart(2,'0')) ? '#0d9488' : '#d1d5db'),
                                  background: rsTime === (new Date(s.start_at).getHours().toString().padStart(2,'0')+":"+new Date(s.start_at).getMinutes().toString().padStart(2,'0')) ? '#0d9488' : '#fff',
                                  color: rsTime === (new Date(s.start_at).getHours().toString().padStart(2,'0')+":"+new Date(s.start_at).getMinutes().toString().padStart(2,'0')) ? '#fff' : '#111827',
                                  borderRadius:6,
                                  fontSize:12,
                                  cursor:'pointer'
                                }}
                              >
                                {slotLabel(s)}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <div>
                        <button className="btn btn-reschedule" type="submit" disabled={!rsDate || (!rsTime && daySlots.length===0)}>Save Reschedule</button>
                      </div>
                      {rsDate && rsTime && (
                        <div style={{fontSize:12, color:'#374151'}}>Selected new time: <strong>{rsDate} {rsTime}</strong></div>
                      )}
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
