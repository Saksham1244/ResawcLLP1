"use client";

import {
  TrendingUp,
  CheckSquare,
  CalendarCheck,
  Activity,
  MessageSquare,
  Users,
  ArrowRight,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect, CSSProperties } from "react";
import { useRole } from "@/context/RoleContext";

/* ─── helpers ──────────────────────────────────────── */
function getGreeting() {
  const hour = new Date().toLocaleTimeString("en-US", {
    hour12: false,
    hour: "numeric",
    timeZone: "Asia/Kolkata",
  });
  const h = parseInt(hour, 10);
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

/* ─── types ─────────────────────────────────────────── */
interface ActivityItem {
  text: string;
  highlight?: string;
  color?: string;
  time?: string;
}

interface OverviewData {
  activeLeads: number;
  pendingTasks: number;
  teamMembers: number;
  recentActivity: ActivityItem[];
}

/* ─── quick-access card definition ─────────────────── */
const quickCards = (isAdmin: boolean, isEditor: boolean) =>
  [
    {
      id: "leads",
      title: "Leads & Pipeline",
      subtitle: "Round-robin leads & call logs",
      href: "/dashboard/leads",
      icon: TrendingUp,
      bg: "#FFF0F3",
      iconBg: "#FFD6E0",
      iconColor: "#E8265E",
      show: !isEditor,
    },
    {
      id: "tasks",
      title: "Team Tasks",
      subtitle: "Active queues & deliverables",
      href: "/dashboard/tasks",
      icon: CheckSquare,
      bg: "#EFF8FF",
      iconBg: "#C7E5FF",
      iconColor: "#1A56DB",
      show: true,
    },
    {
      id: "attendance",
      title: "Attendance",
      subtitle: "Check-ins, leaves & reports",
      href: "/dashboard/attendance",
      icon: CalendarCheck,
      bg: "#F0FFF8",
      iconBg: "#C3F5E2",
      iconColor: "#0E9F6E",
      show: true,
    },
    {
      id: "monitor",
      title: "Live Monitor",
      subtitle: "Real-time team radar",
      href: "/dashboard/monitor",
      icon: Activity,
      bg: "#FFF8F0",
      iconBg: "#FFE3C3",
      iconColor: "#D97706",
      show: isAdmin,
    },
    {
      id: "chat",
      title: "Messages",
      subtitle: "Team chat & updates",
      href: "/dashboard/chat",
      icon: MessageSquare,
      bg: "#F5F0FF",
      iconBg: "#E0D4FC",
      iconColor: "#7C3AED",
      show: true,
    },
  ].filter((c) => c.show);

/* ─── component ─────────────────────────────────────── */
export default function DashboardOverview() {
  const { user } = useRole();
  const [data, setData] = useState<OverviewData>({
    activeLeads: 0,
    pendingTasks: 0,
    teamMembers: 0,
    recentActivity: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    fetch(`/api/overview?userId=${user.id}&role=${user.role}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setData(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [user]);

  if (!user) return null;

  const greeting = getGreeting();
  const isAdmin = user.role === "admin";
  const isEditor = user.role === "editor";
  const cards = quickCards(isAdmin, isEditor);

  /* ── style helpers ── */
  const s: Record<string, CSSProperties> = {
    page: {
      maxWidth: 1280,
      margin: "0 auto",
      display: "flex",
      flexDirection: "column",
      gap: "1.75rem",
      fontFamily: "Inter, system-ui, sans-serif",
    },

    /* ── header banner ── */
    headerBanner: {
      background: "#FFFFFF",
      border: "1px solid #E5E7EB",
      borderRadius: 8,
      padding: "1.75rem 2rem",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      flexWrap: "wrap" as const,
      gap: "1rem",
    },
    greeting: {
      fontSize: 28,
      fontWeight: 700,
      color: "#111827",
      margin: "0 0 0.3rem 0",
      letterSpacing: "-0.02em",
    },
    subtitle: {
      fontSize: 14,
      color: "#6B7280",
      margin: 0,
    },
    btnRow: {
      display: "flex",
      gap: "0.75rem",
      flexWrap: "wrap" as const,
      alignItems: "center",
    },
    btnOutline: {
      display: "inline-flex",
      alignItems: "center",
      gap: "0.5rem",
      padding: "0.55rem 1.1rem",
      borderRadius: 6,
      border: "1px solid #D1D5DB",
      background: "#FFFFFF",
      color: "#374151",
      fontWeight: 600,
      fontSize: 14,
      textDecoration: "none",
      cursor: "pointer",
      transition: "background 0.15s",
    },
    btnBlue: {
      display: "inline-flex",
      alignItems: "center",
      gap: "0.5rem",
      padding: "0.55rem 1.1rem",
      borderRadius: 6,
      border: "none",
      background: "#1A56DB",
      color: "#FFFFFF",
      fontWeight: 600,
      fontSize: 14,
      textDecoration: "none",
      cursor: "pointer",
    },

    /* ── quick access row ── */
    sectionLabel: {
      fontSize: 11,
      fontWeight: 700,
      color: "#9CA3AF",
      letterSpacing: "0.08em",
      textTransform: "uppercase" as const,
      marginBottom: "0.75rem",
    },
    cardsRow: {
      display: "flex",
      flexWrap: "wrap" as const,
      gap: "1rem",
    },
    card: {
      background: "#FFFFFF",
      border: "1px solid #E5E7EB",
      borderRadius: 8,
      padding: "1.25rem",
      width: 160,
      minWidth: 145,
      flexShrink: 0,
      display: "flex",
      flexDirection: "column" as const,
      gap: "0.75rem",
      textDecoration: "none",
      transition: "box-shadow 0.15s, transform 0.15s",
      cursor: "pointer",
    },

    /* ── bottom two-panel row ── */
    panelRow: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "1.25rem",
    },
    panel: {
      background: "#FFFFFF",
      border: "1px solid #E5E7EB",
      borderRadius: 8,
      padding: "1.5rem",
    },
    panelTitle: {
      fontSize: 15,
      fontWeight: 700,
      color: "#111827",
      margin: "0 0 1.25rem 0",
    },

    /* ── activity list ── */
    activityRow: {
      display: "flex",
      alignItems: "flex-start",
      gap: "0.75rem",
      padding: "0.7rem 0",
      borderBottom: "1px solid #F3F4F6",
    },
    activityDot: {
      width: 8,
      height: 8,
      borderRadius: "50%",
      background: "#1A56DB",
      marginTop: 5,
      flexShrink: 0,
    },
    activityText: {
      fontSize: 13,
      color: "#374151",
      margin: 0,
      flex: 1,
    },
    activityTime: {
      fontSize: 12,
      color: "#9CA3AF",
      flexShrink: 0,
    },
    emptyState: {
      textAlign: "center" as const,
      padding: "2.5rem 1rem",
      color: "#9CA3AF",
    },

    /* ── key metrics ── */
    metricGrid: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "0.85rem",
    },
    metricTile: {
      background: "#F9FAFB",
      border: "1px solid #E5E7EB",
      borderRadius: 8,
      padding: "1rem 1.1rem",
    },
    metricValue: {
      fontSize: 32,
      fontWeight: 800,
      color: "#111827",
      lineHeight: 1,
      margin: "0 0 0.3rem 0",
      letterSpacing: "-0.03em",
    },
    metricLabel: {
      fontSize: 12,
      color: "#6B7280",
      fontWeight: 500,
      margin: 0,
    },
  };

  return (
    <div style={s.page}>

      {/* ── Page Header ── */}
      <div style={s.headerBanner}>
        <div>
          <h1 style={s.greeting}>
            {greeting}, {user.name} 👋
          </h1>
          <p style={s.subtitle}>
            Here is your workspace overview for today — tasks, leads, and team updates.
          </p>
        </div>

        <div style={s.btnRow}>
          <a
            href="/attendance"
            target="_blank"
            rel="noreferrer"
            style={s.btnOutline}
          >
            <CalendarCheck size={15} />
            Mark Attendance
          </a>

          {isAdmin && (
            <Link href="/dashboard/monitor" style={s.btnBlue}>
              <Activity size={15} />
              Live Monitor
            </Link>
          )}
        </div>
      </div>

      {/* ── Quick Access Cards ── */}
      <div>
        <p style={s.sectionLabel}>Quick Access</p>
        <div style={s.cardsRow}>
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.id}
                href={card.href}
                style={{ ...s.card, background: card.bg }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow =
                    "0 4px 16px rgba(0,0,0,0.08)";
                  (e.currentTarget as HTMLElement).style.transform =
                    "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = "none";
                  (e.currentTarget as HTMLElement).style.transform = "none";
                }}
              >
                {/* Icon container */}
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 10,
                    background: card.iconBg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: card.iconColor,
                  }}
                >
                  <Icon size={22} />
                </div>

                {/* Text */}
                <div>
                  <p
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: "#111827",
                      margin: "0 0 0.2rem 0",
                    }}
                  >
                    {card.title}
                  </p>
                  <p
                    style={{
                      fontSize: 11,
                      color: "#6B7280",
                      margin: 0,
                      lineHeight: 1.4,
                    }}
                  >
                    {card.subtitle}
                  </p>
                </div>

                {/* Arrow */}
                <div style={{ marginTop: "auto", display: "flex", justifyContent: "flex-end" }}>
                  <ArrowRight size={14} color={card.iconColor} />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── Bottom Panels ── */}
      <div style={s.panelRow}>

        {/* Recent Activity */}
        <div style={s.panel}>
          <p style={s.panelTitle}>Recent Activity</p>

          {data.recentActivity.length === 0 ? (
            <div style={s.emptyState}>
              <Clock size={36} color="#D1D5DB" style={{ marginBottom: "0.75rem" }} />
              <p style={{ fontSize: 14, fontWeight: 600, color: "#374151", margin: "0 0 0.3rem 0" }}>
                No recent activity
              </p>
              <p style={{ fontSize: 12, color: "#9CA3AF", margin: 0 }}>
                Team events and lead updates will appear here automatically.
              </p>
            </div>
          ) : (
            <div>
              {data.recentActivity.map((item, i) => (
                <div
                  key={i}
                  style={{
                    ...s.activityRow,
                    ...(i === data.recentActivity.length - 1
                      ? { borderBottom: "none" }
                      : {}),
                  }}
                >
                  <span
                    style={{
                      ...s.activityDot,
                      background: item.color ?? "#1A56DB",
                    }}
                  />
                  <p style={s.activityText}>
                    {item.text}{" "}
                    {item.highlight && (
                      <strong style={{ color: item.color ?? "#1A56DB" }}>
                        {item.highlight}
                      </strong>
                    )}
                  </p>
                  {item.time && (
                    <span style={s.activityTime}>{item.time}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Key Metrics */}
        <div style={s.panel}>
          <p style={s.panelTitle}>Key Metrics</p>

          <div style={s.metricGrid}>
            {/* Active Leads */}
            {!isEditor && (
              <div style={{ ...s.metricTile, borderLeft: "3px solid #E8265E" }}>
                <p style={s.metricValue}>
                  {loading ? "—" : data.activeLeads}
                </p>
                <p style={s.metricLabel}>Active Leads</p>
              </div>
            )}

            {/* Pending Tasks */}
            <div style={{ ...s.metricTile, borderLeft: "3px solid #1A56DB" }}>
              <p style={s.metricValue}>
                {loading ? "—" : data.pendingTasks}
              </p>
              <p style={s.metricLabel}>Pending Tasks</p>
            </div>

            {/* Team Members — admin only */}
            {isAdmin && (
              <div style={{ ...s.metricTile, borderLeft: "3px solid #0E9F6E" }}>
                <p style={s.metricValue}>
                  {loading ? "—" : data.teamMembers}
                </p>
                <p style={s.metricLabel}>Team Members</p>
              </div>
            )}

            {/* Today placeholder tile */}
            <div style={{ ...s.metricTile, borderLeft: "3px solid #D97706" }}>
              <p style={s.metricValue}>
                {new Date().toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                })}
              </p>
              <p style={s.metricLabel}>Today</p>
            </div>

            {/* Role badge tile */}
            <div style={{ ...s.metricTile, borderLeft: "3px solid #7C3AED", gridColumn: isAdmin ? "1 / -1" : undefined }}>
              <p
                style={{
                  ...s.metricValue,
                  fontSize: 18,
                  textTransform: "capitalize" as const,
                  color: "#7C3AED",
                }}
              >
                {user.role}
              </p>
              <p style={s.metricLabel}>Your Role</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
