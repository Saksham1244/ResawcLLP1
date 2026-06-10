"use client";

import { useState } from "react";
import { UserPlus, Mail, Phone, MoreVertical, Search } from "lucide-react";
import { RoleGuard } from "@/components/RoleGuard";

const team = [
  { id: 1, name: "Sarah Connor", role: "Marketing", email: "sarah@resawc.com", status: "online", initials: "SC", leads: 14 },
  { id: 2, name: "Mike Davis", role: "Editor", email: "mike@resawc.com", status: "offline", initials: "MD", tasks: 3 },
  { id: 3, name: "Alex Johnson", role: "Admin", email: "alex@resawc.com", status: "online", initials: "AJ", leads: 0 },
  { id: 4, name: "Priya Sharma", role: "Marketing", email: "priya@resawc.com", status: "away", initials: "PS", leads: 11 },
  { id: 5, name: "James Wilson", role: "Editor", email: "james@resawc.com", status: "online", initials: "JW", tasks: 5 },
  { id: 6, name: "Nadia Khan", role: "Editor", email: "nadia@resawc.com", status: "offline", initials: "NK", tasks: 2 },
];

const roleColors: Record<string, { bg: string; text: string }> = {
  Admin: { bg: "rgba(244,63,94,0.15)", text: "#f43f5e" },
  Marketing: { bg: "rgba(99,102,241,0.15)", text: "#818cf8" },
  Editor: { bg: "rgba(167,139,250,0.15)", text: "#a78bfa" },
};

const avatarColors = ["#6366f1", "#8b5cf6", "#06b6d4", "#f59e0b", "#10b981", "#f43f5e"];

function TeamContent() {
  const [activeTab, setActiveTab] = useState("all");
  const [query, setQuery] = useState("");

  const filtered = team.filter(m => {
    const matchTab = activeTab === "all" || m.role.toLowerCase().includes(activeTab.replace("s", ""));
    const matchQ = m.name.toLowerCase().includes(query.toLowerCase());
    return matchTab && matchQ;
  });

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div className="flex-between" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Team</h1>
          <p className="text-muted text-sm">{team.length} members · {team.filter(m => m.status === "online").length} online</p>
        </div>
        <button className="btn btn-primary">
          <UserPlus size={16} /> Add Member
        </button>
      </div>

      {/* Filters + Search */}
      <div className="flex-between" style={{ marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {["all", "marketing", "editors", "admins"].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={activeTab === tab ? "btn btn-primary" : "btn btn-secondary"}
              style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem', textTransform: 'capitalize' }}
            >
              {tab}
            </button>
          ))}
        </div>
        <div style={{ position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--secondary-foreground)' }} />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="input"
            placeholder="Search members..."
            style={{ paddingLeft: '2.25rem', width: '220px' }}
          />
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
                  }}>
                    {member.initials}
                  </div>
                  <div className={`status-dot status-${member.status}`} style={{ position: 'absolute', bottom: '-2px', right: '-2px', border: '2px solid var(--glass-bg)', width: '12px', height: '12px' }} />
                </div>
                <div>
                  <p className="font-semibold text-sm">{member.name}</p>
                  <span className="badge" style={{ ...roleColors[member.role], fontSize: '0.7rem', padding: '0.15rem 0.55rem' }}>
                    {member.role}
                  </span>
                </div>
              </div>
              <button className="btn btn-ghost" style={{ padding: '0.3rem', color: 'var(--secondary-foreground)' }}>
                <MoreVertical size={16} />
              </button>
            </div>

            <p className="text-xs text-muted" style={{ marginBottom: '0.875rem' }}>{member.email}</p>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-secondary text-xs" style={{ flex: 1, padding: '0.4rem', gap: '0.3rem' }}>
                <Mail size={13} /> Email
              </button>
              <button className="btn btn-secondary text-xs" style={{ flex: 1, padding: '0.4rem', gap: '0.3rem' }}>
                <Phone size={13} /> Call
              </button>
            </div>
          </div>
        ))}
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
