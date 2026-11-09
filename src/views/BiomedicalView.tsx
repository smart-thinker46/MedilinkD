
import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import { Activity, AlertTriangle, Cable, GraduationCap, PackagePlus, RefreshCw, Search, Settings2, ShieldAlert, X } from "lucide-react";
import { api } from "../lib/api";

const today = new Date().toISOString().slice(0, 10);
const nowLocal = () => new Date().toISOString().slice(0, 16);

const emptyDevice = { name: "", deviceModel: "", manufacturer: "", udi: "", riskClass: "CLASS_C", status: "ACTIVE", purchaseDate: today, serialNumber: "", deviceType: "", purchaseReference: "", supplier: "", installationDate: "", commissioningDate: "", warrantyEnd: "", serviceProvider: "", lotBatch: "", barcode: "", assignedDepartment: "", assignedLocation: "", maintenanceFrequencyMonths: "3" };
const emptyCalibration = { assetId: "", calibrationDate: today, referenceStandardName: "", referenceStandardSerial: "", certificateNumber: "", certificateFileUrl: "", calibrationProvider: "", approvedBy: "", approvedAt: "", measurementPoints: "", preCalibrationReadings: "", adjustmentsMade: "", postCalibrationReadings: "", toleranceLimits: "", result: "PASS", technician: "", nextCalibrationDue: today };
const emptyInterface = { analyserName: "", assetId: "", ipAddress: "", port: "5000", messageTypes: "ORM,ORU", testCodeMapping: "", lastSuccessfulMessageAt: nowLocal(), lastError: "", status: "CONNECTED" };
const emptyTraining = { assetId: "", staffId: "", staffName: "", trainingDate: today, validUntil: "", trainingMethod: "HANDS_ON", competencyAssessed: true, competencyResult: "PASS", trainer: "", notes: "" };
const emptyRecall = { manufacturer: "", model: "", udi: "", lotBatch: "", severity: "HIGH", noticeReference: "", reason: "", action: "QUARANTINE" };
const emptySafetyHold = { assetId: "", reason: "" };
const emptyIncident = { assetId: "", incidentType: "MALFUNCTION", severity: "MEDIUM", description: "" };
const emptyCommission = { assetId: "", installationVerified: false, electricalSafetyPassed: false, functionalTestPassed: false, accessoriesVerified: false, calibrationVerified: false, trainingVerified: false, acceptanceTest: "", engineer: "", notes: "" };
const emptyTransfer = { assetId: "", toLocation: "", reason: "" };

export default function BiomedicalView() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [devices, setDevices] = useState<any[]>([]);
  const [calibrations, setCalibrations] = useState<any[]>([]);
  const [interfaces, setInterfaces] = useState<any[]>([]);
  const [training, setTraining] = useState<any[]>([]);
  const [recalls, setRecalls] = useState<any[]>([]);
  const [safetyHolds, setSafetyHolds] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("ALL");
  const [selected, setSelected] = useState<any>(null);
  const [activeStat, setActiveStat] = useState<string | null>(null);
  const [modal, setModal] = useState<"device" | "calibration" | "interface" | "training" | "recall" | "safety" | "incident" | "commission" | "transfer" | "">("");
  const [deviceForm, setDeviceForm] = useState(emptyDevice);
  const [calibrationForm, setCalibrationForm] = useState(emptyCalibration);
  const [interfaceForm, setInterfaceForm] = useState(emptyInterface);
  const [trainingForm, setTrainingForm] = useState(emptyTraining);
  const [recallForm, setRecallForm] = useState(emptyRecall);
  const [safetyHoldForm, setSafetyHoldForm] = useState(emptySafetyHold);
  const [incidentForm, setIncidentForm] = useState(emptyIncident);
  const [commissionForm, setCommissionForm] = useState(emptyCommission);
  const [transferForm, setTransferForm] = useState(emptyTransfer);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ tone: "success" | "warning" | "error"; text: string } | null>(null);

  const showNotice = (text: string, tone: "success" | "warning" | "error" = "success") => {
    setNotice({ text, tone });
    window.setTimeout(() => setNotice(null), tone === "success" ? 2600 : 4400);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [dashRes, deviceRes, calRes, intRes, trainRes, staffRes, recallRes, holdRes, incidentRes, workOrderRes] = await Promise.all([
        api.get("/facility-ops/biomedical/dashboard"),
        api.get("/facility-ops/biomedical/devices"),
        api.get("/facility-ops/biomedical/calibrations"),
        api.get("/facility-ops/biomedical/interfaces"),
        api.get("/facility-ops/biomedical/training"),
        api.get("/staff").catch(() => ({ data: [] })),
        api.get("/facility-ops/biomedical/recalls").catch(() => ({ data: [] })),
        api.get("/facility-ops/biomedical/safety-holds").catch(() => ({ data: [] })),
        api.get("/facility-ops/biomedical/incidents").catch(() => ({ data: [] })),
        api.get("/facility-ops/work-orders").catch(() => ({ data: [] })),
      ]);
      setDashboard(dashRes.data || null);
      setDevices(Array.isArray(deviceRes.data) ? deviceRes.data : []);
      setCalibrations(Array.isArray(calRes.data) ? calRes.data : []);
      setInterfaces(Array.isArray(intRes.data) ? intRes.data : []);
      setTraining(Array.isArray(trainRes.data) ? trainRes.data : []);
      setStaff(Array.isArray(staffRes.data) ? staffRes.data : []);
      setRecalls(Array.isArray(recallRes.data) ? recallRes.data : []);
      setSafetyHolds(Array.isArray(holdRes.data) ? holdRes.data : []);
      setIncidents(Array.isArray(incidentRes.data) ? incidentRes.data : []);
      setWorkOrders(Array.isArray(workOrderRes.data) ? workOrderRes.data : []);
    } catch (err: any) {
      showNotice(String(err?.response?.data?.message || err?.message || "Biomedical Equipment data could not be loaded."), "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  useEffect(() => {
    const handleSidebarAction = (event: Event) => {
      const action = (event as CustomEvent<{ action?: string }>).detail?.action;
      if (!action) return;
      if (action === "calibration") { setCalibrationForm(emptyCalibration); setModal("calibration"); }
      else if (action === "interface") { setInterfaceForm(emptyInterface); setModal("interface"); }
      else if (action === "training") { setTrainingForm(emptyTraining); setModal("training"); }
      else if (action === "recall") { setRecallForm(emptyRecall); setModal("recall"); }
      else if (action === "safety") { setSafetyHoldForm(emptySafetyHold); setModal("safety"); }
      else if (action === "commission") { setCommissionForm(emptyCommission); setModal("commission"); }
      else if (action === "transfer") { setTransferForm(emptyTransfer); setModal("transfer"); }
      else if (action === "incident") { setIncidentForm(emptyIncident); setModal("incident"); }
    };
    window.addEventListener("hmis:biomedical-sidebar-action", handleSidebarAction);
    return () => window.removeEventListener("hmis:biomedical-sidebar-action", handleSidebarAction);
  }, []);

  const filteredDevices = useMemo(() => {
    const q = search.trim().toLowerCase();
    return devices.filter((row) => {
      const risk = String(row.metadata?.riskClass || row.metadata?.regulatoryClass || "").toUpperCase();
      const hay = [row.name, row.metadata?.deviceModel, row.metadata?.manufacturer, row.metadata?.udi, row.metadata?.serialNumber, row.status, risk].join(" ").toLowerCase();
      return (!q || hay.includes(q)) && (riskFilter === "ALL" || risk === riskFilter);
    });
  }, [devices, search, riskFilter]);

  const filteredCalibrations = useMemo(() => filterRows(calibrations, search, ["deviceName", "referenceStandardName", "certificateNumber", "result", "technician"]), [calibrations, search]);
  const filteredInterfaces = useMemo(() => filterRows(interfaces, search, ["analyserName", "ipAddress", "status", "messageTypes", "testCodeMapping"]), [interfaces, search]);
  const filteredTraining = useMemo(() => filterRows(training, search, ["deviceName", "staffName", "trainingMethod", "competencyResult", "trainer"]), [training, search]);

  const activeStatRows = useMemo(() => {
    const now = new Date();
    const dueSoon = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const latest = new Map<string, any>();
    calibrations.forEach((row) => { if (row.assetId && !latest.has(row.assetId)) latest.set(row.assetId, row); });
    const safeRows = devices.filter((device) => training.some((row) => row.assetId === device.id && row.competencyResult === "PASS" && (!row.validUntil || new Date(row.validUntil) >= now)));
    if (activeStat === "Devices") return devices;
    if (activeStat === "High Risk") return devices.filter((row) => ["CLASS_C", "CLASS_D"].includes(String(row.metadata?.riskClass || row.metadata?.regulatoryClass).toUpperCase()));
    if (activeStat === "Out of Service") return devices.filter((row) => ["OUT_OF_SERVICE", "QUARANTINED", "RECALLED"].includes(String(row.status).toUpperCase()));
    if (activeStat === "Calibration Due") return devices.filter((row) => { const due = latest.get(row.id)?.nextCalibrationDue ? new Date(latest.get(row.id).nextCalibrationDue) : null; return !due || (due >= now && due <= dueSoon); });
    if (activeStat === "Calibration Overdue") return devices.filter((row) => { const due = latest.get(row.id)?.nextCalibrationDue ? new Date(latest.get(row.id).nextCalibrationDue) : null; return Boolean(due && due < now); });
    if (activeStat === "Interface Alerts") return interfaces.filter((row) => ["FAILED", "DISCONNECTED", "ERROR"].includes(String(row.status).toUpperCase()));
    if (activeStat === "Trained Staff") return safeRows;
    if (activeStat === "Training Gaps") return devices.filter((row) => !safeRows.some((item) => item.id === row.id));
    if (activeStat === "Open Maintenance") return workOrders.filter((row) => !["COMPLETED", "VERIFIED", "CLOSED", "CANCELLED"].includes(String(row.status).toUpperCase()));
    return [];
  }, [activeStat, calibrations, devices, interfaces, training, workOrders]);

  const latestCalibration = (assetId: string) => calibrations.find((row) => row.assetId === assetId);
  const openDeviceForm = () => {
    setDeviceForm(emptyDevice);
    setModal("device");
  };
  const openCalibrationForm = (device?: any) => {
    setCalibrationForm({ ...emptyCalibration, assetId: device?.id || "" });
    setModal("calibration");
  };
  const openInterfaceForm = (device?: any) => {
    setInterfaceForm({ ...emptyInterface, assetId: device?.id || "", analyserName: device?.name || "" });
    setModal("interface");
  };
  const openTrainingForm = (device?: any) => {
    setTrainingForm({ ...emptyTraining, assetId: device?.id || "" });
    setModal("training");
  };
  const stats = [
    { label: "Devices", value: dashboard?.devices ?? devices.length, color: "#2563eb", icon: <Activity size={20} /> },
    { label: "High Risk", value: dashboard?.highRisk ?? 0, color: "#dc2626", icon: <ShieldAlert size={20} /> },
    { label: "Out of Service", value: dashboard?.outOfService ?? 0, color: "#d97706", icon: <AlertTriangle size={20} /> },
    { label: "Calibration Due", value: dashboard?.calibrationDue ?? 0, color: "#7c3aed", icon: <Settings2 size={20} /> },
    { label: "Calibration Overdue", value: dashboard?.calibrationOverdue ?? 0, color: "#b91c1c", icon: <AlertTriangle size={20} /> },
    { label: "Interface Alerts", value: dashboard?.interfaceAlerts ?? 0, color: "#0f766e", icon: <Cable size={20} /> },
    { label: "Trained Staff", value: dashboard?.trainedStaff ?? 0, color: "#16a34a", icon: <GraduationCap size={20} /> },
    { label: "Training Gaps", value: dashboard?.trainingGaps ?? 0, color: "#d97706", icon: <GraduationCap size={20} /> },
    { label: "Open Maintenance", value: dashboard?.maintenanceOpen ?? 0, color: "#475569", icon: <Settings2 size={20} /> },
  ];

  const submitDevice = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      await api.post("/facility-ops/biomedical/devices", { ...deviceForm, maintenanceFrequencyMonths: Number(deviceForm.maintenanceFrequencyMonths || 3) });
      setDeviceForm(emptyDevice);
      setModal("");
      showNotice("Biomedical device registered.");
      await loadData();
    } catch (err: any) {
      showNotice(String(err?.response?.data?.message || err?.message || "Device could not be saved."), "error");
    } finally {
      setSaving(false);
    }
  };

  const submitCalibration = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      await api.post("/facility-ops/biomedical/calibrations", calibrationForm);
      setCalibrationForm(emptyCalibration);
      setModal("");
      showNotice(calibrationForm.result === "FAIL" ? "Calibration failed. Device quarantined and corrective work order created." : "Calibration record saved.", calibrationForm.result === "FAIL" ? "warning" : "success");
      await loadData();
    } catch (err: any) {
      showNotice(String(err?.response?.data?.message || err?.message || "Calibration could not be saved."), "error");
    } finally {
      setSaving(false);
    }
  };

  const submitInterface = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      await api.post("/facility-ops/biomedical/interfaces", { ...interfaceForm, port: Number(interfaceForm.port || 0) });
      setInterfaceForm(emptyInterface);
      setModal("");
      showNotice(["FAILED", "DISCONNECTED"].includes(interfaceForm.status) ? "Analyser interface alert recorded." : "Analyser interface saved.", ["FAILED", "DISCONNECTED"].includes(interfaceForm.status) ? "warning" : "success");
      await loadData();
    } catch (err: any) {
      showNotice(String(err?.response?.data?.message || err?.message || "Interface could not be saved."), "error");
    } finally {
      setSaving(false);
    }
  };

  const submitTraining = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      await api.post("/facility-ops/biomedical/training", trainingForm);
      setTrainingForm(emptyTraining);
      setModal("");
      showNotice("Equipment training record saved.");
      await loadData();
    } catch (err: any) {
      showNotice(String(err?.response?.data?.message || err?.message || "Training record could not be saved."), "error");
    } finally {
      setSaving(false);
    }
  };

  const submitRecall = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setSaving(true);
    try { await api.post("/facility-ops/biomedical/recalls", recallForm); setRecallForm(emptyRecall); setModal(""); showNotice("Recall issued and matching devices quarantined.", "warning"); await loadData(); }
    catch (err: any) { showNotice(String(err?.response?.data?.message || err?.message || "Recall could not be saved."), "error"); }
    finally { setSaving(false); }
  };

  const submitSafetyHold = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setSaving(true);
    try { await api.post(`/facility-ops/biomedical/devices/${safetyHoldForm.assetId}/safety-hold`, { reason: safetyHoldForm.reason }); setSafetyHoldForm(emptySafetyHold); setModal(""); showNotice("Device placed under safety hold.", "warning"); await loadData(); }
    catch (err: any) { showNotice(String(err?.response?.data?.message || err?.message || "Safety hold could not be saved."), "error"); }
    finally { setSaving(false); }
  };

  const submitIncident = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setSaving(true);
    try { await api.post("/facility-ops/biomedical/incidents", incidentForm); setIncidentForm(emptyIncident); setModal(""); showNotice("Equipment incident recorded and device quarantined.", "warning"); await loadData(); }
    catch (err: any) { showNotice(String(err?.response?.data?.message || err?.message || "Incident could not be saved."), "error"); }
    finally { setSaving(false); }
  };

  const submitCommission = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setSaving(true);
    try { await api.post(`/facility-ops/biomedical/devices/${commissionForm.assetId}/commission`, commissionForm); setCommissionForm(emptyCommission); setModal(""); showNotice("Commissioning record saved."); await loadData(); }
    catch (err: any) { showNotice(String(err?.response?.data?.message || err?.message || "Commissioning could not be saved."), "error"); }
    finally { setSaving(false); }
  };

  const submitTransfer = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setSaving(true);
    try { await api.post(`/facility-ops/biomedical/devices/${transferForm.assetId}/transfer`, transferForm); setTransferForm(emptyTransfer); setModal(""); showNotice("Device transfer recorded."); await loadData(); }
    catch (err: any) { showNotice(String(err?.response?.data?.message || err?.message || "Device transfer could not be saved."), "error"); }
    finally { setSaving(false); }
  };

  return (
    <main className="biomed-page">
      <header className="biomed-header">
        <div><h1>Biomedical Equipment</h1><p>Medical device inventory, UDI recall search, risk classification, calibration, analyser interfaces, and equipment competency tracking.</p></div>
        <div className="biomed-actions">
          <button className="biomed-btn ghost" type="button" onClick={() => void loadData()} disabled={loading}><RefreshCw size={17} /> Refresh</button>
          <button className="biomed-btn green" type="button" onClick={openDeviceForm}><PackagePlus size={17} /> Device</button>
        </div>
      </header>

      <section className="biomed-stats">{stats.map((stat) => <button type="button" className="biomed-stat" style={{ borderLeftColor: stat.color }} key={stat.label} onClick={() => setActiveStat(stat.label)} aria-label={`View ${stat.label}`}><div><span>{stat.label}</span><strong>{stat.value}</strong></div><i style={{ color: stat.color }}>{stat.icon}</i></button>)}</section>

      <section className="biomed-filter-panel">
        <label className="biomed-search"><Search size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search UDI, model, device, analyser, staff..." /></label>
        <select value={riskFilter} onChange={(event) => setRiskFilter(event.target.value)}><option value="ALL">All risk classes</option><option value="CLASS_A">Class A</option><option value="CLASS_B">Class B</option><option value="CLASS_C">Class C</option><option value="CLASS_D">Class D</option></select>
      </section>

      <section className="biomed-grid">
        <div className="biomed-main">
          <BiomedPanel title="Medical Device Inventory and UDI Recall Search">
            <BiomedTable>
              <thead><tr><th>Device</th><th>UDI / Model</th><th>Risk</th><th>Calibration</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>{filteredDevices.length ? filteredDevices.map((row) => {
                const cal = latestCalibration(row.id);
                const risk = row.metadata?.riskClass || row.metadata?.regulatoryClass || "-";
                return <tr key={row.id} onClick={() => setSelected(row)}><td><strong>{row.name}</strong><small>{row.metadata?.manufacturer || row.category}</small></td><td><strong>{row.metadata?.udi || "-"}</strong><small>{row.metadata?.deviceModel || row.metadata?.serialNumber || "-"}</small></td><td><span className={`biomed-pill ${["CLASS_C", "CLASS_D"].includes(risk) ? "danger" : "ok"}`}>{risk}</span></td><td><strong>{cal?.result || "No record"}</strong><small>{cal?.nextCalibrationDue ? new Date(cal.nextCalibrationDue).toLocaleDateString() : "-"}</small></td><td><span className="biomed-pill">{row.status}</span></td><td><button type="button" onClick={(event) => { event.stopPropagation(); openCalibrationForm(row); }}>Calibrate</button><button type="button" onClick={(event) => { event.stopPropagation(); openInterfaceForm(row); }}>Interface</button><button type="button" onClick={(event) => { event.stopPropagation(); openTrainingForm(row); }}>Train</button></td></tr>;
              }) : <tr><td colSpan={6} className="biomed-empty">No biomedical devices recorded.</td></tr>}</tbody>
            </BiomedTable>
          </BiomedPanel>

          <section className="biomed-two">
            <BiomedPanel title="Analyser Interface Management">
              <BiomedTable compact>
                <thead><tr><th>Analyser</th><th>Endpoint</th><th>Messages</th><th>Status</th></tr></thead>
                <tbody>{filteredInterfaces.slice(0, 9).length ? filteredInterfaces.slice(0, 9).map((row) => <tr key={row.interfaceId || row.id} onClick={() => setSelected(row)}><td><strong>{row.analyserName}</strong><small>{row.lastError || "No error"}</small></td><td>{row.ipAddress}:{row.port}</td><td>{row.messageTypes}</td><td><span className={`biomed-pill ${["FAILED", "DISCONNECTED"].includes(row.status) ? "danger" : "ok"}`}>{row.status}</span></td></tr>) : <tr><td colSpan={4} className="biomed-empty">No analyser interfaces configured.</td></tr>}</tbody>
              </BiomedTable>
            </BiomedPanel>

            <BiomedPanel title="Equipment Training Records">
              <BiomedTable compact>
                <thead><tr><th>Device</th><th>Staff</th><th>Method</th><th>Competency</th></tr></thead>
                <tbody>{filteredTraining.slice(0, 9).length ? filteredTraining.slice(0, 9).map((row) => <tr key={row.trainingId || row.id} onClick={() => setSelected(row)}><td><strong>{row.deviceName}</strong><small>{new Date(row.trainingDate).toLocaleDateString()}</small></td><td>{row.staffName || row.staffId}</td><td>{row.trainingMethod}</td><td><span className={`biomed-pill ${row.competencyResult === "PASS" ? "ok" : "warn"}`}>{row.competencyResult}</span></td></tr>) : <tr><td colSpan={4} className="biomed-empty">No training records saved.</td></tr>}</tbody>
              </BiomedTable>
            </BiomedPanel>
          </section>

          <section className="biomed-two">
            <BiomedPanel title="Recall and Safety Holds">
              <BiomedTable compact>
                <thead><tr><th>Type</th><th>Device / Notice</th><th>Severity</th><th>Status</th></tr></thead>
                <tbody>{[...recalls.map((row) => ({ ...row, _type: "RECALL", _device: row.notice_reference || row.udi || row.model || row.manufacturer, _status: row.status || "OPEN" })), ...safetyHolds.map((row) => ({ ...row, _type: "SAFETY HOLD", _device: row.asset_id, _status: row.status }))].slice(0, 12).map((row) => <tr key={`${row._type}-${row.id}`} onClick={() => setSelected(row)}><td>{row._type}</td><td>{row._device || "-"}</td><td><span className={`biomed-pill ${String(row.severity || "").toUpperCase() === "CRITICAL" ? "danger" : "warn"}`}>{row.severity || "-"}</span></td><td>{row._status}</td></tr>)}{!recalls.length && !safetyHolds.length ? <tr><td colSpan={4} className="biomed-empty">No recalls or safety holds recorded.</td></tr> : null}</tbody>
              </BiomedTable>
            </BiomedPanel>
            <BiomedPanel title="Equipment Incidents">
              <BiomedTable compact>
                <thead><tr><th>Device</th><th>Type</th><th>Severity</th><th>Reported</th></tr></thead>
                <tbody>{incidents.slice(0, 12).map((row) => <tr key={row.id} onClick={() => setSelected(row)}><td>{row.asset_id}</td><td>{row.incident_type}</td><td><span className={`biomed-pill ${["HIGH", "CRITICAL"].includes(String(row.severity).toUpperCase()) ? "danger" : "warn"}`}>{row.severity}</span></td><td>{row.created_at ? new Date(row.created_at).toLocaleString() : "-"}</td></tr>)}{!incidents.length ? <tr><td colSpan={4} className="biomed-empty">No equipment incidents recorded.</td></tr> : null}</tbody>
              </BiomedTable>
            </BiomedPanel>
          </section>
        </div>

        <aside className="biomed-side">
          <section className="biomed-selected"><span>Selected Biomedical Record</span><h2>{selected?.name || selected?.deviceName || selected?.analyserName || "No record selected"}</h2><dl><div><dt>Status</dt><dd>{selected?.status || selected?.result || selected?.competencyResult || "-"}</dd></div><div><dt>Risk</dt><dd>{selected?.metadata?.riskClass || selected?.metadata?.regulatoryClass || "-"}</dd></div><div><dt>UDI</dt><dd>{selected?.metadata?.udi || "-"}</dd></div></dl></section>
          <BiomedPanel title="Calibration Records">{filteredCalibrations.length ? <div className="biomed-list">{filteredCalibrations.slice(0, 8).map((row) => <button type="button" key={row.calibrationId || row.id} onClick={() => setSelected(row)}><span><strong>{row.deviceName}</strong><small>{row.referenceStandardName || "Reference standard"} · {row.certificateNumber || "No certificate"}</small></span><b className={row.result === "PASS" ? "ok" : "danger"}>{row.result}</b></button>)}</div> : <p className="biomed-note">No calibration records.</p>}</BiomedPanel>
        </aside>
      </section>

      {notice ? <div className={`biomed-toast ${notice.tone}`}><strong>{notice.tone === "error" ? "Error" : notice.tone === "warning" ? "Attention" : "Saved"}</strong><span>{notice.text}</span><button type="button" onClick={() => setNotice(null)}>x</button></div> : null}
      {loading ? <div className="biomed-loading">Loading biomedical equipment...</div> : null}
      {activeStat ? <BiomedicalStatModal title={activeStat} rows={activeStatRows} onClose={() => setActiveStat(null)} /> : null}

      {modal === "device" ? <BiomedModal title="Medical Device Registration" tone="green" onClose={() => setModal("")}><form className="biomed-form" onSubmit={submitDevice}><Text label="Device name" value={deviceForm.name} onChange={(v) => setDeviceForm((f) => ({ ...f, name: v }))} required /><Text label="Device type" value={deviceForm.deviceType} onChange={(v) => setDeviceForm((f) => ({ ...f, deviceType: v }))} /><Text label="Device model" value={deviceForm.deviceModel} onChange={(v) => setDeviceForm((f) => ({ ...f, deviceModel: v }))} /><Text label="Manufacturer" value={deviceForm.manufacturer} onChange={(v) => setDeviceForm((f) => ({ ...f, manufacturer: v }))} /><Text label="Supplier" value={deviceForm.supplier} onChange={(v) => setDeviceForm((f) => ({ ...f, supplier: v }))} /><Text label="Purchase reference" value={deviceForm.purchaseReference} onChange={(v) => setDeviceForm((f) => ({ ...f, purchaseReference: v }))} /><Text label="Unique Device Identifier (UDI)" value={deviceForm.udi} onChange={(v) => setDeviceForm((f) => ({ ...f, udi: v }))} required /><Text label="Serial number" value={deviceForm.serialNumber} onChange={(v) => setDeviceForm((f) => ({ ...f, serialNumber: v }))} /><Text label="Lot / batch" value={deviceForm.lotBatch} onChange={(v) => setDeviceForm((f) => ({ ...f, lotBatch: v }))} /><Text label="Barcode / QR value" value={deviceForm.barcode} onChange={(v) => setDeviceForm((f) => ({ ...f, barcode: v }))} /><Select label="Risk class" value={deviceForm.riskClass} onChange={(v) => setDeviceForm((f) => ({ ...f, riskClass: v }))} options={["CLASS_A", "CLASS_B", "CLASS_C", "CLASS_D"]} /><Select label="Status" value={deviceForm.status} onChange={(v) => setDeviceForm((f) => ({ ...f, status: v }))} options={["ACTIVE", "OUT_OF_SERVICE", "QUARANTINED"]} /><Text label="Purchase date" type="date" value={deviceForm.purchaseDate} onChange={(v) => setDeviceForm((f) => ({ ...f, purchaseDate: v }))} /><Text label="Installation date" type="date" value={deviceForm.installationDate} onChange={(v) => setDeviceForm((f) => ({ ...f, installationDate: v }))} /><Text label="Commissioning date" type="date" value={deviceForm.commissioningDate} onChange={(v) => setDeviceForm((f) => ({ ...f, commissioningDate: v }))} /><Text label="Warranty end" type="date" value={deviceForm.warrantyEnd} onChange={(v) => setDeviceForm((f) => ({ ...f, warrantyEnd: v }))} /><Text label="Service provider" value={deviceForm.serviceProvider} onChange={(v) => setDeviceForm((f) => ({ ...f, serviceProvider: v }))} /><Text label="Department" value={deviceForm.assignedDepartment} onChange={(v) => setDeviceForm((f) => ({ ...f, assignedDepartment: v }))} /><Text label="Location" value={deviceForm.assignedLocation} onChange={(v) => setDeviceForm((f) => ({ ...f, assignedLocation: v }))} /><Text label="Maintenance frequency months" type="number" value={deviceForm.maintenanceFrequencyMonths} onChange={(v) => setDeviceForm((f) => ({ ...f, maintenanceFrequencyMonths: v }))} /><Footer saving={saving} onCancel={() => setModal("")} label="Save Device" /></form></BiomedModal> : null}
      {modal === "calibration" ? <BiomedModal title="Calibration Record" tone="purple" onClose={() => setModal("")}><form className="biomed-form" onSubmit={submitCalibration}><DeviceSelect devices={devices} value={calibrationForm.assetId} onChange={(v) => setCalibrationForm((f) => ({ ...f, assetId: v }))} /><Text label="Calibration date" type="date" value={calibrationForm.calibrationDate} onChange={(v) => setCalibrationForm((f) => ({ ...f, calibrationDate: v }))} /><Text label="Reference standard name" value={calibrationForm.referenceStandardName} onChange={(v) => setCalibrationForm((f) => ({ ...f, referenceStandardName: v }))} /><Text label="Reference standard serial" value={calibrationForm.referenceStandardSerial} onChange={(v) => setCalibrationForm((f) => ({ ...f, referenceStandardSerial: v }))} /><Text label="Traceable certificate number" value={calibrationForm.certificateNumber} onChange={(v) => setCalibrationForm((f) => ({ ...f, certificateNumber: v }))} /><Text label="Certificate file URL" value={calibrationForm.certificateFileUrl} onChange={(v) => setCalibrationForm((f) => ({ ...f, certificateFileUrl: v }))} /><Text label="Calibration provider" value={calibrationForm.calibrationProvider} onChange={(v) => setCalibrationForm((f) => ({ ...f, calibrationProvider: v }))} /><Text label="Approved by" value={calibrationForm.approvedBy} onChange={(v) => setCalibrationForm((f) => ({ ...f, approvedBy: v }))} /><Text label="Next calibration due" type="date" value={calibrationForm.nextCalibrationDue} onChange={(v) => setCalibrationForm((f) => ({ ...f, nextCalibrationDue: v }))} /><Select label="Result" value={calibrationForm.result} onChange={(v) => setCalibrationForm((f) => ({ ...f, result: v }))} options={["PASS", "FAIL"]} /><Text label="Technician" value={calibrationForm.technician} onChange={(v) => setCalibrationForm((f) => ({ ...f, technician: v }))} /><Area label="Measurement points tested" value={calibrationForm.measurementPoints} onChange={(v) => setCalibrationForm((f) => ({ ...f, measurementPoints: v }))} /><Area label="Pre-calibration readings" value={calibrationForm.preCalibrationReadings} onChange={(v) => setCalibrationForm((f) => ({ ...f, preCalibrationReadings: v }))} /><Area label="Adjustments made" value={calibrationForm.adjustmentsMade} onChange={(v) => setCalibrationForm((f) => ({ ...f, adjustmentsMade: v }))} /><Area label="Post-calibration readings" value={calibrationForm.postCalibrationReadings} onChange={(v) => setCalibrationForm((f) => ({ ...f, postCalibrationReadings: v }))} /><Area label="Tolerance limits" value={calibrationForm.toleranceLimits} onChange={(v) => setCalibrationForm((f) => ({ ...f, toleranceLimits: v }))} /><Footer saving={saving} onCancel={() => setModal("")} label="Save Calibration" /></form></BiomedModal> : null}
      {modal === "interface" ? <BiomedModal title="Analyser Interface Configuration" tone="blue" onClose={() => setModal("")}><form className="biomed-form" onSubmit={submitInterface}><Text label="Analyser name" value={interfaceForm.analyserName} onChange={(v) => setInterfaceForm((f) => ({ ...f, analyserName: v }))} required /><DeviceSelect devices={devices} value={interfaceForm.assetId} onChange={(v) => setInterfaceForm((f) => ({ ...f, assetId: v }))} required={false} /><Text label="IP address" value={interfaceForm.ipAddress} onChange={(v) => setInterfaceForm((f) => ({ ...f, ipAddress: v }))} /><Text label="Port" type="number" value={interfaceForm.port} onChange={(v) => setInterfaceForm((f) => ({ ...f, port: v }))} /><Text label="Message types" value={interfaceForm.messageTypes} onChange={(v) => setInterfaceForm((f) => ({ ...f, messageTypes: v }))} /><Select label="Status" value={interfaceForm.status} onChange={(v) => setInterfaceForm((f) => ({ ...f, status: v }))} options={["CONNECTED", "DISCONNECTED", "FAILED"]} /><Area label="Test code mapping" value={interfaceForm.testCodeMapping} onChange={(v) => setInterfaceForm((f) => ({ ...f, testCodeMapping: v }))} /><Text label="Last successful message" type="datetime-local" value={interfaceForm.lastSuccessfulMessageAt} onChange={(v) => setInterfaceForm((f) => ({ ...f, lastSuccessfulMessageAt: v }))} /><Area label="Last error response" value={interfaceForm.lastError} onChange={(v) => setInterfaceForm((f) => ({ ...f, lastError: v }))} /><Footer saving={saving} onCancel={() => setModal("")} label="Save Interface" /></form></BiomedModal> : null}
      {modal === "training" ? <BiomedModal title="Equipment Training Record" tone="teal" onClose={() => setModal("")}><form className="biomed-form" onSubmit={submitTraining}><DeviceSelect devices={devices} value={trainingForm.assetId} onChange={(v) => setTrainingForm((f) => ({ ...f, assetId: v }))} /><StaffSelect staff={staff} value={trainingForm.staffId} onChange={(v, name) => setTrainingForm((f) => ({ ...f, staffId: v, staffName: name || f.staffName }))} /><Text label="Staff name" value={trainingForm.staffName} onChange={(v) => setTrainingForm((f) => ({ ...f, staffName: v }))} required /><Text label="Training date" type="date" value={trainingForm.trainingDate} onChange={(v) => setTrainingForm((f) => ({ ...f, trainingDate: v }))} /><Text label="Competency valid until" type="date" value={trainingForm.validUntil} onChange={(v) => setTrainingForm((f) => ({ ...f, validUntil: v }))} /><Select label="Training method" value={trainingForm.trainingMethod} onChange={(v) => setTrainingForm((f) => ({ ...f, trainingMethod: v }))} options={["HANDS_ON", "MANUFACTURER_E_LEARNING", "IN_SERVICE"]} /><Select label="Competency result" value={trainingForm.competencyResult} onChange={(v) => setTrainingForm((f) => ({ ...f, competencyResult: v }))} options={["PASS", "FAIL", "PENDING"]} /><Text label="Trainer" value={trainingForm.trainer} onChange={(v) => setTrainingForm((f) => ({ ...f, trainer: v }))} /><Check label="Competency assessed" checked={trainingForm.competencyAssessed} onChange={(v) => setTrainingForm((f) => ({ ...f, competencyAssessed: v }))} /><Area label="Notes" value={trainingForm.notes} onChange={(v) => setTrainingForm((f) => ({ ...f, notes: v }))} /><Footer saving={saving} onCancel={() => setModal("")} label="Save Training" /></form></BiomedModal> : null}
      {modal === "recall" ? <BiomedModal title="Medical Device Recall" tone="red" onClose={() => setModal("")}><form className="biomed-form" onSubmit={submitRecall}><Text label="Manufacturer" value={recallForm.manufacturer} onChange={(v) => setRecallForm((f) => ({ ...f, manufacturer: v }))} /><Text label="Model" value={recallForm.model} onChange={(v) => setRecallForm((f) => ({ ...f, model: v }))} /><Text label="UDI" value={recallForm.udi} onChange={(v) => setRecallForm((f) => ({ ...f, udi: v }))} /><Text label="Lot / batch" value={recallForm.lotBatch} onChange={(v) => setRecallForm((f) => ({ ...f, lotBatch: v }))} /><Select label="Severity" value={recallForm.severity} onChange={(v) => setRecallForm((f) => ({ ...f, severity: v }))} options={["LOW", "MEDIUM", "HIGH", "CRITICAL"]} /><Text label="Notice reference" value={recallForm.noticeReference} onChange={(v) => setRecallForm((f) => ({ ...f, noticeReference: v }))} /><Area label="Recall reason" value={recallForm.reason} onChange={(v) => setRecallForm((f) => ({ ...f, reason: v }))} /><Footer saving={saving} onCancel={() => setModal("")} label="Issue Recall" /></form></BiomedModal> : null}
      {modal === "safety" ? <BiomedModal title="Device Safety Hold" tone="red" onClose={() => setModal("")}><form className="biomed-form" onSubmit={submitSafetyHold}><DeviceSelect devices={devices} value={safetyHoldForm.assetId} onChange={(v) => setSafetyHoldForm((f) => ({ ...f, assetId: v }))} /><Area label="Safety hold reason" value={safetyHoldForm.reason} onChange={(v) => setSafetyHoldForm((f) => ({ ...f, reason: v }))} /><Footer saving={saving} onCancel={() => setModal("")} label="Place Safety Hold" /></form></BiomedModal> : null}
      {modal === "incident" ? <BiomedModal title="Report Equipment Incident" tone="red" onClose={() => setModal("")}><form className="biomed-form" onSubmit={submitIncident}><DeviceSelect devices={devices} value={incidentForm.assetId} onChange={(v) => setIncidentForm((f) => ({ ...f, assetId: v }))} /><Select label="Incident type" value={incidentForm.incidentType} onChange={(v) => setIncidentForm((f) => ({ ...f, incidentType: v }))} options={["MALFUNCTION", "ADVERSE_EVENT", "DAMAGE", "NEAR_MISS", "OTHER"]} /><Select label="Severity" value={incidentForm.severity} onChange={(v) => setIncidentForm((f) => ({ ...f, severity: v }))} options={["LOW", "MEDIUM", "HIGH", "CRITICAL"]} /><Area label="Incident description" value={incidentForm.description} onChange={(v) => setIncidentForm((f) => ({ ...f, description: v }))} /><Footer saving={saving} onCancel={() => setModal("")} label="Report Incident" /></form></BiomedModal> : null}
      {modal === "commission" ? <BiomedModal title="Device Commissioning Approval" tone="blue" onClose={() => setModal("")}><form className="biomed-form" onSubmit={submitCommission}><DeviceSelect devices={devices} value={commissionForm.assetId} onChange={(v) => setCommissionForm((f) => ({ ...f, assetId: v }))} /><Text label="Commissioning engineer" value={commissionForm.engineer} onChange={(v) => setCommissionForm((f) => ({ ...f, engineer: v }))} required /><Check label="Installation verified" checked={commissionForm.installationVerified} onChange={(v) => setCommissionForm((f) => ({ ...f, installationVerified: v }))} /><Check label="Electrical safety passed" checked={commissionForm.electricalSafetyPassed} onChange={(v) => setCommissionForm((f) => ({ ...f, electricalSafetyPassed: v }))} /><Check label="Functional test passed" checked={commissionForm.functionalTestPassed} onChange={(v) => setCommissionForm((f) => ({ ...f, functionalTestPassed: v }))} /><Check label="Accessories verified" checked={commissionForm.accessoriesVerified} onChange={(v) => setCommissionForm((f) => ({ ...f, accessoriesVerified: v }))} /><Check label="Calibration verified" checked={commissionForm.calibrationVerified} onChange={(v) => setCommissionForm((f) => ({ ...f, calibrationVerified: v }))} /><Check label="Training verified" checked={commissionForm.trainingVerified} onChange={(v) => setCommissionForm((f) => ({ ...f, trainingVerified: v }))} /><Area label="Acceptance test / notes" value={commissionForm.acceptanceTest} onChange={(v) => setCommissionForm((f) => ({ ...f, acceptanceTest: v }))} /><Footer saving={saving} onCancel={() => setModal("")} label="Save Commissioning" /></form></BiomedModal> : null}
      {modal === "transfer" ? <BiomedModal title="Transfer Biomedical Device" tone="teal" onClose={() => setModal("")}><form className="biomed-form" onSubmit={submitTransfer}><DeviceSelect devices={devices} value={transferForm.assetId} onChange={(v) => setTransferForm((f) => ({ ...f, assetId: v }))} /><Text label="Destination / sub-location" value={transferForm.toLocation} onChange={(v) => setTransferForm((f) => ({ ...f, toLocation: v }))} required /><Area label="Transfer reason" value={transferForm.reason} onChange={(v) => setTransferForm((f) => ({ ...f, reason: v }))} /><Footer saving={saving} onCancel={() => setModal("")} label="Record Transfer" /></form></BiomedModal> : null}
    </main>
  );
}

function filterRows(rows: any[], search: string, keys: string[]) {
  const q = search.trim().toLowerCase();
  if (!q) return rows;
  return rows.filter((row) => keys.map((key) => row?.[key]).join(" ").toLowerCase().includes(q));
}

function BiomedPanel({ title, children }: { title: string; children: ReactNode }) {
  return <section className="biomed-panel"><div className="biomed-panel-title"><h2>{title}</h2></div>{children}</section>;
}

function BiomedTable({ children, compact = false }: { children: ReactNode; compact?: boolean }) {
  return <div className="biomed-table-wrap"><table className={`biomed-table ${compact ? "compact" : ""}`}>{children}</table></div>;
}

function BiomedModal({ title, tone, onClose, children }: { title: string; tone: string; onClose: () => void; children: ReactNode }) {
  return <div className="biomed-modal-backdrop"><section className={`biomed-modal is-${tone}`}><header><div><span>Biomedical Equipment</span><h2>{title}</h2></div><button type="button" onClick={onClose} aria-label="Close form"><X size={18} /></button></header>{children}</section></div>;
}

function BiomedicalStatModal({ title, rows, onClose }: { title: string; rows: any[]; onClose: () => void }) {
  return <div className="biomed-modal-backdrop"><section className="biomed-modal biomed-stat-modal"><header><div><span>Biomedical Equipment</span><h2>{title} records</h2></div><button type="button" onClick={onClose} aria-label="Close records"><X size={18} /></button></header><div className="biomed-stat-results">{rows.length ? <div className="biomed-stat-result-list">{rows.map((row, index) => <button type="button" key={row.id || row.assetId || row.interfaceId || `${title}-${index}`}><strong>{row.name || row.deviceName || row.analyserName || row.asset?.name || row.assetId || "Biomedical record"}</strong><span>{row.metadata?.udi || row.metadata?.deviceModel || row.status || row.result || row.competencyResult || row.description || row.ipAddress || "View record details"}</span></button>)}</div> : <p className="biomed-note">No {title.toLowerCase()} records found.</p>}</div></section></div>;
}

function DeviceSelect({ devices, value, onChange, required = true }: { devices: any[]; value: string; onChange: (value: string) => void; required?: boolean }) {
  return <label><span>Device</span><select value={value} onChange={(event) => onChange(event.target.value)} required={required}><option value="">Select device</option>{devices.map((row) => <option value={row.id} key={row.id}>{row.name} - {row.metadata?.udi || row.metadata?.serialNumber || row.id}</option>)}</select></label>;
}

function StaffSelect({ staff, value, onChange }: { staff: any[]; value: string; onChange: (value: string, name?: string) => void }) {
  return <label><span>Staff profile</span><select value={value} onChange={(event) => { const person = staff.find((row) => row.id === event.target.value); onChange(event.target.value, [person?.firstName, person?.lastName].filter(Boolean).join(" ")); }}><option value="">Select staff</option>{staff.map((row) => <option value={row.id} key={row.id}>{[row.firstName, row.lastName].filter(Boolean).join(" ")} - {row.jobTitle || row.staffNumber}</option>)}</select></label>;
}

function Text({ label, value, onChange, type = "text", required = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean }) {
  return <label><span>{label}</span><input type={type} value={value} onChange={(event) => onChange(event.target.value)} required={required} /></label>;
}

function Area({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="wide"><span>{label}</span><textarea value={value} onChange={(event) => onChange(event.target.value)} /></label>;
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) {
  return <label><span>{label}</span><select value={value} onChange={(event) => onChange(event.target.value)}>{options.map((option) => <option value={option} key={option}>{option.replaceAll("_", " ")}</option>)}</select></label>;
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return <label className="biomed-check"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} /> {label}</label>;
}

function Footer({ saving, onCancel, label }: { saving: boolean; onCancel: () => void; label: string }) {
  return <footer><button type="button" onClick={onCancel}>Cancel</button><button type="submit" disabled={saving}>{saving ? "Saving..." : label}</button></footer>;
}
