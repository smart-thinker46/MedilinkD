// Ported from Medilink-Frontend/src/app/consent/page.tsx for desktop parity.
import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  ClipboardSignature,
  FileClock,
  FileText,
  History,
  Maximize2,
  Minimize2,
  RefreshCw,
  Scale,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";
import { api } from "../lib/api";
import { useLiveRefresh } from "../lib/liveRefresh";
import { useAppStore } from "../store/appStore";

const today = new Date().toISOString().slice(0, 10);
const CONSENT_TYPES = [
  "SURGICAL_CONSENT",
  "ANAESTHESIA_CONSENT",
  "BLOOD_TRANSFUSION_CONSENT",
  "HIV_TESTING_CONSENT",
  "RESEARCH_STUDY_CONSENT",
  "TELEMEDICINE_CONSENT",
  "DATA_PROCESSING_CONSENT",
  "PHOTOGRAPHY_TEACHING_CONSENT",
  "PROCEDURE_SPECIFIC_CONSENT",
  "INVASIVE_PROCEDURE_CONSENT",
  "DIAGNOSTIC_PROCEDURE_CONSENT",
  "SECONDARY_DATA_USE_CONSENT",
  "TELEMEDICINE_REMOTE_MONITORING",
  "STUDY_PARTICIPATION_CONSENT",
  "BIOLOGICAL_SAMPLE_CONSENT",
  "DIGITAL_COMMUNICATION_CONSENT",
  "MARKETING_COMMUNICATION_CONSENT",
];
const SOURCE_MODULES = ["OT", "BLOOD_BANK", "CLINICAL", "EMR", "RESEARCH", "TELEMEDICINE", "PATIENT_PORTAL", "ORCHESTRATION"];
const LANGUAGES = ["en-KE", "sw-KE"];
const RELATIONSHIPS = ["SELF", "PARENT", "LEGAL_GUARDIAN", "AUTHORIZED_REPRESENTATIVE", "HEALTHCARE_PROXY", "OTHER"];
const CONSENT_FORM_CODES: Record<string, string> = {
  SURGICAL_CONSENT: "CONS-SURG-001",
  PROCEDURE_SPECIFIC_CONSENT: "CONS-PROC-001",
  ANAESTHESIA_CONSENT: "CONS-ANES-001",
  BLOOD_TRANSFUSION_CONSENT: "CONS-BLOOD-001",
  HIV_TESTING_CONSENT: "CONS-HIV-001",
  RESEARCH_STUDY_CONSENT: "CONS-RESEARCH-001",
  TELEMEDICINE_CONSENT: "CONS-TELE-001",
  DATA_PROCESSING_CONSENT: "CONS-DATA-001",
  PHOTOGRAPHY_TEACHING_CONSENT: "CONS-MEDIA-001",
  TEACHING_TRAINING_CONSENT: "CONS-TEACH-001",
};

const emptyTemplate = {
  consentType: "SURGICAL_CONSENT",
  title: "",
  versionNumber: "v1.0",
  language: "en-KE",
  content: "",
  isCurrent: true,
  purpose: "",
  ownerDepartment: "",
  legalReviewReference: "",
  requiredWitness: true,
  guardianAllowed: true,
  digitalSignatureRequired: true,
};

const emptyWorkflow = {
  patientId: "",
  encounterId: "",
  sourceModule: "OT",
  sourceRecordId: "",
  consentType: "SURGICAL_CONSENT",
  language: "en-KE",
  consentGivenBy: "",
  relationshipToPatient: "SELF",
  witnessName: "",
  patientSignature: "",
  witnessSignature: "",
  consented: true,
  refusalReason: "",
  capacityConfirmed: true,
  procedureExplained: true,
  risksExplained: true,
  alternativesExplained: true,
  questionsAllowed: true,
  decisionDocumented: true,
  decision: "CONSENTED",
  witnessRequired: true,
  scope: "Treatment processing",
  capacityOutcome: "CONFIRMED",
  capacityNotes: "",
  guardianAuthorityType: "",
  guardianAuthorityReference: "",
  interpreterName: "",
  interpreterId: "",
  interpreterLanguage: "",
  effectiveTo: "",
};

const emptyRequest = { patientId: "", encounterId: "", sourceModule: "OT", sourceRecordId: "", consentType: "SURGICAL_CONSENT", scope: "" };
const emptyVerify = { patientId: "", consentType: "SURGICAL_CONSENT" };
const emptyEmergency = { patientId: "", consentType: "SURGICAL_CONSENT", emergencyReason: "", patientCondition: "", responsibleClinician: "", policyBasis: "" };
const emptyDowntime = { entries: "", notes: "" };

const emptyWithdrawal = {
  patientId: "",
  representativeName: "",
  channel: "IN_PERSON",
  consentType: "DATA_PROCESSING_CONSENT",
  reason: "",
  scope: "",
};

const emptyReview = {
  decision: "PARTIALLY_ACTED",
  medicalRecordsOfficer: "",
  dataProtectionOfficer: "",
  processingToCease: "",
  dataToDelete: "",
  continuingLegalBasis: "Legitimate medical interest for ongoing treatment",
  reasons: "",
};

const pretty = (value: unknown) =>
  String(value || "")
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());

const fmtDate = (value: unknown) => {
  const date = new Date(String(value || ""));
  if (!Number.isFinite(date.getTime())) return "-";
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
};

const templateHtml = (value: unknown, row: any, facility: { name: string; address: string; phone: string; email: string; website: string }) => {
  let html = String(value || "").trim();
  const body = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (body) html = body[1];
  html = html.replace(/<style[\s\S]*?<\/style>/gi, "").replace(/<script[\s\S]*?<\/script>/gi, "");
  html = html.replace(/<header\b[\s\S]*?<\/header>/gi, "").replace(/<footer\b[\s\S]*?<\/footer>/gi, "");
  html = html.replace(/<main\b[^>]*>/gi, "").replace(/<\/main>/gi, "");
  html = html.replace(/\s(on\w+|style)\s*=\s*("[^"]*"|'[^']*')/gi, "");
  const values: Record<string, string> = {
    "hospital.name": facility.name,
    "hospital.address": facility.address,
    "hospital.phone": facility.phone,
    "hospital.email": facility.email,
    "hospital.website": facility.website,
    "patient.fullName": row.patientName || row.patient?.fullName || "",
    "patient.mrn": row.mrn || row.patient?.mrn || row.patientId || "",
    "patient.dateOfBirth": row.dateOfBirth || row.patient?.dateOfBirth || "",
    "patient.gender": row.gender || row.patient?.gender || "",
    "patient.phone": row.phone || row.patient?.phone || "",
    "encounter.number": row.encounterId || "",
    "encounter.clinician": row.clinicianName || row.clinician?.name || "",
    "document.version": row.versionNumber || row.consentFormVersion || "v1.0",
    "document.effectiveDate": fmtDate(row.effectiveFrom || row.consentedAt || today),
  };
  return html.replace(/\{\{([^}]+)\}\}/g, (_match, key: string) => values[key.trim()] || "");
};

const rowsOf = (value: any) => {
  const data = value?.data ?? value;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  return [];
};

export default function ConsentView() {
  const { facility, facilityLogo, facilitySettings } = useAppStore();
  const [dashboard, setDashboard] = useState<any>({});
  const [templates, setTemplates] = useState<any[]>([]);
  const [records, setRecords] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [selectedWithdrawalId, setSelectedWithdrawalId] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [report, setReport] = useState<any>(null);
  const [modal, setModal] = useState<"" | "template" | "workflow" | "withdrawal" | "review" | "request" | "verify" | "emergency" | "downtime" | "view">("");
  const [expandedTable, setExpandedTable] = useState<"templates" | "records" | null>(null);
  const [viewRow, setViewRow] = useState<any>(null);
  const [templateForm, setTemplateForm] = useState(emptyTemplate);
  const [workflowForm, setWorkflowForm] = useState(emptyWorkflow);
  const [withdrawalForm, setWithdrawalForm] = useState(emptyWithdrawal);
  const [reviewForm, setReviewForm] = useState(emptyReview);
  const [requestForm, setRequestForm] = useState(emptyRequest);
  const [verifyForm, setVerifyForm] = useState(emptyVerify);
  const [verification, setVerification] = useState<any>(null);
  const [selectedRecordId, setSelectedRecordId] = useState("");
  const [auditRows, setAuditRows] = useState<any[]>([]);
  const [emergencyForm, setEmergencyForm] = useState(emptyEmergency);
  const [downtimeForm, setDowntimeForm] = useState(emptyDowntime);
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");

  const selectedWithdrawal = withdrawals.find((row) => row.id === selectedWithdrawalId) || withdrawals[0] || null;
  const selectedRecord = records.find((row) => row.id === selectedRecordId) || null;
  const hospitalProfile = useMemo(() => {
    let setup: any = {};
    if (typeof window !== "undefined") {
      try { setup = JSON.parse(window.localStorage.getItem("hmis_first_setup") || "{}"); } catch { setup = {}; }
    }
    const values = setup?.values || {};
    const saved = setup?.savedFacility || {};
    const branding = setup?.branding || {};
    const runtime = facilitySettings || {};
    return {
      name: runtime?.facility?.name || runtime?.facility?.shortName || facility?.name || values.shortName || values.legalName || values.facilityName || saved.name || "Medilink Hospital",
      address: runtime?.facility?.address || runtime?.facility?.physicalAddress || values.address || values.physicalAddress || values.location || saved.address || "",
      postalAddress: runtime?.facility?.postalAddress || values.postalAddress || values.postal || saved.postalAddress || "",
      phone: runtime?.facility?.phone || runtime?.facility?.mainPhone || values.phone || values.phoneNumber || values.mainPhone || saved.phone || saved.phoneNumber || "",
      emergencyPhone: runtime?.facility?.emergencyPhone || values.emergencyPhone || values.emergency || saved.emergencyPhone || "",
      email: runtime?.facility?.email || runtime?.facility?.generalEmail || values.email || values.generalEmail || saved.email || "",
      website: runtime?.facility?.website || values.website || saved.website || "",
      registrationNumber: runtime?.facility?.registrationNumber || values.registrationNumber || saved.registrationNumber || "",
      mflCode: runtime?.facility?.mflCode || values.mflCode || saved.mflCode || "",
      licenseNumber: runtime?.facility?.licenseNumber || values.licenseNumber || saved.licenseNumber || "",
      tagline: runtime?.facility?.tagline || values.tagline || saved.tagline || "",
      logoUrl: branding.logoUrl || runtime?.branding?.logoUrl || facilityLogo || saved.logoUrl || values.primaryLogo || "/MedilinkHMIS.png",
    };
  }, [facility, facilityLogo, facilitySettings]);
  const totals = dashboard?.totals || {};
  const stats = [
    { label: "Templates", value: totals.templates || templates.length, icon: FileText },
    { label: "Current", value: totals.currentTemplates || templates.filter((row) => row.isCurrent).length, icon: CheckCircle2 },
    { label: "Archived", value: totals.archivedTemplates || templates.filter((row) => !row.isCurrent).length, icon: History },
    { label: "Consent Records", value: totals.completedRecords || records.length, icon: ClipboardSignature },
    { label: "Withdrawals", value: totals.withdrawals || withdrawals.length, icon: Scale },
    { label: "Pending Review", value: totals.pendingWithdrawals || withdrawals.filter((row) => row.status === "PENDING_REVIEW").length, icon: FileClock },
    { label: "Active", value: totals.activeRecords || records.filter((row) => row.consented && !row.withdrawnAt).length, icon: ShieldCheck },
    { label: "Refused", value: totals.refusedRecords || records.filter((row) => !row.consented).length, icon: X },
    { label: "Expired", value: totals.expiredRecords || 0, icon: FileClock },
  ];

  const setToast = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice((current) => (current === message ? "" : current)), 5200);
  };

  const load = async () => {
    setLoading(true);
    try {
      await api.post("/consent/templates/seed-defaults").catch(() => null);
      const params: Record<string, string> = {};
      if (typeFilter !== "ALL") params.consentType = typeFilter;
      const [dashRes, templateRes, recordRes, withdrawalRes] = await Promise.all([
        api.get("/consent/dashboard").catch(() => ({ data: {} })),
        api.get("/consent/templates", { params }).catch(() => ({ data: [] })),
        api.get("/consent/records", { params: { limit: 200 } }).catch(() => ({ data: [] })),
        api.get("/consent/withdrawals", { params: { limit: 200 } }).catch(() => ({ data: [] })),
      ]);
      setDashboard(dashRes.data || {});
      setTemplates(rowsOf(templateRes.data));
      setRecords(rowsOf(recordRes.data));
      const withdrawalRows = rowsOf(withdrawalRes.data);
      setWithdrawals(withdrawalRows);
      setSelectedWithdrawalId((current) => current || withdrawalRows[0]?.id || "");
    } catch (error: any) {
      setToast(error?.response?.data?.message || "Consent module data could not be loaded.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);
  useLiveRefresh(load, { intervalMs: 60000 });

  const filteredTemplates = useMemo(() => {
    const q = search.trim().toLowerCase();
    return templates.filter((row) => {
      const hay = [row.title, row.consentType, row.versionNumber, row.language, row.content].join(" ").toLowerCase();
      return !q || hay.includes(q);
    });
  }, [templates, search]);

  const filteredRecords = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return records;
    return records.filter((row) => [row.patientId, row.encounterId, row.consentType, row.consentFormVersion, row.consentGivenBy, row.witnessName].join(" ").toLowerCase().includes(q));
  }, [records, search]);

  const saveTemplate = async (event: FormEvent) => {
    event.preventDefault();
    setSaving("template");
    try {
      await api.post("/consent/templates", templateForm);
      setTemplateForm(emptyTemplate);
      setModal("");
      setToast("Consent template version saved and activated.");
      await load();
    } catch (error: any) {
      setToast(error?.response?.data?.message || "Template could not be saved.");
    } finally {
      setSaving("");
    }
  };

  const completeWorkflow = async (event: FormEvent) => {
    event.preventDefault();
    setSaving("workflow");
    try {
      await api.post("/consent/workflows/complete", {
        ...workflowForm,
        consented: workflowForm.decision === "CONSENTED",
        scope: workflowForm.scope ? { authorized: workflowForm.scope.split(",").map((item) => item.trim()).filter(Boolean) } : {},
        capacityAssessment: { outcome: workflowForm.capacityOutcome, notes: workflowForm.capacityNotes },
        guardianAuthority: workflowForm.relationshipToPatient === "SELF" ? {} : { authorityType: workflowForm.guardianAuthorityType, reference: workflowForm.guardianAuthorityReference },
        interpreter: workflowForm.interpreterName ? { name: workflowForm.interpreterName, id: workflowForm.interpreterId, language: workflowForm.interpreterLanguage } : {},
        effectiveTo: workflowForm.effectiveTo || undefined,
      });
      setWorkflowForm(emptyWorkflow);
      setModal("");
      setToast("Consent workflow completed with signatures and witness record.");
      await load();
    } catch (error: any) {
      setToast(error?.response?.data?.message || "Consent workflow could not be completed.");
    } finally {
      setSaving("");
    }
  };

  const submitWithdrawal = async (event: FormEvent) => {
    event.preventDefault();
    setSaving("withdrawal");
    try {
      const res = await api.post("/consent/withdrawals", { ...withdrawalForm, scope: withdrawalForm.scope ? { withdrawn: withdrawalForm.scope.split(",").map((item) => item.trim()).filter(Boolean) } : {} });
      setSelectedWithdrawalId((res.data?.data ?? res.data)?.id || "");
      setWithdrawalForm(emptyWithdrawal);
      setModal("");
      setToast("Consent withdrawal logged for Records and DPO review.");
      await load();
    } catch (error: any) {
      setToast(error?.response?.data?.message || "Withdrawal could not be logged.");
    } finally {
      setSaving("");
    }
  };

  const reviewWithdrawal = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedWithdrawal?.id) return setToast("Select a withdrawal first.");
    setSaving("review");
    try {
      await api.patch(`/consent/withdrawals/${selectedWithdrawal.id}/review`, reviewForm);
      setReviewForm(emptyReview);
      setModal("");
      setToast("Withdrawal review documented with decision and legal basis.");
      await load();
    } catch (error: any) {
      setToast(error?.response?.data?.message || "Withdrawal review could not be saved.");
    } finally {
      setSaving("");
    }
  };

  const submitRequest = async (event: FormEvent) => {
    event.preventDefault();
    setSaving("request");
    try {
      await api.post("/consent/requests", { ...requestForm, scope: requestForm.scope ? { requested: requestForm.scope.split(",").map((item) => item.trim()).filter(Boolean) } : {} });
      setRequestForm(emptyRequest);
      setModal("");
      setToast("Consent request created and queued for completion.");
      await load();
    } catch (error: any) {
      setToast(error?.response?.data?.message || "Consent request could not be created.");
    } finally {
      setSaving("");
    }
  };

  const verifyConsent = async (event: FormEvent) => {
    event.preventDefault();
    setSaving("verify");
    try {
      const response = await api.get("/consent/verify", { params: verifyForm });
      setVerification(response.data?.data ?? response.data);
      setModal("");
      setToast(`Consent verification: ${(response.data?.data ?? response.data)?.status || "UNKNOWN"}.`);
    } catch (error: any) {
      setToast(error?.response?.data?.message || "Consent could not be verified.");
    } finally {
      setSaving("");
    }
  };

  const renewSelected = async () => {
    if (!selectedRecord?.id) return setToast("Select a consent record first.");
    setSaving("renew");
    try {
      await api.post(`/consent/records/${selectedRecord.id}/renew`, { reason: "Renewal requested from consent dashboard." });
      setToast("Consent renewal request created; the original record remains historical.");
      await load();
    } catch (error: any) {
      setToast(error?.response?.data?.message || "Consent renewal could not be requested.");
    } finally {
      setSaving("");
    }
  };

  const viewAudit = async () => {
    if (!selectedRecord?.id) return setToast("Select a consent record first.");
    try {
      const response = await api.get(`/consent/records/${selectedRecord.id}/audit`);
      setAuditRows(response.data?.data ?? response.data ?? []);
      setToast("Consent audit history loaded.");
    } catch (error: any) {
      setToast(error?.response?.data?.message || "Consent audit history could not be loaded.");
    }
  };

  const submitEmergency = async (event: FormEvent) => {
    event.preventDefault();
    setSaving("emergency");
    try {
      await api.post("/consent/emergency-exception", emergencyForm);
      setEmergencyForm(emptyEmergency);
      setModal("");
      setToast("Emergency exception recorded for subsequent review.");
      await load();
    } catch (error: any) {
      setToast(error?.response?.data?.message || "Emergency exception could not be recorded.");
    } finally {
      setSaving("");
    }
  };

  const submitDowntime = async (event: FormEvent) => {
    event.preventDefault();
    const entries = downtimeForm.entries.split("\n").map((line) => line.trim()).filter(Boolean).map((line) => ({ reference: line }));
    if (!entries.length) return setToast("Add at least one downtime consent reference.");
    setSaving("downtime");
    try {
      await api.post("/consent/downtime/reconcile", { entries, notes: downtimeForm.notes });
      setDowntimeForm(emptyDowntime);
      setModal("");
      setToast("Downtime consent reconciliation recorded and audited.");
      await load();
    } catch (error: any) {
      setToast(error?.response?.data?.message || "Downtime reconciliation could not be recorded.");
    } finally {
      setSaving("");
    }
  };

  const reviewTemplate = async (decision: string) => {
    if (!selectedTemplateId) return setToast("Select a template first.");
    try {
      await api.patch(`/consent/templates/${selectedTemplateId}/review`, { decision });
      setToast(`Template moved to ${decision}.`);
      await load();
    } catch (error: any) {
      setToast(error?.response?.data?.message || "Template review could not be saved.");
    }
  };

  const expireDue = async () => {
    try {
      const response = await api.post("/consent/expire-due", {});
      setToast(`${(response.data?.data ?? response.data)?.processed || 0} consent(s) expired.`);
      await load();
    } catch (error: any) {
      setToast(error?.response?.data?.message || "Due consent expiry could not be processed.");
    }
  };

  const loadReport = async () => {
    try {
      const response = await api.get("/consent/reports");
      setReport(response.data?.data ?? response.data);
      setToast("Consent compliance report loaded.");
    } catch (error: any) {
      setToast(error?.response?.data?.message || "Consent report could not be loaded.");
    }
  };

  const openDocument = (row: any) => {
    setExpandedTable(null);
    setViewRow(row);
    setModal("view");
  };

  const updateTemplate = (key: string, value: string | boolean) => setTemplateForm((current) => ({ ...current, [key]: value }));
  const updateWorkflow = (key: string, value: string | boolean) => setWorkflowForm((current) => ({ ...current, [key]: value }));
  const updateWithdrawal = (key: string, value: string) => setWithdrawalForm((current) => ({ ...current, [key]: value }));
  const updateReview = (key: string, value: string) => setReviewForm((current) => ({ ...current, [key]: value }));

  return (
    <main className="consent-page">
      <header className="consent-header">
        <div>
          <h1>Consent Management</h1>
          <p>Versioned digital consent forms, guided witness workflow, signature capture, and Kenya DPA 2019 withdrawal review.</p>
        </div>
        <div className="consent-actions">
          <button className="consent-btn ghost" onClick={() => void load()} disabled={loading}><RefreshCw size={17} /> Refresh</button>
          <button className="consent-btn green" onClick={() => setModal("workflow")}><ClipboardSignature size={17} /> Capture Consent</button>
          <button className="consent-btn teal" onClick={() => setModal("request")}><FileClock size={17} /> New Request</button>
        </div>
      </header>

      <section className="consent-stats">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return <article className="consent-stat" key={stat.label}><div><span>{stat.label}</span><strong>{stat.value}</strong></div><i><Icon size={18} /></i></article>;
        })}
      </section>
      {report ? <section className="consent-report-strip"><strong>Compliance report</strong><span>{report.totals?.completionRate || 0}% completion rate</span><span>{report.totals?.withdrawals || 0} withdrawals</span><span>{report.totals?.events || 0} audit events</span><button type="button" onClick={() => setReport(null)}>Close</button></section> : null}
      {expandedTable ? <button type="button" className="consent-table-backdrop" aria-label="Close expanded table" onClick={() => setExpandedTable(null)} /> : null}

      <section className="consent-filter-panel">
        <label className="consent-search"><Search size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search templates, versions, language, content..." /></label>
        <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
          <option value="ALL">All consent types</option>
          {CONSENT_TYPES.map((type) => <option key={type}>{type}</option>)}
        </select>
        <button onClick={() => void load()}>Apply Filter</button>
      </section>

      <section className="consent-grid">
        <div className="consent-main">
          <section className={`consent-panel consent-table-panel${expandedTable === "templates" ? " consent-table-expanded" : ""}`}>
            <div className="consent-panel-title"><h2>Digital Consent Form Library</h2><button className="consent-expand-btn" type="button" aria-label={expandedTable === "templates" ? "Collapse consent template table" : "Expand consent template table"} onClick={() => setExpandedTable((current) => current === "templates" ? null : "templates")}>{expandedTable === "templates" ? <Minimize2 size={16} /> : <Maximize2 size={16} />}</button></div>
            <div className="consent-table-wrap">
              <table className="consent-table">
                <thead><tr><th>Template</th><th>Type</th><th>Version</th><th>Language</th><th>Status</th><th>Effective</th></tr></thead>
                <tbody>
                  {filteredTemplates.length ? filteredTemplates.map((row) => (
                    <tr key={row.id} className={`${selectedTemplateId === row.id ? "is-selected " : ""}consent-clickable-row`} onClick={() => { setSelectedTemplateId(row.id); openDocument(row); }}>
                      <td><strong>{row.title}</strong><small>{String(row.content || "").slice(0, 92)}</small></td>
                      <td>{pretty(row.consentType)}</td>
                      <td>{row.versionNumber}</td>
                      <td>{row.language}</td>
                      <td><span className="consent-pill">{row.isCurrent ? "CURRENT" : "ARCHIVED"}</span></td>
                      <td>{fmtDate(row.effectiveFrom)}</td>
                    </tr>
                  )) : <tr><td className="consent-empty" colSpan={6}>No consent templates found.</td></tr>}
                </tbody>
              </table>
            </div>
          </section>

          <section className={`consent-panel consent-table-panel${expandedTable === "records" ? " consent-table-expanded" : ""}`}>
            <div className="consent-panel-title"><h2>Completed Consent Records</h2><button className="consent-expand-btn" type="button" aria-label={expandedTable === "records" ? "Collapse consent records table" : "Expand consent records table"} onClick={() => setExpandedTable((current) => current === "records" ? null : "records")}>{expandedTable === "records" ? <Minimize2 size={16} /> : <Maximize2 size={16} />}</button></div>
            <div className="consent-table-wrap">
              <table className="consent-table">
                <thead><tr><th>Patient</th><th>Consent</th><th>Version</th><th>Given By</th><th>Witness</th><th>Status</th><th>Time</th></tr></thead>
                <tbody>
                  {filteredRecords.length ? filteredRecords.slice(0, 12).map((row) => (
                    <tr key={row.id} className={`${selectedRecordId === row.id ? "is-selected " : ""}consent-clickable-row`} onClick={() => { setSelectedRecordId(row.id); openDocument(row); }}>
                      <td>{row.patientId}<small>{row.encounterId || "No encounter"}</small></td>
                      <td>{pretty(row.consentType)}</td>
                      <td>{row.consentFormVersion}</td>
                      <td>{row.consentGivenBy}<small>{row.relationshipToPatient || "SELF"}</small></td>
                      <td>{row.witnessName || "-"}</td>
                      <td><span className="consent-pill">{row.consented ? (row.withdrawnAt ? "WITHDRAWN" : "ACTIVE") : "REFUSED"}</span></td>
                      <td>{fmtDate(row.consentedAt)}</td>
                    </tr>
                  )) : <tr><td className="consent-empty" colSpan={7}>No completed consents recorded yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <aside className="consent-side">
          <section className="consent-panel consent-side-actions">
            <div className="consent-panel-title"><h2>Consent Actions</h2><span>Workflow and governance tools</span></div>
            <div className="consent-action-grid">
              <button className="consent-btn dark" onClick={() => setModal("verify")}><ShieldCheck size={16} /> Verify Consent</button>
              <button className="consent-btn purple" onClick={() => setModal("withdrawal")}><Scale size={16} /> Withdrawal</button>
              <button className="consent-btn red" onClick={() => setModal("emergency")}><Scale size={16} /> Emergency Exception</button>
              <button className="consent-btn orange" onClick={() => setModal("downtime")}><History size={16} /> Reconcile Downtime</button>
              <button className="consent-btn blue" onClick={() => setModal("template")}><FileText size={16} /> Template Version</button>
              <button className="consent-filter-action report" onClick={() => void loadReport()}><FileText size={16} /> Compliance Report</button>
              <button className="consent-filter-action renew" onClick={() => void renewSelected()} disabled={!selectedRecord || saving === "renew"}><History size={16} /> Renew Selected</button>
              <button className="consent-filter-action audit" onClick={() => void viewAudit()} disabled={!selectedRecord}><ShieldCheck size={16} /> View Audit</button>
              <button className="consent-filter-action clinical" onClick={() => void reviewTemplate("CLINICAL_REVIEW")} disabled={!selectedTemplateId}>Clinical Review</button>
              <button className="consent-filter-action legal" onClick={() => void reviewTemplate("LEGAL_REVIEW")} disabled={!selectedTemplateId}>Legal Review</button>
              <button className="consent-filter-action approve" onClick={() => void reviewTemplate("APPROVED")} disabled={!selectedTemplateId}>Approve Template</button>
              <button className="consent-filter-action expiry" onClick={() => void expireDue()}>Process Expiry</button>
              <button className="consent-filter-action audit" onClick={() => setModal("review")} disabled={!selectedWithdrawal}>Review Withdrawal</button>
            </div>
          </section>
          <section className="consent-selected">
            <span>DPA Withdrawal Review</span>
            <h2>{selectedWithdrawal ? pretty(selectedWithdrawal.consentType) : "No withdrawal selected"}</h2>
            <dl>
              <div><dt>Status</dt><dd>{selectedWithdrawal?.status || "-"}</dd></div>
              <div><dt>Channel</dt><dd>{selectedWithdrawal?.channel || "-"}</dd></div>
              <div><dt>Date</dt><dd>{fmtDate(selectedWithdrawal?.createdAt)}</dd></div>
            </dl>
          </section>
          <section className="consent-panel">
            <div className="consent-panel-title"><h2>Withdrawal Queue</h2></div>
            <div className="consent-list">
              {withdrawals.length ? withdrawals.map((row) => (
                <button key={row.id} onClick={() => setSelectedWithdrawalId(row.id)}>
                  <span><strong>{row.patientId}</strong><small>{row.reason}</small></span><b>{row.status}</b>
                </button>
              )) : <p className="consent-note">No consent withdrawal requests.</p>}
            </div>
          </section>
          <section className="consent-panel">
            <div className="consent-panel-title"><h2>Selected Consent Audit</h2></div>
            <div className="consent-list">
              {selectedRecord ? <p className="consent-note"><strong>{selectedRecord.patientId}</strong> · {pretty(selectedRecord.consentType)}<br />Version {selectedRecord.consentFormVersion}. Click View Audit to load the immutable history.</p> : <p className="consent-note">Select a consent record to inspect its audit trail.</p>}
              {auditRows.map((row) => <div className="consent-audit-row" key={row.id}><strong>{pretty(row.eventName)}</strong><small>{fmtDate(row.createdAt)} · {row.actorId || row.reviewedBy || row.obtainedBy || "System"}</small></div>)}
            </div>
          </section>
        </aside>
      </section>

      {notice ? <div className={`consent-toast ${/could not|incomplete|required|No /i.test(notice) ? "warning" : "success"}`}><strong>{/could not|incomplete|required|No /i.test(notice) ? "Attention" : "Saved"}</strong><span>{notice}</span><button onClick={() => setNotice("")}>x</button></div> : null}
      {loading ? <div className="consent-loading">Loading consent management...</div> : null}

      {modal === "view" && viewRow ? (
          <ConsentModal document title={viewRow.content ? (viewRow.title || "Consent Document") : "Consent Record"} tone="blue" onClose={() => { setModal(""); setViewRow(null); }}>
          <DocumentView row={viewRow} facility={hospitalProfile} onClose={() => { setModal(""); setViewRow(null); }} />
        </ConsentModal>
      ) : null}

      {modal === "template" ? (
        <ConsentModal title="Consent Template Version" tone="blue" onClose={() => setModal("")}>
          <form className="consent-form" onSubmit={saveTemplate}>
            <label><span>Consent Type</span><select value={templateForm.consentType} onChange={(event) => updateTemplate("consentType", event.target.value)}>{CONSENT_TYPES.map((type) => <option key={type}>{type}</option>)}</select></label>
            <label><span>Version</span><input value={templateForm.versionNumber} onChange={(event) => updateTemplate("versionNumber", event.target.value)} /></label>
            <label><span>Title</span><input value={templateForm.title} onChange={(event) => updateTemplate("title", event.target.value)} required /></label>
            <label><span>Purpose</span><input value={templateForm.purpose} onChange={(event) => updateTemplate("purpose", event.target.value)} placeholder="What this consent authorizes" required /></label>
            <label><span>Owner department</span><input value={templateForm.ownerDepartment} onChange={(event) => updateTemplate("ownerDepartment", event.target.value)} placeholder="Medical Records, OT, Research" /></label>
            <label><span>Legal review reference</span><input value={templateForm.legalReviewReference} onChange={(event) => updateTemplate("legalReviewReference", event.target.value)} /></label>
            <label><span>Language</span><select value={templateForm.language} onChange={(event) => updateTemplate("language", event.target.value)}>{LANGUAGES.map((language) => <option key={language}>{language}</option>)}</select></label>
            <label><span>Effective from</span><input type="date" value={(templateForm as any).effectiveFrom || today} onChange={(event) => updateTemplate("effectiveFrom", event.target.value)} /></label>
            <label><span>Review / expiry date</span><input type="date" value={(templateForm as any).effectiveTo || ""} onChange={(event) => updateTemplate("effectiveTo", event.target.value)} /></label>
            <label className="wide"><span>Template Content</span><textarea value={templateForm.content} onChange={(event) => updateTemplate("content", event.target.value)} required /></label>
            <label className="consent-check"><input type="checkbox" checked={templateForm.isCurrent} onChange={(event) => updateTemplate("isCurrent", event.target.checked)} /> Activate as current version</label>
            <label className="consent-check"><input type="checkbox" checked={templateForm.requiredWitness} onChange={(event) => updateTemplate("requiredWitness", event.target.checked)} /> Witness required</label>
            <label className="consent-check"><input type="checkbox" checked={templateForm.guardianAllowed} onChange={(event) => updateTemplate("guardianAllowed", event.target.checked)} /> Guardian / representative allowed</label>
            <label className="consent-check"><input type="checkbox" checked={templateForm.digitalSignatureRequired} onChange={(event) => updateTemplate("digitalSignatureRequired", event.target.checked)} /> Digital signature required</label>
            <footer><button type="button" onClick={() => setModal("")}>Cancel</button><button disabled={saving === "template"}>{saving === "template" ? "Saving..." : "Save Template"}</button></footer>
          </form>
        </ConsentModal>
      ) : null}

      {modal === "request" ? (
        <ConsentModal title="Create Consent Request" tone="teal" onClose={() => setModal("")}>
          <form className="consent-form" onSubmit={submitRequest}>
            <label><span>Patient ID / MRN</span><input value={requestForm.patientId} onChange={(event) => setRequestForm((current) => ({ ...current, patientId: event.target.value }))} required /></label>
            <label><span>Encounter / Admission</span><input value={requestForm.encounterId} onChange={(event) => setRequestForm((current) => ({ ...current, encounterId: event.target.value }))} /></label>
            <label><span>Source module</span><select value={requestForm.sourceModule} onChange={(event) => setRequestForm((current) => ({ ...current, sourceModule: event.target.value }))}>{SOURCE_MODULES.map((module) => <option key={module}>{module}</option>)}</select></label>
            <label><span>Consent type</span><select value={requestForm.consentType} onChange={(event) => setRequestForm((current) => ({ ...current, consentType: event.target.value }))}>{CONSENT_TYPES.map((type) => <option key={type}>{type}</option>)}</select></label>
            <label><span>Source record ID</span><input value={requestForm.sourceRecordId} onChange={(event) => setRequestForm((current) => ({ ...current, sourceRecordId: event.target.value }))} /></label>
            <label><span>Requested scope</span><input value={requestForm.scope} onChange={(event) => setRequestForm((current) => ({ ...current, scope: event.target.value }))} placeholder="Treatment, research, teaching" /></label>
            <footer><button type="button" onClick={() => setModal("")}>Cancel</button><button disabled={saving === "request"}>{saving === "request" ? "Creating..." : "Create Request"}</button></footer>
          </form>
        </ConsentModal>
      ) : null}

      {modal === "verify" ? (
        <ConsentModal title="Verify Current Consent" tone="dark" onClose={() => setModal("")}>
          <form className="consent-form" onSubmit={verifyConsent}>
            <label><span>Patient ID / MRN</span><input value={verifyForm.patientId} onChange={(event) => setVerifyForm((current) => ({ ...current, patientId: event.target.value }))} required /></label>
            <label><span>Consent type</span><select value={verifyForm.consentType} onChange={(event) => setVerifyForm((current) => ({ ...current, consentType: event.target.value }))}>{CONSENT_TYPES.map((type) => <option key={type}>{type}</option>)}</select></label>
            {verification ? <div className="consent-verification-result"><strong>{verification.status}</strong><span>Version: {verification.version || "-"} · Verified {fmtDate(verification.verifiedAt)}</span></div> : null}
            <footer><button type="button" onClick={() => setModal("")}>Cancel</button><button disabled={saving === "verify"}>{saving === "verify" ? "Checking..." : "Verify Consent"}</button></footer>
          </form>
        </ConsentModal>
      ) : null}

      {modal === "emergency" ? (
        <ConsentModal title="Controlled Emergency Exception" tone="red" onClose={() => setModal("")}>
          <form className="consent-form" onSubmit={submitEmergency}>
            <label><span>Patient ID / MRN</span><input value={emergencyForm.patientId} onChange={(event) => setEmergencyForm((current) => ({ ...current, patientId: event.target.value }))} required /></label>
            <label><span>Consent type</span><select value={emergencyForm.consentType} onChange={(event) => setEmergencyForm((current) => ({ ...current, consentType: event.target.value }))}>{CONSENT_TYPES.map((type) => <option key={type}>{type}</option>)}</select></label>
            <label><span>Responsible clinician</span><input value={emergencyForm.responsibleClinician} onChange={(event) => setEmergencyForm((current) => ({ ...current, responsibleClinician: event.target.value }))} required /></label>
            <label><span>Policy / legal basis</span><input value={emergencyForm.policyBasis} onChange={(event) => setEmergencyForm((current) => ({ ...current, policyBasis: event.target.value }))} required /></label>
            <label className="wide"><span>Emergency reason</span><textarea value={emergencyForm.emergencyReason} onChange={(event) => setEmergencyForm((current) => ({ ...current, emergencyReason: event.target.value }))} required /></label>
            <label className="wide"><span>Patient condition</span><textarea value={emergencyForm.patientCondition} onChange={(event) => setEmergencyForm((current) => ({ ...current, patientCondition: event.target.value }))} required /></label>
            <footer><button type="button" onClick={() => setModal("")}>Cancel</button><button disabled={saving === "emergency"}>{saving === "emergency" ? "Recording..." : "Record Exception"}</button></footer>
          </form>
        </ConsentModal>
      ) : null}

      {modal === "downtime" ? (
        <ConsentModal title="Downtime Consent Reconciliation" tone="orange" onClose={() => setModal("")}>
          <form className="consent-form" onSubmit={submitDowntime}>
            <label className="wide"><span>Offline consent references</span><textarea rows={8} value={downtimeForm.entries} onChange={(event) => setDowntimeForm((current) => ({ ...current, entries: event.target.value }))} placeholder="One offline form/reference per line" required /></label>
            <label className="wide"><span>Reconciliation notes</span><textarea value={downtimeForm.notes} onChange={(event) => setDowntimeForm((current) => ({ ...current, notes: event.target.value }))} /></label>
            <footer><button type="button" onClick={() => setModal("")}>Cancel</button><button disabled={saving === "downtime"}>{saving === "downtime" ? "Reconciling..." : "Reconcile Records"}</button></footer>
          </form>
        </ConsentModal>
      ) : null}

      {modal === "workflow" ? (
        <ConsentModal title="Guided Consent Workflow" tone="green" onClose={() => setModal("")}>
          <form className="consent-form" onSubmit={completeWorkflow}>
            <label><span>Patient ID</span><input value={workflowForm.patientId} onChange={(event) => updateWorkflow("patientId", event.target.value)} required /></label>
            <label><span>Encounter / Source ID</span><input value={workflowForm.encounterId} onChange={(event) => updateWorkflow("encounterId", event.target.value)} /></label>
            <label><span>Source Module</span><select value={workflowForm.sourceModule} onChange={(event) => updateWorkflow("sourceModule", event.target.value)}>{SOURCE_MODULES.map((module) => <option key={module}>{module}</option>)}</select></label>
            <label><span>Consent Type</span><select value={workflowForm.consentType} onChange={(event) => updateWorkflow("consentType", event.target.value)}>{CONSENT_TYPES.map((type) => <option key={type}>{type}</option>)}</select></label>
            <label><span>Patient / Guardian</span><input value={workflowForm.consentGivenBy} onChange={(event) => updateWorkflow("consentGivenBy", event.target.value)} required /></label>
            <label><span>Relationship</span><select value={workflowForm.relationshipToPatient} onChange={(event) => updateWorkflow("relationshipToPatient", event.target.value)}>{RELATIONSHIPS.map((relationship) => <option key={relationship}>{relationship}</option>)}</select></label>
            <label><span>Decision</span><select value={workflowForm.decision} onChange={(event) => updateWorkflow("decision", event.target.value)}><option>CONSENTED</option><option>REFUSED</option></select></label>
            <label><span>Consent scope</span><input value={workflowForm.scope} onChange={(event) => updateWorkflow("scope", event.target.value)} placeholder="Treatment, research, teaching" /></label>
            {workflowForm.decision === "REFUSED" ? <label className="wide"><span>Refusal reason (optional)</span><textarea value={workflowForm.refusalReason} onChange={(event) => updateWorkflow("refusalReason", event.target.value)} /></label> : null}
            <label><span>Witness Name</span><input value={workflowForm.witnessName} onChange={(event) => updateWorkflow("witnessName", event.target.value)} required={workflowForm.witnessRequired && workflowForm.decision === "CONSENTED"} /></label>
            <label className="consent-check"><input type="checkbox" checked={workflowForm.witnessRequired} onChange={(event) => updateWorkflow("witnessRequired", event.target.checked)} /> Witness required by policy</label>
            <label><span>Language</span><select value={workflowForm.language} onChange={(event) => updateWorkflow("language", event.target.value)}>{LANGUAGES.map((language) => <option key={language}>{language}</option>)}</select></label>
            <label><span>Capacity outcome</span><select value={workflowForm.capacityOutcome} onChange={(event) => updateWorkflow("capacityOutcome", event.target.value)}><option>CONFIRMED</option><option>UNCERTAIN</option><option>ABSENT</option><option>TEMPORARY_INCAPACITY</option><option>DEFERRED</option></select></label>
            <label><span>Consent expiry</span><input type="date" value={workflowForm.effectiveTo} onChange={(event) => updateWorkflow("effectiveTo", event.target.value)} /></label>
            <label><span>Guardian authority type</span><input value={workflowForm.guardianAuthorityType} onChange={(event) => updateWorkflow("guardianAuthorityType", event.target.value)} placeholder="Required when not SELF" /></label>
            <label><span>Authority evidence/reference</span><input value={workflowForm.guardianAuthorityReference} onChange={(event) => updateWorkflow("guardianAuthorityReference", event.target.value)} /></label>
            <label><span>Interpreter name</span><input value={workflowForm.interpreterName} onChange={(event) => updateWorkflow("interpreterName", event.target.value)} /></label>
            <label><span>Interpreter language</span><input value={workflowForm.interpreterLanguage} onChange={(event) => updateWorkflow("interpreterLanguage", event.target.value)} placeholder="e.g. Kiswahili" /></label>
            <label className="wide"><span>Patient / Guardian Digital Signature</span><textarea value={workflowForm.patientSignature} onChange={(event) => updateWorkflow("patientSignature", event.target.value)} placeholder="Captured signature data URL or secure signature reference" required={workflowForm.decision === "CONSENTED"} /></label>
            <label className="wide"><span>Witness Digital Signature</span><textarea value={workflowForm.witnessSignature} onChange={(event) => updateWorkflow("witnessSignature", event.target.value)} placeholder="Captured signature data URL or secure signature reference" required={workflowForm.witnessRequired && workflowForm.decision === "CONSENTED"} /></label>
            {["capacityConfirmed", "procedureExplained", "risksExplained", "alternativesExplained", "questionsAllowed", "decisionDocumented"].map((key) => <label className="consent-check" key={key}><input type="checkbox" checked={Boolean((workflowForm as any)[key])} onChange={(event) => updateWorkflow(key, event.target.checked)} /> {pretty(key)}</label>)}
            <footer><button type="button" onClick={() => setModal("")}>Cancel</button><button disabled={saving === "workflow"}>{saving === "workflow" ? "Saving..." : "Complete Consent"}</button></footer>
          </form>
        </ConsentModal>
      ) : null}

      {modal === "withdrawal" ? (
        <ConsentModal title="Consent Withdrawal Request" tone="purple" onClose={() => setModal("")}>
          <form className="consent-form" onSubmit={submitWithdrawal}>
            <label><span>Patient ID</span><input value={withdrawalForm.patientId} onChange={(event) => updateWithdrawal("patientId", event.target.value)} required /></label>
            <label><span>Representative</span><input value={withdrawalForm.representativeName} onChange={(event) => updateWithdrawal("representativeName", event.target.value)} /></label>
            <label><span>Channel</span><select value={withdrawalForm.channel} onChange={(event) => updateWithdrawal("channel", event.target.value)}>{["PATIENT_PORTAL", "IN_PERSON", "PHONE", "EMAIL", "CONTACT_CHANNEL"].map((item) => <option key={item}>{item}</option>)}</select></label>
            <label><span>Consent Type</span><select value={withdrawalForm.consentType} onChange={(event) => updateWithdrawal("consentType", event.target.value)}>{CONSENT_TYPES.map((type) => <option key={type}>{type}</option>)}</select></label>
            <label><span>Withdrawal scope</span><input value={withdrawalForm.scope} onChange={(event) => updateWithdrawal("scope", event.target.value)} placeholder="Leave blank for full withdrawal" /></label>
            <label className="wide"><span>Reason</span><textarea value={withdrawalForm.reason} onChange={(event) => updateWithdrawal("reason", event.target.value)} required /></label>
            <footer><button type="button" onClick={() => setModal("")}>Cancel</button><button disabled={saving === "withdrawal"}>{saving === "withdrawal" ? "Saving..." : "Log Withdrawal"}</button></footer>
          </form>
        </ConsentModal>
      ) : null}

      {modal === "review" ? (
        <ConsentModal title="Records & DPO Review" tone="red" onClose={() => setModal("")}>
          <form className="consent-form" onSubmit={reviewWithdrawal}>
            <label><span>Decision</span><select value={reviewForm.decision} onChange={(event) => updateReview("decision", event.target.value)}>{["FULLY_ACTED", "PARTIALLY_ACTED", "DECLINED_WITH_LEGAL_BASIS"].map((item) => <option key={item}>{item}</option>)}</select></label>
            <label><span>Medical Records Officer</span><input value={reviewForm.medicalRecordsOfficer} onChange={(event) => updateReview("medicalRecordsOfficer", event.target.value)} /></label>
            <label><span>Data Protection Officer</span><input value={reviewForm.dataProtectionOfficer} onChange={(event) => updateReview("dataProtectionOfficer", event.target.value)} /></label>
            <label><span>Continuing Legal Basis</span><input value={reviewForm.continuingLegalBasis} onChange={(event) => updateReview("continuingLegalBasis", event.target.value)} /></label>
            <label className="wide"><span>Processing to Cease</span><textarea value={reviewForm.processingToCease} onChange={(event) => updateReview("processingToCease", event.target.value)} /></label>
            <label className="wide"><span>Data to Delete</span><textarea value={reviewForm.dataToDelete} onChange={(event) => updateReview("dataToDelete", event.target.value)} /></label>
            <label className="wide"><span>Reasons</span><textarea value={reviewForm.reasons} onChange={(event) => updateReview("reasons", event.target.value)} required /></label>
            <footer><button type="button" onClick={() => setModal("")}>Cancel</button><button disabled={!selectedWithdrawal || saving === "review"}>{saving === "review" ? "Saving..." : "Save Review"}</button></footer>
          </form>
        </ConsentModal>
      ) : null}
    </main>
  );
}

function ConsentModal({ title, tone, onClose, children, document = false }: { title: string; tone: string; onClose: () => void; children: ReactNode; document?: boolean }) {
  return <div className="consent-modal-backdrop"><section className={`consent-modal is-${tone}${document ? " is-document" : ""}`}><header><div><span>Consent Management</span><h2>{title}</h2></div><button type="button" onClick={onClose} aria-label="Close form"><X size={18} /></button></header>{children}</section></div>;
}

function DocumentView({ row, facility, onClose }: { row: any; facility: { name: string; address: string; postalAddress: string; phone: string; emergencyPhone: string; email: string; website: string; registrationNumber: string; mflCode: string; licenseNumber: string; tagline: string; logoUrl: string }; onClose: () => void }) {
  const isTemplate = Boolean(row.content);
  const rawTemplate = String(row.content || "").trim();
  const hasTemplateHtml = /<\s*(section|div|p|h[1-6]|main|html|body)\b/i.test(rawTemplate);
  const title = isTemplate ? row.title || pretty(row.consentType) : `${pretty(row.consentType)} — Patient Consent`;
  const code = row.formCode || row.code || CONSENT_FORM_CODES[row.consentType] || `CONS-${String(row.consentType || "FORM").replace(/_CONSENT|_FORM/g, "").slice(0, 8)}`;
  return <div className="consent-document-view consent-print-sheet">
    <div className="consent-document-brand"><img src={facility.logoUrl} alt={`${facility.name} logo`} /><div><h1>{facility.name}</h1>{facility.tagline ? <p>{facility.tagline}</p> : null}{facility.address || facility.postalAddress ? <p>{facility.address}{facility.postalAddress ? ` · ${facility.postalAddress}` : ""}</p> : null}<p className="consent-document-contact"><strong>Tel:</strong> {facility.phone || "Not configured"} <span aria-hidden="true">|</span> <strong>Email:</strong> {facility.email || "Not configured"}</p>{facility.emergencyPhone || facility.website ? <p className="consent-document-contact secondary">{facility.emergencyPhone ? `Emergency: ${facility.emergencyPhone}` : ""}{facility.website ? ` · ${facility.website}` : ""}</p> : null}<small>{facility.registrationNumber ? `Registration: ${facility.registrationNumber} · ` : ""}{facility.mflCode ? `MFL: ${facility.mflCode} · ` : ""}{facility.licenseNumber ? `License: ${facility.licenseNumber} · ` : ""}CONFIDENTIAL HEALTH RECORD</small></div></div>
    <div className="consent-document-heading"><h1>INFORMED CONSENT FORM</h1><p className="consent-document-purpose-label">Consent purpose</p><h2>{title}</h2><p>Department: {row.department || row.ownerDepartment || "Clinical Services"}</p></div>
    <div className="consent-document-identifiers"><span>Form Code: <strong>{code}</strong></span><span>Version: <strong>{row.versionNumber || row.consentFormVersion || "v1.0"}</strong></span><span>Effective: <strong>{fmtDate(row.effectiveFrom || row.consentedAt || today)}</strong></span><span>Status: <strong>{isTemplate ? row.lifecycleStatus || "APPROVED" : (row.consented ? "ACTIVE" : "REFUSED")}</strong></span></div>
    {!hasTemplateHtml ? <section className="consent-document-section"><h3>PATIENT INFORMATION</h3><div className="consent-document-fields"><div><strong>Patient full name</strong><span>{row.patientName || row.patient?.fullName || "________________________________"}</span></div><div><strong>Medical record number</strong><span>{row.mrn || row.patient?.mrn || row.patientId || "________________________________"}</span></div><div><strong>Date of birth</strong><span>{row.dateOfBirth || row.patient?.dateOfBirth || "________________"}</span></div><div><strong>Telephone</strong><span>{row.phone || row.patient?.phone || "________________"}</span></div></div></section> : null}
    {isTemplate && hasTemplateHtml ? <div className="consent-html-template" dangerouslySetInnerHTML={{ __html: templateHtml(rawTemplate, row, facility) }} /> : <article className="consent-document-section consent-declaration"><h3>DECLARATION AND SIGNATURES</h3><div className="consent-document-content"><p>{row.governance?.purpose || "Please read this document carefully. The healthcare team will explain the proposed care, its purpose, expected benefits, possible risks, and available alternatives before you decide."}</p><p>I confirm that the information provided to me has been explained in a language and manner I understand. I have had an opportunity to ask questions and have received answers to my questions.</p><p>I understand the nature, purpose, expected benefits, material risks, alternatives, and potential consequences of the proposed intervention. I voluntarily agree to proceed with the intervention described in this consent form.</p>{isTemplate ? <div>{String(row.content).split(/\n+/).filter(Boolean).map((paragraph: string, index: number) => <p key={index}>{paragraph}</p>)}</div> : null}<div className="consent-response-fields"><label>Patient / representative full name<input type="text" placeholder="Enter full name" /></label><label>Relationship to patient<input type="text" placeholder="Self, parent, guardian, or representative" /></label><label className="wide">Questions or notes<textarea rows={3} placeholder="Record any questions, concerns, or notes" /></label><label className="consent-check"><input type="checkbox" /> I understand the information above and agree to proceed.</label></div><div className="consent-signature-grid"><div><b>Patient / Service User</b><span className="consent-signature-line" /><small>Name and date/time</small></div><div><b>Parent / Guardian / Representative</b><span className="consent-signature-line" /><small>Name and authority</small></div><div><b>Clinician / Authorized Professional</b><span className="consent-signature-line" /><small>Name and registration number</small></div><div><b>Witness</b><span className="consent-signature-line" /><small>Name and date/time</small></div><div><b>Interpreter, if applicable</b><span className="consent-signature-line" /><small>Name and language</small></div><div><b>Digital signature / verification</b><span className="consent-signature-line" /><small>Record ID and verification</small></div></div></div></article>}
    <footer className="consent-document-footer"><strong>{facility.name}</strong><span>{facility.address}{facility.phone ? ` · ${facility.phone}` : ""}{facility.email ? ` · ${facility.email}` : ""}</span><span>{code} · v{row.versionNumber || row.consentFormVersion || "1.0"} · CONFIDENTIAL · Page 1</span></footer>
    <div className="consent-document-actions consent-document-actions-bottom"><button type="button" className="secondary" onClick={onClose}>Close</button><button type="button" onClick={() => window.print()}><FileText size={15} /> Print / Save as PDF</button></div>
  </div>;
}
