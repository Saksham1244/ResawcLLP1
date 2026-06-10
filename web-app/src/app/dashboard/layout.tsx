"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Users, CheckSquare, MessageSquare,
  Settings, LogOut, Bell, TrendingUp, ChevronDown, CalendarCheck, Activity
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useRole, UserRole } from "@/context/RoleContext";
import { useState } from "react";

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
  const pathname = usePathname();
  const router = useRouter();
  const { user, setRole } = useRole();
  const [showRolePicker, setShowRolePicker] = useState(false);

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
    <div style={{ display: 'flex', minHeight: '100vh' }}>

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
          <Link href="/" style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            padding: '0.65rem 0.75rem', borderRadius: 'var(--radius-sm)',
            color: 'var(--destructive)', fontWeight: 500, fontSize: '0.875rem',
          }}>
            <LogOut size={17} /> Logout
          </Link>
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

          {/* Role Switcher (for demo/dev purposes) */}
          <div style={{ position: 'relative', marginRight: '0.5rem' }}>
            <button
              onClick={() => setShowRolePicker(p => !p)}
              className="btn btn-secondary"
              style={{ fontSize: '0.78rem', gap: '0.4rem', padding: '0.4rem 0.8rem', border: `1px solid ${ROLE_COLORS[user.role]}50`, color: ROLE_COLORS[user.role] }}
            >
              {ROLE_LABELS[user.role]} <ChevronDown size={13} />
            </button>

            {showRolePicker && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 0.5rem)', right: 0,
                background: 'var(--glass-bg)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid var(--surface-border)', borderRadius: 'var(--radius-md)',
                padding: '0.5rem', zIndex: 50, minWidth: '170px',
                boxShadow: 'var(--shadow-lg)',
              }}>
                <p style={{ fontSize: '0.65rem', color: 'var(--secondary-foreground)', padding: '0.25rem 0.5rem 0.5rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
                  Switch Role (Demo)
                </p>
                {(["admin", "marketing", "editor"] as UserRole[]).map(r => (
                  <button key={r} onClick={() => { setRole(r); setShowRolePicker(false); if (r === "editor") router.push("/dashboard/tasks"); else router.push("/dashboard"); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.6rem', width: '100%',
                      padding: '0.55rem 0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem',
                      background: user.role === r ? `${ROLE_COLORS[r]}20` : 'transparent',
                      color: user.role === r ? ROLE_COLORS[r] : 'var(--foreground)',
                      fontWeight: user.role === r ? 700 : 500,
                      transition: 'background var(--transition-fast)',
                    }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: ROLE_COLORS[r], flexShrink: 0 }} />
                    {ROLE_LABELS[r]}
                  </button>
                ))}
              </div>
            )}
          </div>

          <ThemeToggle />

          <button className="btn btn-ghost" style={{ width: '36px', height: '36px', padding: 0, position: 'relative' }}>
            <Bell size={18} />
            <span style={{ position: 'absolute', top: '6px', right: '6px', width: '7px', height: '7px', borderRadius: '50%', background: 'var(--destructive)', border: '1.5px solid var(--background)' }} />
          </button>

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
  );
}
