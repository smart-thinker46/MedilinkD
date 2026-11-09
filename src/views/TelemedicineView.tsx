
import type { FormEvent, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardCheck,
  Copy,
  ExternalLink,
  FileSignature,
  Link2,
  Maximize2,
  Mic,
  Minimize2,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Stethoscope,
  Video,
  X,
} from "lucide-react";
const useRouter = () => ({ push: (path: string) => window.dispatchEvent(new CustomEvent("hmis:navigate", { detail: { path } })) });
import { api } from "../lib/api";
import { useLiveRefresh } from "../lib/liveRefresh";

type TeleModal = "create" | "room" | "consent" | "recording" | "connection" | "complete" | "async" | "file" | "participant" | "follow-up" | "emergency" | "chat" | "";

type JoinLinkState = {
  doctor?: any;
  patient?: any;
};

const unwrapRows = (value: any) => {
  const data = value?.data ?? value;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  return [];
};

const formatDateTime = (value: any) => {
  const date = new Date(String(value || ""));
  if (!Number.isFinite(date.getTime())) return "Not scheduled";
  return date.toLocaleString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

const toDateTimeLocal = (value?: string) => {
  const date = value ? new Date(value) : new Date();
  if (!Number.isFinite(date.getTime())) return new Date().toISOString().slice(0, 16);
  const pad = (input: number) => String(input).padStart(2, "0");
  return [
    date.getFullYear(),
    "-",
    pad(date.getMonth() + 1),
    "-",
    pad(date.getDate()),
    "T",
    pad(date.getHours()),
    ":",
    pad(date.getMinutes()),
  ].join("");
};

const patientLabel = (row: any) => {
  const patient = row?.patient || {};
  return (
    [patient?.firstName, patient?.middleName, patient?.lastName].filter(Boolean).join(" ").trim() ||
    patient?.fullName ||
    patient?.name ||
    patient?.patientCode ||
    patient?.mrn ||
    row?.patientId ||
    "Unknown patient"
  );
};

const doctorLabel = (row: any) => {
  const doctor = row?.doctor || {};
  const base =
    [doctor?.firstName, doctor?.middleName, doctor?.lastName].filter(Boolean).join(" ").trim() ||
    doctor?.fullName ||
    doctor?.name ||
    row?.doctorName ||
    row?.doctorId ||
    "Unassigned doctor";
  return /^dr\.?/i.test(base) ? base : `Dr. ${base}`;
};

const statusLabel = (value: any) => String(value || "BOOKED").replace(/_/g, " ");

const noticeTone = (message: string) => {
  const lower = message.toLowerCase();
  if (/(fail|error|cannot|outside|expired|required|blocked|forbidden)/.test(lower)) return "error";
  if (/(warning|partial|delay|wait|only)/.test(lower)) return "warning";
  return "success";
};

function ModalShell({
  modal,
  title,
  subtitle,
  icon,
  children,
  onClose,
  onSubmit,
  saving,
  saveText,
}: {
  modal: TeleModal;
  title: string;
  subtitle: string;
  icon: ReactNode;
  children: ReactNode;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  saving?: boolean;
  saveText: string;
}) {
  const tone = modal === "create" ? "blue" : modal === "room" ? "purple" : modal === "consent" ? "orange" : modal === "complete" ? "green" : "blue";
  return (
    <div className="module-form-backdrop telemedicine-modal" onClick={onClose}>
      <section className={`module-form-panel telemedicine-modal-panel telemedicine-modal-${tone}`} onClick={(e) => e.stopPropagation()}>
        <header className="module-form-header">
          <div className="module-form-heading">
            <div className="module-form-icon">{icon}</div>
            <div>
              <p className="module-form-kicker">Telemedicine</p>
              <h2 className="module-form-title">{title}</h2>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close form" className="module-form-close">
            <X size={18} />
          </button>
        </header>
        <form onSubmit={onSubmit} className="module-form-body telemedicine-modal-body">
          <div className="telemedicine-modal-note">{subtitle}</div>
          <div className="module-form-grid telemedicine-modal-grid w-full">
            {children}
          </div>
          <footer className="module-form-footer telemedicine-modal-footer">
            <button type="button" onClick={onClose} className="module-form-cancel">Cancel</button>
            <button type="submit" disabled={saving} className="module-form-submit">
              {saving ? "Saving..." : saveText}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
  span = 1,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  span?: number;
}) {
  return (
    <label className={`module-form-field telemedicine-field${span > 1 ? " is-wide" : ""}`}>
      <span>{label} {hint && <small style={{ fontWeight: "normal", color: "#64748b" }}>({hint})</small>}</span>
      {children}
    </label>
  );
}

export default function TelemedicineView() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [modal, setModal] = useState<TeleModal>("");
  const [dashboard, setDashboard] = useState<any>({});
  const [sessions, setSessions] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [expandedTable, setExpandedTable] = useState(false);
  const [joinLinks, setJoinLinks] = useState<JoinLinkState>({});

  const [createForm, setCreateForm] = useState({
    patientId: "",
    doctorId: "",
    scheduledAt: toDateTimeLocal(),
    appointmentId: "",
    sessionType: "VIDEO",
    appointmentMode: "VIRTUAL",
    meetingLink: "",
    consultationFee: "0",
    paymentMethod: "CASH",
    chiefComplaint: "",
    notes: "",
  });
  const [roomForm, setRoomForm] = useState({
    sessionId: "",
    appointmentId: "",
    provider: "JITSI",
    roomCode: "",
    roomExpiresAt: toDateTimeLocal(),
    waitingRoom: true,
  });
  const [consentForm, setConsentForm] = useState({
    consentCaptured: true,
    consentRecording: false,
    consentVersion: "v1",
    consentNotes: "",
  });
  const [recordingForm, setRecordingForm] = useState({
    recordingUrl: "",
    duration: "0",
    consentRecording: false,
    encryptionKeyRef: "",
  });
  const [connectionForm, setConnectionForm] = useState({
    connectionState: "CONNECTED",
    networkQuality: "GOOD",
    latencyMs: "0",
    packetLossPercent: "0",
    notes: "",
  });
  const [completeForm, setCompleteForm] = useState({
    summary: "",
    chiefComplaint: "",
    medication: "",
    dosage: "",
    frequency: "As directed",
    duration: "As prescribed",
    prescriptionNotes: "",
    prescriptionFulfillment: "HOSPITAL_PHARMACY",
    digitalSignatureRef: "",
    localPharmacyName: "",
    homeDeliveryAddress: "",
    labTestName: "",
    radiologyStudy: "",
    specialistReferral: "",
    admissionRequested: false,
    admissionWardId: "",
    admissionBedId: "",
    admissionDiagnosis: "",
    admissionSource: "TELEMEDICINE",
    billAmount: "0",
    markPaid: false,
    issueSickNote: false,
  });
  const [asyncForm, setAsyncForm] = useState({ patientId: "", subject: "", message: "" });
  const [fileForm, setFileForm] = useState({ fileName: "", mimeType: "", sizeBytes: "0", storageReference: "", sha256: "" });
  const [participantForm, setParticipantForm] = useState({ role: "INTERPRETER", participantId: "", authorization: "AUTHENTICATED", joined: true });
  const [followUpForm, setFollowUpForm] = useState({ reviewDate: toDateTimeLocal(new Date(Date.now() + 7 * 86400000).toISOString()), mode: "TELEMEDICINE", departmentId: "", doctorId: "", prerequisites: "" });
  const [emergencyForm, setEmergencyForm] = useState({ disposition: "EMERGENCY_DEPARTMENT", assessment: "", receivingFacility: "" });
  const [chatForm, setChatForm] = useState({ message: "", senderRole: "CLINICIAN", isInternal: false });

  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice((current) => (current === message ? "" : current)), 7000);
  };

  const load = async () => {
    setLoading(true);
    try {
      const [dashboardRes, sessionsRes, patientsRes, staffRes] = await Promise.all([
        api.get("/telemedicine/dashboard").catch(() => ({ data: {} })),
        api.get("/telemedicine/sessions").catch(() => ({ data: [] })),
        api.get("/patients").catch(() => ({ data: [] })),
        api.get("/staff?role=DOCTOR").catch(() => ({ data: [] })),
      ]);
      const nextSessions = unwrapRows(sessionsRes.data);
      setDashboard(dashboardRes.data || {});
      setSessions(nextSessions);
      setPatients(unwrapRows(patientsRes.data));
      setStaff(unwrapRows(staffRes.data));
      setSelectedSessionId((current) => current || nextSessions[0]?.id || "");
    } catch (error: any) {
      showNotice(error?.response?.data?.message || "Telemedicine data could not be loaded.");
      setDashboard({});
      setSessions([]);
      setPatients([]);
      setStaff([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  useLiveRefresh(load, { intervalMs: 45000 });

  const selectedSession = sessions.find((row) => row.id === selectedSessionId) || sessions[0] || null;

  useEffect(() => {
    setJoinLinks({});
  }, [selectedSessionId]);

  const filteredSessions = useMemo(() => {
    const query = search.trim().toLowerCase();
    return sessions.filter((row) => {
      if (statusFilter !== "ALL" && String(row?.status || "").toUpperCase() !== statusFilter) return false;
      if (typeFilter !== "ALL" && String(row?.sessionType || "").toUpperCase() !== typeFilter) return false;
      if (!query) return true;
      return `${patientLabel(row)} ${doctorLabel(row)} ${row?.meetingLink || ""} ${row?.status || ""} ${row?.sessionType || ""}`
        .toLowerCase()
        .includes(query);
    });
  }, [search, sessions, statusFilter, typeFilter]);

  const totals = dashboard?.totals || {};
  const stats = [
    { label: "Today", value: Number(totals.sessionsToday || 0), color: "#0f766e" },
    { label: "Upcoming", value: Number(totals.upcoming || 0), color: "#7c3aed" },
    { label: "In Progress", value: Number(totals.inProgress || 0), color: "#2563eb" },
    { label: "Completed", value: Number(totals.completed || 0), color: "#16a34a" },
    { label: "Chat Messages", value: Number(totals.chatMessages || 0), color: "#f59e0b" },
    { label: "Connectivity Flags", value: Number(totals.connectivityIssues || 0), color: "#dc2626" },
  ];

  const formatPatient = (row: any) => patientLabel(row);
  const formatDoctor = (row: any) => doctorLabel(row);
  const formatType = (value: string) => String(value || "VIDEO").toUpperCase();
  const sessionTypeSummary = selectedSession
    ? `${formatType(selectedSession.sessionType)} / ${String(selectedSession.appointmentMode || "VIRTUAL").toUpperCase()}`
    : "No session selected";

  const openModal = (next: TeleModal) => {
    if (!selectedSession && next !== "create") {
      showNotice("Select a session first.");
      return;
    }
    if (next === "room" && selectedSession) {
      setRoomForm({
        sessionId: selectedSession.id,
        appointmentId: selectedSession.appointmentId || "",
        provider: "JITSI",
        roomCode: selectedSession.videoRoomCode || "",
        roomExpiresAt: toDateTimeLocal(selectedSession.roomExpiresAt || selectedSession.scheduledAt),
        waitingRoom: true,
      });
    }
    if (next === "consent") {
      setConsentForm({
        consentCaptured: true,
        consentRecording: false,
        consentVersion: "v1",
        consentNotes: "",
      });
    }
    if (next === "recording") {
      setRecordingForm({
        recordingUrl: "",
        duration: "0",
        consentRecording: false,
        encryptionKeyRef: "",
      });
    }
    if (next === "connection") {
      setConnectionForm({
        connectionState: "CONNECTED",
        networkQuality: "GOOD",
        latencyMs: "0",
        packetLossPercent: "0",
        notes: "",
      });
    }
    if (next === "complete") {
      setCompleteForm((current) => ({
        ...current,
        chiefComplaint: selectedSession?.patient?.chiefComplaint || "",
      }));
    }
    if (next === "async") setAsyncForm({ patientId: patients[0]?.id || "", subject: "", message: "" });
    if (next === "file") setFileForm({ fileName: "", mimeType: "", sizeBytes: "0", storageReference: "", sha256: "" });
    if (next === "participant") setParticipantForm({ role: "INTERPRETER", participantId: "", authorization: "AUTHENTICATED", joined: true });
    if (next === "follow-up") setFollowUpForm({ reviewDate: toDateTimeLocal(new Date(Date.now() + 7 * 86400000).toISOString()), mode: "TELEMEDICINE", departmentId: "", doctorId: "", prerequisites: "" });
    if (next === "emergency") setEmergencyForm({ disposition: "EMERGENCY_DEPARTMENT", assessment: "", receivingFacility: "" });
    if (next === "chat") setChatForm({ message: "", senderRole: "CLINICIAN", isInternal: false });
    if (next === "create") {
      setCreateForm({
        patientId: patients[0]?.id || "",
        doctorId: staff[0]?.id || "",
        scheduledAt: toDateTimeLocal(),
        appointmentId: "",
        sessionType: "VIDEO",
        appointmentMode: "VIRTUAL",
        meetingLink: "",
        consultationFee: "0",
        paymentMethod: "CASH",
        chiefComplaint: "",
        notes: "",
      });
    }
    setModal(next);
  };

  const openRoomForSession = (row: any) => {
    setSelectedSessionId(row.id);
    setRoomForm({
      sessionId: row.id,
      appointmentId: row.appointmentId || "",
      provider: "JITSI",
      roomCode: row.videoRoomCode || "",
      roomExpiresAt: toDateTimeLocal(row.roomExpiresAt || row.scheduledAt),
      waitingRoom: true,
    });
    setModal("room");
  };

  const requestJoinLinkForSession = async (row: any, role: "doctor" | "patient") => {
    setSelectedSessionId(row.id);
    setSaving(`join-${role}`);
    try {
      const response = await api.get(`/telemedicine/session/${row.id}/video-join`, {
        params: { participantRole: role },
      });
      const data = response.data || {};
      setJoinLinks((current) => ({ ...current, [role]: data }));
      showNotice(`${role === "doctor" ? "Doctor" : "Patient"} join link generated successfully.`);
    } catch (error: any) {
      showNotice(error?.response?.data?.message || "Join link could not be generated.");
    } finally {
      setSaving("");
    }
  };

  const reloadAndFocus = async (sessionId?: string) => {
    await load();
    if (sessionId) setSelectedSessionId(sessionId);
  };

  const copyText = async (value: string, message: string) => {
    if (!value) return showNotice("Nothing to copy.");
    try {
      await navigator.clipboard.writeText(value);
      showNotice(message);
    } catch {
      showNotice("Unable to copy the link right now.");
    }
  };

  const requestJoinLink = async (role: "doctor" | "patient") => {
    if (!selectedSession) return showNotice("Select a session first.");
    setSaving(`join-${role}`);
    try {
      const response = await api.get(`/telemedicine/session/${selectedSession.id}/video-join`, {
        params: { participantRole: role },
      });
      const data = response.data || {};
      setJoinLinks((current) => ({ ...current, [role]: data }));
      showNotice(`${role === "doctor" ? "Doctor" : "Patient"} join link generated successfully.`);
    } catch (error: any) {
      showNotice(error?.response?.data?.message || "Join link could not be generated.");
    } finally {
      setSaving("");
    }
  };

  const provisionRoomNow = async () => {
    if (!selectedSession) return showNotice("Select a session first.");
    setSaving("room");
    try {
      const response = await api.post(`/telemedicine/session/${selectedSession.id}/video-room`, roomForm);
      const room = response.data || {};
      showNotice(`Video room provisioned with ${String(room.videoProvider || "JITSI")} successfully.`);
      setModal("");
      await reloadAndFocus(selectedSession.id);
    } catch (error: any) {
      showNotice(error?.response?.data?.message || "Video room could not be provisioned.");
    } finally {
      setSaving("");
    }
  };

  const saveCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving("create");
    try {
      const response = await api.post("/telemedicine/session", createForm);
      const session = response.data || {};
      showNotice("Telemedicine session created. Provision a room to generate secure join links.");
      setModal("");
      await reloadAndFocus(session.id || selectedSessionId);
    } catch (error: any) {
      showNotice(error?.response?.data?.message || "Telemedicine session could not be created.");
    } finally {
      setSaving("");
    }
  };

  const saveConsent = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedSession) return;
    setSaving("consent");
    try {
      await api.post(`/telemedicine/session/${selectedSession.id}/consent`, consentForm);
      showNotice("Consent captured and linked to the consultation.");
      setModal("");
      await reloadAndFocus(selectedSession.id);
    } catch (error: any) {
      showNotice(error?.response?.data?.message || "Consent could not be saved.");
    } finally {
      setSaving("");
    }
  };

  const saveRecording = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedSession) return;
    setSaving("recording");
    try {
      await api.post(`/telemedicine/session/${selectedSession.id}/recording`, recordingForm);
      showNotice("Recording linked to the consultation record.");
      setModal("");
      await reloadAndFocus(selectedSession.id);
    } catch (error: any) {
      showNotice(error?.response?.data?.message || "Recording could not be saved.");
    } finally {
      setSaving("");
    }
  };

  const saveConnection = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedSession) return;
    setSaving("connection");
    try {
      await api.post(`/telemedicine/session/${selectedSession.id}/connection-log`, connectionForm);
      showNotice("Connection quality logged for the telemedicine session.");
      setModal("");
      await reloadAndFocus(selectedSession.id);
    } catch (error: any) {
      showNotice(error?.response?.data?.message || "Connection log could not be saved.");
    } finally {
      setSaving("");
    }
  };

  const saveCompletion = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedSession) return;
    setSaving("complete");
    try {
      const response = await api.post(`/telemedicine/session/${selectedSession.id}/complete`, completeForm);
      const data = response.data || {};
      showNotice("Telemedicine consultation completed with downstream orders routed.");
      setModal("");
      await reloadAndFocus(data.id || selectedSession.id);
    } catch (error: any) {
      showNotice(error?.response?.data?.message || "Consultation could not be completed.");
    } finally {
      setSaving("");
    }
  };

  const verifyIdentity = async () => {
    if (!selectedSession) return showNotice("Select a session first.");
    setSaving("identity");
    try {
      await api.post(`/telemedicine/session/${selectedSession.id}/identity`, { verified: true, method: "STAFF_CONFIRMED" });
      showNotice("Patient identity verified and waiting room enabled.");
      await reloadAndFocus(selectedSession.id);
    } catch (error: any) { showNotice(error?.response?.data?.message || "Identity verification could not be completed."); }
    finally { setSaving(""); }
  };

  const startConsultation = async () => {
    if (!selectedSession) return showNotice("Select a session first.");
    setSaving("start");
    try {
      await api.patch(`/telemedicine/session/${selectedSession.id}/status`, { status: "IN_PROGRESS" });
      showNotice("Consultation started.");
      await reloadAndFocus(selectedSession.id);
    } catch (error: any) { showNotice(error?.response?.data?.message || "Consultation could not be started."); }
    finally { setSaving(""); }
  };

  const escalateEmergency = async () => {
    if (!selectedSession) return showNotice("Select a session first.");
    if (!window.confirm("Escalate this patient to emergency care?")) return;
    setSaving("emergency");
    try {
      await api.post(`/telemedicine/session/${selectedSession.id}/emergency`, { disposition: "EMERGENCY_DEPARTMENT", assessment: "Emergency identified during telemedicine consultation." });
      showNotice("Emergency escalation recorded. Proceed with clinical handover immediately.");
      await reloadAndFocus(selectedSession.id);
    } catch (error: any) { showNotice(error?.response?.data?.message || "Emergency escalation could not be recorded."); }
    finally { setSaving(""); }
  };

  const requestFollowUp = async () => {
    if (!selectedSession) return showNotice("Select a session first.");
    setSaving("follow-up");
    try {
      await api.post(`/telemedicine/session/${selectedSession.id}/follow-up`, { reviewDate: new Date(Date.now() + 7 * 86400000).toISOString(), mode: "TELEMEDICINE" });
      showNotice("Follow-up requirement recorded for Appointments.");
      await reloadAndFocus(selectedSession.id);
    } catch (error: any) { showNotice(error?.response?.data?.message || "Follow-up could not be recorded."); }
    finally { setSaving(""); }
  };

  const closeEncounter = async () => {
    if (!selectedSession) return showNotice("Select a session first.");
    setSaving("close");
    try {
      await api.post(`/telemedicine/session/${selectedSession.id}/close`);
      showNotice("Telemedicine encounter closed and audit trail completed.");
      await reloadAndFocus(selectedSession.id);
    } catch (error: any) { showNotice(error?.response?.data?.message || "Encounter cannot be closed yet."); }
    finally { setSaving(""); }
  };

  const viewAuditEvents = async () => {
    if (!selectedSession) return showNotice("Select a session first.");
    try {
      const response = await api.get(`/telemedicine/session/${selectedSession.id}/events`);
      const events = Array.isArray(response.data) ? response.data : response.data?.data || [];
      showNotice(`${events.length} auditable event${events.length === 1 ? "" : "s"} recorded for this consultation.`);
    } catch (error: any) { showNotice(error?.response?.data?.message || "Audit events could not be loaded."); }
  };

  const saveAsyncRequest = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setSaving("async");
    try { await api.post("/telemedicine/async", asyncForm); setModal(""); showNotice("Asynchronous consultation submitted for clinical review."); }
    catch (error: any) { showNotice(error?.response?.data?.message || "Asynchronous consultation could not be submitted."); }
    finally { setSaving(""); }
  };

  const saveFile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (!selectedSession) return;
    setSaving("file");
    try { await api.post(`/telemedicine/session/${selectedSession.id}/files`, fileForm); setModal(""); showNotice("File metadata linked to the encounter and queued for scanning."); await reloadAndFocus(selectedSession.id); }
    catch (error: any) { showNotice(error?.response?.data?.message || "File could not be linked."); }
    finally { setSaving(""); }
  };

  const saveParticipant = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (!selectedSession) return;
    setSaving("participant");
    try { await api.post(`/telemedicine/session/${selectedSession.id}/participant`, participantForm); setModal(""); showNotice("Participant event recorded."); await reloadAndFocus(selectedSession.id); }
    catch (error: any) { showNotice(error?.response?.data?.message || "Participant event could not be recorded."); }
    finally { setSaving(""); }
  };

  const saveFollowUp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (!selectedSession) return;
    setSaving("follow-up");
    try { await api.post(`/telemedicine/session/${selectedSession.id}/follow-up`, { ...followUpForm, prerequisites: followUpForm.prerequisites.split(",").map((item) => item.trim()).filter(Boolean) }); setModal(""); showNotice("Follow-up requirement routed to Appointments."); await reloadAndFocus(selectedSession.id); }
    catch (error: any) { showNotice(error?.response?.data?.message || "Follow-up could not be saved."); }
    finally { setSaving(""); }
  };

  const saveEmergency = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (!selectedSession) return;
    setSaving("emergency");
    try { await api.post(`/telemedicine/session/${selectedSession.id}/emergency`, emergencyForm); setModal(""); showNotice("Emergency escalation and handover record created."); await reloadAndFocus(selectedSession.id); }
    catch (error: any) { showNotice(error?.response?.data?.message || "Emergency escalation could not be saved."); }
    finally { setSaving(""); }
  };

  const saveChat = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (!selectedSession) return;
    setSaving("chat");
    try { await api.post(`/telemedicine/session/${selectedSession.id}/chat`, chatForm); setModal(""); showNotice("Secure consultation message sent."); await reloadAndFocus(selectedSession.id); }
    catch (error: any) { showNotice(error?.response?.data?.message || "Message could not be sent."); }
    finally { setSaving(""); }
  };

  const selectedSessionJoinLink = selectedSession?.meetingLink || "";
  const selectedJoinDoctor = joinLinks.doctor?.joinUrl || "";
  const selectedJoinPatient = joinLinks.patient?.joinUrl || "";

  const selectedSessionOrderSummary = useMemo(() => {
    if (!selectedSession) return [];
    return [
      { label: "Consent", value: selectedSession.consentCaptured ? "Captured" : "Pending" },
      { label: "Recording", value: selectedSession.recordingCount || 0 },
      { label: "Chats", value: selectedSession.chatMessageCount || 0 },
      { label: "Connections", value: selectedSession.connectionEventCount || 0 },
      { label: "Issues", value: selectedSession.connectivityIssueCount || 0 },
      { label: "Revenue", value: `KES ${Number(selectedSession.consultationFee || 0).toLocaleString()}` },
    ];
  }, [selectedSession]);

  return (
    <div className={`nursing-view telemedicine-view${expandedTable ? " telemedicine-table-expanded" : ""}`}>
      <div className="mx-auto flex w-full max-w-[1700px] flex-col gap-4">
        {notice ? (
          <div className={`hr-toast telemedicine-toast ${noticeTone(notice)}`} role="status" aria-live="polite">
            <div className="telemedicine-toast-icon">
              <CheckCircle2 size={16} />
            </div>
            <div className="telemedicine-toast-copy">
              <strong>{noticeTone(notice) === "error" ? "Error" : noticeTone(notice) === "warning" ? "Warning" : "Success"}</strong>
              <span>{notice}</span>
            </div>
            <button type="button" onClick={() => setNotice("")} aria-label="Dismiss notification"><X size={14} /></button>
          </div>
        ) : null}

        <div className="pv-header">
          <div className="telemedicine-title-block">
            <div className="telemedicine-title-mark" aria-hidden="true"><Video size={22} /></div>
            <div>
              <p className="pv-kicker">REMOTE CARE DELIVERY</p>
              <h2 className="pv-title">Telemedicine</h2>
              <p className="pv-subtitle">Secure virtual consultations, governed prescriptions, and remote orders connected to the hospital workflow.</p>
            </div>
          </div>
          <div className="nursing-header-actions">
            <button
              type="button"
              className="telemedicine-toolbar-btn is-refresh"
              onClick={() => void load()}
            >
              <RefreshCw size={15} /> Refresh
            </button>
            <button
              type="button"
              className="telemedicine-toolbar-btn is-primary"
              onClick={() => openModal("create")}
            >
              <Plus size={15} /> New Session
            </button>
            <button
              type="button"
              className="telemedicine-toolbar-btn is-info"
              onClick={() => openModal("room")}
            >
              <Video size={15} /> Provision Room
            </button>
            <button type="button" className="telemedicine-toolbar-btn is-warning" onClick={() => openModal("complete")}>
              <ClipboardCheck size={15} /> Complete Consultation
            </button>
            <button type="button" className="telemedicine-toolbar-btn is-neutral" onClick={() => openModal("async")}>
              <FileSignature size={15} /> Async Review
            </button>
          </div>
        </div>

        <div className="pv-stats nursing-stats-grid">
          {stats.map((stat) => (
            <button
              key={stat.label}
              type="button"
              className="pv-stat-card text-left transition hover:-translate-y-0.5 hover:shadow-lg"
              style={{ borderLeft: `4px solid ${stat.color}` }}
              onClick={() => {
                if (stat.label === "Upcoming") setStatusFilter("BOOKED");
                if (stat.label === "In Progress") setStatusFilter("IN_PROGRESS");
                if (stat.label === "Completed") setStatusFilter("COMPLETED");
              }}
            >
              <div className="flex flex-1 flex-col justify-between">
                <span className="pv-stat-label">{stat.label}</span>
                <span className="pv-stat-value">
                  {typeof stat.value === "number" ? stat.value.toLocaleString() : stat.value}
                </span>
              </div>
              <div className="flex items-center">
                <div className="rounded-2xl p-2.5 text-white" style={{ background: stat.color }}>
                  <Stethoscope size={16} />
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="nursing-layout telemedicine-layout">
          <section className="nursing-worklist telemedicine-worklist">
            <div className="pv-search-bar telemedicine-filterbar">
              <div className="pv-search-wrap">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search patient, doctor, room link, status..."
                  className="pv-search"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none focus:border-sky-500"
              >
                <option value="ALL">All statuses</option>
                <option value="BOOKED">Booked</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="IN_PROGRESS">In progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="MISSED">Missed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
              <select
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value)}
                className="rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none focus:border-sky-500"
              >
                <option value="ALL">All types</option>
                <option value="VIDEO">Video</option>
                <option value="AUDIO">Audio</option>
                <option value="CHAT">Chat</option>
              </select>
            </div>

            <div className={`pv-table-wrap telemedicine-table-wrap${expandedTable ? " is-expanded" : ""}`}>
              <div className="telemedicine-table-toolbar"><strong>Telemedicine session worklist</strong><button type="button" onClick={() => setExpandedTable((current) => !current)} aria-label={expandedTable ? "Collapse session table" : "Expand session table"} title={expandedTable ? "Collapse table" : "Expand table"}>{expandedTable ? <Minimize2 size={16} /> : <Maximize2 size={16} />}</button></div>
              <table className="pv-table telemedicine-table">
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Doctor</th>
                    <th>Scheduled</th>
                    <th>Room</th>
                    <th>Type</th>
                    <th>Fee</th>
                    <th>Status</th>
                    <th>Source</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={9} className="pv-empty">
                        Loading telemedicine sessions...
                      </td>
                    </tr>
                  ) : filteredSessions.length > 0 ? (
                    filteredSessions.map((row) => {
                      const selected = row.id === selectedSession?.id;
                      const joinLinkAvailable = Boolean(row.meetingLink);
                      return (
                        <tr
                          key={row.id}
                          onClick={() => setSelectedSessionId(row.id)}
                          className={selected ? "selected" : ""}
                        >
                          <td>
                            <strong>{formatPatient(row)}</strong>
                            <span>{row?.patient?.patientCode || row?.patient?.mrn || row?.patientId || "No MRN"}</span>
                          </td>
                          <td>{formatDoctor(row)}</td>
                          <td>{formatDateTime(row.scheduledAt)}</td>
                          <td>{row.videoRoomCode || "Pending room"}</td>
                          <td>{String(row.sessionType || "VIDEO").toUpperCase()}</td>
                          <td>{Number(row.consultationFee || 0).toLocaleString()}</td>
                          <td>
                            <span className={`telemedicine-status status-${String(row.status || "BOOKED").toLowerCase().replace(/_/g, "-")}`}>
                              {statusLabel(row.status)}
                            </span>
                          </td>
                          <td>{String(row.appointmentMode || "VIRTUAL").toUpperCase()}</td>
                          <td>
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  openRoomForSession(row);
                                }}
                                className="telemedicine-toolbar-btn is-info px-3 py-2 text-[11px]"
                              >
                                <Video size={14} className="mr-1 inline-block" />
                                Room
                              </button>
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  void requestJoinLinkForSession(row, "doctor");
                                }}
                                className="telemedicine-toolbar-btn is-primary px-3 py-2 text-[11px]"
                              >
                                <Link2 size={14} className="mr-1 inline-block" />
                                Join
                              </button>
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setSelectedSessionId(row.id);
                                }}
                                className="telemedicine-toolbar-btn is-neutral px-3 py-2 text-[11px]"
                              >
                                <ExternalLink size={14} className="mr-1 inline-block" />
                                View
                              </button>
                            </div>
                            <div className="mt-2 text-right text-[11px] text-slate-400">
                              {joinLinkAvailable ? "Room ready" : "Secure room pending"}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={9} className="pv-empty">
                        No telemedicine sessions found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="nursing-care-panel telemedicine-case-panel">
            <div className="nursing-care-header telemedicine-case-header">
              <div>
                <span>Selected session</span>
                <strong>{selectedSession ? formatPatient(selectedSession) : "No session selected"}</strong>
              </div>
              <p>{selectedSession ? `With ${formatDoctor(selectedSession)} | ${formatDateTime(selectedSession.scheduledAt)}` : "Pick a session to manage the virtual consultation."}</p>
              {selectedSession ? <span className="telemedicine-session-pill">{statusLabel(selectedSession.status)}</span> : null}
            </div>

            {selectedSession ? (
              <div className="telemedicine-case-body">
                <div className="telemedicine-toolbar">
                  <button type="button" className="telemedicine-toolbar-btn is-neutral" onClick={() => void verifyIdentity()} disabled={saving === "identity"}><ShieldCheck size={15} /> Verify Identity</button>
                  <button type="button" className="telemedicine-toolbar-btn is-success" onClick={() => void startConsultation()} disabled={saving === "start"}><Video size={15} /> Start</button>
                  <button type="button" className="telemedicine-toolbar-btn is-primary" onClick={() => void requestJoinLink("doctor")} disabled={saving === "join-doctor"}>
                    <Link2 size={15} /> Doctor Link
                  </button>
                  <button type="button" className="telemedicine-toolbar-btn is-info" onClick={() => void requestJoinLink("patient")} disabled={saving === "join-patient"}>
                    <Link2 size={15} /> Patient Link
                  </button>
                  <button type="button" className="telemedicine-toolbar-btn is-warning" onClick={() => openModal("complete")}>
                    <ClipboardCheck size={15} /> Complete
                  </button>
                  <button type="button" className="telemedicine-toolbar-btn" onClick={() => openModal("room")}>
                    <Video size={15} /> Room
                  </button>
                  <button type="button" className="telemedicine-toolbar-btn" onClick={() => openModal("consent")}>
                    <FileSignature size={15} /> Consent
                  </button>
                  <button type="button" className="telemedicine-toolbar-btn" onClick={() => openModal("recording")}>
                    <Mic size={15} /> Recording
                  </button>
                  <button type="button" className="telemedicine-toolbar-btn" onClick={() => openModal("connection")}>
                    <ShieldCheck size={15} /> Connection
                  </button>
                  <button type="button" className="telemedicine-toolbar-btn is-danger" onClick={() => openModal("emergency")} disabled={saving === "emergency"}><Stethoscope size={15} /> Emergency</button>
                  <button type="button" className="telemedicine-toolbar-btn is-success" onClick={() => openModal("follow-up")} disabled={saving === "follow-up"}><RefreshCw size={15} /> Follow-up</button>
                  <button type="button" className="telemedicine-toolbar-btn is-neutral" onClick={() => void closeEncounter()} disabled={saving === "close"}><CheckCircle2 size={15} /> Close</button>
                  <button type="button" className="telemedicine-toolbar-btn is-neutral" onClick={() => openModal("participant")}><ShieldCheck size={15} /> Participant</button>
                  <button type="button" className="telemedicine-toolbar-btn is-info" onClick={() => openModal("file")}><ExternalLink size={15} /> File</button>
                  <button type="button" className="telemedicine-toolbar-btn is-primary" onClick={() => openModal("chat")}><ClipboardCheck size={15} /> Message</button>
                  <button type="button" className="telemedicine-toolbar-btn is-neutral" onClick={() => void viewAuditEvents()}><FileSignature size={15} /> Audit</button>
                </div>

                <div className="telemedicine-summary-grid">
                  {selectedSessionOrderSummary.map((item) => (
                    <div key={item.label} className="pv-stat-card telemedicine-mini-card" style={{ borderLeftColor: item.label === "Issues" ? "#dc2626" : item.label === "Revenue" ? "#0f766e" : "#2563eb" }}>
                      <p className="pv-stat-label">{item.label}</p>
                      <p className="pv-stat-value">{item.value}</p>
                    </div>
                  ))}
                </div>

                <div className="telemedicine-info-grid">
                  <div className="telemedicine-info-card">
                    <p className="telemedicine-info-kicker">Video room</p>
                    <h3>{selectedSession.meetingLink ? "Secure room provisioned" : "Room not yet provisioned"}</h3>
                    <p>Join links are only active during the consultation window and expire after the appointment.</p>
                    <div className="telemedicine-link-grid">
                      <div className="telemedicine-link-row">
                        <div>
                          <span>Doctor</span>
                          <strong>{joinLinks.doctor?.joinUrl || selectedSessionJoinLink || "Generate a doctor join link"}</strong>
                        </div>
                        <div className="telemedicine-link-actions">
                          <button type="button" onClick={() => void requestJoinLink("doctor")} className="telemedicine-link-btn">Generate</button>
                          <button type="button" onClick={() => copyText(joinLinks.doctor?.joinUrl || selectedSessionJoinLink, "Doctor join link copied to clipboard.")} className="telemedicine-link-icon"><Copy size={14} /></button>
                        </div>
                      </div>
                      <div className="telemedicine-link-row">
                        <div>
                          <span>Patient</span>
                          <strong>{joinLinks.patient?.joinUrl || "Generate a patient join link"}</strong>
                        </div>
                        <div className="telemedicine-link-actions">
                          <button type="button" onClick={() => void requestJoinLink("patient")} className="telemedicine-link-btn">Generate</button>
                          <button type="button" onClick={() => copyText(joinLinks.patient?.joinUrl || "", "Patient join link copied to clipboard.")} className="telemedicine-link-icon"><Copy size={14} /></button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="telemedicine-info-card">
                    <p className="telemedicine-info-kicker">Session summary</p>
                    <div className="telemedicine-summary-list">
                      <div><span>Appointment mode</span><strong>{sessionTypeSummary}</strong></div>
                      <div><span>Consultation fee</span><strong>KES {Number(selectedSession.consultationFee || 0).toLocaleString()}</strong></div>
                      <div><span>Payment method</span><strong>{selectedSession.paymentMethod || "CASH"}</strong></div>
                      <div><span>Status</span><strong>{statusLabel(selectedSession.status)}</strong></div>
                    </div>
                  </div>
                </div>

                <div className="telemedicine-bottom-grid">
                  <div className="telemedicine-info-card">
                    <p className="telemedicine-info-kicker">Digital prescription</p>
                    <p>The completion workflow can issue a digitally signed prescription and route it to the pharmacy, local pharmacy, or home delivery.</p>
                    <div className="telemedicine-summary-list">
                      <div><span>Medication</span><strong>{completeForm.medication || "Not entered yet"}</strong></div>
                      <div><span>Fulfilment</span><strong>{completeForm.prescriptionFulfillment.replace(/_/g, " ")}</strong></div>
                    </div>
                  </div>
                  <div className="telemedicine-info-card">
                    <p className="telemedicine-info-kicker">Remote orders</p>
                    <p>Lab, radiology, specialist referrals, and admission requests route from the completed consultation into the wider HMIS.</p>
                    <div className="telemedicine-summary-list">
                      <div><span>Lab order</span><strong>{completeForm.labTestName || "None"}</strong></div>
                      <div><span>Radiology order</span><strong>{completeForm.radiologyStudy || "None"}</strong></div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="telemedicine-empty">
                <div className="telemedicine-empty-icon">
                  <Video size={26} />
                </div>
                <h3>No telemedicine session selected</h3>
                <p>Select a session from the worklist or create a new consultation to start a secure virtual visit.</p>
              </div>
            )}
          </section>
        </div>
      </div>

      {modal === "create" ? (
        <div className="fixed inset-0 z-50 bg-slate-950/60 px-4 py-6 backdrop-blur-sm" onClick={() => setModal("")}>
          <ModalShell
            modal="create"
            title="New Telemedicine Session"
            subtitle="Create a secure virtual consultation and route it back into the HMIS workflow."
            icon={<Video size={20} />}
            onClose={() => setModal("")}
            onSubmit={saveCreate}
            saving={saving === "create"}
            saveText="Create Session"
          >
            <div className="grid w-full gap-4 md:col-span-2 md:grid-cols-2">
              <Field label="Patient">
                <select
                  value={createForm.patientId}
                  onChange={(event) => setCreateForm((current) => ({ ...current, patientId: event.target.value }))}
                  
                >
                  <option value="">Select patient</option>
                  {patients.map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {formatPatient(patient)} {patient.patientCode || patient.mrn ? `(${patient.patientCode || patient.mrn})` : ""}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Doctor">
                <select
                  value={createForm.doctorId}
                  onChange={(event) => setCreateForm((current) => ({ ...current, doctorId: event.target.value }))}
                  
                >
                  <option value="">Select doctor</option>
                  {staff.map((person) => (
                    <option key={person.id} value={person.id}>
                      {formatDoctor(person)} {person.specialization ? `(${person.specialization})` : ""}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Scheduled At">
                <input
                  type="datetime-local"
                  value={createForm.scheduledAt}
                  onChange={(event) => setCreateForm((current) => ({ ...current, scheduledAt: event.target.value }))}
                  
                />
              </Field>
              <Field label="Appointment ID" hint="Optional. If entered, it seeds the secure room code.">
                <input
                  value={createForm.appointmentId}
                  onChange={(event) => setCreateForm((current) => ({ ...current, appointmentId: event.target.value }))}
                  
                  placeholder="APPT-0001"
                />
              </Field>
              <Field label="Session Type">
                <select
                  value={createForm.sessionType}
                  onChange={(event) => setCreateForm((current) => ({ ...current, sessionType: event.target.value }))}
                  
                >
                  <option value="VIDEO">Video</option>
                  <option value="AUDIO">Audio</option>
                  <option value="CHAT">Chat</option>
                </select>
              </Field>
              <Field label="Appointment Mode">
                <select
                  value={createForm.appointmentMode}
                  onChange={(event) => setCreateForm((current) => ({ ...current, appointmentMode: event.target.value }))}
                  
                >
                  <option value="VIRTUAL">Virtual</option>
                  <option value="FOLLOW_UP">Follow-up</option>
                  <option value="REMOTE">Remote consult</option>
                </select>
              </Field>
              <Field label="Consultation Fee">
                <input
                  type="number"
                  min="0"
                  value={createForm.consultationFee}
                  onChange={(event) => setCreateForm((current) => ({ ...current, consultationFee: event.target.value }))}
                  
                />
              </Field>
              <Field label="Payment Method">
                <select
                  value={createForm.paymentMethod}
                  onChange={(event) => setCreateForm((current) => ({ ...current, paymentMethod: event.target.value }))}
                  
                >
                  <option value="CASH">Cash</option>
                  <option value="INSURANCE">Insurance</option>
                  <option value="MOBILE MONEY">Mobile Money</option>
                  <option value="WAIVED">Waived</option>
                </select>
              </Field>
              <Field label="Meeting Link" span={2} hint="Optional custom link. If empty, the backend can provision a Jitsi/Daily room automatically.">
                <input
                  value={createForm.meetingLink}
                  onChange={(event) => setCreateForm((current) => ({ ...current, meetingLink: event.target.value }))}
                  
                  placeholder="https://meet.jit.si/..."
                />
              </Field>
              <Field label="Chief Complaint" span={2}>
                <textarea
                  rows={3}
                  value={createForm.chiefComplaint}
                  onChange={(event) => setCreateForm((current) => ({ ...current, chiefComplaint: event.target.value }))}
                  
                  placeholder="Reason for the telemedicine visit"
                />
              </Field>
              <Field label="Notes" span={2}>
                <textarea
                  rows={3}
                  value={createForm.notes}
                  onChange={(event) => setCreateForm((current) => ({ ...current, notes: event.target.value }))}
                  
                  placeholder="Session notes, follow-up instructions, and anything relevant"
                />
              </Field>
            </div>
          </ModalShell>
        </div>
      ) : null}

      {modal === "room" ? (
        <div className="fixed inset-0 z-50 bg-slate-950/60 px-4 py-6 backdrop-blur-sm" onClick={() => setModal("")}>
          <ModalShell
            modal="room"
            title="Provision Secure Video Room"
            subtitle="Generate a room that is tied to the consultation and produces time-limited patient and doctor join links."
            icon={<Video size={20} />}
            onClose={() => setModal("")}
            onSubmit={(event) => {
              event.preventDefault();
              void provisionRoomNow();
            }}
            saving={saving === "room"}
            saveText="Provision Room"
          >
            <div className="grid w-full gap-4 md:col-span-2 md:grid-cols-2">
              <Field label="Session">
                <select
                  value={roomForm.sessionId}
                  onChange={(event) => setRoomForm((current) => ({ ...current, sessionId: event.target.value }))}
                  
                >
                  <option value="">Select session</option>
                  {sessions.map((row) => (
                    <option key={row.id} value={row.id}>
                      {formatPatient(row)} • {formatDateTime(row.scheduledAt)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Appointment ID" hint="Used to seed the room code when available.">
                <input
                  value={roomForm.appointmentId}
                  onChange={(event) => setRoomForm((current) => ({ ...current, appointmentId: event.target.value }))}
                  
                  placeholder="APPT-0001"
                />
              </Field>
              <Field label="Provider">
                <select
                  value={roomForm.provider}
                  onChange={(event) => setRoomForm((current) => ({ ...current, provider: event.target.value }))}
                  
                >
                  <option value="JITSI">Jitsi</option>
                  <option value="DAILY">Daily</option>
                </select>
              </Field>
              <Field label="Room Code">
                <input
                  value={roomForm.roomCode}
                  onChange={(event) => setRoomForm((current) => ({ ...current, roomCode: event.target.value }))}
                  
                  placeholder="leave blank to auto-generate"
                />
              </Field>
              <Field label="Room Expires At">
                <input
                  type="datetime-local"
                  value={roomForm.roomExpiresAt}
                  onChange={(event) => setRoomForm((current) => ({ ...current, roomExpiresAt: event.target.value }))}
                  
                />
              </Field>
              <label className="module-form-field telemedicine-field telemedicine-check is-wide">
                <input
                  type="checkbox"
                  checked={roomForm.waitingRoom}
                  onChange={(event) => setRoomForm((current) => ({ ...current, waitingRoom: event.target.checked }))}
                />
                Enable waiting room and controlled admission into the call
              </label>
            </div>
          </ModalShell>
        </div>
      ) : null}

      {modal === "consent" ? (
        <div className="fixed inset-0 z-50 bg-slate-950/60 px-4 py-6 backdrop-blur-sm" onClick={() => setModal("")}>
          <ModalShell
            modal="consent"
            title="Capture Consent"
            subtitle="Document consent for the consultation and optional recording."
            icon={<FileSignature size={20} />}
            onClose={() => setModal("")}
            onSubmit={saveConsent}
            saving={saving === "consent"}
            saveText="Save Consent"
          >
            <div className="grid w-full gap-4 md:col-span-2 md:grid-cols-2">
              <label className="module-form-field telemedicine-field telemedicine-check">
                <input
                  type="checkbox"
                  checked={consentForm.consentCaptured}
                  onChange={(event) => setConsentForm((current) => ({ ...current, consentCaptured: event.target.checked }))}
                />
                Consent captured
              </label>
              <label className="module-form-field telemedicine-field telemedicine-check">
                <input
                  type="checkbox"
                  checked={consentForm.consentRecording}
                  onChange={(event) => setConsentForm((current) => ({ ...current, consentRecording: event.target.checked }))}
                />
                Recording consent given
              </label>
              <Field label="Consent Version">
                <input
                  value={consentForm.consentVersion}
                  onChange={(event) => setConsentForm((current) => ({ ...current, consentVersion: event.target.value }))}
                  
                />
              </Field>
              <Field label="Consent Notes" span={2}>
                <textarea
                  rows={4}
                  value={consentForm.consentNotes}
                  onChange={(event) => setConsentForm((current) => ({ ...current, consentNotes: event.target.value }))}
                  
                  placeholder="Document what the patient agreed to, and any special remarks."
                />
              </Field>
            </div>
          </ModalShell>
        </div>
      ) : null}

      {modal === "recording" ? (
        <div className="fixed inset-0 z-50 bg-slate-950/60 px-4 py-6 backdrop-blur-sm" onClick={() => setModal("")}>
          <ModalShell
            modal="recording"
            title="Attach Recording"
            subtitle="Save the recording URL and record whether consent was captured for the recording itself."
            icon={<Mic size={20} />}
            onClose={() => setModal("")}
            onSubmit={saveRecording}
            saving={saving === "recording"}
            saveText="Save Recording"
          >
            <div className="grid w-full gap-4 md:col-span-2 md:grid-cols-2">
              <Field label="Recording URL" span={2}>
                <input
                  value={recordingForm.recordingUrl}
                  onChange={(event) => setRecordingForm((current) => ({ ...current, recordingUrl: event.target.value }))}
                  
                  placeholder="https://..."
                />
              </Field>
              <Field label="Duration (seconds)">
                <input
                  type="number"
                  min="0"
                  value={recordingForm.duration}
                  onChange={(event) => setRecordingForm((current) => ({ ...current, duration: event.target.value }))}
                  
                />
              </Field>
              <Field label="Encryption Key Ref">
                <input
                  value={recordingForm.encryptionKeyRef}
                  onChange={(event) => setRecordingForm((current) => ({ ...current, encryptionKeyRef: event.target.value }))}
                  
                  placeholder="PKI / storage reference"
                />
              </Field>
              <label className="module-form-field telemedicine-field telemedicine-check">
                <input
                  type="checkbox"
                  checked={recordingForm.consentRecording}
                  onChange={(event) => setRecordingForm((current) => ({ ...current, consentRecording: event.target.checked }))}
                />
                Recording consent documented
              </label>
            </div>
          </ModalShell>
        </div>
      ) : null}

      {modal === "connection" ? (
        <div className="fixed inset-0 z-50 bg-slate-950/60 px-4 py-6 backdrop-blur-sm" onClick={() => setModal("")}>
          <ModalShell
            modal="connection"
            title="Log Connection Quality"
            subtitle="Record the state of the browser connection, latency, packet loss, and any quality concerns."
            icon={<ShieldCheck size={20} />}
            onClose={() => setModal("")}
            onSubmit={saveConnection}
            saving={saving === "connection"}
            saveText="Save Log"
          >
            <div className="grid w-full gap-4 md:col-span-2 md:grid-cols-2">
              <Field label="Connection State">
                <select
                  value={connectionForm.connectionState}
                  onChange={(event) => setConnectionForm((current) => ({ ...current, connectionState: event.target.value }))}
                  
                >
                  <option value="CONNECTED">Connected</option>
                  <option value="STABLE">Stable</option>
                  <option value="UNSTABLE">Unstable</option>
                  <option value="DISCONNECTED">Disconnected</option>
                </select>
              </Field>
              <Field label="Network Quality">
                <select
                  value={connectionForm.networkQuality}
                  onChange={(event) => setConnectionForm((current) => ({ ...current, networkQuality: event.target.value }))}
                  
                >
                  <option value="GOOD">Good</option>
                  <option value="FAIR">Fair</option>
                  <option value="POOR">Poor</option>
                  <option value="LOW">Low</option>
                </select>
              </Field>
              <Field label="Latency (ms)">
                <input
                  type="number"
                  min="0"
                  value={connectionForm.latencyMs}
                  onChange={(event) => setConnectionForm((current) => ({ ...current, latencyMs: event.target.value }))}
                  
                />
              </Field>
              <Field label="Packet Loss (%)">
                <input
                  type="number"
                  min="0"
                  value={connectionForm.packetLossPercent}
                  onChange={(event) => setConnectionForm((current) => ({ ...current, packetLossPercent: event.target.value }))}
                  
                />
              </Field>
              <Field label="Notes" span={2}>
                <textarea
                  rows={4}
                  value={connectionForm.notes}
                  onChange={(event) => setConnectionForm((current) => ({ ...current, notes: event.target.value }))}
                  
                  placeholder="Describe any audio/video issues or mitigation performed."
                />
              </Field>
            </div>
          </ModalShell>
        </div>
      ) : null}

      {modal === "complete" ? (
        <div className="fixed inset-0 z-50 bg-slate-950/60 px-4 py-6 backdrop-blur-sm" onClick={() => setModal("")}>
          <ModalShell
            modal="complete"
            title="Complete Consultation"
            subtitle="Finalize the telemedicine encounter, issue the digital prescription, and route lab, radiology, referral, and admission orders."
            icon={<ClipboardCheck size={20} />}
            onClose={() => setModal("")}
            onSubmit={saveCompletion}
            saving={saving === "complete"}
            saveText="Complete Visit"
          >
            <div className="grid w-full gap-4 md:col-span-2 md:grid-cols-2">
              <Field label="Consultation Summary" span={2}>
                <textarea
                  rows={3}
                  value={completeForm.summary}
                  onChange={(event) => setCompleteForm((current) => ({ ...current, summary: event.target.value }))}
                  
                  placeholder="Clinical summary, plan, and advice"
                />
              </Field>
              <Field label="Chief Complaint" span={2}>
                <input
                  value={completeForm.chiefComplaint}
                  onChange={(event) => setCompleteForm((current) => ({ ...current, chiefComplaint: event.target.value }))}
                  
                  placeholder="Reason for consultation"
                />
              </Field>
              <div className="md:col-span-2 grid gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-4 lg:grid-cols-2">
                <div className="rounded-2xl bg-white p-4">
                  <p className="text-sm font-semibold text-slate-900">Digital Prescription</p>
                  <div className="mt-4 grid gap-4">
                    <Field label="Medication">
                      <input
                        value={completeForm.medication}
                        onChange={(event) => setCompleteForm((current) => ({ ...current, medication: event.target.value }))}
                        
                        placeholder="Drug name"
                      />
                    </Field>
                    <Field label="Dosage">
                      <input
                        value={completeForm.dosage}
                        onChange={(event) => setCompleteForm((current) => ({ ...current, dosage: event.target.value }))}
                        
                        placeholder="500 mg"
                      />
                    </Field>
                    <Field label="Frequency">
                      <input
                        value={completeForm.frequency}
                        onChange={(event) => setCompleteForm((current) => ({ ...current, frequency: event.target.value }))}
                        
                        placeholder="Twice daily"
                      />
                    </Field>
                    <Field label="Duration">
                      <input
                        value={completeForm.duration}
                        onChange={(event) => setCompleteForm((current) => ({ ...current, duration: event.target.value }))}
                        
                        placeholder="5 days"
                      />
                    </Field>
                    <Field label="Fulfilment Option" span={2}>
                      <select
                        value={completeForm.prescriptionFulfillment}
                        onChange={(event) => setCompleteForm((current) => ({ ...current, prescriptionFulfillment: event.target.value }))}
                        
                      >
                        <option value="HOSPITAL_PHARMACY">Hospital pharmacy</option>
                        <option value="LOCAL_PHARMACY">Specified local pharmacy</option>
                        <option value="HOME_DELIVERY">Home delivery</option>
                      </select>
                    </Field>
                    <Field label="Digital Signature / PKI Ref" span={2}>
                      <input
                        value={completeForm.digitalSignatureRef}
                        onChange={(event) => setCompleteForm((current) => ({ ...current, digitalSignatureRef: event.target.value }))}
                        
                        placeholder="PKI certificate or signing reference"
                      />
                    </Field>
                    <Field label="Local Pharmacy Name">
                      <input
                        value={completeForm.localPharmacyName}
                        onChange={(event) => setCompleteForm((current) => ({ ...current, localPharmacyName: event.target.value }))}
                        
                        placeholder="If applicable"
                      />
                    </Field>
                    <Field label="Home Delivery Address">
                      <input
                        value={completeForm.homeDeliveryAddress}
                        onChange={(event) => setCompleteForm((current) => ({ ...current, homeDeliveryAddress: event.target.value }))}
                        
                        placeholder="If applicable"
                      />
                    </Field>
                    <Field label="Prescription Notes" span={2}>
                      <textarea
                        rows={3}
                        value={completeForm.prescriptionNotes}
                        onChange={(event) => setCompleteForm((current) => ({ ...current, prescriptionNotes: event.target.value }))}
                        
                        placeholder="Additional instructions for pharmacy / patient"
                      />
                    </Field>
                  </div>
                </div>
                <div className="rounded-2xl bg-white p-4">
                  <p className="text-sm font-semibold text-slate-900">Remote Orders & Follow-up</p>
                  <div className="mt-4 grid gap-4">
                    <Field label="Lab Test Name">
                      <input
                        value={completeForm.labTestName}
                        onChange={(event) => setCompleteForm((current) => ({ ...current, labTestName: event.target.value }))}
                        
                        placeholder="CBC, HbA1c, etc."
                      />
                    </Field>
                    <Field label="Radiology Study">
                      <input
                        value={completeForm.radiologyStudy}
                        onChange={(event) => setCompleteForm((current) => ({ ...current, radiologyStudy: event.target.value }))}
                        
                        placeholder="Chest X-ray, CT, Ultrasound..."
                      />
                    </Field>
                    <Field label="Specialist Referral">
                      <input
                        value={completeForm.specialistReferral}
                        onChange={(event) => setCompleteForm((current) => ({ ...current, specialistReferral: event.target.value }))}
                        
                        placeholder="Specialist clinic or external hospital"
                      />
                    </Field>
                    <label className="module-form-field telemedicine-field telemedicine-check">
                      <input
                        type="checkbox"
                        checked={completeForm.admissionRequested}
                        onChange={(event) => setCompleteForm((current) => ({ ...current, admissionRequested: event.target.checked }))}
                      />
                      Admission requested
                    </label>
                    <div className="grid gap-4 md:grid-cols-2">
                      <Field label="Admission Ward">
                        <input
                          value={completeForm.admissionWardId}
                          onChange={(event) => setCompleteForm((current) => ({ ...current, admissionWardId: event.target.value }))}
                          
                          placeholder="Ward ID"
                        />
                      </Field>
                      <Field label="Admission Bed">
                        <input
                          value={completeForm.admissionBedId}
                          onChange={(event) => setCompleteForm((current) => ({ ...current, admissionBedId: event.target.value }))}
                          
                          placeholder="Bed ID"
                        />
                      </Field>
                    </div>
                    <Field label="Admission Diagnosis" span={2}>
                      <input
                        value={completeForm.admissionDiagnosis}
                        onChange={(event) => setCompleteForm((current) => ({ ...current, admissionDiagnosis: event.target.value }))}
                        
                        placeholder="Admission diagnosis / reason"
                      />
                    </Field>
                    <Field label="Admission Source" span={2}>
                      <input
                        value={completeForm.admissionSource}
                        onChange={(event) => setCompleteForm((current) => ({ ...current, admissionSource: event.target.value }))}
                        
                        placeholder="TELEMEDICINE"
                      />
                    </Field>
                    <div className="grid gap-4 md:grid-cols-2">
                      <Field label="Bill Amount">
                        <input
                          type="number"
                          min="0"
                          value={completeForm.billAmount}
                          onChange={(event) => setCompleteForm((current) => ({ ...current, billAmount: event.target.value }))}
                          
                        />
                      </Field>
                      <label className="mt-7 module-form-field telemedicine-field telemedicine-check">
                        <input
                          type="checkbox"
                          checked={completeForm.markPaid}
                          onChange={(event) => setCompleteForm((current) => ({ ...current, markPaid: event.target.checked }))}
                        />
                        Mark invoice paid
                      </label>
                    </div>
                    <label className="module-form-field telemedicine-field telemedicine-check is-wide">
                      <input
                        type="checkbox"
                        checked={completeForm.issueSickNote}
                        onChange={(event) => setCompleteForm((current) => ({ ...current, issueSickNote: event.target.checked }))}
                      />
                      Issue sick note
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </ModalShell>
        </div>
      ) : null}
      {modal === "async" ? <ModalShell modal="async" title="Asynchronous Consultation" subtitle="Submit a secure store-and-forward request for clinical triage and signed response." icon={<FileSignature size={20} />} onClose={() => setModal("")} onSubmit={saveAsyncRequest} saving={saving === "async"} saveText="Submit Request">
        <Field label="Patient"><select required value={asyncForm.patientId} onChange={(event) => setAsyncForm((current) => ({ ...current, patientId: event.target.value }))}><option value="">Select patient</option>{patients.map((patient) => <option key={patient.id} value={patient.id}>{formatPatient(patient)}</option>)}</select></Field>
        <Field label="Subject"><input required value={asyncForm.subject} onChange={(event) => setAsyncForm((current) => ({ ...current, subject: event.target.value }))} placeholder="Clinical question or reason" /></Field>
        <Field label="Clinical message" span={2}><textarea required rows={5} value={asyncForm.message} onChange={(event) => setAsyncForm((current) => ({ ...current, message: event.target.value }))} placeholder="Describe symptoms, history, and requested review..." /></Field>
      </ModalShell> : null}
      {modal === "file" ? <ModalShell modal="file" title="Secure File Exchange" subtitle="Link a patient-provided report or image to this encounter. Files remain pending malware scan until cleared by Document Management." icon={<ExternalLink size={20} />} onClose={() => setModal("")} onSubmit={saveFile} saving={saving === "file"} saveText="Link File">
        <Field label="Choose file"><input required type="file" accept="application/pdf,image/jpeg,image/png,image/webp,text/plain" onChange={(event) => { const file = event.target.files?.[0]; if (file) setFileForm((current) => ({ ...current, fileName: file.name, mimeType: file.type, sizeBytes: String(file.size) })); }} /></Field>
        <Field label="Storage reference"><input required value={fileForm.storageReference} onChange={(event) => setFileForm((current) => ({ ...current, storageReference: event.target.value }))} placeholder="Document storage reference or uploaded URL" /></Field>
        <Field label="SHA-256 (optional)"><input value={fileForm.sha256} onChange={(event) => setFileForm((current) => ({ ...current, sha256: event.target.value }))} placeholder="Integrity hash" /></Field>
        <Field label="Selected file"><input readOnly value={fileForm.fileName ? `${fileForm.fileName} (${fileForm.sizeBytes} bytes)` : "No file selected"} /></Field>
      </ModalShell> : null}
      {modal === "participant" ? <ModalShell modal="participant" title="Manage Participant" subtitle="Record an authorized interpreter, guardian, caregiver, nurse, or specialist joining or leaving the consultation." icon={<ShieldCheck size={20} />} onClose={() => setModal("")} onSubmit={saveParticipant} saving={saving === "participant"} saveText="Record Participant">
        <Field label="Role"><select value={participantForm.role} onChange={(event) => setParticipantForm((current) => ({ ...current, role: event.target.value }))}><option>INTERPRETER</option><option>GUARDIAN</option><option>CAREGIVER</option><option>NURSE</option><option>CLINICIAN</option><option>PATIENT</option></select></Field>
        <Field label="Participant ID"><input value={participantForm.participantId} onChange={(event) => setParticipantForm((current) => ({ ...current, participantId: event.target.value }))} placeholder="User or patient ID" /></Field>
        <Field label="Authorization"><input required value={participantForm.authorization} onChange={(event) => setParticipantForm((current) => ({ ...current, authorization: event.target.value }))} placeholder="Consent / authorization reference" /></Field>
        <label className="module-form-field telemedicine-field telemedicine-check"><input type="checkbox" checked={participantForm.joined} onChange={(event) => setParticipantForm((current) => ({ ...current, joined: event.target.checked }))} /> Participant joined (untick to record leave)</label>
      </ModalShell> : null}
      {modal === "follow-up" ? <ModalShell modal="follow-up" title="Request Follow-up" subtitle="Create a governed follow-up requirement for the Appointments module." icon={<RefreshCw size={20} />} onClose={() => setModal("")} onSubmit={saveFollowUp} saving={saving === "follow-up"} saveText="Request Follow-up">
        <Field label="Review date"><input required type="datetime-local" value={followUpForm.reviewDate} onChange={(event) => setFollowUpForm((current) => ({ ...current, reviewDate: event.target.value }))} /></Field>
        <Field label="Care mode"><select value={followUpForm.mode} onChange={(event) => setFollowUpForm((current) => ({ ...current, mode: event.target.value }))}><option>TELEMEDICINE</option><option>PHYSICAL</option><option>AUDIO</option></select></Field>
        <Field label="Department ID"><input value={followUpForm.departmentId} onChange={(event) => setFollowUpForm((current) => ({ ...current, departmentId: event.target.value }))} placeholder="Optional" /></Field>
        <Field label="Clinician ID"><input value={followUpForm.doctorId} onChange={(event) => setFollowUpForm((current) => ({ ...current, doctorId: event.target.value }))} placeholder="Optional" /></Field>
        <Field label="Required results / preparation" span={2}><input value={followUpForm.prerequisites} onChange={(event) => setFollowUpForm((current) => ({ ...current, prerequisites: event.target.value }))} placeholder="Comma-separated prerequisites" /></Field>
      </ModalShell> : null}
      {modal === "emergency" ? <ModalShell modal="emergency" title="Emergency Escalation" subtitle="Telemedicine must never delay emergency care. Record the disposition and initiate the receiving-facility handover." icon={<Stethoscope size={20} />} onClose={() => setModal("")} onSubmit={saveEmergency} saving={saving === "emergency"} saveText="Escalate Now">
        <Field label="Disposition"><select value={emergencyForm.disposition} onChange={(event) => setEmergencyForm((current) => ({ ...current, disposition: event.target.value }))}><option>EMERGENCY_DEPARTMENT</option><option>AMBULANCE</option><option>PHYSICAL_CARE</option><option>EMERGENCY_TRANSFER</option></select></Field>
        <Field label="Receiving facility"><input value={emergencyForm.receivingFacility} onChange={(event) => setEmergencyForm((current) => ({ ...current, receivingFacility: event.target.value }))} placeholder="Facility / department" /></Field>
        <Field label="Assessment and handover" span={2}><textarea required rows={5} value={emergencyForm.assessment} onChange={(event) => setEmergencyForm((current) => ({ ...current, assessment: event.target.value }))} placeholder="Document emergency findings and immediate handover information..." /></Field>
      </ModalShell> : null}
      {modal === "chat" ? <ModalShell modal="chat" title="Secure Consultation Message" subtitle="Send an auditable message within the active consultation." icon={<ClipboardCheck size={20} />} onClose={() => setModal("")} onSubmit={saveChat} saving={saving === "chat"} saveText="Send Message">
        <Field label="Sender role"><select value={chatForm.senderRole} onChange={(event) => setChatForm((current) => ({ ...current, senderRole: event.target.value }))}><option>CLINICIAN</option><option>NURSE</option><option>STAFF</option></select></Field>
        <label className="module-form-field telemedicine-field telemedicine-check"><input type="checkbox" checked={chatForm.isInternal} onChange={(event) => setChatForm((current) => ({ ...current, isInternal: event.target.checked }))} /> Internal clinical message</label>
        <Field label="Message" span={2}><textarea required rows={5} value={chatForm.message} onChange={(event) => setChatForm((current) => ({ ...current, message: event.target.value }))} placeholder="Type a secure consultation message..." /></Field>
      </ModalShell> : null}
    </div>
  );
}
