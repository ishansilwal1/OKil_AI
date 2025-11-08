import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Sidebar from '../User Dashboard/Sidebar';
import './Details.css';

export default function AppointmentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';

  const [recentChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('okil_token');
    const user = JSON.parse(localStorage.getItem('okil_user') || '{}');
    if (!token) return navigate('/');
    if (user.role !== 'lawyer') return navigate('/user-dashboard');

    (async () => {
      try {
        const res = await fetch(`${API_BASE}/appointments`, { headers: { 'Authorization': `Bearer ${token}` } });
        const all = await res.json();
        const appt = (Array.isArray(all) ? all : []).find(a => String(a.id) === String(id));
        if (!appt) throw new Error('Appointment not found');
        // fetch client minimal info if possible (optional)
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
      } finally {
        setLoading(false);
      }
    })();
  }, [id, navigate]);

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

              <div className="details-section-label">Lawyer Actions</div>
              <div className="details-actions">
                <button className="btn btn-accept" onClick={() => alert('Accept coming soon')}>Accept Appointment</button>
                <button className="btn btn-reschedule" onClick={() => alert('Reschedule coming soon')}>Reschedule</button>
                <button className="btn btn-decline" onClick={() => alert('Decline coming soon')}>Decline Appointment</button>
              </div>

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
