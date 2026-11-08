import React, { useEffect, useMemo, useState } from "react";
import { ModuleIcon } from "../components/layout/ModuleIcon";
import { api } from "../lib/api";
import { useLiveRefresh } from "../lib/liveRefresh";

type OpdModal = "triage" | "consultation" | "referral" | "queue" | "waiting" | "orders" | null;
const CHECKED_IN_STATES_KEY = "hmis_patient_module_states";

const ICD_HINTS = [
  { code: "J18.1", label: "Lobar pneumonia, unspecified", terms: ["pneumon", "consolidation", "productive cough", "fever"] },
  { code: "J45.9", label: "Asthma, unspecified", terms: ["asthma", "wheeze", "shortness of breath"] },
  { code: "I10", label: "Essential hypertension", terms: ["hypertension", "high blood pressure", "bp"] },
  { code: "E11.9", label: "Type 2 diabetes mellitus without complications", terms: ["diabetes", "glucose", "hypergly"] },
  { code: "A09", label: "Infectious gastroenteritis and colitis, unspecified", terms: ["diarrhea", "vomiting", "gastro"] },
  { code: "R50.9", label: "Fever, unspecified", terms: ["fever", "pyrexia"] },
];

const defaultTriage = {
  chief_complaint: "",
  triage_level: "4-Non-urgent",
  temperature_c: "",
  pulse_bpm: "",
  blood_pressure: "",
  respiratory_rate: "",
  spo2: "",
  weight_kg: "",
  height_cm: "",
  pain_score: "",
  gcs_total: "",
  blood_glucose_mmol_l: "",
  pregnancy_status: "Not applicable",
  clinical_observations: "",
};

const defaultConsultation = {
  history: "",
  pastMedicalHistory: "",
  surgicalHistory: "",
  medicationHistory: "",
  allergies: "",
  familyHistory: "",
  socialHistory: "",
  systemsReview: "",
  examination: "",
  assessment: "",
  plan: "",
  prescription: "",
  labTestName: "",
  radiologyTestName: "",
  followUpInstructions: "",
  clinicalJustification: "",
};

const consultationFieldMeta: Record<string, { label: string; hint: string }> = {
  history: { label: "History of presenting illness", hint: "Add the relevant notes and supporting details." },
  pastMedicalHistory: { label: "Past medical history", hint: "Record chronic conditions, admissions and important medical history." },
  surgicalHistory: { label: "Past surgical history", hint: "Record previous operations and significant procedures." },
  medicationHistory: { label: "Medication history", hint: "List current, recent and over-the-counter medicines." },
  allergies: { label: "Allergies and adverse reactions", hint: "Record the allergen, reaction and severity, or state none known." },
  familyHistory: { label: "Family history", hint: "Record relevant hereditary or familial conditions." },
  socialHistory: { label: "Social history", hint: "Capture occupation, substance use, living situation and relevant context." },
  systemsReview: { label: "Review of systems", hint: "Document relevant positive and negative findings." },
  examination: { label: "Clinical examination", hint: "Record objective examination findings and measurements." },
  assessment: { label: "Assessment / diagnosis", hint: "Summarise the clinical impression and working diagnosis." },
  plan: { label: "Treatment plan", hint: "Document treatment, safety-netting and next clinical steps." },
};

const defaultReferral = {
  referred_to_department: "SPECIALIST_CLINIC",
  referred_to_doctor: "",
  reason_for_referral: "",
  urgency: "Routine",
  clinical_summary: "",
  externalFacility: "",
};

const defaultOrder = {
  orderType: "LAB",
  destinationModule: "LABORATORY",
  priority: "ROUTINE",
  clinicalIndication: "",
  orderDetails: "",
};

const triageLevelOptions = ["1-Immediate", "2-Urgent", "3-Semi-urgent", "4-Non-urgent"];
const urgencyOptions = ["Routine", "Urgent", "Emergency"];
const opdQueueDestinations = [
  { label: "Laboratory", departmentId: "LABORATORY", queueType: "LABORATORY", tokenPrefix: "LAB" },
  { label: "Radiology", departmentId: "RADIOLOGY", queueType: "RADIOLOGY", tokenPrefix: "RAD" },
  { label: "Pharmacy", departmentId: "PHARMACY", queueType: "PHARMACY", tokenPrefix: "PHR" },
  { label: "Inpatient", departmentId: "INPATIENT", queueType: "INPATIENT", tokenPrefix: "IPD" },
  { label: "Emergency", departmentId: "EMERGENCY", queueType: "EMERGENCY", tokenPrefix: "ER" },
];
const optionalTriageFields = new Set(["pregnancy_status", "clinical_observations", "blood_glucose_mmol_l"]);
const numericTriageFields = new Set(["temperature_c", "pulse_bpm", "respiratory_rate", "spo2", "weight_kg", "height_cm", "pain_score", "gcs_total", "blood_glucose_mmol_l"]);
const narrativeTriageFields = new Set(["chief_complaint", "clinical_observations"]);

const noticeTone = (message: string) => {
  const lower = message.toLowerCase();
  if (lower.includes("failed") || lower.includes("error")) return "error";
  if (lower.includes("select") || lower.includes("missing") || lower.includes("hard stop")) return "warning";
  if (lower.includes("calling")) return "info";
  return "success";
};

const apiErrorMessage = (error: any) => {
  if (error?.response?.status === 401) return "Your session has expired. Please sign in again to access the OPD queue.";
  if (error?.response?.status === 403) return "Your role is not permitted to access the OPD queue.";
  return error?.response?.data?.message || "OPD queue data could not be loaded.";
};

const looksLikeUuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value.trim());

const patientDisplay = (row: any) => {
  const value = String(
    row?.patientName ||
      row?.patient?.name ||
      [row?.patient?.firstName, row?.patient?.middleName, row?.patient?.lastName].filter(Boolean).join(" ") ||
      row?.patient?.patientCode ||
      row?.patientCode ||
      row?.mrn ||
      "",
  ).trim();
  if (value && !looksLikeUuid(value)) return value;
  return "Unknown patient";
};

const isoFollowUpFromText = (text: string) => {
  const lower = text.toLowerCase();
  const daysMatch = lower.match(/(\d+)\s*day/);
  const weeksMatch = lower.match(/(\d+)\s*week/);
  const date = new Date();
  if (daysMatch) date.setDate(date.getDate() + Number(daysMatch[1]));
  else if (weeksMatch) date.setDate(date.getDate() + Number(weeksMatch[1]) * 7);
  else if (lower.trim()) date.setDate(date.getDate() + 14);
  else return "";
  date.setHours(9, 0, 0, 0);
  return date.toISOString();
};

export function OpdDashboardView() {
  const [tokens, setTokens] = useState<any[]>([]);
  const [board, setBoard] = useState<any>({});
  const [analytics, setAnalytics] = useState<any>({});
  const [clinicalDashboard, setClinicalDashboard] = useState<any>({});
  const [resultsDashboard, setResultsDashboard] = useState<any>({});
  const [selectedToken, setSelectedToken] = useState<any>(null);
  const [modal, setModal] = useState<OpdModal>(null);
  const [triageForm, setTriageForm] = useState(defaultTriage);
  const [consultForm, setConsultForm] = useState(defaultConsultation);
  const [referralForm, setReferralForm] = useState(defaultReferral);
  const [orderForm, setOrderForm] = useState(defaultOrder);
  const [orderFlags] = useState({
    lab: false,
    radiology: false,
    pharmacy: false,
    followUp: false,
  });
  const [cdssWarning, setCdssWarning] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const [checkedInPatient, setCheckedInPatient] = useState<any>(null);
  const [queuePatientId, setQueuePatientId] = useState("");
  const [queueDestination, setQueueDestination] = useState("LABORATORY");
  const [waitingSearch, setWaitingSearch] = useState("");
  const [search, setSearch] = useState("");
  const [activeStat, setActiveStat] = useState<string | null>(null);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 2600);
    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    const syncCheckedInPatient = (event?: Event) => {
      try {
        const detail = (event as CustomEvent)?.detail;
        const states = JSON.parse(window.localStorage.getItem(CHECKED_IN_STATES_KEY) || "{}");
        const stored = states?.opd;
        setCheckedInPatient(detail?.moduleKey === "opd" ? detail.state : (stored || null));
      } catch {
        setCheckedInPatient(null);
      }
    };
    syncCheckedInPatient();
    const handleState = (event: Event) => syncCheckedInPatient(event);
    window.addEventListener("hmis:patient-module-state", handleState);
    window.addEventListener("storage", handleState);
    return () => {
      window.removeEventListener("hmis:patient-module-state", handleState);
      window.removeEventListener("storage", handleState);
    };
  }, []);

  useEffect(() => {
    const handleSidebarAction = (event: Event) => {
      const action = (event as CustomEvent<{ action?: string }>).detail?.action;
      if (action === "monitor-patient") {
        window.setTimeout(() => document.querySelector(".opd-table-wrap, .pv-table-wrap")?.scrollIntoView({ behavior: "smooth", block: "center" }), 0);
        setNotice("Patient monitoring view is ready. Select a patient row to continue.");
      }
      if (action === "queue-patient") {
        const candidates = tokens.filter((token) => token?.patientId);
        const currentPatientId = selectedToken?.patientId || checkedInPatient?.patientId || checkedInPatient?.id;
        setQueuePatientId(String(currentPatientId || candidates[0]?.patientId || ""));
        setQueueDestination("LABORATORY");
        setModal("queue");
      }
      if (action === "open-waiting-list") setModal("waiting");
      if (action === "orders") setModal("orders");
    };
    window.addEventListener("hmis:opd-sidebar-action", handleSidebarAction);
    return () => window.removeEventListener("hmis:opd-sidebar-action", handleSidebarAction);
  }, [selectedToken, checkedInPatient, tokens]);

  const load = async () => {
    try {
      const [boardRes, analyticsRes, dashboardRes, resultsRes] = await Promise.allSettled([
        api.get("/opd/queue/board", { params: { departmentId: "OPD", includeCompleted: "true" } }),
        api.get("/opd/queue/analytics", { params: { departmentId: "OPD" } }),
        api.get("/opd/dashboard"),
        api.get("/opd/results"),
      ]);
      const boardData = boardRes.status === "fulfilled" ? (boardRes.value.data?.data || boardRes.value.data || {}) : {};
      if (boardRes.status === "fulfilled") {
        setBoard(boardData);
        const nextTokens = Array.isArray(boardData?.tokens) ? boardData.tokens : [];
        setTokens(nextTokens);
        const states = JSON.parse(window.localStorage.getItem(CHECKED_IN_STATES_KEY) || "{}");
        const activeRow = nextTokens.find((row: any) => String(row?.patientId || "") === String(states?.opd?.patientId || ""));
        if (states?.opd?.patientId && (!activeRow || String(activeRow.status || "").toUpperCase() === "COMPLETED")) {
          delete states.opd;
          window.localStorage.setItem(CHECKED_IN_STATES_KEY, JSON.stringify(states));
          window.localStorage.removeItem("hmis_patient_module_state");
          setCheckedInPatient(null);
          window.dispatchEvent(new CustomEvent("hmis:patient-module-state", { detail: { moduleKey: "opd", state: {} } }));
        }
      }
      if (analyticsRes.status === "fulfilled") setAnalytics(analyticsRes.value.data?.data || analyticsRes.value.data || {});
      if (dashboardRes.status === "fulfilled") setClinicalDashboard(dashboardRes.value.data?.data || dashboardRes.value.data || {});
      if (resultsRes.status === "fulfilled") setResultsDashboard(resultsRes.value.data?.data || resultsRes.value.data || {});
    } catch (err) {
      setNotice(apiErrorMessage(err));
    }
  };

  const checkInWaitingPatient = async (token: any) => {
    const tokenId = token?.tokenId || token?.id;
    if (!tokenId || saving) return;
    setSaving(true);
    try {
      await api.patch("/opd/queue/token/status", {
        tokenId,
        tokenNumber: token?.tokenNumber,
        patientId: token?.patientId,
        visitId: token?.visitId,
        status: "IN_SERVICE",
        checkInDate: new Date().toISOString().slice(0, 10),
        reason: "Checked in from OPD waiting list",
      });
      await load();
      setSelectedToken({ ...token, status: "IN_SERVICE" });
      const states = JSON.parse(window.localStorage.getItem(CHECKED_IN_STATES_KEY) || "{}");
      states.opd = {
        ...token,
        id: token.patientId,
        patientId: token.patientId,
        patientName: patientDisplay(token),
        patientCode: token.patientCode || token.mrn || "",
        hasCheckedInPatient: true,
        queueModule: "opd",
        isQueued: false,
        checkInDate: new Date().toISOString().slice(0, 10),
      };
      window.localStorage.setItem(CHECKED_IN_STATES_KEY, JSON.stringify(states));
      window.dispatchEvent(new CustomEvent("hmis:patient-module-state", { detail: { moduleKey: "opd", state: states.opd } }));
      setNotice(`${patientDisplay(token)} checked in successfully.`);
    } catch (error: any) {
      setNotice(error?.response?.data?.message || "The patient could not be checked in.");
    } finally {
      setSaving(false);
    }
  };

  const checkOutWaitingPatient = async (token: any) => {
    const tokenId = token?.tokenId || token?.id;
    if (!tokenId || saving) return;
    setSaving(true);
    try {
      await api.patch("/opd/queue/token/status", {
        tokenId,
        tokenNumber: token?.tokenNumber,
        patientId: token?.patientId,
        visitId: token?.visitId,
        status: "COMPLETED",
        reason: "Checked out from OPD waiting list",
      });
      await load();
      setSelectedToken(null);
      if (String(checkedInPatient?.patientId || checkedInPatient?.id || "") === String(token?.patientId || "")) {
        setCheckedInPatient(null);
      }
      const states = JSON.parse(window.localStorage.getItem(CHECKED_IN_STATES_KEY) || "{}");
      delete states.opd;
      window.localStorage.setItem(CHECKED_IN_STATES_KEY, JSON.stringify(states));
      const legacyState = JSON.parse(window.localStorage.getItem("hmis_patient_module_state") || "null");
      if (!legacyState || legacyState.queueModule === "opd" || legacyState.queueModule === "Outpatient Management & OPD") {
        window.localStorage.removeItem("hmis_patient_module_state");
      }
      window.dispatchEvent(new CustomEvent("hmis:patient-module-state", { detail: { moduleKey: "opd", state: {} } }));
      setNotice(`${patientDisplay(token)} checked out successfully.`);
    } catch (error: any) {
      setNotice(error?.response?.data?.message || "The patient could not be checked out.");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  useLiveRefresh(load, { intervalMs: 30000 });

  const checkedInPatientId = String(checkedInPatient?.patientId || checkedInPatient?.id || "").trim();
  const activeToken = selectedToken || tokens.find((token) => String(token?.patientId || "") === checkedInPatientId) || (checkedInPatientId ? {
    patientId: checkedInPatientId,
    patientName: checkedInPatient?.patientName || checkedInPatient?.name,
    patientCode: checkedInPatient?.patientCode || checkedInPatient?.mrn,
    status: "IN_SERVICE",
  } : null);

  const icdSuggestions = useMemo(() => {
    const context = `${consultForm.assessment} ${consultForm.history} ${consultForm.examination}`.toLowerCase();
    return ICD_HINTS.filter((hint) => hint.terms.some((term) => context.includes(term))).slice(0, 4);
  }, [consultForm.assessment, consultForm.examination, consultForm.history]);

  const rows = useMemo(() => {
    return tokens.map((t) => ({
      id: t.tokenId || t.id,
      token: t.tokenNumber,
      patient: patientDisplay(t),
      doctor: t.doctorName || "Pending",
      status: t.status || "WAITING",
      priority: t.priority || "NORMAL",
      wait: `${t.estimatedWaitMinutes ?? 0} min`,
      room: t.counterId || t.doctorName || "Assigning",
      patientId: t.patientId,
      visitId: t.visitId,
      arrival: new Date(t.issuedAtIso || t.issuedAt || Date.now()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      original: t,
    }));
  }, [tokens]);

  const filteredRows = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter((r) =>
      `${r.token} ${r.patient} ${r.doctor} ${r.status} ${r.priority} ${r.room}`.toLowerCase().includes(q)
    );
  }, [rows, search]);

  const openWorkflow = (workflow: OpdModal, token?: any) => {
    const resolvedToken = token?.original || token || activeToken;
    if (!resolvedToken?.patientId) {
      setNotice("Select or call a queued patient before opening this OPD workflow.");
      return;
    }
    const resolvedStatus = String(resolvedToken.status || "").toUpperCase();
    if (!["IN_SERVICE", "IN_CONSULTATION"].includes(resolvedStatus)) {
      setNotice("Check the patient in before opening a clinical form.");
      return;
    }
    setSelectedToken(resolvedToken);
    setCdssWarning("");
    if (workflow === "triage") {
      setTriageForm((previous) => ({
        ...previous,
        chief_complaint: resolvedToken.statusReason || previous.chief_complaint,
      }));
    }
    if (workflow === "consultation") {
      setConsultForm((previous) => ({
        ...previous,
        assessment: previous.assessment || resolvedToken.statusReason || "",
      }));
    }
    if (workflow === "referral") {
      setReferralForm((previous) => ({
        ...previous,
        clinical_summary: previous.clinical_summary || resolvedToken.statusReason || "",
      }));
    }
    setModal(workflow);
  };

  const handleCallNext = async () => {
    try {
      const res = await api.post("/opd/queue/call-next", { departmentId: "OPD" });
      setNotice(res.data?.voiceAnnouncement?.text || `Calling token ${res.data?.tokenNumber || "..."}`);
      void load();
    } catch (err: any) {
      setNotice(`Failed to call next patient: ${err?.response?.data?.message || err.message}`);
    }
  };

  const handleOverridePriority = async (tokenId: string) => {
    try {
      await api.patch("/opd/queue/token/priority", {
        tokenId,
        priority: "EMERGENCY",
        reason: "Clinical priority override from OPD",
      });
      setNotice("Priority overridden to EMERGENCY");
      void load();
    } catch (err: any) {
      setNotice(`Failed to override priority: ${err?.response?.data?.message || err.message}`);
    }
  };

  const queueCandidates = useMemo(() => {
    const seen = new Set<string>();
    const sourceRows = checkedInPatient?.hasCheckedInPatient
      ? [...tokens, { ...checkedInPatient, patientId: checkedInPatient.patientId || checkedInPatient.id }]
      : tokens;
    return sourceRows.filter((token) => {
      const patientId = String(token?.patientId || "").trim();
      if (!patientId || seen.has(patientId)) return false;
      seen.add(patientId);
      return true;
    });
  }, [tokens, checkedInPatient]);

  const submitQueuePatient = async () => {
    const patientId = String(queuePatientId || "").trim();
    const destination = opdQueueDestinations.find((item) => item.departmentId === queueDestination);
    const patientToken = queueCandidates.find((token) => String(token?.patientId) === patientId);
    if (!patientId || !destination || !patientToken) {
      setNotice("Select a patient and destination before queueing.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        patientId,
        visitId: patientToken.visitId,
        departmentId: destination.departmentId,
        queueType: destination.queueType,
        tokenPrefix: destination.tokenPrefix,
        queueLane: "GENERAL",
        priority: 3,
        source: "opd",
        notes: `Queued from Outpatient / OPD to ${destination.label}`,
      };
      await api.post("/opd/queue/token", payload).catch((error) => {
        if ([404, 405].includes(error?.response?.status)) return api.post("/queue/token", payload);
        throw error;
      });
      setNotice(`${patientDisplay(patientToken)} queued to ${destination.label}.`);
      setModal(null);
      window.dispatchEvent(new CustomEvent("hmis:patient-queued", { detail: { patient: patientToken, destination } }));
      void load();
    } catch (err: any) {
      setNotice(`Queue failed: ${err?.response?.data?.message || err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const submitTriage = async () => {
    if (!activeToken?.patientId) {
      setNotice("Select a queued patient before saving triage.");
      return;
    }
    const requiredTriageFields = [
      triageForm.chief_complaint,
      triageForm.temperature_c,
      triageForm.pulse_bpm,
      triageForm.blood_pressure,
      triageForm.respiratory_rate,
      triageForm.spo2,
      triageForm.weight_kg,
      triageForm.height_cm,
      triageForm.pain_score,
      triageForm.gcs_total,
    ];
    if (requiredTriageFields.some((value) => !String(value || "").trim())) {
      setNotice("Complete all triage observations before saving.");
      return;
    }
    setSaving(true);
    try {
      const res = await api.post("/opd/triage/assessment", {
        patientId: activeToken.patientId,
        visitId: activeToken.visitId,
        queueToken: activeToken.tokenNumber,
        symptoms: triageForm.chief_complaint,
        briefHistory: triageForm.clinical_observations,
        triageClassification: triageForm.triage_level,
        triageScore: triageForm.pain_score,
        nextQueueRoute: "Doctor queue",
        ...triageForm,
      });
      const alert = res.data?.triage?.alertMessage || res.data?.data?.triage?.alertMessage;
      setNotice(alert || "Triage saved and queue priority updated.");
      setModal(null);
      void load();
    } catch (err: any) {
      setNotice(`Triage failed: ${err?.response?.data?.message || err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const evaluatePrescription = async () => {
    const drugName = consultForm.prescription.trim();
    if (!drugName || !activeToken?.patientId) return "";
    const allergyHardStop = /penicillin|sulfa|aspirin/i.test(drugName) && !consultForm.clinicalJustification.trim();
    if (allergyHardStop) {
      return "HARD STOP: possible allergy-class risk. Document clinical justification or change the prescription.";
    }
    try {
      await api.post("/cdss/evaluate", {
        triggerEvent: "PRESCRIBE",
        patientId: activeToken.patientId,
        context: {
          encounterId: activeToken.visitId,
          drugName,
          diagnosis: consultForm.assessment,
          justification: consultForm.clinicalJustification,
        },
      });
    } catch {
      // CDSS audit best-effort
    }
    return "";
  };

  const submitConsultation = async () => {
    if (!activeToken?.patientId) {
      setNotice("Select a queued patient before completing consultation.");
      return;
    }
    if ([consultForm.history, consultForm.examination, consultForm.assessment, consultForm.plan].some((value) => !value.trim())) {
      setNotice("History, examination, assessment, and plan are required before completing consultation.");
      return;
    }
    const warning = await evaluatePrescription();
    if (warning) {
      setCdssWarning(warning);
      return;
    }
    setSaving(true);
    try {
      await api.post("/opd/consultations/complete", {
        patientId: activeToken.patientId,
        visitId: activeToken.visitId,
        queueToken: activeToken.tokenNumber,
        doctorId: activeToken.doctorId,
        chiefComplaint: triageForm.chief_complaint || activeToken.statusReason,
        clinicalExamination: consultForm.examination,
        diagnosis: consultForm.assessment,
        treatmentPlan: consultForm.plan,
        completionNotes: consultForm.history,
        notes: [
          `History of presenting illness: ${consultForm.history}`,
          `Past medical history: ${consultForm.pastMedicalHistory}`,
          `Surgical history: ${consultForm.surgicalHistory}`,
          `Medication history: ${consultForm.medicationHistory}`,
          `Allergies: ${consultForm.allergies}`,
          `Family history: ${consultForm.familyHistory}`,
          `Social history: ${consultForm.socialHistory}`,
          `Review of systems: ${consultForm.systemsReview}`,
        ].filter((item) => !item.endsWith(": ")).join("\n"),
        prescription: orderFlags.pharmacy ? consultForm.prescription : "",
        labRequest: orderFlags.lab,
        labTestName: consultForm.labTestName || "General Lab Panel",
        radiologyRequest: orderFlags.radiology,
        radiologyTestName: consultForm.radiologyTestName || "General Imaging",
        followUpDateTime: orderFlags.followUp ? isoFollowUpFromText(consultForm.followUpInstructions) : "",
        followUpNotes: consultForm.followUpInstructions,
        nextQueueRoute: orderFlags.lab ? "LAB" : orderFlags.radiology ? "RADIOLOGY" : "COMPLETED",
      });
      setNotice("Consultation completed. Orders and follow-up request were routed.");
      setModal(null);
      void load();
    } catch (err: any) {
      setNotice(`Consultation failed: ${err?.response?.data?.message || err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const submitReferral = async () => {
    if (!activeToken?.patientId) {
      setNotice("Select a queued patient before creating referral.");
      return;
    }
    if (!referralForm.reason_for_referral.trim() || !referralForm.clinical_summary.trim()) {
      setNotice("Referral reason and clinical summary are required.");
      return;
    }
    setSaving(true);
    try {
      await api.post("/module-actions", {
        module: "opd",
        action: "OPD Referral Form",
        data: {
          ...referralForm,
          patientId: activeToken.patientId,
          visitId: activeToken.visitId,
          tokenNumber: activeToken.tokenNumber,
          referralMode: referralForm.externalFacility ? "EXTERNAL_MEDILINK_RELAY" : "INTERNAL",
        },
      });
      if (!referralForm.externalFacility) {
        await api.patch("/opd/queue/token/transfer", {
          tokenId: activeToken.tokenId,
          toDepartmentId: referralForm.referred_to_department,
          reason: referralForm.reason_for_referral,
          priority: referralForm.urgency,
        });
      }
      setNotice("Referral generated and routed to the receiving worklist.");
      setModal(null);
      void load();
    } catch (err: any) {
      setNotice(`Referral failed: ${err?.response?.data?.message || err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const submitOrder = async () => {
    if (!activeToken?.patientId || !activeToken?.visitId) {
      setNotice("Select a patient with an active OPD encounter before creating an order.");
      return;
    }
    if (!orderForm.orderDetails.trim() || !orderForm.clinicalIndication.trim()) {
      setNotice("Order details and clinical indication are required.");
      return;
    }
    setSaving(true);
    try {
      await api.post("/opd/orders", {
        encounterId: activeToken.visitId,
        patientId: activeToken.patientId,
        orderType: orderForm.orderType,
        destinationModule: orderForm.destinationModule,
        priority: orderForm.priority,
        clinicalIndication: orderForm.clinicalIndication,
        metadata: { orderDetails: orderForm.orderDetails },
      });
      window.dispatchEvent(new CustomEvent("hmis:clinical-order-created"));
      setNotice("Order created and routed to the receiving worklist.");
      setModal(null);
      void load();
    } catch (err: any) {
      setNotice(`Order failed: ${err?.response?.data?.message || err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const waitingCount = tokens.filter((t) => ["WAITING", "CALLED"].includes(t.status)).length;
  const routedOrdersCount = tokens.filter((t) => ["ORDERED_LAB", "ORDERED_RADIOLOGY"].includes(t.status)).length;
  const waitingTokens = tokens
    .filter((token) => ["WAITING", "CALLED", "IN_SERVICE", "IN_CONSULTATION"].includes(String(token.status || "").toUpperCase()))
    .filter((token) => !waitingSearch.trim() || [patientDisplay(token), token.tokenNumber, token.priority, token.status]
      .some((value) => String(value || "").toLowerCase().includes(waitingSearch.trim().toLowerCase())));

  const stats = [
    {
      label: "Now Calling",
      value: board?.lastCalled?.tokenNumber || "None",
      color: "#0d9488",
      note: board?.lastCalled?.counterId || board?.lastCalled?.doctorName || "No patient has been called yet.",
    },
    {
      label: "Doctor Worklist",
      value: waitingCount,
      color: "#2563eb",
      note: waitingCount > 0 ? "Patients waiting for consultation." : "No patient currently waiting.",
    },
    {
      label: "Open Service Points",
      value: board?.activeCounters ?? 0,
      color: "#16a34a",
      note: `Average service time ${board?.averageServiceMinutes ?? 0} min.`,
    },
    {
      label: "Orders Routed",
      value: routedOrdersCount,
      color: "#7c3aed",
      note: routedOrdersCount > 0 ? "Lab or radiology orders are active." : `No routed orders. Delay watch ${analytics?.totals?.longestWaitingMinutes || 0} min.`,
    },
    { label: "Waiting", value: clinicalDashboard?.totals?.waiting ?? analytics?.totals?.waiting ?? tokens.filter((t) => t.status === "WAITING").length, color: "#dc2626" },
    { label: "In Consultation", value: clinicalDashboard?.totals?.inConsultation ?? tokens.filter((t) => ["CALLED", "IN_SERVICE", "IN_CONSULTATION"].includes(t.status)).length, color: "#2563eb" },
    { label: "Lab/Radiology Orders", value: tokens.filter((t) => ["ORDERED_LAB", "ORDERED_RADIOLOGY"].includes(t.status)).length, color: "#0d9488" },
    { label: "Pending Results", value: resultsDashboard?.pendingReview ?? 0, color: "#ea580c", note: resultsDashboard?.critical ? `${resultsDashboard.critical} critical result(s)` : "No critical results" },
    { label: "Avg Wait (mins)", value: clinicalDashboard?.totals?.averageWaitingMinutes ?? analytics?.totals?.averageWaitingMinutes ?? 0, color: "#7c3aed" },
  ];

  return (
    <div className="patients-view opd-hr-theme">
      {/* Module Header */}
      <div className="pv-header">
        <div>
          <div className="pv-title flex items-center gap-2">
            <ModuleIcon name="stethoscope" />
            Outpatient Management &amp; OPD
          </div>
          <div className="pv-subtitle">
            Triage, consultation, orders, prescriptions, follow-up, and referrals from one workbench.
          </div>
        </div>
        <div className="opd-action-bar">
          <button
            onClick={handleCallNext}
            className="opd-workflow-btn opd-workflow-btn-call"
            type="button"
            aria-label="Call next patient"
            title="Call next patient"
          >
            <ModuleIcon name="campaign" /> Call Next
          </button>
          <button
            onClick={() => openWorkflow("triage")}
            className="opd-workflow-btn opd-workflow-btn-triage"
            type="button"
          >
            <ModuleIcon name="fact_check" /> Triage Assessment
          </button>
          <button
            onClick={() => openWorkflow("consultation")}
            className="opd-workflow-btn opd-workflow-btn-consult"
            type="button"
          >
            <ModuleIcon name="stethoscope" /> OPD Consultation
          </button>
          <button
            onClick={() => openWorkflow("referral")}
            className="opd-workflow-btn opd-workflow-btn-referral"
            type="button"
          >
            <ModuleIcon name="sync_alt" /> OPD Referral
          </button>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="pv-stats">
        {stats.map((stat) => (
          <button
            type="button"
            key={stat.label}
            className={`pv-stat-card is-clickable ${activeStat === stat.label ? "is-active" : ""}`}
            style={{ borderLeftColor: stat.color || "#1e3a8a" }}
            aria-pressed={activeStat === stat.label}
            onClick={() => {
              setActiveStat(stat.label);
              document.querySelector(".pv-table-wrap")?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
          >
            <p className="pv-stat-label">{stat.label}</p>
            <p className="pv-stat-value">{stat.value}</p>
            {stat.note ? <p className="pv-stat-note">{stat.note}</p> : null}
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="pv-search-bar">
        <div className="pv-search-wrap">
          <ModuleIcon name="search" />
          <input
            className="pv-search"
            placeholder="Search OPD worklist (token, patient, doctor, status)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Active Patient Banner */}
      {activeToken?.patientId && (
        <div className="workflow-queue-active-banner">
          <strong>Active patient: {patientDisplay(activeToken)}</strong>
          <span>Token: {activeToken.tokenNumber || "In Consultation"} · Status: {activeToken.status || "IN_SERVICE"}</span>
        </div>
      )}

      {/* Worklist Table */}
      <div className="pv-table-wrap">
        <table className="pv-table">
          <thead>
            <tr>
              <th>Token</th>
              <th>Patient</th>
              <th>Doctor</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Wait</th>
              <th>Room</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.length === 0 ? (
              <tr>
                <td className="pv-empty" colSpan={8}>
                  No patients in the OPD worklist right now.
                </td>
              </tr>
            ) : (
              filteredRows.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => openWorkflow("triage", row.original || row)}
                  className="cursor-pointer hover:bg-slate-50"
                >
                  <td className="pv-code">#{row.token}</td>
                  <td><strong>{row.patient}</strong></td>
                  <td>{row.doctor}</td>
                  <td>
                    <span className={`pv-badge badge-${String(row.status).toLowerCase()}`}>
                      {row.status}
                    </span>
                  </td>
                  <td>
                    <span className={`pv-badge ${row.priority === "EMERGENCY" ? "badge-urgent" : ""}`}>
                      {row.priority}
                    </span>
                  </td>
                  <td>{row.wait}</td>
                  <td>{row.room}</td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <div className="opd-row-actions">
                      <button
                        onClick={() => openWorkflow("triage", row)}
                        className="opd-row-btn is-triage"
                        type="button"
                      >
                        Triage
                      </button>
                      <button
                        onClick={() => openWorkflow("consultation", row)}
                        className="opd-row-btn is-consult"
                        type="button"
                      >
                        Consult
                      </button>
                      <button
                        onClick={() => openWorkflow("referral", row)}
                        className="opd-row-btn is-referral"
                        type="button"
                      >
                        Refer
                      </button>
                      <button
                        onClick={() => (row.id ? handleOverridePriority(row.id) : setNotice("Queue token is missing."))}
                        className="opd-row-btn is-priority"
                        type="button"
                      >
                        P1
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      {modal && (
        <div className="module-form-overlay">
          <div
            className={`module-form-panel module-form-panel-opd opd-mode-${modal}`}
            style={{
              "--module-form-accent": modal === "triage" ? "#059669" : modal === "referral" ? "#7c3aed" : "#2563eb",
              "--module-form-accent-dark": modal === "triage" ? "#064e3b" : modal === "referral" ? "#2e1065" : "#102554",
            } as any}
          >
            <div className="module-form-header">
              <div>
                <p className="module-form-kicker">
                  {modal === "waiting"
                    ? "OPD queue"
                    : modal === "queue" || modal === "orders"
                    ? "OPD workflow"
                    : "Active patient"}
                </p>
                <h3 className="module-form-title">
                  {modal === "waiting"
                    ? "Open Waiting List"
                    : modal === "queue"
                    ? "Queue Patient"
                    : modal === "orders"
                    ? `Orders · ${patientDisplay(activeToken)}`
                    : `${patientDisplay(activeToken)} · ${activeToken?.tokenNumber || "No token"}`}
                </h3>
              </div>
              <button className="module-modal-close" onClick={() => setModal(null)} type="button">
                ×
              </button>
            </div>

            {/* Queue Modal */}
            {modal === "queue" && (
              <div className="module-form-body">
                <div className="module-form-grid">
                  <label className="module-form-field is-wide">
                    <span>Patient</span>
                    <select
                      className="module-form-input"
                      value={queuePatientId}
                      onChange={(e) => setQueuePatientId(e.target.value)}
                      required
                    >
                      <option value="">Select a patient from the OPD worklist</option>
                      {queueCandidates.map((token) => (
                        <option key={token.patientId} value={token.patientId}>
                          {patientDisplay(token)} · {token.tokenNumber || "No token"}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="module-form-field is-wide">
                    <span>Queue to module</span>
                    <select
                      className="module-form-input"
                      value={queueDestination}
                      onChange={(e) => setQueueDestination(e.target.value)}
                      required
                    >
                      {opdQueueDestinations.map((d) => (
                        <option key={d.departmentId} value={d.departmentId}>
                          {d.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="module-form-footer">
                  <button
                    className="topbar-logout-btn module-form-submit"
                    onClick={submitQueuePatient}
                    disabled={saving || queueCandidates.length === 0}
                    type="button"
                  >
                    {saving ? "Queueing..." : "Queue Patient"}
                  </button>
                </div>
              </div>
            )}

            {/* Waiting List Modal */}
            {modal === "waiting" && (
              <div className="module-form-body">
                <div className="opd-waiting-overview">
                  <div>
                    <span>Queue patients</span>
                    <strong>{tokens.filter((t) => ["WAITING", "CALLED"].includes(String(t.status || "").toUpperCase())).length}</strong>
                  </div>
                  <div>
                    <span>Showing</span>
                    <strong>{waitingTokens.length}</strong>
                  </div>
                </div>
                <div className="opd-waiting-toolbar">
                  <input
                    type="search"
                    value={waitingSearch}
                    onChange={(e) => setWaitingSearch(e.target.value)}
                    placeholder="Search patient, MRN or token"
                    aria-label="Search OPD waiting list"
                  />
                  <button type="button" onClick={() => void load()} disabled={saving}>
                    Refresh
                  </button>
                </div>
                <div className="opd-waiting-list">
                  {waitingTokens.length === 0 ? (
                    <p className="opd-waiting-empty">No patients are currently waiting.</p>
                  ) : (
                    waitingTokens.map((token, idx) => (
                      <div className="opd-waiting-row" key={token.tokenId || token.id || idx}>
                        <button
                          type="button"
                          className="opd-waiting-select"
                          onClick={() => {
                            setSelectedToken(token);
                            setModal(null);
                          }}
                        >
                          <strong>{patientDisplay(token)}</strong>
                          <span>
                            <b>{token.tokenNumber || "No token"}</b>
                            <em>{token.priority || "NORMAL"}</em>
                            <i>{token.status || "WAITING"}</i>
                          </span>
                        </button>
                        <button
                          type="button"
                          className="opd-waiting-checkin"
                          disabled={saving}
                          onClick={() =>
                            void (String(token.status || "").toUpperCase() === "IN_SERVICE"
                              ? checkOutWaitingPatient(token)
                              : checkInWaitingPatient(token))
                          }
                        >
                          {saving
                            ? "Updating..."
                            : String(token.status || "").toUpperCase() === "IN_SERVICE"
                            ? "Check out"
                            : "Check in"}
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Triage Modal */}
            {modal === "triage" && (
              <div className="module-form-body">
                <div className="module-form-grid">
                  {Object.keys(defaultTriage).map((key) => (
                    <label key={key} className="module-form-field">
                      <span>{key.replace(/_/g, " ")}</span>
                      {key === "triage_level" ? (
                        <select
                          required
                          className="module-form-input"
                          value={triageForm.triage_level}
                          onChange={(e) => setTriageForm((p) => ({ ...p, triage_level: e.target.value }))}
                        >
                          {triageLevelOptions.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      ) : narrativeTriageFields.has(key) ? (
                        <textarea
                          required={!optionalTriageFields.has(key)}
                          className="module-form-input module-form-textarea"
                          rows={4}
                          value={(triageForm as any)[key]}
                          onChange={(e) => setTriageForm((p) => ({ ...p, [key]: e.target.value }))}
                        />
                      ) : (
                        <input
                          required={!optionalTriageFields.has(key)}
                          type={numericTriageFields.has(key) ? "number" : "text"}
                          className="module-form-input"
                          value={(triageForm as any)[key]}
                          onChange={(e) => setTriageForm((p) => ({ ...p, [key]: e.target.value }))}
                        />
                      )}
                    </label>
                  ))}
                </div>
                <div className="module-form-footer">
                  <button
                    className="topbar-logout-btn module-form-submit"
                    onClick={submitTriage}
                    disabled={saving}
                    type="button"
                  >
                    {saving ? "Saving..." : "Save Triage"}
                  </button>
                </div>
              </div>
            )}

            {/* Orders Modal */}
            {modal === "orders" && (
              <div className="module-form-body">
                <div className="module-form-grid opd-order-grid">
                  <label className="module-form-field">
                    <span>Order type</span>
                    <select
                      className="module-form-input"
                      value={orderForm.orderType}
                      onChange={(e) =>
                        setOrderForm((p) => ({
                          ...p,
                          orderType: e.target.value,
                          destinationModule:
                            e.target.value === "LAB"
                              ? "LABORATORY"
                              : e.target.value === "RADIOLOGY" || e.target.value === "PHARMACY" || e.target.value === "PRESCRIPTION"
                              ? e.target.value === "RADIOLOGY"
                                ? "RADIOLOGY"
                                : "PHARMACY"
                              : "OPD",
                        }))
                      }
                    >
                      <option value="LAB">Laboratory</option>
                      <option value="RADIOLOGY">Radiology</option>
                      <option value="PHARMACY">Pharmacy</option>
                      <option value="PRESCRIPTION">Prescription</option>
                      <option value="PROCEDURE">Procedure</option>
                      <option value="REFERRAL">Internal referral</option>
                      <option value="FOLLOW_UP">Follow-up</option>
                    </select>
                  </label>
                  <label className="module-form-field">
                    <span>Priority</span>
                    <select
                      className="module-form-input"
                      value={orderForm.priority}
                      onChange={(e) => setOrderForm((p) => ({ ...p, priority: e.target.value }))}
                    >
                      <option value="ROUTINE">Routine</option>
                      <option value="URGENT">Urgent</option>
                      <option value="STAT">STAT</option>
                    </select>
                  </label>
                  <label className="module-form-field is-wide">
                    <span>Clinical indication</span>
                    <textarea
                      className="module-form-input module-form-textarea"
                      rows={3}
                      value={orderForm.clinicalIndication}
                      onChange={(e) => setOrderForm((p) => ({ ...p, clinicalIndication: e.target.value }))}
                      placeholder="Why is this order clinically required?"
                    />
                  </label>
                  <label className="module-form-field is-wide">
                    <span>Order details</span>
                    <textarea
                      className="module-form-input module-form-textarea"
                      rows={5}
                      value={orderForm.orderDetails}
                      onChange={(e) => setOrderForm((p) => ({ ...p, orderDetails: e.target.value }))}
                      placeholder="Test, medication, procedure or referral details"
                    />
                  </label>
                </div>
                <div className="module-form-footer">
                  <button
                    className="topbar-logout-btn module-form-submit"
                    onClick={submitOrder}
                    disabled={saving}
                    type="button"
                  >
                    {saving ? "Saving..." : "Create Order"}
                  </button>
                </div>
              </div>
            )}

            {/* Consultation Workbench Modal */}
            {modal === "consultation" && (
              <div className="module-form-body opd-consult-workbench">
                <aside className="pv-section">
                  <h4 className="text-sm font-bold">Patient Context</h4>
                  <p className="pv-subtitle">
                    Vitals: SpO2 {activeToken?.spo2 || "—"} · Priority {activeToken?.priority || "—"}
                  </p>
                  <p className="pv-subtitle">
                    Allergies, current meds, previous visits, and triage history load here from the patient record.
                  </p>
                </aside>
                <section className="pv-section">
                  {(
                    [
                      "history",
                      "pastMedicalHistory",
                      "surgicalHistory",
                      "medicationHistory",
                      "allergies",
                      "familyHistory",
                      "socialHistory",
                      "systemsReview",
                      "examination",
                      "assessment",
                      "plan",
                    ] as const
                  ).map((key) => (
                    <label key={key} className="module-form-field is-wide">
                      <span className="opd-consult-label">{consultationFieldMeta[key].label}</span>
                      <small className="opd-consult-hint">{consultationFieldMeta[key].hint}</small>
                      <textarea
                        required
                        className="module-form-input module-form-textarea opd-consult-textarea"
                        rows={4}
                        value={consultForm[key]}
                        onChange={(e) => setConsultForm((p) => ({ ...p, [key]: e.target.value }))}
                      />
                    </label>
                  ))}
                  {icdSuggestions.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {icdSuggestions.map((item) => (
                        <button
                          key={item.code}
                          type="button"
                          className="pv-badge"
                          onClick={() => setConsultForm((p) => ({ ...p, assessment: `${item.code} ${item.label}` }))}
                        >
                          {item.code} {item.label}
                        </button>
                      ))}
                    </div>
                  )}
                  {cdssWarning && (
                    <div className="p-3 rounded border border-red-200 bg-red-50 text-red-700 text-sm">
                      {cdssWarning}
                    </div>
                  )}
                </section>
                <div className="module-form-footer is-wide">
                  <button
                    className="topbar-logout-btn module-form-submit"
                    onClick={submitConsultation}
                    disabled={saving}
                    type="button"
                  >
                    {saving ? "Saving..." : "Complete Consultation"}
                  </button>
                </div>
              </div>
            )}

            {/* Referral Modal */}
            {modal === "referral" && (
              <div className="module-form-body">
                <div className="module-form-grid">
                  {Object.keys(defaultReferral).map((key) => (
                    <label
                      key={key}
                      className={`module-form-field ${key.includes("reason") || key.includes("summary") ? "is-wide" : ""}`}
                    >
                      <span>{key.replace(/_/g, " ")}</span>
                      {key.includes("reason") || key.includes("summary") ? (
                        <textarea
                          required
                          className="module-form-input min-h-[90px]"
                          value={(referralForm as any)[key]}
                          onChange={(e) => setReferralForm((p) => ({ ...p, [key]: e.target.value }))}
                        />
                      ) : key === "urgency" ? (
                        <select
                          className="module-form-input"
                          value={referralForm.urgency}
                          onChange={(e) => setReferralForm((p) => ({ ...p, urgency: e.target.value }))}
                        >
                          {urgencyOptions.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          className="module-form-input"
                          value={(referralForm as any)[key]}
                          onChange={(e) => setReferralForm((p) => ({ ...p, [key]: e.target.value }))}
                        />
                      )}
                    </label>
                  ))}
                </div>
                <div className="module-form-footer">
                  <button
                    className="topbar-logout-btn module-form-submit"
                    onClick={submitReferral}
                    disabled={saving}
                    type="button"
                  >
                    {saving ? "Saving..." : "Generate Referral"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action Toast */}
      {notice && (
        <div
          className={`module-toast patient-action-toast ${
            noticeTone(notice) === "error" ? "is-error" : noticeTone(notice) === "warning" ? "is-warning" : "is-success"
          }`}
          role="status"
          aria-live="polite"
        >
          <span className="patient-action-toast-icon" aria-hidden="true">
            {noticeTone(notice) === "success" ? "✓" : "!"}
          </span>
          <div className="patient-action-toast-content">
            <strong>
              {noticeTone(notice) === "error"
                ? "Action needs attention"
                : noticeTone(notice) === "warning"
                ? "Review required"
                : "Action completed"}
            </strong>
            <span>{notice}</span>
          </div>
          <button
            onClick={() => setNotice("")}
            className="patient-action-toast-close"
            type="button"
            aria-label="Dismiss notification"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
