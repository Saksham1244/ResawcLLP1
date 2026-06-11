"use client";

import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import {
  UploadCloud, CheckCircle, Phone, FileText, Shuffle, X,
  ChevronDown, ChevronUp, MessageSquare, Clock, Eye
} from "lucide-react";
import { useRole } from "@/context/RoleContext";
import { RoleGuard } from "@/components/RoleGuard";

const MARKETING_TEAM: string[] = []; // Populated from real team members in DB

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

const OUTCOME_META: Record<string, { color: string; label: string; icon: string }> = {
  PICKED_UP: { color: "#10b981", label: "Picked Up", icon: "✅" },
  NO_ANSWER: { color: "#f59e0b", label: "No Answer", icon: "📵" },
  LEFT_VOICEMAIL: { color: "#6366f1", label: "Left Voicemail", icon: "📬" },
  WRONG_NUMBER: { color: "#f43f5e", label: "Wrong Number", icon: "❌" },
};

const STATUS_META: Record<LeadStatus, { color: string; bg: string; label: string }> = {
  NEW: { color: "#a1a1c7", bg: "rgba(161,161,199,0.1)", label: "New" },
  CONTACTED: { color: "#6366f1", bg: "rgba(99,102,241,0.12)", label: "Contacted" },
  INTERESTED: { color: "#10b981", bg: "rgba(16,185,129,0.12)", label: "Interested" },
  NOT_INTERESTED: { color: "#f43f5e", bg: "rgba(244,63,94,0.12)", label: "Not Interested" },
  CONVERTED: { color: "#f59e0b", bg: "rgba(245,158,11,0.12)", label: "Converted ⭐" },
};

const DEMO_LEADS: Lead[] = [
  {
    _id: 1, _assignee: "Sarah Connor", _status: "INTERESTED",
    Name: "John Doe", Company: "TechCorp India", Phone: "9876543210", Email: "john@techcorp.in",
    _interactions: [
      { id: 1, outcome: "PICKED_UP", loggedBy: "Sarah Connor", date: "10 Jun 2026", time: "11:30 AM", notes: "John was very interested in our social media video editing package. He said they need 8-10 reels per month and also a product demo video. Budget seems good. He asked us to send a detailed proposal. Follow up on 12th June." },
      { id: 2, outcome: "PICKED_UP", loggedBy: "Sarah Connor", date: "11 Jun 2026", time: "03:00 PM", notes: "Sent the proposal. He reviewed it and had questions about turnaround time. Confirmed we can deliver within 48 hours. He said he will discuss with his partner and revert by tomorrow." },
    ],
  },
  {
    _id: 2, _assignee: "Priya Sharma", _status: "CONTACTED",
    Name: "Jane Smith", Company: "DesignCo", Phone: "9123456789", Email: "jane@designco.com",
    _interactions: [
      { id: 1, outcome: "NO_ANSWER", loggedBy: "Priya Sharma", date: "10 Jun 2026", time: "10:00 AM", notes: "Called twice, no response. Left a brief message." },
      { id: 2, outcome: "LEFT_VOICEMAIL", loggedBy: "Priya Sharma", date: "10 Jun 2026", time: "04:00 PM", notes: "Left voicemail mentioning our offer — 3 free sample edits for new clients. Asked her to call back." },
    ],
  },
  {
    _id: 3, _assignee: "Raj Mehta", _status: "NEW",
    Name: "Arvind Kumar", Company: "Startup Labs", Phone: "9988776655", Email: "arvind@startuplabs.io",
    _interactions: [],
  },
];

function LeadsContent() {
  const { user } = useRole();
  const isAdmin = user.role === "admin";
  const isMarketing = user.role === "marketing";

  const [activeLeads, setActiveLeads] = useState<Lead[]>(DEMO_LEADS);
  const [distributed, setDistributed] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [logTarget, setLogTarget] = useState<Lead | null>(null);
  const [callOutcome, setCallOutcome] = useState<Interaction["outcome"]>("PICKED_UP");
  const [callNotes, setCallNotes] = useState("");
  const [callStatus, setCallStatus] = useState<LeadStatus>("CONTACTED");
  const [previewLeads, setPreviewLeads] = useState<any[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

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

  const handleDistribute = () => {
    const newLeads: Lead[] = previewLeads.map((row, i) => ({
      ...row,
      _id: Date.now() + i,
      _assignee: MARKETING_TEAM[i % MARKETING_TEAM.length],
      _interactions: [],
      _status: "NEW" as LeadStatus,
    }));
    setActiveLeads(prev => [...newLeads, ...prev]);
    setPreviewLeads([]);
    setDistributed(true);
  };

  const handleLogCall = (e: React.FormEvent) => {
    e.preventDefault();
    if (!logTarget) return;
    const newInt: Interaction = {
      id: Date.now(),
      outcome: callOutcome,
      notes: callNotes,
      date: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      loggedBy: user.name,
    };
    setActiveLeads(prev => prev.map(l =>
      l._id === logTarget._id
        ? { ...l, _interactions: [...l._interactions, newInt], _status: callStatus }
        : l
    ));
    setLogTarget(null);
    setCallNotes("");
    setCallOutcome("PICKED_UP");
    setCallStatus("CONTACTED");
  };

  // Marketing only sees their own leads
  const visibleLeads = isMarketing
    ? activeLeads.filter(l => l._assignee === user.name)
    : activeLeads;

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div className="flex-between" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            {isMarketing ? "My Leads" : "Leads Management"}
          </h1>
          <p className="text-muted text-sm">
            {isMarketing
              ? `${visibleLeads.length} leads assigned to you · ${visibleLeads.filter(l => l._interactions.length > 0).length} contacted`
              : `${activeLeads.length} total leads · ${activeLeads.filter(l => l._interactions.length > 0).length} contacted`}
          </p>
        </div>
      </div>

      {/* Upload + Preview — Admin only */}
      {isAdmin && (
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1.5rem', marginBottom: '2.5rem' }}>
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2 className="font-bold" style={{ fontSize: '1rem' }}>Upload Excel Leads</h2>
                <p className="text-xs text-muted" style={{ marginTop: '0.2rem' }}>Supports .xlsx and .csv</p>
              </div>
              <a href="/sample_leads.csv" download className="text-xs" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--primary)', fontWeight: 600, textDecoration: 'none', background: 'var(--primary-glow)', padding: '0.3rem 0.6rem', borderRadius: 'var(--radius-sm)' }}>
                <FileText size={12} /> Sample File
              </a>
            </div>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) parseFile(f); }}
              onClick={() => fileRef.current?.click()}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                border: `2px dashed ${dragging ? 'var(--primary)' : 'var(--surface-border)'}`,
                borderRadius: 'var(--radius-md)', padding: '2rem 1rem', cursor: 'pointer',
                background: dragging ? 'var(--primary-glow)' : 'transparent',
                transition: 'all var(--transition-fast)', minHeight: '130px',
              }}>
              <UploadCloud size={34} style={{ color: 'var(--primary-2)', marginBottom: '0.6rem' }} />
              <p className="text-sm font-semibold">Click or drag & drop</p>
              <p className="text-xs text-muted" style={{ marginTop: '0.2rem' }}>.xlsx, .xls, .csv</p>
            </div>
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: 'none' }}
              onChange={e => { const f = e.target.files?.[0]; if (f) parseFile(f); }} />
            {previewLeads.length > 0 && (
              <button className="btn btn-primary" onClick={handleDistribute}>
                <Shuffle size={15} /> Distribute {previewLeads.length} Leads Randomly
              </button>
            )}
            {distributed && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981', fontWeight: 600, fontSize: '0.875rem' }}>
                <CheckCircle size={16} /> Leads distributed!
              </div>
            )}
          </div>

          <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--surface-border)' }}>
              <h2 className="font-bold" style={{ fontSize: '1rem' }}>
                Data Preview {previewLeads.length > 0 && <span className="text-muted" style={{ fontWeight: 400, fontSize: '0.8rem' }}>({previewLeads.length} rows)</span>}
              </h2>
            </div>
            <div style={{ overflowX: 'auto', maxHeight: '280px', overflowY: 'auto' }}>
              {previewLeads.length > 0 ? (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                  <thead style={{ position: 'sticky', top: 0, background: 'var(--background)', zIndex: 5 }}>
                    <tr>
                      {Object.keys(previewLeads[0]).map(col => (
                        <th key={col} style={{ padding: '0.7rem 1rem', textAlign: 'left', fontWeight: 600, color: 'var(--secondary-foreground)', borderBottom: '1px solid var(--surface-border)', whiteSpace: 'nowrap' }}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewLeads.map((row, i) => (
                      <tr key={i} className="table-row">
                        {Object.values(row).map((v: any, j) => (
                          <td key={j} style={{ padding: '0.6rem 1rem', whiteSpace: 'nowrap' }}>{String(v)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--secondary-foreground)' }}>
                  <UploadCloud size={28} style={{ margin: '0 auto 0.75rem', opacity: 0.3 }} />
                  <p className="text-sm">Upload a file to see a preview here.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Section label */}
      <div style={{ marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
          {isMarketing ? "📞 My Assigned Leads" : "📋 All Leads & Call History"}
        </h2>
        <p className="text-xs text-muted" style={{ marginTop: '0.2rem' }}>
          {isMarketing ? "Click any lead to see the full conversation history." : "Click any lead card to expand the full call log."}
        </p>
      </div>

      {/* Lead Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {visibleLeads.map((lead) => {
          const nameKey = Object.keys(lead).find(k => k.toLowerCase() === 'name' && !k.startsWith('_')) ?? Object.keys(lead).filter(k => !k.startsWith('_'))[0];
          const phoneKey = Object.keys(lead).find(k => k.toLowerCase().includes('phone') && !k.startsWith('_'));
          const emailKey = Object.keys(lead).find(k => k.toLowerCase().includes('email') && !k.startsWith('_'));
          const companyKey = Object.keys(lead).find(k => k.toLowerCase().includes('company') && !k.startsWith('_'));
          const isExpanded = expandedId === lead._id;
          const sm = STATUS_META[lead._status] ?? STATUS_META.NEW;

          return (
            <div key={lead._id} className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
              {/* Lead Row — clickable to expand */}
              <div
                onClick={() => setExpandedId(isExpanded ? null : lead._id)}
                style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.1rem 1.25rem', cursor: 'pointer' }}
              >
                <div style={{
                  width: '42px', height: '42px', borderRadius: '12px', flexShrink: 0,
                  background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, color: '#fff', fontSize: '0.9rem',
                }}>
                  {String(lead[nameKey] ?? '?')[0].toUpperCase()}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                    <span className="font-bold text-sm">{String(lead[nameKey] ?? 'Unknown')}</span>
                    {companyKey && <span className="text-xs text-muted">@ {String(lead[companyKey])}</span>}
                    <span style={{ background: sm.bg, color: sm.color, padding: '0.1rem 0.6rem', borderRadius: 'var(--radius-full)', fontSize: '0.7rem', fontWeight: 700, border: `1px solid ${sm.color}50` }}>
                      {sm.label}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '0.25rem' }}>
                    {phoneKey && <span className="text-xs text-muted" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Phone size={11} />{String(lead[phoneKey])}</span>}
                    {emailKey && <span className="text-xs text-muted">{String(lead[emailKey])}</span>}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                  {isAdmin && (
                    <span style={{ background: 'var(--primary-glow)', color: 'var(--primary-2)', padding: '0.2rem 0.65rem', borderRadius: 'var(--radius-full)', fontSize: '0.7rem', fontWeight: 600 }}>
                      {lead._assignee}
                    </span>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--secondary-foreground)', fontSize: '0.75rem' }}>
                    <MessageSquare size={13} /> {lead._interactions.length}
                  </div>
                  {isExpanded ? <ChevronUp size={16} color="var(--secondary-foreground)" /> : <ChevronDown size={16} color="var(--secondary-foreground)" />}
                </div>
              </div>

              {/* Expanded — Full Interaction History */}
              {isExpanded && (
                <div style={{ borderTop: '1px solid var(--surface-border)', padding: '1.25rem' }}>
                  <div className="flex-between" style={{ marginBottom: '1rem' }}>
                    <h4 className="font-semibold text-sm">Call & Interaction History</h4>
                    {/* Marketing can log calls for their own leads; Admin can log for any */}
                    {(isAdmin || (isMarketing && lead._assignee === user.name)) && (
                      <button className="btn btn-primary" style={{ padding: '0.35rem 0.85rem', fontSize: '0.78rem', gap: '0.4rem' }}
                        onClick={(e) => { e.stopPropagation(); setLogTarget(lead); }}>
                        <FileText size={13} /> Log New Call
                      </button>
                    )}
                  </div>

                  {lead._interactions.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--secondary-foreground)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--surface-border)' }}>
                      <Phone size={22} style={{ margin: '0 auto 0.5rem', opacity: 0.3 }} />
                      <p className="text-sm">No calls logged yet.</p>
                      <p className="text-xs text-muted" style={{ marginTop: '0.25rem' }}>Click "Log New Call" to record the first interaction.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {lead._interactions.map((interaction) => {
                        const meta = OUTCOME_META[interaction.outcome] ?? { color: "#888", label: interaction.outcome, icon: "📞" };
                        return (
                          <div key={interaction.id} style={{
                            background: 'var(--secondary)', borderRadius: 'var(--radius-md)',
                            padding: '1rem 1.1rem', borderLeft: `3px solid ${meta.color}`,
                          }}>
                            {/* Header */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.625rem', flexWrap: 'wrap' }}>
                              <span style={{ fontWeight: 700, fontSize: '0.8rem', color: meta.color }}>
                                {meta.icon} {meta.label}
                              </span>
                              <span style={{ height: '1px', flex: 1, background: 'var(--surface-border)' }} />
                              <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.7rem', color: 'var(--secondary-foreground)' }}>
                                <Clock size={11} /> {interaction.date} at {interaction.time}
                              </span>
                              <span style={{ fontSize: '0.7rem', color: 'var(--secondary-foreground)', background: 'var(--surface-border)', padding: '0.1rem 0.5rem', borderRadius: 'var(--radius-full)' }}>
                                by {interaction.loggedBy}
                              </span>
                            </div>
                            {/* Full notes — never truncated */}
                            <p style={{ fontSize: '0.875rem', lineHeight: 1.7, color: 'var(--foreground)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                              {interaction.notes}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Log Call Modal */}
      {logTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
          onClick={() => setLogTarget(null)}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '480px', padding: '1.75rem' }} onClick={e => e.stopPropagation()}>
            <div className="flex-between" style={{ marginBottom: '1.25rem' }}>
              <div>
                <h2 className="font-bold">Log Call Interaction</h2>
                <p className="text-xs text-muted" style={{ marginTop: '0.2rem' }}>
                  Lead: {String(logTarget[Object.keys(logTarget).find(k => k.toLowerCase() === 'name' && !k.startsWith('_')) ?? ''] ?? 'Unknown')}
                </p>
              </div>
              <button className="btn btn-ghost" style={{ padding: '0.3rem' }} onClick={() => setLogTarget(null)}><X size={18} /></button>
            </div>

            <form onSubmit={handleLogCall} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label className="text-sm font-semibold">Call Outcome</label>
                  <select className="input" value={callOutcome} onChange={e => setCallOutcome(e.target.value as any)}
                    style={{ background: 'var(--overlay-bg)', color: 'var(--foreground)' }}>
                    <option value="PICKED_UP">✅ Picked Up</option>
                    <option value="NO_ANSWER">📵 No Answer</option>
                    <option value="LEFT_VOICEMAIL">📬 Left Voicemail</option>
                    <option value="WRONG_NUMBER">❌ Wrong Number</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label className="text-sm font-semibold">Update Status</label>
                  <select className="input" value={callStatus} onChange={e => setCallStatus(e.target.value as any)}
                    style={{ background: 'var(--overlay-bg)', color: 'var(--foreground)' }}>
                    <option value="CONTACTED">Contacted</option>
                    <option value="INTERESTED">Interested</option>
                    <option value="NOT_INTERESTED">Not Interested</option>
                    <option value="CONVERTED">Converted ⭐</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label className="text-sm font-semibold">What happened? What did they say?</label>
                <textarea className="input" rows={5} required value={callNotes} onChange={e => setCallNotes(e.target.value)}
                  placeholder="Describe what was discussed in detail — interest level, questions they asked, follow-up needed…"
                  style={{ resize: 'vertical', lineHeight: 1.65, fontSize: '0.875rem' }} />
                <p className="text-xs text-muted">Be detailed — this log is visible to Admin and the rest of the marketing team.</p>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setLogTarget(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save Call Log</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LeadsManagement() {
  return (
    <RoleGuard allowedRoles={["admin", "marketing"]} redirectTo="/dashboard/tasks">
      <LeadsContent />
    </RoleGuard>
  );
}
