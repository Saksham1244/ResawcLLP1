"use client";

import { useState, useEffect } from "react";
import { UserPlus, Mail, Phone, Search, Trash2, X, Eye, Edit3, Building, ShieldCheck, CreditCard, DollarSign } from "lucide-react";
import { RoleGuard } from "@/components/RoleGuard";
import { useRole } from "@/context/RoleContext";

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg: "#F5F7FB",
  card: "#FFFFFF",
  border: "#E5E7EB",
  primary: "#1A56DB",
  text: "#111827",
  muted: "#6B7280",
  radius: "8px",
  radiusSm: "6px",
  radiusPill: "999px",
};

// ─── Types ────────────────────────────────────────────────────────────────────
type SalaryStructure = {
  id?: string;
  dob?: string | null;
  doj?: string | null;
  designation?: string | null;
  location?: string | null;
  panNumber?: string | null;
  bankName?: string | null;
  bankAccountNumber?: string | null;
  ifscCode?: string | null;
  uanNumber?: string | null;
  esiNumber?: string | null;
  upiId?: string | null;
  baseSalary?: number;
  hourlyOvertimeRate?: number;
  allowance?: number;
};

type Member = {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  status: "online" | "offline" | "away";
  initials: string;
  salaryStructure?: SalaryStructure | null;
};

// Role badge colors
const roleBadge = (role: string): React.CSSProperties => {
  const norm = role.toLowerCase().replace(/\s+/g, '_');
  const map: Record<string, { bg: string; color: string }> = {
    admin:        { bg: "#FEF2F2", color: "#DC2626" },
    marketing:    { bg: "#EEF2FF", color: "#4F46E5" },
    photo_editor: { bg: "#ECFDF5", color: "#059669" },
    video_editor: { bg: "#FFF7ED", color: "#EA580C" },
    editor:       { bg: "#ECFDF5", color: "#059669" },
    production:   { bg: "#ECFDF5", color: "#059669" },
  };
  const c = map[norm] || { bg: "#F3F4F6", color: "#6B7280" };
  return {
    display: "inline-block",
    padding: "0.2rem 0.6rem",
    borderRadius: "999px",
    fontSize: "0.72rem",
    fontWeight: 700,
    background: c.bg,
    color: c.color,
  };
};

const formatRoleDisplay = (r: string) => {
  const norm = r.toLowerCase();
  if (norm.includes("photo")) return "Production (Photo)";
  if (norm.includes("video")) return "Video Editing";
  if (norm.includes("marketing")) return "Marketing";
  if (norm.includes("admin")) return "Admin";
  return r.charAt(0).toUpperCase() + r.slice(1).toLowerCase();
};

const formatDate = (dateStr?: string | null) => {
  if (!dateStr || dateStr.trim() === "" || dateStr === "—") return "—";
  try {
    const p = dateStr.split("-");
    if (p.length === 3) {
      const m = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
      const idx = parseInt(p[1], 10) - 1;
      return `${p[2]}-${m[idx] || p[1]}-${p[0]}`;
    }
    return dateStr;
  } catch {
    return dateStr;
  }
};

// Avatar palette
const avatarPalette = ["#1A56DB", "#7C3AED", "#059669", "#D97706", "#DC2626", "#0891B2"];
function getAvatarColor(index: number) {
  return avatarPalette[index % avatarPalette.length];
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.5rem 0.75rem",
  border: `1px solid ${C.border}`,
  borderRadius: C.radiusSm,
  fontSize: "0.85rem",
  color: C.text,
  background: "#fff",
  outline: "none",
  boxSizing: "border-box",
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: "0.78rem",
  fontWeight: 700,
  color: C.primary,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  marginBottom: "0.5rem",
  paddingBottom: "0.25rem",
  borderBottom: `1px solid ${C.border}`,
};

// ─── Add Member Modal ─────────────────────────────────────────────────────────
function AddMemberModal({ onClose, onAdd }: { onClose: () => void; onAdd: (m: Member) => void }) {
  const [form, setForm] = useState({
    name: "",
    role: "marketing",
    email: "",
    phone: "",
    password: "",
    // Profile & Statutory
    dob: "",
    doj: new Date().toISOString().split("T")[0],
    designation: "",
    location: "Delhi NCR",
    panNumber: "",
    uanNumber: "",
    esiNumber: "",
    // Banking & Compensation
    bankName: "HDFC Bank",
    bankAccountNumber: "",
    ifscCode: "",
    upiId: "",
    baseSalary: 25000,
    hourlyOvertimeRate: 150,
    allowance: 0,
  });
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      setErr("Name, Email and Password are required.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        const u = data.data;
        const initials = u.name
          .split(" ")
          .map((w: string) => w[0])
          .join("")
          .slice(0, 2)
          .toUpperCase();
        onAdd({
          id: u.id,
          name: u.name,
          role: u.role,
          email: u.email,
          phone: u.phone || form.phone,
          status: "offline",
          initials,
          salaryStructure: u.salaryStructure,
        });
        onClose();
      } else {
        setErr(data.error || "Failed to create user");
      }
    } catch {
      setErr("Connection error. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: C.radius, width: "100%", maxWidth: 640, maxHeight: "92vh", overflowY: "auto", padding: "1.75rem", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
          <div>
            <h2 style={{ fontSize: "1.15rem", fontWeight: 800, color: C.text, margin: 0 }}>Add New Team Member</h2>
            <p style={{ fontSize: "0.82rem", color: C.muted, margin: "2px 0 0" }}>Set up user credentials, statutory IDs, banking details, and starting salary</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", padding: "0.25rem" }}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* Section 1: Credentials & Role */}
          <div>
            <div style={sectionTitleStyle}>1. Account Credentials &amp; Role</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: C.text, marginBottom: "3px" }}>Full Name *</label>
                <input style={inputStyle} placeholder="e.g. Rahul Sharma" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: C.text, marginBottom: "3px" }}>Role *</label>
                <select style={inputStyle} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                  <option value="admin">Admin</option>
                  <option value="marketing">Marketing</option>
                  <option value="photo_editor">Production (Photo)</option>
                  <option value="video_editor">Video Editing</option>
                </select>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginTop: "0.5rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: C.text, marginBottom: "3px" }}>Email *</label>
                <input style={inputStyle} type="email" placeholder="name@resawc.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: C.text, marginBottom: "3px" }}>Phone</label>
                <input style={inputStyle} placeholder="+91 9800000000" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
            </div>

            <div style={{ marginTop: "0.5rem" }}>
              <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: C.text, marginBottom: "3px" }}>Login Password *</label>
              <input style={inputStyle} type="password" placeholder="Create login password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
            </div>
          </div>

          {/* Section 2: Statutory Profile */}
          <div>
            <div style={sectionTitleStyle}>2. Statutory &amp; Job Profile (DOB, DOJ, PAN)</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: C.text, marginBottom: "3px" }}>Date of Joining (DOJ)</label>
                <input style={inputStyle} type="date" value={form.doj} onChange={(e) => setForm({ ...form, doj: e.target.value })} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: C.text, marginBottom: "3px" }}>Date of Birth (DOB)</label>
                <input style={inputStyle} type="date" value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginTop: "0.5rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: C.text, marginBottom: "3px" }}>Designation</label>
                <input style={inputStyle} placeholder="e.g. Lead Video Editor" value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: C.text, marginBottom: "3px" }}>Work Location</label>
                <input style={inputStyle} placeholder="e.g. Delhi NCR" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem", marginTop: "0.5rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: C.text, marginBottom: "3px" }}>PAN Number</label>
                <input style={inputStyle} placeholder="ABCDE1234F" value={form.panNumber} onChange={(e) => setForm({ ...form, panNumber: e.target.value.toUpperCase() })} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: C.text, marginBottom: "3px" }}>UAN Number</label>
                <input style={inputStyle} placeholder="101234567890" value={form.uanNumber} onChange={(e) => setForm({ ...form, uanNumber: e.target.value })} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: C.text, marginBottom: "3px" }}>ESI Number</label>
                <input style={inputStyle} placeholder="1234567890" value={form.esiNumber} onChange={(e) => setForm({ ...form, esiNumber: e.target.value })} />
              </div>
            </div>
          </div>

          {/* Section 3: Banking & Compensation */}
          <div>
            <div style={sectionTitleStyle}>3. Banking &amp; Compensation (₹ INR)</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: C.text, marginBottom: "3px" }}>Bank Name</label>
                <input style={inputStyle} placeholder="e.g. HDFC Bank" value={form.bankName} onChange={(e) => setForm({ ...form, bankName: e.target.value })} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: C.text, marginBottom: "3px" }}>Account Number</label>
                <input style={inputStyle} placeholder="Account Number" value={form.bankAccountNumber} onChange={(e) => setForm({ ...form, bankAccountNumber: e.target.value })} />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginTop: "0.5rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: C.text, marginBottom: "3px" }}>IFSC Code</label>
                <input style={inputStyle} placeholder="HDFC0001234" value={form.ifscCode} onChange={(e) => setForm({ ...form, ifscCode: e.target.value.toUpperCase() })} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: C.text, marginBottom: "3px" }}>UPI ID</label>
                <input style={inputStyle} placeholder="name@okaxis" value={form.upiId} onChange={(e) => setForm({ ...form, upiId: e.target.value })} />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem", marginTop: "0.5rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: C.text, marginBottom: "3px" }}>Base Salary (₹)</label>
                <input style={inputStyle} type="number" value={form.baseSalary} onChange={(e) => setForm({ ...form, baseSalary: parseFloat(e.target.value) || 0 })} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: C.text, marginBottom: "3px" }}>Allowance (₹)</label>
                <input style={inputStyle} type="number" value={form.allowance} onChange={(e) => setForm({ ...form, allowance: parseFloat(e.target.value) || 0 })} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: C.text, marginBottom: "3px" }}>Overtime (₹/hr)</label>
                <input style={inputStyle} type="number" value={form.hourlyOvertimeRate} onChange={(e) => setForm({ ...form, hourlyOvertimeRate: parseFloat(e.target.value) || 0 })} />
              </div>
            </div>
          </div>

          {err && <p style={{ color: "#DC2626", fontSize: "0.85rem", margin: 0 }}>{err}</p>}

          <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem", borderTop: `1px solid ${C.border}`, paddingTop: "0.85rem" }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: "0.65rem", border: `1px solid ${C.border}`, borderRadius: C.radiusSm, background: "#fff", color: C.text, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
            <button type="submit" disabled={saving} style={{ flex: 1, padding: "0.65rem", border: "none", borderRadius: C.radiusSm, background: saving ? "#93C5FD" : C.primary, color: "#fff", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer" }}>{saving ? "Adding…" : "Add Member"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Edit Member Modal ─────────────────────────────────────────────────────────
function EditMemberModal({
  member,
  onClose,
  onUpdate,
}: {
  member: Member;
  onClose: () => void;
  onUpdate: (updated: Member) => void;
}) {
  const s = member.salaryStructure || {};
  const [form, setForm] = useState({
    name: member.name,
    email: member.email,
    role: member.role.toLowerCase(),
    phone: member.phone || "",
    password: "",
    // Profile & Statutory
    dob: s.dob || "",
    doj: s.doj || "",
    designation: s.designation || "",
    location: s.location || "Delhi NCR",
    panNumber: s.panNumber || "",
    uanNumber: s.uanNumber || "",
    esiNumber: s.esiNumber || "",
    // Banking & Compensation
    bankName: s.bankName || "HDFC Bank",
    bankAccountNumber: s.bankAccountNumber || "",
    ifscCode: s.ifscCode || "",
    upiId: s.upiId || "",
    baseSalary: s.baseSalary ?? 25000,
    hourlyOvertimeRate: s.hourlyOvertimeRate ?? 150,
    allowance: s.allowance ?? 0,
  });
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email) {
      setErr("Name and Email are required.");
      return;
    }
    setSaving(true);
    try {
      const payload: any = {
        id: member.id,
        name: form.name,
        email: form.email,
        role: form.role,
        phone: form.phone,
        dob: form.dob,
        doj: form.doj,
        designation: form.designation,
        location: form.location,
        panNumber: form.panNumber,
        uanNumber: form.uanNumber,
        esiNumber: form.esiNumber,
        bankName: form.bankName,
        bankAccountNumber: form.bankAccountNumber,
        ifscCode: form.ifscCode,
        upiId: form.upiId,
        baseSalary: form.baseSalary,
        hourlyOvertimeRate: form.hourlyOvertimeRate,
        allowance: form.allowance,
      };
      if (form.password) payload.password = form.password;

      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        const u = data.data;
        onUpdate({
          ...member,
          name: u.name,
          email: u.email,
          role: u.role,
          phone: u.phone || form.phone,
          salaryStructure: u.salaryStructure,
        });
        onClose();
      } else {
        setErr(data.error || "Failed to update member");
      }
    } catch {
      setErr("Network error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: C.radius, width: "100%", maxWidth: 640, maxHeight: "92vh", overflowY: "auto", padding: "1.75rem", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
          <div>
            <h2 style={{ fontSize: "1.15rem", fontWeight: 800, color: C.text, margin: 0 }}>Edit Member &amp; Settings</h2>
            <p style={{ fontSize: "0.82rem", color: C.muted, margin: "2px 0 0" }}>Update employee profile, PAN, bank details, and monthly compensation</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: C.muted }}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* Section 1: Credentials */}
          <div>
            <div style={sectionTitleStyle}>1. Account &amp; Role</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: C.text, marginBottom: "3px" }}>Full Name *</label>
                <input style={inputStyle} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: C.text, marginBottom: "3px" }}>Role *</label>
                <select style={inputStyle} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                  <option value="admin">Admin</option>
                  <option value="marketing">Marketing</option>
                  <option value="photo_editor">Production (Photo)</option>
                  <option value="video_editor">Video Editing</option>
                </select>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginTop: "0.5rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: C.text, marginBottom: "3px" }}>Email *</label>
                <input style={inputStyle} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: C.text, marginBottom: "3px" }}>Phone</label>
                <input style={inputStyle} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
            </div>

            <div style={{ marginTop: "0.5rem" }}>
              <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: C.text, marginBottom: "3px" }}>Reset Password (leave blank to keep current)</label>
              <input style={inputStyle} type="password" placeholder="••••••••" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
          </div>

          {/* Section 2: Statutory Profile */}
          <div>
            <div style={sectionTitleStyle}>2. Statutory &amp; Job Profile (DOB, DOJ, PAN)</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: C.text, marginBottom: "3px" }}>Date of Joining (DOJ)</label>
                <input style={inputStyle} type="date" value={form.doj} onChange={(e) => setForm({ ...form, doj: e.target.value })} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: C.text, marginBottom: "3px" }}>Date of Birth (DOB)</label>
                <input style={inputStyle} type="date" value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginTop: "0.5rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: C.text, marginBottom: "3px" }}>Designation</label>
                <input style={inputStyle} placeholder="e.g. Lead Video Editor" value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: C.text, marginBottom: "3px" }}>Work Location</label>
                <input style={inputStyle} placeholder="e.g. Delhi NCR" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem", marginTop: "0.5rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: C.text, marginBottom: "3px" }}>PAN Number</label>
                <input style={inputStyle} placeholder="ABCDE1234F" value={form.panNumber} onChange={(e) => setForm({ ...form, panNumber: e.target.value.toUpperCase() })} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: C.text, marginBottom: "3px" }}>UAN Number</label>
                <input style={inputStyle} placeholder="101234567890" value={form.uanNumber} onChange={(e) => setForm({ ...form, uanNumber: e.target.value })} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: C.text, marginBottom: "3px" }}>ESI Number</label>
                <input style={inputStyle} placeholder="1234567890" value={form.esiNumber} onChange={(e) => setForm({ ...form, esiNumber: e.target.value })} />
              </div>
            </div>
          </div>

          {/* Section 3: Banking & Compensation */}
          <div>
            <div style={sectionTitleStyle}>3. Banking &amp; Compensation (₹ INR)</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: C.text, marginBottom: "3px" }}>Bank Name</label>
                <input style={inputStyle} placeholder="e.g. HDFC Bank" value={form.bankName} onChange={(e) => setForm({ ...form, bankName: e.target.value })} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: C.text, marginBottom: "3px" }}>Account Number</label>
                <input style={inputStyle} placeholder="Account Number" value={form.bankAccountNumber} onChange={(e) => setForm({ ...form, bankAccountNumber: e.target.value })} />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginTop: "0.5rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: C.text, marginBottom: "3px" }}>IFSC Code</label>
                <input style={inputStyle} placeholder="HDFC0001234" value={form.ifscCode} onChange={(e) => setForm({ ...form, ifscCode: e.target.value.toUpperCase() })} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: C.text, marginBottom: "3px" }}>UPI ID</label>
                <input style={inputStyle} placeholder="name@okaxis" value={form.upiId} onChange={(e) => setForm({ ...form, upiId: e.target.value })} />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem", marginTop: "0.5rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: C.text, marginBottom: "3px" }}>Base Salary (₹)</label>
                <input style={inputStyle} type="number" value={form.baseSalary} onChange={(e) => setForm({ ...form, baseSalary: parseFloat(e.target.value) || 0 })} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: C.text, marginBottom: "3px" }}>Allowance (₹)</label>
                <input style={inputStyle} type="number" value={form.allowance} onChange={(e) => setForm({ ...form, allowance: parseFloat(e.target.value) || 0 })} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: C.text, marginBottom: "3px" }}>Overtime (₹/hr)</label>
                <input style={inputStyle} type="number" value={form.hourlyOvertimeRate} onChange={(e) => setForm({ ...form, hourlyOvertimeRate: parseFloat(e.target.value) || 0 })} />
              </div>
            </div>
          </div>

          {err && <p style={{ color: "#DC2626", fontSize: "0.85rem", margin: 0 }}>{err}</p>}

          <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem", borderTop: `1px solid ${C.border}`, paddingTop: "0.85rem" }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: "0.65rem", border: `1px solid ${C.border}`, borderRadius: C.radiusSm, background: "#fff", color: C.text, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
            <button type="submit" disabled={saving} style={{ flex: 1, padding: "0.65rem", border: "none", borderRadius: C.radiusSm, background: saving ? "#93C5FD" : C.primary, color: "#fff", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer" }}>{saving ? "Saving…" : "Save Changes"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── View Member Profile Modal ────────────────────────────────────────────────
function ViewMemberModal({
  member,
  onClose,
  onEdit,
}: {
  member: Member;
  onClose: () => void;
  onEdit: () => void;
}) {
  const s = member.salaryStructure || {};

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: C.radius, width: "100%", maxWidth: 540, padding: "1.75rem", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ width: 46, height: 46, borderRadius: "50%", background: C.primary, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "1rem" }}>
              {member.initials}
            </div>
            <div>
              <div style={{ fontSize: "1.15rem", fontWeight: 800, color: C.text }}>{member.name}</div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "2px" }}>
                <span style={roleBadge(member.role)}>{formatRoleDisplay(member.role)}</span>
                <span style={{ fontSize: "0.75rem", color: C.muted }}>• EMP-{(member.id.slice(-4).toUpperCase())}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", padding: "4px" }}><X size={18} /></button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", fontSize: "0.85rem" }}>
          {/* Contact Details */}
          <div style={{ background: "#F9FAFB", padding: "0.75rem 1rem", borderRadius: C.radiusSm, border: `1px solid ${C.border}` }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              <div>
                <span style={{ color: C.muted, fontSize: "0.75rem", display: "block" }}>Email</span>
                <span style={{ fontWeight: 600, color: C.text }}>{member.email}</span>
              </div>
              <div>
                <span style={{ color: C.muted, fontSize: "0.75rem", display: "block" }}>Phone</span>
                <span style={{ fontWeight: 600, color: C.text }}>{member.phone || "—"}</span>
              </div>
            </div>
          </div>

          {/* Statutory & Job Profile */}
          <div style={{ border: `1px solid ${C.border}`, borderRadius: C.radiusSm, padding: "0.75rem 1rem" }}>
            <div style={{ fontWeight: 700, color: C.primary, fontSize: "0.78rem", textTransform: "uppercase", marginBottom: "8px" }}>Statutory &amp; Profile</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              <div>
                <span style={{ color: C.muted, fontSize: "0.75rem", display: "block" }}>Designation</span>
                <span style={{ fontWeight: 600, color: C.text }}>{s.designation || formatRoleDisplay(member.role)}</span>
              </div>
              <div>
                <span style={{ color: C.muted, fontSize: "0.75rem", display: "block" }}>Location</span>
                <span style={{ fontWeight: 600, color: C.text }}>{s.location || "Delhi NCR"}</span>
              </div>
              <div>
                <span style={{ color: C.muted, fontSize: "0.75rem", display: "block" }}>Date of Joining (DOJ)</span>
                <span style={{ fontWeight: 600, color: C.text }}>{formatDate(s.doj)}</span>
              </div>
              <div>
                <span style={{ color: C.muted, fontSize: "0.75rem", display: "block" }}>Date of Birth (DOB)</span>
                <span style={{ fontWeight: 600, color: C.text }}>{formatDate(s.dob)}</span>
              </div>
              <div>
                <span style={{ color: C.muted, fontSize: "0.75rem", display: "block" }}>PAN Card Number</span>
                <span style={{ fontWeight: 600, color: C.text }}>{s.panNumber || "—"}</span>
              </div>
              <div>
                <span style={{ color: C.muted, fontSize: "0.75rem", display: "block" }}>UAN / ESI</span>
                <span style={{ fontWeight: 600, color: C.text }}>{s.uanNumber || "NA"} / {s.esiNumber || "NA"}</span>
              </div>
            </div>
          </div>

          {/* Banking & Salary */}
          <div style={{ border: `1px solid ${C.border}`, borderRadius: C.radiusSm, padding: "0.75rem 1rem" }}>
            <div style={{ fontWeight: 700, color: C.primary, fontSize: "0.78rem", textTransform: "uppercase", marginBottom: "8px" }}>Banking &amp; Compensation</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              <div>
                <span style={{ color: C.muted, fontSize: "0.75rem", display: "block" }}>Bank &amp; Account</span>
                <span style={{ fontWeight: 600, color: C.text }}>{s.bankName || "HDFC Bank"} • {s.bankAccountNumber || "—"}</span>
              </div>
              <div>
                <span style={{ color: C.muted, fontSize: "0.75rem", display: "block" }}>IFSC / UPI</span>
                <span style={{ fontWeight: 600, color: C.text }}>{s.ifscCode || "—"} {s.upiId ? `(${s.upiId})` : ""}</span>
              </div>
              <div>
                <span style={{ color: C.muted, fontSize: "0.75rem", display: "block" }}>Base Salary</span>
                <span style={{ fontWeight: 700, color: "#059669" }}>₹{(s.baseSalary ?? 25000).toLocaleString("en-IN")} / mo</span>
              </div>
              <div>
                <span style={{ color: C.muted, fontSize: "0.75rem", display: "block" }}>Overtime Rate</span>
                <span style={{ fontWeight: 600, color: C.text }}>₹{(s.hourlyOvertimeRate ?? 150)} / hr</span>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "1.25rem" }}>
          <button onClick={onClose} style={{ padding: "0.5rem 1rem", border: `1px solid ${C.border}`, borderRadius: C.radiusSm, background: "#fff", fontWeight: 600, cursor: "pointer" }}>Close</button>
          <button onClick={onEdit} style={{ padding: "0.5rem 1.25rem", border: "none", borderRadius: C.radiusSm, background: C.primary, color: "#fff", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
            <Edit3 size={14} /> Edit Member
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────
function DeleteModal({
  memberName,
  onConfirm,
  onCancel,
}: {
  memberName: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: C.radius, width: "100%", maxWidth: 360, padding: "2rem", textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
        <div style={{ width: 52, height: 52, borderRadius: "14px", background: "#FEF2F2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
          <Trash2 color="#DC2626" size={24} />
        </div>
        <h3 style={{ fontWeight: 700, color: C.text, marginBottom: "0.5rem" }}>Remove Member?</h3>
        <p style={{ fontSize: "0.875rem", color: C.muted, marginBottom: "1.5rem", lineHeight: 1.5 }}>
          <strong style={{ color: C.text }}>{memberName}</strong> will be permanently removed from the team. This action cannot be undone.
        </p>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button onClick={onCancel} style={{ flex: 1, padding: "0.7rem", border: `1px solid ${C.border}`, borderRadius: C.radiusSm, background: "#fff", color: C.text, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
          <button onClick={onConfirm} style={{ flex: 1, padding: "0.7rem", border: "none", borderRadius: C.radiusSm, background: "#DC2626", color: "#fff", fontWeight: 700, cursor: "pointer" }}>Remove</button>
        </div>
      </div>
    </div>
  );
}

// ─── Team Content ─────────────────────────────────────────────────────────────
const PAGE_SIZE = 10;

function TeamContent() {
  const { user } = useRole();
  const isAdmin = user?.role === "admin";

  const [team, setTeam] = useState<Member[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [query, setQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Member | null>(null);
  const [editMember, setEditMember] = useState<Member | null>(null);
  const [viewMember, setViewMember] = useState<Member | null>(null);
  const [page, setPage] = useState(1);

  // Load from real DB on mount
  useEffect(() => {
    fetch("/api/users")
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setTeam(
            data.data.map((u: any) => ({
              id: u.id,
              name: u.name,
              role: u.role,
              email: u.email,
              phone: u.phone || "",
              status: "offline" as const,
              initials: u.name
                .split(" ")
                .map((w: string) => w[0])
                .join("")
                .slice(0, 2)
                .toUpperCase(),
              salaryStructure: u.salaryStructure || null,
            }))
          );
        }
        setLoaded(true);
      })
      .catch(() => {
        setLoaded(true);
      });
  }, []);

  // Delete from real DB
  const handleDelete = async (id: string) => {
    try {
      await fetch("/api/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
    } catch {}
    setTeam((t) => t.filter((m) => m.id !== id));
    setConfirmDelete(null);
  };

  const tabs = ["all", "admins", "marketing", "production", "video editing"];

  const filtered = team.filter((m) => {
    const r = m.role.toLowerCase();
    const matchTab =
      activeTab === "all" ||
      (activeTab === "admins" && r.includes("admin")) ||
      (activeTab === "marketing" && r.includes("marketing")) ||
      (activeTab === "production" && (r.includes("photo") || r.includes("production") || r === "editor")) ||
      (activeTab === "video editing" && r.includes("video"));
    const matchQ =
      m.name.toLowerCase().includes(query.toLowerCase()) ||
      m.email.toLowerCase().includes(query.toLowerCase()) ||
      (m.salaryStructure?.panNumber && m.salaryStructure.panNumber.toLowerCase().includes(query.toLowerCase())) ||
      (m.salaryStructure?.designation && m.salaryStructure.designation.toLowerCase().includes(query.toLowerCase()));
    return matchTab && matchQ;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleAdd = (member: Member) => {
    setTeam((t) => [...t, member]);
    setPage(1);
  };

  // Helpers
  const thStyle: React.CSSProperties = {
    padding: "0.75rem 1rem",
    textAlign: "left",
    fontSize: "0.75rem",
    fontWeight: 600,
    color: C.muted,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    borderBottom: `1px solid ${C.border}`,
    background: "#F9FAFB",
    whiteSpace: "nowrap",
  };

  const tdStyle: React.CSSProperties = {
    padding: "0.875rem 1rem",
    fontSize: "0.875rem",
    color: C.text,
    borderBottom: `1px solid ${C.border}`,
    verticalAlign: "middle",
  };

  return (
    <>
      {showModal && isAdmin && (
        <AddMemberModal onClose={() => setShowModal(false)} onAdd={handleAdd} />
      )}
      {confirmDelete && (
        <DeleteModal
          memberName={confirmDelete.name}
          onConfirm={() => handleDelete(confirmDelete.id)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
      {editMember && (
        <EditMemberModal
          member={editMember}
          onClose={() => setEditMember(null)}
          onUpdate={(updated) => {
            setTeam((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
          }}
        />
      )}
      {viewMember && (
        <ViewMemberModal
          member={viewMember}
          onClose={() => setViewMember(null)}
          onEdit={() => {
            const m = viewMember;
            setViewMember(null);
            setEditMember(m);
          }}
        />
      )}

      <div style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
        {/* ── Page Header ──────────────────────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "1rem",
            marginBottom: "1.75rem",
          }}
        >
          <div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: C.text, margin: 0 }}>
              Team &amp; Members
            </h1>
            <p style={{ fontSize: "0.875rem", color: C.muted, margin: "0.25rem 0 0 0" }}>
              {team.length} active team members with customizable statutory &amp; payroll details
            </p>
          </div>
          {isAdmin && (
            <button
              onClick={() => setShowModal(true)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.55rem 1.1rem",
                background: C.primary,
                color: "#fff",
                border: "none",
                borderRadius: C.radiusSm,
                fontSize: "0.875rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <UserPlus size={16} /> Add Member
            </button>
          )}
        </div>

        {/* ── White Card ───────────────────────────────────────────────────── */}
        <div
          style={{
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: C.radius,
          }}
        >
          {/* Toolbar */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "0.75rem",
              padding: "1rem 1.25rem",
              borderBottom: `1px solid ${C.border}`,
            }}
          >
            {/* Role tabs */}
            <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap" }}>
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => { setActiveTab(tab); setPage(1); }}
                  style={{
                    padding: "0.4rem 0.85rem",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    borderRadius: C.radiusSm,
                    border: "none",
                    cursor: "pointer",
                    textTransform: "capitalize",
                    background: activeTab === tab ? C.primary : "#F3F4F6",
                    color: activeTab === tab ? "#fff" : C.muted,
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Search */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                background: "#F9FAFB",
                border: `1px solid ${C.border}`,
                borderRadius: C.radiusSm,
                padding: "0.4rem 0.75rem",
                width: 240,
              }}
            >
              <Search size={15} color={C.muted} />
              <input
                type="text"
                placeholder="Search name, PAN, designation..."
                value={query}
                onChange={(e) => { setQuery(e.target.value); setPage(1); }}
                style={{
                  border: "none",
                  background: "transparent",
                  outline: "none",
                  fontSize: "0.825rem",
                  color: C.text,
                  width: "100%",
                }}
              />
            </div>
          </div>

          {/* Table */}
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ ...thStyle, width: 40 }}>
                    <input type="checkbox" style={{ cursor: "pointer" }} />
                  </th>
                  <th style={thStyle}>Full Name</th>
                  <th style={thStyle}>Designation &amp; Role</th>
                  <th style={thStyle}>Email &amp; Phone</th>
                  <th style={thStyle}>Statutory (PAN / Bank)</th>
                  <th style={{ ...thStyle, textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {!loaded ? (
                  <tr>
                    <td colSpan={6} style={{ ...tdStyle, textAlign: "center", color: C.muted, padding: "3rem" }}>
                      Loading team members…
                    </td>
                  </tr>
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ ...tdStyle, textAlign: "center", color: C.muted, padding: "3rem" }}>
                      No members found.
                    </td>
                  </tr>
                ) : (
                  paginated.map((member, i) => {
                    const globalIdx = (page - 1) * PAGE_SIZE + i;
                    const avatarColor = getAvatarColor(globalIdx);
                    const s = member.salaryStructure;
                    return (
                      <tr
                        key={member.id}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#F9FAFB")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                        style={{ transition: "background 0.15s" }}
                      >
                        {/* Checkbox */}
                        <td style={{ ...tdStyle, width: 40 }}>
                          <input type="checkbox" style={{ cursor: "pointer" }} />
                        </td>

                        {/* Name + Avatar */}
                        <td style={tdStyle}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                            <div
                              style={{
                                width: 36,
                                height: 36,
                                borderRadius: "50%",
                                background: avatarColor,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "#fff",
                                fontSize: "0.75rem",
                                fontWeight: 700,
                                flexShrink: 0,
                              }}
                            >
                              {member.initials}
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, color: C.text }}>
                                {member.name}
                              </div>
                              <div style={{ fontSize: "0.72rem", color: C.muted }}>
                                EMP-{(member.id.slice(-4).toUpperCase())}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Designation & Role badge */}
                        <td style={tdStyle}>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: "0.82rem", color: C.text }}>
                              {s?.designation || (member.role === "admin" ? "Director" : formatRoleDisplay(member.role))}
                            </div>
                            <div style={{ marginTop: "2px" }}>
                              <span style={roleBadge(member.role)}>
                                {formatRoleDisplay(member.role)}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Email & Phone */}
                        <td style={tdStyle}>
                          <div>
                            <a href={`mailto:${member.email}`} style={{ color: C.text, textDecoration: "none", fontSize: "0.82rem", fontWeight: 500 }}>
                              {member.email}
                            </a>
                            <div style={{ fontSize: "0.75rem", color: C.muted, marginTop: "2px" }}>
                              {member.phone || "No phone added"}
                            </div>
                          </div>
                        </td>

                        {/* Statutory (PAN / Bank) */}
                        <td style={tdStyle}>
                          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                            {s?.panNumber ? (
                              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#059669" }}>
                                PAN: {s.panNumber}
                              </span>
                            ) : (
                              <span style={{ fontSize: "0.75rem", color: "#D97706" }}>
                                ⚠ PAN Pending
                              </span>
                            )}
                            <span style={{ fontSize: "0.72rem", color: C.muted }}>
                              {s?.bankAccountNumber ? `${s.bankName || "Bank"}: ••••${s.bankAccountNumber.slice(-4)}` : "No bank linked"}
                            </span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td style={{ ...tdStyle, textAlign: "right" }}>
                          <div style={{ display: "flex", gap: "0.4rem", justifyContent: "flex-end", alignItems: "center" }}>
                            <button
                              onClick={() => setViewMember(member)}
                              title="View full employee profile"
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.3rem",
                                padding: "0.35rem 0.65rem",
                                border: `1px solid ${C.border}`,
                                borderRadius: C.radiusSm,
                                background: "#fff",
                                color: C.text,
                                fontSize: "0.78rem",
                                fontWeight: 600,
                                cursor: "pointer",
                              }}
                            >
                              <Eye size={13} /> View
                            </button>

                            {isAdmin && (
                              <button
                                onClick={() => setEditMember(member)}
                                title="Edit employee details, PAN, and salary"
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "0.3rem",
                                  padding: "0.35rem 0.65rem",
                                  border: `1px solid ${C.border}`,
                                  borderRadius: C.radiusSm,
                                  background: "#fff",
                                  color: C.primary,
                                  fontSize: "0.78rem",
                                  fontWeight: 600,
                                  cursor: "pointer",
                                }}
                              >
                                <Edit3 size={13} /> Edit
                              </button>
                            )}

                            {isAdmin && (
                              <button
                                onClick={() => setConfirmDelete(member)}
                                title="Remove member"
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  width: 30,
                                  height: 30,
                                  border: `1px solid #FECACA`,
                                  borderRadius: C.radiusSm,
                                  background: "#FEF2F2",
                                  color: "#DC2626",
                                  cursor: "pointer",
                                }}
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filtered.length > PAGE_SIZE && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "0.875rem 1.25rem",
                borderTop: `1px solid ${C.border}`,
              }}
            >
              <span style={{ fontSize: "0.8rem", color: C.muted }}>
                Showing {(page - 1) * PAGE_SIZE + 1}–
                {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} members
              </span>
              <div style={{ display: "flex", gap: "0.4rem" }}>
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  style={{
                    padding: "0.35rem 0.75rem",
                    border: `1px solid ${C.border}`,
                    borderRadius: C.radiusSm,
                    background: page === 1 ? "#F9FAFB" : "#fff",
                    color: page === 1 ? C.muted : C.text,
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    cursor: page === 1 ? "not-allowed" : "pointer",
                  }}
                >
                  ← Prev
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    style={{
                      padding: "0.35rem 0.65rem",
                      border: `1px solid ${page === p ? C.primary : C.border}`,
                      borderRadius: C.radiusSm,
                      background: page === p ? C.primary : "#fff",
                      color: page === p ? "#fff" : C.text,
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      minWidth: 32,
                    }}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  style={{
                    padding: "0.35rem 0.75rem",
                    border: `1px solid ${C.border}`,
                    borderRadius: C.radiusSm,
                    background: page === totalPages ? "#F9FAFB" : "#fff",
                    color: page === totalPages ? C.muted : C.text,
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    cursor: page === totalPages ? "not-allowed" : "pointer",
                  }}
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Page Export ──────────────────────────────────────────────────────────────
export default function TeamManagement() {
  return (
    <RoleGuard allowedRoles={["admin"]} redirectTo="/dashboard/tasks">
      <TeamContent />
    </RoleGuard>
  );
}
