import type { FormEvent, ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Baby,
  Calculator,
  ChartNoAxesCombined,
  CheckCircle2,
  HeartPulse,
  Maximize2,
  Minimize2,
  RefreshCw,
  Search,
  Send,
  ShieldAlert,
  Syringe,
  X,
} from "lucide-react";
import { api } from "../lib/api";
import { useLiveRefresh } from "../lib/liveRefresh";

const today = new Date().toISOString().slice(0, 10);

const emptyDose = {
  patientId: "",
  drug: "Amoxicillin",
  weightKg: "",
  enteredDoseMg: "",
};

const emptyResus = {
  patientId: "",
  weightKg: "",
  ageYears: "2",
};

const emptyImci = {
  patientId: "",
  encounterId: "",
  ageMonths: "",
  dangerSigns: "",
  cough: false,
  fastBreathing: false,
  chestIndrawing: false,
  stridor: false,
  diarrhoea: false,
  lethargic: false,
  sunkenEyes: false,
  unableToDrink: false,
  skinPinchVerySlow: false,
  fever: false,
  malariaRisk: true,
  earProblem: false,
  mastoidTenderness: false,
  muacCm: "",
  oedema: false,
  vaccinationChecked: true,
};

const emptyGrowth = {
  patientId: "",
  encounterId: "",
  measurementDate: today,
  weightKg: "",
  heightCm: "",
  headCircumferenceCm: "",
  muacCm: "",
  oedema: false,
};

const emptyImmunisation = {
  patientId: "",
  vaccineName: "DPT-HepB-Hib",
  doseNumber: "1",
  administeredDate: today,
  batchNumber: "",
  expiryDate: "",
  site: "",
  route: "",
  adverseReaction: "",
};

const fmtDate = (value: unknown) => {
  const date = new Date(String(value || ""));
  if (!Number.isFinite(date.getTime())) return "-";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
};
const patientName = (row: any) => [row?.firstName, row?.middleName, row?.lastName].filter(Boolean).join(" ") || row?.patientCode || row?.mrn || "Unnamed patient";

const pretty = (value: unknown) =>
  String(value || "")
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());

const unwrapItems = (value: any): any[] => {
  const data = value?.data ?? value;
  if (Array.isArray(data)) return data;
  for (const candidate of [data?.items, data?.rows, data?.results, data?.data]) {
    if (Array.isArray(candidate)) return candidate;
    if (candidate && typeof candidate === "object") {
      const nested = unwrapItems(candidate);
      if (nested.length) return nested;
    }
  }
  return [];
};
const unwrapObject = (value: any) => value?.data?.data || value?.data || value || {};

export default function PaediatricsView() {
  const [dashboard, setDashboard] = useState<any>({});
  const [growth, setGrowth] = useState<any[]>([]);
  const [doseTable, setDoseTable] = useState<any[]>([]);
  const [tracker, setTracker] = useState<any>(null);
  const [doseResult, setDoseResult] = useState<any>(null);
  const [resusResult, setResusResult] = useState<any>(null);
  const [imciResult, setImciResult] = useState<any>(null);
  const [growthResult, setGrowthResult] = useState<any>(null);
  const [card, setCard] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<"" | "dose" | "resus" | "imci" | "growth" | "immunisation" | "tracker">("");
  const [doseForm, setDoseForm] = useState(emptyDose);
  const [resusForm, setResusForm] = useState(emptyResus);
  const [imciForm, setImciForm] = useState(emptyImci);
  const [growthForm, setGrowthForm] = useState(emptyGrowth);
  const [immunisationForm, setImmunisationForm] = useState(emptyImmunisation);
  const [notice, setNotice] = useState<{ tone: "success" | "warning" | "error"; text: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");
  const [patients, setPatients] = useState<any[]>([]);
  const [workflowPopup, setWorkflowPopup] = useState<"monitor" | "waiting" | "queue" | "">("");
  const [waitingRows, setWaitingRows] = useState<any[]>([]);
  const [workflowLoading, setWorkflowLoading] = useState(false);
  const [queuePatientId, setQueuePatientId] = useState("");
  const [waitingCheckInDate, setWaitingCheckInDate] = useState(today);

  const showNotice = (text: string, tone: "success" | "warning" | "error" = "success") => {
    setNotice({ tone, text });
    window.setTimeout(() => setNotice((current) => (current?.text === text ? null : current)), tone === "success" ? 3200 : 5200);
  };

  const safeGet = async (url: string, label: string, fallback: any, config?: Record<string, any>) => {
    try {
      return await api.get(url, config);
    } catch (error: any) {
      return { data: fallback, __label: label, __error: error?.response?.data?.message || error?.message || "Request failed", __status: error?.response?.status };
    }
  };

  const load = async () => {
    setLoading(true);
    try {
      const [dashRes, growthRes, doseRes, patientRes] = await Promise.all([
        safeGet("/paediatrics/dashboard", "dashboard", {}),
        safeGet("/paediatrics/growth", "growth records", { items: [] }, { params: { search: search.trim() || undefined, limit: 500 } }),
        safeGet("/paediatrics/dose-table", "dose table", { items: [] }),
        safeGet("/patients", "patients", [], { params: { limit: 500 } }),
      ]);
      const failed = [dashRes, growthRes, doseRes, patientRes].filter((response: any) => response.__error);
      if (failed.length) showNotice(`${failed.map((response: any) => `${response.__label}${response.__status ? ` (${response.__status})` : ""}`).join(", ")} could not be loaded. Check your connection or permissions.`, "error");
      setDashboard(unwrapObject(dashRes.data));
      setGrowth(unwrapItems(growthRes.data));
      const doseRows = unwrapItems(doseRes.data);
      setDoseTable(doseRows);
      setDoseForm((current) => doseRows.length && !doseRows.some((row: any) => row.drug === current.drug) ? { ...current, drug: doseRows[0].drug } : current);
      setPatients(unwrapItems(patientRes.data));
    } catch (error: any) {
      showNotice(error?.response?.data?.message || "Paediatrics data could not be loaded.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);
  useLiveRefresh(load, { intervalMs: 60000 });

  const patientLabel = useCallback((patientId: string, rows = patients) => {
    const patient = rows.find((row) => String(row.id || "") === String(patientId || ""));
    return patient ? `${patientName(patient)} | ${patient.patientCode || patient.mrn || "No MRN"}` : patientId || "Unknown patient";
  }, [patients]);

  useEffect(() => {
    const handleSidebarAction = (event: Event) => {
      const action = (event as CustomEvent<{ action?: string }>).detail?.action;
      if (action === "monitor-patient") setWorkflowPopup("monitor");
      if (action === "queue-patient") setWorkflowPopup("queue");
    };
    const handleWaitingList = (event: Event) => {
      const detail = (event as CustomEvent<{ moduleKey?: string }>).detail;
      if (detail?.moduleKey !== "paediatrics") return;
      setWorkflowPopup("waiting");
      setWorkflowLoading(true);
      api.get("/opd/queue/board", { params: { departmentId: "PAEDIATRICS" } })
        .then((response) => setWaitingRows(unwrapItems(response.data)))
        .catch(() => { setWaitingRows([]); showNotice("Paediatrics waiting list could not be loaded.", "error"); })
        .finally(() => setWorkflowLoading(false));
    };
    window.addEventListener("hmis:paediatrics-sidebar-action", handleSidebarAction);
    window.addEventListener("hmis:open-module-waiting-list", handleWaitingList);
    return () => {
      window.removeEventListener("hmis:paediatrics-sidebar-action", handleSidebarAction);
      window.removeEventListener("hmis:open-module-waiting-list", handleWaitingList);
    };
  }, []);

  const loadedTotals = dashboard?.totals || {};
  const recentEvents = Array.isArray(dashboard?.recentEvents) ? dashboard.recentEvents : [];
  const totals = {
    children: loadedTotals.children ?? patients.length,
    doseAlerts: loadedTotals.doseAlerts ?? recentEvents.filter((row: any) => String(row.eventName || "").includes("dose_range_alert")).length,
    imciPink: loadedTotals.imciPink ?? recentEvents.filter((row: any) => String(row.eventName || "").includes("imci_pink")).length,
    growthRecords: loadedTotals.growthRecords ?? growth.length,
    nutritionAlerts: loadedTotals.nutritionAlerts ?? growth.filter((row) => ["SEVERE_ACUTE_MALNUTRITION", "MODERATE_ACUTE_MALNUTRITION", "STUNTING_RISK"].includes(String(row.nutritionalStatus || "").toUpperCase())).length,
    immunisations: loadedTotals.immunisations ?? 0,
  };
  const stats = [
    { label: "Children", value: totals.children ?? 0, icon: Baby },
    { label: "Dose Alerts", value: totals.doseAlerts ?? 0, icon: ShieldAlert },
    { label: "IMCI Pink", value: totals.imciPink ?? 0, icon: AlertTriangle },
    { label: "Growth Records", value: totals.growthRecords ?? growth.length, icon: ChartNoAxesCombined },
    { label: "Nutrition Alerts", value: totals.nutritionAlerts ?? 0, icon: HeartPulse },
    { label: "Vaccines Given", value: totals.immunisations ?? 0, icon: Syringe },
  ];
  const filteredGrowth = useMemo(() => {
    const q = search.trim().toLowerCase();
    return growth.filter((row) => !q || [patientLabel(row.patientId), row.patientId, row.nutritionalStatus, row.measuredBy, row.encounterId].join(" ").toLowerCase().includes(q));
  }, [growth, patientLabel, search]);
  const growthChartRows = useMemo(() => {
    const patientId = String(growthResult?.patientId || growthForm.patientId || "").trim();
    return growth
      .filter((row) => !patientId || String(row.patientId) === patientId)
      .filter((row) => Number(row.weightKg) > 0 || Number(row.heightCm) > 0)
      .sort((a, b) => new Date(String(a.measurementDate || 0)).getTime() - new Date(String(b.measurementDate || 0)).getTime())
      .slice(-12);
  }, [growth, growthForm.patientId, growthResult?.patientId]);

  const checkDose = async (event: FormEvent) => {
    event.preventDefault();
    setSaving("dose");
    try {
      const res = await api.post("/paediatrics/dose-check", { ...doseForm, weightKg: Number(doseForm.weightKg), enteredDoseMg: Number(doseForm.enteredDoseMg) || undefined });
      const result = unwrapObject(res.data);
      setDoseResult(result);
      showNotice(result?.status === "ALERT" ? "Dose range alert fired." : "Dose is within safe paediatric range.", result?.status === "ALERT" ? "warning" : "success");
    } catch (error: any) {
      showNotice(error?.response?.data?.message || "Dose check failed.", "error");
    } finally {
      setSaving("");
    }
  };

  const calculateResus = async (event: FormEvent) => {
    event.preventDefault();
    setSaving("resus");
    try {
      const res = await api.post("/paediatrics/resuscitation-calculator", { ...resusForm, weightKg: Number(resusForm.weightKg), ageYears: Number(resusForm.ageYears) });
      setResusResult(res.data);
      showNotice("Resuscitation doses calculated for this child.");
    } catch (error: any) {
      showNotice(error?.response?.data?.message || "Resuscitation calculation failed.", "error");
    } finally {
      setSaving("");
    }
  };

  const saveImci = async (event: FormEvent) => {
    event.preventDefault();
    setSaving("imci");
    try {
      const res = await api.post("/paediatrics/imci-assessments", { ...imciForm, ageMonths: Number(imciForm.ageMonths) || undefined, muacCm: Number(imciForm.muacCm) || undefined });
      setImciResult(res.data);
      setModal("");
      await load();
      showNotice(`IMCI completed: ${pretty(res.data?.finalColour)} classification.`);
    } catch (error: any) {
      showNotice(error?.response?.data?.message || "IMCI assessment could not be saved.", "error");
    } finally {
      setSaving("");
    }
  };

  const saveGrowth = async (event: FormEvent) => {
    event.preventDefault();
    setSaving("growth");
    try {
      const res = await api.post("/paediatrics/growth", {
        ...growthForm,
        weightKg: Number(growthForm.weightKg),
        heightCm: Number(growthForm.heightCm),
        headCircumferenceCm: Number(growthForm.headCircumferenceCm) || undefined,
        muacCm: Number(growthForm.muacCm) || undefined,
      });
      setGrowthResult(res.data);
      setModal("");
      await load();
      showNotice(`Growth plotted: ${pretty(res.data?.nutritionalStatus)}.`);
    } catch (error: any) {
      showNotice(error?.response?.data?.message || "Growth measurement could not be saved.", "error");
    } finally {
      setSaving("");
    }
  };

  const loadTracker = async (patientId?: string) => {
    const id = (patientId || immunisationForm.patientId || growthForm.patientId || doseForm.patientId).trim();
    if (!id) {
      showNotice("Enter a patient ID before opening the tracker.", "warning");
      return;
    }
    setSaving("tracker");
    try {
      const [trackerRes, cardRes] = await Promise.all([
        api.get(`/paediatrics/immunisations/${id}/tracker`),
        api.get(`/paediatrics/immunisations/${id}/card`).catch(() => ({ data: null })),
      ]);
      const nextTracker = unwrapObject(trackerRes.data);
      setTracker(nextTracker);
      setCard(cardRes.data ? unwrapObject(cardRes.data) : null);
      setImmunisationForm((current) => ({ ...current, patientId: id }));
      setModal("tracker");
    } catch (error: any) {
      showNotice(error?.response?.data?.message || "Immunisation tracker could not be loaded.", "error");
    } finally {
      setSaving("");
    }
  };

  const saveImmunisation = async (event: FormEvent) => {
    event.preventDefault();
    setSaving("immunisation");
    try {
      const res = await api.post("/paediatrics/immunisations", { ...immunisationForm, doseNumber: Number(immunisationForm.doseNumber) });
      await loadTracker(immunisationForm.patientId);
      setModal("tracker");
      showNotice(res.data?.stock?.deducted ? "Vaccine recorded and inventory deducted." : "Vaccine recorded. No matching stock item was found to deduct.", res.data?.stock?.deducted ? "success" : "warning");
    } catch (error: any) {
      showNotice(error?.response?.data?.message || "Immunisation could not be recorded.", "error");
    } finally {
      setSaving("");
    }
  };

  const queueSelectedPatient = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!queuePatientId) {
      showNotice("Select a registered patient before queueing.", "warning");
      return;
    }
    setSaving("queue-patient");
    try {
      await api.post("/opd/queue/token", { patientId: queuePatientId, departmentId: "PAEDIATRICS", queueType: "PAEDIATRICS", priority: "NORMAL" });
      setWorkflowPopup("");
      setQueuePatientId("");
      showNotice("Patient added to the Paediatrics waiting list.");
    } catch (error: any) {
      showNotice(error?.response?.data?.message || "Patient could not be queued.", "error");
    } finally {
      setSaving("");
    }
  };

  const checkInQueuedPatient = async (row: any) => {
    const tokenNumber = String(row?.tokenNumber || row?.token || "").trim();
    const patientId = String(row?.patientId || "").trim();
    if (!tokenNumber || !patientId) {
      showNotice("This waiting-list entry has no queue token or patient identifier.", "warning");
      return;
    }
    setSaving("check-in");
    try {
      const checkingOut = String(row?.status || "").toUpperCase() === "IN_SERVICE";
      await api.patch("/opd/queue/token/status", { tokenNumber, status: checkingOut ? "COMPLETED" : "IN_SERVICE", checkInDate: waitingCheckInDate, reason: checkingOut ? "Checked out from Paediatrics waiting list" : "Checked in from Paediatrics waiting list" });
      setWaitingRows((current) => checkingOut ? current.filter((item) => item.tokenNumber !== tokenNumber && item.token !== tokenNumber) : current.map((item) => (item.tokenNumber === tokenNumber || item.token === tokenNumber ? { ...item, status: "IN_SERVICE" } : item)));
      showNotice(`${row.patientName || row.patientCode || "Patient"} ${checkingOut ? "checked out from" : "checked in for"} Paediatrics.`);
    } catch (error: any) {
      showNotice(error?.response?.data?.message || "Patient check-in failed.", "error");
    } finally {
      setSaving("");
    }
  };

  return (
    <main className="paeds-page">
      <section className="paeds-header">
        <div>
          <span className="paeds-eyebrow"><Baby size={15} /> Paediatrics</span>
          <h1>Child Clinical Safety Workbench</h1>
          <p>Weight-based prescribing, IMCI decisions, WHO growth surveillance, and Kenya EPI immunisation tracking.</p>
        </div>
        <div className="paeds-actions">
          <button type="button" className="paeds-btn is-muted" onClick={() => void load()} disabled={loading}><RefreshCw size={15} /> Refresh</button>
          <button type="button" className="paeds-btn is-red" onClick={() => setModal("resus")}><HeartPulse size={15} /> Resus</button>
          <button type="button" className="paeds-btn is-blue" onClick={() => setModal("imci")}><Activity size={15} /> IMCI</button>
          <button type="button" className="paeds-btn is-green" onClick={() => setModal("dose")}><Calculator size={15} /> Dose Check</button>
        </div>
      </section>

      {notice ? <div className={`paeds-toast ${notice.tone}`} role="status" aria-live="polite"><span className="paeds-toast-icon" aria-hidden="true">{notice.tone === "success" ? <CheckCircle2 size={17} /> : <AlertTriangle size={17} />}</span><div><strong>Paediatrics</strong><span>{notice.text}</span></div><button type="button" aria-label="Dismiss notification" onClick={() => setNotice(null)}><X size={16} /></button></div> : null}

      <datalist id="paeds-patients">
        {patients.map((patient) => <option key={patient.id} value={patient.id}>{patientName(patient)} | {patient.patientCode || patient.mrn || "No MRN"}</option>)}
      </datalist>

      {workflowPopup ? (
        <div className="paeds-workflow-backdrop" role="presentation" onClick={() => setWorkflowPopup("")}>
          <section className="paeds-workflow-modal" role="dialog" aria-modal="true" aria-labelledby="paeds-workflow-title" onClick={(event) => event.stopPropagation()}>
            <header><div><span>PAEDIATRICS WORKSPACE</span><h2 id="paeds-workflow-title">{workflowPopup === "monitor" ? "Monitor patients" : workflowPopup === "waiting" ? "Paediatrics waiting list" : "Queue a patient"}</h2><p>{workflowPopup === "monitor" ? "Open a child-health workflow from the current system records." : workflowPopup === "waiting" ? "Review patients routed from other clinical services and check them in." : "Route a registered patient to the Paediatrics queue."}</p></div><button type="button" aria-label="Close workspace" onClick={() => setWorkflowPopup("")}><X size={17} /></button></header>
            <div className="paeds-workflow-body">
              {workflowPopup === "monitor" ? <div className="paeds-workflow-list">{growth.slice(0, 100).map((row) => <button key={row.id || `${row.patientId}-${row.measurementDate}`} type="button" onClick={() => { setSearch(row.patientId || ""); setWorkflowPopup(""); }}><strong>{patientLabel(row.patientId, patients)}</strong><span>Growth record · {fmtDate(row.measurementDate)} · {pretty(row.nutritionalStatus || "Normal")}</span></button>)}{!growth.length ? <p className="paeds-workflow-note">No paediatric records are currently available to monitor.</p> : null}</div> : null}
              {workflowPopup === "waiting" ? <div><label className="paeds-workflow-date"><span>Check-in date</span><input type="date" value={waitingCheckInDate} onChange={(event) => setWaitingCheckInDate(event.target.value)} /></label>{workflowLoading ? <p className="paeds-workflow-note">Loading waiting list...</p> : waitingRows.length ? <div className="paeds-workflow-list">{waitingRows.map((row, index) => <div className="paeds-workflow-list-item" key={row.id || row.tokenId || row.tokenNumber || index}><button type="button" onClick={() => { setSearch(row.patientId || ""); setWorkflowPopup(""); }}><strong>{row.patientName || row.patientCode || patientLabel(row.patientId, patients)}</strong><span>Token {row.tokenNumber || row.token || "-"} · {row.status || "WAITING"} · From {row.sourceModule || row.departmentName || row.departmentId || "another service"}</span></button><button type="button" className="paeds-workflow-checkin" disabled={saving === "check-in"} onClick={() => void checkInQueuedPatient(row)}>{saving === "check-in" ? "Updating..." : String(row.status || "").toUpperCase() === "IN_SERVICE" ? "Check Out" : "Check In"}</button></div>)}</div> : <p className="paeds-workflow-note">No patients are currently waiting for Paediatrics.</p>}</div> : null}
              {workflowPopup === "queue" ? <form className="paeds-workflow-form" onSubmit={queueSelectedPatient}><label><span>Registered patient</span><select required value={queuePatientId} onChange={(event) => setQueuePatientId(event.target.value)}><option value="">Select a patient</option>{patients.map((patient) => <option key={patient.id} value={patient.id}>{patientName(patient)} | {patient.patientCode || patient.mrn || "No MRN"}</option>)}</select></label><footer><button type="button" className="paeds-btn is-muted" onClick={() => setWorkflowPopup("")}>Cancel</button><button type="submit" className="paeds-btn is-blue" disabled={saving === "queue-patient"}><Send size={15} /> {saving === "queue-patient" ? "Queueing..." : "Queue Patient"}</button></footer></form> : null}
            </div>
          </section>
        </div>
      ) : null}

      <section className="paeds-stats">
        {stats.map((item) => {
          const Icon = item.icon;
          return <article key={item.label} className="paeds-stat"><Icon size={18} /><span>{item.label}</span><strong>{loading ? "..." : item.value}</strong></article>;
        })}
      </section>

      <section className="paeds-toolbar">
        <label><Search size={16} /><input placeholder="Search patient, growth status, encounter..." value={search} onChange={(event) => setSearch(event.target.value)} /></label>
        <button type="button" className="paeds-btn is-muted" onClick={() => void load()}>Apply Search</button>
        <button type="button" className="paeds-btn is-blue" onClick={() => setModal("growth")}><ChartNoAxesCombined size={15} /> Plot Growth</button>
        <button type="button" className="paeds-btn is-green" onClick={() => setModal("immunisation")}><Syringe size={15} /> Record Vaccine</button>
      </section>

      <section className="paeds-grid">
        <Panel title="Growth and Malnutrition Surveillance" subtitle="Each measurement calculates z-scores, longitudinal trajectory, and referral triggers.">
          <div className="paeds-table-wrap">
            <table className="paeds-table">
              <thead><tr><th>Patient</th><th>Date</th><th>Weight / Height</th><th>Z Scores</th><th>Status</th></tr></thead>
              <tbody>
                {filteredGrowth.length === 0 ? <tr><td colSpan={5} className="paeds-empty">{loading ? "Loading growth measurements..." : "No growth measurements found."}</td></tr> : filteredGrowth.map((row, index) => (
                  <tr key={row.id || `${row.patientId}-${row.measurementDate}-${index}`} onClick={() => setGrowthForm((current) => ({ ...current, patientId: row.patientId || current.patientId }))} title="Select this patient's growth history">
                    <td><strong>{patientLabel(row.patientId)}</strong><small>{row.encounterId || "No encounter"}</small></td>
                    <td>{fmtDate(row.measurementDate)}</td>
                    <td>{row.weightKg || "-"} kg / {row.heightCm || "-"} cm<small>MUAC {row.muacCm || "-"} cm</small></td>
                    <td>WFH {row.weightForHeightZscore ?? "-"} | HFA {row.heightForAgeZscore ?? "-"}</td>
                    <td><span className={`paeds-pill ${String(row.nutritionalStatus).toLowerCase()}`}>{pretty(row.nutritionalStatus || "Normal")}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {growthResult || growthChartRows.length ? <GrowthTrend rows={growthChartRows} patientLabel={patientLabel(growthResult?.patientId || growthForm.patientId)} /> : null}
        </Panel>

        <Panel title="Clinical Decisions" subtitle="Latest calculation outputs and alerts from the paediatric workflows.">
          <div className="paeds-decision-list">
            <Decision icon={ShieldAlert} title="Dose Safety" value={doseResult?.message || "Run a dose check to calculate the child-specific range."} tone={doseResult?.status === "ALERT" ? "red" : "green"} />
            <Decision icon={HeartPulse} title="Resuscitation" value={resusResult ? `${resusResult.weightKg} kg | ETT ${resusResult.airway?.cuffedEtTubeSize} cuffed | Bolus ${resusResult.fluids?.bolus}` : "Open the emergency calculator for pre-calculated drugs and airway sizes."} tone="blue" />
            <Decision icon={Activity} title="IMCI" value={imciResult ? `${pretty(imciResult.finalColour)}: ${imciResult.classifications?.map((row: any) => row.title).join(", ")}` : "Sequential danger-sign and symptom classifications appear here."} tone={imciResult?.finalColour === "PINK" ? "red" : imciResult?.finalColour === "YELLOW" ? "amber" : "green"} />
            <Decision icon={ChartNoAxesCombined} title="Nutrition" value={growthResult ? `${pretty(growthResult.nutritionalStatus)} | ${pretty(growthResult.trajectory)}` : "Wasting, SAM, and stunting alerts route automatically."} tone={String(growthResult?.nutritionalStatus).includes("SEVERE") ? "red" : "green"} />
          </div>
          {doseResult ? <div className={`paeds-dose-result ${doseResult.status === "ALERT" ? "is-alert" : "is-safe"}`}><strong>{doseResult.patientName || "Dose check"} · {doseResult.drug}</strong><span>{doseResult.message}</span><small>{doseResult.perDoseRange ? `Safe dose: ${doseResult.perDoseRange.minMg}-${doseResult.perDoseRange.maxMg} mg per dose · recommended ${doseResult.perDoseRange.recommendedMg} mg · every ${doseResult.intervalHours || "as directed"} hours` : doseResult.dailyRange ? `Safe daily dose: ${doseResult.dailyRange.minMgPerDay}-${doseResult.dailyRange.maxMgPerDay} mg/day · recommended ${doseResult.dailyRange.recommendedMgPerDay} mg/day · divided dose ${doseResult.dailyRange.dividedDoseMg} mg` : "No calculated range returned."}</small></div> : null}
        </Panel>
      </section>

      <section className="paeds-grid is-three">
        <Panel title="Dose Table" subtitle="Common paediatric and emergency drugs available in the prescribing check.">
          <div className="paeds-list compact">
            {doseTable.map((row) => <button type="button" key={row.drug} className="paeds-list-item paeds-dose-row" onClick={() => { setDoseForm((current) => ({ ...current, drug: row.drug })); setModal("dose"); }}><strong>{row.drug}</strong><small>{row.doseMgKgDay ? `${row.minMgKgDay}-${row.maxMgKgDay} mg/kg/day · target ${row.doseMgKgDay} mg/kg/day` : `${row.minMgKgDose}-${row.maxMgKgDose} mg/kg/dose · target ${row.doseMgKgDose} mg/kg/dose`} | {row.route}</small></button>)}
            {!doseTable.length ? <p className="paeds-empty">{loading ? "Loading dose table..." : "No dose reference data available."}</p> : null}
          </div>
        </Panel>
        <Panel title="Immunisation Tracker" subtitle="Colour-coded Kenya EPI state and printable child health card output.">
          <div className="paeds-inline-form">
            <input list="paeds-patients" placeholder="Patient ID" value={immunisationForm.patientId} onChange={(event) => setImmunisationForm({ ...immunisationForm, patientId: event.target.value })} />
            <button type="button" className="paeds-btn is-blue" onClick={() => void loadTracker()} disabled={saving === "tracker"}>Open Tracker</button>
          </div>
          <div className="paeds-tracker-preview">
            <span>Due: {tracker?.dueCount ?? 0}</span>
            <span>Overdue: {tracker?.overdueCount ?? 0}</span>
            <span>{card ? "Card ready" : "Card pending"}</span>
          </div>
        </Panel>
        <Panel title="Referral Automation" subtitle="Alerts created from growth, IMCI, and defaulter workflows.">
          <div className="paeds-list compact">
            {(dashboard?.recentEvents || []).slice(0, 6).map((row: any) => <article key={row.id} className="paeds-list-item"><strong>{pretty(row.eventName)}</strong><small>{row.patientName || row.patientId || "System"} | {fmtDate(row.createdAt)}</small></article>)}
            {!dashboard?.recentEvents?.length ? <p className="paeds-empty">No recent paediatric automation events.</p> : null}
          </div>
        </Panel>
      </section>

      {modal === "dose" ? (
        <PaedsModal tone="green" title="Weight-Based Dose Check" onClose={() => setModal("")}>
          <form className="paeds-form" onSubmit={checkDose}>
            <Field label="Patient ID"><input list="paeds-patients" required value={doseForm.patientId} onChange={(event) => setDoseForm({ ...doseForm, patientId: event.target.value })} /></Field>
            <Field label="Drug"><select value={doseForm.drug} onChange={(event) => setDoseForm({ ...doseForm, drug: event.target.value })}>{doseTable.map((row) => <option key={row.drug}>{row.drug}</option>)}</select></Field>
            <Field label="Current Weight Kg"><input type="number" min="0.1" step="0.1" required value={doseForm.weightKg} onChange={(event) => setDoseForm({ ...doseForm, weightKg: event.target.value })} /></Field>
            <Field label="Entered Dose Mg"><input type="number" min="0" step="0.1" value={doseForm.enteredDoseMg} onChange={(event) => setDoseForm({ ...doseForm, enteredDoseMg: event.target.value })} /></Field>
            <div className="paeds-modal-actions"><button type="button" className="paeds-btn is-muted" onClick={() => setModal("")}>Cancel</button><button type="submit" className="paeds-btn is-green" disabled={saving === "dose" || !doseTable.length}>{saving === "dose" ? "Checking..." : doseTable.length ? "Check Dose" : "Dose table unavailable"}</button></div>
          </form>
        </PaedsModal>
      ) : null}

      {modal === "resus" ? (
        <PaedsModal tone="red" title="Resuscitation Calculator" onClose={() => setModal("")}>
          <form className="paeds-form" onSubmit={calculateResus}>
            <Field label="Patient ID"><input list="paeds-patients" value={resusForm.patientId} onChange={(event) => setResusForm({ ...resusForm, patientId: event.target.value })} /></Field>
            <Field label="Weight Kg"><input type="number" step="0.1" required value={resusForm.weightKg} onChange={(event) => setResusForm({ ...resusForm, weightKg: event.target.value })} /></Field>
            <Field label="Age Years"><input type="number" step="0.1" value={resusForm.ageYears} onChange={(event) => setResusForm({ ...resusForm, ageYears: event.target.value })} /></Field>
            <div className="paeds-modal-actions"><button type="button" className="paeds-btn is-muted" onClick={() => setModal("")}>Cancel</button><button type="submit" className="paeds-btn is-red" disabled={saving === "resus"}>{saving === "resus" ? "Calculating..." : "Calculate"}</button></div>
          </form>
        </PaedsModal>
      ) : null}

      {modal === "imci" ? (
        <PaedsModal tone="blue" title="IMCI Assessment" onClose={() => setModal("")}>
          <form className="paeds-form" onSubmit={saveImci}>
            <Field label="Patient ID"><input list="paeds-patients" required value={imciForm.patientId} onChange={(event) => setImciForm({ ...imciForm, patientId: event.target.value })} /></Field>
            <Field label="Encounter ID"><input value={imciForm.encounterId} onChange={(event) => setImciForm({ ...imciForm, encounterId: event.target.value })} /></Field>
            <Field label="Age Months"><input type="number" value={imciForm.ageMonths} onChange={(event) => setImciForm({ ...imciForm, ageMonths: event.target.value })} /></Field>
            <Field label="Danger Signs" wide><input placeholder="Cannot drink, vomiting everything, convulsions..." value={imciForm.dangerSigns} onChange={(event) => setImciForm({ ...imciForm, dangerSigns: event.target.value })} /></Field>
            <Check label="Cough" checked={imciForm.cough} onChange={(value) => setImciForm({ ...imciForm, cough: value })} />
            <Check label="Fast breathing" checked={imciForm.fastBreathing} onChange={(value) => setImciForm({ ...imciForm, fastBreathing: value })} />
            <Check label="Chest indrawing" checked={imciForm.chestIndrawing} onChange={(value) => setImciForm({ ...imciForm, chestIndrawing: value })} />
            <Check label="Diarrhoea" checked={imciForm.diarrhoea} onChange={(value) => setImciForm({ ...imciForm, diarrhoea: value })} />
            <Check label="Fever" checked={imciForm.fever} onChange={(value) => setImciForm({ ...imciForm, fever: value })} />
            <Check label="Ear problem" checked={imciForm.earProblem} onChange={(value) => setImciForm({ ...imciForm, earProblem: value })} />
            <Field label="MUAC Cm"><input type="number" step="0.1" value={imciForm.muacCm} onChange={(event) => setImciForm({ ...imciForm, muacCm: event.target.value })} /></Field>
            <Check label="Bilateral oedema" checked={imciForm.oedema} onChange={(value) => setImciForm({ ...imciForm, oedema: value })} />
            <div className="paeds-modal-actions"><button type="button" className="paeds-btn is-muted" onClick={() => setModal("")}>Cancel</button><button type="submit" className="paeds-btn is-blue" disabled={saving === "imci"}>{saving === "imci" ? "Saving..." : "Classify"}</button></div>
          </form>
        </PaedsModal>
      ) : null}

      {modal === "growth" ? (
        <PaedsModal tone="green" title="Plot WHO Growth Measurement" onClose={() => setModal("")}>
          <form className="paeds-form" onSubmit={saveGrowth}>
            <Field label="Patient ID"><input list="paeds-patients" required value={growthForm.patientId} onChange={(event) => setGrowthForm({ ...growthForm, patientId: event.target.value })} /></Field>
            <Field label="Encounter ID"><input value={growthForm.encounterId} onChange={(event) => setGrowthForm({ ...growthForm, encounterId: event.target.value })} /></Field>
            <Field label="Measurement Date"><input type="date" value={growthForm.measurementDate} onChange={(event) => setGrowthForm({ ...growthForm, measurementDate: event.target.value })} /></Field>
            <Field label="Weight Kg"><input type="number" step="0.1" required value={growthForm.weightKg} onChange={(event) => setGrowthForm({ ...growthForm, weightKg: event.target.value })} /></Field>
            <Field label="Height / Length Cm"><input type="number" step="0.1" required value={growthForm.heightCm} onChange={(event) => setGrowthForm({ ...growthForm, heightCm: event.target.value })} /></Field>
            <Field label="Head Circumference Cm"><input type="number" step="0.1" value={growthForm.headCircumferenceCm} onChange={(event) => setGrowthForm({ ...growthForm, headCircumferenceCm: event.target.value })} /></Field>
            <Field label="MUAC Cm"><input type="number" step="0.1" value={growthForm.muacCm} onChange={(event) => setGrowthForm({ ...growthForm, muacCm: event.target.value })} /></Field>
            <Check label="Bilateral oedema" checked={growthForm.oedema} onChange={(value) => setGrowthForm({ ...growthForm, oedema: value })} />
            <div className="paeds-modal-actions"><button type="button" className="paeds-btn is-muted" onClick={() => setModal("")}>Cancel</button><button type="submit" className="paeds-btn is-green" disabled={saving === "growth"}>{saving === "growth" ? "Saving..." : "Plot Growth"}</button></div>
          </form>
        </PaedsModal>
      ) : null}

      {modal === "immunisation" ? (
        <PaedsModal tone="green" title="Record Vaccine Administration" onClose={() => setModal("")}>
          <form className="paeds-form" onSubmit={saveImmunisation}>
            <Field label="Patient ID"><input list="paeds-patients" required value={immunisationForm.patientId} onChange={(event) => setImmunisationForm({ ...immunisationForm, patientId: event.target.value })} /></Field>
            <Field label="Vaccine"><select value={immunisationForm.vaccineName} onChange={(event) => setImmunisationForm({ ...immunisationForm, vaccineName: event.target.value })}>{["BCG", "OPV", "Hepatitis B Birth Dose", "DPT-HepB-Hib", "PCV10", "Rotavirus", "IPV", "Vitamin A", "Measles-Rubella", "Yellow Fever"].map((name) => <option key={name}>{name}</option>)}</select></Field>
            <Field label="Dose Number"><input type="number" min="0" value={immunisationForm.doseNumber} onChange={(event) => setImmunisationForm({ ...immunisationForm, doseNumber: event.target.value })} /></Field>
            <Field label="Administered Date"><input type="date" value={immunisationForm.administeredDate} onChange={(event) => setImmunisationForm({ ...immunisationForm, administeredDate: event.target.value })} /></Field>
            <Field label="Batch Number"><input value={immunisationForm.batchNumber} onChange={(event) => setImmunisationForm({ ...immunisationForm, batchNumber: event.target.value })} /></Field>
            <Field label="Expiry Date"><input type="date" value={immunisationForm.expiryDate} onChange={(event) => setImmunisationForm({ ...immunisationForm, expiryDate: event.target.value })} /></Field>
            <Field label="Site"><input value={immunisationForm.site} onChange={(event) => setImmunisationForm({ ...immunisationForm, site: event.target.value })} /></Field>
            <Field label="Route"><input value={immunisationForm.route} onChange={(event) => setImmunisationForm({ ...immunisationForm, route: event.target.value })} /></Field>
            <Field label="Adverse Reaction" wide><textarea value={immunisationForm.adverseReaction} onChange={(event) => setImmunisationForm({ ...immunisationForm, adverseReaction: event.target.value })} /></Field>
            <div className="paeds-modal-actions"><button type="button" className="paeds-btn is-muted" onClick={() => setModal("")}>Cancel</button><button type="submit" className="paeds-btn is-green" disabled={saving === "immunisation"}>{saving === "immunisation" ? "Saving..." : "Record Vaccine"}</button></div>
          </form>
        </PaedsModal>
      ) : null}

      {modal === "tracker" ? (
        <PaedsModal tone="blue" title="Kenya EPI Immunisation Tracker" onClose={() => setModal("")}>
          <div className="paeds-tracker-heading"><div><strong>{tracker?.patient ? patientName(tracker.patient) : "Selected child"}</strong><small>{tracker?.patient?.patientCode || tracker?.patient?.mrn || tracker?.patient?.id || immunisationForm.patientId}</small></div><div className="paeds-tracker-counts"><span>{tracker?.dueCount ?? 0} due</span><span>{tracker?.overdueCount ?? 0} overdue</span><span>{tracker?.items?.filter((item: any) => String(item.status).startsWith("GIVEN")).length ?? 0} given</span></div></div>
          <div className="paeds-tracker">
            {(tracker?.items || []).map((item: any) => <article key={`${item.vaccineName}-${item.doseNumber}`} className={`paeds-vaccine ${String(item.status).toLowerCase()}`}><strong>{item.vaccineName} {item.doseNumber}</strong><small>Scheduled {fmtDate(item.scheduledDate)} · {pretty(item.status)}</small>{item.administeredDate ? <small>Given {fmtDate(item.administeredDate)} · {item.route || "Route not recorded"} · {item.site || "Site not recorded"}</small> : null}{item.batchNumber ? <small>Batch {item.batchNumber}{item.expiryDate ? ` · Expires ${fmtDate(item.expiryDate)}` : ""}</small> : null}</article>)}
            {!tracker?.items?.length ? <p className="paeds-empty">No EPI schedule items were returned for this patient.</p> : null}
          </div>
          <div className="paeds-card-preview"><CheckCircle2 size={16} /> {card ? `${card.title} for ${card.patient?.name || "selected child"}` : "Child health card is not available."}</div>
          <div className="paeds-modal-actions"><button type="button" className="paeds-btn is-muted" onClick={() => window.print()}>Print Card</button><button type="button" className="paeds-btn is-green" onClick={() => setModal("immunisation")}>Record Vaccine</button><button type="button" className="paeds-btn is-blue" onClick={() => void loadTracker(immunisationForm.patientId)} disabled={saving === "tracker"}>{saving === "tracker" ? "Refreshing..." : "Refresh Tracker"}</button></div>
        </PaedsModal>
      ) : null}
    </main>
  );
}

function Panel({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return <section className="paeds-panel"><header><h2>{title}</h2><p>{subtitle}</p></header>{children}</section>;
}

function Field({ label, wide, children }: { label: string; wide?: boolean; children: ReactNode }) {
  return <label className={`paeds-field ${wide ? "wide" : ""}`}><span>{label}</span>{children}</label>;
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <label className="paeds-check"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} /> {label}</label>;
}

function Decision({ icon: Icon, title, value, tone }: { icon: any; title: string; value: string; tone: "green" | "blue" | "amber" | "red" }) {
  return <article className={`paeds-decision ${tone}`}><Icon size={18} /><strong>{title}</strong><span>{value}</span></article>;
}

function GrowthTrend({ rows, patientLabel }: { rows: any[]; patientLabel: string }) {
  if (!rows.length) return <div className="paeds-growth-chart-empty">Plot a measurement to display this child&apos;s growth trend.</div>;
  const width = 720;
  const height = 220;
  const left = 42;
  const right = 18;
  const top = 22;
  const bottom = 34;
  const chartWidth = width - left - right;
  const chartHeight = height - top - bottom;
  const weights = rows.map((row) => Number(row.weightKg)).filter((value) => value > 0);
  const heights = rows.map((row) => Number(row.heightCm)).filter((value) => value > 0);
  const minWeight = Math.max(0, Math.floor(Math.min(...weights, 0) - 1));
  const maxWeight = Math.max(minWeight + 2, Math.ceil(Math.max(...weights, 1) + 1));
  const minHeight = Math.max(0, Math.floor(Math.min(...heights, 0) - 2));
  const maxHeight = Math.max(minHeight + 10, Math.ceil(Math.max(...heights, 10) + 2));
  const point = (index: number, value: number, min: number, max: number) => ({ x: left + (rows.length === 1 ? chartWidth / 2 : (index / (rows.length - 1)) * chartWidth), y: top + chartHeight - ((value - min) / (max - min)) * chartHeight });
  const weightPoints = rows.map((row, index) => point(index, Number(row.weightKg), minWeight, maxWeight));
  const heightPoints = rows.map((row, index) => point(index, Number(row.heightCm), minHeight, maxHeight));
  const path = (points: Array<{ x: number; y: number }>) => points.map((item, index) => `${index ? "L" : "M"}${item.x.toFixed(1)},${item.y.toFixed(1)}`).join(" ");
  return <div className="paeds-growth-chart"><div className="paeds-growth-chart-heading"><div><strong>Growth trend</strong><span>{patientLabel || "Selected child"}</span></div><div className="paeds-growth-legend"><span className="weight">Weight (kg)</span><span className="height">Height (cm)</span></div></div><div className="paeds-growth-chart-scroll"><svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Weight and height growth trend"><line x1={left} y1={top} x2={left} y2={height - bottom} stroke="#cbd5e1" /><line x1={left} y1={height - bottom} x2={width - right} y2={height - bottom} stroke="#cbd5e1" />{[0, 1, 2, 3].map((line) => { const y = top + (line / 3) * chartHeight; return <line key={line} x1={left} y1={y} x2={width - right} y2={y} stroke="#e2e8f0" strokeDasharray="3 4" />; })}<path d={path(weightPoints)} fill="none" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />{weightPoints.map((item, index) => <circle key={`weight-${index}`} cx={item.x} cy={item.y} r="4" fill="#16a34a" stroke="#fff" strokeWidth="2"><title>{`${rows[index].weightKg} kg · ${fmtDate(rows[index].measurementDate)}`}</title></circle>)}<path d={path(heightPoints)} fill="none" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />{heightPoints.map((item, index) => <circle key={`height-${index}`} cx={item.x} cy={item.y} r="4" fill="#2563eb" stroke="#fff" strokeWidth="2"><title>{`${rows[index].heightCm} cm · ${fmtDate(rows[index].measurementDate)}`}</title></circle>)}{rows.map((row, index) => <text key={`date-${index}`} x={left + (rows.length === 1 ? chartWidth / 2 : (index / (rows.length - 1)) * chartWidth)} y={height - 11} textAnchor="middle" fill="#64748b" fontSize="10">{new Date(String(row.measurementDate || "")).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</text>)}</svg></div></div>;
}

function PaedsModal({ title, tone, onClose, children }: { title: string; tone: "green" | "blue" | "red"; onClose: () => void; children: ReactNode }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="paeds-modal-backdrop" role="presentation" onClick={onClose}>
      <section className={`paeds-modal ${tone}${expanded ? " is-expanded" : ""}`} onClick={(event) => event.stopPropagation()}>
        <header>
          <div><span>Paediatrics</span><h2>{title}</h2></div>
          <div className="paeds-modal-tools"><button type="button" className="paeds-modal-expand" onClick={() => setExpanded((current) => !current)} aria-label={expanded ? "Restore form" : "Expand form"}>{expanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}</button><button type="button" onClick={onClose} aria-label="Close"><X size={18} /></button></div>
        </header>
        {children}
      </section>
    </div>
  );
}

