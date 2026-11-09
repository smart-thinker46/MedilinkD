"use client";

import { FormEvent, ReactNode, useEffect, useId, useMemo, useState } from "react";
import { Activity, AlertTriangle, ArrowDown, ArrowUp, Bed, CheckCircle2, Clock, DollarSign, GripVertical, LayoutDashboard, Maximize2, Minimize2, RefreshCw, Save, Search, Settings2, Stethoscope, Users, X } from "lucide-react";
import { api } from "../lib/api";

const today = new Date().toISOString().slice(0, 10);
const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);

const widgetCatalog = [
  { id: "bed-occupancy", title: "Bed Occupancy Rate", category: "clinical", kpiKey: "bedOccupancyRate", target: 85, direction: "higher", unit: "%" },
  { id: "alos", title: "Average Length of Stay", category: "clinical", kpiKey: "averageLengthOfStay", target: 5, direction: "lower", unit: "days" },
  { id: "surgery-completion", title: "Surgery Completion Rate", category: "clinical", kpiKey: "surgeryCompletionRate", target: 90, direction: "higher", unit: "%" },
  { id: "medication-error", title: "Medication Error Rate", category: "clinical", kpiKey: "medicationErrorRate", target: 2, direction: "lower", unit: "%" },
  { id: "patient-satisfaction", title: "Patient Satisfaction Score", category: "clinical", kpiKey: "patientSatisfaction", target: 85, direction: "higher", unit: "%" },
  { id: "mortality-rate", title: "Mortality Rate", category: "clinical", kpiKey: "mortalityRate", target: 3, direction: "lower", unit: "%" },
  { id: "daily-revenue", title: "Daily Revenue", category: "financial", kpiKey: "dailyRevenue", target: 500000, direction: "higher", unit: "KES" },
  { id: "collections-vs-billing", title: "Collections vs Billing", category: "financial", kpiKey: "collectionsVsBilling", target: 85, direction: "higher", unit: "%" },
  { id: "accounts-receivable", title: "Accounts Receivable By Insurer", category: "financial", kpiKey: "accountsReceivable", target: 30, direction: "lower", unit: "days" },
  { id: "cost-per-patient-day", title: "Cost Per Patient Day", category: "financial", kpiKey: "costPerPatientDay", target: 12000, direction: "lower", unit: "KES" },
  { id: "pharmacy-margin", title: "Pharmacy Margin", category: "financial", kpiKey: "pharmacyMargin", target: 25, direction: "higher", unit: "%" },
  { id: "queue-wait-times", title: "Queue Wait Times", category: "operational", kpiKey: "queueWaitTimes", target: 30, direction: "lower", unit: "min" },
  { id: "lab-turnaround", title: "Lab Turnaround Times", category: "operational", kpiKey: "labTurnaroundTimes", target: 120, direction: "lower", unit: "min" },
  { id: "theatre-utilisation", title: "Theatre Utilisation", category: "operational", kpiKey: "theatreUtilisation", target: 75, direction: "higher", unit: "%" },
  { id: "bed-availability", title: "Bed Availability By Ward", category: "operational", kpiKey: "bedAvailability", target: 10, direction: "higher", unit: "beds" },
  { id: "staffing-levels", title: "Nursing Staffing Levels", category: "workforce", kpiKey: "staffingLevels", target: 80, direction: "higher", unit: "%" },
];

const defaultWidget = { id: "patient-satisfaction", title: "Patient Satisfaction Score", category: "clinical", kpiKey: "patientSatisfaction", size: "small", position: 99, period: "month", refreshMinutes: 15, visible: true };

export default function AnalyticsDashboard() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [riskAlerts, setRiskAlerts] = useState<any[]>([]);
  const [snapshots, setSnapshots] = useState<any[]>([]);
  const [widgets, setWidgets] = useState<any[]>([]);
  const [role, setRole] = useState("CEO");
  const [fromDate, setFromDate] = useState(monthStart);
  const [toDate, setToDate] = useState(today);
  const [period, setPeriod] = useState("month");
  const [autoRefresh, setAutoRefresh] = useState(15);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<"widget" | "">("");
  const [widgetForm, setWidgetForm] = useState(defaultWidget);
  const [selectedDetail, setSelectedDetail] = useState<any>(null);
  const [draggedWidget, setDraggedWidget] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ tone: "success" | "warning" | "error"; text: string } | null>(null);

  const notify = (text: string, tone: "success" | "warning" | "error" = "success") => {
    setNotice({ text, tone });
    window.setTimeout(() => setNotice(null), tone === "error" ? 5200 : 3400);
  };

  const loadData = async () => {
    if (new Date(fromDate) > new Date(toDate)) {
      notify("Start date cannot be after end date.", "warning");
      return;
    }
    setLoading(true);
    try {
      const params = { fromDate, toDate };
      const [dashRes, alertsRes, widgetsRes, snapshotsRes] = await Promise.all([
        api.get("/executive/dashboard", { params }),
        api.get("/executive/risk-alerts", { params }),
        api.get("/executive/widgets", { params: { role } }),
        api.get("/executive/snapshots", { params: { limit: 20 } }),
      ]);
      setDashboard(dashRes.data || {});
      setRiskAlerts(Array.isArray(alertsRes.data) ? alertsRes.data : alertsRes.data?.data || []);
      const config = widgetsRes.data || {};
      setWidgets(Array.isArray(config.widgets) ? config.widgets : []);
      setSnapshots(Array.isArray(snapshotsRes.data) ? snapshotsRes.data : []);
      setAutoRefresh(Number(config.autoRefreshMinutes || autoRefresh || 15));
    } catch (error: any) {
      notify(error?.response?.data?.message || error?.message || "Executive dashboard could not be loaded.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [role, fromDate, toDate]);

  useEffect(() => {
    if (!autoRefresh) return;
    const timer = window.setInterval(() => void loadData(), Math.max(1, autoRefresh) * 60 * 1000);
    return () => window.clearInterval(timer);
  }, [autoRefresh, role, fromDate, toDate]);

  const values = useMemo(() => buildKpiValues(dashboard), [dashboard]);
  const visibleWidgets = useMemo(() => {
    const q = search.trim().toLowerCase();
    return widgets
      .filter((row) => row.visible !== false)
      .filter((row) => !q || [row.title, row.category, row.kpiKey].join(" ").toLowerCase().includes(q))
      .sort((a, b) => Number(a.position || 0) - Number(b.position || 0));
  }, [widgets, search]);
  const visibleAlerts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return riskAlerts.filter((row) => !q || [row.alertType, row.title, row.severity, row.status, row.department].join(" ").toLowerCase().includes(q));
  }, [riskAlerts, search]);

  const commandStats = [
    { label: "Clinical KPIs", value: visibleWidgets.filter((row) => row.category === "clinical").length, color: "#2563eb", icon: <Stethoscope size={20} /> },
    { label: "Financial KPIs", value: visibleWidgets.filter((row) => row.category === "financial").length, color: "#16a34a", icon: <DollarSign size={20} /> },
    { label: "Operational KPIs", value: visibleWidgets.filter((row) => row.category === "operational").length, color: "#d97706", icon: <Activity size={20} /> },
    { label: "Open Risk Alerts", value: riskAlerts.length, color: "#dc2626", icon: <AlertTriangle size={20} /> },
    { label: "Refresh Interval", value: `${autoRefresh} min`, color: "#7c3aed", icon: <Clock size={20} /> },
    { label: "Widgets Visible", value: visibleWidgets.length, color: "#0f766e", icon: <LayoutDashboard size={20} /> },
  ];
  const kpiRows = useMemo(() => widgetCatalog.map((catalog) => {
    const value = values[catalog.kpiKey] ?? 0;
    return {
      ...catalog,
      value,
      status: kpiStatus(value == null ? null : Number(value), Number(catalog.target || 0), catalog.direction),
    };
  }), [values]);
  const statusCounts = kpiRows.reduce((acc, row) => ({ ...acc, [row.status]: Number((acc as any)[row.status] || 0) + 1 }), {} as Record<string, number>);
  const statusTotal = Math.max(1, kpiRows.length);
  const statusGradient = pieGradient([
    { value: statusCounts.green || 0, color: "#16a34a" },
    { value: statusCounts.yellow || 0, color: "#f59e0b" },
    { value: statusCounts.red || 0, color: "#dc2626" },
  ]);
  const billing = Number(dashboard?.financial?.totalRevenue || 0);
  const collections = Number(dashboard?.financial?.totalPaid || 0);
  const outstanding = Math.max(0, Number(dashboard?.financial?.totalOutstanding || billing - collections));
  const collectionGradient = pieGradient([
    { value: collections, color: "#16a34a" },
    { value: outstanding, color: "#dc2626" },
  ]);

  const saveLayout = async () => {
    if (!widgets.length) {
      notify("Add at least one widget before saving.", "warning");
      return;
    }
    setSaving(true);
    try {
      await api.post("/executive/widgets", { role, widgets, autoRefreshMinutes: autoRefresh });
      notify("Executive dashboard layout saved.");
    } catch (error: any) {
      notify(error?.response?.data?.message || error?.message || "Widget layout could not be saved.", "error");
    } finally {
      setSaving(false);
    }
  };

  const captureSnapshot = async () => {
    setSaving(true);
    try {
      const response = await api.post("/executive/snapshot", { fromDate, toDate, role });
      setSelectedDetail(response.data || null);
      notify("Immutable executive dashboard snapshot captured.");
    } catch (error: any) {
      notify(error?.response?.data?.message || error?.message || "Dashboard snapshot could not be captured.", "error");
    } finally { setSaving(false); }
  };

  const applyPeriod = (value: string) => {
    setPeriod(value);
    const end = new Date();
    const start = new Date(end);
    if (value === "today") start.setHours(0, 0, 0, 0);
    else if (value === "week") start.setDate(end.getDate() - 6);
    else if (value === "quarter") start.setMonth(end.getMonth() - 2, 1);
    else if (value === "year") start.setMonth(0, 1);
    else if (value === "rolling30") start.setDate(end.getDate() - 29);
    else return;
    setFromDate(start.toISOString().slice(0, 10)); setToDate(end.toISOString().slice(0, 10));
  };

  const moveWidget = (id: string, direction: -1 | 1) => {
    const sorted = [...widgets].sort((a, b) => Number(a.position || 0) - Number(b.position || 0));
    const index = sorted.findIndex((row) => row.id === id);
    const swapIndex = index + direction;
    if (index < 0 || swapIndex < 0 || swapIndex >= sorted.length) return;
    [sorted[index], sorted[swapIndex]] = [sorted[swapIndex], sorted[index]];
    setWidgets(sorted.map((row, idx) => ({ ...row, position: idx + 1 })));
  };

  const removeWidget = (id: string) => {
    setWidgets((rows) => rows.map((row) => row.id === id ? { ...row, visible: false } : row));
  };

  const dropWidget = (targetId: string) => {
    if (!draggedWidget || draggedWidget === targetId) return;
    const sorted = [...widgets].sort((a, b) => Number(a.position || 0) - Number(b.position || 0));
    const from = sorted.findIndex((row) => row.id === draggedWidget);
    const to = sorted.findIndex((row) => row.id === targetId);
    if (from < 0 || to < 0) return;
    const [moved] = sorted.splice(from, 1); sorted.splice(to, 0, moved);
    setWidgets(sorted.map((row, index) => ({ ...row, position: index + 1 })));
    setDraggedWidget(null);
  };

  const acknowledgeAlert = async (alert: any) => {
    const id = String(alert?.id || alert?.riskAlertId || "");
    if (!id) return;
    setSaving(true);
    try {
      await api.post(`/executive/risk-alerts/${id}/acknowledge`, { comments: "Acknowledged from Executive Dashboard" });
      notify("Risk alert acknowledged.");
      await loadData();
    } catch (error: any) { notify(error?.response?.data?.message || error?.message || "Alert acknowledgement failed.", "error"); }
    finally { setSaving(false); }
  };

  const addWidget = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!widgetForm.id || Number(widgetForm.refreshMinutes || 0) <= 0) {
      notify("Select a widget and enter a valid refresh interval.", "warning");
      return;
    }
    const catalog = widgetCatalog.find((row) => row.id === widgetForm.id || row.kpiKey === widgetForm.kpiKey);
    const next = {
      ...widgetForm,
      title: catalog?.title || widgetForm.title,
      category: catalog?.category || widgetForm.category,
      kpiKey: catalog?.kpiKey || widgetForm.kpiKey,
      position: widgets.length + 1,
      visible: true,
    };
    setWidgets((rows) => [...rows.filter((row) => row.id !== next.id), next]);
    setModal("");
    notify("Widget added to dashboard.");
  };

  return (
    <main className="exec-page">
      <header className="exec-header">
        <div className="exec-title">
          <h1>Executive Dashboard</h1>
          <p>Real-time clinical, financial, operational, workforce, and quality performance with governed role-based KPI views.</p>
        </div>
        <div className="exec-actions">
          <button className="exec-btn ghost" type="button" onClick={() => void loadData()} disabled={loading}><RefreshCw size={17} /> Refresh</button>
          <button className="exec-btn blue" type="button" onClick={() => { setWidgetForm(defaultWidget); setModal("widget"); }}><Settings2 size={17} /> Add Widget</button>
          <button className="exec-btn green" type="button" onClick={() => void saveLayout()} disabled={saving}><Save size={17} /> Save Layout</button>
          <button className="exec-btn purple" type="button" onClick={() => void captureSnapshot()} disabled={saving}><LayoutDashboard size={17} /> Snapshot</button>
        </div>
      </header>

      <section className="exec-filter">
        <label><Users size={17} /><select value={role} onChange={(event) => setRole(event.target.value)}><option>CEO</option><option>Managing Director</option><option>Hospital Administrator</option><option>CFO</option><option>Medical Director</option><option>Nursing Director</option><option>Operations Director</option><option>Quality Director</option><option>HR Director</option><option>Pharmacy Director</option><option>Laboratory Manager</option><option>Radiology Manager</option><option>Theatre Manager</option><option>Facility Manager</option></select></label>
        <label><Clock size={17} /><select value={period} onChange={(event) => applyPeriod(event.target.value)}><option value="today">Today</option><option value="week">This week</option><option value="month">This month</option><option value="quarter">This quarter</option><option value="year">This year</option><option value="rolling30">Rolling 30 days</option><option value="custom">Custom range</option></select></label>
        <label><Clock size={17} /><select value={autoRefresh} onChange={(event) => setAutoRefresh(Number(event.target.value))}><option value={5}>Refresh 5 min</option><option value={10}>Refresh 10 min</option><option value={15}>Refresh 15 min</option><option value={30}>Refresh 30 min</option></select></label>
        <input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
        <input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} />
        <label className="exec-search"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search widgets, KPI, category..." /></label>
      </section>
      {dashboard?.sourceStatus === "UNAVAILABLE" ? <div className="exec-data-warning"><AlertTriangle size={16} /> Executive data source unavailable. KPI values are marked unknown until the source modules recover.</div> : null}

      <section className="exec-stats">{commandStats.map((stat) => <article className="exec-stat" style={{ borderLeftColor: stat.color }} key={stat.label}><div><span>{stat.label}</span><strong>{stat.value}</strong></div><i style={{ color: stat.color }}>{stat.icon}</i></article>)}</section>

      <section className="exec-widget-grid">
        {visibleWidgets.length ? visibleWidgets.map((widget) => {
          const catalog = widgetCatalog.find((row) => row.kpiKey === widget.kpiKey || row.id === widget.id);
          const value = values[widget.kpiKey] ?? 0;
          const status = kpiStatus(value == null ? null : Number(value), Number(catalog?.target || 0), catalog?.direction || "higher");
          return <article className={`exec-widget ${widget.size || "medium"} ${status}`} key={widget.id} draggable onDragStart={() => setDraggedWidget(widget.id)} onDragOver={(event) => event.preventDefault()} onDrop={() => dropWidget(widget.id)}>
            <header><GripVertical size={16} /><div><span>{widget.category}</span><h2>{widget.title}</h2></div><b>{status}</b></header>
            <strong>{formatValue(value, catalog?.unit)}</strong>
            <p>Target {formatValue(catalog?.target || 0, catalog?.unit)} · {widget.period || "today"} · refresh {widget.refreshMinutes || autoRefresh} min</p>
            <footer><button type="button" onClick={() => moveWidget(widget.id, -1)}><ArrowUp size={14} /></button><button type="button" onClick={() => moveWidget(widget.id, 1)}><ArrowDown size={14} /></button><button type="button" onClick={() => setWidgets((rows) => rows.map((row) => row.id === widget.id ? { ...row, size: row.size === "large" ? "small" : row.size === "small" ? "medium" : "large" } : row))}>Resize</button><button type="button" onClick={() => removeWidget(widget.id)}>Remove</button></footer>
          </article>;
        }) : <div className="exec-empty">No widgets match this view.</div>}
      </section>

      <section className="exec-lower">
        <ExecPanel title="KPI Status Mix">
          <div className="exec-pie-layout">
            <div className="exec-pie" style={{ background: `conic-gradient(${statusGradient})` }}><strong>{statusTotal}</strong><span>KPIs</span></div>
            <div className="exec-pie-legend">
              <button type="button" onClick={() => setSelectedDetail({ status: "green", count: statusCounts.green || 0, kpis: kpiRows.filter((row) => row.status === "green").map((row) => row.title) })}><i style={{ background: "#16a34a" }} /> Green {statusCounts.green || 0}</button>
              <button type="button" onClick={() => setSelectedDetail({ status: "yellow", count: statusCounts.yellow || 0, kpis: kpiRows.filter((row) => row.status === "yellow").map((row) => row.title) })}><i style={{ background: "#f59e0b" }} /> Yellow {statusCounts.yellow || 0}</button>
              <button type="button" onClick={() => setSelectedDetail({ status: "red", count: statusCounts.red || 0, kpis: kpiRows.filter((row) => row.status === "red").map((row) => row.title) })}><i style={{ background: "#dc2626" }} /> Red {statusCounts.red || 0}</button>
            </div>
          </div>
        </ExecPanel>
        <ExecPanel title="Collections vs Billing">
          <div className="exec-pie-layout">
            <div className="exec-pie" style={{ background: `conic-gradient(${collectionGradient})` }}><strong>{Math.round(values.collectionsVsBilling || 0)}%</strong><span>Collected</span></div>
            <div className="exec-pie-legend">
              <button type="button" onClick={() => setSelectedDetail({ label: "Collections", amount: collections })}><i style={{ background: "#16a34a" }} /> Collected {formatValue(collections, "KES")}</button>
              <button type="button" onClick={() => setSelectedDetail({ label: "Outstanding", amount: outstanding })}><i style={{ background: "#dc2626" }} /> Outstanding {formatValue(outstanding, "KES")}</button>
            </div>
          </div>
        </ExecPanel>
      </section>

      <section className="exec-lower">
        <ExecPanel title="Executive KPI Table">
          <ExecTable><thead><tr><th>KPI</th><th>Category</th><th>Current</th><th>Target</th><th>Status</th></tr></thead><tbody>{kpiRows.filter((row) => !search || [row.title, row.category, row.status].join(" ").toLowerCase().includes(search.toLowerCase())).map((row) => <tr key={row.id} onClick={() => setSelectedDetail(row)}><td><strong>{row.title}</strong><small>{row.kpiKey}</small></td><td>{row.category}</td><td>{formatValue(row.value, row.unit)}</td><td>{formatValue(row.target, row.unit)}</td><td><span className={`exec-pill ${row.status}`}>{row.status}</span></td></tr>)}</tbody></ExecTable>
        </ExecPanel>
        <ExecPanel title="Risk Alerts">
          <div className="exec-list">{visibleAlerts.length ? visibleAlerts.slice(0, 8).map((row: any) => <div className="exec-alert-row" key={row.id || row.riskAlertId}><button type="button" onClick={() => setSelectedDetail(row)}><span><strong>{row.alertType || row.title || "Risk alert"}</strong><small>{row.severity || row.riskLevel || "OPEN"} · {row.status || "OPEN"}</small></span><AlertTriangle size={18} /></button><button type="button" className="exec-alert-ack" onClick={() => void acknowledgeAlert(row)} disabled={saving}>Acknowledge</button></div>) : <p>No matching risk alerts.</p>}</div>
        </ExecPanel>
        <ExecPanel title="Ward And Operations Snapshot">
          <div className="exec-snapshot"><div><Bed size={18} /><span>Occupied beds</span><strong>{dashboard?.operational?.bedsOccupied || 0}/{dashboard?.operational?.bedsTotal || 0}</strong></div><div><Activity size={18} /><span>Lab orders</span><strong>{dashboard?.operational?.labTurnaroundProxy || 0}</strong></div><div><CheckCircle2 size={18} /><span>Theatre cases</span><strong>{dashboard?.operational?.otUtilizationRate || 0}</strong></div></div>
        </ExecPanel>
        <ExecPanel title="Selected Detail">
          {selectedDetail ? <DetailView record={selectedDetail} /> : <p className="exec-note">Click a KPI table row, pie legend item, or risk alert to view details.</p>}
        </ExecPanel>
        <ExecPanel title="Immutable Snapshots">
          <div className="exec-list">{snapshots.length ? snapshots.slice(0, 6).map((row: any) => <button type="button" key={row.snapshotId} onClick={() => setSelectedDetail(row)}><span><strong>{row.dashboardId || "Executive snapshot"}</strong><small>{new Date(row.capturedAt || row.createdAt).toLocaleString()} · {row.role || "Executive"}</small></span><CheckCircle2 size={18} /></button>) : <p>No snapshots captured yet.</p>}</div>
        </ExecPanel>
      </section>

      {modal === "widget" ? <ExecModal title="Add Executive Widget" onClose={() => setModal("")}><form className="exec-form" onSubmit={addWidget}><label><span>KPI widget</span><select value={widgetForm.id} onChange={(event) => { const item = widgetCatalog.find((row) => row.id === event.target.value) || widgetCatalog[0]; setWidgetForm((f) => ({ ...f, id: item.id, title: item.title, category: item.category, kpiKey: item.kpiKey })); }}>{widgetCatalog.map((row) => <option value={row.id} key={row.id}>{row.title}</option>)}</select></label><label><span>Size</span><select value={widgetForm.size} onChange={(event) => setWidgetForm((f) => ({ ...f, size: event.target.value }))}><option value="small">Small</option><option value="medium">Medium</option><option value="large">Large</option></select></label><label><span>Period</span><select value={widgetForm.period} onChange={(event) => setWidgetForm((f) => ({ ...f, period: event.target.value }))}><option value="today">Today</option><option value="week">This week</option><option value="month">This month</option><option value="custom">Custom range</option></select></label><label><span>Refresh minutes</span><input type="number" min={1} value={widgetForm.refreshMinutes} onChange={(event) => setWidgetForm((f) => ({ ...f, refreshMinutes: Number(event.target.value || 5) }))} /></label><footer><button type="button" onClick={() => setModal("")}>Cancel</button><button type="submit">Add Widget</button></footer></form></ExecModal> : null}

      {notice ? <div className={`exec-toast ${notice.tone}`} role="status"><i>{notice.tone === "error" || notice.tone === "warning" ? <AlertTriangle size={19} /> : <CheckCircle2 size={19} />}</i><div><strong>{notice.tone === "error" ? "Error" : notice.tone === "warning" ? "Attention" : "Done"}</strong><span>{notice.text}</span></div><button type="button" onClick={() => setNotice(null)} aria-label="Dismiss notification"><X size={16} /></button></div> : null}
      {loading ? <div className="exec-loading">Loading executive KPIs...</div> : null}
    </main>
  );
}

function buildKpiValues(dashboard: any): Record<string, number | null> {
  const financial = dashboard?.financial || {};
  const clinical = dashboard?.clinical || {};
  const operational = dashboard?.operational || {};
  const workforce = dashboard?.workforce || {};
  const billing = Number(financial.totalRevenue || 0);
  const collections = Number(financial.totalPaid || 0);
  return {
    bedOccupancyRate: Number(operational.bedOccupancyRate || dashboard?.topRow?.occupancyRate || 0),
    averageLengthOfStay: Number(clinical.alos || 0),
    surgeryCompletionRate: clinical.surgeryCompletionRate == null ? null : Number(clinical.surgeryCompletionRate),
    medicationErrorRate: clinical.medicationErrorRate == null ? null : Number(clinical.medicationErrorRate),
    patientSatisfaction: clinical.patientSatisfaction == null ? null : Number(clinical.patientSatisfaction),
    mortalityRate: clinical.mortalityRate == null && dashboard?.topRow?.mortalityRate == null ? null : Number(clinical.mortalityRate ?? dashboard?.topRow?.mortalityRate),
    dailyRevenue: financial.totalPaid == null && dashboard?.topRow?.revenue == null ? null : Number(financial.totalPaid ?? dashboard?.topRow?.revenue),
    collectionsVsBilling: billing > 0 ? Number(((collections / billing) * 100).toFixed(1)) : 0,
    accountsReceivable: financial.daysInAr == null ? null : Number(financial.daysInAr),
    costPerPatientDay: financial.costPerPatientDay == null ? null : Number(financial.costPerPatientDay),
    pharmacyMargin: financial.pharmacyMargin == null ? null : Number(financial.pharmacyMargin),
    queueWaitTimes: operational.queueWaitMinutes == null ? null : Number(operational.queueWaitMinutes),
    labTurnaroundTimes: operational.labTurnaroundProxy == null ? null : Number(operational.labTurnaroundProxy),
    theatreUtilisation: operational.otUtilizationRate == null ? null : Number(operational.otUtilizationRate),
    bedAvailability: Math.max(0, Number(operational.bedsTotal || 0) - Number(operational.bedsOccupied || 0)),
    staffingLevels: Number(workforce.activeStaff || 0) > 0 && Number(workforce.staffTotal || 0) > 0 ? Number(((Number(workforce.activeStaff) / Number(workforce.staffTotal)) * 100).toFixed(1)) : 0,
  };
}

function kpiStatus(value: number | null, target: number, direction: string) {
  if (value == null || !Number.isFinite(value)) return "grey";
  if (!target) return "yellow";
  if (direction === "lower") {
    if (value <= target) return "green";
    if (value <= target * 1.25) return "yellow";
    return "red";
  }
  if (value >= target) return "green";
  if (value >= target * 0.85) return "yellow";
  return "red";
}

function formatValue(value: unknown, unit?: string) {
  if (value === null || value === undefined || value === "") return "Unknown";
  const n = Number(value || 0);
  if (unit === "KES") return `KES ${n.toLocaleString("en-KE", { maximumFractionDigits: 0 })}`;
  if (unit) return `${n.toLocaleString("en-KE", { maximumFractionDigits: 1 })} ${unit}`;
  return n.toLocaleString("en-KE");
}

function pieGradient(parts: Array<{ value: number; color: string }>) {
  const total = parts.reduce((sum, row) => sum + Math.max(0, Number(row.value || 0)), 0);
  if (!total) return "#e2e8f0 0% 100%";
  let cursor = 0;
  return parts.map((row) => {
    const start = cursor;
    const end = start + (Math.max(0, Number(row.value || 0)) / total) * 100;
    cursor = end;
    return `${row.color} ${start}% ${end}%`;
  }).join(", ");
}

function ExecPanel({ title, children }: { title: string; children: ReactNode }) {
  return <section className="exec-panel"><header><h2>{title}</h2></header>{children}</section>;
}

function DetailView({ record }: { record: Record<string, any> }) {
  return <dl className="exec-detail">{Object.entries(record || {}).slice(0, 18).map(([key, value]) => {
    const nested = value && typeof value === "object" && !Array.isArray(value);
    const items = nested ? Object.entries(value).slice(0, 12) : [];
    return <div className={nested ? "exec-detail-group" : ""} key={key}><dt>{detailLabel(key)}</dt>{nested ? <dd className="exec-detail-nested">{items.map(([childKey, childValue]) => <span key={childKey}><b>{detailLabel(childKey)}</b>{formatDetailValue(childValue)}</span>)}</dd> : <dd>{formatDetailValue(value)}</dd>}</div>;
  })}</dl>;
}

function detailLabel(value: string) {
  return value.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ").replace(/^./, (char) => char.toUpperCase());
}

function formatDetailValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "Unknown";
  if (Array.isArray(value)) return `${value.length} records`;
  if (typeof value === "object") return `${Object.keys(value as object).length} fields`;
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}

function ExecTable({ children }: { children: ReactNode }) {
  const tableId = useId();
  const [expanded, setExpanded] = useState(false);
  useEffect(() => {
    const collapse = (event: Event) => { const id = (event as CustomEvent<{ id?: string }>).detail?.id; if (id !== tableId) setExpanded(false); };
    window.addEventListener("hmis:executive-table-expanded", collapse);
    return () => window.removeEventListener("hmis:executive-table-expanded", collapse);
  }, [tableId]);
  const toggle = () => { const next = !expanded; if (next) window.dispatchEvent(new CustomEvent("hmis:executive-table-expanded", { detail: { id: tableId } })); setExpanded(next); };
  return <div className={`exec-table-wrap ${expanded ? "is-exec-table-expanded" : ""}`}><button type="button" className="exec-table-expand-btn" onClick={toggle} aria-label={expanded ? "Collapse table" : "Expand table"} title={expanded ? "Collapse table" : "Expand table"}>{expanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}</button><table className="exec-table">{children}</table></div>;
}

function ExecModal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return <div className="exec-modal-backdrop"><section className="exec-modal"><header><div><span>Executive Dashboard</span><h2>{title}</h2></div><button type="button" onClick={onClose} aria-label="Close form"><X size={18} /></button></header>{children}</section></div>;
}

export { AnalyticsDashboard as AnalyticsView };
