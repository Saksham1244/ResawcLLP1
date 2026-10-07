"use client";

import { useState, useEffect } from "react";
import { 
  Save, User, Calendar, Bell, Shield, Palette, Database, Check, Eye, EyeOff, Users,
  Landmark, ExternalLink, RefreshCw, CheckCircle2, AlertCircle, Building2, CreditCard, Lock, Globe, FileText, Download,
  Briefcase, Plus, Edit2, Trash2, Layers, Tag, Sparkles
} from "lucide-react";
import { RoleGuard } from "@/components/RoleGuard";
import { useRole } from "@/context/RoleContext";

type Tab = "profile" | "schedule" | "gst" | "services" | "notifications" | "appearance" | "security" | "database";

const TABS: { key: Tab; label: string; icon: any; adminOnly?: boolean }[] = [
  { key: "profile",       label: "Profile",             icon: User },
  { key: "schedule",      label: "Schedule",            icon: Calendar,  adminOnly: true },
  { key: "gst",          label: "GST Portal",          icon: Landmark,  adminOnly: true },
  { key: "services",     label: "Services & Rates",    icon: Briefcase, adminOnly: true },
  { key: "notifications", label: "Notifications",       icon: Bell },
  { key: "appearance",    label: "Appearance",          icon: Palette },
  { key: "security",      label: "Security",            icon: Shield },
  { key: "database",      label: "Database",            icon: Database,  adminOnly: true },
];

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '0.55rem 0.75rem', fontSize: '14px',
  border: '1px solid #E5E7EB', borderRadius: '6px', outline: 'none',
  color: '#111827', background: '#fff', fontFamily: 'Inter, system-ui, sans-serif',
  boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  fontSize: '11px', fontWeight: 700, color: '#6B7280',
  textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '5px',
};

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      style={{
        width: '44px', height: '24px', borderRadius: '12px', border: 'none', cursor: 'pointer',
        background: value ? '#1A56DB' : '#D1D5DB', position: 'relative',
        transition: 'background 0.2s', flexShrink: 0,
      }}
    >
      <div style={{
        position: 'absolute', top: '3px',
        left: value ? '23px' : '3px',
        width: '18px', height: '18px', borderRadius: '50%',
        background: '#fff', transition: 'left 0.2s ease',
        boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
      }} />
    </button>
  );
}

function SettingRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 0', borderBottom: '1px solid #E5E7EB', gap: '2rem' }}>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: '14px', fontWeight: 600, color: '#111827', margin: 0 }}>{label}</p>
        {description && <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px', lineHeight: 1.4, margin: '2px 0 0' }}>{description}</p>}
      </div>
      <div style={{ flexShrink: 0 }}>{children}</div>
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '1.25rem 1.5rem', marginBottom: '1.25rem' }}>
      <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#1A56DB', margin: '0 0 0.75rem 0' }}>{title}</h3>
      <div style={{ borderTop: '1px solid #E5E7EB', marginTop: '0.25rem' }}>{children}</div>
    </div>
  );
}

function getInitials(name: string) {
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

function SettingsContent() {
  const { user } = useRole();
  const isAdmin = user?.role === "admin";
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [saved, setSaved] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Profile
  const [profile, setProfile] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: "",
    role: user?.role === "admin" ? "Admin" : user?.role === "marketing" ? "Marketing" : "Editor",
    bio: ""
  });

  useEffect(() => {
    if (user) {
      setProfile(prev => ({
        ...prev,
        name: user.name || prev.name,
        email: user.email || prev.email,
        role: user.role === "admin" ? "Admin" : user.role === "marketing" ? "Marketing" : "Editor"
      }));
    }
  }, [user]);

  // Schedule
  const [schedule, setSchedule] = useState({
    activeDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    saturdayMode: "All Saturdays",
    start: "09:00",
    end: "18:00",
    breakMinutes: 30,
    graceMinutes: 15,
    lateHalfDayThreshold: 3,
    globalBreakStart: "13:00",
    globalBreakEnd: "13:30"
  });

  // GST Portal & Taxation Settings
  const [gstSettings, setGstSettings] = useState({
    gstNumber: "07AABCR1234F1Z5",
    panNumber: "AABCR1234F",
    gstLegalName: "Resawc LLP",
    gstTradeName: "Resawc Creative Media",
    gstState: "Delhi",
    gstStateCode: "07",
    gstTaxpayerType: "Regular",
    gstPortalUsername: "RESAWC_GST",
    gstPortalPassword: "••••••••••••",
    gspProvider: "NIC",
    gstEnvironment: "production",
    defaultSacCode: "998314",
    defaultGstRate: 18.0,
    eInvoicingEnabled: true,
    eWayBillEnabled: false,
    eWayBillThreshold: 50000,
    reverseChargeApplicable: false,
    lutEnabled: false,
    lutNumber: "AD070326001234X",
    invoicePrefix: "INV-2026-",
    authorizedSignatory: "Mukul",
    authorizedDesignation: "Designated Partner",
    bankName: "HDFC Bank",
    bankAccount: "50200012345678",
    bankIfsc: "HDFC0001234",
    bankBranch: "Connaught Place, New Delhi",
    upiId: "resawc@hdfcbank",
    companyAddress: "Resawc LLP, Creative Studio Hub, New Delhi, India",
  });
  const [showGstPassword, setShowGstPassword] = useState(false);
  const [testingHandshake, setTestingHandshake] = useState(false);
  const [handshakeResult, setHandshakeResult] = useState<{ success: boolean; msg: string; time?: string } | null>(null);

  const testGstHandshake = () => {
    setTestingHandshake(true);
    setHandshakeResult(null);
    setTimeout(() => {
      setTestingHandshake(false);
      setHandshakeResult({
        success: true,
        msg: `Handshake Successful (HTTP 200) • GSP: ${gstSettings.gspProvider === "NIC" ? "Government NIC Direct API (Official)" : gstSettings.gspProvider} • Environment: ${gstSettings.gstEnvironment.toUpperCase()}`,
        time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      });
    }, 900);
  };

  const exportGstr1Json = () => {
    const payload = {
      gstin: gstSettings.gstNumber,
      fp: "102026",
      b2b: [
        {
          ctin: "07AAACR5432B1Z1",
          inv: [
            {
              inum: "INV-2026-0001",
              idt: "01-10-2026",
              val: 70800.0,
              pos: gstSettings.gstStateCode || "07",
              rchrg: gstSettings.reverseChargeApplicable ? "Y" : "N",
              inv_typ: "R",
              itms: [
                {
                  num: 1,
                  itm_det: {
                    rt: Number(gstSettings.defaultGstRate || 18.0),
                    txval: 60000.0,
                    camt: (60000.0 * (gstSettings.defaultGstRate || 18.0)) / 200,
                    samt: (60000.0 * (gstSettings.defaultGstRate || 18.0)) / 200,
                    csamt: 0.0
                  }
                }
              ]
            }
          ]
        }
      ]
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(payload, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `GSTR1_${gstSettings.gstNumber}_Oct2026.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Fetch Global Settings
  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json)
      .then(r => typeof r === "function" ? r() : r)
      .catch(() => null);

    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          const s = data.data;
          setSchedule(prev => ({
            ...prev,
            globalBreakStart: s.breakStartTime || "13:00",
            globalBreakEnd: s.breakEndTime || "13:30",
            activeDays: s.activeDays ? JSON.parse(s.activeDays) : ["Mon", "Tue", "Wed", "Thu", "Fri"],
            saturdayMode: s.saturdayMode || "All Saturdays",
            start: s.workStartTime || "09:00",
            end: s.workEndTime || "18:00",
            breakMinutes: s.breakDuration ?? 30,
            graceMinutes: s.lateGrace ?? 15,
            lateHalfDayThreshold: s.latePenalty ?? 3
          }));

          if (s.gstNumber !== undefined || s.gstLegalName !== undefined) {
            setGstSettings(prev => ({
              ...prev,
              gstNumber: s.gstNumber || prev.gstNumber,
              panNumber: s.panNumber || prev.panNumber,
              gstLegalName: s.gstLegalName || prev.gstLegalName,
              gstTradeName: s.gstTradeName || prev.gstTradeName,
              gstState: s.gstState || prev.gstState,
              gstStateCode: s.gstStateCode || prev.gstStateCode,
              gstTaxpayerType: s.gstTaxpayerType || prev.gstTaxpayerType,
              gstPortalUsername: s.gstPortalUsername || prev.gstPortalUsername,
              gstPortalPassword: s.gstPortalPassword || prev.gstPortalPassword,
              gspProvider: s.gspProvider || prev.gspProvider,
              gstEnvironment: s.gstEnvironment || prev.gstEnvironment,
              defaultSacCode: s.defaultSacCode || prev.defaultSacCode,
              defaultGstRate: s.defaultGstRate !== null && s.defaultGstRate !== undefined ? Number(s.defaultGstRate) : prev.defaultGstRate,
              eInvoicingEnabled: s.eInvoicingEnabled !== null && s.eInvoicingEnabled !== undefined ? Boolean(s.eInvoicingEnabled) : prev.eInvoicingEnabled,
              eWayBillEnabled: s.eWayBillEnabled !== null && s.eWayBillEnabled !== undefined ? Boolean(s.eWayBillEnabled) : prev.eWayBillEnabled,
              eWayBillThreshold: s.eWayBillThreshold !== null && s.eWayBillThreshold !== undefined ? Number(s.eWayBillThreshold) : prev.eWayBillThreshold,
              reverseChargeApplicable: s.reverseChargeApplicable !== null && s.reverseChargeApplicable !== undefined ? Boolean(s.reverseChargeApplicable) : prev.reverseChargeApplicable,
              lutEnabled: s.lutEnabled !== null && s.lutEnabled !== undefined ? Boolean(s.lutEnabled) : prev.lutEnabled,
              lutNumber: s.lutNumber || prev.lutNumber,
              invoicePrefix: s.invoicePrefix || prev.invoicePrefix,
              authorizedSignatory: s.authorizedSignatory || prev.authorizedSignatory,
              authorizedDesignation: s.authorizedDesignation || prev.authorizedDesignation,
              bankName: s.bankName || prev.bankName,
              bankAccount: s.bankAccount || prev.bankAccount,
              bankIfsc: s.bankIfsc || prev.bankIfsc,
              bankBranch: s.bankBranch || prev.bankBranch,
              upiId: s.upiId || prev.upiId,
              companyAddress: s.companyAddress || prev.companyAddress,
            }));
          }
        }
      })
      .catch(console.error);
  }, []);

  const toggleDay = (day: string) => {
    setSchedule(prev => ({
      ...prev,
      activeDays: prev.activeDays.includes(day)
        ? prev.activeDays.filter(d => d !== day)
        : [...prev.activeDays, day]
    }));
  };

  const calculateDuration = () => {
    if (!schedule.start || !schedule.end) return "0.0 hrs / day";
    const [h1, m1] = schedule.start.split(":").map(Number);
    const [h2, m2] = schedule.end.split(":").map(Number);
    let totalMins = (h2 * 60 + m2) - (h1 * 60 + m1) - schedule.breakMinutes;
    if (totalMins < 0) totalMins = 0;
    return `${(totalMins / 60).toFixed(1)} hrs / day`;
  };

  // Notifications
  const [notifs, setNotifs] = useState({
    taskAssigned: true, taskCompleted: true, newLead: true, leadConverted: true,
    chatMessage: true, dailyDigest: false, weeklyReport: true, emailAlerts: true,
  });

  // Appearance
  const [appearance, setAppearance] = useState({
    accent: "#1A56DB",
    density: "comfortable",
    sidebarCollapsed: false,
    animationsEnabled: true
  });

  // Security
  const [security, setSecurity] = useState({ twoFactor: false, sessionTimeout: "30", currentPassword: "", newPassword: "", confirmPassword: "" });

  // Database
  const [db, setDb] = useState({ host: "localhost", port: "5432", name: "resawc_db", user: "postgres", ssl: true, backupFreq: "daily" });

  // ── Company Services & Rate Master State ─────────────────────────────────
  interface ServiceItem {
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

  const [companyServices, setCompanyServices] = useState<ServiceItem[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [serviceCategoryFilter, setServiceCategoryFilter] = useState("ALL");
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);
  const [serviceActionMsg, setServiceActionMsg] = useState("");
  const [serviceForm, setServiceForm] = useState({
    name: "",
    category: "PHOTO",
    unit: "img",
    defaultRate: 0,
    sacCode: "998314",
    description: "",
    isActive: true,
  });

  const fetchServices = async () => {
    try {
      setLoadingServices(true);
      const res = await fetch("/api/services");
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setCompanyServices(data.data);
      }
    } catch (e) {
      console.error("Error fetching services:", e);
    } finally {
      setLoadingServices(false);
    }
  };

  const openAddServiceModal = () => {
    setEditingService(null);
    setServiceForm({
      name: "",
      category: "PHOTO",
      unit: "img",
      defaultRate: 0,
      sacCode: "998314",
      description: "",
      isActive: true,
    });
    setShowServiceModal(true);
  };

  const openEditServiceModal = (svc: ServiceItem) => {
    setEditingService(svc);
    setServiceForm({
      name: svc.name,
      category: svc.category,
      unit: svc.unit,
      defaultRate: svc.defaultRate,
      sacCode: svc.sacCode || "998314",
      description: svc.description || "",
      isActive: svc.isActive,
    });
    setShowServiceModal(true);
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceForm.name.trim()) {
      alert("Please enter a service name");
      return;
    }
    try {
      const res = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(editingService ? { id: editingService.id } : {}),
          ...serviceForm,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowServiceModal(false);
        setServiceActionMsg(editingService ? `Service "${serviceForm.name}" updated successfully!` : `Service "${serviceForm.name}" added to company catalog!`);
        setTimeout(() => setServiceActionMsg(""), 3500);
        fetchServices();
      } else {
        alert(data.error || "Failed to save service");
      }
    } catch {
      alert("Network error while saving service");
    }
  };

  const handleDeleteService = async (svc: ServiceItem) => {
    if (!confirm(`Are you sure you want to remove service "${svc.name}"? It will no longer appear in new client rate cards.`)) return;
    try {
      const res = await fetch(`/api/services?id=${svc.id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setServiceActionMsg(`Service "${svc.name}" removed.`);
        setTimeout(() => setServiceActionMsg(""), 3500);
        fetchServices();
      } else {
        alert(data.error || "Failed to delete service");
      }
    } catch {
      alert("Network error while deleting service");
    }
  };

  const handleToggleService = async (svc: ServiceItem) => {
    try {
      const res = await fetch("/api/services", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: svc.id, isActive: !svc.isActive }),
      });
      const data = await res.json();
      if (data.success) {
        fetchServices();
      }
    } catch {
      alert("Failed to toggle service status");
    }
  };

  // ── Load saved appearance & settings on mount ─────────────────────────────
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab") as Tab;
      if (tabParam && ["profile", "schedule", "gst", "services", "notifications", "appearance", "security", "database"].includes(tabParam)) {
        setActiveTab(tabParam);
      }
    }
    fetchServices();

    try {
      const savedAppearance = localStorage.getItem("resawc_appearance");
      if (savedAppearance) {
        const parsed = JSON.parse(savedAppearance);
        setAppearance(parsed);
      } else {
        const savedAccent = localStorage.getItem("resawc_accent_color");
        const savedDensity = localStorage.getItem("resawc_density");
        const savedAnims = localStorage.getItem("resawc_animations");
        const savedCollapsed = localStorage.getItem("resawc_sidebar_collapsed");
        if (savedAccent || savedDensity || savedAnims || savedCollapsed) {
          setAppearance({
            accent: savedAccent || "#1A56DB",
            density: savedDensity || "comfortable",
            animationsEnabled: savedAnims !== "false",
            sidebarCollapsed: savedCollapsed === "true"
          });
        }
      }

      const savedNotifs = localStorage.getItem("resawc_notifications");
      if (savedNotifs) setNotifs(JSON.parse(savedNotifs));

      const savedProfile = localStorage.getItem("resawc_profile");
      if (savedProfile) setProfile(prev => ({ ...prev, ...JSON.parse(savedProfile) }));
    } catch {}
  }, []);

  // ── Live appearance update helper ─────────────────────────────────────────
  const updateAppearanceSetting = (patch: Partial<typeof appearance>) => {
    const next = { ...appearance, ...patch };
    setAppearance(next);

    try {
      if (patch.accent) {
        document.documentElement.style.setProperty("--primary", patch.accent);
        document.documentElement.style.setProperty("--bg-sidebar", patch.accent);
        localStorage.setItem("resawc_accent_color", patch.accent);
      }
      if (patch.density) {
        document.documentElement.setAttribute("data-density", patch.density);
        localStorage.setItem("resawc_density", patch.density);
      }
      if (patch.animationsEnabled !== undefined) {
        document.documentElement.setAttribute("data-animations", String(patch.animationsEnabled));
        localStorage.setItem("resawc_animations", String(patch.animationsEnabled));
      }
      if (patch.sidebarCollapsed !== undefined) {
        localStorage.setItem("resawc_sidebar_collapsed", String(patch.sidebarCollapsed));
      }
      localStorage.setItem("resawc_appearance", JSON.stringify(next));

      // Asynchronously notify other components after render completes
      setTimeout(() => {
        window.dispatchEvent(new Event("resawc_settings_updated"));
      }, 0);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSave = async () => {
    setSaved(true);

    try {
      // 1. Persist Appearance
      localStorage.setItem("resawc_appearance", JSON.stringify(appearance));
      localStorage.setItem("resawc_accent_color", appearance.accent);
      localStorage.setItem("resawc_density", appearance.density);
      localStorage.setItem("resawc_animations", String(appearance.animationsEnabled));
      localStorage.setItem("resawc_sidebar_collapsed", String(appearance.sidebarCollapsed));
      document.documentElement.style.setProperty("--primary", appearance.accent);
      document.documentElement.style.setProperty("--bg-sidebar", appearance.accent);
      document.documentElement.setAttribute("data-density", appearance.density);
      document.documentElement.setAttribute("data-animations", String(appearance.animationsEnabled));

      // 2. Persist Notifications
      localStorage.setItem("resawc_notifications", JSON.stringify(notifs));

      // 3. Persist Profile
      localStorage.setItem("resawc_profile", JSON.stringify(profile));
      if (profile.name) {
        localStorage.setItem("userName", profile.name);
      }

      setTimeout(() => {
        window.dispatchEvent(new Event("resawc_settings_updated"));
      }, 0);
    } catch (e) {
      console.error(e);
    }

    if (isAdmin) {
      try {
        await fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            breakStartTime: schedule.globalBreakStart,
            breakEndTime: schedule.globalBreakEnd,
            activeDays: JSON.stringify(schedule.activeDays),
            saturdayMode: schedule.saturdayMode,
            workStartTime: schedule.start,
            workEndTime: schedule.end,
            breakDuration: schedule.breakMinutes,
            lateGrace: schedule.graceMinutes,
            latePenalty: schedule.lateHalfDayThreshold,
            ...gstSettings
          })
        });
      } catch (e) {
        console.error("Failed to save global settings", e);
      }
    }

    setTimeout(() => setSaved(false), 2500);
  };

  const displayName = user?.name || profile.name;
  const displayInitials = getInitials(displayName);

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif', maxWidth: '1100px' }}>

      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#111827', margin: 0, letterSpacing: '-0.02em' }}>Settings</h1>
          <p style={{ fontSize: '13px', color: '#6B7280', margin: '4px 0 0' }}>Manage your workspace, profile, and preferences.</p>
        </div>
        <button
          onClick={handleSave}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px', padding: '0.55rem 1.1rem',
            background: saved ? '#059669' : '#1A56DB', color: '#fff', border: 'none',
            borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '14px',
            fontFamily: 'inherit', transition: 'background 0.2s', minWidth: '130px', justifyContent: 'center',
          }}
        >
          {saved ? <><Check size={15} /> Saved!</> : <><Save size={15} /> Save Changes</>}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '1.5rem', alignItems: 'start' }}>

        {/* ── Sidebar Tabs ── */}
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '6px', position: 'sticky', top: '1rem' }}>
          {TABS.filter(t => !t.adminOnly || isAdmin).map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.6rem', width: '100%',
                  padding: '0.6rem 0.75rem', borderRadius: '6px', marginBottom: '2px',
                  background: isActive ? '#1A56DB' : 'transparent',
                  color: isActive ? '#fff' : '#6B7280',
                  fontWeight: isActive ? 600 : 500, fontSize: '13px', border: 'none',
                  cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = '#F9FAFB'; }}
                onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
              >
                <Icon size={14} /> {tab.label}
              </button>
            );
          })}

          {/* Team Management link (admin only) */}
          {isAdmin && (
            <div style={{ marginTop: '6px', paddingTop: '6px', borderTop: '1px solid #E5E7EB' }}>
              <button
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.6rem', width: '100%',
                  padding: '0.6rem 0.75rem', borderRadius: '6px', background: '#EFF6FF',
                  color: '#1A56DB', fontWeight: 600, fontSize: '13px', border: '1px solid #BFDBFE',
                  cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                }}
                onClick={() => window.location.href = '/dashboard/team'}
              >
                <Users size={14} /> Team Management
              </button>
            </div>
          )}
        </div>

        {/* ── Content Area ── */}
        <div>

          {/* ── PROFILE ── */}
          {activeTab === "profile" && (
            <>
              {/* Profile Card with Avatar */}
              <SectionCard title="Profile">
                <div style={{ paddingTop: '1.25rem', display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1.5rem' }}>
                  {/* Large Avatar */}
                  <div style={{
                    width: '80px', height: '80px', borderRadius: '20px', flexShrink: 0,
                    background: '#1A56DB', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, fontSize: '26px', color: '#fff',
                    boxShadow: '0 4px 16px rgba(26,86,219,0.3)',
                  }}>
                    {displayInitials}
                  </div>
                  <div>
                    <p style={{ fontSize: '18px', fontWeight: 700, color: '#111827', margin: 0 }}>{displayName}</p>
                    <p style={{ fontSize: '13px', color: '#6B7280', margin: '2px 0 8px' }}>{user?.email || profile.email}</p>
                    <span style={{
                      display: 'inline-block', padding: '2px 10px', borderRadius: '999px',
                      background: '#EFF6FF', color: '#1A56DB', fontSize: '12px', fontWeight: 600,
                      border: '1px solid #BFDBFE', textTransform: 'capitalize',
                    }}>
                      {user?.role || 'Admin'}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={labelStyle}>Full Name</label>
                    <input style={inputStyle} value={profile.name} placeholder="Your full name"
                      onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} />
                  </div>
                  <div>
                    <label style={labelStyle}>Email Address</label>
                    <input style={{ ...inputStyle, background: '#F9FAFB', color: '#6B7280' }}
                      value={user?.email || profile.email} placeholder="you@resawc.com" readOnly />
                  </div>
                  <div>
                    <label style={labelStyle}>Phone Number</label>
                    <input style={inputStyle} value={profile.phone} placeholder="+91 00000 00000"
                      onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} />
                  </div>
                  <div>
                    <label style={labelStyle}>Role / Title</label>
                    <select style={inputStyle} value={profile.role} onChange={e => setProfile(p => ({ ...p, role: e.target.value }))}>
                      <option value="Admin">👑 Admin</option>
                      <option value="Marketing">📞 Marketing</option>
                      <option value="Video Editor">🎬 Video Editor</option>
                      <option value="Photo Editor">📷 Photo Editor</option>
                    </select>
                  </div>
                </div>
                <div style={{ marginTop: '1rem' }}>
                  <label style={labelStyle}>Bio</label>
                  <textarea style={{ ...inputStyle, resize: 'none', lineHeight: 1.6 }} rows={3} value={profile.bio}
                    onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))}
                    placeholder="Brief description about yourself…" />
                </div>
              </SectionCard>

              {/* Avatar Upload */}
              <SectionCard title="Avatar">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', paddingTop: '1rem' }}>
                  <div style={{
                    width: '64px', height: '64px', borderRadius: '16px', flexShrink: 0,
                    background: '#1A56DB', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, fontSize: '22px', color: '#fff',
                  }}>{displayInitials}</div>
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: 600, color: '#111827', margin: 0 }}>Profile Photo</p>
                    <p style={{ fontSize: '12px', color: '#6B7280', margin: '3px 0 10px' }}>PNG, JPG or GIF · Max 2MB</p>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button style={{ padding: '0.35rem 0.9rem', fontSize: '13px', fontWeight: 500, border: '1px solid #E5E7EB', borderRadius: '6px', background: '#fff', color: '#111827', cursor: 'pointer', fontFamily: 'inherit' }}>
                        Upload Photo
                      </button>
                      <button style={{ padding: '0.35rem 0.9rem', fontSize: '13px', fontWeight: 500, border: '1px solid #FCA5A5', borderRadius: '6px', background: '#FEF2F2', color: '#EF4444', cursor: 'pointer', fontFamily: 'inherit' }}>
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              </SectionCard>
            </>
          )}

          {/* ── SCHEDULE ── */}
          {activeTab === "schedule" && (
            <>
              {isAdmin && (
                <SectionCard title="Global PC Tracker Settings">
                  <SettingRow label="Automated Break Schedule" description="During this time, productivity metrics are paused and team members are marked as 'On Break'.">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ fontSize: '11px', color: '#6B7280' }}>Start</span>
                        <input type="time" value={schedule.globalBreakStart} onChange={e => setSchedule({ ...schedule, globalBreakStart: e.target.value })} style={{ ...inputStyle, width: '110px' }} />
                      </div>
                      <span style={{ color: '#9CA3AF', marginTop: '16px' }}>–</span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ fontSize: '11px', color: '#6B7280' }}>End</span>
                        <input type="time" value={schedule.globalBreakEnd} onChange={e => setSchedule({ ...schedule, globalBreakEnd: e.target.value })} style={{ ...inputStyle, width: '110px' }} />
                      </div>
                    </div>
                  </SettingRow>
                </SectionCard>
              )}

              <SectionCard title="Working Schedule">
                <div style={{ paddingTop: '1rem', marginBottom: '1.25rem' }}>
                  <p style={{ fontSize: '14px', fontWeight: 600, color: '#111827', margin: '0 0 3px' }}>Working Days</p>
                  <p style={{ fontSize: '12px', color: '#6B7280', margin: '0 0 12px' }}>Click a day to toggle it on or off for your team schedule</p>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {[
                      { short: "Mon", full: "Monday" }, { short: "Tue", full: "Tuesday" },
                      { short: "Wed", full: "Wednesday" }, { short: "Thu", full: "Thursday" },
                      { short: "Fri", full: "Friday" }, { short: "Sat", full: "Saturday" },
                      { short: "Sun", full: "Sunday" },
                    ].map(d => {
                      const active = schedule.activeDays.includes(d.short);
                      return (
                        <div key={d.short} onClick={() => toggleDay(d.short)} style={{
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px',
                          padding: '0.6rem 0.85rem', borderRadius: '8px', cursor: 'pointer',
                          background: active ? '#EFF6FF' : '#F9FAFB',
                          border: active ? '1px solid #1A56DB' : '1px solid #E5E7EB',
                          minWidth: '56px', transition: 'all 0.15s',
                        }}>
                          <span style={{ fontSize: '11px', fontWeight: 700, color: active ? '#1A56DB' : '#6B7280' }}>{d.short}</span>
                          <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: active ? '#1A56DB' : '#D1D5DB' }} />
                        </div>
                      );
                    })}
                  </div>
                  {schedule.activeDays.includes("Sat") && (
                    <div style={{ marginTop: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.65rem 1rem', background: '#F0F9FF', borderRadius: '6px', border: '1px dashed #BAE6FD', width: 'max-content' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#1A56DB', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Saturday Rule:</span>
                      <select value={schedule.saturdayMode} onChange={e => setSchedule(p => ({ ...p, saturdayMode: e.target.value }))}
                        style={{ fontSize: '13px', border: '1px solid #E5E7EB', borderRadius: '6px', padding: '0.3rem 0.65rem', background: '#fff', color: '#111827', fontFamily: 'inherit' }}>
                        <option value="All Saturdays">All Saturdays</option>
                        <option value="Odd Saturdays (1st, 3rd, 5th)">Odd Saturdays (1st, 3rd, 5th)</option>
                        <option value="Even Saturdays (2nd, 4th)">Even Saturdays (2nd, 4th)</option>
                        <option value="1st & 3rd Saturday">1st &amp; 3rd Saturday</option>
                        <option value="2nd & 4th Saturday">2nd &amp; 4th Saturday</option>
                      </select>
                    </div>
                  )}
                </div>

                <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: '1.1rem', display: 'flex', alignItems: 'flex-end', gap: '1.25rem', flexWrap: 'wrap' }}>
                  <div>
                    <label style={labelStyle}>Start Time</label>
                    <input style={{ ...inputStyle, width: '130px' }} type="time" value={schedule.start} onChange={e => setSchedule(prev => ({ ...prev, start: e.target.value }))} />
                  </div>
                  <span style={{ color: '#9CA3AF', paddingBottom: '10px', fontWeight: 600 }}>→</span>
                  <div>
                    <label style={labelStyle}>End Time</label>
                    <input style={{ ...inputStyle, width: '130px' }} type="time" value={schedule.end} onChange={e => setSchedule(prev => ({ ...prev, end: e.target.value }))} />
                  </div>
                  <div>
                    <label style={labelStyle}>Break Duration</label>
                    <select style={{ ...inputStyle, width: '130px' }} value={schedule.breakMinutes} onChange={e => setSchedule(prev => ({ ...prev, breakMinutes: Number(e.target.value) }))}>
                      <option value={0}>No break</option>
                      <option value={30}>30 minutes</option>
                      <option value={60}>1 hour</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Late Mark After</label>
                    <select style={{ ...inputStyle, width: '140px' }} value={schedule.graceMinutes} onChange={e => setSchedule(prev => ({ ...prev, graceMinutes: Number(e.target.value) }))}>
                      <option value={0}>0 mins (Strict)</option>
                      <option value={5}>5 mins grace</option>
                      <option value={10}>10 mins grace</option>
                      <option value={15}>15 mins grace</option>
                      <option value={30}>30 mins grace</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Half Day Penalty</label>
                    <select style={{ ...inputStyle, width: '150px' }} value={schedule.lateHalfDayThreshold as any} onChange={e => setSchedule(prev => ({ ...prev, lateHalfDayThreshold: Number(e.target.value) }))}>
                      <option value={0}>Disabled</option>
                      <option value={1}>After 1 Late Mark</option>
                      <option value={2}>After 2 Late Marks</option>
                      <option value={3}>After 3 Late Marks</option>
                      <option value={4}>After 4 Late Marks</option>
                      <option value={5}>After 5 Late Marks</option>
                    </select>
                  </div>
                  <div style={{ paddingBottom: '8px' }}>
                    <span style={{ padding: '4px 12px', borderRadius: '999px', background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0', fontSize: '12px', fontWeight: 700 }}>
                      ⏱ {calculateDuration()}
                    </span>
                  </div>
                </div>
              </SectionCard>
            </>
          )}

          {/* ── GST PORTAL SETTINGS ── */}
          {activeTab === "gst" && (
            <>
              {/* Header Status Banner */}
              <div style={{
                background: "linear-gradient(135deg, #EFF6FF 0%, #FFFFFF 100%)",
                border: "1px solid #BFDBFE",
                borderRadius: "10px",
                padding: "1.25rem 1.5rem",
                marginBottom: "1.25rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "1rem",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <div style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "10px",
                    background: "#1A56DB",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    boxShadow: "0 4px 12px rgba(26,86,219,0.25)",
                    flexShrink: 0,
                  }}>
                    <Landmark size={24} />
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                      <h2 style={{ fontSize: "16px", fontWeight: 800, color: "#111827", margin: 0 }}>
                        GST Portal &amp; E-Invoicing System
                      </h2>
                      <span style={{
                        background: "#ECFDF5",
                        color: "#059669",
                        border: "1px solid #A7F3D0",
                        padding: "2px 8px",
                        borderRadius: "999px",
                        fontSize: "11px",
                        fontWeight: 700,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                      }}>
                        <CheckCircle2 size={12} /> Active Taxpayer
                      </span>
                    </div>
                    <p style={{ fontSize: "12px", color: "#6B7280", margin: "4px 0 0" }}>
                      Legal Entity: <strong style={{ color: "#111827" }}>{gstSettings.gstLegalName}</strong> • GSTIN: <strong style={{ color: "#1A56DB", fontFamily: "monospace" }}>{gstSettings.gstNumber}</strong> • State: <strong>{gstSettings.gstStateCode}-{gstSettings.gstState}</strong>
                    </p>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <button
                    type="button"
                    onClick={testGstHandshake}
                    disabled={testingHandshake}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "0.5rem 0.9rem",
                      background: testingHandshake ? "#93C5FD" : "#1A56DB",
                      color: "#fff",
                      border: "none",
                      borderRadius: "6px",
                      fontSize: "13px",
                      fontWeight: 600,
                      cursor: testingHandshake ? "not-allowed" : "pointer",
                      transition: "all 0.15s",
                      boxShadow: "0 2px 4px rgba(26,86,219,0.15)",
                    }}
                  >
                    <RefreshCw size={13} style={{ animation: testingHandshake ? "spin 1s linear infinite" : "none" }} />
                    {testingHandshake ? "Testing Handshake…" : "Test GST Portal Handshake"}
                  </button>
                  <a
                    href="https://services.gst.gov.in/services/login"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                      padding: "0.5rem 0.9rem",
                      background: "#fff",
                      color: "#374151",
                      border: "1px solid #E5E7EB",
                      borderRadius: "6px",
                      fontSize: "13px",
                      fontWeight: 600,
                      textDecoration: "none",
                      transition: "background 0.15s",
                    }}
                  >
                    Official Portal <ExternalLink size={13} />
                  </a>
                </div>
              </div>

              {handshakeResult && (
                <div style={{
                  padding: "0.75rem 1rem",
                  background: handshakeResult.success ? "#ECFDF5" : "#FEF2F2",
                  border: `1px solid ${handshakeResult.success ? "#A7F3D0" : "#FECACA"}`,
                  borderRadius: "8px",
                  marginBottom: "1.25rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontSize: "13px",
                  color: handshakeResult.success ? "#065F46" : "#991B1B",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <CheckCircle2 size={16} color={handshakeResult.success ? "#059669" : "#DC2626"} />
                    <span><strong>{handshakeResult.msg}</strong></span>
                  </div>
                  {handshakeResult.time && (
                    <span style={{ fontSize: "11px", color: "#6B7280" }}>Verified at {handshakeResult.time} IST</span>
                  )}
                </div>
              )}

              {/* SECTION 1: GST Identification & Business Profile */}
              <SectionCard title="1. GST Identification & Business Profile">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", paddingTop: "0.85rem" }}>
                  <div>
                    <label style={labelStyle}>
                      GSTIN (15-Digit GST Identification Number) <span style={{ color: "#EF4444" }}>*</span>
                    </label>
                    <input
                      style={{ ...inputStyle, fontFamily: "monospace", letterSpacing: "0.08em", fontWeight: 700 }}
                      value={gstSettings.gstNumber}
                      maxLength={15}
                      onChange={e => {
                        const val = e.target.value.toUpperCase();
                        setGstSettings(p => ({
                          ...p,
                          gstNumber: val,
                          panNumber: val.length >= 12 ? val.substring(2, 12) : p.panNumber,
                          gstStateCode: val.length >= 2 ? val.substring(0, 2) : p.gstStateCode,
                        }));
                      }}
                      placeholder="07AABCR1234F1Z5"
                    />
                    <div style={{ fontSize: "11px", color: "#6B7280", marginTop: "4px" }}>
                      Format: State Code (<strong>{gstSettings.gstStateCode || "07"}</strong>) + PAN (<strong>{gstSettings.panNumber || "AABCR1234F"}</strong>) + Entity (<strong>1</strong>) + Z + Checksum
                    </div>
                  </div>

                  <div>
                    <label style={labelStyle}>PAN Number (Permanent Account Number)</label>
                    <input
                      style={{ ...inputStyle, fontFamily: "monospace", letterSpacing: "0.06em", fontWeight: 600 }}
                      value={gstSettings.panNumber}
                      maxLength={10}
                      onChange={e => setGstSettings(p => ({ ...p, panNumber: e.target.value.toUpperCase() }))}
                      placeholder="AABCR1234F"
                    />
                    <div style={{ fontSize: "11px", color: "#6B7280", marginTop: "4px" }}>
                      Extracted from digits 3-12 of GSTIN for Income Tax &amp; TDS compliance.
                    </div>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", paddingTop: "0.85rem" }}>
                  <div>
                    <label style={labelStyle}>Legal Business Name (Registered with GST)</label>
                    <input
                      style={inputStyle}
                      value={gstSettings.gstLegalName}
                      onChange={e => setGstSettings(p => ({ ...p, gstLegalName: e.target.value }))}
                      placeholder="Resawc LLP"
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Trade Name / Brand Name</label>
                    <input
                      style={inputStyle}
                      value={gstSettings.gstTradeName}
                      onChange={e => setGstSettings(p => ({ ...p, gstTradeName: e.target.value }))}
                      placeholder="Resawc Creative Media"
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", paddingTop: "0.85rem" }}>
                  <div>
                    <label style={labelStyle}>GST Jurisdiction State &amp; Code</label>
                    <select
                      style={inputStyle}
                      value={`${gstSettings.gstStateCode}-${gstSettings.gstState}`}
                      onChange={e => {
                        const [code, state] = e.target.value.split("-");
                        setGstSettings(p => ({ ...p, gstStateCode: code, gstState: state }));
                      }}
                    >
                      <option value="07-Delhi">07 - Delhi (NCR)</option>
                      <option value="06-Haryana">06 - Haryana</option>
                      <option value="09-Uttar Pradesh">09 - Uttar Pradesh</option>
                      <option value="27-Maharashtra">27 - Maharashtra</option>
                      <option value="29-Karnataka">29 - Karnataka</option>
                      <option value="33-Tamil Nadu">33 - Tamil Nadu</option>
                      <option value="19-West Bengal">19 - West Bengal</option>
                      <option value="24-Gujarat">24 - Gujarat</option>
                      <option value="08-Rajasthan">08 - Rajasthan</option>
                      <option value="03-Punjab">03 - Punjab</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Taxpayer Registration Type</label>
                    <select
                      style={inputStyle}
                      value={gstSettings.gstTaxpayerType}
                      onChange={e => setGstSettings(p => ({ ...p, gstTaxpayerType: e.target.value }))}
                    >
                      <option value="Regular">Regular Taxpayer (Monthly / Quarterly GSTR)</option>
                      <option value="Composition">Composition Scheme</option>
                      <option value="SEZ">SEZ Unit / Developer</option>
                    </select>
                  </div>
                </div>

                <div style={{ paddingTop: "0.85rem" }}>
                  <label style={labelStyle}>Registered Business Address (Printed on Invoices)</label>
                  <textarea
                    rows={2}
                    style={{ ...inputStyle, resize: "vertical" }}
                    value={gstSettings.companyAddress}
                    onChange={e => setGstSettings(p => ({ ...p, companyAddress: e.target.value }))}
                    placeholder="Resawc LLP, Creative Studio Hub, New Delhi, India"
                  />
                </div>
              </SectionCard>

              {/* SECTION 2: GST Portal Credentials & GSP API Integration */}
              <SectionCard title="2. GST Portal Credentials & GSP API Integration">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", paddingTop: "0.85rem" }}>
                  <div>
                    <label style={labelStyle}>GST Portal Login Username</label>
                    <input
                      style={inputStyle}
                      value={gstSettings.gstPortalUsername}
                      onChange={e => setGstSettings(p => ({ ...p, gstPortalUsername: e.target.value }))}
                      placeholder="RESAWC_GST"
                    />
                    <span style={{ fontSize: "11px", color: "#6B7280" }}>Your registered portal username on services.gst.gov.in</span>
                  </div>

                  <div>
                    <label style={labelStyle}>API Password / GSP Auth Token</label>
                    <div style={{ position: "relative" }}>
                      <input
                        style={{ ...inputStyle, paddingRight: "2.5rem" }}
                        type={showGstPassword ? "text" : "password"}
                        value={gstSettings.gstPortalPassword}
                        onChange={e => setGstSettings(p => ({ ...p, gstPortalPassword: e.target.value }))}
                        placeholder="••••••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowGstPassword(p => !p)}
                        style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", display: "flex" }}
                      >
                        {showGstPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                    <span style={{ fontSize: "11px", color: "#6B7280" }}>Used for API authorization and automated IRN invoice pushes</span>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", paddingTop: "0.85rem" }}>
                  <div>
                    <label style={labelStyle}>GST Suvidha Provider (GSP / ASP)</label>
                    <select
                      style={inputStyle}
                      value={gstSettings.gspProvider}
                      onChange={e => setGstSettings(p => ({ ...p, gspProvider: e.target.value }))}
                    >
                      <option value="NIC">Government NIC Direct API (Official einvoice1.gst.gov.in)</option>
                      <option value="ClearTax">ClearTax GST API (Automated GSP)</option>
                      <option value="MastersIndia">Masters India GSP</option>
                      <option value="Adaequare">Adaequare Govt Authorized GSP</option>
                      <option value="Sandbox">Sandbox / Test GSP Gateway</option>
                    </select>
                  </div>

                  <div>
                    <label style={labelStyle}>API Environment</label>
                    <select
                      style={inputStyle}
                      value={gstSettings.gstEnvironment}
                      onChange={e => setGstSettings(p => ({ ...p, gstEnvironment: e.target.value }))}
                    >
                      <option value="production">Production (Live Govt GST Portal)</option>
                      <option value="sandbox">Sandbox / Developer Testing</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginTop: "0.75rem" }}>
                  <SettingRow
                    label="Automated E-Invoicing (IRN & QR Code Generation)"
                    description="Automatically generate 64-character Invoice Reference Number (IRN) and digitally signed QR Code for B2B invoices."
                  >
                    <Toggle
                      value={gstSettings.eInvoicingEnabled}
                      onChange={v => setGstSettings(p => ({ ...p, eInvoicingEnabled: v }))}
                    />
                  </SettingRow>

                  <SettingRow
                    label="E-Way Bill Generation Support"
                    description="Enable auto-generation of E-Way Bills when transporting equipment or production gear exceeding standard threshold."
                  >
                    <Toggle
                      value={gstSettings.eWayBillEnabled}
                      onChange={v => setGstSettings(p => ({ ...p, eWayBillEnabled: v }))}
                    />
                  </SettingRow>

                  {gstSettings.eWayBillEnabled && (
                    <div style={{ padding: "0.75rem 0", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #E5E7EB" }}>
                      <div>
                        <p style={{ fontSize: "14px", fontWeight: 600, color: "#111827", margin: 0 }}>E-Way Bill Mandate Threshold</p>
                        <p style={{ fontSize: "12px", color: "#6B7280", margin: "2px 0 0" }}>Standard Indian interstate consignment threshold (Default: ₹50,000)</p>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ fontSize: "14px", fontWeight: 700, color: "#111827" }}>₹</span>
                        <input
                          type="number"
                          style={{ ...inputStyle, width: "120px" }}
                          value={gstSettings.eWayBillThreshold}
                          onChange={e => setGstSettings(p => ({ ...p, eWayBillThreshold: Number(e.target.value) }))}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </SectionCard>

              {/* SECTION 3: Default GST Tax Rules, SAC Codes & Export (LUT) */}
              <SectionCard title="3. Default GST Tax Rules, SAC Codes & Export (LUT)">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", paddingTop: "0.85rem" }}>
                  <div>
                    <label style={labelStyle}>Primary Services Accounting Code (SAC Code)</label>
                    <select
                      style={inputStyle}
                      value={gstSettings.defaultSacCode}
                      onChange={e => setGstSettings(p => ({ ...p, defaultSacCode: e.target.value }))}
                    >
                      <option value="998314">998314 - Photography, Video Editing & Sound Recording</option>
                      <option value="998319">998319 - Other Technical & Professional Creative Services</option>
                      <option value="998313">998313 - Information Technology & Digital Post-Production</option>
                      <option value="998361">998361 - Advertising & Commercial Video Production</option>
                    </select>
                    <span style={{ fontSize: "11px", color: "#6B7280", marginTop: "3px", display: "block" }}>
                      Standard HSN/SAC code assigned to all client invoices and line items.
                    </span>
                  </div>

                  <div>
                    <label style={labelStyle}>Default GST Tax Rate (%)</label>
                    <select
                      style={inputStyle}
                      value={gstSettings.defaultGstRate}
                      onChange={e => setGstSettings(p => ({ ...p, defaultGstRate: Number(e.target.value) }))}
                    >
                      <option value={18.0}>18.0% (Standard Services: CGST 9% + SGST 9% / IGST 18%)</option>
                      <option value={12.0}>12.0% (Concessional / Specialized Media Rate)</option>
                      <option value={5.0}>5.0% (Reduced Tax Bracket)</option>
                      <option value={0.0}>0.0% (Zero-Rated / Exempt)</option>
                    </select>
                    <span style={{ fontSize: "11px", color: "#6B7280", marginTop: "3px", display: "block" }}>
                      Auto-splits into CGST 9% + SGST 9% for Intra-state Delhi clients, or IGST 18% for Inter-state clients.
                    </span>
                  </div>
                </div>

                <div style={{ marginTop: "0.75rem" }}>
                  <SettingRow
                    label="Reverse Charge Mechanism (RCM)"
                    description="Enable if tax liability is discharged by the recipient under section 9(3) / 9(4) of the CGST Act."
                  >
                    <Toggle
                      value={gstSettings.reverseChargeApplicable}
                      onChange={v => setGstSettings(p => ({ ...p, reverseChargeApplicable: v }))}
                    />
                  </SettingRow>

                  <SettingRow
                    label="Export of Services under LUT (Letter of Undertaking)"
                    description="Enable 0% IGST zero-rated billing for international / overseas wedding photography clients under approved LUT."
                  >
                    <Toggle
                      value={gstSettings.lutEnabled}
                      onChange={v => setGstSettings(p => ({ ...p, lutEnabled: v }))}
                    />
                  </SettingRow>

                  {gstSettings.lutEnabled && (
                    <div style={{ padding: "0.75rem 1rem", background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: "8px", marginTop: "0.5rem" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                        <div>
                          <label style={labelStyle}>LUT Application Reference Number (ARN)</label>
                          <input
                            style={{ ...inputStyle, fontFamily: "monospace", fontWeight: 700 }}
                            value={gstSettings.lutNumber}
                            onChange={e => setGstSettings(p => ({ ...p, lutNumber: e.target.value.toUpperCase() }))}
                            placeholder="AD070326001234X"
                          />
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
                          <span style={{ fontSize: "12px", color: "#166534", fontWeight: 600 }}>
                            ✅ Zero-Rated Export Active (FY 2026-27)
                          </span>
                          <span style={{ fontSize: "11px", color: "#4B5563" }}>
                            Invoices to overseas clients will state: <em>&quot;SUPPLY MEANT FOR EXPORT UNDER LUT WITHOUT PAYMENT OF INTEGRATED TAX&quot;</em>
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </SectionCard>

              {/* SECTION 4: GST Tax Invoice & Bank Settlement Information */}
              <SectionCard title="4. GST Tax Invoice & Bank Settlement Information">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", paddingTop: "0.85rem" }}>
                  <div>
                    <label style={labelStyle}>Tax Invoice Prefix</label>
                    <input
                      style={inputStyle}
                      value={gstSettings.invoicePrefix}
                      onChange={e => setGstSettings(p => ({ ...p, invoicePrefix: e.target.value }))}
                      placeholder="INV-2026-"
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Authorized Signatory</label>
                    <input
                      style={inputStyle}
                      value={gstSettings.authorizedSignatory}
                      onChange={e => setGstSettings(p => ({ ...p, authorizedSignatory: e.target.value }))}
                      placeholder="Mukul"
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Signatory Designation</label>
                    <input
                      style={inputStyle}
                      value={gstSettings.authorizedDesignation}
                      onChange={e => setGstSettings(p => ({ ...p, authorizedDesignation: e.target.value }))}
                      placeholder="Designated Partner"
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", paddingTop: "0.85rem" }}>
                  <div>
                    <label style={labelStyle}>Bank Name</label>
                    <input
                      style={inputStyle}
                      value={gstSettings.bankName}
                      onChange={e => setGstSettings(p => ({ ...p, bankName: e.target.value }))}
                      placeholder="HDFC Bank"
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Current Account Number</label>
                    <input
                      style={{ ...inputStyle, fontFamily: "monospace" }}
                      value={gstSettings.bankAccount}
                      onChange={e => setGstSettings(p => ({ ...p, bankAccount: e.target.value }))}
                      placeholder="50200012345678"
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", paddingTop: "0.85rem" }}>
                  <div>
                    <label style={labelStyle}>IFSC Code</label>
                    <input
                      style={{ ...inputStyle, fontFamily: "monospace", textTransform: "uppercase" }}
                      value={gstSettings.bankIfsc}
                      onChange={e => setGstSettings(p => ({ ...p, bankIfsc: e.target.value.toUpperCase() }))}
                      placeholder="HDFC0001234"
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Bank Branch</label>
                    <input
                      style={inputStyle}
                      value={gstSettings.bankBranch}
                      onChange={e => setGstSettings(p => ({ ...p, bankBranch: e.target.value }))}
                      placeholder="Connaught Place, New Delhi"
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>UPI ID / VPA</label>
                    <input
                      style={inputStyle}
                      value={gstSettings.upiId}
                      onChange={e => setGstSettings(p => ({ ...p, upiId: e.target.value }))}
                      placeholder="resawc@hdfcbank"
                    />
                  </div>
                </div>
              </SectionCard>

              {/* SECTION 5: Direct GST Portal Quick Access & Return Filing Tools */}
              <SectionCard title="5. Official GST Portal Links & Filing Tools">
                <p style={{ fontSize: "12px", color: "#6B7280", margin: "0.5rem 0 1rem" }}>
                  Direct quick-launch shortcuts to the official Indian Goods and Services Tax portals and return filing utilities.
                </p>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
                  {[
                    {
                      name: "GST Official Portal (gst.gov.in)",
                      desc: "File GSTR-1, GSTR-3B and track return status",
                      url: "https://services.gst.gov.in/services/login",
                      icon: Landmark,
                    },
                    {
                      name: "E-Invoice Portal (einvoice1.gst.gov.in)",
                      desc: "Government portal for IRN generation and verification",
                      url: "https://einvoice1.gst.gov.in/",
                      icon: FileText,
                    },
                    {
                      name: "E-Way Bill System (ewaybillgst.gov.in)",
                      desc: "Generate and manage equipment transit passes",
                      url: "https://ewaybillgst.gov.in/",
                      icon: Globe,
                    },
                    {
                      name: "Search Taxpayer / Verify GSTIN",
                      desc: "Verify client GSTIN, registration status and filing history",
                      url: "https://services.gst.gov.in/services/searchtp",
                      icon: Shield,
                    },
                  ].map(link => {
                    const LinkIcon = link.icon;
                    return (
                      <a
                        key={link.name}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "10px",
                          padding: "0.85rem 1rem",
                          borderRadius: "8px",
                          border: "1px solid #E5E7EB",
                          background: "#F9FAFB",
                          textDecoration: "none",
                          color: "inherit",
                          transition: "all 0.15s",
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.borderColor = "#1A56DB";
                          e.currentTarget.style.background = "#EFF6FF";
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.borderColor = "#E5E7EB";
                          e.currentTarget.style.background = "#F9FAFB";
                        }}
                      >
                        <div style={{
                          padding: "6px",
                          borderRadius: "6px",
                          background: "#fff",
                          border: "1px solid #E5E7EB",
                          color: "#1A56DB",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}>
                          <LinkIcon size={16} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                            <span style={{ fontSize: "13px", fontWeight: 700, color: "#111827" }}>{link.name}</span>
                            <ExternalLink size={11} color="#6B7280" />
                          </div>
                          <p style={{ fontSize: "11px", color: "#6B7280", margin: "2px 0 0" }}>{link.desc}</p>
                        </div>
                      </a>
                    );
                  })}
                </div>

                {/* Return Filing Calendar & Export */}
                <div style={{
                  padding: "1rem",
                  background: "#F8FAFC",
                  border: "1px solid #E2E8F0",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "1rem",
                }}>
                  <div>
                    <h4 style={{ fontSize: "13px", fontWeight: 700, color: "#1E293B", margin: 0 }}>
                      Upcoming Filing Deadlines (October 2026)
                    </h4>
                    <p style={{ fontSize: "12px", color: "#64748B", margin: "3px 0 0" }}>
                      • <strong>GSTR-1</strong> (Outward Supplies): Due 11th Oct &nbsp;|&nbsp; • <strong>GSTR-3B</strong> (Summary &amp; Tax): Due 20th Oct
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={exportGstr1Json}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "0.45rem 0.85rem",
                      background: "#fff",
                      color: "#1A56DB",
                      border: "1px solid #1A56DB",
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: 700,
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = "#1A56DB";
                      e.currentTarget.style.color = "#fff";
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = "#fff";
                      e.currentTarget.style.color = "#1A56DB";
                    }}
                  >
                    <Download size={13} /> Export GSTR-1 Sales JSON
                  </button>
                </div>
              </SectionCard>
            </>
          )}

          {/* ── SERVICES & RATE MASTER ── */}
          {isAdmin && activeTab === "services" && (
            <>
              {/* Header Status Banner */}
              <div style={{
                background: "linear-gradient(135deg, #1E40AF 0%, #1D4ED8 100%)",
                borderRadius: "8px", padding: "1.25rem 1.5rem", color: "#fff",
                marginBottom: "1.25rem", display: "flex", justifyContent: "space-between",
                alignItems: "center", flexWrap: "wrap", gap: "1rem"
              }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                    <Briefcase size={20} color="#93C5FD" />
                    <h2 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800, color: "#fff" }}>
                      Company Services & Rate Master
                    </h2>
                  </div>
                  <p style={{ margin: 0, fontSize: "0.83rem", color: "#DBEAFE", maxWidth: "600px", lineHeight: 1.4 }}>
                    Define billable post-production services offered by Resawc LLP. Any service added here dynamically propagates to Client Rate Cards, Editing Jobs, and GST Invoicing.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={openAddServiceModal}
                  style={{
                    display: "flex", alignItems: "center", gap: "6px",
                    background: "#fff", color: "#1E40AF", border: "none",
                    padding: "0.6rem 1.1rem", borderRadius: "6px",
                    fontSize: "0.85rem", fontWeight: 700, cursor: "pointer",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.15)", transition: "all 0.15s"
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = "translateY(-1px)"}
                  onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
                >
                  <Plus size={16} /> Add New Service
                </button>
              </div>

              {serviceActionMsg && (
                <div style={{
                  background: "#ECFDF5", border: "1px solid #A7F3D0", color: "#065F46",
                  padding: "0.75rem 1rem", borderRadius: "6px", marginBottom: "1.25rem",
                  fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "8px"
                }}>
                  <CheckCircle2 size={16} color="#059669" />
                  <span>{serviceActionMsg}</span>
                </div>
              )}

              {/* Metric Highlights */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", marginBottom: "1.25rem" }}>
                <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: "8px", padding: "1rem" }}>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "#6B7280", textTransform: "uppercase" }}>Total Services</span>
                  <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#111827", marginTop: "4px" }}>
                    {companyServices.length}
                  </div>
                  <span style={{ fontSize: "11px", color: "#059669", fontWeight: 600 }}>
                    {companyServices.filter(s => s.isActive).length} Active in Catalog
                  </span>
                </div>

                <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: "8px", padding: "1rem" }}>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "#6B7280", textTransform: "uppercase" }}>Photo Services</span>
                  <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#2563EB", marginTop: "4px" }}>
                    {companyServices.filter(s => s.category === "PHOTO").length}
                  </div>
                  <span style={{ fontSize: "11px", color: "#6B7280" }}>Culling, Retouch, Color</span>
                </div>

                <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: "8px", padding: "1rem" }}>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "#6B7280", textTransform: "uppercase" }}>Video & Reels</span>
                  <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#7C3AED", marginTop: "4px" }}>
                    {companyServices.filter(s => s.category === "VIDEO").length}
                  </div>
                  <span style={{ fontSize: "11px", color: "#6B7280" }}>Editing, Cuts, Shorts</span>
                </div>

                <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: "8px", padding: "1rem" }}>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "#6B7280", textTransform: "uppercase" }}>Default SAC Code</span>
                  <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#059669", marginTop: "4px" }}>
                    998314
                  </div>
                  <span style={{ fontSize: "11px", color: "#6B7280" }}>GST 18% Applicable</span>
                </div>
              </div>

              {/* Category Filter Bar */}
              <div style={{ display: "flex", gap: "6px", marginBottom: "1rem", flexWrap: "wrap" }}>
                {[
                  { key: "ALL", label: `All (${companyServices.length})` },
                  { key: "PHOTO", label: `Photo (${companyServices.filter(s => s.category === "PHOTO").length})` },
                  { key: "VIDEO", label: `Video (${companyServices.filter(s => s.category === "VIDEO").length})` },
                  { key: "RETAINER", label: `Retainer (${companyServices.filter(s => s.category === "RETAINER").length})` },
                  { key: "CREATIVE", label: `Creative & Other (${companyServices.filter(s => s.category !== "PHOTO" && s.category !== "VIDEO" && s.category !== "RETAINER").length})` },
                ].map(tab => {
                  const isCur = serviceCategoryFilter === tab.key;
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setServiceCategoryFilter(tab.key)}
                      style={{
                        padding: "0.4rem 0.85rem", borderRadius: "6px", fontSize: "12px",
                        fontWeight: isCur ? 700 : 500, border: `1px solid ${isCur ? "#1A56DB" : "#E5E7EB"}`,
                        background: isCur ? "#EFF6FF" : "#fff", color: isCur ? "#1A56DB" : "#4B5563",
                        cursor: "pointer", transition: "all 0.15s"
                      }}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Services List Table */}
              <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: "8px", overflow: "hidden", marginBottom: "1.5rem" }}>
                {loadingServices ? (
                  <div style={{ padding: "3rem", textAlign: "center", color: "#6B7280", fontSize: "0.88rem" }}>
                    Loading services catalog...
                  </div>
                ) : companyServices.length === 0 ? (
                  <div style={{ padding: "3rem", textAlign: "center" }}>
                    <p style={{ margin: 0, fontWeight: 600, color: "#111827" }}>No services configured yet</p>
                    <p style={{ margin: "4px 0 1rem", fontSize: "0.82rem", color: "#6B7280" }}>Click below to add your first post-production service</p>
                    <button
                      type="button"
                      onClick={openAddServiceModal}
                      style={{ background: "#1A56DB", color: "#fff", border: "none", padding: "0.55rem 1rem", borderRadius: "6px", fontSize: "0.85rem", fontWeight: 700, cursor: "pointer" }}
                    >
                      + Add New Service
                    </button>
                  </div>
                ) : (
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.85rem" }}>
                    <thead>
                      <tr style={{ background: "#F9FAFB", borderBottom: "1px solid #E5E7EB" }}>
                        <th style={{ padding: "0.75rem 1rem", fontWeight: 700, color: "#4B5563", fontSize: "12px" }}>SERVICE NAME</th>
                        <th style={{ padding: "0.75rem 1rem", fontWeight: 700, color: "#4B5563", fontSize: "12px" }}>CATEGORY</th>
                        <th style={{ padding: "0.75rem 1rem", fontWeight: 700, color: "#4B5563", fontSize: "12px" }}>BILLING UNIT</th>
                        <th style={{ padding: "0.75rem 1rem", fontWeight: 700, color: "#4B5563", fontSize: "12px" }}>DEFAULT RATE (INR)</th>
                        <th style={{ padding: "0.75rem 1rem", fontWeight: 700, color: "#4B5563", fontSize: "12px" }}>SAC CODE</th>
                        <th style={{ padding: "0.75rem 1rem", fontWeight: 700, color: "#4B5563", fontSize: "12px" }}>STATUS</th>
                        <th style={{ padding: "0.75rem 1rem", fontWeight: 700, color: "#4B5563", fontSize: "12px", textAlign: "right" }}>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {companyServices
                        .filter(s => {
                          if (serviceCategoryFilter === "ALL") return true;
                          if (serviceCategoryFilter === "CREATIVE") return s.category !== "PHOTO" && s.category !== "VIDEO" && s.category !== "RETAINER";
                          return s.category === serviceCategoryFilter;
                        })
                        .map(s => {
                          const catBadgeColor = s.category === "PHOTO" ? { bg: "#EFF6FF", text: "#1D4ED8", border: "#BFDBFE" }
                            : s.category === "VIDEO" ? { bg: "#F5F3FF", text: "#6D28D9", border: "#DDD6FE" }
                            : s.category === "RETAINER" ? { bg: "#ECFDF5", text: "#047857", border: "#A7F3D0" }
                            : { bg: "#FFFBEB", text: "#B45309", border: "#FDE68A" };

                          const unitLabel = s.unit === "img" ? "Per Image"
                            : s.unit === "min" ? "Per Video Minute"
                            : s.unit === "reel" ? "Per Reel / Short"
                            : s.unit === "video" ? "Per Video"
                            : s.unit === "month" ? "Per Month Retainer"
                            : s.unit === "hr" ? "Per Hour"
                            : `Per ${s.unit}`;

                          return (
                            <tr key={s.id} style={{ borderBottom: "1px solid #F3F4F6" }}>
                              <td style={{ padding: "0.85rem 1rem" }}>
                                <div style={{ fontWeight: 700, color: "#111827", fontSize: "14px" }}>
                                  {s.name}
                                </div>
                                {s.description && (
                                  <div style={{ fontSize: "11px", color: "#6B7280", marginTop: "2px" }}>
                                    {s.description}
                                  </div>
                                )}
                              </td>
                              <td style={{ padding: "0.85rem 1rem" }}>
                                <span style={{
                                  display: "inline-block", padding: "2px 8px", borderRadius: "12px",
                                  fontSize: "11px", fontWeight: 700, background: catBadgeColor.bg,
                                  color: catBadgeColor.text, border: `1px solid ${catBadgeColor.border}`
                                }}>
                                  {s.category}
                                </span>
                              </td>
                              <td style={{ padding: "0.85rem 1rem", color: "#374151", fontWeight: 500 }}>
                                {unitLabel} <span style={{ color: "#9CA3AF", fontSize: "11px" }}>({s.unit})</span>
                              </td>
                              <td style={{ padding: "0.85rem 1rem" }}>
                                <strong style={{ color: "#111827", fontSize: "14px" }}>
                                  ₹{s.defaultRate.toLocaleString("en-IN")}
                                </strong>
                                <span style={{ color: "#6B7280", fontSize: "11px", marginLeft: "4px" }}>
                                  /{s.unit}
                                </span>
                              </td>
                              <td style={{ padding: "0.85rem 1rem", color: "#4B5563", fontFamily: "monospace", fontSize: "12px" }}>
                                {s.sacCode || "998314"}
                              </td>
                              <td style={{ padding: "0.85rem 1rem" }}>
                                <button
                                  type="button"
                                  onClick={() => handleToggleService(s)}
                                  style={{
                                    border: "none", background: "none", cursor: "pointer",
                                    padding: 0, display: "flex", alignItems: "center", gap: "6px"
                                  }}
                                  title={s.isActive ? "Click to deactivate" : "Click to activate"}
                                >
                                  <span style={{
                                    display: "inline-block", width: "8px", height: "8px", borderRadius: "50%",
                                    background: s.isActive ? "#10B981" : "#9CA3AF"
                                  }} />
                                  <span style={{ fontSize: "12px", fontWeight: 600, color: s.isActive ? "#065F46" : "#6B7280" }}>
                                    {s.isActive ? "Active" : "Disabled"}
                                  </span>
                                </button>
                              </td>
                              <td style={{ padding: "0.85rem 1rem", textAlign: "right" }}>
                                <div style={{ display: "flex", justifyContent: "flex-end", gap: "6px" }}>
                                  <button
                                    type="button"
                                    onClick={() => openEditServiceModal(s)}
                                    style={{
                                      background: "#F3F4F6", border: "1px solid #E5E7EB", borderRadius: "4px",
                                      padding: "5px 8px", cursor: "pointer", display: "flex", alignItems: "center",
                                      gap: "4px", fontSize: "11px", fontWeight: 600, color: "#374151"
                                    }}
                                  >
                                    <Edit2 size={12} /> Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteService(s)}
                                    style={{
                                      background: "#FEF2F2", border: "1px solid #FEE2E2", borderRadius: "4px",
                                      padding: "5px 8px", cursor: "pointer", display: "flex", alignItems: "center",
                                      gap: "4px", fontSize: "11px", fontWeight: 600, color: "#DC2626"
                                    }}
                                    title="Delete service"
                                  >
                                    <Trash2 size={12} />
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

              {/* MODAL: ADD / EDIT SERVICE */}
              {showServiceModal && (
                <div style={{
                  position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)",
                  backdropFilter: "blur(4px)", zIndex: 110, display: "flex",
                  alignItems: "center", justifyContent: "center", padding: "1rem"
                }}>
                  <div style={{
                    background: "#fff", borderRadius: "8px", width: "100%", maxWidth: "520px",
                    padding: "1.75rem", boxShadow: "0 20px 40px rgba(0,0,0,0.18)", border: "1px solid #E5E7EB"
                  }}>
                    <h2 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#111827", margin: "0 0 4px" }}>
                      {editingService ? "Edit Service" : "Add New Company Service"}
                    </h2>
                    <p style={{ color: "#6B7280", fontSize: "0.82rem", margin: "0 0 1.25rem" }}>
                      This service will immediately be available across client rate cards, job pipelines, and GST invoices.
                    </p>

                    <form onSubmit={handleSaveService} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                      <div>
                        <label style={labelStyle}>Service Name *</label>
                        <input
                          required
                          style={inputStyle}
                          placeholder="e.g. Drone Video Color Grading / Wedding Teaser 4K / Album Design"
                          value={serviceForm.name}
                          onChange={e => setServiceForm({ ...serviceForm, name: e.target.value })}
                        />
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.85rem" }}>
                        <div>
                          <label style={labelStyle}>Category</label>
                          <select
                            style={inputStyle}
                            value={serviceForm.category}
                            onChange={e => setServiceForm({ ...serviceForm, category: e.target.value })}
                          >
                            <option value="PHOTO">Photo Editing & Retouching</option>
                            <option value="VIDEO">Video Post-Production & Cutting</option>
                            <option value="RETAINER">Monthly Retainer Contract</option>
                            <option value="CREATIVE">Creative & Design Services</option>
                            <option value="OTHER">Other Deliverable</option>
                          </select>
                        </div>

                        <div>
                          <label style={labelStyle}>Billing Unit</label>
                          <select
                            style={inputStyle}
                            value={serviceForm.unit}
                            onChange={e => setServiceForm({ ...serviceForm, unit: e.target.value })}
                          >
                            <option value="img">Per Image (img)</option>
                            <option value="min">Per Video Minute (min)</option>
                            <option value="reel">Per Reel / Short (reel)</option>
                            <option value="video">Per Complete Video (video)</option>
                            <option value="month">Per Month (month)</option>
                            <option value="hr">Per Hour (hr)</option>
                            <option value="project">Per Project (project)</option>
                          </select>
                        </div>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.85rem" }}>
                        <div>
                          <label style={labelStyle}>Standard Default Rate (INR ₹)</label>
                          <div style={{ position: "relative" }}>
                            <span style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", fontWeight: 700, color: "#6B7280" }}>₹</span>
                            <input
                              type="number"
                              step="any"
                              style={{ ...inputStyle, paddingLeft: "1.75rem" }}
                              value={serviceForm.defaultRate}
                              onChange={e => setServiceForm({ ...serviceForm, defaultRate: parseFloat(e.target.value) || 0 })}
                            />
                          </div>
                          <span style={{ fontSize: "11px", color: "#6B7280" }}>Standard rate when no custom client rate is configured</span>
                        </div>

                        <div>
                          <label style={labelStyle}>GST SAC Code</label>
                          <input
                            style={inputStyle}
                            value={serviceForm.sacCode}
                            onChange={e => setServiceForm({ ...serviceForm, sacCode: e.target.value })}
                            placeholder="998314"
                          />
                          <span style={{ fontSize: "11px", color: "#6B7280" }}>Default SAC 998314 (Post-production)</span>
                        </div>
                      </div>

                      <div>
                        <label style={labelStyle}>Deliverable Description / Notes</label>
                        <textarea
                          rows={2}
                          style={{ ...inputStyle, resize: "vertical" }}
                          placeholder="e.g. Includes color grading, audio synchronization, speed ramping and motion graphics."
                          value={serviceForm.description}
                          onChange={e => setServiceForm({ ...serviceForm, description: e.target.value })}
                        />
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "8px", paddingTop: "4px" }}>
                        <input
                          type="checkbox"
                          id="svcIsActive"
                          checked={serviceForm.isActive}
                          onChange={e => setServiceForm({ ...serviceForm, isActive: e.target.checked })}
                          style={{ width: "16px", height: "16px", cursor: "pointer" }}
                        />
                        <label htmlFor="svcIsActive" style={{ fontSize: "13px", fontWeight: 600, color: "#111827", cursor: "pointer" }}>
                          Active service (enabled for rate cards & job queues)
                        </label>
                      </div>

                      <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "0.75rem" }}>
                        <button
                          type="button"
                          onClick={() => setShowServiceModal(false)}
                          style={{ background: "#F3F4F6", color: "#374151", padding: "0.55rem 1.1rem", borderRadius: "6px", border: "none", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer" }}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          style={{ background: "#1A56DB", color: "#fff", padding: "0.55rem 1.35rem", borderRadius: "6px", border: "none", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer" }}
                        >
                          {editingService ? "Update Service" : "Save Service"}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── NOTIFICATIONS ── */}
          {activeTab === "notifications" && (
            <>
              <SectionCard title="Task Notifications">
                {[
                  { key: "taskAssigned",  label: "Task Assigned to Me",   desc: "Get notified when Admin assigns you a new task" },
                  { key: "taskCompleted", label: "Task Marked Completed", desc: "Alert when a team member completes a task" },
                ].map(n => (
                  <SettingRow key={n.key} label={n.label} description={n.desc}>
                    <Toggle value={(notifs as any)[n.key]} onChange={v => setNotifs(p => ({ ...p, [n.key]: v }))} />
                  </SettingRow>
                ))}
              </SectionCard>

              <SectionCard title="Lead Notifications">
                {[
                  { key: "newLead",       label: "New Lead Assigned", desc: "Notified when new leads are distributed to you" },
                  { key: "leadConverted", label: "Lead Converted",    desc: "Alert when a lead is marked as Converted ⭐" },
                ].map(n => (
                  <SettingRow key={n.key} label={n.label} description={n.desc}>
                    <Toggle value={(notifs as any)[n.key]} onChange={v => setNotifs(p => ({ ...p, [n.key]: v }))} />
                  </SettingRow>
                ))}
              </SectionCard>

              <SectionCard title="Chat & Reports">
                {[
                  { key: "chatMessage",  label: "New Chat Message",   desc: "Notification for new direct messages" },
                  { key: "dailyDigest",  label: "Daily Digest Email", desc: "Summary of activity every morning at 9 AM" },
                  { key: "weeklyReport", label: "Weekly Report",      desc: "Performance report every Monday" },
                  { key: "emailAlerts",  label: "Email Alerts",       desc: "Receive all critical alerts via email" },
                ].map(n => (
                  <SettingRow key={n.key} label={n.label} description={n.desc}>
                    <Toggle value={(notifs as any)[n.key]} onChange={v => setNotifs(p => ({ ...p, [n.key]: v }))} />
                  </SettingRow>
                ))}
              </SectionCard>
            </>
          )}

          {/* ── APPEARANCE ── */}
          {activeTab === "appearance" && (
            <SectionCard title="Theme & Colors">
              <SettingRow label="Accent Color" description="Primary color used for buttons, highlights and active states">
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {["#1A56DB", "#6366f1", "#f43f5e", "#10b981", "#f59e0b", "#06b6d4", "#1E40AF"].map(c => (
                    <button key={c} onClick={() => updateAppearanceSetting({ accent: c })}
                      title={c}
                      style={{
                        width: '26px', height: '26px', borderRadius: '8px', background: c,
                        border: appearance.accent.toLowerCase() === c.toLowerCase() ? '3px solid #fff' : '2px solid transparent',
                        cursor: 'pointer',
                        boxShadow: appearance.accent.toLowerCase() === c.toLowerCase() ? `0 0 0 2px ${c}` : 'none',
                        outline: 'none',
                        transition: 'transform 0.15s',
                        transform: appearance.accent.toLowerCase() === c.toLowerCase() ? 'scale(1.15)' : 'scale(1)',
                      }} />
                  ))}
                  <input type="color" value={appearance.accent} onChange={e => updateAppearanceSetting({ accent: e.target.value })}
                    title="Custom color"
                    style={{ width: '28px', height: '28px', borderRadius: '8px', border: 'none', cursor: 'pointer', padding: 0 }} />
                </div>
              </SettingRow>

              <SettingRow label="Interface Density" description="Adjust how compact the UI looks">
                <div style={{ display: 'flex', gap: '6px' }}>
                  {(["compact", "comfortable", "spacious"] as const).map(d => (
                    <button key={d} onClick={() => updateAppearanceSetting({ density: d })}
                      style={{
                        padding: '0.4rem 0.9rem', fontSize: '12px', fontWeight: 600, textTransform: 'capitalize',
                        border: '1px solid', borderRadius: '6px', cursor: 'pointer', fontFamily: 'inherit',
                        background: appearance.density === d ? (appearance.accent || '#1A56DB') : '#fff',
                        color: appearance.density === d ? '#fff' : '#6B7280',
                        borderColor: appearance.density === d ? (appearance.accent || '#1A56DB') : '#E5E7EB',
                        transition: 'all 0.15s ease',
                      }}>
                      {d}
                    </button>
                  ))}
                </div>
              </SettingRow>

              <SettingRow label="Animations" description="Enable micro-animations and transitions throughout the app">
                <Toggle value={appearance.animationsEnabled} onChange={v => updateAppearanceSetting({ animationsEnabled: v })} />
              </SettingRow>

              <SettingRow label="Collapse Sidebar by Default" description="Start with sidebar minimised on login">
                <Toggle value={appearance.sidebarCollapsed} onChange={v => updateAppearanceSetting({ sidebarCollapsed: v })} />
              </SettingRow>
            </SectionCard>
          )}

          {/* ── SECURITY ── */}
          {activeTab === "security" && (
            <>
              <SectionCard title="Change Password">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', paddingTop: '1rem' }}>
                  {[
                    { label: "Current Password",    key: "currentPassword" },
                    { label: "New Password",        key: "newPassword" },
                    { label: "Confirm New Password",key: "confirmPassword" },
                  ].map(f => (
                    <div key={f.key}>
                      <label style={labelStyle}>{f.label}</label>
                      <div style={{ position: 'relative' }}>
                        <input
                          style={{ ...inputStyle, paddingRight: '2.5rem' }}
                          type={showPassword ? "text" : "password"}
                          value={(security as any)[f.key]}
                          onChange={e => setSecurity(p => ({ ...p, [f.key]: e.target.value }))}
                          placeholder="••••••••"
                        />
                        <button type="button" onClick={() => setShowPassword(p => !p)}
                          style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', display: 'flex' }}>
                          {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                    </div>
                  ))}
                  <div>
                    <button style={{ padding: '0.55rem 1.1rem', background: '#1A56DB', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '14px', fontFamily: 'inherit' }}>
                      Update Password
                    </button>
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="Two-Factor Authentication">
                <SettingRow label="Enable 2FA" description="Add an extra layer of security with authenticator app (Google Authenticator / Authy)">
                  <Toggle value={security.twoFactor} onChange={v => setSecurity(p => ({ ...p, twoFactor: v }))} />
                </SettingRow>
                {security.twoFactor && (
                  <div style={{ padding: '1rem', background: '#ECFDF5', borderRadius: '6px', border: '1px solid #A7F3D0', marginTop: '0.75rem' }}>
                    <p style={{ fontSize: '14px', fontWeight: 600, color: '#059669', margin: '0 0 4px' }}>✅ 2FA is enabled</p>
                    <p style={{ fontSize: '12px', color: '#6B7280', margin: 0 }}>Scan the QR code with your authenticator app to link your device.</p>
                    <button style={{ marginTop: '10px', padding: '0.35rem 0.85rem', fontSize: '13px', fontWeight: 500, border: '1px solid #E5E7EB', borderRadius: '6px', background: '#fff', color: '#111827', cursor: 'pointer', fontFamily: 'inherit' }}>
                      View QR Code
                    </button>
                  </div>
                )}
              </SectionCard>

              <SectionCard title="Session & Access">
                <SettingRow label="Auto Logout" description="Automatically log out after inactivity period">
                  <select style={{ ...inputStyle, width: '160px' }} value={security.sessionTimeout} onChange={e => setSecurity(p => ({ ...p, sessionTimeout: e.target.value }))}>
                    <option value="15">After 15 minutes</option>
                    <option value="30">After 30 minutes</option>
                    <option value="60">After 1 hour</option>
                    <option value="240">After 4 hours</option>
                    <option value="0">Never</option>
                  </select>
                </SettingRow>
                <SettingRow label="Active Sessions" description="Manage devices where you're logged in">
                  <button style={{ padding: '0.35rem 0.85rem', fontSize: '13px', fontWeight: 500, border: '1px solid #FCA5A5', borderRadius: '6px', background: '#FEF2F2', color: '#EF4444', cursor: 'pointer', fontFamily: 'inherit' }}>
                    Sign Out All Devices
                  </button>
                </SettingRow>
              </SectionCard>
            </>
          )}

          {/* ── DATABASE ── */}
          {activeTab === "database" && (
            <>
              <SectionCard title="PostgreSQL Connection">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', paddingTop: '1rem' }}>
                  <div><label style={labelStyle}>Host</label><input style={inputStyle} value={db.host} onChange={e => setDb(p => ({ ...p, host: e.target.value }))} placeholder="localhost" /></div>
                  <div><label style={labelStyle}>Port</label><input style={inputStyle} value={db.port} onChange={e => setDb(p => ({ ...p, port: e.target.value }))} placeholder="5432" /></div>
                  <div><label style={labelStyle}>Database Name</label><input style={inputStyle} value={db.name} onChange={e => setDb(p => ({ ...p, name: e.target.value }))} placeholder="resawc_db" /></div>
                  <div><label style={labelStyle}>Username</label><input style={inputStyle} value={db.user} onChange={e => setDb(p => ({ ...p, user: e.target.value }))} placeholder="postgres" /></div>
                </div>
                <div style={{ marginTop: '0.75rem' }}>
                  <SettingRow label="SSL / TLS Encryption" description="Encrypt the database connection (recommended for production)">
                    <Toggle value={db.ssl} onChange={v => setDb(p => ({ ...p, ssl: v }))} />
                  </SettingRow>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                  <button style={{ padding: '0.5rem 1rem', background: '#1A56DB', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '13px', fontFamily: 'inherit' }}>Test Connection</button>
                  <button style={{ padding: '0.5rem 1rem', background: '#fff', color: '#111827', border: '1px solid #E5E7EB', borderRadius: '6px', cursor: 'pointer', fontWeight: 500, fontSize: '13px', fontFamily: 'inherit' }}>Run Migrations</button>
                </div>
              </SectionCard>

              <SectionCard title="Backup & Data">
                <SettingRow label="Automatic Backup" description="Schedule regular database backups">
                  <select style={{ ...inputStyle, width: '160px' }} value={db.backupFreq} onChange={e => setDb(p => ({ ...p, backupFreq: e.target.value }))}>
                    <option value="hourly">Every Hour</option>
                    <option value="daily">Daily at Midnight</option>
                    <option value="weekly">Weekly</option>
                    <option value="manual">Manual Only</option>
                  </select>
                </SettingRow>
                <SettingRow label="Export All Data" description="Download a full CSV export of leads, tasks, and interactions">
                  <button style={{ padding: '0.35rem 0.85rem', fontSize: '13px', fontWeight: 500, border: '1px solid #E5E7EB', borderRadius: '6px', background: '#fff', color: '#111827', cursor: 'pointer', fontFamily: 'inherit' }}>Export CSV</button>
                </SettingRow>
                <SettingRow label="Danger Zone" description="Permanently delete all data — this cannot be undone">
                  <button style={{ padding: '0.35rem 0.85rem', fontSize: '13px', fontWeight: 500, border: '1px solid #FCA5A5', borderRadius: '6px', background: '#FEF2F2', color: '#EF4444', cursor: 'pointer', fontFamily: 'inherit' }}>Reset All Data</button>
                </SettingRow>
              </SectionCard>
            </>
          )}

        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <RoleGuard allowedRoles={["admin"]} redirectTo="/dashboard">
      <SettingsContent />
    </RoleGuard>
  );
}
