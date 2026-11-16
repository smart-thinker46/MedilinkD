// Ported from Medilink-Frontend/src/app/clinical-research/page.tsx for desktop parity.
import type { FormEvent, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { Activity, AlertTriangle, BookOpenCheck, CalendarClock, CheckCircle2, ClipboardCheck, FileCheck2, FileText, FlaskConical, Plus, RefreshCw, Search, ShieldCheck, TimerReset, UserPlus, X } from "lucide-react";
import { api } from "../lib/api";
import { useLiveRefresh } from "../lib/liveRefresh";

const unwrapRows = (value: any) => {
  const data = value?.data ?? value;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  return [];
};
const todayValue = () => new Date().toISOString().slice(0, 10);
const addDays = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};
const formatDate = (value: any) => {
  const date = new Date(String(value || ""));
  if (!Number.isFinite(date.getTime())) return "Not recorded";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
};
const formatDateTime = (value: any) => {
  const date = new Date(String(value || ""));
  if (!Number.isFinite(date.getTime())) return "Not recorded";
  return date.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
};
const patientName = (row: any) => [row?.firstName, row?.lastName].filter(Boolean).join(" ") || row?.patientCode || row?.mrn || "Unnamed patient";
const toneFromNotice = (notice: string) => (/failed|blocked|expired|overdue|required|suspended|alert|cannot/i.test(notice) ? "warning" : "success");

type FieldSpec = { name: string; label: string; type: string; required?: boolean; min?: number; max?: number };

const defaultFields: FieldSpec[] = [
  { name: "weight", label: "Weight", type: "number", required: true, min: 2, max: 250 },
  { name: "systolicBp", label: "Systolic BP", type: "number", required: true, min: 70, max: 240 },
  { name: "visitNotes", label: "Visit notes", type: "text", required: false },
];

export default function ClinicalResearchView() {
  const [dashboard, setDashboard] = useState<any>({});
  const [protocols, setProtocols] = useState<any[]>([]);
  const [participants, setParticipants] = useState<any[]>([]);
  const [adverseEvents, setAdverseEvents] = useState<any[]>([]);
  const [crfTemplates, setCrfTemplates] = useState<any[]>([]);
  const [crfEntries, setCrfEntries] = useState<any[]>([]);
  const [deviations, setDeviations] = useState<any[]>([]);
  const [visits, setVisits] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedProtocolId, setSelectedProtocolId] = useState("");
  const [selectedParticipantId, setSelectedParticipantId] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [modal, setModal] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");

  const [protocolForm, setProtocolForm] = useState({
    title: "", description: "", principalInvestigator: "", coInvestigators: "", sponsor: "", studyType: "OBSERVATIONAL", targetEnrolment: "50",
    irbApprovalNumber: "", irbApprovalDate: todayValue(), irbExpiryDate: addDays(365), ethicsCertificateUrl: "", inclusionCriteria: "Age 18-65\nDiagnosis matches study population", exclusionCriteria: "Pregnant\nPrior conflicting study participation",
  });
  const [enrolForm, setEnrolForm] = useState({
    patientId: "", participantId: "", ageEligible: true, diagnosisEligible: true, labEligible: true, pregnant: false, prohibitedMedication: false, priorStudy: false,
    consentedBy: "", consentVersion: "v1.0", consentedAt: new Date().toISOString().slice(0, 16), patientReceivedCopy: true, signedConsentUrl: "",
  });
  const [aeForm, setAeForm] = useState({
    participantId: "", description: "", onsetDate: todayValue(), severity: "MODERATE", ctcaeGrade: "2", relatedness: "POSSIBLE", isSerious: false,
    seriousnessCriteria: "Hospitalisation", outcome: "ONGOING", actionTaken: "",
  });
  const [templateForm, setTemplateForm] = useState({ name: "Baseline CRF", timing: "ENROLMENT", fieldsJson: JSON.stringify(defaultFields, null, 2) });
  const [crfForm, setCrfForm] = useState({ participantId: "", crfTemplateId: "", visitName: "Enrolment", valuesJson: '{\n  "weight": 70,\n  "systolicBp": 120,\n  "visitNotes": "Stable"\n}', confirmedOutOfRange: false });
  const [deviationForm, setDeviationForm] = useState({ participantId: "", deviationDate: todayValue(), category: "PROTOCOL_PROCEDURE", severity: "MINOR", description: "", correctiveAction: "" });
  const [visitForm, setVisitForm] = useState({ participantId: "", visitName: "Study visit", scheduledAt: new Date().toISOString().slice(0, 16), procedures: "", billable: false });

  const setToast = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice((current) => (current === message ? "" : current)), 6500);
  };

  const selectedProtocol = protocols.find((row) => row.id === selectedProtocolId) || protocols[0] || null;
  const selectedParticipant = participants.find((row) => row.id === selectedParticipantId) || participants[0] || null;

  const safeGet = async (url: string, label: string) => {
    try {
      return await api.get(url);
    } catch (error: any) {
      return { data: [], __label: label, __error: error?.response?.data?.message || error?.message || "Request failed", __status: error?.response?.status };
    }
  };

  const load = async () => {
    setLoading(true);
    try {
      const [dashRes, protocolRes, patientRes] = await Promise.all([
        safeGet("/clinical-research/dashboard", "dashboard"),
        safeGet("/clinical-research/protocols", "protocols"),
        safeGet("/patients", "patients"),
      ]);
      const failed = [dashRes, protocolRes, patientRes].filter((response: any) => response.__error);
      if (failed.length) setToast(`${failed.map((response: any) => `${response.__label}${response.__status ? ` (${response.__status})` : ""}`).join(", ")} could not be loaded. Check your connection or permissions.`);
      const protocolRows = unwrapRows(protocolRes.data);
      const nextSelected = selectedProtocolId || protocolRows[0]?.id || "";
      setDashboard(dashRes.data || {});
      setProtocols(protocolRows);
      setPatients(unwrapRows(patientRes.data));
      setSelectedProtocolId(nextSelected);
      if (nextSelected) await loadProtocol(nextSelected);
    } catch (error: any) {
      setToast(error?.response?.data?.message || "Clinical research data could not be loaded.");
    } finally {
      setLoading(false);
    }
  };

  const loadProtocol = async (protocolId: string) => {
    if (!protocolId) return;
    const [partRes, aeRes, templateRes, crfRes, devRes, visitRes] = await Promise.all([
      safeGet(`/clinical-research/protocols/${protocolId}/participants`, "participants"),
      safeGet(`/clinical-research/adverse-events?protocolId=${encodeURIComponent(protocolId)}`, "adverse events"),
      safeGet(`/clinical-research/crf-templates?protocolId=${encodeURIComponent(protocolId)}`, "CRF templates"),
      safeGet(`/clinical-research/crf-entries?protocolId=${encodeURIComponent(protocolId)}`, "CRF entries"),
      safeGet(`/clinical-research/deviations?protocolId=${encodeURIComponent(protocolId)}`, "deviations"),
      safeGet(`/clinical-research/visits?protocolId=${encodeURIComponent(protocolId)}`, "study visits"),
    ]);
    const failed = [partRes, aeRes, templateRes, crfRes, devRes, visitRes].filter((response: any) => response.__error);
    if (failed.length) setToast(`${failed.map((response: any) => `${response.__label}${response.__status ? ` (${response.__status})` : ""}`).join(", ")} could not be loaded.`);
    const participantRows = unwrapRows(partRes.data);
    const templateRows = unwrapRows(templateRes.data);
    setParticipants(participantRows);
    setAdverseEvents(unwrapRows(aeRes.data));
    setCrfTemplates(templateRows);
    setCrfEntries(unwrapRows(crfRes.data));
    setDeviations(unwrapRows(devRes.data));
    setVisits(unwrapRows(visitRes.data));
    const nextParticipantId = participantRows[0]?.id || "";
    const nextTemplateId = templateRows[0]?.crfTemplateId || "";
    setSelectedParticipantId(nextParticipantId);
    setAeForm((current) => ({ ...current, participantId: nextParticipantId }));
    setCrfForm((current) => ({ ...current, participantId: nextParticipantId, crfTemplateId: nextTemplateId }));
    setVisitForm((current) => ({ ...current, participantId: nextParticipantId }));
  };

  useEffect(() => {
    void load();
  }, []);
  useLiveRefresh(load, { intervalMs: 60000 });

  useEffect(() => {
    if (selectedProtocolId) void loadProtocol(selectedProtocolId);
  }, [selectedProtocolId]);

  const patientLabel = (patientId: string) => {
    const direct = participants.find((row) => row.patientId === patientId)?.patient;
    const patient = direct || patients.find((row) => row.id === patientId);
    return patient ? `${patientName(patient)} | ${patient.patientCode || patient.mrn || "No MRN"}` : patientId || "-";
  };

  const filteredProtocols = useMemo(() => {
    const q = search.trim().toLowerCase();
    return protocols.filter((row) => {
      if (statusFilter !== "ALL" && row.status !== statusFilter) return false;
      if (!q) return true;
      return `${row.title} ${row.protocolNumber} ${row.principalInvestigator} ${row.sponsor} ${row.studyType} ${row.status}`.toLowerCase().includes(q);
    });
  }, [protocols, search, statusFilter]);

  const totals = dashboard?.totals || {};
  const statCards = [
    { label: "Active Protocols", value: totals.activeProtocols || 0, color: "#2563eb", icon: BookOpenCheck, action: () => setStatusFilter("ACTIVE") },
    { label: "Participants", value: `${totals.enrolled || 0}/${totals.targetEnrolment || 0}`, color: "#16a34a", icon: UserPlus, action: () => openEnroll() },
    { label: "Ethics Alerts", value: totals.expiringEthics || 0, color: "#d97706", icon: ShieldCheck, action: () => setStatusFilter("ALL") },
    { label: "Suspended", value: totals.suspended || 0, color: "#dc2626", icon: AlertTriangle, action: () => setStatusFilter("SUSPENDED") },
    { label: "Pending SAE", value: totals.pendingAeReports || 0, color: "#7c3aed", icon: TimerReset, action: () => openAe() },
    { label: "Data Complete", value: `${totals.dataCompleteness || 0}%`, color: "#0891b2", icon: ClipboardCheck, action: () => openCrf() },
  ];

  const closeAfter = async (message: string) => {
    setToast(message);
    setModal("");
    await load();
  };

  const requireProtocol = () => {
    if (!selectedProtocol?.id) {
      setToast("Create or select a protocol first.");
      return false;
    }
    return true;
  };

  const openEnroll = () => {
    if (!requireProtocol()) return;
    setEnrolForm((current) => ({ ...current, patientId: current.patientId || patients[0]?.id || "" }));
    setModal("enroll");
  };

  const openAe = () => {
    if (!requireProtocol()) return;
    if (!participants.length) {
      setToast("Enrol a participant before recording an adverse event.");
      return;
    }
    setAeForm((current) => ({ ...current, participantId: selectedParticipantId || participants[0]?.id || "" }));
    setModal("ae");
  };

  const openCrf = () => {
    if (!requireProtocol()) return;
    if (!participants.length || !crfTemplates.length) {
      setToast("Create a CRF template and enrol a participant before submitting CRF data.");
      return;
    }
    setCrfForm((current) => ({ ...current, participantId: selectedParticipantId || participants[0]?.id || "", crfTemplateId: crfTemplates[0]?.crfTemplateId || "" }));
    setModal("crf");
  };

  const openDeviation = () => {
    if (!requireProtocol()) return;
    setDeviationForm((current) => ({ ...current, participantId: selectedParticipantId || participants[0]?.id || "" }));
    setModal("deviation");
  };

  const openVisit = () => {
    if (!requireProtocol()) return;
    if (!participants.length) {
      setToast("Enrol a participant before recording a study visit.");
      return;
    }
    setVisitForm((current) => ({ ...current, participantId: selectedParticipantId || participants[0]?.id || "" }));
    setModal("visit");
  };

  const lockStudy = () => {
    if (!requireProtocol()) return;
    const reason = window.prompt("Reason for locking this study dataset:", "Database lock completed") || "Database lock completed";
    setSaving("lock");
    api.post(`/clinical-research/protocols/${selectedProtocol.id}/data-lock`, { locked: true, reason })
      .then(() => setToast("Study data locked. Further CRF edits require an approved unlock."))
      .catch((error) => setToast(error?.response?.data?.message || "Study data could not be locked."))
      .finally(() => setSaving(""));
  };

  const saveProtocol = (event: FormEvent) => {
    event.preventDefault();
    setSaving("protocol");
    api.post("/clinical-research/protocols", {
      ...protocolForm,
      coInvestigators: protocolForm.coInvestigators.split(/[,\n;]+/).map((item) => item.trim()).filter(Boolean),
      inclusionCriteria: protocolForm.inclusionCriteria.split(/\n+/).map((item) => item.trim()).filter(Boolean),
      exclusionCriteria: protocolForm.exclusionCriteria.split(/\n+/).map((item) => item.trim()).filter(Boolean),
    }).then((res) => {
      setSelectedProtocolId(res.data?.id || selectedProtocolId);
      return closeAfter("Protocol registered with ethics tracking and renewal alerts.");
    }).catch((error) => setToast(error?.response?.data?.message || "Protocol could not be saved."))
      .finally(() => setSaving(""));
  };

  const saveEnrollment = (event: FormEvent) => {
    event.preventDefault();
    if (!selectedProtocol?.id) return;
    setSaving("enroll");
    api.post(`/clinical-research/protocols/${selectedProtocol.id}/screen-enrol`, {
      ...enrolForm,
      inclusionCriteria: { ageEligible: enrolForm.ageEligible, diagnosisEligible: enrolForm.diagnosisEligible, labEligible: enrolForm.labEligible },
      exclusionCriteria: { pregnant: enrolForm.pregnant, prohibitedMedication: enrolForm.prohibitedMedication, priorStudy: enrolForm.priorStudy },
    }).then((res) => closeAfter(res.data?.status === "screen_failed" ? "Screening saved as screen failure." : "Participant enrolled with informed consent record."))
      .catch((error) => setToast(error?.response?.data?.message || "Participant could not be enrolled."))
      .finally(() => setSaving(""));
  };

  const saveAe = (event: FormEvent) => {
    event.preventDefault();
    if (!selectedProtocol?.id) return;
    setSaving("ae");
    api.post("/clinical-research/adverse-events", { ...aeForm, protocolId: selectedProtocol.id, seriousnessCriteria: aeForm.seriousnessCriteria.split(/[,\n;]+/).map((item) => item.trim()).filter(Boolean) })
      .then((res) => closeAfter(res.data?.isSerious ? "SAE saved. Sponsor 24-hour and IRB 7-day timers are active." : "Adverse event saved."))
      .catch((error) => setToast(error?.response?.data?.message || "Adverse event could not be saved."))
      .finally(() => setSaving(""));
  };

  const confirmAe = (id: string, channel: string) => {
    setSaving(`${id}-${channel}`);
    api.patch(`/clinical-research/adverse-events/${id}/report`, { channel })
      .then(() => closeAfter(`${channel === "IRB" ? "Ethics committee" : "Sponsor"} report marked submitted.`))
      .catch((error) => setToast(error?.response?.data?.message || "Report confirmation could not be saved."))
      .finally(() => setSaving(""));
  };

  const saveTemplate = (event: FormEvent) => {
    event.preventDefault();
    if (!selectedProtocol?.id) return;
    setSaving("template");
    try {
      const fields = JSON.parse(templateForm.fieldsJson);
      api.post("/clinical-research/crf-templates", { protocolId: selectedProtocol.id, name: templateForm.name, timing: templateForm.timing, fields })
        .then(() => closeAfter("CRF template created with validation rules."))
        .catch((error) => setToast(error?.response?.data?.message || "CRF template could not be saved."))
        .finally(() => setSaving(""));
    } catch {
      setToast("CRF fields must be valid JSON.");
      setSaving("");
    }
  };

  const saveCrf = (event: FormEvent) => {
    event.preventDefault();
    if (!selectedProtocol?.id) return;
    setSaving("crf");
    try {
      const values = JSON.parse(crfForm.valuesJson);
      api.post("/clinical-research/crf-entries", { ...crfForm, protocolId: selectedProtocol.id, values })
        .then((res) => closeAfter(res.data?.validationQueries?.length ? "CRF saved with data queries requiring review." : "CRF data saved and marked complete."))
        .catch((error) => setToast(error?.response?.data?.message || "CRF data could not be saved."))
        .finally(() => setSaving(""));
    } catch {
      setToast("CRF values must be valid JSON.");
      setSaving("");
    }
  };

  const saveDeviation = (event: FormEvent) => {
    event.preventDefault();
    if (!selectedProtocol?.id) return;
    setSaving("deviation");
    api.post("/clinical-research/deviations", { ...deviationForm, protocolId: selectedProtocol.id })
      .then(() => closeAfter("Protocol deviation documented and added to monitoring dashboard."))
      .catch((error) => setToast(error?.response?.data?.message || "Protocol deviation could not be saved."))
      .finally(() => setSaving(""));
  };

  const saveVisit = (event: FormEvent) => {
    event.preventDefault();
    if (!selectedProtocol?.id) return;
    setSaving("visit");
    api.post("/clinical-research/visits", { ...visitForm, protocolId: selectedProtocol.id, procedures: visitForm.procedures.split(/[\n,;]+/).map((item) => item.trim()).filter(Boolean) })
      .then(() => closeAfter("Study visit recorded with participant and operational trace."))
      .catch((error) => setToast(error?.response?.data?.message || "Study visit could not be saved."))
      .finally(() => setSaving(""));
  };

  return (
    <div className="nursing-view research-view">
      <div className="pv-header">
        <div>
          <h1>Clinical Research</h1>
          <p>Protocol ethics oversight, screening, consent, adverse events, CRFs, and study progress monitoring.</p>
        </div>
        <div className="pv-header-actions">
          <button type="button" className="nursing-action-btn is-muted" onClick={load}><RefreshCw size={15} /> Refresh</button>
          <button type="button" className="nursing-action-btn is-primary" onClick={() => setModal("protocol")}><Plus size={15} /> New Protocol</button>
          <button type="button" className="nursing-action-btn is-success" onClick={openEnroll}><UserPlus size={15} /> Screen & Enrol</button>
          <button type="button" className="nursing-action-btn is-danger" onClick={openAe}><AlertTriangle size={15} /> Report AE</button>
        </div>
      </div>

      {notice ? (
        <div className={`module-notice-toast is-${toneFromNotice(notice)}`} role="status" aria-live="polite">
          <div><strong>Clinical Research</strong><span>{notice}</span></div>
          <button type="button" className="module-notice-close" onClick={() => setNotice("")}>x</button>
        </div>
      ) : null}

      <div className="pv-stats nursing-stats-grid">
        {statCards.map(({ label, value, color, icon: Icon, action }) => (
          <button key={label} type="button" className="pv-stat-card research-stat-card" style={{ borderLeftColor: color }} onClick={action}>
            <p className="pv-stat-label">{label}</p>
            <p className="pv-stat-value">{loading ? "..." : value}</p>
            <Icon className="research-stat-icon" size={19} style={{ color }} />
          </button>
        ))}
      </div>

      <div className="research-layout">
        <section className="nursing-worklist">
          <div className="pv-search-bar research-filter-bar">
            <div className="pv-search-wrap">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input className="pv-search" placeholder="Search protocol, PI, sponsor, status..." value={search} onChange={(event) => setSearch(event.target.value)} />
            </div>
            <select className="nursing-filter-select" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="ALL">All status</option>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="COMPLETED">Completed</option>
              <option value="DRAFT">Draft</option>
            </select>
          </div>
          <div className="pv-table-wrap">
            <table className="pv-table">
              <thead><tr><th>Protocol</th><th>PI</th><th>Ethics Expiry</th><th>Enrolled</th><th>Status</th></tr></thead>
              <tbody>
                {loading ? <tr><td colSpan={5} className="pv-empty">Loading protocols...</td></tr> : filteredProtocols.length === 0 ? <tr><td colSpan={5} className="pv-empty">No research protocols found.</td></tr> : filteredProtocols.map((row) => (
                  <tr key={row.id} className={row.id === selectedProtocol?.id ? "nursing-selected-row" : ""} onClick={() => setSelectedProtocolId(row.id)}>
                    <td><strong>{row.title}</strong><small>{row.protocolNumber}</small></td>
                    <td>{row.principalInvestigator || row.piId}</td>
                    <td>{formatDate(row.irbExpiryDate)}{row.renewalAlert ? <span className="pv-badge is-warning">Renewal</span> : null}</td>
                    <td>{row.enrolledCount}/{row.targetEnrolment}</td>
                    <td><span className={`pv-badge ${row.status === "ACTIVE" ? "is-success" : row.status === "SUSPENDED" ? "is-danger" : "is-info"}`}>{row.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="nursing-care-panel">
          <div className="nursing-care-header">
            <div>
              <span>Selected Protocol</span>
              <strong>{selectedProtocol?.title || "No protocol selected"}</strong>
            </div>
            <span className={`pv-badge ${selectedProtocol?.status === "ACTIVE" ? "is-success" : selectedProtocol?.status === "SUSPENDED" ? "is-danger" : "is-info"}`}>{selectedProtocol?.status || "NONE"}</span>
          </div>
          <div className="research-action-row">
            <button type="button" className="research-action-btn is-success" onClick={openEnroll}><UserPlus size={14} /> Screen & Enrol</button>
            <button type="button" className="research-action-btn is-danger" onClick={openAe}><AlertTriangle size={14} /> AE/SAE</button>
            <button type="button" className="research-action-btn is-blue" onClick={() => requireProtocol() && setModal("template")}><FileText size={14} /> CRF Template</button>
            <button type="button" className="research-action-btn is-purple" onClick={openCrf}><ClipboardCheck size={14} /> Submit CRF</button>
            <button type="button" className="research-action-btn is-warning" onClick={openDeviation}><Activity size={14} /> Deviation</button>
            <button type="button" className="research-action-btn is-blue" onClick={openVisit}><CalendarClock size={14} /> Study Visit</button>
            <button type="button" className="research-action-btn is-purple" onClick={lockStudy} disabled={saving === "lock"}><ShieldCheck size={14} /> Lock Data</button>
          </div>

          <div className="research-protocol-card">
            <div>
              <span>Study Type</span>
              <strong>{selectedProtocol?.studyType || "-"}</strong>
            </div>
            <div>
              <span>Sponsor</span>
              <strong>{selectedProtocol?.sponsor || "-"}</strong>
            </div>
            <div>
              <span>Approval</span>
              <strong>{selectedProtocol?.irbApprovalNumber || "-"}</strong>
            </div>
            <div>
              <span>Renewal Window</span>
              <strong>{selectedProtocol?.daysToExpiry ?? "-"} days</strong>
            </div>
          </div>

          <div className="dental-detail-grid">
            <ResearchInfo title="Participants" rows={[["Enrolled", participants.filter((row) => !row.screenFail).length], ["Screen failures", participants.filter((row) => row.screenFail).length], ["Target", selectedProtocol?.targetEnrolment || 0]]} />
            <ResearchInfo title="Safety" rows={[["AE/SAE", adverseEvents.length], ["Pending reports", adverseEvents.filter((row) => row.isSerious && (!row.reportedToSponsorAt || !row.reportedToIrbAt)).length], ["Overdue", adverseEvents.filter((row) => row.sponsorOverdue || row.irbOverdue).length]]} />
            <ResearchInfo title="Data Quality" rows={[["CRF entries", crfEntries.length], ["Complete", crfEntries.filter((row) => row.complete).length], ["Queries", crfEntries.reduce((sum, row) => sum + (row.validationQueries?.length || 0), 0)]]} />
            <ResearchInfo title="Progress" rows={[["Deviations", deviations.length], ["Dropouts", participants.filter((row) => row.status === "WITHDRAWN").length], ["Projected", selectedProtocol?.enrolledCount ? "On watch" : "Awaiting enrolment"]]} />
          </div>

          <div className="research-subgrid">
            <DataPanel title="Participants">
              <table className="pv-table">
                <thead><tr><th>Participant</th><th>Patient</th><th>Consent</th><th>Status</th></tr></thead>
                <tbody>
                  {participants.length === 0 ? <tr><td colSpan={4} className="pv-empty">No participants enrolled.</td></tr> : participants.map((row) => (
                    <tr key={row.id} className={row.id === selectedParticipantId ? "nursing-selected-row" : ""} onClick={() => setSelectedParticipantId(row.id)}>
                      <td>{row.participantId}</td><td>{patientLabel(row.patientId)}</td><td>{row.consent?.consentVersion || row.consentRecordId}</td><td><span className={`pv-badge ${row.screenFail ? "is-warning" : "is-success"}`}>{row.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </DataPanel>
            <DataPanel title="SAE Timers">
              <table className="pv-table">
                <thead><tr><th>AE</th><th>Severity</th><th>Report Clock</th><th>Action</th></tr></thead>
                <tbody>
                  {adverseEvents.length === 0 ? <tr><td colSpan={4} className="pv-empty">No adverse events recorded.</td></tr> : adverseEvents.map((row) => (
                    <tr key={row.id}>
                      <td><strong>{row.aeNumber}</strong><small>{row.description}</small></td>
                      <td><span className={`pv-badge ${row.isSerious ? "is-danger" : "is-warning"}`}>{row.isSerious ? "SAE" : row.severity}</span></td>
                      <td>{row.isSerious ? `${row.sponsorHoursRemaining}h sponsor | ${row.irbHoursRemaining}h IRB` : "Routine AE"}</td>
                      <td className="research-table-actions">
                        {row.isSerious && !row.reportedToSponsorAt ? <button type="button" className="pv-link-btn" disabled={saving === `${row.id}-SPONSOR`} onClick={() => confirmAe(row.id, "SPONSOR")}>Sponsor</button> : null}
                        {row.isSerious && !row.reportedToIrbAt ? <button type="button" className="pv-link-btn" disabled={saving === `${row.id}-IRB`} onClick={() => confirmAe(row.id, "IRB")}>IRB</button> : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </DataPanel>
          </div>

          <div className="research-subgrid">
            <DataPanel title="Study Visits">
              <table className="pv-table">
                <thead><tr><th>Visit</th><th>Participant</th><th>Date</th><th>Status</th></tr></thead>
                <tbody>{visits.length === 0 ? <tr><td colSpan={4} className="pv-empty">No study visits recorded.</td></tr> : visits.map((row) => <tr key={row.visitId || row.id}><td>{row.visitName}</td><td>{participants.find((p) => p.id === row.participantId)?.participantId || row.participantId}</td><td>{formatDateTime(row.completedAt || row.scheduledAt)}</td><td><span className={`pv-badge ${row.status === "COMPLETED" ? "is-success" : "is-info"}`}>{row.status}</span></td></tr>)}</tbody>
              </table>
            </DataPanel>
            <DataPanel title="CRF Data Quality">
              <table className="pv-table">
                <thead><tr><th>Visit</th><th>Participant</th><th>Status</th><th>Queries</th></tr></thead>
                <tbody>
                  {crfEntries.length === 0 ? <tr><td colSpan={4} className="pv-empty">No CRFs submitted.</td></tr> : crfEntries.map((row) => (
                    <tr key={row.crfEntryId || row.id}><td>{row.visitName}</td><td>{participants.find((p) => p.id === row.participantId)?.participantId || row.participantId}</td><td><span className={`pv-badge ${row.complete ? "is-success" : "is-warning"}`}>{row.complete ? "COMPLETE" : "QUERY"}</span></td><td>{row.validationQueries?.join(", ") || "-"}</td></tr>
                  ))}
                </tbody>
              </table>
            </DataPanel>
            <DataPanel title="Protocol Deviations">
              <table className="pv-table">
                <thead><tr><th>Date</th><th>Category</th><th>Severity</th><th>Action</th></tr></thead>
                <tbody>
                  {deviations.length === 0 ? <tr><td colSpan={4} className="pv-empty">No protocol deviations documented.</td></tr> : deviations.map((row) => (
                    <tr key={row.deviationId || row.id}><td>{formatDate(row.deviationDate)}</td><td>{row.category}</td><td><span className={`pv-badge ${row.severity === "MAJOR" ? "is-danger" : "is-warning"}`}>{row.severity}</span></td><td>{row.correctiveAction || "-"}</td></tr>
                  ))}
                </tbody>
              </table>
            </DataPanel>
          </div>
        </section>
      </div>

      {modal === "protocol" ? (
        <ResearchModal title="Register Protocol" icon={<BookOpenCheck size={18} />} tone="blue" className="research-protocol-modal" onClose={() => setModal("")}>
          <form className="research-form" onSubmit={saveProtocol}>
            <div className="research-form-intro">
              <strong>Protocol and ethics registration</strong>
              <span>Capture the study identity, sponsor, investigator, approval window, and eligibility criteria.</span>
            </div>
            <div className="research-form-grid">
              <Field label="Study title"><input value={protocolForm.title} onChange={(e) => setProtocolForm({ ...protocolForm, title: e.target.value })} required /></Field>
              <Field label="Principal investigator"><input value={protocolForm.principalInvestigator} onChange={(e) => setProtocolForm({ ...protocolForm, principalInvestigator: e.target.value })} required /></Field>
              <Field label="Sponsor"><input value={protocolForm.sponsor} onChange={(e) => setProtocolForm({ ...protocolForm, sponsor: e.target.value })} required /></Field>
              <Field label="Study type"><select value={protocolForm.studyType} onChange={(e) => setProtocolForm({ ...protocolForm, studyType: e.target.value })}><option value="INTERVENTIONAL">Interventional</option><option value="OBSERVATIONAL">Observational</option><option value="DIAGNOSTIC">Diagnostic</option></select></Field>
              <Field label="Target enrolment"><input type="number" min="1" value={protocolForm.targetEnrolment} onChange={(e) => setProtocolForm({ ...protocolForm, targetEnrolment: e.target.value })} /></Field>
              <Field label="Ethics approval number"><input value={protocolForm.irbApprovalNumber} onChange={(e) => setProtocolForm({ ...protocolForm, irbApprovalNumber: e.target.value })} required /></Field>
              <Field label="Approval date"><input type="date" value={protocolForm.irbApprovalDate} onChange={(e) => setProtocolForm({ ...protocolForm, irbApprovalDate: e.target.value })} /></Field>
              <Field label="Expiry date"><input type="date" value={protocolForm.irbExpiryDate} onChange={(e) => setProtocolForm({ ...protocolForm, irbExpiryDate: e.target.value })} /></Field>
              <Field label="Co-investigators"><input value={protocolForm.coInvestigators} onChange={(e) => setProtocolForm({ ...protocolForm, coInvestigators: e.target.value })} placeholder="Separate names with commas" /></Field>
              <Field label="IRB certificate URL"><input value={protocolForm.ethicsCertificateUrl} onChange={(e) => setProtocolForm({ ...protocolForm, ethicsCertificateUrl: e.target.value })} /></Field>
            </div>
            <Field label="Brief description"><textarea value={protocolForm.description} onChange={(e) => setProtocolForm({ ...protocolForm, description: e.target.value })} /></Field>
            <div className="research-form-grid">
              <Field label="Inclusion criteria"><textarea value={protocolForm.inclusionCriteria} onChange={(e) => setProtocolForm({ ...protocolForm, inclusionCriteria: e.target.value })} /></Field>
              <Field label="Exclusion criteria"><textarea value={protocolForm.exclusionCriteria} onChange={(e) => setProtocolForm({ ...protocolForm, exclusionCriteria: e.target.value })} /></Field>
            </div>
            <button type="submit" className="research-submit is-blue" disabled={saving === "protocol"}><FileCheck2 size={15} /> Save Protocol</button>
          </form>
        </ResearchModal>
      ) : null}

      {modal === "enroll" ? (
        <ResearchModal title="Screen and Enrol Participant" icon={<UserPlus size={18} />} tone="green" onClose={() => setModal("")}>
          <form className="research-form" onSubmit={saveEnrollment}>
            <div className="research-form-grid">
              <Field label="Patient"><select value={enrolForm.patientId} onChange={(e) => setEnrolForm({ ...enrolForm, patientId: e.target.value })} required><option value="">Select patient</option>{patients.map((patient) => <option key={patient.id} value={patient.id}>{patientName(patient)} | {patient.patientCode || patient.mrn}</option>)}</select></Field>
              <Field label="Participant ID"><input value={enrolForm.participantId} onChange={(e) => setEnrolForm({ ...enrolForm, participantId: e.target.value })} placeholder="Auto-generated if blank" /></Field>
              <Field label="Consented by"><input value={enrolForm.consentedBy} onChange={(e) => setEnrolForm({ ...enrolForm, consentedBy: e.target.value })} required /></Field>
              <Field label="Consent version"><input value={enrolForm.consentVersion} onChange={(e) => setEnrolForm({ ...enrolForm, consentVersion: e.target.value })} /></Field>
              <Field label="Consent date/time"><input type="datetime-local" value={enrolForm.consentedAt} onChange={(e) => setEnrolForm({ ...enrolForm, consentedAt: e.target.value })} /></Field>
              <Field label="Signed consent URL"><input value={enrolForm.signedConsentUrl} onChange={(e) => setEnrolForm({ ...enrolForm, signedConsentUrl: e.target.value })} /></Field>
            </div>
            <div className="research-check-grid">
              <Check label="Age within criteria" checked={enrolForm.ageEligible} onChange={(value) => setEnrolForm({ ...enrolForm, ageEligible: value })} />
              <Check label="Diagnosis matches protocol" checked={enrolForm.diagnosisEligible} onChange={(value) => setEnrolForm({ ...enrolForm, diagnosisEligible: value })} />
              <Check label="Lab criteria met" checked={enrolForm.labEligible} onChange={(value) => setEnrolForm({ ...enrolForm, labEligible: value })} />
              <Check label="Pregnant exclusion" checked={enrolForm.pregnant} onChange={(value) => setEnrolForm({ ...enrolForm, pregnant: value })} />
              <Check label="Prohibited medication" checked={enrolForm.prohibitedMedication} onChange={(value) => setEnrolForm({ ...enrolForm, prohibitedMedication: value })} />
              <Check label="Prior study participation" checked={enrolForm.priorStudy} onChange={(value) => setEnrolForm({ ...enrolForm, priorStudy: value })} />
              <Check label="Patient received consent copy" checked={enrolForm.patientReceivedCopy} onChange={(value) => setEnrolForm({ ...enrolForm, patientReceivedCopy: value })} />
            </div>
            <button type="submit" className="research-submit is-green" disabled={saving === "enroll"}><UserPlus size={15} /> Complete Screening</button>
          </form>
        </ResearchModal>
      ) : null}

      {modal === "ae" ? (
        <ResearchModal title="Adverse Event Report" icon={<AlertTriangle size={18} />} tone="red" onClose={() => setModal("")}>
          <form className="research-form" onSubmit={saveAe}>
            <div className="research-form-grid">
              <Field label="Participant"><select value={aeForm.participantId} onChange={(e) => setAeForm({ ...aeForm, participantId: e.target.value })} required>{participants.map((row) => <option key={row.id} value={row.id}>{row.participantId} | {patientLabel(row.patientId)}</option>)}</select></Field>
              <Field label="Onset date"><input type="date" value={aeForm.onsetDate} onChange={(e) => setAeForm({ ...aeForm, onsetDate: e.target.value })} /></Field>
              <Field label="Severity"><select value={aeForm.severity} onChange={(e) => setAeForm({ ...aeForm, severity: e.target.value })}><option>MILD</option><option>MODERATE</option><option>SEVERE</option><option>LIFE_THREATENING</option><option>DEATH</option></select></Field>
              <Field label="CTCAE grade"><input type="number" min="1" max="5" value={aeForm.ctcaeGrade} onChange={(e) => setAeForm({ ...aeForm, ctcaeGrade: e.target.value })} /></Field>
              <Field label="Relatedness"><select value={aeForm.relatedness} onChange={(e) => setAeForm({ ...aeForm, relatedness: e.target.value })}><option>UNRELATED</option><option>UNLIKELY</option><option>POSSIBLE</option><option>PROBABLE</option><option>DEFINITE</option></select></Field>
              <Field label="SAE criteria"><input value={aeForm.seriousnessCriteria} onChange={(e) => setAeForm({ ...aeForm, seriousnessCriteria: e.target.value })} /></Field>
            </div>
            <Check label="This is a Serious Adverse Event requiring sponsor 24-hour and ethics 7-day reporting" checked={aeForm.isSerious} onChange={(value) => setAeForm({ ...aeForm, isSerious: value })} />
            <Field label="Description"><textarea value={aeForm.description} onChange={(e) => setAeForm({ ...aeForm, description: e.target.value })} required /></Field>
            <Field label="Action taken"><textarea value={aeForm.actionTaken} onChange={(e) => setAeForm({ ...aeForm, actionTaken: e.target.value })} /></Field>
            <button type="submit" className="research-submit is-red" disabled={saving === "ae"}><AlertTriangle size={15} /> Save AE/SAE</button>
          </form>
        </ResearchModal>
      ) : null}

      {modal === "template" ? (
        <ResearchModal title="Create CRF Template" icon={<FileText size={18} />} tone="blue" onClose={() => setModal("")}>
          <form className="research-form" onSubmit={saveTemplate}>
            <div className="research-form-grid">
              <Field label="CRF name"><input value={templateForm.name} onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })} required /></Field>
              <Field label="Timing"><select value={templateForm.timing} onChange={(e) => setTemplateForm({ ...templateForm, timing: e.target.value })}><option>ENROLMENT</option><option>VISIT_2</option><option>THREE_MONTH_FOLLOW_UP</option><option>EXIT</option></select></Field>
            </div>
            <Field label="Fields JSON"><textarea className="research-code-area" value={templateForm.fieldsJson} onChange={(e) => setTemplateForm({ ...templateForm, fieldsJson: e.target.value })} /></Field>
            <button type="submit" className="research-submit is-blue" disabled={saving === "template"}><FileText size={15} /> Save CRF Template</button>
          </form>
        </ResearchModal>
      ) : null}

      {modal === "crf" ? (
        <ResearchModal title="Submit Case Report Form" icon={<ClipboardCheck size={18} />} tone="purple" onClose={() => setModal("")}>
          <form className="research-form" onSubmit={saveCrf}>
            <div className="research-form-grid">
              <Field label="Participant"><select value={crfForm.participantId} onChange={(e) => setCrfForm({ ...crfForm, participantId: e.target.value })} required>{participants.map((row) => <option key={row.id} value={row.id}>{row.participantId} | {patientLabel(row.patientId)}</option>)}</select></Field>
              <Field label="CRF template"><select value={crfForm.crfTemplateId} onChange={(e) => setCrfForm({ ...crfForm, crfTemplateId: e.target.value })} required>{crfTemplates.map((row) => <option key={row.crfTemplateId} value={row.crfTemplateId}>{row.name} | {row.timing}</option>)}</select></Field>
              <Field label="Visit name"><input value={crfForm.visitName} onChange={(e) => setCrfForm({ ...crfForm, visitName: e.target.value })} /></Field>
            </div>
            <Field label="CRF values JSON"><textarea className="research-code-area" value={crfForm.valuesJson} onChange={(e) => setCrfForm({ ...crfForm, valuesJson: e.target.value })} /></Field>
            <Check label="Coordinator has confirmed any out-of-range value is correct" checked={crfForm.confirmedOutOfRange} onChange={(value) => setCrfForm({ ...crfForm, confirmedOutOfRange: value })} />
            <button type="submit" className="research-submit is-purple" disabled={saving === "crf"}><ClipboardCheck size={15} /> Submit CRF</button>
          </form>
        </ResearchModal>
      ) : null}

      {modal === "deviation" ? (
        <ResearchModal title="Protocol Deviation" icon={<Activity size={18} />} tone="orange" onClose={() => setModal("")}>
          <form className="research-form" onSubmit={saveDeviation}>
            <div className="research-form-grid">
              <Field label="Participant"><select value={deviationForm.participantId} onChange={(e) => setDeviationForm({ ...deviationForm, participantId: e.target.value })}><option value="">Protocol-level deviation</option>{participants.map((row) => <option key={row.id} value={row.id}>{row.participantId} | {patientLabel(row.patientId)}</option>)}</select></Field>
              <Field label="Deviation date"><input type="date" value={deviationForm.deviationDate} onChange={(e) => setDeviationForm({ ...deviationForm, deviationDate: e.target.value })} /></Field>
              <Field label="Category"><select value={deviationForm.category} onChange={(e) => setDeviationForm({ ...deviationForm, category: e.target.value })}><option>PROTOCOL_PROCEDURE</option><option>VISIT_WINDOW</option><option>CONSENT</option><option>SAFETY_REPORTING</option></select></Field>
              <Field label="Severity"><select value={deviationForm.severity} onChange={(e) => setDeviationForm({ ...deviationForm, severity: e.target.value })}><option>MINOR</option><option>MAJOR</option><option>CRITICAL</option></select></Field>
            </div>
            <Field label="Description"><textarea value={deviationForm.description} onChange={(e) => setDeviationForm({ ...deviationForm, description: e.target.value })} required /></Field>
            <Field label="Corrective action"><textarea value={deviationForm.correctiveAction} onChange={(e) => setDeviationForm({ ...deviationForm, correctiveAction: e.target.value })} /></Field>
            <button type="submit" className="research-submit is-orange" disabled={saving === "deviation"}><Activity size={15} /> Save Deviation</button>
          </form>
        </ResearchModal>
      ) : null}

      {modal === "visit" ? (
        <ResearchModal title="Record Study Visit" icon={<CalendarClock size={18} />} tone="blue" onClose={() => setModal("")}>
          <form className="research-form" onSubmit={saveVisit}>
            <div className="research-form-grid">
              <Field label="Participant"><select value={visitForm.participantId} onChange={(e) => setVisitForm({ ...visitForm, participantId: e.target.value })} required>{participants.map((row) => <option key={row.id} value={row.id}>{row.participantId} | {patientLabel(row.patientId)}</option>)}</select></Field>
              <Field label="Visit name"><input value={visitForm.visitName} onChange={(e) => setVisitForm({ ...visitForm, visitName: e.target.value })} required /></Field>
              <Field label="Scheduled/completed at"><input type="datetime-local" value={visitForm.scheduledAt} onChange={(e) => setVisitForm({ ...visitForm, scheduledAt: e.target.value })} required /></Field>
            </div>
            <Field label="Procedures"><textarea value={visitForm.procedures} onChange={(e) => setVisitForm({ ...visitForm, procedures: e.target.value })} placeholder="One procedure per line" /></Field>
            <Check label="Mark research procedure for finance review" checked={visitForm.billable} onChange={(value) => setVisitForm({ ...visitForm, billable: value })} />
            <button type="submit" className="research-submit is-blue" disabled={saving === "visit"}><CalendarClock size={15} /> Save Study Visit</button>
          </form>
        </ResearchModal>
      ) : null}
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="research-field"><span>{label}</span>{children}</label>;
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <label className="research-check"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} /><span>{label}</span></label>;
}

function ResearchInfo({ title, rows }: { title: string; rows: [string, ReactNode][] }) {
  return (
    <div className="dental-info-card research-info-card">
      <h3>{title}</h3>
      {rows.map(([label, value]) => (
        <div key={label}><span>{label}</span><strong>{value}</strong></div>
      ))}
    </div>
  );
}

function DataPanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="research-data-panel">
      <h3>{title}</h3>
      <div className="pv-table-wrap">{children}</div>
    </section>
  );
}

function ResearchModal({ title, icon, tone, className = "", onClose, children }: { title: string; icon: ReactNode; tone: string; className?: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="module-modal-backdrop research-modal-backdrop">
      <div className={`module-modal research-modal is-${tone} ${className}`}>
        <div className="module-modal-header research-modal-header">
          <div className="research-modal-heading">{icon}<div><span className="research-modal-kicker">Clinical Research</span><h2>{title}</h2></div></div>
          <button type="button" className="module-modal-close research-modal-close" onClick={onClose} aria-label="Close form"><X size={18} /></button>
        </div>
        <div className="research-modal-body">{children}</div>
      </div>
    </div>
  );
}
