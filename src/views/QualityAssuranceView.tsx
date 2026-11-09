
import type { FormEvent, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, BarChart3, CheckCircle2, ClipboardCheck, FileArchive, FileCheck2, FileSearch, ListChecks, Maximize2, Minimize2, Plus, RefreshCw, Search, ShieldCheck, Siren, Target, X } from "lucide-react";
import { api } from "../lib/api";
import { useLiveRefresh } from "../lib/liveRefresh";

const unwrapRows = (value: any): any[] => {
  const data = value?.data ?? value;
  if (Array.isArray(data)) return data;
  for (const candidate of [data?.items, data?.rows, data?.results, data?.data]) {
    if (Array.isArray(candidate)) return candidate;
    if (candidate && typeof candidate === "object") {
      const nested: any[] = unwrapRows(candidate);
      if (nested.length) return nested;
    }
  }
  return [];
};
const unwrapObject = (value: any) => value?.data?.data || value?.data || value || {};
const todayValue = () => new Date().toISOString().slice(0, 10);
const addDays = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};
const dateTimeValue = () => new Date().toISOString().slice(0, 16);
const formatDate = (value: any) => {
  const date = new Date(String(value || ""));
  if (!Number.isFinite(date.getTime())) return "Not recorded";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
};
const formatDateTime = (value: any) => {
  const date = new Date(String(value || ""));
  if (!Number.isFinite(date.getTime())) return "Not recorded";
  return date.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
};
const patientName = (row: any) => [row?.firstName, row?.lastName].filter(Boolean).join(" ") || row?.patientCode || row?.mrn || "Unnamed patient";
const toneFromNotice = (notice: string) => (/failed|required|overdue|alert|high|blocked|error/i.test(notice) ? "warning" : "success");

export default function QualityAssuranceView() {
  const [dashboard, setDashboard] = useState<any>({});
  const [incidents, setIncidents] = useState<any[]>([]);
  const [rcas, setRcas] = useState<any[]>([]);
  const [actions, setActions] = useState<any[]>([]);
  const [audits, setAudits] = useState<any[]>([]);
  const [standards, setStandards] = useState<any[]>([]);
  const [indicators, setIndicators] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedIncidentId, setSelectedIncidentId] = useState("");
  const [selectedStandardId, setSelectedStandardId] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [modal, setModal] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");
  const [expandedTable, setExpandedTable] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [selectedRecordTitle, setSelectedRecordTitle] = useState("");

  const [incidentForm, setIncidentForm] = useState({ incidentAt: dateTimeValue(), departmentId: "OPD", incidentType: "NEAR_MISS", severity: "1", patientId: "", reporterMode: "IDENTIFIED", description: "", immediateActions: "", immediateSafety: "" });
  const [rcaForm, setRcaForm] = useState({ incidentId: "", teamMembers: "Quality Officer, Department Head, Clinical Lead", methodology: "Fishbone + 5 Whys", sequenceOfEvents: "", contributingFactors: '{"patientFactors":"","taskFactors":"","teamFactors":"","workEnvironment":"","organisationalFactors":""}', rootCauses: "", recommendations: "", lessonsLearned: "" });
  const [actionForm, setActionForm] = useState({ sourceType: "INCIDENT", sourceId: "", actionDescription: "", responsiblePersonId: "", departmentId: "GENERAL", priority: "MEDIUM", dueDate: addDays(14), verificationMethod: "", evidenceUrl: "" });
  const [auditForm, setAuditForm] = useState({ auditTitle: "", auditTopic: "Medication Safety", standardOrCriteria: "", sampleSize: "30", auditPeriodStart: todayValue(), auditPeriodEnd: todayValue(), dataSource: "HMIS query + manual validation", overallCompliancePercent: "80", recommendations: "", reAuditDate: addDays(90) });
  const [standardForm, setStandardForm] = useState({ id: "", standardCode: "", standardDescription: "", domain: "Patient Safety", complianceStatus: "PARTIAL", evidence: "", evidenceDocumentUrl: "", gapDescription: "", targetComplianceDate: addDays(90) });

  const setToast = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice((current) => (current === message ? "" : current)), 6500);
  };

  const safeGet = async (url: string, label: string) => {
    try {
      return await api.get(url);
    } catch (error: any) {
      return { data: [], __label: label, __error: error?.response?.data?.message || error?.message || "Request failed", __status: error?.response?.status };
    }
  };

  const load = async () => {
    setLoading(true);
    try {
      const [dashRes, incidentRes, rcaRes, actionRes, auditRes, standardRes, indicatorRes, patientRes] = await Promise.all([
        safeGet("/quality-assurance/dashboard", "dashboard"),
        safeGet("/quality-assurance/incidents", "incidents"),
        safeGet("/quality-assurance/rca", "RCA workflows"),
        safeGet("/quality-assurance/actions", "CAPA actions"),
        safeGet("/quality-assurance/clinical-audits", "clinical audits"),
        safeGet("/quality-assurance/standards", "accreditation standards"),
        safeGet("/quality-assurance/safety-indicators", "safety indicators"),
        safeGet("/patients", "patients"),
      ]);
      const failed = [dashRes, incidentRes, rcaRes, actionRes, auditRes, standardRes, indicatorRes, patientRes].filter((response: any) => response.__error);
      if (failed.length) setToast(`${failed.map((response: any) => `${response.__label}${response.__status ? ` (${response.__status})` : ""}`).join(", ")} could not be loaded. Check your connection or permissions.`);
      const incidentRows = unwrapRows(incidentRes.data);
      const standardRows = unwrapRows(standardRes.data);
      setDashboard(unwrapObject(dashRes.data));
      setIncidents(incidentRows);
      setRcas(unwrapRows(rcaRes.data));
      setActions(unwrapRows(actionRes.data));
      setAudits(unwrapRows(auditRes.data));
      setStandards(standardRows);
      setIndicators(unwrapRows(indicatorRes.data));
      setPatients(unwrapRows(patientRes.data));
      setSelectedIncidentId((current) => current || incidentRows[0]?.id || "");
      setSelectedStandardId((current) => current || standardRows[0]?.id || "");
    } catch (error: any) {
      setToast(error?.response?.data?.message || "Quality assurance data could not be loaded.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);
  useLiveRefresh(load, { intervalMs: 60000 });

  const selectedIncident = incidents.find((row) => row.id === selectedIncidentId) || incidents[0] || null;
  const selectedStandard = standards.find((row) => row.id === selectedStandardId) || standards[0] || null;
  const patientLabel = (patientId: string) => {
    const patient = patients.find((row) => row.id === patientId);
    return patient ? `${patientName(patient)} | ${patient.patientCode || patient.mrn || "No MRN"}` : patientId || "Staff-only";
  };

  const filteredIncidents = useMemo(() => {
    const q = search.trim().toLowerCase();
    return incidents.filter((row) => {
      if (filter === "HIGH" && !String(row.severity || "").match(/[3-5]/)) return false;
      if (filter === "OPEN" && row.status === "CLOSED") return false;
      if (filter === "RCA" && !String(row.status || "").includes("RCA")) return false;
      if (!q) return true;
      return `${row.incidentNumber} ${row.departmentId} ${row.incidentType} ${row.severity} ${row.description} ${patientLabel(row.patientId)}`.toLowerCase().includes(q);
    });
  }, [incidents, search, filter, patients]);

  const totals = dashboard?.totals || {};
  const statCards = [
    { label: "Open Incidents", value: totals.openIncidents || 0, color: "#dc2626", icon: Siren, action: () => setFilter("OPEN") },
    { label: "High Severity", value: totals.highSeverity || 0, color: "#991b1b", icon: AlertTriangle, action: () => setFilter("HIGH") },
    { label: "Open RCA", value: totals.openRca || 0, color: "#d97706", icon: FileSearch, action: () => setFilter("RCA") },
    { label: "Open CAPA", value: totals.openCapa || 0, color: "#2563eb", icon: Target, action: () => openAction() },
    { label: "KQMH Score", value: `${totals.kqmhScore || 0}%`, color: "#16a34a", icon: ShieldCheck, action: () => openStandard() },
    { label: "Outliers", value: totals.indicatorOutliers || 0, color: "#7c3aed", icon: BarChart3, action: () => setFilter("ALL") },
  ];

  const closeAfter = async (message: string) => {
    setToast(message);
    setModal("");
    await load();
  };

  const openRecord = (title: string, record: any) => {
    setSelectedRecordTitle(title);
    setSelectedRecord(record);
  };

  const openRca = () => {
    if (!selectedIncident?.id) {
      setToast("Select an incident before opening RCA.");
      return;
    }
    setRcaForm((current) => ({ ...current, incidentId: selectedIncident.id }));
    setModal("rca");
  };

  const openAction = (sourceType = "INCIDENT", sourceId = selectedIncident?.id || "") => {
    setActionForm((current) => ({ ...current, sourceType, sourceId }));
    setModal("action");
  };

  const openStandard = (row = selectedStandard) => {
    setStandardForm({
      id: row?.id || "",
      standardCode: row?.standardCode || "",
      standardDescription: row?.standardDescription || "",
      domain: row?.domain || "Patient Safety",
      complianceStatus: row?.complianceStatus || "PARTIAL",
      evidence: row?.evidence || "",
      evidenceDocumentUrl: row?.evidenceDocumentUrl || "",
      gapDescription: row?.gapDescription || "",
      targetComplianceDate: row?.targetComplianceDate ? String(row.targetComplianceDate).slice(0, 10) : addDays(90),
    });
    setModal("standard");
  };

  const saveIncident = (event: FormEvent) => {
    event.preventDefault();
    setSaving("incident");
    api.post("/quality-assurance/incidents", incidentForm)
      .then((res) => {
        setSelectedIncidentId(res.data?.id || selectedIncidentId);
        return closeAfter(res.data?.rcaId ? "High-severity incident reported, routed, and RCA opened." : "Incident reported and routed to Quality Officer.");
      })
      .catch((error) => setToast(error?.response?.data?.message || "Incident could not be reported."))
      .finally(() => setSaving(""));
  };

  const saveRca = (event: FormEvent) => {
    event.preventDefault();
    setSaving("rca");
    try {
      const contributingFactors = JSON.parse(rcaForm.contributingFactors || "{}");
      api.post("/quality-assurance/rca", { ...rcaForm, contributingFactors, teamMembers: rcaForm.teamMembers.split(/[,\n;]+/).map((item) => item.trim()).filter(Boolean) })
        .then(() => closeAfter("RCA workflow opened with fishbone and 5 Whys toolkit."))
        .catch((error) => setToast(error?.response?.data?.message || "RCA could not be opened."))
        .finally(() => setSaving(""));
    } catch {
      setToast("Contributing factors must be valid JSON.");
      setSaving("");
    }
  };

  const saveAction = (event: FormEvent) => {
    event.preventDefault();
    setSaving("action");
    api.post("/quality-assurance/actions", actionForm)
      .then(() => closeAfter("CAPA action assigned with due-date tracking."))
      .catch((error) => setToast(error?.response?.data?.message || "CAPA action could not be saved."))
      .finally(() => setSaving(""));
  };

  const updateAction = (id: string, status: string) => {
    setSaving(`${id}-${status}`);
    api.patch(`/quality-assurance/actions/${id}`, { status, effectivenessReview: status === "VERIFIED" ? "Verifier confirmed implementation and effectiveness." : undefined })
      .then(() => closeAfter(status === "VERIFIED" ? "CAPA verified as effective." : "CAPA marked complete and sent for verification."))
      .catch((error) => setToast(error?.response?.data?.message || "CAPA status could not be updated."))
      .finally(() => setSaving(""));
  };

  const approveRca = (id: string) => {
    setSaving(`${id}-APPROVED`);
    api.patch(`/quality-assurance/rca/${id}/complete`, {
      rootCauses: "RCA reviewed and signed by the Medical Director.",
      recommendations: "Corrective and preventive actions assigned for implementation.",
      lessonsLearned: "Learning captured for Quality Committee review.",
    })
      .then(() => closeAfter("RCA reviewed, signed, and marked approved."))
      .catch((error) => setToast(error?.response?.data?.message || "RCA could not be approved."))
      .finally(() => setSaving(""));
  };

  const updateIncidentStatus = (status: string) => {
    if (!selectedIncident?.id) return;
    setSaving(`incident-${status}`);
    api.patch(`/quality-assurance/incidents/${selectedIncident.id}/status`, { status, reason: "Quality workflow update" })
      .then(() => closeAfter(`Incident moved to ${status.replace(/_/g, " ")}.`))
      .catch((error) => setToast(error?.response?.data?.message || "Incident status could not be updated."))
      .finally(() => setSaving(""));
  };

  const saveAudit = (event: FormEvent) => {
    event.preventDefault();
    setSaving("audit");
    api.post("/quality-assurance/clinical-audits", { ...auditForm, findings: { compliancePercent: Number(auditForm.overallCompliancePercent), dataSource: auditForm.dataSource } })
      .then(() => closeAfter("Clinical audit cycle saved with Plan-Do-Study-Act tracking."))
      .catch((error) => setToast(error?.response?.data?.message || "Clinical audit could not be saved."))
      .finally(() => setSaving(""));
  };

  const saveStandard = (event: FormEvent) => {
    event.preventDefault();
    setSaving("standard");
    api.post("/quality-assurance/standards", standardForm)
      .then(() => closeAfter("KQMH standard assessment saved."))
      .catch((error) => setToast(error?.response?.data?.message || "Accreditation standard could not be saved."))
      .finally(() => setSaving(""));
  };

  const exportStandards = () => {
    setSaving("export");
    api.post("/quality-assurance/standards/export", {})
      .then((res) => closeAfter(`Evidence portfolio exported. KQMH score: ${res.data?.score || 0}%.`))
      .catch((error) => setToast(error?.response?.data?.message || "Evidence portfolio could not be exported."))
      .finally(() => setSaving(""));
  };

  return (
    <div className="nursing-view qa-view">
      <div className="pv-header">
        <div>
          <h1 className="pv-title">Quality Assurance</h1>
          <p className="pv-subtitle">Incident reporting, RCA, CAPA, clinical audit cycles, KQMH standards, and patient safety indicators.</p>
        </div>
        <div className="pv-header-actions">
          <button type="button" className="nursing-action-btn is-muted" onClick={load}><RefreshCw size={15} /> Refresh</button>
          <button type="button" className="nursing-action-btn is-danger" onClick={() => setModal("incident")}><Siren size={15} /> Report Incident</button>
          <button type="button" className="nursing-action-btn is-primary" onClick={() => setModal("audit")}><ClipboardCheck size={15} /> New Audit</button>
        </div>
      </div>

      {notice ? (
        <div className={`module-notice-toast is-${toneFromNotice(notice)}`} role="status" aria-live="polite">
          <div><strong>Quality Assurance</strong><span>{notice}</span></div>
          <button type="button" className="module-notice-close" onClick={() => setNotice("")}>x</button>
        </div>
      ) : null}

      <div className="pv-stats nursing-stats-grid">
        {statCards.map(({ label, value, color, icon: Icon, action }) => (
          <button key={label} type="button" className="pv-stat-card qa-stat-card" style={{ borderLeftColor: color }} onClick={action}>
            <p className="pv-stat-label">{label}</p>
            <p className="pv-stat-value">{loading ? "..." : value}</p>
            <Icon className="qa-stat-icon" size={19} style={{ color }} />
          </button>
        ))}
      </div>

      <div className="qa-layout">
        <section className={`nursing-worklist qa-worklist ${expandedTable === "incidents" ? "is-expanded" : ""}`}>
          <div className="pv-search-bar qa-filter-bar">
            <div className="pv-search-wrap">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input className="pv-search" placeholder="Search incident, department, type, patient..." value={search} onChange={(event) => setSearch(event.target.value)} />
            </div>
            <select className="nursing-filter-select" value={filter} onChange={(event) => setFilter(event.target.value)}>
              <option value="ALL">All incidents</option>
              <option value="OPEN">Open</option>
              <option value="HIGH">High severity</option>
              <option value="RCA">RCA required</option>
            </select>
            <button type="button" className="qa-table-expand-btn" onClick={() => setExpandedTable((current) => current === "incidents" ? "" : "incidents")} aria-label={expandedTable === "incidents" ? "Collapse incident table" : "Expand incident table"} title={expandedTable === "incidents" ? "Collapse table" : "Expand table"}>
              {expandedTable === "incidents" ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
          </div>
          <div className="pv-table-wrap">
            <table className="pv-table">
              <thead><tr><th>Incident</th><th>Department</th><th>Patient</th><th>Severity</th><th>Status</th></tr></thead>
              <tbody>
                {loading ? <tr><td colSpan={5} className="pv-empty">Loading incidents...</td></tr> : filteredIncidents.length === 0 ? <tr><td colSpan={5} className="pv-empty">No incident reports found.</td></tr> : filteredIncidents.map((row) => (
                  <tr key={row.id} className={row.id === selectedIncident?.id ? "nursing-selected-row" : ""} onClick={() => { setSelectedIncidentId(row.id); openRecord("Incident details", row); }}>
                    <td><strong>{row.incidentNumber}</strong><small>{row.incidentType?.replace(/_/g, " ")}</small></td>
                    <td>{row.departmentId}</td>
                    <td>{patientLabel(row.patientId)}</td>
                    <td><span className={`pv-badge ${String(row.severity).match(/[3-5]/) ? "is-danger" : "is-warning"}`}>{row.severity}</span></td>
                    <td><span className={`pv-badge ${row.status === "CLOSED" ? "is-success" : String(row.status).includes("RCA") ? "is-danger" : "is-info"}`}>{row.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="nursing-care-panel">
          <div className="nursing-care-header">
            <div>
              <span>Selected Quality Case</span>
              <strong>{selectedIncident ? `${selectedIncident.incidentNumber} | ${selectedIncident.incidentType?.replace(/_/g, " ")}` : "No incident selected"}</strong>
            </div>
            <span className={`pv-badge ${selectedIncident?.status === "CLOSED" ? "is-success" : "is-info"}`}>{selectedIncident?.status || "NONE"}</span>
          </div>
          <div className="qa-action-row">
            <button type="button" className="qa-action-btn is-warning" onClick={openRca}><FileSearch size={14} /> Open RCA</button>
            <button type="button" className="qa-action-btn is-blue" onClick={() => openAction()}><Target size={14} /> CAPA Action</button>
            <button type="button" className="qa-action-btn is-success" onClick={() => openStandard()}><ShieldCheck size={14} /> KQMH Standard</button>
            {selectedIncident && selectedIncident.status !== "CLOSED" ? <button type="button" className="qa-action-btn is-success" onClick={() => updateIncidentStatus("CLOSED")} disabled={saving === "incident-CLOSED"}><CheckCircle2 size={14} /> Close Case</button> : null}
          </div>

          <div className="qa-summary-grid">
            <QaInfo title="Incident Routing" rows={[["Department head", selectedIncident?.departmentId || "-"], ["Quality officer", "Notified"], ["High severity escalation", String(selectedIncident?.severity || "").match(/[3-5]/) ? "Medical Director + Risk Manager" : "Not required"]]} />
            <QaInfo title="RCA" rows={[["Open workflows", rcas.filter((row) => row.status !== "APPROVED").length], ["Approved", rcas.filter((row) => row.status === "APPROVED").length], ["Toolkit", "Fishbone + 5 Whys"]]} />
            <QaInfo title="CAPA" rows={[["Open", actions.filter((row) => !["COMPLETED", "VERIFIED", "CLOSED"].includes(row.status)).length], ["Overdue", actions.filter((row) => row.overdue).length], ["Verification", "Required after completion"]]} />
            <QaInfo title="Accreditation" rows={[["KQMH score", `${totals.kqmhScore || 0}%`], ["Standards", standards.length], ["Export", "Evidence portfolio ready"]]} />
          </div>

          <div className="qa-subgrid">
            <DataPanel id="rca" title="RCA Workflows" expanded={expandedTable === "rca"} onToggle={() => setExpandedTable((current) => current === "rca" ? "" : "rca")}>
              <table className="pv-table">
                <thead><tr><th>RCA</th><th>Team</th><th>Method</th><th>Status</th><th>Action</th></tr></thead>
                <tbody>
                  {rcas.length === 0 ? <tr><td colSpan={5} className="pv-empty">No RCA workflows opened.</td></tr> : rcas.slice(0, 8).map((row) => (
                    <tr key={row.id} onClick={() => openRecord("RCA workflow details", row)}>
                      <td><strong>{row.rcaNumber}</strong><small>{row.incidentId}</small></td>
                      <td>{Array.isArray(row.teamMembers) ? row.teamMembers.join(", ") : row.teamMembers || "-"}</td>
                      <td>{row.methodology}</td>
                      <td><span className={`pv-badge ${row.status === "APPROVED" ? "is-success" : "is-warning"}`}>{row.status}</span></td>
                      <td>{row.status !== "APPROVED" ? <button type="button" className="pv-link-btn" disabled={saving === `${row.id}-APPROVED`} onClick={(event) => { event.stopPropagation(); approveRca(row.id); }}>Approve</button> : <CheckCircle2 size={15} />}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </DataPanel>
            <DataPanel id="indicators" title="Patient Safety Indicators" expanded={expandedTable === "indicators"} onToggle={() => setExpandedTable((current) => current === "indicators" ? "" : "indicators")}>
              <table className="pv-table">
                <thead><tr><th>Indicator</th><th>Value</th><th>Benchmark</th><th>Status</th></tr></thead>
                <tbody>
                  {indicators.length === 0 ? <tr><td colSpan={4} className="pv-empty">No indicator data available.</td></tr> : indicators.map((row) => (
                    <tr key={row.indicator} onClick={() => openRecord("Patient safety indicator details", row)}><td><strong>{row.indicator}</strong><small>{row.source}</small></td><td>{row.value}</td><td>{row.benchmark}</td><td><span className={`pv-badge ${row.outlier ? "is-danger" : "is-success"}`}>{row.outlier ? "Outlier" : "Within benchmark"}</span></td></tr>
                  ))}
                </tbody>
              </table>
            </DataPanel>
          </div>

          <div className="qa-subgrid">
            <DataPanel id="capa" title="CAPA Actions" expanded={expandedTable === "capa"} onToggle={() => setExpandedTable((current) => current === "capa" ? "" : "capa")}>
              <table className="pv-table">
                <thead><tr><th>Action</th><th>Owner</th><th>Due</th><th>Status</th><th>Action</th></tr></thead>
                <tbody>
                  {actions.length === 0 ? <tr><td colSpan={5} className="pv-empty">No CAPA actions created.</td></tr> : actions.slice(0, 8).map((row) => (
                    <tr key={row.id} onClick={() => openRecord("CAPA action details", row)}>
                      <td><strong>{row.actionDescription}</strong><small>{row.sourceType} | {row.priority}</small></td>
                      <td>{row.responsiblePersonId}</td>
                      <td>{formatDate(row.dueDate)}{row.overdue ? <span className="pv-badge is-danger">Overdue</span> : null}</td>
                      <td><span className={`pv-badge ${row.status === "VERIFIED" ? "is-success" : row.overdue ? "is-danger" : "is-info"}`}>{row.status}</span></td>
                      <td className="qa-table-actions">
                        {row.status === "OPEN" ? <button type="button" className="pv-link-btn" disabled={saving === `${row.id}-COMPLETED`} onClick={(event) => { event.stopPropagation(); updateAction(row.id, "COMPLETED"); }}>Complete</button> : null}
                        {row.status === "COMPLETED" ? <button type="button" className="pv-link-btn" disabled={saving === `${row.id}-VERIFIED`} onClick={(event) => { event.stopPropagation(); updateAction(row.id, "VERIFIED"); }}>Verify</button> : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </DataPanel>
            <DataPanel id="standards" title="KQMH Standards" expanded={expandedTable === "standards"} onToggle={() => setExpandedTable((current) => current === "standards" ? "" : "standards")}>
              <table className="pv-table">
                <thead><tr><th>Code</th><th>Domain</th><th>Status</th><th>Action</th></tr></thead>
                <tbody>
                  {standards.length === 0 ? <tr><td colSpan={4} className="pv-empty">No KQMH standards loaded.</td></tr> : standards.slice(0, 8).map((row) => (
                    <tr key={row.id} className={row.id === selectedStandardId ? "nursing-selected-row" : ""} onClick={() => { setSelectedStandardId(row.id); openRecord("KQMH standard details", row); }}>
                      <td><strong>{row.standardCode}</strong><small>{row.standardDescription}</small></td><td>{row.domain}</td><td><span className={`pv-badge ${row.complianceStatus === "COMPLIANT" ? "is-success" : "is-warning"}`}>{row.complianceStatus}</span></td><td><button type="button" className="pv-link-btn" onClick={(event) => { event.stopPropagation(); openStandard(row); }}>Assess</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </DataPanel>
          </div>

          <div className="qa-subgrid">
            <DataPanel id="audits" title="Clinical Audits" expanded={expandedTable === "audits"} onToggle={() => setExpandedTable((current) => current === "audits" ? "" : "audits")}>
              <table className="pv-table">
                <thead><tr><th>Audit</th><th>Topic</th><th>Score</th><th>Status</th></tr></thead>
                <tbody>
                  {audits.length === 0 ? <tr><td colSpan={4} className="pv-empty">No clinical audits recorded.</td></tr> : audits.slice(0, 8).map((row) => (
                    <tr key={row.id} onClick={() => openRecord("Clinical audit details", row)}><td><strong>{row.auditTitle}</strong><small>{formatDate(row.auditPeriodEnd)}</small></td><td>{row.auditTopic}</td><td>{row.overallCompliancePercent || 0}%</td><td><span className={`pv-badge ${row.status === "ON_TRACK" ? "is-success" : "is-warning"}`}>{row.status}</span></td></tr>
                  ))}
                </tbody>
              </table>
            </DataPanel>
            <DataPanel id="evidence" title="Evidence Export" expanded={expandedTable === "evidence"} onToggle={() => setExpandedTable((current) => current === "evidence" ? "" : "evidence")}>
              <div className="qa-export-panel">
                <FileArchive size={22} />
                <div>
                  <strong>KQMH evidence portfolio</strong>
                  <span>Exports standards, compliance status, evidence links, gaps, and target dates.</span>
                </div>
                <button type="button" className="qa-action-btn is-success" disabled={saving === "export"} onClick={exportStandards}>Export</button>
              </div>
            </DataPanel>
          </div>
        </section>
      </div>

      {modal === "incident" ? (
        <QaModal title="Report Incident" icon={<Siren size={18} />} tone="red" onClose={() => setModal("")}>
          <form className="qa-form" onSubmit={saveIncident}>
            <div className="qa-form-grid">
              <Field label="Incident date/time"><input type="datetime-local" value={incidentForm.incidentAt} onChange={(e) => setIncidentForm({ ...incidentForm, incidentAt: e.target.value })} /></Field>
              <Field label="Department"><input value={incidentForm.departmentId} onChange={(e) => setIncidentForm({ ...incidentForm, departmentId: e.target.value })} required /></Field>
              <Field label="Incident type"><select value={incidentForm.incidentType} onChange={(e) => setIncidentForm({ ...incidentForm, incidentType: e.target.value })}><option value="MEDICATION_ERROR">Medication error</option><option value="PATIENT_FALL">Patient fall</option><option value="WRONG_SITE">Wrong site</option><option value="EQUIPMENT_FAILURE">Equipment failure</option><option value="NEAR_MISS">Near miss</option><option value="COMPLAINT">Complaint</option><option value="CLINICAL_DETERIORATION_NOT_ACTED_ON">Clinical deterioration not acted on</option><option value="RETAINED_FOREIGN_BODY">Retained foreign body</option></select></Field>
              <Field label="Severity grade"><select value={incidentForm.severity} onChange={(e) => setIncidentForm({ ...incidentForm, severity: e.target.value })}><option value="1">Grade 1</option><option value="2">Grade 2</option><option value="3">Grade 3</option><option value="4">Grade 4</option><option value="5">Grade 5</option></select></Field>
              <Field label="Patient involved optional"><select value={incidentForm.patientId} onChange={(e) => setIncidentForm({ ...incidentForm, patientId: e.target.value })}><option value="">Staff-only/no patient</option>{patients.map((patient) => <option key={patient.id} value={patient.id}>{patientName(patient)} | {patient.patientCode || patient.mrn}</option>)}</select></Field>
              <Field label="Reporter identity"><select value={incidentForm.reporterMode} onChange={(e) => setIncidentForm({ ...incidentForm, reporterMode: e.target.value })}><option value="IDENTIFIED">Identified</option><option value="CONFIDENTIAL">Confidential</option><option value="ANONYMOUS">Anonymous</option></select></Field>
            </div>
            <Field label="Description"><textarea value={incidentForm.description} onChange={(e) => setIncidentForm({ ...incidentForm, description: e.target.value })} required /></Field>
            <Field label="Immediate actions taken"><textarea value={incidentForm.immediateActions} onChange={(e) => setIncidentForm({ ...incidentForm, immediateActions: e.target.value })} /></Field>
            <Field label="Immediate safety assessment"><textarea value={incidentForm.immediateSafety} onChange={(e) => setIncidentForm({ ...incidentForm, immediateSafety: e.target.value })} placeholder="Patient safe, treatment required, equipment quarantine, escalation or other immediate controls..." /></Field>
            <button type="submit" className="qa-submit is-red" disabled={saving === "incident"}><Siren size={15} /> Submit Confidential Report</button>
          </form>
        </QaModal>
      ) : null}

      {modal === "rca" ? (
        <QaModal title="Root Cause Analysis" icon={<FileSearch size={18} />} tone="orange" onClose={() => setModal("")}>
          <form className="qa-form" onSubmit={saveRca}>
            <div className="qa-form-grid">
              <Field label="Incident"><select value={rcaForm.incidentId} onChange={(e) => setRcaForm({ ...rcaForm, incidentId: e.target.value })} required>{incidents.map((row) => <option key={row.id} value={row.id}>{row.incidentNumber} | {row.incidentType}</option>)}</select></Field>
              <Field label="RCA team"><input value={rcaForm.teamMembers} onChange={(e) => setRcaForm({ ...rcaForm, teamMembers: e.target.value })} /></Field>
              <Field label="Methodology"><input value={rcaForm.methodology} onChange={(e) => setRcaForm({ ...rcaForm, methodology: e.target.value })} /></Field>
            </div>
            <Field label="Sequence of events"><textarea value={rcaForm.sequenceOfEvents} onChange={(e) => setRcaForm({ ...rcaForm, sequenceOfEvents: e.target.value })} /></Field>
            <Field label="Contributing factors JSON"><textarea className="qa-code-area" value={rcaForm.contributingFactors} onChange={(e) => setRcaForm({ ...rcaForm, contributingFactors: e.target.value })} /></Field>
            <Field label="Root causes"><textarea value={rcaForm.rootCauses} onChange={(e) => setRcaForm({ ...rcaForm, rootCauses: e.target.value })} /></Field>
            <Field label="Recommendations"><textarea value={rcaForm.recommendations} onChange={(e) => setRcaForm({ ...rcaForm, recommendations: e.target.value })} /></Field>
            <button type="submit" className="qa-submit is-orange" disabled={saving === "rca"}><FileSearch size={15} /> Open RCA Workflow</button>
          </form>
        </QaModal>
      ) : null}

      {modal === "action" ? (
        <QaModal title="CAPA Action" icon={<Target size={18} />} tone="blue" onClose={() => setModal("")}>
          <form className="qa-form" onSubmit={saveAction}>
            <div className="qa-form-grid">
              <Field label="Source type"><select value={actionForm.sourceType} onChange={(e) => setActionForm({ ...actionForm, sourceType: e.target.value })}><option>INCIDENT</option><option>RCA</option><option>AUDIT</option><option>ACCREDITATION</option></select></Field>
              <Field label="Source ID"><input value={actionForm.sourceId} onChange={(e) => setActionForm({ ...actionForm, sourceId: e.target.value })} /></Field>
              <Field label="Owner"><input value={actionForm.responsiblePersonId} onChange={(e) => setActionForm({ ...actionForm, responsiblePersonId: e.target.value })} required /></Field>
              <Field label="Due date"><input type="date" value={actionForm.dueDate} onChange={(e) => setActionForm({ ...actionForm, dueDate: e.target.value })} /></Field>
              <Field label="Priority"><select value={actionForm.priority} onChange={(e) => setActionForm({ ...actionForm, priority: e.target.value })}><option>LOW</option><option>MEDIUM</option><option>HIGH</option><option>CRITICAL</option></select></Field>
              <Field label="Department"><input value={actionForm.departmentId} onChange={(e) => setActionForm({ ...actionForm, departmentId: e.target.value })} /></Field>
            </div>
            <Field label="Action description"><textarea value={actionForm.actionDescription} onChange={(e) => setActionForm({ ...actionForm, actionDescription: e.target.value })} required /></Field>
            <Field label="Verification method"><textarea value={actionForm.verificationMethod} onChange={(e) => setActionForm({ ...actionForm, verificationMethod: e.target.value })} /></Field>
            <button type="submit" className="qa-submit is-blue" disabled={saving === "action"}><Target size={15} /> Assign CAPA</button>
          </form>
        </QaModal>
      ) : null}

      {modal === "audit" ? (
        <QaModal title="Clinical Audit Cycle" icon={<ClipboardCheck size={18} />} tone="purple" onClose={() => setModal("")}>
          <form className="qa-form" onSubmit={saveAudit}>
            <div className="qa-form-grid">
              <Field label="Audit title"><input value={auditForm.auditTitle} onChange={(e) => setAuditForm({ ...auditForm, auditTitle: e.target.value })} required /></Field>
              <Field label="Topic"><input value={auditForm.auditTopic} onChange={(e) => setAuditForm({ ...auditForm, auditTopic: e.target.value })} /></Field>
              <Field label="Sample size"><input type="number" min="1" value={auditForm.sampleSize} onChange={(e) => setAuditForm({ ...auditForm, sampleSize: e.target.value })} /></Field>
              <Field label="Compliance %"><input type="number" min="0" max="100" value={auditForm.overallCompliancePercent} onChange={(e) => setAuditForm({ ...auditForm, overallCompliancePercent: e.target.value })} /></Field>
              <Field label="Period start"><input type="date" value={auditForm.auditPeriodStart} onChange={(e) => setAuditForm({ ...auditForm, auditPeriodStart: e.target.value })} /></Field>
              <Field label="Period end"><input type="date" value={auditForm.auditPeriodEnd} onChange={(e) => setAuditForm({ ...auditForm, auditPeriodEnd: e.target.value })} /></Field>
              <Field label="Re-audit date"><input type="date" value={auditForm.reAuditDate} onChange={(e) => setAuditForm({ ...auditForm, reAuditDate: e.target.value })} /></Field>
              <Field label="Data source"><input value={auditForm.dataSource} onChange={(e) => setAuditForm({ ...auditForm, dataSource: e.target.value })} /></Field>
            </div>
            <Field label="Standard / criteria"><textarea value={auditForm.standardOrCriteria} onChange={(e) => setAuditForm({ ...auditForm, standardOrCriteria: e.target.value })} required /></Field>
            <Field label="Recommendations / Act phase"><textarea value={auditForm.recommendations} onChange={(e) => setAuditForm({ ...auditForm, recommendations: e.target.value })} /></Field>
            <button type="submit" className="qa-submit is-purple" disabled={saving === "audit"}><ClipboardCheck size={15} /> Save Audit Cycle</button>
          </form>
        </QaModal>
      ) : null}

      {modal === "standard" ? (
        <QaModal title="KQMH Standard Assessment" icon={<ShieldCheck size={18} />} tone="green" onClose={() => setModal("")}>
          <form className="qa-form" onSubmit={saveStandard}>
            <div className="qa-form-grid">
              <Field label="Standard code"><input value={standardForm.standardCode} onChange={(e) => setStandardForm({ ...standardForm, standardCode: e.target.value })} required /></Field>
              <Field label="Domain"><input value={standardForm.domain} onChange={(e) => setStandardForm({ ...standardForm, domain: e.target.value })} /></Field>
              <Field label="Compliance status"><select value={standardForm.complianceStatus} onChange={(e) => setStandardForm({ ...standardForm, complianceStatus: e.target.value })}><option>COMPLIANT</option><option>PARTIAL</option><option>NON_COMPLIANT</option><option>NOT_ASSESSED</option></select></Field>
              <Field label="Target compliance date"><input type="date" value={standardForm.targetComplianceDate} onChange={(e) => setStandardForm({ ...standardForm, targetComplianceDate: e.target.value })} /></Field>
              <Field label="Evidence document URL"><input value={standardForm.evidenceDocumentUrl} onChange={(e) => setStandardForm({ ...standardForm, evidenceDocumentUrl: e.target.value })} /></Field>
            </div>
            <Field label="Standard description"><textarea value={standardForm.standardDescription} onChange={(e) => setStandardForm({ ...standardForm, standardDescription: e.target.value })} required /></Field>
            <Field label="Evidence"><textarea value={standardForm.evidence} onChange={(e) => setStandardForm({ ...standardForm, evidence: e.target.value })} /></Field>
            <Field label="Gap description"><textarea value={standardForm.gapDescription} onChange={(e) => setStandardForm({ ...standardForm, gapDescription: e.target.value })} /></Field>
            <button type="submit" className="qa-submit is-green" disabled={saving === "standard"}><ShieldCheck size={15} /> Save Assessment</button>
          </form>
        </QaModal>
      ) : null}

      {selectedRecord ? (
        <QaModal title={selectedRecordTitle} icon={<FileCheck2 size={18} />} tone="blue" onClose={() => setSelectedRecord(null)}>
          <div className="qa-record-detail">
            {Object.entries(selectedRecord).filter(([key]) => !["id", "createdAt", "updatedAt"].includes(key)).map(([key, value]) => (
              <div key={key}><span>{key.replace(/([A-Z])/g, " $1").replace(/_/g, " ")}</span><strong>{typeof value === "object" ? JSON.stringify(value) : String(value ?? "-")}</strong></div>
            ))}
          </div>
        </QaModal>
      ) : null}
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="qa-field"><span>{label}</span>{children}</label>;
}

function QaInfo({ title, rows }: { title: string; rows: [string, ReactNode][] }) {
  return (
    <div className="qa-info-card">
      <h3>{title}</h3>
      {rows.map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}
    </div>
  );
}

function DataPanel({ id, title, expanded, onToggle, children }: { id: string; title: string; expanded: boolean; onToggle: () => void; children: ReactNode }) {
  return (
    <section className={`qa-data-panel qa-table-${id} ${expanded ? "is-expanded" : ""}`}>
      <div className="qa-data-panel-header"><h3>{title}</h3><button type="button" className="qa-table-expand-btn" onClick={onToggle} aria-label={expanded ? `Collapse ${title} table` : `Expand ${title} table`} title={expanded ? "Collapse table" : "Expand table"}>{expanded ? <Minimize2 size={15} /> : <Maximize2 size={15} />}</button></div>
      <div className="pv-table-wrap">{children}</div>
    </section>
  );
}

function QaModal({ title, icon, tone, onClose, children }: { title: string; icon: ReactNode; tone: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="module-modal-backdrop qa-modal-backdrop">
      <div className={`module-modal qa-modal is-${tone}`}>
        <div className="module-modal-header qa-modal-header">
          <div>{icon}<h2>{title}</h2></div>
          <button type="button" className="module-modal-close qa-modal-close" onClick={onClose} aria-label="Close form"><X size={18} /></button>
        </div>
        <div className="qa-modal-body">{children}</div>
      </div>
    </div>
  );
}
