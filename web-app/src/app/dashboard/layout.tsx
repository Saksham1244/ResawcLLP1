"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard, Users, CheckSquare, MessageSquare,
  Settings, LogOut, Bell, TrendingUp, ChevronDown, CalendarCheck, Activity
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useRole, UserRole } from "@/context/RoleContext";

// Role-based nav config
const NAV_BY_ROLE: Record<UserRole, { name: string; href: string; icon: any }[]> = {
  admin: [
    { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { name: "Team & Members", href: "/dashboard/team", icon: Users },
    { name: "Leads", href: "/dashboard/leads", icon: TrendingUp },
    { name: "Tasks", href: "/dashboard/tasks", icon: CheckSquare },
    { name: "Attendance", href: "/dashboard/attendance", icon: CalendarCheck },
    { name: "Live Monitor", href: "/dashboard/monitor", icon: Activity },
    { name: "Messages", href: "/dashboard/chat", icon: MessageSquare },
  ],
  marketing: [
    { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { name: "My Leads", href: "/dashboard/leads", icon: TrendingUp },
    { name: "Tasks", href: "/dashboard/tasks", icon: CheckSquare },
    { name: "Attendance", href: "/dashboard/attendance", icon: CalendarCheck },
    { name: "Messages", href: "/dashboard/chat", icon: MessageSquare },
  ],
  editor: [
    { name: "My Tasks", href: "/dashboard/tasks", icon: CheckSquare },
    { name: "Attendance", href: "/dashboard/attendance", icon: CalendarCheck },
    { name: "Messages", href: "/dashboard/chat", icon: MessageSquare },
  ],
};

const ROLE_COLORS: Record<UserRole, string> = {
  admin: "#f43f5e",
  marketing: "#6366f1",
  editor: "#10b981",
};

const ROLE_LABELS: Record<UserRole, string> = {
  admin: "👑 Admin",
  marketing: "📞 Marketing",
  editor: "🎬 Editor",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isHydrated } = useRole();
  const pathname = usePathname();
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);

  useEffect(() => {
    if (!user || !user.id) return;
    const fetchNotifs = async () => {
      try {
        const res = await fetch(`/api/notifications?userId=${user.id}`);
        const data = await res.json();
        if (data.success) setNotifications(data.data);
      } catch (e) {}
    };
    fetchNotifs();
    const int = setInterval(fetchNotifs, 10000);
    return () => clearInterval(int);
  }, [user]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAsRead = async (id?: string) => {
    try {
      await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(id ? { notificationId: id } : { userId: user?.id })
      });
      setNotifications(prev => prev.map(n => id ? (n.id === id ? { ...n, isRead: true } : n) : { ...n, isRead: true }));
    } catch {}
  };

  if (!isHydrated) return null;
  if (!user) {
    if (typeof window !== "undefined") router.replace("/");
    return null;
  }
  
  const navItems = NAV_BY_ROLE[user.role];

  // Guard: if editor tries to access leads, redirect to tasks
  if (user.role === "editor" && pathname.startsWith("/dashboard/leads")) {
    if (typeof window !== "undefined") router.replace("/dashboard/tasks");
    return null;
  }

  // Guard: if editor tries to access team management, redirect to tasks
  if (user.role === "editor" && pathname.startsWith("/dashboard/team")) {
    if (typeof window !== "undefined") router.replace("/dashboard/tasks");
    return null;
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', backgroundColor: 'var(--background-2)', minHeight: '100vh' }}>
      <div style={{ display: 'flex', width: '100%', maxWidth: '1440px', backgroundColor: 'var(--background)', boxShadow: 'var(--shadow-lg)', position: 'relative' }}>

      {/* Sidebar */}
      <aside style={{
        width: '240px', flexShrink: 0,
        display: 'flex', flexDirection: 'column', padding: '1.5rem 1rem',
        borderRight: '1px solid var(--surface-border)',
        background: 'var(--overlay-bg)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        position: 'sticky', top: 0, height: '100vh', overflowY: 'auto',
      }}>

        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.25rem 0.5rem', marginBottom: '2.5rem' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
            boxShadow: '0 4px 14px var(--primary-glow)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem'
          }}>⚡</div>
          <span style={{ fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-0.02em' }}>Resawc Core</span>
        </div>

        {/* Role Badge in sidebar */}
        <div style={{
          background: `${ROLE_COLORS[user.role]}15`,
          border: `1px solid ${ROLE_COLORS[user.role]}40`,
          borderRadius: 'var(--radius-sm)',
          padding: '0.6rem 0.75rem',
          marginBottom: '1.5rem',
          display: 'flex', alignItems: 'center', gap: '0.6rem',
        }}>
          <div style={{
            width: '30px', height: '30px', borderRadius: '8px', flexShrink: 0,
            background: `linear-gradient(135deg, ${ROLE_COLORS[user.role]}, ${ROLE_COLORS[user.role]}99)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.7rem', fontWeight: 700, color: '#fff',
          }}>{user.initials}</div>
          <div style={{ minWidth: 0 }}>
            <p className="text-sm font-semibold" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</p>
            <p style={{ fontSize: '0.7rem', color: ROLE_COLORS[user.role], fontWeight: 600 }}>{ROLE_LABELS[user.role]}</p>
          </div>
        </div>

        {/* Nav section label */}
        <p className="text-xs font-semibold text-muted" style={{ padding: '0 0.5rem', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {user.role === "editor" ? "My Workspace" : "Main"}
        </p>

        {/* Nav Items */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1 }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link key={item.name} href={item.href} style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.65rem 0.75rem', borderRadius: 'var(--radius-sm)',
                color: isActive ? '#fff' : 'var(--secondary-foreground)',
                background: isActive ? `linear-gradient(135deg, var(--primary), var(--primary-hover))` : 'transparent',
                boxShadow: isActive ? '0 4px 14px var(--primary-glow)' : 'none',
                fontWeight: isActive ? 600 : 500, fontSize: '0.875rem',
                transition: 'all var(--transition-fast)',
              }}>
                <Icon size={17} />
                {item.name}
              </Link>
            );
          })}

          {/* Settings — Admin only */}
          {user.role === "admin" && (
            <>
              <div style={{ height: '1px', background: 'var(--surface-border)', margin: '1rem 0.5rem' }} />
              <p className="text-xs font-semibold text-muted" style={{ padding: '0 0.5rem', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Account</p>
              <Link href="/dashboard/settings" style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.65rem 0.75rem', borderRadius: 'var(--radius-sm)',
                color: pathname === '/dashboard/settings' ? '#fff' : 'var(--secondary-foreground)',
                background: pathname === '/dashboard/settings' ? 'linear-gradient(135deg, var(--primary), var(--primary-hover))' : 'transparent',
                fontWeight: 500, fontSize: '0.875rem', transition: 'all var(--transition-fast)',
              }}>
                <Settings size={17} /> Settings
              </Link>
            </>
          )}
        </nav>

        {/* Logout */}
        <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--surface-border)' }}>
          <button
            onClick={() => {
              localStorage.removeItem('userId');
              localStorage.removeItem('userEmail');
              localStorage.removeItem('userName');
              localStorage.removeItem('userRole');
              router.replace('/');
            }}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: '0.65rem 0.75rem', borderRadius: 'var(--radius-sm)',
              color: 'var(--destructive)', fontWeight: 500, fontSize: '0.875rem',
              background: 'none', border: 'none', cursor: 'pointer', width: '100%',
            }}
          >
            <LogOut size={17} /> Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* Topbar */}
        <header style={{
          height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
          padding: '0 2rem', gap: '0.75rem',
          borderBottom: '1px solid var(--surface-border)',
          background: 'var(--overlay-bg)',
          backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          position: 'sticky', top: 0, zIndex: 30,
        }}>

          {/* Role Badge (read-only) */}
          <div style={{
            fontSize: '0.78rem', fontWeight: 700,
            padding: '0.4rem 0.85rem', borderRadius: '20px',
            border: `1px solid ${ROLE_COLORS[user.role]}50`,
            color: ROLE_COLORS[user.role],
            background: `${ROLE_COLORS[user.role]}12`,
          }}>
            {ROLE_LABELS[user.role]}
          </div>

          <ThemeToggle />

          <div style={{ position: 'relative' }}>
            <button onClick={() => setShowNotifs(!showNotifs)} className="btn btn-ghost" style={{ width: '36px', height: '36px', padding: 0, position: 'relative' }}>
              <Bell size={18} />
              {unreadCount > 0 && <span style={{ position: 'absolute', top: '6px', right: '6px', width: '7px', height: '7px', borderRadius: '50%', background: 'var(--destructive)', border: '1.5px solid var(--background)' }} />}
            </button>
            {showNotifs && (
              <div className="glass-card animate-fadeIn" style={{ position: 'absolute', top: '100%', right: 0, width: '320px', padding: '1rem', zIndex: 50, marginTop: '0.5rem', boxShadow: '0 10px 40px rgba(0,0,0,0.3)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Notifications</h3>
                  {unreadCount > 0 && <button onClick={() => markAsRead()} style={{ fontSize: '0.75rem', color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Mark all read</button>}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '300px', overflowY: 'auto' }}>
                  {notifications.length === 0 ? (
                    <p style={{ fontSize: '0.8rem', color: 'var(--muted)', textAlign: 'center', padding: '1rem 0' }}>No notifications yet.</p>
                  ) : notifications.map(n => (
                    <div key={n.id} onClick={() => !n.isRead && markAsRead(n.id)} style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', background: n.isRead ? 'transparent' : 'var(--overlay-bg)', border: n.isRead ? '1px solid transparent' : '1px solid var(--surface-border)', cursor: n.isRead ? 'default' : 'pointer' }}>
                      <p style={{ fontSize: '0.8rem', color: n.isRead ? 'var(--secondary-foreground)' : 'var(--foreground)', lineHeight: 1.4, fontWeight: n.isRead ? 500 : 600 }}>{n.text}</p>
                      <span style={{ fontSize: '0.65rem', color: 'var(--muted)', marginTop: '0.25rem', display: 'block' }}>{new Date(n.createdAt).toLocaleTimeString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div style={{
            width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer',
            background: `linear-gradient(135deg, ${ROLE_COLORS[user.role]}, var(--primary))`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: '0.8rem', color: '#fff',
            boxShadow: `0 4px 12px ${ROLE_COLORS[user.role]}50`,
          }}>{user.initials}</div>
        </header>

        {/* Page content */}
        <div style={{ padding: '2rem', flex: 1, overflowY: 'auto' }}>
          {children}
        </div>
      </div>
      </div>
    </div>
  );
}
