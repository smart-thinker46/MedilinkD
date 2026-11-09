
import { useEffect, useMemo, useState } from "react";
import { SimpleModulePlaceholder } from "../components/layout/SimpleModulePlaceholder";
import { ModuleIcon } from "../components/layout/ModuleIcon";
import { api } from "../lib/api";
import { useLiveRefresh } from "../lib/liveRefresh";

type AmbulanceModal = "dispatch" | "scene" | "preArrival" | "gps" | "maintenance" | "fleet" | null;

const defaultDispatchForm = {
  fleetId: "",
  priority: "HIGH",
  callType: "Emergency response",
  callerName: "",
  callReceivedAt: "",
  location: "",
  landmark: "",
  county: "",
  subCounty: "",
  destination: "Emergency Department",
  patientName: "",
  patientId: "",
  callerPhone: "",
  condition: "",
  patientCount: "1",
  trauma: false,
  consciousness: "Alert",
  breathing: "Adequate",
  hazards: "",
  specialRequirements: "",
  latitude: "",
  longitude: "",
  driverId: "",
  paramedicId: "",
  nurseId: "",
  emtId: "",
  otherCrew: "",
  notes: "",
};

const defaultSceneForm = {
  sceneAssessment: "",
  mechanismOfInjury: "",
  conditionOnArrival: "",
  interventions: "",
  airwayOxygen: "",
  procedures: "",
  vitalsAtScene: "",
  vitalsOnDeparture: "",
  medications: "",
  pickupAt: "",
  hospitalArrivalAt: "",
  handoverNotes: "",
  receivingClinician: "",
  handoverCompletedBy: "",
  etaMinutes: "12",
  sendPreArrival: true,
};

const defaultPreArrivalForm = {
  message: "",
  etaMinutes: "12",
  acuity: "Critical",
  treatmentGiven: "",
  receivingUnit: "Emergency Department",
};

const defaultGpsForm = {
  latitude: "",
  longitude: "",
  address: "",
  speedKmh: "",
  etaMinutes: "",
  distanceKm: "",
};

const defaultMaintenanceForm = {
  status: "MAINTENANCE",
  odometerKm: "",
  mileageKm: "",
  liters: "",
  cost: "",
  fuelStation: "Fleet service bay",
  serviceNotes: "",
};

const localDateTime = () => new Date().toISOString().slice(0, 16);

const defaultFleetForm = {
  vehicleNumber: "",
  registrationPlate: "",
  vehicleType: "ALS",
  model: "",
  year: "",
  insuranceExpiry: "",
  roadLicenseExpiry: "",
  notes: "",
};

const noticeTone = (message: string) => {
  const lower = message.toLowerCase();
  if (lower.includes("failed") || lower.includes("error") || lower.includes("not available")) return "error";
  if (lower.includes("select") || lower.includes("required") || lower.includes("due")) return "warning";
  if (lower.includes("notification") || lower.includes("gps") || lower.includes("scene")) return "info";
  return "success";
};
const noticeIcon = (message: string) => {
  const tone = noticeTone(message);
  if (tone === "error") return "error";
  if (tone === "warning") return "warning";
  if (tone === "info") return "notifications_active";
  return "check_circle";
};

const fleetIdOf = (row: any) => String(row?.id || row?.fleetId || "").trim();
const dispatchIdOf = (row: any) => String(row?.id || row?.dispatchId || "").trim();
const vehicleNumber = (row: any) =>
  String(row?.vehicleNumber || row?.vehicleRegistration || row?.metadata?.registrationPlate || fleetIdOf(row) || "Ambulance").trim();
const dispatchPatient = (row: any) => {
  const meta = row?.meta || {};
  const name = String(meta.patientName || row?.patientName || "Unknown patient").trim();
  const code = String(meta.patientCode || row?.patientCode || "").trim();
  return code && !name.includes(code) ? `${code} · ${name}` : name;
};
const dispatchPriority = (row: any) => String(row?.meta?.priority || row?.priority || "HIGH").toUpperCase();
const dispatchLocation = (row: any) => String(row?.meta?.pickupLocation || row?.pickupLocation || row?.location || "Scene").trim();
const rowsFromResponse = (value: any): any[] => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.rows)) return value.rows;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.items)) return value.items;
  return [];
};
const patientIdOf = (row: any) => String(row?.id || row?.patientId || "").trim();
const patientLabel = (row: any) => String(row?.fullName || `${row?.firstName || ""} ${row?.lastName || ""}`.trim() || row?.patientCode || row?.mrn || patientIdOf(row)).trim();
const staffIdOf = (row: any) => String(row?.id || row?.staffId || row?.userId || "").trim();
const staffLabel = (row: any) => String(row?.fullName || `${row?.firstName || ""} ${row?.lastName || ""}`.trim() || row?.name || row?.email || staffIdOf(row)).trim();

const formatDate = (value: any) => {
  const date = new Date(String(value || ""));
  if (!Number.isFinite(date.getTime())) return "Not set";
  return date.toLocaleDateString();
};

const daysUntil = (value: any) => {
  const date = new Date(String(value || ""));
  if (!Number.isFinite(date.getTime())) return null;
  return Math.ceil((date.getTime() - Date.now()) / 86400000);
};

const nextStatus = (status: string) => {
  const normalized = String(status || "").toUpperCase();
  if (normalized === "REQUESTED") return "ASSIGNED";
  if (normalized === "ASSIGNED") return "CREW_ASSIGNED";
  if (normalized === "CREW_ASSIGNED") return "DISPATCHED";
  if (normalized === "DISPATCHED") return "EN_ROUTE_TO_SCENE";
  if (normalized === "EN_ROUTE_TO_SCENE") return "ARRIVED_SCENE";
  if (normalized === "ARRIVED_SCENE") return "PATIENT_ASSESSED";
  if (normalized === "PATIENT_ASSESSED") return "PATIENT_LOADED";
  if (normalized === "PATIENT_LOADED") return "TRANSPORTING";
  if (normalized === "TRANSPORTING") return "ARRIVED_HOSPITAL";
  if (normalized === "ARRIVED_HOSPITAL") return "HANDED_OVER";
  if (normalized === "HANDED_OVER") return "CLEANING_REQUIRED";
  if (normalized === "CLEANING_REQUIRED") return "COMPLETED";
  if (normalized === "COMPLETED") return "CLOSED";
  return "";
};

const responseFlag = (minutes: any) => {
  const value = Number(minutes);
  if (!Number.isFinite(value) || value <= 0) return "Pending";
  return value > 8 ? "Target breach" : "On target";
};

const gpsAgeLabel = (value: any) => {
  const timestamp = new Date(String(value || "")).getTime();
  if (!Number.isFinite(timestamp)) return "No GPS ping";
  const ageSeconds = Math.max(0, Math.round((Date.now() - timestamp) / 1000));
  if (ageSeconds < 90) return `GPS live · ${ageSeconds}s ago`;
  if (ageSeconds < 3600) return `GPS stale · ${Math.round(ageSeconds / 60)}m ago`;
  return `GPS stale · ${Math.round(ageSeconds / 3600)}h ago`;
};

export default function AmbulanceView() {
  const [dashboard, setDashboard] = useState<any>({});
  const [dispatches, setDispatches] = useState<any[]>([]);
  const [fleet, setFleet] = useState<any[]>([]);
  const [locationLogs, setLocationLogs] = useState<any[]>([]);
  const [fuelLogs, setFuelLogs] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [modal, setModal] = useState<AmbulanceModal>(null);
  const [selectedDispatch, setSelectedDispatch] = useState<any>(null);
  const [selectedFleet, setSelectedFleet] = useState<any>(null);
  const [dispatchForm, setDispatchForm] = useState(defaultDispatchForm);
  const [sceneForm, setSceneForm] = useState(defaultSceneForm);
  const [preArrivalForm, setPreArrivalForm] = useState(defaultPreArrivalForm);
  const [gpsForm, setGpsForm] = useState(defaultGpsForm);
  const [maintenanceForm, setMaintenanceForm] = useState(defaultMaintenanceForm);
  const [fleetForm, setFleetForm] = useState(defaultFleetForm);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!notice) return undefined;
    const timeout = window.setTimeout(() => setNotice(""), noticeTone(notice) === "error" ? 7000 : 4200);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  const loadData = async () => {
    try {
      setLoading(true);
      const results = await Promise.allSettled([
        api.get("/emergency/ambulance/dashboard"),
        api.get("/emergency/ambulance/dispatches", { params: { limit: 300 } }),
        api.get("/emergency/ambulance/fleet"),
        api.get("/emergency/ambulance/location-logs", { params: { limit: 300 } }).catch(() => ({ data: [] })),
        api.get("/emergency/ambulance/fuel-logs", { params: { limit: 300 } }).catch(() => ({ data: [] })),
        api.get("/patients", { params: { limit: 300 } }).catch(() => ({ data: [] })),
        api.get("/staff", { params: { limit: 300 } }).catch(() => ({ data: [] })),
      ]);
      const rejected = results.find((result) => result.status === "rejected") as PromiseRejectedResult | undefined;
      const status = Number(rejected?.reason?.response?.status || 0);
      if (status === 401) {
        setNotice("Your HMIS session has expired. Please log in again, then reopen Ambulance & Dispatch.");
        return;
      }
      const valueAt = (index: number) => {
        const result = results[index];
        return result?.status === "fulfilled" ? result.value?.data : null;
      };
      setDashboard(valueAt(0) || {});
      setDispatches(rowsFromResponse(valueAt(1)));
      setFleet(rowsFromResponse(valueAt(2)));
      setLocationLogs(rowsFromResponse(valueAt(3)));
      setFuelLogs(rowsFromResponse(valueAt(4)));
      setPatients(rowsFromResponse(valueAt(5)));
      setStaff(rowsFromResponse(valueAt(6)));
      if (rejected) setNotice("Some ambulance data could not be loaded. Check the backend service and refresh.");
    } catch (err) {
      console.error("Failed to load ambulance data", err);
      setNotice("Failed to load ambulance module data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  useLiveRefresh(loadData, { intervalMs: 30000 });

  const latestLocationByFleet = useMemo(() => {
    return locationLogs.reduce<Record<string, any>>((acc, row) => {
      const id = String(row?.fleetId || "").trim();
      if (!id) return acc;
      const rowTime = new Date(String(row?.capturedAt || row?.createdAt || row?.updatedAt || "")).getTime();
      const currentTime = new Date(String(acc[id]?.capturedAt || acc[id]?.createdAt || acc[id]?.updatedAt || "")).getTime();
      if (!acc[id] || (Number.isFinite(rowTime) && (!Number.isFinite(currentTime) || rowTime > currentTime))) acc[id] = row;
      return acc;
    }, {});
  }, [locationLogs]);

  const activeDispatches = useMemo(
    () => dispatches.filter((row) => !["COMPLETED", "CLOSED", "CANCELLED"].includes(String(row?.status || "").toUpperCase())),
    [dispatches],
  );

  const availableFleet = useMemo(
    () => fleet.filter((row) => String(row?.status || "").toUpperCase() === "AVAILABLE"),
    [fleet],
  );

  const maintenanceAlerts = useMemo(() => {
    return fleet.flatMap((row) => {
      const meta = row?.metadata || {};
      const alerts: string[] = [];
      const insuranceDays = daysUntil(meta.insuranceExpiry);
      const licenseDays = daysUntil(meta.roadLicenseExpiry);
      if (insuranceDays !== null && insuranceDays <= 60) alerts.push(`${vehicleNumber(row)} insurance ${insuranceDays < 0 ? "expired" : `expires in ${insuranceDays}d`}`);
      if (licenseDays !== null && licenseDays <= 60) alerts.push(`${vehicleNumber(row)} inspection ${licenseDays < 0 ? "expired" : `expires in ${licenseDays}d`}`);
      if (String(row?.status || "").toUpperCase() === "MAINTENANCE") alerts.push(`${vehicleNumber(row)} is under maintenance`);
      return alerts;
    });
  }, [fleet]);

  const openDispatchModal = () => {
    setDispatchForm({
      ...defaultDispatchForm,
      callReceivedAt: localDateTime(),
      fleetId: availableFleet[0] ? fleetIdOf(availableFleet[0]) : "",
    });
    setModal("dispatch");
  };

  const openDispatchAction = (action: AmbulanceModal, row: any) => {
    setSelectedDispatch(row);
    setSelectedFleet(row?.fleet || fleet.find((item) => fleetIdOf(item) === String(row?.fleetId || "")) || null);
    if (action === "gps") {
      const latest = latestLocationByFleet[String(row?.fleetId || "")] || {};
      setGpsForm({
        ...defaultGpsForm,
        latitude: String(latest.latitude || row?.meta?.latitude || ""),
        longitude: String(latest.longitude || row?.meta?.longitude || ""),
        address: String(latest.address || dispatchLocation(row)),
        etaMinutes: String(latest.etaMinutes || ""),
        distanceKm: String(latest.distanceKm || ""),
      });
    }
    if (action === "preArrival") {
      setPreArrivalForm({
        ...defaultPreArrivalForm,
        etaMinutes: String(latestLocationByFleet[String(row?.fleetId || "")]?.etaMinutes || 12),
        message: `Incoming ${dispatchPriority(row)} patient from ${dispatchLocation(row)}. ${row?.meta?.condition || row?.meta?.notes || ""}`.trim(),
      });
    }
    setModal(action);
  };

  const openFleetAction = (row: any) => {
    setSelectedFleet(row);
    setMaintenanceForm(defaultMaintenanceForm);
    setModal("maintenance");
  };

  const submitDispatch = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      await api.post("/emergency/ambulance/dispatch", {
        ...dispatchForm,
        location: dispatchForm.location,
        pickupLocation: dispatchForm.location,
        status: "DISPATCHED",
        latitude: dispatchForm.latitude || 0,
        longitude: dispatchForm.longitude || 0,
        condition: dispatchForm.condition || dispatchForm.callType,
        calledAt: dispatchForm.callReceivedAt ? new Date(dispatchForm.callReceivedAt).toISOString() : new Date().toISOString(),
        dispatchedAt: new Date().toISOString(),
      });
      setNotice("Ambulance dispatched. Crew notified and fleet status changed to DISPATCHED.");
      setModal(null);
      await loadData();
    } catch (err: any) {
      setNotice(`Dispatch failed: ${err?.response?.data?.message || err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const createFleet = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      await api.post("/emergency/ambulance/fleet", {
        ...fleetForm,
        registrationPlate: fleetForm.registrationPlate || fleetForm.vehicleNumber,
        status: "AVAILABLE",
      });
      setNotice("Ambulance added to fleet and available for dispatch.");
      setModal(null);
      setFleetForm(defaultFleetForm);
      await loadData();
    } catch (err: any) {
      setNotice(`Fleet creation failed: ${err?.response?.data?.message || err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const updateDispatchStatus = async (row: any) => {
    const next = nextStatus(String(row?.status || ""));
    if (!next) {
      setNotice("No next status is available for this dispatch.");
      return;
    }
    setSaving(true);
    try {
      await api.patch(`/emergency/ambulance/dispatch/${dispatchIdOf(row)}/status`, {
        status: next,
        notes: `Status updated from dispatcher board to ${next}.`,
      });
      setNotice(`Dispatch moved to ${next}. Response analytics updated.`);
      await loadData();
    } catch (err: any) {
      setNotice(`Status update failed: ${err?.response?.data?.message || err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const submitGps = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedDispatch) return;
    setSaving(true);
    try {
      await api.post(`/emergency/ambulance/dispatch/${dispatchIdOf(selectedDispatch)}/location`, {
        ...gpsForm,
        sourceModule: "AMBULANCE_GPS",
        capturedAt: new Date().toISOString(),
      });
      setNotice("GPS location updated. Fleet board refreshed.");
      setModal(null);
      await loadData();
    } catch (err: any) {
      setNotice(`GPS update failed: ${err?.response?.data?.message || err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const submitSceneReport = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedDispatch) return;
    setSaving(true);
    try {
      await api.post(`/emergency/ambulance/dispatch/${dispatchIdOf(selectedDispatch)}/scene-report`, {
        ...sceneForm,
        recordedAt: new Date().toISOString(),
      });
      if (sceneForm.sendPreArrival) {
        await api.post(`/emergency/ambulance/dispatch/${dispatchIdOf(selectedDispatch)}/pre-arrival`, {
          patientName: dispatchPatient(selectedDispatch),
          location: dispatchLocation(selectedDispatch),
          etaMinutes: sceneForm.etaMinutes,
          treatmentGiven: sceneForm.interventions,
          message: sceneForm.handoverNotes || `Incoming patient from ${dispatchLocation(selectedDispatch)}.`,
          sentAt: new Date().toISOString(),
        });
      }
      setNotice("Scene report saved and transmitted to receiving hospital.");
      setModal(null);
      setSceneForm(defaultSceneForm);
      await loadData();
    } catch (err: any) {
      setNotice(`Scene report failed: ${err?.response?.data?.message || err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const submitPreArrival = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedDispatch) return;
    setSaving(true);
    try {
      await api.post(`/emergency/ambulance/dispatch/${dispatchIdOf(selectedDispatch)}/pre-arrival`, {
        patientName: dispatchPatient(selectedDispatch),
        location: dispatchLocation(selectedDispatch),
        ...preArrivalForm,
        sentAt: new Date().toISOString(),
      });
      setNotice("Pre-arrival notification sent to Emergency Department.");
      setModal(null);
      await loadData();
    } catch (err: any) {
      setNotice(`Pre-arrival notification failed: ${err?.response?.data?.message || err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const submitMaintenance = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedFleet) return;
    setSaving(true);
    try {
      await api.patch(`/emergency/ambulance/fleet/${fleetIdOf(selectedFleet)}/status`, {
        status: maintenanceForm.status,
      });
      await api.post("/emergency/ambulance/fuel-log", {
        fleetId: fleetIdOf(selectedFleet),
        liters: maintenanceForm.liters || 0,
        cost: maintenanceForm.cost || 0,
        mileageKm: maintenanceForm.mileageKm || 0,
        odometerKm: maintenanceForm.odometerKm || 0,
        fuelStation: maintenanceForm.fuelStation,
      }).catch(() => null);
      await api.post(`/emergency/ambulance/fleet/${fleetIdOf(selectedFleet)}/maintenance`, {
        ...maintenanceForm,
        recordedAt: new Date().toISOString(),
      });
      setNotice("Fleet maintenance record saved and vehicle availability updated.");
      setModal(null);
      await loadData();
    } catch (err: any) {
      setNotice(`Maintenance update failed: ${err?.response?.data?.message || err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const rows = dispatches.map((row) => {
    const status = String(row?.status || "REQUESTED").toUpperCase();
    const next = nextStatus(status);
    return {
      id: dispatchIdOf(row),
      vehicle: row?.fleet?.vehicleNumber || row?.meta?.fleetVehicleNumber || row?.fleetId,
      location: dispatchLocation(row),
      patient: dispatchPatient(row),
      priorityText: dispatchPriority(row),
      statusText: status,
      priority: <span className={`ambulance-pill is-${dispatchPriority(row).toLowerCase()}`}>{dispatchPriority(row)}</span>,
      response: (
        <span className={`ambulance-pill ${responseFlag(row?.responseMinutes) === "Target breach" ? "is-critical" : "is-info"}`}>
          {row?.responseMinutes ? `${row.responseMinutes} min` : responseFlag(row?.responseMinutes)}
        </span>
      ),
      status: <span className={`ambulance-status is-${status.toLowerCase()}`}>{status}</span>,
      actions: (
        <div className="ambulance-row-actions">
          {next ? (
            <button className="ambulance-row-btn is-progress" onClick={() => updateDispatchStatus(row)} type="button" disabled={saving}>
              <ModuleIcon name="route" className="w-3.5 h-3.5" /> {next.replace(/_/g, " ")}
            </button>
          ) : null}
          <button className="ambulance-row-btn is-gps" onClick={() => openDispatchAction("gps", row)} type="button">
            <ModuleIcon name="my_location" className="w-3.5 h-3.5" /> GPS
          </button>
          <button className="ambulance-row-btn is-scene" onClick={() => openDispatchAction("scene", row)} type="button">
            <ModuleIcon name="clinical_clipboard" className="w-3.5 h-3.5" /> Scene Report
          </button>
          <button className="ambulance-row-btn is-alert" onClick={() => openDispatchAction("preArrival", row)} type="button">
            <ModuleIcon name="notifications_active" className="w-3.5 h-3.5" /> Pre-Arrival
          </button>
        </div>
      ),
    };
  });

  const fleetBoard = (
    <section className="ambulance-board">
      <div className="ambulance-board-head">
        <div>
          <h3>GPS Fleet Status Board</h3>
          <p>Green available, red active dispatch, grey maintenance. GPS logs refresh every 30 seconds.</p>
        </div>
        <span>{availableFleet.length} available · {dashboard?.fleet?.maintenance || 0} maintenance</span>
      </div>
      <div className="ambulance-fleet-grid">
        {fleet.map((unit) => {
          const status = String(unit?.status || "AVAILABLE").toUpperCase();
          const latest = latestLocationByFleet[fleetIdOf(unit)] || {};
          const meta = unit?.metadata || {};
          return (
            <div key={fleetIdOf(unit)} className={`ambulance-fleet-card is-${status.toLowerCase()}`}>
              <div className="ambulance-fleet-top">
                <strong>{vehicleNumber(unit)}</strong>
                <span>{status}</span>
              </div>
              <p>{meta.model || meta.registrationPlate || "Fleet unit"} · {meta.vehicleType || meta.capabilityLevel || "ALS/BLS ready"}</p>
              <small>
                <ModuleIcon name="my_location" className="w-3.5 h-3.5" />
                {latest.address || `${latest.latitude || meta.latitude || "0"}, ${latest.longitude || meta.longitude || "0"}`}
              </small>
              <small className={new Date(String(latest.capturedAt || latest.createdAt || latest.updatedAt || "")).getTime() && Date.now() - new Date(String(latest.capturedAt || latest.createdAt || latest.updatedAt || "")).getTime() > 90000 ? "is-stale" : ""}>
                <ModuleIcon name="schedule" className="w-3.5 h-3.5" /> {gpsAgeLabel(latest.capturedAt || latest.createdAt || latest.updatedAt)}
              </small>
              <small>
                <ModuleIcon name="radio" className="w-3.5 h-3.5" />
                Crew: {unit?.activeDispatchId ? "Assigned to active dispatch" : "Available for assignment"}
              </small>
              <small>
                <ModuleIcon name="build" className="w-3.5 h-3.5" />
                Insurance {formatDate(meta.insuranceExpiry)} · Inspection {formatDate(meta.roadLicenseExpiry)}
              </small>
              <button className="ambulance-maintenance-link" onClick={() => openFleetAction(unit)} type="button">
                <ModuleIcon name="build" className="w-3.5 h-3.5" /> Maintenance
              </button>
            </div>
          );
        })}
      </div>
      {maintenanceAlerts.length > 0 ? (
        <div className="ambulance-alert-strip">
          <ModuleIcon name="warning" /> {maintenanceAlerts.slice(0, 3).join(" · ")}
        </div>
      ) : null}
    </section>
  );

  const analyticsBoard = (
    <section className="ambulance-analytics">
      <div>
        <span>Average Response</span>
        <strong>{dashboard?.dispatch?.averageResponseMinutes || 0} min</strong>
        <small>Target 8 min urban response</small>
      </div>
      <div>
        <span>Active Dispatches</span>
        <strong>{dashboard?.dispatch?.active || 0}</strong>
        <small>Tracked through call, scene, and hospital arrival</small>
      </div>
      <div>
        <span>Fuel / Distance</span>
        <strong>{Math.round(Number(dashboard?.fuel?.totalDistanceKm || 0))} km</strong>
        <small>{Number(dashboard?.fuel?.totalLiters || 0).toLocaleString()} L recorded</small>
      </div>
      <div>
        <span>Revenue</span>
        <strong>Ksh {Number(dashboard?.finance?.revenue || 0).toLocaleString()}</strong>
        <small>Ambulance dispatch billing</small>
      </div>
    </section>
  );

  return (
    <>
      <SimpleModulePlaceholder
        title="Ambulance & Dispatch"
        subtitle="Call reception, dispatch, GPS tracking, pre-hospital care, pre-arrival alerts, maintenance, and response analytics."
        icon={<ModuleIcon name="ambulance" />}
        stats={[
          { label: "Active Dispatches", value: dashboard?.dispatch?.active || 0, color: "#dc2626" },
          { label: "Fleet Available", value: dashboard?.fleet?.available || 0, color: "#16a34a" },
          { label: "Maintenance", value: dashboard?.fleet?.maintenance || 0, color: "#64748b" },
          { label: "Avg Response", value: `${dashboard?.dispatch?.averageResponseMinutes || 0} min`, color: "#2563eb" },
          { label: "Total Dispatches", value: dashboard?.dispatch?.total || 0, color: "#7c3aed" },
          { label: "Revenue", value: `Ksh ${Number(dashboard?.finance?.revenue || 0).toLocaleString()}`, color: "#0d9488" },
        ]}
        columns={[
          { label: "Vehicle", key: "vehicle" },
          { label: "Scene Address", key: "location" },
          { label: "Patient", key: "patient" },
          { label: "Priority", key: "priority" },
          { label: "Response", key: "response" },
          { label: "Status", key: "status" },
          { label: "Actions", key: "actions" },
        ]}
        rows={rows}
        searchPlaceholder="Search dispatches by vehicle, scene, patient, priority..."
        searchKeys={["vehicle", "location", "patient", "priorityText", "statusText"]}
        useProvidedStats
        useProvidedRows
        useProvidedActions
        captureActions={false}
        afterSearchContent={
          <>
            {fleetBoard}
            {analyticsBoard}
          </>
        }
        actions={
          <div className="ambulance-action-bar">
            <button className="ambulance-workflow-btn is-dispatch" onClick={openDispatchModal} type="button">
              <ModuleIcon name="ambulance" /> Dispatch Ambulance
            </button>
            <button className="ambulance-workflow-btn is-fleet" onClick={() => setModal("fleet")} type="button">
              <ModuleIcon name="add_circle" /> Add Fleet Unit
            </button>
            <button
              className="ambulance-workflow-btn is-gps"
              onClick={() => activeDispatches[0] ? openDispatchAction("gps", activeDispatches[0]) : setNotice("Select an active dispatch before logging GPS.")}
              type="button"
            >
              <ModuleIcon name="navigation" /> GPS Ping
            </button>
            <button
              className="ambulance-workflow-btn is-alert"
              onClick={() => activeDispatches[0] ? openDispatchAction("preArrival", activeDispatches[0]) : setNotice("Select an active dispatch before sending pre-arrival notification.")}
              type="button"
            >
              <ModuleIcon name="notifications_active" /> Pre-Arrival Alert
            </button>
          </div>
        }
      />

      {modal ? (
        <div className="module-form-overlay">
          <div className="module-form-panel ambulance-modal-panel" style={{ "--module-form-accent": "#dc2626" } as any}>
            <div className="module-form-header">
              <div>
                <p className="module-form-kicker">Ambulance workflow</p>
                <h3 className="module-form-title">
                  {modal === "dispatch" ? "Call Reception and Dispatch" : modal === "fleet" ? "Fleet Unit" : `${dispatchPatient(selectedDispatch)} · ${modal}`}
                </h3>
              </div>
              <button className="module-modal-close" onClick={() => setModal(null)} type="button">x</button>
            </div>

            {modal === "dispatch" ? (
              <form onSubmit={submitDispatch} className="module-form-body">
                <div className="module-form-grid">
                  <label className="module-form-field">
                    <span>Available ambulance</span>
                    <select className="module-form-input" required value={dispatchForm.fleetId} onChange={(e) => setDispatchForm((p) => ({ ...p, fleetId: e.target.value }))}>
                      <option value="">Select nearest capable unit</option>
                      {availableFleet.map((unit) => (
                        <option key={fleetIdOf(unit)} value={fleetIdOf(unit)}>{vehicleNumber(unit)} ({unit?.metadata?.vehicleType || "ALS/BLS"})</option>
                      ))}
                    </select>
                  </label>
                  <label className="module-form-field">
                    <span>Call type</span>
                    <input className="module-form-input" required value={dispatchForm.callType} onChange={(e) => setDispatchForm((p) => ({ ...p, callType: e.target.value }))} />
                  </label>
                  <label className="module-form-field">
                    <span>Call received at</span>
                    <input className="module-form-input" type="datetime-local" required value={dispatchForm.callReceivedAt} onChange={(e) => setDispatchForm((p) => ({ ...p, callReceivedAt: e.target.value }))} />
                  </label>
                  <label className="module-form-field">
                    <span>Caller name</span>
                    <input className="module-form-input" required value={dispatchForm.callerName} onChange={(e) => setDispatchForm((p) => ({ ...p, callerName: e.target.value }))} />
                  </label>
                  <label className="module-form-field">
                    <span>Caller phone</span>
                    <input className="module-form-input" required value={dispatchForm.callerPhone} onChange={(e) => setDispatchForm((p) => ({ ...p, callerPhone: e.target.value }))} />
                  </label>
                  <label className="module-form-field is-wide">
                    <span>Scene address</span>
                    <input className="module-form-input" required value={dispatchForm.location} onChange={(e) => setDispatchForm((p) => ({ ...p, location: e.target.value }))} />
                  </label>
                  {([['landmark','Landmark'],['county','County'],['subCounty','Sub-county']] as const).map(([key, label]) => <label key={key} className="module-form-field"><span>{label}</span><input className="module-form-input" value={dispatchForm[key]} onChange={(e) => setDispatchForm((p) => ({ ...p, [key]: e.target.value }))} /></label>)}
                  <label className="module-form-field">
                    <span>Priority</span>
                    <select className="module-form-input" value={dispatchForm.priority} onChange={(e) => setDispatchForm((p) => ({ ...p, priority: e.target.value }))}>
                      <option value="CRITICAL">Critical</option>
                      <option value="HIGH">High</option>
                      <option value="ROUTINE">Routine</option>
                    </select>
                  </label>
                  <label className="module-form-field">
                    <span>Destination</span>
                    <input className="module-form-input" required value={dispatchForm.destination} onChange={(e) => setDispatchForm((p) => ({ ...p, destination: e.target.value }))} />
                  </label>
                  <label className="module-form-field is-wide">
                    <span>Registered patient (optional)</span>
                    <select className="module-form-input" value={dispatchForm.patientId} onChange={(e) => {
                      const selected = patients.find((patient) => patientIdOf(patient) === e.target.value);
                      setDispatchForm((p) => ({ ...p, patientId: e.target.value, patientName: selected ? patientLabel(selected) : "" }));
                    }}>
                      <option value="">Unknown / not registered yet</option>
                      {patients.map((patient) => <option key={patientIdOf(patient)} value={patientIdOf(patient)}>{patientLabel(patient)}{patient?.mrn || patient?.patientCode ? ` · ${patient.mrn || patient.patientCode}` : ""}</option>)}
                    </select>
                  </label>
                  <label className="module-form-field"><span>Patient name (if unknown)</span><input className="module-form-input" value={dispatchForm.patientName} onChange={(e) => setDispatchForm((p) => ({ ...p, patientId: "", patientName: e.target.value }))} /></label>
                  <label className="module-form-field"><span>Number of patients</span><input className="module-form-input" type="number" min="1" value={dispatchForm.patientCount} onChange={(e) => setDispatchForm((p) => ({ ...p, patientCount: e.target.value }))} /></label>
                  <label className="module-form-field"><span>Consciousness</span><select className="module-form-input" value={dispatchForm.consciousness} onChange={(e) => setDispatchForm((p) => ({ ...p, consciousness: e.target.value }))}><option>Alert</option><option>Voice</option><option>Pain</option><option>Unresponsive</option></select></label>
                  <label className="module-form-field"><span>Breathing status</span><select className="module-form-input" value={dispatchForm.breathing} onChange={(e) => setDispatchForm((p) => ({ ...p, breathing: e.target.value }))}><option>Adequate</option><option>Difficulty</option><option>Absent</option></select></label>
                  <label className="module-form-field"><span>Trauma call</span><input type="checkbox" checked={dispatchForm.trauma} onChange={(e) => setDispatchForm((p) => ({ ...p, trauma: e.target.checked }))} /></label>
                  <label className="module-form-field is-wide">
                    <span>Reported condition</span>
                    <textarea className="module-form-input min-h-[80px]" required value={dispatchForm.condition} onChange={(e) => setDispatchForm((p) => ({ ...p, condition: e.target.value }))} />
                  </label>
                  <label className="module-form-field"><span>Scene hazards</span><textarea className="module-form-input min-h-[70px]" value={dispatchForm.hazards} onChange={(e) => setDispatchForm((p) => ({ ...p, hazards: e.target.value }))} placeholder="Traffic, fire, violence, chemicals..." /></label>
                  <label className="module-form-field"><span>Special requirements</span><textarea className="module-form-input min-h-[70px]" value={dispatchForm.specialRequirements} onChange={(e) => setDispatchForm((p) => ({ ...p, specialRequirements: e.target.value }))} placeholder="Isolation, bariatric, neonatal, equipment..." /></label>
                  <label className="module-form-field">
                    <span>Latitude</span>
                    <input className="module-form-input" value={dispatchForm.latitude} onChange={(e) => setDispatchForm((p) => ({ ...p, latitude: e.target.value }))} />
                  </label>
                  <label className="module-form-field">
                    <span>Longitude</span>
                    <input className="module-form-input" value={dispatchForm.longitude} onChange={(e) => setDispatchForm((p) => ({ ...p, longitude: e.target.value }))} />
                  </label>
                  <label className="module-form-field">
                    <span>Driver</span>
                    <select className="module-form-input" value={dispatchForm.driverId} onChange={(e) => setDispatchForm((p) => ({ ...p, driverId: e.target.value }))}>
                      <option value="">Unassigned</option>{staff.map((member) => <option key={`driver-${staffIdOf(member)}`} value={staffIdOf(member)}>{staffLabel(member)}</option>)}
                    </select>
                  </label>
                  <label className="module-form-field">
                    <span>Paramedic</span>
                    <select className="module-form-input" value={dispatchForm.paramedicId} onChange={(e) => setDispatchForm((p) => ({ ...p, paramedicId: e.target.value }))}>
                      <option value="">Unassigned</option>{staff.map((member) => <option key={`paramedic-${staffIdOf(member)}`} value={staffIdOf(member)}>{staffLabel(member)}</option>)}
                    </select>
                  </label>
                  <label className="module-form-field">
                    <span>Nurse</span>
                    <select className="module-form-input" value={dispatchForm.nurseId} onChange={(e) => setDispatchForm((p) => ({ ...p, nurseId: e.target.value }))}>
                      <option value="">Unassigned</option>{staff.map((member) => <option key={`nurse-${staffIdOf(member)}`} value={staffIdOf(member)}>{staffLabel(member)}</option>)}
                    </select>
                  </label>
                  <label className="module-form-field">
                    <span>EMT</span>
                    <select className="module-form-input" value={dispatchForm.emtId} onChange={(e) => setDispatchForm((p) => ({ ...p, emtId: e.target.value }))}>
                      <option value="">Unassigned</option>{staff.map((member) => <option key={`emt-${staffIdOf(member)}`} value={staffIdOf(member)}>{staffLabel(member)}</option>)}
                    </select>
                  </label>
                  <label className="module-form-field is-wide">
                    <span>Additional crew</span>
                    <input className="module-form-input" value={dispatchForm.otherCrew} onChange={(e) => setDispatchForm((p) => ({ ...p, otherCrew: e.target.value }))} placeholder="Names or roles of additional crew" />
                  </label>
                  <label className="module-form-field is-wide">
                    <span>Dispatcher notes</span>
                    <textarea className="module-form-input min-h-[70px]" value={dispatchForm.notes} onChange={(e) => setDispatchForm((p) => ({ ...p, notes: e.target.value }))} placeholder="Instructions, access notes, caller updates, or routing constraints" />
                  </label>
                </div>
                <div className="module-form-footer">
                  <button className="topbar-logout-btn module-form-submit" disabled={saving || availableFleet.length === 0} type="submit">
                    {saving ? "Dispatching..." : "Dispatch Unit"}
                  </button>
                </div>
              </form>
            ) : null}

            {modal === "fleet" ? (
              <form onSubmit={createFleet} className="module-form-body">
                <div className="module-form-grid">
                  <label className="module-form-field">
                    <span>Vehicle number</span>
                    <input className="module-form-input" required value={fleetForm.vehicleNumber} onChange={(e) => setFleetForm((p) => ({ ...p, vehicleNumber: e.target.value }))} />
                  </label>
                  <label className="module-form-field">
                    <span>Capability</span>
                    <select className="module-form-input" value={fleetForm.vehicleType} onChange={(e) => setFleetForm((p) => ({ ...p, vehicleType: e.target.value }))}>
                      <option value="ALS">ALS</option>
                      <option value="BLS">BLS</option>
                      <option value="CRITICAL_CARE">Critical care</option>
                      <option value="NEONATAL">Neonatal</option>
                      <option value="PAEDIATRIC">Paediatric</option>
                      <option value="MATERNITY">Maternity</option>
                      <option value="ISOLATION">Isolation</option>
                      <option value="BARIATRIC">Bariatric</option>
                      <option value="PATIENT_TRANSFER">Patient transfer</option>
                    </select>
                  </label>
                  <label className="module-form-field">
                    <span>Model</span>
                    <input className="module-form-input" value={fleetForm.model} onChange={(e) => setFleetForm((p) => ({ ...p, model: e.target.value }))} />
                  </label>
                  <label className="module-form-field">
                    <span>Year</span>
                    <input className="module-form-input" type="number" value={fleetForm.year} onChange={(e) => setFleetForm((p) => ({ ...p, year: e.target.value }))} />
                  </label>
                  <label className="module-form-field">
                    <span>Insurance expiry</span>
                    <input className="module-form-input" type="date" value={fleetForm.insuranceExpiry} onChange={(e) => setFleetForm((p) => ({ ...p, insuranceExpiry: e.target.value }))} />
                  </label>
                  <label className="module-form-field">
                    <span>Inspection expiry</span>
                    <input className="module-form-input" type="date" value={fleetForm.roadLicenseExpiry} onChange={(e) => setFleetForm((p) => ({ ...p, roadLicenseExpiry: e.target.value }))} />
                  </label>
                </div>
                <div className="module-form-footer">
                  <button className="topbar-logout-btn module-form-submit" disabled={saving} type="submit">
                    {saving ? "Saving..." : "Add Ambulance"}
                  </button>
                </div>
              </form>
            ) : null}

            {modal === "gps" ? (
              <form onSubmit={submitGps} className="module-form-body">
                <div className="module-form-grid">
                  {Object.keys(defaultGpsForm).map((key) => (
                    <label key={key} className="module-form-field">
                      <span>{key.replace(/([A-Z])/g, " $1").toLowerCase()}</span>
                      <input className="module-form-input" required={key === "latitude" || key === "longitude"} value={(gpsForm as any)[key]} onChange={(e) => setGpsForm((p) => ({ ...p, [key]: e.target.value }))} />
                    </label>
                  ))}
                </div>
                <div className="module-form-footer">
                  <button className="topbar-logout-btn module-form-submit" disabled={saving} type="submit">
                    {saving ? "Updating..." : "Save GPS Ping"}
                  </button>
                </div>
              </form>
            ) : null}

            {modal === "scene" ? (
              <form onSubmit={submitSceneReport} className="module-form-body">
                <div className="module-form-grid">
                  {Object.keys(defaultSceneForm).map((key) => (
                    <label key={key} className={`module-form-field ${key.includes("Assessment") || key.includes("interventions") || key.includes("handover") || key.includes("vitals") || key === "airwayOxygen" || key === "procedures" ? "is-wide" : ""}`}>
                      <span>{key.replace(/([A-Z])/g, " $1").toLowerCase()}</span>
                      {key === "sendPreArrival" ? (
                        <label className="ambulance-checkbox-line">
                          <input type="checkbox" checked={sceneForm.sendPreArrival} onChange={(e) => setSceneForm((p) => ({ ...p, sendPreArrival: e.target.checked }))} />
                          Send pre-arrival notification
                        </label>
                      ) : key.includes("Assessment") || key.includes("interventions") || key.includes("handover") || key.includes("condition") || key.includes("vitals") || key === "airwayOxygen" || key === "procedures" ? (
                        <textarea className="module-form-input min-h-[80px]" value={(sceneForm as any)[key]} onChange={(e) => setSceneForm((p) => ({ ...p, [key]: e.target.value }))} />
                      ) : (
                        <input className="module-form-input" type={key.endsWith("At") ? "datetime-local" : key === "etaMinutes" ? "number" : "text"} value={(sceneForm as any)[key]} onChange={(e) => setSceneForm((p) => ({ ...p, [key]: e.target.value }))} />
                      )}
                    </label>
                  ))}
                </div>
                <div className="module-form-footer">
                  <button className="topbar-logout-btn module-form-submit" disabled={saving} type="submit">
                    {saving ? "Saving..." : "Transmit Scene Report"}
                  </button>
                </div>
              </form>
            ) : null}

            {modal === "preArrival" ? (
              <form onSubmit={submitPreArrival} className="module-form-body">
                <div className="module-form-grid">
                  <label className="module-form-field is-wide">
                    <span>Notification message</span>
                    <textarea className="module-form-input min-h-[100px]" required value={preArrivalForm.message} onChange={(e) => setPreArrivalForm((p) => ({ ...p, message: e.target.value }))} />
                  </label>
                  <label className="module-form-field">
                    <span>ETA minutes</span>
                    <input className="module-form-input" type="number" min="0" value={preArrivalForm.etaMinutes} onChange={(e) => setPreArrivalForm((p) => ({ ...p, etaMinutes: e.target.value }))} />
                  </label>
                  <label className="module-form-field">
                    <span>Acuity</span>
                    <select className="module-form-input" value={preArrivalForm.acuity} onChange={(e) => setPreArrivalForm((p) => ({ ...p, acuity: e.target.value }))}>
                      <option>Critical</option>
                      <option>Urgent</option>
                      <option>Stable</option>
                    </select>
                  </label>
                  <label className="module-form-field">
                    <span>Receiving unit</span>
                    <input className="module-form-input" required value={preArrivalForm.receivingUnit} onChange={(e) => setPreArrivalForm((p) => ({ ...p, receivingUnit: e.target.value }))} />
                  </label>
                  <label className="module-form-field is-wide">
                    <span>Treatment given</span>
                    <textarea className="module-form-input min-h-[80px]" value={preArrivalForm.treatmentGiven} onChange={(e) => setPreArrivalForm((p) => ({ ...p, treatmentGiven: e.target.value }))} />
                  </label>
                </div>
                <div className="module-form-footer">
                  <button className="topbar-logout-btn module-form-submit" disabled={saving} type="submit">
                    {saving ? "Sending..." : "Send Alert"}
                  </button>
                </div>
              </form>
            ) : null}

            {modal === "maintenance" ? (
              <form onSubmit={submitMaintenance} className="module-form-body">
                <div className="module-form-grid">
                  <label className="module-form-field">
                    <span>Fleet status</span>
                    <select className="module-form-input" value={maintenanceForm.status} onChange={(e) => setMaintenanceForm((p) => ({ ...p, status: e.target.value }))}>
                      <option value="AVAILABLE">Available</option>
                      <option value="MAINTENANCE">Maintenance</option>
                      <option value="OUT_OF_SERVICE">Out of service</option>
                    </select>
                  </label>
                  {(["odometerKm", "mileageKm", "liters", "cost"] as const).map((key) => (
                    <label key={key} className="module-form-field">
                      <span>{key}</span>
                      <input className="module-form-input" type="number" value={maintenanceForm[key]} onChange={(e) => setMaintenanceForm((p) => ({ ...p, [key]: e.target.value }))} />
                    </label>
                  ))}
                  <label className="module-form-field is-wide">
                    <span>Service notes</span>
                    <textarea className="module-form-input min-h-[90px]" value={maintenanceForm.serviceNotes} onChange={(e) => setMaintenanceForm((p) => ({ ...p, serviceNotes: e.target.value }))} />
                  </label>
                </div>
                <div className="module-form-footer">
                  <button className="topbar-logout-btn module-form-submit" disabled={saving} type="submit">
                    {saving ? "Saving..." : "Save Maintenance"}
                  </button>
                </div>
              </form>
            ) : null}
          </div>
        </div>
      ) : null}

      {notice ? (
        <div className={`ambulance-notification is-${noticeTone(notice)}`} role="status" aria-live="polite">
          <div className="ambulance-notification-icon"><ModuleIcon name={noticeIcon(notice)} /></div>
          <div className="ambulance-notification-copy">
            <strong>{noticeTone(notice) === "success" ? "Completed" : noticeTone(notice)}</strong>
            <span>{notice}</span>
          </div>
          <button onClick={() => setNotice("")} className="ambulance-notification-close" type="button" aria-label="Dismiss notification">×</button>
          <div className="ambulance-notification-progress" aria-hidden="true" />
        </div>
      ) : null}

      {loading ? <div className="module-toast">Loading ambulance module...</div> : null}
    </>
  );
}
