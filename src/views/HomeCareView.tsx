// Ported from Medilink-Frontend/src/app/home-care/page.tsx for desktop parity.
/* eslint-disable @typescript-eslint/no-explicit-any */

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Ambulance,
  CalendarClock,
  CheckCircle2,
  ClipboardPlus,
  Home,
  MapPin,
  Maximize2,
  Minimize2,
  Navigation,
  RefreshCw,
  Search,
  UserCheck,
  X,
} from "lucide-react";
import { api } from "../lib/api";
import { useLiveRefresh } from "../lib/liveRefresh";

const today = new Date().toISOString().slice(0, 10);
const defaultVisitTime = `${today}T09:00`;

const emptyPlan = {
  patientId: "",
  dischargeSummaryId: "",
  diagnoses: "",
  medications: "",
  dischargeInstructions: "",
  serviceType: "Wound care, Vital signs monitoring",
  visitFrequency: "DAILY",
  durationDays: "14",
  startDate: today,
  clinicalTargets: "",
  primaryNurseId: "",
  familyContact: "",
  familyPhone: "",
  onCallDoctor: "",
  emergencyPhone: "",
  emergencyEscalationPlan: "",
};

const emptySchedule = {
  carePlanId: "",
  nurseId: "",
  scheduledDate: defaultVisitTime,
  address: "",
  contactPhone: "",
  geographicZone: "",
  lat: "",
  lng: "",
  instructions: "",
};

const emptyDispatch = {
  nurseId: "",
  visitDate: today,
  startLat: "",
  startLng: "",
};

const emptyVisit = {
  visitId: "",
  lat: "",
  lng: "",
  clinicalFindings: "",
  interventions: "",
  medicationsAdministered: "",
  patientConcerns: "",
  temperatureC: "",
  pulseBpm: "",
  respiratoryRate: "",
  bpSystolic: "",
  bpDiastolic: "",
  spo2Percent: "",
  consciousState: "Alert",
  escalationRequired: false,
  escalationReason: "",
};

const emptyEscalation = {
  visitId: "",
  patientId: "",
  carePlanId: "",
  nurseId: "",
  reason: "",
  consciousState: "Alert",
  temperatureC: "",
  pulseBpm: "",
  respiratoryRate: "",
  bpSystolic: "",
  bpDiastolic: "",
  spo2Percent: "",
};

const fmtDateTime = (value: unknown) => {
  const date = new Date(String(value || ""));
  if (!Number.isFinite(date.getTime())) return "-";
  return date.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
};

const pretty = (value: unknown) =>
  String(value || "")
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());

const unwrapItems = (value: any) => {
  const data = value?.data ?? value;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  return [];
};

const splitList = (value: string) => value.split(",").map((item) => item.trim()).filter(Boolean);

export default function HomeCareView() {
  const [dashboard, setDashboard] = useState<any>({});
  const [plans, setPlans] = useState<any[]>([]);
  const [visits, setVisits] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [operational, setOperational] = useState<Record<string, any[]>>({});
  const [dispatchResult, setDispatchResult] = useState<any>(null);
  const [escalationResult, setEscalationResult] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<"" | "plan" | "schedule" | "dispatch" | "checkin" | "checkout" | "escalation" | "operation" | "planAction" | "visitStatus">("");
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [selectedVisitId, setSelectedVisitId] = useState("");
  const [expandedTable, setExpandedTable] = useState(false);
  const [planAction, setPlanAction] = useState<"approve" | "version" | "close">("approve");
  const [planActionForm, setPlanActionForm] = useState({ notes: "", outcome: "", finalAssessment: "", followUpPlan: "", changes: "" });
  const [visitStatusForm, setVisitStatusForm] = useState({ status: "IN_PROGRESS", reason: "" });
  const [operationType, setOperationType] = useState("observations");
  const [operationRecordId, setOperationRecordId] = useState("");
  const [operationForm, setOperationForm] = useState({ patientId: "", carePlanId: "", visitId: "", status: "ACTIVE", notes: "" });
  const [planForm, setPlanForm] = useState(emptyPlan);
  const [scheduleForm, setScheduleForm] = useState(emptySchedule);
  const [dispatchForm, setDispatchForm] = useState(emptyDispatch);
  const [visitForm, setVisitForm] = useState(emptyVisit);
  const [escalationForm, setEscalationForm] = useState(emptyEscalation);
  const [notice, setNotice] = useState<{ tone: "success" | "warning" | "error"; text: string } | null>(null);
  const [failedSources, setFailedSources] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");

  const showNotice = (text: string, tone: "success" | "warning" | "error" = "success") => {
    setNotice({ tone, text });
    window.setTimeout(() => setNotice((current) => (current?.text === text ? null : current)), tone === "success" ? 3200 : 5200);
  };

  const load = async () => {
    setLoading(true);
    try {
      const resources = ["referrals", "eligibility", "plan-versions", "services", "assignments", "caregivers", "caregivers-training", "safety", "observations", "interventions", "vitals", "wounds", "medications", "equipment", "supplies", "goals", "goal-progress", "followups", "transfers", "charge-events", "messages", "consent-references", "documents", "sync-batches", "sync-conflicts"];
      const results = await Promise.allSettled([
        api.get("/home-care/dashboard"),
        api.get("/home-care/plans", { params: { search: search.trim() || undefined, limit: 500 } }),
        api.get("/home-care/visits", { params: { limit: 500 } }),
        api.get("/tenant/patients", { params: { limit: 500 } }).catch(() => api.get("/patients", { params: { limit: 500 } })),
        ...resources.map((resource) => api.get(`/home-care/operations/${resource}`, { params: { limit: 200 } })),
      ]);
      const sourceNames = ["dashboard", "care plans", "visits", "patients", ...resources.map(pretty)];
      const failures = results.flatMap((result, index) => result.status === "rejected" ? [sourceNames[index]] : []);
      setFailedSources(failures);
      if (failures.length) showNotice(`${failures.length} Home Care data source${failures.length === 1 ? "" : "s"} could not be loaded: ${failures.join(", ")}.`, "warning");
      const resultData = (index: number, fallback: any) => results[index]?.status === "fulfilled" ? (results[index] as any).value : { data: fallback };
      const dashRes = resultData(0, {}), planRes = resultData(1, { items: [] }), visitRes = resultData(2, { items: [] }), patientRes = resultData(3, []);
      setDashboard(dashRes.data || {});
      setPlans(unwrapItems(planRes.data));
      setVisits(unwrapItems(visitRes.data));
      setPatients(unwrapItems(patientRes.data));
      setOperational(Object.fromEntries(resources.map((resource, index) => [resource, unwrapItems(resultData(index + 4, { items: [] }).data)])));
    } catch (error: any) {
      showNotice(error?.response?.data?.message || "Home Care data could not be loaded.", "error");
    } finally {
      setLoading(false);
    }
  };

  const saveOperationalRecord = async (event: FormEvent) => {
    event.preventDefault();
    const updating = Boolean(operationRecordId);
    setSaving("operation");
    try {
      if (operationRecordId) await api.patch(`/home-care/operations/${operationType}/${operationRecordId}`, operationForm);
      else await api.post(`/home-care/operations/${operationType}`, operationForm);
      setOperationForm({ patientId: "", carePlanId: "", visitId: "", status: "ACTIVE", notes: "" });
      setOperationRecordId("");
      setModal("");
      showNotice(`${pretty(operationType)} record ${updating ? "updated" : "saved"} and audited.`);
      await load();
    } catch (error: any) {
      showNotice(error?.response?.data?.message || "Home Care record could not be saved.", "error");
    } finally { setSaving(""); }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleSidebarAction = (event: Event) => {
      const action = String((event as CustomEvent<{ action?: string }>).detail?.action || "");
      if (["dispatch", "checkin", "checkout", "visitStatus", "escalation", "operation"].includes(action)) {
        setModal(action as typeof modal);
      }
    };
    window.addEventListener("hmis:home-care-sidebar-action", handleSidebarAction);
    return () => window.removeEventListener("hmis:home-care-sidebar-action", handleSidebarAction);
  }, []);

  useLiveRefresh(load, { intervalMs: 60000 });

  const selectedPlan = useMemo(() => plans.find((row) => row.id === selectedPlanId) || plans[0] || null, [plans, selectedPlanId]);
  const selectedVisit = useMemo(() => visits.find((row) => row.id === selectedVisitId) || visits.find((row) => row.id === visitForm.visitId) || visits[0] || null, [visits, selectedVisitId, visitForm.visitId]);
  const operationalRows = useMemo(() => ["observations", "interventions", "vitals", "wounds", "followups", "transfers"].flatMap((resource) => (operational[resource] || []).map((row) => ({ ...row, resource }))).slice(0, 12), [operational]);
  const totals = dashboard?.totals || {};
  const stats = [
    { label: "Plans", value: totals.plans ?? plans.length, icon: ClipboardPlus },
    { label: "Active Plans", value: totals.activePlans ?? plans.filter((row) => row.status === "ACTIVE").length, icon: Home },
    { label: "Visits Today", value: totals.visitsToday ?? 0, icon: CalendarClock },
    { label: "In Progress", value: totals.inProgress ?? 0, icon: Navigation },
    { label: "Completed", value: totals.completed ?? 0, icon: CheckCircle2 },
    { label: "Escalations", value: totals.escalations ?? 0, icon: AlertTriangle },
  ];

  const submitPlanAction = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedPlan?.id) {
      showNotice("Select a care plan first.", "warning");
      return;
    }
    setSaving("planAction");
    try {
      if (planAction === "approve") await api.patch(`/home-care/plans/${selectedPlan.id}/approve`, { notes: planActionForm.notes });
      if (planAction === "version") await api.post(`/home-care/plans/${selectedPlan.id}/versions`, { changes: planActionForm.changes, notes: planActionForm.notes });
      if (planAction === "close") await api.patch(`/home-care/plans/${selectedPlan.id}/close`, { outcome: planActionForm.outcome, finalAssessment: planActionForm.finalAssessment, followUpPlan: planActionForm.followUpPlan });
      setModal("");
      setPlanActionForm({ notes: "", outcome: "", finalAssessment: "", followUpPlan: "", changes: "" });
      showNotice(`Care plan ${planAction === "version" ? "version created" : planAction === "approve" ? "approved" : "closed"}.`);
      await load();
    } catch (error: any) {
      showNotice(error?.response?.data?.message || "Care plan action could not be completed.", "error");
    } finally { setSaving(""); }
  };

  const submitVisitStatus = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedVisit?.id) {
      showNotice("Select a visit first.", "warning");
      return;
    }
    setSaving("visitStatus");
    try {
      await api.patch(`/home-care/visits/${selectedVisit.id}/status`, visitStatusForm);
      setModal("");
      showNotice("Visit status updated and audited.");
      await load();
    } catch (error: any) {
      showNotice(error?.response?.data?.message || "Visit status could not be updated.", "error");
    } finally { setSaving(""); }
  };

  const patientName = (row: any) =>
    [row?.patient?.firstName, row?.patient?.lastName].filter(Boolean).join(" ") ||
    row?.patient?.mrn ||
    row?.patientId ||
    "Patient";

  const patientLabel = (patient: any) => [patient?.firstName, patient?.lastName].filter(Boolean).join(" ") || patient?.patientCode || patient?.mrn || patient?.id || "Patient";

  const vitalsPayload = (form: any) => ({
    temperatureC: Number(form.temperatureC || 0),
    pulseBpm: Number(form.pulseBpm || 0),
    respiratoryRate: Number(form.respiratoryRate || 0),
    bpSystolic: Number(form.bpSystolic || 0),
    bpDiastolic: Number(form.bpDiastolic || 0),
    spo2Percent: Number(form.spo2Percent || 0),
  });

  const createPlan = async (event: FormEvent) => {
    event.preventDefault();
    setSaving("plan");
    try {
      await api.post("/home-care/plans/from-discharge", {
        ...planForm,
        serviceType: splitList(planForm.serviceType),
        medications: splitList(planForm.medications),
        goals: planForm.clinicalTargets,
      });
      setPlanForm(emptyPlan);
      setModal("");
      showNotice("Home care plan created from discharge context and submitted to coordinator.");
      await load();
    } catch (error: any) {
      showNotice(error?.response?.data?.message || "Home care plan could not be created.", "error");
    } finally {
      setSaving("");
    }
  };

  const scheduleVisit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving("schedule");
    try {
      await api.post("/home-care/visits", {
        ...scheduleForm,
        carePlanId: scheduleForm.carePlanId || selectedPlan?.id,
        nurseId: scheduleForm.nurseId || selectedPlan?.primaryNurseId,
      });
      setScheduleForm(emptySchedule);
      setModal("");
      showNotice("Home visit scheduled with address, route zone, instructions, and GPS navigation link.");
      await load();
    } catch (error: any) {
      showNotice(error?.response?.data?.message || "Visit could not be scheduled.", "error");
    } finally {
      setSaving("");
    }
  };

  const dispatchSchedule = async (event: FormEvent) => {
    event.preventDefault();
    setSaving("dispatch");
    try {
      const res = await api.post("/home-care/dispatch", {
        nurseId: dispatchForm.nurseId,
        visitDate: dispatchForm.visitDate,
        startLocation: { lat: Number(dispatchForm.startLat || 0), lng: Number(dispatchForm.startLng || 0) },
      });
      setDispatchResult(res.data || null);
      setModal("");
      showNotice("Daily route dispatched to the nurse mobile app in visit sequence.");
      await load();
    } catch (error: any) {
      showNotice(error?.response?.data?.message || "Schedule could not be dispatched.", "error");
    } finally {
      setSaving("");
    }
  };

  const checkIn = async (event: FormEvent) => {
    event.preventDefault();
    const visitId = visitForm.visitId || selectedVisit?.id;
    if (!visitId) return showNotice("Select a visit first.", "warning");
    setSaving("checkin");
    try {
      await api.patch(`/home-care/visits/${visitId}/check-in`, {
        lat: visitForm.lat,
        lng: visitForm.lng,
        arrivalTime: new Date().toISOString(),
      });
      setModal("");
      showNotice("GPS-confirmed arrival time recorded. Coordinator can see the visit in progress.");
      await load();
    } catch (error: any) {
      showNotice(error?.response?.data?.message || "Check-in failed.", "error");
    } finally {
      setSaving("");
    }
  };

  const checkOut = async (event: FormEvent) => {
    event.preventDefault();
    const visitId = visitForm.visitId || selectedVisit?.id;
    if (!visitId) return showNotice("Select a visit first.", "warning");
    setSaving("checkout");
    try {
      await api.patch(`/home-care/visits/${visitId}/check-out`, {
        ...visitForm,
        vitalSigns: vitalsPayload(visitForm),
        medicationsAdministered: splitList(visitForm.medicationsAdministered),
        checkoutTime: new Date().toISOString(),
      });
      setVisitForm(emptyVisit);
      setModal("");
      showNotice("Home visit completed and synced back to the patient HMIS record.");
      await load();
    } catch (error: any) {
      showNotice(error?.response?.data?.message || "Check-out failed.", "error");
    } finally {
      setSaving("");
    }
  };

  const escalate = async (event: FormEvent) => {
    event.preventDefault();
    setSaving("escalation");
    try {
      const res = await api.post("/home-care/escalations", {
        ...escalationForm,
        visitId: escalationForm.visitId || selectedVisit?.id,
        patientId: escalationForm.patientId || selectedVisit?.patientId,
        carePlanId: escalationForm.carePlanId || selectedVisit?.carePlanId,
        nurseId: escalationForm.nurseId || selectedVisit?.nurseId,
        vitalSigns: vitalsPayload(escalationForm),
      });
      setEscalationResult(res.data || null);
      setEscalationForm(emptyEscalation);
      setModal("");
      showNotice("Escalation sent to coordinator and supervising clinician with recommended next step.", "warning");
      await load();
    } catch (error: any) {
      showNotice(error?.response?.data?.message || "Escalation could not be sent.", "error");
    } finally {
      setSaving("");
    }
  };

  return (
    <main className="homecare-page">
      {notice ? (
        <div className={`homecare-toast ${notice.tone}`}>
          <strong>{notice.tone === "error" ? "Action blocked" : "Home Care"}</strong>
          <span>{notice.text}</span>
          <button type="button" onClick={() => setNotice(null)}><X size={14} /></button>
        </div>
      ) : null}

      <header className="homecare-header">
        <div>
          <span>Home Care</span>
          <h1>Post-Discharge Plans, Dispatch & Escalation</h1>
          <p>Activate home care from discharge, schedule nurse visits geographically, track GPS check-in/out, and escalate deterioration to the right response.</p>
        </div>
        <div className="homecare-actions">
          <button type="button" className="homecare-btn ghost" onClick={() => void load()}><RefreshCw size={16} /> Refresh</button>
          <button type="button" className="homecare-btn green" onClick={() => setModal("plan")}><ClipboardPlus size={16} /> New Plan</button>
          <button type="button" className="homecare-btn blue" onClick={() => setModal("schedule")}><CalendarClock size={16} /> Schedule</button>
        </div>
      </header>

      <section className="homecare-stats">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <article key={stat.label}>
              <Icon size={19} />
              <span>{stat.label}</span>
              <strong>{Number(stat.value || 0).toLocaleString()}</strong>
              <i>{loading ? "loading" : "live"}</i>
            </article>
          );
        })}
      </section>

      <section className="homecare-toolbar">
        <label className="homecare-search">
          <Search size={16} />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search plans, patient, service, nurse..." />
        </label>
        <button type="button" onClick={() => void load()}>Apply Search</button>
        <button type="button" disabled={!selectedPlan} onClick={() => { setPlanAction("approve"); setModal("planAction"); }}>Approve Plan</button>
        <button type="button" disabled={!selectedPlan} onClick={() => { setPlanAction("version"); setModal("planAction"); }}>New Version</button>
        <button type="button" disabled={!selectedPlan} onClick={() => { setPlanAction("close"); setModal("planAction"); }}>Close Episode</button>
      </section>
      {failedSources.length ? <div className="homecare-data-warning" role="status"><AlertTriangle size={15} /> Some data is unavailable: {failedSources.join(", ")}. Retry with Refresh.</div> : null}

      {expandedTable ? <button type="button" className="homecare-table-backdrop" aria-label="Close expanded care plan table" onClick={() => setExpandedTable(false)} /> : null}
      <section className="homecare-grid">
        <div className={`homecare-panel homecare-main homecare-table-panel${expandedTable ? " is-expanded" : ""}`}>
          <div className="homecare-title">
            <div>
              <span>Home Care Plan Creation From Discharge</span>
              <h2>Care Plans</h2>
            </div>
            <div className="homecare-table-tools">
              <b>{plans.length} plans</b>
              <button type="button" className="homecare-expand-btn" onClick={() => setExpandedTable((value) => !value)} aria-label={expandedTable ? "Collapse care plans table" : "Expand care plans table"} title={expandedTable ? "Collapse table" : "Expand table"}>
                {expandedTable ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
            </div>
          </div>
          <div className="homecare-table-wrap">
            <table className="homecare-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Services</th>
                  <th>Frequency</th>
                  <th>Nurse</th>
                  <th>Targets</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {plans.map((row) => (
                  <tr key={row.id} onClick={() => setSelectedPlanId(row.id)} className={selectedPlan?.id === row.id ? "homecare-row-selected" : ""}>
                    <td><strong>{patientName(row)}</strong><small>{row.dischargeSummaryId || "Direct home care plan"}</small></td>
                    <td><small>{(row.serviceType || []).join(", ")}</small></td>
                    <td>{pretty(row.visitFrequency)}</td>
                    <td>{row.primaryNurseId || "Coordinator pending"}</td>
                    <td><small>{row.goals}</small></td>
                    <td><span className={row.status === "ACTIVE" ? "homecare-pill green" : "homecare-pill orange"}>{pretty(row.status)}</span></td>
                  </tr>
                ))}
                {!plans.length ? <tr><td colSpan={6} className="homecare-empty">No home care plans created yet.</td></tr> : null}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="homecare-panel">
          <div className="homecare-title">
            <div>
              <span>Mobile Dispatch</span>
              <h2>Route Sequence</h2>
            </div>
            <Navigation size={18} />
          </div>
          <div className="homecare-list">
            {(dispatchResult?.sequence || []).slice(0, 6).map((row: any) => (
              <article key={row.visitId}>
                <strong>{row.sequence}. {row.patientId}</strong>
                <small>{fmtDateTime(row.scheduledDate)}</small>
                <span className="homecare-pill blue">{row.status}</span>
              </article>
            ))}
            {!dispatchResult?.sequence?.length ? <p className="homecare-empty">Dispatch a nurse route to see the mobile sequence.</p> : null}
          </div>
        </aside>
      </section>

      <section className="homecare-bottom-grid">
        <div className="homecare-panel">
          <div className="homecare-title">
            <div>
              <span>Home Visit Scheduling & Dispatch</span>
              <h2>Visits</h2>
            </div>
            <MapPin size={18} />
          </div>
          <div className="homecare-list">
            {visits.slice(0, 8).map((row) => (
              <article key={row.id} onClick={() => setSelectedVisitId(row.id)} className={selectedVisit?.id === row.id ? "homecare-row-selected" : ""}>
                <strong>{row.patientId}</strong>
                <small>{fmtDateTime(row.scheduledDate)} - nurse {row.nurseId}</small>
                <span className={row.status === "COMPLETED" ? "homecare-pill green" : row.status === "ESCALATED" ? "homecare-pill red" : "homecare-pill orange"}>{pretty(row.status)}</span>
              </article>
            ))}
            {!visits.length ? <p className="homecare-empty">No home visits scheduled yet.</p> : null}
          </div>
        </div>

        <div className="homecare-panel">
          <div className="homecare-title">
            <div>
              <span>Real-Time Coordinator View</span>
              <h2>Visit States</h2>
            </div>
            <UserCheck size={18} />
          </div>
          <div className="homecare-metrics">
            <div><span>Upcoming</span><strong>{totals.upcoming || 0}</strong></div>
            <div><span>In progress</span><strong>{totals.inProgress || 0}</strong></div>
            <div><span>Completed</span><strong>{totals.completed || 0}</strong></div>
          </div>
        </div>

        <div className="homecare-panel">
          <div className="homecare-title">
            <div>
              <span>Escalation & Emergency Response</span>
              <h2>Last Decision</h2>
            </div>
            <Ambulance size={18} />
          </div>
          <div className="homecare-result">
            <strong>{escalationResult?.decision?.level ? pretty(escalationResult.decision.level) : "No active escalation"}</strong>
            <p>{escalationResult?.decision?.nextStep || "Escalations will show the recommended next step for nurse, coordinator, and supervising clinician."}</p>
          </div>
        </div>

        <div className="homecare-panel">
          <div className="homecare-title"><div><span>Clinical continuity</span><h2>Care Records</h2></div><ClipboardPlus size={18} /></div>
          <div className="homecare-metrics">
            <div><span>Observations</span><strong>{operational.observations?.length || 0}</strong></div>
            <div><span>Interventions</span><strong>{operational.interventions?.length || 0}</strong></div>
            <div><span>Follow-ups</span><strong>{operational.followups?.length || 0}</strong></div>
          </div>
        </div>

        <div className="homecare-panel homecare-records-panel">
          <div className="homecare-title"><div><span>Audited longitudinal record</span><h2>Recent Clinical Activity</h2></div><button type="button" className="homecare-inline-button" onClick={() => { setOperationRecordId(""); setModal("operation"); }}>Add record</button></div>
          <div className="homecare-list">
            {operationalRows.map((row) => (
              <article key={`${row.resource}-${row.id}`} onClick={() => { setOperationType(row.resource); setOperationRecordId(row.id); setOperationForm({ patientId: row.patientId || "", carePlanId: row.carePlanId || "", visitId: row.visitId || "", status: row.status || "ACTIVE", notes: row.notes || "" }); setModal("operation"); }}>
                <strong>{pretty(row.resource)}</strong><small>{row.patientId || "No patient linked"} · {fmtDateTime(row.createdAt || row.recordedAt)}</small><span className="homecare-pill blue">{pretty(row.status || "RECORDED")}</span>
              </article>
            ))}
            {!operationalRows.length ? <p className="homecare-empty">No structured clinical activity has been recorded.</p> : null}
          </div>
        </div>
      </section>

      {modal === "plan" ? (
        <HomeCareModal tone="green" title="Create Home Care Plan From Discharge" onClose={() => setModal("")}>
          <form className="homecare-form" onSubmit={createPlan}>
            <Field label="Patient"><select required value={planForm.patientId} onChange={(event) => setPlanForm({ ...planForm, patientId: event.target.value })}><option value="">Select a patient</option>{patients.map((patient) => <option key={patient.id} value={patient.id}>{patientLabel(patient)}{patient.mrn ? ` · ${patient.mrn}` : ""}</option>)}</select></Field>
            <Field label="Discharge Summary ID"><input value={planForm.dischargeSummaryId} onChange={(event) => setPlanForm({ ...planForm, dischargeSummaryId: event.target.value })} /></Field>
            <Field label="Diagnoses" wide><textarea value={planForm.diagnoses} onChange={(event) => setPlanForm({ ...planForm, diagnoses: event.target.value })} /></Field>
            <Field label="Medications" wide><input value={planForm.medications} onChange={(event) => setPlanForm({ ...planForm, medications: event.target.value })} placeholder="Comma separated" /></Field>
            <Field label="Discharge Instructions" wide><textarea value={planForm.dischargeInstructions} onChange={(event) => setPlanForm({ ...planForm, dischargeInstructions: event.target.value })} /></Field>
            <Field label="Services Required"><input required value={planForm.serviceType} onChange={(event) => setPlanForm({ ...planForm, serviceType: event.target.value })} /></Field>
            <Field label="Visit Frequency"><select value={planForm.visitFrequency} onChange={(event) => setPlanForm({ ...planForm, visitFrequency: event.target.value })}><option>DAILY</option><option>ALTERNATE_DAYS</option><option>TWICE_WEEKLY</option><option>WEEKLY</option></select></Field>
            <Field label="Start Date"><input type="date" value={planForm.startDate} onChange={(event) => setPlanForm({ ...planForm, startDate: event.target.value })} /></Field>
            <Field label="Duration Days"><input type="number" min="1" value={planForm.durationDays} onChange={(event) => setPlanForm({ ...planForm, durationDays: event.target.value })} /></Field>
            <Field label="Assigned Nurse"><input value={planForm.primaryNurseId} onChange={(event) => setPlanForm({ ...planForm, primaryNurseId: event.target.value })} /></Field>
            <Field label="Family Phone"><input value={planForm.familyPhone} onChange={(event) => setPlanForm({ ...planForm, familyPhone: event.target.value })} /></Field>
            <Field label="Clinical Targets" wide><textarea required value={planForm.clinicalTargets} onChange={(event) => setPlanForm({ ...planForm, clinicalTargets: event.target.value })} placeholder="Daily wound assessment, BP twice daily, fluid intake above 1.5L..." /></Field>
            <Field label="Emergency Escalation Plan" wide><textarea value={planForm.emergencyEscalationPlan} onChange={(event) => setPlanForm({ ...planForm, emergencyEscalationPlan: event.target.value })} /></Field>
            <footer><button type="button" onClick={() => setModal("")}>Cancel</button><button disabled={saving === "plan"}>Create Plan</button></footer>
          </form>
        </HomeCareModal>
      ) : null}

      {modal === "schedule" ? (
        <HomeCareModal tone="blue" title="Schedule Home Visit" onClose={() => setModal("")}>
          <form className="homecare-form" onSubmit={scheduleVisit}>
            <Field label="Care Plan ID"><input value={scheduleForm.carePlanId || selectedPlan?.id || ""} onChange={(event) => setScheduleForm({ ...scheduleForm, carePlanId: event.target.value })} /></Field>
            <Field label="Nurse ID"><input required value={scheduleForm.nurseId || selectedPlan?.primaryNurseId || ""} onChange={(event) => setScheduleForm({ ...scheduleForm, nurseId: event.target.value })} /></Field>
            <Field label="Scheduled Date"><input type="datetime-local" value={scheduleForm.scheduledDate} onChange={(event) => setScheduleForm({ ...scheduleForm, scheduledDate: event.target.value })} /></Field>
            <Field label="Geographic Zone"><input value={scheduleForm.geographicZone} onChange={(event) => setScheduleForm({ ...scheduleForm, geographicZone: event.target.value })} /></Field>
            <Field label="Latitude"><input value={scheduleForm.lat} onChange={(event) => setScheduleForm({ ...scheduleForm, lat: event.target.value })} /></Field>
            <Field label="Longitude"><input value={scheduleForm.lng} onChange={(event) => setScheduleForm({ ...scheduleForm, lng: event.target.value })} /></Field>
            <Field label="Address" wide><textarea value={scheduleForm.address} onChange={(event) => setScheduleForm({ ...scheduleForm, address: event.target.value })} /></Field>
            <Field label="Visit Instructions" wide><textarea value={scheduleForm.instructions} onChange={(event) => setScheduleForm({ ...scheduleForm, instructions: event.target.value })} /></Field>
            <footer><button type="button" onClick={() => setModal("")}>Cancel</button><button disabled={saving === "schedule"}>Schedule Visit</button></footer>
          </form>
        </HomeCareModal>
      ) : null}

      {modal === "dispatch" ? (
        <HomeCareModal tone="blue" title="Dispatch Daily Nurse Route" onClose={() => setModal("")}>
          <form className="homecare-form" onSubmit={dispatchSchedule}>
            <Field label="Nurse ID"><input required value={dispatchForm.nurseId} onChange={(event) => setDispatchForm({ ...dispatchForm, nurseId: event.target.value })} /></Field>
            <Field label="Visit Date"><input type="date" value={dispatchForm.visitDate} onChange={(event) => setDispatchForm({ ...dispatchForm, visitDate: event.target.value })} /></Field>
            <Field label="Start Latitude"><input value={dispatchForm.startLat} onChange={(event) => setDispatchForm({ ...dispatchForm, startLat: event.target.value })} /></Field>
            <Field label="Start Longitude"><input value={dispatchForm.startLng} onChange={(event) => setDispatchForm({ ...dispatchForm, startLng: event.target.value })} /></Field>
            <footer><button type="button" onClick={() => setModal("")}>Cancel</button><button disabled={saving === "dispatch"}>Dispatch To App</button></footer>
          </form>
        </HomeCareModal>
      ) : null}

      {modal === "checkin" ? (
        <HomeCareModal tone="green" title="GPS Check In" onClose={() => setModal("")}>
          <form className="homecare-form" onSubmit={checkIn}>
            <Field label="Visit ID"><input value={visitForm.visitId || selectedVisit?.id || ""} onChange={(event) => setVisitForm({ ...visitForm, visitId: event.target.value })} /></Field>
            <Field label="Latitude"><input required value={visitForm.lat} onChange={(event) => setVisitForm({ ...visitForm, lat: event.target.value })} /></Field>
            <Field label="Longitude"><input required value={visitForm.lng} onChange={(event) => setVisitForm({ ...visitForm, lng: event.target.value })} /></Field>
            <footer><button type="button" onClick={() => setModal("")}>Cancel</button><button disabled={saving === "checkin"}>Check In</button></footer>
          </form>
        </HomeCareModal>
      ) : null}

      {modal === "checkout" ? (
        <HomeCareModal tone="green" title="Complete Home Visit" onClose={() => setModal("")}>
          <VisitClinicalForm form={visitForm} setForm={setVisitForm} selectedVisit={selectedVisit} onSubmit={checkOut} onCancel={() => setModal("")} saving={saving === "checkout"} submitLabel="Check Out" />
        </HomeCareModal>
      ) : null}

      {modal === "escalation" ? (
        <HomeCareModal tone="red" title="Escalate Patient Condition" onClose={() => setModal("")}>
          <form className="homecare-form" onSubmit={escalate}>
            <Field label="Visit ID"><input value={escalationForm.visitId || selectedVisit?.id || ""} onChange={(event) => setEscalationForm({ ...escalationForm, visitId: event.target.value })} /></Field>
            <Field label="Patient"><select value={escalationForm.patientId || selectedVisit?.patientId || ""} onChange={(event) => setEscalationForm({ ...escalationForm, patientId: event.target.value })}><option value="">Select a patient</option>{patients.map((patient) => <option key={patient.id} value={patient.id}>{patientLabel(patient)}{patient.mrn ? ` · ${patient.mrn}` : ""}</option>)}</select></Field>
            <Field label="Conscious State"><select value={escalationForm.consciousState} onChange={(event) => setEscalationForm({ ...escalationForm, consciousState: event.target.value })}><option>Alert</option><option>Voice</option><option>Pain</option><option>Unresponsive</option></select></Field>
            <Field label="SpO2"><input type="number" value={escalationForm.spo2Percent} onChange={(event) => setEscalationForm({ ...escalationForm, spo2Percent: event.target.value })} /></Field>
            <Field label="Temperature"><input type="number" value={escalationForm.temperatureC} onChange={(event) => setEscalationForm({ ...escalationForm, temperatureC: event.target.value })} /></Field>
            <Field label="Respiratory Rate"><input type="number" value={escalationForm.respiratoryRate} onChange={(event) => setEscalationForm({ ...escalationForm, respiratoryRate: event.target.value })} /></Field>
            <Field label="Reason" wide><textarea required value={escalationForm.reason} onChange={(event) => setEscalationForm({ ...escalationForm, reason: event.target.value })} placeholder="Wound infection, uncontrolled pain, fever, respiratory distress, fall..." /></Field>
            <footer><button type="button" onClick={() => setModal("")}>Cancel</button><button disabled={saving === "escalation"}>Escalate</button></footer>
          </form>
        </HomeCareModal>
      ) : null}

      {modal === "operation" ? (
        <HomeCareModal tone="blue" title="Record Home Care Activity" onClose={() => setModal("")}>
          <form className="homecare-form" onSubmit={saveOperationalRecord}>
            <Field label="Record type"><select value={operationType} onChange={(event) => setOperationType(event.target.value)}>{["referrals", "eligibility", "plan-versions", "services", "assignments", "caregivers", "caregivers-training", "safety", "observations", "interventions", "vitals", "wounds", "medications", "equipment", "supplies", "goals", "goal-progress", "followups", "transfers", "charge-events", "messages", "consent-references", "documents", "sync-batches", "sync-conflicts"].map((resource) => <option key={resource} value={resource}>{pretty(resource)}</option>)}</select></Field>
            <Field label="Status"><select value={operationForm.status} onChange={(event) => setOperationForm({ ...operationForm, status: event.target.value })}><option>ACTIVE</option><option>OPEN</option><option>PENDING</option><option>COMPLETED</option><option>ESCALATED</option><option>CANCELLED</option></select></Field>
            <Field label="Patient ID"><input value={operationForm.patientId} onChange={(event) => setOperationForm({ ...operationForm, patientId: event.target.value })} /></Field>
            <Field label="Care Plan ID"><input value={operationForm.carePlanId} onChange={(event) => setOperationForm({ ...operationForm, carePlanId: event.target.value })} /></Field>
            <Field label="Visit ID"><input value={operationForm.visitId} onChange={(event) => setOperationForm({ ...operationForm, visitId: event.target.value })} /></Field>
            <Field label="Notes" wide><textarea value={operationForm.notes} onChange={(event) => setOperationForm({ ...operationForm, notes: event.target.value })} /></Field>
            <footer><button type="button" onClick={() => setModal("")}>Cancel</button><button disabled={saving === "operation"}>{operationRecordId ? "Update record" : "Save Record"}</button></footer>
          </form>
        </HomeCareModal>
      ) : null}

      {modal === "visitStatus" ? (
        <HomeCareModal tone="blue" title={`Update Visit Status · ${selectedVisit?.patientId || "Selected visit"}`} onClose={() => setModal("")}>
          <form className="homecare-form" onSubmit={submitVisitStatus}>
            <Field label="Visit status"><select value={visitStatusForm.status} onChange={(event) => setVisitStatusForm({ ...visitStatusForm, status: event.target.value })}>{["SCHEDULED", "EN_ROUTE", "ARRIVED", "IDENTITY_VERIFIED", "IN_PROGRESS", "CARE_DELIVERED", "DOCUMENTATION_COMPLETED", "COMPLETED", "MISSED", "CANCELLED"].map((status) => <option key={status}>{status}</option>)}</select></Field>
            <Field label="Reason" wide><textarea value={visitStatusForm.reason} onChange={(event) => setVisitStatusForm({ ...visitStatusForm, reason: event.target.value })} /></Field>
            <footer><button type="button" onClick={() => setModal("")}>Cancel</button><button disabled={saving === "visitStatus"}>Update status</button></footer>
          </form>
        </HomeCareModal>
      ) : null}

      {modal === "planAction" ? (
        <HomeCareModal tone={planAction === "close" ? "red" : "blue"} title={`${planAction === "approve" ? "Approve" : planAction === "version" ? "Create Plan Version" : "Close Care Episode"} · ${selectedPlan?.patientId || "Selected plan"}`} onClose={() => setModal("")}>
          <form className="homecare-form" onSubmit={submitPlanAction}>
            {planAction === "approve" ? <Field label="Approval notes" wide><textarea value={planActionForm.notes} onChange={(event) => setPlanActionForm({ ...planActionForm, notes: event.target.value })} /></Field> : null}
            {planAction === "version" ? <><Field label="Changes in this version" wide><textarea required value={planActionForm.changes} onChange={(event) => setPlanActionForm({ ...planActionForm, changes: event.target.value })} placeholder="Updated goals, services, frequency, or safety instructions" /></Field><Field label="Version notes" wide><textarea value={planActionForm.notes} onChange={(event) => setPlanActionForm({ ...planActionForm, notes: event.target.value })} /></Field></> : null}
            {planAction === "close" ? <><Field label="Closure outcome" wide><textarea required value={planActionForm.outcome} onChange={(event) => setPlanActionForm({ ...planActionForm, outcome: event.target.value })} placeholder="Goals met, transferred, declined, or no longer clinically required" /></Field><Field label="Final assessment" wide><textarea value={planActionForm.finalAssessment} onChange={(event) => setPlanActionForm({ ...planActionForm, finalAssessment: event.target.value })} /></Field><Field label="Follow-up plan" wide><textarea value={planActionForm.followUpPlan} onChange={(event) => setPlanActionForm({ ...planActionForm, followUpPlan: event.target.value })} /></Field></> : null}
            <footer><button type="button" onClick={() => setModal("")}>Cancel</button><button disabled={saving === "planAction"}>{planAction === "approve" ? "Approve plan" : planAction === "version" ? "Save version" : "Close episode"}</button></footer>
          </form>
        </HomeCareModal>
      ) : null}
    </main>
  );
}

function VisitClinicalForm({ form, setForm, selectedVisit, onSubmit, onCancel, saving, submitLabel }: any) {
  return (
    <form className="homecare-form" onSubmit={onSubmit}>
      <Field label="Visit ID"><input value={form.visitId || selectedVisit?.id || ""} onChange={(event) => setForm({ ...form, visitId: event.target.value })} /></Field>
      <Field label="Temperature"><input type="number" value={form.temperatureC} onChange={(event) => setForm({ ...form, temperatureC: event.target.value })} /></Field>
      <Field label="Pulse"><input type="number" value={form.pulseBpm} onChange={(event) => setForm({ ...form, pulseBpm: event.target.value })} /></Field>
      <Field label="Respiratory Rate"><input type="number" value={form.respiratoryRate} onChange={(event) => setForm({ ...form, respiratoryRate: event.target.value })} /></Field>
      <Field label="BP Systolic"><input type="number" value={form.bpSystolic} onChange={(event) => setForm({ ...form, bpSystolic: event.target.value })} /></Field>
      <Field label="BP Diastolic"><input type="number" value={form.bpDiastolic} onChange={(event) => setForm({ ...form, bpDiastolic: event.target.value })} /></Field>
      <Field label="SpO2"><input type="number" value={form.spo2Percent} onChange={(event) => setForm({ ...form, spo2Percent: event.target.value })} /></Field>
      <Field label="Clinical Findings" wide><textarea value={form.clinicalFindings} onChange={(event) => setForm({ ...form, clinicalFindings: event.target.value })} /></Field>
      <Field label="Interventions" wide><textarea value={form.interventions} onChange={(event) => setForm({ ...form, interventions: event.target.value })} /></Field>
      <Field label="Medications Administered" wide><input value={form.medicationsAdministered} onChange={(event) => setForm({ ...form, medicationsAdministered: event.target.value })} /></Field>
      <Field label="Patient Concerns" wide><textarea value={form.patientConcerns} onChange={(event) => setForm({ ...form, patientConcerns: event.target.value })} /></Field>
      <label className="homecare-check"><input type="checkbox" checked={form.escalationRequired} onChange={(event) => setForm({ ...form, escalationRequired: event.target.checked })} /> Escalation required</label>
      <Field label="Escalation Reason" wide><textarea value={form.escalationReason} onChange={(event) => setForm({ ...form, escalationReason: event.target.value })} /></Field>
      <footer><button type="button" onClick={onCancel}>Cancel</button><button disabled={saving}>{submitLabel}</button></footer>
    </form>
  );
}

function Field({ label, wide, children }: { label: string; wide?: boolean; children: React.ReactNode }) {
  return <label className={wide ? "wide" : ""}>{label}{children}</label>;
}

function HomeCareModal({
  title,
  tone,
  children,
  onClose,
}: {
  title: string;
  tone: "green" | "blue" | "red";
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="homecare-modal-backdrop">
      <section className={`homecare-modal is-${tone}`}>
        <header>
          <div>
            <span>Home Care Workflow</span>
            <h2>{title}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </header>
        {children}
      </section>
    </div>
  );
}
