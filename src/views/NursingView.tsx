import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  AlertTriangle,
  ClipboardCheck,
  ClipboardList,
  Droplets,
  Handshake,
  ListChecks,
  Pill,
  RefreshCw,
  Save,
  Search,
  ShieldAlert,
  UserCheck,
  X,
} from "lucide-react";
import { api } from "../lib/api";
import { ModuleReferenceForms } from "../components/ModuleReferenceForms";

type NursingTab = "assessment" | "vitals" | "care-plan" | "mar" | "handover" | "fluid" | "braden" | "safety";

const PRIMARY_TABS: Array<{ key: NursingTab; label: string; icon: any }> = [
  { key: "assessment", label: "Assessment", icon: ClipboardCheck },
  { key: "vitals", label: "Vitals & Escalation", icon: AlertTriangle },
  { key: "care-plan", label: "Care Plan", icon: ClipboardList },
  { key: "mar", label: "MAR", icon: Pill },
  { key: "safety", label: "Tasks & Safety", icon: ListChecks },
];

const bradenFields = [
  ["sensory", "Sensory perception"],
  ["moisture", "Moisture"],
  ["activity", "Activity"],
  ["mobility", "Mobility"],
  ["nutrition", "Nutrition"],
  ["friction", "Friction / shear"],
] as const;

const doseSlots = [
  { key: "06:00", label: "06:00" },
  { key: "12:00", label: "12:00" },
  { key: "18:00", label: "18:00" },
  { key: "22:00", label: "22:00" },
];

const emptyAssessment = {
  nursingHistory: "",
  mobilityStatus: "Assisted",
  selfCareAbility: "Needs help",
  nutritionalStatus: "Adequate",
  skinIntegrity: "Intact",
  fallRisk: "Moderate",
  psychologicalStatus: "",
};

const emptyVitals = {
  temperature: "",
  bloodPressure: "",
  pulseRate: "",
  respiratoryRate: "",
  oxygenSaturation: "",
  painScore: "",
  consciousness: "Alert",
};

const emptyCarePlan = {
  nursingDiagnosis: "",
  careGoal: "",
  intervention: "",
  evaluation: "ONGOING",
};

const emptyHandover = {
  incomingNurseName: "",
  clinicalStatus: "",
  changes: "",
  pendingTasks: "",
  concerns: "",
  equipmentIssues: "",
  acknowledged: true,
};

const emptyFluid = {
  oralIntakeMl: "",
  ivIntakeMl: "",
  bloodProductsMl: "",
  ngFeedsMl: "",
  urineOutputMl: "",
  drainOutputMl: "",
  vomitOutputMl: "",
  ngAspirateMl: "",
  insensibleLossMl: "",
  notes: "",
};

const emptyBraden = {
  sensory: 4,
  moisture: 4,
  activity: 4,
  mobility: 4,
  nutrition: 4,
  friction: 3,
};

const emptyTask = { title: "", details: "", priority: "MEDIUM", dueAt: "" };
const emptyIncident = { category: "FALL_RISK", severity: "MEDIUM", description: "", actionTaken: "" };

const patientName = (visit: any) =>
  [visit?.patient?.firstName, visit?.patient?.middleName, visit?.patient?.lastName]
    .filter(Boolean)
    .join(" ")
    .trim() || visit?.patientName || "Unknown patient";

const patientMrn = (visit: any) => visit?.patient?.patientCode || visit?.patient?.mrn || "No MRN";

const formatDateTime = (value?: string) => {
  if (!value) return "Not recorded";
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toLocaleString() : "Not recorded";
};

const numberValue = (value: string) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
};

const rowsFromResponse = (payload: any): any[] => {
  if (Array.isArray(payload)) return payload;
  const candidates = [payload?.data, payload?.items, payload?.rows, payload?.visits, payload?.patients, payload?.tokens];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
    if (candidate && typeof candidate === "object") {
      const nested = rowsFromResponse(candidate);
      if (nested.length) return nested;
    }
  }
  return [];
};

const unwrapObject = (payload: any): any => payload?.data?.data || payload?.data || payload || {};

export default function NursingView() {
  const [activeVisits, setActiveVisits] = useState<any[]>([]);
  const [dashboardSummary, setDashboardSummary] = useState<Record<string, number>>({});
  const [selectedVisit, setSelectedVisit] = useState<any>(null);
  const [patientBoard, setPatientBoard] = useState<any>(null);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [administered, setAdministered] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<NursingTab>("assessment");
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");
  const [doseSite, setDoseSite] = useState("");
  const [marStatus, setMarStatus] = useState("GIVEN");
  const [marReason, setMarReason] = useState("");
  const [prnDetails, setPrnDetails] = useState("");
  const [assessment, setAssessment] = useState(emptyAssessment);
  const [vitals, setVitals] = useState(emptyVitals);
  const [carePlan, setCarePlan] = useState(emptyCarePlan);
  const [handover, setHandover] = useState(emptyHandover);
  const [fluid, setFluid] = useState(emptyFluid);
  const [braden, setBraden] = useState(emptyBraden);
  const [task, setTask] = useState(emptyTask);
  const [incident, setIncident] = useState(emptyIncident);
  const [workflowPopup, setWorkflowPopup] = useState<"monitor" | "waiting" | "queue" | "">("");
  const [waitingRows, setWaitingRows] = useState<any[]>([]);
  const [workflowLoading, setWorkflowLoading] = useState(false);
  const [queuePatientId, setQueuePatientId] = useState("");

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 3600);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const selectedPatientId = selectedVisit?.patientId || selectedVisit?.patient?.id || "";

  const fetchActiveVisits = async () => {
    setLoading(true);
    try {
      const [visitsResult, dashboardResult] = await Promise.allSettled([
        api.get("/visits", { params: { status: "OPEN", limit: 500 } }),
        api.get("/nursing-notes/dashboard"),
      ]);
      const rows = visitsResult.status === "fulfilled" ? rowsFromResponse(visitsResult.value.data) : [];
      const dashboard = dashboardResult.status === "fulfilled" ? unwrapObject(dashboardResult.value.data) : {};
      setActiveVisits(rows);
      setDashboardSummary(dashboard?.summary || {});
      setSelectedVisit((current: any) => {
        if (current && rows.some((row: any) => row.id === current.id)) return current;
        return rows[0] || null;
      });
      if (visitsResult.status === "rejected" || dashboardResult.status === "rejected") {
        setNotice("Some Nursing data could not be refreshed. Existing records remain available.");
      }
    } catch {
      setActiveVisits([]);
      setDashboardSummary({});
      setNotice("Nursing worklist could not be loaded.");
    } finally {
      setLoading(false);
    }
  };

  const fetchSelectedPatientData = async () => {
    if (!selectedVisit?.id) return;
    try {
      const [boardRes, prescriptionRes, medAdminRes] = await Promise.all([
        selectedPatientId
          ? api.get(`/nursing-notes/patient/${selectedPatientId}/board`).catch(() => ({ data: null }))
          : Promise.resolve({ data: null }),
        api.get(`/prescriptions/visit/${selectedVisit.id}`).catch(() => ({ data: [] })),
        api.get(`/medication-administration/visit/${selectedVisit.id}`).catch(() => ({ data: [] })),
      ]);
      setPatientBoard(unwrapObject(boardRes.data));
      setPrescriptions(rowsFromResponse(prescriptionRes.data));
      setAdministered(rowsFromResponse(medAdminRes.data));
    } catch {
      setPatientBoard(null);
      setPrescriptions([]);
      setAdministered([]);
    }
  };

  useEffect(() => {
    void fetchActiveVisits();
  }, []);

  useEffect(() => {
    void fetchSelectedPatientData();
  }, [selectedVisit?.id, selectedPatientId]);

  useEffect(() => {
    const handleSidebarAction = (event: Event) => {
      const action = (event as CustomEvent<{ action?: string }>).detail?.action;
      if (action === "handover" || action === "fluid" || action === "braden") {
        setActiveTab(action);
      }
      if (action === "monitor-patient") setWorkflowPopup("monitor");
      if (action === "queue-patient") setWorkflowPopup("queue");
    };
    window.addEventListener("hmis:nursing-sidebar-action", handleSidebarAction);
    const handleWaitingList = (event: Event) => {
      const detail = (event as CustomEvent<{ moduleKey?: string }>).detail;
      if (detail?.moduleKey !== "nursing") return;
      setWorkflowPopup("waiting");
      setWorkflowLoading(true);
      api.get("/queue/board", { params: { departmentId: "NURSING" } })
        .then((response) => setWaitingRows(rowsFromResponse(response.data)))
        .catch(() => {
          setWaitingRows([]);
          setNotice("Nursing waiting list could not be loaded.");
        })
        .finally(() => setWorkflowLoading(false));
    };
    window.addEventListener("hmis:open-module-waiting-list", handleWaitingList);
    return () => {
      window.removeEventListener("hmis:nursing-sidebar-action", handleSidebarAction);
      window.removeEventListener("hmis:open-module-waiting-list", handleWaitingList);
    };
  }, []);

  const filteredVisits = activeVisits.filter((visit) =>
    `${patientName(visit)} ${patientMrn(visit)} ${visit?.visitType || ""} ${visit?.status || ""}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  const statValue = (key: string, fallback = 0) => {
    const value = Number(dashboardSummary[key]);
    return Number.isFinite(value) ? value : fallback;
  };

  const bradenTotal = useMemo(
    () => Object.values(braden).reduce((sum, value) => sum + Number(value || 0), 0),
    [braden],
  );
  const bradenRisk = bradenTotal <= 12 ? "HIGH" : bradenTotal < 18 ? "AT RISK" : "LOW";
  const fluidInput =
    numberValue(fluid.oralIntakeMl) +
    numberValue(fluid.ivIntakeMl) +
    numberValue(fluid.bloodProductsMl) +
    numberValue(fluid.ngFeedsMl);
  const fluidOutput =
    numberValue(fluid.urineOutputMl) +
    numberValue(fluid.drainOutputMl) +
    numberValue(fluid.vomitOutputMl) +
    numberValue(fluid.ngAspirateMl) +
    numberValue(fluid.insensibleLossMl);
  const fluidBalance = fluidInput - fluidOutput;

  const nursingStats = [
    { label: "Active Patients", value: statValue("assignedPatients", activeVisits.length), color: "#1e3a8a" },
    { label: "Pending Medication", value: statValue("pendingMedicationCount", prescriptions.length), color: "#f59e0b" },
    { label: "Care Plans", value: patientBoard?.carePlans?.length || 0, color: "#16a34a" },
    { label: "Fluid Balance", value: `${fluidBalance} ml`, color: fluidBalance < 0 ? "#dc2626" : "#0d9488" },
    { label: "Braden Risk", value: bradenRisk, color: bradenTotal < 18 ? "#dc2626" : "#16a34a" },
    { label: "Handovers", value: statValue("recentHandoverCount", patientBoard?.handovers?.length || 0), color: "#7c3aed" },
    { label: "Tasks Overdue", value: statValue("overdueTaskCount"), color: "#b45309" },
    { label: "Safety Incidents", value: statValue("unresolvedIncidentCount", patientBoard?.incidents?.length || 0), color: "#991b1b" },
  ];

  const refreshAll = async () => {
    await fetchActiveVisits();
    await fetchSelectedPatientData();
  };

  const requireVisit = () => {
    if (!selectedVisit?.id) {
      setNotice("Select a patient before recording nursing care.");
      return false;
    }
    return true;
  };

  const queueSelectedPatient = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!queuePatientId) {
      setNotice("Select a registered patient before adding them to the Nursing queue.");
      return;
    }
    setSaving("queue-patient");
    try {
      await api.post("/queue/token", { patientId: queuePatientId, departmentId: "NURSING", queueType: "NURSING", priority: "NORMAL" });
      setWorkflowPopup("");
      setQueuePatientId("");
      setNotice("Patient added to the Nursing waiting list.");
    } catch (error: any) {
      setNotice(error?.response?.data?.message || "Patient could not be queued.");
    } finally {
      setSaving("");
    }
  };

  const saveVitals = async () => {
    if (!requireVisit()) return;
    if (!vitals.temperature && !vitals.bloodPressure && !vitals.pulseRate && !vitals.oxygenSaturation) {
      setNotice("Record at least temperature, blood pressure, pulse, or oxygen saturation.");
      return;
    }
    setSaving("vitals");
    try {
      const response = await api.post("/nursing-notes/entry", {
        visitId: selectedVisit.id,
        patientId: selectedPatientId,
        note: `Nursing observations recorded. Consciousness: ${vitals.consciousness}.`,
        painScore: vitals.painScore,
        vitals: {
          temperature: vitals.temperature,
          bloodPressure: vitals.bloodPressure,
          pulseRate: vitals.pulseRate,
          respiratoryRate: vitals.respiratoryRate,
          oxygenSaturation: vitals.oxygenSaturation,
        },
      });
      const abnormal = Array.isArray(response.data?.abnormalFlags) ? response.data.abnormalFlags : [];
      setNotice(abnormal.length ? `Vitals saved. Escalation required: ${abnormal.join(", ")}.` : "Vitals saved and added to the patient record.");
      setVitals(emptyVitals);
      await refreshAll();
    } catch (error: any) {
      setNotice(error?.response?.data?.message || "Vitals could not be saved.");
    } finally {
      setSaving("");
    }
  };

  const saveTask = async () => {
    if (!requireVisit()) return;
    if (!task.title.trim() || !task.details.trim()) {
      setNotice("Enter a task title and task details.");
      return;
    }
    setSaving("task");
    try {
      await api.post("/nursing-notes/task", {
        patientId: selectedPatientId,
        visitId: selectedVisit.id,
        title: task.title,
        details: task.details,
        priority: task.priority,
        dueAt: task.dueAt ? new Date(task.dueAt).toISOString() : undefined,
      });
      setTask(emptyTask);
      setNotice("Nursing task created and added to the worklist.");
      await refreshAll();
    } catch (error: any) {
      setNotice(error?.response?.data?.message || "Nursing task could not be created.");
    } finally {
      setSaving("");
    }
  };

  const saveIncident = async () => {
    if (!requireVisit()) return;
    if (!incident.description.trim()) {
      setNotice("Describe the safety incident before saving.");
      return;
    }
    setSaving("incident");
    try {
      await api.post("/nursing-notes/incident", {
        patientId: selectedPatientId,
        visitId: selectedVisit.id,
        category: incident.category,
        severity: incident.severity,
        description: incident.description,
        actionTaken: incident.actionTaken,
      });
      setIncident(emptyIncident);
      setNotice("Safety incident recorded and routed for review.");
      await refreshAll();
    } catch (error: any) {
      setNotice(error?.response?.data?.message || "Safety incident could not be recorded.");
    } finally {
      setSaving("");
    }
  };

  const patientOptions = activeVisits.map((visit) => ({
    id: visit?.patientId || visit?.patient?.id,
    label: `${patientName(visit)} · ${patientMrn(visit)}`,
  })).filter((patient) => patient.id);

  const saveAssessment = async () => {
    if (!requireVisit()) return;
    if (!assessment.nursingHistory.trim()) return setNotice("Enter the nursing assessment history before saving.");
    setSaving("assessment");
    try {
      await api.post("/nursing-notes/entry", {
        visitId: selectedVisit.id,
        patientId: selectedPatientId,
        note: [
          `Nursing assessment: ${assessment.nursingHistory}`,
          `Mobility: ${assessment.mobilityStatus}`,
          `Self-care: ${assessment.selfCareAbility}`,
          `Nutrition: ${assessment.nutritionalStatus}`,
          `Skin: ${assessment.skinIntegrity}`,
          `Fall risk: ${assessment.fallRisk}`,
          assessment.psychologicalStatus ? `Psychological status: ${assessment.psychologicalStatus}` : "",
        ].filter(Boolean).join("\n"),
        nursingDiagnosis: `Functional status ${assessment.selfCareAbility}; mobility ${assessment.mobilityStatus}; skin ${assessment.skinIntegrity}`,
        careGoal: "Baseline nursing needs documented and monitored each shift.",
        intervention: "Use assessment findings to update the nursing care plan.",
        taskTitle: "Review nursing assessment",
        taskDetails: "Review functional ability, skin integrity, nutrition, mobility, fall risk, and psychological status.",
      });
      setNotice("Nursing assessment saved and baseline care plan updated.");
      setAssessment(emptyAssessment);
      await refreshAll();
    } catch (error: any) {
      setNotice(error?.response?.data?.message || "Nursing assessment could not be saved.");
    } finally {
      setSaving("");
    }
  };

  const saveCarePlan = async () => {
    if (!requireVisit()) return;
    if (!carePlan.nursingDiagnosis.trim() || !carePlan.intervention.trim()) {
      return setNotice("Enter the nursing problem and planned intervention.");
    }
    setSaving("care-plan");
    try {
      await api.post("/nursing-notes/entry", {
        visitId: selectedVisit.id,
        patientId: selectedPatientId,
        note: `Care plan updated: ${carePlan.nursingDiagnosis}`,
        nursingDiagnosis: carePlan.nursingDiagnosis,
        careGoal: carePlan.careGoal,
        intervention: carePlan.intervention,
        evaluation: carePlan.evaluation,
        taskTitle: "Care plan review due",
        taskDetails: `Review care plan in 24 hours: ${carePlan.nursingDiagnosis}`,
      });
      setNotice("Care plan saved. Review task added for continuity across shifts.");
      setCarePlan(emptyCarePlan);
      await refreshAll();
    } catch (error: any) {
      setNotice(error?.response?.data?.message || "Care plan could not be saved.");
    } finally {
      setSaving("");
    }
  };

  const administerDose = async (prescription: any, slot: string) => {
    if (!requireVisit()) return;
    if (marStatus !== "GIVEN" && !marReason.trim()) {
      setNotice("A reason is required when a medication is not given.");
      return;
    }
    setSaving(`${prescription.id}-${slot}`);
    try {
      await api.post("/medication-administration", {
        visitId: selectedVisit.id,
        prescriptionId: prescription.id,
        notes: [
          `Status: ${marStatus}`,
          `Scheduled: ${slot}`,
          `Actual: ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
          doseSite ? `Site: ${doseSite}` : "",
          marReason ? `Reason: ${marReason}` : "",
          prnDetails ? `PRN indication/reassessment: ${prnDetails}` : "",
        ].filter(Boolean).join(" | "),
      });
      setDoseSite("");
      setMarReason("");
      setPrnDetails("");
      setNotice(`${prescription.drugName || prescription.medication || "Medication"} recorded as given.`);
      await refreshAll();
    } catch (error: any) {
      setNotice(error?.response?.data?.message || "Medication administration could not be recorded.");
    } finally {
      setSaving("");
    }
  };

  const saveHandover = async () => {
    if (!requireVisit()) return;
    if (!handover.incomingNurseName.trim()) return setNotice("Enter the incoming nurse name.");
    setSaving("handover");
    try {
      await api.post("/nursing-notes/shift-handover", {
        visitId: selectedVisit.id,
        patientId: selectedPatientId,
        nurseName: handover.incomingNurseName,
        pendingTasks: handover.pendingTasks,
        criticalPatients: handover.concerns,
        vitalsTrends: handover.changes,
        notes: [
          `Clinical status: ${handover.clinicalStatus}`,
          `Equipment/medication issues: ${handover.equipmentIssues || "None"}`,
          `Incoming nurse acknowledged: ${handover.acknowledged ? "Yes" : "No"}`,
        ].join("\n"),
        acknowledged: handover.acknowledged,
      });
      setNotice("Shift handover saved and digitally acknowledged.");
      setHandover(emptyHandover);
      await refreshAll();
    } catch (error: any) {
      setNotice(error?.response?.data?.message || "Shift handover could not be saved.");
    } finally {
      setSaving("");
    }
  };

  const saveFluidBalance = async () => {
    if (!requireVisit()) return;
    setSaving("fluid");
    try {
      await api.post("/nursing-notes/entry", {
        visitId: selectedVisit.id,
        patientId: selectedPatientId,
        note: `Fluid balance recorded. Input ${fluidInput} ml, output ${fluidOutput} ml, balance ${fluidBalance} ml.`,
        oralIntakeMl: fluid.oralIntakeMl,
        ivIntakeMl: fluid.ivIntakeMl,
        urineOutputMl: fluid.urineOutputMl,
        drainOutputMl: fluid.drainOutputMl,
        vomitOutputMl: fluid.vomitOutputMl,
        intakeOutputNotes: [
          fluid.notes,
          `Blood products: ${fluid.bloodProductsMl || 0} ml`,
          `NG feeds: ${fluid.ngFeedsMl || 0} ml`,
          `NG aspirate: ${fluid.ngAspirateMl || 0} ml`,
          `Insensible losses: ${fluid.insensibleLossMl || 0} ml`,
          `Running balance: ${fluidBalance} ml`,
        ].filter(Boolean).join(" | "),
      });
      setNotice(`Fluid balance saved. Current calculated balance: ${fluidBalance} ml.`);
      setFluid(emptyFluid);
      await refreshAll();
    } catch (error: any) {
      setNotice(error?.response?.data?.message || "Fluid balance could not be saved.");
    } finally {
      setSaving("");
    }
  };

  const saveBraden = async () => {
    if (!requireVisit()) return;
    setSaving("braden");
    try {
      await api.post("/module-actions", {
        module: "nursing",
        formName: "Pressure Injury Braden Scale Form",
        action: "Pressure Injury Braden Scale Form",
        data: {
          patientId: selectedPatientId,
          visitId: selectedVisit.id,
          patient: `${patientName(selectedVisit)} | ${patientMrn(selectedVisit)}`,
          sensory_perception: braden.sensory,
          moisture: braden.moisture,
          activity: braden.activity,
          mobility: braden.mobility,
          nutrition: braden.nutrition,
          friction_shear: braden.friction,
          total_score: bradenTotal,
          risk_level: bradenRisk,
          assessment_time: new Date().toISOString(),
        },
      });
      await api.post("/nursing-notes/entry", {
        visitId: selectedVisit.id,
        patientId: selectedPatientId,
        note: `Braden Scale score ${bradenTotal}/23. Risk level: ${bradenRisk}.`,
        nursingDiagnosis: bradenTotal < 18 ? "Pressure injury risk" : "",
        careGoal: bradenTotal < 18 ? "Prevent pressure injury during admission." : "",
        intervention:
          bradenTotal < 18
            ? "Reposition every 2 hours, heel offloading, pressure-relieving mattress request, nutrition referral."
            : "",
        taskTitle: bradenTotal < 18 ? "Pressure injury prevention bundle" : "",
        taskDetails:
          bradenTotal < 18
            ? "High-risk Braden score. Turning chart, heel offloading, mattress request, and nutrition review required."
            : "",
      });
      setNotice(
        bradenTotal < 18
          ? "Braden assessment saved. Prevention bundle and care plan activated."
          : "Braden assessment saved.",
      );
      await refreshAll();
    } catch (error: any) {
      setNotice(error?.response?.data?.message || "Braden assessment could not be saved.");
    } finally {
      setSaving("");
    }
  };

  const doseStatus = (prescription: any, slot: string) => {
    const given = administered.find((row) => row.prescriptionId === prescription.id && String(row.notes || "").includes(slot));
    if (given) return "given";
    const [hour, minute] = slot.split(":").map(Number);
    const due = new Date();
    due.setHours(hour, minute || 0, 0, 0);
    return Date.now() > due.getTime() ? "missed" : "due";
  };

  return (
    <div className="nursing-view nursing-qa-view">
      <div className="pv-header">
        <div>
          <h1 className="pv-title">Nursing Station</h1>
          <p className="pv-subtitle">Assessment, care planning, MAR, handover, fluid balance, and Braden risk monitoring.</p>
        </div>
        <div className="nursing-header-actions">
          <button type="button" className="nursing-secondary-btn" onClick={refreshAll}>
            <RefreshCw size={15} /> Refresh
          </button>
          <ModuleReferenceForms
            moduleKey="nursing"
            moduleTitle="Nursing Station"
            onSaved={refreshAll}
            excludeFormNames={[
              "Nursing Handover Form",
              "Fluid Balance Chart",
              "Pressure Injury Braden Scale Form",
            ]}
          />
        </div>
      </div>

      {notice ? (
        <div className={`module-notice-toast is-${notice.toLowerCase().includes("could not") || notice.toLowerCase().includes("enter") ? "warning" : "success"}`}>
          <div><strong>Nursing</strong><span>{notice}</span></div>
          <button type="button" className="module-notice-close" onClick={() => setNotice("")}>x</button>
        </div>
      ) : null}

      {workflowPopup ? (
        <div className="nursing-workflow-backdrop" role="presentation" onClick={() => setWorkflowPopup("")}>
          <section className="nursing-workflow-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <header>
              <div><span>NURSING WORKFLOW</span><h2>{workflowPopup === "monitor" ? "Monitor Patient" : workflowPopup === "waiting" ? "Open Waiting List" : "Queue Patient"}</h2>
                <p>{workflowPopup === "monitor" ? "Select a patient to open the nursing worklist." : workflowPopup === "waiting" ? "Patients currently queued to the Nursing service point." : "Route a registered patient to the Nursing queue."}</p></div>
              <button type="button" onClick={() => setWorkflowPopup("")} aria-label="Close workflow popup"><X size={17} /></button>
            </header>
            <div className="nursing-workflow-body">
              {workflowPopup === "monitor" ? (
                <div className="nursing-workflow-list">{patientOptions.length ? patientOptions.slice(0, 50).map((patient) => (
                  <button type="button" key={patient.id} onClick={() => { const visit = activeVisits.find((row) => (row?.patientId || row?.patient?.id) === patient.id); if (visit) setSelectedVisit(visit); setWorkflowPopup(""); }}><strong>{patient.label.split(" · ")[0]}</strong><span>{patient.label.split(" · ")[1]}</span></button>
                )) : <p className="nursing-workflow-note">No active patients were returned.</p>}</div>
              ) : null}
              {workflowPopup === "waiting" ? (
                <div className="nursing-workflow-list">{workflowLoading ? <p className="nursing-workflow-note">Loading waiting list...</p> : waitingRows.length ? waitingRows.map((row, index) => <div key={row.id || row.tokenId || row.tokenNumber || index}><strong>{row.patientName || row.name || row.patientCode || row.patientId || "Patient"}</strong><span>{row.tokenNumber || "-"} · {row.status || "WAITING"}</span></div>) : <p className="nursing-workflow-note">No patients are waiting for Nursing.</p>}</div>
              ) : null}
              {workflowPopup === "queue" ? (
                <form className="nursing-workflow-form" onSubmit={queueSelectedPatient}><label><span>Registered patient</span><select value={queuePatientId} onChange={(event) => setQueuePatientId(event.target.value)} required><option value="">Select a patient</option>{patientOptions.map((patient) => <option key={patient.id} value={patient.id}>{patient.label}</option>)}</select></label><footer><button type="button" className="nursing-secondary-btn" onClick={() => setWorkflowPopup("")}>Cancel</button><button type="submit" className="nursing-action-btn" disabled={saving === "queue-patient"}>{saving === "queue-patient" ? "Queueing..." : "Queue Patient"}</button></footer></form>
              ) : null}
            </div>
          </section>
        </div>
      ) : null}

      <div className="pv-stats nursing-stats-grid">
        {nursingStats.map((stat) => (
          <div key={stat.label} className="pv-stat-card" style={{ borderLeftColor: stat.color }}>
            <p className="pv-stat-label">{stat.label}</p>
            <p className="pv-stat-value">{loading ? "..." : stat.value}</p>
          </div>
        ))}
      </div>

      <div className="nursing-layout nursing-qa-layout">
        <section className="nursing-worklist">
          <div className="pv-search-bar">
            <div className="pv-search-wrap">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input className="pv-search" placeholder="Search patient, MRN, visit type..." value={search} onChange={(event) => setSearch(event.target.value)} />
            </div>
          </div>

          <div className="pv-table-wrap">
            <table className="pv-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>MRN</th>
                  <th>Visit</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={4} className="pv-empty">Loading nursing worklist...</td></tr>
                ) : filteredVisits.length === 0 ? (
                  <tr><td colSpan={4} className="pv-empty">No active patients found.</td></tr>
                ) : (
                  filteredVisits.map((visit) => (
                    <tr
                      key={visit.id}
                      className={selectedVisit?.id === visit.id ? "nursing-selected-row" : ""}
                      onClick={() => setSelectedVisit(visit)}
                    >
                      <td className="pv-name">{patientName(visit)}</td>
                      <td>{patientMrn(visit)}</td>
                      <td>{visit.visitType || "OPD"}</td>
                      <td><span className="pv-badge">{visit.status || "OPEN"}</span></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {selectedVisit ? (
            <div className="nursing-patient-snapshot">
              <strong>{patientName(selectedVisit)}</strong>
              <span>{patientMrn(selectedVisit)} | {selectedVisit.patient?.gender || "Gender N/A"} | DOB {selectedVisit.patient?.dateOfBirth ? new Date(selectedVisit.patient.dateOfBirth).toLocaleDateString() : "N/A"}</span>
              <small>Recent notes: {patientBoard?.visits?.[0]?.nursingNotes?.length || 0} | Active tasks: {patientBoard?.tasks?.filter((task: any) => String(task.status || "").toUpperCase() !== "DONE").length || 0}</small>
            </div>
          ) : null}
        </section>

        <section className="nursing-care-panel">
          <div className="nursing-care-header">
            <div>
              <span>Selected Patient</span>
              <strong>{selectedVisit ? `${patientName(selectedVisit)} | ${patientMrn(selectedVisit)}` : "No patient selected"}</strong>
            </div>
            <span className="pv-badge">{selectedVisit?.visitType || "Nursing"}</span>
          </div>

          <div className="nursing-tabs">
            {PRIMARY_TABS.map(({ key, label, icon: Icon }) => (
              <button key={key} type="button" className={activeTab === key ? "active" : ""} onClick={() => setActiveTab(key)}>
                <Icon size={15} /> {label}
              </button>
            ))}
          </div>

          <div className="nursing-workspace">
            {activeTab === "assessment" ? (
              <div className="nursing-clinical-card nursing-assessment-card">
                <div className="nursing-assessment-heading">
                  <h3 className="form-title"><ClipboardCheck size={18} /> Nursing Assessment</h3>
                  <p>Record the patient’s baseline functional, nutritional, skin, mobility, and psychosocial needs.</p>
                </div>
                <div className="nursing-form-grid">
                  <label className="wide"><span>Nursing history</span><textarea value={assessment.nursingHistory} onChange={(e) => setAssessment({ ...assessment, nursingHistory: e.target.value })} placeholder="Functional ability, hygiene, nutrition, elimination, mobility..." /></label>
                  <label><span>Mobility</span><select value={assessment.mobilityStatus} onChange={(e) => setAssessment({ ...assessment, mobilityStatus: e.target.value })}><option>Independent</option><option>Assisted</option><option>Dependent</option><option>Bedbound</option></select></label>
                  <label><span>Self-care</span><select value={assessment.selfCareAbility} onChange={(e) => setAssessment({ ...assessment, selfCareAbility: e.target.value })}><option>Independent</option><option>Needs help</option><option>Fully dependent</option></select></label>
                  <label><span>Nutrition</span><select value={assessment.nutritionalStatus} onChange={(e) => setAssessment({ ...assessment, nutritionalStatus: e.target.value })}><option>Adequate</option><option>At risk</option><option>Malnourished</option></select></label>
                  <label><span>Skin integrity</span><select value={assessment.skinIntegrity} onChange={(e) => setAssessment({ ...assessment, skinIntegrity: e.target.value })}><option>Intact</option><option>Redness</option><option>Wound</option><option>Pressure injury</option></select></label>
                  <label><span>Fall risk</span><select value={assessment.fallRisk} onChange={(e) => setAssessment({ ...assessment, fallRisk: e.target.value })}><option>Low</option><option>Moderate</option><option>High</option></select></label>
                  <label><span>Psychological status</span><input value={assessment.psychologicalStatus} onChange={(e) => setAssessment({ ...assessment, psychologicalStatus: e.target.value })} placeholder="Mood, anxiety, orientation" /></label>
                </div>
                <div className="nursing-card-actions"><button className="nursing-action-btn" type="button" onClick={saveAssessment} disabled={saving === "assessment"}><Save size={15} /> {saving === "assessment" ? "Saving..." : "Save Assessment"}</button></div>
              </div>
            ) : null}

            {activeTab === "vitals" ? (
              <div className="nursing-clinical-card">
                <h3 className="form-title"><AlertTriangle size={18} /> Vital Signs & Early Warning</h3>
                <p className="nursing-form-help">Abnormal observations are flagged for escalation and retained with the nursing note.</p>
                <div className="nursing-form-grid">
                  <label><span>Temperature °C</span><input type="number" step="0.1" value={vitals.temperature} onChange={(e) => setVitals({ ...vitals, temperature: e.target.value })} placeholder="36.8" /></label>
                  <label><span>Blood pressure</span><input value={vitals.bloodPressure} onChange={(e) => setVitals({ ...vitals, bloodPressure: e.target.value })} placeholder="120/80" /></label>
                  <label><span>Pulse / heart rate</span><input type="number" value={vitals.pulseRate} onChange={(e) => setVitals({ ...vitals, pulseRate: e.target.value })} /></label>
                  <label><span>Respiratory rate</span><input type="number" value={vitals.respiratoryRate} onChange={(e) => setVitals({ ...vitals, respiratoryRate: e.target.value })} /></label>
                  <label><span>Oxygen saturation %</span><input type="number" min="0" max="100" value={vitals.oxygenSaturation} onChange={(e) => setVitals({ ...vitals, oxygenSaturation: e.target.value })} /></label>
                  <label><span>Pain score (0–10)</span><input type="number" min="0" max="10" value={vitals.painScore} onChange={(e) => setVitals({ ...vitals, painScore: e.target.value })} /></label>
                  <label><span>Consciousness</span><select value={vitals.consciousness} onChange={(e) => setVitals({ ...vitals, consciousness: e.target.value })}><option>Alert</option><option>Confused</option><option>Drowsy</option><option>Unresponsive</option></select></label>
                </div>
                <div className="nursing-card-actions"><button className="nursing-action-btn" type="button" onClick={saveVitals} disabled={saving === "vitals"}><Save size={15} /> {saving === "vitals" ? "Saving..." : "Save Vitals"}</button></div>
                {patientBoard?.visits?.[0]?.vitals?.length ? <NursingRecentList title="Recent observations" rows={patientBoard.visits[0].vitals} primaryKey="bloodPressure" secondaryKey="recordedAt" /> : null}
              </div>
            ) : null}

            {activeTab === "care-plan" ? (
              <div className="nursing-clinical-card">
                <h3 className="form-title"><ClipboardList size={18} /> Care Plan Management</h3>
                <div className="nursing-form-grid">
                  <label className="wide"><span>Nursing problem</span><input value={carePlan.nursingDiagnosis} onChange={(e) => setCarePlan({ ...carePlan, nursingDiagnosis: e.target.value })} placeholder="e.g. Unable to perform hygiene independently" /></label>
                  <label className="wide"><span>Goal</span><input value={carePlan.careGoal} onChange={(e) => setCarePlan({ ...carePlan, careGoal: e.target.value })} placeholder="Expected nursing outcome" /></label>
                  <label className="wide"><span>Interventions</span><textarea value={carePlan.intervention} onChange={(e) => setCarePlan({ ...carePlan, intervention: e.target.value })} placeholder="Bed bath twice daily, oral care, skin inspection every shift..." /></label>
                  <label><span>Evaluation</span><select value={carePlan.evaluation} onChange={(e) => setCarePlan({ ...carePlan, evaluation: e.target.value })}><option>ONGOING</option><option>IMPROVING</option><option>RESOLVED</option><option>ESCALATE</option></select></label>
                </div>
                <div className="nursing-card-actions"><button className="nursing-action-btn" type="button" onClick={saveCarePlan} disabled={saving === "care-plan"}><Save size={15} /> {saving === "care-plan" ? "Saving..." : "Save Care Plan"}</button></div>
                <NursingRecentList title="Recent care plans" rows={patientBoard?.carePlans || []} primaryKey="nursingDiagnosis" secondaryKey="intervention" />
              </div>
            ) : null}

            {activeTab === "mar" ? (
              <div className="nursing-clinical-card">
                <h3 className="form-title"><Pill size={18} /> Medication Administration Record</h3>
                <div className="nursing-mar-controls">
                  <label className="nursing-inline-field"><span>Administration status</span><select value={marStatus} onChange={(e) => setMarStatus(e.target.value)}><option value="GIVEN">Given</option><option value="HELD">Held</option><option value="REFUSED">Refused</option><option value="OMITTED">Omitted</option><option value="MISSED">Missed</option><option value="PARTIALLY_ADMINISTERED">Partially administered</option><option value="NOT_AVAILABLE">Not available</option><option value="ERROR">Medication error</option></select></label>
                  <label className="nursing-inline-field"><span>Injection site / note</span><input value={doseSite} onChange={(e) => setDoseSite(e.target.value)} placeholder="e.g. Left deltoid" /></label>
                  {marStatus !== "GIVEN" ? <label className="nursing-inline-field nursing-mar-reason"><span>Exception reason (required)</span><input value={marReason} onChange={(e) => setMarReason(e.target.value)} placeholder="Document why the dose was not given" required /></label> : null}
                  <label className="nursing-inline-field"><span>PRN indication / reassessment</span><input value={prnDetails} onChange={(e) => setPrnDetails(e.target.value)} placeholder="Indication and response, if PRN" /></label>
                </div>
                <div className="nursing-mar-grid">
                  <div className="nursing-mar-grid-head">Medication</div>
                  {doseSlots.map((slot) => <div key={slot.key} className="nursing-mar-grid-head">{slot.label}</div>)}
                  {prescriptions.length === 0 ? (
                    <div className="nursing-empty-card nursing-mar-empty"><AlertTriangle className="nursing-empty-icon" /><p>No prescribed medicines found for this visit.</p></div>
                  ) : prescriptions.flatMap((prescription) => [
                    <div key={`${prescription.id}-name`} className="nursing-mar-drug-cell">
                      <strong>{prescription.drugName || prescription.medication || "Medication"}</strong>
                      <span>{prescription.dosage || prescription.dose || ""} {prescription.frequency || ""}</span>
                    </div>,
                    ...doseSlots.map((slot) => {
                      const status = doseStatus(prescription, slot.key);
                      return (
                        <button
                          key={`${prescription.id}-${slot.key}`}
                          type="button"
                          className={`nursing-mar-dose-cell is-${status}`}
                          disabled={saving === `${prescription.id}-${slot.key}`}
                          onClick={() => administerDose(prescription, slot.key)}
                        >
                          {saving === `${prescription.id}-${slot.key}` ? "Saving" : status === "given" ? "Recorded" : status === "missed" ? "Missed" : "Due"}
                        </button>
                      );
                    }),
                  ])}
                </div>
              </div>
            ) : null}

            {activeTab === "safety" ? (
              <div className="nursing-clinical-card">
                <h3 className="form-title"><ListChecks size={18} /> Nursing Tasks & Safety</h3>
                <div className="nursing-form-section-title">Create care task</div>
                <div className="nursing-form-grid">
                  <label><span>Task title</span><input value={task.title} onChange={(e) => setTask({ ...task, title: e.target.value })} placeholder="e.g. Reposition patient" /></label>
                  <label><span>Priority</span><select value={task.priority} onChange={(e) => setTask({ ...task, priority: e.target.value })}><option>LOW</option><option>MEDIUM</option><option>HIGH</option><option>URGENT</option></select></label>
                  <label><span>Due date/time</span><input type="datetime-local" value={task.dueAt} onChange={(e) => setTask({ ...task, dueAt: e.target.value })} /></label>
                  <label className="wide"><span>Task details</span><textarea value={task.details} onChange={(e) => setTask({ ...task, details: e.target.value })} placeholder="Instructions, frequency, and completion criteria" /></label>
                </div>
                <div className="nursing-card-actions"><button className="nursing-action-btn" type="button" onClick={saveTask} disabled={saving === "task"}><Save size={15} /> {saving === "task" ? "Saving..." : "Create Task"}</button></div>
                <div className="nursing-form-section-title">Report safety incident</div>
                <div className="nursing-form-grid">
                  <label><span>Category</span><select value={incident.category} onChange={(e) => setIncident({ ...incident, category: e.target.value })}><option>FALL_RISK</option><option>FALL</option><option>MEDICATION</option><option>PRESSURE_INJURY</option><option>TRANSFUSION</option><option>DEVICE_COMPLICATION</option><option>OTHER</option></select></label>
                  <label><span>Severity</span><select value={incident.severity} onChange={(e) => setIncident({ ...incident, severity: e.target.value })}><option>LOW</option><option>MEDIUM</option><option>HIGH</option><option>CRITICAL</option></select></label>
                  <label className="wide"><span>Description</span><textarea value={incident.description} onChange={(e) => setIncident({ ...incident, description: e.target.value })} placeholder="What happened and what risk was identified?" /></label>
                  <label className="wide"><span>Immediate action taken</span><textarea value={incident.actionTaken} onChange={(e) => setIncident({ ...incident, actionTaken: e.target.value })} placeholder="Assessment, escalation, notification, or intervention" /></label>
                </div>
                <div className="nursing-card-actions"><button className="nursing-action-btn nursing-danger-btn" type="button" onClick={saveIncident} disabled={saving === "incident"}>{saving === "incident" ? "Saving..." : "Record Safety Incident"}</button></div>
                <NursingRecentList title="Open tasks" rows={patientBoard?.tasks || []} primaryKey="title" secondaryKey="details" />
                <NursingRecentList title="Recent incidents" rows={patientBoard?.incidents || []} primaryKey="category" secondaryKey="description" />
              </div>
            ) : null}

            {activeTab === "handover" ? (
              <div className="nursing-clinical-card">
                <h3 className="form-title"><Handshake size={18} /> Shift Handover</h3>
                <div className="nursing-form-grid">
                  <label><span>Incoming nurse</span><input value={handover.incomingNurseName} onChange={(e) => setHandover({ ...handover, incomingNurseName: e.target.value })} /></label>
                  <label><span>Acknowledged</span><select value={handover.acknowledged ? "YES" : "NO"} onChange={(e) => setHandover({ ...handover, acknowledged: e.target.value === "YES" })}><option>YES</option><option>NO</option></select></label>
                  <label className="wide"><span>Current clinical status</span><textarea value={handover.clinicalStatus} onChange={(e) => setHandover({ ...handover, clinicalStatus: e.target.value })} /></label>
                  <label className="wide"><span>Changes during shift</span><textarea value={handover.changes} onChange={(e) => setHandover({ ...handover, changes: e.target.value })} /></label>
                  <label className="wide"><span>Pending tasks</span><textarea value={handover.pendingTasks} onChange={(e) => setHandover({ ...handover, pendingTasks: e.target.value })} /></label>
                  <label className="wide"><span>Concerns / monitoring</span><textarea value={handover.concerns} onChange={(e) => setHandover({ ...handover, concerns: e.target.value })} /></label>
                  <label className="wide"><span>Equipment / medication issues</span><textarea value={handover.equipmentIssues} onChange={(e) => setHandover({ ...handover, equipmentIssues: e.target.value })} /></label>
                </div>
                <div className="nursing-card-actions"><button className="nursing-action-btn" type="button" onClick={saveHandover} disabled={saving === "handover"}><UserCheck size={15} /> {saving === "handover" ? "Saving..." : "Sign Handover"}</button></div>
                <NursingRecentList title="Recent handovers" rows={patientBoard?.handovers || []} primaryKey="toNurseName" secondaryKey="pendingTasks" />
              </div>
            ) : null}

            {activeTab === "fluid" ? (
              <div className="nursing-clinical-card">
                <h3 className="form-title"><Droplets size={18} /> Intake & Output Balance</h3>
                <div className="nursing-balance-strip">
                  <span>Input <strong>{fluidInput} ml</strong></span>
                  <span>Output <strong>{fluidOutput} ml</strong></span>
                  <span className={fluidBalance < 0 ? "is-negative" : "is-positive"}>Balance <strong>{fluidBalance} ml</strong></span>
                </div>
                <div className="nursing-form-grid">
                  {[
                    ["oralIntakeMl", "Oral fluids ml"],
                    ["ivIntakeMl", "IV fluids ml"],
                    ["bloodProductsMl", "Blood products ml"],
                    ["ngFeedsMl", "NG feeds ml"],
                    ["urineOutputMl", "Urine output ml"],
                    ["drainOutputMl", "Drain output ml"],
                    ["vomitOutputMl", "Vomit ml"],
                    ["ngAspirateMl", "NG aspirate ml"],
                    ["insensibleLossMl", "Insensible loss ml"],
                  ].map(([key, label]) => (
                    <label key={key}><span>{label}</span><input type="number" min="0" value={(fluid as any)[key]} onChange={(e) => setFluid({ ...fluid, [key]: e.target.value })} /></label>
                  ))}
                  <label className="wide"><span>Notes</span><textarea value={fluid.notes} onChange={(e) => setFluid({ ...fluid, notes: e.target.value })} /></label>
                </div>
                <div className="nursing-card-actions"><button className="nursing-action-btn" type="button" onClick={saveFluidBalance} disabled={saving === "fluid"}><Save size={15} /> {saving === "fluid" ? "Saving..." : "Save Fluid Balance"}</button></div>
                <NursingRecentList title="Recent fluid balance" rows={patientBoard?.intakeOutputs || []} primaryKey="notes" secondaryKey="recordedAt" />
              </div>
            ) : null}

            {activeTab === "braden" ? (
              <div className="nursing-clinical-card">
                <h3 className="form-title"><ShieldAlert size={18} /> Braden Pressure Injury Assessment</h3>
                <div className={`nursing-braden-score is-${bradenTotal < 18 ? "risk" : "safe"}`}>
                  <span>Total score</span>
                  <strong>{bradenTotal}/23</strong>
                  <small>{bradenRisk}</small>
                </div>
                <div className="nursing-form-grid">
                  {bradenFields.map(([key, label]) => (
                    <label key={key}>
                      <span>{label}</span>
                      <input type="number" min={key === "friction" ? 1 : 1} max={key === "friction" ? 3 : 4} value={(braden as any)[key]} onChange={(e) => setBraden({ ...braden, [key]: Number(e.target.value) })} />
                    </label>
                  ))}
                </div>
                {bradenTotal < 18 ? (
                  <div className="nursing-risk-alert"><AlertTriangle size={16} /> Prevention bundle required: turn 2-hourly, heel offloading, pressure mattress, nutrition referral.</div>
                ) : null}
                <div className="nursing-card-actions"><button className="nursing-action-btn" type="button" onClick={saveBraden} disabled={saving === "braden"}><Save size={15} /> {saving === "braden" ? "Saving..." : "Save Braden Assessment"}</button></div>
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}

function NursingRecentList({
  title,
  rows,
  primaryKey,
  secondaryKey,
}: {
  title: string;
  rows: any[];
  primaryKey: string;
  secondaryKey: string;
}) {
  const secondaryText = (row: any) => {
    const value = row?.[secondaryKey];
    if (secondaryKey.toLowerCase().includes("at") || secondaryKey.toLowerCase().includes("date")) {
      return formatDateTime(value || row?._createdAt);
    }
    return value || row?.notes || (row?._createdAt ? formatDateTime(row._createdAt) : "No extra detail");
  };

  return (
    <div className="nursing-recent-list">
      <h4>{title}</h4>
      {rows.length === 0 ? <p>No records yet.</p> : rows.slice(0, 4).map((row, index) => (
        <div key={`${title}-${index}`}>
          <strong>{row?.[primaryKey] || row?.title || "Recorded"}</strong>
          <span>{secondaryText(row)}</span>
        </div>
      ))}
    </div>
  );
}
