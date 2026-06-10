"use client";

import { useState } from "react";
import { Save, User, Calendar, Bell, Shield, Palette, Database, Check, Eye, EyeOff } from "lucide-react";
import { RoleGuard } from "@/components/RoleGuard";

type Tab = "profile" | "schedule" | "notifications" | "appearance" | "security" | "database";

const TABS: { key: Tab; label: string; icon: any }[] = [
  { key: "profile",       label: "Profile",       icon: User },
  { key: "schedule",      label: "Schedule",      icon: Calendar },
  { key: "notifications", label: "Notifications",  icon: Bell },
  { key: "appearance",    label: "Appearance",     icon: Palette },
  { key: "security",      label: "Security",       icon: Shield },
  { key: "database",      label: "Database",       icon: Database },
];

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      style={{
        width: '44px', height: '24px', borderRadius: '12px', border: 'none', cursor: 'pointer',
        background: value ? 'var(--primary)' : 'var(--surface-border)',
        position: 'relative', transition: 'background var(--transition-fast)',
        flexShrink: 0,
        boxShadow: value ? '0 0 10px var(--primary-glow)' : 'none',
      }}>
      <div style={{
        position: 'absolute', top: '3px',
        left: value ? '23px' : '3px',
        width: '18px', height: '18px', borderRadius: '50%',
        background: '#fff', transition: 'left 0.2s ease',
        boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
      }} />
    </button>
  );
}

function SettingRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 0', borderBottom: '1px solid var(--surface-border)', gap: '2rem' }}>
      <div style={{ flex: 1 }}>
        <p className="font-semibold text-sm">{label}</p>
        {description && <p className="text-xs text-muted" style={{ marginTop: '0.2rem', lineHeight: 1.4 }}>{description}</p>}
      </div>
      <div style={{ flexShrink: 0 }}>{children}</div>
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="glass-card" style={{ marginBottom: '1.25rem' }}>
      <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.25rem', color: 'var(--primary-2)' }}>{title}</h3>
      <div style={{ borderTop: '1px solid var(--surface-border)', marginTop: '0.75rem' }}>{children}</div>
    </div>
  );
}

function SettingsContent() {
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [saved, setSaved] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Profile
  const [profile, setProfile] = useState({ name: "Alex Johnson", email: "alex@resawc.com", phone: "+91 98765 43210", role: "Admin", bio: "Managing the Resawc LLP creative team." });

  // Schedule
  const [schedule, setSchedule] = useState({
    activeDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    saturdayMode: "All Saturdays",
    start: "09:00",
    end: "18:00",
    breakMinutes: 30,
    graceMinutes: 15,
    lateHalfDayThreshold: 3
  });

  const toggleDay = (day: string) => {
    setSchedule(prev => ({
      ...prev,
      activeDays: prev.activeDays.includes(day)
        ? prev.activeDays.filter(d => d !== day)
        : [...prev.activeDays, day]
    }));
  };

  const calculateDuration = () => {
    if (!schedule.start || !schedule.end) return "0.0 hrs / day";
    const [h1, m1] = schedule.start.split(":").map(Number);
    const [h2, m2] = schedule.end.split(":").map(Number);
    let totalMins = (h2 * 60 + m2) - (h1 * 60 + m1) - schedule.breakMinutes;
    if (totalMins < 0) totalMins = 0;
    const hrs = totalMins / 60;
    return `${hrs.toFixed(1)} hrs / day`;
  };

  // Notifications
  const [notifs, setNotifs] = useState({
    taskAssigned: true, taskCompleted: true, newLead: true, leadConverted: true,
    chatMessage: true, dailyDigest: false, weeklyReport: true, emailAlerts: true,
  });

  // Appearance
  const [appearance, setAppearance] = useState({ accent: "#6366f1", density: "comfortable", sidebarCollapsed: false, animationsEnabled: true });

  // Security
  const [security, setSecurity] = useState({ twoFactor: false, sessionTimeout: "30", currentPassword: "", newPassword: "", confirmPassword: "" });

  // Database
  const [db, setDb] = useState({ host: "localhost", port: "5432", name: "resawc_db", user: "postgres", ssl: true, backupFreq: "daily" });

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div className="flex-between" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em' }}>System Settings</h1>
          <p className="text-muted text-sm">Manage your workspace, profile, and preferences.</p>
        </div>
        <button className="btn btn-primary" onClick={handleSave} style={{ gap: '0.5rem', minWidth: '130px' }}>
          {saved ? <><Check size={16} /> Saved!</> : <><Save size={16} /> Save Changes</>}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '1.5rem', alignItems: 'start' }}>

        {/* Sidebar Tabs */}
        <div className="glass-card" style={{ padding: '0.5rem' }}>
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.65rem', width: '100%',
                  padding: '0.65rem 0.75rem', borderRadius: 'var(--radius-sm)', marginBottom: '0.2rem',
                  background: isActive ? 'linear-gradient(135deg, var(--primary), var(--primary-hover))' : 'transparent',
                  color: isActive ? '#fff' : 'var(--secondary-foreground)',
                  fontWeight: isActive ? 600 : 500, fontSize: '0.85rem',
                  boxShadow: isActive ? '0 4px 12px var(--primary-glow)' : 'none',
                  transition: 'all var(--transition-fast)',
                }}>
                <Icon size={15} /> {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div>

          {/* ── PROFILE ── */}
          {activeTab === "profile" && (
            <>
              <SectionCard title="Personal Information">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', paddingTop: '1rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <label className="text-xs font-semibold text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>Full Name</label>
                    <input className="input" value={profile.name} placeholder="Your full name"
                      onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <label className="text-xs font-semibold text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>Email Address</label>
                    <input className="input" value={profile.email} placeholder="you@resawc.com"
                      onChange={e => setProfile(p => ({ ...p, email: e.target.value }))} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <label className="text-xs font-semibold text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>Phone Number</label>
                    <input className="input" value={profile.phone} placeholder="+91 00000 00000"
                      onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <label className="text-xs font-semibold text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>Role / Title</label>
                    <select className="input" value={profile.role} onChange={e => setProfile(p => ({ ...p, role: e.target.value }))}
                      style={{ background: 'var(--overlay-bg)', color: 'var(--foreground)' }}>
                      <option value="Admin">👑 Admin</option>
                      <option value="Marketing">📞 Marketing</option>
                      <option value="Video Editor">🎬 Video Editor</option>
                      <option value="Photo Editor">📷 Photo Editor</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '1rem' }}>
                  <label className="text-xs font-semibold text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>Bio</label>
                  <textarea className="input" rows={3} value={profile.bio}
                    onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))}
                    placeholder="Brief description about yourself…" style={{ resize: 'none', lineHeight: 1.6 }} />
                </div>
              </SectionCard>

              <SectionCard title="Avatar">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', paddingTop: '1rem' }}>
                  <div style={{
                    width: '72px', height: '72px', borderRadius: '20px', flexShrink: 0,
                    background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, fontSize: '1.5rem', color: '#fff',
                    boxShadow: '0 8px 24px var(--primary-glow)',
                  }}>AJ</div>
                  <div>
                    <p className="font-semibold text-sm">Profile Photo</p>
                    <p className="text-xs text-muted" style={{ margin: '0.25rem 0 0.75rem' }}>PNG, JPG or GIF · Max 2MB</p>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '0.35rem 0.8rem' }}>Upload Photo</button>
                      <button className="btn btn-ghost" style={{ fontSize: '0.8rem', padding: '0.35rem 0.8rem', color: 'var(--destructive)' }}>Remove</button>
                    </div>
                  </div>
                </div>
              </SectionCard>
            </>
          )}

          {/* ── SCHEDULE ── */}
          {activeTab === "schedule" && (
            <>
              <SectionCard title="Working Schedule">
                {/* Working Days */}
                <div style={{ paddingTop: '1rem', marginBottom: '1.25rem' }}>
                  <p className="font-semibold text-sm" style={{ marginBottom: '0.3rem' }}>Working Days</p>
                  <p className="text-xs text-muted" style={{ marginBottom: '0.85rem' }}>Click a day to toggle it on or off for your team schedule</p>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {[
                      { short: "Mon", full: "Monday" },
                      { short: "Tue", full: "Tuesday" },
                      { short: "Wed", full: "Wednesday" },
                      { short: "Thu", full: "Thursday" },
                      { short: "Fri", full: "Friday" },
                      { short: "Sat", full: "Saturday" },
                      { short: "Sun", full: "Sunday" },
                    ].map((d, i) => {
                      const active = schedule.activeDays.includes(d.short);
                      return (
                        <div key={d.short} onClick={() => toggleDay(d.short)} style={{
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem',
                          padding: '0.65rem 0.9rem', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                          background: active ? 'rgba(99,102,241,0.15)' : 'var(--secondary)',
                          border: active ? '1px solid rgba(99,102,241,0.5)' : '1px solid var(--surface-border)',
                          transition: 'all var(--transition-fast)', minWidth: '60px',
                        }}>
                          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: active ? 'var(--primary-2)' : 'var(--secondary-foreground)' }}>{d.short}</span>
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: active ? 'var(--primary-2)' : 'var(--surface-border)', boxShadow: active ? '0 0 6px var(--primary)' : 'none' }} />
                        </div>
                      );
                    })}
                  </div>
                  {schedule.activeDays.includes("Sat") && (
                    <div className="animate-fadeIn" style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', background: 'rgba(99,102,241,0.05)', borderRadius: 'var(--radius-md)', border: '1px dashed rgba(99,102,241,0.3)', width: 'max-content' }}>
                      <span className="text-xs font-bold" style={{ color: 'var(--primary-2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Saturday Rule:</span>
                      <select className="input" value={schedule.saturdayMode} onChange={e => setSchedule(p => ({ ...p, saturdayMode: e.target.value }))}
                        style={{ background: 'var(--overlay-bg)', color: 'var(--foreground)', width: 'auto', padding: '0.3rem 0.75rem', height: 'auto', fontSize: '0.8rem', border: '1px solid var(--surface-border)' }}>
                        <option value="All Saturdays">All Saturdays</option>
                        <option value="Odd Saturdays (1st, 3rd, 5th)">Odd Saturdays (1st, 3rd, 5th)</option>
                        <option value="Even Saturdays (2nd, 4th)">Even Saturdays (2nd, 4th)</option>
                        <option value="1st & 3rd Saturday">1st & 3rd Saturday</option>
                        <option value="2nd & 4th Saturday">2nd & 4th Saturday</option>
                      </select>
                    </div>
                  )}
                </div>

                {/* Working Hours */}
                <div style={{ borderTop: '1px solid var(--surface-border)', paddingTop: '1.1rem', display: 'flex', alignItems: 'flex-end', gap: '1.5rem', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <label className="text-xs font-semibold" style={{ color: 'var(--secondary-foreground)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Start Time</label>
                    <input className="input" type="time" value={schedule.start} onChange={e => setSchedule(prev => ({...prev, start: e.target.value}))}
                      style={{ background: 'var(--overlay-bg)', color: 'var(--foreground)', width: '140px' }} />
                  </div>
                  <span className="text-muted font-semibold" style={{ paddingBottom: '0.5rem' }}>→</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <label className="text-xs font-semibold" style={{ color: 'var(--secondary-foreground)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>End Time</label>
                    <input className="input" type="time" value={schedule.end} onChange={e => setSchedule(prev => ({...prev, end: e.target.value}))}
                      style={{ background: 'var(--overlay-bg)', color: 'var(--foreground)', width: '140px' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <label className="text-xs font-semibold" style={{ color: 'var(--secondary-foreground)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Break Duration</label>
                    <select className="input" value={schedule.breakMinutes} onChange={e => setSchedule(prev => ({...prev, breakMinutes: Number(e.target.value)}))} style={{ background: 'var(--overlay-bg)', color: 'var(--foreground)', width: '130px' }}>
                      <option value={0}>No break</option>
                      <option value={30}>30 minutes</option>
                      <option value={60}>1 hour</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <label className="text-xs font-semibold" style={{ color: 'var(--secondary-foreground)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Late Mark After</label>
                    <select className="input" value={schedule.graceMinutes} onChange={e => setSchedule(prev => ({...prev, graceMinutes: Number(e.target.value)}))} style={{ background: 'var(--overlay-bg)', color: 'var(--foreground)', width: '140px' }}>
                      <option value={0}>0 mins (Strict)</option>
                      <option value={5}>5 mins grace</option>
                      <option value={10}>10 mins grace</option>
                      <option value={15}>15 mins grace</option>
                      <option value={30}>30 mins grace</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <label className="text-xs font-semibold" style={{ color: 'var(--secondary-foreground)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Half Day Penalty</label>
                    <select className="input" value={schedule.lateHalfDayThreshold as any} onChange={e => setSchedule(prev => ({...prev, lateHalfDayThreshold: Number(e.target.value)}))} style={{ background: 'var(--overlay-bg)', color: 'var(--foreground)', width: '150px' }}>
                      <option value={0}>Disabled</option>
                      <option value={1}>After 1 Late Mark</option>
                      <option value={2}>After 2 Late Marks</option>
                      <option value={3}>After 3 Late Marks</option>
                      <option value={4}>After 4 Late Marks</option>
                      <option value={5}>After 5 Late Marks</option>
                    </select>
                  </div>
                  <div style={{ paddingBottom: '0.35rem' }}>
                    <span style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', padding: '0.3rem 0.75rem', borderRadius: 'var(--radius-full)', fontSize: '0.78rem', fontWeight: 700 }}>
                      ⏱ {calculateDuration()}
                    </span>
                  </div>
                </div>
              </SectionCard>
            </>
          )}


          {/* ── NOTIFICATIONS ── */}
          {activeTab === "notifications" && (
            <>
              <SectionCard title="Task Notifications">
                {[
                  { key: "taskAssigned",  label: "Task Assigned to Me",    desc: "Get notified when Admin assigns you a new task" },
                  { key: "taskCompleted", label: "Task Marked Completed",  desc: "Alert when a team member completes a task" },
                ].map(n => (
                  <SettingRow key={n.key} label={n.label} description={n.desc}>
                    <Toggle value={(notifs as any)[n.key]} onChange={v => setNotifs(p => ({ ...p, [n.key]: v }))} />
                  </SettingRow>
                ))}
              </SectionCard>

              <SectionCard title="Lead Notifications">
                {[
                  { key: "newLead",       label: "New Lead Assigned",    desc: "Notified when new leads are distributed to you" },
                  { key: "leadConverted", label: "Lead Converted",       desc: "Alert when a lead is marked as Converted ⭐" },
                ].map(n => (
                  <SettingRow key={n.key} label={n.label} description={n.desc}>
                    <Toggle value={(notifs as any)[n.key]} onChange={v => setNotifs(p => ({ ...p, [n.key]: v }))} />
                  </SettingRow>
                ))}
              </SectionCard>

              <SectionCard title="Chat & Reports">
                {[
                  { key: "chatMessage",  label: "New Chat Message",     desc: "Notification for new direct messages" },
                  { key: "dailyDigest",  label: "Daily Digest Email",   desc: "Summary of activity every morning at 9 AM" },
                  { key: "weeklyReport", label: "Weekly Report",        desc: "Performance report every Monday" },
                  { key: "emailAlerts",  label: "Email Alerts",         desc: "Receive all critical alerts via email" },
                ].map(n => (
                  <SettingRow key={n.key} label={n.label} description={n.desc}>
                    <Toggle value={(notifs as any)[n.key]} onChange={v => setNotifs(p => ({ ...p, [n.key]: v }))} />
                  </SettingRow>
                ))}
              </SectionCard>
            </>
          )}

          {/* ── APPEARANCE ── */}
          {activeTab === "appearance" && (
            <>
              <SectionCard title="Theme & Colors">
                <SettingRow label="Accent Color" description="Primary color used for buttons, highlights and active states">
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    {["#6366f1","#f43f5e","#10b981","#f59e0b","#06b6d4","#a78bfa"].map(c => (
                      <button key={c} onClick={() => setAppearance(p => ({ ...p, accent: c }))}
                        style={{ width: '26px', height: '26px', borderRadius: '8px', background: c, border: appearance.accent === c ? '3px solid #fff' : '2px solid transparent', cursor: 'pointer', boxShadow: appearance.accent === c ? `0 0 10px ${c}` : 'none' }} />
                    ))}
                    <input type="color" value={appearance.accent} onChange={e => setAppearance(p => ({ ...p, accent: e.target.value }))}
                      style={{ width: '28px', height: '28px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: 'transparent' }} />
                  </div>
                </SettingRow>

                <SettingRow label="Interface Density" description="Adjust how compact the UI looks">
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    {["compact","comfortable","spacious"].map(d => (
                      <button key={d} onClick={() => setAppearance(p => ({ ...p, density: d }))}
                        className={appearance.density === d ? "btn btn-primary" : "btn btn-secondary"}
                        style={{ padding: '0.3rem 0.7rem', fontSize: '0.75rem', textTransform: 'capitalize' }}>
                        {d}
                      </button>
                    ))}
                  </div>
                </SettingRow>

                <SettingRow label="Animations" description="Enable micro-animations and transitions throughout the app">
                  <Toggle value={appearance.animationsEnabled} onChange={v => setAppearance(p => ({ ...p, animationsEnabled: v }))} />
                </SettingRow>

                <SettingRow label="Collapse Sidebar by Default" description="Start with sidebar minimised on login">
                  <Toggle value={appearance.sidebarCollapsed} onChange={v => setAppearance(p => ({ ...p, sidebarCollapsed: v }))} />
                </SettingRow>
              </SectionCard>
            </>
          )}

          {/* ── SECURITY ── */}
          {activeTab === "security" && (
            <>
              <SectionCard title="Change Password">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', paddingTop: '1rem' }}>
                  {[
                    { label: "Current Password",  key: "currentPassword" },
                    { label: "New Password",       key: "newPassword" },
                    { label: "Confirm New Password", key: "confirmPassword" },
                  ].map(f => (
                    <div key={f.key} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <label className="text-xs font-semibold text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>{f.label}</label>
                      <div style={{ position: 'relative' }}>
                        <input className="input" type={showPassword ? "text" : "password"}
                          value={(security as any)[f.key]}
                          onChange={e => setSecurity(p => ({ ...p, [f.key]: e.target.value }))}
                          placeholder="••••••••" style={{ paddingRight: '2.5rem' }} />
                        <button type="button" onClick={() => setShowPassword(p => !p)}
                          style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--secondary-foreground)' }}>
                          {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                    </div>
                  ))}
                  <button className="btn btn-primary" style={{ alignSelf: 'flex-start', marginTop: '0.25rem' }}>Update Password</button>
                </div>
              </SectionCard>

              <SectionCard title="Two-Factor Authentication">
                <SettingRow label="Enable 2FA" description="Add an extra layer of security with authenticator app (Google Authenticator / Authy)">
                  <Toggle value={security.twoFactor} onChange={v => setSecurity(p => ({ ...p, twoFactor: v }))} />
                </SettingRow>
                {security.twoFactor && (
                  <div style={{ padding: '1rem', background: 'rgba(16,185,129,0.08)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(16,185,129,0.3)', marginTop: '0.75rem' }}>
                    <p className="text-sm font-semibold" style={{ color: '#10b981', marginBottom: '0.3rem' }}>✅ 2FA is enabled</p>
                    <p className="text-xs text-muted">Scan the QR code with your authenticator app to link your device.</p>
                    <button className="btn btn-secondary" style={{ marginTop: '0.75rem', fontSize: '0.8rem' }}>View QR Code</button>
                  </div>
                )}
              </SectionCard>

              <SectionCard title="Session & Access">
                <SettingRow label="Auto Logout" description="Automatically log out after inactivity period">
                  <select className="input" value={security.sessionTimeout} onChange={e => setSecurity(p => ({ ...p, sessionTimeout: e.target.value }))}
                    style={{ background: 'var(--overlay-bg)', color: 'var(--foreground)', minWidth: '150px' }}>
                    <option value="15">After 15 minutes</option>
                    <option value="30">After 30 minutes</option>
                    <option value="60">After 1 hour</option>
                    <option value="240">After 4 hours</option>
                    <option value="0">Never</option>
                  </select>
                </SettingRow>
                <SettingRow label="Active Sessions" description="Manage devices where you're logged in">
                  <button className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '0.35rem 0.8rem', color: 'var(--destructive)', border: '1px solid rgba(244,63,94,0.3)' }}>
                    Sign Out All Devices
                  </button>
                </SettingRow>
              </SectionCard>
            </>
          )}

          {/* ── DATABASE ── */}
          {activeTab === "database" && (
            <>
              <SectionCard title="PostgreSQL Connection">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', paddingTop: '1rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <label className="text-xs font-semibold text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>Host</label>
                    <input className="input" value={db.host} onChange={e => setDb(p => ({ ...p, host: e.target.value }))} placeholder="localhost" />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <label className="text-xs font-semibold text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>Port</label>
                    <input className="input" value={db.port} onChange={e => setDb(p => ({ ...p, port: e.target.value }))} placeholder="5432" />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <label className="text-xs font-semibold text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>Database Name</label>
                    <input className="input" value={db.name} onChange={e => setDb(p => ({ ...p, name: e.target.value }))} placeholder="resawc_db" />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <label className="text-xs font-semibold text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>Username</label>
                    <input className="input" value={db.user} onChange={e => setDb(p => ({ ...p, user: e.target.value }))} placeholder="postgres" />
                  </div>
                </div>
                <div style={{ marginTop: '0.75rem' }}>
                  <SettingRow label="SSL / TLS Encryption" description="Encrypt the database connection (recommended for production)">
                    <Toggle value={db.ssl} onChange={v => setDb(p => ({ ...p, ssl: v }))} />
                  </SettingRow>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                  <button className="btn btn-primary" style={{ fontSize: '0.85rem' }}>Test Connection</button>
                  <button className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>Run Migrations</button>
                </div>
              </SectionCard>

              <SectionCard title="Backup & Data">
                <SettingRow label="Automatic Backup" description="Schedule regular database backups">
                  <select className="input" value={db.backupFreq} onChange={e => setDb(p => ({ ...p, backupFreq: e.target.value }))}
                    style={{ background: 'var(--overlay-bg)', color: 'var(--foreground)', minWidth: '150px' }}>
                    <option value="hourly">Every Hour</option>
                    <option value="daily">Daily at Midnight</option>
                    <option value="weekly">Weekly</option>
                    <option value="manual">Manual Only</option>
                  </select>
                </SettingRow>
                <SettingRow label="Export All Data" description="Download a full CSV export of leads, tasks, and interactions">
                  <button className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '0.35rem 0.8rem' }}>Export CSV</button>
                </SettingRow>
                <SettingRow label="Danger Zone" description="Permanently delete all data — this cannot be undone">
                  <button className="btn btn-ghost" style={{ fontSize: '0.8rem', padding: '0.35rem 0.8rem', color: 'var(--destructive)', border: '1px solid rgba(244,63,94,0.4)' }}>
                    Reset All Data
                  </button>
                </SettingRow>
              </SectionCard>
            </>
          )}

        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <RoleGuard allowedRoles={["admin"]} redirectTo="/dashboard">
      <SettingsContent />
    </RoleGuard>
  );
}
