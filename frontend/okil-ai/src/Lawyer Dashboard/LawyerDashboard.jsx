import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./LawyerDashboard.css";
import Sidebar from "../User Dashboard/Sidebar";

const LawyerDashboard = () => {
  const navigate = useNavigate();
  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';

  const [recentChats] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [availabilityForm, setAvailabilityForm] = useState({ start_at: '', end_at: '' });
	const [mySlots, setMySlots] = useState([]);
  const [me, setMe] = useState({ id: null, role: null, name: '' });

  // Load initial data
  useEffect(() => {
    const token = localStorage.getItem('okil_token');
    const user = JSON.parse(localStorage.getItem('okil_user') || '{}');

    if (!token) {
      navigate('/');
      return;
    }
    if (user.role !== 'lawyer') {
      navigate('/user-dashboard');
      return;
    }
    setMe({ id: user.id, role: user.role, name: user.name || '' });

    (async () => {
      try {
        const headers = { 'Authorization': `Bearer ${token}` };
        const [apptRes, qRes] = await Promise.all([
          fetch(`${API_BASE}/appointments`, { headers }),
          fetch(`${API_BASE}/queries`, { headers })
        ]);
        const appts = await apptRes.json().catch(() => []);
        const qs = await qRes.json().catch(() => []);
        setAppointments(Array.isArray(appts) ? appts : []);
        setQueries(Array.isArray(qs) ? qs : []);
				// Load my available slots (unbooked upcoming) so lawyer can confirm the update visually
				try {
					const slotsRes = await fetch(`${API_BASE}/lawyers/${user.id}/availability`);
					const slots = await slotsRes.json().catch(() => []);
					setMySlots(Array.isArray(slots) ? slots : []);
				} catch (_) {
					setMySlots([]);
				}
      } catch (e) {
        setAppointments([]);
        setQueries([]);
				setMySlots([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  const today = new Date();
  const todayStr = today.toISOString().slice(0,10);

  // Stats
  const totalAppointments = appointments.length;
  const totalQueries = queries.length;
  const todaysApptCount = useMemo(() => (
    appointments.filter(a => a.date && new Date(a.date).toISOString().slice(0,10) === todayStr).length
  ), [appointments, todayStr]);
  const todaysQueryCount = useMemo(() => (
    queries.filter(q => q.created_at && new Date(q.created_at).toISOString().slice(0,10) === todayStr).length
  ), [queries, todayStr]);
  const todayTotal = todaysApptCount + todaysQueryCount;

	// Tiny calendar generator (no external deps)
	const getCalendarMatrix = (year, month /* 0-indexed */) => {
		const firstDay = new Date(year, month, 1).getDay();
		const daysInMonth = new Date(year, month + 1, 0).getDate();
		const cells = [];
		for (let i = 0; i < firstDay; i++) cells.push(null);
		for (let d = 1; d <= daysInMonth; d++) cells.push(d);
		while (cells.length % 7 !== 0) cells.push(null);
		const weeks = [];
		for (let i = 0; i < cells.length; i += 7) {
			weeks.push(cells.slice(i, i + 7));
		}
		return weeks;
	};
	const calendarWeeks = getCalendarMatrix(today.getFullYear(), today.getMonth());

  const handleAvailabilityChange = (e) => {
    const { name, value } = e.target;
    setAvailabilityForm(prev => ({ ...prev, [name]: value }));
  };

	const handleAddAvailability = (e) => {
    e.preventDefault();
    const token = localStorage.getItem('okil_token');
    if (!token) return navigate('/');
    const { start_at, end_at } = availabilityForm;
    if (!start_at || !end_at) return;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/lawyers/availability`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            start_at: new Date(start_at).toISOString(),
            end_at: new Date(end_at).toISOString(),
          })
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.detail || 'Failed to add availability');
        }
        await res.json();
        alert('Availability added');
        setAvailabilityForm({ start_at: '', end_at: '' });
				// refresh my slots list
				try {
					const slotsRes = await fetch(`${API_BASE}/lawyers/${me.id}/availability`);
					const slots = await slotsRes.json().catch(() => []);
					setMySlots(Array.isArray(slots) ? slots : []);
				} catch (_) {}
      } catch (err) {
        alert(err.message || 'Failed to add availability');
      }
    })();
  };

	return (
		<div className="lawyer-dashboard-wrapper">
			<div className="ld-layout">
				{/* Shared Sidebar used for both roles */}
				<Sidebar role="lawyer" activeMenu="dashboard" recentChats={recentChats} />

				{/* Main */}
				<main className="ld-main">
					{loading ? (
						<div style={{ padding: 24 }}>Loading...</div>
					) : (
					<>
					{/* Top row: greeting + stats | calendar */}
					<section className="ld-top">
						<div className="ld-greeting">
							<p className="ld-sub">Good Morning <b>{me.name ? `Adv. ${me.name}` : 'Mr. Advocate'}</b></p>
							<p className="ld-sub2">Appointments and Queries for Today:</p>
							<div className="ld-today-count">{todayTotal}</div>

							<div className="ld-stats">
								<div className="ld-stat-card">
									<span className="ld-stat-label">Total Appointments</span>
									<div className="ld-stat-value">{totalAppointments}</div>
								</div>
								<div className="ld-stat-card">
									<span className="ld-stat-label">Total Queries</span>
									<div className="ld-stat-value">{totalQueries}</div>
								</div>
							</div>
						</div>

						<div className="ld-calendar">
							<div className="ld-calendar-header">
								<div>
									<div className="ld-calendar-title">Calendar</div>
									<div className="ld-calendar-month">
										{today.toLocaleString("default", { month: "long" })}{" "}
										{today.getFullYear()}
									</div>
								</div>
								<div className="ld-calendar-nav" aria-hidden>
									<button className="ld-icon-btn" title="Previous month">‹</button>
									<button className="ld-icon-btn" title="Next month">›</button>
								</div>
							</div>

							<div className="ld-calendar-grid">
								{["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map(
									(d) => (
										<div key={d} className="ld-cal-dayname">
											{d}
										</div>
									)
								)}
								{calendarWeeks.flat().map((d, idx) => (
									<div
										key={idx}
										className={`ld-cal-cell ${
											d === today.getDate() ? "today" : ""
										}`}
									>
										{d || ""}
									</div>
								))}
							</div>

							<div className="ld-upcoming">
								<div className="ld-upcoming-title">Upcoming</div>
								<form onSubmit={handleAddAvailability} className="ld-availability-form">
									<label className="ld-availability-label">Start</label>
									<input
										type="datetime-local"
										name="start_at"
										value={availabilityForm.start_at}
										onChange={handleAvailabilityChange}
										className="ld-availability-input"
										required
									/>
									<label className="ld-availability-label">End</label>
									<input
										type="datetime-local"
										name="end_at"
										value={availabilityForm.end_at}
										onChange={handleAvailabilityChange}
										className="ld-availability-input"
										required
									/>
									<button className="ld-btn" type="submit" style={{ marginTop: 8 }}>Save</button>
								</form>

								<div className="ld-upcoming-title" style={{ marginTop: 16 }}>Upcoming</div>
								<div className="ld-upcoming-item">
									<div className="ld-avatar">A</div>
									<div className="ld-upcoming-info">
										<div className="ld-upcoming-name">Today's items</div>
										<div className="ld-upcoming-meta">{todaysApptCount} appointments · {todaysQueryCount} queries</div>
									</div>
								</div>
															{/* Show my next available slots so the lawyer sees the update */}
															{mySlots && mySlots.length > 0 && (
																<div style={{ marginTop: 12 }}>
																	<div className="ld-upcoming-title">Your available slots</div>
																	<ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
																		{mySlots.slice(0,5).map(s => {
																			const start = new Date(s.start_at);
																			const end = new Date(s.end_at);
																			const label = `${start.toLocaleDateString()} ${start.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} - ${end.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}`;
																			return <li key={s.id} style={{ padding: '6px 0', color: '#333' }}>{label}</li>;
																		})}
																	</ul>
																</div>
															)}
							</div>
						</div>
					</section>

					{/* Lists */}
					<section className="ld-lists">
						<div className="ld-card">
							<div className="ld-card-head">Appointments Booked</div>
							<div className="ld-list">
								{appointments.slice(0,3).map((a) => {
									const dateStr = a.date ? new Date(a.date).toLocaleDateString() : '—';
									const timeStr = a.time ? a.time : '';
									return (
										<div key={a.id} className="ld-list-row">
											<span>Client #{a.user_id} · {dateStr} {timeStr}</span>
											<button className="ld-btn" onClick={() => navigate(`/lawyer/appointments/${a.id}`)}>View</button>
										</div>
									);
								})}
							</div>
						</div>
						<div className="ld-card">
							<div className="ld-card-head">Queries Received</div>
							<div className="ld-list">
								{queries.slice(0,3).map((q) => (
									<div key={q.id} className="ld-list-row">
										<span>{q.subject || `Query #${q.id}`}</span>
										<button className="ld-btn" onClick={() => navigate(`/lawyer/queries/${q.id}`)}>View Query</button>
									</div>
								))}
							</div>
						</div>
					</section>
					</>
					)}
				</main>
			</div>
		</div>
	);
};

export default LawyerDashboard;

