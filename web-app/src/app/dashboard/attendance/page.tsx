"use client";

import { useState, useEffect, useCallback } from "react";
import { useRole } from "@/context/RoleContext";
import {
  MapPin, Clock, CalendarDays, CheckCircle2, Search,
  FileText, X, RefreshCw, ChevronDown,
} from "lucide-react";

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg: "#F5F7FB",
  card: "#FFFFFF",
  border: "#E5E7EB",
  primary: "#1A56DB",
  text: "#111827",
  muted: "#6B7280",
  radius: "8px",
  radiusSm: "6px",
  radiusPill: "999px",
};

const card: React.CSSProperties = {
  background: C.card,
  border: `1px solid ${C.border}`,
  borderRadius: C.radius,
  padding: "1.5rem",
};

const th: React.CSSProperties = {
  padding: "0.75rem 1rem",
  textAlign: "left",
  fontSize: "0.75rem",
  fontWeight: 600,
  color: C.muted,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  borderBottom: `1px solid ${C.border}`,
  background: "#F9FAFB",
};

const td: React.CSSProperties = {
  padding: "0.875rem 1rem",
  fontSize: "0.875rem",
  color: C.text,
  borderBottom: `1px solid ${C.border}`,
};

function statusBadge(status: string): React.CSSProperties {
  const map: Record<string, { bg: string; color: string }> = {
    Present:     { bg: "#ECFDF5", color: "#059669" },
    Absent:      { bg: "#FEF2F2", color: "#DC2626" },
    Late:        { bg: "#FFFBEB", color: "#D97706" },
    "Half Day":  { bg: "#FFF7ED", color: "#EA580C" },
    "Short Day": { bg: "#FFF7ED", color: "#EA580C" },
    "In Progress": { bg: "#EFF6FF", color: "#2563EB" },
  };
  const c = map[status] || { bg: "#F3F4F6", color: C.muted };
  return {
    display: "inline-block",
    padding: "0.25rem 0.65rem",
    borderRadius: C.radiusPill,
    fontSize: "0.75rem",
    fontWeight: 600,
    background: c.bg,
    color: c.color,
  };
}

function TabBtn({
  label, active, onClick,
}: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "0.45rem 1rem",
        fontSize: "0.85rem",
        fontWeight: 600,
        borderRadius: C.radiusSm,
        border: "none",
        cursor: "pointer",
        background: active ? C.primary : "transparent",
        color: active ? "#fff" : C.muted,
        transition: "all 0.15s",
      }}
    >
      {label}
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AttendancePage() {
  const { user } = useRole();

  const [currentTime, setCurrentTime] = useState("");
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState<string | null>(null);
  const [attendanceBusy, setAttendanceBusy] = useState(false);
  const [viewMode, setViewMode] = useState<"personal" | "team" | "leaves" | "monthly">("personal");
  const [isTrackerActive, setIsTrackerActive] = useState(false);

  // Live clock (IST)
  useEffect(() => {
    const tick = () =>
      setCurrentTime(
        new Date().toLocaleTimeString("en-US", {
          timeZone: "Asia/Kolkata",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const getISTDate = () => {
    const d = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  const getISTTime = () =>
    new Date().toLocaleTimeString("en-US", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      minute: "2-digit",
    });

  // ── Attendance toggle (check-in / check-out) ─────────────────────────────
  const handleToggle = async () => {
    if (attendanceBusy) return;
    if (!user || !user.id || user.id.startsWith("mock-")) return;
    setAttendanceBusy(true);
    try {
      const timeNow = getISTTime();
      const todayStr = getISTDate();
      const source = isCheckedIn ? "checkout" : "system";
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          date: todayStr,
          timeIn: timeNow,
          source,
          requestorRole: user.role,
        }),
      });
      const result = await res.json();
      if (!result.success) {
        alert(result.error || "Failed to record attendance. Please try again.");
        return;
      }
      await fetchPersonalAttendance();
    } catch {
      alert("Connection error. Please check your internet and try again.");
    } finally {
      setAttendanceBusy(false);
    }
  };

  // ── Team view state ───────────────────────────────────────────────────────
  const [startDate, setStartDate] = useState(getISTDate());
  const [endDate, setEndDate] = useState(getISTDate());
  const [teamRecords, setTeamRecords] = useState<any[]>([]);
  const [loadingTeam, setLoadingTeam] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredTeamRecords = teamRecords.filter(
    (r) => !searchTerm || r.user?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const fetchTeamAttendance = useCallback(async () => {
    setLoadingTeam(true);
    try {
      const res = await fetch(`/api/attendance?start=${startDate}&end=${endDate}`);
      const data = await res.json();
      if (data.success) setTeamRecords(data.data);
    } catch {}
    setLoadingTeam(false);
  }, [startDate, endDate]);

  // ── Monthly view state ────────────────────────────────────────────────────
  const [monthlyMonth, setMonthlyMonth] = useState(getISTDate().substring(0, 7));
  const [monthlyRecords, setMonthlyRecords] = useState<any[]>([]);
  const [loadingMonthly, setLoadingMonthly] = useState(false);

  const fetchMonthlyAttendance = useCallback(async () => {
    setLoadingMonthly(true);
    try {
      const res = await fetch(`/api/attendance/monthly?month=${monthlyMonth}`);
      const data = await res.json();
      if (data.success) setMonthlyRecords(data.data);
    } catch {}
    setLoadingMonthly(false);
  }, [monthlyMonth]);

  // ── Leave Management state ────────────────────────────────────────────────
  const [leaveData, setLeaveData] = useState<any[]>([]);
  const [loadingLeaves, setLoadingLeaves] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveForm, setLeaveForm] = useState({
    startDate: "",
    endDate: "",
    type: "Full Day",
    reason: "",
  });
  const [editLeaveModal, setEditLeaveModal] = useState<any>(null);

  const fetchLeaves = useCallback(async () => {
    setLoadingLeaves(true);
    try {
      const url =
        user?.role === "admin" ? `/api/leaves` : `/api/leaves?userId=${user?.id}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) setLeaveData(data.data);
    } catch (err) {
      console.error(err);
    }
    setLoadingLeaves(false);
  }, [user?.id, user?.role]);

  // ── Admin force check-in ──────────────────────────────────────────────────
  const handleAdminForceCheckIn = async (employeeId: string) => {
    if (!confirm("Are you sure you want to force check-in this employee without tracker validation?"))
      return;
    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: employeeId,
          date: getISTDate(),
          timeIn: getISTTime(),
          source: "system",
          isAdminBypass: true,
          requestorRole: user?.role,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        alert(data.error || "Failed to force check in");
        return;
      }
      fetchTeamAttendance();
    } catch {
      alert("Network error");
    }
  };

  // ── Leave submit ──────────────────────────────────────────────────────────
  const handleLeaveSubmit = async () => {
    if (!leaveForm.startDate || !leaveForm.endDate || !leaveForm.reason)
      return alert("Please fill all fields");
    try {
      const res = await fetch("/api/leaves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user?.id, ...leaveForm }),
      });
      if (res.ok) {
        setShowLeaveModal(false);
        fetchLeaves();
        setLeaveForm({ startDate: "", endDate: "", type: "Full Day", reason: "" });
      } else {
        alert("Failed to submit leave request");
      }
    } catch {
      alert("Network error");
    }
  };

  // ── Admin leave update ────────────────────────────────────────────────────
  const handleAdminLeaveUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editLeaveModal) return;
    try {
      const res = await fetch("/api/leaves/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminId: user?.id,
          leaveId: editLeaveModal.id,
          ...editLeaveModal,
        }),
      });
      if (res.ok) {
        setEditLeaveModal(null);
        fetchLeaves();
      } else {
        alert("Failed to update leave");
      }
    } catch {
      alert("Network error");
    }
  };

  // ── Personal attendance history ───────────────────────────────────────────
  const [attendanceHistory, setAttendanceHistory] = useState<any[]>([]);
  const [loadingPersonal, setLoadingPersonal] = useState(false);

  const fetchPersonalAttendance = useCallback(async () => {
    if (!user || !user.id || user.id.startsWith("mock-")) return;
    setLoadingPersonal(true);
    try {
      const startIST = new Date(
        new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
      );
      startIST.setDate(startIST.getDate() - 30);
      const startStr = `${startIST.getFullYear()}-${String(startIST.getMonth() + 1).padStart(2, "0")}-${String(startIST.getDate()).padStart(2, "0")}`;
      const res = await fetch(
        `/api/attendance?start=${startStr}&end=${getISTDate()}&email=${encodeURIComponent(user.email)}`
      );
      const data = await res.json();
      if (data.success) {
        const parseTime = (t: string) => {
          if (!t || t === "--") return 0;
          const [time, modifier] = t.split(" ");
          let [hours, minutes] = time.split(":").map(Number);
          if (hours === 12) hours = 0;
          if (modifier.toLowerCase() === "pm") hours += 12;
          return hours * 60 + minutes;
        };

        const formatDuration = (diffMins: number) => {
          if (diffMins <= 0) return "--";
          const h = Math.floor(diffMins / 60);
          const m = diffMins % 60;
          return `${h}h ${m}m`;
        };

        const rawRecords = data.data;
        const groupedByDate: Record<string, any> = {};

        rawRecords.forEach((record: any) => {
          const date = record.date;
          const checkInStr =
            record.mobileLoginTime || record.systemLoginTime || record.timeIn;
          const checkOutStr = record.timeOut;
          const isOpen =
            !checkOutStr || checkOutStr === "--" || checkOutStr === "";

          if (!groupedByDate[date]) {
            groupedByDate[date] = {
              date,
              checkIn: checkInStr,
              checkOut: isOpen ? "--" : checkOutStr,
              status: record.status,
              hasOpenShift: isOpen,
            };
          } else {
            if (parseTime(checkInStr) < parseTime(groupedByDate[date].checkIn)) {
              groupedByDate[date].checkIn = checkInStr;
            }
            if (isOpen) {
              groupedByDate[date].hasOpenShift = true;
              groupedByDate[date].checkOut = "--";
            } else if (!groupedByDate[date].hasOpenShift) {
              if (
                groupedByDate[date].checkOut === "--" ||
                parseTime(checkOutStr) > parseTime(groupedByDate[date].checkOut)
              ) {
                groupedByDate[date].checkOut = checkOutStr;
              }
            }
          }
        });

        const history = Object.values(groupedByDate)
          .sort((a: any, b: any) => b.date.localeCompare(a.date))
          .map((r: any) => {
            let totalMins = 0;
            if (r.checkIn && r.checkOut !== "--") {
              const inMins = parseTime(r.checkIn);
              const outMins = parseTime(r.checkOut);
              if (outMins >= inMins) totalMins = outMins - inMins;
            }
            let displayStatus = r.status;
            if (r.checkOut === "--") displayStatus = "In Progress";
            else if (totalMins < 510) displayStatus = "Short Day";

            return {
              date: r.date,
              checkIn: r.checkIn,
              checkOut: r.checkOut,
              hours: formatDuration(totalMins),
              status: displayStatus,
            };
          });

        setAttendanceHistory(history);

        // Hydrate check-in state from DB
        const todayStr = getISTDate();
        const latestTodayRecord = rawRecords.find((r: any) => r.date === todayStr);
        if (latestTodayRecord) {
          if (
            latestTodayRecord.timeOut &&
            latestTodayRecord.timeOut !== "--" &&
            latestTodayRecord.timeOut !== ""
          ) {
            setIsCheckedIn(false);
          } else {
            setIsCheckedIn(true);
            setCheckInTime(
              latestTodayRecord.timeIn ||
                latestTodayRecord.systemLoginTime ||
                latestTodayRecord.mobileLoginTime
            );
          }
        } else {
          setIsCheckedIn(false);
          setCheckInTime(null);
        }
      }
    } catch {}
    setLoadingPersonal(false);
  }, [user]);

  // ── Tracker status & data fetch on mode change ────────────────────────────
  useEffect(() => {
    if (viewMode === "team") fetchTeamAttendance();
    if (viewMode === "personal") fetchPersonalAttendance();
    if (viewMode === "monthly") fetchMonthlyAttendance();
    if (viewMode === "leaves") fetchLeaves();

    const checkTracker = async () => {
      try {
        if (!user || !user.id) return;
        const res = await fetch("/api/monitor/sync");
        const data = await res.json();
        if (data.success && data.data) {
          const myActivity = data.data.find(
            (act: any) => act.id === user.id || act.name === user.name
          );
          if (myActivity?.lastSync) {
            const diff = (Date.now() - new Date(myActivity.lastSync).getTime()) / 1000;
            setIsTrackerActive(diff < 30);
          } else {
            setIsTrackerActive(false);
          }
        }
      } catch (e) {
        console.error("Failed to check tracker status", e);
      }
    };
    checkTracker();
    const id = setInterval(checkTracker, 15000);
    return () => clearInterval(id);
  }, [viewMode, fetchTeamAttendance, fetchPersonalAttendance, user]);

  if (!user) return null;

  // ─── Tab bar label ─────────────────────────────────────────────────────────
  const pageTitle =
    viewMode === "team"
      ? "Team Attendance"
      : viewMode === "leaves"
      ? "Leave Management"
      : viewMode === "monthly"
      ? "Monthly Report"
      : "Attendance";

  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      {/* ── Page Header ────────────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "1rem",
          marginBottom: "1.75rem",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "1.5rem",
              fontWeight: 700,
              color: C.text,
              margin: 0,
            }}
          >
            {pageTitle}
          </h1>
          <p style={{ fontSize: "0.875rem", color: C.muted, margin: "0.25rem 0 0 0" }}>
            {viewMode === "team"
              ? "Monitor real-time team check-ins."
              : viewMode === "leaves"
              ? "Manage and approve time-off requests."
              : viewMode === "monthly"
              ? "Full-month summary for your team."
              : "Track your daily attendance — check in when you start and out when you finish."}
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          {/* Tab switcher */}
          <div
            style={{
              display: "flex",
              gap: "0.25rem",
              background: "#F3F4F6",
              padding: "0.25rem",
              borderRadius: C.radiusSm,
              border: `1px solid ${C.border}`,
            }}
          >
            <TabBtn
              label="My Attendance"
              active={viewMode === "personal"}
              onClick={() => setViewMode("personal")}
            />
            {user.role === "admin" && (
              <>
                <TabBtn
                  label="Team View"
                  active={viewMode === "team"}
                  onClick={() => setViewMode("team")}
                />
                <TabBtn
                  label="Monthly"
                  active={viewMode === "monthly"}
                  onClick={() => setViewMode("monthly")}
                />
              </>
            )}
            <TabBtn
              label={user.role === "admin" ? "Leave Approvals" : "My Leaves"}
              active={viewMode === "leaves"}
              onClick={() => setViewMode("leaves")}
            />
          </div>

          {/* Mark Attendance shortcut */}
          <a
            href="/attendance"
            target="_blank"
            rel="noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.5rem 1rem",
              background: C.primary,
              color: "#fff",
              borderRadius: C.radiusSm,
              fontSize: "0.875rem",
              fontWeight: 600,
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            📱 Mark Attendance
          </a>
        </div>
      </div>

      {/* ── TEAM VIEW ─────────────────────────────────────────────────────── */}
      {viewMode === "team" && (
        <div style={card}>
          {/* Filters bar */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "0.75rem",
              marginBottom: "1.25rem",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ position: "relative" }}>
                <Search
                  size={15}
                  style={{
                    position: "absolute",
                    left: "0.75rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: C.muted,
                  }}
                />
                <input
                  type="text"
                  placeholder="Search employee..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    paddingLeft: "2.25rem",
                    paddingRight: "0.75rem",
                    paddingTop: "0.45rem",
                    paddingBottom: "0.45rem",
                    border: `1px solid ${C.border}`,
                    borderRadius: C.radiusSm,
                    fontSize: "0.875rem",
                    color: C.text,
                    outline: "none",
                    width: "200px",
                  }}
                />
              </div>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{
                  padding: "0.45rem 0.75rem",
                  border: `1px solid ${C.border}`,
                  borderRadius: C.radiusSm,
                  fontSize: "0.875rem",
                  color: C.text,
                  outline: "none",
                }}
              />
              <span style={{ fontSize: "0.85rem", color: C.muted, fontWeight: 600 }}>to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{
                  padding: "0.45rem 0.75rem",
                  border: `1px solid ${C.border}`,
                  borderRadius: C.radiusSm,
                  fontSize: "0.875rem",
                  color: C.text,
                  outline: "none",
                }}
              />
              <button
                onClick={fetchTeamAttendance}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  padding: "0.45rem 0.85rem",
                  border: `1px solid ${C.border}`,
                  borderRadius: C.radiusSm,
                  background: "#fff",
                  color: C.text,
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <RefreshCw size={14} /> Refresh
              </button>
            </div>
            {/* Legend */}
            <div style={{ display: "flex", gap: "1rem" }}>
              {[
                { label: "Present", color: "#059669" },
                { label: "Absent", color: "#DC2626" },
                { label: "Late", color: "#D97706" },
              ].map(({ label, color }) => (
                <div
                  key={label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    color: C.muted,
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: color,
                      display: "inline-block",
                    }}
                  />
                  {label}
                </div>
              ))}
            </div>
          </div>

          {/* Table */}
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["Date", "Employee", "Role", "📱 Mobile Login", "💻 System Login", "Status", ...(user?.role === "admin" ? ["Actions"] : [])].map(
                    (col) => (
                      <th key={col} style={th}>{col}</th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {loadingTeam ? (
                  <tr>
                    <td colSpan={user?.role === "admin" ? 7 : 6} style={{ ...td, textAlign: "center", color: C.muted, padding: "2.5rem" }}>
                      Loading…
                    </td>
                  </tr>
                ) : filteredTeamRecords.length === 0 ? (
                  <tr>
                    <td colSpan={user?.role === "admin" ? 7 : 6} style={{ ...td, textAlign: "center", color: C.muted, padding: "2.5rem" }}>
                      No attendance records found.
                    </td>
                  </tr>
                ) : (
                  filteredTeamRecords.map((record, idx) => {
                    const mobile = record.mobileLoginTime || null;
                    const system = record.systemLoginTime || null;
                    return (
                      <tr
                        key={idx}
                        style={{ transition: "background 0.15s" }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = "#F9FAFB")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "transparent")
                        }
                      >
                        <td style={td}>{record.date}</td>
                        <td style={{ ...td, fontWeight: 600 }}>
                          {record.user?.name || "—"}
                        </td>
                        <td style={{ ...td, color: C.muted, textTransform: "capitalize" }}>
                          {record.user?.role?.toLowerCase()}
                        </td>
                        <td style={td}>
                          {mobile ? (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.3rem",
                                background: "#EEF2FF",
                                color: "#4F46E5",
                                borderRadius: C.radiusPill,
                                padding: "0.2rem 0.6rem",
                                fontSize: "0.78rem",
                                fontWeight: 600,
                              }}
                            >
                              📱 {mobile}
                            </span>
                          ) : (
                            <span style={{ color: C.muted }}>—</span>
                          )}
                        </td>
                        <td style={td}>
                          {system ? (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.3rem",
                                background: "#ECFDF5",
                                color: "#059669",
                                borderRadius: C.radiusPill,
                                padding: "0.2rem 0.6rem",
                                fontSize: "0.78rem",
                                fontWeight: 600,
                              }}
                            >
                              💻 {system}
                            </span>
                          ) : (
                            <span style={{ color: C.muted }}>—</span>
                          )}
                        </td>
                        <td style={td}>
                          <span style={statusBadge(record.status)}>{record.status}</span>
                        </td>
                        {user?.role === "admin" && (
                          <td style={td}>
                            <select
                              style={{
                                padding: "0.3rem 0.6rem",
                                border: `1px solid ${C.border}`,
                                borderRadius: C.radiusSm,
                                fontSize: "0.78rem",
                                color: C.text,
                                background: "#F9FAFB",
                                outline: "none",
                                cursor: "pointer",
                              }}
                              value={record.status}
                              onChange={async (e) => {
                                if (
                                  !confirm(
                                    `Change ${record.user?.name}'s status to ${e.target.value}?`
                                  )
                                )
                                  return;
                                try {
                                  const res = await fetch("/api/attendance/update", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({
                                      adminId: user.id,
                                      recordId: record.id,
                                      userId: record.user?.id,
                                      date: record.date,
                                      status: e.target.value,
                                      checkIn:
                                        e.target.value === "Present" &&
                                        !mobile &&
                                        !system
                                          ? "09:00 AM"
                                          : undefined,
                                    }),
                                  });
                                  if (res.ok) fetchTeamAttendance();
                                } catch (e) {
                                  console.error(e);
                                }
                              }}
                            >
                              <option value="Present">Present</option>
                              <option value="Absent">Absent</option>
                              <option value="Late">Late</option>
                              <option value="Half Day">Half Day</option>
                            </select>
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── PERSONAL VIEW ─────────────────────────────────────────────────── */}
      {viewMode === "personal" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 320px",
            gap: "1.5rem",
            alignItems: "start",
          }}
        >
          {/* Attendance history table */}
          <div style={card}>
            <h2
              style={{
                fontSize: "1rem",
                fontWeight: 700,
                color: C.text,
                margin: "0 0 1.25rem 0",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <CalendarDays size={18} color={C.primary} /> My Attendance Log
            </h2>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["Date", "Check In", "Check Out", "Hours", "Status"].map((col) => (
                      <th key={col} style={th}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loadingPersonal ? (
                    <tr>
                      <td colSpan={5} style={{ ...td, textAlign: "center", color: C.muted, padding: "2.5rem" }}>
                        Loading…
                      </td>
                    </tr>
                  ) : attendanceHistory.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ ...td, textAlign: "center", color: C.muted, padding: "2.5rem" }}>
                        No attendance log found.
                      </td>
                    </tr>
                  ) : (
                    attendanceHistory.map((record, idx) => (
                      <tr
                        key={idx}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = "#F9FAFB")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "transparent")
                        }
                        style={{ transition: "background 0.15s" }}
                      >
                        <td style={{ ...td, fontWeight: 500 }}>{record.date}</td>
                        <td style={{ ...td, color: record.checkIn !== "--" ? C.text : C.muted }}>
                          {record.checkIn}
                        </td>
                        <td style={{ ...td, color: record.checkOut !== "--" ? C.text : C.muted }}>
                          {record.checkOut}
                        </td>
                        <td style={{ ...td, fontWeight: 500 }}>{record.hours}</td>
                        <td style={td}>
                          <span style={statusBadge(record.status)}>{record.status}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Check-in action card */}
          <div
            style={{
              ...card,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: "2rem 1.5rem",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                background: "#EFF6FF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "1.25rem",
              }}
            >
              <Clock size={28} color={C.primary} />
            </div>

            <h3
              style={{
                fontSize: "2rem",
                fontWeight: 800,
                fontFamily: "monospace",
                color: C.text,
                margin: "0 0 0.35rem 0",
                letterSpacing: "0.04em",
              }}
            >
              {currentTime || "--:--:--"}
            </h3>
            <p
              style={{
                fontSize: "0.8rem",
                color: C.muted,
                marginBottom: "1.75rem",
                display: "flex",
                alignItems: "center",
                gap: "0.3rem",
                justifyContent: "center",
              }}
            >
              <MapPin size={13} /> South Extension Part 1, New Delhi
            </p>

            {attendanceBusy ? (
              <button
                disabled
                style={{
                  width: "100%",
                  padding: "0.9rem",
                  borderRadius: C.radiusSm,
                  border: "none",
                  background: "#F3F4F6",
                  color: C.muted,
                  fontWeight: 700,
                  fontSize: "0.95rem",
                  cursor: "not-allowed",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                }}
              >
                <span
                  style={{
                    width: 16,
                    height: 16,
                    border: `2px solid ${C.muted}`,
                    borderTop: "2px solid transparent",
                    borderRadius: "50%",
                    animation: "spin 0.8s linear infinite",
                    display: "inline-block",
                  }}
                />
                {isCheckedIn ? "Checking Out…" : "Checking In…"}
              </button>
            ) : isCheckedIn ? (
              <div style={{ width: "100%" }}>
                <div
                  style={{
                    background: "#ECFDF5",
                    border: "1px solid #A7F3D0",
                    borderRadius: C.radiusSm,
                    padding: "0.875rem",
                    marginBottom: "1.25rem",
                  }}
                >
                  <p
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.4rem",
                      color: "#059669",
                      fontWeight: 700,
                      fontSize: "0.875rem",
                      margin: 0,
                    }}
                  >
                    <CheckCircle2 size={16} /> Checked In at {checkInTime}
                  </p>
                </div>
                <button
                  onClick={handleToggle}
                  style={{
                    width: "100%",
                    padding: "0.9rem",
                    borderRadius: C.radiusSm,
                    border: "none",
                    cursor: "pointer",
                    background: "#DC2626",
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: "0.95rem",
                  }}
                >
                  Check Out
                </button>
              </div>
            ) : (
              <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <button
                  onClick={handleToggle}
                  style={{
                    width: "100%",
                    padding: "0.9rem",
                    borderRadius: C.radiusSm,
                    border: "none",
                    cursor: "pointer",
                    background: C.primary,
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: "0.95rem",
                  }}
                >
                  Mark Check In
                </button>
                <a
                  href="/attendance"
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: "block",
                    width: "100%",
                    padding: "0.75rem",
                    borderRadius: C.radiusSm,
                    border: `1px solid ${C.border}`,
                    background: "#F9FAFB",
                    color: C.primary,
                    fontWeight: 600,
                    fontSize: "0.85rem",
                    textDecoration: "none",
                    textAlign: "center",
                  }}
                >
                  📱 Open Mobile Check-In
                </a>
              </div>
            )}

            <p
              style={{
                marginTop: "1rem",
                fontSize: "0.78rem",
                color: C.muted,
                lineHeight: 1.5,
              }}
            >
              Check In and Check Out are manual — mark from here or the mobile web page.
            </p>
          </div>
        </div>
      )}

      {/* ── MONTHLY VIEW ──────────────────────────────────────────────────── */}
      {viewMode === "monthly" && (
        <div style={card}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1.25rem",
              flexWrap: "wrap",
              gap: "0.75rem",
            }}
          >
            <h2
              style={{
                fontSize: "1rem",
                fontWeight: 700,
                color: C.text,
                margin: 0,
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <CalendarDays size={18} color={C.primary} /> Monthly Attendance Summary
            </h2>
            <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
              <input
                type="month"
                value={monthlyMonth}
                onChange={(e) => setMonthlyMonth(e.target.value)}
                style={{
                  padding: "0.45rem 0.75rem",
                  border: `1px solid ${C.border}`,
                  borderRadius: C.radiusSm,
                  fontSize: "0.875rem",
                  color: C.text,
                  outline: "none",
                }}
              />
              <button
                onClick={fetchMonthlyAttendance}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  padding: "0.45rem 0.85rem",
                  border: `1px solid ${C.border}`,
                  borderRadius: C.radiusSm,
                  background: "#fff",
                  color: C.text,
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <RefreshCw size={14} /> Refresh
              </button>
            </div>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["Employee", "Total Days", "Present", "Absent", "Late", "Half Days"].map(
                    (col) => <th key={col} style={th}>{col}</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {loadingMonthly ? (
                  <tr>
                    <td colSpan={6} style={{ ...td, textAlign: "center", color: C.muted, padding: "2.5rem" }}>
                      Loading…
                    </td>
                  </tr>
                ) : monthlyRecords.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ ...td, textAlign: "center", color: C.muted, padding: "2.5rem" }}>
                      No records found for {monthlyMonth}.
                    </td>
                  </tr>
                ) : (
                  monthlyRecords.map((r: any) => (
                    <tr
                      key={r.userId}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = "#F9FAFB")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "transparent")
                      }
                      style={{ transition: "background 0.15s" }}
                    >
                      <td style={{ ...td, fontWeight: 600 }}>{r.userName}</td>
                      <td style={td}>{r.totalTracked}</td>
                      <td style={{ ...td, color: "#059669", fontWeight: 600 }}>{r.present}</td>
                      <td style={{ ...td, color: "#DC2626", fontWeight: 600 }}>{r.absent}</td>
                      <td style={{ ...td, color: "#D97706", fontWeight: 600 }}>{r.late}</td>
                      <td style={{ ...td, color: "#EA580C", fontWeight: 600 }}>{r.halfDay}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── LEAVES VIEW ───────────────────────────────────────────────────── */}
      {viewMode === "leaves" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Leave balance cards (employee only) */}
          {user.role !== "admin" && leaveData.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
              <div style={card}>
                <p style={{ fontSize: "0.8rem", color: C.muted, fontWeight: 600, margin: "0 0 0.5rem 0" }}>
                  Remaining Full Leaves
                </p>
                <div style={{ fontSize: "2rem", fontWeight: 800, color: C.primary }}>
                  {leaveData[0].balances.remainingFull}{" "}
                  <span style={{ fontSize: "1rem", color: C.muted }}>/ 12</span>
                </div>
                {leaveData[0].balances.penaltyDeductions > 0 && (
                  <p style={{ color: "#DC2626", fontSize: "0.75rem", marginTop: "0.5rem", fontWeight: 600 }}>
                    -{leaveData[0].balances.penaltyDeductions} Penalty
                  </p>
                )}
              </div>
              <div style={card}>
                <p style={{ fontSize: "0.8rem", color: C.muted, fontWeight: 600, margin: "0 0 0.5rem 0" }}>
                  Remaining Short Leaves
                </p>
                <div style={{ fontSize: "2rem", fontWeight: 800, color: "#EA580C" }}>
                  {leaveData[0].balances.remainingShort}{" "}
                  <span style={{ fontSize: "1rem", color: C.muted }}>/ 6</span>
                </div>
              </div>
            </div>
          )}

          <div style={card}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1.25rem",
              }}
            >
              <h2
                style={{
                  fontSize: "1rem",
                  fontWeight: 700,
                  color: C.text,
                  margin: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <FileText size={18} color={C.primary} />
                {user.role === "admin" ? "Leave Approvals" : "My Leave Requests"}
              </h2>
              {user.role !== "admin" && (
                <button
                  onClick={() => setShowLeaveModal(true)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    padding: "0.5rem 1rem",
                    background: C.primary,
                    color: "#fff",
                    border: "none",
                    borderRadius: C.radiusSm,
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  + Apply for Leave
                </button>
              )}
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {[
                      ...(user.role === "admin" ? ["Employee"] : []),
                      "Date(s)", "Type", "Reason", "Status",
                      ...(user.role === "admin" ? ["Actions"] : []),
                    ].map((col) => <th key={col} style={th}>{col}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {loadingLeaves ? (
                    <tr>
                      <td colSpan={6} style={{ ...td, textAlign: "center", color: C.muted, padding: "2.5rem" }}>
                        Loading…
                      </td>
                    </tr>
                  ) : leaveData.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ ...td, textAlign: "center", color: C.muted, padding: "2.5rem" }}>
                        No records found.
                      </td>
                    </tr>
                  ) : (
                    leaveData
                      .map((userData) =>
                        userData.requests.map((req: any) => {
                          let statusColor = "#D97706";
                          let statusBg = "#FFFBEB";
                          if (req.status === "Approved") {
                            statusColor = "#059669";
                            statusBg = "#ECFDF5";
                          } else if (
                            req.status === "Rejected" ||
                            req.status === "Cancelled"
                          ) {
                            statusColor = "#DC2626";
                            statusBg = "#FEF2F2";
                          }
                          return (
                            <tr
                              key={req.id}
                              onMouseEnter={(e) =>
                                (e.currentTarget.style.background = "#F9FAFB")
                              }
                              onMouseLeave={(e) =>
                                (e.currentTarget.style.background = "transparent")
                              }
                              style={{ transition: "background 0.15s" }}
                            >
                              {user.role === "admin" && (
                                <td style={{ ...td, fontWeight: 600 }}>
                                  {userData.user.name}
                                </td>
                              )}
                              <td style={td}>
                                {req.startDate}{" "}
                                {req.startDate !== req.endDate && `→ ${req.endDate}`}
                              </td>
                              <td style={{ ...td, fontWeight: 600, color: C.primary }}>
                                {req.type}
                              </td>
                              <td
                                style={{
                                  ...td,
                                  color: C.muted,
                                  maxWidth: 200,
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                }}
                              >
                                {req.reason}
                              </td>
                              <td style={td}>
                                <span
                                  style={{
                                    display: "inline-block",
                                    padding: "0.25rem 0.65rem",
                                    borderRadius: C.radiusPill,
                                    fontSize: "0.75rem",
                                    fontWeight: 600,
                                    background: statusBg,
                                    color: statusColor,
                                  }}
                                >
                                  {req.status}
                                </span>
                              </td>
                              {user.role === "admin" && (
                                <td style={td}>
                                  <button
                                    onClick={() =>
                                      setEditLeaveModal({
                                        ...req,
                                        userName: userData.user.name,
                                      })
                                    }
                                    style={{
                                      padding: "0.3rem 0.75rem",
                                      border: `1px solid ${C.border}`,
                                      borderRadius: C.radiusSm,
                                      background: "#fff",
                                      color: C.text,
                                      fontSize: "0.78rem",
                                      fontWeight: 600,
                                      cursor: "pointer",
                                    }}
                                  >
                                    Edit
                                  </button>
                                </td>
                              )}
                            </tr>
                          );
                        })
                      )
                      .flat()
                  )}
                  {!loadingLeaves &&
                    leaveData.reduce((acc, u) => acc + u.requests.length, 0) === 0 && (
                      <tr>
                        <td colSpan={6} style={{ ...td, textAlign: "center", color: C.muted, padding: "2.5rem" }}>
                          No leave requests found.
                        </td>
                      </tr>
                    )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Apply Leave Modal ─────────────────────────────────────────────── */}
      {showLeaveModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
          }}
        >
          <div
            style={{
              ...card,
              width: "100%",
              maxWidth: 420,
              padding: "2rem",
              boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1.5rem",
              }}
            >
              <h3 style={{ fontSize: "1.125rem", fontWeight: 700, color: C.text, margin: 0 }}>
                Apply for Leave
              </h3>
              <button
                onClick={() => setShowLeaveModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: C.muted,
                  cursor: "pointer",
                  padding: "0.25rem",
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: C.muted, marginBottom: "0.35rem" }}>
                  Leave Type
                </label>
                <select
                  value={leaveForm.type}
                  onChange={(e) => setLeaveForm({ ...leaveForm, type: e.target.value })}
                  style={inputStyle}
                >
                  <option value="Full Day">Full Day</option>
                  <option value="Half Day">Half Day</option>
                  <option value="Short Leave (2hrs Late)">Short Leave (2hrs Late)</option>
                  <option value="Short Leave (2hrs Early)">Short Leave (2hrs Early)</option>
                </select>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: C.muted, marginBottom: "0.35rem" }}>
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={leaveForm.startDate}
                    onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: C.muted, marginBottom: "0.35rem" }}>
                    End Date
                  </label>
                  <input
                    type="date"
                    value={leaveForm.endDate}
                    onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                    style={inputStyle}
                  />
                </div>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: C.muted, marginBottom: "0.35rem" }}>
                  Reason
                </label>
                <textarea
                  rows={3}
                  value={leaveForm.reason}
                  onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                  placeholder="Reason for leave..."
                  style={{ ...inputStyle, resize: "vertical" }}
                />
              </div>
              <button
                onClick={handleLeaveSubmit}
                style={{
                  padding: "0.8rem",
                  background: C.primary,
                  color: "#fff",
                  border: "none",
                  borderRadius: C.radiusSm,
                  fontWeight: 700,
                  fontSize: "0.9rem",
                  cursor: "pointer",
                  marginTop: "0.25rem",
                }}
              >
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Admin Edit Leave Modal ────────────────────────────────────────── */}
      {editLeaveModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
          }}
        >
          <div
            style={{
              ...card,
              width: "100%",
              maxWidth: 420,
              padding: "2rem",
              boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1.5rem",
              }}
            >
              <h3 style={{ fontSize: "1.125rem", fontWeight: 700, color: C.text, margin: 0 }}>
                Edit Leave Request
              </h3>
              <button
                onClick={() => setEditLeaveModal(null)}
                style={{ background: "none", border: "none", color: C.muted, cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: "0.875rem", color: C.muted, marginBottom: "1.25rem" }}>
              Employee: <strong style={{ color: C.text }}>{editLeaveModal.userName}</strong>
            </p>

            <form onSubmit={handleAdminLeaveUpdate} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: C.muted, marginBottom: "0.35rem" }}>
                  Status
                </label>
                <select
                  value={editLeaveModal.status}
                  onChange={(e) => setEditLeaveModal({ ...editLeaveModal, status: e.target.value })}
                  style={inputStyle}
                >
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: C.muted, marginBottom: "0.35rem" }}>
                  Leave Type
                </label>
                <select
                  value={editLeaveModal.type}
                  onChange={(e) => setEditLeaveModal({ ...editLeaveModal, type: e.target.value })}
                  style={inputStyle}
                >
                  <option value="Full Day">Full Day</option>
                  <option value="Half Day">Half Day</option>
                  <option value="Short Leave (2hrs Late)">Short Leave (2hrs Late)</option>
                  <option value="Short Leave (2hrs Early)">Short Leave (2hrs Early)</option>
                </select>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: C.muted, marginBottom: "0.35rem" }}>
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={editLeaveModal.startDate}
                    onChange={(e) => setEditLeaveModal({ ...editLeaveModal, startDate: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: C.muted, marginBottom: "0.35rem" }}>
                    End Date
                  </label>
                  <input
                    type="date"
                    value={editLeaveModal.endDate}
                    onChange={(e) => setEditLeaveModal({ ...editLeaveModal, endDate: e.target.value })}
                    style={inputStyle}
                  />
                </div>
              </div>
              <button
                type="submit"
                style={{
                  padding: "0.8rem",
                  background: C.primary,
                  color: "#fff",
                  border: "none",
                  borderRadius: C.radiusSm,
                  fontWeight: 700,
                  fontSize: "0.9rem",
                  cursor: "pointer",
                  marginTop: "0.25rem",
                }}
              >
                Save Changes
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Shared input style
const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.55rem 0.75rem",
  border: `1px solid #E5E7EB`,
  borderRadius: "6px",
  fontSize: "0.875rem",
  color: "#111827",
  background: "#fff",
  outline: "none",
  boxSizing: "border-box",
};
