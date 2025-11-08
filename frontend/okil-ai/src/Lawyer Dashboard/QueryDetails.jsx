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

  useEffect(() => {
    const token = localStorage.getItem('okil_token');
    const user = JSON.parse(localStorage.getItem('okil_user') || '{}');
    if (!token) return navigate('/');
    if (user.role !== 'lawyer') return navigate('/user-dashboard');

    (async () => {
      try {
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
      } catch (e) {
        setDetail(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, navigate]);

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
                  <button className="btn btn-accept" onClick={() => alert('Accept coming soon')}>Accept Query</button>
                  <button className="btn btn-info" onClick={() => alert('Request more info coming soon')}>Request more info</button>
                  <button className="btn btn-decline" onClick={() => alert('Decline coming soon')}>Decline Query</button>
                </div>

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
