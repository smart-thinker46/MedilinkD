import type { FormEvent, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  BookOpenCheck,
  CheckCircle2,
  ClipboardCheck,
  PackageCheck,
  Pill,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  ShieldCheck,
  Siren,
  Stethoscope,
} from "lucide-react";
import { api } from "../lib/api";
import { useLiveRefresh } from "../lib/liveRefresh";

type PharmacyModal = "prescription" | "dispense" | "formulary" | "return" | "reconcile" | "antibiogram" | "workflow" | null;
type PharmacyWorkflow = "monitor" | "waiting" | "queue" | null;

const unwrapRows = (value: any) => {
  let current = value;
  for (let depth = 0; depth < 6; depth += 1) {
    if (Array.isArray(current)) return current;
    if (!current || typeof current !== "object") return [];
    const next = current.data ?? current.items ?? current.rows ?? current.results ?? current.prescriptions ?? current.batches ?? current.staff ?? current.patients ?? current.catalog ?? current.medicines ?? current.records;
    if (next === undefined || next === current) return [];
    current = next;
  }
  if (Array.isArray(current)) return current;
  return [];
};

const unwrapObject = (value: any) => {
  let current = value;
  for (let depth = 0; depth < 6; depth += 1) {
    if (!current || typeof current !== "object" || Array.isArray(current)) return {};
    if (current.data && typeof current.data === "object" && !Array.isArray(current.data)) {
      current = current.data;
      continue;
    }
    return current;
  }
  return current && typeof current === "object" && !Array.isArray(current) ? current : {};
};

const prescriptionDefaults = {
  patientId: "",
  visitId: "",
  doctorId: "",
  medication: "",
  dosage: "",
  frequency: "",
  duration: "",
  prescriptionQuantity: "",
  notes: "",
  insuranceEligible: false,
  controlledStatus: false,
  requiresPrescription: true,
};

const dispenseDefaults = {
  medicineId: "",
  quantity: "",
  witnessPharmacistId: "",
  physicalBalance: "",
  safetyOverrideJustification: "",
  insuranceCovered: false,
  markPaid: false,
  paymentMethod: "CASH",
  notes: "",
};

const formularyDefaults = {
  genericName: "",
  brandName: "",
  brandNames: "",
  formulation: "",
  strength: "",
  atcCode: "",
  classification: "",
  controlledStatus: false,
  prescriptionRequired: true,
  minimumStockLevel: "",
  criticalLevel: "",
  sellingPrice: "",
  nhifRate: "",
  kenyaEssentialMedicine: false,
};

const returnDefaults = {
  prescriptionId: "",
  dispenseId: "",
  medicineId: "",
  quantity: "",
  batchNumber: "",
  reason: "",
  resaleable: true,
  controlledStatus: false,
  witnessPharmacistId: "",
  physicalBalance: "",
  notes: "",
};

const reconcileDefaults = {
  monthKey: "",
  medicineName: "",
  systemBalance: "",
  physicalBalance: "",
  notes: "",
};

const antibiogramDefaults = {
  organism: "",
  antibiotic: "",
  resistanceRate: "",
  sensitivityRate: "",
  preferredAlternative: "",
};

const workflowDefaults = { eventType: "INTERVENTION", reason: "", notes: "", recipient: "", acknowledged: false };

const patientName = (row: any) =>
  [row?.patient?.firstName, row?.patient?.middleName, row?.patient?.lastName].filter(Boolean).join(" ").trim() || "Patient";
const patientCode = (row: any) => row?.patient?.patientCode || row?.patient?.mrn || "-";
const doctorName = (row: any) => [row?.doctor?.firstName, row?.doctor?.lastName].filter(Boolean).join(" ") || "-";
const statusLabel = (row: any) => String(row?.normalizedStatus || row?.status || "PRESCRIBED").toUpperCase();
const stockName = (row: any) => row?.name || row?.brandName || row?.genericName || "Medicine";
const toneFromMessage = (message: string) => {
  const text = message.toLowerCase();
  if (text.includes("failed") || text.includes("hard-stop") || text.includes("cancel")) return "error";
  if (text.includes("controlled") || text.includes("return") || text.includes("steward") || text.includes("stock")) return "warning";
  if (text.includes("review") || text.includes("scheduled") || text.includes("register")) return "info";
  return "success";
};

export default function PharmacyView() {
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [queueTokens, setQueueTokens] = useState<any[]>([]);
  const [dashboard, setDashboard] = useState<any>({});
  const [catalog, setCatalog] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [controlledRegister, setControlledRegister] = useState<any>({});
  const [antibiogram, setAntibiogram] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [safety, setSafety] = useState<any | null>(null);
  const [modal, setModal] = useState<PharmacyModal>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ACTIVE");
  const [stockFilter, setStockFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");
  const [notice, setNotice] = useState("");
  const [workflow, setWorkflow] = useState<PharmacyWorkflow>(null);
  const [waitingCheckInDate, setWaitingCheckInDate] = useState(() => new Date().toISOString().slice(0, 10));

  const [prescriptionForm, setPrescriptionForm] = useState(prescriptionDefaults);
  const [dispenseForm, setDispenseForm] = useState(dispenseDefaults);
  const [formularyForm, setFormularyForm] = useState(formularyDefaults);
  const [returnForm, setReturnForm] = useState(returnDefaults);
  const [reconcileForm, setReconcileForm] = useState(reconcileDefaults);
  const [antibiogramForm, setAntibiogramForm] = useState(antibiogramDefaults);
  const [workflowForm, setWorkflowForm] = useState(workflowDefaults);

  const setToast = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice((current) => (current === message ? "" : current)), 5200);
  };

  const load = async () => {
    setLoading(true);
    try {
      const safeGet = (label: string, request: Promise<any>, fallback: any) => request.catch((error) => ({
        data: fallback,
        __failed: true,
        __label: label,
        __status: error?.response?.status,
        __message: error?.response?.data?.message || error?.message || "request failed",
      }));
      const [pRes, dRes, cRes, iRes, sRes, regRes, abgRes, patientRes, queueRes] = await Promise.all([
        safeGet("prescriptions", api.get("/pharmacy/prescriptions"), []),
        safeGet("dashboard", api.get("/pharmacy/dashboard"), {}),
        safeGet("catalog", api.get("/pharmacy/catalog"), []),
        safeGet("inventory", api.get("/pharmacy/inventory-batches"), []),
        safeGet("staff", api.get("/pharmacy/staff"), []),
        safeGet("controlled register", api.get("/pharmacy/controlled-register"), {}),
        safeGet("antibiogram", api.get("/pharmacy/antibiogram"), []),
        safeGet("patients", api.get("/tenant/patients", { params: { limit: 800 } }), []),
        safeGet("queue", api.get("/opd/queue/board", { params: { departmentId: "PHARMACY" } }), {}),
      ]);
      const failed = [pRes, dRes, cRes, iRes, sRes, regRes, abgRes, patientRes, queueRes].filter((response: any) => response?.__failed);
      if (failed.length) {
        const details = failed.map((response: any) => `${response.__label}${response.__status ? ` (${response.__status})` : ""}`).join(", ");
        setToast(`${failed.length} Pharmacy data source${failed.length === 1 ? "" : "s"} could not be loaded: ${details}.`);
      }
      const rows = unwrapRows(pRes.data);
      setPrescriptions(rows);
      setDashboard(unwrapObject(dRes.data));
      setCatalog(unwrapRows(cRes.data));
      setInventory(unwrapRows(iRes.data));
      setStaff(unwrapRows(sRes.data));
      setControlledRegister(unwrapObject(regRes.data));
      setAntibiogram(unwrapRows(abgRes.data));
      setPatients(unwrapRows(patientRes.data));
      const queuePayload = unwrapObject(queueRes.data);
      setQueueTokens(unwrapRows(queuePayload?.tokens ?? queuePayload));
      setSelected((current: any | null) => (current && rows.some((row: any) => row.id === current.id) ? rows.find((row: any) => row.id === current.id) : rows[0] || null));
    } catch (error: any) {
      setToast(error?.response?.data?.message || "Pharmacy data could not be loaded.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  useLiveRefresh(load, { intervalMs: 45000 });

  useEffect(() => {
    const handleAction = (event: Event) => {
      const action = (event as CustomEvent<{ action?: string }>).detail?.action;
      if (action === "monitor-patient") setWorkflow("monitor");
      if (action === "queue-patient") setWorkflow("queue");
    };
    const handleWaiting = (event: Event) => {
      const moduleKey = (event as CustomEvent<{ moduleKey?: string }>).detail?.moduleKey;
      if (!moduleKey || moduleKey === "pharmacy") setWorkflow("waiting");
    };
    const handleQueued = () => void load();
    window.addEventListener("hmis:pharmacy-sidebar-action", handleAction);
    window.addEventListener("hmis:open-module-waiting-list", handleWaiting);
    window.addEventListener("hmis:patient-queued", handleQueued);
    return () => {
      window.removeEventListener("hmis:pharmacy-sidebar-action", handleAction);
      window.removeEventListener("hmis:open-module-waiting-list", handleWaiting);
      window.removeEventListener("hmis:patient-queued", handleQueued);
    };
  }, []);

  useEffect(() => {
    if (!selected?.id) {
      setSafety(null);
      return;
    }
    setSafety(null);
    api.get(`/pharmacy/prescription/${selected.id}/safety`).then((res) => setSafety(unwrapObject(res.data))).catch(() => setSafety(null));
  }, [selected?.id]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const active = new Set(["PRESCRIPTION_CREATED", "PRESCRIBED", "RECEIVED_BY_PHARMACY", "PHARMACIST_REVIEW", "SAFETY_CHECK", "FORMULARY_CHECK", "AVAILABILITY_CHECK", "AUTHORIZATION_CHECK", "DISPENSING_PREPARATION", "IN_REVIEW", "PARTIALLY_DISPENSED", "LABELLED", "HANDED_OVER", "PENDING", "CLARIFICATION_REQUIRED", "OUT_OF_STOCK", "SUBSTITUTION_PROPOSED", "SUBSTITUTION_APPROVED"]);
    return prescriptions.filter((row) => {
      const status = statusLabel(row);
      if (statusFilter === "ACTIVE" && !active.has(status)) return false;
      if (statusFilter !== "ACTIVE" && statusFilter !== "ALL" && status !== statusFilter) return false;
      if (stockFilter === "CONTROLLED" && !row.controlledStatus) return false;
      if (stockFilter === "ALERTS" && !row.safety?.allergyFlag && !(row.safety?.interactionPairs || []).length) return false;
      const haystack = [patientName(row), patientCode(row), row.patient?.id, row.medication, row.genericName, row.brandName, row.dosage, row.frequency, doctorName(row), status].join(" ").toLowerCase();
      return !q || haystack.includes(q);
    });
  }, [prescriptions, search, statusFilter, stockFilter]);

  const selectedBatches = useMemo(() => {
    const med = String(selected?.medication || "").toLowerCase();
    if (!med) return inventory;
    const firstToken = med.split(/\s+/).find(Boolean) || med;
    const matches = inventory.filter((row) => `${row.name || ""} ${row.genericName || ""}`.toLowerCase().includes(firstToken));
    const source = matches.length ? matches : inventory;
    return [...source]
      .filter((row) => Number(row?.quantity ?? 0) > 0)
      .sort((a, b) => new Date(a?.expiryDate || "9999-12-31").getTime() - new Date(b?.expiryDate || "9999-12-31").getTime());
  }, [inventory, selected?.medication]);

  const stockAlertRows = useMemo(() => {
    const critical = Array.isArray(dashboard?.criticalStockItems) ? dashboard.criticalStockItems : [];
    const low = Array.isArray(dashboard?.lowStockItems) ? dashboard.lowStockItems : [];
    const byId = new Map<string, any>();
    [...critical, ...low].forEach((row: any) => {
      const key = String(row?.id || `${row?.name}-${row?.batchNumber}`);
      if (key) byId.set(key, row);
    });
    return Array.from(byId.values());
  }, [dashboard]);

  const stats = useMemo(() => {
    const totals = dashboard?.totals || {};
    return [
      { label: "Pending", value: totals.pendingPrescriptions ?? prescriptions.filter((row) => ["PRESCRIBED", "PENDING"].includes(statusLabel(row))).length, color: "#dc2626" },
      { label: "Dispensed Today", value: totals.dispensedToday ?? 0, color: "#16a34a" },
      { label: "Low Stock", value: totals.lowStock ?? 0, color: "#d97706" },
      { label: "Critical Stock", value: totals.criticalStock ?? 0, color: "#dc2626" },
      { label: "Controlled Today", value: totals.controlledDispensesToday ?? 0, color: "#7c3aed" },
      { label: "Formulary", value: totals.formularyItems ?? catalog.length, color: "#2563eb" },
    ];
  }, [catalog.length, dashboard, prescriptions]);

  const openModal = (type: PharmacyModal, row?: any) => {
    if (row) setSelected(row);
    const target = row || selected;
    if (type === "prescription") setPrescriptionForm({
      ...prescriptionDefaults,
      patientId: String(target?.patientId || target?.patient?.id || target?.visit?.patientId || ""),
      visitId: String(target?.visitId || target?.visit?.id || ""),
      doctorId: String(target?.doctorId || target?.doctor?.id || ""),
    });
    if (type === "dispense" && target) {
      setDispenseForm({ ...dispenseDefaults, quantity: String(target.pendingQuantity || target.requestedQuantity || 1) });
    }
    if (type === "formulary") setFormularyForm(formularyDefaults);
    if (type === "return") {
      setReturnForm({
        ...returnDefaults,
        prescriptionId: target?.id || "",
        medicineId: target?.dispenses?.[0]?.medicineId || "",
        quantity: String(target?.dispenses?.[0]?.quantity || ""),
        batchNumber: target?.dispenses?.[0]?.medicine?.batchNumber || "",
        controlledStatus: Boolean(target?.controlledStatus || safety?.controlledStatus),
      });
    }
    if (type === "reconcile") {
      const now = new Date();
      setReconcileForm({ ...reconcileDefaults, monthKey: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}` });
    }
    if (type === "antibiogram") setAntibiogramForm(antibiogramDefaults);
    if (type === "workflow") setWorkflowForm({ ...workflowDefaults });
    setModal(type);
  };

  const runAction = async (label: string, fn: () => Promise<void>) => {
    setSaving(label);
    try {
      await fn();
      await load();
    } catch (error: any) {
      setToast(error?.response?.data?.message || `${label} failed.`);
    } finally {
      setSaving("");
    }
  };

  const savePrescription = (event: FormEvent) => {
    event.preventDefault();
    if (!prescriptionForm.patientId.trim() && !prescriptionForm.visitId.trim()) {
      setToast("Enter a checked-in visit ID or registered patient ID before prescribing.");
      return;
    }
    void runAction("prescription", async () => {
      const res = await api.post("/pharmacy/prescription", prescriptionForm);
      setSelected(res.data || null);
      setModal(null);
      setToast("Prescription created and queued for pharmacist safety verification.");
    });
  };

  const reviewSelected = () => {
    if (!selected) return;
    void runAction("review", async () => {
      await api.patch(`/pharmacy/prescription/${selected.id}/review`, {
        notes: "Pharmacist reviewed CDSS allergy, interaction, dose, formulary, and stewardship checks.",
        allergyFlag: safety?.checks?.allergy?.status !== "PASS",
        interactionFlag: safety?.checks?.interactions?.status !== "PASS",
      });
      setToast("Prescription moved to pharmacist review.");
    });
  };

  const saveDispense = (event: FormEvent) => {
    event.preventDefault();
    if (!selected) return;
    void runAction("dispense", async () => {
      await api.post("/pharmacy/dispense", {
        ...dispenseForm,
        prescriptionId: selected.id,
        quantity: Number(dispenseForm.quantity),
        controlledStatus: Boolean(selected.controlledStatus || safety?.controlledStatus),
      });
      setModal(null);
      setToast("Medication dispensed, stock deducted, billing posted, and register updated where required.");
    });
  };

  const saveFormulary = (event: FormEvent) => {
    event.preventDefault();
    void runAction("formulary", async () => {
      await api.post("/pharmacy/catalog", formularyForm);
      setModal(null);
      setToast("Formulary item saved with stock, SHA, KEML, and control settings.");
    });
  };

  const saveReturn = (event: FormEvent) => {
    event.preventDefault();
    void runAction("return", async () => {
      await api.post("/pharmacy/return", { ...returnForm, quantity: Number(returnForm.quantity) });
      setModal(null);
      setToast("Drug return processed, stock/credit note handled according to return condition.");
    });
  };

  const saveReconcile = (event: FormEvent) => {
    event.preventDefault();
    void runAction("reconcile", async () => {
      await api.post("/pharmacy/controlled-register/reconcile", reconcileForm);
      setModal(null);
      setToast("Controlled drug monthly reconciliation recorded.");
    });
  };

  const saveAntibiogram = (event: FormEvent) => {
    event.preventDefault();
    void runAction("antibiogram", async () => {
      await api.post("/pharmacy/antibiogram", antibiogramForm);
      setModal(null);
      setToast("Antimicrobial stewardship rule saved.");
    });
  };

  const saveWorkflowEvent = (event: FormEvent) => {
    event.preventDefault();
    if (!selected) return;
    void runAction("workflow", async () => {
      await api.post("/pharmacy/workflow-event", { ...workflowForm, prescriptionId: selected.id });
      setModal(null);
      setToast(`Pharmacy ${workflowForm.eventType.toLowerCase()} recorded and audited.`);
    });
  };

  const queuePatient = async (patient: any) => {
    setSaving("queue");
    try {
      const res = await api.post("/opd/queue/token", {
        patientId: patient.id,
        visitId: patient.visitId || undefined,
        departmentId: "PHARMACY",
        queueType: "PHARMACY",
        tokenPrefix: "PHR",
        queueLane: "GENERAL",
        priority: 4,
        source: "pharmacy",
        notes: "Queued from Pharmacy module",
      });
      setWorkflow(null);
      setToast(res.data?.duplicate ? "Patient is already waiting in the Pharmacy queue." : "Patient queued to Pharmacy.");
      window.dispatchEvent(new CustomEvent("hmis:patient-queued", { detail: { patient, destination: { departmentId: "PHARMACY" } } }));
      await load();
    } catch (error: any) {
      setToast(error?.response?.data?.message || "Pharmacy queue request failed.");
    } finally {
      setSaving("");
    }
  };

  const checkInQueuedPatient = async (row: any) => {
    const tokenNumber = String(row?.tokenNumber || "").trim();
    if (!tokenNumber || !row?.patientId) {
      setToast("This waiting-list entry has no queue token or patient identifier.");
      return;
    }
    setSaving("check-in");
    try {
      const checkingOut = statusLabel(row) === "IN_SERVICE";
      await api.patch("/opd/queue/token/status", {
        tokenNumber,
        status: checkingOut ? "COMPLETED" : "IN_SERVICE",
        checkInDate: waitingCheckInDate,
        reason: checkingOut ? "Checked out from Pharmacy waiting list" : "Checked in from Pharmacy waiting list",
      });
      setToast(`${row.patientName || row.patientCode || "Patient"} ${checkingOut ? "checked out from" : "checked in for"} Pharmacy.`);
      await load();
    } catch (error: any) {
      setToast(error?.response?.data?.message || "Pharmacy patient check-in failed.");
    } finally {
      setSaving("");
    }
  };

  const formSubmit =
    modal === "prescription" ? savePrescription :
      modal === "dispense" ? saveDispense :
        modal === "formulary" ? saveFormulary :
            modal === "return" ? saveReturn :
              modal === "reconcile" ? saveReconcile :
              modal === "antibiogram" ? saveAntibiogram : saveWorkflowEvent;

  return (
    <div className="nursing-view pharmacy-view">
      <div className="pv-header">
        <div>
          <h2 className="pv-title">Pharmacy Dispensing Desk</h2>
          <p className="pv-subtitle">Prescription verification, formulary governance, controlled register, returns, stock alerts, and antimicrobial stewardship.</p>
        </div>
        <div className="nursing-header-actions">
          <button type="button" className="pharm-btn pharm-btn-neutral" onClick={() => void load()}><RefreshCw size={15} /> Refresh</button>
          <button type="button" className="pharm-btn pharm-btn-primary" onClick={() => openModal("prescription")}><Pill size={15} /> New Prescription</button>
          <button type="button" className="pharm-btn pharm-btn-info" onClick={() => openModal("formulary")}><BookOpenCheck size={15} /> Formulary</button>
        </div>
      </div>

      {notice ? (
        <div className={`module-notice-toast is-${toneFromMessage(notice)}`} role="status" aria-live="polite">
          <span className="module-notice-icon"><NoticeIcon tone={toneFromMessage(notice)} /></span>
          <div><strong>Pharmacy</strong><span>{notice}</span></div>
          <button type="button" className="module-notice-close" onClick={() => setNotice("")}>×</button>
        </div>
      ) : null}

      {workflow ? (
        <div className="module-form-overlay" onClick={() => setWorkflow(null)}>
          <section className="module-form-panel modal-panel pharmacy-workflow-modal" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
            <div className="module-form-header"><div className="module-form-heading"><div className="module-form-icon"><Pill size={20} /></div><div><div className="module-form-kicker">Pharmacy workflow</div><h2 className="module-form-title">{workflow === "monitor" ? "Monitor Patient" : workflow === "waiting" ? "Open Waiting List" : "Queue Patient"}</h2></div></div><button type="button" className="modal-close-btn" onClick={() => setWorkflow(null)}>×</button></div>
            <div className="module-form-body">
              {workflow === "waiting" ? <label className="workflow-waiting-date">Check-in date<input type="date" value={waitingCheckInDate} onChange={(event) => setWaitingCheckInDate(event.target.value)} /></label> : null}
              {workflow === "monitor" ? <div className="lab-workflow-list">{prescriptions.slice(0, 50).map((row) => <button type="button" key={row.id} onClick={() => { setSelected(row); setWorkflow(null); }}><strong>{patientName(row)}</strong><span>{row.medication} · {statusLabel(row)}</span></button>)}{!prescriptions.length ? <p className="pv-empty">No pharmacy patients are currently active.</p> : null}</div> : null}
              {workflow === "waiting" ? <div className="lab-workflow-list">{queueTokens.filter((row) => ["WAITING", "CALLED", "IN_SERVICE", "URGENT", "EMERGENCY", "SKIPPED"].includes(statusLabel(row))).map((row) => <div className="lab-workflow-list-item" key={`queue-${row.tokenId || row.tokenNumber}`}><button type="button" onClick={() => { setSelected(row); setWorkflow(null); }}><strong>{row.patientName || row.patientCode || "Queued patient"}</strong><span>{row.tokenNumber || "Queue token"} · Queued from {row.source || "another module"}</span></button><button type="button" className="patient-search-checkin workflow-waiting-checkin" disabled={saving === "check-in"} onClick={() => void checkInQueuedPatient(row)}>{saving === "check-in" ? "Updating..." : statusLabel(row) === "IN_SERVICE" ? "Check Out" : "Check In"}</button></div>)}{!queueTokens.some((row) => ["WAITING", "CALLED", "IN_SERVICE", "URGENT", "EMERGENCY", "SKIPPED"].includes(statusLabel(row))) ? <p className="pv-empty">No patients are waiting for Pharmacy.</p> : null}</div> : null}
              {workflow === "queue" ? <div className="lab-workflow-list"><p className="workflow-helper-text">Queue mechanics remain owned by Queue Management. Select a registered patient to send them to the Pharmacy queue.</p>{patients.slice(0, 100).map((patient) => <div className="lab-workflow-list-item" key={patient.id}><button type="button" onClick={() => { setPrescriptionForm({ ...prescriptionDefaults, patientId: patient.id }); setWorkflow(null); setModal("prescription"); }}><strong>{[patient.firstName, patient.middleName, patient.lastName].filter(Boolean).join(" ") || "Patient"}</strong><span>{patient.patientCode || patient.mrn || patient.id} · Prescription</span></button><button type="button" className="patient-search-checkin workflow-waiting-checkin" disabled={saving === "queue"} onClick={() => void queuePatient(patient)}>{saving === "queue" ? "Queueing..." : "Queue"}</button></div>)}{!patients.length ? <p className="pv-empty">No registered patients are available.</p> : null}</div> : null}
            </div>
          </section>
        </div>
      ) : null}

      <div className="pv-stats nursing-stats-grid">
        {stats.map((stat) => (
          <article key={stat.label} className="pv-stat-card" style={{ borderLeftColor: stat.color }}>
            <p className="pv-stat-label">{stat.label}</p>
            <p className="pv-stat-value">{loading ? "..." : stat.value}</p>
          </article>
        ))}
      </div>

      <div className="pharmacy-layout">
        <section className="nursing-worklist">
          <div className="pv-search-bar pharmacy-search">
            <div className="pv-search-wrap">
              <Search />
              <input className="pv-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search patient, MRN, drug, prescriber, status..." />
            </div>
            <div className="pharmacy-filter-row">
              <select className="pv-select" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                {["ACTIVE", "ALL", "PRESCRIPTION_CREATED", "PRESCRIBED", "RECEIVED_BY_PHARMACY", "PHARMACIST_REVIEW", "SAFETY_CHECK", "FORMULARY_CHECK", "AVAILABILITY_CHECK", "IN_REVIEW", "PARTIALLY_DISPENSED", "DISPENSED", "LABELLED", "HANDED_OVER", "COMPLETED", "CLARIFICATION_REQUIRED", "OUT_OF_STOCK", "CANCELLED"].map((item) => <option key={item}>{item}</option>)}
              </select>
              <select className="pv-select" value={stockFilter} onChange={(event) => setStockFilter(event.target.value)}>
                {["ALL", "CONTROLLED", "ALERTS"].map((item) => <option key={item}>{item}</option>)}
              </select>
            </div>
          </div>
          <div className="pv-table-wrap">
            <table className="pv-table pharmacy-table">
              <thead><tr><th>Patient</th><th>Drug</th><th>Qty</th><th>Safety</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>
                {loading ? <tr><td colSpan={6} className="pv-empty">Loading prescriptions...</td></tr> : visible.length === 0 ? <tr><td colSpan={6} className="pv-empty">No prescriptions found.</td></tr> : visible.map((row) => {
                  const alerts = Number(row.safety?.allergyFlag ? 1 : 0) + Number((row.safety?.interactionPairs || []).length > 0);
                  return (
                    <tr key={row.id} className={selected?.id === row.id ? "nursing-selected-row" : ""} onClick={() => setSelected(row)}>
                      <td><strong>{patientName(row)}</strong><br /><small>{patientCode(row)}</small></td>
                      <td><strong>{row.medication}</strong><br /><small>{row.dosage} | {row.frequency}</small></td>
                      <td>{row.dispensedQuantity || 0}/{row.requestedQuantity || "-"}</td>
                      <td><span className={`pharm-badge ${alerts ? "is-warning" : "is-ok"}`}>{alerts ? `${alerts} alert` : "Clear"}</span></td>
                      <td><span className="pv-badge">{statusLabel(row)}</span></td>
                      <td><button type="button" className="pharm-mini-btn" onClick={(event) => { event.stopPropagation(); setSelected(row); openModal("dispense", row); }}>Dispense</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="nursing-care-panel">
          <div className="nursing-care-header">
            <div><span>Selected Prescription</span><strong>{selected ? `${patientName(selected)} | ${selected.medication}` : "No prescription selected"}</strong></div>
            <span className="pv-badge">{selected ? statusLabel(selected) : "PHARMACY"}</span>
          </div>
          <div className="nursing-tabs pharmacy-tabs">
            <button type="button" className="pharm-tab is-review" disabled={!selected} onClick={reviewSelected}><ClipboardCheck size={15} /> Review</button>
            <button type="button" className="pharm-tab is-dispense" disabled={!selected} onClick={() => openModal("dispense")}><PackageCheck size={15} /> Dispense</button>
            <button type="button" className="pharm-tab is-return" onClick={() => openModal("return")}><RotateCcw size={15} /> Return</button>
            <button type="button" className="pharm-tab is-register" onClick={() => openModal("reconcile")}><ShieldCheck size={15} /> Reconcile</button>
            <button type="button" className="pharm-tab is-steward" onClick={() => openModal("antibiogram")}><Stethoscope size={15} /> Stewardship</button>
            <button type="button" className="pharm-tab is-review" disabled={!selected} onClick={() => openModal("workflow")}><BadgeCheck size={15} /> Handover / Counsel</button>
          </div>
          <div className="nursing-workspace">
            {selected ? (
              <div className="nursing-clinical-card">
                <h3 className="form-title"><ShieldCheck size={18} /> Three-Layer Verification</h3>
                <div className="pharmacy-safety-grid">
                  <SafetyCard title="Allergy" check={safety?.checks?.allergy} />
                  <SafetyCard title="Interactions" check={safety?.checks?.interactions} />
                  <SafetyCard title="Dose" check={safety?.checks?.dose} />
                  <SafetyCard title="Stewardship" check={safety?.checks?.stewardship} />
                </div>
                {safety && !safety?.formulary?.compliant ? (
                  <div className="pharm-warning-panel">
                    <AlertTriangle size={16} />
                    <span>Non-formulary drug. Suggested equivalent: {safety?.formulary?.suggestedEquivalent?.genericName || safety?.formulary?.suggestedEquivalent?.brandName || "No direct equivalent configured"}.</span>
                  </div>
                ) : null}
                {safety?.controlledStatus ? <div className="pharm-controlled-panel"><Siren size={16} /> Controlled drug: witness and physical balance are required before dispensing.</div> : null}
              </div>
            ) : <div className="pv-empty">Select a prescription from the queue.</div>}
          </div>
        </section>
      </div>

      <div className="pharmacy-bottom-grid">
        <section className="nursing-clinical-card">
          <h3 className="form-title"><PackageCheck size={18} /> Stock Alerts</h3>
          {stockAlertRows.slice(0, 6).map((row: any) => (
            <div key={row.id} className="pharm-stock-item"><strong>{stockName(row)}</strong><span>{row.batchNumber} | {row.quantity} remaining</span></div>
          ))}
          {!stockAlertRows.length ? <p className="pv-empty">No low stock alerts.</p> : null}
        </section>
        <section className="nursing-clinical-card">
          <h3 className="form-title"><ShieldCheck size={18} /> Controlled Register</h3>
          {controlledRegister?.dueAlert ? <div className="pharm-warning-panel"><AlertTriangle size={16} /> Monthly reconciliation is due for {controlledRegister.monthKey}.</div> : null}
          {(controlledRegister?.entries || []).slice(0, 5).map((row: any) => (
            <div key={row.id || row.registerId || row.returnId} className="pharm-register-item"><strong>{row.medicineName || row.type}</strong><span>{row.quantity || "-"} units | Witness: {row.witnessName || "n/a"}</span></div>
          ))}
          {!(controlledRegister?.entries || []).length ? <p className="pv-empty">No controlled register entries yet.</p> : null}
        </section>
        <section className="nursing-clinical-card">
          <h3 className="form-title"><BookOpenCheck size={18} /> Formulary</h3>
          {catalog.slice(0, 5).map((row: any) => (
            <div key={row.code || row.id} className="pharm-register-item"><strong>{row.genericName || row.brandName}</strong><span>{row.strength || row.formulation || "No strength"} | KEML: {row.kenyaEssentialMedicine ? "Yes" : "No"}</span></div>
          ))}
          {!catalog.length ? <p className="pv-empty">No formulary items configured.</p> : null}
        </section>
      </div>

      {modal ? (
        <div className="module-form-overlay" onClick={() => setModal(null)}>
          <form className={`module-form-panel modal-panel pharmacy-modal is-${modal}`} onSubmit={formSubmit} onClick={(event) => event.stopPropagation()}>
            <div className="module-form-header">
              <div className="module-form-heading"><div className="module-form-icon"><Pill size={20} /></div><div><div className="module-form-kicker">Pharmacy</div><h2 className="module-form-title">{modalTitle(modal)}</h2></div></div>
              <button type="button" className="modal-close-btn" onClick={() => setModal(null)}>×</button>
            </div>
            <div className="module-form-body">
              <div className="module-form-grid">
                {modal === "prescription" ? <PrescriptionFields form={prescriptionForm} setForm={setPrescriptionForm} patients={patients} staff={staff} /> : null}
                {modal === "dispense" ? <DispenseFields form={dispenseForm} setForm={setDispenseForm} batches={selectedBatches} staff={staff} controlled={Boolean(selected?.controlledStatus || safety?.controlledStatus)} safety={safety} /> : null}
                {modal === "formulary" ? <FormularyFields form={formularyForm} setForm={setFormularyForm} /> : null}
                {modal === "return" ? <ReturnFields form={returnForm} setForm={setReturnForm} inventory={inventory} staff={staff} /> : null}
                {modal === "reconcile" ? <ReconcileFields form={reconcileForm} setForm={setReconcileForm} /> : null}
                {modal === "antibiogram" ? <AntibiogramFields form={antibiogramForm} setForm={setAntibiogramForm} rules={antibiogram} /> : null}
                {modal === "workflow" ? <WorkflowFields form={workflowForm} setForm={setWorkflowForm} /> : null}
              </div>
              <div className="module-form-footer"><button type="button" className="form-btn form-btn-cancel" onClick={() => setModal(null)}>Cancel</button><button type="submit" className="form-btn form-btn-primary module-form-submit" disabled={Boolean(saving)}><Save size={15} /> {saving ? "Saving..." : "Save"}</button></div>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}

function modalTitle(modal: PharmacyModal) {
  if (modal === "prescription") return "New Prescription";
  if (modal === "dispense") return "Verify and Dispense";
  if (modal === "formulary") return "Drug Formulary Item";
  if (modal === "return") return "Drug Return";
  if (modal === "reconcile") return "Controlled Register Reconciliation";
  return "Antimicrobial Stewardship Rule";
}

function SafetyCard({ title, check }: { title: string; check: any }) {
  const status = String(check?.status || "PENDING");
  const ok = status === "PASS";
  const hard = status === "HARD_STOP";
  return (
    <div className={`pharm-safety-card ${ok ? "is-ok" : hard ? "is-hard" : "is-warning"}`}>
      {ok ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
      <strong>{title}</strong>
      <span>{check?.message || "Checking..."}</span>
    </div>
  );
}

function Field({ label, children, wide = false }: { label: string; children: ReactNode; wide?: boolean }) {
  return <div className={`module-form-field ${wide ? "is-wide" : ""}`}><label className="form-label">{label}</label>{children}</div>;
}

function PrescriptionFields({ form, setForm, patients, staff }: any) {
  return <>
    <Field label="Checked-in visit ID"><input className="module-form-input" value={form.visitId} onChange={(e) => setForm({ ...form, visitId: e.target.value })} /></Field>
    <Field label="Registered patient" wide><select className="module-form-input" value={form.patientId} onChange={(e) => setForm({ ...form, patientId: e.target.value })} required><option value="">Select patient</option>{patients.map((patient: any) => <option key={patient.id} value={patient.id}>{[patient.firstName, patient.middleName, patient.lastName].filter(Boolean).join(" ") || "Patient"} · {patient.patientCode || patient.mrn || patient.id}</option>)}</select></Field>
    <Field label="Prescriber" wide><select className="module-form-input" value={form.doctorId} onChange={(e) => setForm({ ...form, doctorId: e.target.value })}><option value="">Use visit prescriber</option>{staff.map((person: any) => <option key={person.id} value={person.id}>{person.firstName} {person.lastName}{person.jobTitle ? ` · ${person.jobTitle}` : ""}</option>)}</select></Field>
    <Field label="Medication"><input className="module-form-input" value={form.medication} onChange={(e) => setForm({ ...form, medication: e.target.value })} required /></Field>
    <Field label="Dose"><input className="module-form-input" value={form.dosage} onChange={(e) => setForm({ ...form, dosage: e.target.value })} required /></Field>
    <Field label="Frequency"><input className="module-form-input" value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })} required /></Field>
    <Field label="Duration"><input className="module-form-input" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} required /></Field>
    <Field label="Quantity"><input type="number" className="module-form-input" value={form.prescriptionQuantity} onChange={(e) => setForm({ ...form, prescriptionQuantity: e.target.value })} required /></Field>
    <Field label="Controlled"><label className="pharm-check"><input type="checkbox" checked={form.controlledStatus} onChange={(e) => setForm({ ...form, controlledStatus: e.target.checked })} /> Controlled drug</label></Field>
    <Field label="Insurance"><label className="pharm-check"><input type="checkbox" checked={form.insuranceEligible} onChange={(e) => setForm({ ...form, insuranceEligible: e.target.checked })} /> Insurance eligible</label></Field>
    <Field label="Notes" wide><textarea className="module-form-input" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>
  </>;
}

function DispenseFields({ form, setForm, batches, staff, controlled, safety }: any) {
  return <>
    {safety && !safety.canDispense ? <Field label="Safety override justification" wide><textarea className="module-form-input" value={form.safetyOverrideJustification} onChange={(e) => setForm({ ...form, safetyOverrideJustification: e.target.value })} required placeholder="Required because there is a hard-stop safety alert." /></Field> : null}
    <Field label="Inventory batch"><select className="module-form-input" value={form.medicineId} onChange={(e) => setForm({ ...form, medicineId: e.target.value })} required><option value="">Select batch</option>{batches.map((row: any) => <option key={row.id} value={row.id}>{stockName(row)} | {row.batchNumber} | {row.quantity} in stock</option>)}</select></Field>
    <Field label="Quantity"><input type="number" min="1" className="module-form-input" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} required /></Field>
    <Field label="Insurance"><label className="pharm-check"><input type="checkbox" checked={form.insuranceCovered} onChange={(e) => setForm({ ...form, insuranceCovered: e.target.checked })} /> Covered</label></Field>
    <Field label="Payment"><label className="pharm-check"><input type="checkbox" checked={form.markPaid} onChange={(e) => setForm({ ...form, markPaid: e.target.checked })} /> Mark paid</label></Field>
    {controlled ? <>
      <Field label="Witness pharmacist"><select className="module-form-input" value={form.witnessPharmacistId} onChange={(e) => setForm({ ...form, witnessPharmacistId: e.target.value })} required><option value="">Select witness</option>{staff.map((row: any) => <option key={row.id} value={row.id}>{row.firstName} {row.lastName} {row.licenseNumber ? `(${row.licenseNumber})` : ""}</option>)}</select></Field>
      <Field label="Physical balance"><input type="number" className="module-form-input" value={form.physicalBalance} onChange={(e) => setForm({ ...form, physicalBalance: e.target.value })} required /></Field>
    </> : null}
    <Field label="Notes" wide><textarea className="module-form-input" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>
  </>;
}

function FormularyFields({ form, setForm }: any) {
  return <>
    <Field label="Generic name"><input className="module-form-input" value={form.genericName} onChange={(e) => setForm({ ...form, genericName: e.target.value })} required /></Field>
    <Field label="Brand name"><input className="module-form-input" value={form.brandName} onChange={(e) => setForm({ ...form, brandName: e.target.value })} /></Field>
    <Field label="Other brands"><input className="module-form-input" value={form.brandNames} onChange={(e) => setForm({ ...form, brandNames: e.target.value })} /></Field>
    <Field label="Formulation"><input className="module-form-input" value={form.formulation} onChange={(e) => setForm({ ...form, formulation: e.target.value })} /></Field>
    <Field label="Strength"><input className="module-form-input" value={form.strength} onChange={(e) => setForm({ ...form, strength: e.target.value })} /></Field>
    <Field label="ATC code"><input className="module-form-input" value={form.atcCode} onChange={(e) => setForm({ ...form, atcCode: e.target.value })} /></Field>
    <Field label="Classification"><input className="module-form-input" value={form.classification} onChange={(e) => setForm({ ...form, classification: e.target.value })} /></Field>
    <Field label="Minimum stock"><input type="number" className="module-form-input" value={form.minimumStockLevel} onChange={(e) => setForm({ ...form, minimumStockLevel: e.target.value })} /></Field>
    <Field label="Critical stock"><input type="number" className="module-form-input" value={form.criticalLevel} onChange={(e) => setForm({ ...form, criticalLevel: e.target.value })} /></Field>
    <Field label="Selling price"><input type="number" className="module-form-input" value={form.sellingPrice} onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })} /></Field>
    <Field label="SHA rate"><input type="number" className="module-form-input" value={form.nhifRate} onChange={(e) => setForm({ ...form, nhifRate: e.target.value })} /></Field>
    <Field label="Control"><label className="pharm-check"><input type="checkbox" checked={form.controlledStatus} onChange={(e) => setForm({ ...form, controlledStatus: e.target.checked })} /> Controlled substance</label></Field>
    <Field label="KEML"><label className="pharm-check"><input type="checkbox" checked={form.kenyaEssentialMedicine} onChange={(e) => setForm({ ...form, kenyaEssentialMedicine: e.target.checked })} /> Kenya Essential Medicines List</label></Field>
  </>;
}

function ReturnFields({ form, setForm, inventory, staff }: any) {
  return <>
    <Field label="Prescription ID"><input className="module-form-input" value={form.prescriptionId} onChange={(e) => setForm({ ...form, prescriptionId: e.target.value })} /></Field>
    <Field label="Medicine batch"><select className="module-form-input" value={form.medicineId} onChange={(e) => setForm({ ...form, medicineId: e.target.value })} required><option value="">Select batch</option>{inventory.map((row: any) => <option key={row.id} value={row.id}>{stockName(row)} | {row.batchNumber}</option>)}</select></Field>
    <Field label="Quantity"><input type="number" min="1" className="module-form-input" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} required /></Field>
    <Field label="Reason"><input className="module-form-input" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} required /></Field>
    <Field label="Condition"><label className="pharm-check"><input type="checkbox" checked={form.resaleable} onChange={(e) => setForm({ ...form, resaleable: e.target.checked })} /> Sealed and resaleable</label></Field>
    <Field label="Controlled"><label className="pharm-check"><input type="checkbox" checked={form.controlledStatus} onChange={(e) => setForm({ ...form, controlledStatus: e.target.checked })} /> Controlled return</label></Field>
    {form.controlledStatus ? <>
      <Field label="Witness pharmacist"><select className="module-form-input" value={form.witnessPharmacistId} onChange={(e) => setForm({ ...form, witnessPharmacistId: e.target.value })} required><option value="">Select witness</option>{staff.map((row: any) => <option key={row.id} value={row.id}>{row.firstName} {row.lastName}</option>)}</select></Field>
      <Field label="Physical balance"><input type="number" className="module-form-input" value={form.physicalBalance} onChange={(e) => setForm({ ...form, physicalBalance: e.target.value })} required /></Field>
    </> : null}
    <Field label="Notes" wide><textarea className="module-form-input" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>
  </>;
}

function ReconcileFields({ form, setForm }: any) {
  return <>
    <Field label="Month"><input className="module-form-input" value={form.monthKey} onChange={(e) => setForm({ ...form, monthKey: e.target.value })} required /></Field>
    <Field label="Medicine"><input className="module-form-input" value={form.medicineName} onChange={(e) => setForm({ ...form, medicineName: e.target.value })} placeholder="ALL_CONTROLLED_DRUGS" /></Field>
    <Field label="System balance"><input type="number" className="module-form-input" value={form.systemBalance} onChange={(e) => setForm({ ...form, systemBalance: e.target.value })} required /></Field>
    <Field label="Physical balance"><input type="number" className="module-form-input" value={form.physicalBalance} onChange={(e) => setForm({ ...form, physicalBalance: e.target.value })} required /></Field>
    <Field label="Notes" wide><textarea className="module-form-input" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>
  </>;
}

function AntibiogramFields({ form, setForm, rules }: any) {
  return <>
    <Field label="Organism"><input className="module-form-input" value={form.organism} onChange={(e) => setForm({ ...form, organism: e.target.value })} /></Field>
    <Field label="Antibiotic"><input className="module-form-input" value={form.antibiotic} onChange={(e) => setForm({ ...form, antibiotic: e.target.value })} required /></Field>
    <Field label="Resistance %"><input type="number" className="module-form-input" value={form.resistanceRate} onChange={(e) => setForm({ ...form, resistanceRate: e.target.value })} required /></Field>
    <Field label="Sensitivity %"><input type="number" className="module-form-input" value={form.sensitivityRate} onChange={(e) => setForm({ ...form, sensitivityRate: e.target.value })} /></Field>
    <Field label="Preferred alternative"><input className="module-form-input" value={form.preferredAlternative} onChange={(e) => setForm({ ...form, preferredAlternative: e.target.value })} /></Field>
    <Field label="Configured rules" wide><div className="pharm-rules-preview">{rules.slice(0, 4).map((row: any) => <span key={row.ruleId || row.id}>{row.antibiotic}: {row.resistanceRate}% resistance</span>)}{!rules.length ? <span>No rules configured.</span> : null}</div></Field>
  </>;
}

function WorkflowFields({ form, setForm }: any) {
  return <>
    <Field label="Pharmacy action"><select className="module-form-input" value={form.eventType} onChange={(e) => setForm({ ...form, eventType: e.target.value })}><option>INTERVENTION</option><option>CLARIFICATION</option><option>HANDOVER</option><option>COUNSELLING</option><option>WASTAGE</option><option>SUBSTITUTION</option><option>RECALL</option></select></Field>
    <Field label="Recipient / prescriber"><input className="module-form-input" value={form.recipient} onChange={(e) => setForm({ ...form, recipient: e.target.value })} placeholder="Prescriber, patient or caregiver" /></Field>
    <Field label="Reason" wide><input className="module-form-input" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} required placeholder="Document the clinical or operational reason" /></Field>
    <Field label="Notes" wide><textarea className="module-form-input" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} required /></Field>
    <Field label="Acknowledged"><label className="pharm-check"><input type="checkbox" checked={form.acknowledged} onChange={(e) => setForm({ ...form, acknowledged: e.target.checked })} /> Patient/caregiver or prescriber acknowledgement recorded</label></Field>
  </>;
}

function NoticeIcon({ tone }: { tone: string }) {
  if (tone === "error" || tone === "warning") return <AlertTriangle size={19} strokeWidth={2.4} />;
  if (tone === "info") return <ShieldCheck size={19} strokeWidth={2.4} />;
  return <CheckCircle2 size={19} strokeWidth={2.4} />;
}
