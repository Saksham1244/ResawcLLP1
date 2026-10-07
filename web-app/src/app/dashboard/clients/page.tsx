"use client";

import { useState, useEffect } from "react";
import {
  Building2, Plus, Search, Filter, Mail, Phone, MapPin, Globe,
  Briefcase, CheckCircle2, Clock, AlertCircle, X, ChevronRight,
  MoreVertical, Trash2, Edit3, ArrowUpRight
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

type Client = {
  id: string;
  clientId: string;
  companyName: string;
  contactPerson: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  country?: string | null;
  currency: string;
  paymentTerms?: string | null;
  status: string;
  notes?: string | null;
  assignedMarketing?: { id: string; name: string; email: string } | null;
  _count?: { editingJobs: number };
  createdAt: string;
};

const STATUS_TABS = [
  { label: "All Clients", value: "ALL" },
  { label: "Active", value: "ACTIVE" },
  { label: "Trial", value: "TRIAL" },
  { label: "Lead", value: "LEAD" },
  { label: "Contacted", value: "CONTACTED" },
  { label: "On Hold", value: "ON_HOLD" },
  { label: "Inactive", value: "INACTIVE" },
];

const STATUS_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  ACTIVE: { bg: "#ECFDF5", color: "#059669", border: "#A7F3D0" },
  TRIAL: { bg: "#EFF6FF", color: "#1D4ED8", border: "#BFDBFE" },
  LEAD: { bg: "#F3F4F6", color: "#4B5563", border: "#E5E7EB" },
  CONTACTED: { bg: "#FAF5FF", color: "#7C3AED", border: "#E9D5FF" },
  ON_HOLD: { bg: "#FFFBEB", color: "#D97706", border: "#FDE68A" },
  INACTIVE: { bg: "#FEF2F2", color: "#DC2626", border: "#FECACA" },
};

export default function ClientsPage() {
  const { user } = useRole();
  const isAdmin = user?.role === "admin";

  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("ALL");
  const [teamMembers, setTeamMembers] = useState<{ id: string; name: string; role: string }[]>([]);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [clientJobs, setClientJobs] = useState<any[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(false);

  // Form state
  const [form, setForm] = useState({
    companyName: "",
    contactPerson: "",
    phone: "",
    email: "",
    address: "",
    country: "India",
    currency: "INR",
    paymentTerms: "Due on Receipt",
    status: "ACTIVE",
    notes: "",
    assignedMarketingId: "",
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const fetchClients = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (activeTab !== "ALL") params.set("status", activeTab);
      if (search) params.set("search", search);

      const qs = params.toString();
      const endpoint = `/api/clients${qs ? `?${qs}` : ""}`;

      const res = await fetch(endpoint);
      const data = await res.json();
      if (data.success) {
        setClients(data.data);
      } else {
        console.warn("Clients fetch warning:", data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeam = async () => {
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      if (data.success) {
        setTeamMembers(data.data);
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchClients();
  }, [activeTab, search, user?.id, user?.role]);

  useEffect(() => {
    fetchTeam();
  }, [user?.id]);

  const openClientDetail = async (client: Client) => {
    setSelectedClient(client);
    setShowDetailModal(true);
    setLoadingJobs(true);
    try {
      const res = await fetch(`/api/clients?id=${client.id}`);
      const data = await res.json();
      if (data.success && data.data.editingJobs) {
        setClientJobs(data.data.editingJobs);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingJobs(false);
    }
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.companyName || !form.contactPerson) {
      setFormError("Company name and contact person are required.");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setShowAddModal(false);
        setForm({
          companyName: "",
          contactPerson: "",
          phone: "",
          email: "",
          address: "",
          country: "India",
          currency: "INR",
          paymentTerms: "Due on Receipt",
          status: "ACTIVE",
          notes: "",
          assignedMarketingId: "",
        });
        fetchClients();
      } else {
        setFormError(data.error || "Failed to create client");
      }
    } catch (err) {
      setFormError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClient = async (id: string) => {
    if (!confirm("Are you sure you want to delete this client and all their jobs?")) return;
    try {
      const res = await fetch(`/api/clients?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        fetchClients();
        if (showDetailModal) setShowDetailModal(false);
      }
    } catch (e) {
      alert("Failed to delete client.");
    }
  };

  return (
    <RoleGuard allowedRoles={["admin", "marketing"]}>
      <div style={{ maxWidth: "1280px", margin: "0 auto", paddingBottom: "3rem" }}>
        
        {/* ── Header ── */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "flex-start",
          marginBottom: "1.75rem", flexWrap: "wrap", gap: "1rem"
        }}>
          <div>
            <h1 style={{ fontSize: "1.65rem", fontWeight: 800, color: C.text, letterSpacing: "-0.03em", margin: "0 0 4px" }}>
              Client Management
            </h1>
            <p style={{ color: C.muted, fontSize: "0.9rem", margin: 0 }}>
              Profiles, service contracts, assigned teams, and editing job histories
            </p>
          </div>

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
            <Plus size={16} /> Add Client
          </button>
        </div>

        {/* ── Tabs & Search ── */}
        <div style={{
          background: C.card, borderRadius: C.radius, border: `1px solid ${C.border}`,
          padding: "1rem 1.25rem", marginBottom: "1.25rem",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          flexWrap: "wrap", gap: "1rem"
        }}>
          {/* Status Tabs */}
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {STATUS_TABS.map((tab) => {
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
              placeholder="Search company, contact, ID..."
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

        {/* ── Client Cards / Table ── */}
        <div style={{
          background: C.card, borderRadius: C.radius, border: `1px solid ${C.border}`,
          overflow: "hidden"
        }}>
          {loading ? (
            <div style={{ padding: "4rem 2rem", textAlign: "center", color: C.muted }}>
              Loading clients...
            </div>
          ) : clients.length === 0 ? (
            <div style={{ padding: "4rem 2rem", textAlign: "center" }}>
              <div style={{
                width: "56px", height: "56px", borderRadius: "50%", background: "#EFF6FF",
                display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: "1rem"
              }}>
                <Building2 size={26} color={C.primary} />
              </div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: C.text, margin: "0 0 6px" }}>No clients found</h3>
              <p style={{ color: C.muted, fontSize: "0.875rem", margin: "0 0 1.25rem" }}>
                Add your first client or convert from a lead to get started.
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                style={{
                  background: C.primary, color: "#fff", padding: "0.55rem 1.2rem",
                  borderRadius: C.radiusSm, border: "none", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer"
                }}
              >
                + Add Client
              </button>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
                <thead>
                  <tr style={{ background: "#F9FAFB", borderBottom: `1px solid ${C.border}`, color: C.muted, textAlign: "left" }}>
                    <th style={{ padding: "0.85rem 1.25rem", fontWeight: 600 }}>Client ID</th>
                    <th style={{ padding: "0.85rem 1.25rem", fontWeight: 600 }}>Company & Contact</th>
                    <th style={{ padding: "0.85rem 1.25rem", fontWeight: 600 }}>Status</th>
                    <th style={{ padding: "0.85rem 1.25rem", fontWeight: 600 }}>Phone / Terms</th>
                    <th style={{ padding: "0.85rem 1.25rem", fontWeight: 600 }}>Account Manager</th>
                    <th style={{ padding: "0.85rem 1.25rem", fontWeight: 600 }}>Jobs</th>
                    <th style={{ padding: "0.85rem 1.25rem", fontWeight: 600, textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map((c, i) => {
                    const st = STATUS_COLORS[c.status] || STATUS_COLORS.ACTIVE;
                    return (
                      <tr
                        key={c.id}
                        style={{
                          borderBottom: i === clients.length - 1 ? "none" : `1px solid ${C.border}`,
                          transition: "background 0.15s ease",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#F8FAFC")}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                      >
                        {/* ID */}
                        <td style={{ padding: "1rem 1.25rem", verticalAlign: "middle" }}>
                          <span style={{
                            fontWeight: 700, fontSize: "0.8rem", color: C.primary,
                            background: "#EFF6FF", padding: "3px 8px", borderRadius: "6px"
                          }}>
                            {c.clientId}
                          </span>
                        </td>

                        {/* Company & Contact */}
                        <td style={{ padding: "1rem 1.25rem", verticalAlign: "middle" }}>
                          <div style={{ fontWeight: 700, color: C.text, fontSize: "0.95rem" }}>
                            {c.companyName}
                          </div>
                          <div style={{ color: C.muted, fontSize: "0.8rem", marginTop: "2px", display: "flex", gap: "8px" }}>
                            <span>{c.contactPerson}</span>
                            {c.email && <span>• {c.email}</span>}
                          </div>
                        </td>

                        {/* Status */}
                        <td style={{ padding: "1rem 1.25rem", verticalAlign: "middle" }}>
                          <span style={{
                            display: "inline-block", padding: "0.25rem 0.65rem",
                            borderRadius: "999px", fontSize: "0.75rem", fontWeight: 700,
                            background: st.bg, color: st.color, border: `1px solid ${st.border}`
                          }}>
                            {c.status}
                          </span>
                        </td>

                        {/* Phone / Terms */}
                        <td style={{ padding: "1rem 1.25rem", verticalAlign: "middle", color: C.text }}>
                          <div style={{ fontWeight: 600, fontSize: "0.85rem" }}>{c.phone || "—"}</div>
                          <div style={{ color: C.muted, fontSize: "0.78rem" }}>{c.paymentTerms || "Due on Receipt"} (INR ₹)</div>
                        </td>

                        {/* Account Manager */}
                        <td style={{ padding: "1rem 1.25rem", verticalAlign: "middle" }}>
                          {c.assignedMarketing ? (
                            <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "#374151" }}>
                              {c.assignedMarketing.name}
                            </span>
                          ) : (
                            <span style={{ fontSize: "0.8rem", color: "#9CA3AF" }}>Unassigned</span>
                          )}
                        </td>

                        {/* Jobs Count */}
                        <td style={{ padding: "1rem 1.25rem", verticalAlign: "middle" }}>
                          <span style={{
                            display: "inline-flex", alignItems: "center", gap: "4px",
                            fontWeight: 700, color: "#0F172A", background: "#F1F5F9",
                            padding: "3px 10px", borderRadius: "999px", fontSize: "0.8rem"
                          }}>
                            <Briefcase size={13} color={C.muted} />
                            {c._count?.editingJobs || 0}
                          </span>
                        </td>

                        {/* Actions */}
                        <td style={{ padding: "1rem 1.25rem", verticalAlign: "middle", textAlign: "right" }}>
                          <div style={{ display: "inline-flex", gap: "8px", alignItems: "center" }}>
                            <a
                              href={`/dashboard/clients/${c.id}`}
                              title="Open Client 360° Profile"
                              style={{
                                display: "inline-flex", alignItems: "center", gap: "4px",
                                background: "#EFF6FF", color: C.primary,
                                padding: "0.35rem 0.75rem", borderRadius: C.radiusSm,
                                border: "1px solid #BFDBFE", fontSize: "0.78rem", fontWeight: 700,
                                textDecoration: "none", cursor: "pointer"
                              }}
                            >
                              360° View <ArrowUpRight size={13} />
                            </a>
                            <button
                              onClick={() => openClientDetail(c)}
                              title="Quick Preview"
                              style={{
                                display: "inline-flex", alignItems: "center", gap: "4px",
                                background: "#F3F4F6", color: "#374151",
                                padding: "0.35rem 0.65rem", borderRadius: C.radiusSm,
                                border: "1px solid #E5E7EB", fontSize: "0.78rem", fontWeight: 600,
                                cursor: "pointer"
                              }}
                            >
                              Quick <ChevronRight size={13} />
                            </button>
                            {isAdmin && (
                              <button
                                onClick={() => handleDeleteClient(c.id)}
                                title="Delete Client"
                                style={{
                                  background: "#FEF2F2", color: "#DC2626",
                                  padding: "0.35rem 0.55rem", borderRadius: C.radiusSm,
                                  border: "1px solid #FECACA", cursor: "pointer"
                                }}
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
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

        {/* ── Add Client Modal ── */}
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
                  <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: C.text, margin: 0 }}>Add New Client</h2>
                  <p style={{ color: C.muted, fontSize: "0.8rem", margin: "2px 0 0" }}>Set up client profile and business terms</p>
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

              <form onSubmit={handleCreateClient} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: C.text, marginBottom: "4px" }}>Company Name *</label>
                    <input
                      required
                      placeholder="e.g. ABC Photography"
                      value={form.companyName}
                      onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                      style={{ width: "100%", padding: "0.5rem 0.75rem", border: `1px solid ${C.border}`, borderRadius: C.radiusSm, fontSize: "0.875rem", boxSizing: "border-box" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: C.text, marginBottom: "4px" }}>Contact Person *</label>
                    <input
                      required
                      placeholder="e.g. John Doe"
                      value={form.contactPerson}
                      onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
                      style={{ width: "100%", padding: "0.5rem 0.75rem", border: `1px solid ${C.border}`, borderRadius: C.radiusSm, fontSize: "0.875rem", boxSizing: "border-box" }}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: C.text, marginBottom: "4px" }}>Email</label>
                    <input
                      type="email"
                      placeholder="client@example.com"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      style={{ width: "100%", padding: "0.5rem 0.75rem", border: `1px solid ${C.border}`, borderRadius: C.radiusSm, fontSize: "0.875rem", boxSizing: "border-box" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: C.text, marginBottom: "4px" }}>Phone</label>
                    <input
                      placeholder="+91 / +1 ..."
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      style={{ width: "100%", padding: "0.5rem 0.75rem", border: `1px solid ${C.border}`, borderRadius: C.radiusSm, fontSize: "0.875rem", boxSizing: "border-box" }}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: C.text, marginBottom: "4px" }}>Status</label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value })}
                      style={{ width: "100%", padding: "0.5rem 0.75rem", border: `1px solid ${C.border}`, borderRadius: C.radiusSm, fontSize: "0.875rem", background: "#fff" }}
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="TRIAL">Trial</option>
                      <option value="LEAD">Lead</option>
                      <option value="CONTACTED">Contacted</option>
                      <option value="ON_HOLD">On Hold</option>
                      <option value="INACTIVE">Inactive</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: C.text, marginBottom: "4px" }}>Payment Terms</label>
                    <input
                      placeholder="Due on Receipt / Net 15"
                      value={form.paymentTerms}
                      onChange={(e) => setForm({ ...form, paymentTerms: e.target.value })}
                      style={{ width: "100%", padding: "0.5rem 0.75rem", border: `1px solid ${C.border}`, borderRadius: C.radiusSm, fontSize: "0.875rem", boxSizing: "border-box" }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: C.text, marginBottom: "4px" }}>Assigned Marketing Person</label>
                  <select
                    value={form.assignedMarketingId}
                    onChange={(e) => setForm({ ...form, assignedMarketingId: e.target.value })}
                    style={{ width: "100%", padding: "0.5rem 0.75rem", border: `1px solid ${C.border}`, borderRadius: C.radiusSm, fontSize: "0.875rem", background: "#fff" }}
                  >
                    <option value="">None / Unassigned</option>
                    {teamMembers.map((m) => (
                      <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: C.text, marginBottom: "4px" }}>Address / Notes</label>
                  <textarea
                    rows={2}
                    placeholder="Studio location or special workflow instructions..."
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    style={{ width: "100%", padding: "0.5rem 0.75rem", border: `1px solid ${C.border}`, borderRadius: C.radiusSm, fontSize: "0.875rem", boxSizing: "border-box" }}
                  />
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
                    {saving ? "Saving..." : "Create Client"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── Client 360 Detail Modal ── */}
        {showDetailModal && selectedClient && (
          <div style={{
            position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)",
            backdropFilter: "blur(4px)", zIndex: 100, display: "flex",
            alignItems: "center", justifyContent: "center", padding: "1rem"
          }}>
            <div style={{
              background: C.card, borderRadius: C.radius, width: "100%", maxWidth: "780px",
              maxHeight: "90vh", overflowY: "auto", padding: "2rem",
              boxShadow: "0 20px 40px rgba(0,0,0,0.15)", border: `1px solid ${C.border}`
            }}>
              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                    <span style={{
                      fontWeight: 800, fontSize: "0.85rem", color: C.primary,
                      background: "#EFF6FF", padding: "3px 10px", borderRadius: "6px"
                    }}>
                      {selectedClient.clientId}
                    </span>
                    <h2 style={{ fontSize: "1.4rem", fontWeight: 800, color: C.text, margin: 0 }}>
                      {selectedClient.companyName}
                    </h2>
                  </div>
                  <p style={{ color: C.muted, fontSize: "0.85rem", margin: 0 }}>
                    Contact Person: <strong style={{ color: C.text }}>{selectedClient.contactPerson}</strong>
                  </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <a
                    href={`/dashboard/clients/${selectedClient.id}`}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: "6px",
                      background: C.primary, color: "#fff", padding: "0.45rem 0.9rem",
                      borderRadius: C.radiusSm, fontSize: "0.82rem", fontWeight: 700,
                      textDecoration: "none",
                    }}
                  >
                    Open 360° Profile <ArrowUpRight size={14} />
                  </a>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    style={{ background: "none", border: "none", cursor: "pointer", color: C.muted }}
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Info Tiles */}
              <div style={{
                display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px",
                marginBottom: "1.5rem"
              }}>
                <div style={{ background: "#F8FAFC", padding: "0.75rem", borderRadius: "8px", border: `1px solid ${C.border}` }}>
                  <div style={{ fontSize: "0.75rem", color: C.muted, fontWeight: 600 }}>Currency</div>
                  <div style={{ fontSize: "1rem", fontWeight: 700, color: C.text, marginTop: "2px" }}>INR (₹)</div>
                </div>
                <div style={{ background: "#F8FAFC", padding: "0.75rem", borderRadius: "8px", border: `1px solid ${C.border}` }}>
                  <div style={{ fontSize: "0.75rem", color: C.muted, fontWeight: 600 }}>Payment Terms</div>
                  <div style={{ fontSize: "0.85rem", fontWeight: 700, color: C.text, marginTop: "2px" }}>{selectedClient.paymentTerms || "Due on Receipt"}</div>
                </div>
                <div style={{ background: "#F8FAFC", padding: "0.75rem", borderRadius: "8px", border: `1px solid ${C.border}` }}>
                  <div style={{ fontSize: "0.75rem", color: C.muted, fontWeight: 600 }}>Total Jobs</div>
                  <div style={{ fontSize: "1rem", fontWeight: 700, color: C.primary, marginTop: "2px" }}>{clientJobs.length}</div>
                </div>
              </div>

              {/* Contact info list */}
              <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", fontSize: "0.85rem", color: "#374151", marginBottom: "1.5rem" }}>
                {selectedClient.email && (
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <Mail size={14} color={C.muted} /> {selectedClient.email}
                  </div>
                )}
                {selectedClient.phone && (
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <Phone size={14} color={C.muted} /> {selectedClient.phone}
                  </div>
                )}
                {selectedClient.address && (
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <MapPin size={14} color={C.muted} /> {selectedClient.address}
                  </div>
                )}
              </div>

              {/* Editing Jobs list */}
              <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: "1.25rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                  <h3 style={{ fontSize: "1rem", fontWeight: 700, color: C.text, margin: 0 }}>
                    Editing Jobs ({clientJobs.length})
                  </h3>
                  <a
                    href="/dashboard/jobs"
                    style={{ fontSize: "0.8rem", color: C.primary, fontWeight: 600, textDecoration: "none" }}
                  >
                    Go to Jobs Board →
                  </a>
                </div>

                {loadingJobs ? (
                  <div style={{ padding: "1.5rem", textAlign: "center", color: C.muted, fontSize: "0.85rem" }}>
                    Loading jobs history...
                  </div>
                ) : clientJobs.length === 0 ? (
                  <div style={{ padding: "1.5rem", textAlign: "center", color: C.muted, fontSize: "0.85rem", background: "#F9FAFB", borderRadius: "8px" }}>
                    No editing jobs recorded yet for this client.
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {clientJobs.map((j) => (
                      <div
                        key={j.id}
                        style={{
                          display: "flex", justifyContent: "space-between", alignItems: "center",
                          padding: "0.75rem 1rem", background: "#F8FAFC", borderRadius: "8px",
                          border: `1px solid ${C.border}`, fontSize: "0.85rem"
                        }}
                      >
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{ fontWeight: 700, color: C.primary, fontSize: "0.8rem" }}>{j.jobNumber}</span>
                            <span style={{ fontWeight: 600, color: C.text }}>{j.title}</span>
                            <span style={{ fontSize: "0.75rem", color: C.muted }}>({j.serviceType})</span>
                          </div>
                          <div style={{ fontSize: "0.75rem", color: C.muted, marginTop: "3px" }}>
                            Editor: {j.assignedEditor?.name || "Unassigned"} • Deadline: {j.deadlineDate}
                          </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          {j.totalImages > 0 && (
                            <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#0F172A" }}>
                              {j.completedImages} / {j.totalImages} imgs
                            </span>
                          )}
                          <span style={{
                            padding: "2px 8px", borderRadius: "999px", fontSize: "0.72rem", fontWeight: 700,
                            background: j.status === "DELIVERED" ? "#ECFDF5" : "#EFF6FF",
                            color: j.status === "DELIVERED" ? "#059669" : "#1D4ED8",
                          }}>
                            {j.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </RoleGuard>
  );
}
