"use client";

import { useState } from "react";
import { Plus, Clock, CheckCircle, AlertCircle, Calendar, X } from "lucide-react";
import { useRole } from "@/context/RoleContext";

type Task = {
  id: number;
  title: string;
  description?: string;
  assignee: string;
  initials: string;
  status: "Not Started" | "In Progress" | "On Hold" | "Completed" | "Assigned" | "Delayed";
  priority: "High" | "Medium" | "Low";
  due: string;
  color: string;
};

const INITIAL_TASKS: Task[] = [];

const TEAM_MEMBERS: string[] = []; // Populated from real DB users

const ALL_STATUSES: Task["status"][] = ["Not Started", "Assigned", "In Progress", "On Hold", "Delayed", "Completed"];

const PRIORITY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  High:   { bg: "rgba(244,63,94,0.15)",  text: "#f43f5e", border: "rgba(244,63,94,0.4)" },
  Medium: { bg: "rgba(245,158,11,0.15)", text: "#f59e0b", border: "rgba(245,158,11,0.4)" },
  Low:    { bg: "rgba(99,102,241,0.15)", text: "#818cf8", border: "rgba(99,102,241,0.4)" },
};

const TASK_COLORS: Record<string, string> = { High: "#f43f5e", Medium: "#f59e0b", Low: "#6366f1" };

const STATUS_META: Record<Task["status"], { color: string; bg: string }> = {
  "Not Started": { color: "#a1a1c7", bg: "rgba(161,161,199,0.12)" },
  "In Progress": { color: "#f59e0b", bg: "rgba(245,158,11,0.12)"  },
  "On Hold":     { color: "#6366f1", bg: "rgba(99,102,241,0.12)"  },
  "Completed":   { color: "#10b981", bg: "rgba(16,185,129,0.12)"  },
  "Assigned":    { color: "#06b6d4", bg: "rgba(6,182,212,0.12)"   },
  "Delayed":     { color: "#f43f5e", bg: "rgba(244,63,94,0.12)"   },
};

const ADMIN_COLUMNS: { statuses: Task["status"][]; label: string; icon: any; color: string }[] = [
  { statuses: ["Not Started", "Assigned"], label: "Not Started",        icon: AlertCircle, color: "#6366f1" },
  { statuses: ["In Progress"],             label: "In Progress",        icon: Clock,       color: "#f59e0b" },
  { statuses: ["On Hold", "Delayed"],      label: "On Hold / Delayed",  icon: AlertCircle, color: "#f43f5e" },
  { statuses: ["Completed"],               label: "Completed",          icon: CheckCircle, color: "#10b981" },
];

export default function TaskManagement() {
  const { user } = useRole();
  const isAdmin = user.role === "admin";

  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<{
    title: string; description: string; assignee: string;
    priority: Task["priority"]; due: string; status: Task["status"];
  }>({ title: "", description: "", assignee: "", priority: "Medium", due: "", status: "Assigned" });

  const visibleTasks = isAdmin ? tasks : tasks.filter(t => t.assignee === user.name);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const assigneeName = form.assignee || "Unassigned";
    const initials = assigneeName === "Unassigned"
      ? "?" : assigneeName.split(" ").map(w => w[0]).join("").toUpperCase();
    setTasks(prev => [{
      id: Date.now(), title: form.title, description: form.description,
      assignee: assigneeName, initials, status: form.status,
      priority: form.priority, due: form.due || "TBD", color: TASK_COLORS[form.priority],
    }, ...prev]);
    setShowModal(false);
    setForm({ title: "", description: "", assignee: "", priority: "Medium", due: "", status: "Assigned" });
  };

  const updateStatus = (id: number, newStatus: Task["status"]) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
  };

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div className="flex-between" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            {isAdmin ? "Task Board" : "My Tasks"}
          </h1>
          <p className="text-muted text-sm">
            {isAdmin
              ? `${tasks.length} total · ${tasks.filter(t => t.status === "In Progress").length} in progress`
              : `${visibleTasks.length} assigned to you · ${visibleTasks.filter(t => t.status === "In Progress").length} in progress`}
          </p>
        </div>
        {/* Only Admin creates tasks */}
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={16} /> Create Task
          </button>
        )}
      </div>

      {/* ── EDITOR / MARKETING VIEW: flat list with status dropdown ── */}
      {!isAdmin && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {visibleTasks.length === 0 && (
            <div className="glass-card" style={{ textAlign: 'center', padding: '3.5rem', color: 'var(--secondary-foreground)' }}>
              <CheckCircle size={32} style={{ margin: '0 auto 0.75rem', opacity: 0.25 }} />
              <p className="font-semibold text-sm">No tasks assigned yet.</p>
              <p className="text-xs text-muted" style={{ marginTop: '0.3rem' }}>Your Admin will assign tasks to you shortly.</p>
            </div>
          )}
          {visibleTasks.map(task => {
            const pc = PRIORITY_COLORS[task.priority];
            const sm = STATUS_META[task.status];
            return (
              <div key={task.id} className="glass-card" style={{ padding: '1.1rem 1.25rem', borderLeft: `3px solid ${task.color}`, display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
                    <span style={{ background: pc.bg, color: pc.text, border: `1px solid ${pc.border}`, padding: '0.12rem 0.55rem', borderRadius: 'var(--radius-full)', fontSize: '0.7rem', fontWeight: 700 }}>
                      {task.priority}
                    </span>
                    <span style={{ background: sm.bg, color: sm.color, padding: '0.12rem 0.55rem', borderRadius: 'var(--radius-full)', fontSize: '0.7rem', fontWeight: 700, border: `1px solid ${sm.color}40` }}>
                      {task.status}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.72rem', color: 'var(--secondary-foreground)' }}>
                      <Calendar size={11} /> {task.due}
                    </span>
                  </div>
                  <p className="font-semibold text-sm">{task.title}</p>
                  {task.description && <p className="text-xs text-muted" style={{ marginTop: '0.2rem', lineHeight: 1.5 }}>{task.description}</p>}
                </div>

                {/* Status updater */}
                <div style={{ flexShrink: 0, minWidth: '145px' }}>
                  <p className="text-xs text-muted font-semibold" style={{ marginBottom: '0.35rem' }}>Update Status</p>
                  <select
                    value={task.status}
                    onChange={e => updateStatus(task.id, e.target.value as Task["status"])}
                    style={{
                      width: '100%', padding: '0.45rem 0.65rem', borderRadius: 'var(--radius-sm)',
                      background: sm.bg, color: sm.color, border: `1px solid ${sm.color}60`,
                      fontWeight: 700, fontSize: '0.78rem', outline: 'none', cursor: 'pointer',
                    }}>
                    {ALL_STATUSES.map(s => (
                      <option key={s} value={s} style={{ background: 'var(--background)', color: 'var(--foreground)' }}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── ADMIN VIEW: Kanban board ── */}
      {isAdmin && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.1rem', alignItems: 'start' }}>
          {ADMIN_COLUMNS.map(col => {
            const Icon = col.icon;
            const colTasks = visibleTasks.filter(t => col.statuses.includes(t.status));
            return (
              <div key={col.label}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', padding: '0 0.25rem' }}>
                  <Icon size={14} color={col.color} />
                  <span className="font-semibold" style={{ fontSize: '0.78rem' }}>{col.label}</span>
                  <div style={{ marginLeft: 'auto', background: `${col.color}20`, color: col.color, padding: '0.1rem 0.5rem', borderRadius: 'var(--radius-full)', fontSize: '0.7rem', fontWeight: 700, border: `1px solid ${col.color}50` }}>
                    {colTasks.length}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {colTasks.map(task => {
                    const pc = PRIORITY_COLORS[task.priority];
                    const sm = STATUS_META[task.status];
                    return (
                      <div key={task.id} className="glass-card" style={{ padding: '1rem', borderLeft: `3px solid ${task.color}`, opacity: task.status === "Completed" ? 0.65 : 1 }}>
                        <div className="flex-between" style={{ marginBottom: '0.5rem' }}>
                          <span style={{ background: pc.bg, color: pc.text, border: `1px solid ${pc.border}`, padding: '0.1rem 0.5rem', borderRadius: 'var(--radius-full)', fontSize: '0.67rem', fontWeight: 700 }}>
                            {task.priority}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.67rem', color: 'var(--secondary-foreground)' }}>
                            <Calendar size={10} />{task.due}
                          </span>
                        </div>

                        <p className="font-semibold" style={{ fontSize: '0.8rem', marginBottom: '0.45rem', textDecoration: task.status === "Completed" ? 'line-through' : 'none', lineHeight: 1.4 }}>
                          {task.title}
                        </p>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.6rem' }}>
                          <div style={{ width: '19px', height: '19px', borderRadius: '5px', background: `linear-gradient(135deg, ${task.color}, ${task.color}88)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.55rem', fontWeight: 700, color: '#fff' }}>
                            {task.initials}
                          </div>
                          <span className="text-xs text-muted">{task.assignee}</span>
                        </div>

                        <span style={{ display: 'inline-block', background: sm.bg, color: sm.color, padding: '0.1rem 0.5rem', borderRadius: 'var(--radius-full)', fontSize: '0.67rem', fontWeight: 700, border: `1px solid ${sm.color}40`, marginBottom: '0.5rem' }}>
                          {task.status}
                        </span>

                        <select
                          value={task.status}
                          onChange={e => updateStatus(task.id, e.target.value as Task["status"])}
                          style={{ display: 'block', width: '100%', padding: '0.3rem 0.5rem', borderRadius: 'var(--radius-sm)', background: 'var(--overlay-bg)', color: 'var(--foreground)', border: '1px solid var(--surface-border)', fontSize: '0.73rem', outline: 'none', cursor: 'pointer' }}>
                          {ALL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Create Task Modal (Admin only) ── */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={() => setShowModal(false)}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '520px', padding: '2rem' }} onClick={e => e.stopPropagation()}>
            <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
              <h2 className="font-bold" style={{ fontSize: '1.2rem' }}>Create & Assign Task</h2>
              <button className="btn btn-ghost" style={{ padding: '0.3rem' }} onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>

            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label className="text-sm font-semibold">Task Title *</label>
                <input className="input" placeholder="e.g. Edit product video for TechCorp" required
                  value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label className="text-sm font-semibold">Description</label>
                <textarea className="input" rows={3} placeholder="What needs to be done..."
                  value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  style={{ resize: 'none', lineHeight: 1.5 }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label className="text-sm font-semibold">Assign To *</label>
                  <select className="input" required value={form.assignee} onChange={e => setForm(p => ({ ...p, assignee: e.target.value }))}
                    style={{ background: 'var(--overlay-bg)', color: 'var(--foreground)' }}>
                    <option value="">Select team member</option>
                    {TEAM_MEMBERS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label className="text-sm font-semibold">Initial Status</label>
                  <select className="input" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as Task["status"] }))}
                    style={{ background: 'var(--overlay-bg)', color: 'var(--foreground)' }}>
                    {ALL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label className="text-sm font-semibold">Priority</label>
                  <select className="input" value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value as Task["priority"] }))}
                    style={{ background: 'var(--overlay-bg)', color: 'var(--foreground)' }}>
                    <option>High</option><option>Medium</option><option>Low</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label className="text-sm font-semibold">Due Date</label>
                  <input className="input" type="date" value={form.due} onChange={e => setForm(p => ({ ...p, due: e.target.value }))}
                    style={{ background: 'var(--overlay-bg)', colorScheme: 'dark' }} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Assign Task</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
