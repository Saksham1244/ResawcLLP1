"use client";

import { Users, CheckSquare, TrendingUp, Activity, ArrowUpRight, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
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
  const [data, setData] = useState({ activeLeads: 0, pendingTasks: 0, teamMembers: 0, recentActivity: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    fetch(`/api/overview?userId=${user.id}&role=${user.role}`)
      .then(r => r.json())
      .then(res => {
        if (res.success) setData(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [user]);

  if (!user) return null;
  const greeting = getGreeting();
  
  const stats = [
    { label: "Active Leads", value: loading ? "..." : data.activeLeads.toString(), delta: data.activeLeads > 0 ? "" : "No leads yet", icon: TrendingUp, color: "#6366f1", glow: "rgba(99,102,241,0.3)", show: user.role !== 'editor' },
    { label: "Pending Tasks", value: loading ? "..." : data.pendingTasks.toString(), delta: data.pendingTasks > 0 ? "" : "No tasks assigned", icon: CheckSquare, color: "#f59e0b", glow: "rgba(245,158,11,0.3)", show: true },
    { id: 'leads', label: "Active Leads", value: loading ? "..." : data.activeLeads.toString(), delta: data.activeLeads > 0 ? "" : "No leads yet", icon: TrendingUp, color: "#6366f1", glow: "rgba(99,102,241,0.3)", show: user.role !== 'editor' },
    { id: 'tasks', label: "Pending Tasks", value: loading ? "..." : data.pendingTasks.toString(), delta: data.pendingTasks > 0 ? "" : "No tasks assigned", icon: CheckSquare, color: "#f59e0b", glow: "rgba(245,158,11,0.3)", show: true },
    { id: 'team', label: "Team Members", value: loading ? "..." : data.teamMembers.toString(), sub: "", icon: Users, color: "#10b981", glow: "rgba(16,185,129,0.3)", show: user.role === 'admin' },
    { id: 'status', label: "System Status", value: "Live", delta: "All systems operational", icon: Activity, color: "#a78bfa", glow: "rgba(167,139,250,0.3)", show: true },
  ].filter(s => s.show);

  const renderStatsAndActivity = () => (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div 
              key={stat.id} 
              className="glass-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.5, ease: "easeOut" }}
              whileHover={{ y: -5, scale: 1.02 }}
            >
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
                {stat.sub !== undefined && <span className="text-muted font-medium">{stat.sub}</span>}
              </div>
              {stat.delta && <p className="text-xs text-muted" style={{ marginTop: '0.5rem' }}>{stat.delta}</p>}
            </motion.div>
          );
        })}
      </div>
      <div className="glass-card" style={{ marginBottom: '2rem' }}>
        <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
          <h3 className="font-bold" style={{ fontSize: '1rem' }}>Recent Activity</h3>
          <button className="btn btn-ghost text-xs" style={{ padding: '0.3rem 0.7rem' }}>View all</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          {data.recentActivity.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--secondary-foreground)' }}>
              <p style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>📭</p>
              <p className="text-sm">No activity yet. Actions will appear here as you use the platform.</p>
            </motion.div>
          ) : data.recentActivity.map((item: any, i: number) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + (i * 0.1), duration: 0.4 }}
              whileHover={{ x: 5, backgroundColor: 'rgba(255,255,255,0.5)' }}
              style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.5rem', borderRadius: '0.5rem', transition: 'background 0.2s' }}
            >
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: item.color, flexShrink: 0, boxShadow: `0 0 6px ${item.color}` }} />
              <p className="text-sm" style={{ flex: 1 }}>
                {item.text}{' '}
                <span style={{ color: item.color, fontWeight: 600 }}>{item.highlight}</span>
              </p>
              <span className="text-xs text-muted" style={{ flexShrink: 0 }}>{item.time}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </>
  );

  // Editor-specific simplified view
  if (user.role === "editor") {
    return (
      <div className="animate-fadeIn">
        <div style={{ marginBottom: '2rem' }}>
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.25rem' }}
          >
            Welcome, {user.name} 🎬
          </motion.h1>
          <p className="text-muted text-sm">Here's your editor workspace for today.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', maxWidth: '600px' }}>
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <Link href="/dashboard/tasks" className="glass-card" style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem', height: '100%' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckSquare size={22} color="#f59e0b" />
              </div>
              <div>
                <p className="font-bold">My Tasks</p>
                <p className="text-xs text-muted" style={{ marginTop: '0.2rem' }}>View and update your assigned tasks</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--primary-2)', fontSize: '0.8rem', fontWeight: 600, marginTop: 'auto' }}>
                Go to Tasks <ArrowRight size={13} />
              </div>
            </Link>
          </motion.div>

          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.4 }}>
            <Link href="/dashboard/chat" className="glass-card" style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem', height: '100%' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(6,182,212,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={22} color="#06b6d4" />
              </div>
              <div>
                <p className="font-bold">Team Chat</p>
                <p className="text-xs text-muted" style={{ marginTop: '0.2rem' }}>Message teammates and stay in sync</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--primary-2)', fontSize: '0.8rem', fontWeight: 600, marginTop: 'auto' }}>
                Open Chat <ArrowRight size={13} />
              </div>
            </Link>
          </motion.div>
        </div>
        
        <div style={{ marginTop: '2.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.5rem' }}>Your Overview</h2>
          {renderStatsAndActivity()}
        </div>
      </div>
    );
  }

  // Marketing-specific view (no team management or full stats)
  if (user.role === "marketing") {
    return (
      <div className="animate-fadeIn">
        <div style={{ marginBottom: '2rem' }}>
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.25rem' }}
          >
            {greeting}, {user.name} 📞
          </motion.h1>
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
        
        <div style={{ marginTop: '2.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.5rem' }}>Your Overview</h2>
          {renderStatsAndActivity()}
        </div>
      </div>
    );
  }

  // Admin full view
  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div className="flex-between" style={{ marginBottom: '2rem' }}>
        <div>
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.25rem' }}
          >
            {greeting}, {user.name} 👋
          </motion.h1>
          <p className="text-muted text-sm">Here's what's happening at Resawc LLP today.</p>
        </div>
        <span className="badge badge-success" style={{ fontSize: '0.8rem', padding: '0.4rem 0.9rem' }}>🟢 All Systems Operational</span>
      </div>

      {/* Stats Grid */}
      {renderStatsAndActivity()}

      {/* Bottom Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>

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
