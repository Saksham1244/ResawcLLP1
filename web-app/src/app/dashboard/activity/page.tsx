"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Clock, Search, Filter, Film, Receipt, TrendingUp,
  CalendarCheck, User, Plus, RefreshCw, Send, CheckCircle2,
  FileText, Sparkles, Building2, ArrowUpRight
} from "lucide-react";
import { useRole } from "@/context/RoleContext";
import { RoleGuard } from "@/components/RoleGuard";

const C = {
  bg: "#F5F7FB",
  card: "#FFFFFF",
  border: "#E5E7EB",
  primary: "#1A56DB",
  text: "#111827",
  muted: "#6B7280",
  success: "#059669",
  warning: "#D97706",
  danger: "#DC2626",
  radius: "10px",
  radiusSm: "6px",
};

export default function ActivityLogPage() {
  const { user } = useRole();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ALL");

  // Quick milestone note
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteForm, setNoteForm] = useState({
    description: "",
    category: "GENERAL",
    action: "NOTE_ADDED",
  });
  const [submittingNote, setSubmittingNote] = useState(false);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (category !== "ALL") params.set("category", category);
      if (search) params.set("search", search);

      const token = localStorage.getItem("token");
      const res = await fetch(`/api/activity-logs?${params.toString()}`, {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      const json = await res.json();
      if (json.success) {
        setLogs(json.data || []);
      }
    } catch (err) {
      console.error("Error fetching activity logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [category]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs();
  };

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteForm.description.trim()) return;
    try {
      setSubmittingNote(true);
      const token = localStorage.getItem("token");
      const res = await fetch("/api/activity-logs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          userId: user?.id,
          userName: user?.name || "Admin",
          userRole: user?.role || "ADMIN",
          action: noteForm.action,
          category: noteForm.category,
          description: noteForm.description,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setShowNoteModal(false);
        setNoteForm({ description: "", category: "GENERAL", action: "NOTE_ADDED" });
        fetchLogs();
      }
    } catch (err) {
      console.error("Error creating note:", err);
    } finally {
      setSubmittingNote(false);
    }
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case "FINANCE": return <Receipt size={16} />;
      case "PROJECTS": return <Film size={16} />;
      case "MARKETING": return <TrendingUp size={16} />;
      case "HR": return <CalendarCheck size={16} />;
      default: return <Clock size={16} />;
    }
  };

  const getCategoryStyle = (cat: string) => {
    switch (cat) {
      case "FINANCE": return { bg: "#ECFDF5", color: C.success };
      case "PROJECTS": return { bg: "#EFF6FF", color: C.primary };
      case "MARKETING": return { bg: "#FAF5FF", color: "#7C3AED" };
      case "HR": return { bg: "#FFFBEB", color: C.warning };
      default: return { bg: "#F3F4F6", color: C.muted };
    }
  };

  return (
    <RoleGuard allowedRoles={["admin"]}>
      <div style={{ maxWidth: 1200, margin: "0 auto", paddingBottom: "60px" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginBottom: "24px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ padding: "8px", background: "#EFF6FF", borderRadius: "8px", color: C.primary }}>
                <Clock size={24} />
              </div>
              <h1 style={{ fontSize: "24px", fontWeight: 800, color: C.text, margin: 0 }}>
                Centralized Activity Timeline & Audit Trail
              </h1>
            </div>
            <p style={{ margin: "4px 0 0", fontSize: "14px", color: C.muted }}>
              Chronological log of editing jobs, invoices, payments, client communications, and team activities
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <button
              onClick={() => setShowNoteModal(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 16px",
                borderRadius: C.radiusSm,
                background: C.primary,
                color: "#fff",
                border: "none",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <Plus size={15} /> Log Operational Note
            </button>
            <button
              onClick={fetchLogs}
              title="Refresh timeline"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 14px",
                borderRadius: C.radiusSm,
                border: `1px solid ${C.border}`,
                background: "#fff",
                color: C.text,
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              <RefreshCw size={14} /> Refresh
            </button>
          </div>
        </div>

        {/* Filter Bar & Search */}
        <div style={{ background: C.card, borderRadius: C.radius, border: `1px solid ${C.border}`, padding: "16px", marginBottom: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
            {/* Category Filter Chips */}
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {[
                { label: "All Activity", value: "ALL" },
                { label: "Production & Jobs", value: "PROJECTS" },
                { label: "Finance & Invoices", value: "FINANCE" },
                { label: "Marketing & Leads", value: "MARKETING" },
                { label: "HR & Attendance", value: "HR" },
              ].map((f) => (
                <button
                  key={f.value}
                  onClick={() => setCategory(f.value)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "20px",
                    border: category === f.value ? `1px solid ${C.primary}` : `1px solid ${C.border}`,
                    background: category === f.value ? "#EFF6FF" : "#fff",
                    color: category === f.value ? C.primary : C.muted,
                    fontSize: "13px",
                    fontWeight: category === f.value ? 700 : 500,
                    cursor: "pointer",
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Search */}
            <form onSubmit={handleSearch} style={{ display: "flex", gap: "8px" }}>
              <div style={{ position: "relative" }}>
                <Search size={14} color={C.muted} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)" }} />
                <input
                  type="text"
                  placeholder="Search actions, clients..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{
                    padding: "6px 12px 6px 32px",
                    borderRadius: C.radiusSm,
                    border: `1px solid ${C.border}`,
                    fontSize: "13px",
                    width: "220px",
                  }}
                />
              </div>
              <button
                type="submit"
                style={{
                  padding: "6px 12px",
                  background: "#F3F4F6",
                  border: `1px solid ${C.border}`,
                  borderRadius: C.radiusSm,
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                Search
              </button>
            </form>
          </div>
        </div>

        {/* Timeline Stream */}
        <div style={{ background: C.card, borderRadius: C.radius, border: `1px solid ${C.border}`, padding: "24px" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: C.muted }}>
              <div style={{ width: 28, height: 28, border: `3px solid ${C.border}`, borderTopColor: C.primary, borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 10px" }} />
              <p style={{ fontSize: "13px" }}>Loading activity stream...</p>
            </div>
          ) : logs.length === 0 ? (
            <div style={{ textAlign: "center", padding: "50px 0", color: C.muted }}>
              <Clock size={40} style={{ margin: "0 auto 12px", opacity: 0.5 }} />
              <h3 style={{ margin: "0 0 6px", fontSize: "16px", color: C.text }}>No Activity Found</h3>
              <p style={{ margin: 0, fontSize: "13px" }}>Try selecting another category filter or search keyword.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {logs.map((log: any) => {
                const style = getCategoryStyle(log.category);
                return (
                  <div key={log.id} style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
                    {/* Category Icon Badge */}
                    <div style={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      background: style.bg,
                      color: style.color,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      marginTop: "2px",
                    }}>
                      {getCategoryIcon(log.category)}
                    </div>

                    {/* Timeline Content */}
                    <div style={{ flex: 1, paddingBottom: "20px", borderBottom: `1px solid ${C.border}` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontSize: "13px", fontWeight: 700, color: C.text }}>
                            {log.userName || "System"}
                          </span>
                          <span style={{ fontSize: "11px", padding: "2px 6px", background: "#F3F4F6", color: C.muted, borderRadius: "4px" }}>
                            {log.userRole || "ADMIN"}
                          </span>
                          {log.client && (
                            <Link
                              href={`/dashboard/clients`}
                              style={{ display: "inline-flex", alignItems: "center", gap: "3px", fontSize: "12px", fontWeight: 600, color: C.primary, textDecoration: "none" }}
                            >
                              <Building2 size={12} /> {log.client.companyName}
                            </Link>
                          )}
                        </div>

                        <span style={{ fontSize: "12px", color: C.muted }}>
                          {new Date(log.createdAt).toLocaleString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>

                      <p style={{ margin: "6px 0 0", fontSize: "14px", color: C.text, lineHeight: 1.4 }}>
                        {log.description}
                      </p>

                      {log.entityTitle && (
                        <div style={{ marginTop: "6px", display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 600, color: C.primary, background: "#EFF6FF", padding: "2px 8px", borderRadius: "4px" }}>
                          Reference: {log.entityTitle}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal: Log Milestone Note */}
        {showNoteModal && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)", backdropFilter: "blur(4px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
            <div style={{ background: C.card, borderRadius: C.radius, width: "100%", maxWidth: "500px", padding: "24px", boxShadow: "0 20px 40px rgba(0,0,0,0.15)", border: `1px solid ${C.border}` }}>
              <h3 style={{ margin: "0 0 16px", fontSize: "18px", fontWeight: 700, color: C.text }}>Log Operational Milestone / Note</h3>
              <form onSubmit={handleCreateNote}>
                <div style={{ marginBottom: "16px" }}>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: C.text, marginBottom: "4px" }}>Category</label>
                  <select
                    value={noteForm.category}
                    onChange={(e) => setNoteForm({ ...noteForm, category: e.target.value })}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: C.radiusSm, border: `1px solid ${C.border}`, fontSize: "14px" }}
                  >
                    <option value="GENERAL">General Operational Note</option>
                    <option value="PROJECTS">Production & Editing</option>
                    <option value="FINANCE">Finance & Client Billing</option>
                    <option value="MARKETING">Marketing & Client Acquisition</option>
                    <option value="HR">HR & Team Operations</option>
                  </select>
                </div>

                <div style={{ marginBottom: "20px" }}>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: C.text, marginBottom: "4px" }}>Description / Details</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Describe the milestone or activity..."
                    value={noteForm.description}
                    onChange={(e) => setNoteForm({ ...noteForm, description: e.target.value })}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: C.radiusSm, border: `1px solid ${C.border}`, fontSize: "14px", boxSizing: "border-box" }}
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                  <button
                    type="button"
                    onClick={() => setShowNoteModal(false)}
                    style={{ padding: "8px 16px", background: "#F3F4F6", border: "none", borderRadius: C.radiusSm, fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingNote}
                    style={{ padding: "8px 20px", background: C.primary, color: "#fff", border: "none", borderRadius: C.radiusSm, fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
                  >
                    {submittingNote ? "Logging..." : "Save Milestone"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
