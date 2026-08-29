"use client";

import { useState, useEffect } from "react";
import { useRole } from "@/context/RoleContext";
import { RoleGuard } from "@/components/RoleGuard";
import { Activity, Clock, Monitor, AppWindow, Play, Pause, AlertTriangle, Flame, Shield, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

type PCActivity = {
  id: number;
  name: string;
  role: string;
  status: "Active" | "Idle" | "Offline";
  idleTime?: string;
  currentApp: string;
  appTitle: string;
  productivity: number;
  lastScreenshot: string;
  appHistory?: any[];
  dailyAppUsage?: Record<string, number>;
};

export default function LiveMonitorPage() {
  const { user } = useRole();
  if (!user) return null;
  const [activities, setActivities] = useState<PCActivity[]>([]);
  const [lastSync, setLastSync] = useState("Just now");

  const fetchActivities = async () => {
    try {
      const res = await fetch('/api/monitor/sync');
      const data = await res.json();
      if (data.success) {
        setActivities(data.data);
        setLastSync(new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      }
    } catch (e) {
      console.error('Error fetching activities:', e);
    }
  };

  useEffect(() => {
    fetchActivities();
    const interval = setInterval(fetchActivities, 10000);
    return () => clearInterval(interval);
  }, []);

  const activeCount = activities.filter(a => a.status === 'Active').length;
  const idleCount = activities.filter(a => a.status === 'Idle').length;

  return (
    <RoleGuard allowedRoles={["admin"]}>
      <div className="animate-fadeIn" style={{ maxWidth: '1360px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* Top Header */}
        <div className="flex-between" style={{ flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.25rem 0.75rem', borderRadius: '999px', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#10B981', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10B981', boxShadow: '0 0 8px #10B981' }} /> LIVE TELEMETRY RADAR
            </div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 0.25rem 0' }}>
              Team Productivity & Activity Monitor
            </h1>
            <p className="text-muted text-sm" style={{ margin: 0 }}>
              Live application tracking, strict whitelist scoring, and Windows idle time surveillance.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.75rem', background: 'var(--surface-solid)', padding: '0.4rem 0.85rem', borderRadius: 'var(--radius-full)', border: '1px solid var(--surface-border)' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#10B981' }}>{activeCount} Active</span>
              <span style={{ color: 'var(--surface-border)' }}>|</span>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#F59E0B' }}>{idleCount} Idle</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.25)', padding: '0.45rem 0.95rem', borderRadius: 'var(--radius-full)', color: 'var(--primary-2)', fontWeight: 600, fontSize: '0.8rem' }}>
              <Clock size={14} /> Synced: {lastSync}
            </div>
          </div>
        </div>

        {/* Live Team Grid */}
        {activities.length === 0 ? (
          <div className="glass-card" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(99,102,241,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
              <Monitor size={28} color="var(--primary)" />
            </div>
            <h3 style={{ fontWeight: 800, fontSize: '1.2rem', marginBottom: '0.5rem' }}>No Connected PC Trackers</h3>
            <p className="text-muted text-sm" style={{ maxWidth: '440px', margin: '0 auto 1.5rem', lineHeight: 1.6 }}>
              Launch <strong>agent.py</strong> or <strong>Resawc_PC_Tracker.exe</strong> on team workstations to begin streaming live productivity and active applications.
            </p>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 'var(--radius-full)', padding: '0.5rem 1.25rem', color: '#F59E0B', fontSize: '0.8rem', fontWeight: 600 }}>
              <AlertTriangle size={14} /> Telemetry service listening on /api/monitor/sync
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' }}>
            {activities.map((act) => {
              const isActive = act.status === 'Active';
              const isIdle = act.status === 'Idle';
              const statusColor = isActive ? '#10B981' : isIdle ? '#F59E0B' : '#94A3B8';

              return (
                <div 
                  key={act.id} 
                  className="stat-card-radiant"
                  style={{
                    padding: 0,
                    overflow: 'hidden',
                    borderColor: isActive ? 'rgba(16, 185, 129, 0.3)' : isIdle ? 'rgba(245, 158, 11, 0.3)' : 'var(--surface-border)'
                  }}
                >
                  {/* Card Header */}
                  <div style={{ padding: '1.25rem 1.5rem', background: 'var(--surface-solid)', borderBottom: '1px solid var(--surface-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h3 style={{ fontWeight: 800, fontSize: '1.05rem', margin: 0, color: 'var(--foreground)' }}>{act.name}</h3>
                      <p className="text-muted" style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, margin: '0.15rem 0 0 0' }}>
                        {act.role}
                      </p>
                    </div>

                    <span style={{
                      padding: '0.35rem 0.75rem',
                      borderRadius: '999px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      background: `${statusColor}18`,
                      color: statusColor,
                      border: `1px solid ${statusColor}40`
                    }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: statusColor, boxShadow: `0 0 6px ${statusColor}` }} />
                      {act.status}
                      {isIdle && act.idleTime && ` (${act.idleTime})`}
                    </span>
                  </div>

                  {/* Body Content */}
                  <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                    {/* Active Application */}
                    <div>
                      <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                        Focused Application
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.4rem' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <AppWindow size={16} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontWeight: 700, fontSize: '0.88rem', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {act.currentApp || 'No app detected'}
                          </p>
                          <p className="text-muted" style={{ fontSize: '0.75rem', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {act.appTitle || '--'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Productivity Progress Bar */}
                    <div>
                      <div className="flex-between" style={{ marginBottom: '0.4rem' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                          Productivity Score
                        </span>
                        <span style={{ fontSize: '0.85rem', fontWeight: 800, color: act.productivity >= 70 ? '#10B981' : act.productivity >= 40 ? '#F59E0B' : '#F43F5E' }}>
                          {act.productivity}%
                        </span>
                      </div>
                      <div style={{ width: '100%', height: '8px', borderRadius: '999px', background: 'var(--surface-solid)', overflow: 'hidden', border: '1px solid var(--surface-border)' }}>
                        <div 
                          style={{
                            width: `${act.productivity}%`,
                            height: '100%',
                            background: act.productivity >= 70 ? 'linear-gradient(90deg, #10B981, #34D399)' : act.productivity >= 40 ? 'linear-gradient(90deg, #F59E0B, #FBBF24)' : 'linear-gradient(90deg, #F43F5E, #FB7185)',
                            borderRadius: '999px',
                            transition: 'width 0.4s ease'
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
