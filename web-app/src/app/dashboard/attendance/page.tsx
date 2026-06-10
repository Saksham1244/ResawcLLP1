"use client";

import { useState, useEffect } from "react";
import { useRole } from "@/context/RoleContext";
import { MapPin, Clock, CalendarDays, CheckCircle2, Users, Search, FileText, Check, X } from "lucide-react";

export default function AttendancePage() {
  const { user } = useRole();
  const [currentTime, setCurrentTime] = useState("");
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"personal" | "team" | "leaves">("personal");

  useEffect(() => {
    setCurrentTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    const interval = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleToggle = () => {
    if (!isCheckedIn) {
      setCheckInTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
      setIsCheckedIn(true);
    } else {
      setIsCheckedIn(false);
    }
  };

  const attendanceHistory = [
    { date: "Oct 12, 2023", checkIn: "09:02 AM", checkOut: "06:15 PM", status: "Present", hours: "9h 13m" },
    { date: "Oct 11, 2023", checkIn: "08:55 AM", checkOut: "06:05 PM", status: "Present", hours: "9h 10m" },
    { date: "Oct 10, 2023", checkIn: "09:15 AM", checkOut: "06:30 PM", status: "Late", hours: "9h 15m" },
    { date: "Oct 09, 2023", checkIn: "--", checkOut: "--", status: "Absent", hours: "--" },
    { date: "Oct 08, 2023", checkIn: "08:50 AM", checkOut: "05:50 PM", status: "Present", hours: "9h 00m" },
  ];

  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const teamAttendance = [
    { date: new Date().toISOString().split('T')[0], name: user.name, role: user.role, checkIn: isCheckedIn ? (checkInTime || "09:00 AM") : "--", checkOut: "--", status: isCheckedIn ? "Present" : "Absent" },
    { date: new Date().toISOString().split('T')[0], name: "Sarah Williams", role: "marketing", checkIn: "08:55 AM", checkOut: "06:00 PM", status: "Present" },
    { date: new Date().toISOString().split('T')[0], name: "Mike Ross", role: "editor", checkIn: "09:15 AM", checkOut: "06:05 PM", status: "Late" },
    { date: new Date().toISOString().split('T')[0], name: "Jane Smith", role: "editor", checkIn: "--", checkOut: "--", status: "Absent" },
    { date: "2023-10-11", name: "Sarah Williams", role: "marketing", checkIn: "09:00 AM", checkOut: "01:30 PM", status: "Half Day" },
    { date: "2023-10-11", name: "David Miller", role: "editor", checkIn: "08:50 AM", checkOut: "04:15 PM", status: "Early Log Out" },
    { date: "2023-10-10", name: "Mike Ross", role: "editor", checkIn: "09:30 AM", checkOut: "06:00 PM", status: "Late" },
  ];

  const filteredTeam = teamAttendance.filter(r => {
    if (startDate && r.date < startDate) return false;
    if (endDate && r.date > endDate) return false;
    return true;
  });

  return (
    <div className="animate-fadeIn">
      <div className="flex-between" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            {viewMode === "team" ? "Team Attendance" : viewMode === "leaves" ? "Leave Management" : "Attendance"}
          </h1>
          <p className="text-muted text-sm">
            {viewMode === "team" ? "Monitor real-time team check-ins." : viewMode === "leaves" ? "Manage time off requests." : "Mark your daily attendance and view history."}
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
            </div>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', fontWeight: 600 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }}/> Present</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', fontWeight: 600 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }}/> Absent</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', fontWeight: 600 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b' }}/> Late</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', fontWeight: 600 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#3b82f6' }}/> Early Log Out</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', fontWeight: 600 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#8b5cf6' }}/> Half Day</div>
            </div>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--surface-border)', textAlign: 'left', color: 'var(--secondary-foreground)' }}>
                <th style={{ paddingBottom: '0.75rem', fontWeight: 600 }}>Date</th>
                <th style={{ paddingBottom: '0.75rem', fontWeight: 600 }}>Employee</th>
                <th style={{ paddingBottom: '0.75rem', fontWeight: 600 }}>Role</th>
                <th style={{ paddingBottom: '0.75rem', fontWeight: 600 }}>Check In</th>
                <th style={{ paddingBottom: '0.75rem', fontWeight: 600 }}>Check Out</th>
                <th style={{ paddingBottom: '0.75rem', fontWeight: 600 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredTeam.map((record, idx) => {
                let bg = 'rgba(16,185,129,0.12)';
                let color = '#10b981';
                if (record.status === "Absent") { bg = 'rgba(239,68,68,0.12)'; color = '#ef4444'; }
                if (record.status === "Late") { bg = 'rgba(245,158,11,0.12)'; color = '#f59e0b'; }
                if (record.status === "Early Log Out") { bg = 'rgba(59,130,246,0.12)'; color = '#3b82f6'; }
                if (record.status === "Half Day") { bg = 'rgba(139,92,246,0.12)'; color = '#8b5cf6'; }
                return (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--surface-border)' }}>
                    <td style={{ padding: '1rem 0', fontWeight: 500 }}>{record.date}</td>
                    <td style={{ padding: '1rem 0', fontWeight: 600, color: 'var(--foreground)' }}>{record.name}</td>
                    <td style={{ padding: '1rem 0', textTransform: 'capitalize' }}>{record.role}</td>
                    <td style={{ padding: '1rem 0', color: record.checkIn !== '--' ? 'var(--foreground)' : 'var(--muted)', fontWeight: 500 }}>{record.checkIn}</td>
                    <td style={{ padding: '1rem 0', color: record.checkOut !== '--' ? 'var(--foreground)' : 'var(--muted)' }}>{record.checkOut}</td>
                    <td style={{ padding: '1rem 0' }}>
                      <span style={{ padding: '0.35rem 0.6rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700, background: bg, color: color }}>
                        {record.status}
                      </span>
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
                {attendanceHistory.map((record, idx) => (
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
              <MapPin size={14} /> Head Office, Mumbai
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
              <tr style={{ borderBottom: '1px solid var(--surface-border)' }}>
                {user.role === "admin" && <td style={{ padding: '1rem 0', fontWeight: 600, color: 'var(--foreground)' }}>Jane Smith</td>}
                <td style={{ padding: '1rem 0', fontWeight: 500 }}>Oct 15, 2023</td>
                <td style={{ padding: '1rem 0' }}>Sick Leave</td>
                <td style={{ padding: '1rem 0', color: 'var(--muted)' }}>Fever and cold</td>
                <td style={{ padding: '1rem 0' }}>
                  <span style={{ padding: '0.3rem 0.6rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700, background: 'rgba(245,158,11,0.12)', color: '#f59e0b' }}>Pending</span>
                </td>
                {user.role === "admin" && (
                  <td style={{ padding: '1rem 0', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', background: 'rgba(16,185,129,0.15)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Check size={14}/></button>
                      <button style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', background: 'rgba(239,68,68,0.15)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={14}/></button>
                    </div>
                  </td>
                )}
              </tr>
              <tr style={{ borderBottom: '1px solid var(--surface-border)' }}>
                {user.role === "admin" && <td style={{ padding: '1rem 0', fontWeight: 600, color: 'var(--foreground)' }}>Mike Ross</td>}
                <td style={{ padding: '1rem 0', fontWeight: 500 }}>Oct 18 - Oct 20</td>
                <td style={{ padding: '1rem 0' }}>Casual Leave</td>
                <td style={{ padding: '1rem 0', color: 'var(--muted)' }}>Family function</td>
                <td style={{ padding: '1rem 0' }}>
                  <span style={{ padding: '0.3rem 0.6rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700, background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>Approved</span>
                </td>
                {user.role === "admin" && <td style={{ padding: '1rem 0', textAlign: 'right' }}>--</td>}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
