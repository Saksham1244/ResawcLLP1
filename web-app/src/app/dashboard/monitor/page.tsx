"use client";

import { useState, useEffect } from "react";
import { useRole } from "@/context/RoleContext";
import { RoleGuard } from "@/components/RoleGuard";
import {
  Monitor, AppWindow, AlertTriangle, Clock,
  Download, Laptop, Play, Copy, Check, X
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
type PCActivity = {
  id: number;
  name: string;
  role: string;
  status: "Active" | "Idle" | "Offline";
  idleTime?: string;
  currentApp: string;
  appTitle: string;
  productivity: number;
  lastScreenshot?: string;
  lastSync?: string;
  appHistory?: any[];
  dailyAppUsage?: Record<string, number>;
};

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
function AgentCard({ act }: { act: PCActivity }) {
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
            <AgentCard key={act.id} act={act} />
          ))}
        </div>
      )}

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
