import React, { useEffect, useMemo, useRef, useState } from "react";
import { SimpleModulePlaceholder } from "../components/layout/SimpleModulePlaceholder";
import { ModuleIcon } from "../components/layout/ModuleIcon";
import { api } from "../lib/api";
import { useLiveRefresh } from "../lib/liveRefresh";
import { ArrowLeft, BedDouble, Activity, ClipboardList } from "lucide-react";

type IpdModal = "admission" | "allocate" | "transfer" | "charge" | "discharge" | "queue" | "chart" | null;

const ipdQueueDestinations = [
  { label: "Nursing", departmentId: "NURSING", queueType: "NURSING", tokenPrefix: "NUR" },
  { label: "ICU", departmentId: "ICU", queueType: "ICU", tokenPrefix: "ICU" },
  { label: "Emergency", departmentId: "EMERGENCY", queueType: "EMERGENCY", tokenPrefix: "ER" },
  { label: "Operating Theatre", departmentId: "THEATRE", queueType: "THEATRE", tokenPrefix: "OT" },
  { label: "Pharmacy", departmentId: "PHARMACY", queueType: "PHARMACY", tokenPrefix: "PHR" },
];

const defaultAdmissionForm = {
  admissionType: "ELECTIVE",
  admissionSource: "OPD",
  admissionSeverity: "ROUTINE",
  requiredCareLevel: "GENERAL_WARD",
  admittingClinician: "",
  initialDiagnosis: "",
  admissionReason: "",
  allergies: "",
  insuranceScheme: "",
  authorizationStatus: "PENDING",
  expectedLengthOfStayDays: "3",
  expectedDischargeDate: "",
  paymentMode: "CASH",
  initialDeposit: "",
  bedId: "",
  notes: "",
};

const defaultTransferForm = {
  toBedId: "",
  reason: "",
  authorizedBy: "",
};

const defaultChargeForm = {
  description: "Daily bed charge",
  quantity: "1",
  unitPrice: "3000",
  notes: "Automatic daily accommodation charge posted from IPD.",
};

const defaultDischargeForm = {
  finalDiagnosis: "",
  dischargeSummary: "",
  outcome: "Improved",
  forceDischarge: false,
  amaReason: "",
  risksExplained: false,
  witness: "",
  deathVerifiedBy: "",
  lastKnownLocation: "",
  abscondedReportedBy: "",
  notificationNotes: "",
};

const noticeTone = (message: string) => {
  const lower = message.toLowerCase();
  if (lower.includes("failed") || lower.includes("error") || lower.includes("outstanding")) return "error";
  if (lower.includes("select") || lower.includes("missing") || lower.includes("check in")) return "warning";
  if (lower.includes("requested") || lower.includes("posted") || lower.includes("transferred")) return "info";
  return "success";
};

const readCheckedInPatient = () => {
  if (typeof window === "undefined") return {};
  try {
    const states = JSON.parse(window.localStorage.getItem("hmis_patient_module_states") || "{}");
    return states?.ipd || {};
  } catch {
    return {};
  }
};

const patientName = (row: any) => {
  const direct = String(row?.patientName || row?.name || "").trim();
  if (direct) return direct;
  return [row?.patient?.firstName, row?.patient?.middleName, row?.patient?.lastName]
    .map((part) => String(part || "").trim())
    .filter(Boolean)
    .join(" ") || "Unknown patient";
};

const admissionBedLabel = (row: any) => {
  const bed = row?.currentBed;
  if (!bed) return "No bed assigned";
  return `${bed?.ward?.name || "Ward"} - ${bed?.bedNumber || bed?.name || "Bed"}`;
};

const admissionWardLabel = (row: any) => row?.currentBed?.ward?.name || row?.admissionType || "Pending ward";

const losLabel = (days: number) => {
  const safeDays = Number.isFinite(days) ? days : 0;
  const wholeDays = Math.floor(safeDays);
  const hours = Math.round((safeDays - wholeDays) * 24);
  if (wholeDays <= 0) return `${hours}h`;
  return `${wholeDays}d ${hours}h`;
};

export default function IpdView() {
  const [dashboard, setDashboard] = useState<any>({});
  const [wards, setWards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<IpdModal>(null);
  const [selectedAdmission, setSelectedAdmission] = useState<any>(null);
  const [admissionForm, setAdmissionForm] = useState(defaultAdmissionForm);
  const [transferForm, setTransferForm] = useState(defaultTransferForm);
  const [chargeForm, setChargeForm] = useState(defaultChargeForm);
  const [dischargeForm, setDischargeForm] = useState(defaultDischargeForm);
  const [queuePatientId, setQueuePatientId] = useState("");
  const [queueDestination, setQueueDestination] = useState("NURSING");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const [checkedInPatient, setCheckedInPatient] = useState<any>({});
  const loadInFlight = useRef<Promise<void> | null>(null);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 2600);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const loadData = async () => {
    if (loadInFlight.current) return loadInFlight.current;
    loadInFlight.current = (async () => {
      try {
        setLoading(true);
        const [dashboardResult, wardsResult] = await Promise.allSettled([
          api.get("/ipd/dashboard"),
          api.get("/wards"),
        ]);
        const dashboardError = dashboardResult.status === "rejected" ? dashboardResult.reason : null;
        const wardsError = wardsResult.status === "rejected" ? wardsResult.reason : null;
        if (dashboardResult.status === "fulfilled") {
          const payload = dashboardResult.value.data;
          const normalized = payload?.data?.data || payload?.data || payload;
          setDashboard(normalized && typeof normalized === "object" ? normalized : {});
        }
        if (wardsResult.status === "fulfilled") {
          const payload = wardsResult.value.data;
          const rows = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : payload?.data?.wards;
          setWards(Array.isArray(rows) ? rows : []);
        }
        const rateLimited = [dashboardError, wardsError].some((error: any) => error?.response?.status === 429);
        if (rateLimited) {
          setNotice("IPD data is temporarily rate-limited. Existing data remains visible; it will refresh automatically.");
        } else if (dashboardError || wardsError) {
          setNotice("Some inpatient data could not be refreshed. Please try again shortly.");
        }
      } finally {
        setLoading(false);
      }
    })().finally(() => {
      loadInFlight.current = null;
    });
    return loadInFlight.current;
  };

  useEffect(() => {
    const syncCheckedInPatient = () => setCheckedInPatient(readCheckedInPatient());
    syncCheckedInPatient();
    const handlePatientState = (event: Event) => {
      const detail = (event as CustomEvent<{ moduleKey?: string; state?: any }>).detail;
      if (detail?.moduleKey === "ipd") setCheckedInPatient(detail.state || {});
    };
    window.addEventListener("hmis:patient-module-state", handlePatientState);
    window.addEventListener("storage", syncCheckedInPatient);
    void loadData();
    return () => {
      window.removeEventListener("hmis:patient-module-state", handlePatientState);
      window.removeEventListener("storage", syncCheckedInPatient);
    };
  }, []);

  useLiveRefresh(loadData, { intervalMs: 45000 });

  const activeAdmissions = useMemo(
    () =>
      (dashboard?.admissions || dashboard?.activeAdmissions || []).filter((row: any) =>
        ["BED_PENDING", "ADMITTED", "UNDER_TREATMENT", "TRANSFERRED", "DISCHARGE_REQUESTED"].includes(String(row?.status || "").toUpperCase()),
      ),
    [dashboard],
  );

  const availableBeds = useMemo(
    () =>
      wards.flatMap((ward) =>
        (ward?.beds || [])
          .filter((bed: any) => String(bed?.status || "").toUpperCase() === "AVAILABLE")
          .map((bed: any) => ({ ...bed, wardName: ward?.name || "Ward", wardType: ward?.wardType || ward?.type || ward?.name })),
      ),
    [wards],
  );

  const cleaningBeds = useMemo(
    () =>
      wards.flatMap((ward) =>
        (ward?.beds || [])
          .filter((bed: any) => String(bed?.status || "").toUpperCase() === "CLEANING")
          .map((bed: any) => ({ ...bed, wardName: ward?.name || "Ward" })),
      ),
    [wards],
  );

  const losReviewCount = activeAdmissions.filter((row: any) => Number(row?.lengthOfStayDays || 0) >= 7).length;
  const pendingDischarges = activeAdmissions.filter((row: any) => String(row?.status || "").toUpperCase() === "DISCHARGE_REQUESTED").length;

  const startAdmission = () => {
    const patientId = String(checkedInPatient?.patientId || checkedInPatient?.id || "").trim();
    if (!patientId) {
      setNotice("Check in a patient first before creating an inpatient admission.");
      return;
    }
    setAdmissionForm((previous) => ({
      ...previous,
      initialDiagnosis: String(checkedInPatient?.diagnosis || checkedInPatient?.admittingDiagnosis || previous.initialDiagnosis || "").trim(),
    }));
    setSelectedAdmission(null);
    setModal("admission");
  };

  const openAdmissionAction = (action: IpdModal, admission: any) => {
    setSelectedAdmission(admission);
    if (action === "transfer") {
      setTransferForm({
        ...defaultTransferForm,
        reason: `Transfer from ${admissionBedLabel(admission)}`,
      });
    }
    if (action === "charge") {
      const wardName = String(admission?.currentBed?.ward?.name || "").toLowerCase();
      const unitPrice = wardName.includes("icu") ? "12000" : wardName.includes("private") ? "8000" : "3000";
      setChargeForm({
        ...defaultChargeForm,
        unitPrice,
        description: `${admissionWardLabel(admission)} daily bed charge`,
      });
    }
    if (action === "discharge") {
      setDischargeForm(defaultDischargeForm);
    }
    setModal(action);
  };

  const submitAdmission = async (event: React.FormEvent) => {
    event.preventDefault();
    const patientId = String(checkedInPatient?.patientId || checkedInPatient?.id || "").trim();
    if (!patientId) {
      setNotice("Check in a patient first before creating an inpatient admission.");
      return;
    }
    setSaving(true);
    try {
      await api.post("/ipd/admit", {
        patientId,
        visitId: checkedInPatient?.visitId || checkedInPatient?.activeVisitId,
        admissionType: admissionForm.admissionType,
        admissionSource: admissionForm.admissionSource,
        admissionSeverity: admissionForm.admissionSeverity,
        requiredCareLevel: admissionForm.requiredCareLevel,
        admittingClinician: admissionForm.admittingClinician,
        initialDiagnosis: admissionForm.initialDiagnosis,
        admissionReason: admissionForm.admissionReason,
        allergies: admissionForm.allergies,
        insuranceScheme: admissionForm.insuranceScheme,
        authorizationStatus: admissionForm.authorizationStatus,
        expectedLengthOfStayDays: Number(admissionForm.expectedLengthOfStayDays || 0),
        expectedDischargeDate: admissionForm.expectedDischargeDate || undefined,
        paymentMode: admissionForm.paymentMode,
        initialDeposit: admissionForm.initialDeposit || 0,
        bedId: admissionForm.bedId || undefined,
        notes: admissionForm.notes,
      });
      setNotice("Patient admitted. Bed, ward worklist, and inpatient billing mode updated.");
      setModal(null);
      setAdmissionForm(defaultAdmissionForm);
      await loadData();
    } catch (err: any) {
      setNotice(`Admission failed: ${err?.response?.data?.message || err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const allocateBed = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedAdmission?.id || !admissionForm.bedId) {
      setNotice("Select an admission and available bed.");
      return;
    }
    setSaving(true);
    try {
      await api.post(`/ipd/${selectedAdmission.id}/allocate-bed`, { bedId: admissionForm.bedId });
      setNotice("Bed allocated. Ward map and nursing worklist updated.");
      setModal(null);
      await loadData();
    } catch (err: any) {
      setNotice(`Bed allocation failed: ${err?.response?.data?.message || err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const transferBed = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedAdmission?.id || !transferForm.toBedId) {
      setNotice("Select a destination bed for transfer.");
      return;
    }
    setSaving(true);
    try {
      await api.post(`/ipd/${selectedAdmission.id}/transfer-bed`, {
        toBedId: transferForm.toBedId,
        reason: transferForm.reason,
        authorizedBy: transferForm.authorizedBy,
      });
      setNotice("Patient transferred. Previous bed moved to cleaning and new ward worklist updated.");
      setModal(null);
      await loadData();
    } catch (err: any) {
      setNotice(`Transfer failed: ${err?.response?.data?.message || err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const queuePatient = async (event: React.FormEvent) => {
    event.preventDefault();
    const admission = activeAdmissions.find((row: any) => String(row?.patientId || "") === queuePatientId);
    const destination = ipdQueueDestinations.find((item) => item.departmentId === queueDestination);
    if (!admission?.patientId || !destination) {
      setNotice("Select an inpatient and destination before queueing.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        patientId: admission.patientId,
        visitId: admission.visitId,
        departmentId: destination.departmentId,
        queueType: destination.queueType,
        tokenPrefix: destination.tokenPrefix,
        priority: "URGENT",
        source: "ipd",
        notes: `Queued from Inpatient / IPD to ${destination.label}`,
      };
      await api.post("/opd/queue/token", payload).catch((error) => {
        if ([404, 405].includes(error?.response?.status)) return api.post("/queue/token", payload);
        throw error;
      });
      setNotice(`${patientName(admission)} queued to ${destination.label}.`);
      setModal(null);
      window.dispatchEvent(new CustomEvent("hmis:patient-queued", { detail: { patient: admission, destination } }));
    } catch (err: any) {
      setNotice(`Queue failed: ${err?.response?.data?.message || err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const postDailyCharge = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedAdmission?.id) return;
    setSaving(true);
    try {
      await api.post(`/ipd/${selectedAdmission.id}/daily-charge`, {
        description: chargeForm.description,
        quantity: chargeForm.quantity,
        unitPrice: chargeForm.unitPrice,
        notes: chargeForm.notes,
      });
      setNotice("Daily inpatient bed charge posted to billing.");
      setModal(null);
      await loadData();
    } catch (err: any) {
      setNotice(`Daily charge failed: ${err?.response?.data?.message || err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const requestDischarge = async (admission: any) => {
    if (!admission?.id) {
      setNotice("Select an active admission before starting discharge planning.");
      return;
    }
    setSaving(true);
    try {
      await api.patch(`/ipd/${admission.id}/request-discharge`, {
        notes: "Doctor discharge order started. Pharmacy, billing, and nursing clearance required.",
      });
      setNotice("Discharge planning requested. Pharmacy, billing, and nursing tasks are now pending.");
      await loadData();
    } catch (err: any) {
      setNotice(`Discharge request failed: ${err?.response?.data?.message || err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const finalDischarge = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedAdmission?.id) return;
    setSaving(true);
    try {
      await api.patch(`/ipd/${selectedAdmission.id}/discharge`, {
        finalDiagnosis: dischargeForm.finalDiagnosis,
        dischargeSummary: dischargeForm.dischargeSummary,
        outcome: dischargeForm.outcome,
        forceDischarge: dischargeForm.forceDischarge,
        amaReason: dischargeForm.amaReason,
        risksExplained: dischargeForm.risksExplained,
        witness: dischargeForm.witness,
        deathVerifiedBy: dischargeForm.deathVerifiedBy,
        lastKnownLocation: dischargeForm.lastKnownLocation,
        abscondedReportedBy: dischargeForm.abscondedReportedBy,
        notificationNotes: dischargeForm.notificationNotes,
      });
      setNotice("Patient officially discharged. Bed released for cleaning and visit closed.");
      setModal(null);
      await loadData();
    } catch (err: any) {
      setNotice(`Discharge failed: ${err?.response?.data?.message || err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const tableRows = activeAdmissions.map((row: any) => {
    const losDays = Number(row?.lengthOfStayDays || 0);
    return {
      id: row.id,
      patient: patientName(row),
      ward: admissionWardLabel(row),
      bed: admissionBedLabel(row),
      diagnosis: row?.initialDiagnosis || row?.admissionReason || row?.visit?.chiefComplaint || "Not recorded",
      los: (
        <span className={`ipd-los-pill ${losDays >= 7 ? "is-alert" : ""}`}>
          {losLabel(losDays)}
        </span>
      ),
      status: (
        <span className={`ipd-status-pill ${!row?.currentBed ? "is-pending" : String(row?.status || "").toLowerCase().includes("discharge") ? "is-discharge" : "is-active"}`}>
          {!row?.currentBed ? "PENDING BED" : row?.status}
        </span>
      ),
      actions: (
        <div className="ipd-row-actions">
          {!row?.currentBed ? (
            <button
              onClick={() => {
                setSelectedAdmission(row);
                setAdmissionForm((previous) => ({ ...previous, bedId: "" }));
                setModal("allocate");
              }}
              className="ipd-row-btn is-bed"
              type="button"
            >
              <ModuleIcon name="hotel" className="w-3.5 h-3.5" /> Allocate Bed
            </button>
          ) : (
            <button onClick={() => { setSelectedAdmission(row); setModal("chart"); }} className="ipd-row-btn is-chart" type="button">
              <ModuleIcon name="edit_note" className="w-3.5 h-3.5" /> Ward Chart
            </button>
          )}
          <button onClick={() => openAdmissionAction("transfer", row)} className="ipd-row-btn is-transfer" type="button" disabled={!row?.currentBed}>
            <ModuleIcon name="sync_alt" className="w-3.5 h-3.5" /> Transfer
          </button>
          <button onClick={() => openAdmissionAction("charge", row)} className="ipd-row-btn is-charge" type="button">
            <ModuleIcon name="payments" className="w-3.5 h-3.5" /> Charge
          </button>
          <button onClick={() => requestDischarge(row)} className="ipd-row-btn is-plan" type="button" disabled={saving}>
            <ModuleIcon name="fact_check" className="w-3.5 h-3.5" /> Plan Discharge
          </button>
          <button onClick={() => openAdmissionAction("discharge", row)} className="ipd-row-btn is-discharge" type="button" disabled={String(row?.status || "").toUpperCase() !== "DISCHARGE_REQUESTED"}>
            <ModuleIcon name="logout" className="w-3.5 h-3.5" /> Final Discharge
          </button>
        </div>
      ),
    };
  });

  const bedBoard = (
    <section className="ipd-board">
      <div className="ipd-board-header">
        <div>
          <h3>Ward Bed Map</h3>
          <p>Green available, red occupied, amber cleaning. Transfers and discharges update this map immediately.</p>
        </div>
        <span>{availableBeds.length} available · {cleaningBeds.length} cleaning</span>
      </div>
      <div className="ipd-ward-grid">
        {wards.map((ward) => (
          <div key={ward.id || ward.name} className="ipd-ward-panel">
            <div className="ipd-ward-title">
              <strong>{ward.name}</strong>
              <span>{(ward.beds || []).length} beds</span>
            </div>
            <div className="ipd-bed-grid">
              {(ward.beds || []).map((bed: any) => {
                const status = String(bed?.status || "AVAILABLE").toUpperCase();
                return (
                  <span key={bed.id || bed.bedNumber} className={`ipd-bed is-${status.toLowerCase()}`} title={`${bed.bedNumber} - ${status}`}>
                    {bed.bedNumber || bed.name || "Bed"}
                  </span>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      {losReviewCount > 0 ? (
        <div className="ipd-review-alert">
          <ModuleIcon name="warning" /> {losReviewCount} inpatient{losReviewCount === 1 ? "" : "s"} exceed the 7 day review threshold.
        </div>
      ) : null}
    </section>
  );

  return (
    <>
      <SimpleModulePlaceholder
        title="Inpatient Management"
        subtitle="Admissions, ward worklists, bed allocation, transfer, daily billing, discharge control, and LOS review."
        icon={<ModuleIcon name="local_hospital" />}
        stats={[
          { label: "Active Admissions", value: dashboard?.totals?.activeAdmissions || 0, color: "#1e3a8a" },
          { label: "Available Beds", value: dashboard?.totals?.bedsAvailable || 0, color: "#16a34a" },
          { label: "Pending Discharges", value: pendingDischarges, color: "#d97706" },
          { label: "Bed Occupancy", value: `${dashboard?.totals?.bedOccupancyRate || 0}%`, color: "#0891b2" },
          { label: "Avg LOS", value: `${dashboard?.totals?.averageLengthOfStayDays || 0}d`, color: "#7c3aed" },
          { label: "LOS Review Alerts", value: losReviewCount, color: "#dc2626" },
        ]}
        columns={[
          { label: "Patient", key: "patient" },
          { label: "Ward", key: "ward" },
          { label: "Bed", key: "bed" },
          { label: "Diagnosis / Reason", key: "diagnosis" },
          { label: "LOS", key: "los" },
          { label: "Status", key: "status" },
          { label: "Actions", key: "actions" },
        ]}
        rows={tableRows}
        searchPlaceholder="Search active admissions, ward, bed, diagnosis..."
        searchKeys={["patient", "ward", "bed", "diagnosis"]}
        useProvidedStats
        useProvidedRows
        useProvidedActions
        captureActions={false}
        afterSearchContent={bedBoard}
        actions={
          <div className="ipd-action-bar">
            <button className="ipd-workflow-btn is-admit" onClick={startAdmission} type="button">
              <ModuleIcon name="add_circle" /> Admission Order
            </button>
            <button
              className="ipd-workflow-btn is-round"
              onClick={() => activeAdmissions[0] ? openAdmissionAction("chart", activeAdmissions[0]) : setNotice("No active inpatient is available for ward round.")}
              type="button"
            >
              <ModuleIcon name="clinical_notes" /> Ward Round
            </button>
            <button
              className="ipd-workflow-btn is-billing"
              onClick={() => activeAdmissions[0] ? openAdmissionAction("charge", activeAdmissions[0]) : setNotice("No active admission available for daily charge.")}
              type="button"
            >
              <ModuleIcon name="payments" /> Daily Bed Charge
            </button>
            <button
              className="ipd-workflow-btn is-discharge"
              onClick={() => activeAdmissions[0] ? requestDischarge(activeAdmissions[0]) : setNotice("No active admission available for discharge planning.")}
              type="button"
            >
              <ModuleIcon name="fact_check" /> Discharge Planning
            </button>
          </div>
        }
      />

      {modal ? (
        <div className="module-form-overlay">
          <div
            className="module-form-panel ipd-modal-panel"
            style={{ "--module-form-accent": "#2563eb", "--module-form-accent-dark": "#102554" } as any}
          >
            <div className="module-form-header">
              <div>
                <p className="module-form-kicker">Inpatient workflow</p>
                <h3 className="module-form-title">
                  {modal === "admission" ? "Electronic Admission" : modal === "chart" ? `Ward Chart · ${patientName(selectedAdmission)}` : `${patientName(selectedAdmission)} · ${modal}`}
                </h3>
              </div>
              <button className="module-modal-close" onClick={() => setModal(null)} type="button">x</button>
            </div>

            {modal === "chart" && selectedAdmission ? (
              <div className="module-form-body p-4 space-y-4">
                <div className="ipd-patient-strip flex justify-between items-center">
                  <div>
                    <strong>{patientName(selectedAdmission)}</strong>
                    <span>{admissionBedLabel(selectedAdmission)}</span>
                  </div>
                  <span className="pv-badge">{selectedAdmission.status || "ADMITTED"}</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 border rounded bg-slate-50 dark:bg-slate-800">
                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-1.5"><Activity className="w-4 h-4 text-emerald-600" /> Current Vitals & Observations</h4>
                    <p className="text-xs text-muted-foreground">Chief complaint: {selectedAdmission.visit?.chiefComplaint || selectedAdmission.initialDiagnosis || "Under care"}</p>
                    <p className="text-xs text-muted-foreground mt-1">LOS: {losLabel(Number(selectedAdmission.lengthOfStayDays || 0))}</p>
                    <p className="text-xs text-muted-foreground mt-1">Severity: {selectedAdmission.admissionSeverity || "Routine"}</p>
                  </div>
                  <div className="p-3 border rounded bg-slate-50 dark:bg-slate-800">
                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-1.5"><ClipboardList className="w-4 h-4 text-blue-600" /> Clinical Care Orders</h4>
                    <p className="text-xs text-muted-foreground">Allergies: {selectedAdmission.allergies || "None documented"}</p>
                    <p className="text-xs text-muted-foreground mt-1">Admitting Clinician: {selectedAdmission.admittingClinician || "Attending Physician"}</p>
                    <p className="text-xs text-muted-foreground mt-1">Payer: {selectedAdmission.insuranceScheme || "Cash"}</p>
                  </div>
                </div>
                <div className="module-form-footer">
                  <button className="topbar-logout-btn module-form-submit" onClick={() => setModal(null)} type="button">Close Chart</button>
                </div>
              </div>
            ) : null}

            {modal === "queue" ? (
              <form onSubmit={queuePatient} className="module-form-body">
                <div className="module-form-grid">
                  <label className="module-form-field is-wide">
                    <span>Inpatient</span>
                    <select className="module-form-input" required value={queuePatientId} onChange={(e) => setQueuePatientId(e.target.value)}>
                      <option value="">Select an active inpatient</option>
                      {activeAdmissions.map((admission: any) => (
                        <option key={admission.id} value={admission.patientId}>
                          {patientName(admission)} · {admissionBedLabel(admission)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="module-form-field is-wide">
                    <span>Queue to module</span>
                    <select className="module-form-input" required value={queueDestination} onChange={(e) => setQueueDestination(e.target.value)}>
                      {ipdQueueDestinations.map((destination) => (
                        <option key={destination.departmentId} value={destination.departmentId}>{destination.label}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="module-form-footer">
                  <button className="topbar-logout-btn module-form-submit" disabled={saving || activeAdmissions.length === 0} type="submit">
                    {saving ? "Queueing..." : "Queue Patient"}
                  </button>
                </div>
              </form>
            ) : null}

            {modal === "admission" ? (
              <form onSubmit={submitAdmission} className="module-form-body">
                <div className="ipd-patient-strip">
                  <strong>{String(checkedInPatient?.patientName || checkedInPatient?.name || "Checked-in patient")}</strong>
                  <span>{String(checkedInPatient?.mrn || checkedInPatient?.patientCode || checkedInPatient?.idNumber || "No MRN")}</span>
                </div>
                <div className="module-form-grid">
                  <label className="module-form-field">
                    <span>Admission type</span>
                    <select className="module-form-input" value={admissionForm.admissionType} onChange={(e) => setAdmissionForm((p) => ({ ...p, admissionType: e.target.value }))}>
                      <option value="ELECTIVE">Elective</option>
                      <option value="EMERGENCY">Emergency</option>
                      <option value="TRANSFER">Transfer in</option>
                      <option value="DAY_CASE">Day case</option>
                    </select>
                  </label>
                  <label className="module-form-field">
                    <span>Admission source</span>
                    <select className="module-form-input" value={admissionForm.admissionSource} onChange={(e) => setAdmissionForm((p) => ({ ...p, admissionSource: e.target.value }))}>
                      <option>OPD</option><option>Emergency</option><option>Maternity</option><option>Theatre</option><option>ICU</option><option>Referral</option><option>Direct admission</option><option>Scheduled admission</option>
                    </select>
                  </label>
                  <label className="module-form-field">
                    <span>Required care level</span>
                    <select className="module-form-input" value={admissionForm.requiredCareLevel} onChange={(e) => setAdmissionForm((p) => ({ ...p, requiredCareLevel: e.target.value }))}>
                      <option value="GENERAL_WARD">General ward</option><option value="HIGH_DEPENDENCY">High dependency</option><option value="ICU">ICU</option><option value="ISOLATION">Isolation</option>
                    </select>
                  </label>
                  <label className="module-form-field">
                    <span>Admission severity</span>
                    <select className="module-form-input" value={admissionForm.admissionSeverity} onChange={(e) => setAdmissionForm((p) => ({ ...p, admissionSeverity: e.target.value }))}>
                      <option value="ROUTINE">Routine</option><option value="URGENT">Urgent</option><option value="EMERGENCY">Emergency</option><option value="CRITICAL">Critical</option>
                    </select>
                  </label>
                  <label className="module-form-field">
                    <span>Admitting clinician</span>
                    <input className="module-form-input" value={admissionForm.admittingClinician} onChange={(e) => setAdmissionForm((p) => ({ ...p, admittingClinician: e.target.value }))} placeholder="Registered clinician name or ID" />
                  </label>
                  <label className="module-form-field">
                    <span>Expected LOS days</span>
                    <input className="module-form-input" type="number" min="1" value={admissionForm.expectedLengthOfStayDays} onChange={(e) => setAdmissionForm((p) => ({ ...p, expectedLengthOfStayDays: e.target.value }))} />
                  </label>
                  <label className="module-form-field is-wide">
                    <span>Admitting diagnosis</span>
                    <input className="module-form-input" required value={admissionForm.initialDiagnosis} onChange={(e) => setAdmissionForm((p) => ({ ...p, initialDiagnosis: e.target.value }))} />
                  </label>
                  <label className="module-form-field is-wide">
                    <span>Reason / instructions</span>
                    <textarea className="module-form-input min-h-[90px]" required value={admissionForm.admissionReason} onChange={(e) => setAdmissionForm((p) => ({ ...p, admissionReason: e.target.value }))} />
                  </label>
                  <label className="module-form-field">
                    <span>Allergies / alerts</span>
                    <input className="module-form-input" value={admissionForm.allergies} onChange={(e) => setAdmissionForm((p) => ({ ...p, allergies: e.target.value }))} placeholder="Record known allergies or NKA" />
                  </label>
                  <label className="module-form-field">
                    <span>Expected discharge date</span>
                    <input className="module-form-input" type="date" value={admissionForm.expectedDischargeDate} onChange={(e) => setAdmissionForm((p) => ({ ...p, expectedDischargeDate: e.target.value }))} />
                  </label>
                  <label className="module-form-field">
                    <span>Payer / insurance</span>
                    <input className="module-form-input" value={admissionForm.insuranceScheme} onChange={(e) => setAdmissionForm((p) => ({ ...p, insuranceScheme: e.target.value }))} placeholder="Cash, SHA, or scheme" />
                  </label>
                  <label className="module-form-field">
                    <span>Authorization status</span>
                    <select className="module-form-input" value={admissionForm.authorizationStatus} onChange={(e) => setAdmissionForm((p) => ({ ...p, authorizationStatus: e.target.value }))}>
                      <option>PENDING</option><option>APPROVED</option><option>NOT_REQUIRED</option><option>DECLINED</option>
                    </select>
                  </label>
                  <label className="module-form-field">
                    <span>Ward and bed</span>
                    <select className="module-form-input" value={admissionForm.bedId} onChange={(e) => setAdmissionForm((p) => ({ ...p, bedId: e.target.value }))}>
                      <option value="">Assign later</option>
                      {availableBeds.map((bed) => (
                        <option key={bed.id} value={bed.id}>{bed.wardName} - {bed.bedNumber} ({bed.bedType || "Bed"})</option>
                      ))}
                    </select>
                  </label>
                  <label className="module-form-field">
                    <span>Initial deposit</span>
                    <input className="module-form-input" type="number" min="0" value={admissionForm.initialDeposit} onChange={(e) => setAdmissionForm((p) => ({ ...p, initialDeposit: e.target.value }))} />
                  </label>
                  <label className="module-form-field is-wide">
                    <span>Special requirements / nursing notes</span>
                    <textarea className="module-form-input min-h-[70px]" value={admissionForm.notes} onChange={(e) => setAdmissionForm((p) => ({ ...p, notes: e.target.value }))} />
                  </label>
                </div>
                <div className="module-form-footer">
                  <button className="topbar-logout-btn module-form-submit" disabled={saving} type="submit">
                    {saving ? "Admitting..." : "Confirm Admission"}
                  </button>
                </div>
              </form>
            ) : null}

            {modal === "allocate" ? (
              <form onSubmit={allocateBed} className="module-form-body">
                <label className="module-form-field is-wide">
                  <span>Select available bed</span>
                  <select className="module-form-input" required value={admissionForm.bedId} onChange={(e) => setAdmissionForm((p) => ({ ...p, bedId: e.target.value }))}>
                    <option value="">Choose bed</option>
                    {availableBeds.map((bed) => (
                      <option key={bed.id} value={bed.id}>{bed.wardName} - {bed.bedNumber} ({bed.bedType || "Bed"})</option>
                    ))}
                  </select>
                </label>
                <div className="module-form-footer">
                  <button className="topbar-logout-btn module-form-submit" disabled={saving || availableBeds.length === 0} type="submit">
                    {saving ? "Allocating..." : "Confirm Bed Allocation"}
                  </button>
                </div>
              </form>
            ) : null}

            {modal === "transfer" ? (
              <form onSubmit={transferBed} className="module-form-body">
                <div className="ipd-patient-strip">
                  <strong>From: {admissionBedLabel(selectedAdmission)}</strong>
                  <span>Previous bed will move to cleaning.</span>
                </div>
                <div className="module-form-grid">
                  <label className="module-form-field">
                    <span>Destination bed</span>
                    <select className="module-form-input" required value={transferForm.toBedId} onChange={(e) => setTransferForm((p) => ({ ...p, toBedId: e.target.value }))}>
                      <option value="">Choose destination</option>
                      {availableBeds.map((bed) => (
                        <option key={bed.id} value={bed.id}>{bed.wardName} - {bed.bedNumber} ({bed.bedType || "Bed"})</option>
                      ))}
                    </select>
                  </label>
                  <label className="module-form-field">
                    <span>Authorised by</span>
                    <input className="module-form-input" value={transferForm.authorizedBy} onChange={(e) => setTransferForm((p) => ({ ...p, authorizedBy: e.target.value }))} />
                  </label>
                  <label className="module-form-field is-wide">
                    <span>Reason for transfer</span>
                    <textarea className="module-form-input min-h-[90px]" required value={transferForm.reason} onChange={(e) => setTransferForm((p) => ({ ...p, reason: e.target.value }))} />
                  </label>
                </div>
                <div className="module-form-footer">
                  <button className="topbar-logout-btn module-form-submit" disabled={saving} type="submit">
                    {saving ? "Transferring..." : "Confirm Transfer"}
                  </button>
                </div>
              </form>
            ) : null}

            {modal === "charge" ? (
              <form onSubmit={postDailyCharge} className="module-form-body">
                <div className="module-form-grid">
                  <label className="module-form-field is-wide">
                    <span>Description</span>
                    <input className="module-form-input" required value={chargeForm.description} onChange={(e) => setChargeForm((p) => ({ ...p, description: e.target.value }))} />
                  </label>
                  <label className="module-form-field">
                    <span>Quantity</span>
                    <input className="module-form-input" type="number" min="1" value={chargeForm.quantity} onChange={(e) => setChargeForm((p) => ({ ...p, quantity: e.target.value }))} />
                  </label>
                  <label className="module-form-field">
                    <span>Unit price</span>
                    <input className="module-form-input" type="number" min="0" value={chargeForm.unitPrice} onChange={(e) => setChargeForm((p) => ({ ...p, unitPrice: e.target.value }))} />
                  </label>
                  <label className="module-form-field is-wide">
                    <span>Notes</span>
                    <textarea className="module-form-input min-h-[70px]" value={chargeForm.notes} onChange={(e) => setChargeForm((p) => ({ ...p, notes: e.target.value }))} />
                  </label>
                </div>
                <div className="module-form-footer">
                  <button className="topbar-logout-btn module-form-submit" disabled={saving} type="submit">
                    {saving ? "Posting..." : "Post Charge"}
                  </button>
                </div>
              </form>
            ) : null}

            {modal === "discharge" ? (
              <form onSubmit={finalDischarge} className="module-form-body">
                <div className="ipd-discharge-gates">
                  <span>Doctor order</span>
                  <span>Pharmacy meds</span>
                  <span>Nursing education</span>
                  <span>Billing clearance</span>
                </div>
                <div className="module-form-grid">
                  <label className="module-form-field">
                    <span>Outcome</span>
                    <select className="module-form-input" value={dischargeForm.outcome} onChange={(e) => setDischargeForm((p) => ({ ...p, outcome: e.target.value }))}>
                      <option>Improved</option>
                      <option>Stable</option>
                      <option>Transferred out</option>
                      <option>Left Against Medical Advice</option>
                      <option>Absconded</option>
                      <option>Died</option>
                      <option>Hospice / Palliative</option>
                    </select>
                  </label>
                  <label className="module-form-field">
                    <span>Payment arrangement approved</span>
                    <label className="ipd-checkbox-line">
                      <input type="checkbox" checked={dischargeForm.forceDischarge} onChange={(e) => setDischargeForm((p) => ({ ...p, forceDischarge: e.target.checked }))} />
                      Override billing hard stop
                    </label>
                  </label>
                  <label className="module-form-field is-wide">
                    <span>Final diagnosis</span>
                    <input className="module-form-input" required value={dischargeForm.finalDiagnosis} onChange={(e) => setDischargeForm((p) => ({ ...p, finalDiagnosis: e.target.value }))} />
                  </label>
                  <label className="module-form-field is-wide">
                    <span>Discharge summary</span>
                    <textarea className="module-form-input min-h-[100px]" required value={dischargeForm.dischargeSummary} onChange={(e) => setDischargeForm((p) => ({ ...p, dischargeSummary: e.target.value }))} />
                  </label>
                  {dischargeForm.outcome === "Left Against Medical Advice" ? (
                    <>
                      <label className="module-form-field is-wide"><span>AMA reason</span><textarea className="module-form-input min-h-[70px]" required value={dischargeForm.amaReason} onChange={(e) => setDischargeForm((p) => ({ ...p, amaReason: e.target.value }))} /></label>
                      <label className="module-form-field"><span>Risks explained</span><label className="ipd-checkbox-line"><input type="checkbox" checked={dischargeForm.risksExplained} onChange={(e) => setDischargeForm((p) => ({ ...p, risksExplained: e.target.checked }))} /> Patient/guardian informed</label></label>
                      <label className="module-form-field"><span>Witness</span><input className="module-form-input" required value={dischargeForm.witness} onChange={(e) => setDischargeForm((p) => ({ ...p, witness: e.target.value }))} /></label>
                    </>
                  ) : null}
                  {dischargeForm.outcome === "Died" ? <label className="module-form-field"><span>Death verified by</span><input className="module-form-input" required value={dischargeForm.deathVerifiedBy} onChange={(e) => setDischargeForm((p) => ({ ...p, deathVerifiedBy: e.target.value }))} /></label> : null}
                  {dischargeForm.outcome === "Absconded" ? <><label className="module-form-field"><span>Last known location</span><input className="module-form-input" required value={dischargeForm.lastKnownLocation} onChange={(e) => setDischargeForm((p) => ({ ...p, lastKnownLocation: e.target.value }))} /></label><label className="module-form-field"><span>Reported by</span><input className="module-form-input" required value={dischargeForm.abscondedReportedBy} onChange={(e) => setDischargeForm((p) => ({ ...p, abscondedReportedBy: e.target.value }))} /></label></> : null}
                  {(dischargeForm.outcome === "Died" || dischargeForm.outcome === "Absconded") ? <label className="module-form-field is-wide"><span>Notification / escalation notes</span><textarea className="module-form-input min-h-[70px]" value={dischargeForm.notificationNotes} onChange={(e) => setDischargeForm((p) => ({ ...p, notificationNotes: e.target.value }))} /></label> : null}
                </div>
                <div className="module-form-footer">
                  <button className="topbar-logout-btn module-form-submit" disabled={saving} type="submit">
                    {saving ? "Discharging..." : "Confirm Official Discharge"}
                  </button>
                </div>
              </form>
            ) : null}
          </div>
        </div>
      ) : null}

      {notice ? (
        <div className={`module-toast patient-action-toast ${noticeTone(notice) === "error" ? "is-error" : noticeTone(notice) === "warning" ? "is-warning" : "is-success"}`} role="status" aria-live="polite">
          <span className="patient-action-toast-icon" aria-hidden="true">{noticeTone(notice) === "success" ? "✓" : "!"}</span>
          <div className="patient-action-toast-content">
            <strong>{noticeTone(notice) === "error" ? "Action needs attention" : noticeTone(notice) === "warning" ? "Review required" : "Action completed"}</strong>
            <span>{notice}</span>
          </div>
          <button onClick={() => setNotice("")} className="patient-action-toast-close" type="button" aria-label="Dismiss notification">×</button>
        </div>
      ) : null}

      {loading ? <div className="module-toast">Loading inpatient module...</div> : null}
    </>
  );
}
