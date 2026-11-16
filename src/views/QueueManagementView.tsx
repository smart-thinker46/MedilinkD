import React, { useState, useEffect, useCallback } from "react";
import { fetchQueueBoard, fetchQueueAnalytics, callNextQueueToken, overrideQueuePriority, createQueueToken, queueCounterSession, apiFetch } from "../lib/apiClient";
import { UsersRound, Bell, Calendar, Search } from "lucide-react";

function Icon({ type, size = 16 }: { type?: string; size?: number }) {
  if (type === "users") return <UsersRound size={size} />;
  if (type === "bell") return <Bell size={size} />;
  if (type === "calendar") return <Calendar size={size} />;
  if (type === "search") return <Search size={size} />;
  return <UsersRound size={size} />;
}

export default function QueueManagementView() {
  type QueueField = {
    key: string;
    label: string;
    note: string;
    type: string;
    required?: boolean;
    placeholder?: string;
    options?: string[];
  };
  type QueueForm = {
    key: "token" | "counter";
    title: string;
    description: string;
    accent: string;
    icon: string;
    submitLabel: string;
    fields: QueueField[];
  };
  type QueueRow = {
    id: string;
    token: string;
    patient: string;
    status: string;
    estimatedWait: number;
    serviceType: string;
    priority: string;
    priorityColor?: string;
    room?: string;
  };

  const [search, setSearch] = useState("");
  const [activeFormKey, setActiveFormKey] = useState<QueueForm["key"] | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState("");
  const [queueBoard, setQueueBoard] = useState<any>({});
  const [queueAnalytics, setQueueAnalytics] = useState<any>({});
  const [queueRows, setQueueRows] = useState<QueueRow[]>([]);
  const forms: QueueForm[] = [
    {
      key: "token",
      title: "Token Issuance",
      description: "Capture token issuance details.",
      accent: "#16a34a",
      icon: "calendar",
      submitLabel: "Issue Token",
      fields: [
        { key: "patient", label: "Patient ID", type: "text", required: true, note: "Tokens are issued after registration or check-in.", placeholder: "Patient UUID" },
        { key: "service_type", label: "Service type", type: "select", required: true, note: "OPD | Lab | Pharmacy | Billing | Radiology | Triage.", options: ["OPD", "Lab", "Pharmacy", "Billing", "Radiology", "Triage"] },
        { key: "priority_level", label: "Priority level", type: "select", required: true, note: "Normal | Urgent | Emergency - affects queue position.", options: ["Normal", "Urgent", "Emergency"] },
        { key: "linked_appointment", label: "Linked appointment", type: "select", note: "Appointment number if pre-booked.", options: ["None", "APT-1021", "APT-1044", "APT-1063"] },
        { key: "counter_assignment", label: "Counter assignment", type: "select", note: "Specific counter if directed.", options: ["Auto assign", "OPD Room 3", "Lab Counter 1", "Pharmacy Window 2", "Billing Counter 1"] },
      ],
    },
    {
      key: "counter",
      title: "Counter Configuration",
      description: "Capture counter configuration details.",
      accent: "#2563eb",
      icon: "gears",
      submitLabel: "Save Counter Configuration",
      fields: [
        { key: "counter_name", label: "Counter name", type: "text", required: true, note: "e.g. OPD Room 3, Lab Counter 1.", placeholder: "e.g. OPD Room 3, Lab Counter 1" },
        { key: "service_type", label: "Service type", type: "select", required: true, note: "Service this counter handles.", options: ["OPD", "Lab", "Pharmacy", "Billing", "Radiology", "Triage"] },
        { key: "assigned_staff", label: "Assigned staff", type: "select", required: true, note: "User currently operating this counter.", options: ["Dr. Kamau", "Grace Achieng", "Nurse Wanjiru", "Pharmacist Otieno", "Cashier Njeri"] },
        { key: "is_open", label: "Is open", type: "select", required: true, note: "Open or closed status for the day.", options: ["Open", "Closed"] },
      ],
    },
  ];

  const activeForm = forms.find((form) => form.key === activeFormKey) || null;
  const loadQueue = useCallback(async () => {
    try {
      const [board, analytics] = await Promise.all([
        fetchQueueBoard({ departmentId: "OPD" }),
        fetchQueueAnalytics({ departmentId: "OPD" }).catch(() => ({})),
      ]);
      const tokens = Array.isArray((board as any)?.tokens) ? (board as any).tokens : [];
      setQueueBoard(board || {});
      setQueueAnalytics(analytics || {});
      setQueueRows(tokens.map((row: any) => ({
        id: String(row?.tokenId || row?.id || row?.tokenNumber || ""),
        token: String(row?.tokenNumber || ""),
        patient: String(row?.patientName || row?.patientId || "Queued patient"),
        status: String(row?.status || "WAITING").replace(/_/g, " "),
        estimatedWait: Number(row?.estimatedWaitMinutes || 0),
        serviceType: String(row?.departmentId || row?.queueType || "OPD"),
        priority: String(row?.priority || "NORMAL").replace(/_/g, " "),
        priorityColor: String(row?.priorityColor || "green"),
        room: String(row?.counterId || row?.doctorName || "Assigning"),
      })));
    } catch (error: any) {
      setNotice(error?.message || "Failed to load queue board.");
    }
  }, []);
  useEffect(() => {
    void loadQueue();
    const timer = window.setInterval(() => void loadQueue(), 30000);
    return () => window.clearInterval(timer);
  }, [loadQueue]);

  const voiceCall = (tokenNumber: string, room = "Counter 1") => {
    try {
      if ("speechSynthesis" in window) {
        const utter = new SpeechSynthesisUtterance(`Token number ${tokenNumber}, please proceed to ${room}`);
        window.speechSynthesis.speak(utter);
      }
      setNotice(`Calling token ${tokenNumber} to ${room}`);
    } catch {
      setNotice(`Token ${tokenNumber} called.`);
    }
  };
  const filteredRows = queueRows.filter((row) => {
    const needle = search.trim().toLowerCase();
    if (!needle) return true;
    return `${row.token} ${row.patient} ${row.status} ${row.serviceType} ${row.priority}`.toLowerCase().includes(needle);
  });
  const stats = [
    { label: "Tokens", value: queueAnalytics?.totals?.tokens ?? queueRows.length, color: "#1e3a8a" },
    { label: "Waiting", value: queueAnalytics?.totals?.waiting ?? queueRows.filter((row) => row.status === "WAITING").length, color: "#f59e0b" },
    { label: "Completed", value: queueAnalytics?.totals?.completed ?? queueRows.filter((row) => row.status === "COMPLETED").length, color: "#16a34a" },
    {
      label: "Avg Wait",
      value: `${queueAnalytics?.totals?.averageWaitingMinutes ?? Math.round(queueRows.reduce((sum, row) => sum + row.estimatedWait, 0) / Math.max(queueRows.length, 1))} min`,
      color: "#0d9488",
    },
  ];
  const updateFormValue = (key: string, value: string) => setFormValues((current) => ({ ...current, [key]: value }));
  const renderField = (field: QueueField) => {
    const value = formValues[field.key] || "";
    if (field.type === "select") {
      return (
        <select className="module-form-input queue-form-control" value={value} onChange={(event) => updateFormValue(field.key, event.target.value)} required={field.required}>
          <option value="">Select {field.label.toLowerCase()}</option>
          {(field.options || []).map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
      );
    }
    return <input className="module-form-input queue-form-control" type={field.type} value={value} onChange={(event) => updateFormValue(field.key, event.target.value)} placeholder={field.placeholder} required={field.required} />;
  };
  const submitForm = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!activeForm) return;
    try {
      if (activeForm.key === "token") {
        const service = String(formValues.service_type || "OPD").toUpperCase();
        const prefix = service.includes("TRIAGE") ? "T" : service.includes("LAB") ? "L" : service.includes("OPD") ? "DR" : service.slice(0, 3);
        await createQueueToken({
          patientId: String(formValues.patient || "").trim(),
          departmentId: service === "LAB" ? "LABORATORY" : service,
          queueType: service,
          tokenPrefix: prefix,
          priority: String(formValues.priority_level || "Normal").toUpperCase(),
          servicePoint: String(formValues.counter_assignment || ""),
          notes: "Issued from Queue Management module",
        });
      } else {
        await queueCounterSession({
          counterId: String(formValues.counter_name || "").trim(),
          counterName: String(formValues.counter_name || "").trim(),
          departmentId: String(formValues.service_type || "OPD").toUpperCase(),
          staffId: String(formValues.assigned_staff || "").trim(),
          active: String(formValues.is_open || "Open") === "Open",
        });
      }
      setNotice(`${activeForm.title} saved successfully.`);
      setActiveFormKey(null);
      setFormValues({});
      await loadQueue();
    } catch (error: any) {
      setNotice(error?.message || `${activeForm.title} failed.`);
    }
  };
  const callNext = async () => {
    try {
      const result = await callNextQueueToken({ departmentId: "OPD" });
      setNotice((result as any)?.voiceAnnouncement?.text || `Calling ${(result as any)?.tokenNumber || "next token"}.`);
      await loadQueue();
    } catch (error: any) {
      setNotice(error?.message || "Failed to call next patient.");
    }
  };
  const markEmergency = async (row: QueueRow) => {
    try {
      await overrideQueuePriority({ tokenId: row.id, priorityLevel: "EMERGENCY", reason: "Emergency override from Queue Management" });
      setNotice(`${row.token} moved to emergency priority.`);
      await loadQueue();
    } catch (error: any) {
      setNotice(error?.message || "Priority update failed.");
    }
  };
  const transferToken = async (row: QueueRow) => {
    const target = window.prompt("Transfer to department", "LABORATORY");
    if (!target) return;
    try {
      await apiFetch("/queue/token/transfer", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tokenId: row.id, toDepartmentId: target.toUpperCase(), reason: "Transferred from Queue Management" }),
      });
      setNotice(`${row.token} transferred to ${target.toUpperCase()}.`);
      await loadQueue();
    } catch (error: any) {
      setNotice(error?.message || "Transfer failed.");
    }
  };

  return (
    <div className="patients-view queue-web-view">
      <div className="pv-header">
        <div>
          <div className="pv-title"><Icon type="users" /> Queue Management</div>
          <p className="pv-subtitle">Live queue operations, wait time intelligence, and token routing across all service points.</p>
        </div>
        <div className="module-actions">
          <button type="button" onClick={callNext} style={{ backgroundColor: "#0d9488", borderColor: "#0d9488", boxShadow: "0 8px 18px #0d948833" }}>
            <Icon type="bell" size={16} /> Call Next Patient
          </button>
          {forms.map((form) => (
            <button key={form.key} type="button" onClick={() => setActiveFormKey(form.key)} style={{ backgroundColor: form.accent, borderColor: form.accent, boxShadow: `0 8px 18px ${form.accent}33` }}>
              <Icon type={form.icon} size={16} /> {form.title}
            </button>
          ))}
        </div>
      </div>
      {notice ? <div className="workflow-notice is-success">{notice}</div> : null}
      <div className="pv-stats queue-stat-grid">
        <div className="pv-stat-card" style={{ borderLeftColor: "#0d9488" }}>
          <p className="pv-stat-label">Last Called</p>
          <p className="pv-stat-value">{queueBoard?.lastCalled?.tokenNumber || "-"}</p>
        </div>
        <div className="pv-stat-card" style={{ borderLeftColor: "#2563eb" }}>
          <p className="pv-stat-label">Next Three</p>
          <p className="pv-stat-value">{(queueBoard?.nextTokens || []).map((row: any) => row.tokenNumber).join(", ") || "-"}</p>
        </div>
        <div className="pv-stat-card" style={{ borderLeftColor: "#dc2626" }}>
          <p className="pv-stat-label">Bottleneck</p>
          <p className="pv-stat-value">{queueAnalytics?.bottleneck?.departmentId || "-"}</p>
        </div>
      </div>
      <div className="pv-stats queue-stat-grid">
        {stats.map((stat) => (
          <div key={stat.label} className="pv-stat-card" style={{ borderLeftColor: stat.color }}>
            <p className="pv-stat-label">{stat.label}</p>
            <p className="pv-stat-value">{stat.value}</p>
          </div>
        ))}
      </div>
      <div className="pv-search-bar">
        <div className="pv-search-wrap">
          <Icon type="search" size={16} />
          <input className="pv-search queue-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search queue tokens, patients, counters..." />
        </div>
      </div>
      <div className="pv-table-meta"><strong className="pv-table-title">Live Queue Board</strong><span className="pv-badge">Sorted by priority and waiting position.</span></div>
      <div className="pv-table-wrap">
        <table className="pv-table">
          <thead><tr><th>Token</th><th>Patient</th><th>Status</th><th>Priority</th><th>Room</th><th>Est. Wait</th><th>Actions</th></tr></thead>
          <tbody>
            {filteredRows.length === 0 ? <tr><td className="pv-empty" colSpan={7}>No queue records found.</td></tr> : filteredRows.map((row) => (
              <tr key={row.token}>
                <td className="pv-name">{row.token}</td>
                <td>{row.patient}</td>
                <td><span className={`pv-badge ${row.status === "Completed" ? "badge-male" : "badge-female"}`}>{row.status}</span></td>
                <td><span className="pv-badge" style={{ backgroundColor: row.priorityColor || "#16a34a", color: "#fff" }}>{row.priority}</span></td>
                <td>{row.room || "-"}</td>
                <td>{row.estimatedWait} min</td>
                <td>
                  <div className="appointment-inline-actions">
                    <button type="button" onClick={() => voiceCall(row.token, row.room || "Counter")}>Call</button>
                    <button type="button" onClick={() => markEmergency(row)}>Emergency</button>
                    <button type="button" onClick={() => transferToken(row)}>Transfer</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {activeForm ? (
        <div className="module-form-overlay queue-form-overlay">
          <div className="module-form-panel queue-form-panel" style={{ "--queue-accent": activeForm.accent } as React.CSSProperties}>
            <div className="module-form-header queue-form-header"><div className="module-form-heading queue-form-title-wrap"><div className="module-form-icon queue-form-icon"><Icon type={activeForm.icon} size={24} /></div><div><p className="module-form-kicker">Queue Management</p><h2 className="module-form-title">{activeForm.title}</h2></div></div><button type="button" className="modal-close-btn queue-form-close" onClick={() => setActiveFormKey(null)} aria-label="Close form">×</button></div>
            <div className="module-form-intro queue-form-intro">{activeForm.description}</div>
            <form className="module-form-body queue-form-body" onSubmit={submitForm}>
              <div className="module-form-grid queue-form-grid">
                {activeForm.fields.map((field) => <label key={field.key} className="module-form-field queue-form-field"><span className="form-label">{field.label}{field.required ? <span className="module-form-required">*</span> : null}</span><small>{field.note}</small>{renderField(field)}</label>)}
              </div>
              <div className="module-form-footer queue-form-footer"><button type="button" className="form-btn form-btn-cancel" onClick={() => setActiveFormKey(null)}>Cancel</button><button type="submit" className="form-btn form-btn-primary module-form-submit">{activeForm.submitLabel}</button></div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
