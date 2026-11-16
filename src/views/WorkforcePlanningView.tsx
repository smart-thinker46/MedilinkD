// Ported from Medilink-Frontend/src/app/workforce-planning/page.tsx for desktop parity.
import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import { AlertTriangle, BriefcaseBusiness, ChartNoAxesColumnIncreasing, CheckCircle2, Clock3, Info, RefreshCw, Search, ShieldCheck, UserCheck, UsersRound, X } from "lucide-react";
import { api } from "../lib/api";

const today = new Date().toISOString().slice(0, 10);
const money = (value: unknown) => `KES ${Number(value || 0).toLocaleString("en-KE", { maximumFractionDigits: 0 })}`;
const unwrapRows = (value: any): any[] => {
  const data = value?.data ?? value;
  if (Array.isArray(data)) return data;
  for (const candidate of [data?.items, data?.rows, data?.results, data?.tokens, data?.staff, data?.data]) {
    if (Array.isArray(candidate)) return candidate;
  }
  return [];
};

const emptyEstablishment = { departmentName: "", departmentId: "", jobTitle: "", authorisedPosts: "", recruitmentPosts: "0", budgetedSalary: "", approvedByBoard: true, effectiveDate: today, notes: "" };
const emptyRatio = { departmentName: "", departmentId: "", staffGroup: "NURSE", forecastPeriod: "Current quarter", patientVolume: "", currentStaff: "", standardRatio: "5", benchmark: "MOH / professional standard", notes: "" };
const emptySuccession = { departmentName: "", keyRole: "", incumbentName: "", successorStaffId: "", successorName: "", readiness: "DEVELOPMENT_NEEDED", developmentActivities: "", reviewDate: today, status: "ACTIVE" };
const emptyForecast = { fromDate: today, toDate: today, outpatientPerNurse: "12", inpatientPerNurse: "5", outpatientPerDoctor: "25", note: "" };
const emptyOvertime = { staffId: "", occurredAt: today, minutes: "60", reason: "" };
const emptySkill = { staffId: "", skillName: "", level: "", tags: "" };

export default function WorkforcePlanningView() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [establishments, setEstablishments] = useState<any[]>([]);
  const [ratios, setRatios] = useState<any[]>([]);
  const [succession, setSuccession] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [forecasts, setForecasts] = useState<any[]>([]);
  const [shiftTemplates, setShiftTemplates] = useState<any[]>([]);
  const [shifts, setShifts] = useState<any[]>([]);
  const [overtime, setOvertime] = useState<any[]>([]);
  const [skills, setSkills] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("ALL");
  const [selected, setSelected] = useState<any>(null);
  const [activeStat, setActiveStat] = useState("");
  const [modal, setModal] = useState<"establishment" | "ratio" | "succession" | "forecast" | "overtime" | "skill" | "">("");
  const [establishmentForm, setEstablishmentForm] = useState(emptyEstablishment);
  const [ratioForm, setRatioForm] = useState(emptyRatio);
  const [successionForm, setSuccessionForm] = useState(emptySuccession);
  const [forecastForm, setForecastForm] = useState(emptyForecast);
  const [overtimeForm, setOvertimeForm] = useState(emptyOvertime);
  const [skillForm, setSkillForm] = useState(emptySkill);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ tone: "success" | "warning" | "error"; text: string } | null>(null);

  const showNotice = (text: string, tone: "success" | "warning" | "error" = "success") => {
    setNotice({ text, tone });
    window.setTimeout(() => setNotice(null), tone === "success" ? 2600 : 4200);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const results = await Promise.allSettled([
        api.get("/workforce-planning/planning-dashboard"),
        api.get("/workforce-planning/establishments"),
        api.get("/workforce-planning/ratio-analyses"),
        api.get("/workforce-planning/succession-plans"),
        api.get("/staff").catch(() => ({ data: [] })),
        api.get("/workforce-planning/forecasts"),
        api.get("/workforce-planning/shift-templates"),
        api.get("/workforce-planning/shifts"),
        api.get("/workforce-planning/overtime"),
        api.get("/workforce-planning/skills"),
      ]);
      const value = (index: number) => results[index].status === "fulfilled" ? (results[index] as PromiseFulfilledResult<any>).value?.data : null;
      const labels = ["dashboard", "establishments", "ratio analyses", "succession plans", "staff", "forecasts", "shift templates", "shifts", "overtime", "skills"];
      const failed = results.map((result, index) => result.status === "rejected" ? labels[index] : "").filter(Boolean);
      if (failed.length) showNotice(`Some Workforce Planning data could not be loaded: ${failed.join(", ")}.`, "warning");
      setDashboard(value(0) || null);
      setEstablishments(unwrapRows(value(1)));
      setRatios(unwrapRows(value(2)));
      setSuccession(unwrapRows(value(3)));
      setStaff(unwrapRows(value(4)));
      setForecasts(unwrapRows(value(5)));
      setShiftTemplates(unwrapRows(value(6)));
      setShifts(unwrapRows(value(7)));
      setOvertime(unwrapRows(value(8)));
      setSkills(unwrapRows(value(9)));
    } catch (err: any) {
      showNotice(String(err?.response?.data?.message || err?.message || "Workforce planning data could not be loaded."), "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => void loadData(), 60000);
    return () => window.clearInterval(timer);
  }, []);

  const filteredEstablishments = useMemo(() => {
    const q = search.trim().toLowerCase();
    return establishments.filter((row) => [row.departmentName, row.jobTitle, row.status].join(" ").toLowerCase().includes(q));
  }, [establishments, search]);

  const filteredRatios = useMemo(() => {
    const q = search.trim().toLowerCase();
    return ratios.filter((row) => {
      const hay = [row.departmentName, row.staffGroup, row.riskLevel, row.benchmark].join(" ").toLowerCase();
      return (!q || hay.includes(q)) && (riskFilter === "ALL" || row.riskLevel === riskFilter);
    });
  }, [ratios, search, riskFilter]);

  const matchesSearch = (row: any) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return Object.values(row || {}).some((value) => typeof value === "string" && value.toLowerCase().includes(q));
  };
  const filteredSuccession = useMemo(() => succession.filter(matchesSearch), [succession, search]);
  const filteredForecasts = useMemo(() => forecasts.filter(matchesSearch), [forecasts, search]);
  const filteredShifts = useMemo(() => shifts.filter(matchesSearch), [shifts, search]);
  const filteredActivity = useMemo(() => [...overtime.map((row) => ({ ...row, _kind: "Overtime", _name: row.staff ? `${row.staff.firstName || ""} ${row.staff.lastName || ""}`.trim() : row.staffId })), ...skills.map((row) => ({ ...row, _kind: "Skill", _name: row.staffId }))].filter(matchesSearch), [overtime, skills, search]);

  const readyNow = succession.filter((row) => row.readiness === "READY_NOW").length;
  const vacantPosts = establishments.reduce((sum, row) => sum + Math.max(0, Number(row.vacantPosts || 0)), 0);
  const riskCount = ratios.filter((row) => ["UNDERSTAFFED", "CRITICAL"].includes(row.riskLevel)).length;
  const stats = [
    { label: "Establishment Rows", value: dashboard?.establishmentRows ?? establishments.length, color: "#2563eb", icon: <BriefcaseBusiness size={20} /> },
    { label: "Vacant Posts", value: dashboard?.vacantPosts ?? vacantPosts, color: "#dc2626", icon: <AlertTriangle size={20} /> },
    { label: "Active Staff", value: dashboard?.activeStaff ?? staff.length, color: "#16a34a", icon: <UsersRound size={20} /> },
    { label: "Ratio Risks", value: dashboard?.understaffingRisks ?? riskCount, color: "#d97706", icon: <ChartNoAxesColumnIncreasing size={20} /> },
    { label: "Succession Plans", value: dashboard?.successionPlans ?? succession.length, color: "#7c3aed", icon: <ShieldCheck size={20} /> },
    { label: "Ready Now", value: dashboard?.readyNow ?? readyNow, color: "#0f766e", icon: <UserCheck size={20} /> },
    { label: "Forecasts", value: forecasts.length, color: "#0891b2", icon: <ChartNoAxesColumnIncreasing size={20} /> },
    { label: "Overtime Pending", value: overtime.filter((row) => !row.approved).length, color: "#b45309", icon: <Clock3 size={20} /> },
  ];

  const selectStat = (label: string, value: unknown) => {
    setActiveStat(label);
    setSelected({ planningMetric: label, value, status: "DASHBOARD METRIC" });
    showNotice(`${label}: ${value}. Select a related record below to view its details.`);
    window.requestAnimationFrame(() => document.querySelector(".wf-grid")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  const submitEstablishment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      await api.post("/workforce-planning/establishments", {
        ...establishmentForm,
        authorisedPosts: Number(establishmentForm.authorisedPosts || 0),
        recruitmentPosts: Number(establishmentForm.recruitmentPosts || 0),
        budgetedSalary: Number(establishmentForm.budgetedSalary || 0),
      });
      setEstablishmentForm(emptyEstablishment);
      setModal("");
      showNotice("Staffing establishment saved.");
      await loadData();
    } catch (err: any) {
      showNotice(String(err?.response?.data?.message || err?.message || "Establishment could not be saved."), "error");
    } finally {
      setSaving(false);
    }
  };

  const submitRatio = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      await api.post("/workforce-planning/ratio-analyses/run", {
        ...ratioForm,
        patientVolume: Number(ratioForm.patientVolume || 0),
        currentStaff: ratioForm.currentStaff === "" ? undefined : Number(ratioForm.currentStaff),
        standardRatio: Number(ratioForm.standardRatio || 1),
      });
      setRatioForm(emptyRatio);
      setModal("");
      showNotice("Staffing ratio analysis generated.");
      await loadData();
    } catch (err: any) {
      showNotice(String(err?.response?.data?.message || err?.message || "Ratio analysis failed."), "error");
    } finally {
      setSaving(false);
    }
  };

  const submitSuccession = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      await api.post("/workforce-planning/succession-plans", successionForm);
      setSuccessionForm(emptySuccession);
      setModal("");
      showNotice("Succession plan saved.");
      await loadData();
    } catch (err: any) {
      showNotice(String(err?.response?.data?.message || err?.message || "Succession plan could not be saved."), "error");
    } finally {
      setSaving(false);
    }
  };

  const submitForecast = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setSaving(true);
    try {
      await api.post("/workforce-planning/forecasts/run", { ...forecastForm, outpatientPerNurse: Number(forecastForm.outpatientPerNurse), inpatientPerNurse: Number(forecastForm.inpatientPerNurse), outpatientPerDoctor: Number(forecastForm.outpatientPerDoctor) });
      setForecastForm(emptyForecast); setModal(""); showNotice("Workforce demand forecast generated."); await loadData();
    } catch (err: any) { showNotice(String(err?.response?.data?.message || err?.message || "Forecast could not be generated."), "error"); } finally { setSaving(false); }
  };

  const submitOvertime = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setSaving(true);
    try {
      await api.post("/workforce-planning/overtime", { ...overtimeForm, minutes: Number(overtimeForm.minutes) });
      setOvertimeForm(emptyOvertime); setModal(""); showNotice("Overtime request recorded."); await loadData();
    } catch (err: any) { showNotice(String(err?.response?.data?.message || err?.message || "Overtime request could not be saved."), "error"); } finally { setSaving(false); }
  };

  const submitSkill = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setSaving(true);
    try {
      await api.post("/workforce-planning/skills", { ...skillForm, tags: skillForm.tags.split(",").map((tag) => tag.trim()).filter(Boolean) });
      setSkillForm(emptySkill); setModal(""); showNotice("Staff skill recorded."); await loadData();
    } catch (err: any) { showNotice(String(err?.response?.data?.message || err?.message || "Staff skill could not be saved."), "error"); } finally { setSaving(false); }
  };

  return (
    <main className="wf-page">
      <header className="wf-header">
        <div><h1>Workforce Planning</h1><p>Staffing establishment, patient-volume staffing ratios, vacancies, recruitment pressure, and succession readiness.</p></div>
        <div className="wf-actions">
          <button className="wf-btn ghost" type="button" onClick={() => void loadData()} disabled={loading}><RefreshCw size={17} /> Refresh</button>
          <button className="wf-btn green" type="button" onClick={() => setModal("establishment")}><BriefcaseBusiness size={17} /> Establishment</button>
          <button className="wf-btn blue" type="button" onClick={() => setModal("ratio")}><ChartNoAxesColumnIncreasing size={17} /> Ratio Analysis</button>
          <button className="wf-btn purple" type="button" onClick={() => setModal("succession")}><ShieldCheck size={17} /> Succession</button>
          <button className="wf-btn teal" type="button" onClick={() => setModal("forecast")}><ChartNoAxesColumnIncreasing size={17} /> Forecast</button>
          <button className="wf-btn amber" type="button" onClick={() => setModal("overtime")}><Clock3 size={17} /> Overtime</button>
          <button className="wf-btn slate" type="button" onClick={() => setModal("skill")}><UserCheck size={17} /> Staff Skill</button>
        </div>
      </header>

      <section className="wf-stats" aria-label="Workforce planning statistics">{stats.map((stat) => <article className={`wf-stat is-clickable ${activeStat === stat.label ? "is-active" : ""}`} style={{ borderLeftColor: stat.color }} key={stat.label} role="button" tabIndex={0} aria-pressed={activeStat === stat.label} onClick={() => selectStat(stat.label, stat.value)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); selectStat(stat.label, stat.value); } }}><div><span>{stat.label}</span><strong>{stat.value}</strong></div><i style={{ color: stat.color }}>{stat.icon}</i></article>)}</section>

      <section className="wf-filter-panel">
        <label className="wf-search"><Search size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search department, role, risk, benchmark..." /></label>
        <select value={riskFilter} onChange={(event) => setRiskFilter(event.target.value)}><option value="ALL">All ratio status</option><option value="CRITICAL">Critical</option><option value="UNDERSTAFFED">Understaffed</option><option value="MEETS_STANDARD">Meets standard</option><option value="SUPERNUMERARY">Supernumerary</option></select>
      </section>

      <section className="wf-grid">
        <div className="wf-main">
          <WfPanel title="Staffing Establishment Management">
            <WfTable>
              <thead><tr><th>Department</th><th>Job Title</th><th>Authorised</th><th>Filled</th><th>Recruiting</th><th>Vacant</th><th>Status</th></tr></thead>
              <tbody>{filteredEstablishments.length ? filteredEstablishments.map((row) => <tr key={row.establishmentId} onClick={() => setSelected(row)}><td><strong>{row.departmentName}</strong><small>{row.approvedByBoard ? "Board approved" : "Draft"}</small></td><td>{row.jobTitle}</td><td>{row.authorisedPosts}</td><td>{row.filledPosts}</td><td>{row.recruitmentPosts}</td><td className={Number(row.vacantPosts || 0) > 0 ? "danger" : "ok"}>{row.vacantPosts}</td><td><span className="wf-pill">{row.status}</span></td></tr>) : <tr><td colSpan={7} className="wf-empty">No establishment rows recorded.</td></tr>}</tbody>
            </WfTable>
          </WfPanel>

          <WfPanel title="Patient Volume to Staffing Ratio Analysis">
            <WfTable>
              <thead><tr><th>Department</th><th>Staff Group</th><th>Volume</th><th>Standard</th><th>Current</th><th>Required</th><th>Risk</th></tr></thead>
              <tbody>{filteredRatios.length ? filteredRatios.map((row) => <tr key={row.ratioAnalysisId || row.id} onClick={() => setSelected(row)}><td><strong>{row.departmentName || "Hospital"}</strong><small>{row.forecastPeriod}</small></td><td>{row.staffGroup}</td><td>{row.patientVolume}</td><td>1 : {row.standardRatio}</td><td>{row.currentStaff}</td><td>{row.requiredStaff}</td><td><span className="wf-pill">{row.riskLevel}</span><small>Gap {row.gap}</small></td></tr>) : <tr><td colSpan={7} className="wf-empty">No ratio analysis generated.</td></tr>}</tbody>
            </WfTable>
          </WfPanel>
          <WfPanel title="Workforce Demand Forecasts">
            <WfTable><thead><tr><th>Period</th><th>Outpatient visits</th><th>Avg inpatients</th><th>Nurse ratio</th><th>Generated</th></tr></thead><tbody>{filteredForecasts.length ? filteredForecasts.slice(0, 12).map((row) => <tr key={row.id} onClick={() => setSelected(row)}><td><strong>{row.fromDate ? new Date(row.fromDate).toLocaleDateString() : "-"}</strong><small>to {row.toDate ? new Date(row.toDate).toLocaleDateString() : "-"}</small></td><td>{row.output?.totals?.totalOutpatientVisits ?? "-"}</td><td>{row.output?.totals?.avgOpenInpatients ?? "-"}</td><td>1 : {row.input?.outpatientPerNurse ?? "-"}</td><td>{row.generatedAt ? new Date(row.generatedAt).toLocaleDateString() : "-"}</td></tr>) : <tr><td colSpan={5} className="wf-empty">No demand forecasts match the current search.</td></tr>}</tbody></WfTable>
          </WfPanel>
          <WfPanel title="Workforce Skills and Overtime">
            <WfTable><thead><tr><th>Staff</th><th>Record</th><th>Details</th><th>Status</th><th>Date</th></tr></thead><tbody>{filteredActivity.slice(0, 16).map((row, index) => <tr key={row.id || `${row._kind}-${index}`} onClick={() => setSelected(row)}><td>{row._name || "-"}</td><td><strong>{row._kind}</strong><small>{row.skillName || `${row.minutes || 0} minutes`}</small></td><td>{row.level || row.reason || "-"}</td><td><span className="wf-pill">{row.approved === false ? "PENDING" : row.approved === true ? "APPROVED" : "RECORDED"}</span></td><td>{row.occurredAt || row.createdAt ? new Date(row.occurredAt || row.createdAt).toLocaleDateString() : "-"}</td></tr>)}</tbody></WfTable>
          </WfPanel>
        </div>

        <aside className="wf-side">
          <section className="wf-selected"><span>Selected Planning Record</span><h2>{selected?.jobTitle || selected?.keyRole || selected?.departmentName || "No record selected"}</h2><dl><div><dt>Status</dt><dd>{selected?.status || selected?.riskLevel || selected?.readiness || "-"}</dd></div><div><dt>Gap</dt><dd>{selected?.vacantPosts ?? selected?.gap ?? "-"}</dd></div><div><dt>Review</dt><dd>{selected?.reviewDate ? new Date(selected.reviewDate).toLocaleDateString() : selected?.forecastPeriod || "-"}</dd></div></dl></section>
          <WfPanel title="Succession Planning">{filteredSuccession.length ? <div className="wf-list">{filteredSuccession.slice(0, 8).map((row) => <button key={row.successionPlanId || row.id} type="button" onClick={() => setSelected(row)}><span><strong>{row.keyRole}</strong><small>{row.successorName || row.successorStaffId || "Successor"} · {row.departmentName || "Department"}</small></span><b>{row.readiness}</b></button>)}</div> : <p className="wf-note">No succession plans match the current search.</p>}</WfPanel>
          <WfPanel title="Vacancy and Recruitment Pressure">{establishments.filter((row) => Number(row.vacantPosts || 0) > 0).length ? <div className="wf-list">{establishments.filter((row) => Number(row.vacantPosts || 0) > 0).slice(0, 6).map((row) => <button key={row.establishmentId} type="button" onClick={() => setSelected(row)}><span><strong>{row.departmentName}</strong><small>{row.jobTitle} · recruiting {row.recruitmentPosts}</small></span><b>{row.vacantPosts} vacant</b></button>)}</div> : <p className="wf-note">No open establishment vacancies.</p>}</WfPanel>
          <WfPanel title="Understaffing Risks">{ratios.filter((row) => ["UNDERSTAFFED", "CRITICAL"].includes(row.riskLevel)).length ? <div className="wf-list">{ratios.filter((row) => ["UNDERSTAFFED", "CRITICAL"].includes(row.riskLevel)).slice(0, 6).map((row) => <button key={row.ratioAnalysisId || row.id} type="button" onClick={() => setSelected(row)}><span><strong>{row.departmentName || row.staffGroup}</strong><small>{row.benchmark}</small></span><b>{row.riskLevel}</b></button>)}</div> : <p className="wf-note">No ratio risks flagged.</p>}</WfPanel>
          <WfPanel title="Operational Shift Coverage"><WfTable><thead><tr><th>Date</th><th>Shift</th><th>Role</th><th>Staff</th><th>Status</th></tr></thead><tbody>{filteredShifts.length ? filteredShifts.slice(0, 10).map((row) => <tr key={row.id} onClick={() => setSelected(row)}><td>{row.shiftDate ? new Date(row.shiftDate).toLocaleDateString() : "-"}</td><td>{row.shiftType || "-"}<small>{row.startTime}–{row.endTime}</small></td><td>{row.roleTitle || "-"}</td><td>{row.staffId || "Unassigned"}</td><td><span className="wf-pill">{row.status}</span></td></tr>) : <tr><td colSpan={5} className="wf-empty">No planned shifts match the current search.</td></tr>}</tbody></WfTable></WfPanel>
          <WfPanel title="Shift Templates"><p className="wf-note">{shiftTemplates.length ? `${shiftTemplates.length} active shift template${shiftTemplates.length === 1 ? "" : "s"} configured.` : "No shift templates configured."}</p></WfPanel>
        </aside>
      </section>

      {notice ? <div className={`wf-toast ${notice.tone}`} role="status" aria-live="polite"><div className="wf-toast-icon">{notice.tone === "error" ? <AlertTriangle size={18} /> : notice.tone === "warning" ? <Info size={18} /> : <CheckCircle2 size={18} />}</div><div className="wf-toast-content"><strong>{notice.tone === "error" ? "Action failed" : notice.tone === "warning" ? "Some data needs attention" : "Workforce Planning updated"}</strong><span>{notice.text}</span></div><button type="button" aria-label="Dismiss notification" onClick={() => setNotice(null)}><X size={15} /></button></div> : null}
      {loading ? <div className="wf-loading">Loading workforce planning...</div> : null}

      {modal === "establishment" ? <WfModal title="Staffing Establishment" onClose={() => setModal("")}><form className="module-form-grid" onSubmit={submitEstablishment}><Text label="Department name" value={establishmentForm.departmentName} onChange={(v) => setEstablishmentForm((f) => ({ ...f, departmentName: v }))} required /><Text label="Department ID" value={establishmentForm.departmentId} onChange={(v) => setEstablishmentForm((f) => ({ ...f, departmentId: v }))} /><Text label="Job title" value={establishmentForm.jobTitle} onChange={(v) => setEstablishmentForm((f) => ({ ...f, jobTitle: v }))} required /><Text label="Authorised posts" type="number" value={establishmentForm.authorisedPosts} onChange={(v) => setEstablishmentForm((f) => ({ ...f, authorisedPosts: v }))} required /><Text label="Posts under recruitment" type="number" value={establishmentForm.recruitmentPosts} onChange={(v) => setEstablishmentForm((f) => ({ ...f, recruitmentPosts: v }))} /><Text label="Budgeted salary per post" type="number" value={establishmentForm.budgetedSalary} onChange={(v) => setEstablishmentForm((f) => ({ ...f, budgetedSalary: v }))} /><Text label="Effective date" type="date" value={establishmentForm.effectiveDate} onChange={(v) => setEstablishmentForm((f) => ({ ...f, effectiveDate: v }))} /><label className="wf-check"><input type="checkbox" checked={establishmentForm.approvedByBoard} onChange={(e) => setEstablishmentForm((f) => ({ ...f, approvedByBoard: e.target.checked }))} /> Board approved establishment</label><Area label="Notes" value={establishmentForm.notes} onChange={(v) => setEstablishmentForm((f) => ({ ...f, notes: v }))} /><Footer saving={saving} onCancel={() => setModal("")} label="Save Establishment" /></form></WfModal> : null}
      {modal === "ratio" ? <WfModal title="Staffing Ratio Analysis" onClose={() => setModal("")}><form className="module-form-grid" onSubmit={submitRatio}><Text label="Department name" value={ratioForm.departmentName} onChange={(v) => setRatioForm((f) => ({ ...f, departmentName: v }))} /><Text label="Department ID" value={ratioForm.departmentId} onChange={(v) => setRatioForm((f) => ({ ...f, departmentId: v }))} /><Select label="Staff group" value={ratioForm.staffGroup} onChange={(v) => setRatioForm((f) => ({ ...f, staffGroup: v }))} options={["NURSE", "DOCTOR", "LAB", "PHARMACY", "RADIOLOGY", "SUPPORT"]} /><Text label="Forecast period" value={ratioForm.forecastPeriod} onChange={(v) => setRatioForm((f) => ({ ...f, forecastPeriod: v }))} /><Text label="Patient volume" type="number" value={ratioForm.patientVolume} onChange={(v) => setRatioForm((f) => ({ ...f, patientVolume: v }))} required /><Text label="Current staff (optional)" type="number" value={ratioForm.currentStaff} onChange={(v) => setRatioForm((f) => ({ ...f, currentStaff: v }))} /><Text label="Standard patients per staff" type="number" value={ratioForm.standardRatio} onChange={(v) => setRatioForm((f) => ({ ...f, standardRatio: v }))} required /><Text label="Benchmark" value={ratioForm.benchmark} onChange={(v) => setRatioForm((f) => ({ ...f, benchmark: v }))} /><Area label="Notes / assumptions" value={ratioForm.notes} onChange={(v) => setRatioForm((f) => ({ ...f, notes: v }))} /><Footer saving={saving} onCancel={() => setModal("")} label="Run Analysis" /></form></WfModal> : null}
      {modal === "succession" ? <WfModal title="Succession Plan" onClose={() => setModal("")}><form className="module-form-grid" onSubmit={submitSuccession}><Text label="Department name" value={successionForm.departmentName} onChange={(v) => setSuccessionForm((f) => ({ ...f, departmentName: v }))} /><Text label="Key role" value={successionForm.keyRole} onChange={(v) => setSuccessionForm((f) => ({ ...f, keyRole: v }))} required /><Text label="Incumbent name" value={successionForm.incumbentName} onChange={(v) => setSuccessionForm((f) => ({ ...f, incumbentName: v }))} /><StaffSelect staff={staff} value={successionForm.successorStaffId} onChange={(v) => { const person = staff.find((row) => row.id === v); setSuccessionForm((f) => ({ ...f, successorStaffId: v, successorName: person ? `${person.firstName || ""} ${person.lastName || ""}`.trim() : f.successorName })); }} /><Text label="Successor name" value={successionForm.successorName} onChange={(v) => setSuccessionForm((f) => ({ ...f, successorName: v }))} /><Select label="Readiness" value={successionForm.readiness} onChange={(v) => setSuccessionForm((f) => ({ ...f, readiness: v }))} options={["READY_NOW", "READY_IN_1_YEAR", "READY_IN_2_YEARS", "DEVELOPMENT_NEEDED"]} /><Text label="Review date" type="date" value={successionForm.reviewDate} onChange={(v) => setSuccessionForm((f) => ({ ...f, reviewDate: v }))} /><Select label="Status" value={successionForm.status} onChange={(v) => setSuccessionForm((f) => ({ ...f, status: v }))} options={["ACTIVE", "REVIEW_DUE", "CLOSED"]} /><Area label="Development activities" value={successionForm.developmentActivities} onChange={(v) => setSuccessionForm((f) => ({ ...f, developmentActivities: v }))} /><Footer saving={saving} onCancel={() => setModal("")} label="Save Succession Plan" /></form></WfModal> : null}
      {modal === "forecast" ? <WfModal title="Demand Forecast" onClose={() => setModal("")}><form className="module-form-grid" onSubmit={submitForecast}><Text label="From date" type="date" value={forecastForm.fromDate} onChange={(v) => setForecastForm((f) => ({ ...f, fromDate: v }))} required /><Text label="To date" type="date" value={forecastForm.toDate} onChange={(v) => setForecastForm((f) => ({ ...f, toDate: v }))} required /><Text label="Outpatient visits per nurse" type="number" value={forecastForm.outpatientPerNurse} onChange={(v) => setForecastForm((f) => ({ ...f, outpatientPerNurse: v }))} required /><Text label="Inpatients per nurse" type="number" value={forecastForm.inpatientPerNurse} onChange={(v) => setForecastForm((f) => ({ ...f, inpatientPerNurse: v }))} required /><Text label="Outpatient visits per doctor" type="number" value={forecastForm.outpatientPerDoctor} onChange={(v) => setForecastForm((f) => ({ ...f, outpatientPerDoctor: v }))} required /><Area label="Scenario notes" value={forecastForm.note} onChange={(v) => setForecastForm((f) => ({ ...f, note: v }))} /><Footer saving={saving} onCancel={() => setModal("")} label="Run Forecast" /></form></WfModal> : null}
      {modal === "overtime" ? <WfModal title="Record Overtime" onClose={() => setModal("")}><form className="module-form-grid" onSubmit={submitOvertime}><StaffSelect staff={staff} value={overtimeForm.staffId} onChange={(v) => setOvertimeForm((f) => ({ ...f, staffId: v }))} /><Text label="Date" type="date" value={overtimeForm.occurredAt} onChange={(v) => setOvertimeForm((f) => ({ ...f, occurredAt: v }))} required /><Text label="Minutes" type="number" value={overtimeForm.minutes} onChange={(v) => setOvertimeForm((f) => ({ ...f, minutes: v }))} required /><Area label="Reason" value={overtimeForm.reason} onChange={(v) => setOvertimeForm((f) => ({ ...f, reason: v }))} /><Footer saving={saving} onCancel={() => setModal("")} label="Save Overtime" /></form></WfModal> : null}
      {modal === "skill" ? <WfModal title="Record Staff Skill" onClose={() => setModal("")}><form className="module-form-grid" onSubmit={submitSkill}><StaffSelect staff={staff} value={skillForm.staffId} onChange={(v) => setSkillForm((f) => ({ ...f, staffId: v }))} /><Text label="Skill or credential" value={skillForm.skillName} onChange={(v) => setSkillForm((f) => ({ ...f, skillName: v }))} required /><Text label="Level" value={skillForm.level} onChange={(v) => setSkillForm((f) => ({ ...f, level: v }))} /><Text label="Tags (comma separated)" value={skillForm.tags} onChange={(v) => setSkillForm((f) => ({ ...f, tags: v }))} /><Footer saving={saving} onCancel={() => setModal("")} label="Save Skill" /></form></WfModal> : null}
    </main>
  );
}

function WfPanel({ title, children }: { title: string; children: ReactNode }) {
  return <section className="wf-panel"><div className="wf-panel-title"><h2>{title}</h2></div>{children}</section>;
}

function WfTable({ children }: { children: ReactNode }) {
  return <div className="wf-table-wrap"><table className="wf-table">{children}</table></div>;
}

function WfModal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="module-form-overlay" onClick={onClose}>
      <div className="module-form-panel modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="module-form-header">
          <div className="module-form-heading">
            <div className="module-form-icon"><BriefcaseBusiness size={20} /></div>
            <div>
              <div className="module-form-kicker">Workforce Planning</div>
              <h2 className="module-form-title">{title}</h2>
            </div>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close form">x</button>
        </div>
        <div className="module-form-body">{children}</div>
      </div>
    </div>
  );
}

function StaffSelect({ staff, value, onChange }: { staff: any[]; value: string; onChange: (value: string) => void }) {
  return <div className="module-form-field is-wide"><label className="form-label">Successor staff profile</label><select className="module-form-input" value={value} onChange={(event) => onChange(event.target.value)}><option value="">Select internal candidate</option>{staff.map((row) => <option value={row.id} key={row.id}>{[row.firstName, row.lastName].filter(Boolean).join(" ")} - {row.jobTitle || row.staffNumber || row.id}</option>)}</select></div>;
}

function Text({ label, value, onChange, type = "text", required = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean }) {
  return <div className="module-form-field"><label className="form-label">{label}</label><input className="module-form-input" type={type} value={value} onChange={(event) => onChange(event.target.value)} required={required} /></div>;
}

function Area({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <div className="module-form-field is-wide"><label className="form-label">{label}</label><textarea className="module-form-input" value={value} onChange={(event) => onChange(event.target.value)} /></div>;
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) {
  return <div className="module-form-field"><label className="form-label">{label}</label><select className="module-form-input" value={value} onChange={(event) => onChange(event.target.value)}>{options.map((option) => <option value={option} key={option}>{option.replaceAll("_", " ")}</option>)}</select></div>;
}

function Footer({ saving, onCancel, label }: { saving: boolean; onCancel: () => void; label: string }) {
  return <div className="module-form-footer"><button type="button" className="form-btn form-btn-cancel" onClick={onCancel}>Cancel</button><button type="submit" className="form-btn form-btn-primary module-form-submit" disabled={saving}>{saving ? "Saving..." : label}</button></div>;
}
