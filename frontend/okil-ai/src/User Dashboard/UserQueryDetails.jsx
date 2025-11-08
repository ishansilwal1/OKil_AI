import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Sidebar from '../Sidebar/Sidebar';
import '../Lawyer Dashboard/Details.css';

export default function UserQueryDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';

  const [recentChats, setRecentChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('okil_token');
    const user = JSON.parse(localStorage.getItem('okil_user') || '{}');
    if (!token) return navigate('/');
    if ((user.role || 'user') !== 'user') return navigate('/lawyer-dashboard');

    const savedChats = localStorage.getItem('okil_recent_chats');
    if (savedChats) setRecentChats(JSON.parse(savedChats));

    (async () => {
      try {
        const res = await fetch(`${API_BASE}/queries`, { headers: { 'Authorization': `Bearer ${token}` } });
        const all = await res.json();
        const q = (Array.isArray(all) ? all : []).find(x => String(x.id) === String(id));
        if (!q) throw new Error('Query not found');
        setDetail({
          id: q.id,
          lawyer: q.lawyer_id ? `Lawyer #${q.lawyer_id}` : 'Unassigned',
            subject: q.subject,
            description: q.description,
            status: q.status,
            created_at: q.created_at
        });
      } catch (e) {
        setDetail(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, navigate, API_BASE]);

  return (
    <div className="details-wrapper">
      <Sidebar role="user" activeMenu="talktolawyer" recentChats={recentChats} />
      <main className="details-main">
        <div className="details-container">
          <div className="details-title">Query Details</div>
          <div className="details-shell">
            {loading && <div>Loading...</div>}
            {!loading && detail && (
              <>
                <div className="details-card">
                  <div className="details-row"><b>Subject:</b> {detail.subject || '—'}</div>
                  <div className="details-row"><b>Status:</b> {detail.status}</div>
                  <div className="details-row"><b>Assigned Lawyer:</b> {detail.lawyer}</div>
                  <div className="details-row"><b>Submitted:</b> {detail.created_at ? new Date(detail.created_at).toLocaleString() : '—'}</div>
                  <div className="details-row"><b>Details:</b></div>
                  <div className="details-issue">{detail.description || '—'}</div>
                </div>
                <div style={{ display:'flex', gap:10, marginTop:16 }}>
                  <button className="back-btn" onClick={() => navigate(-1)}>Back</button>
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
