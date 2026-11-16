// Ported from Medilink-Frontend/src/app/documents/page.tsx for desktop parity.
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import {
  Archive,
  ArchiveRestore,
  CheckCircle2,
  Clock3,
  FileClock,
  FileText,
  History,
  Link2,
  LockKeyhole,
  Maximize2,
  Minimize2,
  RefreshCw,
  Search,
  ShieldCheck,
  Send,
  UploadCloud,
  X,
} from "lucide-react";
import { api } from "../lib/api";
import { useLiveRefresh } from "../lib/liveRefresh";

const today = new Date().toISOString().slice(0, 10);
const DOCUMENT_TYPES = [
  "Consent Form",
  "Referral Letter",
  "External Investigation Report",
  "Scanned Paper Record",
  "Insurance Pre-auth",
  "Research Protocol",
  "Supplier Contract",
  "Accreditation Certificate",
  "Board Minutes",
  "Policy Document",
  "Staff Contract",
  "Insurance Policy",
];
const ACCESS_LEVELS = ["INTERNAL", "CLINICAL", "FINANCE", "HR", "RESTRICTED", "CONFIDENTIAL"];
const RETENTION_CATEGORIES = ["CLINICAL", "PAEDIATRIC_CLINICAL", "FINANCIAL", "EMPLOYEE", "ADMINISTRATIVE", "RESEARCH"];

const emptyDocument = {
  documentType: "Consent Form",
  title: "",
  fileName: "",
  filePath: "",
  mimeType: "application/pdf",
  fileSizeBytes: "",
  patientId: "",
  staffId: "",
  supplierId: "",
  encounterId: "",
  author: "",
  department: "",
  accessLevel: "CLINICAL",
  documentDate: today,
  effectiveFrom: today,
  retentionCategory: "CLINICAL",
  patientDateOfBirth: "",
  terminationDate: "",
  tags: "",
  ocrText: "",
  fileContentBase64: "",
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

const unwrapItems = (value: any) => {
  const data = value?.data ?? value;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  return [];
};

export default function DocumentsView() {
  const [dashboard, setDashboard] = useState<any>({});
  const [documents, setDocuments] = useState<any[]>([]);
  const [reviewQueue, setReviewQueue] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [selected, setSelected] = useState<any>(null);
  const [versionAt, setVersionAt] = useState(today);
  const [versionAtResult, setVersionAtResult] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [modal, setModal] = useState<"" | "upload" | "version" | "purge" | "share" | "hold" | "lifecycle">("");
  const [documentForm, setDocumentForm] = useState(emptyDocument);
  const [versionForm, setVersionForm] = useState({ ...emptyDocument, changeSummary: "" });
  const [purgeReason, setPurgeReason] = useState("");
  const [shareForm, setShareForm] = useState({ recipient: "", recipientType: "USER", purpose: "Authorised document access", expiresAt: "", oneTime: false });
  const [holdReason, setHoldReason] = useState("");
  const [lifecycleForm, setLifecycleForm] = useState({ status: "REVIEW", reason: "" });
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");
  const [expandedTable, setExpandedTable] = useState<"repository" | "retention" | null>(null);

  const selectedDocument = selected || documents.find((row) => row.id === selectedId) || documents[0] || null;
  const totals = dashboard?.totals || {};
  const stats = [
    { label: "Repository", value: totals.documents || documents.length, icon: FileText },
    { label: "Versions", value: totals.versions || 0, icon: History },
    { label: "Review Queue", value: totals.retentionReview || reviewQueue.length, icon: FileClock },
    { label: "Clinical Records", value: totals.clinical || 0, icon: ShieldCheck },
    { label: "Admin Records", value: totals.administrative || 0, icon: Archive },
    { label: "Purged", value: totals.purged || 0, icon: CheckCircle2 },
  ];

  const setToast = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice((current) => (current === message ? "" : current)), 5200);
  };

  const load = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (search.trim()) params.q = search.trim();
      if (typeFilter !== "ALL") params.documentType = typeFilter;
      const [dashRes, docsRes, reviewRes] = await Promise.all([
        api.get("/documents/dashboard").catch(() => ({ data: {} })),
        api.get("/documents/documents", { params }).catch(() => ({ data: { items: [] } })),
        api.get("/documents/retention/review-queue").catch(() => ({ data: { items: [] } })),
      ]);
      const rows = unwrapItems(docsRes.data);
      setDashboard(dashRes.data || {});
      setDocuments(rows);
      setReviewQueue(unwrapItems(reviewRes.data));
      setSelectedId((current) => current || rows[0]?.id || "");
    } catch (error: any) {
      setToast(error?.response?.data?.message || "Document repository could not be loaded.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);
  useLiveRefresh(load, { intervalMs: 60000 });

  useEffect(() => {
    const loadSelected = async () => {
      if (!selectedId) {
        setSelected(null);
        return;
      }
      try {
        const res = await api.get(`/documents/documents/${selectedId}`);
        setSelected(res.data?.data ?? res.data);
      } catch {
        setSelected(documents.find((row) => row.id === selectedId) || null);
      }
    };
    void loadSelected();
  }, [selectedId, documents]);

  const visibleTypes = useMemo(() => {
    const fromRows = documents.map((row) => String(row.documentType || "")).filter(Boolean);
    return Array.from(new Set([...DOCUMENT_TYPES, ...fromRows]));
  }, [documents]);

  const submitDocument = async (event: FormEvent) => {
    event.preventDefault();
    setSaving("upload");
    try {
      const res = await api.post("/documents/documents", documentForm);
      setSelectedId((res.data?.data ?? res.data)?.id || "");
      setDocumentForm(emptyDocument);
      setModal("");
      setToast("Document indexed with metadata, version 1, and retention policy.");
      await load();
    } catch (error: any) {
      setToast(error?.response?.data?.message || "Document could not be indexed.");
    } finally {
      setSaving("");
    }
  };

  const submitVersion = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedDocument?.id) return setToast("Select a document first.");
    setSaving("version");
    try {
      const payload = { ...versionForm, title: versionForm.title || selectedDocument.title };
      const res = await api.post(`/documents/documents/${selectedDocument.id}/versions`, payload);
      setSelectedId((res.data?.data ?? res.data)?.id || selectedDocument.id);
      setVersionForm({ ...emptyDocument, changeSummary: "" });
      setModal("");
      setToast("New version uploaded under the same document record.");
      await load();
    } catch (error: any) {
      setToast(error?.response?.data?.message || "Version could not be uploaded.");
    } finally {
      setSaving("");
    }
  };

  const requestReview = async (row: any) => {
    setSaving(`review-${row.id}`);
    try {
      await api.delete(`/documents/documents/${row.id}`, { data: { reason: "Mandatory retention period has expired; queue for officer review." } });
      setToast("Document moved to the authorised retention review queue.");
      await load();
    } catch (error: any) {
      setToast(error?.response?.data?.message || "Retention policy blocked deletion.");
    } finally {
      setSaving("");
    }
  };

  const approvePurge = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedDocument?.id) return setToast("Select an expired document first.");
    setSaving("purge");
    try {
      await api.post(`/documents/retention/${selectedDocument.id}/approve-purge`, {
        reason: purgeReason,
        approvingOfficer: "Authorised Records Officer",
      });
      setPurgeReason("");
      setSelectedId("");
      setSelected(null);
      setModal("");
      setToast("Document versions permanently purged and audit entry recorded.");
      await load();
    } catch (error: any) {
      setToast(error?.response?.data?.message || "Purge approval failed.");
    } finally {
      setSaving("");
    }
  };

  const findVersionAt = async () => {
    if (!selectedDocument?.id) return setToast("Select a document first.");
    setSaving("version-at");
    try {
      const res = await api.get(`/documents/documents/${selectedDocument.id}/version-at`, { params: { date: versionAt } });
      setVersionAtResult(res.data?.data ?? res.data);
      setToast("Version in force retrieved for the selected date.");
    } catch (error: any) {
      setVersionAtResult(null);
      setToast(error?.response?.data?.message || "No version was in force on that date.");
    } finally {
      setSaving("");
    }
  };

  const loadReport = async () => {
    try {
      const response = await api.get("/documents/reports");
      const report = response.data?.data ?? response.data;
      setToast(`${report?.totals?.documents || 0} documents, ${report?.totals?.reviewDue || 0} retention reviews due, ${report?.totals?.auditEvents || 0} audit events.`);
    } catch (error: any) {
      setToast(error?.response?.data?.message || "Repository report could not be loaded.");
    }
  };

  const checkDuplicates = async () => {
    if (!selectedDocument?.id) return;
    try {
      const response = await api.post(`/documents/duplicates/${selectedDocument.id}/check`);
      const result = response.data?.data ?? response.data;
      setToast(result?.candidates?.length ? `${result.candidates.length} possible duplicate document(s) found.` : "No duplicate document candidates found.");
    } catch (error: any) {
      setToast(error?.response?.data?.message || "Duplicate check failed.");
    }
  };

  const recordAccess = async (action = "VIEW") => {
    if (!selectedDocument?.id) return;
    try {
      const response = await api.post(`/documents/documents/${selectedDocument.id}/access`, { action });
      if (action === "VIEW" && selectedDocument.filePath) window.open(selectedDocument.filePath, "_blank", "noopener,noreferrer");
      setToast(response.data?.message || `${pretty(action)} access recorded.`);
    } catch (error: any) {
      setToast(error?.response?.data?.message || "Document access was denied.");
    }
  };

  const openTableDocument = async (row: any, action: "VIEW" | "DOWNLOAD") => {
    setSelectedId(row.id);
    try {
      await api.post(`/documents/documents/${row.id}/access`, { action });
      if (row.filePath) {
        const link = document.createElement("a");
        link.href = row.filePath;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        if (action === "DOWNLOAD") link.download = row.fileName || row.title || "document";
        document.body.appendChild(link);
        link.click();
        link.remove();
      } else {
        setToast("No stored file reference is available for this document.");
      }
    } catch (error: any) {
      setToast(error?.response?.data?.message || "Document access was denied.");
    }
  };

  const submitLifecycle = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedDocument?.id) return;
    setSaving("lifecycle");
    try {
      await api.post(`/documents/documents/${selectedDocument.id}/lifecycle`, lifecycleForm);
      setModal("");
      setToast(`Document moved to ${lifecycleForm.status}.`);
      await load();
    } catch (error: any) {
      setToast(error?.response?.data?.message || "Document lifecycle update failed.");
    } finally { setSaving(""); }
  };

  const submitHold = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedDocument?.id) return;
    setSaving("hold");
    try {
      const endpoint = selectedDocument.legalHold ? "legal-hold/release" : "legal-hold";
      await api.post(`/documents/documents/${selectedDocument.id}/${endpoint}`, { reason: holdReason });
      setHoldReason(""); setModal("");
      setToast(selectedDocument.legalHold ? "Legal hold released." : "Legal hold applied; purge is blocked.");
      await load();
    } catch (error: any) {
      setToast(error?.response?.data?.message || "Legal hold action failed.");
    } finally { setSaving(""); }
  };

  const submitShare = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedDocument?.id) return;
    setSaving("share");
    try {
      await api.post(`/documents/documents/${selectedDocument.id}/share`, shareForm);
      setShareForm({ recipient: "", recipientType: "USER", purpose: "Authorised document access", expiresAt: "", oneTime: false });
      setModal(""); setToast("Secure document share created and logged.");
      await load();
    } catch (error: any) {
      setToast(error?.response?.data?.message || "Document share could not be created.");
    } finally { setSaving(""); }
  };

  const updateForm = (key: string, value: string) => setDocumentForm((current) => ({ ...current, [key]: value }));
  const updateVersion = (key: string, value: string) => setVersionForm((current) => ({ ...current, [key]: value }));

  const handleFileSelection = (event: ChangeEvent<HTMLInputElement>, mode: "upload" | "version") => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const fileContentBase64 = typeof reader.result === "string" ? reader.result : "";
      const details = { fileName: file.name, mimeType: file.type || "application/octet-stream", fileSizeBytes: String(file.size), fileContentBase64 };
      if (mode === "upload") setDocumentForm((current) => ({ ...current, ...details }));
      else setVersionForm((current) => ({ ...current, ...details }));
    };
    reader.readAsDataURL(file);
  };

  return (
    <main className="documents-page">
      <header className="documents-header">
        <div>
          <span>Document Management</span>
          <h1>Universal Repository, Versioning & Retention</h1>
          <p>Clinical and administrative documents indexed with searchable metadata, compliance-safe versions, and retention enforcement.</p>
        </div>
        <div className="documents-header-actions">
          <button className="documents-btn green" onClick={() => setModal("upload")}><UploadCloud size={17} /> Add Document</button>
          <button className="documents-btn blue" onClick={() => setModal("version")} disabled={!selectedDocument}><History size={17} /> Add Version</button>
          <button className="documents-btn ghost" onClick={() => void load()} disabled={loading}><RefreshCw size={17} /> Refresh</button>
        </div>
      </header>

      {notice ? <div className={`documents-toast ${/blocked|failed|could not|No version/i.test(notice) ? "warning" : "success"}`} role="status"><span className="documents-toast-icon">{/blocked|failed|could not|No version/i.test(notice) ? <ShieldCheck size={17} /> : <CheckCircle2 size={17} />}</span><span>{notice}</span><button type="button" onClick={() => setNotice("")} aria-label="Dismiss notification"><X size={15} /></button></div> : null}

      <section className="documents-stats">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return <article key={stat.label}><Icon size={18} /><span>{stat.label}</span><strong>{stat.value}</strong></article>;
        })}
      </section>

      <section className="documents-toolbar">
        <label><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search title, patient, staff, supplier, department, OCR text..." /></label>
        <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
          <option value="ALL">All document types</option>
          {visibleTypes.map((type) => <option key={type} value={type}>{type}</option>)}
        </select>
        <button onClick={() => void load()}><Search size={16} /> Search</button>
        <button className="documents-toolbar-report" onClick={() => void loadReport()}><FileClock size={16} /> Repository Report</button>
      </section>

      {expandedTable ? <button type="button" className="documents-table-backdrop" aria-label="Close expanded table" onClick={() => setExpandedTable(null)} /> : null}

      <section className="documents-grid">
        <div className={`documents-panel documents-table-panel${expandedTable === "repository" ? " documents-table-expanded" : ""}`}>
          <div className="documents-title"><FileText size={18} /><div><h2>Indexed Repository</h2><p>{documents.length} searchable documents in view.</p></div><button className="documents-expand-btn" type="button" aria-label={expandedTable === "repository" ? "Collapse repository table" : "Expand repository table"} onClick={() => setExpandedTable((current) => current === "repository" ? null : "repository")}>{expandedTable === "repository" ? <Minimize2 size={16} /> : <Maximize2 size={16} />}</button></div>
          <div className="documents-table-wrap">
            <table className="documents-table">
              <thead><tr><th>Document</th><th>Owner</th><th>Metadata</th><th>Version</th><th>Retention</th><th></th></tr></thead>
              <tbody>
                {documents.length ? documents.map((row) => (
                  <tr className={selectedDocument?.id === row.id ? "selected" : ""} key={row.id} onClick={() => setSelectedId(row.id)}>
                    <td><strong>{row.title}</strong><span>{row.fileName || row.documentType}</span></td>
                    <td>{row.patientId || row.staffId || row.supplierId || "Administrative"}</td>
                    <td>{row.department || row.author || row.accessLevel}</td>
                    <td>v{row.version || row.metadata?.versionNumber || 1}</td>
                    <td><em className={row.retentionExpired ? "danger" : "safe"}>{row.retentionExpired ? "Review due" : fmtDate(row.retentionUntil)}</em></td>
                    <td><div className="documents-row-actions"><button onClick={(event) => { event.stopPropagation(); void openTableDocument(row, "VIEW"); }}><FileText size={14} /> View</button><button onClick={(event) => { event.stopPropagation(); void openTableDocument(row, "DOWNLOAD"); }}><Archive size={14} /> Download</button></div></td>
                  </tr>
                )) : <tr><td colSpan={6}>{loading ? "Loading documents..." : "No documents found."}</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="documents-panel documents-detail">
          <div className="documents-title"><ShieldCheck size={18} /><div><h2>Selected Record</h2><p>{selectedDocument ? selectedDocument.title : "No document selected."}</p></div></div>
          {selectedDocument ? (
            <>
              <dl>
                <div><dt>Type</dt><dd>{selectedDocument.documentType}</dd></div>
                <div><dt>Access</dt><dd>{selectedDocument.accessLevel}</dd></div>
                <div><dt>Department</dt><dd>{selectedDocument.department || "-"}</dd></div>
                <div><dt>Retention</dt><dd>{pretty(selectedDocument.retentionCategory)} until {fmtDate(selectedDocument.retentionUntil)}</dd></div>
              </dl>
              <div className="documents-detail-actions">
                <button onClick={() => void recordAccess("VIEW")}><FileText size={15} /> Preview</button>
                <button onClick={() => void recordAccess("DOWNLOAD")}><Archive size={15} /> Download</button>
                <button onClick={() => setModal("share")}><Send size={15} /> Share</button>
                <button onClick={() => setModal("lifecycle")}><CheckCircle2 size={15} /> Review status</button>
                <button onClick={() => setModal("hold")}><LockKeyhole size={15} /> {selectedDocument.legalHold ? "Release hold" : "Legal hold"}</button>
                <button onClick={() => void api.post(`/documents/documents/${selectedDocument.id}/verify-integrity`, {}).then(() => setToast("Integrity check recorded.")).catch((error) => setToast(error?.response?.data?.message || "Integrity check failed."))}><ShieldCheck size={15} /> Verify integrity</button>
                <button onClick={() => void checkDuplicates()}><History size={15} /> Check duplicates</button>
              </div>
              <div className="documents-version-tool">
                <label>Policy version in force<input type="date" value={versionAt} onChange={(event) => setVersionAt(event.target.value)} /></label>
                <button onClick={findVersionAt} disabled={saving === "version-at"}><Clock3 size={16} /> Check Date</button>
                {versionAtResult ? <small>Version {versionAtResult.version} was active: {versionAtResult.title}</small> : null}
              </div>
              <div className="documents-versions">
                {(selectedDocument.versions || []).length ? selectedDocument.versions.map((version: any) => (
                  <article key={version.id}>
                    <span><strong>Version {version.version}</strong><em>{fmtDate(version.uploadedAt)}</em></span>
                    <small>{version.metadata?.changeSummary || version.fileName}</small>
                  </article>
                )) : <div className="documents-empty">No version history loaded.</div>}
              </div>
            </>
          ) : <div className="documents-empty">Select a document to review metadata and versions.</div>}
        </aside>
      </section>

      <section className={`documents-panel documents-table-panel${expandedTable === "retention" ? " documents-table-expanded" : ""}`}>
        <div className="documents-title"><FileClock size={18} /><div><h2>Retention Review Queue</h2><p>Expired records require authorised officer approval before permanent purge.</p></div><button className="documents-expand-btn" type="button" aria-label={expandedTable === "retention" ? "Collapse retention review table" : "Expand retention review table"} onClick={() => setExpandedTable((current) => current === "retention" ? null : "retention")}>{expandedTable === "retention" ? <Minimize2 size={16} /> : <Maximize2 size={16} />}</button></div>
        <div className="documents-review-list">
          {reviewQueue.length ? reviewQueue.map((row) => (
            <article key={row.id}>
              <span><strong>{row.title}</strong><em>{row.retentionState || "Review Due"}</em></span>
              <small>{row.retentionPolicy} | protected until {fmtDate(row.retentionUntil)}</small>
              <div>
                <button onClick={() => setSelectedId(row.id)}>Inspect</button>
                <button onClick={() => void requestReview(row)} disabled={saving === `review-${row.id}`}>Queue Review</button>
                <button className="danger" onClick={() => { setSelectedId(row.id); setModal("purge"); }}>Approve Purge</button>
              </div>
            </article>
          )) : <div className="documents-empty">No records are due for retention review.</div>}
        </div>
      </section>

      {modal === "upload" || modal === "version" ? (
        <div className="documents-modal-backdrop" role="dialog" aria-modal="true">
          <div className={`documents-modal ${modal === "version" ? "is-blue" : "is-green"}`}>
            <header>
              <div><span>{modal === "upload" ? "Universal Repository" : "Version Control"}</span><h2>{modal === "upload" ? "Index Document" : "Upload New Version"}</h2></div>
              <button onClick={() => setModal("")} aria-label="Close"><X size={18} /></button>
            </header>
            <form className="documents-modal-form" onSubmit={modal === "upload" ? submitDocument : submitVersion}>
              <label><span>Document Type</span><select value={modal === "upload" ? documentForm.documentType : versionForm.documentType} onChange={(event) => modal === "upload" ? updateForm("documentType", event.target.value) : updateVersion("documentType", event.target.value)}>{DOCUMENT_TYPES.map((type) => <option key={type}>{type}</option>)}</select></label>
              <label><span>Title</span><input value={modal === "upload" ? documentForm.title : versionForm.title} onChange={(event) => modal === "upload" ? updateForm("title", event.target.value) : updateVersion("title", event.target.value)} placeholder="Document title" required={modal === "upload"} /></label>
              <label><span>File Name</span><input value={modal === "upload" ? documentForm.fileName : versionForm.fileName} onChange={(event) => modal === "upload" ? updateForm("fileName", event.target.value) : updateVersion("fileName", event.target.value)} placeholder="document.pdf" /></label>
              <label><span>Select Document File</span><input type="file" accept=".pdf,.jpg,.jpeg,.png,.tif,.tiff,.txt,.csv,.docx,.xlsx,.dcm" onChange={(event) => handleFileSelection(event, modal)} /></label>
              <label><span>Storage Path</span><input value={modal === "upload" ? documentForm.filePath : versionForm.filePath} onChange={(event) => modal === "upload" ? updateForm("filePath", event.target.value) : updateVersion("filePath", event.target.value)} placeholder="/secure/documents/document.pdf" /></label>
              <label><span>Patient ID</span><input value={modal === "upload" ? documentForm.patientId : versionForm.patientId} onChange={(event) => modal === "upload" ? updateForm("patientId", event.target.value) : updateVersion("patientId", event.target.value)} /></label>
              <label><span>Staff ID</span><input value={modal === "upload" ? documentForm.staffId : versionForm.staffId} onChange={(event) => modal === "upload" ? updateForm("staffId", event.target.value) : updateVersion("staffId", event.target.value)} /></label>
              <label><span>Supplier ID</span><input value={modal === "upload" ? documentForm.supplierId : versionForm.supplierId} onChange={(event) => modal === "upload" ? updateForm("supplierId", event.target.value) : updateVersion("supplierId", event.target.value)} /></label>
              <label><span>Department</span><input value={modal === "upload" ? documentForm.department : versionForm.department} onChange={(event) => modal === "upload" ? updateForm("department", event.target.value) : updateVersion("department", event.target.value)} /></label>
              <label><span>Author</span><input value={modal === "upload" ? documentForm.author : versionForm.author} onChange={(event) => modal === "upload" ? updateForm("author", event.target.value) : updateVersion("author", event.target.value)} /></label>
              <label><span>Access Level</span><select value={modal === "upload" ? documentForm.accessLevel : versionForm.accessLevel} onChange={(event) => modal === "upload" ? updateForm("accessLevel", event.target.value) : updateVersion("accessLevel", event.target.value)}>{ACCESS_LEVELS.map((level) => <option key={level}>{level}</option>)}</select></label>
              <label><span>Document Date</span><input type="date" value={modal === "upload" ? documentForm.documentDate : versionForm.documentDate} onChange={(event) => modal === "upload" ? updateForm("documentDate", event.target.value) : updateVersion("documentDate", event.target.value)} /></label>
              <label><span>Effective From</span><input type="date" value={modal === "upload" ? documentForm.effectiveFrom : versionForm.effectiveFrom} onChange={(event) => modal === "upload" ? updateForm("effectiveFrom", event.target.value) : updateVersion("effectiveFrom", event.target.value)} /></label>
              <label><span>Retention Category</span><select value={modal === "upload" ? documentForm.retentionCategory : versionForm.retentionCategory} onChange={(event) => modal === "upload" ? updateForm("retentionCategory", event.target.value) : updateVersion("retentionCategory", event.target.value)}>{RETENTION_CATEGORIES.map((category) => <option key={category}>{pretty(category)}</option>)}</select></label>
              <label><span>Patient DOB</span><input type="date" value={modal === "upload" ? documentForm.patientDateOfBirth : versionForm.patientDateOfBirth} onChange={(event) => modal === "upload" ? updateForm("patientDateOfBirth", event.target.value) : updateVersion("patientDateOfBirth", event.target.value)} /></label>
              {modal === "version" ? <label className="wide"><span>Change Summary</span><textarea value={versionForm.changeSummary} onChange={(event) => updateVersion("changeSummary", event.target.value)} placeholder="What changed in this version?" /></label> : null}
              <label className="wide"><span>Tags</span><input value={modal === "upload" ? documentForm.tags : versionForm.tags} onChange={(event) => modal === "upload" ? updateForm("tags", event.target.value) : updateVersion("tags", event.target.value)} placeholder="consent, cardiology, supplier" /></label>
              <label className="wide"><span>OCR / Search Text</span><textarea value={modal === "upload" ? documentForm.ocrText : versionForm.ocrText} onChange={(event) => modal === "upload" ? updateForm("ocrText", event.target.value) : updateVersion("ocrText", event.target.value)} placeholder="Extracted text for repository search" /></label>
              <footer>
                <button type="button" onClick={() => setModal("")}>Cancel</button>
                <button disabled={saving === modal}><UploadCloud size={16} /> {modal === "upload" ? "Index Document" : "Save Version"}</button>
              </footer>
            </form>
          </div>
        </div>
      ) : null}

      {modal === "lifecycle" ? (
        <div className="documents-modal-backdrop" role="dialog" aria-modal="true">
          <div className="documents-modal small is-blue">
            <header><div><span>Controlled lifecycle</span><h2>Update document status</h2></div><button onClick={() => setModal("")} aria-label="Close"><X size={18} /></button></header>
            <form className="documents-modal-form single" onSubmit={submitLifecycle}>
              <label><span>New status</span><select value={lifecycleForm.status} onChange={(event) => setLifecycleForm((current) => ({ ...current, status: event.target.value }))}>{["DRAFT", "REVIEW", "APPROVED", "REJECTED", "PUBLISHED", "ACTIVE", "ARCHIVED", "RESTORED", "SUPERSEDED", "QUARANTINED", "VALIDATED"].map((status) => <option key={status}>{status}</option>)}</select></label>
              <label className="wide"><span>Reason / approval note</span><textarea value={lifecycleForm.reason} onChange={(event) => setLifecycleForm((current) => ({ ...current, reason: event.target.value }))} placeholder="Record why this status changed." required /></label>
              <footer><button type="button" onClick={() => setModal("")}>Cancel</button><button disabled={saving === "lifecycle"}><CheckCircle2 size={16} /> {saving === "lifecycle" ? "Saving..." : "Save status"}</button></footer>
            </form>
          </div>
        </div>
      ) : null}

      {modal === "hold" ? (
        <div className="documents-modal-backdrop" role="dialog" aria-modal="true">
          <div className="documents-modal small is-red">
            <header><div><span>Retention protection</span><h2>{selectedDocument?.legalHold ? "Release legal hold" : "Apply legal hold"}</h2></div><button onClick={() => setModal("")} aria-label="Close"><X size={18} /></button></header>
            <form className="documents-modal-form single" onSubmit={submitHold}>
              <p>{selectedDocument?.legalHold ? "Releasing the hold allows normal retention review rules to apply." : "Documents under legal hold cannot be purged, even after retention expires."}</p>
              <label className="wide"><span>Reason</span><textarea value={holdReason} onChange={(event) => setHoldReason(event.target.value)} placeholder="Legal or investigation reference" required /></label>
              <footer><button type="button" onClick={() => setModal("")}>Cancel</button><button className="danger" disabled={saving === "hold"}><LockKeyhole size={16} /> {saving === "hold" ? "Saving..." : selectedDocument?.legalHold ? "Release hold" : "Apply hold"}</button></footer>
            </form>
          </div>
        </div>
      ) : null}

      {modal === "share" ? (
        <div className="documents-modal-backdrop" role="dialog" aria-modal="true">
          <div className="documents-modal small is-green">
            <header><div><span>Secure distribution</span><h2>Share document</h2></div><button onClick={() => setModal("")} aria-label="Close"><X size={18} /></button></header>
            <form className="documents-modal-form single" onSubmit={submitShare}>
              <label><span>Recipient</span><input value={shareForm.recipient} onChange={(event) => setShareForm((current) => ({ ...current, recipient: event.target.value }))} placeholder="User, department, facility, or email" required /></label>
              <label><span>Recipient type</span><select value={shareForm.recipientType} onChange={(event) => setShareForm((current) => ({ ...current, recipientType: event.target.value }))}>{["USER", "DEPARTMENT", "FACILITY", "PATIENT_PORTAL", "EXTERNAL_RECIPIENT"].map((type) => <option key={type}>{type}</option>)}</select></label>
              <label><span>Expiry</span><input type="datetime-local" value={shareForm.expiresAt} onChange={(event) => setShareForm((current) => ({ ...current, expiresAt: event.target.value }))} /></label>
              <label className="wide"><span>Purpose</span><textarea value={shareForm.purpose} onChange={(event) => setShareForm((current) => ({ ...current, purpose: event.target.value }))} required /></label>
              <label className="checkbox-line"><input type="checkbox" checked={shareForm.oneTime} onChange={(event) => setShareForm((current) => ({ ...current, oneTime: event.target.checked }))} /> One-time access</label>
              <footer><button type="button" onClick={() => setModal("")}>Cancel</button><button disabled={saving === "share"}><Link2 size={16} /> {saving === "share" ? "Sharing..." : "Create secure share"}</button></footer>
            </form>
          </div>
        </div>
      ) : null}

      {modal === "purge" ? (
        <div className="documents-modal-backdrop" role="dialog" aria-modal="true">
          <div className="documents-modal small is-red">
            <header>
              <div><span>Retention Approval</span><h2>Approve Permanent Purge</h2></div>
              <button onClick={() => setModal("")} aria-label="Close"><X size={18} /></button>
            </header>
            <form className="documents-modal-form single" onSubmit={approvePurge}>
              <p>{selectedDocument?.title || "Selected document"} will be permanently purged only if every version is outside mandatory retention.</p>
              <label className="wide"><span>Reason</span><textarea value={purgeReason} onChange={(event) => setPurgeReason(event.target.value)} placeholder="Officer approval reason" required /></label>
              <footer>
                <button type="button" onClick={() => setModal("")}>Cancel</button>
                <button className="danger" disabled={saving === "purge"}><Archive size={16} /> Approve Purge</button>
              </footer>
            </form>
          </div>
        </div>
      ) : null}
    </main>
  );
}
