"use client";

import { useState, useEffect } from "react";
import { UserPlus, Mail, Phone, Search, Trash2, X, MoreHorizontal, Eye, Edit3 } from "lucide-react";
import { RoleGuard } from "@/components/RoleGuard";
import { useRole } from "@/context/RoleContext";

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg: "#F5F7FB",
  card: "#FFFFFF",
  border: "#E5E7EB",
  primary: "#1A56DB",
  text: "#111827",
  muted: "#6B7280",
  radius: "8px",
  radiusSm: "6px",
  radiusPill: "999px",
};

// ─── Types ────────────────────────────────────────────────────────────────────
type Member = {
  id: number | string;
  name: string;
  role: string;
  email: string;
  phone: string;
  status: "online" | "offline" | "away";
  initials: string;
};

const initialTeam: Member[] = [
  { id: 1, name: "Mukul",   role: "Admin",     email: "mukul@resawc.com",     phone: "+91 9800000001", status: "online",  initials: "MK" },
  { id: 2, name: "Mukesh",  role: "Admin",     email: "mukesh@resawc.com",    phone: "+91 9800000002", status: "online",  initials: "MS" },
  { id: 3, name: "Marketing User", role: "Marketing", email: "marketing@resawc.com", phone: "+91 9800000003", status: "away", initials: "MR" },
  { id: 4, name: "Editor User",    role: "Editor",    email: "editor@resawc.com",    phone: "+91 9800000004", status: "offline", initials: "ED" },
];

// Role badge colors
const roleBadge = (role: string): React.CSSProperties => {
  const norm = role.toLowerCase().replace(/\s+/g, '_');
  const map: Record<string, { bg: string; color: string }> = {
    admin:        { bg: "#FEF2F2", color: "#DC2626" },
    marketing:    { bg: "#EEF2FF", color: "#4F46E5" },
    photo_editor: { bg: "#ECFDF5", color: "#059669" },
    video_editor: { bg: "#FFF7ED", color: "#EA580C" },
    editor:       { bg: "#ECFDF5", color: "#059669" },
    production:   { bg: "#ECFDF5", color: "#059669" },
  };
  const c = map[norm] || { bg: "#F3F4F6", color: "#6B7280" };
  return {
    display: "inline-block",
    padding: "0.2rem 0.6rem",
    borderRadius: "999px",
    fontSize: "0.72rem",
    fontWeight: 700,
    background: c.bg,
    color: c.color,
  };
};

// Avatar palette
const avatarPalette = ["#1A56DB", "#7C3AED", "#059669", "#D97706", "#DC2626", "#0891B2"];

function getAvatarColor(index: number) {
  return avatarPalette[index % avatarPalette.length];
}

// ─── Add Member Modal ─────────────────────────────────────────────────────────
function AddMemberModal({ onClose, onAdd }: { onClose: () => void; onAdd: (m: Member) => void }) {
  const [form, setForm] = useState({ name: "", role: "Marketing", email: "", phone: "", password: "" });
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "0.55rem 0.75rem",
    border: `1px solid ${C.border}`,
    borderRadius: C.radiusSm,
    fontSize: "0.875rem",
    color: C.text,
    background: "#fff",
    outline: "none",
    boxSizing: "border-box",
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      setErr("Name, Email and Password are required.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          role: form.role,
        }),
      });
      const data = await res.json();
      if (data.success) {
        const initials = form.name
          .split(" ")
          .map((w: string) => w[0])
          .join("")
          .slice(0, 2)
          .toUpperCase();
        onAdd({
          id: data.data.id,
          name: form.name,
          role: form.role,
          email: form.email,
          phone: form.phone,
          status: "offline",
          initials,
        });
        onClose();
      } else {
        setErr(data.error || "Failed to create user");
      }
    } catch {
      setErr("Connection error. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
    >
      <div
        style={{
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: C.radius,
          width: "100%",
          maxWidth: 440,
          padding: "2rem",
          boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1.5rem",
          }}
        >
          <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: C.text, margin: 0 }}>
            Add New Member
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: C.muted,
              cursor: "pointer",
              padding: "0.25rem",
            }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: C.muted, marginBottom: "0.35rem" }}>
              Full Name *
            </label>
            <input
              style={inputStyle}
              placeholder="e.g. Rahul Sharma"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: C.muted, marginBottom: "0.35rem" }}>
              Role *
            </label>
            <select
              style={inputStyle}
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
            >
              <option value="Admin">Admin</option>
              <option value="Marketing">Marketing</option>
              <option value="photo_editor">Production (Photo)</option>
              <option value="video_editor">Video Editing</option>
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: C.muted, marginBottom: "0.35rem" }}>
              Email *
            </label>
            <input
              style={inputStyle}
              type="email"
              placeholder="name@resawc.com"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: C.muted, marginBottom: "0.35rem" }}>
              Phone
            </label>
            <input
              style={inputStyle}
              placeholder="+91 9800000000"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: C.muted, marginBottom: "0.35rem" }}>
              Password *
            </label>
            <input
              style={inputStyle}
              type="password"
              placeholder="Set login password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            />
          </div>

          {err && (
            <p style={{ color: "#DC2626", fontSize: "0.85rem", margin: 0 }}>{err}</p>
          )}

          <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.25rem" }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: "0.7rem",
                border: `1px solid ${C.border}`,
                borderRadius: C.radiusSm,
                background: "#fff",
                color: C.text,
                fontWeight: 600,
                fontSize: "0.875rem",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{
                flex: 1,
                padding: "0.7rem",
                border: "none",
                borderRadius: C.radiusSm,
                background: saving ? "#93C5FD" : C.primary,
                color: "#fff",
                fontWeight: 700,
                fontSize: "0.875rem",
                cursor: saving ? "not-allowed" : "pointer",
              }}
            >
              {saving ? "Adding…" : "Add Member"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Edit Member Modal ─────────────────────────────────────────────────────────
function EditMemberModal({
  member,
  onClose,
  onUpdate,
}: {
  member: Member;
  onClose: () => void;
  onUpdate: (updated: Member) => void;
}) {
  const [form, setForm] = useState({
    name: member.name,
    email: member.email,
    role: member.role,
    phone: member.phone || "",
  });
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "0.55rem 0.75rem",
    border: `1px solid ${C.border}`,
    borderRadius: C.radiusSm,
    fontSize: "0.875rem",
    color: C.text,
    background: "#fff",
    outline: "none",
    boxSizing: "border-box",
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email) {
      setErr("Name and Email are required.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: member.id,
          name: form.name,
          email: form.email,
          role: form.role,
        }),
      });
      const data = await res.json();
      if (data.success) {
        onUpdate({
          ...member,
          name: form.name,
          email: form.email,
          role: form.role,
          phone: form.phone,
        });
        onClose();
      } else {
        setErr(data.error || "Failed to update member");
      }
    } catch {
      setErr("Network error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: C.radius, width: "100%", maxWidth: 440, padding: "1.75rem", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: C.text, margin: 0 }}>Edit Member</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: C.muted }}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: C.muted, marginBottom: "0.35rem" }}>Full Name *</label>
            <input style={inputStyle} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: C.muted, marginBottom: "0.35rem" }}>Role *</label>
            <select style={inputStyle} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="Admin">Admin</option>
              <option value="Marketing">Marketing</option>
              <option value="photo_editor">Production (Photo)</option>
              <option value="video_editor">Video Editing</option>
            </select>
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: C.muted, marginBottom: "0.35rem" }}>Email *</label>
            <input style={inputStyle} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: C.muted, marginBottom: "0.35rem" }}>Phone</label>
            <input style={inputStyle} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          {err && <p style={{ color: "#DC2626", fontSize: "0.85rem", margin: 0 }}>{err}</p>}
          <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.25rem" }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: "0.7rem", border: `1px solid ${C.border}`, borderRadius: C.radiusSm, background: "#fff", color: C.text, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
            <button type="submit" disabled={saving} style={{ flex: 1, padding: "0.7rem", border: "none", borderRadius: C.radiusSm, background: C.primary, color: "#fff", fontWeight: 700, cursor: "pointer" }}>{saving ? "Saving…" : "Save Changes"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────
function DeleteModal({
  memberName,
  onConfirm,
  onCancel,
}: {
  memberName: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
    >
      <div
        style={{
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: C.radius,
          width: "100%",
          maxWidth: 360,
          padding: "2rem",
          textAlign: "center",
          boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
        }}
      >
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: "14px",
            background: "#FEF2F2",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 1rem",
          }}
        >
          <Trash2 color="#DC2626" size={24} />
        </div>
        <h3 style={{ fontWeight: 700, color: C.text, marginBottom: "0.5rem" }}>Remove Member?</h3>
        <p style={{ fontSize: "0.875rem", color: C.muted, marginBottom: "1.5rem", lineHeight: 1.5 }}>
          <strong style={{ color: C.text }}>{memberName}</strong> will be permanently removed from the team.
          This action cannot be undone.
        </p>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: "0.7rem",
              border: `1px solid ${C.border}`,
              borderRadius: C.radiusSm,
              background: "#fff",
              color: C.text,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1,
              padding: "0.7rem",
              border: "none",
              borderRadius: C.radiusSm,
              background: "#DC2626",
              color: "#fff",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Team Content ─────────────────────────────────────────────────────────────
const PAGE_SIZE = 10;

function TeamContent() {
  const { user } = useRole();
  const isAdmin = user?.role === "admin";

  const [team, setTeam] = useState<Member[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [query, setQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Member | null>(null);
  const [editMember, setEditMember] = useState<Member | null>(null);
  const [page, setPage] = useState(1);

  // Load from real DB on mount
  useEffect(() => {
    fetch("/api/users")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setTeam(
            data.data.map((u: any) => ({
              id: u.id,
              name: u.name,
              role: u.role.charAt(0) + u.role.slice(1).toLowerCase(),
              email: u.email,
              phone: "",
              status: "offline" as const,
              initials: u.name
                .split(" ")
                .map((w: string) => w[0])
                .join("")
                .slice(0, 2)
                .toUpperCase(),
            }))
          );
        } else {
          setTeam(initialTeam);
        }
        setLoaded(true);
      })
      .catch(() => {
        setTeam(initialTeam);
        setLoaded(true);
      });
  }, []);

  // Delete from real DB
  const handleDelete = async (id: number | string) => {
    try {
      await fetch("/api/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
    } catch {}
    setTeam((t) => t.filter((m) => m.id !== id));
    setConfirmDelete(null);
  };

  const tabs = ["all", "admins", "marketing", "production", "video editing"];

  const filtered = team.filter((m) => {
    const r = m.role.toLowerCase();
    const matchTab =
      activeTab === "all" ||
      (activeTab === "admins" && r.includes("admin")) ||
      (activeTab === "marketing" && r.includes("marketing")) ||
      (activeTab === "production" && (r.includes("photo") || r.includes("production") || r === "editor")) ||
      (activeTab === "video editing" && r.includes("video"));
    const matchQ =
      m.name.toLowerCase().includes(query.toLowerCase()) ||
      m.email.toLowerCase().includes(query.toLowerCase());
    return matchTab && matchQ;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleAdd = (member: Member) => {
    setTeam((t) => [...t, member]);
    setPage(1);
  };

  // Helpers
  const thStyle: React.CSSProperties = {
    padding: "0.75rem 1rem",
    textAlign: "left",
    fontSize: "0.75rem",
    fontWeight: 600,
    color: C.muted,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    borderBottom: `1px solid ${C.border}`,
    background: "#F9FAFB",
    whiteSpace: "nowrap",
  };

  const tdStyle: React.CSSProperties = {
    padding: "0.875rem 1rem",
    fontSize: "0.875rem",
    color: C.text,
    borderBottom: `1px solid ${C.border}`,
    verticalAlign: "middle",
  };

  return (
    <>
      {showModal && isAdmin && (
        <AddMemberModal onClose={() => setShowModal(false)} onAdd={handleAdd} />
      )}
      {confirmDelete && (
        <DeleteModal
          memberName={confirmDelete.name}
          onConfirm={() => handleDelete(confirmDelete.id)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
      {editMember && (
        <EditMemberModal
          member={editMember}
          onClose={() => setEditMember(null)}
          onUpdate={(updated) => {
            setTeam((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
          }}
        />
      )}

      <div style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
        {/* ── Page Header ──────────────────────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "1rem",
            marginBottom: "1.75rem",
          }}
        >
          <div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: C.text, margin: 0 }}>
              Team &amp; Members
            </h1>
            <p style={{ fontSize: "0.875rem", color: C.muted, margin: "0.25rem 0 0 0" }}>
              {team.length} members in the workspace
            </p>
          </div>
          {isAdmin && (
            <button
              onClick={() => setShowModal(true)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.55rem 1.1rem",
                background: C.primary,
                color: "#fff",
                border: "none",
                borderRadius: C.radiusSm,
                fontSize: "0.875rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <UserPlus size={16} /> Add Member
            </button>
          )}
        </div>

        {/* ── White Card ───────────────────────────────────────────────────── */}
        <div
          style={{
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: C.radius,
          }}
        >
          {/* Toolbar */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "0.75rem",
              padding: "1rem 1.25rem",
              borderBottom: `1px solid ${C.border}`,
            }}
          >
            {/* Role tabs */}
            <div style={{ display: "flex", gap: "0.25rem" }}>
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => { setActiveTab(tab); setPage(1); }}
                  style={{
                    padding: "0.4rem 0.85rem",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    borderRadius: C.radiusSm,
                    border: "none",
                    cursor: "pointer",
                    textTransform: "capitalize",
                    background: activeTab === tab ? C.primary : "transparent",
                    color: activeTab === tab ? "#fff" : C.muted,
                    transition: "all 0.15s",
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Search */}
            <div style={{ position: "relative" }}>
              <Search
                size={15}
                style={{
                  position: "absolute",
                  left: "0.75rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: C.muted,
                }}
              />
              <input
                value={query}
                onChange={(e) => { setQuery(e.target.value); setPage(1); }}
                placeholder="Search members…"
                style={{
                  paddingLeft: "2.25rem",
                  paddingRight: "0.75rem",
                  paddingTop: "0.45rem",
                  paddingBottom: "0.45rem",
                  border: `1px solid ${C.border}`,
                  borderRadius: C.radiusSm,
                  fontSize: "0.875rem",
                  color: C.text,
                  outline: "none",
                  width: "220px",
                  background: "#fff",
                }}
              />
            </div>
          </div>

          {/* Table */}
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ ...thStyle, width: 40 }}>
                    <input type="checkbox" style={{ cursor: "pointer" }} />
                  </th>
                  <th style={thStyle}>Full Name</th>
                  <th style={thStyle}>Email</th>
                  <th style={thStyle}>Role</th>
                  <th style={thStyle}>Phone</th>
                  <th style={{ ...thStyle, textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {!loaded ? (
                  <tr>
                    <td colSpan={6} style={{ ...tdStyle, textAlign: "center", color: C.muted, padding: "3rem" }}>
                      Loading…
                    </td>
                  </tr>
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ ...tdStyle, textAlign: "center", color: C.muted, padding: "3rem" }}>
                      No members found.
                    </td>
                  </tr>
                ) : (
                  paginated.map((member, i) => {
                    const globalIdx = (page - 1) * PAGE_SIZE + i;
                    const avatarColor = getAvatarColor(globalIdx);
                    return (
                      <tr
                        key={member.id}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#F9FAFB")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                        style={{ transition: "background 0.15s" }}
                      >
                        {/* Checkbox */}
                        <td style={{ ...tdStyle, width: 40 }}>
                          <input type="checkbox" style={{ cursor: "pointer" }} />
                        </td>

                        {/* Name + Avatar */}
                        <td style={tdStyle}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                            <div
                              style={{
                                width: 36,
                                height: 36,
                                borderRadius: "50%",
                                background: avatarColor,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "#fff",
                                fontSize: "0.75rem",
                                fontWeight: 700,
                                flexShrink: 0,
                              }}
                            >
                              {member.initials}
                            </div>
                            <span style={{ fontWeight: 600, color: C.text }}>
                              {member.name}
                            </span>
                          </div>
                        </td>

                        {/* Email */}
                        <td style={{ ...tdStyle, color: C.muted }}>
                          <a
                            href={`mailto:${member.email}`}
                            style={{ color: C.muted, textDecoration: "none" }}
                          >
                            {member.email}
                          </a>
                        </td>

                        {/* Role badge */}
                        <td style={tdStyle}>
                          {isAdmin ? (
                            <select
                              value={member.role.toLowerCase().replace(/\s+/g, '_')}
                              onChange={async (e) => {
                                const newRole = e.target.value;
                                try {
                                  const res = await fetch("/api/users", {
                                    method: "PATCH",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ id: member.id, role: newRole }),
                                  });
                                  const data = await res.json();
                                  if (data.success) {
                                    setTeam(prev => prev.map(m => m.id === member.id ? { ...m, role: newRole } : m));
                                  }
                                } catch {}
                              }}
                              style={{
                                ...roleBadge(member.role),
                                border: "1px solid " + C.border,
                                outline: "none",
                                cursor: "pointer",
                                padding: "0.2rem 0.5rem",
                              }}
                            >
                              <option value="admin">Admin</option>
                              <option value="marketing">Marketing</option>
                              <option value="photo_editor">Production (Photo)</option>
                              <option value="video_editor">Video Editing</option>
                            </select>
                          ) : (
                            <span style={roleBadge(member.role)}>
                              {member.role.toLowerCase().includes("photo") ? "Production" :
                               member.role.toLowerCase().includes("video") ? "Video Editing" :
                               member.role}
                            </span>
                          )}
                        </td>

                        {/* Phone */}
                        <td style={{ ...tdStyle, color: C.muted }}>
                          {member.phone ? (
                            <a
                              href={`tel:${member.phone}`}
                              style={{ color: C.muted, textDecoration: "none" }}
                            >
                              {member.phone}
                            </a>
                          ) : (
                            "—"
                          )}
                        </td>

                        {/* Actions */}
                        <td style={{ ...tdStyle, textAlign: "right" }}>
                          <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", alignItems: "center" }}>
                            <a
                              href={`mailto:${member.email}`}
                              title="View profile"
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.3rem",
                                padding: "0.35rem 0.75rem",
                                border: `1px solid ${C.border}`,
                                borderRadius: C.radiusSm,
                                background: "#fff",
                                color: C.text,
                                fontSize: "0.78rem",
                                fontWeight: 600,
                                textDecoration: "none",
                                cursor: "pointer",
                              }}
                            >
                              <Eye size={13} /> View
                            </a>
                            {isAdmin && (
                              <button
                                onClick={() => setEditMember(member)}
                                title="Edit member details"
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "0.3rem",
                                  padding: "0.35rem 0.75rem",
                                  border: `1px solid ${C.border}`,
                                  borderRadius: C.radiusSm,
                                  background: "#fff",
                                  color: C.primary,
                                  fontSize: "0.78rem",
                                  fontWeight: 600,
                                  cursor: "pointer",
                                }}
                              >
                                <Edit3 size={13} /> Edit
                              </button>
                            )}
                            {isAdmin && (
                              <button
                                onClick={() => setConfirmDelete(member)}
                                title="Remove member"
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  width: 32,
                                  height: 32,
                                  border: `1px solid #FECACA`,
                                  borderRadius: C.radiusSm,
                                  background: "#FEF2F2",
                                  color: "#DC2626",
                                  cursor: "pointer",
                                }}
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filtered.length > PAGE_SIZE && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "0.875rem 1.25rem",
                borderTop: `1px solid ${C.border}`,
              }}
            >
              <span style={{ fontSize: "0.8rem", color: C.muted }}>
                Showing {(page - 1) * PAGE_SIZE + 1}–
                {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} members
              </span>
              <div style={{ display: "flex", gap: "0.4rem" }}>
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  style={{
                    padding: "0.35rem 0.75rem",
                    border: `1px solid ${C.border}`,
                    borderRadius: C.radiusSm,
                    background: page === 1 ? "#F9FAFB" : "#fff",
                    color: page === 1 ? C.muted : C.text,
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    cursor: page === 1 ? "not-allowed" : "pointer",
                  }}
                >
                  ← Prev
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    style={{
                      padding: "0.35rem 0.65rem",
                      border: `1px solid ${page === p ? C.primary : C.border}`,
                      borderRadius: C.radiusSm,
                      background: page === p ? C.primary : "#fff",
                      color: page === p ? "#fff" : C.text,
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      minWidth: 32,
                    }}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  style={{
                    padding: "0.35rem 0.75rem",
                    border: `1px solid ${C.border}`,
                    borderRadius: C.radiusSm,
                    background: page === totalPages ? "#F9FAFB" : "#fff",
                    color: page === totalPages ? C.muted : C.text,
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    cursor: page === totalPages ? "not-allowed" : "pointer",
                  }}
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Page Export ──────────────────────────────────────────────────────────────
export default function TeamManagement() {
  return (
    <RoleGuard allowedRoles={["admin"]} redirectTo="/dashboard/tasks">
      <TeamContent />
    </RoleGuard>
  );
}
