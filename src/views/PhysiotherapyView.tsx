import type { FormEvent, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  FileText,
  HeartPulse,
  LineChart,
  Plus,
  RefreshCw,
  Search,
  Send,
  Stethoscope,
  UserX,
  X,
} from "lucide-react";
import { api } from "../lib/api";
import { useLiveRefresh } from "../lib/liveRefresh";

const unwrapRows = (value: any): any[] => {
  const data = value?.data ?? value;
  if (Array.isArray(data)) return data;
  for (const candidate of [data?.items, data?.rows, data?.tokens, data?.results, data?.data]) {
    if (Array.isArray(candidate)) return candidate;
    if (candidate && typeof candidate === "object") {
      const nested: any[] = unwrapRows(candidate);
      if (nested.length) return nested;
    }
  }
  return [];
};
const unwrapObject = (value: any) => value?.data?.data || value?.data || value || {};
const todayValue = () => new Date().toISOString().slice(0, 10);
const nowTime = () => new Date().toTimeString().slice(0, 5);
const dateTimeValue = (date: string, time: string) => `${date}T${time || "00:00"}:00`;
const formatDateTime = (value: any) => {
  const date = new Date(String(value || ""));
  if (!Number.isFinite(date.getTime())) return "Not recorded";
  return date.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
};
const patientName = (row: any) => [row?.firstName, row?.lastName].filter(Boolean).join(" ") || row?.patientCode || row?.mrn || "Unnamed patient";
const urgencyClass = (value: any) => {
  const urgency = String(value || "ROUTINE").toUpperCase();
  if (urgency === "URGENT") return "is-danger";
  if (urgency === "SOON") return "is-warning";
  return "is-success";
};
const toneFromNotice = (notice: string) => (/failed|could not|required|urgent|insufficient|non-attendance/i.test(notice) ? "warning" : "success");

const INTERVENTIONS = [
  "Therapeutic exercises",
  "Passive ROM",
  "Resisted exercises",
  "TENS",
  "Ultrasound",
  "Interferential",
  "Hydrotherapy",
  "Chest physiotherapy",
  "Gait training",
  "Manual therapy",
  "Taping",
  "Patient/carer education",
];

export default function PhysiotherapyView() {
  const [dashboard, setDashboard] = useState<any>({});
  const [referrals, setReferrals] = useState<any[]>([]);
  const [assessments, setAssessments] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [outcomes, setOutcomes] = useState<any[]>([]);
  const [discharges, setDischarges] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedReferralId, setSelectedReferralId] = useState("");
  const [selectedAssessmentId, setSelectedAssessmentId] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState("");
  const [saving, setSaving] = useState("");
  const [notice, setNotice] = useState("");
  const [workflowPopup, setWorkflowPopup] = useState<"monitor" | "waiting" | "queue" | "">("");
  const [waitingRows, setWaitingRows] = useState<any[]>([]);
  const [workflowLoading, setWorkflowLoading] = useState(false);
  const [queuePatientId, setQueuePatientId] = useState("");
  const [waitingCheckInDate, setWaitingCheckInDate] = useState(todayValue());

  const [referralForm, setReferralForm] = useState({ patientId: "", diagnosis: "", reasonForReferral: "", relevantInvestigations: "", doctorInstructions: "", urgency: "ROUTINE" });
  const [triageForm, setTriageForm] = useState({ urgency: "SOON", dueDate: todayValue(), dueTime: nowTime(), triageNotes: "" });
  const [nonAttendanceForm, setNonAttendanceForm] = useState({ reason: "" });
  const [assessmentForm, setAssessmentForm] = useState({
    referralDiagnosis: "",
    subjective: "",
    rangeOfMotion: "",
    muscleStrengthOxford: "",
    sensation: "",
    bergBalanceScale: "",
    timedUpAndGoSeconds: "",
    gaitAnalysis: "",
    respiratoryAssessment: "",
    painScore: "",
    functionalStatus: "",
    functionalScore: "",
    physiotherapyDiagnosis: "",
    shortTermGoals: "",
    longTermGoals: "",
    treatmentPlan: "",
    sessionsPrescribed: "6",
    sessionsPerWeek: "3",
  });
  const [planForm, setPlanForm] = useState({ physiotherapyDiagnosis: "", shortTermGoals: "", longTermGoals: "", sessionsRecommended: "6", frequency: "3 per week", interventions: [] as string[] });
  const [sessionForm, setSessionForm] = useState({ sessionDate: todayValue(), sessionTime: nowTime(), sessionNumber: "1", attendanceStatus: "ATTENDED", durationMinutes: "30", vitalSigns: "", painScore: "", interventions: [] as string[], electrotherapyParameters: "", exerciseParameters: "", patientResponse: "", adverseEvents: "", progressTowardGoals: "", homeProgram: "", homeExerciseCompliance: "" });
  const [outcomeForm, setOutcomeForm] = useState({ reviewDate: todayValue(), reviewTime: nowTime(), sessionNumber: "5", painScore: "", functionalScore: "", rangeOfMotion: "", bergBalanceScale: "", timedUpAndGoSeconds: "", clinicalReasoningNote: "", planModification: "" });
  const [dischargeForm, setDischargeForm] = useState({ totalSessionsAttended: "", goalsAchieved: "", finalFunctionalScore: "", finalPainScore: "", finalMeasurements: "", residualDeficits: "", homeProgramProvided: true, equipmentProvided: "", referralRecommendations: "", dischargeReason: "COMPLETED", followUpDate: "" });

  const setToast = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice((current) => (current === message ? "" : current)), 6500);
  };

  const safeGet = async (url: string, label: string, fallback: any) => {
    try {
      return await api.get(url);
    } catch (error: any) {
      return {
        data: fallback,
        __label: label,
        __error: error?.response?.data?.message || error?.message || "Request failed",
        __status: error?.response?.status,
      };
    }
  };

  const load = async () => {
    setLoading(true);
    try {
      const [dashRes, refRes, assessmentRes, sessionRes, planRes, outcomeRes, dischargeRes, patientRes] = await Promise.all([
        safeGet("/physiotherapy/dashboard", "dashboard", {}),
        safeGet("/physiotherapy/referrals", "referrals", []),
        safeGet("/physiotherapy/assessments", "assessments", []),
        safeGet("/physiotherapy/sessions", "sessions", []),
        safeGet("/physiotherapy/plans", "treatment plans", []),
        safeGet("/physiotherapy/outcomes", "outcome reviews", []),
        safeGet("/physiotherapy/discharges", "discharges", []),
        safeGet("/patients", "patients", []),
      ]);
      const refRows = unwrapRows(refRes.data);
      const assessmentRows = unwrapRows(assessmentRes.data);
      const responses = [dashRes, refRes, assessmentRes, sessionRes, planRes, outcomeRes, dischargeRes, patientRes] as any[];
      const failed = responses.filter((response) => response.__error);
      if (failed.length) {
        setToast(`${failed.map((response) => `${response.__label}${response.__status ? ` (${response.__status})` : ""}`).join(", ")} could not be loaded. Check your connection or permissions.`);
      }
      setDashboard(unwrapObject(dashRes.data));
      setReferrals(refRows);
      setAssessments(assessmentRows);
      setSessions(unwrapRows(sessionRes.data));
      setPlans(unwrapRows(planRes.data));
      setOutcomes(unwrapRows(outcomeRes.data));
      setDischarges(unwrapRows(dischargeRes.data));
      setPatients(unwrapRows(patientRes.data));
      setSelectedReferralId((current) => refRows.some((row: any) => row.referralId === current) ? current : refRows[0]?.referralId || "");
      setSelectedAssessmentId((current) => assessmentRows.some((row: any) => row.id === current) ? current : "");
    } catch (error: any) {
      setToast(error?.response?.data?.message || "Physiotherapy data could not be loaded.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [statusFilter]);
  useLiveRefresh(load, { intervalMs: 45000 });

  useEffect(() => {
    const handleSidebarAction = (event: Event) => {
      const action = (event as CustomEvent<{ action?: string }>).detail?.action;
      if (action === "monitor-patient") setWorkflowPopup("monitor");
      if (action === "queue-patient") setWorkflowPopup("queue");
    };
    const handleWaitingList = (event: Event) => {
      const detail = (event as CustomEvent<{ moduleKey?: string }>).detail;
      if (detail?.moduleKey !== "physiotherapy") return;
      setWorkflowPopup("waiting");
      setWorkflowLoading(true);
      api.get("/opd/queue/board", { params: { departmentId: "PHYSIOTHERAPY" } })
        .then((response) => setWaitingRows(unwrapRows(response.data)))
        .catch(() => {
          setWaitingRows([]);
          setToast("Physiotherapy waiting list could not be loaded.");
        })
        .finally(() => setWorkflowLoading(false));
    };
    window.addEventListener("hmis:physiotherapy-sidebar-action", handleSidebarAction);
    window.addEventListener("hmis:open-module-waiting-list", handleWaitingList);
    return () => {
      window.removeEventListener("hmis:physiotherapy-sidebar-action", handleSidebarAction);
      window.removeEventListener("hmis:open-module-waiting-list", handleWaitingList);
    };
  }, []);

  const selectedReferral = useMemo(() => referrals.find((row) => row.referralId === selectedReferralId) || referrals[0] || null, [referrals, selectedReferralId]);
  const selectedAssessment = useMemo(() => {
    const byId = assessments.find((row) => row.id === selectedAssessmentId);
    if (byId && (!selectedReferral?.patientId || byId.patientId === selectedReferral.patientId)) return byId;
    if (selectedReferral?.assessmentId) {
      const fromReferral = assessments.find((row) => row.id === selectedReferral.assessmentId);
      if (fromReferral) return fromReferral;
    }
    if (selectedReferral?.patientId) return assessments.find((row) => row.patientId === selectedReferral.patientId) || null;
    return byId || assessments[0] || null;
  }, [assessments, selectedAssessmentId, selectedReferral]);
  const selectedSessions = sessions.filter((row) => row.assessmentId === selectedAssessment?.id);
  const selectedPlans = plans.filter((row) => row.assessmentId === selectedAssessment?.id);
  const selectedOutcomes = outcomes.filter((row) => row.assessmentId === selectedAssessment?.id);
  const selectedDischarge = discharges.find((row) => row.assessmentId === selectedAssessment?.id);

  const patientOptions = patients.map((patient) => ({
    id: patient.id,
    label: `${patientName(patient)} · ${patient.patientCode || patient.mrn || "No MRN"}`,
  }));

  const filteredReferrals = useMemo(() => {
    const q = search.trim().toLowerCase();
    return referrals.filter((row) => !q || `${row.patientName} ${row.patientCode} ${row.diagnosis} ${row.reasonForReferral} ${row.urgency} ${row.status}`.toLowerCase().includes(q));
  }, [referrals, search]);

  const totals = dashboard?.totals || {};
  const stats = [
    { label: "Incoming", value: totals.incomingReferrals || 0, color: "#2563eb", icon: Send },
    { label: "Urgent", value: totals.urgentReferrals || 0, color: "#dc2626", icon: AlertTriangle },
    { label: "Active Plans", value: totals.activePlans || 0, color: "#16a34a", icon: ClipboardList },
    { label: "Sessions", value: totals.sessionsDocumented || 0, color: "#7c3aed", icon: Activity },
    { label: "Reviews", value: totals.outcomeReviews || 0, color: "#d97706", icon: LineChart },
    { label: "Discharges", value: totals.discharges || 0, color: "#0891b2", icon: CheckCircle2 },
  ];

  const requireReferral = () => {
    if (selectedReferral?.referralId) return true;
    setToast("Select a physiotherapy referral first.");
    return false;
  };
  const requireAssessment = () => {
    if (selectedAssessment?.id) return true;
    setToast("Complete or select an initial assessment first.");
    return false;
  };
  const closeAfter = async (message: string) => {
    setToast(message);
    setModal("");
    await load();
  };
  const toggleIntervention = (source: string[], setter: (items: string[]) => void, item: string) => {
    setter(source.includes(item) ? source.filter((entry) => entry !== item) : [...source, item]);
  };

  const openAssessment = () => {
    if (!requireReferral()) return;
    setSelectedAssessmentId(selectedAssessment?.id || "");
    setAssessmentForm((current) => ({
      ...current,
      referralDiagnosis: selectedReferral?.diagnosis || "",
      physiotherapyDiagnosis: selectedReferral?.diagnosis || "",
      treatmentPlan: selectedReferral?.doctorInstructions || "",
    }));
    setModal("assessment");
  };
  const selectReferral = (row: any) => {
    setSelectedReferralId(row.referralId);
    const referralAssessment = assessments.find((assessment) => assessment.id === row.assessmentId) || assessments.find((assessment) => assessment.patientId === row.patientId);
    setSelectedAssessmentId(referralAssessment?.id || "");
  };
  const openPlan = () => {
    if (!requireAssessment()) return;
    setPlanForm((current) => ({
      ...current,
      physiotherapyDiagnosis: selectedAssessment?.assessment || "",
      shortTermGoals: selectedAssessment?.goals?.shortTerm || "",
      longTermGoals: selectedAssessment?.goals?.longTerm || "",
      sessionsRecommended: String(selectedAssessment?.sessionsPrescribed || 6),
      frequency: `${selectedAssessment?.sessionsPerWeek || 3} per week`,
    }));
    setModal("plan");
  };
  const openSession = () => {
    if (!requireAssessment()) return;
    setSessionForm((current) => ({
      ...current,
      sessionNumber: String(selectedSessions.length + 1),
      painScore: String(selectedAssessment?.painScore ?? current.painScore),
    }));
    setModal("session");
  };
  const openOutcome = () => {
    if (!requireAssessment()) return;
    setOutcomeForm((current) => ({
      ...current,
      sessionNumber: String(Math.max(selectedSessions.length, Number(current.sessionNumber) || 1)),
      painScore: String(selectedAssessment?.painScore ?? current.painScore),
      functionalScore: String(selectedAssessment?.functionalScore ?? current.functionalScore),
    }));
    setModal("outcome");
  };
  const openDischarge = () => {
    if (!requireAssessment()) return;
    if (selectedDischarge) {
      setToast("Discharge summary is already completed for this physiotherapy episode.");
      return;
    }
    setDischargeForm((current) => ({
      ...current,
      totalSessionsAttended: String(selectedSessions.filter((row) => String(row.sessionType || "").toUpperCase() === "ATTENDED").length || selectedSessions.length),
      finalPainScore: String(selectedSessions[0]?.painScore ?? selectedAssessment?.painScore ?? current.finalPainScore),
      finalFunctionalScore: String(selectedOutcomes[0]?.current?.functionalScore ?? selectedAssessment?.functionalScore ?? current.finalFunctionalScore),
    }));
    setModal("discharge");
  };

  const saveReferral = (event: FormEvent) => {
    event.preventDefault();
    setSaving("referral");
    api.post("/physiotherapy/referral", referralForm)
      .then((res) => {
        setSelectedReferralId(res.data?.referralId || "");
        setReferralForm({ patientId: "", diagnosis: "", reasonForReferral: "", relevantInvestigations: "", doctorInstructions: "", urgency: "ROUTINE" });
        return closeAfter(res.data?.notificationRequired ? "Urgent referral created and physiotherapist-on-duty notification flagged." : "Physiotherapy referral created.");
      })
      .catch((error) => setToast(error?.response?.data?.message || "Referral could not be created."))
      .finally(() => setSaving(""));
  };
  const saveTriage = (event: FormEvent) => {
    event.preventDefault();
    if (!requireReferral()) return;
    setSaving("triage");
    api.post(`/physiotherapy/referral/${selectedReferral.referralId}/triage`, { ...triageForm, dueBy: dateTimeValue(triageForm.dueDate, triageForm.dueTime) })
      .then((res) => closeAfter(res.data?.notificationRequired ? "Referral triaged as urgent and notification flagged." : "Referral triage saved."))
      .catch((error) => setToast(error?.response?.data?.message || "Triage could not be saved."))
      .finally(() => setSaving(""));
  };
  const saveNonAttendance = (event: FormEvent) => {
    event.preventDefault();
    if (!requireReferral()) return;
    setSaving("non-attendance");
    api.post(`/physiotherapy/referral/${selectedReferral.referralId}/non-attendance`, nonAttendanceForm)
      .then(() => {
        setNonAttendanceForm({ reason: "" });
        return closeAfter("Referral closed with documented non-attendance reason.");
      })
      .catch((error) => setToast(error?.response?.data?.message || "Non-attendance could not be saved."))
      .finally(() => setSaving(""));
  };
  const saveAssessment = (event: FormEvent) => {
    event.preventDefault();
    if (!requireReferral()) return;
    setSaving("assessment");
    api.post("/physiotherapy/assessment", { ...assessmentForm, patientId: selectedReferral.patientId, referralId: selectedReferral.referralId, diagnosis: selectedReferral.diagnosis })
      .then((res) => {
        setSelectedAssessmentId(res.data?.id || "");
        return closeAfter("Initial assessment saved and referral marked assessed.");
      })
      .catch((error) => setToast(error?.response?.data?.message || "Initial assessment could not be saved."))
      .finally(() => setSaving(""));
  };
  const savePlan = (event: FormEvent) => {
    event.preventDefault();
    if (!requireAssessment()) return;
    setSaving("plan");
    api.post("/physiotherapy/plan", { ...planForm, assessmentId: selectedAssessment.id })
      .then(() => closeAfter("Treatment plan saved and visible to EMR/ward teams."))
      .catch((error) => setToast(error?.response?.data?.message || "Treatment plan could not be saved."))
      .finally(() => setSaving(""));
  };
  const saveSession = (event: FormEvent) => {
    event.preventDefault();
    if (!requireAssessment()) return;
    setSaving("session");
    api.post("/physiotherapy/session", { ...sessionForm, assessmentId: selectedAssessment.id, sessionDate: dateTimeValue(sessionForm.sessionDate, sessionForm.sessionTime) })
      .then(() => {
        setSessionForm((current) => ({ ...current, sessionNumber: String(Number(current.sessionNumber || 0) + 1), patientResponse: "", adverseEvents: "", progressTowardGoals: "", homeExerciseCompliance: "" }));
        return closeAfter("Treatment session documented.");
      })
      .catch((error) => setToast(error?.response?.data?.message || "Session could not be saved."))
      .finally(() => setSaving(""));
  };
  const saveOutcome = (event: FormEvent) => {
    event.preventDefault();
    if (!requireAssessment()) return;
    setSaving("outcome");
    api.post("/physiotherapy/outcome-review", { ...outcomeForm, assessmentId: selectedAssessment.id, reviewAt: dateTimeValue(outcomeForm.reviewDate, outcomeForm.reviewTime) })
      .then((res) => closeAfter(res.data?.insufficientProgress ? "Outcome review saved with clinical reasoning note." : "Outcome review saved with baseline comparison."))
      .catch((error) => setToast(error?.response?.data?.message || "Outcome review could not be saved."))
      .finally(() => setSaving(""));
  };
  const saveDischarge = (event: FormEvent) => {
    event.preventDefault();
    if (!requireAssessment()) return;
    setSaving("discharge");
    api.post("/physiotherapy/discharge", { ...dischargeForm, assessmentId: selectedAssessment.id })
      .then(() => closeAfter(dischargeForm.followUpDate ? "Discharge summary saved and follow-up appointment request created." : "Discharge summary saved to the referring EMR view."))
      .catch((error) => setToast(error?.response?.data?.message || "Discharge summary could not be saved."))
      .finally(() => setSaving(""));
  };

  const queueSelectedPatient = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!queuePatientId) {
      setToast("Select a registered patient before adding them to the Physiotherapy queue.");
      return;
    }
    setSaving("queue-patient");
    try {
      await api.post("/opd/queue/token", {
        patientId: queuePatientId,
        departmentId: "PHYSIOTHERAPY",
        queueType: "PHYSIOTHERAPY",
        priority: "NORMAL",
      });
      setWorkflowPopup("");
      setQueuePatientId("");
      setToast("Patient added to the Physiotherapy waiting list.");
    } catch (error: any) {
      setToast(error?.response?.data?.message || "Patient could not be added to the Physiotherapy queue.");
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
      await api.patch("/opd/queue/token/status", {
        tokenNumber,
        status: checkingOut ? "COMPLETED" : "IN_SERVICE",
        checkInDate: waitingCheckInDate,
        reason: checkingOut ? "Checked out from Physiotherapy waiting list" : "Checked in from Physiotherapy waiting list",
      });
      setToast(`${row.patientName || row.patientCode || "Patient"} ${checkingOut ? "checked out from" : "checked in for"} Physiotherapy.`);
      await load();
    } catch (error: any) {
      setToast(error?.response?.data?.message || "Physiotherapy patient check-in failed.");
    } finally {
      setSaving("");
    }
  };

  return (
    <div className="nursing-view physiotherapy-view">
      <div className="pv-header">
        <div>
          <h2 className="pv-title">Physiotherapy and Rehabilitation</h2>
          <p className="pv-subtitle">Referral triage, baseline assessment, treatment planning, session notes, outcome reviews, and discharge summaries.</p>
        </div>
        <div className="nursing-header-actions">
          <button type="button" className="nursing-secondary-btn" onClick={load}><RefreshCw size={15} /> Refresh</button>
          <button type="button" className="nursing-action-btn" onClick={() => setModal("referral")}><Plus size={15} /> New Referral</button>
          <button type="button" className="nursing-action-btn is-blue" onClick={openAssessment}><Stethoscope size={15} /> Initial Assessment</button>
        </div>
      </div>

      {notice ? (
        <div className={`module-notice-toast is-${toneFromNotice(notice)}`} role="status" aria-live="polite">
          <span className="physio-notice-icon" aria-hidden="true">
            {toneFromNotice(notice) === "warning" ? <AlertTriangle size={20} /> : <CheckCircle2 size={20} />}
          </span>
          <div><strong>Physiotherapy</strong><span>{notice}</span></div>
          <button type="button" className="module-notice-close" onClick={() => setNotice("")} aria-label="Dismiss notification">×</button>
        </div>
      ) : null}

      {workflowPopup ? (
        <div className="physio-workflow-backdrop" role="presentation" onClick={() => setWorkflowPopup("")}>
          <section className="physio-workflow-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <header>
              <div>
                <span>PHYSIOTHERAPY WORKFLOW</span>
                <h2>{workflowPopup === "monitor" ? "Monitor Patient" : workflowPopup === "waiting" ? "Open Waiting List" : "Queue Patient"}</h2>
                <p>{workflowPopup === "monitor" ? "Select an active referral to open the rehabilitation workspace." : workflowPopup === "waiting" ? "Patients currently queued for Physiotherapy." : "Route a registered patient to the Physiotherapy service point."}</p>
              </div>
              <button type="button" onClick={() => setWorkflowPopup("")} aria-label="Close physiotherapy workflow popup"><X size={17} /></button>
            </header>
            <div className="physio-workflow-body">
              {workflowPopup === "monitor" ? (
                <div className="physio-workflow-list">
                  {referrals.length ? referrals.slice(0, 50).map((row) => (
                    <button type="button" key={row.referralId} onClick={() => { selectReferral(row); setWorkflowPopup(""); }}>
                      <strong>{row.patientName || "Patient"}</strong>
                      <span>{row.diagnosis || "No diagnosis"} · {row.status || "PENDING"}</span>
                    </button>
                  )) : <p className="physio-workflow-note">No physiotherapy referrals were returned.</p>}
                </div>
              ) : null}
              {workflowPopup === "waiting" ? (
                <div className="physio-workflow-list">
                  <label className="physio-workflow-date"><span>Check-in date</span><input type="date" value={waitingCheckInDate} onChange={(event) => setWaitingCheckInDate(event.target.value)} /></label>
                  {workflowLoading ? <p className="physio-workflow-note">Loading waiting list...</p> : waitingRows.length ? waitingRows.map((row, index) => (
                    <div className="physio-workflow-list-item" key={row.id || row.tokenId || row.tokenNumber || index}>
                      <button type="button" onClick={() => { const referral = referrals.find((item) => item.patientId === row.patientId); if (referral) selectReferral(referral); setWorkflowPopup(""); }}><strong>{row.patientName || row.name || row.patientCode || row.patientId || "Patient"}</strong><span>{row.tokenNumber || row.token || "-"} · {row.status || "WAITING"}{row.sourceModule || row.source ? ` · From ${row.sourceModule || row.source}` : ""}</span></button>
                      <button type="button" className="physio-workflow-checkin" disabled={saving === "check-in"} onClick={() => void checkInQueuedPatient(row)}>{saving === "check-in" ? "Updating..." : String(row.status || "").toUpperCase() === "IN_SERVICE" ? "Check Out" : "Check In"}</button>
                    </div>
                  )) : <p className="physio-workflow-note">No patients are waiting for Physiotherapy.</p>}
                </div>
              ) : null}
              {workflowPopup === "queue" ? (
                <form className="physio-workflow-form" onSubmit={queueSelectedPatient}>
                  <label><span>Registered patient</span><select value={queuePatientId} onChange={(event) => setQueuePatientId(event.target.value)} required><option value="">Select a patient</option>{patientOptions.map((patient) => <option key={patient.id} value={patient.id}>{patient.label}</option>)}</select></label>
                  <footer><button type="button" className="nursing-secondary-btn" onClick={() => setWorkflowPopup("")}>Cancel</button><button type="submit" className="nursing-action-btn" disabled={saving === "queue-patient"}>{saving === "queue-patient" ? "Queueing..." : "Queue Patient"}</button></footer>
                </form>
              ) : null}
            </div>
          </section>
        </div>
      ) : null}

      <div className="pv-stats nursing-stats-grid">
        {stats.map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="pv-stat-card physio-stat-card" style={{ borderLeftColor: color }}>
            <p className="pv-stat-label">{label}</p>
            <p className="pv-stat-value">{loading ? "..." : value}</p>
            <Icon className="physio-stat-icon" size={19} style={{ color }} />
          </div>
        ))}
      </div>

      <div className="physio-layout">
        <section className="nursing-worklist">
          <div className="pv-search-bar physio-filter-bar">
            <div className="pv-search-wrap">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input className="pv-search" placeholder="Search referral, patient, diagnosis..." value={search} onChange={(event) => setSearch(event.target.value)} />
            </div>
            <select className="nursing-filter-select" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="ALL">All referrals</option>
              <option value="PENDING">Pending</option>
              <option value="TRIAGED">Triaged</option>
              <option value="ASSESSED">Assessed</option>
              <option value="CLOSED_NON_ATTENDANCE">Non-attendance</option>
            </select>
          </div>
          <div className="pv-table-wrap">
            <table className="pv-table">
              <thead><tr><th>Patient</th><th>Diagnosis</th><th>Urgency</th><th>Status</th></tr></thead>
              <tbody>
                {loading ? <tr><td colSpan={4} className="pv-empty">Loading referrals...</td></tr> : filteredReferrals.length === 0 ? <tr><td colSpan={4} className="pv-empty">No physiotherapy referrals found.</td></tr> : filteredReferrals.map((row) => (
                  <tr key={row.referralId} className={row.referralId === selectedReferral?.referralId ? "nursing-selected-row" : ""} onClick={() => selectReferral(row)}>
                    <td className="pv-name">{row.patientName}</td>
                    <td>{row.diagnosis || "-"}</td>
                    <td><span className={`pv-badge ${urgencyClass(row.urgency)}`}>{row.urgency || "ROUTINE"}</span></td>
                    <td><span className="pv-badge">{row.status || "PENDING"}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="nursing-care-panel">
          <div className="nursing-care-header">
            <div>
              <span>Selected Referral</span>
              <strong>{selectedReferral ? `${selectedReferral.patientName} | ${selectedReferral.diagnosis || "No diagnosis"}` : "No referral selected"}</strong>
            </div>
            <span className={`pv-badge ${urgencyClass(selectedReferral?.urgency)}`}>{selectedReferral?.urgency || "ROUTINE"}</span>
          </div>
          <div className="physio-action-row">
            <button type="button" className="physio-action-btn is-info" onClick={() => requireReferral() && setModal("triage")}><ClipboardCheck size={14} /> Triage</button>
            <button type="button" className="physio-action-btn is-success" onClick={openAssessment}><Stethoscope size={14} /> Assessment</button>
            <button type="button" className="physio-action-btn is-purple" onClick={openPlan}><ClipboardList size={14} /> Treatment Plan</button>
            <button type="button" className="physio-action-btn is-blue" onClick={openSession}><Activity size={14} /> Session</button>
            <button type="button" className="physio-action-btn is-warning" onClick={openOutcome}><LineChart size={14} /> Outcome Review</button>
            <button type="button" className="physio-action-btn is-danger" onClick={() => requireReferral() && setModal("non-attendance")}><UserX size={14} /> Non-Attendance</button>
            <button type="button" className="physio-action-btn is-teal" onClick={openDischarge}><FileText size={14} /> Discharge</button>
          </div>
          <div className="physio-detail-grid">
            <PhysioInfo title="Referral Details" rows={[
              ["Reason", selectedReferral?.reasonForReferral || "-"],
              ["Investigations", selectedReferral?.relevantInvestigations || "-"],
              ["Instructions", selectedReferral?.doctorInstructions || "-"],
              ["Due", selectedReferral?.dueBy ? formatDateTime(selectedReferral.dueBy) : "-"],
            ]} />
            <PhysioInfo title="Assessment Baseline" rows={[
              ["Pain", selectedAssessment?.painScore ?? "-"],
              ["Functional score", selectedAssessment?.functionalScore ?? "-"],
              ["Sessions planned", selectedAssessment?.sessionsPrescribed ?? "-"],
              ["Per week", selectedAssessment?.sessionsPerWeek ?? "-"],
            ]} />
            <PhysioInfo title="Treatment Journey" rows={[
              ["Plans", selectedPlans.length],
              ["Sessions", selectedSessions.length],
              ["Outcome reviews", selectedOutcomes.length],
              ["Discharge", selectedDischarge ? "Completed" : "Pending"],
            ]} />
          </div>
          <div className="pv-table-wrap physio-sessions-table">
            <table className="pv-table">
              <thead><tr><th>Session</th><th>Date</th><th>Type</th><th>Pain</th><th>Progress</th></tr></thead>
              <tbody>
                {selectedSessions.length === 0 ? <tr><td colSpan={5} className="pv-empty">No sessions documented for this plan.</td></tr> : selectedSessions.slice(0, 8).map((row) => (
                  <tr key={row.id}><td>{row.sessionNumber}</td><td>{formatDateTime(row.sessionDate)}</td><td>{row.sessionType}</td><td>{row.painScore ?? "-"}</td><td>{row.functionalProgress || "-"}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {modal === "referral" ? (
        <PhysioModal tone="success" title="Create Physiotherapy Referral" subtitle="Referrals appear in the incoming queue and urgent cases flag the physiotherapist on duty." onSubmit={saveReferral} onClose={() => setModal("")} saving={saving === "referral"} saveText="Send Referral">
          <div className="physio-form-grid">
            <Field label="Patient" wide><select required value={referralForm.patientId} onChange={(e) => setReferralForm({ ...referralForm, patientId: e.target.value })}><option value="">Select patient</option>{patients.map((patient) => <option key={patient.id} value={patient.id}>{patientName(patient)} | {patient.patientCode || patient.mrn || "No MRN"}</option>)}</select></Field>
            <Field label="Diagnosis"><input required value={referralForm.diagnosis} onChange={(e) => setReferralForm({ ...referralForm, diagnosis: e.target.value })} /></Field>
            <Field label="Urgency"><select value={referralForm.urgency} onChange={(e) => setReferralForm({ ...referralForm, urgency: e.target.value })}><option>URGENT</option><option>SOON</option><option>ROUTINE</option></select></Field>
            <Field label="Reason for referral" wide><textarea required value={referralForm.reasonForReferral} onChange={(e) => setReferralForm({ ...referralForm, reasonForReferral: e.target.value })} /></Field>
            <Field label="Relevant investigations" wide><textarea value={referralForm.relevantInvestigations} onChange={(e) => setReferralForm({ ...referralForm, relevantInvestigations: e.target.value })} /></Field>
            <Field label="Doctor instructions" wide><textarea value={referralForm.doctorInstructions} onChange={(e) => setReferralForm({ ...referralForm, doctorInstructions: e.target.value })} /></Field>
          </div>
        </PhysioModal>
      ) : null}

      {modal === "triage" ? (
        <PhysioModal tone="info" title="Triage Referral" subtitle="Set urgency and expected response time: urgent, within 24 hours, or routine within 3 working days." onSubmit={saveTriage} onClose={() => setModal("")} saving={saving === "triage"} saveText="Save Triage">
          <div className="physio-form-grid">
            <Field label="Urgency"><select value={triageForm.urgency} onChange={(e) => setTriageForm({ ...triageForm, urgency: e.target.value })}><option>URGENT</option><option>SOON</option><option>ROUTINE</option></select></Field>
            <Field label="Due date"><input type="date" value={triageForm.dueDate} onChange={(e) => setTriageForm({ ...triageForm, dueDate: e.target.value })} /></Field>
            <Field label="Due time"><input type="time" value={triageForm.dueTime} onChange={(e) => setTriageForm({ ...triageForm, dueTime: e.target.value })} /></Field>
            <Field label="Triage notes" wide><textarea value={triageForm.triageNotes} onChange={(e) => setTriageForm({ ...triageForm, triageNotes: e.target.value })} /></Field>
          </div>
        </PhysioModal>
      ) : null}

      {modal === "assessment" ? (
        <PhysioModal tone="success" title="Initial Assessment" subtitle="Capture subjective history, objective measures, pain, functional score, and baseline treatment goals." onSubmit={saveAssessment} onClose={() => setModal("")} saving={saving === "assessment"} saveText="Save Assessment">
          <div className="physio-form-grid">
            <Field label="Referral diagnosis"><input required value={assessmentForm.referralDiagnosis} onChange={(e) => setAssessmentForm({ ...assessmentForm, referralDiagnosis: e.target.value })} /></Field>
            <Field label="Pain score 0-10"><input required type="number" min="0" max="10" value={assessmentForm.painScore} onChange={(e) => setAssessmentForm({ ...assessmentForm, painScore: e.target.value })} /></Field>
            <Field label="Subjective assessment" wide><textarea required value={assessmentForm.subjective} onChange={(e) => setAssessmentForm({ ...assessmentForm, subjective: e.target.value })} placeholder="Onset, location, character, aggravating/relieving factors, functional impact" /></Field>
            <Field label="Range of motion"><input value={assessmentForm.rangeOfMotion} onChange={(e) => setAssessmentForm({ ...assessmentForm, rangeOfMotion: e.target.value })} placeholder="Shoulder flexion 45 deg, knee flexion 95 deg..." /></Field>
            <Field label="Oxford strength"><input value={assessmentForm.muscleStrengthOxford} onChange={(e) => setAssessmentForm({ ...assessmentForm, muscleStrengthOxford: e.target.value })} placeholder="0-5 by muscle group" /></Field>
            <Field label="Sensation"><input value={assessmentForm.sensation} onChange={(e) => setAssessmentForm({ ...assessmentForm, sensation: e.target.value })} /></Field>
            <Field label="Berg Balance Scale"><input type="number" value={assessmentForm.bergBalanceScale} onChange={(e) => setAssessmentForm({ ...assessmentForm, bergBalanceScale: e.target.value })} /></Field>
            <Field label="Timed Up and Go seconds"><input type="number" step="0.1" value={assessmentForm.timedUpAndGoSeconds} onChange={(e) => setAssessmentForm({ ...assessmentForm, timedUpAndGoSeconds: e.target.value })} /></Field>
            <Field label="Functional score"><input type="number" value={assessmentForm.functionalScore} onChange={(e) => setAssessmentForm({ ...assessmentForm, functionalScore: e.target.value })} /></Field>
            <Field label="Gait analysis" wide><textarea value={assessmentForm.gaitAnalysis} onChange={(e) => setAssessmentForm({ ...assessmentForm, gaitAnalysis: e.target.value })} /></Field>
            <Field label="Respiratory assessment" wide><textarea value={assessmentForm.respiratoryAssessment} onChange={(e) => setAssessmentForm({ ...assessmentForm, respiratoryAssessment: e.target.value })} /></Field>
            <Field label="Functional status" wide><textarea value={assessmentForm.functionalStatus} onChange={(e) => setAssessmentForm({ ...assessmentForm, functionalStatus: e.target.value })} /></Field>
            <Field label="Physiotherapy diagnosis" wide><textarea required value={assessmentForm.physiotherapyDiagnosis} onChange={(e) => setAssessmentForm({ ...assessmentForm, physiotherapyDiagnosis: e.target.value })} /></Field>
            <Field label="Short-term goals" wide><input required value={assessmentForm.shortTermGoals} onChange={(e) => setAssessmentForm({ ...assessmentForm, shortTermGoals: e.target.value })} /></Field>
            <Field label="Long-term goals" wide><input required value={assessmentForm.longTermGoals} onChange={(e) => setAssessmentForm({ ...assessmentForm, longTermGoals: e.target.value })} /></Field>
            <Field label="Treatment plan" wide><textarea required value={assessmentForm.treatmentPlan} onChange={(e) => setAssessmentForm({ ...assessmentForm, treatmentPlan: e.target.value })} /></Field>
            <Field label="Sessions prescribed"><input type="number" value={assessmentForm.sessionsPrescribed} onChange={(e) => setAssessmentForm({ ...assessmentForm, sessionsPrescribed: e.target.value })} /></Field>
            <Field label="Sessions per week"><input type="number" value={assessmentForm.sessionsPerWeek} onChange={(e) => setAssessmentForm({ ...assessmentForm, sessionsPerWeek: e.target.value })} /></Field>
          </div>
        </PhysioModal>
      ) : null}

      {modal === "plan" ? (
        <PhysioModal tone="purple" title="Treatment Plan" subtitle="Define goals, session frequency, and standardised interventions visible to doctors and ward nurses." onSubmit={savePlan} onClose={() => setModal("")} saving={saving === "plan"} saveText="Save Plan">
          <div className="physio-form-grid">
            <Field label="Physiotherapy diagnosis" wide><textarea value={planForm.physiotherapyDiagnosis} onChange={(e) => setPlanForm({ ...planForm, physiotherapyDiagnosis: e.target.value })} /></Field>
            <Field label="Short-term goals" wide><input value={planForm.shortTermGoals} onChange={(e) => setPlanForm({ ...planForm, shortTermGoals: e.target.value })} /></Field>
            <Field label="Long-term goals" wide><input value={planForm.longTermGoals} onChange={(e) => setPlanForm({ ...planForm, longTermGoals: e.target.value })} /></Field>
            <Field label="Sessions recommended"><input type="number" value={planForm.sessionsRecommended} onChange={(e) => setPlanForm({ ...planForm, sessionsRecommended: e.target.value })} /></Field>
            <Field label="Frequency"><input value={planForm.frequency} onChange={(e) => setPlanForm({ ...planForm, frequency: e.target.value })} /></Field>
            <div className="physio-check-grid wide">{INTERVENTIONS.map((item) => <button key={item} type="button" className={planForm.interventions.includes(item) ? "active" : ""} onClick={() => toggleIntervention(planForm.interventions, (items) => setPlanForm({ ...planForm, interventions: items }), item)}>{item}</button>)}</div>
          </div>
        </PhysioModal>
      ) : null}

      {modal === "session" ? (
        <PhysioModal tone="blue" title="Session Record" subtitle="Document attendance, interventions, parameters, response, adverse events, and progress toward goals." onSubmit={saveSession} onClose={() => setModal("")} saving={saving === "session"} saveText="Save Session">
          <div className="physio-form-grid">
            <Field label="Date"><input type="date" value={sessionForm.sessionDate} onChange={(e) => setSessionForm({ ...sessionForm, sessionDate: e.target.value })} /></Field>
            <Field label="Time"><input type="time" value={sessionForm.sessionTime} onChange={(e) => setSessionForm({ ...sessionForm, sessionTime: e.target.value })} /></Field>
            <Field label="Session number"><input type="number" value={sessionForm.sessionNumber} onChange={(e) => setSessionForm({ ...sessionForm, sessionNumber: e.target.value })} /></Field>
            <Field label="Attendance"><select value={sessionForm.attendanceStatus} onChange={(e) => setSessionForm({ ...sessionForm, attendanceStatus: e.target.value })}><option>ATTENDED</option><option>DID_NOT_ATTEND</option><option>CANCELLED</option></select></Field>
            <Field label="Duration minutes"><input type="number" value={sessionForm.durationMinutes} onChange={(e) => setSessionForm({ ...sessionForm, durationMinutes: e.target.value })} /></Field>
            <Field label="Pain score"><input type="number" min="0" max="10" value={sessionForm.painScore} onChange={(e) => setSessionForm({ ...sessionForm, painScore: e.target.value })} /></Field>
            <Field label="Vital signs" wide><input value={sessionForm.vitalSigns} onChange={(e) => setSessionForm({ ...sessionForm, vitalSigns: e.target.value })} /></Field>
            <div className="physio-check-grid wide">{INTERVENTIONS.map((item) => <button key={item} type="button" className={sessionForm.interventions.includes(item) ? "active" : ""} onClick={() => toggleIntervention(sessionForm.interventions, (items) => setSessionForm({ ...sessionForm, interventions: items }), item)}>{item}</button>)}</div>
            <Field label="Electrotherapy parameters" wide><input value={sessionForm.electrotherapyParameters} onChange={(e) => setSessionForm({ ...sessionForm, electrotherapyParameters: e.target.value })} placeholder="Frequency, intensity, duration" /></Field>
            <Field label="Exercise parameters" wide><input value={sessionForm.exerciseParameters} onChange={(e) => setSessionForm({ ...sessionForm, exerciseParameters: e.target.value })} placeholder="Sets, reps, resistance" /></Field>
            <Field label="Patient response" wide><textarea value={sessionForm.patientResponse} onChange={(e) => setSessionForm({ ...sessionForm, patientResponse: e.target.value })} /></Field>
            <Field label="Adverse events" wide><input value={sessionForm.adverseEvents} onChange={(e) => setSessionForm({ ...sessionForm, adverseEvents: e.target.value })} /></Field>
            <Field label="Progress toward goals" wide><textarea value={sessionForm.progressTowardGoals} onChange={(e) => setSessionForm({ ...sessionForm, progressTowardGoals: e.target.value })} /></Field>
            <Field label="Home programme" wide><textarea value={sessionForm.homeProgram} onChange={(e) => setSessionForm({ ...sessionForm, homeProgram: e.target.value })} /></Field>
            <Field label="Home exercise compliance" wide><input value={sessionForm.homeExerciseCompliance} onChange={(e) => setSessionForm({ ...sessionForm, homeExerciseCompliance: e.target.value })} /></Field>
          </div>
        </PhysioModal>
      ) : null}

      {modal === "outcome" ? (
        <PhysioModal tone="warning" title="Outcome Measurement and Goal Review" subtitle="Repeat baseline measures and compare progress. Slow progress requires clinical reasoning." onSubmit={saveOutcome} onClose={() => setModal("")} saving={saving === "outcome"} saveText="Save Review">
          <div className="physio-form-grid">
            <Field label="Review date"><input type="date" value={outcomeForm.reviewDate} onChange={(e) => setOutcomeForm({ ...outcomeForm, reviewDate: e.target.value })} /></Field>
            <Field label="Review time"><input type="time" value={outcomeForm.reviewTime} onChange={(e) => setOutcomeForm({ ...outcomeForm, reviewTime: e.target.value })} /></Field>
            <Field label="Session number"><input type="number" value={outcomeForm.sessionNumber} onChange={(e) => setOutcomeForm({ ...outcomeForm, sessionNumber: e.target.value })} /></Field>
            <Field label="Pain score"><input type="number" value={outcomeForm.painScore} onChange={(e) => setOutcomeForm({ ...outcomeForm, painScore: e.target.value })} /></Field>
            <Field label="Functional score"><input type="number" value={outcomeForm.functionalScore} onChange={(e) => setOutcomeForm({ ...outcomeForm, functionalScore: e.target.value })} /></Field>
            <Field label="Berg Balance Scale"><input type="number" value={outcomeForm.bergBalanceScale} onChange={(e) => setOutcomeForm({ ...outcomeForm, bergBalanceScale: e.target.value })} /></Field>
            <Field label="Timed Up and Go seconds"><input type="number" value={outcomeForm.timedUpAndGoSeconds} onChange={(e) => setOutcomeForm({ ...outcomeForm, timedUpAndGoSeconds: e.target.value })} /></Field>
            <Field label="Range of motion" wide><input value={outcomeForm.rangeOfMotion} onChange={(e) => setOutcomeForm({ ...outcomeForm, rangeOfMotion: e.target.value })} /></Field>
            <Field label="Clinical reasoning note" wide><textarea value={outcomeForm.clinicalReasoningNote} onChange={(e) => setOutcomeForm({ ...outcomeForm, clinicalReasoningNote: e.target.value })} placeholder="Required if progress is below expected threshold" /></Field>
            <Field label="Plan modification" wide><textarea value={outcomeForm.planModification} onChange={(e) => setOutcomeForm({ ...outcomeForm, planModification: e.target.value })} /></Field>
          </div>
        </PhysioModal>
      ) : null}

      {modal === "non-attendance" ? (
        <PhysioModal tone="danger" title="Document Non-Attendance" subtitle="A referral can only close without assessment when a clear reason is recorded." onSubmit={saveNonAttendance} onClose={() => setModal("")} saving={saving === "non-attendance"} saveText="Close Referral">
          <div className="physio-form-grid"><Field label="Reason" wide><textarea required value={nonAttendanceForm.reason} onChange={(e) => setNonAttendanceForm({ reason: e.target.value })} /></Field></div>
        </PhysioModal>
      ) : null}

      {modal === "discharge" ? (
        <PhysioModal tone="teal" title="Discharge and Outcome Summary" subtitle="Send final physiotherapy outcomes to the referring EMR view and request follow-up appointment when needed." onSubmit={saveDischarge} onClose={() => setModal("")} saving={saving === "discharge"} saveText="Save Discharge">
          <div className="physio-form-grid">
            <Field label="Sessions attended"><input type="number" value={dischargeForm.totalSessionsAttended} onChange={(e) => setDischargeForm({ ...dischargeForm, totalSessionsAttended: e.target.value })} /></Field>
            <Field label="Final pain score"><input type="number" value={dischargeForm.finalPainScore} onChange={(e) => setDischargeForm({ ...dischargeForm, finalPainScore: e.target.value })} /></Field>
            <Field label="Final functional score"><input type="number" value={dischargeForm.finalFunctionalScore} onChange={(e) => setDischargeForm({ ...dischargeForm, finalFunctionalScore: e.target.value })} /></Field>
            <Field label="Discharge reason"><select value={dischargeForm.dischargeReason} onChange={(e) => setDischargeForm({ ...dischargeForm, dischargeReason: e.target.value })}><option>COMPLETED</option><option>REFERRED</option><option>TRANSFERRED</option><option>PATIENT_REQUEST</option></select></Field>
            <Field label="Goals achieved" wide><textarea value={dischargeForm.goalsAchieved} onChange={(e) => setDischargeForm({ ...dischargeForm, goalsAchieved: e.target.value })} /></Field>
            <Field label="Final measurements" wide><textarea value={dischargeForm.finalMeasurements} onChange={(e) => setDischargeForm({ ...dischargeForm, finalMeasurements: e.target.value })} /></Field>
            <Field label="Residual deficits" wide><textarea value={dischargeForm.residualDeficits} onChange={(e) => setDischargeForm({ ...dischargeForm, residualDeficits: e.target.value })} /></Field>
            <label className="physio-check"><input type="checkbox" checked={dischargeForm.homeProgramProvided} onChange={(e) => setDischargeForm({ ...dischargeForm, homeProgramProvided: e.target.checked })} /> Home exercise programme provided</label>
            <Field label="Equipment provided" wide><input value={dischargeForm.equipmentProvided} onChange={(e) => setDischargeForm({ ...dischargeForm, equipmentProvided: e.target.value })} /></Field>
            <Field label="Recommendations" wide><textarea value={dischargeForm.referralRecommendations} onChange={(e) => setDischargeForm({ ...dischargeForm, referralRecommendations: e.target.value })} /></Field>
            <Field label="Follow-up appointment date"><input type="date" value={dischargeForm.followUpDate} onChange={(e) => setDischargeForm({ ...dischargeForm, followUpDate: e.target.value })} /></Field>
          </div>
        </PhysioModal>
      ) : null}
    </div>
  );
}

function Field({ label, wide, children }: { label: string; wide?: boolean; children: ReactNode }) {
  return <label className={wide ? "wide" : ""}><span>{label}</span>{children}</label>;
}

function PhysioInfo({ title, rows }: { title: string; rows: Array<[string, ReactNode]> }) {
  return (
    <div className="physio-info-card">
      <h3>{title}</h3>
      {rows.map(([label, value]) => <p key={label}><span>{label}</span><strong>{value}</strong></p>)}
    </div>
  );
}

function PhysioModal({ tone = "info", title, subtitle, onClose, onSubmit, saving, saveText, children }: { tone?: "success" | "info" | "purple" | "blue" | "warning" | "danger" | "teal"; title: string; subtitle: string; onClose: () => void; onSubmit: (event: FormEvent) => void; saving: boolean; saveText: string; children: ReactNode }) {
  return (
    <div className="module-form-overlay">
      <form className={`module-form-panel modal-panel module-form-panel-physiotherapy physio-modal tone-${tone}`} onSubmit={onSubmit}>
        <div className="module-form-header">
          <div className="module-form-heading">
            <div className="module-form-icon"><HeartPulse size={21} /></div>
            <div>
              <div className="module-form-kicker">Physiotherapy & Rehabilitation</div>
              <h2 className="module-form-title">{title}</h2>
            </div>
          </div>
          <button type="button" className="module-form-close" onClick={onClose} aria-label="Close form"><X size={18} /></button>
        </div>
        <div className="module-form-intro"><p className="module-form-note">{subtitle}</p></div>
        <div className="module-form-body physio-form-body">{children}</div>
        <div className="module-form-footer">
          <button type="button" className="form-btn form-btn-cancel" onClick={onClose}>Cancel</button>
          <button type="submit" className="form-btn form-btn-primary module-form-submit" disabled={saving}><CheckCircle2 size={15} /> {saving ? "Saving..." : saveText}</button>
        </div>
      </form>
    </div>
  );
}

