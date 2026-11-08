import type { FormEvent } from "react";
import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Baby,
  CalendarDays,
  ClipboardCheck,
  HeartPulse,
  LineChart,
  Plus,
  RefreshCw,
  Save,
  Search,
  ShieldAlert,
  Stethoscope,
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

const staffLabel = (staff: any) =>
  [staff?.firstName, staff?.lastName].filter(Boolean).join(" ") || staff?.name || staff?.email || staff?.id || "Staff member";

const apiErrorMessage = (error: any, fallback: string) => {
  const status = error?.response?.status;
  if (status === 401) return "Your session has expired. Sign in again to access maternity records.";
  if (status === 403) return "Your role is not permitted to access maternity records.";
  return error?.response?.data?.message || fallback;
};

const todayValue = () => new Date().toISOString().slice(0, 10);
const nowTime = () => new Date().toTimeString().slice(0, 5);
const dateTimeValue = (date: string, time: string) => `${date}T${time || "00:00"}:00`;

const formatDate = (value?: string) => {
  const date = new Date(String(value || ""));
  if (!Number.isFinite(date.getTime())) return "Not recorded";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
};

const formatDateTime = (value?: string) => {
  const date = new Date(String(value || ""));
  if (!Number.isFinite(date.getTime())) return "Not recorded";
  return date.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
};

const addDays = (dateValue: string, days: number) => {
  const date = new Date(dateValue);
  if (!Number.isFinite(date.getTime())) return "";
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};

const patientName = (row: any) =>
  [row?.firstName, row?.lastName].filter(Boolean).join(" ") || row?.patientCode || row?.mrn || "Unnamed patient";

const riskTone = (risk?: string) => {
  const value = String(risk || "").toUpperCase();
  if (value.includes("HIGH")) return "is-danger";
  if (value.includes("MODERATE")) return "is-warning";
  return "is-success";
};

const highRiskOptions = [
  ["PREVIOUS_C_SECTION", "Previous C-section"],
  ["HYPERTENSION", "Hypertension"],
  ["DIABETES", "Diabetes"],
  ["MULTIPLE_PREGNANCY", "Multiple pregnancy"],
  ["SEVERE_ANEMIA", "Severe anaemia"],
  ["HIV", "HIV positive"],
  ["PREVIOUS_STILLBIRTH", "Previous stillbirth"],
  ["UNDERAGE_PREGNANCY", "Age below 16"],
  ["ADVANCED_MATERNAL_AGE", "Age above 40"],
];

const apgarTotal = (form: any, prefix: "apgar1" | "apgar5") =>
  ["HeartRate", "Respiration", "MuscleTone", "Reflex", "Color"].reduce(
    (sum, field) => sum + Number(form[`${prefix}${field}`] || 0),
    0,
  );

const emptyAnc = {
  visitDate: todayValue(),
  gestationalAgeWeeks: "",
  weightKg: "",
  bpSystolic: "",
  bpDiastolic: "",
  fundalHeightCm: "",
  fetalHeartRate: "",
  hemoglobin: "",
  ultrasoundEstimatedDueDate: "",
  labSummary: "",
  ultrasoundSummary: "",
  supplements: "IRON,FOLIC_ACID",
  riskFactors: "",
  notes: "",
};

const emptyLabor = {
  admissionDate: todayValue(),
  admissionTime: nowTime(),
  laborOnsetDate: todayValue(),
  laborOnsetTime: nowTime(),
  membraneRuptureDate: "",
  membraneRuptureTime: "",
  activeLaborStartDate: todayValue(),
  activeLaborStartTime: nowTime(),
  midwifeName: "",
  notes: "",
};

const emptyObservation = {
  observedDate: todayValue(),
  observedTime: nowTime(),
  dilationCm: "",
  fetalHeadStation: "",
  contractionFrequency: "",
  contractionDurationSeconds: "",
  fetalHeartRate: "",
  bpSystolic: "",
  bpDiastolic: "",
  maternalPulse: "",
  temperature: "",
  urineProtein: "",
  urineAcetone: "",
  moulding: "",
  notes: "",
};

const emptyDelivery = {
  deliveryDate: todayValue(),
  deliveryTime: nowTime(),
  modeOfDelivery: "VAGINAL",
  csIndication: "",
  complications: "",
  midwifeName: "",
  estimatedBloodLossMl: "",
  placentaStatus: "",
  perinealTearGrade: "",
  episiotomy: false,
  newbornSex: "FEMALE",
  birthWeightKg: "",
  newbornLengthCm: "",
  headCircumferenceCm: "",
  apgar1HeartRate: "2",
  apgar1Respiration: "2",
  apgar1MuscleTone: "2",
  apgar1Reflex: "2",
  apgar1Color: "2",
  apgar5HeartRate: "2",
  apgar5Respiration: "2",
  apgar5MuscleTone: "2",
  apgar5Reflex: "2",
  apgar5Color: "2",
  resuscitationRequired: false,
  resuscitationSteps: "",
  bcgGiven: true,
  opv0Given: true,
  hepbGiven: true,
  congenitalAbnormalities: "",
  nicuTransfer: false,
  nicuTransferReason: "",
  newbornNotes: "",
};

export default function MaternityView() {
  const [dashboard, setDashboard] = useState<any>({});
  const [pregnancies, setPregnancies] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ACTIVE");
  const [modal, setModal] = useState("");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [waitingListOpen, setWaitingListOpen] = useState(false);
  const [waitingListLoading, setWaitingListLoading] = useState(false);
  const [waitingListRows, setWaitingListRows] = useState<any[]>([]);
  
  // Detail workspace state for selected pregnancy
  const [selectedPregnancyId, setSelectedPregnancyId] = useState<string | null>(null);
  const [pregnancyDetail, setPregnancyDetail] = useState<any>(null);
  const [ancVisits, setAncVisits] = useState<any[]>([]);
  const [laborRecords, setLaborRecords] = useState<any[]>([]);
  const [laborObservations, setLaborObservations] = useState<any[]>([]);
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [postnatalRecords, setPostnatalRecords] = useState<any[]>([]);
  const [complications, setComplications] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [detailTab, setDetailTab] = useState<"anc" | "labor" | "delivery" | "postnatal" | "complications">("anc");

  // Detail sub-forms
  const [ancForm, setAncForm] = useState(emptyAnc);
  const [laborForm, setLaborForm] = useState(emptyLabor);
  const [observationForm, setObservationForm] = useState(emptyObservation);
  const [deliveryForm, setDeliveryForm] = useState(emptyDelivery);
  const [postnatalForm, setPostnatalForm] = useState({ reviewDate: todayValue(), reviewTime: nowTime(), uterineStatus: "", bleedingStatus: "", breastfeedingStatus: "", maternalVitals: "", neonatalVitals: "", dischargeReady: false, followUpDate: "", notes: "" });
  const [complicationForm, setComplicationForm] = useState({ subject: "MATERNAL", type: "", severity: "MODERATE", occurredDate: todayValue(), occurredTime: nowTime(), notes: "" });

  const [formData, setFormData] = useState({
    motherPatientId: "",
    lmpDate: "",
    estimatedDueDate: "",
    gravidity: "1",
    parity: "0",
    riskLevel: "AUTO",
    riskOverrideReason: "",
    notes: "",
    riskFactors: [] as string[],
  });

  const setToast = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice((current) => (current === message ? "" : current)), 6000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [dashResult, pregResult, patientResult] = await Promise.allSettled([
        api.get("/maternity/dashboard"),
        api.get("/maternity/pregnancies", {
          params: { riskLevel: riskFilter, status: statusFilter, search: search || undefined },
        }),
        api.get("/patients").catch((err: any) => {
          if ([404, 405].includes(err?.response?.status)) return api.get("/tenant/patients");
          throw err;
        }),
      ]);
      if (dashResult.status === "fulfilled") setDashboard(dashResult.value.data || {});
      if (pregResult.status === "fulfilled") setPregnancies(unwrapRows(pregResult.value.data));
      if (patientResult.status === "fulfilled") setPatients(unwrapRows(patientResult.value.data));
      const failed = [dashResult, pregResult, patientResult].find((result) => result.status === "rejected");
      if (failed?.status === "rejected") setToast(apiErrorMessage((failed as PromiseRejectedResult).reason, "Some maternity data could not be loaded."));
    } catch (error: any) {
      setToast(apiErrorMessage(error, "Maternity records could not be loaded."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [riskFilter, statusFilter]);

  useLiveRefresh(loadData, { intervalMs: 45000 });

  // Load detailed pregnancy workspace data when selectedPregnancyId changes
  const loadPregnancyWorkspace = async (id: string) => {
    setLoading(true);
    try {
      const results = await Promise.allSettled([
        api.get(`/maternity/pregnancy/${id}`),
        api.get("/maternity/anc-visits", { params: { pregnancyId: id } }),
        api.get("/maternity/labor-records", { params: { pregnancyId: id } }),
        api.get("/maternity/labor-observations", { params: { pregnancyId: id } }),
        api.get("/maternity/deliveries", { params: { pregnancyId: id } }),
        api.get("/maternity/postnatal-records", { params: { pregnancyId: id } }),
        api.get("/maternity/complications", { params: { pregnancyId: id } }),
        api.get("/staff").catch(() => ({ data: [] })),
      ]);
      const [pregRes, ancRes, laborRes, obsRes, delRes, pncRes, cmpRes, staffRes] = results;
      if (pregRes.status === "fulfilled") setPregnancyDetail(pregRes.value.data);
      if (ancRes.status === "fulfilled") setAncVisits(unwrapRows(ancRes.value.data));
      if (laborRes.status === "fulfilled") setLaborRecords(unwrapRows(laborRes.value.data));
      if (obsRes.status === "fulfilled") setLaborObservations(unwrapRows(obsRes.value.data));
      if (delRes.status === "fulfilled") setDeliveries(unwrapRows(delRes.value.data));
      if (pncRes.status === "fulfilled") setPostnatalRecords(unwrapRows(pncRes.value.data));
      if (cmpRes.status === "fulfilled") setComplications(unwrapRows(cmpRes.value.data));
      if (staffRes.status === "fulfilled") setStaff(unwrapRows(staffRes.value.data));
    } catch (err: any) {
      setToast(apiErrorMessage(err, "Pregnancy workspace could not be loaded."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedPregnancyId) {
      void loadPregnancyWorkspace(selectedPregnancyId);
    } else {
      setPregnancyDetail(null);
    }
  }, [selectedPregnancyId]);

  const loadWaitingList = async () => {
    setWaitingListLoading(true);
    try {
      const response = await api.get("/opd/queue/board", { params: { departmentId: "MATERNITY" } });
      const payload = response.data?.data || response.data || {};
      setWaitingListRows(Array.isArray(payload?.tokens) ? payload.tokens : Array.isArray(payload) ? payload : []);
    } catch (error: any) {
      setWaitingListRows([]);
      setToast(apiErrorMessage(error, "Maternity waiting list could not be loaded."));
    } finally {
      setWaitingListLoading(false);
    }
  };

  const filteredPregnancies = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return pregnancies;
    return pregnancies.filter((row) =>
      `${row?.motherName || ""} ${row?.motherPatientCode || ""} ${row?.pregnancyId || ""} ${row?.riskLevel || ""}`
        .toLowerCase()
        .includes(q),
    );
  }, [pregnancies, search]);

  const kpis = dashboard?.kpis || {};
  const stats = [
    { label: "Active Pregnancies", value: kpis.activePregnancies || 0, color: "#16a34a" },
    { label: "High Risk", value: kpis.highRiskPregnancies || 0, color: "#dc2626" },
    { label: "Missed ANC", value: kpis.missedAncVisits || 0, color: "#d97706" },
    { label: "Active Labour", value: kpis.activeLaborCases || 0, color: "#2563eb" },
    { label: "Deliveries 30d", value: kpis.deliveries30d || 0, color: "#7c3aed" },
    { label: "NICU Transfers", value: kpis.nicuTransfers30d || 0, color: "#0891b2" },
  ];

  const toggleRisk = (factor: string) => {
    setFormData((current) => ({
      ...current,
      riskFactors: current.riskFactors.includes(factor)
        ? current.riskFactors.filter((entry) => entry !== factor)
        : [...current.riskFactors, factor],
    }));
  };

  const resetForm = () => {
    setFormData({
      motherPatientId: "",
      lmpDate: "",
      estimatedDueDate: "",
      gravidity: "1",
      parity: "0",
      riskLevel: "AUTO",
      riskOverrideReason: "",
      notes: "",
      riskFactors: [],
    });
  };

  const handleEnroll = async (event: FormEvent) => {
    event.preventDefault();
    if (!formData.motherPatientId || !formData.lmpDate) {
      setToast("Select the mother and enter LMP before enrolling ANC.");
      return;
    }
    setSaving(true);
    try {
      await api.post("/maternity/pregnancy", {
        ...formData,
        estimatedDueDate: formData.estimatedDueDate || undefined,
        gravidity: Number(formData.gravidity),
        parity: Number(formData.parity),
        riskLevel: formData.riskLevel,
        riskOverrideReason: formData.riskOverrideReason || undefined,
        registrationType: "ANC",
      });
      setToast("Pregnancy enrolled and ANC journey schedule created.");
      setModal("");
      resetForm();
      await loadData();
    } catch (error: any) {
      setToast(error?.response?.data?.message || "Pregnancy enrollment failed.");
    } finally {
      setSaving(false);
    }
  };

  // Submit sub-actions for detailed workspace
  const submitAnc = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedPregnancyId) return;
    setSaving(true);
    try {
      await api.post("/maternity/anc-visit", {
        ...ancForm,
        pregnancyId: selectedPregnancyId,
        gestationalAgeWeeks: Number(ancForm.gestationalAgeWeeks),
        weightKg: Number(ancForm.weightKg),
        bpSystolic: Number(ancForm.bpSystolic),
        bpDiastolic: Number(ancForm.bpDiastolic),
        fundalHeightCm: Number(ancForm.fundalHeightCm || 0),
        fetalHeartRate: Number(ancForm.fetalHeartRate),
        hemoglobin: Number(ancForm.hemoglobin || 0),
      });
      setToast("ANC visit saved.");
      setModal("");
      setAncForm(emptyAnc);
      await loadPregnancyWorkspace(selectedPregnancyId);
    } catch (err: any) {
      setToast(err?.response?.data?.message || "Failed to save ANC visit.");
    } finally {
      setSaving(false);
    }
  };

  const submitLabor = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedPregnancyId) return;
    setSaving(true);
    try {
      await api.post("/maternity/labor-record", {
        ...laborForm,
        pregnancyId: selectedPregnancyId,
        admissionDateTime: dateTimeValue(laborForm.admissionDate, laborForm.admissionTime),
        laborOnsetDateTime: dateTimeValue(laborForm.laborOnsetDate, laborForm.laborOnsetTime),
        activeLaborStartDateTime: dateTimeValue(laborForm.activeLaborStartDate, laborForm.activeLaborStartTime),
      });
      setToast("Labor record initiated.");
      setModal("");
      setLaborForm(emptyLabor);
      await loadPregnancyWorkspace(selectedPregnancyId);
    } catch (err: any) {
      setToast(err?.response?.data?.message || "Failed to record labor.");
    } finally {
      setSaving(false);
    }
  };

  const submitObservation = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedPregnancyId) return;
    setSaving(true);
    try {
      await api.post("/maternity/labor-observation", {
        ...observationForm,
        pregnancyId: selectedPregnancyId,
        observedAt: dateTimeValue(observationForm.observedDate, observationForm.observedTime),
        dilationCm: Number(observationForm.dilationCm),
        fetalHeartRate: Number(observationForm.fetalHeartRate),
        contractionFrequency: Number(observationForm.contractionFrequency || 0),
        contractionDurationSeconds: Number(observationForm.contractionDurationSeconds || 0),
      });
      setToast("Partograph observation recorded.");
      setModal("");
      setObservationForm(emptyObservation);
      await loadPregnancyWorkspace(selectedPregnancyId);
    } catch (err: any) {
      setToast(err?.response?.data?.message || "Observation recording failed.");
    } finally {
      setSaving(false);
    }
  };

  const submitDelivery = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedPregnancyId) return;
    setSaving(true);
    try {
      await api.post("/maternity/delivery", {
        ...deliveryForm,
        pregnancyId: selectedPregnancyId,
        deliveryDateTime: dateTimeValue(deliveryForm.deliveryDate, deliveryForm.deliveryTime),
        birthWeightKg: Number(deliveryForm.birthWeightKg),
        apgar1: apgarTotal(deliveryForm, "apgar1"),
        apgar5: apgarTotal(deliveryForm, "apgar5"),
      });
      setToast("Delivery record saved and newborn record initialized.");
      setModal("");
      setDeliveryForm(emptyDelivery);
      await loadPregnancyWorkspace(selectedPregnancyId);
    } catch (err: any) {
      setToast(err?.response?.data?.message || "Delivery record failed.");
    } finally {
      setSaving(false);
    }
  };

  // If a pregnancy is selected, show the rich clinical workspace
  if (selectedPregnancyId && pregnancyDetail) {
    return (
      <div className="nursing-view maternity-view">
        <div className="pv-header">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="nursing-secondary-btn"
              onClick={() => setSelectedPregnancyId(null)}
            >
              <ArrowLeft size={16} /> Back to Register
            </button>
            <div>
              <h2 className="pv-title">{pregnancyDetail.motherName || "Pregnancy Detail"}</h2>
              <p className="pv-subtitle">
                EDD: {formatDate(pregnancyDetail.estimatedDueDate)} | Gravidity: {pregnancyDetail.gravidity} | Parity: {pregnancyDetail.parity} | Risk:{" "}
                <span className={`pv-badge ${riskTone(pregnancyDetail.riskLevel)}`}>{pregnancyDetail.riskLevel}</span>
              </p>
            </div>
          </div>
          <div className="nursing-header-actions">
            <button type="button" className="nursing-secondary-btn" onClick={() => loadPregnancyWorkspace(selectedPregnancyId)}>
              <RefreshCw size={15} /> Refresh
            </button>
            <button type="button" className="nursing-action-btn" onClick={() => setModal("anc")}>
              <Plus size={15} /> Record ANC Visit
            </button>
            <button type="button" className="nursing-action-btn" onClick={() => setModal("labor")}>
              <Activity size={15} /> Labor & Delivery
            </button>
          </div>
        </div>

        {notice ? (
          <div className={`module-notice-toast is-${/failed|required|missed|alert|risk/i.test(notice) ? "warning" : "success"}`} role="status">
            <div><strong>Maternity</strong><span>{notice}</span></div>
            <button type="button" className="module-notice-close" onClick={() => setNotice("")}>×</button>
          </div>
        ) : null}

        {/* Tab switcher */}
        <div className="flex gap-2 border-b border-border mb-4 pb-2">
          <button
            type="button"
            className={`px-3 py-1.5 rounded text-sm font-medium ${detailTab === "anc" ? "bg-primary text-white" : "bg-muted"}`}
            onClick={() => setDetailTab("anc")}
          >
            ANC Visits ({ancVisits.length})
          </button>
          <button
            type="button"
            className={`px-3 py-1.5 rounded text-sm font-medium ${detailTab === "labor" ? "bg-primary text-white" : "bg-muted"}`}
            onClick={() => setDetailTab("labor")}
          >
            Partograph & Labor ({laborObservations.length} obs)
          </button>
          <button
            type="button"
            className={`px-3 py-1.5 rounded text-sm font-medium ${detailTab === "delivery" ? "bg-primary text-white" : "bg-muted"}`}
            onClick={() => setDetailTab("delivery")}
          >
            Delivery & Newborn ({deliveries.length})
          </button>
        </div>

        {detailTab === "anc" && (
          <div className="pv-table-wrap">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-base">Antenatal Care Encounters (8-Visit Schedule)</h3>
              <button type="button" className="nursing-action-btn" onClick={() => setModal("anc")}>
                <Plus size={14} /> New Visit
              </button>
            </div>
            <table className="pv-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>GA (Wks)</th>
                  <th>BP</th>
                  <th>Fundal (cm)</th>
                  <th>FHR (bpm)</th>
                  <th>Hb</th>
                  <th>Supplements</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {ancVisits.length === 0 ? (
                  <tr><td colSpan={8} className="pv-empty">No ANC visits recorded yet.</td></tr>
                ) : (
                  ancVisits.map((v, i) => (
                    <tr key={v.id || i}>
                      <td>{formatDate(v.visitDate)}</td>
                      <td>{v.gestationalAgeWeeks}</td>
                      <td>{v.bpSystolic}/{v.bpDiastolic}</td>
                      <td>{v.fundalHeightCm || "-"}</td>
                      <td>{v.fetalHeartRate || "-"}</td>
                      <td>{v.hemoglobin || "-"}</td>
                      <td>{v.supplements || "-"}</td>
                      <td>{v.notes || "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {detailTab === "labor" && (
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-base">Labor Tracking & Partograph Observations</h3>
              <div className="flex gap-2">
                <button type="button" className="nursing-secondary-btn" onClick={() => setModal("labor")}>
                  Initiate Labor Record
                </button>
                <button type="button" className="nursing-action-btn" onClick={() => setModal("observation")}>
                  <Plus size={14} /> Record Partograph Observation
                </button>
              </div>
            </div>
            <table className="pv-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Cervical Dilation</th>
                  <th>Station</th>
                  <th>Contractions / 10m</th>
                  <th>Fetal Heart Rate</th>
                  <th>Maternal BP</th>
                  <th>Pulse</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {laborObservations.length === 0 ? (
                  <tr><td colSpan={8} className="pv-empty">No labor observations recorded.</td></tr>
                ) : (
                  laborObservations.map((obs, idx) => (
                    <tr key={obs.id || idx}>
                      <td>{formatDateTime(obs.observedAt)}</td>
                      <td><strong>{obs.dilationCm} cm</strong></td>
                      <td>{obs.fetalHeadStation || "-"}</td>
                      <td>{obs.contractionFrequency ? `${obs.contractionFrequency} in 10 min (${obs.contractionDurationSeconds}s)` : "-"}</td>
                      <td className={obs.fetalHeartRate < 110 || obs.fetalHeartRate > 160 ? "text-red-500 font-bold" : ""}>
                        {obs.fetalHeartRate} bpm
                      </td>
                      <td>{obs.bpSystolic}/{obs.bpDiastolic}</td>
                      <td>{obs.maternalPulse || "-"}</td>
                      <td>{obs.notes || "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {detailTab === "delivery" && (
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-base">Safe Delivery Summary & Newborn Linkage</h3>
              <button type="button" className="nursing-action-btn" onClick={() => setModal("delivery")}>
                <Plus size={14} /> Record Delivery
              </button>
            </div>
            <table className="pv-table">
              <thead>
                <tr>
                  <th>Delivered At</th>
                  <th>Mode</th>
                  <th>Sex</th>
                  <th>Weight</th>
                  <th>Apgar 1m / 5m</th>
                  <th>Blood Loss</th>
                  <th>NICU Transfer</th>
                  <th>Newborn Vaccines</th>
                </tr>
              </thead>
              <tbody>
                {deliveries.length === 0 ? (
                  <tr><td colSpan={8} className="pv-empty">No deliveries recorded for this pregnancy.</td></tr>
                ) : (
                  deliveries.map((d, idx) => (
                    <tr key={d.id || idx}>
                      <td>{formatDateTime(d.deliveryDateTime)}</td>
                      <td><strong>{d.modeOfDelivery}</strong></td>
                      <td>{d.newbornSex}</td>
                      <td>{d.birthWeightKg} kg</td>
                      <td>
                        <span className="font-bold">{d.apgar1}/10</span> at 1m, <span className="font-bold">{d.apgar5}/10</span> at 5m
                      </td>
                      <td>{d.estimatedBloodLossMl ? `${d.estimatedBloodLossMl} mL` : "-"}</td>
                      <td>{d.nicuTransfer ? <span className="text-red-500 font-bold">YES ({d.nicuTransferReason})</span> : "NO"}</td>
                      <td>{[d.bcgGiven && "BCG", d.opv0Given && "OPV0", d.hepbGiven && "HepB"].filter(Boolean).join(", ") || "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Modal overlays for sub-actions */}
        {modal === "anc" && (
          <div className="module-modal-backdrop">
            <form className="module-modal maternity-modal" onSubmit={submitAnc}>
              <div className="module-modal-header">
                <h3>Record ANC Visit</h3>
                <button type="button" className="module-modal-close" onClick={() => setModal("")}>×</button>
              </div>
              <div className="nursing-form-grid">
                <label><span>Visit Date</span><input type="date" required value={ancForm.visitDate} onChange={(e) => setAncForm({ ...ancForm, visitDate: e.target.value })} /></label>
                <label><span>GA (Weeks)</span><input type="number" required value={ancForm.gestationalAgeWeeks} onChange={(e) => setAncForm({ ...ancForm, gestationalAgeWeeks: e.target.value })} /></label>
                <label><span>Weight (kg)</span><input type="number" step="0.1" required value={ancForm.weightKg} onChange={(e) => setAncForm({ ...ancForm, weightKg: e.target.value })} /></label>
                <label><span>BP Systolic</span><input type="number" required value={ancForm.bpSystolic} onChange={(e) => setAncForm({ ...ancForm, bpSystolic: e.target.value })} /></label>
                <label><span>BP Diastolic</span><input type="number" required value={ancForm.bpDiastolic} onChange={(e) => setAncForm({ ...ancForm, bpDiastolic: e.target.value })} /></label>
                <label><span>Fundal Height (cm)</span><input type="number" value={ancForm.fundalHeightCm} onChange={(e) => setAncForm({ ...ancForm, fundalHeightCm: e.target.value })} /></label>
                <label><span>Fetal Heart Rate</span><input type="number" required value={ancForm.fetalHeartRate} onChange={(e) => setAncForm({ ...ancForm, fetalHeartRate: e.target.value })} /></label>
                <label><span>Hemoglobin (g/dL)</span><input type="number" step="0.1" value={ancForm.hemoglobin} onChange={(e) => setAncForm({ ...ancForm, hemoglobin: e.target.value })} /></label>
                <label className="wide"><span>Supplements</span><input value={ancForm.supplements} onChange={(e) => setAncForm({ ...ancForm, supplements: e.target.value })} /></label>
                <label className="wide"><span>Clinical Notes</span><textarea value={ancForm.notes} onChange={(e) => setAncForm({ ...ancForm, notes: e.target.value })} /></label>
              </div>
              <div className="module-modal-footer">
                <button type="button" className="nursing-secondary-btn" onClick={() => setModal("")}>Cancel</button>
                <button type="submit" className="nursing-action-btn" disabled={saving}>{saving ? "Saving..." : "Save ANC Visit"}</button>
              </div>
            </form>
          </div>
        )}

        {modal === "observation" && (
          <div className="module-modal-backdrop">
            <form className="module-modal maternity-modal" onSubmit={submitObservation}>
              <div className="module-modal-header">
                <h3>Record Partograph Observation</h3>
                <button type="button" className="module-modal-close" onClick={() => setModal("")}>×</button>
              </div>
              <div className="nursing-form-grid">
                <label><span>Date</span><input type="date" required value={observationForm.observedDate} onChange={(e) => setObservationForm({ ...observationForm, observedDate: e.target.value })} /></label>
                <label><span>Time</span><input type="time" required value={observationForm.observedTime} onChange={(e) => setObservationForm({ ...observationForm, observedTime: e.target.value })} /></label>
                <label><span>Cervix Dilation (cm)</span><input type="number" step="0.5" min="0" max="10" required value={observationForm.dilationCm} onChange={(e) => setObservationForm({ ...observationForm, dilationCm: e.target.value })} /></label>
                <label><span>Fetal Heart Rate (bpm)</span><input type="number" required value={observationForm.fetalHeartRate} onChange={(e) => setObservationForm({ ...observationForm, fetalHeartRate: e.target.value })} /></label>
                <label><span>Contractions / 10 min</span><input type="number" value={observationForm.contractionFrequency} onChange={(e) => setObservationForm({ ...observationForm, contractionFrequency: e.target.value })} /></label>
                <label><span>Duration (seconds)</span><input type="number" value={observationForm.contractionDurationSeconds} onChange={(e) => setObservationForm({ ...observationForm, contractionDurationSeconds: e.target.value })} /></label>
                <label className="wide"><span>Notes</span><textarea value={observationForm.notes} onChange={(e) => setObservationForm({ ...observationForm, notes: e.target.value })} /></label>
              </div>
              <div className="module-modal-footer">
                <button type="button" className="nursing-secondary-btn" onClick={() => setModal("")}>Cancel</button>
                <button type="submit" className="nursing-action-btn" disabled={saving}>{saving ? "Saving..." : "Save Observation"}</button>
              </div>
            </form>
          </div>
        )}

        {modal === "delivery" && (
          <div className="module-modal-backdrop">
            <form className="module-modal maternity-modal" onSubmit={submitDelivery}>
              <div className="module-modal-header">
                <h3>Document Delivery & Newborn</h3>
                <button type="button" className="module-modal-close" onClick={() => setModal("")}>×</button>
              </div>
              <div className="nursing-form-grid">
                <label><span>Delivery Date</span><input type="date" required value={deliveryForm.deliveryDate} onChange={(e) => setDeliveryForm({ ...deliveryForm, deliveryDate: e.target.value })} /></label>
                <label><span>Delivery Time</span><input type="time" required value={deliveryForm.deliveryTime} onChange={(e) => setDeliveryForm({ ...deliveryForm, deliveryTime: e.target.value })} /></label>
                <label><span>Mode of Delivery</span><select value={deliveryForm.modeOfDelivery} onChange={(e) => setDeliveryForm({ ...deliveryForm, modeOfDelivery: e.target.value })}><option>VAGINAL</option><option>VACUUM</option><option>FORCEPS</option><option>EMERGENCY_CS</option><option>ELECTIVE_CS</option></select></label>
                <label><span>Newborn Sex</span><select value={deliveryForm.newbornSex} onChange={(e) => setDeliveryForm({ ...deliveryForm, newbornSex: e.target.value })}><option>FEMALE</option><option>MALE</option><option>INDETERMINATE</option></select></label>
                <label><span>Birth Weight (kg)</span><input type="number" step="0.01" required value={deliveryForm.birthWeightKg} onChange={(e) => setDeliveryForm({ ...deliveryForm, birthWeightKg: e.target.value })} /></label>
                <label><span>Estimated Blood Loss (mL)</span><input type="number" value={deliveryForm.estimatedBloodLossMl} onChange={(e) => setDeliveryForm({ ...deliveryForm, estimatedBloodLossMl: e.target.value })} /></label>
                <div className="wide flex items-center gap-4 py-2">
                  <label className="flex items-center gap-2"><input type="checkbox" checked={deliveryForm.nicuTransfer} onChange={(e) => setDeliveryForm({ ...deliveryForm, nicuTransfer: e.target.checked })} /> Transfer to NICU</label>
                  <label className="flex items-center gap-2"><input type="checkbox" checked={deliveryForm.bcgGiven} onChange={(e) => setDeliveryForm({ ...deliveryForm, bcgGiven: e.target.checked })} /> BCG Given</label>
                  <label className="flex items-center gap-2"><input type="checkbox" checked={deliveryForm.opv0Given} onChange={(e) => setDeliveryForm({ ...deliveryForm, opv0Given: e.target.checked })} /> OPV0 Given</label>
                </div>
                {deliveryForm.nicuTransfer ? (
                  <label className="wide"><span>NICU Transfer Reason</span><input value={deliveryForm.nicuTransferReason} onChange={(e) => setDeliveryForm({ ...deliveryForm, nicuTransferReason: e.target.value })} placeholder="Respiratory distress, low birth weight..." /></label>
                ) : null}
              </div>
              <div className="module-modal-footer">
                <button type="button" className="nursing-secondary-btn" onClick={() => setModal("")}>Cancel</button>
                <button type="submit" className="nursing-action-btn" disabled={saving}>{saving ? "Saving..." : "Save Delivery Record"}</button>
              </div>
            </form>
          </div>
        )}
      </div>
    );
  }

  // Normal List View
  return (
    <div className="nursing-view maternity-view">
      <div className="pv-header">
        <div>
          <h2 className="pv-title">Maternity and ANC</h2>
          <p className="pv-subtitle">ANC journey tracking, partograph monitoring, safe delivery records, newborn linkage, and high-risk alerts.</p>
        </div>
        <div className="nursing-header-actions">
          <button type="button" className="nursing-secondary-btn" onClick={loadData}>
            <RefreshCw size={15} /> Refresh
          </button>
          <button type="button" className="nursing-action-btn" onClick={() => setModal("enroll")}>
            <Plus size={15} /> Enroll Pregnancy
          </button>
        </div>
      </div>

      {notice ? (
        <div className={`module-notice-toast is-${/failed|required|missed|alert|risk/i.test(notice) ? "warning" : "success"}`} role="status" aria-live="polite">
          <div><strong>Maternity</strong><span>{notice}</span></div>
          <button type="button" className="module-notice-close" onClick={() => setNotice("")} aria-label="Dismiss notification">×</button>
        </div>
      ) : null}

      {waitingListOpen ? (
        <div className="module-modal-backdrop">
          <section className="module-modal maternity-modal tone-info" role="dialog" aria-modal="true" aria-labelledby="maternity-waiting-list-title">
            <div className="module-modal-header">
              <div>
                <h3 id="maternity-waiting-list-title"><ClipboardCheck size={18} /> Maternity Waiting List</h3>
                <p>Patients currently queued to the MATERNITY service point.</p>
              </div>
              <button type="button" className="module-modal-close" onClick={() => setWaitingListOpen(false)}><X size={18} /></button>
            </div>
            <div className="pv-table-wrap">
              <table className="pv-table">
                <thead><tr><th>Token</th><th>Patient</th><th>Priority</th><th>Queued</th><th>Status</th></tr></thead>
                <tbody>
                  {waitingListLoading ? <tr><td colSpan={5} className="pv-empty">Loading waiting list...</td></tr> : waitingListRows.length === 0 ? <tr><td colSpan={5} className="pv-empty">No patients are waiting for Maternity.</td></tr> : waitingListRows.map((row, index) => <tr key={row.tokenId || row.id || `${row.patientId}-${index}`}><td>{row.tokenNumber || "-"}</td><td>{row.patientName || row.name || row.patientCode || row.patientId || "Unnamed patient"}</td><td>{row.priority || "GENERAL"}</td><td>{row.issuedAt ? formatDate(row.issuedAt) : "-"}</td><td>{row.status || "WAITING"}</td></tr>)}
                </tbody>
              </table>
            </div>
            <div className="module-modal-footer"><button type="button" className="nursing-secondary-btn" onClick={() => setWaitingListOpen(false)}>Close</button><button type="button" className="nursing-action-btn" onClick={loadWaitingList} disabled={waitingListLoading}><RefreshCw size={15} /> Refresh</button></div>
          </section>
        </div>
      ) : null}

      <div className="pv-stats nursing-stats-grid">
        {stats.map((stat) => (
          <div key={stat.label} className="pv-stat-card" style={{ borderLeftColor: stat.color }}>
            <p className="pv-stat-label">{stat.label}</p>
            <p className="pv-stat-value">{loading ? "..." : stat.value}</p>
          </div>
        ))}
      </div>

      <section className="nursing-care-panel">
        <div className="nursing-care-header maternity-table-header">
          <div>
            <span>Pregnancy Register</span>
            <strong>ANC records, EDD, visit progress, risk level, and labour status</strong>
          </div>
          <span className="pv-badge">8 Visit ANC Schedule</span>
        </div>
        <div className="pv-search-bar maternity-filter-bar">
          <div className="pv-search-wrap">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              className="pv-search"
              placeholder="Search mother, MRN, pregnancy ID..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <select className="nursing-filter-select" value={riskFilter} onChange={(event) => setRiskFilter(event.target.value)}>
            <option value="ALL">All risk levels</option>
            <option value="LOW_RISK">Low risk</option>
            <option value="MODERATE_RISK">Moderate risk</option>
            <option value="HIGH_RISK">High risk</option>
          </select>
          <select className="nursing-filter-select" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="ACTIVE">Active</option>
            <option value="DELIVERED">Delivered</option>
            <option value="ALL">All statuses</option>
          </select>
        </div>

        <div className="pv-table-wrap">
          <table className="pv-table">
            <thead>
              <tr>
                <th>Mother</th>
                <th>MRN</th>
                <th>EDD</th>
                <th>ANC</th>
                <th>Risk</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="pv-empty">Loading maternity register...</td></tr>
              ) : filteredPregnancies.length === 0 ? (
                <tr><td colSpan={7} className="pv-empty">No maternity records found.</td></tr>
              ) : (
                filteredPregnancies.map((row) => {
                  const schedule = row?.ancSchedule || [];
                  const attended = schedule.filter((visit: any) => visit.status === "ATTENDED").length;
                  const missed = schedule.filter((visit: any) => visit.status === "MISSED").length;
                  return (
                    <tr key={row.pregnancyId} onClick={() => setSelectedPregnancyId(row.pregnancyId)} className="cursor-pointer hover:bg-muted/50">
                      <td className="pv-name">{row.motherName || "Mother not recorded"}</td>
                      <td>{row.motherPatientCode || row.motherPatientId || "-"}</td>
                      <td>{formatDate(row.estimatedDueDate)}</td>
                      <td>
                        <span className={`pv-badge ${missed ? "is-warning" : ""}`}>
                          {attended}/8 visits{missed ? ` | ${missed} missed` : ""}
                        </span>
                      </td>
                      <td><span className={`pv-badge ${riskTone(row.riskLevel)}`}>{String(row.riskLevel || "LOW_RISK").replace(/_/g, " ")}</span></td>
                      <td><span className="pv-badge">{row.status || "ACTIVE"}</span></td>
                      <td>
                        <button type="button" className="nursing-secondary-btn" onClick={(event) => { event.stopPropagation(); setSelectedPregnancyId(row.pregnancyId); }}>
                          <ClipboardCheck size={14} /> Open
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div className="maternity-alert-grid">
        <section className="nursing-clinical-card">
          <h3 className="form-title"><ShieldAlert size={18} /> High-risk pregnancies</h3>
          {(dashboard?.highRiskCases || []).slice(0, 5).length === 0 ? (
            <p className="pv-empty">No high-risk pregnancy alerts.</p>
          ) : (
            <div className="maternity-mini-list">
              {(dashboard?.highRiskCases || []).slice(0, 5).map((row: any) => (
                <button key={row.pregnancyId} type="button" onClick={() => setSelectedPregnancyId(row.pregnancyId)}>
                  <strong>{row.motherName}</strong>
                  <span>{(row.riskFactors || []).join(", ") || "Doctor review required"}</span>
                </button>
              ))}
            </div>
          )}
        </section>
        <section className="nursing-clinical-card">
          <h3 className="form-title"><Baby size={18} /> Recent deliveries</h3>
          {(dashboard?.recentDeliveries || []).slice(0, 5).length === 0 ? (
            <p className="pv-empty">No recent deliveries recorded.</p>
          ) : (
            <div className="maternity-mini-list">
              {(dashboard?.recentDeliveries || []).slice(0, 5).map((row: any) => (
                <button key={row.deliveryId} type="button" onClick={() => setSelectedPregnancyId(row.pregnancyId)}>
                  <strong>{row.modeOfDelivery}</strong>
                  <span>{formatDate(row.deliveryDateTime)}{row.nicuTransfer ? " | NICU transfer" : ""}</span>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>

      {modal === "enroll" ? (
        <div className="module-modal-backdrop">
          <form className="module-modal maternity-modal tone-success" onSubmit={handleEnroll}>
            <div className="module-modal-header">
              <div>
                <h3><HeartPulse size={18} /> Enroll ANC Pregnancy</h3>
                <p>The pregnancy record will calculate EDD from LMP and generate the MOH 8-visit schedule.</p>
              </div>
              <button type="button" className="module-modal-close" onClick={() => setModal("")}><X size={18} /></button>
            </div>
            <div className="nursing-form-grid">
              <label className="wide">
                <span>Mother patient</span>
                <select required value={formData.motherPatientId} onChange={(event) => setFormData({ ...formData, motherPatientId: event.target.value })}>
                  <option value="">Select registered patient</option>
                  {patients.map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patientName(patient)} | {patient.patientCode || patient.mrn || "No MRN"}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>LMP date</span>
                <input
                  required
                  type="date"
                  value={formData.lmpDate}
                  onChange={(event) => setFormData({ ...formData, lmpDate: event.target.value, estimatedDueDate: formData.estimatedDueDate || addDays(event.target.value, 280) })}
                />
              </label>
              <label>
                <span>EDD</span>
                <input type="date" value={formData.estimatedDueDate} onChange={(event) => setFormData({ ...formData, estimatedDueDate: event.target.value })} />
              </label>
              <label>
                <span>Gravidity</span>
                <input type="number" min="1" value={formData.gravidity} onChange={(event) => setFormData({ ...formData, gravidity: event.target.value })} />
              </label>
              <label>
                <span>Parity</span>
                <input type="number" min="0" value={formData.parity} onChange={(event) => setFormData({ ...formData, parity: event.target.value })} />
              </label>
              <label>
                <span>Risk classification</span>
                <select value={formData.riskLevel} onChange={(event) => setFormData({ ...formData, riskLevel: event.target.value })}>
                  <option value="AUTO">Calculate from factors</option>
                  <option value="LOW_RISK">Low risk (override)</option>
                  <option value="MODERATE_RISK">Moderate risk (override)</option>
                  <option value="HIGH_RISK">High risk (override)</option>
                </select>
              </label>
              {formData.riskLevel !== "AUTO" ? (
                <label>
                  <span>Override reason</span>
                  <input required value={formData.riskOverrideReason} onChange={(event) => setFormData({ ...formData, riskOverrideReason: event.target.value })} placeholder="Clinician justification" />
                </label>
              ) : null}
              <label className="wide">
                <span>High-risk factors</span>
                <div className="maternity-risk-checks">
                  {highRiskOptions.map(([value, label]) => (
                    <button key={value} type="button" className={formData.riskFactors.includes(value) ? "active" : ""} onClick={() => toggleRisk(value)}>
                      {label}
                    </button>
                  ))}
                </div>
              </label>
              <label className="wide">
                <span>Notes</span>
                <textarea value={formData.notes} onChange={(event) => setFormData({ ...formData, notes: event.target.value })} placeholder="Initial ANC notes, doctor review instructions, CHW context..." />
              </label>
            </div>
            <div className="module-modal-footer">
              <button type="button" className="nursing-secondary-btn" onClick={() => setModal("")}>Cancel</button>
              <button type="submit" className="nursing-action-btn" disabled={saving}>
                <Stethoscope size={15} /> {saving ? "Saving..." : "Create ANC Record"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
