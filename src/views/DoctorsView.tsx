"use client";

import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import { AlertCircle, Award, BadgeCheck, BriefcaseMedical, CalendarClock, CheckCircle2, CircleX, GraduationCap, RefreshCw, Search, ShieldCheck, Stethoscope, UserPlus, Users, X } from "lucide-react";
import { api } from "../lib/api";

const today = new Date().toISOString().slice(0, 10);
const dateTimeLocal = (offsetHours = 0) => new Date(Date.now() + offsetHours * 60 * 60 * 1000).toISOString().slice(0, 16);
const money = (value: unknown) => `KES ${Number(value || 0).toLocaleString("en-KE", { maximumFractionDigits: 0 })}`;
const unwrapRows = (value: any): any[] => {
  const data = value?.data ?? value;
  if (Array.isArray(data)) return data;
  for (const candidate of [data?.items, data?.rows, data?.results, data?.data, data?.profiles, data?.records]) {
    if (Array.isArray(candidate)) return candidate;
  }
  return [];
};

const emptyProfile = { staffId: "", specialization: "", licenseNumber: "", licenseValidUntil: today, credentialVerified: true, privilegeScope: "", isHeadDoctor: false, status: "ACTIVE", workloadScore: "0" };
const emptyPrivilege = { doctorProfileId: "", privilegeName: "", privilegeCode: "", scope: "", canOperate: false, canPrescribeRestricted: false, validUntil: today, status: "ACTIVE" };
const emptyCheck = { staffId: "", procedure: "" };
const emptyOnCall = { doctorProfileId: "", specialty: "", clinicalArea: "General", startTime: dateTimeLocal(), endTime: dateTimeLocal(12), contactPhone: "", allowanceRate: "0", status: "ACTIVE" };
const emptyCme = { doctorProfileId: "", activityTitle: "", activityType: "COURSE", provider: "Hospital CME", activityDate: today, points: "0", renewalCycle: "Current 2-year cycle", evidenceUrl: "" };
const emptyVisitor = { specialistName: "", specialty: "", visitingSchedule: "Third Tuesday of every month", clinicDays: "", specialistFee: "", indemnityValidUntil: today, agreementReference: "", appointmentBookingEnabled: true, status: "ACTIVE" };
const emptyCredential = { doctorProfileId: "", credentialType: "PROFESSIONAL_REGISTRATION", issuingInstitution: "", registrationAuthority: "", registrationNumber: "", certificateNumber: "", issueDate: today, expiryDate: today, supportingDocumentUrl: "", verificationNotes: "" };

export default function DoctorsPage() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [privileges, setPrivileges] = useState<any[]>([]);
  const [onCall, setOnCall] = useState<any[]>([]);
  const [cme, setCme] = useState<any[]>([]);
  const [visitors, setVisitors] = useState<any[]>([]);
  const [credentials, setCredentials] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selected, setSelected] = useState<any>(null);
  const [activeStat, setActiveStat] = useState("");
  const [modal, setModal] = useState<"profile" | "privilege" | "check" | "oncall" | "cme" | "visitor" | "credential" | "">("");
  const [profileForm, setProfileForm] = useState(emptyProfile);
  const [privilegeForm, setPrivilegeForm] = useState(emptyPrivilege);
  const [checkForm, setCheckForm] = useState(emptyCheck);
  const [onCallForm, setOnCallForm] = useState(emptyOnCall);
  const [cmeForm, setCmeForm] = useState(emptyCme);
  const [visitorForm, setVisitorForm] = useState(emptyVisitor);
  const [credentialForm, setCredentialForm] = useState(emptyCredential);
  const [checkResult, setCheckResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ tone: "success" | "warning" | "error"; text: string } | null>(null);

  const showNotice = (text: string, tone: "success" | "warning" | "error" = "success") => {
    setNotice({ text, tone });
    window.setTimeout(() => setNotice(null), tone === "success" ? 2600 : 4400);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const results = await Promise.allSettled([
        api.get("/doctor-management/dashboard"),
        api.get("/doctor-management/profiles"),
        api.get("/doctor-management/privileges"),
        api.get("/doctor-management/on-call"),
        api.get("/doctor-management/cme"),
        api.get("/doctor-management/visiting-specialists"),
        api.get("/doctor-management/credentials").catch(() => ({ data: [] })),
        api.get("/staff").catch(() => ({ data: [] })),
      ]);
      const value = (index: number) => results[index].status === "fulfilled" ? (results[index] as PromiseFulfilledResult<any>).value?.data : null;
      const labels = ["dashboard", "doctor profiles", "privileges", "on-call schedule", "CME records", "visiting specialists", "credentials", "staff directory"];
      const failed = results.map((result, index) => result.status === "rejected" ? labels[index] : "").filter(Boolean);
      if (failed.length) showNotice(`Some Doctor Management data could not be loaded: ${failed.join(", ")}.`, "warning");
      setDashboard(value(0) || null);
      setProfiles(unwrapRows(value(1)));
      setPrivileges(unwrapRows(value(2)));
      setOnCall(unwrapRows(value(3)));
      setCme(unwrapRows(value(4)));
      setVisitors(unwrapRows(value(5)));
      setCredentials(unwrapRows(value(6)));
      setStaff(unwrapRows(value(7)));
    } catch (err: any) {
      showNotice(String(err?.response?.data?.message || err?.message || "Doctor Management data could not be loaded."), "error");
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

  const doctorStaff = useMemo(() => staff.filter((row) => [row.jobTitle, row.jobCategory, row.cadre].join(" ").toLowerCase().includes("doctor") || [row.jobTitle, row.jobCategory].join(" ").toLowerCase().includes("medical")), [staff]);

  const filteredProfiles = useMemo(() => {
    const q = search.trim().toLowerCase();
    return profiles.filter((row) => {
      const name = doctorName(row);
      const hay = [name, row.specialization, row.licenseNumber, row.privilegeScope, row.status].join(" ").toLowerCase();
      return (!q || hay.includes(q)) && (statusFilter === "ALL" || row.status === statusFilter);
    });
  }, [profiles, search, statusFilter]);

  const stats = [
    { label: "Active Doctors", value: dashboard?.activeDoctors ?? profiles.filter((row) => row.status === "ACTIVE").length, color: "#2563eb", icon: <Stethoscope size={20} /> },
    { label: "Verified", value: dashboard?.verifiedDoctors ?? profiles.filter((row) => row.credentialVerified).length, color: "#16a34a", icon: <BadgeCheck size={20} /> },
    { label: "Expiring Credentials", value: dashboard?.expiringCredentials ?? 0, color: "#dc2626", icon: <Award size={20} /> },
    { label: "Privileges", value: dashboard?.activePrivileges ?? privileges.filter((row) => row.status === "ACTIVE").length, color: "#0f766e", icon: <ShieldCheck size={20} /> },
    { label: "On Call Now", value: dashboard?.onCallToday ?? 0, color: "#d97706", icon: <CalendarClock size={20} /> },
    { label: "CME At Risk", value: dashboard?.cmeAtRisk ?? 0, color: "#dc2626", icon: <GraduationCap size={20} /> },
    { label: "Visiting Specialists", value: dashboard?.visitingSpecialists ?? visitors.length, color: "#7c3aed", icon: <Users size={20} /> },
  ];

  const selectStat = (label: string, value: unknown) => {
    setActiveStat(label);
    setSelected({ doctorMetric: label, value, status: "DASHBOARD METRIC" });
    showNotice(`${label}: ${value}. Select a record below to view its details.`);
    window.requestAnimationFrame(() => document.querySelector(".doctor-grid")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  const openProfile = (profile?: any) => {
    if (profile) {
      setProfileForm({
        staffId: profile.staffId || "",
        specialization: profile.specialization || "",
        licenseNumber: profile.licenseNumber || "",
        licenseValidUntil: profile.licenseValidUntil ? String(profile.licenseValidUntil).slice(0, 10) : today,
        credentialVerified: Boolean(profile.credentialVerified),
        privilegeScope: profile.privilegeScope || "",
        isHeadDoctor: Boolean(profile.isHeadDoctor),
        status: profile.status || "ACTIVE",
        workloadScore: String(profile.workloadScore || 0),
      });
    } else setProfileForm(emptyProfile);
    setModal("profile");
  };

  const submitProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      await api.post("/doctor-management/profiles", { ...profileForm, workloadScore: Number(profileForm.workloadScore || 0) });
      setModal("");
      showNotice("Doctor credential profile saved.");
      await loadData();
    } catch (err: any) {
      showNotice(String(err?.response?.data?.message || err?.message || "Doctor profile could not be saved."), "error");
    } finally {
      setSaving(false);
    }
  };

  const submitPrivilege = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      await api.post("/doctor-management/privileges", privilegeForm);
      setPrivilegeForm(emptyPrivilege);
      setModal("");
      showNotice("Clinical privilege saved.");
      await loadData();
    } catch (err: any) {
      showNotice(String(err?.response?.data?.message || err?.message || "Privilege could not be saved."), "error");
    } finally {
      setSaving(false);
    }
  };

  const submitCheck = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      const res = await api.post("/doctor-management/privileges/check", checkForm);
      setCheckResult(res.data);
      showNotice(res.data?.allowed ? "Privilege check passed." : res.data?.reason || "Privilege check failed.", res.data?.allowed ? "success" : "warning");
    } catch (err: any) {
      showNotice(String(err?.response?.data?.message || err?.message || "Privilege check failed."), "error");
    } finally {
      setSaving(false);
    }
  };

  const submitOnCall = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      await api.post("/doctor-management/on-call", { ...onCallForm, allowanceRate: Number(onCallForm.allowanceRate || 0) });
      setOnCallForm(emptyOnCall);
      setModal("");
      showNotice("On-call roster entry saved.");
      await loadData();
    } catch (err: any) {
      showNotice(String(err?.response?.data?.message || err?.message || "On-call entry could not be saved."), "error");
    } finally {
      setSaving(false);
    }
  };

  const submitCme = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      await api.post("/doctor-management/cme", { ...cmeForm, points: Number(cmeForm.points || 0) });
      setCmeForm(emptyCme);
      setModal("");
      showNotice("CME activity recorded.");
      await loadData();
    } catch (err: any) {
      showNotice(String(err?.response?.data?.message || err?.message || "CME record could not be saved."), "error");
    } finally {
      setSaving(false);
    }
  };

  const submitVisitor = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      await api.post("/doctor-management/visiting-specialists", { ...visitorForm, specialistFee: Number(visitorForm.specialistFee || 0) });
      setVisitorForm(emptyVisitor);
      setModal("");
      showNotice("Visiting specialist agreement saved.");
      await loadData();
    } catch (err: any) {
      showNotice(String(err?.response?.data?.message || err?.message || "Visiting specialist could not be saved."), "error");
    } finally {
      setSaving(false);
    }
  };

  const submitCredential = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setSaving(true);
    try {
      await api.post("/doctor-management/credentials", credentialForm);
      setCredentialForm(emptyCredential); setModal(""); showNotice("Credential submitted for verification."); await loadData();
    } catch (err: any) { showNotice(String(err?.response?.data?.message || err?.message || "Credential could not be saved."), "error"); }
    finally { setSaving(false); }
  };

  return (
    <main className="doctor-page">
      <header className="doctor-header">
        <div><h1>Doctor Management</h1><p>Credential verification, clinical privileges, on-call schedules, CME tracking, and visiting specialist governance.</p></div>
        <div className="doctor-actions">
          <button className="doctor-btn ghost" type="button" onClick={() => void loadData()} disabled={loading}><RefreshCw size={17} /> Refresh</button>
          <button className="doctor-btn green" type="button" onClick={() => openProfile()}><UserPlus size={17} /> Doctor Profile</button>
          <button className="doctor-btn teal" type="button" onClick={() => setModal("privilege")}><ShieldCheck size={17} /> Privilege</button>
          <button className="doctor-btn amber" type="button" onClick={() => setModal("oncall")}><CalendarClock size={17} /> On Call</button>
          <button className="doctor-btn purple" type="button" onClick={() => setModal("cme")}><GraduationCap size={17} /> CME</button>
          <button className="doctor-btn blue" type="button" onClick={() => setModal("credential")}><Award size={17} /> Credential</button>
        </div>
      </header>

      <section className="doctor-stats" aria-label="Doctor Management statistics">{stats.map((stat) => <article className={`doctor-stat is-clickable ${activeStat === stat.label ? "is-active" : ""}`} style={{ borderLeftColor: stat.color }} key={stat.label} role="button" tabIndex={0} aria-pressed={activeStat === stat.label} onClick={() => selectStat(stat.label, stat.value)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); selectStat(stat.label, stat.value); } }}><div><span>{stat.label}</span><strong>{stat.value}</strong></div><i style={{ color: stat.color }}>{stat.icon}</i></article>)}</section>

      <section className="doctor-filter-panel">
        <label className="doctor-search"><Search size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search doctor, specialty, license, privilege..." /></label>
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="ALL">All statuses</option><option value="ACTIVE">Active</option><option value="SUSPENDED">Suspended</option><option value="VISITING">Visiting</option></select>
        <button className="doctor-btn blue" type="button" onClick={() => { setCheckResult(null); setModal("check"); }}><BadgeCheck size={17} /> Check Privilege</button>
        <button className="doctor-btn purple" type="button" onClick={() => setModal("visitor")}><BriefcaseMedical size={17} /> Visiting Specialist</button>
      </section>

      <section className="doctor-grid">
        <div className="doctor-main">
          <DoctorPanel title="Doctor Credential and Privilege Register">
            <DoctorTable>
              <thead><tr><th>Doctor</th><th>Specialty</th><th>Credential</th><th>Privileges</th><th>CME</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>{filteredProfiles.length ? filteredProfiles.map((row) => {
                const cmePoints = cme.filter((item) => item.doctorProfileId === row.id).reduce((sum, item) => sum + Number(item.points || 0), 0);
                return <tr key={row.id} onClick={() => setSelected(row)}><td><strong>{doctorName(row)}</strong><small>{row.staff?.phone || row.staff?.email || row.staffId}</small></td><td>{row.specialization || "General"}</td><td><span className={`doctor-pill ${row.credentialVerified ? "ok" : "danger"}`}>{row.credentialVerified ? "VERIFIED" : "PENDING"}</span><small>{row.licenseValidUntil ? new Date(row.licenseValidUntil).toLocaleDateString() : "-"}</small></td><td>{row.privileges?.filter((p: any) => p.status === "ACTIVE").length || 0}</td><td className={cmePoints >= 40 ? "ok" : "danger"}>{cmePoints}/40</td><td><span className="doctor-pill">{row.status}</span></td><td><button type="button" onClick={(event) => { event.stopPropagation(); openProfile(row); }}>Edit</button></td></tr>;
              }) : <tr><td colSpan={7} className="doctor-empty">No doctor profiles recorded.</td></tr>}</tbody>
            </DoctorTable>
          </DoctorPanel>

          <section className="doctor-two">
            <DoctorPanel title="On-Call Schedule">
              <DoctorTable compact>
                <thead><tr><th>Doctor</th><th>Area</th><th>Time</th><th>Allowance</th></tr></thead>
                <tbody>{onCall.slice(0, 8).length ? onCall.slice(0, 8).map((row) => <tr key={row.onCallId || row.id} onClick={() => setSelected(row)}><td><strong>{row.doctorName}</strong><small>{row.specialty}</small></td><td>{row.clinicalArea}</td><td>{row.startTime ? new Date(row.startTime).toLocaleString() : "-"}</td><td>{money(row.allowanceAmount)}</td></tr>) : <tr><td colSpan={4} className="doctor-empty">No on-call entries recorded.</td></tr>}</tbody>
              </DoctorTable>
            </DoctorPanel>
            <DoctorPanel title="Visiting Specialists">
              <DoctorTable compact>
                <thead><tr><th>Specialist</th><th>Schedule</th><th>Fee</th><th>Status</th></tr></thead>
                <tbody>{visitors.slice(0, 8).length ? visitors.slice(0, 8).map((row) => <tr key={row.visitingSpecialistId || row.id} onClick={() => setSelected(row)}><td><strong>{row.specialistName}</strong><small>{row.specialty}</small></td><td>{row.visitingSchedule}</td><td>{money(row.specialistFee)}</td><td><span className="doctor-pill">{row.status}</span></td></tr>) : <tr><td colSpan={4} className="doctor-empty">No visiting specialists recorded.</td></tr>}</tbody>
              </DoctorTable>
            </DoctorPanel>
          </section>
        </div>

        <aside className="doctor-side">
          <section className="doctor-selected"><span>Selected Doctor Record</span><h2>{selected ? selectedTitle(selected) : "No record selected"}</h2><dl><div><dt>Status</dt><dd>{selected?.status || selected?.riskLevel || "-"}</dd></div><div><dt>Privilege</dt><dd>{selected?.privileges?.length ?? selected?.privilegeName ?? "-"}</dd></div><div><dt>Review</dt><dd>{selected?.licenseValidUntil ? new Date(selected.licenseValidUntil).toLocaleDateString() : selected?.indemnityValidUntil ? new Date(selected.indemnityValidUntil).toLocaleDateString() : "-"}</dd></div></dl></section>
          <DoctorPanel title="Active Privileges">{privileges.length ? <div className="doctor-list">{privileges.slice(0, 8).map((row) => <button type="button" key={row.id} onClick={() => setSelected(row)}><span><strong>{row.privilegeName}</strong><small>{doctorName(row.doctorProfile)} · {row.scope || "Scope not specified"}</small></span><b>{row.status}</b></button>)}</div> : <p className="doctor-note">No privileges recorded.</p>}</DoctorPanel>
          <DoctorPanel title="CME Balance Watch">{profiles.length ? <div className="doctor-list">{profiles.slice(0, 8).map((profile) => { const points = cme.filter((row) => row.doctorProfileId === profile.id).reduce((sum, row) => sum + Number(row.points || 0), 0); return <button type="button" key={profile.id} onClick={() => setSelected(profile)}><span><strong>{doctorName(profile)}</strong><small>KMPDB renewal target: 40 points</small></span><b className={points >= 40 ? "ok" : "danger"}>{points}/40</b></button>; })}</div> : <p className="doctor-note">No CME watch data.</p>}</DoctorPanel>
        </aside>
      </section>

      {notice ? <div className={`doctor-toast ${notice.tone}`} role="status" aria-live="polite"><div className="doctor-toast-icon">{notice.tone === "error" ? <CircleX size={21} /> : notice.tone === "warning" ? <AlertCircle size={21} /> : <CheckCircle2 size={21} />}</div><div className="doctor-toast-copy"><strong>{notice.tone === "error" ? "Action failed" : notice.tone === "warning" ? "Attention required" : "Saved successfully"}</strong><span>{notice.text}</span></div><button type="button" onClick={() => setNotice(null)} aria-label="Dismiss notification"><X size={16} /></button></div> : null}
      {loading ? <div className="doctor-loading">Loading doctor management...</div> : null}

      {modal === "profile" ? <DoctorModal title="Doctor Credential Profile" tone="green" onClose={() => setModal("")}><form className="doctor-form" onSubmit={submitProfile}><StaffSelect label="Doctor staff profile" staff={doctorStaff.length ? doctorStaff : staff} value={profileForm.staffId} onChange={(value) => setProfileForm((f) => ({ ...f, staffId: value }))} /><Text label="Specialization" value={profileForm.specialization} onChange={(v) => setProfileForm((f) => ({ ...f, specialization: v }))} /><Text label="License number" value={profileForm.licenseNumber} onChange={(v) => setProfileForm((f) => ({ ...f, licenseNumber: v }))} /><Text label="License valid until" type="date" value={profileForm.licenseValidUntil} onChange={(v) => setProfileForm((f) => ({ ...f, licenseValidUntil: v }))} /><Text label="Privilege scope summary" value={profileForm.privilegeScope} onChange={(v) => setProfileForm((f) => ({ ...f, privilegeScope: v }))} /><Text label="Workload score" type="number" value={profileForm.workloadScore} onChange={(v) => setProfileForm((f) => ({ ...f, workloadScore: v }))} /><Select label="Status" value={profileForm.status} onChange={(v) => setProfileForm((f) => ({ ...f, status: v }))} options={["ACTIVE", "SUSPENDED", "VISITING"]} /><Check label="Credential verified by committee" checked={profileForm.credentialVerified} onChange={(v) => setProfileForm((f) => ({ ...f, credentialVerified: v }))} /><Check label="Head doctor / department lead" checked={profileForm.isHeadDoctor} onChange={(v) => setProfileForm((f) => ({ ...f, isHeadDoctor: v }))} /><Footer saving={saving} onCancel={() => setModal("")} label="Save Doctor Profile" /></form></DoctorModal> : null}
      {modal === "privilege" ? <DoctorModal title="Clinical Privilege Approval" tone="teal" onClose={() => setModal("")}><form className="doctor-form" onSubmit={submitPrivilege}><ProfileSelect profiles={profiles} value={privilegeForm.doctorProfileId} onChange={(v) => setPrivilegeForm((f) => ({ ...f, doctorProfileId: v }))} /><Text label="Privilege name" value={privilegeForm.privilegeName} onChange={(v) => setPrivilegeForm((f) => ({ ...f, privilegeName: v }))} required /><Text label="Privilege code" value={privilegeForm.privilegeCode} onChange={(v) => setPrivilegeForm((f) => ({ ...f, privilegeCode: v }))} /><Area label="Evidence and approved scope" value={privilegeForm.scope} onChange={(v) => setPrivilegeForm((f) => ({ ...f, scope: v }))} /><Text label="Valid until" type="date" value={privilegeForm.validUntil} onChange={(v) => setPrivilegeForm((f) => ({ ...f, validUntil: v }))} /><Select label="Status" value={privilegeForm.status} onChange={(v) => setPrivilegeForm((f) => ({ ...f, status: v }))} options={["ACTIVE", "PENDING", "SUSPENDED", "EXPIRED"]} /><Check label="Can operate / perform procedure" checked={privilegeForm.canOperate} onChange={(v) => setPrivilegeForm((f) => ({ ...f, canOperate: v }))} /><Check label="Can prescribe restricted medicines" checked={privilegeForm.canPrescribeRestricted} onChange={(v) => setPrivilegeForm((f) => ({ ...f, canPrescribeRestricted: v }))} /><Footer saving={saving} onCancel={() => setModal("")} label="Save Privilege" /></form></DoctorModal> : null}
      {modal === "check" ? <DoctorModal title="Scope-of-Practice Privilege Check" tone="blue" onClose={() => setModal("")}><form className="doctor-form" onSubmit={submitCheck}><StaffSelect label="Doctor staff profile" staff={doctorStaff.length ? doctorStaff : staff} value={checkForm.staffId} onChange={(value) => setCheckForm((f) => ({ ...f, staffId: value }))} /><Text label="Procedure or privilege to check" value={checkForm.procedure} onChange={(v) => setCheckForm((f) => ({ ...f, procedure: v }))} required />{checkResult ? <div className={`doctor-check-result ${checkResult.allowed ? "ok" : "danger"}`}><strong>{checkResult.allowed ? "Allowed" : "Blocked"}</strong><span>{checkResult.reason}</span></div> : null}<Footer saving={saving} onCancel={() => setModal("")} label="Run Check" /></form></DoctorModal> : null}
      {modal === "oncall" ? <DoctorModal title="On-Call Schedule Entry" tone="amber" onClose={() => setModal("")}><form className="doctor-form" onSubmit={submitOnCall}><ProfileSelect profiles={profiles} value={onCallForm.doctorProfileId} onChange={(v) => { const p = profiles.find((row) => row.id === v); setOnCallForm((f) => ({ ...f, doctorProfileId: v, specialty: p?.specialization || f.specialty, contactPhone: p?.staff?.phone || f.contactPhone })); }} /><Text label="Specialty" value={onCallForm.specialty} onChange={(v) => setOnCallForm((f) => ({ ...f, specialty: v }))} /><Text label="Clinical area" value={onCallForm.clinicalArea} onChange={(v) => setOnCallForm((f) => ({ ...f, clinicalArea: v }))} /><Text label="Start time" type="datetime-local" value={onCallForm.startTime} onChange={(v) => setOnCallForm((f) => ({ ...f, startTime: v }))} /><Text label="End time" type="datetime-local" value={onCallForm.endTime} onChange={(v) => setOnCallForm((f) => ({ ...f, endTime: v }))} /><Text label="Contact phone" value={onCallForm.contactPhone} onChange={(v) => setOnCallForm((f) => ({ ...f, contactPhone: v }))} /><Text label="Allowance rate per hour" type="number" value={onCallForm.allowanceRate} onChange={(v) => setOnCallForm((f) => ({ ...f, allowanceRate: v }))} /><Select label="Status" value={onCallForm.status} onChange={(v) => setOnCallForm((f) => ({ ...f, status: v }))} options={["ACTIVE", "CANCELLED", "COMPLETED"]} /><Footer saving={saving} onCancel={() => setModal("")} label="Save On-Call" /></form></DoctorModal> : null}
      {modal === "cme" ? <DoctorModal title="CME Activity Record" tone="purple" onClose={() => setModal("")}><form className="doctor-form" onSubmit={submitCme}><ProfileSelect profiles={profiles} value={cmeForm.doctorProfileId} onChange={(v) => setCmeForm((f) => ({ ...f, doctorProfileId: v }))} /><Text label="Activity title" value={cmeForm.activityTitle} onChange={(v) => setCmeForm((f) => ({ ...f, activityTitle: v }))} required /><Select label="Activity type" value={cmeForm.activityType} onChange={(v) => setCmeForm((f) => ({ ...f, activityType: v }))} options={["COURSE", "CONFERENCE", "JOURNAL", "GRAND_ROUND", "PRESENTATION"]} /><Text label="Provider" value={cmeForm.provider} onChange={(v) => setCmeForm((f) => ({ ...f, provider: v }))} /><Text label="Activity date" type="date" value={cmeForm.activityDate} onChange={(v) => setCmeForm((f) => ({ ...f, activityDate: v }))} /><Text label="CME points" type="number" value={cmeForm.points} onChange={(v) => setCmeForm((f) => ({ ...f, points: v }))} /><Text label="Renewal cycle" value={cmeForm.renewalCycle} onChange={(v) => setCmeForm((f) => ({ ...f, renewalCycle: v }))} /><Text label="Evidence URL" value={cmeForm.evidenceUrl} onChange={(v) => setCmeForm((f) => ({ ...f, evidenceUrl: v }))} /><Footer saving={saving} onCancel={() => setModal("")} label="Save CME" /></form></DoctorModal> : null}
      {modal === "visitor" ? <DoctorModal title="Visiting Specialist Agreement" tone="purple" onClose={() => setModal("")}><form className="doctor-form" onSubmit={submitVisitor}><Text label="Specialist name" value={visitorForm.specialistName} onChange={(v) => setVisitorForm((f) => ({ ...f, specialistName: v }))} required /><Text label="Specialty" value={visitorForm.specialty} onChange={(v) => setVisitorForm((f) => ({ ...f, specialty: v }))} /><Text label="Visiting schedule" value={visitorForm.visitingSchedule} onChange={(v) => setVisitorForm((f) => ({ ...f, visitingSchedule: v }))} /><Text label="Clinic days offered to appointments" value={visitorForm.clinicDays} onChange={(v) => setVisitorForm((f) => ({ ...f, clinicDays: v }))} /><Text label="Specialist fee" type="number" value={visitorForm.specialistFee} onChange={(v) => setVisitorForm((f) => ({ ...f, specialistFee: v }))} /><Text label="Indemnity valid until" type="date" value={visitorForm.indemnityValidUntil} onChange={(v) => setVisitorForm((f) => ({ ...f, indemnityValidUntil: v }))} /><Text label="Agreement reference" value={visitorForm.agreementReference} onChange={(v) => setVisitorForm((f) => ({ ...f, agreementReference: v }))} /><Select label="Status" value={visitorForm.status} onChange={(v) => setVisitorForm((f) => ({ ...f, status: v }))} options={["ACTIVE", "SUSPENDED", "EXPIRED"]} /><Check label="Available to appointment booking" checked={visitorForm.appointmentBookingEnabled} onChange={(v) => setVisitorForm((f) => ({ ...f, appointmentBookingEnabled: v }))} /><Footer saving={saving} onCancel={() => setModal("")} label="Save Visiting Specialist" /></form></DoctorModal> : null}
      {modal === "credential" ? <DoctorModal title="Credential Verification Record" tone="blue" onClose={() => setModal("")}><form className="doctor-form" onSubmit={submitCredential}><ProfileSelect profiles={profiles} value={credentialForm.doctorProfileId} onChange={(v) => setCredentialForm((f) => ({ ...f, doctorProfileId: v }))} /><Select label="Credential type" value={credentialForm.credentialType} onChange={(v) => setCredentialForm((f) => ({ ...f, credentialType: v }))} options={["PROFESSIONAL_REGISTRATION", "MEDICAL_DEGREE", "SPECIALIST_CERTIFICATE", "CASE_LOG", "SUPERVISOR_ASSESSMENT"]} /><Text label="Issuing institution" value={credentialForm.issuingInstitution} onChange={(v) => setCredentialForm((f) => ({ ...f, issuingInstitution: v }))} required /><Text label="Registration authority" value={credentialForm.registrationAuthority} onChange={(v) => setCredentialForm((f) => ({ ...f, registrationAuthority: v }))} /><Text label="Registration number" value={credentialForm.registrationNumber} onChange={(v) => setCredentialForm((f) => ({ ...f, registrationNumber: v }))} /><Text label="Certificate number" value={credentialForm.certificateNumber} onChange={(v) => setCredentialForm((f) => ({ ...f, certificateNumber: v }))} /><Text label="Issue date" type="date" value={credentialForm.issueDate} onChange={(v) => setCredentialForm((f) => ({ ...f, issueDate: v }))} /><Text label="Expiry date" type="date" value={credentialForm.expiryDate} onChange={(v) => setCredentialForm((f) => ({ ...f, expiryDate: v }))} /><Text label="Supporting document URL" value={credentialForm.supportingDocumentUrl} onChange={(v) => setCredentialForm((f) => ({ ...f, supportingDocumentUrl: v }))} /><Area label="Verification notes" value={credentialForm.verificationNotes} onChange={(v) => setCredentialForm((f) => ({ ...f, verificationNotes: v }))} /><Footer saving={saving} onCancel={() => setModal("")} label="Submit Credential" /></form></DoctorModal> : null}
    </main>
  );
}

function doctorName(profile: any) {
  const staff = profile?.staff || profile?.doctorProfile?.staff;
  const raw = [staff?.firstName, staff?.lastName].filter(Boolean).join(" ").trim();
  return raw ? `Dr. ${raw}` : profile?.doctorName || profile?.specialistName || "Doctor";
}

function selectedTitle(row: any) {
  return row.specialistName || row.privilegeName || row.doctorName || doctorName(row);
}

const fieldHints: Record<string, string> = {
  "Doctor staff profile": "Select the HR staff record that owns this professional profile.",
  "Doctor profile": "Choose the doctor whose authorization or schedule you are managing.",
  Specialization: "Primary medical specialty used for services, privileges, and reporting.",
  "License number": "Professional registration or license number issued by the relevant board.",
  "License valid until": "Clinical access should be reviewed before this registration expires.",
  "Privilege scope summary": "Short summary of the approved clinical practice scope.",
  "Privilege name": "Name of the procedure, service, or clinical activity being authorized.",
  "Privilege code": "Optional standardized code for point-of-care privilege checks.",
  "Evidence and approved scope": "Record evidence, conditions, supervision, or department limits.",
  "Valid until": "Date when the privilege must be reviewed or renewed.",
  "Procedure or privilege to check": "Enter the procedure or privilege exactly as used in the clinical workflow.",
  Specialty: "Specialty covered during this on-call assignment.",
  "Clinical area": "Ward, department, or service receiving the on-call coverage.",
  "Start time": "Beginning of the approved coverage window.",
  "End time": "End of the approved coverage window.",
  "Contact phone": "Secure contact number used by authorized clinical staff.",
  "Allowance rate per hour": "Reference rate sent to Payroll; Doctor Management does not calculate salary.",
  "Activity title": "Name of the conference, course, journal, grand round, or presentation.",
  Provider: "Organization that delivered or verified the CME activity.",
  "Activity date": "Date the professional development activity took place.",
  "CME points": "Points awarded after evidence review for the active renewal cycle.",
  "Renewal cycle": "Professional cycle against which the points are counted.",
  "Evidence URL": "Optional link to the attendance certificate or supporting evidence.",
  "Specialist name": "Full name of the external or visiting practitioner.",
  "Visiting schedule": "Recurring or specific schedule for the specialist clinic.",
  "Clinic days offered to appointments": "Days and capacity that Appointments may expose.",
  "Specialist fee": "Reference consultation fee supplied to Billing/Charge Master.",
  "Indemnity valid until": "Professional indemnity expiry used before appointment availability is offered.",
  "Agreement reference": "Hospital agreement or contract reference for audit purposes.",
};

function fieldHint(label: string) {
  return fieldHints[label] || "Provide the information required for this Doctor Management record.";
}

function DoctorPanel({ title, children }: { title: string; children: ReactNode }) {
  return <section className="doctor-panel"><div className="doctor-panel-title"><h2>{title}</h2></div>{children}</section>;
}

function DoctorTable({ children, compact = false }: { children: ReactNode; compact?: boolean }) {
  return <div className="doctor-table-wrap"><table className={`doctor-table ${compact ? "compact" : ""}`}>{children}</table></div>;
}

function DoctorModal({ title, tone, onClose, children }: { title: string; tone: string; onClose: () => void; children: ReactNode }) {
  return <div className="doctor-modal-backdrop"><section className={`doctor-modal is-${tone}`}><header><div><span>Doctor Management</span><h2>{title}</h2></div><button type="button" onClick={onClose} aria-label="Close form"><X size={18} /></button></header>{children}</section></div>;
}

function StaffSelect({ label, staff, value, onChange }: { label: string; staff: any[]; value: string; onChange: (value: string) => void }) {
  return <label><span>{label}</span><small className="doctor-field-hint">{fieldHint(label)}</small><select value={value} onChange={(event) => onChange(event.target.value)} required><option value="">Select doctor</option>{staff.map((row) => <option value={row.id} key={row.id}>{[row.firstName, row.lastName].filter(Boolean).join(" ")} - {row.jobTitle || row.staffNumber || row.id}</option>)}</select></label>;
}

function ProfileSelect({ profiles, value, onChange }: { profiles: any[]; value: string; onChange: (value: string) => void }) {
  return <label><span>Doctor profile</span><small className="doctor-field-hint">{fieldHint("Doctor profile")}</small><select value={value} onChange={(event) => onChange(event.target.value)} required><option value="">Select doctor profile</option>{profiles.map((row) => <option value={row.id} key={row.id}>{doctorName(row)} - {row.specialization || "General"}</option>)}</select></label>;
}

function Text({ label, value, onChange, type = "text", required = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean }) {
  return <label><span>{label}</span><small className="doctor-field-hint">{fieldHint(label)}</small><input type={type} value={value} onChange={(event) => onChange(event.target.value)} required={required} /></label>;
}

function Area({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="wide"><span>{label}</span><small className="doctor-field-hint">{fieldHint(label)}</small><textarea value={value} onChange={(event) => onChange(event.target.value)} /></label>;
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) {
  return <label><span>{label}</span><small className="doctor-field-hint">{fieldHint(label)}</small><select value={value} onChange={(event) => onChange(event.target.value)}>{options.map((option) => <option value={option} key={option}>{option.replaceAll("_", " ")}</option>)}</select></label>;
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return <label className="doctor-check"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} /><span><strong>{label}</strong><small className="doctor-field-hint">{fieldHint(label)}</small></span></label>;
}

function Footer({ saving, onCancel, label }: { saving: boolean; onCancel: () => void; label: string }) {
  return <footer><button type="button" onClick={onCancel}>Cancel</button><button type="submit" disabled={saving}>{saving ? "Saving..." : label}</button></footer>;
}

export { DoctorsPage as DoctorView };

export { DoctorsPage as DoctorsView };
