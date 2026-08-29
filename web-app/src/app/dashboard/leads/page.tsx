"use client";

import { useState, useRef, useEffect } from "react";
import * as XLSX from "xlsx";
import {
  UploadCloud, CheckCircle2, Phone, FileText, Shuffle, X,
  ChevronDown, ChevronUp, MessageSquare, Clock, Eye, Filter,
  Search, Plus, Sparkles, User, Calendar, Check, Send, Award
} from "lucide-react";
import { useRole } from "@/context/RoleContext";
import { RoleGuard } from "@/components/RoleGuard";

const AVATAR_COLORS = ["#6366F1", "#F43F5E", "#10B981", "#F59E0B", "#8B5CF6", "#06B6D4"];

type Interaction = {
  id: number;
  outcome: "PICKED_UP" | "NO_ANSWER" | "LEFT_VOICEMAIL" | "WRONG_NUMBER";
  notes: string;
  date: string;
  time: string;
  loggedBy: string;
};

type LeadStatus = "NEW" | "CONTACTED" | "INTERESTED" | "NOT_INTERESTED" | "CONVERTED";

type Lead = {
  _id: number;
  _assignee: string;
  _interactions: Interaction[];
  _status: LeadStatus;
  [key: string]: any;
};

const OUTCOME_META: Record<string, { color: string; label: string; icon: any }> = {
  PICKED_UP: { color: "#10B981", label: "Picked Up", icon: Phone },
  NO_ANSWER: { color: "#F59E0B", label: "No Answer", icon: Phone },
  LEFT_VOICEMAIL: { color: "#6366F1", label: "Left Voicemail", icon: MessageSquare },
  WRONG_NUMBER: { color: "#F43F5E", label: "Wrong Number", icon: X },
};

const STATUS_META: Record<LeadStatus, { color: string; bg: string; label: string }> = {
  NEW: { color: "#94A3B8", bg: "rgba(148, 163, 184, 0.12)", label: "New Lead" },
  CONTACTED: { color: "#6366F1", bg: "rgba(99, 102, 241, 0.15)", label: "Contacted" },
  INTERESTED: { color: "#8B5CF6", bg: "rgba(139, 92, 246, 0.15)", label: "Interested" },
  NOT_INTERESTED: { color: "#F43F5E", bg: "rgba(244, 63, 94, 0.15)", label: "Not Interested" },
  CONVERTED: { color: "#10B981", bg: "rgba(16, 185, 129, 0.15)", label: "Converted ⭐" },
};

function LeadsContent() {
  const { user } = useRole();
  if (!user) return null;
  const isAdmin = user.role === "admin";

  const [activeLeads, setActiveLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [marketingTeam, setMarketingTeam] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [logTarget, setLogTarget] = useState<Lead | null>(null);
  const [callOutcome, setCallOutcome] = useState<Interaction["outcome"]>("PICKED_UP");
  const [callNotes, setCallNotes] = useState("");
  const [callStatus, setCallStatus] = useState<LeadStatus>("CONTACTED");
  const [previewLeads, setPreviewLeads] = useState<any[]>([]);
  const [distributed, setDistributed] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchLeads = () => {
    setLoading(true);
    fetch(`/api/leads?userId=${user.id}&role=${user.role}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setActiveLeads(data.data);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchLeads();
  }, [user.id, user.role]);

  useEffect(() => {
    fetch('/api/users')
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          const mktTeam = data.data.filter((u: any) => u.role === 'MARKETING' || u.role === 'marketing');
          setMarketingTeam(mktTeam);
        }
      })
      .catch(() => {});
  }, []);

  const parseFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target?.result, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { defval: "" }) as any[];
        setPreviewLeads(rows);
        setDistributed(false);
      } catch {
        alert("Could not read file. Please ensure it is a valid .xlsx or .csv.");
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleDistribute = async () => {
    if (marketingTeam.length === 0) {
      alert('No marketing team members found. Please add team members first.');
      return;
    }
    
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leads: previewLeads,
          teamIds: marketingTeam.map(t => t.id)
        })
      });
      const data = await res.json();
      if (data.success) {
        setPreviewLeads([]);
        setDistributed(true);
        setShowUploadModal(false);
        fetchLeads();
      } else {
        alert(data.error || 'Failed to distribute leads');
      }
    } catch {
      alert('Network error');
    }
  };

  const handleSaveInteraction = async () => {
    if (!logTarget) return;
    try {
      const res = await fetch('/api/leads/interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: logTarget._id,
          userId: user.id,
          type: 'CALL',
          status: callOutcome,
          notes: callNotes,
          newLeadStatus: callStatus
        })
      });
      const data = await res.json();
      if (data.success) {
        setLogTarget(null);
        setCallNotes("");
        fetchLeads();
      } else {
        alert(data.error || 'Failed to log call');
      }
    } catch {
      alert('Network error');
    }
  };

  // Funnel Counts
  const counts = {
    all: activeLeads.length,
    new: activeLeads.filter(l => l._status === 'NEW').length,
    contacted: activeLeads.filter(l => l._status === 'CONTACTED').length,
    interested: activeLeads.filter(l => l._status === 'INTERESTED').length,
    converted: activeLeads.filter(l => l._status === 'CONVERTED').length,
  };

  const filteredLeads = activeLeads.filter(l => {
    const matchesFilter = filterStatus === 'ALL' || l._status === filterStatus;
    const matchesSearch = !searchQuery || 
      (l.Name && l.Name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (l.Phone && String(l.Phone).includes(searchQuery)) ||
      (l.Company && l.Company.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="animate-fadeIn" style={{ maxWidth: '1360px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Top Header */}
      <div className="flex-between" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 0.25rem 0' }}>
            {isAdmin ? "Enterprise Leads & CRM Pipeline" : "My Assigned Leads"}
          </h1>
          <p className="text-muted text-sm" style={{ margin: 0 }}>
            {isAdmin ? "Round-robin distribution, conversion tracking, and interaction analytics." : "Your personal pipeline queue and call outcome logger."}
          </p>
        </div>

        {isAdmin && (
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={() => setShowUploadModal(true)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: 'var(--radius-md)', padding: '0.7rem 1.25rem' }}>
              <UploadCloud size={17} /> Bulk Ingest Leads
            </button>
          </div>
        )}
      </div>

      {/* Teamgate-Style Pipeline Funnel Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        {[
          { key: 'ALL', label: 'TOTAL PIPELINE', count: counts.all, color: '#6366F1' },
          { key: 'NEW', label: 'NEW LEADS', count: counts.new, color: '#94A3B8' },
          { key: 'CONTACTED', label: 'IN PROGRESS', count: counts.contacted, color: '#6366F1' },
          { key: 'INTERESTED', label: 'INTERESTED', count: counts.interested, color: '#8B5CF6' },
          { key: 'CONVERTED', label: 'WON / CONVERTED', count: counts.converted, color: '#10B981' },
        ].map((f) => (
          <div 
            key={f.key}
            onClick={() => setFilterStatus(f.key)}
            className="stat-card-radiant"
            style={{
              padding: '1.15rem 1.25rem',
              cursor: 'pointer',
              border: filterStatus === f.key ? `1.5px solid ${f.color}` : '1px solid var(--surface-border)',
              background: filterStatus === f.key ? 'var(--surface-solid)' : 'var(--glass-bg)'
            }}
          >
            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--muted)', letterSpacing: '0.08em' }}>{f.label}</span>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem' }}>
              <span style={{ fontSize: '1.8rem', fontWeight: 800, color: f.color, fontFamily: 'var(--font-display)', lineHeight: 1 }}>{f.count}</span>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: f.color, boxShadow: `0 0 8px ${f.color}` }} />
            </div>
          </div>
        ))}
      </div>

      {/* Search & Filter Bar */}
      <div className="glass-card" style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ position: 'relative', width: '320px', maxWidth: '100%' }}>
          <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
          <input 
            type="text" 
            placeholder="Search by name, company or phone..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input"
            style={{ paddingLeft: '2.5rem', background: 'var(--surface-solid)' }}
          />
        </div>

        <div className="pill-tabs-container">
          {['ALL', 'NEW', 'CONTACTED', 'INTERESTED', 'CONVERTED'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`pill-tab ${filterStatus === st ? 'active' : ''}`}
            >
              {st === 'ALL' ? 'All Leads' : STATUS_META[st as LeadStatus]?.label || st}
            </button>
          ))}
        </div>
      </div>

      {/* Leads Table */}
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3.5rem', color: 'var(--muted)' }}>
            <p style={{ fontSize: '0.95rem' }}>Loading pipeline data...</p>
          </div>
        ) : filteredLeads.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 1.5rem', color: 'var(--secondary-foreground)' }}>
            <p style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>🎯</p>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 0.25rem 0' }}>No Leads Found</h3>
            <p className="text-muted text-sm" style={{ margin: 0 }}>There are no leads matching your active filters.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: 'var(--surface-solid)', borderBottom: '1px solid var(--surface-border)', color: 'var(--muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  <th style={{ padding: '1rem 1.25rem' }}>Lead Name & Company</th>
                  <th style={{ padding: '1rem 1.25rem' }}>Contact</th>
                  <th style={{ padding: '1rem 1.25rem' }}>Stage Status</th>
                  <th style={{ padding: '1rem 1.25rem' }}>Assignee</th>
                  <th style={{ padding: '1rem 1.25rem' }}>History</th>
                  <th style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((lead, idx) => {
                  const statusInfo = STATUS_META[lead._status] || STATUS_META.NEW;
                  const assigneeColor = AVATAR_COLORS[idx % AVATAR_COLORS.length];

                  return (
                    <tr key={lead._id || idx} style={{ borderBottom: '1px solid var(--surface-border)', transition: 'background 0.2s' }}>
                      <td style={{ padding: '1.1rem 1.25rem' }}>
                        <p style={{ fontWeight: 700, fontSize: '0.95rem', margin: 0, color: 'var(--foreground)' }}>
                          {lead.Name || 'Unnamed Prospect'}
                        </p>
                        <p className="text-muted" style={{ fontSize: '0.78rem', margin: '0.15rem 0 0 0' }}>
                          {lead.Company || 'Direct Client'}
                        </p>
                      </td>

                      <td style={{ padding: '1.1rem 1.25rem' }}>
                        <a href={`tel:${lead.Phone}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary-2)', fontWeight: 600, textDecoration: 'none' }}>
                          <Phone size={14} /> {lead.Phone || '--'}
                        </a>
                      </td>

                      <td style={{ padding: '1.1rem 1.25rem' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                          padding: '0.35rem 0.75rem', borderRadius: '999px',
                          background: statusInfo.bg, color: statusInfo.color,
                          fontSize: '0.78rem', fontWeight: 700,
                          border: `1px solid ${statusInfo.color}30`
                        }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: statusInfo.color }} />
                          {statusInfo.label}
                        </span>
                      </td>

                      <td style={{ padding: '1.1rem 1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: assigneeColor, color: '#fff', fontSize: '0.7rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {(lead._assignee || 'U')[0]}
                          </div>
                          <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{lead._assignee || 'Unassigned'}</span>
                        </div>
                      </td>

                      <td style={{ padding: '1.1rem 1.25rem' }}>
                        <span className="text-muted" style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <Clock size={13} /> {lead._interactions?.length || 0} calls
                        </span>
                      </td>

                      <td style={{ padding: '1.1rem 1.25rem', textAlign: 'right' }}>
                        <button
                          onClick={() => {
                            setLogTarget(lead);
                            setCallStatus(lead._status);
                          }}
                          className="btn btn-secondary"
                          style={{
                            padding: '0.45rem 0.85rem',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            borderRadius: 'var(--radius-sm)',
                            borderColor: 'var(--primary-glow)'
                          }}
                        >
                          <Phone size={13} color="var(--primary)" /> Log Call
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Log Interaction Modal */}
      {logTarget && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(16px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
          <div className="glass-card animate-fadeIn" style={{ maxWidth: '520px', width: '100%', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="flex-between">
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>Log Call / Interaction</h3>
                <p className="text-muted text-xs" style={{ margin: '0.2rem 0 0 0' }}>Prospect: {logTarget.Name} ({logTarget.Phone})</p>
              </div>
              <button onClick={() => setLogTarget(null)} className="btn btn-ghost" style={{ padding: '0.4rem' }}>
                <X size={20} />
              </button>
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'block' }}>
                Call Outcome
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                {Object.entries(OUTCOME_META).map(([k, v]) => (
                  <button
                    key={k}
                    onClick={() => setCallOutcome(k as any)}
                    style={{
                      padding: '0.75rem',
                      borderRadius: 'var(--radius-md)',
                      border: callOutcome === k ? `1.5px solid ${v.color}` : '1px solid var(--surface-border)',
                      background: callOutcome === k ? 'var(--surface-solid)' : 'transparent',
                      color: callOutcome === k ? v.color : 'var(--secondary-foreground)',
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      cursor: 'pointer'
                    }}
                  >
                    <v.icon size={15} /> {v.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'block' }}>
                Update Pipeline Stage
              </label>
              <select 
                value={callStatus} 
                onChange={(e) => setCallStatus(e.target.value as any)}
                className="input"
                style={{ background: 'var(--surface-solid)', fontWeight: 600 }}
              >
                <option value="NEW">New Lead</option>
                <option value="CONTACTED">Contacted (In Progress)</option>
                <option value="INTERESTED">Interested (High Potential)</option>
                <option value="NOT_INTERESTED">Not Interested (Closed)</option>
                <option value="CONVERTED">Converted ⭐ (Won)</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'block' }}>
                Call Notes & Summary
              </label>
              <textarea
                rows={3}
                placeholder="What did the prospect say? Any scheduled follow-up?"
                value={callNotes}
                onChange={(e) => setCallNotes(e.target.value)}
                className="input"
                style={{ background: 'var(--surface-solid)', resize: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button onClick={() => setLogTarget(null)} className="btn btn-secondary" style={{ flex: 1, padding: '0.85rem' }}>
                Cancel
              </button>
              <button onClick={handleSaveInteraction} className="btn btn-primary" style={{ flex: 1, padding: '0.85rem' }}>
                Save & Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Upload Modal */}
      {showUploadModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(16px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
          <div className="glass-card animate-fadeIn" style={{ maxWidth: '560px', width: '100%', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="flex-between">
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>Bulk Import & Distribute Leads</h3>
                <p className="text-muted text-xs" style={{ margin: '0.2rem 0 0 0' }}>Upload a .csv or .xlsx spreadsheet with Name, Phone, and Company.</p>
              </div>
              <button onClick={() => setShowUploadModal(false)} className="btn btn-ghost" style={{ padding: '0.4rem' }}>
                <X size={20} />
              </button>
            </div>

            <div 
              onClick={() => fileRef.current?.click()}
              style={{
                border: '2px dashed var(--primary-glow)',
                borderRadius: 'var(--radius-lg)',
                padding: '2.5rem 1.5rem',
                textAlign: 'center',
                cursor: 'pointer',
                background: 'rgba(99, 102, 241, 0.04)'
              }}
            >
              <UploadCloud size={36} color="var(--primary)" style={{ margin: '0 auto 0.75rem' }} />
              <p style={{ fontWeight: 700, margin: '0 0 0.25rem 0' }}>Click to select spreadsheet</p>
              <p className="text-muted text-xs" style={{ margin: 0 }}>Supports .xlsx and .csv files</p>
              <input ref={fileRef} type="file" accept=".xlsx,.csv" style={{ display: 'none' }} onChange={(e) => e.target.files?.[0] && parseFile(e.target.files[0])} />
            </div>

            {previewLeads.length > 0 && (
              <div style={{ background: 'var(--surface-solid)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                <p style={{ fontWeight: 700, fontSize: '0.85rem', color: '#10B981', margin: '0 0 0.25rem 0' }}>
                  ✓ {previewLeads.length} leads parsed ready for round-robin allocation.
                </p>
                <p className="text-muted text-xs" style={{ margin: 0 }}>
                  Will be distributed evenly across {marketingTeam.length} active marketing members.
                </p>
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => setShowUploadModal(false)} className="btn btn-secondary" style={{ flex: 1, padding: '0.85rem' }}>
                Cancel
              </button>
              <button 
                onClick={handleDistribute} 
                disabled={previewLeads.length === 0}
                className="btn btn-primary" 
                style={{ flex: 1, padding: '0.85rem', opacity: previewLeads.length === 0 ? 0.5 : 1 }}
              >
                Distribute Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LeadsPage() {
  return (
    <RoleGuard allowedRoles={["admin", "marketing"]}>
      <LeadsContent />
    </RoleGuard>
  );
}
