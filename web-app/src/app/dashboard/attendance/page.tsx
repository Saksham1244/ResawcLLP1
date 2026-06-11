"use client";

import { useState, useEffect, useCallback } from "react";
import { useRole } from "@/context/RoleContext";
import { MapPin, Clock, CalendarDays, CheckCircle2, Search, FileText, Check, X, RefreshCw } from "lucide-react";

export default function AttendancePage() {
  const { user } = useRole();
  const [currentTime, setCurrentTime] = useState("");
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"personal" | "team" | "leaves">("personal");

  useEffect(() => {
    setCurrentTime(new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    const interval = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleToggle = async () => {
    const timeNow = new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' });
    if (!isCheckedIn) {
      setCheckInTime(timeNow);
      setIsCheckedIn(true);
    } else {
      setIsCheckedIn(false);
      // Hit API to record checkout time
      if (user && user.id && !user.id.startsWith('mock-')) {
        const todayStr = new Date().toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' }).split('/').reverse().join('-');
        await fetch('/api/attendance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, date: todayStr, timeIn: timeNow, source: 'checkout' })
        });
        fetchPersonalAttendance();
      }
    }
  };

  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [teamRecords, setTeamRecords] = useState<any[]>([]);
  const [loadingTeam, setLoadingTeam] = useState(false);

  const fetchTeamAttendance = useCallback(async () => {
    setLoadingTeam(true);
    try {
      const res = await fetch(`/api/attendance?start=${startDate}&end=${endDate}`);
      const data = await res.json();
      if (data.success) setTeamRecords(data.data);
    } catch {}
    setLoadingTeam(false);
  }, [startDate, endDate]);

  const [attendanceHistory, setAttendanceHistory] = useState<any[]>([]);
  const [loadingPersonal, setLoadingPersonal] = useState(false);

  const fetchPersonalAttendance = useCallback(async () => {
    if (!user || !user.id || user.id.startsWith('mock-')) return;
    setLoadingPersonal(true);
    try {
      // Fetch last 30 days of personal attendance
      const start = new Date();
      start.setDate(start.getDate() - 30);
      const startStr = start.toISOString().split('T')[0];
      const res = await fetch(`/api/attendance?start=${startStr}&end=${endDate}&email=${encodeURIComponent(user.email)}`);
      const data = await res.json();
      if (data.success) {
        const history = data.data.map((record: any) => ({
          date: record.date,
          checkIn: record.mobileLoginTime || record.systemLoginTime || record.timeIn,
          checkOut: record.timeOut || '--',
          hours: '8h',
          status: record.status
        }));
        setAttendanceHistory(history);

        // Auto-hydrate Check In panel state from database
        const todayStr = new Date().toISOString().split('T')[0];
        const todayRecord = history.find((r: any) => r.date === todayStr);
        if (todayRecord) {
          setIsCheckedIn(true);
          setCheckInTime(todayRecord.checkIn);
        }
      }
    } catch {}
    setLoadingPersonal(false);
  }, [user, endDate]);

  useEffect(() => {
    if (viewMode === 'team') fetchTeamAttendance();
    if (viewMode === 'personal') fetchPersonalAttendance();
  }, [viewMode, fetchTeamAttendance, fetchPersonalAttendance]);

  return (
    <div className="animate-fadeIn">
      <div className="flex-between" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            {viewMode === "team" ? "Team Attendance" : viewMode === "leaves" ? "Leave Management" : "Attendance"}
          </h1>
          <p className="text-muted text-sm">
            {viewMode === "team" ? "Monitor real-time team check-ins." : viewMode === "leaves" ? "Manage time off requests." : "Mark your daily attendance using the mobile app at our South Extension, New Delhi office."}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--overlay-bg)', padding: '0.25rem', borderRadius: 'var(--radius-md)' }}>
          <button onClick={() => setViewMode("personal")} style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', fontWeight: 600, borderRadius: 'var(--radius-sm)', background: viewMode === "personal" ? 'var(--primary-glow)' : 'transparent', color: viewMode === "personal" ? 'var(--primary)' : 'var(--muted)', transition: 'all 0.2s', border: 'none', cursor: 'pointer' }}>
            My Attendance
          </button>
          {user.role === "admin" && (
            <button onClick={() => setViewMode("team")} style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', fontWeight: 600, borderRadius: 'var(--radius-sm)', background: viewMode === "team" ? 'var(--primary-glow)' : 'transparent', color: viewMode === "team" ? 'var(--primary)' : 'var(--muted)', transition: 'all 0.2s', border: 'none', cursor: 'pointer' }}>
              Team View
            </button>
          )}
          <button onClick={() => setViewMode("leaves")} style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', fontWeight: 600, borderRadius: 'var(--radius-sm)', background: viewMode === "leaves" ? 'var(--primary-glow)' : 'transparent', color: viewMode === "leaves" ? 'var(--primary)' : 'var(--muted)', transition: 'all 0.2s', border: 'none', cursor: 'pointer' }}>
            {user.role === "admin" ? "Leave Approvals" : "My Leaves"}
          </button>
        </div>
      </div>

      {viewMode === "team" && (
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div style={{ position: 'relative', width: '220px' }}>
                <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
                <input type="text" placeholder="Search team member..." className="input" style={{ paddingLeft: '2.5rem', background: 'var(--overlay-bg)' }} />
              </div>
              <input type="date" className="input" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ background: 'var(--overlay-bg)', padding: '0.4rem 0.75rem', width: 'auto' }} />
              <span className="text-muted text-sm font-semibold">to</span>
              <input type="date" className="input" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ background: 'var(--overlay-bg)', padding: '0.4rem 0.75rem', width: 'auto' }} />
              <button onClick={fetchTeamAttendance} className="btn btn-secondary" style={{ padding: '0.4rem 0.75rem', gap: '0.4rem', fontSize: '0.8rem' }}>
                <RefreshCw size={14} /> Refresh
              </button>
            </div>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', fontWeight: 600 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }}/> Present</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', fontWeight: 600 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }}/> Absent</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', fontWeight: 600 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b' }}/> Late</div>
            </div>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--surface-border)', textAlign: 'left', color: 'var(--secondary-foreground)' }}>
                <th style={{ paddingBottom: '0.75rem', fontWeight: 600 }}>Date</th>
                <th style={{ paddingBottom: '0.75rem', fontWeight: 600 }}>Employee</th>
                <th style={{ paddingBottom: '0.75rem', fontWeight: 600 }}>Role</th>
                <th style={{ paddingBottom: '0.75rem', fontWeight: 600 }}>📱 Mobile Login</th>
                <th style={{ paddingBottom: '0.75rem', fontWeight: 600 }}>💻 System Login</th>
                <th style={{ paddingBottom: '0.75rem', fontWeight: 600 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {loadingTeam ? (
                <tr><td colSpan={6} style={{ padding: '2rem 0', textAlign: 'center', color: 'var(--muted)' }}>Loading...</td></tr>
              ) : teamRecords.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: '2rem 0', textAlign: 'center', color: 'var(--muted)' }}>No attendance records for this period.</td></tr>
              ) : teamRecords.map((record, idx) => {
                let bg = 'rgba(16,185,129,0.12)'; let color = '#10b981';
                if (record.status === "Absent") { bg = 'rgba(239,68,68,0.12)'; color = '#ef4444'; }
                if (record.status === "Late")   { bg = 'rgba(245,158,11,0.12)'; color = '#f59e0b'; }
                const mobile = record.mobileLoginTime || null;
                const system = record.systemLoginTime || null;
                return (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--surface-border)' }}>
                    <td style={{ padding: '0.875rem 0', fontWeight: 500, fontSize: '0.82rem' }}>{record.date}</td>
                    <td style={{ padding: '0.875rem 0', fontWeight: 700 }}>{record.user?.name || '—'}</td>
                    <td style={{ padding: '0.875rem 0', textTransform: 'capitalize', color: 'var(--secondary-foreground)' }}>{record.user?.role?.toLowerCase()}</td>
                    <td style={{ padding: '0.875rem 0' }}>
                      {mobile ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: 'rgba(99,102,241,0.12)', color: '#818cf8', borderRadius: '10px', padding: '0.25rem 0.65rem', fontSize: '0.78rem', fontWeight: 700 }}>
                          📱 {mobile}
                        </span>
                      ) : <span style={{ color: 'var(--muted)' }}>—</span>}
                    </td>
                    <td style={{ padding: '0.875rem 0' }}>
                      {system ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: 'rgba(16,185,129,0.12)', color: '#10b981', borderRadius: '10px', padding: '0.25rem 0.65rem', fontSize: '0.78rem', fontWeight: 700 }}>
                          💻 {system}
                        </span>
                      ) : <span style={{ color: 'var(--muted)' }}>—</span>}
                    </td>
                    <td style={{ padding: '0.875rem 0' }}>
                      <span style={{ padding: '0.3rem 0.6rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700, background: bg, color }}>{record.status}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}


      {viewMode === "personal" && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '2rem', alignItems: 'start' }}>
          {/* Left Column - History */}
          <div className="glass-card">
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CalendarDays size={18} /> My Attendance Log
            </h2>
            
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--surface-border)', textAlign: 'left', color: 'var(--secondary-foreground)' }}>
                  <th style={{ paddingBottom: '0.75rem', fontWeight: 600 }}>Date</th>
                  <th style={{ paddingBottom: '0.75rem', fontWeight: 600 }}>Check In</th>
                  <th style={{ paddingBottom: '0.75rem', fontWeight: 600 }}>Check Out</th>
                  <th style={{ paddingBottom: '0.75rem', fontWeight: 600 }}>Hours</th>
                  <th style={{ paddingBottom: '0.75rem', fontWeight: 600 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {attendanceHistory.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '2rem 0', textAlign: 'center', color: 'var(--muted)' }}>
                      No attendance log found.
                    </td>
                  </tr>
                ) : attendanceHistory.map((record, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--surface-border)' }}>
                    <td style={{ padding: '1rem 0', fontWeight: 500 }}>{record.date}</td>
                    <td style={{ padding: '1rem 0', color: record.checkIn !== '--' ? 'var(--foreground)' : 'var(--muted)' }}>{record.checkIn}</td>
                    <td style={{ padding: '1rem 0', color: record.checkOut !== '--' ? 'var(--foreground)' : 'var(--muted)' }}>{record.checkOut}</td>
                    <td style={{ padding: '1rem 0', fontWeight: 500 }}>{record.hours}</td>
                    <td style={{ padding: '1rem 0' }}>
                      <span style={{
                        padding: '0.35rem 0.6rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700,
                        background: record.status === "Present" ? 'rgba(16,185,129,0.12)' : record.status === "Late" ? 'rgba(245,158,11,0.12)' : 'rgba(239,68,68,0.12)',
                        color: record.status === "Present" ? '#10b981' : record.status === "Late" ? '#f59e0b' : '#ef4444'
                      }}>
                        {record.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Right Column - Action Card */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2.5rem 1.5rem', textAlign: 'center' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
              <Clock size={28} color="var(--primary-2)" />
            </div>
            
            <h3 style={{ fontSize: '2.2rem', fontWeight: 800, letterSpacing: '0.05em', fontFamily: 'monospace', marginBottom: '0.5rem', color: 'var(--foreground)' }}>
              {currentTime || "--:--:--"}
            </h3>
            <p className="text-muted text-sm" style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.3rem', justifyContent: 'center' }}>
              <MapPin size={14} /> South Extension Part 1, New Delhi
            </p>

            {isCheckedIn ? (
              <div style={{ width: '100%' }}>
                <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
                  <p style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', color: '#10b981', fontWeight: 700, fontSize: '0.9rem' }}>
                    <CheckCircle2 size={16} /> Checked In at {checkInTime}
                  </p>
                </div>
                <button onClick={handleToggle} style={{
                  width: '100%', padding: '1rem', borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer',
                  background: 'var(--destructive)', color: '#fff', fontWeight: 700, fontSize: '1rem',
                  boxShadow: '0 4px 14px rgba(239,68,68,0.3)', transition: 'all 0.2s',
                }}>
                  Check Out
                </button>
              </div>
            ) : (
              <button onClick={handleToggle} style={{
                width: '100%', padding: '1rem', borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer',
                background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))', color: '#fff', fontWeight: 700, fontSize: '1rem',
                boxShadow: '0 4px 14px var(--primary-glow)', transition: 'all 0.2s',
              }}>
                Mark Check In
              </button>
            )}

            <p className="text-xs text-muted" style={{ marginTop: '1.5rem', lineHeight: 1.5 }}>
              Attendance is recorded with your current system time and IP address for verification.
            </p>
          </div>
        </div>
      )}

      {viewMode === "leaves" && (
        <div className="glass-card animate-fadeIn">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText size={18} /> {user.role === "admin" ? "Pending Leave Requests" : "My Leave Requests"}
            </h2>
            {user.role !== "admin" && (
              <button className="btn btn-primary" style={{ fontSize: '0.8rem', padding: '0.4rem 1rem' }}>
                Apply for Leave
              </button>
            )}
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--surface-border)', textAlign: 'left', color: 'var(--secondary-foreground)' }}>
                {user.role === "admin" && <th style={{ paddingBottom: '0.75rem', fontWeight: 600 }}>Employee</th>}
                <th style={{ paddingBottom: '0.75rem', fontWeight: 600 }}>Date(s)</th>
                <th style={{ paddingBottom: '0.75rem', fontWeight: 600 }}>Type</th>
                <th style={{ paddingBottom: '0.75rem', fontWeight: 600 }}>Reason</th>
                <th style={{ paddingBottom: '0.75rem', fontWeight: 600 }}>Status</th>
                {user.role === "admin" && <th style={{ paddingBottom: '0.75rem', fontWeight: 600, textAlign: 'right' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={user.role === "admin" ? 6 : 4} style={{ padding: '2rem 0', textAlign: 'center', color: 'var(--muted)' }}>
                  No leave requests found.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
