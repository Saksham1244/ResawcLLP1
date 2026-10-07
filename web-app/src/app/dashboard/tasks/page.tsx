"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Plus, Calendar, X, Loader2, CheckCircle, MoreVertical, ChevronDown, ExternalLink, Folder, Send } from "lucide-react";
import { useRole } from "@/context/RoleContext";

// ─── Types ───────────────────────────────────────────────────────────────────

type Task = {
  id: string;
  title: string;
  description?: string;
  rawFilesLink?: string;
  workLink?: string;
  submissionNotes?: string;
  editingJobId?: string;
  assignee: string;
  assigneeId?: string;
  initials: string;
  status: "Not Started" | "In Progress" | "On Hold" | "Completed" | "Assigned" | "Delayed";
  priority: "High" | "Medium" | "Low";
  due: string;
  completedDate?: string;
  color: string;
};

type DBUser = { id: string; name: string; role: string };

type TabFilter = "All Tasks" | "To Do" | "In Progress" | "Done";

// ─── Maps & Constants ─────────────────────────────────────────────────────────

const STATUS_MAP: Record<string, Task["status"]> = {
  PENDING: "Not Started",
  IN_PROGRESS: "In Progress",
  ON_HOLD: "On Hold",
  COMPLETED: "Completed",
  ASSIGNED: "Assigned",
  DELAYED: "Delayed",
};

const STATUS_MAP_REVERSE: Record<string, string> = {
  "Not Started": "PENDING",
  "In Progress": "IN_PROGRESS",
  "On Hold": "ON_HOLD",
  Completed: "COMPLETED",
  Assigned: "ASSIGNED",
  Delayed: "DELAYED",
};

const PRIORITY_MAP: Record<string, Task["priority"]> = {
  HIGH: "High",
  MEDIUM: "Medium",
  LOW: "Low",
};

const ALL_STATUSES: Task["status"][] = [
  "Not Started",
  "Assigned",
  "In Progress",
  "On Hold",
  "Delayed",
  "Completed",
];

const TASK_COLORS: Record<string, string> = {
  High: "#EF4444",
  Medium: "#F97316",
  Low: "#22C55E",
};

const PRIORITY_BADGE: Record<string, { bg: string; text: string; border: string }> = {
  High:   { bg: "#FEF2F2", text: "#DC2626", border: "#FECACA" },
  Medium: { bg: "#FFF7ED", text: "#C2410C", border: "#FED7AA" },
  Low:    { bg: "#F0FDF4", text: "#15803D", border: "#BBF7D0" },
};

const STATUS_BADGE: Record<Task["status"], { bg: string; text: string; border: string }> = {
  "Not Started": { bg: "#F9FAFB", text: "#6B7280", border: "#E5E7EB" },
  Assigned:      { bg: "#EFF6FF", text: "#1D4ED8", border: "#BFDBFE" },
  "In Progress": { bg: "#FFFBEB", text: "#B45309", border: "#FDE68A" },
  "On Hold":     { bg: "#F5F3FF", text: "#6D28D9", border: "#DDD6FE" },
  Delayed:       { bg: "#FEF2F2", text: "#DC2626", border: "#FECACA" },
  Completed:     { bg: "#F0FDF4", text: "#15803D", border: "#BBF7D0" },
};

const AVATAR_COLORS = [
  "#1A56DB", "#7C3AED", "#DB2777", "#0891B2", "#059669", "#D97706",
];

function avatarColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mapDBTask(t: any): Task {
  const priority = PRIORITY_MAP[t.priority?.toUpperCase()] || "Medium";
  let completedDate: string | undefined;
  if (t.status === "COMPLETED" && t.updatedAt) {
    const d = new Date(t.updatedAt);
    completedDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }
  return {
    id: t.id,
    title: t.title,
    description: t.description,
    rawFilesLink: t.rawFilesLink,
    workLink: t.workLink,
    submissionNotes: t.submissionNotes,
    editingJobId: t.editingJobId,
    assignee: t.assignedTo?.name || "Unassigned",
    assigneeId: t.assignedTo?.id,
    initials: (t.assignedTo?.name || "?")
      .split(" ")
      .map((w: string) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2),
    status: STATUS_MAP[t.status] || "Not Started",
    priority,
    due: t.dueDate || "TBD",
    completedDate,
    color: TASK_COLORS[priority],
  };
}

const getLocalDateString = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

function formatDate(iso: string) {
  if (!iso || iso === "TBD") return "—";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function isDueSoon(due: string) {
  if (!due || due === "TBD") return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(due + "T00:00:00");
  const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / 86400000);
  return diffDays >= 0 && diffDays <= 2;
}

function isOverdue(due: string, status: Task["status"]) {
  if (!due || due === "TBD" || status === "Completed") return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(due + "T00:00:00") < today;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function PriorityBadge({ priority }: { priority: Task["priority"] }) {
  const s = PRIORITY_BADGE[priority];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "0.3rem",
      background: s.bg, color: s.text, border: `1px solid ${s.border}`,
      padding: "0.2rem 0.6rem", borderRadius: "999px",
      fontSize: "0.72rem", fontWeight: 600, whiteSpace: "nowrap",
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.text, flexShrink: 0 }} />
      {priority}
    </span>
  );
}

function StatusBadge({ status }: { status: Task["status"] }) {
  const s = STATUS_BADGE[status];
  return (
    <span style={{
      display: "inline-block",
      background: s.bg, color: s.text, border: `1px solid ${s.border}`,
      padding: "0.2rem 0.65rem", borderRadius: "999px",
      fontSize: "0.72rem", fontWeight: 600, whiteSpace: "nowrap",
    }}>
      {status}
    </span>
  );
}

function Avatar({ initials, name, size = 28 }: { initials: string; name: string; size?: number }) {
  const bg = avatarColor(name);
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: bg, color: "#fff",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.38, fontWeight: 700, flexShrink: 0, letterSpacing: 0.5,
    }}>
      {initials}
    </div>
  );
}

// Actions dropdown with keyboard-accessible menu
function ActionsMenu({ task, allStatuses, onStatusChange }: {
  task: Task;
  allStatuses: Task["status"][];
  onStatusChange: (id: string, s: Task["status"]) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(p => !p)}
        style={{
          background: "none", border: "1px solid transparent", borderRadius: 6,
          padding: "0.3rem", cursor: "pointer", color: "#6B7280",
          display: "flex", alignItems: "center",
          transition: "all 0.15s",
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLButtonElement).style.background = "#F3F4F6";
          (e.currentTarget as HTMLButtonElement).style.borderColor = "#E5E7EB";
          (e.currentTarget as HTMLButtonElement).style.color = "#111827";
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLButtonElement).style.background = "none";
          (e.currentTarget as HTMLButtonElement).style.borderColor = "transparent";
          (e.currentTarget as HTMLButtonElement).style.color = "#6B7280";
        }}
        aria-label="Task actions"
      >
        <MoreVertical size={15} />
      </button>

      {open && (
        <div style={{
          position: "absolute", right: 0, top: "calc(100% + 4px)",
          background: "#fff", border: "1px solid #E5E7EB",
          borderRadius: 8, boxShadow: "0 8px 24px rgba(0,0,0,0.10)",
          minWidth: 160, zIndex: 50, overflow: "hidden",
        }}>
          <div style={{ padding: "0.35rem 0.75rem", fontSize: "0.68rem", fontWeight: 600, color: "#9CA3AF", letterSpacing: "0.06em", textTransform: "uppercase", borderBottom: "1px solid #F3F4F6" }}>
            Set Status
          </div>
          {allStatuses.map(s => (
            <button
              key={s}
              onClick={() => { onStatusChange(task.id, s); setOpen(false); }}
              style={{
                display: "flex", alignItems: "center", gap: "0.5rem",
                width: "100%", padding: "0.5rem 0.75rem",
                background: task.status === s ? "#F9FAFB" : "none",
                border: "none", cursor: "pointer", fontSize: "0.8rem",
                color: task.status === s ? "#1A56DB" : "#374151",
                textAlign: "left", fontWeight: task.status === s ? 600 : 400,
                transition: "background 0.12s",
              }}
              onMouseEnter={e => { if (task.status !== s) (e.currentTarget as HTMLButtonElement).style.background = "#F9FAFB"; }}
              onMouseLeave={e => { if (task.status !== s) (e.currentTarget as HTMLButtonElement).style.background = "none"; }}
            >
              {task.status === s && <CheckCircle size={12} color="#1A56DB" />}
              {task.status !== s && <span style={{ width: 12 }} />}
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TaskManagement() {
  const { user } = useRole();
  if (!user) return null;
  const isAdmin = user.role === "admin";

  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(() => getLocalDateString(new Date()));
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [teamMembers, setTeamMembers] = useState<DBUser[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<TabFilter>("All Tasks");
  const [form, setForm] = useState<{
    title: string; description: string; assigneeId: string;
    priority: Task["priority"]; due: string; status: Task["status"];
    rawFilesLink: string;
  }>({ title: "", description: "", assigneeId: "", priority: "Medium", due: "", status: "Assigned", rawFilesLink: "" });

  // ── Submit Work Deliverables Modal ──
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedTaskForSubmit, setSelectedTaskForSubmit] = useState<Task | null>(null);
  const [submitWorkLink, setSubmitWorkLink] = useState("");
  const [submitNotes, setSubmitNotes] = useState("");
  const [submittingWork, setSubmittingWork] = useState(false);

  // ── Fetch ──

  const fetchTasks = useCallback(async () => {
    setLoadingTasks(true);
    try {
      const url = isAdmin ? "/api/tasks" : `/api/tasks?userId=${user.id}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) setTasks(data.data.map(mapDBTask));
    } catch {}
    setLoadingTasks(false);
  }, [isAdmin, user.id]);

  useEffect(() => {
    fetchTasks();
    fetch("/api/users")
      .then(r => r.json())
      .then(data => { if (data.success) setTeamMembers(data.data); })
      .catch(() => {});
  }, [fetchTasks]);

  // ── Date-based visibility filter (same logic as original) ──

  const visibleTasks = tasks.filter(task => {
    const isNotStartedOrInProgress =
      task.status === "Not Started" ||
      task.status === "Assigned" ||
      task.status === "In Progress";
    const isCompleted = task.status === "Completed";
    const isDelayed = task.status === "Delayed";
    const isOnHold = task.status === "On Hold";

    if (isNotStartedOrInProgress || isDelayed) {
      return !task.due || task.due === "TBD" || task.due <= selectedDate;
    }
    if (isCompleted) return task.completedDate === selectedDate;
    if (isOnHold) return true;
    return true;
  });

  // ── Tab filter ──

  const tabFiltered = visibleTasks.filter(task => {
    if (activeTab === "All Tasks") return true;
    if (activeTab === "To Do") return task.status === "Not Started" || task.status === "Assigned";
    if (activeTab === "In Progress") return task.status === "In Progress" || task.status === "Delayed" || task.status === "On Hold";
    if (activeTab === "Done") return task.status === "Completed";
    return true;
  });

  const tabCounts: Record<TabFilter, number> = {
    "All Tasks": visibleTasks.length,
    "To Do": visibleTasks.filter(t => t.status === "Not Started" || t.status === "Assigned").length,
    "In Progress": visibleTasks.filter(t => t.status === "In Progress" || t.status === "Delayed" || t.status === "On Hold").length,
    "Done": visibleTasks.filter(t => t.status === "Completed").length,
  };

  // ── Create ──

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          assignedToId: form.assigneeId || null,
          createdById: user.id,
          priority: form.priority.toUpperCase(),
          dueDate: form.due || null,
          status: STATUS_MAP_REVERSE[form.status] || "PENDING",
          rawFilesLink: form.rawFilesLink?.trim() || null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTasks(prev => [mapDBTask(data.data), ...prev]);
        setShowModal(false);
        setForm({ title: "", description: "", assigneeId: "", priority: "Medium", due: "", status: "Assigned", rawFilesLink: "" });
      }
    } catch {}
    setSaving(false);
  };

  // ── Update status (PATCH) ──

  const updateStatus = async (id: string, newStatus: Task["status"]) => {
    setTasks(prev =>
      prev.map(t =>
        t.id === id
          ? { ...t, status: newStatus, completedDate: newStatus === "Completed" ? getLocalDateString(new Date()) : undefined }
          : t
      )
    );
    try {
      const res = await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: STATUS_MAP_REVERSE[newStatus] || newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        const updated = mapDBTask(data.data);
        setTasks(prev => prev.map(t => (t.id === id ? updated : t)));
      }
    } catch {}
  };

  const handleSubmitTaskWork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTaskForSubmit) return;
    if (!submitWorkLink.trim()) {
      alert("Please provide the Google Drive or cloud folder link with your finished deliverables.");
      return;
    }
    setSubmittingWork(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedTaskForSubmit.id,
          status: "COMPLETED",
          workLink: submitWorkLink.trim(),
          submissionNotes: submitNotes.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTasks(prev =>
          prev.map(t =>
            t.id === selectedTaskForSubmit.id
              ? { ...t, status: "Completed", workLink: submitWorkLink.trim(), submissionNotes: submitNotes.trim() }
              : t
          )
        );
        setShowSubmitModal(false);
        setSubmitWorkLink("");
        setSubmitNotes("");
        alert("Work submitted successfully! Admin has been notified to review what you have done.");
      } else {
        alert(data.error || "Failed to submit work");
      }
    } catch {
      alert("Network error submitting work");
    } finally {
      setSubmittingWork(false);
    }
  };

  const tabs: TabFilter[] = ["All Tasks", "To Do", "In Progress", "Done"];

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      {/* Page wrapper */}
      <div style={{ fontFamily: "Inter, system-ui, sans-serif", minHeight: "100vh", background: "#F5F7FB", padding: "2rem 2rem 3rem" }}>

        {/* ── Header ── */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem", marginBottom: "1.75rem" }}>
          <div>
            <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#111827", letterSpacing: "-0.02em", margin: 0 }}>
              Tasks
            </h1>
            <p style={{ fontSize: "0.83rem", color: "#6B7280", marginTop: "0.3rem" }}>
              {loadingTasks
                ? "Loading tasks…"
                : isAdmin
                ? `${visibleTasks.length} visible · ${visibleTasks.filter(t => t.status === "In Progress").length} in progress`
                : `${visibleTasks.length} assigned to you · ${visibleTasks.filter(t => t.status === "In Progress").length} in progress`}
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
            {/* Date filter */}
            <div style={{
              display: "flex", alignItems: "center", gap: "0.5rem",
              background: "#fff", border: "1px solid #E5E7EB", borderRadius: 8,
              padding: "0.45rem 0.85rem",
            }}>
              <Calendar size={14} color="#6B7280" />
              <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "#6B7280" }}>Track Date:</span>
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                style={{
                  background: "transparent", border: "none", outline: "none",
                  color: "#111827", fontSize: "0.8rem", fontWeight: 600,
                  cursor: "pointer",
                }}
              />
            </div>

            {isAdmin && (
              <button
                onClick={() => setShowModal(true)}
                style={{
                  display: "inline-flex", alignItems: "center", gap: "0.4rem",
                  background: "#1A56DB", color: "#fff", border: "none",
                  borderRadius: 6, padding: "0.55rem 1rem",
                  fontSize: "0.85rem", fontWeight: 600, cursor: "pointer",
                  transition: "background 0.15s",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "#1648C4")}
                onMouseLeave={e => (e.currentTarget.style.background = "#1A56DB")}
              >
                <Plus size={16} />
                Create Task
              </button>
            )}
          </div>
        </div>

        {/* ── Tab Bar ── */}
        <div style={{
          display: "flex", alignItems: "center", gap: "0.25rem",
          background: "#fff", border: "1px solid #E5E7EB", borderRadius: 8,
          padding: "0.3rem", marginBottom: "1.25rem",
          width: "fit-content",
        }}>
          {tabs.map(tab => {
            const active = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  display: "inline-flex", alignItems: "center", gap: "0.4rem",
                  padding: "0.45rem 0.9rem", borderRadius: 6, border: "none",
                  background: active ? "#1A56DB" : "transparent",
                  color: active ? "#fff" : "#6B7280",
                  fontSize: "0.82rem", fontWeight: active ? 600 : 500,
                  cursor: "pointer", transition: "all 0.15s",
                }}
                onMouseEnter={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = "#F9FAFB"; }}
                onMouseLeave={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
              >
                {tab}
                <span style={{
                  background: active ? "rgba(255,255,255,0.22)" : "#F3F4F6",
                  color: active ? "#fff" : "#6B7280",
                  padding: "0.05rem 0.45rem", borderRadius: "999px",
                  fontSize: "0.7rem", fontWeight: 700, lineHeight: 1.6,
                }}>
                  {tabCounts[tab]}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Main Card ── */}
        <div style={{
          background: "#fff", border: "1px solid #E5E7EB",
          borderRadius: 8, overflow: "hidden",
        }}>

          {/* Loading state */}
          {loadingTasks && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem", padding: "5rem 2rem", color: "#6B7280" }}>
              <Loader2 size={20} style={{ animation: "spin 1s linear infinite" }} />
              <span style={{ fontSize: "0.9rem" }}>Loading tasks…</span>
            </div>
          )}

          {/* Empty state */}
          {!loadingTasks && tabFiltered.length === 0 && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "5rem 2rem", color: "#9CA3AF" }}>
              <CheckCircle size={40} style={{ marginBottom: "0.85rem", opacity: 0.3 }} />
              <p style={{ fontSize: "0.95rem", fontWeight: 600, color: "#6B7280", margin: 0 }}>
                {activeTab === "All Tasks" ? "No tasks found" : `No "${activeTab}" tasks`}
              </p>
              <p style={{ fontSize: "0.8rem", color: "#9CA3AF", marginTop: "0.35rem" }}>
                {isAdmin ? "Create a task to get started." : "Your admin will assign tasks to you shortly."}
              </p>
            </div>
          )}

          {/* Table */}
          {!loadingTasks && tabFiltered.length > 0 && (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.84rem" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #E5E7EB", background: "#F9FAFB" }}>
                    {/* Checkbox col */}
                    <th style={{ width: 40, padding: "0.75rem 1rem 0.75rem 1.25rem", textAlign: "center" }}>
                      <input type="checkbox" style={{ cursor: "pointer", accentColor: "#1A56DB" }} onChange={() => {}} />
                    </th>
                    <th style={thStyle}>Task Title</th>
                    <th style={thStyle}>Assigned To</th>
                    <th style={thStyle}>Priority</th>
                    <th style={thStyle}>Due Date</th>
                    <th style={thStyle}>Status</th>
                    <th style={{ ...thStyle, width: 56, textAlign: "center" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tabFiltered.map((task, idx) => {
                    const overdue = isOverdue(task.due, task.status);
                    const soon = isDueSoon(task.due) && !overdue && task.status !== "Completed";
                    const completed = task.status === "Completed";
                    return (
                      <tr
                        key={task.id}
                        style={{
                          borderBottom: idx < tabFiltered.length - 1 ? "1px solid #E5E7EB" : "none",
                          background: "#fff",
                          transition: "background 0.12s",
                          opacity: completed ? 0.7 : 1,
                        }}
                        onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = "#F9FAFB"}
                        onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = "#fff"}
                      >
                        {/* Checkbox */}
                        <td style={{ padding: "0.875rem 1rem 0.875rem 1.25rem", textAlign: "center", verticalAlign: "middle" }}>
                          <input
                            type="checkbox"
                            checked={completed}
                            onChange={() => updateStatus(task.id, completed ? "Assigned" : "Completed")}
                            style={{ cursor: "pointer", accentColor: "#1A56DB", width: 15, height: 15 }}
                          />
                        </td>

                        {/* Title */}
                        <td style={{ padding: "0.875rem 1rem", verticalAlign: "middle" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <div style={{ width: 3, height: 32, borderRadius: 2, background: task.color, flexShrink: 0 }} />
                            <div style={{ minWidth: 0 }}>
                              <span style={{
                                fontWeight: 600, color: "#111827",
                                textDecoration: completed ? "line-through" : "none",
                                display: "block", lineHeight: 1.4,
                              }}>
                                {task.title}
                              </span>
                              {task.description && (
                                <span style={{ fontSize: "0.75rem", color: "#9CA3AF", display: "block", marginTop: "0.15rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 340 }}>
                                  {task.description}
                                </span>
                              )}
                              {task.rawFilesLink && (
                                <a
                                  href={task.rawFilesLink.startsWith("http") ? task.rawFilesLink : `https://${task.rawFilesLink}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title="Open raw files / task folder in Google Drive/Dropbox"
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "4px",
                                    marginTop: "0.3rem",
                                    fontSize: "0.72rem",
                                    fontWeight: 700,
                                    color: "#166534",
                                    background: "#DCFCE7",
                                    border: "1px solid #BBF7D0",
                                    padding: "2px 7px",
                                    borderRadius: "4px",
                                    textDecoration: "none",
                                  }}
                                >
                                  <Folder size={11} /> Open Task Folder ↗
                                </a>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Assigned To */}
                        <td style={{ padding: "0.875rem 1rem", verticalAlign: "middle" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                            <Avatar initials={task.initials} name={task.assignee} size={28} />
                            <span style={{ fontWeight: 500, color: "#374151", whiteSpace: "nowrap" }}>{task.assignee}</span>
                          </div>
                        </td>

                        {/* Priority */}
                        <td style={{ padding: "0.875rem 1rem", verticalAlign: "middle" }}>
                          <PriorityBadge priority={task.priority} />
                        </td>

                        {/* Due Date */}
                        <td style={{ padding: "0.875rem 1rem", verticalAlign: "middle" }}>
                          <span style={{
                            fontSize: "0.8rem", fontWeight: 500,
                            color: overdue ? "#DC2626" : soon ? "#D97706" : "#6B7280",
                          }}>
                            {overdue && "⚠ "}
                            {formatDate(task.due)}
                          </span>
                        </td>

                        {/* Status */}
                        <td style={{ padding: "0.875rem 1rem", verticalAlign: "middle" }}>
                          {/* Editors get a dropdown; admins can use actions menu */}
                          {!isAdmin ? (
                            <div style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
                              <select
                                value={task.status}
                                onChange={e => updateStatus(task.id, e.target.value as Task["status"])}
                                style={{
                                  appearance: "none",
                                  paddingRight: "1.6rem",
                                  ...selectStatusStyle(task.status),
                                }}
                              >
                                {ALL_STATUSES.map(s => (
                                  <option key={s} value={s}>{s}</option>
                                ))}
                              </select>
                              <ChevronDown size={11} style={{ position: "absolute", right: "0.45rem", pointerEvents: "none", color: STATUS_BADGE[task.status].text }} />
                            </div>
                          ) : (
                            <StatusBadge status={task.status} />
                          )}
                        </td>

                        {/* Actions & Submit Work */}
                        <td style={{ padding: "0.875rem 1rem", verticalAlign: "middle", textAlign: "center" }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                            {task.status !== "Completed" ? (
                              <button
                                onClick={() => {
                                  setSelectedTaskForSubmit(task);
                                  setSubmitWorkLink(task.workLink || "");
                                  setSubmitNotes(task.submissionNotes || "");
                                  setShowSubmitModal(true);
                                }}
                                title="Submit work with deliverable link to notify admin"
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px",
                                  background: "#1A56DB",
                                  color: "#fff",
                                  border: "none",
                                  borderRadius: 6,
                                  padding: "4px 9px",
                                  fontSize: "0.74rem",
                                  fontWeight: 700,
                                  cursor: "pointer",
                                  whiteSpace: "nowrap",
                                  boxShadow: "0 1px 2px rgba(26,86,219,0.2)",
                                }}
                              >
                                <Send size={11} /> Submit Work
                              </button>
                            ) : task.workLink ? (
                              <a
                                href={task.workLink.startsWith("http") ? task.workLink : `https://${task.workLink}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Open deliverables"
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px",
                                  background: "#EFF6FF",
                                  border: "1px solid #BFDBFE",
                                  color: "#1A56DB",
                                  borderRadius: 6,
                                  padding: "3px 8px",
                                  fontSize: "0.72rem",
                                  fontWeight: 700,
                                  textDecoration: "none",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                <ExternalLink size={11} /> Deliverables ↗
                              </a>
                            ) : (
                              <span style={{ fontSize: "0.74rem", color: "#059669", fontWeight: 700 }}>
                                ✓ Done
                              </span>
                            )}

                            <ActionsMenu task={task} allStatuses={ALL_STATUSES} onStatusChange={updateStatus} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Create Task Modal (Admin only) ── */}
      {showModal && (
        <div
          onClick={() => setShowModal(false)}
          style={{
            position: "fixed", inset: 0, background: "rgba(17,24,39,0.55)",
            zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center",
            padding: "1rem", backdropFilter: "blur(2px)",
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: "#fff", border: "1px solid #E5E7EB",
              borderRadius: 12, width: "100%", maxWidth: 540,
              boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
              overflow: "hidden",
            }}
          >
            {/* Modal header */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "1.25rem 1.5rem",
              borderBottom: "1px solid #E5E7EB",
            }}>
              <div>
                <h2 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#111827", margin: 0 }}>Create Task</h2>
                <p style={{ fontSize: "0.78rem", color: "#6B7280", marginTop: "0.2rem" }}>Fill in the details and assign to a team member.</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  background: "none", border: "1px solid #E5E7EB", borderRadius: 6,
                  padding: "0.35rem", cursor: "pointer", color: "#6B7280",
                  display: "flex", transition: "all 0.15s",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "#F9FAFB"; (e.currentTarget as HTMLButtonElement).style.color = "#111827"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "none"; (e.currentTarget as HTMLButtonElement).style.color = "#6B7280"; }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal body */}
            <form onSubmit={handleCreate} style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.1rem" }}>

              {/* Title */}
              <div style={fieldWrap}>
                <label style={labelStyle}>Task Title <span style={{ color: "#EF4444" }}>*</span></label>
                <input
                  required
                  placeholder="e.g. Edit product video for TechCorp"
                  value={form.title}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  style={inputStyle}
                  onFocus={e => (e.currentTarget.style.borderColor = "#1A56DB")}
                  onBlur={e => (e.currentTarget.style.borderColor = "#E5E7EB")}
                />
              </div>

              {/* Description */}
              <div style={fieldWrap}>
                <label style={labelStyle}>Description</label>
                <textarea
                  rows={3}
                  placeholder="What needs to be done…"
                  value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  style={{ ...inputStyle, resize: "none", lineHeight: 1.55 }}
                  onFocus={e => (e.currentTarget.style.borderColor = "#1A56DB")}
                  onBlur={e => (e.currentTarget.style.borderColor = "#E5E7EB")}
                />
              </div>

              {/* Assignee + Status */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div style={fieldWrap}>
                  <label style={labelStyle}>Assign To <span style={{ color: "#EF4444" }}>*</span></label>
                  <select
                    required
                    value={form.assigneeId}
                    onChange={e => setForm(p => ({ ...p, assigneeId: e.target.value }))}
                    style={inputStyle}
                    onFocus={e => (e.currentTarget.style.borderColor = "#1A56DB")}
                    onBlur={e => (e.currentTarget.style.borderColor = "#E5E7EB")}
                  >
                    <option value="">Select member…</option>
                    {teamMembers.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.role.charAt(0) + m.role.slice(1).toLowerCase()})
                      </option>
                    ))}
                  </select>
                </div>
                <div style={fieldWrap}>
                  <label style={labelStyle}>Initial Status</label>
                  <select
                    value={form.status}
                    onChange={e => setForm(p => ({ ...p, status: e.target.value as Task["status"] }))}
                    style={inputStyle}
                    onFocus={e => (e.currentTarget.style.borderColor = "#1A56DB")}
                    onBlur={e => (e.currentTarget.style.borderColor = "#E5E7EB")}
                  >
                    {ALL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {/* Priority + Due Date */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div style={fieldWrap}>
                  <label style={labelStyle}>Priority</label>
                  <select
                    value={form.priority}
                    onChange={e => setForm(p => ({ ...p, priority: e.target.value as Task["priority"] }))}
                    style={inputStyle}
                    onFocus={e => (e.currentTarget.style.borderColor = "#1A56DB")}
                    onBlur={e => (e.currentTarget.style.borderColor = "#E5E7EB")}
                  >
                    <option>High</option>
                    <option>Medium</option>
                    <option>Low</option>
                  </select>
                </div>
                <div style={fieldWrap}>
                  <label style={labelStyle}>Due Date</label>
                  <input
                    type="date"
                    value={form.due}
                    onChange={e => setForm(p => ({ ...p, due: e.target.value }))}
                    style={{ ...inputStyle }}
                    onFocus={e => (e.currentTarget.style.borderColor = "#1A56DB")}
                    onBlur={e => (e.currentTarget.style.borderColor = "#E5E7EB")}
                  />
                </div>
              </div>

              {/* Raw Files / Task Folder Link */}
              <div style={fieldWrap}>
                <label style={labelStyle}>📂 Raw Files / Task Folder Link (Optional)</label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/drive/folders/... (Google Drive, Dropbox, OneDrive)"
                  value={form.rawFilesLink}
                  onChange={e => setForm(p => ({ ...p, rawFilesLink: e.target.value }))}
                  style={inputStyle}
                  onFocus={e => (e.currentTarget.style.borderColor = "#1A56DB")}
                  onBlur={e => (e.currentTarget.style.borderColor = "#E5E7EB")}
                />
                <span style={{ fontSize: "0.72rem", color: "#6B7280", marginTop: "0.2rem" }}>
                  Provide the cloud folder link containing raw photos or footage for the assigned editor.
                </span>
              </div>

              {/* Footer */}
              <div style={{ display: "flex", gap: "0.75rem", paddingTop: "0.25rem" }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    flex: 1, padding: "0.65rem", borderRadius: 6,
                    border: "1px solid #E5E7EB", background: "#fff",
                    color: "#374151", fontWeight: 600, fontSize: "0.85rem",
                    cursor: "pointer", transition: "background 0.15s",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#F9FAFB")}
                  onMouseLeave={e => (e.currentTarget.style.background = "#fff")}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    flex: 1, padding: "0.65rem", borderRadius: 6,
                    border: "none", background: saving ? "#93C5FD" : "#1A56DB",
                    color: "#fff", fontWeight: 600, fontSize: "0.85rem",
                    cursor: saving ? "not-allowed" : "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={e => { if (!saving) (e.currentTarget as HTMLButtonElement).style.background = "#1648C4"; }}
                  onMouseLeave={e => { if (!saving) (e.currentTarget as HTMLButtonElement).style.background = "#1A56DB"; }}
                >
                  {saving && <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />}
                  {saving ? "Creating…" : "Create Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Submit Work Deliverables Modal ── */}
      {showSubmitModal && selectedTaskForSubmit && (
        <div
          onClick={() => setShowSubmitModal(false)}
          style={{
            position: "fixed", inset: 0, background: "rgba(17,24,39,0.55)",
            zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center",
            padding: "1rem", backdropFilter: "blur(2px)",
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: "#fff", border: "1px solid #E5E7EB",
              borderRadius: 12, width: "100%", maxWidth: 540,
              boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
              overflow: "hidden",
            }}
          >
            {/* Modal header */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "1.25rem 1.5rem",
              borderBottom: "1px solid #E5E7EB",
            }}>
              <div>
                <h2 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#111827", margin: 0, display: "flex", alignItems: "center", gap: "6px" }}>
                  <Send size={18} style={{ color: "#1A56DB" }} /> Submit Work & Deliverables
                </h2>
                <p style={{ fontSize: "0.78rem", color: "#6B7280", marginTop: "0.2rem" }}>
                  Task: <strong style={{ color: "#111827" }}>{selectedTaskForSubmit.title}</strong>
                </p>
              </div>
              <button
                onClick={() => setShowSubmitModal(false)}
                style={{
                  background: "none", border: "1px solid #E5E7EB", borderRadius: 6,
                  padding: "0.35rem", cursor: "pointer", color: "#6B7280",
                  display: "flex", transition: "all 0.15s",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "#F9FAFB"; (e.currentTarget as HTMLButtonElement).style.color = "#111827"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "none"; (e.currentTarget as HTMLButtonElement).style.color = "#6B7280"; }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal body */}
            <form onSubmit={handleSubmitTaskWork} style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.1rem" }}>
              {selectedTaskForSubmit.rawFilesLink && (
                <div style={{
                  padding: "0.75rem",
                  background: "#EFF6FF",
                  border: "1px solid #BFDBFE",
                  borderRadius: 8,
                  fontSize: "0.78rem",
                  color: "#1E40AF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "8px",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <Folder size={15} style={{ color: "#1A56DB", flexShrink: 0 }} />
                    <span>Raw Files Provided:</span>
                  </div>
                  <a
                    href={selectedTaskForSubmit.rawFilesLink.startsWith("http") ? selectedTaskForSubmit.rawFilesLink : `https://${selectedTaskForSubmit.rawFilesLink}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      background: "#1A56DB",
                      color: "#fff",
                      textDecoration: "none",
                      padding: "4px 8px",
                      borderRadius: 6,
                      fontSize: "0.72rem",
                      fontWeight: 600,
                    }}
                  >
                    Open Task Folder <ExternalLink size={11} />
                  </a>
                </div>
              )}

              {/* Work Deliverables Link */}
              <div style={fieldWrap}>
                <label style={labelStyle}>
                  Deliverables / Output Link <span style={{ color: "#EF4444" }}>*</span>
                </label>
                <input
                  required
                  type="url"
                  placeholder="https://drive.google.com/drive/folders/... (Google Drive, Dropbox, Frame.io)"
                  value={submitWorkLink}
                  onChange={e => setSubmitWorkLink(e.target.value)}
                  style={inputStyle}
                  onFocus={e => (e.currentTarget.style.borderColor = "#1A56DB")}
                  onBlur={e => (e.currentTarget.style.borderColor = "#E5E7EB")}
                />
                <span style={{ fontSize: "0.72rem", color: "#6B7280", marginTop: "0.2rem" }}>
                  Admins (Mukul / Mukesh) will receive an instant notification with this link for QC approval.
                </span>
              </div>

              {/* Submission Notes */}
              <div style={fieldWrap}>
                <label style={labelStyle}>Notes / Changes Made (Optional)</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Exported in 4K ProRes and 1080p MP4. Completed color grade and sound balancing as requested."
                  value={submitNotes}
                  onChange={e => setSubmitNotes(e.target.value)}
                  style={{ ...inputStyle, resize: "vertical" }}
                  onFocus={e => (e.currentTarget.style.borderColor = "#1A56DB")}
                  onBlur={e => (e.currentTarget.style.borderColor = "#E5E7EB")}
                />
              </div>

              {/* Footer */}
              <div style={{ display: "flex", gap: "0.75rem", paddingTop: "0.25rem" }}>
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  style={{
                    flex: 1, padding: "0.65rem", borderRadius: 6,
                    border: "1px solid #E5E7EB", background: "#fff",
                    color: "#374151", fontWeight: 600, fontSize: "0.85rem",
                    cursor: "pointer", transition: "background 0.15s",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#F9FAFB")}
                  onMouseLeave={e => (e.currentTarget.style.background = "#fff")}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingWork}
                  style={{
                    flex: 1, padding: "0.65rem", borderRadius: 6,
                    border: "none", background: submittingWork ? "#93C5FD" : "#1A56DB",
                    color: "#fff", fontWeight: 600, fontSize: "0.85rem",
                    cursor: submittingWork ? "not-allowed" : "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={e => { if (!submittingWork) (e.currentTarget as HTMLButtonElement).style.background = "#1648C4"; }}
                  onMouseLeave={e => { if (!submittingWork) (e.currentTarget as HTMLButtonElement).style.background = "#1A56DB"; }}
                >
                  {submittingWork && <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />}
                  {submittingWork ? "Submitting…" : "Submit Deliverables"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Spin keyframe */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}

// ─── Shared style helpers ─────────────────────────────────────────────────────

const thStyle: React.CSSProperties = {
  padding: "0.75rem 1rem",
  textAlign: "left",
  fontSize: "0.75rem",
  fontWeight: 600,
  color: "#6B7280",
  letterSpacing: "0.03em",
  textTransform: "uppercase",
  whiteSpace: "nowrap",
};

const fieldWrap: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "0.35rem",
};

const labelStyle: React.CSSProperties = {
  fontSize: "0.8rem",
  fontWeight: 600,
  color: "#374151",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.6rem 0.8rem",
  borderRadius: 6,
  border: "1px solid #E5E7EB",
  background: "#fff",
  color: "#111827",
  colorScheme: "light",
  fontSize: "0.85rem",
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "Inter, system-ui, sans-serif",
  transition: "border-color 0.15s",
};

function selectStatusStyle(status: Task["status"]): React.CSSProperties {
  const s = STATUS_BADGE[status];
  return {
    padding: "0.2rem 0.65rem",
    borderRadius: "999px",
    border: `1px solid ${s.border}`,
    background: s.bg,
    color: s.text,
    fontSize: "0.72rem",
    fontWeight: 600,
    outline: "none",
    cursor: "pointer",
    fontFamily: "Inter, system-ui, sans-serif",
    transition: "all 0.15s",
  };
}
