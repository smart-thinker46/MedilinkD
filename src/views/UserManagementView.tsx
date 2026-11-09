"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Clock3,
  Fingerprint,
  KeyRound,
  LockKeyhole,
  Maximize2,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  UserPlus,
  UsersRound,
} from "lucide-react";
import { ModuleIcon } from "../components/layout/ModuleIcon";
import { api } from "../lib/api";
import { useLiveRefresh } from "../lib/liveRefresh";
import { MODULE_CATALOG } from "../lib/moduleCatalog";

type TenantUser = {
  id: string;
  name?: string | null;
  email: string;
  status: string;
  role?: { name?: string } | null;
  moduleIds?: number[];
  modules?: Array<{ moduleId: number; name: string; route?: string | null }>;
  passwordExpiresAt?: string;
  passwordExpiresInDays?: number;
  mfaEnabled?: boolean;
  mfaVerifiedAt?: string | null;
};

type RoleTemplate = {
  name: string;
  label?: string;
};

type SecuritySession = {
  id: string;
  userName: string;
  userEmail?: string | null;
  role?: string | null;
  deviceId?: string | null;
  ip?: string | null;
  createdAt: string;
  lastSeenAt: string;
  expiresAt: string;
  idleMinutes: number;
  durationMinutes: number;
  lockThreshold: number;
  lockStatus: string;
};

type BreakGlassItem = {
  id: string;
  patientId: string;
  reason: string;
  expiresAt: string;
  createdAt: string;
};

type AccessChange = { auditId: string; id?: string; targetUserId: string; roleName?: string; privilege?: string; status: string; requestedBy?: string; reason?: string; createdAt?: string };

function SectionExpandButton({ section, expandedSection, onToggle }: { section: string; expandedSection: string | null; onToggle: (section: string) => void }) {
  const expanded = expandedSection === section;
  return (
    <button type="button" className="security-section-expand" onClick={() => onToggle(section)} aria-label={expanded ? "Collapse section" : "Expand section"} title={expanded ? "Collapse section" : "Expand section"}>
      <Maximize2 size={15} />
    </button>
  );
}

const defaultRoles: RoleTemplate[] = [
  { name: "hospital_admin", label: "Hospital Admin" },
  { name: "doctor", label: "Doctor" },
  { name: "registered_nurse", label: "Registered Nurse" },
  { name: "pharmacist", label: "Pharmacist" },
  { name: "lab_technologist", label: "Lab Technologist" },
  { name: "radiologist", label: "Radiologist" },
  { name: "billing_officer", label: "Billing Officer" },
  { name: "hr_manager", label: "HR Manager" },
  { name: "ict_manager", label: "ICT Manager" },
];

const defaultPrivileges = [
  "USER_CREATE", "USER_UPDATE", "USER_DELETE", "ROLE_ASSIGN", "RBAC_POLICY_MANAGE",
  "MODULE_ACCESS_ASSIGN", "AUDIT_READ", "AUDIT_EXPORT", "SECURITY_POSTURE_READ",
  "SESSION_MANAGE", "TWO_FACTOR_MANAGE", "SENSITIVE_DATA_ACCESS", "BREAK_GLASS_ACCESS",
];

const formatRole = (value?: string | null) =>
  String(value || "User")
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const formatDate = (value?: string) => {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";
  return date.toLocaleDateString();
};

const toastTone = (value: string) => {
  const lower = value.toLowerCase();
  if (/(unauthorized|forbidden|unable|could not|failed|invalid|required)/.test(lower)) return "error";
  if (/(pending|warning|expire|locked)/.test(lower)) return "warning";
  return "success";
};

const isModulePermission = (permission: string) => /^MODULE(?::|_)/i.test(String(permission || "").trim());

const unwrapList = (value: any): any[] => {
  if (Array.isArray(value)) return value;
  for (const candidate of [value?.data, value?.items, value?.rows, value?.results]) {
    if (Array.isArray(candidate)) return candidate;
  }
  return [];
};

const moduleNameById = new Map(MODULE_CATALOG.map((module) => [module.id, module.name]));

export default function UsersPage() {
  const [users, setUsers] = useState<TenantUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<TenantUser | null>(null);
  const [roles, setRoles] = useState<RoleTemplate[]>(defaultRoles);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [dashboard, setDashboard] = useState<any>(null);
  const [securityMe, setSecurityMe] = useState<any>(null);
  const [accessMe, setAccessMe] = useState<any>(null);
  const [sessions, setSessions] = useState<SecuritySession[]>([]);
  const [breakGlassActive, setBreakGlassActive] = useState<BreakGlassItem[]>([]);
  const [accessChanges, setAccessChanges] = useState<AccessChange[]>([]);
  const [serviceIdentities, setServiceIdentities] = useState<any[]>([]);
  const [securityEvents, setSecurityEvents] = useState<any[]>([]);
  const [mfaBootstrap, setMfaBootstrap] = useState<{ secret?: string; otpauthUrl?: string }>({});
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMfa, setLoadingMfa] = useState(false);
  const [saving, setSaving] = useState(false);
  const [breakGlassSaving, setBreakGlassSaving] = useState(false);
  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [accessRequestOpen, setAccessRequestOpen] = useState(false);
  const [mfaOpen, setMfaOpen] = useState(false);
  const [breakGlassOpen, setBreakGlassOpen] = useState(false);
  const [serviceIdentityOpen, setServiceIdentityOpen] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    roleName: "doctor",
    moduleIds: [] as number[],
  });
  const [mfaForm, setMfaForm] = useState({
    email: "",
    password: "",
    otp: "",
  });
  const [breakGlassForm, setBreakGlassForm] = useState({
    patientId: "",
    reason: "Emergency treatment",
    justification: "",
    expiresInMinutes: "60",
  });
  const [accessForm, setAccessForm] = useState({ targetUserId: "", privilege: "RBAC_POLICY_MANAGE", scope: "FACILITY", reason: "" });
  const [serviceForm, setServiceForm] = useState({ name: "", ownerTeam: "", scope: "FACILITY", rotationDueAt: "" });

  const activeUsers = users.filter((user) => String(user.status).toUpperCase() === "ACTIVE").length;
  const lockedUsers = users.filter((user) => String(user.status).toUpperCase().includes("LOCK")).length;
  const expiringSoon = users.filter((user) => Number(user.passwordExpiresInDays ?? 99) <= 7).length;
  const mfaEnabledCount = Number(dashboard?.users?.mfaEnabled ?? users.filter((user: any) => Boolean(user?.mfaEnabled)).length ?? 0);
  const activeSessionCount = Number(dashboard?.sessions?.active ?? sessions.filter((session) => session.lockStatus === "ACTIVE").length ?? 0);
  const privilegeOptions = permissions.length ? permissions : defaultPrivileges;

  const filteredUsers = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return users;
    return users.filter((user) => {
      const modules = (user.modules || [])
        .map((module) => module.name)
        .join(" ");
      return `${user.name || ""} ${user.email} ${user.role?.name || ""} ${modules} ${user.status}`
        .toLowerCase()
        .includes(needle);
    });
  }, [search, users]);

  const loadData = async () => {
    setLoading(true);
    const failedSources: string[] = [];
    const safeGet = async (label: string, url: string, fallback: any) => {
      try {
        return (await api.get(url)).data;
      } catch (error: any) {
        const status = error?.response?.status;
        failedSources.push(`${label}${status ? ` (${status})` : ""}`);
        return fallback;
      }
    };
    try {
      const [
        usersRes,
        permissionsRes,
        catalogRes,
        dashboardRes,
        securityMeRes,
        accessMeRes,
        sessionsRes,
        breakGlassRes,
        accessChangesRes,
        serviceIdentitiesRes,
        securityEventsRes,
      ] = await Promise.all([
        safeGet("users", "/tenant-users", []),
        safeGet("permissions", "/security/permissions", []),
        safeGet("RBAC catalog", "/security/rbac/catalog", { templates: [] }),
        safeGet("dashboard", "/security/dashboard", null),
        safeGet("security profile", "/security/me", null),
        safeGet("access profile", "/security/access/me", null),
        safeGet("sessions", "/security/sessions", []),
        safeGet("break-glass", "/security/break-glass/active", []),
        safeGet("access changes", "/security/access-changes?limit=50", []),
        safeGet("service identities", "/security/service-identities?limit=50", []),
        safeGet("security events", "/security/events?limit=50", []),
      ]);
      setUsers(unwrapList(usersRes));
      setPermissions(unwrapList(permissionsRes).filter((permission: string) => !isModulePermission(permission)));
      setDashboard(dashboardRes ?? null);
      setSecurityMe(securityMeRes ?? null);
      setAccessMe(accessMeRes ?? null);
      setSessions(unwrapList(sessionsRes));
      setBreakGlassActive(unwrapList(breakGlassRes));
      setAccessChanges(unwrapList(accessChangesRes));
      setServiceIdentities(unwrapList(serviceIdentitiesRes));
      setSecurityEvents(unwrapList(securityEventsRes));
      const templates = Array.isArray(catalogRes?.templates)
        ? catalogRes.templates.map((template: any) => ({
            name: template.name,
            label: template.label,
          }))
        : [];
      if (templates.length > 0) setRoles(templates);
      if (failedSources.length > 0) {
        setToast(`${failedSources.length} User & Security data source${failedSources.length === 1 ? "" : "s"} could not be loaded: ${failedSources.join(", ")}.`);
      }
    } catch (error: any) {
      setToast(error?.response?.data?.message || "Could not load user security data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  useLiveRefresh(loadData, { intervalMs: 90000 });

  const submitMfaBootstrap = async () => {
    if (!mfaForm.email.trim() || !mfaForm.password.trim()) {
      setToast("Enter email and password to bootstrap MFA.");
      return;
    }
    setLoadingMfa(true);
    setToast("");
    try {
      const response = await api.post("/auth/mfa/bootstrap", {
        email: mfaForm.email.trim(),
        password: mfaForm.password,
      });
      setMfaBootstrap({
        secret: response.data?.secret,
        otpauthUrl: response.data?.otpauthUrl,
      });
      setToast(response.data?.enrolled ? "MFA is already enrolled." : "MFA secret generated. Scan it in your authenticator app.");
    } catch (error: any) {
      setToast(error?.response?.data?.message || "Unable to bootstrap MFA.");
    } finally {
      setLoadingMfa(false);
    }
  };

  const submitMfaConfirm = async () => {
    if (!mfaForm.email.trim() || !mfaForm.otp.trim()) {
      setToast("Enter email and TOTP code to confirm MFA.");
      return;
    }
    setLoadingMfa(true);
    setToast("");
    try {
      await api.post("/auth/mfa/confirm", {
        email: mfaForm.email.trim(),
        otp: mfaForm.otp.trim(),
      });
      setToast("MFA confirmed and enforced for the account.");
      setMfaOpen(false);
      await loadData();
    } catch (error: any) {
      setToast(error?.response?.data?.message || "Unable to confirm MFA.");
    } finally {
      setLoadingMfa(false);
    }
  };

  const submitBreakGlass = async () => {
    if (!breakGlassForm.patientId.trim() || breakGlassForm.justification.trim().length < 50) {
      setToast("Select a patient and enter at least 50 characters of clinical justification.");
      return;
    }
    setBreakGlassSaving(true);
    setToast("");
    try {
      await api.post("/security/break-glass", {
        patientId: breakGlassForm.patientId.trim(),
        reason: breakGlassForm.reason,
        justification: breakGlassForm.justification.trim(),
        expiresInMinutes: Number(breakGlassForm.expiresInMinutes || 60),
      });
      setToast("Break-glass access granted and logged.");
      setBreakGlassOpen(false);
      setBreakGlassForm((current) => ({ ...current, justification: "" }));
      await loadData();
    } catch (error: any) {
      setToast(error?.response?.data?.message || "Unable to grant break-glass access.");
    } finally {
      setBreakGlassSaving(false);
    }
  };

  const revokeBreakGlass = async (patientId: string) => {
    setToast("");
    try {
      await api.post("/security/break-glass/revoke", { patientId });
      setToast("Break-glass access revoked.");
      await loadData();
    } catch (error: any) {
      setToast(error?.response?.data?.message || "Unable to revoke break-glass access.");
    }
  };

  const toggleUserStatus = async (user: TenantUser) => {
    const next = String(user.status).toUpperCase() === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    try {
      await api.patch(`/tenant-users/${encodeURIComponent(user.id)}/status`, { status: next });
      setToast(`Account ${next.toLowerCase()}.`);
      await loadData();
    } catch (error: any) {
      setToast(error?.response?.data?.message || "Unable to update account status.");
    }
  };

  const deleteUser = async (user: TenantUser) => {
    const name = user.name || user.email;
    if (!window.confirm(`Delete ${name}? This permanently removes the account and its access assignments.`)) return;
    try {
      await api.delete(`/tenant-users/${encodeURIComponent(user.id)}`);
      setSelectedUser(null);
      setToast(`User ${name} deleted.`);
      await loadData();
    } catch (error: any) {
      setToast(error?.response?.data?.message || "Unable to delete user.");
    }
  };

  const requestAccessChange = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      await api.post("/security/access-changes", accessForm);
      setAccessForm((current) => ({ ...current, reason: "" }));
      setToast("Access change submitted for independent approval.");
      setAccessRequestOpen(false);
      await loadData();
    } catch (error: any) { setToast(error?.response?.data?.message || "Unable to submit access change."); }
  };

  const decideAccessChange = async (auditId: string, approved: boolean) => {
    try {
      await api.post(`/security/access-changes/${encodeURIComponent(auditId)}/decision`, { approved });
      setToast(approved ? "Access change approved." : "Access change rejected.");
      await loadData();
    } catch (error: any) { setToast(error?.response?.data?.message || "Unable to record access decision."); }
  };

  const resetMfa = async (userId: string) => {
    try {
      await api.post(`/security/users/${encodeURIComponent(userId)}/mfa/reset`, { reason: "Administrator-approved authenticator recovery" });
      setToast("MFA reset and active sessions revoked. The user must enroll again.");
      await loadData();
    } catch (error: any) { setToast(error?.response?.data?.message || "Unable to reset MFA."); }
  };

  const createReview = async () => {
    try {
      await api.post("/security/access-reviews", { period: new Date().toISOString().slice(0, 7) });
      setToast("Access recertification review opened.");
      await loadData();
    } catch (error: any) { setToast(error?.response?.data?.message || "Unable to open access review."); }
  };

  const revokeServiceIdentity = async (id: string) => {
    try {
      await api.post(`/security/service-identities/${encodeURIComponent(id)}/revoke`, { reason: "Revoked from security console" });
      setToast("Service identity revoked.");
      await loadData();
    } catch (error: any) { setToast(error?.response?.data?.message || "Unable to revoke service identity."); }
  };

  const createServiceIdentity = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      await api.post("/security/service-identities", serviceForm);
      setServiceForm({ name: "", ownerTeam: "", scope: "FACILITY", rotationDueAt: "" });
      setToast("Service identity registered without interactive credentials.");
      setServiceIdentityOpen(false);
      await loadData();
    } catch (error: any) { setToast(error?.response?.data?.message || "Unable to register service identity."); }
  };

  const revokeSession = async (sessionId: string) => {
    try {
      await api.post(`/security/sessions/${encodeURIComponent(sessionId)}/revoke`);
      setToast("Session revoked and access invalidated.");
      await loadData();
    } catch (error: any) {
      setToast(error?.response?.data?.message || "Unable to revoke session.");
    }
  };

  const toggleModule = (moduleId: number) => {
    setForm((current) => {
      const exists = current.moduleIds.includes(moduleId);
      return {
        ...current,
        moduleIds: exists
          ? current.moduleIds.filter((id) => id !== moduleId)
          : [...current.moduleIds, moduleId],
      };
    });
  };

  const selectAllModules = () => {
    setForm((current) => ({
      ...current,
      moduleIds:
        current.moduleIds.length === MODULE_CATALOG.length
          ? []
          : MODULE_CATALOG.map((module) => module.id),
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setToast("");
    if (form.moduleIds.length === 0) {
      setToast("Select at least one module this user can access.");
      return;
    }
    setSaving(true);
    try {
      await api.post("/tenant-users", {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        roleName: form.roleName,
        moduleIds: form.moduleIds,
      });
      setForm({ name: "", email: "", password: "", roleName: "doctor", moduleIds: [] });
      setToast("User created. Module access and 30-day password expiry are active.");
      setCreateUserOpen(false);
      await loadData();
    } catch (error: any) {
      setToast(error?.response?.data?.message || "Could not create user.");
    } finally {
      setSaving(false);
    }
  };

  const toggleExpandedSection = (section: string) => {
    setExpandedSection((current) => (current === section ? null : section));
  };

  const moduleNames = (user: TenantUser) => {
    const modules = user.modules?.length
      ? user.modules.map((module) => module.name)
      : (user.moduleIds || []).map((id) => moduleNameById.get(id) || `Module ${id}`);
    return modules.length > 0 ? modules.join(", ") : "Role default access";
  };

  return (
    <div className="patients-view user-security-view">
      <div className="pv-header">
        <div>
          <div className="pv-title flex items-center gap-2">
            <ModuleIcon name="security" />
            User & Security
          </div>
          <div className="pv-subtitle">
            Create users, assign module access, manage password expiry, and review permissions.
          </div>
        </div>
        <div className="module-actions">
          <button className="topbar-logout-btn" type="button" onClick={() => void loadData()}>
            <ModuleIcon name="sync_alt" /> Refresh
          </button>
          <button className="topbar-logout-btn" type="button" onClick={() => void createReview()}>
            <ShieldCheck size={15} /> Open Access Review
          </button>
          <button className="topbar-logout-btn" type="button" onClick={() => setCreateUserOpen(true)}>
            <UserPlus size={15} /> New User
          </button>
        </div>
      </div>

      <div className="pv-stats">
        <div className="pv-stat-card" style={{ borderLeftColor: "#1e3a8a" }}>
          <div className="user-security-stat-icon"><UsersRound size={18} /></div><div><p className="pv-stat-label">Users</p><p className="pv-stat-value">{users.length}</p></div>
        </div>
        <div className="pv-stat-card" style={{ borderLeftColor: "#16a34a" }}>
          <div className="user-security-stat-icon"><ShieldCheck size={18} /></div><div><p className="pv-stat-label">Active Users</p><p className="pv-stat-value">{activeUsers}</p></div>
        </div>
        <div className="pv-stat-card" style={{ borderLeftColor: "#dc2626" }}>
          <div className="user-security-stat-icon"><LockKeyhole size={18} /></div><div><p className="pv-stat-label">Locked</p><p className="pv-stat-value">{lockedUsers}</p></div>
        </div>
        <div className="pv-stat-card" style={{ borderLeftColor: "#f59e0b" }}>
          <div className="user-security-stat-icon"><Clock3 size={18} /></div><div><p className="pv-stat-label">Passwords Expiring Soon</p><p className="pv-stat-value">{expiringSoon}</p></div>
        </div>
        <div className="pv-stat-card" style={{ borderLeftColor: "#7c3aed" }}>
          <div className="user-security-stat-icon"><Fingerprint size={18} /></div><div><p className="pv-stat-label">MFA Enabled</p><p className="pv-stat-value">{mfaEnabledCount}</p></div>
        </div>
        <div className="pv-stat-card" style={{ borderLeftColor: "#0f766e" }}>
          <div className="user-security-stat-icon"><Activity size={18} /></div><div><p className="pv-stat-label">Active Sessions</p><p className="pv-stat-value">{activeSessionCount}</p></div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3 user-security-overview">
        <section className={`security-permissions-catalog ${expandedSection === "posture" ? "is-expanded" : ""}`} data-expandable-section="posture">
          <div className="security-permissions-title">
            <LockKeyhole size={18} />
            <div>
              <h3>Security Posture</h3>
              <p>Read the current control summary before making access changes.</p>
            </div>
            <SectionExpandButton section="posture" expandedSection={expandedSection} onToggle={toggleExpandedSection} />
          </div>
          <div className="mt-4 grid gap-3 security-posture-body">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-slate-500">Login Success</div>
                <div className="mt-1 text-lg font-black text-slate-900">{dashboard?.authentication24h?.loginSuccess ?? 0}</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-slate-500">Login Failed</div>
                <div className="mt-1 text-lg font-black text-slate-900">{dashboard?.authentication24h?.loginFailed ?? 0}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-slate-500">Break-Glass</div>
                <div className="mt-1 text-lg font-black text-slate-900">{breakGlassActive.length}</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-slate-500">MFA State</div>
                <div className="mt-1 text-lg font-black text-slate-900">{securityMe?.mfaEnabled ? "Enforced" : "Pending"}</div>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
              <div className="font-semibold text-slate-900">{securityMe?.roleLabel || "Current user"}</div>
              <div className="mt-1">{accessMe?.permissions?.length ?? 0} active permissions across {accessMe?.moduleIds?.length ?? 0} modules.</div>
            </div>
          </div>
        </section>

        <section className={`security-permissions-catalog security-launch-only ${expandedSection === "roles" ? "is-expanded" : ""}`} data-expandable-section="roles">
          <div className="security-permissions-title">
            <UsersRound size={18} />
            <div>
              <h3>Roles and Templates</h3>
              <p>{roles.length} preconfigured role templates loaded from the RBAC catalog.</p>
            </div>
            <SectionExpandButton section="roles" expandedSection={expandedSection} onToggle={toggleExpandedSection} />
          </div>
          <div className="mt-4 max-h-[250px] overflow-auto pr-1">
            <div className="grid gap-2">
              {roles.map((role) => (
                <div key={role.name} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <div className="font-semibold text-slate-900">{role.label || formatRole(role.name)}</div>
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-500">{role.name}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className={`security-permissions-catalog ${expandedSection === "notes" ? "is-expanded" : ""}`} data-expandable-section="notes">
          <div className="security-permissions-title">
            <AlertTriangle size={18} />
            <div>
              <h3>Control Notes</h3>
              <p>RBAC checks run on the backend before API actions are processed.</p>
            </div>
            <SectionExpandButton section="notes" expandedSection={expandedSection} onToggle={toggleExpandedSection} />
          </div>
          <div className="mt-4 grid gap-3 text-sm text-slate-700">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <div className="font-semibold text-slate-900">Role-based access control</div>
              <div className="mt-1">Module access comes from the selected role and assigned module permissions.</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <div className="font-semibold text-slate-900">Multi-factor authentication</div>
              <div className="mt-1">Clinical and financial users require TOTP enrollment before login completes.</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <div className="font-semibold text-slate-900">Break-glass logging</div>
              <div className="mt-1">Emergency access is reasoned, time-limited, and visible to audit and governance.</div>
            </div>
          </div>
        </section>
      </div>

      <section className={`security-permissions-catalog security-governance-panel ${expandedSection === "governance" ? "is-expanded" : ""}`} data-expandable-section="governance">
        <div className="security-permissions-title"><ShieldCheck size={18} /><div><h3>Privileged Access Governance</h3><p>High-impact privileges require an independent decision and are retained in the security audit trail.</p></div><button type="button" className="security-panel-launch" onClick={() => setAccessRequestOpen(true)}>Request Access</button><SectionExpandButton section="governance" expandedSection={expandedSection} onToggle={toggleExpandedSection} /></div>
        <form className={`mt-4 grid gap-3 md:grid-cols-4 security-popup-form ${accessRequestOpen ? "is-open" : ""}`} onSubmit={requestAccessChange}>
          <div className="security-popup-form-head"><strong>Request privileged access</strong><button type="button" onClick={() => setAccessRequestOpen(false)} aria-label="Close access request">×</button></div>
          <select className="module-form-input" value={accessForm.targetUserId} onChange={(event) => setAccessForm((current) => ({ ...current, targetUserId: event.target.value }))} required>
            <option value="">Select user</option>{users.map((user) => <option key={user.id} value={user.id}>{user.name || user.email}</option>)}
          </select>
          <input className="module-form-input" list="security-privilege-options" value={accessForm.privilege} onChange={(event) => setAccessForm((current) => ({ ...current, privilege: event.target.value }))} placeholder="Search or select privilege" required />
          <datalist id="security-privilege-options">{privilegeOptions.map((privilege) => <option key={privilege} value={privilege} />)}</datalist>
          <select className="module-form-input" value={accessForm.scope} onChange={(event) => setAccessForm((current) => ({ ...current, scope: event.target.value }))}><option>FACILITY</option><option>DEPARTMENT</option><option>OWN</option><option>GLOBAL</option></select>
          <input className="module-form-input" value={accessForm.reason} onChange={(event) => setAccessForm((current) => ({ ...current, reason: event.target.value }))} placeholder="Business justification" required />
          <button type="submit" className="form-btn form-btn-primary"><ShieldCheck size={15} /> Request Approval</button>
        </form>
        <div className="mt-4 overflow-auto"><table className="pv-table"><thead><tr><th>Target</th><th>Privilege</th><th>Status</th><th>Requested</th><th>Decision</th></tr></thead><tbody>{accessChanges.length ? accessChanges.slice(0, 8).map((change) => <tr key={change.auditId}><td>{users.find((user) => user.id === change.targetUserId)?.email || change.targetUserId}</td><td>{change.privilege || formatRole(change.roleName)}</td><td>{change.status}</td><td>{formatDate(change.createdAt)}</td><td>{change.status === "PENDING_APPROVAL" ? <span className="flex gap-2"><button type="button" className="topbar-logout-btn" onClick={() => void decideAccessChange(change.auditId, true)}>Approve</button><button type="button" className="topbar-logout-btn" onClick={() => void decideAccessChange(change.auditId, false)}>Reject</button></span> : "Recorded"}</td></tr>) : <tr><td className="pv-empty" colSpan={5}>No access changes awaiting review.</td></tr>}</tbody></table></div>
      </section>

      <section className={`security-form-shell security-launch-only ${createUserOpen ? "is-open" : ""} ${expandedSection === "provisioning" ? "is-expanded" : ""}`} data-expandable-section="provisioning">
        <div className="security-form-header">
          <div className="security-form-icon"><UserPlus size={22} /></div>
          <div>
            <p>User Account Provisioning</p>
            <h2>Create User Access</h2>
            <span>Passwords expire every 30 days. Selected modules control what appears on the user's dashboard.</span>
          </div>
          {createUserOpen ? <button type="button" className="security-form-close" onClick={() => setCreateUserOpen(false)} aria-label="Close Create User form">×</button> : <button type="button" className="security-panel-launch" onClick={() => setCreateUserOpen(true)}>Create User</button>}
          <SectionExpandButton section="provisioning" expandedSection={expandedSection} onToggle={toggleExpandedSection} />
        </div>

        <form onSubmit={handleSubmit} className="security-user-form">
          <label className="module-form-field">
            <span>Full Name</span>
            <input
              className="module-form-input"
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              required
              placeholder="e.g. Grace Otieno"
            />
          </label>
          <label className="module-form-field">
            <span>Email / Username</span>
            <input
              className="module-form-input"
              type="email"
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              required
              placeholder="user@hospital.co.ke"
            />
          </label>
          <label className="module-form-field">
            <span>Initial Password</span>
            <input
              className="module-form-input"
              type="password"
              value={form.password}
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
              required
              minLength={12}
              placeholder="Minimum 12 characters"
            />
          </label>
          <label className="module-form-field">
            <span>Role</span>
            <select
              className="module-form-input"
              value={form.roleName}
              onChange={(event) => setForm((current) => ({ ...current, roleName: event.target.value }))}
            >
              {roles.map((role) => (
                <option key={role.name} value={role.name}>
                  {role.label || formatRole(role.name)}
                </option>
              ))}
            </select>
          </label>

          <div className="security-module-access module-form-field is-wide">
            <div className="security-module-access-head">
              <div>
                <span>Module Access <strong className="security-module-count">{form.moduleIds.length}/{MODULE_CATALOG.length} selected</strong></span>
                <small>Select the modules this user will see after login.</small>
              </div>
              <button type="button" onClick={selectAllModules}>
                {form.moduleIds.length === MODULE_CATALOG.length ? "Clear All" : "Select All"}
              </button>
            </div>
            <div className="security-module-grid">
              {MODULE_CATALOG.map((module) => (
                <label key={module.id} className="security-module-option">
                  <input
                    type="checkbox"
                    checked={form.moduleIds.includes(module.id)}
                    onChange={() => toggleModule(module.id)}
                  />
                  <span>{module.name}</span>
                  <small>{module.layer}</small>
                </label>
              ))}
            </div>
          </div>

          <div className="module-form-footer security-form-footer">
            <button type="submit" className="form-btn form-btn-primary module-form-submit" disabled={saving}>
              <ShieldCheck size={16} />
              {saving ? "Creating..." : "Create User"}
            </button>
          </div>
        </form>
      </section>

      <div className="grid gap-4 lg:grid-cols-3 user-security-controls">
        <section className={`security-permissions-catalog ${expandedSection === "mfa" ? "is-expanded" : ""}`} data-expandable-section="mfa">
          <div className="security-permissions-title">
            <Fingerprint size={18} />
            <div>
              <h3>Current User MFA</h3>
              <p>One-time password state for the signed-in account.</p>
            </div>
            <button type="button" className="security-panel-launch" onClick={() => setMfaOpen(true)}>Manage MFA</button>
            <SectionExpandButton section="mfa" expandedSection={expandedSection} onToggle={toggleExpandedSection} />
          </div>
          <div className="security-section-summary"><strong>{securityMe?.mfaEnabled ? "MFA is enabled" : "MFA enrollment pending"}</strong><span>{securityMe?.mfaVerifiedAt ? "Authenticator verification is complete." : "Open Manage MFA to bootstrap or confirm an authenticator."}</span></div>
          <div className={`mt-4 grid gap-3 security-action-surface ${mfaOpen ? "is-open" : ""}`}>
            <div className="security-popup-form-head"><strong>Manage multi-factor authentication</strong><button type="button" onClick={() => setMfaOpen(false)} aria-label="Close MFA form">×</button></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-slate-500">Enabled</div>
                <div className="mt-1 text-lg font-black text-slate-900">{securityMe?.mfaEnabled ? "Yes" : "No"}</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-slate-500">Verified</div>
                <div className="mt-1 text-lg font-black text-slate-900">{securityMe?.mfaVerifiedAt ? "Complete" : "Pending"}</div>
              </div>
            </div>
            <label className="module-form-field">
              <span>Email</span>
              <input
                className="module-form-input"
                value={mfaForm.email}
                onChange={(event) => setMfaForm((current) => ({ ...current, email: event.target.value }))}
                placeholder="user@hospital.co.ke"
              />
            </label>
            <label className="module-form-field">
              <span>Password</span>
              <input
                className="module-form-input"
                type="password"
                value={mfaForm.password}
                onChange={(event) => setMfaForm((current) => ({ ...current, password: event.target.value }))}
                placeholder="Current password"
              />
            </label>
            <label className="module-form-field">
              <span>TOTP Code</span>
              <input
                className="module-form-input"
                value={mfaForm.otp}
                onChange={(event) => setMfaForm((current) => ({ ...current, otp: event.target.value }))}
                placeholder="6-digit code"
              />
            </label>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="topbar-logout-btn" onClick={() => void submitMfaBootstrap()} disabled={loadingMfa}>
                <Fingerprint size={16} /> {loadingMfa ? "Working..." : "Bootstrap MFA"}
              </button>
              <button type="button" className="topbar-logout-btn" onClick={() => void submitMfaConfirm()} disabled={loadingMfa}>
                <ShieldCheck size={16} /> Confirm MFA
              </button>
            </div>
            {mfaBootstrap.secret ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
                <div className="font-semibold">MFA secret generated</div>
                <div className="mt-1 break-all font-mono text-xs">{mfaBootstrap.secret}</div>
                {mfaBootstrap.otpauthUrl ? <div className="mt-2 break-all text-xs text-emerald-800">{mfaBootstrap.otpauthUrl}</div> : null}
              </div>
            ) : null}
          </div>
        </section>

        <section className={`security-permissions-catalog security-launch-only ${expandedSection === "sessions" ? "is-expanded" : ""}`} data-expandable-section="sessions">
          <div className="security-permissions-title">
            <Clock3 size={18} />
            <div>
              <h3>Live Sessions</h3>
              <p>{sessions.length} active browser sessions tracked by idle timer.</p>
            </div>
            <SectionExpandButton section="sessions" expandedSection={expandedSection} onToggle={toggleExpandedSection} />
          </div>
          <div className="mt-4 max-h-[380px] overflow-auto rounded-2xl border border-slate-200">
            <table className="pv-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Idle</th>
                  <th>Device</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {sessions.length ? (
                  sessions.map((session) => (
                    <tr key={session.id}>
                      <td>
                        <strong>{session.userName}</strong>
                        <br />
                        <small>{session.userEmail || "No email"}</small>
                      </td>
                      <td>{formatRole(session.role)}</td>
                      <td>
                        <span className={session.lockStatus === "ACTIVE" ? "pv-badge badge-green" : "pv-badge badge-red"}>
                          {session.idleMinutes} min / lock {session.lockThreshold} min
                        </span>
                      </td>
                      <td>
                        <strong>{session.deviceId || "desktop"}</strong>
                        <br />
                        <small>{session.ip || "No IP"}</small>
                      </td>
                      <td><button type="button" className="topbar-logout-btn" onClick={() => void revokeSession(session.id)}>Revoke</button></td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="pv-empty" colSpan={5}>No active sessions available.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className={`security-permissions-catalog ${expandedSection === "break-glass" ? "is-expanded" : ""}`} data-expandable-section="break-glass">
          <div className="security-permissions-title">
            <ShieldAlert size={18} />
            <div>
              <h3>Break-Glass</h3>
              <p>Emergency access is logged and reviewable.</p>
            </div>
            <button type="button" className="security-panel-launch" onClick={() => setBreakGlassOpen(true)}>Grant Access</button>
            <SectionExpandButton section="break-glass" expandedSection={expandedSection} onToggle={toggleExpandedSection} />
          </div>
          <div className="security-section-summary"><strong>{breakGlassActive.length ? `${breakGlassActive.length} active emergency entr${breakGlassActive.length === 1 ? "y" : "ies"}` : "No active emergency access"}</strong><span>Time-limited break-glass grants remain logged for review.</span></div>
          <div className={`mt-4 grid gap-3 security-action-surface ${breakGlassOpen ? "is-open" : ""}`}>
            <div className="security-popup-form-head"><strong>Grant emergency break-glass access</strong><button type="button" onClick={() => setBreakGlassOpen(false)} aria-label="Close break-glass form">×</button></div>
            <label className="module-form-field">
              <span>Patient ID</span>
              <input
                className="module-form-input"
                value={breakGlassForm.patientId}
                onChange={(event) => setBreakGlassForm((current) => ({ ...current, patientId: event.target.value }))}
                placeholder="Patient ID"
              />
            </label>
            <label className="module-form-field">
              <span>Reason</span>
              <select
                className="module-form-input"
                value={breakGlassForm.reason}
                onChange={(event) => setBreakGlassForm((current) => ({ ...current, reason: event.target.value }))}
              >
                <option>Emergency treatment</option>
                <option>Life-threatening situation</option>
                <option>Legal requirement</option>
                <option>Coroner investigation</option>
              </select>
            </label>
            <label className="module-form-field">
              <span>Justification</span>
              <textarea
                className="module-form-input"
                rows={4}
                value={breakGlassForm.justification}
                onChange={(event) => setBreakGlassForm((current) => ({ ...current, justification: event.target.value }))}
                placeholder="Minimum 50 characters of clinical justification"
              />
            </label>
            <label className="module-form-field">
              <span>Expires in minutes</span>
              <input
                className="module-form-input"
                type="number"
                min="15"
                value={breakGlassForm.expiresInMinutes}
                onChange={(event) => setBreakGlassForm((current) => ({ ...current, expiresInMinutes: event.target.value }))}
              />
            </label>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="topbar-logout-btn" onClick={() => void submitBreakGlass()} disabled={breakGlassSaving}>
                <ShieldAlert size={16} /> {breakGlassSaving ? "Granting..." : "Grant Access"}
              </button>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <div className="mb-2 text-sm font-semibold text-slate-900">Active entries</div>
              {breakGlassActive.length ? (
                <div className="grid gap-2">
                  {breakGlassActive.map((entry) => (
                    <div key={entry.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 text-sm">
                      <div>
                        <div className="font-semibold text-slate-900">{entry.reason}</div>
                        <div className="text-slate-500">{entry.patientId} • Expires {formatDate(entry.expiresAt)}</div>
                      </div>
                      <button type="button" className="topbar-logout-btn" onClick={() => void revokeBreakGlass(entry.patientId)}>
                        Revoke
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-slate-500">No active break-glass entries.</div>
              )}
            </div>
          </div>
        </section>
      </div>

      {toast ? (
        <div className={`security-toast is-${toastTone(toast)}`} role="status">
          <div className="security-toast-icon">
            {toastTone(toast) === "error" || toastTone(toast) === "warning" ? <AlertTriangle size={15} /> : <ShieldCheck size={15} />}
          </div>
          <strong>{toastTone(toast) === "error" ? "Action blocked" : toastTone(toast) === "warning" ? "Review needed" : "Success"}</strong>
          <span>{toast}</span>
          <button type="button" onClick={() => setToast("")} aria-label="Dismiss notification">X</button>
        </div>
      ) : null}

      <div className="pv-search-bar">
        <div className="pv-search-wrap">
          <ModuleIcon name="search" />
          <input
            className="pv-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search users, roles, modules..."
          />
        </div>
        <button type="button" className="security-search-action" onClick={() => setExpandedSection("sessions")}>
          <Clock3 size={16} /> View Live Sessions
        </button>
        <button type="button" className="security-search-action security-search-action-secondary" onClick={() => setExpandedSection("roles")}>
          <UsersRound size={16} /> Role Templates
        </button>
      </div>

      <section className={`security-table-section ${expandedSection === "users-table" ? "is-expanded" : ""}`} data-expandable-section="users-table">
        <div className="pv-table-head">
          <div>
            <h3><UsersRound size={18} /> Users Access Table</h3>
            <p>{filteredUsers.length} users</p>
          </div>
          <SectionExpandButton section="users-table" expandedSection={expandedSection} onToggle={toggleExpandedSection} />
        </div>
        <div className="pv-table-wrap">
          <table className="pv-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Modules User Access</th>
                <th>Password Expiry Date / Duration</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td className="pv-empty" colSpan={6}>Loading users...</td></tr>
              ) : filteredUsers.length === 0 ? (
                <tr><td className="pv-empty" colSpan={6}>No users found.</td></tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="security-user-row"
                    tabIndex={0}
                    onClick={() => setSelectedUser(user)}
                    onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setSelectedUser(user); } }}
                  >
                    <td>
                      <strong>{user.name || user.email}</strong>
                      <br />
                      <small>{user.email}</small>
                    </td>
                    <td>{formatRole(user.role?.name)}</td>
                    <td className="security-modules-cell">{moduleNames(user)}</td>
                    <td>
                      <KeyRound size={14} /> {formatDate(user.passwordExpiresAt)}
                      <br />
                      <small>{user.passwordExpiresInDays ?? 0} days remaining</small>
                    </td>
                    <td>{user.status}</td>
                    <td><span className="flex flex-wrap gap-2"><button type="button" className="topbar-logout-btn" onClick={(event) => { event.stopPropagation(); void toggleUserStatus(user); }}>{String(user.status).toUpperCase() === "ACTIVE" ? "Suspend" : "Activate"}</button><button type="button" className="security-danger-icon" aria-label={`Delete ${user.name || user.email}`} title="Delete user" onClick={(event) => { event.stopPropagation(); void deleteUser(user); }}><Trash2 size={15} /></button><button type="button" className="topbar-logout-btn" onClick={(event) => { event.stopPropagation(); void resetMfa(user.id); }}>Reset MFA</button></span></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {selectedUser ? (
        <div className="security-user-detail-overlay" role="dialog" aria-modal="true" aria-label="Selected user details">
          <section className="security-user-detail-card">
            <header className="security-user-detail-header">
              <div><span>SELECTED USER</span><h2>{selectedUser.name || selectedUser.email}</h2><p>{selectedUser.email}</p></div>
              <button type="button" className="security-user-detail-close" onClick={() => setSelectedUser(null)} aria-label="Close user details">×</button>
            </header>
            <div className="security-user-detail-grid">
              <div><small>ROLE</small><strong>{formatRole(selectedUser.role?.name)}</strong></div>
              <div><small>STATUS</small><strong>{selectedUser.status}</strong></div>
              <div><small>PASSWORD EXPIRY</small><strong>{formatDate(selectedUser.passwordExpiresAt)}</strong><span>{selectedUser.passwordExpiresInDays ?? 0} days remaining</span></div>
              <div><small>MFA</small><strong>{selectedUser.mfaEnabled ? "Enabled" : "Not enrolled"}</strong><span>{selectedUser.mfaVerifiedAt ? "Verified" : "Verification pending"}</span></div>
              <div className="is-wide"><small>MODULE ACCESS</small><strong>{moduleNames(selectedUser)}</strong></div>
            </div>
            <footer className="security-user-detail-actions"><button type="button" className="security-danger-btn" onClick={() => void deleteUser(selectedUser)}><Trash2 size={15} /> Delete User</button><button type="button" className="topbar-logout-btn" onClick={() => { void toggleUserStatus(selectedUser); setSelectedUser(null); }}>{String(selectedUser.status).toUpperCase() === "ACTIVE" ? "Suspend User" : "Activate User"}</button><button type="button" className="topbar-logout-btn" onClick={() => { void resetMfa(selectedUser.id); setSelectedUser(null); }}>Reset MFA</button></footer>
          </section>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2 user-security-monitoring">
        <section className={`security-permissions-catalog ${expandedSection === "service-identities" ? "is-expanded" : ""}`} data-expandable-section="service-identities">
          <div className="security-permissions-title"><KeyRound size={18} /><div><h3>Service Identities</h3><p>Non-human identities remain scoped, non-interactive, and revocable.</p></div><button type="button" className="security-panel-launch" onClick={() => setServiceIdentityOpen(true)}>Register Identity</button><SectionExpandButton section="service-identities" expandedSection={expandedSection} onToggle={toggleExpandedSection} /></div>
          <form className={`mt-4 grid gap-2 md:grid-cols-4 security-popup-form ${serviceIdentityOpen ? "is-open" : ""}`} onSubmit={createServiceIdentity}><div className="security-popup-form-head"><strong>Register service identity</strong><button type="button" onClick={() => setServiceIdentityOpen(false)} aria-label="Close service identity form">×</button></div><input className="module-form-input" placeholder="Identity name" value={serviceForm.name} onChange={(event) => setServiceForm((current) => ({ ...current, name: event.target.value }))} required /><input className="module-form-input" placeholder="Owner team" value={serviceForm.ownerTeam} onChange={(event) => setServiceForm((current) => ({ ...current, ownerTeam: event.target.value }))} required /><select className="module-form-input" value={serviceForm.scope} onChange={(event) => setServiceForm((current) => ({ ...current, scope: event.target.value }))}><option>FACILITY</option><option>DEPARTMENT</option><option>GLOBAL</option></select><button className="form-btn form-btn-primary" type="submit">Register</button></form>
          <div className="mt-4 overflow-auto"><table className="pv-table"><thead><tr><th>Name</th><th>Scope</th><th>Status</th><th>Action</th></tr></thead><tbody>{serviceIdentities.length ? serviceIdentities.map((identity: any) => <tr key={identity.id}><td><strong>{identity.name}</strong><br /><small>{identity.ownerTeam || "Unassigned owner"}</small></td><td>{identity.scope || "FACILITY"}</td><td>{identity.status || "ACTIVE"}</td><td>{identity.status !== "REVOKED" ? <button type="button" className="topbar-logout-btn" onClick={() => void revokeServiceIdentity(identity.id)}>Revoke</button> : "Revoked"}</td></tr>) : <tr><td className="pv-empty" colSpan={4}>No service identities registered.</td></tr>}</tbody></table></div>
        </section>
        <section className={`security-permissions-catalog ${expandedSection === "security-events" ? "is-expanded" : ""}`} data-expandable-section="security-events">
          <div className="security-permissions-title"><ShieldAlert size={18} /><div><h3>Security Event Monitor</h3><p>Recent governance actions and authentication controls.</p></div><SectionExpandButton section="security-events" expandedSection={expandedSection} onToggle={toggleExpandedSection} /></div>
          <div className="mt-4 overflow-auto"><table className="pv-table"><thead><tr><th>Event</th><th>Time</th></tr></thead><tbody>{securityEvents.length ? securityEvents.slice(0, 8).map((event: any) => <tr key={event.id}><td>{event.action}</td><td>{formatDate(event.createdAt)}</td></tr>) : <tr><td className="pv-empty" colSpan={2}>No security events recorded.</td></tr>}</tbody></table></div>
        </section>
      </div>

      <section className={`security-permissions-catalog ${expandedSection === "permissions" ? "is-expanded" : ""}`} data-expandable-section="permissions">
        <div className="security-permissions-title">
          <LockKeyhole size={18} />
          <div>
            <h3>Permissions Catalog</h3>
            <p>System privileges available for role and security policy configuration.</p>
          </div>
          <SectionExpandButton section="permissions" expandedSection={expandedSection} onToggle={toggleExpandedSection} />
        </div>
        <div className="security-permission-list">
          {(permissions.length > 0 ? permissions : ["USER_CREATE", "ROLE_ASSIGN", "MODULE_ACCESS_ASSIGN"]).map((permission) => (
            <span key={permission}>{permission}</span>
          ))}
        </div>
      </section>
    </div>
  );
}

export { UsersPage as UserManagementView };
