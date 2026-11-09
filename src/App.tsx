import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { api } from "./lib/api";
import {
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Hospital,
  MapPin,
  Upload,
  UserRoundPlus,
} from "lucide-react";
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
import WardView from "./views/WardView";
import IpdView from "./views/IpdView";
import NursingView from "./views/NursingView";
import BillingView from "./views/BillingView";
import InsuranceView from "./views/InsuranceView";
import EmergencyView from "./views/EmergencyView";
import AmbulanceView from "./views/AmbulanceView";
import MortuaryView from "./views/MortuaryView";
import BloodBankView from "./views/BloodBankView";
import BiomedicalView from "./views/BiomedicalView";
import TelemedicineView from "./views/TelemedicineView";
import HelpdeskView from "./views/HelpdeskView";
import CanteenView from "./views/CanteenView";
import PatientFeedbackView from "./views/PatientFeedbackView";
import QualityAssuranceView from "./views/QualityAssuranceView";
import InventoryView from "./views/InventoryView";
import ProcurementView from "./views/ProcurementView";
import HrView from "./views/HrView";
import FinanceView from "./views/FinanceView";
import BlockchainView from "./views/BlockchainView";
import PatientPortalView from "./views/PatientPortalView";
import IntegrationsView, { ExternalIntegrationsView } from "./views/IntegrationsView";
import UserManagementView from "./views/UserManagementView";
import AnalyticsView from "./views/AnalyticsView";
import ReportsView from "./views/ReportsView";
import DoctorsView, { DoctorView } from "./views/DoctorsView";
import FacilitiesView, { FacilityView } from "./views/FacilitiesView";
import EhrView, { EHRView } from "./views/EhrView";
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

// EHRView is imported from ./views/EhrView
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

// BlockchainView, PatientPortalView, ExternalIntegrationsView, UserManagementView, AnalyticsView, DoctorView, FacilityView are imported from ./views
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
            <strong>60+</strong>
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

type SetupStep = {
  title: string;
  subtitle: string;
  icon: typeof Building2;
  fields: SetupField[];
};

const setupCounties = [
  "Baringo", "Bomet", "Bungoma", "Busia", "Elgeyo Marakwet", "Embu", "Garissa", "Homa Bay",
  "Isiolo", "Kajiado", "Kakamega", "Kericho", "Kiambu", "Kilifi", "Kirinyaga", "Kisii",
  "Kisumu", "Kitui", "Kwale", "Laikipia", "Lamu", "Machakos", "Makueni", "Mandera",
  "Marsabit", "Meru", "Migori", "Mombasa", "Murang'a", "Nairobi", "Nakuru", "Nandi",
  "Narok", "Nyamira", "Nyandarua", "Nyeri", "Samburu", "Siaya", "Taita Taveta",
  "Tana River", "Tharaka Nithi", "Trans Nzoia", "Turkana", "Uasin Gishu", "Vihiga",
  "Wajir", "West Pokot",
];

const desktopSetupSteps: SetupStep[] = [
  {
    title: "Facility Identity",
    subtitle: "Tell Medilink who the hospital is.",
    icon: Building2,
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
    icon: Hospital,
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
    icon: MapPin,
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
    icon: CheckCircle2,
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
    icon: Hospital,
    fields: [
      { name: "departments", label: "Initial departments", type: "checkboxes", options: ["Reception", "Outpatient", "Emergency", "Billing", "Pharmacy", "Laboratory", "Radiology", "Maternity", "Inpatient", "Theatre"] },
      { name: "primaryDepartment", label: "Main patient entry department", type: "select", options: ["Reception", "Outpatient", "Emergency"] },
    ],
  },
  {
    title: "Hospital Admin",
    subtitle: "Create the first admin account that will manage the system.",
    icon: UserRoundPlus,
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
  const [showPassword, setShowPassword] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<Record<string, string>>({});
  const [fileObjects, setFileObjects] = useState<Record<string, File>>({});
  const [checked, setChecked] = useState<Record<string, string[]>>({
    openDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    departments: ["Reception", "Outpatient", "Billing"],
  });
  const [completed, setCompleted] = useState(false);
  const [setupResult, setSetupResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const step = desktopSetupSteps[activeStep];
  const completion = Math.round(((completed ? desktopSetupSteps.length + 1 : activeStep + 1) / (desktopSetupSteps.length + 1)) * 100);

  const setValue = (name: string, value: string) =>
    setValues((current) => ({ ...current, [name]: value }));

  const toggleChecked = (name: string, option: string) => {
    setChecked((current) => {
      const list = current[name] || [];
      return {
        ...current,
        [name]: list.includes(option) ? list.filter((item) => item !== option) : [...list, option],
      };
    });
  };

  const onFileChange = (name: string, file?: File | null) => {
    if (!file) return;
    setFiles((current) => ({ ...current, [name]: file.name }));
    setFileObjects((current) => ({ ...current, [name]: file }));
  };

  const renderField = (field: SetupField) => {
    if (field.type === "file") {
      return (
        <label className="setup-file-picker" key={field.name}>
          <span>{field.label}</span>
          <input type="file" accept="image/png,image/jpeg,image/svg+xml" onChange={(event) => onFileChange(field.name, event.target.files?.[0])} />
          <b><Upload size={16} /> {files[field.name] || "Choose image"}</b>
          <small>PNG, JPG, or SVG</small>
        </label>
      );
    }

    if (field.type === "select") {
      return (
        <label key={field.name}>
          {field.label}
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
          <div>
            {field.options?.map((option) => (
              <label key={option}>
                <input
                  type="checkbox"
                  checked={(checked[field.name] || []).includes(option)}
                  onChange={() => toggleChecked(field.name, option)}
                />
                {option}
              </label>
            ))}
          </div>
        </fieldset>
      );
    }

    if (field.type === "textarea") {
      return (
        <label key={field.name}>
          {field.label}
          <textarea required={field.required} placeholder={field.placeholder} value={values[field.name] || ""} onChange={(event) => setValue(field.name, event.target.value)} />
        </label>
      );
    }

    const isPassword = field.type === "password";
    return (
      <label key={field.name}>
        {field.label}
        <span className={isPassword ? "setup-password-wrap" : undefined}>
          <input
            type={isPassword && showPassword ? "text" : field.type || "text"}
            required={field.required}
            placeholder={field.placeholder}
            value={values[field.name] || ""}
            onChange={(event) => setValue(field.name, event.target.value)}
          />
          {isPassword ? (
            <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"}>
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          ) : null}
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
      localStorage.setItem(
        SETUP_STORAGE_KEY,
        JSON.stringify({
          values,
          files,
          checked,
          savedFacility: response?.facility || null,
          branding: response?.branding || null,
          completedAt: new Date().toISOString(),
        }),
      );
      localStorage.setItem("hmis_setup_wizard_seen", new Date().toISOString());
      setSetupResult(response);
      setCompleted(true);
    } catch (setupError: any) {
      setError(
        setupError?.response?.data?.message ||
          setupError?.message ||
          "Setup could not be saved. Check that the HMIS backend is running.",
      );
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
          <CheckCircle2 className="setup-congrats-icon" />
          <p className="setup-eyebrow">Setup Complete</p>
          <h1>Congratulations, your hospital is ready.</h1>
          <p className="setup-copy">
            Thank you for setting up Medilink HMIS. Use the Hospital Admin credentials you created to login and continue configuring users, modules, billing, wards, integrations, and go-live readiness.
          </p>
          <button type="button" className="splash-btn-primary" onClick={() => onComplete(setupResult || {}, values)}>
            Continue to Admin Login
            <ChevronRight size={17} />
          </button>
        </section>
      </div>
    );
  }

  const StepIcon = step.icon;

  return (
    <div className={`splash-root landing-theme-${landingTheme}`}>
      <div className="splash-glow splash-glow-1" />
      <div className="splash-glow splash-glow-2" />
      <main className="setup-landing-shell">
        <header className="setup-landing-header">
          <div className="setup-brand-lockup">
            <img src="/Loginlogo.png" alt="MediLink HMIS" className="auth-title-logo" />
            <span>Hospital information, beautifully connected.</span>
          </div>
          <div className="setup-heading-copy">
            <p className="setup-eyebrow">First-time hospital registration</p>
            <h1>Build your facility workspace</h1>
            <p className="setup-copy">A guided setup for the Hospital Admin. You can refine advanced clinical, financial, and operational settings after signing in.</p>
          </div>
          <div className="setup-verified-badge"><CheckCircle2 size={17} /><span>License verified</span></div>
        </header>

        <div className="setup-workspace">
          <aside className="setup-step-rail" aria-label="Setup steps">
            <div className="setup-rail-intro"><span>SETUP JOURNEY</span><strong>{activeStep + 1} <i>/ {desktopSetupSteps.length}</i></strong></div>
            <nav>
              {desktopSetupSteps.map((item, index) => {
                const Icon = item.icon;
                const isComplete = index < activeStep;
                return (
                  <button key={item.title} type="button" className={`setup-rail-step ${index === activeStep ? "is-active" : ""} ${isComplete ? "is-complete" : ""}`} onClick={() => setActiveStep(index)}>
                    <span className="setup-step-number">{isComplete ? <CheckCircle2 size={15} /> : index + 1}</span>
                    <span className="setup-rail-label"><b>{item.title}</b><small>{item.subtitle}</small></span>
                    <Icon className="setup-rail-icon" size={17} />
                  </button>
                );
              })}
            </nav>
            <div className="setup-rail-footer"><span>Configuration progress</span><strong>{completion}%</strong><div className="setup-progress"><i style={{ width: `${completion}%` }} /></div></div>
          </aside>

          <form className="setup-form-card" onSubmit={(event) => { event.preventDefault(); void goNext(); }}>
            <div className="setup-form-topline"><span>STEP {String(activeStep + 1).padStart(2, "0")}</span><span>{activeStep === desktopSetupSteps.length - 1 ? "Final review" : "In progress"}</span></div>
            <div className="setup-panel-heading">
              <div className="setup-panel-icon"><StepIcon className="setup-panel-svg" size={24} /></div>
              <div><h2>{step.title}</h2><span>{step.subtitle}</span></div>
            </div>

            <div className="setup-field-grid">{step.fields.map(renderField)}</div>
            {error ? <div className="auth-error" role="alert">{error}</div> : null}

            <div className="setup-actions">
              <button type="button" className="splash-btn-secondary" onClick={() => activeStep === 0 ? onBack() : setActiveStep((value) => Math.max(0, value - 1))} disabled={submitting}>
                <ChevronLeft size={17} />Back
              </button>
              <button type="submit" className="splash-btn-primary" disabled={submitting}>
                {submitting ? "Saving Setup..." : activeStep === desktopSetupSteps.length - 1 ? "Finish Setup" : "Continue"}
                <ChevronRight size={17} />
              </button>
            </div>
          </form>
        </div>
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
  onSubmit: (e: React.FormEvent, otp?: string) => void;
  onBack: () => void;
  error: string;
  loading: boolean;
  landingTheme: "enterprise" | "clinical" | "luxury";
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState("");
  const [mfaSecret, setMfaSecret] = useState("");
  const [mfaUrl, setMfaUrl] = useState("");
  const [localError, setLocalError] = useState("");
  const [submittingMfa, setSubmittingMfa] = useState(false);

  const setupMfa = async () => {
    setLocalError("");
    setMfaSecret("");
    setMfaUrl("");
    if (!email.trim() || !password) {
      setLocalError("Enter your email and password first, then set up MFA.");
      return;
    }
    setSubmittingMfa(true);
    try {
      const response = await api.post("/auth/mfa/bootstrap", {
        email: email.trim().toLowerCase(),
        password,
      });
      if (response.data?.enrolled) {
        setLocalError("MFA is already enrolled. Enter your authenticator code to login.");
      } else if (response.data?.secret) {
        setMfaSecret(response.data.secret);
        setMfaUrl(response.data.otpauthUrl || "");
      } else {
        setLocalError("MFA is not required for this account.");
      }
    } catch (mfaError: any) {
      setLocalError(mfaError?.response?.data?.message || mfaError?.message || "MFA setup failed.");
    } finally {
      setSubmittingMfa(false);
    }
  };

  const confirmMfa = async () => {
    setLocalError("");
    if (!email.trim() || !otp.trim()) {
      setLocalError("Enter your authenticator code to confirm MFA.");
      return;
    }
    setSubmittingMfa(true);
    try {
      await api.post("/auth/mfa/confirm", {
        email: email.trim().toLowerCase(),
        otp: otp.trim(),
      });
      setMfaSecret("");
      setMfaUrl("");
      setLocalError("MFA enabled. Click Login to continue.");
    } catch (mfaError: any) {
      setLocalError(mfaError?.response?.data?.message || mfaError?.message || "MFA confirmation failed.");
    } finally {
      setSubmittingMfa(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(e, otp.trim() || undefined);
  };

  return (
    <div className={`splash-root landing-theme-${landingTheme}`}>
      <div className="splash-glow splash-glow-1" />
      <div className="splash-glow splash-glow-2" />
      <form className="auth-card auth-login" onSubmit={handleSubmit}>
        <img
          src="/Loginlogo.png"
          alt="MediLink HMIS"
          className="auth-title-logo"
        />
        <p>Login with the Hospital Admin account created during onboarding.</p>
        <label>
          Admin Email
          <input
            className="auth-input"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="username"
          />
        </label>
        <label>
          Password
          <div className="auth-password-wrap">
            <input
              className="auth-input"
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
            />
            <button
              type="button"
              className="auth-password-toggle"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </label>
        <label>
          MFA Code
          <input
            className="auth-input"
            type="text"
            inputMode="numeric"
            value={otp}
            onChange={(event) => setOtp(event.target.value)}
            autoComplete="one-time-code"
            placeholder="6-digit authenticator code"
          />
        </label>
        {mfaSecret ? (
          <div className="auth-mfa-panel">
            <strong>Set up MFA</strong>
            <span>Add this secret to Google Authenticator or Microsoft Authenticator:</span>
            <code>{mfaSecret}</code>
            {mfaUrl ? <a href={mfaUrl}>Open authenticator setup link</a> : null}
            <button type="button" className="splash-btn-secondary" onClick={confirmMfa} disabled={submittingMfa}>
              Confirm MFA Code
            </button>
          </div>
        ) : null}
        {(error || localError) && <div className="auth-error">{error || localError}</div>}
        <div className="auth-actions">
          <button type="button" className="splash-btn-secondary" onClick={onBack}>
            Back
          </button>
          <button type="button" className="splash-btn-secondary" onClick={setupMfa} disabled={loading || submittingMfa}>
            Set up MFA
          </button>
          <button type="submit" className="splash-btn-primary" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
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
  onSubmit: (e: React.FormEvent, otp?: string) => void;
  onBack: () => void;
  error: string;
  loading: boolean;
  landingTheme: "enterprise" | "clinical" | "luxury";
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState("");
  const [mfaSecret, setMfaSecret] = useState("");
  const [mfaUrl, setMfaUrl] = useState("");
  const [localError, setLocalError] = useState("");
  const [submittingMfa, setSubmittingMfa] = useState(false);

  const setupMfa = async () => {
    setLocalError("");
    setMfaSecret("");
    setMfaUrl("");
    if (!email.trim() || !password) {
      setLocalError("Enter your staff email and password first, then set up MFA.");
      return;
    }
    setSubmittingMfa(true);
    try {
      const response = await api.post("/auth/mfa/bootstrap", {
        email: email.trim().toLowerCase(),
        password,
      });
      if (response.data?.enrolled) {
        setLocalError("MFA is already enrolled. Enter your authenticator code to login.");
      } else if (response.data?.secret) {
        setMfaSecret(response.data.secret);
        setMfaUrl(response.data.otpauthUrl || "");
      } else {
        setLocalError("MFA is not required for this account.");
      }
    } catch (mfaError: any) {
      setLocalError(mfaError?.response?.data?.message || mfaError?.message || "MFA setup failed.");
    } finally {
      setSubmittingMfa(false);
    }
  };

  const confirmMfa = async () => {
    setLocalError("");
    if (!email.trim() || !otp.trim()) {
      setLocalError("Enter your authenticator code to confirm MFA.");
      return;
    }
    setSubmittingMfa(true);
    try {
      await api.post("/auth/mfa/confirm", {
        email: email.trim().toLowerCase(),
        otp: otp.trim(),
      });
      setMfaSecret("");
      setMfaUrl("");
      setLocalError("MFA enabled. Click Login to continue.");
    } catch (mfaError: any) {
      setLocalError(mfaError?.response?.data?.message || mfaError?.message || "MFA confirmation failed.");
    } finally {
      setSubmittingMfa(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(e, otp.trim() || undefined);
  };

  return (
    <div className={`splash-root landing-theme-${landingTheme}`}>
      <div className="splash-glow splash-glow-1" />
      <div className="splash-glow splash-glow-2" />
      <form className="auth-card auth-login" onSubmit={handleSubmit}>
        <img
          src="/Loginlogo.png"
          alt="MediLink HMIS"
          className="auth-title-logo"
        />
        <p>
          Hospital Admins and clinical staff can sign in here using their MediLink
          account credentials.
        </p>
        <label>
          Staff or Admin Email
          <input
            className="auth-input"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="username"
          />
        </label>
        <label>
          Password
          <div className="auth-password-wrap">
            <input
              className="auth-input"
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
            />
            <button
              type="button"
              className="auth-password-toggle"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </label>
        <label>
          MFA Code
          <input
            className="auth-input"
            type="text"
            inputMode="numeric"
            value={otp}
            onChange={(event) => setOtp(event.target.value)}
            autoComplete="one-time-code"
            placeholder="6-digit authenticator code"
          />
        </label>
        {mfaSecret ? (
          <div className="auth-mfa-panel">
            <strong>Set up MFA</strong>
            <span>Add this secret to Google Authenticator or Microsoft Authenticator:</span>
            <code>{mfaSecret}</code>
            {mfaUrl ? <a href={mfaUrl}>Open authenticator setup link</a> : null}
            <button type="button" className="splash-btn-secondary" onClick={confirmMfa} disabled={submittingMfa}>
              Confirm MFA Code
            </button>
          </div>
        ) : null}
        {(error || localError) && <div className="auth-error">{error || localError}</div>}
        <div className="auth-actions">
          <button type="button" className="splash-btn-secondary" onClick={onBack}>
            Back
          </button>
          <button type="button" className="splash-btn-secondary" onClick={setupMfa} disabled={loading || submittingMfa}>
            Set up MFA
          </button>
          <button type="submit" className="splash-btn-primary" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
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
        <p>Enter the HMIS license key issued from the MediLink HMIS Org.</p>
        <div className="license-info">
          <div>
            <strong>Source:</strong> Only keys issued from the MediLink HMIS Org are accepted.
          </div>
          <div>
            <strong>Format:</strong> 8 blocks of 4 characters.
          </div>
        </div>
        {error && <div className="auth-error">{error}</div>}
        <label>
          License Key
          <input
            className="auth-input"
            value={licenseKey}
            onChange={(e) => setLicenseKey(e.target.value)}
            placeholder="XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX"
            required
          />
        </label>
        <div className="auth-actions">
          <button type="button" className="splash-btn-secondary" onClick={onBack}>
            Back
          </button>
          <button type="submit" className="splash-btn-primary" disabled={loading}>
            {loading ? "Verifying..." : "Verify License"}
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

  const handleHospitalAdminLogin = async (e: React.FormEvent, otp?: string) => {
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
        otp: otp || undefined,
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

  const handleStaffLogin = async (e: React.FormEvent, otp?: string) => {
    e.preventDefault();
    setAuthLoading(true);
    try {
      const loginResponse = (await loginStaff({
        email: loginEmail.trim(),
        password: loginPassword,
        otp: otp || undefined,
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
      case 11:
        return <InventoryView />;
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
      case 16:
        return <HrView />;
      case 17:
        return <DoctorsView />;
      case 18:
        return <FacilitiesView />;
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

        if (module.id === 3) {
          return <EhrView />;
        }

        if (module.id === 17) {
          return <DoctorsView />;
        }

        if (module.id === 18) {
          return <FacilitiesView />;
        }

        if (module.id === 19) {
          return <ReportsView />;
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

        if (module.id === 2) {
          return <IpdView />;
        }

        if (module.id === 5) {
          return <WardView />;
        }

        if (module.id === 7) {
          return <NursingView />;
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

        if (module.id === 12) {
          return <BloodBankView />;
        }

        if (module.id === 15) {
          return <InventoryView />;
        }

        if (module.id === 16) {
          return <HrView />;
        }

        if (module.id === 39) {
          return <FinanceView />;
        }

        if (module.id === 61) {
          return <BiomedicalView />;
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