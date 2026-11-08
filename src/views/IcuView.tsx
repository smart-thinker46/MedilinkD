import type { FormEvent } from "react";
import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Brain,
  ClipboardCheck,
  FileText,
  HeartPulse,
  Plus,
  RefreshCw,
  Search,
  Stethoscope,
  Thermometer,
  UserPlus,
  Wind,
  X,
} from "lucide-react";
import { api } from "../lib/api";
import { useLiveRefresh } from "../lib/liveRefresh";

const unwrapRows = (value: any) => {
  const data = value?.data ?? value;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.rows)) return data.rows;
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

const apiErrorMessage = (error: any, fallback: string) => {
  if (error?.response?.status === 401) return "Your session has expired. Sign in again to access ICU records.";
  if (error?.response?.status === 403) return "Your role is not permitted to access ICU records.";
  return error?.response?.data?.message || fallback;
};

const todayValue = () => new Date().toISOString().slice(0, 10);
const nowTime = () => new Date().toTimeString().slice(0, 5);
const dateTimeValue = (date: string, time: string) => `${date}T${time || "00:00"}:00`;
const patientName = (row: any) => {
  const patient = row?.patient || row;
  return row?.patientName || [patient?.firstName, patient?.lastName].filter(Boolean).join(" ") || patient?.patientCode || row?.patientId || "Unknown patient";
};
const fmt = (value: any) => {
  const date = new Date(String(value || ""));
  if (!Number.isFinite(date.getTime())) return "Not recorded";
  return date.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
};
const statusClass = (value: any) => String(value || "ACTIVE").toLowerCase();

export default function IcuView() {
  const [dashboard, setDashboard] = useState<any>({});
  const [admissions, setAdmissions] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ACTIVE");
  const [modal, setModal] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");
  const [notice, setNotice] = useState("");
  const [waitingListOpen, setWaitingListOpen] = useState(false);
  const [waitingListLoading, setWaitingListLoading] = useState(false);
  const [waitingListRows, setWaitingListRows] = useState<any[]>([]);

  const [admissionForm, setAdmissionForm] = useState({
    patientId: "",
    source: "ER",
    primaryDiagnosis: "",
    reasonForAdmission: "",
    bedLocation: "",
    infectionStatus: "",
    isolationRequired: false,
    mechanicalVentilation: false,
    ventilationStatus: "OFF",
    ventilationMode: "VCV",
    fio2: "40",
    peep: "5",
    tidalVolume: "450",
    respiratoryRate: "16",
    peakPressure: "0",
    plateauPressure: "0",
  });
  const [scoreForm, setScoreForm] = useState({
    scoreType: "SOFA",
    age: "50",
    temperature: "37",
    meanArterialPressure: "80",
    heartRate: "90",
    respiratoryRate: "18",
    gcs: "15",
    pao2Fio2: "400",
    platelets: "200",
    bilirubin: "1",
    creatinine: "1",
    urineOutput: "1200",
    sodium: "140",
    potassium: "4",
    hematocrit: "40",
    wbc: "8",
    vasopressors: false,
    vasopressorDose: "0",
    chronicHealthPoints: "0",
    notes: "",
  });
  const [ventForm, setVentForm] = useState({ ventilationStatus: "INTUBATED", device: "", mode: "VCV", fio2: "40", peep: "5", tidalVolume: "450", respiratoryRate: "16", peakPressure: "0", plateauPressure: "0", meanAirwayPressure: "0", pressureSupport: "0", measuredRespiratoryRate: "0", minuteVentilation: "0", compliance: "0", airwayResistance: "0", bloodGas: "", alarmSummary: "", changeReason: "", weaningPlan: "", highFio2Justification: "", notes: "" });
  const [satForm, setSatForm] = useState({ satPerformed: false, satResult: "PASSED", sbtPerformed: false, sbtResult: "PASSED", deferredReason: "", extubationReady: false, notes: "" });
  const [camForm, setCamForm] = useState({ acuteChange: false, inattention: false, alteredConsciousness: false, disorganizedThinking: false, rassScore: "0", carePlanAdjustment: "", notes: "" });
  const [vitalForm, setVitalForm] = useState({ heartRate: "90", bpSystolic: "120", bpDiastolic: "70", meanArterialPressure: "0", respiratoryRate: "18", oxygenSaturation: "96", temperature: "37", cvp: "0", icp: "0", urineOutput: "0", bloodGlucose: "0", painScore: "0", neurologicalStatus: "", source: "CLINICIAN", notes: "" });
  const [infusionForm, setInfusionForm] = useState({ medication: "", infusionType: "VASOPRESSOR", rate: "0", unit: "ml/hr", doseChangeReason: "", pumpType: "", notes: "" });
  const [noteForm, setNoteForm] = useState({ progressNote: "", labSummary: "", organReview: "", medicationChanges: "", nutritionPlan: "", codeStatus: "FULL_CODE" });
  const [dispositionForm, setDispositionForm] = useState({ outcome: "WARD", conditionAtDischarge: "", finalDiagnosis: "", transferDestination: "", notes: "" });

  const setToast = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice((current) => (current === message ? "" : current)), 6000);
  };

  const load = async () => {
    setLoading(true);
    try {
      const [dashRes, admRes, patientRes] = await Promise.allSettled([
        api.get("/icu/dashboard"),
        api.get("/icu/admissions", { params: { status } }),
        api.get("/patients").catch((error) => {
          if ([404, 405].includes(error?.response?.status)) return api.get("/tenant/patients");
          throw error;
        }),
      ]);
      const rows = admRes.status === "fulfilled" ? unwrapRows(admRes.value.data) : [];
      if (dashRes.status === "fulfilled") setDashboard(dashRes.value.data?.data || dashRes.value.data || {});
      if (admRes.status === "fulfilled") setAdmissions(rows);
      if (patientRes.status === "fulfilled") setPatients(unwrapRows(patientRes.value.data));
      setSelectedId((current) => rows.some((row: any) => row.icuAdmissionId === current) ? current : (rows[0]?.icuAdmissionId || ""));
      const failed = [dashRes, admRes, patientRes].find((result) => result.status === "rejected");
      if (failed?.status === "rejected") setToast(apiErrorMessage(failed.reason, "Some ICU data could not be loaded."));
    } catch (error: any) {
      setToast(apiErrorMessage(error, "ICU data could not be loaded."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [status]);

  useLiveRefresh(load, { intervalMs: 45000 });

  const loadWaitingList = async () => {
    setWaitingListLoading(true);
    try {
      const response = await api.get("/opd/queue/board", { params: { departmentId: "ICU" } });
      const payload = response.data?.data || response.data || {};
      setWaitingListRows(Array.isArray(payload?.tokens) ? payload.tokens : Array.isArray(payload) ? payload : []);
    } catch (error: any) {
      setWaitingListRows([]);
      setToast(apiErrorMessage(error, "ICU waiting list could not be loaded."));
    } finally {
      setWaitingListLoading(false);
    }
  };

  useEffect(() => {
    const handleSidebarAction = (event: Event) => {
      const action = (event as CustomEvent<{ action?: string }>).detail?.action;
      if (action === "monitor-patient") {
        window.setTimeout(() => document.querySelector(".icu-table-wrap")?.scrollIntoView({ behavior: "smooth", block: "center" }), 0);
        setToast("ICU patient monitoring is ready. Select an admission to open its critical-care workspace.");
      }
      if (action === "queue-patient") setToast("Use Patient Registration to select a patient and queue them to ICU.");
    };
    window.addEventListener("hmis:icu-sidebar-action", handleSidebarAction);
    const handleWaitingList = (event: Event) => {
      const detail = (event as CustomEvent<{ moduleKey?: string }>).detail;
      if (detail?.moduleKey !== "icu") return;
      setWaitingListOpen(true);
      void loadWaitingList();
    };
    window.addEventListener("hmis:open-module-waiting-list", handleWaitingList);
    return () => {
      window.removeEventListener("hmis:icu-sidebar-action", handleSidebarAction);
      window.removeEventListener("hmis:open-module-waiting-list", handleWaitingList);
    };
  }, []);

  const selected = useMemo(() => admissions.find((row) => row.icuAdmissionId === selectedId) || null, [admissions, selectedId]);
  useEffect(() => {
    if (!selectedId) {
      setTimeline([]);
      return;
    }
    api.get(`/icu/timeline/${selectedId}`).then((res) => {
      const payload = res.data?.data || res.data || {};
      setTimeline(Array.isArray(payload?.timeline) ? payload.timeline : Array.isArray(payload) ? payload : []);
    }).catch((error) => {
      setTimeline([]);
      setToast(apiErrorMessage(error, "ICU timeline could not be loaded."));
    });
  }, [selectedId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return admissions.filter((row) => !q || `${patientName(row)} ${row.patientCode} ${row.primaryDiagnosis} ${row.reasonForAdmission} ${row.bedLocation} ${row.status}`.toLowerCase().includes(q));
  }, [admissions, search]);

  const totals = dashboard?.totals || {};
  const statCards = [
    { label: "Active", value: totals.activeAdmissions || 0, icon: Activity, color: "#16a34a" },
    { label: "Ventilated", value: totals.ventilatedPatients || 0, icon: Wind, color: "#2563eb" },
    { label: "Critical Alerts", value: totals.criticalAlerts || 0, icon: AlertTriangle, color: "#dc2626" },
    { label: "SAT/SBT Due", value: totals.satSbtDue || 0, icon: ClipboardCheck, color: "#d97706" },
    { label: "CAM Due", value: totals.camIcuDue || 0, icon: Brain, color: "#7c3aed" },
    { label: "Avg LOS", value: `${Number(totals.avgLosHours || 0).toFixed(1)}h`, icon: BarChart3, color: "#0f766e" },
  ];

  const requireSelected = () => {
    if (selectedId) return true;
    setToast("Select an ICU admission first.");
    return false;
  };
  const closeAfter = (message: string) => {
    setToast(message);
    setModal("");
    return load();
  };

  const saveAdmission = (event: FormEvent) => {
    event.preventDefault();
    setSaving("admission");
    api.post("/icu/admission", {
      ...admissionForm,
      mechanicalVentilation: admissionForm.mechanicalVentilation,
      fio2: Number(admissionForm.fio2),
      peep: Number(admissionForm.peep),
      tidalVolume: Number(admissionForm.tidalVolume),
      respiratoryRate: Number(admissionForm.respiratoryRate),
      peakPressure: Number(admissionForm.peakPressure),
      plateauPressure: Number(admissionForm.plateauPressure),
      admittedAt: dateTimeValue(todayValue(), nowTime()),
    }).then((res: any) => {
      setSelectedId(res.data?.icuAdmissionId || "");
      return closeAfter("ICU admission created and ventilator baseline recorded if applicable.");
    }).catch((error: any) => setToast(error?.response?.data?.message || "ICU admission failed.")).finally(() => setSaving(""));
  };

  const saveScore = (event: FormEvent) => {
    event.preventDefault();
    if (!requireSelected()) return;
    setSaving("score");
    api.post("/icu/score", { icuAdmissionId: selectedId, ...scoreForm })
      .then((res: any) => closeAfter(`${res.data?.scoreType || scoreForm.scoreType} calculated: ${res.data?.scoreValue ?? ""}${res.data?.mortalityProbability ? `, mortality ${(res.data.mortalityProbability * 100).toFixed(0)}%` : ""}.`))
      .catch((error: any) => setToast(error?.response?.data?.message || "ICU score failed."))
      .finally(() => setSaving(""));
  };

  const saveVentilator = (event: FormEvent) => {
    event.preventDefault();
    if (!requireSelected()) return;
    setSaving("ventilator");
    api.post("/icu/ventilator-setting", { icuAdmissionId: selectedId, ...ventForm })
      .then((res: any) => closeAfter(res.data?.generatedAlerts?.length ? "Ventilator settings saved with safety alert generated." : "Ventilator settings saved."))
      .catch((error: any) => setToast(error?.response?.data?.message || "Ventilator record failed."))
      .finally(() => setSaving(""));
  };

  const saveSatSbt = (event: FormEvent) => {
    event.preventDefault();
    if (!requireSelected()) return;
    setSaving("sat");
    api.post("/icu/sat-sbt", { icuAdmissionId: selectedId, ...satForm, trialDate: dateTimeValue(todayValue(), nowTime()) })
      .then(() => closeAfter("SAT/SBT trial documented."))
      .catch((error: any) => setToast(error?.response?.data?.message || "SAT/SBT documentation failed."))
      .finally(() => setSaving(""));
  };

  const saveCam = (event: FormEvent) => {
    event.preventDefault();
    if (!requireSelected()) return;
    setSaving("cam");
    api.post("/icu/cam-icu", { icuAdmissionId: selectedId, ...camForm, rassScore: Number(camForm.rassScore) })
      .then((res: any) => closeAfter(res.data?.camPositive ? "CAM-ICU positive: care plan and physician alert created." : "CAM-ICU screen saved."))
      .catch((error: any) => setToast(error?.response?.data?.message || "CAM-ICU screen failed."))
      .finally(() => setSaving(""));
  };

  const saveVital = (event: FormEvent) => {
    event.preventDefault();
    if (!requireSelected()) return;
    setSaving("vital");
    api.post("/icu/vital", { icuAdmissionId: selectedId, ...vitalForm })
      .then((res: any) => closeAfter(res.data?.generatedAlerts?.length ? "Vitals saved with critical alert generated." : "Vitals saved."))
      .catch((error: any) => setToast(error?.response?.data?.message || "Vital record failed."))
      .finally(() => setSaving(""));
  };

  const saveInfusion = (event: FormEvent) => {
    event.preventDefault();
    if (!requireSelected()) return;
    setSaving("infusion");
    api.post("/icu/infusion", { icuAdmissionId: selectedId, ...infusionForm, rate: Number(infusionForm.rate), startedAt: dateTimeValue(todayValue(), nowTime()) })
      .then(() => closeAfter("ICU infusion recorded."))
      .catch((error: any) => setToast(error?.response?.data?.message || "Infusion record failed."))
      .finally(() => setSaving(""));
  };

  const saveNote = (event: FormEvent) => {
    event.preventDefault();
    if (!requireSelected()) return;
    setSaving("note");
    api.post("/icu/progress-note", { icuAdmissionId: selectedId, ...noteForm })
      .then(() => closeAfter("ICU progress note saved."))
      .catch((error: any) => setToast(error?.response?.data?.message || "Progress note failed."))
      .finally(() => setSaving(""));
  };

  const saveDisposition = (event: FormEvent) => {
    event.preventDefault();
    if (!requireSelected()) return;
    setSaving("disposition");
    api.post("/icu/disposition", { icuAdmissionId: selectedId, ...dispositionForm, disposedAt: dateTimeValue(todayValue(), nowTime()) })
      .then(() => closeAfter("ICU disposition saved and admission status updated."))
      .catch((error: any) => setToast(error?.response?.data?.message || "Disposition failed."))
      .finally(() => setSaving(""));
  };

  const modalTitle: Record<string, string> = {
    admission: "ICU Admission",
    score: "APACHE II / SOFA Score",
    ventilator: "Ventilator Parameters",
    sat: "SAT/SBT Trial",
    cam: "CAM-ICU Screening",
    vital: "ICU Vitals",
    infusion: "Infusion / Sedation",
    note: "Progress Note",
    disposition: "Disposition",
  };

  return (
    <div className="nursing-view icu-view">
      <div className="pv-header icu-header">
        <div>
          <h2 className="pv-title">ICU</h2>
          <p className="pv-subtitle">Severity scoring, ventilator safety, SAT/SBT tracking, CAM-ICU screening, and critical care alerts.</p>
        </div>
        <div className="nursing-header-actions">
          <button className="icu-btn is-neutral" onClick={() => void load()} type="button"><RefreshCw size={15} /> Refresh</button>
          <button className="icu-btn is-primary" onClick={() => setModal("admission")} type="button"><UserPlus size={15} /> ICU Admission</button>
          <button className="icu-btn is-info" onClick={() => requireSelected() && setModal("score")} type="button"><BarChart3 size={15} /> APACHE/SOFA</button>
        </div>
      </div>

      {notice ? (
        <div className={`module-notice-toast icu-notification is-${/failed|required|critical|positive|alert/i.test(notice) ? "warning" : "success"}`} role="status" aria-live="polite">
          <div className="icu-notification-content"><span className="icu-notification-icon"><HeartPulse size={18} /></span><span><strong>ICU Update</strong><span>{notice}</span></span></div>
          <button type="button" className="module-notice-close icu-notification-close" aria-label="Dismiss ICU notification" onClick={() => setNotice("")}><X size={16} /></button>
        </div>
      ) : null}

      {waitingListOpen ? (
        <div className="module-form-overlay">
          <section className="module-form-panel icu-modal" role="dialog" aria-modal="true" aria-labelledby="icu-waiting-title">
            <div className="module-form-header"><div className="module-form-icon"><ClipboardCheck size={20} /></div><div><p className="module-form-kicker">ICU QUEUE</p><h3 id="icu-waiting-title" className="module-form-title">Open Waiting List</h3></div><button type="button" className="module-form-close" onClick={() => setWaitingListOpen(false)}><X size={18} /></button></div>
            <div className="module-form-body">
              <p className="pv-subtitle">Patients currently queued to the ICU service point.</p>
              <div className="pv-table-wrap"><table className="pv-table"><thead><tr><th>Token</th><th>Patient</th><th>Priority</th><th>Queued</th><th>Status</th></tr></thead><tbody>
                {waitingListLoading ? <tr><td colSpan={5} className="pv-empty">Loading ICU waiting list...</td></tr> : waitingListRows.length === 0 ? <tr><td colSpan={5} className="pv-empty">No patients are waiting for ICU.</td></tr> : waitingListRows.map((row, index) => <tr key={row.tokenId || row.id || `${row.patientId}-${index}`}><td>{row.tokenNumber || "-"}</td><td>{row.patientName || row.name || row.patientCode || row.patientId || "Unnamed patient"}</td><td>{row.priority || "GENERAL"}</td><td>{row.issuedAt ? fmt(row.issuedAt) : "-"}</td><td>{row.status || "WAITING"}</td></tr>)}
              </tbody></table></div>
            </div>
            <div className="module-form-footer"><button type="button" className="icu-btn is-neutral" onClick={() => setWaitingListOpen(false)}>Close</button><button type="button" className="icu-btn is-info" onClick={loadWaitingList} disabled={waitingListLoading}><RefreshCw size={15} /> Refresh</button></div>
          </section>
        </div>
      ) : null}

      <div className="icu-stats-grid">
        {statCards.map((card) => {
          const Icon = card.icon;
          return <article key={card.label} className="pv-stat-card icu-stat" style={{ borderLeftColor: card.color }}><div><p className="pv-stat-label">{card.label}</p><p className="pv-stat-value">{card.value}</p></div><Icon size={22} style={{ color: card.color }} /></article>;
        })}
      </div>

      <div className="icu-workspace">
        <section className="icu-panel icu-list-panel">
          <div className="icu-toolbar">
            <div className="pv-search-wrap"><Search size={16} /><input className="pv-search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search ICU patient, diagnosis, bed..." /></div>
            <select value={status} onChange={(e) => setStatus(e.target.value)}><option>ACTIVE</option><option>ALL</option><option>DISCHARGED</option><option>DECEASED</option><option>TRANSFERRED</option></select>
          </div>
          <div className="pv-table-wrap icu-table-wrap">
            <table className="pv-table icu-table">
              <thead><tr><th>Patient</th><th>Bed</th><th>Diagnosis</th><th>Ventilation</th><th>Status</th><th>Admitted</th></tr></thead>
              <tbody>
                {filtered.map((row) => <tr key={row.icuAdmissionId} className={selectedId === row.icuAdmissionId ? "selected" : ""} onClick={() => setSelectedId(row.icuAdmissionId)}>
                  <td><strong>{patientName(row)}</strong><span>{row.patientCode || row.patientId}</span></td>
                  <td>{row.bedLocation || "Unassigned"}</td>
                  <td>{row.primaryDiagnosis || row.reasonForAdmission || "ICU care"}</td>
                  <td>{row.ventilationStatus || "OFF"}</td>
                  <td><span className={`icu-status ${statusClass(row.status)}`}>{row.status || "ACTIVE"}</span></td>
                  <td>{fmt(row.admittedAt || row.createdAt)}</td>
                </tr>)}
                {!filtered.length ? <tr><td colSpan={6} className="pv-empty">{loading ? "Loading ICU admissions..." : "No ICU admissions match this filter."}</td></tr> : null}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="icu-panel icu-case-panel">
          <div className="icu-case-head">
            <div><span>Selected patient</span><strong>{selected ? patientName(selected) : "No patient selected"}</strong><p>{selected ? `${selected.bedLocation || "No bed"} | ${selected.primaryDiagnosis || "No diagnosis"}` : "Select a patient from the ICU table."}</p></div>
            {selected ? <span className={`icu-status ${statusClass(selected.status)}`}>{selected.status}</span> : null}
          </div>
          <div className="icu-action-grid">
            <button onClick={() => requireSelected() && setModal("score")} type="button"><BarChart3 size={16} /> APACHE/SOFA</button>
            <button onClick={() => requireSelected() && setModal("ventilator")} type="button"><Wind size={16} /> Ventilator</button>
            <button onClick={() => requireSelected() && setModal("sat")} type="button"><ClipboardCheck size={16} /> SAT/SBT</button>
            <button onClick={() => requireSelected() && setModal("cam")} type="button"><Brain size={16} /> CAM-ICU</button>
            <button onClick={() => requireSelected() && setModal("vital")} type="button"><Thermometer size={16} /> Vitals</button>
            <button onClick={() => requireSelected() && setModal("infusion")} type="button"><Activity size={16} /> Infusion</button>
            <button onClick={() => requireSelected() && setModal("note")} type="button"><FileText size={16} /> Note</button>
            <button onClick={() => requireSelected() && setModal("disposition")} type="button"><Stethoscope size={16} /> Disposition</button>
          </div>
          <div className="icu-safety-strip">
            <div><span>SAT/SBT Due</span><strong>{(dashboard?.satSbtDue || []).some((row: any) => row.icuAdmissionId === selectedId) ? "YES" : "NO"}</strong></div>
            <div><span>CAM Due</span><strong>{(dashboard?.camIcuDue || []).some((row: any) => row.icuAdmissionId === selectedId) ? "YES" : "NO"}</strong></div>
            <div><span>Alerts</span><strong>{(dashboard?.recentAlerts || []).filter((row: any) => row.icuAdmissionId === selectedId).length}</strong></div>
          </div>
          <div className="icu-timeline">
            <h3><Activity size={16} /> ICU Timeline</h3>
            {timeline.slice(-9).reverse().map((row) => <article key={row.id}><span>{fmt(row.createdAt)}</span><strong>{String(row.type).replace(/ICU_/g, "").replace(/_/g, " ")}</strong></article>)}
            {!timeline.length ? <p className="pv-empty">Timeline appears after ICU records are saved.</p> : null}
          </div>
          <div className="icu-alert-list">
            <h3><AlertTriangle size={16} /> Recent Alerts</h3>
            {(dashboard?.recentAlerts || []).filter((row: any) => row.icuAdmissionId === selectedId).slice(0, 4).map((row: any) => <article key={row.icuAlertId || row.id}><span>{row.severity}</span><strong>{row.message}</strong></article>)}
            {!(dashboard?.recentAlerts || []).filter((row: any) => row.icuAdmissionId === selectedId).length ? <p className="pv-empty">No active alerts for selected patient.</p> : null}
          </div>
        </aside>
      </div>

      {modal ? (
        <div className="module-form-overlay" role="dialog" aria-modal="true">
          <div className="module-form-panel icu-modal">
            <div className="module-form-header"><div className="module-form-icon"><HeartPulse size={20} /></div><div><p className="module-form-kicker">ICU</p><h3 className="module-form-title">{modalTitle[modal]}</h3></div><button type="button" className="module-form-close" onClick={() => setModal("")}><X size={18} /></button></div>

            {modal === "admission" ? <form className="module-form-body icu-form-grid" onSubmit={saveAdmission}>
              <label><span>Patient</span><select required value={admissionForm.patientId} onChange={(e) => setAdmissionForm({ ...admissionForm, patientId: e.target.value })}><option value="">Select patient</option>{patients.map((row) => <option key={row.id} value={row.id}>{patientName(row)} {row.patientCode ? `(${row.patientCode})` : ""}</option>)}</select></label>
              <label><span>Source</span><select value={admissionForm.source} onChange={(e) => setAdmissionForm({ ...admissionForm, source: e.target.value })}><option>ER</option><option>WARD</option><option>OT</option><option>REFERRAL</option></select></label>
              <label><span>Primary diagnosis</span><input required value={admissionForm.primaryDiagnosis} onChange={(e) => setAdmissionForm({ ...admissionForm, primaryDiagnosis: e.target.value })} /></label>
              <label><span>Bed location</span><input value={admissionForm.bedLocation} onChange={(e) => setAdmissionForm({ ...admissionForm, bedLocation: e.target.value })} /></label>
              <label className="wide"><span>Reason for admission</span><textarea required value={admissionForm.reasonForAdmission} onChange={(e) => setAdmissionForm({ ...admissionForm, reasonForAdmission: e.target.value })} /></label>
              <label><span>Infection status</span><input value={admissionForm.infectionStatus} onChange={(e) => setAdmissionForm({ ...admissionForm, infectionStatus: e.target.value })} /></label>
              <label className="icu-check"><input type="checkbox" checked={admissionForm.isolationRequired} onChange={(e) => setAdmissionForm({ ...admissionForm, isolationRequired: e.target.checked })} /> Isolation required</label>
              <label className="icu-check"><input type="checkbox" checked={admissionForm.mechanicalVentilation} onChange={(e) => setAdmissionForm({ ...admissionForm, mechanicalVentilation: e.target.checked, ventilationStatus: e.target.checked ? "INTUBATED" : "OFF" })} /> Mechanically ventilated</label>
              {admissionForm.mechanicalVentilation ? <>
                <label><span>Ventilation status</span><select value={admissionForm.ventilationStatus} onChange={(e) => setAdmissionForm({ ...admissionForm, ventilationStatus: e.target.value })}><option>INTUBATED</option><option>WEANING</option><option>EXTUBATED</option><option>OFF</option></select></label>
                <label><span>Mode</span><select value={admissionForm.ventilationMode} onChange={(e) => setAdmissionForm({ ...admissionForm, ventilationMode: e.target.value })}><option>VCV</option><option>PCV</option><option>SIMV</option><option>PSV</option><option>CPAP</option></select></label>
                <label><span>FiO2 %</span><input value={admissionForm.fio2} onChange={(e) => setAdmissionForm({ ...admissionForm, fio2: e.target.value })} /></label>
                <label><span>PEEP</span><input value={admissionForm.peep} onChange={(e) => setAdmissionForm({ ...admissionForm, peep: e.target.value })} /></label>
                <label><span>Tidal volume</span><input value={admissionForm.tidalVolume} onChange={(e) => setAdmissionForm({ ...admissionForm, tidalVolume: e.target.value })} /></label>
                <label><span>Ventilator rate</span><input value={admissionForm.respiratoryRate} onChange={(e) => setAdmissionForm({ ...admissionForm, respiratoryRate: e.target.value })} /></label>
                <label><span>Peak pressure</span><input value={admissionForm.peakPressure} onChange={(e) => setAdmissionForm({ ...admissionForm, peakPressure: e.target.value })} /></label>
                <label><span>Plateau pressure</span><input value={admissionForm.plateauPressure} onChange={(e) => setAdmissionForm({ ...admissionForm, plateauPressure: e.target.value })} /></label>
              </> : null}
              <button className="icu-submit" disabled={Boolean(saving)}><UserPlus size={16} /> Save ICU Admission</button>
            </form> : null}

            {modal === "score" ? <form className="module-form-body icu-form-grid" onSubmit={saveScore}>
              <label><span>Score type</span><select value={scoreForm.scoreType} onChange={(e) => setScoreForm({ ...scoreForm, scoreType: e.target.value })}><option>SOFA</option><option>APACHE_II</option></select></label>
              {Object.entries(scoreForm).filter(([key]) => !["scoreType", "notes", "vasopressors"].includes(key)).map(([key, value]) => <label key={key}><span>{key.replace(/([A-Z])/g, " $1")}</span><input value={String(value)} onChange={(e) => setScoreForm({ ...scoreForm, [key]: e.target.value })} /></label>)}
              <label className="icu-check"><input type="checkbox" checked={scoreForm.vasopressors} onChange={(e) => setScoreForm({ ...scoreForm, vasopressors: e.target.checked })} /> On vasopressors</label>
              <label className="wide"><span>Notes</span><textarea value={scoreForm.notes} onChange={(e) => setScoreForm({ ...scoreForm, notes: e.target.value })} /></label>
              <button className="icu-submit" disabled={Boolean(saving)}><BarChart3 size={16} /> Calculate And Save Score</button>
            </form> : null}

            {modal === "ventilator" ? <form className="module-form-body icu-form-grid" onSubmit={saveVentilator}>
              {Object.entries(ventForm).map(([key, value]) => key === "ventilationStatus" || key === "mode" ? <label key={key}><span>{key}</span><select value={String(value)} onChange={(e) => setVentForm({ ...ventForm, [key]: e.target.value })}>{key === "ventilationStatus" ? ["INTUBATED", "WEANING", "EXTUBATED", "OFF"].map((v) => <option key={v}>{v}</option>) : ["VCV", "PCV", "SIMV", "PSV", "CPAP"].map((v) => <option key={v}>{v}</option>)}</select></label> : <label key={key} className={key.includes("Justification") || key === "notes" || key === "weaningPlan" ? "wide" : ""}><span>{key.replace(/([A-Z])/g, " $1")}</span>{key.includes("Justification") || key === "notes" || key === "weaningPlan" ? <textarea value={String(value)} onChange={(e) => setVentForm({ ...ventForm, [key]: e.target.value })} /> : <input value={String(value)} onChange={(e) => setVentForm({ ...ventForm, [key]: e.target.value })} />}</label>)}
              <button className="icu-submit" disabled={Boolean(saving)}><Wind size={16} /> Save Ventilator Parameters</button>
            </form> : null}

            {modal === "sat" ? <form className="module-form-body icu-form-grid" onSubmit={saveSatSbt}>
              <label className="icu-check"><input type="checkbox" checked={satForm.satPerformed} onChange={(e) => setSatForm({ ...satForm, satPerformed: e.target.checked })} /> SAT performed</label>
              <label><span>SAT result</span><select value={satForm.satResult} onChange={(e) => setSatForm({ ...satForm, satResult: e.target.value })}><option>PASSED</option><option>FAILED</option></select></label>
              <label className="icu-check"><input type="checkbox" checked={satForm.sbtPerformed} onChange={(e) => setSatForm({ ...satForm, sbtPerformed: e.target.checked })} /> SBT performed</label>
              <label><span>SBT result</span><select value={satForm.sbtResult} onChange={(e) => setSatForm({ ...satForm, sbtResult: e.target.value })}><option>PASSED</option><option>FAILED</option></select></label>
              <label className="icu-check"><input type="checkbox" checked={satForm.extubationReady} onChange={(e) => setSatForm({ ...satForm, extubationReady: e.target.checked })} /> Extubation ready</label>
              <label className="wide"><span>Deferred reason</span><textarea value={satForm.deferredReason} onChange={(e) => setSatForm({ ...satForm, deferredReason: e.target.value })} /></label>
              <label className="wide"><span>Notes</span><textarea value={satForm.notes} onChange={(e) => setSatForm({ ...satForm, notes: e.target.value })} /></label>
              <button className="icu-submit" disabled={Boolean(saving)}><ClipboardCheck size={16} /> Save SAT/SBT</button>
            </form> : null}

            {modal === "cam" ? <form className="module-form-body icu-form-grid" onSubmit={saveCam}>
              {(["acuteChange", "inattention", "alteredConsciousness", "disorganizedThinking"] as const).map((key) => <label key={key} className="icu-check"><input type="checkbox" checked={camForm[key]} onChange={(e) => setCamForm({ ...camForm, [key]: e.target.checked })} /> {key.replace(/([A-Z])/g, " $1")}</label>)}
              <label><span>RASS score</span><input value={camForm.rassScore} onChange={(e) => setCamForm({ ...camForm, rassScore: e.target.value })} /></label>
              <label className="wide"><span>Care plan adjustment</span><textarea value={camForm.carePlanAdjustment} onChange={(e) => setCamForm({ ...camForm, carePlanAdjustment: e.target.value })} /></label>
              <label className="wide"><span>Notes</span><textarea value={camForm.notes} onChange={(e) => setCamForm({ ...camForm, notes: e.target.value })} /></label>
              <button className="icu-submit" disabled={Boolean(saving)}><Brain size={16} /> Save CAM-ICU</button>
            </form> : null}

            {modal === "vital" ? <form className="module-form-body icu-form-grid" onSubmit={saveVital}>
              {Object.entries(vitalForm).map(([key, value]) => <label key={key} className={key === "notes" ? "wide" : ""}><span>{key.replace(/([A-Z])/g, " $1")}</span>{key === "notes" ? <textarea value={String(value)} onChange={(e) => setVitalForm({ ...vitalForm, [key]: e.target.value })} /> : <input value={String(value)} onChange={(e) => setVitalForm({ ...vitalForm, [key]: e.target.value })} />}</label>)}
              <button className="icu-submit" disabled={Boolean(saving)}><Thermometer size={16} /> Save Vitals</button>
            </form> : null}

            {modal === "infusion" ? <form className="module-form-body icu-form-grid" onSubmit={saveInfusion}>
              <label><span>Medication</span><input required value={infusionForm.medication} onChange={(e) => setInfusionForm({ ...infusionForm, medication: e.target.value })} /></label>
              <label><span>Infusion type</span><select value={infusionForm.infusionType} onChange={(e) => setInfusionForm({ ...infusionForm, infusionType: e.target.value })}><option>VASOPRESSOR</option><option>SEDATION</option><option>ANALGESIA</option><option>INSULIN</option><option>FLUID</option><option>OTHER</option></select></label>
              <label><span>Rate</span><input value={infusionForm.rate} onChange={(e) => setInfusionForm({ ...infusionForm, rate: e.target.value })} /></label>
              <label><span>Unit</span><input value={infusionForm.unit} onChange={(e) => setInfusionForm({ ...infusionForm, unit: e.target.value })} /></label>
              <label><span>Pump type</span><input value={infusionForm.pumpType} onChange={(e) => setInfusionForm({ ...infusionForm, pumpType: e.target.value })} /></label>
              <label className="wide"><span>Dose change reason</span><textarea value={infusionForm.doseChangeReason} onChange={(e) => setInfusionForm({ ...infusionForm, doseChangeReason: e.target.value })} /></label>
              <label className="wide"><span>Notes</span><textarea value={infusionForm.notes} onChange={(e) => setInfusionForm({ ...infusionForm, notes: e.target.value })} /></label>
              <button className="icu-submit" disabled={Boolean(saving)}><Activity size={16} /> Save Infusion</button>
            </form> : null}

            {modal === "note" ? <form className="module-form-body icu-form-grid" onSubmit={saveNote}>
              {Object.entries(noteForm).map(([key, value]) => <label key={key} className="wide"><span>{key.replace(/([A-Z])/g, " $1")}</span><textarea value={String(value)} onChange={(e) => setNoteForm({ ...noteForm, [key]: e.target.value })} /></label>)}
              <button className="icu-submit" disabled={Boolean(saving)}><FileText size={16} /> Save Progress Note</button>
            </form> : null}

            {modal === "disposition" ? <form className="module-form-body icu-form-grid" onSubmit={saveDisposition}>
              <label><span>Outcome</span><select value={dispositionForm.outcome} onChange={(e) => setDispositionForm({ ...dispositionForm, outcome: e.target.value })}><option>WARD</option><option>STEP_DOWN</option><option>HOME</option><option>TRANSFERRED</option><option>MORTUARY</option><option>DECEASED</option></select></label>
              <label><span>Transfer destination</span><input value={dispositionForm.transferDestination} onChange={(e) => setDispositionForm({ ...dispositionForm, transferDestination: e.target.value })} /></label>
              <label className="wide"><span>Condition at discharge</span><textarea value={dispositionForm.conditionAtDischarge} onChange={(e) => setDispositionForm({ ...dispositionForm, conditionAtDischarge: e.target.value })} /></label>
              <label className="wide"><span>Final diagnosis</span><textarea value={dispositionForm.finalDiagnosis} onChange={(e) => setDispositionForm({ ...dispositionForm, finalDiagnosis: e.target.value })} /></label>
              <label className="wide"><span>Notes</span><textarea value={dispositionForm.notes} onChange={(e) => setDispositionForm({ ...dispositionForm, notes: e.target.value })} /></label>
              <button className="icu-submit" disabled={Boolean(saving)}><Stethoscope size={16} /> Save Disposition</button>
            </form> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

