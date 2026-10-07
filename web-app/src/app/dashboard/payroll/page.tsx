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
      hraAllowance?: number;
      conveyanceAllowance?: number;
      medicalAllowance?: number;
      specialAllowance?: number;
      bonus?: number;
      pfAmount?: number;
      esiAmount?: number;
      professionalTax?: number;
      incomeTax?: number;
      bankName?: string;
      bankAccountNumber?: string;
      ifscCode?: string;
      panNumber?: string;
      upiId?: string;
      dob?: string | null;
      doj?: string | null;
      designation?: string | null;
      location?: string | null;
      uanNumber?: string | null;
      esiNumber?: string | null;
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
    // Individual earnings
    hraAllowance: 0,
    conveyanceAllowance: 0,
    medicalAllowance: 0,
    specialAllowance: 0,
    bonus: 0,
    // Statutory deductions
    pfAmount: 0,
    esiAmount: 0,
    professionalTax: 0,
    incomeTax: 0,
    // Banking
    bankName: "HDFC Bank",
    bankAccountNumber: "",
    ifscCode: "",
    panNumber: "",
    upiId: "",
    dob: "",
    doj: "",
    designation: "",
    location: "",
    uanNumber: "",
    esiNumber: "",
  });
  const [savingStructure, setSavingStructure] = useState(false);

  const loadUserStructure = async (targetUserId: string) => {
    if (!targetUserId) return;
    try {
      const res = await fetch(`/api/finance/salary-structure?userId=${targetUserId}`);
      const data = await res.json();
      if (data.success && data.data) {
        const s = data.data;
        setStructureForm({
          userId: targetUserId,
          baseSalary: s.baseSalary ?? 25000,
          hourlyOvertimeRate: s.hourlyOvertimeRate ?? 150,
          allowance: s.allowance ?? 0,
          hraAllowance: s.hraAllowance ?? 0,
          conveyanceAllowance: s.conveyanceAllowance ?? 0,
          medicalAllowance: s.medicalAllowance ?? 0,
          specialAllowance: s.specialAllowance ?? 0,
          bonus: s.bonus ?? 0,
          pfAmount: s.pfAmount ?? 0,
          esiAmount: s.esiAmount ?? 0,
          professionalTax: s.professionalTax ?? 0,
          incomeTax: s.incomeTax ?? 0,
          bankName: s.bankName ?? "HDFC Bank",
          bankAccountNumber: s.bankAccountNumber ?? "",
          ifscCode: s.ifscCode ?? "",
          panNumber: s.panNumber ?? "",
          upiId: s.upiId ?? "",
          dob: s.dob ?? "",
          doj: s.doj ?? "",
          designation: s.designation ?? "",
          location: s.location ?? "",
          uanNumber: s.uanNumber ?? "",
          esiNumber: s.esiNumber ?? "",
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

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
          loadUserStructure(nonAdmins[0].id);
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
                onClick={async () => {
                  const targetId = structureForm.userId || (teamMembers[0]?.id ?? "");
                  if (targetId) {
                    await loadUserStructure(targetId);
                  }
                  setShowStructureModal(true);
                }}
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

                        {isAdmin && (
                          <button
                            onClick={async () => {
                              await loadUserStructure(pay.userId);
                              setShowStructureModal(true);
                            }}
                            title="Edit Employee Profile, Statutory IDs & Salary Structure"
                            style={{
                              background: "#FFFFFF", color: C.text, border: `1px solid ${C.border}`,
                              padding: "4px 8px", borderRadius: "4px", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer",
                              display: "inline-flex", alignItems: "center", gap: "4px"
                            }}
                          >
                            <Edit3 size={13} color={C.muted} /> Settings
                          </button>
                        )}

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

        {/* ═════════ MODAL 2: SALARY & STATUTORY PROFILE CONFIG ═════════ */}
        {showStructureModal && (
          <div style={{
            position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)",
            backdropFilter: "blur(4px)", zIndex: 100, display: "flex",
            alignItems: "center", justifyContent: "center", padding: "1rem"
          }}>
            <div style={{
              background: C.card, borderRadius: C.radius, width: "100%", maxWidth: "640px",
              maxHeight: "92vh", overflowY: "auto",
              padding: "1.75rem", boxShadow: "0 20px 40px rgba(0,0,0,0.15)", border: `1px solid ${C.border}`
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                <div>
                  <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: C.text, margin: 0 }}>
                    Employee Profile &amp; Salary Structure
                  </h2>
                  <p style={{ color: C.muted, fontSize: "0.82rem", margin: "3px 0 0" }}>
                    Configure official statutory IDs, joining date, banking, and monthly compensation
                  </p>
                </div>
                <button
                  onClick={() => setShowStructureModal(false)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: C.muted, padding: "4px" }}
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveStructure} style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
                {/* Employee Selector */}
                <div style={{ background: "#F8FAFC", padding: "0.75rem 1rem", borderRadius: C.radiusSm, border: `1px solid ${C.border}` }}>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: C.text, marginBottom: "4px" }}>
                    Select Team Member *
                  </label>
                  <select
                    value={structureForm.userId}
                    onChange={(e) => {
                      const uid = e.target.value;
                      setStructureForm({ ...structureForm, userId: uid });
                      loadUserStructure(uid);
                    }}
                    style={{ width: "100%", padding: "0.55rem 0.75rem", border: `1px solid ${C.border}`, borderRadius: C.radiusSm, fontSize: "0.85rem", background: "#fff", fontWeight: 600 }}
                  >
                    {teamMembers.map((m) => (
                      <option key={m.id} value={m.id}>{m.name} ({m.role}) - {m.email}</option>
                    ))}
                  </select>
                </div>

                {/* Section 1: Statutory & Personal Profile */}
                <div>
                  <div style={{ fontSize: "0.82rem", fontWeight: 700, color: C.primary, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "8px", borderBottom: `1px solid ${C.border}`, paddingBottom: "4px" }}>
                    1. Statutory &amp; Personal Profile
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: C.text, marginBottom: "3px" }}>
                        Date of Joining (DOJ)
                      </label>
                      <input
                        type="date"
                        value={structureForm.doj}
                        onChange={(e) => setStructureForm({ ...structureForm, doj: e.target.value })}
                        style={{ width: "100%", padding: "0.45rem 0.6rem", border: `1px solid ${C.border}`, borderRadius: C.radiusSm, fontSize: "0.85rem", boxSizing: "border-box" }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: C.text, marginBottom: "3px" }}>
                        Date of Birth (DOB)
                      </label>
                      <input
                        type="date"
                        value={structureForm.dob}
                        onChange={(e) => setStructureForm({ ...structureForm, dob: e.target.value })}
                        style={{ width: "100%", padding: "0.45rem 0.6rem", border: `1px solid ${C.border}`, borderRadius: C.radiusSm, fontSize: "0.85rem", boxSizing: "border-box" }}
                      />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginTop: "0.6rem" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: C.text, marginBottom: "3px" }}>
                        Official Designation
                      </label>
                      <input
                        placeholder="e.g. Lead Video Editor"
                        value={structureForm.designation}
                        onChange={(e) => setStructureForm({ ...structureForm, designation: e.target.value })}
                        style={{ width: "100%", padding: "0.45rem 0.6rem", border: `1px solid ${C.border}`, borderRadius: C.radiusSm, fontSize: "0.85rem", boxSizing: "border-box" }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: C.text, marginBottom: "3px" }}>
                        Work Location / Branch
                      </label>
                      <input
                        placeholder="e.g. Delhi NCR"
                        value={structureForm.location}
                        onChange={(e) => setStructureForm({ ...structureForm, location: e.target.value })}
                        style={{ width: "100%", padding: "0.45rem 0.6rem", border: `1px solid ${C.border}`, borderRadius: C.radiusSm, fontSize: "0.85rem", boxSizing: "border-box" }}
                      />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem", marginTop: "0.6rem" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: C.text, marginBottom: "3px" }}>
                        PAN Card No
                      </label>
                      <input
                        placeholder="e.g. ABCDE1234F"
                        value={structureForm.panNumber}
                        onChange={(e) => setStructureForm({ ...structureForm, panNumber: e.target.value.toUpperCase() })}
                        style={{ width: "100%", padding: "0.45rem 0.6rem", border: `1px solid ${C.border}`, borderRadius: C.radiusSm, fontSize: "0.85rem", boxSizing: "border-box" }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: C.text, marginBottom: "3px" }}>
                        UAN No (PF)
                      </label>
                      <input
                        placeholder="e.g. 101234567890"
                        value={structureForm.uanNumber}
                        onChange={(e) => setStructureForm({ ...structureForm, uanNumber: e.target.value })}
                        style={{ width: "100%", padding: "0.45rem 0.6rem", border: `1px solid ${C.border}`, borderRadius: C.radiusSm, fontSize: "0.85rem", boxSizing: "border-box" }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: C.text, marginBottom: "3px" }}>
                        ESI No
                      </label>
                      <input
                        placeholder="e.g. 1234567890"
                        value={structureForm.esiNumber}
                        onChange={(e) => setStructureForm({ ...structureForm, esiNumber: e.target.value })}
                        style={{ width: "100%", padding: "0.45rem 0.6rem", border: `1px solid ${C.border}`, borderRadius: C.radiusSm, fontSize: "0.85rem", boxSizing: "border-box" }}
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: Banking & Payout Credentials */}
                <div>
                  <div style={{ fontSize: "0.82rem", fontWeight: 700, color: C.primary, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "8px", borderBottom: `1px solid ${C.border}`, paddingBottom: "4px" }}>
                    2. Banking &amp; Payout Credentials
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: C.text, marginBottom: "3px" }}>
                        Bank Name
                      </label>
                      <input
                        placeholder="e.g. HDFC Bank / ICICI Bank"
                        value={structureForm.bankName}
                        onChange={(e) => setStructureForm({ ...structureForm, bankName: e.target.value })}
                        style={{ width: "100%", padding: "0.45rem 0.6rem", border: `1px solid ${C.border}`, borderRadius: C.radiusSm, fontSize: "0.85rem", boxSizing: "border-box" }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: C.text, marginBottom: "3px" }}>
                        Bank Account Number
                      </label>
                      <input
                        placeholder="e.g. 50100234567890"
                        value={structureForm.bankAccountNumber}
                        onChange={(e) => setStructureForm({ ...structureForm, bankAccountNumber: e.target.value })}
                        style={{ width: "100%", padding: "0.45rem 0.6rem", border: `1px solid ${C.border}`, borderRadius: C.radiusSm, fontSize: "0.85rem", boxSizing: "border-box" }}
                      />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginTop: "0.6rem" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: C.text, marginBottom: "3px" }}>
                        IFSC Code
                      </label>
                      <input
                        placeholder="e.g. HDFC0001234"
                        value={structureForm.ifscCode}
                        onChange={(e) => setStructureForm({ ...structureForm, ifscCode: e.target.value.toUpperCase() })}
                        style={{ width: "100%", padding: "0.45rem 0.6rem", border: `1px solid ${C.border}`, borderRadius: C.radiusSm, fontSize: "0.85rem", boxSizing: "border-box" }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: C.text, marginBottom: "3px" }}>
                        UPI ID (Optional)
                      </label>
                      <input
                        placeholder="e.g. name@okhdfcbank"
                        value={structureForm.upiId}
                        onChange={(e) => setStructureForm({ ...structureForm, upiId: e.target.value })}
                        style={{ width: "100%", padding: "0.45rem 0.6rem", border: `1px solid ${C.border}`, borderRadius: C.radiusSm, fontSize: "0.85rem", boxSizing: "border-box" }}
                      />
                    </div>
                  </div>
                </div>

                {/* Section 3: Compensation & Salary Breakdown */}
                <div>
                  <div style={{ fontSize: "0.82rem", fontWeight: 700, color: C.primary, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "8px", borderBottom: `1px solid ${C.border}`, paddingBottom: "4px" }}>
                    3. Monthly Earnings Breakdown (₹ INR)
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: C.text, marginBottom: "3px" }}>
                        Basic Salary (₹) *
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
                      <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: C.text, marginBottom: "3px" }}>
                        HRA Allowance (₹)
                      </label>
                      <input
                        type="number"
                        value={structureForm.hraAllowance}
                        onChange={(e) => setStructureForm({ ...structureForm, hraAllowance: parseFloat(e.target.value) || 0 })}
                        style={{ width: "100%", padding: "0.45rem 0.6rem", border: `1px solid ${C.border}`, borderRadius: C.radiusSm, fontSize: "0.85rem", boxSizing: "border-box" }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: C.text, marginBottom: "3px" }}>
                        Conveyance Allowance (₹)
                      </label>
                      <input
                        type="number"
                        value={structureForm.conveyanceAllowance}
                        onChange={(e) => setStructureForm({ ...structureForm, conveyanceAllowance: parseFloat(e.target.value) || 0 })}
                        style={{ width: "100%", padding: "0.45rem 0.6rem", border: `1px solid ${C.border}`, borderRadius: C.radiusSm, fontSize: "0.85rem", boxSizing: "border-box" }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: C.text, marginBottom: "3px" }}>
                        Medical Allowance (₹)
                      </label>
                      <input
                        type="number"
                        value={structureForm.medicalAllowance}
                        onChange={(e) => setStructureForm({ ...structureForm, medicalAllowance: parseFloat(e.target.value) || 0 })}
                        style={{ width: "100%", padding: "0.45rem 0.6rem", border: `1px solid ${C.border}`, borderRadius: C.radiusSm, fontSize: "0.85rem", boxSizing: "border-box" }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: C.text, marginBottom: "3px" }}>
                        Special Allowance (₹)
                      </label>
                      <input
                        type="number"
                        value={structureForm.specialAllowance}
                        onChange={(e) => setStructureForm({ ...structureForm, specialAllowance: parseFloat(e.target.value) || 0 })}
                        style={{ width: "100%", padding: "0.45rem 0.6rem", border: `1px solid ${C.border}`, borderRadius: C.radiusSm, fontSize: "0.85rem", boxSizing: "border-box" }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: C.text, marginBottom: "3px" }}>
                        Bonus / Incentive (₹)
                      </label>
                      <input
                        type="number"
                        value={structureForm.bonus}
                        onChange={(e) => setStructureForm({ ...structureForm, bonus: parseFloat(e.target.value) || 0 })}
                        style={{ width: "100%", padding: "0.45rem 0.6rem", border: `1px solid ${C.border}`, borderRadius: C.radiusSm, fontSize: "0.85rem", boxSizing: "border-box" }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: C.text, marginBottom: "3px" }}>
                        Overtime Rate (₹/hr) *
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
                </div>

                {/* Section 4: Statutory Deductions */}
                <div>
                  <div style={{ fontSize: "0.82rem", fontWeight: 700, color: C.primary, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "8px", borderBottom: `1px solid ${C.border}`, paddingBottom: "4px" }}>
                    4. Statutory Deductions (₹ Fixed Monthly)
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: C.text, marginBottom: "3px" }}>
                        Provident Fund / PF (₹)
                      </label>
                      <input
                        type="number"
                        value={structureForm.pfAmount}
                        onChange={(e) => setStructureForm({ ...structureForm, pfAmount: parseFloat(e.target.value) || 0 })}
                        style={{ width: "100%", padding: "0.45rem 0.6rem", border: `1px solid ${C.border}`, borderRadius: C.radiusSm, fontSize: "0.85rem", boxSizing: "border-box" }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: C.text, marginBottom: "3px" }}>
                        ESI (₹)
                      </label>
                      <input
                        type="number"
                        value={structureForm.esiAmount}
                        onChange={(e) => setStructureForm({ ...structureForm, esiAmount: parseFloat(e.target.value) || 0 })}
                        style={{ width: "100%", padding: "0.45rem 0.6rem", border: `1px solid ${C.border}`, borderRadius: C.radiusSm, fontSize: "0.85rem", boxSizing: "border-box" }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: C.text, marginBottom: "3px" }}>
                        Professional Tax (₹)
                      </label>
                      <input
                        type="number"
                        value={structureForm.professionalTax}
                        onChange={(e) => setStructureForm({ ...structureForm, professionalTax: parseFloat(e.target.value) || 0 })}
                        style={{ width: "100%", padding: "0.45rem 0.6rem", border: `1px solid ${C.border}`, borderRadius: C.radiusSm, fontSize: "0.85rem", boxSizing: "border-box" }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: C.text, marginBottom: "3px" }}>
                        Income Tax / TDS (₹)
                      </label>
                      <input
                        type="number"
                        value={structureForm.incomeTax}
                        onChange={(e) => setStructureForm({ ...structureForm, incomeTax: parseFloat(e.target.value) || 0 })}
                        style={{ width: "100%", padding: "0.45rem 0.6rem", border: `1px solid ${C.border}`, borderRadius: C.radiusSm, fontSize: "0.85rem", boxSizing: "border-box" }}
                      />
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "0.5rem", borderTop: `1px solid ${C.border}`, paddingTop: "1rem" }}>
                  <button
                    type="button"
                    onClick={() => setShowStructureModal(false)}
                    style={{ background: "#F3F4F6", color: "#374151", padding: "0.55rem 1.1rem", borderRadius: C.radiusSm, border: "none", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingStructure}
                    style={{ background: C.primary, color: "#fff", padding: "0.55rem 1.4rem", borderRadius: C.radiusSm, border: "none", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer" }}
                  >
                    {savingStructure ? "Saving..." : "Save Employee Settings"}
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

                // Prepare earnings items from actual stored salary structure
                const ss = selectedPayslip.user?.salaryStructure;
                const earnItems: { desc: string; monthly: number; ytd: number }[] = [];
                const basicVal = selectedPayslip.earnedBasic || selectedPayslip.baseSalary || 0;
                earnItems.push({ desc: "Basic Salary", monthly: basicVal, ytd: basicVal });

                // Use stored individual allowances if set, otherwise fall back to splitting total allowances
                if (ss?.hraAllowance && ss.hraAllowance > 0) {
                  earnItems.push({ desc: "HRA Allowance", monthly: ss.hraAllowance, ytd: ss.hraAllowance });
                } else if (selectedPayslip.allowances > 0) {
                  earnItems.push({ desc: "HRA Allowance", monthly: Math.round(selectedPayslip.allowances * 0.4), ytd: Math.round(selectedPayslip.allowances * 0.4) });
                }
                if (ss?.conveyanceAllowance && ss.conveyanceAllowance > 0) {
                  earnItems.push({ desc: "Conveyance Allowance", monthly: ss.conveyanceAllowance, ytd: ss.conveyanceAllowance });
                } else if (selectedPayslip.allowances > 0) {
                  earnItems.push({ desc: "Conveyance Allowance", monthly: Math.round(selectedPayslip.allowances * 0.2), ytd: Math.round(selectedPayslip.allowances * 0.2) });
                }
                if (ss?.medicalAllowance && ss.medicalAllowance > 0) {
                  earnItems.push({ desc: "Medical Allowance", monthly: ss.medicalAllowance, ytd: ss.medicalAllowance });
                }
                if (ss?.specialAllowance && ss.specialAllowance > 0) {
                  earnItems.push({ desc: "Special Allowance", monthly: ss.specialAllowance, ytd: ss.specialAllowance });
                } else if (selectedPayslip.allowances > 0 && !(ss?.hraAllowance) && !(ss?.conveyanceAllowance)) {
                  // Legacy: remaining allowance as special
                  const usedFraction = 0.6;
                  earnItems.push({ desc: "Special Allowance", monthly: Math.round(selectedPayslip.allowances * (1 - usedFraction)), ytd: Math.round(selectedPayslip.allowances * (1 - usedFraction)) });
                }
                if (selectedPayslip.overtimePay > 0) {
                  earnItems.push({ desc: "Overtime Allowance", monthly: selectedPayslip.overtimePay, ytd: selectedPayslip.overtimePay });
                }
                if ((ss?.bonus && ss.bonus > 0) || selectedPayslip.bonus > 0) {
                  const bonusAmt = ss?.bonus || selectedPayslip.bonus || 0;
                  earnItems.push({ desc: "Bonus / Incentive", monthly: bonusAmt, ytd: bonusAmt });
                }

                // Prepare deductions items
                const dedItems: { desc: string; monthly?: number; ytd?: number }[] = [];
                // Statutory deductions from salary structure
                const pfAmt = ss?.pfAmount || 0;
                const esiAmt = ss?.esiAmount || 0;
                const profTax = ss?.professionalTax || 0;
                const incomeTaxAmt = ss?.incomeTax || 0;

                dedItems.push({ desc: "Provident Fund (PF)", monthly: pfAmt > 0 ? pfAmt : undefined, ytd: pfAmt > 0 ? pfAmt : undefined });
                dedItems.push({ desc: "ESI", monthly: esiAmt > 0 ? esiAmt : undefined, ytd: esiAmt > 0 ? esiAmt : undefined });
                dedItems.push({ desc: "Professional Tax", monthly: profTax > 0 ? profTax : undefined, ytd: profTax > 0 ? profTax : undefined });
                dedItems.push({ desc: "Income Tax (TDS)", monthly: incomeTaxAmt > 0 ? incomeTaxAmt : undefined, ytd: incomeTaxAmt > 0 ? incomeTaxAmt : undefined });

                if (selectedPayslip.lateDeductions > 0) {
                  dedItems.push({ desc: "Lateness Deduction", monthly: selectedPayslip.lateDeductions, ytd: selectedPayslip.lateDeductions });
                }
                if (selectedPayslip.unpaidLeaveDeductions > 0) {
                  dedItems.push({ desc: "Unpaid Leave (LWP)", monthly: selectedPayslip.unpaidLeaveDeductions, ytd: selectedPayslip.unpaidLeaveDeductions });
                }
                if (selectedPayslip.otherDeductions > 0) {
                  dedItems.push({ desc: "Other Deductions", monthly: selectedPayslip.otherDeductions, ytd: selectedPayslip.otherDeductions });
                }

                const totalGross = earnItems.reduce((acc, it) => acc + it.monthly, 0);
                const totalDed = dedItems.reduce((acc, it) => acc + (it.monthly || 0), 0);
                const finalNet = selectedPayslip.netSalary > 0 ? selectedPayslip.netSalary : (totalGross - totalDed);

                const maxRows = Math.max(earnItems.length, dedItems.length, 12);
                const rowIndexes = Array.from({ length: maxRows }, (_, i) => i);

                const companyLegal = companySettings?.gstLegalName || "RESAWC LLP";
                const companyAddr = companySettings?.companyAddress || "Resawc Creative Studio Hub, New Delhi, India";

                return (
                  <div>
                    {/* Print CSS */}
                    <style>{`
                      @media print {
                        @page {
                          size: A4 portrait;
                          margin: 8mm 10mm;
                        }
                        body {
                          background: #FFFFFF !important;
                          margin: 0 !important;
                          padding: 0 !important;
                        }
                        body * {
                          visibility: hidden !important;
                        }
                        #printable-payslip, #printable-payslip * {
                          visibility: visible !important;
                        }
                        #printable-payslip {
                          position: fixed !important;
                          left: 0 !important;
                          top: 0 !important;
                          right: 0 !important;
                          width: 100% !important;
                          max-width: 100% !important;
                          margin: 0 !important;
                          padding: 14px 18px !important;
                          border: 2px solid #000000 !important;
                          box-shadow: none !important;
                          background: #FFFFFF !important;
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
                          padding: "7px 18px",
                          borderRadius: "3px",
                          display: "inline-flex",
                          alignItems: "center",
                          fontWeight: 800,
                          fontSize: "16px",
                          letterSpacing: "1px",
                          fontFamily: "Arial, sans-serif"
                        }}>
                          {companySettings?.gstLegalName || companySettings?.gstTradeName || "RESAWC LLP"}
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
                              {selectedPayslip.user.salaryStructure?.location || companySettings?.gstState || "Delhi NCR"}
                            </td>
                          </tr>
                          <tr>
                            <td style={{ border: "1px solid #000000", padding: "4px 8px" }}>Date of Joining</td>
                            <td style={{ border: "1px solid #000000", padding: "4px 8px" }}>
                              {(() => {
                                const val = selectedPayslip.user.salaryStructure?.doj;
                                if (!val) return "—";
                                const p = val.split("-");
                                if (p.length === 3) {
                                  const m = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
                                  const idx = parseInt(p[1], 10) - 1;
                                  return `${p[2]}-${m[idx] || p[1]}-${p[0]}`;
                                }
                                return val;
                              })()}
                            </td>
                            <td style={{ border: "1px solid #000000", padding: "4px 8px" }}>Designation</td>
                            <td style={{ border: "1px solid #000000", padding: "4px 8px" }}>
                              {selectedPayslip.user.salaryStructure?.designation || (
                                selectedPayslip.user.role === "admin"
                                  ? "Managing Director"
                                  : selectedPayslip.user.role === "photo_editor"
                                  ? "Photo Retouching Artist"
                                  : selectedPayslip.user.role === "video_editor"
                                  ? "Lead Video Editor"
                                  : selectedPayslip.user.role === "marketing"
                                  ? "Client Growth Specialist"
                                  : "Creative Executive"
                              )}
                            </td>
                          </tr>
                          <tr>
                            <td style={{ border: "1px solid #000000", padding: "4px 8px" }}>Date of Birth</td>
                            <td style={{ border: "1px solid #000000", padding: "4px 8px" }}>
                              {(() => {
                                const val = selectedPayslip.user.salaryStructure?.dob;
                                if (!val) return "—";
                                const p = val.split("-");
                                if (p.length === 3) {
                                  const m = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
                                  const idx = parseInt(p[1], 10) - 1;
                                  return `${p[2]}-${m[idx] || p[1]}-${p[0]}`;
                                }
                                return val;
                              })()}
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
                              {selectedPayslip.user.salaryStructure?.uanNumber || "NA"}
                            </td>
                            <td style={{ border: "1px solid #000000", padding: "4px 8px" }}>ESI No</td>
                            <td style={{ border: "1px solid #000000", padding: "4px 8px" }}>
                              {selectedPayslip.user.salaryStructure?.esiNumber || "NA"}
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

                      {/* Dual Official Signatures */}
                      <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-end",
                        marginTop: "36px",
                        padding: "0 14px",
                      }}>
                        <div style={{ textAlign: "center", width: "190px" }}>
                          <div style={{ borderBottom: "1px solid #000000", marginBottom: "6px", height: "28px" }} />
                          <div style={{ fontSize: "11px", fontWeight: 700 }}>Employee Signature</div>
                        </div>
                        <div style={{ textAlign: "center", width: "220px" }}>
                          <div style={{ borderBottom: "1px solid #000000", marginBottom: "6px", height: "28px" }} />
                          <div style={{ fontSize: "11px", fontWeight: 700 }}>Authorized Signatory</div>
                          <div style={{ fontSize: "10px", color: "#4B5563" }}>For RESAWC LLP</div>
                        </div>
                      </div>
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
                    style={{ width: "100%", padding: "0.55rem 0.75rem", border: `1px solid ${C.border}`, borderRadius: C.radiusSm, fontSize: "0.85rem", boxSizing: "border-box", background: "#FFFFFF", color: C.text, colorScheme: "light" }}
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
                    style={{ width: "100%", padding: "0.55rem 0.75rem", border: `1px solid ${C.border}`, borderRadius: C.radiusSm, fontSize: "0.85rem", boxSizing: "border-box", background: "#FFFFFF", color: C.text, colorScheme: "light" }}
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
