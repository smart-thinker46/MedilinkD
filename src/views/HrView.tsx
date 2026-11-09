
import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
const useRouter = () => ({ push: (path: string) => window.dispatchEvent(new CustomEvent("hmis:navigate", { detail: { path } })) });
import {
  AlertTriangle,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  FileWarning,
  FileUp,
  RefreshCw,
  Search,
  Star,
  UserPlus,
  Users,
  WalletCards,
  X,
} from "lucide-react";
import { api } from "../lib/api";
import { useLiveRefresh } from "../lib/liveRefresh";

const today = new Date().toISOString().slice(0, 10);
const DEFAULT_JOB_CATEGORIES = ["CLINICAL", "NURSING", "PHARMACY", "LAB", "ADMIN", "SUPPORT"];
const money = (value: unknown) => `KES ${Number(value || 0).toLocaleString("en-KE", { maximumFractionDigits: 0 })}`;
const daysBetween = (start?: string, end?: string) => {
  const a = start ? new Date(start) : null;
  const b = end ? new Date(end) : null;
  if (!a || !b || Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return 0;
  return Math.max(1, Math.ceil((b.getTime() - a.getTime()) / 86400000) + 1);
};
const staffName = (staff: any) => [staff?.firstName, staff?.lastName].filter(Boolean).join(" ") || staff?.staffName || staff?.staffId || "Staff";
const selectedTitle = (row: any) => {
  if (!row) return "No record selected";
  if (row.firstName || row.lastName || row.staffName || row.staffId) return staffName(row);
  return row.title || row.recordType || "Selected record";
};
const fmtDate = (value?: string) => {
  if (!value) return "-";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "-" : parsed.toLocaleDateString();
};

const unwrapRows = (value: any): any[] => {
  const data = value?.data ?? value;
  if (Array.isArray(data)) return data;
  for (const candidate of [data?.items, data?.rows, data?.results, data?.staff, data?.records, data?.data]) {
    if (Array.isArray(candidate)) return candidate;
  }
  return [];
};

const unwrapObject = (value: any): any => {
  const data = value?.data ?? value;
  return data && typeof data === "object" && !Array.isArray(data) ? data : {};
};

const configuredJobCategories = (snapshot: any): string[] => {
  const root = unwrapObject(snapshot);
  const values = { ...(root.fullSetupPrefill || {}), ...(root.fullSetupValues || {}), ...root };
  const rawCandidates = [values.jobCategories, values.jobCategoryCatalogue, values.staffCategories, values.staffCategoryCatalogue, values.rolesCatalogue];
  const parsed = rawCandidates.flatMap((raw) => {
    if (Array.isArray(raw)) return raw;
    return String(raw || "").split(/[\n,|]/);
  }).map((item) => String(item).trim()).filter(Boolean);
  return Array.from(new Set([...parsed, ...DEFAULT_JOB_CATEGORIES]));
};

const emptyEmployee = {
  firstName: "",
  lastName: "",
  gender: "UNKNOWN",
  dateOfBirth: "",
  idNumber: "",
  phone: "",
  email: "",
  staffNumber: "",
  jobTitle: "",
  jobCategory: "CLINICAL",
  departmentId: "",
  contractType: "FULL_TIME",
  hireDate: today,
  contractEndDate: "",
  basicSalary: "",
  bankName: "",
  bankAccount: "",
  professionalRegNumber: "",
  regExpiryDate: "",
  photoUrl: "",
  nextOfKinName: "",
  nextOfKinPhone: "",
  education: "",
};
const emptyRegistration = { staffId: "", board: "KMPDB", professionalRegNumber: "", expiryDate: "", certificateUrl: "", notes: "" };
const emptyLeave = { staffId: "", leaveType: "ANNUAL", startDate: today, endDate: today, reason: "", medicalCertificateUrl: "" };
const emptyDiscipline = { staffId: "", incidentDate: today, category: "CONDUCT", severity: "STANDARD", description: "", step: "VERBAL_WARNING", documentUrl: "", hearingDate: "", outcome: "", sanction: "" };
const emptyAppraisal = { staffId: "", reviewPeriod: `${new Date().getFullYear()} Annual`, reviewDate: today, selfEvaluation: "", managerEvaluation: "", rating: "MEETS_EXPECTATIONS", meetingDate: "", goals: "", developmentNeeds: "", signedByStaff: false, signedByManager: false };
const emptyLifecycle = { staffId: "", eventType: "PROBATION_REVIEW", effectiveDate: today, title: "", notes: "", newDepartment: "", salaryAmount: "", clearanceStatus: "PENDING" };

export default function HRDashboard() {
  const router = useRouter();
  const [dashboard, setDashboard] = useState<any>(null);
  const [staff, setStaff] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [records, setRecords] = useState<any[]>([]);
  const [credentialAlerts, setCredentialAlerts] = useState<any[]>([]);
  const [jobCategories, setJobCategories] = useState<string[]>(DEFAULT_JOB_CATEGORIES);
  const [departments, setDepartments] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selected, setSelected] = useState<any>(null);
  const [modal, setModal] = useState<"employee" | "registration" | "leave" | "discipline" | "appraisal" | "lifecycle" | "clock" | "">("");
  const [employeeForm, setEmployeeForm] = useState(emptyEmployee);
  const [registrationForm, setRegistrationForm] = useState(emptyRegistration);
  const [leaveForm, setLeaveForm] = useState(emptyLeave);
  const [disciplineForm, setDisciplineForm] = useState(emptyDiscipline);
  const [appraisalForm, setAppraisalForm] = useState(emptyAppraisal);
  const [lifecycleForm, setLifecycleForm] = useState(emptyLifecycle);
  const [clockStaffId, setClockStaffId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ tone: "success" | "warning" | "error"; text: string } | null>(null);
  const [sourceErrors, setSourceErrors] = useState<string[]>([]);

  const showNotice = (text: string, tone: "success" | "warning" | "error" = "success") => {
    setNotice({ text, tone });
    window.setTimeout(() => setNotice(null), tone === "success" ? 2600 : 4200);
  };

  const loadData = async () => {
    setLoading(true);
    const sources: Array<[string, Promise<any>]> = [
      ["dashboard", api.get("/hr/dashboard/summary")],
      ["staff", api.get("/staff")],
      ["attendance", api.get("/hr/attendance")],
      ["leave", api.get("/hr/leaves")],
      ["HR records", api.get("/hr/records", { params: { limit: 1500 } })],
      ["registration alerts", api.get("/hr/credentials/expiry-alerts", { params: { days: 90 } })],
      ["setup categories", api.get("/facilities/current/setup-snapshot")],
      ["departments", api.get("/staff/departments")],
    ];
    const results = await Promise.allSettled(sources.map(([, request]) => request));
    const failed: string[] = [];
    const value = (index: number) => {
      const result = results[index];
      if (result.status === "fulfilled") return result.value;
      const status = result.reason?.response?.status;
      failed.push(`${sources[index][0]}${status ? ` (${status})` : ""}`);
      return null;
    };
    const dashRes = value(0);
    const staffRes = value(1);
    const attRes = value(2);
    const leaveRes = value(3);
    const recordsRes = value(4);
    const credentialRes = value(5);
    const setupRes = value(6);
    const departmentsRes = value(7);
    if (dashRes) setDashboard(unwrapObject(dashRes.data));
    if (staffRes) setStaff(unwrapRows(staffRes.data));
    if (attRes) setAttendance(unwrapRows(attRes.data));
    if (leaveRes) setLeaves(unwrapRows(leaveRes.data));
    if (recordsRes) setRecords(unwrapRows(recordsRes.data));
    if (credentialRes) setCredentialAlerts(unwrapRows(credentialRes.data));
    if (setupRes) setJobCategories(configuredJobCategories(setupRes.data));
    if (departmentsRes) setDepartments(unwrapRows(departmentsRes.data));
    setSourceErrors(failed);
    if (failed.length) showNotice(`${failed.length} HR data source${failed.length === 1 ? "" : "s"} could not be loaded: ${failed.join(", ")}.`, "warning");
    setLoading(false);
  };

  useEffect(() => {
    void loadData();
  }, []);

  useLiveRefresh(() => loadData(), { intervalMs: 60000 });

  const recordsByType = useMemo(() => {
    return records.reduce<Record<string, any[]>>((acc, row) => {
      const key = String(row.recordType || "general");
      acc[key] = acc[key] || [];
      acc[key].push(row);
      return acc;
    }, {});
  }, [records]);

  const filteredStaff = useMemo(() => {
    const q = search.trim().toLowerCase();
    return staff.filter((row) => {
      const hay = [staffName(row), row.staffNumber, row.jobTitle, row.jobCategory, row.phone, row.email, row.professionalRegNumber].join(" ").toLowerCase();
      const status = String(row.employmentStatus || row.status || "ACTIVE");
      return (!q || hay.includes(q)) && (statusFilter === "ALL" || status === statusFilter);
    });
  }, [staff, search, statusFilter]);

  const pendingLeave = leaves.filter((row) => row.status === "PENDING");
  const openDiscipline = (recordsByType.disciplinary_case || []).filter((row) => row.status !== "CLOSED");
  const appraisalOpen = (recordsByType.performance_appraisal || []).filter((row) => row.status !== "SIGNED");
  const lifecycleEvents = recordsByType.lifecycle_event || [];
  const clinicalRisk = credentialAlerts.filter((row) => row.daysLeft <= 30).length;
  const stats = [
    { label: "Total Staff", value: dashboard?.totalStaff ?? staff.length, color: "#2563eb", icon: <Users size={20} /> },
    { label: "Active Staff", value: dashboard?.activeStaffCount ?? staff.filter((row) => row.employmentStatus === "ACTIVE").length, color: "#16a34a", icon: <BriefcaseBusiness size={20} /> },
    { label: "Pending Leave", value: pendingLeave.length, color: "#d97706", icon: <CalendarDays size={20} /> },
    { label: "Registration Risk", value: clinicalRisk, color: "#dc2626", icon: <AlertTriangle size={20} /> },
    { label: "Open Cases", value: openDiscipline.length, color: "#b91c1c", icon: <FileWarning size={20} /> },
    { label: "Appraisals", value: appraisalOpen.length, color: "#7c3aed", icon: <Star size={20} /> },
  ];

  const saveRecord = async (recordType: string, payload: any, success: string, reset?: () => void) => {
    setSaving(true);
    try {
      await api.post("/hr/records", {
        recordType,
        title: payload.title,
        staffId: payload.staffId,
        status: payload.status || "ACTIVE",
        effectiveDate: payload.effectiveDate || payload.reviewDate || payload.incidentDate || today,
        tags: payload.tags || [],
        data: payload,
      });
      reset?.();
      setModal("");
      showNotice(success);
      await loadData();
    } catch (err: any) {
      showNotice(String(err?.response?.data?.message || err?.message || "Save failed."), "error");
    } finally {
      setSaving(false);
    }
  };

  const saveEmployee = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      const staffPayload: any = {
        firstName: employeeForm.firstName,
        lastName: employeeForm.lastName,
        gender: employeeForm.gender,
        dateOfBirth: employeeForm.dateOfBirth || undefined,
        idNumber: employeeForm.idNumber || undefined,
        phone: employeeForm.phone || undefined,
        email: employeeForm.email || undefined,
        staffNumber: employeeForm.staffNumber || undefined,
        jobTitle: employeeForm.jobTitle,
        jobCategory: employeeForm.jobCategory,
        departmentId: employeeForm.departmentId || undefined,
        contractType: employeeForm.contractType,
        hireDate: employeeForm.hireDate || today,
        contractEndDate: employeeForm.contractEndDate || undefined,
        basicSalary: Number(employeeForm.basicSalary || 0),
        bankName: employeeForm.bankName || undefined,
        bankAccount: employeeForm.bankAccount || undefined,
        professionalRegNumber: employeeForm.professionalRegNumber || undefined,
        licenseNumber: employeeForm.professionalRegNumber || undefined,
        regExpiryDate: employeeForm.regExpiryDate || undefined,
        photoUrl: employeeForm.photoUrl || undefined,
        employmentStatus: "ACTIVE",
        status: "ACTIVE",
      };
      const created = await api.post("/staff", { data: staffPayload, roleTitle: employeeForm.jobTitle, departmentId: employeeForm.departmentId || undefined });
      await api.post("/hr/records", {
        recordType: "lifecycle_event",
        title: "Employee profile created",
        staffId: created.data?.id,
        status: "ACTIVE",
        effectiveDate: employeeForm.hireDate,
        tags: ["onboarding", "profile"],
        data: {
          eventType: "ONBOARDING",
          nextOfKinName: employeeForm.nextOfKinName,
          nextOfKinPhone: employeeForm.nextOfKinPhone,
          education: employeeForm.education,
          contractType: employeeForm.contractType,
          bankName: employeeForm.bankName,
          photoUrl: employeeForm.photoUrl.trim() || undefined,
        },
      });
      setEmployeeForm(emptyEmployee);
      setModal("");
      showNotice("Employee profile and onboarding record saved.");
      await loadData();
    } catch (err: any) {
      showNotice(String(err?.response?.data?.message || err?.message || "Employee could not be saved."), "error");
    } finally {
      setSaving(false);
    }
  };

  const saveRegistration = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      await api.post("/hr/records", {
        recordType: "credential_verification",
        title: `${registrationForm.board} registration renewal`,
        staffId: registrationForm.staffId,
        status: new Date(registrationForm.expiryDate) < new Date() ? "EXPIRED" : "ACTIVE",
        effectiveDate: registrationForm.expiryDate,
        tags: ["registration", registrationForm.board],
        data: {
          ...registrationForm,
          expiryDate: registrationForm.expiryDate,
          accessRule: "Deactivate clinical documentation access if renewal is not recorded by expiry.",
        },
      });
      await api.patch(`/staff/${registrationForm.staffId}`, {
        professionalRegNumber: registrationForm.professionalRegNumber,
        licenseNumber: registrationForm.professionalRegNumber,
        regExpiryDate: registrationForm.expiryDate,
        jobCategory: registrationForm.board,
      });
      setRegistrationForm(emptyRegistration);
      setModal("");
      showNotice("Professional registration saved and employee profile updated.");
      await loadData();
    } catch (err: any) {
      showNotice(String(err?.response?.data?.message || err?.message || "Professional registration could not be saved."), "error");
    } finally {
      setSaving(false);
    }
  };

  const saveLeave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      await api.post("/hr/leave/request", {
        staffId: leaveForm.staffId,
        leaveType: leaveForm.leaveType,
        startDate: leaveForm.startDate,
        endDate: leaveForm.endDate,
      });
      await api.post("/hr/records", {
        recordType: "leave_workflow",
        title: `${leaveForm.leaveType} leave application`,
        staffId: leaveForm.staffId,
        status: "PENDING_MANAGER",
        effectiveDate: leaveForm.startDate,
        tags: ["leave", leaveForm.leaveType],
        data: { ...leaveForm, daysApplied: daysBetween(leaveForm.startDate, leaveForm.endDate), requiresHrApproval: daysBetween(leaveForm.startDate, leaveForm.endDate) > 10, certificateRequired: leaveForm.leaveType === "SICK" && daysBetween(leaveForm.startDate, leaveForm.endDate) > 3 },
      });
      setLeaveForm(emptyLeave);
      setModal("");
      showNotice("Leave request submitted for manager approval.");
      await loadData();
    } catch (err: any) {
      showNotice(String(err?.response?.data?.message || err?.message || "Leave request failed."), "error");
    } finally {
      setSaving(false);
    }
  };

  const updateLeave = async (id: string, status: string) => {
    try {
      const updated = await api.patch(`/hr/leave/${id}/status`, { status });
      const leave = updated.data;
      const workflow = records.find((row) => row.recordType === "leave_workflow" && row.staffId === leave.staffId && row.effectiveDate?.slice(0, 10) === String(leave.startDate || "").slice(0, 10));
      if (workflow?.id) {
        await api.patch(`/hr/records/${workflow.id}`, {
          status: status === "APPROVED" ? "APPROVED" : "REJECTED",
          data: { ...(workflow.data || {}), leaveStatus: status, reviewedAt: new Date().toISOString() },
        });
      }
      showNotice(`Leave marked ${status.toLowerCase()}.`);
      await loadData();
    } catch (err: any) {
      showNotice(String(err?.response?.data?.message || err?.message || "Leave update failed."), "error");
    }
  };

  const saveDiscipline = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const bypassWarning = disciplineForm.severity === "GROSS_MISCONDUCT";
    void saveRecord("disciplinary_case", {
      ...disciplineForm,
      title: `${disciplineForm.category} disciplinary case`,
      status: disciplineForm.hearingDate ? "HEARING_SCHEDULED" : "OPEN",
      effectiveDate: disciplineForm.incidentDate,
      proceduralCheck: disciplineForm.step === "WRITTEN_WARNING" && !bypassWarning ? "Confirm verbal warning was documented first." : "Compliant",
      tags: ["discipline", disciplineForm.category, disciplineForm.severity],
    }, "Disciplinary case saved.", () => setDisciplineForm(emptyDiscipline));
  };

  const saveAppraisal = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void saveRecord("performance_appraisal", {
      ...appraisalForm,
      title: `${appraisalForm.reviewPeriod} appraisal`,
      status: appraisalForm.signedByStaff && appraisalForm.signedByManager ? "SIGNED" : "IN_PROGRESS",
      effectiveDate: appraisalForm.reviewDate,
      triggersPip: appraisalForm.rating === "BELOW_EXPECTATIONS",
      meritIncrementEligible: appraisalForm.rating === "OUTSTANDING",
      tags: ["appraisal", appraisalForm.rating],
    }, "Performance appraisal saved.", () => setAppraisalForm(emptyAppraisal));
  };

  const saveLifecycle = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const isExit = lifecycleForm.eventType === "EXIT_PROCESS";
    await saveRecord(isExit ? "exit_clearance" : "lifecycle_event", {
      ...lifecycleForm,
      title: lifecycleForm.title || lifecycleForm.eventType.replaceAll("_", " "),
      status: isExit ? lifecycleForm.clearanceStatus : "RECORDED",
      tags: ["lifecycle", lifecycleForm.eventType],
    }, isExit ? "Exit clearance record saved." : "Lifecycle event saved.", () => setLifecycleForm(emptyLifecycle));
  };

  const clockIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      await api.post("/hr/attendance/clock-in", { staffId: clockStaffId });
      setClockStaffId("");
      setModal("");
      showNotice("Clock-in recorded.");
      await loadData();
    } catch (err: any) {
      showNotice(String(err?.response?.data?.message || err?.message || "Clock-in failed."), "error");
    } finally {
      setSaving(false);
    }
  };

  const clockOut = async (id: string) => {
    try {
      await api.patch(`/hr/attendance/${id}/clock-out`);
      showNotice("Clock-out recorded.");
      await loadData();
    } catch (err: any) {
      showNotice(String(err?.response?.data?.message || err?.message || "Clock-out failed."), "error");
    }
  };

  return (
    <main className="hr-page">
      <header className="hr-header">
        <div>
          <h1>Human Resources</h1>
          <p>Employee lifecycle, professional registration, leave approvals, disciplinary records, appraisals, attendance, and payroll handoff.</p>
        </div>
        <div className="hr-actions">
          <button className="hr-btn ghost" type="button" onClick={() => void loadData()} disabled={loading}><RefreshCw size={17} /> Refresh</button>
          <button className="hr-btn green" type="button" onClick={() => setModal("employee")}><UserPlus size={17} /> Employee Profile</button>
          <button className="hr-btn blue" type="button" onClick={() => setModal("leave")}><CalendarDays size={17} /> Leave Request</button>
          <button className="hr-btn purple" type="button" onClick={() => router.push("/payroll")}><WalletCards size={17} /> Payroll &amp; Compensation</button>
        </div>
      </header>

      <section className="hr-stats">
        {stats.map((stat) => <article className="hr-stat" style={{ borderLeftColor: stat.color }} key={stat.label}><div><span>{stat.label}</span><strong>{stat.value}</strong></div><i style={{ color: stat.color }}>{stat.icon}</i></article>)}
      </section>

      <section className="hr-filter-panel">
        <label className="hr-search"><Search size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search staff, role, phone, registration..." /></label>
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="ALL">All status</option><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option><option value="TERMINATED">Terminated</option></select>
        <button type="button" onClick={() => setModal("registration")}>Registration</button>
        <button type="button" onClick={() => setModal("discipline")}>Disciplinary Case</button>
        <button type="button" onClick={() => setModal("appraisal")}>Appraisal</button>
        <button type="button" onClick={() => setModal("lifecycle")}>Lifecycle / Exit</button>
        <button type="button" onClick={() => setModal("clock")}>Clock In</button>
      </section>

      {sourceErrors.length ? <div className="hr-source-warning" role="status"><AlertTriangle size={16} /> Some HR data may be incomplete. Check your connection or permissions, then refresh.</div> : null}

      <section className="hr-grid">
        <div className="hr-main">
          <HrPanel title="Employee Lifecycle Register">
            <HrTable>
              <thead><tr><th>Employee</th><th>Role</th><th>Contract</th><th>Registration</th><th>Hire Date</th><th>Status</th></tr></thead>
              <tbody>{filteredStaff.length ? filteredStaff.map((row) => <tr key={row.id} onClick={() => setSelected(row)}><td><strong>{staffName(row)}</strong><small>{row.staffNumber || row.id}</small></td><td>{row.jobTitle || "-"}<small>{row.jobCategory || "-"}</small></td><td>{row.contractType || "-"}<small>{money(row.basicSalary)}</small></td><td>{row.professionalRegNumber || row.licenseNumber || "-"}<small>{fmtDate(row.regExpiryDate)}</small></td><td>{fmtDate(row.hireDate)}</td><td><span className="hr-pill">{row.employmentStatus || row.status || "ACTIVE"}</span></td></tr>) : <tr><td colSpan={6} className="hr-empty">No employees found.</td></tr>}</tbody>
            </HrTable>
          </HrPanel>

          <HrPanel title="Leave Calendar and Approval Workflow">
            <HrTable>
              <thead><tr><th>Employee</th><th>Leave</th><th>Dates</th><th>Days</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>{leaves.length ? leaves.slice(0, 12).map((row) => <tr key={row.id} onClick={() => setSelected(row)}><td><strong>{staffName(row.staff)}</strong><small>{row.staff?.staffNumber || row.staffId}</small></td><td>{row.leaveType}</td><td>{fmtDate(row.startDate)} to {fmtDate(row.endDate)}</td><td>{daysBetween(row.startDate, row.endDate)}</td><td><span className="hr-pill">{row.status}</span></td><td><div className="hr-row-actions"><button type="button" disabled={row.status !== "PENDING"} onClick={(e) => { e.stopPropagation(); void updateLeave(row.id, "APPROVED"); }}>Approve</button><button type="button" disabled={row.status !== "PENDING"} onClick={(e) => { e.stopPropagation(); void updateLeave(row.id, "REJECTED"); }}>Reject</button></div></td></tr>) : <tr><td colSpan={6} className="hr-empty">No leave applications recorded.</td></tr>}</tbody>
            </HrTable>
          </HrPanel>
        </div>

        <aside className="hr-side">
          <section className="hr-selected">
            <span>Selected HR Record</span>
            <h2>{selectedTitle(selected)}</h2>
            <dl><div><dt>Status</dt><dd>{selected?.employmentStatus || selected?.status || "-"}</dd></div><div><dt>Role</dt><dd>{selected?.jobTitle || selected?.recordType || "-"}</dd></div><div><dt>Effective</dt><dd>{fmtDate(selected?.effectiveDate || selected?.hireDate || selected?.startDate)}</dd></div></dl>
          </section>

          <HrPanel title="Professional Registration Monitoring">{credentialAlerts.length ? <div className="hr-list">{credentialAlerts.slice(0, 7).map((row) => <button key={row.id} type="button" onClick={() => setSelected(row)}><span><strong>{row.staffName || row.title}</strong><small>{row.board || row.data?.board || "Board"} · expires {fmtDate(row.expiryDate)}</small></span><b>{row.daysLeft}d</b></button>)}</div> : <p className="hr-note">No registration expiry alerts within 90 days.</p>}</HrPanel>
          <HrPanel title="Disciplinary Case Management">{openDiscipline.length ? <div className="hr-list">{openDiscipline.slice(0, 6).map((row) => <button key={row.id} type="button" onClick={() => setSelected(row)}><span><strong>{row.title}</strong><small>{row.data?.step || "Process"} · {row.data?.category || "Case"}</small></span><b>{row.status}</b></button>)}</div> : <p className="hr-note">No open disciplinary cases.</p>}</HrPanel>
          <HrPanel title="Performance Appraisal Workflow">{(recordsByType.performance_appraisal || []).length ? <div className="hr-list">{(recordsByType.performance_appraisal || []).slice(0, 6).map((row) => <button key={row.id} type="button" onClick={() => setSelected(row)}><span><strong>{row.title}</strong><small>{row.data?.rating || "Rating"} · {row.data?.meetingDate || "Meeting pending"}</small></span><b>{row.status}</b></button>)}</div> : <p className="hr-note">No appraisal records yet.</p>}</HrPanel>
          <HrPanel title="Lifecycle and Exit Events">{lifecycleEvents.length ? <div className="hr-list">{lifecycleEvents.slice(0, 6).map((row) => <button key={row.id} type="button" onClick={() => setSelected(row)}><span><strong>{row.title}</strong><small>{row.data?.eventType || "Lifecycle"} · {fmtDate(row.effectiveDate)}</small></span><b>{row.status}</b></button>)}</div> : <p className="hr-note">No lifecycle events recorded yet.</p>}</HrPanel>
          <HrPanel title="Attendance Open Shifts">{attendance.filter((row) => row.clockIn && !row.clockOut).length ? <div className="hr-list">{attendance.filter((row) => row.clockIn && !row.clockOut).slice(0, 5).map((row) => <button key={row.id} type="button" onClick={() => setSelected(row)}><span><strong>{staffName(row.staff)}</strong><small>Clocked in {new Date(row.clockIn).toLocaleTimeString()}</small></span><b onClick={(e) => { e.stopPropagation(); void clockOut(row.id); }}>Out</b></button>)}</div> : <p className="hr-note">No open attendance shifts.</p>}</HrPanel>
        </aside>
      </section>

      {notice ? <div className={`hr-toast ${notice.tone}`} role="status"><div className="hr-toast-icon">{notice.tone === "success" ? <CheckCircle2 size={19} /> : <AlertTriangle size={19} />}</div><div className="hr-toast-copy"><strong>{notice.tone === "error" ? "Error" : notice.tone === "warning" ? "Attention" : "Saved"}</strong><span>{notice.text}</span></div><button type="button" onClick={() => setNotice(null)} aria-label="Dismiss notification">×</button></div> : null}
      {loading ? <div className="hr-loading">Loading human resources...</div> : null}

      {modal === "employee" ? <HrModal title="Complete Employee Profile" tone="green" onClose={() => setModal("")}><form className="hr-form" onSubmit={saveEmployee}><Text label="First name" value={employeeForm.firstName} onChange={(v) => setEmployeeForm((f) => ({ ...f, firstName: v }))} required /><Text label="Last name" value={employeeForm.lastName} onChange={(v) => setEmployeeForm((f) => ({ ...f, lastName: v }))} required /><Select label="Gender" value={employeeForm.gender} onChange={(v) => setEmployeeForm((f) => ({ ...f, gender: v }))} options={["UNKNOWN", "FEMALE", "MALE", "OTHER"]} /><Text label="Date of birth" type="date" value={employeeForm.dateOfBirth} onChange={(v) => setEmployeeForm((f) => ({ ...f, dateOfBirth: v }))} /><Text label="National ID" value={employeeForm.idNumber} onChange={(v) => setEmployeeForm((f) => ({ ...f, idNumber: v }))} /><Text label="Phone" value={employeeForm.phone} onChange={(v) => setEmployeeForm((f) => ({ ...f, phone: v }))} /><Text label="Email" type="email" value={employeeForm.email} onChange={(v) => setEmployeeForm((f) => ({ ...f, email: v }))} /><Text label="Staff number" value={employeeForm.staffNumber} onChange={(v) => setEmployeeForm((f) => ({ ...f, staffNumber: v }))} /><Text label="Job title" value={employeeForm.jobTitle} onChange={(v) => setEmployeeForm((f) => ({ ...f, jobTitle: v }))} required /><Select label="Job category (from setup)" value={employeeForm.jobCategory} onChange={(v) => setEmployeeForm((f) => ({ ...f, jobCategory: v }))} options={jobCategories} /><Select label="Department (from setup)" value={employeeForm.departmentId} onChange={(v) => setEmployeeForm((f) => ({ ...f, departmentId: v }))} options={departments.length ? departments.map((row) => row.id) : [""]} labels={Object.fromEntries(departments.map((row) => [row.id, `${row.name}${row.type ? ` · ${row.type}` : ""}`]))} /><Select label="Contract type" value={employeeForm.contractType} onChange={(v) => setEmployeeForm((f) => ({ ...f, contractType: v }))} options={["FULL_TIME", "PART_TIME", "LOCUM", "CONTRACT", "INTERN"]} /><Text label="Hire date" type="date" value={employeeForm.hireDate} onChange={(v) => setEmployeeForm((f) => ({ ...f, hireDate: v }))} /><Text label="Contract end" type="date" value={employeeForm.contractEndDate} onChange={(v) => setEmployeeForm((f) => ({ ...f, contractEndDate: v }))} /><Text label="Basic salary" type="number" value={employeeForm.basicSalary} onChange={(v) => setEmployeeForm((f) => ({ ...f, basicSalary: v }))} /><Text label="Bank name" value={employeeForm.bankName} onChange={(v) => setEmployeeForm((f) => ({ ...f, bankName: v }))} /><Text label="Bank account" value={employeeForm.bankAccount} onChange={(v) => setEmployeeForm((f) => ({ ...f, bankAccount: v }))} /><Text label="Professional reg no." value={employeeForm.professionalRegNumber} onChange={(v) => setEmployeeForm((f) => ({ ...f, professionalRegNumber: v }))} /><Text label="Reg expiry" type="date" value={employeeForm.regExpiryDate} onChange={(v) => setEmployeeForm((f) => ({ ...f, regExpiryDate: v }))} /><UploadField label="Image URL / upload (optional)" value={employeeForm.photoUrl} onChange={(v) => setEmployeeForm((f) => ({ ...f, photoUrl: v }))} accept="image/*" imagePreview /><Text label="Next of kin" value={employeeForm.nextOfKinName} onChange={(v) => setEmployeeForm((f) => ({ ...f, nextOfKinName: v }))} /><Text label="Next of kin phone" value={employeeForm.nextOfKinPhone} onChange={(v) => setEmployeeForm((f) => ({ ...f, nextOfKinPhone: v }))} /><Area label="Education and qualifications" value={employeeForm.education} onChange={(v) => setEmployeeForm((f) => ({ ...f, education: v }))} /><Footer saving={saving} onCancel={() => setModal("")} label="Save Employee" /></form></HrModal> : null}
      {modal === "registration" ? <HrModal title="Professional Registration" tone="blue" onClose={() => setModal("")}><form className="hr-form" onSubmit={saveRegistration}><StaffSelect staff={staff} label="Employee" value={registrationForm.staffId} onChange={(v) => setRegistrationForm((f) => ({ ...f, staffId: v }))} /><Select label="Board" value={registrationForm.board} onChange={(v) => setRegistrationForm((f) => ({ ...f, board: v }))} options={["KMPDB", "NCK", "KPS", "KMLTTB", "KPA", "KDA"]} /><Text label="Registration number" value={registrationForm.professionalRegNumber} onChange={(v) => setRegistrationForm((f) => ({ ...f, professionalRegNumber: v }))} required /><Text label="Expiry date" type="date" value={registrationForm.expiryDate} onChange={(v) => setRegistrationForm((f) => ({ ...f, expiryDate: v }))} required /><UploadField label="Certificate URL / upload (optional)" value={registrationForm.certificateUrl} onChange={(v) => setRegistrationForm((f) => ({ ...f, certificateUrl: v }))} accept=".pdf,image/*" /><Area label="Renewal notes" value={registrationForm.notes} onChange={(v) => setRegistrationForm((f) => ({ ...f, notes: v }))} /><Footer saving={saving} onCancel={() => setModal("")} label="Save Registration" /></form></HrModal> : null}
      {modal === "leave" ? <HrModal title="Leave Application" tone="blue" onClose={() => setModal("")}><form className="hr-form" onSubmit={saveLeave}><StaffSelect staff={staff} label="Employee" value={leaveForm.staffId} onChange={(v) => setLeaveForm((f) => ({ ...f, staffId: v }))} /><Select label="Leave type" value={leaveForm.leaveType} onChange={(v) => setLeaveForm((f) => ({ ...f, leaveType: v }))} options={["ANNUAL", "SICK", "MATERNITY", "PATERNITY", "COMPASSIONATE", "STUDY"]} /><Text label="Start date" type="date" value={leaveForm.startDate} onChange={(v) => setLeaveForm((f) => ({ ...f, startDate: v }))} required /><Text label="End date" type="date" value={leaveForm.endDate} onChange={(v) => setLeaveForm((f) => ({ ...f, endDate: v }))} required /><UploadField label="Medical certificate URL / upload (optional)" value={leaveForm.medicalCertificateUrl} onChange={(v) => setLeaveForm((f) => ({ ...f, medicalCertificateUrl: v }))} accept=".pdf,image/*" /><Area label={`Reason (${daysBetween(leaveForm.startDate, leaveForm.endDate)} day(s), HR approval ${daysBetween(leaveForm.startDate, leaveForm.endDate) > 10 ? "required" : "not required"})`} value={leaveForm.reason} onChange={(v) => setLeaveForm((f) => ({ ...f, reason: v }))} /><Footer saving={saving} onCancel={() => setModal("")} label="Submit Leave" /></form></HrModal> : null}
      {modal === "discipline" ? <HrModal title="Disciplinary Case" tone="red" onClose={() => setModal("")}><form className="hr-form" onSubmit={saveDiscipline}><StaffSelect staff={staff} label="Employee" value={disciplineForm.staffId} onChange={(v) => setDisciplineForm((f) => ({ ...f, staffId: v }))} /><Text label="Incident date" type="date" value={disciplineForm.incidentDate} onChange={(v) => setDisciplineForm((f) => ({ ...f, incidentDate: v }))} /><Select label="Category" value={disciplineForm.category} onChange={(v) => setDisciplineForm((f) => ({ ...f, category: v }))} options={["CONDUCT", "ABSENTEEISM", "NEGLIGENCE", "GROSS_MISCONDUCT", "PATIENT_COMPLAINT"]} /><Select label="Severity" value={disciplineForm.severity} onChange={(v) => setDisciplineForm((f) => ({ ...f, severity: v }))} options={["STANDARD", "SERIOUS", "GROSS_MISCONDUCT"]} /><Select label="Process step" value={disciplineForm.step} onChange={(v) => setDisciplineForm((f) => ({ ...f, step: v }))} options={["VERBAL_WARNING", "WRITTEN_WARNING", "NOTICE_TO_SHOW_CAUSE", "HEARING", "SUSPENSION", "FINAL_SANCTION"]} /><Text label="Hearing date" type="date" value={disciplineForm.hearingDate} onChange={(v) => setDisciplineForm((f) => ({ ...f, hearingDate: v }))} /><UploadField label="Document URL / upload (optional)" value={disciplineForm.documentUrl} onChange={(v) => setDisciplineForm((f) => ({ ...f, documentUrl: v }))} accept=".pdf,image/*" /><Text label="Sanction" value={disciplineForm.sanction} onChange={(v) => setDisciplineForm((f) => ({ ...f, sanction: v }))} /><Area label="Description" value={disciplineForm.description} onChange={(v) => setDisciplineForm((f) => ({ ...f, description: v }))} /><Area label="Hearing outcome / response" value={disciplineForm.outcome} onChange={(v) => setDisciplineForm((f) => ({ ...f, outcome: v }))} /><Footer saving={saving} onCancel={() => setModal("")} label="Save Case" /></form></HrModal> : null}
      {modal === "appraisal" ? <HrModal title="Performance Appraisal" tone="purple" onClose={() => setModal("")}><form className="hr-form" onSubmit={saveAppraisal}><StaffSelect staff={staff} label="Employee" value={appraisalForm.staffId} onChange={(v) => setAppraisalForm((f) => ({ ...f, staffId: v }))} /><Text label="Review period" value={appraisalForm.reviewPeriod} onChange={(v) => setAppraisalForm((f) => ({ ...f, reviewPeriod: v }))} /><Text label="Review date" type="date" value={appraisalForm.reviewDate} onChange={(v) => setAppraisalForm((f) => ({ ...f, reviewDate: v }))} /><Select label="Rating" value={appraisalForm.rating} onChange={(v) => setAppraisalForm((f) => ({ ...f, rating: v }))} options={["OUTSTANDING", "MEETS_EXPECTATIONS", "BELOW_EXPECTATIONS"]} /><Text label="Meeting date" type="date" value={appraisalForm.meetingDate} onChange={(v) => setAppraisalForm((f) => ({ ...f, meetingDate: v }))} /><label className="hr-check"><input type="checkbox" checked={appraisalForm.signedByStaff} onChange={(e) => setAppraisalForm((f) => ({ ...f, signedByStaff: e.target.checked }))} /> Staff signed</label><label className="hr-check"><input type="checkbox" checked={appraisalForm.signedByManager} onChange={(e) => setAppraisalForm((f) => ({ ...f, signedByManager: e.target.checked }))} /> Manager signed</label><Area label="Self evaluation" value={appraisalForm.selfEvaluation} onChange={(v) => setAppraisalForm((f) => ({ ...f, selfEvaluation: v }))} /><Area label="Manager evaluation" value={appraisalForm.managerEvaluation} onChange={(v) => setAppraisalForm((f) => ({ ...f, managerEvaluation: v }))} /><Area label="Goals for next period" value={appraisalForm.goals} onChange={(v) => setAppraisalForm((f) => ({ ...f, goals: v }))} /><Area label="Development needs" value={appraisalForm.developmentNeeds} onChange={(v) => setAppraisalForm((f) => ({ ...f, developmentNeeds: v }))} /><Footer saving={saving} onCancel={() => setModal("")} label="Save Appraisal" /></form></HrModal> : null}
      {modal === "lifecycle" ? <HrModal title="Lifecycle / Exit Event" tone="orange" onClose={() => setModal("")}><form className="hr-form" onSubmit={saveLifecycle}><StaffSelect staff={staff} label="Employee" value={lifecycleForm.staffId} onChange={(v) => setLifecycleForm((f) => ({ ...f, staffId: v }))} /><Select label="Event type" value={lifecycleForm.eventType} onChange={(v) => setLifecycleForm((f) => ({ ...f, eventType: v }))} options={["PROBATION_REVIEW", "CONFIRMATION", "SALARY_INCREMENT", "PROMOTION", "TRANSFER", "TRAINING", "TERMS_CHANGE", "EXIT_PROCESS"]} /><Text label="Effective date" type="date" value={lifecycleForm.effectiveDate} onChange={(v) => setLifecycleForm((f) => ({ ...f, effectiveDate: v }))} /><Text label="Title" value={lifecycleForm.title} onChange={(v) => setLifecycleForm((f) => ({ ...f, title: v }))} /><Text label="New department / destination" value={lifecycleForm.newDepartment} onChange={(v) => setLifecycleForm((f) => ({ ...f, newDepartment: v }))} /><Text label="Salary amount" type="number" value={lifecycleForm.salaryAmount} onChange={(v) => setLifecycleForm((f) => ({ ...f, salaryAmount: v }))} /><Select label="Clearance status" value={lifecycleForm.clearanceStatus} onChange={(v) => setLifecycleForm((f) => ({ ...f, clearanceStatus: v }))} options={["PENDING", "KEYS_RETURNED", "EQUIPMENT_RETURNED", "LOAN_REPAID", "FINAL_PAY_READY", "CLEARED"]} /><Area label="Notes / exit interview / clearance" value={lifecycleForm.notes} onChange={(v) => setLifecycleForm((f) => ({ ...f, notes: v }))} /><Footer saving={saving} onCancel={() => setModal("")} label="Save Event" /></form></HrModal> : null}
      {modal === "clock" ? <HrModal title="Staff Clock-In" tone="green" onClose={() => setModal("")}><form className="hr-form" onSubmit={clockIn}><StaffSelect staff={staff} label="Employee" value={clockStaffId} onChange={setClockStaffId} /><Footer saving={saving} onCancel={() => setModal("")} label="Clock In" /></form></HrModal> : null}
    </main>
  );
}

function HrPanel({ title, children }: { title: string; children: ReactNode }) {
  return <section className="hr-panel"><div className="hr-panel-title"><h2>{title}</h2></div>{children}</section>;
}

function HrTable({ children }: { children: ReactNode }) {
  return <div className="hr-table-wrap"><table className="hr-table">{children}</table></div>;
}

function HrModal({ title, tone, onClose, children }: { title: string; tone: string; onClose: () => void; children: ReactNode }) {
  return <div className="hr-modal-backdrop"><section className={`hr-modal is-${tone}`} role="dialog" aria-modal="true" aria-labelledby="hr-modal-title"><header><div className="hr-modal-heading"><span className="hr-modal-icon"><BriefcaseBusiness size={19} /></span><div><span className="hr-modal-kicker">Human Resources</span><h2 id="hr-modal-title">{title}</h2></div></div><button type="button" onClick={onClose} aria-label="Close form"><X size={17} /></button></header>{children}</section></div>;
}

function StaffSelect({ staff, label, value, onChange }: { staff: any[]; label: string; value: string; onChange: (value: string) => void }) {
  return <label><span>{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} required><option value="">Select employee</option>{staff.map((row) => <option value={row.id} key={row.id}>{staffName(row)} - {row.staffNumber || row.jobTitle || row.id}</option>)}</select></label>;
}

function UploadField({ label, value, onChange, accept, imagePreview = false }: { label: string; value: string; onChange: (value: string) => void; accept: string; imagePreview?: boolean }) {
  const isImage = imagePreview && (value.startsWith("data:image/") || /\.(png|jpe?g|gif|webp|svg)(?:$|\?)/i.test(value));
  const handleFile = (file?: File) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return;
    const reader = new FileReader();
    reader.onload = () => onChange(String(reader.result || ""));
    reader.readAsDataURL(file);
  };
  return <label className="hr-upload-field"><span>{label}</span><input type="url" value={value.startsWith("data:") ? "" : value} onChange={(event) => onChange(event.target.value)} placeholder="Paste a URL or choose a file" /><span className="hr-upload-control"><FileUp size={15} /><input type="file" accept={accept} onChange={(event) => handleFile(event.target.files?.[0])} /></span>{value ? <span className="hr-upload-preview">{isImage ? <img src={value} alt="Uploaded preview" /> : <a href={value} target="_blank" rel="noreferrer">Uploaded file / document</a>}</span> : null}</label>;
}

function Text({ label, value, onChange, type = "text", required = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean }) {
  return <label><span>{label}</span><input type={type} value={value} onChange={(event) => onChange(event.target.value)} required={required} /></label>;
}

function Area({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="wide"><span>{label}</span><textarea value={value} onChange={(event) => onChange(event.target.value)} /></label>;
}

function Select({ label, value, onChange, options, labels = {} }: { label: string; value: string; onChange: (value: string) => void; options: string[]; labels?: Record<string, string> }) {
  return <label><span>{label}</span><select value={value} onChange={(event) => onChange(event.target.value)}>{options.map((option) => <option value={option} key={option}>{option ? labels[option] || option.replaceAll("_", " ") : "Select"}</option>)}</select></label>;
}

function Footer({ saving, onCancel, label }: { saving: boolean; onCancel: () => void; label: string }) {
  return <footer><button type="button" onClick={onCancel}>Cancel</button><button type="submit" disabled={saving}>{saving ? "Saving..." : label}</button></footer>;
}
