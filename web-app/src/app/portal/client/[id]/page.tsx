"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  Building2, Film, Receipt, DollarSign, CheckCircle2,
  Clock, ExternalLink, Download, AlertCircle, Sparkles,
  Image as ImageIcon, Video, ShieldCheck, Mail, Phone
} from "lucide-react";

const C = {
  bg: "#F8FAFC",
  card: "#FFFFFF",
  border: "#E2E8F0",
  primary: "#1A56DB",
  text: "#0F172A",
  muted: "#64748B",
  success: "#10B981",
  warning: "#F59E0B",
  radius: "12px",
  radiusSm: "8px",
};

export default function ClientPortalPage() {
  const params = useParams();
  const clientId = params?.id as string;

  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"jobs" | "invoices" | "rates">("jobs");

  useEffect(() => {
    async function loadPortal() {
      try {
        setLoading(true);
        const res = await fetch(`/api/clients/${clientId}`);
        const data = await res.json();
        if (data.success && data.data) {
          setClient(data.data);
        }
      } catch (err) {
        console.error("Error loading client portal:", err);
      } finally {
        setLoading(false);
      }
    }
    if (clientId) loadPortal();
  }, [clientId]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", background: C.bg }}>
        <div style={{ textAlign: "center", color: C.muted }}>
          <div style={{ width: 40, height: 40, border: `3px solid ${C.border}`, borderTopColor: C.primary, borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 12px" }} />
          <p style={{ fontSize: "14px", fontWeight: 600 }}>Loading Studio Client Portal...</p>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", background: C.bg, padding: "20px" }}>
        <div style={{ background: C.card, padding: "40px", borderRadius: C.radius, textAlign: "center", maxWidth: "480px", border: `1px solid ${C.border}` }}>
          <AlertCircle size={48} color="#EF4444" style={{ margin: "0 auto 16px" }} />
          <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 700, color: C.text }}>Client Workspace Not Found</h2>
          <p style={{ color: C.muted, margin: "8px 0 0", fontSize: "14px" }}>
            The link you accessed may have expired or is incorrect. Please contact Resawc Studio support.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "Inter, sans-serif" }}>
      {/* Studio Brand Header */}
      <header style={{ background: C.card, borderBottom: `1px solid ${C.border}`, padding: "16px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: 36, height: 36, borderRadius: "8px", background: C.primary, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "18px" }}>
              R
            </div>
            <div>
              <div style={{ fontSize: "16px", fontWeight: 800, color: C.text }}>RESAWC STUDIO</div>
              <div style={{ fontSize: "11px", color: C.muted, letterSpacing: "0.5px" }}>POST-PRODUCTION & CINEMA LAB</div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "12px", background: "#EFF6FF", color: C.primary, fontWeight: 700, padding: "4px 10px", borderRadius: "20px", display: "flex", alignItems: "center", gap: "5px" }}>
              <ShieldCheck size={14} /> Client Portal
            </span>
          </div>
        </div>
      </header>

      {/* Hero Welcome Card */}
      <div style={{ maxWidth: 1200, margin: "32px auto 24px", padding: "0 20px" }}>
        <div style={{ background: "linear-gradient(135deg, #1A56DB, #1E40AF)", borderRadius: C.radius, padding: "32px", color: "#fff", boxShadow: "0 10px 25px rgba(26,86,219,0.15)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "20px" }}>
            <div>
              <span style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", opacity: 0.8 }}>
                Client Workspace • {client.clientId}
              </span>
              <h1 style={{ fontSize: "28px", fontWeight: 800, margin: "6px 0 10px" }}>
                Welcome, {client.companyName}
              </h1>
              <p style={{ margin: 0, fontSize: "14px", opacity: 0.9 }}>
                Direct workspace for order tracking, high-res delivery links, and GST invoicing
              </p>
            </div>

            <div style={{ display: "flex", gap: "20px" }}>
              <div style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(4px)", padding: "14px 20px", borderRadius: C.radiusSm, textAlign: "center" }}>
                <span style={{ fontSize: "11px", opacity: 0.8, textTransform: "uppercase" }}>Completed Orders</span>
                <div style={{ fontSize: "22px", fontWeight: 800, marginTop: "2px" }}>
                  {client.kpis?.jobsCompleted || 0}
                </div>
              </div>
              <div style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(4px)", padding: "14px 20px", borderRadius: C.radiusSm, textAlign: "center" }}>
                <span style={{ fontSize: "11px", opacity: 0.8, textTransform: "uppercase" }}>In Progress</span>
                <div style={{ fontSize: "22px", fontWeight: 800, marginTop: "2px" }}>
                  {client.kpis?.jobsActive || 0}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 20px 60px" }}>
        {/* Navigation Tabs */}
        <div style={{ display: "flex", gap: "10px", borderBottom: `1px solid ${C.border}`, marginBottom: "24px" }}>
          {[
            { key: "jobs", label: `Editing Orders (${client.editingJobs?.length || 0})`, icon: Film },
            { key: "invoices", label: `Invoices & Billing (${client.invoices?.length || 0})`, icon: Receipt },
            { key: "rates", label: "Studio Contract Rates", icon: DollarSign },
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
                  padding: "12px 20px",
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

        {/* TAB 1: EDITING ORDERS */}
        {activeTab === "jobs" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {client.editingJobs?.length === 0 ? (
              <div style={{ background: C.card, borderRadius: C.radius, border: `1px solid ${C.border}`, padding: "40px", textAlign: "center", color: C.muted }}>
                <Film size={36} style={{ margin: "0 auto 10px", opacity: 0.5 }} />
                <p>No editing orders registered in your workspace.</p>
              </div>
            ) : (
              client.editingJobs?.map((job: any) => {
                const percent = job.totalImages > 0 ? Math.round((job.completedImages / job.totalImages) * 100) : 0;
                const isDelivered = job.status === "DELIVERED";
                return (
                  <div key={job.id} style={{ background: C.card, borderRadius: C.radius, border: `1px solid ${C.border}`, padding: "20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontSize: "12px", fontWeight: 800, color: C.primary, background: "#EFF6FF", padding: "2px 8px", borderRadius: "4px" }}>
                            {job.jobNumber}
                          </span>
                          <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: C.text }}>
                            {job.title}
                          </h3>
                        </div>
                        <div style={{ display: "flex", gap: "16px", fontSize: "13px", color: C.muted, marginTop: "6px" }}>
                          <span>Service: <strong>{job.serviceType}</strong></span>
                          <span>Category: <strong>{job.category}</strong></span>
                          <span>Target Delivery: <strong>{job.deadlineDate || "TBD"}</strong></span>
                        </div>
                      </div>

                      <div>
                        <span style={{
                          padding: "4px 12px",
                          borderRadius: "20px",
                          fontSize: "12px",
                          fontWeight: 700,
                          background: isDelivered ? "#ECFDF5" : "#EFF6FF",
                          color: isDelivered ? C.success : C.primary,
                        }}>
                          ● {job.status}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div style={{ marginTop: "16px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "6px" }}>
                        <span style={{ color: C.muted }}>
                          {job.completedImages} of {job.totalImages} images finished
                        </span>
                        <strong style={{ color: C.text }}>{percent}%</strong>
                      </div>
                      <div style={{ width: "100%", height: 8, background: "#E2E8F0", borderRadius: 4, overflow: "hidden" }}>
                        <div style={{ width: `${percent}%`, height: "100%", background: isDelivered ? C.success : C.primary, transition: "width 0.4s" }} />
                      </div>
                    </div>

                    {/* Deliverable Link if present */}
                    {job.deliverableNotes && (
                      <div style={{ marginTop: "16px", padding: "12px 16px", background: "#F1F5F9", borderRadius: C.radiusSm, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                        <div style={{ fontSize: "13px" }}>
                          <span style={{ color: C.muted }}>Delivery / Review Link: </span>
                          <strong style={{ color: C.primary }}>{job.deliverableNotes}</strong>
                        </div>
                        {job.deliverableNotes.startsWith("http") && (
                          <a
                            href={job.deliverableNotes}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: C.primary, color: "#fff", padding: "6px 14px", borderRadius: C.radiusSm, fontSize: "12px", fontWeight: 700, textDecoration: "none" }}
                          >
                            <ExternalLink size={13} /> Open Cloud Gallery
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* TAB 2: INVOICES & BILLING */}
        {activeTab === "invoices" && (
          <div style={{ background: C.card, borderRadius: C.radius, border: `1px solid ${C.border}`, overflow: "hidden" }}>
            {client.invoices?.length === 0 ? (
              <div style={{ padding: "40px", textAlign: "center", color: C.muted }}>
                <Receipt size={36} style={{ margin: "0 auto 10px", opacity: 0.5 }} />
                <p>No invoices issued yet.</p>
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ background: "#F8FAFC", borderBottom: `1px solid ${C.border}`, textAlign: "left" }}>
                    <th style={{ padding: "12px 16px", color: C.muted, fontWeight: 600 }}>INVOICE #</th>
                    <th style={{ padding: "12px 16px", color: C.muted, fontWeight: 600 }}>DATE</th>
                    <th style={{ padding: "12px 16px", color: C.muted, fontWeight: 600 }}>ITEMS</th>
                    <th style={{ padding: "12px 16px", color: C.muted, fontWeight: 600 }}>GST 18%</th>
                    <th style={{ padding: "12px 16px", color: C.muted, fontWeight: 600 }}>TOTAL (₹)</th>
                    <th style={{ padding: "12px 16px", color: C.muted, fontWeight: 600 }}>STATUS</th>
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
                        {inv.items?.length || 1} line item(s)
                      </td>
                      <td style={{ padding: "14px 16px", color: C.muted }}>
                        ₹{inv.taxAmount.toLocaleString("en-IN")}
                      </td>
                      <td style={{ padding: "14px 16px", fontWeight: 800, color: C.text }}>
                        ₹{inv.totalAmount.toLocaleString("en-IN")}
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <span style={{
                          padding: "4px 10px",
                          borderRadius: "4px",
                          fontSize: "11px",
                          fontWeight: 700,
                          background: inv.status === "PAID" ? "#ECFDF5" : "#EFF6FF",
                          color: inv.status === "PAID" ? C.success : C.primary,
                        }}>
                          {inv.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* TAB 3: CONTRACT RATES */}
        {activeTab === "rates" && (
          <div style={{ background: C.card, borderRadius: C.radius, border: `1px solid ${C.border}`, padding: "24px" }}>
            <h3 style={{ margin: "0 0 16px", fontSize: "16px", fontWeight: 700, color: C.text }}>Contracted Studio Unit Pricing</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
              <div style={{ padding: "16px", background: "#F8FAFC", borderRadius: C.radiusSm, border: `1px solid ${C.border}` }}>
                <span style={{ fontSize: "12px", color: C.muted }}>Photo Culling</span>
                <div style={{ fontSize: "20px", fontWeight: 800, color: C.text, marginTop: "4px" }}>
                  ₹{client.rateCard?.photoCullingPerImage || 3} <span style={{ fontSize: "12px", fontWeight: 400, color: C.muted }}>/ image</span>
                </div>
              </div>
              <div style={{ padding: "16px", background: "#F8FAFC", borderRadius: C.radiusSm, border: `1px solid ${C.border}` }}>
                <span style={{ fontSize: "12px", color: C.muted }}>Color Correction</span>
                <div style={{ fontSize: "20px", fontWeight: 800, color: C.text, marginTop: "4px" }}>
                  ₹{client.rateCard?.photoColorPerImage || 8} <span style={{ fontSize: "12px", fontWeight: 400, color: C.muted }}>/ image</span>
                </div>
              </div>
              <div style={{ padding: "16px", background: "#F8FAFC", borderRadius: C.radiusSm, border: `1px solid ${C.border}` }}>
                <span style={{ fontSize: "12px", color: C.muted }}>High-End Retouch</span>
                <div style={{ fontSize: "20px", fontWeight: 800, color: C.text, marginTop: "4px" }}>
                  ₹{client.rateCard?.photoRetouchPerImage || 25} <span style={{ fontSize: "12px", fontWeight: 400, color: C.muted }}>/ image</span>
                </div>
              </div>
              <div style={{ padding: "16px", background: "#F8FAFC", borderRadius: C.radiusSm, border: `1px solid ${C.border}` }}>
                <span style={{ fontSize: "12px", color: C.muted }}>Video Editing</span>
                <div style={{ fontSize: "20px", fontWeight: 800, color: C.text, marginTop: "4px" }}>
                  ₹{client.rateCard?.videoEditingPerMinute || 200} <span style={{ fontSize: "12px", fontWeight: 400, color: C.muted }}>/ min</span>
                </div>
              </div>
              <div style={{ padding: "16px", background: "#F8FAFC", borderRadius: C.radiusSm, border: `1px solid ${C.border}` }}>
                <span style={{ fontSize: "12px", color: C.muted }}>Social Reels</span>
                <div style={{ fontSize: "20px", fontWeight: 800, color: C.text, marginTop: "4px" }}>
                  ₹{client.rateCard?.reelEditingPerItem || 750} <span style={{ fontSize: "12px", fontWeight: 400, color: C.muted }}>/ reel</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
