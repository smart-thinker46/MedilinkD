// Ported from Medilink-Frontend/src/app/nursing-admin/page.tsx for desktop parity.
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  GraduationCap,
  RefreshCw,
  Save,
  Search,
  ShieldAlert,
  Stethoscope,
  UserPlus,
  Users,
  XCircle,
} from "lucide-react";
import { api } from "../lib/api";

type NoticeTone = "success" | "error" | "warning" | "info";
type AdminTab = "roster" | "competency" | "training";
type AdminModal = "roster" | "profile" | "competency" | "training" | null;

const SHIFT_RULES: Record<string, { start: string; end: string; hours: number; label: string }> = {
  DAY: { start: "07:00", end: "19:00", hours: 12, label: "Day" },
  EVENING: { start: "14:00", end: "22:00", hours: 8, label: "Evening" },
  NIGHT: { start: "19:00", end: "07:00", hours: 12, label: "Night" },
  ON_CALL: { start: "08:00", end: "17:00", hours: 9, label: "On call" },
};

const MANDATORY_COMPETENCIES = [
  "Medication Administration",
  "BLS Certification",
  "IV Cannulation",
  "Wound Assessment",
  "ECG Interpretation",
];

const CRITICAL_COMPETENCIES = ["Medication Administration", "BLS Certification", "IV Cannulation"];
const MIN_REST_HOURS = 11;
const MAX_WEEKLY_HOURS = 48;
const RENEWAL_ALERT_DAYS = 30;

const emptyRoster = {
  nurseProfileId: "",
  wardId: "",
  shiftDate: new Date().toISOString().slice(0, 10),
  shiftType: "DAY",
  onCall: false,
  overtimeMinutes: "",
  approved: false,
  status: "PENDING",
  approvalNotes: "",
};

const emptyCompetency = {
  nurseProfileId: "",
  skillName: "Medication Administration",
  competencyLevel: "COMPETENT",
  assessmentDate: new Date().toISOString().slice(0, 10),
  assessorName: "",
  validUntil: "",
  score: "",
  notes: "",
};

const emptyProfile = {
  staffId: "",
  skillLevel: "GENERAL",
  yearsExperience: "",
  licenseNumber: "",
  licenseValidUntil: "",
  isWardSupervisor: false,
  status: "ACTIVE",
};

const emptyTraining = {
  staffId: "",
  trainingType: "CPD_ACTIVITY",
  provider: "",
  dueDate: "",
  completedDate: "",
  credits: "",
  status: "PENDING",
  notes: "",
};

const unwrapRows = (value: any) => {
  const data = value?.data ?? value;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  return [];
};

const unwrapData = (value: any) => value?.data ?? value ?? {};

const formatStaffName = (staff: any) =>
  [staff?.firstName, staff?.middleName, staff?.lastName].filter(Boolean).join(" ").trim() ||
  staff?.name ||
  staff?.staffName ||
  staff?.email ||
  "Unnamed staff";

const nurseName = (profileOrRow: any) => {
  const profile = profileOrRow?.nurseProfile || profileOrRow;
  return formatStaffName(profile?.staff || profileOrRow?.staff || profileOrRow);
};

const formatDate = (value?: string) => {
  if (!value) return "Not set";
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toLocaleDateString() : "Not set";
};

const isoDate = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString().slice(0, 10) : String(value).slice(0, 10);
};

const daysUntil = (value?: string) => {
  if (!value) return null;
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return null;
  return Math.ceil((date.getTime() - Date.now()) / 86400000);
};

const noticeTone = (message: string): NoticeTone => {
  const text = message.toLowerCase();
  if (text.includes("failed") || text.includes("could not") || text.includes("expired")) return "error";
  if (text.includes("rest") || text.includes("understaffed") || text.includes("missing") || text.includes("exceed")) {
    return "warning";
  }
  if (text.includes("loaded") || text.includes("available")) return "info";
  return "success";
};

const shiftDateTime = (dateValue: string, timeValue: string) => new Date(`${dateValue}T${timeValue}:00`);

const shiftWindow = (assignment: any) => {
  const shiftType = String(assignment?.shiftType || "DAY").toUpperCase();
  const rule = SHIFT_RULES[shiftType] || SHIFT_RULES.DAY;
  const date = isoDate(assignment?.shiftDate) || new Date().toISOString().slice(0, 10);
  const start = shiftDateTime(date, rule.start);
  const end = shiftDateTime(date, rule.end);
  if (end <= start) end.setDate(end.getDate() + 1);
  return { start, end, hours: rule.hours + Number(assignment?.overtimeMinutes || 0) / 60 };
};

const weekStartKey = (value: string) => {
  const date = new Date(`${value}T12:00:00`);
  const day = date.getDay() || 7;
  date.setDate(date.getDate() - day + 1);
  return date.toISOString().slice(0, 10);
};

const assignmentStatus = (row: any) => {
  if (String(row?.approvalNotes || "").toUpperCase().includes("SICK_LEAVE")) return "SICK LEAVE";
  if (row?.approved) return "APPROVED";
  return String(row?.status || "PENDING").replace(/_/g, " ");
};

const statToneColor: Record<string, string> = {
  emerald: "#16a34a",
  blue: "#2563eb",
  amber: "#f59e0b",
  violet: "#7c3aed",
  rose: "#e11d48",
};

export default function NursingAdminView() {
  const [activeTab, setActiveTab] = useState<AdminTab>("roster");
  const [dashboard, setDashboard] = useState<any>({});
  const [profiles, setProfiles] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [certifications, setCertifications] = useState<any[]>([]);
  const [skills, setSkills] = useState<any[]>([]);
  const [trainingRecords, setTrainingRecords] = useState<any[]>([]);
  const [rosterForm, setRosterForm] = useState(emptyRoster);
  const [competencyForm, setCompetencyForm] = useState(emptyCompetency);
  const [profileForm, setProfileForm] = useState(emptyProfile);
  const [trainingForm, setTrainingForm] = useState(emptyTraining);
  const [search, setSearch] = useState("");
  const [trainingSearch, setTrainingSearch] = useState("");
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [viewMode, setViewMode] = useState<"ward" | "nurse">("ward");
  const [requiredNurses, setRequiredNurses] = useState(2);
  const [selectedShift, setSelectedShift] = useState<any | null>(null);
  const [activeModal, setActiveModal] = useState<AdminModal>(null);
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");

  // Keep operational feedback visible long enough to read, then clear it so
  // the workspace never becomes covered by stale notifications.
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 5000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [dashboardRes, profileRes, shiftRes, certRes, skillRes, staffRes, trainingRes] = await Promise.all([
        api.get("/nursing-admin/dashboard").catch(() => ({ data: {}, __failed: true })),
        api.get("/nursing-admin/nurse-profiles", { params: { limit: 300 } }).catch(() => ({ data: [], __failed: true })),
        api.get("/nursing-admin/shift-assignments", { params: { limit: 500 } }).catch(() => ({ data: [], __failed: true })),
        api.get("/nursing-admin/certifications", { params: { limit: 500 } }).catch(() => ({ data: [], __failed: true })),
        api.get("/nursing-admin/skills", { params: { limit: 500 } }).catch(() => ({ data: [], __failed: true })),
        api.get("/staff").catch(() => ({ data: [], __failed: true })),
        api.get("/nursing-admin/training-records", { params: { limit: 500 } }).catch(() => ({ data: [], __failed: true })),
      ]);

      setDashboard(unwrapData(dashboardRes.data));
      setProfiles(unwrapRows(profileRes.data));
      setAssignments(unwrapRows(shiftRes.data));
      setCertifications(unwrapRows(certRes.data));
      setSkills(unwrapRows(skillRes.data));
      setStaff(unwrapRows(staffRes.data));
      setTrainingRecords(unwrapRows(trainingRes.data));
      if ([dashboardRes, profileRes, shiftRes, certRes, skillRes, staffRes, trainingRes].some((result: any) => result?.__failed)) {
        setNotice("Some Nursing Administration data could not be loaded. Check your connection and refresh.");
      }
    } catch {
      setNotice("Nursing administration data could not be loaded.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const profileById = useMemo(() => {
    const map = new Map<string, any>();
    profiles.forEach((profile) => map.set(String(profile.id), profile));
    return map;
  }, [profiles]);

  const monthlyAssignments = useMemo(
    () => assignments.filter((row) => isoDate(row?.shiftDate).startsWith(month)),
    [assignments, month],
  );

  const visibleAssignments = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return monthlyAssignments.filter((row) => {
      const haystack = [
        nurseName(row),
        row?.wardName,
        row?.wardId,
        row?.shiftType,
        row?.status,
        assignmentStatus(row),
        isoDate(row?.shiftDate),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return !needle || haystack.includes(needle);
    });
  }, [monthlyAssignments, search]);

  const visibleTrainingRecords = useMemo(() => {
    const needle = trainingSearch.trim().toLowerCase();
    if (!needle) return trainingRecords;
    return trainingRecords.filter((row) => [formatStaffName(row?.staff), row?.trainingType, row?.provider, row?.status, row?.notes].filter(Boolean).join(" ").toLowerCase().includes(needle));
  }, [trainingRecords, trainingSearch]);

  const weeklyHours = (nurseProfileId: string, dateValue: string, extra?: any) => {
    const week = weekStartKey(dateValue);
    const rows = assignments.filter((row) => {
      const rowProfileId = String(row?.nurseProfileId || row?.nurseProfile?.id || "");
      const rowDate = isoDate(row?.shiftDate);
      const rejected = assignmentStatus(row).includes("REJECTED") || assignmentStatus(row).includes("SICK");
      return rowProfileId === nurseProfileId && rowDate && weekStartKey(rowDate) === week && !rejected;
    });
    const base = rows.reduce((sum, row) => sum + shiftWindow(row).hours, 0);
    return base + (extra ? shiftWindow(extra).hours : 0);
  };

  const restViolation = (draft: any) => {
    if (!draft.nurseProfileId || !draft.shiftDate || !draft.shiftType) return "";
    const current = shiftWindow(draft);
    const rows = assignments.filter((row) => {
      const sameNurse = String(row?.nurseProfileId || row?.nurseProfile?.id || "") === draft.nurseProfileId;
      const active = !assignmentStatus(row).includes("REJECTED") && !assignmentStatus(row).includes("SICK");
      return sameNurse && active;
    });

    for (const row of rows) {
      const other = shiftWindow(row);
      const gapBefore = (current.start.getTime() - other.end.getTime()) / 3600000;
      const gapAfter = (other.start.getTime() - current.end.getTime()) / 3600000;
      if (gapBefore >= 0 && gapBefore < MIN_REST_HOURS) {
        return `${nurseName(row)} has only ${gapBefore.toFixed(1)} hours rest before this shift.`;
      }
      if (gapAfter >= 0 && gapAfter < MIN_REST_HOURS) {
        return `${nurseName(row)} would have only ${gapAfter.toFixed(1)} hours rest after this shift.`;
      }
      const overlaps = current.start < other.end && current.end > other.start;
      if (overlaps) return `${nurseName(row)} is already rostered during this time.`;
    }
    return "";
  };

  const understaffedShifts = useMemo(() => {
    const ratio = Math.max(1, Number(requiredNurses) || 1);
    const groups = new Map<string, { ward: string; date: string; shift: string; count: number; required: number; shortage: number }>();
    monthlyAssignments.forEach((row) => {
      if (assignmentStatus(row).includes("REJECTED") || assignmentStatus(row).includes("SICK")) return;
      const ward = String(row?.wardName || row?.wardId || "Unassigned ward");
      const date = isoDate(row?.shiftDate);
      const shift = String(row?.shiftType || "DAY").toUpperCase();
      const key = `${ward}-${date}-${shift}`;
      const current = groups.get(key) || { ward, date, shift, count: 0, required: ratio, shortage: ratio };
      current.count += 1;
      current.required = ratio;
      current.shortage = Math.max(0, ratio - current.count);
      groups.set(key, current);
    });
    return Array.from(groups.values()).filter((group) => group.count < ratio);
  }, [monthlyAssignments, requiredNurses]);

  const expiringCompetencies = useMemo(
    () =>
      certifications.filter((cert) => {
        const days = daysUntil(cert?.validUntil);
        return days !== null && days >= 0 && days <= RENEWAL_ALERT_DAYS;
      }),
    [certifications],
  );

  const expiredCompetencies = useMemo(
    () => certifications.filter((cert) => (daysUntil(cert?.validUntil) ?? 1) < 0),
    [certifications],
  );

  const restrictedNurses = useMemo(() => {
    return profiles.filter((profile) =>
      CRITICAL_COMPETENCIES.some((competency) => {
        const cert = certifications.find(
          (item) =>
            String(item?.nurseProfileId || item?.nurseProfile?.id) === String(profile.id) &&
            String(item?.certificationName || "").toLowerCase() === competency.toLowerCase(),
        );
        return !cert || (daysUntil(cert?.validUntil) ?? -1) < 0 || String(cert?.status || "").toUpperCase() !== "ACTIVE";
      }),
    );
  }, [certifications, profiles]);

  const stats = useMemo(() => {
    const totals = dashboard?.totals || dashboard || {};
    return [
      {
        label: "Active Nurses",
        value: Number(totals?.activeNurseProfiles || profiles.filter((p) => p?.status !== "INACTIVE").length || 0),
        tone: "emerald",
        icon: Users,
      },
      {
        label: "Pending Roster",
        value: assignments.filter((row) => assignmentStatus(row) === "PENDING").length,
        tone: "blue",
        icon: CalendarDays,
      },
      {
        label: "Understaffed",
        value: understaffedShifts.length,
        tone: "amber",
        icon: AlertTriangle,
      },
      {
        label: "Expiring Skills",
        value: expiringCompetencies.length,
        tone: "violet",
        icon: BadgeCheck,
      },
      {
        label: "Restricted",
        value: restrictedNurses.length,
        tone: "rose",
        icon: ShieldAlert,
      },
    ];
  }, [assignments, dashboard, expiringCompetencies.length, profiles, restrictedNurses.length, understaffedShifts.length]);

  const availableSwapNurses = useMemo(() => {
    if (!selectedShift) return [];
    const date = isoDate(selectedShift?.shiftDate);
    const shiftType = String(selectedShift?.shiftType || "DAY").toUpperCase();
    const assignedIds = new Set(
      assignments
        .filter((row) => isoDate(row?.shiftDate) === date && String(row?.shiftType || "").toUpperCase() === shiftType)
        .map((row) => String(row?.nurseProfileId || row?.nurseProfile?.id || "")),
    );
    return profiles.filter((profile) => {
      if (assignedIds.has(String(profile.id))) return false;
      const draft = { ...selectedShift, nurseProfileId: String(profile.id) };
      return !restViolation(draft) && weeklyHours(String(profile.id), date, draft) <= MAX_WEEKLY_HOURS;
    });
  }, [assignments, profiles, selectedShift]);

  const staffWithoutProfile = useMemo(() => {
    const profiledStaff = new Set(profiles.map((profile) => String(profile?.staffId || profile?.staff?.id || "")));
    return staff.filter((person) => !profiledStaff.has(String(person?.id)));
  }, [profiles, staff]);

  const setToast = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice((current) => (current === message ? "" : current)), 5000);
  };

  const saveRoster = async (event: FormEvent) => {
    event.preventDefault();
    if (!rosterForm.nurseProfileId || !rosterForm.shiftDate || !rosterForm.shiftType) {
      setToast("Select a nurse, date, and shift before saving the roster.");
      return;
    }
    const restMessage = restViolation(rosterForm);
    if (restMessage) {
      setToast(restMessage);
      return;
    }
    const hours = weeklyHours(rosterForm.nurseProfileId, rosterForm.shiftDate, rosterForm);
    if (hours > MAX_WEEKLY_HOURS) {
      setToast(`This roster would exceed ${MAX_WEEKLY_HOURS} contractual hours for the week.`);
      return;
    }

    setSaving("roster");
    try {
      await api.post("/nursing-admin/shift-assignments", {
        ...rosterForm,
        wardId: rosterForm.wardId.trim() || undefined,
        overtimeMinutes: Number(rosterForm.overtimeMinutes || 0),
        status: rosterForm.approved ? "APPROVED" : rosterForm.status,
      });
      setRosterForm({ ...emptyRoster, shiftDate: rosterForm.shiftDate, wardId: rosterForm.wardId });
      setActiveModal(null);
      setToast("Duty roster saved with rest and weekly-hour checks.");
      await loadData();
    } catch (error: any) {
      setToast(error?.response?.data?.message || "Duty roster could not be saved.");
    } finally {
      setSaving("");
    }
  };

  const approveShift = async (row: any) => {
    setSaving(`approve-${row.id}`);
    try {
      await api.patch(`/nursing-admin/shift-assignments/${row.id}/approve`, {
        approved: true,
        status: "APPROVED",
        approvalNotes: "Approved by nursing administration.",
      });
      setToast("Shift approved and added to the active roster.");
      await loadData();
    } catch (error: any) {
      setToast(error?.response?.data?.message || "Shift approval failed.");
    } finally {
      setSaving("");
    }
  };

  const markSick = async (row: any) => {
    setSaving(`sick-${row.id}`);
    try {
      await api.patch(`/nursing-admin/shift-assignments/${row.id}/approve`, {
        approved: false,
        status: "REJECTED",
        approvalNotes: `SICK_LEAVE: ${nurseName(row)} marked unavailable. Show swap or overtime cover.`,
      });
      setSelectedShift(row);
      setToast("Sick leave recorded. Available swap nurses are shown below the roster.");
      await loadData();
    } catch (error: any) {
      setToast(error?.response?.data?.message || "Sick leave could not be recorded.");
    } finally {
      setSaving("");
    }
  };

  const saveCompetency = async (event: FormEvent) => {
    event.preventDefault();
    if (!competencyForm.nurseProfileId || !competencyForm.skillName || !competencyForm.assessmentDate) {
      setToast("Select a nurse, competency, and assessment date before saving.");
      return;
    }
    setSaving("competency");
    const isCompetent = competencyForm.competencyLevel === "COMPETENT";
    try {
      await api.post("/nursing-admin/skills", {
        nurseProfileId: competencyForm.nurseProfileId,
        skillName: competencyForm.skillName,
        competencyLevel: competencyForm.competencyLevel,
        specialization: CRITICAL_COMPETENCIES.includes(competencyForm.skillName) ? "CRITICAL_SAFETY" : "CLINICAL",
      });
      await api.post("/nursing-admin/certifications", {
        nurseProfileId: competencyForm.nurseProfileId,
        certificationName: competencyForm.skillName,
        issuedAt: competencyForm.assessmentDate,
        validUntil: competencyForm.validUntil || undefined,
        status: isCompetent ? "ACTIVE" : "PENDING",
        score: competencyForm.score ? Number(competencyForm.score) : undefined,
        notes: [
          competencyForm.assessorName ? `Assessor: ${competencyForm.assessorName}` : "",
          CRITICAL_COMPETENCIES.includes(competencyForm.skillName) ? "Critical safety competency" : "",
          competencyForm.notes,
        ]
          .filter(Boolean)
          .join(" | "),
      });
      setCompetencyForm({ ...emptyCompetency, nurseProfileId: competencyForm.nurseProfileId });
      setActiveModal(null);
      setToast("Competency assessment saved and renewal tracking updated.");
      await loadData();
    } catch (error: any) {
      setToast(error?.response?.data?.message || "Competency assessment could not be saved.");
    } finally {
      setSaving("");
    }
  };

  const createProfile = async (event: FormEvent) => {
    event.preventDefault();
    if (!profileForm.staffId) {
      setToast("Select a staff member before creating a nurse profile.");
      return;
    }
    setSaving("profile");
    try {
      await api.post("/nursing-admin/nurse-profiles", {
        ...profileForm,
        yearsExperience: profileForm.yearsExperience ? Number(profileForm.yearsExperience) : undefined,
        licenseValidUntil: profileForm.licenseValidUntil || undefined,
      });
      setProfileForm(emptyProfile);
      setActiveModal(null);
      setToast("Nurse profile created for roster and competency tracking.");
      await loadData();
    } catch (error: any) {
      setToast(error?.response?.data?.message || "Nurse profile could not be created.");
    } finally {
      setSaving("");
    }
  };

  const saveTraining = async (event: FormEvent) => {
    event.preventDefault();
    if (!trainingForm.staffId || !trainingForm.trainingType) {
      setToast("Select a nurse and training or CPD activity before saving.");
      return;
    }
    setSaving("training");
    try {
      await api.post("/nursing-admin/training-records", {
        ...trainingForm,
        credits: trainingForm.credits ? Number(trainingForm.credits) : undefined,
        dueDate: trainingForm.dueDate || undefined,
        completedDate: trainingForm.completedDate || undefined,
      });
      setTrainingForm(emptyTraining);
      setToast("Training and CPD record saved for compliance tracking.");
      await loadData();
      setActiveModal(null);
    } catch (error: any) {
      setToast(error?.response?.data?.message || "Training record could not be saved.");
    } finally {
      setSaving("");
    }
  };

  const rosterWarning = restViolation(rosterForm);
  const rosterHours = rosterForm.nurseProfileId
    ? weeklyHours(rosterForm.nurseProfileId, rosterForm.shiftDate, rosterForm)
    : 0;

  const updateRequiredNurses = (value: string) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return;
    setRequiredNurses(Math.min(50, Math.max(1, Math.trunc(parsed))));
  };

  return (
    <div className="nursing-view nursing-admin-view">
      <div className="nursing-admin-shell">
      {notice ? (
        <div className={`module-notice-toast is-${noticeTone(notice)}`} role="status" aria-live="polite">
          <div>
            <strong>Nursing Administration</strong>
            <span>{notice}</span>
          </div>
          <button
            type="button"
            className="module-notice-close"
            aria-label="Dismiss notification"
            onClick={() => setNotice("")}
          >
            ×
          </button>
        </div>
      ) : null}

      <div className="pv-header nursing-admin-header">
        <div>
          <h2 className="pv-title">Nursing Administration</h2>
          <p className="pv-subtitle">
            Duty roster management, minimum rest checks, staffing gaps, and competency renewal tracking.
          </p>
        </div>
        <div className="nursing-header-actions nursing-admin-hero-actions">
            <button
              type="button"
              className={`nursing-admin-view-btn is-roster-view ${activeTab === "roster" ? "active" : ""}`}
              onClick={() => setActiveTab("roster")}
            >
              <CalendarDays size={15} /> Roster Board
            </button>
            <button
              type="button"
              className={`nursing-admin-view-btn is-competency-view ${activeTab === "competency" ? "active" : ""}`}
              onClick={() => setActiveTab("competency")}
            >
              <ClipboardCheck size={15} /> Competency Register
            </button>
            <button
              type="button"
              className={`nursing-admin-view-btn ${activeTab === "training" ? "active" : ""}`}
              onClick={() => setActiveTab("training")}
            >
              <GraduationCap size={15} /> Training &amp; CPD
            </button>
            <button
              type="button"
              className="nursing-secondary-btn"
              onClick={() => void loadData()}
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Refresh
            </button>
        </div>
      </div>

      <div className="nursing-admin-content-layout">
        <aside className="nursing-admin-command-sidebar" aria-label="Nursing administration actions">
          <div className="nursing-admin-command-heading">
            <span>QUICK ACTIONS</span>
            <strong>Administration</strong>
          </div>
          <button type="button" className="nursing-admin-action-btn is-roster" onClick={() => { setActiveTab("roster"); setActiveModal("roster"); }}>
            <CalendarDays size={17} /> New Duty Roster
          </button>
          <button type="button" className="nursing-admin-action-btn is-competency" onClick={() => { setActiveTab("competency"); setActiveModal("competency"); }}>
            <ClipboardCheck size={17} /> Assess Competency
          </button>
          <button type="button" className="nursing-admin-action-btn is-profile" onClick={() => setActiveModal("profile")}>
            <UserPlus size={17} /> Nurse Profile
          </button>
          <button type="button" className="nursing-admin-action-btn is-training" onClick={() => setActiveModal("training")}>
            <GraduationCap size={17} /> Training &amp; CPD Activity
          </button>
          <div className="nursing-admin-command-note">Create records in a focused popup. Your registers stay visible while you work.</div>
        </aside>
        <main className="nursing-admin-content-main">
      <section className="pv-stats nursing-stats-grid nursing-admin-stats">
        {stats.map((stat) => {
          return (
            <article key={stat.label} className="pv-stat-card nursing-admin-stat" style={{ borderLeftColor: statToneColor[stat.tone] || "#2563eb" }}>
              <p className="pv-stat-label">{stat.label}</p>
              <p className="pv-stat-value">{loading ? "..." : stat.value}</p>
            </article>
          );
        })}
      </section>

      {activeTab === "roster" ? (
        <section className="nursing-admin-workspace nursing-admin-workspace-full grid gap-6 xl:grid-cols-[480px_minmax(0,1fr)]">
          <div className="nursing-admin-form-stack space-y-6">
            <form onSubmit={saveRoster} className="nursing-admin-panel rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-5 flex items-center gap-3 border-b border-slate-100 pb-4">
                <span className="rounded-lg bg-emerald-50 p-2 text-emerald-700">
                <CalendarDays className="text-emerald-700" size={20} />
                </span>
                <h2 className="text-lg font-black text-slate-950">Create monthly duty roster</h2>
              </div>
              <div className="grid gap-4">
                <label className="grid gap-2 text-sm font-bold text-slate-700">
                  Nurse
                  <select
                    className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                    value={rosterForm.nurseProfileId}
                    onChange={(event) => setRosterForm({ ...rosterForm, nurseProfileId: event.target.value })}
                  >
                    <option value="">Select nurse profile</option>
                    {profiles.map((profile) => (
                      <option key={profile.id} value={profile.id}>
                        {nurseName(profile)} {profile.skillLevel ? `- ${profile.skillLevel}` : ""}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-2 text-sm font-bold text-slate-700">
                    Ward
                    <input
                      className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                      placeholder="Medical Ward"
                      value={rosterForm.wardId}
                      onChange={(event) => setRosterForm({ ...rosterForm, wardId: event.target.value })}
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-bold text-slate-700">
                    Shift date
                    <input
                      type="date"
                      className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                      value={rosterForm.shiftDate}
                      onChange={(event) => setRosterForm({ ...rosterForm, shiftDate: event.target.value })}
                    />
                  </label>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-2 text-sm font-bold text-slate-700">
                    Shift type
                    <select
                      className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                      value={rosterForm.shiftType}
                      onChange={(event) =>
                        setRosterForm({ ...rosterForm, shiftType: event.target.value, onCall: event.target.value === "ON_CALL" })
                      }
                    >
                      {Object.entries(SHIFT_RULES).map(([value, rule]) => (
                        <option key={value} value={value}>
                          {rule.label} ({rule.start}-{rule.end})
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="grid gap-2 text-sm font-bold text-slate-700">
                    Overtime minutes
                    <input
                      type="number"
                      min="0"
                      className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                      value={rosterForm.overtimeMinutes}
                      onChange={(event) => setRosterForm({ ...rosterForm, overtimeMinutes: event.target.value })}
                    />
                  </label>
                </div>
                <label className="flex min-h-11 items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={rosterForm.approved}
                    onChange={(event) => setRosterForm({ ...rosterForm, approved: event.target.checked })}
                  />
                  Approve this shift immediately
                </label>
                <label className="grid gap-2 text-sm font-bold text-slate-700">
                  Manager notes
                  <textarea
                    className="min-h-24 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                    value={rosterForm.approvalNotes}
                    onChange={(event) => setRosterForm({ ...rosterForm, approvalNotes: event.target.value })}
                  />
                </label>
                {rosterWarning ? (
                  <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm font-bold leading-6 text-amber-900">
                    {rosterWarning}
                  </div>
                ) : rosterForm.nurseProfileId ? (
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold leading-6 text-emerald-900">
                    Weekly total after saving: {rosterHours.toFixed(1)} / {MAX_WEEKLY_HOURS} hours.
                  </div>
                ) : null}
                <button
                  type="submit"
                  disabled={saving === "roster"}
                  className="mt-1 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-emerald-800 disabled:opacity-60"
                >
                  <Save size={18} /> {saving === "roster" ? "Saving..." : "Save Duty Roster"}
                </button>
              </div>
            </form>

            <form onSubmit={createProfile} className="nursing-admin-panel rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-5 flex items-center gap-3 border-b border-slate-100 pb-4">
                <span className="rounded-lg bg-slate-100 p-2 text-slate-700">
                <UserPlus size={20} />
                </span>
                <h2 className="text-lg font-black text-slate-950">Create nurse profile</h2>
              </div>
              <div className="grid gap-4">
                <label className="grid gap-2 text-sm font-bold text-slate-700">
                  Staff member
                  <select
                    className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
                    value={profileForm.staffId}
                    onChange={(event) => setProfileForm({ ...profileForm, staffId: event.target.value })}
                  >
                    <option value="">Select staff member</option>
                    {staffWithoutProfile.map((person) => (
                      <option key={person.id} value={person.id}>
                        {formatStaffName(person)}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-2 text-sm font-bold text-slate-700">
                    Skill level
                    <input
                      className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
                      value={profileForm.skillLevel}
                      onChange={(event) => setProfileForm({ ...profileForm, skillLevel: event.target.value })}
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-bold text-slate-700">
                    Years experience
                    <input
                      type="number"
                      min="0"
                      className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
                      value={profileForm.yearsExperience}
                      onChange={(event) => setProfileForm({ ...profileForm, yearsExperience: event.target.value })}
                    />
                  </label>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-2 text-sm font-bold text-slate-700">
                    License number
                    <input
                      className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
                      value={profileForm.licenseNumber}
                      onChange={(event) => setProfileForm({ ...profileForm, licenseNumber: event.target.value })}
                    />
                  </label>
                  <label className="grid gap-2 text-sm font-bold text-slate-700">
                    License valid until
                    <input
                      type="date"
                      className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
                      value={profileForm.licenseValidUntil}
                      onChange={(event) => setProfileForm({ ...profileForm, licenseValidUntil: event.target.value })}
                    />
                  </label>
                </div>
                <label className="flex min-h-11 items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={profileForm.isWardSupervisor}
                    onChange={(event) => setProfileForm({ ...profileForm, isWardSupervisor: event.target.checked })}
                  />
                  Ward supervisor
                </label>
                <button
                  type="submit"
                  disabled={saving === "profile"}
                  className="mt-1 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-60"
                >
                  <UserPlus size={18} /> {saving === "profile" ? "Creating..." : "Create Profile"}
                </button>
              </div>
            </form>
          </div>

          <div className="nursing-admin-board-stack space-y-6">
            <div className="nursing-admin-panel nursing-admin-table-panel rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="nursing-admin-board-header flex flex-col gap-4 border-b border-slate-100 pb-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-lg font-black text-slate-950">Monthly roster board</h2>
                  <p className="text-sm font-semibold text-slate-600">
                    View by {viewMode}, approve shifts, mark sick leave, and identify gaps against staffing ratio.
                  </p>
                </div>
                <div className="nursing-admin-board-controls flex flex-wrap gap-3">
                  <label className="relative">
                    <Search className="nursing-admin-search-icon absolute left-3 top-3 text-slate-400" size={16} />
                    <input
                      className="nursing-admin-search-input min-h-11 w-60 rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm font-semibold outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                      placeholder="Search roster..."
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                    />
                  </label>
                  <input
                    type="month"
                    className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    value={month}
                    onChange={(event) => setMonth(event.target.value)}
                  />
                  <select
                    className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    value={viewMode}
                    onChange={(event) => setViewMode(event.target.value as "ward" | "nurse")}
                  >
                    <option value="ward">View by ward</option>
                    <option value="nurse">View by nurse</option>
                  </select>
                  <label className="nursing-admin-ratio-control flex min-h-11 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-bold" title="Required nurses per ward, date, and shift">
                    <span>Ratio</span>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      inputMode="numeric"
                      className="w-14 bg-transparent font-black outline-none"
                      value={requiredNurses}
                      onChange={(event) => updateRequiredNurses(event.target.value)}
                    />
                  </label>
                </div>
              </div>
              <div className="mt-5 overflow-hidden rounded-xl border border-slate-200">
                <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-100 text-xs font-black uppercase tracking-[0.1em] text-slate-600">
                    <tr>
                      <th className="px-4 py-4">Nurse</th>
                      <th className="px-4 py-4">Ward</th>
                      <th className="px-4 py-4">Date</th>
                      <th className="px-4 py-4">Shift</th>
                      <th className="px-4 py-4">Hours</th>
                      <th className="px-4 py-4">Status</th>
                      <th className="px-4 py-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {visibleAssignments.map((row) => {
                      const rowStatus = assignmentStatus(row);
                      const profile = profileById.get(String(row?.nurseProfileId || row?.nurseProfile?.id || ""));
                      return (
                        <tr key={row.id} className="align-top hover:bg-slate-50">
                          <td className="px-4 py-4 font-black text-slate-950">{nurseName(row)}</td>
                          <td className="px-4 py-4 font-semibold text-slate-700">{row?.wardName || row?.wardId || "Unassigned"}</td>
                          <td className="px-4 py-4 font-semibold text-slate-700">{formatDate(row?.shiftDate)}</td>
                          <td className="px-4 py-4 font-bold text-slate-800">{SHIFT_RULES[row?.shiftType]?.label || row?.shiftType || "Day"}</td>
                          <td className="px-4 py-4 font-semibold text-slate-700">{shiftWindow(row).hours.toFixed(1)}</td>
                          <td className="px-4 py-4">
                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-black ${
                                rowStatus === "APPROVED"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : rowStatus.includes("SICK") || rowStatus.includes("REJECTED")
                                    ? "bg-rose-100 text-rose-800"
                                    : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {rowStatus}
                            </span>
                            {profile?.licenseValidUntil && (daysUntil(profile.licenseValidUntil) ?? 1) < 0 ? (
                              <p className="mt-1 text-xs font-bold text-rose-700">License expired</p>
                            ) : null}
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                disabled={saving === `approve-${row.id}` || rowStatus === "APPROVED"}
                                className="inline-flex min-h-9 items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-black text-white shadow-sm disabled:opacity-50"
                                onClick={() => void approveShift(row)}
                              >
                                <CheckCircle2 size={14} /> Approve
                              </button>
                              <button
                                type="button"
                                disabled={saving === `sick-${row.id}` || rowStatus.includes("SICK")}
                                className="inline-flex min-h-9 items-center gap-1 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-black text-white shadow-sm disabled:opacity-50"
                                onClick={() => void markSick(row)}
                              >
                                <XCircle size={14} /> Sick Leave
                              </button>
                              <button
                                type="button"
                                className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-black text-blue-800"
                                onClick={() => setSelectedShift(row)}
                              >
                                <Users size={14} /> Swaps
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {!visibleAssignments.length ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-10 text-center text-sm font-bold text-slate-500">
                          No roster assignments found for this filter.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
                </div>
              </div>
            </div>

            <div className="nursing-admin-insights grid gap-5 lg:grid-cols-2">
              <article className="nursing-admin-insight nursing-admin-insight-warning rounded-2xl border border-amber-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-3 text-amber-900">
                  <span className="rounded-lg bg-amber-50 p-2">
                  <AlertTriangle size={19} />
                  </span>
                  <h3 className="font-black">Understaffed shift gaps</h3>
                </div>
                <div className="space-y-3">
                  {understaffedShifts.slice(0, 5).map((gap) => (
                    <div key={`${gap.ward}-${gap.date}-${gap.shift}`} className="rounded-lg border border-amber-100 bg-amber-50 p-3 text-sm font-bold leading-6 text-slate-800">
                      <strong>{gap.ward} - {formatDate(gap.date)} - {SHIFT_RULES[gap.shift]?.label || gap.shift}</strong>
                      <span className="block text-amber-900">Assigned {gap.count} / Required {gap.required}. Shortage {gap.shortage} nurse{gap.shortage === 1 ? "" : "s"}.</span>
                    </div>
                  ))}
                  {!understaffedShifts.length ? <p className="text-sm font-bold text-amber-900">No staffing gaps for this month.</p> : null}
                </div>
              </article>

              <article className="nursing-admin-insight nursing-admin-insight-info rounded-2xl border border-blue-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-3 text-blue-900">
                  <span className="rounded-lg bg-blue-50 p-2">
                  <Users size={19} />
                  </span>
                  <h3 className="font-black">Swap or overtime cover</h3>
                </div>
                {selectedShift ? (
                  <div className="space-y-3">
                    <p className="text-sm font-bold text-blue-950">
                      Cover for {SHIFT_RULES[selectedShift?.shiftType]?.label || selectedShift?.shiftType} on{" "}
                      {formatDate(selectedShift?.shiftDate)}
                    </p>
                    {availableSwapNurses.slice(0, 5).map((profile) => (
                      <div key={profile.id} className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm font-bold leading-6 text-slate-800">
                        {nurseName(profile)} - projected week {weeklyHours(String(profile.id), isoDate(selectedShift?.shiftDate), selectedShift).toFixed(1)}h
                      </div>
                    ))}
                    {!availableSwapNurses.length ? (
                      <p className="text-sm font-bold text-blue-950">No nurse currently passes rest and weekly-hour checks for this cover.</p>
                    ) : null}
                  </div>
                ) : (
                  <p className="text-sm font-bold text-blue-950">Select Swaps on a roster row to see available nurses.</p>
                )}
              </article>
            </div>
          </div>
        </section>
      ) : (
        <section className="nursing-admin-workspace nursing-admin-workspace-full grid gap-6 xl:grid-cols-[480px_minmax(0,1fr)]">
          <form onSubmit={saveCompetency} className="nursing-admin-panel rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex items-center gap-3 border-b border-slate-100 pb-4">
              <span className="rounded-lg bg-blue-50 p-2 text-blue-700">
              <ClipboardCheck size={20} />
              </span>
              <h2 className="text-lg font-black text-slate-950">Nursing competency assessment</h2>
            </div>
            <div className="grid gap-4">
              <label className="grid gap-2 text-sm font-bold text-slate-700">
                Nurse
                <select
                  className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  value={competencyForm.nurseProfileId}
                  onChange={(event) => setCompetencyForm({ ...competencyForm, nurseProfileId: event.target.value })}
                >
                  <option value="">Select nurse profile</option>
                  {profiles.map((profile) => (
                    <option key={profile.id} value={profile.id}>
                      {nurseName(profile)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 text-sm font-bold text-slate-700">
                Competency
                <select
                  className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  value={competencyForm.skillName}
                  onChange={(event) => setCompetencyForm({ ...competencyForm, skillName: event.target.value })}
                >
                  {MANDATORY_COMPETENCIES.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-bold text-slate-700">
                  Result
                  <select
                    className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    value={competencyForm.competencyLevel}
                    onChange={(event) => setCompetencyForm({ ...competencyForm, competencyLevel: event.target.value })}
                  >
                    <option value="COMPETENT">Competent</option>
                    <option value="REQUIRES_SUPERVISION">Requires supervision</option>
                    <option value="NOT_YET_COMPETENT">Not yet competent</option>
                  </select>
                </label>
                <label className="grid gap-2 text-sm font-bold text-slate-700">
                  Assessment date
                  <input
                    type="date"
                    className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    value={competencyForm.assessmentDate}
                    onChange={(event) => setCompetencyForm({ ...competencyForm, assessmentDate: event.target.value })}
                  />
                </label>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-bold text-slate-700">
                  Expiry date
                  <input
                    type="date"
                    className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    value={competencyForm.validUntil}
                    onChange={(event) => setCompetencyForm({ ...competencyForm, validUntil: event.target.value })}
                  />
                </label>
                <label className="grid gap-2 text-sm font-bold text-slate-700">
                  Score
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    value={competencyForm.score}
                    onChange={(event) => setCompetencyForm({ ...competencyForm, score: event.target.value })}
                  />
                </label>
              </div>
              <label className="grid gap-2 text-sm font-bold text-slate-700">
                Assessor
                <input
                  className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  value={competencyForm.assessorName}
                  onChange={(event) => setCompetencyForm({ ...competencyForm, assessorName: event.target.value })}
                />
              </label>
              <label className="grid gap-2 text-sm font-bold text-slate-700">
                Assessor notes
                <textarea
                  className="min-h-28 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  value={competencyForm.notes}
                  onChange={(event) => setCompetencyForm({ ...competencyForm, notes: event.target.value })}
                />
              </label>
              {CRITICAL_COMPETENCIES.includes(competencyForm.skillName) ? (
                <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm font-bold leading-6 text-rose-900">
                  Critical safety competency. Expiry or failed assessment restricts related procedure documentation.
                </div>
              ) : null}
              <button
                type="submit"
                disabled={saving === "competency"}
                className="mt-1 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-blue-800 disabled:opacity-60"
              >
                <Save size={18} /> {saving === "competency" ? "Saving..." : "Save Assessment"}
              </button>
            </div>
          </form>

          <div className="nursing-admin-board-stack space-y-6">
            <div className="nursing-admin-competency-cards grid gap-4 lg:grid-cols-3">
              <article className="nursing-admin-mini-card rounded-2xl border border-rose-200 bg-white p-5 shadow-sm">
                <ShieldAlert className="mb-3 text-rose-700" size={22} />
                <p className="text-sm font-black uppercase text-rose-800">Restricted nurses</p>
                <p className="mt-2 text-3xl font-black text-rose-950">{restrictedNurses.length}</p>
              </article>
              <article className="nursing-admin-mini-card rounded-2xl border border-amber-200 bg-white p-5 shadow-sm">
                <Clock className="mb-3 text-amber-700" size={22} />
                <p className="text-sm font-black uppercase text-amber-800">Renewal alerts</p>
                <p className="mt-2 text-3xl font-black text-amber-950">{expiringCompetencies.length}</p>
              </article>
              <article className="nursing-admin-mini-card rounded-2xl border border-blue-200 bg-white p-5 shadow-sm">
                <Stethoscope className="mb-3 text-blue-700" size={22} />
                <p className="text-sm font-black uppercase text-blue-800">Tracked skills</p>
                <p className="mt-2 text-3xl font-black text-blue-950">{skills.length}</p>
              </article>
            </div>

            <div className="nursing-admin-panel nursing-admin-table-panel rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-5 flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-black text-slate-950">Competency register</h2>
                  <p className="text-sm font-semibold text-slate-600">Expiry alerts and mandatory skill restrictions are calculated live.</p>
                </div>
                <label className="relative">
                  <Search className="absolute left-3 top-3 text-slate-400" size={16} />
                  <input
                    className="nursing-admin-search-input min-h-11 w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm font-semibold outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 sm:w-72"
                    placeholder="Search competency..."
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </label>
              </div>
              <div className="overflow-hidden rounded-xl border border-slate-200">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-100 text-xs font-black uppercase tracking-[0.1em] text-slate-600">
                    <tr>
                      <th className="px-4 py-4">Nurse</th>
                      <th className="px-4 py-4">Competency</th>
                      <th className="px-4 py-4">Status</th>
                      <th className="px-4 py-4">Issued</th>
                      <th className="px-4 py-4">Expires</th>
                      <th className="px-4 py-4">Alert</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {certifications
                      .filter((cert) => {
                        const needle = search.trim().toLowerCase();
                        const haystack = [nurseName(cert), cert?.certificationName, cert?.status, cert?.notes].join(" ").toLowerCase();
                        return !needle || haystack.includes(needle);
                      })
                      .map((cert) => {
                        const remaining = daysUntil(cert?.validUntil);
                        const expired = remaining !== null && remaining < 0;
                        const expiring = remaining !== null && remaining >= 0 && remaining <= RENEWAL_ALERT_DAYS;
                        const critical = CRITICAL_COMPETENCIES.includes(String(cert?.certificationName || ""));
                        return (
                          <tr key={cert.id} className="hover:bg-slate-50">
                            <td className="px-4 py-4 font-black text-slate-950">{nurseName(cert)}</td>
                            <td className="px-4 py-4 font-semibold text-slate-700">{cert?.certificationName || "Competency"}</td>
                            <td className="px-4 py-4">
                              <span className={`rounded-full px-2.5 py-1 text-xs font-black ${cert?.status === "ACTIVE" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                                {cert?.status || "PENDING"}
                              </span>
                            </td>
                            <td className="px-4 py-4 font-semibold text-slate-700">{formatDate(cert?.issuedAt)}</td>
                            <td className="px-4 py-4 font-semibold text-slate-700">{formatDate(cert?.validUntil)}</td>
                            <td className="px-4 py-4">
                              {expired ? (
                                <span className="rounded-full bg-rose-100 px-2.5 py-1 text-xs font-black text-rose-800">
                                  {critical ? "Restricted" : "Expired"}
                                </span>
                              ) : expiring ? (
                                <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-black text-amber-800">
                                  Renew in {remaining} days
                                </span>
                              ) : (
                                <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-black text-emerald-800">
                                  Current
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    {!certifications.length ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-10 text-center text-sm font-bold text-slate-500">
                          No competency assessments recorded yet.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
              </div>
            </div>

            <div className="nursing-admin-panel nursing-admin-restrictions rounded-2xl border border-rose-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-4 flex items-center gap-3 text-rose-800">
                <span className="rounded-lg bg-rose-50 p-2">
                <ShieldAlert size={19} />
                </span>
                <h3 className="font-black">Mandatory competency restrictions</h3>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {restrictedNurses.slice(0, 6).map((profile) => (
                  <div key={profile.id} className="rounded-lg border border-rose-100 bg-rose-50 p-4 text-sm font-bold leading-6 text-rose-950">
                    {nurseName(profile)} has missing or expired critical competency. Restrict critical procedure documentation until renewed.
                  </div>
                ))}
                {!restrictedNurses.length ? (
                  <p className="text-sm font-bold text-slate-600">All active nurse profiles meet current critical competency checks.</p>
                ) : null}
              </div>
            </div>
          </div>
        </section>
      )}

      {activeTab === "training" ? (
        <section className="nursing-admin-training-workspace nursing-admin-workspace nursing-admin-workspace-full grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
          <div className="nursing-admin-training-form nursing-admin-panel rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex items-center gap-3 border-b border-slate-100 pb-4">
              <span className="rounded-lg bg-violet-50 p-2 text-violet-700"><GraduationCap size={20} /></span>
              <div><h2 className="text-lg font-black text-slate-950">Training &amp; CPD activity</h2><p className="text-sm font-semibold text-slate-600">Record verified learning and renewal requirements.</p></div>
            </div>
            <p className="text-sm font-semibold text-slate-600">Use the Training &amp; CPD action in the administration rail to record a new activity.</p>
            <div className="hidden">
              <label className="grid gap-2 text-sm font-bold text-slate-700">Nurse
                <select className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 py-2.5" value={trainingForm.staffId} onChange={(event) => setTrainingForm({ ...trainingForm, staffId: event.target.value })} required>
                  <option value="">Select nurse</option>{profiles.map((profile) => <option key={profile.staffId || profile.id} value={profile.staffId || profile.staff?.id}>{nurseName(profile)}</option>)}
                </select>
              </label>
              <label className="grid gap-2 text-sm font-bold text-slate-700">Activity type
                <select className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 py-2.5" value={trainingForm.trainingType} onChange={(event) => setTrainingForm({ ...trainingForm, trainingType: event.target.value })}><option>CPD_ACTIVITY</option><option>MANDATORY_TRAINING</option><option>IN_SERVICE</option><option>CONFERENCE</option><option>COMPETENCY_RENEWAL</option></select>
              </label>
              <label className="grid gap-2 text-sm font-bold text-slate-700">Provider<input className="min-h-11 rounded-lg border border-slate-300 px-3 py-2.5" value={trainingForm.provider} onChange={(event) => setTrainingForm({ ...trainingForm, provider: event.target.value })} placeholder="Training provider or institution" /></label>
              <div className="grid gap-4 sm:grid-cols-2"><label className="grid gap-2 text-sm font-bold text-slate-700">Due date<input type="date" className="min-h-11 rounded-lg border border-slate-300 px-3 py-2.5" value={trainingForm.dueDate} onChange={(event) => setTrainingForm({ ...trainingForm, dueDate: event.target.value })} /></label><label className="grid gap-2 text-sm font-bold text-slate-700">Completed date<input type="date" className="min-h-11 rounded-lg border border-slate-300 px-3 py-2.5" value={trainingForm.completedDate} onChange={(event) => setTrainingForm({ ...trainingForm, completedDate: event.target.value })} /></label></div>
              <div className="grid gap-4 sm:grid-cols-2"><label className="grid gap-2 text-sm font-bold text-slate-700">CPD credits<input type="number" min="0" step="0.5" className="min-h-11 rounded-lg border border-slate-300 px-3 py-2.5" value={trainingForm.credits} onChange={(event) => setTrainingForm({ ...trainingForm, credits: event.target.value })} /></label><label className="grid gap-2 text-sm font-bold text-slate-700">Status<select className="min-h-11 rounded-lg border border-slate-300 px-3 py-2.5" value={trainingForm.status} onChange={(event) => setTrainingForm({ ...trainingForm, status: event.target.value })}><option>PENDING</option><option>COMPLETED</option><option>VERIFIED</option><option>OVERDUE</option></select></label></div>
              <label className="grid gap-2 text-sm font-bold text-slate-700">Evidence / notes<textarea className="min-h-24 rounded-lg border border-slate-300 px-3 py-2.5" value={trainingForm.notes} onChange={(event) => setTrainingForm({ ...trainingForm, notes: event.target.value })} placeholder="Certificate reference, learning outcome, or verification note" /></label>
              <button type="submit" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-violet-700 px-4 py-2.5 text-sm font-black text-white hover:bg-violet-800" disabled={saving === "training"}><Save size={17} />{saving === "training" ? "Saving..." : "Save Training Record"}</button>
            </div></div>
          <div className="nursing-admin-panel nursing-admin-table-panel rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-lg font-black text-slate-950">Training &amp; CPD register</h2><p className="text-sm font-semibold text-slate-600">Renewals and completed learning remain visible to nursing administration.</p></div><div className="flex flex-wrap items-center gap-3"><label className="relative"><Search className="absolute left-3 top-3 text-slate-400" size={16} /><input className="nursing-admin-search-input min-h-10 w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm font-semibold sm:w-60" placeholder="Search training..." value={trainingSearch} onChange={(event) => setTrainingSearch(event.target.value)} /></label><span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-black text-violet-800">{trainingRecords.filter((row) => row.status === "COMPLETED" || row.status === "VERIFIED").length} completed</span></div></div>
            <div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-slate-100 text-xs font-black uppercase tracking-[0.1em] text-slate-600"><tr><th className="px-4 py-4">Nurse</th><th className="px-4 py-4">Activity</th><th className="px-4 py-4">Provider</th><th className="px-4 py-4">Due</th><th className="px-4 py-4">Credits</th><th className="px-4 py-4">Status</th></tr></thead><tbody className="divide-y divide-slate-100">{visibleTrainingRecords.map((row) => <tr key={row.id} className="hover:bg-slate-50"><td className="px-4 py-4 font-black text-slate-950">{formatStaffName(row.staff)}</td><td className="px-4 py-4 font-semibold text-slate-700">{row.trainingType || "CPD activity"}</td><td className="px-4 py-4 font-semibold text-slate-700">{row.provider || "-"}</td><td className="px-4 py-4 font-semibold text-slate-700">{formatDate(row.dueDate)}</td><td className="px-4 py-4 font-semibold text-slate-700">{row.credits ?? 0}</td><td className="px-4 py-4"><span className="rounded-full bg-violet-100 px-2.5 py-1 text-xs font-black text-violet-800">{row.status || "PENDING"}</span></td></tr>)}{!visibleTrainingRecords.length ? <tr><td colSpan={6} className="px-4 py-10 text-center font-bold text-slate-500">{trainingRecords.length ? "No training records match your search." : "No training or CPD records found."}</td></tr> : null}</tbody></table></div>
          </div>
        </section>
      ) : null}
        </main>
      </div>

      {activeModal === "training" ? (
        <div className="module-form-overlay" onClick={() => setActiveModal(null)}>
          <form onSubmit={saveTraining} className="module-form-panel modal-panel module-form-panel-nursing-admin nursing-admin-action-modal" style={{ "--module-form-accent": "#7c3aed", "--module-form-accent-dark": "#5b21b6", "--module-form-accent-soft": "#7c3aed22" } as any} onClick={(event) => event.stopPropagation()}>
            <div className="module-form-header"><div className="module-form-heading"><div className="module-form-icon"><GraduationCap size={20} /></div><div><div className="module-form-kicker">Nursing Administration</div><h2 className="module-form-title">Training &amp; CPD Activity</h2></div></div><button type="button" className="modal-close-btn" onClick={() => setActiveModal(null)}>x</button></div>
            <div className="module-form-body"><div className="module-form-grid">
              <div className="module-form-field is-wide"><label className="form-label">Nurse</label><select className="module-form-input" value={trainingForm.staffId} onChange={(event) => setTrainingForm({ ...trainingForm, staffId: event.target.value })} required><option value="">Select nurse</option>{profiles.map((profile) => <option key={profile.staffId || profile.id} value={profile.staffId || profile.staff?.id}>{nurseName(profile)}</option>)}</select></div>
              <div className="module-form-field"><label className="form-label">Activity type</label><select className="module-form-input" value={trainingForm.trainingType} onChange={(event) => setTrainingForm({ ...trainingForm, trainingType: event.target.value })}><option>CPD_ACTIVITY</option><option>MANDATORY_TRAINING</option><option>IN_SERVICE</option><option>CONFERENCE</option><option>COMPETENCY_RENEWAL</option></select></div>
              <div className="module-form-field"><label className="form-label">Provider</label><input className="module-form-input" value={trainingForm.provider} onChange={(event) => setTrainingForm({ ...trainingForm, provider: event.target.value })} /></div>
              <div className="module-form-field"><label className="form-label">Due date</label><input type="date" className="module-form-input" value={trainingForm.dueDate} onChange={(event) => setTrainingForm({ ...trainingForm, dueDate: event.target.value })} /></div>
              <div className="module-form-field"><label className="form-label">Completed date</label><input type="date" className="module-form-input" value={trainingForm.completedDate} onChange={(event) => setTrainingForm({ ...trainingForm, completedDate: event.target.value })} /></div>
              <div className="module-form-field"><label className="form-label">CPD credits</label><input type="number" min="0" step="0.5" className="module-form-input" value={trainingForm.credits} onChange={(event) => setTrainingForm({ ...trainingForm, credits: event.target.value })} /></div>
              <div className="module-form-field"><label className="form-label">Status</label><select className="module-form-input" value={trainingForm.status} onChange={(event) => setTrainingForm({ ...trainingForm, status: event.target.value })}><option>PENDING</option><option>COMPLETED</option><option>VERIFIED</option><option>OVERDUE</option></select></div>
              <div className="module-form-field is-wide"><label className="form-label">Evidence / notes</label><textarea className="module-form-input" value={trainingForm.notes} onChange={(event) => setTrainingForm({ ...trainingForm, notes: event.target.value })} /></div>
            </div><div className="module-form-footer"><button type="button" className="form-btn form-btn-cancel" onClick={() => setActiveModal(null)}>Cancel</button><button type="submit" className="form-btn form-btn-primary module-form-submit" disabled={saving === "training"}>{saving === "training" ? "Saving..." : "Save Training Record"}</button></div></div>
          </form>
        </div>
      ) : null}

      {activeModal === "roster" ? (
        <div className="module-form-overlay" onClick={() => setActiveModal(null)}>
          <form
            onSubmit={saveRoster}
            className="module-form-panel modal-panel module-form-panel-nursing-admin nursing-admin-action-modal"
            style={{ "--module-form-accent": "#059669", "--module-form-accent-dark": "#047857", "--module-form-accent-soft": "#05966922" } as any}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="module-form-header">
              <div className="module-form-heading">
                <div className="module-form-icon"><CalendarDays size={20} /></div>
                <div>
                  <div className="module-form-kicker">Nursing Administration</div>
                  <h2 className="module-form-title">Duty Roster</h2>
                </div>
              </div>
              <button type="button" className="modal-close-btn" onClick={() => setActiveModal(null)}>x</button>
            </div>
            <div className="module-form-intro">
              <p className="module-form-note">Create a shift while enforcing rest-period and weekly-hour checks.</p>
            </div>
            <div className="module-form-body">
              <div className="module-form-grid">
                <div className="module-form-field is-wide">
                  <label className="form-label">Nurse</label>
                  <select className="module-form-input" value={rosterForm.nurseProfileId} onChange={(event) => setRosterForm({ ...rosterForm, nurseProfileId: event.target.value })} required>
                    <option value="">Select nurse profile</option>
                    {profiles.map((profile) => <option key={profile.id} value={profile.id}>{nurseName(profile)} {profile.skillLevel ? `- ${profile.skillLevel}` : ""}</option>)}
                  </select>
                </div>
                <div className="module-form-field">
                  <label className="form-label">Ward</label>
                  <input className="module-form-input" placeholder="Medical Ward" value={rosterForm.wardId} onChange={(event) => setRosterForm({ ...rosterForm, wardId: event.target.value })} />
                </div>
                <div className="module-form-field">
                  <label className="form-label">Shift date</label>
                  <input type="date" className="module-form-input" value={rosterForm.shiftDate} onChange={(event) => setRosterForm({ ...rosterForm, shiftDate: event.target.value })} required />
                </div>
                <div className="module-form-field">
                  <label className="form-label">Shift type</label>
                  <select className="module-form-input" value={rosterForm.shiftType} onChange={(event) => setRosterForm({ ...rosterForm, shiftType: event.target.value, onCall: event.target.value === "ON_CALL" })}>
                    {Object.entries(SHIFT_RULES).map(([value, rule]) => <option key={value} value={value}>{rule.label} ({rule.start}-{rule.end})</option>)}
                  </select>
                </div>
                <div className="module-form-field">
                  <label className="form-label">Overtime minutes</label>
                  <input type="number" min="0" className="module-form-input" value={rosterForm.overtimeMinutes} onChange={(event) => setRosterForm({ ...rosterForm, overtimeMinutes: event.target.value })} />
                </div>
                <div className="module-form-field is-wide">
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                    <input type="checkbox" checked={rosterForm.approved} onChange={(event) => setRosterForm({ ...rosterForm, approved: event.target.checked })} />
                    Approve this shift immediately
                  </label>
                </div>
                <div className="module-form-field is-wide">
                  <label className="form-label">Manager notes</label>
                  <textarea className="module-form-input" value={rosterForm.approvalNotes} onChange={(event) => setRosterForm({ ...rosterForm, approvalNotes: event.target.value })} />
                </div>
                {rosterWarning ? <div className="module-form-alert is-warning">{rosterWarning}</div> : rosterForm.nurseProfileId ? <div className="module-form-alert is-success">Weekly total after saving: {rosterHours.toFixed(1)} / {MAX_WEEKLY_HOURS} hours.</div> : null}
              </div>
              <div className="module-form-footer">
                <button type="button" className="form-btn form-btn-cancel" onClick={() => setActiveModal(null)}>Cancel</button>
                <button type="submit" className="form-btn form-btn-primary module-form-submit" disabled={saving === "roster"}>{saving === "roster" ? "Saving..." : "Save Duty Roster"}</button>
              </div>
            </div>
          </form>
        </div>
      ) : null}

      {activeModal === "profile" ? (
        <div className="module-form-overlay" onClick={() => setActiveModal(null)}>
          <form
            onSubmit={createProfile}
            className="module-form-panel modal-panel module-form-panel-nursing-admin nursing-admin-action-modal"
            style={{ "--module-form-accent": "#334155", "--module-form-accent-dark": "#0f172a", "--module-form-accent-soft": "#33415522" } as any}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="module-form-header">
              <div className="module-form-heading">
                <div className="module-form-icon"><UserPlus size={20} /></div>
                <div>
                  <div className="module-form-kicker">Nursing Administration</div>
                  <h2 className="module-form-title">Nurse Profile</h2>
                </div>
              </div>
              <button type="button" className="modal-close-btn" onClick={() => setActiveModal(null)}>x</button>
            </div>
            <div className="module-form-body">
              <div className="module-form-grid">
                <div className="module-form-field is-wide">
                  <label className="form-label">Staff member</label>
                  <select className="module-form-input" value={profileForm.staffId} onChange={(event) => setProfileForm({ ...profileForm, staffId: event.target.value })} required>
                    <option value="">Select staff member</option>
                    {staffWithoutProfile.map((person) => <option key={person.id} value={person.id}>{formatStaffName(person)}</option>)}
                  </select>
                </div>
                <div className="module-form-field">
                  <label className="form-label">Skill level</label>
                  <input className="module-form-input" value={profileForm.skillLevel} onChange={(event) => setProfileForm({ ...profileForm, skillLevel: event.target.value })} />
                </div>
                <div className="module-form-field">
                  <label className="form-label">Years experience</label>
                  <input type="number" min="0" className="module-form-input" value={profileForm.yearsExperience} onChange={(event) => setProfileForm({ ...profileForm, yearsExperience: event.target.value })} />
                </div>
                <div className="module-form-field">
                  <label className="form-label">License number</label>
                  <input className="module-form-input" value={profileForm.licenseNumber} onChange={(event) => setProfileForm({ ...profileForm, licenseNumber: event.target.value })} />
                </div>
                <div className="module-form-field">
                  <label className="form-label">License valid until</label>
                  <input type="date" className="module-form-input" value={profileForm.licenseValidUntil} onChange={(event) => setProfileForm({ ...profileForm, licenseValidUntil: event.target.value })} />
                </div>
                <div className="module-form-field is-wide">
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                    <input type="checkbox" checked={profileForm.isWardSupervisor} onChange={(event) => setProfileForm({ ...profileForm, isWardSupervisor: event.target.checked })} />
                    Ward supervisor
                  </label>
                </div>
              </div>
              <div className="module-form-footer">
                <button type="button" className="form-btn form-btn-cancel" onClick={() => setActiveModal(null)}>Cancel</button>
                <button type="submit" className="form-btn form-btn-primary module-form-submit" disabled={saving === "profile"}>{saving === "profile" ? "Creating..." : "Create Profile"}</button>
              </div>
            </div>
          </form>
        </div>
      ) : null}

      {activeModal === "competency" ? (
        <div className="module-form-overlay" onClick={() => setActiveModal(null)}>
          <form
            onSubmit={saveCompetency}
            className="module-form-panel modal-panel module-form-panel-nursing-admin nursing-admin-action-modal"
            style={{ "--module-form-accent": "#2563eb", "--module-form-accent-dark": "#1d4ed8", "--module-form-accent-soft": "#2563eb22" } as any}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="module-form-header">
              <div className="module-form-heading">
                <div className="module-form-icon"><ClipboardCheck size={20} /></div>
                <div>
                  <div className="module-form-kicker">Nursing Administration</div>
                  <h2 className="module-form-title">Competency Assessment</h2>
                </div>
              </div>
              <button type="button" className="modal-close-btn" onClick={() => setActiveModal(null)}>x</button>
            </div>
            <div className="module-form-body">
              <div className="module-form-grid">
                <div className="module-form-field is-wide">
                  <label className="form-label">Nurse</label>
                  <select className="module-form-input" value={competencyForm.nurseProfileId} onChange={(event) => setCompetencyForm({ ...competencyForm, nurseProfileId: event.target.value })} required>
                    <option value="">Select nurse profile</option>
                    {profiles.map((profile) => <option key={profile.id} value={profile.id}>{nurseName(profile)}</option>)}
                  </select>
                </div>
                <div className="module-form-field">
                  <label className="form-label">Competency</label>
                  <select className="module-form-input" value={competencyForm.skillName} onChange={(event) => setCompetencyForm({ ...competencyForm, skillName: event.target.value })}>
                    {MANDATORY_COMPETENCIES.map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                </div>
                <div className="module-form-field">
                  <label className="form-label">Result</label>
                  <select className="module-form-input" value={competencyForm.competencyLevel} onChange={(event) => setCompetencyForm({ ...competencyForm, competencyLevel: event.target.value })}>
                    <option value="COMPETENT">Competent</option>
                    <option value="REQUIRES_SUPERVISION">Requires supervision</option>
                    <option value="NOT_YET_COMPETENT">Not yet competent</option>
                  </select>
                </div>
                <div className="module-form-field">
                  <label className="form-label">Assessment date</label>
                  <input type="date" className="module-form-input" value={competencyForm.assessmentDate} onChange={(event) => setCompetencyForm({ ...competencyForm, assessmentDate: event.target.value })} required />
                </div>
                <div className="module-form-field">
                  <label className="form-label">Expiry date</label>
                  <input type="date" className="module-form-input" value={competencyForm.validUntil} onChange={(event) => setCompetencyForm({ ...competencyForm, validUntil: event.target.value })} />
                </div>
                <div className="module-form-field">
                  <label className="form-label">Score</label>
                  <input type="number" min="0" max="100" className="module-form-input" value={competencyForm.score} onChange={(event) => setCompetencyForm({ ...competencyForm, score: event.target.value })} />
                </div>
                <div className="module-form-field">
                  <label className="form-label">Assessor</label>
                  <input className="module-form-input" value={competencyForm.assessorName} onChange={(event) => setCompetencyForm({ ...competencyForm, assessorName: event.target.value })} />
                </div>
                <div className="module-form-field is-wide">
                  <label className="form-label">Assessor notes</label>
                  <textarea className="module-form-input" value={competencyForm.notes} onChange={(event) => setCompetencyForm({ ...competencyForm, notes: event.target.value })} />
                </div>
                {CRITICAL_COMPETENCIES.includes(competencyForm.skillName) ? <div className="module-form-alert is-error">Critical safety competency. Expiry or failed assessment restricts related procedure documentation.</div> : null}
              </div>
              <div className="module-form-footer">
                <button type="button" className="form-btn form-btn-cancel" onClick={() => setActiveModal(null)}>Cancel</button>
                <button type="submit" className="form-btn form-btn-primary module-form-submit" disabled={saving === "competency"}>{saving === "competency" ? "Saving..." : "Save Assessment"}</button>
              </div>
            </div>
          </form>
        </div>
      ) : null}
      </div>
    </div>
  );
}
