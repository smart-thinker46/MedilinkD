import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { API_BASE_URL } from "./apiClient";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const DEFAULT_USER_NAMES = new Set([
  "hospital admin",
  "dr. almalick",
  "user",
  "staff user",
  "admin",
  "administrator",
  "null",
  "undefined",
]);

export function decodeJwtPayload(token?: string | null): any {
  if (!token || typeof token !== "string") return null;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export function formatPrettyName(value: string): string {
  const clean = value.replace(/@.+$/, "").replace(/[._-]+/g, " ").trim();
  const lower = clean.toLowerCase();
  if (lower.includes("almalick") || lower.includes("alimalick") || lower.includes("kweyu")) {
    return "Almalick Kweyu";
  }
  return clean
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

export function cleanDisplayName(...values: Array<unknown>): string {
  for (const value of values) {
    const text = String(value || "").trim();
    if (!text || DEFAULT_USER_NAMES.has(text.toLowerCase())) continue;
    return formatPrettyName(text);
  }
  return "";
}

export function resolveRealUserName(...candidates: Array<unknown>): string {
  // 1. Check explicit candidates passed in
  for (const val of candidates) {
    const cleaned = cleanDisplayName(val);
    if (cleaned) return cleaned;
  }

  // 2. Check localStorage: hmis_first_setup
  if (typeof window !== "undefined") {
    try {
      const setupRaw = window.localStorage.getItem("hmis_first_setup");
      if (setupRaw) {
        const setup = JSON.parse(setupRaw);
        const name = cleanDisplayName(
          setup?.values?.adminName,
          setup?.savedFacility?.adminName,
          setup?.values?.adminEmail,
          setup?.savedFacility?.adminEmail
        );
        if (name) return name;
      }
    } catch {}

    // 3. Check localStorage: hmis_hospital_admin_account
    try {
      const accountRaw = window.localStorage.getItem("hmis_hospital_admin_account");
      if (accountRaw) {
        const account = JSON.parse(accountRaw);
        const name = cleanDisplayName(
          account?.adminName,
          account?.name,
          account?.adminEmail
        );
        if (name) return name;
      }
    } catch {}

    // 4. Check decoded JWT tokens from session or local storage
    try {
      const token =
        window.sessionStorage.getItem("hmis_access_token") ||
        window.localStorage.getItem("hmis_access_token");
      if (token) {
        const payload = decodeJwtPayload(token);
        const name = cleanDisplayName(
          payload?.name,
          payload?.fullName,
          payload?.adminName,
          payload?.preferred_username,
          payload?.email,
          payload?.sub
        );
        if (name) return name;
      }
    } catch {}
  }

  const fallback = String(candidates.find((v) => String(v || "").trim()) || "").trim();
  return fallback && !DEFAULT_USER_NAMES.has(fallback.toLowerCase())
    ? formatPrettyName(fallback)
    : "Almalick Kweyu";
}

export function firstNameForGreeting(value?: unknown): string {
  return resolveRealUserName(value);
}

export const isFacilityLevelLabel = (value?: unknown) =>
  /^level\s+\d\b/i.test(String(value || "").trim());

export const pickHospitalName = (...values: Array<unknown>) => {
  for (const value of values) {
    const text = String(value || "").trim();
    if (text && !isFacilityLevelLabel(text)) return text;
  }
  return values.map((value) => String(value || "").trim()).find(Boolean) || "";
};

export type SetupBranding = {
  name?: string;
  logoUrl?: string;
  adminName?: string;
  adminEmail?: string;
  facilityId?: string;
  facilityCode?: string;
};

export const readSetupBranding = (): SetupBranding => {
  if (typeof window === "undefined") return {};
  try {
    let setup: any = null;
    const raw = window.localStorage.getItem("hmis_first_setup");
    if (raw?.trim()) {
      try {
        setup = JSON.parse(raw);
      } catch {}
    }

    let account: any = null;
    const accountRaw = window.localStorage.getItem("hmis_hospital_admin_account");
    if (accountRaw?.trim()) {
      try {
        account = JSON.parse(accountRaw);
      } catch {}
    }

    const name = pickHospitalName(
      setup?.values?.shortName,
      setup?.values?.legalName,
      setup?.values?.facilityName,
      setup?.savedFacility?.shortName,
      setup?.savedFacility?.legalName,
      setup?.savedFacility?.name,
      account?.facilityName,
      account?.name
    );

    const logoUrl =
      setup?.branding?.logoUrl ||
      setup?.savedFacility?.logoUrl ||
      setup?.savedFacility?.logo ||
      account?.logoUrl ||
      account?.logo ||
      window.localStorage.getItem("hmis_logo") ||
      "";

    const adminName =
      setup?.values?.adminName ||
      setup?.savedFacility?.adminName ||
      account?.adminName ||
      account?.name ||
      "";

    const adminEmail =
      setup?.values?.adminEmail ||
      setup?.savedFacility?.adminEmail ||
      account?.adminEmail ||
      account?.email ||
      "";

    const facilityId =
      setup?.savedFacility?.id ||
      setup?.values?.facilityId ||
      account?.backendFacilityId ||
      account?.facilityId ||
      "";

    const facilityCode =
      setup?.savedFacility?.mflCode ||
      setup?.values?.mflCode ||
      setup?.values?.registrationNumber ||
      account?.registrationNumber ||
      "";

    return {
      name: name || undefined,
      logoUrl: logoUrl || undefined,
      adminName: adminName || undefined,
      adminEmail: adminEmail || undefined,
      facilityId: facilityId || undefined,
      facilityCode: facilityCode || undefined,
    };
  } catch {
    return {};
  }
};

export const resolveAssetUrl = (value?: string | null) => {
  const url = String(value || "").trim();
  if (!url) return "/MedilinkHMIS.png";
  if (/^(https?:)?\/\//i.test(url) || url.startsWith("data:") || url.startsWith("blob:")) {
    return url;
  }
  if (url.startsWith("/Medilink") || url.startsWith("/icons/")) {
    return url;
  }
  if (url.startsWith("/") && API_BASE_URL) {
    return `${API_BASE_URL}${url}`;
  }
  return url;
};

export const isAdminLikeRole = (...values: Array<unknown>) =>
  values.some((value) => {
    const role = String(value || "").trim().toLowerCase().replace(/[\s-]+/g, "_");
    return [
      "super_admin",
      "hospital_admin",
      "admin",
      "administrator",
      "facility_admin",
      "tenant_admin",
    ].includes(role);
  });
