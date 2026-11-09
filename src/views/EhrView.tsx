
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Bot,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Eye,
  FileText,
  FlaskConical,
  HeartPulse,
  Pill,
  PlusCircle,
  Radio,
  Save,
  Search,
} from "lucide-react";
import { SimpleModulePlaceholder } from "../components/layout/SimpleModulePlaceholder";
import { ModuleIcon } from "../components/layout/ModuleIcon";
import { api } from "../lib/api";
import { PrescriptionForm } from "../components/clinical/PrescriptionForm";
import { LabRequestForm } from "../components/clinical/LabRequestForm";
import { AdmissionForm } from "../components/clinical/AdmissionForm";



import { useEffect, useMemo, useState } from "react";







type TabKey = "timeline" | "notes" | "orders" | "vitals" | "ai";

const NOTE_TEMPLATES = [
  {
    id: "general",
    name: "General OPD Review",
    chiefComplaint: "",
    history: "History of presenting illness:\nPast medical history:\nMedication history:\nSocial history:",
    examination: "General condition:\nCardiovascular:\nRespiratory:\nAbdomen:\nNeurological:",
    assessment: "",
    plan: "Investigations:\nTreatment:\nPatient education:\nFollow-up:",
  },
  {
    id: "hypertension",
    name: "Hypertension Review",
    chiefComplaint: "Hypertension follow-up",
    history: "BP control since last visit:\nMedication adherence:\nSymptoms: headache, chest pain, dyspnoea, visual symptoms:\nLifestyle review:",
    examination: "BP both arms:\nPulse:\nCardiovascular exam:\nFundoscopy if indicated:\nPeripheral oedema:",
    assessment: "Hypertension review",
    plan: "Continue/adjust antihypertensives:\nRenal function/electrolytes:\nLifestyle counselling:\nReview interval:",
  },
  {
    id: "wound",
    name: "Wound Care Note",
    chiefComplaint: "Wound review",
    history: "Wound site:\nPain/discharge/odour:\nDressing history:\nSystemic symptoms:",
    examination: "Size:\nDepth:\nExudate:\nSurrounding skin:\nSigns of infection:",
    assessment: "Wound review",
    plan: "Dressing plan:\nAntibiotics if indicated:\nOffloading/elevation:\nNext review:",
  },
];

const ICD_HINTS = [
  { code: "I50.0", label: "Congestive heart failure", terms: ["raised jvp", "leg swelling", "dyspnoea", "orthopnoea", "heart failure"] },
  { code: "J18.9", label: "Pneumonia, unspecified", terms: ["pneumonia", "productive cough", "fever", "crepitations", "consolidation"] },
  { code: "E11.9", label: "Type 2 diabetes mellitus without complications", terms: ["diabetes", "hba1c", "hyperglycaemia", "polyuria"] },
  { code: "I10", label: "Essential hypertension", terms: ["hypertension", "high blood pressure", "bp"] },
  { code: "N39.0", label: "Urinary tract infection", terms: ["dysuria", "urinary frequency", "suprapubic", "uti"] },
];

const emptyNote = {
  chiefComplaint: "",
  history: "",
  examination: "",
  assessment: "",
  plan: "",
  diagnosisLabel: "",
  icd10: "",
  addToProblemList: false,
  temperature: "",
  bloodPressure: "",
  pulseRate: "",
  respiratoryRate: "",
  oxygenSaturation: "",
  weight: "",
  height: "",
  painScore: "",
};

const formatDate = (value?: string) => {
  if (!value) return "Not recorded";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "Not recorded";
  return date.toLocaleString();
};

const fullName = (patient: any) =>
  String(patient?.fullName || [patient?.firstName, patient?.lastName].filter(Boolean).join(" ") || "Unknown patient");

const splitList = (value?: string | null) =>
  String(value || "")
    .split(/;|,|\n/g)
    .map((item) => item.trim())
    .filter(Boolean);

const vitalValue = (row: any, key: string) => {
  if (key === "bp") return Number(row?.bpSystolic || 0);
  if (key === "spo2") return Number(row?.spo2Percent || row?.oxygenSaturation || 0);
  if (key === "temp") return Number(row?.temperatureC || row?.temperature || 0);
  if (key === "pulse") return Number(row?.pulseBpm || row?.heartRate || row?.pulseRate || 0);
  if (key === "weight") return Number(row?.weightKg || row?.weight || 0);
  return 0;
};

const vitalSeverity = (key: string, value: number) => {
  if (!value) return "normal";
  if (key === "spo2" && value < 90) return "critical";
  if (key === "temp" && (value >= 39 || value < 35)) return "critical";
  if (key === "bp" && value >= 180) return "critical";
  if (key === "pulse" && (value >= 130 || value < 45)) return "critical";
  if (key === "spo2" && value < 94) return "abnormal";
  if (key === "temp" && (value >= 37.8 || value < 36)) return "abnormal";
  if (key === "bp" && value >= 140) return "abnormal";
  if (key === "pulse" && (value >= 100 || value < 60)) return "abnormal";
  return "normal";
};

function EhrPatientDetail({ patientId, onBack }: { patientId: string; onBack: () => void }) {
  // patientId is passed as prop
  
  const [patient, setPatient] = useState<any>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [centralOrders, setCentralOrders] = useState<any[]>([]);
  const [movementTimeline, setMovementTimeline] = useState<any[]>([]);
  const [currentLocation, setCurrentLocation] = useState<any>(null);
  const [vitals, setVitals] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>("timeline");
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [templateId, setTemplateId] = useState("general");
  const [note, setNote] = useState({ ...emptyNote });
  const [savingNote, setSavingNote] = useState(false);
  const [activeVisitId, setActiveVisitId] = useState("");
  const [visitVersions, setVisitVersions] = useState<any[]>([]);
  const [finalizingVisit, setFinalizingVisit] = useState(false);
  const [amendingNote, setAmendingNote] = useState(false);
  const [radiology, setRadiology] = useState({ procedureName: "", urgency: "ROUTINE", notes: "" });
  const [savingRadiology, setSavingRadiology] = useState(false);
  const [acceptedAiCode, setAcceptedAiCode] = useState("");
  const [timelineSearch, setTimelineSearch] = useState("");

  const fetchPatientData = async () => {
    setLoading(true);
    try {
      const [patientRes, timelineRes, vitalsRes, orderRes, movementRes, locationRes] = await Promise.all([
        api.get(`/patients/${patientId}`),
        api.get(`/medical-records/patient/${patientId}/timeline`).catch(() => ({ data: { timeline: [] } })),
        api.get(`/vitals/patient/${patientId}`).catch(() => ({ data: [] })),
        api.get(`/orchestration/orders`, { params: { patientId, limit: 200 } }).catch(() => ({ data: { data: [] } })),
        api.get(`/orchestration/movements/patient/${patientId}/timeline`).catch(() => ({ data: { data: [] } })),
        api.get(`/orchestration/movements/patient/${patientId}/location`).catch(() => ({ data: null })),
      ]);
      setPatient(patientRes.data);
      const rows = Array.isArray(timelineRes.data?.timeline) ? timelineRes.data.timeline : [];
      setTimeline(rows);
      setVitals(Array.isArray(vitalsRes.data) ? vitalsRes.data : []);
      setCentralOrders(Array.isArray(orderRes.data?.data) ? orderRes.data.data : Array.isArray(orderRes.data) ? orderRes.data : []);
      setMovementTimeline(Array.isArray(movementRes.data?.data) ? movementRes.data.data : []);
      setCurrentLocation(locationRes.data || null);
      setActiveVisitId((current) => (current && rows.some((row: any) => row.id === current) ? current : rows[0]?.id || ""));
    } catch (err: any) {
      setNotice(`Failed to load EMR: ${err?.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (patientId) void fetchPatientData();
  }, [patientId]);

  const currentVisitId = activeVisitId || timeline[0]?.id || "";

  useEffect(() => {
    if (!currentVisitId) {
      setVisitVersions([]);
      return;
    }
    let active = true;
    void api.get(`/medical-records/visit/${currentVisitId}/versions`)
      .then((response) => {
        if (active) setVisitVersions(Array.isArray(response.data?.versions) ? response.data.versions : []);
      })
      .catch(() => {
        if (active) setVisitVersions([]);
      });
    return () => {
      active = false;
    };
  }, [currentVisitId]);
  const allergies = splitList(patient?.allergies);
  const chronicProfileProblems = splitList(patient?.chronicConditions);

  const problemList = useMemo(() => {
    const map = new Map<string, any>();
    chronicProfileProblems.forEach((label) => map.set(label.toLowerCase(), { label, status: "ACTIVE", source: "Patient profile" }));
    timeline.forEach((visit) => {
      (visit.diagnoses || []).forEach((diagnosis: any) => {
        if (diagnosis?.chronic) {
          const label = diagnosis.label || diagnosis.name || diagnosis.code;
          if (label) map.set(String(label).toLowerCase(), { label, code: diagnosis.code, status: "ACTIVE", source: formatDate(visit.visitDate) });
        }
      });
    });
    return Array.from(map.values());
  }, [timeline, patient?.chronicConditions]);

  const activeMedications = useMemo(() => {
    const meds = new Set<string>();
    timeline.forEach((visit) => {
      (visit.orders?.prescriptions || []).forEach((row: any) => {
        if (String(row.status || "").toUpperCase() !== "CANCELLED" && row.medication) meds.add(row.medication);
      });
    });
    return Array.from(meds);
  }, [timeline]);

  const orders = useMemo(() => {
    const rows: any[] = [];
    timeline.forEach((visit) => {
      (visit.orders?.lab || []).forEach((order: any) => rows.push({ ...order, type: "Lab", visitDate: visit.visitDate }));
      (visit.orders?.radiology || []).forEach((order: any) => rows.push({ ...order, type: "Radiology", visitDate: visit.visitDate }));
      (visit.orders?.prescriptions || []).forEach((order: any) => rows.push({ ...order, type: "Prescription", name: order.medication, visitDate: visit.visitDate }));
    });
    centralOrders.forEach((order) => rows.push({
      ...order,
      id: order.id,
      type: order.orderType || "Clinical order",
      name: order.orderNumber || order.destinationModule || order.orderType,
      status: order.status,
      createdAt: order.orderedAt,
      central: true,
    }));
    return rows.sort((a, b) => new Date(b.createdAt || b.visitDate || 0).getTime() - new Date(a.createdAt || a.visitDate || 0).getTime());
  }, [timeline, centralOrders]);

  const criticalResults = useMemo(() => centralOrders.flatMap((order) => (order.results || []).filter((result: any) => result.critical && !((order.acknowledgements || []).some((ack: any) => ack.resultId === result.id))).map((result: any) => ({ order, result }))), [centralOrders]);

  const timelineEvents = useMemo(() => {
    const events: any[] = [];
    timeline.forEach((visit) => {
      events.push({
        type: "Visit",
        title: `${visit.visitType || "Visit"} encounter`,
        date: visit.visitDate,
        description: visit.soap?.chiefComplaint || visit.status || "Clinical encounter",
      });
      if (visit.soap?.history || visit.soap?.assessment || visit.soap?.plan) {
        events.push({
          type: "Note",
          title: "Clinical note",
          date: visit.visitDate,
          description: [visit.soap?.history, visit.soap?.examination, visit.soap?.assessment, visit.soap?.plan].filter(Boolean).join("\n\n"),
        });
      }
      (visit.diagnoses || []).forEach((diagnosis: any) => events.push({
        type: "Diagnosis",
        title: diagnosis.code ? `${diagnosis.code} - ${diagnosis.label}` : diagnosis.label,
        date: visit.visitDate,
        description: diagnosis.chronic ? "Added to problem list" : diagnosis.type || "Encounter diagnosis",
      }));
      (visit.vitals || []).forEach((row: any) => events.push({
        type: "Vitals",
        title: "Vital signs recorded",
        date: row.recordedAt,
        description: `BP ${row.bpSystolic || "-"}/${row.bpDiastolic || "-"} · HR ${row.pulseBpm || row.heartRate || "-"} · SpO2 ${row.spo2Percent || row.oxygenSaturation || "-"}% · Temp ${row.temperatureC || row.temperature || "-"}C`,
      }));
      (visit.orders?.lab || []).forEach((row: any) => events.push({ type: "Lab", title: row.name, date: row.createdAt, description: `Status: ${row.status}${row.resultCount ? ` · ${row.resultCount} result(s)` : ""}` }));
      (visit.orders?.radiology || []).forEach((row: any) => events.push({ type: "Radiology", title: row.name, date: row.createdAt, description: `Status: ${row.status}${row.reportCount ? ` · ${row.reportCount} report(s)` : ""}` }));
      (visit.orders?.prescriptions || []).forEach((row: any) => events.push({ type: "Prescription", title: row.medication, date: row.createdAt, description: `${row.dosage || ""} ${row.frequency || ""} for ${row.duration || ""} · ${row.status || "PENDING"}` }));
    });
    movementTimeline.forEach((event: any) => events.push({
      type: "Movement",
      title: `${event.originModule || "Care"} → ${event.destinationModule || "Destination"}`,
      date: event.occurredAt,
      description: `${event.toStatus || "Movement update"}${event.reason ? ` · ${event.reason}` : ""}`,
    }));
    return events.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
  }, [timeline, movementTimeline]);

  const filteredTimelineEvents = useMemo(() => {
    const query = timelineSearch.trim().toLowerCase();
    if (!query) return timelineEvents;
    return timelineEvents.filter((event) =>
      [event.type, event.title, event.description, formatDate(event.date)]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [timelineEvents, timelineSearch]);

  const aiSuggestions = useMemo(() => {
    const context = `${note.chiefComplaint} ${note.history} ${note.examination} ${note.assessment} ${note.plan}`.toLowerCase();
    return ICD_HINTS.filter((hint) => hint.terms.some((term) => context.includes(term))).slice(0, 4);
  }, [note]);

  const dischargeDraft = useMemo(() => {
    const latest = timeline[0];
    return [
      `Patient: ${fullName(patient)} (${patient?.patientCode || "No MRN"})`,
      `Admission/encounter summary: ${latest?.soap?.chiefComplaint || latest?.visitType || "Clinical encounter"}.`,
      `Key diagnoses: ${timeline.flatMap((visit) => visit.diagnoses || []).map((d: any) => d.code ? `${d.code} ${d.label}` : d.label).slice(0, 5).join("; ") || "Not documented"}.`,
      `Treatment/orders: ${orders.slice(0, 6).map((order) => `${order.type}: ${order.name} (${order.status})`).join("; ") || "No orders recorded"}.`,
      `Follow-up plan: ${latest?.soap?.plan || "Doctor to review, edit, and sign."}`,
    ].join("\n");
  }, [patient, timeline, orders]);

  const applyTemplate = (id: string) => {
    const template = NOTE_TEMPLATES.find((row) => row.id === id) || NOTE_TEMPLATES[0];
    setTemplateId(id);
    setNote((prev) => ({
      ...prev,
      chiefComplaint: template.chiefComplaint,
      history: template.history,
      examination: template.examination,
      assessment: template.assessment,
      plan: template.plan,
    }));
  };

  const saveClinicalNote = async () => {
    const clinicalText = [
      note.chiefComplaint,
      note.history,
      note.examination,
      note.assessment,
      note.plan,
      note.diagnosisLabel,
      note.icd10,
      acceptedAiCode,
    ].some((value) => String(value || "").trim());
    const vitalsPayload = {
      temperature: note.temperature.trim(),
      bloodPressure: note.bloodPressure.trim(),
      pulseRate: note.pulseRate.trim(),
      respiratoryRate: note.respiratoryRate.trim(),
      oxygenSaturation: note.oxygenSaturation.trim(),
      weight: note.weight.trim(),
      height: note.height.trim(),
      painScore: note.painScore.trim(),
    };
    const hasVitals = Object.values(vitalsPayload).some(Boolean);
    if (!clinicalText && !hasVitals) {
      setNotice("Enter a clinical note, diagnosis, or vital signs before saving.");
      return;
    }

    setSavingNote(true);
    try {
      if (amendingNote) {
        const reason = window.prompt("Reason for this formal amendment:")?.trim();
        if (!reason) {
          setNotice("An amendment reason is required; the original signed note was not changed.");
          return;
        }
        await api.post(`/medical-records/amend/${currentVisitId}`, {
          reason,
          chiefComplaint: note.chiefComplaint,
          history: note.history,
          examination: note.examination,
          assessment: note.assessment,
          plan: note.plan,
        });
        setAmendingNote(false);
        setNote({ ...emptyNote });
        setNotice("Formal amendment saved. The original signed note remains preserved in the record history.");
        try {
          const versionsResponse = await api.get(`/medical-records/visit/${currentVisitId}/versions`);
          setVisitVersions(Array.isArray(versionsResponse.data?.versions) ? versionsResponse.data.versions : []);
        } catch {
          // The amendment succeeded; history can be refreshed on the next load.
        }
        await fetchPatientData();
        return;
      }
      const res = await api.post("/medical-records/visit-entry", {
        patientId,
        visitId: currentVisitId || undefined,
        visitType: "OPD",
        chiefComplaint: note.chiefComplaint || "EMR documentation",
        history: note.history,
        examination: note.examination,
        assessment: note.assessment || note.diagnosisLabel,
        plan: note.plan,
        diagnosis: note.diagnosisLabel
          ? [{ label: note.diagnosisLabel, code: note.icd10 || acceptedAiCode || undefined, chronic: note.addToProblemList }]
          : [],
        vitals: vitalsPayload,
      });
      setActiveVisitId(res.data?.visitId || currentVisitId);
      setNotice("Clinical note saved. Timeline, problem list, and vital trends refreshed.");
      setNote({ ...emptyNote });
      setAcceptedAiCode("");
      setActiveTab("timeline");
      await fetchPatientData();
    } catch (err: any) {
      setNotice(`Clinical note failed: ${err?.response?.data?.message || err.message}`);
    } finally {
      setSavingNote(false);
    }
  };

  const beginAmendment = () => {
    const visit = timeline.find((row) => row.id === currentVisitId);
    const diagnosis = (visit?.diagnoses || [])[0] || {};
    setNote({
      ...emptyNote,
      chiefComplaint: visit?.soap?.chiefComplaint || "",
      history: visit?.soap?.history || "",
      examination: visit?.soap?.examination || "",
      assessment: visit?.soap?.assessment || "",
      plan: visit?.soap?.plan || "",
      diagnosisLabel: diagnosis.label || diagnosis.name || "",
      icd10: diagnosis.code || "",
    });
    setAmendingNote(true);
    setActiveTab("notes");
    setNotice("Amendment mode enabled. Edit the note, then save with a documented reason.");
  };

  const createVisit = async () => {
    setSavingNote(true);
    try {
      const res = await api.post("/medical-records/visit-entry", {
        patientId,
        visitType: "OPD",
        chiefComplaint: "EMR documentation encounter",
      });
      setActiveVisitId(res.data?.visitId || "");
      setNotice("EMR encounter opened for ordering and documentation.");
      await fetchPatientData();
    } catch (err: any) {
      setNotice(`Could not open EMR encounter: ${err?.response?.data?.message || err.message}`);
    } finally {
      setSavingNote(false);
    }
  };

  const finalizeEncounter = async () => {
    if (!currentVisitId) {
      setNotice("Open an EMR encounter before finalizing the record.");
      return;
    }
    if (!window.confirm("Finalize this encounter? It will become read-only and require a formal amendment for corrections.")) return;
    setFinalizingVisit(true);
    try {
      await api.post(`/medical-records/finalize/${currentVisitId}`, {
        reason: "Clinician reviewed and finalized EMR encounter",
      });
      setNotice("Encounter finalized and locked. Future corrections must be recorded as formal amendments.");
      try {
        const versionsResponse = await api.get(`/medical-records/visit/${currentVisitId}/versions`);
        setVisitVersions(Array.isArray(versionsResponse.data?.versions) ? versionsResponse.data.versions : []);
      } catch {
        // The finalization succeeded; history can be refreshed on the next load.
      }
      await fetchPatientData();
    } catch (err: any) {
      setNotice(`Encounter could not be finalized: ${err?.response?.data?.message || err.message}`);
    } finally {
      setFinalizingVisit(false);
    }
  };

  const createRadiologyRequest = async () => {
    if (!currentVisitId) return setNotice("Open an EMR encounter before placing radiology orders.");
    if (!radiology.procedureName.trim()) return setNotice("Enter a radiology procedure before routing the order.");
    setSavingRadiology(true);
    try {
      await api.post("/radiology/request", {
        patientId,
        visitId: currentVisitId,
        procedureName: radiology.procedureName.trim(),
        imagingType: radiology.procedureName.trim(),
        urgency: radiology.urgency,
        clinicalIndication: radiology.notes.trim(),
        specialInstructions: radiology.notes.trim(),
        orderSource: "EMR",
        status: "REQUESTED",
      });
      setRadiology({ procedureName: "", urgency: "ROUTINE", notes: "" });
      setNotice("Radiology request routed and added to clinical orders.");
      await fetchPatientData();
    } catch (err: any) {
      setNotice(`Radiology order failed: ${err?.response?.data?.message || err.message}`);
    } finally {
      setSavingRadiology(false);
    }
  };

  const acknowledgeCriticalResult = async (orderId: string, resultId: string) => {
    try {
      await api.post(`/orchestration/orders/${orderId}/acknowledge`, { resultId, action: "REVIEWED", notes: "Reviewed in EMR result inbox." });
      setNotice("Critical result acknowledgement recorded.");
      await fetchPatientData();
    } catch (err: any) {
      setNotice(`Result acknowledgement failed: ${err?.response?.data?.message || err.message}`);
    }
  };

  if (loading) return <div className="emr-shell"><div className="emr-empty">Loading EMR...</div></div>;
  if (!patient) return <div className="emr-shell"><div className="emr-empty">Patient not found.</div></div>;

  return (
    <div className="emr-shell">
      <div className="emr-header">
        <button onClick={() => onBack()} className="emr-back" type="button"><ArrowLeft size={18} /></button>
        <div>
          <h1>{fullName(patient)} <span>{patient.patientCode || patient.mrn || "No MRN"}</span></h1>
          <p>{patient.gender || "Gender N/A"} · DOB {patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : "N/A"} · {patient.phone || patient.phonePrimary || "No phone"}</p>
        </div>
        <button type="button" className="emr-primary-btn" onClick={createVisit} disabled={savingNote}>
          <PlusCircle size={16} /> Open EMR Encounter
        </button>
      </div>

      {allergies.length > 0 ? (
        <div className="emr-allergy-banner">
          <AlertTriangle size={18} />
          <strong>Allergies:</strong>
          <span>{allergies.join(" · ")}</span>
        </div>
      ) : (
        <div className="emr-safe-banner"><CheckCircle2 size={18} /> No allergies documented. Confirm allergy status during prescribing.</div>
      )}
      {currentLocation ? <div className="emr-safe-banner"><Activity size={18} /><strong>Current location:</strong><span>{currentLocation.module} · {currentLocation.location}{currentLocation.responsibleTeam ? ` · ${currentLocation.responsibleTeam}` : ""}</span></div> : null}

      {notice ? <div className={`module-notice-toast is-${notice.toLowerCase().includes("failed") || notice.toLowerCase().includes("could not") ? "error" : "success"}`} role="status" aria-live="polite"><div><strong>EMR &amp; Clinical Notes</strong><span>{notice}</span></div><button type="button" className="module-notice-close" onClick={() => setNotice("")} aria-label="Dismiss notification">×</button></div> : null}

      <div className="emr-layout">
        <aside className="emr-side">
          <section>
            <h2><ClipboardList size={16} /> Problem List</h2>
            {problemList.length === 0 ? <p className="emr-muted">No chronic problems recorded.</p> : problemList.map((problem) => (
              <div key={`${problem.code || ""}-${problem.label}`} className="emr-problem">
                <strong>{problem.code ? `${problem.code} ` : ""}{problem.label}</strong>
                <span>{problem.status} · {problem.source}</span>
              </div>
            ))}
          </section>
          <section>
            <h2><Pill size={16} /> Active Medications</h2>
            {activeMedications.length === 0 ? <p className="emr-muted">No active medication orders.</p> : activeMedications.map((med) => <div key={med} className="emr-med">{med}</div>)}
          </section>
          <section>
            <h2><Activity size={16} /> Latest Vitals</h2>
            {vitals[0] ? (
              <div className="emr-vitals-mini">
                <span>BP {vitals[0].bpSystolic || "-"}/{vitals[0].bpDiastolic || "-"}</span>
                <span>SpO2 {vitals[0].spo2Percent || vitals[0].oxygenSaturation || "-"}%</span>
                <span>Temp {vitals[0].temperatureC || vitals[0].temperature || "-"}C</span>
                <span>HR {vitals[0].pulseBpm || vitals[0].heartRate || "-"}</span>
              </div>
            ) : <p className="emr-muted">No vital signs recorded.</p>}
          </section>
        </aside>

        <main className="emr-main">
          <div className="emr-stat-row">
            {[
              { label: "Timeline Events", value: timelineEvents.length, tab: "timeline", icon: Calendar },
              { label: "Active Problems", value: problemList.length, tab: "notes", icon: ClipboardList },
              { label: "Tracked Orders", value: orders.length, tab: "orders", icon: FlaskConical },
              { label: "Vital Recordings", value: vitals.length, tab: "vitals", icon: HeartPulse },
            ].map(({ label, value, tab, icon: Icon }) => (
              <button key={label} type="button" className="emr-stat-card" onClick={() => setActiveTab(tab as TabKey)}>
                <Icon size={17} />
                <span>{label}</span>
                <strong>{value}</strong>
              </button>
            ))}
          </div>

          <div className="emr-tabs">
            {[
              ["timeline", "Timeline", Calendar],
              ["notes", "Clinical Notes", FileText],
              ["orders", "Orders", FlaskConical],
              ["vitals", "Vital Trends", HeartPulse],
              ["ai", "AI Assist", Bot],
            ].map(([key, label, Icon]: any) => (
              <button key={key} type="button" className={activeTab === key ? "active" : ""} onClick={() => setActiveTab(key)}>
                <Icon size={15} /> {label}
              </button>
            ))}
          </div>

          {activeTab === "timeline" ? (
            <section className="emr-card">
              <div className="emr-card-head"><h2>Unified Patient Timeline</h2><span>{filteredTimelineEvents.length} of {timelineEvents.length} events</span></div>
              <label className="emr-search">
                <Search size={16} />
                <input
                  value={timelineSearch}
                  onChange={(event) => setTimelineSearch(event.target.value)}
                  placeholder="Search visits, notes, diagnoses, orders, vitals"
                />
              </label>
              {filteredTimelineEvents.length === 0 ? <div className="emr-empty">{timelineEvents.length === 0 ? "No clinical events recorded yet." : "No timeline events match your search."}</div> : (
                <div className="emr-timeline">
                  {filteredTimelineEvents.map((event, index) => (
                    <article key={`${event.type}-${event.date}-${index}`}>
                      <div className="emr-timeline-dot" />
                      <div>
                        <header><strong>{event.title || event.type}</strong><span>{formatDate(event.date)}</span></header>
                        <p>{event.description || "No details recorded."}</p>
                        <small>{event.type}</small>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          ) : null}

          {activeTab === "notes" ? (
            <section className="emr-card">
              <div className="emr-card-head"><div><h2>Template-Based Clinical Notes</h2><span className="emr-card-subtitle">{currentVisitId ? "Encounter linked" : "New encounter will be created"}</span></div><span className="emr-lock-state">{visitVersions.some((version) => version.eventName === "emr.record.finalized") ? "FINAL · LOCKED" : "DRAFT"}</span></div>
              <div className="emr-form-grid">
                <label><span>Template</span><select value={templateId} onChange={(event) => applyTemplate(event.target.value)}>{NOTE_TEMPLATES.map((template) => <option key={template.id} value={template.id}>{template.name}</option>)}</select></label>
                <label><span>Diagnosis / problem</span><input value={note.diagnosisLabel} onChange={(event) => setNote({ ...note, diagnosisLabel: event.target.value })} placeholder="e.g. Type 2 diabetes mellitus" /></label>
                <label><span>ICD-10 code</span><input value={note.icd10 || acceptedAiCode} onChange={(event) => setNote({ ...note, icd10: event.target.value })} placeholder="e.g. E11.9" /></label>
                <label className="emr-check"><input type="checkbox" checked={note.addToProblemList} onChange={(event) => setNote({ ...note, addToProblemList: event.target.checked })} /> Add to problem list</label>
                {[
                  ["chiefComplaint", "Chief complaint"],
                  ["history", "History"],
                  ["examination", "Examination"],
                  ["assessment", "Assessment"],
                  ["plan", "Plan"],
                ].map(([key, label]) => (
                  <label key={key} className="wide"><span>{label}</span><textarea value={(note as any)[key]} onChange={(event) => setNote({ ...note, [key]: event.target.value })} /></label>
                ))}
                <label><span>Temperature C</span><input value={note.temperature} onChange={(event) => setNote({ ...note, temperature: event.target.value })} /></label>
                <label><span>Blood pressure</span><input value={note.bloodPressure} onChange={(event) => setNote({ ...note, bloodPressure: event.target.value })} placeholder="145/90" /></label>
                <label><span>Pulse</span><input value={note.pulseRate} onChange={(event) => setNote({ ...note, pulseRate: event.target.value })} /></label>
                <label><span>Resp rate</span><input value={note.respiratoryRate} onChange={(event) => setNote({ ...note, respiratoryRate: event.target.value })} /></label>
                <label><span>SpO2 %</span><input value={note.oxygenSaturation} onChange={(event) => setNote({ ...note, oxygenSaturation: event.target.value })} /></label>
                <label><span>Weight kg</span><input value={note.weight} onChange={(event) => setNote({ ...note, weight: event.target.value })} /></label>
                <label><span>Height cm</span><input value={note.height} onChange={(event) => setNote({ ...note, height: event.target.value })} /></label>
                <label><span>Pain score</span><input value={note.painScore} onChange={(event) => setNote({ ...note, painScore: event.target.value })} placeholder="0-10" /></label>
              </div>
              {aiSuggestions.length > 0 ? (
                <div className="emr-ai-strip">
                  <Bot size={16} /> AI ICD-10 suggestions require approval:
                  {aiSuggestions.map((suggestion) => (
                    <button key={suggestion.code} type="button" onClick={() => { setAcceptedAiCode(suggestion.code); setNote((prev) => ({ ...prev, icd10: suggestion.code, diagnosisLabel: prev.diagnosisLabel || suggestion.label })); }}>
                      {suggestion.code} {suggestion.label}
                    </button>
                  ))}
                </div>
              ) : null}
              <div className="emr-form-footer">{visitVersions.some((version) => version.eventName === "emr.record.finalized") && !amendingNote ? <button type="button" className="emr-finalize-btn" onClick={beginAmendment}>Create Formal Amendment</button> : null}<button type="button" className="emr-primary-btn" onClick={saveClinicalNote} disabled={savingNote || (!amendingNote && visitVersions.some((version) => version.eventName === "emr.record.finalized"))}><Save size={16} /> {savingNote ? "Saving..." : amendingNote ? "Save Amendment" : "Save Note"}</button><button type="button" className="emr-finalize-btn" onClick={finalizeEncounter} disabled={finalizingVisit || !currentVisitId || amendingNote || visitVersions.some((version) => version.eventName === "emr.record.finalized")}>{finalizingVisit ? "Finalizing..." : "Finalize & Lock Encounter"}</button></div>
              {visitVersions.length > 0 ? <div className="emr-version-history"><strong>Record history</strong>{visitVersions.slice(0, 5).map((version) => <span key={version.id}>{version.eventName === "emr.record.finalized" ? "Finalized" : `Version ${version.version || "-"}`} · {formatDate(version.createdAt)} · {version.actorRole || "Clinician"}</span>)}</div> : null}
            </section>
          ) : null}

          {activeTab === "orders" ? (
            <section className="emr-card">
              <div className="emr-card-head"><h2>Clinical Order Management</h2><span>{orders.length} tracked orders</span></div>
              {criticalResults.length > 0 ? <div className="emr-allergy-banner"><AlertTriangle size={18} /><strong>Critical result inbox:</strong><span>{criticalResults.length} result(s) require acknowledgement.</span></div> : null}
              {criticalResults.map(({ order, result }) => <div key={result.id} className="emr-problem"><strong>{order.orderNumber || order.orderType} · Critical result</strong><span>{result.criticalReason || result.interpretation || "Immediate clinical review required."} <button type="button" className="emr-primary-btn" onClick={() => acknowledgeCriticalResult(order.id, result.id)}>Acknowledge</button></span></div>)}
              <div className="emr-order-list">
                {orders.length === 0 ? <div className="emr-empty">No orders placed yet.</div> : orders.map((order) => (
                  <div key={`${order.type}-${order.id}`}><strong>{order.type}: {order.name}</strong><span>{order.status || "PENDING"} · {formatDate(order.createdAt || order.visitDate)}</span></div>
                ))}
              </div>
              {!currentVisitId ? <button type="button" className="emr-primary-btn" onClick={createVisit}>Open encounter before ordering</button> : (
                <div className="emr-order-forms">
                  <PrescriptionForm visitId={currentVisitId} patientId={patientId} activeMedications={activeMedications} allergies={patient?.allergies || ""} onSuccess={fetchPatientData} />
                  <LabRequestForm visitId={currentVisitId} patientId={patientId} onSuccess={fetchPatientData} />
                  <div className="emr-rad-form">
                    <h3><Radio size={17} /> Radiology Request</h3>
                    <input value={radiology.procedureName} onChange={(event) => setRadiology({ ...radiology, procedureName: event.target.value })} placeholder="Procedure name, e.g. Chest X-ray" />
                    <select value={radiology.urgency} onChange={(event) => setRadiology({ ...radiology, urgency: event.target.value })}><option>ROUTINE</option><option>URGENT</option><option>STAT</option></select>
                    <textarea value={radiology.notes} onChange={(event) => setRadiology({ ...radiology, notes: event.target.value })} placeholder="Clinical indication" />
                    <button type="button" className="emr-primary-btn" disabled={savingRadiology || !radiology.procedureName.trim()} onClick={createRadiologyRequest}>{savingRadiology ? "Routing..." : "Order Radiology"}</button>
                  </div>
                  <AdmissionForm visitId={currentVisitId} patientId={patientId} onSuccess={fetchPatientData} />
                </div>
              )}
            </section>
          ) : null}

          {activeTab === "vitals" ? (
            <section className="emr-card">
              <div className="emr-card-head"><h2>Vital Signs Trending</h2><span>{vitals.length} recordings</span></div>
              <div className="emr-chart-grid">
                <VitalTrend title="Blood pressure systolic" metric="bp" rows={vitals} unit="mmHg" />
                <VitalTrend title="SpO2" metric="spo2" rows={vitals} unit="%" />
                <VitalTrend title="Temperature" metric="temp" rows={vitals} unit="C" />
                <VitalTrend title="Pulse" metric="pulse" rows={vitals} unit="bpm" />
                <VitalTrend title="Weight" metric="weight" rows={vitals} unit="kg" />
              </div>
            </section>
          ) : null}

          {activeTab === "ai" ? (
            <section className="emr-card">
              <div className="emr-card-head"><h2>AI-Assisted Documentation</h2><span>Llama 3.1 8B suggestions require approval</span></div>
              <div className="emr-ai-panel">
                <div>
                  <h3>ICD-10 Coding Suggestions</h3>
                  {aiSuggestions.length === 0 ? <p>No AI coding suggestion yet. Type clinical context in the note screen.</p> : aiSuggestions.map((suggestion) => (
                    <button key={suggestion.code} type="button" onClick={() => { setAcceptedAiCode(suggestion.code); setActiveTab("notes"); }}>
                      Approve {suggestion.code} - {suggestion.label}
                    </button>
                  ))}
                </div>
                <div>
                  <h3>Draft Discharge Summary</h3>
                  <textarea readOnly value={dischargeDraft} />
                  <p>AI draft only. Doctor must review, edit, and sign before saving.</p>
                </div>
              </div>
            </section>
          ) : null}
        </main>
      </div>
    </div>
  );
}

function VitalTrend({ title, metric, rows, unit }: { title: string; metric: string; rows: any[]; unit: string }) {
  const ordered = [...rows].filter((row) => vitalValue(row, metric) > 0).sort((a, b) => new Date(a.recordedAt || 0).getTime() - new Date(b.recordedAt || 0).getTime()).slice(-12);
  const values = ordered.map((row) => vitalValue(row, metric));
  const min = Math.min(...values, 0);
  const max = Math.max(...values, 1);
  return (
    <div className="emr-chart">
      <h3>{title}</h3>
      {ordered.length === 0 ? <p>No data</p> : (
        <svg viewBox="0 0 320 120" role="img" aria-label={title}>
          <polyline
            fill="none"
            stroke="#2563eb"
            strokeWidth="3"
            points={ordered.map((row, index) => {
              const x = ordered.length === 1 ? 160 : 20 + (index * 280) / (ordered.length - 1);
              const y = 100 - ((vitalValue(row, metric) - min) / Math.max(1, max - min)) * 80;
              return `${x},${y}`;
            }).join(" ")}
          />
          {ordered.map((row, index) => {
            const value = vitalValue(row, metric);
            const x = ordered.length === 1 ? 160 : 20 + (index * 280) / (ordered.length - 1);
            const y = 100 - ((value - min) / Math.max(1, max - min)) * 80;
            const severity = vitalSeverity(metric, value);
            return <circle key={`${row.id || index}-${metric}`} cx={x} cy={y} r="5" className={`emr-dot-${severity}`} />;
          })}
        </svg>
      )}
      <span>{values.at(-1) || "-"} {unit}</span>
    </div>
  );
}




import { useMemo, useState, useEffect } from "react";






function EhrIndexList({ onSelectPatient }: { onSelectPatient: (id: string) => void }) {
  
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const extractPatientRows = (payload: any) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.patients)) return payload.patients;
    if (Array.isArray(payload?.items)) return payload.items;
    return [];
  };

  const mergePatientRows = (...groups: any[][]) => {
    const seen = new Set<string>();
    const merged: any[] = [];
    groups.flat().forEach((patient) => {
      const key = String(patient?.id || patient?.patientCode || patient?.mrn || "").trim();
      if (!key || seen.has(key)) return;
      seen.add(key);
      merged.push(patient);
    });
    return merged;
  };

  const responseStatus = (result: PromiseSettledResult<any>) =>
    result.status === "rejected" ? Number(result.reason?.response?.status || 0) : 0;

  const patientName = (row: any) =>
    String(
      row.fullName ||
        [row.firstName, row.middleName, row.lastName].filter(Boolean).join(" ") ||
        row.name ||
        "Unknown patient",
    ).trim();

  const patientMrn = (row: any) =>
    String(row.patientCode || row.mrn || row.patient_code || "N/A").trim() || "N/A";

  const patientPhone = (row: any) =>
    String(row.phonePrimary || row.phone || row.phone_secondary || row.phoneSecondary || "N/A").trim() || "N/A";

  const patientNationalId = (row: any) =>
    String(row.nationalId || row.idNumber || row.national_id || row.id_number || "N/A").trim() || "N/A";

  const patientStatus = (row: any) => {
    if (row.isDeceased) return "DECEASED";
    const status = String(row.status || "").trim();
    return status || "ACTIVE";
  };

  const patientRegistrationDateValue = (patient: any) =>
    patient?.patient?.registeredAt ||
    patient?.patient?.createdAt ||
    patient?.data?.registeredAt ||
    patient?.data?.createdAt ||
    patient?.registeredAt ||
    patient?.registered_at ||
    patient?.registeredDate ||
    patient?.dateRegistered ||
    patient?.registrationDate ||
    patient?.registration_date ||
    patient?.registeredOn ||
    patient?.createdAt ||
    patient?.created_at ||
    patient?.createdOn ||
    patient?.payload?.createdAt ||
    patient?.metadata?.createdAt ||
    "";

  const parseRegistrationDate = (patient: any) => {
    const value = patientRegistrationDateValue(patient);
    if (!value) return null;
    const date = value instanceof Date ? value : new Date(String(value));
    return Number.isFinite(date.getTime()) ? date : null;
  };

  const formatRegistrationDate = (patient: any) => {
    const date = parseRegistrationDate(patient);
    return date ? date.toLocaleDateString() : "N/A";
  };

  const hasAllergy = (row: any) => String(row.allergies || "").trim().length > 0;

  const isRegisteredToday = (row: any) => {
    const created = parseRegistrationDate(row);
    if (!created) return false;
    return created.toDateString() === new Date().toDateString();
  };

  useEffect(() => {
    const loadPatients = async () => {
      setLoading(true);
      setLoadError("");
      try {
        const [tenantList, legacyList] = await Promise.allSettled([
          api.get("/tenant/patients"),
          api.get("/patients"),
        ]);
        const rows = mergePatientRows(
          tenantList.status === "fulfilled" ? extractPatientRows(tenantList.value.data) : [],
          legacyList.status === "fulfilled" ? extractPatientRows(legacyList.value.data) : [],
        );
        setPatients(rows);

        const statuses = [responseStatus(tenantList), responseStatus(legacyList)].filter(Boolean);
        if (rows.length === 0 && statuses.every((status) => status === 401)) {
          setLoadError("Your session has expired. Please login again to view EMR patient records.");
        } else if (rows.length === 0 && statuses.length > 0) {
          setLoadError("Patient records could not be loaded from the backend. Check the backend service and retry.");
        }
      } catch {
        setPatients([]);
        setLoadError("Patient records could not be loaded from the backend. Check the backend service and retry.");
      } finally {
        setLoading(false);
      }
    };
    void loadPatients();
  }, []);

  const summary = useMemo(
    () => ({
      total: patients.length,
      active: patients.filter((patient) => patientStatus(patient).toUpperCase() === "ACTIVE").length,
      deceased: patients.filter((patient) => patientStatus(patient).toUpperCase() === "DECEASED").length,
      allergies: patients.filter(hasAllergy).length,
      vulnerable: patients.filter((patient) => Array.isArray(patient.vulnerabilityFlags) && patient.vulnerabilityFlags.length > 0).length,
      registeredToday: patients.filter(isRegisteredToday).length,
    }),
    [patients],
  );

  const tableRows = patients.map((row) => ({
    id: row.id,
    patient: patientName(row),
    mrn: patientMrn(row),
    gender: row.gender || "N/A",
    phone: patientPhone(row),
    nationalId: patientNationalId(row),
    allergies: row.allergies || "None documented",
    nextOfKin: row.nextOfKinName || "N/A",
    status: patientStatus(row),
    registered: formatRegistrationDate(row),
    action: (
      <button
        type="button"
        onClick={() => onSelectPatient(row.id)}
        className="emr-view-btn"
      >
        <Eye size={15} />
        View Timeline
      </button>
    ),
  }));

  return (
    <SimpleModulePlaceholder
      className="emr-index-view"
      title="EMR & Clinical Notes"
      subtitle="Search for a patient to view their longitudinal EMR, clinical timeline, and active encounters."
      icon={<ModuleIcon name="description" />}
      stats={[
        { label: "Total Patients", value: summary.total, color: "#1e3a8a" },
        { label: "Active Records", value: summary.active, color: "#16a34a" },
        { label: "Allergy Alerts", value: summary.allergies, color: "#dc2626" },
        { label: "Vulnerable Patients", value: summary.vulnerable, color: "#d97706" },
        { label: "Registered Today", value: summary.registeredToday, color: "#2563eb" },
        { label: "Deceased Records", value: summary.deceased, color: "#64748b" },
      ]}
      columns={[
        { label: "Patient", key: "patient", className: "pv-name" },
        { label: "MRN", key: "mrn" },
        { label: "Gender", key: "gender" },
        { label: "Phone", key: "phone" },
        { label: "National ID", key: "nationalId" },
        { label: "Status", key: "status" },
        { label: "Registered", key: "registered" },
        { label: "Action", key: "action" },
      ]}
      rows={tableRows}
      useProvidedRows
      useProvidedStats
      searchPlaceholder="Search patient name, MRN, phone, national ID, allergy, or next of kin"
      searchKeys={["patient", "mrn", "gender", "status", "phone", "nationalId", "allergies", "nextOfKin"]}
      afterSearchContent={
        loadError ? (
          <div className="auth-error mb-3">
            {loadError}
            {loadError.toLowerCase().includes("login") ? (
              <button
                type="button"
                className="topbar-logout-btn ml-3"
                onClick={() => window.location.reload()}
              >
                Login
              </button>
            ) : null}
          </div>
        ) : loading ? (
          <div className="pv-subtitle mb-3">Loading patient records...</div>
        ) : null
      }
      actions={
        <>
          <button
            className="topbar-logout-btn"
            type="button"
            onClick={() => {
              const firstPatient = patients[0];
              if (firstPatient?.id) if (firstPatient?.id) onSelectPatient(firstPatient.id);
            }}
            disabled={patients.length === 0}
          >
            <ModuleIcon name="description" /> Open First EMR
          </button>
        </>
      }
    />
  );
}



export default function EHRView({ initialPatientId }: { initialPatientId?: string }) {
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(initialPatientId || null);

  useEffect(() => {
    if (initialPatientId) setSelectedPatientId(initialPatientId);
  }, [initialPatientId]);

  if (selectedPatientId) {
    return <EhrPatientDetail patientId={selectedPatientId} onBack={() => setSelectedPatientId(null)} />;
  }

  return <EhrIndexList onSelectPatient={(id) => setSelectedPatientId(id)} />;
}

export { EHRView, EHRView as EhrView };
