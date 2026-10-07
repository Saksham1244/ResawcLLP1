"use client";

import { useState, useEffect } from "react";
import {
  Calendar, Clock, CheckCircle2, Phone, Mail, FileText, Sparkles,
  Plus, X, AlertCircle, ChevronRight, Check
} from "lucide-react";
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

const ACTION_ICONS: Record<string, any> = {
  CALL: Phone,
  EMAIL: Mail,
  QUOTATION: FileText,
  TRIAL_FOLLOWUP: Sparkles,
  MEETING: Calendar,
};

const ACTION_COLORS: Record<string, { bg: string; color: string }> = {
  CALL:           { bg: "#EFF6FF", color: "#1D4ED8" },
  EMAIL:          { bg: "#F0FDF4", color: "#15803D" },
  QUOTATION:      { bg: "#FFF7ED", color: "#C2410C" },
  TRIAL_FOLLOWUP: { bg: "#FAF5FF", color: "#7C3AED" },
  MEETING:        { bg: "#FEF2F2", color: "#B91C1C" },
};

export function MarketingFollowUpsWidget() {
  const { user } = useRole();
  const isAdmin = user?.role === "admin";

  const [followUps, setFollowUps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterToday, setFilterToday] = useState(true);

  // New follow-up modal
  const [showModal, setShowModal] = useState(false);
  const [leads, setLeads] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);

  const [form, setForm] = useState({
    title: "",
    actionType: "CALL",
    leadId: "",
    clientId: "",
    dueDate: new Date().toISOString().split("T")[0],
    dueTime: "11:00 AM",
    priority: "HIGH",
  });
  const [saving, setSaving] = useState(false);

  // Complete modal
  const [completeTarget, setCompleteTarget] = useState<any>(null);
  const [outcomeNotes, setOutcomeNotes] = useState("");
  const [scheduleNext, setScheduleNext] = useState(false);
  const [nextTitle, setNextTitle] = useState("");
  const [nextDate, setNextDate] = useState(
    new Date(Date.now() + 86400000 * 2).toISOString().split("T")[0]
  );
  const [nextTime, setNextTime] = useState("02:00 PM");

  const fetchFollowUps = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const url = new URL("/api/followups", window.location.origin);
      if (!isAdmin) url.searchParams.set("userId", user.id);
      if (filterToday) url.searchParams.set("todayOnly", "true");

      const res = await fetch(url.toString());
      const data = await res.json();
      if (data.success) {
        setFollowUps(data.data);
      }
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  const fetchTargets = async () => {
    try {
      const [lRes, cRes] = await Promise.all([
        fetch("/api/leads"),
        fetch("/api/clients"),
      ]);
      const lData = await lRes.json();
      const cData = await cRes.json();
      if (lData.success) setLeads(lData.data || []);
      if (cData.success) setClients(cData.data || []);
    } catch {}
  };

  useEffect(() => {
    fetchFollowUps();
  }, [user, filterToday]);

  useEffect(() => {
    fetchTargets();
  }, []);

  const handleCreateFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !user?.id) return;
    setSaving(true);
    try {
      const res = await fetch("/api/followups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          assignedToId: user.id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowModal(false);
        setForm({
          title: "",
          actionType: "CALL",
          leadId: "",
          clientId: "",
          dueDate: new Date().toISOString().split("T")[0],
          dueTime: "11:00 AM",
          priority: "HIGH",
        });
        fetchFollowUps();
      }
    } catch {} finally {
      setSaving(false);
    }
  };

  const handleCompleteFollowUp = async () => {
    if (!completeTarget) return;
    try {
      const body: any = {
        id: completeTarget.id,
        status: "COMPLETED",
        outcomeNotes,
      };

      if (scheduleNext && nextTitle && nextDate) {
        body.nextFollowUp = {
          title: nextTitle,
          dueDate: nextDate,
          dueTime: nextTime,
          actionType: completeTarget.actionType,
        };
      }

      const res = await fetch("/api/followups", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        setCompleteTarget(null);
        setOutcomeNotes("");
        setScheduleNext(false);
        fetchFollowUps();
      }
    } catch {}
  };

  return (
    <div style={{
      background: C.card,
      borderRadius: C.radius,
      border: `1px solid ${C.border}`,
      padding: "1.25rem 1.5rem",
      fontFamily: "Inter, sans-serif",
    }}>
      {/* Top row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <div>
          <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: C.text, margin: 0, display: "flex", alignItems: "center", gap: "6px" }}>
            <Clock size={16} color={C.primary} /> Today's Marketing Follow-ups
          </h3>
          <p style={{ fontSize: "0.8rem", color: C.muted, margin: "2px 0 0" }}>
            Scheduled calls, quotations & client check-ins
          </p>
        </div>

        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <button
            onClick={() => setFilterToday(t => !t)}
            style={{
              background: filterToday ? "#EFF6FF" : "transparent",
              color: filterToday ? C.primary : C.muted,
              border: filterToday ? "1px solid #BFDBFE" : `1px solid ${C.border}`,
              padding: "0.3rem 0.65rem", borderRadius: "999px", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer"
            }}
          >
            {filterToday ? "Showing: Today Only" : "Showing: All Pending"}
          </button>

          <button
            onClick={() => setShowModal(true)}
            style={{
              background: C.primary, color: "#fff", border: "none",
              borderRadius: C.radiusSm, padding: "0.35rem 0.75rem",
              fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px"
            }}
          >
            <Plus size={14} /> New Follow-up
          </button>
        </div>
      </div>

      {/* Follow-ups List */}
      {loading ? (
        <div style={{ padding: "1.5rem", textAlign: "center", color: C.muted, fontSize: "0.85rem" }}>
          Loading scheduled follow-ups...
        </div>
      ) : followUps.length === 0 ? (
        <div style={{ padding: "1.75rem", textAlign: "center", background: "#F8FAFC", borderRadius: C.radiusSm }}>
          <CheckCircle2 size={24} color="#10B981" style={{ margin: "0 auto 6px" }} />
          <div style={{ fontSize: "0.875rem", fontWeight: 600, color: C.text }}>All follow-ups caught up!</div>
          <div style={{ fontSize: "0.75rem", color: C.muted, marginTop: "2px" }}>
            No pending calls or quotations scheduled for this filter.
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {followUps.map((f) => {
            const Icon = ACTION_ICONS[f.actionType] || Phone;
            const col = ACTION_COLORS[f.actionType] || { bg: "#EFF6FF", color: "#1D4ED8" };
            const isCompleted = f.status === "COMPLETED";

            const targetName =
              f.client?.companyName ||
              f.lead?.company ||
              f.lead?.name ||
              "Direct Client";

            return (
              <div
                key={f.id}
                style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "0.75rem 1rem", background: isCompleted ? "#F9FAFB" : "#FFFFFF",
                  border: `1px solid ${C.border}`, borderRadius: "8px",
                  opacity: isCompleted ? 0.65 : 1,
                }}
              >
                {/* Left: Icon & Title */}
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{
                    width: "34px", height: "34px", borderRadius: "8px",
                    background: col.bg, color: col.color, display: "flex",
                    alignItems: "center", justifyContent: "center"
                  }}>
                    <Icon size={16} />
                  </div>

                  <div>
                    <div style={{ fontWeight: 700, fontSize: "0.875rem", color: C.text }}>
                      {f.title}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: C.muted, marginTop: "2px", display: "flex", gap: "6px" }}>
                      <span><strong>{targetName}</strong></span>
                      <span>•</span>
                      <span>Due: <strong style={{ color: C.primary }}>{f.dueTime || "11:00 AM"}</strong></span>
                      {isAdmin && <span>• Assigned: {f.assignedTo?.name}</span>}
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div>
                  {!isCompleted ? (
                    <button
                      onClick={() => setCompleteTarget(f)}
                      style={{
                        display: "flex", alignItems: "center", gap: "5px",
                        background: "#ECFDF5", color: "#059669", border: "1px solid #A7F3D0",
                        borderRadius: C.radiusSm, padding: "0.35rem 0.75rem",
                        fontSize: "0.75rem", fontWeight: 700, cursor: "pointer"
                      }}
                    >
                      <Check size={13} /> Complete
                    </button>
                  ) : (
                    <span style={{ fontSize: "0.75rem", color: "#059669", fontWeight: 700 }}>
                      ✓ Done
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Add Follow-up Modal ── */}
      {showModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)",
          backdropFilter: "blur(4px)", zIndex: 100, display: "flex",
          alignItems: "center", justifyContent: "center", padding: "1rem"
        }}>
          <div style={{
            background: C.card, borderRadius: C.radius, width: "100%", maxWidth: "460px",
            padding: "1.75rem", boxShadow: "0 20px 40px rgba(0,0,0,0.15)", border: `1px solid ${C.border}`
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <h3 style={{ fontSize: "1.15rem", fontWeight: 700, color: C.text, margin: 0 }}>Schedule Follow-up</h3>
              <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: C.muted }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateFollowUp} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: C.text, marginBottom: "4px" }}>Action Title *</label>
                <input
                  required
                  placeholder="e.g. Call Client - Send quotation for wedding season"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  style={{ width: "100%", padding: "0.5rem 0.75rem", border: `1px solid ${C.border}`, borderRadius: C.radiusSm, fontSize: "0.875rem", boxSizing: "border-box" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: C.text, marginBottom: "4px" }}>Action Type</label>
                  <select
                    value={form.actionType}
                    onChange={(e) => setForm({ ...form, actionType: e.target.value })}
                    style={{ width: "100%", padding: "0.5rem 0.75rem", border: `1px solid ${C.border}`, borderRadius: C.radiusSm, fontSize: "0.875rem", background: "#fff" }}
                  >
                    <option value="CALL">Phone Call</option>
                    <option value="EMAIL">Send Email</option>
                    <option value="QUOTATION">Send Quotation</option>
                    <option value="TRIAL_FOLLOWUP">Trial Follow-up</option>
                    <option value="MEETING">Video / Meeting</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: C.text, marginBottom: "4px" }}>Priority</label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    style={{ width: "100%", padding: "0.5rem 0.75rem", border: `1px solid ${C.border}`, borderRadius: C.radiusSm, fontSize: "0.875rem", background: "#fff" }}
                  >
                    <option value="HIGH">High Priority</option>
                    <option value="MEDIUM">Medium Priority</option>
                    <option value="LOW">Low Priority</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: C.text, marginBottom: "4px" }}>Due Date</label>
                  <input
                    type="date"
                    value={form.dueDate}
                    onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                    style={{ width: "100%", padding: "0.5rem 0.75rem", border: `1px solid ${C.border}`, borderRadius: C.radiusSm, fontSize: "0.875rem", boxSizing: "border-box" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: C.text, marginBottom: "4px" }}>Due Time</label>
                  <input
                    placeholder="e.g. 11:00 AM"
                    value={form.dueTime}
                    onChange={(e) => setForm({ ...form, dueTime: e.target.value })}
                    style={{ width: "100%", padding: "0.5rem 0.75rem", border: `1px solid ${C.border}`, borderRadius: C.radiusSm, fontSize: "0.875rem", boxSizing: "border-box" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: C.text, marginBottom: "4px" }}>Link to Client (optional)</label>
                  <select
                    value={form.clientId}
                    onChange={(e) => setForm({ ...form, clientId: e.target.value, leadId: "" })}
                    style={{ width: "100%", padding: "0.5rem 0.75rem", border: `1px solid ${C.border}`, borderRadius: C.radiusSm, fontSize: "0.85rem", background: "#fff" }}
                  >
                    <option value="">None</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.companyName}</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: C.text, marginBottom: "4px" }}>Or Link to Lead</label>
                  <select
                    value={form.leadId}
                    onChange={(e) => setForm({ ...form, leadId: e.target.value, clientId: "" })}
                    style={{ width: "100%", padding: "0.5rem 0.75rem", border: `1px solid ${C.border}`, borderRadius: C.radiusSm, fontSize: "0.85rem", background: "#fff" }}
                  >
                    <option value="">None</option>
                    {leads.map(l => <option key={l.id || l._id} value={l.id || l._id}>{l.Company || l.Name}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "0.5rem" }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{ background: "#F3F4F6", color: "#374151", padding: "0.5rem 1rem", borderRadius: C.radiusSm, border: "none", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{ background: C.primary, color: "#fff", padding: "0.5rem 1.25rem", borderRadius: C.radiusSm, border: "none", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer" }}
                >
                  {saving ? "Scheduling..." : "Schedule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Complete Follow-up Modal ── */}
      {completeTarget && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)",
          backdropFilter: "blur(4px)", zIndex: 100, display: "flex",
          alignItems: "center", justifyContent: "center", padding: "1rem"
        }}>
          <div style={{
            background: C.card, borderRadius: C.radius, width: "100%", maxWidth: "440px",
            padding: "1.75rem", boxShadow: "0 20px 40px rgba(0,0,0,0.15)", border: `1px solid ${C.border}`
          }}>
            <h3 style={{ fontSize: "1.15rem", fontWeight: 700, color: C.text, margin: "0 0 4px" }}>
              Log Follow-up Outcome
            </h3>
            <p style={{ fontSize: "0.85rem", color: C.muted, margin: "0 0 1rem" }}>
              {completeTarget.title}
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: C.text, marginBottom: "4px" }}>
                  Call / Action Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Client requested quotation for 500 images wedding trial..."
                  value={outcomeNotes}
                  onChange={(e) => setOutcomeNotes(e.target.value)}
                  style={{ width: "100%", padding: "0.5rem 0.75rem", border: `1px solid ${C.border}`, borderRadius: C.radiusSm, fontSize: "0.875rem", boxSizing: "border-box" }}
                />
              </div>

              {/* Schedule next follow-up toggle */}
              <div style={{ background: "#F8FAFC", padding: "0.75rem", borderRadius: "8px", border: `1px solid ${C.border}` }}>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem", fontWeight: 600, color: C.text, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={scheduleNext}
                    onChange={(e) => setScheduleNext(e.target.checked)}
                  />
                  Schedule next follow-up call/email
                </label>

                {scheduleNext && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px" }}>
                    <input
                      placeholder="Next follow-up title (e.g. Follow up on sent quote)"
                      value={nextTitle}
                      onChange={(e) => setNextTitle(e.target.value)}
                      style={{ width: "100%", padding: "0.45rem 0.65rem", border: `1px solid ${C.border}`, borderRadius: C.radiusSm, fontSize: "0.8rem", boxSizing: "border-box" }}
                    />
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                      <input
                        type="date"
                        value={nextDate}
                        onChange={(e) => setNextDate(e.target.value)}
                        style={{ width: "100%", padding: "0.45rem 0.65rem", border: `1px solid ${C.border}`, borderRadius: C.radiusSm, fontSize: "0.8rem", boxSizing: "border-box" }}
                      />
                      <input
                        placeholder="Time (e.g. 02:00 PM)"
                        value={nextTime}
                        onChange={(e) => setNextTime(e.target.value)}
                        style={{ width: "100%", padding: "0.45rem 0.65rem", border: `1px solid ${C.border}`, borderRadius: C.radiusSm, fontSize: "0.8rem", boxSizing: "border-box" }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "0.5rem" }}>
                <button
                  type="button"
                  onClick={() => setCompleteTarget(null)}
                  style={{ background: "#F3F4F6", color: "#374151", padding: "0.5rem 1rem", borderRadius: C.radiusSm, border: "none", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCompleteFollowUp}
                  style={{ background: "#059669", color: "#fff", padding: "0.5rem 1.25rem", borderRadius: C.radiusSm, border: "none", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer" }}
                >
                  Save & Complete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
