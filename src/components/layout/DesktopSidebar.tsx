import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Bot,
  Building2,
  Cable,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Crown,
  Droplets,
  FileText,
  GitMerge,
  GraduationCap,
  Handshake,
  HeartPulse,
  IdCard,
  ListChecks,
  MapPin,
  Megaphone,
  Navigation,
  PanelLeftClose,
  PanelLeftOpen,
  Send,
  Settings2,
  ShieldAlert,
  ShieldCheck,
  ShoppingCart,
  Users,
  UserX,
  Volume2,
} from "lucide-react";
import { MODULE_CATALOG } from "../../lib/moduleCatalog";
import { apiFetch } from "../../lib/apiClient";
import { useAppStore } from "../../store/appStore";

type DesktopSidebarProps = {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onRequestCollapse?: () => void;
  activeNav: number;
  activeWorkflowModuleId: number | null;
  onNavigateNav: (navIndex: number) => void;
  onNavigateUpgrade: () => void;
  onOpenHelpAi: () => void;
  facilityName?: string;
  facilityLogo?: string | null;
};

const patientWorkspaceTools = [
  { id: "monitor", label: "Monitor Patient", icon: ClipboardList },
  { id: "duplicates", label: "Duplicate Review", icon: AlertTriangle },
  { id: "identity-card", label: "ID Card / QR", icon: IdCard },
  { id: "documents", label: "Patient Documents", icon: FileText },
  { id: "audit", label: "Identity Audit", icon: ShieldCheck },
  { id: "status", label: "Lifecycle Status", icon: ListChecks },
  { id: "vulnerability", label: "Vulnerability Flags", icon: HeartPulse },
  { id: "merge", label: "Patient Merge", icon: GitMerge },
] as const;

const appointmentWorkspaceTools = [
  { id: "recurring", label: "Recurring Series", icon: CalendarClock },
  { id: "waitlist", label: "Release Waitlist", icon: ListChecks },
  { id: "no-show", label: "Mark No-Show", icon: UserX },
] as const;

const communityHealthWorkspaceTools = [
  { id: "chw", label: "Register CHW", icon: Users },
  { id: "visit", label: "Log Field Visit", icon: ClipboardList },
  { id: "referral", label: "Issue Referral", icon: Send },
  { id: "attendance", label: "Referral Feedback", icon: Handshake },
  { id: "surveillance", label: "Surveillance Return", icon: ShieldAlert },
  { id: "operations", label: "Operational Registers", icon: Settings2 },
] as const;

const homeCareWorkspaceTools = [
  { id: "dispatch", label: "Dispatch Route", icon: Navigation },
  { id: "checkin", label: "GPS Check In", icon: MapPin },
  { id: "checkout", label: "Complete Visit", icon: CheckCircle2 },
  { id: "visitStatus", label: "Visit Status", icon: ListChecks },
  { id: "escalation", label: "Escalate Patient", icon: AlertTriangle },
  { id: "operation", label: "Care Records", icon: ClipboardList },
] as const;

const opdWorkspaceTools = [
  { id: "monitor-patient", label: "Monitor Patient", icon: ClipboardList },
  { id: "queue-patient", label: "Queue Patient", icon: Send },
  { id: "orders", label: "Orders", icon: ShoppingCart },
] as const;

const orderReceivingModules: Record<string, string> = {
  ipd: "INPATIENT",
  lab: "LABORATORY",
  radiology: "RADIOLOGY",
  pharmacy: "PHARMACY",
};

const ipdWorkspaceTools = [
  { id: "monitor-patient", label: "Monitor Patient", icon: ClipboardList },
  { id: "queue-patient", label: "Queue Patient", icon: Send },
] as const;

const emergencyWorkspaceTools = [
  { id: "monitor-patient", label: "Monitor Patient", icon: ClipboardList },
  { id: "queue-patient", label: "Queue Patient", icon: Send },
] as const;

const maternityWorkspaceTools = [
  { id: "monitor-patient", label: "Monitor Patient", icon: ClipboardList },
  { id: "queue-patient", label: "Queue Patient", icon: Send },
] as const;

const icuWorkspaceTools = [
  { id: "monitor-patient", label: "Monitor Patient", icon: ClipboardList },
  { id: "queue-patient", label: "Queue Patient", icon: Send },
] as const;

const nicuWorkspaceTools = [
  { id: "monitor-patient", label: "Monitor Patient", icon: ClipboardList },
  { id: "queue-patient", label: "Queue Patient", icon: Send },
] as const;

const otWorkspaceTools = [
  { id: "monitor-patient", label: "Monitor Patient", icon: ClipboardList },
  { id: "queue-patient", label: "Queue Patient", icon: Send },
] as const;

const laboratoryWorkspaceTools = [
  { id: "monitor-patient", label: "Monitor Patient", icon: ClipboardList },
  { id: "queue-patient", label: "Queue Patient", icon: Send },
] as const;

const radiologyWorkspaceTools = [
  { id: "monitor-patient", label: "Monitor Patient", icon: ClipboardList },
  { id: "queue-patient", label: "Queue Patient", icon: Send },
] as const;

const pharmacyWorkspaceTools = [
  { id: "monitor-patient", label: "Monitor Patient", icon: ClipboardList },
  { id: "queue-patient", label: "Queue Patient", icon: Send },
] as const;

const bloodBankWorkspaceTools = [
  { id: "monitor-patient", label: "Monitor Patient", icon: ClipboardList },
  { id: "queue-patient", label: "Queue Patient", icon: Send },
  { id: "donor-registration", label: "Donor Registration", icon: Users },
  { id: "record-donation", label: "Record Donation", icon: Droplets },
  { id: "blood-request", label: "Blood Request", icon: ClipboardList },
] as const;

const queueWorkspaceTools = [
  { id: "monitor-patients", label: "Monitor Patients", icon: ClipboardList },
  { id: "voice-call-token", label: "Voice Call Token", icon: Volume2 },
  { id: "call-next-patient", label: "Call Next Patient", icon: Megaphone },
] as const;

const nursingWorkspaceTools = [
  { id: "monitor-patient", label: "Monitor Patient", icon: ClipboardList },
  { id: "queue-patient", label: "Queue Patient", icon: Send },
  { id: "handover", label: "Nursing Handover", icon: Handshake },
  { id: "fluid", label: "Fluid Balance Chart", icon: Droplets },
  { id: "braden", label: "Pressure Injury Braden Scale", icon: ShieldAlert },
] as const;

const physiotherapyWorkspaceTools = [
  { id: "monitor-patient", label: "Monitor Patient", icon: ClipboardList },
  { id: "queue-patient", label: "Queue Patient", icon: Send },
] as const;

const nutritionWorkspaceTools = [
  { id: "monitor-patient", label: "Monitor Patient", icon: ClipboardList },
  { id: "queue-patient", label: "Queue Patient", icon: Send },
] as const;

const dentalWorkspaceTools = [
  { id: "monitor-patient", label: "Monitor Patient", icon: ClipboardList },
  { id: "queue-patient", label: "Queue Patient", icon: Send },
] as const;

const paediatricsWorkspaceTools = [
  { id: "monitor-patient", label: "Monitor Patient", icon: ClipboardList },
  { id: "queue-patient", label: "Queue Patient", icon: Send },
] as const;

const infectionControlWorkspaceTools = [
  { id: "monitor-patient", label: "Monitor Patient", icon: ClipboardList },
  { id: "queue-patient", label: "Queue Patient", icon: Send },
] as const;

const biomedicalWorkspaceTools = [
  { id: "calibration", label: "Calibration", icon: Settings2 },
  { id: "interface", label: "Analyser Interface", icon: Cable },
  { id: "training", label: "Equipment Training", icon: GraduationCap },
  { id: "recall", label: "Device Recall", icon: ShieldAlert },
  { id: "safety", label: "Safety Hold", icon: ShieldAlert },
  { id: "commission", label: "Commission Device", icon: ListChecks },
  { id: "transfer", label: "Transfer Device", icon: GitMerge },
  { id: "incident", label: "Report Incident", icon: AlertTriangle },
] as const;

const normalizeQueueDepartmentId = (value: string) =>
  value
    .toUpperCase()
    .replace(/&/g, " AND ")
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 48);

const moduleQueueDepartmentOverride: Record<string, string> = {
  appointments: "APPOINTMENTS",
  outpatient: "OPD",
  "outpatient / opd": "OPD",
  emergency: "EMERGENCY",
  laboratory: "LABORATORY",
  radiology: "RADIOLOGY",
  pharmacy: "PHARMACY",
  billing: "BILLING",
  inpatient: "INPATIENT",
  maternity: "MATERNITY",
  icu: "ICU",
  nicu: "NICU",
  nursing: "NURSING",
  "nursing admin": "NURSING",
  dental: "DENTAL",
  paediatrics: "PAEDIATRICS",
  physiotherapy: "PHYSIOTHERAPY",
  "physiotherapy & rehabilitation": "PHYSIOTHERAPY",
  "nutrition & dietetics": "NUTRITION",
  "infection control & cssd": "INFECTION_CONTROL",
  "operating theatre": "THEATRE",
};

const nonPatientQueueModules = new Set([
  "hr",
  "payroll",
  "doctors",
  "workforce-planning",
  "revenue",
  "accounting",
  "cost-accounting",
  "biomedical",
  "reports",
  "executive",
  "blockchain",
  "users",
  "patient-portal",
  "portal",
  "ict",
  "integrations",
  "migration",
  "operations",
  "community-health",
]);

const moduleQueueConfig: Record<string, { departmentId: string; label: string }> = MODULE_CATALOG
  .filter((module) => module.id !== 1 && !nonPatientQueueModules.has(module.path.replace(/^\//, "").replace(/\//g, "-")))
  .reduce<Record<string, { departmentId: string; label: string }>>((acc, module) => {
    const moduleKey = module.path.replace(/^\//, "").replace(/\//g, "-");
    const nameKey = module.name.toLowerCase();
    acc[moduleKey] = {
      departmentId: moduleQueueDepartmentOverride[nameKey] || normalizeQueueDepartmentId(module.name),
      label: "Open Waiting List",
    };
    return acc;
  }, {});

const navToModuleKeyMap: Record<number, string> = {
  0: "",
  1: "patients",
  2: "opd",
  3: "appointments",
  4: "ehr",
  5: "nursing",
  6: "wards",
  7: "lab",
  8: "radiology",
  9: "billing",
  10: "pharmacy",
  11: "inventory",
  12: "settings",
  13: "facilities",
  14: "insurance",
  15: "procurement",
  16: "hr",
  17: "doctors",
  18: "facilities",
  19: "analytics",
  20: "users",
  21: "telemedicine",
  22: "blockchain",
  24: "portal",
  25: "emergency",
  26: "ambulance",
  27: "mortuary",
  28: "queue",
  29: "helpdesk",
  30: "canteen",
  31: "feedback",
  33: "quality-assurance",
  34: "integrations",
  35: "reports",
  36: "icu",
  37: "maternity",
  38: "nicu",
  39: "dental",
  41: "cdss",
  42: "migration",
  43: "ot",
  44: "physiotherapy",
  45: "nutrition",
  46: "paediatrics",
  47: "infection-control",
  48: "blood-bank",
  49: "biomedical",
  50: "pharmacy",
};

const formatModuleName = (moduleKey: string) =>
  moduleKey
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const readPatientModuleState = () => {
  if (typeof window === "undefined") {
    return { hasCheckedInPatient: false, isQueued: false };
  }
  try {
    const states = JSON.parse(window.localStorage.getItem("hmis_patient_module_states") || "{}");
    return states?.patients || { hasCheckedInPatient: false, isQueued: false };
  } catch {
    return { hasCheckedInPatient: false, isQueued: false };
  }
};

export function DesktopSidebar({
  collapsed,
  onToggleCollapsed,
  onRequestCollapse,
  activeNav,
  activeWorkflowModuleId,
  onNavigateNav,
  onNavigateUpgrade,
  onOpenHelpAi,
  facilityName = "Hospital Facility",
  facilityLogo = null,
}: DesktopSidebarProps) {
  const { facility } = useAppStore();
  const [waitingCount, setWaitingCount] = useState(0);
  const [orderCount, setOrderCount] = useState(0);
  const [patientModuleState, setPatientModuleState] = useState<any>(() => readPatientModuleState());

  const moduleKey = useMemo(() => {
    if (activeWorkflowModuleId) {
      const mod = MODULE_CATALOG.find((m) => m.id === activeWorkflowModuleId);
      if (mod) return mod.path.replace(/^\//, "").replace(/\//g, "-");
    }
    return navToModuleKeyMap[activeNav] || "";
  }, [activeNav, activeWorkflowModuleId]);

  const isModuleOpen = Boolean(moduleKey);
  const activeModuleTitle = moduleKey ? formatModuleName(moduleKey) : "Current Module";
  const waitingConfig = moduleQueueConfig[moduleKey];
  const orderDestination = orderReceivingModules[moduleKey];

  const collapseAfterAction = (action: () => void) => {
    action();
    if (isModuleOpen) onRequestCollapse?.();
  };

  useEffect(() => {
    const handlePatientState = (event: Event) => {
      setPatientModuleState((event as CustomEvent).detail || readPatientModuleState());
    };
    const syncPatientState = () => setPatientModuleState(readPatientModuleState());
    window.addEventListener("hmis:patient-module-state", handlePatientState);
    const timer = window.setInterval(syncPatientState, 1000);
    return () => {
      window.removeEventListener("hmis:patient-module-state", handlePatientState);
      window.clearInterval(timer);
    };
  }, []);

  // Waiting count
  useEffect(() => {
    let cancelled = false;
    const loadWaitingCount = async () => {
      if (!waitingConfig) {
        setWaitingCount(0);
        return;
      }
      try {
        const response = await apiFetch(`/outpatient/queue/board?departmentId=${waitingConfig.departmentId}`);
        const data = await response.json().catch(() => null);
        const tokens = Array.isArray(data?.tokens)
          ? data.tokens
          : Array.isArray(data?.data?.tokens)
          ? data.data.tokens
          : Array.isArray(data)
          ? data
          : [];
        if (!cancelled) setWaitingCount(tokens.length);
      } catch {
        if (!cancelled) setWaitingCount(0);
      }
    };
    void loadWaitingCount();
    const handleQueued = () => void loadWaitingCount();
    window.addEventListener("hmis:patient-queued", handleQueued);
    return () => {
      cancelled = true;
      window.removeEventListener("hmis:patient-queued", handleQueued);
    };
  }, [waitingConfig?.departmentId]);

  // Order count
  useEffect(() => {
    let cancelled = false;
    const loadOrderCount = async () => {
      if (!orderDestination) {
        setOrderCount(0);
        return;
      }
      try {
        const response = await apiFetch(
          `/orchestration/orders?destinationModule=${orderDestination}&status=ORDERED,SUBMITTED,ROUTED,RECEIVED,ACKNOWLEDGED,READY,SCHEDULED,IN_PROGRESS`
        );
        const data = await response.json().catch(() => null);
        const rows = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
        if (!cancelled) setOrderCount(rows.length);
      } catch {
        if (!cancelled) setOrderCount(0);
      }
    };
    void loadOrderCount();
    const refresh = () => void loadOrderCount();
    window.addEventListener("hmis:clinical-order-created", refresh);
    window.addEventListener("hmis:clinical-order-updated", refresh);
    const timer = window.setInterval(refresh, 30000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      window.removeEventListener("hmis:clinical-order-created", refresh);
      window.removeEventListener("hmis:clinical-order-updated", refresh);
    };
  }, [orderDestination]);

  const hospitalName = facilityName || facility?.name || "MediLink General Hospital";
  const hospitalLogo = facilityLogo || "/MedilinkHMIS.png";

  return (
    <aside className={`sidebar custom-scrollbar ${collapsed ? "sidebar-collapsed" : ""}`}>
      {/* Brand Header */}
      <div className="sidebar-brand-top">
        <img
          src="/MedilinkHMIS.png"
          alt="Medilink HMIS"
          className="brand-logo-main"
          onClick={() => onNavigateNav(0)}
          style={{ cursor: "pointer" }}
        />
        <button
          type="button"
          className="sidebar-collapse-btn"
          onClick={onToggleCollapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>
      </div>

      {/* Module Workspace Navigation */}
      <nav className="sidebar-form-section" aria-label="Module workspace">
        {!collapsed && (
          <div className="sidebar-section-heading">
            <span>Workspace</span>
            <small>{activeModuleTitle}</small>
          </div>
        )}

        {moduleKey === "patients" ? (
          <div className="sidebar-workspace-tools">
            {patientWorkspaceTools.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                className="sidebar-workspace-btn"
                title={label}
                onClick={() =>
                  collapseAfterAction(() =>
                    window.dispatchEvent(
                      new CustomEvent("hmis:patient-workspace-action", {
                        detail: { action: id },
                      })
                    )
                  )
                }
              >
                <Icon size={16} />
                {!collapsed && <span>{label}</span>}
              </button>
            ))}
            {patientModuleState?.hasCheckedInPatient ? (
              <button
                type="button"
                className="sidebar-workspace-btn"
                title="Queue Patient"
                onClick={() =>
                  collapseAfterAction(() =>
                    window.dispatchEvent(
                      new CustomEvent("hmis:patient-workspace-action", {
                        detail: { action: "queue" },
                      })
                    )
                  )
                }
              >
                <Send size={16} />
                {!collapsed && <span>Queue Patient</span>}
              </button>
            ) : null}
          </div>
        ) : moduleKey === "opd" ? (
          <div className="sidebar-workspace-tools">
            {opdWorkspaceTools.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                className="sidebar-workspace-btn"
                title={label}
                onClick={() =>
                  collapseAfterAction(() =>
                    window.dispatchEvent(
                      new CustomEvent("hmis:opd-sidebar-action", {
                        detail: { action: id },
                      })
                    )
                  )
                }
              >
                <Icon size={16} />
                {!collapsed && <span>{label}</span>}
              </button>
            ))}
            <button
              type="button"
              className="sidebar-workspace-btn"
              title="Open Waiting List"
              onClick={() =>
                collapseAfterAction(() =>
                  window.dispatchEvent(
                    new CustomEvent("hmis:opd-sidebar-action", {
                      detail: { action: "open-waiting-list" },
                    })
                  )
                )
              }
            >
              <ListChecks size={16} />
              {!collapsed && <span>Open Waiting List</span>}
            </button>
          </div>
        ) : moduleKey === "emergency" ? (
          <div className="sidebar-workspace-tools">
            {emergencyWorkspaceTools.map(({ id, label, icon: Icon }, index) => (
              <button
                key={`${id}-${index}`}
                type="button"
                className="sidebar-workspace-btn"
                title={label}
                onClick={() =>
                  collapseAfterAction(() =>
                    window.dispatchEvent(
                      new CustomEvent(
                        id.includes("Form") ? "hmis:open-module-form" : "hmis:emergency-sidebar-action",
                        {
                          detail: id.includes("Form")
                            ? { moduleKey, formName: id }
                            : { action: id },
                        }
                      )
                    )
                  )
                }
              >
                <Icon size={16} />
                {!collapsed && <span>{label}</span>}
              </button>
            ))}
            {waitingConfig ? (
              <button
                type="button"
                className="sidebar-workspace-btn"
                title={waitingConfig.label}
                onClick={() =>
                  collapseAfterAction(() =>
                    window.dispatchEvent(
                      new CustomEvent("hmis:open-module-waiting-list", {
                        detail: {
                          moduleKey,
                          departmentId: waitingConfig.departmentId,
                        },
                      })
                    )
                  )
                }
              >
                <Users size={16} />
                {!collapsed && (
                  <span>
                    {waitingConfig.label}
                    <small className="sidebar-waiting-count">{waitingCount}</small>
                  </span>
                )}
              </button>
            ) : null}
          </div>
        ) : moduleKey === "maternity" ? (
          <div className="sidebar-workspace-tools">
            {maternityWorkspaceTools.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                className="sidebar-workspace-btn"
                title={label}
                onClick={() =>
                  collapseAfterAction(() =>
                    window.dispatchEvent(
                      new CustomEvent("hmis:maternity-sidebar-action", {
                        detail: { action: id },
                      })
                    )
                  )
                }
              >
                <Icon size={16} />
                {!collapsed && <span>{label}</span>}
              </button>
            ))}
            {waitingConfig ? (
              <button
                type="button"
                className="sidebar-workspace-btn"
                title="Open Waiting List"
                onClick={() =>
                  collapseAfterAction(() =>
                    window.dispatchEvent(
                      new CustomEvent("hmis:open-module-waiting-list", {
                        detail: { moduleKey, departmentId: waitingConfig.departmentId },
                      })
                    )
                  )
                }
              >
                <Users size={16} />
                {!collapsed && (
                  <span>
                    Open Waiting List
                    <small className="sidebar-waiting-count">{waitingCount}</small>
                  </span>
                )}
              </button>
            ) : null}
          </div>
        ) : moduleKey === "ipd" ? (
          <div className="sidebar-workspace-tools">
            {ipdWorkspaceTools.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                className="sidebar-workspace-btn"
                title={label}
                onClick={() =>
                  collapseAfterAction(() =>
                    window.dispatchEvent(
                      new CustomEvent("hmis:ipd-sidebar-action", {
                        detail: { action: id },
                      })
                    )
                  )
                }
              >
                <Icon size={16} />
                {!collapsed && <span>{label}</span>}
              </button>
            ))}
            <button
              type="button"
              className="sidebar-workspace-btn"
              title="Orders"
              onClick={() =>
                collapseAfterAction(() =>
                  window.dispatchEvent(
                    new CustomEvent("hmis:open-module-orders", {
                      detail: { destinationModule: "INPATIENT" },
                    })
                  )
                )
              }
            >
              <ShoppingCart size={16} />
              {!collapsed && (
                <span>
                  Orders<small className="sidebar-waiting-count">{orderCount}</small>
                </span>
              )}
            </button>
            {waitingConfig ? (
              <button
                type="button"
                className="sidebar-workspace-btn"
                title={waitingConfig.label}
                onClick={() =>
                  collapseAfterAction(() =>
                    window.dispatchEvent(
                      new CustomEvent("hmis:open-module-waiting-list", {
                        detail: { moduleKey, departmentId: waitingConfig.departmentId },
                      })
                    )
                  )
                }
              >
                <Users size={16} />
                {!collapsed && (
                  <span>
                    {waitingConfig.label}
                    <small className="sidebar-waiting-count">{waitingCount}</small>
                  </span>
                )}
              </button>
            ) : null}
          </div>
        ) : moduleKey === "appointments" ? (
          <div className="sidebar-workspace-tools">
            {appointmentWorkspaceTools.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                className="sidebar-workspace-btn"
                title={label}
                onClick={() =>
                  collapseAfterAction(() =>
                    window.dispatchEvent(
                      new CustomEvent("hmis:appointment-sidebar-action", {
                        detail: { action: id },
                      })
                    )
                  )
                }
              >
                <Icon size={16} />
                {!collapsed && <span>{label}</span>}
              </button>
            ))}
            {waitingConfig ? (
              <button
                type="button"
                className="sidebar-workspace-btn"
                title={waitingConfig.label}
                onClick={() =>
                  collapseAfterAction(() =>
                    window.dispatchEvent(
                      new CustomEvent("hmis:open-module-waiting-list", {
                        detail: { moduleKey, departmentId: waitingConfig.departmentId },
                      })
                    )
                  )
                }
              >
                <Users size={16} />
                {!collapsed && (
                  <span>
                    {waitingConfig.label}
                    <small className="sidebar-waiting-count">{waitingCount}</small>
                  </span>
                )}
              </button>
            ) : null}
          </div>
        ) : moduleKey === "queue" ? (
          <div className="sidebar-workspace-tools">
            {queueWorkspaceTools.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                className="sidebar-workspace-btn"
                title={label}
                onClick={() =>
                  collapseAfterAction(() =>
                    window.dispatchEvent(
                      new CustomEvent("hmis:queue-sidebar-action", {
                        detail: { action: id },
                      })
                    )
                  )
                }
              >
                <Icon size={16} />
                {!collapsed && <span>{label}</span>}
              </button>
            ))}
            {waitingConfig ? (
              <button
                type="button"
                className="sidebar-workspace-btn"
                title={waitingConfig.label}
                onClick={() =>
                  collapseAfterAction(() =>
                    window.dispatchEvent(
                      new CustomEvent("hmis:open-module-waiting-list", {
                        detail: { moduleKey, departmentId: waitingConfig.departmentId },
                      })
                    )
                  )
                }
              >
                <Users size={16} />
                {!collapsed && (
                  <span>
                    {waitingConfig.label}
                    <small className="sidebar-waiting-count">{waitingCount}</small>
                  </span>
                )}
              </button>
            ) : null}
          </div>
        ) : moduleKey === "icu" ? (
          <div className="sidebar-workspace-tools">
            {icuWorkspaceTools.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                className="sidebar-workspace-btn"
                title={label}
                onClick={() =>
                  collapseAfterAction(() =>
                    window.dispatchEvent(
                      new CustomEvent("hmis:icu-sidebar-action", {
                        detail: { action: id },
                      })
                    )
                  )
                }
              >
                <Icon size={16} />
                {!collapsed && <span>{label}</span>}
              </button>
            ))}
            {waitingConfig ? (
              <button
                type="button"
                className="sidebar-workspace-btn"
                title="Open Waiting List"
                onClick={() =>
                  collapseAfterAction(() =>
                    window.dispatchEvent(
                      new CustomEvent("hmis:open-module-waiting-list", {
                        detail: { moduleKey, departmentId: waitingConfig.departmentId },
                      })
                    )
                  )
                }
              >
                <Users size={16} />
                {!collapsed && (
                  <span>
                    Open Waiting List
                    <small className="sidebar-waiting-count">{waitingCount}</small>
                  </span>
                )}
              </button>
            ) : null}
          </div>
        ) : moduleKey === "nicu" ? (
          <div className="sidebar-workspace-tools">
            {nicuWorkspaceTools.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                className="sidebar-workspace-btn"
                title={label}
                onClick={() =>
                  collapseAfterAction(() =>
                    window.dispatchEvent(
                      new CustomEvent("hmis:nicu-sidebar-action", {
                        detail: { action: id },
                      })
                    )
                  )
                }
              >
                <Icon size={16} />
                {!collapsed && <span>{label}</span>}
              </button>
            ))}
            {waitingConfig ? (
              <button
                type="button"
                className="sidebar-workspace-btn"
                title="Open Waiting List"
                onClick={() =>
                  collapseAfterAction(() =>
                    window.dispatchEvent(
                      new CustomEvent("hmis:open-module-waiting-list", {
                        detail: { moduleKey, departmentId: waitingConfig.departmentId },
                      })
                    )
                  )
                }
              >
                <Users size={16} />
                {!collapsed && (
                  <span>
                    Open Waiting List
                    <small className="sidebar-waiting-count">{waitingCount}</small>
                  </span>
                )}
              </button>
            ) : null}
          </div>
        ) : moduleKey === "ot" ? (
          <div className="sidebar-workspace-tools">
            {otWorkspaceTools.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                className="sidebar-workspace-btn"
                title={label}
                onClick={() =>
                  collapseAfterAction(() =>
                    window.dispatchEvent(
                      new CustomEvent("hmis:ot-sidebar-action", {
                        detail: { action: id },
                      })
                    )
                  )
                }
              >
                <Icon size={16} />
                {!collapsed && <span>{label}</span>}
              </button>
            ))}
            {waitingConfig ? (
              <button
                type="button"
                className="sidebar-workspace-btn"
                title="Open Waiting List"
                onClick={() =>
                  collapseAfterAction(() =>
                    window.dispatchEvent(
                      new CustomEvent("hmis:open-module-waiting-list", {
                        detail: { moduleKey, departmentId: waitingConfig.departmentId },
                      })
                    )
                  )
                }
              >
                <Users size={16} />
                {!collapsed && (
                  <span>
                    Open Waiting List
                    <small className="sidebar-waiting-count">{waitingCount}</small>
                  </span>
                )}
              </button>
            ) : null}
          </div>
        ) : moduleKey === "lab" ? (
          <div className="sidebar-workspace-tools">
            {laboratoryWorkspaceTools.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                className="sidebar-workspace-btn"
                title={label}
                onClick={() =>
                  collapseAfterAction(() =>
                    window.dispatchEvent(
                      new CustomEvent("hmis:lab-sidebar-action", {
                        detail: { action: id },
                      })
                    )
                  )
                }
              >
                <Icon size={16} />
                {!collapsed && <span>{label}</span>}
              </button>
            ))}
            <button
              type="button"
              className="sidebar-workspace-btn"
              title="Orders"
              onClick={() =>
                collapseAfterAction(() =>
                  window.dispatchEvent(
                    new CustomEvent("hmis:open-module-orders", {
                      detail: { destinationModule: "LABORATORY" },
                    })
                  )
                )
              }
            >
              <ShoppingCart size={16} />
              {!collapsed && (
                <span>
                  Orders<small className="sidebar-waiting-count">{orderCount}</small>
                </span>
              )}
            </button>
            {waitingConfig ? (
              <button
                type="button"
                className="sidebar-workspace-btn"
                title="Open Waiting List"
                onClick={() =>
                  collapseAfterAction(() =>
                    window.dispatchEvent(
                      new CustomEvent("hmis:open-module-waiting-list", {
                        detail: { moduleKey, departmentId: waitingConfig.departmentId },
                      })
                    )
                  )
                }
              >
                <Users size={16} />
                {!collapsed && (
                  <span>
                    Open Waiting List
                    <small className="sidebar-waiting-count">{waitingCount}</small>
                  </span>
                )}
              </button>
            ) : null}
          </div>
        ) : moduleKey === "radiology" ? (
          <div className="sidebar-workspace-tools">
            {radiologyWorkspaceTools.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                className="sidebar-workspace-btn"
                title={label}
                onClick={() =>
                  collapseAfterAction(() =>
                    window.dispatchEvent(
                      new CustomEvent("hmis:radiology-sidebar-action", {
                        detail: { action: id },
                      })
                    )
                  )
                }
              >
                <Icon size={16} />
                {!collapsed && <span>{label}</span>}
              </button>
            ))}
            <button
              type="button"
              className="sidebar-workspace-btn"
              title="Orders"
              onClick={() =>
                collapseAfterAction(() =>
                  window.dispatchEvent(
                    new CustomEvent("hmis:open-module-orders", {
                      detail: { destinationModule: "RADIOLOGY" },
                    })
                  )
                )
              }
            >
              <ShoppingCart size={16} />
              {!collapsed && (
                <span>
                  Orders<small className="sidebar-waiting-count">{orderCount}</small>
                </span>
              )}
            </button>
            {waitingConfig ? (
              <button
                type="button"
                className="sidebar-workspace-btn"
                title="Open Waiting List"
                onClick={() =>
                  collapseAfterAction(() =>
                    window.dispatchEvent(
                      new CustomEvent("hmis:open-module-waiting-list", {
                        detail: { moduleKey, departmentId: waitingConfig.departmentId },
                      })
                    )
                  )
                }
              >
                <Users size={16} />
                {!collapsed && (
                  <span>
                    Open Waiting List
                    <small className="sidebar-waiting-count">{waitingCount}</small>
                  </span>
                )}
              </button>
            ) : null}
          </div>
        ) : moduleKey === "pharmacy" ? (
          <div className="sidebar-workspace-tools">
            {pharmacyWorkspaceTools.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                className="sidebar-workspace-btn"
                title={label}
                onClick={() =>
                  collapseAfterAction(() =>
                    window.dispatchEvent(
                      new CustomEvent("hmis:pharmacy-sidebar-action", {
                        detail: { action: id },
                      })
                    )
                  )
                }
              >
                <Icon size={16} />
                {!collapsed && <span>{label}</span>}
              </button>
            ))}
            <button
              type="button"
              className="sidebar-workspace-btn"
              title="Orders"
              onClick={() =>
                collapseAfterAction(() =>
                  window.dispatchEvent(
                    new CustomEvent("hmis:open-module-orders", {
                      detail: { destinationModule: "PHARMACY" },
                    })
                  )
                )
              }
            >
              <ShoppingCart size={16} />
              {!collapsed && (
                <span>
                  Orders<small className="sidebar-waiting-count">{orderCount}</small>
                </span>
              )}
            </button>
            {waitingConfig ? (
              <button
                type="button"
                className="sidebar-workspace-btn"
                title="Open Waiting List"
                onClick={() =>
                  collapseAfterAction(() =>
                    window.dispatchEvent(
                      new CustomEvent("hmis:open-module-waiting-list", {
                        detail: { moduleKey, departmentId: waitingConfig.departmentId },
                      })
                    )
                  )
                }
              >
                <Users size={16} />
                {!collapsed && (
                  <span>
                    Open Waiting List
                    <small className="sidebar-waiting-count">{waitingCount}</small>
                  </span>
                )}
              </button>
            ) : null}
          </div>
        ) : moduleKey === "blood-bank" ? (
          <div className="sidebar-workspace-tools">
            {bloodBankWorkspaceTools.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                className="sidebar-workspace-btn"
                title={label}
                onClick={() =>
                  collapseAfterAction(() =>
                    window.dispatchEvent(
                      new CustomEvent("hmis:open-module-form", {
                        detail: {
                          moduleKey,
                          formName:
                            id === "donor-registration"
                              ? "Donor Registration Form"
                              : id === "record-donation"
                              ? "Blood Unit Collection Form"
                              : id === "blood-request"
                              ? "Blood Request Form"
                              : label,
                        },
                      })
                    )
                  )
                }
              >
                <Icon size={16} />
                {!collapsed && <span>{label}</span>}
              </button>
            ))}
            {waitingConfig ? (
              <button
                type="button"
                className="sidebar-workspace-btn"
                title="Open Waiting List"
                onClick={() =>
                  collapseAfterAction(() =>
                    window.dispatchEvent(
                      new CustomEvent("hmis:open-module-waiting-list", {
                        detail: { moduleKey, departmentId: waitingConfig.departmentId },
                      })
                    )
                  )
                }
              >
                <Users size={16} />
                {!collapsed && (
                  <span>
                    Open Waiting List
                    <small className="sidebar-waiting-count">{waitingCount}</small>
                  </span>
                )}
              </button>
            ) : null}
          </div>
        ) : moduleKey === "nutrition" ? (
          <div className="sidebar-workspace-tools">
            {nutritionWorkspaceTools.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                className="sidebar-workspace-btn"
                title={label}
                onClick={() =>
                  collapseAfterAction(() =>
                    window.dispatchEvent(
                      new CustomEvent("hmis:nutrition-sidebar-action", {
                        detail: { action: id },
                      })
                    )
                  )
                }
              >
                <Icon size={16} />
                {!collapsed && <span>{label}</span>}
              </button>
            ))}
            {waitingConfig ? (
              <button
                type="button"
                className="sidebar-workspace-btn"
                title="Open Waiting List"
                onClick={() =>
                  collapseAfterAction(() =>
                    window.dispatchEvent(
                      new CustomEvent("hmis:open-module-waiting-list", {
                        detail: { moduleKey, departmentId: waitingConfig.departmentId },
                      })
                    )
                  )
                }
              >
                <Users size={16} />
                {!collapsed && (
                  <span>
                    Open Waiting List
                    <small className="sidebar-waiting-count">{waitingCount}</small>
                  </span>
                )}
              </button>
            ) : null}
          </div>
        ) : moduleKey === "dental" ? (
          <div className="sidebar-workspace-tools">
            {dentalWorkspaceTools.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                className="sidebar-workspace-btn"
                title={label}
                onClick={() =>
                  collapseAfterAction(() =>
                    window.dispatchEvent(
                      new CustomEvent("hmis:dental-sidebar-action", {
                        detail: { action: id },
                      })
                    )
                  )
                }
              >
                <Icon size={16} />
                {!collapsed && <span>{label}</span>}
              </button>
            ))}
            {waitingConfig ? (
              <button
                type="button"
                className="sidebar-workspace-btn"
                title="Open Waiting List"
                onClick={() =>
                  collapseAfterAction(() =>
                    window.dispatchEvent(
                      new CustomEvent("hmis:open-module-waiting-list", {
                        detail: { moduleKey, departmentId: waitingConfig.departmentId },
                      })
                    )
                  )
                }
              >
                <Users size={16} />
                {!collapsed && (
                  <span>
                    Open Waiting List
                    <small className="sidebar-waiting-count">{waitingCount}</small>
                  </span>
                )}
              </button>
            ) : null}
          </div>
        ) : moduleKey === "infection-control" ? (
          <div className="sidebar-workspace-tools">
            {infectionControlWorkspaceTools.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                className="sidebar-workspace-btn"
                title={label}
                onClick={() =>
                  collapseAfterAction(() =>
                    window.dispatchEvent(
                      new CustomEvent("hmis:infection-control-sidebar-action", {
                        detail: { action: id },
                      })
                    )
                  )
                }
              >
                <Icon size={16} />
                {!collapsed && <span>{label}</span>}
              </button>
            ))}
            {waitingConfig ? (
              <button
                type="button"
                className="sidebar-workspace-btn"
                title="Open Waiting List"
                onClick={() =>
                  collapseAfterAction(() =>
                    window.dispatchEvent(
                      new CustomEvent("hmis:open-module-waiting-list", {
                        detail: { moduleKey, departmentId: waitingConfig.departmentId },
                      })
                    )
                  )
                }
              >
                <Users size={16} />
                {!collapsed && (
                  <span>
                    Open Waiting List
                    <small className="sidebar-waiting-count">{waitingCount}</small>
                  </span>
                )}
              </button>
            ) : null}
          </div>
        ) : moduleKey === "paediatrics" ? (
          <div className="sidebar-workspace-tools">
            {paediatricsWorkspaceTools.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                className="sidebar-workspace-btn"
                title={label}
                onClick={() =>
                  collapseAfterAction(() =>
                    window.dispatchEvent(
                      new CustomEvent("hmis:paediatrics-sidebar-action", {
                        detail: { action: id },
                      })
                    )
                  )
                }
              >
                <Icon size={16} />
                {!collapsed && <span>{label}</span>}
              </button>
            ))}
            {waitingConfig ? (
              <button
                type="button"
                className="sidebar-workspace-btn"
                title="Open Waiting List"
                onClick={() =>
                  collapseAfterAction(() =>
                    window.dispatchEvent(
                      new CustomEvent("hmis:open-module-waiting-list", {
                        detail: { moduleKey, departmentId: waitingConfig.departmentId },
                      })
                    )
                  )
                }
              >
                <Users size={16} />
                {!collapsed && (
                  <span>
                    Open Waiting List
                    <small className="sidebar-waiting-count">{waitingCount}</small>
                  </span>
                )}
              </button>
            ) : null}
          </div>
        ) : moduleKey === "physiotherapy" ? (
          <div className="sidebar-workspace-tools">
            {physiotherapyWorkspaceTools.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                className="sidebar-workspace-btn"
                title={label}
                onClick={() =>
                  collapseAfterAction(() =>
                    window.dispatchEvent(
                      new CustomEvent("hmis:physiotherapy-sidebar-action", {
                        detail: { action: id },
                      })
                    )
                  )
                }
              >
                <Icon size={16} />
                {!collapsed && <span>{label}</span>}
              </button>
            ))}
            {waitingConfig ? (
              <button
                type="button"
                className="sidebar-workspace-btn"
                title="Open Waiting List"
                onClick={() =>
                  collapseAfterAction(() =>
                    window.dispatchEvent(
                      new CustomEvent("hmis:open-module-waiting-list", {
                        detail: { moduleKey, departmentId: waitingConfig.departmentId },
                      })
                    )
                  )
                }
              >
                <Users size={16} />
                {!collapsed && (
                  <span>
                    Open Waiting List
                    <small className="sidebar-waiting-count">{waitingCount}</small>
                  </span>
                )}
              </button>
            ) : null}
          </div>
        ) : moduleKey === "community-health" ? (
          <div className="sidebar-workspace-tools">
            {communityHealthWorkspaceTools.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                className="sidebar-workspace-btn"
                title={label}
                onClick={() =>
                  collapseAfterAction(() =>
                    window.dispatchEvent(
                      new CustomEvent("hmis:community-sidebar-action", {
                        detail: { action: id },
                      })
                    )
                  )
                }
              >
                <Icon size={16} />
                {!collapsed && <span>{label}</span>}
              </button>
            ))}
          </div>
        ) : moduleKey === "home-care" ? (
          <div className="sidebar-workspace-tools">
            {homeCareWorkspaceTools.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                className="sidebar-workspace-btn"
                title={label}
                onClick={() =>
                  collapseAfterAction(() =>
                    window.dispatchEvent(
                      new CustomEvent("hmis:home-care-sidebar-action", {
                        detail: { action: id },
                      })
                    )
                  )
                }
              >
                <Icon size={16} />
                {!collapsed && <span>{label}</span>}
              </button>
            ))}
          </div>
        ) : moduleKey === "biomedical" ? (
          <div className="sidebar-workspace-tools">
            {biomedicalWorkspaceTools.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                className="sidebar-workspace-btn"
                title={label}
                onClick={() =>
                  collapseAfterAction(() =>
                    window.dispatchEvent(
                      new CustomEvent("hmis:biomedical-sidebar-action", {
                        detail: { action: id },
                      })
                    )
                  )
                }
              >
                <Icon size={16} />
                {!collapsed && <span>{label}</span>}
              </button>
            ))}
          </div>
        ) : moduleKey === "nursing" ? (
          <div className="sidebar-workspace-tools">
            {nursingWorkspaceTools.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                className="sidebar-workspace-btn"
                title={label}
                onClick={() =>
                  collapseAfterAction(() =>
                    window.dispatchEvent(
                      new CustomEvent("hmis:nursing-sidebar-action", {
                        detail: { action: id },
                      })
                    )
                  )
                }
              >
                <Icon size={16} />
                {!collapsed && <span>{label}</span>}
              </button>
            ))}
            {waitingConfig ? (
              <button
                type="button"
                className="sidebar-workspace-btn"
                title={waitingConfig.label}
                onClick={() =>
                  collapseAfterAction(() =>
                    window.dispatchEvent(
                      new CustomEvent("hmis:open-module-waiting-list", {
                        detail: { moduleKey, departmentId: waitingConfig.departmentId },
                      })
                    )
                  )
                }
              >
                <Users size={16} />
                {!collapsed && (
                  <span>
                    {waitingConfig.label}
                    <small className="sidebar-waiting-count">{waitingCount}</small>
                  </span>
                )}
              </button>
            ) : null}
          </div>
        ) : waitingConfig ? (
          <div className="sidebar-workspace-tools">
            <button
              type="button"
              className="sidebar-workspace-btn"
              title={waitingConfig.label}
              onClick={() =>
                collapseAfterAction(() =>
                  window.dispatchEvent(
                    new CustomEvent("hmis:open-module-waiting-list", {
                      detail: { moduleKey, departmentId: waitingConfig.departmentId },
                    })
                  )
                )
              }
            >
              <Users size={16} />
              {!collapsed && (
                <span>
                  {waitingConfig.label}
                  <small className="sidebar-waiting-count">{waitingCount}</small>
                </span>
              )}
            </button>
          </div>
        ) : (
          <div className="sidebar-empty-state" title="Module tools">
            {collapsed ? <ClipboardList size={18} /> : <Building2 size={18} />}
            {!collapsed && (
              <p>
                {moduleKey
                  ? "Module tools will appear here."
                  : "Open a module to use workspace tools here."}
              </p>
            )}
          </div>
        )}
      </nav>

      {/* Action Stack (Upgrade & AI Assistant) */}
      <div className="sidebar-action-stack">
        {!isModuleOpen ? (
          <button
            type="button"
            className="sidebar-upgrade-btn"
            onClick={() => collapseAfterAction(onNavigateUpgrade)}
            title="Upgrade"
          >
            <Crown size={16} />
            {!collapsed && <span>Upgrade</span>}
          </button>
        ) : null}
        <button
          type="button"
          className="sidebar-help-btn"
          onClick={() => collapseAfterAction(onOpenHelpAi)}
          title="Open Medilink AI assistant"
        >
          <Bot size={16} />
          {!collapsed && <span>AI Assistant</span>}
        </button>
      </div>

      {/* Active Facility Profile Card */}
      {!isModuleOpen ? (
        <div className="sidebar-hospital-profile">
          <img
            src={hospitalLogo}
            className="sidebar-hospital-logo"
            alt="Hospital logo"
          />
          {!collapsed && (
            <div className="sidebar-hospital-copy">
              <span>Active Facility</span>
              <strong title={hospitalName}>{hospitalName}</strong>
            </div>
          )}
        </div>
      ) : null}
    </aside>
  );
}
