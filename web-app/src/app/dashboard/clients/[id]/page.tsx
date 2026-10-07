"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Building2, ArrowLeft, Mail, Phone, MapPin, Receipt,
  Film, FileText, Clock, CheckCircle2, AlertCircle, Plus,
  ExternalLink, Edit3, DollarSign, Calendar, User, Eye,
  Send, ShieldAlert, Sparkles, ChevronRight, Copy, Check
} from "lucide-react";
import { useRole } from "@/context/RoleContext";

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

export default function Client360Page() {
  const params = useParams();
  const router = useRouter();
  const { user } = useRole();
  const clientId = params?.id as string;

  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "jobs" | "invoices" | "ratecard" | "activity">("overview");
  const [copiedPortal, setCopiedPortal] = useState(false);

  // New Note state
  const [newNote, setNewNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  // Rate card editing state
  const [editingRateCard, setEditingRateCard] = useState(false);
  const [rateForm, setRateForm] = useState({
    photoCullingPerImage: 3,
    photoColorPerImage: 8,
    photoRetouchPerImage: 25,
    videoEditingPerMinute: 200,
    reelEditingPerItem: 750,
    monthlyRetainer: 0,
    currency: "INR",
    billingCycle: "Per Project",
    paymentTermsDays: 15,
  });

  const fetchClientProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/clients/${clientId}`, {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      const data = await res.json();
      if (data.success && data.data) {
        setClient(data.data);
        if (data.data.rateCard) {
          setRateForm({
            photoCullingPerImage: data.data.rateCard.photoCullingPerImage || 3,
            photoColorPerImage: data.data.rateCard.photoColorPerImage || 8,
            photoRetouchPerImage: data.data.rateCard.photoRetouchPerImage || 25,
            videoEditingPerMinute: data.data.rateCard.videoEditingPerMinute || 200,
            reelEditingPerItem: data.data.rateCard.reelEditingPerItem || 750,
            monthlyRetainer: data.data.rateCard.monthlyRetainer || 0,
            currency: data.data.rateCard.currency || "INR",
            billingCycle: data.data.rateCard.billingCycle || "Per Project",
            paymentTermsDays: data.data.rateCard.paymentTermsDays || 15,
          });
        }
      }
    } catch (err) {
      console.error("Error fetching client 360:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (clientId) fetchClientProfile();
  }, [clientId]);

  const handleSaveRateCard = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/finance/rate-cards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          clientId: client.id,
          ...rateForm,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEditingRateCard(false);
        fetchClientProfile();
      }
    } catch (err) {
      console.error("Error saving rate card:", err);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    try {
      setSavingNote(true);
      const token = localStorage.getItem("token");
      const res = await fetch("/api/activity-logs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          clientId: client.id,
          userId: user?.id,
          userName: user?.name || "Admin",
          userRole: user?.role || "ADMIN",
          action: "NOTE_ADDED",
          category: "GENERAL",
          entityType: "CLIENT",
          entityId: client.id,
          entityTitle: client.companyName,
          description: newNote,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNewNote("");
        fetchClientProfile();
      }
    } catch (err) {
      console.error("Error adding note:", err);
    } finally {
      setSavingNote(false);
    }
  };

  const copyPortalLink = () => {
    const portalUrl = `${window.location.origin}/portal/client/${client?.id || clientId}`;
    navigator.clipboard.writeText(portalUrl);
    setCopiedPortal(true);
    setTimeout(() => setCopiedPortal(false), 2500);
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <div style={{ textAlign: "center", color: C.muted }}>
          <div style={{ width: 36, height: 36, border: `3px solid ${C.border}`, borderTopColor: C.primary, borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 12px" }} />
          <p style={{ fontSize: "14px" }}>Loading Client 360° Profile...</p>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <AlertCircle size={48} color={C.danger} style={{ margin: "0 auto 16px" }} />
        <h2 style={{ fontSize: "20px", fontWeight: 700, color: C.text }}>Client Not Found</h2>
        <p style={{ color: C.muted, margin: "8px 0 24px" }}>The requested client could not be located.</p>
        <Link href="/dashboard/clients" style={{ background: C.primary, color: "#fff", padding: "10px 20px", borderRadius: C.radiusSm, textDecoration: "none", fontSize: "14px" }}>
          Back to Clients
        </Link>
      </div>
    );
  }

  const kpis = client.kpis || {
    totalBilled: 0,
    totalPaid: 0,
    outstanding: 0,
    totalJobs: 0,
    jobsCompleted: 0,
    jobsActive: 0,
  };

  return (
    <div style={{ maxWidth: 1300, margin: "0 auto", paddingBottom: "60px" }}>
      {/* Top Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px", fontSize: "13px", color: C.muted }}>
        <Link href="/dashboard/clients" style={{ color: C.muted, textDecoration: "none", display: "flex", alignItems: "center", gap: "4px" }}>
          <ArrowLeft size={14} /> Clients
        </Link>
        <ChevronRight size={14} />
        <span style={{ color: C.text, fontWeight: 600 }}>{client.companyName} ({client.clientId})</span>
      </div>

      {/* Client 360 Header Banner */}
      <div style={{ background: C.card, borderRadius: C.radius, border: `1px solid ${C.border}`, padding: "24px", marginBottom: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
          <div style={{ display: "flex", gap: "18px", alignItems: "center" }}>
            <div style={{ width: 64, height: 64, borderRadius: "14px", background: "linear-gradient(135deg, #1A56DB, #3B82F6)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", fontWeight: 800 }}>
              {client.companyName.charAt(0)}
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                <h1 style={{ fontSize: "24px", fontWeight: 700, color: C.text, margin: 0 }}>
                  {client.companyName}
                </h1>
                <span style={{ fontSize: "12px", fontWeight: 700, padding: "3px 8px", background: "#EFF6FF", color: C.primary, borderRadius: "4px" }}>
                  {client.clientId}
                </span>
                <span style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  padding: "3px 10px",
                  borderRadius: "20px",
                  background: client.status === "ACTIVE" ? "#ECFDF5" : "#FFFBEB",
                  color: client.status === "ACTIVE" ? C.success : C.warning,
                }}>
                  ● {client.status}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "18px", marginTop: "8px", fontSize: "13px", color: C.muted, flexWrap: "wrap" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                  <User size={14} /> {client.contactPerson}
                </span>
                {client.phone && (
                  <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    <Phone size={14} /> {client.phone}
                  </span>
                )}
                {client.email && (
                  <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    <Mail size={14} /> {client.email}
                  </span>
                )}
                {client.address && (
                  <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    <MapPin size={14} /> {client.address}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
            <button
              onClick={copyPortalLink}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 14px",
                borderRadius: C.radiusSm,
                border: `1px solid ${C.border}`,
                background: "#fff",
                fontSize: "13px",
                fontWeight: 600,
                color: C.text,
                cursor: "pointer",
              }}
            >
              {copiedPortal ? <Check size={14} color={C.success} /> : <Copy size={14} />}
              {copiedPortal ? "Portal Link Copied!" : "Client Portal Link"}
            </button>
            <Link
              href={`/dashboard/jobs?clientId=${client.id}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 14px",
                borderRadius: C.radiusSm,
                background: "#EFF6FF",
                color: C.primary,
                border: "1px solid #BFDBFE",
                fontSize: "13px",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              <Plus size={14} /> New Editing Job
            </Link>
            <Link
              href={`/dashboard/finance?clientId=${client.id}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 16px",
                borderRadius: C.radiusSm,
                background: C.primary,
                color: "#fff",
                fontSize: "13px",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              <Receipt size={14} /> Create Invoice
            </Link>
          </div>
        </div>

        {/* 4 Financial & Production Highlight Metric Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginTop: "24px" }}>
          <div style={{ padding: "16px", borderRadius: C.radiusSm, background: "#F8FAFC", border: `1px solid ${C.border}` }}>
            <p style={{ margin: 0, fontSize: "12px", color: C.muted, fontWeight: 600, textTransform: "uppercase" }}>Total Billed</p>
            <p style={{ margin: "6px 0 0", fontSize: "22px", fontWeight: 800, color: C.text }}>
              ₹{kpis.totalBilled.toLocaleString("en-IN")}
            </p>
            <span style={{ fontSize: "11px", color: C.muted }}>GST Included</span>
          </div>

          <div style={{ padding: "16px", borderRadius: C.radiusSm, background: "#F0FDF4", border: "1px solid #BBF7D0" }}>
            <p style={{ margin: 0, fontSize: "12px", color: "#166534", fontWeight: 600, textTransform: "uppercase" }}>Total Paid / Received</p>
            <p style={{ margin: "6px 0 0", fontSize: "22px", fontWeight: 800, color: C.success }}>
              ₹{kpis.totalPaid.toLocaleString("en-IN")}
            </p>
            <span style={{ fontSize: "11px", color: "#166534" }}>Cleared in bank</span>
          </div>

          <div style={{ padding: "16px", borderRadius: C.radiusSm, background: kpis.outstanding > 0 ? "#FEF2F2" : "#F8FAFC", border: `1px solid ${kpis.outstanding > 0 ? "#FECACA" : C.border}` }}>
            <p style={{ margin: 0, fontSize: "12px", color: kpis.outstanding > 0 ? C.danger : C.muted, fontWeight: 600, textTransform: "uppercase" }}>Outstanding Balance</p>
            <p style={{ margin: "6px 0 0", fontSize: "22px", fontWeight: 800, color: kpis.outstanding > 0 ? C.danger : C.text }}>
              ₹{kpis.outstanding.toLocaleString("en-IN")}
            </p>
            <span style={{ fontSize: "11px", color: kpis.outstanding > 0 ? C.danger : C.muted }}>
              {kpis.outstanding > 0 ? "Pending collection" : "Zero dues"}
            </span>
          </div>

          <div style={{ padding: "16px", borderRadius: C.radiusSm, background: "#EFF6FF", border: "1px solid #BFDBFE" }}>
            <p style={{ margin: 0, fontSize: "12px", color: "#1E40AF", fontWeight: 600, textTransform: "uppercase" }}>Editing Production</p>
            <p style={{ margin: "6px 0 0", fontSize: "22px", fontWeight: 800, color: C.primary }}>
              {kpis.jobsCompleted} <span style={{ fontSize: "14px", fontWeight: 500, color: C.muted }}>/ {kpis.totalJobs} jobs</span>
            </p>
            <span style={{ fontSize: "11px", color: "#1E40AF" }}>
              {client.kpis?.totalPhotosEdited || 0} photos delivered
            </span>
          </div>
        </div>
      </div>

      {/* Tabs Row */}
      <div style={{ display: "flex", gap: "8px", borderBottom: `1px solid ${C.border}`, marginBottom: "20px" }}>
        {[
          { key: "overview", label: "Overview & Details", icon: Building2 },
          { key: "jobs", label: `Editing Jobs (${client.editingJobs?.length || 0})`, icon: Film },
          { key: "invoices", label: `Invoices & Billing (${client.invoices?.length || 0})`, icon: Receipt },
          { key: "ratecard", label: "Contract Rate Card", icon: DollarSign },
          { key: "activity", label: `Timeline & Notes (${client.activityLogs?.length || 0})`, icon: Clock },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 18px",
                background: "none",
                border: "none",
                borderBottom: isActive ? `2px solid ${C.primary}` : "2px solid transparent",
                color: isActive ? C.primary : C.muted,
                fontWeight: isActive ? 700 : 500,
                fontSize: "14px",
                cursor: "pointer",
                marginBottom: "-1px",
              }}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT 1: OVERVIEW */}
      {activeTab === "overview" && (
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "20px" }}>
          {/* Company Details */}
          <div style={{ background: C.card, borderRadius: C.radius, border: `1px solid ${C.border}`, padding: "24px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 700, color: C.text, margin: "0 0 16px" }}>Company Profile & Business Details</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", fontSize: "14px" }}>
              <div>
                <span style={{ color: C.muted, fontSize: "12px", display: "block" }}>Company Name</span>
                <strong style={{ color: C.text }}>{client.companyName}</strong>
              </div>
              <div>
                <span style={{ color: C.muted, fontSize: "12px", display: "block" }}>Client ID</span>
                <strong style={{ color: C.text }}>{client.clientId}</strong>
              </div>
              <div>
                <span style={{ color: C.muted, fontSize: "12px", display: "block" }}>Primary Contact Person</span>
                <strong style={{ color: C.text }}>{client.contactPerson}</strong>
              </div>
              <div>
                <span style={{ color: C.muted, fontSize: "12px", display: "block" }}>Payment Terms</span>
                <strong style={{ color: C.text }}>{client.paymentTerms || "Due on Receipt"}</strong>
              </div>
              <div>
                <span style={{ color: C.muted, fontSize: "12px", display: "block" }}>Billing Currency</span>
                <strong style={{ color: C.text }}>{client.currency || "INR"} (₹)</strong>
              </div>
              <div>
                <span style={{ color: C.muted, fontSize: "12px", display: "block" }}>Country</span>
                <strong style={{ color: C.text }}>{client.country || "India"}</strong>
              </div>
              <div>
                <span style={{ color: C.muted, fontSize: "12px", display: "block" }}>Assigned Account / Marketing</span>
                <strong style={{ color: C.text }}>{client.assignedMarketing?.name || "Unassigned"}</strong>
              </div>
              <div>
                <span style={{ color: C.muted, fontSize: "12px", display: "block" }}>Client Since</span>
                <strong style={{ color: C.text }}>{new Date(client.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</strong>
              </div>
            </div>

            {client.notes && (
              <div style={{ marginTop: "20px", padding: "14px", background: "#F9FAFB", borderRadius: C.radiusSm, border: `1px solid ${C.border}` }}>
                <span style={{ fontSize: "12px", color: C.muted, display: "block", marginBottom: "4px" }}>Internal Operational Notes:</span>
                <p style={{ margin: 0, fontSize: "13px", color: C.text, lineHeight: 1.5 }}>{client.notes}</p>
              </div>
            )}
          </div>

          {/* Quick Portal & Contract Snapshot */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ background: C.card, borderRadius: C.radius, border: `1px solid ${C.border}`, padding: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                <Sparkles size={18} color={C.primary} />
                <h4 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: C.text }}>Client Self-Service Portal</h4>
              </div>
              <p style={{ fontSize: "13px", color: C.muted, margin: "0 0 16px", lineHeight: 1.4 }}>
                Share this dedicated portal link with {client.companyName} to let them check real-time job progress, review photo samples, and download invoices directly.
              </p>
              <button
                onClick={copyPortalLink}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: C.radiusSm,
                  border: `1px solid ${C.primary}`,
                  background: "#EFF6FF",
                  color: C.primary,
                  fontWeight: 600,
                  fontSize: "13px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                }}
              >
                {copiedPortal ? <Check size={16} /> : <Copy size={16} />}
                {copiedPortal ? "Copied to Clipboard!" : "Copy Public Portal URL"}
              </button>
            </div>

            <div style={{ background: C.card, borderRadius: C.radius, border: `1px solid ${C.border}`, padding: "20px" }}>
              <h4 style={{ margin: "0 0 12px", fontSize: "15px", fontWeight: 700, color: C.text }}>Active Pricing Snapshot</h4>
              <div style={{ fontSize: "13px", display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: C.muted }}>Photo Color Grading</span>
                  <strong>₹{rateForm.photoColorPerImage} / image</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: C.muted }}>High-end Retouch</span>
                  <strong>₹{rateForm.photoRetouchPerImage} / image</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: C.muted }}>Video Editing</span>
                  <strong>₹{rateForm.videoEditingPerMinute} / min</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: C.muted }}>Social Reels</span>
                  <strong>₹{rateForm.reelEditingPerItem} / reel</strong>
                </div>
              </div>
              <button
                onClick={() => setActiveTab("ratecard")}
                style={{ marginTop: "14px", width: "100%", padding: "8px", background: "none", border: `1px solid ${C.border}`, borderRadius: C.radiusSm, fontSize: "12px", color: C.primary, fontWeight: 600, cursor: "pointer" }}
              >
                Manage Full Rate Card →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: EDITING JOBS */}
      {activeTab === "jobs" && (
        <div style={{ background: C.card, borderRadius: C.radius, border: `1px solid ${C.border}`, overflow: "hidden" }}>
          <div style={{ padding: "18px 24px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: C.text }}>Editing Projects & Orders</h3>
              <p style={{ margin: "4px 0 0", fontSize: "13px", color: C.muted }}>All production work undertaken for {client.companyName}</p>
            </div>
            <Link
              href={`/dashboard/jobs?clientId=${client.id}`}
              style={{ padding: "8px 14px", background: C.primary, color: "#fff", borderRadius: C.radiusSm, textDecoration: "none", fontSize: "13px", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px" }}
            >
              <Plus size={14} /> Add New Job
            </Link>
          </div>

          {client.editingJobs?.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: C.muted }}>
              <Film size={36} style={{ margin: "0 auto 10px", opacity: 0.5 }} />
              <p>No editing jobs created for this client yet.</p>
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ background: "#F9FAFB", borderBottom: `1px solid ${C.border}`, textAlign: "left" }}>
                  <th style={{ padding: "12px 16px", color: C.muted, fontWeight: 600 }}>JOB #</th>
                  <th style={{ padding: "12px 16px", color: C.muted, fontWeight: 600 }}>TITLE & SERVICE</th>
                  <th style={{ padding: "12px 16px", color: C.muted, fontWeight: 600 }}>EDITOR</th>
                  <th style={{ padding: "12px 16px", color: C.muted, fontWeight: 600 }}>PROGRESS</th>
                  <th style={{ padding: "12px 16px", color: C.muted, fontWeight: 600 }}>DEADLINE</th>
                  <th style={{ padding: "12px 16px", color: C.muted, fontWeight: 600 }}>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {client.editingJobs?.map((job: any) => {
                  const percent = job.totalImages > 0 ? Math.round((job.completedImages / job.totalImages) * 100) : 0;
                  return (
                    <tr key={job.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                      <td style={{ padding: "14px 16px", fontWeight: 700, color: C.primary }}>
                        {job.jobNumber}
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ fontWeight: 600, color: C.text }}>{job.title}</div>
                        <div style={{ fontSize: "12px", color: C.muted }}>{job.serviceType} ({job.category})</div>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        {job.assignedEditor ? (
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#E5E7EB", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 700 }}>
                              {job.assignedEditor.name.charAt(0)}
                            </div>
                            <span>{job.assignedEditor.name}</span>
                          </div>
                        ) : (
                          <span style={{ color: C.muted }}>Unassigned</span>
                        )}
                      </td>
                      <td style={{ padding: "14px 16px", minWidth: "160px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "4px" }}>
                          <span>{job.completedImages} / {job.totalImages} images</span>
                          <span>{percent}%</span>
                        </div>
                        <div style={{ width: "100%", height: 6, background: "#E5E7EB", borderRadius: 3, overflow: "hidden" }}>
                          <div style={{ width: `${percent}%`, height: "100%", background: percent === 100 ? C.success : C.primary, transition: "width 0.3s" }} />
                        </div>
                      </td>
                      <td style={{ padding: "14px 16px", color: C.text }}>
                        {job.deadlineDate || "—"}
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <span style={{
                          padding: "4px 8px",
                          borderRadius: "4px",
                          fontSize: "11px",
                          fontWeight: 700,
                          background: job.status === "DELIVERED" ? "#ECFDF5" : "#EFF6FF",
                          color: job.status === "DELIVERED" ? C.success : C.primary,
                        }}>
                          {job.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* TAB CONTENT 3: INVOICES & BILLING */}
      {activeTab === "invoices" && (
        <div style={{ background: C.card, borderRadius: C.radius, border: `1px solid ${C.border}`, overflow: "hidden" }}>
          <div style={{ padding: "18px 24px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: C.text }}>Invoices & GST Billing</h3>
              <p style={{ margin: "4px 0 0", fontSize: "13px", color: C.muted }}>All tax invoices and payment records for {client.companyName}</p>
            </div>
            <Link
              href={`/dashboard/finance?clientId=${client.id}`}
              style={{ padding: "8px 14px", background: C.primary, color: "#fff", borderRadius: C.radiusSm, textDecoration: "none", fontSize: "13px", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px" }}
            >
              <Plus size={14} /> New Invoice
            </Link>
          </div>

          {client.invoices?.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: C.muted }}>
              <Receipt size={36} style={{ margin: "0 auto 10px", opacity: 0.5 }} />
              <p>No invoices generated for this client yet.</p>
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ background: "#F9FAFB", borderBottom: `1px solid ${C.border}`, textAlign: "left" }}>
                  <th style={{ padding: "12px 16px", color: C.muted, fontWeight: 600 }}>INVOICE #</th>
                  <th style={{ padding: "12px 16px", color: C.muted, fontWeight: 600 }}>DATE</th>
                  <th style={{ padding: "12px 16px", color: C.muted, fontWeight: 600 }}>SUBTOTAL</th>
                  <th style={{ padding: "12px 16px", color: C.muted, fontWeight: 600 }}>GST 18%</th>
                  <th style={{ padding: "12px 16px", color: C.muted, fontWeight: 600 }}>TOTAL (₹)</th>
                  <th style={{ padding: "12px 16px", color: C.muted, fontWeight: 600 }}>PAID (₹)</th>
                  <th style={{ padding: "12px 16px", color: C.muted, fontWeight: 600 }}>STATUS</th>
                  <th style={{ padding: "12px 16px", color: C.muted, fontWeight: 600 }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {client.invoices?.map((inv: any) => (
                  <tr key={inv.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                    <td style={{ padding: "14px 16px", fontWeight: 700, color: C.primary }}>
                      {inv.invoiceNumber}
                    </td>
                    <td style={{ padding: "14px 16px", color: C.muted }}>
                      {inv.issueDate}
                    </td>
                    <td style={{ padding: "14px 16px", color: C.text }}>
                      ₹{inv.subtotal.toLocaleString("en-IN")}
                    </td>
                    <td style={{ padding: "14px 16px", color: C.muted }}>
                      ₹{inv.taxAmount.toLocaleString("en-IN")}
                    </td>
                    <td style={{ padding: "14px 16px", fontWeight: 700, color: C.text }}>
                      ₹{inv.totalAmount.toLocaleString("en-IN")}
                    </td>
                    <td style={{ padding: "14px 16px", fontWeight: 700, color: inv.amountPaid >= inv.totalAmount ? C.success : C.warning }}>
                      ₹{inv.amountPaid.toLocaleString("en-IN")}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{
                        padding: "3px 8px",
                        borderRadius: "4px",
                        fontSize: "11px",
                        fontWeight: 700,
                        background: inv.status === "PAID" ? "#ECFDF5" : inv.status === "SENT" ? "#EFF6FF" : "#FFFBEB",
                        color: inv.status === "PAID" ? C.success : inv.status === "SENT" ? C.primary : C.warning,
                      }}>
                        {inv.status}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <Link
                        href={`/dashboard/finance?id=${inv.id}`}
                        style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: C.primary, textDecoration: "none", fontWeight: 600, fontSize: "12px" }}
                      >
                        <Eye size={13} /> View Invoice
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* TAB CONTENT 4: CONTRACT RATE CARD */}
      {activeTab === "ratecard" && (
        <div style={{ background: C.card, borderRadius: C.radius, border: `1px solid ${C.border}`, padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: C.text }}>Client Contract Rate Card</h3>
              <p style={{ margin: "4px 0 0", fontSize: "13px", color: C.muted }}>Pre-negotiated unit rates auto-applied when creating projects & invoices</p>
            </div>
            <button
              onClick={() => setEditingRateCard(!editingRateCard)}
              style={{
                padding: "8px 16px",
                borderRadius: C.radiusSm,
                border: `1px solid ${C.primary}`,
                background: editingRateCard ? "#EFF6FF" : C.primary,
                color: editingRateCard ? C.primary : "#fff",
                fontWeight: 600,
                fontSize: "13px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <Edit3 size={14} />
              {editingRateCard ? "Cancel Edit" : "Edit Rate Card"}
            </button>
          </div>

          <form onSubmit={handleSaveRateCard}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "20px" }}>
              <div style={{ padding: "16px", background: "#F8FAFC", borderRadius: C.radiusSm, border: `1px solid ${C.border}` }}>
                <label style={{ fontSize: "13px", fontWeight: 600, color: C.text, display: "block", marginBottom: "6px" }}>Photo Culling Rate (₹ / image)</label>
                <input
                  type="number"
                  disabled={!editingRateCard}
                  value={rateForm.photoCullingPerImage}
                  onChange={(e) => setRateForm({ ...rateForm, photoCullingPerImage: parseFloat(e.target.value) || 0 })}
                  style={{ width: "100%", padding: "10px", borderRadius: C.radiusSm, border: `1px solid ${C.border}`, fontSize: "14px", fontWeight: 700 }}
                />
              </div>

              <div style={{ padding: "16px", background: "#F8FAFC", borderRadius: C.radiusSm, border: `1px solid ${C.border}` }}>
                <label style={{ fontSize: "13px", fontWeight: 600, color: C.text, display: "block", marginBottom: "6px" }}>Color Correction Rate (₹ / image)</label>
                <input
                  type="number"
                  disabled={!editingRateCard}
                  value={rateForm.photoColorPerImage}
                  onChange={(e) => setRateForm({ ...rateForm, photoColorPerImage: parseFloat(e.target.value) || 0 })}
                  style={{ width: "100%", padding: "10px", borderRadius: C.radiusSm, border: `1px solid ${C.border}`, fontSize: "14px", fontWeight: 700 }}
                />
              </div>

              <div style={{ padding: "16px", background: "#F8FAFC", borderRadius: C.radiusSm, border: `1px solid ${C.border}` }}>
                <label style={{ fontSize: "13px", fontWeight: 600, color: C.text, display: "block", marginBottom: "6px" }}>High-End Retouching (₹ / image)</label>
                <input
                  type="number"
                  disabled={!editingRateCard}
                  value={rateForm.photoRetouchPerImage}
                  onChange={(e) => setRateForm({ ...rateForm, photoRetouchPerImage: parseFloat(e.target.value) || 0 })}
                  style={{ width: "100%", padding: "10px", borderRadius: C.radiusSm, border: `1px solid ${C.border}`, fontSize: "14px", fontWeight: 700 }}
                />
              </div>

              <div style={{ padding: "16px", background: "#F8FAFC", borderRadius: C.radiusSm, border: `1px solid ${C.border}` }}>
                <label style={{ fontSize: "13px", fontWeight: 600, color: C.text, display: "block", marginBottom: "6px" }}>Video Editing (₹ / minute finished)</label>
                <input
                  type="number"
                  disabled={!editingRateCard}
                  value={rateForm.videoEditingPerMinute}
                  onChange={(e) => setRateForm({ ...rateForm, videoEditingPerMinute: parseFloat(e.target.value) || 0 })}
                  style={{ width: "100%", padding: "10px", borderRadius: C.radiusSm, border: `1px solid ${C.border}`, fontSize: "14px", fontWeight: 700 }}
                />
              </div>

              <div style={{ padding: "16px", background: "#F8FAFC", borderRadius: C.radiusSm, border: `1px solid ${C.border}` }}>
                <label style={{ fontSize: "13px", fontWeight: 600, color: C.text, display: "block", marginBottom: "6px" }}>Social Reel / Short (₹ / video)</label>
                <input
                  type="number"
                  disabled={!editingRateCard}
                  value={rateForm.reelEditingPerItem}
                  onChange={(e) => setRateForm({ ...rateForm, reelEditingPerItem: parseFloat(e.target.value) || 0 })}
                  style={{ width: "100%", padding: "10px", borderRadius: C.radiusSm, border: `1px solid ${C.border}`, fontSize: "14px", fontWeight: 700 }}
                />
              </div>

              <div style={{ padding: "16px", background: "#F8FAFC", borderRadius: C.radiusSm, border: `1px solid ${C.border}` }}>
                <label style={{ fontSize: "13px", fontWeight: 600, color: C.text, display: "block", marginBottom: "6px" }}>Monthly Retainer (₹ / month)</label>
                <input
                  type="number"
                  disabled={!editingRateCard}
                  value={rateForm.monthlyRetainer}
                  onChange={(e) => setRateForm({ ...rateForm, monthlyRetainer: parseFloat(e.target.value) || 0 })}
                  style={{ width: "100%", padding: "10px", borderRadius: C.radiusSm, border: `1px solid ${C.border}`, fontSize: "14px", fontWeight: 700 }}
                />
              </div>
            </div>

            {editingRateCard && (
              <div style={{ marginTop: "24px", display: "flex", justifyContent: "flex-end" }}>
                <button
                  type="submit"
                  style={{
                    padding: "10px 24px",
                    background: C.primary,
                    color: "#fff",
                    borderRadius: C.radiusSm,
                    border: "none",
                    fontWeight: 700,
                    fontSize: "14px",
                    cursor: "pointer",
                  }}
                >
                  Save Contract Rates
                </button>
              </div>
            )}
          </form>
        </div>
      )}

      {/* TAB CONTENT 5: ACTIVITY TIMELINE & NOTES */}
      {activeTab === "activity" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "20px" }}>
          {/* Add Note / Milestone */}
          <div style={{ background: C.card, borderRadius: C.radius, border: `1px solid ${C.border}`, padding: "20px", height: "fit-content" }}>
            <h4 style={{ margin: "0 0 12px", fontSize: "15px", fontWeight: 700, color: C.text }}>Log Client Milestone / Note</h4>
            <form onSubmit={handleAddNote}>
              <textarea
                rows={4}
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="e.g. Call with Karan: approved color presets for upcoming wedding series, delivery expected Friday..."
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: C.radiusSm,
                  border: `1px solid ${C.border}`,
                  fontSize: "13px",
                  resize: "vertical",
                  marginBottom: "12px",
                  boxSizing: "border-box",
                }}
              />
              <button
                type="submit"
                disabled={savingNote || !newNote.trim()}
                style={{
                  width: "100%",
                  padding: "10px",
                  background: C.primary,
                  color: "#fff",
                  borderRadius: C.radiusSm,
                  border: "none",
                  fontWeight: 600,
                  fontSize: "13px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  opacity: savingNote || !newNote.trim() ? 0.6 : 1,
                }}
              >
                <Send size={14} />
                {savingNote ? "Saving..." : "Add to Client Timeline"}
              </button>
            </form>
          </div>

          {/* Timeline Feed */}
          <div style={{ background: C.card, borderRadius: C.radius, border: `1px solid ${C.border}`, padding: "24px" }}>
            <h4 style={{ margin: "0 0 20px", fontSize: "15px", fontWeight: 700, color: C.text }}>Audit Trail & Interaction Timeline</h4>

            {client.activityLogs?.length === 0 ? (
              <div style={{ textAlign: "center", color: C.muted, padding: "30px 0" }}>
                <Clock size={32} style={{ margin: "0 auto 10px", opacity: 0.5 }} />
                <p>No activity records logged for this client yet.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {client.activityLogs?.map((log: any) => (
                  <div key={log.id} style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
                    <div style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      background: log.category === "FINANCE" ? "#ECFDF5" : log.category === "PROJECTS" ? "#EFF6FF" : "#F3F4F6",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: log.category === "FINANCE" ? C.success : log.category === "PROJECTS" ? C.primary : C.muted,
                      flexShrink: 0,
                      marginTop: "2px",
                    }}>
                      {log.category === "FINANCE" ? <Receipt size={16} /> : log.category === "PROJECTS" ? <Film size={16} /> : <FileText size={16} />}
                    </div>
                    <div style={{ flex: 1, paddingBottom: "16px", borderBottom: `1px solid ${C.border}` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "12px", fontWeight: 700, color: C.text }}>
                          {log.userName || "System"} <span style={{ fontWeight: 400, color: C.muted }}>({log.userRole || "ADMIN"})</span>
                        </span>
                        <span style={{ fontSize: "11px", color: C.muted }}>
                          {new Date(log.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <p style={{ margin: "6px 0 0", fontSize: "13px", color: C.text, lineHeight: 1.4 }}>
                        {log.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
