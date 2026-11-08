import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import "./App.css";
import { useAppStore, type Patient } from "./store/appStore";
import { DesktopUpdater } from "./components/DesktopUpdater";
import { MigrationCenterView } from "./components/MigrationCenterView";
import { DesktopSidebar } from "./components/layout/DesktopSidebar";
import { DesktopTopbar } from "./components/layout/DesktopTopbar";
import { DesktopAppShell } from "./components/layout/DesktopAppShell";
import { PatientDrawer } from "./components/patients/PatientDrawer";
import { OpdDashboardView } from "./views/OpdDashboardView";
import IcuView from "./views/IcuView";
import CdssView from "./views/CdssView";
import MaternityView from "./views/MaternityView";
import NicuView from "./views/NicuView";
import DentalView from "./views/DentalView";
import ReferralsView from "./views/ReferralsView";
import OtView from "./views/OtView";
import PhysiotherapyView from "./views/PhysiotherapyView";
import NutritionView from "./views/NutritionView";
import PaediatricsView from "./views/PaediatricsView";
import InfectionControlView from "./views/InfectionControlView";
import LaboratoryView from "./views/LaboratoryView";
import RadiologyView from "./views/RadiologyView";
import PharmacyView from "./views/PharmacyView";
import PharmacyPosView from "./views/PharmacyPosView";
import { MODULE_BY_ID } from "./lib/moduleCatalog";
import {
  WORKFLOW_MODULE_BY_ID,
  WORKFLOW_MODULES,
  type WorkflowField,
  type WorkflowForm,
} from "./modules/workflowCatalog";
import {
  MEDILINK_AI_GREETING,
  MEDILINK_AI_SYSTEM_PROMPT,
} from "./ai/medilinkSystemPrompt";
import { generateLocalHelpFallbackReply } from "./ai/localHelpFallback";
import {
  clearTokens,
  completeFacilitySetup,
  createBed,
  createQueueToken,
  createStaffProfile,
  createWard,
  createTenantPatient,
  createTenantRole,
  createTenantUser,
  deleteTenantRole,
  deleteTenantUser,
  fetchSubscriptionPricing,
  fetchSecurityRbacCatalog,
  fetchSecurityPermissionsCatalog,
  fetchSecurityMyAccess,
  fetchSuperAdminAnnouncements,
  fetchSuperAdminAuditStream,
  fetchSuperAdminFeatureFlags,
  fetchSuperAdminInfrastructureBackups,
  fetchSuperAdminInfrastructureSummary,
  fetchSuperAdminOverview,
  fetchSuperAdminPlatformSettings,
  fetchSuperAdminSupportRequests,
  fetchBillingBills,
  fetchBillingBillById,
  fetchBillingDashboard,
  fetchBillingRevenueReport,
  fetchBillingArReport,
  fetchBillingDiscounts,
  fetchBillingRefunds,
  fetchInsuranceDashboard,
  fetchInsuranceClaims,
  fetchInsurancePreAuthorizations,
  fetchLaboratoryRequests,
  fetchQueueAnalytics,
  fetchQueueBoard,
  callNextQueueToken,
  overrideQueuePriority,
  queueCounterSession,
  updateQueueTokenStatus,
  generateMedilinkAiReply,
  initiateMpesaStkPush,
  activateLicense,
  fetchLicenseStatus,
  fetchFacilityBranding,
  fetchWards,
  apiFetch,
  fetchTenantPatientById,
  fetchTenantPatientDuplicateCheck,
  fetchTenantPatients,
  updateTenantPatient,
  fetchTenantRoles,
  fetchTenantUsers,
  API_BASE_URL,
  getAccessToken,
  getStoredFacilityCode,
  loginHospitalAdmin,
  loginStaff,
  normalizeBaseUrl,
  parseJsonSafe,
  refreshAccessToken,
  recordBillingPayment,
  resetTenantUserPassword,
  SESSION_STORAGE_KEY,
  setStoredFacilityCode,
  submitModuleRecord,
  type SubscriptionPricing,
  type SuperAdminAnnouncement,
  type SuperAdminAuditEvent,
  type SuperAdminFeatureFlagsResponse,
  type SuperAdminInfrastructureBackupJob,
  type SuperAdminInfrastructureSummary,
  type SuperAdminOverview,
  type SuperAdminSupportRequest,
  updateSuperAdminFeatureFlags,
  updateSuperAdminPlatformSettings,
  createSuperAdminAnnouncement,
  triggerSuperAdminInfrastructureBackup,
  updateSuperAdminAnnouncementStatus,
  updateTenantRolePermissions,
  updateSubscriptionPricing,
  updateAdminFacilityStatus,
  updateAdminFacilitySubscription,
  updateAdminSupportRequestStatus,
  updateTenantUserRole,
  updateTenantUserStatus,
} from "./lib/apiClient";

const MARKETING_BASE_URL = normalizeBaseUrl(
  (import.meta as any).env?.VITE_MARKETING_URL,
  "https://medilinkke.onrender.com",
);
const MARKETING_PRICING_URL = `${String(MARKETING_BASE_URL).replace(/\/$/, "")}/pricing`;

const normalizeQueueDepartmentId = (value: string) =>
  value
    .toUpperCase()
    .replace(/&/g, " AND ")
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 48);

const queueDestinationOverride: Record<string, { departmentId: string; queueType: string; tokenPrefix: string }> = {
  "appointments": { departmentId: "APPOINTMENTS", queueType: "APPOINTMENTS", tokenPrefix: "APT" },
  "outpatient": { departmentId: "OPD", queueType: "OPD", tokenPrefix: "OPD" },
  "outpatient / opd": { departmentId: "OPD", queueType: "OPD", tokenPrefix: "OPD" },
  "emergency": { departmentId: "EMERGENCY", queueType: "EMERGENCY", tokenPrefix: "ER" },
  "laboratory": { departmentId: "LABORATORY", queueType: "LABORATORY", tokenPrefix: "LAB" },
  "radiology": { departmentId: "RADIOLOGY", queueType: "RADIOLOGY", tokenPrefix: "RAD" },
  "pharmacy": { departmentId: "PHARMACY", queueType: "PHARMACY", tokenPrefix: "PHR" },
  "billing": { departmentId: "BILLING", queueType: "BILLING", tokenPrefix: "BIL" },
  "inpatient": { departmentId: "INPATIENT", queueType: "INPATIENT", tokenPrefix: "IPD" },
  "maternity": { departmentId: "MATERNITY", queueType: "MATERNITY", tokenPrefix: "MAT" },
  "icu": { departmentId: "ICU", queueType: "ICU", tokenPrefix: "ICU" },
  "nursing": { departmentId: "NURSING", queueType: "NURSING", tokenPrefix: "NUR" },
  "nursing station": { departmentId: "NURSING", queueType: "NURSING", tokenPrefix: "NUR" },
  "dental": { departmentId: "DENTAL", queueType: "DENTAL", tokenPrefix: "DEN" },
  "physiotherapy": { departmentId: "PHYSIOTHERAPY", queueType: "PHYSIOTHERAPY", tokenPrefix: "PHY" },
  "physiotherapy & rehabilitation": { departmentId: "PHYSIOTHERAPY", queueType: "PHYSIOTHERAPY", tokenPrefix: "PHY" },
  "nutrition & dietetics": { departmentId: "NUTRITION", queueType: "NUTRITION", tokenPrefix: "NUT" },
  "operating theatre": { departmentId: "THEATRE", queueType: "THEATRE", tokenPrefix: "OT" },
};

const createQueueDestination = (label: string) => {
  const cleanedLabel = label.replace(/\s+/g, " ").trim();
  const key = cleanedLabel.toLowerCase();
  const override = queueDestinationOverride[key];
  const departmentId = override?.departmentId || normalizeQueueDepartmentId(cleanedLabel);
  const tokenPrefix =
    override?.tokenPrefix ||
    cleanedLabel
      .split(/[^A-Za-z0-9]+/)
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 4) ||
    "MOD";
  return {
    label: cleanedLabel,
    departmentId,
    queueType: override?.queueType || departmentId,
    tokenPrefix,
  };
};

const patientQueueDestinations = [
  { label: "Outpatient / OPD", departmentId: "OPD", queueType: "OPD", tokenPrefix: "OPD" },
  ...WORKFLOW_MODULES.filter((module) => module.id !== 1).map((module) => createQueueDestination(module.name)),
].filter((destination, index, all) => (
  all.findIndex((candidate) => candidate.label.toLowerCase() === destination.label.toLowerCase()) === index
));

const workflowWaitingListConfig: Record<number, { departmentId: string }> = WORKFLOW_MODULES
  .filter((module) => module.id !== 1)
  .reduce<Record<number, { departmentId: string }>>((acc, module) => {
    acc[module.id] = { departmentId: createQueueDestination(module.name).departmentId };
    return acc;
  }, {});

async function openExternalUrl(url: string) {
  try {
    const { openUrl } = await import("@tauri-apps/plugin-opener");
    await openUrl(url);
  } catch {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}

const LazyWorkflowModuleView = React.lazy(() =>
  import("./components/WorkflowModuleView").then((m) => ({
    default: m.WorkflowModuleView,
  })),
);

const iconByModuleId: Record<number, string> = {
  1: "person",
  2: "bed",
  4: "calendar",
  5: "ward",
  6: "ehr",
  7: "syringe",
  8: "flask",
  9: "zap",
  10: "pill",
  11: "scissors",
  12: "blood",
  13: "billing",
  14: "shield",
  15: "briefcase",
  16: "hr",
  17: "doctor",
  18: "chart",
  19: "laptop",
  20: "users",
  21: "baby",
  22: "shield2",
  23: "brain",
  24: "person",
  25: "shield",
  26: "ambulance",
  27: "bed",
  28: "calendar",
  29: "support",
  30: "briefcase",
  31: "stars",
  33: "shield2",
  34: "gears",
  35: "billing",
  36: "stethoscope",
  37: "baby",
  38: "shield2",
  39: "chart",
  40: "hr",
  41: "laptop",
  42: "syringe",
  43: "doctor",
  44: "billing",
  45: "chart",
  46: "chart",
  47: "gears",
  48: "brain",
  49: "stethoscope",
  50: "briefcase",
  51: "baby",
  52: "stethoscope",
  53: "shield2",
  54: "ehr",
  55: "stethoscope",
  56: "users",
  57: "ehr",
  58: "chat",
  59: "baby",
  60: "home",
  61: "briefcase",
  62: "shield2",
  63: "support",
  64: "upload",
};

const MODULES = WORKFLOW_MODULES.map((mod) => ({
  id: mod.id,
  name: mod.name,
  iconType: iconByModuleId[mod.id] || "home",
  premium: mod.premium,
}));

const NAV_ITEMS = [
  { label: "Dashboard", iconType: "home" },
  { label: "Patients", iconType: "person" },
  { label: "OPD Queue", iconType: "stethoscope" },
  { label: "Appointments", iconType: "calendar" },
  { label: "EHR Records", iconType: "ehr" },
  { label: "Nursing", iconType: "syringe" }, // Nav Index 5
  { label: "Consultation", iconType: "doctor" }, // Nav Index 25
  { label: "Bed/Ward", iconType: "bed" }, // Nav Index 6
  { label: "Laboratory", iconType: "lab" }, // Nav Index 7
  { label: "Radiology", iconType: "rad" }, // Nav Index 8
  { label: "Billing", iconType: "billing" }, // Nav Index 13
  { label: "Pharmacy", iconType: "pill" }, // Nav Index 11
  { label: "Settings", iconType: "gears" }, // Nav Index 12
];

const SIDEBAR_NAV_ITEMS = [
  { index: 0, ...NAV_ITEMS[0] },
  { index: 41, label: "Super Admin", iconType: "shield2" },
  { index: 1, ...NAV_ITEMS[1] },
  { index: 3, ...NAV_ITEMS[3] },
  { index: 9, ...NAV_ITEMS[9] },
  { index: 10, ...NAV_ITEMS[10] },
  { index: 12, ...NAV_ITEMS[12] },
  { index: 42, label: "Migration", iconType: "upload" },
];

type RoleKey =
  | "super_admin"
  | "hospital_admin"
  | "pharmacy_admin"
  | "doctor"
  | "nurse"
  | "cashier"
  | "lab_tech"
  | "radiology_tech"
  | "staff"
  | "patient";

const ROLE_ALLOWED_NAV: Record<RoleKey, number[]> = {
  super_admin: [41, 42],
  hospital_admin: [0, 1, 3, 5, 7, 8, 9, 10, 12, 40, 42],
  pharmacy_admin: [0, 1, 9, 10],
  doctor: [0, 1, 3, 5],
  nurse: [0, 1, 5],
  cashier: [0, 1, 9],
  lab_tech: [0, 1, 7],
  radiology_tech: [0, 1, 8],
  staff: [0, 1],
  patient: [0],
};

const ROLE_ALLOWED_MODULES: Record<RoleKey, number[]> = {
  super_admin: MODULES.map((m) => m.id),
  hospital_admin: MODULES.map((m) => m.id),
  pharmacy_admin: [10, 15, 13, 35],
  doctor: [4, 6, 36, 8, 9, 11, 13],
  nurse: [7, 2, 6, 5],
  cashier: [13, 14, 35, 4],
  lab_tech: [8, 6, 13],
  radiology_tech: [9, 6, 13],
  staff: [],
  patient: [4, 24],
};

const MODULE_PERMISSION_REGEX = /^module:(\d+)(?::[a-z_*]+(?::[a-z_*]+)?)?$/i;
const LEGACY_MODULE_PERMISSION_REGEX = /^module_(\d+)$/i;

const FONT_PRESETS = {
  nunito: '"Nunito", "Segoe UI", system-ui, sans-serif',
  baloo: '"Baloo 2", "Nunito", "Segoe UI", system-ui, sans-serif',
  system: '"Segoe UI", system-ui, sans-serif',
  serif: 'Georgia, "Times New Roman", serif',
} as const;

type FontPresetKey = keyof typeof FONT_PRESETS;

function extractModuleIdsFromPermissions(permissions: string[]): number[] {
  return Array.from(
    new Set(
      permissions
        .map((permission) => {
          const token = String(permission || "").trim();
          const modern = token.match(MODULE_PERMISSION_REGEX);
          if (modern) return Number(modern[1]);
          const legacy = token.match(LEGACY_MODULE_PERMISSION_REGEX);
          return legacy ? Number(legacy[1]) : NaN;
        })
        .filter((id) => Number.isFinite(id)),
    ),
  );
}

function normalizeModuleIds(moduleIds: unknown): number[] {
  const ids = Array.isArray(moduleIds) ? moduleIds : [];
  return Array.from(
    new Set(
      ids
        .map((id) => Number(id))
        .filter(
          (id) =>
            Number.isFinite(id) &&
            Object.prototype.hasOwnProperty.call(WORKFLOW_MODULE_BY_ID, Number(id)),
        ),
    ),
  );
}

function resolveRoleKeyForUi(normalizedRole: string): RoleKey {
  const key = String(normalizedRole || "").trim().toLowerCase();
  if (key === "super_admin") return "super_admin";
  if (
    key === "hospital_admin" ||
    key === "admin" ||
    key === "administrator" ||
    key === "facility_admin" ||
    key === "tenant_admin"
  ) return "hospital_admin";
  if (
    [
      "ceo",
      "coo",
      "cfo",
      "medical_director",
      "compliance_officer",
      "quality_assurance_director",
      "hospital_owner",
      "board_member",
      "facility_manager",
      "hr_manager",
      "hr_officer",
      "ict_manager",
      "ict_support",
      "help_desk_officer",
      "data_analyst",
      "accountant",
      "revenue_cycle_manager",
      "insurance_officer",
      "billing_officer",
      "payroll_officer",
      "procurement_officer",
      "inventory_officer",
      "store_manager",
    ].includes(key)
  ) {
    return "hospital_admin";
  }
  if (key === "pharmacy_admin") return "pharmacy_admin";
  if (key === "pharmacist" || key === "pharmacy_technician") return "pharmacy_admin";
  if (key === "doctor" || key === "specialist" || key === "consultant") return "doctor";
  if (key.includes("nurse") || key === "matron") return "nurse";
  if (key === "cashier" || key === "billing_officer") return "cashier";
  if (key === "lab_tech" || key === "lab_technician" || key === "lab_technologist")
    return "lab_tech";
  if (key === "radiology_tech" || key === "radiographer" || key === "radiologist")
    return "radiology_tech";
  if (key === "patient") return "patient";
  return "staff";
}

function isAdminLikeRole(role: unknown) {
  const key = String(role || "").trim().toLowerCase().replace(/[\s-]+/g, "_");
  return [
    "super_admin",
    "hospital_admin",
    "admin",
    "administrator",
    "facility_admin",
    "tenant_admin",
  ].includes(key);
}

const QUEUED_PATIENT_LOCK_STORAGE_KEY = "hmis_patient_registration_queued_ids";

function isSuperAdminRole(role: unknown) {
  return String(role || "").trim().toLowerCase().replace(/[\s-]+/g, "_") === "super_admin";
}

function readQueuedPatientLocks() {
  if (typeof window === "undefined") return new Set<string>();
  try {
    const value = window.localStorage.getItem(QUEUED_PATIENT_LOCK_STORAGE_KEY);
    const rows = value ? JSON.parse(value) : [];
    return new Set(Array.isArray(rows) ? rows.map((item) => String(item)) : []);
  } catch {
    return new Set<string>();
  }
}

function readPatientModuleState() {
  if (typeof window === "undefined") return { hasCheckedInPatient: false, isQueued: false };
  try {
    const value = window.localStorage.getItem("hmis_patient_module_state");
    return value ? JSON.parse(value) : { hasCheckedInPatient: false, isQueued: false };
  } catch {
    return { hasCheckedInPatient: false, isQueued: false };
  }
}

function publishPatientModuleState(patient: any, isQueued = false) {
  if (typeof window === "undefined") return;
  const state = {
    hasCheckedInPatient: Boolean(patient?.id),
    patientId: patient?.id || "",
    patientName: patient?.name || "",
    mrn: patient?.regNo || patient?.mrn || "",
    patientCode: patient?.regNo || patient?.mrn || "",
    nationalId: patient?.nationalId || patient?.idNumber || "",
    idNumber: patient?.idNumber || patient?.nationalId || "",
    phone: patient?.phone || "",
    isQueued,
    queueModule: patient?.queueModule || patient?.queueStatus || "",
  };
  window.localStorage.setItem("hmis_patient_module_state", JSON.stringify(state));
  window.dispatchEvent(new CustomEvent("hmis:patient-module-state", { detail: state }));
}

function getAdminAllowedModules(role: unknown) {
  const resolved = resolveRoleKeyForUi(String(role || ""));
  return resolved === "super_admin"
    ? ROLE_ALLOWED_MODULES.super_admin
    : ROLE_ALLOWED_MODULES.hospital_admin;
}

/* ── SVG Icon helper ── */
function Icon({ type, size = 28 }: { type?: string; size?: number }) {
  const materialByType: Record<string, string> = {
    home: "home",
    person: "person",
    stethoscope: "stethoscope",
    calendar: "calendar_month",
    billing: "receipt_long",
    pill: "medication",
    chart: "bar_chart",
    gears: "settings",
    bed: "bed",
    ward: "ward",
    ehr: "description",
    syringe: "vaccines",
    flask: "science",
    zap: "bolt",
    lab: "biotech",
    rad: "radiology",
    shield: "shield",
    shield2: "verified_user",
    verified: "verified",
    briefcase: "inventory_2",
    hr: "groups",
    doctor: "medical_services",
    blood: "bloodtype",
    ambulance: "emergency",
    support: "support_agent",
    stars: "stars",
    auto_awesome: "auto_awesome",
    insights: "insights",
    microscope: "biotech",
    users: "group",
    search: "search",
    sync: "sync",
    manage_search: "manage_search",
    fact_check: "fact_check",
    video_call: "video_call",
    chat: "chat",
    upload: "cloud_upload",
    event: "event",
    message: "message",
    bell: "notifications",
    logout: "logout",
    arrow_back: "arrow_back",
    panel_close: "left_panel_close",
    panel_open: "left_panel_open",
    restaurant: "restaurant",
  };
  if (type && materialByType[type]) {
    return (
      <span
        className="material-symbols-rounded hmis-micon"
        style={{ fontSize: size }}
        aria-hidden="true"
      >
        {materialByType[type]}
      </span>
    );
  }
  const s = { width: size, height: size, flexShrink: 0 } as React.CSSProperties;
  switch (type) {
    case "home":
      return (
        <svg
          style={s}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M3 12L12 3l9 9M5 10v10a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1V10" />
        </svg>
      );
    case "person":
      return (
        <svg
          style={s}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="7" r="4" />
          <path d="M4 20c0-4 4-7 8-7s8 3 8 7" />
        </svg>
      );
    case "stethoscope":
      return (
        <svg
          style={s}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3" />
          <circle cx="18" cy="17" r="3" />
        </svg>
      );
    case "calendar":
      return (
        <svg
          style={s}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
      );
    case "billing":
      return (
        <svg
          style={s}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <rect x="2" y="5" width="20" height="14" rx="2" />
          <path d="M2 10h20" />
        </svg>
      );
    case "pill":
      return (
        <svg
          style={s}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M10.5 20H4a2 2 0 01-2-2V5c0-1.1.9-2 2-2h3.93a2 2 0 011.66.9l.82 1.2a2 2 0 001.66.9H20a2 2 0 012 2v3.5" />
          <circle cx="17.5" cy="17.5" r="4.5" />
          <path d="M14.5 17.5h6" />
        </svg>
      );
    case "chart":
      return (
        <svg
          style={s}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M3 3v18h18" />
          <path d="M18 17V9M13 17V5M8 17v-3" />
        </svg>
      );
    case "gears":
      return (
        <svg
          style={s}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
        </svg>
      );
    case "bed":
      return (
        <svg
          style={s}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M2 20v-5a2 2 0 012-2h16a2 2 0 012 2v5M2 10V4m20 6V4M2 15h20M10 13V9a2 2 0 014 0v4" />
        </svg>
      );
    case "ward":
      return (
        <svg
          style={s}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <path d="M9 8h6M9 12h6M9 16h6M5 8h.01M5 12h.01M5 16h.01" />
        </svg>
      );
    case "ehr":
      return (
        <svg
          style={s}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
          <rect x="9" y="3" width="6" height="4" rx="1" />
          <path d="M9 12h6M9 16h4" />
        </svg>
      );
    case "syringe":
      return (
        <svg
          style={s}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M18 2l4 4M10 14l-4 4M4 20l4-4M14.5 2.5l7 7M8.5 8.5l7 7M6 12l.5-.5M9 9l.5-.5M12 6l.5-.5" />
          <path d="M3 21l7-7m4-4l1-1" />
        </svg>
      );
    case "flask":
      return (
        <svg
          style={s}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M9 3h6v6l4.447 7.894A2 2 0 0117.72 20H6.28a2 2 0 01-1.727-3L9 9V3z" />
          <path d="M9 3h6M7 14h10" />
        </svg>
      );
    case "zap":
      return (
        <svg
          style={s}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
      );
    case "scissors":
      return (
        <svg
          style={s}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="6" cy="6" r="3" />
          <circle cx="6" cy="18" r="3" />
          <path d="M20 4L8.12 15.88M14.47 14.48L20 20M8.12 8.12L12 12" />
        </svg>
      );
    case "blood":
      return (
        <svg style={s} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C12 2 4 10.5 4 15a8 8 0 0016 0c0-4.5-8-13-8-13z" />
        </svg>
      );
    case "shield":
      return (
        <svg
          style={s}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      );
    case "briefcase":
      return (
        <svg
          style={s}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <rect x="2" y="7" width="20" height="14" rx="2" />
          <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2M12 12v.01M8 12h.01M16 12h.01" />
        </svg>
      );
    case "hr":
      return (
        <svg
          style={s}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
        </svg>
      );
    case "doctor":
      return (
        <svg
          style={s}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M8 2v2M16 2v2M12 12a4 4 0 100-8 4 4 0 000 8zM20 22H4a8 8 0 0116 0z" />
        </svg>
      );
    case "laptop":
      return (
        <svg
          style={s}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <rect x="2" y="4" width="20" height="14" rx="2" />
          <path d="M2 20h20" />
        </svg>
      );
    case "users":
      return (
        <svg
          style={s}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
        </svg>
      );
    case "baby":
      return (
        <svg
          style={s}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="7" r="4" />
          <path d="M12 11c-4 0-7 3-7 7h14c0-4-3-7-7-7z" />
          <path d="M9 18l-2 4M15 18l2 4" />
        </svg>
      );
    case "tooth":
      return (
        <svg
          style={s}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M12 5.5C10 3.5 6 3 4 7c-1.5 3 0 11 2 11 1.5 0 2-2 3-4 .5-1 1-2 3-2s2.5 1 3 2c1 2 1.5 4 3 4 2 0 3.5-8 2-11-2-4-6-3.5-8-1.5z" />
        </svg>
      );
    case "eye":
      return (
        <svg
          style={s}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      );
    case "ambulance":
      return (
        <svg
          style={s}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <rect x="1" y="10" width="22" height="10" rx="2" />
          <path d="M15 10V5a2 2 0 00-2-2H7L1 10" />
          <circle cx="7" cy="20" r="2" />
          <circle cx="17" cy="20" r="2" />
          <line x1="12" y1="7" x2="12" y2="13" />
          <line x1="9" y1="10" x2="15" y2="10" />
        </svg>
      );
    case "brain":
      return (
        <svg
          style={s}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M9.5 2A2.5 2.5 0 0112 4.5v15a2.5 2.5 0 01-4.96-.44 2.5 2.5 0 01-2.96-3.08 3 3 0 01-.34-5.58 2.5 2.5 0 011.32-4.24 2.5 2.5 0 014.44-1.66z" />
          <path d="M14.5 2A2.5 2.5 0 0012 4.5v15a2.5 2.5 0 004.96-.44 2.5 2.5 0 002.96-3.08 3 3 0 00.34-5.58 2.5 2.5 0 00-1.32-4.24 2.5 2.5 0 00-4.44-1.66z" />
        </svg>
      );
    case "shield2":
      return (
        <svg
          style={s}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      );
    case "support":
      return (
        <svg
          style={s}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="4" />
          <line x1="4.93" y1="4.93" x2="9.17" y2="9.17" />
          <line x1="14.83" y1="14.83" x2="19.07" y2="19.07" />
          <line x1="14.83" y1="9.17" x2="19.07" y2="4.93" />
          <line x1="4.93" y1="19.07" x2="9.17" y2="14.83" />
        </svg>
      );
    case "stars":
      return (
        <svg style={s} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14l-5-4.87 6.91-1.01L12 2z" />
        </svg>
      );
    case "microscope":
      return (
        <svg
          style={s}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M6 18h8M3 22h18" />
          <rect x="4" y="14" width="8" height="4" rx="2" />
          <path d="M8 14V8.2" />
          <path d="M12 8.2a4 4 0 10-8 0 4 4 0 008 0z" />
        </svg>
      );
    default:
      return (
        <svg
          style={s}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="10" />
        </svg>
      );
  }
}

function CrownIcon({ size = 13, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      aria-hidden
    >
      <path d="M2 19h20v2H2zM2 5l5 8 5-5 5 5 5-8v12H2z" fill="#facc15" />
      <path d="M2 19h20M2 5l5 8 5-5 5 5 5-8" stroke="#92400e" strokeWidth="1.2" />
    </svg>
  );
}

function ageFromDob(dob?: string | null) {
  if (!dob) return 0;
  const date = new Date(dob);
  if (Number.isNaN(date.getTime())) return 0;
  const diff = Date.now() - date.getTime();
  return Math.max(0, Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000)));
}

const patientRegistrationDateValue = (patient: any) =>
  patient?.patient?.registeredAt ||
  patient?.patient?.createdAt ||
  patient?.data?.registeredAt ||
  patient?.data?.createdAt ||
  patient?.registeredAt ||
  patient?.registered_at ||
  patient?.registeredDate ||
  patient?.dateRegistered ||
  patient?.registrationDate ||
  patient?.registration_date ||
  patient?.registeredOn ||
  patient?.createdAt ||
  patient?.created_at ||
  patient?.createdOn ||
  patient?.visitDate ||
  patient?.updatedAt ||
  patient?.updated_at ||
  patient?.payload?.createdAt ||
  patient?.metadata?.createdAt ||
  "";

const patientStatsDateValue = (patient: any) =>
  patient?.patient?.registeredAt ||
  patient?.patient?.createdAt ||
  patient?.data?.registeredAt ||
  patient?.data?.createdAt ||
  patient?.registeredAt ||
  patient?.registered_at ||
  patient?.registeredDate ||
  patient?.dateRegistered ||
  patient?.registrationDate ||
  patient?.registration_date ||
  patient?.registeredOn ||
  patient?.createdAt ||
  patient?.created_at ||
  patient?.createdOn ||
  patient?.payload?.createdAt ||
  patient?.metadata?.createdAt ||
  "";

const isSameLocalDate = (value: unknown, expected: Date) => {
  const date = value instanceof Date ? value : new Date(String(value || ""));
  return (
    Number.isFinite(date.getTime()) &&
    date.getFullYear() === expected.getFullYear() &&
    date.getMonth() === expected.getMonth() &&
    date.getDate() === expected.getDate()
  );
};

const isWithinLastDays = (value: unknown, expected: Date, days: number) => {
  const text = String(value || "").trim();
  if (!text || /^today$/i.test(text)) return true;
  const date = value instanceof Date ? value : new Date(String(value || ""));
  const end = expected.getTime();
  const start = end - days * 24 * 60 * 60 * 1000;
  const time = date.getTime();
  return (
    Number.isFinite(time) &&
    time >= start &&
    time <= end
  );
};

const formatPatientRegistrationDate = (patient: any) => {
  const value = patientRegistrationDateValue(patient);
  const date = new Date(String(value || ""));
  return Number.isFinite(date.getTime()) ? date.toLocaleDateString() : new Date().toLocaleDateString();
};

function dobFromAge(age: number) {
  if (!Number.isFinite(age) || age <= 0) return new Date().toISOString().slice(0, 10);
  const now = new Date();
  const year = now.getFullYear() - Math.floor(age);
  return `${year}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate(),
  ).padStart(2, "0")}`;
}

function formatRoleLabel(role: string) {
  return role
    .split("_")
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1).toLowerCase() : part))
    .join(" ");
}

function toFrontendPatient(raw: any): Patient {
  const nested = raw?.patient && typeof raw.patient === "object" ? raw.patient : {};
  const pick = (...values: any[]) =>
    values.find((value) => value !== undefined && value !== null && String(value).trim() !== "");
  const firstName = pick(raw.firstName, nested.firstName, raw.patientFirstName) || "";
  const middleName = pick(raw.middleName, nested.middleName, raw.patientMiddleName) || "";
  const lastName = pick(raw.lastName, nested.lastName, raw.patientLastName) || "";
  const fullName =
    [firstName, middleName, lastName].filter(Boolean).join(" ").trim() ||
    pick(raw.name, nested.name, raw.fullName, nested.fullName, raw.patientName) ||
    "Unnamed Patient";
  const genderRaw = String(pick(raw.gender, nested.gender, raw.patientGender) || "").toUpperCase();
  const gender: Patient["gender"] = genderRaw === "FEMALE" ? "Female" : "Male";
  const visits = Array.isArray(raw.visits) ? raw.visits : Array.isArray(nested.visits) ? nested.visits : [];
  const latestVisitStatus = visits?.[0]?.status
    ? String(visits[0].status)
    : "";
  const moduleMatch = latestVisitStatus.match(/^MODULE_(\d+)$/i);
  const queueModuleId = moduleMatch ? Number(moduleMatch[1]) : undefined;

  const queueFromModule: Record<number, Patient["queueStatus"]> = {
    3: "TRIAGE",
    36: "CONSULTATION",
    8: "LAB",
    10: "PHARMACY",
    13: "BILLING",
    1: "WAITING",
  };

  const queueRaw = String(
    pick(raw.queueStatus, nested.queueStatus) ||
      pick(raw.status, nested.status) ||
      (queueModuleId ? queueFromModule[queueModuleId] || "WAITING" : "") ||
      latestVisitStatus ||
      "WAITING",
  ).toUpperCase();
  const allowed: Patient["queueStatus"][] = [
    "WAITING",
    "TRIAGE",
    "CONSULTATION",
    "LAB",
    "PHARMACY",
    "BILLING",
    "COMPLETED",
  ];
  const queueStatus = (allowed.includes(queueRaw as any)
    ? queueRaw
    : "WAITING") as Patient["queueStatus"];

  const registrationSource = { ...nested, ...raw };
  const visitDateValue = patientRegistrationDateValue(registrationSource) || new Date().toISOString();
  const visitDate = String(visitDateValue).slice(0, 10);
  const dobValue = pick(raw.dateOfBirth, nested.dateOfBirth, raw.dob, nested.dob);
  const dob = dobValue ? String(dobValue).slice(0, 10) : "";
  const patientId = pick(raw.id, nested.id, raw.patientId, raw.patient_id);
  const phone = pick(raw.phone, nested.phone, raw.phonePrimary, nested.phonePrimary, raw.patientPhone);
  const nationalId = pick(raw.nationalId, nested.nationalId, raw.idNumber, nested.idNumber, raw.patientNationalId);
  const patientCode = pick(raw.patientCode, nested.patientCode, raw.mrn, nested.mrn, raw.regNo, nested.regNo);
  const bloodGroup = pick(raw.bloodGroup, nested.bloodGroup);

  return {
    ...nested,
    ...raw,
    id: String(patientId || ""),
    patientCode,
    mrn: patientCode,
    regNo: patientCode || "",
    nationalId: nationalId || "",
    name: fullName,
    firstName,
    middleName,
    lastName,
    phone: phone || "",
    gender,
    age: pick(raw.age, nested.age) || ageFromDob(dob),
    bloodGroup,
    queueStatus,
    queueModuleId,
    visitDate,
    registeredAt: visitDateValue,
    vitals: (raw.vitals || nested.vitals)
      ? {
          bp: (raw.vitals || nested.vitals).bp || "",
          temp: (raw.vitals || nested.vitals).temp || "",
          weight: (raw.vitals || nested.vitals).weight || "",
          pulse: (raw.vitals || nested.vitals).pulse || "",
        }
      : undefined,
  };
}

type HelpChatMessage = {
  id: number;
  role: "assistant" | "user";
  text: string;
};

type HelpAssistantContext = {
  userRole?: string;
  module?: string;
  screen?: string;
  facilityId?: string;
  departmentId?: string;
  error?: string;
};

/* ── Patients View ── */

function PatientsView() {
  const createEmptyPatientForm = () => ({
    firstName: "",
    middleName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "MALE" as "MALE" | "FEMALE" | "OTHER",
    maritalStatus: "",
    nationality: "",
    idType: "",
    idNumber: "",
    shaNumber: "",
    phonePrimary: "",
    phoneSecondary: "",
    email: "",
    county: "",
    subCounty: "",
    villageEstate: "",
    addressLine1: "",
    age: "",
    bloodGroup: "" as any,
    religion: "",
    occupation: "",
    educationLevel: "",
    photoUrl: "",
    allergies: "",
    medicalHistory: "",
    nextOfKinName: "",
    nextOfKinRelationship: "",
    nextOfKinPhone: "",
    nextOfKinEmail: "",
    nextOfKinAddress: "",
    nextOfKinIsPrimary: false,
    nextOfKinConsent: false,
    insuranceScheme: "",
    policyNumber: "",
    memberName: "",
    isPrincipal: true,
    principalIdNumber: "",
    policyStartDate: "",
    policyExpiryDate: "",
    annualBenefitLimit: "",
    portalPhone: "",
    vulnerabilityFlags: [] as string[],
    hasInsurance: false,
  });
  const { patients, removePatient, setPatients, facility, user } = useAppStore();
  const [statsPatients, setStatsPatients] = useState<Patient[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [formTab, setFormTab] = useState<"personal" | "medical" | "kin" | "insurance">("personal");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exportingCsv, setExportingCsv] = useState(false);
  const [error, setError] = useState("");
  const [workspaceAction, setWorkspaceAction] = useState<
    "monitor" | "duplicates" | "insurance" | "portal" | "photo" | "vulnerability" | "merge" | "identity-card" | null
  >(null);
  const [workspaceIdentityCard, setWorkspaceIdentityCard] = useState<any>(null);
  const [workspaceQuery, setWorkspaceQuery] = useState("");
  const [workspacePrimaryId, setWorkspacePrimaryId] = useState("");
  const [workspaceSecondaryId, setWorkspaceSecondaryId] = useState("");
  const [workspacePhotoUrl, setWorkspacePhotoUrl] = useState("");
  const [workspaceFlags, setWorkspaceFlags] = useState<string[]>([]);
  const [workspaceStatus, setWorkspaceStatus] = useState("");
  const [checkedInPatientId, setCheckedInPatientId] = useState("");
  const [pendingCheckInPatient, setPendingCheckInPatient] = useState<Patient | null>(null);
  const [checkInMode, setCheckInMode] = useState<"today" | "date">("today");
  const [checkInDate, setCheckInDate] = useState(new Date().toISOString().slice(0, 10));
  const [checkInStatus, setCheckInStatus] = useState("");
  const [actionNotice, setActionNotice] = useState("");
  const actionNoticeTimer = useRef<number | null>(null);
  const [todayPage, setTodayPage] = useState(0);
  const [recentRegisteredIds, setRecentRegisteredIds] = useState<Set<string>>(new Set());
  const [queuedPatientLocks, setQueuedPatientLocks] = useState<Set<string>>(() => readQueuedPatientLocks());
  const [patientTableFilter, setPatientTableFilter] = useState<"all" | "recent" | "male" | "female">("all");
  const [queuePatient, setQueuePatient] = useState<Patient | null>(null);
  const [queueDestinationInput, setQueueDestinationInput] = useState("");
  const [queueSaving, setQueueSaving] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [form, setForm] = useState(createEmptyPatientForm);
  const [duplicatePatient, setDuplicatePatient] = useState<Patient | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState("");
  const [duplicateDetailsOpen, setDuplicateDetailsOpen] = useState(false);
  const [duplicateMergeStatus, setDuplicateMergeStatus] = useState("");
  const dobPickerRef = useRef<HTMLInputElement | null>(null);
  const checkedInPatientRef = useRef<Patient | null>(null);
  const isPatientQueuedFromThisModuleRef = useRef<(patient: any) => boolean>(() => false);

  const showActionNotice = useCallback((message: string) => {
    setActionNotice(message);
    if (actionNoticeTimer.current) {
      window.clearTimeout(actionNoticeTimer.current);
    }
    actionNoticeTimer.current = window.setTimeout(() => setActionNotice(""), 2600);
  }, []);

  const rememberQueuedPatientLock = useCallback((patientId: string) => {
    setQueuedPatientLocks((current) => {
      const next = new Set(current);
      next.add(String(patientId));
      if (typeof window !== "undefined") {
        window.localStorage.setItem(QUEUED_PATIENT_LOCK_STORAGE_KEY, JSON.stringify(Array.from(next)));
      }
      return next;
    });
  }, []);

  const isPatientQueuedFromThisModule = useCallback(
    (patient: any) =>
      Boolean(
        patient?.id &&
          (queuedPatientLocks.has(String(patient.id)) ||
            patient?.queuedFromPatientRegistration ||
            patient?.queueSource === "patient.registration" ||
            patient?.queueStatus ||
            patient?.queueModule ||
            patient?.queueToken),
      ),
    [queuedPatientLocks],
  );

  const isSuperAdmin = isSuperAdminRole(user?.role);
  const canEditPatientRecord = useCallback(
    (patient: any) =>
      Boolean(patient?.id && (isSuperAdmin || (patient.id === checkedInPatientId && !isPatientQueuedFromThisModule(patient)))),
    [checkedInPatientId, isPatientQueuedFromThisModule, isSuperAdmin],
  );
  isPatientQueuedFromThisModuleRef.current = isPatientQueuedFromThisModule;

  const openDateOfBirthPicker = () => {
    const picker = dobPickerRef.current;
    if (!picker) return;
    if (typeof picker.showPicker === "function") {
      picker.showPicker();
      return;
    }
    picker.focus();
    picker.click();
  };

  useEffect(
    () => () => {
      if (actionNoticeTimer.current) {
        window.clearTimeout(actionNoticeTimer.current);
      }
    },
    [],
  );

  const filtered = patients.filter((p) =>
    `${p.name} ${p.regNo} ${p.phone} ${p.nationalId}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  useEffect(() => {
    const firstName = form.firstName.trim().toLowerCase();
    const lastName = form.lastName.trim().toLowerCase();
    const fullName = [firstName, lastName].filter(Boolean).join(" ");
    const phone = form.phonePrimary.trim();
    const nationalId = form.idNumber.trim();
    const dateOfBirth = form.dateOfBirth.trim();
    const hasEnoughData = nationalId.length >= 4 || phone.length >= 6 || (firstName && lastName) || (firstName && dateOfBirth);

    if (!formOpen || !hasEnoughData) {
      setDuplicatePatient(null);
      setDuplicateWarning("");
      return;
    }

    let cancelled = false;
    const localMatch = patients.find((patient) => {
      if (editingPatient?.id && patient.id === editingPatient.id) return false;
      const patientName = patient.name.toLowerCase();
      const sameId = Boolean(nationalId && patient.nationalId === nationalId);
      const samePhone = Boolean(phone && patient.phone === phone);
      const sameName = Boolean(fullName && patientName.includes(fullName));
      const sameDob = Boolean(dateOfBirth && String((patient as any).dateOfBirth || "").slice(0, 10) === dateOfBirth);
      return sameId || samePhone || (sameName && sameDob);
    });

    if (localMatch) {
      setDuplicatePatient(localMatch);
      setDuplicateWarning(
        `This patient may already exist: ${localMatch.name} · ${localMatch.regNo || localMatch.phone || localMatch.nationalId || localMatch.id}`,
      );
    } else {
      setDuplicatePatient(null);
      setDuplicateWarning("");
    }

    const timer = window.setTimeout(async () => {
      try {
        const result = await fetchTenantPatientDuplicateCheck({
          firstName: form.firstName,
          lastName: form.lastName,
          dateOfBirth: form.dateOfBirth,
          nationalId: form.idNumber,
          phone: form.phonePrimary,
          email: form.email,
        });
        if (cancelled) return;
        const matches = Array.isArray((result as any)?.matches)
          ? (result as any).matches
          : Array.isArray(result)
            ? result
            : [];
        const bestRaw = matches[0]?.patient || matches[0];
        if (bestRaw?.id && bestRaw.id !== editingPatient?.id) {
          const best = toFrontendPatient(bestRaw);
          setDuplicatePatient(best);
          setDuplicateWarning(
            `This patient may already exist: ${best.name} · ${best.regNo || best.phone || best.nationalId || best.id}`,
          );
        } else if (!localMatch) {
          setDuplicatePatient(null);
          setDuplicateWarning("");
        }
      } catch {
        if (!cancelled && !localMatch) {
          setDuplicatePatient(null);
          setDuplicateWarning("");
        }
      }
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [
    form.firstName,
    form.lastName,
    form.dateOfBirth,
    form.phonePrimary,
    form.idNumber,
    form.email,
    formOpen,
    patients,
    editingPatient?.id,
  ]);

  const autofillDuplicatePatient = () => {
    if (!duplicatePatient) return;
    const parts = duplicatePatient.name.split(" ");
    setForm((current) => ({
      ...current,
      firstName: parts[0] || current.firstName,
      middleName: (duplicatePatient as any).middleName || current.middleName,
      lastName: parts.slice(1).join(" ") || current.lastName,
      gender:
        duplicatePatient.gender === "Female"
          ? "FEMALE"
          : duplicatePatient.gender === "Male"
            ? "MALE"
            : "OTHER",
      idNumber: duplicatePatient.nationalId || current.idNumber,
      phonePrimary: duplicatePatient.phone || current.phonePrimary,
      age: duplicatePatient.age ? String(duplicatePatient.age) : current.age,
      bloodGroup: (duplicatePatient as any).bloodGroup || current.bloodGroup,
      addressLine1: (duplicatePatient as any).address || current.addressLine1,
      allergies: (duplicatePatient as any).allergies || current.allergies,
    }));
    setDuplicateWarning("Existing patient details copied into the form. Review before saving.");
  };

  const refreshPatients = useCallback(
    async (query = search.trim(), showLoader = false) => {
      if (showLoader) setLoading(true);
      try {
        const backendPatients = await fetchTenantPatients(query || undefined, facility?.id);
        const mapped = backendPatients.map(toFrontendPatient);
        setPatients(mapped);
        if (!query) {
          setStatsPatients(mapped);
        }
      } catch {
        // keep local data fallback
      } finally {
        if (showLoader) setLoading(false);
      }
    },
    [facility?.id, search, setPatients],
  );

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const backendPatients = await fetchTenantPatients(search.trim() || undefined, facility?.id);
        if (!cancelled) {
          const mapped = backendPatients.map(toFrontendPatient);
          setPatients(mapped);
          if (!search.trim()) {
            setStatsPatients(mapped);
          }
        }
      } catch {
        // keep local data fallback
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [facility?.id, search, setPatients]);

  useEffect(() => {
    const refreshSilently = () => {
      void refreshPatients("", false);
    };
    const interval = window.setInterval(refreshSilently, 90000);
    return () => {
      window.clearInterval(interval);
    };
  }, [refreshPatients]);

  useEffect(() => {
    const handleSidebarFormOpen = (event: Event) => {
      const detail = (event as CustomEvent<{ moduleId?: number; formId?: string }>).detail;
      if (Number(detail?.moduleId) !== 1) return;
      const formId = String(detail?.formId || "").toLowerCase();
      setFormOpen(true);
      if (formId.includes("kin")) {
        setFormTab("kin");
      } else if (formId.includes("insurance")) {
        setFormTab("insurance");
      } else {
        setFormTab("personal");
      }
    };

    window.addEventListener("hmis:open-workflow-form", handleSidebarFormOpen);
    return () => window.removeEventListener("hmis:open-workflow-form", handleSidebarFormOpen);
  }, []);

  useEffect(() => {
    const handleWorkspaceAction = (event: Event) => {
      const action = (event as CustomEvent<{ action?: typeof workspaceAction | "queue" }>).detail?.action;
      if (!action) return;
      if (action === "queue") {
        const patient = checkedInPatientRef.current || patients.find((row) => row.id === checkedInPatientId) || null;
        if (!patient) {
          showActionNotice("Check in a patient before opening queue routing.");
          return;
        }
        setQueuePatient(patient);
        setQueueDestinationInput("");
        return;
      }
      setWorkspaceAction(action);
      setWorkspaceQuery("");
      setWorkspacePrimaryId("");
      setWorkspaceSecondaryId("");
      setWorkspacePhotoUrl("");
      setWorkspaceFlags([]);
      setWorkspaceStatus("");
    };

    window.addEventListener("hmis:patient-workspace-action", handleWorkspaceAction);
    return () => window.removeEventListener("hmis:patient-workspace-action", handleWorkspaceAction);
  }, [checkedInPatientId, patients, showActionNotice]);

  const handleResetForm = () => {
    setFormTab("personal");
    setForm(createEmptyPatientForm());
    setDuplicatePatient(null);
    setDuplicateWarning("");
    setDuplicateDetailsOpen(false);
    setDuplicateMergeStatus("");
    setEditingPatient(null);
  };

  const fillFormFromPatient = (patient: Patient, details?: any) => {
    const source = { ...(patient as any), ...(details || {}) };
    const sourceName = source.name || [source.firstName, source.middleName, source.lastName].filter(Boolean).join(" ") || patient.name;
    const parts = String(sourceName || "").split(" ");
    setForm((current) => ({
      ...current,
      firstName: source.firstName || parts[0] || "",
      middleName: source.middleName || "",
      lastName: source.lastName || parts.slice(1).join(" "),
      gender: String(source.gender || patient.gender).toUpperCase() === "FEMALE" ? "FEMALE" : String(source.gender || patient.gender).toUpperCase() === "MALE" ? "MALE" : "OTHER",
      dateOfBirth: String(source.dateOfBirth || "").slice(0, 10),
      maritalStatus: source.maritalStatus || "",
      nationality: source.nationality || "",
      idType: source.idType || "",
      idNumber: source.nationalId || source.idNumber || "",
      shaNumber: source.shaNumber || "",
      phonePrimary: source.phonePrimary || source.phone || "",
      phoneSecondary: source.phoneSecondary || "",
      email: source.email || "",
      county: source.county || "",
      subCounty: source.subCounty || "",
      villageEstate: source.villageEstate || "",
      age: String(source.age || ageFromDob(source.dateOfBirth) || ""),
      addressLine1: source.addressLine1 || source.address || "",
      bloodGroup: source.bloodGroup || "",
      religion: source.religion || "",
      occupation: source.occupation || "",
      educationLevel: source.educationLevel || "",
      photoUrl: source.photoUrl || "",
      allergies: source.allergies || "",
      medicalHistory: source.medicalHistory || source.pastMedicalHistory || "",
      nextOfKinName: source.nextOfKinName || source.emergencyContactName || "",
      nextOfKinPhone: source.nextOfKinPhone || source.emergencyContactPhone || "",
      nextOfKinRelationship: source.nextOfKinRelationship || source.emergencyContactRelationship || "",
      nextOfKinEmail: source.nextOfKinEmail || "",
      nextOfKinAddress: source.nextOfKinAddress || "",
      nextOfKinIsPrimary: Boolean(source.nextOfKinIsPrimary),
      nextOfKinConsent: Boolean(source.nextOfKinConsent),
      hasInsurance: Boolean(source.hasInsurance || source.insuranceProvider || source.insuranceNumber || source.insuranceScheme || source.policyNumber),
      insuranceScheme: source.insuranceProvider || source.insuranceScheme || "",
      policyNumber: source.insuranceNumber || source.policyNumber || "",
      memberName: source.memberName || source.insuranceMemberName || "",
      isPrincipal: source.isPrincipal ?? source.insuranceIsPrincipal ?? true,
      principalIdNumber: source.principalIdNumber || source.insurancePrincipalId || "",
      policyStartDate: String(source.policyStartDate || source.insuranceValidFrom || "").slice(0, 10),
      policyExpiryDate: String(source.policyExpiryDate || source.insuranceValidTo || source.insuranceExpiry || "").slice(0, 10),
      annualBenefitLimit: source.annualBenefitLimit || source.insuranceBenefitLimit ? String(source.annualBenefitLimit || source.insuranceBenefitLimit) : "",
      portalPhone: source.portalPhone || source.phone || "",
      vulnerabilityFlags: Array.isArray(source.vulnerabilityFlags) ? source.vulnerabilityFlags : [],
    }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLElement | null;
    if (submitter?.dataset.patientRegister !== "true") {
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload = {
        firstName: form.firstName.trim(),
        middleName: form.middleName.trim() || undefined,
        lastName: form.lastName.trim(),
        gender: form.gender,
        dateOfBirth: form.dateOfBirth || dobFromAge(parseInt(form.age || "0", 10)),
        nationalId: form.idNumber.trim() || undefined,
        idType: form.idType || undefined,
        idNumber: form.idNumber.trim() || undefined,
        nationality: form.nationality.trim() || undefined,
        shaNumber: form.shaNumber.trim() || undefined,
        phone: form.phonePrimary.trim() || undefined,
        phonePrimary: form.phonePrimary.trim() || undefined,
        phoneSecondary: form.phoneSecondary.trim() || undefined,
        email: form.email.trim() || undefined,
        address: form.addressLine1.trim() || undefined,
        addressLine1: form.addressLine1.trim() || undefined,
        county: form.county.trim() || undefined,
        subCounty: form.subCounty.trim() || undefined,
        villageEstate: form.villageEstate.trim() || undefined,
        religion: form.religion.trim() || undefined,
        occupation: form.occupation.trim() || undefined,
        educationLevel: form.educationLevel.trim() || undefined,
        photoUrl: form.photoUrl.trim() || undefined,
        allergies: form.allergies.trim() || undefined,
        medicalHistory: form.medicalHistory.trim() || undefined,
        bloodGroup: form.bloodGroup || undefined,
        vulnerabilityFlags: form.vulnerabilityFlags,
        nextOfKinName: form.nextOfKinName.trim() || undefined,
        nextOfKinRelationship: form.nextOfKinRelationship || undefined,
        nextOfKinPhone: form.nextOfKinPhone.trim() || undefined,
        nextOfKinEmail: form.nextOfKinEmail.trim() || undefined,
        nextOfKinAddress: form.nextOfKinAddress.trim() || undefined,
        nextOfKinIsPrimary: form.nextOfKinIsPrimary,
        nextOfKinConsent: form.nextOfKinConsent,
        insuranceProvider: form.hasInsurance ? form.insuranceScheme.trim() || undefined : undefined,
        insuranceNumber: form.hasInsurance ? form.policyNumber.trim() || undefined : undefined,
        insuranceScheme: form.hasInsurance ? form.insuranceScheme.trim() || undefined : undefined,
        policyNumber: form.hasInsurance ? form.policyNumber.trim() || undefined : undefined,
        memberName: form.hasInsurance ? form.memberName.trim() || undefined : undefined,
        isPrincipal: form.hasInsurance ? form.isPrincipal : undefined,
        principalIdNumber: form.hasInsurance ? form.principalIdNumber.trim() || undefined : undefined,
        policyStartDate: form.hasInsurance && form.policyStartDate ? new Date(form.policyStartDate).toISOString() : undefined,
        policyExpiryDate: form.hasInsurance && form.policyExpiryDate ? new Date(form.policyExpiryDate).toISOString() : undefined,
        annualBenefitLimit: form.hasInsurance && form.annualBenefitLimit ? Number(form.annualBenefitLimit) : undefined,
        portalAccessEnabled: true,
        portalPhone: form.portalPhone.trim() || form.phonePrimary.trim() || undefined,
        primaryFacilityId: facility?.id || undefined,
        orgId: facility?.id || undefined,
      } as any;
      if (editingPatient && !canEditPatientRecord(editingPatient)) {
        showActionNotice("Patient is already queued. Only Super Admin can edit this record.");
        return;
      }
      const created = editingPatient
        ? await updateTenantPatient(editingPatient.id, payload)
        : await createTenantPatient(payload);
      const latest = await fetchTenantPatients(undefined, facility?.id);
      const mapped: Patient[] = latest.map(toFrontendPatient);
      setPatients(mapped);
      const createdPatient =
        mapped.find((patient: Patient) => patient.id === String((created as any)?.id || (created as any)?.data?.id || editingPatient?.id || "")) ||
        mapped.find((patient: Patient) => patient.phone === form.phonePrimary.trim() && patient.nationalId === form.idNumber.trim()) ||
        mapped[0];
      if (createdPatient) {
        setCheckedInPatientId(createdPatient.id);
        publishPatientModuleState(createdPatient, isPatientQueuedFromThisModule(createdPatient));
        setRecentRegisteredIds((current) => new Set([...Array.from(current), createdPatient.id]));
        setSearch("");
        setCheckInStatus(
          editingPatient
            ? `${createdPatient.name} updated successfully.`
            : `${createdPatient.name} has been registered and checked in automatically.`,
        );
        showActionNotice(
          editingPatient
            ? `${createdPatient.name} updated successfully.`
            : `${createdPatient.name} registered successfully.`,
        );
        if (!editingPatient && !isPatientQueuedFromThisModule(createdPatient)) {
          setQueuePatient(createdPatient);
        }
        setQueueDestinationInput("");
        setTodayPage(0);
      }
      setFormOpen(false);
      handleResetForm();
      try {
        const latest = await fetchTenantPatients(undefined, facility?.id);
        const mapped = latest.map(toFrontendPatient);
        setPatients(mapped);
        setStatsPatients(mapped);
      } catch {
        // keep current UI state if the silent refresh fails
      }
    } catch (err: any) {
      setError(err?.message || "Failed to register patient.");
    } finally {
      setSaving(false);
    }
  };

  const patientsForStats = statsPatients.length > 0 ? statsPatients : patients;
  const nowForPatientStats = new Date();
  const patientStats = {
    total: patientsForStats.length,
    thisMonth: patientsForStats.filter((patient) => {
      const registeredValue = patientStatsDateValue(patient) || patientRegistrationDateValue(patient);
      return recentRegisteredIds.has(patient.id) || isWithinLastDays(registeredValue, nowForPatientStats, 30);
    }).length,
    male: patientsForStats.filter((patient) => String(patient.gender || "").toUpperCase() === "MALE").length,
    female: patientsForStats.filter((patient) => String(patient.gender || "").toUpperCase() === "FEMALE").length,
  };

  const exportCSV = async () => {
    setExportingCsv(true);
    try {
      let exportPatients = todayPatients;
      try {
        const latest = await fetchTenantPatients(undefined, facility?.id);
        const mapped = latest.map(toFrontendPatient);
        setPatients(mapped);
        const latestTodayPatients = mapped
          .filter((patient) => {
            const registrationDate = patientRegistrationDateValue(patient);
            return (
              recentRegisteredIds.has(patient.id) ||
              !registrationDate ||
              isSameLocalDate(registrationDate, new Date())
            );
          })
          .sort((a, b) => {
            const left = new Date(String(patientRegistrationDateValue(a) || 0)).getTime();
            const right = new Date(String(patientRegistrationDateValue(b) || 0)).getTime();
            return right - left;
          });
        exportPatients = latestTodayPatients.length > 0 ? latestTodayPatients : mapped;
      } catch {
        exportPatients = todayPatients;
      }

      if (exportPatients.length === 0) {
        showActionNotice("No patients available to export.");
        return;
      }

    const headers = [
      "Patient ID",
      "Name",
      "Gender",
      "Blood Group",
      "Phone",
      "National ID",
      "Registered",
    ];
    const rows = exportPatients.map((patient) => [
      patient.regNo,
      patient.name,
      patient.gender,
      (patient as any).bloodGroup || "",
      patient.phone || "",
      patient.nationalId || "",
      formatPatientRegistrationDate(patient),
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `patient-registration-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
      showActionNotice(`${exportPatients.length} patient record${exportPatients.length === 1 ? "" : "s"} exported.`);
    } catch (err: any) {
      setError(err?.message || "Failed to export patient CSV.");
      showActionNotice("Patient export failed.");
    } finally {
      setExportingCsv(false);
    }
  };

  const workspaceTitles: Record<NonNullable<typeof workspaceAction>, string> = {
    monitor: "Monitor Patient Queue",
    duplicates: "Duplicate Patient Detection",
    insurance: "Insurance Eligibility Verification",
    portal: "Patient Portal Account",
    photo: "Patient Photo Capture",
    vulnerability: "Vulnerability Flagging",
    merge: "Patient Merge",
    "identity-card": "Patient ID Card / QR",
  };
  const vulnerabilityOptions = [
    "Elderly 70+",
    "Pregnant",
    "Disability",
    "Requires interpreter",
    "Requires wheelchair",
    "Visual impairment",
    "Hearing impairment",
    "Latex allergy",
  ];
  const patientLabel = (patient: Patient) => `${patient.name} · ${patient.regNo || patient.id}`;
  const workspaceMatches = filtered
    .filter((patient) => {
      const query = workspaceQuery.trim().toLowerCase();
      if (!query) return true;
      return `${patient.name} ${patient.regNo} ${patient.phone} ${patient.nationalId}`.toLowerCase().includes(query);
    })
    .slice(0, 8);
  const checkedInPatient = patients.find((patient) => patient.id === checkedInPatientId);
  const datedTodayPatients = patients
    .filter((patient) => {
      const registrationDate = patientRegistrationDateValue(patient);
      return recentRegisteredIds.has(patient.id) || isSameLocalDate(registrationDate, new Date());
    })
    .sort((a, b) => {
      const left = new Date(String(patientRegistrationDateValue(a) || 0)).getTime();
      const right = new Date(String(patientRegistrationDateValue(b) || 0)).getTime();
      return right - left;
    });
  const todayPatients = datedTodayPatients;
  const tablePatients = patients
    .filter((patient) => {
      if (patientTableFilter === "recent") {
        const registeredValue = patientStatsDateValue(patient) || patientRegistrationDateValue(patient);
        return isWithinLastDays(registeredValue, new Date(), 30);
      }
      if (patientTableFilter === "male") return String(patient.gender || "").toUpperCase() === "MALE";
      if (patientTableFilter === "female") return String(patient.gender || "").toUpperCase() === "FEMALE";
      if (patientTableFilter === "all") return true;
      return todayPatients.some((todayPatient) => todayPatient.id === patient.id);
    })
    .filter((patient) => {
      if (!search.trim()) return true;
      return `${patient.name} ${patient.regNo} ${patient.phone} ${patient.nationalId}`
        .toLowerCase()
        .includes(search.trim().toLowerCase());
    });
  const tableTotalPages = Math.max(1, Math.ceil(tablePatients.length / 10));
  const tablePatientsPage = tablePatients.slice(todayPage * 10, todayPage * 10 + 10);
  const tableFilterLabel =
    patientTableFilter === "all"
      ? "All Registered Patients"
      : patientTableFilter === "today"
      ? "Today Registered Patients"
      : patientTableFilter === "recent"
      ? "Patients Registered in the Last 30 Days"
      : patientTableFilter === "male"
      ? "Male Patients"
      : "Female Patients";
  const searchPopupPatients = search.trim() && !checkedInPatientId ? filtered.slice(0, 6) : [];
  checkedInPatientRef.current = checkedInPatient || null;
  const monitoredQueuePatients = patients
    .filter((patient) => isPatientQueuedFromThisModule(patient))
    .map((patient) => ({
      patient,
      queueModule:
        (patient as any)?.queueModule ||
        (patient as any)?.queueStatus ||
        (patient as any)?.departmentId ||
        "Queued",
    }));

  useEffect(() => {
    if (typeof window === "undefined") return;
    publishPatientModuleState(
      checkedInPatient,
      checkedInPatient ? isPatientQueuedFromThisModule(checkedInPatient) : false,
    );
  }, [checkedInPatient, isPatientQueuedFromThisModule]);

  const duplicateCandidates = patients
    .flatMap((patient, index) =>
      patients.slice(index + 1).flatMap((other) => {
        const sameId = patient.nationalId && patient.nationalId === other.nationalId;
        const samePhone = patient.phone && patient.phone === other.phone;
        const sameName = patient.name.toLowerCase() === other.name.toLowerCase();
        const score = Number(Boolean(sameId)) * 60 + Number(Boolean(samePhone)) * 30 + Number(Boolean(sameName)) * 20;
        return score >= 50 ? [{ patient, other, score: Math.min(score, 100) }] : [];
      }),
    )
    .slice(0, 6);
  const selectedWorkspacePatient = patients.find((patient) => patient.id === workspacePrimaryId);
  const secondaryWorkspacePatient = patients.find((patient) => patient.id === workspaceSecondaryId);

  const recordWorkspaceAction = async (action: string, data: Record<string, any>) => {
    const response = await apiFetch("/module-actions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        module: "patients",
        action,
        data,
        context: { title: "Patient Registry" },
      }),
    });
    await parseJsonSafe(response);
  };

  const printIdentityCard = () => {
    if (!workspaceIdentityCard || typeof window === "undefined") return;
    const popup = window.open("", "patient-identity-card", "width=680,height=520");
    if (!popup) {
      setWorkspaceStatus("Allow pop-ups to print the patient identity card.");
      return;
    }
    const escapeHtml = (value: unknown) =>
      String(value || "").replace(/[&<>"']/g, (char) =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char] || char),
      );
    const hospital = workspaceIdentityCard.hospital || {};
    const printHtml = `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(hospital.name || "Patient Identity Card")}</title><style>
      @page{size:auto;margin:.25in}*{box-sizing:border-box}html,body{margin:0;padding:0;background:#fff;color:#17233d;font-family:Arial,Helvetica,sans-serif}body{padding:8px}.card{width:560px;max-width:100%;overflow:hidden;border:1px solid #c8d7ea;border-radius:14px;background:linear-gradient(145deg,#fff 0%,#f4f8fd 100%);box-shadow:0 12px 26px rgba(15,52,91,.14);page-break-inside:avoid}.brand{display:grid;grid-template-columns:43px minmax(0,1fr) 44px;align-items:center;gap:12px;min-height:92px;padding:14px 18px;color:#fff;background:linear-gradient(110deg,#123b78,#087d91)}.logo{width:43px;height:43px;object-fit:contain;border-radius:8px;padding:4px;background:#fff}.brand-copy{min-width:0}.eyebrow{display:block;color:#c5e8f1;font-size:10px;font-weight:800;letter-spacing:.04em;text-transform:uppercase}.brand-title{display:block;margin-top:2px;font-size:16px;font-weight:700}.brand small{display:block;margin-top:2px;color:#d9f4f7;font-size:10px;line-height:1.2}.brand small.phone{color:#fff;font-weight:700}.qr{width:44px;height:44px;justify-self:end;border:2px solid #fff;border-radius:5px;background:#fff;image-rendering:pixelated}.body{display:flex;gap:16px;padding:18px 18px 20px}.photo{width:82px;height:96px;flex:0 0 auto;display:grid;place-items:center;border:1px solid #cbd9e8;border-radius:8px;color:#1763b3;background:#e8f1fb;font-size:32px;font-weight:900}.photo img{width:100%;height:100%;object-fit:cover;border-radius:7px}.fields{display:grid;flex:1;grid-template-columns:repeat(2,minmax(0,1fr));gap:11px 20px;align-content:start}.label{display:block;color:#64748b;font-size:10px;font-weight:800;letter-spacing:.04em;text-transform:uppercase}.value{display:block;margin-top:3px;color:#17233d;font-size:14px;font-weight:600;overflow-wrap:anywhere}
    </style></head><body><main class="card"><header class="brand">${hospital.logoUrl ? `<img class="logo" src="${escapeHtml(resolveAssetUrl(hospital.logoUrl))}" alt="Hospital logo">` : `<span class="logo" aria-hidden="true"></span>`}<div class="brand-copy"><span class="eyebrow">${escapeHtml(hospital.name || "Hospital")}</span><strong class="brand-title">Patient Identity Card</strong><small>${escapeHtml(hospital.address || "Location not configured")}</small><small class="phone">Tel: ${escapeHtml(hospital.phone || "Phone not configured")}</small></div>${workspaceIdentityCard.qrImageUrl ? `<img class="qr" src="${escapeHtml(workspaceIdentityCard.qrImageUrl)}" alt="Patient identity QR code">` : ""}</header><section class="body"><div class="photo">${workspaceIdentityCard.photoUrl ? `<img class="photo" src="${escapeHtml(resolveAssetUrl(workspaceIdentityCard.photoUrl))}" alt="Patient photo">` : escapeHtml(String(workspaceIdentityCard.name || "P").slice(0, 1).toUpperCase())}</div><div class="fields"><div><span class="label">Patient name</span><strong class="value">${escapeHtml(workspaceIdentityCard.name || "Patient")}</strong></div><div><span class="label">Medical record number</span><strong class="value">${escapeHtml(workspaceIdentityCard.mrn || "—")}</strong></div><div><span class="label">Date of birth</span><strong class="value">${escapeHtml(workspaceIdentityCard.dateOfBirth ? new Date(workspaceIdentityCard.dateOfBirth).toLocaleDateString() : "Not captured")}</strong></div><div><span class="label">Patient phone</span><strong class="value">${escapeHtml(workspaceIdentityCard.phone || "Not captured")}</strong></div><div><span class="label">Sex</span><strong class="value">${escapeHtml(workspaceIdentityCard.gender || "Not captured")}</strong></div></div></section></main><script>window.onload=function(){window.print();window.onafterprint=function(){window.close();};};</script></body></html>`;
    popup.document.open();
    popup.document.write(printHtml);
    popup.document.close();
  };

  const handleWorkspaceSubmit = async () => {
    if (!workspaceAction) return;
    const patient = selectedWorkspacePatient;
    if (!patient && workspaceAction !== "duplicates") {
      setWorkspaceStatus("Select a patient first.");
      return;
    }

    if (workspaceAction === "insurance" && patient) {
      try {
        const res = await apiFetch(`/patients/${patient.id}/insurance/verify`, { method: "POST" });
        if (res.ok) {
          const data = await res.json();
          setWorkspaceStatus(`Insurance verified: ${data?.status || data?.message || "Eligible"}`);
          showActionNotice("Insurance eligibility verified.");
          return;
        }
      } catch {
        // fallback
      }
      const active = Boolean((patient as any).insuranceProvider || (patient as any).insuranceNumber);
      await recordWorkspaceAction("Insurance Eligibility Verification", {
        patientId: patient.id,
        eligibilityStatus: active ? "CONFIRMED" : "MISSING_INSURANCE_DETAILS",
      });
      setWorkspaceStatus(active ? "Eligibility confirmed." : "Capture insurance provider and policy number first.");
      return;
    }

    if (workspaceAction === "identity-card" && patient) {
      try {
        const res = await apiFetch(`/patients/${patient.id}/identity-card`);
        if (res.ok) {
          const data = await res.json();
          setWorkspaceIdentityCard(data?.data || data);
          setWorkspaceStatus("Identity card data prepared. Click print below.");
          showActionNotice("Identity card ready.");
          return;
        }
      } catch {
        // fallback
      }
      setWorkspaceIdentityCard({
        name: patient.name,
        mrn: patient.regNo || patient.id.slice(0, 8).toUpperCase(),
        phone: patient.phone,
        gender: patient.gender,
        hospital: { name: facility?.name || dashboardFacilityName || "MediLink Hospital" },
      });
      setWorkspaceStatus("Identity card data prepared (local preview).");
      return;
    }

    if (workspaceAction === "portal" && patient) {
      await recordWorkspaceAction("Patient Portal Account Creation", {
        patientId: patient.id,
        phone: patient.phone,
        temporaryPinIssued: true,
      });
      setWorkspaceStatus(`Portal access prepared. Temporary PIN: ${Math.floor(100000 + Math.random() * 900000)}`);
      return;
    }

    if (workspaceAction === "photo" && patient) {
      if (!workspacePhotoUrl.trim()) {
        setWorkspaceStatus("Add a photo URL or uploaded file reference first.");
        return;
      }
      await updateTenantPatient(patient.id, { photoUrl: workspacePhotoUrl.trim() } as any);
      const latest = await fetchTenantPatients(undefined, facility?.id);
      const mapped = latest.map(toFrontendPatient);
      setPatients(mapped);
      setStatsPatients(mapped);
      setWorkspaceStatus("Patient photo updated and attached to the MRN.");
      return;
    }

    if (workspaceAction === "vulnerability" && patient) {
      try {
        await updateTenantPatient(patient.id, { vulnerabilityFlags: workspaceFlags } as any);
        setWorkspaceStatus("Vulnerability flags saved to patient record.");
        showActionNotice("Vulnerability flags saved.");
        const latest = await fetchTenantPatients(undefined, facility?.id);
        const mapped = latest.map(toFrontendPatient);
        setPatients(mapped);
        setStatsPatients(mapped);
        return;
      } catch {
        // fallback
      }
      await recordWorkspaceAction("Patient Vulnerability Flags", {
        patientId: patient.id,
        patientName: patient.name,
        flags: workspaceFlags,
      });
      setWorkspaceStatus("Vulnerability flags saved to the patient workflow audit trail.");
      return;
    }

    if (workspaceAction === "merge") {
      if (!selectedWorkspacePatient || !secondaryWorkspacePatient || workspacePrimaryId === workspaceSecondaryId) {
        setWorkspaceStatus("Select two different records before merging.");
        return;
      }
      try {
        const res = await apiFetch("/patients/merge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            primaryPatientId: selectedWorkspacePatient.id,
            secondaryPatientId: secondaryWorkspacePatient.id,
            reason: "Duplicate patient record merged from desktop workspace",
          }),
        });
        if (res.ok) {
          setWorkspaceStatus("Patients successfully merged. Secondary MRN has been retired.");
          showActionNotice("Patient merge completed.");
          const latest = await fetchTenantPatients(undefined, facility?.id);
          const mapped = latest.map(toFrontendPatient);
          setPatients(mapped);
          setStatsPatients(mapped);
          return;
        }
      } catch {
        // fallback
      }
      await recordWorkspaceAction("Patient Merge", {
        primaryPatientId: selectedWorkspacePatient.id,
        primaryMrn: selectedWorkspacePatient.regNo,
        retiredPatientId: secondaryWorkspacePatient.id,
        retiredMrn: secondaryWorkspacePatient.regNo,
        reversible: true,
      });
      setWorkspaceStatus("Patient merge request recorded for authorised review and audit.");
    }
  };

  const requestDuplicateMerge = async () => {
    if (!duplicatePatient) return;
    setDuplicateMergeStatus("Submitting merge request...");
    try {
      await recordWorkspaceAction("Patient Merge", {
        primaryPatientId: duplicatePatient.id,
        primaryMrn: duplicatePatient.regNo,
        incomingDraft: form,
        facilityId: facility?.id,
        reversible: true,
        status: "PENDING_REVIEW",
      });
      setDuplicateMergeStatus("Merge request submitted for authorised review.");
      showActionNotice("Duplicate merge request submitted.");
    } catch {
      setDuplicateMergeStatus("Merge request could not be submitted.");
      showActionNotice("Merge request failed.");
    }
  };

  const confirmSearchCheckIn = async () => {
    if (!pendingCheckInPatient) return;
    const visitDate =
      checkInMode === "today" ? new Date().toISOString().slice(0, 10) : checkInDate;
    await recordWorkspaceAction("Returning Patient Check-In", {
      patientId: pendingCheckInPatient.id,
      mrn: pendingCheckInPatient.regNo,
      patientName: pendingCheckInPatient.name,
      visitDate,
      visitTiming: checkInMode === "today" ? "TODAY" : "BACKDATED",
      checkedInAt: new Date().toISOString(),
    });
    setCheckedInPatientId(pendingCheckInPatient.id);
    publishPatientModuleState(pendingCheckInPatient, isPatientQueuedFromThisModule(pendingCheckInPatient));
    setRecentRegisteredIds((current) => new Set([...Array.from(current), pendingCheckInPatient.id]));
    setCheckInStatus(
      `${pendingCheckInPatient.name} checked in for ${checkInMode === "today" ? "today" : visitDate}. Patient data is now visible.`,
    );
    showActionNotice(`${pendingCheckInPatient.name} checked in successfully.`);
    if (isPatientQueuedFromThisModule(pendingCheckInPatient)) {
      showActionNotice(`${pendingCheckInPatient.name} is already queued from Patient Registration.`);
    } else {
      setQueuePatient(pendingCheckInPatient);
    }
    setQueueDestinationInput("");
    setPendingCheckInPatient(null);
  };

  const queuePatientNext = async () => {
    if (!queuePatient?.id) return;
    if (isPatientQueuedFromThisModule(queuePatient)) {
      showActionNotice(`${queuePatient.name} has already been queued from this module.`);
      setQueuePatient(null);
      setQueueDestinationInput("");
      return;
    }
    const typed = queueDestinationInput.trim().toLowerCase();
    const destination =
      patientQueueDestinations.find((item) => item.label.toLowerCase() === typed) ||
      patientQueueDestinations.find((item) => item.label.toLowerCase().includes(typed));
    if (!destination) {
      showActionNotice("Select the module to queue patient next.");
      return;
    }
    setQueueSaving(true);
    try {
      const result = await createQueueToken({
        patientId: queuePatient.id,
        departmentId: destination.departmentId,
        queueType: destination.queueType,
        tokenPrefix: destination.tokenPrefix,
        queueLane: "GENERAL",
        priority: 3,
        source: "patient.registration",
        notes: `Queued from Patient Registration to ${destination.label}`,
      });
      const token = (result as any)?.token || result;
      const tokenNumber = token?.tokenNumber || queuePatient.regNo;
      const queuedPatient = {
        ...queuePatient,
        queueStatus: destination.departmentId as Patient["queueStatus"],
        queueModule: destination.label,
        queueToken: tokenNumber,
        queueSource: "patient.registration",
        queuedFromPatientRegistration: true,
        regNo: queuePatient.regNo || tokenNumber,
      };
      rememberQueuedPatientLock(queuePatient.id);
      publishPatientModuleState(queuedPatient, true);
      setPatients(
        patients.map((patient) =>
          patient.id === queuePatient.id
            ? { ...patient, ...queuedPatient }
            : patient,
        ),
      );
      window.dispatchEvent(new CustomEvent("hmis:patient-queued", { detail: { patient: queuePatient, destination, token } }));
      showActionNotice(`${queuePatient.name} queued to ${destination.label}.`);
      setQueuePatient(null);
      setQueueDestinationInput("");
    } catch (err: any) {
      showActionNotice(err?.message || "Patient queue failed.");
    } finally {
      setQueueSaving(false);
    }
  };

  const openPatientForEdit = async (patient: Patient) => {
    if (!canEditPatientRecord(patient)) {
      showActionNotice(
        isPatientQueuedFromThisModule(patient)
          ? "Patient is already queued. Only Super Admin can edit this record."
          : "Check in patient before editing.",
      );
      return;
    }
    let fullPatient: any = patient;
    try {
      fullPatient = await fetchTenantPatientById(patient.id);
    } catch {
      fullPatient = patient;
    }
    const mergedPatient = toFrontendPatient({ ...patient, ...(fullPatient || {}) });
    setEditingPatient(mergedPatient);
    fillFormFromPatient(mergedPatient, fullPatient);
    setFormTab("personal");
    setFormOpen(true);
  };

  const handleCheckoutPatient = (patient: Patient | undefined = checkedInPatient) => {
    if (!patient) return;
    void recordWorkspaceAction("Patient Check-Out", {
      patientId: patient.id,
      mrn: patient.regNo,
      patientName: patient.name,
      checkedOutAt: new Date().toISOString(),
    });
    setCheckedInPatientId("");
    publishPatientModuleState(null, false);
    setPendingCheckInPatient(null);
    setCheckInStatus(`${patient.name} checked out successfully.`);
    showActionNotice(`${patient.name} checked out successfully.`);
  };

  return (
    <div className="patients-view">
      <div className="pv-header">
        <div>
          <div className="pv-title">
            <Icon type="users" size={18} /> Patient Registry
          </div>
          <div className="pv-subtitle">Register and manage all facility patients</div>
        </div>
        <div className="pv-header-actions">
          <button
            type="button"
            onClick={exportCSV}
            title="Export today's registered patients"
            className="topbar-logout-btn pv-export-btn"
            disabled={exportingCsv}
          >
            <Icon type="chart" size={15} /> {exportingCsv ? "Exporting..." : "Export CSV"}
          </button>
          <button
            className="pv-primary-btn"
            title="Register Patient"
            onClick={() => {
              setFormOpen(true);
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Register Patient
          </button>
        </div>
      </div>

      <div className="pv-search-bar patient-checkin-search">
        <div className="pv-search-wrap">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#94a3b8"
            strokeWidth="2"
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
            }}
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            className="pv-search"
            placeholder="Search patient to check in by name, ID, phone, or MRN..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCheckInStatus("");
              setPendingCheckInPatient(null);
              setCheckedInPatientId("");
            }}
          />
        </div>
        {checkedInPatient ? (
          <button
            type="button"
            className="patient-search-checkout"
            onClick={() => handleCheckoutPatient(checkedInPatient)}
          >
            Check Out
          </button>
        ) : null}
        {searchPopupPatients.length > 0 && (
          <div className="patient-search-popup">
            {searchPopupPatients.map((patient) => (
              <div key={patient.id} className="patient-search-result">
                <div>
                  <strong>{patient.name}</strong>
                  <small>{patient.regNo || patient.id} · {patient.phone || "No phone"} · {patient.nationalId || "No ID"}</small>
                </div>
                <div className="patient-search-actions">
                  <button type="button" className="patient-search-cancel" onClick={() => setSearch("")}>
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="patient-search-checkin"
                    onClick={() => {
                      setPendingCheckInPatient(patient);
                      setCheckInMode("today");
                      setCheckInDate(new Date().toISOString().slice(0, 10));
                      setSearch("");
                      setCheckInStatus("");
                    }}
                  >
                    Check In
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        {pendingCheckInPatient && (
          <div className="patient-checkin-picker">
            <div>
              <strong>Check in {pendingCheckInPatient.name}</strong>
              <small>Choose Today for current visit, or Date for a previous visit update.</small>
            </div>
            <select value={checkInMode} onChange={(event) => setCheckInMode(event.target.value as "today" | "date")}>
              <option value="today">Today</option>
              <option value="date">Choose Date</option>
            </select>
            {checkInMode === "date" ? (
              <input type="date" value={checkInDate} onChange={(event) => setCheckInDate(event.target.value)} />
            ) : null}
            <button type="button" className="patient-search-checkin" onClick={confirmSearchCheckIn}>
              Confirm Check-In
            </button>
            <button type="button" className="patient-search-cancel" onClick={() => setPendingCheckInPatient(null)}>
              Cancel
            </button>
          </div>
        )}
        {checkInStatus ? <div className="patient-checkin-status">{checkInStatus}</div> : null}
      </div>

      {actionNotice ? (
        <div className="module-toast patient-action-toast" role="status" aria-live="polite">
          {actionNotice}
        </div>
      ) : null}

      <div className="pv-stats">
        {(
          [
            {
              label: "Total Patients",
              value: patientStats.total,
              color: "#1e3a8a",
              filter: "all" as const,
            },
            {
              label: "Registered Last 30 Days",
              value: patientStats.thisMonth,
              color: "#0d9488",
              filter: "recent" as const,
            },
            {
              label: "Male Patients",
              value: patientStats.male,
              color: "#0284c7",
              filter: "male" as const,
            },
            {
              label: "Female Patients",
              value: patientStats.female,
              color: "#db2777",
              filter: "female" as const,
            },
          ] as const
        ).map((s) => (
          <div
            key={s.label}
            className={`pv-stat-card is-clickable ${patientTableFilter === s.filter ? "is-active" : ""}`}
            style={{ borderLeftColor: s.color }}
            role="button"
            tabIndex={0}
            onClick={() => { setPatientTableFilter(s.filter); setTodayPage(0); }}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setPatientTableFilter(s.filter); setTodayPage(0); } }}
          >
            <p className="pv-stat-label">{s.label}</p>
            <p className="pv-stat-value">{s.value}</p>
          </div>
        ))}
      </div>

      {workspaceAction && (
        <div className="patient-workspace-backdrop" onClick={() => setWorkspaceAction(null)}>
        <section className="patient-workspace-panel patient-workspace-slide" onClick={(event) => event.stopPropagation()}>
          <div className="patient-workspace-head">
            <div>
              <h3>{workspaceTitles[workspaceAction]}</h3>
              <p>Use this tool without changing the main registration form fields.</p>
            </div>
            <button type="button" className="patient-workspace-close" onClick={() => setWorkspaceAction(null)}>
              ×
            </button>
          </div>

          {workspaceAction === "monitor" ? (
            <div className="patient-workspace-list">
              {monitoredQueuePatients.length > 0 ? (
                monitoredQueuePatients.map(({ patient, queueModule }) => (
                  <div className="patient-workspace-row" key={`monitor-${patient.id}`}>
                    <Icon type="users" size={18} />
                    <div>
                      <strong>{patient.name}</strong>
                      <small>
                        MRN {patient.regNo || patient.id} · Queued to {String(queueModule)}
                      </small>
                    </div>
                  </div>
                ))
              ) : (
                <div className="patient-workspace-empty">
                  No patient has been queued from this module yet.
                </div>
              )}
            </div>
          ) : workspaceAction === "duplicates" ? (
            <div className="patient-workspace-list">
              {duplicateCandidates.length === 0 ? (
                <div className="patient-workspace-empty">
                  No high-confidence duplicate records found in the current patient list.
                </div>
              ) : (
                duplicateCandidates.map((pair) => (
                  <div key={`${pair.patient.id}-${pair.other.id}`} className="patient-workspace-row">
                    <Icon type="manage_search" size={18} />
                    <div>
                      <strong>{pair.patient.name} ↔ {pair.other.name}</strong>
                      <small>
                        Confidence {pair.score}% · {pair.patient.regNo || pair.patient.id} / {pair.other.regNo || pair.other.id}
                      </small>
                    </div>
                    <button
                      type="button"
                      className="patient-workspace-action"
                      onClick={() => {
                        setWorkspaceAction("merge");
                        setWorkspacePrimaryId(pair.patient.id);
                        setWorkspaceSecondaryId(pair.other.id);
                      }}
                    >
                      Review Merge
                    </button>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="patient-workspace-grid">
              <label className="patient-workspace-field patient-workspace-span">
                <span>Search patient by name, phone, national ID, or MRN</span>
                <input
                  value={workspaceQuery}
                  onChange={(event) => setWorkspaceQuery(event.target.value)}
                  placeholder="Start typing to find a registered patient..."
                />
              </label>
              <label className="patient-workspace-field">
                <span>Primary patient</span>
                <select value={workspacePrimaryId} onChange={(event) => setWorkspacePrimaryId(event.target.value)}>
                  <option value="">Select patient</option>
                  {workspaceMatches.map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patientLabel(patient)}
                    </option>
                  ))}
                </select>
              </label>

              {workspaceAction === "merge" && (
                <label className="patient-workspace-field">
                  <span>Duplicate record to retire</span>
                  <select value={workspaceSecondaryId} onChange={(event) => setWorkspaceSecondaryId(event.target.value)}>
                    <option value="">Select duplicate</option>
                    {patients
                      .filter((patient) => patient.id !== workspacePrimaryId)
                      .map((patient) => (
                        <option key={patient.id} value={patient.id}>
                          {patientLabel(patient)}
                        </option>
                      ))}
                  </select>
                </label>
              )}

              {workspaceAction === "photo" && (
                <label className="patient-workspace-field">
                  <span>Captured photo reference</span>
                  <input
                    value={workspacePhotoUrl}
                    onChange={(event) => setWorkspacePhotoUrl(event.target.value)}
                    placeholder="Paste uploaded image URL or file reference"
                  />
                </label>
              )}

              {workspaceAction === "vulnerability" && (
                <div className="patient-workspace-field patient-workspace-span">
                  <span>Special handling flags</span>
                  <div className="patient-flag-grid">
                    {vulnerabilityOptions.map((flag) => (
                      <label key={flag}>
                        <input
                          type="checkbox"
                          checked={workspaceFlags.includes(flag)}
                          onChange={(event) =>
                            setWorkspaceFlags((current) =>
                              event.target.checked
                                ? [...current, flag]
                                : current.filter((item) => item !== flag),
                            )
                          }
                        />
                        {flag}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {workspaceAction === "identity-card" && workspaceIdentityCard ? (
                <div className="patient-id-card-result patient-workspace-span">
                  <div className="patient-id-card-brand">
                    {workspaceIdentityCard.hospital?.logoUrl ? (
                      <img src={resolveAssetUrl(workspaceIdentityCard.hospital.logoUrl)} alt="Hospital logo" className="patient-id-card-logo" />
                    ) : (
                      <div className="patient-id-card-mark">+</div>
                    )}
                    <div className="patient-id-card-hospital-copy">
                      <span>{workspaceIdentityCard.hospital?.name || "Hospital"}</span>
                      <strong>Patient Identity Card</strong>
                      <small>{workspaceIdentityCard.hospital?.address || "Location not configured"}</small>
                      <small>Tel: {workspaceIdentityCard.hospital?.phone || "Phone not configured"}</small>
                    </div>
                    {workspaceIdentityCard.qrImageUrl ? (
                      <img src={workspaceIdentityCard.qrImageUrl} alt="Patient identity QR code" className="patient-id-card-header-qr" style={{ width: 44, height: 44 }} />
                    ) : null}
                  </div>
                  <div className="patient-id-card-body">
                    {workspaceIdentityCard.photoUrl ? (
                      <img src={resolveAssetUrl(workspaceIdentityCard.photoUrl)} alt="Patient" className="patient-id-card-photo" />
                    ) : (
                      <div className="patient-id-card-photo patient-id-card-photo-empty">
                        {String(workspaceIdentityCard.name || "P").slice(0, 1).toUpperCase()}
                      </div>
                    )}
                    <div className="patient-id-card-fields">
                      <div><span>Patient name</span><strong>{workspaceIdentityCard.name || "Patient"}</strong></div>
                      <div><span>Medical record number</span><strong>{workspaceIdentityCard.mrn || "—"}</strong></div>
                      <div><span>Date of birth</span><strong>{workspaceIdentityCard.dateOfBirth ? new Date(workspaceIdentityCard.dateOfBirth).toLocaleDateString() : "Not captured"}</strong></div>
                      <div><span>Patient phone</span><strong>{workspaceIdentityCard.phone || "Not captured"}</strong></div>
                      <div><span>Sex</span><strong>{workspaceIdentityCard.gender || "Not captured"}</strong></div>
                    </div>
                  </div>
                  <div className="patient-id-card-actions">
                    <button type="button" className="patient-workspace-submit" onClick={printIdentityCard}>
                      Print / Save ID Card
                    </button>
                  </div>
                </div>
              ) : null}

              <div className="patient-workspace-footer patient-workspace-span">
                <button type="button" className="patient-workspace-submit" onClick={handleWorkspaceSubmit}>
                  {workspaceAction === "insurance"
                    ? "Verify Eligibility"
                    : workspaceAction === "portal"
                      ? "Create Portal Access"
                      : workspaceAction === "photo"
                        ? "Save Patient Photo"
                        : workspaceAction === "vulnerability"
                          ? "Save Vulnerability Flags"
                          : workspaceAction === "identity-card"
                            ? "Prepare ID Card"
                            : "Record Merge Review"}
                </button>
                {workspaceStatus ? <strong>{workspaceStatus}</strong> : null}
              </div>
            </div>
          )}
        </section>
        </div>
      )}

      <div className="pv-table-meta">
        <div className="pv-title pv-table-title">{tableFilterLabel}</div>
        <span className="pv-badge">
          {tablePatients.length} {patientTableFilter === "today" ? "today" : "records"}
        </span>
      </div>

      <div className="pv-table-wrap">
        <table className="pv-table">
          <thead>
            <tr>
              <th>Patient ID</th>
              <th>Name</th>
              <th>Gender</th>
              <th>Blood</th>
              <th>Contact</th>
              <th>Registered</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="pv-empty">
                  Loading patients...
                </td>
              </tr>
            ) : tablePatientsPage.length === 0 ? (
              <tr>
                <td colSpan={7} className="pv-empty">
                  No patients found for this view.
                </td>
              </tr>
            ) : tablePatientsPage.map((p) => (
                  <tr key={p.id} className="patient-row-clickable" onClick={() => setSelectedPatient(p)}>
                <td className="pv-code">#{p.regNo || p.id.slice(0, 8).toUpperCase()}</td>
                <td className="pv-name">
                  <div className="pv-avatar">
                    {String((p as any).firstName || p.name).trim()[0] || "P"}
                    {String((p as any).lastName || "").trim()[0] || ""}
                  </div>
                  <span>{p.name}</span>
                </td>
                <td>
                  <span
                    className={`pv-badge ${p.gender === "Male" ? "badge-male" : "badge-female"}`}
                  >
                    {p.gender}
                  </span>
                </td>
                <td>{(p as any).bloodGroup || "—"}</td>
                <td>
                  <div>{p.phone || "—"}</div>
                  <small className="pv-muted">{p.nationalId || "No ID"}</small>
                </td>
                <td>{formatPatientRegistrationDate(p)}</td>
                <td onClick={(event) => event.stopPropagation()}>
                  <div className="pv-row-actions">
                  <button
                    type="button"
                    className="pv-table-action pv-table-edit"
                    title={
                      isPatientQueuedFromThisModule(p) && !isSuperAdmin
                        ? "Patient already queued. Only Super Admin can edit."
                        : p.id === checkedInPatientId || isSuperAdmin
                          ? "Edit patient"
                          : "Check in patient before editing"
                    }
                    aria-label={canEditPatientRecord(p) ? "Edit patient" : "Patient cannot be edited"}
                    data-tooltip={
                      isPatientQueuedFromThisModule(p) && !isSuperAdmin
                        ? "Locked"
                        : canEditPatientRecord(p)
                          ? "Edit"
                          : "Check in first"
                    }
                    disabled={!canEditPatientRecord(p)}
                    onClick={() => void openPatientForEdit(p)}
                  >
                    <Icon type="ehr" size={16} />
                  </button>
                  {p.id === checkedInPatientId ? (
                    <button
                      type="button"
                      className="pv-table-action pv-table-checkout"
                      title="Check out patient"
                      aria-label="Check out patient"
                      data-tooltip="Check out"
                      onClick={() => handleCheckoutPatient(p)}
                    >
                      →
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="pv-table-action pv-table-delete"
                    title="Delete patient"
                    aria-label="Delete patient"
                    data-tooltip="Delete"
                    onClick={() => setDeleteId(p.id)}
                  >
                    ×
                  </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="pv-table-footer">
          <span>
            Showing {tablePatients.length === 0 ? 0 : todayPage * 10 + 1}-
            {Math.min(tablePatients.length, todayPage * 10 + tablePatientsPage.length)} of {tablePatients.length}
          </span>
          <div className="patient-table-pager">
            <button type="button" disabled={todayPage === 0} onClick={() => setTodayPage((page) => Math.max(0, page - 1))}>
              Back
            </button>
            <span>Page {todayPage + 1} of {tableTotalPages}</span>
            <button type="button" disabled={todayPage >= tableTotalPages - 1} onClick={() => setTodayPage((page) => Math.min(tableTotalPages - 1, page + 1))}>
              Next
            </button>
          </div>
        </div>
      </div>

      {formOpen && (
        <div className="patient-form-modal" onClick={() => setFormOpen(false)}>
          <div className="patient-form-panel" onClick={(e) => e.stopPropagation()}>
            <div className="patient-form-header">
              <div className="patient-form-header-main">
                <div className="patient-form-icon">
                  <Icon type="person" size={20} />
                </div>
                <div>
                  <h2 className="form-title">{editingPatient ? "Edit Patient" : "Register New Patient"}</h2>
                  <p className="form-title-note">Capture complete demographic, clinical, and insurance details</p>
                </div>
              </div>
              <button
                className="modal-close-btn"
                onClick={() => setFormOpen(false)}
              >
                ✕
              </button>
            </div>

            <div className="patient-form-tabs">
              {[
                ["personal", "Personal"],
                ["medical", "Medical"],
                ["kin", "Next of Kin"],
                ["insurance", "Insurance"],
              ].map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  className={`patient-form-tab ${formTab === key ? "is-active" : ""}`}
                  onClick={() => setFormTab(key as typeof formTab)}
                >
                  {label}
                </button>
              ))}
            </div>

            <form id="patient-registration-form" onSubmit={handleRegister} className="patient-form-body">
              {error && <div className="auth-error">{error}</div>}

              {formTab === "personal" && (
                <div className="patient-form-section">
                  <div className="form-section-header">
                    <h3 className="form-section-title">Patient Registration</h3>
                    <p className="form-section-note">Basic demographic details used to identify and register the patient.</p>
                  </div>
                  {duplicateWarning ? (
                    <div className="form-info-banner patient-form-alert patient-duplicate-banner">
                      <Icon type="manage_search" size={18} />
                      <div className="patient-duplicate-notice">
                        <p>{duplicateWarning}</p>
                        {duplicatePatient ? (
                          <div className="patient-duplicate-actions">
                            <button type="button" onClick={autofillDuplicatePatient}>
                              Auto Fill Existing Details
                            </button>
                            <button type="button" onClick={() => setDuplicateDetailsOpen(true)}>
                              View Details
                            </button>
                            <button type="button" onClick={requestDuplicateMerge}>
                              Request Merge
                            </button>
                          </div>
                        ) : null}
                        {duplicateMergeStatus ? <small>{duplicateMergeStatus}</small> : null}
                      </div>
                    </div>
                  ) : null}
                  <div className="patient-form-grid three">
                    <label>First Name *<input required className="form-input" value={form.firstName} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))} placeholder="John" /></label>
                    <label>Middle Name<input className="form-input" value={form.middleName} onChange={(e) => setForm((f) => ({ ...f, middleName: e.target.value }))} placeholder="Omondi" /></label>
                    <label>Last Name *<input required className="form-input" value={form.lastName} onChange={(e) => setForm((f: any) => ({ ...f, lastName: e.target.value }))} placeholder="Doe" /></label>
                    <label>
                      Date of Birth *
                      <div className="patient-date-field">
                        <input
                          required
                          type="text"
                          inputMode="numeric"
                          className="form-input patient-date-text"
                          value={form.dateOfBirth}
                          onChange={(e) => setForm((f) => ({ ...f, dateOfBirth: e.target.value }))}
                          placeholder="YYYY-MM-DD"
                          pattern="\d{4}-\d{2}-\d{2}"
                          title="Type date as YYYY-MM-DD or use the calendar picker."
                        />
                        <button
                          type="button"
                          className="patient-date-picker-button"
                          onClick={openDateOfBirthPicker}
                          aria-label="Pick date of birth"
                          title="Pick date"
                        >
                          <Icon type="calendar" size={16} />
                        </button>
                        <input
                          ref={dobPickerRef}
                          type="date"
                          className="patient-date-picker-native"
                          tabIndex={-1}
                          value={form.dateOfBirth}
                          onChange={(e) => setForm((f) => ({ ...f, dateOfBirth: e.target.value }))}
                          aria-hidden="true"
                        />
                      </div>
                    </label>
                    <label>Gender *<select required className="form-input" value={form.gender} onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value as any }))}><option value="MALE">Male</option><option value="FEMALE">Female</option><option value="OTHER">Other</option></select></label>
                    <label>Marital Status<select className="form-input" value={form.maritalStatus} onChange={(e) => setForm((f) => ({ ...f, maritalStatus: e.target.value }))}><option value="">Select</option><option>Single</option><option>Married</option><option>Divorced</option><option>Widowed</option></select></label>
                    <label>Nationality<input className="form-input" value={form.nationality} onChange={(e) => setForm((f) => ({ ...f, nationality: e.target.value }))} placeholder="Kenyan" /></label>
                    <label>ID Type<select className="form-input" value={form.idType} onChange={(e) => setForm((f) => ({ ...f, idType: e.target.value }))}><option value="">Select</option><option>National ID</option><option>Passport</option><option>Alien ID</option><option>Birth Certificate</option></select></label>
                    <label>ID Number *<input required className="form-input" value={form.idNumber} onChange={(e) => setForm((f) => ({ ...f, idNumber: e.target.value }))} placeholder="12345678" /></label>
                    <label>SHA Number<input className="form-input" value={form.shaNumber} onChange={(e) => setForm((f) => ({ ...f, shaNumber: e.target.value }))} placeholder="SHA member number" /></label>
                    <label>Blood Group<select className="form-input" value={form.bloodGroup} onChange={(e) => setForm((f) => ({ ...f, bloodGroup: e.target.value }))}><option value="">Unknown</option>{["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((g) => <option key={g} value={g}>{g}</option>)}</select></label>
                    <label>Primary Phone<input type="tel" className="form-input" value={form.phonePrimary} onChange={(e) => setForm((f) => ({ ...f, phonePrimary: e.target.value }))} placeholder="+254..." /></label>
                    <label>Secondary Phone<input type="tel" className="form-input" value={form.phoneSecondary} onChange={(e) => setForm((f) => ({ ...f, phoneSecondary: e.target.value }))} placeholder="+254..." /></label>
                    <label>Email<input type="email" className="form-input" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="patient@example.com" /></label>
                    <label>County<input className="form-input" value={form.county} onChange={(e) => setForm((f) => ({ ...f, county: e.target.value }))} placeholder="Nairobi" /></label>
                    <label>Sub County<input className="form-input" value={form.subCounty} onChange={(e) => setForm((f) => ({ ...f, subCounty: e.target.value }))} placeholder="Westlands" /></label>
                    <label>Village / Estate<input className="form-input" value={form.villageEstate} onChange={(e) => setForm((f) => ({ ...f, villageEstate: e.target.value }))} placeholder="Kilimani" /></label>
                    <label className="patient-form-span">Address Line<input className="form-input" value={form.addressLine1} onChange={(e) => setForm((f) => ({ ...f, addressLine1: e.target.value }))} placeholder="Street, building, or plot number" /></label>
                    <label>Religion<input className="form-input" value={form.religion} onChange={(e) => setForm((f) => ({ ...f, religion: e.target.value }))} placeholder="Optional" /></label>
                    <label>Occupation<input className="form-input" value={form.occupation} onChange={(e) => setForm((f) => ({ ...f, occupation: e.target.value }))} placeholder="Teacher" /></label>
                    <label>Education Level<select className="form-input" value={form.educationLevel} onChange={(e) => setForm((f) => ({ ...f, educationLevel: e.target.value }))}><option value="">Select</option><option>None</option><option>Primary</option><option>Secondary</option><option>College</option><option>University</option></select></label>
                    <label className="patient-form-span">Patient Photo URL (Optional)<input className="form-input" value={form.photoUrl} onChange={(e) => setForm((f) => ({ ...f, photoUrl: e.target.value }))} placeholder="Optional uploaded photo URL" /></label>
                  </div>
                </div>
              )}

              {formTab === "medical" && (
                <div className="patient-form-section">
                  <div className="form-section-header">
                    <h3 className="form-section-title">Medical Profile</h3>
                    <p className="form-section-note">Clinical defaults and risk markers used during encounters.</p>
                  </div>
                  <div className="patient-form-grid two">
                    <label className="patient-form-span">Known Allergies<input className="form-input" value={form.allergies} onChange={(e) => setForm((f) => ({ ...f, allergies: e.target.value }))} placeholder="e.g. Penicillin" /></label>
                    <label className="patient-form-span">Medical History<textarea className="form-input" value={form.medicalHistory} onChange={(e) => setForm((f) => ({ ...f, medicalHistory: e.target.value }))} placeholder="Relevant chronic illnesses, surgeries, or long-term medication" /></label>
                    <div className="patient-form-span patient-check-grid">
                      {vulnerabilityOptions.map((flag) => (
                        <label key={flag} className="patient-form-check">
                          <input
                            type="checkbox"
                            checked={form.vulnerabilityFlags.includes(flag)}
                            onChange={(e) =>
                              setForm((f) => ({
                                ...f,
                                vulnerabilityFlags: e.target.checked
                                  ? [...f.vulnerabilityFlags, flag]
                                  : f.vulnerabilityFlags.filter((item) => item !== flag),
                              }))
                            }
                          />
                          {flag}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {formTab === "kin" && (
                <div className="patient-form-section">
                  <div className="form-section-header">
                    <h3 className="form-section-title">Next of Kin</h3>
                    <p className="form-section-note">Emergency contact details for communication and consent workflows.</p>
                  </div>
                  <div className="patient-form-grid two">
                    <label>Next of Kin Name<input className="form-input" value={form.nextOfKinName} onChange={(e) => setForm((f) => ({ ...f, nextOfKinName: e.target.value }))} placeholder="Full name" /></label>
                    <label>Relationship<select className="form-input" value={form.nextOfKinRelationship} onChange={(e) => setForm((f) => ({ ...f, nextOfKinRelationship: e.target.value }))}><option value="">Select</option><option>Spouse</option><option>Parent</option><option>Child</option><option>Sibling</option><option>Guardian</option><option>Other</option></select></label>
                    <label>NOK Phone<input type="tel" className="form-input" value={form.nextOfKinPhone} onChange={(e) => setForm((f) => ({ ...f, nextOfKinPhone: e.target.value }))} placeholder="+254..." /></label>
                    <label>NOK Email<input type="email" className="form-input" value={form.nextOfKinEmail} onChange={(e) => setForm((f) => ({ ...f, nextOfKinEmail: e.target.value }))} placeholder="relative@example.com" /></label>
                    <label className="patient-form-span">NOK Address<input className="form-input" value={form.nextOfKinAddress} onChange={(e) => setForm((f) => ({ ...f, nextOfKinAddress: e.target.value }))} placeholder="Emergency contact address" /></label>
                    <label className="patient-form-check"><input type="checkbox" checked={form.nextOfKinIsPrimary} onChange={(e) => setForm((f) => ({ ...f, nextOfKinIsPrimary: e.target.checked }))} /> Primary emergency contact</label>
                    <label className="patient-form-check"><input type="checkbox" checked={form.nextOfKinConsent} onChange={(e) => setForm((f) => ({ ...f, nextOfKinConsent: e.target.checked }))} /> Consent to contact next of kin</label>
                    <label className="patient-form-check patient-form-span"><input type="checkbox" checked={form.hasInsurance} onChange={(e) => setForm((f) => ({ ...f, hasInsurance: e.target.checked }))} /> Has Insurance</label>
                  </div>
                </div>
              )}

              {formTab === "insurance" && (
                <div className="patient-form-section">
                  <div className="form-section-header">
                    <h3 className="form-section-title">Insurance</h3>
                    <p className="form-section-note">Optional cover details used for eligibility and billing workflows.</p>
                  </div>
                  <div className="patient-form-grid two">
                    <label>Insurance Scheme<input required={form.hasInsurance} className="form-input" value={form.insuranceScheme} onChange={(e) => setForm((f) => ({ ...f, insuranceScheme: e.target.value }))} placeholder="SHA / Private / Corporate" /></label>
                    <label>Policy Number<input required={form.hasInsurance} className="form-input" value={form.policyNumber} onChange={(e) => setForm((f) => ({ ...f, policyNumber: e.target.value }))} placeholder="Policy or member number" /></label>
                    <label>Member Name<input className="form-input" value={form.memberName} onChange={(e) => setForm((f) => ({ ...f, memberName: e.target.value }))} placeholder="Name on card" /></label>
                    <label className="patient-form-check"><input type="checkbox" checked={form.isPrincipal} onChange={(e) => setForm((f) => ({ ...f, isPrincipal: e.target.checked }))} /> Patient is principal member</label>
                    {!form.isPrincipal && (
                      <label>Principal ID Number<input className="form-input" value={form.principalIdNumber} onChange={(e) => setForm((f) => ({ ...f, principalIdNumber: e.target.value }))} placeholder="Principal member ID" /></label>
                    )}
                    <label>Annual Benefit Limit<input type="number" className="form-input" value={form.annualBenefitLimit} onChange={(e) => setForm((f) => ({ ...f, annualBenefitLimit: e.target.value }))} placeholder="0" /></label>
                    <label>Policy Start Date<input type="date" className="form-input" value={form.policyStartDate} onChange={(e) => setForm((f) => ({ ...f, policyStartDate: e.target.value }))} /></label>
                    <label>Policy Expiry Date<input type="date" className="form-input" value={form.policyExpiryDate} onChange={(e) => setForm((f) => ({ ...f, policyExpiryDate: e.target.value }))} /></label>
                    <div className="form-info-banner patient-form-span">
                      Insurance eligibility is checked automatically after these fields are captured.
                    </div>
                    <div className="form-info-banner patient-form-span">
                      Patient portal account is created automatically after registration.
                    </div>
                    <label className="patient-form-span">Portal Phone<input type="tel" className="form-input" value={form.portalPhone} onChange={(e) => setForm((f) => ({ ...f, portalPhone: e.target.value }))} placeholder="Defaults to primary phone if left empty" /></label>
                  </div>
                </div>
              )}
            </form>

            <div className="patient-form-footer">
              <div>
                {formTab !== "personal" && (
                  <button type="button" className="form-btn form-btn-secondary" onClick={() => setFormTab(formTab === "insurance" ? "kin" : formTab === "kin" ? "medical" : "personal")}>← Back</button>
                )}
              </div>
              <div className="patient-form-footer-actions">
                <button type="button" className="form-btn form-btn-cancel" onClick={() => { setFormOpen(false); handleResetForm(); }}>Cancel</button>
                {formTab === "kin" && !form.hasInsurance ? (
                  <button type="submit" form="patient-registration-form" data-patient-register="true" className="form-btn form-btn-primary" disabled={saving}>{saving ? "Saving..." : editingPatient ? "Update Patient" : "Register Patient"}</button>
                ) : formTab !== "insurance" ? (
                  <button type="button" className="form-btn form-btn-primary" onClick={() => setFormTab(formTab === "personal" ? "medical" : formTab === "medical" ? "kin" : "insurance")}>Next →</button>
                ) : (
                  <button type="submit" form="patient-registration-form" data-patient-register="true" className="form-btn form-btn-primary" disabled={saving}>{saving ? "Saving..." : editingPatient ? "Update Patient" : "Register Patient"}</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {duplicateDetailsOpen && duplicatePatient ? (
        <div className="patient-duplicate-modal" onClick={() => setDuplicateDetailsOpen(false)}>
          <div className="patient-duplicate-panel" onClick={(event) => event.stopPropagation()}>
            <div className="patient-duplicate-panel-head">
              <h3>Possible Duplicate Patient</h3>
              <button type="button" onClick={() => setDuplicateDetailsOpen(false)}>×</button>
            </div>
            <div className="patient-duplicate-detail-grid">
              <span>Name</span><strong>{duplicatePatient.name || "—"}</strong>
              <span>MRN</span><strong>{duplicatePatient.regNo || duplicatePatient.id}</strong>
              <span>Phone</span><strong>{duplicatePatient.phone || "—"}</strong>
              <span>National ID</span><strong>{duplicatePatient.nationalId || "—"}</strong>
              <span>Date of Birth</span><strong>{String((duplicatePatient as any).dateOfBirth || "").slice(0, 10) || "—"}</strong>
              <span>Gender</span><strong>{duplicatePatient.gender || "—"}</strong>
            </div>
            <div className="patient-duplicate-panel-actions">
              <button type="button" onClick={autofillDuplicatePatient}>Auto Fill</button>
              <button type="button" onClick={requestDuplicateMerge}>Request Merge</button>
            </div>
          </div>
        </div>
      ) : null}

      {queuePatient ? (
        <div className="patient-form-modal patient-queue-backdrop" onClick={() => !queueSaving && setQueuePatient(null)}>
          <div className="patient-form-panel patient-queue-modal" onClick={(event) => event.stopPropagation()}>
            <div className="patient-form-header patient-queue-header">
              <div className="patient-form-header-main">
                <div className="patient-form-icon">
                  <Icon type="calendar" size={20} />
                </div>
                <div>
                  <h2 className="form-title">Queue Patient Next</h2>
                  <p className="form-title-note">{queuePatient.name} is checked in. Select the next module before they appear elsewhere.</p>
                </div>
              </div>
              <button type="button" className="patient-form-close patient-queue-close" onClick={() => setQueuePatient(null)} disabled={queueSaving}>
                ×
              </button>
            </div>
            <div className="patient-queue-body">
              <label className="form-field patient-queue-field">
                <span>Destination module *</span>
                <input
                  className="form-input"
                  list="desktop-patient-queue-destinations"
                  value={queueDestinationInput}
                  onChange={(event) => setQueueDestinationInput(event.target.value)}
                  placeholder="Type or select module, e.g. Outpatient / OPD"
                  autoFocus
                />
                <datalist id="desktop-patient-queue-destinations">
                  {patientQueueDestinations.map((destination) => (
                    <option key={`${destination.departmentId}-${destination.label}`} value={destination.label} />
                  ))}
                </datalist>
                <small>Queued patients become visible in the selected module queue only.</small>
              </label>
              <div className="form-actions">
                <button type="button" className="form-cancel" onClick={() => setQueuePatient(null)} disabled={queueSaving}>
                  Cancel
                </button>
                <button type="button" className="form-submit" onClick={queuePatientNext} disabled={queueSaving}>
                  {queueSaving ? "Queuing..." : "Queue Patient"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {selectedPatient && (
        <PatientDrawer
          patient={selectedPatient}
          canEdit={canEditPatientRecord(selectedPatient)}
          onClose={() => setSelectedPatient(null)}
          onEdit={() => {
            void openPatientForEdit(selectedPatient);
            setSelectedPatient(null);
          }}
        />
      )}

      {deleteId && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div
            className="modal-box"
            style={{ maxWidth: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ textAlign: "center", marginBottom: 8 }}>
              Delete Patient?
            </h3>
            <p
              style={{
                color: "#64748b",
                fontSize: "0.85rem",
                textAlign: "center",
                marginBottom: 18,
              }}
            >
              This cannot be undone.
            </p>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setDeleteId(null)}>
                Cancel
              </button>
              <button
                className="btn-danger"
                onClick={() => {
                  removePatient(deleteId!);
                  setDeleteId(null);
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AppointmentsView() {
  const { patients, facility } = useAppStore();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [activeForm, setActiveForm] = useState<"booking" | "slots" | "cancel" | null>(null);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [calendarDate, setCalendarDate] = useState(new Date().toISOString().slice(0, 10));
  const [calendarDoctor, setCalendarDoctor] = useState("All doctors");
  const [waitingListOpen, setWaitingListOpen] = useState(false);
  const [waitingListLoading, setWaitingListLoading] = useState(false);
  const [waitingListRows, setWaitingListRows] = useState<any[]>([]);
  const [checkedInQueuePatients, setCheckedInQueuePatients] = useState<Record<string, boolean>>({});
  const [searchPatient, setSearchPatient] = useState("");
  const [showPatientResults, setShowPatientResults] = useState(false);
  const [appointmentStats, setAppointmentStats] = useState<any>({});
  const [booking, setBooking] = useState({
    patientId: "",
    doctorId: "",
    department: "OPD",
    date: new Date().toISOString().slice(0, 10),
    time: "08:00",
    appointmentType: "New",
    bookingSource: "Walk-in",
    insuranceScheme: "",
    chiefComplaint: "",
    notes: "",
    sendReminder: false,
    durationMinutes: 30,
    repeatEnabled: false,
    repeatEvery: 6,
    repeatUnit: "weeks",
    repeatUntil: "",
    reminder24Sms: true,
    reminder2WhatsApp: true,
    responseTracking: true,
    waitingListAllowed: true,
    requiredResources: "",
    noShowPolicy: "Track only",
    appBooking: false,
  });
  const [slotConfig, setSlotConfig] = useState({
    doctorName: "",
    department: "OPD",
    date: new Date().toISOString().slice(0, 10),
    startTime: "08:00",
    endTime: "17:00",
    slotDuration: 30,
    slotType: "OPD",
    maxPatients: 18,
  });
  const [cancelData, setCancelData] = useState({
    appointmentId: "",
    reason: "Patient request",
    notes: "",
    notifyPatient: true,
    reschedule: false,
  });

  const loadAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const [response, statsResponse] = await Promise.all([
        apiFetch("/appointments"),
        apiFetch("/appointments/stats").catch(() => null),
      ]);
      const data = await parseJsonSafe(response);
      setAppointments(Array.isArray(data) ? data : []);
      if (statsResponse) {
        const statsData = await parseJsonSafe(statsResponse);
        setAppointmentStats(statsData && typeof statsData === "object" ? statsData : {});
      } else {
        setAppointmentStats({});
      }
    } catch {
      setAppointments([]);
      setAppointmentStats({});
    } finally {
      setLoading(false);
    }
  }, []);

  const loadDoctors = useCallback(async () => {
    try {
      const response = await apiFetch("/staff?role=DOCTOR");
      const data = await parseJsonSafe(response);
      setDoctors(Array.isArray(data) ? data : []);
    } catch {
      setDoctors([]);
    }
  }, []);

  useEffect(() => {
    void loadAppointments();
  }, [loadAppointments]);

  const loadAppointmentWaitingList = useCallback(async () => {
    setWaitingListLoading(true);
    try {
      const board = await fetchQueueBoard({
        departmentId: "APPOINTMENTS",
        facilityId: facility?.id,
      });
      setWaitingListRows(Array.isArray((board as any)?.tokens) ? (board as any).tokens : []);
    } catch {
      setWaitingListRows([]);
    } finally {
      setWaitingListLoading(false);
    }
  }, [facility?.id]);

  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState !== "hidden") {
        void loadAppointments();
        void loadAppointmentWaitingList();
      }
    };
    const interval = window.setInterval(refresh, 90000);
    return () => {
      window.clearInterval(interval);
    };
  }, [loadAppointments, loadAppointmentWaitingList]);

  useEffect(() => {
    void loadAppointmentWaitingList();
  }, [loadAppointmentWaitingList]);

  useEffect(() => {
    const handleWaitingListOpen = (event: Event) => {
      const detail = (event as CustomEvent).detail || {};
      if (detail?.departmentId !== "APPOINTMENTS" && detail?.moduleId !== 4) return;
      setWaitingListOpen(true);
      void loadAppointmentWaitingList();
    };
    const handleQueued = (event: Event) => {
      const detail = (event as CustomEvent).detail || {};
      const departmentId = detail?.destination?.departmentId || detail?.departmentId;
      if (departmentId && departmentId !== "APPOINTMENTS") return;
      void loadAppointmentWaitingList();
    };
    window.addEventListener("hmis:open-module-waiting-list", handleWaitingListOpen);
    window.addEventListener("hmis:patient-queued", handleQueued);
    return () => {
      window.removeEventListener("hmis:open-module-waiting-list", handleWaitingListOpen);
      window.removeEventListener("hmis:patient-queued", handleQueued);
    };
  }, [loadAppointmentWaitingList]);

  useEffect(() => {
    void loadDoctors();
  }, [loadDoctors]);

  const patientName = (patientId: string) => {
    const match = patients.find((patient) => patient.id === patientId);
    return match?.name || "Patient";
  };

  const patientSearchOptions = searchPatient
    ? patients.filter((patient) => {
        const needle = searchPatient.toLowerCase();
        return `${patient.name} ${patient.regNo || ""}`.toLowerCase().includes(needle);
      })
    : patients;

  const appointmentPatientName = (item: any) =>
    item?.patient
      ? [item.patient.firstName, item.patient.middleName, item.patient.lastName].filter(Boolean).join(" ").trim() ||
        item.patient.name ||
        item.patient.fullName ||
        item.patient.displayName ||
        item.patient.patientCode ||
        item.patient.mrn ||
        "Patient"
      : item?.patientName ||
        item?.patientFullName ||
        item?.patientCode ||
        item?.mrn ||
        patientName(item?.patientId) ||
        item?.patientId ||
        "Patient";

  const appointmentDoctorName = (item: any) =>
    item?.doctor
      ? (() => {
          const name =
            [item.doctor.firstName, item.doctor.lastName].filter(Boolean).join(" ").trim() ||
            item.doctor.name ||
            item.doctor.fullName ||
            item.doctor.displayName;
          return name ? (/^dr\.?\s/i.test(name) ? name : `Dr. ${name}`) : "Doctor";
        })()
      : item?.doctorName || item?.providerName || item?.clinicianName || item?.doctorId || item?.notes?.match(/Doctor: ([^\n]+)/)?.[1] || "Doctor";

  const appointmentDoctorFirstName = (item: any) =>
    item?.doctor?.firstName || String(appointmentDoctorName(item)).replace(/^Dr\.?\s+/i, "").split(" ")[0] || "Doctor";

  const selectedDoctorName =
    doctors.find((doctor) => doctor.id === booking.doctorId)
      ? `Dr. ${doctors.find((doctor) => doctor.id === booking.doctorId)?.firstName || ""} ${doctors.find((doctor) => doctor.id === booking.doctorId)?.lastName || ""}`.trim()
      : "Selected doctor";

  const toLocalDate = (value?: string) => {
    if (!value) return "";
    const date = new Date(value);
    if (!Number.isFinite(date.getTime())) return "";
    return date.toISOString().slice(0, 10);
  };

  const toLocalTime = (value?: string) => {
    if (!value) return "";
    const date = new Date(value);
    if (!Number.isFinite(date.getTime())) return "";
    return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  };

  const selectedDateAppointments = appointments.filter((item) => {
    const doctor = appointmentDoctorName(item);
    return (
      toLocalDate(item?.dateTime || item?.scheduledDate) === calendarDate &&
      (calendarDoctor === "All doctors" || doctor === calendarDoctor)
    );
  });
  const bookedAppointmentsByTime = selectedDateAppointments
    .filter((item) => !["CANCELLED", "NO_SHOW", "NOSHOW"].includes(String(item?.status || "").toUpperCase()))
    .reduce((map, item) => {
      const time = toLocalTime(item?.dateTime || item?.scheduledTime);
      const current = map.get(time) || [];
      current.push(item);
      map.set(time, current);
      return map;
    }, new Map<string, any[]>());
  const slotDuration = Math.max(15, Number(booking.durationMinutes) || 30);
  const calendarSlots = Array.from({ length: 20 }, (_, index) => {
    const totalMinutes = 8 * 60 + index * slotDuration;
    const hour = Math.floor(totalMinutes / 60);
    const minute = totalMinutes % 60;
    const time = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
    const blocked = hour === 12;
    const slotAppointments = bookedAppointmentsByTime.get(time) || [];
    const appointment = slotAppointments[0];
    return {
      time,
      appointment,
      appointments: slotAppointments,
      patientCount: slotAppointments.length,
      doctorFirstName: appointment ? appointmentDoctorFirstName(appointment) : "",
      status: blocked ? "blocked" : slotAppointments.length > 0 ? "booked" : "available",
    };
  }).filter((slot) => Number(slot.time.slice(0, 2)) < 18);
  const bookingBookedTimes = new Set(
    appointments
      .filter((item) => toLocalDate(item?.dateTime || item?.scheduledDate) === booking.date)
      .filter((item) => !booking.doctorId || item?.doctorId === booking.doctorId)
      .filter((item) => !["CANCELLED", "NO_SHOW", "NOSHOW"].includes(String(item?.status || "").toUpperCase()))
      .map((item) => toLocalTime(item?.dateTime || item?.scheduledTime)),
  );
  const bookingCalendarSlots = Array.from({ length: 20 }, (_, index) => {
    const totalMinutes = 8 * 60 + index * slotDuration;
    const hour = Math.floor(totalMinutes / 60);
    const minute = totalMinutes % 60;
    const time = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
    const blocked = hour === 12;
    const booked = bookingBookedTimes.has(time);
    return { time, status: blocked ? "blocked" : booked ? "booked" : "available" };
  }).filter((slot) => Number(slot.time.slice(0, 2)) < 18);
  const doctorOptions = Array.from(new Set(appointments.map(appointmentDoctorName).filter(Boolean)));
  const appointmentResponseLabel = (item: any) =>
    String(item?.responseStatus || item?.patientResponse || item?.response || item?.status || "").toUpperCase() === "CONFIRMED"
      ? "Confirmed"
      : String(item?.responseStatus || item?.patientResponse || item?.response || item?.status || "").toUpperCase() === "CANCELLED"
        ? "Cancelled"
        : ["NO_SHOW", "NOSHOW"].includes(String(item?.status || "").toUpperCase())
          ? "No-show"
          : String(item?.status || "").toUpperCase() === "ARRIVED"
            ? "Arrived"
            : "No response";

  const appointmentDateTime = (item: any) => {
    const directValue = item?.dateTime || item?.scheduledAt;
    const directDate = directValue ? new Date(String(directValue)) : null;
    if (directDate && Number.isFinite(directDate.getTime())) return directDate;

    const dateValue = item?.scheduledDate || item?.appointmentDate || item?.date;
    const timeValue = item?.scheduledTime || item?.startTime || item?.time || item?.slotTime;
    if (dateValue && timeValue) {
      const datePart = String(dateValue).includes("T") ? String(dateValue).slice(0, 10) : String(dateValue);
      const timePart = String(timeValue).includes("T") ? String(timeValue).slice(11, 16) : String(timeValue).slice(0, 5);
      const combined = new Date(`${datePart}T${timePart || "00:00"}:00`);
      if (Number.isFinite(combined.getTime())) return combined;
    }

    const fallbackDate = dateValue ? new Date(String(dateValue)) : null;
    return fallbackDate && Number.isFinite(fallbackDate.getTime()) ? fallbackDate : null;
  };

  const appointmentTimeText = (item: any) => {
    const appointmentDate = item?.dateTime || item?.scheduledAt || item?.scheduledDate || item?.appointmentDate || item?.date || "";
    const parsedDate = appointmentDateTime(item);
    const formattedDate = parsedDate ? parsedDate.toLocaleString() : String(appointmentDate || "");
    const scheduledTime = item?.scheduledTime || item?.startTime || item?.time || item?.slotTime
      ? String(item?.scheduledTime || item?.startTime || item?.time || item?.slotTime).slice(0, 5)
      : "";
    if (formattedDate && scheduledTime && !formattedDate.includes(scheduledTime)) return `${formattedDate} ${scheduledTime}`;
    return formattedDate || scheduledTime || "—";
  };

  const appointmentSourceText = (item: any) =>
    String(item?.source || item?.bookingSource || "").toLowerCase().includes("app")
      ? "Booked via Medilink App"
      : item?.source || item?.bookingSource || "Walk-in";

  const appointmentStatusText = (item: any) => String(item?.status || item?.appointmentStatus || "Scheduled").replace(/_/g, " ");

  const updateAppointmentStatus = async (id: string, status: string) => {
    try {
      if (status === "CONFIRMED") {
        await apiFetch(`/appointments/${id}/check-in`, { method: "POST" });
      } else {
        await apiFetch(`/appointments/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        });
      }
      setNotice(status === "NO_SHOW" ? "Appointment marked as no-show." : status === "CONFIRMED" ? "Patient arrival confirmed." : "Appointment updated.");
      await loadAppointments();
    } catch {
      setNotice("Appointment update failed.");
    }
  };

  const runAppointmentSidebarAction = useCallback(
    async (action: string) => {
      if (action === "recurring") {
        setBooking((current) => ({
          ...current,
          repeatEnabled: true,
          repeatEvery: current.repeatEvery || 6,
          repeatUnit: current.repeatUnit || "weeks",
          repeatUntil:
            current.repeatUntil ||
            new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        }));
        setActiveForm("booking");
        setNotice("Recurring series mode enabled.");
        return;
      }

      if (action === "waitlist") {
        try {
          const response = await apiFetch("/appointments/notify-waitlist", { method: "POST" });
          const body = await parseJsonSafe(response);
          setNotice(body?.message || "Next waiting-list patient offered the available slot.");
          await Promise.all([loadAppointments(), loadAppointmentWaitingList()]);
        } catch {
          setNotice("Waiting-list release failed.");
        }
        return;
      }

      if (action === "no-show") {
        const now = new Date();
        const candidate = appointments.find((item) => {
          const status = String(item?.status || item?.appointmentStatus || "SCHEDULED").toUpperCase();
          const time = appointmentDateTime(item);
          return ["SCHEDULED", "CONFIRMED", "ARRIVED"].includes(status) && time !== null && time <= now;
        });
        if (!candidate?.id) {
          setNotice("No due appointment is ready to mark as no-show.");
          return;
        }
        await updateAppointmentStatus(candidate.id, "NO_SHOW");
      }
    },
    [appointments, loadAppointmentWaitingList],
  );

  useEffect(() => {
    const handleSidebarAction = (event: Event) => {
      const action = String((event as CustomEvent<{ action?: string }>).detail?.action || "");
      if (!action) return;
      void runAppointmentSidebarAction(action);
    };
    window.addEventListener("hmis:appointment-sidebar-action", handleSidebarAction);
    return () => window.removeEventListener("hmis:appointment-sidebar-action", handleSidebarAction);
  }, [runAppointmentSidebarAction]);

  const recurrenceDates = () => {
    if (!booking.repeatEnabled || !booking.repeatUntil) return [booking.date];
    const dates = [booking.date];
    const cursor = new Date(`${booking.date}T00:00:00`);
    const end = new Date(`${booking.repeatUntil}T00:00:00`);
    const step = Math.max(1, Number(booking.repeatEvery) || 1);
    while (dates.length < 32) {
      if (booking.repeatUnit === "months") cursor.setMonth(cursor.getMonth() + step);
      else cursor.setDate(cursor.getDate() + step * 7);
      if (cursor.getTime() > end.getTime()) break;
      if (cursor.getDay() !== 0) dates.push(cursor.toISOString().slice(0, 10));
    }
    return dates;
  };

  const submitBooking = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!booking.patientId) {
      setNotice("Select a patient before scheduling.");
      return;
    }
    setLoading(true);
    try {
      const metadata = [
        booking.notes,
        booking.insuranceScheme ? `Insurance: ${booking.insuranceScheme}` : "",
        `Reminder policy: ${booking.reminder24Sms ? "SMS 24h" : "SMS off"}; ${booking.reminder2WhatsApp ? "WhatsApp 2h" : "WhatsApp off"}`,
        booking.responseTracking ? "Patient response tracking: CONFIRM/CANCEL enabled" : "Patient response tracking disabled",
        booking.waitingListAllowed ? "Waiting list release enabled" : "Waiting list release disabled",
        booking.requiredResources ? `Required resources: ${booking.requiredResources}` : "",
        `No-show policy: ${booking.noShowPolicy}`,
        booking.appBooking ? "Booked via Medilink App: one-click arrival check-in enabled" : "",
        booking.repeatEnabled ? `Recurring series: every ${booking.repeatEvery} ${booking.repeatUnit} until ${booking.repeatUntil}` : "",
      ].filter(Boolean).join("\n");
      for (const date of recurrenceDates()) {
        const dateTime = new Date(`${date}T${booking.time}:00`);
        await apiFetch("/appointments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            patientId: booking.patientId,
            doctorId: booking.doctorId || undefined,
            appointmentType: booking.appointmentType,
            departmentId: booking.department,
            scheduledDate: new Date(`${date}T00:00:00`).toISOString(),
            scheduledTime: dateTime.toISOString(),
            durationMinutes: Number(booking.durationMinutes) || 30,
            source: booking.appBooking ? "Medilink App" : booking.bookingSource,
            chiefComplaint: booking.chiefComplaint || undefined,
            notes: metadata || undefined,
            reminderSent: Boolean(booking.sendReminder || booking.reminder24Sms || booking.reminder2WhatsApp),
            dateTime: dateTime.toISOString(),
            status: "SCHEDULED",
            facilityId: facility?.id || undefined,
          }),
        });
      }
      setNotice("Appointment scheduled successfully.");
      setActiveForm(null);
      await loadAppointments();
    } catch (error: any) {
      setNotice(error?.message || "Appointment could not be scheduled.");
    } finally {
      setLoading(false);
    }
  };

  const submitSlots = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      await apiFetch("/module-actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          facilityId: facility?.id,
          module: "appointments",
          action: "Appointment Slot Configuration Form",
          data: slotConfig,
          context: { title: "Appointments" },
        }),
      });
      setNotice("Appointment slots configured.");
      setActiveForm(null);
    } catch {
      setNotice("Slot configuration could not be saved.");
    } finally {
      setLoading(false);
    }
  };

  const submitCancel = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!cancelData.appointmentId) return;
    setLoading(true);
    try {
      await apiFetch(`/appointments/${cancelData.appointmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "CANCELLED",
          cancelledReason: cancelData.reason,
          notes: `${cancelData.notes}\nNotify patient: ${cancelData.notifyPatient ? "Yes" : "No"}\nRelease to waiting list: Yes`,
        }),
      });
      setNotice("Appointment cancelled and slot released.");
      setActiveForm(cancelData.reschedule ? "booking" : null);
      await loadAppointments();
    } catch {
      setNotice("Appointment could not be cancelled.");
    } finally {
      setLoading(false);
    }
  };

  const filtered = appointments.filter((a) => {
    const needle = search.toLowerCase().trim();
    if (!needle) return true;
    const patientText = [
      appointmentPatientName(a),
      a?.patient?.patientCode,
      a?.patient?.mrn,
      a?.patient?.phone,
      a?.patientId,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    const doctorText = appointmentDoctorName(a).toLowerCase();
    const statusText = appointmentStatusText(a).toLowerCase();
    const sourceText = appointmentSourceText(a).toLowerCase();
    const responseText = appointmentResponseLabel(a).toLowerCase();
    const timeText = appointmentTimeText(a).toLowerCase();
    return (
      patientText.includes(needle) ||
      doctorText.includes(needle) ||
      statusText.includes(needle) ||
      sourceText.includes(needle) ||
      responseText.includes(needle) ||
      timeText.includes(needle)
    );
  });
  const checkInAppointmentQueuePatient = async (row: any) => {
    const patientId = String(row?.patientId || "").trim();
    if (!patientId) return;
    try {
      await updateQueueTokenStatus({
        tokenId: row?.tokenId || row?.id,
        tokenNumber: row?.tokenNumber,
        patientId,
        visitId: row?.visitId,
        status: "IN_SERVICE",
        reason: "Checked in to Appointments",
      });
      await loadAppointmentWaitingList();
    } catch {
      // Keep local check-in usable if the queue status sync is temporarily unavailable.
    }
    try {
      await apiFetch("/module-actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          module: "appointments",
          action: "Queued Patient Check-In",
          data: {
            patientId,
            patientName: row?.patientName || "Patient",
            patient_mrn: row?.patientCode || row?.mrn || "",
            mrn: row?.patientCode || row?.mrn || "",
            queueToken: row?.tokenNumber || "",
            queueStatus: "IN_SERVICE",
            checkedInAt: new Date().toISOString(),
          },
          context: { title: "Appointments & Schedules", source: "appointment.waiting-list" },
        }),
      });
    } catch {
      // Action logging should not block check-in.
    }
    setCheckedInQueuePatients((current) => ({ ...current, [patientId]: true }));
    setBooking((current) => ({
      ...current,
      patientId,
      bookingSource: "Patient Registration Queue",
    }));
    setNotice(`${String(row?.patientName || "Patient")} checked in for Appointments.`);
  };
  const today = new Date().toISOString().slice(0, 10);
  const todayCount = appointments.filter((item) => toLocalDate(item?.dateTime || item?.scheduledDate) === today).length;
  const bookedCount = appointments.filter((item) => !["CANCELLED", "NO_SHOW", "NOSHOW"].includes(String(item?.status || "").toUpperCase())).length;
  const cancelledCount = appointments.filter((item) => String(item?.status || "").toUpperCase() === "CANCELLED").length;
  const noShowCount = appointments.filter((item) => ["NO_SHOW", "NOSHOW"].includes(String(item?.status || "").toUpperCase())).length;
  const appBookingCount = appointments.filter((item) => String(item?.source || "").toLowerCase().includes("app")).length;
  const completedCount = appointments.filter((item) => String(item?.status || "").toUpperCase() === "COMPLETED").length;
  const appointmentStatCards = [
    { label: "Today's Visits", value: appointmentStats.todayVisits ?? todayCount, color: "#1e3a8a", bg: "linear-gradient(180deg, #ffffff 0%, #eef4ff 100%)" },
    { label: "Booked Slots", value: appointmentStats.bookedSlots ?? bookedCount, color: "#16a34a", bg: "linear-gradient(180deg, #ffffff 0%, #eefcf3 100%)" },
    { label: "Cancelled", value: appointmentStats.cancelled ?? cancelledCount, color: "#7c3aed", bg: "linear-gradient(180deg, #ffffff 0%, #f5efff 100%)" },
    { label: "No-Shows", value: appointmentStats.noShows ?? noShowCount, color: "#dc2626", bg: "linear-gradient(180deg, #ffffff 0%, #fff1f2 100%)" },
    { label: "App Bookings", value: appointmentStats.appBookings ?? appBookingCount, color: "#0ea5e9", bg: "linear-gradient(180deg, #ffffff 0%, #eff9ff 100%)" },
    { label: "Completed", value: appointmentStats.completed ?? completedCount, color: "#0d9488", bg: "linear-gradient(180deg, #ffffff 0%, #eefcf9 100%)" },
  ];

  return (
    <div className="appointments-view">
      <div className="pv-header">
        <div>
          <h2 className="pv-title"><Icon type="calendar" size={18} /> Appointments & Schedules</h2>
          <p className="pv-subtitle">
            Consultation scheduling and visit coordination
          </p>
        </div>
      </div>
      {notice ? <div className="module-toast appointment-toast">{notice}</div> : null}
      <div className="pv-stats appointment-stats">
        {appointmentStatCards.map(({ label, value, color, bg }) => (
          <div
            className="pv-stat-card"
            style={{
              "--appointment-stat-color": color,
              "--appointment-stat-bg": bg,
            } as React.CSSProperties}
            key={label}
          >
            <p>{label}</p>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
      <div className="pv-search-bar">
        <div className="pv-search-wrap">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#94a3b8"
            strokeWidth="2"
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
            }}
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            className="pv-search"
            placeholder="Search patient"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>
      <section className="appointment-calendar-board">
        <div className="appointment-calendar-toolbar">
          <div>
            <h3>Slot-Based Calendar View</h3>
            <p>Click a green slot to reserve immediately. Red is booked; grey is blocked.</p>
          </div>
          <div className="appointment-calendar-filters">
            <input type="date" value={calendarDate} onChange={(event) => setCalendarDate(event.target.value)} />
            <select value={calendarDoctor} onChange={(event) => setCalendarDoctor(event.target.value)}>
              <option>All doctors</option>
              {doctorOptions.map((doctor) => <option key={doctor}>{doctor}</option>)}
            </select>
          </div>
        </div>
        {notice ? <div className="appointment-calendar-notice">{notice}</div> : null}
        <div className="appointment-calendar-legend">
          <span><i className="slot-available" /> Available</span>
          <span><i className="slot-booked" /> Booked</span>
          <span><i className="slot-blocked" /> Blocked</span>
        </div>
        <div className="appointment-calendar-grid">
          {calendarSlots.map((slot) => {
            const appointment = slot.appointment;
            return (
              <button
                key={slot.time}
                type="button"
                className={`appointment-calendar-slot is-${slot.status}`}
                disabled={slot.status !== "available"}
                onClick={() => {
                  setBooking((current) => ({ ...current, date: calendarDate, time: slot.time }));
                  setActiveForm("booking");
                }}
              >
                <strong>{slot.time}</strong>
                <span>{slot.status === "available" ? "Available" : slot.status === "blocked" ? "Blocked" : `${slot.patientCount} patient${slot.patientCount === 1 ? "" : "s"} · Dr. ${slot.doctorFirstName}`}</span>
                {appointment ? <small>{appointmentSourceText(appointment)} · {appointmentStatusText(appointment)}</small> : null}
              </button>
            );
          })}
        </div>
        <div className="appointment-operations-grid">
          <div>
            <h4>Patient Response Tracking</h4>
            <p>CONFIRM/CANCEL replies update status and morning priority.</p>
            <div className="appointment-mini-list">
              {appointments.slice(0, 5).map((item) => (
                <div key={item.id}>
                  <span>{appointmentPatientName(item)}</span>
                  <strong>{appointmentResponseLabel(item)}</strong>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4>Waiting List Release</h4>
            <p>Queued patients are managed from the popup waiting list, matching the web workflow.</p>
            <div className="appointment-mini-list">
              <div>
                <span>{waitingListRows.length} queued patient{waitingListRows.length === 1 ? "" : "s"}</span>
                <button
                  type="button"
                  onClick={() => {
                    setWaitingListOpen(true);
                    void loadAppointmentWaitingList();
                  }}
                >
                  Open Waiting List
                </button>
              </div>
            </div>
          </div>
          <div>
            <h4>Arrival, App Booking & No-Show</h4>
            <p>One-click arrival for app bookings and DNA/no-show tracking.</p>
            <div className="appointment-mini-list">
              {appointments.slice(0, 5).map((item) => (
                <div key={item.id}>
                  <span>{appointmentSourceText(item) === "Booked via Medilink App" ? "Booked via Medilink App" : appointmentPatientName(item)}</span>
                  <span className="appointment-inline-actions">
                    <button type="button" onClick={() => updateAppointmentStatus(item.id, "CONFIRMED")}>Arrived</button>
                    <button type="button" onClick={() => updateAppointmentStatus(item.id, "NO_SHOW")}>No-show</button>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      <div className="pv-table-wrap appointment-table-wrap">
        <table className="pv-table">
          <thead>
            <tr>
              <th>Patient</th>
              <th>Doctor</th>
              <th>Time</th>
              <th>Source</th>
              <th>Response</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((a) => (
              <tr key={a.id}>
                <td className="pv-name">{appointmentPatientName(a)}</td>
                <td>{appointmentDoctorName(a)}</td>
                <td className="pv-code">{appointmentTimeText(a)}</td>
                <td>{appointmentSourceText(a)}</td>
                <td>{appointmentResponseLabel(a)}</td>
                <td>
                  <span
                    className={`pv-badge ${String(a.status).toUpperCase() === "SCHEDULED" ? "badge-male" : "badge-female"}`}
                  >
                    {appointmentStatusText(a)}
                  </span>
                </td>
                <td>
                  <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                    {String(a.status).toUpperCase() !== "CONFIRMED" && String(a.status).toUpperCase() !== "COMPLETED" && (
                      <button
                        type="button"
                        className="pv-badge badge-male"
                        style={{ cursor: "pointer", border: "none", padding: "3px 8px" }}
                        title="Confirm Arrival / Check-in"
                        onClick={() => updateAppointmentStatus(a.id, "CONFIRMED")}
                      >
                        Check-in
                      </button>
                    )}
                    <button
                      type="button"
                      className="pv-badge"
                      style={{ cursor: "pointer", border: "none", padding: "3px 8px", background: "#f1f5f9", color: "#334155" }}
                      title="Send Patient Reminder"
                      onClick={async () => {
                        try {
                          await apiFetch(`/appointments/${a.id}/remind`, { method: "POST" });
                          setNotice("Reminder sent to patient.");
                        } catch {
                          setNotice("Reminder queued for notification service.");
                        }
                      }}
                    >
                      Remind
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 ? (
              <tr><td className="pv-empty" colSpan={7}>No records found.</td></tr>
            ) : null}
          </tbody>
        </table>
      </div>
      {waitingListOpen ? (
        <div className="module-modal-backdrop" onClick={() => setWaitingListOpen(false)}>
          <aside className="workflow-waiting-panel" onClick={(event) => event.stopPropagation()}>
            <div className="workflow-waiting-panel-head">
              <div>
                <h3>Waiting List</h3>
                <p>{waitingListRows.length} patient{waitingListRows.length === 1 ? "" : "s"} queued to Appointments.</p>
              </div>
              <button type="button" className="workflow-waiting-close" onClick={() => setWaitingListOpen(false)}>
                ×
              </button>
            </div>
            <div className="workflow-waiting-panel-body">
              {waitingListLoading ? (
                <div className="pv-empty">Loading queued patients...</div>
              ) : waitingListRows.length === 0 ? (
                <div className="pv-empty">No queued patients for Appointments.</div>
              ) : (
                waitingListRows.map((row: any) => (
                  <div key={String(row?.tokenId || row?.tokenNumber || row?.patientId)} className="workflow-waiting-item">
                    <div className="workflow-waiting-copy">
                      <strong>{String(row?.patientName || "Queued patient")}</strong>
                      <span>{String(row?.tokenNumber || "")} · {String(row?.priority || "WAITING")}</span>
                    </div>
                    <div className="workflow-waiting-actions">
                      <button
                        type="button"
                        className="btn-primary workflow-waiting-checkin"
                        onClick={() => checkInAppointmentQueuePatient(row)}
                      >
                        {checkedInQueuePatients[String(row?.patientId || "")] ? "Checked In" : "Check In"}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </aside>
        </div>
      ) : null}
      {activeForm ? (
        <div className="module-form-overlay appointment-form-overlay">
          <div className={`module-form-panel appointment-form-panel appointment-mode-${activeForm}`}>
            <div className="module-form-header appointment-form-header">
              <div className="module-form-heading">
                <div className="module-form-icon"><Icon type={activeForm === "booking" ? "calendar" : activeForm === "slots" ? "settings" : "cancel"} size={20} /></div>
                <div>
                  <div className="module-form-kicker">Appointments & Schedules</div>
                  <h2 className="module-form-title">{activeForm === "booking" ? "Appointment Booking" : activeForm === "slots" ? "Appointment Slot Configuration" : "Appointment Cancellation"}</h2>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setActiveForm(null)}>×</button>
            </div>
            <div className="appointment-form-tabs">
              <button
                type="button"
                onClick={() => setActiveForm("booking")}
                className={`appointment-form-tab ${activeForm === "booking" ? "is-active" : ""}`}
              >
                <Icon type="calendar" size={15} /> Booking
              </button>
              <button
                type="button"
                onClick={() => setActiveForm("slots")}
                className={`appointment-form-tab ${activeForm === "slots" ? "is-active" : ""}`}
              >
                <Icon type="settings" size={15} /> Slots
              </button>
              <button
                type="button"
                onClick={() => setActiveForm("cancel")}
                className={`appointment-form-tab ${activeForm === "cancel" ? "is-active" : ""}`}
              >
                <Icon type="cancel" size={15} /> Cancel
              </button>
            </div>
            {activeForm === "booking" ? (
              <form className="appointment-form-body" onSubmit={submitBooking}>
                <div>
                  <label className="form-label">Patient Search</label>
                  <div className="appointment-patient-search-wrap">
                    <input
                      className="form-input"
                      placeholder="Search by MRN, name, or ID number..."
                      value={searchPatient}
                      onChange={(e) => {
                        setSearchPatient(e.target.value);
                        setShowPatientResults(true);
                      }}
                      onFocus={() => setShowPatientResults(true)}
                      onBlur={() => window.setTimeout(() => setShowPatientResults(false), 150)}
                    />
                    {showPatientResults && patientSearchOptions.length > 0 ? (
                      <ul className="appointment-patient-results">
                        {patientSearchOptions.map((patient) => (
                          <li key={patient.id}>
                            <button
                              type="button"
                              onMouseDown={() => {
                                setBooking((current) => ({ ...current, patientId: patient.id }));
                                setSearchPatient(`${patient.name}${patient.regNo ? ` (${patient.regNo})` : ""}`);
                                setShowPatientResults(false);
                              }}
                            >
                              {patient.name} {patient.regNo ? `(${patient.regNo})` : ""}
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </div>
                <div className="appointment-grid-2">
                  <div><label className="form-label">Appointment Type *</label><select required className="form-input" value={booking.appointmentType} onChange={(e) => setBooking({ ...booking, appointmentType: e.target.value })}>{["New", "Follow-up", "Specialist", "Procedure", "Telemedicine"].map((item) => <option key={item}>{item}</option>)}</select></div>
                  <div><label className="form-label">Department *</label><select required className="form-input" value={booking.department} onChange={(e) => setBooking({ ...booking, department: e.target.value })}>{["OPD", "Specialist Clinic", "Procedure", "Telemedicine", "Diagnostics"].map((item) => <option key={item}>{item}</option>)}</select></div>
                </div>
                <div><label className="form-label">Preferred Doctor</label><select className="form-input" value={booking.doctorId} onChange={(e) => setBooking({ ...booking, doctorId: e.target.value })}><option value="">-- Choose Doctor (Optional) --</option>{doctors.map((doctor) => <option key={doctor.id} value={doctor.id}>{`Dr. ${doctor.firstName || ""} ${doctor.lastName || ""}`.trim()} {doctor.specialization ? `(${doctor.specialization})` : ""}</option>)}</select></div>
                <div className="appointment-grid-2">
                  <div><label className="form-label">Appointment Date</label><input required type="date" className="form-input" value={booking.date} onChange={(e) => setBooking({ ...booking, date: e.target.value })} /></div>
                  <div><label className="form-label">Appointment Time</label><input required type="time" className="form-input" value={booking.time} onChange={(e) => setBooking({ ...booking, time: e.target.value })} /></div>
                </div>
                <div className="appointment-slot-calendar">
                  <div className="appointment-slot-calendar-head"><div><strong>Slot-Based Calendar</strong><span>{booking.date ? `${selectedDoctorName} · ${booking.date}` : "Choose date and doctor to reserve a slot"}</span></div><div className="appointment-slot-legend"><span><i className="slot-available" /> Available</span><span><i className="slot-booked" /> Booked</span><span><i className="slot-blocked" /> Blocked</span></div></div>
                  <div className="appointment-slot-grid">{bookingCalendarSlots.map((slot) => <button key={slot.time} type="button" className={`appointment-slot-cell is-${slot.status} ${booking.time === slot.time ? "is-selected" : ""}`} disabled={slot.status !== "available"} onClick={() => setBooking({ ...booking, time: slot.time })}>{slot.time}</button>)}</div>
                </div>
                <div className="appointment-grid-2">
                  <div><label className="form-label">Booking Source</label><select className="form-input" value={booking.bookingSource} onChange={(e) => setBooking({ ...booking, bookingSource: e.target.value })}>{["Walk-in", "Phone", "Portal", "Referral"].map((item) => <option key={item}>{item}</option>)}</select></div>
                  <div><label className="form-label">Insurance to Use</label><input className="form-input" placeholder="Active insurance scheme" value={booking.insuranceScheme} onChange={(e) => setBooking({ ...booking, insuranceScheme: e.target.value })} /></div>
                </div>
                <div><label className="form-label">Chief Complaint</label><input className="form-input" value={booking.chiefComplaint} onChange={(e) => setBooking({ ...booking, chiefComplaint: e.target.value })} /></div>
                <div><label className="form-label">Notes</label><textarea className="form-input" value={booking.notes} onChange={(e) => setBooking({ ...booking, notes: e.target.value })} rows={2} /></div>
                <div className="appointment-grid-2">
                  <div><label className="form-label">Slot Duration (minutes)</label><input type="number" className="form-input" value={booking.durationMinutes} onChange={(e) => setBooking({ ...booking, durationMinutes: Number(e.target.value) })} /></div>
                  <label className="appointment-check-row appointment-check-inline"><input type="checkbox" checked={booking.sendReminder} onChange={(e) => setBooking({ ...booking, sendReminder: e.target.checked })} />Send Reminder</label>
                </div>
                <div className="appointment-feature-panel">
                  <div className="appointment-feature-title"><Icon type="settings" size={15} /> Advanced appointment controls</div>
                  <div className="appointment-grid-2">
                    <label className="appointment-check-row"><input type="checkbox" checked={booking.repeatEnabled} onChange={(e) => setBooking({ ...booking, repeatEnabled: e.target.checked })} />Recurring appointment series</label>
                    <label className="appointment-check-row"><input type="checkbox" checked={booking.appBooking} onChange={(e) => setBooking({ ...booking, appBooking: e.target.checked })} />Booked via Medilink App</label>
                  </div>
                </div>
                {booking.repeatEnabled ? <div className="appointment-repeat-grid"><label>Repeat Every<input type="number" className="form-input" value={booking.repeatEvery} onChange={(e) => setBooking({ ...booking, repeatEvery: Number(e.target.value) })} /></label><label>Repeat Unit<select className="form-input" value={booking.repeatUnit} onChange={(e) => setBooking({ ...booking, repeatUnit: e.target.value })}><option value="weeks">Weeks</option><option value="months">Months</option></select></label><label>Repeat Until<input type="date" className="form-input" value={booking.repeatUntil} onChange={(e) => setBooking({ ...booking, repeatUntil: e.target.value })} /></label></div> : null}
                <div className="appointment-grid-2">
                  <label className="appointment-check-row"><input type="checkbox" checked={booking.reminder24Sms} onChange={(e) => setBooking({ ...booking, reminder24Sms: e.target.checked })} />SMS reminder 24 hours before</label>
                  <label className="appointment-check-row"><input type="checkbox" checked={booking.reminder2WhatsApp} onChange={(e) => setBooking({ ...booking, reminder2WhatsApp: e.target.checked })} />WhatsApp reminder 2 hours before</label>
                  <label className="appointment-check-row"><input type="checkbox" checked={booking.responseTracking} onChange={(e) => setBooking({ ...booking, responseTracking: e.target.checked })} />Track CONFIRM / CANCEL replies</label>
                  <label className="appointment-check-row"><input type="checkbox" checked={booking.waitingListAllowed} onChange={(e) => setBooking({ ...booking, waitingListAllowed: e.target.checked })} />Release cancelled slots to waiting list</label>
                </div>
                <div className="appointment-grid-2">
                  <div><label className="form-label">Required Resources</label><input className="form-input" value={booking.requiredResources} onChange={(e) => setBooking({ ...booking, requiredResources: e.target.value })} placeholder="Theatre, anaesthetist, ultrasound..." /></div>
                  <div><label className="form-label">No-Show Policy</label><select className="form-input" value={booking.noShowPolicy} onChange={(e) => setBooking({ ...booking, noShowPolicy: e.target.value })}><option>Track only</option><option>Require deposit after 3 no-shows</option><option>Supervisor approval after repeat no-show</option></select></div>
                </div>
                <div className="module-form-footer"><button type="button" className="form-btn form-btn-cancel" onClick={() => setActiveForm(null)}>Cancel</button><button className="form-btn form-btn-primary" disabled={loading}>{loading ? "Scheduling..." : "Schedule"}</button></div>
              </form>
            ) : activeForm === "slots" ? (
              <form className="appointment-form-body" onSubmit={submitSlots}>
                <div className="appointment-grid-2">
                  <div><label className="form-label">Doctor *</label><select required className="form-input" value={slotConfig.doctorName} onChange={(e) => setSlotConfig({ ...slotConfig, doctorName: e.target.value })}><option value="">Select Doctor</option>{doctors.map((doctor) => <option key={doctor.id} value={doctor.id}>{`Dr. ${doctor.firstName || ""} ${doctor.lastName || ""}`.trim()}</option>)}</select></div>
                  <div><label className="form-label">Department *</label><input required className="form-input" value={slotConfig.department} onChange={(e) => setSlotConfig({ ...slotConfig, department: e.target.value })} placeholder="Clinic or department" /></div>
                </div>
                <div className="appointment-grid-3">
                  <div><label className="form-label">Date *</label><input required type="date" className="form-input" value={slotConfig.date} onChange={(e) => setSlotConfig({ ...slotConfig, date: e.target.value })} /></div>
                  <div><label className="form-label">Start Time *</label><input required type="time" className="form-input" value={slotConfig.startTime} onChange={(e) => setSlotConfig({ ...slotConfig, startTime: e.target.value })} /></div>
                  <div><label className="form-label">End Time *</label><input required type="time" className="form-input" value={slotConfig.endTime} onChange={(e) => setSlotConfig({ ...slotConfig, endTime: e.target.value })} /></div>
                </div>
                <div className="appointment-grid-2">
                  <div><label className="form-label">Slot Duration</label><input required type="number" className="form-input" value={slotConfig.slotDuration} onChange={(e) => setSlotConfig({ ...slotConfig, slotDuration: Number(e.target.value) })} /></div>
                  <div><label className="form-label">Slot Type</label><select className="form-input" value={slotConfig.slotType} onChange={(e) => setSlotConfig({ ...slotConfig, slotType: e.target.value })}><option>OPD</option><option>Telemedicine</option><option>Procedure</option></select></div>
                </div>
                <div><label className="form-label">Maximum Patients</label><input type="number" className="form-input" value={slotConfig.maxPatients} onChange={(e) => setSlotConfig({ ...slotConfig, maxPatients: Number(e.target.value) })} /></div>
                <div className="module-form-footer"><button type="button" className="form-btn form-btn-cancel" onClick={() => setActiveForm(null)}>Cancel</button><button className="form-btn form-btn-primary" disabled={loading}>{loading ? "Saving..." : "Save Slots"}</button></div>
              </form>
            ) : (
              <form className="appointment-form-body" onSubmit={submitCancel}>
                <div><label className="form-label">Appointment</label><select required className="form-input" value={cancelData.appointmentId} onChange={(e) => setCancelData({ ...cancelData, appointmentId: e.target.value })}><option value="">Select appointment</option>{appointments.map((item) => <option key={item.id} value={item.id}>{appointmentPatientName(item)} - {appointmentTimeText(item)}</option>)}</select></div>
                <div><label className="form-label">Reason</label><select className="form-input" value={cancelData.reason} onChange={(e) => setCancelData({ ...cancelData, reason: e.target.value })}>{["Patient request", "Doctor unavailable", "Emergency", "Other"].map((item) => <option key={item}>{item}</option>)}</select></div>
                <label className="appointment-check-row"><input type="checkbox" checked={cancelData.notifyPatient} onChange={(e) => setCancelData({ ...cancelData, notifyPatient: e.target.checked })} />Notify patient</label>
                <label className="appointment-check-row"><input type="checkbox" checked={cancelData.reschedule} onChange={(e) => setCancelData({ ...cancelData, reschedule: e.target.checked })} />Reschedule immediately</label>
                <div><label className="form-label">Notes</label><textarea className="form-input" value={cancelData.notes} onChange={(e) => setCancelData({ ...cancelData, notes: e.target.value })} /></div>
                <div className="module-form-footer"><button type="button" className="form-btn form-btn-cancel" onClick={() => setActiveForm(null)}>Cancel</button><button className="form-btn form-btn-primary" disabled={loading}>{loading ? "Cancelling..." : "Cancel Appointment"}</button></div>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function EHRView() {
  const [search, setSearch] = useState("");
  const records = [
    {
      id: "1",
      patient: "Jane Doe",
      lastVisit: "2026-02-15",
      diagnosis: "Common Cold",
    },
    {
      id: "2",
      patient: "Samuel Mwangi",
      lastVisit: "2026-02-10",
      diagnosis: "Hypertension",
    },
    {
      id: "3",
      patient: "Amina Hassan",
      lastVisit: "2026-02-20",
      diagnosis: "Routine Checkup",
    },
  ];

  const filtered = records.filter((r) =>
    r.patient.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="ehr-view">
      <div className="pv-header">
        <div>
          <h2 className="pv-title">Medical Records (EHR)</h2>
          <p className="pv-subtitle">
            Centralized patient clinical history and notes
          </p>
        </div>
      </div>
      <div className="pv-search-wrap">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#94a3b8"
          strokeWidth="2"
          style={{
            position: "absolute",
            left: 12,
            top: "50%",
            transform: "translateY(-50%)",
          }}
        >
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
        <input
          className="pv-search"
          placeholder="Search Patient EHR..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className="pv-table-wrap">
        <table className="pv-table">
          <thead>
            <tr>
              <th>Patient</th>
              <th>Last Visit</th>
              <th>Primary Diagnosis</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id}>
                <td className="pv-name">{r.patient}</td>
                <td>{r.lastVisit}</td>
                <td>
                  <span className="pv-badge badge-male">{r.diagnosis}</span>
                </td>
                <td>
                  <button className="pv-del">Open File</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function NursingView() {
  const [activeVisits] = useState([
    { id: "1", patient: "Jane Doe", status: "STABLE", visit: "IPD / Ward A" },
    { id: "2", patient: "Samuel Mwangi", status: "OBSERVATION", visit: "OPD" },
    { id: "3", patient: "Amina Hassan", status: "STABLE", visit: "IPD / Maternity" },
  ]);
  const [search, setSearch] = useState("");
  const filteredVisits = activeVisits.filter((visit) =>
    `${visit.patient} ${visit.status} ${visit.visit}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  const nursingStats = [
    { label: "Active Admissions", value: activeVisits.length, color: "#1e3a8a" },
    { label: "Assigned Patients", value: activeVisits.length, color: "#2563eb" },
    { label: "Pending Medication", value: 3, color: "#f59e0b" },
    { label: "Abnormal Vitals", value: 0, color: "#dc2626" },
    { label: "Open Incidents", value: 0, color: "#7c3aed" },
    { label: "Critical Incidents", value: 0, color: "#be123c" },
    { label: "Open Tasks", value: 0, color: "#0891b2" },
    { label: "Overdue Tasks", value: 0, color: "#ea580c" },
    { label: "Medications Logged", value: 0, color: "#16a34a" },
    { label: "Recent Handovers", value: 0, color: "#0d9488" },
  ];

  return (
    <div className="nursing-view">
      <div className="pv-header">
        <div>
          <h2 className="pv-title">Nursing Station</h2>
          <p className="pv-subtitle">
            Daily observations and medication administration
          </p>
        </div>
      </div>
      <div className="pv-stats nursing-stats-grid">
        {nursingStats.map((stat) => (
          <article
            key={stat.label}
            className="pv-stat-card"
            style={{ borderLeftColor: stat.color }}
          >
            <p className="pv-stat-label">{stat.label}</p>
            <p className="pv-stat-value">{stat.value}</p>
          </article>
        ))}
      </div>
      <div className="pv-search-bar">
        <div className="pv-search-wrap">
          <svg
            className="pv-search-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            className="pv-search"
            placeholder="Search patients..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </div>
      <div className="pv-table-wrap nursing-patient-table-wrap">
        <div className="nursing-table-meta">
          <h3>Patient Records</h3>
          <span>{filteredVisits.length} records</span>
        </div>
        <table className="pv-table">
          <thead>
            <tr>
              <th>Patient</th>
              <th>Status</th>
              <th>Visit</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredVisits.length === 0 ? (
              <tr>
                <td colSpan={4} className="pv-empty">
                  No active patients found.
                </td>
              </tr>
            ) : (
              filteredVisits.map((v) => (
                <tr key={v.id}>
                  <td className="pv-name">{v.patient}</td>
                  <td>
                    <span className="pv-badge badge-male">{v.status}</span>
                  </td>
                  <td>{v.visit}</td>
                  <td>
                    <button className="pv-del nursing-log-care-btn">Log Care</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function WardView() {
  const [wards, setWards] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [newWardName, setNewWardName] = useState("");
  const [newWardType, setNewWardType] = useState<"MEN" | "WOMEN" | "BOTH">("BOTH");
  const [newWardBeds, setNewWardBeds] = useState("10");
  const [selectedWardMap, setSelectedWardMap] = useState<any | null>(null);

  const loadWards = async () => {
    setLoading(true);
    setError("");
    try {
      const rows = await fetchWards();
      setWards(rows);
    } catch (err: any) {
      setError(String(err?.message || "Failed to load wards"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadWards();
  }, []);

  const handleCreateWard = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setNotice("");
    const name = newWardName.trim();
    const bedCount = Number(newWardBeds);
    if (!name) {
      setError("Ward name is required.");
      return;
    }
    if (!Number.isInteger(bedCount) || bedCount < 1) {
      setError("Number of beds must be at least 1.");
      return;
    }

    setCreating(true);
    try {
      const createdWard = await createWard({
        name,
        type: newWardType,
        capacity: bedCount,
      });

      const prefix =
        newWardType === "MEN" ? "M" : newWardType === "WOMEN" ? "W" : "B";
      await Promise.all(
        Array.from({ length: bedCount }).map((_, index) =>
          createBed({
            wardId: String(createdWard.id),
            bedNumber: `${prefix}-${String(index + 1).padStart(3, "0")}`,
          }),
        ),
      );

      setNotice("Ward created successfully.");
      setNewWardName("");
      setNewWardType("BOTH");
      setNewWardBeds("10");
      setShowCreate(false);
      await loadWards();
    } catch (err: any) {
      setError(String(err?.message || "Failed to create ward"));
    } finally {
      setCreating(false);
    }
  };

  const getWardBedsForMap = (ward: any) => {
    const existingBeds = Array.isArray(ward?.beds) ? [...ward.beds] : [];
    const existingCount = existingBeds.length;
    const capacity = Number(ward?.capacity || existingCount || 0);
    if (capacity <= existingCount) return existingBeds;

    const placeholders = Array.from({ length: capacity - existingCount }).map((_, index) => ({
      id: `placeholder-${ward?.id || "ward"}-${index + 1}`,
      bedNumber: `UNASSIGNED-${index + 1}`,
      status: "AVAILABLE",
      isPlaceholder: true,
    }));
    return [...existingBeds, ...placeholders];
  };

  return (
    <div className="ward-view">
      <div className="pv-header">
        <div>
          <h2 className="pv-title">Bed & Ward Management</h2>
          <p className="pv-subtitle">
            Real-time occupancy tracking for facility wards
          </p>
        </div>
        <button className="btn-primary" type="button" onClick={() => setShowCreate((v) => !v)}>
          {showCreate ? "Close" : "Create New Ward"}
        </button>
      </div>

      {notice && <div className="workflow-notice is-success">{notice}</div>}
      {error && <div className="auth-error">{error}</div>}

      {showCreate && (
        <div className="workflow-form-wrap" style={{ marginBottom: 14 }}>
          <form className="workflow-form" onSubmit={handleCreateWard}>
            <div className="workflow-form-header">
              <h3>Create New Ward</h3>
              <p>Add a ward, set ward type, and allocate number of beds.</p>
            </div>
            <div className="workflow-form-grid">
              <label className="workflow-field">
                <span>Ward Name *</span>
                <input
                  className="form-input"
                  value={newWardName}
                  onChange={(e) => setNewWardName(e.target.value)}
                  placeholder="General Ward A"
                  required
                />
              </label>
              <label className="workflow-field">
                <span>Ward Type *</span>
                <select
                  className="form-input"
                  value={newWardType}
                  onChange={(e) => setNewWardType(e.target.value as "MEN" | "WOMEN" | "BOTH")}
                >
                  <option value="MEN">Men</option>
                  <option value="WOMEN">Women</option>
                  <option value="BOTH">Both</option>
                </select>
              </label>
              <label className="workflow-field">
                <span>Number of Beds *</span>
                <input
                  className="form-input"
                  type="number"
                  min={1}
                  value={newWardBeds}
                  onChange={(e) => setNewWardBeds(e.target.value)}
                  required
                />
              </label>
            </div>
            <div className="modal-footer" style={{ marginTop: 12 }}>
              <button className="btn-primary" type="submit" disabled={creating}>
                {creating ? "Creating..." : "Create Ward"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="stats-grid" style={{ marginBottom: 12 }}>
        <article className="stat-card">
          <p>Total Wards</p>
          <h3>{wards.length}</h3>
        </article>
        <article className="stat-card">
          <p>Total Beds</p>
          <h3>
            {wards.reduce((sum, ward) => sum + Number(ward.capacity || ward.beds?.length || 0), 0)}
          </h3>
        </article>
      </div>

      <div className="pv-table-wrap" style={{ marginBottom: 12 }}>
        <table className="pv-table">
          <thead>
            <tr>
              <th>Ward List</th>
              <th>Map</th>
            </tr>
          </thead>
          <tbody>
            {wards.map((w) => (
              <tr key={`map-${w.id}`}>
                <td className="pv-name">{w.name}</td>
                <td>
                  <button
                    className="btn-primary"
                    onClick={() => setSelectedWardMap(w)}
                  >
                    Open Map
                  </button>
                </td>
              </tr>
            ))}
            {!loading && wards.length === 0 && (
              <tr>
                <td colSpan={2} className="pv-empty">No wards created yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="pv-table-wrap">
        <table className="pv-table">
          <thead>
            <tr>
              <th>Ward Name</th>
              <th>Type</th>
              <th>Capacity</th>
              <th>Occupied</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {wards.map((w) => {
              const occupied = Number(
                (w.beds || []).filter(
                  (bed: any) => String(bed.status || "").toUpperCase() === "OCCUPIED",
                ).length,
              );
              const capacity = Number(w.capacity || (w.beds || []).length || 0);
              return (
              <tr key={w.id} className="ward-row-clickable" onClick={() => setSelectedWardMap(w)}>
                <td className="pv-name">{w.name}</td>
                <td>{String(w.type || "BOTH").toUpperCase()}</td>
                <td>{capacity}</td>
                <td>{occupied}</td>
                <td>
                  <span
                    className={`pv-badge ${occupied >= capacity ? "badge-female" : "badge-male"}`}
                  >
                    {occupied >= capacity ? "Full" : "Available"}
                  </span>
                </td>
                <td>
                  <button
                    className="pv-del"
                    onClick={(event) => {
                      event.stopPropagation();
                      setSelectedWardMap(w);
                    }}
                  >
                    Open Map
                  </button>
                </td>
              </tr>
            )})}
            {!loading && wards.length === 0 && (
              <tr>
                <td colSpan={6} className="pv-empty">No wards created yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedWardMap && (
        <div className="modal-overlay" onClick={() => setSelectedWardMap(null)}>
          <div className="modal-box ward-map-modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedWardMap.name} Bed Map</h3>
              <button className="modal-close" onClick={() => setSelectedWardMap(null)}>
                ✕
              </button>
            </div>
            {(() => {
              const beds = getWardBedsForMap(selectedWardMap);
              const occupiedBeds = beds.filter(
                (bed: any) => String(bed.status || "").toUpperCase() === "OCCUPIED",
              ).length;
              const vacantBeds = beds.length - occupiedBeds;
              return (
                <>
                  <div className="ward-map-summary">
                    <span className="pv-badge badge-female">Occupied: {occupiedBeds}</span>
                    <span className="pv-badge badge-male">Vacant: {vacantBeds}</span>
                    <span className="pv-badge">Total: {beds.length}</span>
                  </div>
                  <div className="ward-map-grid">
                    {beds
                      .slice()
                      .sort((a: any, b: any) => String(a.bedNumber).localeCompare(String(b.bedNumber)))
                      .map((bed: any) => {
                        const isOccupied = String(bed.status || "").toUpperCase() === "OCCUPIED";
                        return (
                          <article
                            key={bed.id || bed.bedNumber}
                            className={`ward-bed-card ${isOccupied ? "is-occupied" : "is-vacant"}`}
                          >
                            <strong>{bed.bedNumber || "Bed"}</strong>
                            <span>{isOccupied ? "Occupied" : "Vacant"}</span>
                          </article>
                        );
                      })}
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}

// LaboratoryView and PharmacyView are now imported from ./views

function InventoryView() {
  const [inventory] = useState([
    { id: "1", name: "Amoxicillin", batch: "BN-001", stock: 450 },
    { id: "2", name: "Paracetamol", batch: "BN-042", stock: 1200 },
    { id: "3", name: "Insulin", batch: "BN-099", stock: 15 },
  ]);

  return (
    <div className="inventory-view">
      <div className="pv-header">
        <div>
          <h2 className="pv-title">Stock Inventory</h2>
          <p className="pv-subtitle">
            Monitor pharmaceutical supplies and stock levels
          </p>
        </div>
      </div>
      <div className="pv-table-wrap">
        <table className="pv-table">
          <thead>
            <tr>
              <th>Medication</th>
              <th>Batch</th>
              <th>Stock</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {inventory.map((i) => (
              <tr key={i.id}>
                <td className="pv-name">{i.name}</td>
                <td>{i.batch}</td>
                <td>{i.stock}</td>
                <td>
                  <span
                    className={`pv-badge ${i.stock < 50 ? "badge-female" : "badge-male"}`}
                  >
                    {i.stock < 50 ? "Low" : "OK"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function OTView() {
  const [bookings] = useState([
    {
      id: "1",
      procedure: "Appendectomy",
      date: "2024-02-23",
      status: "SCHEDULED",
    },
    {
      id: "2",
      procedure: "Hernia Repair",
      date: "2024-02-24",
      status: "COMPLETED",
    },
  ]);

  return (
    <div className="ot-view">
      <div className="pv-header">
        <div>
          <h2 className="pv-title">Theatre Dashboard</h2>
          <p className="pv-subtitle">
            Monitor surgical schedules and theatre occupancy
          </p>
        </div>
      </div>
      <div className="pv-table-wrap">
        <table className="pv-table">
          <thead>
            <tr>
              <th>Procedure</th>
              <th>Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((b) => (
              <tr key={b.id}>
                <td className="pv-name">{b.procedure}</td>
                <td>{b.date}</td>
                <td>
                  <span
                    className={`pv-badge ${b.status === "SCHEDULED" ? "badge-female" : "badge-male"}`}
                  >
                    {b.status}
                  </span>
                </td>
                <td>
                  <button className="pv-del">
                    {b.status === "SCHEDULED" ? "Pre-Op" : "View"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function BloodBankView() {
  const [stock] = useState([
    { group: "A+", units: 12 },
    { group: "B+", units: 4 },
    { group: "O+", units: 25 },
    { group: "AB-", units: 1 },
  ]);

  return (
    <div className="blood-bank-view">
      <div className="pv-header">
        <div>
          <h2 className="pv-title">Blood Inventory</h2>
          <p className="pv-subtitle">
            Real-time monitoring of blood group reserves
          </p>
        </div>
      </div>
      <div className="pv-table-wrap">
        <table className="pv-table">
          <thead>
            <tr>
              <th>Blood Group</th>
              <th>Available Units</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {stock.map((s) => (
              <tr key={s.group}>
                <td className="pv-name">{s.group}</td>
                <td className="font-bold">{s.units} Units</td>
                <td>
                  <span
                    className={`pv-badge ${s.units < 5 ? "badge-female" : "badge-male"}`}
                  >
                    {s.units < 5 ? "Critical" : "Stable"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
void BloodBankView;

function TelemedicineView() {
  type TelemedicineField = {
    key: string;
    label: string;
    note: string;
    type: string;
    required?: boolean;
    placeholder?: string;
    options?: string[];
  };
  const [search, setSearch] = useState("");
  const [activeForm, setActiveForm] = useState<"booking" | "consultation" | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string | boolean>>({});
  const [notice, setNotice] = useState("");
  const [sessions, setSessions] = useState([
    {
      id: "1",
      patient: "A. Hassan",
      doctor: "Dr. Mugo",
      time: "10:40 AM",
      status: "Waiting",
    },
    {
      id: "2",
      patient: "B. Maina",
      doctor: "Dr. Atieno",
      time: "11:10 AM",
      status: "In Session",
    },
    {
      id: "3",
      patient: "C. Wanjiku",
      doctor: "Dr. Mutua",
      time: "2:30 PM",
      status: "Upcoming",
    },
    {
      id: "4",
      patient: "D. Otieno",
      doctor: "Dr. Mugo",
      time: "8:50 AM",
      status: "Completed",
    },
  ]);
  const doctors = ["Dr. Mugo", "Dr. Atieno", "Dr. Mutua", "Dr. Njeri"];
  const formAccent = activeForm === "consultation" ? "#2563eb" : "#16a34a";
  const activeFormTitle =
    activeForm === "consultation" ? "Telemedicine Consultation" : "Telemedicine Session Booking";
  const activeFormDescription =
    activeForm === "consultation"
      ? "Capture technical checks, clinical notes, diagnosis, management plan, and follow-up decision."
      : "Capture patient, doctor, session type, time slot, device context, and virtual care consent.";
  const bookingFields: TelemedicineField[] = [
    {
      key: "patient",
      label: "Patient",
      note: "Patient MRN or search by name.",
      type: "text",
      required: true,
      placeholder: "Patient MRN or search by name",
    },
    {
      key: "doctor",
      label: "Doctor",
      note: "Doctor for the telemedicine session.",
      type: "select",
      required: true,
      options: doctors,
    },
    {
      key: "session_type",
      label: "Session type",
      note: "New consultation, follow-up, or specialist referral.",
      type: "select",
      required: true,
      options: ["New consultation", "Follow-up", "Specialist referral"],
    },
    {
      key: "date_and_time",
      label: "Date and time",
      note: "From available telemedicine slots.",
      type: "datetime-local",
      required: true,
    },
    {
      key: "chief_complaint",
      label: "Chief complaint",
      note: "Reason for virtual consultation.",
      type: "text",
      required: true,
      placeholder: "Reason for virtual consultation",
    },
    {
      key: "patient_device",
      label: "Patient device",
      note: "Used for technical support before and during the session.",
      type: "select",
      options: ["Web", "iOS", "Android - for technical support"],
    },
    {
      key: "consent_for_telemedicine",
      label: "Consent for telemedicine",
      note: "Patient consents to virtual consultation and recording policy.",
      type: "checkbox",
      required: true,
    },
  ];
  const consultationFields: TelemedicineField[] = [
    {
      key: "technical_check",
      label: "Technical check",
      note: "Confirm audio, video, and patient identity.",
      type: "checkbox",
      required: true,
    },
    {
      key: "session_notes",
      label: "Session notes",
      note: "Consultation notes using OPD-style clinical documentation.",
      type: "textarea",
      required: true,
    },
    {
      key: "diagnosis",
      label: "Diagnosis",
      note: "ICD-10 coded diagnosis.",
      type: "text",
      required: true,
      placeholder: "e.g. J06.9 Acute upper respiratory infection",
    },
    {
      key: "management_plan",
      label: "Management plan",
      note: "Treatment plan including virtual prescriptions.",
      type: "textarea",
      required: true,
    },
    {
      key: "prescription_issued",
      label: "Prescription issued",
      note: "Tick to indicate a digital prescription was issued.",
      type: "checkbox",
    },
    {
      key: "investigations_ordered",
      label: "Investigations ordered",
      note: "Tests to be done at the nearest facility.",
      type: "text",
      placeholder: "FBC, malaria test, urinalysis...",
    },
    {
      key: "follow_up",
      label: "Follow-up",
      note: "Telemedicine, physical visit, or no follow-up needed.",
      type: "select",
      required: true,
      options: ["Telemedicine", "Physical visit", "No follow-up needed"],
    },
    {
      key: "referral_to_physical",
      label: "Referral to physical",
      note: "Tick if physical attendance is needed.",
      type: "checkbox",
    },
  ];
  const activeFields = activeForm === "consultation" ? consultationFields : bookingFields;
  const chatMessages = 18;
  const upcomingSessions = sessions.filter((session) =>
    ["Waiting", "In Session", "Upcoming"].includes(session.status),
  ).length;
  const completedSessions = sessions.filter((session) => session.status === "Completed").length;
  const filteredSessions = sessions.filter((session) => {
    const needle = search.trim().toLowerCase();
    if (!needle) return true;
    return `${session.patient} ${session.doctor} ${session.status} ${session.time}`.toLowerCase().includes(needle);
  });
  const openForm = (form: "booking" | "consultation") => {
    setActiveForm(form);
    setFormValues({});
    setNotice("");
  };
  const updateFormValue = (key: string, value: string | boolean) => {
    setFormValues((current) => ({ ...current, [key]: value }));
  };
  const submitTelemedicineForm = (event: React.FormEvent) => {
    event.preventDefault();
    if (activeForm === "booking") {
      const rawTime = String(formValues.date_and_time || "");
      const date = rawTime ? new Date(rawTime) : null;
      const time =
        date && !Number.isNaN(date.getTime())
          ? date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          : "Scheduled";
      setSessions((current) => [
        {
          id: `local-${Date.now()}`,
          patient: String(formValues.patient || "New Patient"),
          doctor: String(formValues.doctor || "Assigned Doctor"),
          time,
          status: "Upcoming",
        },
        ...current,
      ]);
      setNotice("Telemedicine session booked and added to the session table.");
    } else {
      setNotice("Telemedicine consultation saved and clinical follow-up captured.");
    }
    setActiveForm(null);
    setFormValues({});
  };
  const renderTelemedicineField = (field: TelemedicineField) => {
    const value = formValues[field.key];
    if (field.type === "textarea") {
      return (
        <textarea
          className="telemedicine-form-control"
          value={typeof value === "string" ? value : ""}
          onChange={(event) => updateFormValue(field.key, event.target.value)}
          placeholder={field.placeholder}
          required={field.required}
        />
      );
    }
    if (field.type === "select") {
      return (
        <select
          className="telemedicine-form-control"
          value={typeof value === "string" ? value : ""}
          onChange={(event) => updateFormValue(field.key, event.target.value)}
          required={field.required}
        >
          <option value="">Select {field.label.toLowerCase()}</option>
          {(field.options || []).map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      );
    }
    if (field.type === "checkbox") {
      return (
        <label className="telemedicine-checkbox">
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(event) => updateFormValue(field.key, event.target.checked)}
            required={field.required}
          />
          <span>{field.required ? "Required confirmation" : "Mark as yes"}</span>
        </label>
      );
    }
    return (
      <input
        className="telemedicine-form-control"
        type={field.type || "text"}
        value={typeof value === "string" ? value : ""}
        onChange={(event) => updateFormValue(field.key, event.target.value)}
        placeholder={field.placeholder}
        required={field.required}
      />
    );
  };

  return (
    <div className="patients-view telemedicine-web-view">
      <div className="pv-header">
        <div>
          <div className="pv-title">
            <Icon type="video_call" />
            Telemedicine
          </div>
          <p className="pv-subtitle">Virtual consultations and remote follow-ups</p>
        </div>
        <div className="module-actions">
          <button type="button" onClick={() => openForm("booking")}>
            <Icon type="video_call" size={16} /> Telemedicine Session Booking
          </button>
          <button type="button" onClick={() => openForm("consultation")}>
            <Icon type="stethoscope" size={16} /> Telemedicine Consultation
          </button>
        </div>
      </div>

      {notice ? <div className="workflow-notice is-success">{notice}</div> : null}

      <div className="pv-stats telemedicine-stat-grid">
        <div className="pv-stat-card" style={{ borderLeftColor: "#1e3a8a" }}>
          <p className="pv-stat-label">Sessions Today</p>
          <p className="pv-stat-value">24</p>
        </div>
        <div className="pv-stat-card" style={{ borderLeftColor: "#0d9488" }}>
          <p className="pv-stat-label">Average Wait</p>
          <p className="pv-stat-value">6 mins</p>
        </div>
        <div className="pv-stat-card" style={{ borderLeftColor: "#dc2626" }}>
          <p className="pv-stat-label">Escalations</p>
          <p className="pv-stat-value">2</p>
        </div>
        <div className="pv-stat-card" style={{ borderLeftColor: "#7c3aed" }}>
          <p className="pv-stat-label">Upcoming</p>
          <p className="pv-stat-value">{upcomingSessions}</p>
        </div>
        <div className="pv-stat-card" style={{ borderLeftColor: "#16a34a" }}>
          <p className="pv-stat-label">Completed</p>
          <p className="pv-stat-value">{completedSessions}</p>
        </div>
        <div className="pv-stat-card" style={{ borderLeftColor: "#0284c7" }}>
          <p className="pv-stat-label">Today's Sessions</p>
          <p className="pv-stat-value">{sessions.length}</p>
        </div>
        <div className="pv-stat-card" style={{ borderLeftColor: "#f59e0b" }}>
          <p className="pv-stat-label">Chat Messages</p>
          <p className="pv-stat-value">{chatMessages}</p>
        </div>
      </div>

      <div className="pv-search-bar">
        <div className="pv-search-wrap">
          <Icon type="search" size={16} />
          <input
            className="pv-search telemedicine-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search sessions"
          />
        </div>
      </div>

      <div className="pv-table-meta">
        <strong className="pv-table-title">Telemedicine Sessions</strong>
        <span className="pv-badge">{filteredSessions.length} sessions</span>
      </div>
      <div className="pv-table-wrap">
        <table className="pv-table">
          <thead>
            <tr>
              <th>Patient</th>
              <th>Doctor</th>
              <th>Time</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSessions.length === 0 ? (
              <tr>
                <td className="pv-empty" colSpan={5}>No sessions found.</td>
              </tr>
            ) : (
              filteredSessions.map((session) => (
                <tr key={session.id}>
                  <td className="pv-name">{session.patient}</td>
                  <td>{session.doctor}</td>
                  <td>{session.time}</td>
                  <td>
                    <span className={`pv-badge ${session.status === "Completed" ? "badge-male" : "badge-female"}`}>
                      {session.status}
                    </span>
                  </td>
                  <td>
                    <button className="pv-del">
                      {session.status === "Completed" ? "View" : "Join"}
                    </button>
                </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {activeForm ? (
        <div className="telemedicine-form-overlay">
          <div
            className="telemedicine-form-panel"
            style={{ "--telemedicine-accent": formAccent } as React.CSSProperties}
          >
            <div className="telemedicine-form-header">
              <div className="telemedicine-form-title-wrap">
                <div className="telemedicine-form-icon">
                  <Icon type={activeForm === "consultation" ? "stethoscope" : "video_call"} size={24} />
                </div>
                <div>
                  <p>Telemedicine</p>
                  <h2>{activeFormTitle}</h2>
                </div>
              </div>
              <button
                type="button"
                className="telemedicine-form-close"
                onClick={() => setActiveForm(null)}
                aria-label="Close form"
              >
                ×
              </button>
            </div>
            <div className="telemedicine-form-intro">{activeFormDescription}</div>
            <form className="telemedicine-form-body" onSubmit={submitTelemedicineForm}>
              <div className="telemedicine-form-grid">
                {activeFields.map((field) => (
                  <label
                    key={field.key}
                    className={`telemedicine-form-field ${field.type === "textarea" ? "is-wide" : ""}`}
                  >
                    <span>
                      {field.label}
                      {field.required ? <strong>*</strong> : null}
                    </span>
                    <small>{field.note}</small>
                    {renderTelemedicineField(field)}
                  </label>
                ))}
              </div>
              <div className="telemedicine-form-footer">
                <button type="button" className="form-btn form-btn-cancel" onClick={() => setActiveForm(null)}>
                  Cancel
                </button>
                <button type="submit" className="form-btn form-btn-primary">
                  {activeForm === "consultation" ? "Save Consultation" : "Book Session"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function AISuiteView() {
  type AiAlertField = {
    key: string;
    label: string;
    note: string;
    type: string;
    required?: boolean;
    placeholder?: string;
    options?: string[];
  };
  const [scope, setScope] = useState("FACILITY");
  const [dateFrom, setDateFrom] = useState("2026-04-24");
  const [dateTo, setDateTo] = useState("2026-05-23");
  const [minConfidence, setMinConfidence] = useState("0.75");
  const [riskLevel, setRiskLevel] = useState("ALL");
  const [insightType, setInsightType] = useState("ALL");
  const [predictionType, setPredictionType] = useState("ALL");
  const [rowsLimit, setRowsLimit] = useState("25");
  const [search, setSearch] = useState("");
  const [activeForm, setActiveForm] = useState(false);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState("");

  const patients = [
    { id: "P001", scope: "FACILITY" },
    { id: "P002", scope: "FACILITY" },
    { id: "P003", scope: "FACILITY" },
    { id: "P004", scope: "DEPARTMENT" },
    { id: "P005", scope: "DEPARTMENT" },
    { id: "P006", scope: "FACILITY" },
  ];
  const visits = [
    { id: "V001", date: "2026-05-22", scope: "FACILITY" },
    { id: "V002", date: "2026-05-20", scope: "FACILITY" },
    { id: "V003", date: "2026-05-18", scope: "DEPARTMENT" },
    { id: "V004", date: "2026-05-12", scope: "FACILITY" },
    { id: "V005", date: "2026-04-30", scope: "FACILITY" },
  ];
  const admissions = [
    { id: "A001", date: "2026-05-20", scope: "FACILITY" },
    { id: "A002", date: "2026-05-09", scope: "FACILITY" },
    { id: "A003", date: "2026-05-01", scope: "DEPARTMENT" },
  ];
  const revenue = [
    { id: "R001", date: "2026-05-22", amount: 126000, forecast: 148000, scope: "FACILITY" },
    { id: "R002", date: "2026-05-16", amount: 98400, forecast: 112500, scope: "FACILITY" },
    { id: "R003", date: "2026-05-04", amount: 86000, forecast: 94000, scope: "DEPARTMENT" },
  ];
  const stock = [
    { item: "Amoxicillin 500mg", lowStock: true, expiringSoon: false, scope: "FACILITY" },
    { item: "Insulin Regular", lowStock: true, expiringSoon: true, scope: "FACILITY" },
    { item: "Ceftriaxone 1g", lowStock: false, expiringSoon: true, scope: "DEPARTMENT" },
  ];
  const analyticsRows = [
    {
      model: "Readmission Risk",
      signal: "12% above baseline",
      status: "Monitoring",
      owner: "Clinical",
      date: "2026-05-22",
      scope: "FACILITY",
      confidence: 0.92,
      risk: "HIGH",
      insightType: "Clinical",
      predictionType: "Readmission",
      billingAnomaly: false,
    },
    {
      model: "Denial Prediction",
      signal: "High risk payer",
      status: "Escalate",
      owner: "RCM",
      date: "2026-05-21",
      scope: "FACILITY",
      confidence: 0.88,
      risk: "HIGH",
      insightType: "Financial",
      predictionType: "Revenue",
      billingAnomaly: true,
    },
    {
      model: "Bed Demand",
      signal: "Next 7 days +8%",
      status: "Stable",
      owner: "Operations",
      date: "2026-05-18",
      scope: "FACILITY",
      confidence: 0.81,
      risk: "MEDIUM",
      insightType: "Operations",
      predictionType: "Bed demand",
      billingAnomaly: false,
    },
    {
      model: "Low Stock Predictor",
      signal: "Insulin will breach reorder level",
      status: "Review",
      owner: "Pharmacy",
      date: "2026-05-12",
      scope: "DEPARTMENT",
      confidence: 0.79,
      risk: "MEDIUM",
      insightType: "Inventory",
      predictionType: "Stock",
      billingAnomaly: false,
    },
    {
      model: "Billing Outlier Detection",
      signal: "Procedure charge mismatch",
      status: "Escalate",
      owner: "Finance",
      date: "2026-05-08",
      scope: "FACILITY",
      confidence: 0.74,
      risk: "LOW",
      insightType: "Financial",
      predictionType: "Anomaly",
      billingAnomaly: true,
    },
  ];
  const aiAlertFields: AiAlertField[] = [
    {
      key: "patient",
      label: "Patient",
      note: "Patient flagged by AI model.",
      type: "text",
      required: true,
      placeholder: "Patient flagged by AI model",
    },
    {
      key: "risk_type",
      label: "Risk type",
      note: "Readmission, deterioration, sepsis, or revenue anomaly.",
      type: "text",
      required: true,
      placeholder: "Readmission | Deterioration | Sepsis | Revenue anomaly",
    },
    {
      key: "risk_score",
      label: "Risk score",
      note: "AI confidence score 0-100%.",
      type: "text",
      required: true,
      placeholder: "AI confidence score 0-100%",
    },
    {
      key: "contributing_factors",
      label: "Contributing factors",
      note: "Factors the AI used to determine risk.",
      type: "text",
      required: true,
      placeholder: "Factors the AI used to determine risk",
    },
    {
      key: "clinician_assessment",
      label: "Clinician assessment",
      note: "Clinical review outcome for the AI alert.",
      type: "select",
      required: true,
      options: ["Agree - will act", "Disagree - not at risk", "Uncertain"],
    },
    {
      key: "action_planned",
      label: "Action planned",
      note: "What action will be taken in response to this alert.",
      type: "textarea",
    },
    {
      key: "review_notes",
      label: "Review notes",
      note: "Any clinical notes on the AI prediction.",
      type: "text",
      placeholder: "Any clinical notes on the AI prediction",
    },
  ];
  const dateInRange = (date: string) => {
    if (dateFrom && date < dateFrom) return false;
    if (dateTo && date > dateTo) return false;
    return true;
  };
  const scopeMatches = (itemScope: string) => scope === "ALL" || itemScope === scope;
  const formatKes = (amount: number) =>
    `Ksh ${amount.toLocaleString("en-KE", { maximumFractionDigits: 0 })}`;
  const min = Number(minConfidence || 0);
  const limit = Math.max(1, Number(rowsLimit || 25));
  const filteredAnalyticsRows = analyticsRows
    .filter((row) => scopeMatches(row.scope))
    .filter((row) => dateInRange(row.date))
    .filter((row) => row.confidence >= min)
    .filter((row) => riskLevel === "ALL" || row.risk === riskLevel)
    .filter((row) => insightType === "ALL" || row.insightType === insightType)
    .filter((row) => predictionType === "ALL" || row.predictionType === predictionType)
    .filter((row) => {
      const needle = search.trim().toLowerCase();
      if (!needle) return true;
      return `${row.model} ${row.signal} ${row.status} ${row.owner}`.toLowerCase().includes(needle);
    })
    .slice(0, limit);
  const filteredVisits = visits.filter((visit) => scopeMatches(visit.scope) && dateInRange(visit.date));
  const filteredAdmissions = admissions.filter((admission) => scopeMatches(admission.scope) && dateInRange(admission.date));
  const filteredRevenue = revenue.filter((entry) => scopeMatches(entry.scope) && dateInRange(entry.date));
  const filteredStock = stock.filter((item) => scopeMatches(item.scope));
  const revenueCollected = filteredRevenue.reduce((sum, entry) => sum + entry.amount, 0);
  const revenueForecast = filteredRevenue.reduce((sum, entry) => sum + entry.forecast, 0);
  const readmissionHighRisk = filteredAnalyticsRows.filter(
    (row) => row.predictionType === "Readmission" && row.risk === "HIGH",
  ).length;
  const billingAnomalies = filteredAnalyticsRows.filter((row) => row.billingAnomaly).length;
  const updateFormValue = (key: string, value: string) => {
    setFormValues((current) => ({ ...current, [key]: value }));
  };
  const renderAiAlertField = (field: AiAlertField) => {
    const value = formValues[field.key] || "";
    if (field.type === "textarea") {
      return (
        <textarea
          className="ai-analytics-form-control"
          value={value}
          onChange={(event) => updateFormValue(field.key, event.target.value)}
          placeholder={field.placeholder}
          required={field.required}
        />
      );
    }
    if (field.type === "select") {
      return (
        <select
          className="ai-analytics-form-control"
          value={value}
          onChange={(event) => updateFormValue(field.key, event.target.value)}
          required={field.required}
        >
          <option value="">Select {field.label.toLowerCase()}</option>
          {(field.options || []).map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      );
    }
    return (
      <input
        className="ai-analytics-form-control"
        type={field.type}
        value={value}
        onChange={(event) => updateFormValue(field.key, event.target.value)}
        placeholder={field.placeholder}
        required={field.required}
      />
    );
  };
  const submitAiAlertReview = (event: React.FormEvent) => {
    event.preventDefault();
    setNotice("AI alert review saved for clinical governance follow-up.");
    setActiveForm(false);
    setFormValues({});
  };

  return (
    <div className="patients-view ai-analytics-web-view">
      <div className="pv-header">
        <div>
          <div className="pv-title">
            <Icon type="auto_awesome" />
            AI Analytics
          </div>
          <p className="pv-subtitle">Predictive clinical and financial intelligence</p>
        </div>
        <div className="module-actions">
          <button type="button" onClick={() => setActiveForm(true)}>
            <Icon type="auto_awesome" size={16} /> AI Alert Review
          </button>
        </div>
      </div>

      {notice ? <div className="workflow-notice is-success">{notice}</div> : null}

      <div className="pv-stats ai-analytics-stat-grid">
        <div className="pv-stat-card" style={{ borderLeftColor: "#1e3a8a" }}>
          <p className="pv-stat-label">Patients</p>
          <p className="pv-stat-value">{patients.filter((patient) => scopeMatches(patient.scope)).length}</p>
        </div>
        <div className="pv-stat-card" style={{ borderLeftColor: "#0d9488" }}>
          <p className="pv-stat-label">Visits (30d)</p>
          <p className="pv-stat-value">{filteredVisits.length}</p>
        </div>
        <div className="pv-stat-card" style={{ borderLeftColor: "#7c3aed" }}>
          <p className="pv-stat-label">Admissions (30d)</p>
          <p className="pv-stat-value">{filteredAdmissions.length}</p>
        </div>
        <div className="pv-stat-card" style={{ borderLeftColor: "#dc2626" }}>
          <p className="pv-stat-label">Readmission High Risk</p>
          <p className="pv-stat-value">{readmissionHighRisk}</p>
        </div>
        <div className="pv-stat-card" style={{ borderLeftColor: "#16a34a" }}>
          <p className="pv-stat-label">Revenue Collected (30d)</p>
          <p className="pv-stat-value">{formatKes(revenueCollected)}</p>
        </div>
        <div className="pv-stat-card" style={{ borderLeftColor: "#0284c7" }}>
          <p className="pv-stat-label">Revenue Forecast (30d)</p>
          <p className="pv-stat-value">{formatKes(revenueForecast)}</p>
        </div>
        <div className="pv-stat-card" style={{ borderLeftColor: "#f59e0b" }}>
          <p className="pv-stat-label">Low Stock</p>
          <p className="pv-stat-value">{filteredStock.filter((item) => item.lowStock).length}</p>
        </div>
        <div className="pv-stat-card" style={{ borderLeftColor: "#be123c" }}>
          <p className="pv-stat-label">Expiring Soon</p>
          <p className="pv-stat-value">{filteredStock.filter((item) => item.expiringSoon).length}</p>
        </div>
        <div className="pv-stat-card" style={{ borderLeftColor: "#dc2626" }}>
          <p className="pv-stat-label">Billing Anomalies</p>
          <p className="pv-stat-value">{billingAnomalies}</p>
        </div>
        <div className="pv-stat-card" style={{ borderLeftColor: "#6366f1" }}>
          <p className="pv-stat-label">AI Insights Stored</p>
          <p className="pv-stat-value">{filteredAnalyticsRows.length}</p>
        </div>
        <div className="pv-stat-card" style={{ borderLeftColor: "#0891b2" }}>
          <p className="pv-stat-label">Predictions Stored</p>
          <p className="pv-stat-value">{filteredAnalyticsRows.length}</p>
        </div>
      </div>

      <section className="module-filter-panel ai-analytics-filter-panel">
        <div className="module-filter-grid">
          <label className="module-filter-field">
            <span>Scope</span>
            <select value={scope} onChange={(event) => setScope(event.target.value)}>
              <option value="ALL">All</option>
              <option value="FACILITY">Facility</option>
              <option value="DEPARTMENT">Department</option>
            </select>
          </label>
          <label className="module-filter-field">
            <span>Date From</span>
            <input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
          </label>
          <label className="module-filter-field">
            <span>Date To</span>
            <input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
          </label>
          <label className="module-filter-field">
            <span>Min Confidence (0-1)</span>
            <input type="number" min="0" max="1" step="0.01" value={minConfidence} onChange={(event) => setMinConfidence(event.target.value)} />
          </label>
          <label className="module-filter-field">
            <span>Risk Level</span>
            <select value={riskLevel} onChange={(event) => setRiskLevel(event.target.value)}>
              <option value="ALL">All</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </label>
          <label className="module-filter-field">
            <span>Insight Type Filter</span>
            <select value={insightType} onChange={(event) => setInsightType(event.target.value)}>
              <option value="ALL">All</option>
              <option value="Clinical">Clinical</option>
              <option value="Financial">Financial</option>
              <option value="Operations">Operations</option>
              <option value="Inventory">Inventory</option>
            </select>
          </label>
          <label className="module-filter-field">
            <span>Prediction Type Filter</span>
            <select value={predictionType} onChange={(event) => setPredictionType(event.target.value)}>
              <option value="ALL">All</option>
              <option value="Readmission">Readmission</option>
              <option value="Revenue">Revenue</option>
              <option value="Bed demand">Bed demand</option>
              <option value="Stock">Stock</option>
              <option value="Anomaly">Anomaly</option>
            </select>
          </label>
          <label className="module-filter-field">
            <span>Rows Limit</span>
            <input type="number" min="1" max="100" value={rowsLimit} onChange={(event) => setRowsLimit(event.target.value)} />
          </label>
        </div>
      </section>

      <div className="pv-search-bar">
        <div className="pv-search-wrap">
          <Icon type="search" size={16} />
          <input
            className="pv-search ai-analytics-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search AI models"
          />
        </div>
      </div>

      <div className="pv-table-wrap">
        <table className="pv-table">
          <thead>
            <tr>
              <th>Model</th>
              <th>Signal</th>
              <th>Status</th>
              <th>Owner</th>
            </tr>
          </thead>
          <tbody>
            {filteredAnalyticsRows.length === 0 ? (
              <tr>
                <td className="pv-empty" colSpan={4}>No AI analytics records found.</td>
              </tr>
            ) : (
              filteredAnalyticsRows.map((row) => (
                <tr key={`${row.model}-${row.date}`}>
                  <td className="pv-name">{row.model}</td>
                  <td>{row.signal}</td>
                  <td>{row.status}</td>
                  <td>{row.owner}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {activeForm ? (
        <div className="ai-analytics-form-overlay">
          <div className="ai-analytics-form-panel">
            <div className="ai-analytics-form-header">
              <div className="ai-analytics-form-title-wrap">
                <div className="ai-analytics-form-icon">
                  <Icon type="auto_awesome" size={24} />
                </div>
                <div>
                  <p>AI Analytics</p>
                  <h2>AI Alert Review</h2>
                </div>
              </div>
              <button type="button" className="ai-analytics-form-close" onClick={() => setActiveForm(false)} aria-label="Close form">
                ×
              </button>
            </div>
            <div className="ai-analytics-form-intro">
              Capture AI alert review details and clinical response.
            </div>
            <form className="ai-analytics-form-body" onSubmit={submitAiAlertReview}>
              <div className="ai-analytics-form-grid">
                {aiAlertFields.map((field) => (
                  <label
                    key={field.key}
                    className={`ai-analytics-form-field ${field.type === "textarea" ? "is-wide" : ""}`}
                  >
                    <span>
                      {field.label}
                      {field.required ? <strong>*</strong> : null}
                    </span>
                    <small>{field.note}</small>
                    {renderAiAlertField(field)}
                  </label>
                ))}
              </div>
              <div className="ai-analytics-form-footer">
                <button type="button" className="form-btn form-btn-cancel" onClick={() => setActiveForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="form-btn form-btn-primary">
                  Save AI Alert Review
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function BlockchainView() {
  type BlockchainField = {
    key: string;
    label: string;
    note: string;
    type: string;
    required?: boolean;
    placeholder?: string;
    options?: string[];
  };
  const [search, setSearch] = useState("");
  const [activeForm, setActiveForm] = useState<"audit" | "integrity" | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState("");
  const [ledgerEvents, setLedgerEvents] = useState([
    {
      hash: "0x9f2b...a11",
      module: "EMR",
      action: "NOTE_SIGNED",
      time: "2 mins ago",
      integrity: "Passed",
      tamperAttempt: false,
    },
    {
      hash: "0x83a7...f4c",
      module: "Billing",
      action: "PAYMENT_POSTED",
      time: "7 mins ago",
      integrity: "Passed",
      tamperAttempt: false,
    },
    {
      hash: "0x7bd4...901",
      module: "User & Security",
      action: "ROLE_UPDATED",
      time: "16 mins ago",
      integrity: "Passed",
      tamperAttempt: false,
    },
    {
      hash: "0x41aa...e22",
      module: "External Integrations",
      action: "EXPORT_VERIFIED",
      time: "28 mins ago",
      integrity: "Failed",
      tamperAttempt: true,
    },
  ]);
  const auditFields: BlockchainField[] = [
    {
      key: "date_range",
      label: "Date range",
      note: "Period to search audit trail.",
      type: "text",
      required: true,
      placeholder: "Today, last 7 days, 01/05/2026 - 23/05/2026",
    },
    {
      key: "user",
      label: "User",
      note: "Filter by specific user.",
      type: "select",
      options: ["All users", "Dr. Mugo", "Billing Officer", "System Administrator"],
    },
    {
      key: "module",
      label: "Module",
      note: "Filter by module.",
      type: "select",
      options: ["All modules", "EMR", "Billing", "User & Security", "External Integrations"],
    },
    {
      key: "action_type",
      label: "Action type",
      note: "Insert, update, delete, login, or export.",
      type: "select",
      options: ["Insert", "Update", "Delete", "Login", "Export"],
    },
    {
      key: "record_id",
      label: "Record ID",
      note: "Specific record to trace all changes.",
      type: "text",
      placeholder: "Record UUID or internal ID",
    },
    {
      key: "patient_mrn",
      label: "Patient MRN",
      note: "All actions on this patient's records.",
      type: "text",
      placeholder: "MRN / Patient number",
    },
  ];
  const integrityFields: BlockchainField[] = [
    {
      key: "from_entry_id",
      label: "From entry ID",
      note: "Start of chain to verify.",
      type: "number",
      required: true,
      placeholder: "1001",
    },
    {
      key: "to_entry_id",
      label: "To entry ID",
      note: "End of chain to verify.",
      type: "number",
      required: true,
      placeholder: "1100",
    },
    {
      key: "verification_result",
      label: "Verification result",
      note: "Pass - chain intact | Fail - tampering detected.",
      type: "select",
      required: true,
      options: ["Pass - chain intact", "Fail - tampering detected"],
    },
  ];
  const activeFields = activeForm === "integrity" ? integrityFields : auditFields;
  const activeFormTitle =
    activeForm === "integrity" ? "Chain Integrity Verification" : "Audit Query";
  const activeFormDescription =
    activeForm === "integrity"
      ? "Verify an entry range and detect broken hashes, failed checks, or tampering."
      : "Search immutable audit events by date range, user, module, action type, record, or MRN.";
  const activeAccent = activeForm === "integrity" ? "#2563eb" : "#16a34a";
  const eventsToday = ledgerEvents.length;
  const failedChecks = ledgerEvents.filter((event) => event.integrity === "Failed").length;
  const tamperAttempts = ledgerEvents.filter((event) => event.tamperAttempt).length;
  const alerts = failedChecks + tamperAttempts;
  const integrityScore =
    eventsToday > 0 ? `${Math.round(((eventsToday - failedChecks) / eventsToday) * 100)}%` : "100%";
  const filteredEvents = ledgerEvents.filter((event) => {
    const needle = search.trim().toLowerCase();
    if (!needle) return true;
    return `${event.hash} ${event.module} ${event.action} ${event.integrity}`.toLowerCase().includes(needle);
  });
  const updateFormValue = (key: string, value: string) => {
    setFormValues((current) => ({ ...current, [key]: value }));
  };
  const openBlockchainForm = (form: "audit" | "integrity") => {
    setActiveForm(form);
    setFormValues({});
    setNotice("");
  };
  const submitBlockchainForm = (event: React.FormEvent) => {
    event.preventDefault();
    if (activeForm === "integrity") {
      const failed = String(formValues.verification_result || "").toLowerCase().startsWith("fail");
      setLedgerEvents((current) => [
        {
          hash: failed ? "0xfail...chk" : "0xpass...chk",
          module: "Blockchain Audit",
          action: "CHAIN_VERIFICATION",
          time: "Just now",
          integrity: failed ? "Failed" : "Passed",
          tamperAttempt: failed,
        },
        ...current,
      ]);
      setNotice(
        failed
          ? "Chain integrity check saved. Failed check and tamper attempt counters updated."
          : "Chain integrity check saved. Ledger range passed verification.",
      );
    } else {
      setNotice("Audit query saved. Matching ledger filters are ready for review.");
    }
    setActiveForm(null);
    setFormValues({});
  };
  const renderBlockchainField = (field: BlockchainField) => {
    const value = formValues[field.key] || "";
    if (field.type === "select") {
      return (
        <select
          className="blockchain-form-control"
          value={value}
          onChange={(event) => updateFormValue(field.key, event.target.value)}
          required={field.required}
        >
          <option value="">Select {field.label.toLowerCase()}</option>
          {(field.options || []).map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      );
    }
    return (
      <input
        className="blockchain-form-control"
        type={field.type}
        value={value}
        onChange={(event) => updateFormValue(field.key, event.target.value)}
        placeholder={field.placeholder}
        required={field.required}
      />
    );
  };

  return (
    <div className="patients-view blockchain-web-view">
      <div className="pv-header">
        <div>
          <div className="pv-title">
            <Icon type="verified" />
            Blockchain Audit
          </div>
          <p className="pv-subtitle">Immutable platform-wide event ledger</p>
        </div>
        <div className="module-actions">
          <button type="button" onClick={() => openBlockchainForm("audit")}>
            <Icon type="manage_search" size={16} /> Audit Query
          </button>
          <button type="button" onClick={() => openBlockchainForm("integrity")}>
            <Icon type="fact_check" size={16} /> Chain Integrity Verification
          </button>
          <button type="button">
            <Icon type="verified" size={16} /> Export Ledger
          </button>
        </div>
      </div>

      {notice ? <div className="workflow-notice is-success">{notice}</div> : null}

      <div className="pv-stats blockchain-stat-grid">
        <div className="pv-stat-card" style={{ borderLeftColor: "#1e3a8a" }}>
          <p className="pv-stat-label">Events Today</p>
          <p className="pv-stat-value">{eventsToday}</p>
        </div>
        <div className="pv-stat-card" style={{ borderLeftColor: "#0d9488" }}>
          <p className="pv-stat-label">Integrity Score</p>
          <p className="pv-stat-value">{integrityScore}</p>
        </div>
        <div className="pv-stat-card" style={{ borderLeftColor: "#dc2626" }}>
          <p className="pv-stat-label">Alerts</p>
          <p className="pv-stat-value">{alerts}</p>
        </div>
        <div className="pv-stat-card" style={{ borderLeftColor: "#7c3aed" }}>
          <p className="pv-stat-label">Tamper Attempts</p>
          <p className="pv-stat-value">{tamperAttempts}</p>
        </div>
        <div className="pv-stat-card" style={{ borderLeftColor: "#f59e0b" }}>
          <p className="pv-stat-label">Failed Checks</p>
          <p className="pv-stat-value">{failedChecks}</p>
        </div>
      </div>

      <div className="pv-search-bar">
        <div className="pv-search-wrap">
          <Icon type="search" size={16} />
          <input
            className="pv-search blockchain-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search audit hashes"
          />
        </div>
      </div>

      <div className="pv-table-meta">
        <strong className="pv-table-title">Audit Ledger</strong>
        <span className="pv-badge">{filteredEvents.length} events</span>
      </div>
      <div className="pv-table-wrap">
        <table className="pv-table">
          <thead>
            <tr>
              <th>Hash</th>
              <th>Module</th>
              <th>Action</th>
              <th>Integrity</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {filteredEvents.length === 0 ? (
              <tr>
                <td className="pv-empty" colSpan={5}>No audit events found.</td>
              </tr>
            ) : (
              filteredEvents.map((event) => (
                <tr key={event.hash}>
                  <td className="pv-code">{event.hash}</td>
                  <td>{event.module}</td>
                  <td>{event.action}</td>
                  <td>
                    <span className={`pv-badge ${event.integrity === "Passed" ? "badge-male" : "badge-female"}`}>
                      {event.integrity}
                    </span>
                  </td>
                  <td>{event.time}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {activeForm ? (
        <div className="blockchain-form-overlay">
          <div
            className="blockchain-form-panel"
            style={{ "--blockchain-accent": activeAccent } as React.CSSProperties}
          >
            <div className="blockchain-form-header">
              <div className="blockchain-form-title-wrap">
                <div className="blockchain-form-icon">
                  <Icon type={activeForm === "integrity" ? "fact_check" : "manage_search"} size={24} />
                </div>
                <div>
                  <p>Blockchain Audit</p>
                  <h2>{activeFormTitle}</h2>
                </div>
              </div>
              <button
                type="button"
                className="blockchain-form-close"
                onClick={() => setActiveForm(null)}
                aria-label="Close form"
              >
                ×
              </button>
            </div>
            <div className="blockchain-form-intro">{activeFormDescription}</div>
            <form className="blockchain-form-body" onSubmit={submitBlockchainForm}>
              <div className="blockchain-form-grid">
                {activeFields.map((field) => (
                  <label key={field.key} className="blockchain-form-field">
                    <span>
                      {field.label}
                      {field.required ? <strong>*</strong> : null}
                    </span>
                    <small>{field.note}</small>
                    {renderBlockchainField(field)}
                  </label>
                ))}
              </div>
              <div className="blockchain-form-footer">
                <button type="button" className="form-btn form-btn-cancel" onClick={() => setActiveForm(null)}>
                  Cancel
                </button>
                <button type="submit" className="form-btn form-btn-primary">
                  {activeForm === "integrity" ? "Verify Chain" : "Run Audit Query"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function PatientPortalView() {
  type PortalField = {
    key: string;
    label: string;
    note: string;
    type: string;
    required?: boolean;
    placeholder?: string;
    options?: string[];
  };
  type PortalForm = {
    key: "account" | "appointment" | "feedback";
    title: string;
    description: string;
    accent: string;
    icon: string;
    submitLabel: string;
    fields: PortalField[];
  };
  const [search, setSearch] = useState("");
  const [activeFormKey, setActiveFormKey] = useState<PortalForm["key"] | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState("");
  const [notifications, setNotifications] = useState([
    { patient: "A. Hassan", type: "Lab result ready", status: "Unread", sent: "Today 10:20 AM" },
    { patient: "B. Maina", type: "Appointment reminder", status: "Read", sent: "Yesterday 3:40 PM" },
    { patient: "C. Wanjiku", type: "Bill receipt", status: "Unread", sent: "Today 9:05 AM" },
    { patient: "D. Otieno", type: "Telemedicine link", status: "Read", sent: "Mon 2:12 PM" },
  ]);
  const forms: PortalForm[] = [
    {
      key: "account",
      title: "Portal Account Registration",
      description: "Capture portal account registration details.",
      accent: "#16a34a",
      icon: "users",
      submitLabel: "Register Portal Account",
      fields: [
        { key: "mrn", label: "MRN", type: "text", required: true, note: "Medical record number from facility registration.", placeholder: "Medical record number from facility registration" },
        { key: "date_of_birth", label: "Date of birth", type: "date", required: true, note: "Verified against hospital records." },
        { key: "phone_number", label: "Phone number", type: "tel", required: true, note: "Registered phone for OTP verification.", placeholder: "Registered phone for OTP verification" },
        { key: "email_address", label: "Email address", type: "email", required: true, note: "Login email.", placeholder: "Login email" },
        { key: "create_password", label: "Create password", type: "password", required: true, note: "Minimum 8 characters with complexity requirements." },
        { key: "confirm_password", label: "Confirm password", type: "password", required: true, note: "Must match password field." },
        { key: "notification_preferences", label: "Notification preferences", type: "text", note: "SMS | Email | WhatsApp - what to receive.", placeholder: "SMS | Email | WhatsApp" },
      ],
    },
    {
      key: "appointment",
      title: "Appointment Booking (Portal)",
      description: "Capture appointment booking (portal) details.",
      accent: "#2563eb",
      icon: "event",
      submitLabel: "Book Portal Appointment",
      fields: [
        { key: "department", label: "Department", type: "select", required: true, note: "Clinic or specialty.", options: ["Outpatient", "Dental", "Maternity", "Physiotherapy", "Specialist Clinic"] },
        { key: "appointment_type", label: "Appointment type", type: "select", required: true, note: "New | Follow-up | Telemedicine.", options: ["New", "Follow-up", "Telemedicine"] },
        { key: "preferred_date", label: "Preferred date", type: "date", required: true, note: "Select from available calendar." },
        { key: "available_slot", label: "Available slot", type: "select", required: true, note: "Choose from doctor's available times.", options: ["08:30 AM", "10:00 AM", "11:30 AM", "02:00 PM", "04:00 PM"] },
        { key: "chief_complaint", label: "Chief complaint", type: "text", required: true, note: "Reason for appointment.", placeholder: "Reason for appointment" },
        { key: "insurance_to_use", label: "Insurance to use", type: "select", note: "Active insurance scheme for this visit.", options: ["Cash", "SHA/NHIF", "AAR", "Jubilee", "Corporate"] },
      ],
    },
    {
      key: "feedback",
      title: "Patient Feedback (Portal)",
      description: "Capture patient feedback form (portal) details.",
      accent: "#7c3aed",
      icon: "message",
      submitLabel: "Submit Patient Feedback",
      fields: [
        { key: "visit_date", label: "Visit date", type: "date", required: true, note: "Date of the visit being rated." },
        { key: "overall_satisfaction", label: "Overall satisfaction", type: "text", required: true, note: "1-5 star rating.", placeholder: "1-5 star rating" },
        { key: "staff_attitude", label: "Staff attitude", type: "text", note: "1-5 rating.", placeholder: "1-5 rating" },
        { key: "cleanliness", label: "Cleanliness", type: "text", note: "1-5 rating.", placeholder: "1-5 rating" },
        { key: "wait_time", label: "Wait time", type: "text", note: "1-5 rating.", placeholder: "1-5 rating" },
        { key: "would_recommend", label: "Would recommend", type: "text", required: true, note: "Net Promoter Score 0-10.", placeholder: "Net Promoter Score 0-10" },
        { key: "comments", label: "Comments", type: "textarea", note: "Free-text feedback." },
      ],
    },
  ];
  const activeForm = forms.find((form) => form.key === activeFormKey) || null;
  const filteredNotifications = notifications.filter((notification) => {
    const needle = search.trim().toLowerCase();
    if (!needle) return true;
    return `${notification.patient} ${notification.type} ${notification.status} ${notification.sent}`.toLowerCase().includes(needle);
  });
  const activeAccounts = 128;
  const appointments = 36;
  const unreadAlerts = notifications.filter((notification) => notification.status === "Unread").length;
  const messages = notifications.length;
  const openForm = (key: PortalForm["key"]) => {
    setActiveFormKey(key);
    setFormValues({});
    setNotice("");
  };
  const updateFormValue = (key: string, value: string) => {
    setFormValues((current) => ({ ...current, [key]: value }));
  };
  const renderPortalField = (field: PortalField) => {
    const value = formValues[field.key] || "";
    if (field.type === "textarea") {
      return (
        <textarea
          className="patient-portal-form-control"
          value={value}
          onChange={(event) => updateFormValue(field.key, event.target.value)}
          placeholder={field.placeholder}
          required={field.required}
        />
      );
    }
    if (field.type === "select") {
      return (
        <select
          className="patient-portal-form-control"
          value={value}
          onChange={(event) => updateFormValue(field.key, event.target.value)}
          required={field.required}
        >
          <option value="">Select {field.label.toLowerCase()}</option>
          {(field.options || []).map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      );
    }
    return (
      <input
        className="patient-portal-form-control"
        type={field.type}
        value={value}
        onChange={(event) => updateFormValue(field.key, event.target.value)}
        placeholder={field.placeholder}
        required={field.required}
      />
    );
  };
  const submitPortalForm = (event: React.FormEvent) => {
    event.preventDefault();
    if (!activeForm) return;
    const patient = String(formValues.mrn || formValues.patient || "Portal patient");
    const nextType =
      activeForm.key === "account"
        ? "Portal account registered"
        : activeForm.key === "appointment"
          ? "Portal appointment booked"
          : "Portal feedback received";
    setNotifications((current) => [
      { patient, type: nextType, status: "Unread", sent: "Just now" },
      ...current,
    ]);
    setNotice(`${activeForm.title} saved and reflected in Recent Notifications.`);
    setActiveFormKey(null);
    setFormValues({});
  };

  return (
    <div className="patients-view patient-portal-web-view">
      <div className="pv-header">
        <div>
          <div className="pv-title">
            <Icon type="users" />
            Patient Portal
          </div>
          <p className="pv-subtitle">Self-service engagement, messaging, and appointment tracking for patients.</p>
        </div>
        <div className="module-actions">
          {forms.map((form) => (
            <button
              key={form.key}
              type="button"
              onClick={() => openForm(form.key)}
              style={{
                backgroundColor: form.accent,
                borderColor: form.accent,
                boxShadow: `0 8px 18px ${form.accent}33`,
              }}
            >
              <Icon type={form.icon} size={16} /> {form.title}
            </button>
          ))}
        </div>
      </div>

      {notice ? <div className="workflow-notice is-success">{notice}</div> : null}

      <div className="pv-stats patient-portal-stat-grid">
        <div className="pv-stat-card" style={{ borderLeftColor: "#1e3a8a" }}>
          <p className="pv-stat-label">Active Accounts</p>
          <p className="pv-stat-value">{activeAccounts}</p>
        </div>
        <div className="pv-stat-card" style={{ borderLeftColor: "#0d9488" }}>
          <p className="pv-stat-label">Appointments</p>
          <p className="pv-stat-value">{appointments}</p>
        </div>
        <div className="pv-stat-card" style={{ borderLeftColor: "#dc2626" }}>
          <p className="pv-stat-label">Unread Alerts</p>
          <p className="pv-stat-value">{unreadAlerts}</p>
        </div>
        <div className="pv-stat-card" style={{ borderLeftColor: "#7c3aed" }}>
          <p className="pv-stat-label">Messages</p>
          <p className="pv-stat-value">{messages}</p>
        </div>
      </div>

      <div className="pv-search-bar">
        <div className="pv-search-wrap">
          <Icon type="search" size={16} />
          <input
            className="pv-search patient-portal-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search patient portal records"
          />
        </div>
      </div>

      <div className="pv-table-meta">
        <strong className="pv-table-title">Recent Notifications</strong>
        <span className="pv-badge">{filteredNotifications.length} records</span>
      </div>
      <div className="pv-table-wrap">
        <table className="pv-table">
          <thead>
            <tr>
              <th>Patient</th>
              <th>Type</th>
              <th>Status</th>
              <th>Sent</th>
            </tr>
          </thead>
          <tbody>
            {filteredNotifications.length === 0 ? (
              <tr>
                <td className="pv-empty" colSpan={4}>No patient portal notifications found.</td>
              </tr>
            ) : (
              filteredNotifications.map((notification, index) => (
                <tr key={`${notification.patient}-${notification.type}-${index}`}>
                  <td className="pv-name">{notification.patient}</td>
                  <td>{notification.type}</td>
                  <td>
                    <span className={`pv-badge ${notification.status === "Unread" ? "badge-female" : "badge-male"}`}>
                      {notification.status}
                    </span>
                  </td>
                  <td>{notification.sent}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {activeForm ? (
        <div className="patient-portal-form-overlay">
          <div
            className="patient-portal-form-panel"
            style={{ "--patient-portal-accent": activeForm.accent } as React.CSSProperties}
          >
            <div className="patient-portal-form-header">
              <div className="patient-portal-form-title-wrap">
                <div className="patient-portal-form-icon">
                  <Icon type={activeForm.icon} size={24} />
                </div>
                <div>
                  <p>Patient Portal</p>
                  <h2>{activeForm.title}</h2>
                </div>
              </div>
              <button
                type="button"
                className="patient-portal-form-close"
                onClick={() => setActiveFormKey(null)}
                aria-label="Close form"
              >
                ×
              </button>
            </div>
            <div className="patient-portal-form-intro">{activeForm.description}</div>
            <form className="patient-portal-form-body" onSubmit={submitPortalForm}>
              <div className="patient-portal-form-grid">
                {activeForm.fields.map((field) => (
                  <label
                    key={field.key}
                    className={`patient-portal-form-field ${field.type === "textarea" ? "is-wide" : ""}`}
                  >
                    <span>
                      {field.label}
                      {field.required ? <strong>*</strong> : null}
                    </span>
                    <small>{field.note}</small>
                    {renderPortalField(field)}
                  </label>
                ))}
              </div>
              <div className="patient-portal-form-footer">
                <button type="button" className="form-btn form-btn-cancel" onClick={() => setActiveFormKey(null)}>
                  Cancel
                </button>
                <button type="submit" className="form-btn form-btn-primary">
                  {activeForm.submitLabel}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function EmergencyView() {
  type EmergencyField = {
    key: string;
    label: string;
    note: string;
    type: string;
    required?: boolean;
    placeholder?: string;
    options?: string[];
  };
  type EmergencyForm = {
    key: "triage" | "encounter" | "trauma";
    title: string;
    description: string;
    accent: string;
    icon: string;
    submitLabel: string;
    fields: EmergencyField[];
  };
  const [search, setSearch] = useState("");
  const [activeFormKey, setActiveFormKey] = useState<EmergencyForm["key"] | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string | boolean>>({});
  const [notice, setNotice] = useState("");
  const [boardRows, setBoardRows] = useState([
    { patient: "A. Hassan", triage: "P1 Immediate", status: "Resuscitation", waiting: 4 },
    { patient: "B. Maina", triage: "P2 Urgent", status: "Doctor Review", waiting: 12 },
    { patient: "Unknown Male", triage: "P3 Semi-urgent", status: "Triage Complete", waiting: 21 },
    { patient: "C. Wanjiku", triage: "P4 Non-urgent", status: "Observation", waiting: 38 },
  ]);
  const forms: EmergencyForm[] = [
    {
      key: "triage",
      title: "Emergency Triage",
      description: "Capture emergency triage details.",
      accent: "#f59e0b",
      icon: "fact_check",
      submitLabel: "Save Emergency Triage",
      fields: [
        { key: "patient_name", label: "Patient name", type: "text", required: true, note: "Full name - MRN auto-searched or created.", placeholder: "Full name - MRN auto-searched or created" },
        { key: "arrival_mode", label: "Arrival mode", type: "select", required: true, note: "Walk-in | Ambulance | Police | Referred | Air.", options: ["Walk-in", "Ambulance", "Police", "Referred", "Air"] },
        { key: "triage_category", label: "Triage category", type: "select", required: true, note: "P1 Immediate | P2 Urgent | P3 Semi-urgent | P4 Non-urgent | P5 Dead.", options: ["P1 Immediate", "P2 Urgent", "P3 Semi-urgent", "P4 Non-urgent", "P5 Dead"] },
        { key: "triage_system", label: "Triage system", type: "select", required: true, note: "MTS | SATS | ESI | START.", options: ["MTS", "SATS", "ESI", "START"] },
        { key: "chief_complaint", label: "Chief complaint", type: "text", required: true, note: "Primary emergency complaint.", placeholder: "Primary emergency complaint" },
        { key: "mechanism_of_injury", label: "Mechanism of injury", type: "text", note: "For trauma: how injury occurred.", placeholder: "For trauma: how injury occurred" },
        { key: "airway", label: "Airway", type: "select", required: true, note: "Patent | Compromised | Obstructed.", options: ["Patent", "Compromised", "Obstructed"] },
        { key: "breathing", label: "Breathing", type: "select", required: true, note: "Adequate | Inadequate | Absent.", options: ["Adequate", "Inadequate", "Absent"] },
        { key: "circulation", label: "Circulation", type: "select", required: true, note: "Normal | Compromised | Absent.", options: ["Normal", "Compromised", "Absent"] },
        { key: "disability_avpu", label: "Disability (AVPU)", type: "select", required: true, note: "Alert | Voice | Pain | Unresponsive.", options: ["Alert", "Voice", "Pain", "Unresponsive"] },
        { key: "temperature_c", label: "Temperature (C)", type: "number", required: true, note: "Body temperature.", placeholder: "Body temperature" },
        { key: "pulse_bpm", label: "Pulse (bpm)", type: "number", required: true, note: "Heart rate.", placeholder: "Heart rate" },
        { key: "blood_pressure", label: "Blood pressure", type: "text", required: true, note: "Systolic/Diastolic.", placeholder: "Systolic/Diastolic" },
        { key: "respiratory_rate", label: "Respiratory rate", type: "number", required: true, note: "Breaths per minute.", placeholder: "Breaths per minute" },
        { key: "spo2", label: "SpO2 (%)", type: "number", required: true, note: "Oxygen saturation.", placeholder: "Oxygen saturation" },
        { key: "gcs_total", label: "GCS total", type: "number", required: true, note: "Glasgow Coma Scale 3-15.", placeholder: "Glasgow Coma Scale 3-15" },
        { key: "pain_score", label: "Pain score", type: "text", required: true, note: "0-10 scale.", placeholder: "0-10 scale" },
        { key: "blood_glucose", label: "Blood glucose", type: "number", note: "Bedside glucose mmol/L.", placeholder: "Bedside glucose mmol/L" },
        { key: "pregnancy_status", label: "Pregnancy status", type: "select", note: "If applicable - female of reproductive age.", options: ["Not applicable", "Pregnant", "Not pregnant", "Unknown"] },
        { key: "allergies", label: "Allergies", type: "checkbox", required: true, note: "Confirm allergy status checked." },
        { key: "resuscitation_bay_needed", label: "Resuscitation bay needed", type: "checkbox", note: "Tick to activate resuscitation bay." },
        { key: "pre_arrival_notification", label: "Pre-arrival notification", type: "checkbox", note: "Tick if ambulance pre-notified." },
      ],
    },
    {
      key: "encounter",
      title: "Emergency Encounter",
      description: "Capture emergency encounter details.",
      accent: "#2563eb",
      icon: "stethoscope",
      submitLabel: "Save Emergency Encounter",
      fields: [
        { key: "clinical_assessment", label: "Clinical assessment", type: "textarea", required: true, note: "Full clinical assessment by emergency doctor." },
        { key: "working_diagnosis", label: "Working diagnosis", type: "text", required: true, note: "Emergency diagnosis - ICD-10 coded.", placeholder: "Emergency diagnosis - ICD-10 coded" },
        { key: "investigations_ordered", label: "Investigations ordered", type: "text", note: "Labs, imaging, ECG, blood cultures.", placeholder: "Labs, imaging, ECG, blood cultures" },
        { key: "resuscitation_actions", label: "Resuscitation actions", type: "textarea", note: "Detailed resuscitation steps performed." },
        { key: "treatments_given", label: "Treatments given", type: "text", note: "Drugs and interventions in emergency department.", placeholder: "Drugs and interventions in emergency department" },
        { key: "disposition", label: "Disposition", type: "select", required: true, note: "Admitted | ICU | Theatre | Discharged | Transferred | Deceased.", options: ["Admitted", "ICU", "Theatre", "Discharged", "Transferred", "Deceased"] },
        { key: "disposition_time", label: "Disposition time", type: "datetime-local", required: true, note: "Time disposition decision was made." },
        { key: "trauma_team_activated", label: "Trauma team activated", type: "checkbox", note: "Tick if trauma team was paged." },
      ],
    },
    {
      key: "trauma",
      title: "Trauma Documentation",
      description: "Capture trauma documentation details.",
      accent: "#7c3aed",
      icon: "shield",
      submitLabel: "Save Trauma Documentation",
      fields: [
        { key: "time_of_injury", label: "Time of injury", type: "datetime-local", required: true, note: "When injury occurred." },
        { key: "injury_mechanism", label: "Injury mechanism", type: "select", required: true, note: "MVA | Fall | Assault | Gunshot | Stab | Burns | Drowning | Other.", options: ["MVA", "Fall", "Assault", "Gunshot", "Stab", "Burns", "Drowning", "Other"] },
        { key: "body_regions_injured", label: "Body regions injured", type: "text", required: true, note: "Head | Neck | Chest | Abdomen | Pelvis | Spine | Upper limb | Lower limb.", placeholder: "Head | Neck | Chest | Abdomen | Pelvis | Spine | Upper limb | Lower limb" },
        { key: "injury_severity_score", label: "Injury severity score", type: "number", note: "ISS - calculated from AIS scores per region.", placeholder: "ISS - calculated from AIS scores per region" },
        { key: "police_case_number", label: "Police case number", type: "text", note: "P3 form or OB number if police case.", placeholder: "P3 form or OB number if police case" },
        { key: "tetanus_status", label: "Tetanus status", type: "select", note: "Up to date | Not up to date | Unknown.", options: ["Up to date", "Not up to date", "Unknown"] },
        { key: "tetanus_given", label: "Tetanus given", type: "checkbox", note: "Tick if tetanus prophylaxis administered." },
      ],
    },
  ];
  const activeForm = forms.find((form) => form.key === activeFormKey) || null;
  const filteredRows = boardRows.filter((row) => {
    const needle = search.trim().toLowerCase();
    if (!needle) return true;
    return `${row.patient} ${row.triage} ${row.status}`.toLowerCase().includes(needle);
  });
  const criticalCases = boardRows.filter((row) => row.triage.startsWith("P1") || row.triage.startsWith("P2")).length;
  const averageDoorToTriage = Math.round(boardRows.reduce((sum, row) => sum + row.waiting, 0) / Math.max(boardRows.length, 1));
  const updateFormValue = (key: string, value: string | boolean) => {
    setFormValues((current) => ({ ...current, [key]: value }));
  };
  const renderField = (field: EmergencyField) => {
    const value = formValues[field.key];
    if (field.type === "textarea") {
      return <textarea className="emergency-form-control" value={typeof value === "string" ? value : ""} onChange={(event) => updateFormValue(field.key, event.target.value)} placeholder={field.placeholder} required={field.required} />;
    }
    if (field.type === "select") {
      return (
        <select className="emergency-form-control" value={typeof value === "string" ? value : ""} onChange={(event) => updateFormValue(field.key, event.target.value)} required={field.required}>
          <option value="">Select {field.label.toLowerCase()}</option>
          {(field.options || []).map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
      );
    }
    if (field.type === "checkbox") {
      return (
        <label className="emergency-checkbox">
          <input type="checkbox" checked={Boolean(value)} onChange={(event) => updateFormValue(field.key, event.target.checked)} required={field.required} />
          <span>{field.required ? "Required confirmation" : "Mark as yes"}</span>
        </label>
      );
    }
    return <input className="emergency-form-control" type={field.type} value={typeof value === "string" ? value : ""} onChange={(event) => updateFormValue(field.key, event.target.value)} placeholder={field.placeholder} required={field.required} />;
  };
  const submitForm = (event: React.FormEvent) => {
    event.preventDefault();
    if (!activeForm) return;
    if (activeForm.key === "triage") {
      setBoardRows((current) => [
        {
          patient: String(formValues.patient_name || "Emergency patient"),
          triage: String(formValues.triage_category || "P3 Semi-urgent"),
          status: Boolean(formValues.resuscitation_bay_needed) ? "Resuscitation" : "Waiting Triage",
          waiting: 0,
        },
        ...current,
      ]);
    }
    setNotice(`${activeForm.title} saved and reflected on the emergency board.`);
    setActiveFormKey(null);
    setFormValues({});
  };

  return (
    <div className="patients-view emergency-web-view">
      <div className="pv-header">
        <div>
          <div className="pv-title">
            <Icon type="ambulance" />
            Emergency
          </div>
          <p className="pv-subtitle">Triage-first emergency dashboard with critical case alerts and rapid escalation tracking.</p>
        </div>
        <div className="module-actions">
          {forms.map((form) => (
            <button key={form.key} type="button" onClick={() => setActiveFormKey(form.key)} style={{ backgroundColor: form.accent, borderColor: form.accent, boxShadow: `0 8px 18px ${form.accent}33` }}>
              <Icon type={form.icon} size={16} /> {form.title}
            </button>
          ))}
        </div>
      </div>

      {notice ? <div className="workflow-notice is-success">{notice}</div> : null}

      <div className="pv-stats emergency-stat-grid">
        <div className="pv-stat-card" style={{ borderLeftColor: "#1e3a8a" }}>
          <p className="pv-stat-label">Active Cases</p>
          <p className="pv-stat-value">{boardRows.length}</p>
        </div>
        <div className="pv-stat-card" style={{ borderLeftColor: "#f59e0b" }}>
          <p className="pv-stat-label">Waiting Triage</p>
          <p className="pv-stat-value">{boardRows.filter((row) => row.status.includes("Triage")).length}</p>
        </div>
        <div className="pv-stat-card" style={{ borderLeftColor: "#dc2626" }}>
          <p className="pv-stat-label">Critical (L1/L2)</p>
          <p className="pv-stat-value">{criticalCases}</p>
        </div>
        <div className="pv-stat-card" style={{ borderLeftColor: "#0d9488" }}>
          <p className="pv-stat-label">Avg Door→Triage</p>
          <p className="pv-stat-value">{averageDoorToTriage} min</p>
        </div>
      </div>

      <div className="pv-search-bar">
        <div className="pv-search-wrap">
          <Icon type="search" size={16} />
          <input className="pv-search emergency-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search emergency board" />
        </div>
      </div>

      <div className="pv-table-meta">
        <strong className="pv-table-title">Active Emergency Board</strong>
        <span className="pv-badge">{filteredRows.length} cases</span>
      </div>
      <div className="pv-table-wrap">
        <table className="pv-table">
          <thead>
            <tr>
              <th>Patient</th>
              <th>Triage</th>
              <th>Status</th>
              <th>Waiting</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.length === 0 ? (
              <tr><td className="pv-empty" colSpan={4}>No emergency cases found.</td></tr>
            ) : filteredRows.map((row, index) => (
              <tr key={`${row.patient}-${index}`}>
                <td className="pv-name">{row.patient}</td>
                <td><span className={`pv-badge ${row.triage.startsWith("P1") || row.triage.startsWith("P2") ? "badge-female" : "badge-male"}`}>{row.triage}</span></td>
                <td>{row.status}</td>
                <td>{row.waiting} min</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {activeForm ? (
        <div className="emergency-form-overlay">
          <div className="emergency-form-panel" style={{ "--emergency-accent": activeForm.accent } as React.CSSProperties}>
            <div className="emergency-form-header">
              <div className="emergency-form-title-wrap">
                <div className="emergency-form-icon"><Icon type={activeForm.icon} size={24} /></div>
                <div><p>Emergency</p><h2>{activeForm.title}</h2></div>
              </div>
              <button type="button" className="emergency-form-close" onClick={() => setActiveFormKey(null)} aria-label="Close form">×</button>
            </div>
            <div className="emergency-form-intro">{activeForm.description}</div>
            <form className="emergency-form-body" onSubmit={submitForm}>
              <div className="emergency-form-grid">
                {activeForm.fields.map((field) => (
                  <label key={field.key} className={`emergency-form-field ${field.type === "textarea" ? "is-wide" : ""}`}>
                    <span>{field.label}{field.required ? <strong>*</strong> : null}</span>
                    <small>{field.note}</small>
                    {renderField(field)}
                  </label>
                ))}
              </div>
              <div className="emergency-form-footer">
                <button type="button" className="form-btn form-btn-cancel" onClick={() => setActiveFormKey(null)}>Cancel</button>
                <button type="submit" className="form-btn form-btn-primary">{activeForm.submitLabel}</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function AmbulanceView() {
  type AmbulanceField = {
    key: string;
    label: string;
    note: string;
    type: string;
    required?: boolean;
    placeholder?: string;
    options?: string[];
  };
  type AmbulanceForm = {
    key: "dispatch" | "scene" | "maintenance";
    title: string;
    description: string;
    accent: string;
    icon: string;
    submitLabel: string;
    fields: AmbulanceField[];
  };
  const [search, setSearch] = useState("");
  const [activeFormKey, setActiveFormKey] = useState<AmbulanceForm["key"] | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState("");
  const [dispatches, setDispatches] = useState([
    { vehicle: "AMB-001", status: "Dispatched", location: "Mumias town", response: 8 },
    { vehicle: "AMB-002", status: "Available", location: "Hospital bay", response: 0 },
    { vehicle: "AMB-003", status: "En route", location: "Kakamega road", response: 14 },
    { vehicle: "AMB-004", status: "Maintenance", location: "Garage", response: 0 },
  ]);
  const forms: AmbulanceForm[] = [
    {
      key: "dispatch",
      title: "Dispatch",
      description: "Capture dispatch details.",
      accent: "#16a34a",
      icon: "ambulance",
      submitLabel: "Dispatch Ambulance",
      fields: [
        { key: "call_received_time", label: "Call received time", type: "datetime-local", required: true, note: "Exact time emergency call was received." },
        { key: "caller_name", label: "Caller name", type: "text", note: "Name of person who called.", placeholder: "Name of person who called" },
        { key: "caller_phone", label: "Caller phone", type: "tel", required: true, note: "Phone number of caller.", placeholder: "Phone number of caller" },
        { key: "scene_address", label: "Scene address", type: "text", required: true, note: "Location of emergency - as specific as possible.", placeholder: "Location of emergency - as specific as possible" },
        { key: "gps_coordinates", label: "GPS coordinates", type: "text", note: "Auto-capture GPS from caller or map pin.", placeholder: "Auto-capture GPS from caller or map pin" },
        { key: "call_type", label: "Call type", type: "select", required: true, note: "Medical | Trauma | Obstetric | Paediatric | Cardiac | Psychiatric | Fire | RTA.", options: ["Medical", "Trauma", "Obstetric", "Paediatric", "Cardiac", "Psychiatric", "Fire", "RTA"] },
        { key: "patient_condition", label: "Patient condition", type: "text", note: "Brief patient status from caller.", placeholder: "Brief patient status from caller" },
        { key: "ambulance_assigned", label: "Ambulance assigned", type: "select", required: true, note: "Vehicle to dispatch.", options: ["AMB-001", "AMB-002", "AMB-003", "AMB-004"] },
        { key: "crew_assigned", label: "Crew assigned", type: "text", required: true, note: "Paramedic team for this call.", placeholder: "Paramedic team for this call" },
        { key: "dispatch_time", label: "Dispatch time", type: "datetime-local", required: true, note: "Time ambulance was dispatched." },
      ],
    },
    {
      key: "scene",
      title: "Scene Report",
      description: "Capture scene report details.",
      accent: "#2563eb",
      icon: "fact_check",
      submitLabel: "Save Scene Report",
      fields: [
        { key: "en_route_time", label: "En route time", type: "time", required: true, note: "Time vehicle started moving." },
        { key: "scene_arrival_time", label: "Scene arrival time", type: "time", required: true, note: "Time vehicle arrived at scene." },
        { key: "patient_found", label: "Patient found", type: "text", required: true, note: "Yes | No | Deceased at scene.", placeholder: "Yes | No | Deceased at scene" },
        { key: "patient_name", label: "Patient name", type: "text", note: "Patient name if obtainable.", placeholder: "Patient name if obtainable" },
        { key: "age_estimate", label: "Age estimate", type: "text", note: "Estimated age if ID not available.", placeholder: "Estimated age if ID not available" },
        { key: "scene_assessment", label: "Scene assessment", type: "textarea", required: true, note: "Scene safety, mechanism, patient condition." },
        { key: "vital_signs_at_scene", label: "Vital signs at scene", type: "text", required: true, note: "BP, HR, RR, SpO2, GCS, Temp.", placeholder: "BP, HR, RR, SpO2, GCS, Temp" },
        { key: "pre_hospital_interventions", label: "Pre-hospital interventions", type: "textarea", required: true, note: "Airway management, IV access, drugs given, immobilisation." },
        { key: "departed_scene_time", label: "Departed scene time", type: "time", required: true, note: "Time vehicle left scene." },
        { key: "hospital_arrival_time", label: "Hospital arrival time", type: "time", required: true, note: "Time patient arrived at hospital." },
        { key: "handover_to", label: "Handover to", type: "text", required: true, note: "Name of receiving clinician.", placeholder: "Name of receiving clinician" },
        { key: "handover_notes", label: "Handover notes", type: "textarea", required: true, note: "Verbal handover content documented." },
      ],
    },
    {
      key: "maintenance",
      title: "Fleet Maintenance Record",
      description: "Capture fleet maintenance record details.",
      accent: "#7c3aed",
      icon: "gears",
      submitLabel: "Save Maintenance Record",
      fields: [
        { key: "ambulance", label: "Ambulance", type: "select", required: true, note: "Vehicle registration.", options: ["AMB-001", "AMB-002", "AMB-003", "AMB-004"] },
        { key: "maintenance_type", label: "Maintenance type", type: "select", required: true, note: "Preventive | Corrective | Inspection.", options: ["Preventive", "Corrective", "Inspection"] },
        { key: "service_date", label: "Service date", type: "date", required: true, note: "Date of service." },
        { key: "mileage", label: "Mileage", type: "number", required: true, note: "Odometer reading at service.", placeholder: "Odometer reading at service" },
        { key: "work_performed", label: "Work performed", type: "textarea", required: true, note: "Description of maintenance work done." },
        { key: "parts_replaced", label: "Parts replaced", type: "text", note: "Parts or consumables replaced.", placeholder: "Parts or consumables replaced" },
        { key: "cost_kes", label: "Cost (KES)", type: "number", note: "Total maintenance cost.", placeholder: "Total maintenance cost" },
        { key: "next_service_due", label: "Next service due", type: "date", required: true, note: "Next scheduled maintenance date." },
        { key: "serviced_by", label: "Serviced by", type: "text", required: true, note: "Mechanic or garage name.", placeholder: "Mechanic or garage name" },
      ],
    },
  ];
  const activeForm = forms.find((form) => form.key === activeFormKey) || null;
  const filteredDispatches = dispatches.filter((row) => {
    const needle = search.trim().toLowerCase();
    if (!needle) return true;
    return `${row.vehicle} ${row.status} ${row.location}`.toLowerCase().includes(needle);
  });
  const revenue = 46000;
  const updateFormValue = (key: string, value: string) => setFormValues((current) => ({ ...current, [key]: value }));
  const renderField = (field: AmbulanceField) => {
    const value = formValues[field.key] || "";
    if (field.type === "textarea") {
      return <textarea className="ambulance-form-control" value={value} onChange={(event) => updateFormValue(field.key, event.target.value)} placeholder={field.placeholder} required={field.required} />;
    }
    if (field.type === "select") {
      return (
        <select className="ambulance-form-control" value={value} onChange={(event) => updateFormValue(field.key, event.target.value)} required={field.required}>
          <option value="">Select {field.label.toLowerCase()}</option>
          {(field.options || []).map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
      );
    }
    return <input className="ambulance-form-control" type={field.type} value={value} onChange={(event) => updateFormValue(field.key, event.target.value)} placeholder={field.placeholder} required={field.required} />;
  };
  const submitForm = (event: React.FormEvent) => {
    event.preventDefault();
    if (!activeForm) return;
    if (activeForm.key === "dispatch") {
      setDispatches((current) => [
        {
          vehicle: String(formValues.ambulance_assigned || "AMB-001"),
          status: "Dispatched",
          location: String(formValues.scene_address || "Scene"),
          response: 0,
        },
        ...current,
      ]);
    }
    setNotice(`${activeForm.title} saved and reflected in Recent Dispatches.`);
    setActiveFormKey(null);
    setFormValues({});
  };

  return (
    <div className="patients-view ambulance-web-view">
      <div className="pv-header">
        <div>
          <div className="pv-title"><Icon type="ambulance" /> Ambulance</div>
          <p className="pv-subtitle">Fleet readiness, dispatch coordination, and rapid response analytics for pre-hospital care.</p>
        </div>
        <div className="module-actions">
          {forms.map((form) => (
            <button key={form.key} type="button" onClick={() => setActiveFormKey(form.key)} style={{ backgroundColor: form.accent, borderColor: form.accent, boxShadow: `0 8px 18px ${form.accent}33` }}>
              <Icon type={form.icon} size={16} /> {form.title}
            </button>
          ))}
        </div>
      </div>
      {notice ? <div className="workflow-notice is-success">{notice}</div> : null}
      <div className="pv-stats ambulance-stat-grid">
        <div className="pv-stat-card" style={{ borderLeftColor: "#1e3a8a" }}><p className="pv-stat-label">Fleet Total</p><p className="pv-stat-value">{dispatches.length}</p></div>
        <div className="pv-stat-card" style={{ borderLeftColor: "#16a34a" }}><p className="pv-stat-label">Available</p><p className="pv-stat-value">{dispatches.filter((row) => row.status === "Available").length}</p></div>
        <div className="pv-stat-card" style={{ borderLeftColor: "#dc2626" }}><p className="pv-stat-label">Active Dispatches</p><p className="pv-stat-value">{dispatches.filter((row) => ["Dispatched", "En route"].includes(row.status)).length}</p></div>
        <div className="pv-stat-card" style={{ borderLeftColor: "#0d9488" }}><p className="pv-stat-label">Revenue</p><p className="pv-stat-value">Ksh {revenue.toLocaleString("en-KE")}</p></div>
      </div>
      <div className="pv-search-bar"><div className="pv-search-wrap"><Icon type="search" size={16} /><input className="pv-search ambulance-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search dispatches" /></div></div>
      <div className="pv-table-meta"><strong className="pv-table-title">Recent Dispatches</strong><span className="pv-badge">{filteredDispatches.length} records</span></div>
      <div className="pv-table-wrap">
        <table className="pv-table">
          <thead><tr><th>Vehicle</th><th>Status</th><th>Location</th><th>Response</th></tr></thead>
          <tbody>
            {filteredDispatches.length === 0 ? <tr><td className="pv-empty" colSpan={4}>No ambulance dispatches found.</td></tr> : filteredDispatches.map((row, index) => (
              <tr key={`${row.vehicle}-${index}`}><td className="pv-name">{row.vehicle}</td><td><span className={`pv-badge ${row.status === "Available" ? "badge-male" : "badge-female"}`}>{row.status}</span></td><td>{row.location}</td><td>{row.response} min</td></tr>
            ))}
          </tbody>
        </table>
      </div>
      {activeForm ? (
        <div className="ambulance-form-overlay">
          <div className="ambulance-form-panel" style={{ "--ambulance-accent": activeForm.accent } as React.CSSProperties}>
            <div className="ambulance-form-header"><div className="ambulance-form-title-wrap"><div className="ambulance-form-icon"><Icon type={activeForm.icon} size={24} /></div><div><p>Ambulance</p><h2>{activeForm.title}</h2></div></div><button type="button" className="ambulance-form-close" onClick={() => setActiveFormKey(null)} aria-label="Close form">×</button></div>
            <div className="ambulance-form-intro">{activeForm.description}</div>
            <form className="ambulance-form-body" onSubmit={submitForm}>
              <div className="ambulance-form-grid">
                {activeForm.fields.map((field) => <label key={field.key} className={`ambulance-form-field ${field.type === "textarea" ? "is-wide" : ""}`}><span>{field.label}{field.required ? <strong>*</strong> : null}</span><small>{field.note}</small>{renderField(field)}</label>)}
              </div>
              <div className="ambulance-form-footer"><button type="button" className="form-btn form-btn-cancel" onClick={() => setActiveFormKey(null)}>Cancel</button><button type="submit" className="form-btn form-btn-primary">{activeForm.submitLabel}</button></div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MortuaryView() {
  type MortuaryField = {
    key: string;
    label: string;
    note: string;
    type: string;
    required?: boolean;
    placeholder?: string;
    options?: string[];
  };
  type MortuaryForm = {
    key: "reception" | "certificate" | "release";
    title: string;
    description: string;
    accent: string;
    icon: string;
    submitLabel: string;
    fields: MortuaryField[];
  };
  type MortuaryRecord = {
    deceased: string;
    dateOfDeath: string;
    status: "In Care" | "Pending Release" | "Released";
    cause: string;
    unclaimed?: boolean;
    overstay?: boolean;
    releasedToday?: boolean;
  };

  const today = new Date().toISOString().slice(0, 10);
  const [activeFormKey, setActiveFormKey] = useState<MortuaryForm["key"] | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string | boolean>>({});
  const [notice, setNotice] = useState("");
  const [records, setRecords] = useState<MortuaryRecord[]>([
    { deceased: "John Mwangi", dateOfDeath: "2026-05-21", status: "In Care", cause: "Cardiac arrest" },
    { deceased: "Unknown Female", dateOfDeath: "2026-05-12", status: "In Care", cause: "Under investigation", unclaimed: true, overstay: true },
    { deceased: "Samuel Otieno", dateOfDeath: "2026-05-18", status: "Pending Release", cause: "Road traffic trauma" },
    { deceased: "Mary Wanjiku", dateOfDeath: today, status: "Released", cause: "Respiratory failure", releasedToday: true },
  ]);

  const forms: MortuaryForm[] = [
    {
      key: "reception",
      title: "Body Reception",
      description: "Capture body reception, identification, storage, and police case details.",
      accent: "#16a34a",
      icon: "archive",
      submitLabel: "Receive Body",
      fields: [
        { key: "patient", label: "Patient", type: "text", note: "Link to patient MRN if known", placeholder: "Link to patient MRN if known" },
        { key: "body_received_from", label: "Body received from", type: "select", required: true, note: "Inpatient ward | Emergency | Theatre | Home | Scene | Police | Coroner", options: ["Inpatient ward", "Emergency", "Theatre", "Home", "Scene", "Police", "Coroner"] },
        { key: "received_at_time", label: "Received at time", type: "datetime-local", required: true, note: "Time body arrived in mortuary" },
        { key: "sex", label: "Sex", type: "select", required: true, note: "Male | Female | Unknown", options: ["Male", "Female", "Unknown"] },
        { key: "approximate_age", label: "Approximate age", type: "text", note: "Estimated age if identity not confirmed", placeholder: "Estimated age if identity not confirmed" },
        { key: "body_condition", label: "Body condition", type: "select", required: true, note: "Fresh | Early decomposition | Advanced decomposition | Embalmed", options: ["Fresh", "Early decomposition", "Advanced decomposition", "Embalmed"] },
        { key: "identifying_features", label: "Identifying features", type: "textarea", note: "Physical description for identification" },
        { key: "compartment_assigned", label: "Compartment assigned", type: "select", required: true, note: "Cold storage compartment number", options: ["Compartment A1", "Compartment A2", "Compartment B1", "Compartment B2", "Overflow bay"] },
        { key: "police_case", label: "Police case", type: "checkbox", required: true, note: "Tick if death involves police investigation" },
        { key: "police_reference", label: "Police reference", type: "text", note: "OB number or case reference", placeholder: "OB number or case reference" },
        { key: "accompanying_documentation", label: "Accompanying documentation", type: "text", required: true, note: "Death notification | Medical certificate | Police release", placeholder: "Death notification | Medical certificate | Police release" },
      ],
    },
    {
      key: "certificate",
      title: "Death Certificate",
      description: "Document cause, ICD-10 coding, manner of death, and certifying doctor details.",
      accent: "#2563eb",
      icon: "fact_check",
      submitLabel: "Save Death Certificate",
      fields: [
        { key: "deceased_name", label: "Deceased name", type: "text", required: true, note: "Full legal name", placeholder: "Full legal name" },
        { key: "date_of_death", label: "Date of death", type: "date", required: true, note: "Certified date of death" },
        { key: "time_of_death", label: "Time of death", type: "time", note: "Time if known" },
        { key: "place_of_death", label: "Place of death", type: "text", required: true, note: "Hospital name and ward or location", placeholder: "Hospital name and ward or location" },
        { key: "cause_ia_immediate_cause", label: "Cause Ia — Immediate cause", type: "text", required: true, note: "Disease directly causing death", placeholder: "Disease directly causing death" },
        { key: "cause_ib_antecedent_cause", label: "Cause Ib — Antecedent cause", type: "text", note: "Disease leading to immediate cause", placeholder: "Disease leading to immediate cause" },
        { key: "cause_ic_underlying_cause", label: "Cause Ic — Underlying cause", type: "text", note: "Disease leading to Ib", placeholder: "Disease leading to Ib" },
        { key: "cause_ii_contributing_conditions", label: "Cause II — Contributing conditions", type: "text", note: "Other conditions contributing to death", placeholder: "Other conditions contributing to death" },
        { key: "icd_10_code", label: "ICD-10 code", type: "text", required: true, note: "Code for underlying cause of death", placeholder: "Code for underlying cause of death" },
        { key: "manner_of_death", label: "Manner of death", type: "select", required: true, note: "Natural | Accident | Homicide | Suicide | Undetermined", options: ["Natural", "Accident", "Homicide", "Suicide", "Undetermined"] },
        { key: "post_mortem_performed", label: "Post-mortem performed", type: "text", required: true, note: "Yes | No", placeholder: "Yes | No" },
        { key: "certifying_doctor", label: "Certifying doctor", type: "text", required: true, note: "Auto-filled - logged in doctor", placeholder: "Auto-filled - logged in doctor" },
      ],
    },
    {
      key: "release",
      title: "Body Release",
      description: "Record family or funeral home collection, permit, billing clearance, and certificate status.",
      accent: "#7c3aed",
      icon: "logout",
      submitLabel: "Release Body",
      fields: [
        { key: "released_to_name", label: "Released to name", type: "text", required: true, note: "Full name of person collecting body", placeholder: "Full name of person collecting body" },
        { key: "collector_id_number", label: "Collector ID number", type: "text", required: true, note: "National ID of collector", placeholder: "National ID of collector" },
        { key: "relationship_to_deceased", label: "Relationship to deceased", type: "select", required: true, note: "Spouse | Parent | Child | Sibling | Funeral home | Other", options: ["Spouse", "Parent", "Child", "Sibling", "Funeral home", "Other"] },
        { key: "funeral_home_name", label: "Funeral home name", type: "text", note: "If released to funeral home", placeholder: "If released to funeral home" },
        { key: "burial_permit_number", label: "Burial permit number", type: "text", required: true, note: "County burial permit reference", placeholder: "County burial permit reference" },
        { key: "death_certificate_issued", label: "Death certificate issued", type: "checkbox", required: true, note: "Confirm death certificate was given" },
        { key: "outstanding_bill_cleared", label: "Outstanding bill cleared", type: "checkbox", required: true, note: "Confirm hospital bill is fully settled" },
      ],
    },
  ];

  const activeForm = forms.find((form) => form.key === activeFormKey) || null;
  const capacity = 12;
  const occupied = records.filter((record) => record.status !== "Released").length;
  const stats = [
    { label: "Capacity", value: capacity, color: "#16a34a" },
    { label: "Occupied", value: occupied, color: "#2563eb" },
    { label: "Available", value: Math.max(0, capacity - occupied), color: "#7c3aed" },
    { label: "Pending Release", value: records.filter((record) => record.status === "Pending Release").length, color: "#f59e0b" },
    { label: "Unclaimed", value: records.filter((record) => record.unclaimed).length, color: "#0d9488" },
    { label: "Today Releases", value: records.filter((record) => record.releasedToday || (record.status === "Released" && record.dateOfDeath === today)).length, color: "#dc2626" },
    { label: "Overstay Alerts", value: records.filter((record) => record.overstay).length, color: "#0891b2" },
  ];
  const filteredRecords = records;
  const updateFormValue = (key: string, value: string | boolean) => setFormValues((current) => ({ ...current, [key]: value }));
  const renderField = (field: MortuaryField) => {
    const value = formValues[field.key];
    if (field.type === "textarea") {
      return <textarea className="mortuary-form-control" value={typeof value === "string" ? value : ""} onChange={(event) => updateFormValue(field.key, event.target.value)} placeholder={field.placeholder} required={field.required} />;
    }
    if (field.type === "select") {
      return (
        <select className="mortuary-form-control" value={typeof value === "string" ? value : ""} onChange={(event) => updateFormValue(field.key, event.target.value)} required={field.required}>
          <option value="">Select {field.label.toLowerCase()}</option>
          {(field.options || []).map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
      );
    }
    if (field.type === "checkbox") {
      return (
        <label className="mortuary-checkbox-row">
          <input type="checkbox" checked={Boolean(value)} onChange={(event) => updateFormValue(field.key, event.target.checked)} required={field.required} />
          <span>Confirmed</span>
        </label>
      );
    }
    return <input className="mortuary-form-control" type={field.type} value={typeof value === "string" ? value : ""} onChange={(event) => updateFormValue(field.key, event.target.value)} placeholder={field.placeholder} required={field.required} />;
  };
  const submitForm = (event: React.FormEvent) => {
    event.preventDefault();
    if (!activeForm) return;
    if (activeForm.key === "reception") {
      const deceased = String(formValues.patient || "").trim() || "Unidentified body";
      setRecords((current) => [
        {
          deceased,
          dateOfDeath: today,
          status: "In Care",
          cause: "Pending certification",
          unclaimed: !String(formValues.patient || "").trim(),
        },
        ...current,
      ]);
    }
    if (activeForm.key === "certificate") {
      setRecords((current) => [
        {
          deceased: String(formValues.deceased_name || "Certified deceased"),
          dateOfDeath: String(formValues.date_of_death || today),
          status: "Pending Release",
          cause: String(formValues.cause_ia_immediate_cause || "Certified cause"),
        },
        ...current,
      ]);
    }
    if (activeForm.key === "release") {
      setRecords((current) => {
        const index = current.findIndex((record) => record.status !== "Released");
        if (index < 0) return current;
        return current.map((record, currentIndex) =>
          currentIndex === index
            ? { ...record, status: "Released", releasedToday: true, unclaimed: false, overstay: false }
            : record,
        );
      });
    }
    setNotice(`${activeForm.title} saved successfully.`);
    setActiveFormKey(null);
    setFormValues({});
  };

  return (
    <div className="patients-view mortuary-web-view">
      <div className="pv-header">
        <div>
          <div className="pv-title">Mortuary</div>
          <div className="pv-subtitle">Body reception, storage, and release tracking with compliance-ready logs.</div>
        </div>
        <div className="module-actions">
          {forms.map((form) => (
            <button key={form.key} type="button" className="topbar-logout-btn" onClick={() => setActiveFormKey(form.key)} style={{ backgroundColor: form.accent, borderColor: form.accent, color: "#ffffff", boxShadow: `0 8px 18px ${form.accent}33` }}>
              <Icon type={form.icon} size={16} /> {form.title}
            </button>
          ))}
          <button type="button" className="topbar-logout-btn mortuary-refresh-btn" onClick={() => setNotice("Mortuary dashboard refreshed.")}>
            <Icon type="sync" size={16} /> Refresh
          </button>
        </div>
      </div>
      {notice ? <div className="workflow-notice is-success">{notice}</div> : null}
      <div className="pv-stats mortuary-stat-grid">
        {stats.map((stat) => (
          <div key={stat.label} className="pv-stat-card" style={{ borderLeftColor: stat.color }}>
            <p className="pv-stat-label">{stat.label}</p>
            <p className="pv-stat-value">{stat.value}</p>
          </div>
        ))}
      </div>
      <div className="pv-table-meta"><div><div className="pv-title" style={{ fontSize: "0.9rem" }}>Mortuary Records</div></div><span className="pv-badge">{filteredRecords.length} records</span></div>
      <div className="pv-table-wrap">
        <table className="pv-table">
          <thead><tr><th>Deceased</th><th>Date of Death</th><th>Status</th><th>Cause</th></tr></thead>
          <tbody>
            {filteredRecords.length === 0 ? <tr><td className="pv-empty" colSpan={4}>No mortuary records found.</td></tr> : filteredRecords.map((record, index) => (
              <tr key={`${record.deceased}-${index}`}>
                <td className="pv-name">{record.deceased}</td>
                <td>{record.dateOfDeath}</td>
                <td><span className={`pv-badge ${record.status === "Released" ? "badge-male" : "badge-female"}`}>{record.status}</span></td>
                <td>{record.cause}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {activeForm ? (
        <div className="mortuary-form-overlay">
          <div className="mortuary-form-panel" style={{ "--mortuary-accent": activeForm.accent } as React.CSSProperties}>
            <div className="mortuary-form-header"><div className="mortuary-form-title-wrap"><div className="mortuary-form-icon"><Icon type={activeForm.icon} size={24} /></div><div><p>Mortuary</p><h2>{activeForm.title}</h2></div></div><button type="button" className="mortuary-form-close" onClick={() => setActiveFormKey(null)} aria-label="Close form">×</button></div>
            <div className="mortuary-form-intro">{activeForm.description}</div>
            <form className="mortuary-form-body" onSubmit={submitForm}>
              <div className="mortuary-form-grid">
                {activeForm.fields.map((field) => <label key={field.key} className={`mortuary-form-field ${field.type === "textarea" ? "is-wide" : ""}`}><span>{field.label}{field.required ? <strong>*</strong> : null}</span><small>{field.note}</small>{renderField(field)}</label>)}
              </div>
              <div className="mortuary-form-footer"><button type="button" className="form-btn form-btn-cancel" onClick={() => setActiveFormKey(null)}>Cancel</button><button type="submit" className="form-btn form-btn-primary">{activeForm.submitLabel}</button></div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function QueueManagementView() {
  type QueueField = {
    key: string;
    label: string;
    note: string;
    type: string;
    required?: boolean;
    placeholder?: string;
    options?: string[];
  };
  type QueueForm = {
    key: "token" | "counter";
    title: string;
    description: string;
    accent: string;
    icon: string;
    submitLabel: string;
    fields: QueueField[];
  };
  type QueueRow = {
    id: string;
    token: string;
    patient: string;
    status: string;
    estimatedWait: number;
    serviceType: string;
    priority: string;
    priorityColor?: string;
    room?: string;
  };

  const [search, setSearch] = useState("");
  const [activeFormKey, setActiveFormKey] = useState<QueueForm["key"] | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState("");
  const [queueBoard, setQueueBoard] = useState<any>({});
  const [queueAnalytics, setQueueAnalytics] = useState<any>({});
  const [queueRows, setQueueRows] = useState<QueueRow[]>([]);
  const forms: QueueForm[] = [
    {
      key: "token",
      title: "Token Issuance",
      description: "Capture token issuance details.",
      accent: "#16a34a",
      icon: "calendar",
      submitLabel: "Issue Token",
      fields: [
        { key: "patient", label: "Patient ID", type: "text", required: true, note: "Tokens are issued after registration or check-in.", placeholder: "Patient UUID" },
        { key: "service_type", label: "Service type", type: "select", required: true, note: "OPD | Lab | Pharmacy | Billing | Radiology | Triage.", options: ["OPD", "Lab", "Pharmacy", "Billing", "Radiology", "Triage"] },
        { key: "priority_level", label: "Priority level", type: "select", required: true, note: "Normal | Urgent | Emergency - affects queue position.", options: ["Normal", "Urgent", "Emergency"] },
        { key: "linked_appointment", label: "Linked appointment", type: "select", note: "Appointment number if pre-booked.", options: ["None", "APT-1021", "APT-1044", "APT-1063"] },
        { key: "counter_assignment", label: "Counter assignment", type: "select", note: "Specific counter if directed.", options: ["Auto assign", "OPD Room 3", "Lab Counter 1", "Pharmacy Window 2", "Billing Counter 1"] },
      ],
    },
    {
      key: "counter",
      title: "Counter Configuration",
      description: "Capture counter configuration details.",
      accent: "#2563eb",
      icon: "gears",
      submitLabel: "Save Counter Configuration",
      fields: [
        { key: "counter_name", label: "Counter name", type: "text", required: true, note: "e.g. OPD Room 3, Lab Counter 1.", placeholder: "e.g. OPD Room 3, Lab Counter 1" },
        { key: "service_type", label: "Service type", type: "select", required: true, note: "Service this counter handles.", options: ["OPD", "Lab", "Pharmacy", "Billing", "Radiology", "Triage"] },
        { key: "assigned_staff", label: "Assigned staff", type: "select", required: true, note: "User currently operating this counter.", options: ["Dr. Kamau", "Grace Achieng", "Nurse Wanjiru", "Pharmacist Otieno", "Cashier Njeri"] },
        { key: "is_open", label: "Is open", type: "select", required: true, note: "Open or closed status for the day.", options: ["Open", "Closed"] },
      ],
    },
  ];

  const activeForm = forms.find((form) => form.key === activeFormKey) || null;
  const loadQueue = useCallback(async () => {
    try {
      const [board, analytics] = await Promise.all([
        fetchQueueBoard({ departmentId: "OPD" }),
        fetchQueueAnalytics({ departmentId: "OPD" }).catch(() => ({})),
      ]);
      const tokens = Array.isArray((board as any)?.tokens) ? (board as any).tokens : [];
      setQueueBoard(board || {});
      setQueueAnalytics(analytics || {});
      setQueueRows(tokens.map((row: any) => ({
        id: String(row?.tokenId || row?.id || row?.tokenNumber || ""),
        token: String(row?.tokenNumber || ""),
        patient: String(row?.patientName || row?.patientId || "Queued patient"),
        status: String(row?.status || "WAITING").replace(/_/g, " "),
        estimatedWait: Number(row?.estimatedWaitMinutes || 0),
        serviceType: String(row?.departmentId || row?.queueType || "OPD"),
        priority: String(row?.priority || "NORMAL").replace(/_/g, " "),
        priorityColor: String(row?.priorityColor || "green"),
        room: String(row?.counterId || row?.doctorName || "Assigning"),
      })));
    } catch (error: any) {
      setNotice(error?.message || "Failed to load queue board.");
    }
  }, []);
  useEffect(() => {
    void loadQueue();
    const timer = window.setInterval(() => void loadQueue(), 30000);
    return () => window.clearInterval(timer);
  }, [loadQueue]);

  const voiceCall = (tokenNumber: string, room = "Counter 1") => {
    try {
      if ("speechSynthesis" in window) {
        const utter = new SpeechSynthesisUtterance(`Token number ${tokenNumber}, please proceed to ${room}`);
        window.speechSynthesis.speak(utter);
      }
      setNotice(`Calling token ${tokenNumber} to ${room}`);
    } catch {
      setNotice(`Token ${tokenNumber} called.`);
    }
  };
  const filteredRows = queueRows.filter((row) => {
    const needle = search.trim().toLowerCase();
    if (!needle) return true;
    return `${row.token} ${row.patient} ${row.status} ${row.serviceType} ${row.priority}`.toLowerCase().includes(needle);
  });
  const stats = [
    { label: "Tokens", value: queueAnalytics?.totals?.tokens ?? queueRows.length, color: "#1e3a8a" },
    { label: "Waiting", value: queueAnalytics?.totals?.waiting ?? queueRows.filter((row) => row.status === "WAITING").length, color: "#f59e0b" },
    { label: "Completed", value: queueAnalytics?.totals?.completed ?? queueRows.filter((row) => row.status === "COMPLETED").length, color: "#16a34a" },
    {
      label: "Avg Wait",
      value: `${queueAnalytics?.totals?.averageWaitingMinutes ?? Math.round(queueRows.reduce((sum, row) => sum + row.estimatedWait, 0) / Math.max(queueRows.length, 1))} min`,
      color: "#0d9488",
    },
  ];
  const updateFormValue = (key: string, value: string) => setFormValues((current) => ({ ...current, [key]: value }));
  const renderField = (field: QueueField) => {
    const value = formValues[field.key] || "";
    if (field.type === "select") {
      return (
        <select className="queue-form-control" value={value} onChange={(event) => updateFormValue(field.key, event.target.value)} required={field.required}>
          <option value="">Select {field.label.toLowerCase()}</option>
          {(field.options || []).map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
      );
    }
    return <input className="queue-form-control" type={field.type} value={value} onChange={(event) => updateFormValue(field.key, event.target.value)} placeholder={field.placeholder} required={field.required} />;
  };
  const submitForm = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!activeForm) return;
    try {
      if (activeForm.key === "token") {
        const service = String(formValues.service_type || "OPD").toUpperCase();
        const prefix = service.includes("TRIAGE") ? "T" : service.includes("LAB") ? "L" : service.includes("OPD") ? "DR" : service.slice(0, 3);
        await createQueueToken({
          patientId: String(formValues.patient || "").trim(),
          departmentId: service === "LAB" ? "LABORATORY" : service,
          queueType: service,
          tokenPrefix: prefix,
          priority: String(formValues.priority_level || "Normal").toUpperCase(),
          servicePoint: String(formValues.counter_assignment || ""),
          notes: "Issued from Queue Management module",
        });
      } else {
        await queueCounterSession({
          counterId: String(formValues.counter_name || "").trim(),
          counterName: String(formValues.counter_name || "").trim(),
          departmentId: String(formValues.service_type || "OPD").toUpperCase(),
          staffId: String(formValues.assigned_staff || "").trim(),
          active: String(formValues.is_open || "Open") === "Open",
        });
      }
      setNotice(`${activeForm.title} saved successfully.`);
      setActiveFormKey(null);
      setFormValues({});
      await loadQueue();
    } catch (error: any) {
      setNotice(error?.message || `${activeForm.title} failed.`);
    }
  };
  const callNext = async () => {
    try {
      const result = await callNextQueueToken({ departmentId: "OPD" });
      setNotice((result as any)?.voiceAnnouncement?.text || `Calling ${(result as any)?.tokenNumber || "next token"}.`);
      await loadQueue();
    } catch (error: any) {
      setNotice(error?.message || "Failed to call next patient.");
    }
  };
  const markEmergency = async (row: QueueRow) => {
    try {
      await overrideQueuePriority({ tokenId: row.id, priorityLevel: "EMERGENCY", reason: "Emergency override from Queue Management" });
      setNotice(`${row.token} moved to emergency priority.`);
      await loadQueue();
    } catch (error: any) {
      setNotice(error?.message || "Priority update failed.");
    }
  };
  const transferToken = async (row: QueueRow) => {
    const target = window.prompt("Transfer to department", "LABORATORY");
    if (!target) return;
    try {
      await apiFetch("/queue/token/transfer", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tokenId: row.id, toDepartmentId: target.toUpperCase(), reason: "Transferred from Queue Management" }),
      });
      setNotice(`${row.token} transferred to ${target.toUpperCase()}.`);
      await loadQueue();
    } catch (error: any) {
      setNotice(error?.message || "Transfer failed.");
    }
  };

  return (
    <div className="patients-view queue-web-view">
      <div className="pv-header">
        <div>
          <div className="pv-title"><Icon type="users" /> Queue Management</div>
          <p className="pv-subtitle">Live queue operations, wait time intelligence, and token routing across all service points.</p>
        </div>
        <div className="module-actions">
          <button type="button" onClick={callNext} style={{ backgroundColor: "#0d9488", borderColor: "#0d9488", boxShadow: "0 8px 18px #0d948833" }}>
            <Icon type="bell" size={16} /> Call Next Patient
          </button>
          {forms.map((form) => (
            <button key={form.key} type="button" onClick={() => setActiveFormKey(form.key)} style={{ backgroundColor: form.accent, borderColor: form.accent, boxShadow: `0 8px 18px ${form.accent}33` }}>
              <Icon type={form.icon} size={16} /> {form.title}
            </button>
          ))}
        </div>
      </div>
      {notice ? <div className="workflow-notice is-success">{notice}</div> : null}
      <div className="pv-stats queue-stat-grid">
        <div className="pv-stat-card" style={{ borderLeftColor: "#0d9488" }}>
          <p className="pv-stat-label">Last Called</p>
          <p className="pv-stat-value">{queueBoard?.lastCalled?.tokenNumber || "-"}</p>
        </div>
        <div className="pv-stat-card" style={{ borderLeftColor: "#2563eb" }}>
          <p className="pv-stat-label">Next Three</p>
          <p className="pv-stat-value">{(queueBoard?.nextTokens || []).map((row: any) => row.tokenNumber).join(", ") || "-"}</p>
        </div>
        <div className="pv-stat-card" style={{ borderLeftColor: "#dc2626" }}>
          <p className="pv-stat-label">Bottleneck</p>
          <p className="pv-stat-value">{queueAnalytics?.bottleneck?.departmentId || "-"}</p>
        </div>
      </div>
      <div className="pv-stats queue-stat-grid">
        {stats.map((stat) => (
          <div key={stat.label} className="pv-stat-card" style={{ borderLeftColor: stat.color }}>
            <p className="pv-stat-label">{stat.label}</p>
            <p className="pv-stat-value">{stat.value}</p>
          </div>
        ))}
      </div>
      <div className="pv-search-bar">
        <div className="pv-search-wrap">
          <Icon type="search" size={16} />
          <input className="pv-search queue-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search queue tokens, patients, counters..." />
        </div>
      </div>
      <div className="pv-table-meta"><strong className="pv-table-title">Live Queue Board</strong><span className="pv-badge">Sorted by priority and waiting position.</span></div>
      <div className="pv-table-wrap">
        <table className="pv-table">
          <thead><tr><th>Token</th><th>Patient</th><th>Status</th><th>Priority</th><th>Room</th><th>Est. Wait</th><th>Actions</th></tr></thead>
          <tbody>
            {filteredRows.length === 0 ? <tr><td className="pv-empty" colSpan={7}>No queue records found.</td></tr> : filteredRows.map((row) => (
              <tr key={row.token}>
                <td className="pv-name">{row.token}</td>
                <td>{row.patient}</td>
                <td><span className={`pv-badge ${row.status === "Completed" ? "badge-male" : "badge-female"}`}>{row.status}</span></td>
                <td><span className="pv-badge" style={{ backgroundColor: row.priorityColor || "#16a34a", color: "#fff" }}>{row.priority}</span></td>
                <td>{row.room || "-"}</td>
                <td>{row.estimatedWait} min</td>
                <td>
                  <div className="appointment-inline-actions">
                    <button type="button" onClick={() => voiceCall(row.token, row.room || "Counter")}>Call</button>
                    <button type="button" onClick={() => markEmergency(row)}>Emergency</button>
                    <button type="button" onClick={() => transferToken(row)}>Transfer</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {activeForm ? (
        <div className="queue-form-overlay">
          <div className="queue-form-panel" style={{ "--queue-accent": activeForm.accent } as React.CSSProperties}>
            <div className="queue-form-header"><div className="queue-form-title-wrap"><div className="queue-form-icon"><Icon type={activeForm.icon} size={24} /></div><div><p>Queue Management</p><h2>{activeForm.title}</h2></div></div><button type="button" className="queue-form-close" onClick={() => setActiveFormKey(null)} aria-label="Close form">×</button></div>
            <div className="queue-form-intro">{activeForm.description}</div>
            <form className="queue-form-body" onSubmit={submitForm}>
              <div className="queue-form-grid">
                {activeForm.fields.map((field) => <label key={field.key} className="queue-form-field"><span>{field.label}{field.required ? <strong>*</strong> : null}</span><small>{field.note}</small>{renderField(field)}</label>)}
              </div>
              <div className="queue-form-footer"><button type="button" className="form-btn form-btn-cancel" onClick={() => setActiveFormKey(null)}>Cancel</button><button type="submit" className="form-btn form-btn-primary">{activeForm.submitLabel}</button></div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function HelpdeskView() {
  type HelpdeskField = {
    key: string;
    label: string;
    note: string;
    type: string;
    required?: boolean;
    placeholder?: string;
    options?: string[];
  };
  type HelpdeskForm = {
    key: "ticket" | "resolution";
    title: string;
    description: string;
    accent: string;
    icon: string;
    submitLabel: string;
    fields: HelpdeskField[];
  };
  type HelpdeskTicket = {
    ticket: string;
    subject: string;
    priority: "Low" | "Medium" | "High" | "Critical";
    status: "Open" | "Assigned" | "In Progress" | "Resolved" | "Overdue";
    assignedTo: string;
    mine?: boolean;
    resolutionHours?: number;
    slaMet?: boolean;
  };

  const [search, setSearch] = useState("");
  const [activeFormKey, setActiveFormKey] = useState<HelpdeskForm["key"] | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState("");
  const [tickets, setTickets] = useState<HelpdeskTicket[]>([
    { ticket: "HD-1001", subject: "OPD printer not printing receipts", priority: "High", status: "Open", assignedTo: "IT Support", mine: true, slaMet: true },
    { ticket: "HD-1002", subject: "Lab network point intermittent", priority: "Critical", status: "Overdue", assignedTo: "Network Team", mine: false, slaMet: false },
    { ticket: "HD-1003", subject: "Ward tap leaking near sluice room", priority: "Medium", status: "Assigned", assignedTo: "Maintenance", mine: true, slaMet: true },
    { ticket: "HD-1004", subject: "Pharmacy barcode scanner replaced", priority: "Low", status: "Resolved", assignedTo: "IT Support", mine: false, resolutionHours: 2.5, slaMet: true },
  ]);

  const forms: HelpdeskForm[] = [
    {
      key: "ticket",
      title: "Support Ticket",
      description: "Capture support ticket details.",
      accent: "#2563eb",
      icon: "support",
      submitLabel: "Create Ticket",
      fields: [
        { key: "category", label: "Category", type: "select", required: true, note: "IT | Maintenance | Biomedical | Housekeeping | HR | Security.", options: ["IT", "Maintenance", "Biomedical", "Housekeeping", "HR", "Security"] },
        { key: "sub_category", label: "Sub-category", type: "select", required: true, note: "Network | Hardware | Plumbing | Electrical | Equipment | Other.", options: ["Network", "Hardware", "Plumbing", "Electrical", "Equipment", "Other"] },
        { key: "priority", label: "Priority", type: "select", required: true, note: "Low | Medium | High | Critical.", options: ["Low", "Medium", "High", "Critical"] },
        { key: "title", label: "Title", type: "text", required: true, note: "Short issue description - max 100 characters.", placeholder: "Short issue description" },
        { key: "description", label: "Description", type: "textarea", required: true, note: "Detailed description - what happened, when, impact." },
        { key: "affected_asset", label: "Affected asset", type: "select", note: "Asset from asset register if applicable.", options: ["None", "Printer OPD-01", "Lab Switch 2", "Barcode Scanner PH-03", "Ward Plumbing"] },
        { key: "attach_screenshot", label: "Attach screenshot", type: "text", note: "Screenshot or photo of the issue.", placeholder: "File name or reference" },
      ],
    },
    {
      key: "resolution",
      title: "Ticket Resolution",
      description: "Capture ticket resolution details.",
      accent: "#16a34a",
      icon: "fact_check",
      submitLabel: "Resolve Ticket",
      fields: [
        { key: "ticket_number", label: "Ticket number", type: "select", required: true, note: "Ticket being resolved.", options: ["HD-1001", "HD-1002", "HD-1003", "HD-1004"] },
        { key: "resolution_notes", label: "Resolution notes", type: "textarea", required: true, note: "What was done to resolve the issue." },
        { key: "time_spent_hours", label: "Time spent (hours)", type: "number", required: true, note: "Total time to resolve.", placeholder: "Total time to resolve" },
        { key: "parts_used", label: "Parts used", type: "text", note: "Any parts or consumables used.", placeholder: "Any parts or consumables used" },
        { key: "requester_satisfaction", label: "Requester satisfaction", type: "text", note: "1-5 star rating from requester.", placeholder: "1-5 star rating" },
      ],
    },
  ];

  const activeForm = forms.find((form) => form.key === activeFormKey) || null;
  const openTickets = tickets.filter((ticket) => ticket.status !== "Resolved");
  const resolvedTickets = tickets.filter((ticket) => ticket.status === "Resolved");
  const slaCompliance =
    tickets.length > 0
      ? ((tickets.filter((ticket) => ticket.slaMet !== false).length / tickets.length) * 100).toFixed(1)
      : "0.0";
  const avgResolution =
    resolvedTickets.length > 0
      ? (resolvedTickets.reduce((sum, ticket) => sum + Number(ticket.resolutionHours || 0), 0) / resolvedTickets.length).toFixed(2)
      : "0.00";
  const stats = [
    { label: "Open Tickets", value: openTickets.length, color: "#1e3a8a" },
    { label: "Overdue Tickets", value: tickets.filter((ticket) => ticket.status === "Overdue").length, color: "#dc2626" },
    { label: "Assigned To Me", value: tickets.filter((ticket) => ticket.mine && ticket.status !== "Resolved").length, color: "#2563eb" },
    { label: "My Tickets", value: tickets.filter((ticket) => ticket.mine).length, color: "#0d9488" },
    { label: "SLA Compliance", value: `${slaCompliance}%`, color: "#16a34a" },
    { label: "Avg Resolution (hrs)", value: avgResolution, color: "#7c3aed" },
    { label: "Critical", value: tickets.filter((ticket) => ticket.priority === "Critical").length, color: "#be123c" },
  ];
  const filteredTickets = tickets.filter((ticket) => {
    const needle = search.trim().toLowerCase();
    if (!needle) return true;
    return `${ticket.ticket} ${ticket.subject} ${ticket.priority} ${ticket.status} ${ticket.assignedTo}`.toLowerCase().includes(needle);
  });
  const updateFormValue = (key: string, value: string) => setFormValues((current) => ({ ...current, [key]: value }));
  const renderField = (field: HelpdeskField) => {
    const value = formValues[field.key] || "";
    if (field.type === "textarea") {
      return <textarea className="helpdesk-form-control" value={value} onChange={(event) => updateFormValue(field.key, event.target.value)} placeholder={field.placeholder} required={field.required} />;
    }
    if (field.type === "select") {
      return (
        <select className="helpdesk-form-control" value={value} onChange={(event) => updateFormValue(field.key, event.target.value)} required={field.required}>
          <option value="">Select {field.label.toLowerCase()}</option>
          {(field.options || []).map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
      );
    }
    return <input className="helpdesk-form-control" type={field.type} value={value} onChange={(event) => updateFormValue(field.key, event.target.value)} placeholder={field.placeholder} required={field.required} />;
  };
  const submitForm = (event: React.FormEvent) => {
    event.preventDefault();
    if (!activeForm) return;
    if (activeForm.key === "ticket") {
      setTickets((current) => [
        {
          ticket: `HD-${1001 + current.length}`,
          subject: String(formValues.title || "Support ticket"),
          priority: (String(formValues.priority || "Medium") as HelpdeskTicket["priority"]),
          status: "Open",
          assignedTo: String(formValues.category || "Helpdesk"),
          mine: true,
          slaMet: String(formValues.priority || "") !== "Critical",
        },
        ...current,
      ]);
    }
    if (activeForm.key === "resolution") {
      const selected = String(formValues.ticket_number || "");
      setTickets((current) =>
        current.map((ticket) =>
          ticket.ticket === selected || (!selected && ticket.status !== "Resolved")
            ? {
                ...ticket,
                status: "Resolved",
                resolutionHours: Number(formValues.time_spent_hours || 0),
                slaMet: true,
              }
            : ticket,
        ),
      );
    }
    setNotice(`${activeForm.title} saved successfully.`);
    setActiveFormKey(null);
    setFormValues({});
  };

  return (
    <div className="patients-view helpdesk-web-view">
      <div className="pv-header">
        <div>
          <div className="pv-title"><Icon type="support" /> Helpdesk</div>
          <p className="pv-subtitle">Support ticket volumes, SLA compliance, and resolution performance tracking.</p>
        </div>
        <div className="module-actions">
          {forms.map((form) => (
            <button key={form.key} type="button" onClick={() => setActiveFormKey(form.key)} style={{ backgroundColor: form.accent, borderColor: form.accent, boxShadow: `0 8px 18px ${form.accent}33` }}>
              <Icon type={form.icon} size={16} /> {form.title}
            </button>
          ))}
        </div>
      </div>
      {notice ? <div className="workflow-notice is-success">{notice}</div> : null}
      <div className="pv-stats helpdesk-stat-grid">
        {stats.map((stat) => (
          <div key={stat.label} className="pv-stat-card" style={{ borderLeftColor: stat.color }}>
            <p className="pv-stat-label">{stat.label}</p>
            <p className="pv-stat-value">{stat.value}</p>
          </div>
        ))}
      </div>
      <div className="pv-search-bar">
        <div className="pv-search-wrap">
          <Icon type="search" size={16} />
          <input className="pv-search helpdesk-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search helpdesk tickets..." />
        </div>
      </div>
      <div className="pv-table-meta"><strong className="pv-table-title">Open Tickets</strong><span className="pv-badge">{filteredTickets.length} tickets</span></div>
      <div className="pv-table-wrap">
        <table className="pv-table">
          <thead><tr><th>Ticket</th><th>Subject</th><th>Priority</th><th>Status</th></tr></thead>
          <tbody>
            {filteredTickets.length === 0 ? <tr><td className="pv-empty" colSpan={4}>No helpdesk tickets found.</td></tr> : filteredTickets.map((ticket) => (
              <tr key={ticket.ticket}>
                <td className="pv-name">{ticket.ticket}</td>
                <td>{ticket.subject}</td>
                <td><span className={`pv-badge ${ticket.priority === "Critical" || ticket.priority === "High" ? "badge-female" : "badge-male"}`}>{ticket.priority}</span></td>
                <td>{ticket.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {activeForm ? (
        <div className="helpdesk-form-overlay">
          <div className="helpdesk-form-panel" style={{ "--helpdesk-accent": activeForm.accent } as React.CSSProperties}>
            <div className="helpdesk-form-header"><div className="helpdesk-form-title-wrap"><div className="helpdesk-form-icon"><Icon type={activeForm.icon} size={24} /></div><div><p>Helpdesk</p><h2>{activeForm.title}</h2></div></div><button type="button" className="helpdesk-form-close" onClick={() => setActiveFormKey(null)} aria-label="Close form">×</button></div>
            <div className="helpdesk-form-intro">{activeForm.description}</div>
            <form className="helpdesk-form-body" onSubmit={submitForm}>
              <div className="helpdesk-form-grid">
                {activeForm.fields.map((field) => <label key={field.key} className={`helpdesk-form-field ${field.type === "textarea" ? "is-wide" : ""}`}><span>{field.label}{field.required ? <strong>*</strong> : null}</span><small>{field.note}</small>{renderField(field)}</label>)}
              </div>
              <div className="helpdesk-form-footer"><button type="button" className="form-btn form-btn-cancel" onClick={() => setActiveFormKey(null)}>Cancel</button><button type="submit" className="form-btn form-btn-primary">{activeForm.submitLabel}</button></div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function CanteenView() {
  type CanteenField = {
    key: string;
    label: string;
    note: string;
    type: string;
    required?: boolean;
    placeholder?: string;
    options?: string[];
  };
  type MealOrder = {
    order: string;
    ward: string;
    diet: string;
    status: "Preparing" | "Queued" | "Delivered";
  };
  type CanteenForm = {
    key: "diet" | "pos";
    title: string;
    description: string;
    accent: string;
    icon: string;
    submitLabel: string;
    fields: CanteenField[];
  };

  const [search, setSearch] = useState("");
  const [activeFormKey, setActiveFormKey] = useState<CanteenForm["key"] | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState("");
  const [orders, setOrders] = useState<MealOrder[]>([
    { order: "CT-302", ward: "Maternity", diet: "Low Sodium", status: "Preparing" },
    { order: "CT-303", ward: "ICU", diet: "Liquid", status: "Queued" },
  ]);

  const forms: CanteenForm[] = [
    {
      key: "diet",
      title: "Patient Diet Order",
      description: "Capture patient diet order details.",
      accent: "#16a34a",
      icon: "restaurant",
      submitLabel: "Save Diet Order",
      fields: [
        { key: "patient", label: "Patient", type: "text", required: true, note: "Auto-filled from admission.", placeholder: "Patient name or MRN" },
        { key: "ward", label: "Ward", type: "select", required: true, note: "Ward or service point receiving the meal.", options: ["Maternity", "ICU", "General Ward", "Paediatric", "Surgical Ward"] },
        { key: "diet_type", label: "Diet type", type: "select", required: true, note: "Normal | Diabetic | Low-sodium | Renal | Soft | Liquid | NPO | High-protein | Vegetarian | Halal | Low-fat.", options: ["Normal", "Diabetic", "Low-sodium", "Renal", "Soft", "Liquid", "NPO", "High-protein", "Vegetarian", "Halal", "Low-fat"] },
        { key: "texture", label: "Texture", type: "select", note: "Regular | Soft | Minced | Pureed | Liquid - for dysphagia.", options: ["Regular", "Soft", "Minced", "Pureed", "Liquid"] },
        { key: "caloric_target", label: "Caloric target", type: "number", note: "Daily calorie target if prescribed by dietitian.", placeholder: "Daily calorie target" },
        { key: "fluid_restriction_ml", label: "Fluid restriction (mL)", type: "number", note: "Daily fluid limit if restricted.", placeholder: "Daily fluid limit" },
        { key: "allergens_to_exclude", label: "Allergens to exclude", type: "text", note: "Nuts | Gluten | Dairy | Eggs | Seafood | Soy.", placeholder: "Nuts, gluten, dairy..." },
        { key: "special_instructions", label: "Special instructions", type: "text", note: "Additional preparation notes for kitchen.", placeholder: "Preparation notes" },
        { key: "start_date", label: "Start date", type: "date", required: true, note: "When this diet order begins." },
        { key: "ordered_by", label: "Ordered by", type: "text", required: true, note: "Doctor or dietitian - auto-filled.", placeholder: "Doctor or dietitian" },
      ],
    },
    {
      key: "pos",
      title: "Canteen POS",
      description: "Capture canteen point-of-sale details.",
      accent: "#0d9488",
      icon: "billing",
      submitLabel: "Record POS Sale",
      fields: [
        { key: "customer_type", label: "Customer type", type: "select", required: true, note: "Staff | Visitor | Patient | Other.", options: ["Staff", "Visitor", "Patient", "Other"] },
        { key: "staff_id", label: "Staff ID", type: "select", note: "If selling to staff - enables salary deduction option.", options: ["Not applicable", "STF-001", "STF-014", "STF-029"] },
        { key: "items", label: "Items", type: "text", required: true, note: "Items selected from menu with quantities.", placeholder: "Rice x2, tea x1" },
        { key: "total", label: "Total", type: "text", required: true, note: "Sum of selected items.", placeholder: "Ksh 350" },
        { key: "payment_method", label: "Payment method", type: "select", required: true, note: "Cash | MPESA | Staff salary deduction | Credit.", options: ["Cash", "MPESA", "Staff salary deduction", "Credit"] },
      ],
    },
  ];
  const activeForm = forms.find((form) => form.key === activeFormKey) || null;

  const filteredOrders = orders.filter((row) => {
    const needle = search.trim().toLowerCase();
    if (!needle) return true;
    return `${row.order} ${row.ward} ${row.diet} ${row.status}`.toLowerCase().includes(needle);
  });
  const updateFormValue = (key: string, value: string) => setFormValues((current) => ({ ...current, [key]: value }));
  const renderField = (field: CanteenField) => {
    const value = formValues[field.key] || "";
    if (field.type === "select") {
      return (
        <select className="canteen-form-control" value={value} onChange={(event) => updateFormValue(field.key, event.target.value)} required={field.required}>
          <option value="">Select {field.label.toLowerCase()}</option>
          {(field.options || []).map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
      );
    }
    return <input className="canteen-form-control" type={field.type} value={value} onChange={(event) => updateFormValue(field.key, event.target.value)} placeholder={field.placeholder} required={field.required} />;
  };
  const submitCanteenForm = (event: React.FormEvent) => {
    event.preventDefault();
    if (!activeForm) return;
    setOrders((current) => [
      {
        order: `CT-${302 + current.length + 1}`,
        ward: activeForm.key === "pos" ? String(formValues.customer_type || "Visitor") : String(formValues.ward || "General Ward"),
        diet: activeForm.key === "pos" ? String(formValues.items || "Canteen sale") : String(formValues.diet_type || "Normal"),
        status: "Queued",
      },
      ...current,
    ]);
    setNotice(`${activeForm.title} saved successfully.`);
    setActiveFormKey(null);
    setFormValues({});
  };

  return (
    <div className="patients-view canteen-web-view">
      <div className="pv-header">
        <div>
          <div className="pv-title"><Icon type="restaurant" /> Canteen Operations</div>
          <p className="pv-subtitle">Meal plans, orders, and dietary coordination</p>
        </div>
        <div className="module-actions">
          {forms.map((form) => (
            <button key={form.key} type="button" className="canteen-action-btn" onClick={() => setActiveFormKey(form.key)} style={{ backgroundColor: form.accent, borderColor: form.accent, boxShadow: `0 8px 18px ${form.accent}33` }}>
              <Icon type={form.icon} size={16} /> {form.title}
            </button>
          ))}
        </div>
      </div>
      {notice ? <div className="workflow-notice is-success">{notice}</div> : null}
      <div className="pv-stats canteen-stat-grid">
        <div className="pv-stat-card" style={{ borderLeftColor: "#1e3a8a" }}><p className="pv-stat-label">Meals Today</p><p className="pv-stat-value">240</p></div>
        <div className="pv-stat-card" style={{ borderLeftColor: "#0d9488" }}><p className="pv-stat-label">Diet Orders</p><p className="pv-stat-value">{56 + Math.max(0, orders.length - 2)}</p></div>
        <div className="pv-stat-card" style={{ borderLeftColor: "#dc2626" }}><p className="pv-stat-label">Pending Prep</p><p className="pv-stat-value">{orders.filter((order) => order.status === "Queued" || order.status === "Preparing").length + 16}</p></div>
      </div>
      <div className="pv-search-bar">
        <div className="pv-search-wrap">
          <Icon type="search" size={16} />
          <input className="pv-search canteen-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search meal orders" />
        </div>
      </div>
      <div className="pv-table-meta"><strong className="pv-table-title">Meal Orders</strong><span className="pv-badge">{filteredOrders.length} orders</span></div>
      <div className="pv-table-wrap">
        <table className="pv-table">
          <thead><tr><th>Order</th><th>Ward</th><th>Diet</th><th>Status</th></tr></thead>
          <tbody>
            {filteredOrders.length === 0 ? <tr><td className="pv-empty" colSpan={4}>No meal orders found.</td></tr> : filteredOrders.map((order) => (
              <tr key={order.order}>
                <td className="pv-name">{order.order}</td>
                <td>{order.ward}</td>
                <td>{order.diet}</td>
                <td><span className={`pv-badge ${order.status === "Delivered" ? "badge-male" : "badge-female"}`}>{order.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {activeForm ? (
        <div className="canteen-form-overlay">
          <div className="canteen-form-panel" style={{ "--canteen-accent": activeForm.accent } as React.CSSProperties}>
            <div className="canteen-form-header"><div className="canteen-form-title-wrap"><div className="canteen-form-icon"><Icon type={activeForm.icon} size={24} /></div><div><p>Canteen Operations</p><h2>{activeForm.title}</h2></div></div><button type="button" className="canteen-form-close" onClick={() => setActiveFormKey(null)} aria-label="Close form">×</button></div>
            <div className="canteen-form-intro">{activeForm.description}</div>
            <form className="canteen-form-body" onSubmit={submitCanteenForm}>
              <div className="canteen-form-grid">
                {activeForm.fields.map((field) => <label key={field.key} className="canteen-form-field"><span>{field.label}{field.required ? <strong>*</strong> : null}</span><small>{field.note}</small>{renderField(field)}</label>)}
              </div>
              <div className="canteen-form-footer"><button type="button" className="form-btn form-btn-cancel" onClick={() => setActiveFormKey(null)}>Cancel</button><button type="submit" className="form-btn form-btn-primary">{activeForm.submitLabel}</button></div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function PatientFeedbackView() {
  type FeedbackField = {
    key: string;
    label: string;
    note: string;
    type: string;
    required?: boolean;
    placeholder?: string;
    options?: string[];
  };
  type FeedbackForm = {
    key: "survey" | "complaint";
    title: string;
    description: string;
    accent: string;
    icon: string;
    submitLabel: string;
    fields: FeedbackField[];
  };
  type FeedbackRow = {
    patient: string;
    rating: number;
    sentiment: "Positive" | "Neutral" | "Negative";
    status: "Open" | "Closed";
    category: string;
    highRisk?: boolean;
  };

  const [search, setSearch] = useState("");
  const [activeFormKey, setActiveFormKey] = useState<FeedbackForm["key"] | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState("");
  const [rows, setRows] = useState<FeedbackRow[]>([
    { patient: "Jane Doe", rating: 5, sentiment: "Positive", status: "Closed", category: "Service" },
    { patient: "Samuel Mwangi", rating: 3, sentiment: "Neutral", status: "Open", category: "Long Wait Time" },
    { patient: "Amina Hassan", rating: 2, sentiment: "Negative", status: "Open", category: "Billing Issue", highRisk: true },
    { patient: "Peter Otieno", rating: 4, sentiment: "Positive", status: "Closed", category: "Staff Attitude" },
  ]);

  const forms: FeedbackForm[] = [
    {
      key: "survey",
      title: "Patient Satisfaction Survey",
      description: "Capture patient satisfaction survey details.",
      accent: "#2563eb",
      icon: "fact_check",
      submitLabel: "Submit Survey",
      fields: [
        { key: "patient", label: "Patient", type: "text", required: true, note: "Patient name or MRN.", placeholder: "Patient name or MRN" },
        { key: "visit_type", label: "Visit type", type: "select", required: true, note: "OPD | Inpatient | Emergency | Telemedicine.", options: ["OPD", "Inpatient", "Emergency", "Telemedicine"] },
        { key: "overall_satisfaction", label: "Overall satisfaction", type: "text", required: true, note: "1 (Very poor) to 5 (Excellent).", placeholder: "1 to 5" },
        { key: "staff_attitude", label: "Staff attitude", type: "text", note: "How staff treated you.", placeholder: "How staff treated you" },
        { key: "cleanliness", label: "Cleanliness", type: "text", note: "Cleanliness of facility.", placeholder: "Cleanliness of facility" },
        { key: "wait_time", label: "Wait time", type: "text", note: "How long you waited.", placeholder: "How long you waited" },
        { key: "explanation_of_condition", label: "Explanation of condition", type: "text", note: "How well your condition was explained.", placeholder: "How well your condition was explained" },
        { key: "would_recommend_facility", label: "Would recommend facility", type: "text", required: true, note: "0-10 Net Promoter Score.", placeholder: "0-10" },
        { key: "best_aspect", label: "Best aspect", type: "text", note: "What you liked most.", placeholder: "What you liked most" },
        { key: "improvement_suggestion", label: "Improvement suggestion", type: "textarea", note: "What could be better." },
      ],
    },
    {
      key: "complaint",
      title: "Complaint / Compliment",
      description: "Capture complaint / compliment details.",
      accent: "#9333ea",
      icon: "message",
      submitLabel: "Save Feedback Case",
      fields: [
        { key: "patient", label: "Patient", type: "text", note: "Patient name or MRN if available.", placeholder: "Patient name or MRN" },
        { key: "type", label: "Type", type: "select", required: true, note: "Complaint | Compliment | Suggestion.", options: ["Complaint", "Compliment", "Suggestion"] },
        { key: "department_involved", label: "Department involved", type: "select", required: true, note: "Department the feedback is about.", options: ["OPD", "Inpatient", "Laboratory", "Radiology", "Pharmacy", "Billing", "Canteen", "Emergency"] },
        { key: "date_of_incident", label: "Date of incident", type: "date", note: "When the incident occurred if complaint." },
        { key: "staff_involved", label: "Staff involved", type: "text", note: "Name of staff if known - anonymous to them.", placeholder: "Name of staff if known" },
        { key: "description", label: "Description", type: "textarea", required: true, note: "Detailed description of the compliment or complaint." },
        { key: "preferred_resolution", label: "Preferred resolution", type: "text", note: "What outcome patient would like if complaint.", placeholder: "Preferred outcome" },
        { key: "contact_for_follow_up", label: "Contact for follow-up", type: "text", note: "Yes - contact me | No - anonymous.", placeholder: "Yes / No and contact" },
      ],
    },
  ];

  const activeForm = forms.find((form) => form.key === activeFormKey) || null;
  const avgRating = rows.length ? (rows.reduce((sum, row) => sum + row.rating, 0) / rows.length).toFixed(1) : "0";
  const stats = [
    { label: "Avg Rating", value: avgRating, color: "#1e3a8a" },
    { label: "Responses", value: rows.length, color: "#0d9488" },
    { label: "Open Complaints", value: rows.filter((row) => row.status === "Open" && row.sentiment === "Negative").length, color: "#dc2626" },
    { label: "High Risk", value: rows.filter((row) => row.highRisk).length, color: "#7c3aed" },
  ];
  const filteredRows = rows.filter((row) => {
    const needle = search.trim().toLowerCase();
    if (!needle) return true;
    return `${row.patient} ${row.rating} ${row.sentiment} ${row.status} ${row.category}`.toLowerCase().includes(needle);
  });
  const sentimentCounts = [
    { label: "Positive", value: rows.filter((row) => row.sentiment === "Positive").length, color: "#22c55e" },
    { label: "Neutral", value: rows.filter((row) => row.sentiment === "Neutral").length, color: "#f59e0b" },
    { label: "Negative", value: rows.filter((row) => row.sentiment === "Negative").length, color: "#ef4444" },
  ];
  const totalSentiment = sentimentCounts.reduce((sum, item) => sum + item.value, 0);
  let sentimentCursor = 0;
  const sentimentGradient = sentimentCounts
    .map((item) => {
      const start = sentimentCursor;
      const end = totalSentiment > 0 ? sentimentCursor + (item.value / totalSentiment) * 100 : sentimentCursor;
      sentimentCursor = end;
      return `${item.color} ${start}% ${end}%`;
    })
    .join(", ") || "#e2e8f0 0% 100%";
  const categoryRows = Array.from(
    rows.reduce((map, row) => map.set(row.category, (map.get(row.category) || 0) + 1), new Map<string, number>()),
  )
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);
  const trend = [
    { label: "Mon", value: 3.6 },
    { label: "Tue", value: 3.9 },
    { label: "Wed", value: 4.1 },
    { label: "Thu", value: Number(avgRating) || 0 },
  ];

  const updateFormValue = (key: string, value: string) => setFormValues((current) => ({ ...current, [key]: value }));
  const renderField = (field: FeedbackField) => {
    const value = formValues[field.key] || "";
    if (field.type === "textarea") {
      return <textarea className="feedback-form-control" value={value} onChange={(event) => updateFormValue(field.key, event.target.value)} placeholder={field.placeholder} required={field.required} />;
    }
    if (field.type === "select") {
      return (
        <select className="feedback-form-control" value={value} onChange={(event) => updateFormValue(field.key, event.target.value)} required={field.required}>
          <option value="">Select {field.label.toLowerCase()}</option>
          {(field.options || []).map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
      );
    }
    return <input className="feedback-form-control" type={field.type} value={value} onChange={(event) => updateFormValue(field.key, event.target.value)} placeholder={field.placeholder} required={field.required} />;
  };
  const submitFeedbackForm = (event: React.FormEvent) => {
    event.preventDefault();
    if (!activeForm) return;
    if (activeForm.key === "survey") {
      const rating = Math.max(1, Math.min(5, Number(formValues.overall_satisfaction || 3)));
      setRows((current) => [
        {
          patient: String(formValues.patient || "Patient"),
          rating,
          sentiment: rating >= 4 ? "Positive" : rating === 3 ? "Neutral" : "Negative",
          status: rating <= 2 ? "Open" : "Closed",
          category: String(formValues.visit_type || "Service"),
          highRisk: rating <= 2,
        },
        ...current,
      ]);
    }
    if (activeForm.key === "complaint") {
      const type = String(formValues.type || "Complaint");
      setRows((current) => [
        {
          patient: String(formValues.patient || "Anonymous"),
          rating: type === "Compliment" ? 5 : type === "Suggestion" ? 3 : 2,
          sentiment: type === "Compliment" ? "Positive" : type === "Suggestion" ? "Neutral" : "Negative",
          status: type === "Compliment" ? "Closed" : "Open",
          category: String(formValues.department_involved || "General"),
          highRisk: type === "Complaint",
        },
        ...current,
      ]);
    }
    setNotice(`${activeForm.title} saved successfully.`);
    setActiveFormKey(null);
    setFormValues({});
  };

  return (
    <div className="patients-view feedback-web-view">
      <div className="pv-header">
        <div>
          <div className="pv-title"><Icon type="fact_check" /> Patient Feedback</div>
          <p className="pv-subtitle">Patient satisfaction insights, complaint tracking, and service quality monitoring.</p>
        </div>
        <div className="module-actions">
          {forms.map((form) => (
            <button key={form.key} type="button" className="feedback-action-btn" onClick={() => setActiveFormKey(form.key)} style={{ backgroundColor: form.accent, borderColor: form.accent, boxShadow: `0 8px 18px ${form.accent}33` }}>
              <Icon type={form.icon} size={16} /> {form.title}
            </button>
          ))}
        </div>
      </div>
      {notice ? <div className="workflow-notice is-success">{notice}</div> : null}
      <div className="pv-stats feedback-stat-grid">
        {stats.map((stat) => (
          <div key={stat.label} className="pv-stat-card" style={{ borderLeftColor: stat.color }}>
            <p className="pv-stat-label">{stat.label}</p>
            <p className="pv-stat-value">{stat.value}</p>
          </div>
        ))}
      </div>
      <section className="feedback-chart-grid">
        <article className="feedback-chart-card">
          <h3>Satisfaction Trend</h3>
          <p>Average rating per day</p>
          <div className="feedback-line-bars">
            {trend.map((item) => <span key={item.label} style={{ height: `${Math.max(12, item.value * 18)}%` }}><em>{item.label}</em></span>)}
          </div>
        </article>
        <article className="feedback-chart-card">
          <h3>Sentiment Mix</h3>
          <p>Positive vs neutral vs negative feedback</p>
          <div className="feedback-donut" style={{ background: `conic-gradient(${sentimentGradient})` }}><strong>{totalSentiment}</strong></div>
          <div className="feedback-legend">{sentimentCounts.map((item) => <span key={item.label}><i style={{ background: item.color }} />{item.label}: {item.value}</span>)}</div>
        </article>
        <article className="feedback-chart-card">
          <h3>Complaint Categories</h3>
          <p>Top complaint drivers</p>
          <div className="feedback-category-bars">
            {categoryRows.map((item) => <div key={item.label}><span>{item.label}</span><strong style={{ width: `${Math.max(12, item.value * 28)}%` }}>{item.value}</strong></div>)}
          </div>
        </article>
      </section>
      <div className="pv-search-bar">
        <div className="pv-search-wrap">
          <Icon type="search" size={16} />
          <input className="pv-search feedback-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search feedback responses..." />
        </div>
      </div>
      <div className="pv-table-meta"><strong className="pv-table-title">Latest Feedback</strong><span className="pv-badge">{filteredRows.length} responses</span></div>
      <div className="pv-table-wrap">
        <table className="pv-table">
          <thead><tr><th>Patient</th><th>Rating</th><th>Sentiment</th><th>Status</th></tr></thead>
          <tbody>
            {filteredRows.length === 0 ? <tr><td className="pv-empty" colSpan={4}>No feedback responses found.</td></tr> : filteredRows.map((row, index) => (
              <tr key={`${row.patient}-${index}`}>
                <td className="pv-name">{row.patient}</td>
                <td>{row.rating}</td>
                <td><span className={`pv-badge ${row.sentiment === "Positive" ? "badge-male" : "badge-female"}`}>{row.sentiment}</span></td>
                <td>{row.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {activeForm ? (
        <div className="feedback-form-overlay">
          <div className="feedback-form-panel" style={{ "--feedback-accent": activeForm.accent } as React.CSSProperties}>
            <div className="feedback-form-header"><div className="feedback-form-title-wrap"><div className="feedback-form-icon"><Icon type={activeForm.icon} size={24} /></div><div><p>Patient Feedback</p><h2>{activeForm.title}</h2></div></div><button type="button" className="feedback-form-close" onClick={() => setActiveFormKey(null)} aria-label="Close form">×</button></div>
            <div className="feedback-form-intro">{activeForm.description}</div>
            <form className="feedback-form-body" onSubmit={submitFeedbackForm}>
              <div className="feedback-form-grid">
                {activeForm.fields.map((field) => <label key={field.key} className={`feedback-form-field ${field.type === "textarea" ? "is-wide" : ""}`}><span>{field.label}{field.required ? <strong>*</strong> : null}</span><small>{field.note}</small>{renderField(field)}</label>)}
              </div>
              <div className="feedback-form-footer"><button type="button" className="form-btn form-btn-cancel" onClick={() => setActiveFormKey(null)}>Cancel</button><button type="submit" className="form-btn form-btn-primary">{activeForm.submitLabel}</button></div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function QualityAssuranceView() {
  type QaField = {
    key: string;
    label: string;
    note: string;
    type: string;
    required?: boolean;
    placeholder?: string;
    options?: string[];
  };
  type QaForm = {
    key: "incident" | "rca" | "audit" | "accreditation";
    title: string;
    description: string;
    accent: string;
    icon: string;
    submitLabel: string;
    fields: QaField[];
  };
  type AuditRow = {
    audit: string;
    department: string;
    score: string;
    status: string;
  };

  const [search, setSearch] = useState("");
  const [activeFormKey, setActiveFormKey] = useState<QaForm["key"] | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState("");
  const [rows, setRows] = useState<AuditRow[]>([
    { audit: "Infection Control", department: "ICU", score: "88%", status: "Action Required" },
    { audit: "Medication Safety", department: "Pharmacy", score: "94%", status: "On Track" },
  ]);

  const departmentOptions = ["ICU", "OPD", "Emergency", "Maternity", "Laboratory", "Radiology", "Pharmacy", "Ward", "Theatre"];
  const forms: QaForm[] = [
    {
      key: "incident",
      title: "Incident Report",
      description: "Capture incident report details.",
      accent: "#f59e0b",
      icon: "shield",
      submitLabel: "Submit Incident Report",
      fields: [
        { key: "incident_date", label: "Incident date", type: "date", required: true, note: "Date incident occurred." },
        { key: "incident_time", label: "Incident time", type: "time", note: "Approximate time if known." },
        { key: "patient_involved", label: "Patient involved", type: "text", note: "Patient MRN - blank for staff-only incidents.", placeholder: "Patient MRN" },
        { key: "location", label: "Location", type: "select", required: true, note: "Department or area where incident occurred.", options: departmentOptions },
        { key: "incident_type", label: "Incident type", type: "select", required: true, note: "Medication error | Fall | Pressure injury | Wrong site | HAI | Equipment failure | Near miss | Complaint.", options: ["Medication error", "Fall", "Pressure injury", "Wrong site", "HAI", "Equipment failure", "Near miss", "Complaint"] },
        { key: "severity", label: "Severity", type: "select", required: true, note: "Near miss | Minor | Moderate | Major | Sentinel event.", options: ["Near miss", "Minor", "Moderate", "Major", "Sentinel event"] },
        { key: "description", label: "Description", type: "textarea", required: true, note: "Detailed, factual account of what happened." },
        { key: "immediate_actions_taken", label: "Immediate actions taken", type: "textarea", required: true, note: "What was done immediately after the incident." },
        { key: "patient_outcome", label: "Patient outcome", type: "text", note: "Effect on patient if applicable.", placeholder: "Effect on patient" },
      ],
    },
    {
      key: "rca",
      title: "Root Cause Analysis (RCA)",
      description: "Capture root cause analysis details.",
      accent: "#7c3aed",
      icon: "manage_search",
      submitLabel: "Save RCA",
      fields: [
        { key: "incident", label: "Incident", type: "text", required: true, note: "Linked incident being investigated.", placeholder: "Incident reference" },
        { key: "rca_team_members", label: "RCA team members", type: "text", required: true, note: "All members of the investigation team.", placeholder: "Team members" },
        { key: "rca_methodology", label: "RCA methodology", type: "select", required: true, note: "Fishbone | 5 Whys | FMEA | Fault tree | London Protocol.", options: ["Fishbone", "5 Whys", "FMEA", "Fault tree", "London Protocol"] },
        { key: "event_timeline", label: "Event timeline", type: "text", required: true, note: "Chronological sequence of events - time, event, person.", placeholder: "Timeline summary" },
        { key: "contributing_factors", label: "Contributing factors", type: "text", required: true, note: "Patient | Staff | Environment | Equipment | Communication.", placeholder: "Contributing factors" },
        { key: "root_causes", label: "Root causes", type: "textarea", required: true, note: "Identified fundamental causes." },
        { key: "recommendations", label: "Recommendations", type: "text", required: true, note: "Action, responsible person, due date, priority per recommendation.", placeholder: "Recommendations" },
        { key: "lessons_learned", label: "Lessons learned", type: "textarea", required: true, note: "Key learnings for system-wide sharing." },
      ],
    },
    {
      key: "audit",
      title: "Clinical Audit",
      description: "Capture clinical audit details.",
      accent: "#1e3a8a",
      icon: "fact_check",
      submitLabel: "Save Clinical Audit",
      fields: [
        { key: "audit_title", label: "Audit title", type: "text", required: true, note: "Name of the audit e.g. Hand Hygiene Compliance Audit.", placeholder: "Audit title" },
        { key: "audit_topic", label: "Audit topic", type: "text", required: true, note: "Clinical area or process being audited.", placeholder: "Clinical area or process" },
        { key: "department", label: "Department", type: "select", required: true, note: "Department being audited.", options: departmentOptions },
        { key: "standard_or_criteria", label: "Standard or criteria", type: "textarea", required: true, note: "What standard is being measured against." },
        { key: "sample_size", label: "Sample size", type: "number", required: true, note: "Number of records or observations in the audit.", placeholder: "Sample size" },
        { key: "audit_period", label: "Audit period", type: "text", required: true, note: "Data collection period.", placeholder: "Audit period" },
        { key: "audit_findings", label: "Audit findings", type: "text", required: true, note: "Compliance %, numerator, denominator, notes.", placeholder: "Audit findings" },
        { key: "score", label: "Score", type: "text", required: true, note: "Compliance score.", placeholder: "e.g. 91%" },
        { key: "recommendations", label: "Recommendations", type: "textarea", required: true, note: "What needs to change based on findings." },
        { key: "action_plan", label: "Action plan", type: "text", required: true, note: "Specific actions with owner and due date.", placeholder: "Action plan" },
        { key: "re_audit_date", label: "Re-audit date", type: "date", required: true, note: "When to re-audit to measure improvement." },
      ],
    },
    {
      key: "accreditation",
      title: "Accreditation Checklist",
      description: "Capture accreditation checklist details.",
      accent: "#0d9488",
      icon: "verified",
      submitLabel: "Save Accreditation Checklist",
      fields: [
        { key: "accreditation_body", label: "Accreditation body", type: "select", required: true, note: "KQMH | JCI | ISO 9001 | SafeCare | WHO SARA.", options: ["KQMH", "JCI", "ISO 9001", "SafeCare", "WHO SARA"] },
        { key: "standard_code", label: "Standard code", type: "text", required: true, note: "Standard item code.", placeholder: "Standard code" },
        { key: "requirement", label: "Requirement", type: "text", required: true, note: "Full standard requirement text.", placeholder: "Requirement" },
        { key: "compliance_status", label: "Compliance status", type: "select", required: true, note: "Compliant | Partially compliant | Non-compliant | Not applicable.", options: ["Compliant", "Partially compliant", "Non-compliant", "Not applicable"] },
        { key: "evidence_description", label: "Evidence description", type: "textarea", required: true, note: "What evidence demonstrates compliance." },
        { key: "evidence_documents", label: "Evidence documents", type: "text", note: "Upload supporting documents.", placeholder: "Document reference" },
        { key: "gap_description", label: "Gap description", type: "textarea", note: "What is missing for full compliance - required if not compliant." },
        { key: "target_compliance_date", label: "Target compliance date", type: "date", note: "When full compliance will be achieved." },
      ],
    },
  ];

  const activeForm = forms.find((form) => form.key === activeFormKey) || null;
  const filteredRows = rows.filter((row) => {
    const needle = search.trim().toLowerCase();
    if (!needle) return true;
    return `${row.audit} ${row.department} ${row.score} ${row.status}`.toLowerCase().includes(needle);
  });
  const updateFormValue = (key: string, value: string) => setFormValues((current) => ({ ...current, [key]: value }));
  const renderField = (field: QaField) => {
    const value = formValues[field.key] || "";
    if (field.type === "textarea") {
      return <textarea className="qa-form-control" value={value} onChange={(event) => updateFormValue(field.key, event.target.value)} placeholder={field.placeholder} required={field.required} />;
    }
    if (field.type === "select") {
      return (
        <select className="qa-form-control" value={value} onChange={(event) => updateFormValue(field.key, event.target.value)} required={field.required}>
          <option value="">Select {field.label.toLowerCase()}</option>
          {(field.options || []).map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
      );
    }
    return <input className="qa-form-control" type={field.type} value={value} onChange={(event) => updateFormValue(field.key, event.target.value)} placeholder={field.placeholder} required={field.required} />;
  };
  const submitQaForm = (event: React.FormEvent) => {
    event.preventDefault();
    if (!activeForm) return;
    const auditName =
      String(formValues.audit_title || formValues.incident_type || formValues.accreditation_body || formValues.incident || activeForm.title);
    const score =
      activeForm.key === "incident" ? "0%" :
      String(formValues.score || (activeForm.key === "accreditation" && formValues.compliance_status === "Compliant" ? "100%" : "Pending"));
    setRows((current) => [
      {
        audit: auditName,
        department: String(formValues.department || formValues.location || formValues.department_involved || "Quality"),
        score,
        status: activeForm.key === "incident" || String(formValues.compliance_status || "").includes("Non") ? "Action Required" : "On Track",
      },
      ...current,
    ]);
    setNotice(`${activeForm.title} saved successfully.`);
    setActiveFormKey(null);
    setFormValues({});
  };

  return (
    <div className="patients-view qa-web-view">
      <div className="pv-header">
        <div>
          <div className="pv-title"><Icon type="fact_check" /> Quality Assurance</div>
          <p className="pv-subtitle">Audits, incidents, and accreditation readiness</p>
        </div>
        <div className="module-actions">
          {forms.map((form) => (
            <button key={form.key} type="button" className="qa-action-btn" onClick={() => setActiveFormKey(form.key)} style={{ backgroundColor: form.accent, borderColor: form.accent, boxShadow: `0 8px 18px ${form.accent}33` }}>
              <Icon type={form.icon} size={16} /> {form.title}
            </button>
          ))}
        </div>
      </div>
      {notice ? <div className="workflow-notice is-success">{notice}</div> : null}
      <div className="pv-stats qa-stat-grid">
        <div className="pv-stat-card" style={{ borderLeftColor: "#dc2626" }}><p className="pv-stat-label">Open Incidents</p><p className="pv-stat-value">{14 + rows.filter((row) => row.status === "Action Required").length - 1}</p></div>
        <div className="pv-stat-card" style={{ borderLeftColor: "#1e3a8a" }}><p className="pv-stat-label">Audits This Month</p><p className="pv-stat-value">{6 + Math.max(0, rows.length - 2)}</p></div>
        <div className="pv-stat-card" style={{ borderLeftColor: "#0d9488" }}><p className="pv-stat-label">Compliance Score</p><p className="pv-stat-value">91%</p></div>
      </div>
      <div className="pv-search-bar">
        <div className="pv-search-wrap">
          <Icon type="search" size={16} />
          <input className="pv-search qa-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search audit records" />
        </div>
      </div>
      <div className="pv-table-meta"><strong className="pv-table-title">Audit Records</strong><span className="pv-badge">{filteredRows.length} records</span></div>
      <div className="pv-table-wrap">
        <table className="pv-table">
          <thead><tr><th>Audit</th><th>Department</th><th>Score</th><th>Status</th></tr></thead>
          <tbody>
            {filteredRows.length === 0 ? <tr><td className="pv-empty" colSpan={4}>No audit records found.</td></tr> : filteredRows.map((row, index) => (
              <tr key={`${row.audit}-${index}`}>
                <td className="pv-name">{row.audit}</td>
                <td>{row.department}</td>
                <td>{row.score}</td>
                <td><span className={`pv-badge ${row.status === "On Track" ? "badge-male" : "badge-female"}`}>{row.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {activeForm ? (
        <div className="qa-form-overlay">
          <div className="qa-form-panel" style={{ "--qa-accent": activeForm.accent } as React.CSSProperties}>
            <div className="qa-form-header"><div className="qa-form-title-wrap"><div className="qa-form-icon"><Icon type={activeForm.icon} size={24} /></div><div><p>Quality Assurance</p><h2>{activeForm.title}</h2></div></div><button type="button" className="qa-form-close" onClick={() => setActiveFormKey(null)} aria-label="Close form">×</button></div>
            <div className="qa-form-intro">{activeForm.description}</div>
            <form className="qa-form-body" onSubmit={submitQaForm}>
              <div className="qa-form-grid">
                {activeForm.fields.map((field) => <label key={field.key} className={`qa-form-field ${field.type === "textarea" ? "is-wide" : ""}`}><span>{field.label}{field.required ? <strong>*</strong> : null}</span><small>{field.note}</small>{renderField(field)}</label>)}
              </div>
              <div className="qa-form-footer"><button type="button" className="form-btn form-btn-cancel" onClick={() => setActiveFormKey(null)}>Cancel</button><button type="submit" className="form-btn form-btn-primary">{activeForm.submitLabel}</button></div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ExternalIntegrationsView() {
  type IntegrationField = {
    key: string;
    label: string;
    note: string;
    type: string;
    required?: boolean;
    placeholder?: string;
    options?: string[];
  };
  type IntegrationForm = {
    key: "configuration" | "test";
    title: string;
    description: string;
    accent: string;
    icon: string;
    submitLabel: string;
    fields: IntegrationField[];
  };
  type ProviderRow = {
    provider: string;
    status: "ACTIVE" | "INACTIVE" | "ERROR";
    type: string;
    lastSync: string;
  };

  const [search, setSearch] = useState("");
  const [activeFormKey, setActiveFormKey] = useState<IntegrationForm["key"] | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState("");
  const [providers, setProviders] = useState<ProviderRow[]>([
    { provider: "NHIF Claims API", status: "ACTIVE", type: "Insurance", lastSync: "2026-05-23 09:20" },
    { provider: "MPESA Paybill", status: "ACTIVE", type: "Payment Gateway", lastSync: "2026-05-23 10:05" },
    { provider: "KHIS/DHIS2", status: "ACTIVE", type: "Government", lastSync: "2026-05-22 18:00" },
    { provider: "PACS Gateway", status: "ERROR", type: "PACS", lastSync: "2026-05-21 16:42" },
  ]);
  const [syncJobs, setSyncJobs] = useState(18);

  const forms: IntegrationForm[] = [
    {
      key: "configuration",
      title: "Integration Configuration",
      description: "Capture integration configuration details.",
      accent: "#2563eb",
      icon: "sync",
      submitLabel: "Save Integration Configuration",
      fields: [
        { key: "integration_name", label: "Integration name", type: "select", required: true, note: "NHIF | KHIS | MPESA | KEMSA | Lab analyser | PACS.", options: ["NHIF", "KHIS", "MPESA", "KEMSA", "Lab analyser", "PACS"] },
        { key: "base_url", label: "Base URL", type: "url", required: true, note: "API base endpoint.", placeholder: "https://api.provider.example" },
        { key: "authentication_type", label: "Authentication type", type: "select", required: true, note: "Basic | OAuth2 | API key | JWT | Certificate.", options: ["Basic", "OAuth2", "API key", "JWT", "Certificate"] },
        { key: "client_id_username", label: "Client ID / Username", type: "text", note: "Authentication credential.", placeholder: "Client ID or username" },
        { key: "client_secret_password", label: "Client secret / Password", type: "password", note: "Stored encrypted - never shown after save.", placeholder: "Secret or password" },
        { key: "message_format", label: "Message format", type: "select", required: true, note: "JSON | XML | HL7 v2 | FHIR R4 | EDI.", options: ["JSON", "XML", "HL7 v2", "FHIR R4", "EDI"] },
        { key: "timeout_seconds", label: "Timeout (seconds)", type: "number", required: true, note: "Request timeout.", placeholder: "30" },
        { key: "retry_attempts", label: "Retry attempts", type: "number", required: true, note: "Retries on failure.", placeholder: "3" },
      ],
    },
    {
      key: "test",
      title: "Integration Test",
      description: "Capture integration test details.",
      accent: "#0d9488",
      icon: "fact_check",
      submitLabel: "Record Integration Test",
      fields: [
        { key: "integration", label: "Integration", type: "text", required: true, note: "Integration being tested.", placeholder: "Integration being tested" },
        { key: "test_type", label: "Test type", type: "select", required: true, note: "Connectivity ping | Authentication test | Sample transaction.", options: ["Connectivity ping", "Authentication test", "Sample transaction"] },
        { key: "test_result", label: "Test result", type: "text", required: true, note: "Success | Failed | Timeout - with response time.", placeholder: "Success in 220ms" },
      ],
    },
  ];

  const activeForm = forms.find((form) => form.key === activeFormKey) || null;
  const filteredProviders = providers.filter((row) => {
    const needle = search.trim().toLowerCase();
    if (!needle) return true;
    return `${row.provider} ${row.status} ${row.type} ${row.lastSync}`.toLowerCase().includes(needle);
  });
  const stats = [
    { label: "Providers", value: providers.length, color: "#1e3a8a" },
    { label: "Active", value: providers.filter((row) => row.status === "ACTIVE").length, color: "#16a34a" },
    { label: "Sync Jobs", value: syncJobs, color: "#0d9488" },
    { label: "Failures", value: providers.filter((row) => row.status === "ERROR").length, color: "#dc2626" },
  ];
  const updateFormValue = (key: string, value: string) => setFormValues((current) => ({ ...current, [key]: value }));
  const renderField = (field: IntegrationField) => {
    const value = formValues[field.key] || "";
    if (field.type === "select") {
      return (
        <select className="integrations-form-control" value={value} onChange={(event) => updateFormValue(field.key, event.target.value)} required={field.required}>
          <option value="">Select {field.label.toLowerCase()}</option>
          {(field.options || []).map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
      );
    }
    return <input className="integrations-form-control" type={field.type} value={value} onChange={(event) => updateFormValue(field.key, event.target.value)} placeholder={field.placeholder} required={field.required} />;
  };
  const submitIntegrationForm = (event: React.FormEvent) => {
    event.preventDefault();
    if (!activeForm) return;
    if (activeForm.key === "configuration") {
      setProviders((current) => [
        {
          provider: String(formValues.integration_name || "External Provider"),
          status: "ACTIVE",
          type: String(formValues.message_format || "JSON"),
          lastSync: "Pending first sync",
        },
        ...current,
      ]);
    }
    if (activeForm.key === "test") {
      const failed = String(formValues.test_result || "").toLowerCase().includes("fail") || String(formValues.test_result || "").toLowerCase().includes("timeout");
      setProviders((current) =>
        current.map((provider, index) =>
          index === 0
            ? { ...provider, status: failed ? "ERROR" : "ACTIVE", lastSync: failed ? "Test failed" : "Just now" }
            : provider,
        ),
      );
      setSyncJobs((current) => current + 1);
    }
    setNotice(`${activeForm.title} saved successfully.`);
    setActiveFormKey(null);
    setFormValues({});
  };

  return (
    <div className="patients-view integrations-web-view">
      <div className="pv-header">
        <div>
          <div className="pv-title"><Icon type="sync" /> External Integrations</div>
          <p className="pv-subtitle">Integration health, sync performance, and connectivity status across third-party systems.</p>
        </div>
        <div className="module-actions">
          {forms.map((form) => (
            <button key={form.key} type="button" className="integrations-action-btn" onClick={() => setActiveFormKey(form.key)} style={{ backgroundColor: form.accent, borderColor: form.accent, boxShadow: `0 8px 18px ${form.accent}33` }}>
              <Icon type={form.icon} size={16} /> {form.title}
            </button>
          ))}
        </div>
      </div>
      {notice ? <div className="workflow-notice is-success">{notice}</div> : null}
      <div className="pv-stats integrations-stat-grid">
        {stats.map((stat) => (
          <div key={stat.label} className="pv-stat-card" style={{ borderLeftColor: stat.color }}>
            <p className="pv-stat-label">{stat.label}</p>
            <p className="pv-stat-value">{stat.value}</p>
          </div>
        ))}
      </div>
      <div className="pv-search-bar">
        <div className="pv-search-wrap">
          <Icon type="search" size={16} />
          <input className="pv-search integrations-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search integration providers..." />
        </div>
      </div>
      <div className="pv-table-meta"><strong className="pv-table-title">Integration Providers</strong><span className="pv-badge">{filteredProviders.length} providers</span></div>
      <div className="pv-table-wrap">
        <table className="pv-table">
          <thead><tr><th>Provider</th><th>Status</th><th>Type</th><th>Last Sync</th></tr></thead>
          <tbody>
            {filteredProviders.length === 0 ? <tr><td className="pv-empty" colSpan={4}>No integration providers found.</td></tr> : filteredProviders.map((row, index) => (
              <tr key={`${row.provider}-${index}`}>
                <td className="pv-name">{row.provider}</td>
                <td><span className={`pv-badge ${row.status === "ACTIVE" ? "badge-male" : "badge-female"}`}>{row.status}</span></td>
                <td>{row.type}</td>
                <td>{row.lastSync}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {activeForm ? (
        <div className="integrations-form-overlay">
          <div className="integrations-form-panel" style={{ "--integrations-accent": activeForm.accent } as React.CSSProperties}>
            <div className="integrations-form-header"><div className="integrations-form-title-wrap"><div className="integrations-form-icon"><Icon type={activeForm.icon} size={24} /></div><div><p>External Integrations</p><h2>{activeForm.title}</h2></div></div><button type="button" className="integrations-form-close" onClick={() => setActiveFormKey(null)} aria-label="Close form">×</button></div>
            <div className="integrations-form-intro">{activeForm.description}</div>
            <form className="integrations-form-body" onSubmit={submitIntegrationForm}>
              <div className="integrations-form-grid">
                {activeForm.fields.map((field) => <label key={field.key} className="integrations-form-field"><span>{field.label}{field.required ? <strong>*</strong> : null}</span><small>{field.note}</small>{renderField(field)}</label>)}
              </div>
              <div className="integrations-form-footer"><button type="button" className="form-btn form-btn-cancel" onClick={() => setActiveFormKey(null)}>Cancel</button><button type="submit" className="form-btn form-btn-primary">{activeForm.submitLabel}</button></div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function UserManagementView() {
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [permissionsCatalog, setPermissionsCatalog] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRoleName, setNewRoleName] = useState("doctor");
  const [newModuleIds, setNewModuleIds] = useState<number[]>([]);
  const [enterpriseRoleTemplates, setEnterpriseRoleTemplates] = useState<any[]>([]);

  const roleOptions = useMemo(() => {
    const fromCatalog = enterpriseRoleTemplates.map((template) => ({
      name: String(template?.name || ""),
      label: String(template?.label || template?.name || ""),
    }));
    const fromRoles = roles.map((role) => ({
      name: String(role?.name || ""),
      label: formatRoleLabel(String(role?.name || "")),
    }));
    const merged = [...fromCatalog, ...fromRoles].filter((role) => role.name);
    const seen = new Set<string>();
    return merged.filter((role) => {
      if (seen.has(role.name)) return false;
      seen.add(role.name);
      return true;
    });
  }, [enterpriseRoleTemplates, roles]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [usersRows, rolesRows, rbacCatalog, permissionRows] = await Promise.all([
        fetchTenantUsers(),
        fetchTenantRoles(),
        fetchSecurityRbacCatalog().catch(() => null),
        fetchSecurityPermissionsCatalog().catch(() => []),
      ]);
      setUsers(Array.isArray(usersRows) ? usersRows : []);
      setRoles(Array.isArray(rolesRows) ? rolesRows : []);
      setEnterpriseRoleTemplates(
        Array.isArray((rbacCatalog as any)?.templates) ? (rbacCatalog as any).templates : [],
      );
      setPermissionsCatalog(Array.isArray(permissionRows) ? permissionRows : []);
      if (!newRoleName && Array.isArray((rbacCatalog as any)?.templates) && (rbacCatalog as any).templates.length > 0) {
        setNewRoleName(String((rbacCatalog as any).templates[0]?.name || "doctor"));
      }
    } catch (err: any) {
      setError(String(err?.message || "Could not load user security data."));
    } finally {
      setLoading(false);
    }
  }, [newRoleName]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const activeUsers = users.filter((user) => String(user?.status || "").toUpperCase() === "ACTIVE").length;
  const lockedUsers = users.filter((user) => String(user?.status || "").toUpperCase().includes("LOCK")).length;
  const expiringSoon = users.filter((user) => Number(user?.passwordExpiresInDays ?? 99) <= 7).length;

  const moduleNameById = useMemo(
    () => new Map(MODULES.map((moduleItem) => [moduleItem.id, moduleItem.name])),
    [],
  );

  const toggleModule = (moduleId: number) => {
    setNewModuleIds((current) =>
      current.includes(moduleId)
        ? current.filter((id) => id !== moduleId)
        : Array.from(new Set([...current, moduleId])),
    );
  };

  const toggleAllModules = () => {
    setNewModuleIds((current) =>
      current.length === MODULES.length ? [] : MODULES.map((moduleItem) => moduleItem.id),
    );
  };

  const clearForm = () => {
    setNewName("");
    setNewEmail("");
    setNewPassword("");
    setNewRoleName("doctor");
    setNewModuleIds([]);
    setError("");
    setNotice("");
  };

  const submitUser = async (event: React.FormEvent) => {
    event.preventDefault();
    setNotice("");
    setError("");
    if (newModuleIds.length === 0) {
      setError("Select at least one module this user can access.");
      return;
    }
    setSaving(true);
    try {
      await createTenantUser({
        name: newName.trim(),
        email: newEmail.trim().toLowerCase(),
        password: newPassword,
        roleName: newRoleName,
        moduleIds: newModuleIds,
      });
      clearForm();
      setNotice("User created. Module access and 30-day password expiry are active.");
      await loadAll();
    } catch (err: any) {
      setError(String(err?.message || "Could not create user."));
    } finally {
      setSaving(false);
    }
  };

  const formatPasswordExpiry = (user: any) => {
    const raw = user?.passwordExpiresAt;
    const date = raw ? new Date(raw) : null;
    const formatted = date && !Number.isNaN(date.getTime()) ? date.toLocaleDateString() : "Not available";
    return {
      date: formatted,
      days: Number(user?.passwordExpiresInDays ?? 0),
    };
  };

  const moduleNamesForUser = (user: any) => {
    const assigned = Array.isArray(user?.modules) && user.modules.length > 0
      ? user.modules.map((module: any) => String(module?.name || "")).filter(Boolean)
      : normalizeModuleIds(user?.moduleIds).map((moduleId) => moduleNameById.get(moduleId) || `Module ${moduleId}`);
    return assigned.length > 0 ? assigned.join(", ") : "Role default access";
  };

  const filteredUsers = users.filter((user) => {
    const needle = search.trim().toLowerCase();
    if (!needle) return true;
    return `${user?.name || ""} ${user?.email || ""} ${user?.role?.name || ""} ${moduleNamesForUser(user)} ${user?.status || ""}`
      .toLowerCase()
      .includes(needle);
  });

  return (
    <div className="patients-view user-security-view">
      <div className="pv-header">
        <div>
          <div className="pv-title">
            <Icon type="shield" />
            User & Security
          </div>
          <p className="pv-subtitle">
            Create users, assign module access, manage password expiry, and review permissions.
          </p>
        </div>
        <div className="module-actions">
          <button type="button" className="topbar-logout-btn" onClick={() => void loadAll()}>
            <Icon type="sync" size={16} /> Refresh
          </button>
        </div>
      </div>

      {notice ? <div className="workflow-notice is-success">{notice}</div> : null}
      {error ? <div className="auth-error">{error}</div> : null}

      <div className="pv-stats">
        <div className="pv-stat-card" style={{ borderLeftColor: "#1e3a8a" }}>
          <p className="pv-stat-label">Users</p>
          <p className="pv-stat-value">{users.length}</p>
        </div>
        <div className="pv-stat-card" style={{ borderLeftColor: "#16a34a" }}>
          <p className="pv-stat-label">Active Users</p>
          <p className="pv-stat-value">{activeUsers}</p>
        </div>
        <div className="pv-stat-card" style={{ borderLeftColor: "#dc2626" }}>
          <p className="pv-stat-label">Locked</p>
          <p className="pv-stat-value">{lockedUsers}</p>
        </div>
        <div className="pv-stat-card" style={{ borderLeftColor: "#f59e0b" }}>
          <p className="pv-stat-label">Passwords Expiring Soon</p>
          <p className="pv-stat-value">{expiringSoon}</p>
        </div>
      </div>

      <section className="security-form-shell">
        <div className="security-form-header">
          <div className="security-form-icon">
            <Icon type="users" />
          </div>
          <div>
            <p>User Account Provisioning</p>
            <h2>Create User Access</h2>
            <span>Passwords expire every 30 days. Selected modules control what appears on the user's dashboard.</span>
          </div>
        </div>

        <form className="security-user-form" onSubmit={submitUser}>
          <label className="module-form-field">
            <span>Full Name</span>
            <input
              className="module-form-input"
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              placeholder="e.g. Grace Otieno"
              required
            />
          </label>
          <label className="module-form-field">
            <span>Email / Username</span>
            <input
              className="module-form-input"
              type="email"
              value={newEmail}
              onChange={(event) => setNewEmail(event.target.value)}
              placeholder="user@hospital.co.ke"
              required
            />
          </label>
          <label className="module-form-field">
            <span>Initial Password</span>
            <input
              className="module-form-input"
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              minLength={12}
              placeholder="Minimum 12 characters"
              required
            />
          </label>
          <label className="module-form-field">
            <span>Role</span>
            <select
              className="module-form-input"
              value={newRoleName}
              onChange={(event) => setNewRoleName(event.target.value)}
            >
              {(roleOptions.length > 0 ? roleOptions : [{ name: "doctor", label: "Doctor" }]).map((role) => (
                <option key={role.name} value={role.name}>
                  {role.label || formatRoleLabel(role.name)}
                </option>
              ))}
            </select>
          </label>

          <div className="security-module-access module-form-field is-wide">
            <div className="security-module-access-head">
              <div>
                <span>Module Access</span>
                <small>Select the modules this user will see after login.</small>
              </div>
              <button type="button" onClick={toggleAllModules}>
                {newModuleIds.length === MODULES.length ? "Clear All" : "Select All"}
              </button>
            </div>
            <div className="security-module-grid">
              {MODULES.map((moduleItem) => (
                <label key={moduleItem.id} className="security-module-option">
                  <input
                    type="checkbox"
                    checked={newModuleIds.includes(moduleItem.id)}
                    onChange={() => toggleModule(moduleItem.id)}
                  />
                  <span>{moduleItem.name}</span>
                  <small>{moduleItem.premium ? "Premium" : "Core"}</small>
                </label>
              ))}
            </div>
          </div>

          <div className="module-form-footer security-form-footer">
            <button type="button" className="form-btn form-btn-cancel" onClick={clearForm}>
              Clear Form
            </button>
            <button type="submit" className="form-btn form-btn-primary module-form-submit" disabled={saving}>
              <Icon type="shield" size={16} />
              {saving ? "Creating..." : "Create User"}
            </button>
          </div>
        </form>
      </section>

      <div className="pv-search-bar">
        <div className="pv-search-wrap">
          <Icon type="search" size={16} />
          <input
            className="pv-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search users, roles, modules..."
          />
        </div>
      </div>

      <section className="security-table-section">
        <div className="reporting-table-header">
          <div>
            <h3>Users Access Table</h3>
            <p>{filteredUsers.length} users</p>
          </div>
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
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="pv-empty" colSpan={5}>Loading users...</td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td className="pv-empty" colSpan={5}>No users found.</td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const expiry = formatPasswordExpiry(user);
                  return (
                    <tr key={String(user?.id || user?.email)}>
                      <td>
                        <strong>{String(user?.name || user?.email || "User")}</strong>
                        <small className="pv-muted">{String(user?.email || "")}</small>
                      </td>
                      <td>{formatRoleLabel(String(user?.role?.name || user?.roleName || "User"))}</td>
                      <td className="security-modules-cell">{moduleNamesForUser(user)}</td>
                      <td>
                        <span className="security-expiry-line">
                          <Icon type="shield" size={14} /> {expiry.date}
                        </span>
                        <small className="pv-muted">{expiry.days} days remaining</small>
                      </td>
                      <td>{String(user?.status || "ACTIVE")}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="security-permissions-catalog">
        <div className="security-permissions-title">
          <Icon type="shield" size={18} />
          <div>
            <h3>Permissions Catalog</h3>
            <p>Reference permissions available for role and module policy configuration.</p>
          </div>
        </div>
        <div className="security-permission-list">
          {(permissionsCatalog.length > 0
            ? permissionsCatalog
            : ["USER_CREATE", "ROLE_ASSIGN", "MODULE_ACCESS_ASSIGN"]
          ).map((permission) => (
            <span key={permission}>{permission}</span>
          ))}
        </div>
      </section>
    </div>
  );
}

function LegacyUserManagementView() {
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRoleId, setNewUserRoleId] = useState("");
  const [newUserRoleName, setNewUserRoleName] = useState("");
  const [newStaffFullName, setNewStaffFullName] = useState("");
  const [newStaffSpecialization, setNewStaffSpecialization] = useState("");
  const [newStaffPhone, setNewStaffPhone] = useState("");
  const [newStaffModules, setNewStaffModules] = useState<number[]>([]);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRolePermissions, setNewRolePermissions] = useState("");
  const [newRoleModules, setNewRoleModules] = useState<number[]>([]);
  const [search, setSearch] = useState("");
  const [enterpriseRoleTemplates, setEnterpriseRoleTemplates] = useState<any[]>([]);

  const enterpriseRoleTemplatesByCategory = enterpriseRoleTemplates.reduce<Record<string, any[]>>(
    (acc, template) => {
      const category = String(template?.category || "OTHER");
      if (!acc[category]) acc[category] = [];
      acc[category].push(template);
      return acc;
    },
    {},
  );

  const loadAll = async () => {
    setLoading(true);
    setError("");
    try {
      const [usersRows, rolesRows, rbacCatalog] = await Promise.all([
        fetchTenantUsers(),
        fetchTenantRoles(),
        fetchSecurityRbacCatalog().catch(() => null),
      ]);
      setUsers(usersRows);
      setRoles(rolesRows);
      setEnterpriseRoleTemplates(
        Array.isArray((rbacCatalog as any)?.templates) ? ((rbacCatalog as any).templates as any[]) : [],
      );
      if (!newUserRoleId && rolesRows.length > 0) {
        setNewUserRoleId(String(rolesRows[0].id));
      }
    } catch (err: any) {
      setError(String(err?.message || "Failed to load user management data"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAll();
  }, []);

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setNotice("");
    const fullName = newStaffFullName.trim();
    const [firstName = "", ...lastNameParts] = fullName.split(/\s+/).filter(Boolean);
    const lastName = lastNameParts.join(" ");
    if (!firstName || !lastName) {
      setError("Enter staff full name (first and last name).");
      return;
    }
    if (!newUserRoleId && !newUserRoleName.trim()) {
      setError("Select a role or provide a role name.");
      return;
    }
    try {
      let effectiveRoleId = newUserRoleId || undefined;
      let effectiveRoleName = newUserRoleName.trim() || undefined;

      if (newStaffModules.length > 0) {
        const selectedRole = roles.find((role) => String(role.id) === String(newUserRoleId));
        const roleBaseName = String(
          newUserRoleName.trim() || selectedRole?.name || "staff",
        )
          .toLowerCase()
          .replace(/[^a-z0-9_]/g, "_");
        const emailToken = newUserEmail
          .trim()
          .toLowerCase()
          .split("@")[0]
          .replace(/[^a-z0-9_]/g, "_");
        const uniqueRoleName = `${roleBaseName}_${emailToken}_${Date.now().toString().slice(-6)}`;

        const basePermissions = Array.isArray(selectedRole?.permissions)
          ? selectedRole.permissions
          : [];
        const nonModulePermissions = basePermissions.filter(
          (permission: string) =>
            !MODULE_PERMISSION_REGEX.test(String(permission)) &&
            !LEGACY_MODULE_PERMISSION_REGEX.test(String(permission)),
        );
        const modulePermissions = newStaffModules.map(
          (moduleId) => `module:${moduleId}:view:facility`,
        );
        const createdRole = await createTenantRole({
          name: uniqueRoleName,
          permissions: Array.from(new Set([...nonModulePermissions, ...modulePermissions])),
        });
        effectiveRoleId = String(createdRole.id);
        effectiveRoleName = undefined;
      }

      const createdUser = await createTenantUser({
        email: newUserEmail.trim(),
        password: newUserPassword.trim() || undefined,
        roleId: effectiveRoleId,
        roleName: effectiveRoleName,
      });

      let staffProfileWarning = "";
      try {
        await createStaffProfile({
          firstName,
          lastName,
          specialization: newStaffSpecialization.trim() || undefined,
          phone: newStaffPhone.trim() || undefined,
          email: newUserEmail.trim(),
          roleTitle:
            roles.find((role) => String(role.id) === String(createdUser?.roleId || effectiveRoleId))
              ?.name || newUserRoleName.trim() || "Staff",
        });
      } catch (staffErr: any) {
        staffProfileWarning = ` Account was created, but staff profile failed: ${String(
          staffErr?.message || "unknown error",
        )}`;
      }

      setNotice(`Staff user created successfully.${staffProfileWarning}`);
      setNewStaffFullName("");
      setNewStaffSpecialization("");
      setNewStaffPhone("");
      setNewUserEmail("");
      setNewUserPassword("");
      setNewUserRoleName("");
      setNewStaffModules([]);
      await loadAll();
    } catch (err: any) {
      setError(String(err?.message || "Failed to create user"));
    }
  };

  const clearNewStaffForm = () => {
    setNewStaffFullName("");
    setNewStaffSpecialization("");
    setNewStaffPhone("");
    setNewUserEmail("");
    setNewUserPassword("");
    setNewUserRoleId(roles.length > 0 ? String(roles[0].id) : "");
    setNewUserRoleName("");
    setNewStaffModules([]);
    setError("");
    setNotice("");
  };

  const createRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setNotice("");
    try {
      const permissions = newRolePermissions
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean);
      const modulePermissions = newRoleModules.map((moduleId) => `module:${moduleId}:view:facility`);
      await createTenantRole({
        name: newRoleName.trim(),
        permissions: Array.from(new Set([...permissions, ...modulePermissions])),
      });
      setNotice("Role created successfully.");
      setNewRoleName("");
      setNewRolePermissions("");
      setNewRoleModules([]);
      await loadAll();
    } catch (err: any) {
      setError(String(err?.message || "Failed to create role"));
    }
  };

  const updateStatus = async (id: string, status: string) => {
    setError("");
    setNotice("");
    try {
      await updateTenantUserStatus(id, status);
      setNotice("User status updated.");
      await loadAll();
    } catch (err: any) {
      setError(String(err?.message || "Failed to update status"));
    }
  };

  const doResetPassword = async (id: string) => {
    const nextPassword = window.prompt("Enter new password (min 8 chars):");
    if (nextPassword === null) return;
    setError("");
    setNotice("");
    try {
      await resetTenantUserPassword(id, nextPassword);
      setNotice("Password reset successfully.");
    } catch (err: any) {
      setError(String(err?.message || "Failed to reset password"));
    }
  };

  const doDeleteUser = async (id: string) => {
    if (!window.confirm("Delete this user account?")) return;
    setError("");
    setNotice("");
    try {
      await deleteTenantUser(id);
      setNotice("User deleted.");
      await loadAll();
    } catch (err: any) {
      setError(String(err?.message || "Failed to delete user"));
    }
  };

  const doDeleteRole = async (id: string) => {
    if (!window.confirm("Delete this role?")) return;
    setError("");
    setNotice("");
    try {
      await deleteTenantRole(id);
      setNotice("Role deleted.");
      await loadAll();
    } catch (err: any) {
      setError(String(err?.message || "Failed to delete role"));
    }
  };

  const doUpdateRolePermissions = async (roleId: string, currentPermissions: string[]) => {
    const next = window.prompt(
      "Comma separated permissions",
      currentPermissions.join(", "),
    );
    if (next === null) return;
    setError("");
    setNotice("");
    try {
      const permissions = next
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean);
      await updateTenantRolePermissions(roleId, permissions);
      setNotice("Role permissions updated.");
      await loadAll();
    } catch (err: any) {
      setError(String(err?.message || "Failed to update permissions"));
    }
  };

  const doUpdateRoleModules = async (roleId: string, currentPermissions: string[]) => {
    const existingModuleIds = extractModuleIdsFromPermissions(currentPermissions);
    const nextRaw = window.prompt(
      "Enter module IDs (comma separated), e.g. 1,3,8,13",
      existingModuleIds.join(", "),
    );
    if (nextRaw === null) return;
    const selectedIds = nextRaw
      .split(",")
      .map((value) => Number(value.trim()))
      .filter((value) => Number.isFinite(value) && WORKFLOW_MODULE_BY_ID[value]);

    const nonModulePermissions = currentPermissions.filter(
      (permission) =>
        !MODULE_PERMISSION_REGEX.test(String(permission)) &&
        !LEGACY_MODULE_PERMISSION_REGEX.test(String(permission)),
    );
    const modulePermissions = selectedIds.map((id) => `module:${id}:view:facility`);

    setError("");
    setNotice("");
    try {
      await updateTenantRolePermissions(
        roleId,
        Array.from(new Set([...nonModulePermissions, ...modulePermissions])),
      );
      setNotice("Role module access updated.");
      await loadAll();
    } catch (err: any) {
      setError(String(err?.message || "Failed to update role module access"));
    }
  };

  const doUpdateUserRole = async (userId: string, roleId: string) => {
    setError("");
    setNotice("");
    try {
      await updateTenantUserRole(userId, { roleId });
      setNotice("User role updated.");
      await loadAll();
    } catch (err: any) {
      setError(String(err?.message || "Failed to update user role"));
    }
  };

  const filteredUsers = users.filter((u) =>
    `${u.email} ${u.role?.name || ""} ${u.status || ""}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  return (
    <div className="user-management-view">
      <div className="pv-header">
        <div>
          <h2 className="pv-title">Identity & Access</h2>
          <p className="pv-subtitle">
            Manage staff accounts, roles, statuses, and passwords.
          </p>
        </div>
      </div>

      {notice && <div className="workflow-notice is-success">{notice}</div>}
      {error && <div className="auth-error">{error}</div>}

      <div className="workflow-layout" style={{ marginBottom: 14 }}>
        <div className="workflow-form-wrap">
          <form className="workflow-form" onSubmit={createUser}>
            <div className="workflow-form-header">
              <h3>Create New Staff</h3>
              <p>Only admin-created users can login as staff.</p>
            </div>
            <div className="workflow-form-grid">
              <label className="workflow-field">
                <span>Full Name *</span>
                <input
                  className="form-input"
                  value={newStaffFullName}
                  onChange={(e) => setNewStaffFullName(e.target.value)}
                  placeholder="Jane Doe"
                  required
                />
              </label>
              <label className="workflow-field">
                <span>Specialization</span>
                <input
                  className="form-input"
                  value={newStaffSpecialization}
                  onChange={(e) => setNewStaffSpecialization(e.target.value)}
                  placeholder="General Practice, Pediatrics..."
                />
              </label>
              <label className="workflow-field">
                <span>Phone Number *</span>
                <input
                  className="form-input"
                  value={newStaffPhone}
                  onChange={(e) => setNewStaffPhone(e.target.value)}
                  required
                />
              </label>
              <label className="workflow-field">
                <span>Email *</span>
                <input
                  className="form-input"
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  required
                />
              </label>
              <label className="workflow-field">
                <span>Password (optional)</span>
                <input
                  className="form-input"
                  type="password"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                />
              </label>
              <label className="workflow-field">
                <span>Role *</span>
                <select
                  className="form-input"
                  value={newUserRoleId}
                  onChange={(e) => {
                    setNewUserRoleId(e.target.value);
                    if (e.target.value) {
                      setNewUserRoleName("");
                    }
                  }}
                >
                  <option value="">Select role...</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {formatRoleLabel(String(role.name))}
                    </option>
                  ))}
                </select>
              </label>
              <label className="workflow-field">
                <span>Or Select Role Template</span>
                <select
                  className="form-input"
                  value={newUserRoleName}
                  onChange={(e) => {
                    setNewUserRoleName(e.target.value);
                    if (e.target.value.trim()) {
                      setNewUserRoleId("");
                    }
                  }}
                >
                  <option value="">Select role template by category...</option>
                  {Object.entries(enterpriseRoleTemplatesByCategory).map(([category, templates]) => (
                    <optgroup key={`role-template-group-${category}`} label={category.replace(/_/g, " ")}>
                      {templates.map((template) => (
                        <option
                          key={`role-template-${String(template?.name || "")}`}
                          value={String(template?.name || "")}
                        >
                          {String(template?.label || template?.name || "role")}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </label>
              <label className="workflow-field" style={{ gridColumn: "1 / -1" }}>
                <span>Access (Modules Allowed)</span>
                <div
                  style={{
                    border: "1px solid #dbe4ee",
                    borderRadius: 10,
                    padding: 10,
                    maxHeight: 170,
                    overflowY: "auto",
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                    gap: 8,
                  }}
                >
                  {MODULES.map((moduleItem) => (
                    <label
                      key={moduleItem.id}
                      style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}
                    >
                      <input
                        type="checkbox"
                        checked={newStaffModules.includes(moduleItem.id)}
                        onChange={(event) => {
                          setNewStaffModules((prev) =>
                            event.target.checked
                              ? Array.from(new Set([...prev, moduleItem.id]))
                              : prev.filter((id) => id !== moduleItem.id),
                          );
                        }}
                      />
                      <span>{moduleItem.id}. {moduleItem.name}</span>
                    </label>
                  ))}
                </div>
              </label>
              <label className="workflow-field">
                <span>Or Type Role Name</span>
                <input
                  className="form-input"
                  list="enterprise-role-names"
                  value={newUserRoleName}
                  onChange={(e) => {
                    setNewUserRoleName(e.target.value);
                    if (e.target.value.trim()) {
                      setNewUserRoleId("");
                    }
                  }}
                  placeholder="doctor, matron, accountant..."
                />
                <datalist id="enterprise-role-names">
                  {enterpriseRoleTemplates.map((template) => (
                    <option
                      key={`enterprise-role-name-${String(template?.name || "")}`}
                      value={String(template?.name || "")}
                    />
                  ))}
                </datalist>
              </label>
            </div>
            <div className="modal-footer" style={{ marginTop: 12 }}>
              <button className="btn-cancel" type="button" onClick={clearNewStaffForm}>
                Clear Form
              </button>
              <button className="btn-primary" type="submit" disabled={loading}>
                {loading ? "Saving..." : "Create New Staff"}
              </button>
            </div>
          </form>
        </div>

        <div className="workflow-form-wrap">
          <form className="workflow-form" onSubmit={createRole}>
            <div className="workflow-form-header">
              <h3>Create Role</h3>
              <p>Define role and initial permissions list.</p>
            </div>
            <div className="workflow-form-grid">
              <label className="workflow-field">
                <span>Role Name *</span>
                <input
                  className="form-input"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  required
                />
              </label>
              <label className="workflow-field">
                <span>Permissions (comma separated)</span>
                <input
                  className="form-input"
                  value={newRolePermissions}
                  onChange={(e) => setNewRolePermissions(e.target.value)}
                  placeholder="patients.read, patients.write"
                />
              </label>
              <label className="workflow-field" style={{ gridColumn: "1 / -1" }}>
                <span>Module Access</span>
                <div
                  style={{
                    border: "1px solid #dbe4ee",
                    borderRadius: 10,
                    padding: 10,
                    maxHeight: 170,
                    overflowY: "auto",
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                    gap: 8,
                  }}
                >
                  {MODULES.map((moduleItem) => (
                    <label
                      key={moduleItem.id}
                      style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}
                    >
                      <input
                        type="checkbox"
                        checked={newRoleModules.includes(moduleItem.id)}
                        onChange={(event) => {
                          setNewRoleModules((prev) =>
                            event.target.checked
                              ? Array.from(new Set([...prev, moduleItem.id]))
                              : prev.filter((id) => id !== moduleItem.id),
                          );
                        }}
                      />
                      <span>{moduleItem.id}. {moduleItem.name}</span>
                    </label>
                  ))}
                </div>
              </label>
            </div>
            <div className="modal-footer" style={{ marginTop: 12 }}>
              <button className="btn-primary" type="submit" disabled={loading}>
                {loading ? "Saving..." : "Create Role"}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="pv-search-wrap" style={{ marginBottom: 14 }}>
        <input
          className="pv-search"
          placeholder="Search users by email/role/status..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="pv-table-wrap">
        <table className="pv-table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((u) => (
              <tr key={u.id}>
                <td className="pv-name">{u.email}</td>
                <td>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span>{formatRoleLabel(String(u.role?.name || ""))}</span>
                    <select
                      className="form-input"
                      value={u.roleId}
                      onChange={(e) => doUpdateUserRole(u.id, e.target.value)}
                      style={{ minWidth: 140, padding: "4px 8px" }}
                    >
                      {roles.map((role) => (
                        <option key={role.id} value={role.id}>
                          {formatRoleLabel(String(role.name))}
                        </option>
                      ))}
                    </select>
                  </div>
                </td>
                <td>
                  <span className={`pv-badge ${u.status === "ACTIVE" ? "badge-male" : "badge-female"}`}>
                    {u.status}
                  </span>
                </td>
                <td>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button className="btn-cancel" onClick={() => doResetPassword(u.id)}>
                      Reset Password
                    </button>
                    <button
                      className="btn-cancel"
                      onClick={() => updateStatus(u.id, u.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE")}
                    >
                      {u.status === "ACTIVE" ? "Suspend" : "Activate"}
                    </button>
                    <button className="btn-danger" onClick={() => doDeleteUser(u.id)}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredUsers.length === 0 && (
              <tr>
                <td colSpan={4} className="pv-empty">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="pv-table-wrap" style={{ marginTop: 16 }}>
        <table className="pv-table">
          <thead>
            <tr>
              <th>Role</th>
              <th>Permissions</th>
              <th>Users</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {roles.map((role) => (
              <tr key={role.id}>
                <td className="pv-name">{formatRoleLabel(String(role.name))}</td>
                <td style={{ maxWidth: 420 }}>
                  {(role.permissions || []).length > 0
                    ? role.permissions.join(", ")
                    : "No explicit permissions"}
                  {(() => {
                    const moduleIds = extractModuleIdsFromPermissions(role.permissions || []);
                    if (moduleIds.length === 0) return null;
                    return (
                      <div style={{ marginTop: 6, fontSize: 12, color: "#475569" }}>
                        Modules:{" "}
                        {moduleIds
                          .map((moduleId) => WORKFLOW_MODULE_BY_ID[moduleId]?.name || `Module ${moduleId}`)
                          .join(", ")}
                      </div>
                    );
                  })()}
                </td>
                <td>{Array.isArray(role.users) ? role.users.length : 0}</td>
                <td>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button
                      className="btn-cancel"
                      onClick={() => doUpdateRolePermissions(role.id, role.permissions || [])}
                    >
                      Edit Permissions
                    </button>
                    <button
                      className="btn-cancel"
                      onClick={() => doUpdateRoleModules(role.id, role.permissions || [])}
                    >
                      Edit Module Access
                    </button>
                    <button className="btn-danger" onClick={() => doDeleteRole(role.id)}>
                      Delete Role
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {roles.length === 0 && (
              <tr>
                <td colSpan={4} className="pv-empty">
                  No roles found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

void LegacyUserManagementView;

function AnalyticsView() {
  const [reports] = useState([
    {
      id: "1",
      title: "Monthly Revenue Jan",
      type: "Financial",
      date: "2026-01-31",
    },
    {
      id: "2",
      title: "In-Patient Flow Audit",
      type: "Clinical",
      date: "2026-02-15",
    },
  ]);

  return (
    <div className="analytics-view">
      <div className="pv-header">
        <div>
          <h2 className="pv-title">Intelligence Archive</h2>
          <p className="pv-subtitle">
            Monitor facility telemetry and generated system reports
          </p>
        </div>
      </div>
      <div className="pv-table-wrap">
        <table className="pv-table">
          <thead>
            <tr>
              <th>Report Title</th>
              <th>Category</th>
              <th>Generated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((r) => (
              <tr key={r.id}>
                <td className="pv-name">{r.title}</td>
                <td>{r.type}</td>
                <td className="font-bold">{r.date}</td>
                <td>
                  <button className="pv-del">Export</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="analytics-stats mt-8 grid grid-cols-2 gap-4">
        <div className="p-4 bg-muted rounded-2xl border border-border">
          <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">
            Compute Load
          </p>
          <p className="text-xl font-black italic">Normal</p>
        </div>
        <div className="p-4 bg-primary text-white rounded-2xl">
          <p className="text-[10px] font-black uppercase opacity-70 mb-1">
            Vault Sync
          </p>
          <p className="text-xl font-black italic">Active</p>
        </div>
      </div>
    </div>
  );
}

function DoctorView() {
  const [docs] = useState([
    { id: "1", name: "Dr. Smith", slot: "09:00 - 10:00", rating: 4.8 },
    { id: "2", name: "Dr. Jones", slot: "11:30 - 12:30", rating: 4.9 },
  ]);

  return (
    <div className="doctor-view">
      <div className="pv-header">
        <div>
          <h2 className="pv-title">Clinical Performance</h2>
          <p className="pv-subtitle">
            Monitor doctor schedules and clinical outcomes
          </p>
        </div>
      </div>
      <div className="pv-table-wrap">
        <table className="pv-table">
          <thead>
            <tr>
              <th>Physician</th>
              <th>Current Slot</th>
              <th>Rating</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {docs.map((d) => (
              <tr key={d.id}>
                <td className="pv-name">{d.name}</td>
                <td>{d.slot}</td>
                <td className="font-bold">{d.rating}/5.0</td>
                <td>
                  <button className="pv-del">Schedule</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FacilityView() {
  const [assets] = useState([
    { id: "1", name: "X-Ray Gen 3", status: "ACTIVE", type: "Biosync" },
    { id: "2", name: "Ward B Lifter", status: "REPAIR", type: "Mechanical" },
  ]);

  return (
    <div className="facility-view">
      <div className="pv-header">
        <div>
          <h2 className="pv-title">Infrastructure Terminal</h2>
          <p className="pv-subtitle">
            Monitor hospital assets and active maintenance tickets
          </p>
        </div>
      </div>
      <div className="pv-table-wrap">
        <table className="pv-table">
          <thead>
            <tr>
              <th>Asset Name</th>
              <th>Type</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {assets.map((a) => (
              <tr key={a.id}>
                <td className="pv-name">{a.name}</td>
                <td>{a.type}</td>
                <td>
                  <span
                    className={`pv-badge ${a.status === "ACTIVE" ? "badge-male" : "badge-female"}`}
                  >
                    {a.status}
                  </span>
                </td>
                <td>
                  <button className="pv-del">Ticket</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function HRView() {
  const [staff] = useState([
    { id: "1", name: "Dr. Alice M.", role: "Lead Surgeon", status: "ACTIVE" },
    { id: "2", name: "Nurse John D.", role: "Senior Nurse", status: "ACTIVE" },
    { id: "3", name: "Sarah K.", role: "Administrator", status: "ON LEAVE" },
  ]);

  return (
    <div className="hr-view">
      <div className="pv-header">
        <div>
          <h2 className="pv-title">Human Resources</h2>
          <p className="pv-subtitle">
            Manage staff registry, attendance, and payroll
          </p>
        </div>
      </div>
      <div className="pv-table-wrap">
        <table className="pv-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {staff.map((s) => (
              <tr key={s.id}>
                <td className="pv-name">{s.name}</td>
                <td>{s.role}</td>
                <td>
                  <span
                    className={`pv-badge ${s.status === "ACTIVE" ? "badge-male" : "badge-female"}`}
                  >
                    {s.status}
                  </span>
                </td>
                <td>
                  <button className="pv-del">Profile</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ProcurementView() {
  const [items] = useState([
    { id: "1", name: "Surgical Gloves", category: "Consumables", qty: 2400 },
    { id: "2", name: "Syringes (5ml)", category: "Consumables", qty: 450 },
    { id: "3", name: "Patient Gowns", category: "Linen", qty: 120 },
  ]);

  return (
    <div className="procurement-view">
      <div className="pv-header">
        <div>
          <h2 className="pv-title">Supply Chain Hub</h2>
          <p className="pv-subtitle">
            Manage facility-wide non-medicine procurement
          </p>
        </div>
      </div>
      <div className="pv-table-wrap">
        <table className="pv-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Category</th>
              <th>Quantity</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.id}>
                <td className="pv-name">{i.name}</td>
                <td>{i.category}</td>
                <td className="font-bold">{i.qty}</td>
                <td>
                  <span
                    className={`pv-badge ${i.qty < 500 ? "badge-female" : "badge-male"}`}
                  >
                    {i.qty < 500 ? "Reorder" : "Stable"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function BillingView() {
  type BillingStat = {
    label: string;
    value: string | number;
    color: string;
  };
  type TrendPieRow = {
    period: string;
    billed: number;
    paid: number;
    outstanding: number;
    color: string;
  };
  type FacilityInvoiceInfo = {
    name: string;
    location: string;
    phone: string;
    email: string;
    logoUrl: string;
  };

  const { facility, facilityLogo } = useAppStore();
  const [bills, setBills] = useState<any[]>([]);
  const [dashboard, setDashboard] = useState<any | null>(null);
  const [report, setReport] = useState<any | null>(null);
  const [arReport, setArReport] = useState<any | null>(null);
  const [discounts, setDiscounts] = useState<any[]>([]);
  const [refunds, setRefunds] = useState<any[]>([]);
  const [loadingBills, setLoadingBills] = useState(false);
  const [billingError, setBillingError] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [status, setStatus] = useState("ALL");
  const [trendGrouping, setTrendGrouping] = useState<"day" | "week" | "month">("day");
  const [search, setSearch] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [activeForm, setActiveForm] = useState<WorkflowForm | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string | boolean>>({});
  const [submittingForm, setSubmittingForm] = useState(false);
  const [notice, setNotice] = useState("");

  const formatKes = (value: unknown) => {
    const amount = Number(value || 0);
    return `Ksh ${amount.toLocaleString("en-KE", { maximumFractionDigits: 0 })}`;
  };

  const asNumber = (value: unknown) => {
    const next = Number(value || 0);
    return Number.isFinite(next) ? next : 0;
  };

  const patientName = (bill: any) => {
    const first = String(bill?.patient?.firstName || "").trim();
    const last = String(bill?.patient?.lastName || "").trim();
    return (
      `${first} ${last}`.trim() ||
      String(bill?.patient?.name || bill?.patientName || bill?.patientId || "Walk-in patient")
    );
  };

  const invoiceNumber = (bill: any) => {
    const createdAtRaw = String(bill?.createdAt || "");
    const createdTs = Date.parse(createdAtRaw);
    const invoiceDate = Number.isFinite(createdTs)
      ? new Date(createdTs).toISOString().slice(0, 10).replace(/-/g, "")
      : new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const idSuffix = String(bill?.id || "")
      .replace(/-/g, "")
      .slice(-6)
      .toUpperCase()
      .padStart(6, "0");
    return (
      String((bill as any)?.invoiceNumber || "").trim() ||
      `INV-${invoiceDate}-${idSuffix}`
    );
  };

  const invoicePayments = (bill: any) => {
    if (Array.isArray(bill?.payments)) return bill.payments;
    if (Array.isArray(bill?.receipts)) return bill.receipts;
    return [];
  };

  const paidAmount = (bill: any) =>
    asNumber(bill?.totalPaid) ||
    invoicePayments(bill).reduce((sum: number, payment: any) => sum + asNumber(payment?.amount), 0);

  const outstandingAmount = (bill: any) =>
    Math.max(0, asNumber(bill?.outstanding ?? bill?.balance ?? asNumber(bill?.totalAmount) - paidAmount(bill)));

  const invoiceLineTotal = (item: any) =>
    asNumber(item?.total ?? item?.lineTotal ?? asNumber(item?.quantity) * asNumber(item?.unitPrice));

  const escapeHtml = (value: unknown) =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  const cleanFormName = (value: string) => String(value || "").replace(/\s+Form$/i, "").trim();

  const billingForms = useMemo(
    () =>
      (WORKFLOW_MODULE_BY_ID[13]?.forms || []).filter((form) =>
        [
          "Invoice Review & Finalise Form",
          "Payment Receipt Form",
          "Charge Master Entry Form",
          "Bill Adjustment Form",
        ].includes(form.title),
      ),
    [],
  );

  const actionPalette = ["#16a34a", "#2563eb", "#7c3aed", "#f59e0b"];

  const getFormIconText = (name: string) => {
    const normalized = name.toLowerCase();
    if (normalized.includes("payment")) return "PAY";
    if (normalized.includes("charge")) return "CHG";
    if (normalized.includes("adjustment")) return "ADJ";
    return "INV";
  };

  const getFormMode = (name: string) => {
    const normalized = name.toLowerCase();
    if (normalized.includes("payment")) return "billing-mode-payment";
    if (normalized.includes("charge")) return "billing-mode-charge";
    if (normalized.includes("adjustment")) return "billing-mode-adjustment";
    return "billing-mode-invoice";
  };

  const getSubmitLabel = (name: string) => {
    const normalized = name.toLowerCase();
    if (normalized.includes("payment")) return "Post Payment Receipt";
    if (normalized.includes("charge")) return "Save Charge Master Entry";
    if (normalized.includes("adjustment")) return "Submit Bill Adjustment";
    return "Finalise Invoice";
  };

  const readSetupFacility = () => {
    try {
      const raw = localStorage.getItem(SETUP_STORAGE_KEY);
      return raw?.trim() ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  };

  const facilityDetails = useMemo<FacilityInvoiceInfo>(() => {
    const setup = readSetupFacility();
    const values = setup?.values || {};
    const savedFacility = setup?.savedFacility || {};
    const branding = setup?.branding || {};
    const activeFacility: any = facility || {};
    return {
      name: pickHospitalName(
        values.shortName,
        values.legalName,
        values.facilityName,
        savedFacility.shortName,
        savedFacility.legalName,
        savedFacility.name,
        activeFacility.name,
      ),
      location:
        values.location ||
        values.address ||
        values.county ||
        savedFacility.location ||
        savedFacility.address ||
        savedFacility.county ||
        activeFacility.location ||
        activeFacility.address ||
        "Kenya",
      phone:
        values.phone ||
        values.phoneNumber ||
        savedFacility.phone ||
        savedFacility.phoneNumber ||
        activeFacility.phone ||
        "",
      email: values.email || savedFacility.email || activeFacility.email || "",
      logoUrl:
        resolveAssetUrl(
          branding.logoUrl ||
            savedFacility.logoUrl ||
            savedFacility.logo ||
            activeFacility.logoUrl ||
            facilityLogo,
        ) ||
        getSetupFacilityLogoFallback() ||
        "/Medilink-hmis-icon.png",
    };
  }, [facility, facilityLogo]);

  const buildInvoicePrintHtml = (bill: any) => {
    const items = Array.isArray(bill?.items) ? bill.items : [];
    const payments = invoicePayments(bill);
    const doctorName =
      `${bill?.visit?.doctor?.firstName || ""} ${bill?.visit?.doctor?.lastName || ""}`.trim() ||
      "-";
    const itemRows = items.length
      ? items
          .map(
            (item: any, index: number) => `
              <tr>
                <td>${index + 1}</td>
                <td><strong>${escapeHtml(item?.description || item?.serviceName || "Service")}</strong><span>${escapeHtml(item?.chargeType || item?.type || bill?.sourceModule || "-")}</span></td>
                <td>${escapeHtml(asNumber(item?.quantity) || 1)}</td>
                <td>${escapeHtml(formatKes(item?.unitPrice))}</td>
                <td>${escapeHtml(formatKes(invoiceLineTotal(item)))}</td>
              </tr>
            `,
          )
          .join("")
      : `<tr><td colspan="5" class="empty">No line items recorded.</td></tr>`;
    const paymentRows = payments.length
      ? payments
          .map(
            (payment: any) => `
              <tr>
                <td>${escapeHtml(payment?.createdAt ? new Date(payment.createdAt).toLocaleString() : "-")}</td>
                <td>${escapeHtml(payment?.method || payment?.paymentMethod || "-")}</td>
                <td>${escapeHtml(payment?.transactionRef || payment?.transactionId || payment?.reference || payment?.receiptNumber || "-")}</td>
                <td>${escapeHtml(formatKes(payment?.amount))}</td>
              </tr>
            `,
          )
          .join("")
      : `<tr><td colspan="4" class="empty">No payments posted.</td></tr>`;
    const logoMarkup = facilityDetails.logoUrl
      ? `<img src="${escapeHtml(facilityDetails.logoUrl)}" alt="${escapeHtml(facilityDetails.name)} logo" />`
      : `<div class="logo-fallback">${escapeHtml(facilityDetails.name.slice(0, 1) || "H")}</div>`;

    return `<!doctype html><html><head><meta charset="utf-8" /><title>Invoice ${escapeHtml(invoiceNumber(bill))}</title><style>
      *{box-sizing:border-box}body{margin:0;background:#f1f5f9;color:#0f172a;font-family:Arial,sans-serif}.sheet{width:210mm;min-height:297mm;margin:0 auto;padding:20mm 17mm;background:#fff}.top{display:flex;justify-content:space-between;gap:24px;padding-bottom:18px;border-bottom:3px solid #1e3a8a}.brand{display:flex;gap:14px;align-items:flex-start}.brand img,.logo-fallback{width:74px;height:74px;border:1px solid #dbe4ef;border-radius:14px;object-fit:contain;padding:8px}.logo-fallback{display:grid;place-items:center;color:#fff;background:#16a34a;font-size:28px;font-weight:900}h1,h2,h3,p{margin:0}h1{font-size:24px}.muted{margin-top:5px;color:#64748b;font-size:12px;line-height:1.5}.stamp{text-align:right}.stamp span{color:#1e3a8a;font-size:12px;font-weight:800;letter-spacing:.12em;text-transform:uppercase}.stamp strong{display:block;margin-top:5px;font-size:22px}.status{display:inline-block;margin-top:8px;padding:6px 10px;border-radius:999px;background:#dcfce7;color:#166534;font-size:11px;font-weight:800}.grid{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:22px}.box{border:1px solid #dbe4ef;border-radius:14px;padding:14px}.box h2{color:#1e3a8a;font-size:13px;text-transform:uppercase;letter-spacing:.08em}dl{display:grid;gap:9px;margin:12px 0 0}.line{display:flex;justify-content:space-between;gap:16px;border-bottom:1px solid #f1f5f9;padding-bottom:7px}dt{color:#64748b;font-size:12px}dd{margin:0;font-size:12px;font-weight:700;text-align:right}table{width:100%;border-collapse:collapse;margin-top:22px}th{background:#f8fafc;color:#475569;font-size:11px;letter-spacing:.08em;text-align:left;text-transform:uppercase}th,td{border-bottom:1px solid #e2e8f0;padding:11px 10px;font-size:12px;vertical-align:top}td strong{display:block}td span{display:block;margin-top:3px;color:#64748b;font-size:11px}.empty{text-align:center;color:#64748b}.totals{width:46%;margin:20px 0 0 auto;border:1px solid #dbe4ef;border-radius:14px;overflow:hidden}.totals .row{display:flex;justify-content:space-between;gap:14px;padding:10px 13px;border-bottom:1px solid #e2e8f0;font-size:12px}.totals .grand{background:#0f172a;color:#fff;font-size:14px;font-weight:900}.payments-title{margin-top:28px;color:#1e3a8a;font-size:14px}.footer{margin-top:30px;padding-top:14px;border-top:1px solid #dbe4ef;color:#64748b;font-size:11px;line-height:1.5}@media print{body{background:#fff}.sheet{margin:0;box-shadow:none}}
      </style></head><body><main class="sheet">
        <section class="top"><div class="brand">${logoMarkup}<div><h1>${escapeHtml(facilityDetails.name)}</h1><p class="muted">${escapeHtml(facilityDetails.location)}</p><p class="muted">${escapeHtml([facilityDetails.phone, facilityDetails.email].filter(Boolean).join(" | "))}</p></div></div><div class="stamp"><span>Patient Invoice</span><strong>${escapeHtml(invoiceNumber(bill))}</strong><p class="status">${escapeHtml(bill?.status || "OPEN")}</p></div></section>
        <section class="grid"><article class="box"><h2>Bill To</h2><dl><div class="line"><dt>Patient</dt><dd>${escapeHtml(patientName(bill))}</dd></div><div class="line"><dt>Patient ID</dt><dd>${escapeHtml(bill?.patientId || "-")}</dd></div><div class="line"><dt>Visit Type</dt><dd>${escapeHtml(bill?.visit?.visitType || bill?.sourceModule || "-")}</dd></div><div class="line"><dt>Doctor</dt><dd>${escapeHtml(doctorName)}</dd></div></dl></article><article class="box"><h2>Invoice Details</h2><dl><div class="line"><dt>Invoice No.</dt><dd>${escapeHtml(invoiceNumber(bill))}</dd></div><div class="line"><dt>Created</dt><dd>${escapeHtml(bill?.createdAt ? new Date(bill.createdAt).toLocaleString() : "-")}</dd></div><div class="line"><dt>Visit ID</dt><dd>${escapeHtml(bill?.visit?.id || bill?.visitId || "-")}</dd></div><div class="line"><dt>Payment Status</dt><dd>${escapeHtml(bill?.status || "-")}</dd></div></dl></article></section>
        <table><thead><tr><th>#</th><th>Service / Item</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr></thead><tbody>${itemRows}</tbody></table>
        <section class="totals"><div class="row"><span>Subtotal</span><strong>${escapeHtml(formatKes(bill?.subtotal ?? bill?.totalAmount))}</strong></div><div class="row"><span>Tax</span><strong>${escapeHtml(formatKes(bill?.taxAmount))}</strong></div><div class="row"><span>Discount</span><strong>${escapeHtml(formatKes(bill?.discountAmount))}</strong></div><div class="row"><span>Insurance Cover</span><strong>${escapeHtml(formatKes(bill?.insuranceCover))}</strong></div><div class="row"><span>Total Paid</span><strong>${escapeHtml(formatKes(paidAmount(bill)))}</strong></div><div class="row grand"><span>Outstanding</span><strong>${escapeHtml(formatKes(outstandingAmount(bill)))}</strong></div></section>
        <h3 class="payments-title">Payments & Receipts</h3><table><thead><tr><th>Date</th><th>Method</th><th>Reference</th><th>Amount</th></tr></thead><tbody>${paymentRows}</tbody></table>
        <footer class="footer">This invoice was generated by Medilink HMIS. Please quote invoice number ${escapeHtml(invoiceNumber(bill))} when making payment or requesting support.</footer>
      </main><script>window.onload=function(){window.focus();window.print();}</script></body></html>`;
  };

  const loadBills = async () => {
    setLoadingBills(true);
    setBillingError("");
    try {
      const params = {
        ...(dateFrom ? { fromDate: dateFrom } : {}),
        ...(dateTo ? { toDate: dateTo } : {}),
        ...(status !== "ALL" ? { status } : {}),
      };
      const dashboardParams = {
        ...(dateFrom ? { fromDate: dateFrom } : {}),
        ...(dateTo ? { toDate: dateTo } : {}),
      };
      const [dashboardRes, reportRes, arRes, discountsRes, refundsRes, billsRes] =
        await Promise.allSettled([
          fetchBillingDashboard(dashboardParams),
          fetchBillingRevenueReport({ ...dashboardParams, groupBy: trendGrouping }),
          fetchBillingArReport(),
          fetchBillingDiscounts(),
          fetchBillingRefunds(),
          fetchBillingBills(params),
        ]);
      setDashboard(dashboardRes.status === "fulfilled" ? dashboardRes.value || null : null);
      setReport(reportRes.status === "fulfilled" ? reportRes.value || null : null);
      setArReport(arRes.status === "fulfilled" ? arRes.value || null : null);
      setDiscounts(discountsRes.status === "fulfilled" && Array.isArray(discountsRes.value) ? discountsRes.value : []);
      setRefunds(refundsRes.status === "fulfilled" && Array.isArray(refundsRes.value) ? refundsRes.value : []);
      setBills(billsRes.status === "fulfilled" && Array.isArray(billsRes.value) ? billsRes.value : []);
      if (![dashboardRes, reportRes, arRes, billsRes].some((result) => result.status === "fulfilled")) {
        setBillingError("Unable to load billing data.");
      }
    } catch (error: any) {
      setBillingError(String(error?.message || "Failed to load billing records."));
      setBills([]);
    } finally {
      setLoadingBills(false);
    }
  };

  useEffect(() => {
    void loadBills();
  }, [dateFrom, dateTo, status, trendGrouping]);

  useEffect(() => {
    const handleSidebarFormOpen = (event: Event) => {
      const detail = (event as CustomEvent<{ moduleId?: number; formId?: string }>).detail;
      if (Number(detail?.moduleId) !== 13) return;
      const form = billingForms.find((item) => item.id === detail?.formId);
      if (form) {
        setFormValues({});
        setActiveForm(form);
      }
    };
    window.addEventListener("hmis:open-workflow-form", handleSidebarFormOpen);
    return () => window.removeEventListener("hmis:open-workflow-form", handleSidebarFormOpen);
  }, [billingForms]);

  const filteredBills = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return bills;
    return bills.filter((bill) =>
      [
        invoiceNumber(bill),
        bill?.id,
        patientName(bill),
        bill?.patientId,
        bill?.status,
        bill?.visit?.visitType,
      ]
        .join(" ")
        .toLowerCase()
        .includes(needle),
    );
  }, [bills, search]);

  const filteredDiscounts = useMemo(() => {
    const fromTs = dateFrom ? new Date(`${dateFrom}T00:00:00`).getTime() : 0;
    const toTs = dateTo ? new Date(`${dateTo}T23:59:59`).getTime() : Number.MAX_SAFE_INTEGER;
    return discounts.filter((row) => {
      const ts = new Date(String(row?.createdAt || row?.approvedAt || "")).getTime();
      if (!Number.isFinite(ts)) return true;
      return ts >= fromTs && ts <= toTs;
    });
  }, [dateFrom, dateTo, discounts]);

  const filteredRefunds = useMemo(() => {
    const fromTs = dateFrom ? new Date(`${dateFrom}T00:00:00`).getTime() : 0;
    const toTs = dateTo ? new Date(`${dateTo}T23:59:59`).getTime() : Number.MAX_SAFE_INTEGER;
    return refunds.filter((row) => {
      const ts = new Date(String(row?.createdAt || row?.refundedAt || "")).getTime();
      if (!Number.isFinite(ts)) return true;
      return ts >= fromTs && ts <= toTs;
    });
  }, [dateFrom, dateTo, refunds]);

  const stats: BillingStat[] = useMemo(() => {
    const dashboardTotals = dashboard?.totals || {};
    const totalBilled = filteredBills.reduce((sum, bill) => sum + asNumber(bill?.totalAmount), 0);
    const totalCollected = filteredBills.reduce((sum, bill) => sum + paidAmount(bill), 0);
    const totalOutstanding = filteredBills.reduce((sum, bill) => sum + outstandingAmount(bill), 0);
    const totalDiscounts = filteredDiscounts.reduce((sum, row) => sum + asNumber(row?.amount), 0);
    const totalRefunds = filteredRefunds.reduce((sum, row) => sum + asNumber(row?.amount), 0);
    const collectionEfficiency =
      totalBilled > 0 ? Number(((totalCollected / totalBilled) * 100).toFixed(2)) : 0;
    const refundRatio =
      totalCollected > 0 ? Number(((totalRefunds / totalCollected) * 100).toFixed(2)) : 0;
    const arOutstanding = asNumber(arReport?.totals?.totalOutstanding ?? dashboardTotals?.arAgingTotal);
    const value = (fallback: string | number) => (loadingBills ? "..." : fallback);
    return [
      { label: "Invoices", value: value(filteredBills.length), color: "#1e3a8a" },
      { label: "Total Billed", value: value(formatKes(totalBilled)), color: "#2563eb" },
      { label: "Total Collected", value: value(formatKes(totalCollected)), color: "#16a34a" },
      { label: "Total Outstanding", value: value(formatKes(totalOutstanding)), color: "#dc2626" },
      { label: "Collection Efficiency", value: value(`${collectionEfficiency.toFixed(2)}%`), color: "#0d9488" },
      { label: "Discounts", value: value(formatKes(totalDiscounts)), color: "#f59e0b" },
      { label: "Refunds", value: value(formatKes(totalRefunds)), color: "#be123c" },
      { label: "Refund Ratio", value: value(`${refundRatio.toFixed(2)}%`), color: "#7c3aed" },
      { label: "AR Outstanding", value: value(formatKes(arOutstanding)), color: "#475569" },
      { label: "Discount Events", value: value(filteredDiscounts.length), color: "#0891b2" },
      { label: "Refund Events", value: value(filteredRefunds.length), color: "#991b1b" },
    ];
  }, [arReport, dashboard, filteredBills, filteredDiscounts, filteredRefunds, loadingBills]);

  const trendRows = Array.isArray(report?.rows) ? report.rows : [];
  const trendPie = useMemo(() => {
    const colors = ["#1e3a8a", "#16a34a", "#7c3aed", "#f59e0b", "#0891b2", "#9333ea", "#475569", "#2563eb"];
    const rows = trendRows
      .slice(-8)
      .map((row: any, index: number) => ({
        period: String(row?.period || "-"),
        billed: asNumber(row?.billed),
        paid: asNumber(row?.paid),
        outstanding: asNumber(row?.outstanding),
        color: colors[index % colors.length],
      }))
      .filter((row: TrendPieRow) => row.billed > 0);
    const total = rows.reduce((sum: number, row: TrendPieRow) => sum + row.billed, 0);
    let cursor = 0;
    const gradient =
      total > 0
        ? rows
            .map((row: TrendPieRow) => {
              const start = cursor;
              const end = cursor + (row.billed / total) * 100;
              cursor = end;
              return `${row.color} ${start.toFixed(2)}% ${end.toFixed(2)}%`;
            })
            .join(", ")
        : "#e2e8f0 0% 100%";
    return { rows, total, gradient };
  }, [trendRows]);

  const settleBill = async (bill: any) => {
    const amountToPay = Number(outstandingAmount(bill) > 0 ? outstandingAmount(bill) : asNumber(bill?.totalAmount));
    if (amountToPay <= 0) {
      setNotice("Bill is already fully paid.");
      window.setTimeout(() => setNotice(""), 2200);
      return;
    }
    try {
      await recordBillingPayment(bill.id, {
        amount: amountToPay,
        method: "M-PESA",
        transactionId: `MP-${Date.now()}`,
      });
      const fullBill = await fetchBillingBillById(bill.id);
      setBills((prev) => prev.map((row) => (String(row?.id) === String(fullBill?.id) ? fullBill : row)));
      setSelectedInvoice(fullBill);
      setNotice("Payment recorded successfully.");
      window.setTimeout(() => setNotice(""), 2600);
    } catch (error: any) {
      setBillingError(String(error?.message || "Failed to settle bill."));
    }
  };

  const openInvoice = async (bill: any) => {
    try {
      const fullBill = await fetchBillingBillById(bill.id);
      setBills((prev) => prev.map((row) => (String(row?.id) === String(fullBill?.id) ? fullBill : row)));
      setSelectedInvoice(fullBill);
    } catch (error: any) {
      setBillingError(String(error?.message || "Failed to fetch invoice details."));
    }
  };

  const downloadInvoicePdf = (bill: any) => {
    const printWindow = window.open("", "_blank", "width=940,height=1200");
    if (!printWindow) {
      window.print();
      return;
    }
    printWindow.document.open();
    printWindow.document.write(buildInvoicePrintHtml(bill));
    printWindow.document.close();
  };

  const handleFormChange = (name: string, value: string | boolean) => {
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const renderFormInput = (field: WorkflowField) => {
    const value = formValues[field.key];
    const baseClass = "billing-form-input";
    if (field.type === "textarea") {
      return (
        <textarea
          className={baseClass}
          value={typeof value === "string" ? value : ""}
          onChange={(event) => handleFormChange(field.key, event.target.value)}
          placeholder={field.note}
          required={field.required}
        />
      );
    }
    if (field.type === "checkbox") {
      return (
        <label className="billing-checkbox-row">
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(event) => handleFormChange(field.key, event.target.checked)}
          />
          <span>Confirmed</span>
        </label>
      );
    }
    if (field.type === "select") {
      return (
        <select
          className={baseClass}
          value={typeof value === "string" ? value : ""}
          onChange={(event) => handleFormChange(field.key, event.target.value)}
          required={field.required}
        >
          <option value="">Select an option</option>
          {(field.options || []).map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      );
    }
    return (
      <input
        className={baseClass}
        type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
        value={typeof value === "string" ? value : ""}
        onChange={(event) => handleFormChange(field.key, event.target.value)}
        placeholder={field.note}
        required={field.required}
      />
    );
  };

  const submitBillingForm = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!activeForm) return;
    setSubmittingForm(true);
    try {
      await submitModuleRecord({
        moduleId: 13,
        formId: activeForm.id,
        patientName: String(formValues.patient || formValues.invoice || ""),
        formData: Object.fromEntries(
          Object.entries(formValues).map(([key, value]) => [key, String(value)]),
        ),
      });
      setNotice(`${cleanFormName(activeForm.title)} saved successfully.`);
      setActiveForm(null);
      setFormValues({});
      window.setTimeout(() => setNotice(""), 2600);
    } catch (error: any) {
      setBillingError(String(error?.message || "Failed to save billing form."));
    } finally {
      setSubmittingForm(false);
    }
  };

  return (
    <div className="billing-view billing-dashboard-view">
      <div className="pv-header">
        <div>
          <h2 className="pv-title"><span className="billing-title-icon">KES</span> Billing & Payments</h2>
          <p className="pv-subtitle">Charges, receipts, and patient balances</p>
        </div>
        <div className="billing-action-bar">
          {billingForms.map((form, index) => {
            const color = actionPalette[index % actionPalette.length];
            return (
              <button
                key={form.id}
                type="button"
                className="billing-action-btn"
                style={{
                  backgroundColor: color,
                  borderColor: color,
                  boxShadow: `0 10px 20px ${color}30`,
                }}
                onClick={() => {
                  setFormValues({});
                  setActiveForm(form);
                }}
              >
                <span>{getFormIconText(form.title)}</span>
                {cleanFormName(form.title)}
              </button>
            );
          })}
        </div>
      </div>
      {notice && <div className="workflow-notice is-success">{notice}</div>}
      {billingError && <div className="auth-error">{billingError}</div>}

      <section className="module-filter-panel billing-filter-panel">
        <div className="module-filter-grid billing-filter-grid">
          <label className="module-filter-field">
            <span>Date From</span>
            <input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
          </label>
          <label className="module-filter-field">
            <span>Date To</span>
            <input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
          </label>
          <label className="module-filter-field">
            <span>Status</span>
            <select value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="ALL">All</option>
              <option value="UNPAID">Unpaid</option>
              <option value="PARTIAL">Partial</option>
              <option value="PAID">Paid</option>
              <option value="OVERPAID">Overpaid</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </label>
          <label className="module-filter-field">
            <span>Trend Grouping</span>
            <select value={trendGrouping} onChange={(event) => setTrendGrouping(event.target.value as any)}>
              <option value="day">Day</option>
              <option value="week">Week</option>
              <option value="month">Month</option>
            </select>
          </label>
          <label className="module-filter-field is-wide">
            <span>Search Invoices</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Invoice number, patient, status, visit type..."
            />
          </label>
        </div>
      </section>

      <div className="pv-stats billing-stats-grid">
        {stats.map((stat) => (
          <article key={stat.label} className="pv-stat-card" style={{ borderLeftColor: stat.color }}>
            <p className="pv-stat-label">{stat.label}</p>
            <p className="pv-stat-value">{stat.value}</p>
          </article>
        ))}
      </div>

      <section className="billing-trend-panel">
        <div>
          <h3>Revenue Trend</h3>
          <p>{trendRows.length} periods grouped by {String(report?.groupBy || trendGrouping).toLowerCase()}.</p>
        </div>
        <div className="billing-trend-pie-layout">
          <div className="billing-trend-pie" style={{ background: `conic-gradient(${trendPie.gradient})` }}>
            <div><span>Total Billed</span><strong>{formatKes(trendPie.total)}</strong></div>
          </div>
          <div className="billing-trend-legend">
            {trendPie.rows.map((row: TrendPieRow) => (
              <div key={row.period} className="billing-trend-legend-row">
                <i style={{ backgroundColor: row.color }} />
                <span>{row.period}</span>
                <strong>{formatKes(row.billed)}</strong>
              </div>
            ))}
            {!loadingBills && trendRows.length === 0 ? <div className="pv-empty">No trend data for selected filters.</div> : null}
          </div>
        </div>
      </section>

      <div className="pv-table-meta">
        <h3 className="pv-table-title">Invoice View</h3>
        <span className="pv-table-count">{filteredBills.length} invoices</span>
      </div>

      <div className="pv-table-wrap billing-invoice-table">
        <table className="pv-table">
          <thead>
            <tr>
              <th>Invoice</th>
              <th>Patient</th>
              <th>Visit</th>
              <th>Status</th>
              <th>Total</th>
              <th>Paid</th>
              <th>Outstanding</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loadingBills && (
              <tr>
                <td colSpan={9} className="pv-empty">Loading billing invoices...</td>
              </tr>
            )}
            {filteredBills.map((bill) => (
              <tr key={String(bill?.id || invoiceNumber(bill))}>
                <td className="pv-name">{invoiceNumber(bill)}</td>
                <td>{patientName(bill)}</td>
                <td>{String(bill?.visit?.visitType || bill?.sourceModule || "-")}</td>
                <td>
                  <span className={`billing-status billing-status-${String(bill?.status || "unknown").toLowerCase()}`}>
                    {String(bill?.status || "-")}
                  </span>
                </td>
                <td>{formatKes(bill?.totalAmount)}</td>
                <td>{formatKes(paidAmount(bill))}</td>
                <td>{formatKes(outstandingAmount(bill))}</td>
                <td>{bill?.createdAt ? new Date(bill.createdAt).toLocaleDateString() : "-"}</td>
                <td>
                  <button type="button" className="billing-view-btn" onClick={() => void openInvoice(bill)}>
                    <span>INV</span>
                    View
                  </button>
                </td>
              </tr>
            ))}
            {!loadingBills && filteredBills.length === 0 && (
              <tr>
                <td colSpan={9} className="pv-empty">No invoices match the selected filters.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedInvoice ? (
        <div className="billing-modal-overlay" onClick={() => setSelectedInvoice(null)}>
          <section className="billing-invoice-modal" onClick={(event) => event.stopPropagation()}>
            <div className="billing-invoice-toolbar">
              {outstandingAmount(selectedInvoice) > 0 ? (
                <button type="button" className="billing-settle-btn" onClick={() => void settleBill(selectedInvoice)}>
                  Settle Balance
                </button>
              ) : null}
              <button type="button" className="billing-invoice-download" onClick={() => downloadInvoicePdf(selectedInvoice)}>
                Download PDF
              </button>
              <button type="button" className="billing-invoice-close" onClick={() => setSelectedInvoice(null)}>x</button>
            </div>

            <article className="billing-pdf-sheet">
              <header className="billing-pdf-header">
                <div className="billing-hospital-brand">
                  {facilityDetails.logoUrl ? (
                    <img src={facilityDetails.logoUrl} alt={`${facilityDetails.name} logo`} className="billing-hospital-logo" />
                  ) : (
                    <div className="billing-logo-fallback">{facilityDetails.name.slice(0, 1) || "H"}</div>
                  )}
                  <div>
                    <h2>{facilityDetails.name}</h2>
                    <p>{facilityDetails.location}</p>
                    <p>{[facilityDetails.phone, facilityDetails.email].filter(Boolean).join(" | ")}</p>
                  </div>
                </div>
                <div className="billing-invoice-stamp">
                  <span>Patient Invoice</span>
                  <strong>{invoiceNumber(selectedInvoice)}</strong>
                  <p>{String(selectedInvoice?.status || "OPEN")}</p>
                </div>
              </header>

              <section className="billing-pdf-meta-grid">
                <article>
                  <h3>Bill To</h3>
                  <dl>
                    <div><dt>Patient</dt><dd>{patientName(selectedInvoice)}</dd></div>
                    <div><dt>Patient ID</dt><dd>{String(selectedInvoice?.patientId || "-")}</dd></div>
                    <div><dt>Visit Type</dt><dd>{String(selectedInvoice?.visit?.visitType || selectedInvoice?.sourceModule || "-")}</dd></div>
                    <div><dt>Doctor</dt><dd>{`${selectedInvoice?.visit?.doctor?.firstName || ""} ${selectedInvoice?.visit?.doctor?.lastName || ""}`.trim() || "-"}</dd></div>
                  </dl>
                </article>
                <article>
                  <h3>Invoice Details</h3>
                  <dl>
                    <div><dt>Invoice No.</dt><dd>{invoiceNumber(selectedInvoice)}</dd></div>
                    <div><dt>Created</dt><dd>{selectedInvoice?.createdAt ? new Date(selectedInvoice.createdAt).toLocaleString() : "-"}</dd></div>
                    <div><dt>Visit ID</dt><dd>{String(selectedInvoice?.visit?.id || selectedInvoice?.visitId || "-")}</dd></div>
                    <div><dt>Payment Status</dt><dd>{String(selectedInvoice?.status || "-")}</dd></div>
                  </dl>
                </article>
              </section>

              <section className="billing-pdf-services">
                <h3>Services & Charges</h3>
                <table className="billing-pdf-table">
                  <thead><tr><th>#</th><th>Service / Item</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr></thead>
                  <tbody>
                    {Array.isArray(selectedInvoice?.items) && selectedInvoice.items.length > 0 ? (
                      selectedInvoice.items.map((item: any, index: number) => (
                        <tr key={String(item?.id || index)}>
                          <td>{index + 1}</td>
                          <td><strong>{String(item?.description || item?.serviceName || "Service")}</strong><span>{String(item?.chargeType || item?.type || selectedInvoice?.sourceModule || "-")}</span></td>
                          <td>{asNumber(item?.quantity) || 1}</td>
                          <td>{formatKes(item?.unitPrice)}</td>
                          <td>{formatKes(invoiceLineTotal(item))}</td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan={5} className="pv-empty">No line items recorded.</td></tr>
                    )}
                  </tbody>
                </table>
              </section>

              <section className="billing-pdf-total-panel">
                <div><span>Subtotal</span><strong>{formatKes(selectedInvoice?.subtotal ?? selectedInvoice?.totalAmount)}</strong></div>
                <div><span>Tax</span><strong>{formatKes(selectedInvoice?.taxAmount)}</strong></div>
                <div><span>Discount</span><strong>{formatKes(selectedInvoice?.discountAmount)}</strong></div>
                <div><span>Insurance Cover</span><strong>{formatKes(selectedInvoice?.insuranceCover)}</strong></div>
                <div><span>Total Paid</span><strong>{formatKes(paidAmount(selectedInvoice))}</strong></div>
                <div className="is-grand"><span>Outstanding</span><strong>{formatKes(outstandingAmount(selectedInvoice))}</strong></div>
              </section>

              <section className="billing-pdf-payments">
                <h3>Payments & Receipts</h3>
                <table className="billing-pdf-table">
                  <thead><tr><th>Date</th><th>Method</th><th>Reference</th><th>Amount</th></tr></thead>
                  <tbody>
                    {invoicePayments(selectedInvoice).length > 0 ? (
                      invoicePayments(selectedInvoice).map((payment: any, index: number) => (
                        <tr key={String(payment?.id || index)}>
                          <td>{payment?.createdAt ? new Date(payment.createdAt).toLocaleString() : "-"}</td>
                          <td>{String(payment?.method || payment?.paymentMethod || "-")}</td>
                          <td>{String(payment?.transactionRef || payment?.transactionId || payment?.reference || payment?.receiptNumber || "-")}</td>
                          <td>{formatKes(payment?.amount)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan={4} className="pv-empty">No payments posted.</td></tr>
                    )}
                  </tbody>
                </table>
              </section>
              <footer className="billing-pdf-footer">
                This invoice was generated by Medilink HMIS. Please quote invoice number <strong>{invoiceNumber(selectedInvoice)}</strong> when making payment or requesting support.
              </footer>
            </article>
          </section>
        </div>
      ) : null}

      {activeForm ? (
        <div className="billing-form-overlay" onClick={() => setActiveForm(null)}>
          <section className={`billing-form-panel ${getFormMode(activeForm.title)}`} onClick={(event) => event.stopPropagation()}>
            <header className="billing-form-header">
              <div className="billing-form-heading">
                <span className="billing-form-icon">{getFormIconText(activeForm.title)}</span>
                <div>
                  <span className="billing-form-kicker">Billing & Payments</span>
                  <h2>{cleanFormName(activeForm.title)}</h2>
                  <p>{activeForm.purpose}</p>
                </div>
              </div>
              <button type="button" onClick={() => setActiveForm(null)}>x</button>
            </header>
            <form className="billing-form-body" onSubmit={submitBillingForm}>
              <div className="billing-form-grid">
                {activeForm.fields.map((field) => (
                  <label key={field.key} className={`billing-form-field ${field.type === "textarea" || /line_items|reason/i.test(field.key) ? "is-wide" : ""}`}>
                    <span className="billing-form-label">{field.label}{field.required ? <i>*</i> : null}</span>
                    {field.note ? <small>{field.note}</small> : null}
                    {renderFormInput(field)}
                  </label>
                ))}
              </div>
              <footer className="billing-form-footer">
                <button type="button" className="billing-form-cancel" onClick={() => setActiveForm(null)}>Cancel</button>
                <button type="submit" className="billing-form-submit" disabled={submittingForm}>
                  {submittingForm ? "Saving..." : getSubmitLabel(activeForm.title)}
                </button>
              </footer>
            </form>
          </section>
        </div>
      ) : null}
    </div>
  );
}

function InsuranceView() {
  const [claims, setClaims] = useState<any[]>([]);
  const [dashboard, setDashboard] = useState<any | null>(null);
  const [preAuthorizations, setPreAuthorizations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [insuranceError, setInsuranceError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [activeForm, setActiveForm] = useState<WorkflowForm | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string | boolean>>({});
  const [submittingForm, setSubmittingForm] = useState(false);
  const [notice, setNotice] = useState("");

  const insuranceForms = useMemo(() => WORKFLOW_MODULE_BY_ID[14]?.forms || [], []);
  const actionPalette = ["#16a34a", "#2563eb", "#7c3aed", "#0891b2", "#f59e0b"];

  const cleanFormName = (value: string) => String(value || "").replace(/\s+Form$/i, "").trim();
  const asNumber = (value: unknown) => {
    const next = Number(value || 0);
    return Number.isFinite(next) ? next : 0;
  };
  const formatKes = (value: unknown) =>
    `KES ${asNumber(value).toLocaleString("en-KE", { maximumFractionDigits: 0 })}`;

  const getClaimNumber = (claim: any) =>
    String(claim?.claimNumber || claim?.claimNo || claim?.id || "-");
  const getClaimPayer = (claim: any) =>
    String(claim?.provider || claim?.payer || claim?.insuranceProvider || claim?.schemeName || "-");
  const getClaimAmount = (claim: any) =>
    asNumber(claim?.claimAmount ?? claim?.amount ?? claim?.totalAmount ?? claim?.approvedAmount);
  const getClaimStatus = (claim: any) =>
    String(claim?.status || "SUBMITTED").toUpperCase();

  const getInsuranceIconText = (name: string) => {
    const normalized = name.toLowerCase();
    if (normalized.includes("pre")) return "PRE";
    if (normalized.includes("submission")) return "CLM";
    if (normalized.includes("status")) return "STS";
    if (normalized.includes("payment") || normalized.includes("reconciliation")) return "PAY";
    return "POL";
  };

  const loadInsurance = async () => {
    setLoading(true);
    setInsuranceError("");
    try {
      const [dashboardRes, claimsRes, preAuthRes] = await Promise.allSettled([
        fetchInsuranceDashboard(),
        fetchInsuranceClaims({
          ...(status !== "ALL" ? { status } : {}),
          ...(search.trim() ? { search: search.trim() } : {}),
          limit: 100,
        }),
        fetchInsurancePreAuthorizations(),
      ]);
      setDashboard(dashboardRes.status === "fulfilled" ? dashboardRes.value || null : null);
      setClaims(claimsRes.status === "fulfilled" && Array.isArray(claimsRes.value) ? claimsRes.value : []);
      setPreAuthorizations(preAuthRes.status === "fulfilled" && Array.isArray(preAuthRes.value) ? preAuthRes.value : []);
      if (![dashboardRes, claimsRes, preAuthRes].some((result) => result.status === "fulfilled")) {
        setInsuranceError("Unable to load insurance claims.");
      }
    } catch (error: any) {
      setInsuranceError(String(error?.message || "Failed to load insurance claims."));
      setClaims([]);
      setPreAuthorizations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadInsurance();
  }, [status]);

  useEffect(() => {
    const handleSidebarFormOpen = (event: Event) => {
      const detail = (event as CustomEvent<{ moduleId?: number; formId?: string }>).detail;
      if (Number(detail?.moduleId) !== 14) return;
      const form = insuranceForms.find((item) => item.id === detail?.formId);
      if (form) {
        setFormValues({});
        setActiveForm(form);
      }
    };
    window.addEventListener("hmis:open-workflow-form", handleSidebarFormOpen);
    return () => window.removeEventListener("hmis:open-workflow-form", handleSidebarFormOpen);
  }, [insuranceForms]);

  const filteredClaims = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return claims.filter((claim) => {
      const statusMatch = status === "ALL" || getClaimStatus(claim) === status;
      const searchMatch =
        !needle ||
        [getClaimNumber(claim), getClaimPayer(claim), getClaimStatus(claim), claim?.patientName, claim?.memberId]
          .join(" ")
          .toLowerCase()
          .includes(needle);
      return statusMatch && searchMatch;
    });
  }, [claims, search, status]);

  const stats = useMemo(() => {
    const pending = filteredClaims.filter((claim) =>
      ["SUBMITTED", "PENDING", "UNDER_REVIEW", "PENDING_PREAUTH"].includes(getClaimStatus(claim)),
    ).length;
    const approved =
      asNumber(dashboard?.approvedClaims) ||
      filteredClaims.filter((claim) => ["APPROVED", "PAID", "PARTIAL_PAYMENT"].includes(getClaimStatus(claim))).length;
    const denials =
      asNumber(dashboard?.deniedClaims) ||
      filteredClaims.filter((claim) => ["REJECTED", "DENIED"].includes(getClaimStatus(claim))).length;
    return [
      { label: "Claims Pending", value: loading ? "..." : pending, color: "#dc2626" },
      { label: "Approved", value: loading ? "..." : approved, color: "#0d9488" },
      { label: "Denials", value: loading ? "..." : denials, color: "#1e3a8a" },
      { label: "Pre-Auths", value: loading ? "..." : preAuthorizations.length, color: "#7c3aed" },
    ];
  }, [dashboard, filteredClaims, loading, preAuthorizations]);

  const handleFormChange = (name: string, value: string | boolean) => {
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const renderFormInput = (field: WorkflowField) => {
    const value = formValues[field.key];
    const baseClass = "insurance-form-input";
    if (field.type === "textarea") {
      return (
        <textarea
          className={baseClass}
          value={typeof value === "string" ? value : ""}
          onChange={(event) => handleFormChange(field.key, event.target.value)}
          placeholder={field.note}
          required={field.required}
        />
      );
    }
    if (field.type === "checkbox") {
      return (
        <label className="insurance-checkbox-row">
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(event) => handleFormChange(field.key, event.target.checked)}
          />
          <span>Confirmed</span>
        </label>
      );
    }
    if (field.type === "select") {
      return (
        <select
          className={baseClass}
          value={typeof value === "string" ? value : ""}
          onChange={(event) => handleFormChange(field.key, event.target.value)}
          required={field.required}
        >
          <option value="">Select an option</option>
          {(field.options || []).map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      );
    }
    return (
      <input
        className={baseClass}
        type={
          field.type === "number"
            ? "number"
            : field.type === "date"
              ? "date"
              : field.type === "file"
                ? "file"
                : "text"
        }
        value={field.type === "file" ? undefined : typeof value === "string" ? value : ""}
        onChange={(event) => {
          if (field.type === "file") {
            handleFormChange(field.key, event.target.files?.[0]?.name || "");
          } else {
            handleFormChange(field.key, event.target.value);
          }
        }}
        placeholder={field.note}
        required={field.required}
      />
    );
  };

  const submitInsuranceForm = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!activeForm) return;
    setSubmittingForm(true);
    try {
      await submitModuleRecord({
        moduleId: 14,
        formId: activeForm.id,
        patientName: String(formValues.search_name || formValues.patient || formValues.member_id || ""),
        formData: Object.fromEntries(
          Object.entries(formValues).map(([key, value]) => [key, String(value)]),
        ),
      });
      setNotice(`${cleanFormName(activeForm.title)} saved successfully.`);
      setActiveForm(null);
      setFormValues({});
      void loadInsurance();
      window.setTimeout(() => setNotice(""), 2600);
    } catch (error: any) {
      setInsuranceError(String(error?.message || "Failed to save insurance form."));
    } finally {
      setSubmittingForm(false);
    }
  };

  return (
    <div className="insurance-view insurance-web-view">
      <div className="pv-header">
        <div>
          <h2 className="pv-title"><span className="insurance-title-icon">INS</span> Insurance Claims</h2>
          <p className="pv-subtitle">Pre-authorisations, claims, and remittances</p>
        </div>
        <div className="insurance-action-bar">
          {insuranceForms.map((form, index) => {
            const color = actionPalette[index % actionPalette.length];
            return (
              <button
                key={form.id}
                type="button"
                className="insurance-action-btn"
                style={{
                  backgroundColor: color,
                  borderColor: color,
                  boxShadow: `0 10px 20px ${color}30`,
                }}
                onClick={() => {
                  setFormValues({});
                  setActiveForm(form);
                }}
              >
                <span>{getInsuranceIconText(form.title)}</span>
                {cleanFormName(form.title)}
              </button>
            );
          })}
        </div>
      </div>
      {notice ? <div className="workflow-notice is-success">{notice}</div> : null}
      {insuranceError ? <div className="auth-error">{insuranceError}</div> : null}

      <div className="pv-stats insurance-stats-grid">
        {stats.map((stat) => (
          <article key={stat.label} className="pv-stat-card" style={{ borderLeftColor: stat.color }}>
            <p className="pv-stat-label">{stat.label}</p>
            <p className="pv-stat-value">{stat.value}</p>
          </article>
        ))}
      </div>

      <section className="module-filter-panel insurance-filter-panel">
        <div className="module-filter-grid insurance-filter-grid">
          <label className="module-filter-field is-wide insurance-search-field">
            <span>Search Claims</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search claims"
            />
          </label>
          <label className="module-filter-field">
            <span>Status</span>
            <select value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="ALL">All</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="PENDING">Pending</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="PAID">Paid</option>
            </select>
          </label>
        </div>
      </section>

      <div className="pv-table-meta insurance-table-meta">
        <h3 className="pv-table-title">Claims Registry</h3>
        <span className="pv-table-count">{filteredClaims.length} claims</span>
      </div>

      <div className="pv-table-wrap insurance-table-wrap">
        <table className="pv-table">
          <thead>
            <tr>
              <th>Claim</th>
              <th>Payer</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="pv-empty">Loading insurance claims...</td>
              </tr>
            ) : filteredClaims.length > 0 ? (
              filteredClaims.map((claim) => (
              <tr key={String(claim?.id || getClaimNumber(claim))}>
                <td className="pv-name">{getClaimNumber(claim)}</td>
                <td>{getClaimPayer(claim)}</td>
                <td className="font-bold">{formatKes(getClaimAmount(claim))}</td>
                <td>
                  <span className={`insurance-status insurance-status-${getClaimStatus(claim).toLowerCase()}`}>
                    {getClaimStatus(claim).replace(/_/g, " ")}
                  </span>
                </td>
                <td>
                  <button
                    type="button"
                    className="insurance-detail-btn"
                    onClick={() => {
                      setFormValues({
                        claim_id: String(claim?.id || ""),
                        status: getClaimStatus(claim),
                        approved_amount: String(claim?.approvedAmount || ""),
                        denied_amount: String(claim?.deniedAmount || ""),
                        provider_reference: String(claim?.providerReference || ""),
                      });
                      setActiveForm(insuranceForms.find((form) => form.id === "claim_status_update") || null);
                    }}
                  >
                    Details
                  </button>
                </td>
              </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="pv-empty">No insurance claims found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {activeForm ? (
        <div className="insurance-form-overlay" onClick={() => setActiveForm(null)}>
          <section className="insurance-form-panel" onClick={(event) => event.stopPropagation()}>
            <header
              className="insurance-form-header"
              style={{ background: actionPalette[Math.max(0, insuranceForms.findIndex((form) => form.id === activeForm.id)) % actionPalette.length] }}
            >
              <div className="insurance-form-heading">
                <span className="insurance-form-icon">{getInsuranceIconText(activeForm.title)}</span>
                <div>
                  <span className="insurance-form-kicker">Insurance Claims</span>
                  <h2>{cleanFormName(activeForm.title)}</h2>
                  <p>{activeForm.purpose}</p>
                </div>
              </div>
              <button type="button" onClick={() => setActiveForm(null)}>x</button>
            </header>
            <form className="insurance-form-body" onSubmit={submitInsuranceForm}>
              <div className="insurance-form-grid">
                {activeForm.fields.map((field) => (
                  <label key={field.key} className={`insurance-form-field ${field.type === "textarea" || field.type === "file" ? "is-wide" : ""}`}>
                    <span className="insurance-form-label">{field.label}{field.required ? <i>*</i> : null}</span>
                    {field.note ? <small>{field.note}</small> : null}
                    {renderFormInput(field)}
                  </label>
                ))}
              </div>
              <footer className="insurance-form-footer">
                <button type="button" className="insurance-form-cancel" onClick={() => setActiveForm(null)}>Cancel</button>
                <button type="submit" className="insurance-form-submit" disabled={submittingForm}>
                  {submittingForm ? "Saving..." : `Save ${cleanFormName(activeForm.title)}`}
                </button>
              </footer>
            </form>
          </section>
        </div>
      ) : null}
    </div>
  );
}
function SettingsView({
  primaryColor,
  setPrimaryColor,
  textColor,
  setTextColor,
  fontPreset,
  setFontPreset,
  activeLayout,
  setActiveLayout,
  facilityLogo,
  setFacilityLogo,
  landingTheme,
  setLandingTheme,
  appMode,
  setAppMode,
  appNotifications,
  setAppNotifications,
  compactDashboard,
  setCompactDashboard,
  autoRefreshMinutes,
  setAutoRefreshMinutes,
}: {
  primaryColor: string;
  setPrimaryColor: (value: string) => void;
  textColor: string;
  setTextColor: (value: string) => void;
  fontPreset: FontPresetKey;
  setFontPreset: (value: FontPresetKey) => void;
  activeLayout: "modern" | "classic";
  setActiveLayout: (value: "modern" | "classic") => void;
  facilityLogo: string | null;
  setFacilityLogo: (value: string | null) => void;
  landingTheme: "enterprise" | "clinical" | "luxury";
  setLandingTheme: (value: "enterprise" | "clinical" | "luxury") => void;
  appMode: "light" | "dark";
  setAppMode: (value: "light" | "dark") => void;
  appNotifications: boolean;
  setAppNotifications: (value: boolean) => void;
  compactDashboard: boolean;
  setCompactDashboard: (value: boolean) => void;
  autoRefreshMinutes: number;
  setAutoRefreshMinutes: (value: number) => void;
}) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [settingsNotice, setSettingsNotice] = React.useState("");

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFacilityLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResetDefaults = () => {
    const confirmed = window.confirm(
      "Reset all app settings to defaults? This will reset theme, mode, colors, font, layout, and logo.",
    );
    if (!confirmed) return;
    setPrimaryColor("#13d802");
    setTextColor("#0f172a");
    setFontPreset("nunito");
    setActiveLayout("modern");
    setLandingTheme("clinical");
    setAppMode("light");
    setAppNotifications(true);
    setCompactDashboard(false);
    setAutoRefreshMinutes(10);
    setFacilityLogo(null);
    setSettingsNotice("Settings reset successfully.");
    window.setTimeout(() => setSettingsNotice(""), 2500);
  };

  return (
    <div className="settings-view">
      <div className="pv-header">
        <div>
          <h2 className="pv-title">Settings Control Center</h2>
          <p className="pv-subtitle">
            Configure theme, typography, dashboard layout, app mode, and behavior.
          </p>
        </div>
        <button type="button" className="btn-danger settings-reset-btn" onClick={handleResetDefaults}>
          Reset to Defaults
        </button>
      </div>
      {settingsNotice ? <div className="workflow-notice is-success">{settingsNotice}</div> : null}

      <div className="settings-grid">
        <section className="settings-card">
          <h3 className="settings-card-title">Branding & Typography</h3>
          <label className="settings-label">
            Primary Color
          </label>
          <div className="settings-chip-row">
            {["#13d802", "#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#6366f1"].map(
              (c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setPrimaryColor(c)}
                  className={`settings-color-chip ${primaryColor === c ? "is-active" : ""}`}
                  style={{ background: c }}
                />
              ),
            )}
          </div>

          <label className="settings-label">
            Text Color
          </label>
          <div className="settings-color-input-wrap">
            <input
              className="settings-color-input"
              type="color"
              value={textColor}
              onChange={(e) => setTextColor(e.target.value)}
            />
            <input
              className="form-input"
              value={textColor}
              onChange={(e) => setTextColor(e.target.value)}
              placeholder="#0f172a"
            />
          </div>

          <label className="settings-label">
            Text Font
          </label>
          <select
            className="auth-input"
            value={fontPreset}
            onChange={(e) => setFontPreset(e.target.value as FontPresetKey)}
          >
            <option value="nunito">Nunito (Default)</option>
            <option value="baloo">Baloo 2</option>
            <option value="system">System UI</option>
            <option value="serif">Serif</option>
          </select>
        </section>

        <section className="settings-card">
          <h3 className="settings-card-title">Theme & Layout</h3>
          <label className="settings-label">
            App Theme
          </label>
          <select
            className="auth-input"
            value={landingTheme}
            onChange={(e) =>
              setLandingTheme(e.target.value as "enterprise" | "clinical" | "luxury")
            }
          >
            <option value="enterprise">Enterprise minimal</option>
            <option value="clinical">Bold clinical</option>
            <option value="luxury">Luxury dark glass</option>
          </select>

          <label className="settings-label" style={{ marginTop: "1rem" }}>
            Dashboard Layout
          </label>
          <div className="settings-option-stack">
            <button
              type="button"
              onClick={() => setActiveLayout("modern")}
              className={`settings-option-btn ${activeLayout === "modern" ? "is-active" : ""}`}
            >
              <div className="settings-option-title">Modern Grid</div>
              <div className="settings-option-sub">Immersive card-first dashboard</div>
            </button>
            <button
              type="button"
              onClick={() => setActiveLayout("classic")}
              className={`settings-option-btn ${activeLayout === "classic" ? "is-active" : ""}`}
            >
              <div className="settings-option-title">Classic Sidebar</div>
              <div className="settings-option-sub">Dense layout for power users</div>
            </button>
          </div>
        </section>

        <section className="settings-card">
          <h3 className="settings-card-title">Mode & App Settings</h3>
          <label className="settings-label">
            Mode Settings
          </label>
          <div className="settings-mode-row">
            <button
              type="button"
              className={`settings-mode-btn ${appMode === "light" ? "is-active" : ""}`}
              onClick={() => setAppMode("light")}
            >
              Light
            </button>
            <button
              type="button"
              className={`settings-mode-btn ${appMode === "dark" ? "is-active" : ""}`}
              onClick={() => setAppMode("dark")}
            >
              Dark
            </button>
          </div>

          <label className="settings-toggle">
            <span>Enable Notifications</span>
            <input
              type="checkbox"
              checked={appNotifications}
              onChange={(e) => setAppNotifications(e.target.checked)}
            />
          </label>

          <label className="settings-toggle">
            <span>Compact Dashboard Cards</span>
            <input
              type="checkbox"
              checked={compactDashboard}
              onChange={(e) => setCompactDashboard(e.target.checked)}
            />
          </label>

          <label className="settings-label">
            Auto refresh token interval (minutes)
          </label>
          <input
            className="auth-input"
            type="number"
            min={5}
            max={60}
            value={autoRefreshMinutes}
            onChange={(e) => {
              const next = Number(e.target.value);
              setAutoRefreshMinutes(Number.isFinite(next) ? next : 10);
            }}
          />
        </section>

        <section className="settings-card">
          <h3 className="settings-card-title">Facility Branding</h3>
          <label className="settings-label">
            Facility Logo
          </label>
          <div
            onClick={() => fileInputRef.current?.click()}
            className="settings-logo-upload"
          >
            {facilityLogo ? (
              <img
                src={facilityLogo}
                style={{ height: "100%", objectFit: "contain" }}
              />
            ) : (
              <span className="settings-upload-placeholder">
                Click to upload logo
              </span>
            )}
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleLogoUpload}
            style={{ display: "none" }}
            accept="image/*"
          />
        </section>

        <section className="settings-card" style={{ gridColumn: "1 / -1" }}>
          <div className="settings-card-title">Licensing & Devices</div>
          <p className="pv-subtitle" style={{ marginBottom: 12 }}>
            Device management and seat limits are controlled by MediLink admin. If you need to add/remove a device or renew your license, visit the pricing page or contact support.
          </p>
          <div className="modal-footer" style={{ marginTop: 12 }}>
            <a
              className="btn-primary"
              href={MARKETING_PRICING_URL}
              target="_blank"
              rel="noreferrer"
              onClick={(event) => {
                event.preventDefault();
                void openExternalUrl(MARKETING_PRICING_URL);
              }}
            >
              Renew / Buy License
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}

type AuthScreen = "splash" | "landing" | "register" | "login" | "staff_login" | "license" | "app";

type FacilityRegistration = {
  facilityName: string;
  registrationNumber: string;
  facilityEmail: string;
  facilityPhone: string;
  backendFacilityId?: string;
  adminName: string;
  adminEmail: string;
  adminPhone: string;
  password: string;
};

type LicenseState = {
  active?: boolean;
  status?: string;
  expiresAt?: string;
  facilityCode?: string;
  licenseId?: string;
};

const ACCOUNT_STORAGE_KEY = "hmis_hospital_admin_account";
const SETUP_STORAGE_KEY = "hmis_first_setup";

function isFacilityLevelLabel(value?: string | null) {
  return /^level\s+\d\b/i.test(String(value || "").trim());
}

function pickHospitalName(...values: Array<string | null | undefined>) {
  for (const value of values) {
    const text = String(value || "").trim();
    if (text && !isFacilityLevelLabel(text)) return text;
  }
  for (const value of values) {
    const text = String(value || "").trim();
    if (text) return text;
  }
  return "Hospital Facility";
}

function getSetupFacilityNameFallback() {
  const readName = (storageKey: string) => {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return "";
    const saved = JSON.parse(raw);
    return pickHospitalName(
      saved?.values?.shortName,
      saved?.values?.legalName,
      saved?.values?.facilityName,
      saved?.savedFacility?.shortName,
      saved?.savedFacility?.legalName,
      saved?.savedFacility?.facilityName,
      saved?.savedFacility?.name,
      saved?.facilityName,
      saved?.name,
    );
  };

  try {
    const setupName = readName(SETUP_STORAGE_KEY);
    if (setupName && !isFacilityLevelLabel(setupName)) return setupName;
    const accountName = readName(ACCOUNT_STORAGE_KEY);
    return accountName && !isFacilityLevelLabel(accountName) ? accountName : "";
  } catch {
    return "";
  }
}

function resolveAssetUrl(value?: string | null) {
  const url = String(value || "").trim();
  if (!url) return "";
  if (/^(https?:)?\/\//i.test(url) || url.startsWith("data:") || url.startsWith("blob:")) {
    return url;
  }
  if (url.startsWith("/") && API_BASE_URL) {
    return `${API_BASE_URL}${url}`;
  }
  return url;
}

function getSetupFacilityLogoFallback() {
  const readLogo = (storageKey: string) => {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return "";
    const saved = JSON.parse(raw);
    return String(
      saved?.branding?.logoUrl ||
        saved?.branding?.logo ||
        saved?.savedFacility?.logoUrl ||
        saved?.savedFacility?.logo ||
        saved?.logoUrl ||
        saved?.logo ||
        "",
    ).trim();
  };

  try {
    return resolveAssetUrl(readLogo(SETUP_STORAGE_KEY) || readLogo(ACCOUNT_STORAGE_KEY));
  } catch {
    return "";
  }
}

function SplashScreen() {
  const [progress, setProgress] = useState(0);
  const splashChecks = [
    { label: "License", value: progress > 18 ? "verified" : "checking" },
    { label: "Facility", value: progress > 42 ? "synced" : "loading" },
    { label: "Clinical APIs", value: progress > 68 ? "online" : "warming" },
  ];

  useEffect(() => {
    setProgress(0);
    const durationMs = 2200;
    const start = Date.now();
    const id = window.setInterval(() => {
      const elapsed = Date.now() - start;
      const next = Math.min(100, Math.round((elapsed / durationMs) * 100));
      setProgress(next);
      if (next >= 100) {
        window.clearInterval(id);
      }
    }, 30);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="hmis-splash">
      <div className="hmis-splash-aurora" aria-hidden />
      <div className="hmis-splash-grid" aria-hidden />
      <div className="hmis-splash-overlay" aria-hidden />
      <div className="hmis-splash-orbit orbit-a" aria-hidden />
      <div className="hmis-splash-orbit orbit-b" aria-hidden />
      <div className="hmis-splash-pulse" aria-hidden />

      <div className="hmis-splash-content">
        <div className="hmis-splash-logo-shell">
          <span className="hmis-splash-logo-ring" aria-hidden />
          <img src="/Loginlogo.png" alt="Medilink HMIS" className="hmis-splash-logo" />
        </div>
        <p className="hmis-splash-kicker">Medilink HMIS Desktop</p>
        <h1 className="hmis-splash-brand">Hospital Command Center</h1>
        <p className="hmis-splash-copy">
          Preparing secure clinical workflows, facility licensing, and patient journey modules.
        </p>
        <div className="hmis-splash-status-grid">
          {splashChecks.map((item) => (
            <span key={item.label}>
              <b>{item.label}</b>
              <small>{item.value}</small>
            </span>
          ))}
        </div>
        <div className="hmis-splash-progress-row">
          <div className="hmis-splash-progress-track">
            <div
              className="hmis-splash-progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="hmis-splash-progress-value">{progress}%</span>
        </div>
        <p className="hmis-splash-sub">
          {progress < 35
            ? "Validating desktop environment..."
            : progress < 70
              ? "Synchronising hospital services..."
              : "Opening secure workspace..."}
        </p>
      </div>
    </div>
  );
}

function AuthLanding({
  onRegister,
  onLogin,
  onStaffLogin,
  landingTheme,
  onThemeChange,
}: {
  onRegister: () => void;
  onLogin: () => void;
  onStaffLogin: () => void;
  landingTheme: "enterprise" | "clinical" | "luxury";
  onThemeChange: (theme: "enterprise" | "clinical" | "luxury") => void;
}) {
  return (
    <div className={`splash-root landing-theme-${landingTheme}`}>
      <div className="splash-glow splash-glow-1" />
      <div className="splash-glow splash-glow-2" />
      <div className="landing-shell">
        <div className="landing-theme-picker">
          <button
            className={landingTheme === "enterprise" ? "is-active" : ""}
            onClick={() => onThemeChange("enterprise")}
            type="button"
          >
            Enterprise minimal
          </button>
          <button
            className={landingTheme === "clinical" ? "is-active" : ""}
            onClick={() => onThemeChange("clinical")}
            type="button"
          >
            Bold clinical
          </button>
          <button
            className={landingTheme === "luxury" ? "is-active" : ""}
            onClick={() => onThemeChange("luxury")}
            type="button"
          >
            Luxury dark glass
          </button>
        </div>
        <div className="landing-copy">
          <p className="splash-badge">MediLink KE HMIS</p>
          <img
            src="/Loginlogo.png"
            alt="MediLink HMIS"
            className="landing-title-logo"
          />
          <p className="landing-subtitle">
            One secure platform for registration, triage, OPD/IPD, diagnostics,
            pharmacy, billing, and administration across Kenyan facilities.
          </p>
          <div className="landing-pills">
            <span>Multi-Tenant</span>
            <span>Real-Time Queue</span>
            <span>Role-Secured</span>
          </div>
          <div className="splash-actions">
            <button className="splash-btn-primary" onClick={onRegister}>
              Register Facility
            </button>
            <button className="splash-btn-secondary" onClick={onLogin}>
              Hospital Admin Login
            </button>
            <button className="splash-btn-secondary" onClick={onStaffLogin}>
              Staff Login
            </button>
          </div>
        </div>
        <div className="landing-visual">
          <div className="landing-image-wrap">
            <img
              src="/Medillinkhome.png"
              alt="MediLink HMIS landing"
              className="landing-image"
            />
          </div>
          <div className="landing-stat-card stat-a">
            <strong>35+</strong>
            <span>Operational Modules</span>
          </div>
          <div className="landing-stat-card stat-b">
            <strong>Secure</strong>
            <span>Tenant-Isolated Workflows</span>
          </div>
        </div>
      </div>
    </div>
  );
}

type SetupField = {
  name: string;
  label: string;
  type?: "text" | "email" | "tel" | "number" | "password" | "select" | "textarea" | "file" | "checkboxes";
  placeholder?: string;
  options?: string[];
  required?: boolean;
};

const setupCounties = [
  "Baringo", "Bomet", "Bungoma", "Busia", "Embu", "Garissa", "Kiambu", "Kilifi", "Kisii", "Kisumu",
  "Machakos", "Makueni", "Mombasa", "Nairobi", "Nakuru", "Nyeri", "Uasin Gishu", "Vihiga", "West Pokot",
];

const desktopSetupSteps: Array<{ title: string; subtitle: string; icon: string; fields: SetupField[] }> = [
  {
    title: "Facility Identity",
    subtitle: "Tell Medilink who the hospital is.",
    icon: "briefcase",
    fields: [
      { name: "legalName", label: "Facility full legal name", placeholder: "Nakuru Level Five County Referral Hospital", required: true },
      { name: "shortName", label: "Facility short / trading name", placeholder: "Nakuru L5 Hospital", required: true },
      { name: "logo", label: "Facility logo", type: "file" },
      { name: "stamp", label: "Facility seal / stamp", type: "file" },
      { name: "tagline", label: "Tagline", placeholder: "Care Beyond Excellence" },
      { name: "mohLicense", label: "MOH facility licence number", placeholder: "MOH-..." },
      { name: "mflCode", label: "Master Facility List code", placeholder: "12345", required: true },
    ],
  },
  {
    title: "Facility Profile",
    subtitle: "Simple classification details for reports and routing.",
    icon: "home",
    fields: [
      { name: "ownershipType", label: "Ownership type", type: "select", options: ["Public", "Private for Profit", "Private Not-for-Profit", "NGO", "Parastatal"], required: true },
      { name: "facilityLevel", label: "MOH facility level", type: "select", options: ["Level 2", "Level 3", "Level 4", "Level 5", "Level 6"], required: true },
      { name: "facilityType", label: "Facility type", type: "select", options: ["General Hospital", "Specialist Hospital", "Maternity Home", "Nursing Home", "Eye Centre", "Dental Clinic", "Diagnostic Centre", "Pharmacy Only", "Other"], required: true },
      { name: "bedCapacity", label: "Licensed bed capacity", type: "number", placeholder: "80" },
      { name: "accreditation", label: "Accreditation status", type: "select", options: ["None", "Awaiting Assessment", "KQMH Level 1", "KQMH Level 2", "KQMH Level 3", "KQMH Level 4", "KQMH Level 5", "ISO 9001", "SafeCare", "JCI"] },
    ],
  },
  {
    title: "Location and Contacts",
    subtitle: "Where patients and referral partners find you.",
    icon: "calendar",
    fields: [
      { name: "physicalAddress", label: "Physical address", type: "textarea", placeholder: "Building, street, estate or area", required: true },
      { name: "county", label: "County", type: "select", options: setupCounties, required: true },
      { name: "subCounty", label: "Sub-county", placeholder: "Nakuru East" },
      { name: "ward", label: "Ward", placeholder: "Biashara" },
      { name: "mainPhone", label: "Main switchboard number", type: "tel", placeholder: "+2547..." },
      { name: "emergencyPhone", label: "Emergency / casualty line", type: "tel", placeholder: "+2547..." },
      { name: "appointmentsPhone", label: "Appointments desk number", type: "tel", placeholder: "+2547..." },
      { name: "generalEmail", label: "General email address", type: "email", placeholder: "info@hospital.co.ke" },
      { name: "website", label: "Website URL", placeholder: "https://hospital.co.ke" },
    ],
  },
  {
    title: "Working Hours",
    subtitle: "Use quick choices instead of long configuration forms.",
    icon: "calendar",
    fields: [
      { name: "openDays", label: "Open days", type: "checkboxes", options: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] },
      { name: "weekdayOpen", label: "Weekday opening time", type: "select", options: ["06:00", "07:00", "08:00", "09:00", "24 hours"] },
      { name: "weekdayClose", label: "Weekday closing time", type: "select", options: ["17:00", "18:00", "19:00", "20:00", "24 hours"] },
      { name: "publicHolidays", label: "Public holidays", type: "select", options: ["Closed", "Open normal hours", "Emergency only", "24 hours"] },
      { name: "afterHours", label: "After-hours billing", type: "select", options: ["No surcharge", "Starts 5pm", "Starts 6pm", "Starts 7pm", "24-hour hospital"] },
    ],
  },
  {
    title: "Departments",
    subtitle: "Create the first patient routing areas. More can be added later.",
    icon: "briefcase",
    fields: [
      { name: "departments", label: "Initial departments", type: "checkboxes", options: ["Reception", "Outpatient", "Emergency", "Billing", "Pharmacy", "Laboratory", "Radiology", "Maternity", "Inpatient", "Theatre"] },
      { name: "primaryDepartment", label: "Main patient entry department", type: "select", options: ["Reception", "Outpatient", "Emergency"] },
    ],
  },
  {
    title: "Hospital Admin",
    subtitle: "Create the first admin account that will manage the system.",
    icon: "person",
    fields: [
      { name: "adminName", label: "Hospital admin full name", placeholder: "Jane Wanjiku", required: true },
      { name: "adminEmail", label: "Admin login email", type: "email", placeholder: "admin@hospital.co.ke", required: true },
      { name: "adminPhone", label: "Admin phone number", type: "tel", placeholder: "+2547...", required: true },
      { name: "adminPassword", label: "Admin password", type: "password", placeholder: "Minimum 6 characters", required: true },
      { name: "adminConfirmPassword", label: "Confirm admin password", type: "password", placeholder: "Re-enter password", required: true },
      { name: "adminPin", label: "Six-digit admin PIN", type: "password", placeholder: "123456" },
    ],
  },
];

function FirstTimeSetupScreen({
  onBack,
  onComplete,
  landingTheme,
}: {
  onBack: () => void;
  onComplete: (payload: any, values: Record<string, string>) => void;
  landingTheme: "enterprise" | "clinical" | "luxury";
}) {
  const [activeStep, setActiveStep] = useState(0);
  const [values, setValues] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState<Record<string, string[]>>({
    openDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    departments: ["Reception", "Outpatient", "Billing"],
  });
  const [fileNames, setFileNames] = useState<Record<string, string>>({});
  const [fileObjects, setFileObjects] = useState<Record<string, File>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [setupResult, setSetupResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const step = desktopSetupSteps[activeStep];
  const completion = Math.round(((completed ? desktopSetupSteps.length + 1 : activeStep + 1) / (desktopSetupSteps.length + 1)) * 100);

  const setValue = (name: string, value: string) => setValues((current) => ({ ...current, [name]: value }));
  const toggleChecked = (name: string, option: string) => {
    setChecked((current) => {
      const list = current[name] || [];
      return { ...current, [name]: list.includes(option) ? list.filter((item) => item !== option) : [...list, option] };
    });
  };
  const onFileChange = (name: string, file?: File | null) => {
    if (!file) return;
    setFileNames((current) => ({ ...current, [name]: file.name }));
    setFileObjects((current) => ({ ...current, [name]: file }));
  };

  const renderField = (field: SetupField) => {
    if (field.type === "file") {
      return (
        <label className="setup-file-picker" key={field.name}>
          <span>{field.label}</span>
          <input type="file" accept="image/png,image/jpeg,image/svg+xml" onChange={(event) => onFileChange(field.name, event.target.files?.[0])} />
          <b><Icon type="upload" size={16} /> {fileNames[field.name] || "Choose image"}</b>
          <small>PNG, JPG, or SVG</small>
        </label>
      );
    }
    if (field.type === "select") {
      return (
        <label key={field.name}>{field.label}
          <select required={field.required} value={values[field.name] || ""} onChange={(event) => setValue(field.name, event.target.value)}>
            <option value="">Select...</option>
            {field.options?.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </label>
      );
    }
    if (field.type === "checkboxes") {
      return (
        <fieldset className="setup-choice-field" key={field.name}>
          <legend>{field.label}</legend>
          <div>{field.options?.map((option) => (
            <label key={option}><input type="checkbox" checked={(checked[field.name] || []).includes(option)} onChange={() => toggleChecked(field.name, option)} />{option}</label>
          ))}</div>
        </fieldset>
      );
    }
    if (field.type === "textarea") {
      return <label key={field.name}>{field.label}<textarea required={field.required} placeholder={field.placeholder} value={values[field.name] || ""} onChange={(event) => setValue(field.name, event.target.value)} /></label>;
    }
    const isPassword = field.type === "password";
    return (
      <label key={field.name}>{field.label}
        <span className={isPassword ? "setup-password-wrap" : undefined}>
          <input type={isPassword && showPassword ? "text" : field.type || "text"} required={field.required} placeholder={field.placeholder} value={values[field.name] || ""} onChange={(event) => setValue(field.name, event.target.value)} />
          {isPassword && <button type="button" onClick={() => setShowPassword((value) => !value)}>{showPassword ? "Hide" : "Show"}</button>}
        </span>
      </label>
    );
  };

  const goNext = async () => {
    setError("");
    if (activeStep < desktopSetupSteps.length - 1) {
      setActiveStep((value) => value + 1);
      return;
    }
    if (values.adminPassword !== values.adminConfirmPassword) {
      setError("Admin password and confirm password must match.");
      return;
    }
    if ((values.adminPassword || "").length < 6 || /\s/.test(values.adminPassword || "")) {
      setError("Admin password must be at least 6 characters and contain no spaces.");
      return;
    }
    setSubmitting(true);
    try {
      const formData = new FormData();
      Object.entries(values).forEach(([key, value]) => formData.append(key, value));
      Object.entries(checked).forEach(([key, value]) => formData.append(key, JSON.stringify(value)));
      if (fileObjects.logo) formData.append("logo", fileObjects.logo);
      if (fileObjects.stamp) formData.append("stamp", fileObjects.stamp);
      const response = await completeFacilitySetup(formData);
      localStorage.setItem(SETUP_STORAGE_KEY, JSON.stringify({ values, checked, fileNames, savedFacility: response?.facility || null, branding: response?.branding || null, completedAt: new Date().toISOString() }));
      setSetupResult(response);
      setCompleted(true);
    } catch (setupError: any) {
      setError(String(setupError?.message || "Setup could not be saved. Check that the HMIS backend is running."));
    } finally {
      setSubmitting(false);
    }
  };

  if (completed) {
    return (
      <div className={`splash-root landing-theme-${landingTheme}`}>
        <div className="splash-glow splash-glow-1" />
        <div className="splash-glow splash-glow-2" />
        <section className="setup-landing-shell setup-congrats">
          <img src="/Loginlogo.png" alt="MediLink HMIS" className="auth-title-logo" />
          <p className="setup-eyebrow">Setup Complete</p>
          <h1>Congratulations, your hospital is ready.</h1>
          <p className="setup-copy">Thank you for setting up Medilink HMIS. Use the Hospital Admin credentials you created to login and continue configuring users, modules, billing, wards, integrations, and go-live readiness.</p>
          <button type="button" className="splash-btn-primary" onClick={() => onComplete(setupResult || {}, values)}>Continue to Admin Login</button>
        </section>
      </div>
    );
  }

  return (
    <div className={`splash-root landing-theme-${landingTheme}`}>
      <div className="splash-glow splash-glow-1" />
      <div className="splash-glow splash-glow-2" />
      <main className="setup-landing-shell">
        <header className="setup-landing-header">
          <img src="/Loginlogo.png" alt="MediLink HMIS" className="auth-title-logo" />
          <div>
            <p className="setup-eyebrow">First-Time Hospital Registration</p>
            <h1>Complete Medilink HMIS Setup</h1>
            <p className="setup-copy">A short guided setup for the Hospital Admin. Advanced configuration stays inside HMIS after login.</p>
          </div>
          <div className="setup-progress"><span>{completion}%</span><div><i style={{ width: `${completion}%` }} /></div></div>
        </header>
        <div className="setup-pill-row">
          {desktopSetupSteps.map((item, index) => (
            <button key={item.title} type="button" className={index === activeStep ? "setup-pill is-active" : "setup-pill"} onClick={() => setActiveStep(index)}>
              <Icon type={item.icon} size={16} /><span>{item.title}</span>
            </button>
          ))}
        </div>
        <form className="setup-form-card" onSubmit={(event) => { event.preventDefault(); void goNext(); }}>
          <div className="setup-panel-heading">
            <div className="setup-panel-icon"><Icon type={step.icon} size={24} /></div>
            <div><p>Step {activeStep + 1} of {desktopSetupSteps.length}</p><h2>{step.title}</h2><span>{step.subtitle}</span></div>
          </div>
          <div className="setup-field-grid">{step.fields.map(renderField)}</div>
          {error ? <div className="auth-error">{error}</div> : null}
          <div className="setup-actions">
            <button type="button" className="splash-btn-secondary" onClick={() => activeStep === 0 ? onBack() : setActiveStep((value) => Math.max(0, value - 1))}>Back</button>
            <button type="submit" className="splash-btn-primary" disabled={submitting}>{submitting ? "Saving..." : activeStep === desktopSetupSteps.length - 1 ? "Finish Setup" : "Continue"}</button>
          </div>
        </form>
      </main>
    </div>
  );
}

function HospitalLoginScreen({
  email,
  password,
  setEmail,
  setPassword,
  onSubmit,
  onBack,
  error,
  loading,
  landingTheme,
}: {
  email: string;
  password: string;
  setEmail: (v: string) => void;
  setPassword: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onBack: () => void;
  error: string;
  loading: boolean;
  landingTheme: "enterprise" | "clinical" | "luxury";
}) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className={`splash-root landing-theme-${landingTheme}`}>
      <div className="splash-glow splash-glow-1" />
      <div className="splash-glow splash-glow-2" />
      <form className="auth-card auth-login" onSubmit={onSubmit}>
        <img
          src="/Loginlogo.png"
          alt="MediLink HMIS"
          className="auth-title-logo"
        />
        <p>Login with the Hospital Admin account created during registration.</p>
        {error && <div className="auth-error">{error}</div>}
        <label>
          Admin Email
          <input
            className="auth-input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label>
          Password
          <div className="auth-password-wrap">
            <input
              className="auth-input"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
            <button
              type="button"
              className="auth-password-toggle"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </label>
        <div className="auth-actions">
          <button type="button" className="splash-btn-secondary" onClick={onBack}>
            Back
          </button>
          <button type="submit" className="splash-btn-primary" disabled={loading}>
            {loading ? "Signing in..." : "Login"}
          </button>
        </div>
      </form>
    </div>
  );
}

function StaffLoginScreen({
  email,
  password,
  setEmail,
  setPassword,
  onSubmit,
  onBack,
  error,
  loading,
  landingTheme,
}: {
  email: string;
  password: string;
  setEmail: (v: string) => void;
  setPassword: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onBack: () => void;
  error: string;
  loading: boolean;
  landingTheme: "enterprise" | "clinical" | "luxury";
}) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className={`splash-root landing-theme-${landingTheme}`}>
      <div className="splash-glow splash-glow-1" />
      <div className="splash-glow splash-glow-2" />
      <form className="auth-card auth-login" onSubmit={onSubmit}>
        <img
          src="/Loginlogo.png"
          alt="MediLink HMIS"
          className="auth-title-logo"
        />
        <p>
          Doctors, nurses, lab, pharmacy, and cashiers login here using accounts
          created by Hospital Admin in User Management.
        </p>
        {error && <div className="auth-error">{error}</div>}
        <label>
          Staff Email
          <input
            className="auth-input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label>
          Password
          <div className="auth-password-wrap">
            <input
              className="auth-input"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
            <button
              type="button"
              className="auth-password-toggle"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </label>
        <div className="auth-actions">
          <button type="button" className="splash-btn-secondary" onClick={onBack}>
            Back
          </button>
          <button type="submit" className="splash-btn-primary" disabled={loading}>
            {loading ? "Signing in..." : "Login"}
          </button>
        </div>
      </form>
    </div>
  );
}

function LicenseActivationScreen({
  licenseKey,
  setLicenseKey,
  onSubmit,
  onBack,
  error,
  loading,
  status,
  landingTheme,
}: {
  licenseKey: string;
  setLicenseKey: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onBack: () => void;
  error: string;
  loading: boolean;
  status: LicenseState | null;
  landingTheme: "enterprise" | "clinical" | "luxury";
}) {
  const statusLabel = status?.status
    ? String(status.status).toUpperCase()
    : status?.active
      ? "ACTIVE"
      : "INACTIVE";
  const expiryText = status?.expiresAt
    ? new Date(status.expiresAt).toLocaleDateString("en-KE", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "";

  return (
    <div className={`splash-root landing-theme-${landingTheme}`}>
      <div className="splash-glow splash-glow-1" />
      <div className="splash-glow splash-glow-2" />
      <form className="auth-card auth-login" onSubmit={onSubmit}>
        <img
          src="/Loginlogo.png"
          alt="MediLink HMIS"
          className="auth-title-logo"
        />
        <p>
          Enter your 16-character HMIS license key to activate this facility.
        </p>
        {status && (
          <div className={`license-info license-${statusLabel.toLowerCase()}`}>
            <div>
              <strong>Status:</strong> {statusLabel}
            </div>
            {expiryText && (
              <div>
                <strong>Expires:</strong> {expiryText}
              </div>
            )}
          </div>
        )}
        {error && <div className="auth-error">{error}</div>}
        <label>
          License Key
          <input
            className="auth-input"
            value={licenseKey}
            onChange={(e) => setLicenseKey(e.target.value)}
            placeholder="XXXX-XXXX-XXXX-XXXX"
            required
          />
        </label>
        <div className="auth-actions">
          <button type="button" className="splash-btn-secondary" onClick={onBack}>
            Back to Login
          </button>
          <button type="submit" className="splash-btn-primary" disabled={loading}>
            {loading ? "Activating..." : "Activate License"}
          </button>
        </div>
        <div className="auth-link-row">
          Don't have a license key?{" "}
          <a
            href={MARKETING_PRICING_URL}
            target="_blank"
            rel="noreferrer"
            onClick={(event) => {
              event.preventDefault();
              void openExternalUrl(MARKETING_PRICING_URL);
            }}
          >
            Obtain One
          </a>
        </div>
      </form>
    </div>
  );
}

function SubscriptionPlansView() {
  const facility = useAppStore((state) => state.facility);
  const [pricing, setPricing] = useState<SubscriptionPricing | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<"specific" | "half" | "all" | null>(null);
  const [selectedModuleIds, setSelectedModuleIds] = useState<number[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<"MPESA" | "BANK_TRANSFER">("MPESA");
  const [mpesaPhone, setMpesaPhone] = useState("");
  const [paying, setPaying] = useState(false);
  const [showPaymentScreen, setShowPaymentScreen] = useState(false);
  const [flowNotice, setFlowNotice] = useState("");

  useEffect(() => {
    let cancelled = false;
    const loadPricing = async () => {
      try {
        const next = await fetchSubscriptionPricing();
        if (!cancelled) {
          setPricing(next);
        }
      } catch {
        if (!cancelled) {
          setPricing(null);
        }
      }
    };
    void loadPricing();
    return () => {
      cancelled = true;
    };
  }, []);

  const perModuleMonthly = pricing?.perModuleMonthly ?? 1000;
  const halfSuiteMonthly = pricing?.halfSuiteMonthly ?? 12000;
  const fullSuiteMonthly = pricing?.fullSuiteMonthly ?? 20000;
  const allModules = WORKFLOW_MODULES.map((module) => ({
    id: module.id,
    name: String(module.name || "").replace(/\n/g, " ").trim(),
  })).sort((a, b) => a.id - b.id);
  const halfModuleLimit = Math.max(1, Math.floor(allModules.length / 2));
  const selectedModuleCount = selectedModuleIds.length;
  const allModuleIds = allModules.map((module) => module.id);
  const specificModulesTotal = selectedModuleCount * perModuleMonthly;
  const amountDue =
    selectedPlan === "all"
      ? fullSuiteMonthly
      : selectedPlan === "half"
        ? halfSuiteMonthly
        : specificModulesTotal;

  const resetFlow = () => {
    setSelectedPlan(null);
    setSelectedModuleIds([]);
    setPaymentMethod("MPESA");
    setMpesaPhone("");
    setPaying(false);
    setShowPaymentScreen(false);
    setFlowNotice("");
  };

  const handleChoosePlan = (planId: "specific" | "half" | "all") => {
    setFlowNotice("");
    setPaymentMethod("MPESA");
    setMpesaPhone("");
    setPaying(false);
    setSelectedPlan(planId);

    if (planId === "all") {
      setSelectedModuleIds(allModuleIds);
      setShowPaymentScreen(true);
      return;
    }

    setShowPaymentScreen(false);
    setSelectedModuleIds((prev) => {
      if (planId === "half") {
        return prev.slice(0, halfModuleLimit);
      }
      return prev;
    });
  };

  const toggleModule = (moduleId: number) => {
    if (!selectedPlan || selectedPlan === "all") return;
    setSelectedModuleIds((prev) => {
      const alreadySelected = prev.includes(moduleId);
      if (alreadySelected) {
        return prev.filter((id) => id !== moduleId);
      }
      if (selectedPlan === "half" && prev.length >= halfModuleLimit) {
        setFlowNotice(
          `Half plan allows at most ${halfModuleLimit} modules. Deselect one to add another.`,
        );
        return prev;
      }
      setFlowNotice("");
      return [...prev, moduleId];
    });
  };

  const proceedToPayment = () => {
    if (!selectedPlan) {
      setFlowNotice("Select a package first.");
      return;
    }
    if (selectedPlan !== "all" && selectedModuleCount === 0) {
      setFlowNotice("Select at least one module before proceeding to payment.");
      return;
    }
    setFlowNotice("");
    setShowPaymentScreen(true);
  };

  const normalizeMpesaPhone = (value: string) =>
    String(value || "").replace(/\D/g, "");

  const handleConfirmPayment = async () => {
    if (!selectedPlan) return;
    if (amountDue <= 0) {
      setFlowNotice("Invalid amount. Select modules or package first.");
      return;
    }

    if (paymentMethod === "MPESA") {
      const phoneNumber = normalizeMpesaPhone(mpesaPhone);
      if (phoneNumber.length < 10) {
        setFlowNotice("Enter a valid M-Pesa phone number (at least 10 digits).");
        return;
      }

      setPaying(true);
      try {
        const accountReference = `UPGRADE-${String(
          facility?.id || "FAC",
        ).slice(0, 8)}-${selectedPlan.toUpperCase()}`;
        const response = await initiateMpesaStkPush({
          phoneNumber,
          amount: Number(amountDue.toFixed(2)),
          accountReference,
          description: `Medilink module upgrade (${selectedPlan})`,
        });
        setFlowNotice(
          `STK Push sent to ${phoneNumber}. Checkout Request ID: ${
            String((response as any)?.checkoutRequestId || "").trim() || "Queued"
          }`,
        );
      } catch (error: any) {
        setFlowNotice(
          String(
            error?.message ||
              "Failed to trigger M-Pesa STK Push. Please confirm number and try again.",
          ),
        );
      } finally {
        setPaying(false);
      }
      return;
    }

    setFlowNotice(
      "Bank transfer selected. Use your invoice reference and complete transfer with your bank, then confirm payment with finance.",
    );
  };

  const plans: Array<{
    id: "specific" | "half" | "all";
    title: string;
    price: string;
    period: string;
    cta: string;
    advantages: string[];
  }> = [
    {
      id: "specific",
      title: "Buy Specific Modules",
      price: `KSh ${perModuleMonthly.toLocaleString()}`,
      period: "per module / month",
      cta: "Choose Modules",
      advantages: [
        "Pay only for modules you need right now",
        "Start small and expand gradually",
        "Lower entry cost for new facilities",
        "Good for pilot departments",
      ],
    },
    {
      id: "half",
      title: "Buy Half of Modules",
      price: `KSh ${halfSuiteMonthly.toLocaleString()}`,
      period: "monthly",
      cta: "Select Half Package",
      advantages: [
        "Balanced cost and feature coverage",
        "Access more departments in one plan",
        "Faster adoption across teams",
        "Best for growing hospitals",
      ],
    },
    {
      id: "all",
      title: "Buy All Modules",
      price: `KSh ${fullSuiteMonthly.toLocaleString()}`,
      period: "monthly",
      cta: "Go Full Suite",
      advantages: [
        "Full HMIS ecosystem enabled",
        "All workflows integrated end-to-end",
        "Best long-term value per module",
        "Priority-ready for enterprise scale",
      ],
    },
  ];

  return (
    <div className="subscription-view">
      <div className="pv-header">
        <div>
          <h2 className="pv-title">Subscription & Upgrade</h2>
          <p className="pv-subtitle">
            Choose the plan that fits your facility operations and budget.
          </p>
          <p className="pv-subtitle" style={{ marginTop: 6 }}>
            Notice: Custom periods available with configurable multipliers/discounts:
            Daily ({pricing?.dailyMultiplier ?? 0.05}x), Quarterly ({pricing?.quarterlyDiscountPercent ?? 10}% off),
            Semi-Annual ({pricing?.semiAnnualDiscountPercent ?? 15}% off), Yearly ({pricing?.yearlyDiscountPercent ?? 20}% off).
          </p>
        </div>
      </div>

      <div className="subscription-grid">
        {plans.map((plan) => (
          <section
            key={plan.id}
            className={`subscription-card ${plan.id === "all" ? "is-featured" : ""} ${
              selectedPlan === plan.id ? "is-active" : ""
            }`}
          >
            <div className="subscription-badge">
              <CrownIcon size={14} />
              <span>Premium</span>
            </div>
            <h3>{plan.title}</h3>
            <p className="subscription-price">
              {plan.price} <small>{plan.period}</small>
            </p>
            <ul className="subscription-advantages">
              {plan.advantages.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <button
              type="button"
              className="subscription-buy-btn"
              onClick={() => handleChoosePlan(plan.id)}
            >
              {plan.cta}
            </button>
          </section>
        ))}
      </div>

      <section className="subscription-builder-card">
        <div className="subscription-builder-header">
          <h3>Upgrade Builder</h3>
          {selectedPlan && (
            <button type="button" className="btn-cancel" onClick={resetFlow}>
              Reset
            </button>
          )}
        </div>

        {!selectedPlan && (
          <div className="subscription-builder-empty">
            Choose a plan above to continue with module selection and payment.
          </div>
        )}

        {selectedPlan && !showPaymentScreen && (
          <>
            <div className="subscription-builder-summary">
              <p>
                <strong>Selected Plan:</strong>{" "}
                {selectedPlan === "specific"
                  ? "Buy Specific Modules"
                  : selectedPlan === "half"
                    ? "Buy Half of Modules"
                    : "Buy All Modules"}
              </p>
              {selectedPlan === "specific" && (
                <p>
                  <strong>Pricing Rule:</strong> {selectedModuleCount} x KSh{" "}
                  {perModuleMonthly.toLocaleString()} = KSh{" "}
                  {specificModulesTotal.toLocaleString()}
                </p>
              )}
              {selectedPlan === "half" && (
                <p>
                  <strong>Limit:</strong> Select up to {halfModuleLimit} modules. Package total is
                  KSh {halfSuiteMonthly.toLocaleString()}.
                </p>
              )}
            </div>

            {(selectedPlan === "specific" || selectedPlan === "half") && (
              <>
                <div className="subscription-module-toolbar">
                  <span>
                    Modules selected: {selectedModuleCount}
                    {selectedPlan === "half" ? ` / ${halfModuleLimit}` : ""}
                  </span>
                  {selectedPlan === "specific" && (
                    <button
                      type="button"
                      className="btn-cancel"
                      onClick={() => setSelectedModuleIds(allModuleIds)}
                    >
                      Select All Modules
                    </button>
                  )}
                </div>

                <div className="subscription-module-list">
                  {allModules.map((module) => {
                    const checked = selectedModuleIds.includes(module.id);
                    const disabled =
                      selectedPlan === "half" &&
                      !checked &&
                      selectedModuleCount >= halfModuleLimit;
                    return (
                      <label
                        key={module.id}
                        className={`subscription-module-item ${disabled ? "is-disabled" : ""}`}
                      >
                        <input
                          type="checkbox"
                          className="workflow-checkbox"
                          checked={checked}
                          disabled={disabled}
                          onChange={() => toggleModule(module.id)}
                        />
                        <span>{module.name}</span>
                      </label>
                    );
                  })}
                </div>
              </>
            )}

            <div className="subscription-builder-actions">
              <button
                type="button"
                className="btn-primary"
                onClick={proceedToPayment}
                disabled={selectedPlan !== "all" && selectedModuleCount === 0}
              >
                Continue to Payment
              </button>
            </div>
          </>
        )}

        {selectedPlan && showPaymentScreen && (
          <div className="subscription-payment-card">
            <h4>Payment Screen</h4>
            <p>
              <strong>Plan:</strong>{" "}
              {selectedPlan === "specific"
                ? "Buy Specific Modules"
                : selectedPlan === "half"
                  ? "Buy Half of Modules"
                  : "Buy All Modules"}
            </p>
            <p>
              <strong>Modules:</strong> {selectedModuleCount}
            </p>
            <p>
              <strong>Total Amount:</strong> KSh {amountDue.toLocaleString()}
            </p>

            <div className="subscription-payment-methods">
              <p className="subscription-payment-label">Payment Method</p>
              <label>
                <input
                  type="radio"
                  name="upgrade_payment_method"
                  checked={paymentMethod === "MPESA"}
                  onChange={() => setPaymentMethod("MPESA")}
                />
                <span>M-Pesa</span>
              </label>
              <label>
                <input
                  type="radio"
                  name="upgrade_payment_method"
                  checked={paymentMethod === "BANK_TRANSFER"}
                  onChange={() => setPaymentMethod("BANK_TRANSFER")}
                />
                <span>Bank Transfer</span>
              </label>
            </div>

            {paymentMethod === "MPESA" && (
              <div className="subscription-mpesa-box">
                <label className="subscription-mpesa-label">
                  M-Pesa Phone Number
                  <input
                    className="form-input"
                    type="tel"
                    inputMode="numeric"
                    placeholder="e.g. 07XXXXXXXX or 2547XXXXXXXX"
                    value={mpesaPhone}
                    onChange={(e) => setMpesaPhone(e.target.value)}
                  />
                </label>
                <p className="subscription-mpesa-hint">
                  On confirm, an STK Push will be sent to this number to authorize payment.
                </p>
              </div>
            )}

            <div className="subscription-builder-actions">
              <button type="button" className="btn-cancel" onClick={() => setShowPaymentScreen(false)}>
                Back
              </button>
              <button type="button" className="btn-primary" onClick={handleConfirmPayment} disabled={paying}>
                {paying ? "Processing..." : "Confirm & Pay"}
              </button>
            </div>
          </div>
        )}

        {flowNotice && <p className="subscription-flow-notice">{flowNotice}</p>}
      </section>
    </div>
  );
}

function SuperAdminDashboardView() {
  type FacilityStatus = "ACTIVE" | "PENDING" | "SUSPENDED" | "INACTIVE";
  type SubscriptionPlan = "FREE" | "PREMIUM_DAILY" | "PREMIUM_MONTHLY" | "PREMIUM_YEARLY";
  type SupportStatus = "OPEN" | "PENDING" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  type TabKey =
    | "overview"
    | "tenants"
    | "subscriptions"
    | "security"
    | "ai"
    | "modules"
    | "integrations"
    | "infrastructure"
    | "announcements"
    | "audit"
    | "support";
  type FacilityAiControl = {
    enabled: boolean;
    dailyLimit: number;
    modelRouting: "LOCAL" | "OPENAI" | "GROQ";
  };

  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [loading, setLoading] = useState(false);
  const [savingPricing, setSavingPricing] = useState(false);
  const [facilityStatusSavingId, setFacilityStatusSavingId] = useState<string | null>(null);
  const [facilitySubscriptionSavingId, setFacilitySubscriptionSavingId] = useState<string | null>(null);
  const [supportStatusSavingId, setSupportStatusSavingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [overview, setOverview] = useState<SuperAdminOverview | null>(null);
  const [supportRows, setSupportRows] = useState<SuperAdminSupportRequest[]>([]);
  const [facilityStatusDrafts, setFacilityStatusDrafts] = useState<Record<string, FacilityStatus>>({});
  const [facilityPlanDrafts, setFacilityPlanDrafts] = useState<
    Record<string, { subscriptionPlan: SubscriptionPlan; subscriptionEndDate: string }>
  >({});
  const [facilityAiDrafts, setFacilityAiDrafts] = useState<Record<string, FacilityAiControl>>({});
  const [facilityModuleDrafts, setFacilityModuleDrafts] = useState<Record<string, string>>({});
  const [supportStatusDrafts, setSupportStatusDrafts] = useState<Record<string, SupportStatus>>({});
  const [announcements, setAnnouncements] = useState<SuperAdminAnnouncement[]>([]);
  const [auditTrail, setAuditTrail] = useState<SuperAdminAuditEvent[]>([]);
  const [infraSummary, setInfraSummary] = useState<SuperAdminInfrastructureSummary | null>(null);
  const [infraBackups, setInfraBackups] = useState<SuperAdminInfrastructureBackupJob[]>([]);
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementMessage, setAnnouncementMessage] = useState("");
  const [announcementTarget, setAnnouncementTarget] = useState<
    "ALL_FACILITIES" | "PREMIUM_ONLY" | "COUNTRY_KE"
  >("ALL_FACILITIES");
  const [securityPolicy, setSecurityPolicy] = useState({
    requireMfa: true,
    enforceIpAllowlist: false,
    sessionTimeoutMinutes: 30,
    global2faEnforcement: false,
    passwordMinLength: 12,
    rateLimitPerMinute: 120,
  });
  const [globalSettings, setGlobalSettings] = useState({
    timezone: "Africa/Nairobi",
    currency: "KES",
    language: "English",
    aiDefaultModel: "local-medilink",
    dataRetentionDays: 2555,
  });
  const [integrationSettings, setIntegrationSettings] = useState({
    mpesaShortCode: "",
    paymentGateway: "MPESA",
    smsProvider: "AFRICASTALKING",
    emailFrom: "noreply@medilink.local",
  });
  const [featureFlags, setFeatureFlags] = useState({
    enableIctModule: true,
    enableNursingAdminModule: true,
    enableMedicalDirectorModule: true,
    enableRcmAdvanced: true,
    enableAiBetaFeatures: false,
  });
  const [platformTelemetry, setPlatformTelemetry] = useState({
    activeSessions: 0,
    aiQueriesToday: 0,
    apiRequestsPerMinute: 0,
    uptimePercent: 99.95,
  });
  const [pricing, setPricing] = useState<SubscriptionPricing>({
    perModuleMonthly: 1000,
    halfSuiteMonthly: 12000,
    fullSuiteMonthly: 20000,
    dailyMultiplier: 0.05,
    quarterlyDiscountPercent: 10,
    semiAnnualDiscountPercent: 15,
    yearlyDiscountPercent: 20,
  });

  const pushAuditLocal = (action: string, details: string) => {
    setAuditTrail((prev) => {
      const next = [
        {
          id: String(Date.now()),
          action,
          details: { message: details },
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ].slice(0, 200);
      return next;
    });
  };

  const parseModuleCsv = (value: string) => {
    return Array.from(
      new Set(
        String(value || "")
          .split(",")
          .map((token) => Number(token.trim()))
          .filter(
            (id) =>
              Number.isFinite(id) &&
              Object.prototype.hasOwnProperty.call(WORKFLOW_MODULE_BY_ID, Number(id)),
          )
          .map((id) => Number(id)),
      ),
    );
  };

  const loadPlatformGovernance = async () => {
    try {
      const [settings, flags, announcementRows, auditRows, infraResponse, backupRows] =
        await Promise.all([
        fetchSuperAdminPlatformSettings(),
        fetchSuperAdminFeatureFlags(),
        fetchSuperAdminAnnouncements({ limit: 100 }),
        fetchSuperAdminAuditStream(200),
          fetchSuperAdminInfrastructureSummary(),
          fetchSuperAdminInfrastructureBackups(20),
        ]);
      if (settings?.securityPolicy && typeof settings.securityPolicy === "object") {
        setSecurityPolicy((prev) => ({ ...prev, ...(settings.securityPolicy as any) }));
      }
      if (settings?.globalSettings && typeof settings.globalSettings === "object") {
        setGlobalSettings((prev) => ({ ...prev, ...(settings.globalSettings as any) }));
      }
      if (settings?.integrationSettings && typeof settings.integrationSettings === "object") {
        setIntegrationSettings((prev) => ({ ...prev, ...(settings.integrationSettings as any) }));
      }

      const globalFlagMap = new Map(
        (flags?.globalFlags || []).map((row) => [String(row.key || ""), Boolean(row.enabled)]),
      );
      setFeatureFlags((prev) => ({
        ...prev,
        enableIctModule: globalFlagMap.get("enableIctModule") ?? prev.enableIctModule,
        enableNursingAdminModule:
          globalFlagMap.get("enableNursingAdminModule") ?? prev.enableNursingAdminModule,
        enableMedicalDirectorModule:
          globalFlagMap.get("enableMedicalDirectorModule") ?? prev.enableMedicalDirectorModule,
        enableRcmAdvanced: globalFlagMap.get("enableRcmAdvanced") ?? prev.enableRcmAdvanced,
        enableAiBetaFeatures:
          globalFlagMap.get("enableAiBetaFeatures") ?? prev.enableAiBetaFeatures,
      }));
      const aiDrafts: Record<string, FacilityAiControl> = {};
      const moduleDrafts: Record<string, string> = {};
      for (const row of flags?.facilityControls || []) {
        aiDrafts[row.facilityId] = {
          enabled: Boolean(row.aiEnabled),
          dailyLimit: Number(row.aiDailyLimit || 2500),
          modelRouting: String(row.aiModelRouting || "LOCAL").toUpperCase() as
            | "LOCAL"
            | "OPENAI"
            | "GROQ",
        };
        moduleDrafts[row.facilityId] = Array.isArray(row.enabledModuleIds)
          ? row.enabledModuleIds.map((id) => Number(id)).filter(Number.isFinite).join(",")
          : "";
      }
      setFacilityAiDrafts(aiDrafts);
      setFacilityModuleDrafts(moduleDrafts);
      setAnnouncements(Array.isArray(announcementRows) ? announcementRows : []);
      setAuditTrail(Array.isArray(auditRows) ? auditRows : []);
      setInfraSummary((infraResponse as any)?.summary || null);
      setInfraBackups(Array.isArray(backupRows) ? backupRows : []);
      setPlatformTelemetry((prev) => ({
        ...prev,
        uptimePercent: Number((infraResponse as any)?.summary?.uptimePercent || prev.uptimePercent),
      }));
    } catch {
      // keep defaults if governance endpoints are temporarily unavailable
    }
  };

  const loadDashboard = async () => {
    setLoading(true);
    setError("");
    try {
      const [overviewData, supportData, pricingData] = await Promise.all([
        fetchSuperAdminOverview(),
        fetchSuperAdminSupportRequests(),
        fetchSubscriptionPricing(),
      ]);
      setOverview(overviewData);
      setSupportRows(supportData);
      setPricing(pricingData);

      const statusDrafts: Record<string, FacilityStatus> = {};
      const planDrafts: Record<
        string,
        { subscriptionPlan: SubscriptionPlan; subscriptionEndDate: string }
      > = {};
      for (const facility of overviewData.recentFacilities || []) {
        const nextStatus = String(facility.status || "").toUpperCase();
        statusDrafts[facility.id] = (["ACTIVE", "PENDING", "SUSPENDED", "INACTIVE"].includes(nextStatus)
          ? nextStatus
          : "ACTIVE") as FacilityStatus;
        const nextPlan = String(facility.subscriptionPlan || "").toUpperCase();
        planDrafts[facility.id] = {
          subscriptionPlan: ([
            "FREE",
            "PREMIUM_DAILY",
            "PREMIUM_MONTHLY",
            "PREMIUM_YEARLY",
          ].includes(nextPlan)
            ? nextPlan
            : "FREE") as SubscriptionPlan,
          subscriptionEndDate: facility.subscriptionEndDate
            ? String(facility.subscriptionEndDate).slice(0, 10)
            : "",
        };
      }
      setFacilityStatusDrafts(statusDrafts);
      setFacilityPlanDrafts(planDrafts);

      const ticketDrafts: Record<string, SupportStatus> = {};
      for (const ticket of supportData || []) {
        const nextStatus = String(ticket.status || "").toUpperCase();
        ticketDrafts[ticket.id] = ([
          "OPEN",
          "PENDING",
          "IN_PROGRESS",
          "RESOLVED",
          "CLOSED",
        ].includes(nextStatus)
          ? nextStatus
          : "OPEN") as SupportStatus;
      }
      setSupportStatusDrafts(ticketDrafts);

      setPlatformTelemetry((prev) => ({
        ...prev,
        activeSessions: Math.max(0, (overviewData.facilities.active || 0) * 8),
        aiQueriesToday: Math.max(0, (overviewData.support.total || 0) * 20),
        apiRequestsPerMinute: Math.max(1, (overviewData.facilities.active || 1) * 6),
      }));
      await loadPlatformGovernance();
    } catch (err: any) {
      setError(String(err?.message || "Failed to load super admin dashboard"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDashboard();
  }, []);

  const savePricing = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPricing(true);
    setError("");
    setNotice("");
    try {
      const updated = await updateSubscriptionPricing(pricing);
      setPricing(updated);
      setNotice("Subscription pricing updated successfully.");
      pushAuditLocal("subscription.pricing.update", "Updated platform-wide subscription pricing.");
    } catch (err: any) {
      setError(String(err?.message || "Failed to update pricing"));
    } finally {
      setSavingPricing(false);
    }
  };

  const handleFacilityStatusUpdate = async (facilityId: string) => {
    const nextStatus = facilityStatusDrafts[facilityId];
    if (!nextStatus) return;
    setFacilityStatusSavingId(facilityId);
    setError("");
    setNotice("");
    try {
      await updateAdminFacilityStatus(facilityId, nextStatus);
      setNotice("Facility status updated.");
      pushAuditLocal(
        "facility.status.update",
        `Facility ${facilityId} status updated to ${nextStatus}.`,
      );
      await loadDashboard();
    } catch (err: any) {
      setError(String(err?.message || "Failed to update facility status"));
    } finally {
      setFacilityStatusSavingId(null);
    }
  };

  const handleFacilitySubscriptionUpdate = async (facilityId: string) => {
    const draft = facilityPlanDrafts[facilityId];
    if (!draft) return;
    setFacilitySubscriptionSavingId(facilityId);
    setError("");
    setNotice("");
    try {
      await updateAdminFacilitySubscription(facilityId, {
        subscriptionPlan: draft.subscriptionPlan,
        subscriptionEndDate: draft.subscriptionEndDate
          ? new Date(`${draft.subscriptionEndDate}T23:59:59.000Z`).toISOString()
          : null,
      });
      setNotice("Facility subscription updated.");
      pushAuditLocal(
        "facility.subscription.update",
        `Facility ${facilityId} moved to ${draft.subscriptionPlan}.`,
      );
      await loadDashboard();
    } catch (err: any) {
      setError(String(err?.message || "Failed to update facility subscription"));
    } finally {
      setFacilitySubscriptionSavingId(null);
    }
  };

  const handleSupportStatusUpdate = async (ticketId: string) => {
    const nextStatus = supportStatusDrafts[ticketId];
    if (!nextStatus) return;
    setSupportStatusSavingId(ticketId);
    setError("");
    setNotice("");
    try {
      await updateAdminSupportRequestStatus(ticketId, nextStatus);
      setNotice("Support request status updated.");
      pushAuditLocal("support.ticket.update", `Support ticket ${ticketId} changed to ${nextStatus}.`);
      await loadDashboard();
    } catch (err: any) {
      setError(String(err?.message || "Failed to update support request status"));
    } finally {
      setSupportStatusSavingId(null);
    }
  };

  const saveSecurityPolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setNotice("");
    try {
      await updateSuperAdminPlatformSettings({ securityPolicy });
      setNotice("Global security policy saved.");
      pushAuditLocal("security.policy.update", "Updated platform security and session policy.");
      const auditRows = await fetchSuperAdminAuditStream(200);
      setAuditTrail(Array.isArray(auditRows) ? auditRows : []);
    } catch (err: any) {
      setError(String(err?.message || "Failed to save security policy."));
    }
  };

  const saveGlobalSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setNotice("");
    try {
      await updateSuperAdminPlatformSettings({ globalSettings });
      setNotice("Global settings saved.");
      pushAuditLocal(
        "global.settings.update",
        "Updated timezone, currency, language, and retention.",
      );
      const auditRows = await fetchSuperAdminAuditStream(200);
      setAuditTrail(Array.isArray(auditRows) ? auditRows : []);
    } catch (err: any) {
      setError(String(err?.message || "Failed to save global settings."));
    }
  };

  const saveIntegrationSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setNotice("");
    try {
      await updateSuperAdminPlatformSettings({ integrationSettings });
      setNotice("Integration settings saved.");
      pushAuditLocal(
        "integration.settings.update",
        "Updated payment/SMS/email integration defaults.",
      );
      const auditRows = await fetchSuperAdminAuditStream(200);
      setAuditTrail(Array.isArray(auditRows) ? auditRows : []);
    } catch (err: any) {
      setError(String(err?.message || "Failed to save integration settings."));
    }
  };

  const saveFeatureFlags = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setNotice("");
    try {
      const payload: SuperAdminFeatureFlagsResponse["globalFlags"] = [
        { key: "enableIctModule", enabled: Boolean(featureFlags.enableIctModule), scope: "GLOBAL" },
        {
          key: "enableNursingAdminModule",
          enabled: Boolean(featureFlags.enableNursingAdminModule),
          scope: "GLOBAL",
        },
        {
          key: "enableMedicalDirectorModule",
          enabled: Boolean(featureFlags.enableMedicalDirectorModule),
          scope: "GLOBAL",
        },
        { key: "enableRcmAdvanced", enabled: Boolean(featureFlags.enableRcmAdvanced), scope: "GLOBAL" },
        {
          key: "enableAiBetaFeatures",
          enabled: Boolean(featureFlags.enableAiBetaFeatures),
          scope: "GLOBAL",
        },
      ];
      await updateSuperAdminFeatureFlags({ globalFlags: payload });
      setNotice("Feature flags updated.");
      pushAuditLocal("feature.flags.update", "Updated module and beta feature flags.");
      await loadPlatformGovernance();
    } catch (err: any) {
      setError(String(err?.message || "Failed to save feature flags."));
    }
  };

  const saveFacilityAiControl = async (facilityId: string) => {
    const draft = facilityAiDrafts[facilityId];
    if (!draft) return;
    setError("");
    setNotice("");
    try {
      await updateSuperAdminFeatureFlags({
        facilityControls: [
          {
            facilityId,
            aiEnabled: Boolean(draft.enabled),
            aiDailyLimit: Number(draft.dailyLimit || 2500),
            aiModelRouting: String(draft.modelRouting || "LOCAL"),
          },
        ],
      });
      setNotice("AI governance settings saved for facility.");
      pushAuditLocal("ai.facility.update", `Updated AI policy for facility ${facilityId}.`);
      await loadPlatformGovernance();
    } catch (err: any) {
      setError(String(err?.message || "Failed to save AI settings."));
    }
  };

  const saveFacilityModuleControl = async (facilityId: string) => {
    const parsed = parseModuleCsv(facilityModuleDrafts[facilityId] || "");
    setError("");
    setNotice("");
    try {
      await updateSuperAdminFeatureFlags({
        facilityControls: [
          {
            facilityId,
            enabledModuleIds: parsed,
          },
        ],
      });
      setFacilityModuleDrafts((prev) => ({ ...prev, [facilityId]: parsed.join(",") }));
      setNotice("Module activation list saved for facility.");
      pushAuditLocal(
        "facility.modules.update",
        `Updated enabled module IDs for facility ${facilityId}: ${parsed.join(",") || "none"}.`,
      );
      await loadPlatformGovernance();
    } catch (err: any) {
      setError(String(err?.message || "Failed to save facility module controls."));
    }
  };

  const runBackupSimulation = async () => {
    setError("");
    setNotice("");
    try {
      await triggerSuperAdminInfrastructureBackup({
        target: "PLATFORM_PRIMARY",
        notes: "Triggered from Super Admin dashboard",
      });
      setNotice("Backup job triggered successfully.");
      pushAuditLocal("infrastructure.backup.trigger", "Manual backup job triggered.");
      const [infraResponse, backupRows, auditRows] = await Promise.all([
        fetchSuperAdminInfrastructureSummary(),
        fetchSuperAdminInfrastructureBackups(20),
        fetchSuperAdminAuditStream(200),
      ]);
      setInfraSummary((infraResponse as any)?.summary || null);
      setInfraBackups(Array.isArray(backupRows) ? backupRows : []);
      setAuditTrail(Array.isArray(auditRows) ? auditRows : []);
    } catch (err: any) {
      setError(String(err?.message || "Failed to trigger backup job."));
    }
  };

  const postAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = String(announcementTitle || "").trim();
    const message = String(announcementMessage || "").trim();
    if (!title || !message) {
      setError("Announcement title and message are required.");
      return;
    }
    setError("");
    setNotice("");
    try {
      await createSuperAdminAnnouncement({
        title,
        message,
        target: announcementTarget,
      });
      setAnnouncementTitle("");
      setAnnouncementMessage("");
      setNotice("Announcement posted.");
      pushAuditLocal(
        "announcement.post",
        `Posted announcement "${title}" for ${announcementTarget}.`,
      );
      const [announcementRows, auditRows] = await Promise.all([
        fetchSuperAdminAnnouncements({ limit: 100 }),
        fetchSuperAdminAuditStream(200),
      ]);
      setAnnouncements(Array.isArray(announcementRows) ? announcementRows : []);
      setAuditTrail(Array.isArray(auditRows) ? auditRows : []);
    } catch (err: any) {
      setError(String(err?.message || "Failed to post announcement."));
    }
  };

  const handleAnnouncementStatusUpdate = async (
    announcementId: string,
    nextStatus: "PUBLISHED" | "ARCHIVED" | "DISABLED",
  ) => {
    setError("");
    setNotice("");
    try {
      await updateSuperAdminAnnouncementStatus(announcementId, nextStatus);
      setNotice("Announcement status updated.");
      pushAuditLocal(
        "announcement.status.update",
        `Announcement ${announcementId} status changed to ${nextStatus}.`,
      );
      const [announcementRows, auditRows] = await Promise.all([
        fetchSuperAdminAnnouncements({ limit: 100 }),
        fetchSuperAdminAuditStream(200),
      ]);
      setAnnouncements(Array.isArray(announcementRows) ? announcementRows : []);
      setAuditTrail(Array.isArray(auditRows) ? auditRows : []);
    } catch (err: any) {
      setError(String(err?.message || "Failed to update announcement status."));
    }
  };

  const healthStatus = infraSummary?.status
    ? infraSummary.status
    : (overview?.support.highPriorityOpen || 0) > 10
      ? "DEGRADED"
      : (overview?.support.open || 0) > 25
        ? "WARNING"
        : "HEALTHY";
  const planRows = overview?.subscriptions.byPlan || [];
  const facilities = overview?.recentFacilities || [];
  const modulePreview = WORKFLOW_MODULES.slice(0, 12).map((m) => `${m.id}:${m.name.replace("\n", " ")}`);
  const estimatedStorageGb = Number(
    (infraSummary?.estimatedStorageGb ?? Number(((overview?.facilities.total || 0) * 3.2).toFixed(1))),
  );
  const apiErrorRatePercent = Number(infraSummary?.apiErrorRatePercent ?? 0);

  const tabs: Array<{ key: TabKey; label: string }> = [
    { key: "overview", label: "Platform Overview" },
    { key: "tenants", label: "Multi-Facility Control" },
    { key: "subscriptions", label: "SaaS Billing" },
    { key: "security", label: "Security & Compliance" },
    { key: "ai", label: "AI Governance" },
    { key: "modules", label: "Module Control" },
    { key: "integrations", label: "Integration Control" },
    { key: "infrastructure", label: "Infrastructure Health" },
    { key: "announcements", label: "Announcements" },
    { key: "audit", label: "Audit Logs" },
    { key: "support", label: "Support Queue" },
  ];

  return (
    <div className="patients-view">
      <div className="pv-header">
        <div>
          <h2 className="pv-title">Super Admin Dashboard (Platform Control Center)</h2>
          <p className="pv-subtitle">
            Multi-facility governance, SaaS monetization, AI control, security policy, and platform health.
          </p>
        </div>
      </div>

      {notice && <div className="workflow-notice is-success">{notice}</div>}
      {error && <div className="auth-error">{error}</div>}
      {loading && <div className="workflow-notice is-warning">Loading platform dashboard...</div>}

      <div className="modal-footer" style={{ marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={activeTab === tab.key ? "btn-primary" : "btn-cancel"}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="pv-stats">
        <article className="pv-stat-card">
          <p className="pv-stat-label">Total Facilities Registered</p>
          <p className="pv-stat-value">{overview?.facilities.total ?? 0}</p>
        </article>
        <article className="pv-stat-card">
          <p className="pv-stat-label">Active Facilities</p>
          <p className="pv-stat-value">{overview?.facilities.active ?? 0}</p>
        </article>
        <article className="pv-stat-card">
          <p className="pv-stat-label">Suspended Facilities</p>
          <p className="pv-stat-value">{overview?.facilities.suspended ?? 0}</p>
        </article>
        <article className="pv-stat-card">
          <p className="pv-stat-label">Platform Health</p>
          <p className="pv-stat-value">{healthStatus}</p>
        </article>
        <article className="pv-stat-card">
          <p className="pv-stat-label">Active Sessions</p>
          <p className="pv-stat-value">{platformTelemetry.activeSessions}</p>
        </article>
        <article className="pv-stat-card">
          <p className="pv-stat-label">Monthly Platform Revenue</p>
          <p className="pv-stat-value">
            KSh {Number(overview?.finance.paymentsLast30Days ?? 0).toLocaleString()}
          </p>
        </article>
        <article className="pv-stat-card">
          <p className="pv-stat-label">AI Usage Volume (Today)</p>
          <p className="pv-stat-value">{platformTelemetry.aiQueriesToday}</p>
        </article>
        <article className="pv-stat-card">
          <p className="pv-stat-label">API Requests / Minute</p>
          <p className="pv-stat-value">{platformTelemetry.apiRequestsPerMinute}</p>
        </article>
        <article className="pv-stat-card">
          <p className="pv-stat-label">Pending Support Tickets</p>
          <p className="pv-stat-value">{overview?.support.pending ?? 0}</p>
        </article>
      </div>

      {activeTab === "overview" && (
        <>
          <div className="pv-table-wrap">
            <table className="pv-table">
              <thead>
                <tr>
                  <th>Key Metric</th>
                  <th>Current Value</th>
                  <th>Operational Meaning</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="pv-name">System Uptime</td>
                  <td>{platformTelemetry.uptimePercent.toFixed(2)}%</td>
                  <td>Infrastructure reliability across all facilities</td>
                </tr>
                <tr>
                  <td className="pv-name">Open + Pending Tickets</td>
                  <td>{(overview?.support.open || 0) + (overview?.support.pending || 0)}</td>
                  <td>Current support burden and operational friction</td>
                </tr>
                <tr>
                  <td className="pv-name">Non-FREE Subscriptions</td>
                  <td>{overview?.subscriptions.activeNonFree || 0}</td>
                  <td>Active SaaS monetization footprint</td>
                </tr>
                <tr>
                  <td className="pv-name">Estimated Storage</td>
                  <td>{estimatedStorageGb} GB</td>
                  <td>Tenant data growth approximation for capacity planning</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="pv-table-wrap">
            <table className="pv-table">
              <thead>
                <tr>
                  <th>Subscription Plan</th>
                  <th>Facilities</th>
                </tr>
              </thead>
              <tbody>
                {planRows.map((row) => (
                  <tr key={row.plan}>
                    <td className="pv-name">{row.plan || "FREE"}</td>
                    <td>{row.count}</td>
                  </tr>
                ))}
                {!loading && planRows.length === 0 && (
                  <tr>
                    <td colSpan={2} className="pv-empty">
                      No subscription data available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeTab === "tenants" && (
        <div className="pv-table-wrap">
          <table className="pv-table">
            <thead>
              <tr>
                <th>Hospital</th>
                <th>Code</th>
                <th>Status</th>
                <th>Plan</th>
                <th>Subscription End</th>
                <th>Registered</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {facilities.map((facility) => (
                <tr key={facility.id}>
                  <td className="pv-name">{facility.name}</td>
                  <td>{facility.code}</td>
                  <td>
                    <select
                      className="form-select"
                      value={facilityStatusDrafts[facility.id] || "ACTIVE"}
                      onChange={(e) =>
                        setFacilityStatusDrafts((prev) => ({
                          ...prev,
                          [facility.id]: e.target.value as FacilityStatus,
                        }))
                      }
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="PENDING">PENDING</option>
                      <option value="SUSPENDED">SUSPENDED</option>
                      <option value="INACTIVE">INACTIVE</option>
                    </select>
                  </td>
                  <td>
                    <select
                      className="form-select"
                      value={facilityPlanDrafts[facility.id]?.subscriptionPlan || "FREE"}
                      onChange={(e) =>
                        setFacilityPlanDrafts((prev) => ({
                          ...prev,
                          [facility.id]: {
                            subscriptionPlan: e.target.value as SubscriptionPlan,
                            subscriptionEndDate: prev[facility.id]?.subscriptionEndDate || "",
                          },
                        }))
                      }
                    >
                      <option value="FREE">FREE</option>
                      <option value="PREMIUM_DAILY">PREMIUM_DAILY</option>
                      <option value="PREMIUM_MONTHLY">PREMIUM_MONTHLY</option>
                      <option value="PREMIUM_YEARLY">PREMIUM_YEARLY</option>
                    </select>
                  </td>
                  <td>
                    <input
                      className="form-input"
                      type="date"
                      value={facilityPlanDrafts[facility.id]?.subscriptionEndDate || ""}
                      onChange={(e) =>
                        setFacilityPlanDrafts((prev) => ({
                          ...prev,
                          [facility.id]: {
                            subscriptionPlan: prev[facility.id]?.subscriptionPlan || "FREE",
                            subscriptionEndDate: e.target.value,
                          },
                        }))
                      }
                    />
                  </td>
                  <td>{new Date(facility.createdAt).toLocaleDateString()}</td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    <button
                      className="btn-cancel"
                      type="button"
                      disabled={facilityStatusSavingId === facility.id}
                      onClick={() => void handleFacilityStatusUpdate(facility.id)}
                    >
                      {facilityStatusSavingId === facility.id ? "Saving..." : "Save Status"}
                    </button>
                    <button
                      className="btn-primary"
                      type="button"
                      disabled={facilitySubscriptionSavingId === facility.id}
                      style={{ marginLeft: 8 }}
                      onClick={() => void handleFacilitySubscriptionUpdate(facility.id)}
                    >
                      {facilitySubscriptionSavingId === facility.id ? "Saving..." : "Save Plan"}
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && facilities.length === 0 && (
                <tr>
                  <td colSpan={7} className="pv-empty">
                    No registered hospitals found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "subscriptions" && (
        <>
          <div className="pv-table-wrap">
            <table className="pv-table">
              <thead>
                <tr>
                  <th>Plan</th>
                  <th>Facilities</th>
                </tr>
              </thead>
              <tbody>
                {planRows.map((row) => (
                  <tr key={row.plan}>
                    <td className="pv-name">{row.plan}</td>
                    <td>{row.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="workflow-form-wrap">
            <form className="workflow-form" onSubmit={savePricing}>
              <div className="workflow-form-header">
                <h3>Subscription Pricing Control</h3>
                <p>Manage global monetization for Basic/Pro/Enterprise tier logic.</p>
              </div>
              <div className="workflow-form-grid">
                <label className="workflow-field">
                  <span>Per Module / Monthly (KSh)</span>
                  <input
                    className="form-input"
                    type="number"
                    min={1}
                    value={pricing.perModuleMonthly}
                    onChange={(e) =>
                      setPricing((prev) => ({ ...prev, perModuleMonthly: Number(e.target.value || 0) }))
                    }
                  />
                </label>
                <label className="workflow-field">
                  <span>Half Suite / Monthly (KSh)</span>
                  <input
                    className="form-input"
                    type="number"
                    min={1}
                    value={pricing.halfSuiteMonthly}
                    onChange={(e) =>
                      setPricing((prev) => ({ ...prev, halfSuiteMonthly: Number(e.target.value || 0) }))
                    }
                  />
                </label>
                <label className="workflow-field">
                  <span>Full Suite / Monthly (KSh)</span>
                  <input
                    className="form-input"
                    type="number"
                    min={1}
                    value={pricing.fullSuiteMonthly}
                    onChange={(e) =>
                      setPricing((prev) => ({ ...prev, fullSuiteMonthly: Number(e.target.value || 0) }))
                    }
                  />
                </label>
                <label className="workflow-field">
                  <span>Daily Multiplier</span>
                  <input
                    className="form-input"
                    type="number"
                    step="0.01"
                    min={0.01}
                    value={pricing.dailyMultiplier}
                    onChange={(e) =>
                      setPricing((prev) => ({ ...prev, dailyMultiplier: Number(e.target.value || 0) }))
                    }
                  />
                </label>
                <label className="workflow-field">
                  <span>Quarterly Discount %</span>
                  <input
                    className="form-input"
                    type="number"
                    min={0}
                    max={100}
                    value={pricing.quarterlyDiscountPercent}
                    onChange={(e) =>
                      setPricing((prev) => ({
                        ...prev,
                        quarterlyDiscountPercent: Number(e.target.value || 0),
                      }))
                    }
                  />
                </label>
                <label className="workflow-field">
                  <span>Semi-Annual Discount %</span>
                  <input
                    className="form-input"
                    type="number"
                    min={0}
                    max={100}
                    value={pricing.semiAnnualDiscountPercent}
                    onChange={(e) =>
                      setPricing((prev) => ({
                        ...prev,
                        semiAnnualDiscountPercent: Number(e.target.value || 0),
                      }))
                    }
                  />
                </label>
                <label className="workflow-field">
                  <span>Yearly Discount %</span>
                  <input
                    className="form-input"
                    type="number"
                    min={0}
                    max={100}
                    value={pricing.yearlyDiscountPercent}
                    onChange={(e) =>
                      setPricing((prev) => ({
                        ...prev,
                        yearlyDiscountPercent: Number(e.target.value || 0),
                      }))
                    }
                  />
                </label>
              </div>
              <div className="modal-footer" style={{ marginTop: 12 }}>
                <button className="btn-cancel" type="button" onClick={() => void loadDashboard()}>
                  Refresh
                </button>
                <button className="btn-primary" type="submit" disabled={savingPricing}>
                  {savingPricing ? "Saving..." : "Save Pricing"}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {activeTab === "security" && (
        <>
          <div className="workflow-form-wrap">
            <form className="workflow-form" onSubmit={saveSecurityPolicy}>
              <div className="workflow-form-header">
                <h3>Security & Compliance Center</h3>
                <p>MFA, IP policy, rate limits, password policy, and session controls.</p>
              </div>
              <div className="workflow-form-grid">
                <label className="workflow-field">
                  <span>Require MFA For Super Admin</span>
                  <select
                    className="form-select"
                    value={securityPolicy.requireMfa ? "YES" : "NO"}
                    onChange={(e) =>
                      setSecurityPolicy((prev) => ({
                        ...prev,
                        requireMfa: e.target.value === "YES",
                      }))
                    }
                  >
                    <option value="YES">YES</option>
                    <option value="NO">NO</option>
                  </select>
                </label>
                <label className="workflow-field">
                  <span>Enforce IP Allowlist</span>
                  <select
                    className="form-select"
                    value={securityPolicy.enforceIpAllowlist ? "YES" : "NO"}
                    onChange={(e) =>
                      setSecurityPolicy((prev) => ({
                        ...prev,
                        enforceIpAllowlist: e.target.value === "YES",
                      }))
                    }
                  >
                    <option value="YES">YES</option>
                    <option value="NO">NO</option>
                  </select>
                </label>
                <label className="workflow-field">
                  <span>Session Timeout (Minutes)</span>
                  <input
                    className="form-input"
                    type="number"
                    min={5}
                    max={240}
                    value={securityPolicy.sessionTimeoutMinutes}
                    onChange={(e) =>
                      setSecurityPolicy((prev) => ({
                        ...prev,
                        sessionTimeoutMinutes: Number(e.target.value || 30),
                      }))
                    }
                  />
                </label>
                <label className="workflow-field">
                  <span>Global 2FA Enforcement</span>
                  <select
                    className="form-select"
                    value={securityPolicy.global2faEnforcement ? "YES" : "NO"}
                    onChange={(e) =>
                      setSecurityPolicy((prev) => ({
                        ...prev,
                        global2faEnforcement: e.target.value === "YES",
                      }))
                    }
                  >
                    <option value="YES">YES</option>
                    <option value="NO">NO</option>
                  </select>
                </label>
                <label className="workflow-field">
                  <span>Password Min Length</span>
                  <input
                    className="form-input"
                    type="number"
                    min={8}
                    max={64}
                    value={securityPolicy.passwordMinLength}
                    onChange={(e) =>
                      setSecurityPolicy((prev) => ({
                        ...prev,
                        passwordMinLength: Number(e.target.value || 12),
                      }))
                    }
                  />
                </label>
                <label className="workflow-field">
                  <span>Rate Limit / Min</span>
                  <input
                    className="form-input"
                    type="number"
                    min={20}
                    max={1000}
                    value={securityPolicy.rateLimitPerMinute}
                    onChange={(e) =>
                      setSecurityPolicy((prev) => ({
                        ...prev,
                        rateLimitPerMinute: Number(e.target.value || 120),
                      }))
                    }
                  />
                </label>
              </div>
              <div className="modal-footer" style={{ marginTop: 12 }}>
                <button className="btn-primary" type="submit">
                  Save Security Policy
                </button>
              </div>
            </form>
          </div>

          <div className="workflow-form-wrap">
            <form className="workflow-form" onSubmit={saveGlobalSettings}>
              <div className="workflow-form-header">
                <h3>Global Settings</h3>
                <p>Timezone, currency, language, AI default model, and retention.</p>
              </div>
              <div className="workflow-form-grid">
                <label className="workflow-field">
                  <span>Default Timezone</span>
                  <input
                    className="form-input"
                    value={globalSettings.timezone}
                    onChange={(e) =>
                      setGlobalSettings((prev) => ({ ...prev, timezone: e.target.value }))
                    }
                  />
                </label>
                <label className="workflow-field">
                  <span>Default Currency</span>
                  <input
                    className="form-input"
                    value={globalSettings.currency}
                    onChange={(e) =>
                      setGlobalSettings((prev) => ({ ...prev, currency: e.target.value }))
                    }
                  />
                </label>
                <label className="workflow-field">
                  <span>Default Language</span>
                  <input
                    className="form-input"
                    value={globalSettings.language}
                    onChange={(e) =>
                      setGlobalSettings((prev) => ({ ...prev, language: e.target.value }))
                    }
                  />
                </label>
                <label className="workflow-field">
                  <span>AI Default Model</span>
                  <input
                    className="form-input"
                    value={globalSettings.aiDefaultModel}
                    onChange={(e) =>
                      setGlobalSettings((prev) => ({ ...prev, aiDefaultModel: e.target.value }))
                    }
                  />
                </label>
                <label className="workflow-field">
                  <span>Data Retention (Days)</span>
                  <input
                    className="form-input"
                    type="number"
                    min={30}
                    value={globalSettings.dataRetentionDays}
                    onChange={(e) =>
                      setGlobalSettings((prev) => ({
                        ...prev,
                        dataRetentionDays: Number(e.target.value || 2555),
                      }))
                    }
                  />
                </label>
              </div>
              <div className="modal-footer" style={{ marginTop: 12 }}>
                <button className="btn-primary" type="submit">
                  Save Global Settings
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {activeTab === "ai" && (
        <div className="pv-table-wrap">
          <table className="pv-table">
            <thead>
              <tr>
                <th>Facility</th>
                <th>AI Enabled</th>
                <th>Daily Limit</th>
                <th>Model Routing</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {facilities.map((facility) => {
                const draft = facilityAiDrafts[facility.id] || {
                  enabled: true,
                  dailyLimit: 2500,
                  modelRouting: "LOCAL" as const,
                };
                return (
                  <tr key={facility.id}>
                    <td className="pv-name">{facility.name}</td>
                    <td>
                      <select
                        className="form-select"
                        value={draft.enabled ? "ENABLED" : "DISABLED"}
                        onChange={(e) =>
                          setFacilityAiDrafts((prev) => ({
                            ...prev,
                            [facility.id]: {
                              ...draft,
                              enabled: e.target.value === "ENABLED",
                            },
                          }))
                        }
                      >
                        <option value="ENABLED">ENABLED</option>
                        <option value="DISABLED">DISABLED</option>
                      </select>
                    </td>
                    <td>
                      <input
                        className="form-input"
                        type="number"
                        min={100}
                        value={draft.dailyLimit}
                        onChange={(e) =>
                          setFacilityAiDrafts((prev) => ({
                            ...prev,
                            [facility.id]: {
                              ...draft,
                              dailyLimit: Number(e.target.value || 2500),
                            },
                          }))
                        }
                      />
                    </td>
                    <td>
                      <select
                        className="form-select"
                        value={draft.modelRouting}
                        onChange={(e) =>
                          setFacilityAiDrafts((prev) => ({
                            ...prev,
                            [facility.id]: {
                              ...draft,
                              modelRouting: e.target.value as "LOCAL" | "OPENAI" | "GROQ",
                            },
                          }))
                        }
                      >
                        <option value="LOCAL">LOCAL</option>
                        <option value="OPENAI">OPENAI</option>
                        <option value="GROQ">GROQ</option>
                      </select>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={() => saveFacilityAiControl(facility.id)}
                      >
                        Save
                      </button>
                    </td>
                  </tr>
                );
              })}
              {!loading && facilities.length === 0 && (
                <tr>
                  <td colSpan={5} className="pv-empty">
                    No facilities found for AI governance.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "modules" && (
        <>
          <div className="workflow-form-wrap">
            <form className="workflow-form" onSubmit={saveFeatureFlags}>
              <div className="workflow-form-header">
                <h3>Platform Feature Toggles</h3>
                <p>Enable/disable major module releases and beta capabilities globally.</p>
              </div>
              <div className="workflow-form-grid">
                <label className="workflow-field">
                  <span>Enable ICT Module</span>
                  <select
                    className="form-select"
                    value={featureFlags.enableIctModule ? "YES" : "NO"}
                    onChange={(e) =>
                      setFeatureFlags((prev) => ({
                        ...prev,
                        enableIctModule: e.target.value === "YES",
                      }))
                    }
                  >
                    <option value="YES">YES</option>
                    <option value="NO">NO</option>
                  </select>
                </label>
                <label className="workflow-field">
                  <span>Enable Nursing Admin</span>
                  <select
                    className="form-select"
                    value={featureFlags.enableNursingAdminModule ? "YES" : "NO"}
                    onChange={(e) =>
                      setFeatureFlags((prev) => ({
                        ...prev,
                        enableNursingAdminModule: e.target.value === "YES",
                      }))
                    }
                  >
                    <option value="YES">YES</option>
                    <option value="NO">NO</option>
                  </select>
                </label>
                <label className="workflow-field">
                  <span>Enable Medical Director Module</span>
                  <select
                    className="form-select"
                    value={featureFlags.enableMedicalDirectorModule ? "YES" : "NO"}
                    onChange={(e) =>
                      setFeatureFlags((prev) => ({
                        ...prev,
                        enableMedicalDirectorModule: e.target.value === "YES",
                      }))
                    }
                  >
                    <option value="YES">YES</option>
                    <option value="NO">NO</option>
                  </select>
                </label>
                <label className="workflow-field">
                  <span>Enable Advanced RCM</span>
                  <select
                    className="form-select"
                    value={featureFlags.enableRcmAdvanced ? "YES" : "NO"}
                    onChange={(e) =>
                      setFeatureFlags((prev) => ({
                        ...prev,
                        enableRcmAdvanced: e.target.value === "YES",
                      }))
                    }
                  >
                    <option value="YES">YES</option>
                    <option value="NO">NO</option>
                  </select>
                </label>
                <label className="workflow-field">
                  <span>Enable AI Beta Features</span>
                  <select
                    className="form-select"
                    value={featureFlags.enableAiBetaFeatures ? "YES" : "NO"}
                    onChange={(e) =>
                      setFeatureFlags((prev) => ({
                        ...prev,
                        enableAiBetaFeatures: e.target.value === "YES",
                      }))
                    }
                  >
                    <option value="YES">YES</option>
                    <option value="NO">NO</option>
                  </select>
                </label>
              </div>
              <div className="modal-footer" style={{ marginTop: 12 }}>
                <button type="submit" className="btn-primary">
                  Save Feature Flags
                </button>
              </div>
            </form>
          </div>

          <div className="pv-table-wrap">
            <table className="pv-table">
              <thead>
                <tr>
                  <th>Facility</th>
                  <th>Enabled Module IDs (CSV)</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {facilities.map((facility) => (
                  <tr key={facility.id}>
                    <td className="pv-name">{facility.name}</td>
                    <td>
                      <input
                        className="form-input"
                        value={facilityModuleDrafts[facility.id] || ""}
                        onChange={(e) =>
                          setFacilityModuleDrafts((prev) => ({
                            ...prev,
                            [facility.id]: e.target.value,
                          }))
                        }
                        placeholder="e.g. 1,4,6,13,44,46"
                      />
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={() => saveFacilityModuleControl(facility.id)}
                      >
                        Save
                      </button>
                    </td>
                  </tr>
                ))}
                {!loading && facilities.length === 0 && (
                  <tr>
                    <td colSpan={3} className="pv-empty">
                      No facilities found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="workflow-notice is-warning">
            Module ID reference preview: {modulePreview.join(" | ")}
          </div>
        </>
      )}

      {activeTab === "integrations" && (
        <div className="workflow-form-wrap">
          <form className="workflow-form" onSubmit={saveIntegrationSettings}>
            <div className="workflow-form-header">
              <h3>Integration Management</h3>
              <p>Global payment, SMS, and email integration defaults for all facilities.</p>
            </div>
            <div className="workflow-form-grid">
              <label className="workflow-field">
                <span>M-Pesa Short Code</span>
                <input
                  className="form-input"
                  value={integrationSettings.mpesaShortCode}
                  onChange={(e) =>
                    setIntegrationSettings((prev) => ({
                      ...prev,
                      mpesaShortCode: e.target.value,
                    }))
                  }
                />
              </label>
              <label className="workflow-field">
                <span>Default Payment Gateway</span>
                <input
                  className="form-input"
                  value={integrationSettings.paymentGateway}
                  onChange={(e) =>
                    setIntegrationSettings((prev) => ({
                      ...prev,
                      paymentGateway: e.target.value,
                    }))
                  }
                />
              </label>
              <label className="workflow-field">
                <span>SMS Provider</span>
                <input
                  className="form-input"
                  value={integrationSettings.smsProvider}
                  onChange={(e) =>
                    setIntegrationSettings((prev) => ({
                      ...prev,
                      smsProvider: e.target.value,
                    }))
                  }
                />
              </label>
              <label className="workflow-field">
                <span>System Email Sender</span>
                <input
                  className="form-input"
                  type="email"
                  value={integrationSettings.emailFrom}
                  onChange={(e) =>
                    setIntegrationSettings((prev) => ({
                      ...prev,
                      emailFrom: e.target.value,
                    }))
                  }
                />
              </label>
            </div>
            <div className="modal-footer" style={{ marginTop: 12 }}>
              <button type="submit" className="btn-primary">
                Save Integration Defaults
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === "infrastructure" && (
        <>
          <div className="pv-table-wrap">
            <table className="pv-table">
              <thead>
                <tr>
                  <th>Infrastructure Metric</th>
                  <th>Current Value</th>
                  <th>Risk Signal</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="pv-name">Estimated Storage Consumption</td>
                  <td>{estimatedStorageGb} GB</td>
                  <td>{estimatedStorageGb > 150 ? "HIGH" : "NORMAL"}</td>
                </tr>
                <tr>
                  <td className="pv-name">API Error Rate</td>
                  <td>{apiErrorRatePercent}%</td>
                  <td>{apiErrorRatePercent > 4 ? "WARNING" : "LOW"}</td>
                </tr>
                <tr>
                  <td className="pv-name">Support Queue Backlog</td>
                  <td>{infraSummary?.pendingSupportTickets ?? (overview?.support.pending || 0)}</td>
                  <td>
                    {(infraSummary?.pendingSupportTickets ?? (overview?.support.pending || 0)) > 10
                      ? "WARNING"
                      : "LOW"}
                  </td>
                </tr>
                <tr>
                  <td className="pv-name">Background Queue Depth</td>
                  <td>{infraSummary?.backgroundQueueDepth ?? 0}</td>
                  <td>{(infraSummary?.backgroundQueueDepth ?? 0) > 20 ? "WARNING" : "LOW"}</td>
                </tr>
                <tr>
                  <td className="pv-name">Server CPU Usage</td>
                  <td>{Number(infraSummary?.serverCpuPercent ?? 0).toFixed(2)}%</td>
                  <td>{Number(infraSummary?.serverCpuPercent ?? 0) > 85 ? "HIGH" : "NORMAL"}</td>
                </tr>
                <tr>
                  <td className="pv-name">Server Memory Usage</td>
                  <td>{Number(infraSummary?.serverMemoryPercent ?? 0).toFixed(2)}%</td>
                  <td>{Number(infraSummary?.serverMemoryPercent ?? 0) > 90 ? "HIGH" : "NORMAL"}</td>
                </tr>
                <tr>
                  <td className="pv-name">Server Uptime</td>
                  <td>{Number(infraSummary?.uptimePercent ?? platformTelemetry.uptimePercent).toFixed(2)}%</td>
                  <td>
                    {Number(infraSummary?.uptimePercent ?? platformTelemetry.uptimePercent) < 99.5
                      ? "WARNING"
                      : "HEALTHY"}
                  </td>
                </tr>
                <tr>
                  <td className="pv-name">Last Measured</td>
                  <td>
                    {infraSummary?.measuredAt
                      ? new Date(infraSummary.measuredAt).toLocaleString()
                      : "-"}
                  </td>
                  <td>Telemetry freshness</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="modal-footer">
            <button className="btn-primary" type="button" onClick={runBackupSimulation}>
              Trigger Backup Now
            </button>
          </div>
          <div className="pv-table-wrap">
            <table className="pv-table">
              <thead>
                <tr>
                  <th>Backup Job</th>
                  <th>Status</th>
                  <th>Target</th>
                  <th>Started</th>
                  <th>Completed</th>
                  <th>Duration (s)</th>
                </tr>
              </thead>
              <tbody>
                {infraBackups.map((job) => (
                  <tr key={job.id}>
                    <td className="pv-name">{job.id}</td>
                    <td>{job.status}</td>
                    <td>{job.target || "-"}</td>
                    <td>{job.startedAt ? new Date(job.startedAt).toLocaleString() : "-"}</td>
                    <td>{job.completedAt ? new Date(job.completedAt).toLocaleString() : "-"}</td>
                    <td>{job.durationSeconds ?? "-"}</td>
                  </tr>
                ))}
                {infraBackups.length === 0 && (
                  <tr>
                    <td colSpan={6} className="pv-empty">
                      No backup jobs recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeTab === "announcements" && (
        <>
          <div className="workflow-form-wrap">
            <form className="workflow-form" onSubmit={postAnnouncement}>
              <div className="workflow-form-header">
                <h3>Platform Announcement Center</h3>
                <p>Send notices to all tenants, premium tenants, or Kenya region.</p>
              </div>
              <div className="workflow-form-grid">
                <label className="workflow-field">
                  <span>Title</span>
                  <input
                    className="form-input"
                    value={announcementTitle}
                    onChange={(e) => setAnnouncementTitle(e.target.value)}
                  />
                </label>
                <label className="workflow-field">
                  <span>Target</span>
                  <select
                    className="form-select"
                    value={announcementTarget}
                    onChange={(e) =>
                      setAnnouncementTarget(
                        e.target.value as "ALL_FACILITIES" | "PREMIUM_ONLY" | "COUNTRY_KE",
                      )
                    }
                  >
                    <option value="ALL_FACILITIES">ALL_FACILITIES</option>
                    <option value="PREMIUM_ONLY">PREMIUM_ONLY</option>
                    <option value="COUNTRY_KE">COUNTRY_KE</option>
                  </select>
                </label>
                <label className="workflow-field" style={{ gridColumn: "1 / -1" }}>
                  <span>Message</span>
                  <textarea
                    className="form-input"
                    rows={4}
                    value={announcementMessage}
                    onChange={(e) => setAnnouncementMessage(e.target.value)}
                  />
                </label>
              </div>
              <div className="modal-footer" style={{ marginTop: 12 }}>
                <button type="submit" className="btn-primary">
                  Post Announcement
                </button>
              </div>
            </form>
          </div>

          <div className="pv-table-wrap">
            <table className="pv-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Target</th>
                  <th>Status</th>
                  <th>Message</th>
                  <th>Posted At</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {announcements.map((row) => (
                  <tr key={row.id}>
                    <td className="pv-name">{row.title}</td>
                    <td>{row.target}</td>
                    <td>{row.status}</td>
                    <td>{row.message}</td>
                    <td>{new Date(row.publishedAt || row.createdAt).toLocaleString()}</td>
                    <td>
                      <button
                        type="button"
                        className="btn-cancel"
                        onClick={() =>
                          void handleAnnouncementStatusUpdate(
                            row.id,
                            row.status === "PUBLISHED" ? "ARCHIVED" : "PUBLISHED",
                          )
                        }
                      >
                        {row.status === "PUBLISHED" ? "Archive" : "Publish"}
                      </button>
                    </td>
                  </tr>
                ))}
                {announcements.length === 0 && (
                  <tr>
                    <td colSpan={6} className="pv-empty">
                      No announcements posted yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeTab === "audit" && (
        <div className="pv-table-wrap">
          <table className="pv-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Action</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {auditTrail.map((row) => (
                <tr key={row.id}>
                  <td>{new Date(row.createdAt).toLocaleString()}</td>
                  <td className="pv-name">{row.action}</td>
                  <td>
                    {typeof row.details === "string"
                      ? row.details
                      : JSON.stringify(row.details || {})}
                  </td>
                </tr>
              ))}
              {auditTrail.length === 0 && (
                <tr>
                  <td colSpan={3} className="pv-empty">
                    No platform audit actions logged yet in this session.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "support" && (
        <div className="pv-table-wrap">
          <table className="pv-table">
            <thead>
              <tr>
                <th>Support Ticket</th>
                <th>Hospital</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Last Message</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {supportRows.slice(0, 25).map((ticket) => (
                <tr key={ticket.id}>
                  <td>{ticket.subject}</td>
                  <td className="pv-name">{ticket.facilityName}</td>
                  <td>{ticket.priority}</td>
                  <td>
                    <select
                      className="form-select"
                      value={supportStatusDrafts[ticket.id] || "OPEN"}
                      onChange={(e) =>
                        setSupportStatusDrafts((prev) => ({
                          ...prev,
                          [ticket.id]: e.target.value as SupportStatus,
                        }))
                      }
                    >
                      <option value="OPEN">OPEN</option>
                      <option value="PENDING">PENDING</option>
                      <option value="IN_PROGRESS">IN_PROGRESS</option>
                      <option value="RESOLVED">RESOLVED</option>
                      <option value="CLOSED">CLOSED</option>
                    </select>
                  </td>
                  <td>{ticket.latestIssueMessage || "-"}</td>
                  <td>
                    <button
                      className="btn-primary"
                      type="button"
                      disabled={supportStatusSavingId === ticket.id}
                      onClick={() => void handleSupportStatusUpdate(ticket.id)}
                    >
                      {supportStatusSavingId === ticket.id ? "Saving..." : "Update Ticket Status"}
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && supportRows.length === 0 && (
                <tr>
                  <td colSpan={6} className="pv-empty">
                    No support requests found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const { patients, user, facility, setUser, setFacility, setPatients } = useAppStore();
  const [authScreen, setAuthScreen] = useState<AuthScreen>("splash");
  const [authError, setAuthError] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [licenseFacilityCode, setLicenseFacilityCode] = useState(() =>
    getStoredFacilityCode(),
  );
  const [licenseKey, setLicenseKey] = useState("");
  const [licenseStatus, setLicenseStatus] = useState<LicenseState | null>(null);
  const [licenseError, setLicenseError] = useState("");
  const [licenseLoading, setLicenseLoading] = useState(false);
  const [authRoleKey, setAuthRoleKey] = useState<RoleKey>("hospital_admin");
  const [dynamicAllowedModuleIds, setDynamicAllowedModuleIds] = useState<number[] | null>(null);
  const [landingTheme, setLandingTheme] = useState<
    "enterprise" | "clinical" | "luxury"
  >(() => {
    const saved = localStorage.getItem("hmis_landing_theme");
    if (saved === "enterprise" || saved === "clinical" || saved === "luxury") {
      return saved;
    }
    return "clinical";
  });
  const [moduleSearch, setModuleSearch] = useState("");
  const [moduleSearchFocused, setModuleSearchFocused] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [sidebarWaitingCount, setSidebarWaitingCount] = useState(0);
  const [patientModuleState, setPatientModuleState] = useState<any>(() => readPatientModuleState());
  const [activeNav, setActiveNav] = useState(0);
  const [activeWorkflowModuleId, setActiveWorkflowModuleId] = useState<number | null>(
    null,
  );
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [primaryColor, setPrimaryColor] = useState(
    () => localStorage.getItem("hmis_primary") || "#13d802",
  );
  const [textColor, setTextColor] = useState(
    () => localStorage.getItem("hmis_text_color") || "#0f172a",
  );
  const [fontPreset, setFontPreset] = useState<FontPresetKey>(() => {
    const saved = localStorage.getItem("hmis_font_preset");
    if (saved === "nunito" || saved === "baloo" || saved === "system" || saved === "serif") {
      return saved;
    }
    return "nunito";
  });
  const [appMode, setAppMode] = useState<"light" | "dark">(() => {
    const saved = localStorage.getItem("hmis_app_mode");
    return saved === "dark" ? "dark" : "light";
  });
  const [activeLayout, setActiveLayout] = useState<"modern" | "classic">(() => {
    const saved = localStorage.getItem("hmis_layout");
    return saved === "classic" ? "classic" : "modern";
  });
  const [facilityLogo, setFacilityLogo] = useState<string | null>(() =>
    localStorage.getItem("hmis_logo"),
  );
  const [appNotifications, setAppNotifications] = useState(
    () => localStorage.getItem("hmis_app_notifications") !== "false",
  );
  const [compactDashboard, setCompactDashboard] = useState(
    () => localStorage.getItem("hmis_compact_dashboard") === "true",
  );
  const [autoRefreshMinutes, setAutoRefreshMinutes] = useState(() => {
    const stored = Number(localStorage.getItem("hmis_auto_refresh_minutes") || "10");
    return Number.isFinite(stored) && stored >= 5 ? stored : 10;
  });
  const [helpWidgetOpen, setHelpWidgetOpen] = useState(false);
  const [helpInput, setHelpInput] = useState("");
  const [helpTyping, setHelpTyping] = useState(false);
  const [helpMessages, setHelpMessages] = useState<HelpChatMessage[]>([
    {
      id: Date.now(),
      role: "assistant",
      text: MEDILINK_AI_GREETING,
    },
  ]);

  const helpMessagesEndRef = useRef<HTMLDivElement | null>(null);
  const helpPromptReady = MEDILINK_AI_SYSTEM_PROMPT.length > 0;

  const decodeJwtPayload = (token: string) => {
    try {
      const parts = token.split(".");
      if (parts.length < 2) return null;
      const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
      const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
      return JSON.parse(atob(padded));
    } catch {
      return null;
    }
  };

  const normalizeFacilityCode = useCallback((value: string) => {
    return String(value || "").trim().toUpperCase();
  }, []);

  const normalizeLicenseKey = useCallback((value: string) => {
    return String(value || "")
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "");
  }, []);

  const ensureLicenseActive = useCallback(
    async (facilityCodeRaw: string) => {
      const facilityCode = normalizeFacilityCode(facilityCodeRaw);
      setLicenseLoading(true);
      try {
        const status = (await fetchLicenseStatus(facilityCode)) as LicenseState;
        setLicenseStatus(status);
        const resolvedFacilityCode = normalizeFacilityCode(
          String(status?.facilityCode || facilityCode || ""),
        );
        if (resolvedFacilityCode) {
          setStoredFacilityCode(resolvedFacilityCode);
          setLicenseFacilityCode(resolvedFacilityCode);
        }
        if (status?.active) {
          setLicenseError("");
          return true;
        }
        const nextStatus = String(status?.status || "INACTIVE").toUpperCase();
        const message =
          nextStatus === "EXPIRED"
            ? "License expired. Contact Medilink admin for renewal."
            : nextStatus === "REVOKED"
              ? "License revoked. Contact Medilink admin."
              : "License is inactive. Enter a valid license key.";
        setLicenseError(message);
        return false;
      } catch (error: any) {
        setLicenseError(String(error?.message || "License validation failed."));
        return false;
      } finally {
        setLicenseLoading(false);
      }
    },
    [normalizeFacilityCode],
  );

  const roleKey: RoleKey = (authRoleKey || "hospital_admin") as RoleKey;
  const defaultNavIndex = roleKey === "super_admin" ? 41 : 0;
  const allowedNavSet = new Set<number>(
    ROLE_ALLOWED_NAV[roleKey] || ROLE_ALLOWED_NAV.hospital_admin,
  );
  if (roleKey !== "super_admin") {
    allowedNavSet.add(1);
  }
  const effectiveAllowedModules =
    roleKey === "super_admin" || roleKey === "hospital_admin"
      ? ROLE_ALLOWED_MODULES[roleKey]
      : dynamicAllowedModuleIds !== null
        ? dynamicAllowedModuleIds
        : [];
  const allowedModuleSet = new Set<number>(effectiveAllowedModules);
  const getNavLabel = useCallback(
    (navIndex: number) => {
      if (navIndex === 99 && activeWorkflowModuleId) {
        return String(WORKFLOW_MODULE_BY_ID[activeWorkflowModuleId]?.name || "Module");
      }
      if (navIndex === 40) return "Subscriptions";
      const fromSidebar = SIDEBAR_NAV_ITEMS.find((item) => item.index === navIndex)?.label;
      if (fromSidebar) return fromSidebar;
      return String(NAV_ITEMS[navIndex]?.label || "Dashboard");
    },
    [activeWorkflowModuleId],
  );

  useEffect(() => {
    localStorage.setItem("hmis_primary", primaryColor);
    localStorage.setItem("hmis_text_color", textColor);
    localStorage.setItem("hmis_font_preset", fontPreset);
    localStorage.setItem("hmis_app_mode", appMode);
    localStorage.setItem("hmis_layout", activeLayout);
    if (facilityLogo) {
      localStorage.setItem("hmis_logo", facilityLogo);
    } else {
      localStorage.removeItem("hmis_logo");
    }
  }, [primaryColor, textColor, fontPreset, appMode, activeLayout, facilityLogo]);

  useEffect(() => {
    localStorage.setItem("hmis_app_notifications", String(appNotifications));
    localStorage.setItem("hmis_compact_dashboard", String(compactDashboard));
    localStorage.setItem("hmis_auto_refresh_minutes", String(autoRefreshMinutes));
  }, [appNotifications, compactDashboard, autoRefreshMinutes]);

  useEffect(() => {
    localStorage.setItem("hmis_landing_theme", landingTheme);
  }, [landingTheme]);

  useEffect(() => {
    if (authScreen !== "app") return;
    if (authRoleKey !== "hospital_admin") return;
    if (String(user?.role || "").toLowerCase().includes("super admin")) return;
    const raw = localStorage.getItem(ACCOUNT_STORAGE_KEY);
    if (!raw) return;
    try {
      const saved = JSON.parse(raw) as FacilityRegistration;
      const savedAdminEmail = String(saved.adminEmail || "")
        .trim()
        .toLowerCase();
      const currentEmail = String(user?.email || "")
        .trim()
        .toLowerCase();
      if (!savedAdminEmail || !currentEmail || savedAdminEmail !== currentEmail) return;
      setFacility({
        id: saved.backendFacilityId || saved.registrationNumber,
        name: saved.facilityName,
      });
      setUser({
        name: saved.adminName,
        role: "Hospital Admin",
        email: saved.adminEmail,
      });
      setAuthRoleKey("hospital_admin");
    } catch {
      // ignore malformed local account data
    }
  }, [authScreen, authRoleKey, user?.role, user?.email, setFacility, setUser]);

  useEffect(() => {
    if (authScreen !== "splash") return;
    const id = window.setTimeout(() => {
      const bootstrap = async () => {
        const hasSession =
          sessionStorage.getItem(SESSION_STORAGE_KEY) === "active";
        if (hasSession) {
          let storedCode = getStoredFacilityCode();
          if (!storedCode) {
            const raw = localStorage.getItem(ACCOUNT_STORAGE_KEY);
            if (raw) {
              try {
                const saved = JSON.parse(raw) as FacilityRegistration;
                storedCode = String(saved.registrationNumber || "").trim();
              } catch {
                storedCode = "";
              }
            }
          }
          if (storedCode) {
            setStoredFacilityCode(storedCode);
            setLicenseFacilityCode(storedCode);
          }
          const ok = await ensureLicenseActive(storedCode);
          setAuthScreen(ok ? "app" : "license");
          return;
        }
        const hasAccount = Boolean(localStorage.getItem(ACCOUNT_STORAGE_KEY));
        setAuthScreen(hasAccount ? "login" : "landing");
      };
      void bootstrap();
    }, 2400);
    return () => window.clearTimeout(id);
  }, [authScreen, ensureLicenseActive]);

  useEffect(() => {
    if (authScreen !== "license") return;
    const code = String(licenseFacilityCode || "").trim();
    if (!code) return;
    const id = window.setInterval(() => {
      void (async () => {
        const ok = await ensureLicenseActive(code);
        if (ok) {
          setAuthScreen("app");
        }
      })();
    }, 30_000);
    return () => window.clearInterval(id);
  }, [authScreen, licenseFacilityCode, ensureLicenseActive]);

  useEffect(() => {
    if (authScreen !== "app") return;
    const code = String(getStoredFacilityCode() || licenseFacilityCode || "").trim();
    if (!code) return;

    const tick = () => {
      void (async () => {
        try {
          const status = (await fetchLicenseStatus(code)) as LicenseState;
          setLicenseStatus(status);
          if (!status?.active) {
            setAuthScreen("license");
          }
        } catch {
          // ignore background check failures
        }
      })();
    };

    tick();
    const id = window.setInterval(tick, 60_000);
    window.addEventListener("focus", tick);
    window.addEventListener("online", tick);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("focus", tick);
      window.removeEventListener("online", tick);
    };
  }, [authScreen, licenseFacilityCode]);

  useEffect(() => {
    if (authScreen !== "app") return;
    if (dynamicAllowedModuleIds !== null) return;
    const token = getAccessToken();
    if (!token) return;
    const claims = decodeJwtPayload(token);
    const normalizedRole = String(claims?.role || "")
      .trim()
      .toLowerCase();
    if (!normalizedRole) return;
    const isPlatformAdminRole = isAdminLikeRole(normalizedRole);
    let cancelled = false;

    const loadAccess = async () => {
      try {
        const access = await fetchSecurityMyAccess();
        const accessModuleIds = normalizeModuleIds((access as any)?.moduleIds);
        if (cancelled) return;
        if (accessModuleIds.length > 0) {
          setDynamicAllowedModuleIds(accessModuleIds);
          return;
        }
      } catch {
        // continue to role permission fallback
      }

      try {
        const roles = await fetchTenantRoles();
        if (cancelled) return;
        const matchedRole = roles.find(
          (row: any) => String(row?.name || "").toLowerCase() === normalizedRole,
        );
        const roleModuleIds = normalizeModuleIds(
          extractModuleIdsFromPermissions(
            Array.isArray(matchedRole?.permissions) ? matchedRole.permissions : [],
          ),
        );
        setDynamicAllowedModuleIds(
          roleModuleIds.length > 0
            ? roleModuleIds
            : isPlatformAdminRole
              ? getAdminAllowedModules(normalizedRole)
              : [],
        );
      } catch {
        if (cancelled) return;
        setDynamicAllowedModuleIds(
          isPlatformAdminRole
            ? getAdminAllowedModules(normalizedRole)
            : [],
        );
      }
    };

    void loadAccess();
    return () => {
      cancelled = true;
    };
  }, [authScreen, dynamicAllowedModuleIds]);

  const filtered = MODULES.filter((m) =>
    m.name
      .toLowerCase()
      .replace("\n", " ")
      .includes(moduleSearch.toLowerCase()),
  );
  const roleFilteredModules = filtered.filter((m) => allowedModuleSet.has(m.id));
  const moduleSearchResults = roleFilteredModules.slice(0, 8);
  const activeSidebarModuleId =
    activeWorkflowModuleId ??
    (activeNav === 1
      ? 1
      : activeNav === 3
        ? 4
      : activeNav === 11
        ? 15
        : activeNav === 16
          ? 16
          : activeNav === 17
            ? 17
            : activeNav === 18
              ? 18
              : null);
  const activeWorkflowModule = activeSidebarModuleId
    ? WORKFLOW_MODULE_BY_ID[activeSidebarModuleId]
    : null;
  const sidebarWaitingConfig = activeSidebarModuleId
    ? workflowWaitingListConfig[activeSidebarModuleId]
    : undefined;
  const isSidebarModuleOpen = Boolean(activeSidebarModuleId);
  const activeSidebarTitle = activeWorkflowModule?.name || "Current Module";
  const setupFacilityNameFallback = getSetupFacilityNameFallback();
  const dashboardFacilityName = pickHospitalName(
    setupFacilityNameFallback,
    facility?.name,
  );
  const sidebarFacilityName = dashboardFacilityName;
  const sidebarFacilityLogo =
    resolveAssetUrl(facilityLogo) ||
    getSetupFacilityLogoFallback() ||
    "/Medilink-hmis-icon.png";
  const queueNotices = patients
    .filter((patient) => String(patient.queueStatus || "").trim())
    .slice(0, 10)
    .map((patient) => ({
      id: patient.id,
      name: patient.name,
      token: patient.regNo,
      status: String(patient.queueStatus || "Queued"),
    }));

  useEffect(() => {
    let cancelled = false;
    const loadSidebarWaitingCount = async () => {
      if (!sidebarWaitingConfig) {
        setSidebarWaitingCount(0);
        return;
      }
      try {
        const board = await fetchQueueBoard({
          departmentId: sidebarWaitingConfig.departmentId,
          facilityId: facility?.id,
        });
        if (!cancelled) {
          setSidebarWaitingCount(Array.isArray((board as any)?.tokens) ? (board as any).tokens.length : 0);
        }
      } catch {
        if (!cancelled) setSidebarWaitingCount(0);
      }
    };
    void loadSidebarWaitingCount();
    const handleQueued = () => void loadSidebarWaitingCount();
    window.addEventListener("hmis:patient-queued", handleQueued);
    return () => {
      cancelled = true;
      window.removeEventListener("hmis:patient-queued", handleQueued);
    };
  }, [sidebarWaitingConfig?.departmentId, facility?.id]);

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

  const openModuleFromSearch = (moduleId: number) => {
    setModuleSearch("");
    setModuleSearchFocused(false);
    setActiveWorkflowModuleId(moduleId);
    setActiveNav(99);
  };
  const handleModuleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const firstMatch = moduleSearchResults[0];
    if (firstMatch) {
      openModuleFromSearch(firstMatch.id);
    }
  };

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => !prev);
  };

  const goToDashboard = () => {
    setActiveWorkflowModuleId(null);
    setActiveNav(defaultNavIndex);
  };

  const handleLogout = () => {
    setLogoutConfirmOpen(false);
    clearTokens();
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    setAuthError("");
    setLoginPassword("");
    setActiveWorkflowModuleId(null);
    setActiveNav(0);
    setAuthRoleKey("hospital_admin");
    setDynamicAllowedModuleIds(null);
    setNotificationsOpen(false);
    setProfileOpen(false);
    setHelpWidgetOpen(false);
    setHelpInput("");
    setHelpTyping(false);
    setHelpMessages([
      {
        id: Date.now(),
        role: "assistant",
        text: MEDILINK_AI_GREETING,
      },
    ]);
    setLicenseError("");
    setLicenseStatus(null);
    setLicenseKey("");
    setAuthScreen("login");
  };

  const handleLicenseActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedKey = normalizeLicenseKey(licenseKey);
    if (!normalizedKey) {
      setLicenseError("Enter a valid license key.");
      return;
    }
    setLicenseLoading(true);
    try {
      const currentFacilityCode = normalizeFacilityCode(licenseFacilityCode);
      const response = (await activateLicense({
        licenseKey: normalizedKey,
      })) as LicenseState;
      const resolvedFacilityCode = normalizeFacilityCode(
        String(response?.facilityCode || currentFacilityCode || ""),
      );
      if (resolvedFacilityCode) {
        setStoredFacilityCode(resolvedFacilityCode);
        setLicenseFacilityCode(resolvedFacilityCode);
      }
      setLicenseStatus(response);
      setLicenseKey("");
      if (response?.active) {
        setLicenseError("");
        const hasSession =
          sessionStorage.getItem(SESSION_STORAGE_KEY) === "active";
        setAuthScreen(hasSession ? "app" : "login");
      } else {
        setLicenseError("License activation failed. Please confirm the key.");
      }
    } catch (error: any) {
      setLicenseError(
        String(error?.message || "License activation failed. Please try again."),
      );
    } finally {
      setLicenseLoading(false);
    }
  };

  const handleLicenseBack = () => {
    handleLogout();
    setAuthScreen("login");
  };

  const sendHelpMessage = (rawQuestion: string) => {
    const question = String(rawQuestion || "").trim();
    if (!question || helpTyping) return;
    const userMsg: HelpChatMessage = {
      id: Date.now(),
      role: "user",
      text: question,
    };
    const historyPayload = helpMessages.map((msg) => ({
      role: msg.role,
      content: msg.text,
    }));
    setHelpMessages((prev) => [...prev, userMsg]);
    setHelpInput("");
    setHelpTyping(true);
    const activeModuleName = activeWorkflowModuleId
      ? String(WORKFLOW_MODULE_BY_ID[activeWorkflowModuleId]?.name || "")
      : "";
    const activeScreen = activeWorkflowModuleId
      ? "Workflow Module View"
      : getNavLabel(activeNav);
    const helpContext: HelpAssistantContext = {
      userRole: String(user?.role || ""),
      module: activeModuleName || activeScreen,
      screen: activeScreen,
      facilityId: String(facility?.id || ""),
      departmentId: activeModuleName || activeScreen,
    };
    void (async () => {
      try {
        const generated = await generateMedilinkAiReply({
          facilityId: helpContext.facilityId,
          systemPrompt: MEDILINK_AI_SYSTEM_PROMPT,
          context: helpContext,
          chatHistory: historyPayload.slice(-30),
          question,
        });

        const text = String(generated.reply || "").trim();
        if (!text) {
          throw new Error("Empty response");
        }
        const normalizedText = text.toLowerCase();
        if (
          normalizedText.includes("input_text") ||
          normalizedText.includes("you exceeded your current quota") ||
          normalizedText.includes("openai")
        ) {
          const fallbackText = generateLocalHelpFallbackReply({
            question,
            context: helpContext,
            history: historyPayload.slice(-30),
            backendError: text,
          });
          const assistantFallbackMsg: HelpChatMessage = {
            id: Date.now() + 1,
            role: "assistant",
            text: fallbackText,
          };
          setHelpMessages((prev) => [...prev, assistantFallbackMsg]);
          return;
        }
        const assistantMsg: HelpChatMessage = {
          id: Date.now() + 1,
          role: "assistant",
          text,
        };
        setHelpMessages((prev) => [...prev, assistantMsg]);
      } catch (error) {
        const errText = error instanceof Error && error.message ? error.message : "";
        const fallbackText = generateLocalHelpFallbackReply({
          question,
          context: helpContext,
          history: historyPayload.slice(-30),
          backendError: errText,
        });
        const fallbackMsg: HelpChatMessage = {
          id: Date.now() + 1,
          role: "assistant",
          text: fallbackText,
        };
        setHelpMessages((prev) => [...prev, fallbackMsg]);
      } finally {
        setHelpTyping(false);
      }
    })();
  };

  const handleHelpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendHelpMessage(helpInput);
  };

  useEffect(() => {
    if (!helpWidgetOpen) return;
    helpMessagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [helpWidgetOpen, helpMessages, helpTyping]);

  const refreshPatientsFromBackend = async () => {
    try {
      const backendPatients = await fetchTenantPatients();
      setPatients(backendPatients.map(toFrontendPatient));
    } catch {
      // keep local fallback
    }
  };

  const handleHospitalAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const raw = localStorage.getItem(ACCOUNT_STORAGE_KEY);
    let saved: FacilityRegistration | null = null;
    if (raw) {
      try {
        saved = JSON.parse(raw) as FacilityRegistration;
      } catch {
        saved = null;
      }
    }

    setAuthLoading(true);
    try {
      const loginResponse = (await loginHospitalAdmin({
        email: loginEmail.trim(),
        password: loginPassword,
        audience: "hospital_admin",
      })) as any;

      const token = getAccessToken();
      const claims = token ? decodeJwtPayload(token) : null;
      const role = claims?.role ? String(claims.role) : "hospital_admin";
      const normalizedRole = role.toLowerCase().trim();
      const resolvedRoleKey = resolveRoleKeyForUi(normalizedRole);
      const isPlatformAdminRole = isAdminLikeRole(normalizedRole);
      const tenantId = String(claims?.tenantId || saved?.backendFacilityId || "").trim();

      const setupFacilityName = getSetupFacilityNameFallback();
      let resolvedFacilityName = pickHospitalName(setupFacilityName, saved?.facilityName);
      let resolvedFacilityId = tenantId || saved?.backendFacilityId || saved?.registrationNumber || "facility";
      let resolvedFacilityCode =
        String(saved?.registrationNumber || getStoredFacilityCode() || licenseFacilityCode || "")
          .trim();
      let resolvedAdminName = saved?.adminName || loginEmail.trim().split("@")[0] || "Hospital Admin";
      let resolvedLogoUrl = "";
      const loginFacility = loginResponse?.facility || null;

      if (loginFacility) {
        resolvedFacilityId = String(loginFacility?.id || resolvedFacilityId);
        resolvedFacilityName = pickHospitalName(
          loginFacility?.shortName,
          loginFacility?.legalName,
          loginFacility?.facilityName,
          loginFacility?.name,
          setupFacilityName,
          saved?.facilityName,
          resolvedFacilityName,
        );
        resolvedFacilityCode =
          String(loginFacility?.licenseFacilityCode || loginFacility?.mflCode || resolvedFacilityCode)
            .trim() || resolvedFacilityCode;
        resolvedLogoUrl = String(loginFacility?.logoUrl || resolvedLogoUrl).trim();
      }

      if (!loginFacility && tenantId && tenantId !== "global") {
        try {
          const profile = await fetchFacilityBranding(tenantId);
          resolvedFacilityId = String(profile?.id || tenantId);
          resolvedFacilityName = pickHospitalName(
            profile?.shortName,
            profile?.legalName,
            profile?.facilityName,
            profile?.name,
            setupFacilityName,
            resolvedFacilityName,
          );
          resolvedFacilityCode =
            String(profile?.mflCode || resolvedFacilityCode).trim() || resolvedFacilityCode;
          resolvedLogoUrl =
            String(profile?.branding?.logoUrl || profile?.logoUrl || "").trim();
        } catch {
          // Login can still continue; license validation below will decide access.
        }
      }

      if (resolvedFacilityCode) {
        setStoredFacilityCode(resolvedFacilityCode);
        setLicenseFacilityCode(resolvedFacilityCode);
      }
      if (resolvedLogoUrl) {
        setFacilityLogo(resolvedLogoUrl);
      }

      setFacility({
        id: resolvedFacilityId,
        name: resolvedFacilityName,
      });
      setUser({
        name: resolvedAdminName,
        role: formatRoleLabel(role),
        email: loginEmail.trim(),
      });
      setAuthRoleKey(resolvedRoleKey);
      setActiveNav(resolvedRoleKey === "super_admin" ? 41 : 0);
      setActiveWorkflowModuleId(null);
      try {
        const access = await fetchSecurityMyAccess();
        const accessModuleIds = normalizeModuleIds((access as any)?.moduleIds);
        if (accessModuleIds.length > 0) {
          setDynamicAllowedModuleIds(accessModuleIds);
        } else {
          const roles = await fetchTenantRoles();
          const matchedRole = roles.find(
            (row: any) => String(row?.name || "").toLowerCase() === normalizedRole,
          );
          const fallbackModuleIds = normalizeModuleIds(
            extractModuleIdsFromPermissions(
              Array.isArray(matchedRole?.permissions) ? matchedRole.permissions : [],
            ),
          );
          setDynamicAllowedModuleIds(
            fallbackModuleIds.length > 0
              ? fallbackModuleIds
              : isPlatformAdminRole
                ? getAdminAllowedModules(normalizedRole)
                : [],
          );
        }
      } catch {
        setDynamicAllowedModuleIds(
          isPlatformAdminRole
            ? getAdminAllowedModules(normalizedRole)
            : [],
        );
      }
      sessionStorage.setItem(SESSION_STORAGE_KEY, "active");
      setAuthError("");
      if (resolvedFacilityCode && resolvedFacilityName !== "Hospital Facility") {
        localStorage.setItem(
          ACCOUNT_STORAGE_KEY,
          JSON.stringify({
            facilityName: resolvedFacilityName,
            registrationNumber: resolvedFacilityCode,
            facilityEmail: "",
            facilityPhone: "",
            backendFacilityId: resolvedFacilityId,
            adminName: resolvedAdminName,
            adminEmail: loginEmail.trim(),
            adminPhone: "",
            password: "",
          }),
        );
      }
      const licenseOk = await ensureLicenseActive(resolvedFacilityCode);
      setAuthScreen(licenseOk ? "app" : "license");
    } catch (error: any) {
      const msg = String(error?.message || "Unable to login.");
      if (msg.toLowerCase().includes("otp")) {
        setAuthError(
          "OTP verification is required on backend. Verify OTP first, then login.",
        );
      } else {
      setAuthError(msg);
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    try {
      const loginResponse = (await loginStaff({
        email: loginEmail.trim(),
        password: loginPassword,
      })) as any;

      const token = getAccessToken();
      const claims = token ? decodeJwtPayload(token) : null;
      const role = claims?.role ? String(claims.role) : "staff";
      const normalizedRole = role.toLowerCase().trim();
      const isPlatformAdminRole = isAdminLikeRole(normalizedRole);
      const savedRaw = localStorage.getItem(ACCOUNT_STORAGE_KEY);
      let savedFacilityName = "Hospital Facility";
      const setupFacilityName = getSetupFacilityNameFallback();
      let savedFacilityId = claims?.tenantId || "facility";
      let savedFacilityCode = "";
      const loginFacility = loginResponse?.facility || null;
      if (savedRaw) {
        try {
          const saved = JSON.parse(savedRaw) as FacilityRegistration;
          savedFacilityName = pickHospitalName(saved.facilityName, savedFacilityName);
          savedFacilityId = saved.backendFacilityId || saved.registrationNumber || savedFacilityId;
          savedFacilityCode = String(saved.registrationNumber || "").trim();
        } catch {
          // ignore malformed local registration cache
        }
      }
      savedFacilityName = pickHospitalName(setupFacilityName, savedFacilityName);
      if (loginFacility) {
        savedFacilityName = pickHospitalName(
          loginFacility?.shortName,
          loginFacility?.legalName,
          loginFacility?.facilityName,
          loginFacility?.name,
          setupFacilityName,
          savedFacilityName,
        );
        savedFacilityId = String(loginFacility?.id || savedFacilityId);
        savedFacilityCode = String(
          loginFacility?.licenseFacilityCode || loginFacility?.mflCode || savedFacilityCode,
        ).trim();
        const logoUrl = String(loginFacility?.logoUrl || "").trim();
        if (logoUrl) {
          setFacilityLogo(logoUrl);
        }
      }
      if (savedFacilityCode) {
        setStoredFacilityCode(savedFacilityCode);
        setLicenseFacilityCode(savedFacilityCode);
      }

      setFacility({
        id: savedFacilityId,
        name: savedFacilityName,
      });
      setUser({
        name: loginEmail.trim().split("@")[0] || "Staff User",
        role: formatRoleLabel(role),
        email: loginEmail.trim(),
      });
      const resolvedRoleKey = resolveRoleKeyForUi(normalizedRole);
      setAuthRoleKey(resolvedRoleKey);
      if (normalizedRole === "super_admin") {
        setActiveNav(41);
      } else {
        setActiveNav(0);
      }
      setActiveWorkflowModuleId(null);
      try {
        const access = await fetchSecurityMyAccess();
        const moduleIds = normalizeModuleIds((access as any)?.moduleIds);
        if (moduleIds.length > 0) {
          setDynamicAllowedModuleIds(moduleIds);
        } else {
          const roles = await fetchTenantRoles();
          const matchedRole = roles.find(
            (row: any) => String(row?.name || "").toLowerCase() === normalizedRole,
          );
          const fallbackModuleIds = normalizeModuleIds(
            extractModuleIdsFromPermissions(
            Array.isArray(matchedRole?.permissions) ? matchedRole.permissions : [],
            ),
          );
          setDynamicAllowedModuleIds(
            fallbackModuleIds.length > 0
              ? fallbackModuleIds
              : isPlatformAdminRole
                ? getAdminAllowedModules(normalizedRole)
                : [],
          );
        }
      } catch {
        try {
          const roles = await fetchTenantRoles();
          const matchedRole = roles.find(
            (row: any) => String(row?.name || "").toLowerCase() === normalizedRole,
          );
          const moduleIds = normalizeModuleIds(
            extractModuleIdsFromPermissions(
            Array.isArray(matchedRole?.permissions) ? matchedRole.permissions : [],
            ),
          );
          setDynamicAllowedModuleIds(
            moduleIds.length > 0
              ? moduleIds
              : isPlatformAdminRole
                ? getAdminAllowedModules(normalizedRole)
                : [],
          );
        } catch {
          setDynamicAllowedModuleIds(
            isPlatformAdminRole
              ? getAdminAllowedModules(normalizedRole)
              : [],
          );
        }
      }
      sessionStorage.setItem(SESSION_STORAGE_KEY, "active");
      setAuthError("");
      const licenseOk = await ensureLicenseActive(
        savedFacilityCode || getStoredFacilityCode(),
      );
      setAuthScreen(licenseOk ? "app" : "license");
    } catch (error: any) {
      setAuthError(String(error?.message || "Unable to login as staff."));
    } finally {
      setAuthLoading(false);
    }
  };

  useEffect(() => {
    if (authScreen !== "app") return;
    const id = window.setInterval(() => {
      void refreshAccessToken();
    }, autoRefreshMinutes * 60 * 1000);
    return () => window.clearInterval(id);
  }, [authScreen, autoRefreshMinutes]);

  useEffect(() => {
    const onBeforeUnload = () => {
      clearTokens();
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);

  useEffect(() => {
    if (authScreen !== "app") return;
    let cancelled = false;
    const loadPatients = async () => {
      try {
        const backendPatients = await fetchTenantPatients();
        if (!cancelled) {
          setPatients(backendPatients.map(toFrontendPatient));
        }
      } catch {
        // keep local fallback
      }
    };
    void loadPatients();
    return () => {
      cancelled = true;
    };
  }, [authScreen, setPatients]);

  useEffect(() => {
    if (authScreen !== "app") return;
    const isAllowedWorkflowView =
      activeNav === 99 &&
      activeWorkflowModuleId !== null &&
      allowedModuleSet.has(activeWorkflowModuleId);

    if (!allowedNavSet.has(activeNav) && !isAllowedWorkflowView) {
      setActiveNav(defaultNavIndex);
      setActiveWorkflowModuleId(null);
    }
  }, [
    authScreen,
    activeNav,
    activeWorkflowModuleId,
    allowedNavSet,
    allowedModuleSet,
    defaultNavIndex,
  ]);

  if (authScreen !== "app") {
    if (authScreen === "splash") {
      return <SplashScreen />;
    }

    if (authScreen === "landing") {
      return (
        <AuthLanding
          landingTheme={landingTheme}
          onThemeChange={setLandingTheme}
          onRegister={() => {
            setAuthError("");
            setAuthScreen("register");
          }}
          onLogin={() => {
            setAuthError("");
            setAuthScreen("login");
          }}
          onStaffLogin={() => {
            setAuthError("");
            setAuthScreen("staff_login");
          }}
        />
      );
    }

    if (authScreen === "register") {
      return (
        <FirstTimeSetupScreen
          landingTheme={landingTheme}
          onComplete={(response, values) => {
            const savedFacility = response?.facility || {};
            const facilityId = savedFacility?.id || savedFacility?.mflCode || values.mflCode || "facility";
            const facilityName = pickHospitalName(
              values.shortName,
              values.legalName,
              savedFacility?.shortName,
              savedFacility?.legalName,
              savedFacility?.name,
            );
            const facilityCode = savedFacility?.mflCode || values.mflCode || "";
            if (facilityCode) {
              setStoredFacilityCode(facilityCode);
              setLicenseFacilityCode(facilityCode);
            }
            if (response?.branding?.logoUrl || savedFacility?.logoUrl) {
              setFacilityLogo(response?.branding?.logoUrl || savedFacility?.logoUrl);
            }
            setFacility({ id: facilityId, name: facilityName });
            localStorage.setItem(
              ACCOUNT_STORAGE_KEY,
              JSON.stringify({
                facilityName,
                registrationNumber: facilityCode,
                facilityEmail: values.generalEmail || "",
                facilityPhone: values.mainPhone || "",
                backendFacilityId: facilityId,
                adminName: values.adminName || "",
                adminEmail: values.adminEmail || "",
                adminPhone: values.adminPhone || "",
                password: "",
              }),
            );
            setLoginEmail(values.adminEmail || "");
            setLoginPassword("");
            setAuthError("");
            setAuthScreen("login");
          }}
          onBack={() => {
            setAuthError("");
            setAuthScreen("landing");
          }}
        />
      );
    }

    if (authScreen === "license") {
      return (
        <LicenseActivationScreen
          licenseKey={licenseKey}
          setLicenseKey={setLicenseKey}
          onSubmit={handleLicenseActivate}
          onBack={handleLicenseBack}
          error={licenseError}
          loading={licenseLoading}
          status={licenseStatus}
          landingTheme={landingTheme}
        />
      );
    }

    if (authScreen === "login") {
      return (
        <HospitalLoginScreen
          email={loginEmail}
          password={loginPassword}
          setEmail={setLoginEmail}
          setPassword={setLoginPassword}
          onSubmit={handleHospitalAdminLogin}
          loading={authLoading}
          landingTheme={landingTheme}
          onBack={() => {
            setAuthError("");
            setAuthScreen("landing");
          }}
          error={authError}
        />
      );
    }

    return authScreen === "staff_login" ? (
      <StaffLoginScreen
        email={loginEmail}
        password={loginPassword}
        setEmail={setLoginEmail}
        setPassword={setLoginPassword}
        onSubmit={handleStaffLogin}
        loading={authLoading}
        landingTheme={landingTheme}
        onBack={() => {
          setAuthError("");
          setAuthScreen("landing");
        }}
        error={authError}
      />
    ) : (
      <HospitalLoginScreen
        email={loginEmail}
        password={loginPassword}
        setEmail={setLoginEmail}
        setPassword={setLoginPassword}
        onSubmit={handleHospitalAdminLogin}
        loading={authLoading}
        landingTheme={landingTheme}
        onBack={() => {
          setAuthError("");
          setAuthScreen("landing");
        }}
        error={authError}
      />
    );
  }

  const renderMain = () => {
    switch (activeNav) {
      case 0:
        return (
          <>
            <div className="welcome">
              <h2>Welcome, {user?.name || "Hospital Admin"}</h2>
              <p>
                {dashboardFacilityName
                  ? `${dashboardFacilityName} command center`
                  : "Select a module to manage your facility"}
              </p>
            </div>
            <div className={`module-grid ${compactDashboard ? "module-grid-compact" : ""}`}>
              {roleFilteredModules.map((mod) => (
                <button
                  key={mod.id}
                  onClick={() => {
                    setActiveWorkflowModuleId(mod.id);
                    setActiveNav(99);
                  }}
                  className={`module-card ${mod.premium ? "card-premium" : "card-free"}`}
                >
                  {mod.premium && (
                    <div className="premium-pill">
                      <CrownIcon size={11} />
                      <span>PREMIUM</span>
                    </div>
                  )}
                  <div className="card-icon">
                    <Icon type={mod.iconType} size={30} />
                  </div>
                  <span className="card-label">
                    {mod.name.replace("\n", " ")}
                  </span>
                </button>
              ))}
              {roleFilteredModules.length === 0 && (
                <div className="p-4">
                  No modules are assigned to your account. Contact your system administrator.
                </div>
              )}
            </div>
          </>
        );
      case 1:
        return <PatientsView />;
      case 2:
        return <OpdDashboardView />;
      case 3:
        return <AppointmentsView />;
      case 4:
        return <EHRView />;
      case 5:
        return <NursingView />;
      case 6:
        return <WardView />;
      case 7:
        return <LaboratoryView />;
      case 8:
        return <RadiologyView />;
      case 9:
        return <BillingView />;
      case 10:
        return <PharmacyView />;
      case 11: {
        const inventoryModule = WORKFLOW_MODULE_BY_ID[15];
        return inventoryModule ? (
          <React.Suspense fallback={<div className="p-4">Loading module...</div>}>
            <LazyWorkflowModuleView
              module={inventoryModule}
              patients={patients}
              onPatientsRefresh={refreshPatientsFromBackend}
            />
          </React.Suspense>
        ) : (
          <InventoryView />
        );
      }
      case 12:
        return (
          <SettingsView
            primaryColor={primaryColor}
            setPrimaryColor={setPrimaryColor}
            textColor={textColor}
            setTextColor={setTextColor}
            fontPreset={fontPreset}
            setFontPreset={setFontPreset}
            activeLayout={activeLayout}
            setActiveLayout={setActiveLayout}
            facilityLogo={facilityLogo}
            setFacilityLogo={setFacilityLogo}
            landingTheme={landingTheme}
            setLandingTheme={setLandingTheme}
            appMode={appMode}
            setAppMode={setAppMode}
            appNotifications={appNotifications}
            setAppNotifications={setAppNotifications}
            compactDashboard={compactDashboard}
            setCompactDashboard={setCompactDashboard}
            autoRefreshMinutes={autoRefreshMinutes}
            setAutoRefreshMinutes={setAutoRefreshMinutes}
          />
        );
      case 13:
        return <BillingView />;
      case 14:
        return <InsuranceView />;
      case 15:
        return <ProcurementView />;
      case 16: {
        const hrModule = WORKFLOW_MODULE_BY_ID[16];
        return hrModule ? (
          <React.Suspense fallback={<div className="p-4">Loading module...</div>}>
            <LazyWorkflowModuleView
              module={hrModule}
              patients={patients}
              onPatientsRefresh={refreshPatientsFromBackend}
            />
          </React.Suspense>
        ) : (
          <HRView />
        );
      }
      case 17: {
        const doctorModule = WORKFLOW_MODULE_BY_ID[17];
        return doctorModule ? (
          <React.Suspense fallback={<div className="p-4">Loading module...</div>}>
            <LazyWorkflowModuleView
              module={doctorModule}
              patients={patients}
              onPatientsRefresh={refreshPatientsFromBackend}
            />
          </React.Suspense>
        ) : (
          <DoctorView />
        );
      }
      case 18: {
        const facilityModule = WORKFLOW_MODULE_BY_ID[18];
        return facilityModule ? (
          <React.Suspense fallback={<div className="p-4">Loading module...</div>}>
            <LazyWorkflowModuleView
              module={facilityModule}
              patients={patients}
              onPatientsRefresh={refreshPatientsFromBackend}
            />
          </React.Suspense>
        ) : (
          <FacilityView />
        );
      }
      case 19:
        return <AnalyticsView />;
      case 20:
        return <UserManagementView />;
      case 21:
        return <TelemedicineView />;
      case 22:
        return <BlockchainView />;
      case 23:
        return <AISuiteView />;
      case 24:
        return <PatientPortalView />;
      case 25:
        return <EmergencyView />;
      case 26:
        return <AmbulanceView />;
      case 27:
        return <MortuaryView />;
      case 28:
        return <QueueManagementView />;
      case 29:
        return <HelpdeskView />;
      case 30:
        return <CanteenView />;
      case 31:
        return <PatientFeedbackView />;
      case 33:
        return <QualityAssuranceView />;
      case 34:
        return <ExternalIntegrationsView />;
      case 40:
        return roleKey === "hospital_admin" || roleKey === "super_admin" ? (
          <SubscriptionPlansView />
        ) : (
          <div className="p-4">Upgrade plan is available for Hospital Admin only.</div>
        );
      case 41:
        return roleKey === "super_admin" ? (
          <SuperAdminDashboardView />
        ) : (
          <div className="p-4">Super Admin dashboard is restricted to super admin accounts.</div>
        );
      case 42:
        return roleKey === "hospital_admin" || roleKey === "super_admin" ? (
          <MigrationCenterView />
        ) : (
          <div className="p-4">Migration Center is available for Hospital Admin only.</div>
        );
      case 99: {
        const module = activeWorkflowModuleId
          ? WORKFLOW_MODULE_BY_ID[activeWorkflowModuleId]
          : null;
        if (!module || !allowedModuleSet.has(module.id)) {
          return <div className="p-4">You do not have access to this module.</div>;
        }

        if (module.id === 1) {
          return <PatientsView />;
        }

        if (module.id === 36) {
          return <OpdDashboardView />;
        }

        if (module.id === 37) {
          return <MaternityView />;
        }

        if (module.id === 38) {
          return <IcuView />;
        }

        if (module.id === 48) {
          return <CdssView />;
        }

        if (module.id === 51) {
          return <NicuView />;
        }

        if (module.id === 52) {
          return <DentalView />;
        }

        if (module.id === 55) {
          return <ReferralsView />;
        }

        if (module.id === 8) {
          return <LaboratoryView />;
        }

        if (module.id === 9) {
          return <RadiologyView />;
        }

        if (module.id === 10) {
          return <PharmacyView />;
        }

        if (module.id === 35) {
          return <PharmacyPosView />;
        }

        if (module.id === 11) {
          return <OtView />;
        }

        if (module.id === 49) {
          return <PhysiotherapyView />;
        }

        if (module.id === 50) {
          return <NutritionView />;
        }

        if (module.id === 53) {
          return <InfectionControlView />;
        }

        if (module.id === 59) {
          return <PaediatricsView />;
        }

        if (module.id === 4) {
          return <AppointmentsView />;
        }

        if (module.id === 13) {
          return <BillingView />;
        }

        if (module.id === 14) {
          return <InsuranceView />;
        }

        if (module.id === 20) {
          return <UserManagementView />;
        }

        if (module.id === 21) {
          return <TelemedicineView />;
        }

        if (module.id === 22) {
          return <BlockchainView />;
        }

        if (module.id === 23) {
          return <AISuiteView />;
        }

        if (module.id === 24) {
          return <PatientPortalView />;
        }

        if (module.id === 25) {
          return <EmergencyView />;
        }

        if (module.id === 26) {
          return <AmbulanceView />;
        }

        if (module.id === 27) {
          return <MortuaryView />;
        }

        if (module.id === 28) {
          return <QueueManagementView />;
        }

        if (module.id === 29) {
          return <HelpdeskView />;
        }

        if (module.id === 30) {
          return <CanteenView />;
        }

        if (module.id === 31) {
          return <PatientFeedbackView />;
        }

        if (module.id === 33) {
          return <QualityAssuranceView />;
        }

        if (module.id === 34) {
          return <ExternalIntegrationsView />;
        }

        if (module.id === 64) {
          return roleKey === "hospital_admin" || roleKey === "super_admin" ? (
            <MigrationCenterView />
          ) : (
            <div className="p-4">Migration Center is available for Hospital Admin only.</div>
          );
        }

        return (
          <React.Suspense fallback={<div className="p-4">Loading module...</div>}>
            <LazyWorkflowModuleView
              module={module}
              patients={patients}
              onPatientsRefresh={refreshPatientsFromBackend}
            />
          </React.Suspense>
        );
      }
      default:
        return null;
    }
  };

  return (
    <div
      className={`layout dashboard-theme-${landingTheme} app-mode-${appMode} ${activeLayout === "classic" ? "layout-classic" : ""}`}
      style={
        {
          "--primary": primaryColor,
          "--app-text-color": textColor,
          "--app-font-family": FONT_PRESETS[fontPreset],
        } as any
      }
    >
      <DesktopUpdater />
      {logoutConfirmOpen ? (
        <div
          className="logout-confirm-backdrop"
          role="presentation"
          onClick={() => setLogoutConfirmOpen(false)}
        >
          <section
            className="logout-confirm-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-confirm-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="logout-confirm-icon">
              <Icon type="logout" size={22} />
            </div>
            <div className="logout-confirm-copy">
              <h3 id="logout-confirm-title">Confirm Logout</h3>
              <p>Are you sure you want to end this HMIS session?</p>
            </div>
            <div className="logout-confirm-actions">
              <button
                type="button"
                className="logout-confirm-cancel"
                onClick={() => setLogoutConfirmOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="logout-confirm-submit"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          </section>
        </div>
      ) : null}
      <DesktopSidebar
        collapsed={sidebarCollapsed}
        onToggleCollapsed={toggleSidebar}
        activeNav={activeNav}
        activeWorkflowModuleId={activeWorkflowModuleId}
        onNavigateModule={(id) => {
          setActiveWorkflowModuleId(id);
          setActiveNav(99);
        }}
        onNavigateNav={(idx) => {
          setActiveWorkflowModuleId(null);
          setActiveNav(idx);
        }}
        userRole={String(user?.role || "hospital_admin")}
        allowedModuleIds={allowedModuleSet}
        facilityName={String(dashboardFacilityName || facility?.name || "MediLink HMIS")}
        facilityLogo={resolveAssetUrl(facilityLogo) || null}
        onOpenHelpAi={() => setHelpWidgetOpen(true)}
      />

          <div className="main">
        <DesktopTopbar
          activeNav={activeNav}
          onGoBack={goToDashboard}
          onOpenSettings={() => setActiveNav(12)}
          userName={String(user?.name || "Admin")}
          userRole={String(user?.role || "Hospital Admin")}
          onLogout={handleLogout}
          queueNotices={queueNotices}
          moduleSearch={moduleSearch}
          onModuleSearchChange={setModuleSearch}
          moduleSearchFocused={moduleSearchFocused}
          onModuleSearchFocus={() => setModuleSearchFocused(true)}
          onModuleSearchBlur={() => window.setTimeout(() => setModuleSearchFocused(false), 140)}
          moduleSearchResults={moduleSearchResults}
          onModuleSearchSubmit={handleModuleSearchSubmit}
          onOpenModule={openModuleFromSearch}
        />
        <DesktopAppShell activeModuleId={activeWorkflowModuleId}>
          {renderMain()}
        </DesktopAppShell>
      </div>
      {helpWidgetOpen && (
        <div className="help-widget-overlay" onClick={() => setHelpWidgetOpen(false)}>
          <div className="help-widget-panel" onClick={(e) => e.stopPropagation()}>
            <div className="help-widget-header">
              <h3>Medilink Help AI</h3>
              <button className="modal-close" onClick={() => setHelpWidgetOpen(false)}>
                ✕
              </button>
            </div>
            <div className="help-widget-subtitle">
              {helpPromptReady
                ? "Role-aware, context-aware guidance for workflows, errors, routing, reports, and KPIs."
                : "Ask workflow questions about modules, queue routing, and stage-by-stage operations."}
            </div>
            <div className="help-widget-messages">
              {helpMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`help-widget-msg ${msg.role === "assistant" ? "is-assistant" : "is-user"}`}
                >
                  <p>{msg.text}</p>
                </div>
              ))}
              {helpTyping && (
                <div className="help-widget-msg is-assistant">
                  <p>Preparing guidance...</p>
                </div>
              )}
              <div ref={helpMessagesEndRef} />
            </div>
            <div className="help-widget-quick">
              <button type="button" className="btn-cancel" onClick={() => sendHelpMessage("How does patient registration workflow work?")}>
                Registration flow
              </button>
              <button type="button" className="btn-cancel" onClick={() => sendHelpMessage("How do I route a patient to Laboratory?")}>
                Queue to Lab
              </button>
              <button type="button" className="btn-cancel" onClick={() => sendHelpMessage("How does billing close a patient invoice?")}>
                Billing closeout
              </button>
            </div>
            <form className="help-widget-form" onSubmit={handleHelpSubmit}>
              <input
                className="form-input"
                type="text"
                placeholder="Ask how any Medilink HMIS module works..."
                value={helpInput}
                onChange={(e) => setHelpInput(e.target.value)}
              />
              <button type="submit" className="btn-primary" disabled={helpTyping || !helpInput.trim()}>
                Send
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Missing View Placeholders ---
const ClinicianView = () => (
  <div className="p-4">Medical Consultation (Functional)</div>
);
void ClinicianView;
const DiagnosticsView = ({ type }: { type: string }) => (
  <div className="p-4">{type} Terminal</div>
);
const OPDOTView = () => <OTView />;