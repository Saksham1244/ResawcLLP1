"use client";

import { useState, useEffect } from "react";
import { useRole } from "@/context/RoleContext";
import { RoleGuard } from "@/components/RoleGuard";
import {
  Monitor, AppWindow, AlertTriangle, Clock,
  Download, Laptop, Play, Copy, Check, X,
  Maximize2, Calendar, Search, Layers, TrendingUp, BarChart2
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

// ─── Types ────────────────────────────────────────────────────────────────────
type AppHistoryItem = {
  app: string;
  title: string;
  time: string;
  date?: string;
  timestamp?: string;
  durationSeconds?: number;
};

type PCActivity = {
  id: number | string;
  name: string;
  role: string;
  status: "Active" | "Idle" | "Offline";
  idleTime?: string;
  currentApp: string;
  appTitle: string;
  productivity: number;
  lastScreenshot?: string;
  lastSync?: string;
  appHistory?: AppHistoryItem[];
  dailyAppUsage?: Record<string, number>;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function initials(name: string) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
}

function formatDuration(seconds?: number): string {
  if (!seconds || seconds <= 0) return "< 1m";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${secs}s`;
  return `${secs}s`;
}

function formatHistoryTimestamp(item: AppHistoryItem): string {
  if (item.timestamp) {
    try {
      const d = new Date(item.timestamp);
      if (!isNaN(d.getTime())) {
        const dateStr = d.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
        const timeStr = d.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        });
        return `${dateStr} • ${timeStr}`;
      }
    } catch {}
  }
  if (item.date && item.time) {
    return `${item.date} • ${item.time}`;
  }
  return item.time || "Recent";
}

// ─── Status helpers ───────────────────────────────────────────────────────────
function statusConfig(status: PCActivity["status"]) {
  if (status === "Active")  return { color: "#059669", bg: "#ECFDF5", border: "#A7F3D0" };
  if (status === "Idle")    return { color: "#D97706", bg: "#FFFBEB", border: "#FDE68A" };
  return                           { color: "#9CA3AF", bg: "#F3F4F6", border: "#E5E7EB" };
}

function productivityColor(score: number) {
  if (score >= 70) return { bar: "#059669", track: "#ECFDF5" };
  if (score >= 40) return { bar: "#D97706", track: "#FFFBEB" };
  return                  { bar: "#DC2626", track: "#FEF2F2" };
}

// ─── Agent Card ───────────────────────────────────────────────────────────────
function AgentCard({
  act,
  onExpand,
}: {
  act: PCActivity;
  onExpand: (act: PCActivity) => void;
}) {
  const sc = statusConfig(act.status);
  const pc = productivityColor(act.productivity);

  return (
    <div
      style={{
        background: C.card,
        border: `1px solid ${sc.border}`,
        borderRadius: C.radius,
        overflow: "hidden",
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Card header */}
      <div
        style={{
          padding: "1rem 1.25rem",
          borderBottom: `1px solid ${C.border}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "#FAFAFA",
        }}
      >
        <div>
          <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: C.text, margin: 0 }}>
            {act.name}
          </h3>
          <p
            style={{
              fontSize: "0.72rem",
              fontWeight: 600,
              color: C.muted,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              margin: "0.15rem 0 0 0",
            }}
          >
            {act.role}
          </p>
        </div>

        {/* Status badge */}
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.35rem",
            padding: "0.3rem 0.7rem",
            borderRadius: C.radiusPill,
            fontSize: "0.75rem",
            fontWeight: 700,
            background: sc.bg,
            color: sc.color,
            border: `1px solid ${sc.border}`,
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: sc.color,
              flexShrink: 0,
            }}
          />
          {act.status}
          {act.status === "Idle" && act.idleTime && ` (${act.idleTime})`}
        </span>
      </div>

      {/* Card body */}
      <div
        style={{
          padding: "1.1rem 1.25rem",
          display: "flex",
          flexDirection: "column",
          gap: "1.1rem",
          flex: 1,
        }}
      >
        {/* Focused app */}
        <div>
          <span
            style={{
              fontSize: "0.68rem",
              fontWeight: 700,
              color: C.muted,
              letterSpacing: "0.07em",
              textTransform: "uppercase",
            }}
          >
            {act.status === "Offline" ? "Last Known Application" : "Focused Application"}
          </span>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.6rem",
              marginTop: "0.45rem",
            }}
          >
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: C.radiusSm,
                background: act.status === "Offline" ? "#F3F4F6" : "#EEF2FF",
                color: act.status === "Offline" ? "#9CA3AF" : C.primary,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <AppWindow size={16} />
            </div>
            <div style={{ minWidth: 0 }}>
              <p
                style={{
                  fontWeight: 700,
                  fontSize: "0.875rem",
                  margin: 0,
                  color: act.status === "Offline" ? "#6B7280" : C.text,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {act.currentApp || "No app detected"} {act.status === "Offline" && "(Offline)"}
              </p>
              <p
                style={{
                  fontSize: "0.75rem",
                  color: C.muted,
                  margin: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {act.status === "Offline" && act.lastSync
                  ? `Last synced: ${new Date(act.lastSync).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" })}`
                  : act.appTitle || "—"}
              </p>
            </div>
          </div>
        </div>

        {/* Productivity bar */}
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "0.45rem",
            }}
          >
            <span
              style={{
                fontSize: "0.68rem",
                fontWeight: 700,
                color: C.muted,
                letterSpacing: "0.07em",
                textTransform: "uppercase",
              }}
            >
              Productivity Score
            </span>
            <span
              style={{
                fontSize: "0.875rem",
                fontWeight: 800,
                color: pc.bar,
              }}
            >
              {act.productivity}%
            </span>
          </div>
          <div
            style={{
              width: "100%",
              height: 8,
              borderRadius: C.radiusPill,
              background: pc.track,
              border: `1px solid ${C.border}`,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${act.productivity}%`,
                height: "100%",
                borderRadius: C.radiusPill,
                background: pc.bar,
                transition: "width 0.4s ease",
              }}
            />
          </div>
        </div>

        {/* Card Footer: Expand View button */}
        <div
          style={{
            borderTop: `1px solid ${C.border}`,
            padding: "0.75rem 1.25rem",
            background: "#FAFAFA",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontSize: "0.725rem",
              color: C.muted,
              display: "inline-flex",
              alignItems: "center",
              gap: "0.35rem",
              fontWeight: 500,
            }}
          >
            <Clock size={12} color={C.muted} />
            {act.appHistory?.length || 0} events (7d)
          </span>
          <button
            onClick={() => onExpand(act)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.35rem",
              padding: "0.4rem 0.8rem",
              background: "#FFFFFF",
              border: `1px solid ${C.border}`,
              borderRadius: C.radiusSm,
              color: C.primary,
              fontSize: "0.775rem",
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
              transition: "background-color 0.15s, border-color 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#EFF6FF";
              e.currentTarget.style.borderColor = "#BFDBFE";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#FFFFFF";
              e.currentTarget.style.borderColor = C.border;
            }}
          >
            <Maximize2 size={12} />
            <span>Expand View</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Expanded Activity Detail Modal (7-Day History) ──────────────────────────
function ActivityDetailModal({
  act,
  onClose,
}: {
  act: PCActivity | null;
  onClose: () => void;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"timeline" | "apps">("timeline");

  if (!act) return null;

  const sc = statusConfig(act.status);
  const pc = productivityColor(act.productivity);

  const history = act.appHistory || [];
  const dailyUsage = act.dailyAppUsage || {};

  // Sort daily usage by total seconds descending
  const sortedApps = Object.entries(dailyUsage).sort((a, b) => b[1] - a[1]);
  const totalTrackedSeconds = sortedApps.reduce((acc, curr) => acc + curr[1], 0) || 1;

  // Filter timeline history
  const filteredHistory = history.filter((item) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      item.app.toLowerCase().includes(term) ||
      item.title.toLowerCase().includes(term) ||
      (item.date && item.date.toLowerCase().includes(term))
    );
  });

  const formattedLastSync = act.lastSync
    ? new Date(act.lastSync).toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      })
    : "Never";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(17, 24, 39, 0.55)",
        backdropFilter: "blur(4px)",
        zIndex: 110,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#FFFFFF",
          borderRadius: "14px",
          width: "100%",
          maxWidth: "880px",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          border: "1px solid #E5E7EB",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: "1.25rem 1.5rem",
            borderBottom: "1px solid #E5E7EB",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "#FAFAFA",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #1A56DB, #3B82F6)",
                color: "#FFFFFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: "1rem",
                boxShadow: "0 2px 4px rgba(26,86,219,0.25)",
              }}
            >
              {initials(act.name)}
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <h2 style={{ fontSize: "1.2rem", fontWeight: 700, margin: 0, color: "#111827" }}>
                  {act.name}
                </h2>
                <span
                  style={{
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    padding: "0.2rem 0.5rem",
                    background: "#F1F5F9",
                    color: "#475569",
                    borderRadius: "4px",
                  }}
                >
                  {act.role}
                </span>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.35rem",
                    padding: "0.2rem 0.6rem",
                    borderRadius: "999px",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    background: sc.bg,
                    color: sc.color,
                    border: `1px solid ${sc.border}`,
                  }}
                >
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      background: sc.color,
                    }}
                  />
                  {act.status}
                </span>
              </div>
              <p style={{ fontSize: "0.8rem", color: "#6B7280", margin: "2px 0 0" }}>
                Workstation activity timeline and application telemetry (7-day history)
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
                padding: "0.35rem 0.75rem",
                background: "#ECFDF5",
                border: "1px solid #A7F3D0",
                borderRadius: "999px",
                color: "#059669",
                fontSize: "0.75rem",
                fontWeight: 600,
              }}
            >
              <Calendar size={13} />
              <span>1-Week Retention Active</span>
            </div>
            <button
              onClick={onClose}
              style={{
                background: "none",
                border: "none",
                color: "#9CA3AF",
                cursor: "pointer",
                padding: "6px",
                display: "flex",
                borderRadius: "6px",
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Top Summary Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "0.75rem",
            padding: "1rem 1.5rem",
            background: "#F8FAFC",
            borderBottom: "1px solid #E5E7EB",
          }}
        >
          {/* Active app */}
          <div style={{ background: "#FFFFFF", padding: "0.75rem 1rem", borderRadius: "8px", border: "1px solid #E2E8F0" }}>
            <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>
              Focused App
            </span>
            <p style={{ margin: "4px 0 0", fontWeight: 700, fontSize: "0.925rem", color: "#0F172A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {act.currentApp || "Desktop"}
            </p>
            <p style={{ margin: "2px 0 0", fontSize: "0.75rem", color: "#64748B", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {act.appTitle || "No window title"}
            </p>
          </div>

          {/* Productivity */}
          <div style={{ background: "#FFFFFF", padding: "0.75rem 1rem", borderRadius: "8px", border: "1px solid #E2E8F0" }}>
            <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>
              Productivity Score
            </span>
            <p style={{ margin: "4px 0 0", fontWeight: 800, fontSize: "1.1rem", color: pc.bar }}>
              {act.productivity}%
            </p>
            <div style={{ width: "100%", height: 5, borderRadius: 999, background: pc.track, marginTop: 4, overflow: "hidden" }}>
              <div style={{ width: `${act.productivity}%`, height: "100%", background: pc.bar }} />
            </div>
          </div>

          {/* Tracked Active Duration */}
          <div style={{ background: "#FFFFFF", padding: "0.75rem 1rem", borderRadius: "8px", border: "1px solid #E2E8F0" }}>
            <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>
              Time Tracked (7 Days)
            </span>
            <p style={{ margin: "4px 0 0", fontWeight: 700, fontSize: "0.925rem", color: "#0F172A" }}>
              {formatDuration(totalTrackedSeconds)}
            </p>
            <p style={{ margin: "2px 0 0", fontSize: "0.75rem", color: "#64748B" }}>
              Idle: {act.idleTime || "0m 0s"}
            </p>
          </div>

          {/* Last Synchronized */}
          <div style={{ background: "#FFFFFF", padding: "0.75rem 1rem", borderRadius: "8px", border: "1px solid #E2E8F0" }}>
            <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>
              Last Heartbeat
            </span>
            <p style={{ margin: "4px 0 0", fontWeight: 600, fontSize: "0.825rem", color: "#0F172A" }}>
              {formattedLastSync}
            </p>
            <p style={{ margin: "2px 0 0", fontSize: "0.725rem", color: act.status === "Active" ? "#059669" : "#64748B" }}>
              {act.status === "Active" ? "● Streaming Live" : "Offline"}
            </p>
          </div>
        </div>

        {/* Tab Selection */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "0 1.5rem",
            borderBottom: "1px solid #E5E7EB",
            background: "#FFFFFF",
          }}
        >
          <button
            onClick={() => setActiveTab("timeline")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.45rem",
              padding: "0.85rem 1rem",
              background: "none",
              border: "none",
              borderBottom: activeTab === "timeline" ? "2px solid #1A56DB" : "2px solid transparent",
              color: activeTab === "timeline" ? "#1A56DB" : "#64748B",
              fontSize: "0.85rem",
              fontWeight: activeTab === "timeline" ? 700 : 500,
              cursor: "pointer",
            }}
          >
            <Clock size={15} />
            <span>Activity Timeline ({history.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("apps")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.45rem",
              padding: "0.85rem 1rem",
              background: "none",
              border: "none",
              borderBottom: activeTab === "apps" ? "2px solid #1A56DB" : "2px solid transparent",
              color: activeTab === "apps" ? "#1A56DB" : "#64748B",
              fontSize: "0.85rem",
              fontWeight: activeTab === "apps" ? 700 : 500,
              cursor: "pointer",
            }}
          >
            <BarChart2 size={15} />
            <span>Application Breakdown ({sortedApps.length})</span>
          </button>
        </div>

        {/* Tab 1: Timeline Body */}
        {activeTab === "timeline" && (
          <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
            {/* Search Bar */}
            <div
              style={{
                padding: "0.75rem 1.5rem",
                borderBottom: "1px solid #F1F5F9",
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  background: "#F8FAFC",
                  border: "1px solid #E2E8F0",
                  borderRadius: "6px",
                  padding: "0.45rem 0.75rem",
                  flex: 1,
                  maxWidth: "380px",
                }}
              >
                <Search size={14} color="#94A3B8" />
                <input
                  type="text"
                  placeholder="Filter by app or window title..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    border: "none",
                    outline: "none",
                    background: "transparent",
                    fontSize: "0.825rem",
                    width: "100%",
                    color: "#0F172A",
                  }}
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "#94A3B8", padding: 0 }}
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
              <span style={{ fontSize: "0.75rem", color: "#64748B" }}>
                Showing {filteredHistory.length} events from the last 7 days
              </span>
            </div>

            {/* Timeline Rows */}
            <div style={{ flex: 1, overflowY: "auto", padding: "0.75rem 1.5rem" }}>
              {filteredHistory.length === 0 ? (
                <div style={{ textAlign: "center", padding: "3rem 1rem", color: "#64748B" }}>
                  <AppWindow size={32} color="#94A3B8" style={{ margin: "0 auto 0.75rem" }} />
                  <p style={{ margin: 0, fontWeight: 600, fontSize: "0.9rem" }}>No activity logs found</p>
                  <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "#94A3B8" }}>
                    {searchTerm ? "Try clearing your search filter." : "The desktop agent will record activity events as the user works."}
                  </p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                  {filteredHistory.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "0.75rem 1rem",
                        background: "#FFFFFF",
                        border: "1px solid #E2E8F0",
                        borderRadius: "8px",
                        gap: "1rem",
                        transition: "background-color 0.15s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#F8FAFC")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#FFFFFF")}
                    >
                      {/* Left: App icon & Title */}
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", minWidth: 0, flex: 1 }}>
                        <div
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: "6px",
                            background: "#EEF2FF",
                            color: "#1A56DB",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <AppWindow size={16} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <span
                              style={{
                                fontWeight: 700,
                                fontSize: "0.85rem",
                                color: "#0F172A",
                                fontFamily: "monospace",
                              }}
                            >
                              {item.app}
                            </span>
                          </div>
                          <p
                            style={{
                              margin: "2px 0 0",
                              fontSize: "0.8rem",
                              color: "#475569",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                            title={item.title}
                          >
                            {item.title || "Unknown window title"}
                          </p>
                        </div>
                      </div>

                      {/* Right: Timestamp & Duration */}
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.35rem",
                            fontSize: "0.78rem",
                            fontWeight: 600,
                            color: "#1E293B",
                          }}
                        >
                          <Clock size={12} color="#64748B" />
                          <span>{formatHistoryTimestamp(item)}</span>
                        </div>
                        {item.durationSeconds && item.durationSeconds > 0 ? (
                          <p
                            style={{
                              margin: "2px 0 0",
                              fontSize: "0.72rem",
                              color: "#059669",
                              fontWeight: 600,
                            }}
                          >
                            Active: {formatDuration(item.durationSeconds)}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: App Breakdown Body */}
        {activeTab === "apps" && (
          <div style={{ flex: 1, overflowY: "auto", padding: "1rem 1.5rem" }}>
            {sortedApps.length === 0 ? (
              <div style={{ textAlign: "center", padding: "3rem 1rem", color: "#64748B" }}>
                <BarChart2 size={32} color="#94A3B8" style={{ margin: "0 auto 0.75rem" }} />
                <p style={{ margin: 0, fontWeight: 600, fontSize: "0.9rem" }}>No application usage data yet</p>
                <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "#94A3B8" }}>
                  Usage seconds will accumulate as the workstation agent syncs with the server.
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                {sortedApps.map(([app, seconds], idx) => {
                  const pct = Math.min(100, Math.round((seconds / totalTrackedSeconds) * 100));
                  const isProductive =
                    app.includes("code") ||
                    app.includes("photoshop") ||
                    app.includes("premiere") ||
                    app.includes("chrome") ||
                    app.includes("edge") ||
                    app.includes("brave");

                  return (
                    <div
                      key={app}
                      style={{
                        padding: "0.85rem 1rem",
                        background: "#FFFFFF",
                        border: "1px solid #E2E8F0",
                        borderRadius: "8px",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <span
                            style={{
                              fontSize: "0.7rem",
                              fontWeight: 700,
                              color: "#94A3B8",
                              width: "20px",
                            }}
                          >
                            #{idx + 1}
                          </span>
                          <span style={{ fontWeight: 700, fontSize: "0.875rem", color: "#0F172A", fontFamily: "monospace" }}>
                            {app}
                          </span>
                          <span
                            style={{
                              fontSize: "0.68rem",
                              fontWeight: 700,
                              padding: "0.15rem 0.45rem",
                              borderRadius: "4px",
                              background: isProductive ? "#ECFDF5" : "#F1F5F9",
                              color: isProductive ? "#059669" : "#64748B",
                            }}
                          >
                            {isProductive ? "Productive" : "General"}
                          </span>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <span style={{ fontWeight: 700, fontSize: "0.85rem", color: "#0F172A" }}>
                            {formatDuration(seconds)}
                          </span>
                          <span style={{ fontSize: "0.75rem", color: "#64748B", marginLeft: "6px" }}>
                            ({pct}%)
                          </span>
                        </div>
                      </div>
                      {/* Bar */}
                      <div style={{ width: "100%", height: 6, borderRadius: 999, background: "#F1F5F9", overflow: "hidden" }}>
                        <div
                          style={{
                            width: `${pct}%`,
                            height: "100%",
                            background: isProductive ? "#059669" : "#6366F1",
                            borderRadius: 999,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Modal Footer */}
        <div
          style={{
            padding: "0.85rem 1.5rem",
            borderTop: "1px solid #E5E7EB",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "#FAFAFA",
          }}
        >
          <span style={{ fontSize: "0.75rem", color: "#64748B" }}>
            ℹ Activity history is automatically retained for 7 days (1 week) and pruned thereafter.
          </span>
          <button
            onClick={onClose}
            style={{
              padding: "0.45rem 1.1rem",
              background: "#FFFFFF",
              border: "1px solid #D1D5DB",
              borderRadius: "6px",
              color: "#374151",
              fontSize: "0.825rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Desktop Agent Modal ──────────────────────────────────────────────────────
function DesktopAgentModal({
  isOpen,
  onClose,
  userId,
}: {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
}) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const copyId = () => {
    if (userId) {
      navigator.clipboard.writeText(userId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const launchAgent = () => {
    if (userId) {
      window.location.href = `resawc-agent://login?userId=${userId}`;
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(17, 24, 39, 0.45)",
        backdropFilter: "blur(4px)",
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#FFFFFF",
          borderRadius: "12px",
          width: "100%",
          maxWidth: "540px",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
          border: "1px solid #E5E7EB",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "1.25rem 1.5rem",
            borderBottom: "1px solid #E5E7EB",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: "10px",
                background: "#EFF6FF",
                color: "#1A56DB",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Laptop size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0, color: "#111827" }}>
                Resawc Desktop Agent
              </h2>
              <p style={{ fontSize: "0.8rem", color: "#6B7280", margin: "2px 0 0" }}>
                Workstation productivity and application telemetry tracker
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "#9CA3AF",
              cursor: "pointer",
              padding: "4px",
              display: "flex",
              borderRadius: "6px",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {/* Quick Launch (Browser Protocol) */}
          <div
            style={{
              padding: "1rem",
              background: "#F8FAFC",
              border: "1px solid #E2E8F0",
              borderRadius: "8px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
              <div>
                <p style={{ fontWeight: 700, fontSize: "0.9rem", margin: 0, color: "#0F172A" }}>
                  1-Click Web Launch
                </p>
                <p style={{ fontSize: "0.8rem", color: "#64748B", margin: "4px 0 0", lineHeight: 1.4 }}>
                  If the tracker is installed on this PC, launch and connect automatically.
                </p>
              </div>
              <button
                onClick={launchAgent}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "0.5rem 1rem",
                  background: "#1A56DB",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "0.825rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                <Play size={14} /> Launch Agent
              </button>
            </div>
          </div>

          {/* Download Binary */}
          <div
            style={{
              padding: "1rem",
              background: "#F0FDF4",
              border: "1px solid #BBF7D0",
              borderRadius: "8px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
              <div>
                <p style={{ fontWeight: 700, fontSize: "0.9rem", margin: 0, color: "#166534" }}>
                  Download Windows Standalone (agent.exe)
                </p>
                <p style={{ fontSize: "0.8rem", color: "#15803D", margin: "4px 0 0", lineHeight: 1.4 }}>
                  Standalone Windows binary (13 MB). No Python installation required.
                </p>
              </div>
              <a
                href="/agent.exe"
                download="agent.exe"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "0.5rem 1rem",
                  background: "#16A34A",
                  color: "#fff",
                  borderRadius: "6px",
                  fontSize: "0.825rem",
                  fontWeight: 600,
                  textDecoration: "none",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                <Download size={14} /> Download (.exe)
              </a>
            </div>
          </div>

          {/* User ID Section */}
          <div>
            <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: "6px" }}>
              Your User Tracking ID
            </label>
            <div style={{ display: "flex", gap: "8px" }}>
              <input
                readOnly
                value={userId || ""}
                style={{
                  flex: 1,
                  fontFamily: "monospace",
                  fontSize: "0.825rem",
                  padding: "0.5rem 0.75rem",
                  border: "1px solid #E5E7EB",
                  borderRadius: "6px",
                  background: "#F9FAFB",
                  color: "#374151",
                  outline: "none",
                }}
              />
              <button
                onClick={copyId}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "0.5rem 0.9rem",
                  background: "#FFFFFF",
                  border: "1px solid #E5E7EB",
                  borderRadius: "6px",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  color: "#374151",
                  cursor: "pointer",
                }}
              >
                {copied ? <><Check size={14} color="#10B981" /> Copied</> : <><Copy size={14} /> Copy ID</>}
              </button>
            </div>
          </div>

          {/* Setup Guide */}
          <div style={{ borderTop: "1px solid #E5E7EB", paddingTop: "1rem" }}>
            <p style={{ fontSize: "0.8rem", fontWeight: 700, color: "#374151", marginBottom: "6px" }}>
              Quick Team Setup:
            </p>
            <ol style={{ fontSize: "0.8rem", color: "#6B7280", paddingLeft: "1.2rem", margin: 0, lineHeight: 1.6 }}>
              <li>Share <strong>agent.exe</strong> with team members or have them download it.</li>
              <li>When launched on their workstation, enter their assigned User ID.</li>
              <li>The tracker runs in background and syncs active apps and idle time every 10 seconds.</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Monitor Content ──────────────────────────────────────────────────────────
function MonitorContent() {
  const { user } = useRole();
  const [activities, setActivities] = useState<PCActivity[]>([]);
  const [lastSync, setLastSync] = useState<string>("");
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [selectedActivityId, setSelectedActivityId] = useState<number | string | null>(null);

  const selectedActivity = activities.find((a) => a.id === selectedActivityId) || null;

  const fetchActivities = async () => {
    try {
      const res = await fetch("/api/monitor/sync");
      const data = await res.json();
      if (data.success) {
        setActivities(data.data);
        setLastSync(
          new Date().toLocaleTimeString("en-US", {
            timeZone: "Asia/Kolkata",
            hour: "2-digit",
            minute: "2-digit",
          })
        );
      }
    } catch (e) {
      console.error("Error fetching activities:", e);
    }
  };

  // 10-second polling (original logic preserved)
  useEffect(() => {
    fetchActivities();
    const interval = setInterval(fetchActivities, 10000);
    return () => clearInterval(interval);
  }, []);

  if (!user) return null;

  const activeCount = activities.filter((a) => a.status === "Active").length;
  const idleCount = activities.filter((a) => a.status === "Idle").length;
  const offlineCount = activities.filter((a) => a.status === "Offline").length;

  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      {/* ── Page Header ──────────────────────────────────────────────────── */}
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
            Live PC Monitor
          </h1>
          <p style={{ fontSize: "0.875rem", color: C.muted, margin: "0.25rem 0 0 0" }}>
            Real-time application tracking and productivity scoring for your team.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          {/* Active / Idle / Offline counts */}
          {activities.length > 0 && (
            <div
              style={{
                display: "flex",
                gap: "0.75rem",
                padding: "0.45rem 1rem",
                background: C.card,
                border: `1px solid ${C.border}`,
                borderRadius: C.radiusPill,
              }}
            >
              <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#059669" }}>
                {activeCount} Active
              </span>
              <span style={{ color: C.border }}>|</span>
              <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#D97706" }}>
                {idleCount} Idle
              </span>
              {offlineCount > 0 && (
                <>
                  <span style={{ color: C.border }}>|</span>
                  <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#6B7280" }}>
                    {offlineCount} Offline
                  </span>
                </>
              )}
            </div>
          )}

          {/* Live sync badge */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.45rem",
              padding: "0.45rem 1rem",
              background: "#ECFDF5",
              border: "1px solid #A7F3D0",
              borderRadius: C.radiusPill,
              color: "#059669",
              fontSize: "0.8rem",
              fontWeight: 700,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#059669",
                flexShrink: 0,
                animation: "pulse 2s infinite",
              }}
            />
            Live Sync {lastSync ? `• ${lastSync}` : ""}
          </div>

          {/* Desktop Agent button */}
          <button
            onClick={() => setShowAgentModal(true)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.45rem",
              padding: "0.45rem 1rem",
              background: "var(--primary, #1A56DB)",
              color: "#fff",
              border: "none",
              borderRadius: C.radiusPill,
              fontSize: "0.8rem",
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              transition: "opacity 0.15s ease",
            }}
          >
            <Laptop size={14} />
            <span>Desktop Agent</span>
          </button>
        </div>
      </div>

      {/* ── Empty state or grid ───────────────────────────────────────────── */}
      {activities.length === 0 ? (
        <div
          style={{
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: C.radius,
            padding: "4rem 2rem",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "16px",
              background: "#EFF6FF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1.5rem",
            }}
          >
            <Monitor size={28} color={C.primary} />
          </div>
          <h3
            style={{
              fontSize: "1.2rem",
              fontWeight: 700,
              color: C.text,
              margin: "0 0 0.5rem 0",
            }}
          >
            No Desktop Agents Connected
          </h3>
          <p
            style={{
              fontSize: "0.875rem",
              color: C.muted,
              maxWidth: 420,
              margin: "0 auto 1.75rem",
              lineHeight: 1.65,
            }}
          >
            Launch <strong>agent.py</strong> or <strong>Resawc_PC_Tracker.exe</strong> on team
            workstations to begin streaming live productivity data and active applications.
          </p>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.55rem 1.25rem",
              background: "#FFFBEB",
              border: "1px solid #FDE68A",
              borderRadius: C.radiusPill,
              color: "#D97706",
              fontSize: "0.8rem",
              fontWeight: 700,
            }}
          >
            <AlertTriangle size={14} /> Telemetry service listening on /api/monitor/sync
          </div>

          <div style={{ marginTop: "1.5rem" }}>
            <button
              onClick={() => setShowAgentModal(true)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.6rem 1.25rem",
                background: "var(--primary, #1A56DB)",
                color: "#fff",
                border: "none",
                borderRadius: C.radiusSm,
                fontSize: "0.85rem",
                fontWeight: 600,
                cursor: "pointer",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              }}
            >
              <Download size={15} />
              <span>Get Desktop Agent</span>
            </button>
          </div>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: "1.25rem",
          }}
        >
          {activities.map((act) => (
            <AgentCard
              key={act.id}
              act={act}
              onExpand={(target) => setSelectedActivityId(target.id)}
            />
          ))}
        </div>
      )}

      {/* Expanded Activity Modal (7-Day History) */}
      <ActivityDetailModal
        act={selectedActivity}
        onClose={() => setSelectedActivityId(null)}
      />

      {/* Desktop Agent Modal */}
      <DesktopAgentModal
        isOpen={showAgentModal}
        onClose={() => setShowAgentModal(false)}
        userId={user.id}
      />
    </div>
  );
}

// ─── Page Export (RoleGuard wraps content) ────────────────────────────────────
export default function LiveMonitorPage() {
  return (
    <RoleGuard allowedRoles={["admin"]}>
      <MonitorContent />
    </RoleGuard>
  );
}
