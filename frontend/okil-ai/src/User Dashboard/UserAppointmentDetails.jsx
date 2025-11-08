import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Sidebar from '../Sidebar/Sidebar';
import '../Lawyer Dashboard/Details.css';

export default function UserAppointmentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';

  const [recentChats, setRecentChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);
  const [busy, setBusy] = useState(false);
  const [toasts, setToasts] = useState([]);
  const addToast = (message, type = 'success', duration = 3500) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  };
  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

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
        const d = {
          id: appt.id,
          lawyer: { name: `Lawyer #${appt.lawyer_id}` },
          date: appt.date,
          time: appt.time,
          description: appt.description,
          status: appt.status,
        };
        setDetail(d);
        if (d.status === 'rescheduled') {
          addToast('Appointment rescheduled', 'success');
        }
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
    // This function now performs the actual cancellation; confirmation handled by modal.
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
      addToast('Appointment cancelled', 'warning');
    } catch (e) {
      addToast(e.message || 'Failed to cancel', 'error');
    } finally {
      setBusy(false);
    }
  };

  // Modal state for confirmation
  const [showCancelModal, setShowCancelModal] = useState(false);
  const openCancelModal = () => setShowCancelModal(true);
  const closeCancelModal = () => setShowCancelModal(false);
  const confirmCancel = async () => {
    await handleCancel();
    closeCancelModal();
  };

  return (
    <div className="details-wrapper">
      <Sidebar role="user" activeMenu="talktolawyer" recentChats={recentChats} />
      <main className="details-main">
        <div className="details-container">
          <div className="details-title">Appointment Details</div>
          <div className="details-shell">
            {toasts.length > 0 && (
              <div className="toast-container" aria-live="polite" aria-atomic="true">
                {toasts.map(t => (
                  <div key={t.id} className={`toast ${t.type}`} role="status">
                    <span className="toast-msg">{t.message}</span>
                    <button type="button" className="toast-close" onClick={() => removeToast(t.id)} aria-label="Close">×</button>
                  </div>
                ))}
              </div>
            )}
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
                    <button className="submit-btn" disabled={busy} onClick={openCancelModal}>
                      {busy ? 'Cancelling...' : 'Cancel Appointment'}
                    </button>
                  )}
                </div>
              </>
            )}
            {!loading && !detail && (<div>Not found</div>)}
            {showCancelModal && (
              <div className="modal-overlay" role="dialog" aria-modal="true">
                <div className="modal-content">
                  <div className="modal-header">Cancel Appointment</div>
                  <div className="modal-body">Are you sure you want to cancel this appointment?</div>
                  <div className="modal-actions">
                    <button className="modal-btn confirm" onClick={confirmCancel} disabled={busy}>{busy ? 'Cancelling...' : 'Yes, Cancel'}</button>
                    <button className="modal-btn" onClick={closeCancelModal}>Keep</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
