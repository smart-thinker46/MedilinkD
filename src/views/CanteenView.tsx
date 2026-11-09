
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BellRing,
  ClipboardList,
  CookingPot,
  ForkKnife,
  Maximize2,
  Minimize2,
  RefreshCw,
  Send,
  Utensils,
} from "lucide-react";
import { api } from "../lib/api";
import { useLiveRefresh } from "../lib/liveRefresh";

type KitchenPatient = {
  inpatientId: string;
  patientId: string;
  patientName: string;
  mrn: string;
  patientCode: string;
  ward: string;
  bed: string;
  currentDietType: string;
  dietStatusColor: "red" | "green";
  npo: boolean;
  updatedAt: string;
  latestDietOrder?: any;
  recentConsumption?: any;
  nutritionAlert?: any;
};

type ConsumptionLog = {
  id: string;
  inpatientId: string;
  patientId: string;
  patientName: string;
  ward: string;
  bed: string;
  mealType: string;
  consumption: string;
  consumptionPercent: number;
  recordedAt: string;
};

const DIET_TYPES = ["REGULAR", "DIABETIC", "LOW_SODIUM", "RENAL", "NPO", "LIQUID", "SOFT", "PUREED", "HIGH_PROTEIN"];
const MEAL_TYPES = ["BREAKFAST", "LUNCH", "DINNER", "SNACK"];
const CONSUMPTION_LEVELS = ["ALL", "MOST", "HALF", "LITTLE", "NONE", "REFUSED"];

const pretty = (value?: string) => String(value || "").replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());

const formatDateTime = (value?: string) => {
  const date = new Date(String(value || ""));
  if (!Number.isFinite(date.getTime())) return "Not recorded";
  return date.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
};

const toastTone = (message: string) => {
  const lower = message.toLowerCase();
  if (/(failed|unable|required|not found|error)/.test(lower)) return "error";
  if (/(alert|npo|less than half|pending)/.test(lower)) return "warning";
  return "success";
};

export default function CanteenView() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [patients, setPatients] = useState<KitchenPatient[]>([]);
  const [consumptionLogs, setConsumptionLogs] = useState<ConsumptionLog[]>([]);
  const [operationalReport, setOperationalReport] = useState<any>(null);
  const [forecast, setForecast] = useState<any>(null);
  const [productionPlans, setProductionPlans] = useState<any[]>([]);
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [configuration, setConfiguration] = useState<any>(null);
  const [expandedConsumption, setExpandedConsumption] = useState(false);
  const [activeForm, setActiveForm] = useState<"diet" | "consumption" | "operational" | null>(null);
  const [operationalKind, setOperationalKind] = useState("PRODUCTION");
  const [operationalForm, setOperationalForm] = useState({
    name: "",
    mealType: "LUNCH",
    ward: "",
    dietType: "REGULAR",
    status: "DRAFT",
    notes: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [dietForm, setDietForm] = useState({
    patientId: "",
    inpatientId: "",
    dietType: "DIABETIC",
    source: "EMR",
    note: "",
  });
  const [mealForm, setMealForm] = useState({
    patientId: "",
    inpatientId: "",
    mealType: "LUNCH",
    consumption: "HALF",
    notes: "",
  });

  const filteredPatients = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return patients;
    return patients.filter((row) =>
      [row.patientName, row.mrn, row.patientCode, row.ward, row.bed, row.currentDietType]
        .join(" ")
        .toLowerCase()
        .includes(term),
    );
  }, [patients, search]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [dashboardRes, boardRes, consumptionRes, reportRes, productionRes, deliveryRes, configurationRes, forecastRes] = await Promise.all([
        api.get("/canteen/dashboard").catch(() => ({ data: null })),
        api.get("/canteen/kitchen-board?limit=500"),
        api.get("/canteen/consumption?limit=100"),
        api.get("/canteen/report").catch(() => ({ data: null })),
        api.get("/canteen/operational/production?limit=100").catch(() => ({ data: [] })),
        api.get("/canteen/operational/delivery?limit=100").catch(() => ({ data: [] })),
        api.get("/canteen/configuration").catch(() => ({ data: null })),
        api.get("/canteen/forecast").catch(() => ({ data: null })),
      ]);
      setDashboard(dashboardRes.data);
      setPatients(Array.isArray(boardRes.data) ? boardRes.data : []);
      setConsumptionLogs(Array.isArray(consumptionRes.data) ? consumptionRes.data : []);
      setOperationalReport(reportRes.data || null);
      setProductionPlans(Array.isArray(productionRes.data) ? productionRes.data : []);
      setDeliveries(Array.isArray(deliveryRes.data) ? deliveryRes.data : []);
      setConfiguration(configurationRes.data || null);
      setForecast(forecastRes.data || null);
    } catch (error: any) {
      setNotice(error?.response?.data?.message || "Unable to load canteen operations.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  useLiveRefresh(loadData, { intervalMs: 30000 });

  const selectPatient = (patient: KitchenPatient) => {
    setDietForm((current) => ({ ...current, patientId: patient.patientId, inpatientId: patient.inpatientId }));
    setMealForm((current) => ({ ...current, patientId: patient.patientId, inpatientId: patient.inpatientId }));
  };

  const postDietOrder = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!dietForm.patientId.trim() && !dietForm.inpatientId.trim()) {
      setNotice("Select a patient or enter a patient/admission ID.");
      return;
    }
    setSaving("diet");
    try {
      const response = await api.post("/canteen/diet-orders", dietForm);
      setNotice(response.data?.npo ? "NPO order posted to the kitchen in red." : "Diet order posted to the kitchen.");
      setDietForm((current) => ({ ...current, note: "" }));
      setActiveForm(null);
      await loadData();
    } catch (error: any) {
      setNotice(error?.response?.data?.message || "Unable to post diet order.");
    } finally {
      setSaving("");
    }
  };

  const recordConsumption = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!mealForm.patientId.trim() && !mealForm.inpatientId.trim()) {
      setNotice("Select a patient or enter a patient/admission ID.");
      return;
    }
    setSaving("meal");
    try {
      const response = await api.post("/canteen/consumption", mealForm);
      setNotice(response.data?.alertCreated ? "Dietitian alert created for low meal intake." : "Meal consumption recorded.");
      setMealForm((current) => ({ ...current, notes: "" }));
      setActiveForm(null);
      await loadData();
    } catch (error: any) {
      setNotice(error?.response?.data?.message || "Unable to record meal consumption.");
    } finally {
      setSaving("");
    }
  };

  const createOperational = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!operationalForm.name.trim()) {
      setNotice("A record name or identifier is required.");
      return;
    }
    setSaving("operational");
    try {
      await api.post(`/canteen/operational/${operationalKind.toLowerCase()}`, {
        ...operationalForm,
        recordName: operationalForm.name.trim(),
      });
      setNotice(`${pretty(operationalKind)} record saved.`);
      setOperationalForm((current) => ({ ...current, name: "", notes: "" }));
      setActiveForm(null);
      await loadData();
    } catch (error: any) {
      setNotice(error?.response?.data?.message || "Unable to save the canteen operational record.");
    } finally {
      setSaving("");
    }
  };

  const stats = [
    { label: "Active Patients", value: dashboard?.activePatients ?? patients.length, icon: Utensils },
    { label: "NPO Orders", value: dashboard?.npoPatients ?? patients.filter((row) => row.npo).length, icon: AlertTriangle },
    { label: "Diet Orders", value: dashboard?.dietOrders ?? 0, icon: ClipboardList },
    { label: "Meals Today", value: dashboard?.todayOrders ?? 0, icon: ForkKnife },
    { label: "Consumption Logs", value: dashboard?.consumptionLogsToday ?? consumptionLogs.length, icon: CookingPot },
    { label: "Dietitian Alerts", value: dashboard?.nutritionAlerts ?? 0, icon: BellRing },
    { label: "Meals Delivered", value: operationalReport?.delivered ?? 0, icon: Utensils },
    { label: "Missed Meals", value: operationalReport?.missedMeals ?? 0, icon: AlertTriangle },
    { label: "Safety Exceptions", value: operationalReport?.safetyExceptions ?? 0, icon: BellRing },
    { label: "Forecast Meals", value: forecast?.mealsRequired ?? 0, icon: ClipboardList },
  ];

  return (
    <main className="canteen-page">
      <header className="canteen-header">
        <div>
          <span className="canteen-kicker">Canteen</span>
          <h1>Canteen Operations</h1>
          <p>Clinical diets, kitchen routing, meal delivery, and nutritional intake follow-up.</p>
        </div>
        <div className="canteen-header-actions">
          <button className="canteen-refresh" onClick={() => void loadData()} disabled={loading}><RefreshCw size={17} /> Refresh</button>
          <button className="canteen-action-btn" onClick={() => setActiveForm("diet")}><ClipboardList size={16} /> Diet Order</button>
          <button className="canteen-action-btn" onClick={() => setActiveForm("consumption")}><CookingPot size={16} /> Record Intake</button>
          <button className="canteen-action-btn" onClick={() => setActiveForm("operational")}><Utensils size={16} /> Operations</button>
        </div>
      </header>

      {notice ? <div className={`canteen-toast ${toastTone(notice)}`}>{notice}</div> : null}

      <section className="canteen-stats">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <article className="canteen-stat" key={stat.label}>
              <div className="canteen-stat-copy"><span>{stat.label}</span><strong>{stat.value}</strong></div>
              <span className="canteen-stat-icon"><Icon size={20} /></span>
            </article>
          );
        })}
      </section>

      <section className="canteen-grid">
        <form className={`canteen-panel canteen-form ${activeForm === "diet" ? "canteen-modal-form" : "is-hidden"}`} onSubmit={postDietOrder}>
          <div className="canteen-panel-title">
            <ClipboardList size={18} />
            <div>
              <h2>Clinical Diet Order</h2>
              <p>Post or update the current diet directly to the kitchen board.</p>
            </div>
            <button type="button" className="canteen-modal-close" onClick={() => setActiveForm(null)} aria-label="Close diet order form">×</button>
          </div>
          <label>
            Admission ID
            <input value={dietForm.inpatientId} onChange={(event) => setDietForm({ ...dietForm, inpatientId: event.target.value })} placeholder="Inpatient/admission ID" />
          </label>
          <label>
            Patient ID
            <input value={dietForm.patientId} onChange={(event) => setDietForm({ ...dietForm, patientId: event.target.value })} placeholder="Patient ID" />
          </label>
          <label>
            Diet Type
            <select value={dietForm.dietType} onChange={(event) => setDietForm({ ...dietForm, dietType: event.target.value })}>
              {(configuration?.dietTypes || DIET_TYPES).map((diet: string) => <option key={diet} value={diet}>{pretty(diet)}</option>)}
            </select>
          </label>
          <label>
            Source
            <select value={dietForm.source} onChange={(event) => setDietForm({ ...dietForm, source: event.target.value })}>
              <option value="EMR">EMR</option>
              <option value="DOCTOR">Doctor</option>
              <option value="NUTRITION">Nutrition</option>
            </select>
          </label>
          <label className="span-2">
            Clinical Note
            <textarea value={dietForm.note} onChange={(event) => setDietForm({ ...dietForm, note: event.target.value })} placeholder="Diet change reason or instruction" />
          </label>
          <button className="canteen-primary" disabled={saving === "diet"}>
            <Send size={16} /> {saving === "diet" ? "Posting..." : "Post Diet Order"}
          </button>
        </form>

        <form className={`canteen-panel canteen-form ${activeForm === "consumption" ? "canteen-modal-form" : "is-hidden"}`} onSubmit={recordConsumption}>
          <div className="canteen-panel-title">
            <CookingPot size={18} />
            <div>
              <h2>Meal Consumption</h2>
              <p>Ward nurse intake documentation feeds the dietitian review queue.</p>
            </div>
            <button type="button" className="canteen-modal-close" onClick={() => setActiveForm(null)} aria-label="Close consumption form">×</button>
          </div>
          <label>
            Admission ID
            <input value={mealForm.inpatientId} onChange={(event) => setMealForm({ ...mealForm, inpatientId: event.target.value })} placeholder="Inpatient/admission ID" />
          </label>
          <label>
            Patient ID
            <input value={mealForm.patientId} onChange={(event) => setMealForm({ ...mealForm, patientId: event.target.value })} placeholder="Patient ID" />
          </label>
          <label>
            Meal
            <select value={mealForm.mealType} onChange={(event) => setMealForm({ ...mealForm, mealType: event.target.value })}>
              {(configuration?.mealTypes || MEAL_TYPES).map((meal: string) => <option key={meal} value={meal}>{pretty(meal)}</option>)}
            </select>
          </label>
          <label>
            Consumed
            <select value={mealForm.consumption} onChange={(event) => setMealForm({ ...mealForm, consumption: event.target.value })}>
              {(configuration?.consumptionLevels || CONSUMPTION_LEVELS).map((level: string) => <option key={level} value={level}>{pretty(level)}</option>)}
            </select>
          </label>
          <label className="span-2">
            Notes
            <textarea value={mealForm.notes} onChange={(event) => setMealForm({ ...mealForm, notes: event.target.value })} placeholder="Ward note" />
          </label>
          <button className="canteen-primary" disabled={saving === "meal"}>
            <Send size={16} /> {saving === "meal" ? "Saving..." : "Record Consumption"}
          </button>
        </form>
      </section>

      <section className="canteen-panel">
        <div className="canteen-panel-title"><CookingPot size={18} /><div><h2>Production & Delivery Control</h2><p>Track production plans, tray dispatch, delivery exceptions, and replacements.</p></div></div>
        <div className="canteen-table-wrap"><table className="canteen-table"><thead><tr><th>Record</th><th>Patient / Ward</th><th>Meal</th><th>Status</th><th>Updated</th></tr></thead><tbody>{[...productionPlans, ...deliveries].length ? [...productionPlans, ...deliveries].slice(0, 100).map((row: any) => <tr key={`${row.module}-${row.id}`}><td>{row.trayId || row.planId || row.id}</td><td>{row.patientName || row.ward || row.patientId || "Production plan"}</td><td>{pretty(row.mealType || row.mealPeriod || "—")}</td><td><span className={String(row.status).includes("FAILED") || String(row.status).includes("MISSED") ? "intake-low" : "intake-ok"}>{pretty(row.status || "DRAFT")}</span></td><td>{formatDateTime(row.updatedAt || row.recordedAt || row.createdAt)}</td></tr>) : <tr><td colSpan={5}>No production or delivery records yet.</td></tr>}</tbody></table></div>
      </section>

      <form className={`canteen-panel canteen-form canteen-operational-form ${activeForm === "operational" ? "canteen-modal-form" : "is-hidden"}`} onSubmit={createOperational}>
        <div className="canteen-panel-title">
          <ClipboardList size={18} />
          <div>
            <h2>Operational Control Record</h2>
            <p>Record menus, production, delivery, waste, food-safety, and hygiene events without changing the clinical diet order.</p>
          </div>
          <button type="button" className="canteen-modal-close" onClick={() => setActiveForm(null)} aria-label="Close operational form">×</button>
        </div>
        <label>
          Record type
          <select value={operationalKind} onChange={(event) => setOperationalKind(event.target.value)}>
            {['MENU', 'RECIPE', 'SCHEDULE', 'PRODUCTION', 'DELIVERY', 'WASTE', 'FOOD_SAFETY', 'HYGIENE', 'FORECAST'].map((kind) => <option key={kind} value={kind}>{pretty(kind)}</option>)}
          </select>
        </label>
        <label>
          Record name / ID
          <input value={operationalForm.name} onChange={(event) => setOperationalForm({ ...operationalForm, name: event.target.value })} placeholder="e.g. LUNCH-2026-10-24-001" />
        </label>
        <label>
          Meal period
          <select value={operationalForm.mealType} onChange={(event) => setOperationalForm({ ...operationalForm, mealType: event.target.value })}>
            {(configuration?.mealTypes || MEAL_TYPES).map((meal: string) => <option key={meal} value={meal}>{pretty(meal)}</option>)}
          </select>
        </label>
        <label>
          Status
          <select value={operationalForm.status} onChange={(event) => setOperationalForm({ ...operationalForm, status: event.target.value })}>
            <option value="DRAFT">Draft</option><option value="IN_PROGRESS">In progress</option><option value="READY_FOR_DISPATCH">Ready for dispatch</option><option value="DELIVERED">Delivered</option><option value="OPEN">Open</option><option value="PASSED">Passed</option><option value="FAILED">Failed</option>
          </select>
        </label>
        <label>
          Ward / location
          <input value={operationalForm.ward} onChange={(event) => setOperationalForm({ ...operationalForm, ward: event.target.value })} placeholder="Kitchen, ward, or storage location" />
        </label>
        <label>
          Diet or restriction
          <select value={operationalForm.dietType} onChange={(event) => setOperationalForm({ ...operationalForm, dietType: event.target.value })}>
            {(configuration?.dietTypes || DIET_TYPES).map((diet: string) => <option key={diet} value={diet}>{pretty(diet)}</option>)}
          </select>
        </label>
        <label className="span-2">
          Notes / safety findings
          <textarea value={operationalForm.notes} onChange={(event) => setOperationalForm({ ...operationalForm, notes: event.target.value })} placeholder="Add quantities, temperature, allergens, corrective action, or delivery notes" />
        </label>
        <button className="canteen-primary" disabled={saving === "operational"}><Send size={16} /> {saving === "operational" ? "Saving..." : "Save Operational Record"}</button>
      </form>

      <section className="canteen-panel">
        <div className="canteen-toolbar">
          <div className="canteen-panel-title">
            <Utensils size={18} />
            <div>
              <h2>Kitchen Board</h2>
              <p>{filteredPatients.length} admitted patients visible to the kitchen.</p>
            </div>
          </div>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search patient, ward, diet..." />
        </div>
        <div className="canteen-board">
          {filteredPatients.length ? filteredPatients.map((patient) => (
            <button className={`canteen-patient ${patient.npo ? "npo" : ""}`} key={patient.inpatientId} onClick={() => selectPatient(patient)}>
              <span className="canteen-patient-top">
                <strong>{patient.patientName}</strong>
                <em className={patient.npo ? "red" : "green"}>{pretty(patient.currentDietType)}</em>
              </span>
              <span>{patient.mrn || patient.patientCode || patient.patientId}</span>
              <span>{patient.ward} · {patient.bed}</span>
              <span>Changed {formatDateTime(patient.updatedAt)}</span>
              {patient.recentConsumption ? <small>Last intake: {pretty(patient.recentConsumption.consumption)} at {pretty(patient.recentConsumption.mealType)}</small> : <small>No intake recorded</small>}
              {patient.nutritionAlert ? <b>Dietitian review pending</b> : null}
            </button>
          )) : (
            <div className="canteen-empty">{loading ? "Loading kitchen board..." : "No admitted patients found."}</div>
          )}
        </div>
      </section>

      <section className={`canteen-panel canteen-consumption-panel ${expandedConsumption ? "is-expanded" : ""}`}>
        <div className="canteen-panel-title">
          <ForkKnife size={18} />
          <div>
            <h2>Recent Consumption</h2>
            <p>Latest nurse meal intake records.</p>
          </div>
          <button type="button" className="canteen-expand-btn" onClick={() => setExpandedConsumption((value) => !value)} aria-label={expandedConsumption ? "Collapse consumption table" : "Expand consumption table"}>{expandedConsumption ? <Minimize2 size={16} /> : <Maximize2 size={16} />}</button>
        </div>
        <div className="canteen-table-wrap">
          <table className="canteen-table">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Location</th>
                <th>Meal</th>
                <th>Consumed</th>
                <th>Recorded</th>
              </tr>
            </thead>
            <tbody>
              {consumptionLogs.length ? consumptionLogs.map((row) => (
                <tr key={row.id}>
                  <td>{row.patientName || row.patientId}</td>
                  <td>{row.ward || "Ward"} · {row.bed || "Bed"}</td>
                  <td>{pretty(row.mealType)}</td>
                  <td><span className={Number(row.consumptionPercent) < 50 ? "intake-low" : "intake-ok"}>{pretty(row.consumption)}</span></td>
                  <td>{formatDateTime(row.recordedAt)}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5}>No meal consumption records yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
