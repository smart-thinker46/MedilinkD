// Ported from Medilink-Frontend/src/app/ai-analytics/page.tsx for desktop parity.
import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import { Activity, AlertTriangle, Bed, Bell, Brain, CalendarClock, CheckCircle2, ClipboardCheck, HeartPulse, Maximize2, Minimize2, Play, RefreshCw, Search, ShieldAlert, TrendingUp, X } from "lucide-react";
import { api } from "../lib/api";

const today = new Date().toISOString().slice(0, 10);
const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);

export default function AiAnalyticsView() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [readmission, setReadmission] = useState<any[]>([]);
  const [deterioration, setDeterioration] = useState<any[]>([]);
  const [bedDemand, setBedDemand] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [insights, setInsights] = useState<any[]>([]);
  const [dataHealth, setDataHealth] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [riskLevel, setRiskLevel] = useState("ALL");
  const [fromDate, setFromDate] = useState(monthStart);
  const [toDate, setToDate] = useState(today);
  const [limit, setLimit] = useState("50");
  const [selected, setSelected] = useState<any>(null);
  const [expandedTable, setExpandedTable] = useState<string | null>(null);
  const [modal, setModal] = useState<"care" | "">("");
  const [careForm, setCareForm] = useState({ actionType: "FOLLOW_UP_PLAN", notes: "", status: "COMPLETED" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedbackSaving, setFeedbackSaving] = useState(false);
  const [notice, setNotice] = useState<{ tone: "success" | "warning" | "error"; text: string } | null>(null);

  const notify = (text: string, tone: "success" | "warning" | "error" = "success") => {
    setNotice({ text, tone });
    window.setTimeout(() => setNotice(null), tone === "error" ? 5200 : 3400);
  };

  const loadData = async () => {
    if (new Date(fromDate) > new Date(toDate)) {
      notify("Start date cannot be after end date.", "warning");
      return;
    }
    setLoading(true);
    try {
      const params = { fromDate, toDate, limit };
      const [dashRes, readRes, detRes, bedRes, alertRes, modelRes, insightRes, healthRes] = await Promise.all([
        api.get("/ai-analytics/dashboard", { params }),
        api.get("/ai-analytics/readmission-risk", { params }),
        api.get("/ai-analytics/deterioration-warning", { params }),
        api.get("/ai-analytics/bed-demand-forecast", { params: { ...params, days: 7 } }),
        api.get("/ai-analytics/alerts", { params }),
        api.get("/ai-analytics/model-registry"),
        api.get("/ai-analytics/insights", { params }),
        api.get("/ai-analytics/data-health"),
      ]);
      setDashboard(dashRes.data?.data || dashRes.data || {});
      setReadmission(unwrapRows(readRes.data));
      setDeterioration(unwrapRows(detRes.data));
      setBedDemand(unwrapRows(bedRes.data));
      setAlerts(unwrapRows(alertRes.data));
      setModels(unwrapRows(modelRes.data));
      setInsights(unwrapRows(insightRes.data));
      setDataHealth(healthRes.data || null);
    } catch (error: any) {
      notify(error?.response?.data?.message || error?.message || "AI analytics could not be loaded.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [fromDate, toDate, limit]);

  const allClinicalRows = useMemo(() => [...readmission, ...deterioration], [readmission, deterioration]);
  const filteredReadmission = useMemo(() => filterRows(readmission, search, riskLevel, ["patientName", "mrn", "diagnosis", "riskLevel"]), [readmission, search, riskLevel]);
  const filteredDeterioration = useMemo(() => filterRows(deterioration, search, riskLevel, ["patientName", "mrn", "riskLevel", "recommendedAction"]), [deterioration, search, riskLevel]);
  const filteredBedDemand = useMemo(() => filterRows(bedDemand, search, riskLevel, ["wardName", "wardType", "riskLevel", "recommendation"]), [bedDemand, search, riskLevel]);

  const highReadmission = readmission.filter((row) => ["HIGH", "CRITICAL"].includes(row.riskLevel)).length;
  const highDeterioration = deterioration.filter((row) => ["HIGH", "CRITICAL"].includes(row.riskLevel)).length;
  const bedPressure = bedDemand.filter((row) => ["HIGH", "CRITICAL"].includes(row.riskLevel)).length;
  const readmissionGradient = pieGradient([
    { value: highReadmission, color: "#dc2626" },
    { value: Math.max(0, readmission.length - highReadmission), color: "#16a34a" },
  ]);
  const deteriorationGradient = pieGradient([
    { value: highDeterioration, color: "#b91c1c" },
    { value: Math.max(0, deterioration.length - highDeterioration), color: "#0f766e" },
  ]);
  const bedGradient = pieGradient([
    { value: bedPressure, color: "#dc2626" },
    { value: Math.max(0, bedDemand.length - bedPressure), color: "#f59e0b" },
  ]);
  const stats = [
    { label: "Readmission High Risk", value: highReadmission, color: "#dc2626", icon: <ShieldAlert size={20} /> },
    { label: "Deterioration Alerts", value: highDeterioration, color: "#b91c1c", icon: <HeartPulse size={20} /> },
    { label: "Ward Pressure", value: bedPressure, color: "#d97706", icon: <Bed size={20} /> },
    { label: "Active Predictions", value: allClinicalRows.length, color: "#2563eb", icon: <Brain size={20} /> },
    { label: "AI Alerts", value: alerts.length, color: "#7c3aed", icon: <AlertTriangle size={20} /> },
    { label: "Stored Insights", value: insights.length, color: "#0f766e", icon: <TrendingUp size={20} /> },
  ];

  const runModels = async () => {
    setSaving(true);
    try {
      await api.post("/ai-analytics/run-clinical", { fromDate, toDate, limit });
      notify("AI clinical models refreshed.");
      await loadData();
    } catch (error: any) {
      notify(error?.response?.data?.message || error?.message || "AI models could not be run.", "error");
    } finally {
      setSaving(false);
    }
  };

  const saveCareAction = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selected?.patientId && !selected?.admissionId) {
      notify("Select a patient prediction before saving an action.", "warning");
      return;
    }
    setSaving(true);
    try {
      await api.post("/ai-analytics/care-action", {
        ...careForm,
        patientId: selected.patientId,
        admissionId: selected.admissionId,
      });
      setModal("");
      notify("AI action logged for the clinical team.");
    } catch (error: any) {
      notify(error?.response?.data?.message || error?.message || "Care action could not be saved.", "error");
    } finally {
      setSaving(false);
    }
  };

  const recordFeedback = async (decision: string) => {
    if (!selected) {
      notify("Select a prediction or alert first.", "warning");
      return;
    }
    setFeedbackSaving(true);
    try {
      await api.post("/ai-analytics/feedback", {
        predictionId: selected.predictionId || selected.admissionId || selected.wardId || null,
        insightId: selected.insightId || selected.id || null,
        decision,
        reason: decision === "ACCEPTED" ? "Human reviewer accepted the recommendation." : "Human reviewer dismissed the recommendation.",
      });
      notify(`AI review recorded: ${decision.toLowerCase().replaceAll("_", " ")}.`);
    } catch (error: any) {
      notify(error?.response?.data?.message || error?.message || "AI review could not be recorded.", "error");
    } finally {
      setFeedbackSaving(false);
    }
  };

  return (
    <main className="ai-page">
      <header className="ai-header">
        <div className="ai-title">
          <div className="ai-title-mark" aria-hidden="true"><Brain size={22} /></div>
          <div><h1>AI Analytics</h1><p>Predictive clinical intelligence for readmission risk, deterioration early warning, and seven-day bed demand forecasting.</p></div>
        </div>
        <div className="ai-actions">
          <button className="ai-btn ghost" type="button" onClick={() => void loadData()} disabled={loading}><RefreshCw size={17} /> Refresh</button>
          <button className="ai-btn blue" type="button" onClick={() => void runModels()} disabled={saving}><Play size={17} /> Run AI Models</button>
          <button className="ai-btn green" type="button" onClick={() => setModal("care")} disabled={!selected}><ClipboardCheck size={17} /> Log Action</button>
        </div>
      </header>

      <section className="ai-filter">
        <label className="ai-search"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search patient, MRN, diagnosis, ward, risk..." /></label>
        <select value={riskLevel} onChange={(event) => setRiskLevel(event.target.value)}><option value="ALL">All risk levels</option><option value="CRITICAL">Critical</option><option value="HIGH">High</option><option value="MEDIUM">Medium</option><option value="LOW">Low</option></select>
        <input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
        <input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} />
        <input type="number" min={1} max={200} value={limit} onChange={(event) => setLimit(event.target.value)} />
      </section>

      <section className="ai-stats">{stats.map((stat) => <article className="ai-stat" style={{ borderLeftColor: stat.color }} key={stat.label}><div><span>{stat.label}</span><strong>{stat.value}</strong></div><i style={{ color: stat.color }}>{stat.icon}</i></article>)}</section>

      <section className="ai-pie-grid">
        <AiPanel title="Readmission Risk Mix">
          <div className="ai-pie-layout">
            <div className="ai-pie" style={{ background: `conic-gradient(${readmissionGradient})` }}><strong>{readmission.length}</strong><span>Patients</span></div>
            <div className="ai-pie-legend">
              <button type="button" onClick={() => setSelected({ status: "HIGH", count: highReadmission, kpis: filteredReadmission.filter((row) => ["HIGH", "CRITICAL"].includes(row.riskLevel)).map((row) => row.patientName) })}><i style={{ background: "#dc2626" }} /> High risk {highReadmission}</button>
              <button type="button" onClick={() => setSelected({ status: "LOW", count: Math.max(0, readmission.length - highReadmission), kpis: filteredReadmission.filter((row) => !["HIGH", "CRITICAL"].includes(row.riskLevel)).map((row) => row.patientName) })}><i style={{ background: "#16a34a" }} /> Not high risk {Math.max(0, readmission.length - highReadmission)}</button>
            </div>
          </div>
        </AiPanel>
        <AiPanel title="Deterioration Alert Mix">
          <div className="ai-pie-layout">
            <div className="ai-pie" style={{ background: `conic-gradient(${deteriorationGradient})` }}><strong>{deterioration.length}</strong><span>Cases</span></div>
            <div className="ai-pie-legend">
              <button type="button" onClick={() => setSelected({ status: "HIGH", count: highDeterioration, kpis: filteredDeterioration.filter((row) => ["HIGH", "CRITICAL"].includes(row.riskLevel)).map((row) => row.patientName) })}><i style={{ background: "#b91c1c" }} /> High risk {highDeterioration}</button>
              <button type="button" onClick={() => setSelected({ status: "LOW", count: Math.max(0, deterioration.length - highDeterioration), kpis: filteredDeterioration.filter((row) => !["HIGH", "CRITICAL"].includes(row.riskLevel)).map((row) => row.patientName) })}><i style={{ background: "#0f766e" }} /> Lower risk {Math.max(0, deterioration.length - highDeterioration)}</button>
            </div>
          </div>
        </AiPanel>
        <AiPanel title="Bed Demand Mix">
          <div className="ai-pie-layout">
            <div className="ai-pie" style={{ background: `conic-gradient(${bedGradient})` }}><strong>{bedDemand.length}</strong><span>Wards</span></div>
            <div className="ai-pie-legend">
              <button type="button" onClick={() => setSelected({ status: "HIGH", count: bedPressure, kpis: filteredBedDemand.filter((row) => ["HIGH", "CRITICAL"].includes(row.riskLevel)).map((row) => row.wardName) })}><i style={{ background: "#dc2626" }} /> High pressure {bedPressure}</button>
              <button type="button" onClick={() => setSelected({ status: "LOW", count: Math.max(0, bedDemand.length - bedPressure), kpis: filteredBedDemand.filter((row) => !["HIGH", "CRITICAL"].includes(row.riskLevel)).map((row) => row.wardName) })}><i style={{ background: "#f59e0b" }} /> Lower pressure {Math.max(0, bedDemand.length - bedPressure)}</button>
            </div>
          </div>
        </AiPanel>
      </section>

      <section className={`ai-layout${expandedTable ? " ai-has-expanded-table" : ""}`}>
        <div className="ai-main">
          <AiPanel title="30-Day Readmission Risk Prediction">
            <AiTable title="30-Day Readmission Risk Prediction" expanded={expandedTable === "readmission"} onToggle={() => setExpandedTable((value) => value === "readmission" ? null : "readmission")}>
              <thead><tr><th>Patient</th><th>Risk</th><th>Diagnosis</th><th>Drivers</th><th>Discharge Actions</th></tr></thead>
              <tbody>{filteredReadmission.length ? filteredReadmission.map((row) => <tr key={row.admissionId} onClick={() => setSelected(row)}><td><strong>{row.patientName}</strong><small>{row.mrn} · LOS {row.lengthOfStay}d</small></td><td><RiskBadge level={row.riskLevel} /> <b>{row.riskPercent}%</b></td><td>{row.diagnosis}</td><td>{(row.factors || []).slice(0, 2).map((factor: any) => factor.name).join(", ") || "-"}</td><td>{row.dischargeActions?.followUpAppointment || "Standard"}</td></tr>) : <tr><td colSpan={5} className="ai-empty">No readmission risks found.</td></tr>}</tbody>
            </AiTable>
          </AiPanel>

          <AiPanel title="Deterioration Early Warning">
            <AiTable title="Deterioration Early Warning" expanded={expandedTable === "deterioration"} onToggle={() => setExpandedTable((value) => value === "deterioration" ? null : "deterioration")}>
              <thead><tr><th>Patient</th><th>Risk</th><th>Window</th><th>Current Vitals</th><th>Recommended Action</th></tr></thead>
              <tbody>{filteredDeterioration.length ? filteredDeterioration.map((row) => <tr key={row.admissionId} onClick={() => setSelected(row)}><td><strong>{row.patientName}</strong><small>{row.mrn}</small></td><td><RiskBadge level={row.riskLevel} /> <b>{row.riskPercent}%</b></td><td>{row.predictedWindow}</td><td>SpO2 {row.currentVitals?.spo2}% · RR {row.currentVitals?.respiratoryRate}</td><td>{row.recommendedAction}</td></tr>) : <tr><td colSpan={5} className="ai-empty">No deterioration warnings found.</td></tr>}</tbody>
            </AiTable>
          </AiPanel>

          <AiPanel title="7-Day Bed Demand Forecast">
            <AiTable title="7-Day Bed Demand Forecast" expanded={expandedTable === "bed-demand"} onToggle={() => setExpandedTable((value) => value === "bed-demand" ? null : "bed-demand")}>
              <thead><tr><th>Ward</th><th>Pressure</th><th>Capacity</th><th>Tomorrow</th><th>7-Day Forecast</th></tr></thead>
              <tbody>{filteredBedDemand.length ? filteredBedDemand.map((row) => <tr key={row.wardId} onClick={() => setSelected(row)}><td><strong>{row.wardName}</strong><small>{row.wardType}</small></td><td><RiskBadge level={row.riskLevel} /> <b>{row.pressurePercent}%</b></td><td>{row.occupied}/{row.capacity} occupied · {row.available} free</td><td>{row.tomorrowExpectedAdmissions} expected</td><td>{row.totalExpectedAdmissions7d} admissions · {row.recommendation}</td></tr>) : <tr><td colSpan={5} className="ai-empty">No bed demand forecast available.</td></tr>}</tbody>
            </AiTable>
          </AiPanel>
        </div>

        <aside className="ai-side">
          <AiPanel title="Model Registry">
            <div className="ai-list">{models.slice(0, 6).map((model: any) => <button type="button" key={model.id || `${model.key}-${model.version}`} onClick={() => setSelected(model)}><span><strong>{model.key}</strong><small>{model.lifecycle || model.status} · v{model.version}</small></span><Brain size={18} /></button>)}{!models.length ? <p className="ai-note">No registered models available.</p> : null}</div>
          </AiPanel>
          <AiPanel title="AI Data Health">
            <div className="ai-factor-list">{(dataHealth?.sources || []).map((source: any) => <div key={source.source}><strong>{source.source}</strong><span>{source.status}{source.lastEventAt ? ` · ${new Date(source.lastEventAt).toLocaleString()}` : ""}</span></div>)}{!dataHealth?.sources?.length ? <p className="ai-note">Data health is unknown.</p> : null}</div>
          </AiPanel>
          <section className="ai-selected">
            <span>Selected Prediction</span>
            <h2>{selected?.patientName || selected?.wardName || "No prediction selected"}</h2>
            <dl><div><dt>Risk</dt><dd>{selected?.riskLevel || "-"}</dd></div><div><dt>Score</dt><dd>{selected?.riskPercent || selected?.pressurePercent || 0}%</dd></div><div><dt>Type</dt><dd>{selected?.wardName ? "Bed Demand" : selected?.predictedWindow ? "Deterioration" : "Readmission"}</dd></div></dl>
            <div className="ai-review-actions"><span>Human review</span><div><button type="button" disabled={!selected || feedbackSaving} onClick={() => void recordFeedback("ACCEPTED")}><CheckCircle2 size={15} /> Accept</button><button type="button" disabled={!selected || feedbackSaving} onClick={() => void recordFeedback("DISMISSED")}><X size={15} /> Dismiss</button></div></div>
          </section>
          <AiPanel title="Explainability Factors">
            <div className="ai-factor-list">{selected?.factors?.length ? selected.factors.map((factor: any, index: number) => <div key={`${factor.name}-${index}`}><strong>{factor.name}</strong><span>{String(factor.value)}</span></div>) : selected?.daily?.length ? selected.daily.map((day: any) => <div key={day.date}><strong>{day.date}</strong><span>{day.expectedAdmissions} admissions</span></div>) : <p className="ai-note">Select a row to view AI drivers.</p>}</div>
          </AiPanel>
          <AiPanel title="Open AI Alerts">
            <div className="ai-list">{alerts.length ? alerts.slice(0, 8).map((row) => <button type="button" key={row.id} onClick={() => setSelected(row)}><span><strong>{row.title}</strong><small>{row.riskLevel} · {Math.round(Number(row.confidence || 0) * 100)}%</small></span><AlertTriangle size={18} /></button>) : <p className="ai-note">No AI alerts open.</p>}</div>
          </AiPanel>
        </aside>
      </section>

      {modal === "care" ? <AiModal title="Log AI-Driven Care Action" onClose={() => setModal("")}><form className="ai-form" onSubmit={saveCareAction}><label><span>Action type</span><select value={careForm.actionType} onChange={(event) => setCareForm((f) => ({ ...f, actionType: event.target.value }))}><option value="FOLLOW_UP_PLAN">Follow-up appointment confirmed</option><option value="MEDICATION_SUPPLY">30-day medication supply confirmed</option><option value="HOME_CARE">Home care arrangement</option><option value="PATIENT_EDUCATION">Patient education documented</option><option value="URGENT_REVIEW">Urgent clinical review</option></select></label><label><span>Status</span><select value={careForm.status} onChange={(event) => setCareForm((f) => ({ ...f, status: event.target.value }))}><option>COMPLETED</option><option>IN_PROGRESS</option><option>DEFERRED</option></select></label><label className="wide"><span>Notes</span><textarea value={careForm.notes} onChange={(event) => setCareForm((f) => ({ ...f, notes: event.target.value }))} placeholder="Document the action taken by the discharge or clinical team..." /></label><footer><button type="button" onClick={() => setModal("")}>Cancel</button><button type="submit" disabled={saving}>{saving ? "Saving..." : "Save Action"}</button></footer></form></AiModal> : null}

      {notice ? <div className={`ai-toast ${notice.tone}`} role="status"><div className="ai-toast-icon"><Bell size={17} /></div><div className="ai-toast-copy"><strong>{notice.tone === "error" ? "Error" : notice.tone === "warning" ? "Attention" : "Completed"}</strong><span>{notice.text}</span></div><button type="button" aria-label="Dismiss notification" onClick={() => setNotice(null)}><X size={16} /></button></div> : null}
      {loading ? <div className="ai-loading">Loading AI predictions...</div> : null}
    </main>
  );
}

function filterRows(rows: any[], search: string, riskLevel: string, keys: string[]) {
  const q = search.trim().toLowerCase();
  return rows.filter((row) => {
    const hay = keys.map((key) => row?.[key]).join(" ").toLowerCase();
    return (!q || hay.includes(q)) && (riskLevel === "ALL" || row.riskLevel === riskLevel);
  });
}

function unwrapRows(value: any): any[] {
  if (Array.isArray(value)) return value;
  const data = value?.data ?? value;
  if (Array.isArray(data)) return data;
  for (const candidate of [data?.items, data?.rows, data?.results, data?.tokens, data?.data]) {
    if (Array.isArray(candidate)) return candidate;
  }
  return [];
}

function RiskBadge({ level }: { level: string }) {
  return <span className={`ai-risk ${String(level || "LOW").toLowerCase()}`}>{level || "LOW"}</span>;
}

function AiPanel({ title, children }: { title: string; children: ReactNode }) {
  return <section className="ai-panel"><header><h2>{title}</h2></header>{children}</section>;
}

function AiTable({ children, title, expanded, onToggle }: { children: ReactNode; title: string; expanded: boolean; onToggle: () => void }) {
  return <div className={`ai-table-wrap${expanded ? " is-expanded" : ""}`}><div className="ai-table-toolbar"><strong>{title}</strong><button type="button" onClick={onToggle} aria-label={expanded ? `Collapse ${title}` : `Expand ${title}`} title={expanded ? "Collapse table" : "Expand table"}>{expanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}</button></div><table className="ai-table">{children}</table></div>;
}

function AiModal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return <div className="ai-modal-backdrop"><section className="ai-modal"><header><div><span>AI Analytics</span><h2>{title}</h2></div><button type="button" onClick={onClose} aria-label="Close form"><X size={18} /></button></header>{children}</section></div>;
}

function pieGradient(parts: Array<{ value: number; color: string }>) {
  const total = parts.reduce((sum, row) => sum + Math.max(0, Number(row.value || 0)), 0);
  if (!total) return "#e2e8f0 0% 100%";
  let cursor = 0;
  return parts.map((row) => {
    const start = cursor;
    const end = start + (Math.max(0, Number(row.value || 0)) / total) * 100;
    cursor = end;
    return `${row.color} ${start}% ${end}%`;
  }).join(", ");
}
