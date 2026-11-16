// Ported from Medilink-Frontend/src/app/ict/page.tsx for desktop parity.
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  CalendarClock,
  CheckCircle2,
  CloudCog,
  DatabaseBackup,
  FileWarning,
  HardDrive,
  LockKeyhole,
  MonitorCog,
  RefreshCw,
  Send,
  Server,
  ShieldAlert,
  Siren,
  Wrench,
} from "lucide-react";
import { api } from "../lib/api";
import { useLiveRefresh } from "../lib/liveRefresh";

const rowsOf = (value: any) => {
  const data = value?.data ?? value;
  if (Array.isArray(data)) return data;
  for (const candidate of [data?.items, data?.rows, data?.results]) {
    if (Array.isArray(candidate)) return candidate;
  }
  return [];
};
const unwrap = (value: any) => value?.data ?? value ?? {};
const pretty = (value: any) => String(value || "").replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
const listText = (value: any) => Array.isArray(value) ? value.join(", ") : String(value || "");
const dateTime = (value: any) => {
  const date = new Date(String(value || ""));
  if (!Number.isFinite(date.getTime())) return "Not recorded";
  return date.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
};
const tone = (message: string) => (/failed|breach|critical|overdue|danger|error/i.test(message) ? "warning" : "success");

export default function IctView() {
  const [dashboard, setDashboard] = useState<any>({});
  const [health, setHealth] = useState<any[]>([]);
  const [backups, setBackups] = useState<any>({});
  const [backupLogs, setBackupLogs] = useState<any[]>([]);
  const [siem, setSiem] = useState<any[]>([]);
  const [securityEvents, setSecurityEvents] = useState<any[]>([]);
  const [vulnDashboard, setVulnDashboard] = useState<any>({});
  const [vulnerabilities, setVulnerabilities] = useState<any[]>([]);
  const [drPlans, setDrPlans] = useState<any[]>([]);
  const [drTests, setDrTests] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [licenses, setLicenses] = useState<any[]>([]);
  const [maintenanceWindows, setMaintenanceWindows] = useState<any[]>([]);
  const [vulnerabilityExceptions, setVulnerabilityExceptions] = useState<any[]>([]);
  const [penetrationTests, setPenetrationTests] = useState<any[]>([]);
  const [patches, setPatches] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [downtimeEvents, setDowntimeEvents] = useState<any[]>([]);
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState("");
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("HEALTH");

  const [healthForm, setHealthForm] = useState({ serverName: "postgres-primary", cpuUsagePercent: "42", memoryUsagePercent: "58", diskUsagePercent: "74", bandwidthUsagePercent: "41", dbConnectionCount: "190", dbConnectionMax: "300" });
  const [backupForm, setBackupForm] = useState({ backupJobId: "", backupScope: "DATABASE", backupStatus: "SUCCESS", backupLocation: "s3://medilink-backups/database", backupSizeMb: "2048", restoreTested: false });
  const [siemForm, setSiemForm] = useState({ source: "AUTH", logType: "FAILED_LOGIN", userId: "", ipAddress: "10.0.0.12", recordCount: "", tableName: "", query: "" });
  const [vulnForm, setVulnForm] = useState({ title: "", severity: "HIGH", assetName: "app-server-01", description: "", remediationAction: "" });
  const [drForm, setDrForm] = useState({ componentId: "BILLING", componentName: "Billing Module", rtoMinutes: "60", rpoMinutes: "15", actualRecoveryMinutes: "45", actualDataLossMinutes: "5", issuesEncountered: "", lessonsLearned: "" });
  const [drPlanForm, setDrPlanForm] = useState({ componentId: "BILLING", componentName: "Billing Module", responsiblePerson: "ICT Manager", rtoMinutes: "60", rpoMinutes: "15", recoverySteps: "" });
  const [assetForm, setAssetForm] = useState({ assetName: "", assetType: "APPLICATION_SERVER", ipAddress: "", location: "", criticality: "HIGH", status: "ACTIVE", notes: "" });
  const [incidentForm, setIncidentForm] = useState({ incidentTitle: "", description: "", category: "AVAILABILITY", severity: "HIGH", assignedTo: "", status: "OPEN", downtimeMinutes: "0" });
  const [restoreForm, setRestoreForm] = useState({ backupJobId: "", scope: "DATABASE", success: true, durationMinutes: "", integrityPassed: true, issues: "" });
  const [licenseForm, setLicenseForm] = useState({ licenseId: "", softwareName: "", vendor: "", totalSeats: "1", expiryDate: "", renewalReminderDays: "30" });

  const setToast = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice((current) => (current === message ? "" : current)), 6500);
  };

  const toggleForm = (event: any) => {
    const button = event.currentTarget as HTMLButtonElement;
    const form = button.closest(".ict-card-form") as HTMLElement | null;
    if (!form) return;
    const collapsed = form.classList.toggle("is-collapsed");
    button.textContent = collapsed ? "+" : "−";
    button.setAttribute("aria-expanded", String(!collapsed));
    button.setAttribute("aria-label", collapsed ? "Expand form" : "Collapse form");
  };

  const load = async () => {
    setLoading(true);
    const failed: string[] = [];
    const safeGet = async (label: string, url: string, fallback: any) => {
      try { return (await api.get(url)).data; } catch (error: any) {
        failed.push(`${label}${error?.response?.status ? ` (${error.response.status})` : ""}`);
        return fallback;
      }
    };
    try {
      const [dashboardData, healthData, backupData, backupLogsData, siemData, securityEventsData, vulnDashboardData, vulnerabilitiesData, drPlansData, drTestsData, assetsData, incidentsData, licensesData, maintenanceData, exceptionsData, penetrationData, patchesData, certificatesData, downtimeData] = await Promise.all([
        safeGet("dashboard", "/ict/dashboard", {}),
        safeGet("health history", "/ict/health-history?limit=120", []),
        safeGet("backup dashboard", "/ict/backups/dashboard", {}),
        safeGet("backup logs", "/ict/backup-logs?limit=120", []),
        safeGet("SIEM detections", "/ict/siem/detections?limit=80", []),
        safeGet("security events", "/ict/security-events?limit=80", []),
        safeGet("vulnerability dashboard", "/ict/vulnerabilities/dashboard", {}),
        safeGet("vulnerabilities", "/ict/vulnerabilities?limit=120", []),
        safeGet("DR plans", "/ict/dr/plans?limit=80", []),
        safeGet("DR tests", "/ict/dr/tests?limit=80", []),
        safeGet("assets", "/ict/assets?limit=200", []),
        safeGet("incidents", "/ict/incidents?limit=120", []),
        safeGet("software licenses", "/ict/licenses?limit=120", []),
        safeGet("maintenance windows", "/ict/maintenance-windows?limit=120", []),
        safeGet("risk exceptions", "/ict/vulnerabilities/exceptions?limit=120", []),
        safeGet("penetration tests", "/ict/penetration-tests?limit=120", []),
        safeGet("patches", "/ict/patches?limit=120", []),
        safeGet("certificates", "/ict/certificates?limit=120", []),
        safeGet("downtime events", "/ict/downtime-events?limit=120", []),
      ]);
      setDashboard(unwrap(dashboardData));
      setHealth(rowsOf(healthData));
      setBackups(unwrap(backupData));
      setBackupLogs(rowsOf(backupLogsData));
      setSiem(rowsOf(siemData));
      setSecurityEvents(rowsOf(securityEventsData));
      setVulnDashboard(unwrap(vulnDashboardData));
      setVulnerabilities(rowsOf(vulnerabilitiesData));
      setDrPlans(rowsOf(drPlansData));
      setDrTests(rowsOf(drTestsData));
      setAssets(rowsOf(assetsData));
      setIncidents(rowsOf(incidentsData));
      setLicenses(rowsOf(licensesData));
      setMaintenanceWindows(rowsOf(maintenanceData));
      setVulnerabilityExceptions(rowsOf(exceptionsData));
      setPenetrationTests(rowsOf(penetrationData));
      setPatches(rowsOf(patchesData));
      setCertificates(rowsOf(certificatesData));
      setDowntimeEvents(rowsOf(downtimeData));
      if (failed.length) setToast(`${failed.length} ICT data source${failed.length === 1 ? "" : "s"} could not be loaded: ${failed.join(", ")}.`);
    } catch (error: any) {
      setToast(error?.response?.data?.message || "ICT operations data could not be loaded.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);
  useLiveRefresh(load, { intervalMs: 45000 });

  const post = async (key: string, request: Promise<any>, success: string) => {
    setSaving(key);
    try {
      await request;
      setToast(success);
      await load();
    } catch (error: any) {
      setToast(error?.response?.data?.message || "Operation failed.");
    } finally {
      setSaving("");
    }
  };

  const submitHealth = (event: FormEvent) => {
    event.preventDefault();
    void post("health", api.post("/ict/monitoring-logs", {
      ...healthForm,
      thresholds: { diskUsagePercent: 80, dbConnectionCount: 250, dbConnectionMax: Number(healthForm.dbConnectionMax || 300) },
    }), "Infrastructure health snapshot posted and thresholds evaluated.");
  };

  const submitBackup = (event: FormEvent) => {
    event.preventDefault();
    void post("backup", api.post("/ict/backup-logs", {
      ...backupForm,
      backupJobId: backupForm.backupJobId || `BKP-${Date.now()}`,
      restoreTested: backupForm.restoreTested,
    }), "Backup result posted to ICT operations.");
  };

  const submitSiem = (event: FormEvent) => {
    event.preventDefault();
    void post("siem", api.post("/ict/siem/logs", siemForm), "SIEM log ingested and analysed.");
  };

  const submitVulnerability = (event: FormEvent) => {
    event.preventDefault();
    void post("vulnerability", api.post("/ict/vulnerabilities", vulnForm), "Vulnerability finding recorded with SLA.");
  };

  const submitDr = (event: FormEvent) => {
    event.preventDefault();
    void post("dr", api.post("/ict/dr/tests", drForm), "DR test recorded and objectives checked.");
  };

  const submitDrPlan = (event: FormEvent) => {
    event.preventDefault();
    void post("dr-plan", api.post("/ict/dr/plans", { ...drPlanForm, rtoMinutes: Number(drPlanForm.rtoMinutes || 60), rpoMinutes: Number(drPlanForm.rpoMinutes || 15), recoverySteps: drPlanForm.recoverySteps.split("\n").map((step) => step.trim()).filter(Boolean) }), "DR recovery plan saved.");
  };

  const submitAsset = (event: FormEvent) => {
    event.preventDefault();
    void post("asset", api.post("/ict/assets", assetForm), "ICT asset registered for monitoring.");
  };

  const submitIncident = (event: FormEvent) => {
    event.preventDefault();
    void post("incident", api.post("/ict/incidents", { ...incidentForm, downtimeMinutes: Number(incidentForm.downtimeMinutes || 0) }), "Operational incident recorded and assigned for response.");
  };

  const submitRestore = (event: FormEvent) => {
    event.preventDefault();
    void post("restore", api.post("/ict/backups/restore-tests", { ...restoreForm, durationMinutes: restoreForm.durationMinutes ? Number(restoreForm.durationMinutes) : undefined }), "Backup restoration verification recorded.");
  };

  const submitLicense = (event: FormEvent) => {
    event.preventDefault();
    void post("license", api.post("/ict/licenses", { ...licenseForm, totalSeats: Number(licenseForm.totalSeats || 0) }), "Software license recorded for expiry monitoring.");
  };

  const totals = dashboard?.totals || dashboard || {};
  const vulnTotals = vulnDashboard?.totals || {};
  const stats = [
    { label: "Assets", value: totals.totalAssets || 0, icon: Server, color: "#2563eb" },
    { label: "Health Alerts", value: totals.activeAlerts || 0, icon: BarChart3, color: "#d97706" },
    { label: "Backup Failures", value: totals.failedBackups || 0, icon: DatabaseBackup, color: "#dc2626" },
    { label: "SIEM Alerts", value: totals.unresolvedSecurityEvents || siem.length, icon: ShieldAlert, color: "#7c3aed" },
    { label: "Overdue Vulns", value: vulnTotals.overdue || totals.overdueVulnerabilities || 0, icon: LockKeyhole, color: "#b91c1c" },
    { label: "DR Breaches", value: totals.drBreaches || drTests.filter((row) => row.rtoBreached || row.rpoBreached).length, icon: Siren, color: "#0f766e" },
  ];

  const currentRows = useMemo(() => {
    if (tab === "ASSETS") return assets.map((row) => ({ title: row.assetName || row.assetId, status: row.status, detail: `${pretty(row.assetType)}${row.ipAddress ? ` · ${row.ipAddress}` : ""}`, meta: row.location || "No location recorded" }));
    if (tab === "INCIDENTS") return incidents.map((row) => ({ title: row.incidentTitle || row.incidentCode, status: row.severity || row.status, detail: row.description, meta: `${pretty(row.status)}${row.assignedTo ? ` · ${row.assignedTo}` : ""}` }));
    if (tab === "LICENSES") return licenses.map((row) => ({ title: row.softwareName || row.licenseId, status: row.status, detail: row.vendor || "No vendor recorded", meta: row.expiryDate ? `Expires ${dateTime(row.expiryDate)}` : "No expiry date" }));
    if (tab === "RESTORE") return backupLogs.filter((row) => row.restoreTested).map((row) => ({ title: row.backupJobId, status: row.backupStatus, detail: `${pretty(row.backupScope)} · ${row.backupLocation}`, meta: row.restoreTestDate ? `Tested ${dateTime(row.restoreTestDate)}` : "Restore test pending" }));
    if (tab === "SECURITY") return securityEvents.map((row) => ({ title: pretty(row.eventType || row.eventName || row.action), status: row.severity || row.status || "DETECTED", detail: row.message || row.notes || row.description || "Security event detected", meta: dateTime(row.occurredAt || row.eventTime || row.createdAt) }));
    if (tab === "MAINTENANCE") return maintenanceWindows.map((row) => ({ title: row.title, status: row.status, detail: listText(row.systems), meta: `${dateTime(row.startAt)} – ${dateTime(row.endAt)}` }));
    if (tab === "RISK") return vulnerabilityExceptions.map((row) => ({ title: row.findingId, status: row.status, detail: row.businessJustification, meta: `Expires ${dateTime(row.expiresAt)}` }));
    if (tab === "PENTEST") return penetrationTests.map((row) => ({ title: row.scope, status: row.status, detail: pretty(row.testType), meta: `${row.findings || 0} findings · ${row.tester || "Tester not recorded"}` }));
    if (tab === "PATCHES") return patches.map((row) => ({ title: row.asset, status: row.deploymentResult, detail: row.patch, meta: `${pretty(row.testingStatus)} · ${pretty(row.severity)}` }));
    if (tab === "CERTIFICATES") return certificates.map((row) => ({ title: row.name, status: row.status, detail: row.endpoint || pretty(row.kind), meta: `Expires ${dateTime(row.expiresAt)}` }));
    if (tab === "DOWNTIME") return downtimeEvents.map((row) => ({ title: row.title, status: row.status, detail: listText(row.systems), meta: row.reconciliationStatus || "Reconciliation pending" }));
    if (tab === "BACKUPS") return (backups.byScope || []).map((row: any) => ({ title: row.scope, status: row.latest?.backupStatus || "NO DATA", detail: row.latestSuccess ? `Last success ${dateTime(row.latestSuccess.backupTime)}` : "No successful backup", meta: row.latestVerification?.status || "Verification pending" }));
    if (tab === "SIEM") return siem.map((row) => ({ title: pretty(row.eventType), status: row.severity, detail: row.message, meta: row.automatedResponse }));
    if (tab === "VULNS") return vulnerabilities.map((row) => ({ title: row.title, status: row.severity, detail: row.assetName || row.assetId, meta: row.overdue ? "Overdue" : pretty(row.status) }));
    if (tab === "DR") return drTests.map((row) => ({ title: row.componentName, status: row.status, detail: `RTO ${row.actualRecoveryMinutes}/${row.rtoMinutes}m | RPO ${row.actualDataLossMinutes}/${row.rpoMinutes}m`, meta: row.remediationRequired ? "Remediation required" : "Passed" }));
    return health.map((row) => ({ title: row.serverName || row.asset?.assetName || "Infrastructure component", status: row.alertType === "NONE" ? "HEALTHY" : row.alertType, detail: `CPU ${row.cpuUsagePercent || 0}% | RAM ${row.memoryUsagePercent || 0}% | Disk ${row.diskUsagePercent || 0}%`, meta: dateTime(row.monitorTime) }));
  }, [tab, backups, backupLogs, siem, securityEvents, vulnerabilities, drTests, health, assets, incidents, licenses, maintenanceWindows, vulnerabilityExceptions, penetrationTests, patches, certificates, downtimeEvents]);

  return (
    <main className="ict-page">
      <header className="ict-header ict-module-header">
        <div className="ict-module-title">
          <div className="ict-module-title-mark" aria-hidden="true"><MonitorCog size={22} /></div>
          <div><h1>ICT &amp; Security Operations</h1><p>Infrastructure health, backup assurance, SIEM monitoring, vulnerability response, and disaster recovery operations.</p></div>
        </div>
        <div className="ict-module-actions">
          <button className="ict-module-btn ghost" type="button" onClick={() => void load()} disabled={loading}><RefreshCw size={17} /> Refresh</button>
        </div>
      </header>

      {notice ? (
        <div className={`ict-toast ${tone(notice)}`} role="status" aria-live="polite">
          <div className="ict-toast-icon">{tone(notice) === "warning" ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}</div>
          <div className="ict-toast-copy"><strong>{tone(notice) === "warning" ? "Attention required" : "Operation complete"}</strong><span>{notice}</span></div>
          <button type="button" onClick={() => setNotice("")} aria-label="Dismiss notification">×</button>
        </div>
      ) : null}

      <section className="ict-stats">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return <article key={stat.label} style={{ borderLeftColor: stat.color }}><div><span>{stat.label}</span><strong>{stat.value}</strong></div><Icon size={20} style={{ color: stat.color }} /></article>;
        })}
      </section>

      <section className="ict-tabs">
        {["HEALTH", "ASSETS", "BACKUPS", "RESTORE", "SIEM", "SECURITY", "VULNS", "RISK", "INCIDENTS", "LICENSES", "CERTIFICATES", "PATCHES", "PENTEST", "MAINTENANCE", "DOWNTIME", "DR"].map((item) => <button type="button" className={tab === item ? "active" : ""} key={item} onClick={() => setTab(item)}>{pretty(item)}</button>)}
      </section>

      <section className="ict-grid">
        <div className="ict-panel">
          <div className="ict-title"><CloudCog size={18} /><div><h2>{pretty(tab)} Operations</h2><p>{currentRows.length} records in view.</p></div></div>
          <div className="ict-list">
            {currentRows.length ? currentRows.slice(0, 18).map((row: any, index: number) => (
              <article className={/critical|failed|overdue|breach|danger/i.test(String(row.status) + row.meta) ? "danger" : ""} key={`${row.title}-${index}`}>
                <span><strong>{row.title}</strong><em>{pretty(row.status)}</em></span>
                <small>{row.detail || "No detail recorded"}</small>
                <small>{row.meta || "No metadata"}</small>
              </article>
            )) : <div className="ict-empty">No ICT operations records yet.</div>}
          </div>
        </div>

        <div className="ict-side">
          <form className="ict-card-form is-collapsed" onSubmit={submitHealth}>
            <h2><HardDrive size={17} /> Health Snapshot <button type="button" className="ict-form-collapse" onClick={toggleForm} aria-expanded="false" aria-label="Expand form">+</button></h2>
            <label>Server<input value={healthForm.serverName} onChange={(e) => setHealthForm({ ...healthForm, serverName: e.target.value })} /></label>
            <div className="ict-form-row">
              <label>CPU %<input value={healthForm.cpuUsagePercent} onChange={(e) => setHealthForm({ ...healthForm, cpuUsagePercent: e.target.value })} /></label>
              <label>Disk %<input value={healthForm.diskUsagePercent} onChange={(e) => setHealthForm({ ...healthForm, diskUsagePercent: e.target.value })} /></label>
            </div>
            <label>DB Connections<input value={healthForm.dbConnectionCount} onChange={(e) => setHealthForm({ ...healthForm, dbConnectionCount: e.target.value })} /></label>
            <button type="submit" disabled={saving === "health"}><Send size={15} /> Post Health</button>
          </form>

          <form className="ict-card-form is-collapsed" onSubmit={submitBackup}>
            <h2><DatabaseBackup size={17} /> Backup Result <button type="button" className="ict-form-collapse" onClick={toggleForm} aria-expanded="false" aria-label="Expand form">+</button></h2>
            <div className="ict-form-row">
              <label>Scope<select value={backupForm.backupScope} onChange={(e) => setBackupForm({ ...backupForm, backupScope: e.target.value })}><option>DATABASE</option><option>PACS</option><option>CONFIGURATION</option></select></label>
              <label>Status<select value={backupForm.backupStatus} onChange={(e) => setBackupForm({ ...backupForm, backupStatus: e.target.value })}><option>SUCCESS</option><option>FAILED</option><option>PARTIAL</option></select></label>
            </div>
            <label>Destination<input value={backupForm.backupLocation} onChange={(e) => setBackupForm({ ...backupForm, backupLocation: e.target.value })} /></label>
            <button type="submit" disabled={saving === "backup"}><Send size={15} /> Post Backup</button>
          </form>

          <form className="ict-card-form is-collapsed" onSubmit={submitSiem}>
            <h2><ShieldAlert size={17} /> SIEM Log <button type="button" className="ict-form-collapse" onClick={toggleForm} aria-expanded="false" aria-label="Expand form">+</button></h2>
            <div className="ict-form-row">
              <label>Type<select value={siemForm.logType} onChange={(e) => setSiemForm({ ...siemForm, logType: e.target.value })}><option>FAILED_LOGIN</option><option>DATA_DOWNLOAD</option><option>ADMIN_CREATED</option><option>DB_QUERY</option></select></label>
              <label>IP<input value={siemForm.ipAddress} onChange={(e) => setSiemForm({ ...siemForm, ipAddress: e.target.value })} /></label>
            </div>
            <label>User<input value={siemForm.userId} onChange={(e) => setSiemForm({ ...siemForm, userId: e.target.value })} /></label>
            <button type="submit" disabled={saving === "siem"}><Send size={15} /> Analyse Log</button>
          </form>

          <form className="ict-card-form is-collapsed" onSubmit={submitVulnerability}>
            <h2><LockKeyhole size={17} /> Vulnerability <button type="button" className="ict-form-collapse" onClick={toggleForm} aria-expanded="false" aria-label="Expand form">+</button></h2>
            <label>Title<input value={vulnForm.title} onChange={(e) => setVulnForm({ ...vulnForm, title: e.target.value })} placeholder="CVE or scanner finding" /></label>
            <div className="ict-form-row">
              <label>Severity<select value={vulnForm.severity} onChange={(e) => setVulnForm({ ...vulnForm, severity: e.target.value })}><option>CRITICAL</option><option>HIGH</option><option>MEDIUM</option><option>LOW</option></select></label>
              <label>Asset<input value={vulnForm.assetName} onChange={(e) => setVulnForm({ ...vulnForm, assetName: e.target.value })} /></label>
            </div>
            <button type="submit" disabled={saving === "vulnerability"}><Send size={15} /> Record Finding</button>
          </form>

          <form className="ict-card-form is-collapsed" onSubmit={submitDr}>
            <h2><Siren size={17} /> DR Test <button type="button" className="ict-form-collapse" onClick={toggleForm} aria-expanded="false" aria-label="Expand form">+</button></h2>
            <label>Component<input value={drForm.componentName} onChange={(e) => setDrForm({ ...drForm, componentName: e.target.value })} /></label>
            <div className="ict-form-row">
              <label>Actual RTO<input value={drForm.actualRecoveryMinutes} onChange={(e) => setDrForm({ ...drForm, actualRecoveryMinutes: e.target.value })} /></label>
              <label>Actual RPO<input value={drForm.actualDataLossMinutes} onChange={(e) => setDrForm({ ...drForm, actualDataLossMinutes: e.target.value })} /></label>
            </div>
            <button type="submit" disabled={saving === "dr"}><CheckCircle2 size={15} /> Record DR Test</button>
          </form>

          <form className="ict-card-form is-collapsed" onSubmit={submitDrPlan}>
            <h2><Siren size={17} /> DR Recovery Plan <button type="button" className="ict-form-collapse" onClick={toggleForm} aria-expanded="false" aria-label="Expand form">+</button></h2>
            <div className="ict-form-row"><label>Component ID<input required value={drPlanForm.componentId} onChange={(e) => setDrPlanForm({ ...drPlanForm, componentId: e.target.value })} /></label><label>Owner<input value={drPlanForm.responsiblePerson} onChange={(e) => setDrPlanForm({ ...drPlanForm, responsiblePerson: e.target.value })} /></label></div>
            <label>System name<input required value={drPlanForm.componentName} onChange={(e) => setDrPlanForm({ ...drPlanForm, componentName: e.target.value })} /></label>
            <div className="ict-form-row"><label>Target RTO (min)<input type="number" min="1" value={drPlanForm.rtoMinutes} onChange={(e) => setDrPlanForm({ ...drPlanForm, rtoMinutes: e.target.value })} /></label><label>Target RPO (min)<input type="number" min="0" value={drPlanForm.rpoMinutes} onChange={(e) => setDrPlanForm({ ...drPlanForm, rpoMinutes: e.target.value })} /></label></div>
            <label>Recovery steps<textarea rows={2} value={drPlanForm.recoverySteps} onChange={(e) => setDrPlanForm({ ...drPlanForm, recoverySteps: e.target.value })} placeholder="One step per line" /></label>
            <button type="submit" disabled={saving === "dr-plan"}><CheckCircle2 size={15} /> Save DR Plan</button>
          </form>

          <form className="ict-card-form is-collapsed" onSubmit={submitAsset}>
            <h2><MonitorCog size={17} /> Asset Inventory <button type="button" className="ict-form-collapse" onClick={toggleForm} aria-expanded="false" aria-label="Expand form">+</button></h2>
            <label>Asset name<input required value={assetForm.assetName} onChange={(e) => setAssetForm({ ...assetForm, assetName: e.target.value })} placeholder="API server, PACS, gateway..." /></label>
            <div className="ict-form-row">
              <label>Type<select value={assetForm.assetType} onChange={(e) => setAssetForm({ ...assetForm, assetType: e.target.value })}><option>APPLICATION_SERVER</option><option>DATABASE_SERVER</option><option>NETWORK_GATEWAY</option><option>STORAGE</option><option>PACS</option><option>EXTERNAL_ENDPOINT</option></select></label>
              <label>Status<select value={assetForm.status} onChange={(e) => setAssetForm({ ...assetForm, status: e.target.value })}><option>ACTIVE</option><option>UNDER_MAINTENANCE</option><option>DECOMMISSIONED</option></select></label>
            </div>
            <div className="ict-form-row"><label>IP / host<input value={assetForm.ipAddress} onChange={(e) => setAssetForm({ ...assetForm, ipAddress: e.target.value })} /></label><label>Location<input value={assetForm.location} onChange={(e) => setAssetForm({ ...assetForm, location: e.target.value })} /></label></div>
            <button type="submit" disabled={saving === "asset"}><Send size={15} /> Register Asset</button>
          </form>

          <form className="ict-card-form is-collapsed" onSubmit={submitIncident}>
            <h2><AlertTriangle size={17} /> Operational Incident <button type="button" className="ict-form-collapse" onClick={toggleForm} aria-expanded="false" aria-label="Expand form">+</button></h2>
            <label>Incident title<input required value={incidentForm.incidentTitle} onChange={(e) => setIncidentForm({ ...incidentForm, incidentTitle: e.target.value })} placeholder="Service outage or degradation" /></label>
            <label>Description<textarea required rows={2} value={incidentForm.description} onChange={(e) => setIncidentForm({ ...incidentForm, description: e.target.value })} /></label>
            <div className="ict-form-row"><label>Severity<select value={incidentForm.severity} onChange={(e) => setIncidentForm({ ...incidentForm, severity: e.target.value })}><option>CRITICAL</option><option>HIGH</option><option>MEDIUM</option><option>LOW</option></select></label><label>Downtime (min)<input type="number" min="0" value={incidentForm.downtimeMinutes} onChange={(e) => setIncidentForm({ ...incidentForm, downtimeMinutes: e.target.value })} /></label></div>
            <button type="submit" disabled={saving === "incident"}><Siren size={15} /> Record Incident</button>
          </form>

          <form className="ict-card-form is-collapsed" onSubmit={submitRestore}>
            <h2><DatabaseBackup size={17} /> Restore Verification <button type="button" className="ict-form-collapse" onClick={toggleForm} aria-expanded="false" aria-label="Expand form">+</button></h2>
            <label>Backup job ID<input required value={restoreForm.backupJobId} onChange={(e) => setRestoreForm({ ...restoreForm, backupJobId: e.target.value })} placeholder="Select or enter a backup job" /></label>
            <div className="ict-form-row"><label>Scope<select value={restoreForm.scope} onChange={(e) => setRestoreForm({ ...restoreForm, scope: e.target.value })}><option>DATABASE</option><option>PACS</option><option>CONFIGURATION</option></select></label><label>Result<select value={restoreForm.success ? "PASSED" : "FAILED"} onChange={(e) => setRestoreForm({ ...restoreForm, success: e.target.value === "PASSED" })}><option value="PASSED">RESTORE VERIFIED</option><option value="FAILED">RESTORE FAILED</option></select></label></div>
            <label>Duration (minutes)<input type="number" min="0" value={restoreForm.durationMinutes} onChange={(e) => setRestoreForm({ ...restoreForm, durationMinutes: e.target.value })} /></label>
            <button type="submit" disabled={saving === "restore"}><CheckCircle2 size={15} /> Record Verification</button>
          </form>

          <form className="ict-card-form is-collapsed" onSubmit={submitLicense}>
            <h2><CalendarClock size={17} /> Certificate / License <button type="button" className="ict-form-collapse" onClick={toggleForm} aria-expanded="false" aria-label="Expand form">+</button></h2>
            <div className="ict-form-row"><label>License ID<input required value={licenseForm.licenseId} onChange={(e) => setLicenseForm({ ...licenseForm, licenseId: e.target.value })} /></label><label>Seats<input type="number" min="0" value={licenseForm.totalSeats} onChange={(e) => setLicenseForm({ ...licenseForm, totalSeats: e.target.value })} /></label></div>
            <label>Software<input required value={licenseForm.softwareName} onChange={(e) => setLicenseForm({ ...licenseForm, softwareName: e.target.value })} /></label>
            <div className="ict-form-row"><label>Vendor<input value={licenseForm.vendor} onChange={(e) => setLicenseForm({ ...licenseForm, vendor: e.target.value })} /></label><label>Expiry<input type="date" value={licenseForm.expiryDate} onChange={(e) => setLicenseForm({ ...licenseForm, expiryDate: e.target.value })} /></label></div>
            <button type="submit" disabled={saving === "license"}><Wrench size={15} /> Track License</button>
          </form>
        </div>
      </section>
    </main>
  );
}
