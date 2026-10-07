"use client";

import { useState, useRef, useEffect } from "react";
import * as XLSX from "xlsx";
import {
  UploadCloud, Phone, MessageSquare, X, Search, Shuffle,
  ChevronDown, Clock, MoreVertical, Eye, ExternalLink, Plus, Trash2, AlertTriangle, Building2,
  Sparkles, CheckCircle2, Video, Image as ImageIcon,
} from "lucide-react";
import { useRole } from "@/context/RoleContext";
import { RoleGuard } from "@/components/RoleGuard";

/* ─── Design tokens ──────────────────────────────────────────── */
const C = {
  canvas:    "#F5F7FB",
  white:     "#FFFFFF",
  primary:   "#1A56DB",
  primaryHover: "#1648C0",
  border:    "#E5E7EB",
  textPrimary: "#111827",
  textMuted: "#6B7280",
  rowHover:  "#F9FAFB",
} as const;

const AVATAR_COLORS = ["#6366F1","#F43F5E","#10B981","#F59E0B","#8B5CF6","#06B6D4","#EC4899","#14B8A6"];

/* ─── Types ──────────────────────────────────────────────────── */
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
  _id: string | number;
  _assignee: string;
  _interactions: Interaction[];
  _status: LeadStatus;
  [key: string]: any;
};

/* ─── Metadata maps ──────────────────────────────────────────── */
const OUTCOME_META: Record<string, { color: string; label: string; icon: any }> = {
  PICKED_UP:     { color: "#10B981", label: "Picked Up",      icon: Phone },
  NO_ANSWER:     { color: "#F59E0B", label: "No Answer",      icon: Phone },
  LEFT_VOICEMAIL:{ color: "#6366F1", label: "Left Voicemail", icon: MessageSquare },
  WRONG_NUMBER:  { color: "#EF4444", label: "Wrong Number",   icon: X },
};

const STATUS_META: Record<LeadStatus, { color: string; bg: string; label: string }> = {
  NEW:           { color: "#6B7280", bg: "#F3F4F6",         label: "New"         },
  CONTACTED:     { color: "#1A56DB", bg: "#EFF6FF",         label: "Contacted"   },
  INTERESTED:    { color: "#7C3AED", bg: "#F5F3FF",         label: "Interested"  },
  NOT_INTERESTED:{ color: "#EF4444", bg: "#FEF2F2",         label: "Not Interested" },
  CONVERTED:     { color: "#059669", bg: "#ECFDF5",         label: "Confirmed"   },
};

const TAB_KEYS = [
  { key: "ALL",       label: "All Leads"  },
  { key: "NEW",       label: "New"        },
  { key: "CONTACTED", label: "Contacted"  },
  { key: "INTERESTED",label: "Interested" },
  { key: "CONVERTED", label: "Converted"  },
] as const;

/* ─── Helpers ────────────────────────────────────────────────── */
function initials(name: string) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
}

function Avatar({ name, colorIndex }: { name: string; colorIndex: number }) {
  const bg = AVATAR_COLORS[colorIndex % AVATAR_COLORS.length];
  return (
    <div style={{
      width: 36, height: 36, borderRadius: "50%",
      background: bg, color: "#fff",
      fontSize: "0.7rem", fontWeight: 700,
      display: "flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0, letterSpacing: "0.03em",
    }}>
      {initials(name)}
    </div>
  );
}

function StatusBadge({ status }: { status: LeadStatus }) {
  const m = STATUS_META[status] || STATUS_META.NEW;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "2px 10px", borderRadius: 999,
      background: m.bg, color: m.color,
      fontSize: "0.72rem", fontWeight: 600,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: m.color, flexShrink: 0 }} />
      {m.label}
    </span>
  );
}

/* ─── Row action dropdown ────────────────────────────────────── */
function ActionMenu({
  lead,
  isAdmin,
  openUpward,
  onLogCall,
  onConvertToClient,
  onDelete,
}: {
  lead: Lead;
  isAdmin?: boolean;
  openUpward?: boolean;
  onLogCall: (l: Lead) => void;
  onConvertToClient?: (l: Lead) => void;
  onDelete?: (l: Lead) => void;
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
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={() => setOpen(p => !p)}
        style={{
          background: "none", border: "1px solid " + C.border,
          borderRadius: 6, padding: "5px 8px", cursor: "pointer",
          display: "flex", alignItems: "center", color: C.textMuted,
        }}
      >
        <MoreVertical size={16} />
      </button>

      {open && (
        <div style={{
          position: "absolute",
          right: 0,
          ...(openUpward ? { bottom: "calc(100% + 4px)" } : { top: "calc(100% + 4px)" }),
          zIndex: 9999,
          background: C.white,
          border: "1px solid " + C.border,
          borderRadius: 8,
          boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
          minWidth: 180,
          overflow: "hidden",
        }}>
          {[
            { label: "Log Call",          icon: Phone,     action: () => { onLogCall(lead); setOpen(false); } },
            { label: "Convert to Client", icon: Building2, action: () => { onConvertToClient?.(lead); setOpen(false); } },
            { label: "View Details",      icon: Eye,       action: () => setOpen(false) },
          ].map(item => (
            <button
              key={item.label}
              onClick={item.action}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                width: "100%", padding: "10px 16px",
                background: "none", border: "none",
                fontSize: "0.875rem", color: C.textPrimary,
                cursor: "pointer", textAlign: "left",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = C.rowHover)}
              onMouseLeave={e => (e.currentTarget.style.background = "none")}
            >
              <item.icon size={14} color={C.textMuted} />
              {item.label}
            </button>
          ))}
          {isAdmin && onDelete && (
            <button
              onClick={() => { onDelete(lead); setOpen(false); }}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                width: "100%", padding: "10px 16px",
                background: "none", border: "none",
                borderTop: "1px solid " + C.border,
                fontSize: "0.875rem", color: "#EF4444",
                cursor: "pointer", textAlign: "left",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "#FEF2F2")}
              onMouseLeave={e => (e.currentTarget.style.background = "none")}
            >
              <Trash2 size={14} color="#EF4444" />
              Delete Lead
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function CustomCheckbox({
  checked,
  onChange,
  indeterminate = false,
  title,
}: {
  checked: boolean;
  onChange: () => void;
  indeterminate?: boolean;
  title?: string;
}) {
  return (
    <span
      role="checkbox"
      aria-checked={checked}
      tabIndex={0}
      title={title}
      onClick={(e) => {
        e.stopPropagation();
        onChange();
      }}
      onKeyDown={(e) => {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          onChange();
        }
      }}
      style={{
        width: 17,
        height: 17,
        borderRadius: 4,
        border: checked || indeterminate ? "1.5px solid #1A56DB" : "1.5px solid #94A3B8",
        backgroundColor: checked || indeterminate ? "#1A56DB" : "#FFFFFF",
        background: checked || indeterminate ? "#1A56DB" : "#FFFFFF",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        padding: 0,
        outline: "none",
        boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
        transition: "all 0.15s ease",
        verticalAlign: "middle",
        flexShrink: 0,
        colorScheme: "light",
        forcedColorAdjust: "none" as any,
        userSelect: "none",
      }}
    >
      {checked && (
        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
          <path d="M1 4L3.5 6.5L9 1" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
      {!checked && indeterminate && (
        <span style={{ width: 8, height: 2, background: "#FFFFFF", borderRadius: 1 }} />
      )}
    </span>
  );
}

/* ─── Main Content ───────────────────────────────────────────── */
function LeadsContent() {
  const { user } = useRole();
  if (!user) return null;
  const isAdmin = user.role === "admin";

  /* state */
  const [activeLeads, setActiveLeads] = useState<Lead[]>([]);
  const [loading, setLoading]         = useState(true);
  const [marketingTeam, setMarketingTeam] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery]   = useState("");
  const [showFilters, setShowFilters]   = useState(false);

  /* log-call modal */
  const [logTarget, setLogTarget]       = useState<Lead | null>(null);
  const [callOutcome, setCallOutcome]   = useState<Interaction["outcome"]>("PICKED_UP");
  const [callNotes, setCallNotes]       = useState("");
  const [callStatus, setCallStatus]     = useState<LeadStatus>("CONTACTED");
  const [saving, setSaving]             = useState(false);

  /* upload modal */
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [previewLeads, setPreviewLeads]       = useState<any[]>([]);
  const [distributed, setDistributed]         = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  /* hover state for rows */
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);

  /* selection & deletion state */
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDeleting, setIsDeleting]   = useState(false);
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<{
    type: 'single' | 'bulk';
    lead?: Lead;
    count?: number;
  } | null>(null);

  /* add lead modal */
  const [showAddLeadModal, setShowAddLeadModal] = useState(false);
  const [newLeadName, setNewLeadName]           = useState("");
  const [newLeadCompany, setNewLeadCompany]     = useState("");
  const [newLeadPhone, setNewLeadPhone]         = useState("");
  const [newLeadEmail, setNewLeadEmail]         = useState("");
  const [newLeadStatus, setNewLeadStatus]       = useState<LeadStatus>("NEW");
  const [newLeadAssignee, setNewLeadAssignee]   = useState("");
  const [newLeadNotes, setNewLeadNotes]         = useState("");
  const [creatingLead, setCreatingLead]         = useState(false);

  /* production team for job editor assignment */
  const [productionTeam, setProductionTeam] = useState<any[]>([]);

  /* convert modal state */
  const [convertTarget, setConvertTarget] = useState<Lead | null>(null);
  const [convertOrderType, setConvertOrderType] = useState<"SAMPLE" | "ORDER" | "NONE">("SAMPLE");
  const [convertCategory, setConvertCategory] = useState<"PHOTO" | "VIDEO">("PHOTO");
  const [convertForm, setConvertForm] = useState({
    companyName: "",
    contactPerson: "",
    phone: "",
    email: "",
    serviceType: "Trial Photo Edit (Culling & Color)",
    totalImages: 25,
    assignedEditorId: "",
    deadlineDate: new Date(Date.now() + 2 * 86400000).toISOString().split("T")[0],
    notes: "",
  });
  const [converting, setConverting] = useState(false);
  const [convertSuccessMsg, setConvertSuccessMsg] = useState("");

  /* ── data fetching ── */
  const fetchLeads = () => {
    setLoading(true);
    fetch(`/api/leads?userId=${user.id}&role=${user.role}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) setActiveLeads(data.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchLeads(); }, [user.id, user.role]);

  useEffect(() => {
    fetch("/api/users")
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setMarketingTeam(data.data.filter((u: any) =>
            u.role === "MARKETING" || u.role === "marketing"
          ));
          setProductionTeam(data.data.filter((u: any) =>
            u.role.toLowerCase().includes("photo") ||
            u.role.toLowerCase().includes("video") ||
            u.role.toLowerCase().includes("editor")
          ));
        }
      })
      .catch(() => {});
  }, []);

  /* ── XLSX parse ── */
  const parseFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = e => {
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

  /* ── distribute ── */
  const handleDistribute = async () => {
    if (marketingTeam.length === 0) {
      alert("No marketing team members found. Please add team members first.");
      return;
    }
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leads: previewLeads, teamIds: marketingTeam.map(t => t.id) }),
      });
      const data = await res.json();
      if (data.success) {
        setPreviewLeads([]);
        setDistributed(true);
        setShowUploadModal(false);
        fetchLeads();
      } else {
        alert(data.error || "Failed to distribute leads");
      }
    } catch { alert("Network error"); }
  };

  /* ── save interaction ── */
  const handleSaveInteraction = async () => {
    if (!logTarget) return;
    setSaving(true);
    try {
      const res = await fetch("/api/leads/interactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: logTarget._id,
          userId: user.id,
          type: "CALL",
          status: callOutcome,
          notes: callNotes,
          newLeadStatus: callStatus,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setLogTarget(null);
        setCallNotes("");
        fetchLeads();
      } else {
        alert(data.error || "Failed to log call");
      }
    } catch { alert("Network error"); }
    finally { setSaving(false); }
  };

  /* ── add single lead ── */
  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeadName.trim()) {
      alert("Please enter a lead name");
      return;
    }

    setCreatingLead(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newLeadName.trim(),
          company: newLeadCompany.trim(),
          phone: newLeadPhone.trim(),
          email: newLeadEmail.trim(),
          status: newLeadStatus,
          assignedToId: newLeadAssignee || null,
          notes: newLeadNotes.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setShowAddLeadModal(false);
        setNewLeadName("");
        setNewLeadCompany("");
        setNewLeadPhone("");
        setNewLeadEmail("");
        setNewLeadStatus("NEW");
        setNewLeadAssignee("");
        setNewLeadNotes("");
        fetchLeads();
      } else {
        alert(data.error || "Failed to create lead");
      }
    } catch {
      alert("Network error creating lead");
    } finally {
      setCreatingLead(false);
    }
  };

  /* ── derived counts / filtered ── */
  const counts = {
    ALL:       activeLeads.length,
    NEW:       activeLeads.filter(l => l._status === "NEW").length,
    CONTACTED: activeLeads.filter(l => l._status === "CONTACTED").length,
    INTERESTED:activeLeads.filter(l => l._status === "INTERESTED").length,
    CONVERTED: activeLeads.filter(l => l._status === "CONVERTED").length,
  } as Record<string, number>;

  const filteredLeads = activeLeads.filter(l => {
    const matchesFilter = filterStatus === "ALL" || l._status === filterStatus;
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q
      || (l.Name    && l.Name.toLowerCase().includes(q))
      || (l.Phone   && String(l.Phone).includes(q))
      || (l.Company && l.Company.toLowerCase().includes(q));
    return matchesFilter && matchesSearch;
  });

  /* ── pagination (simple, no routing) ── */
  const PAGE_SIZE = 15;
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(filteredLeads.length / PAGE_SIZE);
  const pagedLeads = filteredLeads.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const startIdx   = (page - 1) * PAGE_SIZE + 1;
  const endIdx     = Math.min(page * PAGE_SIZE, filteredLeads.length);

  /* reset page when filter/search changes */
  useEffect(() => setPage(1), [filterStatus, searchQuery]);

  /* ── selection logic ── */
  const currentPageIds = pagedLeads.map(l => String(l._id));
  const isAllCurrentPageSelected =
    currentPageIds.length > 0 && currentPageIds.every(id => selectedIds.includes(id));
  const isSomeCurrentPageSelected =
    currentPageIds.some(id => selectedIds.includes(id));

  const handleToggleSelectAll = () => {
    if (isAllCurrentPageSelected) {
      setSelectedIds(prev => prev.filter(id => !currentPageIds.includes(id)));
    } else {
      const combined = new Set([...selectedIds, ...currentPageIds]);
      setSelectedIds(Array.from(combined));
    }
  };

  const handleToggleSelectRow = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  /* ── delete lead(s) handler ── */
  const executeDelete = async () => {
    if (!deleteConfirmTarget) return;
    setIsDeleting(true);
    try {
      let body: any = {};
      let query = `?role=${user.role}`;

      if (deleteConfirmTarget.type === "single" && deleteConfirmTarget.lead) {
        query += `&id=${deleteConfirmTarget.lead._id}`;
        body = { id: String(deleteConfirmTarget.lead._id) };
      } else if (deleteConfirmTarget.type === "bulk") {
        body = { ids: selectedIds };
      }

      const res = await fetch(`/api/leads${query}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (data.success) {
        if (deleteConfirmTarget.type === "single" && deleteConfirmTarget.lead) {
          setSelectedIds(prev => prev.filter(id => id !== String(deleteConfirmTarget.lead!._id)));
        } else {
          setSelectedIds([]);
        }
        setDeleteConfirmTarget(null);
        fetchLeads();
      } else {
        alert(data.error || "Failed to delete lead(s)");
      }
    } catch {
      alert("Network error while deleting leads");
    } finally {
      setIsDeleting(false);
    }
  };

  /* ── convert lead modal opener ───────────────────────────── */
  const openConvertModal = (lead: Lead, mode: "SAMPLE" | "ORDER" | "NONE" = "SAMPLE") => {
    const comp = lead.Company || lead.Name;
    setConvertTarget(lead);
    setConvertOrderType(mode);
    setConvertCategory("PHOTO");
    setConvertForm({
      companyName: comp,
      contactPerson: lead.Name,
      phone: lead.Phone || "",
      email: lead.Email || "",
      serviceType: mode === "SAMPLE" ? "Trial Photo Edit (Culling & Color)" : "Wedding Photo Batch Editing",
      totalImages: mode === "SAMPLE" ? 25 : 500,
      assignedEditorId: "",
      deadlineDate: new Date(Date.now() + (mode === "SAMPLE" ? 2 : 4) * 86400000).toISOString().split("T")[0],
      notes: mode === "SAMPLE" ? "Client requested a trial editing sample." : "Direct production order.",
    });
    setConvertSuccessMsg("");
  };

  const handleConvertToClient = (lead: Lead) => {
    openConvertModal(lead, "SAMPLE");
  };

  const submitConvert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!convertTarget) return;

    setConverting(true);
    try {
      const res = await fetch("/api/leads/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: String(convertTarget._id || convertTarget.id),
          userId: user?.id,
          companyName: convertForm.companyName,
          contactPerson: convertForm.contactPerson,
          phone: convertForm.phone,
          email: convertForm.email,
          orderType: convertOrderType,
          createSampleJob: convertOrderType !== "NONE",
          sampleJobCategory: convertCategory,
          sampleJobService: convertForm.serviceType,
          sampleJobImages: convertForm.totalImages,
          sampleJobEditorId: convertForm.assignedEditorId || null,
          sampleJobDeadline: convertForm.deadlineDate,
          notes: convertForm.notes,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setConvertSuccessMsg(data.message || `Client registered and order placed!`);
        fetchLeads();
        setTimeout(() => {
          setConvertTarget(null);
          setConvertSuccessMsg("");
        }, 1800);
      } else {
        alert(data.error || "Failed to convert lead");
      }
    } catch {
      alert("Network error converting lead");
    } finally {
      setConverting(false);
    }
  };

  /* ════════════════════════════════════════════════════════════ */
  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", color: C.textPrimary }}>

      {/* ── Page Header ── */}
      <div style={{
        background: C.white,
        borderBottom: "1px solid " + C.border,
        padding: "20px 28px",
        display: "flex", alignItems: "center",
        justifyContent: "space-between", gap: 16,
        flexWrap: "wrap",
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "1.375rem", fontWeight: 700, color: C.textPrimary, lineHeight: 1.3 }}>
            Leads &amp; Pipeline
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: "0.875rem", color: C.textMuted }}>
            {isAdmin
              ? "Manage, import, and distribute leads across your marketing team."
              : "Your assigned leads and call interaction history."}
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {isAdmin && (
            <button
              onClick={() => setShowUploadModal(true)}
              style={{
                display: "inline-flex", alignItems: "center", gap: 7,
                padding: "9px 18px", borderRadius: 6,
                border: "1px solid " + C.border,
                background: C.white, color: C.textPrimary,
                fontSize: "0.875rem", fontWeight: 500, cursor: "pointer",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = C.rowHover)}
              onMouseLeave={e => (e.currentTarget.style.background = C.white)}
            >
              <UploadCloud size={15} />
              Bulk Import
            </button>
          )}

          {isAdmin && (
            <button
              onClick={() => setShowAddLeadModal(true)}
              style={{
                display: "inline-flex", alignItems: "center", gap: 7,
                padding: "9px 18px", borderRadius: 6,
                border: "none",
                background: C.primary, color: "#fff",
                fontSize: "0.875rem", fontWeight: 500, cursor: "pointer",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = C.primaryHover)}
              onMouseLeave={e => (e.currentTarget.style.background = C.primary)}
            >
              <Plus size={15} />
              Add Lead
            </button>
          )}
        </div>
      </div>

      <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 20 }}>

        {/* ── Tab Row ── */}
        <div style={{
          display: "flex", gap: 0, borderBottom: "1px solid " + C.border,
          background: C.white, borderRadius: "8px 8px 0 0",
          paddingLeft: 4,
        }}>
          {TAB_KEYS.map(tab => {
            const active = filterStatus === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setFilterStatus(tab.key)}
                style={{
                  padding: "13px 18px",
                  background: "none", border: "none",
                  borderBottom: active ? "2px solid " + C.primary : "2px solid transparent",
                  color: active ? C.primary : C.textMuted,
                  fontSize: "0.875rem", fontWeight: active ? 600 : 400,
                  cursor: "pointer", display: "flex", alignItems: "center", gap: 7,
                  marginBottom: -1,
                  whiteSpace: "nowrap",
                  transition: "color 0.15s",
                }}
              >
                {tab.label}
                <span style={{
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  minWidth: 20, height: 20, padding: "0 6px",
                  borderRadius: 999,
                  background: active ? C.primary : C.border,
                  color: active ? "#fff" : C.textMuted,
                  fontSize: "0.7rem", fontWeight: 700,
                }}>
                  {counts[tab.key] ?? 0}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Filter Bar ── */}
        <div style={{
          display: "flex", alignItems: "center",
          justifyContent: "space-between", gap: 12, flexWrap: "wrap",
        }}>
          {/* Search */}
          <div style={{ position: "relative", flexGrow: 1, maxWidth: 360 }}>
            <Search size={15} style={{
              position: "absolute", left: 12, top: "50%",
              transform: "translateY(-50%)", color: C.textMuted,
              pointerEvents: "none",
            }} />
            <input
              type="text"
              placeholder="Search by name, company or phone…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: "100%", padding: "9px 12px 9px 36px",
                border: "1px solid " + C.border, borderRadius: 6,
                fontSize: "0.875rem", color: C.textPrimary,
                background: C.white, outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => setShowFilters(p => !p)}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "9px 14px", borderRadius: 6,
                border: "1px solid " + C.border, background: C.white,
                color: C.textMuted, fontSize: "0.875rem", cursor: "pointer",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/></svg>
              Filters
            </button>
            <button
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "9px 14px", borderRadius: 6,
                border: "1px solid " + C.border, background: C.white,
                color: C.textMuted, fontSize: "0.875rem", cursor: "pointer",
              }}
            >
              <ChevronDown size={14} />
              Sorting
            </button>
          </div>
        </div>

        {/* ── Selection Action Bar ── */}
        {selectedIds.length > 0 && (
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "12px 20px", borderRadius: 8,
            background: "#EFF6FF", border: "1px solid #BFDBFE",
            boxShadow: "0 2px 4px rgba(26, 86, 219, 0.06)",
            gap: 12, flexWrap: "wrap",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <span style={{ fontSize: "0.875rem", fontWeight: 600, color: C.primary, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{
                  width: 8, height: 8, borderRadius: "50%", background: C.primary, display: "inline-block"
                }} />
                {selectedIds.length} lead{selectedIds.length > 1 ? "s" : ""} selected
              </span>
              {filteredLeads.length > pagedLeads.length && selectedIds.length !== filteredLeads.length && (
                <button
                  onClick={() => setSelectedIds(filteredLeads.map(l => String(l._id)))}
                  style={{
                    background: "none", border: "none", padding: 0,
                    fontSize: "0.82rem", color: C.primary, textDecoration: "underline",
                    cursor: "pointer", fontWeight: 500,
                  }}
                >
                  Select all {filteredLeads.length} leads across all pages
                </button>
              )}
              <button
                onClick={() => setSelectedIds([])}
                style={{
                  background: "#DBEAFE", border: "none", padding: "4px 10px",
                  fontSize: "0.8rem", color: "#1E40AF", cursor: "pointer",
                  borderRadius: 6, fontWeight: 500,
                }}
                onMouseEnter={e => e.currentTarget.style.background = "#BFDBFE"}
                onMouseLeave={e => e.currentTarget.style.background = "#DBEAFE"}
              >
                Deselect all
              </button>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {isAdmin && (
                <button
                  onClick={() => setDeleteConfirmTarget({ type: "bulk", count: selectedIds.length })}
                  disabled={isDeleting}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 7,
                    padding: "8px 16px", borderRadius: 6,
                    background: "#EF4444", color: "#fff",
                    border: "none", fontSize: "0.875rem", fontWeight: 600,
                    cursor: isDeleting ? "wait" : "pointer",
                    boxShadow: "0 2px 4px rgba(239, 68, 68, 0.25)",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "#DC2626"}
                  onMouseLeave={e => e.currentTarget.style.background = "#EF4444"}
                >
                  <Trash2 size={15} />
                  Delete Selected ({selectedIds.length})
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── Table Card ── */}
        <div style={{
          background: C.white, border: "1px solid " + C.border,
          borderRadius: 8, overflow: "hidden",
        }}>
          {loading ? (
            <div style={{ padding: "60px 24px", textAlign: "center", color: C.textMuted }}>
              <div style={{ marginBottom: 12, fontSize: "1.5rem" }}>⏳</div>
              <p style={{ margin: 0, fontSize: "0.9rem" }}>Loading leads…</p>
            </div>
          ) : filteredLeads.length === 0 ? (
            <div style={{ padding: "60px 24px", textAlign: "center", color: C.textMuted }}>
              <div style={{ fontSize: "2rem", marginBottom: 10 }}>🎯</div>
              <h3 style={{ margin: "0 0 6px", fontSize: "1rem", fontWeight: 600, color: C.textPrimary }}>
                No Leads Found
              </h3>
              <p style={{ margin: 0, fontSize: "0.875rem" }}>
                No leads match your current filter or search.
              </p>
            </div>
          ) : (
            <>
              <div style={{ overflowX: "auto", minHeight: 340 }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid " + C.border }}>
                      {[
                        { label: "", w: 40 },
                        { label: "Name",         w: "auto" },
                        { label: "Job Title",    w: 160 },
                        { label: "Account",      w: 180 },
                        { label: "Assignee",     w: 160 },
                        { label: "Interactions", w: 120 },
                        { label: "Actions",      w: 80, align: "right" as const },
                      ].map((col, i) => (
                        <th
                          key={i}
                          style={{
                            padding: "11px 16px",
                            textAlign: col.align || "left",
                            fontSize: "0.75rem", fontWeight: 600,
                            color: C.textMuted, textTransform: "uppercase",
                            letterSpacing: "0.05em", background: C.rowHover,
                            whiteSpace: "nowrap",
                            ...(col.w !== "auto" ? { width: col.w } : {}),
                          }}
                        >
                          {col.label === "" ? (
                            <CustomCheckbox
                              checked={isAllCurrentPageSelected}
                              indeterminate={isSomeCurrentPageSelected && !isAllCurrentPageSelected}
                              onChange={handleToggleSelectAll}
                              title={isAllCurrentPageSelected ? "Deselect all on this page" : "Select all on this page"}
                            />
                          ) : col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pagedLeads.map((lead, idx) => {
                      const globalIdx = (page - 1) * PAGE_SIZE + idx;
                      const isHovered = hoveredRow === globalIdx;
                      const isSelected = selectedIds.includes(String(lead._id));
                      const lastInteraction = lead._interactions?.[lead._interactions.length - 1];

                      return (
                        <tr
                          key={lead._id || idx}
                          onMouseEnter={() => setHoveredRow(globalIdx)}
                          onMouseLeave={() => setHoveredRow(null)}
                          style={{
                            borderBottom: "1px solid " + C.border,
                            background: isSelected ? "#EFF6FF" : (isHovered ? C.rowHover : C.white),
                            borderLeft: isSelected ? "3px solid " + C.primary : "3px solid transparent",
                            transition: "background 0.12s",
                          }}
                        >
                          {/* Checkbox */}
                          <td style={{ padding: "14px 16px", width: 40, textAlign: "center" }}>
                            <CustomCheckbox
                              checked={isSelected}
                              onChange={() => handleToggleSelectRow(String(lead._id))}
                            />
                          </td>

                          {/* Name + LinkedIn + Status badge */}
                          <td style={{ padding: "14px 16px", minWidth: 220 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                              <Avatar name={lead.Name || "?"} colorIndex={globalIdx} />
                              <div>
                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                  <span style={{ fontWeight: 600, color: C.textPrimary }}>
                                    {lead.Name || "Unnamed Prospect"}
                                  </span>
                                  {lead.LinkedIn && (
                                    <a
                                      href={lead.LinkedIn}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      style={{ color: "#0A66C2", display: "inline-flex" }}
                                      title="LinkedIn profile"
                                    >
                                      <ExternalLink size={13} />
                                    </a>
                                  )}
                                </div>
                                <div style={{ marginTop: 4 }}>
                                  <StatusBadge status={lead._status} />
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Job Title */}
                          <td style={{ padding: "14px 16px", color: C.textMuted, whiteSpace: "nowrap" }}>
                            {lead.JobTitle || lead["Job Title"] || "—"}
                          </td>

                          {/* Account = Company + Industry */}
                          <td style={{ padding: "14px 16px" }}>
                            <div style={{ fontWeight: 500, color: C.textPrimary }}>
                              {lead.Company || "—"}
                            </div>
                            {lead.Industry && (
                              <div style={{ fontSize: "0.75rem", color: C.textMuted, marginTop: 2 }}>
                                {lead.Industry}
                              </div>
                            )}
                          </td>

                          {/* Assignee */}
                          <td style={{ padding: "14px 16px" }}>
                            {lead._assignee ? (
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <div style={{
                                  width: 28, height: 28, borderRadius: "50%",
                                  background: AVATAR_COLORS[globalIdx % AVATAR_COLORS.length],
                                  color: "#fff", fontSize: "0.68rem", fontWeight: 700,
                                  display: "flex", alignItems: "center", justifyContent: "center",
                                }}>
                                  {initials(lead._assignee)}
                                </div>
                                <span style={{ fontSize: "0.85rem", color: C.textPrimary }}>
                                  {lead._assignee}
                                </span>
                              </div>
                            ) : (
                              <span style={{ fontSize: "0.82rem", color: C.textMuted }}>Unassigned</span>
                            )}
                          </td>

                          {/* Interactions */}
                          <td style={{ padding: "14px 16px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 5, color: C.textMuted, fontSize: "0.82rem" }}>
                              <Clock size={13} />
                              <span>{lead._interactions?.length || 0} call{lead._interactions?.length !== 1 ? "s" : ""}</span>
                            </div>
                            {lastInteraction && (
                              <div style={{ fontSize: "0.72rem", color: C.textMuted, marginTop: 3 }}>
                                Last: {OUTCOME_META[lastInteraction.outcome]?.label || lastInteraction.outcome}
                              </div>
                            )}
                          </td>

                          {/* Actions ⋮ */}
                          <td style={{ padding: "14px 16px", textAlign: "right" }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 6 }}>
                              {lead._status !== "CONVERTED" ? (
                                <>
                                  <button
                                    onClick={() => openConvertModal(lead, "SAMPLE")}
                                    title="Create Sample / Trial Job"
                                    style={{
                                      display: "inline-flex", alignItems: "center", gap: 4,
                                      padding: "5px 10px", borderRadius: 6,
                                      background: "#F5F3FF", border: "1px solid #DDD6FE",
                                      color: "#7C3AED", fontSize: "0.75rem", fontWeight: 700,
                                      cursor: "pointer", whiteSpace: "nowrap",
                                    }}
                                    onMouseEnter={e => (e.currentTarget.style.background = "#EDE9FE")}
                                    onMouseLeave={e => (e.currentTarget.style.background = "#F5F3FF")}
                                  >
                                    <Sparkles size={13} />
                                    Need Sample
                                  </button>

                                  <button
                                    onClick={() => openConvertModal(lead, "ORDER")}
                                    title="Direct Production Order"
                                    style={{
                                      display: "inline-flex", alignItems: "center", gap: 4,
                                      padding: "5px 10px", borderRadius: 6,
                                      background: "#ECFDF5", border: "1px solid #A7F3D0",
                                      color: "#059669", fontSize: "0.75rem", fontWeight: 700,
                                      cursor: "pointer", whiteSpace: "nowrap",
                                    }}
                                    onMouseEnter={e => (e.currentTarget.style.background = "#D1FAE5")}
                                    onMouseLeave={e => (e.currentTarget.style.background = "#ECFDF5")}
                                  >
                                    <Building2 size={13} />
                                    Direct Order
                                  </button>
                                </>
                              ) : (
                                <span style={{
                                  display: "inline-flex", alignItems: "center", gap: 4,
                                  padding: "3px 8px", borderRadius: 6,
                                  background: "#ECFDF5", color: "#059669",
                                  fontSize: "0.75rem", fontWeight: 600, border: "1px solid #A7F3D0"
                                }}>
                                  <CheckCircle2 size={12} /> Client Added
                                </span>
                              )}
                              <ActionMenu
                                lead={lead}
                                isAdmin={isAdmin}
                                openUpward={pagedLeads.length > 5 && idx >= pagedLeads.length - 2}
                                onLogCall={l => { setLogTarget(l); setCallStatus(l._status); }}
                                onConvertToClient={l => openConvertModal(l, "SAMPLE")}
                                onDelete={l => setDeleteConfirmTarget({ type: "single", lead: l })}
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination footer */}
              <div style={{
                padding: "12px 20px",
                borderTop: "1px solid " + C.border,
                display: "flex", alignItems: "center",
                justifyContent: "space-between",
                background: C.rowHover,
              }}>
                <span style={{ fontSize: "0.8rem", color: C.textMuted }}>
                  Showing {filteredLeads.length === 0 ? 0 : startIdx}–{endIdx} of {filteredLeads.length} leads
                </span>
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    style={{
                      padding: "5px 12px", borderRadius: 6,
                      border: "1px solid " + C.border, background: C.white,
                      color: page === 1 ? C.textMuted : C.textPrimary,
                      fontSize: "0.8rem", cursor: page === 1 ? "default" : "pointer",
                      opacity: page === 1 ? 0.5 : 1,
                    }}
                  >
                    ← Prev
                  </button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      style={{
                        width: 32, height: 32, borderRadius: 6,
                        border: "1px solid " + (page === p ? C.primary : C.border),
                        background: page === p ? C.primary : C.white,
                        color: page === p ? "#fff" : C.textPrimary,
                        fontSize: "0.8rem", cursor: "pointer", fontWeight: page === p ? 600 : 400,
                      }}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    disabled={page === totalPages || totalPages === 0}
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    style={{
                      padding: "5px 12px", borderRadius: 6,
                      border: "1px solid " + C.border, background: C.white,
                      color: (page === totalPages || totalPages === 0) ? C.textMuted : C.textPrimary,
                      fontSize: "0.8rem",
                      cursor: (page === totalPages || totalPages === 0) ? "default" : "pointer",
                      opacity: (page === totalPages || totalPages === 0) ? 0.5 : 1,
                    }}
                  >
                    Next →
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          LOG CALL MODAL
      ══════════════════════════════════════════════════════════ */}
      {logTarget && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 200,
          background: "rgba(17,24,39,0.55)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: 20,
        }}>
          <div style={{
            background: C.white, borderRadius: 12, width: "100%", maxWidth: 520,
            boxShadow: "0 24px 60px rgba(0,0,0,0.18)",
            display: "flex", flexDirection: "column",
          }}>
            {/* Modal Header */}
            <div style={{
              padding: "20px 24px 16px",
              borderBottom: "1px solid " + C.border,
              display: "flex", justifyContent: "space-between", alignItems: "flex-start",
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700 }}>Log Call / Interaction</h3>
                <p style={{ margin: "4px 0 0", fontSize: "0.82rem", color: C.textMuted }}>
                  {logTarget.Name} {logTarget.Phone ? `· ${logTarget.Phone}` : ""}
                </p>
              </div>
              <button
                onClick={() => setLogTarget(null)}
                style={{ background: "none", border: "none", cursor: "pointer", color: C.textMuted, padding: 4 }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 20 }}>
              {/* Outcome chips */}
              <div>
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: C.textMuted, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Call Outcome
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {Object.entries(OUTCOME_META).map(([k, v]) => {
                    const sel = callOutcome === k;
                    return (
                      <button
                        key={k}
                        onClick={() => setCallOutcome(k as any)}
                        style={{
                          display: "flex", alignItems: "center", gap: 8,
                          padding: "10px 14px", borderRadius: 8,
                          border: sel ? `2px solid ${v.color}` : "1px solid " + C.border,
                          background: sel ? v.color + "12" : C.white,
                          color: sel ? v.color : C.textPrimary,
                          fontWeight: sel ? 600 : 400,
                          fontSize: "0.85rem", cursor: "pointer",
                          transition: "all 0.15s",
                        }}
                      >
                        <v.icon size={14} />
                        {v.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Stage dropdown */}
              <div>
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: C.textMuted, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Update Pipeline Stage
                </label>
                <select
                  value={callStatus}
                  onChange={e => setCallStatus(e.target.value as LeadStatus)}
                  style={{
                    width: "100%", padding: "9px 12px",
                    border: "1px solid " + C.border, borderRadius: 6,
                    fontSize: "0.875rem", color: C.textPrimary,
                    background: C.white, outline: "none", cursor: "pointer",
                  }}
                >
                  <option value="NEW">New Lead</option>
                  <option value="CONTACTED">Contacted (In Progress)</option>
                  <option value="INTERESTED">Interested (High Potential)</option>
                  <option value="NOT_INTERESTED">Not Interested (Closed)</option>
                  <option value="CONVERTED">Converted ⭐ (Won)</option>
                </select>
              </div>

              {/* Notes */}
              <div>
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: C.textMuted, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Notes &amp; Summary
                </label>
                <textarea
                  rows={3}
                  placeholder="What did the prospect say? Any scheduled follow-up?"
                  value={callNotes}
                  onChange={e => setCallNotes(e.target.value)}
                  style={{
                    width: "100%", padding: "9px 12px",
                    border: "1px solid " + C.border, borderRadius: 6,
                    fontSize: "0.875rem", color: C.textPrimary,
                    background: C.white, resize: "none", outline: "none",
                    boxSizing: "border-box", fontFamily: "inherit",
                  }}
                />
              </div>
            </div>

            {/* Footer */}
            <div style={{
              padding: "16px 24px",
              borderTop: "1px solid " + C.border,
              display: "flex", gap: 10,
            }}>
              <button
                onClick={() => setLogTarget(null)}
                style={{
                  flex: 1, padding: "10px 0", borderRadius: 6,
                  border: "1px solid " + C.border, background: C.white,
                  color: C.textPrimary, fontSize: "0.875rem", cursor: "pointer", fontWeight: 500,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveInteraction}
                disabled={saving}
                style={{
                  flex: 2, padding: "10px 0", borderRadius: 6,
                  border: "none", background: C.primary,
                  color: "#fff", fontSize: "0.875rem", cursor: saving ? "wait" : "pointer",
                  fontWeight: 600, opacity: saving ? 0.7 : 1,
                }}
              >
                {saving ? "Saving…" : "Save & Update Stage"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          BULK UPLOAD MODAL
      ══════════════════════════════════════════════════════════ */}
      {showUploadModal && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 200,
          background: "rgba(17,24,39,0.55)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: 20,
        }}>
          <div style={{
            background: C.white, borderRadius: 12, width: "100%", maxWidth: 560,
            boxShadow: "0 24px 60px rgba(0,0,0,0.18)",
          }}>
            {/* Header */}
            <div style={{
              padding: "20px 24px 16px",
              borderBottom: "1px solid " + C.border,
              display: "flex", justifyContent: "space-between", alignItems: "flex-start",
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700 }}>
                  Bulk Import &amp; Distribute Leads
                </h3>
                <p style={{ margin: "4px 0 0", fontSize: "0.82rem", color: C.textMuted }}>
                  Upload a .csv or .xlsx with columns: Name, Phone, Company, Industry, Job Title
                </p>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: C.textMuted, padding: 4 }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Drop zone */}
              <div
                onClick={() => fileRef.current?.click()}
                style={{
                  border: "2px dashed " + C.border,
                  borderRadius: 8, padding: "36px 24px",
                  textAlign: "center", cursor: "pointer",
                  background: C.canvas, transition: "border-color 0.15s",
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = C.primary)}
                onMouseLeave={e => (e.currentTarget.style.borderColor = C.border)}
              >
                <UploadCloud size={36} color={C.primary} style={{ margin: "0 auto 12px", display: "block" }} />
                <p style={{ margin: "0 0 6px", fontWeight: 600, color: C.textPrimary }}>
                  Click to select spreadsheet
                </p>
                <p style={{ margin: 0, fontSize: "0.8rem", color: C.textMuted }}>
                  Supports .xlsx and .csv files
                </p>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".xlsx,.csv"
                  style={{ display: "none" }}
                  onChange={e => e.target.files?.[0] && parseFile(e.target.files[0])}
                />
              </div>

              {/* Preview info */}
              {previewLeads.length > 0 && (
                <div style={{
                  padding: "14px 16px", borderRadius: 8,
                  background: "#ECFDF5", border: "1px solid #A7F3D0",
                  display: "flex", alignItems: "flex-start", gap: 10,
                }}>
                  <div style={{ color: "#059669", marginTop: 1 }}>✓</div>
                  <div>
                    <p style={{ margin: "0 0 2px", fontWeight: 600, fontSize: "0.875rem", color: "#065F46" }}>
                      {previewLeads.length} leads parsed and ready for distribution
                    </p>
                    <p style={{ margin: 0, fontSize: "0.78rem", color: "#047857" }}>
                      Will be distributed evenly across {marketingTeam.length || "—"} marketing team member{marketingTeam.length !== 1 ? "s" : ""} (round-robin).
                    </p>
                  </div>
                </div>
              )}

              {/* Marketing team info */}
              {marketingTeam.length > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ display: "flex", marginRight: 4 }}>
                    {marketingTeam.slice(0, 4).map((m, i) => (
                      <div
                        key={m.id}
                        title={m.name}
                        style={{
                          width: 26, height: 26, borderRadius: "50%",
                          background: AVATAR_COLORS[i % AVATAR_COLORS.length],
                          color: "#fff", fontSize: "0.65rem", fontWeight: 700,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          marginLeft: i > 0 ? -6 : 0,
                          border: "2px solid " + C.white,
                        }}
                      >
                        {initials(m.name || m.email || "?")}
                      </div>
                    ))}
                    {marketingTeam.length > 4 && (
                      <div style={{
                        width: 26, height: 26, borderRadius: "50%",
                        background: C.border, color: C.textMuted,
                        fontSize: "0.65rem", fontWeight: 700,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        marginLeft: -6, border: "2px solid " + C.white,
                      }}>
                        +{marketingTeam.length - 4}
                      </div>
                    )}
                  </div>
                  <span style={{ fontSize: "0.8rem", color: C.textMuted }}>
                    {marketingTeam.length} assignable marketing member{marketingTeam.length !== 1 ? "s" : ""}
                  </span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{
              padding: "16px 24px",
              borderTop: "1px solid " + C.border,
              display: "flex", gap: 10,
            }}>
              <button
                onClick={() => { setShowUploadModal(false); setPreviewLeads([]); }}
                style={{
                  flex: 1, padding: "10px 0", borderRadius: 6,
                  border: "1px solid " + C.border, background: C.white,
                  color: C.textPrimary, fontSize: "0.875rem", cursor: "pointer", fontWeight: 500,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDistribute}
                disabled={previewLeads.length === 0}
                style={{
                  flex: 2, padding: "10px 0", borderRadius: 6,
                  border: "none",
                  background: previewLeads.length === 0 ? C.border : C.primary,
                  color: previewLeads.length === 0 ? C.textMuted : "#fff",
                  fontSize: "0.875rem",
                  cursor: previewLeads.length === 0 ? "not-allowed" : "pointer",
                  fontWeight: 600,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}
              >
                <Shuffle size={15} />
                Distribute Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          ADD SINGLE LEAD MODAL
      ══════════════════════════════════════════════════════════ */}
      {showAddLeadModal && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 200,
          background: "rgba(17,24,39,0.55)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: 20,
        }}>
          <div style={{
            background: C.white, borderRadius: 12, width: "100%", maxWidth: 520,
            boxShadow: "0 24px 60px rgba(0,0,0,0.18)",
            overflow: "hidden",
          }}>
            {/* Header */}
            <div style={{
              padding: "18px 24px",
              borderBottom: "1px solid " + C.border,
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: C.textPrimary }}>
                  Add New Lead
                </h3>
                <p style={{ margin: "3px 0 0", fontSize: "0.8rem", color: C.textMuted }}>
                  Enter lead contact details to add them to your CRM pipeline.
                </p>
              </div>
              <button
                onClick={() => setShowAddLeadModal(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: C.textMuted, padding: 4 }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateLead}>
              <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 14, maxHeight: "70vh", overflowY: "auto" }}>
                {/* Name */}
                <div>
                  <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: C.textMuted, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Full Name <span style={{ color: "#EF4444" }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={newLeadName}
                    onChange={e => setNewLeadName(e.target.value)}
                    style={{
                      width: "100%", padding: "9px 12px",
                      border: "1px solid " + C.border, borderRadius: 6,
                      fontSize: "0.875rem", color: C.textPrimary,
                      background: C.white, outline: "none", boxSizing: "border-box",
                    }}
                  />
                </div>

                {/* Company & Phone */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: C.textMuted, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Company
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Acme Corp"
                      value={newLeadCompany}
                      onChange={e => setNewLeadCompany(e.target.value)}
                      style={{
                        width: "100%", padding: "9px 12px",
                        border: "1px solid " + C.border, borderRadius: 6,
                        fontSize: "0.875rem", color: C.textPrimary,
                        background: C.white, outline: "none", boxSizing: "border-box",
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: C.textMuted, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Phone
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. +91 98765 43210"
                      value={newLeadPhone}
                      onChange={e => setNewLeadPhone(e.target.value)}
                      style={{
                        width: "100%", padding: "9px 12px",
                        border: "1px solid " + C.border, borderRadius: 6,
                        fontSize: "0.875rem", color: C.textPrimary,
                        background: C.white, outline: "none", boxSizing: "border-box",
                      }}
                    />
                  </div>
                </div>

                {/* Email & Pipeline Stage */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: C.textMuted, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Email
                    </label>
                    <input
                      type="email"
                      placeholder="e.g. rahul@example.com"
                      value={newLeadEmail}
                      onChange={e => setNewLeadEmail(e.target.value)}
                      style={{
                        width: "100%", padding: "9px 12px",
                        border: "1px solid " + C.border, borderRadius: 6,
                        fontSize: "0.875rem", color: C.textPrimary,
                        background: C.white, outline: "none", boxSizing: "border-box",
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: C.textMuted, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Pipeline Stage
                    </label>
                    <select
                      value={newLeadStatus}
                      onChange={e => setNewLeadStatus(e.target.value as LeadStatus)}
                      style={{
                        width: "100%", padding: "9px 12px",
                        border: "1px solid " + C.border, borderRadius: 6,
                        fontSize: "0.875rem", color: C.textPrimary,
                        background: C.white, outline: "none", cursor: "pointer",
                      }}
                    >
                      <option value="NEW">New</option>
                      <option value="CONTACTED">Contacted</option>
                      <option value="INTERESTED">Interested</option>
                      <option value="NOT_INTERESTED">Not Interested</option>
                      <option value="CONVERTED">Converted</option>
                    </select>
                  </div>
                </div>

                {/* Assign To */}
                <div>
                  <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: C.textMuted, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Assign To
                  </label>
                  <select
                    value={newLeadAssignee}
                    onChange={e => setNewLeadAssignee(e.target.value)}
                    style={{
                      width: "100%", padding: "9px 12px",
                      border: "1px solid " + C.border, borderRadius: 6,
                      fontSize: "0.875rem", color: C.textPrimary,
                      background: C.white, outline: "none", cursor: "pointer",
                    }}
                  >
                    <option value="">Unassigned</option>
                    {marketingTeam.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.name || m.email} ({m.role})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Notes */}
                <div>
                  <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: C.textMuted, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Initial Notes
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Any background information, requirements, or referral notes..."
                    value={newLeadNotes}
                    onChange={e => setNewLeadNotes(e.target.value)}
                    style={{
                      width: "100%", padding: "9px 12px",
                      border: "1px solid " + C.border, borderRadius: 6,
                      fontSize: "0.875rem", color: C.textPrimary,
                      background: C.white, resize: "none", outline: "none",
                      boxSizing: "border-box", fontFamily: "inherit",
                    }}
                  />
                </div>
              </div>

              {/* Footer */}
              <div style={{
                padding: "16px 24px",
                borderTop: "1px solid " + C.border,
                display: "flex", gap: 10,
              }}>
                <button
                  type="button"
                  onClick={() => setShowAddLeadModal(false)}
                  style={{
                    flex: 1, padding: "10px 0", borderRadius: 6,
                    border: "1px solid " + C.border, background: C.white,
                    color: C.textPrimary, fontSize: "0.875rem", cursor: "pointer", fontWeight: 500,
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingLead}
                  style={{
                    flex: 2, padding: "10px 0", borderRadius: 6,
                    border: "none", background: C.primary,
                    color: "#fff", fontSize: "0.875rem", cursor: creatingLead ? "wait" : "pointer",
                    fontWeight: 600, opacity: creatingLead ? 0.7 : 1,
                  }}
                >
                  {creatingLead ? "Creating…" : "Create Lead"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {deleteConfirmTarget && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 100,
          background: "rgba(0,0,0,0.45)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: 16, backdropFilter: "blur(2px)",
        }}>
          <div style={{
            background: C.white, borderRadius: 12,
            border: "1px solid " + C.border,
            boxShadow: "0 20px 40px rgba(0,0,0,0.18)",
            width: "100%", maxWidth: 440,
            overflow: "hidden",
          }}>
            <div style={{
              padding: "24px 24px 18px",
              display: "flex", alignItems: "flex-start", gap: 14,
            }}>
              <div style={{
                width: 42, height: 42, borderRadius: "50%",
                background: "#FEE2E2", color: "#EF4444",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                <Trash2 size={20} />
              </div>
              <div>
                <h3 style={{ margin: "0 0 6px", fontSize: "1.1rem", fontWeight: 700, color: C.textPrimary }}>
                  {deleteConfirmTarget.type === "bulk"
                    ? `Delete ${deleteConfirmTarget.count} Leads?`
                    : `Delete Lead "${deleteConfirmTarget.lead?.Name}"?`}
                </h3>
                <p style={{ margin: 0, fontSize: "0.875rem", color: C.textMuted, lineHeight: 1.5 }}>
                  {deleteConfirmTarget.type === "bulk"
                    ? `Are you sure you want to permanently delete these ${deleteConfirmTarget.count} selected lead(s)? All associated call interactions will also be deleted.`
                    : `Are you sure you want to permanently delete this lead? All associated call interactions will also be deleted.`}
                </p>
                <div style={{
                  marginTop: 12, padding: "8px 12px", borderRadius: 6,
                  background: "#FEF2F2", border: "1px solid #FECACA",
                  fontSize: "0.8rem", color: "#991B1B", fontWeight: 500,
                }}>
                  ⚠️ This action cannot be undone.
                </div>
              </div>
            </div>

            <div style={{
              padding: "14px 24px",
              borderTop: "1px solid " + C.border,
              background: C.rowHover,
              display: "flex", justifyContent: "flex-end", gap: 10,
            }}>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteConfirmTarget(null)}
                style={{
                  padding: "9px 16px", borderRadius: 6,
                  border: "1px solid " + C.border, background: C.white,
                  color: C.textPrimary, fontSize: "0.875rem", cursor: "pointer", fontWeight: 500,
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={executeDelete}
                style={{
                  padding: "9px 18px", borderRadius: 6,
                  border: "none", background: "#EF4444",
                  color: "#fff", fontSize: "0.875rem", cursor: isDeleting ? "wait" : "pointer",
                  fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 7,
                  opacity: isDeleting ? 0.7 : 1,
                  boxShadow: "0 1px 2px rgba(239, 68, 68, 0.25)",
                }}
              >
                {isDeleting ? "Deleting…" : (deleteConfirmTarget.type === "bulk" ? `Delete ${deleteConfirmTarget.count} Leads` : "Delete Lead")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          CONVERT LEAD TO CLIENT / ORDER MODAL
      ══════════════════════════════════════════════════════════ */}
      {convertTarget && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 220,
          background: "rgba(17,24,39,0.55)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: 16, backdropFilter: "blur(2px)",
        }}>
          <div style={{
            background: C.white, borderRadius: 12, width: "100%", maxWidth: 580,
            boxShadow: "0 24px 60px rgba(0,0,0,0.2)",
            overflow: "hidden", display: "flex", flexDirection: "column",
            maxHeight: "92vh",
          }}>
            {/* Header */}
            <div style={{
              padding: "18px 24px",
              borderBottom: "1px solid " + C.border,
              display: "flex", justifyContent: "space-between", alignItems: "flex-start",
              background: "#F8FAFC",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: convertOrderType === "SAMPLE" ? "#F5F3FF" : convertOrderType === "ORDER" ? "#ECFDF5" : "#EFF6FF",
                  color: convertOrderType === "SAMPLE" ? "#7C3AED" : convertOrderType === "ORDER" ? "#059669" : "#1A56DB",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {convertOrderType === "SAMPLE" ? <Sparkles size={20} /> : convertOrderType === "ORDER" ? <Building2 size={20} /> : <CheckCircle2 size={20} />}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: C.textPrimary }}>
                    {convertOrderType === "SAMPLE" ? "Create Sample / Trial Job" : convertOrderType === "ORDER" ? "Direct Production Order" : "Convert Lead to Client"}
                  </h3>
                  <p style={{ margin: "3px 0 0", fontSize: "0.8rem", color: C.textMuted }}>
                    {convertOrderType === "SAMPLE"
                      ? "Converts lead to a Trial Client & dispatches a free sample task to your editors."
                      : convertOrderType === "ORDER"
                      ? "Converts lead to an Active Client & books a production editing order."
                      : "Registers this lead in your permanent client directory."}
                  </p>
                </div>
              </div>
              <button
                onClick={() => { setConvertTarget(null); setConvertSuccessMsg(""); }}
                style={{ background: "none", border: "none", cursor: "pointer", color: C.textMuted, padding: 4 }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={submitConvert} style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
              <div style={{ padding: "20px 24px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 16 }}>

                {/* Success Message Banner */}
                {convertSuccessMsg && (
                  <div style={{
                    padding: "12px 16px", borderRadius: 8,
                    background: "#ECFDF5", border: "1px solid #A7F3D0",
                    color: "#065F46", fontSize: "0.875rem", fontWeight: 600,
                    display: "flex", alignItems: "center", gap: 8,
                  }}>
                    <CheckCircle2 size={18} color="#059669" />
                    <span>{convertSuccessMsg}</span>
                  </div>
                )}

                {/* Workflow Mode Switcher */}
                <div>
                  <label style={{ display: "block", fontSize: "0.74rem", fontWeight: 700, color: C.textMuted, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Select Workflow Path
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => {
                        setConvertOrderType("SAMPLE");
                        setConvertForm(f => ({
                          ...f,
                          serviceType: convertCategory === "PHOTO" ? "Trial Photo Edit (Culling & Color)" : "Trial Video Teaser Reel",
                          totalImages: convertCategory === "PHOTO" ? 25 : 1,
                          deadlineDate: new Date(Date.now() + 2 * 86400000).toISOString().split("T")[0],
                          notes: "Client requested a trial editing sample.",
                        }));
                      }}
                      style={{
                        padding: "10px 8px", borderRadius: 8, textAlign: "center",
                        border: convertOrderType === "SAMPLE" ? "2px solid #7C3AED" : "1px solid " + C.border,
                        background: convertOrderType === "SAMPLE" ? "#F5F3FF" : C.white,
                        color: convertOrderType === "SAMPLE" ? "#6D28D9" : C.textPrimary,
                        cursor: "pointer", fontWeight: 600, fontSize: "0.82rem",
                        display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                      }}
                    >
                      <Sparkles size={16} color={convertOrderType === "SAMPLE" ? "#7C3AED" : C.textMuted} />
                      Need Sample
                      <span style={{ fontSize: "0.7rem", fontWeight: 400, color: convertOrderType === "SAMPLE" ? "#7C3AED" : C.textMuted }}>
                        Trial Client
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setConvertOrderType("ORDER");
                        setConvertForm(f => ({
                          ...f,
                          serviceType: convertCategory === "PHOTO" ? "Wedding Photo Batch Editing" : "Cinematic Wedding Film Editing",
                          totalImages: convertCategory === "PHOTO" ? 500 : 3,
                          deadlineDate: new Date(Date.now() + 4 * 86400000).toISOString().split("T")[0],
                          notes: "Direct production order.",
                        }));
                      }}
                      style={{
                        padding: "10px 8px", borderRadius: 8, textAlign: "center",
                        border: convertOrderType === "ORDER" ? "2px solid #059669" : "1px solid " + C.border,
                        background: convertOrderType === "ORDER" ? "#ECFDF5" : C.white,
                        color: convertOrderType === "ORDER" ? "#065F46" : C.textPrimary,
                        cursor: "pointer", fontWeight: 600, fontSize: "0.82rem",
                        display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                      }}
                    >
                      <Building2 size={16} color={convertOrderType === "ORDER" ? "#059669" : C.textMuted} />
                      Direct Order
                      <span style={{ fontSize: "0.7rem", fontWeight: 400, color: convertOrderType === "ORDER" ? "#059669" : C.textMuted }}>
                        Active Client
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setConvertOrderType("NONE")}
                      style={{
                        padding: "10px 8px", borderRadius: 8, textAlign: "center",
                        border: convertOrderType === "NONE" ? "2px solid " + C.primary : "1px solid " + C.border,
                        background: convertOrderType === "NONE" ? "#EFF6FF" : C.white,
                        color: convertOrderType === "NONE" ? C.primary : C.textPrimary,
                        cursor: "pointer", fontWeight: 600, fontSize: "0.82rem",
                        display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                      }}
                    >
                      <CheckCircle2 size={16} color={convertOrderType === "NONE" ? C.primary : C.textMuted} />
                      Client Only
                      <span style={{ fontSize: "0.7rem", fontWeight: 400, color: convertOrderType === "NONE" ? C.primary : C.textMuted }}>
                        No Job Created
                      </span>
                    </button>
                  </div>
                </div>

                {/* Department Selection (Photo vs Video) if creating a job */}
                {convertOrderType !== "NONE" && (
                  <div>
                    <label style={{ display: "block", fontSize: "0.74rem", fontWeight: 700, color: C.textMuted, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Editing Department
                    </label>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      <button
                        type="button"
                        onClick={() => {
                          setConvertCategory("PHOTO");
                          setConvertForm(f => ({
                            ...f,
                            serviceType: convertOrderType === "SAMPLE" ? "Trial Photo Edit (Culling & Color)" : "Wedding Photo Batch Editing",
                            totalImages: convertOrderType === "SAMPLE" ? 25 : 500,
                            assignedEditorId: "",
                          }));
                        }}
                        style={{
                          padding: "10px 14px", borderRadius: 8,
                          border: convertCategory === "PHOTO" ? "2px solid #1A56DB" : "1px solid " + C.border,
                          background: convertCategory === "PHOTO" ? "#EFF6FF" : C.white,
                          color: convertCategory === "PHOTO" ? "#1A56DB" : C.textPrimary,
                          cursor: "pointer", fontWeight: 600, fontSize: "0.85rem",
                          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                        }}
                      >
                        <ImageIcon size={16} />
                        Photo Editing (Production)
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setConvertCategory("VIDEO");
                          setConvertForm(f => ({
                            ...f,
                            serviceType: convertOrderType === "SAMPLE" ? "Trial Video Teaser Reel" : "Cinematic Wedding Film Editing",
                            totalImages: convertOrderType === "SAMPLE" ? 1 : 3,
                            assignedEditorId: "",
                          }));
                        }}
                        style={{
                          padding: "10px 14px", borderRadius: 8,
                          border: convertCategory === "VIDEO" ? "2px solid #7C3AED" : "1px solid " + C.border,
                          background: convertCategory === "VIDEO" ? "#F5F3FF" : C.white,
                          color: convertCategory === "VIDEO" ? "#7C3AED" : C.textPrimary,
                          cursor: "pointer", fontWeight: 600, fontSize: "0.85rem",
                          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                        }}
                      >
                        <Video size={16} />
                        Video Editing
                      </button>
                    </div>
                  </div>
                )}

                {/* Client Basic Details */}
                <div style={{ borderTop: "1px solid " + C.border, paddingTop: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                    <span style={{ fontSize: "0.78rem", fontWeight: 700, color: C.textPrimary, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Client Profile Details
                    </span>
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: 4,
                      padding: "2px 8px", borderRadius: 12, background: "#EFF6FF",
                      color: "#1E40AF", fontSize: "0.72rem", fontWeight: 600,
                    }}>
                      🇮🇳 India • Currency: INR (₹)
                    </span>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: C.textMuted, marginBottom: 4 }}>
                        Company / Studio Name <span style={{ color: "#EF4444" }}>*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={convertForm.companyName}
                        onChange={e => setConvertForm({ ...convertForm, companyName: e.target.value })}
                        placeholder="e.g. Dream Wedding Films"
                        style={{
                          width: "100%", padding: "8px 10px",
                          border: "1px solid " + C.border, borderRadius: 6,
                          fontSize: "0.85rem", color: C.textPrimary, outline: "none", boxSizing: "border-box",
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: C.textMuted, marginBottom: 4 }}>
                        Contact Person <span style={{ color: "#EF4444" }}>*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={convertForm.contactPerson}
                        onChange={e => setConvertForm({ ...convertForm, contactPerson: e.target.value })}
                        placeholder="e.g. Rajesh Kumar"
                        style={{
                          width: "100%", padding: "8px 10px",
                          border: "1px solid " + C.border, borderRadius: 6,
                          fontSize: "0.85rem", color: C.textPrimary, outline: "none", boxSizing: "border-box",
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: C.textMuted, marginBottom: 4 }}>
                        Phone Number
                      </label>
                      <input
                        type="text"
                        value={convertForm.phone}
                        onChange={e => setConvertForm({ ...convertForm, phone: e.target.value })}
                        placeholder="+91 98765 43210"
                        style={{
                          width: "100%", padding: "8px 10px",
                          border: "1px solid " + C.border, borderRadius: 6,
                          fontSize: "0.85rem", color: C.textPrimary, outline: "none", boxSizing: "border-box",
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: C.textMuted, marginBottom: 4 }}>
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={convertForm.email}
                        onChange={e => setConvertForm({ ...convertForm, email: e.target.value })}
                        placeholder="client@example.com"
                        style={{
                          width: "100%", padding: "8px 10px",
                          border: "1px solid " + C.border, borderRadius: 6,
                          fontSize: "0.85rem", color: C.textPrimary, outline: "none", boxSizing: "border-box",
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Job Details Section (if creating job) */}
                {convertOrderType !== "NONE" && (
                  <div style={{ borderTop: "1px solid " + C.border, paddingTop: 14 }}>
                    <div style={{ marginBottom: 10 }}>
                      <span style={{ fontSize: "0.78rem", fontWeight: 700, color: C.textPrimary, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        {convertOrderType === "SAMPLE" ? "🧪 Sample Job Setup" : "📦 Production Order Setup"}
                      </span>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 10, marginBottom: 10 }}>
                      <div>
                        <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: C.textMuted, marginBottom: 4 }}>
                          Service Type
                        </label>
                        <input
                          type="text"
                          required
                          value={convertForm.serviceType}
                          onChange={e => setConvertForm({ ...convertForm, serviceType: e.target.value })}
                          placeholder={convertCategory === "PHOTO" ? "e.g. Wedding Photo Editing" : "e.g. Teaser / Highlight Reel"}
                          style={{
                            width: "100%", padding: "8px 10px",
                            border: "1px solid " + C.border, borderRadius: 6,
                            fontSize: "0.85rem", color: C.textPrimary, outline: "none", boxSizing: "border-box",
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: C.textMuted, marginBottom: 4 }}>
                          {convertCategory === "PHOTO" ? "Images Count" : "Video Count"}
                        </label>
                        <input
                          type="number"
                          min="1"
                          required
                          value={convertForm.totalImages}
                          onChange={e => setConvertForm({ ...convertForm, totalImages: parseInt(e.target.value) || 0 })}
                          style={{
                            width: "100%", padding: "8px 10px",
                            border: "1px solid " + C.border, borderRadius: 6,
                            fontSize: "0.85rem", color: C.textPrimary, outline: "none", boxSizing: "border-box",
                          }}
                        />
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                      <div>
                        <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: C.textMuted, marginBottom: 4 }}>
                          Assign Editor ({convertCategory === "PHOTO" ? "Photo Team" : "Video Team"})
                        </label>
                        <select
                          value={convertForm.assignedEditorId}
                          onChange={e => setConvertForm({ ...convertForm, assignedEditorId: e.target.value })}
                          style={{
                            width: "100%", padding: "8px 10px",
                            border: "1px solid " + C.border, borderRadius: 6,
                            fontSize: "0.85rem", color: C.textPrimary, outline: "none", cursor: "pointer",
                            background: C.white, boxSizing: "border-box",
                          }}
                        >
                          <option value="">Unassigned (Queue)</option>
                          {productionTeam
                            .filter(u => {
                              const r = (u.role || "").toUpperCase();
                              if (convertCategory === "VIDEO") return r.includes("VIDEO");
                              return r.includes("PHOTO") || (!r.includes("VIDEO") && (r.includes("EDITOR") || r.includes("PRODUCTION")));
                            })
                            .map(u => (
                              <option key={u.id} value={u.id}>
                                {u.name || u.email} ({u.role})
                              </option>
                            ))}
                        </select>
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: C.textMuted, marginBottom: 4 }}>
                          Delivery Deadline <span style={{ color: "#EF4444" }}>*</span>
                        </label>
                        <input
                          type="date"
                          required
                          value={convertForm.deadlineDate}
                          onChange={e => setConvertForm({ ...convertForm, deadlineDate: e.target.value })}
                          style={{
                            width: "100%", padding: "8px 10px",
                            border: "1px solid " + C.border, borderRadius: 6,
                            fontSize: "0.85rem", color: C.textPrimary, outline: "none", boxSizing: "border-box",
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: C.textMuted, marginBottom: 4 }}>
                        Editor Instructions / Job Notes
                      </label>
                      <textarea
                        rows={2}
                        value={convertForm.notes}
                        onChange={e => setConvertForm({ ...convertForm, notes: e.target.value })}
                        placeholder="Style preferences, reference links, specific instructions for the editor..."
                        style={{
                          width: "100%", padding: "8px 10px",
                          border: "1px solid " + C.border, borderRadius: 6,
                          fontSize: "0.85rem", color: C.textPrimary, outline: "none",
                          boxSizing: "border-box", fontFamily: "inherit", resize: "none",
                        }}
                      />
                    </div>
                  </div>
                )}

              </div>

              {/* Modal Footer */}
              <div style={{
                padding: "14px 24px",
                borderTop: "1px solid " + C.border,
                background: "#F8FAFC",
                display: "flex", gap: 10, justifyContent: "flex-end",
              }}>
                <button
                  type="button"
                  onClick={() => { setConvertTarget(null); setConvertSuccessMsg(""); }}
                  style={{
                    padding: "9px 18px", borderRadius: 6,
                    border: "1px solid " + C.border, background: C.white,
                    color: C.textPrimary, fontSize: "0.875rem", cursor: "pointer", fontWeight: 500,
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={converting}
                  style={{
                    padding: "9px 20px", borderRadius: 6,
                    border: "none",
                    background: convertOrderType === "SAMPLE" ? "#7C3AED" : convertOrderType === "ORDER" ? "#059669" : C.primary,
                    color: "#fff", fontSize: "0.875rem", cursor: converting ? "wait" : "pointer",
                    fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 8,
                    opacity: converting ? 0.7 : 1,
                  }}
                >
                  {converting ? (
                    "Processing…"
                  ) : convertOrderType === "SAMPLE" ? (
                    <>
                      <Sparkles size={16} />
                      Create Sample Job &amp; Client
                    </>
                  ) : convertOrderType === "ORDER" ? (
                    <>
                      <Building2 size={16} />
                      Create Order &amp; Client
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      Register Client Only
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Page Export ────────────────────────────────────────────── */
export default function LeadsPage() {
  return (
    <RoleGuard allowedRoles={["admin", "marketing"]}>
      <LeadsContent />
    </RoleGuard>
  );
}
