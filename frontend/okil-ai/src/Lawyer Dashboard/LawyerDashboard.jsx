import React, { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./LawyerDashboard.css";
import Sidebar from "../Sidebar/Sidebar";

const LawyerDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8000";

  const [recentChats] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [availabilityForm, setAvailabilityForm] = useState({
    start_at: "",
    end_at: "",
  });
  const [mySlots, setMySlots] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [slotForm, setSlotForm] = useState({ startTime: "", endTime: "" });
  const [me, setMe] = useState({ id: null, role: null, name: "" });

  // Toasts
  const [toasts, setToasts] = useState([]);
  const addToast = (message, type = "success", duration = 3500) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  };
  const removeToast = (id) => setToasts((prev) => prev.filter((t) => t.id !== id));

  // Load initial data
  useEffect(() => {
    const token = localStorage.getItem("okil_token");
    const user = JSON.parse(localStorage.getItem("okil_user") || "{}");

    if (!token) {
      navigate("/");
      return;
    }
    if (user.role !== "lawyer") {
      navigate("/user-dashboard");
      return;
    }
    setMe({ id: user.id, role: user.role, name: user.name || "" });

    (async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [apptRes, qRes] = await Promise.all([
          fetch(`${API_BASE}/appointments`, { headers }),
          fetch(`${API_BASE}/queries`, { headers }),
        ]);
        const appts = await apptRes.json().catch(() => []);
        const qs = await qRes.json().catch(() => []);
        setAppointments(Array.isArray(appts) ? appts : []);
        setQueries(Array.isArray(qs) ? qs : []);
        // Load my available slots (unbooked upcoming) so lawyer can confirm the update visually
        try {
          const slotsRes = await fetch(
            `${API_BASE}/lawyers/${user.id}/availability`
          );
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

  // Show toast when redirected with state from other pages (e.g., AppointmentDetails)
  const toastHandledRef = useRef(false);
  useEffect(() => {
    const toast = location.state && location.state.toast;
    if (toast && !toastHandledRef.current) {
      toastHandledRef.current = true; // guard against double-fire (React 18 StrictMode)
      addToast(toast.message, toast.type || "success");
      navigate(location.pathname, { replace: true, state: {} });
      // Reset ref after a tick so future navigations can show new toasts
      setTimeout(() => { toastHandledRef.current = false; }, 100);
    }
  }, [location, navigate]);

  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const todayStr = today.toISOString().slice(0, 10);

  // Stats
  const totalAppointments = appointments.length;
  const totalQueries = queries.length;
  const todaysApptCount = useMemo(
    () =>
      appointments.filter(
        (a) =>
          a.date && new Date(a.date).toISOString().slice(0, 10) === todayStr
      ).length,
    [appointments, todayStr]
  );
  const todaysQueryCount = useMemo(
    () =>
      queries.filter(
        (q) =>
          q.created_at &&
          new Date(q.created_at).toISOString().slice(0, 10) === todayStr
      ).length,
    [queries, todayStr]
  );
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
  const calendarWeeks = getCalendarMatrix(viewYear, viewMonth);

  const handlePrevMonth = () => {
    setSelectedDay(null);
    setSlotForm({ startTime: "", endTime: "" });
    setViewMonth((m) => {
      if (m === 0) {
        setViewYear((y) => y - 1);
        return 11;
      }
      return m - 1;
    });
  };
  const handleNextMonth = () => {
    setSelectedDay(null);
    setSlotForm({ startTime: "", endTime: "" });
    setViewMonth((m) => {
      if (m === 11) {
        setViewYear((y) => y + 1);
        return 0;
      }
      return m + 1;
    });
  };

  const handleAvailabilityChange = (e) => {
    const { name, value } = e.target;
    setAvailabilityForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddAvailability = (e) => {
    e.preventDefault();
    const token = localStorage.getItem("okil_token");
    if (!token) return navigate("/");
    const { start_at, end_at } = availabilityForm;
    if (!start_at || !end_at) return;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/lawyers/availability`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            start_at: new Date(start_at).toISOString(),
            end_at: new Date(end_at).toISOString(),
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.detail || "Failed to add availability");
        }
        await res.json();
        addToast("Availability added successfully", "success");
        setAvailabilityForm({ start_at: "", end_at: "" });
        // refresh my slots list
        try {
          const slotsRes = await fetch(
            `${API_BASE}/lawyers/${me.id}/availability`
          );
          const slots = await slotsRes.json().catch(() => []);
          setMySlots(Array.isArray(slots) ? slots : []);
        } catch (_) {}
      } catch (err) {
        addToast(err.message || "Failed to add availability", "error");
      }
    })();
  };

  const handleCreateDaySlot = (e) => {
    e.preventDefault();
    const token = localStorage.getItem("okil_token");
    if (!token || selectedDay == null) return;
    
    // Check if selected date is in the past
    const selectedDate = new Date(viewYear, viewMonth, selectedDay);
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    if (selectedDate < todayStart) {
      addToast("Cannot create availability for a past date", "error");
      return;
    }
    
    const [sh, sm] = (slotForm.startTime || "")
      .split(":")
      .map((n) => parseInt(n || "0", 10));
    const [eh, em] = (slotForm.endTime || "")
      .split(":")
      .map((n) => parseInt(n || "0", 10));
    if (isNaN(sh) || isNaN(eh)) {
      addToast("Please set start and end time", "error");
      return;
    }
    const start = new Date(viewYear, viewMonth, selectedDay, sh, sm || 0, 0);
    const end = new Date(viewYear, viewMonth, selectedDay, eh, em || 0, 0);
    
    // Check if the time slot is in the past (for today's date)
    const now = new Date();
    if (start < now) {
      addToast("Cannot create availability for a past time", "error");
      return;
    }
    
    if (end <= start) {
      addToast("End time must be after start time", "error");
      return;
    }
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/lawyers/availability`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            start_at: start.toISOString(),
            end_at: end.toISOString(),
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.detail || "Failed to add availability");
        }
        await res.json();
        try {
          const slotsRes = await fetch(
            `${API_BASE}/lawyers/${me.id}/availability`
          );
          const slots = await slotsRes.json().catch(() => []);
          setMySlots(Array.isArray(slots) ? slots : []);
        } catch (_) {}
        setSlotForm({ startTime: "", endTime: "" });
        addToast("Availability added successfully", "success");
      } catch (err) {
        addToast(err.message || "Failed to add availability", "error");
      }
    })();
  };

  return (
    <div className="lawyer-dashboard-wrapper">
      <div className="ld-layout">
        {/* Shared Sidebar used for both roles */}
        <Sidebar
          role="lawyer"
          activeMenu="dashboard"
          recentChats={recentChats}
        />

        {/* Main */}
        <main className="ld-main">
          {loading ? (
            <div style={{ padding: 24 }}>Loading...</div>
          ) : (
            <>
              {toasts.length > 0 && (
                <div className="toast-container" aria-live="polite" aria-atomic="true">
                  {toasts.map((t) => (
                    <div key={t.id} className={`toast ${t.type}`} role="status">
                      <span className="toast-msg">{t.message}</span>
                      <button type="button" className="toast-close" onClick={() => removeToast(t.id)} aria-label="Close">×</button>
                    </div>
                  ))}
                </div>
              )}
              {/* Top row: greeting + stats | calendar */}
              <section className="ld-top">
                <div className="ld-greeting">
                  <p className="ld-sub">
                    Good Morning{" "}
                    <b>{me.name ? `Adv. ${me.name}` : "Mr. Advocate"}</b>
                  </p>
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

                  {/* Upcoming summary moved from calendar side */}
                  <div style={{marginTop:20}}>
                    <div className="ld-upcoming-title">Upcoming (Today)</div>
                    <div className="ld-upcoming-item">
                      <div className="ld-avatar">A</div>
                      <div className="ld-upcoming-info">
                        <div className="ld-upcoming-name">Today's items</div>
                        <div className="ld-upcoming-meta">{todaysApptCount} appointments · {todaysQueryCount} queries</div>
                      </div>
                    </div>
                  </div>

                  {/* Available slots preview moved here */}
                  {mySlots && mySlots.length > 0 && (
                    <div style={{marginTop:24}}>
                      <div className="ld-upcoming-title" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                        <span>Your available slots</span>
                        <small style={{color:'#6b7280'}}>Next {Math.min(mySlots.length, 8)} shown</small>
                      </div>
                      <div className="ld-slot-table-wrapper">
                        <table className="ld-slot-table">
                          <thead>
                            <tr>
                              <th>Date</th>
                              <th>Start</th>
                              <th>End</th>
                              <th>Duration</th>
                            </tr>
                          </thead>
                          <tbody>
                            {mySlots.slice(0,8).map(s => {
                              const start = new Date(s.start_at);
                              const end = new Date(s.end_at);
                              const dateLabel = start.toLocaleDateString();
                              const startLabel = start.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
                              const endLabel = end.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
                              const durationMin = Math.round((end.getTime() - start.getTime())/60000);
                              return (
                                <tr key={s.id}>
                                  <td>{dateLabel}</td>
                                  <td>{startLabel}</td>
                                  <td>{endLabel}</td>
                                  <td>{durationMin} min</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>

                <div className="ld-calendar">
                  <div className="ld-calendar-header">
                    <div>
                      <div className="ld-calendar-title">Calendar</div>
                      <div className="ld-calendar-month">
                        {new Date(viewYear, viewMonth, 1).toLocaleString(
                          "default",
                          { month: "long" }
                        )}{" "}
                        {viewYear}
                      </div>
                    </div>
                    <div className="ld-calendar-nav" aria-hidden>
                      <button
                        className="ld-icon-btn"
                        title="Previous month"
                        onClick={handlePrevMonth}
                      >
                        ‹
                      </button>
                      <button
                        className="ld-icon-btn"
                        title="Next month"
                        onClick={handleNextMonth}
                      >
                        ›
                      </button>
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
                    {calendarWeeks.flat().map((d, idx) => {
                      const isToday =
                        d &&
                        viewYear === today.getFullYear() &&
                        viewMonth === today.getMonth() &&
                        d === today.getDate();
                      const isSelected = d && d === selectedDay;
                      
                      // Check if date is in the past
                      const isPast = d && (
                        viewYear < today.getFullYear() ||
                        (viewYear === today.getFullYear() && viewMonth < today.getMonth()) ||
                        (viewYear === today.getFullYear() && viewMonth === today.getMonth() && d < today.getDate())
                      );
                      
                      const dayStr = d
                        ? `${viewYear}-${String(viewMonth + 1).padStart(
                            2,
                            "0"
                          )}-${String(d).padStart(2, "0")}`
                        : "";
                      return (
                        <div
                          key={idx}
                          className={`ld-cal-cell ${isToday ? "today" : ""} ${
                            isSelected ? "selected" : ""
                          } ${isPast ? "past" : ""}`}
                          onClick={() => {
                            if (d && !isPast) {
                              setSelectedDay(d);
                            } else if (isPast) {
                              addToast("Cannot select a past date", "warning");
                            }
                          }}
                        >
                          {d || ""}
                        </div>
                      );
                    })}
                  </div>

                  <div className="ld-upcoming">
                    <div className="ld-availability-card">
                      <div className="ld-availability-header">
                        <span className="ld-availability-icon">📅</span>
                        <span className="ld-availability-title">Add Availability Slot</span>
                      </div>
                      
                      {selectedDay ? (
                        <>
                          <form onSubmit={handleCreateDaySlot} className="ld-availability-form">
                            <div className="ld-time-input-group">
                              <label className="ld-availability-label">
                                <span className="ld-label-icon">🕐</span>
                                Start Time
                              </label>
                              <input
                                type="time"
                                className="ld-availability-input"
                                value={slotForm.startTime}
                                onChange={(e) =>
                                  setSlotForm((prev) => ({
                                    ...prev,
                                    startTime: e.target.value,
                                  }))
                                }
                                required
                              />
                            </div>
                            
                            <div className="ld-time-input-group">
                              <label className="ld-availability-label">
                                <span className="ld-label-icon">🕐</span>
                                End Time
                              </label>
                              <input
                                type="time"
                                className="ld-availability-input"
                                value={slotForm.endTime}
                                onChange={(e) =>
                                  setSlotForm((prev) => ({
                                    ...prev,
                                    endTime: e.target.value,
                                  }))
                                }
                                required
                              />
                            </div>
                            
                            {slotForm.startTime && slotForm.endTime && (() => {
                              const [sh, sm] = slotForm.startTime.split(':').map(Number);
                              const [eh, em] = slotForm.endTime.split(':').map(Number);
                              const startMin = sh * 60 + sm;
                              const endMin = eh * 60 + em;
                              const durationMin = endMin - startMin;
                              if (durationMin > 0) {
                                const hours = Math.floor(durationMin / 60);
                                const mins = durationMin % 60;
                                let durationText = '';
                                if (hours > 0) durationText += `${hours} hour${hours > 1 ? 's' : ''}`;
                                if (mins > 0) durationText += `${hours > 0 ? ' ' : ''}${mins} min${mins > 1 ? 's' : ''}`;
                                return (
                                  <div className="ld-duration-display">
                                    Duration: <strong>{durationText}</strong>
                                  </div>
                                );
                              }
                              return null;
                            })()}
                            
                            <div className="ld-form-actions">
                              <button
                                type="button"
                                className="ld-btn-cancel"
                                onClick={() => {
                                  setSelectedDay(null);
                                  setSlotForm({ startTime: '', endTime: '' });
                                }}
                              >
                                Cancel
                              </button>
                              <button
                                type="submit"
                                className="ld-btn-primary"
                              >
                                <span>Add Slot</span>
                                <span className="ld-btn-icon">✓</span>
                              </button>
                            </div>
                          </form>
                        </>
                      ) : (
                        <div className="ld-no-date-selected">
                          <span className="ld-info-icon">ℹ️</span>
                          <p>Please select a date from the calendar above to add availability slots</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </section>

              {/* Lists */}
              <section className="ld-lists">
                <div className="ld-card">
                  <div className="ld-card-head">Appointments Booked</div>
                  <div className="ld-list">
                    {appointments.slice(0, 50).map((a) => {
                      const dateStr = a.date
                        ? new Date(a.date).toLocaleDateString()
                        : "—";
                      const timeStr = a.time ? a.time : "";
                      const statusLabelMap = {
                        approved: 'Accepted',
                        rescheduled: 'Rescheduled',
                        rejected: 'Rejected',
                        pending: 'Pending',
                        cancelled: 'Cancelled',
                        completed: 'Completed',
                      };
                      const statusLabel = statusLabelMap[a.status] || a.status;
                      return (
                        <div key={a.id} className="ld-list-row">
                          <span>
                            Client #{a.user_id} · {dateStr} {timeStr}
                          </span>
                          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                            <span className={`ld-status status-${a.status}`}>{statusLabel}</span>
                            <button
                              className="ld-btn"
                              onClick={() =>
                                navigate(`/lawyer/appointments/${a.id}`)
                              }
                            >
                              View
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="ld-card">
                  <div className="ld-card-head">Queries Received</div>
                  <div className="ld-list">
                    {queries.slice(0, 3).map((q) => (
                      <div key={q.id} className="ld-list-row">
                        <span>{q.subject || `Query #${q.id}`}</span>
                        <button
                          className="ld-btn"
                          onClick={() => navigate(`/lawyer/queries/${q.id}`)}
                        >
                          View Query
                        </button>
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
