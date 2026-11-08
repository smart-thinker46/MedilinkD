import React, { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BookOpenCheck,
  Brain,
  ClipboardCheck,
  ListChecks,
  RefreshCw,
  Save,
  Search,
  Settings2,
  ShieldAlert,
  Sparkles,
  Stethoscope,
  UserRoundSearch,
  X,
} from "lucide-react";
import { api } from "../lib/api";

const rowsFromResponse = (value: any): any[] => {
  const data = value?.data ?? value;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.rows)) return data.rows;
  if (Array.isArray(data?.patients)) return data.patients;
  return [];
};

type CdssRule = {
  id: string;
  ruleName: string;
  triggerEvent: string;
  severity: string;
  alertMessage: string;
  guidelineSource?: string | null;
  isActive?: boolean;
};

type CdssAlert = {
  id: string;
  ruleId: string;
  patientId: string;
  firedAt?: string;
  actionTaken?: string;
  overrideReason?: string | null;
  triggerContext?: any;
  rule?: CdssRule;
};

type CdssReview = {
  patient?: { id?: string; name?: string; mrn?: string; ageYears?: number | null; gender?: string; allergies?: any[] };
  diagnosis?: string;
  medicationNames?: string[];
  allergyChecks?: any[];
  interactionChecks?: any[];
  guidelineChecks?: any[];
  doseChecks?: any[];
  earlyWarningChecks?: any[];
  sepsisChecks?: any[];
  summary?: { hardStops?: number; warnings?: number; information?: number };
  reviewedAt?: string;
};

const defaultReviewForm = {
  patientId: "",
  triggerEvent: "PRESCRIBE",
  medication: "",
  currentMedications: "",
  diagnosis: "",
  dose: "",
  eGfr: "",
  weightKg: "",
  chiefComplaint: "",
  notes: "",
  justification: "",
  respiratoryRate: "",
  oxygenSaturation: "",
  bpSystolic: "",
  pulse: "",
  temperature: "",
};

const defaultRuleForm = {
  ruleName: "",
  triggerEvent: "PRESCRIBE",
  severity: "INFO",
  alertMessage: "",
  guidelineRef: "",
};

export default function CdssView() {
  const [dashboard, setDashboard] = useState<any>({});
  const [rules, setRules] = useState<CdssRule[]>([]);
  const [alerts, setAlerts] = useState<CdssAlert[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [review, setReview] = useState<CdssReview | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<CdssAlert | null>(null);
  const [search, setSearch] = useState("");
  const [severity, setSeverity] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");
  const [notice, setNotice] = useState<{ tone: "success" | "warning" | "error"; text: string } | null>(null);
  const [reviewForm, setReviewForm] = useState(defaultReviewForm);
  const [ruleForm, setRuleForm] = useState(defaultRuleForm);
  const [modal, setModal] = useState<"rule" | "">("");
  const [workflowPopup, setWorkflowPopup] = useState<"monitor" | "waiting" | "queue" | "">("");
  const [waitingRows, setWaitingRows] = useState<any[]>([]);
  const [workflowLoading, setWorkflowLoading] = useState(false);
  const [queuePatientId, setQueuePatientId] = useState("");

  const notify = (text: string, tone: "success" | "warning" | "error" = "success") => {
    setNotice({ text, tone });
    window.setTimeout(() => setNotice(null), tone === "error" ? 5000 : 3200);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [dashResult, rulesResult, alertsResult, patientsResult] = await Promise.allSettled([
        api.get("/cdss/dashboard"),
        api.get("/cdss/rules"),
        api.get("/cdss/alerts"),
        api.get("/patients", { params: { limit: 500 } }).catch((error: any) => {
          if ([404, 405].includes(error?.response?.status)) return api.get("/tenant/patients", { params: { limit: 500 } });
          throw error;
        }),
      ]);
      setDashboard(dashResult.status === "fulfilled" ? dashResult.value.data?.kpis || dashResult.value.data?.data?.kpis || dashResult.value.data || {} : {});
      setRules(rulesResult.status === "fulfilled" ? rowsFromResponse(rulesResult.value.data) : []);
      setAlerts(alertsResult.status === "fulfilled" ? rowsFromResponse(alertsResult.value.data) : []);
      if (patientsResult.status === "fulfilled") setPatients(rowsFromResponse(patientsResult.value.data));
      const failed = [dashResult, rulesResult, alertsResult, patientsResult].filter((result) => result.status === "rejected");
      if (failed.length) {
        const firstError = failed[0].status === "rejected" ? (failed[0] as PromiseRejectedResult).reason : null;
        notify(firstError?.response?.data?.message || "Some CDSS data could not be loaded. Available data remains displayed.", "warning");
      }
    } catch (error: any) {
      notify(error?.response?.data?.message || error?.message || "CDSS data could not be loaded.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const filteredRules = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rules.filter((row) => {
      const hay = [row.ruleName, row.triggerEvent, row.severity, row.alertMessage, row.guidelineSource].join(" ").toLowerCase();
      return (!q || hay.includes(q)) && (severity === "ALL" || String(row.severity || "").toUpperCase() === severity);
    });
  }, [rules, search, severity]);

  const filteredAlerts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return alerts.filter((row) => {
      const hay = [row.rule?.ruleName, row.patientId, row.actionTaken, row.overrideReason].join(" ").toLowerCase();
      const ruleSeverity = String(row.rule?.severity || "").toUpperCase();
      return (!q || hay.includes(q)) && (severity === "ALL" || ruleSeverity === severity);
    });
  }, [alerts, search, severity]);

  const patientOptions = useMemo(() => patients.map((patient) => ({
    id: patient.id,
    label: `${[patient.firstName, patient.lastName].filter(Boolean).join(" ") || patient.name || "Unnamed patient"} · ${patient.patientCode || patient.mrn || patient.id || ""}`,
  })).filter((patient) => patient.id), [patients]);

  const metrics = [
    { label: "Active Rules", value: dashboard?.activeRules ?? rules.length, color: "#2563eb", icon: <Brain size={19} /> },
    { label: "Active Alerts", value: dashboard?.activeAlerts ?? alerts.length, color: "#dc2626", icon: <AlertTriangle size={19} /> },
    { label: "Hard Stops", value: review?.summary?.hardStops ?? alerts.filter((row) => String(row.rule?.severity || "").toUpperCase() === "CRITICAL").length, color: "#b91c1c", icon: <ShieldAlert size={19} /> },
    { label: "Warnings", value: review?.summary?.warnings ?? alerts.filter((row) => String(row.rule?.severity || "").toUpperCase() === "WARNING").length, color: "#d97706", icon: <ClipboardCheck size={19} /> },
    { label: "Clinical Prompts", value: review?.summary?.information ?? rules.filter((row) => String(row.severity || "").toUpperCase() === "INFO").length, color: "#0f766e", icon: <BookOpenCheck size={19} /> },
    { label: "Safety Review", value: review ? "Live" : "Idle", color: "#7c3aed", icon: <Sparkles size={19} /> },
  ];

  const evaluate = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    if (!reviewForm.patientId.trim()) {
      notify("Enter a patient ID to run a CDSS review.", "warning");
      return;
    }
    setSaving("evaluate");
    try {
      const response = await api.post("/cdss/evaluate", {
        triggerEvent: reviewForm.triggerEvent,
        patientId: reviewForm.patientId.trim(),
        context: {
          medication: reviewForm.medication,
          drugName: reviewForm.medication,
          currentMedications: reviewForm.currentMedications,
          diagnosis: reviewForm.diagnosis,
          chiefComplaint: reviewForm.chiefComplaint,
          dose: reviewForm.dose,
          eGfr: reviewForm.eGfr,
          weightKg: reviewForm.weightKg,
          respiratoryRate: reviewForm.respiratoryRate,
          oxygenSaturation: reviewForm.oxygenSaturation,
          bpSystolic: reviewForm.bpSystolic,
          pulse: reviewForm.pulse,
          temperature: reviewForm.temperature,
          notes: reviewForm.notes,
          justification: reviewForm.justification,
        },
      });
      const payload = response.data?.data || response.data;
      setReview(payload || null);
      const newestAlert = response.data?.alerts?.[0] || null;
      if (newestAlert) setSelectedAlert(newestAlert);
      notify("CDSS review completed and stored.");
      void loadData();
    } catch (error: any) {
      notify(error?.response?.data?.message || error?.message || "CDSS evaluation failed.", "error");
    } finally {
      setSaving("");
    }
  };

  const saveRule = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!ruleForm.ruleName.trim() || !ruleForm.alertMessage.trim()) {
      notify("Rule name and alert message are required.", "warning");
      return;
    }
    setSaving("rule");
    try {
      await api.post("/cdss/rules", ruleForm);
      setModal("");
      setRuleForm(defaultRuleForm);
      notify("CDSS rule saved.");
      void loadData();
    } catch (error: any) {
      notify(error?.response?.data?.message || error?.message || "Rule could not be saved.", "error");
    } finally {
      setSaving("");
    }
  };

  const recordAlertAction = async (action: string) => {
    if (!selectedAlert?.id) return;
    let overrideReason = "";
    if (action === "OVERRIDDEN") {
      overrideReason = window.prompt("Document the clinical reason for overriding this alert:")?.trim() || "";
      if (!overrideReason) {
        notify("An override reason is required before proceeding.", "warning");
        return;
      }
    }
    setSaving(`alert-${action}`);
    try {
      const response = await api.post(`/cdss/alerts/${selectedAlert.id}/action`, { action, overrideReason });
      const updated = response.data?.alert || response.data?.data?.alert;
      if (updated) setSelectedAlert((current) => current ? { ...current, ...updated } : updated);
      notify(`Alert ${action.toLowerCase()} and audit trail updated.`);
      void loadData();
    } catch (error: any) {
      notify(error?.response?.data?.message || error?.message || "Alert action could not be recorded.", "error");
    } finally {
      setSaving("");
    }
  };

  const jumpTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const openWaitingList = async () => {
    setWorkflowPopup("waiting");
    setWorkflowLoading(true);
    try {
      const response = await api.get("/queue/board", { params: { departmentId: "CDSS" } });
      setWaitingRows(rowsFromResponse(response.data));
    } catch (error: any) {
      setWaitingRows([]);
      notify(error?.response?.data?.message || "The CDSS waiting list could not be loaded.", "error");
    } finally {
      setWorkflowLoading(false);
    }
  };

  const queueSelectedPatient = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!queuePatientId) {
      notify("Select a registered patient before adding them to the CDSS queue.", "warning");
      return;
    }
    setSaving("queue-patient");
    try {
      await api.post("/queue/token", { patientId: queuePatientId, departmentId: "CDSS", queueType: "CDSS", priority: "NORMAL" });
      setWorkflowPopup("");
      setQueuePatientId("");
      notify("Patient added to the CDSS waiting list.");
    } catch (error: any) {
      notify(error?.response?.data?.message || "Patient could not be queued.", "error");
    } finally {
      setSaving("");
    }
  };

  return (
    <main className="cdss-page">
      <header className="cdss-header">
        <div>
          <span>CLINICAL DECISION SUPPORT</span>
          <h1>Point-of-care safety checks</h1>
          <p>Drug-allergy cross-reactivity, drug-drug interactions, guideline prompts, and dose safety checks in one clinical review screen.</p>
        </div>
        <div className="cdss-actions">
          <button className="cdss-btn ghost" type="button" onClick={() => void loadData()} disabled={loading}><RefreshCw size={17} /> Refresh</button>
          <button className="cdss-btn blue" type="button" onClick={() => void evaluate()} disabled={saving === "evaluate"}><Stethoscope size={17} /> Run Clinical Review</button>
          <button className="cdss-btn green" type="button" onClick={() => setModal("rule")} disabled={saving === "rule"}><Save size={17} /> New Rule</button>
        </div>
      </header>

      <aside className="cdss-sidebar" aria-label="CDSS workspace navigation">
        <div className="cdss-sidebar-heading"><Brain size={17} /><span>CDSS WORKSPACE</span></div>
        <button type="button" className="cdss-sidebar-btn is-primary" onClick={() => jumpTo("cdss-review-input")}><UserRoundSearch size={16} /> Clinical Review</button>
        <button type="button" className="cdss-sidebar-btn" onClick={() => jumpTo("cdss-alert-worklist")}><ListChecks size={16} /> Alert Worklist</button>
        <button type="button" className="cdss-sidebar-btn" onClick={() => setModal("rule")}><Settings2 size={16} /> Rule Configuration</button>
        <button type="button" className="cdss-sidebar-btn" onClick={() => void loadData()} disabled={loading}><RefreshCw size={16} /> Refresh Data</button>
        <button type="button" className="cdss-sidebar-btn is-clinical" onClick={() => setWorkflowPopup("monitor")}><UserRoundSearch size={16} /> Monitor Patient</button>
        <button type="button" className="cdss-sidebar-btn is-clinical" onClick={() => void openWaitingList()}><ClipboardCheck size={16} /> Open Waiting List</button>
        <button type="button" className="cdss-sidebar-btn is-clinical" onClick={() => setWorkflowPopup("queue")}><ClipboardCheck size={16} /> Queue Patient</button>
      </aside>

      {workflowPopup ? <div className="cdss-workflow-backdrop" role="presentation" onClick={() => setWorkflowPopup("")}>
        <section className="cdss-workflow-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
          <header><div><span>CDSS WORKFLOW</span><h2>{workflowPopup === "monitor" ? "Monitor Patient" : workflowPopup === "waiting" ? "Open Waiting List" : "Queue Patient"}</h2><p>{workflowPopup === "monitor" ? "Select a registered patient to open a safety review." : workflowPopup === "waiting" ? "Patients currently queued to the CDSS service point." : "Route a registered patient to the CDSS review queue."}</p></div><button type="button" onClick={() => setWorkflowPopup("")} aria-label="Close workflow popup"><X size={17} /></button></header>
          <div className="cdss-workflow-body">
            {workflowPopup === "monitor" ? <div className="cdss-workflow-list">{patients.length ? patients.slice(0, 40).map((patient) => <button type="button" key={patient.id} onClick={() => { setReviewForm((state) => ({ ...state, patientId: patient.id })); setWorkflowPopup(""); jumpTo("cdss-review-input"); }}><strong>{[patient.firstName, patient.lastName].filter(Boolean).join(" ") || patient.name || "Unnamed patient"}</strong><span>{patient.patientCode || patient.mrn || patient.id}</span></button>) : <p className="cdss-note">No registered patients were returned.</p>}</div> : null}
            {workflowPopup === "waiting" ? <div className="cdss-workflow-list">{workflowLoading ? <p className="cdss-note">Loading waiting list...</p> : waitingRows.length ? waitingRows.map((row, index) => <div key={row.id || row.tokenId || index}><strong>{row.patientName || row.name || row.patientCode || row.patientId}</strong><span>{row.tokenNumber || "-"} · {row.status || "WAITING"}</span></div>) : <p className="cdss-note">No patients are waiting for CDSS.</p>}</div> : null}
            {workflowPopup === "queue" ? <form className="cdss-workflow-form" onSubmit={queueSelectedPatient}><label><span>Registered patient</span><select value={queuePatientId} onChange={(event) => setQueuePatientId(event.target.value)} required><option value="">Select a patient</option>{patientOptions.map((patient) => <option key={patient.id} value={patient.id}>{patient.label}</option>)}</select></label><footer><button type="button" className="cdss-btn ghost" onClick={() => setWorkflowPopup("")}>Cancel</button><button type="submit" className="cdss-btn blue" disabled={saving === "queue-patient"}>{saving === "queue-patient" ? "Queueing..." : "Queue Patient"}</button></footer></form> : null}
          </div>
        </section>
      </div> : null}

      <section className="cdss-filter">
        <label className="cdss-search"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search rules, alerts, severity, patient..." /></label>
        <select value={severity} onChange={(event) => setSeverity(event.target.value)}>
          <option value="ALL">All severities</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="MODERATE">Moderate</option>
          <option value="LOW">Low</option>
          <option value="WARNING">Warning</option>
          <option value="INFO">Information</option>
          <option value="PASS">Pass</option>
        </select>
      </section>

      <section className="cdss-stats">
        {metrics.map((metric) => (
          <article className="cdss-stat" style={{ borderLeftColor: metric.color }} key={metric.label}>
            <div>
              <span>{metric.label}</span>
              <strong>{metric.value as any}</strong>
            </div>
            <i style={{ color: metric.color }}>{metric.icon}</i>
          </article>
        ))}
      </section>

      <section className="cdss-layout">
        <div className="cdss-main">
          <section className="cdss-panel" id="cdss-review-input">
            <div className="cdss-panel-head">
              <div>
                <h2>Clinical Review Input</h2>
                <p>Enter the patient and medication details once. The backend checks allergy risk, interactions, guideline prompts, and dose alerts together.</p>
              </div>
            </div>
            <form className="cdss-form" onSubmit={evaluate}>
              <label>
                <span>Registered Patient</span>
                <select value={reviewForm.patientId} onChange={(event) => setReviewForm((state) => ({ ...state, patientId: event.target.value }))} required>
                  <option value="">{patients.length ? "Select a registered patient" : "No patients available"}</option>
                  {patientOptions.map((patient) => <option key={patient.id} value={patient.id}>{patient.label}</option>)}
                </select>
                <small className="cdss-field-help">Select a registered patient; the review reads allergies, encounters, vitals, laboratory data, and prescriptions from the backend.</small>
              </label>
              <label>
                <span>Trigger Event</span>
                <select value={reviewForm.triggerEvent} onChange={(event) => setReviewForm((state) => ({ ...state, triggerEvent: event.target.value }))}>
                  <option value="PRESCRIBE">Prescribe</option>
                  <option value="DISPENSE">Dispense</option>
                  <option value="ADMISSION">Admission</option>
                  <option value="DISCHARGE">Discharge</option>
                </select>
              </label>
              <label>
                <span>New Medication</span>
                <input value={reviewForm.medication} onChange={(event) => setReviewForm((state) => ({ ...state, medication: event.target.value }))} placeholder="e.g. Ceftriaxone 1g" />
              </label>
              <label>
                <span>Current Medications</span>
                <input value={reviewForm.currentMedications} onChange={(event) => setReviewForm((state) => ({ ...state, currentMedications: event.target.value }))} placeholder="Comma-separated active medicines" />
              </label>
              <label>
                <span>Diagnosis / Indication</span>
                <input value={reviewForm.diagnosis} onChange={(event) => setReviewForm((state) => ({ ...state, diagnosis: event.target.value }))} placeholder="e.g. Community-acquired pneumonia" />
              </label>
              <label>
                <span>Chief Complaint</span>
                <input value={reviewForm.chiefComplaint} onChange={(event) => setReviewForm((state) => ({ ...state, chiefComplaint: event.target.value }))} placeholder="Optional supporting note" />
              </label>
              <label>
                <span>Dose</span>
                <input value={reviewForm.dose} onChange={(event) => setReviewForm((state) => ({ ...state, dose: event.target.value }))} placeholder="e.g. 1000 mg" />
              </label>
              <label>
                <span>Weight (kg)</span>
                <input value={reviewForm.weightKg} onChange={(event) => setReviewForm((state) => ({ ...state, weightKg: event.target.value }))} placeholder="Paediatric dosing support" />
              </label>
              <label>
                <span>eGFR</span>
                <input value={reviewForm.eGfr} onChange={(event) => setReviewForm((state) => ({ ...state, eGfr: event.target.value }))} placeholder="Renal dosing support" />
              </label>
              <label><span>Respiratory rate</span><input inputMode="numeric" value={reviewForm.respiratoryRate} onChange={(event) => setReviewForm((state) => ({ ...state, respiratoryRate: event.target.value }))} placeholder="breaths/min" /></label>
              <label><span>Oxygen saturation</span><input inputMode="numeric" value={reviewForm.oxygenSaturation} onChange={(event) => setReviewForm((state) => ({ ...state, oxygenSaturation: event.target.value }))} placeholder="SpO₂ %" /></label>
              <label><span>Systolic BP</span><input inputMode="numeric" value={reviewForm.bpSystolic} onChange={(event) => setReviewForm((state) => ({ ...state, bpSystolic: event.target.value }))} placeholder="mmHg" /></label>
              <label><span>Pulse</span><input inputMode="numeric" value={reviewForm.pulse} onChange={(event) => setReviewForm((state) => ({ ...state, pulse: event.target.value }))} placeholder="beats/min" /></label>
              <label><span>Temperature</span><input inputMode="decimal" value={reviewForm.temperature} onChange={(event) => setReviewForm((state) => ({ ...state, temperature: event.target.value }))} placeholder="°C" /></label>
              <label className="wide">
                <span>Clinical notes / justification</span>
                <textarea value={reviewForm.notes} onChange={(event) => setReviewForm((state) => ({ ...state, notes: event.target.value }))} placeholder="Document clinical context or override reasoning..." />
              </label>
              <label className="wide">
                <span>Override justification</span>
                <textarea value={reviewForm.justification} onChange={(event) => setReviewForm((state) => ({ ...state, justification: event.target.value }))} placeholder="Required when a hard stop must be overridden." />
              </label>
              <footer>
                <button type="button" className="cdss-btn ghost" onClick={() => setReviewForm(defaultReviewForm)}>Reset</button>
                <button type="submit" className="cdss-btn blue" disabled={saving === "evaluate"}>{saving === "evaluate" ? "Running..." : "Run CDSS Review"}</button>
              </footer>
            </form>
          </section>

          <section className="cdss-panel">
            <div className="cdss-panel-head">
              <div>
                <h2>Generated Clinical Checks</h2>
                <p>All checks run together. Hard stops must be resolved before the order can continue.</p>
              </div>
              <span className="cdss-chip">{review?.patient?.name || "No patient reviewed"}</span>
            </div>
            <div className="cdss-check-grid">
              <CheckCard title="Drug-Allergy" rows={review?.allergyChecks || []} emptyText="Run a review to see allergy cross-reactivity checks." />
              <CheckCard title="Interactions" rows={review?.interactionChecks || []} emptyText="Run a review to see drug-drug interaction checks." />
              <CheckCard title="Guidelines" rows={review?.guidelineChecks || []} emptyText="Run a review to see evidence-based guideline prompts." />
              <CheckCard title="Dose Alerts" rows={review?.doseChecks || []} emptyText="Run a review to see paediatric, renal, and hepatic dosing checks." />
              <CheckCard title="Early Warning" rows={review?.earlyWarningChecks || []} emptyText="Run a review to screen observations for deterioration." />
              <CheckCard title="Sepsis Screening" rows={review?.sepsisChecks || []} emptyText="Run a review to screen infection and organ-dysfunction signals." />
            </div>
          </section>

          <section className="cdss-panel" id="cdss-alert-worklist">
            <div className="cdss-panel-head">
              <div>
                <h2>Saved CDSS Rules</h2>
                <p>Clinical safety rules and guideline prompts configured for this facility.</p>
              </div>
            </div>
            <div className="cdss-table-wrap">
              <table className="cdss-table">
                <thead>
                  <tr>
                    <th>Rule</th>
                    <th>Trigger</th>
                    <th>Severity</th>
                    <th>Guideline</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRules.length ? filteredRules.map((rule) => (
                    <tr key={rule.id} onClick={() => setSelectedAlert((current) => current?.ruleId === rule.id ? current : alerts.find((alert) => alert.ruleId === rule.id) || current)}>
                      <td><strong>{rule.ruleName}</strong><small>{rule.alertMessage}</small></td>
                      <td>{rule.triggerEvent}</td>
                      <td><SeverityPill value={rule.severity} /></td>
                      <td>{rule.guidelineSource || "-"}</td>
                    </tr>
                  )) : <tr><td colSpan={4} className="cdss-empty">No CDSS rules found.</td></tr>}
                </tbody>
              </table>
            </div>
          </section>

          <section className="cdss-panel">
            <div className="cdss-panel-head">
              <div>
                <h2>Recent CDSS Alerts</h2>
                <p>Alert history from the rule engine. Review and document override reasons here.</p>
              </div>
            </div>
            <div className="cdss-table-wrap">
              <table className="cdss-table">
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Rule</th>
                    <th>Action</th>
                    <th>Fired</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAlerts.length ? filteredAlerts.map((alert) => (
                    <tr key={alert.id} onClick={() => setSelectedAlert(alert)}>
                      <td><strong>{alert.patientId}</strong><small>{alert.overrideReason || "No override reason"}</small></td>
                      <td>{alert.rule?.ruleName || alert.ruleId}</td>
                      <td>{alert.actionTaken || "-"}</td>
                      <td>{alert.firedAt ? new Date(alert.firedAt).toLocaleString() : "-"}</td>
                    </tr>
                  )) : <tr><td colSpan={4} className="cdss-empty">No alert history yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <aside className="cdss-side">
          <section className="cdss-selected">
            <span>Selected Alert</span>
            <h2>{selectedAlert?.rule?.ruleName || selectedAlert?.ruleId || "No alert selected"}</h2>
            <dl>
              <div><dt>Patient</dt><dd>{selectedAlert?.patientId || "-"}</dd></div>
              <div><dt>Action</dt><dd>{selectedAlert?.actionTaken || "-"}</dd></div>
              <div><dt>Severity</dt><dd>{selectedAlert?.rule?.severity || "-"}</dd></div>
            </dl>
            <p>{selectedAlert?.triggerContext?.check?.message || "Select an alert or run a review to inspect the check details."}</p>
            {selectedAlert?.id ? <div className="cdss-alert-actions">
              <button type="button" className="cdss-btn ghost" onClick={() => void recordAlertAction("ACKNOWLEDGED")} disabled={saving.startsWith("alert-")}>Acknowledge</button>
              <button type="button" className="cdss-btn blue" onClick={() => void recordAlertAction("ACCEPTED")} disabled={saving.startsWith("alert-")}>Accept</button>
              <button type="button" className="cdss-btn danger" onClick={() => void recordAlertAction("OVERRIDDEN")} disabled={saving.startsWith("alert-")}>Override</button>
              <button type="button" className="cdss-btn ghost" onClick={() => void recordAlertAction("DISMISSED")} disabled={saving.startsWith("alert-")}>Dismiss</button>
              <button type="button" className="cdss-btn ghost" onClick={() => void recordAlertAction("CLOSED")} disabled={saving.startsWith("alert-")}>Close</button>
            </div> : null}
          </section>

          <section className="cdss-panel">
            <div className="cdss-panel-head">
              <div>
                <h2>Alert Details</h2>
                <p>Clinical reasoning, management guidance, and alert payload.</p>
              </div>
            </div>
            <div className="cdss-detail-list">
              {selectedAlert?.triggerContext?.check ? (
                <>
                  <DetailRow label="Type" value={selectedAlert.triggerContext.check.type} />
                  <DetailRow label="Message" value={selectedAlert.triggerContext.check.message} />
                  <DetailRow label="Recommendation" value={selectedAlert.triggerContext.check.recommendation || "-"} />
                  <DetailRow label="Mechanism" value={selectedAlert.triggerContext.check.mechanism || "-"} />
                  <DetailRow label="Clinical effect" value={selectedAlert.triggerContext.check.clinicalEffect || "-"} />
                  <DetailRow label="Management" value={selectedAlert.triggerContext.check.management || "-"} />
                </>
              ) : (
                <p className="cdss-note">Run a review or click an alert to see the rule payload.</p>
              )}
            </div>
          </section>
        </aside>
      </section>

      {modal === "rule" ? (
        <Modal title="Create CDSS Rule" subtitle="Store a new clinical safety rule for this facility." onClose={() => setModal("")}>
          <form className="cdss-modal-form" onSubmit={saveRule}>
            <label><span>Rule name</span><input value={ruleForm.ruleName} onChange={(event) => setRuleForm((state) => ({ ...state, ruleName: event.target.value }))} placeholder="e.g. CAP severity prompt" /></label>
            <label><span>Trigger event</span><select value={ruleForm.triggerEvent} onChange={(event) => setRuleForm((state) => ({ ...state, triggerEvent: event.target.value }))}><option value="PRESCRIBE">Prescribe</option><option value="DISPENSE">Dispense</option><option value="ADMISSION">Admission</option><option value="DISCHARGE">Discharge</option></select></label>
            <label><span>Severity</span><select value={ruleForm.severity} onChange={(event) => setRuleForm((state) => ({ ...state, severity: event.target.value }))}><option value="INFO">Informational</option><option value="LOW">Low</option><option value="MODERATE">Moderate</option><option value="HIGH">High</option><option value="WARNING">Warning</option><option value="CRITICAL">Critical</option></select></label>
            <label className="wide"><span>Alert message</span><textarea required value={ruleForm.alertMessage} onChange={(event) => setRuleForm((state) => ({ ...state, alertMessage: event.target.value }))} placeholder="Explain what was detected and why it matters" /></label>
            <label className="wide"><span>Guideline reference</span><textarea value={ruleForm.guidelineRef} onChange={(event) => setRuleForm((state) => ({ ...state, guidelineRef: event.target.value }))} /></label>
            <footer>
              <button type="button" className="cdss-btn ghost" onClick={() => setModal("")}>Cancel</button>
              <button type="submit" className="cdss-btn green" disabled={saving === "rule"}>{saving === "rule" ? "Saving..." : "Save Rule"}</button>
            </footer>
          </form>
        </Modal>
      ) : null}

      {notice ? <div className={`module-notice-toast is-${notice.tone}`} role="status" aria-live="polite"><div><strong>{notice.tone === "error" ? "CDSS Error" : notice.tone === "warning" ? "CDSS Attention" : "CDSS Update"}</strong><span>{notice.text}</span></div><button type="button" className="module-notice-close" onClick={() => setNotice(null)} aria-label="Dismiss notification"><X size={14} /></button></div> : null}
      {loading ? <div className="cdss-loading">Loading CDSS rules...</div> : null}
    </main>
  );
}

function CheckCard({ title, rows, emptyText }: { title: string; rows: any[]; emptyText: string }) {
  const top = rows?.[0];
  return (
    <article className="cdss-check-card">
      <header>
        <h3>{title}</h3>
        <span>{rows?.length || 0} check(s)</span>
      </header>
      <div className="cdss-check-list">
        {rows?.length ? rows.slice(0, 4).map((row, index) => (
          <div className="cdss-check-item" key={`${title}-${index}`}>
            <strong>{row.title || row.ruleName || `${title} ${index + 1}`}</strong>
            <span>{row.message || row.recommendation || row.severity || "-"}</span>
            <b className={`tone-${String(row.status || row.severity || "info").toLowerCase()}`}>{row.status || row.severity || "INFO"}</b>
          </div>
        )) : <p className="cdss-note">{emptyText}</p>}
      </div>
      {top ? <footer>{top.recommendation || top.message || "Clinical review pending."}</footer> : null}
    </article>
  );
}

function SeverityPill({ value }: { value: string }) {
  const tone = String(value || "INFO").toLowerCase();
  return <span className={`cdss-pill ${tone}`}>{value || "INFO"}</span>;
}

function DetailRow({ label, value }: { label: string; value: any }) {
  return (
    <div className="cdss-detail-row">
      <span>{label}</span>
      <strong>{typeof value === "object" ? JSON.stringify(value) : String(value || "-")}</strong>
    </div>
  );
}

function Modal({ title, subtitle, children, onClose }: { title: string; subtitle: string; children: ReactNode; onClose: () => void }) {
  return (
    <div className="cdss-modal-backdrop" role="presentation" onClick={onClose}>
      <section className="cdss-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <header>
          <div>
            <span>CDSS</span>
            <h2>{title}</h2>
            <p>{subtitle}</p>
          </div>
          <button type="button" onClick={onClose}><X size={16} /></button>
        </header>
        <div className="cdss-modal-body">{children}</div>
      </section>
    </div>
  );
}

