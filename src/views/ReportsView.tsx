"use client";

import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import { AlertTriangle, BarChart3, CheckCircle2, Download, FileSpreadsheet, FileText, Play, RefreshCw, Save, Search, Send, Settings2, X } from "lucide-react";
import { api } from "../lib/api";

const today = new Date().toISOString().slice(0, 10);
const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);

const emptyMoh = { formType: "MOH_705A", fromDate: monthStart, toDate: today, reviewedBy: "", submitElectronically: false };
const emptyBuilder = {
  name: "",
  category: "MANAGEMENT",
  description: "",
  dataSources: ["billing"],
  fields: ["count"],
  fromDate: monthStart,
  toDate: today,
  groupBy: "department",
  aggregation: "count",
  outputFormat: "PDF",
  outputFormats: ["PDF"],
  recipients: "",
  scheduleFrequency: "MANUAL",
};

const dataSourceOptions = ["clinical", "billing", "pharmacy", "inventory"];
const fieldOptions = ["count", "totalAmount", "amount", "patient", "department", "doctor", "diagnosis", "status"];
const formatKes = (value: unknown) => `KES ${Number(value || 0).toLocaleString("en-KE", { maximumFractionDigits: 0 })}`;

export default function ReportsPage() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [workspace, setWorkspace] = useState<any>({});
  const [mohResult, setMohResult] = useState<any>(null);
  const [customResult, setCustomResult] = useState<any>(null);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [templateFilter, setTemplateFilter] = useState("ALL");
  const [modal, setModal] = useState<"moh" | "builder" | "">("");
  const [mohForm, setMohForm] = useState(emptyMoh);
  const [builderForm, setBuilderForm] = useState(emptyBuilder);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ tone: "success" | "warning" | "error"; text: string } | null>(null);

  const notify = (text: string, tone: "success" | "warning" | "error" = "success") => {
    setNotice({ text, tone });
    window.setTimeout(() => setNotice(null), tone === "error" ? 5200 : 3600);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [dashboardRes, workspaceRes] = await Promise.all([
        api.get("/reporting/dashboard"),
        api.get("/reporting/workspace"),
      ]);
      setDashboard(dashboardRes.data || {});
      setWorkspace(workspaceRes.data || {});
    } catch (error: any) {
      notify(error?.response?.data?.message || error?.message || "Reporting data could not be loaded.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const stats = [
    { label: "Today Visits", value: dashboard?.executive?.todayVisits || 0, color: "#2563eb", icon: <BarChart3 size={20} /> },
    { label: "Revenue Collected", value: formatKes(dashboard?.financial?.totalPaid), color: "#16a34a", icon: <FileSpreadsheet size={20} /> },
    { label: "Saved Templates", value: workspace?.templates?.length || 0, color: "#7c3aed", icon: <Settings2 size={20} /> },
    { label: "Report Runs", value: workspace?.runs?.length || 0, color: "#0f766e", icon: <Play size={20} /> },
    { label: "MOH Submissions", value: workspace?.mohSubmissions?.length || 0, color: "#dc2626", icon: <Send size={20} /> },
    { label: "Archived Reports", value: workspace?.reports?.length || 0, color: "#d97706", icon: <FileText size={20} /> },
  ];

  const templates = useMemo(() => {
    const q = search.toLowerCase();
    return (workspace?.templates || []).filter((row: any) => {
      const hay = [row.name, row.category, row.description, row.mohFormReference].join(" ").toLowerCase();
      return (!q || hay.includes(q)) && (templateFilter === "ALL" || String(row.category).toUpperCase() === templateFilter);
    });
  }, [workspace, search, templateFilter]);

  const runs = useMemo(() => filterRows(workspace?.runs || [], search, ["status", "outputUrl", "requestedBy"]), [workspace, search]);
  const reports = useMemo(() => filterRows(workspace?.reports || [], search, ["title", "type", "generatedUrl"]), [workspace, search]);
  const submissions = useMemo(() => filterRows(workspace?.mohSubmissions || [], search, ["formType", "title", "status", "khisAcknowledgement"]), [workspace, search]);

  const generateMoh = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (new Date(mohForm.fromDate) > new Date(mohForm.toDate)) {
      notify("The MOH report start date cannot be after the end date.", "warning");
      return;
    }
    setSaving(true);
    try {
      const response = await api.post("/reporting/moh/generate", mohForm);
      setMohResult(response.data);
      setCustomResult(null);
      setSelectedRecord(response.data);
      setModal("");
      notify(mohForm.submitElectronically ? "MOH report submitted to KHIS/DHIS2 and archived." : "MOH report generated for review.");
      await loadData();
    } catch (error: any) {
      notify(error?.response?.data?.message || error?.message || "MOH report could not be generated.", "error");
    } finally {
      setSaving(false);
    }
  };

  const reviewMoh = async (reportId: string, decision: "APPROVED" | "REJECTED" | "CORRECTION_REQUIRED") => {
    setSaving(true);
    try { await api.post(`/reporting/moh/${reportId}/review`, { decision }); notify(`MOH report ${decision.toLowerCase().replaceAll("_", " ")}.`); await loadData(); }
    catch (error: any) { notify(error?.response?.data?.message || error?.message || "MOH review could not be saved.", "error"); }
    finally { setSaving(false); }
  };

  const submitMoh = async (reportId: string) => {
    setSaving(true);
    try { await api.post(`/reporting/moh/${reportId}/submit`, { destination: "KHIS/DHIS2" }); notify("MOH submission attempt recorded."); await loadData(); }
    catch (error: any) { notify(error?.response?.data?.message || error?.message || "MOH submission failed.", "error"); }
    finally { setSaving(false); }
  };

  const saveTemplate = async () => {
    if (!builderForm.name.trim()) {
      notify("Enter a report name before saving the template.", "warning");
      return;
    }
    if (!builderForm.dataSources.length || !builderForm.fields.length || !builderForm.outputFormats.length) {
      notify("Select at least one data source, field, and saved output format.", "warning");
      return;
    }
    setSaving(true);
    try {
      const saved = await api.post("/reporting/templates", {
        ...builderForm,
        schedule: { frequency: builderForm.scheduleFrequency, recipients: builderForm.recipients },
      });
      if (builderForm.scheduleFrequency !== "MANUAL") {
        await api.post("/reporting/schedules", { templateId: saved.data?.id, frequency: builderForm.scheduleFrequency, recipients: builderForm.recipients, outputFormat: builderForm.outputFormat });
      }
      notify("Custom report template saved.");
      await loadData();
    } catch (error: any) {
      notify(error?.response?.data?.message || error?.message || "Template could not be saved.", "error");
    } finally {
      setSaving(false);
    }
  };

  const runCustom = async (event?: FormEvent<HTMLFormElement>, templateId?: string) => {
    event?.preventDefault();
    if (!templateId && new Date(builderForm.fromDate) > new Date(builderForm.toDate)) {
      notify("The custom report start date cannot be after the end date.", "warning");
      return;
    }
    if (!templateId && !builderForm.dataSources.length) {
      notify("Select at least one data source module.", "warning");
      return;
    }
    setSaving(true);
    try {
      const payload = templateId ? { templateId, fromDate: builderForm.fromDate, toDate: builderForm.toDate, outputFormat: builderForm.outputFormat } : builderForm;
      const response = await api.post("/reporting/custom/run", payload);
      setCustomResult(response.data);
      setMohResult(null);
      setSelectedRecord(response.data);
      setModal("");
      notify("Custom report generated and archived.");
      await loadData();
    } catch (error: any) {
      notify(error?.response?.data?.message || error?.message || "Custom report could not be run.", "error");
    } finally {
      setSaving(false);
    }
  };

  const exportReport = async (reportType: string, format: "csv" | "json" | "xlsx" | "pdf") => {
    setSaving(true);
    try {
      const response = await api.get("/reporting/export", { params: { reportType, format, fromDate: builderForm.fromDate, toDate: builderForm.toDate } });
      if (format === "pdf") {
        const printWindow = window.open("", "_blank");
        if (!printWindow) throw new Error("Allow pop-ups to print the hospital report.");
        printWindow.document.open(); printWindow.document.write(response.data?.content || "<p>No report data.</p>"); printWindow.document.close();
      } else if (format === "xlsx") {
        downloadBase64(response.data?.content || "", response.data?.filename || `medilink-${reportType}.xlsx`, response.data?.mimeType || "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      } else {
        downloadText(response.data?.content || "", response.data?.filename || `medilink-${reportType}.${format}`, response.data?.mimeType || "text/plain");
      }
      notify(`${reportType.toUpperCase()} ${format === "pdf" ? "print view opened" : "report exported"}.`);
      await loadData();
    } catch (error: any) {
      notify(error?.response?.data?.message || error?.message || "Report export failed.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="reports-page">
      <header className="reports-header">
        <div className="reports-title">
          <h1>Reporting &amp; Analytics</h1>
          <p>Statutory reporting, custom analytics, governance, validation, and KHIS/DHIS2 submission management.</p>
        </div>
        <div className="reports-actions">
          <button className="reports-btn ghost" type="button" onClick={() => void loadData()} disabled={loading}><RefreshCw size={17} /> Refresh</button>
          <button className="reports-btn red" type="button" onClick={() => { setMohForm(emptyMoh); setModal("moh"); }}><FileText size={17} /> MOH Report</button>
          <button className="reports-btn blue" type="button" onClick={() => { setBuilderForm(emptyBuilder); setModal("builder"); }}><Settings2 size={17} /> Custom Builder</button>
        </div>
      </header>

      <section className="reports-stats">{stats.map((stat) => <article className="reports-stat" style={{ borderLeftColor: stat.color }} key={stat.label}><div><span>{stat.label}</span><strong>{stat.value}</strong></div><i style={{ color: stat.color }}>{stat.icon}</i></article>)}</section>

      <section className="reports-filter">
        <label><Search size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search templates, reports, submissions, runs..." /></label>
        <select value={templateFilter} onChange={(event) => setTemplateFilter(event.target.value)}><option value="ALL">All template categories</option><option value="CUSTOM">Custom</option><option value="MANAGEMENT">Management</option><option value="FINANCE">Finance</option><option value="CLINICAL">Clinical</option></select>
        <button type="button" onClick={() => void exportReport("financial", "xlsx")} disabled={saving}><Download size={16} /> Financial Excel</button>
        <button type="button" onClick={() => void exportReport("financial", "pdf")} disabled={saving}><FileText size={16} /> Financial PDF</button>
      </section>

      <section className="reports-layout">
        <div className="reports-left">
          <ReportsPanel title="MOH Statutory Reporting">
            <ReportsTable>
              <thead><tr><th>Form</th><th>Status</th><th>Rows</th><th>KHIS/DHIS2</th><th>Generated</th><th>Review</th></tr></thead>
              <tbody>{submissions.length ? submissions.map((row: any) => <tr key={row.id} onClick={() => { setSelectedRecord(row); setMohResult({ title: row.title, rows: [], status: row.status }); setCustomResult(null); }}><td><strong>{row.formType}</strong><small>{row.title}</small></td><td><Pill tone={row.submittedElectronically ? "ok" : "warn"}>{row.status}</Pill></td><td>{row.rowCount}</td><td>{row.khisAcknowledgement || "Draft"}</td><td>{formatDate(row.createdAt || row.generatedAt)}</td><td className="reports-row-actions">{row.reportId ? <><button type="button" onClick={(event) => { event.stopPropagation(); void reviewMoh(row.reportId, "APPROVED"); }} disabled={saving}>Approve</button><button type="button" onClick={(event) => { event.stopPropagation(); void submitMoh(row.reportId); }} disabled={saving}>Submit</button></> : "-"}</td></tr>) : <tr><td colSpan={6} className="reports-empty">No MOH reports recorded.</td></tr>}</tbody>
            </ReportsTable>
          </ReportsPanel>

          <ReportsPanel title="Custom Report Templates">
            <ReportsTable>
              <thead><tr><th>Template</th><th>Category</th><th>Sources</th><th>Output</th><th>Action</th></tr></thead>
              <tbody>{templates.length ? templates.map((row: any) => {
                const config = row.queryConfig || {};
                return <tr key={row.id} onClick={() => setSelectedRecord(row)}><td><strong>{row.name}</strong><small>{row.description || "Reusable report template"}</small></td><td><Pill>{row.category}</Pill></td><td>{(config.dataSources || []).join(", ") || row.mohFormReference || "-"}</td><td>{(row.outputFormat || []).join(", ")}</td><td><button type="button" onClick={(event) => { event.stopPropagation(); void runCustom(undefined, row.id); }} disabled={saving}><Play size={14} /> Run</button></td></tr>;
              }) : <tr><td colSpan={5} className="reports-empty">No custom templates found.</td></tr>}</tbody>
            </ReportsTable>
          </ReportsPanel>
        </div>

        <aside className="reports-right">
          <ReportsPanel title="Latest Generated Result">
            {mohResult ? <ResultPreview title={mohResult.title} rows={mohResult.rows} status={mohResult.status} fallback={selectedRecord} /> : customResult ? <ResultPreview title={customResult.template?.name || "Custom Report"} rows={customResult.grouped} status={customResult.run?.status} fallback={selectedRecord} /> : selectedRecord ? <RecordDetails record={selectedRecord} /> : <p className="reports-note">Generate a MOH report, run a custom template, or click any table row to preview details here.</p>}
          </ReportsPanel>
          <ReportsPanel title="Run History">
            <div className="reports-list">{runs.length ? runs.slice(0, 8).map((row: any) => <button type="button" key={row.id} onClick={() => { setSelectedRecord(row); setMohResult(null); setCustomResult(null); }}><span><strong>{row.status}</strong><small>{formatDate(row.startedAt)} · {row.rowCount || 0} rows</small></span><CheckCircle2 size={18} /></button>) : <p className="reports-note">No custom report runs yet.</p>}</div>
          </ReportsPanel>
          <ReportsPanel title="Report Archive">
            <div className="reports-list">{reports.length ? reports.slice(0, 8).map((row: any) => <button type="button" key={row.id} onClick={() => { setSelectedRecord(row); setMohResult(null); setCustomResult(null); }}><span><strong>{row.title}</strong><small>{row.type} · {formatDate(row.createdAt)}</small></span><FileText size={18} /></button>) : <p className="reports-note">No archived reports yet.</p>}</div>
          </ReportsPanel>
          <ReportsPanel title="Validation Exceptions">
            <div className="reports-list">{(workspace?.exceptions || []).slice(0, 8).map((row: any) => <button type="button" key={row.id} onClick={() => setSelectedRecord(row)}><span><strong>{row.severity} · {row.rule_code}</strong><small>{row.message}</small></span><X size={18} /></button>)}{!(workspace?.exceptions || []).length ? <p className="reports-note">No validation exceptions recorded.</p> : null}</div>
          </ReportsPanel>
          <ReportsPanel title="Scheduled Reports">
            <div className="reports-list">{(workspace?.schedules || []).slice(0, 8).map((row: any) => <button type="button" key={row.id} onClick={() => setSelectedRecord(row)}><span><strong>{row.frequency} · {row.output_format || row.outputFormat}</strong><small>{row.next_run_at ? formatDate(row.next_run_at) : "Next run not set"}</small></span><Settings2 size={18} /></button>)}{!(workspace?.schedules || []).length ? <p className="reports-note">No scheduled reports configured.</p> : null}</div>
          </ReportsPanel>
          <ReportsPanel title="Data freshness and lineage">
            <div className="reports-list">{(workspace?.freshness?.rows || []).map((row: any) => <div className="reports-list-item" key={row.module}><span><strong>{row.module}</strong><small>{row.lastUpdatedAt ? `Last event ${formatDate(row.lastUpdatedAt)}` : "No recent source event"}</small></span><Pill tone={row.status === "AVAILABLE" ? "ok" : "warn"}>{row.status}</Pill></div>)}{!(workspace?.freshness?.rows || []).length ? <p className="reports-note">Freshness metadata is not available.</p> : null}</div>
          </ReportsPanel>
          <ReportsPanel title="Report catalogue">
            <div className="reports-list">{(workspace?.catalog?.metrics || []).slice(0, 6).map((row: any) => <div className="reports-list-item" key={row.code}><span><strong>{row.name}</strong><small>{row.code} · {row.owner}</small></span><Pill>{row.unit}</Pill></div>)}</div>
          </ReportsPanel>
        </aside>
      </section>

      {modal === "moh" ? <ReportsModal title="MOH Statutory Report" tone="red" onClose={() => setModal("")}><form className="reports-form" onSubmit={generateMoh}><Select label="MOH form" value={mohForm.formType} onChange={(v) => setMohForm((f) => ({ ...f, formType: v }))} options={["MOH_705A", "MOH_705B", "HMIS_105"]} /><Input label="From date" type="date" value={mohForm.fromDate} onChange={(v) => setMohForm((f) => ({ ...f, fromDate: v }))} /><Input label="To date" type="date" value={mohForm.toDate} onChange={(v) => setMohForm((f) => ({ ...f, toDate: v }))} /><Input label="Reviewed by" value={mohForm.reviewedBy} onChange={(v) => setMohForm((f) => ({ ...f, reviewedBy: v }))} /><label className="reports-check"><input type="checkbox" checked={mohForm.submitElectronically} onChange={(event) => setMohForm((f) => ({ ...f, submitElectronically: event.target.checked }))} /> Submit electronically to KHIS/DHIS2 after generation</label><Footer saving={saving} onCancel={() => setModal("")} label={mohForm.submitElectronically ? "Generate and Submit" : "Generate Draft"} /></form></ReportsModal> : null}

      {modal === "builder" ? <ReportsModal title="Custom Report Builder" tone="blue" onClose={() => setModal("")}><form className="reports-form" onSubmit={(event) => void runCustom(event)}><Input label="Report name" value={builderForm.name} onChange={(v) => setBuilderForm((f) => ({ ...f, name: v }))} required /><Select label="Category" value={builderForm.category} onChange={(v) => setBuilderForm((f) => ({ ...f, category: v }))} options={["MANAGEMENT", "FINANCE", "CLINICAL", "OPERATIONS", "CUSTOM"]} /><Input label="From date" type="date" value={builderForm.fromDate} onChange={(v) => setBuilderForm((f) => ({ ...f, fromDate: v }))} /><Input label="To date" type="date" value={builderForm.toDate} onChange={(v) => setBuilderForm((f) => ({ ...f, toDate: v }))} /><CheckGroup label="Data source modules" options={dataSourceOptions} values={builderForm.dataSources} onChange={(values) => setBuilderForm((f) => ({ ...f, dataSources: values }))} /><CheckGroup label="Report fields" options={fieldOptions} values={builderForm.fields} onChange={(values) => setBuilderForm((f) => ({ ...f, fields: values }))} /><Select label="Group by" value={builderForm.groupBy} onChange={(v) => setBuilderForm((f) => ({ ...f, groupBy: v }))} options={["department", "doctor", "status", "recordType", "diagnosis"]} /><Select label="Aggregation" value={builderForm.aggregation} onChange={(v) => setBuilderForm((f) => ({ ...f, aggregation: v }))} options={["count", "sum", "average"]} /><Select label="Run output" value={builderForm.outputFormat} onChange={(v) => setBuilderForm((f) => ({ ...f, outputFormat: v }))} options={["PDF", "EXCEL", "CHART", "CSV", "JSON"]} /><CheckGroup label="Saved output formats" options={["PDF", "EXCEL", "CHART"]} values={builderForm.outputFormats} onChange={(values) => setBuilderForm((f) => ({ ...f, outputFormats: values }))} /><Select label="Schedule" value={builderForm.scheduleFrequency} onChange={(v) => setBuilderForm((f) => ({ ...f, scheduleFrequency: v }))} options={["MANUAL", "DAILY", "WEEKLY", "MONTHLY"]} /><Input label="Email recipients" value={builderForm.recipients} onChange={(v) => setBuilderForm((f) => ({ ...f, recipients: v }))} /><Area label="Description" value={builderForm.description} onChange={(v) => setBuilderForm((f) => ({ ...f, description: v }))} /><footer><button type="button" onClick={() => setModal("")}>Cancel</button><button type="button" onClick={() => void saveTemplate()} disabled={saving}><Save size={15} /> Save Template</button><button type="submit" disabled={saving}>{saving ? "Working..." : "Run Report"}</button></footer></form></ReportsModal> : null}

      {notice ? <div className={`reports-toast ${notice.tone}`} role="status"><i>{notice.tone === "error" || notice.tone === "warning" ? <AlertTriangle size={19} /> : <CheckCircle2 size={19} />}</i><div><strong>{notice.tone === "error" ? "Error" : notice.tone === "warning" ? "Attention" : "Done"}</strong><span>{notice.text}</span></div><button type="button" onClick={() => setNotice(null)} aria-label="Dismiss notification"><X size={16} /></button></div> : null}
      {loading ? <div className="reports-loading">Loading reporting workspace...</div> : null}
    </main>
  );
}

function filterRows(rows: any[], search: string, keys: string[]) {
  const q = search.trim().toLowerCase();
  if (!q) return rows;
  return rows.filter((row) => keys.map((key) => row?.[key]).join(" ").toLowerCase().includes(q));
}

function downloadText(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

function downloadBase64(content: string, filename: string, mimeType: string) {
  const binary = window.atob(content);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  const url = window.URL.createObjectURL(new Blob([bytes], { type: mimeType }));
  const link = document.createElement("a"); link.href = url; link.download = filename; document.body.appendChild(link); link.click(); link.remove(); window.URL.revokeObjectURL(url);
}

function formatDate(value: unknown) {
  const date = new Date(String(value || ""));
  return Number.isFinite(date.getTime()) ? date.toLocaleDateString() : "-";
}

function ReportsPanel({ title, children }: { title: string; children: ReactNode }) {
  return <section className="reports-panel"><header><h2>{title}</h2></header>{children}</section>;
}

function ReportsTable({ children }: { children: ReactNode }) {
  return <div className="reports-table-wrap"><table className="reports-table">{children}</table></div>;
}

function ReportsModal({ title, tone, onClose, children }: { title: string; tone: string; onClose: () => void; children: ReactNode }) {
  return <div className="reports-modal-backdrop"><section className={`reports-modal is-${tone}`}><header><div><span>Reporting</span><h2>{title}</h2></div><button type="button" onClick={onClose} aria-label="Close form"><X size={18} /></button></header>{children}</section></div>;
}

function ResultPreview({ title, rows, status, fallback }: { title: string; rows: any[]; status?: string; fallback?: any }) {
  const outputRows = rows?.length ? rows : fallback ? [fallback] : [];
  return <div className="reports-result"><div><strong>{title}</strong><Pill tone="ok">{status || "GENERATED"}</Pill></div><ReportsTable><thead><tr>{Object.keys(outputRows?.[0] || { message: "No rows" }).slice(0, 4).map((key) => <th key={key}>{key}</th>)}</tr></thead><tbody>{outputRows.slice(0, 6).map((row, index) => <tr key={index}>{Object.keys(outputRows?.[0] || {}).slice(0, 4).map((key) => <td key={key}>{String(row[key] ?? "")}</td>)}</tr>)}</tbody></ReportsTable></div>;
}

function RecordDetails({ record }: { record: any }) {
  const entries = Object.entries(record || {}).filter(([, value]) => value !== undefined && value !== null).slice(0, 12);
  return <dl className="reports-details">{entries.map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{typeof value === "object" ? JSON.stringify(value) : String(value)}</dd></div>)}</dl>;
}

function Pill({ children, tone = "" }: { children: ReactNode; tone?: string }) {
  return <span className={`reports-pill ${tone}`}>{children}</span>;
}

function Input({ label, value, onChange, type = "text", required = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean }) {
  return <label><span>{label}</span><input type={type} value={value} required={required} onChange={(event) => onChange(event.target.value)} /></label>;
}

function Area({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="wide"><span>{label}</span><textarea value={value} onChange={(event) => onChange(event.target.value)} /></label>;
}

function Select({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return <label><span>{label}</span><select value={value} onChange={(event) => onChange(event.target.value)}>{options.map((option) => <option value={option} key={option}>{option.replaceAll("_", " ")}</option>)}</select></label>;
}

function CheckGroup({ label, options, values, onChange }: { label: string; options: string[]; values: string[]; onChange: (values: string[]) => void }) {
  return <fieldset className="reports-checkgroup"><legend>{label}</legend>{options.map((option) => <label key={option}><input type="checkbox" checked={values.includes(option)} onChange={(event) => onChange(event.target.checked ? [...values, option] : values.filter((value) => value !== option))} />{option}</label>)}</fieldset>;
}

function Footer({ saving, onCancel, label }: { saving: boolean; onCancel: () => void; label: string }) {
  return <footer><button type="button" onClick={onCancel}>Cancel</button><button type="submit" disabled={saving}>{saving ? "Working..." : label}</button></footer>;
}

export { ReportsPage as ReportsView };
