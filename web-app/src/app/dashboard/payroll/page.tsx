"use client";

import { useState, useEffect } from "react";
import {
  Wallet, Plus, Search, Filter, CheckCircle2, Clock,
  AlertCircle, Download, Printer, ExternalLink, Trash2,
  Building2, CreditCard, ChevronDown, Check, X, ArrowUpRight,
  Sparkles, DollarSign, Edit3, UserCheck, Calendar, ShieldCheck
} from "lucide-react";
import { RoleGuard } from "@/components/RoleGuard";
import { useRole } from "@/context/RoleContext";
import { numberToWordsIndian } from "@/lib/number-to-words";

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

interface Payslip {
  id: string;
  payslipNumber: string;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    salaryStructure?: {
      baseSalary: number;
      hourlyOvertimeRate: number;
      allowance: number;
      bankName?: string;
      bankAccountNumber?: string;
      ifscCode?: string;
      panNumber?: string;
      upiId?: string;
    };
  };
  monthYear: string;
  daysInMonth: number;
  workingDays: number;
  presentDays: number;
  paidLeaves: number;
  unpaidLeaves: number;
  overtimeHours: number;
  lateDays: number;
  baseSalary: number;
  earnedBasic: number;
  allowances: number;
  overtimePay: number;
  bonus: number;
  grossEarnings: number;
  lateDeductions: number;
  unpaidLeaveDeductions: number;
  otherDeductions: number;
  totalDeductions: number;
  netSalary: number;
  status: string;
  paymentDate?: string;
  paymentReference?: string;
  notes?: string;
  createdAt: string;
  companySettings?: any;
}

export default function PayrollPage() {
  const { user } = useRole();
  const isAdmin = user?.role === "admin";

  const currentMonthYear = new Date().toISOString().slice(0, 7); // e.g. "2026-10"

  const [selectedMonth, setSelectedMonth] = useState(currentMonthYear);
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [summary, setSummary] = useState({
    totalPayroll: 0,
    paidPayroll: 0,
    pendingPayroll: 0,
    count: 0,
  });
  const [loading, setLoading] = useState(true);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [companySettings, setCompanySettings] = useState<any>(null);

  // Modals
  const [showRunModal, setShowRunModal] = useState(false);
  const [showStructureModal, setShowStructureModal] = useState(false);
  const [showPayslipModal, setShowPayslipModal] = useState(false);
  const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(null);
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedForPay, setSelectedForPay] = useState<Payslip | null>(null);

  // Run Form State
  const [runForm, setRunForm] = useState({
    monthYear: currentMonthYear,
    notes: "Monthly payroll run calculated from attendance and overtime",
  });
  const [runningPayroll, setRunningPayroll] = useState(false);

  // Structure Form State
  const [structureForm, setStructureForm] = useState({
    userId: "",
    baseSalary: 25000,
    hourlyOvertimeRate: 150,
    allowance: 0,
    bankName: "HDFC Bank",
    bankAccountNumber: "",
    ifscCode: "",
    panNumber: "",
    upiId: "",
  });
  const [savingStructure, setSavingStructure] = useState(false);

  // Payment Mark State
  const [payForm, setPayForm] = useState({
    paymentDate: new Date().toISOString().split("T")[0],
    paymentReference: "",
  });

  const fetchPayslips = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedMonth) params.set("month", selectedMonth);
      if (!isAdmin && user?.id) {
        params.set("userId", user.id);
      }

      const res = await fetch(`/api/finance/payroll?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setPayslips(data.data);
        if (data.summary) setSummary(data.summary);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeam = async () => {
    if (!isAdmin) return;
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      if (data.success) {
        const nonAdmins = data.data.filter((m: any) => m.role?.toUpperCase() !== "ADMIN");
        setTeamMembers(nonAdmins);
        if (nonAdmins.length > 0 && !structureForm.userId) {
          setStructureForm(prev => ({ ...prev, userId: nonAdmins[0].id }));
        }
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchPayslips();
  }, [selectedMonth, user?.id, user?.role]);

  useEffect(() => {
    fetchTeam();
  }, [isAdmin]);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.data) setCompanySettings(d.data);
      })
      .catch(() => {});
  }, []);

  const handleRunPayroll = async (e: React.FormEvent) => {
    e.preventDefault();
    setRunningPayroll(true);
    try {
      const res = await fetch("/api/finance/payroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(runForm),
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message || "Payroll calculated successfully!");
        setShowRunModal(false);
        fetchPayslips();
      } else {
        alert(data.error || "Failed to calculate payroll");
      }
    } catch {
      alert("Network error");
    } finally {
      setRunningPayroll(false);
    }
  };

  const handleSaveStructure = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingStructure(true);
    try {
      const res = await fetch("/api/finance/salary-structure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(structureForm),
      });
      const data = await res.json();
      if (data.success) {
        alert("Salary structure updated successfully!");
        setShowStructureModal(false);
        fetchPayslips();
      } else {
        alert(data.error || "Failed to save salary structure");
      }
    } catch {
      alert("Network error");
    } finally {
      setSavingStructure(false);
    }
  };

  const handleMarkPaid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedForPay) return;
    try {
      const res = await fetch("/api/finance/payroll", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedForPay.id,
          status: "PAID",
          paymentDate: payForm.paymentDate,
          paymentReference: payForm.paymentReference,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowPayModal(false);
        fetchPayslips();
      } else {
        alert(data.error || "Failed to mark paid");
      }
    } catch {
      alert("Network error");
    }
  };

  return (
    <RoleGuard allowedRoles={["admin", "photo_editor", "video_editor", "editor", "marketing"]}>
      <div style={{ maxWidth: "1280px", margin: "0 auto", paddingBottom: "3rem" }}>

        {/* ── Page Header ── */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "flex-start",
          marginBottom: "1.75rem", flexWrap: "wrap", gap: "1rem"
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <h1 style={{ fontSize: "1.65rem", fontWeight: 800, color: C.text, letterSpacing: "-0.03em", margin: 0 }}>
                {isAdmin ? "Employee Payroll & Monthly Payslips" : "My Monthly Payslips"}
              </h1>
              <span style={{
                background: "#ECFDF5", color: "#059669", fontSize: "0.75rem", fontWeight: 700,
                padding: "2px 8px", borderRadius: "999px", border: "1px solid #A7F3D0"
              }}>
                INR (₹) Automated Engine
              </span>
            </div>
            <p style={{ color: C.muted, fontSize: "0.9rem", margin: "4px 0 0" }}>
              {isAdmin
                ? "Batch calculate monthly salaries based on attendance, overtime hours, and transparent deductions."
                : "View and download itemized monthly payslips with transparent hours and overtime earnings."}
            </p>
          </div>

          {isAdmin && (
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={() => setShowStructureModal(true)}
                style={{
                  display: "flex", alignItems: "center", gap: "6px",
                  background: "#FFFFFF", color: C.text,
                  padding: "0.6rem 1rem", borderRadius: C.radiusSm,
                  fontSize: "0.85rem", fontWeight: 600, border: `1px solid ${C.border}`,
                  cursor: "pointer"
                }}
              >
                <Edit3 size={15} color={C.muted} /> Salary Structures
              </button>

              <button
                onClick={() => setShowRunModal(true)}
                style={{
                  display: "flex", alignItems: "center", gap: "6px",
                  background: C.primary, color: "#fff",
                  padding: "0.6rem 1.25rem", borderRadius: C.radiusSm,
                  fontSize: "0.85rem", fontWeight: 600, border: "none",
                  cursor: "pointer", boxShadow: "0 2px 6px rgba(26,86,219,0.25)"
                }}
              >
                <Sparkles size={16} /> Run Monthly Payroll
              </button>
            </div>
          )}
        </div>

        {/* ── Summary Stats Row (Admin Only) ── */}
        {isAdmin && (
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
            gap: "12px", marginBottom: "1.75rem"
          }}>
            <div style={{ background: C.card, padding: "1.1rem 1.25rem", borderRadius: C.radius, border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: "0.78rem", fontWeight: 600, color: C.muted, textTransform: "uppercase" }}>Total Monthly Payroll</div>
              <div style={{ fontSize: "1.5rem", fontWeight: 800, color: C.text, marginTop: "4px" }}>
                ₹{summary.totalPayroll.toLocaleString("en-IN")}
              </div>
              <div style={{ fontSize: "0.75rem", color: C.muted, marginTop: "4px" }}>
                For month: {selectedMonth}
              </div>
            </div>

            <div style={{ background: C.card, padding: "1.1rem 1.25rem", borderRadius: C.radius, border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "#059669", textTransform: "uppercase" }}>Disbursed (Paid)</div>
              <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#059669", marginTop: "4px" }}>
                ₹{summary.paidPayroll.toLocaleString("en-IN")}
              </div>
              <div style={{ fontSize: "0.75rem", color: "#059669", marginTop: "4px" }}>
                Transferred to bank accounts
              </div>
            </div>

            <div style={{ background: C.card, padding: "1.1rem 1.25rem", borderRadius: C.radius, border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "#D97706", textTransform: "uppercase" }}>Pending Disbursement</div>
              <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#D97706", marginTop: "4px" }}>
                ₹{summary.pendingPayroll.toLocaleString("en-IN")}
              </div>
              <div style={{ fontSize: "0.75rem", color: "#D97706", marginTop: "4px" }}>
                Awaiting approval / payout
              </div>
            </div>

            <div style={{ background: C.card, padding: "1.1rem 1.25rem", borderRadius: C.radius, border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: "0.78rem", fontWeight: 600, color: C.primary, textTransform: "uppercase" }}>Employees on Payroll</div>
              <div style={{ fontSize: "1.5rem", fontWeight: 800, color: C.primary, marginTop: "4px" }}>
                {summary.count}
              </div>
              <div style={{ fontSize: "0.75rem", color: C.muted, marginTop: "4px" }}>
                Production, Video & Marketing
              </div>
            </div>
          </div>
        )}

        {/* ── Filter Bar ── */}
        <div style={{
          background: C.card, borderRadius: C.radius, border: `1px solid ${C.border}`,
          padding: "0.85rem 1.25rem", marginBottom: "1.25rem",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          flexWrap: "wrap", gap: "1rem"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "0.82rem", fontWeight: 700, color: C.text }}>Select Month:</span>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              style={{
                padding: "0.4rem 0.75rem", borderRadius: C.radiusSm, border: `1px solid ${C.border}`,
                fontSize: "0.85rem", fontWeight: 600, color: C.text, outline: "none",
                background: "#FFFFFF", colorScheme: "light"
              }}
            />
          </div>

          <div style={{ fontSize: "0.82rem", color: C.muted }}>
            Showing <strong>{payslips.length}</strong> payslip record(s) for <strong>{selectedMonth}</strong>
          </div>
        </div>

        {/* ── Payslips Table ── */}
        <div style={{ background: C.card, borderRadius: C.radius, border: `1px solid ${C.border}`, overflow: "hidden" }}>
          {loading ? (
            <div style={{ padding: "3rem", textAlign: "center", color: C.muted }}>Loading Payslips...</div>
          ) : payslips.length === 0 ? (
            <div style={{ padding: "4rem", textAlign: "center" }}>
              <Wallet size={36} color={C.muted} style={{ margin: "0 auto 12px" }} />
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: C.text, margin: "0 0 6px" }}>
                No payslips found for {selectedMonth}
              </h3>
              <p style={{ color: C.muted, fontSize: "0.85rem", margin: 0 }}>
                {isAdmin
                  ? "Click 'Run Monthly Payroll' to calculate payslips for this month."
                  : "Your payslip for this month will appear once payroll is processed by Admin."}
              </p>
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.85rem" }}>
              <thead>
                <tr style={{ background: "#F9FAFB", borderBottom: `1px solid ${C.border}` }}>
                  <th style={{ padding: "0.85rem 1.25rem", fontWeight: 700, color: C.muted, fontSize: "0.78rem" }}>PAYSLIP #</th>
                  <th style={{ padding: "0.85rem 1rem", fontWeight: 700, color: C.muted, fontSize: "0.78rem" }}>EMPLOYEE</th>
                  <th style={{ padding: "0.85rem 1rem", fontWeight: 700, color: C.muted, fontSize: "0.78rem" }}>ATTENDANCE & OT</th>
                  <th style={{ padding: "0.85rem 1rem", fontWeight: 700, color: C.muted, fontSize: "0.78rem" }}>GROSS EARNINGS</th>
                  <th style={{ padding: "0.85rem 1rem", fontWeight: 700, color: C.muted, fontSize: "0.78rem" }}>DEDUCTIONS</th>
                  <th style={{ padding: "0.85rem 1rem", fontWeight: 700, color: C.muted, fontSize: "0.78rem" }}>NET TAKE-HOME (₹)</th>
                  <th style={{ padding: "0.85rem 1rem", fontWeight: 700, color: C.muted, fontSize: "0.78rem" }}>STATUS</th>
                  <th style={{ padding: "0.85rem 1.25rem", fontWeight: 700, color: C.muted, fontSize: "0.78rem", textAlign: "right" }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {payslips.map((pay) => (
                  <tr
                    key={pay.id}
                    style={{ borderBottom: `1px solid ${C.border}`, transition: "background 0.15s ease" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#F9FAFB")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={{ padding: "1rem 1.25rem", fontWeight: 800, color: C.primary }}>
                      {pay.payslipNumber}
                    </td>

                    <td style={{ padding: "1rem 1rem" }}>
                      <div style={{ fontWeight: 700, color: C.text }}>{pay.user.name}</div>
                      <div style={{ fontSize: "0.75rem", color: C.muted }}>{pay.user.role}</div>
                    </td>

                    <td style={{ padding: "1rem 1rem" }}>
                      <div style={{ fontSize: "0.82rem", color: C.text }}>
                        Present: <strong>{pay.presentDays}</strong> / {pay.workingDays} days
                      </div>
                      <div style={{ fontSize: "0.75rem", color: C.muted }}>
                        OT: <strong style={{ color: "#059669" }}>{pay.overtimeHours}h</strong> (₹{pay.overtimePay})
                        {pay.lateDays > 0 && <span> • Lates: <strong style={{ color: "#DC2626" }}>{pay.lateDays}</strong></span>}
                      </div>
                    </td>

                    <td style={{ padding: "1rem 1rem", fontWeight: 600, color: C.text }}>
                      ₹{pay.grossEarnings.toLocaleString("en-IN")}
                    </td>

                    <td style={{ padding: "1rem 1rem", fontWeight: 600, color: pay.totalDeductions > 0 ? "#DC2626" : C.muted }}>
                      {pay.totalDeductions > 0 ? `-₹${pay.totalDeductions.toLocaleString("en-IN")}` : "₹0"}
                    </td>

                    <td style={{ padding: "1rem 1rem" }}>
                      <div style={{ fontWeight: 800, color: "#059669", fontSize: "0.95rem" }}>
                        ₹{pay.netSalary.toLocaleString("en-IN")}
                      </div>
                      <div style={{ fontSize: "0.72rem", color: C.muted }}>
                        Base: ₹{pay.baseSalary.toLocaleString("en-IN")}
                      </div>
                    </td>

                    <td style={{ padding: "1rem 1rem" }}>
                      <span style={{
                        padding: "3px 8px", borderRadius: "999px", fontSize: "0.75rem", fontWeight: 700,
                        background: pay.status === "PAID" ? "#ECFDF5" : "#EFF6FF",
                        color: pay.status === "PAID" ? "#059669" : C.primary,
                        border: `1px solid ${pay.status === "PAID" ? "#A7F3D0" : "#BFDBFE"}`
                      }}>
                        {pay.status === "PAID" ? "PAID ✓" : "GENERATED"}
                      </span>
                    </td>

                    <td style={{ padding: "1rem 1.25rem", textAlign: "right" }}>
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: "6px" }}>
                        <button
                          onClick={async () => {
                            const res = await fetch(`/api/finance/payroll?id=${pay.id}`);
                            const data = await res.json();
                            if (data.success) {
                              setSelectedPayslip(data.data);
                              setShowPayslipModal(true);
                            }
                          }}
                          title="View & Print Official Payslip"
                          style={{
                            background: "#EFF6FF", color: C.primary, border: "1px solid #BFDBFE",
                            padding: "4px 8px", borderRadius: "4px", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer",
                            display: "inline-flex", alignItems: "center", gap: "4px"
                          }}
                        >
                          <Printer size={13} /> View Payslip
                        </button>

                        {isAdmin && pay.status !== "PAID" && (
                          <button
                            onClick={() => {
                              setSelectedForPay(pay);
                              setPayForm({
                                paymentDate: new Date().toISOString().split("T")[0],
                                paymentReference: "",
                              });
                              setShowPayModal(true);
                            }}
                            title="Mark as Paid"
                            style={{
                              background: "#ECFDF5", color: "#059669", border: "1px solid #A7F3D0",
                              padding: "4px 8px", borderRadius: "4px", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer",
                              display: "inline-flex", alignItems: "center", gap: "4px"
                            }}
                          >
                            <Check size={13} /> Mark Paid
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* ═════════ MODAL 1: RUN MONTHLY PAYROLL ═════════ */}
        {showRunModal && (
          <div style={{
            position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)",
            backdropFilter: "blur(4px)", zIndex: 100, display: "flex",
            alignItems: "center", justifyContent: "center", padding: "1rem"
          }}>
            <div style={{
              background: C.card, borderRadius: C.radius, width: "100%", maxWidth: "480px",
              padding: "1.75rem", boxShadow: "0 20px 40px rgba(0,0,0,0.15)", border: `1px solid ${C.border}`
            }}>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: C.text, margin: "0 0 4px" }}>
                Run Monthly Payroll
              </h2>
              <p style={{ color: C.muted, fontSize: "0.82rem", margin: "0 0 1.25rem" }}>
                Auto-calculates salaries, approved overtime, and attendance deductions for all active employees.
              </p>

              <form onSubmit={handleRunPayroll} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: C.text, marginBottom: "4px" }}>
                    Select Payroll Month (YYYY-MM) *
                  </label>
                  <input
                    type="month"
                    required
                    value={runForm.monthYear}
                    onChange={(e) => setRunForm({ ...runForm, monthYear: e.target.value })}
                    style={{ width: "100%", padding: "0.55rem 0.75rem", border: `1px solid ${C.border}`, borderRadius: C.radiusSm, fontSize: "0.9rem", fontWeight: 700, boxSizing: "border-box" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: C.text, marginBottom: "4px" }}>
                    Run Notes
                  </label>
                  <textarea
                    rows={2}
                    value={runForm.notes}
                    onChange={(e) => setRunForm({ ...runForm, notes: e.target.value })}
                    style={{ width: "100%", padding: "0.5rem 0.75rem", border: `1px solid ${C.border}`, borderRadius: C.radiusSm, fontSize: "0.85rem", boxSizing: "border-box" }}
                  />
                </div>

                <div style={{
                  background: "#F8FAFC", border: `1px solid ${C.border}`, borderRadius: C.radiusSm,
                  padding: "0.75rem", fontSize: "0.78rem", color: C.muted, lineHeight: "1.4"
                }}>
                  ℹ️ <strong>Rules Applied:</strong><br />
                  • Base salary divided by 26 working days.<br />
                  • Overtime calculated per approved hours from Overtime system.<br />
                  • 3 grace late logins per month; deductions applied only on excess lates.<br />
                  • Admin users are strictly excluded from salary payroll.
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "0.5rem" }}>
                  <button
                    type="button"
                    onClick={() => setShowRunModal(false)}
                    style={{ background: "#F3F4F6", color: "#374151", padding: "0.5rem 1rem", borderRadius: C.radiusSm, border: "none", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={runningPayroll}
                    style={{ background: C.primary, color: "#fff", padding: "0.5rem 1.25rem", borderRadius: C.radiusSm, border: "none", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer" }}
                  >
                    {runningPayroll ? "Calculating..." : "Execute Payroll Run"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ═════════ MODAL 2: SALARY STRUCTURE CONFIG ═════════ */}
        {showStructureModal && (
          <div style={{
            position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)",
            backdropFilter: "blur(4px)", zIndex: 100, display: "flex",
            alignItems: "center", justifyContent: "center", padding: "1rem"
          }}>
            <div style={{
              background: C.card, borderRadius: C.radius, width: "100%", maxWidth: "520px",
              padding: "1.75rem", boxShadow: "0 20px 40px rgba(0,0,0,0.15)", border: `1px solid ${C.border}`
            }}>
              <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: C.text, margin: "0 0 4px" }}>
                Configure Employee Salary Structure
              </h2>
              <p style={{ color: C.muted, fontSize: "0.82rem", margin: "0 0 1.25rem" }}>
                Set monthly base salary (₹), overtime rate, and bank payout credentials
              </p>

              <form onSubmit={handleSaveStructure} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: C.text, marginBottom: "4px" }}>Employee *</label>
                  <select
                    value={structureForm.userId}
                    onChange={(e) => setStructureForm({ ...structureForm, userId: e.target.value })}
                    style={{ width: "100%", padding: "0.55rem 0.75rem", border: `1px solid ${C.border}`, borderRadius: C.radiusSm, fontSize: "0.85rem", background: "#fff" }}
                  >
                    {teamMembers.map((m) => (
                      <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.85rem" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: C.text, marginBottom: "3px" }}>
                      Monthly Base Salary (₹) *
                    </label>
                    <input
                      type="number"
                      required
                      value={structureForm.baseSalary}
                      onChange={(e) => setStructureForm({ ...structureForm, baseSalary: parseFloat(e.target.value) || 0 })}
                      style={{ width: "100%", padding: "0.45rem 0.6rem", border: `1px solid ${C.border}`, borderRadius: C.radiusSm, fontSize: "0.85rem", boxSizing: "border-box" }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: C.text, marginBottom: "3px" }}>
                      Hourly Overtime Rate (₹) *
                    </label>
                    <input
                      type="number"
                      required
                      value={structureForm.hourlyOvertimeRate}
                      onChange={(e) => setStructureForm({ ...structureForm, hourlyOvertimeRate: parseFloat(e.target.value) || 0 })}
                      style={{ width: "100%", padding: "0.45rem 0.6rem", border: `1px solid ${C.border}`, borderRadius: C.radiusSm, fontSize: "0.85rem", boxSizing: "border-box" }}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.85rem" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: C.text, marginBottom: "3px" }}>
                      Special Allowance (₹)
                    </label>
                    <input
                      type="number"
                      value={structureForm.allowance}
                      onChange={(e) => setStructureForm({ ...structureForm, allowance: parseFloat(e.target.value) || 0 })}
                      style={{ width: "100%", padding: "0.45rem 0.6rem", border: `1px solid ${C.border}`, borderRadius: C.radiusSm, fontSize: "0.85rem", boxSizing: "border-box" }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: C.text, marginBottom: "3px" }}>
                      Bank Name
                    </label>
                    <input
                      placeholder="e.g. HDFC Bank"
                      value={structureForm.bankName}
                      onChange={(e) => setStructureForm({ ...structureForm, bankName: e.target.value })}
                      style={{ width: "100%", padding: "0.45rem 0.6rem", border: `1px solid ${C.border}`, borderRadius: C.radiusSm, fontSize: "0.85rem", boxSizing: "border-box" }}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.85rem" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: C.text, marginBottom: "3px" }}>
                      Bank Account Number
                    </label>
                    <input
                      placeholder="Account Number"
                      value={structureForm.bankAccountNumber}
                      onChange={(e) => setStructureForm({ ...structureForm, bankAccountNumber: e.target.value })}
                      style={{ width: "100%", padding: "0.45rem 0.6rem", border: `1px solid ${C.border}`, borderRadius: C.radiusSm, fontSize: "0.85rem", boxSizing: "border-box" }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: C.text, marginBottom: "3px" }}>
                      IFSC Code
                    </label>
                    <input
                      placeholder="e.g. HDFC0001234"
                      value={structureForm.ifscCode}
                      onChange={(e) => setStructureForm({ ...structureForm, ifscCode: e.target.value })}
                      style={{ width: "100%", padding: "0.45rem 0.6rem", border: `1px solid ${C.border}`, borderRadius: C.radiusSm, fontSize: "0.85rem", boxSizing: "border-box" }}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.85rem" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: C.text, marginBottom: "3px" }}>
                      PAN Card Number
                    </label>
                    <input
                      placeholder="e.g. ABCDE1234F"
                      value={structureForm.panNumber}
                      onChange={(e) => setStructureForm({ ...structureForm, panNumber: e.target.value })}
                      style={{ width: "100%", padding: "0.45rem 0.6rem", border: `1px solid ${C.border}`, borderRadius: C.radiusSm, fontSize: "0.85rem", boxSizing: "border-box" }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: C.text, marginBottom: "3px" }}>
                      UPI ID
                    </label>
                    <input
                      placeholder="e.g. employee@okaxis"
                      value={structureForm.upiId}
                      onChange={(e) => setStructureForm({ ...structureForm, upiId: e.target.value })}
                      style={{ width: "100%", padding: "0.45rem 0.6rem", border: `1px solid ${C.border}`, borderRadius: C.radiusSm, fontSize: "0.85rem", boxSizing: "border-box" }}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "0.5rem" }}>
                  <button
                    type="button"
                    onClick={() => setShowStructureModal(false)}
                    style={{ background: "#F3F4F6", color: "#374151", padding: "0.5rem 1rem", borderRadius: C.radiusSm, border: "none", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingStructure}
                    style={{ background: C.primary, color: "#fff", padding: "0.5rem 1.25rem", borderRadius: C.radiusSm, border: "none", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer" }}
                  >
                    {savingStructure ? "Saving..." : "Save Salary Settings"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ═════════ MODAL 3: OFFICIAL PRINTABLE PAYSLIP ═════════ */}
        {showPayslipModal && selectedPayslip && (
          <div style={{
            position: "fixed", inset: 0, background: "rgba(15,23,42,0.6)",
            backdropFilter: "blur(4px)", zIndex: 100, display: "flex",
            alignItems: "center", justifyContent: "center", padding: "1rem"
          }}>
            <div style={{
              background: "#FFFFFF", borderRadius: C.radius, width: "100%", maxWidth: "800px",
              maxHeight: "94vh", overflowY: "auto", padding: "2.5rem",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)", border: `1px solid ${C.border}`
            }}>
              {/* Controls */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", borderBottom: "1px solid #E5E7EB", paddingBottom: "0.75rem" }}>
                <span style={{ fontSize: "0.85rem", color: C.muted, fontWeight: 600 }}>
                  Payslip Preview • {selectedPayslip.payslipNumber}
                </span>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={() => window.print()}
                    style={{
                      background: "#002D62", color: "#fff", border: "none", borderRadius: C.radiusSm,
                      padding: "0.45rem 1rem", fontSize: "0.82rem", fontWeight: 700, cursor: "pointer",
                      display: "flex", alignItems: "center", gap: "5px"
                    }}
                  >
                    <Printer size={14} /> Print / Save PDF
                  </button>
                  <button
                    onClick={() => setShowPayslipModal(false)}
                    style={{ background: "#F3F4F6", color: "#374151", border: "none", borderRadius: C.radiusSm, padding: "0.45rem 0.85rem", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer" }}
                  >
                    Close
                  </button>
                </div>
              </div>

              {/* ── Official Indian Corporate Payslip Document ── */}
              {(() => {
                const formatInr = (val?: number) => {
                  if (val === undefined || val === null || isNaN(val)) return "₹ 0.00";
                  return "₹ " + val.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                };

                const formatMonthDisplay = (monthStr?: string) => {
                  if (!monthStr) return "Current Month";
                  try {
                    const parts = monthStr.split("-");
                    if (parts.length === 2) {
                      const year = parseInt(parts[0], 10);
                      const month = parseInt(parts[1], 10) - 1;
                      const d = new Date(year, month, 1);
                      return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
                    }
                    return monthStr;
                  } catch {
                    return monthStr;
                  }
                };

                // Prepare earnings items
                const earnItems: { desc: string; monthly: number; ytd: number }[] = [];
                const basicVal = selectedPayslip.earnedBasic || selectedPayslip.baseSalary || 0;
                earnItems.push({ desc: "Basic Salary", monthly: basicVal, ytd: basicVal });
                if (selectedPayslip.allowances > 0) {
                  const hra = Math.round(selectedPayslip.allowances * 0.5);
                  const conv = Math.round(selectedPayslip.allowances * 0.25);
                  const spec = selectedPayslip.allowances - hra - conv;
                  earnItems.push({ desc: "HRA Allowance", monthly: hra, ytd: hra });
                  earnItems.push({ desc: "Conveyance Allowance", monthly: conv, ytd: conv });
                  earnItems.push({ desc: "Special Allowance", monthly: spec, ytd: spec });
                }
                if (selectedPayslip.overtimePay > 0) {
                  earnItems.push({ desc: "Overtime Allowance", monthly: selectedPayslip.overtimePay, ytd: selectedPayslip.overtimePay });
                }
                if (selectedPayslip.bonus > 0) {
                  earnItems.push({ desc: "Bonus", monthly: selectedPayslip.bonus, ytd: selectedPayslip.bonus });
                }

                // Prepare deductions items
                const dedItems: { desc: string; monthly?: number; ytd?: number }[] = [];
                if (selectedPayslip.totalDeductions > 0) {
                  if (selectedPayslip.otherDeductions > 0) {
                    dedItems.push({ desc: "Provident Fund", monthly: selectedPayslip.otherDeductions, ytd: selectedPayslip.otherDeductions });
                  }
                  if (selectedPayslip.lateDeductions > 0) {
                    dedItems.push({ desc: "Lateness Deduction", monthly: selectedPayslip.lateDeductions, ytd: selectedPayslip.lateDeductions });
                  }
                  if (selectedPayslip.unpaidLeaveDeductions > 0) {
                    dedItems.push({ desc: "Unpaid Leave (LWP)", monthly: selectedPayslip.unpaidLeaveDeductions, ytd: selectedPayslip.unpaidLeaveDeductions });
                  }
                }
                dedItems.push({ desc: "Provident Fund" });
                dedItems.push({ desc: "ESI" });
                dedItems.push({ desc: "Professional Tax" });
                dedItems.push({ desc: "Income Tax" });

                const totalGross = selectedPayslip.grossEarnings > 0 
                  ? selectedPayslip.grossEarnings 
                  : earnItems.reduce((acc, it) => acc + it.monthly, 0);

                const totalDed = selectedPayslip.totalDeductions > 0
                  ? selectedPayslip.totalDeductions
                  : dedItems.reduce((acc, it) => acc + (it.monthly || 0), 0);

                const finalNet = selectedPayslip.netSalary > 0 
                  ? selectedPayslip.netSalary 
                  : (totalGross - totalDed);

                const maxRows = Math.max(earnItems.length, dedItems.length, 12);
                const rowIndexes = Array.from({ length: maxRows }, (_, i) => i);

                const companyLegal = companySettings?.gstLegalName || "RESAWC LLP";
                const companyAddr = companySettings?.companyAddress || "Resawc Creative Studio Hub, New Delhi, India";

                return (
                  <div>
                    {/* Print CSS */}
                    <style>{`
                      @media print {
                        body * {
                          visibility: hidden !important;
                        }
                        #printable-payslip, #printable-payslip * {
                          visibility: visible !important;
                        }
                        #printable-payslip {
                          position: absolute !important;
                          left: 0 !important;
                          top: 0 !important;
                          width: 100% !important;
                          max-width: 100% !important;
                          margin: 0 !important;
                          padding: 10px !important;
                          border: 2px solid #000000 !important;
                          box-shadow: none !important;
                          -webkit-print-color-adjust: exact !important;
                          print-color-adjust: exact !important;
                        }
                      }
                    `}</style>

                    <div id="printable-payslip" style={{
                      fontFamily: "Arial, Inter, sans-serif",
                      color: "#000000",
                      background: "#FFFFFF",
                      border: "2px solid #000000",
                      padding: "16px 20px",
                      lineHeight: "1.3"
                    }}>
                      {/* Top Header */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: "15px", textTransform: "uppercase", letterSpacing: "0.2px" }}>
                            {companyLegal}
                          </div>
                          <div style={{ fontSize: "11px", color: "#111827", marginTop: "3px", lineHeight: "1.35", whiteSpace: "pre-line" }}>
                            {companyAddr}
                          </div>
                          {(companySettings?.gstNumber || companySettings?.panNumber) && (
                            <div style={{ fontSize: "10px", color: "#000000", marginTop: "3px", fontWeight: 600 }}>
                              {companySettings.gstNumber && `GSTIN: ${companySettings.gstNumber} `}
                              {companySettings.panNumber && `• PAN: ${companySettings.panNumber}`}
                            </div>
                          )}
                        </div>

                        {/* Top Right Logo Banner */}
                        <div style={{
                          background: "#002D62",
                          color: "#FFFFFF",
                          padding: "6px 16px",
                          borderRadius: "2px",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          fontWeight: 800,
                          fontSize: "17px",
                          letterSpacing: "1px",
                          fontFamily: "Arial, sans-serif"
                        }}>
                          <span>{(companySettings?.gstTradeName || companySettings?.gstLegalName || "RESAWC").split(" ")[0].toUpperCase()}</span>
                          <span style={{ color: "#38BDF8", fontSize: "18px", margin: "0 2px" }}>•</span>
                          <span>STUDIO</span>
                        </div>
                      </div>

                      {/* Dark Navy Month Banner */}
                      <div style={{
                        background: "#002D62",
                        color: "#FFFFFF",
                        textAlign: "center",
                        padding: "6px 12px",
                        fontWeight: 700,
                        fontSize: "13px",
                        border: "1px solid #000000",
                        borderBottom: "none"
                      }}>
                        Payslip for the Month of {formatMonthDisplay(selectedPayslip.monthYear)}
                      </div>

                      {/* Employee Details Grid */}
                      <table style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        fontSize: "11px",
                        border: "1px solid #000000",
                        marginBottom: "0px"
                      }}>
                        <tbody>
                          <tr>
                            <td style={{ border: "1px solid #000000", padding: "4px 8px", fontWeight: 700, width: "18%" }}>Employee Name</td>
                            <td colSpan={3} style={{ border: "1px solid #000000", padding: "4px 8px", fontWeight: 700 }}>
                              {selectedPayslip.user.name}
                            </td>
                          </tr>
                          <tr>
                            <td style={{ border: "1px solid #000000", padding: "4px 8px" }}>Employee Code</td>
                            <td style={{ border: "1px solid #000000", padding: "4px 8px", width: "32%" }}>
                              {"EMP-" + (selectedPayslip.user.id.slice(-4).toUpperCase())}
                            </td>
                            <td style={{ border: "1px solid #000000", padding: "4px 8px", width: "18%" }}>Location</td>
                            <td style={{ border: "1px solid #000000", padding: "4px 8px", width: "32%" }}>
                              {companySettings?.gstState || "Delhi NCR"}
                            </td>
                          </tr>
                          <tr>
                            <td style={{ border: "1px solid #000000", padding: "4px 8px" }}>Date of Joining</td>
                            <td style={{ border: "1px solid #000000", padding: "4px 8px" }}>
                              {"—"}
                            </td>
                            <td style={{ border: "1px solid #000000", padding: "4px 8px" }}>Designation</td>
                            <td style={{ border: "1px solid #000000", padding: "4px 8px" }}>
                              {selectedPayslip.user.role === "admin"
                                ? "Managing Director"
                                : selectedPayslip.user.role === "photo_editor"
                                ? "Photo Retouching Artist"
                                : selectedPayslip.user.role === "video_editor"
                                ? "Lead Video Editor"
                                : selectedPayslip.user.role === "marketing"
                                ? "Client Growth Specialist"
                                : "Creative Executive"}
                            </td>
                          </tr>
                          <tr>
                            <td style={{ border: "1px solid #000000", padding: "4px 8px" }}>Date of Birth</td>
                            <td style={{ border: "1px solid #000000", padding: "4px 8px" }}>
                              {"—"}
                            </td>
                            <td style={{ border: "1px solid #000000", padding: "4px 8px" }}>PAN No</td>
                            <td style={{ border: "1px solid #000000", padding: "4px 8px" }}>
                              {selectedPayslip.user.salaryStructure?.panNumber || "—"}
                            </td>
                          </tr>
                          <tr>
                            <td style={{ border: "1px solid #000000", padding: "4px 8px" }}>Bank Account No</td>
                            <td style={{ border: "1px solid #000000", padding: "4px 8px" }}>
                              {selectedPayslip.user.salaryStructure?.bankAccountNumber || "—"}
                            </td>
                            <td style={{ border: "1px solid #000000", padding: "4px 8px" }}>IFSC</td>
                            <td style={{ border: "1px solid #000000", padding: "4px 8px" }}>
                              {selectedPayslip.user.salaryStructure?.ifscCode || "—"}
                            </td>
                          </tr>
                          <tr>
                            <td style={{ border: "1px solid #000000", padding: "4px 8px" }}>UAN No</td>
                            <td style={{ border: "1px solid #000000", padding: "4px 8px" }}>
                              {"NA"}
                            </td>
                            <td style={{ border: "1px solid #000000", padding: "4px 8px" }}>ESI No</td>
                            <td style={{ border: "1px solid #000000", padding: "4px 8px" }}>
                              {"NA"}
                            </td>
                          </tr>
                        </tbody>
                      </table>

                      {/* Earnings & Deductions Table */}
                      <table style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        fontSize: "11px",
                        border: "1px solid #000000",
                        marginTop: "-1px"
                      }}>
                        <thead>
                          {/* Main Section Header */}
                          <tr>
                            <th colSpan={3} style={{
                              background: "#002D62",
                              color: "#FFFFFF",
                              padding: "5px 8px",
                              textAlign: "center",
                              border: "1px solid #000000",
                              fontWeight: 700,
                              fontSize: "12px"
                            }}>
                              Earnings
                            </th>
                            <th colSpan={3} style={{
                              background: "#002D62",
                              color: "#FFFFFF",
                              padding: "5px 8px",
                              textAlign: "center",
                              border: "1px solid #000000",
                              fontWeight: 700,
                              fontSize: "12px"
                            }}>
                              Deductions
                            </th>
                          </tr>
                          {/* Column Subheaders */}
                          <tr style={{ background: "#0070BA", color: "#FFFFFF" }}>
                            <th style={{ border: "1px solid #000000", padding: "4px 8px", textAlign: "left", width: "26%", fontWeight: 700 }}>Description</th>
                            <th style={{ border: "1px solid #000000", padding: "4px 8px", textAlign: "right", width: "12%", fontWeight: 700 }}>Monthly</th>
                            <th style={{ border: "1px solid #000000", padding: "4px 8px", textAlign: "right", width: "12%", fontWeight: 700 }}>YTD</th>
                            <th style={{ border: "1px solid #000000", padding: "4px 8px", textAlign: "left", width: "26%", fontWeight: 700 }}>Description</th>
                            <th style={{ border: "1px solid #000000", padding: "4px 8px", textAlign: "right", width: "12%", fontWeight: 700 }}>Monthly</th>
                            <th style={{ border: "1px solid #000000", padding: "4px 8px", textAlign: "right", width: "12%", fontWeight: 700 }}>YTD</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rowIndexes.map((idx) => {
                            const e = earnItems[idx];
                            const d = dedItems[idx];
                            return (
                              <tr key={idx} style={{ height: "21px" }}>
                                {/* Earnings Side */}
                                <td style={{ border: "1px solid #000000", padding: "3px 8px", textAlign: "left" }}>
                                  {e ? e.desc : "\u00A0"}
                                </td>
                                <td style={{ border: "1px solid #000000", padding: "3px 8px", textAlign: "right" }}>
                                  {e ? formatInr(e.monthly) : "\u00A0"}
                                </td>
                                <td style={{ border: "1px solid #000000", padding: "3px 8px", textAlign: "right" }}>
                                  {e ? formatInr(e.ytd) : "\u00A0"}
                                </td>

                                {/* Deductions Side */}
                                <td style={{ border: "1px solid #000000", padding: "3px 8px", textAlign: "left" }}>
                                  {d ? d.desc : "\u00A0"}
                                </td>
                                <td style={{ border: "1px solid #000000", padding: "3px 8px", textAlign: "right" }}>
                                  {d ? (d.monthly !== undefined ? formatInr(d.monthly) : (d.desc === "ESI" ? "\u00A0" : "-")) : "\u00A0"}
                                </td>
                                <td style={{ border: "1px solid #000000", padding: "3px 8px", textAlign: "right" }}>
                                  {d ? (d.ytd !== undefined ? formatInr(d.ytd) : "-") : "\u00A0"}
                                </td>
                              </tr>
                            );
                          })}

                          {/* Total Row */}
                          <tr style={{ background: "#0070BA", color: "#FFFFFF", fontWeight: 700 }}>
                            <td style={{ border: "1px solid #000000", padding: "4px 8px", textAlign: "left" }}>
                              Total Earning
                            </td>
                            <td style={{ border: "1px solid #000000", padding: "4px 8px", textAlign: "right" }}>
                              {formatInr(totalGross)}
                            </td>
                            <td style={{ border: "1px solid #000000", padding: "4px 8px", textAlign: "right" }}>
                              {formatInr(totalGross)}
                            </td>
                            <td style={{ border: "1px solid #000000", padding: "4px 8px", textAlign: "left" }}>
                              Total Deductions
                            </td>
                            <td style={{ border: "1px solid #000000", padding: "4px 8px", textAlign: "right" }}>
                              {formatInr(totalDed)}
                            </td>
                            <td style={{ border: "1px solid #000000", padding: "4px 8px", textAlign: "right" }}>
                              {formatInr(totalDed)}
                            </td>
                          </tr>

                          {/* Net Pay (In Figure) */}
                          <tr>
                            <td style={{ border: "1px solid #000000", padding: "5px 8px", fontWeight: 700, textAlign: "left" }}>
                              Net Pay (In Figure)
                            </td>
                            <td colSpan={5} style={{ border: "1px solid #000000", padding: "5px 8px", fontWeight: 700, textAlign: "left" }}>
                              {formatInr(finalNet)}
                            </td>
                          </tr>

                          {/* Net Pay (In Words) */}
                          <tr>
                            <td style={{ border: "1px solid #000000", padding: "5px 8px", fontWeight: 700, textAlign: "left" }}>
                              Net Pay (In Words)
                            </td>
                            <td colSpan={5} style={{ border: "1px solid #000000", padding: "5px 8px", textAlign: "left" }}>
                              {numberToWordsIndian(finalNet)}
                            </td>
                          </tr>
                        </tbody>
                      </table>

                      {/* Attendance Summary Box */}
                      <table style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        fontSize: "11px",
                        border: "1px solid #000000",
                        marginTop: "12px",
                        textAlign: "center"
                      }}>
                        <thead>
                          <tr>
                            <th style={{ border: "1px solid #000000", padding: "4px", fontWeight: 700, width: "33.33%" }}>Days in Month</th>
                            <th style={{ border: "1px solid #000000", padding: "4px", fontWeight: 700, width: "33.33%" }}>Leaves</th>
                            <th style={{ border: "1px solid #000000", padding: "4px", fontWeight: 700, width: "33.33%" }}>Net Working Days</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td style={{ border: "1px solid #000000", padding: "4px" }}>{selectedPayslip.daysInMonth || 30}</td>
                            <td style={{ border: "1px solid #000000", padding: "4px" }}>{(selectedPayslip.unpaidLeaves || 0) + (selectedPayslip.paidLeaves || 0)}</td>
                            <td style={{ border: "1px solid #000000", padding: "4px" }}>{selectedPayslip.presentDays || selectedPayslip.workingDays || 30}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* ═════════ MODAL 4: MARK AS PAID ═════════ */}
        {showPayModal && selectedForPay && (
          <div style={{
            position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)",
            backdropFilter: "blur(4px)", zIndex: 100, display: "flex",
            alignItems: "center", justifyContent: "center", padding: "1rem"
          }}>
            <div style={{
              background: C.card, borderRadius: C.radius, width: "100%", maxWidth: "440px",
              padding: "1.75rem", boxShadow: "0 20px 40px rgba(0,0,0,0.15)", border: `1px solid ${C.border}`
            }}>
              <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: C.text, margin: "0 0 4px" }}>
                Confirm Salary Disbursement
              </h2>
              <p style={{ color: C.muted, fontSize: "0.82rem", margin: "0 0 1rem" }}>
                {selectedForPay.user.name} • Net: <strong>₹{selectedForPay.netSalary.toLocaleString("en-IN")}</strong>
              </p>

              <form onSubmit={handleMarkPaid} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: C.text, marginBottom: "4px" }}>
                    Payment Date
                  </label>
                  <input
                    type="date"
                    required
                    value={payForm.paymentDate}
                    onChange={(e) => setPayForm({ ...payForm, paymentDate: e.target.value })}
                    style={{ width: "100%", padding: "0.55rem 0.75rem", border: `1px solid ${C.border}`, borderRadius: C.radiusSm, fontSize: "0.85rem", boxSizing: "border-box" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: C.text, marginBottom: "4px" }}>
                    UTR / IMPS / Bank Reference
                  </label>
                  <input
                    placeholder="e.g. UTR-SALARY-OCT2026-01"
                    value={payForm.paymentReference}
                    onChange={(e) => setPayForm({ ...payForm, paymentReference: e.target.value })}
                    style={{ width: "100%", padding: "0.55rem 0.75rem", border: `1px solid ${C.border}`, borderRadius: C.radiusSm, fontSize: "0.85rem", boxSizing: "border-box" }}
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "0.5rem" }}>
                  <button
                    type="button"
                    onClick={() => setShowPayModal(false)}
                    style={{ background: "#F3F4F6", color: "#374151", padding: "0.5rem 1rem", borderRadius: C.radiusSm, border: "none", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{ background: "#059669", color: "#fff", padding: "0.5rem 1.25rem", borderRadius: C.radiusSm, border: "none", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer" }}
                  >
                    Confirm Payout
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
