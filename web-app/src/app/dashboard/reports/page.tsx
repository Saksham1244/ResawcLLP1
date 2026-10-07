"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  BarChart2, TrendingUp, DollarSign, Film, Users, Calendar,
  Receipt, ArrowUpRight, CheckCircle2, Clock, AlertTriangle,
  Download, Printer, ChevronRight, Award, Image as ImageIcon, Video, Percent
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

export default function ReportsPage() {
  const { user } = useRole();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "finance" | "production" | "marketing">("overview");

  const fetchReports = async () => {
    try {
      setLoading(true);
      const token = typeof window !== 'undefined' ? (localStorage.getItem("authToken") || localStorage.getItem("token")) : null;
      const res = await fetch("/api/analytics/reports", {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch (err) {
      console.error("Error loading analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <div style={{ textAlign: "center", color: C.muted }}>
          <div style={{ width: 36, height: 36, border: `3px solid ${C.border}`, borderTopColor: C.primary, borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 12px" }} />
          <p style={{ fontSize: "14px" }}>Aggregating Analytics & Financial Intelligence...</p>
        </div>
      </div>
    );
  }

  const finance = data?.finance || {};
  const production = data?.production || {};
  const marketing = data?.marketing || {};
  const team = data?.team || {};

  return (
    <RoleGuard allowedRoles={["admin", "marketing"]}>
      <div style={{ maxWidth: 1280, margin: "0 auto", paddingBottom: "60px" }}>
        {/* Header Bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginBottom: "24px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ padding: "8px", background: "#EFF6FF", borderRadius: "8px", color: C.primary }}>
                <BarChart2 size={24} />
              </div>
              <h1 style={{ fontSize: "24px", fontWeight: 800, color: C.text, margin: 0 }}>
                Reports & Business Analytics
              </h1>
            </div>
            <p style={{ margin: "4px 0 0", fontSize: "14px", color: C.muted }}>
              Real-time financial intelligence, editing throughput, and team productivity across India operations
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <button
              onClick={() => window.print()}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 16px",
                borderRadius: C.radiusSm,
                border: `1px solid ${C.border}`,
                background: "#fff",
                color: C.text,
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <Printer size={15} /> Print / Export PDF
            </button>
            <button
              onClick={fetchReports}
              style={{
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
              Refresh Data
            </button>
          </div>
        </div>

        {/* 4 Top KPI Summary Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px", marginBottom: "24px" }}>
          {/* Revenue */}
          <div style={{ background: C.card, padding: "20px", borderRadius: C.radius, border: `1px solid ${C.border}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
              <span style={{ fontSize: "12px", fontWeight: 700, color: C.muted, textTransform: "uppercase" }}>Total Collected</span>
              <span style={{ padding: "3px 8px", borderRadius: "4px", background: "#ECFDF5", color: C.success, fontSize: "11px", fontWeight: 700 }}>
                {finance.collectionRate || 100}% cleared
              </span>
            </div>
            <div style={{ fontSize: "26px", fontWeight: 800, color: C.text }}>
              ₹{(finance.totalCollected || 0).toLocaleString("en-IN")}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: C.muted, marginTop: "6px" }}>
              <span>Total Invoiced: ₹{(finance.totalBilled || 0).toLocaleString("en-IN")}</span>
              <span style={{ color: finance.totalOutstanding > 0 ? C.danger : C.muted }}>
                Due: ₹{(finance.totalOutstanding || 0).toLocaleString("en-IN")}
              </span>
            </div>
          </div>

          {/* Production Output */}
          <div style={{ background: C.card, padding: "20px", borderRadius: C.radius, border: `1px solid ${C.border}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
              <span style={{ fontSize: "12px", fontWeight: 700, color: C.muted, textTransform: "uppercase" }}>Photos Edited</span>
              <span style={{ padding: "3px 8px", borderRadius: "4px", background: "#EFF6FF", color: C.primary, fontSize: "11px", fontWeight: 700 }}>
                {production.deliveryRate || 0}% jobs delivered
              </span>
            </div>
            <div style={{ fontSize: "26px", fontWeight: 800, color: C.text }}>
              {(production.totalPhotosCompleted || 0).toLocaleString("en-IN")}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: C.muted, marginTop: "6px" }}>
              <span>{production.deliveredJobs || 0} / {production.totalJobs || 0} jobs completed</span>
              <span>{production.totalVideoMinutes || 0} video mins</span>
            </div>
          </div>

          {/* Marketing Conversion */}
          <div style={{ background: C.card, padding: "20px", borderRadius: C.radius, border: `1px solid ${C.border}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
              <span style={{ fontSize: "12px", fontWeight: 700, color: C.muted, textTransform: "uppercase" }}>Pipeline Conversion</span>
              <span style={{ padding: "3px 8px", borderRadius: "4px", background: "#FAF5FF", color: "#7C3AED", fontSize: "11px", fontWeight: 700 }}>
                {marketing.conversionRate || 0}% win rate
              </span>
            </div>
            <div style={{ fontSize: "26px", fontWeight: 800, color: C.text }}>
              {marketing.funnel?.CONVERTED || 0} <span style={{ fontSize: "16px", color: C.muted, fontWeight: 500 }}>clients won</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: C.muted, marginTop: "6px" }}>
              <span>Total Inquiries: {marketing.totalLeads || 0}</span>
              <span>{marketing.totalFollowUps || 0} touchpoints</span>
            </div>
          </div>

          {/* Team & Payroll */}
          <div style={{ background: C.card, padding: "20px", borderRadius: C.radius, border: `1px solid ${C.border}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
              <span style={{ fontSize: "12px", fontWeight: 700, color: C.muted, textTransform: "uppercase" }}>Payroll & Team</span>
              <span style={{ padding: "3px 8px", borderRadius: "4px", background: "#FFFBEB", color: C.warning, fontSize: "11px", fontWeight: 700 }}>
                {team.totalEmployees || 0} Editors
              </span>
            </div>
            <div style={{ fontSize: "26px", fontWeight: 800, color: C.text }}>
              ₹{(team.totalPayrollSpent || 0).toLocaleString("en-IN")}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: C.muted, marginTop: "6px" }}>
              <span>OT Hours: {team.totalOtHours || 0} hrs</span>
              <span>{team.payslipsGenerated || 0} payslips issued</span>
            </div>
          </div>
        </div>

        {/* Tab Row */}
        <div style={{ display: "flex", gap: "8px", borderBottom: `1px solid ${C.border}`, marginBottom: "24px" }}>
          {[
            { key: "overview", label: "Executive Overview", icon: TrendingUp },
            { key: "finance", label: "Finance & GST Tax", icon: DollarSign },
            { key: "production", label: "Editing Production", icon: Film },
            { key: "marketing", label: "Marketing & Leads Funnel", icon: Users },
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

        {/* TAB 1: EXECUTIVE OVERVIEW */}
        {activeTab === "overview" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Visual Revenue Trend & Production Category Charts */}
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "20px" }}>
              {/* Monthly Revenue Bar Chart (SVG) */}
              <div style={{ background: C.card, borderRadius: C.radius, border: `1px solid ${C.border}`, padding: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: C.text }}>Monthly Invoiced vs Collected (INR ₹)</h3>
                    <p style={{ margin: "4px 0 0", fontSize: "12px", color: C.muted }}>Historical billing velocity across recent calendar months</p>
                  </div>
                  <div style={{ display: "flex", gap: "12px", fontSize: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ width: 12, height: 12, background: C.primary, borderRadius: 2 }} />
                      <span>Billed</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ width: 12, height: 12, background: C.success, borderRadius: 2 }} />
                      <span>Collected</span>
                    </div>
                  </div>
                </div>

                {/* SVG Visual Bars */}
                {finance.monthlyRevenueTrend?.length === 0 ? (
                  <div style={{ height: "200px", display: "flex", alignItems: "center", justifyContent: "center", color: C.muted }}>
                    No historical monthly billing records found.
                  </div>
                ) : (
                  <div style={{ display: "flex", alignItems: "flex-end", height: "220px", gap: "20px", padding: "10px 10px 30px", borderBottom: `1px solid ${C.border}` }}>
                    {finance.monthlyRevenueTrend?.map((item: any) => {
                      const maxVal = Math.max(...finance.monthlyRevenueTrend.map((m: any) => Math.max(m.billed, m.collected)), 10000);
                      const billedHeight = Math.max(10, Math.round((item.billed / maxVal) * 160));
                      const collectedHeight = Math.max(10, Math.round((item.collected / maxVal) * 160));
                      return (
                        <div key={item.month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                          <div style={{ display: "flex", gap: "6px", alignItems: "flex-end", height: "160px" }}>
                            <div
                              title={`Billed: ₹${item.billed.toLocaleString("en-IN")}`}
                              style={{ width: "24px", height: `${billedHeight}px`, background: C.primary, borderRadius: "4px 4px 0 0", transition: "height 0.4s" }}
                            />
                            <div
                              title={`Collected: ₹${item.collected.toLocaleString("en-IN")}`}
                              style={{ width: "24px", height: `${collectedHeight}px`, background: C.success, borderRadius: "4px 4px 0 0", transition: "height 0.4s" }}
                            />
                          </div>
                          <span style={{ fontSize: "11px", fontWeight: 600, color: C.muted, marginTop: "8px" }}>
                            {item.month}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Category Breakdown Card */}
              <div style={{ background: C.card, borderRadius: C.radius, border: `1px solid ${C.border}`, padding: "24px" }}>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: C.text }}>Service Category Distribution</h3>
                <p style={{ margin: "4px 0 20px", fontSize: "12px", color: C.muted }}>Distribution of jobs by production stream</p>

                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "6px" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: "6px" }}><ImageIcon size={14} color={C.primary} /> Wedding & Event Photos</span>
                      <strong>{production.categoryBreakdown?.PHOTO || 0} jobs</strong>
                    </div>
                    <div style={{ height: 8, background: "#E5E7EB", borderRadius: 4, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${production.totalJobs ? ((production.categoryBreakdown?.PHOTO || 0) / production.totalJobs) * 100 : 0}%`, background: C.primary }} />
                    </div>
                  </div>

                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "6px" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: "6px" }}><Video size={14} color="#7C3AED" /> Video Editing & Films</span>
                      <strong>{production.categoryBreakdown?.VIDEO || 0} jobs</strong>
                    </div>
                    <div style={{ height: 8, background: "#E5E7EB", borderRadius: 4, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${production.totalJobs ? ((production.categoryBreakdown?.VIDEO || 0) / production.totalJobs) * 100 : 0}%`, background: "#7C3AED" }} />
                    </div>
                  </div>

                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "6px" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: "6px" }}><Film size={14} color={C.warning} /> Reels / Shorts</span>
                      <strong>{production.categoryBreakdown?.REEL || 0} jobs</strong>
                    </div>
                    <div style={{ height: 8, background: "#E5E7EB", borderRadius: 4, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${production.totalJobs ? ((production.categoryBreakdown?.REEL || 0) / production.totalJobs) * 100 : 0}%`, background: C.warning }} />
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: "24px", padding: "14px", background: "#F8FAFC", borderRadius: C.radiusSm, border: `1px solid ${C.border}`, fontSize: "12px", color: C.muted }}>
                  Adherence Rate: <strong style={{ color: production.overdueJobs > 0 ? C.danger : C.success }}>{production.totalJobs > 0 ? Math.round(((production.totalJobs - production.overdueJobs) / production.totalJobs) * 100) : 100}%</strong>
                  {production.overdueJobs > 0 && <span style={{ color: C.danger, display: "block", marginTop: "2px" }}>● {production.overdueJobs} jobs currently past deadline</span>}
                </div>
              </div>
            </div>

            {/* Top Revenue Clients */}
            <div style={{ background: C.card, borderRadius: C.radius, border: `1px solid ${C.border}`, padding: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: C.text }}>Top Client Accounts by Revenue</h3>
                  <p style={{ margin: "4px 0 0", fontSize: "12px", color: C.muted }}>Key photography studios and cinematic creators driving agency revenue</p>
                </div>
                <Link href="/dashboard/clients" style={{ fontSize: "13px", color: C.primary, textDecoration: "none", fontWeight: 600 }}>
                  View All Clients →
                </Link>
              </div>

              {finance.topClientsByRevenue?.length === 0 ? (
                <p style={{ color: C.muted, fontSize: "13px" }}>No client billing records available.</p>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ background: "#F9FAFB", borderBottom: `1px solid ${C.border}`, textAlign: "left" }}>
                      <th style={{ padding: "10px 14px", color: C.muted, fontWeight: 600 }}>CLIENT ID</th>
                      <th style={{ padding: "10px 14px", color: C.muted, fontWeight: 600 }}>STUDIO / COMPANY</th>
                      <th style={{ padding: "10px 14px", color: C.muted, fontWeight: 600 }}>BILLED (₹)</th>
                      <th style={{ padding: "10px 14px", color: C.muted, fontWeight: 600 }}>PAID (₹)</th>
                      <th style={{ padding: "10px 14px", color: C.muted, fontWeight: 600 }}>OUTSTANDING (₹)</th>
                      <th style={{ padding: "10px 14px", color: C.muted, fontWeight: 600 }}>ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {finance.topClientsByRevenue?.map((cl: any) => {
                      const balance = Math.max(0, cl.billed - cl.paid);
                      return (
                        <tr key={cl.clientId} style={{ borderBottom: `1px solid ${C.border}` }}>
                          <td style={{ padding: "12px 14px", fontWeight: 700, color: C.primary }}>
                            {cl.clientId}
                          </td>
                          <td style={{ padding: "12px 14px", fontWeight: 600, color: C.text }}>
                            {cl.companyName}
                          </td>
                          <td style={{ padding: "12px 14px", fontWeight: 700, color: C.text }}>
                            ₹{cl.billed.toLocaleString("en-IN")}
                          </td>
                          <td style={{ padding: "12px 14px", fontWeight: 700, color: C.success }}>
                            ₹{cl.paid.toLocaleString("en-IN")}
                          </td>
                          <td style={{ padding: "12px 14px", fontWeight: 700, color: balance > 0 ? C.danger : C.muted }}>
                            ₹{balance.toLocaleString("en-IN")}
                          </td>
                          <td style={{ padding: "12px 14px" }}>
                            <Link
                              href={`/dashboard/clients`}
                              style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: C.primary, textDecoration: "none", fontWeight: 600, fontSize: "12px" }}
                            >
                              360° Profile <ArrowUpRight size={13} />
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: FINANCE & GST TAX */}
        {activeTab === "finance" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* GST Tax Compliance Audit Card */}
            <div style={{ background: C.card, borderRadius: C.radius, border: `1px solid ${C.border}`, padding: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: C.text }}>18% GST Statutory Audit Breakdown</h3>
                  <p style={{ margin: "4px 0 0", fontSize: "12px", color: C.muted }}>Universal Goods and Services Tax ledger for Indian tax compliance (CGST 9% + SGST 9%)</p>
                </div>
                <span style={{ fontSize: "12px", fontWeight: 700, padding: "4px 10px", background: "#EFF6FF", color: C.primary, borderRadius: "4px" }}>
                  GSTIN Compliant (18%)
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
                <div style={{ padding: "16px", background: "#F8FAFC", borderRadius: C.radiusSm, border: `1px solid ${C.border}` }}>
                  <span style={{ fontSize: "11px", color: C.muted, fontWeight: 600, textTransform: "uppercase" }}>Total Tax Billed (18%)</span>
                  <div style={{ fontSize: "22px", fontWeight: 800, color: C.text, marginTop: "4px" }}>
                    ₹{(finance.totalTaxAmount || 0).toLocaleString("en-IN")}
                  </div>
                </div>

                <div style={{ padding: "16px", background: "#F8FAFC", borderRadius: C.radiusSm, border: `1px solid ${C.border}` }}>
                  <span style={{ fontSize: "11px", color: C.muted, fontWeight: 600, textTransform: "uppercase" }}>CGST (Central GST 9%)</span>
                  <div style={{ fontSize: "22px", fontWeight: 800, color: C.primary, marginTop: "4px" }}>
                    ₹{(finance.cgstAmount || 0).toLocaleString("en-IN")}
                  </div>
                </div>

                <div style={{ padding: "16px", background: "#F8FAFC", borderRadius: C.radiusSm, border: `1px solid ${C.border}` }}>
                  <span style={{ fontSize: "11px", color: C.muted, fontWeight: 600, textTransform: "uppercase" }}>SGST (State GST 9%)</span>
                  <div style={{ fontSize: "22px", fontWeight: 800, color: C.primary, marginTop: "4px" }}>
                    ₹{(finance.sgstAmount || 0).toLocaleString("en-IN")}
                  </div>
                </div>

                <div style={{ padding: "16px", background: "#F0FDF4", borderRadius: C.radiusSm, border: "1px solid #BBF7D0" }}>
                  <span style={{ fontSize: "11px", color: "#166534", fontWeight: 600, textTransform: "uppercase" }}>Net Collections (INR ₹)</span>
                  <div style={{ fontSize: "22px", fontWeight: 800, color: C.success, marginTop: "4px" }}>
                    ₹{(finance.totalCollected || 0).toLocaleString("en-IN")}
                  </div>
                </div>
              </div>
            </div>

            {/* Invoices Status Breakdown */}
            <div style={{ background: C.card, borderRadius: C.radius, border: `1px solid ${C.border}`, padding: "24px" }}>
              <h3 style={{ margin: "0 0 16px", fontSize: "16px", fontWeight: 700, color: C.text }}>Invoicing Health & Collection Status</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "14px" }}>
                <div style={{ padding: "14px", borderRadius: C.radiusSm, background: "#ECFDF5", border: "1px solid #A7F3D0" }}>
                  <span style={{ fontSize: "12px", color: "#065F46", fontWeight: 600 }}>Paid & Cleared</span>
                  <div style={{ fontSize: "20px", fontWeight: 800, color: C.success, marginTop: "4px" }}>
                    {finance.invoiceStatusCount?.PAID || 0} invoices
                  </div>
                </div>
                <div style={{ padding: "14px", borderRadius: C.radiusSm, background: "#EFF6FF", border: "1px solid #BFDBFE" }}>
                  <span style={{ fontSize: "12px", color: "#1E40AF", fontWeight: 600 }}>Dispatched / Sent</span>
                  <div style={{ fontSize: "20px", fontWeight: 800, color: C.primary, marginTop: "4px" }}>
                    {finance.invoiceStatusCount?.SENT || 0} invoices
                  </div>
                </div>
                <div style={{ padding: "14px", borderRadius: C.radiusSm, background: "#FFFBEB", border: "1px solid #FDE68A" }}>
                  <span style={{ fontSize: "12px", color: "#92400E", fontWeight: 600 }}>Draft Invoices</span>
                  <div style={{ fontSize: "20px", fontWeight: 800, color: C.warning, marginTop: "4px" }}>
                    {finance.invoiceStatusCount?.DRAFT || 0} invoices
                  </div>
                </div>
                <div style={{ padding: "14px", borderRadius: C.radiusSm, background: "#FEF2F2", border: "1px solid #FECACA" }}>
                  <span style={{ fontSize: "12px", color: "#991B1B", fontWeight: 600 }}>Overdue Receivables</span>
                  <div style={{ fontSize: "20px", fontWeight: 800, color: C.danger, marginTop: "4px" }}>
                    {finance.invoiceStatusCount?.OVERDUE || 0} invoices
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: EDITING PRODUCTION */}
        {activeTab === "production" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Editor Leaderboard */}
            <div style={{ background: C.card, borderRadius: C.radius, border: `1px solid ${C.border}`, padding: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: C.text }}>Editor Production Leaderboard</h3>
                  <p style={{ margin: "4px 0 0", fontSize: "12px", color: C.muted }}>Completed photo retouching & video deliverables by team member</p>
                </div>
                <span style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: C.muted }}>
                  <Award size={15} color={C.warning} /> Performance Rankings
                </span>
              </div>

              {production.editorLeaderboard?.length === 0 ? (
                <p style={{ color: C.muted, fontSize: "13px" }}>No production logs assigned to editors yet.</p>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ background: "#F9FAFB", borderBottom: `1px solid ${C.border}`, textAlign: "left" }}>
                      <th style={{ padding: "10px 14px", color: C.muted, fontWeight: 600 }}>EDITOR</th>
                      <th style={{ padding: "10px 14px", color: C.muted, fontWeight: 600 }}>SPECIALIZATION</th>
                      <th style={{ padding: "10px 14px", color: C.muted, fontWeight: 600 }}>ASSIGNED JOBS</th>
                      <th style={{ padding: "10px 14px", color: C.muted, fontWeight: 600 }}>DELIVERED</th>
                      <th style={{ padding: "10px 14px", color: C.muted, fontWeight: 600 }}>PHOTOS EDITED</th>
                      <th style={{ padding: "10px 14px", color: C.muted, fontWeight: 600 }}>VIDEO MINS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {production.editorLeaderboard?.map((ed: any, idx: number) => (
                      <tr key={ed.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                        <td style={{ padding: "12px 14px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <div style={{ width: 26, height: 26, borderRadius: "50%", background: idx === 0 ? "#FEF3C7" : "#EFF6FF", color: idx === 0 ? "#B45309" : C.primary, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700 }}>
                              {idx + 1}
                            </div>
                            <span style={{ fontWeight: 700, color: C.text }}>{ed.name}</span>
                          </div>
                        </td>
                        <td style={{ padding: "12px 14px", color: C.muted }}>
                          {ed.role}
                        </td>
                        <td style={{ padding: "12px 14px", color: C.text, fontWeight: 600 }}>
                          {ed.assignedCount}
                        </td>
                        <td style={{ padding: "12px 14px", color: C.success, fontWeight: 700 }}>
                          {ed.deliveredCount}
                        </td>
                        <td style={{ padding: "12px 14px", fontWeight: 700, color: C.primary }}>
                          {ed.photosCompleted.toLocaleString("en-IN")}
                        </td>
                        <td style={{ padding: "12px 14px", color: C.text }}>
                          {ed.videoMinutes} mins
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: MARKETING & LEADS */}
        {activeTab === "marketing" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div style={{ background: C.card, borderRadius: C.radius, border: `1px solid ${C.border}`, padding: "24px" }}>
              <h3 style={{ margin: "0 0 16px", fontSize: "16px", fontWeight: 700, color: C.text }}>Lead-to-Client Acquisition Funnel</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
                <div style={{ padding: "16px", background: "#F8FAFC", borderRadius: C.radiusSm, border: `1px solid ${C.border}` }}>
                  <span style={{ fontSize: "12px", color: C.muted, fontWeight: 600 }}>1. New Inquiries</span>
                  <div style={{ fontSize: "24px", fontWeight: 800, color: C.text, marginTop: "6px" }}>
                    {marketing.funnel?.NEW || 0}
                  </div>
                </div>
                <div style={{ padding: "16px", background: "#FAF5FF", borderRadius: C.radiusSm, border: "1px solid #E9D5FF" }}>
                  <span style={{ fontSize: "12px", color: "#6B21A8", fontWeight: 600 }}>2. Contacted / Pitch</span>
                  <div style={{ fontSize: "24px", fontWeight: 800, color: "#7C3AED", marginTop: "6px" }}>
                    {marketing.funnel?.CONTACTED || 0}
                  </div>
                </div>
                <div style={{ padding: "16px", background: "#EFF6FF", borderRadius: C.radiusSm, border: "1px solid #BFDBFE" }}>
                  <span style={{ fontSize: "12px", color: "#1E40AF", fontWeight: 600 }}>3. Free Trial Samples</span>
                  <div style={{ fontSize: "24px", fontWeight: 800, color: C.primary, marginTop: "6px" }}>
                    {marketing.funnel?.TRIAL || 0}
                  </div>
                </div>
                <div style={{ padding: "16px", background: "#ECFDF5", borderRadius: C.radiusSm, border: "1px solid #A7F3D0" }}>
                  <span style={{ fontSize: "12px", color: "#065F46", fontWeight: 600 }}>4. Converted Clients</span>
                  <div style={{ fontSize: "24px", fontWeight: 800, color: C.success, marginTop: "6px" }}>
                    {marketing.funnel?.CONVERTED || 0}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
