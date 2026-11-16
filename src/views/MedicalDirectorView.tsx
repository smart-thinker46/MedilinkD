// Ported from Medilink-Frontend/src/app/medical-director/page.tsx for desktop parity.
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Activity, AlertTriangle, ClipboardCheck, FileText, HeartPulse, Maximize2, Minimize2, Plus, RefreshCw, ShieldAlert, Stethoscope, X } from "lucide-react";
import { api } from "../lib/api";

const unwrap = (value: any) => value?.data ?? value;
const rows = (value: any) => { const data = unwrap(value); return Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : []; };
const pretty = (value: any) => String(value || "-").replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
const dateText = (value: any) => { const date = new Date(String(value || "")); return Number.isFinite(date.getTime()) ? date.toLocaleDateString() : "-"; };

const actions = [
  ["Doctor Profile", "doctor-profiles", "green"], ["Privilege Assignment", "doctor-privileges", "blue"], ["Clinical Protocol", "clinical-protocols", "purple"],
  ["Protocol Version", "protocol-versions", "teal"], ["Mortality Review", "mortality-reviews", "orange"], ["Complication Report", "complication-reports", "red"],
  ["Risk Alert", "clinical-risk-alerts", "violet"], ["Restricted Drug Approval", "restricted-drug-approvals", "pink"], ["M&M Meeting", "mmr-meetings", "cyan"],
  ["Performance Score", "doctor-performance-scores", "blue"], ["Outcome Metric", "outcome-metrics", "green"], ["Critical Case Alert", "critical-case-alerts", "teal"],
] as const;

export default function MedicalDirectorView() {
  const [dashboard, setDashboard] = useState<any>({});
  const [metrics, setMetrics] = useState<any>({});
  const [collections, setCollections] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<{ label: string; endpoint: string } | null>(null);
  const [expandedPerformance, setExpandedPerformance] = useState(false);
  const [form, setForm] = useState({ title: "", details: "", severity: "MEDIUM", status: "OPEN", doctorProfileId: "" });

  const load = async () => {
    setLoading(true);
    const endpoints = ["doctor-profiles", "clinical-protocols", "mortality-reviews", "complication-reports", "clinical-risk-alerts", "restricted-drug-approvals", "mmr-meetings", "doctor-performance-scores", "outcome-metrics", "critical-case-alerts"];
    try {
      const results = await Promise.allSettled([api.get("/medical-director/dashboard"), api.get("/medical-director/governance-metrics"), ...endpoints.map((endpoint) => api.get(`/medical-director/${endpoint}?limit=200`))]);
      const dashboardResult = results[0];
      if (dashboardResult.status === "fulfilled") setDashboard(unwrap(dashboardResult.value.data) || {});
      const metricsResult = results[1];
      if (metricsResult.status === "fulfilled") setMetrics(unwrap(metricsResult.value.data) || {});
      const next: Record<string, any[]> = {};
      endpoints.forEach((endpoint, index) => { const result = results[index + 2]; next[endpoint] = result.status === "fulfilled" ? rows(result.value.data) : []; });
      setCollections(next);
      const sourceNames = ["dashboard", "governance metrics", ...endpoints];
      const failedSources = results.map((result, index) => {
        if (result.status !== "rejected") return "";
        const error = result.reason as any;
        const status = error?.response?.status;
        const message = error?.response?.data?.message;
        const detail = status ? ` (HTTP ${status}${message ? `: ${Array.isArray(message) ? message.join(", ") : message}` : ""})` : "";
        return `${sourceNames[index]}${detail}`;
      }).filter(Boolean);
      setNotice(failedSources.length ? `${failedSources.length} governance data source(s) could not be loaded: ${failedSources.join(", ")}.` : "");
    } catch { setNotice("Medical Director data could not be loaded."); }
    finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, []);

  const totals = dashboard?.totals || dashboard || {};
  const stats = [
    ["Doctors", totals.doctors || totals.totalDoctors || collections["doctor-profiles"]?.length || 0, Stethoscope, "blue"],
    ["Active Protocols", totals.protocols || totals.activeProtocols || collections["clinical-protocols"]?.length || 0, FileText, "purple"],
    ["Open Mortality Reviews", totals.openMortalityReviews || 0, HeartPulse, "red"],
    ["Risk Alerts", totals.openRiskAlerts || totals.criticalRiskAlerts || 0, ShieldAlert, "orange"],
    ["Open Complications", totals.openComplications || 0, Activity, "teal"],
    ["Pending Approvals", totals.pendingRestrictedApprovals || 0, ClipboardCheck, "green"],
    ["Active Admissions", metrics.census?.activeAdmissions || 0, HeartPulse, "blue"],
    ["Bed Occupancy", `${metrics.census?.occupancyRate || 0}%`, Activity, "orange"],
    ["Break-Glass (30d)", metrics.governance?.breakGlassAccesses || 0, ShieldAlert, "red"],
  ] as const;
  const performance = useMemo(() => (collections["doctor-performance-scores"] || []).filter((row) => JSON.stringify(row).toLowerCase().includes(search.toLowerCase())).slice(0, 50), [collections, search]);

  const createRecord = async (event: FormEvent) => {
    event.preventDefault();
    if (!modal) return;
    try {
      await api.post(`/medical-director/${modal.endpoint}`, { title: form.title, details: form.details, severity: form.severity, status: form.status, doctorProfileId: form.doctorProfileId || undefined });
      setNotice(`${modal.label} created successfully.`); setModal(null); setForm({ title: "", details: "", severity: "MEDIUM", status: "OPEN", doctorProfileId: "" }); await load();
    } catch (error: any) { setNotice(error?.response?.data?.message || `${modal.label} could not be created.`); }
  };

  return <main className="medical-director-page">
    <header className="medical-director-header"><div><span>Clinical Governance</span><h1>Medical Director Dashboard</h1><p>Patient safety, clinical performance, governance actions, and medical leadership oversight.</p></div><div className="medical-director-actions"><button className="md-refresh" onClick={() => void load()} disabled={loading}><RefreshCw size={16} /> Refresh</button>{actions.slice(0, 4).map(([label, endpoint, tone]) => <button key={endpoint} className={`md-action ${tone}`} onClick={() => setModal({ label, endpoint })}><Plus size={15} /> {label}</button>)}</div></header>
    {notice ? <div className="medical-director-notice">{notice}</div> : null}
    <section className="medical-director-stats">{stats.map(([label, value, Icon, tone]) => <article className={`md-stat ${tone}`} key={label}><div><span>{label}</span><strong>{value}</strong></div><Icon size={22} /></article>)}</section>
    <section className="medical-director-toolbar"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search governance records..." /><div className="md-action-wrap">{actions.slice(4).map(([label, endpoint, tone]) => <button key={endpoint} className={`md-action ${tone}`} onClick={() => setModal({ label, endpoint })}><Plus size={15} /> {label}</button>)}</div></section>
    <section className="medical-director-grid"><article className="md-panel"><header><h2>Patient Safety Alerts</h2><span>{collections["clinical-risk-alerts"]?.length || 0} records</span></header><div className="md-list">{(collections["clinical-risk-alerts"] || []).slice(0, 8).map((row) => <button key={row.id} className="md-list-row"><strong>{pretty(row.alertType || row.title || "Clinical risk")}</strong><span>{pretty(row.severity)} · {pretty(row.status)}</span><small>{row.patient?.patientCode || row.patientId || "Protected patient"} · {dateText(row.detectedAt)}</small></button>)}{!collections["clinical-risk-alerts"]?.length ? <p className="md-empty">No clinical risk alerts.</p> : null}</div></article><article className="md-panel"><header><h2>Mortality & Complication Reviews</h2><span>{(collections["mortality-reviews"]?.length || 0) + (collections["complication-reports"]?.length || 0)} records</span></header><div className="md-list">{[...(collections["mortality-reviews"] || []), ...(collections["complication-reports"] || [])].slice(0, 8).map((row, index) => <button key={row.id || index} className="md-list-row"><strong>{pretty(row.reviewType || row.complicationType || "Clinical review")}</strong><span>{pretty(row.reviewStatus || row.status)}</span><small>{dateText(row.createdAt || row.reportedAt)}</small></button>)}{!collections["mortality-reviews"]?.length && !collections["complication-reports"]?.length ? <p className="md-empty">No mortality or complication reviews.</p> : null}</div></article></section>
    <section className={`md-panel md-performance ${expandedPerformance ? "is-expanded" : ""}`}><header><div><h2>Doctor Performance Scores</h2><p>Read-only performance visibility from authoritative clinical governance records.</p></div><button type="button" className="md-expand-btn" onClick={() => setExpandedPerformance((current) => !current)} aria-label={expandedPerformance ? "Collapse performance table" : "Expand performance table"}>{expandedPerformance ? <Minimize2 size={16} /> : <Maximize2 size={16} />}</button></header><div className="md-table-wrap"><table><thead><tr><th>Doctor</th><th>Score</th><th>Risk</th><th>Metric date</th></tr></thead><tbody>{performance.length ? performance.map((row, index) => <tr key={row.id || index}><td>{[row.doctorProfile?.staff?.firstName, row.doctorProfile?.staff?.lastName].filter(Boolean).join(" ") || row.doctorName || "Doctor"}</td><td>{row.overallScore ?? row.score ?? "-"}</td><td>{pretty(row.riskFlag || row.risk || "-")}</td><td>{dateText(row.metricDate || row.createdAt)}</td></tr>) : <tr><td colSpan={4}>No performance scores recorded.</td></tr>}</tbody></table></div></section>
    {modal ? <div className="md-modal-backdrop"><form className="md-modal" onSubmit={createRecord}><header><div><span>Medical Governance</span><h2>{modal.label}</h2><p>Record an item in the authoritative clinical governance workflow.</p></div><button type="button" onClick={() => setModal(null)} aria-label="Close"><X size={18} /></button></header><div className="md-form-grid"><label>Title<input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required placeholder="Record title" /></label><label>Severity<select value={form.severity} onChange={(event) => setForm({ ...form, severity: event.target.value })}><option>LOW</option><option>MEDIUM</option><option>HIGH</option><option>CRITICAL</option></select></label><label>Status<select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}><option>OPEN</option><option>IN_PROGRESS</option><option>PENDING</option><option>APPROVED</option><option>CLOSED</option></select></label><label>Doctor profile ID<input value={form.doctorProfileId} onChange={(event) => setForm({ ...form, doctorProfileId: event.target.value })} placeholder="Optional" /></label><label className="wide">Details<textarea value={form.details} onChange={(event) => setForm({ ...form, details: event.target.value })} required placeholder="Describe the governance item" /></label></div><footer><button type="button" onClick={() => setModal(null)}>Cancel</button><button type="submit"><ClipboardCheck size={16} /> Save record</button></footer></form></div> : null}
  </main>;
}
