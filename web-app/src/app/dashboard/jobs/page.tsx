"use client";

import { useState, useEffect } from "react";
import {
  Film, Image as ImageIcon, Video, Plus, Search, Filter,
  CheckCircle2, AlertCircle, Clock, Check, X, ChevronRight,
  TrendingUp, RefreshCw, Send, ShieldCheck, AlertTriangle, Eye, Trash2, Play,
  ExternalLink, Link as LinkIcon, Folder, FolderPlus
} from "lucide-react";
import { useRole } from "@/context/RoleContext";
import { RoleGuard } from "@/components/RoleGuard";

// Design tokens
const C = {
  bg: "#F5F7FB",
  card: "#FFFFFF",
  border: "#E5E7EB",
  primary: "#1A56DB",
  text: "#111827",
  muted: "#6B7280",
  radius: "10px",
  radiusSm: "6px",
};

type EditingJob = {
  id: string;
  jobNumber: string;
  title: string;
  serviceType: string;
  category: "PHOTO" | "VIDEO";
  clientId: string;
  client: { id: string; clientId: string; companyName: string; contactPerson: string };
  totalImages: number;
  completedImages: number;
  durationMinutes?: number;
  deliverableNotes?: string;
  assignedEditorId?: string;
  assignedEditor?: { id: string; name: string; role: string };
  qcReviewerId?: string;
  qcReviewer?: { id: string; name: string; role: string };
  receivedDate: string;
  deadlineDate: string;
  priority: "URGENT" | "HIGH" | "MEDIUM" | "LOW";
  status: string;
  qcNotes?: string;
  revisionNotes?: string;
  workLink?: string;
  rawFilesLink?: string;
  qcStatus?: string;
  approvedAt?: string;
  createdAt: string;
};

const CATEGORY_TABS = [
  { label: "All Editing Jobs", value: "ALL" },
  { label: "Photo Editing (ED)", value: "PHOTO" },
  { label: "Video Editing (VD)", value: "VIDEO" },
  { label: "Awaiting QC", value: "QC" },
  { label: "In Revision", value: "REVISION" },
  { label: "Delivered", value: "DELIVERED" },
];

const PIPELINE_STEPS = [
  "RECEIVED", "ASSIGNED", "EDITING", "QC", "REVISION", "FINAL_QC", "DELIVERED"
];

const STATUS_BADGES: Record<string, { bg: string; color: string; border: string }> = {
  RECEIVED:   { bg: "#F3F4F6", color: "#4B5563", border: "#E5E7EB" },
  ASSIGNED:   { bg: "#EFF6FF", color: "#1D4ED8", border: "#BFDBFE" },
  EDITING:    { bg: "#FEF3C7", color: "#B45309", border: "#FDE68A" },
  QC:         { bg: "#FAF5FF", color: "#7C3AED", border: "#E9D5FF" },
  REVISION:   { bg: "#FEF2F2", color: "#DC2626", border: "#FECACA" },
  FINAL_QC:   { bg: "#ECFDF5", color: "#047857", border: "#A7F3D0" },
  DELIVERED:  { bg: "#ECFDF5", color: "#059669", border: "#6EE7B7" },
};

const PRIORITY_BADGES: Record<string, { bg: string; color: string }> = {
  URGENT: { bg: "#FEF2F2", color: "#DC2626" },
  HIGH:   { bg: "#FFF7ED", color: "#EA580C" },
  MEDIUM: { bg: "#EFF6FF", color: "#2563EB" },
  LOW:    { bg: "#F3F4F6", color: "#6B7280" },
};

export default function EditingJobsPage() {
  const { user } = useRole();
  const isAdmin = user?.role === "admin";
  const isVideoEditor = user?.role === "video_editor";
  const isPhotoEditor = user?.role === "photo_editor" || (user?.role === "editor" && !isVideoEditor);

  // Dynamic tabs according to role
  const roleTabs = isAdmin
    ? [
        { label: "All Editing Jobs", value: "ALL" },
        { label: "Photo Editing (ED)", value: "PHOTO" },
        { label: "Video Editing (VD)", value: "VIDEO" },
        { label: "Awaiting QC", value: "QC" },
        { label: "In Revision", value: "REVISION" },
        { label: "Delivered", value: "DELIVERED" },
      ]
    : isVideoEditor
    ? [
        { label: "My Assigned Projects", value: "ALL" },
        { label: "In Editing", value: "EDITING" },
        { label: "Awaiting Review", value: "QC" },
        { label: "In Revision", value: "REVISION" },
        { label: "Delivered", value: "DELIVERED" },
      ]
    : [
        { label: "My Assigned Jobs", value: "ALL" },
        { label: "In Editing", value: "EDITING" },
        { label: "Awaiting QC", value: "QC" },
        { label: "In Revision", value: "REVISION" },
        { label: "Delivered", value: "DELIVERED" },
      ];

  const [jobs, setJobs] = useState<EditingJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("ALL");
  const [search, setSearch] = useState("");

  const [clients, setClients] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showQCModal, setShowQCModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState<EditingJob | null>(null);
  const [qcAction, setQcAction] = useState<"approve" | "revision">("approve");
  const [qcNotes, setQcNotes] = useState("");

  // Work Link Modal
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [selectedJobForLink, setSelectedJobForLink] = useState<EditingJob | null>(null);
  const [workLinkInput, setWorkLinkInput] = useState("");
  const [rawFilesLinkInput, setRawFilesLinkInput] = useState("");
  const [savingLink, setSavingLink] = useState(false);

  // Assign Editor & Task Folder / Raw Files Modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedJobForAssign, setSelectedJobForAssign] = useState<EditingJob | null>(null);
  const [assignEditorId, setAssignEditorId] = useState("");
  const [assignRawFilesLink, setAssignRawFilesLink] = useState("");
  const [savingAssign, setSavingAssign] = useState(false);

  // Dedicated Raw Files / Task Folder Link Modal
  const [showRawLinkModal, setShowRawLinkModal] = useState(false);
  const [selectedJobForRawLink, setSelectedJobForRawLink] = useState<EditingJob | null>(null);
  const [rawLinkInput, setRawLinkInput] = useState("");
  const [savingRawLink, setSavingRawLink] = useState(false);

  // Quick Approval Modal (Admin: OK)
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [selectedJobForApproval, setSelectedJobForApproval] = useState<EditingJob | null>(null);
  const [approvalNotes, setApprovalNotes] = useState("");

  // Quick Revision Modal (Admin: Not OK)
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [selectedJobForRevision, setSelectedJobForRevision] = useState<EditingJob | null>(null);
  const [revisionFeedback, setRevisionFeedback] = useState("");

  // Quick edit modal
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [progressImages, setProgressImages] = useState(0);

  // Form state
  const [form, setForm] = useState({
    title: "",
    serviceType: "Wedding Photo Editing",
    category: isVideoEditor ? "VIDEO" : "PHOTO",
    clientId: "",
    totalImages: 500,
    durationMinutes: 0,
    deliverableNotes: "",
    assignedEditorId: "",
    qcReviewerId: "",
    receivedDate: new Date().toISOString().split("T")[0],
    deadlineDate: new Date(Date.now() + 2 * 86400000).toISOString().split("T")[0],
    priority: "HIGH",
    workLink: "",
    rawFilesLink: "",
  });
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (!isAdmin) {
        // Strict role segregation & privacy: editors ONLY see jobs assigned to them!
        if (user?.id) {
          params.set("editorId", user.id);
        }
        params.set("category", isVideoEditor ? "VIDEO" : "PHOTO");
        if (activeTab !== "ALL" && activeTab !== "MY_ASSIGNED") {
          params.set("status", activeTab);
        }
      } else {
        if (activeTab === "PHOTO" || activeTab === "VIDEO") {
          params.set("category", activeTab);
        } else if (activeTab === "QC" || activeTab === "REVISION" || activeTab === "DELIVERED") {
          params.set("status", activeTab);
        }
      }

      if (search) params.set("search", search);

      const qs = params.toString();
      const endpoint = `/api/jobs${qs ? `?${qs}` : ""}`;

      const res = await fetch(endpoint);
      const data = await res.json();
      if (data.success) {
        const fetched = data.data || [];
        setJobs(isAdmin ? fetched : fetched.filter((j: EditingJob) => j.assignedEditorId === user?.id));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchMetadata = async () => {
    try {
      const [cRes, uRes] = await Promise.all([
        fetch("/api/clients"),
        fetch("/api/users"),
      ]);
      const cData = await cRes.json();
      const uData = await uRes.json();
      if (cData.success) setClients(cData.data);
      if (uData.success) setTeamMembers(uData.data);
    } catch (e) {}
  };

  useEffect(() => {
    fetchJobs();
  }, [activeTab, search, user?.id, user?.role]);

  useEffect(() => {
    fetchMetadata();
  }, []);

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.clientId) {
      setFormError("Title and Client are required.");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setShowAddModal(false);
        fetchJobs();
      } else {
        setFormError(data.error || "Failed to create job");
      }
    } catch (e) {
      setFormError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateProgress = async (jobId: string, completed: number) => {
    try {
      const res = await fetch("/api/jobs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: jobId,
          completedImages: completed,
          status: "EDITING",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setJobs(prev => prev.map(j => (j.id === jobId ? { ...j, completedImages: completed, status: "EDITING" } : j)));
        setShowProgressModal(false);
      }
    } catch (e) {
      alert("Error updating progress");
    }
  };

  const handleSubmitForQC = async (job: EditingJob) => {
    if (!job.workLink) {
      alert("Please attach the Deliverables / Work Link first so the Admin can review what you have done!");
      setSelectedJobForLink(job);
      setWorkLinkInput("");
      setRawFilesLinkInput(job.rawFilesLink || "");
      setShowLinkModal(true);
      return;
    }
    if (!confirm(`Submit job #${job.jobNumber} for Quality Check (QC)? Admin will be notified to review deliverables.`)) return;
    try {
      const res = await fetch("/api/jobs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: job.id,
          status: "QC",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setJobs(prev => prev.map(j => (j.id === job.id ? { ...j, status: "QC" } : j)));
        alert(`Job #${job.jobNumber} submitted for QC! Admin has received a notification to review your deliverables.`);
      }
    } catch (e) {
      alert("Failed to submit for QC");
    }
  };

  const handleQCReviewSubmit = async () => {
    if (!selectedJob) return;
    const newStatus = qcAction === "approve" ? "FINAL_QC" : "REVISION";
    try {
      const res = await fetch("/api/jobs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedJob.id,
          status: newStatus,
          qcNotes: qcNotes,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowQCModal(false);
        setQcNotes("");
        fetchJobs();
      }
    } catch (e) {
      alert("Failed to update QC status");
    }
  };

  const handleSaveWorkLink = async () => {
    if (!selectedJobForLink) return;
    setSavingLink(true);
    try {
      const res = await fetch("/api/jobs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedJobForLink.id,
          workLink: workLinkInput.trim(),
          rawFilesLink: rawFilesLinkInput.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowLinkModal(false);
        fetchJobs();
      } else {
        alert(data.error || "Failed to save link");
      }
    } catch {
      alert("Network error saving work link");
    } finally {
      setSavingLink(false);
    }
  };

  const handleApproveWork = async (jobId: string, notes?: string) => {
    try {
      const res = await fetch("/api/jobs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: jobId,
          qcStatus: "APPROVED",
          status: "DELIVERED",
          qcNotes: notes || "Approved by Admin. Work is OK!",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowApproveModal(false);
        setApprovalNotes("");
        fetchJobs();
      } else {
        alert(data.error || "Failed to approve job");
      }
    } catch {
      alert("Network error");
    }
  };

  const handleRequestRevision = async (jobId: string, feedback: string) => {
    if (!feedback.trim()) {
      return alert("Please enter revision feedback explaining what needs to be changed.");
    }
    try {
      const res = await fetch("/api/jobs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: jobId,
          qcStatus: "REVISION",
          status: "REVISION",
          revisionNotes: feedback.trim(),
          qcNotes: feedback.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowRevisionModal(false);
        setRevisionFeedback("");
        fetchJobs();
      } else {
        alert(data.error || "Failed to request revision");
      }
    } catch {
      alert("Network error");
    }
  };

  const handleMarkDelivered = async (job: EditingJob) => {
    if (!confirm(`Mark job #${job.jobNumber} as DELIVERED to client?`)) return;
    try {
      const res = await fetch("/api/jobs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: job.id,
          status: "DELIVERED",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setJobs(prev => prev.map(j => (j.id === job.id ? { ...j, status: "DELIVERED" } : j)));
      }
    } catch (e) {
      alert("Failed to mark delivered");
    }
  };

  const handleStartEditing = async (job: EditingJob) => {
    try {
      const res = await fetch("/api/jobs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: job.id,
          status: "EDITING",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setJobs(prev => prev.map(j => (j.id === job.id ? { ...j, status: "EDITING" } : j)));
      }
    } catch {
      alert("Failed to update status to Editing");
    }
  };

  const handleAssignEditor = async (jobId: string, editorId: string) => {
    try {
      const res = await fetch("/api/jobs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: jobId,
          assignedEditorId: editorId || "",
        }),
      });
      const data = await res.json();
      if (data.success) {
        const editorObj = teamMembers.find(m => m.id === editorId);
        setJobs(prev =>
          prev.map(j => {
            if (j.id === jobId) {
              return {
                ...j,
                assignedEditorId: editorId || undefined,
                assignedEditor: editorObj ? { id: editorObj.id, name: editorObj.name, role: editorObj.role } : undefined,
                status: editorId && j.status === "RECEIVED" ? "ASSIGNED" : (!editorId && j.status === "ASSIGNED" ? "RECEIVED" : j.status),
              };
            }
            return j;
          })
        );
      } else {
        alert(data.error || "Failed to update assigned editor");
      }
    } catch {
      alert("Network error updating assigned editor");
    }
  };

  const handleConfirmAssignment = async () => {
    if (!selectedJobForAssign) return;
    setSavingAssign(true);
    try {
      const res = await fetch("/api/jobs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedJobForAssign.id,
          assignedEditorId: assignEditorId || "",
          rawFilesLink: assignRawFilesLink.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        const editorObj = teamMembers.find(m => m.id === assignEditorId);
        setJobs(prev =>
          prev.map(j => {
            if (j.id === selectedJobForAssign.id) {
              return {
                ...j,
                assignedEditorId: assignEditorId || undefined,
                assignedEditor: editorObj ? { id: editorObj.id, name: editorObj.name, role: editorObj.role } : undefined,
                rawFilesLink: assignRawFilesLink.trim() || undefined,
                status: assignEditorId && j.status === "RECEIVED" ? "ASSIGNED" : (!assignEditorId && j.status === "ASSIGNED" ? "RECEIVED" : j.status),
              };
            }
            return j;
          })
        );
        setShowAssignModal(false);
      } else {
        alert(data.error || "Failed to update assignment and raw files link");
      }
    } catch {
      alert("Network error updating assignment");
    } finally {
      setSavingAssign(false);
    }
  };

  const handleSaveRawLink = async () => {
    if (!selectedJobForRawLink) return;
    setSavingRawLink(true);
    try {
      const res = await fetch("/api/jobs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedJobForRawLink.id,
          rawFilesLink: rawLinkInput.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setJobs(prev =>
          prev.map(j => (j.id === selectedJobForRawLink.id ? { ...j, rawFilesLink: rawLinkInput.trim() || undefined } : j))
        );
        setShowRawLinkModal(false);
      } else {
        alert(data.error || "Failed to save raw files link");
      }
    } catch {
      alert("Network error saving raw files link");
    } finally {
      setSavingRawLink(false);
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm("Are you sure you want to delete this editing job?")) return;
    try {
      const res = await fetch(`/api/jobs?id=${jobId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) fetchJobs();
    } catch (e) {
      alert("Failed to delete job");
    }
  };

  return (
    <RoleGuard allowedRoles={["admin", "photo_editor", "video_editor", "editor", "marketing"]}>
      <div style={{ maxWidth: "1280px", margin: "0 auto", paddingBottom: "3rem" }}>

        {/* ── Header ── */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "flex-start",
          marginBottom: "1.75rem", flexWrap: "wrap", gap: "1rem"
        }}>
          <div>
            <h1 style={{ fontSize: "1.65rem", fontWeight: 800, color: C.text, letterSpacing: "-0.03em", margin: "0 0 4px" }}>
              {isPhotoEditor && !isAdmin ? "Production (Photo Editing) Workflow" : isVideoEditor && !isAdmin ? "Video Editing Workflow" : "Production & Editing Hub"}
            </h1>
            <p style={{ color: C.muted, fontSize: "0.9rem", margin: 0 }}>
              {isPhotoEditor && !isAdmin
                ? "Your assigned wedding photo editing, retouching & color correction queues"
                : isVideoEditor && !isAdmin
                ? "Your assigned reels, commercial video projects & cutdown deliverables"
                : "Live production board: Received → Editing → QC → Revision → Delivered"}
            </p>
          </div>

          {isAdmin && (
            <button
              onClick={() => setShowAddModal(true)}
              style={{
                display: "flex", alignItems: "center", gap: "8px",
                background: C.primary, color: "#fff",
                padding: "0.6rem 1.25rem", borderRadius: C.radiusSm,
                fontSize: "0.875rem", fontWeight: 600, border: "none",
                cursor: "pointer", boxShadow: "0 2px 6px rgba(26,86,219,0.25)"
              }}
            >
              <Plus size={16} /> New Editing Job
            </button>
          )}
        </div>

        {/* ── Stats Bar ── */}
        <div style={{
          display: "grid",
          gridTemplateColumns: isAdmin ? "repeat(5, 1fr)" : "repeat(4, 1fr)",
          gap: "12px",
          marginBottom: "1.5rem"
        }}>
          <div style={{ background: C.card, padding: "1rem", borderRadius: C.radius, border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: "0.78rem", fontWeight: 600, color: C.muted }}>
              {isAdmin ? "Total Jobs" : isVideoEditor ? "My Video Projects" : "My Photo Jobs"}
            </div>
            <div style={{ fontSize: "1.4rem", fontWeight: 800, color: C.text, marginTop: "4px" }}>{jobs.length}</div>
          </div>

          {isAdmin && (
            <div style={{ background: C.card, padding: "1rem", borderRadius: C.radius, border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "#059669" }}>Photo Jobs</div>
              <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#059669", marginTop: "4px" }}>
                {jobs.filter(j => j.category === "PHOTO").length}
              </div>
            </div>
          )}

          {isAdmin && (
            <div style={{ background: C.card, padding: "1rem", borderRadius: C.radius, border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "#D97706" }}>Video Jobs</div>
              <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#D97706", marginTop: "4px" }}>
                {jobs.filter(j => j.category === "VIDEO").length}
              </div>
            </div>
          )}

          {!isAdmin && (
            <div style={{ background: C.card, padding: "1rem", borderRadius: C.radius, border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "#B45309" }}>In Editing</div>
              <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#B45309", marginTop: "4px" }}>
                {jobs.filter(j => j.status === "EDITING" || j.status === "ASSIGNED").length}
              </div>
            </div>
          )}

          <div style={{ background: C.card, padding: "1rem", borderRadius: C.radius, border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "#7C3AED" }}>
              {isVideoEditor ? "Awaiting Review" : "Awaiting QC"}
            </div>
            <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#7C3AED", marginTop: "4px" }}>
              {jobs.filter(j => j.status === "QC").length}
            </div>
          </div>

          <div style={{ background: C.card, padding: "1rem", borderRadius: C.radius, border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "#1D4ED8" }}>Delivered</div>
            <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#1D4ED8", marginTop: "4px" }}>
              {jobs.filter(j => j.status === "DELIVERED").length}
            </div>
          </div>
        </div>

        {/* ── Filters & Search ── */}
        <div style={{
          background: C.card, borderRadius: C.radius, border: `1px solid ${C.border}`,
          padding: "1rem 1.25rem", marginBottom: "1.25rem",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          flexWrap: "wrap", gap: "1rem"
        }}>
          {/* Tabs */}
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {roleTabs.map((tab) => {
              const active = activeTab === tab.value;
              return (
                <button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value)}
                  style={{
                    padding: "0.4rem 0.85rem",
                    borderRadius: "999px",
                    fontSize: "0.8rem",
                    fontWeight: active ? 700 : 500,
                    background: active ? "#EFF6FF" : "transparent",
                    color: active ? C.primary : C.muted,
                    border: active ? "1px solid #BFDBFE" : "1px solid transparent",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Search box */}
          <div style={{
            display: "flex", alignItems: "center", gap: "8px",
            background: "#F9FAFB", border: `1px solid ${C.border}`,
            borderRadius: C.radiusSm, padding: "0.4rem 0.75rem",
            width: "280px"
          }}>
            <Search size={15} color={C.muted} />
            <input
              type="text"
              placeholder="Search job #, title, client..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                border: "none", background: "transparent", outline: "none",
                fontSize: "0.85rem", color: C.text, width: "100%"
              }}
            />
            {search && (
              <X size={14} color={C.muted} style={{ cursor: "pointer" }} onClick={() => setSearch("")} />
            )}
          </div>
        </div>

        {/* ── Jobs Board List ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {loading ? (
            <div style={{ background: C.card, padding: "4rem", textAlign: "center", color: C.muted, borderRadius: C.radius, border: `1px solid ${C.border}` }}>
              Loading production board...
            </div>
          ) : jobs.length === 0 ? (
            <div style={{ background: C.card, padding: "4rem", textAlign: "center", borderRadius: C.radius, border: `1px solid ${C.border}` }}>
              <Film size={32} color={C.muted} style={{ margin: "0 auto 12px" }} />
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: C.text, margin: "0 0 6px" }}>No jobs found</h3>
              <p style={{ color: C.muted, fontSize: "0.85rem", margin: 0 }}>
                {isAdmin ? "Click '+ New Editing Job' to schedule a project for editors." : "No assigned jobs in this queue."}
              </p>
            </div>
          ) : (
            jobs.map((job) => {
              const progressPct =
                job.totalImages > 0
                  ? Math.min(100, Math.round((job.completedImages / job.totalImages) * 100))
                  : job.status === "DELIVERED" ? 100 : 0;

              const isAssignedToMe = user?.id && job.assignedEditorId === user.id;
              const st = STATUS_BADGES[job.status] || STATUS_BADGES.RECEIVED;
              const pr = PRIORITY_BADGES[job.priority] || PRIORITY_BADGES.MEDIUM;

              return (
                <div
                  key={job.id}
                  style={{
                    background: C.card,
                    borderRadius: C.radius,
                    border: `1px solid ${C.border}`,
                    padding: "1.25rem 1.5rem",
                    transition: "box-shadow 0.2s ease, border-color 0.2s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.06)")}
                  onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
                    
                    {/* Left: Job identity & Client */}
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                        <span style={{
                          fontWeight: 800, fontSize: "0.82rem", color: job.category === "VIDEO" ? "#EA580C" : C.primary,
                          background: job.category === "VIDEO" ? "#FFF7ED" : "#EFF6FF",
                          padding: "2px 8px", borderRadius: "6px"
                        }}>
                          {job.jobNumber}
                        </span>

                        <span style={{
                          fontSize: "0.72rem", fontWeight: 700, padding: "2px 6px",
                          borderRadius: "4px", background: pr.bg, color: pr.color
                        }}>
                          {job.priority}
                        </span>

                        <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: C.text, margin: 0 }}>
                          {job.title}
                        </h3>
                      </div>

                      <div style={{ fontSize: "0.82rem", color: C.muted, display: "flex", gap: "12px", alignItems: "center" }}>
                        <span>Client: <strong style={{ color: C.text }}>{job.client.companyName}</strong></span>
                        <span>•</span>
                        <span>Service: {job.serviceType}</span>
                        <span>•</span>
                        <span>Deadline: <strong style={{ color: "#DC2626" }}>{job.deadlineDate}</strong></span>
                      </div>
                    </div>

                    {/* Right: Status badge & Editor Avatar */}
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "0.72rem", color: C.muted, fontWeight: 600, marginBottom: "3px" }}>Assigned Editor</div>
                        {isAdmin ? (
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "4px" }}>
                            <select
                              value={job.assignedEditor?.id || job.assignedEditorId || ""}
                              onChange={(e) => {
                                const chosen = e.target.value;
                                setSelectedJobForAssign(job);
                                setAssignEditorId(chosen);
                                setAssignRawFilesLink(job.rawFilesLink || "");
                                setShowAssignModal(true);
                              }}
                              title="Click to assign editor and put raw files link in task folder"
                              style={{
                                padding: "4px 8px",
                                borderRadius: "6px",
                                border: (job.assignedEditor?.id || job.assignedEditorId) ? `1px solid ${C.border}` : "1.5px dashed #F59E0B",
                                background: (job.assignedEditor?.id || job.assignedEditorId) ? "#FFFFFF" : "#FFFBEB",
                                fontSize: "0.82rem",
                                fontWeight: 700,
                                color: (job.assignedEditor?.id || job.assignedEditorId) ? C.text : "#B45309",
                                cursor: "pointer",
                                outline: "none",
                                boxShadow: (job.assignedEditor?.id || job.assignedEditorId) ? "none" : "0 1px 2px rgba(245, 158, 11, 0.15)",
                              }}
                            >
                              <option value="">⚠️ Unassigned (Click to Assign)</option>
                              {teamMembers
                                .filter((u: any) => {
                                  const r = (u.role || "").toUpperCase();
                                  if (job.category === "VIDEO") return r.includes("VIDEO");
                                  return r.includes("PHOTO") || (!r.includes("VIDEO") && (r.includes("EDITOR") || r.includes("PRODUCTION")));
                                })
                                .map((u: any) => (
                                  <option key={u.id} value={u.id}>
                                    {u.name || u.email} ({u.role})
                                  </option>
                                ))}
                            </select>
                          </div>
                        ) : (
                          <div style={{ fontSize: "0.85rem", fontWeight: 700, color: C.text }}>
                            {job.assignedEditor?.name || "Unassigned"}
                          </div>
                        )}
                      </div>

                      <span style={{
                        padding: "0.3rem 0.8rem", borderRadius: "999px",
                        fontSize: "0.78rem", fontWeight: 700,
                        background: st.bg, color: st.color, border: `1px solid ${st.border}`
                      }}>
                        {job.status}
                      </span>

                      {isAdmin && (
                        <button
                          onClick={() => handleDeleteJob(job.id)}
                          title="Delete Job"
                          style={{
                            background: "transparent", border: "none", color: "#9CA3AF",
                            cursor: "pointer", padding: "4px"
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = "#DC2626")}
                          onMouseLeave={(e) => (e.currentTarget.style.color = "#9CA3AF")}
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Progress section (For photo editing) */}
                  {job.category === "PHOTO" && job.totalImages > 0 && (
                    <div style={{ marginTop: "1rem", paddingTop: "0.85rem", borderTop: `1px solid ${C.border}` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                        <div style={{ fontSize: "0.82rem", fontWeight: 600, color: C.text }}>
                          Progress: <span style={{ color: C.primary, fontWeight: 800 }}>{job.completedImages}</span> / {job.totalImages} images ({progressPct}%)
                        </div>
                        {job.qcNotes && (
                          <div style={{ fontSize: "0.78rem", color: "#DC2626", fontWeight: 600 }}>
                            QC Feedback: {job.qcNotes}
                          </div>
                        )}
                      </div>

                      {/* Progress bar */}
                      <div style={{ width: "100%", height: "8px", background: "#E5E7EB", borderRadius: "999px", overflow: "hidden" }}>
                        <div style={{
                          width: `${progressPct}%`,
                          height: "100%",
                          background: progressPct === 100 ? "#059669" : C.primary,
                          borderRadius: "999px",
                          transition: "width 0.3s ease"
                        }} />
                      </div>
                    </div>
                  )}

                  {/* ── Task Folder / Raw Files Row ── */}
                  <div
                    style={{
                      marginTop: "0.85rem",
                      padding: "0.65rem 1rem",
                      background: job.rawFilesLink ? "#F0FDF4" : "#FFFBEB",
                      borderRadius: C.radiusSm,
                      border: job.rawFilesLink ? "1px solid #BBF7D0" : "1.5px dashed #FCD34D",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: "0.6rem",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                      <span style={{ fontSize: "0.75rem", fontWeight: 800, color: job.rawFilesLink ? "#166534" : "#92400E", textTransform: "uppercase", letterSpacing: "0.04em", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                        📂 Task Folder (Raw Files):
                      </span>

                      {job.rawFilesLink ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <a
                            href={job.rawFilesLink.startsWith("http") ? job.rawFilesLink : `https://${job.rawFilesLink}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Open raw files / camera footage task folder in Google Drive/Dropbox"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "5px",
                              background: "#16A34A",
                              border: "1px solid #15803D",
                              color: "#FFFFFF",
                              borderRadius: C.radiusSm,
                              padding: "4px 10px",
                              fontSize: "0.8rem",
                              fontWeight: 700,
                              textDecoration: "none",
                              boxShadow: "0 1px 2px rgba(22, 163, 74, 0.2)",
                            }}
                          >
                            <ExternalLink size={13} /> Open Task Folder ↗
                          </a>
                          {isAdmin && (
                            <button
                              onClick={() => {
                                setSelectedJobForRawLink(job);
                                setRawLinkInput(job.rawFilesLink || "");
                                setShowRawLinkModal(true);
                              }}
                              title="Edit raw files task folder link"
                              style={{
                                background: "#FFFFFF",
                                border: `1px solid ${C.border}`,
                                borderRadius: C.radiusSm,
                                padding: "3px 8px",
                                fontSize: "0.75rem",
                                color: "#374151",
                                cursor: "pointer",
                                fontWeight: 600,
                              }}
                            >
                              ✏️ Edit Link
                            </button>
                          )}
                        </div>
                      ) : (
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span style={{ fontSize: "0.78rem", color: "#B45309", fontStyle: "italic" }}>
                            No raw files folder link added yet
                          </span>
                          {isAdmin && (
                            <button
                              onClick={() => {
                                setSelectedJobForRawLink(job);
                                setRawLinkInput("");
                                setShowRawLinkModal(true);
                              }}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                background: "#FFFFFF",
                                border: "1.5px dashed #F59E0B",
                                color: "#B45309",
                                borderRadius: C.radiusSm,
                                padding: "3px 10px",
                                fontSize: "0.78rem",
                                fontWeight: 700,
                                cursor: "pointer",
                              }}
                            >
                              + 📂 Put Raw Files Link
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {!isAdmin && (
                      <span style={{ fontSize: "0.75rem", color: job.rawFilesLink ? "#15803D" : "#B45309", fontWeight: 600 }}>
                        {job.rawFilesLink ? "✓ Raw footage & photos ready for download" : "⚠ Awaiting raw footage upload from manager"}
                      </span>
                    )}
                  </div>

                  {/* ── Deliverables Link & Anytime Review / Approval Console ── */}
                  <div
                    style={{
                      marginTop: "0.5rem",
                      padding: "0.75rem 1rem",
                      background: "#F8FAFC",
                      borderRadius: C.radiusSm,
                      border: `1px solid ${C.border}`,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: "0.75rem",
                    }}
                  >
                    {/* Left: Link & status tag */}
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                      <span style={{ fontSize: "0.75rem", fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                        📁 Deliverables:
                      </span>

                      {job.workLink ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <a
                            href={job.workLink.startsWith("http") ? job.workLink : `https://${job.workLink}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Click to check work preview/files anytime"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "5px",
                              background: "#EFF6FF",
                              border: "1px solid #BFDBFE",
                              color: C.primary,
                              borderRadius: C.radiusSm,
                              padding: "4px 10px",
                              fontSize: "0.82rem",
                              fontWeight: 700,
                              textDecoration: "none",
                              boxShadow: "0 1px 2px rgba(26, 86, 219, 0.08)",
                            }}
                          >
                            <ExternalLink size={13} /> Open Work Link ↗
                          </a>
                          <button
                            onClick={() => {
                              setSelectedJobForLink(job);
                              setWorkLinkInput(job.workLink || "");
                              setRawFilesLinkInput(job.rawFilesLink || "");
                              setShowLinkModal(true);
                            }}
                            title="Edit link"
                            style={{
                              background: "#fff",
                              border: `1px solid ${C.border}`,
                              borderRadius: C.radiusSm,
                              padding: "3px 8px",
                              fontSize: "0.75rem",
                              color: C.muted,
                              cursor: "pointer",
                              fontWeight: 600,
                            }}
                          >
                            ✏️ Edit
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedJobForLink(job);
                            setWorkLinkInput("");
                            setRawFilesLinkInput(job.rawFilesLink || "");
                            setShowLinkModal(true);
                          }}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            background: "#fff",
                            border: "1.5px dashed #94A3B8",
                            color: C.primary,
                            borderRadius: C.radiusSm,
                            padding: "4px 10px",
                            fontSize: "0.8rem",
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          <LinkIcon size={13} /> + Put Work / Drive Link
                        </button>
                      )}

                      {/* Raw Files Link from Client if present */}
                      {job.rawFilesLink && (
                        <a
                          href={job.rawFilesLink.startsWith("http") ? job.rawFilesLink : `https://${job.rawFilesLink}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Open client raw files / footage"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            background: "#F1F5F9",
                            border: `1px solid ${C.border}`,
                            color: "#475569",
                            borderRadius: C.radiusSm,
                            padding: "3px 8px",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            textDecoration: "none",
                          }}
                        >
                          <ExternalLink size={11} /> Raw Files ↗
                        </a>
                      )}

                      {/* QC Verdict Pill */}
                      {job.qcStatus === "APPROVED" && (
                        <span style={{
                          display: "inline-flex", alignItems: "center", gap: "4px",
                          padding: "2px 8px", borderRadius: "999px",
                          fontSize: "0.75rem", fontWeight: 700,
                          background: "#ECFDF5", color: "#059669", border: "1px solid #A7F3D0"
                        }}>
                          ✅ Approved (OK)
                        </span>
                      )}
                      {job.qcStatus === "REVISION" && (
                        <span style={{
                          display: "inline-flex", alignItems: "center", gap: "4px",
                          padding: "2px 8px", borderRadius: "999px",
                          fontSize: "0.75rem", fontWeight: 700,
                          background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA"
                        }}>
                          ⚠️ Revision Needed (Not OK)
                        </span>
                      )}
                      {job.workLink && (!job.qcStatus || job.qcStatus === "PENDING") && (
                        <span style={{
                          display: "inline-flex", alignItems: "center", gap: "4px",
                          padding: "2px 8px", borderRadius: "999px",
                          fontSize: "0.75rem", fontWeight: 700,
                          background: "#FAF5FF", color: "#7C3AED", border: "1px solid #E9D5FF"
                        }}>
                          ⏳ Ready for Review
                        </span>
                      )}
                    </div>

                    {/* Right: Admin Anytime Approval Actions (Which is OK and Which is NOT) */}
                    {isAdmin && (
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <button
                          onClick={() => {
                            setSelectedJobForApproval(job);
                            setApprovalNotes("");
                            setShowApproveModal(true);
                          }}
                          title="Check work link anytime and approve (OK)"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            background: job.qcStatus === "APPROVED" ? "#047857" : "#059669",
                            color: "#fff",
                            border: "none",
                            borderRadius: C.radiusSm,
                            padding: "5px 12px",
                            fontSize: "0.78rem",
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          <CheckCircle2 size={13} /> {job.qcStatus === "APPROVED" ? "Approved (OK) ✓" : "Approve (OK)"}
                        </button>

                        <button
                          onClick={() => {
                            setSelectedJobForRevision(job);
                            setRevisionFeedback(job.revisionNotes || "");
                            setShowRevisionModal(true);
                          }}
                          title="Flag changes needed / not OK"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            background: "#FFF1F2",
                            border: "1px solid #FECDD3",
                            color: "#E11D48",
                            borderRadius: C.radiusSm,
                            padding: "5px 12px",
                            fontSize: "0.78rem",
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          <AlertTriangle size={13} /> Request Revision (Not OK)
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Revision Feedback Callout if in Revision */}
                  {job.revisionNotes && (
                    <div style={{
                      marginTop: "6px",
                      padding: "6px 12px",
                      background: "#FEF2F2",
                      borderRadius: C.radiusSm,
                      border: "1px solid #FCA5A5",
                      fontSize: "0.78rem",
                      color: "#DC2626",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px"
                    }}>
                      <strong>⚠️ Revision Notes:</strong> {job.revisionNotes}
                    </div>
                  )}

                  {/* Action Bar for Editors & Admin */}
                  <div style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    marginTop: "1rem", flexWrap: "wrap", gap: "8px"
                  }}>
                    {/* Quick increment buttons for assigned editor or admin */}
                    <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                      {(isAdmin || isAssignedToMe) && job.category === "PHOTO" && job.status !== "DELIVERED" && (
                        <>
                          <button
                            onClick={() => handleUpdateProgress(job.id, Math.min(job.totalImages, job.completedImages + 50))}
                            style={{
                              background: "#F1F5F9", border: `1px solid ${C.border}`, borderRadius: C.radiusSm,
                              padding: "0.3rem 0.65rem", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer", color: C.text
                            }}
                          >
                            +50 imgs
                          </button>
                          <button
                            onClick={() => handleUpdateProgress(job.id, Math.min(job.totalImages, job.completedImages + 100))}
                            style={{
                              background: "#F1F5F9", border: `1px solid ${C.border}`, borderRadius: C.radiusSm,
                              padding: "0.3rem 0.65rem", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer", color: C.text
                            }}
                          >
                            +100 imgs
                          </button>
                          <button
                            onClick={() => {
                              setSelectedJob(job);
                              setProgressImages(job.completedImages);
                              setShowProgressModal(true);
                            }}
                            style={{
                              background: "#F1F5F9", border: `1px solid ${C.border}`, borderRadius: C.radiusSm,
                              padding: "0.3rem 0.65rem", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer", color: C.primary
                            }}
                          >
                            Set Count...
                          </button>
                        </>
                      )}
                    </div>

                    {/* Pipeline Stage Transitions & Timer */}
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      {/* Move to In-Editing (if ASSIGNED) */}
                      {(isAdmin || isAssignedToMe) && job.status === "ASSIGNED" && (
                        <button
                          onClick={() => handleStartEditing(job)}
                          title="Move job status to In-Editing"
                          style={{
                            display: "flex", alignItems: "center", gap: "5px",
                            background: "#FEF3C7", color: "#B45309", border: "1px solid #FDE68A",
                            borderRadius: C.radiusSm, padding: "0.38rem 0.8rem",
                            fontSize: "0.78rem", fontWeight: 700, cursor: "pointer"
                          }}
                        >
                          🎨 Start Editing
                        </button>
                      )}

                      {/* Submit for QC (if in editing or revision) */}
                      {(isAdmin || isAssignedToMe) && (job.status === "EDITING" || job.status === "ASSIGNED" || job.status === "REVISION") && (
                        <button
                          onClick={() => handleSubmitForQC(job)}
                          style={{
                            display: "flex", alignItems: "center", gap: "5px",
                            background: "#7C3AED", color: "#fff", border: "none",
                            borderRadius: C.radiusSm, padding: "0.4rem 0.85rem",
                            fontSize: "0.78rem", fontWeight: 600, cursor: "pointer"
                          }}
                        >
                          <Send size={13} /> Submit for QC
                        </button>
                      )}

                      {/* QC Review action (Admin or assigned QC) */}
                      {isAdmin && job.status === "QC" && (
                        <button
                          onClick={() => {
                            setSelectedJob(job);
                            setShowQCModal(true);
                          }}
                          style={{
                            display: "flex", alignItems: "center", gap: "5px",
                            background: "#059669", color: "#fff", border: "none",
                            borderRadius: C.radiusSm, padding: "0.4rem 0.85rem",
                            fontSize: "0.78rem", fontWeight: 600, cursor: "pointer"
                          }}
                        >
                          <ShieldCheck size={14} /> Review QC
                        </button>
                      )}

                      {/* Mark Delivered (Admin) */}
                      {isAdmin && (job.status === "FINAL_QC" || job.status === "QC") && (
                        <button
                          onClick={() => handleMarkDelivered(job)}
                          style={{
                            display: "flex", alignItems: "center", gap: "5px",
                            background: C.primary, color: "#fff", border: "none",
                            borderRadius: C.radiusSm, padding: "0.4rem 0.85rem",
                            fontSize: "0.78rem", fontWeight: 600, cursor: "pointer"
                          }}
                        >
                          <Check size={14} /> Mark Delivered
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ── Add Editing Job Modal ── */}
        {showAddModal && (
          <div style={{
            position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)",
            backdropFilter: "blur(4px)", zIndex: 100, display: "flex",
            alignItems: "center", justifyContent: "center", padding: "1rem"
          }}>
            <div style={{
              background: C.card, borderRadius: C.radius, width: "100%", maxWidth: "560px",
              maxHeight: "90vh", overflowY: "auto", padding: "1.75rem",
              boxShadow: "0 20px 40px rgba(0,0,0,0.15)", border: `1px solid ${C.border}`
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
                <div>
                  <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: C.text, margin: 0 }}>Create Editing Job</h2>
                  <p style={{ color: C.muted, fontSize: "0.8rem", margin: "2px 0 0" }}>Assign project deliverables and deadlines</p>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: C.muted }}
                >
                  <X size={18} />
                </button>
              </div>

              {formError && (
                <div style={{
                  background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: C.radiusSm,
                  padding: "0.6rem 0.85rem", color: "#DC2626", fontSize: "0.85rem", marginBottom: "1rem"
                }}>
                  {formError}
                </div>
              )}

              <form onSubmit={handleCreateJob} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: C.text, marginBottom: "4px" }}>Job Title *</label>
                  <input
                    required
                    placeholder="e.g. Wedding Photo Edit - Rohit & Priya"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    style={{ width: "100%", padding: "0.5rem 0.75rem", border: `1px solid ${C.border}`, borderRadius: C.radiusSm, fontSize: "0.875rem", boxSizing: "border-box" }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: C.text, marginBottom: "4px" }}>Category *</label>
                    <select
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value as any })}
                      style={{ width: "100%", padding: "0.5rem 0.75rem", border: `1px solid ${C.border}`, borderRadius: C.radiusSm, fontSize: "0.875rem", background: "#fff" }}
                    >
                      <option value="PHOTO">Photo Editing (ED)</option>
                      <option value="VIDEO">Video Editing (VD)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: C.text, marginBottom: "4px" }}>Client *</label>
                    <select
                      required
                      value={form.clientId}
                      onChange={(e) => setForm({ ...form, clientId: e.target.value })}
                      style={{ width: "100%", padding: "0.5rem 0.75rem", border: `1px solid ${C.border}`, borderRadius: C.radiusSm, fontSize: "0.875rem", background: "#fff" }}
                    >
                      <option value="">Select Client...</option>
                      {clients.map((c) => (
                        <option key={c.id} value={c.id}>{c.companyName} ({c.clientId})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: C.text, marginBottom: "4px" }}>Service Type</label>
                    <input
                      placeholder="e.g. Wedding Photo Editing / Retouching / Reels"
                      value={form.serviceType}
                      onChange={(e) => setForm({ ...form, serviceType: e.target.value })}
                      style={{ width: "100%", padding: "0.5rem 0.75rem", border: `1px solid ${C.border}`, borderRadius: C.radiusSm, fontSize: "0.875rem", boxSizing: "border-box" }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: C.text, marginBottom: "4px" }}>
                      {form.category === "PHOTO" ? "Total Images" : "Duration (mins)"}
                    </label>
                    <input
                      type="number"
                      value={form.category === "PHOTO" ? form.totalImages : form.durationMinutes}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10) || 0;
                        if (form.category === "PHOTO") setForm({ ...form, totalImages: val });
                        else setForm({ ...form, durationMinutes: val });
                      }}
                      style={{ width: "100%", padding: "0.5rem 0.75rem", border: `1px solid ${C.border}`, borderRadius: C.radiusSm, fontSize: "0.875rem", boxSizing: "border-box" }}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: C.text, marginBottom: "4px" }}>Assigned Editor</label>
                    <select
                      value={form.assignedEditorId}
                      onChange={(e) => setForm({ ...form, assignedEditorId: e.target.value })}
                      style={{ width: "100%", padding: "0.5rem 0.75rem", border: `1px solid ${C.border}`, borderRadius: C.radiusSm, fontSize: "0.875rem", background: "#fff" }}
                    >
                      <option value="">Unassigned</option>
                      {teamMembers.map((m) => (
                        <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: C.text, marginBottom: "4px" }}>Priority</label>
                    <select
                      value={form.priority}
                      onChange={(e) => setForm({ ...form, priority: e.target.value })}
                      style={{ width: "100%", padding: "0.5rem 0.75rem", border: `1px solid ${C.border}`, borderRadius: C.radiusSm, fontSize: "0.875rem", background: "#fff" }}
                    >
                      <option value="URGENT">Urgent</option>
                      <option value="HIGH">High</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="LOW">Low</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: C.text, marginBottom: "4px" }}>Received Date</label>
                    <input
                      type="date"
                      value={form.receivedDate}
                      onChange={(e) => setForm({ ...form, receivedDate: e.target.value })}
                      style={{ width: "100%", padding: "0.5rem 0.75rem", border: `1px solid ${C.border}`, borderRadius: C.radiusSm, fontSize: "0.875rem", boxSizing: "border-box" }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: C.text, marginBottom: "4px" }}>Deadline Date</label>
                    <input
                      type="date"
                      value={form.deadlineDate}
                      onChange={(e) => setForm({ ...form, deadlineDate: e.target.value })}
                      style={{ width: "100%", padding: "0.5rem 0.75rem", border: `1px solid ${C.border}`, borderRadius: C.radiusSm, fontSize: "0.875rem", boxSizing: "border-box" }}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: C.text, marginBottom: "4px" }}>
                      Work Deliverables Link (Optional)
                    </label>
                    <input
                      placeholder="e.g. Google Drive / Dropbox link"
                      value={form.workLink}
                      onChange={(e) => setForm({ ...form, workLink: e.target.value })}
                      style={{ width: "100%", padding: "0.5rem 0.75rem", border: `1px solid ${C.border}`, borderRadius: C.radiusSm, fontSize: "0.875rem", boxSizing: "border-box" }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: C.text, marginBottom: "4px" }}>
                      Raw Files / Footage Link (Optional)
                    </label>
                    <input
                      placeholder="e.g. Raw footage Drive link"
                      value={form.rawFilesLink}
                      onChange={(e) => setForm({ ...form, rawFilesLink: e.target.value })}
                      style={{ width: "100%", padding: "0.5rem 0.75rem", border: `1px solid ${C.border}`, borderRadius: C.radiusSm, fontSize: "0.875rem", boxSizing: "border-box" }}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "0.5rem" }}>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    style={{
                      background: "#F3F4F6", color: "#374151", padding: "0.55rem 1.25rem",
                      borderRadius: C.radiusSm, border: "none", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer"
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    style={{
                      background: C.primary, color: "#fff", padding: "0.55rem 1.5rem",
                      borderRadius: C.radiusSm, border: "none", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer"
                    }}
                  >
                    {saving ? "Scheduling..." : "Create Job"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── QC Review Modal ── */}
        {showQCModal && selectedJob && (
          <div style={{
            position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)",
            backdropFilter: "blur(4px)", zIndex: 100, display: "flex",
            alignItems: "center", justifyContent: "center", padding: "1rem"
          }}>
            <div style={{
              background: C.card, borderRadius: C.radius, width: "100%", maxWidth: "480px",
              padding: "1.75rem", boxShadow: "0 20px 40px rgba(0,0,0,0.15)", border: `1px solid ${C.border}`
            }}>
              <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: C.text, margin: "0 0 4px" }}>
                Quality Check (QC) Review
              </h2>
              <p style={{ color: C.muted, fontSize: "0.85rem", margin: "0 0 1rem" }}>
                Job #{selectedJob.jobNumber}: {selectedJob.title}
              </p>

              <div style={{ display: "flex", gap: "10px", marginBottom: "1rem" }}>
                <button
                  type="button"
                  onClick={() => setQcAction("approve")}
                  style={{
                    flex: 1, padding: "0.6rem", borderRadius: C.radiusSm,
                    border: qcAction === "approve" ? "2px solid #059669" : `1px solid ${C.border}`,
                    background: qcAction === "approve" ? "#ECFDF5" : "#fff",
                    color: qcAction === "approve" ? "#059669" : C.text,
                    fontWeight: 700, fontSize: "0.85rem", cursor: "pointer"
                  }}
                >
                  ✓ Approve (Pass QC)
                </button>
                <button
                  type="button"
                  onClick={() => setQcAction("revision")}
                  style={{
                    flex: 1, padding: "0.6rem", borderRadius: C.radiusSm,
                    border: qcAction === "revision" ? "2px solid #DC2626" : `1px solid ${C.border}`,
                    background: qcAction === "revision" ? "#FEF2F2" : "#fff",
                    color: qcAction === "revision" ? "#DC2626" : C.text,
                    fontWeight: 700, fontSize: "0.85rem", cursor: "pointer"
                  }}
                >
                  ⚠ Request Revision
                </button>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: C.text, marginBottom: "4px" }}>
                  QC Feedback / Revision Notes
                </label>
                <textarea
                  rows={3}
                  placeholder={qcAction === "approve" ? "Looks great, ready for final delivery!" : "Color correction too saturated on image 12-40, please adjust shadows..."}
                  value={qcNotes}
                  onChange={(e) => setQcNotes(e.target.value)}
                  style={{ width: "100%", padding: "0.5rem 0.75rem", border: `1px solid ${C.border}`, borderRadius: C.radiusSm, fontSize: "0.875rem", boxSizing: "border-box" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "1.25rem" }}>
                <button
                  onClick={() => setShowQCModal(false)}
                  style={{ background: "#F3F4F6", color: "#374151", padding: "0.55rem 1.25rem", borderRadius: C.radiusSm, border: "none", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleQCReviewSubmit}
                  style={{
                    background: qcAction === "approve" ? "#059669" : "#DC2626",
                    color: "#fff", padding: "0.55rem 1.5rem", borderRadius: C.radiusSm, border: "none", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer"
                  }}
                >
                  Submit QC Verdict
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Set Progress Modal ── */}
        {showProgressModal && selectedJob && (
          <div style={{
            position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)",
            backdropFilter: "blur(4px)", zIndex: 100, display: "flex",
            alignItems: "center", justifyContent: "center", padding: "1rem"
          }}>
            <div style={{
              background: C.card, borderRadius: C.radius, width: "100%", maxWidth: "380px",
              padding: "1.5rem", boxShadow: "0 20px 40px rgba(0,0,0,0.15)", border: `1px solid ${C.border}`
            }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: C.text, margin: "0 0 4px" }}>Update Completed Images</h3>
              <p style={{ color: C.muted, fontSize: "0.8rem", margin: "0 0 1rem" }}>Total for job: {selectedJob.totalImages} images</p>

              <input
                type="number"
                min={0}
                max={selectedJob.totalImages}
                value={progressImages}
                onChange={(e) => setProgressImages(parseInt(e.target.value, 10) || 0)}
                style={{ width: "100%", padding: "0.6rem 0.75rem", border: `1px solid ${C.border}`, borderRadius: C.radiusSm, fontSize: "1.1rem", fontWeight: 700, textAlign: "center", boxSizing: "border-box" }}
              />

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "1.25rem" }}>
                <button
                  onClick={() => setShowProgressModal(false)}
                  style={{ background: "#F3F4F6", color: "#374151", padding: "0.5rem 1rem", borderRadius: C.radiusSm, border: "none", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleUpdateProgress(selectedJob.id, progressImages)}
                  style={{ background: C.primary, color: "#fff", padding: "0.5rem 1.25rem", borderRadius: C.radiusSm, border: "none", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer" }}
                >
                  Save Progress
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Deliverables & Drive Links Modal ── */}
        {showLinkModal && selectedJobForLink && (
          <div style={{
            position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)",
            backdropFilter: "blur(4px)", zIndex: 100, display: "flex",
            alignItems: "center", justifyContent: "center", padding: "1rem"
          }}>
            <div style={{
              background: C.card, borderRadius: C.radius, width: "100%", maxWidth: "520px",
              padding: "1.75rem", boxShadow: "0 20px 40px rgba(0,0,0,0.15)", border: `1px solid ${C.border}`
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
                <div>
                  <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: C.text, margin: 0 }}>
                    📁 Work Deliverables & Asset Links
                  </h2>
                  <p style={{ color: C.muted, fontSize: "0.82rem", margin: "3px 0 0" }}>
                    Job #{selectedJobForLink.jobNumber}: {selectedJobForLink.title}
                  </p>
                </div>
                <button
                  onClick={() => setShowLinkModal(false)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: C.muted }}
                >
                  <X size={18} />
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: C.text, marginBottom: "4px" }}>
                    🔗 Work Deliverables Link (Drive / Dropbox / WeTransfer) *
                  </label>
                  <p style={{ fontSize: "0.76rem", color: C.muted, margin: "0 0 6px" }}>
                    Paste the folder or preview link with your completed exports/photos/edits. Admins can open and review anytime.
                  </p>
                  <input
                    type="url"
                    placeholder="https://drive.google.com/drive/folders/..."
                    value={workLinkInput}
                    onChange={(e) => setWorkLinkInput(e.target.value)}
                    style={{
                      width: "100%", padding: "0.6rem 0.75rem", border: `1px solid ${C.border}`,
                      borderRadius: C.radiusSm, fontSize: "0.875rem", boxSizing: "border-box"
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: C.text, marginBottom: "4px" }}>
                    📥 Raw Files / Footage Link (Optional)
                  </label>
                  <p style={{ fontSize: "0.76rem", color: C.muted, margin: "0 0 6px" }}>
                    Source RAW photos or original camera footage provided by client.
                  </p>
                  <input
                    type="url"
                    placeholder="https://drive.google.com/drive/folders/... (Raw footage/assets)"
                    value={rawFilesLinkInput}
                    onChange={(e) => setRawFilesLinkInput(e.target.value)}
                    style={{
                      width: "100%", padding: "0.6rem 0.75rem", border: `1px solid ${C.border}`,
                      borderRadius: C.radiusSm, fontSize: "0.875rem", boxSizing: "border-box"
                    }}
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "0.5rem" }}>
                  <button
                    type="button"
                    onClick={() => setShowLinkModal(false)}
                    style={{
                      background: "#F3F4F6", color: "#374151", padding: "0.55rem 1.25rem",
                      borderRadius: C.radiusSm, border: "none", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer"
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveWorkLink}
                    disabled={savingLink}
                    style={{
                      background: C.primary, color: "#fff", padding: "0.55rem 1.5rem",
                      borderRadius: C.radiusSm, border: "none", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer"
                    }}
                  >
                    {savingLink ? "Saving Link..." : "Save Deliverables Link"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Admin Approval (OK) Modal ── */}
        {showApproveModal && selectedJobForApproval && (
          <div style={{
            position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)",
            backdropFilter: "blur(4px)", zIndex: 100, display: "flex",
            alignItems: "center", justifyContent: "center", padding: "1rem"
          }}>
            <div style={{
              background: C.card, borderRadius: C.radius, width: "100%", maxWidth: "500px",
              padding: "1.75rem", boxShadow: "0 20px 40px rgba(0,0,0,0.15)", border: `1px solid ${C.border}`
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "1rem" }}>
                <div style={{
                  width: "40px", height: "40px", borderRadius: "50%", background: "#ECFDF5",
                  display: "flex", alignItems: "center", justifyContent: "center", color: "#059669"
                }}>
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: C.text, margin: 0 }}>
                    Approve Deliverables (Work is OK)
                  </h2>
                  <p style={{ color: C.muted, fontSize: "0.82rem", margin: "2px 0 0" }}>
                    Job #{selectedJobForApproval.jobNumber}: {selectedJobForApproval.title}
                  </p>
                </div>
              </div>

              {/* Work link quick inspect banner */}
              {selectedJobForApproval.workLink && (
                <div style={{
                  background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: C.radiusSm,
                  padding: "0.75rem 1rem", marginBottom: "1.25rem", display: "flex",
                  justifyContent: "space-between", alignItems: "center"
                }}>
                  <div>
                    <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#166534", textTransform: "uppercase" }}>
                      Inspected Deliverable
                    </div>
                    <div style={{ fontSize: "0.82rem", color: "#15803D", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "280px", whiteSpace: "nowrap" }}>
                      {selectedJobForApproval.workLink}
                    </div>
                  </div>
                  <a
                    href={selectedJobForApproval.workLink.startsWith("http") ? selectedJobForApproval.workLink : `https://${selectedJobForApproval.workLink}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      background: "#16A34A", color: "#fff", textDecoration: "none",
                      padding: "4px 10px", borderRadius: "4px", fontSize: "0.78rem", fontWeight: 700,
                      display: "inline-flex", alignItems: "center", gap: "4px"
                    }}
                  >
                    <ExternalLink size={12} /> Open Link
                  </a>
                </div>
              )}

              <div style={{ marginBottom: "1.25rem" }}>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: C.text, marginBottom: "4px" }}>
                  Approval Feedback / Note (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Quality and color grade are approved. Ready to send to client!"
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  style={{
                    width: "100%", padding: "0.55rem 0.75rem", border: `1px solid ${C.border}`,
                    borderRadius: C.radiusSm, fontSize: "0.85rem", boxSizing: "border-box"
                  }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setShowApproveModal(false)}
                  style={{
                    background: "#F3F4F6", color: "#374151", padding: "0.55rem 1.25rem",
                    borderRadius: C.radiusSm, border: "none", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer"
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleApproveWork(selectedJobForApproval.id, approvalNotes)}
                  style={{
                    background: "#059669", color: "#fff", padding: "0.55rem 1.5rem",
                    borderRadius: C.radiusSm, border: "none", fontWeight: 700, fontSize: "0.85rem",
                    cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px"
                  }}
                >
                  <Check size={16} /> Confirm Approval (Mark OK)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Admin Request Revision (Not OK) Modal ── */}
        {showRevisionModal && selectedJobForRevision && (
          <div style={{
            position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)",
            backdropFilter: "blur(4px)", zIndex: 100, display: "flex",
            alignItems: "center", justifyContent: "center", padding: "1rem"
          }}>
            <div style={{
              background: C.card, borderRadius: C.radius, width: "100%", maxWidth: "520px",
              padding: "1.75rem", boxShadow: "0 20px 40px rgba(0,0,0,0.15)", border: `1px solid ${C.border}`
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "1rem" }}>
                <div style={{
                  width: "40px", height: "40px", borderRadius: "50%", background: "#FEF2F2",
                  display: "flex", alignItems: "center", justifyContent: "center", color: "#DC2626"
                }}>
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: C.text, margin: 0 }}>
                    Request Revision (Work is Not OK)
                  </h2>
                  <p style={{ color: C.muted, fontSize: "0.82rem", margin: "2px 0 0" }}>
                    Job #{selectedJobForRevision.jobNumber}: {selectedJobForRevision.title}
                  </p>
                </div>
              </div>

              <p style={{ fontSize: "0.82rem", color: C.muted, margin: "0 0 1rem" }}>
                Specify clearly what is not okay so the assigned editor ({selectedJobForRevision.assignedEditor?.name || "Editor"}) knows exactly what changes to make.
              </p>

              <div style={{ marginBottom: "1.25rem" }}>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: C.text, marginBottom: "4px" }}>
                  Revision Feedback / Change Instructions *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="e.g. Skin tones look overly yellow on reception photos. Please re-adjust white balance on shots 45-80 and re-upload link."
                  value={revisionFeedback}
                  onChange={(e) => setRevisionFeedback(e.target.value)}
                  style={{
                    width: "100%", padding: "0.6rem 0.75rem", border: "1.5px solid #FCA5A5",
                    borderRadius: C.radiusSm, fontSize: "0.875rem", boxSizing: "border-box"
                  }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setShowRevisionModal(false)}
                  style={{
                    background: "#F3F4F6", color: "#374151", padding: "0.55rem 1.25rem",
                    borderRadius: C.radiusSm, border: "none", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer"
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleRequestRevision(selectedJobForRevision.id, revisionFeedback)}
                  style={{
                    background: "#DC2626", color: "#fff", padding: "0.55rem 1.5rem",
                    borderRadius: C.radiusSm, border: "none", fontWeight: 700, fontSize: "0.85rem",
                    cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px"
                  }}
                >
                  <AlertTriangle size={15} /> Send Revision Notice (Flag Not OK)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Assign Editor & Task Folder (Raw Files) Modal ── */}
        {showAssignModal && selectedJobForAssign && (
          <div style={{
            position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)",
            backdropFilter: "blur(4px)", zIndex: 100, display: "flex",
            alignItems: "center", justifyContent: "center", padding: "1rem"
          }}>
            <div style={{
              background: C.card, borderRadius: C.radius, width: "100%", maxWidth: "520px",
              padding: "1.75rem", boxShadow: "0 20px 40px rgba(0,0,0,0.15)", border: `1px solid ${C.border}`
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
                <div>
                  <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: C.text, margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                    <FolderPlus size={20} color={C.primary} /> Assign Editor & Task Folder
                  </h2>
                  <p style={{ color: C.muted, fontSize: "0.82rem", margin: "3px 0 0" }}>
                    Job #{selectedJobForAssign.jobNumber}: {selectedJobForAssign.title}
                  </p>
                </div>
                <button
                  onClick={() => setShowAssignModal(false)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: C.muted }}
                >
                  <X size={18} />
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
                {/* Client & Service info banner */}
                <div style={{
                  background: "#F8FAFC", border: `1px solid ${C.border}`,
                  borderRadius: C.radiusSm, padding: "0.65rem 0.85rem", fontSize: "0.8rem", color: C.muted
                }}>
                  <div>Client: <strong style={{ color: C.text }}>{selectedJobForAssign.client?.companyName}</strong></div>
                  <div style={{ marginTop: "2px" }}>Service: <strong style={{ color: C.text }}>{selectedJobForAssign.serviceType}</strong> • Deadline: <strong style={{ color: "#DC2626" }}>{selectedJobForAssign.deadlineDate}</strong></div>
                </div>

                {/* Editor Dropdown */}
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: C.text, marginBottom: "4px" }}>
                    Assign Editor *
                  </label>
                  <select
                    value={assignEditorId}
                    onChange={(e) => setAssignEditorId(e.target.value)}
                    style={{
                      width: "100%", padding: "0.6rem 0.75rem", border: `1px solid ${C.border}`,
                      borderRadius: C.radiusSm, fontSize: "0.875rem", background: "#FFFFFF", boxSizing: "border-box"
                    }}
                  >
                    <option value="">⚠️ Unassigned</option>
                    {teamMembers
                      .filter((u: any) => {
                        const r = (u.role || "").toUpperCase();
                        if (selectedJobForAssign.category === "VIDEO") return r.includes("VIDEO");
                        return r.includes("PHOTO") || (!r.includes("VIDEO") && (r.includes("EDITOR") || r.includes("PRODUCTION")));
                      })
                      .map((u: any) => (
                        <option key={u.id} value={u.id}>
                          {u.name || u.email} ({u.role})
                        </option>
                      ))}
                  </select>
                </div>

                {/* Raw Files / Task Folder Link */}
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: C.text, marginBottom: "4px" }}>
                    📂 Put Raw Files Link in Task Folder
                  </label>
                  <p style={{ fontSize: "0.76rem", color: C.muted, margin: "0 0 6px" }}>
                    Paste Google Drive, Dropbox, OneDrive, or local folder link with raw photos/footage for the editor.
                  </p>
                  <input
                    type="url"
                    placeholder="https://drive.google.com/drive/folders/... (Raw footage or photos folder)"
                    value={assignRawFilesLink}
                    onChange={(e) => setAssignRawFilesLink(e.target.value)}
                    style={{
                      width: "100%", padding: "0.6rem 0.75rem", border: `1.5px solid ${assignRawFilesLink ? "#16A34A" : C.border}`,
                      borderRadius: C.radiusSm, fontSize: "0.875rem", boxSizing: "border-box"
                    }}
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "0.5rem" }}>
                  <button
                    type="button"
                    onClick={() => setShowAssignModal(false)}
                    style={{
                      background: "#F3F4F6", color: "#374151", padding: "0.55rem 1.25rem",
                      borderRadius: C.radiusSm, border: "none", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer"
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmAssignment}
                    disabled={savingAssign}
                    style={{
                      background: C.primary, color: "#fff", padding: "0.55rem 1.5rem",
                      borderRadius: C.radiusSm, border: "none", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer"
                    }}
                  >
                    {savingAssign ? "Saving..." : "Save Assignment & Link"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Task Folder / Raw Files Link Modal ── */}
        {showRawLinkModal && selectedJobForRawLink && (
          <div style={{
            position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)",
            backdropFilter: "blur(4px)", zIndex: 100, display: "flex",
            alignItems: "center", justifyContent: "center", padding: "1rem"
          }}>
            <div style={{
              background: C.card, borderRadius: C.radius, width: "100%", maxWidth: "500px",
              padding: "1.75rem", boxShadow: "0 20px 40px rgba(0,0,0,0.15)", border: `1px solid ${C.border}`
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
                <div>
                  <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: C.text, margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                    <Folder size={20} color="#16A34A" /> Task Folder / Raw Files Link
                  </h2>
                  <p style={{ color: C.muted, fontSize: "0.82rem", margin: "3px 0 0" }}>
                    Job #{selectedJobForRawLink.jobNumber}: {selectedJobForRawLink.title}
                  </p>
                </div>
                <button
                  onClick={() => setShowRawLinkModal(false)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: C.muted }}
                >
                  <X size={18} />
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: C.text, marginBottom: "4px" }}>
                    📂 Raw Files Folder Link (Drive / Dropbox / OneDrive) *
                  </label>
                  <p style={{ fontSize: "0.76rem", color: C.muted, margin: "0 0 6px" }}>
                    Put the cloud storage link where the unedited original RAW photos or video footage is located. The assigned editor will use this to download all raw assets.
                  </p>
                  <input
                    type="url"
                    placeholder="https://drive.google.com/drive/folders/..."
                    value={rawLinkInput}
                    onChange={(e) => setRawLinkInput(e.target.value)}
                    style={{
                      width: "100%", padding: "0.6rem 0.75rem", border: `1px solid ${C.border}`,
                      borderRadius: C.radiusSm, fontSize: "0.875rem", boxSizing: "border-box"
                    }}
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "0.5rem" }}>
                  <button
                    type="button"
                    onClick={() => setShowRawLinkModal(false)}
                    style={{
                      background: "#F3F4F6", color: "#374151", padding: "0.55rem 1.25rem",
                      borderRadius: C.radiusSm, border: "none", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer"
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveRawLink}
                    disabled={savingRawLink}
                    style={{
                      background: "#16A34A", color: "#fff", padding: "0.55rem 1.5rem",
                      borderRadius: C.radiusSm, border: "none", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer"
                    }}
                  >
                    {savingRawLink ? "Saving..." : "Save Task Folder Link"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </RoleGuard>
  );
}
