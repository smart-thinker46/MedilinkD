import React, { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Baby,
  ClipboardCheck,
  Gauge,
  LineChart,
  RefreshCw,
  Search,
  SunMedium,
  Thermometer,
  Weight,
  X,
} from "lucide-react";
import { api } from "../lib/api";
import { useLiveRefresh } from "../lib/liveRefresh";

const today = new Date().toISOString().slice(0, 10);

const emptyIncubator = {
  unitNumber: "",
  model: "",
  networkEnabled: false,
  setTemperatureC: "36.5",
  setHumidityPercent: "75",
  servoMode: "AIR_SERVO",
  status: "AVAILABLE",
};

const emptyAdmission = {
  patientId: "",
  newbornId: "",
  motherPatientId: "",
  gestationalAgeWeeks: "32",
  gestationalAgeMethod: "MATERNAL_DATES",
  birthWeightGrams: "1500",
  currentWeightGrams: "1500",
  sex: "UNKNOWN",
  admissionDiagnosis: "",
  admissionSource: "DELIVERY_ROOM",
  incubatorId: "",
  unitNumber: "",
  setTemperatureC: "36.5",
  setHumidityPercent: "75",
  servoMode: "AIR_SERVO",
  codeStatus: "FULL_RESUSCITATION",
  consentObtained: true,
  birthDateTime: "",
  birthLengthCm: "",
  headCircumferenceCm: "",
  deliveryMode: "VAGINAL",
  placeOfBirth: "DELIVERY_ROOM",
  apgar1: "",
  apgar5: "",
  apgar10: "",
  resuscitationHistory: "",
  maternalHistory: "",
  antenatalComplications: "",
  deliveryComplications: "",
  referringClinician: "",
  referralSource: "",
  requiredLevelOfCare: "LEVEL_III",
  respiratoryStatus: "",
  infectionSepsisRisk: "",
  oxygenRequirement: "",
  feedingStatus: "",
  ivAccess: "",
  currentMedications: "",
  bloodRequirement: "",
  isolationRequirement: "",
};

const emptySettings = {
  admissionId: "",
  incubatorId: "",
  unitNumber: "",
  setTemperatureC: "36.5",
  setHumidityPercent: "75",
  servoMode: "AIR_SERVO",
  reason: "",
};

const emptyTelemetry = {
  incubatorId: "",
  unitNumber: "",
  patientId: "",
  temperatureC: "36.7",
  humidityPercent: "76",
  skinTemperatureC: "36.6",
  airTemperatureC: "36.8",
  networkDeviceId: "",
};

const emptyDailyChart = {
  admissionId: "",
  patientId: "",
  recordDate: today,
  dayOfLife: "1",
  gestationalAgeWeeks: "32",
  birthWeightGrams: "1500",
  correctedAgeWeeks: "32",
  weightGrams: "1500",
  temperatureC: "36.7",
  heartRate: "145",
  respiratoryRate: "48",
  spo2Percent: "95",
  respiratorySupport: "NONE",
  fio2Percent: "21",
  cpapPressure: "",
  incubatorTemp: "36.5",
  incubatorHumidity: "75",
  phototherapy: false,
  phototherapyHours: "0",
  bilirubinTotal: "",
  feedingType: "EBM",
  feedVolumeMl: "20",
  feedMethod: "NGT",
  ivFluidVolumeMl: "30",
  urineVolumeMl: "45",
  stoolFrequency: "1",
  glucoseMgDl: "78",
  medicationsAdministered: "",
  proceduresPerformed: "",
  kangarooCareHours: "1",
  assessmentNotes: "",
  assessedBy: "",
  bloodPressure: "",
  map: "",
  painComfort: "",
  neurologicalStatus: "",
  apneaEvents: "0",
  bradycardiaEvents: "0",
  desaturationEvents: "0",
  respiratoryDevice: "",
  respiratoryMode: "",
  flowRate: "",
  peep: "",
  urineOutputMlKgHour: "",
  stoolNotes: "",
  feedTolerance: "TOLERATED",
  residualMl: "",
  totalFluidTargetMlKgDay: "",
  antibiotics: "",
  familyKmcNotes: "",
};

const emptyJaundice = {
  admissionId: "",
  patientId: "",
  ageHours: "24",
  gestationalAgeWeeks: "38",
  bilirubinMgDl: "9",
  previousBilirubinMgDl: "",
  phototherapyHours: "0",
};

const emptyWorkflow = {
  admissionId: "",
  patientId: "",
  action: "LIFECYCLE",
  status: "ONGOING_MONITORING",
  eventType: "DETERIORATION",
  severity: "ROUTINE",
  reason: "",
  destination: "",
  intervention: "",
  response: "",
  notes: "",
};

const fmtDate = (value: unknown) => {
  const date = new Date(String(value || ""));
  if (!Number.isFinite(date.getTime())) return "-";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
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

export default function NicuView() {
  const [dashboard, setDashboard] = useState<any>({});
  const [incubators, setIncubators] = useState<any[]>([]);
  const [admissions, setAdmissions] = useState<any[]>([]);
  const [charts, setCharts] = useState<any[]>([]);
  const [jaundiceTrend, setJaundiceTrend] = useState<any[]>([]);
  const [growthTrend, setGrowthTrend] = useState<any>({});
  const [search, setSearch] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [modal, setModal] = useState<"" | "incubator" | "admission" | "settings" | "telemetry" | "daily" | "jaundice" | "workflow">("");
  const [incubatorForm, setIncubatorForm] = useState(emptyIncubator);
  const [admissionForm, setAdmissionForm] = useState(emptyAdmission);
  const [settingsForm, setSettingsForm] = useState(emptySettings);
  const [telemetryForm, setTelemetryForm] = useState(emptyTelemetry);
  const [dailyForm, setDailyForm] = useState(emptyDailyChart);
  const [jaundiceForm, setJaundiceForm] = useState(emptyJaundice);
  const [workflowForm, setWorkflowForm] = useState(emptyWorkflow);
  const [lastCalculation, setLastCalculation] = useState<any>(null);
  const [lastJaundice, setLastJaundice] = useState<any>(null);
  const [notice, setNotice] = useState<{ tone: "success" | "warning" | "error"; text: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");
  const [waitingListOpen, setWaitingListOpen] = useState(false);
  const [waitingListLoading, setWaitingListLoading] = useState(false);
  const [waitingListRows, setWaitingListRows] = useState<any[]>([]);

  const showNotice = (text: string, tone: "success" | "warning" | "error" = "success") => {
    setNotice({ tone, text });
    window.setTimeout(() => setNotice((current) => (current?.text === text ? null : current)), tone === "success" ? 3200 : 5200);
  };

  const load = async () => {
    setLoading(true);
    try {
      const [dashRes, incRes, admRes, chartRes] = await Promise.all([
        api.get("/nicu/dashboard").catch(() => ({ data: {} })),
        api.get("/nicu/incubators", { params: { search: search.trim() || undefined } }).catch(() => ({ data: { items: [] } })),
        api.get("/nicu/admissions", { params: { search: search.trim() || undefined } }).catch(() => ({ data: { items: [] } })),
        api.get("/nicu/daily-charts", { params: { limit: 200 } }).catch(() => ({ data: { items: [] } })),
      ]);
      const admRows = unwrapItems(admRes.data);
      const chartRows = unwrapItems(chartRes.data);
      setDashboard(dashRes.data || {});
      setIncubators(unwrapItems(incRes.data));
      setAdmissions(admRows);
      setCharts(chartRows);
      const patientId = selectedPatientId || admRows[0]?.patientId || chartRows[0]?.patientId || "";
      if (patientId) {
        setSelectedPatientId(patientId);
        await loadPatientTrends(patientId);
      }
    } catch (error: any) {
      showNotice(error?.response?.data?.message || "NICU data could not be loaded.", "error");
    } finally {
      setLoading(false);
    }
  };

  const loadPatientTrends = async (patientId: string) => {
    try {
      const [growthRes, jaundiceRes] = await Promise.all([
        api.get(`/nicu/growth/${encodeURIComponent(patientId)}`).catch(() => ({ data: {} })),
        api.get(`/nicu/jaundice/${encodeURIComponent(patientId)}`).catch(() => ({ data: { items: [] } })),
      ]);
      setGrowthTrend(growthRes.data || {});
      setJaundiceTrend(unwrapItems(jaundiceRes.data));
    } catch {
      setGrowthTrend({});
      setJaundiceTrend([]);
    }
  };

  const loadWaitingList = async () => {
    setWaitingListLoading(true);
    try {
      const response = await api.get("/opd/queue/board", { params: { departmentId: "NICU" } });
      const payload = response.data?.data || response.data || {};
      setWaitingListRows(Array.isArray(payload?.tokens) ? payload.tokens : Array.isArray(payload) ? payload : []);
    } catch (error: any) {
      setWaitingListRows([]);
      showNotice(error?.response?.data?.message || "NICU waiting list could not be loaded.", "error");
    } finally {
      setWaitingListLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), search.trim() ? 250 : 0);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const handleSidebarAction = (event: Event) => {
      const action = (event as CustomEvent<{ action?: string }>).detail?.action;
      if (action === "monitor-patient") {
        window.setTimeout(() => document.querySelector(".nicu-main")?.scrollIntoView({ behavior: "smooth", block: "center" }), 0);
        showNotice("NICU patient monitoring is ready. Select an admission to continue neonatal care.");
      }
      if (action === "queue-patient") {
        showNotice("Use Patient Registration to select a patient and queue them to NICU.", "warning");
      }
    };
    const handleWaitingList = (event: Event) => {
      const detail = (event as CustomEvent<{ moduleKey?: string }>).detail;
      if (detail?.moduleKey !== "nicu") return;
      setWaitingListOpen(true);
      void loadWaitingList();
    };
    window.addEventListener("hmis:nicu-sidebar-action", handleSidebarAction);
    window.addEventListener("hmis:open-module-waiting-list", handleWaitingList);
    return () => {
      window.removeEventListener("hmis:nicu-sidebar-action", handleSidebarAction);
      window.removeEventListener("hmis:open-module-waiting-list", handleWaitingList);
    };
  }, []);
  useLiveRefresh(load, { intervalMs: 60000 });

  const totals = dashboard?.totals || {};
  const stats = [
    { label: "Incubators", value: totals.incubators ?? incubators.length, icon: Thermometer },
    { label: "Occupied", value: totals.occupiedIncubators ?? admissions.length, icon: Baby },
    { label: "Daily Charts", value: totals.dailyCharts ?? charts.length, icon: Activity },
    { label: "Phototherapy", value: totals.phototherapy ?? charts.filter((row) => row.phototherapy).length, icon: SunMedium },
    { label: "Growth Alerts", value: totals.growthAlerts ?? 0, icon: Weight },
    { label: "Jaundice Alerts", value: totals.jaundiceAlerts ?? 0, icon: AlertTriangle },
  ];

  const selectedAdmission = useMemo(
    () => admissions.find((row) => row.patientId === selectedPatientId) || admissions[0] || null,
    [admissions, selectedPatientId],
  );

  const saveIncubator = async (event: FormEvent) => {
    event.preventDefault();
    setSaving("incubator");
    try {
      await api.post("/nicu/incubators", incubatorForm);
      setIncubatorForm(emptyIncubator);
      setModal("");
      showNotice("Incubator registered with configuration and starting settings.");
      await load();
    } catch (error: any) {
      showNotice(error?.response?.data?.message || "Incubator could not be registered.", "error");
    } finally {
      setSaving("");
    }
  };

  const admitBaby = async (event: FormEvent) => {
    event.preventDefault();
    setSaving("admission");
    try {
      const res = await api.post("/nicu/admissions", admissionForm);
      setSelectedPatientId(res.data?.patientId || admissionForm.patientId);
      setAdmissionForm(emptyAdmission);
      setModal("");
      showNotice("Baby admitted and assigned to incubator with humidity safeguards.");
      await load();
    } catch (error: any) {
      showNotice(error?.response?.data?.message || "NICU admission could not be saved.", "error");
    } finally {
      setSaving("");
    }
  };

  const saveSettings = async (event: FormEvent) => {
    event.preventDefault();
    const admissionId = settingsForm.admissionId || selectedAdmission?.admissionId || "";
    if (!admissionId) return showNotice("Select or enter a NICU admission first.", "warning");
    setSaving("settings");
    try {
      await api.patch(`/nicu/admissions/${encodeURIComponent(admissionId)}/incubator-settings`, settingsForm);
      setSettingsForm(emptySettings);
      setModal("");
      showNotice("Incubator setting change recorded with timestamp and reason.");
      await load();
    } catch (error: any) {
      showNotice(error?.response?.data?.message || "Incubator settings could not be saved.", "error");
    } finally {
      setSaving("");
    }
  };

  const saveTelemetry = async (event: FormEvent) => {
    event.preventDefault();
    setSaving("telemetry");
    try {
      await api.post("/nicu/telemetry", telemetryForm);
      setTelemetryForm(emptyTelemetry);
      setModal("");
      showNotice("Network incubator telemetry ingested for continuous monitoring.");
      await load();
    } catch (error: any) {
      showNotice(error?.response?.data?.message || "Telemetry could not be recorded.", "error");
    } finally {
      setSaving("");
    }
  };

  const saveDailyChart = async (event: FormEvent) => {
    event.preventDefault();
    setSaving("daily");
    try {
      const payload = {
        ...dailyForm,
        admissionId: dailyForm.admissionId || selectedAdmission?.admissionId,
        patientId: dailyForm.patientId || selectedAdmission?.patientId,
        vitalSigns: [{
          heartRate: Number(dailyForm.heartRate || 0),
          respiratoryRate: Number(dailyForm.respiratoryRate || 0),
          spo2Percent: Number(dailyForm.spo2Percent || 0),
          recordedAt: new Date().toISOString(),
        }],
        feeds: [{
          type: dailyForm.feedingType,
          volumeMl: Number(dailyForm.feedVolumeMl || 0),
          method: dailyForm.feedMethod,
          kcalPerMl: 0.67,
        }],
        ivFluids: [{ volumeMl: Number(dailyForm.ivFluidVolumeMl || 0), fluid: "Maintenance IV fluid" }],
        urineOutputs: [{ volumeMl: Number(dailyForm.urineVolumeMl || 0), periodHours: 24 }],
        glucoseMeasurements: dailyForm.glucoseMgDl ? [{ valueMgDl: Number(dailyForm.glucoseMgDl), recordedAt: new Date().toISOString() }] : [],
        apnoeaBradyEvents: [
          ...Array.from({ length: Number(dailyForm.apneaEvents || 0) }, () => ({ type: "APNOEA", recordedAt: new Date().toISOString() })),
          ...Array.from({ length: Number(dailyForm.bradycardiaEvents || 0) }, () => ({ type: "BRADYCARDIA", recordedAt: new Date().toISOString() })),
          ...Array.from({ length: Number(dailyForm.desaturationEvents || 0) }, () => ({ type: "DESATURATION", recordedAt: new Date().toISOString() })),
        ],
        antibiotics: dailyForm.antibiotics.split(",").map((item) => item.trim()).filter(Boolean),
        medicationsAdministered: dailyForm.medicationsAdministered.split(",").map((item) => item.trim()).filter(Boolean),
        proceduresPerformed: dailyForm.proceduresPerformed.split(",").map((item) => item.trim()).filter(Boolean),
      };
      const res = await api.post("/nicu/daily-charts", payload);
      setLastCalculation(res.data?.calculations || null);
      setDailyForm(emptyDailyChart);
      setModal("");
      showNotice("Daily NICU chart saved with automatic fluid, calorie, urine, growth, and jaundice calculations.");
      await load();
    } catch (error: any) {
      showNotice(error?.response?.data?.message || "Daily NICU chart could not be saved.", "error");
    } finally {
      setSaving("");
    }
  };

  const saveJaundice = async (event: FormEvent) => {
    event.preventDefault();
    setSaving("jaundice");
    try {
      const res = await api.post("/nicu/jaundice", jaundiceForm);
      setLastJaundice(res.data || null);
      setSelectedPatientId(res.data?.patientId || jaundiceForm.patientId);
      setJaundiceForm(emptyJaundice);
      setModal("");
      showNotice("Bilirubin plotted and jaundice recommendation generated.");
      await loadPatientTrends(res.data?.patientId || jaundiceForm.patientId);
      await load();
    } catch (error: any) {
      showNotice(error?.response?.data?.message || "Bilirubin result could not be saved.", "error");
    } finally {
      setSaving("");
    }
  };

  const saveWorkflow = async (event: FormEvent) => {
    event.preventDefault();
    const admissionId = workflowForm.admissionId || selectedAdmission?.admissionId || "";
    const patientId = workflowForm.patientId || selectedAdmission?.patientId || "";
    if (!admissionId || !patientId) return showNotice("Select an active NICU admission first.", "warning");
    setSaving("workflow");
    try {
      if (workflowForm.action === "LIFECYCLE") {
        await api.patch(`/nicu/admissions/${encodeURIComponent(admissionId)}/lifecycle`, {
          status: workflowForm.status,
          reason: workflowForm.reason,
          destination: workflowForm.destination,
          handover: workflowForm.notes,
        });
        showNotice(`NICU admission moved to ${pretty(workflowForm.status)}.`);
      } else {
        await api.post("/nicu/clinical-events", {
          admissionId,
          patientId,
          type: workflowForm.eventType,
          severity: workflowForm.severity,
          intervention: workflowForm.intervention,
          response: workflowForm.response,
          notes: workflowForm.notes,
          destination: workflowForm.destination,
        });
        showNotice("NICU clinical event recorded and routed for review.");
      }
      setWorkflowForm(emptyWorkflow);
      setModal("");
      await load();
    } catch (error: any) {
      showNotice(error?.response?.data?.message || "NICU workflow action could not be saved.", "error");
    } finally {
      setSaving("");
    }
  };

  return (
    <main className="nicu-page nursing-view icu-view">
      {notice ? (
        <div className={`nicu-toast ${notice.tone}`}>
          <strong>{notice.tone === "error" ? "Action blocked" : "NICU"}</strong>
          <span>{notice.text}</span>
          <button type="button" onClick={() => setNotice(null)}><X size={14} /></button>
        </div>
      ) : null}

      <header className="pv-header icu-header nicu-header">
        <div>
          <h2 className="pv-title">NICU</h2>
          <p className="pv-subtitle">Incubators, daily charts, growth monitoring, jaundice management, and neonatal critical-care workflows.</p>
        </div>
        <div className="nursing-header-actions nicu-actions">
          <button type="button" className="icu-btn is-neutral" onClick={() => void load()}><RefreshCw size={16} /> Refresh</button>
          <button type="button" className="icu-btn is-primary" onClick={() => setModal("admission")}><Baby size={16} /> Admit Baby</button>
          <button type="button" className="icu-btn is-info" onClick={() => setModal("daily")}><Activity size={16} /> Daily Chart</button>
        </div>
      </header>

      {waitingListOpen ? (
        <div className="module-form-overlay">
          <section className="module-form-panel icu-modal" role="dialog" aria-modal="true" aria-labelledby="nicu-waiting-title">
            <div className="module-form-header"><div className="module-form-icon"><ClipboardCheck size={20} /></div><div><p className="module-form-kicker">NICU QUEUE</p><h3 id="nicu-waiting-title" className="module-form-title">Open Waiting List</h3></div><button type="button" className="module-form-close" onClick={() => setWaitingListOpen(false)} aria-label="Close waiting list"><X size={18} /></button></div>
            <div className="module-form-body">
              <p className="pv-subtitle">Patients currently queued to the NICU service point.</p>
              <div className="pv-table-wrap"><table className="pv-table"><thead><tr><th>Token</th><th>Patient</th><th>Priority</th><th>Queued</th><th>Status</th></tr></thead><tbody>
                {waitingListLoading ? <tr><td colSpan={5} className="pv-empty">Loading NICU waiting list...</td></tr> : waitingListRows.length === 0 ? <tr><td colSpan={5} className="pv-empty">No patients are waiting for NICU.</td></tr> : waitingListRows.map((row, index) => <tr key={row.tokenId || row.id || `${row.patientId}-${index}`}><td>{row.tokenNumber || "-"}</td><td>{row.patientName || row.name || row.patientCode || row.patientId || "Unnamed patient"}</td><td>{row.priority || "GENERAL"}</td><td>{row.issuedAt ? fmtDate(row.issuedAt) : "-"}</td><td>{row.status || "WAITING"}</td></tr>)}
              </tbody></table></div>
            </div>
            <div className="module-form-footer"><button type="button" className="icu-btn is-neutral" onClick={() => setWaitingListOpen(false)}>Close</button><button type="button" className="icu-btn is-info" onClick={loadWaitingList} disabled={waitingListLoading}><RefreshCw size={15} /> Refresh</button></div>
          </section>
        </div>
      ) : null}

      <section className="nicu-stats">
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

      <section className="nicu-toolbar">
        <label className="nicu-search">
          <Search size={16} />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search admission, incubator, patient..." />
        </label>
        <button type="button" onClick={() => setModal("incubator")}>Register Incubator</button>
        <button type="button" onClick={() => setModal("settings")}>Settings Change</button>
        <button type="button" onClick={() => setModal("telemetry")}>Telemetry</button>
        <button type="button" onClick={() => setModal("jaundice")}>Bilirubin</button>
        <button type="button" onClick={() => setModal("workflow")}>Care Workflow</button>
      </section>

      <section className="nicu-grid">
        <div className="nicu-panel nicu-main">
          <div className="nicu-title">
            <div>
              <span>Incubator Assignment & Temperature Management</span>
              <h2>Active NICU Admissions</h2>
            </div>
            <b>{admissions.length} babies</b>
          </div>
          <div className="nicu-table-wrap">
            <table className="nicu-table">
              <thead>
                <tr>
                  <th>Admission</th>
                  <th>Patient</th>
                  <th>Gestation</th>
                  <th>Incubator</th>
                  <th>Humidity</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {admissions.map((row) => (
                  <tr key={row.admissionId} onClick={() => { setSelectedPatientId(row.patientId); void loadPatientTrends(row.patientId); }}>
                    <td><strong>{row.admissionId}</strong><small>{fmtDate(row.admittedAt)}</small></td>
                    <td><strong>{row.patientId}</strong><small>{row.admissionDiagnosis || "NICU care"}</small></td>
                    <td>{row.gestationalAgeWeeks} weeks</td>
                    <td><small>{row.unitNumber || row.incubatorId || "Not assigned"}</small></td>
                    <td><span className={Number(row.setHumidityPercent) < 70 && Number(row.gestationalAgeWeeks) < 28 ? "nicu-pill red" : "nicu-pill green"}>{row.setHumidityPercent || "-"}%</span></td>
                    <td><span className={row.status === "DIED" || row.status === "CANCELLED" ? "nicu-pill red" : row.status === "TRANSFERRED" || row.status === "DISCHARGE_READY" ? "nicu-pill orange" : "nicu-pill green"}>{pretty(row.status)}</span></td>
                  </tr>
                ))}
                {!admissions.length ? <tr><td colSpan={6} className="nicu-empty">No NICU admissions recorded yet.</td></tr> : null}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="nicu-panel">
          <div className="nicu-title">
            <div>
              <span>Daily Chart Calculations</span>
              <h2>Latest Totals</h2>
            </div>
            <Gauge size={18} />
          </div>
          <div className="nicu-calcs">
            <div><span>Total fluids</span><strong>{lastCalculation?.totalFluidMl ?? "-"} ml</strong></div>
            <div><span>Fluid/kg/day</span><strong>{lastCalculation?.totalFluidMlKgDay ?? "-"} ml/kg</strong></div>
            <div><span>Calories</span><strong>{lastCalculation?.totalCaloriesKcal ?? "-"} kcal</strong></div>
            <div><span>Urine output</span><strong>{lastCalculation?.urineMlKgHour ?? "-"} ml/kg/hr</strong></div>
          </div>
        </aside>
      </section>

      <section className="nicu-bottom-grid">
        <div className="nicu-panel">
          <div className="nicu-title">
            <div>
              <span>Growth Monitoring</span>
              <h2>Fenton Trend</h2>
            </div>
            <LineChart size={18} />
          </div>
          <label className="nicu-inline-field">
            Patient ID
            <input value={selectedPatientId} onChange={(event) => setSelectedPatientId(event.target.value)} onBlur={() => selectedPatientId && loadPatientTrends(selectedPatientId)} />
          </label>
          <div className="nicu-list">
            {(growthTrend?.points || []).slice(-5).map((row: any, index: number) => (
              <article key={`${row.date}-${index}`}>
                <strong>{row.weightGrams} g</strong>
                <small>{fmtDate(row.date)} - day {row.dayOfLife}</small>
                <span className="nicu-pill blue">10g/kg/day target</span>
              </article>
            ))}
            {(growthTrend?.alerts || []).slice(0, 3).map((row: any) => (
              <article key={row.id}>
                <strong>{pretty(row.eventName)}</strong>
                <small>{row.message || "Growth milestone logged"}</small>
                <span className={row.eventName?.includes("alert") ? "nicu-pill red" : "nicu-pill green"}>{row.eventName?.includes("alert") ? "Alert" : "Milestone"}</span>
              </article>
            ))}
            {!growthTrend?.points?.length ? <p className="nicu-empty">Daily weights will plot here after charting.</p> : null}
          </div>
        </div>

        <div className="nicu-panel">
          <div className="nicu-title">
            <div>
              <span>Jaundice Protocol</span>
              <h2>Bhutani Result</h2>
            </div>
            <SunMedium size={18} />
          </div>
          <div className="nicu-result">
            <strong>{lastJaundice?.riskZone ? pretty(lastJaundice.riskZone) : "No current bilirubin"}</strong>
            <p>{lastJaundice?.recommendation || "Enter a bilirubin level to generate a risk zone and treatment recommendation."}</p>
          </div>
          <div className="nicu-list">
            {jaundiceTrend.slice(-5).map((row) => (
              <article key={row.id}>
                <strong>{row.bilirubinMgDl} mg/dL</strong>
                <small>{row.ageHours} hours - {pretty(row.riskZone)}</small>
                <span className={String(row.riskZone).includes("HIGH") ? "nicu-pill red" : "nicu-pill green"}>{pretty(row.eventName)}</span>
              </article>
            ))}
          </div>
        </div>

        <div className="nicu-panel">
          <div className="nicu-title">
            <div>
              <span>Incubator Fleet</span>
              <h2>Registered Units</h2>
            </div>
            <Thermometer size={18} />
          </div>
          <div className="nicu-list">
            {incubators.slice(0, 8).map((row) => (
              <article key={row.incubatorId || row.eventId}>
                <strong>{row.unitNumber || row.incubatorId}</strong>
                <small>{row.model || row.servoMode || "Incubator"} - {row.setTemperatureC || row.temperatureC || "-"} C</small>
                <span className={row.networkEnabled || row.networkDeviceId ? "nicu-pill green" : "nicu-pill"}>{row.networkEnabled || row.networkDeviceId ? "Networked" : pretty(row.status || "Manual")}</span>
              </article>
            ))}
            {!incubators.length ? <p className="nicu-empty">Register incubators before admissions.</p> : null}
          </div>
        </div>
      </section>

      {modal === "incubator" ? (
        <NicuModal tone="green" title="Register Incubator" onClose={() => setModal("")}>
          <form className="nicu-form" onSubmit={saveIncubator}>
            <Field label="Unit Number"><input required value={incubatorForm.unitNumber} onChange={(event) => setIncubatorForm({ ...incubatorForm, unitNumber: event.target.value })} /></Field>
            <Field label="Model"><input value={incubatorForm.model} onChange={(event) => setIncubatorForm({ ...incubatorForm, model: event.target.value })} /></Field>
            <Field label="Set Temperature"><input type="number" step="0.1" value={incubatorForm.setTemperatureC} onChange={(event) => setIncubatorForm({ ...incubatorForm, setTemperatureC: event.target.value })} /></Field>
            <Field label="Set Humidity"><input type="number" value={incubatorForm.setHumidityPercent} onChange={(event) => setIncubatorForm({ ...incubatorForm, setHumidityPercent: event.target.value })} /></Field>
            <Field label="Servo Mode"><select value={incubatorForm.servoMode} onChange={(event) => setIncubatorForm({ ...incubatorForm, servoMode: event.target.value })}><option>AIR_SERVO</option><option>SKIN_SERVO</option><option>MANUAL</option></select></Field>
            <label className="nicu-check"><input type="checkbox" checked={incubatorForm.networkEnabled} onChange={(event) => setIncubatorForm({ ...incubatorForm, networkEnabled: event.target.checked })} /> Network telemetry enabled</label>
            <footer><button type="button" onClick={() => setModal("")}>Cancel</button><button disabled={saving === "incubator"}>Save Incubator</button></footer>
          </form>
        </NicuModal>
      ) : null}

      {modal === "admission" ? (
        <NicuModal tone="blue" title="Admit Baby To NICU" onClose={() => setModal("")}>
          <form className="nicu-form" onSubmit={admitBaby}>
            <Field label="Baby Patient ID"><input required value={admissionForm.patientId} onChange={(event) => setAdmissionForm({ ...admissionForm, patientId: event.target.value })} /></Field>
            <Field label="Newborn Record ID"><input value={admissionForm.newbornId} onChange={(event) => setAdmissionForm({ ...admissionForm, newbornId: event.target.value })} /></Field>
            <Field label="Mother Patient ID"><input value={admissionForm.motherPatientId} onChange={(event) => setAdmissionForm({ ...admissionForm, motherPatientId: event.target.value })} /></Field>
            <Field label="Gestational Age"><input type="number" step="0.1" value={admissionForm.gestationalAgeWeeks} onChange={(event) => setAdmissionForm({ ...admissionForm, gestationalAgeWeeks: event.target.value })} /></Field>
            <Field label="Gestational Age Method"><select value={admissionForm.gestationalAgeMethod} onChange={(event) => setAdmissionForm({ ...admissionForm, gestationalAgeMethod: event.target.value })}><option>MATERNAL_DATES</option><option>EARLY_ULTRASOUND</option><option>NEW_BALLARD</option><option>UNKNOWN</option></select></Field>
            <Field label="Birth Weight"><input type="number" value={admissionForm.birthWeightGrams} onChange={(event) => setAdmissionForm({ ...admissionForm, birthWeightGrams: event.target.value })} /></Field>
            <Field label="Current Weight"><input type="number" value={admissionForm.currentWeightGrams} onChange={(event) => setAdmissionForm({ ...admissionForm, currentWeightGrams: event.target.value })} /></Field>
            <Field label="Sex"><select value={admissionForm.sex} onChange={(event) => setAdmissionForm({ ...admissionForm, sex: event.target.value })}><option>UNKNOWN</option><option>MALE</option><option>FEMALE</option></select></Field>
            <Field label="Incubator ID"><input value={admissionForm.incubatorId} onChange={(event) => setAdmissionForm({ ...admissionForm, incubatorId: event.target.value })} /></Field>
            <Field label="Unit Number"><input value={admissionForm.unitNumber} onChange={(event) => setAdmissionForm({ ...admissionForm, unitNumber: event.target.value })} /></Field>
            <Field label="Temperature"><input type="number" step="0.1" value={admissionForm.setTemperatureC} onChange={(event) => setAdmissionForm({ ...admissionForm, setTemperatureC: event.target.value })} /></Field>
            <Field label="Humidity"><input type="number" value={admissionForm.setHumidityPercent} onChange={(event) => setAdmissionForm({ ...admissionForm, setHumidityPercent: event.target.value })} /></Field>
            <Field label="Birth Date / Time"><input type="datetime-local" value={admissionForm.birthDateTime} onChange={(event) => setAdmissionForm({ ...admissionForm, birthDateTime: event.target.value })} /></Field>
            <Field label="Delivery Mode"><select value={admissionForm.deliveryMode} onChange={(event) => setAdmissionForm({ ...admissionForm, deliveryMode: event.target.value })}><option>VAGINAL</option><option>CAESAREAN</option><option>ASSISTED</option></select></Field>
            <Field label="Birth Length (cm)"><input type="number" step="0.1" value={admissionForm.birthLengthCm} onChange={(event) => setAdmissionForm({ ...admissionForm, birthLengthCm: event.target.value })} /></Field>
            <Field label="Head Circumference (cm)"><input type="number" step="0.1" value={admissionForm.headCircumferenceCm} onChange={(event) => setAdmissionForm({ ...admissionForm, headCircumferenceCm: event.target.value })} /></Field>
            <Field label="APGAR (1 / 5 / 10 min)"><div className="nicu-inline-triple"><input type="number" min="0" max="10" placeholder="1 min" value={admissionForm.apgar1} onChange={(event) => setAdmissionForm({ ...admissionForm, apgar1: event.target.value })} /><input type="number" min="0" max="10" placeholder="5 min" value={admissionForm.apgar5} onChange={(event) => setAdmissionForm({ ...admissionForm, apgar5: event.target.value })} /><input type="number" min="0" max="10" placeholder="10 min" value={admissionForm.apgar10} onChange={(event) => setAdmissionForm({ ...admissionForm, apgar10: event.target.value })} /></div></Field>
            <Field label="Required Level of Care"><select value={admissionForm.requiredLevelOfCare} onChange={(event) => setAdmissionForm({ ...admissionForm, requiredLevelOfCare: event.target.value })}><option>LEVEL_II</option><option>LEVEL_III</option><option>LEVEL_IV</option></select></Field>
            <Field label="Referring Clinician"><input value={admissionForm.referringClinician} onChange={(event) => setAdmissionForm({ ...admissionForm, referringClinician: event.target.value })} /></Field>
            <Field label="Referral Source"><select value={admissionForm.referralSource} onChange={(event) => setAdmissionForm({ ...admissionForm, referralSource: event.target.value })}><option value="">Select source</option><option>MATERNITY</option><option>EMERGENCY</option><option>IPD</option><option>THEATRE</option><option>EXTERNAL_FACILITY</option><option>OTHER_NEONATAL_UNIT</option></select></Field>
            <Field label="Diagnosis" wide><textarea required value={admissionForm.admissionDiagnosis} onChange={(event) => setAdmissionForm({ ...admissionForm, admissionDiagnosis: event.target.value })} /></Field>
            <Field label="Resuscitation history" wide><textarea value={admissionForm.resuscitationHistory} onChange={(event) => setAdmissionForm({ ...admissionForm, resuscitationHistory: event.target.value })} /></Field>
            <Field label="Maternal history"><textarea value={admissionForm.maternalHistory} onChange={(event) => setAdmissionForm({ ...admissionForm, maternalHistory: event.target.value })} /></Field>
            <Field label="Antenatal complications"><textarea value={admissionForm.antenatalComplications} onChange={(event) => setAdmissionForm({ ...admissionForm, antenatalComplications: event.target.value })} /></Field>
            <Field label="Delivery complications" wide><textarea value={admissionForm.deliveryComplications} onChange={(event) => setAdmissionForm({ ...admissionForm, deliveryComplications: event.target.value })} /></Field>
            <Field label="Respiratory status"><textarea value={admissionForm.respiratoryStatus} onChange={(event) => setAdmissionForm({ ...admissionForm, respiratoryStatus: event.target.value })} /></Field>
            <Field label="Infection / sepsis risk"><textarea value={admissionForm.infectionSepsisRisk} onChange={(event) => setAdmissionForm({ ...admissionForm, infectionSepsisRisk: event.target.value })} /></Field>
            <Field label="Oxygen requirement"><input value={admissionForm.oxygenRequirement} onChange={(event) => setAdmissionForm({ ...admissionForm, oxygenRequirement: event.target.value })} /></Field>
            <Field label="Feeding status"><input value={admissionForm.feedingStatus} onChange={(event) => setAdmissionForm({ ...admissionForm, feedingStatus: event.target.value })} /></Field>
            <Field label="IV access"><input value={admissionForm.ivAccess} onChange={(event) => setAdmissionForm({ ...admissionForm, ivAccess: event.target.value })} /></Field>
            <Field label="Current medications"><textarea value={admissionForm.currentMedications} onChange={(event) => setAdmissionForm({ ...admissionForm, currentMedications: event.target.value })} /></Field>
            <Field label="Blood requirement"><input value={admissionForm.bloodRequirement} onChange={(event) => setAdmissionForm({ ...admissionForm, bloodRequirement: event.target.value })} /></Field>
            <Field label="Isolation requirement"><input value={admissionForm.isolationRequirement} onChange={(event) => setAdmissionForm({ ...admissionForm, isolationRequirement: event.target.value })} /></Field>
            <label className="nicu-check"><input type="checkbox" checked={admissionForm.consentObtained} onChange={(event) => setAdmissionForm({ ...admissionForm, consentObtained: event.target.checked })} /> Parent or guardian NICU consent obtained</label>
            <footer><button type="button" onClick={() => setModal("")}>Cancel</button><button disabled={saving === "admission"}>Admit Baby</button></footer>
          </form>
        </NicuModal>
      ) : null}

      {modal === "settings" ? (
        <NicuModal tone="orange" title="Record Incubator Setting Change" onClose={() => setModal("")}>
          <form className="nicu-form" onSubmit={saveSettings}>
            <Field label="Admission ID"><input value={settingsForm.admissionId || selectedAdmission?.admissionId || ""} onChange={(event) => setSettingsForm({ ...settingsForm, admissionId: event.target.value })} /></Field>
            <Field label="Incubator ID"><input value={settingsForm.incubatorId} onChange={(event) => setSettingsForm({ ...settingsForm, incubatorId: event.target.value })} /></Field>
            <Field label="Unit Number"><input value={settingsForm.unitNumber} onChange={(event) => setSettingsForm({ ...settingsForm, unitNumber: event.target.value })} /></Field>
            <Field label="Temperature"><input type="number" step="0.1" value={settingsForm.setTemperatureC} onChange={(event) => setSettingsForm({ ...settingsForm, setTemperatureC: event.target.value })} /></Field>
            <Field label="Humidity"><input type="number" value={settingsForm.setHumidityPercent} onChange={(event) => setSettingsForm({ ...settingsForm, setHumidityPercent: event.target.value })} /></Field>
            <Field label="Servo Mode"><select value={settingsForm.servoMode} onChange={(event) => setSettingsForm({ ...settingsForm, servoMode: event.target.value })}><option>AIR_SERVO</option><option>SKIN_SERVO</option><option>MANUAL</option></select></Field>
            <Field label="Reason" wide><textarea required value={settingsForm.reason} onChange={(event) => setSettingsForm({ ...settingsForm, reason: event.target.value })} /></Field>
            <footer><button type="button" onClick={() => setModal("")}>Cancel</button><button disabled={saving === "settings"}>Record Change</button></footer>
          </form>
        </NicuModal>
      ) : null}

      {modal === "telemetry" ? (
        <NicuModal tone="teal" title="Ingest Network Incubator Telemetry" onClose={() => setModal("")}>
          <form className="nicu-form" onSubmit={saveTelemetry}>
            <Field label="Incubator ID"><input value={telemetryForm.incubatorId} onChange={(event) => setTelemetryForm({ ...telemetryForm, incubatorId: event.target.value })} /></Field>
            <Field label="Unit Number"><input value={telemetryForm.unitNumber} onChange={(event) => setTelemetryForm({ ...telemetryForm, unitNumber: event.target.value })} /></Field>
            <Field label="Patient ID"><input value={telemetryForm.patientId} onChange={(event) => setTelemetryForm({ ...telemetryForm, patientId: event.target.value })} /></Field>
            <Field label="Device ID"><input value={telemetryForm.networkDeviceId} onChange={(event) => setTelemetryForm({ ...telemetryForm, networkDeviceId: event.target.value })} /></Field>
            <Field label="Temperature"><input type="number" step="0.1" value={telemetryForm.temperatureC} onChange={(event) => setTelemetryForm({ ...telemetryForm, temperatureC: event.target.value })} /></Field>
            <Field label="Humidity"><input type="number" value={telemetryForm.humidityPercent} onChange={(event) => setTelemetryForm({ ...telemetryForm, humidityPercent: event.target.value })} /></Field>
            <footer><button type="button" onClick={() => setModal("")}>Cancel</button><button disabled={saving === "telemetry"}>Save Telemetry</button></footer>
          </form>
        </NicuModal>
      ) : null}

      {modal === "daily" ? (
        <NicuModal tone="blue" title="NICU Daily Chart" onClose={() => setModal("")}>
          <form className="nicu-form" onSubmit={saveDailyChart}>
            <Field label="Admission ID"><input value={dailyForm.admissionId || selectedAdmission?.admissionId || ""} onChange={(event) => setDailyForm({ ...dailyForm, admissionId: event.target.value })} /></Field>
            <Field label="Patient ID"><input required value={dailyForm.patientId || selectedAdmission?.patientId || ""} onChange={(event) => setDailyForm({ ...dailyForm, patientId: event.target.value })} /></Field>
            <Field label="Record Date"><input type="date" value={dailyForm.recordDate} onChange={(event) => setDailyForm({ ...dailyForm, recordDate: event.target.value })} /></Field>
            <Field label="Day Of Life"><input type="number" value={dailyForm.dayOfLife} onChange={(event) => setDailyForm({ ...dailyForm, dayOfLife: event.target.value })} /></Field>
            <Field label="Weight (g)"><input type="number" value={dailyForm.weightGrams} onChange={(event) => setDailyForm({ ...dailyForm, weightGrams: event.target.value })} /></Field>
            <Field label="Birth Weight (g)"><input type="number" value={dailyForm.birthWeightGrams} onChange={(event) => setDailyForm({ ...dailyForm, birthWeightGrams: event.target.value })} /></Field>
            <Field label="Temperature"><input type="number" step="0.1" value={dailyForm.temperatureC} onChange={(event) => setDailyForm({ ...dailyForm, temperatureC: event.target.value })} /></Field>
            <Field label="Heart Rate"><input type="number" value={dailyForm.heartRate} onChange={(event) => setDailyForm({ ...dailyForm, heartRate: event.target.value })} /></Field>
            <Field label="Respiratory Rate"><input type="number" value={dailyForm.respiratoryRate} onChange={(event) => setDailyForm({ ...dailyForm, respiratoryRate: event.target.value })} /></Field>
            <Field label="SpO2"><input type="number" value={dailyForm.spo2Percent} onChange={(event) => setDailyForm({ ...dailyForm, spo2Percent: event.target.value })} /></Field>
            <Field label="Blood Pressure / MAP"><div className="nicu-inline-triple"><input placeholder="BP" value={dailyForm.bloodPressure} onChange={(event) => setDailyForm({ ...dailyForm, bloodPressure: event.target.value })} /><input type="number" placeholder="MAP" value={dailyForm.map} onChange={(event) => setDailyForm({ ...dailyForm, map: event.target.value })} /></div></Field>
            <Field label="Respiratory Support"><select value={dailyForm.respiratorySupport} onChange={(event) => setDailyForm({ ...dailyForm, respiratorySupport: event.target.value })}><option>NONE</option><option>OXYGEN</option><option>CPAP</option><option>HFNC</option><option>VENTILATOR</option></select></Field>
            <Field label="FiO2 %"><input type="number" value={dailyForm.fio2Percent} onChange={(event) => setDailyForm({ ...dailyForm, fio2Percent: event.target.value })} /></Field>
            <Field label="Respiratory device"><input value={dailyForm.respiratoryDevice} onChange={(event) => setDailyForm({ ...dailyForm, respiratoryDevice: event.target.value })} placeholder="Device" /></Field>
            <Field label="Respiratory mode"><input value={dailyForm.respiratoryMode} onChange={(event) => setDailyForm({ ...dailyForm, respiratoryMode: event.target.value })} placeholder="Mode" /></Field>
            <Field label="Flow / PEEP"><div className="nicu-inline-triple"><input type="number" step="0.1" placeholder="Flow" value={dailyForm.flowRate} onChange={(event) => setDailyForm({ ...dailyForm, flowRate: event.target.value })} /><input type="number" step="0.1" placeholder="PEEP" value={dailyForm.peep} onChange={(event) => setDailyForm({ ...dailyForm, peep: event.target.value })} /></div></Field>
            <Field label="Apnoea / Brady / Desaturation"><div className="nicu-inline-triple"><input type="number" min="0" placeholder="Apnoea" value={dailyForm.apneaEvents} onChange={(event) => setDailyForm({ ...dailyForm, apneaEvents: event.target.value })} /><input type="number" min="0" placeholder="Brady" value={dailyForm.bradycardiaEvents} onChange={(event) => setDailyForm({ ...dailyForm, bradycardiaEvents: event.target.value })} /><input type="number" min="0" placeholder="Desat" value={dailyForm.desaturationEvents} onChange={(event) => setDailyForm({ ...dailyForm, desaturationEvents: event.target.value })} /></div></Field>
            <Field label="Incubator Temp"><input type="number" step="0.1" value={dailyForm.incubatorTemp} onChange={(event) => setDailyForm({ ...dailyForm, incubatorTemp: event.target.value })} /></Field>
            <Field label="Incubator Humidity"><input type="number" value={dailyForm.incubatorHumidity} onChange={(event) => setDailyForm({ ...dailyForm, incubatorHumidity: event.target.value })} /></Field>
            <Field label="Feed Type"><input value={dailyForm.feedingType} onChange={(event) => setDailyForm({ ...dailyForm, feedingType: event.target.value })} /></Field>
            <Field label="Feed Volume"><input type="number" value={dailyForm.feedVolumeMl} onChange={(event) => setDailyForm({ ...dailyForm, feedVolumeMl: event.target.value })} /></Field>
            <Field label="Feed Method"><select value={dailyForm.feedMethod} onChange={(event) => setDailyForm({ ...dailyForm, feedMethod: event.target.value })}><option>NGT</option><option>CUP</option><option>BREAST</option><option>BOTTLE</option></select></Field>
            <Field label="IV Fluid Volume"><input type="number" value={dailyForm.ivFluidVolumeMl} onChange={(event) => setDailyForm({ ...dailyForm, ivFluidVolumeMl: event.target.value })} /></Field>
            <Field label="Urine Volume"><input type="number" value={dailyForm.urineVolumeMl} onChange={(event) => setDailyForm({ ...dailyForm, urineVolumeMl: event.target.value })} /></Field>
            <Field label="Urine output (ml/kg/hr)"><input type="number" step="0.01" value={dailyForm.urineOutputMlKgHour} onChange={(event) => setDailyForm({ ...dailyForm, urineOutputMlKgHour: event.target.value })} /></Field>
            <Field label="Total fluid target (ml/kg/day)"><input type="number" step="0.1" value={dailyForm.totalFluidTargetMlKgDay} onChange={(event) => setDailyForm({ ...dailyForm, totalFluidTargetMlKgDay: event.target.value })} /></Field>
            <Field label="Blood Glucose"><input type="number" value={dailyForm.glucoseMgDl} onChange={(event) => setDailyForm({ ...dailyForm, glucoseMgDl: event.target.value })} /></Field>
            <Field label="Feed Tolerance"><select value={dailyForm.feedTolerance} onChange={(event) => setDailyForm({ ...dailyForm, feedTolerance: event.target.value })}><option>TOLERATED</option><option>RESIDUALS</option><option>VOMITING</option><option>ABDOMINAL_CONCERNS</option><option>HELD</option></select></Field>
            <Field label="Residual / Stool"><div className="nicu-inline-triple"><input type="number" placeholder="Residual ml" value={dailyForm.residualMl} onChange={(event) => setDailyForm({ ...dailyForm, residualMl: event.target.value })} /><input placeholder="Stool notes" value={dailyForm.stoolNotes} onChange={(event) => setDailyForm({ ...dailyForm, stoolNotes: event.target.value })} /></div></Field>
            <Field label="Bilirubin"><input type="number" step="0.1" value={dailyForm.bilirubinTotal} onChange={(event) => setDailyForm({ ...dailyForm, bilirubinTotal: event.target.value })} /></Field>
            <Field label="Phototherapy Hours"><input type="number" value={dailyForm.phototherapyHours} onChange={(event) => setDailyForm({ ...dailyForm, phototherapyHours: event.target.value })} /></Field>
            <label className="nicu-check"><input type="checkbox" checked={dailyForm.phototherapy} onChange={(event) => setDailyForm({ ...dailyForm, phototherapy: event.target.checked })} /> Phototherapy active</label>
            <Field label="Medications" wide><input value={dailyForm.medicationsAdministered} onChange={(event) => setDailyForm({ ...dailyForm, medicationsAdministered: event.target.value })} placeholder="Comma separated" /></Field>
            <Field label="Antibiotics" wide><input value={dailyForm.antibiotics} onChange={(event) => setDailyForm({ ...dailyForm, antibiotics: event.target.value })} placeholder="Comma separated" /></Field>
            <Field label="Procedures" wide><input value={dailyForm.proceduresPerformed} onChange={(event) => setDailyForm({ ...dailyForm, proceduresPerformed: event.target.value })} placeholder="Comma separated" /></Field>
            <Field label="Assessment Notes" wide><textarea value={dailyForm.assessmentNotes} onChange={(event) => setDailyForm({ ...dailyForm, assessmentNotes: event.target.value })} /></Field>
            <Field label="Neurological status"><textarea value={dailyForm.neurologicalStatus} onChange={(event) => setDailyForm({ ...dailyForm, neurologicalStatus: event.target.value })} /></Field>
            <Field label="Pain / comfort"><textarea value={dailyForm.painComfort} onChange={(event) => setDailyForm({ ...dailyForm, painComfort: event.target.value })} /></Field>
            <Field label="Family / KMC notes" wide><textarea value={dailyForm.familyKmcNotes} onChange={(event) => setDailyForm({ ...dailyForm, familyKmcNotes: event.target.value })} /></Field>
            <footer><button type="button" onClick={() => setModal("")}>Cancel</button><button disabled={saving === "daily"}>Save Daily Chart</button></footer>
          </form>
        </NicuModal>
      ) : null}

      {modal === "jaundice" ? (
        <NicuModal tone="red" title="Record Bilirubin & Protocol Decision" onClose={() => setModal("")}>
          <form className="nicu-form" onSubmit={saveJaundice}>
            <Field label="Admission ID"><input value={jaundiceForm.admissionId} onChange={(event) => setJaundiceForm({ ...jaundiceForm, admissionId: event.target.value })} /></Field>
            <Field label="Patient ID"><input required value={jaundiceForm.patientId || selectedPatientId} onChange={(event) => setJaundiceForm({ ...jaundiceForm, patientId: event.target.value })} /></Field>
            <Field label="Age In Hours"><input type="number" value={jaundiceForm.ageHours} onChange={(event) => setJaundiceForm({ ...jaundiceForm, ageHours: event.target.value })} /></Field>
            <Field label="Gestation Weeks"><input type="number" value={jaundiceForm.gestationalAgeWeeks} onChange={(event) => setJaundiceForm({ ...jaundiceForm, gestationalAgeWeeks: event.target.value })} /></Field>
            <Field label="Bilirubin mg/dL"><input type="number" step="0.1" value={jaundiceForm.bilirubinMgDl} onChange={(event) => setJaundiceForm({ ...jaundiceForm, bilirubinMgDl: event.target.value })} /></Field>
            <Field label="Previous Bilirubin"><input type="number" step="0.1" value={jaundiceForm.previousBilirubinMgDl} onChange={(event) => setJaundiceForm({ ...jaundiceForm, previousBilirubinMgDl: event.target.value })} /></Field>
            <footer><button type="button" onClick={() => setModal("")}>Cancel</button><button disabled={saving === "jaundice"}>Generate Recommendation</button></footer>
          </form>
        </NicuModal>
      ) : null}

      {modal === "workflow" ? (
        <NicuModal tone="purple" title="NICU Care Workflow" onClose={() => setModal("")}>
          <form className="nicu-form" onSubmit={saveWorkflow}>
            <Field label="Admission ID"><input required value={workflowForm.admissionId || selectedAdmission?.admissionId || ""} onChange={(event) => setWorkflowForm({ ...workflowForm, admissionId: event.target.value })} /></Field>
            <Field label="Patient ID"><input required value={workflowForm.patientId || selectedAdmission?.patientId || ""} onChange={(event) => setWorkflowForm({ ...workflowForm, patientId: event.target.value })} /></Field>
            <Field label="Workflow action"><select value={workflowForm.action} onChange={(event) => setWorkflowForm({ ...workflowForm, action: event.target.value })}><option value="LIFECYCLE">Admission lifecycle</option><option value="CLINICAL">Clinical event / alert</option></select></Field>
            {workflowForm.action === "LIFECYCLE" ? (
              <Field label="New lifecycle state"><select value={workflowForm.status} onChange={(event) => setWorkflowForm({ ...workflowForm, status: event.target.value })}>
                <option>ONGOING_MONITORING</option><option>DAILY_REVIEW</option><option>CARE_ESCALATION</option><option>CARE_DE_ESCALATION</option><option>DISCHARGE_PLANNING</option><option>DISCHARGE_READY</option><option>NICU_DISCHARGED</option><option>TRANSFERRED</option><option>READMITTED</option><option>LEFT_AGAINST_MEDICAL_ADVICE</option><option>DIED</option><option>CANCELLED</option>
              </select></Field>
            ) : (
              <><Field label="Clinical event"><select value={workflowForm.eventType} onChange={(event) => setWorkflowForm({ ...workflowForm, eventType: event.target.value })}><option>DETERIORATION</option><option>APNOEA</option><option>BRADYCARDIA</option><option>DESATURATION</option><option>RESPIRATORY_SUPPORT_CHANGED</option><option>SEPSIS_CONCERN</option><option>CRITICAL_RESULT</option><option>KMC_SESSION</option><option>FEEDING_INTOLERANCE</option><option>PROCEDURE</option></select></Field><Field label="Severity"><select value={workflowForm.severity} onChange={(event) => setWorkflowForm({ ...workflowForm, severity: event.target.value })}><option>ROUTINE</option><option>URGENT</option><option>CRITICAL</option></select></Field></>
            )}
            <Field label="Destination / referral"><input value={workflowForm.destination} onChange={(event) => setWorkflowForm({ ...workflowForm, destination: event.target.value })} placeholder="ICU, Maternity, Mortuary, Lab, etc." /></Field>
            <Field label={workflowForm.action === "LIFECYCLE" ? "Reason" : "Intervention"} wide><textarea required={workflowForm.action === "LIFECYCLE" && ["CARE_ESCALATION", "TRANSFERRED", "LEFT_AGAINST_MEDICAL_ADVICE", "DIED", "CANCELLED"].includes(workflowForm.status)} value={workflowForm.action === "LIFECYCLE" ? workflowForm.reason : workflowForm.intervention} onChange={(event) => setWorkflowForm({ ...workflowForm, ...(workflowForm.action === "LIFECYCLE" ? { reason: event.target.value } : { intervention: event.target.value }) })} /></Field>
            <Field label="Response / handover notes" wide><textarea value={workflowForm.action === "LIFECYCLE" ? workflowForm.notes : workflowForm.response} onChange={(event) => setWorkflowForm({ ...workflowForm, ...(workflowForm.action === "LIFECYCLE" ? { notes: event.target.value } : { response: event.target.value }) })} /></Field>
            <footer><button type="button" onClick={() => setModal("")}>Cancel</button><button disabled={saving === "workflow"}>Save Workflow Action</button></footer>
          </form>
        </NicuModal>
      ) : null}
    </main>
  );
}

function Field({ label, wide, children }: { label: string; wide?: boolean; children: React.ReactNode }) {
  return <label className={wide ? "wide" : ""}>{label}{children}</label>;
}

function NicuModal({
  title,
  tone,
  children,
  onClose,
}: {
  title: string;
  tone: "green" | "blue" | "teal" | "orange" | "purple" | "red";
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="nicu-modal-backdrop">
      <section className={`nicu-modal is-${tone}`}>
        <header>
          <div>
            <span>NICU Workflow</span>
            <h2>{title}</h2>
          </div>
          <button type="button" className="nicu-modal-close" onClick={onClose} aria-label="Close NICU form" title="Close form"><X size={18} strokeWidth={2.5} /></button>
        </header>
        {children}
      </section>
    </div>
  );
}
