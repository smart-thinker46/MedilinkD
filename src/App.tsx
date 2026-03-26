import React, { useState, useEffect, useRef, useCallback } from "react";
import "./App.css";
import { useAppStore, type Patient } from "./store/appStore";
import { DesktopUpdater } from "./components/DesktopUpdater";
import { MigrationCenterView } from "./components/MigrationCenterView";
import { WORKFLOW_MODULE_BY_ID, WORKFLOW_MODULES } from "./modules/workflowCatalog";
import {
  MEDILINK_AI_GREETING,
  MEDILINK_AI_SYSTEM_PROMPT,
} from "./ai/medilinkSystemPrompt";
import { generateLocalHelpFallbackReply } from "./ai/localHelpFallback";
import {
  clearTokens,
  createBed,
  createStaffProfile,
  createWard,
  createTenantPatient,
  createFacility,
  createTenantRole,
  createTenantUser,
  deleteTenantRole,
  deleteTenantUser,
  fetchSubscriptionPricing,
  fetchSecurityRbacCatalog,
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
  generateMedilinkAiReply,
  initiateMpesaStkPush,
  activateLicense,
  fetchLicenseStatus,
  fetchWards,
  fetchTenantPatients,
  fetchTenantRoles,
  fetchTenantUsers,
  getAccessToken,
  getStoredFacilityCode,
  loginHospitalAdmin,
  loginStaff,
  refreshAccessToken,
  registerHospitalAdmin,
  recordBillingPayment,
  resetTenantUserPassword,
  SESSION_STORAGE_KEY,
  setStoredFacilityCode,
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

const MARKETING_BASE_URL =
  (import.meta as any).env?.VITE_MARKETING_URL || "https://medilinkke.onrender.com";
const MARKETING_PRICING_URL = `${String(MARKETING_BASE_URL).replace(/\/$/, "")}/pricing`;

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
  if (key === "hospital_admin") return "hospital_admin";
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
    briefcase: "inventory_2",
    hr: "groups",
    doctor: "medical_services",
    blood: "bloodtype",
    ambulance: "emergency",
    support: "support_agent",
    stars: "stars",
    microscope: "biotech",
    users: "group",
    upload: "cloud_upload",
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
  const firstName = raw.firstName || "";
  const lastName = raw.lastName || "";
  const fullName = `${firstName} ${lastName}`.trim() || raw.name || "Unnamed Patient";
  const genderRaw = String(raw.gender || "").toUpperCase();
  const gender: Patient["gender"] = genderRaw === "FEMALE" ? "Female" : "Male";
  const latestVisitStatus = raw?.visits?.[0]?.status
    ? String(raw.visits[0].status)
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
    raw.queueStatus ||
      raw.status ||
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

  const visitDateValue = raw.visitDate || raw.createdAt || new Date().toISOString();
  const visitDate = String(visitDateValue).slice(0, 10);
  const dob = raw.dateOfBirth ? String(raw.dateOfBirth).slice(0, 10) : "";

  return {
    id: String(raw.id),
    regNo: raw.patientCode || raw.regNo || "",
    nationalId: raw.nationalId || "",
    name: fullName,
    phone: raw.phone || "",
    gender,
    age: raw.age || ageFromDob(dob),
    queueStatus,
    queueModuleId,
    visitDate,
    vitals: raw.vitals
      ? {
          bp: raw.vitals.bp || "",
          temp: raw.vitals.temp || "",
          weight: raw.vitals.weight || "",
          pulse: raw.vitals.pulse || "",
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
  const { patients, removePatient, setPatients } = useAppStore();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    gender: "Male" as "Male" | "Female",
    nationalId: "",
    phone: "",
    age: "",
    nextOfKin: "",
    nextOfKinPhone: "",
    address: "",
    allergies: "",
    bloodGroup: "" as any,
    dob: "",
  });

  const filtered = patients.filter((p) =>
    `${p.name} ${p.regNo} ${p.phone} ${p.nationalId}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const backendPatients = await fetchTenantPatients(search.trim() || undefined);
        if (!cancelled) {
          setPatients(backendPatients.map(toFrontendPatient));
        }
      } catch {
        // keep local data fallback
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [setPatients]);

  const handleResetForm = () => {
    setForm({
      firstName: "",
      lastName: "",
      gender: "Male" as "Male" | "Female",
      nationalId: "",
      phone: "",
      age: "",
      nextOfKin: "",
      nextOfKinPhone: "",
      address: "",
      allergies: "",
      bloodGroup: "" as any,
      dob: "",
    });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await createTenantPatient({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        gender:
          form.gender === "Female"
            ? "FEMALE"
            : form.gender === "Male"
              ? "MALE"
              : "OTHER",
        dateOfBirth: form.dob || dobFromAge(parseInt(form.age || "0", 10)),
        nationalId: form.nationalId.trim() || undefined,
        phone: form.phone.trim() || undefined,
        address: form.address.trim() || undefined,
        allergies: form.allergies.trim() || undefined,
        bloodGroup: form.bloodGroup || undefined,
        nextOfKinName: form.nextOfKin.trim() || undefined,
        nextOfKinPhone: form.nextOfKinPhone.trim() || undefined,
      });
      const latest = await fetchTenantPatients();
      setPatients(latest.map(toFrontendPatient));
      setFormOpen(false);
      handleResetForm();
    } catch (err: any) {
      setError(err?.message || "Failed to register patient.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="patients-view">
      <div className="pv-header">
        <div>
          <h2 className="pv-title">Patient Registry</h2>
          <p className="pv-subtitle">
            Register and manage all facility patients
          </p>
        </div>
        <button className="btn-primary" onClick={() => setFormOpen(true)}>
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

      <div className="pv-stats">
        {(
          [
            {
              label: "Total Patients",
              value: patients.length,
              color: "#3b82f6",
            },
            {
              label: "Male",
              value: patients.filter((p) => p.gender === "Male").length,
              color: "#0ea5e9",
            },
            {
              label: "Female",
              value: patients.filter((p) => p.gender === "Female").length,
              color: "#ec4899",
            },
          ] as const
        ).map((s) => (
          <div
            key={s.label}
            className="pv-stat-card"
            style={{ borderLeftColor: s.color }}
          >
            <p className="pv-stat-label">{s.label}</p>
            <p className="pv-stat-value" style={{ color: s.color }}>
              {s.value}
            </p>
          </div>
        ))}
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
          placeholder="Search by name, ID, phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="pv-table-wrap">
        <table className="pv-table">
          <thead>
            <tr>
              <th>Reg No</th>
              <th>Patient Name</th>
              <th>National ID</th>
              <th>Gender</th>
              <th>Age</th>
              <th>Phone</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id}>
                <td className="pv-code">{p.regNo}</td>
                <td className="pv-name">
                  <div className="pv-avatar">{p.name[0]}</div>
                  <span>{p.name}</span>
                </td>
                <td>{p.nationalId}</td>
                <td>
                  <span
                    className={`pv-badge ${p.gender === "Male" ? "badge-male" : "badge-female"}`}
                  >
                    {p.gender}
                  </span>
                </td>
                <td>{p.age}</td>
                <td>{p.phone || "—"}</td>
                <td>
                  <span className="pv-badge badge-male">{p.queueStatus}</span>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="pv-empty">
                  No patients found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {formOpen && (
        <div className="modal-overlay" onClick={() => setFormOpen(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Register New Patient</h3>
              <button
                className="modal-close"
                onClick={() => setFormOpen(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleRegister} className="modal-form">
              {error && <div className="auth-error">{error}</div>}
              <div className="form-row">
                <label>
                  First Name *
                  <input
                    required
                    className="form-input"
                    value={form.firstName}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, firstName: e.target.value }))
                    }
                    placeholder="John"
                  />
                </label>
                <label>
                  Last Name *
                  <input
                    required
                    className="form-input"
                    value={form.lastName}
                    onChange={(e) =>
                      setForm((f: any) => ({ ...f, lastName: e.target.value }))
                    }
                    placeholder="Doe"
                  />
                </label>
              </div>
              <div className="form-row">
                <label>
                  National ID *
                  <input
                    required
                    className="form-input"
                    value={form.nationalId}
                    onChange={(e) =>
                      setForm((f: any) => ({
                        ...f,
                        nationalId: e.target.value,
                      }))
                    }
                    placeholder="12345678"
                  />
                </label>
                <label>
                  Age *
                  <input
                    required
                    type="number"
                    className="form-input"
                    value={form.age}
                    onChange={(e) =>
                      setForm((f: any) => ({ ...f, age: e.target.value }))
                    }
                    placeholder="25"
                  />
                </label>
              </div>
              <div className="form-row">
                <label>
                  Date of Birth
                  <input
                    type="date"
                    className="form-input"
                    value={form.dob}
                    onChange={(e) => {
                      setForm((f) => ({ ...f, dob: e.target.value }));
                      e.currentTarget.blur();
                    }}
                  />
                </label>
                <label>
                  Gender *
                  <select
                    required
                    className="form-input"
                    value={form.gender}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, gender: e.target.value as any }))
                    }
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </label>
              </div>
              <div className="form-row">
                <label>
                  Phone
                  <input
                    type="tel"
                    className="form-input"
                    value={form.phone}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, phone: e.target.value }))
                    }
                    placeholder="+254..."
                  />
                </label>
                <label>
                  Blood Group
                  <select
                    className="form-input"
                    value={form.bloodGroup}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, bloodGroup: e.target.value }))
                    }
                  >
                    <option value="">Unknown</option>
                    {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(
                      (g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ),
                    )}
                  </select>
                </label>
              </div>
              <label>
                Address
                <input
                  className="form-input"
                  value={form.address}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, address: e.target.value }))
                  }
                  placeholder="Nairobi, Kenya"
                />
              </label>
              <label>
                Known Allergies
                <input
                  className="form-input"
                  value={form.allergies}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, allergies: e.target.value }))
                  }
                  placeholder="e.g. Penicillin"
                />
              </label>
              <div className="form-row">
                <label>
                  Next of Kin
                  <input
                    className="form-input"
                    value={form.nextOfKin}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, nextOfKin: e.target.value }))
                    }
                    placeholder="Full name"
                  />
                </label>
                <label>
                  NOK Phone
                  <input
                    type="tel"
                    className="form-input"
                    value={form.nextOfKinPhone}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, nextOfKinPhone: e.target.value }))
                    }
                    placeholder="+254..."
                  />
                </label>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setFormOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {saving ? "Registering..." : "Register & Queue (OPD)"}
                </button>
              </div>
            </form>
          </div>
        </div>
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
  const [appointments] = useState([
    {
      id: "1",
      patient: "Jane Doe",
      doctor: "Dr. House",
      time: "10:30 AM",
      status: "SCHEDULED",
    },
    {
      id: "2",
      patient: "Samuel Mwangi",
      doctor: "Dr. House",
      time: "11:45 AM",
      status: "IN_PROGRESS",
    },
    {
      id: "3",
      patient: "Amina Hassan",
      doctor: "Dr. Wilson",
      time: "02:15 PM",
      status: "SCHEDULED",
    },
  ]);
  const [search, setSearch] = useState("");

  const filtered = appointments.filter(
    (a) =>
      a.patient.toLowerCase().includes(search.toLowerCase()) ||
      a.doctor.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="appointments-view">
      <div className="pv-header">
        <div>
          <h2 className="pv-title">Appointments</h2>
          <p className="pv-subtitle">
            View and manage today's consultation schedule
          </p>
        </div>
        <button className="btn-primary">Schedule Visit</button>
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
          placeholder="Search appointments..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className="pv-table-wrap">
        <table className="pv-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Patient</th>
              <th>Doctor</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((a) => (
              <tr key={a.id}>
                <td className="pv-code">{a.time}</td>
                <td className="pv-name">{a.patient}</td>
                <td>{a.doctor}</td>
                <td>
                  <span
                    className={`pv-badge ${a.status === "SCHEDULED" ? "badge-male" : "badge-female"}`}
                  >
                    {a.status}
                  </span>
                </td>
                <td>
                  <button className="pv-del">View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
    { id: "1", patient: "Jane Doe", status: "STABLE", meds: "2 Pending" },
    { id: "2", patient: "Samuel Mwangi", status: "OBSERVATION", meds: "None" },
    { id: "3", patient: "Amina Hassan", status: "STABLE", meds: "1 Due" },
  ]);
  const [search] = useState("");

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
      <div className="pv-table-wrap">
        <table className="pv-table">
          <thead>
            <tr>
              <th>Patient</th>
              <th>Status</th>
              <th>Medication</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {activeVisits
              .filter((v) =>
                v.patient.toLowerCase().includes(search.toLowerCase()),
              )
              .map((v) => (
                <tr key={v.id}>
                  <td className="pv-name">{v.patient}</td>
                  <td>
                    <span className="pv-badge badge-male">{v.status}</span>
                  </td>
                  <td>{v.meds}</td>
                  <td>
                    <button className="pv-del">Log Care</button>
                  </td>
                </tr>
              ))}
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

function LaboratoryView() {
  const { patients, movePatient } = useAppStore();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<any>(null);

  const filtered = patients.filter(
    (p) =>
      p.queueStatus === "LAB" &&
      (p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.nationalId.includes(search) ||
        p.regNo.toLowerCase().includes(search.toLowerCase())),
  );

  return (
    <div className="patients-view">
      <div className="pv-header">
        <div>
          <h2 className="pv-title">Lab Services Terminal</h2>
          <p className="pv-subtitle">
            Process diagnostic tests and upload results
          </p>
        </div>
      </div>

      <div className="pv-search-wrap" style={{ marginBottom: 16 }}>
        <input
          className="pv-search"
          placeholder="Search Patient (ID / Reg No / Name / Phone)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: "100%", maxWidth: "none" }}
        />
      </div>

      <div className="pv-table-wrap">
        <table className="pv-table">
          <thead>
            <tr>
              <th>Reg No</th>
              <th>Patient</th>
              <th>Test Requested</th>
              <th>Ordered By</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="pv-empty">
                  No patients in Lab Queue. Try searching...
                </td>
              </tr>
            ) : (
              filtered.map((p) => (
                <tr key={p.id}>
                  <td className="pv-code">{p.regNo}</td>
                  <td className="pv-name">{p.name}</td>
                  <td>Malaria Parasites / FBC</td>
                  <td>Dr. Almalick</td>
                  <td>
                    <button
                      onClick={() => setSelected(p)}
                      className="btn-primary"
                    >
                      Record Results
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-header">
              <h3>Lab Results: {selected.name}</h3>
              <button className="modal-close" onClick={() => setSelected(null)}>
                ×
              </button>
            </div>
            <div className="modal-form">
              <label>
                Sample Type{" "}
                <input
                  className="form-input"
                  placeholder="Blood / Urine / Swab"
                />
              </label>
              <label>
                Test Findings{" "}
                <textarea
                  className="form-input"
                  style={{ height: 80 }}
                  placeholder="Describe findings..."
                />
              </label>
              <label>
                Result Value{" "}
                <input
                  className="form-input"
                  placeholder="Positive / Negative / 12.4"
                />
              </label>
              <button
                className="btn-primary"
                onClick={() => {
                  movePatient(selected.id, "PHARMACY");
                  setSelected(null);
                }}
              >
                Submit & Finalize
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PharmacyView() {
  const { patients, movePatient } = useAppStore();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<any>(null);

  const filtered = patients.filter(
    (p) =>
      p.queueStatus === "PHARMACY" &&
      (p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.regNo.toLowerCase().includes(search.toLowerCase())),
  );

  return (
    <div className="patients-view">
      <div className="pv-header">
        <div>
          <h2 className="pv-title">Pharmacy Dispensing</h2>
          <p className="pv-subtitle">
            Fulfill prescriptions and manage patient medication
          </p>
        </div>
      </div>

      <div className="pv-search-wrap" style={{ marginBottom: 16 }}>
        <input
          className="pv-search"
          placeholder="Search by ID / Name / Reg No"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: "100%", maxWidth: "none" }}
        />
      </div>

      <div className="pv-table-wrap">
        <table className="pv-table">
          <thead>
            <tr>
              <th>Patient</th>
              <th>Medication</th>
              <th>Instructions</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="pv-empty">
                  No pending prescriptions in Pharmacy.
                </td>
              </tr>
            ) : (
              filtered.map((p) => (
                <tr key={p.id}>
                  <td className="pv-name">{p.name}</td>
                  <td>Amoxicillin 500mg</td>
                  <td>1 x 3 days</td>
                  <td>
                    <button
                      onClick={() => setSelected(p)}
                      className="btn-primary"
                    >
                      Dispense
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-header">
              <h3>Dispense Medication: {selected.name}</h3>
              <button className="modal-close" onClick={() => setSelected(null)}>
                ×
              </button>
            </div>
            <div className="modal-form">
              <p style={{ fontSize: 13, color: "#64748b" }}>
                Stock Level: 450 units available
              </p>
              <label>
                Medication{" "}
                <input
                  className="form-input"
                  defaultValue="Amoxicillin 500mg"
                  disabled
                />
              </label>
              <label>
                Batch No <input className="form-input" placeholder="BN-9920" />
              </label>
              <button
                className="btn-primary"
                onClick={() => {
                  movePatient(selected.id, "COMPLETED");
                  setSelected(null);
                }}
              >
                Finalize Dispensing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

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

function TelemedicineView() {
  const [sessions] = useState([
    { id: "1", patient: "John Doe", time: "14:00", status: "READY" },
    { id: "2", patient: "Jane Smith", time: "16:30", status: "SCHEDULED" },
  ]);

  return (
    <div className="telemedicine-view">
      <div className="pv-header">
        <div>
          <h2 className="pv-title">Virtual Care Console</h2>
          <p className="pv-subtitle">
            Manage encrypted video consultations and virtual clinics
          </p>
        </div>
      </div>
      <div className="pv-table-wrap">
        <table className="pv-table">
          <thead>
            <tr>
              <th>Patient Identity</th>
              <th>Session Time</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((s) => (
              <tr key={s.id}>
                <td className="pv-name">{s.patient}</td>
                <td>{s.time}</td>
                <td>
                  <span
                    className={`pv-badge ${s.status === "READY" ? "badge-male" : "badge-female"}`}
                  >
                    {s.status}
                  </span>
                </td>
                <td>
                  <button className="pv-del">Join</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AISuiteView() {
  const [insights] = useState([
    {
      id: "1",
      type: "Patient Flow",
      prediction: "High (+12%)",
      confidence: "94%",
    },
    {
      id: "2",
      type: "Anomaly detection",
      prediction: "Stable",
      confidence: "99%",
    },
  ]);

  return (
    <div className="ai-suite-view">
      <div className="pv-header">
        <div>
          <h2 className="pv-title">Augmented Intelligence</h2>
          <p className="pv-subtitle">
            Predictive modeling and clinical insight telemetry
          </p>
        </div>
      </div>
      <div className="pv-table-wrap">
        <table className="pv-table">
          <thead>
            <tr>
              <th>Insight Type</th>
              <th>Prediction</th>
              <th>Confidence</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {insights.map((i) => (
              <tr key={i.id}>
                <td className="pv-name">{i.type}</td>
                <td>{i.prediction}</td>
                <td className="font-bold">{i.confidence}</td>
                <td>
                  <button className="pv-del">Detail</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function BlockchainView() {
  const [ledger] = useState([
    { id: "1", type: "Diagnostic", hash: "0x8a2f...3c91", status: "VERIFIED" },
    { id: "2", type: "Admission", hash: "0x4e10...9b22", status: "ON-CHAIN" },
  ]);

  return (
    <div className="blockchain-view">
      <div className="pv-header">
        <div>
          <h2 className="pv-title">Immutable Audit Ledger</h2>
          <p className="pv-subtitle">
            Verifiable record hashes and distributed trust auditing
          </p>
        </div>
      </div>
      <div className="pv-table-wrap">
        <table className="pv-table">
          <thead>
            <tr>
              <th>Record Type</th>
              <th>Blockchain Hash</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {ledger.map((l) => (
              <tr key={l.id}>
                <td className="pv-name">{l.type}</td>
                <td className="font-mono text-xs">{l.hash}</td>
                <td>
                  <span
                    className={`pv-badge ${l.status === "VERIFIED" ? "badge-male" : "badge-female"}`}
                  >
                    {l.status}
                  </span>
                </td>
                <td>
                  <button className="pv-del">Verify</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function UserManagementView() {
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
  type BillingRow = {
    id: string;
    invoiceNo: string;
    patient: string;
    amount: number;
    paidAmount: number;
    outstanding: number;
    status: string;
    paymentMethod?: string;
    paidAt?: string;
    transactionId?: string;
    receiptNo?: string;
    itemsCount: number;
  };
  const [bills, setBills] = useState<BillingRow[]>([]);
  const [loadingBills, setLoadingBills] = useState(false);
  const [billingError, setBillingError] = useState("");
  const [activeReceipt, setActiveReceipt] = useState<BillingRow | null>(null);
  const [notice, setNotice] = useState("");

  const formatPatientName = (bill: any) => {
    const first = String(bill?.patient?.firstName || "").trim();
    const last = String(bill?.patient?.lastName || "").trim();
    return `${first} ${last}`.trim() || String(bill?.patient?.name || "Unknown Patient");
  };

  const mapBillToRow = (bill: any): BillingRow => {
    const payments = Array.isArray(bill?.payments) ? bill.payments : [];
    const receipts = Array.isArray(bill?.receipts) ? bill.receipts : [];
    const sortedPayments = [...payments].sort((a: any, b: any) => {
      const at = Date.parse(String(a?.paidAt || a?.createdAt || ""));
      const bt = Date.parse(String(b?.paidAt || b?.createdAt || ""));
      return (Number.isFinite(bt) ? bt : 0) - (Number.isFinite(at) ? at : 0);
    });
    const sortedReceipts = [...receipts].sort((a: any, b: any) => {
      const at = Date.parse(String(a?.issuedAt || a?.createdAt || ""));
      const bt = Date.parse(String(b?.issuedAt || b?.createdAt || ""));
      return (Number.isFinite(bt) ? bt : 0) - (Number.isFinite(at) ? at : 0);
    });
    const latestPayment = sortedPayments[0];
    const latestReceipt = sortedReceipts[0];
    const totalAmount = Number(bill?.totalAmount || 0);
    const paidAmount = sortedPayments.reduce(
      (sum: number, payment: any) => sum + Number(payment?.amount || 0),
      0,
    );
    const outstanding = Math.max(totalAmount - paidAmount, 0);
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
    const invoiceNo =
      String((bill as any)?.invoiceNumber || "").trim() ||
      `INV-${invoiceDate}-${idSuffix}`;

    return {
      id: String(bill?.id || ""),
      invoiceNo,
      patient: formatPatientName(bill),
      amount: totalAmount,
      paidAmount,
      outstanding,
      status: String(bill?.status || "UNPAID").toUpperCase(),
      paymentMethod: latestPayment?.method ? String(latestPayment.method) : undefined,
      paidAt: latestPayment?.paidAt ? String(latestPayment.paidAt) : undefined,
      transactionId: latestPayment?.transactionId
        ? String(latestPayment.transactionId)
        : undefined,
      receiptNo: latestReceipt?.receiptNumber
        ? String(latestReceipt.receiptNumber)
        : undefined,
      itemsCount: Array.isArray(bill?.items) ? bill.items.length : 0,
    };
  };

  const loadBills = async () => {
    setLoadingBills(true);
    setBillingError("");
    try {
      const rows = await fetchBillingBills();
      setBills(Array.isArray(rows) ? rows.map(mapBillToRow) : []);
    } catch (error: any) {
      setBillingError(String(error?.message || "Failed to load billing records."));
      setBills([]);
    } finally {
      setLoadingBills(false);
    }
  };

  useEffect(() => {
    void loadBills();
  }, []);

  const settleBill = async (bill: BillingRow) => {
    const amountToPay = Number(bill.outstanding > 0 ? bill.outstanding : bill.amount);
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
      const mapped = mapBillToRow(fullBill);
      setBills((prev) => prev.map((row) => (row.id === mapped.id ? mapped : row)));
      if (mapped.receiptNo) {
        setActiveReceipt(mapped);
        setNotice(`Payment received. Receipt ${mapped.receiptNo} generated automatically.`);
      } else {
        setNotice("Payment recorded successfully.");
      }
      window.setTimeout(() => setNotice(""), 2600);
    } catch (error: any) {
      setBillingError(String(error?.message || "Failed to settle bill."));
    }
  };

  const openReceipt = async (bill: BillingRow) => {
    try {
      const fullBill = await fetchBillingBillById(bill.id);
      const mapped = mapBillToRow(fullBill);
      setBills((prev) => prev.map((row) => (row.id === mapped.id ? mapped : row)));
      if (!mapped.receiptNo) {
        setNotice("No receipt available yet. Complete payment first.");
        window.setTimeout(() => setNotice(""), 2200);
        return;
      }
      setActiveReceipt(mapped);
    } catch (error: any) {
      setBillingError(String(error?.message || "Failed to fetch receipt details."));
    }
  };

  const downloadReceipt = (bill: BillingRow) => {
    const paidAt = bill.paidAt ? new Date(bill.paidAt).toLocaleString() : "-";
    const receiptText = [
      "MediLink HMIS - Payment Receipt",
      "--------------------------------",
      `Receipt No: ${bill.receiptNo || "-"}`,
      `Invoice No: ${bill.invoiceNo || "-"}`,
      `Patient: ${bill.patient}`,
      `Amount (KES): ${bill.amount.toLocaleString()}`,
      `Payment Method: ${bill.paymentMethod || "-"}`,
      `Paid At: ${paidAt}`,
      `Status: ${bill.status}`,
    ].join("\n");
    const blob = new Blob([receiptText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${bill.receiptNo || `receipt-${bill.id}`}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="billing-view">
      <div className="pv-header">
        <div>
          <h2 className="pv-title">Revenue Terminal</h2>
          <p className="pv-subtitle">
            Manage patient invoicing and settlements
          </p>
        </div>
        <button
          type="button"
          className="btn-primary"
          onClick={() => void loadBills()}
          disabled={loadingBills}
        >
          {loadingBills ? "Refreshing..." : "Refresh Bills"}
        </button>
      </div>
      {notice && <div className="workflow-notice is-success">{notice}</div>}
      {billingError && <div className="auth-error">{billingError}</div>}
      <div className="pv-table-wrap">
        <table className="pv-table">
          <thead>
            <tr>
              <th>Patient</th>
              <th>Invoice No</th>
              <th>Amount (KES)</th>
              <th>Paid (KES)</th>
              <th>Outstanding (KES)</th>
              <th>Status</th>
              <th>Receipt No</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loadingBills && (
              <tr>
                <td colSpan={8} className="pv-empty">Loading billing records...</td>
              </tr>
            )}
            {bills.map((b) => (
              <tr key={b.id}>
                <td className="pv-name">{b.patient}</td>
                <td>{b.invoiceNo}</td>
                <td className="font-bold">{b.amount.toLocaleString()}</td>
                <td>{b.paidAmount.toLocaleString()}</td>
                <td>{b.outstanding.toLocaleString()}</td>
                <td>
                  <span
                    className={`pv-badge ${
                      b.status === "UNPAID" ? "badge-female" : "badge-male"
                    }`}
                  >
                    {b.status}
                  </span>
                </td>
                <td>{b.receiptNo || "-"}</td>
                <td>
                  <button
                    className="pv-del"
                    onClick={() => {
                      if (b.status !== "PAID") {
                        void settleBill(b);
                        return;
                      }
                      void openReceipt(b);
                    }}
                  >
                    {b.status !== "PAID" ? "Settle" : "Receipt"}
                  </button>
                </td>
              </tr>
            ))}
            {!loadingBills && bills.length === 0 && (
              <tr>
                <td colSpan={8} className="pv-empty">No billing records found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {activeReceipt && (
        <div className="modal-overlay" onClick={() => setActiveReceipt(null)}>
          <div className="modal-box receipt-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Payment Receipt</h3>
              <button className="modal-close" onClick={() => setActiveReceipt(null)}>
                ✕
              </button>
            </div>
            <div className="receipt-grid">
              <p><strong>Receipt No:</strong> {activeReceipt.receiptNo || "-"}</p>
              <p><strong>Invoice No:</strong> {activeReceipt.invoiceNo}</p>
              <p><strong>Patient:</strong> {activeReceipt.patient}</p>
              <p><strong>Amount:</strong> KES {activeReceipt.amount.toLocaleString()}</p>
              <p><strong>Status:</strong> {activeReceipt.status}</p>
              <p><strong>Payment Method:</strong> {activeReceipt.paymentMethod || "-"}</p>
              <p>
                <strong>Paid At:</strong>{" "}
                {activeReceipt.paidAt ? new Date(activeReceipt.paidAt).toLocaleString() : "-"}
              </p>
            </div>
            <div className="modal-footer receipt-actions">
              <button
                type="button"
                className="btn-cancel"
                onClick={() => setActiveReceipt(null)}
              >
                Close
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={() => downloadReceipt(activeReceipt)}
              >
                Download Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InsuranceView() {
  const [claims] = useState([
    { id: "1", provider: "NHIF", status: "SUBMITTED", amount: 12000 },
    { id: "2", provider: "AON", status: "PAID", amount: 45000 },
  ]);

  return (
    <div className="insurance-view">
      <div className="pv-header">
        <div>
          <h2 className="pv-title">Claims Registry</h2>
          <p className="pv-subtitle">
            Track insurance provider payouts and pre-auths
          </p>
        </div>
      </div>
      <div className="pv-table-wrap">
        <table className="pv-table">
          <thead>
            <tr>
              <th>Provider</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {claims.map((c) => (
              <tr key={c.id}>
                <td className="pv-name">{c.provider}</td>
                <td className="font-bold">{c.amount.toLocaleString()}</td>
                <td>
                  <span
                    className={`pv-badge ${c.status === "SUBMITTED" ? "badge-female" : "badge-male"}`}
                  >
                    {c.status}
                  </span>
                </td>
                <td>
                  <button className="pv-del">Details</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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

function SplashScreen() {
  const [progress, setProgress] = useState(0);

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
      <div className="hmis-splash-grid" aria-hidden />
      <div className="hmis-splash-overlay" aria-hidden />
      <div className="hmis-scan-dot dot-a" aria-hidden />
      <div className="hmis-scan-dot dot-b" aria-hidden />
      <div className="hmis-scan-dot dot-c" aria-hidden />
      <div className="hmis-scan-line" aria-hidden />

      <div className="hmis-splash-content">
        <h1 className="hmis-splash-brand">Medilink Kenya</h1>
        <div className="hmis-splash-progress-row">
          <div className="hmis-splash-progress-track">
            <div
              className="hmis-splash-progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="hmis-splash-progress-value">{progress}%</span>
        </div>
        <p className="hmis-splash-sub">Loading Hospital Command Center...</p>
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

function FacilityRegisterScreen({
  form,
  setForm,
  onSubmit,
  onBack,
  error,
  loading,
  landingTheme,
}: {
  form: FacilityRegistration;
  setForm: React.Dispatch<React.SetStateAction<FacilityRegistration>>;
  onSubmit: (e: React.FormEvent) => void;
  onBack: () => void;
  error: string;
  loading: boolean;
  landingTheme: "enterprise" | "clinical" | "luxury";
}) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className={`auth-root landing-theme-${landingTheme}`}>
      <form className="auth-card" onSubmit={onSubmit}>
        <img
          src="/Loginlogo.png"
          alt="MediLink HMIS"
          className="auth-title-logo"
        />
        <p>Register your hospital and create Hospital Admin credentials.</p>
        {error && <div className="auth-error">{error}</div>}
        <div className="auth-grid">
          <label>
            Facility Name *
            <input
              className="auth-input"
              value={form.facilityName}
              onChange={(e) =>
                setForm((f) => ({ ...f, facilityName: e.target.value }))
              }
              required
            />
          </label>
          <label>
            Registration Number *
            <input
              className="auth-input"
              value={form.registrationNumber}
              onChange={(e) =>
                setForm((f) => ({ ...f, registrationNumber: e.target.value }))
              }
              required
            />
          </label>
          <label>
            Facility Email *
            <input
              className="auth-input"
              type="email"
              value={form.facilityEmail}
              onChange={(e) =>
                setForm((f) => ({ ...f, facilityEmail: e.target.value }))
              }
              required
            />
          </label>
          <label>
            Facility Phone *
            <input
              className="auth-input"
              value={form.facilityPhone}
              onChange={(e) =>
                setForm((f) => ({ ...f, facilityPhone: e.target.value }))
              }
              required
            />
          </label>
          <label>
            Admin Full Name *
            <input
              className="auth-input"
              value={form.adminName}
              onChange={(e) =>
                setForm((f) => ({ ...f, adminName: e.target.value }))
              }
              required
            />
          </label>
          <label>
            Admin Email *
            <input
              className="auth-input"
              type="email"
              value={form.adminEmail}
              onChange={(e) =>
                setForm((f) => ({ ...f, adminEmail: e.target.value }))
              }
              required
            />
          </label>
          <label>
            Admin Phone *
            <input
              className="auth-input"
              value={form.adminPhone}
              onChange={(e) =>
                setForm((f) => ({ ...f, adminPhone: e.target.value }))
              }
              required
            />
          </label>
          <label>
            Password *
            <div className="auth-password-wrap">
              <input
                className="auth-input"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(e) =>
                  setForm((f) => ({ ...f, password: e.target.value }))
                }
                required
                autoComplete="new-password"
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
        </div>
        <div className="auth-actions">
          <button type="button" className="splash-btn-secondary" onClick={onBack}>
            Back
          </button>
          <button type="submit" className="splash-btn-primary" disabled={loading}>
            {loading ? "Registering..." : "Complete Registration"}
          </button>
        </div>
      </form>
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
  facilityCode,
  licenseKey,
  setFacilityCode,
  setLicenseKey,
  onSubmit,
  onBack,
  error,
  loading,
  status,
  landingTheme,
}: {
  facilityCode: string;
  licenseKey: string;
  setFacilityCode: (value: string) => void;
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
          Facility Code
          <input
            className="auth-input"
            value={facilityCode}
            onChange={(e) => setFacilityCode(e.target.value)}
            placeholder="e.g. KDH-2026-001"
            required
          />
        </label>
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
                      {supportStatusSavingId === ticket.id ? "Saving..." : "Save"}
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
  const [registrationForm, setRegistrationForm] = useState<FacilityRegistration>({
    facilityName: "",
    registrationNumber: "",
    facilityEmail: "",
    facilityPhone: "",
    adminName: "",
    adminEmail: "",
    adminPhone: "",
    password: "",
  });
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
      if (!facilityCode) {
        setLicenseStatus({ active: false, status: "MISSING_FACILITY_CODE" });
        setLicenseError("Facility code is required to validate the license.");
        return false;
      }

      setLicenseLoading(true);
      try {
        const status = (await fetchLicenseStatus(facilityCode)) as LicenseState;
        setLicenseStatus(status);
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
    dynamicAllowedModuleIds !== null
      ? dynamicAllowedModuleIds
      : roleKey === "super_admin" || roleKey === "hospital_admin"
        ? ROLE_ALLOWED_MODULES[roleKey]
        : [];
  const allowedModuleSet = new Set<number>(effectiveAllowedModules);
  const sidebarNavItems = SIDEBAR_NAV_ITEMS.filter((item) =>
    allowedNavSet.has(item.index),
  );

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
    const isPlatformAdminRole =
      normalizedRole === "super_admin" || normalizedRole === "hospital_admin";
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
              ? ROLE_ALLOWED_MODULES[normalizedRole as "super_admin" | "hospital_admin"]
              : [],
        );
      } catch {
        if (cancelled) return;
        setDynamicAllowedModuleIds(
          isPlatformAdminRole
            ? ROLE_ALLOWED_MODULES[normalizedRole as "super_admin" | "hospital_admin"]
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

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => !prev);
  };

  const goToDashboard = () => {
    setActiveWorkflowModuleId(null);
    setActiveNav(defaultNavIndex);
  };

  const handleLogout = () => {
    clearTokens();
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    setAuthError("");
    setLoginPassword("");
    setActiveWorkflowModuleId(null);
    setActiveNav(0);
    setAuthRoleKey("hospital_admin");
    setDynamicAllowedModuleIds(null);
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
    const facilityCode = normalizeFacilityCode(licenseFacilityCode);
    const normalizedKey = normalizeLicenseKey(licenseKey);
    if (!facilityCode || !normalizedKey) {
      setLicenseError("Enter both facility code and license key.");
      return;
    }
    setLicenseLoading(true);
    try {
      const response = (await activateLicense({
        facilityCode,
        licenseKey: normalizedKey,
      })) as LicenseState;
      setStoredFacilityCode(facilityCode);
      setLicenseFacilityCode(facilityCode);
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

  const handleRegisterFacility = async (e: React.FormEvent) => {
    e.preventDefault();
    if (registrationForm.password.length < 8) {
      setAuthError("Password must be at least 8 characters.");
      return;
    }

    setAuthLoading(true);
    try {
      const createdFacility = await createFacility({
        name: registrationForm.facilityName.trim(),
        code: registrationForm.registrationNumber.trim(),
        phone: registrationForm.facilityPhone.trim(),
        email: registrationForm.facilityEmail.trim(),
        status: "PENDING",
      });

      const registeredCode = registrationForm.registrationNumber.trim();
      if (registeredCode) {
        setStoredFacilityCode(registeredCode);
        setLicenseFacilityCode(registeredCode);
      }

      const facilityId = createdFacility?.id;
      await registerHospitalAdmin({
        email: registrationForm.adminEmail.trim(),
        phone: registrationForm.adminPhone.trim(),
        password: registrationForm.password,
        role: "hospital_admin",
        tenantId: facilityId || null,
        tenantType: "HOSPITAL",
      });

      localStorage.setItem(
        ACCOUNT_STORAGE_KEY,
        JSON.stringify({
          ...registrationForm,
          backendFacilityId: facilityId,
        }),
      );
      setAuthError("");
      setLoginEmail(registrationForm.adminEmail);
      setLoginPassword("");
      setAuthScreen("login");
    } catch (error: any) {
      setAuthError(error?.message || "Unable to register facility.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleHospitalAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const raw = localStorage.getItem(ACCOUNT_STORAGE_KEY);
    if (!raw) {
      setAuthError("No facility registered yet. Register facility first.");
      return;
    }

    let saved: FacilityRegistration;
    try {
      saved = JSON.parse(raw) as FacilityRegistration;
    } catch {
      setAuthError("Saved registration data is invalid. Re-register facility.");
      return;
    }
    const facilityCode = String(saved.registrationNumber || "").trim();
    if (facilityCode) {
      setStoredFacilityCode(facilityCode);
      setLicenseFacilityCode(facilityCode);
    }

    setAuthLoading(true);
    try {
      await loginHospitalAdmin({
        email: loginEmail.trim(),
        password: loginPassword,
        audience: "hospital_admin",
      });

      const token = getAccessToken();
      const claims = token ? decodeJwtPayload(token) : null;
      const role = claims?.role ? String(claims.role) : "hospital_admin";
      const normalizedRole = role.toLowerCase().trim();
      const resolvedRoleKey = resolveRoleKeyForUi(normalizedRole);
      const isPlatformAdminRole =
        normalizedRole === "super_admin" || normalizedRole === "hospital_admin";

      setFacility({
        id: saved.backendFacilityId || saved.registrationNumber,
        name: saved.facilityName,
      });
      setUser({
        name: saved.adminName,
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
                ? ROLE_ALLOWED_MODULES[normalizedRole as "super_admin" | "hospital_admin"]
                : [],
          );
        }
      } catch {
        setDynamicAllowedModuleIds(
          isPlatformAdminRole
            ? ROLE_ALLOWED_MODULES[normalizedRole as "super_admin" | "hospital_admin"]
            : [],
        );
      }
      sessionStorage.setItem(SESSION_STORAGE_KEY, "active");
      setAuthError("");
      const licenseOk = await ensureLicenseActive(
        facilityCode || getStoredFacilityCode(),
      );
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
      await loginStaff({
        email: loginEmail.trim(),
        password: loginPassword,
      });

      const token = getAccessToken();
      const claims = token ? decodeJwtPayload(token) : null;
      const role = claims?.role ? String(claims.role) : "staff";
      const normalizedRole = role.toLowerCase().trim();
      const isPlatformAdminRole =
        normalizedRole === "super_admin" || normalizedRole === "hospital_admin";
      const savedRaw = localStorage.getItem(ACCOUNT_STORAGE_KEY);
      let savedFacilityName = "Hospital Facility";
      let savedFacilityId = claims?.tenantId || "facility";
      let savedFacilityCode = "";
      if (savedRaw) {
        try {
          const saved = JSON.parse(savedRaw) as FacilityRegistration;
          savedFacilityName = saved.facilityName || savedFacilityName;
          savedFacilityId = saved.backendFacilityId || saved.registrationNumber || savedFacilityId;
          savedFacilityCode = String(saved.registrationNumber || "").trim();
        } catch {
          // ignore malformed local registration cache
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
                ? ROLE_ALLOWED_MODULES[normalizedRole as "super_admin" | "hospital_admin"]
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
                ? ROLE_ALLOWED_MODULES[normalizedRole as "super_admin" | "hospital_admin"]
                : [],
          );
        } catch {
          setDynamicAllowedModuleIds(
            isPlatformAdminRole
              ? ROLE_ALLOWED_MODULES[normalizedRole as "super_admin" | "hospital_admin"]
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
        <FacilityRegisterScreen
          form={registrationForm}
          setForm={setRegistrationForm}
          onSubmit={handleRegisterFacility}
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

    if (authScreen === "license") {
      return (
        <LicenseActivationScreen
          facilityCode={licenseFacilityCode}
          licenseKey={licenseKey}
          setFacilityCode={setLicenseFacilityCode}
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
                {facility?.name
                  ? `${facility.name} command center`
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
        return <OPDOTView />;
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
        return <DiagnosticsView type="Radiology" />;
      case 9:
        return <BillingView />;
      case 10:
        return <PharmacyView />;
      case 11:
        return <InventoryView />;
      case 26:
        return <OTView />;
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
        return <HRView />;
      case 17:
        return <DoctorView />;
      case 18:
        return <FacilityView />;
      case 19:
        return <AnalyticsView />;
      case 20:
        return <UserManagementView />;
      case 21:
        return <TelemedicineView />;
      case 22:
        return <AISuiteView />;
      case 23:
        return <BlockchainView />;
      case 24:
        return <BloodBankView />;
      case 25:
        return <ClinicianView />;
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
        return module && allowedModuleSet.has(module.id) ? (
          <React.Suspense fallback={<div className="p-4">Loading module...</div>}>
            <LazyWorkflowModuleView
              module={module}
              patients={patients}
              onPatientsRefresh={refreshPatientsFromBackend}
            />
          </React.Suspense>
        ) : (
          <div className="p-4">You do not have access to this module.</div>
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
      <aside
        className={`sidebar ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}
      >
        <div className="brand">
          <img
            src="/MedilinkHMIS.png"
            alt="Medilink HMIS"
            className="brand-logo-main"
          />
        </div>
        <nav className="nav">
          {sidebarNavItems.map((item) => (
            <button
              key={item.index}
              onClick={() => {
                setActiveWorkflowModuleId(null);
                setActiveNav(item.index);
              }}
              className={`nav-item ${activeNav === item.index ? "nav-active" : ""}`}
            >
              <Icon type={item.iconType} size={18} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        {roleKey === "hospital_admin" && (
          <div className="sidebar-upgrade-wrap">
            <button
              className={`sidebar-upgrade-btn ${activeNav === 40 ? "is-active" : ""}`}
              onClick={() => {
                setActiveWorkflowModuleId(null);
                setActiveNav(40);
              }}
            >
              <CrownIcon size={14} />
              <span>Upgrade</span>
            </button>
          </div>
        )}
        <div className="sidebar-help-wrap">
          <button
            className={`sidebar-help-btn ${helpWidgetOpen ? "is-active" : ""}`}
            onClick={() => setHelpWidgetOpen(true)}
          >
            <Icon type="support" size={16} />
            <span>Help AI</span>
          </button>
        </div>
        <div className="sidebar-hospital-card">
          <img
            src={facilityLogo || "/Medilink-hmis-icon.png"}
            className="sidebar-hospital-logo"
            alt="Hospital logo"
          />
          <p>{facility?.name || "Hospital Facility"}</p>
        </div>
      </aside>

          <div className="main">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="sidebar-line-toggle"
              onClick={toggleSidebar}
              aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <span />
              <span />
              <span />
            </button>
            {activeNav === 0 ? (
              <div className="search-wrap">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.92)"
                  strokeWidth="2"
                  style={{
                    position: "absolute",
                    left: 14,
                    top: "50%",
                    transform: "translateY(-50%)",
                  }}
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" />
                </svg>
                <input
                  className="search-input"
                  type="text"
                  placeholder="Search modules..."
                  value={moduleSearch}
                  onChange={(e) => setModuleSearch(e.target.value)}
                />
              </div>
            ) : (
              <div className="topbar-module-title">
                <button className="topbar-back-btn" onClick={goToDashboard}>
                  ← Back
                </button>
                <span
                  style={{ fontWeight: 600, color: "#ffffff", fontSize: "1rem" }}
                >
                  {getNavLabel(activeNav)}
                </span>
              </div>
            )}
          </div>
          <div className="topbar-right">
            <div className={`notif-chip ${appNotifications ? "on" : "off"}`}>
              {appNotifications ? "Alerts On" : "Alerts Off"}
            </div>
            <button className="topbar-logout-btn" onClick={handleLogout}>
              Logout
            </button>
            <div className="user-pill">
              <div className="avatar">A</div>
              <div>
                <div className="user-name">{user?.name || "Hospital Admin"}</div>
                <div className="user-role">{user?.role || "Hospital Admin"}</div>
              </div>
            </div>
          </div>
        </header>
        {renderMain()}
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
const DiagnosticsView = ({ type }: { type: string }) => (
  <div className="p-4">{type} Terminal</div>
);
const OPDOTView = () => <OTView />;
