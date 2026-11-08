import type { ReactNode } from "react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Barcode,
  CheckCircle2,
  ClipboardCheck,
  FlaskConical,
  PlayCircle,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  TestTube2,
  XCircle,
} from "lucide-react";
import { api } from "../lib/api";
import { useLiveRefresh } from "../lib/liveRefresh";
import { ModuleReferenceForms } from "../components/ModuleReferenceForms";

type LabModal = "collect" | "result" | "verify" | "reject" | "qc" | "barcode" | "catalog" | null;
type LabWorkflow = "monitor" | "waiting" | "queue" | null;

const priorityRank: Record<string, number> = { STAT: 0, URGENT: 1, ROUTINE: 2 };
const targetMinutes: Record<string, number> = { STAT: 60, URGENT: 240, ROUTINE: 1440 };
const lifecycleStages = [
  "ORDERED", "ORDER_RECEIVED", "ORDER_ACCEPTED", "COLLECTION_PENDING", "SAMPLE_COLLECTED",
  "SPECIMEN_RECEIVED", "ACCESSIONED", "PROCESSING", "ANALYSIS", "RESULT_PENDING", "IN_PROCESS",
  "RESULT_ENTERED", "TECHNICAL_VERIFICATION", "AUTHORISATION", "VERIFIED", "RESULT_RELEASED",
  "RELEASED", "CLINICAL_REVIEW", "CLOSED",
];

const collectDefaults = {
  sampleType: "",
  sampleCondition: "ACCEPTABLE",
  storageLocation: "",
  collectionTime: "",
  notes: "",
};

const resultDefaults = {
  measuredValue: "",
  unit: "",
  referenceRange: "",
  resultFlag: "NORMAL",
  interpretationNotes: "",
  rawResult: "",
  criticalResult: false,
  doctorNotified: "",
};

const rejectDefaults = {
  reason: "Haemolysed specimen",
  barcode: "",
  notes: "",
};

const qcDefaults = {
  analyserName: "General analyser",
  testName: "General test",
  qcLevel: "NORMAL",
  expectedValue: "",
  measuredValue: "",
  sdDeviation: "",
  westgardRuleViolated: "",
  actionTaken: "",
};

const barcodeDefaults = {
  barcode: "",
  stage: "RECEIPT",
  notes: "",
};

const catalogDefaults = {
  testCode: "",
  testName: "",
  category: "Haematology",
  sampleType: "",
  referenceRange: "",
  unit: "",
  price: "",
  turnaroundHours: "",
};

const unwrapRows = (value: any) => {
  const data = value?.data ?? value;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  return [];
};

const statusLabel = (value: any) => String(value?.normalizedStatus || value?.status || "ORDERED").toUpperCase();
const priorityLabel = (row: any) => String(row?.priority || "ROUTINE").toUpperCase();
const patientName = (row: any) =>
  [row?.visit?.patient?.firstName, row?.visit?.patient?.middleName, row?.visit?.patient?.lastName]
    .filter(Boolean)
    .join(" ")
    .trim() || row?.patientName || "Patient";
const patientCode = (row: any) => row?.visit?.patient?.patientCode || row?.visit?.patient?.mrn || row?.patientCode || row?.patientId || "-";
const doctorName = (row: any) => [row?.doctor?.firstName, row?.doctor?.lastName].filter(Boolean).join(" ") || row?.orderedBy || "-";
const sampleId = (row: any) => row?.sample?.sampleId || `SMP-${new Date().getFullYear()}-${String(row?.id || "").slice(0, 8).toUpperCase()}`;
const minutesWaiting = (row: any) => {
  const created = Date.parse(String(row?.createdAt || ""));
  if (!Number.isFinite(created)) return 0;
  return Math.max(0, Math.floor((Date.now() - created) / 60000));
};
const waitTone = (row: any) => {
  const priority = priorityLabel(row);
  const target = targetMinutes[priority] || targetMinutes.ROUTINE;
  const waited = minutesWaiting(row);
  if (waited > target) return "red";
  if (waited > target * 0.75) return "yellow";
  return "green";
};
const waitText = (mins: number) => (mins < 60 ? `${mins} min` : `${Math.floor(mins / 60)}h ${mins % 60}m`);
const lifecycleIndex = (status: string) => Math.max(0, lifecycleStages.indexOf(status));

const parseRange = (range: string) => {
  const matches = String(range || "").match(/-?\d+(\.\d+)?/g);
  if (!matches || matches.length < 2) return null;
  const low = Number(matches[0]);
  const high = Number(matches[1]);
  return Number.isFinite(low) && Number.isFinite(high) ? { low, high } : null;
};

const autoFlag = (value: string, range: string) => {
  const numeric = Number(value);
  const parsed = parseRange(range);
  if (!Number.isFinite(numeric) || !parsed) return "NORMAL";
  if (numeric < parsed.low || numeric > parsed.high) return "ABNORMAL";
  return "NORMAL";
};

const noticeTone = (message: string) => {
  const text = message.toLowerCase();
  if (text.includes("failed") || text.includes("rejected") || text.includes("critical") || text.includes("qc failed")) return "error";
  if (text.includes("warning") || text.includes("repeat qc") || text.includes("overdue")) return "warning";
  return "success";
};

export default function LaboratoryView() {
  const [requests, setRequests] = useState<any[]>([]);
  const [queueTokens, setQueueTokens] = useState<any[]>([]);
  const [dashboard, setDashboard] = useState<any>({});
  const [qcRows, setQcRows] = useState<any[]>([]);
  const [catalog, setCatalog] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ACTIVE");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [selected, setSelected] = useState<any | null>(null);
  const [modal, setModal] = useState<LabModal>(null);
  const [collectForm, setCollectForm] = useState(collectDefaults);
  const [resultForm, setResultForm] = useState(resultDefaults);
  const [rejectForm, setRejectForm] = useState(rejectDefaults);
  const [qcForm, setQcForm] = useState(qcDefaults);
  const [barcodeForm, setBarcodeForm] = useState(barcodeDefaults);
  const [catalogForm, setCatalogForm] = useState(catalogDefaults);
  const [verifyNotes, setVerifyNotes] = useState("");
  const [releaseNow, setReleaseNow] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");
  const [notice, setNotice] = useState("");
  const [workflow, setWorkflow] = useState<LabWorkflow>(null);
  const [queueRequestId, setQueueRequestId] = useState("");
  const [waitingCheckInDate, setWaitingCheckInDate] = useState(() => new Date().toISOString().slice(0, 10));

  const load = async () => {
    setLoading(true);
    try {
      const [requestsRes, dashboardRes, qcRes, catalogRes, queueRes] = await Promise.all([
        api.get("/laboratory/requests").catch(() => ({ data: [] })),
        api.get("/laboratory/dashboard").catch(() => ({ data: {} })),
        api.get("/laboratory/quality-control").catch(() => ({ data: [] })),
        api.get("/laboratory/catalog").catch(() => ({ data: [] })),
        api.get("/opd/queue/board", { params: { departmentId: "LABORATORY" } }).catch(() => ({ data: {} })),
      ]);
      const rows = unwrapRows(requestsRes.data);
      setRequests(rows);
      setDashboard(dashboardRes.data || {});
      setQcRows(unwrapRows(qcRes.data));
      setCatalog(unwrapRows(catalogRes.data));
      const queuePayload = queueRes.data?.data || queueRes.data || {};
      setQueueTokens(Array.isArray(queuePayload?.tokens) ? queuePayload.tokens : []);
      setSelected((current: any) => (current && rows.some((row: any) => row.id === current.id) ? rows.find((row: any) => row.id === current.id) : rows[0] || null));
    } catch (error: any) {
      setNotice(error?.response?.data?.message || "Laboratory data could not be loaded.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    const onSidebarAction = (event: Event) => {
      const action = (event as CustomEvent<{ action?: string }>).detail?.action;
      if (action === "monitor-patient") {
        setSelected((current: any | null) => current || requests[0] || null);
        setWorkflow("monitor");
      }
      if (action === "queue-patient") setWorkflow("queue");
    };
    const onWaitingList = () => setWorkflow("waiting");
    const onPatientQueued = () => void load();
    window.addEventListener("hmis:lab-sidebar-action", onSidebarAction);
    window.addEventListener("hmis:open-module-waiting-list", onWaitingList);
    window.addEventListener("hmis:patient-queued", onPatientQueued);
    return () => {
      window.removeEventListener("hmis:lab-sidebar-action", onSidebarAction);
      window.removeEventListener("hmis:open-module-waiting-list", onWaitingList);
      window.removeEventListener("hmis:patient-queued", onPatientQueued);
    };
  }, [requests]);

  useLiveRefresh(load, { intervalMs: 45000 });

  const latestQc = qcRows[0] || null;
  const qcFailed = latestQc && latestQc.passed === false;
  const selectedStatus = selected ? statusLabel(selected) : "";
  const isQueueOnlyPatient = Boolean(selected?.isQueueToken);
  const canClaim = Boolean(selected && !isQueueOnlyPatient && ["ORDERED", "ORDER_RECEIVED", "ORDER_ACCEPTED", "COLLECTION_PENDING", "SAMPLE_COLLECTED"].includes(selectedStatus));
  const canCollect = Boolean(selected && !isQueueOnlyPatient && ["ORDERED", "ORDER_RECEIVED", "ORDER_ACCEPTED", "COLLECTION_PENDING"].includes(selectedStatus));
  const canScan = Boolean(selected && !isQueueOnlyPatient && !["CANCELLED", "CLOSED"].includes(selectedStatus));
  const canEnterResult = Boolean(selected && !isQueueOnlyPatient && ["ORDERED", "SAMPLE_COLLECTED", "SPECIMEN_RECEIVED", "ACCESSIONED", "PROCESSING", "ANALYSIS", "RESULT_PENDING", "IN_PROCESS"].includes(selectedStatus));
  const canVerify = Boolean(selected && !isQueueOnlyPatient && selectedStatus === "RESULT_ENTERED" && !qcFailed);
  const canReject = Boolean(selected && !isQueueOnlyPatient && ["ORDERED", "ORDER_RECEIVED", "ORDER_ACCEPTED", "COLLECTION_PENDING", "SAMPLE_COLLECTED", "IN_PROCESS", "RESULT_ENTERED"].includes(selectedStatus));

  const visibleRequests = useMemo(() => {
    const activeStatuses = new Set(lifecycleStages.filter((stage) => !["CLOSED"].includes(stage)).concat(["REJECTED", "SPECIMEN_REJECTED", "RECOLLECTION_REQUIRED", "PARTIALLY_COMPLETED", "WAITING", "CALLED", "IN_SERVICE", "URGENT", "EMERGENCY", "SKIPPED"]));
    const q = search.trim().toLowerCase();
    const queuedRows = queueTokens.map((row) => ({
      ...row,
      id: `queue-${row.tokenId || row.tokenNumber}`,
      isQueueToken: true,
      testName: "Laboratory queue intake",
      source: row.source || "OPD",
    }));
    return [...requests, ...queuedRows]
      .filter((row) => {
        const status = statusLabel(row);
        if (statusFilter === "ACTIVE" && !activeStatuses.has(status)) return false;
        if (statusFilter !== "ACTIVE" && statusFilter !== "ALL" && status !== statusFilter) return false;
        if (priorityFilter !== "ALL" && priorityLabel(row) !== priorityFilter) return false;
        const haystack = [patientName(row), patientCode(row), row?.testName, row?.testCode, status, priorityLabel(row), sampleId(row)].join(" ").toLowerCase();
        return !q || haystack.includes(q);
      })
      .sort((a, b) => {
        const rank = (priorityRank[priorityLabel(a)] ?? 9) - (priorityRank[priorityLabel(b)] ?? 9);
        if (rank !== 0) return rank;
        return minutesWaiting(b) - minutesWaiting(a);
      });
  }, [priorityFilter, queueTokens, requests, search, statusFilter]);

  const stats = useMemo(() => {
    const totals = dashboard?.totals || {};
    return [
      { label: "Pending Orders", value: totals.ordered ?? requests.filter((row) => statusLabel(row) === "ORDERED").length, color: "#1e3a8a" },
      { label: "Collected", value: totals.sampleCollected ?? requests.filter((row) => statusLabel(row) === "SAMPLE_COLLECTED").length, color: "#0d9488" },
      { label: "Verification", value: totals.resultEntered ?? requests.filter((row) => statusLabel(row) === "RESULT_ENTERED").length, color: "#f59e0b" },
      { label: "Critical", value: totals.criticalResults ?? requests.filter((row) => row?.criticalResult).length, color: "#dc2626" },
      { label: "QC Status", value: qcFailed ? "FAIL" : "PASS", color: qcFailed ? "#dc2626" : "#16a34a" },
    ];
  }, [dashboard, qcFailed, requests]);

  const setToast = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice((current) => (current === message ? "" : current)), 5000);
  };

  const openModal = (type: LabModal, row?: any) => {
    if (row) setSelected(row);
    const target = row || selected;
    if (type === "collect" && target) setCollectForm({ ...collectDefaults, sampleType: target.sampleType || "", collectionTime: new Date().toISOString().slice(0, 16) });
    if (type === "result" && target) setResultForm({ ...resultDefaults, unit: target?.latestResultPayload?.unit || "", referenceRange: target?.latestResultPayload?.referenceRange || target?.referenceRange || "" });
    if (type === "reject" && target) setRejectForm({ ...rejectDefaults, barcode: sampleId(target) });
    if (type === "barcode" && target) setBarcodeForm({ ...barcodeDefaults, barcode: sampleId(target) });
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

  const claimOrder = (row: any) =>
    runAction("claim", async () => {
      await api.post(`/laboratory/request/${row.id}/claim`);
      setToast("Order claimed. Other technicians will see it as in process.");
    });

  const collectSample = (event: FormEvent) => {
    event.preventDefault();
    if (!selected) return;
    void runAction("collect", async () => {
      await api.post(`/laboratory/request/${selected.id}/collect-sample`, collectForm);
      setModal(null);
      setToast("Specimen collected and barcode generated.");
    });
  };

  const scanBarcode = (event: FormEvent) => {
    event.preventDefault();
    if (!selected) return;
    void runAction("barcode", async () => {
      await api.post(`/laboratory/request/${selected.id}/scan-barcode`, barcodeForm);
      setModal(null);
      setToast("Barcode scan accepted and chain of custody updated.");
    });
  };

  const saveResult = (event: FormEvent) => {
    event.preventDefault();
    if (!selected) return;
    const flag = resultForm.resultFlag || autoFlag(resultForm.measuredValue, resultForm.referenceRange);
    const critical = resultForm.criticalResult || flag === "CRITICAL";
    if (critical && !resultForm.doctorNotified.trim()) {
      setToast("Critical result requires doctor notification documentation before saving.");
      return;
    }
    void runAction("result", async () => {
      await api.post("/laboratory/result", {
        ...resultForm,
        resultFlag: flag,
        criticalResult: critical,
        interpretationNotes: [resultForm.interpretationNotes, resultForm.doctorNotified ? `Doctor notified: ${resultForm.doctorNotified}` : ""].filter(Boolean).join(" | "),
        requestId: selected.id,
      });
      setModal(null);
      setToast("Result entered and sent to verification queue.");
    });
  };

  const verifyOrRelease = (event: FormEvent) => {
    event.preventDefault();
    if (!selected) return;
    if (qcFailed) {
      setToast(`QC failed (${latestQc?.westgardRuleViolated || "Westgard rule"}). Repeat QC before authorising results.`);
      return;
    }
    void runAction("verify", async () => {
      await api.post("/laboratory/result/verify", {
        requestId: selected.id,
        resultId: selected?.results?.[0]?.id,
        verificationNotes: verifyNotes,
        releaseNow,
      });
      setModal(null);
      setToast(releaseNow ? "Result verified and released to EMR." : "Result verified.");
    });
  };

  const rejectSpecimen = (event: FormEvent) => {
    event.preventDefault();
    if (!selected) return;
    void runAction("reject", async () => {
      await api.post(`/laboratory/request/${selected.id}/reject-specimen`, rejectForm);
      setModal(null);
      setToast("Specimen rejected, charge reversed if posted, and repeat collection notification sent.");
    });
  };

  const recordQc = (event: FormEvent) => {
    event.preventDefault();
    void runAction("qc", async () => {
      await api.post("/laboratory/quality-control", qcForm);
      setModal(null);
      setToast(qcForm.westgardRuleViolated || Number(qcForm.sdDeviation || 0) >= 2 ? "QC recorded. Review Westgard alert before authorising results." : "QC passed and analyser is available.");
    });
  };

  const saveCatalogItem = (event: FormEvent) => {
    event.preventDefault();
    void runAction("catalog", async () => {
      await api.post("/laboratory/catalog", { ...catalogForm, price: catalogForm.price ? Number(catalogForm.price) : 0, turnaroundHours: catalogForm.turnaroundHours ? Number(catalogForm.turnaroundHours) : 0 });
      setCatalogForm(catalogDefaults);
      setModal(null);
      setToast("Laboratory test catalogue item saved.");
    });
  };

  const removeCatalogItem = (item: any) => {
    if (!window.confirm(`Remove ${item?.testName || item?.testCode} from the catalogue?`)) return;
    void runAction("catalog-delete", async () => {
      await api.delete(`/laboratory/catalog/${encodeURIComponent(item.testCode)}`);
      setToast("Catalogue item removed.");
    });
  };

  const queueLabRequest = (event: FormEvent) => {
    event.preventDefault();
    if (!queueRequestId) return;
    void runAction("queue", async () => {
      await api.patch(`/laboratory/request/${queueRequestId}/status`, { status: "ORDER_RECEIVED" });
      setWorkflow(null);
      setToast("Patient laboratory request added to the laboratory queue.");
    });
  };

  const checkInQueuedPatient = async (row: any) => {
    const tokenNumber = String(row?.tokenNumber || "").trim();
    const patientId = String(row?.patientId || "").trim();
    if (!tokenNumber || !patientId) {
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
        reason: checkingOut ? "Checked out from Laboratory waiting list" : "Checked in from Laboratory waiting list",
      });
      if (checkingOut) {
        const states = JSON.parse(window.localStorage.getItem("hmis_patient_module_states") || "{}");
        delete states.lab;
        window.localStorage.setItem("hmis_patient_module_states", JSON.stringify(states));
        window.dispatchEvent(new CustomEvent("hmis:patient-module-state", { detail: { moduleKey: "lab", state: {} } }));
        setToast(`${row.patientName || row.patientCode || "Patient"} checked out from Laboratory.`);
        await load();
        return;
      }
      const patient = {
        id: patientId,
        patientId,
        patientName: row.patientName || row.patientCode || "Queued patient",
        patientCode: row.patientCode || row.mrn || "",
        queueModule: "LABORATORY",
        hasCheckedInPatient: true,
        isQueued: false,
        checkInDate: waitingCheckInDate,
      };
      const states = JSON.parse(window.localStorage.getItem("hmis_patient_module_states") || "{}");
      states.lab = patient;
      window.localStorage.setItem("hmis_patient_module_states", JSON.stringify(states));
      window.dispatchEvent(new CustomEvent("hmis:patient-module-state", { detail: { moduleKey: "lab", state: patient } }));
      setWorkflow(null);
      setToast(`${patient.patientName} checked in for ${waitingCheckInDate}.`);
      await load();
    } catch (error: any) {
      setToast(error?.response?.data?.message || "Laboratory patient check-in failed.");
    } finally {
      setSaving("");
    }
  };

  return (
    <div className="nursing-view lab-view">
      <div className="pv-header">
        <div>
          <h2 className="pv-title">Lab Services Terminal</h2>
          <p className="pv-subtitle">Priority worklist, barcode custody, analyser verification, QC, and specimen rejection.</p>
        </div>
        <div className="nursing-header-actions">
          <button type="button" className="nursing-secondary-btn" onClick={() => void load()}><RefreshCw size={15} /> Refresh</button>
          <button type="button" className="lab-action-btn is-qc" onClick={() => openModal("qc")}><ShieldCheck size={15} /> Quality Control</button>
          <button type="button" className="lab-action-btn is-catalog" onClick={() => setModal("catalog")}><ClipboardCheck size={15} /> Test Catalogue</button>
          <ModuleReferenceForms moduleKey="lab" moduleTitle="Lab Services Terminal" onSaved={load} />
        </div>
      </div>

      {notice ? (
        <div className={`module-notice-toast is-${noticeTone(notice)}`} role="status" aria-live="polite">
          <div><strong>Laboratory</strong><span>{notice}</span></div>
          <button type="button" className="module-notice-close" onClick={() => setNotice("")}>×</button>
        </div>
      ) : null}

      {workflow ? (
        <div className="module-form-overlay" onClick={() => setWorkflow(null)}>
          <section className="module-form-panel modal-panel lab-workflow-modal" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
            <div className="module-form-header"><div className="module-form-heading"><div className="module-form-icon"><ClipboardCheck size={20} /></div><div><div className="module-form-kicker">Laboratory workflow</div><h2 className="module-form-title">{workflow === "monitor" ? "Monitor Patient" : workflow === "waiting" ? "Open Waiting List" : "Queue Patient"}</h2></div></div><button type="button" className="modal-close-btn" onClick={() => setWorkflow(null)}>×</button></div>
            <div className="module-form-body">
              {workflow === "waiting" ? <label className="workflow-waiting-date">Check-in date<input type="date" value={waitingCheckInDate} onChange={(event) => setWaitingCheckInDate(event.target.value)} /></label> : null}
              {workflow === "monitor" ? <div className="lab-workflow-list">{visibleRequests.slice(0, 50).map((row) => <button type="button" key={row.id} onClick={() => { setSelected(row); setWorkflow(null); }}><strong>{patientName(row)}</strong><span>{row.testName || "Lab test"} · {statusLabel(row)}</span></button>)}{!visibleRequests.length ? <p className="pv-empty">No laboratory patients are currently active.</p> : null}</div> : null}
              {workflow === "waiting" ? <div className="lab-workflow-list">
                {requests.filter((row) => ["ORDERED", "ORDER_RECEIVED", "ORDER_ACCEPTED", "COLLECTION_PENDING"].includes(statusLabel(row))).slice(0, 100).map((row) => <button type="button" key={`request-${row.id}`} onClick={() => { setSelected(row); setWorkflow(null); }}><strong>{patientName(row)}</strong><span>{row.testName || "Lab test"} · {priorityLabel(row)} · {statusLabel(row)}</span></button>)}
                {queueTokens.filter((row) => ["WAITING", "CALLED", "IN_SERVICE", "URGENT", "EMERGENCY", "SKIPPED"].includes(statusLabel(row))).slice(0, 100).map((row) => <div className="lab-workflow-list-item" key={`queue-${row.tokenId || row.tokenNumber}`}><button type="button" onClick={() => { setSelected({ ...row, id: `queue-${row.tokenId || row.tokenNumber}`, isQueueToken: true, testName: "Laboratory queue intake" }); }}><strong>{row.patientName || row.patientCode || "Queued patient"}</strong><span>{row.tokenNumber || "Queue token"} · Queued from {row.source || "OPD"} · {statusLabel(row)}</span></button><button type="button" className="patient-search-checkin workflow-waiting-checkin" disabled={saving === "check-in"} onClick={() => void checkInQueuedPatient(row)}>{saving === "check-in" ? "Updating..." : statusLabel(row) === "IN_SERVICE" ? "Check Out" : "Check In"}</button></div>)}
                {!requests.some((row) => ["ORDERED", "ORDER_RECEIVED", "ORDER_ACCEPTED", "COLLECTION_PENDING"].includes(statusLabel(row))) && !queueTokens.some((row) => ["WAITING", "CALLED", "IN_SERVICE", "URGENT", "EMERGENCY", "SKIPPED"].includes(statusLabel(row))) ? <p className="pv-empty">No patients are waiting for the laboratory.</p> : null}
              </div> : null}
              {workflow === "queue" ? <form onSubmit={queueLabRequest} className="lab-workflow-form"><label className="form-label">Laboratory request<select className="module-form-input" value={queueRequestId} onChange={(event) => setQueueRequestId(event.target.value)} required><option value="">Select a patient request</option>{requests.filter((row) => statusLabel(row) === "ORDERED").map((row) => <option key={row.id} value={row.id}>{patientName(row)} · {row.testName || "Lab test"}</option>)}</select></label><div className="module-form-footer"><button type="button" className="form-btn form-btn-cancel" onClick={() => setWorkflow(null)}>Cancel</button><button type="submit" className="form-btn form-btn-primary module-form-submit" disabled={Boolean(saving)}>Queue Patient</button></div></form> : null}
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

      <div className="lab-layout">
        <section className="nursing-worklist">
          <div className="pv-search-bar">
            <div className="pv-search-wrap">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input className="pv-search" placeholder="Search patient, MRN, barcode, test..." value={search} onChange={(event) => setSearch(event.target.value)} />
            </div>
            <div className="lab-filter-row">
              <select className="pv-select" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                {["ACTIVE", "ALL", ...lifecycleStages, "WAITING", "CALLED", "IN_SERVICE", "URGENT", "EMERGENCY", "SKIPPED", "REJECTED", "SPECIMEN_REJECTED", "INSUFFICIENT_SAMPLE", "NOT_COLLECTED", "PATIENT_REFUSED", "EXPIRED", "FAILED", "REFERRED_OUT", "PARTIALLY_COMPLETED", "RECOLLECTION_REQUIRED", "AMENDED", "CANCELLED"].filter((item, index, values) => values.indexOf(item) === index).map((item) => <option key={item} value={item}>{item.replace(/_/g, " ")}</option>)}
              </select>
              <select className="pv-select" value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)}>
                {["ALL", "STAT", "URGENT", "ROUTINE"].map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </div>
          </div>

          <div className="pv-table-wrap">
            <table className="pv-table">
              <thead>
                <tr>
                  <th>Priority</th>
                  <th>Patient</th>
                  <th>Test</th>
                  <th>Wait</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="pv-empty">Loading lab worklist...</td></tr>
                ) : visibleRequests.length === 0 ? (
                  <tr><td colSpan={5} className="pv-empty">No lab orders found.</td></tr>
                ) : visibleRequests.map((row) => (
                  <tr key={row.id} className={selected?.id === row.id ? "nursing-selected-row" : ""} onClick={() => setSelected(row)}>
                    <td><span className={`lab-priority is-${priorityLabel(row).toLowerCase()}`}>{priorityLabel(row)}</span></td>
                    <td><strong>{patientName(row)}</strong><br /><small>{patientCode(row)}</small></td>
                    <td>{row.testName || "Lab Test"}<br /><small>{sampleId(row)}</small></td>
                    <td><span className={`lab-wait is-${waitTone(row)}`}>{waitText(minutesWaiting(row))}</span></td>
                    <td><span className="pv-badge">{statusLabel(row)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="nursing-care-panel">
          <div className="nursing-care-header">
            <div>
              <span>Selected Order</span>
              <strong>{selected ? `${patientName(selected)} | ${selected.testName}` : "No order selected"}</strong>
            </div>
            <span className="pv-badge">{selected ? statusLabel(selected) : "LAB"}</span>
          </div>
          <div className="nursing-tabs lab-tabs">
            <button type="button" disabled={!canClaim} onClick={() => selected && claimOrder(selected)}><PlayCircle size={15} /> Claim</button>
            <button type="button" disabled={!canCollect} onClick={() => openModal("collect")}><TestTube2 size={15} /> Collect</button>
            <button type="button" disabled={!canScan} onClick={() => openModal("barcode")}><Barcode size={15} /> Scan</button>
            <button type="button" disabled={!canEnterResult} onClick={() => openModal("result")}><FlaskConical size={15} /> Result</button>
            <button type="button" disabled={!canVerify} onClick={() => openModal("verify")}><ClipboardCheck size={15} /> Verify / Release</button>
            <button type="button" disabled={!canReject} onClick={() => openModal("reject")}><XCircle size={15} /> Reject</button>
          </div>
          <div className="nursing-workspace">
            {selected ? (
              <div className="nursing-clinical-card">
                <h3 className="form-title"><FlaskConical size={18} /> Order Detail</h3>
                <div className="lab-detail-grid">
                  <span><strong>Patient</strong>{patientName(selected)} ({patientCode(selected)})</span>
                  <span><strong>Test</strong>{selected.testName || "-"}</span>
                  <span><strong>Priority</strong>{priorityLabel(selected)}</span>
                  <span><strong>Ordered by</strong>{doctorName(selected)}</span>
                  <span><strong>Barcode</strong>{sampleId(selected)}</span>
                  <span><strong>Sample</strong>{selected.sample?.sampleType || selected.sampleType || "Not collected"}</span>
                </div>
                <div className="lab-lifecycle" aria-label="Laboratory order lifecycle">
                  <h4>Order lifecycle</h4>
                  <div className="lab-lifecycle-track">
                    {lifecycleStages.map((stage, index) => <span key={stage} className={index <= lifecycleIndex(selectedStatus) ? "is-complete" : ""} title={stage.replace(/_/g, " ")}>{stage.replace(/_/g, " ")}</span>)}
                  </div>
                </div>
                {qcFailed ? <div className="nursing-risk-alert"><AlertTriangle size={16} /> Latest QC failed {latestQc?.westgardRuleViolated ? `(${latestQc.westgardRuleViolated})` : ""}. Result authorisation is blocked.</div> : null}
                <div className="lab-chain">
                  <h4>Chain of custody</h4>
                  {(selected.timeline || []).length ? selected.timeline.map((event: any) => (
                    <div key={event.id || `${event.eventName}-${event.createdAt}`}>
                      <strong>{String(event.eventName || "").replace(/lab_/g, "").replace(/_/g, " ")}</strong>
                      <span>{new Date(event.createdAt).toLocaleString()}</span>
                    </div>
                  )) : <p>No custody events recorded yet.</p>}
                </div>
              </div>
            ) : <div className="pv-empty">Select a lab order to work on it.</div>}
          </div>
        </section>
      </div>

      <div className="lab-bottom-grid">
        <section className="nursing-clinical-card">
          <h3 className="form-title"><ShieldCheck size={18} /> Quality Control</h3>
          {latestQc ? (
            <div className={`lab-qc-card ${latestQc.passed === false ? "is-fail" : "is-pass"}`}>
              <strong>{latestQc.analyserName || latestQc.instrumentId}</strong>
              <span>{latestQc.passed === false ? `Failed ${latestQc.westgardRuleViolated || "Westgard rule"}` : "Passed"} | {latestQc.testName}</span>
            </div>
          ) : <p className="pv-empty">No QC run recorded.</p>}
        </section>
        <section className="nursing-clinical-card">
          <h3 className="form-title"><ClipboardCheck size={18} /> Verification Queue</h3>
          {requests.filter((row) => statusLabel(row) === "RESULT_ENTERED").slice(0, 4).map((row) => (
            <button key={row.id} type="button" className="lab-queue-item" onClick={() => { setSelected(row); openModal("verify", row); }}>
              <strong>{row.testName}</strong><span>{patientName(row)}</span>
            </button>
          ))}
          {!requests.some((row) => statusLabel(row) === "RESULT_ENTERED") ? <p className="pv-empty">No results awaiting verification.</p> : null}
        </section>
      </div>

      <section className="nursing-clinical-card lab-catalog-panel">
        <div className="lab-catalog-heading"><div><h3 className="form-title"><ClipboardCheck size={18} /> Test Catalogue</h3><p>Authoritative tests, specimen requirements, reference ranges, and turnaround targets.</p></div><span className="pv-badge">{catalog.length} tests</span></div>
        <div className="overflow-x-auto"><table className="pv-table"><thead><tr><th>Code</th><th>Test</th><th>Category</th><th>Specimen</th><th>Reference</th><th>TAT</th><th /></tr></thead><tbody>{catalog.slice(0, 100).map((item) => <tr key={item.testCode}><td>{item.testCode}</td><td><strong>{item.testName}</strong></td><td>{item.category || "-"}</td><td>{item.sampleType || "-"}</td><td>{item.referenceRange || "-"} {item.unit || ""}</td><td>{item.turnaroundHours ? `${item.turnaroundHours}h` : "-"}</td><td>{item.source === "CUSTOM" ? <button type="button" className="lab-inline-danger" onClick={() => removeCatalogItem(item)}>Remove</button> : null}</td></tr>)}{!catalog.length ? <tr><td colSpan={7} className="pv-empty">No laboratory catalogue items available.</td></tr> : null}</tbody></table></div>
      </section>

      {modal ? (
        <div className="module-form-overlay" onClick={() => setModal(null)}>
          <form className="module-form-panel modal-panel module-form-panel-lab lab-modal" onSubmit={
            modal === "collect" ? collectSample :
            modal === "result" ? saveResult :
            modal === "verify" ? verifyOrRelease :
            modal === "reject" ? rejectSpecimen :
            modal === "barcode" ? scanBarcode :
            modal === "catalog" ? saveCatalogItem :
            recordQc
          } onClick={(event) => event.stopPropagation()}>
            <div className="module-form-header">
              <div className="module-form-heading">
                <div className="module-form-icon"><FlaskConical size={20} /></div>
                <div><div className="module-form-kicker">Laboratory</div><h2 className="module-form-title">{modal === "qc" ? "Quality Control" : modal === "catalog" ? "Test Catalogue" : modal === "reject" ? "Specimen Rejection" : modal === "verify" ? "Verify / Release Result" : modal === "barcode" ? "Barcode Scan" : modal === "collect" ? "Specimen Collection" : "Result Entry"}</h2></div>
              </div>
              <button type="button" className="modal-close-btn" onClick={() => setModal(null)}>×</button>
            </div>
            <div className="module-form-body">
              <div className="module-form-grid">
                {modal === "collect" ? <>
                  <Field label="Sample type"><input className="module-form-input" value={collectForm.sampleType} onChange={(e) => setCollectForm({ ...collectForm, sampleType: e.target.value })} /></Field>
                  <Field label="Condition"><select className="module-form-input" value={collectForm.sampleCondition} onChange={(e) => setCollectForm({ ...collectForm, sampleCondition: e.target.value })}><option>ACCEPTABLE</option><option>CLOTTED</option><option>HAEMOLYSED</option><option>INSUFFICIENT_VOLUME</option><option>WRONG_TUBE</option></select></Field>
                  <Field label="Collection time"><input type="datetime-local" className="module-form-input" value={collectForm.collectionTime} onChange={(e) => setCollectForm({ ...collectForm, collectionTime: e.target.value })} /></Field>
                  <Field label="Storage location"><input className="module-form-input" value={collectForm.storageLocation} onChange={(e) => setCollectForm({ ...collectForm, storageLocation: e.target.value })} /></Field>
                  <Field label="Notes" wide><textarea className="module-form-input" value={collectForm.notes} onChange={(e) => setCollectForm({ ...collectForm, notes: e.target.value })} /></Field>
                </> : null}
                {modal === "barcode" ? <>
                  <Field label="Barcode"><input className="module-form-input" value={barcodeForm.barcode} onChange={(e) => setBarcodeForm({ ...barcodeForm, barcode: e.target.value })} required /></Field>
                  <Field label="Stage"><select className="module-form-input" value={barcodeForm.stage} onChange={(e) => setBarcodeForm({ ...barcodeForm, stage: e.target.value })}><option>COLLECTION</option><option>RECEIPT</option><option>ANALYSER_LOADING</option><option>RESULT_ENTRY</option></select></Field>
                  <Field label="Notes" wide><textarea className="module-form-input" value={barcodeForm.notes} onChange={(e) => setBarcodeForm({ ...barcodeForm, notes: e.target.value })} /></Field>
                </> : null}
                {modal === "result" ? <>
                  <Field label="Measured value"><input className="module-form-input" value={resultForm.measuredValue} onChange={(e) => setResultForm({ ...resultForm, measuredValue: e.target.value, resultFlag: autoFlag(e.target.value, resultForm.referenceRange) })} required /></Field>
                  <Field label="Unit"><input className="module-form-input" value={resultForm.unit} onChange={(e) => setResultForm({ ...resultForm, unit: e.target.value })} /></Field>
                  <Field label="Reference range"><input className="module-form-input" value={resultForm.referenceRange} onChange={(e) => setResultForm({ ...resultForm, referenceRange: e.target.value, resultFlag: autoFlag(resultForm.measuredValue, e.target.value) })} /></Field>
                  <Field label="Flag"><select className="module-form-input" value={resultForm.resultFlag} onChange={(e) => setResultForm({ ...resultForm, resultFlag: e.target.value })}><option>NORMAL</option><option>ABNORMAL</option><option>CRITICAL</option></select></Field>
                  <Field label="Critical result"><label className="lab-check"><input type="checkbox" checked={resultForm.criticalResult} onChange={(e) => setResultForm({ ...resultForm, criticalResult: e.target.checked, resultFlag: e.target.checked ? "CRITICAL" : resultForm.resultFlag })} /> Requires doctor notification</label></Field>
                  <Field label="Doctor notification"><input className="module-form-input" value={resultForm.doctorNotified} onChange={(e) => setResultForm({ ...resultForm, doctorNotified: e.target.value })} placeholder="Dr notified, time, method" /></Field>
                  <Field label="Notes" wide><textarea className="module-form-input" value={resultForm.interpretationNotes} onChange={(e) => setResultForm({ ...resultForm, interpretationNotes: e.target.value })} /></Field>
                </> : null}
                {modal === "verify" ? <>
                  <Field label="Release now"><label className="lab-check"><input type="checkbox" checked={releaseNow} onChange={(e) => setReleaseNow(e.target.checked)} /> Release to EMR after verification</label></Field>
                  <Field label="Verification notes" wide><textarea className="module-form-input" value={verifyNotes} onChange={(e) => setVerifyNotes(e.target.value)} /></Field>
                </> : null}
                {modal === "reject" ? <>
                  <Field label="Reason"><select className="module-form-input" value={rejectForm.reason} onChange={(e) => setRejectForm({ ...rejectForm, reason: e.target.value })}>{["Wrong patient", "Wrong specimen", "Wrong container", "Wrong anticoagulant", "Clotted sample", "Haemolysed specimen", "Lipaemic", "Icteric", "Insufficient quantity", "Leaking container", "Broken container", "Expired transport time", "Inappropriate temperature", "Contaminated", "Unlabelled", "Mislabeled", "Duplicate specimen", "Delayed transport", "Specimen unsuitable for requested test", "Compromised specimen integrity", "Barcode mismatch"].map((reason) => <option key={reason}>{reason}</option>)}</select></Field>
                  <Field label="Barcode"><input className="module-form-input" value={rejectForm.barcode} onChange={(e) => setRejectForm({ ...rejectForm, barcode: e.target.value })} /></Field>
                  <Field label="Notes" wide><textarea className="module-form-input" value={rejectForm.notes} onChange={(e) => setRejectForm({ ...rejectForm, notes: e.target.value })} /></Field>
                </> : null}
                {modal === "catalog" ? <>
                  <Field label="Test code"><input className="module-form-input" value={catalogForm.testCode} onChange={(e) => setCatalogForm({ ...catalogForm, testCode: e.target.value.toUpperCase() })} placeholder="CBC" /></Field>
                  <Field label="Test name"><input className="module-form-input" value={catalogForm.testName} onChange={(e) => setCatalogForm({ ...catalogForm, testName: e.target.value })} required /></Field>
                  <Field label="Category"><select className="module-form-input" value={catalogForm.category} onChange={(e) => setCatalogForm({ ...catalogForm, category: e.target.value })}>{["Haematology", "Chemistry", "Microbiology", "Serology / Immunology", "Parasitology", "Urinalysis", "Coagulation", "Blood Gas", "Histopathology", "Cytology"].map((item) => <option key={item}>{item}</option>)}</select></Field>
                  <Field label="Specimen type"><input className="module-form-input" value={catalogForm.sampleType} onChange={(e) => setCatalogForm({ ...catalogForm, sampleType: e.target.value })} placeholder="EDTA blood, serum..." /></Field>
                  <Field label="Reference range"><input className="module-form-input" value={catalogForm.referenceRange} onChange={(e) => setCatalogForm({ ...catalogForm, referenceRange: e.target.value })} placeholder="4.0 - 11.0" /></Field>
                  <Field label="Unit"><input className="module-form-input" value={catalogForm.unit} onChange={(e) => setCatalogForm({ ...catalogForm, unit: e.target.value })} placeholder="x10^9/L" /></Field>
                  <Field label="Turnaround (hours)"><input type="number" min="0" className="module-form-input" value={catalogForm.turnaroundHours} onChange={(e) => setCatalogForm({ ...catalogForm, turnaroundHours: e.target.value })} /></Field>
                  <Field label="Price"><input type="number" min="0" className="module-form-input" value={catalogForm.price} onChange={(e) => setCatalogForm({ ...catalogForm, price: e.target.value })} /></Field>
                </> : null}
                {modal === "qc" ? <>
                  <Field label="Analyser"><input className="module-form-input" value={qcForm.analyserName} onChange={(e) => setQcForm({ ...qcForm, analyserName: e.target.value })} /></Field>
                  <Field label="Test"><input className="module-form-input" value={qcForm.testName} onChange={(e) => setQcForm({ ...qcForm, testName: e.target.value })} /></Field>
                  <Field label="QC level"><select className="module-form-input" value={qcForm.qcLevel} onChange={(e) => setQcForm({ ...qcForm, qcLevel: e.target.value })}><option>LOW</option><option>NORMAL</option><option>HIGH</option></select></Field>
                  <Field label="Expected value"><input type="number" className="module-form-input" value={qcForm.expectedValue} onChange={(e) => setQcForm({ ...qcForm, expectedValue: e.target.value })} /></Field>
                  <Field label="Measured value"><input type="number" className="module-form-input" value={qcForm.measuredValue} onChange={(e) => setQcForm({ ...qcForm, measuredValue: e.target.value })} /></Field>
                  <Field label="SD deviation"><input type="number" className="module-form-input" value={qcForm.sdDeviation} onChange={(e) => setQcForm({ ...qcForm, sdDeviation: e.target.value })} /></Field>
                  <Field label="Westgard rule"><select className="module-form-input" value={qcForm.westgardRuleViolated} onChange={(e) => setQcForm({ ...qcForm, westgardRuleViolated: e.target.value })}><option value="">None - pass</option><option>1-3S</option><option>2-2S</option><option>R-4S</option></select></Field>
                  <Field label="Action taken" wide><textarea className="module-form-input" value={qcForm.actionTaken} onChange={(e) => setQcForm({ ...qcForm, actionTaken: e.target.value })} /></Field>
                </> : null}
              </div>
              <div className="module-form-footer">
                <button type="button" className="form-btn form-btn-cancel" onClick={() => setModal(null)}>Cancel</button>
                <button type="submit" className="form-btn form-btn-primary module-form-submit" disabled={Boolean(saving)}><Save size={15} /> {saving ? "Saving..." : "Save"}</button>
              </div>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}

function Field({ label, children, wide = false }: { label: string; children: ReactNode; wide?: boolean }) {
  return <div className={`module-form-field ${wide ? "is-wide" : ""}`}><label className="form-label">{label}</label>{children}</div>;
}

