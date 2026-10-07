"use client";

import { useState, useEffect, useRef } from "react";
import {
  Receipt, Plus, Search, Filter, CheckCircle2, Clock,
  AlertCircle, Download, Printer, ExternalLink, Trash2,
  Building2, CreditCard, ChevronDown, Check, X, ArrowUpRight,
  Sparkles, DollarSign, Edit3, Send
} from "lucide-react";
import { RoleGuard } from "@/components/RoleGuard";
import { useRole } from "@/context/RoleContext";

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

interface InvoiceItem {
  id?: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  amount: number;
  editingJobId?: string | null;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  client: {
    id: string;
    clientId: string;
    companyName: string;
    contactPerson: string;
    phone?: string;
    email?: string;
    address?: string;
  };
  issueDate: string;
  dueDate: string;
  status: string;
  currency: string;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  amountPaid: number;
  paymentDate?: string;
  paymentMethod?: string;
  paymentReference?: string;
  notes?: string;
  termsAndConditions?: string;
  items: InvoiceItem[];
  companySettings?: any;
}

interface RateCard {
  id: string;
  clientId: string;
  client: {
    id: string;
    clientId: string;
    companyName: string;
    contactPerson: string;
  };
  photoCullingRate: number;
  photoColorRate: number;
  photoRetouchRate: number;
  videoPerMinuteRate: number;
  videoReelRate: number;
  monthlyRetainer: number;
  customRates?: string | Record<string, number>;
  customNotes?: string;
}

interface CompanyService {
  id: string;
  name: string;
  code?: string | null;
  category: string;
  unit: string;
  defaultRate: number;
  sacCode?: string | null;
  description?: string | null;
  isActive: boolean;
  sortOrder: number;
}

const DEFAULT_FALLBACK_SERVICES: CompanyService[] = [
  { id: "s1", name: "Photo Culling", code: "photoCullingRate", category: "PHOTO", unit: "img", defaultRate: 3, isActive: true, sortOrder: 1 },
  { id: "s2", name: "Color Correction", code: "photoColorRate", category: "PHOTO", unit: "img", defaultRate: 7, isActive: true, sortOrder: 2 },
  { id: "s3", name: "Retouching", code: "photoRetouchRate", category: "PHOTO", unit: "img", defaultRate: 15, isActive: true, sortOrder: 3 },
  { id: "s4", name: "Video Editing", code: "videoPerMinuteRate", category: "VIDEO", unit: "min", defaultRate: 500, isActive: true, sortOrder: 4 },
  { id: "s5", name: "Reels / Shorts", code: "videoReelRate", category: "VIDEO", unit: "reel", defaultRate: 1200, isActive: true, sortOrder: 5 },
  { id: "s6", name: "Monthly Retainer", code: "monthlyRetainer", category: "RETAINER", unit: "month", defaultRate: 0, isActive: true, sortOrder: 6 },
];

export default function FinancePage() {
  const { user } = useRole();
  const [activeTab, setActiveTab] = useState<"invoices" | "rate-cards">("invoices");
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [rateCards, setRateCards] = useState<RateCard[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [completedJobs, setCompletedJobs] = useState<any[]>([]);
  const [summary, setSummary] = useState({
    totalBilled: 0,
    totalReceived: 0,
    outstanding: 0,
    paidCount: 0,
    pendingCount: 0,
    totalCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedForPayment, setSelectedForPayment] = useState<Invoice | null>(null);
  const [showRateModal, setShowRateModal] = useState(false);
  const [selectedRateCard, setSelectedRateCard] = useState<RateCard | null>(null);

  // Create Form State
  const [invoiceForm, setInvoiceForm] = useState<{
    clientId: string;
    issueDate: string;
    dueDate: string;
    taxRate: number;
    discountAmount: number;
    notes: string;
    termsAndConditions: string;
    items: InvoiceItem[];
  }>({
    clientId: "",
    issueDate: new Date().toISOString().split("T")[0],
    dueDate: new Date(Date.now() + 15 * 86400000).toISOString().split("T")[0],
    taxRate: 18,
    discountAmount: 0,
    notes: "Thank you for partnering with Resawc LLP!",
    termsAndConditions: "1. Payment is due within 15 days of invoice date.\n2. All payments must be made in Indian Rupees (INR ₹) via Bank Transfer / UPI.\n3. GST applied as per Indian Tax regulations.",
    items: [
      { description: "", quantity: 1, unit: "photos", unitPrice: 0, amount: 0 },
    ],
  });

  // Payment Form State
  const [paymentForm, setPaymentForm] = useState({
    amountPaid: 0,
    paymentDate: new Date().toISOString().split("T")[0],
    paymentMethod: "Bank Transfer",
    paymentReference: "",
  });

  const [companyServices, setCompanyServices] = useState<CompanyService[]>([]);

  // Rate Card Form State
  const [rateForm, setRateForm] = useState({
    clientId: "",
    photoCullingRate: 3,
    photoColorRate: 7,
    photoRetouchRate: 15,
    videoPerMinuteRate: 500,
    videoReelRate: 1200,
    monthlyRetainer: 0,
    customRates: {} as Record<string, number>,
    customNotes: "",
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [invRes, rcRes, clRes, jbRes, svRes] = await Promise.all([
        fetch(`/api/finance/invoices?status=${statusFilter}&search=${encodeURIComponent(search)}`),
        fetch("/api/finance/rate-cards"),
        fetch("/api/clients"),
        fetch("/api/jobs?status=DELIVERED"),
        fetch("/api/services"),
      ]);

      const invData = await invRes.json();
      const rcData = await rcRes.json();
      const clData = await clRes.json();
      const jbData = await jbRes.json();
      const svData = await svRes.json();

      if (invData.success) {
        setInvoices(invData.data);
        if (invData.summary) setSummary(invData.summary);
      }
      if (rcData.success) setRateCards(rcData.data);
      if (clData.success) setClients(clData.data);
      if (jbData.success) setCompletedJobs(jbData.data);
      if (svData.success && Array.isArray(svData.data)) setCompanyServices(svData.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter, search]);

  // Recalculate line items
  const handleItemChange = (index: number, field: keyof InvoiceItem, value: any) => {
    const updated = [...invoiceForm.items];
    updated[index] = { ...updated[index], [field]: value };
    if (field === "quantity" || field === "unitPrice") {
      const q = parseFloat(String(updated[index].quantity)) || 0;
      const r = parseFloat(String(updated[index].unitPrice)) || 0;
      updated[index].amount = Math.round(q * r * 100) / 100;
    }
    setInvoiceForm({ ...invoiceForm, items: updated });
  };

  const handleAddItem = () => {
    setInvoiceForm({
      ...invoiceForm,
      items: [
        ...invoiceForm.items,
        { description: "", quantity: 1, unit: "photos", unitPrice: 0, amount: 0 },
      ],
    });
  };

  const handleRemoveItem = (index: number) => {
    if (invoiceForm.items.length === 1) return;
    setInvoiceForm({
      ...invoiceForm,
      items: invoiceForm.items.filter((_, i) => i !== index),
    });
  };

  // Quick import from job
  const handleImportJob = (job: any) => {
    const clientRC = rateCards.find(rc => rc.clientId === job.clientId);
    let rate = 12;
    let unit = "photos";
    let qty = job.totalImages || 1;

    if (job.category === "VIDEO") {
      rate = clientRC?.videoReelRate || 1200;
      unit = "reels";
      qty = 1;
    } else {
      rate = clientRC?.photoRetouchRate || 15;
    }

    setInvoiceForm(prev => ({
      ...prev,
      clientId: job.clientId,
      items: [
        ...prev.items,
        {
          description: `Job #${job.jobNumber}: ${job.title} (${job.serviceType})`,
          quantity: qty,
          unit,
          unitPrice: rate,
          amount: qty * rate,
          editingJobId: job.id,
        },
      ],
    }));
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceForm.clientId) return alert("Please select a client");
    try {
      const res = await fetch("/api/finance/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invoiceForm),
      });
      const data = await res.json();
      if (data.success) {
        setShowCreateModal(false);
        fetchData();
      } else {
        alert(data.error || "Failed to create invoice");
      }
    } catch {
      alert("Network error");
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedForPayment) return;
    try {
      const res = await fetch("/api/finance/invoices", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedForPayment.id,
          amountPaid: paymentForm.amountPaid,
          paymentDate: paymentForm.paymentDate,
          paymentMethod: paymentForm.paymentMethod,
          paymentReference: paymentForm.paymentReference,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowPaymentModal(false);
        fetchData();
      } else {
        alert(data.error || "Failed to record payment");
      }
    } catch {
      alert("Network error");
    }
  };

  const handleSaveRateCard = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/finance/rate-cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rateForm),
      });
      const data = await res.json();
      if (data.success) {
        setShowRateModal(false);
        fetchData();
      } else {
        alert(data.error || "Failed to save rate card");
      }
    } catch {
      alert("Network error");
    }
  };

  const handleDeleteInvoice = async (id: string) => {
    if (!confirm("Are you sure you want to delete this invoice?")) return;
    try {
      const res = await fetch(`/api/finance/invoices?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) fetchData();
    } catch {
      alert("Failed to delete invoice");
    }
  };

  const handleSendInvoice = async (id: string, invoiceNumber: string) => {
    try {
      const res = await fetch("/api/finance/invoices", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "SENT" }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`Invoice #${invoiceNumber} marked as SENT to client!`);
        fetchData();
      } else {
        alert(data.error || "Failed to update invoice");
      }
    } catch {
      alert("Network error");
    }
  };

  const formSubtotal = invoiceForm.items.reduce((s, it) => s + (it.amount || 0), 0);
  const formTaxable = Math.max(0, formSubtotal - (invoiceForm.discountAmount || 0));
  const formTax = Math.round((formTaxable * (invoiceForm.taxRate / 100)) * 100) / 100;
  const formTotal = formTaxable + formTax;

  return (
    <RoleGuard allowedRoles={["admin"]}>
      <div style={{ maxWidth: "1280px", margin: "0 auto", paddingBottom: "3rem" }}>

        {/* ── Page Header ── */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "flex-start",
          marginBottom: "1.75rem", flexWrap: "wrap", gap: "1rem"
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <h1 style={{ fontSize: "1.65rem", fontWeight: 800, color: C.text, letterSpacing: "-0.03em", margin: 0 }}>
                Finance, Invoicing & GST
              </h1>
              <span style={{
                background: "#EFF6FF", color: C.primary, fontSize: "0.75rem", fontWeight: 700,
                padding: "2px 8px", borderRadius: "999px", border: "1px solid #BFDBFE"
              }}>
                100% INR (₹) & GST
              </span>
            </div>
            <p style={{ color: C.muted, fontSize: "0.9rem", margin: "4px 0 0" }}>
              Issue GST-compliant tax invoices, track client receivables, and customize client rate cards.
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={() => {
                const initialCustom: Record<string, number> = {};
                (companyServices.length > 0 ? companyServices : DEFAULT_FALLBACK_SERVICES).forEach(s => {
                  initialCustom[s.id] = s.defaultRate;
                  initialCustom[s.name] = s.defaultRate;
                });
                setRateForm({
                  clientId: clients[0]?.id || "",
                  photoCullingRate: 3,
                  photoColorRate: 7,
                  photoRetouchRate: 15,
                  videoPerMinuteRate: 500,
                  videoReelRate: 1200,
                  monthlyRetainer: 0,
                  customRates: initialCustom,
                  customNotes: "",
                });
                setShowRateModal(true);
              }}
              style={{
                display: "flex", alignItems: "center", gap: "6px",
                background: "#FFFFFF", color: C.text,
                padding: "0.6rem 1rem", borderRadius: C.radiusSm,
                fontSize: "0.85rem", fontWeight: 600, border: `1px solid ${C.border}`,
                cursor: "pointer"
              }}
            >
              <CreditCard size={15} color={C.muted} /> Client Rate Cards
            </button>

            <button
              onClick={() => {
                setInvoiceForm({
                  clientId: clients[0]?.id || "",
                  issueDate: new Date().toISOString().split("T")[0],
                  dueDate: new Date(Date.now() + 15 * 86400000).toISOString().split("T")[0],
                  taxRate: 18,
                  discountAmount: 0,
                  notes: "Thank you for partnering with Resawc LLP!",
                  termsAndConditions: "1. Payment is due within 15 days of invoice date.\n2. All payments must be made in Indian Rupees (INR ₹) via Bank Transfer / UPI.\n3. GST applied as per Indian Tax regulations.",
                  items: [
                    { description: "", quantity: 1, unit: "photos", unitPrice: 0, amount: 0 },
                  ],
                });
                setShowCreateModal(true);
              }}
              style={{
                display: "flex", alignItems: "center", gap: "6px",
                background: C.primary, color: "#fff",
                padding: "0.6rem 1.25rem", borderRadius: C.radiusSm,
                fontSize: "0.85rem", fontWeight: 600, border: "none",
                cursor: "pointer", boxShadow: "0 2px 6px rgba(26,86,219,0.25)"
              }}
            >
              <Plus size={16} /> New GST Invoice
            </button>
          </div>
        </div>

        {/* ── Summary Stats Row ── */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
          gap: "12px", marginBottom: "1.75rem"
        }}>
          <div style={{ background: C.card, padding: "1.1rem 1.25rem", borderRadius: C.radius, border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: "0.78rem", fontWeight: 600, color: C.muted, textTransform: "uppercase" }}>Total Billed</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: C.text, marginTop: "4px" }}>
              ₹{summary.totalBilled.toLocaleString("en-IN")}
            </div>
            <div style={{ fontSize: "0.75rem", color: C.muted, marginTop: "4px" }}>
              Across {summary.totalCount} invoices
            </div>
          </div>

          <div style={{ background: C.card, padding: "1.1rem 1.25rem", borderRadius: C.radius, border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "#059669", textTransform: "uppercase" }}>Total Collected</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#059669", marginTop: "4px" }}>
              ₹{summary.totalReceived.toLocaleString("en-IN")}
            </div>
            <div style={{ fontSize: "0.75rem", color: "#059669", marginTop: "4px" }}>
              {summary.paidCount} Fully Settled
            </div>
          </div>

          <div style={{ background: C.card, padding: "1.1rem 1.25rem", borderRadius: C.radius, border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "#DC2626", textTransform: "uppercase" }}>Outstanding Receivables</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#DC2626", marginTop: "4px" }}>
              ₹{summary.outstanding.toLocaleString("en-IN")}
            </div>
            <div style={{ fontSize: "0.75rem", color: "#DC2626", marginTop: "4px" }}>
              {summary.pendingCount} Pending / Partial
            </div>
          </div>

          <div style={{ background: C.card, padding: "1.1rem 1.25rem", borderRadius: C.radius, border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "#7C3AED", textTransform: "uppercase" }}>GST Tax Applicable</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#7C3AED", marginTop: "4px" }}>
              18% GST
            </div>
            <div style={{ fontSize: "0.75rem", color: "#7C3AED", marginTop: "4px" }}>
              9% CGST + 9% SGST / IGST
            </div>
          </div>
        </div>

        {/* ── Sub Navigation Tabs ── */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "1.25rem" }}>
          <button
            onClick={() => setActiveTab("invoices")}
            style={{
              padding: "0.45rem 1.1rem", borderRadius: "999px",
              fontSize: "0.85rem", fontWeight: activeTab === "invoices" ? 700 : 500,
              background: activeTab === "invoices" ? C.primary : "#FFFFFF",
              color: activeTab === "invoices" ? "#FFFFFF" : C.muted,
              border: `1px solid ${activeTab === "invoices" ? C.primary : C.border}`,
              cursor: "pointer", transition: "all 0.15s ease"
            }}
          >
            All Invoices ({invoices.length})
          </button>
          <button
            onClick={() => setActiveTab("rate-cards")}
            style={{
              padding: "0.45rem 1.1rem", borderRadius: "999px",
              fontSize: "0.85rem", fontWeight: activeTab === "rate-cards" ? 700 : 500,
              background: activeTab === "rate-cards" ? C.primary : "#FFFFFF",
              color: activeTab === "rate-cards" ? "#FFFFFF" : C.muted,
              border: `1px solid ${activeTab === "rate-cards" ? C.primary : C.border}`,
              cursor: "pointer", transition: "all 0.15s ease"
            }}
          >
            Client Rate Cards ({rateCards.length})
          </button>
        </div>

        {/* ═════════ TAB 1: INVOICES LIST ═════════ */}
        {activeTab === "invoices" && (
          <div>
            {/* Filter bar */}
            <div style={{
              background: C.card, borderRadius: C.radius, border: `1px solid ${C.border}`,
              padding: "0.85rem 1.25rem", marginBottom: "1.25rem",
              display: "flex", justifyContent: "space-between", alignItems: "center",
              flexWrap: "wrap", gap: "1rem"
            }}>
              <div style={{ display: "flex", gap: "6px" }}>
                {["ALL", "PAID", "SENT", "DRAFT", "PARTIAL"].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    style={{
                      padding: "0.35rem 0.8rem", borderRadius: "6px",
                      fontSize: "0.78rem", fontWeight: statusFilter === st ? 700 : 500,
                      background: statusFilter === st ? "#EFF6FF" : "transparent",
                      color: statusFilter === st ? C.primary : C.muted,
                      border: "none", cursor: "pointer"
                    }}
                  >
                    {st}
                  </button>
                ))}
              </div>

              <div style={{
                display: "flex", alignItems: "center", gap: "8px",
                background: "#F9FAFB", border: `1px solid ${C.border}`,
                borderRadius: C.radiusSm, padding: "0.35rem 0.75rem", width: "260px"
              }}>
                <Search size={14} color={C.muted} />
                <input
                  placeholder="Search invoice # or client..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ border: "none", background: "transparent", outline: "none", fontSize: "0.82rem", width: "100%" }}
                />
              </div>
            </div>

            {/* Invoices Table */}
            <div style={{ background: C.card, borderRadius: C.radius, border: `1px solid ${C.border}`, overflow: "hidden" }}>
              {loading ? (
                <div style={{ padding: "3rem", textAlign: "center", color: C.muted }}>Loading Invoices...</div>
              ) : invoices.length === 0 ? (
                <div style={{ padding: "4rem", textAlign: "center" }}>
                  <Receipt size={36} color={C.muted} style={{ margin: "0 auto 12px" }} />
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: C.text, margin: "0 0 6px" }}>No invoices found</h3>
                  <p style={{ color: C.muted, fontSize: "0.85rem", margin: 0 }}>Click "+ New GST Invoice" to generate an invoice for a client.</p>
                </div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.85rem" }}>
                  <thead>
                    <tr style={{ background: "#F9FAFB", borderBottom: `1px solid ${C.border}` }}>
                      <th style={{ padding: "0.85rem 1.25rem", fontWeight: 700, color: C.muted, fontSize: "0.78rem" }}>INVOICE #</th>
                      <th style={{ padding: "0.85rem 1rem", fontWeight: 700, color: C.muted, fontSize: "0.78rem" }}>CLIENT</th>
                      <th style={{ padding: "0.85rem 1rem", fontWeight: 700, color: C.muted, fontSize: "0.78rem" }}>DATES</th>
                      <th style={{ padding: "0.85rem 1rem", fontWeight: 700, color: C.muted, fontSize: "0.78rem" }}>SUBTOTAL</th>
                      <th style={{ padding: "0.85rem 1rem", fontWeight: 700, color: C.muted, fontSize: "0.78rem" }}>GST (18%)</th>
                      <th style={{ padding: "0.85rem 1rem", fontWeight: 700, color: C.muted, fontSize: "0.78rem" }}>TOTAL (₹)</th>
                      <th style={{ padding: "0.85rem 1rem", fontWeight: 700, color: C.muted, fontSize: "0.78rem" }}>STATUS</th>
                      <th style={{ padding: "0.85rem 1.25rem", fontWeight: 700, color: C.muted, fontSize: "0.78rem", textAlign: "right" }}>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv) => {
                      const balance = Math.max(0, inv.totalAmount - inv.amountPaid);
                      return (
                        <tr
                          key={inv.id}
                          style={{ borderBottom: `1px solid ${C.border}`, transition: "background 0.15s ease" }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "#F9FAFB")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                        >
                          <td style={{ padding: "1rem 1.25rem", fontWeight: 800, color: C.primary }}>
                            {inv.invoiceNumber}
                          </td>

                          <td style={{ padding: "1rem 1rem" }}>
                            <div style={{ fontWeight: 700, color: C.text }}>{inv.client.companyName}</div>
                            <div style={{ fontSize: "0.75rem", color: C.muted }}>{inv.client.contactPerson}</div>
                          </td>

                          <td style={{ padding: "1rem 1rem" }}>
                            <div style={{ fontSize: "0.82rem", color: C.text }}>Issued: {inv.issueDate}</div>
                            <div style={{ fontSize: "0.75rem", color: "#DC2626" }}>Due: {inv.dueDate}</div>
                          </td>

                          <td style={{ padding: "1rem 1rem", color: C.text, fontWeight: 600 }}>
                            ₹{inv.subtotal.toLocaleString("en-IN")}
                          </td>

                          <td style={{ padding: "1rem 1rem", color: "#7C3AED", fontWeight: 600 }}>
                            ₹{inv.taxAmount.toLocaleString("en-IN")}
                          </td>

                          <td style={{ padding: "1rem 1rem" }}>
                            <div style={{ fontWeight: 800, color: C.text }}>
                              ₹{inv.totalAmount.toLocaleString("en-IN")}
                            </div>
                            {inv.amountPaid > 0 && inv.status !== "PAID" && (
                              <div style={{ fontSize: "0.75rem", color: "#059669" }}>
                                Paid: ₹{inv.amountPaid.toLocaleString("en-IN")} (Bal: ₹{balance.toLocaleString("en-IN")})
                              </div>
                            )}
                          </td>

                          <td style={{ padding: "1rem 1rem" }}>
                            <span style={{
                              padding: "3px 8px", borderRadius: "999px", fontSize: "0.75rem", fontWeight: 700,
                              background: inv.status === "PAID" ? "#ECFDF5" : inv.status === "PARTIAL" ? "#FEF3C7" : inv.status === "SENT" ? "#EFF6FF" : "#F3F4F6",
                              color: inv.status === "PAID" ? "#059669" : inv.status === "PARTIAL" ? "#B45309" : inv.status === "SENT" ? C.primary : "#4B5563",
                              border: `1px solid ${inv.status === "PAID" ? "#A7F3D0" : inv.status === "PARTIAL" ? "#FDE68A" : inv.status === "SENT" ? "#BFDBFE" : "#E5E7EB"}`
                            }}>
                              {inv.status}
                            </span>
                          </td>

                          <td style={{ padding: "1rem 1.25rem", textAlign: "right" }}>
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "6px" }}>
                              <button
                                onClick={async () => {
                                  // Fetch complete details with items
                                  const res = await fetch(`/api/finance/invoices?id=${inv.id}`);
                                  const data = await res.json();
                                  if (data.success) {
                                    setSelectedInvoice(data.data);
                                    setShowInvoiceModal(true);
                                  }
                                }}
                                title="View & Print GST Tax Invoice"
                                style={{
                                  background: "#EFF6FF", color: C.primary, border: "1px solid #BFDBFE",
                                  padding: "4px 8px", borderRadius: "4px", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer",
                                  display: "inline-flex", alignItems: "center", gap: "4px"
                                }}
                              >
                                <Printer size={13} /> View / Print
                              </button>

                              {inv.status === "DRAFT" && (
                                <button
                                  onClick={() => handleSendInvoice(inv.id, inv.invoiceNumber)}
                                  title="Mark invoice as Sent to client"
                                  style={{
                                    background: "#FAF5FF", color: "#7C3AED", border: "1px solid #E9D5FF",
                                    padding: "4px 8px", borderRadius: "4px", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer",
                                    display: "inline-flex", alignItems: "center", gap: "4px"
                                  }}
                                >
                                  <Send size={13} /> Send
                                </button>
                              )}

                              {inv.status !== "PAID" && (
                                <button
                                  onClick={() => {
                                    setSelectedForPayment(inv);
                                    setPaymentForm({
                                      amountPaid: inv.totalAmount - inv.amountPaid,
                                      paymentDate: new Date().toISOString().split("T")[0],
                                      paymentMethod: "Bank Transfer",
                                      paymentReference: "",
                                    });
                                    setShowPaymentModal(true);
                                  }}
                                  title="Record Payment"
                                  style={{
                                    background: "#ECFDF5", color: "#059669", border: "1px solid #A7F3D0",
                                    padding: "4px 8px", borderRadius: "4px", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer",
                                    display: "inline-flex", alignItems: "center", gap: "4px"
                                  }}
                                >
                                  <CreditCard size={13} /> Record Pay
                                </button>
                              )}

                              <button
                                onClick={() => handleDeleteInvoice(inv.id)}
                                title="Delete Invoice"
                                style={{
                                  background: "transparent", color: "#9CA3AF", border: "none",
                                  padding: "4px", cursor: "pointer"
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.color = "#DC2626")}
                                onMouseLeave={(e) => (e.currentTarget.style.color = "#9CA3AF")}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
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

        {/* ═════════ TAB 2: RATE CARDS VIEW ═════════ */}
        {activeTab === "rate-cards" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
            {rateCards.map((rc) => (
              <div
                key={rc.id}
                style={{
                  background: C.card, borderRadius: C.radius, border: `1px solid ${C.border}`,
                  padding: "1.25rem", boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                  <div>
                    <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: C.text, margin: 0 }}>
                      {rc.client.companyName}
                    </h3>
                    <p style={{ fontSize: "0.8rem", color: C.muted, margin: "2px 0 0" }}>
                      ID: {rc.client.clientId} • Contact: {rc.client.contactPerson}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedRateCard(rc);
                      const customMap: Record<string, number> = {};
                      if (rc.customRates) {
                        try {
                          const parsed = typeof rc.customRates === "string" ? JSON.parse(rc.customRates) : rc.customRates;
                          Object.assign(customMap, parsed);
                        } catch {}
                      }
                      (companyServices.length > 0 ? companyServices : DEFAULT_FALLBACK_SERVICES).forEach(s => {
                        if (customMap[s.id] === undefined && customMap[s.name] === undefined) {
                          if (s.code === "photoCullingRate") customMap[s.id] = rc.photoCullingRate;
                          else if (s.code === "photoColorRate") customMap[s.id] = rc.photoColorRate;
                          else if (s.code === "photoRetouchRate") customMap[s.id] = rc.photoRetouchRate;
                          else if (s.code === "videoPerMinuteRate") customMap[s.id] = rc.videoPerMinuteRate;
                          else if (s.code === "videoReelRate") customMap[s.id] = rc.videoReelRate;
                          else if (s.code === "monthlyRetainer") customMap[s.id] = rc.monthlyRetainer;
                          else customMap[s.id] = s.defaultRate;
                        }
                      });
                      setRateForm({
                        clientId: rc.clientId,
                        photoCullingRate: rc.photoCullingRate,
                        photoColorRate: rc.photoColorRate,
                        photoRetouchRate: rc.photoRetouchRate,
                        videoPerMinuteRate: rc.videoPerMinuteRate,
                        videoReelRate: rc.videoReelRate,
                        monthlyRetainer: rc.monthlyRetainer,
                        customRates: customMap,
                        customNotes: rc.customNotes || "",
                      });
                      setShowRateModal(true);
                    }}
                    style={{
                      background: "#F3F4F6", border: `1px solid ${C.border}`,
                      padding: "4px 8px", borderRadius: C.radiusSm, fontSize: "0.75rem",
                      fontWeight: 700, color: C.text, cursor: "pointer",
                      display: "flex", alignItems: "center", gap: "4px"
                    }}
                  >
                    <Edit3 size={12} /> Edit
                  </button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "0.82rem" }}>
                  {(companyServices.length > 0 ? companyServices.filter(s => s.isActive) : DEFAULT_FALLBACK_SERVICES).map(s => {
                    let rateVal = s.defaultRate;
                    if (rc.customRates) {
                      try {
                        const parsed = typeof rc.customRates === "string" ? JSON.parse(rc.customRates) : rc.customRates;
                        if (parsed[s.id] !== undefined) rateVal = parsed[s.id];
                        else if (parsed[s.name] !== undefined) rateVal = parsed[s.name];
                      } catch {}
                    }
                    if (s.code === "photoCullingRate" && rc.photoCullingRate !== undefined) rateVal = rc.photoCullingRate;
                    else if (s.code === "photoColorRate" && rc.photoColorRate !== undefined) rateVal = rc.photoColorRate;
                    else if (s.code === "photoRetouchRate" && rc.photoRetouchRate !== undefined) rateVal = rc.photoRetouchRate;
                    else if (s.code === "videoPerMinuteRate" && rc.videoPerMinuteRate !== undefined) rateVal = rc.videoPerMinuteRate;
                    else if (s.code === "videoReelRate" && rc.videoReelRate !== undefined) rateVal = rc.videoReelRate;
                    else if (s.code === "monthlyRetainer" && rc.monthlyRetainer !== undefined) rateVal = rc.monthlyRetainer;

                    if (s.category === "RETAINER" && rateVal === 0) return null;

                    return (
                      <div key={s.id} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: `1px dashed ${C.border}` }}>
                        <span style={{ color: C.muted }}>{s.name}</span>
                        <strong style={{
                          color: s.category === "RETAINER" ? "#059669" : s.category === "VIDEO" ? "#D97706" : s.name.toLowerCase().includes("retouch") ? C.primary : C.text
                        }}>
                          ₹{rateVal.toLocaleString("en-IN")} / {s.unit}
                        </strong>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ═════════ MODAL 1: CREATE INVOICE ═════════ */}
        {showCreateModal && (
          <div style={{
            position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)",
            backdropFilter: "blur(4px)", zIndex: 100, display: "flex",
            alignItems: "center", justifyContent: "center", padding: "1rem"
          }}>
            <div style={{
              background: C.card, borderRadius: C.radius, width: "100%", maxWidth: "780px",
              maxHeight: "92vh", overflowY: "auto", padding: "1.75rem",
              boxShadow: "0 20px 40px rgba(0,0,0,0.15)", border: `1px solid ${C.border}`
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
                <div>
                  <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: C.text, margin: 0 }}>
                    Create GST Tax Invoice
                  </h2>
                  <p style={{ color: C.muted, fontSize: "0.82rem", margin: "2px 0 0" }}>
                    Generate official invoice with 18% GST (CGST + SGST) in INR (₹)
                  </p>
                </div>
                <button onClick={() => setShowCreateModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: C.muted }}>
                  <X size={18} />
                </button>
              </div>

              {/* Quick import from completed jobs */}
              {completedJobs.length > 0 && (
                <div style={{
                  background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: C.radiusSm,
                  padding: "0.6rem 0.85rem", marginBottom: "1.25rem", display: "flex",
                  alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px"
                }}>
                  <div style={{ fontSize: "0.78rem", color: C.primary, fontWeight: 600 }}>
                    💡 Quick Import: {completedJobs.length} completed job(s) ready to be billed:
                  </div>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    {completedJobs.slice(0, 3).map((job) => (
                      <button
                        key={job.id}
                        type="button"
                        onClick={() => handleImportJob(job)}
                        style={{
                          background: "#fff", border: "1px solid #93C5FD", borderRadius: "4px",
                          padding: "2px 6px", fontSize: "0.72rem", fontWeight: 700, color: C.primary,
                          cursor: "pointer"
                        }}
                      >
                        + #{job.jobNumber}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <form onSubmit={handleCreateInvoice} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr", gap: "1rem" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: C.text, marginBottom: "4px" }}>Client *</label>
                    <select
                      required
                      value={invoiceForm.clientId}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, clientId: e.target.value })}
                      style={{ width: "100%", padding: "0.5rem 0.75rem", border: `1px solid ${C.border}`, borderRadius: C.radiusSm, fontSize: "0.85rem", background: "#fff" }}
                    >
                      {clients.map((c) => (
                        <option key={c.id} value={c.id}>{c.companyName} ({c.clientId})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: C.text, marginBottom: "4px" }}>Issue Date</label>
                    <input
                      type="date"
                      value={invoiceForm.issueDate}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, issueDate: e.target.value })}
                      style={{ width: "100%", padding: "0.5rem 0.75rem", border: `1px solid ${C.border}`, borderRadius: C.radiusSm, fontSize: "0.85rem", boxSizing: "border-box" }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: C.text, marginBottom: "4px" }}>Due Date</label>
                    <input
                      type="date"
                      value={invoiceForm.dueDate}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })}
                      style={{ width: "100%", padding: "0.5rem 0.75rem", border: `1px solid ${C.border}`, borderRadius: C.radiusSm, fontSize: "0.85rem", boxSizing: "border-box" }}
                    />
                  </div>
                </div>

                {/* Line Items Builder */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <label style={{ fontSize: "0.82rem", fontWeight: 700, color: C.text }}>Service Line Items *</label>
                    <button
                      type="button"
                      onClick={handleAddItem}
                      style={{
                        background: "none", border: "none", color: C.primary, fontSize: "0.78rem",
                        fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "3px"
                      }}
                    >
                      <Plus size={13} /> Add Item Row
                    </button>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {invoiceForm.items.map((it, idx) => (
                      <div key={idx} style={{ display: "grid", gridTemplateColumns: "3fr 1fr 1fr 1.2fr 1fr auto", gap: "6px", alignItems: "center" }}>
                        <input
                          placeholder="Service description"
                          value={it.description}
                          onChange={(e) => handleItemChange(idx, "description", e.target.value)}
                          style={{ padding: "0.45rem 0.6rem", border: `1px solid ${C.border}`, borderRadius: C.radiusSm, fontSize: "0.82rem" }}
                        />
                        <input
                          type="number"
                          placeholder="Qty"
                          value={it.quantity}
                          onChange={(e) => handleItemChange(idx, "quantity", e.target.value)}
                          style={{ padding: "0.45rem 0.6rem", border: `1px solid ${C.border}`, borderRadius: C.radiusSm, fontSize: "0.82rem" }}
                        />
                        <input
                          placeholder="Unit"
                          value={it.unit}
                          onChange={(e) => handleItemChange(idx, "unit", e.target.value)}
                          style={{ padding: "0.45rem 0.6rem", border: `1px solid ${C.border}`, borderRadius: C.radiusSm, fontSize: "0.82rem" }}
                        />
                        <input
                          type="number"
                          placeholder="Rate (₹)"
                          value={it.unitPrice}
                          onChange={(e) => handleItemChange(idx, "unitPrice", e.target.value)}
                          style={{ padding: "0.45rem 0.6rem", border: `1px solid ${C.border}`, borderRadius: C.radiusSm, fontSize: "0.82rem" }}
                        />
                        <div style={{ fontSize: "0.85rem", fontWeight: 700, color: C.text, padding: "0 4px" }}>
                          ₹{it.amount.toLocaleString("en-IN")}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          style={{ background: "none", border: "none", color: "#EF4444", cursor: "pointer" }}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Calculation Summary Box */}
                <div style={{
                  background: "#F9FAFB", border: `1px solid ${C.border}`, borderRadius: C.radiusSm,
                  padding: "1rem", marginTop: "0.5rem", display: "flex", justifyContent: "flex-end"
                }}>
                  <div style={{ width: "260px", display: "flex", flexDirection: "column", gap: "6px", fontSize: "0.82rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: C.muted }}>Subtotal:</span>
                      <strong style={{ color: C.text }}>₹{formSubtotal.toLocaleString("en-IN")}</strong>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ color: C.muted }}>Discount (₹):</span>
                      <input
                        type="number"
                        min={0}
                        value={invoiceForm.discountAmount}
                        onChange={(e) => setInvoiceForm({ ...invoiceForm, discountAmount: parseFloat(e.target.value) || 0 })}
                        style={{ width: "80px", padding: "2px 6px", border: `1px solid ${C.border}`, borderRadius: "4px", textAlign: "right" }}
                      />
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#7C3AED" }}>GST (18%):</span>
                      <strong style={{ color: "#7C3AED" }}>₹{formTax.toLocaleString("en-IN")}</strong>
                    </div>

                    <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: "6px", display: "flex", justifyContent: "space-between", fontSize: "1rem" }}>
                      <span style={{ fontWeight: 800, color: C.text }}>Grand Total:</span>
                      <strong style={{ fontWeight: 800, color: C.primary }}>₹{formTotal.toLocaleString("en-IN")}</strong>
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "1rem" }}>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    style={{ background: "#F3F4F6", color: "#374151", padding: "0.55rem 1.25rem", borderRadius: C.radiusSm, border: "none", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{ background: C.primary, color: "#fff", padding: "0.55rem 1.5rem", borderRadius: C.radiusSm, border: "none", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer" }}
                  >
                    Generate Invoice
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ═════════ MODAL 2: PRINTABLE GST TAX INVOICE ═════════ */}
        {showInvoiceModal && selectedInvoice && (
          <div style={{
            position: "fixed", inset: 0, background: "rgba(15,23,42,0.6)",
            backdropFilter: "blur(4px)", zIndex: 100, display: "flex",
            alignItems: "center", justifyContent: "center", padding: "1rem"
          }}>
            <div style={{
              background: "#FFFFFF", borderRadius: C.radius, width: "100%", maxWidth: "820px",
              maxHeight: "94vh", overflowY: "auto", padding: "2.5rem",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)", border: `1px solid ${C.border}`
            }}>
              {/* Top Controls */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", borderBottom: "1px solid #E5E7EB", paddingBottom: "1rem" }}>
                <span style={{ fontSize: "0.85rem", color: C.muted, fontWeight: 600 }}>
                  Tax Invoice Preview • {selectedInvoice.invoiceNumber}
                </span>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={() => window.print()}
                    style={{
                      background: C.primary, color: "#fff", border: "none", borderRadius: C.radiusSm,
                      padding: "0.45rem 1rem", fontSize: "0.82rem", fontWeight: 700, cursor: "pointer",
                      display: "flex", alignItems: "center", gap: "5px"
                    }}
                  >
                    <Printer size={14} /> Print / Save PDF
                  </button>
                  <button
                    onClick={() => setShowInvoiceModal(false)}
                    style={{ background: "#F3F4F6", color: "#374151", border: "none", borderRadius: C.radiusSm, padding: "0.45rem 0.85rem", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer" }}
                  >
                    Close
                  </button>
                </div>
              </div>

              {/* ── Official Indian Tax Invoice Document Template ── */}
              <div id="printable-invoice" style={{ fontFamily: "Inter, sans-serif", color: "#111827" }}>
                
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem" }}>
                  <div>
                    <div style={{ fontSize: "1.6rem", fontWeight: 900, color: C.primary, letterSpacing: "-0.04em" }}>
                      RESAWC LLP
                    </div>
                    <div style={{ fontSize: "0.82rem", color: "#4B5563", marginTop: "3px" }}>
                      Creative Post-Production & Media Editing Studio
                    </div>
                    <div style={{ fontSize: "0.78rem", color: "#6B7280", marginTop: "4px", lineHeight: "1.4" }}>
                      Resawc Creative Studio Hub, New Delhi, India<br />
                      <strong>GSTIN:</strong> 07AABCR1234F1Z5 • <strong>PAN:</strong> AABCR1234F<br />
                      <strong>Email:</strong> accounts@resawc.com
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div style={{
                      display: "inline-block", background: "#EFF6FF", color: C.primary,
                      border: "1px solid #BFDBFE", padding: "4px 12px", borderRadius: "4px",
                      fontSize: "0.85rem", fontWeight: 800, letterSpacing: "0.05em", marginBottom: "8px"
                    }}>
                      TAX INVOICE
                    </div>
                    <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#111827" }}>
                      {selectedInvoice.invoiceNumber}
                    </div>
                    <div style={{ fontSize: "0.78rem", color: "#6B7280", marginTop: "3px" }}>
                      Date: <strong>{selectedInvoice.issueDate}</strong><br />
                      Due Date: <strong>{selectedInvoice.dueDate}</strong>
                    </div>
                  </div>
                </div>

                {/* Billed To Box */}
                <div style={{
                  background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: "6px",
                  padding: "1rem", marginBottom: "1.75rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem"
                }}>
                  <div>
                    <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#6B7280", textTransform: "uppercase" }}>
                      BILLED TO:
                    </div>
                    <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#111827", marginTop: "2px" }}>
                      {selectedInvoice.client.companyName}
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "#4B5563", marginTop: "2px" }}>
                      Attn: {selectedInvoice.client.contactPerson}<br />
                      {selectedInvoice.client.email && <span>Email: {selectedInvoice.client.email}<br /></span>}
                      {selectedInvoice.client.phone && <span>Phone: {selectedInvoice.client.phone}<br /></span>}
                      {selectedInvoice.client.address || "India"}
                    </div>
                  </div>

                  <div style={{ textAlign: "right", fontSize: "0.8rem", color: "#4B5563" }}>
                    <div><strong>Place of Supply:</strong> India (Domestic)</div>
                    <div><strong>Currency:</strong> INR (₹)</div>
                    <div><strong>Payment Terms:</strong> Due on Receipt</div>
                  </div>
                </div>

                {/* Items Table */}
                <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "1.5rem", fontSize: "0.82rem" }}>
                  <thead>
                    <tr style={{ background: "#F3F4F6", borderBottom: "1.5px solid #D1D5DB" }}>
                      <th style={{ padding: "8px 10px", textAlign: "left", fontWeight: 700 }}>#</th>
                      <th style={{ padding: "8px 10px", textAlign: "left", fontWeight: 700 }}>Description of Service</th>
                      <th style={{ padding: "8px 10px", textAlign: "center", fontWeight: 700 }}>SAC Code</th>
                      <th style={{ padding: "8px 10px", textAlign: "right", fontWeight: 700 }}>Qty</th>
                      <th style={{ padding: "8px 10px", textAlign: "right", fontWeight: 700 }}>Rate (₹)</th>
                      <th style={{ padding: "8px 10px", textAlign: "right", fontWeight: 700 }}>Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedInvoice.items?.map((it, idx) => (
                      <tr key={it.id || idx} style={{ borderBottom: "1px solid #E5E7EB" }}>
                        <td style={{ padding: "10px", color: "#6B7280" }}>{idx + 1}</td>
                        <td style={{ padding: "10px", fontWeight: 600 }}>{it.description}</td>
                        <td style={{ padding: "10px", textAlign: "center", color: "#6B7280" }}>998311</td>
                        <td style={{ padding: "10px", textAlign: "right" }}>{it.quantity} {it.unit}</td>
                        <td style={{ padding: "10px", textAlign: "right" }}>₹{it.unitPrice.toLocaleString("en-IN")}</td>
                        <td style={{ padding: "10px", textAlign: "right", fontWeight: 700 }}>₹{it.amount.toLocaleString("en-IN")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Subtotal, GST & Total */}
                <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "2rem" }}>
                  <div style={{ width: "300px", fontSize: "0.85rem", display: "flex", flexDirection: "column", gap: "6px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#4B5563" }}>Subtotal:</span>
                      <strong style={{ color: "#111827" }}>₹{selectedInvoice.subtotal.toLocaleString("en-IN")}</strong>
                    </div>

                    {selectedInvoice.discountAmount > 0 && (
                      <div style={{ display: "flex", justifyContent: "space-between", color: "#059669" }}>
                        <span>Discount:</span>
                        <strong>-₹{selectedInvoice.discountAmount.toLocaleString("en-IN")}</strong>
                      </div>
                    )}

                    <div style={{ display: "flex", justifyContent: "space-between", color: "#7C3AED" }}>
                      <span>CGST (9.0%):</span>
                      <strong>₹{(selectedInvoice.taxAmount / 2).toLocaleString("en-IN")}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", color: "#7C3AED" }}>
                      <span>SGST (9.0%):</span>
                      <strong>₹{(selectedInvoice.taxAmount / 2).toLocaleString("en-IN")}</strong>
                    </div>

                    <div style={{ borderTop: "2px solid #111827", paddingTop: "8px", marginTop: "4px", display: "flex", justifyContent: "space-between", fontSize: "1.1rem" }}>
                      <span style={{ fontWeight: 900 }}>Total (INR):</span>
                      <strong style={{ fontWeight: 900, color: C.primary }}>₹{selectedInvoice.totalAmount.toLocaleString("en-IN")}</strong>
                    </div>
                  </div>
                </div>

                {/* Bank Account Details */}
                <div style={{
                  background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "6px",
                  padding: "1rem", display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "1rem", fontSize: "0.78rem"
                }}>
                  <div>
                    <div style={{ fontWeight: 700, color: "#1E293B", marginBottom: "4px" }}>
                      🏦 Bank Transfer / NEFT / IMPS Details
                    </div>
                    <div>Account Name: <strong>Resawc LLP</strong></div>
                    <div>Bank: <strong>HDFC Bank Ltd.</strong></div>
                    <div>Account No: <strong>50200012345678</strong></div>
                    <div>IFSC Code: <strong>HDFC0001234</strong></div>
                    <div>UPI ID: <strong>resawc@hdfcbank</strong></div>
                  </div>

                  <div style={{ textAlign: "right", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
                    <div style={{ fontStyle: "italic", color: "#64748B", marginBottom: "2rem" }}>
                      For Resawc LLP
                    </div>
                    <div style={{ fontWeight: 700, color: "#0F172A" }}>
                      Authorized Signatory
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* ═════════ MODAL 3: RECORD PAYMENT ═════════ */}
        {showPaymentModal && selectedForPayment && (
          <div style={{
            position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)",
            backdropFilter: "blur(4px)", zIndex: 100, display: "flex",
            alignItems: "center", justifyContent: "center", padding: "1rem"
          }}>
            <div style={{
              background: C.card, borderRadius: C.radius, width: "100%", maxWidth: "460px",
              padding: "1.75rem", boxShadow: "0 20px 40px rgba(0,0,0,0.15)", border: `1px solid ${C.border}`
            }}>
              <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: C.text, margin: "0 0 4px" }}>
                Record Payment
              </h2>
              <p style={{ color: C.muted, fontSize: "0.82rem", margin: "0 0 1rem" }}>
                Invoice #{selectedForPayment.invoiceNumber} • {selectedForPayment.client.companyName}
              </p>

              <form onSubmit={handleRecordPayment} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: C.text, marginBottom: "4px" }}>
                    Amount Received (INR ₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={paymentForm.amountPaid}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amountPaid: parseFloat(e.target.value) || 0 })}
                    style={{ width: "100%", padding: "0.55rem 0.75rem", border: `1px solid ${C.border}`, borderRadius: C.radiusSm, fontSize: "1rem", fontWeight: 700, boxSizing: "border-box" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: C.text, marginBottom: "4px" }}>
                    Payment Date
                  </label>
                  <input
                    type="date"
                    required
                    value={paymentForm.paymentDate}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                    style={{ width: "100%", padding: "0.55rem 0.75rem", border: `1px solid ${C.border}`, borderRadius: C.radiusSm, fontSize: "0.85rem", boxSizing: "border-box" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: C.text, marginBottom: "4px" }}>
                    Payment Method
                  </label>
                  <select
                    value={paymentForm.paymentMethod}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                    style={{ width: "100%", padding: "0.55rem 0.75rem", border: `1px solid ${C.border}`, borderRadius: C.radiusSm, fontSize: "0.85rem", background: "#fff" }}
                  >
                    <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
                    <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                    <option value="IMPS">IMPS</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: C.text, marginBottom: "4px" }}>
                    UTR / Transaction Reference ID
                  </label>
                  <input
                    placeholder="e.g. UTR123498765432"
                    value={paymentForm.paymentReference}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentReference: e.target.value })}
                    style={{ width: "100%", padding: "0.55rem 0.75rem", border: `1px solid ${C.border}`, borderRadius: C.radiusSm, fontSize: "0.85rem", boxSizing: "border-box" }}
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "0.5rem" }}>
                  <button
                    type="button"
                    onClick={() => setShowPaymentModal(false)}
                    style={{ background: "#F3F4F6", color: "#374151", padding: "0.5rem 1rem", borderRadius: C.radiusSm, border: "none", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{ background: "#059669", color: "#fff", padding: "0.5rem 1.25rem", borderRadius: C.radiusSm, border: "none", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer" }}
                  >
                    Save Payment
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ═════════ MODAL 4: EDIT RATE CARD ═════════ */}
        {showRateModal && (
          <div style={{
            position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)",
            backdropFilter: "blur(4px)", zIndex: 100, display: "flex",
            alignItems: "center", justifyContent: "center", padding: "1rem"
          }}>
            <div style={{
              background: C.card, borderRadius: C.radius, width: "100%", maxWidth: "520px",
              padding: "1.75rem", boxShadow: "0 20px 40px rgba(0,0,0,0.15)", border: `1px solid ${C.border}`
            }}>
              <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: C.text, margin: "0 0 4px" }}>
                Configure Client Rate Card
              </h2>
              <p style={{ color: C.muted, fontSize: "0.82rem", margin: "0 0 1.25rem" }}>
                Set custom service pricing in INR (₹) for post-production deliverables
              </p>

              <form onSubmit={handleSaveRateCard} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: C.text, marginBottom: "4px" }}>Select Client</label>
                  <select
                    value={rateForm.clientId}
                    onChange={(e) => setRateForm({ ...rateForm, clientId: e.target.value })}
                    style={{ width: "100%", padding: "0.55rem 0.75rem", border: `1px solid ${C.border}`, borderRadius: C.radiusSm, fontSize: "0.85rem", background: "#fff" }}
                  >
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>{c.companyName} ({c.clientId})</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.85rem", maxHeight: "360px", overflowY: "auto", paddingRight: "4px" }}>
                  {(companyServices.length > 0 ? companyServices.filter(s => s.isActive) : DEFAULT_FALLBACK_SERVICES).map((svc) => {
                    const currentVal = rateForm.customRates[svc.id] ?? (
                      svc.code === "photoCullingRate" ? rateForm.photoCullingRate :
                      svc.code === "photoColorRate" ? rateForm.photoColorRate :
                      svc.code === "photoRetouchRate" ? rateForm.photoRetouchRate :
                      svc.code === "videoPerMinuteRate" ? rateForm.videoPerMinuteRate :
                      svc.code === "videoReelRate" ? rateForm.videoReelRate :
                      svc.code === "monthlyRetainer" ? rateForm.monthlyRetainer :
                      (rateForm.customRates[svc.name] ?? svc.defaultRate)
                    );

                    return (
                      <div key={svc.id}>
                        <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: C.text, marginBottom: "3px" }}>
                          {svc.name} (₹/{svc.unit})
                        </label>
                        <input
                          type="number"
                          step="any"
                          value={currentVal}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            const nextCustomRates = { ...rateForm.customRates, [svc.id]: val, [svc.name]: val };
                            const nextLegacy: any = {};
                            if (svc.code === "photoCullingRate") nextLegacy.photoCullingRate = val;
                            if (svc.code === "photoColorRate") nextLegacy.photoColorRate = val;
                            if (svc.code === "photoRetouchRate") nextLegacy.photoRetouchRate = val;
                            if (svc.code === "videoPerMinuteRate") nextLegacy.videoPerMinuteRate = val;
                            if (svc.code === "videoReelRate") nextLegacy.videoReelRate = val;
                            if (svc.code === "monthlyRetainer") nextLegacy.monthlyRetainer = val;
                            setRateForm({ ...rateForm, ...nextLegacy, customRates: nextCustomRates });
                          }}
                          style={{ width: "100%", padding: "0.45rem 0.6rem", border: `1px solid ${C.border}`, borderRadius: C.radiusSm, fontSize: "0.85rem", boxSizing: "border-box" }}
                        />
                      </div>
                    );
                  })}
                </div>

                <div style={{ paddingTop: "0.35rem", borderTop: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <a
                    href="/dashboard/settings?tab=services"
                    style={{ fontSize: "0.78rem", color: C.primary, textDecoration: "none", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}
                  >
                    ⚙ Need to add more services? Manage in Settings
                  </a>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "0.5rem" }}>
                  <button
                    type="button"
                    onClick={() => setShowRateModal(false)}
                    style={{ background: "#F3F4F6", color: "#374151", padding: "0.5rem 1rem", borderRadius: C.radiusSm, border: "none", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{ background: C.primary, color: "#fff", padding: "0.5rem 1.25rem", borderRadius: C.radiusSm, border: "none", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer" }}
                  >
                    Save Rate Card
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
