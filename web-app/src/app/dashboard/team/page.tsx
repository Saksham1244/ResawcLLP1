"use client";

import { useState } from "react";
import { UserPlus, Mail, Phone, Search, Trash2, X } from "lucide-react";
import { RoleGuard } from "@/components/RoleGuard";

type Member = {
  id: number;
  name: string;
  role: "Admin" | "Marketing" | "Editor";
  email: string;
  phone: string;
  status: "online" | "offline" | "away";
  initials: string;
};

const initialTeam: Member[] = [
  { id: 1, name: "Mukul",   role: "Admin",     email: "mukul@resawc.com",     phone: "+91 9800000001", status: "online",  initials: "MK" },
  { id: 2, name: "Mukesh",  role: "Admin",     email: "mukesh@resawc.com",    phone: "+91 9800000002", status: "online",  initials: "MS" },
  { id: 3, name: "Marketing User", role: "Marketing", email: "marketing@resawc.com", phone: "+91 9800000003", status: "away",    initials: "MR" },
  { id: 4, name: "Editor User",    role: "Editor",    email: "editor@resawc.com",    phone: "+91 9800000004", status: "offline", initials: "ED" },
];

const roleColors: Record<string, { bg: string; text: string }> = {
  Admin:     { bg: "rgba(244,63,94,0.15)",   text: "#f43f5e" },
  Marketing: { bg: "rgba(99,102,241,0.15)",  text: "#818cf8" },
  Editor:    { bg: "rgba(167,139,250,0.15)", text: "#a78bfa" },
};

const avatarColors = ["#f43f5e", "#f43f5e", "#6366f1", "#8b5cf6", "#06b6d4", "#f59e0b", "#10b981"];

function AddMemberModal({ onClose, onAdd }: { onClose: () => void; onAdd: (m: Member) => void }) {
  const [form, setForm] = useState({ name: "", role: "Marketing" as Member["role"], email: "", phone: "" });
  const [err, setErr] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email) { setErr("Name and Email are required."); return; }
    const initials = form.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
    onAdd({ id: Date.now(), ...form, status: "offline", initials });
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '440px', padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Add New Member</h2>
          <button onClick={onClose} className="btn btn-ghost" style={{ padding: '0.3rem' }}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label className="text-sm font-semibold" style={{ display: 'block', marginBottom: '0.4rem' }}>Full Name *</label>
            <input className="input" style={{ width: '100%' }} placeholder="e.g. Rahul Sharma" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <label className="text-sm font-semibold" style={{ display: 'block', marginBottom: '0.4rem' }}>Role *</label>
            <select className="input" style={{ width: '100%' }} value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value as Member["role"] }))}>
              <option value="Admin">Admin</option>
              <option value="Marketing">Marketing</option>
              <option value="Editor">Editor</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold" style={{ display: 'block', marginBottom: '0.4rem' }}>Email *</label>
            <input className="input" style={{ width: '100%' }} type="email" placeholder="name@resawc.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          </div>
          <div>
            <label className="text-sm font-semibold" style={{ display: 'block', marginBottom: '0.4rem' }}>Phone</label>
            <input className="input" style={{ width: '100%' }} placeholder="+91 9800000000" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
          </div>

          {err && <p style={{ color: '#ef4444', fontSize: '0.85rem' }}>{err}</p>}

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Add Member</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TeamContent() {
  const [team, setTeam] = useState<Member[]>(initialTeam);
  const [activeTab, setActiveTab] = useState("all");
  const [query, setQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  const filtered = team.filter(m => {
    const matchTab = activeTab === "all" || m.role.toLowerCase() === activeTab.replace("s", "").replace("admin", "admin");
    const matchQ = m.name.toLowerCase().includes(query.toLowerCase()) || m.email.toLowerCase().includes(query.toLowerCase());
    return matchTab && matchQ;
  });

  const handleAdd = (member: Member) => setTeam(t => [...t, member]);
  const handleDelete = (id: number) => { setTeam(t => t.filter(m => m.id !== id)); setConfirmDelete(null); };

  return (
    <div className="animate-fadeIn">
      {showModal && <AddMemberModal onClose={() => setShowModal(false)} onAdd={handleAdd} />}

      {/* Delete Confirm Modal */}
      {confirmDelete !== null && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="glass-card" style={{ maxWidth: '360px', width: '100%', padding: '2rem', textAlign: 'center' }}>
            <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
              <Trash2 color="#ef4444" size={24} />
            </div>
            <h3 style={{ fontWeight: 800, marginBottom: '0.5rem' }}>Remove Member?</h3>
            <p className="text-muted text-sm" style={{ marginBottom: '1.5rem' }}>This action cannot be undone. The member will be permanently removed from the team.</p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => setConfirmDelete(null)} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
              <button onClick={() => handleDelete(confirmDelete)} className="btn" style={{ flex: 1, background: '#ef4444', color: '#fff' }}>Remove</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex-between" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Team & Members</h1>
          <p className="text-muted text-sm">{team.length} members · {team.filter(m => m.status === "online").length} online</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <UserPlus size={16} /> Add Member
        </button>
      </div>

      {/* Filters + Search */}
      <div className="flex-between" style={{ marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {["all", "admins", "marketing", "editors"].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={activeTab === tab ? "btn btn-primary" : "btn btn-secondary"}
              style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem', textTransform: 'capitalize' }}>
              {tab}
            </button>
          ))}
        </div>
        <div style={{ position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--secondary-foreground)' }} />
          <input value={query} onChange={e => setQuery(e.target.value)} className="input" placeholder="Search members..." style={{ paddingLeft: '2.25rem', width: '220px' }} />
        </div>
      </div>

      {/* Team Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
        {filtered.map((member, i) => (
          <div key={member.id} className="glass-card" style={{ padding: '1.25rem' }}>
            <div className="flex-between" style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                <div style={{ position: 'relative' }}>
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '14px',
                    background: `linear-gradient(135deg, ${avatarColors[i % avatarColors.length]} 0%, ${avatarColors[(i + 2) % avatarColors.length]} 100%)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: '0.9rem', color: '#fff',
                    boxShadow: `0 4px 12px ${avatarColors[i % avatarColors.length]}60`,
                  }}>{member.initials}</div>
                  <div className={`status-dot status-${member.status}`} style={{ position: 'absolute', bottom: '-2px', right: '-2px', border: '2px solid var(--glass-bg)', width: '12px', height: '12px' }} />
                </div>
                <div>
                  <p className="font-semibold text-sm">{member.name}</p>
                  <span className="badge" style={{ ...roleColors[member.role], fontSize: '0.7rem', padding: '0.15rem 0.55rem' }}>{member.role}</span>
                </div>
              </div>
              <button
                className="btn btn-ghost"
                style={{ padding: '0.3rem', color: '#ef4444' }}
                onClick={() => setConfirmDelete(member.id)}
                title="Remove member"
              >
                <Trash2 size={16} />
              </button>
            </div>

            <p className="text-xs text-muted" style={{ marginBottom: '0.35rem' }}>{member.email}</p>
            {member.phone && <p className="text-xs text-muted" style={{ marginBottom: '0.875rem' }}>{member.phone}</p>}

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <a href={`mailto:${member.email}`} className="btn btn-secondary text-xs" style={{ flex: 1, padding: '0.4rem', gap: '0.3rem', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Mail size={13} /> Email
              </a>
              {member.phone && (
                <a href={`tel:${member.phone}`} className="btn btn-secondary text-xs" style={{ flex: 1, padding: '0.4rem', gap: '0.3rem', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Phone size={13} /> Call
                </a>
              )}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', color: 'var(--secondary-foreground)' }}>
            <p style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>👤</p>
            <p className="text-sm">No members found.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TeamManagement() {
  return (
    <RoleGuard allowedRoles={["admin"]} redirectTo="/dashboard/tasks">
      <TeamContent />
    </RoleGuard>
  );
}
