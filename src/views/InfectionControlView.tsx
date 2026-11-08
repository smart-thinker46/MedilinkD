import type { FormEvent, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Biohazard,
  CheckCircle2,
  FlaskConical,
  Hand,
  Maximize2,
  Minimize2,
  Pill,
  Plus,
  RefreshCw,
  Search,
  Send,
  ShieldAlert,
  Sparkles,
  X,
} from "lucide-react";
import { api } from "../lib/api";
import { useLiveRefresh } from "../lib/liveRefresh";

const unwrapRows = (value: any): any[] => {
  const data = value?.data ?? value;
  if (Array.isArray(data)) return data;
  for (const candidate of [data?.items, data?.rows, data?.results, data?.tokens, data?.data]) {
    if (Array.isArray(candidate)) return candidate;
    if (candidate && typeof candidate === "object") {
      const nested = unwrapRows(candidate);
      if (nested.length) return nested;
    }
  }
  return [];
};
const unwrapObject = (value: any) => value?.data?.data || value?.data || value || {};
const todayValue = () => new Date().toISOString().slice(0, 10);
const nowTime = () => new Date().toTimeString().slice(0, 5);
const dateTimeValue = (date: string, time = "00:00") => `${date}T${time || "00:00"}:00`;
const formatDate = (value: any) => {
  const date = new Date(String(value || ""));
  if (!Number.isFinite(date.getTime())) return "Not recorded";
  return date.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
};
const patientName = (row: any) => [row?.firstName, row?.lastName].filter(Boolean).join(" ") || row?.patientCode || row?.mrn || "Unnamed patient";
const toneFromNotice = (notice: string) => (/failed|could not|required|alert|quarantine|below|select/i.test(notice) ? "warning" : "success");

export default function InfectionControlView() {
  const [dashboard, setDashboard] = useState<any>({});
  const [hai, setHai] = useState<any[]>([]);
  const [isolations, setIsolations] = useState<any[]>([]);
  const [handAudits, setHandAudits] = useState<any[]>([]);
  const [cycles, setCycles] = useState<any[]>([]);
  const [antibiograms, setAntibiograms] = useState<any[]>([]);
  const [outbreaks, setOutbreaks] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [modal, setModal] = useState("");
  const [saving, setSaving] = useState("");
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [workflowPopup, setWorkflowPopup] = useState<"monitor" | "waiting" | "queue" | "">("");
  const [waitingRows, setWaitingRows] = useState<any[]>([]);
  const [workflowLoading, setWorkflowLoading] = useState(false);
  const [queuePatientId, setQueuePatientId] = useState("");
  const [waitingCheckInDate, setWaitingCheckInDate] = useState(todayValue());

  const [haiForm, setHaiForm] = useState({ patientId: "", admissionId: "", wardId: "GENERAL", source: "PASSIVE", haiType: "SUSPECTED_HAI", organism: "", specimenHoursAfterAdmission: "48", diagnosisDate: todayValue(), implicatedDevice: "", treatment: "", investigationResults: "" });
  const [isolationForm, setIsolationForm] = useState({ patientId: "", admissionId: "", precautionType: "CONTACT", organism: "", reason: "", roomType: "", ppeRequired: "", visitorRestrictions: "", startedDate: todayValue(), startedTime: nowTime() });
  const [handForm, setHandForm] = useState({ wardId: "GENERAL", staffRole: "NURSE", moment: "BEFORE_PATIENT_CONTACT", totalOpportunities: "1", opportunitiesTaken: "1", observationPeriodMin: "15", productAvailable: true, sinkFunctional: true, feedbackGiven: true });
  const [cycleForm, setCycleForm] = useState({ autoclaveId: "AUTOCLAVE-1", cycleNumber: "", cycleType: "STEAM", temperatureC: "134", pressureBar: "2.1", holdTimeMin: "4", cycleDate: todayValue(), cycleStartTime: nowTime(), cycleEndTime: nowTime(), chemicalIndicatorResult: "PASS", bowieDickResult: "PASS", biologicalIndicatorResult: "", trays: "", failureAction: "" });
  const [antibiogramForm, setAntibiogramForm] = useState({ organism: "E. coli", periodStart: todayValue(), periodEnd: todayValue(), isolateCount: "30", ciprofloxacin: "67", ceftriaxone: "72", meropenem: "94", vancomycin: "0", notes: "" });
  const [outbreakForm, setOutbreakForm] = useState({ organism: "MRSA", syndrome: "MRSA cluster", wardId: "GENERAL", threshold: "3" });
  const [actionForm, setActionForm] = useState({ outbreakId: "", actionType: "Enhanced cleaning", responsiblePerson: "", actionDate: todayValue(), notes: "", closeOutbreak: false });

  const setToast = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice((current) => (current === message ? "" : current)), 6500);
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
      const [dashRes, haiRes, isoRes, handRes, cycleRes, antiRes, outRes, patientRes] = await Promise.all([
        safeGet("/infection-control/dashboard", "dashboard", {}),
        safeGet("/infection-control/hai", "HAI surveillance", []),
        safeGet("/infection-control/isolations", "isolation precautions", []),
        safeGet("/infection-control/hand-hygiene", "hand hygiene audits", []),
        safeGet("/infection-control/sterilisation-cycles", "CSSD cycles", []),
        safeGet("/infection-control/antibiograms", "antibiograms", []),
        safeGet("/infection-control/outbreaks", "outbreak investigations", []),
        safeGet("/patients", "patients", [], { params: { limit: 500 } }),
      ]);
      const responses: any[] = [dashRes, haiRes, isoRes, handRes, cycleRes, antiRes, outRes, patientRes];
      const failed = responses.filter((response) => response.__error);
      if (failed.length) setToast(`${failed.map((response) => `${response.__label}${response.__status ? ` (${response.__status})` : ""}`).join(", ")} could not be loaded. Check your connection or permissions.`);
      const haiRows = unwrapRows(haiRes.data);
      setDashboard(unwrapObject(dashRes.data));
      setHai(haiRows);
      setIsolations(unwrapRows(isoRes.data));
      setHandAudits(unwrapRows(handRes.data));
      setCycles(unwrapRows(cycleRes.data));
      setAntibiograms(unwrapRows(antiRes.data));
      setOutbreaks(unwrapRows(outRes.data));
      setPatients(unwrapRows(patientRes.data));
      setSelectedPatientId((current) => current || haiRows[0]?.patientId || "");
    } catch (error: any) {
      setToast(error?.response?.data?.message || "Infection control data could not be loaded.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);
  useLiveRefresh(load, { intervalMs: 45000 });

  useEffect(() => {
    const handleSidebarAction = (event: Event) => {
      const action = (event as CustomEvent<{ action?: string }>).detail?.action;
      if (action === "monitor-patient") setWorkflowPopup("monitor");
      if (action === "queue-patient") setWorkflowPopup("queue");
    };
    const handleWaitingList = (event: Event) => {
      const detail = (event as CustomEvent<{ moduleKey?: string }>).detail;
      if (detail?.moduleKey !== "infection-control") return;
      setWorkflowPopup("waiting");
      setWorkflowLoading(true);
      api.get("/opd/queue/board", { params: { departmentId: "INFECTION_CONTROL" } })
        .then((response) => setWaitingRows(unwrapRows(response.data)))
        .catch(() => { setWaitingRows([]); setToast("Infection Control waiting list could not be loaded."); })
        .finally(() => setWorkflowLoading(false));
    };
    window.addEventListener("hmis:infection-control-sidebar-action", handleSidebarAction);
    window.addEventListener("hmis:open-module-waiting-list", handleWaitingList);
    return () => {
      window.removeEventListener("hmis:infection-control-sidebar-action", handleSidebarAction);
      window.removeEventListener("hmis:open-module-waiting-list", handleWaitingList);
    };
  }, []);

  const patientLabel = (patientId: string) => {
    const patient = patients.find((row) => row.id === patientId);
    return patient ? `${patientName(patient)} | ${patient.patientCode || patient.mrn || "No MRN"}` : patientId || "-";
  };
  const selectedHai = hai.filter((row) => row.patientId === selectedPatientId);
  const selectedIsolation = isolations.find((row) => row.patientId === selectedPatientId && !row.endedAt);
  const selectedActivityRows = [
    ...isolations.slice(0, 5).map((row) => ({ area: "Isolation", measure: `${patientLabel(row.patientId)} | ${row.precautionType}`, status: row.endedAt ? "ENDED" : "ACTIVE", date: row.startedAt })),
    ...handAudits.slice(0, 5).map((row) => ({ area: "Hand hygiene", measure: `${row.wardId} | ${row.complianceRate}%`, status: row.complianceRate >= 80 ? "PASS" : "BELOW_TARGET", date: row.auditDate })),
    ...cycles.slice(0, 5).map((row) => ({ area: "CSSD", measure: `${row.autoclaveId} | ${row.cycleNumber}`, status: row.cyclePassed ? "CLEARED" : "QUARANTINED", date: row.cycleStartedAt })),
    ...antibiograms.slice(0, 5).map((row) => ({ area: "Antibiogram", measure: `${row.organism} | ${row.isolateCount} isolates`, status: "PUBLISHED", date: row.periodEnd })),
    ...outbreaks.slice(0, 5).map((row) => ({ area: "Outbreak", measure: `${row.organism} | ${row.wardId}`, status: row.status, date: row.createdAt })),
  ];

  const filteredHai = useMemo(() => {
    const q = search.trim().toLowerCase();
    return hai.filter((row) => {
      if (filter === "MDRO" && !row.isMultiDrugResistant) return false;
      if (filter === "OPEN" && String(row.outcome || "").toUpperCase() !== "OPEN") return false;
      if (!q) return true;
      return `${patientLabel(row.patientId)} ${row.organism} ${row.haiType} ${row.wardId} ${row.investigationResults}`.toLowerCase().includes(q);
    });
  }, [hai, patients, search, filter]);
  const loadedTotals = dashboard?.totals || {};
  const derivedHandCompliance = handAudits.length
    ? Math.round((handAudits.reduce((sum, row) => sum + Number(row.complianceRate || 0), 0) / handAudits.length) * 10) / 10
    : 0;
  const totals = {
    haiFlags: loadedTotals.haiFlags ?? hai.length,
    activeIsolations: loadedTotals.activeIsolations ?? isolations.filter((row) => !row.endedAt).length,
    handHygieneCompliance: loadedTotals.handHygieneCompliance ?? derivedHandCompliance,
    failedCycles: loadedTotals.failedCycles ?? cycles.filter((row) => !row.cyclePassed).length,
    antibiograms: loadedTotals.antibiograms ?? antibiograms.length,
    openOutbreaks: loadedTotals.openOutbreaks ?? outbreaks.filter((row) => String(row.status || "").toUpperCase() !== "CLOSED").length,
    sterilisationPassRate: loadedTotals.sterilisationPassRate ?? (cycles.length ? Math.round((cycles.filter((row) => row.cyclePassed).length / cycles.length) * 1000) / 10 : 0),
  };
  const statCards = [
    { label: "HAI Flags", value: totals.haiFlags || 0, color: "#dc2626", icon: Biohazard, action: () => setFilter("ALL") },
    { label: "Isolation", value: totals.activeIsolations || 0, color: "#d97706", icon: ShieldAlert, action: () => openIsolation() },
    { label: "Hand Hygiene", value: `${totals.handHygieneCompliance || 0}%`, color: "#16a34a", icon: Hand, action: () => setModal("hand") },
    { label: "Failed CSSD", value: totals.failedCycles || 0, color: "#991b1b", icon: AlertTriangle, action: () => setModal("cycle") },
    { label: "Antibiograms", value: totals.antibiograms || 0, color: "#7c3aed", icon: Pill, action: () => setModal("antibiogram") },
    { label: "Outbreaks", value: totals.openOutbreaks || 0, color: "#0891b2", icon: Sparkles, action: () => setModal("outbreak") },
  ];

  const closeAfter = async (message: string) => {
    setToast(message);
    setModal("");
    await load();
  };
  const openHai = () => {
    setHaiForm((current) => ({ ...current, patientId: selectedPatientId || current.patientId }));
    setModal("hai");
  };
  const openIsolation = () => {
    setIsolationForm((current) => ({ ...current, patientId: selectedPatientId || current.patientId }));
    setModal("isolation");
  };
  const openOutbreakAction = () => {
    if (!outbreaks.length) {
      setToast("Create an outbreak investigation first.");
      return;
    }
    const openOutbreak = outbreaks.find((row) => row.status !== "CLOSED") || outbreaks[0];
    setActionForm((current) => ({ ...current, outbreakId: openOutbreak?.outbreakId || "" }));
    setModal("outbreak-action");
  };

  const saveHai = (event: FormEvent) => {
    event.preventDefault();
    setSaving("hai");
    api.post("/infection-control/hai", haiForm)
      .then((res) => { setSelectedPatientId(res.data?.patientId || selectedPatientId); return closeAfter(res.data?.isMultiDrugResistant ? "HAI flag saved with automated MDRO alert." : "HAI surveillance record saved."); })
      .catch((error) => setToast(error?.response?.data?.message || "HAI record could not be saved."))
      .finally(() => setSaving(""));
  };
  const saveIsolation = (event: FormEvent) => {
    event.preventDefault();
    setSaving("isolation");
    api.post("/infection-control/isolations", { ...isolationForm, startedAt: dateTimeValue(isolationForm.startedDate, isolationForm.startedTime) })
      .then(() => closeAfter("Isolation precautions activated with PPE and visitor restrictions."))
      .catch((error) => setToast(error?.response?.data?.message || "Isolation precautions could not be saved."))
      .finally(() => setSaving(""));
  };
  const endIsolation = () => {
    if (!selectedIsolation?.id) {
      setToast("No active isolation is selected for this patient.");
      return;
    }
    setSaving("end-isolation");
    api.patch(`/infection-control/isolations/${selectedIsolation.id}/end`, { endedReason: "Cleared by infection control" })
      .then(() => closeAfter("Isolation precautions ended."))
      .catch((error) => setToast(error?.response?.data?.message || "Isolation could not be ended."))
      .finally(() => setSaving(""));
  };
  const saveHand = (event: FormEvent) => {
    event.preventDefault();
    setSaving("hand");
    api.post("/infection-control/hand-hygiene", handForm)
      .then((res) => closeAfter(`Hand hygiene audit saved. Compliance: ${res.data?.complianceRate || 0}%.`))
      .catch((error) => setToast(error?.response?.data?.message || "Hand hygiene audit could not be saved."))
      .finally(() => setSaving(""));
  };
  const saveCycle = (event: FormEvent) => {
    event.preventDefault();
    setSaving("cycle");
    api.post("/infection-control/sterilisation-cycles", { ...cycleForm, cycleStartedAt: dateTimeValue(cycleForm.cycleDate, cycleForm.cycleStartTime), cycleEndedAt: dateTimeValue(cycleForm.cycleDate, cycleForm.cycleEndTime) })
      .then((res) => closeAfter(res.data?.cyclePassed ? "CSSD cycle passed and items cleared for use." : "CSSD cycle failed. Loaded trays quarantined."))
      .catch((error) => setToast(error?.response?.data?.message || "Sterilisation cycle could not be saved."))
      .finally(() => setSaving(""));
  };
  const saveAntibiogram = (event: FormEvent) => {
    event.preventDefault();
    setSaving("antibiogram");
    api.post("/infection-control/antibiograms", antibiogramForm)
      .then(() => closeAfter("Antibiogram published for stewardship/CDSS reference."))
      .catch((error) => setToast(error?.response?.data?.message || "Antibiogram could not be saved."))
      .finally(() => setSaving(""));
  };
  const saveOutbreak = (event: FormEvent) => {
    event.preventDefault();
    setSaving("outbreak");
    api.post("/infection-control/outbreaks", outbreakForm)
      .then((res) => closeAfter(res.data?.alert ? "Outbreak alert opened with generated line list." : "Outbreak investigation record opened."))
      .catch((error) => setToast(error?.response?.data?.message || "Outbreak record could not be opened."))
      .finally(() => setSaving(""));
  };
  const saveOutbreakAction = (event: FormEvent) => {
    event.preventDefault();
    if (!actionForm.outbreakId) {
      setToast("Select an outbreak before saving a response action.");
      return;
    }
    setSaving("outbreak-action");
    api.post(`/infection-control/outbreaks/${actionForm.outbreakId}/actions`, actionForm)
      .then((res) => closeAfter(res.data?.status === "CLOSED" ? "Outbreak closed by infection control." : "Outbreak response action saved."))
      .catch((error) => setToast(error?.response?.data?.message || "Outbreak action could not be saved."))
      .finally(() => setSaving(""));
  };

  const queueSelectedPatient = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!queuePatientId) {
      setToast("Select a registered patient before adding them to the Infection Control queue.");
      return;
    }
    setSaving("queue-patient");
    try {
      await api.post("/opd/queue/token", { patientId: queuePatientId, departmentId: "INFECTION_CONTROL", queueType: "INFECTION_CONTROL", priority: "NORMAL" });
      setWorkflowPopup("");
      setQueuePatientId("");
      setToast("Patient added to the Infection Control waiting list.");
    } catch (error: any) {
      setToast(error?.response?.data?.message || "Patient could not be added to the Infection Control queue.");
    } finally {
      setSaving("");
    }
  };

  const checkInQueuedPatient = async (row: any) => {
    const tokenNumber = String(row?.tokenNumber || row?.token || "").trim();
    const patientId = String(row?.patientId || "").trim();
    if (!tokenNumber || !patientId) {
      setToast("This waiting-list entry has no queue token or patient identifier.");
      return;
    }
    setSaving("check-in");
    try {
      const checkingOut = String(row?.status || "").toUpperCase() === "IN_SERVICE";
      await api.patch("/opd/queue/token/status", { tokenNumber, status: checkingOut ? "COMPLETED" : "IN_SERVICE", checkInDate: waitingCheckInDate, reason: checkingOut ? "Checked out from Infection Control waiting list" : "Checked in from Infection Control waiting list" });
      setWaitingRows((current) => checkingOut ? current.filter((item) => item.tokenNumber !== tokenNumber && item.token !== tokenNumber) : current.map((item) => (item.tokenNumber === tokenNumber || item.token === tokenNumber ? { ...item, status: "IN_SERVICE" } : item)));
      setToast(`${row.patientName || row.patientCode || "Patient"} ${checkingOut ? "checked out from" : "checked in for"} Infection Control.`);
      await load();
    } catch (error: any) {
      setToast(error?.response?.data?.message || "Infection Control patient check-in failed.");
    } finally {
      setSaving("");
    }
  };

  return (
    <div className="nursing-view infection-view">
      <div className="pv-header">
        <div>
          <h2 className="pv-title">Infection Control and CSSD</h2>
          <p className="pv-subtitle">HAI surveillance, isolation precautions, WHO hand hygiene audits, sterilisation validation, antibiograms, and outbreak response.</p>
        </div>
        <div className="nursing-header-actions">
          <button type="button" className="nursing-secondary-btn" onClick={load}><RefreshCw size={15} /> Refresh</button>
          <button type="button" className="nursing-action-btn" onClick={openHai}><Plus size={15} /> HAI Flag</button>
          <button type="button" className="nursing-action-btn is-blue" onClick={openIsolation}><ShieldAlert size={15} /> Isolation</button>
        </div>
      </div>

      {notice ? (
        <div className={`module-notice-toast is-${toneFromNotice(notice)}`} role="status" aria-live="polite">
          <div><strong>Infection Control</strong><span>{notice}</span></div>
          <button type="button" className="module-notice-close" onClick={() => setNotice("")}>×</button>
        </div>
      ) : null}

      {workflowPopup ? (
        <div className="infection-workflow-backdrop" role="presentation" onClick={() => setWorkflowPopup("")}>
          <section className="infection-workflow-modal" role="dialog" aria-modal="true" aria-labelledby="infection-workflow-title" onClick={(event) => event.stopPropagation()}>
            <header>
              <div><span>INFECTION CONTROL WORKSPACE</span><h2 id="infection-workflow-title">{workflowPopup === "monitor" ? "Monitor infection-control patients" : workflowPopup === "waiting" ? "Infection Control waiting list" : "Queue a patient"}</h2><p>{workflowPopup === "monitor" ? "Select a patient with an HAI or active precaution to review their safety context." : workflowPopup === "waiting" ? "Review patients routed from other clinical services and check them in safely." : "Route a registered patient to the Infection Control worklist."}</p></div>
              <button type="button" aria-label="Close Infection Control workspace" onClick={() => setWorkflowPopup("")}><X size={17} /></button>
            </header>
            <div className="infection-workflow-body">
              {workflowPopup === "monitor" ? <div className="infection-workflow-list">{patients.filter((patient) => hai.some((row) => row.patientId === patient.id) || isolations.some((row) => row.patientId === patient.id)).slice(0, 100).map((patient) => <button key={patient.id} type="button" onClick={() => { setSelectedPatientId(patient.id); setWorkflowPopup(""); }}><strong>{patientName(patient)}</strong><span>{patientLabel(patient.id)}</span></button>)}{patients.filter((patient) => hai.some((row) => row.patientId === patient.id) || isolations.some((row) => row.patientId === patient.id)).length === 0 ? <p className="infection-workflow-note">No HAI or isolation patients are currently available to monitor.</p> : null}</div> : null}
              {workflowPopup === "waiting" ? <div><label className="infection-workflow-date"><span>Check-in date</span><input type="date" value={waitingCheckInDate} onChange={(event) => setWaitingCheckInDate(event.target.value)} /></label>{workflowLoading ? <p className="infection-workflow-note">Loading Infection Control waiting list...</p> : waitingRows.length ? <div className="infection-workflow-list">{waitingRows.map((row, index) => <div className="infection-workflow-list-item" key={row.id || row.tokenId || row.tokenNumber || index}><button type="button" onClick={() => { if (row.patientId) setSelectedPatientId(row.patientId); setWorkflowPopup(""); }}><strong>{row.patientName || row.patientCode || patientLabel(row.patientId)}</strong><span>Token {row.tokenNumber || row.token || "-"} · {row.status || "WAITING"} · From {row.sourceModule || row.departmentName || row.departmentId || "another service"}</span></button><button type="button" className="infection-workflow-checkin" disabled={saving === "check-in"} onClick={() => void checkInQueuedPatient(row)}>{saving === "check-in" ? "Updating..." : String(row.status || "").toUpperCase() === "IN_SERVICE" ? "Check Out" : "Check In"}</button></div>)}</div> : <p className="infection-workflow-note">No patients are currently waiting for Infection Control.</p>}</div> : null}
              {workflowPopup === "queue" ? <form className="infection-workflow-form" onSubmit={queueSelectedPatient}><label><span>Registered patient</span><select required value={queuePatientId} onChange={(event) => setQueuePatientId(event.target.value)}><option value="">Select a patient</option>{patients.map((patient) => <option key={patient.id} value={patient.id}>{patientName(patient)} | {patient.patientCode || patient.mrn || "No MRN"}</option>)}</select></label><footer><button type="button" className="nursing-secondary-btn" onClick={() => setWorkflowPopup("")}>Cancel</button><button type="submit" className="nursing-action-btn" disabled={saving === "queue-patient"}><Send size={15} /> {saving === "queue-patient" ? "Queueing..." : "Queue Patient"}</button></footer></form> : null}
            </div>
          </section>
        </div>
      ) : null}

      <div className="pv-stats nursing-stats-grid">
        {statCards.map(({ label, value, color, icon: Icon, action }) => (
          <button key={label} type="button" className="pv-stat-card infection-stat-card" style={{ borderLeftColor: color }} onClick={action}>
            <p className="pv-stat-label">{label}</p>
            <p className="pv-stat-value">{loading ? "..." : value}</p>
            <Icon className="infection-stat-icon" size={19} style={{ color }} />
          </button>
        ))}
      </div>

      <div className="infection-layout">
        <section className="nursing-worklist">
          <div className="pv-search-bar infection-filter-bar">
            <div className="pv-search-wrap">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input className="pv-search" placeholder="Search patient, organism, ward..." value={search} onChange={(event) => setSearch(event.target.value)} />
            </div>
            <select className="nursing-filter-select" value={filter} onChange={(event) => setFilter(event.target.value)}>
              <option value="ALL">All HAI</option>
              <option value="OPEN">Open</option>
              <option value="MDRO">MDRO</option>
            </select>
          </div>
          <div className="pv-table-wrap">
            <table className="pv-table">
              <thead><tr><th>Patient</th><th>Organism</th><th>Type</th><th>Ward</th><th>Outcome</th></tr></thead>
              <tbody>
                {loading ? <tr><td colSpan={5} className="pv-empty">Loading HAI worklist...</td></tr> : filteredHai.length === 0 ? <tr><td colSpan={5} className="pv-empty">No HAI flags found.</td></tr> : filteredHai.map((row) => (
                  <tr key={row.id} className={row.patientId === selectedPatientId ? "nursing-selected-row" : ""} onClick={() => setSelectedPatientId(row.patientId)}>
                    <td className="pv-name">{patientLabel(row.patientId)}</td><td>{row.organism || "-"}</td><td>{row.haiType}</td><td>{row.wardId || "-"}</td><td><span className={`pv-badge ${row.isMultiDrugResistant ? "is-danger" : "is-info"}`}>{row.outcome || "OPEN"}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="nursing-care-panel">
          <div className="nursing-care-header">
            <div><span>Selected Patient</span><strong>{selectedPatientId ? patientLabel(selectedPatientId) : "No patient selected"}</strong></div>
            <span className={`pv-badge ${selectedIsolation ? "is-warning" : "is-success"}`}>{selectedIsolation ? selectedIsolation.precautionType : "No isolation"}</span>
          </div>
          <div className="infection-action-row">
            <button type="button" className="infection-action-btn is-danger" onClick={openHai}><Biohazard size={14} /> HAI Report</button>
            <button type="button" className="infection-action-btn is-warning" onClick={openIsolation}><ShieldAlert size={14} /> Isolation</button>
            <button type="button" className="infection-action-btn is-info" onClick={() => setModal("hand")}><Hand size={14} /> Hand Audit</button>
            <button type="button" className="infection-action-btn is-purple" onClick={() => setModal("cycle")}><FlaskConical size={14} /> CSSD Cycle</button>
            <button type="button" className="infection-action-btn is-teal" onClick={() => setModal("antibiogram")}><Pill size={14} /> Antibiogram</button>
            <button type="button" className="infection-action-btn is-blue" onClick={() => setModal("outbreak")}><Sparkles size={14} /> Outbreak</button>
            <button type="button" className="infection-action-btn is-success" onClick={openOutbreakAction}><CheckCircle2 size={14} /> Response</button>
          </div>
          <div className="infection-detail-grid">
            <InfoCard title="Isolation Banner" rows={[["Precaution", selectedIsolation?.precautionType || "-"], ["PPE", selectedIsolation?.ppeRequired?.join?.(", ") || "-"], ["Visitors", selectedIsolation?.visitorRestrictions || "-"]]} />
            <InfoCard title="HAI Investigation" rows={[["Flags", selectedHai.length], ["Latest organism", selectedHai[0]?.organism || "-"], ["MDRO", selectedHai.some((row) => row.isMultiDrugResistant) ? "Yes" : "No"]]} />
            <InfoCard title="CSSD Validation" rows={[["Cycles", cycles.length], ["Pass rate", `${totals.sterilisationPassRate || 0}%`], ["Failed", totals.failedCycles || 0]]} />
            <InfoCard title="Stewardship" rows={[["Antibiograms", antibiograms.length], ["Latest organism", antibiograms[0]?.organism || "-"], ["CDSS", antibiograms.length ? "Published" : "-"]]} />
          </div>
          {selectedIsolation ? <div className="infection-isolation-banner"><ShieldAlert size={18} /><strong>{selectedIsolation.precautionType} precautions</strong><span>{selectedIsolation.ppeRequired?.join?.(", ")} | {selectedIsolation.visitorRestrictions}</span><button type="button" onClick={endIsolation} disabled={saving === "end-isolation"}>End</button></div> : null}
          <div className="pv-table-wrap infection-table">
            <table className="pv-table">
              <thead><tr><th>Area</th><th>Measure</th><th>Status</th><th>Date</th></tr></thead>
              <tbody>
                {selectedActivityRows.length === 0 ? (
                  <tr><td colSpan={4} className="pv-empty">No isolation, hand hygiene, CSSD, antibiogram, or outbreak activity recorded.</td></tr>
                ) : selectedActivityRows.map((row) => (
                  <tr key={`${row.area}-${row.measure}-${row.date}`}><td>{row.area}</td><td>{row.measure}</td><td><span className={`pv-badge ${/PASS|CLEARED|CLOSED|PUBLISHED|ENDED/.test(row.status) ? "is-success" : /QUARANTINED|BELOW|ACTIVE/.test(row.status) ? "is-warning" : "is-info"}`}>{row.status}</span></td><td>{formatDate(row.date)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {modal === "hai" ? <InfectionModal tone="danger" title="HAI Surveillance Flag" subtitle="Supports active surveillance, passive staff reporting, and automated MDRO alert organisms." onSubmit={saveHai} onClose={() => setModal("")} saving={saving === "hai"} saveText="Save HAI"><div className="infection-form-grid">
        <Field label="Patient" wide><select required value={haiForm.patientId} onChange={(e) => setHaiForm({ ...haiForm, patientId: e.target.value })}><option value="">Select patient</option>{patients.map((patient) => <option key={patient.id} value={patient.id}>{patientName(patient)} | {patient.patientCode || patient.mrn || "No MRN"}</option>)}</select></Field>
        <Field label="Source"><select value={haiForm.source} onChange={(e) => setHaiForm({ ...haiForm, source: e.target.value })}><option>PASSIVE</option><option>ACTIVE</option><option>AUTOMATED</option></select></Field>
        <Field label="Specimen hours after admission"><input type="number" value={haiForm.specimenHoursAfterAdmission} onChange={(e) => setHaiForm({ ...haiForm, specimenHoursAfterAdmission: e.target.value })} /></Field>
        <Field label="HAI type"><input value={haiForm.haiType} onChange={(e) => setHaiForm({ ...haiForm, haiType: e.target.value })} /></Field>
        <Field label="Organism"><input value={haiForm.organism} onChange={(e) => setHaiForm({ ...haiForm, organism: e.target.value })} placeholder="MRSA, VRE, CRE, C. difficile..." /></Field>
        <Field label="Ward"><input value={haiForm.wardId} onChange={(e) => setHaiForm({ ...haiForm, wardId: e.target.value })} /></Field>
        <Field label="Admission ID"><input value={haiForm.admissionId} onChange={(e) => setHaiForm({ ...haiForm, admissionId: e.target.value })} /></Field>
        <Field label="Diagnosis date"><input type="date" value={haiForm.diagnosisDate} onChange={(e) => setHaiForm({ ...haiForm, diagnosisDate: e.target.value })} /></Field>
        <Field label="Implicated device"><input value={haiForm.implicatedDevice} onChange={(e) => setHaiForm({ ...haiForm, implicatedDevice: e.target.value })} /></Field>
        <Field label="Investigation findings" wide><textarea value={haiForm.investigationResults} onChange={(e) => setHaiForm({ ...haiForm, investigationResults: e.target.value })} /></Field>
        <Field label="Treatment" wide><textarea value={haiForm.treatment} onChange={(e) => setHaiForm({ ...haiForm, treatment: e.target.value })} /></Field>
      </div></InfectionModal> : null}

      {modal === "isolation" ? <InfectionModal tone="warning" title="Isolation Precautions" subtitle="Activates screen banners, PPE requirements, visitor restrictions, and bed-map precaution status." onSubmit={saveIsolation} onClose={() => setModal("")} saving={saving === "isolation"} saveText="Activate Isolation"><div className="infection-form-grid">
        <Field label="Patient" wide><select required value={isolationForm.patientId} onChange={(e) => setIsolationForm({ ...isolationForm, patientId: e.target.value })}><option value="">Select patient</option>{patients.map((patient) => <option key={patient.id} value={patient.id}>{patientName(patient)} | {patient.patientCode || patient.mrn || "No MRN"}</option>)}</select></Field>
        <Field label="Precaution type"><select value={isolationForm.precautionType} onChange={(e) => setIsolationForm({ ...isolationForm, precautionType: e.target.value })}><option>CONTACT</option><option>DROPLET</option><option>AIRBORNE</option></select></Field>
        <Field label="Organism"><input value={isolationForm.organism} onChange={(e) => setIsolationForm({ ...isolationForm, organism: e.target.value })} /></Field>
        <Field label="Admission ID"><input value={isolationForm.admissionId} onChange={(e) => setIsolationForm({ ...isolationForm, admissionId: e.target.value })} /></Field>
        <Field label="Room type"><input value={isolationForm.roomType} onChange={(e) => setIsolationForm({ ...isolationForm, roomType: e.target.value })} /></Field>
        <Field label="Started date"><input type="date" value={isolationForm.startedDate} onChange={(e) => setIsolationForm({ ...isolationForm, startedDate: e.target.value })} /></Field>
        <Field label="Started time"><input type="time" value={isolationForm.startedTime} onChange={(e) => setIsolationForm({ ...isolationForm, startedTime: e.target.value })} /></Field>
        <Field label="Reason" wide><textarea value={isolationForm.reason} onChange={(e) => setIsolationForm({ ...isolationForm, reason: e.target.value })} /></Field>
        <Field label="PPE required" wide><input value={isolationForm.ppeRequired} onChange={(e) => setIsolationForm({ ...isolationForm, ppeRequired: e.target.value })} placeholder="Leave blank for system default" /></Field>
        <Field label="Visitor restrictions" wide><textarea value={isolationForm.visitorRestrictions} onChange={(e) => setIsolationForm({ ...isolationForm, visitorRestrictions: e.target.value })} /></Field>
      </div></InfectionModal> : null}

      {modal === "hand" ? <InfectionModal tone="info" title="WHO Five Moments Hand Hygiene Audit" subtitle="Records observation moment, staff role, compliance, supplies, and feedback for trend reporting." onSubmit={saveHand} onClose={() => setModal("")} saving={saving === "hand"} saveText="Save Audit"><div className="infection-form-grid">
        <Field label="Ward/department"><input value={handForm.wardId} onChange={(e) => setHandForm({ ...handForm, wardId: e.target.value })} /></Field>
        <Field label="Staff role"><input value={handForm.staffRole} onChange={(e) => setHandForm({ ...handForm, staffRole: e.target.value })} /></Field>
        <Field label="WHO moment"><select value={handForm.moment} onChange={(e) => setHandForm({ ...handForm, moment: e.target.value })}><option>BEFORE_PATIENT_CONTACT</option><option>BEFORE_ASEPTIC_PROCEDURE</option><option>AFTER_BODY_FLUID_EXPOSURE</option><option>AFTER_PATIENT_CONTACT</option><option>AFTER_PATIENT_SURROUNDINGS</option></select></Field>
        <Field label="Total opportunities"><input type="number" value={handForm.totalOpportunities} onChange={(e) => setHandForm({ ...handForm, totalOpportunities: e.target.value })} /></Field>
        <Field label="Opportunities taken"><input type="number" value={handForm.opportunitiesTaken} onChange={(e) => setHandForm({ ...handForm, opportunitiesTaken: e.target.value })} /></Field>
        <Field label="Observation minutes"><input type="number" value={handForm.observationPeriodMin} onChange={(e) => setHandForm({ ...handForm, observationPeriodMin: e.target.value })} /></Field>
        <Check label="Product available" checked={handForm.productAvailable} onChange={(checked) => setHandForm({ ...handForm, productAvailable: checked })} />
        <Check label="Sink functional" checked={handForm.sinkFunctional} onChange={(checked) => setHandForm({ ...handForm, sinkFunctional: checked })} />
        <Check label="Feedback given" checked={handForm.feedbackGiven} onChange={(checked) => setHandForm({ ...handForm, feedbackGiven: checked })} />
      </div></InfectionModal> : null}

      {modal === "cycle" ? <InfectionModal tone="purple" title="CSSD Sterilisation Cycle Validation" subtitle="Server validates temperature, pressure, hold time, chemical indicator, Bowie-Dick, and biological indicator before release." onSubmit={saveCycle} onClose={() => setModal("")} saving={saving === "cycle"} saveText="Save Cycle"><div className="infection-form-grid">
        <Field label="Autoclave"><input value={cycleForm.autoclaveId} onChange={(e) => setCycleForm({ ...cycleForm, autoclaveId: e.target.value })} /></Field>
        <Field label="Cycle number"><input value={cycleForm.cycleNumber} onChange={(e) => setCycleForm({ ...cycleForm, cycleNumber: e.target.value })} /></Field>
        <Field label="Temperature C"><input type="number" value={cycleForm.temperatureC} onChange={(e) => setCycleForm({ ...cycleForm, temperatureC: e.target.value })} /></Field>
        <Field label="Pressure bar"><input type="number" value={cycleForm.pressureBar} onChange={(e) => setCycleForm({ ...cycleForm, pressureBar: e.target.value })} /></Field>
        <Field label="Hold time min"><input type="number" value={cycleForm.holdTimeMin} onChange={(e) => setCycleForm({ ...cycleForm, holdTimeMin: e.target.value })} /></Field>
        <Field label="Date"><input type="date" value={cycleForm.cycleDate} onChange={(e) => setCycleForm({ ...cycleForm, cycleDate: e.target.value })} /></Field>
        <Field label="Start"><input type="time" value={cycleForm.cycleStartTime} onChange={(e) => setCycleForm({ ...cycleForm, cycleStartTime: e.target.value })} /></Field>
        <Field label="End"><input type="time" value={cycleForm.cycleEndTime} onChange={(e) => setCycleForm({ ...cycleForm, cycleEndTime: e.target.value })} /></Field>
        <Field label="Chemical indicator"><select value={cycleForm.chemicalIndicatorResult} onChange={(e) => setCycleForm({ ...cycleForm, chemicalIndicatorResult: e.target.value })}><option>PASS</option><option>FAIL</option></select></Field>
        <Field label="Bowie-Dick"><select value={cycleForm.bowieDickResult} onChange={(e) => setCycleForm({ ...cycleForm, bowieDickResult: e.target.value })}><option>PASS</option><option>FAIL</option><option value="">Not done</option></select></Field>
        <Field label="Biological indicator"><select value={cycleForm.biologicalIndicatorResult} onChange={(e) => setCycleForm({ ...cycleForm, biologicalIndicatorResult: e.target.value })}><option value="">Pending/not weekly</option><option>PASS</option><option>FAIL</option></select></Field>
        <Field label="Trays loaded" wide><textarea value={cycleForm.trays} onChange={(e) => setCycleForm({ ...cycleForm, trays: e.target.value })} /></Field>
        <Field label="Failure action" wide><textarea value={cycleForm.failureAction} onChange={(e) => setCycleForm({ ...cycleForm, failureAction: e.target.value })} /></Field>
      </div></InfectionModal> : null}

      {modal === "antibiogram" ? <InfectionModal tone="teal" title="Antibiogram Publication" subtitle="Publishes local susceptibility data for antimicrobial stewardship and CDSS prescribing advice." onSubmit={saveAntibiogram} onClose={() => setModal("")} saving={saving === "antibiogram"} saveText="Publish Antibiogram"><div className="infection-form-grid">
        <Field label="Organism"><input required value={antibiogramForm.organism} onChange={(e) => setAntibiogramForm({ ...antibiogramForm, organism: e.target.value })} /></Field>
        <Field label="Isolate count"><input type="number" value={antibiogramForm.isolateCount} onChange={(e) => setAntibiogramForm({ ...antibiogramForm, isolateCount: e.target.value })} /></Field>
        <Field label="Period start"><input type="date" value={antibiogramForm.periodStart} onChange={(e) => setAntibiogramForm({ ...antibiogramForm, periodStart: e.target.value })} /></Field>
        <Field label="Period end"><input type="date" value={antibiogramForm.periodEnd} onChange={(e) => setAntibiogramForm({ ...antibiogramForm, periodEnd: e.target.value })} /></Field>
        <Field label="Ciprofloxacin %"><input type="number" value={antibiogramForm.ciprofloxacin} onChange={(e) => setAntibiogramForm({ ...antibiogramForm, ciprofloxacin: e.target.value })} /></Field>
        <Field label="Ceftriaxone %"><input type="number" value={antibiogramForm.ceftriaxone} onChange={(e) => setAntibiogramForm({ ...antibiogramForm, ceftriaxone: e.target.value })} /></Field>
        <Field label="Meropenem %"><input type="number" value={antibiogramForm.meropenem} onChange={(e) => setAntibiogramForm({ ...antibiogramForm, meropenem: e.target.value })} /></Field>
        <Field label="Vancomycin %"><input type="number" value={antibiogramForm.vancomycin} onChange={(e) => setAntibiogramForm({ ...antibiogramForm, vancomycin: e.target.value })} /></Field>
        <Field label="Notes" wide><textarea value={antibiogramForm.notes} onChange={(e) => setAntibiogramForm({ ...antibiogramForm, notes: e.target.value })} /></Field>
      </div></InfectionModal> : null}

      {modal === "outbreak" ? <InfectionModal tone="blue" title="Outbreak Investigation" subtitle="Generates a line list from matching HAI records and opens response tracking." onSubmit={saveOutbreak} onClose={() => setModal("")} saving={saving === "outbreak"} saveText="Open Outbreak"><div className="infection-form-grid">
        <Field label="Organism"><input value={outbreakForm.organism} onChange={(e) => setOutbreakForm({ ...outbreakForm, organism: e.target.value })} /></Field>
        <Field label="Syndrome"><input value={outbreakForm.syndrome} onChange={(e) => setOutbreakForm({ ...outbreakForm, syndrome: e.target.value })} /></Field>
        <Field label="Ward"><input value={outbreakForm.wardId} onChange={(e) => setOutbreakForm({ ...outbreakForm, wardId: e.target.value })} /></Field>
        <Field label="Threshold"><input type="number" value={outbreakForm.threshold} onChange={(e) => setOutbreakForm({ ...outbreakForm, threshold: e.target.value })} /></Field>
      </div></InfectionModal> : null}

      {modal === "outbreak-action" ? <InfectionModal tone="success" title="Outbreak Response Action" subtitle="Tracks screening, enhanced cleaning, cohorting, visitor restrictions, and closure actions." onSubmit={saveOutbreakAction} onClose={() => setModal("")} saving={saving === "outbreak-action"} saveText="Save Response"><div className="infection-form-grid">
        <Field label="Outbreak"><select value={actionForm.outbreakId} onChange={(e) => setActionForm({ ...actionForm, outbreakId: e.target.value })}>{outbreaks.map((row) => <option key={row.outbreakId} value={row.outbreakId}>{row.organism} | {row.wardId} | {row.status}</option>)}</select></Field>
        <Field label="Action type"><select value={actionForm.actionType} onChange={(e) => setActionForm({ ...actionForm, actionType: e.target.value })}><option>Screening of contacts</option><option>Enhanced cleaning</option><option>Staff cohorting</option><option>Visitor restrictions</option><option>Education and feedback</option></select></Field>
        <Field label="Responsible person"><input value={actionForm.responsiblePerson} onChange={(e) => setActionForm({ ...actionForm, responsiblePerson: e.target.value })} /></Field>
        <Field label="Action date"><input type="date" value={actionForm.actionDate} onChange={(e) => setActionForm({ ...actionForm, actionDate: e.target.value })} /></Field>
        <Check label="Close outbreak" checked={actionForm.closeOutbreak} onChange={(checked) => setActionForm({ ...actionForm, closeOutbreak: checked })} />
        <Field label="Notes" wide><textarea value={actionForm.notes} onChange={(e) => setActionForm({ ...actionForm, notes: e.target.value })} /></Field>
      </div></InfectionModal> : null}
    </div>
  );
}

function Field({ label, wide, children }: { label: string; wide?: boolean; children: ReactNode }) {
  return <label className={wide ? "wide" : ""}><span>{label}</span>{children}</label>;
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return <label className="infection-check"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} /> {label}</label>;
}

function InfoCard({ title, rows }: { title: string; rows: Array<[string, ReactNode]> }) {
  return <div className="infection-info-card"><h3>{title}</h3>{rows.map(([label, value]) => <p key={label}><span>{label}</span><strong>{value}</strong></p>)}</div>;
}

function InfectionModal({ tone = "success", title, subtitle, onClose, onSubmit, saving, saveText, children }: { tone?: "success" | "info" | "blue" | "purple" | "warning" | "teal" | "danger"; title: string; subtitle: string; onClose: () => void; onSubmit: (event: FormEvent) => void; saving: boolean; saveText: string; children: ReactNode }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="module-modal-backdrop" onClick={onClose}>
      <form className={`module-modal infection-modal tone-${tone}${expanded ? " is-expanded" : ""}`} onSubmit={onSubmit} onClick={(event) => event.stopPropagation()}>
        <div className="module-modal-header">
          <div><h3><Biohazard size={18} /> {title}</h3><p>{subtitle}</p></div>
          <div className="infection-modal-header-tools"><button type="button" className="infection-modal-expand" aria-label={expanded ? `Restore ${title}` : `Expand ${title}`} title={expanded ? "Restore form size" : "Expand form"} onClick={() => setExpanded((current) => !current)}>{expanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}</button><button type="button" className="module-modal-close" aria-label={`Close ${title}`} onClick={onClose}><X size={18} /></button></div>
        </div>
        {children}
        <div className="module-modal-footer">
          <button type="button" className="nursing-secondary-btn" onClick={onClose}>Cancel</button>
          <button type="submit" className="nursing-action-btn" disabled={saving}><CheckCircle2 size={15} /> {saving ? "Saving..." : saveText}</button>
        </div>
      </form>
    </div>
  );
}

