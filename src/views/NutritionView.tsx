import type { FormEvent, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  Droplet,
  FlaskConical,
  Plus,
  RefreshCw,
  Salad,
  Search,
  Send,
  Syringe,
  UtensilsCrossed,
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
const riskClass = (value: any) => {
  const risk = String(value || "LOW").toUpperCase();
  if (risk === "HIGH") return "is-danger";
  if (risk === "MEDIUM") return "is-warning";
  return "is-success";
};
const toneFromNotice = (notice: string) => (/failed|could not|required|alert|HIGH|review/i.test(notice) ? "warning" : "success");
const formReset = {
  screening: { patientId: "", screeningTool: "MUST", weightKg: "", heightCm: "", usualBodyWeightKg: "", reducedIntake: "NO", appetite: "Good", diseaseSeverity: "No stress" },
  assessment: { patientId: "", dietaryRecall: "", foodPreferences: "", culturalRequirements: "", swallowingStatus: "Normal", gutFunction: "Normal", albumin: "", preAlbumin: "", zinc: "", vitaminB12: "", weightKg: "", heightCm: "", usualBodyWeightKg: "", muacCm: "", calfCircumferenceCm: "", functionalStatus: "", nutritionDiagnosis: "", stressFactor: "1.2", activityFactor: "1.1", proteinPerKg: "1.2", fluidRequirementMl: "" },
  plan: { nutritionSupportType: "ORAL", dietType: "Normal", routeOfFeeding: "ORAL", dailyCaloricTarget: "", proteinTargetG: "", fluidTargetMl: "", textureModification: "Normal", supplement: "", enteralFormula: "", rateMlPerHour: "", totalVolumeMlDay: "", monitoringParameters: "Weight, intake, glucose, electrolytes", reviewDate: todayValue() },
  enteral: { planId: "", administeredDate: todayValue(), administeredTime: nowTime(), deliveredVolumeMl: "", prescribedVolumeMl: "", rateMlPerHour: "", tolerance: "Tolerated", vomiting: false, aspirateMl: "", bowelActivity: "", rateChange: "" },
  tpn: { patientId: "", dextroseG: "", aminoAcidsG: "", lipidsG: "", sodiumMmol: "", potassiumMmol: "", calciumMmol: "", magnesiumMmol: "", phosphateMmol: "", traceElements: "", vitamins: "", renalFunction: "", hepaticFunction: "", electrolyteSummary: "", metabolicNeeds: "" },
  tpnApproval: { tpnOrderId: "", role: "DIETITIAN", approvalNotes: "" },
  trend: { patientId: "", recordedDate: todayValue(), recordedTime: nowTime(), weightKg: "", kcalIntake: "", kcalRequirement: "", proteinIntakeG: "", proteinRequirementG: "" },
};

export default function NutritionView() {
  const [dashboard, setDashboard] = useState<any>({});
  const [assessments, setAssessments] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [enteralRecords, setEnteralRecords] = useState<any[]>([]);
  const [tpnOrders, setTpnOrders] = useState<any[]>([]);
  const [trends, setTrends] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState("");
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState("");
  const [saving, setSaving] = useState("");
  const [notice, setNotice] = useState("");
  const [workflowPopup, setWorkflowPopup] = useState<"monitor" | "waiting" | "queue" | "">("");
  const [waitingRows, setWaitingRows] = useState<any[]>([]);
  const [workflowLoading, setWorkflowLoading] = useState(false);
  const [queuePatientId, setQueuePatientId] = useState("");
  const [waitingCheckInDate, setWaitingCheckInDate] = useState(todayValue());

  const [screeningForm, setScreeningForm] = useState(formReset.screening);
  const [assessmentForm, setAssessmentForm] = useState(formReset.assessment);
  const [planForm, setPlanForm] = useState(formReset.plan);
  const [enteralForm, setEnteralForm] = useState(formReset.enteral);
  const [tpnForm, setTpnForm] = useState(formReset.tpn);
  const [tpnApprovalForm, setTpnApprovalForm] = useState(formReset.tpnApproval);
  const [trendForm, setTrendForm] = useState(formReset.trend);

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
      const [dashRes, screenRes, planRes, refRes, enteralRes, tpnRes, trendRes, patientRes] = await Promise.all([
        safeGet("/nutrition/dashboard", "dashboard", {}),
        safeGet("/nutrition/screenings", "screenings", []),
        safeGet("/nutrition/plans", "care plans", []),
        safeGet("/nutrition/referrals", "dietitian referrals", []),
        safeGet("/nutrition/enteral-records", "enteral records", []),
        safeGet("/nutrition/tpn-orders", "TPN orders", []),
        safeGet("/nutrition/trends", "nutrition trends", []),
        safeGet("/patients", "patients", [], { params: { limit: 500 } }),
      ]);
      const rows = unwrapRows(screenRes.data);
      const responses = [dashRes, screenRes, planRes, refRes, enteralRes, tpnRes, trendRes, patientRes] as any[];
      const failed = responses.filter((response) => response.__error);
      if (failed.length) setToast(`${failed.map((response) => `${response.__label}${response.__status ? ` (${response.__status})` : ""}`).join(", ")} could not be loaded. Check your connection or permissions.`);
      const dashboardData = unwrapObject(dashRes.data);
      const dashboardTotals = dashboardData?.totals || {};
      const computedTotals = {
        screenings: dashboardTotals.screenings ?? rows.length,
        highRisk: dashboardTotals.highRisk ?? rows.filter((row: any) => String(row.riskCategory || "").toUpperCase() === "HIGH").length,
        activePlans: dashboardTotals.activePlans ?? unwrapRows(planRes.data).filter((row: any) => String(row.status || "").toUpperCase() === "ACTIVE").length,
        enteralAlerts: dashboardTotals.enteralAlerts ?? unwrapRows(enteralRes.data).filter((row: any) => String(row.eventType || "").includes("ALERT")).length,
        tpnPending: dashboardTotals.tpnPending ?? unwrapRows(tpnRes.data).filter((row: any) => String(row.status || "").toUpperCase() !== "APPROVED_FOR_PHARMACY").length,
        trendAlerts: dashboardTotals.trendAlerts ?? unwrapRows(trendRes.data).filter((row: any) => Array.isArray(row.flags) && row.flags.length > 0).length,
      };
      setDashboard({ ...dashboardData, totals: computedTotals });
      setAssessments(rows);
      setPlans(unwrapRows(planRes.data));
      setReferrals(unwrapRows(refRes.data));
      setEnteralRecords(unwrapRows(enteralRes.data));
      setTpnOrders(unwrapRows(tpnRes.data));
      setTrends(unwrapRows(trendRes.data));
      setPatients(unwrapRows(patientRes.data));
      setSelectedAssessmentId((current) => rows.some((row: any) => row.id === current) ? current : rows[0]?.id || "");
    } catch (error: any) {
      setToast(error?.response?.data?.message || "Nutrition data could not be loaded.");
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
      if (detail?.moduleKey !== "nutrition") return;
      setWorkflowPopup("waiting");
      setWorkflowLoading(true);
      api.get("/opd/queue/board", { params: { departmentId: "NUTRITION" } })
        .then((response) => setWaitingRows(unwrapRows(response.data)))
        .catch(() => { setWaitingRows([]); setToast("Nutrition waiting list could not be loaded."); })
        .finally(() => setWorkflowLoading(false));
    };
    window.addEventListener("hmis:nutrition-sidebar-action", handleSidebarAction);
    window.addEventListener("hmis:open-module-waiting-list", handleWaitingList);
    return () => {
      window.removeEventListener("hmis:nutrition-sidebar-action", handleSidebarAction);
      window.removeEventListener("hmis:open-module-waiting-list", handleWaitingList);
    };
  }, []);

  const selectedAssessment = useMemo(() => assessments.find((row) => row.id === selectedAssessmentId) || assessments[0] || null, [assessments, selectedAssessmentId]);
  const selectedPlans = plans.filter((row) => row.assessmentId === selectedAssessment?.id);
  const selectedPlan = selectedPlans[0] || null;
  const selectedTrends = trends.filter((row) => row.patientId === selectedAssessment?.patientId);
  const selectedEnteral = enteralRecords.filter((row) => row.planId === selectedPlan?.id);
  const patientLabel = (patientId: string) => {
    const patient = patients.find((row) => row.id === patientId);
    return patient ? `${patientName(patient)} | ${patient.patientCode || patient.mrn || "No MRN"}` : patientId || "-";
  };
  const filteredAssessments = useMemo(() => {
    const q = search.trim().toLowerCase();
    return assessments.filter((row) => {
      if (riskFilter !== "ALL" && String(row.riskCategory || "").toUpperCase() !== riskFilter) return false;
      if (!q) return true;
      return `${patientLabel(row.patientId)} ${row.diagnosis} ${row.riskCategory} ${row.screeningTool} ${row.dietaryIntake}`.toLowerCase().includes(q);
    });
  }, [assessments, patients, search, riskFilter]);

  const totals = dashboard?.totals || {};
  const stats = [
    { label: "Screenings", value: totals.screenings || 0, color: "#2563eb", icon: ClipboardCheck, action: () => { setRiskFilter("ALL"); setSearch(""); } },
    { label: "High Risk", value: totals.highRisk || 0, color: "#dc2626", icon: AlertTriangle, action: () => { setRiskFilter("HIGH"); setSearch(""); } },
    { label: "Active Plans", value: totals.activePlans || 0, color: "#16a34a", icon: ClipboardList, action: () => setToast(`${totals.activePlans || 0} active nutrition care plan(s) loaded.`) },
    { label: "Enteral Alerts", value: totals.enteralAlerts || 0, color: "#d97706", icon: Droplet, action: () => setToast(`${totals.enteralAlerts || 0} enteral under-delivery alert(s) recorded.`) },
    { label: "TPN Pending", value: totals.tpnPending || 0, color: "#7c3aed", icon: FlaskConical, action: () => openTpnApproval() },
    { label: "Trend Alerts", value: totals.trendAlerts || 0, color: "#0891b2", icon: BarChart3, action: () => setToast(`${totals.trendAlerts || 0} nutrition trend alert(s) recorded.`) },
  ];

  const requireAssessment = () => {
    if (selectedAssessment?.id) return true;
    setToast("Select or create a nutrition assessment first.");
    return false;
  };
  const requirePlan = () => {
    if (selectedPlan?.id) return true;
    setToast("Create a nutrition care plan first.");
    return false;
  };
  const closeAfter = async (message: string) => {
    setToast(message);
    setModal("");
    await load();
  };
  const openScreening = () => {
    setScreeningForm({ ...formReset.screening, patientId: selectedAssessment?.patientId || "" });
    setModal("screening");
  };
  const openAssessment = () => {
    setAssessmentForm((current) => ({ ...formReset.assessment, ...current, patientId: selectedAssessment?.patientId || current.patientId, weightKg: String(selectedAssessment?.weightKg || current.weightKg), heightCm: String(selectedAssessment?.heightCm || current.heightCm), nutritionDiagnosis: selectedAssessment?.diagnosis || current.nutritionDiagnosis }));
    setModal("assessment");
  };
  const openPlan = () => {
    if (!requireAssessment()) return;
    setPlanForm((current) => ({ ...current, dailyCaloricTarget: String(selectedAssessment?.energyRequirementKcal || current.dailyCaloricTarget), proteinTargetG: String(selectedAssessment?.proteinRequirementG || current.proteinTargetG), fluidTargetMl: String(selectedAssessment?.fluidRequirementMl || current.fluidTargetMl) }));
    setModal("plan");
  };
  const openEnteral = () => {
    if (!requirePlan()) return;
    setEnteralForm((current) => ({ ...current, planId: selectedPlan.id, prescribedVolumeMl: String(selectedPlan.totalVolumeMlDay || current.prescribedVolumeMl), rateMlPerHour: String(selectedPlan.rateMlPerHour || current.rateMlPerHour) }));
    setModal("enteral");
  };
  const openTpn = () => {
    setTpnForm((current) => ({ ...current, patientId: selectedAssessment?.patientId || current.patientId }));
    setModal("tpn");
  };
  const openTpnApproval = () => {
    if (!tpnOrders.length) {
      setToast("No TPN orders are waiting for approval.");
      return;
    }
    const selectedOrder = tpnOrders.find((row) => row.patientId === selectedAssessment?.patientId && row.status !== "APPROVED_FOR_PHARMACY") || tpnOrders.find((row) => row.status !== "APPROVED_FOR_PHARMACY") || tpnOrders[0];
    setTpnApprovalForm((current) => ({ ...current, tpnOrderId: selectedOrder?.tpnOrderId || current.tpnOrderId }));
    setModal("tpn-approval");
  };
  const openTrend = () => {
    if (!selectedAssessment?.patientId) {
      setToast("Select a nutrition episode before recording a trend.");
      return;
    }
    setTrendForm((current) => ({ ...current, patientId: selectedAssessment?.patientId || current.patientId, weightKg: String(selectedAssessment?.weightKg || current.weightKg), kcalRequirement: String(selectedAssessment?.energyRequirementKcal || current.kcalRequirement), proteinRequirementG: String(selectedAssessment?.proteinRequirementG || current.proteinRequirementG) }));
    setModal("trend");
  };

  const saveScreening = (event: FormEvent) => {
    event.preventDefault();
    setSaving("screening");
    api.post("/nutrition/screening", screeningForm)
      .then((res) => {
        setSelectedAssessmentId(res.data?.assessment?.id || "");
        return closeAfter(res.data?.referralCreated ? "HIGH risk screening saved and dietitian referral created automatically." : "Nutrition screening saved.");
      })
      .catch((error) => setToast(error?.response?.data?.message || "Nutrition screening could not be saved."))
      .finally(() => setSaving(""));
  };
  const saveAssessment = (event: FormEvent) => {
    event.preventDefault();
    setSaving("assessment");
    api.post("/nutrition/assessment", assessmentForm)
      .then((res) => {
        setSelectedAssessmentId(res.data?.id || "");
        return closeAfter("Comprehensive nutritional assessment saved.");
      })
      .catch((error) => setToast(error?.response?.data?.message || "Nutrition assessment could not be saved."))
      .finally(() => setSaving(""));
  };
  const savePlan = (event: FormEvent) => {
    event.preventDefault();
    if (!requireAssessment()) return;
    setSaving("plan");
    api.post("/nutrition/care-plan", { ...planForm, assessmentId: selectedAssessment.id })
      .then(() => closeAfter("Nutrition care plan saved and posted to Canteen, MAR, and EMR."))
      .catch((error) => setToast(error?.response?.data?.message || "Nutrition care plan could not be saved."))
      .finally(() => setSaving(""));
  };
  const saveEnteral = (event: FormEvent) => {
    event.preventDefault();
    if (!enteralForm.planId && !requirePlan()) return;
    setSaving("enteral");
    api.post("/nutrition/enteral-record", { ...enteralForm, administeredAt: dateTimeValue(enteralForm.administeredDate, enteralForm.administeredTime) })
      .then((res) => closeAfter(res.data?.percentDelivered < 80 ? "Enteral feed recorded with under-delivery alert for dietitian review." : "Enteral feed administration recorded."))
      .catch((error) => setToast(error?.response?.data?.message || "Enteral feed record could not be saved."))
      .finally(() => setSaving(""));
  };
  const saveTpn = (event: FormEvent) => {
    event.preventDefault();
    setSaving("tpn");
    api.post("/nutrition/tpn-order", tpnForm)
      .then((res) => {
        setTpnApprovalForm((current) => ({ ...current, tpnOrderId: res.data?.tpnOrderId || current.tpnOrderId }));
        return closeAfter(res.data?.safetyFlags?.length ? "TPN order saved with safety flags requiring review." : "TPN order saved pending dual approval.");
      })
      .catch((error) => setToast(error?.response?.data?.message || "TPN order could not be saved."))
      .finally(() => setSaving(""));
  };
  const saveTpnApproval = (event: FormEvent) => {
    event.preventDefault();
    if (!tpnApprovalForm.tpnOrderId) {
      setToast("Select a TPN order before saving approval.");
      return;
    }
    setSaving("tpn-approval");
    api.post(`/nutrition/tpn-order/${tpnApprovalForm.tpnOrderId}/approval`, tpnApprovalForm)
      .then((res) => closeAfter(res.data?.status === "APPROVED_FOR_PHARMACY" ? "TPN approved by both roles and sent to pharmacy." : "TPN approval saved, still awaiting second approval."))
      .catch((error) => setToast(error?.response?.data?.message || "TPN approval could not be saved."))
      .finally(() => setSaving(""));
  };
  const saveTrend = (event: FormEvent) => {
    event.preventDefault();
    setSaving("trend");
    api.post("/nutrition/trend", { ...trendForm, recordedAt: dateTimeValue(trendForm.recordedDate, trendForm.recordedTime) })
      .then((res) => closeAfter(res.data?.flags?.length ? "Nutrition trend saved with intake or weight alert." : "Nutrition trend saved."))
      .catch((error) => setToast(error?.response?.data?.message || "Nutrition trend could not be saved."))
      .finally(() => setSaving(""));
  };

  const queueSelectedPatient = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!queuePatientId) {
      setToast("Select a registered patient before adding them to the Nutrition queue.");
      return;
    }
    setSaving("queue-patient");
    try {
      await api.post("/opd/queue/token", { patientId: queuePatientId, departmentId: "NUTRITION", queueType: "NUTRITION", priority: "NORMAL" });
      setWorkflowPopup("");
      setQueuePatientId("");
      setToast("Patient added to the Nutrition waiting list.");
    } catch (error: any) {
      setToast(error?.response?.data?.message || "Patient could not be added to the Nutrition queue.");
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
      await api.patch("/opd/queue/token/status", { tokenNumber, status: checkingOut ? "COMPLETED" : "IN_SERVICE", checkInDate: waitingCheckInDate, reason: checkingOut ? "Checked out from Nutrition waiting list" : "Checked in from Nutrition waiting list" });
      setToast(`${row.patientName || row.patientCode || "Patient"} ${checkingOut ? "checked out from" : "checked in for"} Nutrition.`);
      await load();
    } catch (error: any) {
      setToast(error?.response?.data?.message || "Nutrition patient check-in failed.");
    } finally {
      setSaving("");
    }
  };

  return (
    <div className="nursing-view nutrition-view">
      <div className="pv-header">
        <div>
          <h2 className="pv-title">Nutrition and Dietetics</h2>
          <p className="pv-subtitle">Malnutrition screening, dietitian assessment, nutrition plans, enteral feeds, TPN approvals, and intake trends.</p>
        </div>
        <div className="nursing-header-actions">
          <button type="button" className="nursing-secondary-btn" onClick={() => void load()} disabled={loading}><RefreshCw size={15} /> {loading ? "Loading..." : "Refresh"}</button>
          <button type="button" className="nursing-action-btn" onClick={openScreening}><Plus size={15} /> Screening</button>
          <button type="button" className="nursing-action-btn is-blue" onClick={openAssessment}><Salad size={15} /> Assessment</button>
        </div>
      </div>

      {notice ? (
        <div className={`module-notice-toast is-${toneFromNotice(notice)}`} role="status" aria-live="polite">
          <div><strong>Nutrition</strong><span>{notice}</span></div>
          <button type="button" className="module-notice-close" onClick={() => setNotice("")}>×</button>
        </div>
      ) : null}

      {workflowPopup ? (
        <div className="nutrition-workflow-backdrop" role="presentation" onClick={() => setWorkflowPopup("")}>
          <section className="nutrition-workflow-modal" role="dialog" aria-modal="true" aria-labelledby="nutrition-workflow-title" onClick={(event) => event.stopPropagation()}>
            <header>
              <div>
                <span>NUTRITION WORKSPACE</span>
                <h2 id="nutrition-workflow-title">{workflowPopup === "monitor" ? "Monitor nutrition patients" : workflowPopup === "waiting" ? "Nutrition waiting list" : "Queue a patient"}</h2>
                <p>{workflowPopup === "monitor" ? "Select an active nutrition episode to open its clinical workspace." : workflowPopup === "waiting" ? "Review patients sent to Nutrition from another service and check them in." : "Send a registered patient to the Nutrition queue without leaving this module."}</p>
              </div>
              <button type="button" aria-label="Close nutrition workspace" onClick={() => setWorkflowPopup("")}><X size={17} /></button>
            </header>
            <div className="nutrition-workflow-body">
              {workflowPopup === "monitor" ? (
                <div className="nutrition-workflow-list">
                  {assessments.length ? assessments.slice(0, 50).map((row) => (
                    <button key={row.id} type="button" onClick={() => { setSelectedAssessmentId(row.id); setWorkflowPopup(""); }}>
                      <strong>{patientLabel(row.patientId)}</strong>
                      <span>{row.diagnosis || "Nutrition assessment"} · {row.riskCategory || "LOW"} risk · {formatDateTime(row.assessedAt || row.createdAt)}</span>
                    </button>
                  )) : <p className="nutrition-workflow-note">No nutrition assessments are available to monitor.</p>}
                </div>
              ) : null}
              {workflowPopup === "waiting" ? (
                <div>
                  <label className="nutrition-workflow-date"><span>Check-in date</span><input type="date" value={waitingCheckInDate} onChange={(event) => setWaitingCheckInDate(event.target.value)} /></label>
                  {workflowLoading ? <p className="nutrition-workflow-note">Loading Nutrition waiting list...</p> : waitingRows.length ? (
                    <div className="nutrition-workflow-list">
                      {waitingRows.map((row, index) => {
                        const key = row.id || row.tokenId || row.tokenNumber || index;
                        return <div className="nutrition-workflow-list-item" key={key}>
                          <button type="button" onClick={() => { const matching = assessments.find((assessment) => assessment.patientId === row.patientId); if (matching) setSelectedAssessmentId(matching.id); setWorkflowPopup(""); }}>
                            <strong>{row.patientName || row.patientCode || patientLabel(row.patientId)}</strong>
                            <span>Token {row.tokenNumber || row.token || "-"} · {row.status || "WAITING"} · From {row.sourceModule || row.departmentName || row.departmentId || "another service"}</span>
                          </button>
                          <button type="button" className="nutrition-workflow-checkin" disabled={saving === "check-in"} onClick={() => void checkInQueuedPatient(row)}>{saving === "check-in" ? "Updating..." : String(row.status || "").toUpperCase() === "IN_SERVICE" ? "Check Out" : "Check In"}</button>
                        </div>;
                      })}
                    </div>
                  ) : <p className="nutrition-workflow-note">No patients are currently waiting for Nutrition.</p>}
                </div>
              ) : null}
              {workflowPopup === "queue" ? (
                <form className="nutrition-workflow-form" onSubmit={queueSelectedPatient}>
                  <label><span>Registered patient</span><select required value={queuePatientId} onChange={(event) => setQueuePatientId(event.target.value)}><option value="">Select a patient</option>{patients.map((patient) => <option key={patient.id} value={patient.id}>{patientName(patient)} | {patient.patientCode || patient.mrn || "No MRN"}</option>)}</select></label>
                  <footer><button type="button" className="nursing-secondary-btn" onClick={() => setWorkflowPopup("")}>Cancel</button><button type="submit" className="nursing-action-btn" disabled={saving === "queue-patient"}><Send size={15} /> {saving === "queue-patient" ? "Queueing..." : "Queue Patient"}</button></footer>
                </form>
              ) : null}
            </div>
          </section>
        </div>
      ) : null}

      <div className="pv-stats nursing-stats-grid">
        {stats.map(({ label, value, color, icon: Icon, action }) => (
          <button key={label} type="button" className="pv-stat-card nutrition-stat-card" style={{ borderLeftColor: color }} onClick={action}>
            <p className="pv-stat-label">{label}</p>
            <p className="pv-stat-value">{loading ? "..." : value}</p>
            <Icon className="nutrition-stat-icon" size={19} style={{ color }} />
          </button>
        ))}
      </div>

      <div className="nutrition-layout">
        <section className="nursing-worklist">
          <div className="pv-search-bar nutrition-filter-bar">
            <div className="pv-search-wrap">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input className="pv-search" placeholder="Search screening, patient, diagnosis..." value={search} onChange={(event) => setSearch(event.target.value)} />
            </div>
            <select className="nursing-filter-select" value={riskFilter} onChange={(event) => setRiskFilter(event.target.value)}>
              <option value="ALL">All risks</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </div>
          <div className="pv-table-wrap">
            <table className="pv-table">
              <thead><tr><th>Patient</th><th>Tool</th><th>Score</th><th>Risk</th></tr></thead>
              <tbody>
                {loading ? <tr><td colSpan={4} className="pv-empty">Loading nutrition records...</td></tr> : filteredAssessments.length === 0 ? <tr><td colSpan={4} className="pv-empty">No nutrition screening records found.</td></tr> : filteredAssessments.map((row) => (
                  <tr key={row.id} className={row.id === selectedAssessment?.id ? "nursing-selected-row" : ""} onClick={() => setSelectedAssessmentId(row.id)}>
                    <td className="pv-name">{patientLabel(row.patientId)}</td>
                    <td>{row.screeningTool || "-"}</td>
                    <td>{row.screeningScore ?? "-"}</td>
                    <td><span className={`pv-badge ${riskClass(row.riskCategory)}`}>{row.riskCategory || "LOW"}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="nursing-care-panel">
          <div className="nursing-care-header">
            <div>
              <span>Selected Nutrition Episode</span>
              <strong>{selectedAssessment ? `${selectedAssessment.diagnosis || "Nutrition assessment"} | BMI ${selectedAssessment.bmi || "-"}` : "No nutrition episode selected"}</strong>
            </div>
            <span className={`pv-badge ${riskClass(selectedAssessment?.riskCategory)}`}>{selectedAssessment?.riskCategory || "LOW"}</span>
          </div>
          <div className="nutrition-action-row">
            <button type="button" className="nutrition-action-btn is-success" onClick={openPlan}><ClipboardList size={14} /> Care Plan</button>
            <button type="button" className="nutrition-action-btn is-blue" onClick={openEnteral}><Droplet size={14} /> Enteral Record</button>
            <button type="button" className="nutrition-action-btn is-purple" onClick={openTpn}><FlaskConical size={14} /> TPN Order</button>
            <button type="button" className="nutrition-action-btn is-warning" onClick={openTpnApproval}><Syringe size={14} /> TPN Approval</button>
            <button type="button" className="nutrition-action-btn is-teal" onClick={openTrend}><BarChart3 size={14} /> Trend</button>
          </div>
          <div className="nutrition-detail-grid">
            <NutritionInfo title="Assessment" rows={[["Energy", `${selectedAssessment?.energyRequirementKcal || "-"} kcal`], ["Protein", `${selectedAssessment?.proteinRequirementG || "-"} g`], ["Fluid", `${selectedAssessment?.fluidRequirementMl || "-"} ml`], ["Diagnosis", selectedAssessment?.diagnosis || "-"]]} />
            <NutritionInfo title="Care Plan" rows={[["Plans", selectedPlans.length], ["Route", selectedPlan?.nutritionSupportType || "-"], ["Diet", selectedPlan?.dietType || "-"], ["Review", selectedPlan?.reviewDate ? formatDateTime(selectedPlan.reviewDate) : "-"]]} />
            <NutritionInfo title="Monitoring" rows={[["Enteral records", selectedEnteral.length], ["Trend records", selectedTrends.length], ["TPN orders", tpnOrders.filter((row) => row.patientId === selectedAssessment?.patientId).length], ["Latest flags", selectedTrends[0]?.flags?.join(", ") || "-"]]} />
            <NutritionInfo title="Referral and Posting" rows={[["Dietitian referrals", referrals.filter((row) => row.patientId === selectedAssessment?.patientId).length], ["Canteen order", selectedPlan?.dietOrderTransmitted ? "Posted" : "-"], ["MAR supplement", selectedPlan?.enteralFormula || "-"], ["EMR plan", selectedPlan ? "Visible" : "-"]]} />
          </div>
          <div className="pv-table-wrap nutrition-trend-table">
            <table className="pv-table">
              <thead><tr><th>Recorded</th><th>Weight</th><th>Kcal</th><th>Protein</th><th>Flags</th></tr></thead>
              <tbody>
                {selectedTrends.length === 0 ? <tr><td colSpan={5} className="pv-empty">No nutrition trends recorded.</td></tr> : selectedTrends.slice(0, 8).map((row) => (
                  <tr key={row.trendId}><td>{formatDateTime(row.recordedAt)}</td><td>{row.weightKg} kg</td><td>{row.kcalIntake}/{row.kcalRequirement}</td><td>{row.proteinIntakeG}/{row.proteinRequirementG}</td><td>{row.flags?.join(", ") || "-"}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {modal === "screening" ? <NutritionModal tone="success" title="Nutritional Screening" subtitle="MUST/NRS-2002 scoring classifies malnutrition risk and automatically creates a dietitian referral for HIGH risk." onSubmit={saveScreening} onClose={() => setModal("")} saving={saving === "screening"} saveText="Save Screening"><div className="nutrition-form-grid">
        <Field label="Patient" wide><select required value={screeningForm.patientId} onChange={(e) => setScreeningForm({ ...screeningForm, patientId: e.target.value })}><option value="">Select patient</option>{patients.map((patient) => <option key={patient.id} value={patient.id}>{patientName(patient)} | {patient.patientCode || patient.mrn || "No MRN"}</option>)}</select></Field>
        <Field label="Tool"><select value={screeningForm.screeningTool} onChange={(e) => setScreeningForm({ ...screeningForm, screeningTool: e.target.value })}><option>MUST</option><option>NRS-2002</option></select></Field>
        <Field label="Weight kg"><input required type="number" value={screeningForm.weightKg} onChange={(e) => setScreeningForm({ ...screeningForm, weightKg: e.target.value })} /></Field>
        <Field label="Height cm"><input required type="number" value={screeningForm.heightCm} onChange={(e) => setScreeningForm({ ...screeningForm, heightCm: e.target.value })} /></Field>
        <Field label="Usual weight kg"><input type="number" value={screeningForm.usualBodyWeightKg} onChange={(e) => setScreeningForm({ ...screeningForm, usualBodyWeightKg: e.target.value })} /></Field>
        <Field label="Reduced intake"><select value={screeningForm.reducedIntake} onChange={(e) => setScreeningForm({ ...screeningForm, reducedIntake: e.target.value })}><option>NO</option><option>YES</option><option>NPO</option></select></Field>
        <Field label="Appetite"><select value={screeningForm.appetite} onChange={(e) => setScreeningForm({ ...screeningForm, appetite: e.target.value })}><option>Good</option><option>Fair</option><option>Poor</option><option>Absent</option></select></Field>
        <Field label="Disease severity"><select value={screeningForm.diseaseSeverity} onChange={(e) => setScreeningForm({ ...screeningForm, diseaseSeverity: e.target.value })}><option>No stress</option><option>Mild</option><option>Moderate</option><option>Severe</option></select></Field>
      </div></NutritionModal> : null}

      {modal === "assessment" ? <NutritionModal tone="info" title="Comprehensive Nutritional Assessment" subtitle="Capture dietary recall, requirements, dysphagia, biochemical markers, anthropometry, and PES diagnosis." onSubmit={saveAssessment} onClose={() => setModal("")} saving={saving === "assessment"} saveText="Save Assessment"><div className="nutrition-form-grid">
        <Field label="Patient" wide><select required value={assessmentForm.patientId} onChange={(e) => setAssessmentForm({ ...assessmentForm, patientId: e.target.value })}><option value="">Select patient</option>{patients.map((patient) => <option key={patient.id} value={patient.id}>{patientName(patient)} | {patient.patientCode || patient.mrn || "No MRN"}</option>)}</select></Field>
        <Field label="24-hour dietary recall" wide><textarea required value={assessmentForm.dietaryRecall} onChange={(e) => setAssessmentForm({ ...assessmentForm, dietaryRecall: e.target.value })} /></Field>
        <Field label="Food/cultural requirements" wide><input value={assessmentForm.culturalRequirements} onChange={(e) => setAssessmentForm({ ...assessmentForm, culturalRequirements: e.target.value })} /></Field>
        <Field label="Swallowing"><select value={assessmentForm.swallowingStatus} onChange={(e) => setAssessmentForm({ ...assessmentForm, swallowingStatus: e.target.value })}><option>Normal</option><option>Soft diet needed</option><option>Pureed needed</option><option>Thickened liquids needed</option><option>Tube feeding needed</option></select></Field>
        <Field label="Gut function"><select value={assessmentForm.gutFunction} onChange={(e) => setAssessmentForm({ ...assessmentForm, gutFunction: e.target.value })}><option>Normal</option><option>Diarrhoea</option><option>Constipation</option><option>Malabsorption</option></select></Field>
        <Field label="Weight kg"><input type="number" value={assessmentForm.weightKg} onChange={(e) => setAssessmentForm({ ...assessmentForm, weightKg: e.target.value })} /></Field>
        <Field label="Height cm"><input type="number" value={assessmentForm.heightCm} onChange={(e) => setAssessmentForm({ ...assessmentForm, heightCm: e.target.value })} /></Field>
        <Field label="Usual weight kg"><input type="number" value={assessmentForm.usualBodyWeightKg} onChange={(e) => setAssessmentForm({ ...assessmentForm, usualBodyWeightKg: e.target.value })} /></Field>
        <Field label="MUAC cm"><input type="number" value={assessmentForm.muacCm} onChange={(e) => setAssessmentForm({ ...assessmentForm, muacCm: e.target.value })} /></Field>
        <Field label="Calf circumference cm"><input type="number" value={assessmentForm.calfCircumferenceCm} onChange={(e) => setAssessmentForm({ ...assessmentForm, calfCircumferenceCm: e.target.value })} /></Field>
        <Field label="Albumin"><input type="number" value={assessmentForm.albumin} onChange={(e) => setAssessmentForm({ ...assessmentForm, albumin: e.target.value })} /></Field>
        <Field label="Pre-albumin"><input type="number" value={assessmentForm.preAlbumin} onChange={(e) => setAssessmentForm({ ...assessmentForm, preAlbumin: e.target.value })} /></Field>
        <Field label="Zinc"><input type="number" value={assessmentForm.zinc} onChange={(e) => setAssessmentForm({ ...assessmentForm, zinc: e.target.value })} /></Field>
        <Field label="Vitamin B12"><input type="number" value={assessmentForm.vitaminB12} onChange={(e) => setAssessmentForm({ ...assessmentForm, vitaminB12: e.target.value })} /></Field>
        <Field label="Functional status" wide><textarea value={assessmentForm.functionalStatus} onChange={(e) => setAssessmentForm({ ...assessmentForm, functionalStatus: e.target.value })} /></Field>
        <Field label="PES nutrition diagnosis" wide><textarea required value={assessmentForm.nutritionDiagnosis} onChange={(e) => setAssessmentForm({ ...assessmentForm, nutritionDiagnosis: e.target.value })} /></Field>
      </div></NutritionModal> : null}

      {modal === "plan" ? <NutritionModal tone="success" title="Nutrition Care Plan and Diet Prescription" subtitle="Plan posts to Canteen, Nursing MAR, and EMR simultaneously." onSubmit={savePlan} onClose={() => setModal("")} saving={saving === "plan"} saveText="Save Care Plan"><div className="nutrition-form-grid">
        <Field label="Support type"><select value={planForm.nutritionSupportType} onChange={(e) => setPlanForm({ ...planForm, nutritionSupportType: e.target.value })}><option>ORAL</option><option>ORAL_SUPPLEMENT</option><option>ENTERAL_NG</option><option>PEG</option><option>NASOJEJUNAL</option><option>TPN</option></select></Field>
        <Field label="Diet type"><input value={planForm.dietType} onChange={(e) => setPlanForm({ ...planForm, dietType: e.target.value })} /></Field>
        <Field label="Route of feeding"><input value={planForm.routeOfFeeding} onChange={(e) => setPlanForm({ ...planForm, routeOfFeeding: e.target.value })} /></Field>
        <Field label="Texture modification"><input value={planForm.textureModification} onChange={(e) => setPlanForm({ ...planForm, textureModification: e.target.value })} /></Field>
        <Field label="Calorie target"><input type="number" value={planForm.dailyCaloricTarget} onChange={(e) => setPlanForm({ ...planForm, dailyCaloricTarget: e.target.value })} /></Field>
        <Field label="Protein target g"><input type="number" value={planForm.proteinTargetG} onChange={(e) => setPlanForm({ ...planForm, proteinTargetG: e.target.value })} /></Field>
        <Field label="Fluid target ml"><input type="number" value={planForm.fluidTargetMl} onChange={(e) => setPlanForm({ ...planForm, fluidTargetMl: e.target.value })} /></Field>
        <Field label="Supplement"><input value={planForm.supplement} onChange={(e) => setPlanForm({ ...planForm, supplement: e.target.value })} /></Field>
        <Field label="Enteral formula"><input value={planForm.enteralFormula} onChange={(e) => setPlanForm({ ...planForm, enteralFormula: e.target.value })} /></Field>
        <Field label="Rate ml/hour"><input type="number" value={planForm.rateMlPerHour} onChange={(e) => setPlanForm({ ...planForm, rateMlPerHour: e.target.value })} /></Field>
        <Field label="Total volume ml/day"><input type="number" value={planForm.totalVolumeMlDay} onChange={(e) => setPlanForm({ ...planForm, totalVolumeMlDay: e.target.value })} /></Field>
        <Field label="Monitoring parameters" wide><input value={planForm.monitoringParameters} onChange={(e) => setPlanForm({ ...planForm, monitoringParameters: e.target.value })} /></Field>
        <Field label="Review date"><input type="date" value={planForm.reviewDate} onChange={(e) => setPlanForm({ ...planForm, reviewDate: e.target.value })} /></Field>
      </div></NutritionModal> : null}

      {modal === "enteral" ? <NutritionModal tone="blue" title="Enteral Feeding Record" subtitle="Track feed volume, tolerance, rate changes, and under-delivery alerts below 80%." onSubmit={saveEnteral} onClose={() => setModal("")} saving={saving === "enteral"} saveText="Save Feed Record"><div className="nutrition-form-grid">
        <Field label="Date"><input type="date" value={enteralForm.administeredDate} onChange={(e) => setEnteralForm({ ...enteralForm, administeredDate: e.target.value })} /></Field>
        <Field label="Time"><input type="time" value={enteralForm.administeredTime} onChange={(e) => setEnteralForm({ ...enteralForm, administeredTime: e.target.value })} /></Field>
        <Field label="Delivered volume ml"><input type="number" value={enteralForm.deliveredVolumeMl} onChange={(e) => setEnteralForm({ ...enteralForm, deliveredVolumeMl: e.target.value })} /></Field>
        <Field label="Prescribed volume ml"><input type="number" value={enteralForm.prescribedVolumeMl} onChange={(e) => setEnteralForm({ ...enteralForm, prescribedVolumeMl: e.target.value })} /></Field>
        <Field label="Rate ml/hour"><input type="number" value={enteralForm.rateMlPerHour} onChange={(e) => setEnteralForm({ ...enteralForm, rateMlPerHour: e.target.value })} /></Field>
        <Field label="Tolerance"><input value={enteralForm.tolerance} onChange={(e) => setEnteralForm({ ...enteralForm, tolerance: e.target.value })} /></Field>
        <label className="nutrition-check"><input type="checkbox" checked={enteralForm.vomiting} onChange={(e) => setEnteralForm({ ...enteralForm, vomiting: e.target.checked })} /> Vomiting</label>
        <Field label="Aspirate ml"><input type="number" value={enteralForm.aspirateMl} onChange={(e) => setEnteralForm({ ...enteralForm, aspirateMl: e.target.value })} /></Field>
        <Field label="Bowel activity"><input value={enteralForm.bowelActivity} onChange={(e) => setEnteralForm({ ...enteralForm, bowelActivity: e.target.value })} /></Field>
        <Field label="Rate change" wide><input value={enteralForm.rateChange} onChange={(e) => setEnteralForm({ ...enteralForm, rateChange: e.target.value })} /></Field>
      </div></NutritionModal> : null}

      {modal === "tpn" ? <NutritionModal tone="purple" title="TPN Prescription" subtitle="TPN components are checked for safe ranges and require dietitian plus doctor approval." onSubmit={saveTpn} onClose={() => setModal("")} saving={saving === "tpn"} saveText="Save TPN Order"><div className="nutrition-form-grid">
        <Field label="Patient" wide><select required value={tpnForm.patientId} onChange={(e) => setTpnForm({ ...tpnForm, patientId: e.target.value })}><option value="">Select patient</option>{patients.map((patient) => <option key={patient.id} value={patient.id}>{patientName(patient)} | {patient.patientCode || patient.mrn || "No MRN"}</option>)}</select></Field>
        {["dextroseG", "aminoAcidsG", "lipidsG", "sodiumMmol", "potassiumMmol", "calciumMmol", "magnesiumMmol", "phosphateMmol"].map((key) => <Field key={key} label={key}><input type="number" value={(tpnForm as any)[key]} onChange={(e) => setTpnForm({ ...tpnForm, [key]: e.target.value })} /></Field>)}
        <Field label="Trace elements"><input value={tpnForm.traceElements} onChange={(e) => setTpnForm({ ...tpnForm, traceElements: e.target.value })} /></Field>
        <Field label="Vitamins"><input value={tpnForm.vitamins} onChange={(e) => setTpnForm({ ...tpnForm, vitamins: e.target.value })} /></Field>
        <Field label="Renal function" wide><input value={tpnForm.renalFunction} onChange={(e) => setTpnForm({ ...tpnForm, renalFunction: e.target.value })} /></Field>
        <Field label="Hepatic function" wide><input value={tpnForm.hepaticFunction} onChange={(e) => setTpnForm({ ...tpnForm, hepaticFunction: e.target.value })} /></Field>
        <Field label="Electrolyte summary" wide><textarea value={tpnForm.electrolyteSummary} onChange={(e) => setTpnForm({ ...tpnForm, electrolyteSummary: e.target.value })} /></Field>
        <Field label="Metabolic needs" wide><textarea value={tpnForm.metabolicNeeds} onChange={(e) => setTpnForm({ ...tpnForm, metabolicNeeds: e.target.value })} /></Field>
      </div></NutritionModal> : null}

      {modal === "tpn-approval" ? <NutritionModal tone="warning" title="TPN Dual Approval" subtitle="TPN must be approved by both dietitian and prescribing doctor before pharmacy preparation." onSubmit={saveTpnApproval} onClose={() => setModal("")} saving={saving === "tpn-approval"} saveText="Save Approval"><div className="nutrition-form-grid">
        <Field label="TPN order"><select required value={tpnApprovalForm.tpnOrderId} onChange={(e) => setTpnApprovalForm({ ...tpnApprovalForm, tpnOrderId: e.target.value })}><option value="">Select TPN order</option>{tpnOrders.map((order) => <option key={order.tpnOrderId} value={order.tpnOrderId}>{order.patientName || order.patientId} | {order.status}</option>)}</select></Field>
        <Field label="Approval role"><select value={tpnApprovalForm.role} onChange={(e) => setTpnApprovalForm({ ...tpnApprovalForm, role: e.target.value })}><option>DIETITIAN</option><option>DOCTOR</option></select></Field>
        <Field label="Approval notes" wide><textarea value={tpnApprovalForm.approvalNotes} onChange={(e) => setTpnApprovalForm({ ...tpnApprovalForm, approvalNotes: e.target.value })} /></Field>
      </div></NutritionModal> : null}

      {modal === "trend" ? <NutritionModal tone="teal" title="Weight and Nutrition Trend" subtitle="Track weight, calorie intake, protein intake, and visualise gaps against requirements." onSubmit={saveTrend} onClose={() => setModal("")} saving={saving === "trend"} saveText="Save Trend"><div className="nutrition-form-grid">
        <Field label="Patient" wide><select required value={trendForm.patientId} onChange={(e) => setTrendForm({ ...trendForm, patientId: e.target.value })}><option value="">Select patient</option>{patients.map((patient) => <option key={patient.id} value={patient.id}>{patientName(patient)} | {patient.patientCode || patient.mrn || "No MRN"}</option>)}</select></Field>
        <Field label="Date"><input type="date" value={trendForm.recordedDate} onChange={(e) => setTrendForm({ ...trendForm, recordedDate: e.target.value })} /></Field>
        <Field label="Time"><input type="time" value={trendForm.recordedTime} onChange={(e) => setTrendForm({ ...trendForm, recordedTime: e.target.value })} /></Field>
        <Field label="Weight kg"><input type="number" value={trendForm.weightKg} onChange={(e) => setTrendForm({ ...trendForm, weightKg: e.target.value })} /></Field>
        <Field label="Kcal intake"><input type="number" value={trendForm.kcalIntake} onChange={(e) => setTrendForm({ ...trendForm, kcalIntake: e.target.value })} /></Field>
        <Field label="Kcal requirement"><input type="number" value={trendForm.kcalRequirement} onChange={(e) => setTrendForm({ ...trendForm, kcalRequirement: e.target.value })} /></Field>
        <Field label="Protein intake g"><input type="number" value={trendForm.proteinIntakeG} onChange={(e) => setTrendForm({ ...trendForm, proteinIntakeG: e.target.value })} /></Field>
        <Field label="Protein requirement g"><input type="number" value={trendForm.proteinRequirementG} onChange={(e) => setTrendForm({ ...trendForm, proteinRequirementG: e.target.value })} /></Field>
      </div></NutritionModal> : null}
    </div>
  );
}

function Field({ label, wide, children }: { label: string; wide?: boolean; children: ReactNode }) {
  return <label className={wide ? "wide" : ""}><span>{label}</span>{children}</label>;
}

function NutritionInfo({ title, rows }: { title: string; rows: Array<[string, ReactNode]> }) {
  return <div className="nutrition-info-card"><h3>{title}</h3>{rows.map(([label, value]) => <p key={label}><span>{label}</span><strong>{value}</strong></p>)}</div>;
}

function NutritionModal({ tone = "success", title, subtitle, onClose, onSubmit, saving, saveText, children }: { tone?: "success" | "info" | "blue" | "purple" | "warning" | "teal"; title: string; subtitle: string; onClose: () => void; onSubmit: (event: FormEvent) => void; saving: boolean; saveText: string; children: ReactNode }) {
  return (
    <div className="module-modal-backdrop nutrition-modal-backdrop" role="presentation" onClick={onClose}>
      <form className={`module-modal nutrition-modal tone-${tone}`} onSubmit={onSubmit} onClick={(event) => event.stopPropagation()}>
        <div className="module-modal-header">
          <div className="nutrition-modal-heading"><span className="nutrition-modal-kicker">NUTRITION &amp; DIETETICS</span><h3><UtensilsCrossed size={19} /> {title}</h3><p>{subtitle}</p></div>
          <div className="nutrition-modal-header-tools"><span className="nutrition-modal-badge">Clinical form</span><button type="button" className="module-modal-close" aria-label={`Close ${title}`} onClick={onClose}><X size={18} /></button></div>
        </div>
        {children}
        <div className="module-modal-footer">
          <button type="button" className="nursing-secondary-btn nutrition-cancel-btn" onClick={onClose}>Cancel</button>
          <button type="submit" className="nursing-action-btn" disabled={saving}><CheckCircle2 size={15} /> {saving ? "Saving..." : saveText}</button>
        </div>
      </form>
    </div>
  );
}

