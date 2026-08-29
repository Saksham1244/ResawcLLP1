"use client";

import { Users, CheckSquare, TrendingUp, Activity, ArrowRight, Sparkles, Clock, Shield, Flame, Compass } from "lucide-react";
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
    {
      id: 'leads',
      label: "ACTIVE LEADS",
      value: loading ? "--" : data.activeLeads.toString(),
      trend: "+12% this month",
      trendPositive: true,
      icon: TrendingUp,
      color: "#6366F1",
      glow: "rgba(99, 102, 241, 0.25)",
      href: "/dashboard/leads",
      show: user.role !== 'editor'
    },
    {
      id: 'tasks',
      label: "PENDING TASKS",
      value: loading ? "--" : data.pendingTasks.toString(),
      trend: data.pendingTasks > 0 ? "Requires attention" : "All cleared",
      trendPositive: data.pendingTasks === 0,
      icon: CheckSquare,
      color: "#F59E0B",
      glow: "rgba(245, 158, 11, 0.25)",
      href: "/dashboard/tasks",
      show: true
    },
    {
      id: 'team',
      label: "ACTIVE TEAM MEMBERS",
      value: loading ? "--" : data.teamMembers.toString(),
      trend: "Operational",
      trendPositive: true,
      icon: Users,
      color: "#10B981",
      glow: "rgba(16, 185, 129, 0.25)",
      href: "/dashboard/team",
      show: user.role === 'admin'
    },
    {
      id: 'status',
      label: "SYSTEM RADAR",
      value: "99.8%",
      trend: "All systems online",
      trendPositive: true,
      icon: Activity,
      color: "#8B5CF6",
      glow: "rgba(139, 92, 246, 0.25)",
      href: "/dashboard/monitor",
      show: true
    },
  ].filter(s => s.show);

  return (
    <div className="animate-fadeIn" style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Leonar-Style Radiant Welcome Banner */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass-card"
        style={{
          padding: '2.25rem 2rem',
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(139, 92, 246, 0.05) 50%, rgba(14, 15, 21, 0.8) 100%)',
          border: '1px solid rgba(99, 102, 241, 0.2)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.5rem'
        }}
      >
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.25rem 0.75rem', borderRadius: '999px', background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.3)', color: 'var(--primary-2)', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
            <Sparkles size={13} /> RESAWC CORE WORKSPACE
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 0.5rem 0' }}>
            {greeting}, {user.name} 👋
          </h1>
          <p className="text-muted text-sm" style={{ margin: 0, maxWidth: '520px' }}>
            Here is your live team telemetry, task queue, and CRM performance overview for today.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <a
            href="/attendance"
            target="_blank"
            rel="noreferrer"
            className="btn btn-secondary"
            style={{
              borderRadius: 'var(--radius-md)',
              padding: '0.7rem 1.25rem',
              fontWeight: 700,
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'rgba(16, 185, 129, 0.1)',
              borderColor: 'rgba(16, 185, 129, 0.3)',
              color: '#10B981'
            }}
          >
            <Clock size={16} /> Web Punch-In
          </a>

          {user.role === 'admin' && (
            <Link
              href="/dashboard/monitor"
              className="btn btn-primary"
              style={{
                borderRadius: 'var(--radius-md)',
                padding: '0.7rem 1.25rem',
                fontWeight: 700,
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <Flame size={16} /> Live Team Radar
            </Link>
          )}
        </div>
      </motion.div>

      {/* Radiant Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.id}
              className="stat-card-radiant"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
            >
              <div className="flex-between" style={{ marginBottom: '1.25rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--muted)', letterSpacing: '0.08em' }}>
                  {stat.label}
                </span>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: stat.glow,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: stat.color,
                  border: `1px solid ${stat.color}40`
                }}>
                  <Icon size={19} />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '2.4rem', fontWeight: 800, letterSpacing: '-0.04em', fontFamily: 'var(--font-display)', lineHeight: 1 }}>
                  {stat.value}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '0.75rem', borderTop: '1px solid var(--surface-border)' }}>
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: stat.trendPositive ? '#10B981' : '#F59E0B'
                }}>
                  {stat.trend}
                </span>
                <Link href={stat.href} style={{ color: 'var(--primary-2)', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                  View <ArrowRight size={12} />
                </Link>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Split Widget Row: Quick Access & Live Activity Feed */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
        {/* Quick Hub Navigation Card */}
        <div className="glass-card">
          <div className="flex-between" style={{ marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Compass size={18} color="var(--primary-2)" /> Workspace Hub
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {user.role !== 'editor' && (
              <Link href="/dashboard/leads" className="glass-card" style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', textDecoration: 'none', background: 'var(--surface-solid)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.15)', color: '#6366F1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <TrendingUp size={18} />
                  </div>
                  <div>
                    <p style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0 }}>Lead Management & CRM</p>
                    <p className="text-muted" style={{ fontSize: '0.75rem', margin: 0 }}>Round-robin leads & call outcome logs</p>
                  </div>
                </div>
                <ArrowRight size={16} color="var(--muted)" />
              </Link>
            )}

            <Link href="/dashboard/tasks" className="glass-card" style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', textDecoration: 'none', background: 'var(--surface-solid)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckSquare size={18} />
                </div>
                <div>
                  <p style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0 }}>Production & Tasks</p>
                  <p className="text-muted" style={{ fontSize: '0.75rem', margin: 0 }}>Active editor queues & deliverables</p>
                </div>
              </div>
              <ArrowRight size={16} color="var(--muted)" />
            </Link>

            <Link href="/dashboard/attendance" className="glass-card" style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', textDecoration: 'none', background: 'var(--surface-solid)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Clock size={18} />
                </div>
                <div>
                  <p style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0 }}>Attendance & Leaves</p>
                  <p className="text-muted" style={{ fontSize: '0.75rem', margin: 0 }}>Monthly report, check-ins, and leave requests</p>
                </div>
              </div>
              <ArrowRight size={16} color="var(--muted)" />
            </Link>
          </div>
        </div>

        {/* Live Activity & Updates */}
        <div className="glass-card">
          <div className="flex-between" style={{ marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Activity size={18} color="var(--primary-2)" /> Live Activity Stream
            </h3>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#10B981', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10B981', boxShadow: '0 0 8px #10B981' }} /> Live
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {data.recentActivity.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--secondary-foreground)' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--surface-solid)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem' }}>
                  <Shield size={22} color="var(--muted)" />
                </div>
                <p style={{ fontSize: '0.9rem', fontWeight: 700, margin: '0 0 0.25rem 0' }}>All Caught Up</p>
                <p className="text-muted" style={{ fontSize: '0.78rem', margin: 0 }}>System events and lead conversions will stream here automatically.</p>
              </div>
            ) : data.recentActivity.map((item: any, i: number) => (
              <div 
                key={i} 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--surface-solid)',
                  border: '1px solid var(--surface-border)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: item.color || 'var(--primary)', boxShadow: `0 0 8px ${item.color || 'var(--primary)'}` }} />
                  <p style={{ fontSize: '0.85rem', margin: 0, fontWeight: 500 }}>
                    {item.text} <span style={{ color: item.color || 'var(--primary)', fontWeight: 700 }}>{item.highlight}</span>
                  </p>
                </div>
                <span className="text-muted" style={{ fontSize: '0.75rem' }}>{item.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
