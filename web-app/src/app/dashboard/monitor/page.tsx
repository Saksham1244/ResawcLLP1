"use client";

import { useState, useEffect } from "react";
import { useRole } from "@/context/RoleContext";
import { RoleGuard } from "@/components/RoleGuard";
import { Activity, Clock, Monitor, AppWindow, Play, Pause, AlertTriangle, Eye, Video } from "lucide-react";

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
};

const MOCK_DATA: PCActivity[] = [
  {
    id: 1, name: "Sarah Williams", role: "Marketing", status: "Active",
    currentApp: "Google Chrome", appTitle: "Meta Business Suite - Ad Campaign Q3",
    productivity: 85, lastScreenshot: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=500&q=80"
  },
  {
    id: 2, name: "Mike Ross", role: "Video Editor", status: "Active",
    currentApp: "Adobe Premiere Pro", appTitle: "Resawc_Corporate_Video_v2.prproj",
    productivity: 92, lastScreenshot: "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=500&q=80"
  },
  {
    id: 3, name: "Jane Smith", role: "Photo Editor", status: "Idle", idleTime: "12m 45s",
    currentApp: "Adobe Photoshop", appTitle: "Client_Retouching_Final.psd",
    productivity: 45, lastScreenshot: "https://images.unsplash.com/photo-1542744094-3a31f272c490?w=500&q=80"
  },
  {
    id: 4, name: "David Miller", role: "Video Editor", status: "Offline",
    currentApp: "--", appTitle: "--",
    productivity: 0, lastScreenshot: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500&q=80"
  }
];

export default function LiveMonitorPage() {
  const { user } = useRole();
  const [activities, setActivities] = useState(MOCK_DATA);
  const [lastSync, setLastSync] = useState("Just now");

  useEffect(() => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      setLastSync(new Date().toLocaleTimeString());
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <RoleGuard allowedRoles={["admin"]}>
      <div className="animate-fadeIn">
        <div className="flex-between" style={{ marginBottom: '2.5rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Activity size={28} className="text-primary" /> Live PC Monitor
            </h1>
            <p className="text-muted text-sm">
              Real-time tracking of team activity, applications, and screen captures.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-full)', color: '#10b981', fontWeight: 600, fontSize: '0.85rem' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981', animation: 'pulse 2s infinite' }} />
            Live Sync • {lastSync}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' }}>
          {activities.map(act => (
            <div key={act.id} className="glass-card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              {/* Card Header */}
              <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--surface-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--foreground)' }}>{act.name}</h3>
                  <p className="text-xs text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginTop: '0.2rem' }}>{act.role}</p>
                </div>
                <span style={{ 
                  padding: '0.3rem 0.6rem', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem',
                  background: act.status === 'Active' ? 'rgba(16,185,129,0.15)' : act.status === 'Idle' ? 'rgba(245,158,11,0.15)' : 'rgba(161,161,199,0.15)',
                  color: act.status === 'Active' ? '#10b981' : act.status === 'Idle' ? '#f59e0b' : '#a1a1c7'
                }}>
                  {act.status === 'Active' && <Play size={10} />}
                  {act.status === 'Idle' && <Pause size={10} />}
                  {act.status === 'Offline' && <Monitor size={10} />}
                  {act.status}
                  {act.status === 'Idle' && ` (${act.idleTime})`}
                </span>
              </div>



              {/* Current App Info */}
              <div style={{ padding: '1.25rem 1.5rem', background: 'var(--surface)', flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-sm)', background: 'var(--overlay-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <AppWindow size={20} className="text-primary" />
                  </div>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <p className="text-xs text-muted" style={{ fontWeight: 600, marginBottom: '0.2rem' }}>CURRENT APP</p>
                    <p style={{ fontWeight: 700, fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{act.currentApp}</p>
                    <p className="text-xs text-muted" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{act.appTitle}</p>
                  </div>
                </div>

                {/* Productivity Bar */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.4rem' }}>
                    <span className="text-muted">Productivity Score</span>
                    <span style={{ color: act.productivity > 70 ? '#10b981' : act.productivity > 40 ? '#f59e0b' : '#ef4444' }}>{act.productivity}%</span>
                  </div>
                  <div style={{ width: '100%', height: 6, background: 'var(--surface-border)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ 
                      width: `${act.productivity}%`, height: '100%', 
                      background: act.productivity > 70 ? '#10b981' : act.productivity > 40 ? '#f59e0b' : '#ef4444',
                      transition: 'width 1s ease-in-out'
                    }} />
                  </div>
                </div>
              </div>

            </div>
          ))}
        </div>
      </div>
    </RoleGuard>
  );
}
