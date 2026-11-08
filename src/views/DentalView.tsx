import React, { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Camera,
  CheckCircle2,
  ClipboardList,
  DollarSign,
  Eye,
  FileText,
  Maximize2,
  Minimize2,
  Pill,
  Plus,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import { api } from "../lib/api";
import { useLiveRefresh } from "../lib/liveRefresh";

const permanentTeeth = [
  "18", "17", "16", "15", "14", "13", "12", "11", "21", "22", "23", "24", "25", "26", "27", "28",
  "48", "47", "46", "45", "44", "43", "42", "41", "31", "32", "33", "34", "35", "36", "37", "38",
];
const deciduousTeeth = ["55", "54", "53", "52", "51", "61", "62", "63", "64", "65", "85", "84", "83", "82", "81", "71", "72", "73", "74", "75"];
const surfaces = ["M", "D", "B", "L", "O"];
const conditionOptions = ["SOUND", "CARIES", "FILLED", "CROWN", "BRIDGE_ABUTMENT", "MISSING", "IMPLANT", "PARTIAL_ERUPTION", "IMPACTED", "FRACTURED"];
const procedureCodes = [
  ["D0150", "Comprehensive oral examination", 1500],
  ["D1110", "Scaling and polishing", 3500],
  ["D2391", "Composite restoration - one surface", 4500],
  ["D2392", "Composite restoration - two surfaces", 6500],
  ["D2740", "Ceramic crown", 28000],
  ["D3310", "Root canal anterior", 18000],
  ["D7140", "Simple extraction", 5000],
  ["D7210", "Surgical extraction", 12000],
  ["D6010", "Dental implant placement", 85000],
  ["D4341", "Periodontal debridement quadrant", 9000],
] as const;

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
const patientName = (row: any) => [row?.firstName, row?.lastName].filter(Boolean).join(" ") || row?.patientCode || row?.mrn || "Unnamed patient";
const formatDate = (value: any) => {
  const date = new Date(String(value || ""));
  if (!Number.isFinite(date.getTime())) return "Not recorded";
  return date.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
};
const money = (value: any) => `KES ${Number(value || 0).toLocaleString()}`;
const toneFromNotice = (notice: string) => (/failed|could not|required|alert|select|missing/i.test(notice) ? "warning" : "success");

export default function DentalView() {
  const [dashboard, setDashboard] = useState<any>({});
  const [charts, setCharts] = useState<any[]>([]);
  const [procedures, setProcedures] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [radiographs, setRadiographs] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [instructions, setInstructions] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedChartId, setSelectedChartId] = useState("");
  const [selectedTooth, setSelectedTooth] = useState("11");
  const [search, setSearch] = useState("");
  const [dentition, setDentition] = useState<"PERMANENT" | "DECIDUOUS">("PERMANENT");
  const [conditionFilter, setConditionFilter] = useState("ALL");
  const [modal, setModal] = useState("");
  const [saving, setSaving] = useState("");
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [workflowPopup, setWorkflowPopup] = useState<"monitor" | "waiting" | "queue" | "">("");
  const [waitingRows, setWaitingRows] = useState<any[]>([]);
  const [workflowLoading, setWorkflowLoading] = useState(false);
  const [queuePatientId, setQueuePatientId] = useState("");
  const [waitingCheckInDate, setWaitingCheckInDate] = useState(todayValue());

  const [chartForm, setChartForm] = useState({ patientId: "", chartDate: todayValue(), occlusion: "", oralHygiene: "Fair", plaqueIndex: "", gingivalIndex: "", notes: "" });
  const [toothForm, setToothForm] = useState({ toothNumber: "11", condition: "CARIES", surfaces: [] as string[], materialType: "", notes: "" });
  const [periodontalForm, setPeriodontalForm] = useState({ toothNumber: "11", mesiobuccal: "2", buccal: "2", distobuccal: "2", mesiolingual: "2", lingual: "2", distolingual: "2", recessionMm: "0", mobilityGrade: "0", furcationInvolvement: "NONE", bleedingOnProbing: false });
  const [planForm, setPlanForm] = useState({ patientId: "", chartId: "", notes: "", toothNumber: "11", procedureCode: "D2391", surfaces: [] as string[], cost: "4500", urgency: "SOON" });
  const [procedureForm, setProcedureForm] = useState({ chartId: "", toothNumber: "11", procedureCode: "D2391", procedureName: "", surfaces: [] as string[], anaesthesiaType: "", anaestheticDrug: "", materialsUsed: "", complications: "", postOpInstructions: "", followUpRequired: false, performedDate: todayValue(), performedTime: nowTime() });
  const [radiographForm, setRadiographForm] = useState({ patientId: "", type: "BITEWING", toothRegion: "Posterior bitewings", clinicalIndication: "" });
  const [interpretationForm, setInterpretationForm] = useState({ radiographOrderId: "", cariesDepth: "", boneLevels: "", rootMorphology: "", pathology: "", interpretation: "" });
  const [prescriptionForm, setPrescriptionForm] = useState({ patientId: "", medication: "", dosage: "", frequency: "", duration: "", notes: "" });
  const [instructionForm, setInstructionForm] = useState({ patientId: "", procedureId: "", instructionType: "POST_EXTRACTION", instructionText: "" });

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
      const [dashRes, chartRes, procRes, planRes, radioRes, rxRes, instructionRes, patientRes] = await Promise.all([
        safeGet("/dental/dashboard", "dashboard", {}),
        safeGet("/dental/charts", "dental charts", []),
        safeGet("/dental/procedures", "procedures", []),
        safeGet("/dental/treatment-plans", "treatment plans", []),
        safeGet("/dental/radiographs", "radiographs", []),
        safeGet("/dental/prescriptions", "prescriptions", []),
        safeGet("/dental/instructions", "instructions", []),
        safeGet("/patients", "patients", [], { params: { limit: 500 } }),
      ]);
      const chartRows = unwrapRows(chartRes.data);
      const dashboardData = unwrapObject(dashRes.data);
      const chartList = unwrapRows(chartRes.data);
      const procedureList = unwrapRows(procRes.data);
      const planList = unwrapRows(planRes.data);
      const radiographList = unwrapRows(radioRes.data);
      const prescriptionList = unwrapRows(rxRes.data);
      const failed = [dashRes, chartRes, procRes, planRes, radioRes, rxRes, instructionRes, patientRes].filter((response: any) => response.__error);
      if (failed.length) setToast(`${failed.map((response: any) => `${response.__label}${response.__status ? ` (${response.__status})` : ""}`).join(", ")} could not be loaded. Check your connection or permissions.`);
      const totals = dashboardData?.totals || {};
      setDashboard({ ...dashboardData, totals: {
        charts: totals.charts ?? chartList.length,
        periodontalAlerts: totals.periodontalAlerts ?? chartList.reduce((count: number, row: any) => count + (row.periodontalChart?.alerts?.length || 0), 0),
        radiographs: totals.radiographs ?? radiographList.length,
        prescriptions: totals.prescriptions ?? prescriptionList.length,
        completedProcedures: totals.completedProcedures ?? procedureList.length,
      }});
      setCharts(chartRows);
      setProcedures(procedureList);
      setPlans(planList);
      setRadiographs(radiographList);
      setPrescriptions(prescriptionList);
      setInstructions(unwrapRows(instructionRes.data));
      setPatients(unwrapRows(patientRes.data));
      setSelectedChartId((current) => chartRows.some((row: any) => row.id === current) ? current : chartRows[0]?.id || "");
    } catch (error: any) {
      setToast(error?.response?.data?.message || "Dental data could not be loaded.");
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
      if (detail?.moduleKey !== "dental") return;
      setWorkflowPopup("waiting");
      setWorkflowLoading(true);
      api.get("/opd/queue/board", { params: { departmentId: "DENTAL" } })
        .then((response: any) => setWaitingRows(unwrapRows(response.data)))
        .catch(() => { setWaitingRows([]); setToast("Dental waiting list could not be loaded."); })
        .finally(() => setWorkflowLoading(false));
    };
    window.addEventListener("hmis:dental-sidebar-action", handleSidebarAction);
    window.addEventListener("hmis:open-module-waiting-list", handleWaitingList);
    return () => {
      window.removeEventListener("hmis:dental-sidebar-action", handleSidebarAction);
      window.removeEventListener("hmis:open-module-waiting-list", handleWaitingList);
    };
  }, []);

  const patientLabel = (patientId: string) => {
    const patient = patients.find((row) => row.id === patientId);
    return patient ? `${patientName(patient)} | ${patient.patientCode || patient.mrn || "No MRN"}` : patientId || "-";
  };
  const selectedChart = useMemo(() => charts.find((row) => row.id === selectedChartId) || charts[0] || null, [charts, selectedChartId]);
  const selectedPatientId = selectedChart?.patientId || "";
  const selectedPlans = plans.filter((row) => row.patientId === selectedPatientId);
  const selectedPlan = selectedPlans[0] || null;
  const selectedRadiographs = radiographs.filter((row) => row.patientId === selectedPatientId);
  const selectedProcedures = procedures.filter((row) => row.patientId === selectedPatientId);
  const selectedPrescriptions = prescriptions.filter((row) => row.patientId === selectedPatientId);
  const selectedInstructions = instructions.filter((row) => row.patientId === selectedPatientId);
  const teethStatus = selectedChart?.teethStatus || {};
  const selectedToothStatus = teethStatus[selectedTooth] || { condition: "SOUND", surfaces: [] };
  const filteredCharts = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filteredByCondition = charts.filter((row) => {
      if (conditionFilter === "ALL") return true;
      return Object.values(row.teethStatus || {}).some((status: any) => String(status?.condition || "").toUpperCase() === conditionFilter);
    });
    if (!q) return filteredByCondition;
    return filteredByCondition.filter((row) => `${patientLabel(row.patientId)} ${row.notes} ${row.oralHygiene} ${row.occlusion} ${Object.values(row.teethStatus || {}).map((status: any) => status?.condition).join(" ")}`.toLowerCase().includes(q));
  }, [charts, patients, search, conditionFilter]);
  const totalPendingCost = selectedPlans.flatMap((plan) => plan.procedures || []).filter((row: any) => row.status !== "COMPLETED").reduce((sum: number, row: any) => sum + Number(row.cost || 0), 0);
  const allPendingCost = plans.flatMap((plan) => plan.procedures || []).filter((row: any) => String(row.status || "").toUpperCase() !== "COMPLETED").reduce((sum: number, row: any) => sum + Number(row.cost || 0), 0);
  const periodontalAlerts = selectedChart?.periodontalChart?.alerts || [];
  const selectedActivityRows = [
    ...selectedRadiographs.map((row) => ({ kind: "Radiograph", detail: `${row.type || "-"} | ${row.toothRegion || "-"}`, status: row.status || "REQUESTED", recorded: row.orderedAt || row.updatedAt, action: row.pacsViewerUrl, id: row.radiographOrderId })),
    ...selectedPrescriptions.map((row) => ({ kind: "Prescription", detail: `${row.medication || "-"} ${row.dosage || ""}`, status: row.pharmacyQueueStatus || "POSTED", recorded: row.prescribedAt || row.loggedAt, action: "", id: row.dentalPrescriptionId })),
    ...selectedInstructions.map((row) => ({ kind: "Instruction", detail: row.instructionType || "-", status: row.printed ? "PRINTED" : "SAVED", recorded: row.issuedAt || row.loggedAt, action: "", id: row.instructionId })),
  ];
  const totals = dashboard?.totals || {};
  const statCards = [
    { label: "Charts", value: totals.charts || 0, color: "#2563eb", icon: ClipboardList, action: () => { setSearch(""); setConditionFilter("ALL"); } },
    { label: "Pending Cost", value: money(allPendingCost), color: "#16a34a", icon: DollarSign, action: () => setToast(`${money(allPendingCost)} pending across ${plans.length} treatment plan${plans.length === 1 ? "" : "s"}.`) },
    { label: "Perio Alerts", value: periodontalAlerts.length || totals.periodontalAlerts || 0, color: "#dc2626", icon: AlertTriangle, action: () => openPeriodontal() },
    { label: "Radiographs", value: totals.radiographs ?? radiographs.length, color: "#7c3aed", icon: Camera, action: () => openRadiograph() },
    { label: "Prescriptions", value: totals.prescriptions ?? prescriptions.length, color: "#0891b2", icon: Pill, action: () => openPrescription() },
    { label: "Completed", value: totals.completedProcedures ?? procedures.length, color: "#d97706", icon: CheckCircle2, action: () => openProcedure() },
  ];

  const requireChart = () => {
    if (selectedChart?.id) return true;
    setToast("Create or select a dental chart first.");
    return false;
  };
  const closeAfter = async (message: string) => {
    setToast(message);
    setModal("");
    await load();
  };
  const openChart = () => {
    setChartForm({ patientId: selectedPatientId, chartDate: todayValue(), occlusion: "", oralHygiene: "Fair", plaqueIndex: "", gingivalIndex: "", notes: "" });
    setModal("chart");
  };
  const openTooth = (tooth = selectedTooth) => {
    if (!requireChart()) return;
    const status = teethStatus[tooth] || {};
    setSelectedTooth(tooth);
    setToothForm({ toothNumber: tooth, condition: status.condition || "CARIES", surfaces: Array.isArray(status.surfaces) ? status.surfaces : [], materialType: status.material || "", notes: status.notes || "" });
    setModal("tooth");
  };
  const openPeriodontal = () => {
    if (!requireChart()) return;
    setPeriodontalForm((current) => ({ ...current, toothNumber: selectedTooth }));
    setModal("periodontal");
  };
  const openPlan = () => {
    if (!requireChart()) return;
    setPlanForm((current) => ({ ...current, patientId: selectedPatientId, chartId: selectedChart.id, toothNumber: selectedTooth }));
    setModal("plan");
  };
  const openProcedure = () => {
    if (!requireChart()) return;
    setProcedureForm((current) => ({ ...current, chartId: selectedChart.id, toothNumber: selectedTooth }));
    setModal("procedure");
  };
  const openRadiograph = () => {
    if (!requireChart()) return;
    setRadiographForm((current) => ({ ...current, patientId: selectedPatientId, toothRegion: selectedTooth }));
    setModal("radiograph");
  };
  const openInterpretation = () => {
    if (!selectedRadiographs.length) {
      setToast("Order a dental radiograph first.");
      return;
    }
    setInterpretationForm((current) => ({ ...current, radiographOrderId: selectedRadiographs[0]?.radiographOrderId || current.radiographOrderId }));
    setModal("interpretation");
  };
  const openPrescription = () => {
    if (!requireChart()) return;
    setPrescriptionForm((current) => ({ ...current, patientId: selectedPatientId }));
    setModal("prescription");
  };
  const openInstruction = () => {
    if (!requireChart()) return;
    setInstructionForm((current) => ({ ...current, patientId: selectedPatientId, procedureId: selectedProcedures[0]?.id || "" }));
    setModal("instruction");
  };

  const saveChart = (event: FormEvent) => {
    event.preventDefault();
    setSaving("chart");
    api.post("/dental/charts", chartForm)
      .then((res: any) => { setSelectedChartId(res.data?.id || ""); return closeAfter("FDI dental chart created."); })
      .catch((error: any) => setToast(error?.response?.data?.message || "Dental chart could not be created."))
      .finally(() => setSaving(""));
  };
  const saveTooth = (event: FormEvent) => {
    event.preventDefault();
    if (!requireChart()) return;
    setSaving("tooth");
    api.patch(`/dental/charts/${selectedChart.id}/tooth`, toothForm)
      .then(() => closeAfter(`Tooth ${toothForm.toothNumber} updated on dental chart.`))
      .catch((error: any) => setToast(error?.response?.data?.message || "Tooth charting could not be saved."))
      .finally(() => setSaving(""));
  };
  const savePeriodontal = (event: FormEvent) => {
    event.preventDefault();
    if (!requireChart()) return;
    setSaving("periodontal");
    api.post(`/dental/charts/${selectedChart.id}/periodontal`, periodontalForm)
      .then(() => closeAfter("Periodontal chart saved with pocket-depth comparison."))
      .catch((error: any) => setToast(error?.response?.data?.message || "Periodontal record could not be saved."))
      .finally(() => setSaving(""));
  };
  const savePlan = (event: FormEvent) => {
    event.preventDefault();
    setSaving("plan");
    const code = procedureCodes.find(([item]) => item === planForm.procedureCode);
    api.post("/dental/treatment-plans", { ...planForm, procedures: [{ ...planForm, procedureName: code?.[1], cost: planForm.cost || code?.[2] }] })
      .then((res: any) => closeAfter(`Treatment plan saved. Estimated total: ${money(res.data?.totalCost)}.`))
      .catch((error: any) => setToast(error?.response?.data?.message || "Treatment plan could not be saved."))
      .finally(() => setSaving(""));
  };
  const completePlanItem = (planId: string, itemId: string) => {
    setSaving(itemId);
    api.patch(`/dental/treatment-plans/${planId}/item`, { itemId, status: "COMPLETED" })
      .then(() => closeAfter("Treatment plan item marked completed."))
      .catch((error: any) => setToast(error?.response?.data?.message || "Treatment plan item could not be updated."))
      .finally(() => setSaving(""));
  };
  const saveProcedure = (event: FormEvent) => {
    event.preventDefault();
    setSaving("procedure");
    const code = procedureCodes.find(([item]) => item === procedureForm.procedureCode);
    api.post("/dental/procedures", { ...procedureForm, procedureName: procedureForm.procedureName || code?.[1], performedAt: dateTimeValue(procedureForm.performedDate, procedureForm.performedTime) })
      .then(() => closeAfter("Dental procedure recorded."))
      .catch((error: any) => setToast(error?.response?.data?.message || "Dental procedure could not be recorded."))
      .finally(() => setSaving(""));
  };
  const saveRadiograph = (event: FormEvent) => {
    event.preventDefault();
    setSaving("radiograph");
    api.post("/dental/radiographs", radiographForm)
      .then(() => closeAfter("Dental radiograph requested and linked to Radiology/PACS."))
      .catch((error: any) => setToast(error?.response?.data?.message || "Dental radiograph could not be requested."))
      .finally(() => setSaving(""));
  };
  const saveInterpretation = (event: FormEvent) => {
    event.preventDefault();
    if (!interpretationForm.radiographOrderId) {
      setToast("Select a radiograph order first.");
      return;
    }
    setSaving("interpretation");
    api.post(`/dental/radiographs/${interpretationForm.radiographOrderId}/interpretation`, interpretationForm)
      .then(() => closeAfter("Dental radiograph interpretation saved and linked."))
      .catch((error: any) => setToast(error?.response?.data?.message || "Radiograph interpretation could not be saved."))
      .finally(() => setSaving(""));
  };
  const savePrescription = (event: FormEvent) => {
    event.preventDefault();
    setSaving("prescription");
    api.post("/dental/prescriptions", prescriptionForm)
      .then(() => closeAfter("Dental prescription posted to Pharmacy queue for CDSS checks."))
      .catch((error: any) => setToast(error?.response?.data?.message || "Dental prescription could not be posted."))
      .finally(() => setSaving(""));
  };
  const saveInstruction = (event: FormEvent) => {
    event.preventDefault();
    setSaving("instruction");
    api.post("/dental/instructions", instructionForm)
      .then(() => closeAfter("Post-procedure instruction sheet printed and saved to notes."))
      .catch((error: any) => setToast(error?.response?.data?.message || "Instruction sheet could not be saved."))
      .finally(() => setSaving(""));
  };

  const queueSelectedPatient = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!queuePatientId) {
      setToast("Select a registered patient before adding them to the Dental queue.");
      return;
    }
    setSaving("queue-patient");
    try {
      await api.post("/opd/queue/token", { patientId: queuePatientId, departmentId: "DENTAL", queueType: "DENTAL", priority: "NORMAL" });
      setWorkflowPopup("");
      setQueuePatientId("");
      setToast("Patient added to the Dental waiting list.");
    } catch (error: any) {
      setToast(error?.response?.data?.message || "Patient could not be added to the Dental queue.");
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
      await api.patch("/opd/queue/token/status", { tokenNumber, status: checkingOut ? "COMPLETED" : "IN_SERVICE", checkInDate: waitingCheckInDate, reason: checkingOut ? "Checked out from Dental waiting list" : "Checked in from Dental waiting list" });
      setToast(`${row.patientName || row.patientCode || "Patient"} ${checkingOut ? "checked out from" : "checked in for"} Dental.`);
      await load();
    } catch (error: any) {
      setToast(error?.response?.data?.message || "Dental patient check-in failed.");
    } finally {
      setSaving("");
    }
  };

  return (
    <div className="nursing-view dental-view">
      <div className="pv-header">
        <div>
          <h2 className="pv-title">Dental Clinic</h2>
          <p className="pv-subtitle">FDI dental charting, periodontal comparison, treatment estimates, dental radiographs, prescriptions, and patient instructions.</p>
        </div>
        <div className="nursing-header-actions">
          <button type="button" className="nursing-secondary-btn" onClick={load}><RefreshCw size={15} /> Refresh</button>
          <button type="button" className="nursing-action-btn" onClick={openChart}><Plus size={15} /> New Chart</button>
          <button type="button" className="nursing-action-btn is-blue" onClick={() => openTooth()}><Activity size={15} /> Chart Tooth</button>
        </div>
      </div>

      {notice ? (
        <div className={`module-notice-toast is-${toneFromNotice(notice)}`} role="status" aria-live="polite">
          <div><strong>Dental</strong><span>{notice}</span></div>
          <button type="button" className="module-notice-close" onClick={() => setNotice("")}>x</button>
        </div>
      ) : null}

      {workflowPopup ? (
        <div className="dental-workflow-backdrop" role="presentation" onClick={() => setWorkflowPopup("")}>
          <section className="dental-workflow-modal" role="dialog" aria-modal="true" aria-labelledby="dental-workflow-title" onClick={(event) => event.stopPropagation()}>
            <header>
              <div><span>DENTAL CLINIC WORKSPACE</span><h2 id="dental-workflow-title">{workflowPopup === "monitor" ? "Monitor dental patients" : workflowPopup === "waiting" ? "Dental waiting list" : "Queue a patient"}</h2><p>{workflowPopup === "monitor" ? "Select an active chart to open the patient dental workspace." : workflowPopup === "waiting" ? "Review referrals and patients sent to Dental from other services." : "Route a registered patient to the Dental specialty queue."}</p></div>
              <button type="button" aria-label="Close Dental workspace" onClick={() => setWorkflowPopup("")}><X size={17} /></button>
            </header>
            <div className="dental-workflow-body">
              {workflowPopup === "monitor" ? (
                <div className="dental-workflow-list">
                  {charts.length ? charts.slice(0, 50).map((row) => <button key={row.id} type="button" onClick={() => { setSelectedChartId(row.id); setWorkflowPopup(""); }}><strong>{patientLabel(row.patientId)}</strong><span>{row.occlusion || "Dental chart"} · {formatDate(row.chartDate)}</span></button>) : <p className="dental-workflow-note">No dental charts are available to monitor.</p>}
                </div>
              ) : null}
              {workflowPopup === "waiting" ? (
                <div>
                  <label className="dental-workflow-date"><span>Check-in date</span><input type="date" value={waitingCheckInDate} onChange={(event) => setWaitingCheckInDate(event.target.value)} /></label>
                  {workflowLoading ? <p className="dental-workflow-note">Loading Dental waiting list...</p> : waitingRows.length ? <div className="dental-workflow-list">{waitingRows.map((row, index) => <div className="dental-workflow-list-item" key={row.id || row.tokenId || row.tokenNumber || index}><button type="button" onClick={() => { const chart = charts.find((item) => item.patientId === row.patientId); if (chart) setSelectedChartId(chart.id); setWorkflowPopup(""); }}><strong>{row.patientName || row.patientCode || patientLabel(row.patientId)}</strong><span>Token {row.tokenNumber || row.token || "-"} · {row.status || "WAITING"} · From {row.sourceModule || row.departmentName || row.departmentId || "another service"}</span></button><button type="button" className="dental-workflow-checkin" disabled={saving === "check-in"} onClick={() => void checkInQueuedPatient(row)}>{saving === "check-in" ? "Updating..." : String(row.status || "").toUpperCase() === "IN_SERVICE" ? "Check Out" : "Check In"}</button></div>)}</div> : <p className="dental-workflow-note">No patients are currently waiting for Dental.</p>}
                </div>
              ) : null}
              {workflowPopup === "queue" ? <form className="dental-workflow-form" onSubmit={queueSelectedPatient}><label><span>Registered patient</span><select required value={queuePatientId} onChange={(event) => setQueuePatientId(event.target.value)}><option value="">Select a patient</option>{patients.map((patient) => <option key={patient.id} value={patient.id}>{patientName(patient)} | {patient.patientCode || patient.mrn || "No MRN"}</option>)}</select></label><footer><button type="button" className="nursing-secondary-btn" onClick={() => setWorkflowPopup("")}>Cancel</button><button type="submit" className="nursing-action-btn" disabled={saving === "queue-patient"}><ClipboardList size={15} /> {saving === "queue-patient" ? "Queueing..." : "Queue Patient"}</button></footer></form> : null}
            </div>
          </section>
        </div>
      ) : null}

      <div className="pv-stats nursing-stats-grid">
        {statCards.map(({ label, value, color, icon: Icon, action }) => (
          <button key={label} type="button" className="pv-stat-card dental-stat-card" style={{ borderLeftColor: color }} onClick={action}>
            <p className="pv-stat-label">{label}</p>
            <p className="pv-stat-value">{loading ? "..." : value}</p>
            <Icon className="dental-stat-icon" size={19} style={{ color }} />
          </button>
        ))}
      </div>

      <div className="dental-layout">
        <section className="nursing-worklist">
          <div className="pv-search-bar dental-filter-bar">
            <div className="pv-search-wrap">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input className="pv-search" placeholder="Search patient, MRN, chart notes..." value={search} onChange={(event) => setSearch(event.target.value)} />
            </div>
            <select className="nursing-filter-select" value={dentition} onChange={(event) => setDentition(event.target.value as any)}>
              <option value="PERMANENT">Permanent</option>
              <option value="DECIDUOUS">Deciduous</option>
            </select>
            <select className="nursing-filter-select" value={conditionFilter} onChange={(event) => setConditionFilter(event.target.value)}>
              <option value="ALL">All conditions</option>
              {conditionOptions.filter((item) => item !== "SOUND").map((item) => <option key={item} value={item}>{item.replace(/_/g, " ")}</option>)}
            </select>
          </div>
          <div className="pv-table-wrap">
            <table className="pv-table">
              <thead><tr><th>Patient</th><th>Chart Date</th><th>Hygiene</th><th>Notes</th></tr></thead>
              <tbody>
                {loading ? <tr><td colSpan={4} className="pv-empty">Loading dental charts...</td></tr> : filteredCharts.length === 0 ? <tr><td colSpan={4} className="pv-empty">No dental charts found.</td></tr> : filteredCharts.map((row) => (
                  <tr key={row.id} className={row.id === selectedChart?.id ? "nursing-selected-row" : ""} onClick={() => setSelectedChartId(row.id)}>
                    <td className="pv-name">{patientLabel(row.patientId)}</td>
                    <td>{formatDate(row.chartDate)}</td>
                    <td>{row.oralHygiene || "-"}</td>
                    <td>{row.notes || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="nursing-care-panel">
          <div className="nursing-care-header">
            <div>
              <span>Selected Dental Record</span>
              <strong>{selectedChart ? patientLabel(selectedChart.patientId) : "No dental chart selected"}</strong>
            </div>
            <span className="pv-badge is-info">FDI</span>
          </div>
          <div className="dental-action-row">
            <button type="button" className="dental-action-btn is-success" onClick={openPlan}><DollarSign size={14} /> Treatment Plan</button>
            <button type="button" className="dental-action-btn is-warning" onClick={openPeriodontal}><Activity size={14} /> Periodontal</button>
            <button type="button" className="dental-action-btn is-blue" onClick={openRadiograph}><Camera size={14} /> Order X-ray</button>
            <button type="button" className="dental-action-btn is-purple" onClick={openInterpretation}><Eye size={14} /> Interpretation</button>
            <button type="button" className="dental-action-btn is-teal" onClick={openPrescription}><Pill size={14} /> Prescription</button>
            <button type="button" className="dental-action-btn is-info" onClick={openInstruction}><FileText size={14} /> Instructions</button>
          </div>

          <div className="dental-chart-shell">
            <div className="dental-chart-header">
              <div><strong>Complete Dental Chart</strong><span>{dentition === "PERMANENT" ? "32 permanent teeth" : "20 deciduous teeth"} using FDI two-digit notation</span></div>
              <div><strong>Tooth {selectedTooth}</strong><span>{selectedToothStatus.condition || "SOUND"} {selectedToothStatus.surfaces?.length ? `| ${selectedToothStatus.surfaces.join(",")}` : ""}</span></div>
            </div>
            <div className="dental-teeth-grid">
              {(dentition === "PERMANENT" ? permanentTeeth : deciduousTeeth).map((tooth) => {
                const status = teethStatus[tooth]?.condition || "SOUND";
                return (
                  <button key={tooth} type="button" className={`dental-tooth is-${String(status).toLowerCase()}`} onClick={() => openTooth(tooth)}>
                    <span>{tooth}</span><small>{status.replace(/_/g, " ")}</small>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="dental-detail-grid">
            <DentalInfo title="Periodontal" rows={[["Alerts", periodontalAlerts.length], ["Last record", selectedChart?.periodontalChart?.lastRecordedAt ? formatDate(selectedChart.periodontalChart.lastRecordedAt) : "-"], ["Comparison", selectedChart?.periodontalChart?.comparisons?.[0]?.status || "-"]]} />
            <DentalInfo title="Treatment Estimate" rows={[["Plans", selectedPlans.length], ["Pending cost", money(totalPendingCost)], ["Pending items", selectedPlans.flatMap((plan) => plan.procedures || []).filter((row: any) => row.status !== "COMPLETED").length]]} />
            <DentalInfo title="Radiographs" rows={[["Orders", selectedRadiographs.length], ["Latest", selectedRadiographs[0]?.type || "-"], ["PACS", selectedRadiographs[0]?.pacsViewerUrl ? "Linked" : "-"]]} />
            <DentalInfo title="Aftercare" rows={[["Prescriptions", selectedPrescriptions.length], ["Instructions", selectedInstructions.length], ["Procedures", selectedProcedures.length]]} />
          </div>

          <div className="pv-table-wrap dental-plan-table">
            <table className="pv-table">
              <thead><tr><th>Seq</th><th>Tooth</th><th>Procedure</th><th>Cost</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>
                {!selectedPlan ? <tr><td colSpan={6} className="pv-empty">No treatment plan for this patient.</td></tr> : (selectedPlan.procedures || []).map((row: any) => (
                  <tr key={row.itemId}><td>{row.sequence}</td><td>{row.toothNumber}</td><td>{row.procedureName}</td><td>{money(row.cost)}</td><td><span className={`pv-badge ${row.status === "COMPLETED" ? "is-success" : row.urgency === "URGENT" ? "is-danger" : "is-warning"}`}>{row.status}</span></td><td><button type="button" className="pv-link-btn" disabled={row.status === "COMPLETED" || saving === row.itemId} onClick={() => completePlanItem(selectedPlan.treatmentPlanId, row.itemId)}>Complete</button></td></tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pv-table-wrap dental-plan-table">
            <table className="pv-table">
              <thead><tr><th>Type</th><th>Detail</th><th>Status</th><th>Recorded</th><th>Action</th></tr></thead>
              <tbody>
                {selectedActivityRows.length === 0 ? (
                  <tr><td colSpan={5} className="pv-empty">No radiographs, prescriptions, or instruction sheets recorded.</td></tr>
                ) : selectedActivityRows.map((row) => (
                  <tr key={`${row.kind}-${row.id}`}><td>{row.kind}</td><td>{row.detail}</td><td><span className="pv-badge is-info">{row.status}</span></td><td>{formatDate(row.recorded)}</td><td>{row.action ? <a className="pv-link-btn" href={row.action}>View PACS</a> : "-"}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {modal === "chart" ? <DentalModal tone="success" title="Create Complete Dental Chart" subtitle="Creates an FDI two-digit chart covering permanent and deciduous dentition." onSubmit={saveChart} onClose={() => setModal("")} saving={saving === "chart"} saveText="Create Chart"><div className="dental-form-grid">
        <Field label="Patient" wide><select required value={chartForm.patientId} onChange={(e) => setChartForm({ ...chartForm, patientId: e.target.value })}><option value="">Select patient</option>{patients.map((patient) => <option key={patient.id} value={patient.id}>{patientName(patient)} | {patient.patientCode || patient.mrn || "No MRN"}</option>)}</select></Field>
        <Field label="Chart date"><input type="date" value={chartForm.chartDate} onChange={(e) => setChartForm({ ...chartForm, chartDate: e.target.value })} /></Field>
        <Field label="Oral hygiene"><select value={chartForm.oralHygiene} onChange={(e) => setChartForm({ ...chartForm, oralHygiene: e.target.value })}><option>Good</option><option>Fair</option><option>Poor</option></select></Field>
        <Field label="Occlusion"><input value={chartForm.occlusion} onChange={(e) => setChartForm({ ...chartForm, occlusion: e.target.value })} /></Field>
        <Field label="Plaque index"><input type="number" value={chartForm.plaqueIndex} onChange={(e) => setChartForm({ ...chartForm, plaqueIndex: e.target.value })} /></Field>
        <Field label="Gingival index"><input type="number" value={chartForm.gingivalIndex} onChange={(e) => setChartForm({ ...chartForm, gingivalIndex: e.target.value })} /></Field>
        <Field label="Notes" wide><textarea value={chartForm.notes} onChange={(e) => setChartForm({ ...chartForm, notes: e.target.value })} /></Field>
      </div></DentalModal> : null}

      {modal === "tooth" ? <DentalModal tone="info" title={`Chart Tooth ${toothForm.toothNumber}`} subtitle="Select condition, surfaces, material, and notes. Chart updates visually after saving." onSubmit={saveTooth} onClose={() => setModal("")} saving={saving === "tooth"} saveText="Save Tooth"><div className="dental-form-grid">
        <Field label="Tooth number"><select value={toothForm.toothNumber} onChange={(e) => setToothForm({ ...toothForm, toothNumber: e.target.value })}>{[...permanentTeeth, ...deciduousTeeth].map((tooth) => <option key={tooth}>{tooth}</option>)}</select></Field>
        <Field label="Condition"><select value={toothForm.condition} onChange={(e) => setToothForm({ ...toothForm, condition: e.target.value })}>{conditionOptions.map((item) => <option key={item}>{item}</option>)}</select></Field>
        <Field label="Material type"><input value={toothForm.materialType} onChange={(e) => setToothForm({ ...toothForm, materialType: e.target.value })} placeholder="Composite, amalgam, ceramic..." /></Field>
        <SurfacePicker value={toothForm.surfaces} onChange={(next) => setToothForm({ ...toothForm, surfaces: next })} />
        <Field label="Notes" wide><textarea value={toothForm.notes} onChange={(e) => setToothForm({ ...toothForm, notes: e.target.value })} /></Field>
      </div></DentalModal> : null}

      {modal === "periodontal" ? <DentalModal tone="warning" title="Periodontal Charting" subtitle="Records six-point pocket depths, recession, mobility, furcation, bleeding, and comparison against the last record." onSubmit={savePeriodontal} onClose={() => setModal("")} saving={saving === "periodontal"} saveText="Save Periodontal"><div className="dental-form-grid">
        <Field label="Tooth number"><select value={periodontalForm.toothNumber} onChange={(e) => setPeriodontalForm({ ...periodontalForm, toothNumber: e.target.value })}>{permanentTeeth.map((tooth) => <option key={tooth}>{tooth}</option>)}</select></Field>
        {(["mesiobuccal", "buccal", "distobuccal", "mesiolingual", "lingual", "distolingual"] as const).map((key) => <Field key={key} label={`${key} mm`}><input type="number" min="0" value={periodontalForm[key]} onChange={(e) => setPeriodontalForm({ ...periodontalForm, [key]: e.target.value })} /></Field>)}
        <Field label="Recession mm"><input type="number" value={periodontalForm.recessionMm} onChange={(e) => setPeriodontalForm({ ...periodontalForm, recessionMm: e.target.value })} /></Field>
        <Field label="Mobility grade"><select value={periodontalForm.mobilityGrade} onChange={(e) => setPeriodontalForm({ ...periodontalForm, mobilityGrade: e.target.value })}><option>0</option><option>1</option><option>2</option><option>3</option></select></Field>
        <Field label="Furcation"><select value={periodontalForm.furcationInvolvement} onChange={(e) => setPeriodontalForm({ ...periodontalForm, furcationInvolvement: e.target.value })}><option>NONE</option><option>CLASS_I</option><option>CLASS_II</option><option>CLASS_III</option></select></Field>
        <label className="dental-check"><input type="checkbox" checked={periodontalForm.bleedingOnProbing} onChange={(e) => setPeriodontalForm({ ...periodontalForm, bleedingOnProbing: e.target.checked })} /> Bleeding on probing</label>
      </div></DentalModal> : null}

      {modal === "plan" ? <DentalModal tone="success" title="Treatment Plan and Cost Estimate" subtitle="Uses the charge catalogue to estimate treatment cost and track completed or pending procedures." onSubmit={savePlan} onClose={() => setModal("")} saving={saving === "plan"} saveText="Save Treatment Plan"><div className="dental-form-grid">
        <Field label="Tooth/region"><input value={planForm.toothNumber} onChange={(e) => setPlanForm({ ...planForm, toothNumber: e.target.value })} /></Field>
        <Field label="Procedure"><select value={planForm.procedureCode} onChange={(e) => { const selected = procedureCodes.find(([code]) => code === e.target.value); setPlanForm({ ...planForm, procedureCode: e.target.value, cost: String(selected?.[2] || "") }); }}>{procedureCodes.map(([code, name]) => <option key={code} value={code}>{code} | {name}</option>)}</select></Field>
        <SurfacePicker value={planForm.surfaces} onChange={(next) => setPlanForm({ ...planForm, surfaces: next })} />
        <Field label="Urgency"><select value={planForm.urgency} onChange={(e) => setPlanForm({ ...planForm, urgency: e.target.value })}><option>URGENT</option><option>SOON</option><option>ROUTINE</option></select></Field>
        <Field label="Estimated cost"><input type="number" value={planForm.cost} onChange={(e) => setPlanForm({ ...planForm, cost: e.target.value })} /></Field>
        <Field label="Plan notes" wide><textarea value={planForm.notes} onChange={(e) => setPlanForm({ ...planForm, notes: e.target.value })} /></Field>
      </div></DentalModal> : null}

      {modal === "procedure" ? <DentalModal tone="teal" title="Record Completed Dental Procedure" subtitle="Saves performed dental work with anaesthesia, materials, complications, and follow-up requirement." onSubmit={saveProcedure} onClose={() => setModal("")} saving={saving === "procedure"} saveText="Save Procedure"><div className="dental-form-grid">
        <Field label="Procedure"><select value={procedureForm.procedureCode} onChange={(e) => setProcedureForm({ ...procedureForm, procedureCode: e.target.value })}>{procedureCodes.map(([code, name]) => <option key={code} value={code}>{code} | {name}</option>)}</select></Field>
        <Field label="Tooth/region"><input value={procedureForm.toothNumber} onChange={(e) => setProcedureForm({ ...procedureForm, toothNumber: e.target.value })} /></Field>
        <SurfacePicker value={procedureForm.surfaces} onChange={(next) => setProcedureForm({ ...procedureForm, surfaces: next })} />
        <Field label="Anaesthesia type"><input value={procedureForm.anaesthesiaType} onChange={(e) => setProcedureForm({ ...procedureForm, anaesthesiaType: e.target.value })} /></Field>
        <Field label="Anaesthetic drug"><input value={procedureForm.anaestheticDrug} onChange={(e) => setProcedureForm({ ...procedureForm, anaestheticDrug: e.target.value })} /></Field>
        <Field label="Materials used"><input value={procedureForm.materialsUsed} onChange={(e) => setProcedureForm({ ...procedureForm, materialsUsed: e.target.value })} /></Field>
        <Field label="Performed date"><input type="date" value={procedureForm.performedDate} onChange={(e) => setProcedureForm({ ...procedureForm, performedDate: e.target.value })} /></Field>
        <Field label="Performed time"><input type="time" value={procedureForm.performedTime} onChange={(e) => setProcedureForm({ ...procedureForm, performedTime: e.target.value })} /></Field>
        <Field label="Complications" wide><textarea value={procedureForm.complications} onChange={(e) => setProcedureForm({ ...procedureForm, complications: e.target.value })} /></Field>
        <Field label="Post-op instructions" wide><textarea value={procedureForm.postOpInstructions} onChange={(e) => setProcedureForm({ ...procedureForm, postOpInstructions: e.target.value })} /></Field>
        <label className="dental-check"><input type="checkbox" checked={procedureForm.followUpRequired} onChange={(e) => setProcedureForm({ ...procedureForm, followUpRequired: e.target.checked })} /> Follow-up required</label>
      </div></DentalModal> : null}

      {modal === "radiograph" ? <DentalModal tone="blue" title="Dental Radiograph Order" subtitle="Sends periapical, bitewing, or OPG requests to Radiology and links the record to PACS." onSubmit={saveRadiograph} onClose={() => setModal("")} saving={saving === "radiograph"} saveText="Order X-ray"><div className="dental-form-grid">
        <Field label="Type"><select value={radiographForm.type} onChange={(e) => setRadiographForm({ ...radiographForm, type: e.target.value })}><option>PERIAPICAL</option><option>BITEWING</option><option>OPG</option></select></Field>
        <Field label="Tooth/region"><input value={radiographForm.toothRegion} onChange={(e) => setRadiographForm({ ...radiographForm, toothRegion: e.target.value })} /></Field>
        <Field label="Clinical indication" wide><textarea required value={radiographForm.clinicalIndication} onChange={(e) => setRadiographForm({ ...radiographForm, clinicalIndication: e.target.value })} /></Field>
      </div></DentalModal> : null}

      {modal === "interpretation" ? <DentalModal tone="purple" title="Radiographic Interpretation" subtitle="Links caries depth, bone levels, root morphology, and pathology interpretation to the dental radiograph." onSubmit={saveInterpretation} onClose={() => setModal("")} saving={saving === "interpretation"} saveText="Save Interpretation"><div className="dental-form-grid">
        <Field label="Radiograph order"><select value={interpretationForm.radiographOrderId} onChange={(e) => setInterpretationForm({ ...interpretationForm, radiographOrderId: e.target.value })}>{selectedRadiographs.map((row) => <option key={row.radiographOrderId} value={row.radiographOrderId}>{row.type} | {row.toothRegion}</option>)}</select></Field>
        <Field label="Caries depth"><input value={interpretationForm.cariesDepth} onChange={(e) => setInterpretationForm({ ...interpretationForm, cariesDepth: e.target.value })} /></Field>
        <Field label="Bone levels"><input value={interpretationForm.boneLevels} onChange={(e) => setInterpretationForm({ ...interpretationForm, boneLevels: e.target.value })} /></Field>
        <Field label="Root morphology"><input value={interpretationForm.rootMorphology} onChange={(e) => setInterpretationForm({ ...interpretationForm, rootMorphology: e.target.value })} /></Field>
        <Field label="Pathology"><input value={interpretationForm.pathology} onChange={(e) => setInterpretationForm({ ...interpretationForm, pathology: e.target.value })} /></Field>
        <Field label="Interpretation" wide><textarea required value={interpretationForm.interpretation} onChange={(e) => setInterpretationForm({ ...interpretationForm, interpretation: e.target.value })} /></Field>
      </div></DentalModal> : null}

      {modal === "prescription" ? <DentalModal tone="teal" title="Dental Prescription" subtitle="Posts antibiotics, analgesics, or mouthwash to Pharmacy queue for CDSS allergy and interaction checks." onSubmit={savePrescription} onClose={() => setModal("")} saving={saving === "prescription"} saveText="Post Prescription"><div className="dental-form-grid">
        <Field label="Medication"><input required value={prescriptionForm.medication} onChange={(e) => setPrescriptionForm({ ...prescriptionForm, medication: e.target.value })} /></Field>
        <Field label="Dosage"><input required value={prescriptionForm.dosage} onChange={(e) => setPrescriptionForm({ ...prescriptionForm, dosage: e.target.value })} /></Field>
        <Field label="Frequency"><input value={prescriptionForm.frequency} onChange={(e) => setPrescriptionForm({ ...prescriptionForm, frequency: e.target.value })} /></Field>
        <Field label="Duration"><input value={prescriptionForm.duration} onChange={(e) => setPrescriptionForm({ ...prescriptionForm, duration: e.target.value })} /></Field>
        <Field label="Notes" wide><textarea value={prescriptionForm.notes} onChange={(e) => setPrescriptionForm({ ...prescriptionForm, notes: e.target.value })} /></Field>
      </div></DentalModal> : null}

      {modal === "instruction" ? <DentalModal tone="info" title="Post-Procedure Instructions" subtitle="Prints standardised dental care instructions and records that written instructions were given." onSubmit={saveInstruction} onClose={() => setModal("")} saving={saving === "instruction"} saveText="Print and Save"><div className="dental-form-grid">
        <Field label="Instruction type"><select value={instructionForm.instructionType} onChange={(e) => setInstructionForm({ ...instructionForm, instructionType: e.target.value })}><option>POST_EXTRACTION</option><option>POST_ROOT_CANAL</option><option>POST_SCALING</option><option>ORTHODONTIC_ADJUSTMENT</option></select></Field>
        <Field label="Related procedure"><select value={instructionForm.procedureId} onChange={(e) => setInstructionForm({ ...instructionForm, procedureId: e.target.value })}><option value="">No procedure selected</option>{selectedProcedures.map((row) => <option key={row.id} value={row.id}>{row.procedureName} | {row.toothNumber}</option>)}</select></Field>
        <Field label="Custom instruction text" wide><textarea value={instructionForm.instructionText} onChange={(e) => setInstructionForm({ ...instructionForm, instructionText: e.target.value })} /></Field>
      </div></DentalModal> : null}
    </div>
  );
}

function SurfacePicker({ value, onChange }: { value: string[]; onChange: (next: string[]) => void }) {
  return (
    <div className="dental-surface-picker">
      <strong>Surfaces</strong>
      <div>{surfaces.map((surface) => <button type="button" key={surface} className={value.includes(surface) ? "active" : ""} onClick={() => onChange(value.includes(surface) ? value.filter((item) => item !== surface) : [...value, surface])}>{surface}</button>)}</div>
    </div>
  );
}

function Field({ label, wide, children }: { label: string; wide?: boolean; children: ReactNode }) {
  return <label className={wide ? "wide" : ""}><span>{label}</span>{children}</label>;
}

function DentalInfo({ title, rows }: { title: string; rows: Array<[string, ReactNode]> }) {
  return <div className="dental-info-card"><h3>{title}</h3>{rows.map(([label, value]) => <p key={label}><span>{label}</span><strong>{value}</strong></p>)}</div>;
}

function DentalModal({ tone = "success", title, subtitle, onClose, onSubmit, saving, saveText, children }: { tone?: "success" | "info" | "blue" | "purple" | "warning" | "teal"; title: string; subtitle: string; onClose: () => void; onSubmit: (event: FormEvent) => void; saving: boolean; saveText: string; children: ReactNode }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="module-modal-backdrop dental-modal-backdrop" role="presentation" onClick={onClose}>
      <form className={`module-modal dental-modal tone-${tone}${expanded ? " is-expanded" : ""}`} onSubmit={onSubmit} onClick={(event) => event.stopPropagation()}>
        <div className="module-modal-header">
          <div className="dental-modal-heading"><span className="dental-modal-kicker">DENTAL CLINIC</span><h3><ClipboardList size={19} /> {title}</h3><p>{subtitle}</p></div>
          <div className="dental-modal-header-tools"><span className="dental-modal-badge">Clinical form</span><button type="button" className="dental-modal-expand" aria-label={expanded ? `Restore ${title}` : `Expand ${title}`} title={expanded ? "Restore form size" : "Expand form"} onClick={() => setExpanded((current) => !current)}>{expanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}</button><button type="button" className="module-modal-close" aria-label={`Close ${title}`} onClick={onClose}><X size={18} /></button></div>
        </div>
        {children}
        <div className="module-modal-footer">
          <button type="button" className="nursing-secondary-btn dental-cancel-btn" onClick={onClose}>Cancel</button>
          <button type="submit" className="nursing-action-btn" disabled={saving}><CheckCircle2 size={15} /> {saving ? "Saving..." : saveText}</button>
        </div>
      </form>
    </div>
  );
}
