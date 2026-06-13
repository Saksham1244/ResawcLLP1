"use client";

import { Users, CheckSquare, TrendingUp, Activity, ArrowUpRight, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRole } from "@/context/RoleContext";

function getGreeting() {
  const hour = new Date().toLocaleTimeString('en-US', { hour12: false, hour: 'numeric', timeZone: 'Asia/Kolkata' });
  const h = parseInt(hour, 10);
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function DashboardOverview() {
  const { user } = useRole();
  if (!user) return null;
  const greeting = getGreeting();
  // Editor-specific simplified view
  if (user.role === "editor") {
    return (
      <div className="animate-fadeIn">
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>
            Welcome, {user.name} 🎬
          </h1>
          <p className="text-muted text-sm">Here's your editor workspace for today.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', maxWidth: '600px' }}>
          <Link href="/dashboard/tasks" className="glass-card" style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckSquare size={22} color="#f59e0b" />
            </div>
            <div>
              <p className="font-bold">My Tasks</p>
              <p className="text-xs text-muted" style={{ marginTop: '0.2rem' }}>View and update your assigned tasks</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--primary-2)', fontSize: '0.8rem', fontWeight: 600 }}>
              Go to Tasks <ArrowRight size={13} />
            </div>
          </Link>

          <Link href="/dashboard/chat" className="glass-card" style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(6,182,212,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={22} color="#06b6d4" />
            </div>
            <div>
              <p className="font-bold">Team Chat</p>
              <p className="text-xs text-muted" style={{ marginTop: '0.2rem' }}>Message teammates and stay in sync</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--primary-2)', fontSize: '0.8rem', fontWeight: 600 }}>
              Open Chat <ArrowRight size={13} />
            </div>
          </Link>
        </div>
      </div>
    );
  }

  // Marketing-specific view (no team management or full stats)
  if (user.role === "marketing") {
    return (
      <div className="animate-fadeIn">
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>
            {greeting}, {user.name} 📞
          </h1>
          <p className="text-muted text-sm">Your leads and tasks for today.</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', maxWidth: '400px' }}>
          {[
            { label: '📋 My Leads', href: '/dashboard/leads', primary: true },
            { label: '✅ My Tasks', href: '/dashboard/tasks', primary: false },
            { label: '💬 Team Chat', href: '/dashboard/chat', primary: false },
          ].map((a, i) => (
            <Link key={i} href={a.href} className={a.primary ? 'btn btn-primary' : 'btn btn-secondary'}
              style={{ justifyContent: 'space-between', padding: '0.75rem 1rem' }}>
              <span>{a.label}</span><ArrowRight size={15} />
            </Link>
          ))}
        </div>
      </div>
    );
  }

  // Admin full view
  const stats = [
    { label: "Active Leads", value: "0", delta: "No leads yet", icon: TrendingUp, color: "#6366f1", glow: "rgba(99,102,241,0.3)" },
    { label: "Pending Tasks", value: "0", delta: "No tasks assigned", icon: CheckSquare, color: "#f59e0b", glow: "rgba(245,158,11,0.3)" },
    { label: "Team Members", value: "0", sub: "", icon: Users, color: "#10b981", glow: "rgba(16,185,129,0.3)" },
    { label: "System Status", value: "Live", delta: "All systems operational", icon: Activity, color: "#a78bfa", glow: "rgba(167,139,250,0.3)" },
  ];

  const recentActivity: { text: string; highlight: string; time: string; color: string }[] = [];


  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div className="flex-between" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>
            {greeting}, {user.name} 👋
          </h1>
          <p className="text-muted text-sm">Here's what's happening at Resawc LLP today.</p>
        </div>
        <span className="badge badge-success" style={{ fontSize: '0.8rem', padding: '0.4rem 0.9rem' }}>🟢 All Systems Operational</span>
      </div>

      {/* Stats Grid */}
      <div className="animate-children" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="stat-card">
              <div className="flex-between" style={{ marginBottom: '1.25rem' }}>
                <p className="text-sm font-medium text-muted">{stat.label}</p>
                <div style={{
                  width: '40px', height: '40px', borderRadius: 'var(--radius-sm)',
                  background: `${stat.glow}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: stat.color,
                }}>
                  <Icon size={20} />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
                <span style={{ fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1 }}>{stat.value}</span>
                {stat.sub && <span className="text-muted font-medium">{stat.sub}</span>}
              </div>
              {stat.delta && <p className="text-xs text-muted" style={{ marginTop: '0.5rem' }}>{stat.delta}</p>}
            </div>
          );
        })}
      </div>

      {/* Bottom Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '1.5rem' }}>

        {/* Recent Activity */}
        <div className="glass-card">
          <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
            <h3 className="font-bold" style={{ fontSize: '1rem' }}>Recent Activity</h3>
            <button className="btn btn-ghost text-xs" style={{ padding: '0.3rem 0.7rem' }}>View all</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            {recentActivity.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--secondary-foreground)' }}>
                <p style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>📭</p>
                <p className="text-sm">No activity yet. Actions will appear here as you use the platform.</p>
              </div>
            ) : recentActivity.map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: item.color, flexShrink: 0, boxShadow: `0 0 6px ${item.color}` }} />
                <p className="text-sm" style={{ flex: 1 }}>
                  {item.text}{' '}
                  <span style={{ color: item.color, fontWeight: 600 }}>{item.highlight}</span>
                </p>
                <span className="text-xs text-muted" style={{ flexShrink: 0 }}>{item.time}</span>
              </div>
            ))}
          </div>

        </div>

        {/* Quick Actions */}
        <div className="glass-card">
          <h3 className="font-bold" style={{ fontSize: '1rem', marginBottom: '1.25rem' }}>Quick Actions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {[
              { label: '📤 Upload Leads (Excel)', href: '/dashboard/leads', primary: true },
              { label: '✅ Assign New Task', href: '/dashboard/tasks', primary: false },
              { label: '👤 Add Team Member', href: '/dashboard/team', primary: false },
              { label: '💬 Open Chat', href: '/dashboard/chat', primary: false },
            ].map((a, i) => (
              <Link
                key={i}
                href={a.href}
                className={a.primary ? 'btn btn-primary' : 'btn btn-secondary'}
                style={{ width: '100%', justifyContent: 'space-between', padding: '0.65rem 0.875rem' }}
              >
                <span>{a.label}</span>
                <ArrowRight size={15} />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
