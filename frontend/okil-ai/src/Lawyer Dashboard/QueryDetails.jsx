import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Sidebar from '../User Dashboard/Sidebar';
import './Details.css';

export default function QueryDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';

  const [recentChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);
  const [requestInfoOpen, setRequestInfoOpen] = useState(false);
  const [infoNote, setInfoNote] = useState('');

  const loadQuery = async () => {
    const token = localStorage.getItem('okil_token');
    if (!token) return navigate('/');
    const res = await fetch(`${API_BASE}/queries`, { headers: { 'Authorization': `Bearer ${token}` } });
    const all = await res.json();
    const q = (Array.isArray(all) ? all : []).find(x => String(x.id) === String(id));
    if (!q) throw new Error('Query not found');
    setDetail({
      id: q.id,
      client: { name: `Client #${q.user_id}`, email: '' },
      subject: q.subject,
      description: q.description,
      status: q.status,
    });
  };

  useEffect(() => {
    const token = localStorage.getItem('okil_token');
    const user = JSON.parse(localStorage.getItem('okil_user') || '{}');
    if (!token) return navigate('/');
    if (user.role !== 'lawyer') return navigate('/user-dashboard');

    (async () => {
      try { await loadQuery(); }
      catch { setDetail(null); }
      finally { setLoading(false); }
    })();
  }, [id, navigate]);

  const patchQuery = async (payload) => {
    const token = localStorage.getItem('okil_token');
    if (!token) return navigate('/');
    const res = await fetch(`${API_BASE}/queries/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      let msg = 'Failed to update query';
      try { const j = await res.json(); msg = j.detail || msg; } catch {}
      throw new Error(msg);
    }
    return res.json();
  };

  const handleAccept = async () => {
    try {
      await patchQuery({ status: 'accepted' });
      await loadQuery();
      alert('Query accepted');
    } catch (e) { alert(e.message); }
  };

  const handleRequestInfo = async (e) => {
    e.preventDefault();
    try {
      // Optionally could include description update: description: infoNote
      await patchQuery({ status: 'info_requested' });
      await loadQuery();
      setRequestInfoOpen(false);
      setInfoNote('');
      alert('Requested more info from user');
    } catch (e) { alert(e.message); }
  };

  const handleDecline = async () => {
    try {
      await patchQuery({ status: 'rejected' });
      await loadQuery();
      alert('Query declined');
    } catch (e) { alert(e.message); }
  };

  return (
    <div className="details-wrapper">
      <Sidebar role="lawyer" activeMenu="dashboard" recentChats={[]} />
      <main className="details-main">
        <div className="details-container">
          <div className="details-title">Query Details</div>
          <div className="details-shell">
            {loading && <div>Loading...</div>}
            {!loading && detail && (
              <>
                <div className="details-card">
                  <div className="details-row"><b>Name:</b> {detail.client.name}</div>
                  <div className="details-row"><b>Email Address:</b> {detail.client.email || '—'}</div>
                  <div className="details-row"><b>Query:</b> {detail.subject || '—'}</div>
                  <div className="details-row"><b>Query Details:</b></div>
                  <div className="details-issue">{detail.description || '—'}</div>
                </div>

                <div className="details-section-label">Lawyer Actions</div>
                <div className="details-actions">
                  <button className="btn btn-accept" onClick={handleAccept}>Accept Query</button>
                  <button className="btn btn-info" onClick={() => setRequestInfoOpen(v=>!v)}>Request more info</button>
                  <button className="btn btn-decline" onClick={handleDecline}>Decline Query</button>
                </div>

                {requestInfoOpen && (
                  <form onSubmit={handleRequestInfo} style={{ display:'flex', gap:8, alignItems:'end', marginBottom: 12 }}>
                    <div style={{ flex:1 }}>
                      <label className="details-section-label">Optional message</label>
                      <input type="text" value={infoNote} onChange={e=>setInfoNote(e.target.value)} placeholder="Provide a short note to the user" />
                    </div>
                    <div>
                      <button className="btn btn-info" type="submit">Send</button>
                    </div>
                  </form>
                )}

                <div className="details-notes">
                  <div className="details-section-label">Notes for Lawyer ( internal only )</div>
                  <textarea placeholder="Add your private notes here …" />
                </div>
              </>
            )}
          </div>
          {!loading && !detail && (
            <div>Not found</div>
          )}
        </div>
      </main>
    </div>
  );
}
