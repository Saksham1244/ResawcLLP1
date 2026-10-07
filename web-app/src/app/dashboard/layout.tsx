"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard, Users, CheckSquare, MessageSquare,
  Settings, LogOut, Bell, TrendingUp, ChevronDown,
  CalendarCheck, Activity, Search, PanelLeftClose, PanelLeftOpen, Clock,
  Building2, Film, Image as ImageIcon, Video, Receipt, Wallet, BarChart2
} from "lucide-react";
import { useRole, UserRole } from "@/context/RoleContext";

// ─── Role-based nav config ───────────────────────────────────────────────────
const NAV_BY_ROLE: Record<UserRole, { name: string; href: string; icon: any }[]> = {
  admin: [
    { name: "Dashboard",     href: "/dashboard",            icon: LayoutDashboard },
    { name: "Clients",       href: "/dashboard/clients",     icon: Building2       },
    { name: "Editing Jobs",  href: "/dashboard/jobs",        icon: Film            },
    { name: "Invoicing",     href: "/dashboard/finance",     icon: Receipt         },
    { name: "Payroll",       href: "/dashboard/payroll",     icon: Wallet          },
    { name: "Reports",       href: "/dashboard/reports",     icon: BarChart2       },
    { name: "Activity Log",  href: "/dashboard/activity",    icon: Clock           },
    { name: "Leads",         href: "/dashboard/leads",       icon: TrendingUp      },
    { name: "Tasks",         href: "/dashboard/tasks",       icon: CheckSquare     },
    { name: "Attendance",    href: "/dashboard/attendance",  icon: CalendarCheck   },
    { name: "Live Monitor",  href: "/dashboard/monitor",     icon: Activity        },
    { name: "Team",          href: "/dashboard/team",        icon: Users           },
    { name: "Messages",      href: "/dashboard/chat",        icon: MessageSquare   },
  ],
  marketing: [
    { name: "Dashboard",     href: "/dashboard",           icon: LayoutDashboard },
    { name: "Clients",       href: "/dashboard/clients",   icon: Building2       },
    { name: "My Leads",      href: "/dashboard/leads",     icon: TrendingUp      },
    { name: "Tasks",         href: "/dashboard/tasks",     icon: CheckSquare     },
    { name: "Attendance",    href: "/dashboard/attendance",icon: CalendarCheck   },
    { name: "My Payslips",   href: "/dashboard/payroll",   icon: Wallet          },
    { name: "Messages",      href: "/dashboard/chat",      icon: MessageSquare   },
  ],
  photo_editor: [
    { name: "Dashboard",          href: "/dashboard",           icon: LayoutDashboard },
    { name: "Production (Photo)", href: "/dashboard/jobs",      icon: ImageIcon       },
    { name: "Tasks",              href: "/dashboard/tasks",     icon: CheckSquare     },
    { name: "Attendance",         href: "/dashboard/attendance",icon: CalendarCheck   },
    { name: "My Payslips",        href: "/dashboard/payroll",   icon: Wallet          },
    { name: "Messages",           href: "/dashboard/chat",      icon: MessageSquare   },
  ],
  video_editor: [
    { name: "Dashboard",          href: "/dashboard",           icon: LayoutDashboard },
    { name: "Video Editing",      href: "/dashboard/jobs",      icon: Video           },
    { name: "Tasks",              href: "/dashboard/tasks",     icon: CheckSquare     },
    { name: "Attendance",         href: "/dashboard/attendance",icon: CalendarCheck   },
    { name: "My Payslips",        href: "/dashboard/payroll",   icon: Wallet          },
    { name: "Messages",           href: "/dashboard/chat",      icon: MessageSquare   },
  ],
  editor: [
    { name: "Dashboard",          href: "/dashboard",           icon: LayoutDashboard },
    { name: "Production (Photo)", href: "/dashboard/jobs",      icon: ImageIcon       },
    { name: "Tasks",              href: "/dashboard/tasks",     icon: CheckSquare     },
    { name: "Attendance",         href: "/dashboard/attendance",icon: CalendarCheck   },
    { name: "My Payslips",        href: "/dashboard/payroll",   icon: Wallet          },
    { name: "Messages",           href: "/dashboard/chat",      icon: MessageSquare   },
  ],
};

const ROLE_COLORS: Record<UserRole, string> = {
  admin:        "#1A56DB",
  marketing:    "#7C3AED",
  photo_editor: "#059669",
  video_editor: "#D97706",
  editor:       "#059669",
};

const ROLE_LABELS: Record<UserRole, string> = {
  admin:        "Admin",
  marketing:    "Marketing",
  photo_editor: "Production",
  video_editor: "Video Editing",
  editor:       "Production",
};

// ─── Page title from pathname ─────────────────────────────────────────────────
function getPageTitle(pathname: string): string {
  if (pathname === "/dashboard")                   return "Dashboard";
  if (pathname.startsWith("/dashboard/clients"))   return "Clients";
  if (pathname.startsWith("/dashboard/jobs"))      return "Editing Jobs";
  if (pathname.startsWith("/dashboard/finance"))   return "Invoicing";
  if (pathname.startsWith("/dashboard/payroll"))   return "Payroll & Payslips";
  if (pathname.startsWith("/dashboard/team"))      return "Team & Members";
  if (pathname.startsWith("/dashboard/leads"))     return "Leads";
  if (pathname.startsWith("/dashboard/tasks"))     return "Tasks";
  if (pathname.startsWith("/dashboard/attendance"))return "Attendance";
  if (pathname.startsWith("/dashboard/monitor"))   return "Live Monitor";
  if (pathname.startsWith("/dashboard/chat"))      return "Messages";
  if (pathname.startsWith("/dashboard/settings"))  return "Settings";
  return "Dashboard";
}

// ─── Format notification date & time ──────────────────────────────────────────
function formatNotificationDate(dateStr: string | Date): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";

    const datePart = d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    const timePart = d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    return `${datePart} • ${timePart}`;
  } catch {
    return String(dateStr);
  }
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isHydrated } = useRole();
  const pathname  = usePathname();
  const router    = useRouter();

  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifs,    setShowNotifs]    = useState(false);
  const [showUserMenu,  setShowUserMenu]  = useState(false);
  const [isCollapsed,   setIsCollapsed]   = useState(false);

  // ── Appearance & Density Settings Sync ────────────────────────────────────
  useEffect(() => {
    const applySavedSettings = () => {
      try {
        const savedAccent = localStorage.getItem("resawc_accent_color");
        if (savedAccent) {
          document.documentElement.style.setProperty("--primary", savedAccent);
          document.documentElement.style.setProperty("--bg-sidebar", savedAccent);
        }
        const savedDensity = localStorage.getItem("resawc_density");
        if (savedDensity) {
          document.documentElement.setAttribute("data-density", savedDensity);
        }
        const savedAnims = localStorage.getItem("resawc_animations");
        if (savedAnims !== null) {
          document.documentElement.setAttribute("data-animations", savedAnims);
        }
        const savedCollapsed = localStorage.getItem("resawc_sidebar_collapsed");
        if (savedCollapsed !== null) {
          const shouldCollapse = savedCollapsed === "true";
          setIsCollapsed(prev => (prev !== shouldCollapse ? shouldCollapse : prev));
        }
      } catch {}
    };

    applySavedSettings();
    window.addEventListener("resawc_settings_updated", applySavedSettings);
    return () => window.removeEventListener("resawc_settings_updated", applySavedSettings);
  }, []);

  const toggleSidebarCollapse = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    try {
      localStorage.setItem("resawc_sidebar_collapsed", String(next));
      setTimeout(() => {
        window.dispatchEvent(new Event("resawc_settings_updated"));
      }, 0);
    } catch {}
  };

  // ── Notification polling ──────────────────────────────────────────────────
  useEffect(() => {
    if (!user?.id) return;
    const fetchNotifs = async () => {
      try {
        const res  = await fetch(`/api/notifications?userId=${user.id}`);
        const data = await res.json();
        if (data.success) setNotifications(data.data);
      } catch {}
    };
    fetchNotifs();
    const int = setInterval(fetchNotifs, 10_000);
    return () => clearInterval(int);
  }, [user]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAsRead = async (id?: string) => {
    try {
      await fetch("/api/notifications/mark-read", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(id ? { notificationId: id } : { userId: user?.id }),
      });
      setNotifications(prev =>
        prev.map(n => id ? (n.id === id ? { ...n, isRead: true } : n) : { ...n, isRead: true })
      );
    } catch {}
  };

  // ── Auth / hydration guards ───────────────────────────────────────────────
  if (!isHydrated) return null;
  if (!user) {
    if (typeof window !== "undefined") router.replace("/");
    return null;
  }

  const navItems = NAV_BY_ROLE[user.role] || NAV_BY_ROLE.editor;

  const isEditorRole = user.role === "editor" || user.role === "photo_editor" || user.role === "video_editor";
  if (user.role !== "admin" && (pathname.startsWith("/dashboard/activity") || pathname.startsWith("/dashboard/monitor") || pathname.startsWith("/dashboard/team") || pathname.startsWith("/dashboard/finance") || pathname.startsWith("/dashboard/reports") || pathname.startsWith("/dashboard/settings"))) {
    if (typeof window !== "undefined") router.replace(isEditorRole ? "/dashboard/jobs" : "/dashboard");
    return null;
  }
  if (isEditorRole && (pathname.startsWith("/dashboard/leads") || pathname.startsWith("/dashboard/clients"))) {
    if (typeof window !== "undefined") router.replace("/dashboard/jobs");
    return null;
  }

  const pageTitle = getPageTitle(pathname);

  // ── Logout helper ─────────────────────────────────────────────────────────
  const handleLogout = () => {
    localStorage.removeItem("userId");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userName");
    localStorage.removeItem("userRole");
    router.replace("/");
  };

  return (
    <div style={{
      display: "flex",
      minHeight: "100vh",
      backgroundColor: "#F5F7FB",
      fontFamily: "Inter, system-ui, -apple-system, sans-serif",
    }}>

      {/* ── SIDEBAR ──────────────────────────────────────────────────────── */}
      <aside style={{
        width: isCollapsed ? "68px" : "220px",
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        backgroundColor: "var(--bg-sidebar, #1A56DB)",
        position: "sticky",
        top: 0,
        height: "100vh",
        overflowY: "auto",
        zIndex: 40,
        transition: "width 0.2s ease, background-color 0.2s ease",
      }}>

        {/* Logo / Brand */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: isCollapsed ? "center" : "space-between",
          padding: isCollapsed ? "18px 0 14px" : "20px 18px 16px",
          borderBottom: "1px solid rgba(255,255,255,0.12)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              overflow: "hidden",
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <img src="/resawc-logo.png" alt="Resawc" style={{ width: "36px", height: "36px", objectFit: "cover", borderRadius: "50%" }} />
            </div>
            {!isCollapsed && (
              <div>
                <div style={{ fontWeight: 700, fontSize: "15px", color: "#fff", lineHeight: 1.2 }}>
                  Resawc
                </div>
                <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.6)", fontWeight: 500 }}>
                  CRM Platform
                </div>
              </div>
            )}
          </div>
          {!isCollapsed && (
            <button
              onClick={toggleSidebarCollapse}
              title="Collapse Sidebar"
              style={{
                background: "transparent",
                border: "none",
                color: "rgba(255,255,255,0.65)",
                cursor: "pointer",
                padding: "4px",
                display: "flex",
                alignItems: "center",
                borderRadius: "5px",
              }}
            >
              <PanelLeftClose size={16} />
            </button>
          )}
        </div>

        {/* Collapsed expand button */}
        {isCollapsed && (
          <div style={{ display: "flex", justifyContent: "center", padding: "8px 0" }}>
            <button
              onClick={toggleSidebarCollapse}
              title="Expand Sidebar"
              style={{
                background: "transparent",
                border: "none",
                color: "rgba(255,255,255,0.7)",
                cursor: "pointer",
                padding: "6px",
                display: "flex",
                alignItems: "center",
                borderRadius: "5px",
              }}
            >
              <PanelLeftOpen size={17} />
            </button>
          </div>
        )}

        {/* Nav section label */}
        {!isCollapsed && (
          <p style={{
            fontSize: "10px",
            fontWeight: 700,
            color: "rgba(255,255,255,0.45)",
            padding: "18px 18px 8px",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            margin: 0,
          }}>
            {user.role === "editor" ? "Workspace" : "Main Menu"}
          </p>
        )}

        {/* Nav items */}
        <nav style={{ display: "flex", flexDirection: "column", gap: "2px", padding: isCollapsed ? "8px 6px" : "0 10px", flex: 1 }}>
          {navItems.map((item) => {
            const Icon     = item.icon;
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                title={item.name}
                style={{
                  display:        "flex",
                  alignItems:     "center",
                  justifyContent: isCollapsed ? "center" : "flex-start",
                  gap:            isCollapsed ? 0 : "10px",
                  padding:        isCollapsed ? "10px 0" : "9px 12px",
                  borderRadius:   "7px",
                  color:          isActive ? "#fff" : "rgba(255,255,255,0.72)",
                  backgroundColor: isActive ? "rgba(255,255,255,0.18)" : "transparent",
                  fontWeight:     isActive ? 600 : 400,
                  fontSize:       "13.5px",
                  textDecoration: "none",
                  transition:     "background-color 0.15s, color 0.15s",
                  borderLeft:     !isCollapsed && isActive ? "3px solid rgba(255,255,255,0.85)" : "3px solid transparent",
                }}
              >
                <Icon size={isCollapsed ? 18 : 16} strokeWidth={isActive ? 2.2 : 1.8} />
                {!isCollapsed && <span>{item.name}</span>}
              </Link>
            );
          })}

          {/* Settings — Admin only */}
          {user.role === "admin" && (
            <>
              <div style={{ height: "1px", backgroundColor: "rgba(255,255,255,0.12)", margin: "10px 4px" }} />
              <Link
                href="/dashboard/settings"
                title="Settings"
                style={{
                  display:         "flex",
                  alignItems:      "center",
                  justifyContent:  isCollapsed ? "center" : "flex-start",
                  gap:             isCollapsed ? 0 : "10px",
                  padding:         isCollapsed ? "10px 0" : "9px 12px",
                  borderRadius:    "7px",
                  color:           pathname === "/dashboard/settings" ? "#fff" : "rgba(255,255,255,0.72)",
                  backgroundColor: pathname === "/dashboard/settings" ? "rgba(255,255,255,0.18)" : "transparent",
                  fontWeight:      pathname === "/dashboard/settings" ? 600 : 400,
                  fontSize:        "13.5px",
                  textDecoration:  "none",
                  borderLeft:      !isCollapsed && pathname === "/dashboard/settings" ? "3px solid rgba(255,255,255,0.85)" : "3px solid transparent",
                }}
              >
                <Settings size={isCollapsed ? 18 : 16} />
                {!isCollapsed && <span>Settings</span>}
              </Link>
            </>
          )}
        </nav>

        {/* Bottom user chip */}
        <div style={{
          padding:    isCollapsed ? "12px 6px" : "14px 10px",
          borderTop:  "1px solid rgba(255,255,255,0.12)",
          marginTop:  "auto",
        }}>
          <div style={{
            display:         "flex",
            alignItems:      "center",
            justifyContent:  isCollapsed ? "center" : "space-between",
            padding:         isCollapsed ? "8px 0" : "8px 10px",
            borderRadius:    "8px",
            backgroundColor: "rgba(255,255,255,0.12)",
            flexDirection:   isCollapsed ? "column" : "row",
            gap:             isCollapsed ? "8px" : 0,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "9px", minWidth: 0 }}>
              {/* Avatar */}
              <div style={{
                width:           "32px",
                height:          "32px",
                borderRadius:    "8px",
                backgroundColor: "rgba(255,255,255,0.25)",
                display:         "flex",
                alignItems:      "center",
                justifyContent:  "center",
                fontSize:        "12px",
                fontWeight:      700,
                color:           "#fff",
                flexShrink:      0,
              }} title={user.name}>
                {user.initials}
              </div>
              {!isCollapsed && (
                <div style={{ minWidth: 0 }}>
                  <p style={{
                    fontSize:      "12.5px",
                    fontWeight:    600,
                    color:         "#fff",
                    margin:        0,
                    overflow:      "hidden",
                    textOverflow:  "ellipsis",
                    whiteSpace:    "nowrap",
                  }}>
                    {user.name}
                  </p>
                  <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.55)", margin: 0, fontWeight: 500 }}>
                    {ROLE_LABELS[user.role]}
                  </p>
                </div>
              )}
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              style={{
                background: "transparent",
                border:     "none",
                color:      "rgba(255,255,255,0.65)",
                cursor:     "pointer",
                padding:    "4px",
                display:    "flex",
                alignItems: "center",
                borderRadius: "5px",
              }}
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── MAIN COLUMN ──────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

        {/* ── TOP NAV BAR ────────────────────────────────────────────────── */}
        <header style={{
          height:          "60px",
          display:         "flex",
          alignItems:      "center",
          justifyContent:  "space-between",
          padding:         "0 28px",
          backgroundColor: "#fff",
          borderBottom:    "1px solid #E5E7EB",
          position:        "sticky",
          top:             0,
          zIndex:          30,
          flexShrink:      0,
        }}>

          {/* Left: Page title */}
          <div>
            <h1 style={{
              fontSize:    "15px",
              fontWeight:  600,
              color:       "#111827",
              margin:      0,
              lineHeight:  1,
            }}>
              {pageTitle}
            </h1>
          </div>

          {/* Right: actions */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>

            {/* Search button */}
            <button style={{
              width:           "36px",
              height:          "36px",
              borderRadius:    "8px",
              border:          "1px solid #E5E7EB",
              backgroundColor: "#fff",
              display:         "flex",
              alignItems:      "center",
              justifyContent:  "center",
              cursor:          "pointer",
              color:           "#6B7280",
            }}>
              <Search size={16} />
            </button>

            {/* Role badge */}
            <div style={{
              fontSize:        "11.5px",
              fontWeight:      600,
              padding:         "4px 10px",
              borderRadius:    "20px",
              border:          `1px solid ${ROLE_COLORS[user.role]}30`,
              color:           ROLE_COLORS[user.role],
              backgroundColor: `${ROLE_COLORS[user.role]}10`,
            }}>
              {ROLE_LABELS[user.role]}
            </div>

            {/* Bell / Notifications */}
            <div style={{ position: "relative" }}>
              <button
                onClick={() => { setShowNotifs(!showNotifs); setShowUserMenu(false); }}
                style={{
                  width:           "36px",
                  height:          "36px",
                  borderRadius:    "8px",
                  border:          "1px solid #E5E7EB",
                  backgroundColor: "#fff",
                  display:         "flex",
                  alignItems:      "center",
                  justifyContent:  "center",
                  cursor:          "pointer",
                  color:           "#6B7280",
                  position:        "relative",
                }}
              >
                <Bell size={16} />
                {unreadCount > 0 && (
                  <span style={{
                    position:        "absolute",
                    top:             "7px",
                    right:           "7px",
                    width:           "8px",
                    height:          "8px",
                    borderRadius:    "50%",
                    backgroundColor: "#EF4444",
                    border:          "1.5px solid #fff",
                  }} />
                )}
              </button>

              {/* Notifications dropdown */}
              {showNotifs && (
                <div style={{
                  position:        "absolute",
                  top:             "calc(100% + 8px)",
                  right:           0,
                  width:           "360px",
                  backgroundColor: "#fff",
                  border:          "1px solid #E5E7EB",
                  borderRadius:    "10px",
                  boxShadow:       "0 8px 32px rgba(0,0,0,0.10)",
                  zIndex:          50,
                  overflow:        "hidden",
                }}>
                  <div style={{
                    display:        "flex",
                    justifyContent: "space-between",
                    alignItems:     "center",
                    padding:        "14px 16px",
                    borderBottom:   "1px solid #E5E7EB",
                  }}>
                    <span style={{ fontWeight: 600, fontSize: "14px", color: "#111827" }}>
                      Notifications
                    </span>
                    {unreadCount > 0 && (
                      <button
                        onClick={() => markAsRead()}
                        style={{
                          fontSize:   "12px",
                          color:      "#1A56DB",
                          background: "none",
                          border:     "none",
                          cursor:     "pointer",
                          fontWeight: 500,
                        }}
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                    {notifications.length === 0 ? (
                      <p style={{
                        fontSize:   "13px",
                        color:      "#6B7280",
                        textAlign:  "center",
                        padding:    "20px 16px",
                        margin:     0,
                      }}>
                        No notifications yet.
                      </p>
                    ) : (
                      notifications.map(n => (
                        <div
                          key={n.id}
                          onClick={() => !n.isRead && markAsRead(n.id)}
                          style={{
                            padding:         "12px 16px",
                            borderBottom:    "1px solid #F3F4F6",
                            cursor:          n.isRead ? "default" : "pointer",
                            backgroundColor: n.isRead ? "#fff" : "#EFF6FF",
                            transition:      "background-color 0.15s",
                          }}
                        >
                          <p style={{
                            fontSize:   "13px",
                            color:      n.isRead ? "#6B7280" : "#111827",
                            lineHeight: 1.45,
                            fontWeight: n.isRead ? 400 : 600,
                            margin:     0,
                          }}>
                            {n.text}
                          </p>
                          <div style={{
                            display:    "flex",
                            alignItems: "center",
                            gap:        "5px",
                            marginTop:  "5px",
                            fontSize:   "11px",
                            color:      "#9CA3AF",
                          }}>
                            <Clock size={11} color="#9CA3AF" />
                            <span>{formatNotificationDate(n.createdAt)}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User avatar + name dropdown */}
            <div style={{ position: "relative" }}>
              <button
                onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifs(false); }}
                style={{
                  display:         "flex",
                  alignItems:      "center",
                  gap:             "8px",
                  padding:         "5px 10px 5px 5px",
                  borderRadius:    "8px",
                  border:          "1px solid #E5E7EB",
                  backgroundColor: "#fff",
                  cursor:          "pointer",
                  height:          "36px",
                }}
              >
                <div style={{
                  width:           "26px",
                  height:          "26px",
                  borderRadius:    "6px",
                  backgroundColor: ROLE_COLORS[user.role],
                  display:         "flex",
                  alignItems:      "center",
                  justifyContent:  "center",
                  fontSize:        "11px",
                  fontWeight:      700,
                  color:           "#fff",
                }}>
                  {user.initials}
                </div>
                <span style={{ fontSize: "13px", fontWeight: 500, color: "#111827" }}>
                  {user.name.split(" ")[0]}
                </span>
                <ChevronDown size={13} color="#6B7280" />
              </button>

              {showUserMenu && (
                <div style={{
                  position:        "absolute",
                  top:             "calc(100% + 8px)",
                  right:           0,
                  width:           "180px",
                  backgroundColor: "#fff",
                  border:          "1px solid #E5E7EB",
                  borderRadius:    "10px",
                  boxShadow:       "0 8px 32px rgba(0,0,0,0.10)",
                  zIndex:          50,
                  overflow:        "hidden",
                  padding:         "6px",
                }}>
                  <button
                    onClick={handleLogout}
                    style={{
                      display:         "flex",
                      alignItems:      "center",
                      gap:             "8px",
                      width:           "100%",
                      padding:         "9px 12px",
                      borderRadius:    "6px",
                      border:          "none",
                      backgroundColor: "transparent",
                      color:           "#EF4444",
                      fontSize:        "13px",
                      fontWeight:      500,
                      cursor:          "pointer",
                      textAlign:       "left",
                    }}
                  >
                    <LogOut size={14} />
                    Logout
                  </button>
                </div>
              )}
            </div>

          </div>
        </header>

        {/* ── PAGE CONTENT ───────────────────────────────────────────────── */}
        <main style={{
          flex:       1,
          padding:    "24px",
          overflowY:  "auto",
          backgroundColor: "#F5F7FB",
        }}>
          {children}
        </main>
      </div>
    </div>
  );
}
