"use client";

import { useState, useEffect, useCallback } from "react";
import { useRole } from "@/context/RoleContext";
import {
  MapPin, Clock, CalendarDays, CheckCircle2, Search,
  FileText, X, RefreshCw, AlertCircle,
  Briefcase, Check, Sliders, Home,
} from "lucide-react";

// ─── Design Tokens ────────────────────────────────────────────────────────────
const C = {
  bg: "#F5F7FB",
  card: "#FFFFFF",
  border: "#E5E7EB",
  primary: "#1A56DB",
  text: "#111827",
  muted: "#6B7280",
  success: "#059669",
  warning: "#D97706",
  danger: "#DC2626",
  purple: "#7C3AED",
  orange: "#EA580C",
  radius: "8px",
  radiusSm: "6px",
  radiusPill: "999px",
};

const cardStyle: React.CSSProperties = {
  background: C.card,
  border: `1px solid ${C.border}`,
  borderRadius: C.radius,
  padding: "1.5rem",
};

const thStyle: React.CSSProperties = {
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

const tdStyle: React.CSSProperties = {
  padding: "0.875rem 1rem",
  fontSize: "0.875rem",
  color: C.text,
  borderBottom: `1px solid ${C.border}`,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.55rem 0.75rem",
  border: `1px solid ${C.border}`,
  borderRadius: C.radiusSm,
  fontSize: "0.875rem",
  color: C.text,
  background: "#fff",
  outline: "none",
  boxSizing: "border-box",
  colorScheme: "light",
};

function statusBadge(status: string, lateMinutes?: number): { style: React.CSSProperties; label: string } {
  const s = (status || "").toLowerCase();
  if (s === "present") {
    return {
      style: { background: "#ECFDF5", color: "#059669" },
      label: "✅ Present",
    };
  }
  if (s === "late") {
    return {
      style: { background: "#FFFBEB", color: "#D97706" },
      label: lateMinutes && lateMinutes > 0 ? `⚠️ Late (+${lateMinutes}m)` : "⚠️ Late",
    };
  }
  if (s === "half day" || s === "short day") {
    return {
      style: { background: "#FFF7ED", color: "#EA580C" },
      label: "🌓 Half Day",
    };
  }
  if (s === "on leave" || s.includes("leave")) {
    return {
      style: { background: "#EFF6FF", color: "#1D4ED8" },
      label: "🌴 On Leave",
    };
  }
  if (s === "wfh") {
    return {
      style: { background: "#F5F3FF", color: "#7C3AED" },
      label: "🏠 WFH",
    };
  }
  if (s === "absent") {
    return {
      style: { background: "#FEF2F2", color: "#DC2626" },
      label: "❌ Absent",
    };
  }
  return {
    style: { background: "#F3F4F6", color: C.muted },
    label: status || "—",
  };
}

function TabBtn({
  label, icon: Icon, active, count, onClick,
}: { label: string; icon?: any; active: boolean; count?: number; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.45rem",
        padding: "0.5rem 0.95rem",
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
      {Icon && <Icon size={14} />}
      {label}
      {count !== undefined && count > 0 && (
        <span
          style={{
            background: active ? "rgba(255,255,255,0.25)" : "#E5E7EB",
            color: active ? "#fff" : C.text,
            borderRadius: C.radiusPill,
            padding: "0.1rem 0.45rem",
            fontSize: "0.72rem",
            fontWeight: 700,
          }}
        >
          {count}
        </span>
      )}
    </button>
  );
}

export default function AttendancePage() {
  const { user } = useRole();
  const isAdmin = user?.role === "admin";

  // Tab State
  const [tab, setTab] = useState<"team" | "my_att" | "monthly" | "leaves" | "overtime" | "policy">(
    isAdmin ? "team" : "my_att"
  );

  useEffect(() => {
    if (isAdmin && tab === "my_att") {
      setTab("team");
    }
  }, [isAdmin, tab]);

  // Live IST Clock
  const [currentTime, setCurrentTime] = useState("");
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

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. TEAM ATTENDANCE (ADMIN)
  // ─────────────────────────────────────────────────────────────────────────────
  const [startDate, setStartDate] = useState(getISTDate());
  const [endDate, setEndDate] = useState(getISTDate());
  const [teamRecords, setTeamRecords] = useState<any[]>([]);
  const [teamSummary, setTeamSummary] = useState<any>(null);
  const [loadingTeam, setLoadingTeam] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchTeamAttendance = useCallback(async () => {
    setLoadingTeam(true);
    try {
      const res = await fetch(`/api/attendance?start=${startDate}&end=${endDate}`);
      const data = await res.json();
      if (data.success) {
        setTeamRecords(data.data || []);
        setTeamSummary(data.summary || null);
      }
    } catch (e) {
      console.error(e);
    }
    setLoadingTeam(false);
  }, [startDate, endDate]);

  const filteredTeamRecords = teamRecords.filter(
    (r) => !searchTerm || r.user?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. MY ATTENDANCE (EMPLOYEE PUNCH IN/OUT)
  // ─────────────────────────────────────────────────────────────────────────────
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState<string | null>(null);
  const [attendanceBusy, setAttendanceBusy] = useState(false);
  const [myHistory, setMyHistory] = useState<any[]>([]);
  const [loadingMyHistory, setLoadingMyHistory] = useState(false);

  const fetchMyAttendance = useCallback(async () => {
    if (!user?.id || user.id.startsWith("mock-")) return;
    setLoadingMyHistory(true);
    try {
      const startIST = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
      startIST.setDate(startIST.getDate() - 30);
      const startStr = `${startIST.getFullYear()}-${String(startIST.getMonth() + 1).padStart(2, "0")}-${String(startIST.getDate()).padStart(2, "0")}`;
      const res = await fetch(`/api/attendance?start=${startStr}&end=${getISTDate()}&email=${encodeURIComponent(user.email)}`);
      const data = await res.json();
      if (data.success && data.data) {
        const records = data.data;
        setMyHistory(records);

        // Check today's active check-in
        const todayStr = getISTDate();
        const todayRec = records.find((r: any) => r.date === todayStr);
        if (todayRec) {
          if (!todayRec.timeOut || todayRec.timeOut === "--" || todayRec.timeOut === "") {
            setIsCheckedIn(true);
            setCheckInTime(todayRec.timeIn || todayRec.systemLoginTime || todayRec.mobileLoginTime);
          } else {
            setIsCheckedIn(false);
            setCheckInTime(null);
          }
        } else {
          setIsCheckedIn(false);
          setCheckInTime(null);
        }
      }
    } catch (e) {
      console.error(e);
    }
    setLoadingMyHistory(false);
  }, [user]);

  const handlePunchToggle = async () => {
    if (attendanceBusy || !user?.id) return;
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
        alert(result.error || "Attendance action failed. Please try again.");
      } else {
        await fetchMyAttendance();
      }
    } catch {
      alert("Network error. Please try again.");
    } finally {
      setAttendanceBusy(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. MONTHLY SUMMARY (ADMIN)
  // ─────────────────────────────────────────────────────────────────────────────
  const [monthlyMonth, setMonthlyMonth] = useState(getISTDate().substring(0, 7));
  const [monthlyRecords, setMonthlyRecords] = useState<any[]>([]);
  const [loadingMonthly, setLoadingMonthly] = useState(false);

  const fetchMonthly = useCallback(async () => {
    setLoadingMonthly(true);
    try {
      const res = await fetch(`/api/attendance/monthly?month=${monthlyMonth}`);
      const data = await res.json();
      if (data.success) {
        setMonthlyRecords(data.data || []);
      }
    } catch (e) {
      console.error(e);
    }
    setLoadingMonthly(false);
  }, [monthlyMonth]);

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. LEAVE MANAGEMENT
  // ─────────────────────────────────────────────────────────────────────────────
  const [leavesData, setLeavesData] = useState<any[]>([]);
  const [loadingLeaves, setLoadingLeaves] = useState(false);
  const [showApplyLeaveModal, setShowApplyLeaveModal] = useState(false);
  const [leaveStatusFilter, setLeaveStatusFilter] = useState("ALL");
  const [leaveForm, setLeaveForm] = useState({
    startDate: "",
    endDate: "",
    type: "Casual Leave (CL)",
    reason: "",
  });
  const [rejectRemarkModal, setRejectRemarkModal] = useState<{ id: string; name: string } | null>(null);
  const [rejectRemark, setRejectRemark] = useState("");

  const fetchLeaves = useCallback(async () => {
    setLoadingLeaves(true);
    try {
      const url = isAdmin
        ? `/api/leaves?role=ADMIN&status=${leaveStatusFilter}`
        : `/api/leaves?userId=${user?.id}&role=${user?.role}&status=${leaveStatusFilter}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setLeavesData(data.data || []);
      }
    } catch (e) {
      console.error(e);
    }
    setLoadingLeaves(false);
  }, [isAdmin, user?.id, user?.role, leaveStatusFilter]);

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveForm.startDate || !leaveForm.endDate || !leaveForm.reason.trim()) {
      return alert("Please fill all required fields.");
    }
    try {
      const res = await fetch("/api/leaves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id,
          ...leaveForm,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowApplyLeaveModal(false);
        setLeaveForm({ startDate: "", endDate: "", type: "Casual Leave (CL)", reason: "" });
        fetchLeaves();
      } else {
        alert(data.error || "Failed to submit leave request.");
      }
    } catch {
      alert("Network error.");
    }
  };

  const handleAdminLeaveReview = async (leaveId: string, status: "Approved" | "Rejected", notes?: string) => {
    try {
      const res = await fetch("/api/leaves", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leaveId,
          status,
          adminNotes: notes,
          adminId: user?.id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setRejectRemarkModal(null);
        setRejectRemark("");
        fetchLeaves();
        if (tab === "team") fetchTeamAttendance();
      } else {
        alert(data.error || "Failed to update leave request.");
      }
    } catch {
      alert("Network error.");
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // 5. OVERTIME (OT) MANAGEMENT
  // ─────────────────────────────────────────────────────────────────────────────
  const [otMonth, setOtMonth] = useState(getISTDate().substring(0, 7));
  const [otRequests, setOtRequests] = useState<any[]>([]);
  const [otSummary, setOtSummary] = useState<any>(null);
  const [loadingOt, setLoadingOt] = useState(false);
  const [showOtModal, setShowOtModal] = useState(false);
  const [otForm, setOtForm] = useState({
    date: getISTDate(),
    hours: "2.0",
    taskOrJobTitle: "",
    reason: "",
  });
  const [otReviewModal, setOtReviewModal] = useState<any>(null);
  const [approvedHoursInput, setApprovedHoursInput] = useState("");
  const [otAdminNotes, setOtAdminNotes] = useState("");

  const fetchOvertime = useCallback(async () => {
    setLoadingOt(true);
    try {
      const url = isAdmin
        ? `/api/overtime?role=ADMIN&month=${otMonth}`
        : `/api/overtime?userId=${user?.id}&role=${user?.role}&month=${otMonth}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setOtRequests(data.data || []);
        setOtSummary(data.summary || null);
      }
    } catch (e) {
      console.error(e);
    }
    setLoadingOt(false);
  }, [isAdmin, user?.id, user?.role, otMonth]);

  const handleRequestOvertime = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otForm.date || !otForm.hours || !otForm.taskOrJobTitle.trim() || !otForm.reason.trim()) {
      return alert("Please fill all required fields.");
    }
    try {
      const res = await fetch("/api/overtime", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id,
          ...otForm,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowOtModal(false);
        setOtForm({ date: getISTDate(), hours: "2.0", taskOrJobTitle: "", reason: "" });
        fetchOvertime();
      } else {
        alert(data.error || "Failed to submit overtime request.");
      }
    } catch {
      alert("Network error.");
    }
  };

  const handleAdminOtReview = async (requestId: string, status: "APPROVED" | "REJECTED") => {
    try {
      const res = await fetch("/api/overtime", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId,
          status,
          approvedHours: status === "APPROVED" ? parseFloat(approvedHoursInput) : null,
          adminNotes: otAdminNotes,
          adminId: user?.id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setOtReviewModal(null);
        setApprovedHoursInput("");
        setOtAdminNotes("");
        fetchOvertime();
      } else {
        alert(data.error || "Failed to review overtime.");
      }
    } catch {
      alert("Network error.");
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // 6. ATTENDANCE POLICY (ADMIN)
  // ─────────────────────────────────────────────────────────────────────────────
  const [policy, setPolicy] = useState({
    workStartTime: "10:00",
    workEndTime: "18:30",
    lateGrace: 15,
    latePenalty: 3,
    breakDuration: 30,
    breakStartTime: "13:00",
    breakEndTime: "13:30",
  });
  const [policySaved, setPolicySaved] = useState(false);

  const fetchPolicy = useCallback(async () => {
    try {
      const res = await fetch("/api/settings");
      const data = await res.json();
      if (data.success && data.data) {
        const s = data.data;
        setPolicy({
          workStartTime: s.workStartTime || "10:00",
          workEndTime: s.workEndTime || "18:30",
          lateGrace: s.lateGrace ?? 15,
          latePenalty: s.latePenalty ?? 3,
          breakDuration: s.breakDuration ?? 30,
          breakStartTime: s.breakStartTime || "13:00",
          breakEndTime: s.breakEndTime || "13:30",
        });
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleSavePolicy = async () => {
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(policy),
      });
      const data = await res.json();
      if (data.success) {
        setPolicySaved(true);
        setTimeout(() => setPolicySaved(false), 2500);
      }
    } catch {
      alert("Failed to save policy.");
    }
  };

  // Trigger fetches on tab changes
  useEffect(() => {
    if (tab === "team") fetchTeamAttendance();
    if (tab === "my_att") fetchMyAttendance();
    if (tab === "monthly") fetchMonthly();
    if (tab === "leaves") fetchLeaves();
    if (tab === "overtime") fetchOvertime();
    if (tab === "policy") fetchPolicy();
  }, [tab, fetchTeamAttendance, fetchMyAttendance, fetchMonthly, fetchLeaves, fetchOvertime, fetchPolicy]);

  if (!user) return null;

  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      {/* ── Top Header ────────────────────────────────────────────────────── */}
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
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: C.text, margin: 0 }}>
            Attendance &amp; Leave Operations
          </h1>
          <p style={{ fontSize: "0.875rem", color: C.muted, margin: "0.25rem 0 0 0" }}>
            {isAdmin
              ? "Monitor live employee check-ins, approve leaves, review overtime, and enforce shift policies."
              : "Punch in/out, view attendance records, apply for leaves, and submit overtime requests."}
          </p>
        </div>

        {/* Tab Navigation Pill Bar */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
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
            {isAdmin ? (
              <>
                <TabBtn label="Team Attendance" icon={CalendarDays} active={tab === "team"} onClick={() => setTab("team")} />
                <TabBtn label="Monthly Summary" icon={Clock} active={tab === "monthly"} onClick={() => setTab("monthly")} />
                <TabBtn
                  label="Leave Approvals"
                  icon={FileText}
                  active={tab === "leaves"}
                  count={leavesData.reduce((acc, u) => acc + (u.requests?.filter((r: any) => r.status === "Pending").length || 0), 0)}
                  onClick={() => setTab("leaves")}
                />
                <TabBtn
                  label="Overtime (OT)"
                  icon={Briefcase}
                  active={tab === "overtime"}
                  count={otSummary?.pendingCount || 0}
                  onClick={() => setTab("overtime")}
                />
                <TabBtn label="Policy & Rules" icon={Sliders} active={tab === "policy"} onClick={() => setTab("policy")} />
              </>
            ) : (
              <>
                <TabBtn label="My Attendance" icon={Clock} active={tab === "my_att"} onClick={() => setTab("my_att")} />
                <TabBtn label="My Leaves" icon={FileText} active={tab === "leaves"} onClick={() => setTab("leaves")} />
                <TabBtn label="My Overtime (OT)" icon={Briefcase} active={tab === "overtime"} onClick={() => setTab("overtime")} />
              </>
            )}
          </div>

          {!isAdmin && (
            <a
              href="/attendance"
              target="_blank"
              rel="noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.5rem 0.95rem",
                background: C.primary,
                color: "#fff",
                borderRadius: C.radiusSm,
                fontSize: "0.85rem",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              📱 Mobile Punch Portal
            </a>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* TAB 1: TEAM ATTENDANCE (ADMIN) */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {tab === "team" && isAdmin && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {/* Quick KPI Stat Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem" }}>
            <div style={cardStyle}>
              <p style={{ fontSize: "0.78rem", color: C.muted, fontWeight: 700, margin: "0 0 0.4rem 0", textTransform: "uppercase" }}>
                Present Today
              </p>
              <div style={{ fontSize: "1.75rem", fontWeight: 800, color: C.success }}>
                {teamSummary?.presentCount ?? teamRecords.filter((r) => r.status === "Present").length}
              </div>
              <p style={{ fontSize: "0.75rem", color: C.muted, margin: "0.3rem 0 0 0" }}>On-time arrivals</p>
            </div>

            <div style={cardStyle}>
              <p style={{ fontSize: "0.78rem", color: C.muted, fontWeight: 700, margin: "0 0 0.4rem 0", textTransform: "uppercase" }}>
                Late Arrivals
              </p>
              <div style={{ fontSize: "1.75rem", fontWeight: 800, color: C.warning }}>
                {teamSummary?.lateCount ?? teamRecords.filter((r) => r.status === "Late").length}
              </div>
              <p style={{ fontSize: "0.75rem", color: C.muted, margin: "0.3rem 0 0 0" }}>
                {teamSummary?.totalLateMinutes ? `${teamSummary.totalLateMinutes} total mins late` : "Past 10:15 AM grace"}
              </p>
            </div>

            <div style={cardStyle}>
              <p style={{ fontSize: "0.78rem", color: C.muted, fontWeight: 700, margin: "0 0 0.4rem 0", textTransform: "uppercase" }}>
                Half Days
              </p>
              <div style={{ fontSize: "1.75rem", fontWeight: 800, color: C.orange }}>
                {teamSummary?.halfDayCount ?? teamRecords.filter((r) => r.status === "Half Day").length}
              </div>
              <p style={{ fontSize: "0.75rem", color: C.muted, margin: "0.3rem 0 0 0" }}>&lt; 4.5 hrs worked</p>
            </div>

            <div style={cardStyle}>
              <p style={{ fontSize: "0.78rem", color: C.muted, fontWeight: 700, margin: "0 0 0.4rem 0", textTransform: "uppercase" }}>
                On Leave / WFH
              </p>
              <div style={{ fontSize: "1.75rem", fontWeight: 800, color: C.primary }}>
                {(teamSummary?.onLeaveCount || 0) + (teamSummary?.wfhCount || 0)}
              </div>
              <p style={{ fontSize: "0.75rem", color: C.muted, margin: "0.3rem 0 0 0" }}>Approved time off</p>
            </div>
          </div>

          {/* Filters & Table */}
          <div style={cardStyle}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "0.75rem",
                marginBottom: "1.25rem",
              }}
            >
              <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
                <div style={{ position: "relative" }}>
                  <Search
                    size={14}
                    style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: C.muted }}
                  />
                  <input
                    type="text"
                    placeholder="Search employee..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ ...inputStyle, paddingLeft: "2.2rem", width: "220px" }}
                  />
                </div>

                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  style={{ ...inputStyle, width: "140px" }}
                />
                <span style={{ fontSize: "0.85rem", color: C.muted, fontWeight: 600 }}>to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  style={{ ...inputStyle, width: "140px" }}
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

              <div style={{ fontSize: "0.8rem", color: C.muted }}>
                Shift: <strong>10:00 AM – 06:30 PM</strong> (15m grace)
              </div>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["Date", "Employee", "Role", "Check In", "Check Out", "Total Hours", "Status", "Admin Override"].map((col) => (
                      <th key={col} style={thStyle}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loadingTeam ? (
                    <tr>
                      <td colSpan={8} style={{ ...tdStyle, textAlign: "center", color: C.muted, padding: "2.5rem" }}>
                        Loading attendance records…
                      </td>
                    </tr>
                  ) : filteredTeamRecords.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ ...tdStyle, textAlign: "center", color: C.muted, padding: "2.5rem" }}>
                        No records found for this date range.
                      </td>
                    </tr>
                  ) : (
                    filteredTeamRecords.map((r, idx) => {
                      const badge = statusBadge(r.status, r.lateMinutes);
                      return (
                        <tr
                          key={r.id || idx}
                          style={{ transition: "background 0.15s" }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "#F9FAFB")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                        >
                          <td style={tdStyle}>{r.date}</td>
                          <td style={{ ...tdStyle, fontWeight: 600 }}>{r.user?.name || "—"}</td>
                          <td style={{ ...tdStyle, color: C.muted, textTransform: "capitalize" }}>
                            {r.user?.role?.toLowerCase() || "—"}
                          </td>
                          <td style={tdStyle}>
                            {r.timeIn && r.timeIn !== "--" ? (
                              <span style={{ fontWeight: 600 }}>
                                {r.timeIn}{" "}
                                {r.mobileLoginTime ? (
                                  <span style={{ fontSize: "0.72rem", color: C.primary }}>📱</span>
                                ) : (
                                  <span style={{ fontSize: "0.72rem", color: C.success }}>💻</span>
                                )}
                              </span>
                            ) : (
                              <span style={{ color: C.muted }}>—</span>
                            )}
                          </td>
                          <td style={tdStyle}>
                            {r.timeOut && r.timeOut !== "--" ? (
                              <span style={{ fontWeight: 600 }}>{r.timeOut}</span>
                            ) : (
                              <span style={{ color: C.muted }}>Active</span>
                            )}
                          </td>
                          <td style={{ ...tdStyle, fontWeight: 600 }}>
                            {r.totalHours ? `${r.totalHours} hrs` : "—"}
                          </td>
                          <td style={tdStyle}>
                            <span
                              style={{
                                display: "inline-block",
                                padding: "0.25rem 0.65rem",
                                borderRadius: C.radiusPill,
                                fontSize: "0.75rem",
                                fontWeight: 700,
                                ...badge.style,
                              }}
                            >
                              {badge.label}
                            </span>
                          </td>
                          <td style={tdStyle}>
                            <select
                              value={r.status}
                              onChange={async (e) => {
                                const newStatus = e.target.value;
                                if (!confirm(`Update status of ${r.user?.name} to ${newStatus}?`)) return;
                                try {
                                  await fetch("/api/attendance/update", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({
                                      adminId: user.id,
                                      recordId: r.id,
                                      status: newStatus,
                                    }),
                                  });
                                  fetchTeamAttendance();
                                } catch (err) {
                                  console.error(err);
                                }
                              }}
                              style={{
                                padding: "0.3rem 0.6rem",
                                border: `1px solid ${C.border}`,
                                borderRadius: C.radiusSm,
                                fontSize: "0.78rem",
                                background: "#F9FAFB",
                                outline: "none",
                                cursor: "pointer",
                              }}
                            >
                              <option value="Present">Present</option>
                              <option value="Late">Late</option>
                              <option value="Half Day">Half Day</option>
                              <option value="On Leave">On Leave</option>
                              <option value="WFH">WFH</option>
                              <option value="Absent">Absent</option>
                            </select>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* TAB 2: MY ATTENDANCE (EMPLOYEE CLOCK) */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {tab === "my_att" && !isAdmin && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "1.5rem", alignItems: "start" }}>
          {/* History Log */}
          <div style={cardStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <h2 style={{ fontSize: "1rem", fontWeight: 700, color: C.text, margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <CalendarDays size={18} color={C.primary} /> My 30-Day Attendance Register
              </h2>
              <button
                onClick={fetchMyAttendance}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.3rem",
                  padding: "0.35rem 0.75rem",
                  border: `1px solid ${C.border}`,
                  borderRadius: C.radiusSm,
                  background: "#fff",
                  fontSize: "0.8rem",
                  cursor: "pointer",
                }}
              >
                <RefreshCw size={13} /> Refresh
              </button>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["Date", "Check In", "Check Out", "Total Hours", "Status"].map((col) => (
                      <th key={col} style={thStyle}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loadingMyHistory ? (
                    <tr>
                      <td colSpan={5} style={{ ...tdStyle, textAlign: "center", color: C.muted, padding: "2rem" }}>
                        Loading…
                      </td>
                    </tr>
                  ) : myHistory.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ ...tdStyle, textAlign: "center", color: C.muted, padding: "2rem" }}>
                        No punch history found.
                      </td>
                    </tr>
                  ) : (
                    myHistory.map((r, idx) => {
                      const badge = statusBadge(r.status, r.lateMinutes);
                      return (
                        <tr key={idx} style={{ transition: "background 0.15s" }}>
                          <td style={{ ...tdStyle, fontWeight: 500 }}>{r.date}</td>
                          <td style={tdStyle}>{r.timeIn || "—"}</td>
                          <td style={tdStyle}>{r.timeOut || "Active"}</td>
                          <td style={{ ...tdStyle, fontWeight: 600 }}>{r.totalHours ? `${r.totalHours} hrs` : "—"}</td>
                          <td style={tdStyle}>
                            <span
                              style={{
                                display: "inline-block",
                                padding: "0.25rem 0.65rem",
                                borderRadius: C.radiusPill,
                                fontSize: "0.75rem",
                                fontWeight: 700,
                                ...badge.style,
                              }}
                            >
                              {badge.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Punch In Card */}
          <div style={{ ...cardStyle, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "2rem 1.5rem" }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                background: "#EFF6FF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "1rem",
              }}
            >
              <Clock size={28} color={C.primary} />
            </div>

            <h3
              style={{
                fontSize: "2.2rem",
                fontWeight: 800,
                fontFamily: "monospace",
                color: C.text,
                margin: "0 0 0.35rem 0",
                letterSpacing: "0.04em",
              }}
            >
              {currentTime || "--:--:--"}
            </h3>
            <p style={{ fontSize: "0.8rem", color: C.muted, marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
              <MapPin size={13} /> South Extension Part 1, New Delhi (IST)
            </p>

            <div
              style={{
                width: "100%",
                padding: "0.75rem 1rem",
                background: "#F9FAFB",
                border: `1px solid ${C.border}`,
                borderRadius: C.radiusSm,
                marginBottom: "1.25rem",
                fontSize: "0.8rem",
                color: C.muted,
                textAlign: "left",
              }}
            >
              <div>Shift Start: <strong>10:00 AM</strong></div>
              <div>Grace Period: <strong>Until 10:15 AM</strong></div>
              <div>Shift End: <strong>06:30 PM</strong></div>
            </div>

            {isCheckedIn ? (
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
                  <p style={{ color: "#059669", fontWeight: 700, fontSize: "0.875rem", margin: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem" }}>
                    <CheckCircle2 size={16} /> Checked In at {checkInTime}
                  </p>
                </div>
                <button
                  onClick={handlePunchToggle}
                  disabled={attendanceBusy}
                  style={{
                    width: "100%",
                    padding: "0.9rem",
                    borderRadius: C.radiusSm,
                    border: "none",
                    cursor: "pointer",
                    background: C.danger,
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: "0.95rem",
                  }}
                >
                  {attendanceBusy ? "Checking Out…" : "Check Out Now"}
                </button>
              </div>
            ) : (
              <button
                onClick={handlePunchToggle}
                disabled={attendanceBusy}
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
                {attendanceBusy ? "Checking In…" : "Mark Check In"}
              </button>
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* TAB 3: MONTHLY SUMMARY (ADMIN) */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {tab === "monthly" && isAdmin && (
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.75rem" }}>
            <h2 style={{ fontSize: "1rem", fontWeight: 700, color: C.text, margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <CalendarDays size={18} color={C.primary} /> Monthly Attendance &amp; Lateness Audit
            </h2>
            <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
              <input
                type="month"
                value={monthlyMonth}
                onChange={(e) => setMonthlyMonth(e.target.value)}
                style={{ ...inputStyle, width: "160px" }}
              />
              <button
                onClick={fetchMonthly}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  padding: "0.45rem 0.85rem",
                  border: `1px solid ${C.border}`,
                  borderRadius: C.radiusSm,
                  background: "#fff",
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
                  {["Employee", "Role", "Present", "Late Days", "Late Minutes", "Half Days", "On Leave", "WFH", "Total Days"].map((col) => (
                    <th key={col} style={thStyle}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loadingMonthly ? (
                  <tr>
                    <td colSpan={9} style={{ ...tdStyle, textAlign: "center", color: C.muted, padding: "2.5rem" }}>
                      Loading summary…
                    </td>
                  </tr>
                ) : monthlyRecords.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ ...tdStyle, textAlign: "center", color: C.muted, padding: "2.5rem" }}>
                      No records for {monthlyMonth}.
                    </td>
                  </tr>
                ) : (
                  monthlyRecords.map((r: any) => (
                    <tr
                      key={r.userId}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#F9FAFB")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      style={{ transition: "background 0.15s" }}
                    >
                      <td style={{ ...tdStyle, fontWeight: 600 }}>{r.userName}</td>
                      <td style={{ ...tdStyle, color: C.muted, textTransform: "capitalize" }}>{r.role?.toLowerCase()}</td>
                      <td style={{ ...tdStyle, color: C.success, fontWeight: 700 }}>{r.present}</td>
                      <td style={{ ...tdStyle, color: C.warning, fontWeight: 700 }}>{r.late}</td>
                      <td style={{ ...tdStyle, color: r.totalLateMinutes > 0 ? C.warning : C.muted }}>
                        {r.totalLateMinutes ? `${r.totalLateMinutes}m` : "0m"}
                      </td>
                      <td style={{ ...tdStyle, color: C.orange, fontWeight: 700 }}>{r.halfDay}</td>
                      <td style={{ ...tdStyle, color: C.primary, fontWeight: 700 }}>{r.onLeave || 0}</td>
                      <td style={{ ...tdStyle, color: C.purple, fontWeight: 700 }}>{r.wfh || 0}</td>
                      <td style={{ ...tdStyle, fontWeight: 700 }}>{r.totalTracked}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* TAB 4: LEAVE MANAGEMENT (ALL ROLES) */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {tab === "leaves" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {/* Quota Balance Cards (Displayed for Employees or selected user) */}
          {!isAdmin && leavesData.length > 0 && leavesData[0].balances && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem" }}>
              <div style={cardStyle}>
                <p style={{ fontSize: "0.78rem", color: C.muted, fontWeight: 700, margin: "0 0 0.35rem 0", textTransform: "uppercase" }}>
                  Casual Leave (CL)
                </p>
                <div style={{ fontSize: "1.75rem", fontWeight: 800, color: C.primary }}>
                  {leavesData[0].balances.remaining.casual}{" "}
                  <span style={{ fontSize: "0.9rem", color: C.muted }}>/ {leavesData[0].balances.quotas.CASUAL}</span>
                </div>
                <p style={{ fontSize: "0.75rem", color: C.muted, margin: "0.3rem 0 0 0" }}>
                  Used: {leavesData[0].balances.used.casual} days
                </p>
              </div>

              <div style={cardStyle}>
                <p style={{ fontSize: "0.78rem", color: C.muted, fontWeight: 700, margin: "0 0 0.35rem 0", textTransform: "uppercase" }}>
                  Sick Leave (SL)
                </p>
                <div style={{ fontSize: "1.75rem", fontWeight: 800, color: C.warning }}>
                  {leavesData[0].balances.remaining.sick}{" "}
                  <span style={{ fontSize: "0.9rem", color: C.muted }}>/ {leavesData[0].balances.quotas.SICK}</span>
                </div>
                <p style={{ fontSize: "0.75rem", color: C.muted, margin: "0.3rem 0 0 0" }}>
                  Used: {leavesData[0].balances.used.sick} days
                </p>
              </div>

              <div style={cardStyle}>
                <p style={{ fontSize: "0.78rem", color: C.muted, fontWeight: 700, margin: "0 0 0.35rem 0", textTransform: "uppercase" }}>
                  Paid Leave (PL)
                </p>
                <div style={{ fontSize: "1.75rem", fontWeight: 800, color: C.success }}>
                  {leavesData[0].balances.remaining.paid}{" "}
                  <span style={{ fontSize: "0.9rem", color: C.muted }}>/ {leavesData[0].balances.quotas.PAID}</span>
                </div>
                <p style={{ fontSize: "0.75rem", color: C.muted, margin: "0.3rem 0 0 0" }}>
                  Used: {leavesData[0].balances.used.paid} days
                </p>
              </div>

              <div style={cardStyle}>
                <p style={{ fontSize: "0.78rem", color: C.muted, fontWeight: 700, margin: "0 0 0.35rem 0", textTransform: "uppercase" }}>
                  Work From Home (WFH)
                </p>
                <div style={{ fontSize: "1.75rem", fontWeight: 800, color: C.purple }}>
                  {leavesData[0].balances.remaining.wfh}{" "}
                  <span style={{ fontSize: "0.9rem", color: C.muted }}>/ {leavesData[0].balances.quotas.WFH}</span>
                </div>
                <p style={{ fontSize: "0.75rem", color: C.muted, margin: "0.3rem 0 0 0" }}>
                  Used: {leavesData[0].balances.used.wfh} days
                </p>
              </div>
            </div>
          )}

          {/* Leaves Table */}
          <div style={cardStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.75rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <h2 style={{ fontSize: "1rem", fontWeight: 700, color: C.text, margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <FileText size={18} color={C.primary} />
                  {isAdmin ? "Team Leave Applications" : "My Leave History"}
                </h2>

                <select
                  value={leaveStatusFilter}
                  onChange={(e) => setLeaveStatusFilter(e.target.value)}
                  style={{
                    padding: "0.35rem 0.65rem",
                    border: `1px solid ${C.border}`,
                    borderRadius: C.radiusSm,
                    fontSize: "0.8rem",
                    color: C.text,
                    background: "#fff",
                    outline: "none",
                  }}
                >
                  <option value="ALL">All Statuses</option>
                  <option value="Pending">Pending Only</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              <div style={{ display: "flex", gap: "0.5rem" }}>
                {!isAdmin && (
                  <button
                    onClick={() => setShowApplyLeaveModal(true)}
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

                <button
                  onClick={fetchLeaves}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.3rem",
                    padding: "0.45rem 0.75rem",
                    border: `1px solid ${C.border}`,
                    borderRadius: C.radiusSm,
                    background: "#fff",
                    color: C.text,
                    fontWeight: 600,
                    fontSize: "0.8rem",
                    cursor: "pointer",
                  }}
                >
                  <RefreshCw size={13} /> Refresh
                </button>
              </div>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {[
                      ...(isAdmin ? ["Employee"] : []),
                      "Dates",
                      "Type",
                      "Reason",
                      "Status",
                      "Notes",
                      ...(isAdmin ? ["Actions"] : []),
                    ].map((col) => (
                      <th key={col} style={thStyle}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loadingLeaves ? (
                    <tr>
                      <td colSpan={isAdmin ? 7 : 5} style={{ ...tdStyle, textAlign: "center", color: C.muted, padding: "2.5rem" }}>
                        Loading requests…
                      </td>
                    </tr>
                  ) : leavesData.reduce((acc, u) => acc + (u.requests?.length || 0), 0) === 0 ? (
                    <tr>
                      <td colSpan={isAdmin ? 7 : 5} style={{ ...tdStyle, textAlign: "center", color: C.muted, padding: "2.5rem" }}>
                        No leave requests found.
                      </td>
                    </tr>
                  ) : (
                    leavesData
                      .map((u) =>
                        (u.requests || []).map((req: any) => {
                          const isPending = req.status === "Pending";
                          const isApproved = req.status === "Approved";
                          const isRejected = req.status === "Rejected";

                          return (
                            <tr
                              key={req.id}
                              style={{ transition: "background 0.15s" }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = "#F9FAFB")}
                              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                            >
                              {isAdmin && (
                                <td style={{ ...tdStyle, fontWeight: 600 }}>{u.user.name}</td>
                              )}
                              <td style={tdStyle}>
                                {req.startDate} {req.startDate !== req.endDate ? `→ ${req.endDate}` : ""}
                              </td>
                              <td style={{ ...tdStyle, fontWeight: 600, color: C.primary }}>
                                {req.type}
                              </td>
                              <td style={{ ...tdStyle, maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {req.reason}
                              </td>
                              <td style={tdStyle}>
                                <span
                                  style={{
                                    display: "inline-block",
                                    padding: "0.25rem 0.65rem",
                                    borderRadius: C.radiusPill,
                                    fontSize: "0.75rem",
                                    fontWeight: 700,
                                    background: isApproved ? "#ECFDF5" : isRejected ? "#FEF2F2" : "#FFFBEB",
                                    color: isApproved ? "#059669" : isRejected ? "#DC2626" : "#D97706",
                                  }}
                                >
                                  {req.status}
                                </span>
                              </td>
                              <td style={{ ...tdStyle, color: C.muted, fontSize: "0.8rem" }}>
                                {req.adminNotes || "—"}
                              </td>
                              {isAdmin && (
                                <td style={tdStyle}>
                                  {isPending ? (
                                    <div style={{ display: "flex", gap: "0.4rem" }}>
                                      <button
                                        onClick={() => handleAdminLeaveReview(req.id, "Approved")}
                                        style={{
                                          padding: "0.3rem 0.65rem",
                                          background: "#ECFDF5",
                                          color: "#059669",
                                          border: "1px solid #A7F3D0",
                                          borderRadius: C.radiusSm,
                                          fontSize: "0.78rem",
                                          fontWeight: 700,
                                          cursor: "pointer",
                                        }}
                                      >
                                        ✓ Approve
                                      </button>
                                      <button
                                        onClick={() => setRejectRemarkModal({ id: req.id, name: u.user.name })}
                                        style={{
                                          padding: "0.3rem 0.65rem",
                                          background: "#FEF2F2",
                                          color: "#DC2626",
                                          border: "1px solid #FECACA",
                                          borderRadius: C.radiusSm,
                                          fontSize: "0.78rem",
                                          fontWeight: 700,
                                          cursor: "pointer",
                                        }}
                                      >
                                        ✕ Reject
                                      </button>
                                    </div>
                                  ) : (
                                    <span style={{ fontSize: "0.78rem", color: C.muted }}>Reviewed</span>
                                  )}
                                </td>
                              )}
                            </tr>
                          );
                        })
                      )
                      .flat()
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* TAB 5: OVERTIME (OT) MANAGEMENT (ALL ROLES) */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {tab === "overtime" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {/* Overtime Metric Summary Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
            <div style={cardStyle}>
              <p style={{ fontSize: "0.78rem", color: C.muted, fontWeight: 700, margin: "0 0 0.35rem 0", textTransform: "uppercase" }}>
                Approved OT Hours
              </p>
              <div style={{ fontSize: "1.85rem", fontWeight: 800, color: C.success }}>
                {otSummary?.totalApprovedHours || 0}{" "}
                <span style={{ fontSize: "0.95rem", color: C.muted }}>hrs</span>
              </div>
              <p style={{ fontSize: "0.75rem", color: C.muted, margin: "0.3rem 0 0 0" }}>
                Ready for payroll in {otMonth}
              </p>
            </div>

            <div style={cardStyle}>
              <p style={{ fontSize: "0.78rem", color: C.muted, fontWeight: 700, margin: "0 0 0.35rem 0", textTransform: "uppercase" }}>
                Pending Reviews
              </p>
              <div style={{ fontSize: "1.85rem", fontWeight: 800, color: C.warning }}>
                {otSummary?.pendingCount || 0}
              </div>
              <p style={{ fontSize: "0.75rem", color: C.muted, margin: "0.3rem 0 0 0" }}>Awaiting admin approval</p>
            </div>

            <div style={cardStyle}>
              <p style={{ fontSize: "0.78rem", color: C.muted, fontWeight: 700, margin: "0 0 0.35rem 0", textTransform: "uppercase" }}>
                Total Submissions
              </p>
              <div style={{ fontSize: "1.85rem", fontWeight: 800, color: C.primary }}>
                {otSummary?.totalRequests || 0}
              </div>
              <p style={{ fontSize: "0.75rem", color: C.muted, margin: "0.3rem 0 0 0" }}>Requests logged this month</p>
            </div>
          </div>

          {/* Overtime Table */}
          <div style={cardStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.75rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <h2 style={{ fontSize: "1rem", fontWeight: 700, color: C.text, margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Briefcase size={18} color={C.primary} />
                  {isAdmin ? "Team Overtime Logs" : "My Overtime Logs"}
                </h2>

                <input
                  type="month"
                  value={otMonth}
                  onChange={(e) => setOtMonth(e.target.value)}
                  style={{ ...inputStyle, width: "150px" }}
                />
              </div>

              <div style={{ display: "flex", gap: "0.5rem" }}>
                {!isAdmin && (
                  <button
                    onClick={() => setShowOtModal(true)}
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
                    + Request Overtime
                  </button>
                )}

                <button
                  onClick={fetchOvertime}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.3rem",
                    padding: "0.45rem 0.75rem",
                    border: `1px solid ${C.border}`,
                    borderRadius: C.radiusSm,
                    background: "#fff",
                    fontSize: "0.8rem",
                    cursor: "pointer",
                  }}
                >
                  <RefreshCw size={13} /> Refresh
                </button>
              </div>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {[
                      "Date",
                      ...(isAdmin ? ["Employee"] : []),
                      "Hours",
                      "Project / Job",
                      "Justification",
                      "Status",
                      "Admin Note",
                      ...(isAdmin ? ["Actions"] : []),
                    ].map((col) => (
                      <th key={col} style={thStyle}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loadingOt ? (
                    <tr>
                      <td colSpan={isAdmin ? 8 : 6} style={{ ...tdStyle, textAlign: "center", color: C.muted, padding: "2.5rem" }}>
                        Loading overtime records…
                      </td>
                    </tr>
                  ) : otRequests.length === 0 ? (
                    <tr>
                      <td colSpan={isAdmin ? 8 : 6} style={{ ...tdStyle, textAlign: "center", color: C.muted, padding: "2.5rem" }}>
                        No overtime requests recorded for {otMonth}.
                      </td>
                    </tr>
                  ) : (
                    otRequests.map((ot) => {
                      const isPending = ot.status === "PENDING";
                      const isApproved = ot.status === "APPROVED";
                      const isRejected = ot.status === "REJECTED";

                      return (
                        <tr
                          key={ot.id}
                          style={{ transition: "background 0.15s" }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "#F9FAFB")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                        >
                          <td style={tdStyle}>{ot.date}</td>
                          {isAdmin && (
                            <td style={{ ...tdStyle, fontWeight: 600 }}>{ot.user?.name || "—"}</td>
                          )}
                          <td style={{ ...tdStyle, fontWeight: 700, color: C.primary }}>
                            {ot.approvedHours ? `${ot.approvedHours}h (appr)` : `${ot.hours}h`}
                          </td>
                          <td style={{ ...tdStyle, fontWeight: 600 }}>{ot.taskOrJobTitle}</td>
                          <td style={{ ...tdStyle, maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {ot.reason}
                          </td>
                          <td style={tdStyle}>
                            <span
                              style={{
                                display: "inline-block",
                                padding: "0.25rem 0.65rem",
                                borderRadius: C.radiusPill,
                                fontSize: "0.75rem",
                                fontWeight: 700,
                                background: isApproved ? "#ECFDF5" : isRejected ? "#FEF2F2" : "#FFFBEB",
                                color: isApproved ? "#059669" : isRejected ? "#DC2626" : "#D97706",
                              }}
                            >
                              {ot.status}
                            </span>
                          </td>
                          <td style={{ ...tdStyle, color: C.muted, fontSize: "0.8rem" }}>
                            {ot.adminNotes || "—"}
                          </td>
                          {isAdmin && (
                            <td style={tdStyle}>
                              {isPending ? (
                                <button
                                  onClick={() => {
                                    setOtReviewModal(ot);
                                    setApprovedHoursInput(String(ot.hours));
                                    setOtAdminNotes("");
                                  }}
                                  style={{
                                    padding: "0.3rem 0.75rem",
                                    background: C.primary,
                                    color: "#fff",
                                    border: "none",
                                    borderRadius: C.radiusSm,
                                    fontSize: "0.78rem",
                                    fontWeight: 700,
                                    cursor: "pointer",
                                  }}
                                >
                                  Review
                                </button>
                              ) : (
                                <span style={{ fontSize: "0.78rem", color: C.muted }}>Settled</span>
                              )}
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
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* TAB 6: POLICY & RULES (ADMIN) */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {tab === "policy" && isAdmin && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
          <div style={cardStyle}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: C.text, margin: "0 0 1rem 0", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Sliders size={18} color={C.primary} /> Workspace Shift &amp; Grace Policy
            </h2>
            <p style={{ fontSize: "0.85rem", color: C.muted, marginBottom: "1.5rem" }}>
              Configure company timings and automatic lateness rules. Punches beyond the grace period are automatically flagged as Late.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: C.muted, marginBottom: "0.35rem" }}>
                    Office Start Time
                  </label>
                  <input
                    type="time"
                    value={policy.workStartTime}
                    onChange={(e) => setPolicy({ ...policy, workStartTime: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: C.muted, marginBottom: "0.35rem" }}>
                    Office End Time
                  </label>
                  <input
                    type="time"
                    value={policy.workEndTime}
                    onChange={(e) => setPolicy({ ...policy, workEndTime: e.target.value })}
                    style={inputStyle}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: C.muted, marginBottom: "0.35rem" }}>
                  Lateness Grace Period (Minutes)
                </label>
                <select
                  value={policy.lateGrace}
                  onChange={(e) => setPolicy({ ...policy, lateGrace: parseInt(e.target.value) })}
                  style={inputStyle}
                >
                  <option value={0}>0 minutes (Strict 10:00 AM)</option>
                  <option value={5}>5 minutes grace</option>
                  <option value={10}>10 minutes grace</option>
                  <option value={15}>15 minutes grace (Recommended: 10:15 AM)</option>
                  <option value={30}>30 minutes grace</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: C.muted, marginBottom: "0.35rem" }}>
                  Late Penalty Threshold
                </label>
                <select
                  value={policy.latePenalty}
                  onChange={(e) => setPolicy({ ...policy, latePenalty: parseInt(e.target.value) })}
                  style={inputStyle}
                >
                  <option value={0}>Disabled</option>
                  <option value={3}>3 Late Days = 1 Half-Day Deduction</option>
                  <option value={4}>4 Late Days = 1 Half-Day Deduction</option>
                  <option value={5}>5 Late Days = 1 Full-Day Deduction</option>
                </select>
              </div>

              <button
                onClick={handleSavePolicy}
                style={{
                  padding: "0.75rem",
                  background: policySaved ? C.success : C.primary,
                  color: "#fff",
                  border: "none",
                  borderRadius: C.radiusSm,
                  fontWeight: 700,
                  fontSize: "0.9rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.4rem",
                }}
              >
                {policySaved ? <><Check size={16} /> Policy Saved Successfully!</> : "Save Policy"}
              </button>
            </div>
          </div>

          <div style={cardStyle}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: C.text, margin: "0 0 1rem 0" }}>
              Enforced Policy Reference
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", fontSize: "0.875rem", color: C.text }}>
              <div style={{ padding: "0.85rem", background: "#F9FAFB", borderRadius: C.radiusSm, border: `1px solid ${C.border}` }}>
                <strong style={{ color: C.primary }}>1. Shift Schedule:</strong>
                <p style={{ margin: "0.25rem 0 0", color: C.muted }}>
                  Scheduled 8.5-hour workday ({policy.workStartTime} AM to {policy.workEndTime} PM) with 30-min break.
                </p>
              </div>

              <div style={{ padding: "0.85rem", background: "#F9FAFB", borderRadius: C.radiusSm, border: `1px solid ${C.border}` }}>
                <strong style={{ color: C.warning }}>2. Automatic Late Mark:</strong>
                <p style={{ margin: "0.25rem 0 0", color: C.muted }}>
                  Any punch received after {policy.workStartTime} + {policy.lateGrace}m is automatically classified as <strong>Late</strong> and logs the exact delayed minutes.
                </p>
              </div>

              <div style={{ padding: "0.85rem", background: "#F9FAFB", borderRadius: C.radiusSm, border: `1px solid ${C.border}` }}>
                <strong style={{ color: C.orange }}>3. Half-Day Rule:</strong>
                <p style={{ margin: "0.25rem 0 0", color: C.muted }}>
                  Arrivals past 01:30 PM or shifts with total duration under 4.5 productive hours automatically convert to a <strong>Half Day</strong>.
                </p>
              </div>

              <div style={{ padding: "0.85rem", background: "#F9FAFB", borderRadius: C.radiusSm, border: `1px solid ${C.border}` }}>
                <strong style={{ color: C.success }}>4. Admin Exemption:</strong>
                <p style={{ margin: "0.25rem 0 0", color: C.muted }}>
                  Administrators and company owners are completely exempt from time logging, PC tracking, and attendance penalties.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* MODAL: APPLY FOR LEAVE */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {showApplyLeaveModal && (
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
          <div style={{ ...cardStyle, width: "100%", maxWidth: 440, padding: "2rem", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h3 style={{ fontSize: "1.125rem", fontWeight: 700, color: C.text, margin: 0 }}>
                Apply for Leave
              </h3>
              <button onClick={() => setShowApplyLeaveModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: C.muted }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleApplyLeave} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: C.muted, marginBottom: "0.35rem" }}>
                  Leave Type
                </label>
                <select
                  value={leaveForm.type}
                  onChange={(e) => setLeaveForm({ ...leaveForm, type: e.target.value })}
                  style={inputStyle}
                >
                  <option value="Casual Leave (CL)">🌴 Casual Leave (CL)</option>
                  <option value="Sick Leave (SL)">🩺 Sick Leave (SL)</option>
                  <option value="Paid Leave (PL)">💼 Paid Leave (PL)</option>
                  <option value="Half Day">🌓 Half Day</option>
                  <option value="Work From Home (WFH)">🏠 Work From Home (WFH)</option>
                  <option value="Unpaid Leave (LWP)">Unpaid Leave (LWP)</option>
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: C.muted, marginBottom: "0.35rem" }}>
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={leaveForm.startDate}
                    onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                    style={inputStyle}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: C.muted, marginBottom: "0.35rem" }}>
                    End Date
                  </label>
                  <input
                    type="date"
                    value={leaveForm.endDate}
                    onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                    style={inputStyle}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: C.muted, marginBottom: "0.35rem" }}>
                  Reason / Handover Notes
                </label>
                <textarea
                  rows={3}
                  value={leaveForm.reason}
                  onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                  placeholder="Reason for requesting time off..."
                  style={{ ...inputStyle, resize: "vertical" }}
                  required
                />
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
                }}
              >
                Submit Application
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* MODAL: REJECT LEAVE WITH NOTES (ADMIN) */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {rejectRemarkModal && (
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
          <div style={{ ...cardStyle, width: "100%", maxWidth: 400, padding: "1.75rem", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: C.text, margin: "0 0 0.5rem 0" }}>
              Reject Leave Request
            </h3>
            <p style={{ fontSize: "0.85rem", color: C.muted, marginBottom: "1rem" }}>
              Provide a brief explanation to <strong>{rejectRemarkModal.name}</strong> for declining this request.
            </p>
            <textarea
              rows={3}
              value={rejectRemark}
              onChange={(e) => setRejectRemark(e.target.value)}
              placeholder="e.g. Critical project deadline, please reschedule."
              style={{ ...inputStyle, resize: "vertical", marginBottom: "1rem" }}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
              <button
                onClick={() => setRejectRemarkModal(null)}
                style={{
                  padding: "0.5rem 0.85rem",
                  border: `1px solid ${C.border}`,
                  borderRadius: C.radiusSm,
                  background: "#fff",
                  fontSize: "0.85rem",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleAdminLeaveReview(rejectRemarkModal.id, "Rejected", rejectRemark)}
                style={{
                  padding: "0.5rem 1rem",
                  border: "none",
                  borderRadius: C.radiusSm,
                  background: C.danger,
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  cursor: "pointer",
                }}
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* MODAL: REQUEST OVERTIME (EMPLOYEE) */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {showOtModal && (
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
          <div style={{ ...cardStyle, width: "100%", maxWidth: 440, padding: "2rem", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h3 style={{ fontSize: "1.125rem", fontWeight: 700, color: C.text, margin: 0 }}>
                Request Overtime (OT)
              </h3>
              <button onClick={() => setShowOtModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: C.muted }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleRequestOvertime} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: C.muted, marginBottom: "0.35rem" }}>
                    Date Worked
                  </label>
                  <input
                    type="date"
                    value={otForm.date}
                    onChange={(e) => setOtForm({ ...otForm, date: e.target.value })}
                    style={inputStyle}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: C.muted, marginBottom: "0.35rem" }}>
                    Overtime Hours
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="16"
                    value={otForm.hours}
                    onChange={(e) => setOtForm({ ...otForm, hours: e.target.value })}
                    style={inputStyle}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: C.muted, marginBottom: "0.35rem" }}>
                  Project / Job Worked On
                </label>
                <input
                  type="text"
                  placeholder="e.g. ED-1002 Wedding Editing or Rush Campaign"
                  value={otForm.taskOrJobTitle}
                  onChange={(e) => setOtForm({ ...otForm, taskOrJobTitle: e.target.value })}
                  style={inputStyle}
                  required
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: C.muted, marginBottom: "0.35rem" }}>
                  Justification / Deliverables Done
                </label>
                <textarea
                  rows={3}
                  placeholder="Explain work performed beyond regular 06:30 PM shift..."
                  value={otForm.reason}
                  onChange={(e) => setOtForm({ ...otForm, reason: e.target.value })}
                  style={{ ...inputStyle, resize: "vertical" }}
                  required
                />
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
                }}
              >
                Submit OT Request
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* MODAL: ADMIN REVIEW OVERTIME */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {otReviewModal && (
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
          <div style={{ ...cardStyle, width: "100%", maxWidth: 420, padding: "2rem", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <h3 style={{ fontSize: "1.125rem", fontWeight: 700, color: C.text, margin: 0 }}>
                Review Overtime Request
              </h3>
              <button onClick={() => setOtReviewModal(null)} style={{ background: "none", border: "none", cursor: "pointer", color: C.muted }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ fontSize: "0.875rem", marginBottom: "1.25rem", color: C.text }}>
              <div>Employee: <strong>{otReviewModal.user?.name}</strong></div>
              <div>Date: <strong>{otReviewModal.date}</strong></div>
              <div>Project: <strong>{otReviewModal.taskOrJobTitle}</strong></div>
              <div>Reason: <em>"{otReviewModal.reason}"</em></div>
              <div style={{ marginTop: "0.5rem" }}>Requested Hours: <strong>{otReviewModal.hours} hrs</strong></div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: C.muted, marginBottom: "0.35rem" }}>
                  Approved Hours (Adjust if needed)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="16"
                  value={approvedHoursInput}
                  onChange={(e) => setApprovedHoursInput(e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: C.muted, marginBottom: "0.35rem" }}>
                  Admin Remark
                </label>
                <input
                  type="text"
                  placeholder="Optional review notes..."
                  value={otAdminNotes}
                  onChange={(e) => setOtAdminNotes(e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
                <button
                  onClick={() => handleAdminOtReview(otReviewModal.id, "APPROVED")}
                  style={{
                    flex: 1,
                    padding: "0.75rem",
                    background: C.success,
                    color: "#fff",
                    border: "none",
                    borderRadius: C.radiusSm,
                    fontWeight: 700,
                    fontSize: "0.875rem",
                    cursor: "pointer",
                  }}
                >
                  ✓ Approve {approvedHoursInput}h
                </button>
                <button
                  onClick={() => handleAdminOtReview(otReviewModal.id, "REJECTED")}
                  style={{
                    flex: 1,
                    padding: "0.75rem",
                    background: C.danger,
                    color: "#fff",
                    border: "none",
                    borderRadius: C.radiusSm,
                    fontWeight: 700,
                    fontSize: "0.875rem",
                    cursor: "pointer",
                  }}
                >
                  ✕ Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
