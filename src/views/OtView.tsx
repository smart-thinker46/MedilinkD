import type { FormEvent } from "react";
import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  Clock3,
  FileSignature,
  Gauge,
  HeartPulse,
  PackageCheck,
  Plus,
  RefreshCw,
  Scissors,
  Search,
  ShieldAlert,
  Siren,
  Stethoscope,
  UserCheck,
  X,
} from "lucide-react";
import { api } from "../lib/api";
import { useLiveRefresh } from "../lib/liveRefresh";

const unwrapRows = (value: any) => {
  const data = value?.data ?? value;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  return [];
};

const todayValue = () => new Date().toISOString().slice(0, 10);
const nowTime = () => new Date().toTimeString().slice(0, 5);
const patientName = (row: any) => {
  const patient = row?.patient || row;
  const name = [patient?.firstName, patient?.lastName].filter(Boolean).join(" ");
  return name || patient?.patientCode || patient?.mrn || row?.patientId || "Unknown patient";
};
const staffName = (row: any) => [row?.firstName, row?.lastName].filter(Boolean).join(" ") || row?.name || "Staff member";
const statusClass = (value: any) => String(value || "REQUESTED").toLowerCase().replace(/_/g, "-");
const formatDateTime = (value: any) => {
  const date = new Date(String(value || ""));
  if (!Number.isFinite(date.getTime())) return "Not scheduled";
  return date.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
};
const minutesLabel = (value: any) => `${Number(value || 0)} min`;
const vitalsTextToRows = (value: string) =>
  value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((note) => ({ note, recordedAt: new Date().toISOString() }));

const checklistByPhase: Record<string, Array<[string, string]>> = {
  SIGN_IN: [
    ["patientIdentityConfirmed", "Patient identity confirmed"],
    ["operationSiteConfirmed", "Operation and site confirmed"],
    ["consentSigned", "Consent signed"],
    ["allergiesChecked", "Allergies checked"],
    ["airwayRiskAssessed", "Airway risk assessed"],
    ["bloodAvailable", "Blood available if required"],
  ],
  TIME_OUT: [
    ["patientNameConfirmed", "Patient name confirmed with team"],
    ["procedureConfirmed", "Procedure confirmed"],
    ["siteMarkingConfirmed", "Site marking correct"],
    ["antibioticsGiven", "Antibiotics given"],
    ["criticalStepsDiscussed", "Critical steps discussed"],
    ["teamConfirmed", "Team introduced and ready"],
  ],
  SIGN_OUT: [
    ["specimenLabelled", "Specimen labelled"],
    ["instrumentCountComplete", "Instrument count complete"],
    ["spongeCountCorrect", "Swab count correct"],
    ["surgeonRecoveryPlan", "Recovery plan explained"],
  ],
};

export default function OtView() {
  const [dashboard, setDashboard] = useState<any>({});
  const [bookings, setBookings] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [priority, setPriority] = useState("ALL");
  const [modal, setModal] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");
  const [notice, setNotice] = useState("");
  const [waitingListOpen, setWaitingListOpen] = useState(false);
  const [waitingListLoading, setWaitingListLoading] = useState(false);
  const [waitingListRows, setWaitingListRows] = useState<any[]>([]);

  const [bookingForm, setBookingForm] = useState({
    patientId: "",
    procedure: "",
    procedureType: "GENERAL_SURGERY",
    surgeonId: "",
    surgeonName: "",
    otRoom: "Theatre 1",
    scheduledDate: todayValue(),
    scheduledTime: nowTime(),
    estimatedDurationMinutes: "90",
    priority: "ELECTIVE",
    anesthesiaType: "GENERAL",
    requiredBloodUnits: "0",
    requiredEquipment: "",
    specialInstructions: "",
    consentUploaded: false,
    status: "SCHEDULED",
  });
  const [checklistForm, setChecklistForm] = useState<any>({ phase: "SIGN_IN", notes: "" });
  const [anesthesiaForm, setAnesthesiaForm] = useState({
    anesthesia_type: "GENERAL",
    induction_agents: "",
    maintenance_agents: "",
    airway_management: "",
    additional_drugs: "",
    vital_signs: "",
    fluid_balance: "",
    timeline_annotations: "",
    complications: "",
    aldrete_score: "0",
    notes: "",
  });
  const [countForm, setCountForm] = useState({
    phase: "OPENING",
    openingSwabs: "0",
    countedSwabs: "0",
    openingInstruments: "0",
    countedInstruments: "0",
    openingNeedles: "0",
    countedNeedles: "0",
    performedBy: "",
    verifiedBy: "",
    xrayOrdered: false,
    resolved: true,
    resolutionNotes: "",
  });
  const [implantForm, setImplantForm] = useState({
    item_name: "",
    manufacturer: "",
    deviceName: "",
    catalogueNumber: "",
    serialNumber: "",
    lot_number: "",
    udi: "",
    quantity: "1",
    sterilization_status: "STERILE",
    implant_tracked: true,
    notes: "",
  });
  const [preOpForm, setPreOpForm] = useState({
    medical_history_reviewed: false,
    lab_reviewed: false,
    imaging_reviewed: false,
    anesthesia_cleared: false,
    consent_uploaded: false,
    blood_available_confirmed: false,
    fasting_confirmed: false,
    allergies_documented: false,
    patient_identity_confirmed: false,
    procedure_site_confirmed: false,
    insurance_authorised: false,
    implant_ready: false,
    cssd_ready: false,
    asa_classification: "",
    airway_assessment: "",
    postoperative_destination: "",
    clearance_notes: "",
    blocked_reason: "",
  });
  const [teamForm, setTeamForm] = useState({ staffId: "", role: "SURGEON" });
  const [intraOpForm, setIntraOpForm] = useState({
    incision_date: todayValue(),
    incision_time: nowTime(),
    closure_date: todayValue(),
    closure_time: nowTime(),
    anesthesia_start_date: todayValue(),
    anesthesia_start_time: nowTime(),
    anesthesia_stop_date: todayValue(),
    anesthesia_stop_time: nowTime(),
    surgical_steps: "",
    blood_loss_ml: "0",
    fluids_given_ml: "0",
    specimens_sent: "",
    complications: "",
    notes: "",
  });
  const [postOpForm, setPostOpForm] = useState({
    recovery_vitals: "",
    pain_score: "0",
    consciousness_level: "ALERT",
    bleeding_status: "NONE",
    wound_status: "CLEAN",
    post_op_orders: "",
    icu_transfer_required: false,
    recovery_score: "0",
    exception_authorised: false,
    exception_reason: "",
    disposition: "RECOVERY",
    notes: "",
  });
  const [complicationForm, setComplicationForm] = useState({
    complication_type: "",
    severity: "MEDIUM",
    description: "",
    action_taken: "",
    requires_icu: false,
    mortality: false,
  });
  const [workflowForm, setWorkflowForm] = useState({
    action: "LIFECYCLE",
    status: "PATIENT_IN_THEATRE",
    reason: "",
    notes: "",
    specimenType: "",
    anatomicalSite: "",
    laterality: "",
    label: "",
    destination: "",
    disposition: "WARD",
    recoveryScore: "0",
    phase: "DIRTY",
    delayReason: "",
    identification: "",
    situation: "",
    background: "",
    assessment: "",
    recommendation: "",
  });
  const [completionForm, setCompletionForm] = useState({ notes: "", complications: "", surgeonId: "" });

  const setToast = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice((current) => (current === message ? "" : current)), 6000);
  };

  const load = async () => {
    setLoading(true);
    try {
      const [dashboardResult, bookingResult, patientResult, staffResult] = await Promise.allSettled([
        api.get("/ot/dashboard"),
        api.get("/ot/bookings", { params: { limit: 2000 } }),
        api.get("/patients").catch((error) => {
          if ([404, 405].includes(error?.response?.status)) return api.get("/tenant/patients");
          throw error;
        }),
        api.get("/staff"),
      ]);
      const nextBookings = bookingResult.status === "fulfilled" ? unwrapRows(bookingResult.value.data) : [];
      setDashboard(dashboardResult.status === "fulfilled" ? dashboardResult.value.data || {} : {});
      setBookings(nextBookings);
      setPatients(patientResult.status === "fulfilled" ? unwrapRows(patientResult.value.data) : []);
      setStaff(staffResult.status === "fulfilled" ? unwrapRows(staffResult.value.data) : []);
      setSelectedId((current) => nextBookings.some((row: any) => row.id === current) ? current : (nextBookings[0]?.id || ""));
      const failed = [dashboardResult, bookingResult, patientResult, staffResult].filter((result) => result.status === "rejected");
      if (failed.length) {
        const firstError = failed[0].status === "rejected" ? (failed[0] as PromiseRejectedResult).reason : null;
        setToast(firstError?.response?.data?.message || "Some Operating Theatre data could not be loaded. Refresh to retry.");
      }
    } catch (error: any) {
      setToast(error?.response?.data?.message || "Operating Theatre data could not be loaded.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  useLiveRefresh(load, { intervalMs: 45000 });

  const loadWaitingList = async () => {
    setWaitingListLoading(true);
    try {
      const response = await api.get("/opd/queue/board", { params: { departmentId: "THEATRE" } });
      const payload = response.data?.data || response.data || {};
      setWaitingListRows(Array.isArray(payload?.tokens) ? payload.tokens : Array.isArray(payload) ? payload : []);
    } catch (error: any) {
      setWaitingListRows([]);
      setToast(error?.response?.data?.message || "Operating Theatre waiting list could not be loaded.");
    } finally {
      setWaitingListLoading(false);
    }
  };

  useEffect(() => {
    const handleSidebarAction = (event: Event) => {
      const action = (event as CustomEvent<{ action?: string }>).detail?.action;
      if (action === "monitor-patient") {
        window.setTimeout(() => document.querySelector(".ot-table-wrap")?.scrollIntoView({ behavior: "smooth", block: "center" }), 0);
        setToast("Operating Theatre monitoring board is ready. Select a case to open its workflow.");
      }
      if (action === "queue-patient") {
        setToast("Use Patient Registration to select a patient and queue them to Operating Theatre.");
      }
    };
    const handleWaitingList = (event: Event) => {
      const detail = (event as CustomEvent<{ moduleKey?: string }>).detail;
      if (detail?.moduleKey !== "ot") return;
      setWaitingListOpen(true);
      void loadWaitingList();
    };
    window.addEventListener("hmis:ot-sidebar-action", handleSidebarAction);
    window.addEventListener("hmis:open-module-waiting-list", handleWaitingList);
    return () => {
      window.removeEventListener("hmis:ot-sidebar-action", handleSidebarAction);
      window.removeEventListener("hmis:open-module-waiting-list", handleWaitingList);
    };
  }, []);

  const selected = useMemo(() => bookings.find((row) => row.id === selectedId) || null, [bookings, selectedId]);
  const surgeons = useMemo(() => staff.filter((row) => /doctor|surgeon|consultant|anaesth/i.test(`${row.specialization || ""} ${row.role || ""} ${staffName(row)}`)), [staff]);

  useEffect(() => {
    if (!selectedId) {
      setTimeline([]);
      return;
    }
    api.get(`/ot/booking/${selectedId}/timeline`)
      .then((res: any) => setTimeline(Array.isArray(res.data?.timeline) ? res.data.timeline : []))
      .catch(() => setTimeline([]));
  }, [selectedId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return bookings.filter((row) => {
      const rowStatus = String(row.normalizedStatus || row.status || "").toUpperCase();
      const rowPriority = String(row.priority || "").toUpperCase();
      const haystack = `${row.procedure} ${row.otRoom} ${row.surgeonName} ${patientName(row)} ${rowPriority} ${rowStatus}`.toLowerCase();
      return (!q || haystack.includes(q)) && (status === "ALL" || rowStatus === status) && (priority === "ALL" || rowPriority === priority);
    });
  }, [bookings, priority, search, status]);

  const bookingStats = {
    todayCases: bookings.filter((row) => String(row.scheduledDate || "").slice(0, 10) === todayValue()).length,
    emergencyCases: bookings.filter((row) => String(row.priority || "").toUpperCase() === "EMERGENCY").length,
    inProgress: bookings.filter((row) => ["IN_PROGRESS", "PATIENT_IN_THEATRE", "ANAESTHESIA_STARTED"].includes(String(row.normalizedStatus || row.status || "").toUpperCase())).length,
    completed: bookings.filter((row) => String(row.normalizedStatus || row.status || "").toUpperCase() === "COMPLETED").length,
  };
  const stats = dashboard?.totals || {};
  const statCards = [
    { label: "Today Cases", value: stats.todayCases ?? bookingStats.todayCases, icon: CalendarClock, color: "#2563eb" },
    { label: "Emergency", value: stats.emergencyCases ?? bookingStats.emergencyCases, icon: Siren, color: "#dc2626" },
    { label: "In Progress", value: stats.inProgress ?? bookingStats.inProgress, icon: Activity, color: "#d97706" },
    { label: "Completed", value: stats.completed ?? bookingStats.completed, icon: CheckCircle2, color: "#16a34a" },
    { label: "Utilisation", value: `${stats.utilizationRate ?? 0}%`, icon: Gauge, color: "#0f766e" },
    { label: "Over-run", value: `${stats.overRunRate ?? 0}%`, icon: Clock3, color: "#7c3aed" },
  ];

  const requireSelected = () => {
    if (selectedId) return true;
    setToast("Select an OT case first.");
    return false;
  };

  const saveBooking = (event: FormEvent) => {
    event.preventDefault();
    const scheduledDate = `${bookingForm.scheduledDate}T${bookingForm.scheduledTime || "00:00"}:00`;
    setSaving("booking");
    api.post("/ot/booking", {
      ...bookingForm,
      scheduledDate,
      surgeonName: bookingForm.surgeonName || staffName(staff.find((row) => row.id === bookingForm.surgeonId)),
      estimatedDurationMinutes: Number(bookingForm.estimatedDurationMinutes),
      requiredBloodUnits: Number(bookingForm.requiredBloodUnits),
    }).then((res: any) => {
      setToast(res.data?.bumpedElectiveCases?.length ? "Emergency case booked and elective case notifications logged." : "Surgical case booked without theatre overbooking.");
      setSelectedId(res.data?.id || "");
      setModal("");
      return load();
    }).catch((error: any) => setToast(error?.response?.data?.message || "Surgical booking failed.")).finally(() => setSaving(""));
  };

  const saveChecklist = (event: FormEvent) => {
    event.preventDefault();
    if (!requireSelected()) return;
    setSaving("checklist");
    api.post("/ot/checklist", { bookingId: selectedId, ...checklistForm })
      .then(() => {
        setToast(`${checklistForm.phase.replace("_", " ")} saved and WHO sequence enforced.`);
        setModal("");
        return load();
      })
      .catch((error: any) => setToast(error?.response?.data?.message || "Checklist could not be saved."))
      .finally(() => setSaving(""));
  };

  const saveAnesthesia = (event: FormEvent) => {
    event.preventDefault();
    if (!requireSelected()) return;
    setSaving("anesthesia");
    api.post("/ot/anesthesia", { bookingId: selectedId, ...anesthesiaForm, vital_signs: vitalsTextToRows(anesthesiaForm.vital_signs), aldrete_score: Number(anesthesiaForm.aldrete_score) })
      .then(() => {
        setToast("Anaesthesia timeline saved.");
        setModal("");
        return load();
      })
      .catch((error: any) => setToast(error?.response?.data?.message || "Anaesthesia record failed."))
      .finally(() => setSaving(""));
  };

  const savePreOp = (event: FormEvent) => {
    event.preventDefault();
    if (!requireSelected()) return;
    setSaving("preop");
    api.post("/ot/pre-op", { bookingId: selectedId, ...preOpForm })
      .then(() => {
        setToast("Pre-operative clearance saved and case promoted when mandatory checks pass.");
        setModal("");
        return load();
      })
      .catch((error: any) => setToast(error?.response?.data?.message || "Pre-op clearance failed."))
      .finally(() => setSaving(""));
  };

  const saveTeam = (event: FormEvent) => {
    event.preventDefault();
    if (!requireSelected()) return;
    setSaving("team");
    api.post("/ot/team", { bookingId: selectedId, ...teamForm })
      .then(() => {
        setToast("Theatre team member assigned.");
        setModal("");
        return load();
      })
      .catch((error: any) => setToast(error?.response?.data?.message || "Team assignment failed."))
      .finally(() => setSaving(""));
  };

  const saveIntraOp = (event: FormEvent) => {
    event.preventDefault();
    if (!requireSelected()) return;
    setSaving("intraop");
    api.post("/ot/intra-op", {
      bookingId: selectedId,
      incision_time: `${intraOpForm.incision_date}T${intraOpForm.incision_time || "00:00"}:00`,
      closure_time: `${intraOpForm.closure_date}T${intraOpForm.closure_time || "00:00"}:00`,
      anesthesia_start: `${intraOpForm.anesthesia_start_date}T${intraOpForm.anesthesia_start_time || "00:00"}:00`,
      anesthesia_stop: `${intraOpForm.anesthesia_stop_date}T${intraOpForm.anesthesia_stop_time || "00:00"}:00`,
      surgical_steps: intraOpForm.surgical_steps,
      blood_loss_ml: Number(intraOpForm.blood_loss_ml),
      fluids_given_ml: Number(intraOpForm.fluids_given_ml),
      specimens_sent: intraOpForm.specimens_sent,
      complications: intraOpForm.complications,
      notes: intraOpForm.notes,
    })
      .then(() => {
        setToast("Intra-operative timing and surgical record saved.");
        setModal("");
        return load();
      })
      .catch((error: any) => setToast(error?.response?.data?.message || "Intra-op record failed."))
      .finally(() => setSaving(""));
  };

  const saveCount = (event: FormEvent) => {
    event.preventDefault();
    if (!requireSelected()) return;
    setSaving("count");
    api.post("/ot/count", { bookingId: selectedId, ...countForm })
      .then(() => {
        setToast("Swab, instrument, and needle count saved as resolved.");
        setModal("");
        return load();
      })
      .catch((error: any) => {
        setToast(error?.response?.data?.message || "Count STOP alert recorded. Resolve before closure.");
        return load();
      })
      .finally(() => setSaving(""));
  };

  const saveImplant = (event: FormEvent) => {
    event.preventDefault();
    if (!requireSelected()) return;
    setSaving("implant");
    api.post("/ot/inventory-usage", { bookingId: selectedId, ...implantForm, quantity: Number(implantForm.quantity) })
      .then(() => {
        setToast("Implant/prosthesis logged with recall traceability details.");
        setModal("");
        return load();
      })
      .catch((error: any) => setToast(error?.response?.data?.message || "Implant log failed."))
      .finally(() => setSaving(""));
  };

  const savePostOp = (event: FormEvent) => {
    event.preventDefault();
    if (!requireSelected()) return;
    setSaving("postop");
    api.post("/ot/post-op", { bookingId: selectedId, ...postOpForm, pain_score: Number(postOpForm.pain_score) })
      .then(() => {
        setToast("Post-operative recovery record saved.");
        setModal("");
        return load();
      })
      .catch((error: any) => setToast(error?.response?.data?.message || "Post-op record failed."))
      .finally(() => setSaving(""));
  };

  const saveComplication = (event: FormEvent) => {
    event.preventDefault();
    if (!requireSelected()) return;
    setSaving("complication");
    api.post("/ot/complication", { bookingId: selectedId, ...complicationForm })
      .then(() => {
        setToast("Complication logged for OT safety analytics.");
        setModal("");
        return load();
      })
      .catch((error: any) => setToast(error?.response?.data?.message || "Complication log failed."))
      .finally(() => setSaving(""));
  };

  const saveWorkflow = (event: FormEvent) => {
    event.preventDefault();
    if (!requireSelected()) return;
    setSaving("workflow");
    api.post("/ot/workflow", { bookingId: selectedId, ...workflowForm, recoveryScore: Number(workflowForm.recoveryScore) })
      .then(() => {
        setToast("OT workflow event recorded with an auditable timeline.");
        setModal("");
        return load();
      })
      .catch((error: any) => setToast(error?.response?.data?.message || "OT workflow action failed."))
      .finally(() => setSaving(""));
  };

  const saveCompletion = (event: FormEvent) => {
    event.preventDefault();
    if (!requireSelected()) return;
    setSaving("complete");
    api.post("/ot/note", { bookingId: selectedId, ...completionForm })
      .then(() => {
        setToast("Case completed after Sign Out and count validation.");
        setModal("");
        return load();
      })
      .catch((error: any) => setToast(error?.response?.data?.message || "Case completion failed."))
      .finally(() => setSaving(""));
  };

  const updateStatus = (nextStatus: string) => {
    if (!requireSelected()) return;
    setSaving(nextStatus);
    api.patch(`/ot/booking/${selectedId}/status`, { status: nextStatus, notes: `Marked ${nextStatus} from OT workstation` })
      .then(() => {
        setToast(`Case marked ${nextStatus.replace("_", " ")}.`);
        return load();
      })
      .catch((error: any) => setToast(error?.response?.data?.message || "Status update failed."))
      .finally(() => setSaving(""));
  };

  const openModal = (name: string) => {
    if (name !== "booking" && !requireSelected()) return;
    if (name === "checklist") setChecklistForm({ phase: "SIGN_IN", notes: "" });
    if (name === "team") setTeamForm({ staffId: "", role: "SURGEON" });
    if (name === "complete") setCompletionForm({ notes: "", complications: "", surgeonId: selected?.surgeonId || "" });
    setModal(name);
  };

  const modalTitle: Record<string, string> = {
    booking: "Book Surgery",
    preop: "Pre-operative Clearance",
    team: "Assign Theatre Team",
    checklist: "WHO Surgical Safety Checklist",
    intraop: "Intra-operative Record",
    anesthesia: "Anaesthesia Record",
    count: "Swab, Instrument, and Needle Count",
    implant: "Implant and Prosthesis Log",
    postop: "Post-operative Recovery",
    complication: "Complication Report",
    workflow: "OT Workflow Event",
    complete: "Complete Surgical Case",
  };

  return (
    <div className="nursing-view ot-view">
      <div className="pv-header ot-header">
        <div>
          <h2 className="pv-title">Operating Theatre</h2>
          <p className="pv-subtitle">Theatre allocation, WHO safety checks, anaesthesia records, counts, implants, and utilisation analytics.</p>
        </div>
        <div className="nursing-header-actions">
          <button className="ot-btn is-neutral" type="button" onClick={() => void load()}><RefreshCw size={15} /> Refresh</button>
          <button className="ot-btn is-primary" type="button" onClick={() => openModal("booking")}><Plus size={15} /> Book Surgery</button>
          <button className="ot-btn is-danger" type="button" onClick={() => {
            setBookingForm((current) => ({ ...current, priority: "EMERGENCY", otRoom: "Emergency Theatre" }));
            openModal("booking");
          }}><Siren size={15} /> Emergency Insert</button>
        </div>
      </div>

      {notice ? (
        <div className={`module-notice-toast is-${/failed|STOP|cannot|overbook|required/i.test(notice) ? "error" : /Emergency|warning|alert/i.test(notice) ? "warning" : "success"}`} role="status" aria-live="polite">
          <div><strong>Operating Theatre</strong><span>{notice}</span></div>
          <button type="button" className="module-notice-close" onClick={() => setNotice("")} aria-label="Dismiss notification">×</button>
        </div>
      ) : null}

      {waitingListOpen ? (
        <div className="module-form-backdrop" role="dialog" aria-modal="true" aria-labelledby="ot-waiting-title">
          <div className="module-form-modal ot-modal ot-waiting-modal">
            <div className="module-form-header"><div className="module-form-icon"><ClipboardCheck size={20} /></div><div><p className="module-form-kicker">OPERATING THEATRE QUEUE</p><h3 id="ot-waiting-title" className="module-form-title">Open Waiting List</h3></div><button type="button" className="module-form-close" onClick={() => setWaitingListOpen(false)} aria-label="Close waiting list"><X size={18} /></button></div>
            <div className="module-form-body">
              <p className="pv-subtitle">Patients currently queued to the Operating Theatre service point.</p>
              <div className="pv-table-wrap"><table className="pv-table"><thead><tr><th>Token</th><th>Patient</th><th>Priority</th><th>Queued</th><th>Status</th></tr></thead><tbody>
                {waitingListLoading ? <tr><td colSpan={5} className="pv-empty">Loading theatre waiting list...</td></tr> : waitingListRows.length === 0 ? <tr><td colSpan={5} className="pv-empty">No patients are waiting for Operating Theatre.</td></tr> : waitingListRows.map((row, index) => <tr key={row.tokenId || row.id || `${row.patientId}-${index}`}><td>{row.tokenNumber || "-"}</td><td>{row.patientName || row.name || row.patientCode || row.patientId || "Unnamed patient"}</td><td>{row.priority || "GENERAL"}</td><td>{row.issuedAt ? formatDateTime(row.issuedAt) : "-"}</td><td>{row.status || "WAITING"}</td></tr>)}
              </tbody></table></div>
            </div>
            <div className="module-form-footer"><button type="button" className="ot-btn is-neutral" onClick={() => setWaitingListOpen(false)}>Close</button><button type="button" className="ot-btn is-primary" onClick={loadWaitingList} disabled={waitingListLoading}><RefreshCw size={15} /> Refresh</button></div>
          </div>
        </div>
      ) : null}

      <div className="ot-stats-grid">
        {statCards.map((card) => {
          const Icon = card.icon;
          return <article key={card.label} className="pv-stat-card ot-stat" style={{ borderLeftColor: card.color }}><div><p className="pv-stat-label">{card.label}</p><p className="pv-stat-value">{card.value}</p></div><Icon size={22} style={{ color: card.color }} /></article>;
        })}
      </div>

      <div className="ot-workspace">
        <section className="ot-panel ot-list-panel">
          <div className="ot-toolbar">
            <div className="pv-search-wrap"><Search size={16} /><input className="pv-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search patient, surgeon, theatre, procedure..." /></div>
            <select value={status} onChange={(event) => setStatus(event.target.value)}><option>ALL</option><option>REQUESTED</option><option>PRE_OP_CLEARED</option><option>SCHEDULED</option><option>PATIENT_IN_THEATRE</option><option>IN_PROGRESS</option><option>POST_OP</option><option>PACU</option><option>TRANSFERRED_TO_ICU</option><option>TRANSFERRED_TO_WARD</option><option>COMPLETED</option><option>POSTPONED</option><option>CANCELLED</option></select>
            <select value={priority} onChange={(event) => setPriority(event.target.value)}><option>ALL</option><option>ELECTIVE</option><option>URGENT</option><option>EMERGENCY</option></select>
          </div>
          <div className="pv-table-wrap ot-table-wrap">
            <table className="pv-table ot-table">
              <thead><tr><th>Patient</th><th>Procedure</th><th>Theatre</th><th>Start</th><th>Duration</th><th>Priority</th><th>Status</th></tr></thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row.id} className={selectedId === row.id ? "selected" : ""} onClick={() => setSelectedId(row.id)}>
                    <td><strong>{patientName(row)}</strong><span>{row.patient?.patientCode || row.patientId}</span></td>
                    <td>{row.procedure}</td>
                    <td>{row.otRoom || "Unassigned"}</td>
                    <td>{formatDateTime(row.scheduledDate)}</td>
                    <td>{minutesLabel(row.estimatedDurationMinutes || 60)}</td>
                    <td><span className={`ot-priority ${String(row.priority || "ELECTIVE").toLowerCase()}`}>{row.priority || "ELECTIVE"}</span></td>
                    <td><span className={`ot-status ${statusClass(row.normalizedStatus || row.status)}`}>{String(row.normalizedStatus || row.status || "REQUESTED").replace(/_/g, " ")}</span></td>
                  </tr>
                ))}
                {!filtered.length ? <tr><td colSpan={7} className="pv-empty">{loading ? "Loading theatre cases..." : "No OT cases match this filter."}</td></tr> : null}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="ot-panel ot-case-panel">
          <div className="ot-case-head">
            <div><span>Selected Case</span><strong>{selected ? selected.procedure : "No case selected"}</strong><p>{selected ? `${patientName(selected)} | ${selected.otRoom || "Unassigned"} | ${formatDateTime(selected.scheduledDate)}` : "Choose a case from the schedule table."}</p></div>
            {selected ? <span className={`ot-status ${statusClass(selected.normalizedStatus || selected.status)}`}>{String(selected.normalizedStatus || selected.status).replace(/_/g, " ")}</span> : null}
          </div>
          <div className="ot-action-grid">
            <button type="button" onClick={() => openModal("preop")}><UserCheck size={16} /> Pre-Op Clear</button>
            <button type="button" onClick={() => openModal("team")}><Stethoscope size={16} /> Assign Team</button>
            <button type="button" onClick={() => openModal("checklist")}><ClipboardCheck size={16} /> WHO Checklist</button>
            <button type="button" onClick={() => openModal("intraop")}><ClipboardList size={16} /> Intra-Op</button>
            <button type="button" onClick={() => openModal("anesthesia")}><HeartPulse size={16} /> Anaesthesia</button>
            <button type="button" onClick={() => openModal("count")}><ShieldAlert size={16} /> Count Check</button>
            <button type="button" onClick={() => openModal("implant")}><PackageCheck size={16} /> Implant Log</button>
            <button type="button" onClick={() => openModal("postop")}><Activity size={16} /> Post-Op</button>
            <button type="button" onClick={() => openModal("complication")}><AlertTriangle size={16} /> Complication</button>
            <button type="button" onClick={() => openModal("workflow")}><ClipboardList size={16} /> Specimen / Handover</button>
            <button type="button" onClick={() => updateStatus("IN_PROGRESS")}><Scissors size={16} /> Start Case</button>
            <button type="button" onClick={() => openModal("complete")}><FileSignature size={16} /> Complete Case</button>
          </div>
          <div className="ot-safety-strip">
            <div><span>WHO phase</span><strong>{selected?.checklist?.phase?.replace("_", " ") || "Not started"}</strong></div>
            <div><span>Latest count</span><strong className={selected?.countRecord?.status === "STOP" ? "danger" : ""}>{selected?.countRecord?.status || "No count"}</strong></div>
            <div><span>Implant trace</span><strong>{selected?.implantRecord?.udi || selected?.implantRecord?.lotNumber || "None"}</strong></div>
          </div>
          <div className="ot-analytics-card">
            <h3><Gauge size={16} /> Theatre Utilisation</h3>
            <div className="ot-util-grid">
              {(dashboard?.otRoomUtilization || []).slice(0, 4).map((row: any) => <div key={row.otRoom}><span>{row.otRoom}</span><strong>{row.caseCount} cases</strong></div>)}
              {!(dashboard?.otRoomUtilization || []).length ? <p className="pv-empty">No theatre utilisation data yet.</p> : null}
            </div>
          </div>
          <div className="ot-timeline">
            <h3><Clock3 size={16} /> Case Timeline</h3>
            {timeline.slice(-8).reverse().map((row) => <article key={row.id}><span>{formatDateTime(row.createdAt)}</span><strong>{String(row.type).replace(/OT_/g, "").replace(/_/g, " ")}</strong></article>)}
            {!timeline.length ? <p className="pv-empty">Timeline appears after actions are recorded.</p> : null}
          </div>
        </aside>
      </div>

      {modal ? (
        <div className="module-form-backdrop" role="dialog" aria-modal="true">
          <div className="module-form-modal ot-modal">
            <div className="module-form-header">
              <div className="module-form-icon"><Stethoscope size={20} /></div>
              <div><p className="module-form-kicker">Operating Theatre</p><h3 className="module-form-title">{modalTitle[modal]}</h3></div>
              <button type="button" className="module-form-close" onClick={() => setModal("")}><X size={18} /></button>
            </div>

            {modal === "booking" ? (
              <form className="module-form-body ot-form-grid" onSubmit={saveBooking}>
                <label><span>Patient</span><select required value={bookingForm.patientId} onChange={(e) => setBookingForm({ ...bookingForm, patientId: e.target.value })}><option value="">Select patient</option>{patients.map((row) => <option key={row.id} value={row.id}>{patientName(row)} {row.patientCode ? `(${row.patientCode})` : ""}</option>)}</select></label>
                <label><span>Procedure</span><input required value={bookingForm.procedure} onChange={(e) => setBookingForm({ ...bookingForm, procedure: e.target.value })} placeholder="Laparotomy, CS, ORIF..." /></label>
                <label><span>Theatre</span><select value={bookingForm.otRoom} onChange={(e) => setBookingForm({ ...bookingForm, otRoom: e.target.value })}><option>Theatre 1</option><option>Theatre 2</option><option>Emergency Theatre</option><option>Minor Theatre</option></select></label>
                <label><span>Priority</span><select value={bookingForm.priority} onChange={(e) => setBookingForm({ ...bookingForm, priority: e.target.value })}><option>ELECTIVE</option><option>URGENT</option><option>EMERGENCY</option></select></label>
                <label><span>Date</span><input type="date" value={bookingForm.scheduledDate} onChange={(e) => setBookingForm({ ...bookingForm, scheduledDate: e.target.value })} /></label>
                <label><span>Start time</span><input type="time" value={bookingForm.scheduledTime} onChange={(e) => setBookingForm({ ...bookingForm, scheduledTime: e.target.value })} /></label>
                <label><span>Estimated duration</span><input type="number" min="30" step="15" value={bookingForm.estimatedDurationMinutes} onChange={(e) => setBookingForm({ ...bookingForm, estimatedDurationMinutes: e.target.value })} /></label>
                <label><span>Anaesthesia</span><select value={bookingForm.anesthesiaType} onChange={(e) => setBookingForm({ ...bookingForm, anesthesiaType: e.target.value })}><option>GENERAL</option><option>SPINAL</option><option>REGIONAL</option><option>LOCAL</option><option>SEDATION</option></select></label>
                <label><span>Surgeon</span><select value={bookingForm.surgeonId} onChange={(e) => { const surgeon = surgeons.find((row) => row.id === e.target.value); setBookingForm({ ...bookingForm, surgeonId: e.target.value, surgeonName: surgeon ? staffName(surgeon) : "" }); }}><option value="">Select surgeon</option>{surgeons.map((row) => <option key={row.id} value={row.id}>{staffName(row)}</option>)}</select></label>
                <label><span>Blood units</span><input type="number" min="0" value={bookingForm.requiredBloodUnits} onChange={(e) => setBookingForm({ ...bookingForm, requiredBloodUnits: e.target.value })} /></label>
                <label className="wide"><span>Required equipment</span><input value={bookingForm.requiredEquipment} onChange={(e) => setBookingForm({ ...bookingForm, requiredEquipment: e.target.value })} /></label>
                <label className="wide"><span>Special instructions</span><textarea value={bookingForm.specialInstructions} onChange={(e) => setBookingForm({ ...bookingForm, specialInstructions: e.target.value })} /></label>
                <label className="ot-check"><input type="checkbox" checked={bookingForm.consentUploaded} onChange={(e) => setBookingForm({ ...bookingForm, consentUploaded: e.target.checked })} /> Consent uploaded</label>
                <button className="ot-submit" disabled={Boolean(saving)}><CalendarClock size={16} /> {saving === "booking" ? "Booking..." : "Save Theatre Booking"}</button>
              </form>
            ) : null}

            {modal === "preop" ? (
              <form className="module-form-body ot-form-grid" onSubmit={savePreOp}>
                {[
                  ["medical_history_reviewed", "Medical history reviewed"],
                  ["lab_reviewed", "Laboratory results reviewed"],
                  ["imaging_reviewed", "Imaging reviewed"],
                  ["anesthesia_cleared", "Anaesthesia cleared"],
                  ["consent_uploaded", "Consent uploaded"],
                  ["blood_available_confirmed", "Blood available confirmed"],
                  ["fasting_confirmed", "Fasting confirmed"],
                  ["allergies_documented", "Allergies documented"],
                  ["patient_identity_confirmed", "Patient identity confirmed"],
                  ["procedure_site_confirmed", "Procedure and site confirmed"],
                  ["insurance_authorised", "Insurance/authorization confirmed"],
                  ["implant_ready", "Implant readiness confirmed"],
                  ["cssd_ready", "CSSD/instrument readiness confirmed"],
                ].map(([key, label]) => (
                  <label key={key} className="ot-check">
                    <input type="checkbox" checked={Boolean((preOpForm as any)[key])} onChange={(e) => setPreOpForm({ ...preOpForm, [key]: e.target.checked })} />
                    {label}
                  </label>
                ))}
                <label><span>ASA classification</span><input value={preOpForm.asa_classification} onChange={(e) => setPreOpForm({ ...preOpForm, asa_classification: e.target.value })} placeholder="ASA I-V" /></label>
                <label><span>Postoperative destination</span><input value={preOpForm.postoperative_destination} onChange={(e) => setPreOpForm({ ...preOpForm, postoperative_destination: e.target.value })} placeholder="Ward / ICU / HDU" /></label>
                <label className="wide"><span>Airway assessment</span><textarea value={preOpForm.airway_assessment} onChange={(e) => setPreOpForm({ ...preOpForm, airway_assessment: e.target.value })} /></label>
                <label className="wide"><span>Clearance notes</span><textarea value={preOpForm.clearance_notes} onChange={(e) => setPreOpForm({ ...preOpForm, clearance_notes: e.target.value })} /></label>
                <label className="wide"><span>Blocked reason</span><textarea value={preOpForm.blocked_reason} onChange={(e) => setPreOpForm({ ...preOpForm, blocked_reason: e.target.value })} /></label>
                <button className="ot-submit" disabled={Boolean(saving)}><UserCheck size={16} /> Save Pre-Op Clearance</button>
              </form>
            ) : null}

            {modal === "team" ? (
              <form className="module-form-body ot-form-grid" onSubmit={saveTeam}>
                <label><span>Staff member</span><select required value={teamForm.staffId} onChange={(e) => setTeamForm({ ...teamForm, staffId: e.target.value })}><option value="">Select staff</option>{staff.map((row) => <option key={row.id} value={row.id}>{staffName(row)} {row.specialization ? `- ${row.specialization}` : ""}</option>)}</select></label>
                <label><span>Role</span><select value={teamForm.role} onChange={(e) => setTeamForm({ ...teamForm, role: e.target.value })}><option>SURGEON</option><option>ANAESTHETIST</option><option>SCRUB_NURSE</option><option>CIRCULATING_NURSE</option><option>RECOVERY_NURSE</option><option>TECHNICIAN</option></select></label>
                <button className="ot-submit" disabled={Boolean(saving)}><Stethoscope size={16} /> Assign Team Member</button>
              </form>
            ) : null}

            {modal === "checklist" ? (
              <form className="module-form-body ot-form-grid" onSubmit={saveChecklist}>
                <label><span>WHO phase</span><select value={checklistForm.phase} onChange={(e) => setChecklistForm({ phase: e.target.value, notes: "" })}><option value="SIGN_IN">Sign In</option><option value="TIME_OUT">Time Out</option><option value="SIGN_OUT">Sign Out</option></select></label>
                <div className="module-form-alert is-warning">The system enforces sequence: Sign In, then Time Out, then Sign Out. Completion is blocked until Sign Out and counts are resolved.</div>
                {(checklistByPhase[checklistForm.phase] || []).map(([key, label]) => <label key={key} className="ot-check"><input type="checkbox" checked={Boolean(checklistForm[key])} onChange={(e) => setChecklistForm({ ...checklistForm, [key]: e.target.checked })} /> {label}</label>)}
                <label className="wide"><span>Notes</span><textarea value={checklistForm.notes || ""} onChange={(e) => setChecklistForm({ ...checklistForm, notes: e.target.value })} /></label>
                <button className="ot-submit" disabled={Boolean(saving)}><ClipboardCheck size={16} /> Save Checklist Phase</button>
              </form>
            ) : null}

            {modal === "intraop" ? (
              <form className="module-form-body ot-form-grid" onSubmit={saveIntraOp}>
                <label><span>Incision date</span><input type="date" value={intraOpForm.incision_date} onChange={(e) => setIntraOpForm({ ...intraOpForm, incision_date: e.target.value })} /></label>
                <label><span>Incision time</span><input type="time" value={intraOpForm.incision_time} onChange={(e) => setIntraOpForm({ ...intraOpForm, incision_time: e.target.value })} /></label>
                <label><span>Closure date</span><input type="date" value={intraOpForm.closure_date} onChange={(e) => setIntraOpForm({ ...intraOpForm, closure_date: e.target.value })} /></label>
                <label><span>Closure time</span><input type="time" value={intraOpForm.closure_time} onChange={(e) => setIntraOpForm({ ...intraOpForm, closure_time: e.target.value })} /></label>
                <label><span>Anaesthesia start date</span><input type="date" value={intraOpForm.anesthesia_start_date} onChange={(e) => setIntraOpForm({ ...intraOpForm, anesthesia_start_date: e.target.value })} /></label>
                <label><span>Anaesthesia start time</span><input type="time" value={intraOpForm.anesthesia_start_time} onChange={(e) => setIntraOpForm({ ...intraOpForm, anesthesia_start_time: e.target.value })} /></label>
                <label><span>Anaesthesia stop date</span><input type="date" value={intraOpForm.anesthesia_stop_date} onChange={(e) => setIntraOpForm({ ...intraOpForm, anesthesia_stop_date: e.target.value })} /></label>
                <label><span>Anaesthesia stop time</span><input type="time" value={intraOpForm.anesthesia_stop_time} onChange={(e) => setIntraOpForm({ ...intraOpForm, anesthesia_stop_time: e.target.value })} /></label>
                <label><span>Blood loss ml</span><input type="number" min="0" value={intraOpForm.blood_loss_ml} onChange={(e) => setIntraOpForm({ ...intraOpForm, blood_loss_ml: e.target.value })} /></label>
                <label><span>Fluids given ml</span><input type="number" min="0" value={intraOpForm.fluids_given_ml} onChange={(e) => setIntraOpForm({ ...intraOpForm, fluids_given_ml: e.target.value })} /></label>
                <label className="wide"><span>Surgical steps</span><textarea value={intraOpForm.surgical_steps} onChange={(e) => setIntraOpForm({ ...intraOpForm, surgical_steps: e.target.value })} /></label>
                <label className="wide"><span>Specimens sent</span><input value={intraOpForm.specimens_sent} onChange={(e) => setIntraOpForm({ ...intraOpForm, specimens_sent: e.target.value })} /></label>
                <label className="wide"><span>Complications/notes</span><textarea value={intraOpForm.complications} onChange={(e) => setIntraOpForm({ ...intraOpForm, complications: e.target.value })} /></label>
                <button className="ot-submit" disabled={Boolean(saving)}><ClipboardList size={16} /> Save Intra-Op Record</button>
              </form>
            ) : null}

            {modal === "anesthesia" ? (
              <form className="module-form-body ot-form-grid" onSubmit={saveAnesthesia}>
                <label><span>Anaesthesia type</span><select value={anesthesiaForm.anesthesia_type} onChange={(e) => setAnesthesiaForm({ ...anesthesiaForm, anesthesia_type: e.target.value })}><option>GENERAL</option><option>SPINAL</option><option>REGIONAL</option><option>LOCAL</option><option>SEDATION</option></select></label>
                <label><span>Aldrete score</span><input type="number" min="0" max="10" value={anesthesiaForm.aldrete_score} onChange={(e) => setAnesthesiaForm({ ...anesthesiaForm, aldrete_score: e.target.value })} /></label>
                <label className="wide"><span>Induction drugs and doses</span><input value={anesthesiaForm.induction_agents} onChange={(e) => setAnesthesiaForm({ ...anesthesiaForm, induction_agents: e.target.value })} /></label>
                <label className="wide"><span>Maintenance agents</span><input value={anesthesiaForm.maintenance_agents} onChange={(e) => setAnesthesiaForm({ ...anesthesiaForm, maintenance_agents: e.target.value })} /></label>
                <label className="wide"><span>Airway management</span><input value={anesthesiaForm.airway_management} onChange={(e) => setAnesthesiaForm({ ...anesthesiaForm, airway_management: e.target.value })} /></label>
                <label className="wide"><span>Vitals every 5 minutes</span><textarea value={anesthesiaForm.vital_signs} onChange={(e) => setAnesthesiaForm({ ...anesthesiaForm, vital_signs: e.target.value })} placeholder="10:05 BP 120/70 HR 82 SpO2 98..." /></label>
                <label><span>Fluid balance</span><input value={anesthesiaForm.fluid_balance} onChange={(e) => setAnesthesiaForm({ ...anesthesiaForm, fluid_balance: e.target.value })} /></label>
                <label><span>Additional drugs</span><input value={anesthesiaForm.additional_drugs} onChange={(e) => setAnesthesiaForm({ ...anesthesiaForm, additional_drugs: e.target.value })} /></label>
                <label className="wide"><span>Timeline annotations</span><textarea value={anesthesiaForm.timeline_annotations} onChange={(e) => setAnesthesiaForm({ ...anesthesiaForm, timeline_annotations: e.target.value })} /></label>
                <button className="ot-submit" disabled={Boolean(saving)}><HeartPulse size={16} /> Save Anaesthesia Record</button>
              </form>
            ) : null}

            {modal === "count" ? (
              <form className="module-form-body ot-form-grid" onSubmit={saveCount}>
                <label><span>Count phase</span><select value={countForm.phase} onChange={(e) => setCountForm({ ...countForm, phase: e.target.value })}><option>OPENING</option><option>PRE_CLOSURE</option><option>CLOSING</option></select></label>
                <label><span>Performed by</span><input value={countForm.performedBy} onChange={(e) => setCountForm({ ...countForm, performedBy: e.target.value })} /></label>
                <label><span>Opening swabs</span><input type="number" value={countForm.openingSwabs} onChange={(e) => setCountForm({ ...countForm, openingSwabs: e.target.value })} /></label>
                <label><span>Counted swabs</span><input type="number" value={countForm.countedSwabs} onChange={(e) => setCountForm({ ...countForm, countedSwabs: e.target.value })} /></label>
                <label><span>Opening instruments</span><input type="number" value={countForm.openingInstruments} onChange={(e) => setCountForm({ ...countForm, openingInstruments: e.target.value })} /></label>
                <label><span>Counted instruments</span><input type="number" value={countForm.countedInstruments} onChange={(e) => setCountForm({ ...countForm, countedInstruments: e.target.value })} /></label>
                <label><span>Opening needles</span><input type="number" value={countForm.openingNeedles} onChange={(e) => setCountForm({ ...countForm, openingNeedles: e.target.value })} /></label>
                <label><span>Counted needles</span><input type="number" value={countForm.countedNeedles} onChange={(e) => setCountForm({ ...countForm, countedNeedles: e.target.value })} /></label>
                <label><span>Verified by</span><input value={countForm.verifiedBy} onChange={(e) => setCountForm({ ...countForm, verifiedBy: e.target.value })} /></label>
                <label className="ot-check"><input type="checkbox" checked={countForm.xrayOrdered} onChange={(e) => setCountForm({ ...countForm, xrayOrdered: e.target.checked })} /> X-ray ordered for discrepancy</label>
                <label className="ot-check"><input type="checkbox" checked={countForm.resolved} onChange={(e) => setCountForm({ ...countForm, resolved: e.target.checked })} /> Count discrepancy resolved</label>
                <label className="wide"><span>Resolution notes</span><textarea value={countForm.resolutionNotes} onChange={(e) => setCountForm({ ...countForm, resolutionNotes: e.target.value })} /></label>
                <button className="ot-submit" disabled={Boolean(saving)}><ShieldAlert size={16} /> Save Count</button>
              </form>
            ) : null}

            {modal === "implant" ? (
              <form className="module-form-body ot-form-grid" onSubmit={saveImplant}>
                <label><span>Device name</span><input required value={implantForm.item_name} onChange={(e) => setImplantForm({ ...implantForm, item_name: e.target.value, deviceName: e.target.value })} /></label>
                <label><span>Manufacturer</span><input value={implantForm.manufacturer} onChange={(e) => setImplantForm({ ...implantForm, manufacturer: e.target.value })} /></label>
                <label><span>Catalogue number</span><input value={implantForm.catalogueNumber} onChange={(e) => setImplantForm({ ...implantForm, catalogueNumber: e.target.value })} /></label>
                <label><span>Serial number</span><input value={implantForm.serialNumber} onChange={(e) => setImplantForm({ ...implantForm, serialNumber: e.target.value })} /></label>
                <label><span>Lot number</span><input value={implantForm.lot_number} onChange={(e) => setImplantForm({ ...implantForm, lot_number: e.target.value })} /></label>
                <label><span>UDI</span><input value={implantForm.udi} onChange={(e) => setImplantForm({ ...implantForm, udi: e.target.value })} /></label>
                <label><span>Quantity</span><input type="number" min="1" value={implantForm.quantity} onChange={(e) => setImplantForm({ ...implantForm, quantity: e.target.value })} /></label>
                <label><span>Sterilisation</span><select value={implantForm.sterilization_status} onChange={(e) => setImplantForm({ ...implantForm, sterilization_status: e.target.value })}><option>STERILE</option><option>NON_STERILE</option><option>EXPIRED</option></select></label>
                <label className="wide"><span>Notes</span><textarea value={implantForm.notes} onChange={(e) => setImplantForm({ ...implantForm, notes: e.target.value })} /></label>
                <button className="ot-submit" disabled={Boolean(saving)}><PackageCheck size={16} /> Save Implant Log</button>
              </form>
            ) : null}

            {modal === "postop" ? (
              <form className="module-form-body ot-form-grid" onSubmit={savePostOp}>
                <label className="wide"><span>Recovery vitals</span><textarea value={postOpForm.recovery_vitals} onChange={(e) => setPostOpForm({ ...postOpForm, recovery_vitals: e.target.value })} /></label>
                <label><span>Pain score</span><input type="number" min="0" max="10" value={postOpForm.pain_score} onChange={(e) => setPostOpForm({ ...postOpForm, pain_score: e.target.value })} /></label>
                <label><span>Consciousness level</span><select value={postOpForm.consciousness_level} onChange={(e) => setPostOpForm({ ...postOpForm, consciousness_level: e.target.value })}><option>ALERT</option><option>DROWSY</option><option>CONFUSED</option><option>UNRESPONSIVE</option></select></label>
                <label><span>Bleeding status</span><select value={postOpForm.bleeding_status} onChange={(e) => setPostOpForm({ ...postOpForm, bleeding_status: e.target.value })}><option>NONE</option><option>MILD</option><option>MODERATE</option><option>SEVERE</option></select></label>
                <label><span>Wound status</span><select value={postOpForm.wound_status} onChange={(e) => setPostOpForm({ ...postOpForm, wound_status: e.target.value })}><option>CLEAN</option><option>OOZING</option><option>BLEEDING</option><option>INFECTED</option></select></label>
                <label><span>Recovery score</span><input type="number" min="0" max="10" value={postOpForm.recovery_score} onChange={(e) => setPostOpForm({ ...postOpForm, recovery_score: e.target.value })} /></label>
                <label><span>Disposition</span><select value={postOpForm.disposition} onChange={(e) => setPostOpForm({ ...postOpForm, disposition: e.target.value })}><option>RECOVERY</option><option>WARD</option><option>ICU</option><option>HDU</option></select></label>
                <label className="wide"><span>Post-op orders</span><textarea value={postOpForm.post_op_orders} onChange={(e) => setPostOpForm({ ...postOpForm, post_op_orders: e.target.value })} /></label>
                <label className="ot-check"><input type="checkbox" checked={postOpForm.icu_transfer_required} onChange={(e) => setPostOpForm({ ...postOpForm, icu_transfer_required: e.target.checked })} /> ICU transfer required</label>
                <label className="ot-check"><input type="checkbox" checked={postOpForm.exception_authorised} onChange={(e) => setPostOpForm({ ...postOpForm, exception_authorised: e.target.checked })} /> Authorised recovery exception</label>
                {postOpForm.exception_authorised ? <label className="wide"><span>Exception reason</span><textarea required value={postOpForm.exception_reason} onChange={(e) => setPostOpForm({ ...postOpForm, exception_reason: e.target.value })} /></label> : null}
                <label className="wide"><span>Recovery notes</span><textarea value={postOpForm.notes} onChange={(e) => setPostOpForm({ ...postOpForm, notes: e.target.value })} /></label>
                <button className="ot-submit" disabled={Boolean(saving)}><Activity size={16} /> Save Post-Op Record</button>
              </form>
            ) : null}

            {modal === "complication" ? (
              <form className="module-form-body ot-form-grid" onSubmit={saveComplication}>
                <label><span>Complication type</span><input required value={complicationForm.complication_type} onChange={(e) => setComplicationForm({ ...complicationForm, complication_type: e.target.value })} /></label>
                <label><span>Severity</span><select value={complicationForm.severity} onChange={(e) => setComplicationForm({ ...complicationForm, severity: e.target.value })}><option>LOW</option><option>MEDIUM</option><option>HIGH</option><option>CRITICAL</option></select></label>
                <label className="wide"><span>Description</span><textarea required value={complicationForm.description} onChange={(e) => setComplicationForm({ ...complicationForm, description: e.target.value })} /></label>
                <label className="wide"><span>Action taken</span><textarea value={complicationForm.action_taken} onChange={(e) => setComplicationForm({ ...complicationForm, action_taken: e.target.value })} /></label>
                <label className="ot-check"><input type="checkbox" checked={complicationForm.requires_icu} onChange={(e) => setComplicationForm({ ...complicationForm, requires_icu: e.target.checked })} /> Requires ICU</label>
                <label className="ot-check"><input type="checkbox" checked={complicationForm.mortality} onChange={(e) => setComplicationForm({ ...complicationForm, mortality: e.target.checked })} /> Mortality involved</label>
                <button className="ot-submit" disabled={Boolean(saving)}><AlertTriangle size={16} /> Save Complication</button>
              </form>
            ) : null}

            {modal === "workflow" ? (
              <form className="module-form-body ot-form-grid" onSubmit={saveWorkflow}>
                <label><span>Workflow action</span><select value={workflowForm.action} onChange={(e) => setWorkflowForm({ ...workflowForm, action: e.target.value })}><option value="LIFECYCLE">Surgical lifecycle</option><option value="SPECIMEN">Specimen chain of custody</option><option value="PACU_HANDOVER">PACU recovery</option><option value="POSTOPERATIVE_HANDOVER">Postoperative ISBAR handover</option><option value="TURNOVER">Theatre turnover</option><option value="CANCELLATION">Cancellation / postponement</option></select></label>
                {workflowForm.action === "LIFECYCLE" ? <label><span>New status</span><select value={workflowForm.status} onChange={(e) => setWorkflowForm({ ...workflowForm, status: e.target.value })}><option>PATIENT_IN_THEATRE</option><option>ANAESTHESIA_STARTED</option><option>TIME_OUT</option><option>SURGERY_COMPLETED</option><option>RECOVERY_HANDOVER</option><option>PACU</option><option>TRANSFERRED_TO_ICU</option><option>TRANSFERRED_TO_WARD</option><option>COMPLETED</option><option>POSTPONED</option><option>DEFERRED</option><option>ABORTED</option><option>NO_SHOW</option><option>PATIENT_REFUSED</option><option>PATIENT_DIED</option></select></label> : null}
                {workflowForm.action === "SPECIMEN" ? <><label><span>Specimen type</span><input required value={workflowForm.specimenType} onChange={(e) => setWorkflowForm({ ...workflowForm, specimenType: e.target.value })} /></label><label><span>Anatomical site</span><input required value={workflowForm.anatomicalSite} onChange={(e) => setWorkflowForm({ ...workflowForm, anatomicalSite: e.target.value })} /></label><label><span>Laterality</span><input value={workflowForm.laterality} onChange={(e) => setWorkflowForm({ ...workflowForm, laterality: e.target.value })} /></label><label><span>Destination</span><input value={workflowForm.destination} onChange={(e) => setWorkflowForm({ ...workflowForm, destination: e.target.value })} /></label></> : null}
                {workflowForm.action === "PACU_HANDOVER" ? <><label className="wide"><span>Recovery observations</span><textarea value={workflowForm.notes} onChange={(e) => setWorkflowForm({ ...workflowForm, notes: e.target.value })} /></label><label><span>Recovery score</span><input type="number" min="0" max="10" value={workflowForm.recoveryScore} onChange={(e) => setWorkflowForm({ ...workflowForm, recoveryScore: e.target.value })} /></label><label><span>Disposition</span><select value={workflowForm.disposition} onChange={(e) => setWorkflowForm({ ...workflowForm, disposition: e.target.value })}><option>WARD</option><option>ICU</option><option>HDU</option><option>THEATRE</option><option>EMERGENCY</option><option>MORTUARY</option></select></label></> : null}
                {workflowForm.action === "POSTOPERATIVE_HANDOVER" ? <><label><span>Identification</span><input value={workflowForm.identification} onChange={(e) => setWorkflowForm({ ...workflowForm, identification: e.target.value })} /></label><label><span>Situation</span><input value={workflowForm.situation} onChange={(e) => setWorkflowForm({ ...workflowForm, situation: e.target.value })} /></label><label className="wide"><span>Background</span><textarea value={workflowForm.background} onChange={(e) => setWorkflowForm({ ...workflowForm, background: e.target.value })} /></label><label className="wide"><span>Assessment</span><textarea value={workflowForm.assessment} onChange={(e) => setWorkflowForm({ ...workflowForm, assessment: e.target.value })} /></label><label className="wide"><span>Recommendation / escalation</span><textarea value={workflowForm.recommendation} onChange={(e) => setWorkflowForm({ ...workflowForm, recommendation: e.target.value })} /></label></> : null}
                {workflowForm.action === "TURNOVER" ? <><label><span>Turnover phase</span><select value={workflowForm.phase} onChange={(e) => setWorkflowForm({ ...workflowForm, phase: e.target.value })}><option>DIRTY</option><option>CLEANING</option><option>INSPECTION</option><option>SETUP</option><option>READY</option></select></label><label><span>Delay reason</span><input value={workflowForm.delayReason} onChange={(e) => setWorkflowForm({ ...workflowForm, delayReason: e.target.value })} /></label></> : null}
                <label className="wide"><span>Reason / notes</span><textarea required={workflowForm.action === "CANCELLATION" || ["POSTPONED", "DEFERRED", "ABORTED", "NO_SHOW", "PATIENT_REFUSED", "PATIENT_DIED"].includes(workflowForm.status)} value={workflowForm.reason} onChange={(e) => setWorkflowForm({ ...workflowForm, reason: e.target.value })} /></label>
                <button className="ot-submit" disabled={Boolean(saving)}><ClipboardList size={16} /> Save Workflow Event</button>
              </form>
            ) : null}

            {modal === "complete" ? (
              <form className="module-form-body ot-form-grid" onSubmit={saveCompletion}>
                <div className="module-form-alert is-warning">Completion requires WHO Sign Out and no active count STOP alert.</div>
                <label><span>Surgeon</span><select value={completionForm.surgeonId} onChange={(e) => setCompletionForm({ ...completionForm, surgeonId: e.target.value })}><option value="">Use assigned surgeon</option>{surgeons.map((row) => <option key={row.id} value={row.id}>{staffName(row)}</option>)}</select></label>
                <label className="wide"><span>Operative note</span><textarea required value={completionForm.notes} onChange={(e) => setCompletionForm({ ...completionForm, notes: e.target.value })} /></label>
                <label className="wide"><span>Complications</span><textarea value={completionForm.complications} onChange={(e) => setCompletionForm({ ...completionForm, complications: e.target.value })} /></label>
                <button className="ot-submit" disabled={Boolean(saving)}><FileSignature size={16} /> Complete Case</button>
              </form>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

