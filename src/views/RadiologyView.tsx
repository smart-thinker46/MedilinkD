import type { ReactNode } from "react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarClock,
  CalendarPlus,
  Camera,
  CheckCircle2,
  Clock,
  Eye,
  FileSignature,
  MonitorUp,
  Radiation,
  RefreshCw,
  Save,
  Search,
  UserPlus,
  XCircle,
} from "lucide-react";
import { api } from "../lib/api";
import { useLiveRefresh } from "../lib/liveRefresh";

type RadModal = "request" | "schedule" | "study" | "report" | "dose" | null;
type RadWorkflow = "monitor" | "waiting" | "queue" | null;

const modalities = ["ALL", "X-RAY", "CT", "MRI", "ULTRASOUND", "MAMMOGRAPHY", "FLUOROSCOPY", "INTERVENTIONAL"];
const urgencyRank: Record<string, number> = { STAT: 0, URGENT: 1, ROUTINE: 2 };
const tatTargets: Record<string, number> = { STAT: 60, URGENT: 240, ROUTINE: 1440 };

const reportDefaults = {
  technique: "",
  findings: "",
  impression: "",
  recommendations: "",
  criticalFindings: false,
  criticalType: "CRITICAL_FINDING",
  criticalMessage: "",
  reportStatus: "VERIFIED",
  kmpdbNumber: "",
};

const studyDefaults = {
  pacsStudyUid: "",
  pacsSeriesUid: "",
  modalityType: "X-RAY",
  imageCount: "",
  viewerUrl: "",
};

const doseDefaults = {
  modalityType: "CT",
  doseLengthProduct: "",
  ctDoseIndex: "",
  doseAreaProduct: "",
  effectiveDoseMs: "",
  doseThresholdMs: "100",
  notes: "",
};

const requestDefaults = {
  patientId: "",
  visitId: "",
  doctorId: "",
  procedureName: "",
  imagingType: "X-RAY",
  bodyRegion: "",
  clinicalIndication: "",
  urgency: "ROUTINE",
  contrastRequired: false,
  contrastType: "",
  specialInstructions: "",
  provisionalDiagnosis: "",
};

const scheduleDefaults = {
  modalityId: "",
  modalityType: "X-RAY",
  scheduledAt: "",
  estimatedDurationMinutes: "30",
  contrastPrepRequired: false,
  fastingRequired: false,
  prepNotes: "",
};

const unwrapRows = (value: any) => {
  const data = value?.data ?? value;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  return [];
};

const statusLabel = (row: any) => String(row?.normalizedStatus || row?.status || "REQUESTED").toUpperCase();
const urgencyLabel = (row: any) => String(row?.urgency || row?.priority || "ROUTINE").toUpperCase();
const modalityLabel = (row: any) => String(row?.modalityType || row?.imagingType || row?.procedureName || "X-RAY").toUpperCase();
const patientName = (row: any) =>
  [row?.visit?.patient?.firstName, row?.visit?.patient?.middleName, row?.visit?.patient?.lastName].filter(Boolean).join(" ").trim() ||
  row?.patientName ||
  "Patient";
const patientCode = (row: any) => row?.visit?.patient?.patientCode || row?.visit?.patient?.mrn || row?.patientCode || "-";
const doctorName = (row: any) => [row?.doctor?.firstName, row?.doctor?.lastName].filter(Boolean).join(" ") || row?.requestedBy || "-";
const minutesSince = (raw: any) => {
  const time = Date.parse(String(raw || ""));
  if (!Number.isFinite(time)) return 0;
  return Math.max(0, Math.floor((Date.now() - time) / 60000));
};
const waitText = (mins: number) => (mins < 60 ? `${mins} min` : `${Math.floor(mins / 60)}h ${mins % 60}m`);
const tatTone = (row: any) => {
  const target = tatTargets[urgencyLabel(row)] || tatTargets.ROUTINE;
  const waited = minutesSince(row.createdAt);
  if (waited > target) return "red";
  if (waited > target * 0.75) return "yellow";
  return "green";
};
const noticeTone = (message: string) => {
  const text = message.toLowerCase();
  if (text.includes("failed") || text.includes("cancelled") || text.includes("exceed")) return "error";
  if (text.includes("critical") || text.includes("approach") || text.includes("dose") || text.includes("breach")) return "warning";
  if (text.includes("scheduled") || text.includes("pacs") || text.includes("performed")) return "info";
  return "success";
};

export default function RadiologyView() {
  const [requests, setRequests] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [configuredModalities, setConfiguredModalities] = useState<any[]>([]);
  const [queueTokens, setQueueTokens] = useState<any[]>([]);
  const [dashboard, setDashboard] = useState<any>({});
  const [studies, setStudies] = useState<any[]>([]);
  const [doseSummary, setDoseSummary] = useState<any>({});
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ACTIVE");
  const [modalityFilter, setModalityFilter] = useState("ALL");
  const [selected, setSelected] = useState<any | null>(null);
  const [modal, setModal] = useState<RadModal>(null);
  const [reportForm, setReportForm] = useState(reportDefaults);
  const [studyForm, setStudyForm] = useState(studyDefaults);
  const [doseForm, setDoseForm] = useState(doseDefaults);
  const [requestForm, setRequestForm] = useState(requestDefaults);
  const [scheduleForm, setScheduleForm] = useState(scheduleDefaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");
  const [notice, setNotice] = useState("");
  const [workflow, setWorkflow] = useState<RadWorkflow>(null);
  const [waitingCheckInDate, setWaitingCheckInDate] = useState(() => new Date().toISOString().slice(0, 10));

  const load = async () => {
    setLoading(true);
    try {
      const [requestRes, dashboardRes, studyRes, queueRes, patientRes, staffRes, modalityRes] = await Promise.all([
        api.get("/radiology/requests", { params: { limit: 800 } }).catch(() => ({ data: [] })),
        api.get("/radiology/dashboard").catch(() => ({ data: {} })),
        api.get("/radiology/studies").catch(() => ({ data: [] })),
        api.get("/opd/queue/board", { params: { departmentId: "RADIOLOGY" } }).catch(() => ({ data: {} })),
        api.get("/tenant/patients", { params: { limit: 800 } }).catch(() => ({ data: [] })),
        api.get("/staff").catch(() => ({ data: [] })),
        api.get("/radiology/modalities").catch(() => ({ data: [] })),
      ]);
      const rows = unwrapRows(requestRes.data);
      setRequests(rows);
      setDashboard(dashboardRes.data || {});
      setStudies(unwrapRows(studyRes.data));
      setPatients(unwrapRows(patientRes.data));
      setStaff(unwrapRows(staffRes.data));
      setConfiguredModalities(unwrapRows(modalityRes.data));
      const queuePayload = queueRes.data?.data || queueRes.data || {};
      setQueueTokens(Array.isArray(queuePayload?.tokens) ? queuePayload.tokens : []);
      setSelected((current: any) => (current && rows.some((row: any) => row.id === current.id) ? rows.find((row: any) => row.id === current.id) : rows[0] || null));
    } catch (error: any) {
      setNotice(error?.response?.data?.message || "Radiology data could not be loaded.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  useLiveRefresh(load, { intervalMs: 45000 });

  useEffect(() => {
    const patientId = selected?.visit?.patientId || selected?.visit?.patient?.id;
    if (!patientId) {
      setDoseSummary({});
      return;
    }
    api.get("/radiology/dose", { params: { patientId } }).then((res) => setDoseSummary(res.data || {})).catch(() => setDoseSummary({}));
  }, [selected?.id]);

  useEffect(() => {
    const handleSidebarAction = (event: Event) => {
      const action = (event as CustomEvent<{ action?: string }>).detail?.action;
      if (action === "monitor-patient") setWorkflow("monitor");
      if (action === "queue-patient") setWorkflow("queue");
    };
    const handleWaitingList = (event: Event) => {
      const detail = (event as CustomEvent<{ moduleKey?: string }>).detail;
      if (!detail?.moduleKey || detail.moduleKey === "radiology") setWorkflow("waiting");
    };
    const handleQueued = () => void load();
    window.addEventListener("hmis:radiology-sidebar-action", handleSidebarAction);
    window.addEventListener("hmis:open-module-waiting-list", handleWaitingList);
    window.addEventListener("hmis:patient-queued", handleQueued);
    return () => {
      window.removeEventListener("hmis:radiology-sidebar-action", handleSidebarAction);
      window.removeEventListener("hmis:open-module-waiting-list", handleWaitingList);
      window.removeEventListener("hmis:patient-queued", handleQueued);
    };
  }, []);

  const visible = useMemo(() => {
    const activeStatuses = new Set(["REQUESTED", "ORDER_CREATED", "ORDER_RECEIVED", "CLINICAL_REVIEW", "APPROVED", "AUTHORIZATION_PENDING", "AUTHORIZED", "SCHEDULED", "PREPARATION_PENDING", "PATIENT_ARRIVED", "PATIENT_VERIFIED", "READY_FOR_EXAM", "IN_EXAM", "PERFORMED", "ACQUISITION_COMPLETED", "IMAGE_AVAILABLE", "RADIOLOGIST_WORKLIST", "REPORT_DRAFT", "REPORT_REVIEW", "REPORTED", "REPORT_VERIFIED", "VERIFIED", "REPORT_SIGNED", "REPORT_RELEASED", "CLINICIAN_REVIEW", "WAITING", "CALLED", "IN_SERVICE", "URGENT", "EMERGENCY", "SKIPPED"]);
    const q = search.trim().toLowerCase();
    const queuedRows = queueTokens.map((row) => ({ ...row, id: `queue-${row.tokenId || row.tokenNumber}`, isQueueToken: true, procedureName: "Radiology queue intake", imagingType: "RADIOLOGY", source: row.source || "OPD" }));
    return [...requests, ...queuedRows]
      .filter((row) => {
        const status = statusLabel(row);
        if (statusFilter === "ACTIVE" && !activeStatuses.has(status)) return false;
        if (statusFilter !== "ACTIVE" && statusFilter !== "ALL" && status !== statusFilter) return false;
        if (modalityFilter !== "ALL" && !modalityLabel(row).includes(modalityFilter)) return false;
        const haystack = [patientName(row), patientCode(row), row?.procedureName, row?.clinicalIndication, row?.bodyRegion, modalityLabel(row), urgencyLabel(row)].join(" ").toLowerCase();
        return !q || haystack.includes(q);
      })
      .sort((a, b) => {
        const priority = (urgencyRank[urgencyLabel(a)] ?? 9) - (urgencyRank[urgencyLabel(b)] ?? 9);
        if (priority !== 0) return priority;
        return minutesSince(b.createdAt) - minutesSince(a.createdAt);
      });
  }, [modalityFilter, queueTokens, requests, search, statusFilter]);

  const selectedStudy = useMemo(
    () => studies.find((study) => String(study.requestId) === String(selected?.id)),
    [selected?.id, studies],
  );
  const isQueueOnlyPatient = Boolean(selected?.isQueueToken);

  const stats = useMemo(() => {
    const totals = dashboard?.totals || {};
    return [
      { label: "RIS Worklist", value: totals.pendingReports ?? visible.length, color: "#1e3a8a" },
      { label: "STAT", value: totals.statCases ?? requests.filter((row) => urgencyLabel(row) === "STAT").length, color: "#dc2626" },
      { label: "Performed", value: totals.performed ?? requests.filter((row) => statusLabel(row) === "PERFORMED").length, color: "#f59e0b" },
      { label: "Reported", value: totals.reported ?? requests.filter((row) => statusLabel(row) === "REPORTED").length, color: "#16a34a" },
      { label: "Avg TAT", value: `${totals.averageTurnaroundHours || 0}h`, color: "#7c3aed" },
    ];
  }, [dashboard, requests, visible.length]);

  const setToast = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice((current) => (current === message ? "" : current)), 5000);
  };

  const runAction = async (label: string, fn: () => Promise<void>) => {
    setSaving(label);
    try {
      await fn();
      await load();
    } catch (error: any) {
      setToast(error?.response?.data?.message || `${label} failed.`);
    } finally {
      setSaving("");
    }
  };

  const openModal = (type: RadModal, row?: any) => {
    const target = row || selected;
    if (row) setSelected(row);
    if (type === "request") {
      const patientId = String(target?.visit?.patientId || target?.visit?.patient?.id || target?.patientId || "");
      const visitId = String(target?.visitId || target?.visit?.id || "");
      const doctorId = String(target?.doctorId || target?.doctor?.id || "");
      setRequestForm({ ...requestDefaults, patientId, visitId, doctorId });
    }
    if (type === "schedule" && target) setScheduleForm({ ...scheduleDefaults, modalityType: modalityLabel(target) });
    if (type === "study" && target) setStudyForm({ ...studyDefaults, modalityType: modalityLabel(target), pacsStudyUid: `1.2.840.${Date.now()}` });
    if (type === "report") setReportForm(reportDefaults);
    if (type === "dose" && target) setDoseForm({ ...doseDefaults, modalityType: modalityLabel(target) });
    setModal(type);
  };

  const saveRequest = (event: FormEvent) => {
    event.preventDefault();
    const hasPatientContext = requestForm.patientId.trim() || requestForm.visitId.trim();
    if (!hasPatientContext) {
      setToast("Enter a checked-in visit ID or a registered patient ID before creating a radiology request.");
      return;
    }
    void runAction("request", async () => {
      const res = await api.post("/radiology/request", {
        ...requestForm,
        contrastRequired: requestForm.contrastRequired,
        procedureName: requestForm.procedureName || requestForm.imagingType,
      });
      setModal(null);
      setToast("Radiology request created and added to the RIS worklist.");
      setSelected(res.data || null);
    });
  };

  const saveSchedule = (event: FormEvent) => {
    event.preventDefault();
    if (!selected) return;
    void runAction("schedule", async () => {
      await api.post("/radiology/schedule", { ...scheduleForm, requestId: selected.id });
      setModal(null);
      setToast("Study scheduled and request moved to SCHEDULED.");
    });
  };

  const markPerformed = (row: any) =>
    runAction("perform", async () => {
      await api.patch(`/radiology/request/${row.id}/status`, { status: "PERFORMED", notes: "Images acquired and sent to PACS." });
      setToast("Study marked performed and available for PACS metadata.");
    });

  const setRequestStatus = (row: any, status: string, message: string) =>
    runAction(status.toLowerCase(), async () => {
      await api.patch(`/radiology/request/${row.id}/status`, { status, notes: message });
      setToast(message);
    });

  const acknowledgeAlert = (row: any) =>
    runAction("acknowledge", async () => {
      await api.patch(`/radiology/critical-alert/${row.alertId}/acknowledge`, {});
      setToast("Critical finding acknowledged.");
    });

  const createStudy = (event: FormEvent) => {
    event.preventDefault();
    if (!selected) return;
    void runAction("study", async () => {
      await api.post("/radiology/study", { ...studyForm, requestId: selected.id, studyStatus: "AVAILABLE" });
      await api.patch(`/radiology/request/${selected.id}/status`, { status: "PERFORMED", notes: "PACS study metadata received." }).catch(() => undefined);
      setModal(null);
      setToast("PACS study created and linked to the original order.");
    });
  };

  const saveReport = (event: FormEvent) => {
    event.preventDefault();
    if (!selected) return;
    if (reportForm.criticalFindings && !reportForm.criticalMessage.trim()) {
      setToast("Critical finding requires an urgent alert message.");
      return;
    }
    void runAction("report", async () => {
      await api.post("/radiology/report", {
        ...reportForm,
        requestId: selected.id,
        conclusion: reportForm.impression,
      });
      setModal(null);
      setToast(reportForm.criticalFindings ? "Report signed and critical alert sent to clinician." : "Report signed and delivered.");
    });
  };

  const saveDose = (event: FormEvent) => {
    event.preventDefault();
    if (!selected) return;
    void runAction("dose", async () => {
      await api.post("/radiology/dose", { ...doseForm, requestId: selected.id });
      setModal(null);
      setToast("Radiation dose recorded and cumulative dose recalculated.");
    });
  };

  const viewImages = () => {
    if (!selectedStudy?.viewerUrl) {
      setToast("No PACS viewer URL has been linked to this study yet.");
      return;
    }
    window.open(selectedStudy.viewerUrl, "_blank", "noopener,noreferrer");
  };

  const queuePatient = async (patient: any) => {
    const patientId = String(patient?.id || "").trim();
    if (!patientId) return;
    setSaving("queue");
    try {
      const response = await api.post("/opd/queue/token", {
        patientId,
        visitId: patient?.visitId || undefined,
        departmentId: "RADIOLOGY",
        queueType: "RADIOLOGY",
        tokenPrefix: "RAD",
        queueLane: "GENERAL",
        priority: 4,
        source: "radiology",
        notes: "Queued from Radiology module",
      });
      setWorkflow(null);
      setToast(response.data?.duplicate ? "Patient is already waiting in the Radiology queue." : "Patient queued to Radiology.");
      window.dispatchEvent(new CustomEvent("hmis:patient-queued", { detail: { patient, destination: { departmentId: "RADIOLOGY" } } }));
      await load();
    } catch (error: any) {
      setToast(error?.response?.data?.message || "Radiology queue request failed.");
    } finally {
      setSaving("");
    }
  };

  const checkInQueuedPatient = async (row: any) => {
    const tokenNumber = String(row?.tokenNumber || "").trim();
    const patientId = String(row?.patientId || "").trim();
    if (!tokenNumber || !patientId) {
      setToast("This waiting-list entry has no queue token or patient identifier.");
      return;
    }
    setSaving("check-in");
    try {
      const checkingOut = statusLabel(row) === "IN_SERVICE";
      await api.patch("/opd/queue/token/status", {
        tokenNumber,
        status: checkingOut ? "COMPLETED" : "IN_SERVICE",
        checkInDate: waitingCheckInDate,
        reason: checkingOut ? "Checked out from Radiology waiting list" : "Checked in from Radiology waiting list",
      });
      if (checkingOut) {
        const states = JSON.parse(window.localStorage.getItem("hmis_patient_module_states") || "{}");
        delete states.radiology;
        window.localStorage.setItem("hmis_patient_module_states", JSON.stringify(states));
        window.dispatchEvent(new CustomEvent("hmis:patient-module-state", { detail: { moduleKey: "radiology", state: {} } }));
        setToast(`${row.patientName || row.patientCode || "Patient"} checked out from Radiology.`);
        await load();
        return;
      }
      const patient = {
        id: patientId,
        patientId,
        patientName: row.patientName || row.patientCode || "Queued patient",
        patientCode: row.patientCode || row.mrn || "",
        queueModule: "RADIOLOGY",
        hasCheckedInPatient: true,
        isQueued: false,
        checkInDate: waitingCheckInDate,
      };
      const states = JSON.parse(window.localStorage.getItem("hmis_patient_module_states") || "{}");
      states.radiology = patient;
      window.localStorage.setItem("hmis_patient_module_states", JSON.stringify(states));
      window.dispatchEvent(new CustomEvent("hmis:patient-module-state", { detail: { moduleKey: "radiology", state: patient } }));
      setWorkflow(null);
      setToast(`${patient.patientName} checked in for ${waitingCheckInDate}.`);
      await load();
    } catch (error: any) {
      setToast(error?.response?.data?.message || "Radiology patient check-in failed.");
    } finally {
      setSaving("");
    }
  };

  return (
    <div className="nursing-view radiology-view">
      <div className="pv-header">
        <div>
          <h2 className="pv-title">Radiology Imaging Desk</h2>
          <p className="pv-subtitle">RIS worklist, PACS study access, structured reporting, dose tracking, and TAT monitoring.</p>
        </div>
        <div className="nursing-header-actions">
          <button type="button" className="nursing-secondary-btn rad-btn rad-btn-neutral" onClick={() => void load()}><RefreshCw size={15} /> Refresh</button>
          <button type="button" className="rad-btn rad-btn-primary" onClick={() => openModal("request")}><UserPlus size={15} /> New Request</button>
          <button type="button" className="rad-btn rad-btn-info" disabled={!selected} onClick={() => openModal("schedule")}><CalendarPlus size={15} /> Schedule</button>
        </div>
      </div>

      {notice ? (
        <div className={`module-notice-toast is-${noticeTone(notice)}`} role="status" aria-live="polite">
          <span className="module-notice-icon"><NoticeIcon tone={noticeTone(notice)} /></span>
          <div><strong>Radiology</strong><span>{notice}</span></div>
          <button type="button" className="module-notice-close" onClick={() => setNotice("")}>×</button>
        </div>
      ) : null}

      {workflow ? (
        <div className="module-form-overlay" onClick={() => setWorkflow(null)}>
          <section className="module-form-panel modal-panel radiology-workflow-modal" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
            <div className="module-form-header"><div className="module-form-heading"><div className="module-form-icon"><MonitorUp size={20} /></div><div><div className="module-form-kicker">Radiology workflow</div><h2 className="module-form-title">{workflow === "monitor" ? "Monitor Patient" : workflow === "waiting" ? "Open Waiting List" : "Queue Patient"}</h2></div></div><button type="button" className="modal-close-btn" onClick={() => setWorkflow(null)}>×</button></div>
            <div className="module-form-body">
              {workflow === "waiting" ? <div className="radiology-waiting-toolbar"><div><span className="radiology-waiting-kicker">RADIOLOGY QUEUE</span><strong>Patients waiting for imaging</strong><small>Review the source module, then check in the patient for today or a previous date.</small></div><label className="workflow-waiting-date">Check-in date<input type="date" value={waitingCheckInDate} onChange={(event) => setWaitingCheckInDate(event.target.value)} /></label></div> : null}
              {workflow === "monitor" ? <div className="lab-workflow-list">{visible.slice(0, 50).map((row) => <button type="button" key={row.id} onClick={() => { setSelected(row); setWorkflow(null); }}><strong>{patientName(row)}</strong><span>{row.procedureName || row.imagingType} · {statusLabel(row)}</span></button>)}{!visible.length ? <p className="pv-empty">No Radiology patients are currently active.</p> : null}</div> : null}
              {workflow === "waiting" ? <div className="radiology-waiting-list">
                {queueTokens.filter((row) => ["WAITING", "CALLED", "IN_SERVICE", "URGENT", "EMERGENCY", "SKIPPED"].includes(statusLabel(row))).slice(0, 100).map((row) => <div className="radiology-waiting-row" key={`queue-${row.tokenId || row.tokenNumber}`}><button type="button" className="radiology-waiting-patient" onClick={() => { setSelected({ ...row, id: `queue-${row.tokenId || row.tokenNumber}`, isQueueToken: true, procedureName: "Radiology queue intake", imagingType: "RADIOLOGY" }); }}><span className="radiology-waiting-avatar"><MonitorUp size={17} /></span><span className="radiology-waiting-copy"><strong>{row.patientName || row.patientCode || "Queued patient"}</strong><small>{row.patientCode || row.mrn || "No MRN"} · From {row.source || "another module"}</small></span><span className={`radiology-waiting-status is-${statusLabel(row).toLowerCase()}`}>{statusLabel(row).replace(/_/g, " ")}</span></button><div className="radiology-waiting-actions"><span className="radiology-token">{row.tokenNumber || "—"}</span><button type="button" className="radiology-checkin-btn" disabled={saving === "check-in"} onClick={() => void checkInQueuedPatient(row)}>{saving === "check-in" ? "Updating…" : statusLabel(row) === "IN_SERVICE" ? "Check Out" : "Check In"}</button></div></div>)}
                {!queueTokens.some((row) => ["WAITING", "CALLED", "URGENT", "EMERGENCY", "SKIPPED"].includes(statusLabel(row))) ? <p className="pv-empty">No patients are waiting for Radiology.</p> : null}
              </div> : null}
              {workflow === "queue" ? <div className="lab-workflow-list">
                <p className="workflow-helper-text">Select a registered patient to begin a Radiology order. Queue mechanics remain owned by Queue Management; this shortcut creates the originating imaging request from the current module.</p>
                {patients.slice(0, 100).map((patient) => <div className="lab-workflow-list-item" key={patient.id}><button type="button" onClick={() => { setSelected({ patientId: patient.id, patientName: [patient.firstName, patient.middleName, patient.lastName].filter(Boolean).join(" "), patientCode: patient.patientCode || patient.mrn }); setRequestForm({ ...requestDefaults, patientId: patient.id }); setWorkflow(null); setModal("request"); }}><strong>{[patient.firstName, patient.middleName, patient.lastName].filter(Boolean).join(" ") || "Patient"}</strong><span>{patient.patientCode || patient.mrn || patient.id} · Open request</span></button><button type="button" className="patient-search-checkin workflow-waiting-checkin" disabled={saving === "queue"} onClick={() => void queuePatient(patient)}>{saving === "queue" ? "Queueing..." : "Queue"}</button></div>)}
                {!patients.length ? <p className="pv-empty">No registered patients are available.</p> : null}
              </div> : null}
            </div>
          </section>
        </div>
      ) : null}

      <div className="pv-stats nursing-stats-grid">
        {stats.map((stat) => (
          <article key={stat.label} className="pv-stat-card" style={{ borderLeftColor: stat.color }}>
            <p className="pv-stat-label">{stat.label}</p>
            <p className="pv-stat-value">{loading ? "..." : stat.value}</p>
          </article>
        ))}
      </div>

      <div className="radiology-layout">
        <section className="nursing-worklist">
          <div className="pv-search-bar">
            <div className="pv-search-wrap">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input className="pv-search" placeholder="Search patient, MRN, indication, modality..." value={search} onChange={(event) => setSearch(event.target.value)} />
            </div>
            <div className="radiology-filter-row">
              <select className="pv-select" value={modalityFilter} onChange={(event) => setModalityFilter(event.target.value)}>
                {modalities.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
              <select className="pv-select" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                {["ACTIVE", "ALL", "ORDER_CREATED", "ORDER_RECEIVED", "CLINICAL_REVIEW", "APPROVED", "REQUESTED", "SCHEDULED", "PATIENT_ARRIVED", "READY_FOR_EXAM", "IN_EXAM", "PERFORMED", "ACQUISITION_COMPLETED", "IMAGE_AVAILABLE", "RADIOLOGIST_WORKLIST", "REPORT_DRAFT", "REPORTED", "REPORT_VERIFIED", "VERIFIED", "REPORT_SIGNED", "REPORT_RELEASED", "COMPLETED", "CANCELLED", "POSTPONED", "RESCHEDULED", "PATIENT_NO_SHOW", "EXAM_ABORTED", "EQUIPMENT_FAILURE", "REPEAT_REQUIRED", "REFERRED_OUT", "REPORT_AMENDED"].map((item) => <option key={item} value={item}>{item.replace(/_/g, " ")}</option>)}
              </select>
            </div>
          </div>

          <div className="pv-table-wrap">
            <table className="pv-table">
              <thead><tr><th>Priority</th><th>Patient</th><th>Exam</th><th>TAT</th><th>Status</th></tr></thead>
              <tbody>
                {loading ? <tr><td colSpan={5} className="pv-empty">Loading RIS worklist...</td></tr> : visible.length === 0 ? <tr><td colSpan={5} className="pv-empty">No imaging requests found.</td></tr> : visible.map((row) => (
                  <tr key={row.id} className={selected?.id === row.id ? "nursing-selected-row" : ""} onClick={() => setSelected(row)}>
                    <td><span className={`rad-priority is-${urgencyLabel(row).toLowerCase()}`}>{urgencyLabel(row)}</span></td>
                    <td><strong>{patientName(row)}</strong><br /><small>{patientCode(row)}</small></td>
                    <td>{row.procedureName || row.imagingType}<br /><small>{modalityLabel(row)} {row.contrastRequired ? " | Contrast" : ""}</small></td>
                    <td><span className={`rad-tat is-${tatTone(row)}`}>{waitText(minutesSince(row.createdAt))}</span></td>
                    <td><span className="pv-badge">{statusLabel(row)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="nursing-care-panel">
          <div className="nursing-care-header">
            <div><span>Selected Study</span><strong>{selected ? `${patientName(selected)} | ${selected.procedureName}` : "No study selected"}</strong></div>
            <span className="pv-badge">{selected ? modalityLabel(selected) : "RIS"}</span>
          </div>
          <div className="nursing-tabs radiology-tabs">
            <button type="button" className="rad-tab-action is-perform" disabled={!selected || isQueueOnlyPatient} onClick={() => selected && markPerformed(selected)}><Camera size={15} /> Performed</button>
            <button type="button" className="rad-tab-action is-schedule" disabled={!selected || isQueueOnlyPatient} onClick={() => openModal("schedule")}><CalendarClock size={15} /> Schedule</button>
            <button type="button" className="rad-tab-action is-pacs" disabled={!selected || isQueueOnlyPatient} onClick={() => openModal("study")}><MonitorUp size={15} /> PACS Study</button>
            <button type="button" className="rad-tab-action is-view" disabled={!selected || !selectedStudy} onClick={viewImages}><Eye size={15} /> View Images</button>
            <button type="button" className="rad-tab-action is-report" disabled={!selected || isQueueOnlyPatient} onClick={() => openModal("report")}><FileSignature size={15} /> Report</button>
            <button type="button" className="rad-tab-action is-dose" disabled={!selected || isQueueOnlyPatient} onClick={() => openModal("dose")}><Radiation size={15} /> Dose</button>
            <button type="button" className="rad-tab-action is-complete" disabled={!selected || isQueueOnlyPatient} onClick={() => selected && setRequestStatus(selected, "COMPLETED", "Radiology request completed.")}><CheckCircle2 size={15} /> Complete</button>
            <button type="button" className="rad-tab-action is-danger" disabled={!selected || isQueueOnlyPatient} onClick={() => selected && setRequestStatus(selected, "CANCELLED", "Radiology request cancelled.")}><XCircle size={15} /> Cancel</button>
          </div>
          <div className="nursing-workspace">
            {selected ? (
              <div className="nursing-clinical-card">
                <h3 className="form-title"><MonitorUp size={18} /> DICOM Modality Worklist</h3>
                <div className="radiology-detail-grid">
                  <span><strong>Patient</strong>{patientName(selected)} ({patientCode(selected)})</span>
                  <span><strong>Exam</strong>{selected.procedureName || selected.imagingType}</span>
                  <span><strong>Clinical indication</strong>{selected.clinicalIndication || "Not provided"}</span>
                  <span><strong>Contrast</strong>{selected.contrastRequired ? selected.contrastType || "Required" : "Not required"}</span>
                  <span><strong>Ordering clinician</strong>{doctorName(selected)}</span>
                  <span><strong>PACS Study UID</strong>{selectedStudy?.pacsStudyUid || "Not linked"}</span>
                </div>
                {doseSummary?.thresholdExceeded ? <div className="nursing-risk-alert"><AlertTriangle size={16} /> Cumulative dose {doseSummary.cumulativeEffectiveDoseMs} mSv exceeds threshold {doseSummary.thresholdMs} mSv. Confirm justification before next dose-intensive study.</div> : null}
              </div>
            ) : <div className="pv-empty">Select a request from the RIS worklist.</div>}
          </div>
        </section>
      </div>

      <div className="radiology-bottom-grid">
        <section className="nursing-clinical-card">
          <h3 className="form-title"><Clock size={18} /> TAT Priority Queue</h3>
          {(dashboard?.pendingReports || []).slice(0, 5).map((row: any) => (
            <button key={row.id} type="button" className="rad-queue-item" onClick={() => setSelected(row)}>
              <strong>{row.procedureName || row.imagingType}</strong><span>{patientName(row)} | {urgencyLabel(row)} | {waitText(minutesSince(row.createdAt))}</span>
            </button>
          ))}
          {!(dashboard?.pendingReports || []).length ? <p className="pv-empty">No TAT breaches or pending reports.</p> : null}
        </section>
        <section className="nursing-clinical-card">
          <h3 className="form-title"><AlertTriangle size={18} /> Critical Findings</h3>
          {(dashboard?.criticalAlerts || []).slice(0, 5).map((row: any) => (
            <div key={row.alertId || row.id} className="rad-critical-item">
              <strong>{row.patientName || "Patient"}</strong>
              <span>{row.message}</span>
              {!row.acknowledged ? <button type="button" className="rad-alert-ack" onClick={() => acknowledgeAlert(row)}>Acknowledge</button> : <em>Acknowledged</em>}
            </div>
          ))}
          {!(dashboard?.criticalAlerts || []).length ? <p className="pv-empty">No unacknowledged critical radiology alerts.</p> : null}
        </section>
      </div>

      {modal ? (
        <div className="module-form-overlay" onClick={() => setModal(null)}>
          <form className={`module-form-panel modal-panel radiology-modal is-${modal}`} onSubmit={modal === "request" ? saveRequest : modal === "schedule" ? saveSchedule : modal === "study" ? createStudy : modal === "report" ? saveReport : saveDose} onClick={(event) => event.stopPropagation()}>
            <div className="module-form-header">
              <div className="module-form-heading"><div className="module-form-icon"><MonitorUp size={20} /></div><div><div className="module-form-kicker">Radiology</div><h2 className="module-form-title">{modal === "request" ? "New Imaging Request" : modal === "schedule" ? "Schedule Study" : modal === "study" ? "PACS Study" : modal === "dose" ? "Radiation Dose" : "Structured Report"}</h2></div></div>
              <button type="button" className="modal-close-btn" onClick={() => setModal(null)}>×</button>
            </div>
            <div className="module-form-body">
              <div className="module-form-grid">
                {modal === "request" ? <>
                  <Field label="Patient" wide>
                    <select className="module-form-input" value={requestForm.patientId} onChange={(e) => setRequestForm({ ...requestForm, patientId: e.target.value, visitId: "" })} required>
                      <option value="">Select a registered patient</option>
                      {patients.map((patient) => <option key={patient.id} value={patient.id}>{[patient.firstName, patient.middleName, patient.lastName].filter(Boolean).join(" ") || "Patient"} · {patient.patientCode || patient.mrn || patient.id}</option>)}
                    </select>
                    {!patients.length ? <small className="form-help">No patient records were returned. Refresh after registering the patient.</small> : null}
                  </Field>
                  <Field label="Checked-in visit ID"><input className="module-form-input" value={requestForm.visitId} onChange={(e) => setRequestForm({ ...requestForm, visitId: e.target.value })} placeholder="Optional visit UUID (uses patient context when blank)" /></Field>
                  <Field label="Requesting clinician" wide>
                    <select className="module-form-input" value={requestForm.doctorId} onChange={(e) => setRequestForm({ ...requestForm, doctorId: e.target.value })}>
                      <option value="">Use my staff profile</option>
                      {staff.map((person) => <option key={person.id} value={person.id}>{[person.firstName, person.lastName].filter(Boolean).join(" ") || person.name || "Staff member"}{person.roleTitle ? ` · ${person.roleTitle}` : ""}</option>)}
                    </select>
                  </Field>
                  <Field label="Modality"><select className="module-form-input" value={requestForm.imagingType} onChange={(e) => setRequestForm({ ...requestForm, imagingType: e.target.value })}>{modalities.filter((m) => m !== "ALL").map((m) => <option key={m}>{m}</option>)}</select></Field>
                  <Field label="Examination"><input className="module-form-input" value={requestForm.procedureName} onChange={(e) => setRequestForm({ ...requestForm, procedureName: e.target.value })} required placeholder="Chest X-ray PA, CT Abdomen..." /></Field>
                  <Field label="Body region"><input className="module-form-input" value={requestForm.bodyRegion} onChange={(e) => setRequestForm({ ...requestForm, bodyRegion: e.target.value })} /></Field>
                  <Field label="Priority"><select className="module-form-input" value={requestForm.urgency} onChange={(e) => setRequestForm({ ...requestForm, urgency: e.target.value })}><option>ROUTINE</option><option>URGENT</option><option>STAT</option></select></Field>
                  <Field label="Contrast"><label className="rad-check"><input type="checkbox" checked={requestForm.contrastRequired} onChange={(e) => setRequestForm({ ...requestForm, contrastRequired: e.target.checked })} /> Contrast required</label></Field>
                  <Field label="Contrast type"><input className="module-form-input" value={requestForm.contrastType} onChange={(e) => setRequestForm({ ...requestForm, contrastType: e.target.value })} /></Field>
                  <Field label="Provisional diagnosis"><input className="module-form-input" value={requestForm.provisionalDiagnosis} onChange={(e) => setRequestForm({ ...requestForm, provisionalDiagnosis: e.target.value })} /></Field>
                  <Field label="Clinical indication" wide><textarea className="module-form-input" value={requestForm.clinicalIndication} onChange={(e) => setRequestForm({ ...requestForm, clinicalIndication: e.target.value })} required /></Field>
                  <Field label="Special instructions" wide><textarea className="module-form-input" value={requestForm.specialInstructions} onChange={(e) => setRequestForm({ ...requestForm, specialInstructions: e.target.value })} /></Field>
                </> : null}
                {modal === "schedule" ? <>
                  <Field label="Request"><input className="module-form-input" value={selected ? `${patientName(selected)} - ${selected.procedureName || selected.imagingType}` : ""} readOnly /></Field>
                  <Field label="Modality"><select className="module-form-input" value={scheduleForm.modalityType} onChange={(e) => setScheduleForm({ ...scheduleForm, modalityType: e.target.value })}>{modalities.filter((m) => m !== "ALL").map((m) => <option key={m}>{m}</option>)}</select></Field>
                  <Field label="Modality ID">
                    <select className="module-form-input" value={scheduleForm.modalityId} onChange={(e) => setScheduleForm({ ...scheduleForm, modalityId: e.target.value })}>
                      <option value="">Select configured modality (optional)</option>
                      {configuredModalities.filter((machine) => machine.available !== false).map((machine) => <option key={machine.modalityId} value={machine.modalityId}>{machine.modalityName || machine.modalityType} · {machine.roomName || "Configured machine"}</option>)}
                    </select>
                  </Field>
                  <Field label="Scheduled time"><input type="datetime-local" className="module-form-input" value={scheduleForm.scheduledAt} onChange={(e) => setScheduleForm({ ...scheduleForm, scheduledAt: e.target.value })} required /></Field>
                  <Field label="Duration minutes"><input type="number" min="5" className="module-form-input" value={scheduleForm.estimatedDurationMinutes} onChange={(e) => setScheduleForm({ ...scheduleForm, estimatedDurationMinutes: e.target.value })} /></Field>
                  <Field label="Preparation"><label className="rad-check"><input type="checkbox" checked={scheduleForm.contrastPrepRequired} onChange={(e) => setScheduleForm({ ...scheduleForm, contrastPrepRequired: e.target.checked })} /> Contrast prep</label></Field>
                  <Field label="Fasting"><label className="rad-check"><input type="checkbox" checked={scheduleForm.fastingRequired} onChange={(e) => setScheduleForm({ ...scheduleForm, fastingRequired: e.target.checked })} /> Fasting required</label></Field>
                  <Field label="Preparation notes" wide><textarea className="module-form-input" value={scheduleForm.prepNotes} onChange={(e) => setScheduleForm({ ...scheduleForm, prepNotes: e.target.value })} /></Field>
                </> : null}
                {modal === "study" ? <>
                  <Field label="PACS Study UID"><input className="module-form-input" value={studyForm.pacsStudyUid} onChange={(e) => setStudyForm({ ...studyForm, pacsStudyUid: e.target.value })} required /></Field>
                  <Field label="Series UID"><input className="module-form-input" value={studyForm.pacsSeriesUid} onChange={(e) => setStudyForm({ ...studyForm, pacsSeriesUid: e.target.value })} /></Field>
                  <Field label="Modality"><select className="module-form-input" value={studyForm.modalityType} onChange={(e) => setStudyForm({ ...studyForm, modalityType: e.target.value })}>{modalities.filter((m) => m !== "ALL").map((m) => <option key={m}>{m}</option>)}</select></Field>
                  <Field label="Image count"><input type="number" className="module-form-input" value={studyForm.imageCount} onChange={(e) => setStudyForm({ ...studyForm, imageCount: e.target.value })} /></Field>
                  <Field label="PACS viewer URL" wide><input className="module-form-input" value={studyForm.viewerUrl} onChange={(e) => setStudyForm({ ...studyForm, viewerUrl: e.target.value })} placeholder="https://pacs/viewer/study/..." /></Field>
                </> : null}
                {modal === "report" ? <>
                  <Field label="Technique" wide><textarea className="module-form-input" value={reportForm.technique} onChange={(e) => setReportForm({ ...reportForm, technique: e.target.value })} required /></Field>
                  <Field label="Findings" wide><textarea className="module-form-input" value={reportForm.findings} onChange={(e) => setReportForm({ ...reportForm, findings: e.target.value })} required /></Field>
                  <Field label="Impression" wide><textarea className="module-form-input" value={reportForm.impression} onChange={(e) => setReportForm({ ...reportForm, impression: e.target.value })} required /></Field>
                  <Field label="Recommendations" wide><textarea className="module-form-input" value={reportForm.recommendations} onChange={(e) => setReportForm({ ...reportForm, recommendations: e.target.value })} /></Field>
                  <Field label="KMPDB number"><input className="module-form-input" value={reportForm.kmpdbNumber} onChange={(e) => setReportForm({ ...reportForm, kmpdbNumber: e.target.value })} required /></Field>
                  <Field label="Critical finding"><label className="rad-check"><input type="checkbox" checked={reportForm.criticalFindings} onChange={(e) => setReportForm({ ...reportForm, criticalFindings: e.target.checked })} /> Send urgent alert</label></Field>
                  <Field label="Critical alert message" wide><textarea className="module-form-input" value={reportForm.criticalMessage} onChange={(e) => setReportForm({ ...reportForm, criticalMessage: e.target.value })} /></Field>
                </> : null}
                {modal === "dose" ? <>
                  <Field label="Modality"><select className="module-form-input" value={doseForm.modalityType} onChange={(e) => setDoseForm({ ...doseForm, modalityType: e.target.value })}>{modalities.filter((m) => m !== "ALL").map((m) => <option key={m}>{m}</option>)}</select></Field>
                  <Field label="DLP"><input type="number" className="module-form-input" value={doseForm.doseLengthProduct} onChange={(e) => setDoseForm({ ...doseForm, doseLengthProduct: e.target.value })} /></Field>
                  <Field label="CTDI"><input type="number" className="module-form-input" value={doseForm.ctDoseIndex} onChange={(e) => setDoseForm({ ...doseForm, ctDoseIndex: e.target.value })} /></Field>
                  <Field label="DAP"><input type="number" className="module-form-input" value={doseForm.doseAreaProduct} onChange={(e) => setDoseForm({ ...doseForm, doseAreaProduct: e.target.value })} /></Field>
                  <Field label="Effective dose mSv"><input type="number" className="module-form-input" value={doseForm.effectiveDoseMs} onChange={(e) => setDoseForm({ ...doseForm, effectiveDoseMs: e.target.value })} required /></Field>
                  <Field label="Alert threshold mSv"><input type="number" className="module-form-input" value={doseForm.doseThresholdMs} onChange={(e) => setDoseForm({ ...doseForm, doseThresholdMs: e.target.value })} /></Field>
                  <Field label="Notes" wide><textarea className="module-form-input" value={doseForm.notes} onChange={(e) => setDoseForm({ ...doseForm, notes: e.target.value })} /></Field>
                </> : null}
              </div>
              <div className="module-form-footer"><button type="button" className="form-btn form-btn-cancel" onClick={() => setModal(null)}>Cancel</button><button type="submit" className="form-btn form-btn-primary module-form-submit" disabled={Boolean(saving)}><Save size={15} /> {saving ? "Saving..." : "Save"}</button></div>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}

function Field({ label, children, wide = false }: { label: string; children: ReactNode; wide?: boolean }) {
  return <div className={`module-form-field ${wide ? "is-wide" : ""}`}><label className="form-label">{label}</label>{children}</div>;
}

function NoticeIcon({ tone }: { tone: string }) {
  if (tone === "error" || tone === "warning") return <AlertTriangle size={19} strokeWidth={2.4} />;
  if (tone === "info") return <MonitorUp size={19} strokeWidth={2.4} />;
  return <CheckCircle2 size={19} strokeWidth={2.4} />;
}

