export const API_BASE_URL =
  (import.meta as any).env?.VITE_API_BASE_URL || "http://localhost:3000";
import { WORKFLOW_MODULES } from "../modules/workflowCatalog";

export const ACCESS_TOKEN_STORAGE_KEY = "hmis_access_token";
export const REFRESH_TOKEN_STORAGE_KEY = "hmis_refresh_token";
export const SESSION_STORAGE_KEY = "hmis_hospital_admin_session";
export const DEVICE_ID_STORAGE_KEY = "hmis_device_id";
export const LICENSE_FACILITY_STORAGE_KEY = "hmis_license_facility_code";
let csrfTokenCache: string | null = null;
let accessTokenMemory: string | null = null;
let refreshTokenMemory: string | null = null;

type LoginPayload = {
  email: string;
  password: string;
  audience?: "hospital_admin" | "staff";
  deviceId?: string;
};

type RegisterPayload = {
  email: string;
  phone: string;
  password: string;
  role: "hospital_admin";
  tenantId?: string | null;
  tenantType: "HOSPITAL";
};

type TokenResponse = {
  accessToken?: string;
  refreshToken?: string;
  deviceId?: string;
};

export function getAccessToken() {
  if (accessTokenMemory) return accessTokenMemory;
  const fromSession = sessionStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
  if (fromSession) {
    accessTokenMemory = fromSession;
    return fromSession;
  }
  return null;
}

export function getRefreshToken() {
  if (refreshTokenMemory) return refreshTokenMemory;
  const fromSession = sessionStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
  if (fromSession) {
    refreshTokenMemory = fromSession;
    return fromSession;
  }
  return null;
}

export function setTokens(tokens: TokenResponse) {
  if (tokens.accessToken) {
    accessTokenMemory = tokens.accessToken;
    sessionStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, tokens.accessToken);
  }
  if (tokens.refreshToken) {
    refreshTokenMemory = tokens.refreshToken;
    sessionStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, tokens.refreshToken);
  }
  if (tokens.deviceId) {
    localStorage.setItem(DEVICE_ID_STORAGE_KEY, tokens.deviceId);
  }
}

export function clearTokens() {
  accessTokenMemory = null;
  refreshTokenMemory = null;
  sessionStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
  sessionStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
}

export function getDeviceId() {
  const cached = localStorage.getItem(DEVICE_ID_STORAGE_KEY);
  if (cached) return cached;
  const generated =
    (globalThis.crypto?.randomUUID?.() as string | undefined) ||
    `device-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  localStorage.setItem(DEVICE_ID_STORAGE_KEY, generated);
  return generated;
}

export function getDeviceLabel() {
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const platform = typeof navigator !== "undefined" ? navigator.platform : "";
  return [platform, ua].filter(Boolean).join(" ").slice(0, 160);
}

export function getStoredFacilityCode() {
  return localStorage.getItem(LICENSE_FACILITY_STORAGE_KEY) || "";
}

export function setStoredFacilityCode(code: string) {
  if (!code) return;
  localStorage.setItem(LICENSE_FACILITY_STORAGE_KEY, code);
}

export async function parseJsonSafe(response: Response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

export async function fetchLicenseStatus(facilityCode: string) {
  const url = new URL(`${API_BASE_URL}/license/status`);
  if (facilityCode) {
    url.searchParams.set("facilityCode", facilityCode);
  }
  const deviceId = getDeviceId();
  if (deviceId) {
    url.searchParams.set("deviceId", deviceId);
  }
  const response = await fetch(url.toString(), { method: "GET" });
  const body = await parseJsonSafe(response);
  if (!response.ok) {
    throw new Error(toErrorMessage(body, "License status check failed"));
  }
  return body;
}

export async function activateLicense(payload: { facilityCode: string; licenseKey: string }) {
  const deviceId = getDeviceId();
  const deviceLabel = getDeviceLabel();
  const response = await fetch(`${API_BASE_URL}/license/activate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...payload,
      deviceId,
      deviceLabel,
      deviceMeta: {
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || null,
      },
    }),
  });
  const body = await parseJsonSafe(response);
  if (!response.ok) {
    throw new Error(toErrorMessage(body, "License activation failed"));
  }
  return body;
}

async function getCsrfToken(): Promise<string | null> {
  if (csrfTokenCache) {
    return csrfTokenCache;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/security/csrf-token`, {
      method: "GET",
      credentials: "include",
    });
    const body = await parseJsonSafe(response);
    if (response.ok && typeof body?.csrfToken === "string" && body.csrfToken) {
      csrfTokenCache = body.csrfToken;
      return csrfTokenCache;
    }
  } catch {
    // ignore: some routes may not require CSRF
  }

  return null;
}

function toErrorMessage(payload: any, fallback: string) {
  if (typeof payload?.message === "string") {
    return payload.message;
  }
  if (Array.isArray(payload?.message)) {
    return payload.message.join(", ");
  }
  if (payload?.message && typeof payload.message === "object") {
    if (typeof payload.message?.message === "string") {
      return payload.message.message;
    }
    if (Array.isArray(payload.message?.message)) {
      return payload.message.message.join(", ");
    }
  }
  if (typeof payload?.error === "string" && payload.error) {
    return payload.error;
  }
  return fallback;
}

export async function registerHospitalAdmin(payload: RegisterPayload) {
  const csrfToken = await getCsrfToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (csrfToken) {
    headers["X-CSRF-Token"] = csrfToken;
  }

  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    headers,
    credentials: "include",
    body: JSON.stringify(payload),
  });

  const body = await parseJsonSafe(response);
  if (!response.ok) {
    throw new Error(toErrorMessage(body, "Registration failed"));
  }
  return body;
}

export async function createFacility(payload: {
  name: string;
  code: string;
  phone: string;
  email: string;
  status?: string;
}) {
  const csrfToken = await getCsrfToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (csrfToken) {
    headers["X-CSRF-Token"] = csrfToken;
  }

  const response = await fetch(`${API_BASE_URL}/facilities`, {
    method: "POST",
    headers,
    credentials: "include",
    body: JSON.stringify(payload),
  });
  const body = await parseJsonSafe(response);
  if (!response.ok) {
    throw new Error(toErrorMessage(body, "Facility creation failed"));
  }
  return body;
}

export async function loginHospitalAdmin(payload: LoginPayload) {
  const csrfToken = await getCsrfToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (csrfToken) {
    headers["X-CSRF-Token"] = csrfToken;
  }

  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers,
    credentials: "include",
    body: JSON.stringify({ ...payload, deviceId: payload.deviceId || getDeviceId() }),
  });

  const body = await parseJsonSafe(response);
  if (!response.ok) {
    throw new Error(toErrorMessage(body, "Login failed"));
  }

  setTokens(body);
  return body;
}

export async function loginStaff(payload: { email: string; password: string }) {
  return loginHospitalAdmin({
    ...payload,
    audience: "staff",
    deviceId: getDeviceId(),
  });
}

export async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    return false;
  }

  const csrfToken = await getCsrfToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (csrfToken) {
    headers["X-CSRF-Token"] = csrfToken;
  }

  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: "POST",
    headers,
    credentials: "include",
    body: JSON.stringify({ refreshToken, deviceId: getDeviceId() }),
  });

  const body = await parseJsonSafe(response);
  if (!response.ok) {
    clearTokens();
    return false;
  }

  setTokens(body);
  return true;
}

export async function logoutUser(): Promise<void> {
  const refreshToken = getRefreshToken();
  try {
    if (refreshToken) {
      const csrfToken = await getCsrfToken();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (csrfToken) {
        headers["X-CSRF-Token"] = csrfToken;
      }
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({ refreshToken, deviceId: getDeviceId() }),
      });
    }
  } finally {
    clearTokens();
  }
}

export async function apiFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const headers = new Headers(init.headers || {});
  const method = (init.method || "GET").toUpperCase();
  const needsCsrf = method === "POST" || method === "PUT" || method === "PATCH" || method === "DELETE";
  if (needsCsrf) {
    const csrfToken = await getCsrfToken();
    if (csrfToken) {
      headers.set("X-CSRF-Token", csrfToken);
    }
  }
  const accessToken = getAccessToken();
  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const first = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
    credentials: "include",
  });

  if (first.status !== 401) {
    return first;
  }

  const refreshed = await refreshAccessToken();
  if (!refreshed) {
    return first;
  }

  const retryHeaders = new Headers(init.headers || {});
  if (needsCsrf) {
    const csrfToken = await getCsrfToken();
    if (csrfToken) {
      retryHeaders.set("X-CSRF-Token", csrfToken);
    }
  }
  const newAccessToken = getAccessToken();
  if (newAccessToken) {
    retryHeaders.set("Authorization", `Bearer ${newAccessToken}`);
  }

  return fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: retryHeaders,
    credentials: "include",
  });
}

export type BackendPatientInput = {
  firstName: string;
  lastName: string;
  gender: "MALE" | "FEMALE" | "OTHER";
  dateOfBirth: string;
  bloodGroup?: string;
  nationalId?: string;
  phone?: string;
  email?: string;
  address?: string;
  allergies?: string;
  nextOfKinName?: string;
  nextOfKinPhone?: string;
  insuranceNumber?: string;
  insuranceProvider?: string;
  registrationType?: "NEW" | "RETURNING" | "EMERGENCY" | "REFERRAL" | "CORPORATE";
  emergencyContactRelationship?: string;
  consultationFeePaid?: boolean;
  chronicConditions?: string;
  currentMedications?: string;
  pastMedicalHistory?: string;
  surgeries?: string;
  preferredHospitalName?: string;
  primaryPhysicianName?: string;
  consentDataSharing?: boolean;
  consentMarketing?: boolean;
  consentTreatment?: boolean;
  consentVersion?: string;
  consentAcceptedAt?: string;
  portalAccessEnabled?: boolean;
  referralSource?: string;
  duplicateOverrideReason?: string;
  facilityLinkNote?: string;
  insuranceCoverageType?: string;
  insuranceExpiry?: string;
  insuranceCopayPercent?: number;
  employer?: string;
  maritalStatus?: string;
  occupation?: string;
  county?: string;
};

export async function fetchTenantPatients(search?: string) {
  const qs = search ? `?search=${encodeURIComponent(search)}` : "";
  let res = await apiFetch(`/tenant/patients${qs}`);
  if (!res.ok) {
    // fallback for non-tenant backend mode
    res = await apiFetch(`/patients${qs}`);
  }
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, "Failed to fetch patients"));
  }
  if (Array.isArray(body)) return body;
  if (Array.isArray((body as any)?.data)) return (body as any).data;
  if (Array.isArray((body as any)?.items)) return (body as any).items;
  if (Array.isArray((body as any)?.rows)) return (body as any).rows;
  return [];
}

export async function fetchTenantPatientById(id: string) {
  let res = await apiFetch(`/tenant/patients/${id}`);
  if (!res.ok) {
    // fallback for non-tenant backend mode
    res = await apiFetch(`/patients/${id}`);
  }
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, "Failed to fetch patient details"));
  }
  const wrapped =
    (body as any)?.data ??
    (body as any)?.item ??
    (body as any)?.patient ??
    body;
  return wrapped;
}

export async function fetchTenantPatientDuplicateCheck(params: {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  nationalId?: string;
  phone?: string;
  email?: string;
}) {
  const query = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    const normalized = String(value || "").trim();
    if (!normalized) return;
    query.set(key, normalized);
  });
  const qs = query.toString();
  const res = await apiFetch(`/tenant/patients/duplicate-check${qs ? `?${qs}` : ""}`);
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, "Failed to run duplicate check"));
  }
  return body;
}

export async function fetchVisits(patientId?: string) {
  const qs = patientId ? `?patientId=${encodeURIComponent(patientId)}` : "";
  const res = await apiFetch(`/visits${qs}`);
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, "Failed to fetch visits"));
  }
  if (Array.isArray(body)) return body;
  if (Array.isArray((body as any)?.data)) return (body as any).data;
  if (Array.isArray((body as any)?.items)) return (body as any).items;
  return [];
}

export async function fetchBillingBills(params?: {
  facilityId?: string;
  fromDate?: string;
  toDate?: string;
  status?: string;
  patientId?: string;
}) {
  const query = new URLSearchParams();
  if (params?.facilityId) query.set("facilityId", params.facilityId);
  if (params?.fromDate) query.set("fromDate", params.fromDate);
  if (params?.toDate) query.set("toDate", params.toDate);
  if (params?.status) query.set("status", params.status);
  if (params?.patientId) query.set("patientId", params.patientId);
  const qs = query.toString();
  const res = await apiFetch(`/billing/bills${qs ? `?${qs}` : ""}`);
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, "Failed to fetch billing records"));
  }
  if (Array.isArray(body)) return body;
  if (Array.isArray((body as any)?.data)) return (body as any).data;
  if (Array.isArray((body as any)?.items)) return (body as any).items;
  return [];
}

export async function fetchBillingDashboard(params?: {
  facilityId?: string;
  fromDate?: string;
  toDate?: string;
}) {
  const query = new URLSearchParams();
  if (params?.facilityId) query.set("facilityId", params.facilityId);
  if (params?.fromDate) query.set("fromDate", params.fromDate);
  if (params?.toDate) query.set("toDate", params.toDate);
  const qs = query.toString();
  const res = await apiFetch(`/billing/dashboard${qs ? `?${qs}` : ""}`);
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, "Failed to fetch billing dashboard"));
  }
  return (body as any)?.data ?? body;
}

export async function fetchBillingRevenueReport(params?: {
  facilityId?: string;
  fromDate?: string;
  toDate?: string;
  groupBy?: "day" | "week" | "month";
}) {
  const query = new URLSearchParams();
  if (params?.facilityId) query.set("facilityId", params.facilityId);
  if (params?.fromDate) query.set("fromDate", params.fromDate);
  if (params?.toDate) query.set("toDate", params.toDate);
  if (params?.groupBy) query.set("groupBy", params.groupBy);
  const qs = query.toString();
  const res = await apiFetch(`/billing/report${qs ? `?${qs}` : ""}`);
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, "Failed to fetch billing revenue report"));
  }
  return (body as any)?.data ?? body;
}

export async function fetchBillingArReport(params?: { facilityId?: string }) {
  const query = new URLSearchParams();
  if (params?.facilityId) query.set("facilityId", params.facilityId);
  const qs = query.toString();
  const res = await apiFetch(`/billing/ar${qs ? `?${qs}` : ""}`);
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, "Failed to fetch AR report"));
  }
  return (body as any)?.data ?? body;
}

export async function fetchBillingDiscounts(params?: { facilityId?: string }) {
  const query = new URLSearchParams();
  if (params?.facilityId) query.set("facilityId", params.facilityId);
  const qs = query.toString();
  const res = await apiFetch(`/billing/discounts${qs ? `?${qs}` : ""}`);
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, "Failed to fetch billing discounts"));
  }
  if (Array.isArray(body)) return body;
  if (Array.isArray((body as any)?.data)) return (body as any).data;
  if (Array.isArray((body as any)?.items)) return (body as any).items;
  return [];
}

export async function fetchBillingRefunds(params?: { facilityId?: string }) {
  const query = new URLSearchParams();
  if (params?.facilityId) query.set("facilityId", params.facilityId);
  const qs = query.toString();
  const res = await apiFetch(`/billing/refunds${qs ? `?${qs}` : ""}`);
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, "Failed to fetch billing refunds"));
  }
  if (Array.isArray(body)) return body;
  if (Array.isArray((body as any)?.data)) return (body as any).data;
  if (Array.isArray((body as any)?.items)) return (body as any).items;
  return [];
}

export async function fetchBillingBillById(id: string) {
  const res = await apiFetch(`/billing/bill/${id}`);
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, "Failed to fetch billing receipt details"));
  }
  return (body as any)?.data ?? (body as any)?.item ?? body;
}

export async function recordBillingPayment(
  billId: string,
  payload: { amount: number; method: string; transactionId?: string },
) {
  const res = await apiFetch(`/billing/bill/${billId}/payment`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, "Failed to record bill payment"));
  }
  return (body as any)?.data ?? (body as any)?.item ?? body;
}

export type MpesaStkPushPayload = {
  phoneNumber: string;
  amount: number;
  accountReference: string;
  description: string;
};

export async function initiateMpesaStkPush(payload: MpesaStkPushPayload) {
  const res = await apiFetch("/mpesa/stkpush", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, "Failed to initiate M-Pesa STK push"));
  }
  return (body as any)?.data ?? body;
}

export async function fetchAccountingDashboard(params?: {
  facilityId?: string;
  fromDate?: string;
  toDate?: string;
}) {
  const query = new URLSearchParams();
  if (params?.facilityId) query.set("facilityId", params.facilityId);
  if (params?.fromDate) query.set("fromDate", params.fromDate);
  if (params?.toDate) query.set("toDate", params.toDate);
  const qs = query.toString();
  const res = await apiFetch(`/finance-accounting/dashboard${qs ? `?${qs}` : ""}`);
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, "Failed to fetch accounting dashboard"));
  }
  return (body as any)?.data ?? body;
}

export async function fetchAccountingAccounts(params?: {
  facilityId?: string;
  accountType?: string;
  search?: string;
  active?: boolean;
}) {
  const query = new URLSearchParams();
  if (params?.facilityId) query.set("facilityId", params.facilityId);
  if (params?.accountType) query.set("accountType", params.accountType);
  if (params?.search) query.set("search", params.search);
  if (typeof params?.active === "boolean") query.set("active", params.active ? "true" : "false");
  const qs = query.toString();
  const res = await apiFetch(`/finance-accounting/accounts${qs ? `?${qs}` : ""}`);
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, "Failed to fetch chart of accounts"));
  }
  if (Array.isArray(body)) return body;
  if (Array.isArray((body as any)?.data)) return (body as any).data;
  if (Array.isArray((body as any)?.items)) return (body as any).items;
  return [];
}

export async function fetchAccountingJournals(params?: {
  facilityId?: string;
  fromDate?: string;
  toDate?: string;
  referenceModule?: string;
  search?: string;
}) {
  const query = new URLSearchParams();
  if (params?.facilityId) query.set("facilityId", params.facilityId);
  if (params?.fromDate) query.set("fromDate", params.fromDate);
  if (params?.toDate) query.set("toDate", params.toDate);
  if (params?.referenceModule) query.set("referenceModule", params.referenceModule);
  if (params?.search) query.set("search", params.search);
  const qs = query.toString();
  const res = await apiFetch(`/finance-accounting/journals${qs ? `?${qs}` : ""}`);
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, "Failed to fetch journal entries"));
  }
  if (Array.isArray(body)) return body;
  if (Array.isArray((body as any)?.data)) return (body as any).data;
  if (Array.isArray((body as any)?.items)) return (body as any).items;
  return [];
}

export async function fetchAccountingApAging(params?: {
  facilityId?: string;
  asOfDate?: string;
}) {
  const query = new URLSearchParams();
  if (params?.facilityId) query.set("facilityId", params.facilityId);
  if (params?.asOfDate) query.set("asOfDate", params.asOfDate);
  const qs = query.toString();
  const res = await apiFetch(`/finance-accounting/ap/aging${qs ? `?${qs}` : ""}`);
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, "Failed to fetch AP aging report"));
  }
  return (body as any)?.data ?? body;
}

export async function fetchAccountingArSummary(params?: {
  facilityId?: string;
  asOfDate?: string;
}) {
  const query = new URLSearchParams();
  if (params?.facilityId) query.set("facilityId", params.facilityId);
  if (params?.asOfDate) query.set("asOfDate", params.asOfDate);
  const qs = query.toString();
  const res = await apiFetch(`/finance-accounting/ar/summary${qs ? `?${qs}` : ""}`);
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, "Failed to fetch AR summary"));
  }
  return (body as any)?.data ?? body;
}

export async function fetchAccountingBudgets(params?: {
  facilityId?: string;
  fiscalYear?: string | number;
  status?: string;
}) {
  const query = new URLSearchParams();
  if (params?.facilityId) query.set("facilityId", params.facilityId);
  if (params?.fiscalYear !== undefined) query.set("fiscalYear", String(params.fiscalYear));
  if (params?.status) query.set("status", params.status);
  const qs = query.toString();
  const res = await apiFetch(`/finance-accounting/budgets${qs ? `?${qs}` : ""}`);
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, "Failed to fetch budgets"));
  }
  if (Array.isArray(body)) return body;
  if (Array.isArray((body as any)?.data)) return (body as any).data;
  if (Array.isArray((body as any)?.items)) return (body as any).items;
  return [];
}

export async function fetchAccountingBankAccounts(params?: {
  facilityId?: string;
  search?: string;
}) {
  const query = new URLSearchParams();
  if (params?.facilityId) query.set("facilityId", params.facilityId);
  if (params?.search) query.set("search", params.search);
  const qs = query.toString();
  const res = await apiFetch(`/finance-accounting/bank/accounts${qs ? `?${qs}` : ""}`);
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, "Failed to fetch bank accounts"));
  }
  if (Array.isArray(body)) return body;
  if (Array.isArray((body as any)?.data)) return (body as any).data;
  if (Array.isArray((body as any)?.items)) return (body as any).items;
  return [];
}

export async function fetchAccountingBankTransactions(params?: {
  facilityId?: string;
  bankAccountId?: string;
  fromDate?: string;
  toDate?: string;
}) {
  const query = new URLSearchParams();
  if (params?.facilityId) query.set("facilityId", params.facilityId);
  if (params?.bankAccountId) query.set("bankAccountId", params.bankAccountId);
  if (params?.fromDate) query.set("fromDate", params.fromDate);
  if (params?.toDate) query.set("toDate", params.toDate);
  const qs = query.toString();
  const res = await apiFetch(`/finance-accounting/bank/transactions${qs ? `?${qs}` : ""}`);
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, "Failed to fetch bank transactions"));
  }
  if (Array.isArray(body)) return body;
  if (Array.isArray((body as any)?.data)) return (body as any).data;
  if (Array.isArray((body as any)?.items)) return (body as any).items;
  return [];
}

export async function fetchAccountingTrialBalance(params?: {
  facilityId?: string;
  fromDate?: string;
  toDate?: string;
}) {
  const query = new URLSearchParams();
  if (params?.facilityId) query.set("facilityId", params.facilityId);
  if (params?.fromDate) query.set("fromDate", params.fromDate);
  if (params?.toDate) query.set("toDate", params.toDate);
  const qs = query.toString();
  const res = await apiFetch(`/finance-accounting/statements/trial-balance${qs ? `?${qs}` : ""}`);
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, "Failed to fetch trial balance"));
  }
  return (body as any)?.data ?? body;
}

export async function fetchAccountingProfitLoss(params?: {
  facilityId?: string;
  fromDate?: string;
  toDate?: string;
}) {
  const query = new URLSearchParams();
  if (params?.facilityId) query.set("facilityId", params.facilityId);
  if (params?.fromDate) query.set("fromDate", params.fromDate);
  if (params?.toDate) query.set("toDate", params.toDate);
  const qs = query.toString();
  const res = await apiFetch(`/finance-accounting/statements/profit-loss${qs ? `?${qs}` : ""}`);
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, "Failed to fetch P&L statement"));
  }
  return (body as any)?.data ?? body;
}

export async function fetchAccountingBalanceSheet(params?: {
  facilityId?: string;
  fromDate?: string;
  toDate?: string;
}) {
  const query = new URLSearchParams();
  if (params?.facilityId) query.set("facilityId", params.facilityId);
  if (params?.fromDate) query.set("fromDate", params.fromDate);
  if (params?.toDate) query.set("toDate", params.toDate);
  const qs = query.toString();
  const res = await apiFetch(`/finance-accounting/statements/balance-sheet${qs ? `?${qs}` : ""}`);
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, "Failed to fetch balance sheet"));
  }
  return (body as any)?.data ?? body;
}

export async function fetchInpatientAdmissions() {
  let res = await apiFetch("/ipd/admissions");
  let body = await parseJsonSafe(res);
  if (!res.ok) {
    // fallback for older backend without admissions endpoint
    res = await apiFetch("/ipd/active");
    body = await parseJsonSafe(res);
  }
  if (!res.ok) {
    throw new Error(toErrorMessage(body, "Failed to fetch inpatient admissions"));
  }
  if (Array.isArray(body)) return body;
  if (Array.isArray((body as any)?.data)) return (body as any).data;
  if (Array.isArray((body as any)?.items)) return (body as any).items;
  return [];
}

export async function fetchInpatientDashboard() {
  const res = await apiFetch("/ipd/dashboard");
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, "Failed to fetch inpatient dashboard"));
  }
  return (body as any)?.data ?? body;
}

export async function fetchOpdDashboard() {
  const res = await apiFetch("/opd/dashboard");
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, "Failed to fetch OPD dashboard"));
  }
  return (body as any)?.data ?? body;
}

export async function fetchOpdQueue(params?: {
  doctorId?: string;
  status?: string;
  departmentId?: string;
}) {
  const query = new URLSearchParams();
  if (params?.doctorId) query.set("doctorId", params.doctorId);
  if (params?.status) query.set("status", params.status);
  if (params?.departmentId) query.set("departmentId", params.departmentId);
  const qs = query.toString();
  const res = await apiFetch(`/opd/queue${qs ? `?${qs}` : ""}`);
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, "Failed to fetch OPD queue"));
  }
  return (body as any)?.data ?? body;
}

export async function fetchQueueBoard(params?: {
  departmentId?: string;
  doctorId?: string;
  queueType?: string;
  includeCompleted?: boolean;
}) {
  const query = new URLSearchParams();
  if (params?.departmentId) query.set("departmentId", params.departmentId);
  if (params?.doctorId) query.set("doctorId", params.doctorId);
  if (params?.queueType) query.set("queueType", params.queueType);
  if (typeof params?.includeCompleted === "boolean") {
    query.set("includeCompleted", params.includeCompleted ? "true" : "false");
  }
  const qs = query.toString();
  const res = await apiFetch(`/opd/queue/board${qs ? `?${qs}` : ""}`);
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, "Failed to fetch queue board"));
  }
  return (body as any)?.data ?? body;
}

export async function fetchQueueAnalytics(params?: {
  fromDate?: string;
  toDate?: string;
  departmentId?: string;
  doctorId?: string;
  queueType?: string;
}) {
  const query = new URLSearchParams();
  if (params?.fromDate) query.set("fromDate", params.fromDate);
  if (params?.toDate) query.set("toDate", params.toDate);
  if (params?.departmentId) query.set("departmentId", params.departmentId);
  if (params?.doctorId) query.set("doctorId", params.doctorId);
  if (params?.queueType) query.set("queueType", params.queueType);
  const qs = query.toString();
  const res = await apiFetch(`/opd/queue/analytics${qs ? `?${qs}` : ""}`);
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, "Failed to fetch queue analytics"));
  }
  return (body as any)?.data ?? body;
}

export async function fetchQueueCounters(params?: { departmentId?: string }) {
  const query = new URLSearchParams();
  if (params?.departmentId) query.set("departmentId", params.departmentId);
  const qs = query.toString();
  const res = await apiFetch(`/opd/queue/counters${qs ? `?${qs}` : ""}`);
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, "Failed to fetch queue counters"));
  }
  return (body as any)?.data ?? body;
}

export async function createQueueToken(payload: {
  patientId?: string;
  visitId?: string;
  doctorId?: string;
  departmentId?: string;
  queueType?: string;
  queueLane?: string;
  priority?: string | number;
  tokenPrefix?: string;
  tokenNumber?: string;
  servicePoint?: string;
  source?: string;
  notes?: string;
}) {
  const res = await apiFetch("/opd/queue/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload || {}),
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, "Failed to create queue token"));
  }
  return (body as any)?.data ?? body;
}

export async function updateQueueTokenStatus(payload: {
  tokenNumber?: string;
  tokenId?: string;
  status: string;
  reason?: string;
  counterId?: string;
  doctorId?: string;
  patientId?: string;
  visitId?: string;
}) {
  const res = await apiFetch("/opd/queue/token/status", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload || {}),
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, "Failed to update queue token status"));
  }
  return (body as any)?.data ?? body;
}

export async function overrideQueuePriority(payload: {
  tokenNumber?: string;
  tokenId?: string;
  priorityLevel?: string | number;
  reason?: string;
}) {
  const res = await apiFetch("/opd/queue/token/priority", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload || {}),
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, "Failed to override queue priority"));
  }
  return (body as any)?.data ?? body;
}

export async function queueCounterSession(payload: {
  counterId?: string;
  counterName?: string;
  departmentId?: string;
  staffId?: string;
  active?: boolean;
}) {
  const res = await apiFetch("/opd/queue/counter/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload || {}),
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, "Failed to update queue counter session"));
  }
  return (body as any)?.data ?? body;
}

export async function callNextQueueToken(payload?: {
  departmentId?: string;
  doctorId?: string;
  counterId?: string;
  queueType?: string;
}) {
  const res = await apiFetch("/opd/queue/call-next", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload || {}),
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, "Failed to call next queue token"));
  }
  return (body as any)?.data ?? body;
}

export async function fetchNursingDashboard(params?: {
  nurseId?: string;
  nurseName?: string;
}) {
  const query = new URLSearchParams();
  if (params?.nurseId) query.set("nurseId", params.nurseId);
  if (params?.nurseName) query.set("nurseName", params.nurseName);
  const qs = query.toString();
  const res = await apiFetch(`/nursing-notes/dashboard${qs ? `?${qs}` : ""}`);
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, "Failed to fetch nursing dashboard"));
  }
  return (body as any)?.data ?? body;
}

export async function fetchNursingPatientBoard(patientId: string) {
  const id = String(patientId || "").trim();
  if (!id) {
    throw new Error("Patient ID is required for nursing board.");
  }
  const res = await apiFetch(`/nursing-notes/patient/${encodeURIComponent(id)}/board`);
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, "Failed to fetch nursing patient board"));
  }
  return (body as any)?.data ?? body;
}

export async function fetchLaboratoryDashboard() {
  const res = await apiFetch("/laboratory/dashboard");
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, "Failed to fetch laboratory dashboard"));
  }
  return (body as any)?.data ?? body;
}

export async function fetchLaboratoryRequests(params?: {
  status?: string;
  priority?: string;
  doctorId?: string;
  testName?: string;
}) {
  const query = new URLSearchParams();
  if (params?.status) query.set("status", params.status);
  if (params?.priority) query.set("priority", params.priority);
  if (params?.doctorId) query.set("doctorId", params.doctorId);
  if (params?.testName) query.set("testName", params.testName);
  const qs = query.toString();
  const res = await apiFetch(`/laboratory/requests${qs ? `?${qs}` : ""}`);
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, "Failed to fetch laboratory requests"));
  }
  if (Array.isArray(body)) return body;
  if (Array.isArray((body as any)?.data)) return (body as any).data;
  if (Array.isArray((body as any)?.items)) return (body as any).items;
  return [];
}

export async function fetchRadiologyDashboard() {
  const res = await apiFetch("/radiology/dashboard");
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, "Failed to fetch radiology dashboard"));
  }
  return (body as any)?.data ?? body;
}

export async function fetchRadiologyRequests(params?: {
  status?: string;
  urgency?: string;
  search?: string;
  limit?: number;
}) {
  const query = new URLSearchParams();
  if (params?.status) query.set("status", params.status);
  if (params?.urgency) query.set("urgency", params.urgency);
  if (params?.search) query.set("search", params.search);
  if (params?.limit) query.set("limit", String(params.limit));
  const qs = query.toString();
  const res = await apiFetch(`/radiology/requests${qs ? `?${qs}` : ""}`);
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, "Failed to fetch radiology requests"));
  }
  if (Array.isArray(body)) return body;
  if (Array.isArray((body as any)?.data)) return (body as any).data;
  if (Array.isArray((body as any)?.items)) return (body as any).items;
  return [];
}

export async function fetchRadiologyReports(params?: {
  requestId?: string;
  limit?: number;
}) {
  const query = new URLSearchParams();
  if (params?.requestId) query.set("requestId", params.requestId);
  if (params?.limit) query.set("limit", String(params.limit));
  const qs = query.toString();
  const res = await apiFetch(`/radiology/reports${qs ? `?${qs}` : ""}`);
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, "Failed to fetch radiology reports"));
  }
  if (Array.isArray(body)) return body;
  if (Array.isArray((body as any)?.data)) return (body as any).data;
  if (Array.isArray((body as any)?.items)) return (body as any).items;
  return [];
}

export async function fetchRadiologySchedules(params?: {
  status?: string;
}) {
  const query = new URLSearchParams();
  if (params?.status) query.set("status", params.status);
  const qs = query.toString();
  const res = await apiFetch(`/radiology/schedules${qs ? `?${qs}` : ""}`);
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, "Failed to fetch radiology schedules"));
  }
  if (Array.isArray(body)) return body;
  if (Array.isArray((body as any)?.data)) return (body as any).data;
  if (Array.isArray((body as any)?.items)) return (body as any).items;
  return [];
}

export async function fetchRadiologyModalities() {
  const res = await apiFetch("/radiology/modalities");
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, "Failed to fetch radiology modalities"));
  }
  if (Array.isArray(body)) return body;
  if (Array.isArray((body as any)?.data)) return (body as any).data;
  if (Array.isArray((body as any)?.items)) return (body as any).items;
  return [];
}

export async function fetchRadiologyCriticalAlerts(params?: {
  acknowledged?: string;
}) {
  const query = new URLSearchParams();
  if (params?.acknowledged) query.set("acknowledged", params.acknowledged);
  const qs = query.toString();
  const res = await apiFetch(`/radiology/critical-alerts${qs ? `?${qs}` : ""}`);
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, "Failed to fetch radiology critical alerts"));
  }
  if (Array.isArray(body)) return body;
  if (Array.isArray((body as any)?.data)) return (body as any).data;
  if (Array.isArray((body as any)?.items)) return (body as any).items;
  return [];
}

export async function fetchRadiologyStudies(params?: {
  requestId?: string;
}) {
  const query = new URLSearchParams();
  if (params?.requestId) query.set("requestId", params.requestId);
  const qs = query.toString();
  const res = await apiFetch(`/radiology/studies${qs ? `?${qs}` : ""}`);
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, "Failed to fetch radiology studies"));
  }
  if (Array.isArray(body)) return body;
  if (Array.isArray((body as any)?.data)) return (body as any).data;
  if (Array.isArray((body as any)?.items)) return (body as any).items;
  return [];
}

export async function fetchRadiologyRequestTimeline(requestId: string) {
  const id = String(requestId || "").trim();
  if (!id) {
    throw new Error("Request ID is required for radiology timeline.");
  }
  const res = await apiFetch(`/radiology/request/${encodeURIComponent(id)}/timeline`);
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, "Failed to fetch radiology timeline"));
  }
  return (body as any)?.data ?? body;
}

export async function fetchOtDashboard() {
  const res = await apiFetch("/ot/dashboard");
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, "Failed to fetch OT dashboard"));
  }
  return (body as any)?.data ?? body;
}

export async function fetchOtBookings(params?: {
  status?: string;
  priority?: string;
  surgeonId?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
}) {
  const query = new URLSearchParams();
  if (params?.status) query.set("status", params.status);
  if (params?.priority) query.set("priority", params.priority);
  if (params?.surgeonId) query.set("surgeonId", params.surgeonId);
  if (params?.search) query.set("search", params.search);
  if (params?.dateFrom) query.set("dateFrom", params.dateFrom);
  if (params?.dateTo) query.set("dateTo", params.dateTo);
  if (params?.limit) query.set("limit", String(params.limit));
  const qs = query.toString();
  const res = await apiFetch(`/ot/bookings${qs ? `?${qs}` : ""}`);
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, "Failed to fetch OT bookings"));
  }
  if (Array.isArray(body)) return body;
  if (Array.isArray((body as any)?.data)) return (body as any).data;
  if (Array.isArray((body as any)?.items)) return (body as any).items;
  return [];
}

export async function fetchOtTimeline(bookingId: string) {
  const id = String(bookingId || "").trim();
  if (!id) throw new Error("Booking ID is required for OT timeline.");
  const res = await apiFetch(`/ot/booking/${encodeURIComponent(id)}/timeline`);
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, "Failed to fetch OT timeline"));
  }
  return (body as any)?.data ?? body;
}

export async function fetchBloodBankDashboard() {
  const res = await apiFetch("/blood-bank/dashboard");
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, "Failed to fetch blood bank dashboard"));
  }
  return (body as any)?.data ?? body;
}

export async function fetchBloodBankStock() {
  const res = await apiFetch("/blood-bank/stock");
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, "Failed to fetch blood bank stock"));
  }
  if (Array.isArray(body)) return body;
  if (Array.isArray((body as any)?.data)) return (body as any).data;
  if (Array.isArray((body as any)?.items)) return (body as any).items;
  return [];
}

export async function fetchBloodBankDonors(params?: { search?: string }) {
  const query = new URLSearchParams();
  if (params?.search) query.set("search", params.search);
  const qs = query.toString();
  const res = await apiFetch(`/blood-bank/donors${qs ? `?${qs}` : ""}`);
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, "Failed to fetch blood bank donors"));
  }
  if (Array.isArray(body)) return body;
  if (Array.isArray((body as any)?.data)) return (body as any).data;
  if (Array.isArray((body as any)?.items)) return (body as any).items;
  return [];
}

export async function fetchBloodBankRequests(params?: {
  status?: string;
  urgency?: string;
}) {
  const query = new URLSearchParams();
  if (params?.status) query.set("status", params.status);
  if (params?.urgency) query.set("urgency", params.urgency);
  const qs = query.toString();
  const res = await apiFetch(`/blood-bank/requests${qs ? `?${qs}` : ""}`);
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, "Failed to fetch blood bank requests"));
  }
  if (Array.isArray(body)) return body;
  if (Array.isArray((body as any)?.data)) return (body as any).data;
  if (Array.isArray((body as any)?.items)) return (body as any).items;
  return [];
}

export async function fetchBloodBankIssues() {
  const res = await apiFetch("/blood-bank/issues");
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, "Failed to fetch blood bank issues"));
  }
  if (Array.isArray(body)) return body;
  if (Array.isArray((body as any)?.data)) return (body as any).data;
  if (Array.isArray((body as any)?.items)) return (body as any).items;
  return [];
}

export async function fetchBloodBankTransfusions(params?: { patientId?: string }) {
  const query = new URLSearchParams();
  if (params?.patientId) query.set("patientId", params.patientId);
  const qs = query.toString();
  const res = await apiFetch(`/blood-bank/transfusions${qs ? `?${qs}` : ""}`);
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, "Failed to fetch blood bank transfusions"));
  }
  if (Array.isArray(body)) return body;
  if (Array.isArray((body as any)?.data)) return (body as any).data;
  if (Array.isArray((body as any)?.items)) return (body as any).items;
  return [];
}

export async function fetchBloodBankReactions(params?: { severity?: string }) {
  const query = new URLSearchParams();
  if (params?.severity) query.set("severity", params.severity);
  const qs = query.toString();
  const res = await apiFetch(`/blood-bank/reactions${qs ? `?${qs}` : ""}`);
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, "Failed to fetch blood bank reactions"));
  }
  if (Array.isArray(body)) return body;
  if (Array.isArray((body as any)?.data)) return (body as any).data;
  if (Array.isArray((body as any)?.items)) return (body as any).items;
  return [];
}

export async function fetchBloodBankInventoryMovements(params?: { movementType?: string }) {
  const query = new URLSearchParams();
  if (params?.movementType) query.set("movementType", params.movementType);
  const qs = query.toString();
  const res = await apiFetch(`/blood-bank/inventory-movements${qs ? `?${qs}` : ""}`);
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, "Failed to fetch blood inventory movements"));
  }
  if (Array.isArray(body)) return body;
  if (Array.isArray((body as any)?.data)) return (body as any).data;
  if (Array.isArray((body as any)?.items)) return (body as any).items;
  return [];
}

export async function fetchInsuranceDashboard() {
  const res = await apiFetch("/insurance/dashboard");
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, "Failed to fetch insurance dashboard"));
  }
  return (body as any)?.data ?? body;
}

export async function fetchInsuranceClaims(params?: {
  status?: string;
  provider?: string;
  patientId?: string;
  fromDate?: string;
  toDate?: string;
  search?: string;
  limit?: number;
}) {
  const query = new URLSearchParams();
  if (params?.status) query.set("status", params.status);
  if (params?.provider) query.set("provider", params.provider);
  if (params?.patientId) query.set("patientId", params.patientId);
  if (params?.fromDate) query.set("fromDate", params.fromDate);
  if (params?.toDate) query.set("toDate", params.toDate);
  if (params?.search) query.set("search", params.search);
  if (params?.limit) query.set("limit", String(params.limit));
  const qs = query.toString();
  const res = await apiFetch(`/insurance/claims${qs ? `?${qs}` : ""}`);
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, "Failed to fetch insurance claims"));
  }
  if (Array.isArray(body)) return body;
  if (Array.isArray((body as any)?.data)) return (body as any).data;
  if (Array.isArray((body as any)?.items)) return (body as any).items;
  return [];
}

export async function fetchInsurancePreAuthorizations(params?: {
  status?: string;
  claimId?: string;
}) {
  const query = new URLSearchParams();
  if (params?.status) query.set("status", params.status);
  if (params?.claimId) query.set("claimId", params.claimId);
  const qs = query.toString();
  const res = await apiFetch(`/insurance/pre-authorizations${qs ? `?${qs}` : ""}`);
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, "Failed to fetch insurance pre-authorizations"));
  }
  if (Array.isArray(body)) return body;
  if (Array.isArray((body as any)?.data)) return (body as any).data;
  if (Array.isArray((body as any)?.items)) return (body as any).items;
  return [];
}

export async function fetchInsurancePayments(params?: { claimId?: string }) {
  const query = new URLSearchParams();
  if (params?.claimId) query.set("claimId", params.claimId);
  const qs = query.toString();
  const res = await apiFetch(`/insurance/payments${qs ? `?${qs}` : ""}`);
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, "Failed to fetch insurance payments"));
  }
  if (Array.isArray(body)) return body;
  if (Array.isArray((body as any)?.data)) return (body as any).data;
  if (Array.isArray((body as any)?.items)) return (body as any).items;
  return [];
}

export async function fetchPatientPortalDashboard(params?: { search?: string; status?: string }) {
  const query = new URLSearchParams();
  if (params?.search) query.set("search", params.search);
  if (params?.status) query.set("status", params.status);
  const qs = query.toString();
  const res = await apiFetch(`/patient-portal/dashboard${qs ? `?${qs}` : ""}`);
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, "Failed to fetch patient portal dashboard"));
  }
  return (body as any)?.data ?? body;
}

export async function fetchPatientPortalAccounts(params?: { search?: string; status?: string }) {
  const query = new URLSearchParams();
  if (params?.search) query.set("search", params.search);
  if (params?.status) query.set("status", params.status);
  const qs = query.toString();
  const res = await apiFetch(`/patient-portal/accounts${qs ? `?${qs}` : ""}`);
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, "Failed to fetch patient portal accounts"));
  }
  if (Array.isArray(body)) return body;
  if (Array.isArray((body as any)?.data)) return (body as any).data;
  if (Array.isArray((body as any)?.items)) return (body as any).items;
  return [];
}

export async function fetchPatientPortalAccessLogs(params?: { patientId?: string; limit?: number }) {
  const query = new URLSearchParams();
  if (params?.patientId) query.set("patientId", params.patientId);
  if (params?.limit) query.set("limit", String(params.limit));
  const qs = query.toString();
  const res = await apiFetch(`/patient-portal/access-logs${qs ? `?${qs}` : ""}`);
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, "Failed to fetch patient portal access logs"));
  }
  if (Array.isArray(body)) return body;
  if (Array.isArray((body as any)?.data)) return (body as any).data;
  if (Array.isArray((body as any)?.items)) return (body as any).items;
  return [];
}

export async function fetchPatientPortalAppointments(params?: {
  status?: string;
  patientId?: string;
  search?: string;
}) {
  const query = new URLSearchParams();
  if (params?.status) query.set("status", params.status);
  if (params?.patientId) query.set("patientId", params.patientId);
  if (params?.search) query.set("search", params.search);
  const qs = query.toString();
  const res = await apiFetch(`/patient-portal/appointments${qs ? `?${qs}` : ""}`);
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, "Failed to fetch patient portal appointments"));
  }
  if (Array.isArray(body)) return body;
  if (Array.isArray((body as any)?.data)) return (body as any).data;
  if (Array.isArray((body as any)?.items)) return (body as any).items;
  return [];
}

export async function fetchPatientPortalNotifications(params?: {
  status?: string;
  patientId?: string;
}) {
  const query = new URLSearchParams();
  if (params?.status) query.set("status", params.status);
  if (params?.patientId) query.set("patientId", params.patientId);
  const qs = query.toString();
  const res = await apiFetch(`/patient-portal/notifications${qs ? `?${qs}` : ""}`);
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, "Failed to fetch patient portal notifications"));
  }
  if (Array.isArray(body)) return body;
  if (Array.isArray((body as any)?.data)) return (body as any).data;
  if (Array.isArray((body as any)?.items)) return (body as any).items;
  return [];
}

export async function fetchPatientPortalMessages(params?: { patientId?: string }) {
  const query = new URLSearchParams();
  if (params?.patientId) query.set("patientId", params.patientId);
  const qs = query.toString();
  const res = await apiFetch(`/patient-portal/messages${qs ? `?${qs}` : ""}`);
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, "Failed to fetch patient portal messages"));
  }
  if (Array.isArray(body)) return body;
  if (Array.isArray((body as any)?.data)) return (body as any).data;
  if (Array.isArray((body as any)?.items)) return (body as any).items;
  return [];
}

export async function fetchPatientPortalConsents(params?: { patientId?: string }) {
  const query = new URLSearchParams();
  if (params?.patientId) query.set("patientId", params.patientId);
  const qs = query.toString();
  const res = await apiFetch(`/patient-portal/consents${qs ? `?${qs}` : ""}`);
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, "Failed to fetch patient portal consents"));
  }
  if (Array.isArray(body)) return body;
  if (Array.isArray((body as any)?.data)) return (body as any).data;
  if (Array.isArray((body as any)?.items)) return (body as any).items;
  return [];
}

export async function fetchExternalIntegrationDashboard() {
  const res = await apiFetch("/external-integrations/dashboard");
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, "Failed to fetch external integration dashboard"));
  }
  return (body as any)?.data ?? body;
}

export async function fetchExternalIntegrationProviders(params?: { search?: string }) {
  const query = new URLSearchParams();
  if (params?.search) query.set("search", params.search);
  const qs = query.toString();
  const res = await apiFetch(`/external-integrations/providers${qs ? `?${qs}` : ""}`);
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, "Failed to fetch integration providers"));
  }
  if (Array.isArray(body)) return body;
  if (Array.isArray((body as any)?.data)) return (body as any).data;
  if (Array.isArray((body as any)?.items)) return (body as any).items;
  return [];
}

export async function fetchExternalIntegrationMappings(params?: { providerId?: string }) {
  const query = new URLSearchParams();
  if (params?.providerId) query.set("providerId", params.providerId);
  const qs = query.toString();
  const res = await apiFetch(`/external-integrations/mappings${qs ? `?${qs}` : ""}`);
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, "Failed to fetch integration mappings"));
  }
  if (Array.isArray(body)) return body;
  if (Array.isArray((body as any)?.data)) return (body as any).data;
  if (Array.isArray((body as any)?.items)) return (body as any).items;
  return [];
}

export async function fetchExternalIntegrationSyncJobs(params?: {
  status?: string;
  providerId?: string;
}) {
  const query = new URLSearchParams();
  if (params?.status) query.set("status", params.status);
  if (params?.providerId) query.set("providerId", params.providerId);
  const qs = query.toString();
  const res = await apiFetch(`/external-integrations/sync-jobs${qs ? `?${qs}` : ""}`);
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, "Failed to fetch external sync jobs"));
  }
  if (Array.isArray(body)) return body;
  if (Array.isArray((body as any)?.data)) return (body as any).data;
  if (Array.isArray((body as any)?.items)) return (body as any).items;
  return [];
}

export async function fetchExternalIntegrationWebhookEvents(params?: {
  status?: string;
  provider?: string;
  eventType?: string;
}) {
  const query = new URLSearchParams();
  if (params?.status) query.set("status", params.status);
  if (params?.provider) query.set("provider", params.provider);
  if (params?.eventType) query.set("eventType", params.eventType);
  const qs = query.toString();
  const res = await apiFetch(`/external-integrations/webhook-events${qs ? `?${qs}` : ""}`);
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, "Failed to fetch webhook events"));
  }
  if (Array.isArray(body)) return body;
  if (Array.isArray((body as any)?.data)) return (body as any).data;
  if (Array.isArray((body as any)?.items)) return (body as any).items;
  return [];
}

export async function fetchExternalIntegrationLogs(params?: {
  status?: string;
  endpointSearch?: string;
}) {
  const query = new URLSearchParams();
  if (params?.status) query.set("status", params.status);
  if (params?.endpointSearch) query.set("endpointSearch", params.endpointSearch);
  const qs = query.toString();
  const res = await apiFetch(`/external-integrations/logs${qs ? `?${qs}` : ""}`);
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, "Failed to fetch integration logs"));
  }
  if (Array.isArray(body)) return body;
  if (Array.isArray((body as any)?.data)) return (body as any).data;
  if (Array.isArray((body as any)?.items)) return (body as any).items;
  return [];
}

export async function fetchTelemedicineDashboard() {
  const res = await apiFetch("/telemedicine/dashboard");
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, "Failed to fetch telemedicine dashboard"));
  }
  return (body as any)?.data ?? body;
}

export async function fetchTelemedicineSessions(params?: {
  status?: string;
  sessionType?: string;
}) {
  const query = new URLSearchParams();
  if (params?.status) query.set("status", params.status);
  if (params?.sessionType) query.set("sessionType", params.sessionType);
  const qs = query.toString();
  const res = await apiFetch(`/telemedicine/sessions${qs ? `?${qs}` : ""}`);
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, "Failed to fetch telemedicine sessions"));
  }
  if (Array.isArray(body)) return body;
  if (Array.isArray((body as any)?.data)) return (body as any).data;
  if (Array.isArray((body as any)?.items)) return (body as any).items;
  return [];
}

export async function createEmergencyCase(payload: {
  patientId?: string;
  patientName?: string;
  temporaryId?: string;
  arrivalMode?: string;
  arrivalTime?: string;
  estimatedAge?: number | string;
  gender?: string;
  chiefComplaint?: string;
  traumaMechanism?: string;
  guardianName?: string;
  guardianContact?: string;
  assignedDoctorId?: string;
  bedLocation?: string;
  legalNotes?: string;
}) {
  const res = await apiFetch('/emergency/case', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to create emergency case'));
  }
  return (body as any)?.data ?? body;
}

export async function fetchEmergencyCases(params?: {
  status?: string;
  triageLevel?: string;
  search?: string;
  limit?: number;
}) {
  const query = new URLSearchParams();
  if (params?.status) query.set('status', params.status);
  if (params?.triageLevel) query.set('triageLevel', params.triageLevel);
  if (params?.search) query.set('search', params.search);
  if (params?.limit) query.set('limit', String(params.limit));
  const qs = query.toString();
  const res = await apiFetch(`/emergency/cases${qs ? `?${qs}` : ''}`);
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to fetch emergency cases'));
  }
  if (Array.isArray(body)) return body;
  if (Array.isArray((body as any)?.data)) return (body as any).data;
  if (Array.isArray((body as any)?.items)) return (body as any).items;
  return [];
}

export async function fetchEmergencyBoard(params?: {
  search?: string;
  limit?: number;
}) {
  const query = new URLSearchParams();
  if (params?.search) query.set('search', params.search);
  if (params?.limit) query.set('limit', String(params.limit));
  const qs = query.toString();
  const res = await apiFetch(`/emergency/board${qs ? `?${qs}` : ''}`);
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to fetch emergency board'));
  }
  if (Array.isArray(body)) return body;
  if (Array.isArray((body as any)?.data)) return (body as any).data;
  if (Array.isArray((body as any)?.items)) return (body as any).items;
  return [];
}

export async function fetchEmergencyDashboard() {
  const res = await apiFetch('/emergency/dashboard');
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to fetch emergency dashboard'));
  }
  return (body as any)?.data ?? body;
}

export async function fetchEmergencyCaseTimeline(id: string) {
  const res = await apiFetch(`/emergency/case/${encodeURIComponent(id)}/timeline`);
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to fetch emergency case timeline'));
  }
  return (body as any)?.data ?? body;
}

export async function createEmergencyTriage(
  emergencyId: string,
  payload: {
    triageLevel?: string;
    gcs?: number | string;
    painScale?: number | string;
    oxygenSaturation?: number | string;
    bloodPressure?: string;
    bpSystolic?: number | string;
    bpDiastolic?: number | string;
    pulseRate?: number | string;
    respiratoryRate?: number | string;
    temperature?: number | string;
    notes?: string;
    assignedDoctorId?: string;
  },
) {
  const res = await apiFetch(`/emergency/case/${encodeURIComponent(emergencyId)}/triage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to save emergency triage'));
  }
  return (body as any)?.data ?? body;
}

export async function addEmergencyClinicalNote(
  emergencyId: string,
  payload: Record<string, unknown>,
) {
  const res = await apiFetch(`/emergency/case/${encodeURIComponent(emergencyId)}/clinical-note`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to save emergency clinical notes'));
  }
  return (body as any)?.data ?? body;
}

export async function addEmergencyProcedure(
  emergencyId: string,
  payload: Record<string, unknown>,
) {
  const res = await apiFetch(`/emergency/case/${encodeURIComponent(emergencyId)}/procedure`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to save emergency procedure'));
  }
  return (body as any)?.data ?? body;
}

export async function addEmergencyMedication(
  emergencyId: string,
  payload: Record<string, unknown>,
) {
  const res = await apiFetch(`/emergency/case/${encodeURIComponent(emergencyId)}/medication`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to save emergency medication'));
  }
  return (body as any)?.data ?? body;
}

export async function addEmergencyDisposition(
  emergencyId: string,
  payload: Record<string, unknown>,
) {
  const res = await apiFetch(`/emergency/case/${encodeURIComponent(emergencyId)}/disposition`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to save emergency disposition'));
  }
  return (body as any)?.data ?? body;
}

export async function createMassCasualtyEvent(payload: Record<string, unknown>) {
  const res = await apiFetch('/emergency/mass-casualty', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to create mass-casualty event'));
  }
  return (body as any)?.data ?? body;
}

export async function fetchMassCasualtyEvents(limit = 100) {
  const res = await apiFetch(`/emergency/mass-casualty?limit=${encodeURIComponent(String(limit))}`);
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to fetch mass-casualty events'));
  }
  if (Array.isArray(body)) return body;
  if (Array.isArray((body as any)?.data)) return (body as any).data;
  if (Array.isArray((body as any)?.items)) return (body as any).items;
  return [];
}

export async function fetchIcuDashboard() {
  const res = await apiFetch('/icu/dashboard');
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to fetch ICU dashboard'));
  }
  return (body as any)?.data ?? body;
}

export async function fetchIcuAdmissions(params?: {
  search?: string;
  status?: string;
}) {
  const query = new URLSearchParams();
  if (params?.search) query.set('search', params.search);
  if (params?.status) query.set('status', params.status);
  const qs = query.toString();
  const res = await apiFetch(`/icu/admissions${qs ? `?${qs}` : ''}`);
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to fetch ICU admissions'));
  }
  if (Array.isArray(body)) return body;
  if (Array.isArray((body as any)?.data)) return (body as any).data;
  if (Array.isArray((body as any)?.items)) return (body as any).items;
  return [];
}

export async function fetchIcuAlerts(icuAdmissionId?: string, limit = 500) {
  const query = new URLSearchParams();
  query.set('limit', String(limit));
  if (icuAdmissionId) query.set('icuAdmissionId', icuAdmissionId);
  const res = await apiFetch(`/icu/alerts?${query.toString()}`);
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to fetch ICU alerts'));
  }
  if (Array.isArray(body)) return body;
  if (Array.isArray((body as any)?.data)) return (body as any).data;
  if (Array.isArray((body as any)?.items)) return (body as any).items;
  return [];
}

export async function fetchIcuTimeline(icuAdmissionId: string) {
  const res = await apiFetch(`/icu/timeline/${encodeURIComponent(icuAdmissionId)}`);
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to fetch ICU timeline'));
  }
  return (body as any)?.data ?? body;
}

export async function fetchMaternityDashboard() {
  const res = await apiFetch("/maternity/dashboard");
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, "Failed to fetch maternity dashboard"));
  }
  return (body as any)?.data ?? body;
}

export async function fetchMaternityPregnancies(params?: {
  search?: string;
  riskLevel?: string;
  status?: string;
}) {
  const query = new URLSearchParams();
  if (params?.search) query.set("search", params.search);
  if (params?.riskLevel) query.set("riskLevel", params.riskLevel);
  if (params?.status) query.set("status", params.status);
  const qs = query.toString();
  const res = await apiFetch(`/maternity/pregnancies${qs ? `?${qs}` : ""}`);
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, "Failed to fetch maternity pregnancies"));
  }
  if (Array.isArray(body)) return body;
  if (Array.isArray((body as any)?.data)) return (body as any).data;
  if (Array.isArray((body as any)?.items)) return (body as any).items;
  return [];
}

export async function fetchMaternityAncVisits(pregnancyId?: string) {
  const qs = pregnancyId ? `?pregnancyId=${encodeURIComponent(pregnancyId)}` : "";
  const res = await apiFetch(`/maternity/anc-visits${qs}`);
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, "Failed to fetch ANC visits"));
  }
  if (Array.isArray(body)) return body;
  if (Array.isArray((body as any)?.data)) return (body as any).data;
  if (Array.isArray((body as any)?.items)) return (body as any).items;
  return [];
}

export async function fetchMaternityLaborRecords(pregnancyId?: string) {
  const qs = pregnancyId ? `?pregnancyId=${encodeURIComponent(pregnancyId)}` : "";
  const res = await apiFetch(`/maternity/labor-records${qs}`);
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, "Failed to fetch labor records"));
  }
  if (Array.isArray(body)) return body;
  if (Array.isArray((body as any)?.data)) return (body as any).data;
  if (Array.isArray((body as any)?.items)) return (body as any).items;
  return [];
}

export async function fetchMaternityDeliveries(pregnancyId?: string) {
  const qs = pregnancyId ? `?pregnancyId=${encodeURIComponent(pregnancyId)}` : "";
  const res = await apiFetch(`/maternity/deliveries${qs}`);
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, "Failed to fetch maternity deliveries"));
  }
  if (Array.isArray(body)) return body;
  if (Array.isArray((body as any)?.data)) return (body as any).data;
  if (Array.isArray((body as any)?.items)) return (body as any).items;
  return [];
}

export async function fetchMaternityPostnatalRecords(pregnancyId?: string) {
  const qs = pregnancyId ? `?pregnancyId=${encodeURIComponent(pregnancyId)}` : "";
  const res = await apiFetch(`/maternity/postnatal-records${qs}`);
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, "Failed to fetch postnatal records"));
  }
  if (Array.isArray(body)) return body;
  if (Array.isArray((body as any)?.data)) return (body as any).data;
  if (Array.isArray((body as any)?.items)) return (body as any).items;
  return [];
}

export async function fetchMaternityComplications(pregnancyId?: string) {
  const qs = pregnancyId ? `?pregnancyId=${encodeURIComponent(pregnancyId)}` : "";
  const res = await apiFetch(`/maternity/complications${qs}`);
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, "Failed to fetch maternity complications"));
  }
  if (Array.isArray(body)) return body;
  if (Array.isArray((body as any)?.data)) return (body as any).data;
  if (Array.isArray((body as any)?.items)) return (body as any).items;
  return [];
}

export async function fetchMedicalDirectorDashboard() {
  const res = await apiFetch("/medical-director/dashboard");
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, "Failed to fetch medical director dashboard"));
  }
  return (body as any)?.data ?? body;
}

export async function fetchMedicalDirectorDoctorProfiles(params?: {
  search?: string;
  status?: string;
}) {
  const query = new URLSearchParams();
  if (params?.search) query.set("search", params.search);
  if (params?.status) query.set("status", params.status);
  const qs = query.toString();
  const res = await apiFetch(`/medical-director/doctor-profiles${qs ? `?${qs}` : ""}`);
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, "Failed to fetch doctor profiles"));
  }
  if (Array.isArray(body)) return body;
  if (Array.isArray((body as any)?.data)) return (body as any).data;
  if (Array.isArray((body as any)?.items)) return (body as any).items;
  return [];
}

export async function fetchMedicalDirectorClinicalProtocols(params?: {
  status?: string;
  category?: string;
}) {
  const query = new URLSearchParams();
  if (params?.status) query.set("status", params.status);
  if (params?.category) query.set("category", params.category);
  const qs = query.toString();
  const res = await apiFetch(`/medical-director/clinical-protocols${qs ? `?${qs}` : ""}`);
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, "Failed to fetch clinical protocols"));
  }
  if (Array.isArray(body)) return body;
  if (Array.isArray((body as any)?.data)) return (body as any).data;
  if (Array.isArray((body as any)?.items)) return (body as any).items;
  return [];
}

export async function fetchMedicalDirectorMortalityReviews(params?: {
  reviewStatus?: string;
}) {
  const query = new URLSearchParams();
  if (params?.reviewStatus) query.set("reviewStatus", params.reviewStatus);
  const qs = query.toString();
  const res = await apiFetch(`/medical-director/mortality-reviews${qs ? `?${qs}` : ""}`);
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, "Failed to fetch mortality reviews"));
  }
  if (Array.isArray(body)) return body;
  if (Array.isArray((body as any)?.data)) return (body as any).data;
  if (Array.isArray((body as any)?.items)) return (body as any).items;
  return [];
}

export async function fetchMedicalDirectorClinicalRiskAlerts(params?: {
  status?: string;
  severity?: string;
}) {
  const query = new URLSearchParams();
  if (params?.status) query.set("status", params.status);
  if (params?.severity) query.set("severity", params.severity);
  const qs = query.toString();
  const res = await apiFetch(`/medical-director/clinical-risk-alerts${qs ? `?${qs}` : ""}`);
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, "Failed to fetch clinical risk alerts"));
  }
  if (Array.isArray(body)) return body;
  if (Array.isArray((body as any)?.data)) return (body as any).data;
  if (Array.isArray((body as any)?.items)) return (body as any).items;
  return [];
}

export async function fetchMedicalDirectorDoctorPerformanceScores(limit = 100) {
  const qs = `?limit=${encodeURIComponent(String(limit))}`;
  const res = await apiFetch(`/medical-director/doctor-performance-scores${qs}`);
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, "Failed to fetch doctor performance scores"));
  }
  if (Array.isArray(body)) return body;
  if (Array.isArray((body as any)?.data)) return (body as any).data;
  if (Array.isArray((body as any)?.items)) return (body as any).items;
  return [];
}

export async function fetchRevenueCycleDashboard() {
  const res = await apiFetch('/revenue-cycle/dashboard');
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to fetch revenue cycle dashboard'));
  }
  return (body as any)?.data ?? body;
}

export async function fetchRevenueCycleClaims(params?: {
  status?: string;
  search?: string;
}) {
  const query = new URLSearchParams();
  if (params?.status) query.set('status', params.status);
  if (params?.search) query.set('search', params.search);
  const qs = query.toString();
  const res = await apiFetch(`/revenue-cycle/claims${qs ? `?${qs}` : ''}`);
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to fetch revenue cycle claims'));
  }
  if (Array.isArray(body)) return body;
  if (Array.isArray((body as any)?.data)) return (body as any).data;
  if (Array.isArray((body as any)?.items)) return (body as any).items;
  return [];
}

export async function fetchRevenueCycleCapturedCharges(params?: {
  patientId?: string;
  visitId?: string;
  chargeStatus?: string;
}) {
  const query = new URLSearchParams();
  if (params?.patientId) query.set('patientId', params.patientId);
  if (params?.visitId) query.set('visitId', params.visitId);
  if (params?.chargeStatus) query.set('chargeStatus', params.chargeStatus);
  const qs = query.toString();
  const res = await apiFetch(`/revenue-cycle/captured-charges${qs ? `?${qs}` : ''}`);
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to fetch captured charges'));
  }
  if (Array.isArray(body)) return body;
  if (Array.isArray((body as any)?.data)) return (body as any).data;
  if (Array.isArray((body as any)?.items)) return (body as any).items;
  return [];
}

export async function fetchCostAccountingDashboard(params?: {
  fromDate?: string;
  toDate?: string;
}) {
  const query = new URLSearchParams();
  if (params?.fromDate) query.set('fromDate', params.fromDate);
  if (params?.toDate) query.set('toDate', params.toDate);
  const qs = query.toString();
  const res = await apiFetch(`/cost-accounting/dashboard${qs ? `?${qs}` : ''}`);
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to fetch cost accounting dashboard'));
  }
  return (body as any)?.data ?? body;
}

export async function fetchCostAccountingDepartmentProfitability(params?: {
  fromDate?: string;
  toDate?: string;
  departmentId?: string;
}) {
  const query = new URLSearchParams();
  if (params?.fromDate) query.set('fromDate', params.fromDate);
  if (params?.toDate) query.set('toDate', params.toDate);
  if (params?.departmentId) query.set('departmentId', params.departmentId);
  const qs = query.toString();
  const res = await apiFetch(`/cost-accounting/department-profitability${qs ? `?${qs}` : ''}`);
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to fetch department profitability'));
  }
  if (Array.isArray(body)) return body;
  if (Array.isArray((body as any)?.data)) return (body as any).data;
  if (Array.isArray((body as any)?.items)) return (body as any).items;
  return [];
}

export async function fetchStrategicPlanningDashboard(params?: {
  fromDate?: string;
  toDate?: string;
}) {
  const query = new URLSearchParams();
  if (params?.fromDate) query.set("fromDate", params.fromDate);
  if (params?.toDate) query.set("toDate", params.toDate);
  const qs = query.toString();
  const res = await apiFetch(`/strategic-planning/dashboard${qs ? `?${qs}` : ""}`);
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, "Failed to fetch strategic planning dashboard"));
  }
  return (body as any)?.data ?? body;
}

export async function fetchStrategicKpiDefinitions(params?: {
  status?: string;
  domain?: string;
  search?: string;
  limit?: number;
}) {
  const query = new URLSearchParams();
  if (params?.status) query.set("status", params.status);
  if (params?.domain) query.set("domain", params.domain);
  if (params?.search) query.set("search", params.search);
  if (typeof params?.limit === "number") query.set("limit", String(params.limit));
  const qs = query.toString();
  const res = await apiFetch(`/strategic-planning/kpi-definitions${qs ? `?${qs}` : ""}`);
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, "Failed to fetch strategic KPI definitions"));
  }
  if (Array.isArray(body)) return body;
  if (Array.isArray((body as any)?.data)) return (body as any).data;
  if (Array.isArray((body as any)?.items)) return (body as any).items;
  return [];
}

export async function fetchStrategicKpiTargets(params?: {
  status?: string;
  kpiDefinitionId?: string;
  fromDate?: string;
  toDate?: string;
  limit?: number;
}) {
  const query = new URLSearchParams();
  if (params?.status) query.set("status", params.status);
  if (params?.kpiDefinitionId) query.set("kpiDefinitionId", params.kpiDefinitionId);
  if (params?.fromDate) query.set("fromDate", params.fromDate);
  if (params?.toDate) query.set("toDate", params.toDate);
  if (typeof params?.limit === "number") query.set("limit", String(params.limit));
  const qs = query.toString();
  const res = await apiFetch(`/strategic-planning/kpi-targets${qs ? `?${qs}` : ""}`);
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, "Failed to fetch strategic KPI targets"));
  }
  if (Array.isArray(body)) return body;
  if (Array.isArray((body as any)?.data)) return (body as any).data;
  if (Array.isArray((body as any)?.items)) return (body as any).items;
  return [];
}

export async function fetchStrategicFacilityRankings(params?: {
  metricKey?: string;
  limit?: number;
}) {
  const query = new URLSearchParams();
  if (params?.metricKey) query.set("metricKey", params.metricKey);
  if (typeof params?.limit === "number") query.set("limit", String(params.limit));
  const qs = query.toString();
  const res = await apiFetch(`/strategic-planning/facility-rankings${qs ? `?${qs}` : ""}`);
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, "Failed to fetch strategic facility rankings"));
  }
  if (Array.isArray(body)) return body;
  if (Array.isArray((body as any)?.data)) return (body as any).data;
  if (Array.isArray((body as any)?.items)) return (body as any).items;
  return [];
}

export async function fetchStrategicRiskAlerts(params?: {
  status?: string;
  severity?: string;
  limit?: number;
}) {
  const query = new URLSearchParams();
  if (params?.status) query.set("status", params.status);
  if (params?.severity) query.set("severity", params.severity);
  if (typeof params?.limit === "number") query.set("limit", String(params.limit));
  const qs = query.toString();
  const res = await apiFetch(`/strategic-planning/risk-alerts${qs ? `?${qs}` : ""}`);
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, "Failed to fetch strategic risk alerts"));
  }
  if (Array.isArray(body)) return body;
  if (Array.isArray((body as any)?.data)) return (body as any).data;
  if (Array.isArray((body as any)?.items)) return (body as any).items;
  return [];
}

export async function fetchStrategicGoals(params?: {
  status?: string;
  domain?: string;
  limit?: number;
}) {
  const query = new URLSearchParams();
  if (params?.status) query.set("status", params.status);
  if (params?.domain) query.set("domain", params.domain);
  if (typeof params?.limit === "number") query.set("limit", String(params.limit));
  const qs = query.toString();
  const res = await apiFetch(`/strategic-planning/strategic-goals${qs ? `?${qs}` : ""}`);
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, "Failed to fetch strategic goals"));
  }
  if (Array.isArray(body)) return body;
  if (Array.isArray((body as any)?.data)) return (body as any).data;
  if (Array.isArray((body as any)?.items)) return (body as any).items;
  return [];
}

export async function fetchStrategicForecastingModels(params?: {
  status?: string;
  metricKey?: string;
  limit?: number;
}) {
  const query = new URLSearchParams();
  if (params?.status) query.set("status", params.status);
  if (params?.metricKey) query.set("metricKey", params.metricKey);
  if (typeof params?.limit === "number") query.set("limit", String(params.limit));
  const qs = query.toString();
  const res = await apiFetch(`/strategic-planning/forecasting-models${qs ? `?${qs}` : ""}`);
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, "Failed to fetch strategic forecasting models"));
  }
  if (Array.isArray(body)) return body;
  if (Array.isArray((body as any)?.data)) return (body as any).data;
  if (Array.isArray((body as any)?.items)) return (body as any).items;
  return [];
}

export async function fetchStrategicScenarioSimulations(params?: {
  status?: string;
  limit?: number;
}) {
  const query = new URLSearchParams();
  if (params?.status) query.set("status", params.status);
  if (typeof params?.limit === "number") query.set("limit", String(params.limit));
  const qs = query.toString();
  const res = await apiFetch(`/strategic-planning/scenario-simulations${qs ? `?${qs}` : ""}`);
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, "Failed to fetch strategic scenario simulations"));
  }
  if (Array.isArray(body)) return body;
  if (Array.isArray((body as any)?.data)) return (body as any).data;
  if (Array.isArray((body as any)?.items)) return (body as any).items;
  return [];
}

export async function fetchOrchestrationOwnershipRules() {
  const res = await apiFetch("/orchestration/ownership-rules");
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, "Failed to fetch orchestration ownership rules"));
  }
  return ((body as any)?.data ?? body ?? {}) as Record<string, string>;
}

export async function fetchOrchestrationEvents(params?: {
  facilityId?: string;
  eventType?: string;
  status?: string;
  limit?: number;
}) {
  const query = new URLSearchParams();
  if (params?.facilityId) query.set("facilityId", params.facilityId);
  if (params?.eventType) query.set("eventType", params.eventType);
  if (params?.status) query.set("status", params.status);
  if (typeof params?.limit === "number") query.set("limit", String(params.limit));
  const qs = query.toString();
  const res = await apiFetch(`/orchestration/events${qs ? `?${qs}` : ""}`);
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, "Failed to fetch orchestration events"));
  }
  if (Array.isArray(body)) return body;
  if (Array.isArray((body as any)?.data)) return (body as any).data;
  if (Array.isArray((body as any)?.items)) return (body as any).items;
  return [];
}

export async function processOrchestrationPending(input: {
  facilityId?: string;
  limit?: number;
}) {
  const res = await apiFetch("/orchestration/process-pending", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input || {}),
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, "Failed to process orchestration pending events"));
  }
  return (body as any)?.data ?? body;
}

export async function fetchStrategicExecutiveNotes(params?: {
  status?: string;
  noteType?: string;
  priority?: string;
  limit?: number;
}) {
  const query = new URLSearchParams();
  if (params?.status) query.set("status", params.status);
  if (params?.noteType) query.set("noteType", params.noteType);
  if (params?.priority) query.set("priority", params.priority);
  if (typeof params?.limit === "number") query.set("limit", String(params.limit));
  const qs = query.toString();
  const res = await apiFetch(`/strategic-planning/executive-notes${qs ? `?${qs}` : ""}`);
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, "Failed to fetch strategic executive notes"));
  }
  if (Array.isArray(body)) return body;
  if (Array.isArray((body as any)?.data)) return (body as any).data;
  if (Array.isArray((body as any)?.items)) return (body as any).items;
  return [];
}

export async function fetchReportingAnalytics(eventName?: string) {
  const qs = eventName ? `?eventName=${encodeURIComponent(eventName)}` : "";
  const res = await apiFetch(`/reporting/analytics${qs}`);
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, "Failed to fetch analytics logs"));
  }
  if (Array.isArray(body)) return body;
  if (Array.isArray((body as any)?.data)) return (body as any).data;
  if (Array.isArray((body as any)?.items)) return (body as any).items;
  return [];
}

export type ReportingFilters = {
  facilityId?: string;
  fromDate?: string;
  toDate?: string;
  departmentId?: string;
  doctorId?: string;
};

function toReportingQuery(params?: Record<string, unknown>) {
  const query = new URLSearchParams();
  if (!params) return "";
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    const normalized = String(value).trim();
    if (!normalized) return;
    query.set(key, normalized);
  });
  const qs = query.toString();
  return qs ? `?${qs}` : "";
}

export async function fetchReportingDashboard(filters?: ReportingFilters) {
  const qs = toReportingQuery(filters);
  const res = await apiFetch(`/reporting/dashboard${qs}`);
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, "Failed to fetch reporting dashboard"));
  }
  return body;
}

export async function fetchReportingTrends(
  filters?: ReportingFilters & { bucket?: "day" | "week" },
) {
  const qs = toReportingQuery(filters);
  const res = await apiFetch(`/reporting/trends${qs}`);
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, "Failed to fetch reporting trends"));
  }
  return body;
}

export async function fetchReportingDrilldown(
  filters?: ReportingFilters & { metric?: "visits" | "revenue"; groupBy?: "facility" | "department" | "doctor" },
) {
  const qs = toReportingQuery(filters);
  const res = await apiFetch(`/reporting/drilldown${qs}`);
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, "Failed to fetch reporting drilldown"));
  }
  return body;
}

export async function exportReportingDataset(
  filters?: ReportingFilters & {
    reportType?: "clinical" | "financial" | "pharmacy" | "hr" | "mortuary" | "inventory" | "regulatory";
    format?: "csv" | "json";
  },
) {
  const qs = toReportingQuery(filters);
  const res = await apiFetch(`/reporting/export${qs}`);
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, "Failed to export reporting dataset"));
  }
  return body;
}

export type AiScope = "clinical" | "financial" | "operational" | "pharmacy";

export type AiFilters = {
  scope?: AiScope;
  fromDate?: string;
  toDate?: string;
  minConfidence?: number | string;
  riskLevel?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | "ALL";
  insightType?: string;
  predictionType?: string;
  limit?: number;
};

export type MedilinkAiAssistContext = {
  userRole?: string;
  module?: string;
  screen?: string;
  facilityId?: string;
  departmentId?: string;
  error?: string;
};

export type MedilinkAiAssistMessage = {
  role: "assistant" | "user";
  content: string;
};

export type MedilinkAiAssistPayload = {
  facilityId?: string;
  systemPrompt: string;
  context: MedilinkAiAssistContext;
  chatHistory: MedilinkAiAssistMessage[];
  question: string;
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
};

export async function fetchAiModels() {
  const res = await apiFetch("/ai-suite/models");
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, "Failed to fetch AI models"));
  }
  return (body as any)?.data ?? body;
}

export async function fetchAiDashboard(filters?: AiFilters) {
  const qs = toReportingQuery(filters as Record<string, unknown>);
  const res = await apiFetch(`/ai-suite/dashboard${qs}`);
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, "Failed to fetch AI dashboard"));
  }
  return (body as any)?.data ?? body;
}

export async function fetchAiInsights(filters?: AiFilters) {
  const qs = toReportingQuery(filters as Record<string, unknown>);
  const res = await apiFetch(`/ai-suite/insights${qs}`);
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, "Failed to fetch AI insights"));
  }
  const payload = (body as any)?.data ?? body;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray((payload as any)?.items)) return (payload as any).items;
  return [];
}

export async function fetchAiPredictions(filters?: AiFilters) {
  const qs = toReportingQuery(filters as Record<string, unknown>);
  const res = await apiFetch(`/ai-suite/predictions${qs}`);
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, "Failed to fetch AI predictions"));
  }
  const payload = (body as any)?.data ?? body;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray((payload as any)?.items)) return (payload as any).items;
  return [];
}

export async function fetchAiAlerts(filters?: AiFilters) {
  const qs = toReportingQuery(filters as Record<string, unknown>);
  const res = await apiFetch(`/ai-suite/alerts${qs}`);
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, "Failed to fetch AI alerts"));
  }
  const payload = (body as any)?.data ?? body;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray((payload as any)?.items)) return (payload as any).items;
  return [];
}

export async function runAiPipeline(payload: {
  scope?: AiScope;
  insightType?: string;
  modelKey?: string;
  notes?: string;
}) {
  const res = await apiFetch("/ai-suite/run", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, "Failed to run AI pipeline"));
  }
  return (body as any)?.data ?? body;
}

export async function createAiOverride(payload: {
  insightId?: string;
  predictionId?: string;
  reason: string;
  action?: string;
}) {
  const res = await apiFetch("/ai-suite/override", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, "Failed to save AI override"));
  }
  return (body as any)?.data ?? body;
}

export async function generateMedilinkAiReply(payload: MedilinkAiAssistPayload) {
  const res = await apiFetch("/ai-suite/assist", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, "Failed to generate AI response"));
  }
  const data = (body as any)?.data ?? body;
  return {
    reply: String((data as any)?.reply || "").trim(),
    model: String((data as any)?.model || ""),
    provider: String((data as any)?.provider || ""),
  };
}

export async function fetchEmrOverview(filters?: {
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  minPaid?: string | number;
  maxPaid?: string | number;
  ward?: string;
  gender?: string;
  status?: string;
  billing?: string;
}) {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      const normalized = String(value).trim();
      if (!normalized || normalized.toUpperCase() === "ALL") return;
      params.set(key, normalized);
    });
  }

  const query = params.toString();
  const res = await apiFetch(`/medical-records/emr-overview${query ? `?${query}` : ""}`);
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, "Failed to fetch EMR overview"));
  }
  return body;
}

export async function fetchEmrPatientSummary(patientId: string) {
  const id = String(patientId || "").trim();
  if (!id) {
    throw new Error("Patient ID is required for EMR summary.");
  }
  const res = await apiFetch(`/medical-records/patient/${encodeURIComponent(id)}/summary`);
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, "Failed to fetch EMR patient summary"));
  }
  return (body as any)?.data ?? body;
}

export async function fetchEmrPatientTimeline(patientId: string) {
  const id = String(patientId || "").trim();
  if (!id) {
    throw new Error("Patient ID is required for EMR timeline.");
  }
  const res = await apiFetch(`/medical-records/patient/${encodeURIComponent(id)}/timeline`);
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, "Failed to fetch EMR timeline"));
  }
  return (body as any)?.data ?? body;
}

export async function fetchEmrVisitVersions(visitId: string) {
  const id = String(visitId || "").trim();
  if (!id) {
    throw new Error("Visit ID is required for EMR versions.");
  }
  const res = await apiFetch(`/medical-records/visit/${encodeURIComponent(id)}/versions`);
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, "Failed to fetch EMR visit versions"));
  }
  return (body as any)?.data ?? body;
}

export async function finalizeEmrVisit(visitId: string, payload?: { reason?: string; notes?: string }) {
  const id = String(visitId || "").trim();
  if (!id) {
    throw new Error("Visit ID is required to finalize EMR.");
  }
  const res = await apiFetch(`/medical-records/finalize/${encodeURIComponent(id)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload || {}),
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, "Failed to finalize EMR visit"));
  }
  return (body as any)?.data ?? body;
}

export async function createTenantPatient(payload: BackendPatientInput) {
  let res = await apiFetch("/tenant/patients", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    // fallback for non-tenant backend mode
    res = await apiFetch("/patients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  }
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, "Failed to create patient"));
  }
  return body;
}

export async function updateTenantPatient(id: string, payload: Partial<BackendPatientInput>) {
  let res = await apiFetch(`/tenant/patients/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    res = await apiFetch(`/patients/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  }
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, "Failed to update patient"));
  }
  return body;
}

export type TenantRole = {
  id: string;
  name: string;
  permissions: string[];
};

export type TenantUser = {
  id: string;
  email: string;
  status: string;
  roleId: string;
  role?: TenantRole;
  createdAt?: string;
};

export async function fetchTenantRoles() {
  const res = await apiFetch('/role-tenants');
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to fetch roles'));
  }
  return Array.isArray(body) ? body : [];
}

export async function createTenantRole(payload: { name: string; permissions: string[] }) {
  const res = await apiFetch('/role-tenants', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to create role'));
  }
  return body;
}

export async function updateTenantRolePermissions(id: string, permissions: string[]) {
  const res = await apiFetch(`/role-tenants/${id}/permissions`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ permissions }),
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to update role permissions'));
  }
  return body;
}

export async function deleteTenantRole(id: string) {
  const res = await apiFetch(`/role-tenants/${id}`, { method: 'DELETE' });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to delete role'));
  }
  return body;
}

export async function fetchTenantUsers() {
  const res = await apiFetch('/tenant-users');
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to fetch users'));
  }
  return Array.isArray(body) ? body : [];
}

export async function createTenantUser(payload: {
  email: string;
  password?: string;
  roleId?: string;
  roleName?: string;
}) {
  const res = await apiFetch('/tenant-users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to create user'));
  }
  return body;
}

export async function updateTenantUserStatus(id: string, status: string) {
  const res = await apiFetch(`/tenant-users/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to update user status'));
  }
  return body;
}

export async function updateTenantUserRole(id: string, payload: { roleId?: string; roleName?: string }) {
  const res = await apiFetch(`/tenant-users/${id}/role`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to update user role'));
  }
  return body;
}

export async function resetTenantUserPassword(id: string, password?: string) {
  const res = await apiFetch(`/tenant-users/${id}/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to reset user password'));
  }
  return body;
}

export async function deleteTenantUser(id: string) {
  const res = await apiFetch(`/tenant-users/${id}`, {
    method: 'DELETE',
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to delete user'));
  }
  return body;
}

export async function fetchSecurityPosture() {
  const res = await apiFetch('/security/posture');
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to fetch security posture'));
  }
  return (body as any)?.data ?? body;
}

export async function fetchSecurityDashboard() {
  const res = await apiFetch('/security/dashboard');
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to fetch security dashboard'));
  }
  return (body as any)?.data ?? body;
}

export async function fetchSecurityPasswordPolicy() {
  const res = await apiFetch('/security/password-policy');
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to fetch password policy'));
  }
  return (body as any)?.data ?? body;
}

export async function fetchSecurityPermissionsCatalog() {
  const res = await apiFetch('/security/permissions');
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to fetch permission catalog'));
  }
  if (Array.isArray(body)) return body;
  if (Array.isArray((body as any)?.data)) return (body as any).data;
  if (Array.isArray((body as any)?.items)) return (body as any).items;
  return [];
}

export async function fetchSecurityRbacCatalog() {
  const res = await apiFetch('/security/rbac/catalog');
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to fetch RBAC catalog'));
  }
  return (body as any)?.data ?? body;
}

export async function bootstrapSecurityRbac(payload?: {
  overwrite?: boolean;
  roleNames?: string[];
  facilityId?: string;
}) {
  const res = await apiFetch('/security/rbac/bootstrap', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload || {}),
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to bootstrap RBAC templates'));
  }
  return (body as any)?.data ?? body;
}

export async function fetchSecurityMyAccess() {
  const res = await apiFetch('/security/access/me');
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to fetch current access profile'));
  }
  return (body as any)?.data ?? body;
}

export type SuperAdminOverview = {
  facilities: {
    total: number;
    active: number;
    pending: number;
    suspended: number;
    registeredThisMonth: number;
  };
  subscriptions: {
    byPlan: Array<{ plan: string; count: number }>;
    activeNonFree: number;
    expiringIn30Days: number;
    expired: number;
  };
  support: {
    total: number;
    open: number;
    pending: number;
    resolved: number;
    highPriorityOpen: number;
  };
  finance: {
    totalPayments: number;
    paymentCount: number;
    paymentsLast30Days: number;
    paymentCountLast30Days: number;
  };
  recentFacilities: Array<{
    id: string;
    name: string;
    code: string;
    status: string;
    subscriptionPlan: string;
    subscriptionEndDate?: string | null;
    createdAt: string;
  }>;
};

export type SuperAdminSupportRequest = {
  id: string;
  facilityId: string;
  facilityName: string;
  facilityCode: string;
  raisedBy: string;
  subject: string;
  priority: string;
  status: string;
  createdAt: string;
  latestIssueMessage?: string | null;
};

export type SubscriptionPricing = {
  perModuleMonthly: number;
  halfSuiteMonthly: number;
  fullSuiteMonthly: number;
  dailyMultiplier: number;
  quarterlyDiscountPercent: number;
  semiAnnualDiscountPercent: number;
  yearlyDiscountPercent: number;
};

export async function fetchSuperAdminOverview(): Promise<SuperAdminOverview> {
  const res = await apiFetch('/admin/dashboard/overview');
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to fetch super admin overview'));
  }
  return body as SuperAdminOverview;
}

export async function fetchSuperAdminSupportRequests(): Promise<SuperAdminSupportRequest[]> {
  const res = await apiFetch('/admin/dashboard/support-requests');
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to fetch support requests'));
  }
  return Array.isArray(body) ? (body as SuperAdminSupportRequest[]) : [];
}

export async function fetchSubscriptionPricing(): Promise<SubscriptionPricing> {
  const res = await apiFetch('/admin/dashboard/subscription-pricing');
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to fetch subscription pricing'));
  }
  return body as SubscriptionPricing;
}

export async function updateSubscriptionPricing(payload: Partial<SubscriptionPricing>): Promise<SubscriptionPricing> {
  const res = await apiFetch('/admin/dashboard/subscription-pricing', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to update subscription pricing'));
  }
  return body as SubscriptionPricing;
}

export async function updateAdminFacilityStatus(
  facilityId: string,
  status: 'ACTIVE' | 'PENDING' | 'SUSPENDED' | 'INACTIVE',
) {
  const res = await apiFetch(`/admin/dashboard/facilities/${facilityId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to update facility status'));
  }
  return body;
}

export async function updateAdminFacilitySubscription(
  facilityId: string,
  payload: {
    subscriptionPlan: 'FREE' | 'PREMIUM_DAILY' | 'PREMIUM_MONTHLY' | 'PREMIUM_YEARLY';
    subscriptionEndDate?: string | null;
    premiumModulesEnabled?: string[];
  },
) {
  const res = await apiFetch(`/admin/dashboard/facilities/${facilityId}/subscription`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to update facility subscription'));
  }
  return body;
}

export async function updateAdminSupportRequestStatus(
  ticketId: string,
  status: 'OPEN' | 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED',
) {
  const res = await apiFetch(`/admin/dashboard/support-requests/${ticketId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to update support request status'));
  }
  return body;
}

export type SuperAdminPlatformSettings = {
  securityPolicy: Record<string, unknown>;
  globalSettings: Record<string, unknown>;
  integrationSettings: Record<string, unknown>;
};

export type SuperAdminGlobalFeatureFlag = {
  key: string;
  enabled: boolean;
  scope: string;
  config?: Record<string, unknown> | null;
};

export type SuperAdminFacilityControl = {
  facilityId: string;
  facilityName: string;
  facilityCode: string;
  facilityStatus: string;
  aiEnabled: boolean;
  aiDailyLimit: number;
  aiModelRouting: string;
  enabledModuleIds: number[];
};

export type SuperAdminFeatureFlagsPayload = {
  globalFlags?: Array<{
    key: string;
    enabled: boolean;
    scope?: string;
    config?: Record<string, unknown> | null;
  }>;
  facilityControls?: Array<{
    facilityId: string;
    aiEnabled?: boolean;
    aiDailyLimit?: number;
    aiModelRouting?: string;
    enabledModuleIds?: number[];
  }>;
};

export type SuperAdminFeatureFlagsResponse = {
  globalFlags: SuperAdminGlobalFeatureFlag[];
  facilityControls: SuperAdminFacilityControl[];
};

export type SuperAdminAnnouncement = {
  id: string;
  title: string;
  message: string;
  target: string;
  status: string;
  publishedAt: string;
  expiresAt?: string | null;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SuperAdminAuditEvent = {
  id: string;
  action: string;
  tenantId?: string | null;
  userId?: string | null;
  ip?: string | null;
  details?: unknown;
  createdAt: string;
};

export type SuperAdminInfrastructureBackupJob = {
  id: string;
  status: string;
  target?: string | null;
  notes?: string | null;
  startedAt: string;
  completedAt?: string | null;
  durationSeconds?: number | null;
  triggeredBy?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SuperAdminInfrastructureSummary = {
  status: "HEALTHY" | "WARNING" | "DEGRADED";
  uptimePercent: number;
  estimatedStorageGb: number;
  apiErrorRatePercent: number;
  pendingSupportTickets: number;
  serverCpuPercent: number;
  serverMemoryPercent: number;
  backgroundQueueDepth: number;
  measuredAt: string;
};

export type SuperAdminInfrastructureSummaryResponse = {
  summary: SuperAdminInfrastructureSummary;
  latestBackup: SuperAdminInfrastructureBackupJob | null;
};

export async function fetchSuperAdminPlatformSettings(): Promise<SuperAdminPlatformSettings> {
  const res = await apiFetch('/admin/dashboard/platform-settings');
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to fetch platform settings'));
  }
  return body as SuperAdminPlatformSettings;
}

export async function updateSuperAdminPlatformSettings(
  payload: Partial<SuperAdminPlatformSettings>,
): Promise<SuperAdminPlatformSettings> {
  const res = await apiFetch('/admin/dashboard/platform-settings', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to update platform settings'));
  }
  return body as SuperAdminPlatformSettings;
}

export async function fetchSuperAdminFeatureFlags(): Promise<SuperAdminFeatureFlagsResponse> {
  const res = await apiFetch('/admin/dashboard/feature-flags');
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to fetch feature flags'));
  }
  return body as SuperAdminFeatureFlagsResponse;
}

export async function updateSuperAdminFeatureFlags(
  payload: SuperAdminFeatureFlagsPayload,
): Promise<SuperAdminFeatureFlagsResponse> {
  const res = await apiFetch('/admin/dashboard/feature-flags', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to update feature flags'));
  }
  return body as SuperAdminFeatureFlagsResponse;
}

export async function fetchSuperAdminAnnouncements(filters?: {
  status?: string;
  limit?: number;
}): Promise<SuperAdminAnnouncement[]> {
  const query = toReportingQuery(filters as Record<string, unknown>);
  const res = await apiFetch(`/admin/dashboard/announcements${query}`);
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to fetch announcements'));
  }
  return Array.isArray(body) ? (body as SuperAdminAnnouncement[]) : [];
}

export async function createSuperAdminAnnouncement(payload: {
  title: string;
  message: string;
  target?: 'ALL_FACILITIES' | 'PREMIUM_ONLY' | 'COUNTRY_KE';
  expiresAt?: string | null;
}): Promise<SuperAdminAnnouncement> {
  const res = await apiFetch('/admin/dashboard/announcements', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to create announcement'));
  }
  return body as SuperAdminAnnouncement;
}

export async function updateSuperAdminAnnouncementStatus(
  announcementId: string,
  status: 'PUBLISHED' | 'ARCHIVED' | 'DISABLED',
): Promise<SuperAdminAnnouncement> {
  const res = await apiFetch(`/admin/dashboard/announcements/${announcementId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to update announcement status'));
  }
  return body as SuperAdminAnnouncement;
}

export async function fetchSuperAdminAuditStream(limit = 100): Promise<SuperAdminAuditEvent[]> {
  const query = toReportingQuery({ limit });
  const res = await apiFetch(`/admin/dashboard/audit-stream${query}`);
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to fetch audit stream'));
  }
  return Array.isArray(body) ? (body as SuperAdminAuditEvent[]) : [];
}

export async function fetchSuperAdminInfrastructureSummary(): Promise<SuperAdminInfrastructureSummaryResponse> {
  const res = await apiFetch('/admin/dashboard/infrastructure/summary');
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to fetch infrastructure summary'));
  }
  return body as SuperAdminInfrastructureSummaryResponse;
}

export async function fetchSuperAdminInfrastructureBackups(limit = 20): Promise<SuperAdminInfrastructureBackupJob[]> {
  const query = toReportingQuery({ limit });
  const res = await apiFetch(`/admin/dashboard/infrastructure/backups${query}`);
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to fetch infrastructure backups'));
  }
  return Array.isArray(body) ? (body as SuperAdminInfrastructureBackupJob[]) : [];
}

export async function triggerSuperAdminInfrastructureBackup(payload?: {
  target?: string;
  notes?: string;
}): Promise<SuperAdminInfrastructureBackupJob> {
  const res = await apiFetch('/admin/dashboard/infrastructure/backups', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload || {}),
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to trigger infrastructure backup'));
  }
  return body as SuperAdminInfrastructureBackupJob;
}

export type HelpdeskTicketStatus =
  | "OPEN"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "PENDING_USER"
  | "RESOLVED"
  | "CLOSED"
  | "REOPENED";

export type HelpdeskTicketPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export async function fetchHelpdeskCategories() {
  const res = await apiFetch("/helpdesk/categories");
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, "Failed to fetch helpdesk categories"));
  }
  return body;
}

export async function fetchHelpdeskDashboard(filters?: { facilityId?: string }) {
  const qs = toReportingQuery(filters as Record<string, unknown>);
  const res = await apiFetch(`/helpdesk/dashboard${qs}`);
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, "Failed to fetch helpdesk dashboard"));
  }
  return body;
}

export async function fetchHelpdeskTickets(filters?: {
  facilityId?: string;
  search?: string;
  status?: string;
  priority?: string;
  category?: string;
  assignedTo?: string;
  mineOnly?: boolean;
  limit?: number;
}) {
  const query = toReportingQuery({
    ...filters,
    mineOnly: filters?.mineOnly ? "true" : undefined,
  } as Record<string, unknown>);
  const res = await apiFetch(`/helpdesk/tickets${query}`);
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, "Failed to fetch helpdesk tickets"));
  }
  if (Array.isArray(body)) return body;
  if (Array.isArray((body as any)?.data)) return (body as any).data;
  if (Array.isArray((body as any)?.items)) return (body as any).items;
  return [];
}

export async function fetchHelpdeskTicketById(ticketId: string, filters?: { facilityId?: string }) {
  const query = toReportingQuery(filters as Record<string, unknown>);
  const res = await apiFetch(`/helpdesk/tickets/${encodeURIComponent(ticketId)}${query}`);
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, "Failed to fetch helpdesk ticket"));
  }
  return body;
}

export async function createHelpdeskTicket(payload: {
  facilityId?: string;
  subject: string;
  category?: string;
  priority?: HelpdeskTicketPriority;
  department?: string;
  description: string;
  assignedTo?: string;
  attachments?: string[];
}) {
  const qs = payload.facilityId
    ? `?facilityId=${encodeURIComponent(String(payload.facilityId))}`
    : "";
  const res = await apiFetch(`/helpdesk/tickets${qs}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, "Failed to create helpdesk ticket"));
  }
  return body;
}

export async function assignHelpdeskTicket(
  ticketId: string,
  payload: { facilityId?: string; assignedTo: string; note?: string },
) {
  const qs = payload.facilityId
    ? `?facilityId=${encodeURIComponent(String(payload.facilityId))}`
    : "";
  const res = await apiFetch(`/helpdesk/tickets/${encodeURIComponent(ticketId)}/assign${qs}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, "Failed to assign helpdesk ticket"));
  }
  return body;
}

export async function updateHelpdeskTicketStatus(
  ticketId: string,
  payload: {
    facilityId?: string;
    status: HelpdeskTicketStatus;
    reason: string;
    resolutionSummary?: string;
    force?: boolean;
  },
) {
  const qs = payload.facilityId
    ? `?facilityId=${encodeURIComponent(String(payload.facilityId))}`
    : "";
  const res = await apiFetch(`/helpdesk/tickets/${encodeURIComponent(ticketId)}/status${qs}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, "Failed to update helpdesk ticket status"));
  }
  return body;
}

export async function addHelpdeskTicketComment(
  ticketId: string,
  payload: { facilityId?: string; message: string; internal?: boolean },
) {
  const qs = payload.facilityId
    ? `?facilityId=${encodeURIComponent(String(payload.facilityId))}`
    : "";
  const res = await apiFetch(`/helpdesk/tickets/${encodeURIComponent(ticketId)}/comments${qs}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, "Failed to add helpdesk comment"));
  }
  return body;
}

export async function fetchPatientFeedbackCategories() {
  const res = await apiFetch('/patient-feedback/categories');
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to fetch patient feedback categories'));
  }
  return body;
}

export async function fetchPatientFeedbackDashboard(filters?: {
  facilityId?: string;
  fromDate?: string;
  toDate?: string;
  department?: string;
  serviceType?: string;
}) {
  const query = toReportingQuery(filters as Record<string, unknown>);
  const res = await apiFetch(`/patient-feedback/dashboard${query}`);
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to fetch patient feedback dashboard'));
  }
  return body;
}

export async function fetchPatientFeedbackPerformance(filters?: {
  facilityId?: string;
  fromDate?: string;
  toDate?: string;
  department?: string;
  serviceType?: string;
  minResponses?: number;
}) {
  const query = toReportingQuery(filters as Record<string, unknown>);
  const res = await apiFetch(`/patient-feedback/performance${query}`);
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to fetch patient feedback performance'));
  }
  return body;
}

export async function fetchPatientFeedbackQualitySummary(filters?: {
  facilityId?: string;
  fromDate?: string;
  toDate?: string;
  department?: string;
  serviceType?: string;
}) {
  const query = toReportingQuery(filters as Record<string, unknown>);
  const res = await apiFetch(`/patient-feedback/quality-summary${query}`);
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to fetch patient feedback quality summary'));
  }
  return body;
}

export async function fetchPatientFeedbackSurveys(filters?: {
  facilityId?: string;
  active?: 'true' | 'false';
}) {
  const query = toReportingQuery(filters as Record<string, unknown>);
  const res = await apiFetch(`/patient-feedback/surveys${query}`);
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to fetch patient feedback surveys'));
  }
  if (Array.isArray(body)) return body;
  if (Array.isArray((body as any)?.data)) return (body as any).data;
  if (Array.isArray((body as any)?.items)) return (body as any).items;
  return [];
}

export async function createPatientFeedbackSurvey(payload: {
  facilityId?: string;
  title: string;
  active?: boolean;
  language?: string;
  channels?: string[];
  departments?: string[];
  visitTypes?: string[];
  serviceTypes?: string[];
  anonymousAllowed?: boolean;
  questions?: Array<Record<string, unknown>>;
  mandatoryQuestions?: string[];
  scoringWeights?: Record<string, unknown>;
}) {
  const query = payload.facilityId
    ? `?facilityId=${encodeURIComponent(String(payload.facilityId))}`
    : '';
  const res = await apiFetch(`/patient-feedback/surveys${query}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to create patient feedback survey'));
  }
  return body;
}

export async function setPatientFeedbackSurveyStatus(
  surveyId: string,
  payload: { facilityId?: string; active: boolean },
) {
  const query = payload.facilityId
    ? `?facilityId=${encodeURIComponent(String(payload.facilityId))}`
    : '';
  const res = await apiFetch(`/patient-feedback/surveys/${encodeURIComponent(surveyId)}/status${query}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to update patient feedback survey status'));
  }
  return body;
}

export async function fetchPatientFeedbackResponses(filters?: {
  facilityId?: string;
  surveyId?: string;
  patientId?: string;
  fromDate?: string;
  toDate?: string;
  department?: string;
  serviceType?: string;
  complaintCategory?: string;
  sentiment?: string;
  highRiskOnly?: boolean;
  unresolvedOnly?: boolean;
  limit?: number;
}) {
  const query = toReportingQuery({
    ...filters,
    highRiskOnly: filters?.highRiskOnly ? 'true' : undefined,
    unresolvedOnly: filters?.unresolvedOnly ? 'true' : undefined,
  } as Record<string, unknown>);
  const res = await apiFetch(`/patient-feedback/responses${query}`);
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to fetch patient feedback responses'));
  }
  if (Array.isArray(body)) return body;
  if (Array.isArray((body as any)?.data)) return (body as any).data;
  if (Array.isArray((body as any)?.items)) return (body as any).items;
  return [];
}

export async function submitPatientFeedbackResponse(payload: {
  facilityId?: string;
  surveyId?: string;
  patientId?: string;
  answers?: Record<string, unknown>;
  rating?: number;
  npsScore?: number;
  comments?: string;
  anonymous?: boolean;
  forceEscalate?: boolean;
  escalationPriority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  escalationNote?: string;
}) {
  const query = payload.facilityId
    ? `?facilityId=${encodeURIComponent(String(payload.facilityId))}`
    : '';
  const res = await apiFetch(`/patient-feedback/responses${query}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to submit patient feedback response'));
  }
  return body;
}

export async function escalatePatientFeedbackResponse(
  responseId: string,
  payload?: {
    facilityId?: string;
    note?: string;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  },
) {
  const query = payload?.facilityId
    ? `?facilityId=${encodeURIComponent(String(payload.facilityId))}`
    : '';
  const res = await apiFetch(`/patient-feedback/responses/${encodeURIComponent(responseId)}/escalate${query}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload || {}),
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to escalate patient feedback response'));
  }
  return body;
}

export async function fetchPatientFeedbackTickets(filters?: {
  facilityId?: string;
  status?: string;
  priority?: string;
  responseId?: string;
  limit?: number;
}) {
  const query = toReportingQuery(filters as Record<string, unknown>);
  const res = await apiFetch(`/patient-feedback/tickets${query}`);
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to fetch patient feedback tickets'));
  }
  if (Array.isArray(body)) return body;
  if (Array.isArray((body as any)?.data)) return (body as any).data;
  if (Array.isArray((body as any)?.items)) return (body as any).items;
  return [];
}

export async function runPatientFeedbackAutomation(payload?: {
  facilityId?: string;
  fromDate?: string;
  toDate?: string;
  minRatingForEscalation?: number;
  minNpsForEscalation?: number;
  includeNegativeSentiment?: boolean;
  maxEscalations?: number;
  defaultPriority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  note?: string;
}) {
  const query = payload?.facilityId
    ? `?facilityId=${encodeURIComponent(String(payload.facilityId))}`
    : '';
  const res = await apiFetch(`/patient-feedback/automation/run${query}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload || {}),
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to run patient feedback automation'));
  }
  return body;
}

export async function runPatientFeedbackReminderSweep(payload?: {
  facilityId?: string;
  fromDate?: string;
  toDate?: string;
  visitTypes?: string[];
  includePatientsWithAnyHistoricalFeedback?: boolean;
  maxRecipients?: number;
}) {
  const query = payload?.facilityId
    ? `?facilityId=${encodeURIComponent(String(payload.facilityId))}`
    : '';
  const res = await apiFetch(`/patient-feedback/reminders/run${query}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload || {}),
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to run patient feedback reminder sweep'));
  }
  return body;
}

export async function schedulePatientFeedbackReminderSweep(payload?: {
  facilityId?: string;
  scheduleAt?: string;
  fromDate?: string;
  toDate?: string;
  visitTypes?: string[];
  includePatientsWithAnyHistoricalFeedback?: boolean;
  maxRecipients?: number;
}) {
  const query = payload?.facilityId
    ? `?facilityId=${encodeURIComponent(String(payload.facilityId))}`
    : '';
  const res = await apiFetch(`/patient-feedback/jobs/reminders/schedule${query}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload || {}),
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to schedule patient feedback reminder sweep'));
  }
  return body;
}

export async function schedulePatientFeedbackAutoEscalation(payload?: {
  facilityId?: string;
  scheduleAt?: string;
  fromDate?: string;
  toDate?: string;
  minRatingForEscalation?: number;
  minNpsForEscalation?: number;
  includeNegativeSentiment?: boolean;
  maxEscalations?: number;
  defaultPriority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  note?: string;
}) {
  const query = payload?.facilityId
    ? `?facilityId=${encodeURIComponent(String(payload.facilityId))}`
    : '';
  const res = await apiFetch(`/patient-feedback/jobs/auto-escalation/schedule${query}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload || {}),
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to schedule patient feedback auto-escalation'));
  }
  return body;
}

export async function exportPatientFeedbackMonthly(payload: {
  facilityId?: string;
  year: number;
  month: number;
  format?: 'csv' | 'json' | 'pdf';
}) {
  const query = toReportingQuery({
    facilityId: payload.facilityId,
    year: payload.year,
    month: payload.month,
    format: payload.format || 'csv',
  } as Record<string, unknown>);
  const res = await apiFetch(`/patient-feedback/export/monthly${query}`);
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to export patient feedback monthly report'));
  }
  return body;
}

export async function runPatientFeedbackHrSync(payload?: {
  facilityId?: string;
  fromDate?: string;
  toDate?: string;
  minResponses?: number;
  includeDoctors?: boolean;
  includeNurses?: boolean;
  onlyAtRisk?: boolean;
  recordStatus?: string;
}) {
  const query = payload?.facilityId
    ? `?facilityId=${encodeURIComponent(String(payload.facilityId))}`
    : '';
  const res = await apiFetch(`/patient-feedback/hr-sync/run${query}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload || {}),
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to sync at-risk feedback staff to HR'));
  }
  return body;
}

export async function schedulePatientFeedbackHrSync(payload?: {
  facilityId?: string;
  scheduleAt?: string;
  fromDate?: string;
  toDate?: string;
  minResponses?: number;
  includeDoctors?: boolean;
  includeNurses?: boolean;
  onlyAtRisk?: boolean;
  recordStatus?: string;
}) {
  const query = payload?.facilityId
    ? `?facilityId=${encodeURIComponent(String(payload.facilityId))}`
    : '';
  const res = await apiFetch(`/patient-feedback/jobs/hr-sync/schedule${query}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload || {}),
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to schedule patient feedback HR sync'));
  }
  return body;
}

export async function fetchWards() {
  const res = await apiFetch('/wards');
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to fetch wards'));
  }
  if (Array.isArray(body)) return body;
  if (Array.isArray((body as any)?.data)) return (body as any).data;
  if (Array.isArray((body as any)?.items)) return (body as any).items;
  return [];
}

export async function createWard(payload: {
  name: string;
  type: string;
  capacity: number;
}) {
  const res = await apiFetch('/wards', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to create ward'));
  }
  return (body as any)?.data ?? body;
}

export async function createBed(payload: { wardId: string; bedNumber: string }) {
  const res = await apiFetch('/beds', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to create bed'));
  }
  return (body as any)?.data ?? body;
}

export async function fetchStaff() {
  const res = await apiFetch('/staff');
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to fetch staff'));
  }
  if (Array.isArray(body)) return body;
  if (Array.isArray((body as any)?.data)) return (body as any).data;
  if (Array.isArray((body as any)?.items)) return (body as any).items;
  return [];
}

export async function createStaffProfile(payload: {
  firstName: string;
  lastName: string;
  licenseNumber?: string;
  specialization?: string;
  phone?: string;
  email?: string;
  employmentStatus?: string;
  roleTitle?: string;
}) {
  const res = await apiFetch('/staff', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      data: {
        firstName: payload.firstName,
        lastName: payload.lastName,
        licenseNumber: payload.licenseNumber,
        specialization: payload.specialization,
        phone: payload.phone,
        email: payload.email,
        employmentStatus: payload.employmentStatus,
      },
      roleTitle: payload.roleTitle,
    }),
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to create staff profile'));
  }
  return body;
}

export async function updateStaffProfile(
  id: string,
  payload: {
    firstName?: string;
    lastName?: string;
    licenseNumber?: string;
    specialization?: string;
    phone?: string;
    email?: string;
    employmentStatus?: string;
  },
) {
  const res = await apiFetch(`/staff/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to update staff profile'));
  }
  return body;
}

export async function deleteStaffProfile(id: string) {
  const res = await apiFetch(`/staff/${id}`, { method: 'DELETE' });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to delete staff profile'));
  }
  return body;
}

export async function assignStaffToFacility(
  staffId: string,
  payload: { targetFacilityId?: string; roleTitle: string; departmentId?: string },
) {
  const res = await apiFetch(`/staff/${staffId}/assignments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to assign staff to facility'));
  }
  return body;
}

export async function fetchStaffAssignments(staffId: string) {
  const res = await apiFetch(`/staff/${staffId}/assignments`);
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to fetch staff assignments'));
  }
  if (Array.isArray(body)) return body;
  if (Array.isArray((body as any)?.data)) return (body as any).data;
  if (Array.isArray((body as any)?.items)) return (body as any).items;
  return [];
}

export async function fetchHrAttendance() {
  const res = await apiFetch('/hr/attendance');
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to fetch attendance'));
  }
  if (Array.isArray(body)) return body;
  if (Array.isArray((body as any)?.data)) return (body as any).data;
  if (Array.isArray((body as any)?.items)) return (body as any).items;
  return [];
}

export async function clockInStaff(staffId: string) {
  const res = await apiFetch('/hr/attendance/clock-in', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ staffId }),
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to clock in staff'));
  }
  return body;
}

export async function createManualHrAttendance(payload: {
  staffId: string;
  date: string;
  clockIn?: string;
  clockOut?: string;
}) {
  const res = await apiFetch('/hr/attendance/manual', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to create manual attendance entry'));
  }
  return body;
}

export async function clockOutAttendance(attendanceId: string) {
  const res = await apiFetch(`/hr/attendance/${attendanceId}/clock-out`, {
    method: 'PATCH',
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to clock out attendance'));
  }
  return body;
}

export async function fetchHrLeaves() {
  const res = await apiFetch('/hr/leaves');
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to fetch leaves'));
  }
  if (Array.isArray(body)) return body;
  if (Array.isArray((body as any)?.data)) return (body as any).data;
  if (Array.isArray((body as any)?.items)) return (body as any).items;
  return [];
}

export async function requestHrLeave(payload: {
  staffId: string;
  leaveType: string;
  startDate: string;
  endDate: string;
}) {
  const res = await apiFetch('/hr/leave/request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to request leave'));
  }
  return body;
}

export async function fetchHrLeaveConflicts(payload: {
  staffId: string;
  startDate: string;
  endDate: string;
}) {
  const qs = new URLSearchParams({
    staffId: payload.staffId,
    startDate: payload.startDate,
    endDate: payload.endDate,
  }).toString();
  const res = await apiFetch(`/hr/leave/conflicts?${qs}`);
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to validate leave conflicts'));
  }
  if (Array.isArray(body)) return body;
  if (Array.isArray((body as any)?.data)) return (body as any).data;
  if (Array.isArray((body as any)?.items)) return (body as any).items;
  return [];
}

export async function updateHrLeaveStatus(id: string, status: string) {
  const res = await apiFetch(`/hr/leave/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to update leave status'));
  }
  return body;
}

export async function fetchHrPayrolls(month?: string, year?: string) {
  const params = new URLSearchParams();
  if (month) params.set('month', month);
  if (year) params.set('year', year);
  const qs = params.toString();
  const res = await apiFetch(`/hr/payrolls${qs ? `?${qs}` : ''}`);
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to fetch payrolls'));
  }
  if (Array.isArray(body)) return body;
  if (Array.isArray((body as any)?.data)) return (body as any).data;
  if (Array.isArray((body as any)?.items)) return (body as any).items;
  return [];
}

export async function generateHrPayroll(payload: {
  staffId: string;
  month: string;
  year: number;
  basicSalary: number;
  allowances: number;
  deductions: number;
  overtimePay?: number;
  commissionAmount?: number;
  performanceBonus?: number;
  tax?: number;
  pension?: number;
  insurance?: number;
  nhif?: number;
  loanDeduction?: number;
}) {
  const res = await apiFetch('/hr/payroll/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to generate payroll'));
  }
  return body;
}

export async function fetchHrRecords(params?: {
  recordType?: string;
  staffId?: string;
  limit?: number;
}) {
  const query = new URLSearchParams();
  if (params?.recordType) query.set('recordType', params.recordType);
  if (params?.staffId) query.set('staffId', params.staffId);
  if (params?.limit) query.set('limit', String(params.limit));
  const qs = query.toString();
  const res = await apiFetch(`/hr/records${qs ? `?${qs}` : ''}`);
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to fetch HR records'));
  }
  if (Array.isArray(body)) return body;
  if (Array.isArray((body as any)?.data)) return (body as any).data;
  if (Array.isArray((body as any)?.items)) return (body as any).items;
  return [];
}

export async function createHrRecord(payload: {
  recordType: string;
  title?: string;
  staffId?: string;
  status?: string;
  effectiveDate?: string;
  tags?: string[];
  data?: Record<string, any>;
}) {
  const res = await apiFetch('/hr/records', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to create HR record'));
  }
  return body;
}

export async function updateHrRecord(id: string, payload: {
  title?: string;
  staffId?: string;
  status?: string;
  effectiveDate?: string;
  tags?: string[];
  data?: Record<string, any>;
}) {
  const res = await apiFetch(`/hr/records/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to update HR record'));
  }
  return body;
}

export async function deleteHrRecord(id: string) {
  const res = await apiFetch(`/hr/records/${id}`, { method: 'DELETE' });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to delete HR record'));
  }
  return body;
}

export async function fetchHrCredentialExpiryAlerts(days = 60) {
  const res = await apiFetch(`/hr/credentials/expiry-alerts?days=${encodeURIComponent(String(days))}`);
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to fetch credential expiry alerts'));
  }
  if (Array.isArray(body)) return body;
  if (Array.isArray((body as any)?.data)) return (body as any).data;
  if (Array.isArray((body as any)?.items)) return (body as any).items;
  return [];
}

export async function fetchHrDashboardSummary() {
  const res = await apiFetch('/hr/dashboard/summary');
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to fetch HR dashboard summary'));
  }
  return body;
}

export type FacilityAssetPayload = {
  name: string;
  category: string;
  purchaseDate?: string;
  status?: string;
  serialNumber?: string;
  supplier?: string;
  warrantyExpiry?: string;
  cost?: number;
  depreciation?: number;
  assignedDepartment?: string;
  assignedLocation?: string;
  assignedStaff?: string;
};

export async function createFacilityAsset(payload: FacilityAssetPayload) {
  const res = await apiFetch('/facility-ops/asset', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to create facility asset'));
  }
  return body;
}

export async function fetchFacilityAssets() {
  const res = await apiFetch('/facility-ops/assets');
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to fetch facility assets'));
  }
  if (Array.isArray(body)) return body;
  if (Array.isArray((body as any)?.data)) return (body as any).data;
  if (Array.isArray((body as any)?.items)) return (body as any).items;
  return [];
}

export async function updateFacilityAssetStatus(id: string, status: string) {
  const res = await apiFetch(`/facility-ops/asset/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to update asset status'));
  }
  return body;
}

export async function updateFacilityAsset(id: string, payload: Partial<FacilityAssetPayload>) {
  const res = await apiFetch(`/facility-ops/asset/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to update facility asset'));
  }
  return body;
}

export async function createFacilityMaintenanceRequest(payload: {
  assetId: string;
  description: string;
  priority?: string;
  assignedTo?: string;
  startTime?: string;
  completionTime?: string;
  cost?: number;
  sparePartsUsed?: string;
  workOrderTitle?: string;
  status?: string;
}) {
  const res = await apiFetch('/facility-ops/maintenance', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to create maintenance request'));
  }
  return body;
}

export async function fetchFacilityMaintenanceRequests() {
  const res = await apiFetch('/facility-ops/maintenance-requests');
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to fetch maintenance requests'));
  }
  if (Array.isArray(body)) return body;
  if (Array.isArray((body as any)?.data)) return (body as any).data;
  if (Array.isArray((body as any)?.items)) return (body as any).items;
  return [];
}

export async function updateFacilityMaintenanceStatus(id: string, status: string) {
  const res = await apiFetch(`/facility-ops/maintenance/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to update maintenance status'));
  }
  return body;
}

export async function createFacilityWorkOrder(payload: {
  assetId?: string;
  title?: string;
  description?: string;
  priority?: string;
  status?: string;
  assignedTo?: string;
  startTime?: string;
  completionTime?: string;
  cost?: number;
  sparePartsUsed?: string;
}) {
  const res = await apiFetch('/facility-ops/work-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to create work order'));
  }
  return body;
}

export async function fetchFacilityWorkOrders(limit = 300) {
  const res = await apiFetch(`/facility-ops/work-orders?limit=${encodeURIComponent(String(limit))}`);
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to fetch work orders'));
  }
  if (Array.isArray(body)) return body;
  if (Array.isArray((body as any)?.data)) return (body as any).data;
  if (Array.isArray((body as any)?.items)) return (body as any).items;
  return [];
}

export async function createFacilityUtilityRecord(payload: {
  utilityType?: string;
  meterValue?: number;
  unit?: string;
  cost?: number;
  periodStart?: string;
  periodEnd?: string;
  notes?: string;
}) {
  const res = await apiFetch('/facility-ops/utility', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to create utility record'));
  }
  return body;
}

export async function fetchFacilityUtilityRecords(limit = 300) {
  const res = await apiFetch(`/facility-ops/utilities?limit=${encodeURIComponent(String(limit))}`);
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to fetch utility records'));
  }
  if (Array.isArray(body)) return body;
  if (Array.isArray((body as any)?.data)) return (body as any).data;
  if (Array.isArray((body as any)?.items)) return (body as any).items;
  return [];
}

export async function createFacilityComplianceCheck(payload: {
  checkName: string;
  passed: boolean;
  checkedAt?: string;
  inspector?: string;
  findings?: string;
  nextDueDate?: string;
  documentUrl?: string;
}) {
  const res = await apiFetch('/facility-ops/compliance-check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to create compliance check'));
  }
  return body;
}

export async function fetchFacilityComplianceChecks(limit = 300) {
  const res = await apiFetch(`/facility-ops/compliance-checks?limit=${encodeURIComponent(String(limit))}`);
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to fetch compliance checks'));
  }
  if (Array.isArray(body)) return body;
  if (Array.isArray((body as any)?.data)) return (body as any).data;
  if (Array.isArray((body as any)?.items)) return (body as any).items;
  return [];
}

export async function createFacilityStructureNode(payload: {
  nodeType?: 'BUILDING' | 'FLOOR' | 'ROOM' | 'ZONE';
  name?: string;
  parentNode?: string;
  code?: string;
  capacity?: number;
  notes?: string;
}) {
  const res = await apiFetch('/facility-ops/structure/node', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to create structure node'));
  }
  return body;
}

export async function fetchFacilityStructureSummary() {
  const res = await apiFetch('/facility-ops/structure');
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to fetch structure summary'));
  }
  return body;
}

export async function fetchFacilityOpsDashboard() {
  const res = await apiFetch('/facility-ops/dashboard');
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to fetch facility ops dashboard'));
  }
  return body;
}

export type AmbulanceFleetPayload = {
  vehicleNumber?: string;
  registrationPlate?: string;
  status?: string;
  model?: string;
  year?: number;
  chassisNumber?: string;
  insuranceExpiry?: string;
  roadLicenseExpiry?: string;
  assignedFacility?: string;
  notes?: string;
};

export type AmbulanceDispatchPayload = {
  fleetId: string;
  emergencyCaseId?: string;
  patientId?: string;
  patientName?: string;
  condition?: string;
  arrivalMode?: string;
  location: string;
  pickupLocation?: string;
  destination?: string;
  latitude?: number;
  longitude?: number;
  calledAt?: string;
  dispatchedAt?: string;
  status?: string;
  priority?: string;
  driverId?: string;
  paramedicId?: string;
  nurseId?: string;
  doctorId?: string;
  notes?: string;
};

export async function createAmbulanceFleet(payload: AmbulanceFleetPayload) {
  const res = await apiFetch('/emergency/ambulance/fleet', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) throw new Error(toErrorMessage(body, 'Failed to create ambulance fleet'));
  return (body as any)?.data ?? body;
}

export async function fetchAmbulanceFleet() {
  const res = await apiFetch('/emergency/ambulance/fleet');
  const body = await parseJsonSafe(res);
  if (!res.ok) throw new Error(toErrorMessage(body, 'Failed to fetch ambulance fleet'));
  if (Array.isArray(body)) return body;
  if (Array.isArray((body as any)?.data)) return (body as any).data;
  if (Array.isArray((body as any)?.items)) return (body as any).items;
  return [];
}

export async function updateAmbulanceFleetStatus(id: string, status: string) {
  const res = await apiFetch(`/emergency/ambulance/fleet/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) throw new Error(toErrorMessage(body, 'Failed to update fleet status'));
  return (body as any)?.data ?? body;
}

export async function createAmbulanceDispatch(payload: AmbulanceDispatchPayload) {
  const res = await apiFetch('/emergency/ambulance/dispatch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) throw new Error(toErrorMessage(body, 'Failed to create ambulance dispatch'));
  return (body as any)?.data ?? body;
}

export async function fetchAmbulanceDispatches(params?: {
  status?: string;
  search?: string;
  limit?: number;
}) {
  const query = new URLSearchParams();
  if (params?.status) query.set('status', params.status);
  if (params?.search) query.set('search', params.search);
  if (params?.limit) query.set('limit', String(params.limit));
  const qs = query.toString();
  const res = await apiFetch(`/emergency/ambulance/dispatches${qs ? `?${qs}` : ''}`);
  const body = await parseJsonSafe(res);
  if (!res.ok) throw new Error(toErrorMessage(body, 'Failed to fetch dispatches'));
  if (Array.isArray(body)) return body;
  if (Array.isArray((body as any)?.data)) return (body as any).data;
  if (Array.isArray((body as any)?.items)) return (body as any).items;
  return [];
}

export async function updateAmbulanceDispatchStatus(
  id: string,
  payload: { status: string; notes?: string },
) {
  const res = await apiFetch(`/emergency/ambulance/dispatch/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) throw new Error(toErrorMessage(body, 'Failed to update dispatch status'));
  return (body as any)?.data ?? body;
}

export async function logAmbulanceDispatchLocation(
  dispatchId: string,
  payload: {
    latitude?: number;
    longitude?: number;
    address?: string;
    speedKmh?: number;
    etaMinutes?: number;
    distanceKm?: number;
    sourceModule?: string;
    capturedAt?: string;
  },
) {
  const res = await apiFetch(
    `/emergency/ambulance/dispatch/${encodeURIComponent(dispatchId)}/location`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
  );
  const body = await parseJsonSafe(res);
  if (!res.ok) throw new Error(toErrorMessage(body, 'Failed to log dispatch location'));
  return (body as any)?.data ?? body;
}

export async function fetchAmbulanceLocationLogs(params?: {
  dispatchId?: string;
  limit?: number;
}) {
  const query = new URLSearchParams();
  if (params?.dispatchId) query.set('dispatchId', params.dispatchId);
  if (params?.limit) query.set('limit', String(params.limit));
  const qs = query.toString();
  const res = await apiFetch(`/emergency/ambulance/location-logs${qs ? `?${qs}` : ''}`);
  const body = await parseJsonSafe(res);
  if (!res.ok) throw new Error(toErrorMessage(body, 'Failed to fetch location logs'));
  if (Array.isArray(body)) return body;
  if (Array.isArray((body as any)?.data)) return (body as any).data;
  if (Array.isArray((body as any)?.items)) return (body as any).items;
  return [];
}

export async function createAmbulanceFuelLog(payload: {
  fleetId: string;
  liters?: number;
  cost?: number;
  mileageKm?: number;
  odometerKm?: number;
  fuelStation?: string;
  loggedAt?: string;
}) {
  const res = await apiFetch('/emergency/ambulance/fuel-log', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) throw new Error(toErrorMessage(body, 'Failed to create fuel log'));
  return (body as any)?.data ?? body;
}

export async function fetchAmbulanceFuelLogs(params?: {
  fleetId?: string;
  limit?: number;
}) {
  const query = new URLSearchParams();
  if (params?.fleetId) query.set('fleetId', params.fleetId);
  if (params?.limit) query.set('limit', String(params.limit));
  const qs = query.toString();
  const res = await apiFetch(`/emergency/ambulance/fuel-logs${qs ? `?${qs}` : ''}`);
  const body = await parseJsonSafe(res);
  if (!res.ok) throw new Error(toErrorMessage(body, 'Failed to fetch fuel logs'));
  if (Array.isArray(body)) return body;
  if (Array.isArray((body as any)?.data)) return (body as any).data;
  if (Array.isArray((body as any)?.items)) return (body as any).items;
  return [];
}

export async function createAmbulanceDispatchBilling(
  dispatchId: string,
  payload: {
    patientId: string;
    visitId?: string;
    baseFee?: number;
    perKmFee?: number;
    distanceKm?: number;
    emergencySurcharge?: number;
    waitingFee?: number;
    oxygenFee?: number;
    notes?: string;
  },
) {
  const res = await apiFetch(`/emergency/ambulance/dispatch/${encodeURIComponent(dispatchId)}/billing`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) throw new Error(toErrorMessage(body, 'Failed to create dispatch bill'));
  return (body as any)?.data ?? body;
}

export async function fetchAmbulanceDashboard() {
  const res = await apiFetch('/emergency/ambulance/dashboard');
  const body = await parseJsonSafe(res);
  if (!res.ok) throw new Error(toErrorMessage(body, 'Failed to fetch ambulance dashboard'));
  return body;
}

export async function createProcurementSupplier(payload: {
  name: string;
  contactPerson?: string;
  phone?: string;
}) {
  const res = await apiFetch('/procurement/supplier', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to create supplier'));
  }
  return (body as any)?.data ?? body;
}

export async function fetchProcurementSuppliers() {
  const res = await apiFetch('/procurement/suppliers');
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to fetch suppliers'));
  }
  if (Array.isArray(body)) return body;
  if (Array.isArray((body as any)?.data)) return (body as any).data;
  if (Array.isArray((body as any)?.items)) return (body as any).items;
  return [];
}

export async function createProcurementItem(payload: {
  name: string;
  category: string;
  quantity: number;
  reorderLevel: number;
  supplierName?: string;
}) {
  const res = await apiFetch('/procurement/item', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to create inventory item'));
  }
  return (body as any)?.data ?? body;
}

export async function fetchProcurementItems() {
  const res = await apiFetch('/procurement/items');
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to fetch inventory items'));
  }
  if (Array.isArray(body)) return body;
  if (Array.isArray((body as any)?.data)) return (body as any).data;
  if (Array.isArray((body as any)?.items)) return (body as any).items;
  return [];
}

export async function updateProcurementItemQuantity(
  id: string,
  quantity: number,
  reason?: string,
  supplierName?: string,
) {
  const res = await apiFetch(`/procurement/item/${id}/quantity`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ quantity, reason, supplierName }),
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to update inventory item quantity'));
  }
  return (body as any)?.data ?? body;
}

export async function issueProcurementItemQuantity(
  id: string,
  quantity: number,
  reason?: string,
) {
  const res = await apiFetch(`/procurement/item/${id}/issue`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ quantity, reason }),
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to issue supply stock'));
  }
  return (body as any)?.data ?? body;
}

export async function createInventoryMedicine(payload: {
  name: string;
  genericName?: string;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  unitPrice: number;
  category?: string;
  supplierName?: string;
}) {
  const res = await apiFetch('/inventory', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to create medicine stock item'));
  }
  return (body as any)?.data ?? body;
}

export async function fetchInventoryMedicines() {
  const res = await apiFetch('/inventory');
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to fetch medicine stock items'));
  }
  if (Array.isArray(body)) return body;
  if (Array.isArray((body as any)?.data)) return (body as any).data;
  if (Array.isArray((body as any)?.items)) return (body as any).items;
  return [];
}

export async function updateInventoryMedicine(
  id: string,
  payload: {
    name?: string;
    genericName?: string;
    batchNumber?: string;
    expiryDate?: string;
    quantity?: number;
    unitPrice?: number;
  },
) {
  const res = await apiFetch(`/inventory/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to update medicine stock item'));
  }
  return (body as any)?.data ?? body;
}

export async function receiveInventoryMedicine(
  id: string,
  quantity: number,
  reason?: string,
  options?: { category?: string; supplierName?: string },
) {
  const res = await apiFetch(`/inventory/${id}/receive`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      quantity,
      reason,
      category: options?.category,
      supplierName: options?.supplierName,
    }),
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to receive medicine stock'));
  }
  return (body as any)?.data ?? body;
}

export async function issueInventoryMedicine(
  id: string,
  quantity: number,
  reason?: string,
) {
  const res = await apiFetch(`/inventory/${id}/issue`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ quantity, reason }),
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to issue medicine stock'));
  }
  return (body as any)?.data ?? body;
}

export async function fetchInventoryMovements(params?: {
  stockType?: 'MEDICINE' | 'SUPPLY';
  limit?: number;
}) {
  const query = new URLSearchParams();
  if (params?.stockType) query.set('stockType', params.stockType);
  if (params?.limit) query.set('limit', String(params.limit));
  const qs = query.toString();
  const res = await apiFetch(`/inventory/movements${qs ? `?${qs}` : ''}`);
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to fetch stock movement ledger'));
  }
  if (Array.isArray(body)) return body;
  if (Array.isArray((body as any)?.data)) return (body as any).data;
  if (Array.isArray((body as any)?.items)) return (body as any).items;
  return [];
}

export async function fetchInventoryExpiryAlerts(days = 60) {
  const res = await apiFetch(`/inventory/expiry-alerts?days=${encodeURIComponent(String(days))}`);
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to fetch inventory expiry alerts'));
  }
  if (Array.isArray(body)) return body;
  if (Array.isArray((body as any)?.data)) return (body as any).data;
  if (Array.isArray((body as any)?.items)) return (body as any).items;
  return [];
}

export async function fetchPharmacyDashboard() {
  const res = await apiFetch('/pharmacy/dashboard');
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to fetch pharmacy dashboard'));
  }
  return (body as any)?.data ?? body;
}

export async function fetchPharmacyCatalog() {
  const res = await apiFetch('/pharmacy/catalog');
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to fetch pharmacy catalog'));
  }
  if (Array.isArray(body)) return body;
  if (Array.isArray((body as any)?.data)) return (body as any).data;
  if (Array.isArray((body as any)?.items)) return (body as any).items;
  return [];
}

export async function upsertPharmacyCatalogItem(payload: {
  genericName: string;
  brandName?: string;
  drugClass?: string;
  strength?: string;
  form?: string;
  manufacturer?: string;
  controlledStatus?: boolean;
  storageCondition?: string;
  prescriptionRequired?: boolean;
  reorderLevel?: number;
  unitPrice?: number;
  insuranceEligible?: boolean;
}) {
  const res = await apiFetch('/pharmacy/catalog', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to save pharmacy catalog item'));
  }
  return (body as any)?.data ?? body;
}

export async function removePharmacyCatalogItem(code: string) {
  const res = await apiFetch(`/pharmacy/catalog/${encodeURIComponent(code)}`, {
    method: 'DELETE',
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to remove pharmacy catalog item'));
  }
  return (body as any)?.data ?? body;
}

export async function createPharmacyPrescription(payload: {
  visitId?: string;
  patientId?: string;
  doctorId?: string;
  medication: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  notes?: string;
  prescriptionQuantity?: number;
  insuranceEligible?: boolean;
  controlledStatus?: boolean;
  requiresPrescription?: boolean;
}) {
  const res = await apiFetch('/pharmacy/prescription', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to create prescription'));
  }
  return (body as any)?.data ?? body;
}

export async function reviewPharmacyPrescription(
  prescriptionId: string,
  payload: {
    status?: string;
    notes?: string;
    interactionFlag?: boolean;
    allergyFlag?: boolean;
  },
) {
  const res = await apiFetch(
    `/pharmacy/prescription/${encodeURIComponent(prescriptionId)}/review`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
  );
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to review prescription'));
  }
  return (body as any)?.data ?? body;
}

export async function dispensePharmacyMedication(payload: {
  prescriptionId: string;
  medicineId?: string;
  medicineName?: string;
  quantity: number;
  pharmacistId?: string;
  controlledStatus?: boolean;
  insuranceCovered?: boolean;
  paymentMethod?: string;
  markPaid?: boolean;
  notes?: string;
}) {
  const res = await apiFetch('/pharmacy/dispense', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to dispense medication'));
  }
  return (body as any)?.data ?? body;
}

export async function fetchPharmacyPrescriptions(params?: {
  status?: string;
  medication?: string;
}) {
  const query = new URLSearchParams();
  if (params?.status) query.set('status', params.status);
  if (params?.medication) query.set('medication', params.medication);
  const qs = query.toString();
  const res = await apiFetch(`/pharmacy/prescriptions${qs ? `?${qs}` : ''}`);
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to fetch pharmacy prescriptions'));
  }
  if (Array.isArray(body)) return body;
  if (Array.isArray((body as any)?.data)) return (body as any).data;
  if (Array.isArray((body as any)?.items)) return (body as any).items;
  return [];
}

export async function fetchPharmacyDispenses(params?: { pharmacistId?: string }) {
  const query = new URLSearchParams();
  if (params?.pharmacistId) query.set('pharmacistId', params.pharmacistId);
  const qs = query.toString();
  const res = await apiFetch(`/pharmacy/dispenses${qs ? `?${qs}` : ''}`);
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to fetch pharmacy dispenses'));
  }
  if (Array.isArray(body)) return body;
  if (Array.isArray((body as any)?.data)) return (body as any).data;
  if (Array.isArray((body as any)?.items)) return (body as any).items;
  return [];
}

export async function fetchBlockchainDashboard() {
  const res = await apiFetch('/blockchain/dashboard');
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to fetch blockchain dashboard'));
  }
  return (body as any)?.data ?? body;
}

export async function fetchBlockchainLedger(params?: {
  moduleType?: string;
  entityType?: string;
  entityId?: string;
  status?: string;
  limit?: number;
}) {
  const query = new URLSearchParams();
  if (params?.moduleType) query.set('moduleType', params.moduleType);
  if (params?.entityType) query.set('entityType', params.entityType);
  if (params?.entityId) query.set('entityId', params.entityId);
  if (params?.status) query.set('status', params.status);
  if (params?.limit) query.set('limit', String(params.limit));
  const qs = query.toString();
  const res = await apiFetch(`/blockchain/ledger${qs ? `?${qs}` : ''}`);
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to fetch blockchain ledger'));
  }
  if (Array.isArray(body)) return body;
  if (Array.isArray((body as any)?.data)) return (body as any).data;
  if (Array.isArray((body as any)?.items)) return (body as any).items;
  return [];
}

export async function hashBlockchainRecord(payload: {
  payload?: unknown;
  hashInput?: string;
  algorithm?: string;
}) {
  const res = await apiFetch('/blockchain/hash', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to generate blockchain hash'));
  }
  return (body as any)?.data ?? body;
}

export async function submitBlockchainTransaction(payload: {
  moduleType?: string;
  entityType?: string;
  entityId?: string;
  entityHash?: string;
  payload?: unknown;
  hashInput?: string;
  signature?: string;
  network?: string;
  status?: string;
  notes?: string;
  sourceModule?: string;
}) {
  const res = await apiFetch('/blockchain/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to submit blockchain transaction'));
  }
  return (body as any)?.data ?? body;
}

export async function verifyBlockchainHash(hash: string) {
  const res = await apiFetch(`/blockchain/verify/hash?hash=${encodeURIComponent(hash)}`);
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to verify blockchain hash'));
  }
  return (body as any)?.data ?? body;
}

export async function verifyBlockchainEntity(payload: {
  entityType?: string;
  entityId?: string;
  payload?: unknown;
  entityHash?: string;
  hashInput?: string;
}) {
  const res = await apiFetch('/blockchain/verify/entity', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to verify blockchain entity integrity'));
  }
  return (body as any)?.data ?? body;
}

export type PharmacyPosSaleItemInput = {
  itemId: string;
  name: string;
  quantity: number;
  unitPrice?: number;
  discountPercent?: number;
  controlledSubstance?: boolean;
};

export type PharmacyPosCreatePayload = {
  patientId?: string;
  prescriptionId?: string;
  saleType?: 'PRESCRIPTION' | 'OTC';
  items: PharmacyPosSaleItemInput[];
  paymentMethod: 'MPESA' | 'CASH' | 'CARD' | 'INSURANCE' | 'SPLIT';
  splitPayments?: Array<{
    method: 'MPESA' | 'CASH' | 'CARD' | 'INSURANCE';
    amount: number;
    transactionRef?: string;
  }>;
  paidAmount?: number;
  discountAmount?: number;
  discountPercent?: number;
  taxPercent?: number;
  insuranceProvider?: string;
  insuranceMemberId?: string;
  insuranceCoveragePercent?: number;
  coPayAmount?: number;
  walkInCustomerName?: string;
  walkInCustomerPhone?: string;
  phoneNumber?: string;
  notes?: string;
};

export async function createPharmacyPosSale(payload: PharmacyPosCreatePayload) {
  const res = await apiFetch('/tenant/pos/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to create POS transaction'));
  }
  return body;
}

export async function fetchPharmacyPosTransactions(params?: {
  search?: string;
  paymentMethod?: string;
  status?: string;
  saleType?: string;
  fromDate?: string;
  toDate?: string;
  limit?: number;
}) {
  const query = new URLSearchParams();
  if (params?.search) query.set('search', params.search);
  if (params?.paymentMethod) query.set('paymentMethod', params.paymentMethod);
  if (params?.status) query.set('status', params.status);
  if (params?.saleType) query.set('saleType', params.saleType);
  if (params?.fromDate) query.set('fromDate', params.fromDate);
  if (params?.toDate) query.set('toDate', params.toDate);
  if (params?.limit) query.set('limit', String(params.limit));
  const qs = query.toString();
  const res = await apiFetch(`/tenant/pos/transactions${qs ? `?${qs}` : ''}`);
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to fetch POS transactions'));
  }
  if (Array.isArray(body)) return body;
  if (Array.isArray((body as any)?.data)) return (body as any).data;
  if (Array.isArray((body as any)?.items)) return (body as any).items;
  return [];
}

export async function fetchPharmacyPosSummary(days = 30) {
  const res = await apiFetch(`/tenant/pos/summary?days=${encodeURIComponent(String(days))}`);
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to fetch POS summary'));
  }
  return body;
}

export async function fetchPharmacyPosReceipt(transactionId: string) {
  const res = await apiFetch(`/tenant/pos/transactions/${encodeURIComponent(transactionId)}/receipt`);
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to fetch POS receipt'));
  }
  return body;
}

export async function refundPharmacyPosTransaction(
  transactionId: string,
  payload: {
    reason: string;
    method?: 'MPESA' | 'CASH' | 'CARD' | 'REVERSAL';
    approvalCode?: string;
    refundAmount?: number;
    items?: Array<{ itemId: string; quantity: number }>;
  },
) {
  const res = await apiFetch(`/tenant/pos/${encodeURIComponent(transactionId)}/refund`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to refund POS transaction'));
  }
  return body;
}

export type MortuaryCreatePayload = {
  source?: "INTERNAL" | "EXTERNAL";
  patientId?: string;
  deceasedName?: string;
  dateOfDeath: string;
  causeOfDeath?: string;
  gender?: string;
  age?: number;
  nationalId?: string;
  nextOfKinName?: string;
  nextOfKinPhone?: string;
  certifyingDoctor?: string;
  policeCaseNumber?: string;
  infectiousFlag?: boolean;
  status?: "REGISTERED" | "STORED" | "ON_HOLD" | "UNCLAIMED" | "READY_FOR_RELEASE";
  storageUnit?: string;
  storageRoom?: string;
  storageRack?: string;
  storageTray?: string;
  policeHold?: boolean;
  holdReason?: string;
  holdUntil?: string;
  notes?: string;
};

export type MortuaryAllocationPayload = {
  storageUnit: string;
  storageRoom?: string;
  storageRack?: string;
  storageTray?: string;
  policeHold?: boolean;
  holdReason?: string;
  holdUntil?: string;
  movedBy?: string;
  notes?: string;
};

export type MortuaryReleasePayload = {
  releaseDate?: string;
  releasedToName: string;
  releasedToNationalId?: string;
  releasedToPhone?: string;
  relationship?: string;
  paymentVerified: boolean;
  docsVerified: boolean;
  signatureCaptured: boolean;
  approvalRole?: string;
  releaseCertificateNo?: string;
  billAmount?: number;
  paidAmount?: number;
  notes?: string;
};

export async function fetchMortuaryDashboard(capacity?: number) {
  const query =
    Number.isFinite(Number(capacity)) && Number(capacity) > 0
      ? `?capacity=${encodeURIComponent(String(capacity))}`
      : "";
  const res = await apiFetch(`/tenant/mortuary/dashboard${query}`);
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, "Failed to fetch mortuary dashboard"));
  }
  return body;
}

export async function fetchMortuaryRecords(params?: {
  search?: string;
  status?: string;
  policeHold?: "true" | "false";
  fromDate?: string;
  toDate?: string;
  limit?: number;
}) {
  const query = new URLSearchParams();
  if (params?.search) query.set("search", params.search);
  if (params?.status) query.set("status", params.status);
  if (params?.policeHold) query.set("policeHold", params.policeHold);
  if (params?.fromDate) query.set("fromDate", params.fromDate);
  if (params?.toDate) query.set("toDate", params.toDate);
  if (params?.limit) query.set("limit", String(params.limit));
  const qs = query.toString();
  const res = await apiFetch(`/tenant/mortuary/records${qs ? `?${qs}` : ""}`);
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, "Failed to fetch mortuary records"));
  }
  if (Array.isArray(body)) return body;
  if (Array.isArray((body as any)?.data)) return (body as any).data;
  if (Array.isArray((body as any)?.items)) return (body as any).items;
  return [];
}

export async function createMortuaryRecord(payload: MortuaryCreatePayload) {
  const res = await apiFetch("/tenant/mortuary/records", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, "Failed to create mortuary record"));
  }
  return body;
}

export async function allocateMortuaryStorage(recordId: string, payload: MortuaryAllocationPayload) {
  const res = await apiFetch(`/tenant/mortuary/records/${encodeURIComponent(recordId)}/allocate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, "Failed to allocate mortuary storage"));
  }
  return body;
}

export async function releaseMortuaryRecord(recordId: string, payload: MortuaryReleasePayload) {
  const res = await apiFetch(`/tenant/mortuary/records/${encodeURIComponent(recordId)}/release`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, "Failed to release mortuary body"));
  }
  return body;
}

export async function createProcurementPurchaseOrder(payload: { supplierId: string }) {
  const res = await apiFetch('/procurement/purchase-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to create purchase order'));
  }
  return (body as any)?.data ?? body;
}

export async function fetchProcurementPurchaseOrders() {
  const res = await apiFetch('/procurement/purchase-orders');
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to fetch purchase orders'));
  }
  if (Array.isArray(body)) return body;
  if (Array.isArray((body as any)?.data)) return (body as any).data;
  if (Array.isArray((body as any)?.items)) return (body as any).items;
  return [];
}

export async function updateProcurementPurchaseOrderStatus(id: string, status: string) {
  const res = await apiFetch(`/procurement/purchase-order/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(toErrorMessage(body, 'Failed to update purchase order status'));
  }
  return (body as any)?.data ?? body;
}

type WorkflowSubmitInput = {
  moduleId: number;
  formId?: string;
  patientId?: string;
  patientName: string;
  patientPhone?: string;
  formData: Record<string, string>;
};

const QUEUE_FIELD_KEYS = [
  "queue_to_next_module",
  "next_queue_route",
  "next_route",
  "queue_route",
] as const;

export const PATIENT_QUEUE_MODULE_IDS: number[] = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 21, 24, 25, 26, 27, 28, 30, 31, 32, 35, 36, 37, 38,
];

export function isPatientQueueModule(moduleId: number) {
  return PATIENT_QUEUE_MODULE_IDS.includes(moduleId);
}

function normalizeQueueLabel(raw: string) {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function resolveQueueModuleId(rawValue?: string) {
  const value = String(rawValue || "").trim();
  if (!value) return { isComplete: false, moduleId: undefined as number | undefined };
  if (/^none$/i.test(value)) {
    return { isComplete: false, moduleId: undefined as number | undefined, isNone: true };
  }

  if (/discharge|complete|completed|done/i.test(value)) {
    return { isComplete: true, moduleId: 1 };
  }

  const moduleTagged = value.match(/module[_\s-]*(\d+)/i);
  if (moduleTagged) {
    const next = Number(moduleTagged[1]);
    if (Number.isFinite(next) && WORKFLOW_MODULES.some((m) => m.id === next)) {
      return { isComplete: false, moduleId: next };
    }
  }

  const asNumber = Number(value);
  if (Number.isFinite(asNumber) && WORKFLOW_MODULES.some((m) => m.id === asNumber)) {
    return { isComplete: false, moduleId: asNumber };
  }

  const normalized = normalizeQueueLabel(value);
  const aliasMap: Array<[RegExp, number]> = [
    [/triage/, 36],
    [/\bopd\b|out patient|outpatient|doctor consultation|consultation|back to doctor/, 36],
    [/\blab\b|laboratory/, 8],
    [/radiology|imaging/, 9],
    [/pharmacy|dispens/, 10],
    [/billing|cashier|invoice|payment/, 13],
    [/in patient|inpatient|admit|ipd/, 2],
    [/appointment/, 4],
    [/telemedicine|virtual consultation|video consult/, 21],
    [/emergency|er\b|ed\b/, 25],
    [/maternity|obstetric|obgyn|antenatal|anc|labor|delivery|postnatal/, 37],
    [/cost accounting|department profitability|profitability|margin analysis/, 45],
    [/strategic planning|executive dashboard|executive|control tower/, 46],
    [/orchestration|event bus|event driven|data ownership|integration backbone/, 47],
    [/registration|register/, 1],
    [/queue management/, 28],
  ];

  const alias = aliasMap.find(([pattern]) => pattern.test(normalized));
  if (alias) {
    return { isComplete: false, moduleId: alias[1] };
  }

  const exact = WORKFLOW_MODULES.find((m) => normalizeQueueLabel(m.name) === normalized);
  if (exact) {
    return { isComplete: false, moduleId: exact.id };
  }

  const contains = WORKFLOW_MODULES.find((m) => {
    const moduleLabel = normalizeQueueLabel(m.name);
    return moduleLabel.includes(normalized) || normalized.includes(moduleLabel);
  });
  if (contains) {
    return { isComplete: false, moduleId: contains.id };
  }

  return { isComplete: false, moduleId: undefined as number | undefined };
}

export function extractQueueTargetFromForm(formData: Record<string, string>) {
  for (const key of QUEUE_FIELD_KEYS) {
    const value = String(formData[key] || "").trim();
    if (!value) continue;
    if (/^none$/i.test(value)) return "";
    return value;
  }
  return "";
}

export async function submitModuleRecord(input: WorkflowSubmitInput) {
  const nowIso = new Date().toISOString();
  const dateOnly = nowIso.slice(0, 10);
  const dateTime = nowIso;
  const note = input.formData.notes || input.formData.description || input.formData.reason || "";
  const formId = String(input.formId || "").trim();

  const asBool = (value: unknown) => {
    const normalized = String(value ?? "").trim().toLowerCase();
    return (
      normalized === "true" ||
      normalized === "1" ||
      normalized === "yes" ||
      normalized === "on"
    );
  };

  const toText = (value: unknown) => {
    const normalized = String(value ?? "").trim();
    return normalized || undefined;
  };

  const toNum = (value: unknown) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  };

  const resolveInpatientId = async () => {
    const explicitId = String(
      input.formData.inpatient_id ||
        input.formData.inpatientId ||
        input.formData.in_patient_id ||
        input.formData.admission_id ||
        input.formData.admissionId ||
        "",
    ).trim();
    if (explicitId) return explicitId;
    if (!input.patientId) return "";

    try {
      const admissions = await fetchInpatientAdmissions();
      const match = admissions.find((row: any) => {
        const rowPatientId = String(row?.patientId || row?.patient?.id || "").trim();
        const status = String(row?.status || "").toUpperCase();
        return (
          rowPatientId === String(input.patientId) &&
          status !== "DISCHARGED" &&
          status !== "CANCELLED"
        );
      });
      return String(match?.id || "");
    } catch {
      return "";
    }
  };

  const post = (path: string, body: Record<string, unknown>) =>
    apiFetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  const patch = (path: string, body: Record<string, unknown>) =>
    apiFetch(path, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

  const logModuleEvent = (eventName: string, eventData: Record<string, unknown>) =>
    post("/reporting/log", {
      eventName,
      eventData: {
        moduleId: input.moduleId,
        patientId: input.patientId || null,
        patientName: input.patientName || "",
        at: nowIso,
        ...eventData,
      },
    });

  const RCM_AUTO_CHARGE_MODULES = new Set<number>([2, 8, 9, 10, 11, 12, 21, 25, 36, 37, 38]);
  const RCM_SOURCE_BY_MODULE: Record<number, string> = {
    2: "IPD",
    8: "LAB",
    9: "RADIOLOGY",
    10: "PHARMACY",
    11: "OT",
    12: "BLOOD_BANK",
    21: "TELEMEDICINE",
    25: "EMERGENCY",
    36: "OPD",
    37: "MATERNITY",
    38: "ICU",
  };
  const RCM_DEPARTMENT_BY_MODULE: Record<number, string> = {
    2: "IN-PATIENT",
    8: "LABORATORY",
    9: "RADIOLOGY",
    10: "PHARMACY",
    11: "OPERATION_THEATRE",
    12: "BLOOD_BANK",
    21: "TELEMEDICINE",
    25: "EMERGENCY",
    36: "OUTPATIENT",
    37: "MATERNITY",
    38: "ICU",
  };
  const RCM_BILLABLE_FORMS_BY_MODULE: Record<number, Set<string>> = {
    2: new Set(["daily_care_plan"]),
    8: new Set(["lab_test_request"]),
    9: new Set(["imaging_request"]),
    10: new Set(["pharmacy_dispense"]),
    11: new Set(["surgery_booking", "ot_inventory_usage", "post_op_notes"]),
    12: new Set(["issue_blood", "transfusion_record"]),
    21: new Set(["telemedicine_schedule", "telemedicine_complete"]),
    25: new Set(["emergency_quick_registration", "emergency_clinical_management"]),
    36: new Set(["opd_consultation_prescription"]),
    37: new Set(["maternity_labor_delivery"]),
    38: new Set(["icu_admission", "icu_infusion_management"]),
  };
  const RCM_SERVICE_CODE_BY_FORM: Record<string, string> = {
    daily_care_plan: "IPD_DAILY_CARE",
    lab_test_request: "LAB_TEST_ORDER",
    imaging_request: "RADIOLOGY_ORDER",
    pharmacy_dispense: "PHARMACY_DISPENSE",
    surgery_booking: "OT_PROCEDURE",
    post_op_notes: "OT_POST_OP_CARE",
    issue_blood: "BLOOD_ISSUE",
    transfusion_record: "BLOOD_TRANSFUSION",
    telemedicine_schedule: "TELEMED_CONSULT",
    telemedicine_complete: "TELEMED_COMPLETION",
    emergency_quick_registration: "EMERGENCY_VISIT",
    emergency_clinical_management: "EMERGENCY_PROCEDURE",
    opd_consultation_prescription: "OPD_CONSULTATION",
    maternity_labor_delivery: "MATERNITY_DELIVERY",
    icu_admission: "ICU_ADMISSION",
    icu_infusion_management: "ICU_INFUSION",
  };

  const findFirstNumber = (keys: string[]) => {
    for (const key of keys) {
      const value = toNum(input.formData[key]);
      if (value !== undefined) return value;
    }
    return undefined;
  };

  const findFirstText = (keys: string[]) => {
    for (const key of keys) {
      const value = toText(input.formData[key]);
      if (value) return value;
    }
    return undefined;
  };

  const buildAutoRcmChargePayload = (responseBody: any, resolvedPatientId?: string) => {
    if (!RCM_AUTO_CHARGE_MODULES.has(input.moduleId)) return undefined;
    const billableForms = RCM_BILLABLE_FORMS_BY_MODULE[input.moduleId];
    if (billableForms && formId && !billableForms.has(formId)) return undefined;

    const explicitTotal = findFirstNumber([
      "total_amount",
      "charge_amount",
      "amount",
      "total_cost",
      "estimated_cost",
      "cost",
    ]);
    const explicitUnit = findFirstNumber([
      "unit_amount",
      "unit_price",
      "charge_unit_price",
      "test_price",
      "consultation_fee",
      "selling_price",
      "price",
      "fee",
      "procedure_fee",
      "daily_rate",
      "blood_unit_cost",
      "transfusion_cost",
      "emergency_fee",
      "delivery_fee",
      "icu_daily_charge",
      "infusion_cost",
      "anesthesia_cost",
      "implant_cost",
    ]);
    const quantity = findFirstNumber([
      "quantity",
      "charge_quantity",
      "prescription_quantity",
      "units_requested",
      "units_issued",
      "units",
      "component_units",
    ]) || 1;
    if (quantity <= 0) return undefined;

    const unitAmount =
      explicitUnit !== undefined
        ? explicitUnit
        : explicitTotal !== undefined
          ? Number((explicitTotal / Math.max(quantity, 1)).toFixed(2))
          : undefined;
    if (unitAmount === undefined || unitAmount <= 0) return undefined;

    const totalAmount =
      explicitTotal !== undefined
        ? explicitTotal
        : Number((Math.max(quantity, 1) * unitAmount).toFixed(2));

    return {
      patientId:
        resolvedPatientId || input.patientId || findFirstText(["patient_id", "mother_patient_id"]),
      visitId:
        findFirstText(["visit_id", "visitId"]) ||
        toText(responseBody?.visitId) ||
        toText(responseBody?.data?.visitId),
      moduleSource: RCM_SOURCE_BY_MODULE[input.moduleId] || `MODULE_${input.moduleId}`,
      serviceCode:
        findFirstText([
          "service_code",
          "test_code",
          "procedure_code",
          "imaging_type",
          "component_type",
          "procedure_name",
        ]) ||
        RCM_SERVICE_CODE_BY_FORM[formId] ||
        (formId ? formId.toUpperCase() : `MODULE_${input.moduleId}`),
      department:
        findFirstText(["department", "department_id"]) ||
        RCM_DEPARTMENT_BY_MODULE[input.moduleId],
      payerType: findFirstText([
        "payer_type",
        "payment_mode",
        "payment_category",
        "insurance_type",
      ]),
      quantity: Math.max(quantity, 1),
      unitAmount,
      totalAmount,
      chargeStatus: "CAPTURED",
      eventPayload: {
        moduleId: input.moduleId,
        formId,
        at: nowIso,
        responseId: toText(responseBody?.id) || toText(responseBody?.data?.id),
        data: input.formData,
      },
    };
  };

  const emitAutoRcmCharge = (responseBody: any, resolvedPatientId?: string) => {
    const payload = buildAutoRcmChargePayload(responseBody, resolvedPatientId);
    if (!payload) return;

    void post("/revenue-cycle/captured-charges", payload).catch(() => {
      // fire-and-forget: primary clinical save path must not fail on RCM side effects
    });
  };

  const moduleHandlers: Record<number, () => Promise<Response>> = {
    1: () => {
      const fullName = (input.formData.full_name || "").trim();
      const parts = fullName.split(/\s+/).filter(Boolean);
      const firstName = input.formData.firstName || input.formData.first_name || parts[0] || "New";
      const lastName =
        input.formData.lastName ||
        input.formData.last_name ||
        parts.slice(1).join(" ") ||
        "Patient";
      const rawBloodGroup = (input.formData.blood_group || "").trim();
      const normalizedBloodGroup =
        rawBloodGroup && rawBloodGroup !== "Not Sure" && rawBloodGroup !== "Unknown"
          ? rawBloodGroup
          : undefined;

      const rawGender = String(input.formData.gender || "").toUpperCase();
      const normalizedGender: "MALE" | "FEMALE" | "OTHER" | undefined =
        rawGender === "MALE" || rawGender === "FEMALE" || rawGender === "OTHER"
          ? (rawGender as "MALE" | "FEMALE" | "OTHER")
          : undefined;

      const rawDob =
        input.formData.date_of_birth || input.formData.dateOfBirth || "";
      const parsedDob = rawDob ? new Date(rawDob) : null;
      const normalizedDob =
        parsedDob && !Number.isNaN(parsedDob.getTime())
          ? parsedDob.toISOString().slice(0, 10)
          : undefined;
      const registrationTypeRaw = String(input.formData.registration_type || "NEW").toUpperCase();
      const registrationType: BackendPatientInput["registrationType"] =
        registrationTypeRaw === "RETURNING" ||
        registrationTypeRaw === "EMERGENCY" ||
        registrationTypeRaw === "REFERRAL" ||
        registrationTypeRaw === "CORPORATE"
          ? (registrationTypeRaw as BackendPatientInput["registrationType"])
          : "NEW";
      const parseBool = (value: string | undefined): boolean | undefined => {
        const normalized = String(value || "").trim().toLowerCase();
        if (!normalized) return undefined;
        if (["true", "1", "yes", "y"].includes(normalized)) return true;
        if (["false", "0", "no", "n"].includes(normalized)) return false;
        return undefined;
      };

      const commonPayload: Partial<BackendPatientInput> = {
        ...(firstName ? { firstName } : {}),
        ...(lastName ? { lastName } : {}),
        ...(normalizedGender ? { gender: normalizedGender } : {}),
        ...(normalizedDob ? { dateOfBirth: normalizedDob } : {}),
        ...(normalizedBloodGroup ? { bloodGroup: normalizedBloodGroup } : {}),
        ...((input.formData.national_id_passport || input.formData.nationalId)
          ? { nationalId: input.formData.national_id_passport || input.formData.nationalId }
          : {}),
        ...(input.formData.phone ? { phone: input.formData.phone } : {}),
        ...(input.formData.email ? { email: input.formData.email } : {}),
        ...(input.formData.physical_address || input.formData.address
          ? { address: input.formData.physical_address || input.formData.address }
          : {}),
        ...(input.formData.allergies ? { allergies: input.formData.allergies } : {}),
        ...(input.formData.emergency_contact_name
          ? { nextOfKinName: input.formData.emergency_contact_name }
          : {}),
        ...(input.formData.emergency_contact_phone
          ? { nextOfKinPhone: input.formData.emergency_contact_phone }
          : {}),
        ...(input.formData.insurance_provider
          ? { insuranceProvider: input.formData.insurance_provider }
          : {}),
        ...(input.formData.insurance_member_id
          ? { insuranceNumber: input.formData.insurance_member_id }
          : {}),
        registrationType,
        emergencyContactRelationship:
          input.formData.emergency_contact_relationship || undefined,
        consultationFeePaid:
          parseBool(input.formData.consultation_fee_paid) ??
          (registrationType === "EMERGENCY" ? false : undefined),
        chronicConditions: input.formData.chronic_conditions || undefined,
        currentMedications: input.formData.current_medications || undefined,
        pastMedicalHistory: input.formData.past_medical_history || undefined,
        surgeries: input.formData.surgeries || undefined,
        preferredHospitalName: input.formData.preferred_hospital || undefined,
        primaryPhysicianName: input.formData.assigned_primary_physician || undefined,
        consentDataSharing: parseBool(input.formData.consent_data_sharing),
        consentMarketing: parseBool(input.formData.consent_marketing),
        consentTreatment: parseBool(input.formData.consent_treatment),
        consentVersion: input.formData.consent_version || undefined,
        consentAcceptedAt: input.formData.consent_accepted_at || undefined,
        portalAccessEnabled: parseBool(input.formData.portal_access_enabled),
        referralSource: input.formData.referral_source || undefined,
        duplicateOverrideReason: input.formData.duplicate_override_reason || undefined,
        facilityLinkNote: input.formData.facility_link_note || undefined,
        insuranceCoverageType: input.formData.insurance_coverage_type || undefined,
        insuranceExpiry: input.formData.insurance_expiry || undefined,
        insuranceCopayPercent: Number(input.formData.insurance_copay_percent || 0) || undefined,
        employer: input.formData.employer || undefined,
        maritalStatus: input.formData.marital_status || undefined,
        occupation: input.formData.occupation || undefined,
        county: input.formData.county || undefined,
      };

      if (input.patientId) {
        // Existing patient update should be partial; do not send invalid placeholders.
        return patch(`/tenant/patients/${input.patientId}`, commonPayload);
      }
      // New patient creation requires required fields; ensure safe defaults if missing.
      const createPayload: BackendPatientInput = {
        firstName: commonPayload.firstName || "New",
        lastName: commonPayload.lastName || "Patient",
        gender: commonPayload.gender || (registrationType === "EMERGENCY" ? "OTHER" : "MALE"),
        dateOfBirth: commonPayload.dateOfBirth || new Date().toISOString().slice(0, 10),
        ...(commonPayload.bloodGroup ? { bloodGroup: commonPayload.bloodGroup } : {}),
        ...(commonPayload.nationalId ? { nationalId: commonPayload.nationalId } : {}),
        ...(commonPayload.phone ? { phone: commonPayload.phone } : {}),
        ...(commonPayload.email ? { email: commonPayload.email } : {}),
        ...(commonPayload.address ? { address: commonPayload.address } : {}),
        ...(commonPayload.allergies ? { allergies: commonPayload.allergies } : {}),
        ...(commonPayload.nextOfKinName ? { nextOfKinName: commonPayload.nextOfKinName } : {}),
        ...(commonPayload.nextOfKinPhone ? { nextOfKinPhone: commonPayload.nextOfKinPhone } : {}),
        ...(commonPayload.insuranceProvider
          ? { insuranceProvider: commonPayload.insuranceProvider }
          : {}),
        ...(commonPayload.insuranceNumber ? { insuranceNumber: commonPayload.insuranceNumber } : {}),
        ...(commonPayload.registrationType ? { registrationType: commonPayload.registrationType } : {}),
        ...(commonPayload.emergencyContactRelationship
          ? { emergencyContactRelationship: commonPayload.emergencyContactRelationship }
          : {}),
        ...(commonPayload.consultationFeePaid !== undefined
          ? { consultationFeePaid: commonPayload.consultationFeePaid }
          : {}),
        ...(commonPayload.chronicConditions
          ? { chronicConditions: commonPayload.chronicConditions }
          : {}),
        ...(commonPayload.currentMedications
          ? { currentMedications: commonPayload.currentMedications }
          : {}),
        ...(commonPayload.pastMedicalHistory
          ? { pastMedicalHistory: commonPayload.pastMedicalHistory }
          : {}),
        ...(commonPayload.surgeries ? { surgeries: commonPayload.surgeries } : {}),
        ...(commonPayload.preferredHospitalName
          ? { preferredHospitalName: commonPayload.preferredHospitalName }
          : {}),
        ...(commonPayload.primaryPhysicianName
          ? { primaryPhysicianName: commonPayload.primaryPhysicianName }
          : {}),
        ...(commonPayload.consentDataSharing !== undefined
          ? { consentDataSharing: commonPayload.consentDataSharing }
          : {}),
        ...(commonPayload.consentMarketing !== undefined
          ? { consentMarketing: commonPayload.consentMarketing }
          : {}),
        ...(commonPayload.consentTreatment !== undefined
          ? { consentTreatment: commonPayload.consentTreatment }
          : {}),
        ...(commonPayload.consentVersion ? { consentVersion: commonPayload.consentVersion } : {}),
        ...(commonPayload.consentAcceptedAt
          ? { consentAcceptedAt: commonPayload.consentAcceptedAt }
          : {}),
        ...(commonPayload.portalAccessEnabled !== undefined
          ? { portalAccessEnabled: commonPayload.portalAccessEnabled }
          : {}),
        ...(commonPayload.referralSource ? { referralSource: commonPayload.referralSource } : {}),
        ...(commonPayload.duplicateOverrideReason
          ? { duplicateOverrideReason: commonPayload.duplicateOverrideReason }
          : {}),
        ...(commonPayload.facilityLinkNote
          ? { facilityLinkNote: commonPayload.facilityLinkNote }
          : {}),
        ...(commonPayload.insuranceCoverageType
          ? { insuranceCoverageType: commonPayload.insuranceCoverageType }
          : {}),
        ...(commonPayload.insuranceExpiry ? { insuranceExpiry: commonPayload.insuranceExpiry } : {}),
        ...(commonPayload.insuranceCopayPercent !== undefined
          ? { insuranceCopayPercent: commonPayload.insuranceCopayPercent }
          : {}),
        ...(commonPayload.employer ? { employer: commonPayload.employer } : {}),
        ...(commonPayload.maritalStatus ? { maritalStatus: commonPayload.maritalStatus } : {}),
        ...(commonPayload.occupation ? { occupation: commonPayload.occupation } : {}),
        ...(commonPayload.county ? { county: commonPayload.county } : {}),
      };
      return post("/tenant/patients", createPayload);
    },
    2: async () => {
      if (formId === "daily_care_plan") {
        const inpatientId = await resolveInpatientId();
        if (!inpatientId) {
          throw new Error("No active inpatient admission found. Admit patient first.");
        }

        let result: Response | null = null;
        const transferToBed = String(input.formData.transfer_to_bed || "").trim();
        if (transferToBed) {
          result = await post(`/ipd/${encodeURIComponent(inpatientId)}/transfer-bed`, {
            toBedId: transferToBed,
            reason: input.formData.transfer_reason || input.formData.nursing_notes || note || "",
          });
        }

        const hasChargeInput =
          Boolean(String(input.formData.daily_charge_description || "").trim()) ||
          Boolean(String(input.formData.charge_description || "").trim()) ||
          Boolean(String(input.formData.charge_unit_price || "").trim()) ||
          Boolean(String(input.formData.charge_quantity || "").trim());
        if (hasChargeInput) {
          result = await post(`/ipd/${encodeURIComponent(inpatientId)}/daily-charge`, {
            description:
              input.formData.daily_charge_description ||
              input.formData.charge_description ||
              input.formData.medication_schedule ||
              input.formData.nursing_notes ||
              "Daily inpatient care",
            quantity: input.formData.charge_quantity || input.formData.quantity || 1,
            unitPrice: input.formData.charge_unit_price || input.formData.unit_price || 0,
            notes: input.formData.nursing_notes || input.formData.notes || "",
          });
        }

        const requestDischarge = asBool(input.formData.request_discharge);
        if (requestDischarge) {
          result = await patch(`/ipd/${encodeURIComponent(inpatientId)}/request-discharge`, {
            notes: input.formData.nursing_notes || input.formData.notes || "",
          });
        }

        return (
          result ||
          logModuleEvent("module_2_daily_care_logged", {
            inpatientId,
            formData: input.formData,
          })
        );
      }

      if (formId === "discharge_form") {
        const inpatientId = await resolveInpatientId();
        if (!inpatientId) {
          throw new Error("No active inpatient admission found for discharge.");
        }

        const requestOnly = asBool(input.formData.request_discharge_only);
        if (requestOnly) {
          return patch(`/ipd/${encodeURIComponent(inpatientId)}/request-discharge`, {
            notes: input.formData.discharge_summary || input.formData.notes || "",
          });
        }

        return patch(`/ipd/${encodeURIComponent(inpatientId)}/discharge`, {
          finalDiagnosis: input.formData.final_diagnosis || "",
          dischargeSummary: input.formData.discharge_summary || "",
          outcome: input.formData.outcome || "",
          forceDischarge: asBool(input.formData.force_discharge),
          dischargeDate: input.formData.discharge_datetime || undefined,
        });
      }

      const payload = {
        patientId: input.patientId,
        visitId: input.formData.visitId || input.formData.visit_id || undefined,
        bedId: input.formData.bedId || input.formData.bed_id || input.formData.bed_selection || undefined,
        admittingDoctorId:
          input.formData.admittingDoctorId ||
          input.formData.admitting_doctor_id ||
          input.formData.admitting_doctor ||
          undefined,
        admissionType: input.formData.admission_type || "ELECTIVE",
        admissionReason: input.formData.admission_reason || note || undefined,
        initialDiagnosis: input.formData.initial_diagnosis || undefined,
        expectedLengthOfStayDays:
          input.formData.expected_length_of_stay || input.formData.expectedLengthOfStay || undefined,
        paymentMode: input.formData.payment_mode || "CASH",
        initialDeposit:
          input.formData.initial_deposit || input.formData.deposit_amount || input.formData.deposit || 0,
        admissionDate:
          input.formData.admission_datetime || input.formData.admission_date || dateTime || undefined,
        notes:
          input.formData.notes ||
          input.formData.monitoring_notes ||
          input.formData.nursing_notes ||
          note ||
          undefined,
      };
      try {
        return await post("/ipd/admit", payload);
      } catch (error) {
        // Fallback for legacy backends still using /in-patients/admit.
        return post("/in-patients/admit", payload);
      }
    },
    3: () => {
      if (formId === "triage_checkin") {
        return post("/opd/triage/checkin", {
          patientId: input.patientId,
          visitId: input.formData.visit_id || input.formData.visitId || undefined,
          visitType: input.formData.visit_type || undefined,
          doctorId: input.formData.doctor_id || input.formData.doctorId || undefined,
          departmentId: input.formData.department_id || "OPD",
          queueToken: input.formData.queue_token || undefined,
          queueLane: input.formData.queue_lane || undefined,
          arrivalConfirmed: asBool(input.formData.arrival_confirmed),
          paymentCategory: input.formData.payment_category || undefined,
          chiefComplaint: input.formData.chief_complaint || input.formData.symptoms || note || undefined,
          priority: input.formData.priority || input.formData.triage_classification || undefined,
        });
      }

      if (formId === "triage_assessment") {
        return post("/opd/triage/assessment", {
          patientId: input.patientId,
          visitId: input.formData.visit_id || input.formData.visitId || undefined,
          queueToken: input.formData.queue_token || undefined,
          symptoms: input.formData.symptoms || note || undefined,
          briefHistory: input.formData.brief_history || undefined,
          bloodPressure: input.formData.blood_pressure || input.formData.bp || undefined,
          temperature: input.formData.temperature || undefined,
          pulseRate: input.formData.pulse_rate || input.formData.pulse || undefined,
          respiratoryRate: input.formData.respiratory_rate || undefined,
          oxygenSaturation: input.formData.oxygen_saturation || undefined,
          weight: input.formData.weight || undefined,
          height: input.formData.height || undefined,
          bloodSugar: input.formData.blood_sugar_optional || undefined,
          triageClassification: input.formData.triage_classification || undefined,
          nextQueueRoute: input.formData.next_queue_route || undefined,
          triageScore: input.formData.triage_score || undefined,
          firstAidActions: input.formData.first_aid_actions || undefined,
          notifyPatient: asBool(input.formData.notify_patient),
        });
      }

      return post("/visits", {
        patientId: input.patientId,
        visitType: "TRIAGE",
        status: "TRIAGE",
        reason: input.formData.symptoms || note || "Triage entry",
      });
    },
    4: () =>
      post("/appointments", {
        patientId: input.patientId,
        dateTime,
        type: input.formData.type || "FOLLOW_UP",
        status: "SCHEDULED",
      }),
    5: () =>
      logModuleEvent("module_5_bed_ward_management", {
        formData: input.formData,
      }),
    6: () =>
      post("/medical-records/visit-entry", {
        visitId: input.formData.visitId || input.formData.visit_id || undefined,
        patientId: input.patientId || undefined,
        doctorId: input.formData.doctor_id || input.formData.doctorId || undefined,
        visitDate: input.formData.visit_datetime || undefined,
        visitType: input.formData.visit_type || "OPD",
        status: input.formData.visit_status || "OPEN",
        chiefComplaint:
          input.formData.chiefComplaint ||
          input.formData.chief_complaint ||
          note ||
          "Clinical note",
        history:
          input.formData.history ||
          input.formData.hpi ||
          input.formData.history_of_present_illness ||
          undefined,
        examination:
          input.formData.examination ||
          input.formData.examination_findings ||
          input.formData.physical_examination ||
          undefined,
        assessment:
          input.formData.assessment ||
          input.formData.diagnosis ||
          undefined,
        plan:
          input.formData.plan ||
          input.formData.treatment_plan ||
          undefined,
        diagnoses: input.formData.diagnosis
          ? String(input.formData.diagnosis)
              .split(/\n|,|;/g)
              .map((entry) => entry.trim())
              .filter(Boolean)
          : undefined,
        attachments: input.formData.attachments
          ? String(input.formData.attachments)
              .split(",")
              .map((entry) => entry.trim())
              .filter(Boolean)
          : [],
        vitals: {
          bloodPressure: input.formData.bp || input.formData.blood_pressure || undefined,
          temperature: input.formData.temperature || undefined,
          pulseRate: input.formData.pulse || input.formData.pulse_rate || undefined,
          respiratoryRate: input.formData.respiratory_rate || undefined,
          oxygenSaturation: input.formData.oxygen_saturation || undefined,
          weight: input.formData.weight || undefined,
          height: input.formData.height || undefined,
        },
      }),
    7: () => {
      if (formId === "shift_handover") {
        return post("/nursing-notes/shift-handover", {
          patientId: input.patientId || undefined,
          visitId: input.formData.visitId || input.formData.visit_id || undefined,
          nurseName: input.formData.nurse_name || undefined,
          criticalPatients: input.formData.critical_patients || undefined,
          pendingTasks: input.formData.pending_tasks || undefined,
          vitalsTrends: input.formData.vitals_trends || undefined,
          notes: input.formData.notes || note || undefined,
          acknowledged: input.formData.acknowledged || undefined,
        });
      }

      if (formId === "incident_report") {
        return post("/nursing-notes/incident", {
          patientId: input.patientId || undefined,
          visitId: input.formData.visitId || input.formData.visit_id || undefined,
          category: input.formData.incident_category || "GENERAL",
          severity: input.formData.incident_severity || "MEDIUM",
          status: input.formData.incident_status || "OPEN",
          description: input.formData.incident_description || note || "",
          actionTaken: input.formData.action_taken || undefined,
        });
      }

      if (formId === "nursing_task") {
        return post("/nursing-notes/task", {
          patientId: input.patientId || undefined,
          visitId: input.formData.visitId || input.formData.visit_id || undefined,
          title: input.formData.task_title || "Nursing Task",
          details: input.formData.task_details || note || "",
          status: input.formData.task_status || "PENDING",
          priority: input.formData.task_priority || "MEDIUM",
          dueAt: input.formData.task_due_at || undefined,
          assignedToNurseName: input.formData.nurse_name || undefined,
        });
      }

      return post("/nursing-notes/entry", {
        patientId: input.patientId || undefined,
        visitId: input.formData.visitId || input.formData.visit_id || undefined,
        prescriptionId: input.formData.prescription_id || undefined,
        medicationStatus: input.formData.medication_status || undefined,
        route: input.formData.med_route || undefined,
        dose: input.formData.med_dose || undefined,
        scheduledTime: input.formData.scheduled_time || undefined,
        actualTime: input.formData.actual_time || undefined,
        missedDoseReason: input.formData.missed_dose_reason || undefined,
        note:
          input.formData.nursing_notes ||
          input.formData.notes ||
          note ||
          "Nursing progress update",
        painScore: input.formData.pain_score || undefined,
        medication_schedule: input.formData.medication_schedule || undefined,
        med_admin: input.formData.med_admin || undefined,
        wound_care: input.formData.wound_care || undefined,
        nursing_diagnosis: input.formData.nursing_diagnosis || undefined,
        care_goal: input.formData.care_goal || undefined,
        intervention: input.formData.intervention || undefined,
        evaluation: input.formData.evaluation || undefined,
        oral_intake_ml: input.formData.oral_intake_ml || undefined,
        iv_intake_ml: input.formData.iv_intake_ml || undefined,
        urine_output_ml: input.formData.urine_output_ml || undefined,
        stool_output_ml: input.formData.stool_output_ml || undefined,
        drain_output_ml: input.formData.drain_output_ml || undefined,
        vomit_output_ml: input.formData.vomit_output_ml || undefined,
        intake_output_notes: input.formData.intake_output_notes || undefined,
        task_details: input.formData.pending_tasks || undefined,
        vitals: {
          bloodPressure: input.formData.bp || undefined,
          temperature: input.formData.temperature || undefined,
          pulseRate: input.formData.pulse || undefined,
          respiratoryRate: input.formData.respiratory_rate || undefined,
          oxygenSaturation: input.formData.oxygen_saturation || undefined,
          weight: input.formData.weight || undefined,
          height: input.formData.height || undefined,
        },
      });
    },
    8: () => {
      if (formId === "lab_test_request") {
        return post("/laboratory/request", {
          patientId: input.patientId,
          visitId: input.formData.visit_id || input.formData.visitId || undefined,
          doctorId: input.formData.doctor_id || input.formData.doctorId || undefined,
          testName:
            input.formData.test_name ||
            input.formData.testType ||
            input.formData.test_type ||
            input.formData.test ||
            "General Lab",
          testCode: input.formData.test_code || undefined,
          testCategory: input.formData.test_category || undefined,
          sampleType: input.formData.sample_type || undefined,
          priority: input.formData.urgency || input.formData.priority || "ROUTINE",
          clinicalNotes: input.formData.clinical_notes || note || undefined,
          turnaroundHours: input.formData.turnaround_hours || undefined,
          testPrice: input.formData.test_price || undefined,
          insuranceType: input.formData.insurance_type || undefined,
        });
      }

      if (formId === "lab_sample_collection") {
        const requestId = String(input.formData.request_id || "").trim();
        if (!requestId) {
          throw new Error("Lab request ID is required for sample collection.");
        }
        return post(`/laboratory/request/${encodeURIComponent(requestId)}/collect-sample`, {
          sampleId: input.formData.sample_id || undefined,
          sampleType: input.formData.sample_type || undefined,
          sampleCondition: input.formData.sample_condition || undefined,
          storageLocation: input.formData.storage_location || undefined,
          collectionTime: input.formData.collection_time || undefined,
          collectedBy: input.formData.collected_by || undefined,
          notes: input.formData.notes || undefined,
        });
      }

      if (formId === "lab_result_entry") {
        return post("/laboratory/result", {
          requestId: input.formData.request_id || undefined,
          measuredValue: input.formData.measured_value || undefined,
          unit: input.formData.unit || undefined,
          referenceRange: input.formData.reference_range || undefined,
          resultFlag: input.formData.result_flag || undefined,
          interpretationNotes:
            input.formData.interpretation_notes || input.formData.technician_notes || undefined,
          rawResult: input.formData.raw_result || input.formData.test_results || note || undefined,
          criticalResult: asBool(input.formData.critical_result),
          attachments: input.formData.result_scan ? [input.formData.result_scan] : [],
        });
      }

      if (formId === "lab_result_verification") {
        const requestId = String(input.formData.request_id || "").trim();
        if (!requestId) {
          throw new Error("Lab request ID is required for verification.");
        }
        if (asBool(input.formData.release_now)) {
          return post("/laboratory/result/release", {
            requestId,
            resultId: input.formData.result_id || undefined,
            releaseNotes:
              input.formData.release_notes || input.formData.verification_notes || undefined,
          });
        }
        return post("/laboratory/result/verify", {
          requestId,
          resultId: input.formData.result_id || undefined,
          verificationNotes: input.formData.verification_notes || undefined,
          releaseNow: false,
        });
      }

      return post("/laboratory/request", {
        patientId: input.patientId,
        visitId: input.formData.visitId || input.formData.visit_id,
        testName: input.formData.testType || input.formData.test || "General Lab",
      });
    },
    9: () => {
      if (formId === "imaging_modality_setup") {
        return post("/radiology/modality", {
          modalityName:
            input.formData.modality_name || input.formData.modalityName || undefined,
          modalityType:
            input.formData.modality_type || input.formData.modalityType || undefined,
          machineSerialNumber:
            input.formData.machine_serial_number ||
            input.formData.machineSerialNumber ||
            undefined,
          roomName: input.formData.room_name || input.formData.roomName || undefined,
          status: input.formData.machine_status || input.formData.status || undefined,
          maintenanceStatus:
            input.formData.maintenance_status ||
            input.formData.maintenanceStatus ||
            undefined,
          assignedTechnicianId:
            input.formData.technician_id || input.formData.assignedTechnicianId || undefined,
          notes: input.formData.modality_notes || input.formData.notes || undefined,
        });
      }

      if (formId === "imaging_schedule") {
        return post("/radiology/schedule", {
          requestId: input.formData.request_id || input.formData.requestId || undefined,
          modalityId: input.formData.modality_id || input.formData.modalityId || undefined,
          modalityType:
            input.formData.modality_type || input.formData.modalityType || undefined,
          technicianId:
            input.formData.technician_id || input.formData.technicianId || undefined,
          scheduledAt:
            input.formData.scheduled_at ||
            input.formData.scheduledAt ||
            input.formData.schedule_at ||
            undefined,
          estimatedDurationMinutes: Number(input.formData.estimated_duration_minutes || 0) || 0,
          contrastPrepRequired: asBool(input.formData.contrast_prep_required),
          fastingRequired: asBool(input.formData.fasting_required),
          prepNotes: input.formData.prep_notes || undefined,
          status: input.formData.schedule_status || input.formData.status || undefined,
        });
      }

      if (formId === "imaging_status_transition") {
        const requestId = String(
          input.formData.request_id || input.formData.requestId || "",
        ).trim();
        if (!requestId) {
          throw new Error("Radiology request ID is required for status update.");
        }
        return patch(`/radiology/request/${encodeURIComponent(requestId)}/status`, {
          status: input.formData.request_status || input.formData.status || "REQUESTED",
          notes: input.formData.transition_notes || input.formData.notes || undefined,
        });
      }

      if (formId === "imaging_report_entry") {
        return post("/radiology/report", {
          requestId: input.formData.request_id || input.formData.requestId || undefined,
          findings: input.formData.report_findings || input.formData.findings || note || "",
          conclusion:
            input.formData.impression || input.formData.conclusion || undefined,
          reportStatus: input.formData.report_status || undefined,
          technique: input.formData.technique || undefined,
          contrastUsed: input.formData.contrast_used || undefined,
          recommendations: input.formData.recommendations || undefined,
          criticalFindings: asBool(input.formData.critical_findings),
          criticalType: input.formData.critical_type || undefined,
          criticalMessage: input.formData.critical_message || undefined,
          aiModelVersion: input.formData.ai_model_version || undefined,
          aiConfidence: Number(input.formData.ai_confidence || 0) || undefined,
          aiOutput: input.formData.ai_output || undefined,
          imageUrls: [
            input.formData.upload_images,
            input.formData.upload_scan_document_photo,
          ].filter(Boolean),
        });
      }

      if (formId === "imaging_study_metadata") {
        return post("/radiology/study", {
          requestId: input.formData.request_id || input.formData.requestId || undefined,
          pacsStudyUid: input.formData.pacs_study_uid || undefined,
          pacsSeriesUid: input.formData.pacs_series_uid || undefined,
          modalityType:
            input.formData.study_modality_type || input.formData.modality_type || undefined,
          imageCount: Number(input.formData.image_count || 0) || 0,
          studyStatus: input.formData.study_status || undefined,
          viewerUrl: input.formData.viewer_url || undefined,
          accessToken: input.formData.viewer_access_token || undefined,
        });
      }

      if (formId === "imaging_critical_alert") {
        return post("/radiology/critical-alert", {
          requestId: input.formData.request_id || input.formData.requestId || undefined,
          severity: input.formData.alert_severity || undefined,
          type: input.formData.alert_type || undefined,
          message: input.formData.alert_message || note || undefined,
          notifiedToDoctorId:
            input.formData.notified_doctor_id || input.formData.doctor_id || undefined,
          acknowledged: asBool(input.formData.acknowledged),
        });
      }

      return post("/radiology/request", {
        patientId: input.patientId || input.formData.patient_id || undefined,
        visitId: input.formData.visit_id || input.formData.visitId || undefined,
        doctorId: input.formData.doctor_id || input.formData.doctorId || undefined,
        procedureName:
          input.formData.imaging_type ||
          input.formData.procedure_name ||
          input.formData.type ||
          "X-RAY",
        imagingType:
          input.formData.imaging_type || input.formData.procedure_name || undefined,
        bodyRegion: input.formData.body_region || undefined,
        clinicalIndication: input.formData.clinical_indication || note || undefined,
        urgency: input.formData.urgency || "ROUTINE",
        contrastRequired: asBool(input.formData.contrast_required),
        contrastType: input.formData.contrast_type || undefined,
        specialInstructions: input.formData.special_instructions || undefined,
        provisionalDiagnosis: input.formData.provisional_diagnosis || undefined,
        orderSource: input.formData.order_source || undefined,
        modalityId: input.formData.modality_id || undefined,
        scheduleAt:
          input.formData.schedule_at || input.formData.scheduled_at || undefined,
        status: input.formData.request_status || undefined,
      });
    },
    10: () => {
      if (formId === "pharmacy_prescription_order") {
        return post("/pharmacy/prescription", {
          visitId: input.formData.visit_id || input.formData.visitId || undefined,
          patientId: input.patientId || input.formData.patient_id || undefined,
          doctorId: input.formData.doctor_id || input.formData.doctorId || undefined,
          medication: input.formData.medication || "N/A",
          dosage: input.formData.dosage || "As directed",
          frequency: input.formData.frequency || "As directed",
          duration: input.formData.duration || "As directed",
          notes: input.formData.notes || note || undefined,
          prescriptionQuantity:
            input.formData.prescription_quantity || input.formData.quantity || undefined,
          insuranceEligible: asBool(input.formData.insurance_eligible),
          controlledStatus: asBool(input.formData.controlled_status),
          requiresPrescription: asBool(input.formData.requires_prescription),
        });
      }

      if (formId === "pharmacy_prescription_review") {
        const prescriptionId = String(
          input.formData.prescription_id || input.formData.prescriptionId || "",
        ).trim();
        if (!prescriptionId) {
          throw new Error("Prescription ID is required for review.");
        }
        return patch(`/pharmacy/prescription/${encodeURIComponent(prescriptionId)}/review`, {
          status: input.formData.review_status || input.formData.status || "IN_REVIEW",
          notes: input.formData.notes || undefined,
          interactionFlag: asBool(input.formData.interaction_flag),
          allergyFlag: asBool(input.formData.allergy_flag),
        });
      }

      if (formId === "pharmacy_dispense") {
        const prescriptionId = String(
          input.formData.prescription_id || input.formData.prescriptionId || "",
        ).trim();
        if (!prescriptionId) {
          throw new Error("Prescription ID is required for dispensing.");
        }
        return post("/pharmacy/dispense", {
          prescriptionId,
          medicineId: input.formData.medicine_id || input.formData.medicineId || undefined,
          medicineName: input.formData.medicine_name || input.formData.medication || undefined,
          quantity: Number(input.formData.quantity || 0),
          pharmacistId:
            input.formData.pharmacist_id || input.formData.pharmacistId || undefined,
          controlledStatus: asBool(input.formData.controlled_status),
          insuranceCovered: asBool(input.formData.insurance_covered),
          paymentMethod: input.formData.payment_method || undefined,
          markPaid: asBool(input.formData.mark_paid),
          notes: input.formData.notes || note || undefined,
        });
      }

      return post("/pharmacy/prescription", {
        visitId: input.formData.visit_id || input.formData.visitId || undefined,
        patientId: input.patientId,
        medication: input.formData.medication || "N/A",
        dosage: input.formData.dosage || "As directed",
      });
    },
    11: () => {
      if (formId === "ot_team_assignment") {
        return post("/ot/team", {
          bookingId: input.formData.booking_id || input.formData.bookingId || undefined,
          staffId: input.formData.staff_id || input.formData.staffId || undefined,
          role: input.formData.team_role || input.formData.role || undefined,
        });
      }

      if (formId === "ot_pre_op_assessment") {
        return post("/ot/pre-op", {
          bookingId: input.formData.booking_id || input.formData.bookingId || undefined,
          medical_history_reviewed: asBool(input.formData.medical_history_reviewed),
          lab_reviewed: asBool(input.formData.lab_reviewed),
          imaging_reviewed: asBool(input.formData.imaging_reviewed),
          anesthesia_cleared: asBool(input.formData.anesthesia_cleared),
          consent_uploaded: asBool(input.formData.consent_uploaded),
          blood_available_confirmed: asBool(input.formData.blood_available_confirmed),
          fasting_confirmed: asBool(input.formData.fasting_confirmed),
          allergies_documented: asBool(input.formData.allergies_documented),
          clearance_notes: input.formData.clearance_notes || undefined,
          blocked_reason: input.formData.blocked_reason || undefined,
        });
      }

      if (formId === "ot_safety_checklist") {
        return post("/ot/checklist", {
          bookingId: input.formData.booking_id || input.formData.bookingId || undefined,
          phase: input.formData.checklist_phase || undefined,
          procedure_confirmed: asBool(input.formData.procedure_confirmed),
          team_confirmed: asBool(input.formData.team_confirmed),
          instrument_count_correct: asBool(input.formData.instrument_count_correct),
          sponge_count_correct: asBool(input.formData.sponge_count_correct),
          specimen_labeling_confirmed: asBool(input.formData.specimen_labeling_confirmed),
          notes: input.formData.checklist_notes || undefined,
        });
      }

      if (formId === "ot_intra_op_record") {
        return post("/ot/intra-op", {
          bookingId: input.formData.booking_id || input.formData.bookingId || undefined,
          incision_time: input.formData.incision_time || undefined,
          closure_time: input.formData.closure_time || undefined,
          anesthesia_start: input.formData.anesthesia_start || undefined,
          anesthesia_stop: input.formData.anesthesia_stop || undefined,
          surgical_steps: input.formData.surgical_steps || undefined,
          blood_loss_ml: Number(input.formData.blood_loss_ml || 0) || undefined,
          fluids_given_ml: Number(input.formData.fluids_given_ml || 0) || undefined,
          implants_used: input.formData.implants_used || undefined,
          specimens_sent: input.formData.specimens_sent || undefined,
          complications: input.formData.complications || undefined,
          notes: input.formData.intra_op_notes || undefined,
        });
      }

      if (formId === "ot_anesthesia_record") {
        return post("/ot/anesthesia", {
          bookingId: input.formData.booking_id || input.formData.bookingId || undefined,
          anesthesia_type: input.formData.anesthesia_type || undefined,
          induction_agents: input.formData.induction_agents || undefined,
          maintenance_agents: input.formData.maintenance_agents || undefined,
          ventilation_parameters: input.formData.ventilation_parameters || undefined,
          intubation_details: input.formData.intubation_details || undefined,
          oxygen_levels: input.formData.oxygen_levels || undefined,
          aldrete_score: Number(input.formData.aldrete_score || 0) || undefined,
          complications: input.formData.complications || undefined,
          notes: input.formData.anesthesia_notes || undefined,
        });
      }

      if (formId === "ot_inventory_usage") {
        return post("/ot/inventory-usage", {
          bookingId: input.formData.booking_id || input.formData.bookingId || undefined,
          item_name: input.formData.item_name || undefined,
          lot_number: input.formData.lot_number || undefined,
          expiry_date: input.formData.expiry_date || undefined,
          quantity: Number(input.formData.quantity || 0) || undefined,
          sterilization_status: input.formData.sterilization_status || undefined,
          implant_tracked: asBool(input.formData.implant_tracked),
          notes: input.formData.inventory_notes || undefined,
        });
      }

      if (formId === "post_op_notes") {
        return post("/ot/post-op", {
          bookingId:
            input.formData.booking_id ||
            input.formData.bookingId ||
            input.formData.surgery_id ||
            undefined,
          recovery_vitals: input.formData.recovery_vitals || undefined,
          pain_score: Number(input.formData.pain_score || 0) || undefined,
          consciousness_level: input.formData.consciousness_level || undefined,
          bleeding_status: input.formData.bleeding_status || undefined,
          wound_status: input.formData.wound_status || undefined,
          post_op_orders: input.formData.post_op_orders || undefined,
          icu_transfer_required: asBool(input.formData.icu_transfer_required),
          disposition: input.formData.disposition || undefined,
          recovery_notes: input.formData.recovery_notes || note || undefined,
        });
      }

      if (formId === "ot_complication") {
        return post("/ot/complication", {
          bookingId: input.formData.booking_id || input.formData.bookingId || undefined,
          complication_type: input.formData.complication_type || undefined,
          severity: input.formData.severity || undefined,
          description: input.formData.description || input.formData.notes || undefined,
          action_taken: input.formData.action_taken || undefined,
          requires_icu: asBool(input.formData.requires_icu),
          mortality: asBool(input.formData.mortality),
          occurred_at: input.formData.occurred_at || undefined,
        });
      }

      if (formId === "ot_status_transition") {
        const bookingId = String(
          input.formData.booking_id || input.formData.bookingId || "",
        ).trim();
        if (!bookingId) {
          throw new Error("OT booking ID is required for status transition.");
        }
        return patch(`/ot/booking/${encodeURIComponent(bookingId)}/status`, {
          status: input.formData.next_status || input.formData.status || "SCHEDULED",
          notes: input.formData.transition_notes || undefined,
        });
      }

      if (formId === "ot_outcome_note") {
        return post("/ot/note", {
          bookingId: input.formData.booking_id || input.formData.bookingId || undefined,
          surgeonId: input.formData.surgeon_id || input.formData.surgeonId || undefined,
          notes: input.formData.surgery_notes || note || "",
          complications: input.formData.complications || undefined,
        });
      }

      return post("/ot/booking", {
        patientId: input.patientId || input.formData.patient_id || undefined,
        procedure:
          input.formData.procedure_name ||
          input.formData.surgery_type ||
          input.formData.procedure ||
          "GENERAL_SURGERY",
        scheduledDate:
          input.formData.scheduled_date ||
          input.formData.datetime ||
          input.formData.scheduled_at ||
          dateTime,
        status: input.formData.status || "REQUESTED",
        surgeon: input.formData.surgeon || undefined,
        surgeonId: input.formData.surgeon_id || undefined,
        anesthesiaType: input.formData.anesthesia_type || undefined,
        procedureType: input.formData.procedure_type || undefined,
        estimatedDurationMinutes:
          Number(input.formData.estimated_duration_minutes || 0) || undefined,
        priority: input.formData.priority || undefined,
        otRoom: input.formData.ot_room || undefined,
        requiredBloodUnits: Number(input.formData.required_blood_units || 0) || undefined,
        requiredEquipment: input.formData.required_equipment || undefined,
        specialInstructions: input.formData.special_instructions || undefined,
        consentUploaded: asBool(input.formData.consent_uploaded),
      });
    },
    12: () => {
      if (formId === "donor_registration") {
        return post("/blood-bank/donor", {
          firstName: input.formData.first_name || input.formData.firstName || "",
          lastName: input.formData.last_name || input.formData.lastName || "",
          gender: input.formData.gender || undefined,
          bloodGroup: input.formData.blood_type || input.formData.bloodGroup || undefined,
          phone: input.formData.phone || undefined,
          email: input.formData.email || undefined,
          nationalId: input.formData.national_id || input.formData.nationalId || undefined,
          dateOfBirth: input.formData.date_of_birth || input.formData.dateOfBirth || undefined,
          donorType: input.formData.donor_type || undefined,
          eligible: asBool(input.formData.eligible),
          deferralReason: input.formData.deferral_reason || undefined,
          hbLevel: input.formData.hb_level || undefined,
          nextEligibleDate: input.formData.next_eligible_date || undefined,
        });
      }

      if (formId === "donation_collection") {
        const donorId = String(input.formData.donor_id || input.formData.donorId || "").trim();
        if (!donorId) {
          throw new Error("Donor ID is required for donation collection.");
        }
        return post(`/blood-bank/donation/${encodeURIComponent(donorId)}`, {
          units_collected: Number(input.formData.units_collected || 1),
          component_type: input.formData.component_type || undefined,
          component_units: Number(input.formData.component_units || 0) || undefined,
          expiry_date: input.formData.expiry_date || undefined,
          storage_location: input.formData.storage_location || undefined,
          technician_id: input.formData.technician_id || undefined,
          collection_location: input.formData.collection_location || undefined,
          screening_summary: input.formData.screening_summary || undefined,
        });
      }

      if (formId === "blood_request") {
        return post("/blood-bank/request", {
          patientId: input.patientId || input.formData.patient_id || undefined,
          visitId: input.formData.visit_id || input.formData.visitId || undefined,
          bloodGroup: input.formData.blood_type || input.formData.bloodGroup || undefined,
          componentType: input.formData.component_type || undefined,
          unitsRequested: Number(input.formData.units_requested || 1),
          urgency: input.formData.urgency || "ROUTINE",
          department: input.formData.department || undefined,
          indication: input.formData.indication || note || undefined,
        });
      }

      if (formId === "blood_crossmatch") {
        return post("/blood-bank/crossmatch", {
          requestId: input.formData.request_id || input.formData.requestId || undefined,
          patientId: input.patientId || input.formData.patient_id || undefined,
          patientBloodGroup:
            input.formData.patient_blood_group || input.formData.patientBloodGroup || undefined,
          donorBloodGroup:
            input.formData.donor_blood_group || input.formData.donorBloodGroup || undefined,
          antibody_screen: input.formData.antibody_screen || undefined,
          reaction_risk: input.formData.reaction_risk || undefined,
          notes: input.formData.notes || undefined,
        });
      }

      if (formId === "issue_blood") {
        return post("/blood-bank/issue", {
          patientId: input.patientId || input.formData.patient_id || undefined,
          requestId: input.formData.request_id || input.formData.requestId || undefined,
          bloodGroup: input.formData.blood_type || input.formData.bloodGroup || "O+",
          patientBloodGroup:
            input.formData.patient_blood_group || input.formData.patientBloodGroup || undefined,
          componentType: input.formData.component_type || undefined,
          unitsIssued: Number(input.formData.units_issued || 1),
          componentId: input.formData.component_id || input.formData.componentId || undefined,
          issued_to: input.formData.issued_to || undefined,
          urgency: input.formData.urgency || undefined,
        });
      }

      if (formId === "transfusion_record") {
        return post("/blood-bank/transfusion", {
          patientId: input.patientId || input.formData.patient_id || undefined,
          issueId: input.formData.issue_id || input.formData.issueId || undefined,
          requestId: input.formData.request_id || input.formData.requestId || undefined,
          componentId: input.formData.component_id || input.formData.componentId || undefined,
          bloodGroup: input.formData.blood_type || input.formData.bloodGroup || undefined,
          componentType: input.formData.component_type || undefined,
          started_at: input.formData.started_at || undefined,
          completed_at: input.formData.completed_at || undefined,
          administered_by: input.formData.administered_by || undefined,
          pre_vitals: input.formData.pre_vitals
            ? { notes: input.formData.pre_vitals }
            : undefined,
          intra_vitals: input.formData.intra_vitals
            ? { notes: input.formData.intra_vitals }
            : undefined,
          post_vitals: input.formData.post_vitals
            ? { notes: input.formData.post_vitals }
            : undefined,
          reaction_observed: asBool(input.formData.reaction_observed),
          follow_up_notes: input.formData.follow_up_notes || undefined,
        });
      }

      if (formId === "transfusion_reaction") {
        return post("/blood-bank/reaction", {
          patientId: input.patientId || input.formData.patient_id || undefined,
          transfusionId: input.formData.transfusion_id || input.formData.transfusionId || undefined,
          issueId: input.formData.issue_id || input.formData.issueId || undefined,
          severity: input.formData.severity || "MEDIUM",
          symptoms: input.formData.symptoms || note || "",
          action_taken: input.formData.action_taken || undefined,
          outcome: input.formData.outcome || undefined,
        });
      }

      if (formId === "blood_expiry_discard") {
        return post("/blood-bank/expiry-discard", {
          componentId: input.formData.component_id || input.formData.componentId || undefined,
          bloodGroup: input.formData.blood_type || input.formData.bloodGroup || undefined,
          componentType: input.formData.component_type || undefined,
          units: Number(input.formData.units || 1),
          reason: input.formData.reason || "EXPIRED",
          discarded_at: input.formData.discarded_at || undefined,
          notes: input.formData.notes || undefined,
        });
      }

      return post("/blood-bank/issue", {
        patientId: input.patientId || undefined,
        bloodGroup: input.formData.blood_type || input.formData.bloodGroup || "O+",
        patientBloodGroup:
          input.formData.patient_blood_group || input.formData.patientBloodGroup || undefined,
        componentType: input.formData.component_type || "WHOLE_BLOOD",
        unitsIssued: Number(input.formData.units_issued || input.formData.quantity || 1),
      });
    },
    13: () => {
      const billId = String(
        input.formData.invoice_id || input.formData.bill_id || input.formData.billId || "",
      ).trim();

      if (formId === "billing_charge_capture") {
        const patientId = String(input.patientId || input.formData.patient_id || "").trim();
        if (!billId && !patientId) {
          throw new Error("Select a patient or provide Invoice ID before capturing a charge.");
        }
        return post("/billing/charge", {
          billId: billId || undefined,
          patientId: patientId || undefined,
          visitId: input.formData.visit_id || input.formData.visitId || undefined,
          chargeType: input.formData.charge_type || "SERVICE",
          serviceName: input.formData.service_name || undefined,
          description: input.formData.description || note || undefined,
          quantity: Number(input.formData.quantity || 1),
          amount: Number(input.formData.amount || 0),
          discountAmount: Number(input.formData.discount_amount || 0) || 0,
          taxRate: Number(input.formData.tax_rate || 0) || 0,
          sourceModule: input.formData.source_module || undefined,
        });
      }

      if (formId === "billing_payment_receipt") {
        if (!billId) {
          throw new Error("Invoice ID is required to post payment.");
        }
        return post(`/billing/bill/${encodeURIComponent(billId)}/payment`, {
          amount: Number(input.formData.amount_paid || 0),
          method: input.formData.payment_method || "CASH",
          transactionId:
            input.formData.transaction_id || input.formData.reference_number || undefined,
          referenceNumber: input.formData.reference_number || undefined,
        });
      }

      if (formId === "billing_discount_approval") {
        if (!billId) {
          throw new Error("Invoice ID is required to apply discount.");
        }
        return post(`/billing/bill/${encodeURIComponent(billId)}/discount`, {
          amount: Number(input.formData.discount_amount || 0),
          type: input.formData.discount_type || "MANUAL",
          reason: input.formData.reason || note || undefined,
          approved: asBool(input.formData.approved),
          requestedBy: input.formData.requested_by || undefined,
          approvedBy: input.formData.approved_by || undefined,
        });
      }

      if (formId === "billing_refund_processing") {
        if (!billId) {
          throw new Error("Invoice ID is required to process refund.");
        }
        return post(`/billing/bill/${encodeURIComponent(billId)}/refund`, {
          amount: Number(input.formData.refund_amount || 0),
          method: input.formData.refund_method || "CASH",
          reason: input.formData.reason || note || undefined,
          approvedBy: input.formData.approved_by || undefined,
        });
      }

      if (formId === "billing_revenue_snapshot") {
        const query = new URLSearchParams();
        if (input.formData.from_date) query.set("fromDate", input.formData.from_date);
        if (input.formData.to_date) query.set("toDate", input.formData.to_date);
        if (input.formData.group_by) query.set("groupBy", input.formData.group_by);
        const qs = query.toString();
        return apiFetch(`/billing/report${qs ? `?${qs}` : ""}`);
      }

      return post("/billing/bill", {
        patientId: input.patientId || input.formData.patient_id || undefined,
        visitId: input.formData.visit_id || input.formData.visitId || undefined,
        reuseOpenBill: asBool(input.formData.open_bill || "true"),
        amount: Number(input.formData.amount || 0),
        description: input.formData.description || input.formData.invoice_notes || undefined,
        insuranceDeduction: Number(input.formData.insurance_deduction || 0) || 0,
        source: input.formData.source_module || "BILLING",
      });
    },
    14: () => {
      if (formId === "insurance_profile") {
        return post("/insurance/profile", {
          patientId: input.patientId || input.formData.patient_id || undefined,
          provider: input.formData.provider || undefined,
          policyNumber: input.formData.policy_number || undefined,
          coverageType: input.formData.coverage_type || undefined,
          expiryDate: input.formData.expiry_date || undefined,
          copayPercent: Number(input.formData.copay_percent || 0) || undefined,
          employer: input.formData.employer || undefined,
          isActive: asBool(input.formData.is_active),
        });
      }

      if (formId === "pre_authorization") {
        return post("/insurance/pre-authorization", {
          claimId: input.formData.claim_id || undefined,
          patientId: input.patientId || input.formData.patient_id || undefined,
          procedureCode: input.formData.procedure_code || undefined,
          procedureName: input.formData.procedure_name || undefined,
          estimatedCost: Number(input.formData.estimated_cost || 0) || undefined,
          urgency: input.formData.urgency || undefined,
          status: input.formData.status || undefined,
          responseNotes: input.formData.response_notes || undefined,
        });
      }

      if (formId === "claim_status_update") {
        const claimId = String(input.formData.claim_id || "").trim();
        if (!claimId) {
          throw new Error("Claim ID is required for claim status update.");
        }
        return patch(`/insurance/claim/${encodeURIComponent(claimId)}/status`, {
          status: input.formData.status || "PENDING",
          approvedAmount: Number(input.formData.approved_amount || 0) || undefined,
          deniedAmount: Number(input.formData.denied_amount || 0) || undefined,
          denialCode: input.formData.denial_code || undefined,
          providerReference: input.formData.provider_reference || undefined,
          reason: input.formData.reason || undefined,
        });
      }

      if (formId === "claim_payment_reconciliation") {
        const claimId = String(input.formData.claim_id || "").trim();
        if (!claimId) {
          throw new Error("Claim ID is required for payment reconciliation.");
        }
        return post(`/insurance/claim/${encodeURIComponent(claimId)}/payment`, {
          approvedAmount: Number(input.formData.approved_amount || 0) || undefined,
          amount: Number(input.formData.amount_paid || 0) || undefined,
          method: input.formData.payment_method || "TRANSFER",
          transactionId: input.formData.transaction_id || undefined,
          referenceNumber: input.formData.reference_number || undefined,
          notes: input.formData.notes || undefined,
        });
      }

      return post("/insurance/claim", {
        patientId: input.patientId || input.formData.patient_id || undefined,
        billId: input.formData.bill_id || input.formData.billId || undefined,
        provider: input.formData.provider || "Unknown",
        memberId: input.formData.member_id || input.formData.memberId || "",
        claimAmount: Number(input.formData.claim_amount || 0) || undefined,
        serviceCategory: input.formData.service_category || undefined,
        coverageType: input.formData.coverage_type || undefined,
        copayPercent: Number(input.formData.copay_percent || 0) || undefined,
        deductibleAmount: Number(input.formData.deductible_amount || 0) || undefined,
        preAuthorizationRequired: asBool(input.formData.pre_authorization_required),
        submissionChannel: input.formData.submission_channel || undefined,
        providerReference: input.formData.provider_reference || undefined,
      });
    },
    15: () =>
      post("/inventory", {
        name: input.formData.name || "Item",
        quantity: Number(input.formData.quantity || 1),
      }),
    16: () =>
      post("/hr/attendance/clock-in", {
        staffId: input.formData.staffId,
        date: dateOnly,
      }),
    17: () =>
      post("/clinical-performance/schedule", {
        doctorId: input.formData.doctorId,
        availability: input.formData.availability || "[]",
      }),
    18: () =>
      post("/facility-ops/maintenance", {
        assetId: input.formData.assetId || "",
        description: note || "Maintenance request",
      }),
    19: () =>
      post("/reporting/report", {
        title: input.formData.title || `Module ${input.moduleId} Report`,
        type: input.formData.type || "SUMMARY",
        dateFrom: input.formData.dateFrom || dateOnly,
        dateTo: input.formData.dateTo || dateOnly,
      }),
    20: () =>
      post("/tenant-users", {
        userId: input.formData.userId,
        role: input.formData.role || "staff",
      }),
    21: () => {
      if (formId === "telemedicine_status_update") {
        const sessionId = String(input.formData.session_id || "").trim();
        if (!sessionId) {
          throw new Error("Session ID is required for telemedicine status update.");
        }
        return patch(`/telemedicine/session/${encodeURIComponent(sessionId)}/status`, {
          status: input.formData.session_status || "CONFIRMED",
          notes: input.formData.session_notes || undefined,
          chiefComplaint: input.formData.chief_complaint || undefined,
          clinicalNotes: input.formData.clinical_notes || undefined,
        });
      }

      if (formId === "telemedicine_recording") {
        const sessionId = String(input.formData.session_id || "").trim();
        if (!sessionId) {
          throw new Error("Session ID is required for telemedicine recording.");
        }
        return post(`/telemedicine/session/${encodeURIComponent(sessionId)}/recording`, {
          recordingUrl: input.formData.recording_url || "",
          duration: Number(input.formData.recording_duration || 0) || undefined,
          consentRecording: asBool(input.formData.consent_recording),
          encryptionKeyRef: input.formData.encryption_key_ref || undefined,
        });
      }

      if (formId === "telemedicine_complete") {
        const sessionId = String(input.formData.session_id || "").trim();
        if (!sessionId) {
          throw new Error("Session ID is required to complete telemedicine visit.");
        }
        return post(`/telemedicine/session/${encodeURIComponent(sessionId)}/complete`, {
          chiefComplaint: input.formData.chief_complaint || undefined,
          clinicalNotes: input.formData.clinical_notes || undefined,
          sessionSummary: input.formData.session_summary || undefined,
          medication: input.formData.medication || undefined,
          dosage: input.formData.dosage || undefined,
          frequency: input.formData.frequency || undefined,
          duration: input.formData.duration || undefined,
          prescriptionNotes: input.formData.prescription_notes || undefined,
          labTestName: input.formData.lab_test_name || undefined,
          homeSampleCollection: asBool(input.formData.home_sample_collection),
          specialistReferral: input.formData.specialist_referral || undefined,
          issueSickNote: asBool(input.formData.issue_sick_note),
          billAmount: Number(input.formData.consultation_fee || 0) || undefined,
          markPaid: asBool(input.formData.mark_paid),
        });
      }

      if (formId === "telemedicine_consent") {
        const sessionId = String(input.formData.session_id || "").trim();
        if (!sessionId) {
          throw new Error("Session ID is required for consent capture.");
        }
        return post(`/telemedicine/session/${encodeURIComponent(sessionId)}/consent`, {
          consentCaptured: asBool(input.formData.consent_captured),
          consentRecording: asBool(input.formData.consent_recording),
          consentVersion: input.formData.consent_version || undefined,
          consentNotes: input.formData.consent_notes || undefined,
        });
      }

      if (formId === "telemedicine_chat") {
        const sessionId = String(input.formData.session_id || "").trim();
        if (!sessionId) {
          throw new Error("Session ID is required for telemedicine chat.");
        }
        return post(`/telemedicine/session/${encodeURIComponent(sessionId)}/chat`, {
          message: input.formData.chat_message || "",
          senderRole: input.formData.sender_role || undefined,
          senderName: input.formData.sender_name || undefined,
          attachmentUrl: input.formData.attachment_url || undefined,
          isInternal: asBool(input.formData.is_internal),
        });
      }

      if (formId === "telemedicine_connection_log") {
        const sessionId = String(input.formData.session_id || "").trim();
        if (!sessionId) {
          throw new Error("Session ID is required for connection log.");
        }
        let deviceInfo: any = undefined;
        const rawDevice = String(input.formData.device_info || "").trim();
        if (rawDevice) {
          try {
            deviceInfo = JSON.parse(rawDevice);
          } catch {
            deviceInfo = { raw: rawDevice };
          }
        }
        return post(`/telemedicine/session/${encodeURIComponent(sessionId)}/connection-log`, {
          connectionState: input.formData.connection_state || undefined,
          networkQuality: input.formData.network_quality || undefined,
          latencyMs: Number(input.formData.latency_ms || 0) || undefined,
          packetLossPercent: Number(input.formData.packet_loss_percent || 0) || undefined,
          deviceInfo,
          notes: input.formData.connection_notes || undefined,
        });
      }

      return post("/telemedicine/session", {
        patientId: input.patientId || undefined,
        doctorId: input.formData.doctor_id || input.formData.doctorId || undefined,
        scheduledAt:
          input.formData.scheduled_at ||
          input.formData.start_time ||
          input.formData.startTime ||
          undefined,
        meetingLink: input.formData.meeting_link || undefined,
        status: input.formData.session_status || "BOOKED",
        sessionType: input.formData.session_type || "VIDEO",
        appointmentMode: input.formData.appointment_mode || "VIRTUAL",
        notes: input.formData.session_notes || note || undefined,
        consentCaptured: asBool(input.formData.consent_captured),
        consentRecording: asBool(input.formData.consent_recording),
        consultationFee: Number(input.formData.consultation_fee || 0) || undefined,
        paymentMethod: input.formData.payment_method || undefined,
        timezone: input.formData.timezone || undefined,
        reminderChannel: input.formData.reminder_channel || undefined,
      });
    },
    22: () => {
      const parsePayload = () => {
        const raw = String(input.formData.payload_json || "").trim();
        if (!raw) return undefined;
        try {
          return JSON.parse(raw);
        } catch {
          return { raw };
        }
      };

      if (formId === "blockchain_hash_engine") {
        return post("/blockchain/hash", {
          payload: parsePayload(),
          hashInput: input.formData.hash_input || undefined,
          algorithm: input.formData.algorithm || "SHA-256",
        });
      }

      if (formId === "blockchain_submit_proof") {
        return post("/blockchain/submit", {
          moduleType: input.formData.module_type || "GENERAL",
          entityType: input.formData.entity_type || "RECORD",
          entityId:
            input.formData.entity_id ||
            input.formData.record_id ||
            input.patientId ||
            undefined,
          payload: parsePayload(),
          entityHash: input.formData.entity_hash || undefined,
          signature: input.formData.digital_signature || undefined,
          network: input.formData.network || "PRIVATE_MOCK",
          status: input.formData.status || "CONFIRMED",
          sourceModule: input.formData.source_module || undefined,
          notes: input.formData.notes || undefined,
        });
      }

      if (formId === "blockchain_verify_integrity") {
        const entityType = String(input.formData.entity_type || "").trim();
        const entityId = String(input.formData.entity_id || "").trim();
        const entityHash = String(input.formData.entity_hash || "").trim();
        if (entityType && entityId) {
          return post("/blockchain/verify/entity", {
            entityType,
            entityId,
            payload: parsePayload(),
            entityHash: entityHash || undefined,
            hashInput: input.formData.hash_input || undefined,
          });
        }
        if (entityHash) {
          return apiFetch(
            `/blockchain/verify/hash?hash=${encodeURIComponent(entityHash)}`,
            { method: "GET" },
          );
        }
        throw new Error(
          "Provide entity type + entity ID, or provide a hash value for verification.",
        );
      }

      return post("/blockchain/register", {
        recordType: input.formData.module_type || input.formData.record_type || "GENERAL",
        entityType: input.formData.entity_type || "RECORD",
        entityId:
          input.formData.entity_id ||
          input.formData.record_id ||
          input.patientId ||
          undefined,
        payload: parsePayload(),
        hash: input.formData.entity_hash || input.formData.hash_input || undefined,
        signature: input.formData.digital_signature || undefined,
        notes: input.formData.notes || undefined,
      });
    },
    23: () =>
      post("/ai-suite/run", {
        scope: input.formData.scope || "operational",
        insightType: input.formData.type || input.formData.insightType || "operational_pressure",
        modelKey: input.formData.modelKey || undefined,
        notes: note || undefined,
      }),
    24: () => {
      const toText = (value: unknown) => {
        const normalized = String(value ?? "").trim();
        return normalized || undefined;
      };
      const toNumber = (value: unknown) => {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : undefined;
      };

      const patientId = input.patientId || toText(input.formData.patient_id);
      if (!patientId) {
        throw new Error("Patient selection is required for Patient Portal actions.");
      }

      if (formId === "portal_account_setup") {
        return post("/patient-portal/account", {
          patientId,
          email: toText(input.formData.email),
          password: toText(input.formData.password),
          status: toText(input.formData.status),
          twoFactorEnabled: asBool(input.formData.two_factor_enabled),
        });
      }

      if (formId === "portal_access_log") {
        return post("/patient-portal/access-log", {
          patientId,
          ipAddress: toText(input.formData.ip_address),
          device: toText(input.formData.device),
          userAgent: toText(input.formData.user_agent),
        });
      }

      if (formId === "portal_appointment_booking") {
        return post("/patient-portal/appointment", {
          patientId,
          doctorId: toText(input.formData.doctor_id),
          dateTime: toText(input.formData.date_time),
          status: toText(input.formData.status),
          notes: toText(input.formData.notes || note),
        });
      }

      if (formId === "portal_telemedicine_request") {
        return post("/patient-portal/telemedicine-request", {
          patientId,
          doctorId: toText(input.formData.doctor_id),
          dateTime: toText(input.formData.date_time),
          preferredMode: toText(input.formData.preferred_mode),
          reason: toText(input.formData.reason || note),
        });
      }

      if (formId === "portal_notification") {
        return post("/patient-portal/notification", {
          patientId,
          title: toText(input.formData.title),
          message: toText(input.formData.message || note),
          category: toText(input.formData.category),
          channel: toText(input.formData.channel),
          status: toText(input.formData.status),
        });
      }

      if (formId === "portal_message") {
        return post("/patient-portal/message", {
          patientId,
          threadId: toText(input.formData.thread_id),
          subject: toText(input.formData.subject),
          direction: toText(input.formData.direction),
          message: toText(input.formData.message || note),
          status: toText(input.formData.status),
        });
      }

      if (formId === "portal_consent") {
        return post("/patient-portal/consent", {
          patientId,
          consentType: toText(input.formData.consent_type),
          accepted: asBool(input.formData.accepted),
          version: toText(input.formData.version),
          expiresAt: toText(input.formData.expires_at),
          notes: toText(input.formData.notes || note),
        });
      }

      return post("/patient-portal/access-log", {
        patientId,
        ipAddress: toText(input.formData.ip_address),
        device: toText(input.formData.device),
        userAgent: toText(input.formData.user_agent),
        loginTime: toNumber(input.formData.login_time),
      });
    },
    25: async () => {
      const toNum = (value: unknown) => {
        const n = Number(value);
        return Number.isFinite(n) ? n : undefined;
      };
      const toText = (value: unknown) => {
        const normalized = String(value ?? "").trim();
        return normalized || undefined;
      };
      const ensureEmergencyCase = async () => {
        const explicitCaseId = toText(input.formData.emergency_case_id);
        if (explicitCaseId) return explicitCaseId;
        const created = await createEmergencyCase({
          patientId: input.patientId || undefined,
          patientName: toText(input.formData.patient_name) || input.patientName || undefined,
          temporaryId: toText(input.formData.temporary_id),
          arrivalMode: toText(input.formData.arrival_mode),
          arrivalTime: toText(input.formData.arrival_time),
          estimatedAge: toNum(input.formData.estimated_age),
          gender: toText(input.formData.gender),
          chiefComplaint: toText(input.formData.chief_complaint) || note || "Emergency case",
          traumaMechanism: toText(input.formData.trauma_mechanism),
          guardianName: toText(input.formData.guardian_name),
          guardianContact: toText(input.formData.guardian_contact),
          assignedDoctorId: toText(input.formData.assigned_doctor_id),
          bedLocation: toText(input.formData.bed_location),
          legalNotes: toText(input.formData.legal_notes),
        });
        return String((created as any)?.id || (created as any)?.emergencyId || "");
      };

      if (formId === "emergency_quick_registration") {
        return post("/emergency/case", {
          patientId: input.patientId || undefined,
          patientName: toText(input.formData.patient_name) || input.patientName || undefined,
          temporaryId: toText(input.formData.temporary_id),
          arrivalMode: toText(input.formData.arrival_mode),
          arrivalTime: toText(input.formData.arrival_time),
          estimatedAge: toNum(input.formData.estimated_age),
          gender: toText(input.formData.gender),
          chiefComplaint: toText(input.formData.chief_complaint) || note || "Emergency case",
          traumaMechanism: toText(input.formData.trauma_mechanism),
          guardianName: toText(input.formData.guardian_name),
          guardianContact: toText(input.formData.guardian_contact),
          assignedDoctorId: toText(input.formData.assigned_doctor_id),
          bedLocation: toText(input.formData.bed_location),
          legalNotes: toText(input.formData.legal_notes),
        });
      }

      if (formId === "emergency_triage") {
        const emergencyId = await ensureEmergencyCase();
        if (!emergencyId) {
          throw new Error("Emergency case ID is required for triage.");
        }
        return post(`/emergency/case/${encodeURIComponent(emergencyId)}/triage`, {
          triageLevel: toText(input.formData.triage_level),
          gcs: toNum(input.formData.gcs),
          painScale: toNum(input.formData.pain_scale),
          oxygenSaturation: toNum(input.formData.oxygen_saturation),
          bloodPressure: toText(input.formData.bp || input.formData.blood_pressure),
          bpSystolic: toNum(input.formData.bp_systolic),
          bpDiastolic: toNum(input.formData.bp_diastolic),
          pulseRate: toNum(input.formData.pulse_rate || input.formData.pulse),
          respiratoryRate: toNum(input.formData.respiratory_rate),
          temperature: toNum(input.formData.temperature),
          notes: toText(input.formData.triage_notes || input.formData.emergency_notes || note),
          assignedDoctorId: toText(input.formData.assigned_doctor_id),
        });
      }

      if (formId === "emergency_clinical_management") {
        const emergencyId = await ensureEmergencyCase();
        if (!emergencyId) {
          throw new Error("Emergency case ID is required for clinical management.");
        }

        const hasProcedure = Boolean(
          toText(input.formData.procedure_type) ||
            toText(input.formData.procedure_outcome) ||
            toText(input.formData.procedure_complications),
        );
        const hasMedication = Boolean(
          toText(input.formData.medication_name) ||
            toText(input.formData.dose) ||
            toText(input.formData.route),
        );

        const clinicalResponse = await apiFetch(
          `/emergency/case/${encodeURIComponent(emergencyId)}/clinical-note`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chiefComplaint: toText(input.formData.chief_complaint),
              traumaMechanism: toText(input.formData.trauma_mechanism),
              history: toText(input.formData.history),
              allergies: toText(input.formData.allergies),
              medications: toText(input.formData.medications),
              examination: toText(input.formData.examination),
              initialDiagnosis: toText(input.formData.initial_diagnosis),
              interventions: toText(input.formData.interventions),
              resuscitationDetails: toText(input.formData.resuscitation_details),
              intubationDetails: toText(input.formData.intubation_details),
              transfusionDetails: toText(input.formData.transfusion_details),
              notes: note || undefined,
            }),
          },
        );
        if (!clinicalResponse.ok) return clinicalResponse;

        if (hasProcedure) {
          const procedureResponse = await apiFetch(
            `/emergency/case/${encodeURIComponent(emergencyId)}/procedure`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                procedureType: toText(input.formData.procedure_type),
                outcome: toText(input.formData.procedure_outcome),
                complications: toText(input.formData.procedure_complications),
                notes: note || undefined,
              }),
            },
          );
          if (!procedureResponse.ok) return procedureResponse;
        }

        if (hasMedication) {
          const medicationResponse = await apiFetch(
            `/emergency/case/${encodeURIComponent(emergencyId)}/medication`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                medication: toText(input.formData.medication_name),
                dose: toText(input.formData.dose),
                route: toText(input.formData.route),
                frequency: toText(input.formData.frequency),
                notes: note || undefined,
              }),
            },
          );
          if (!medicationResponse.ok) return medicationResponse;
        }

        return clinicalResponse;
      }

      if (formId === "emergency_disposition") {
        const emergencyId = await ensureEmergencyCase();
        if (!emergencyId) {
          throw new Error("Emergency case ID is required for disposition.");
        }
        return post(`/emergency/case/${encodeURIComponent(emergencyId)}/disposition`, {
          patientId: input.patientId || undefined,
          outcome: toText(input.formData.disposition_outcome),
          destinationWard: toText(input.formData.destination_ward),
          destinationBed: toText(input.formData.destination_bed),
          transferFacility: toText(input.formData.transfer_facility),
          referredTo: toText(input.formData.referred_to),
          deathRecordedAt: toText(input.formData.death_recorded_at),
          notes: toText(input.formData.notes || note),
        });
      }

      if (formId === "emergency_mass_casualty") {
        return post('/emergency/mass-casualty', {
          eventId: toText(input.formData.event_id),
          eventName: toText(input.formData.event_name),
          incidentType: toText(input.formData.incident_type),
          location: toText(input.formData.location),
          disasterCode: toText(input.formData.disaster_code),
          estimatedCasualties: toNum(input.formData.estimated_casualties),
          occurredAt: toText(input.formData.occurred_at),
          status: toText(input.formData.status),
          notes: toText(input.formData.notes || note),
        });
      }

      return post("/emergency/case", {
        patientId: input.patientId || undefined,
        patientName: input.patientName || undefined,
        chiefComplaint: note || "Emergency case",
      });
    },
    26: () =>
      post("/emergency/ambulance/dispatch", {
        fleetId: input.formData.fleetId || input.formData.vehicleId || "",
        location: input.formData.location || input.formData.pickupLocation || "Unknown",
        patientId: input.patientId || undefined,
        patientName: input.patientName || undefined,
        condition: note || input.formData.condition || "Emergency transport",
      }),
    27: () =>
      post("/reporting/log", {
        eventName: "mortuary_record",
        eventData: {
          patientId: input.patientId,
          note,
          formData: input.formData,
        },
      }),
    28: () => {
      if (formId === "queue_call_next") {
        return post("/opd/queue/call-next", {
          departmentId: toText(input.formData.department_id),
          doctorId: toText(input.formData.doctor_id),
          counterId: toText(input.formData.counter_id),
          queueType: toText(input.formData.queue_type),
        });
      }

      if (formId === "queue_status_update") {
        return patch("/opd/queue/token/status", {
          tokenNumber: toText(input.formData.token_number),
          status: toText(input.formData.status),
          counterId: toText(input.formData.counter_id),
          doctorId: toText(input.formData.doctor_id),
          reason: toText(input.formData.reason || note),
        });
      }

      if (formId === "queue_priority_override") {
        return patch("/opd/queue/token/priority", {
          tokenNumber: toText(input.formData.token_number),
          priorityLevel: toText(input.formData.priority_level),
          reason: toText(input.formData.reason || note),
        });
      }

      if (formId === "queue_counter_session") {
        return post("/opd/queue/counter/session", {
          counterId: toText(input.formData.counter_id),
          counterName: toText(input.formData.counter_name),
          departmentId: toText(input.formData.department_id),
          staffId: toText(input.formData.staff_id),
          active: asBool(input.formData.active),
        });
      }

      return post("/opd/queue/token", {
        patientId: input.patientId || toText(input.formData.patient_id),
        visitId: toText(input.formData.visit_id),
        doctorId: toText(input.formData.doctor_id),
        departmentId: toText(input.formData.department_id || input.formData.department),
        queueType: toText(input.formData.queue_type),
        queueLane: toText(input.formData.queue_lane),
        priority: toText(input.formData.priority_level || input.formData.priority),
        tokenPrefix: toText(input.formData.token_prefix),
        tokenNumber: toText(input.formData.token_number),
        servicePoint: toText(input.formData.service_point),
        notes: toText(input.formData.notes || note),
      });
    },
    29: () =>
      post("/helpdesk/tickets", {
        subject:
          input.formData.subject ||
          input.formData.issue ||
          "Support Request",
        category: input.formData.category || "SOFTWARE_BUG",
        priority: String(input.formData.priority || "MEDIUM").toUpperCase(),
        department: input.formData.department || "",
        description: input.formData.issue || note || "Support request raised from module workflow",
        assignedTo: input.formData.assigned_to || undefined,
      }),
    30: () =>
      post("/reporting/log", {
        eventName: "meal_order",
        eventData: {
          patientId: input.patientId,
          formData: input.formData,
        },
      }),
    31: () => {
      if (formId === "survey_definition") {
        const scoringWeightsRaw = toText(input.formData.scoring_weights);
        let scoringWeights: Record<string, unknown> | undefined;
        if (scoringWeightsRaw) {
          try {
            const parsed = JSON.parse(scoringWeightsRaw);
            if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
              scoringWeights = parsed as Record<string, unknown>;
            }
          } catch {
            scoringWeights = undefined;
          }
        }
        return post("/patient-feedback/surveys", {
          title: toText(input.formData.title),
          language: toText(input.formData.language),
          channels:
            toText(input.formData.channels)
              ?.split(",")
              .map((row) => row.trim().toUpperCase())
              .filter(Boolean) || [],
          departments:
            toText(input.formData.departments)
              ?.split(",")
              .map((row) => row.trim())
              .filter(Boolean) || [],
          visitTypes:
            toText(input.formData.visit_types)
              ?.split(",")
              .map((row) => row.trim())
              .filter(Boolean) || [],
          anonymousAllowed: asBool(input.formData.anonymous_allowed),
          questions: toText(input.formData.questions)
            ?.split("\n")
            .map((row) => row.trim())
            .filter(Boolean)
            .map((label, index) => ({ key: `q_${index + 1}`, label, type: "TEXT" })),
          scoringWeights,
          active: asBool(input.formData.active),
        });
      }

      if (formId === "complaint_escalation") {
        const responseId = toText(input.formData.response_id);
        if (!responseId) {
          throw new Error("Response ID is required for complaint escalation.");
        }
        return post(`/patient-feedback/responses/${encodeURIComponent(responseId)}/escalate`, {
          note: toText(input.formData.escalation_note || note),
          priority: toText(input.formData.priority),
          assignedTo: toText(input.formData.assign_to),
        });
      }

      return post("/patient-feedback/responses", {
        surveyId: toText(input.formData.survey_id),
        patientId: input.patientId || toText(input.formData.patient_id),
        rating: toNum(input.formData.rating),
        npsScore: toNum(input.formData.nps_score),
        comments: toText(input.formData.comments || note),
        anonymous:
          String(input.formData.anonymous ?? "").trim().toLowerCase() === "true",
        answers: {
          ...input.formData,
          rating: toNum(input.formData.rating),
          npsScore: toNum(input.formData.nps_score),
          comments: toText(input.formData.comments || note),
          complaintCategory: toText(input.formData.complaint_category),
          department: toText(input.formData.department),
          serviceType: toText(input.formData.service_type),
          doctorId: toText(input.formData.doctor_id),
          nurseId: toText(input.formData.nurse_id),
          visitId: toText(input.formData.visit_id),
          channel: toText(input.formData.channel),
        },
      });
    },
    32: () =>
      post("/reporting/log", {
        eventName: "research_enrollment",
        eventData: {
          patientId: input.patientId,
          formData: input.formData,
        },
      }),
    33: () =>
      post("/reporting/log", {
        eventName: "quality_audit",
        eventData: {
          details: note,
          formData: input.formData,
        },
      }),
    34: () => {
      const toText = (value: unknown) => {
        const normalized = String(value ?? "").trim();
        return normalized || undefined;
      };
      const toNumber = (value: unknown) => {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : undefined;
      };
      const toJsonObject = (value: unknown) => {
        const normalized = String(value ?? "").trim();
        if (!normalized) return undefined;
        try {
          const parsed = JSON.parse(normalized);
          if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
            return parsed as Record<string, unknown>;
          }
        } catch {
          // ignore malformed JSON and skip field
        }
        return undefined;
      };

      if (formId === "integration_provider_setup") {
        return post("/external-integrations/provider", {
          providerName: toText(input.formData.provider_name || input.formData.system_name),
          endpoint: toText(input.formData.endpoint_url || input.formData.endpoint),
          authType: toText(input.formData.auth_type),
          apiKey: toText(input.formData.api_key),
          clientId: toText(input.formData.client_id),
          tokenEndpoint: toText(input.formData.token_endpoint),
          syncMode: toText(input.formData.sync_mode),
          syncFrequency: toText(input.formData.sync_frequency),
          timeoutMs: toNumber(input.formData.timeout_ms),
          webhookEnabled: asBool(input.formData.webhook_enabled),
          status: toText(input.formData.status),
          notes: toText(input.formData.notes || note),
        });
      }

      if (formId === "integration_connection_test") {
        return post("/external-integrations/connection/test", {
          providerId: toText(input.formData.provider_id),
          providerName: toText(input.formData.provider_name),
          endpoint: toText(input.formData.endpoint),
          method: toText(input.formData.method),
          responseTimeMs: toNumber(input.formData.response_time_ms),
          statusCode: toNumber(input.formData.status_code),
          simulateFail: asBool(input.formData.simulate_fail),
          errorMessage: toText(input.formData.error_message),
          notes: toText(input.formData.notes || note),
        });
      }

      if (formId === "integration_data_mapping") {
        return post("/external-integrations/mapping", {
          providerId: toText(input.formData.provider_id),
          providerName: toText(input.formData.provider_name),
          mappingName: toText(input.formData.mapping_name),
          sourceEntity: toText(input.formData.source_entity),
          targetEntity: toText(input.formData.target_entity),
          direction: toText(input.formData.direction),
          transformRules: toJsonObject(input.formData.transform_rules),
          status: toText(input.formData.status),
          notes: toText(input.formData.notes || note),
        });
      }

      if (formId === "integration_manual_sync") {
        return post("/external-integrations/sync/manual", {
          providerId: toText(input.formData.provider_id),
          providerName: toText(input.formData.provider_name),
          jobType: toText(input.formData.job_type),
          direction: toText(input.formData.direction),
          endpoint: toText(input.formData.endpoint),
          method: toText(input.formData.method),
          recordsProcessed: toNumber(input.formData.records_processed),
          durationMs: toNumber(input.formData.duration_ms),
          retryOfSyncJobId: toText(input.formData.retry_of_sync_job_id),
          runNow:
            input.formData.run_now === undefined
              ? true
              : asBool(input.formData.run_now),
          simulateFail: asBool(input.formData.simulate_fail),
          notes: toText(input.formData.notes || note),
          errorMessage: toText(input.formData.error_message),
        });
      }

      if (formId === "integration_webhook_ingest") {
        return post("/external-integrations/webhook/event", {
          providerId: toText(input.formData.provider_id),
          providerName: toText(input.formData.provider_name),
          eventType: toText(input.formData.event_type),
          endpointPath: toText(input.formData.endpoint_path),
          processingStatus: toText(input.formData.processing_status),
          retryCount: toNumber(input.formData.retry_count),
          statusCode: toNumber(input.formData.status_code),
          responseTime: toNumber(input.formData.response_time),
          payload: toJsonObject(input.formData.payload),
          headers: toJsonObject(input.formData.headers),
          errorMessage: toText(input.formData.error_message),
          notes: toText(input.formData.notes || note),
        });
      }

      return post("/external-integrations/provider", {
        providerName: toText(input.formData.provider_name || input.formData.system_name),
        endpoint: toText(input.formData.endpoint_url || input.formData.endpoint),
        authType: toText(input.formData.auth_type),
        apiKey: toText(input.formData.api_key),
        status: toText(input.formData.status),
        notes: toText(note),
      });
    },
    35: () =>
      post("/tenant/pos/create", {
        patientId: input.patientId,
        items: [
          {
            itemId: input.formData.itemId || "item-1",
            name: input.formData.itemName || "POS Item",
            quantity: Number(input.formData.quantity || 1),
            unitPrice: Number(input.formData.unitPrice || 1),
          },
        ],
        paymentMethod: "CASH",
      }),
    36: () => {
      if (formId === "opd_patient_call") {
        return post("/opd/queue/call", {
          patientId: input.patientId,
          visitId: input.formData.visit_id || input.formData.visitId || undefined,
          queueToken: input.formData.opd_token || input.formData.queue_token || undefined,
          doctorId: input.formData.doctor_id || input.formData.doctorId || undefined,
          queuePosition: input.formData.queue_position || undefined,
          historySnapshot: input.formData.history_snapshot || undefined,
          updatedVitals: input.formData.updated_vitals || undefined,
        });
      }

      if (formId === "opd_consultation_prescription") {
        const nextQueueRoute = toText(input.formData.next_queue_route).toLowerCase();
        const routeToLab = nextQueueRoute.includes("lab");
        const routeToRadiology = nextQueueRoute.includes("radiology");
        const routeToPharmacy = nextQueueRoute.includes("pharmacy");
        const routeToIpd =
          nextQueueRoute.includes("ipd") ||
          nextQueueRoute.includes("in-patient") ||
          nextQueueRoute.includes("in patient") ||
          nextQueueRoute.includes("admit");
        return post("/opd/consultations/complete", {
          patientId: input.patientId,
          visitId: input.formData.visit_id || input.formData.visitId || undefined,
          queueToken: input.formData.opd_token || input.formData.queue_token || undefined,
          doctorId: input.formData.doctor_id || input.formData.doctorId || undefined,
          clinicalExamination: input.formData.clinical_examination || undefined,
          diagnosis: input.formData.diagnosis || undefined,
          treatmentPlan: input.formData.treatment_plan || undefined,
          prescription: input.formData.prescription || undefined,
          labRequest: routeToLab,
          labTestName: input.formData.lab_test_name || undefined,
          radiologyRequest: routeToRadiology,
          radiologyTestName: input.formData.radiology_test_name || undefined,
          pharmacyRequest: routeToPharmacy,
          followUpDateTime: input.formData.followup_datetime || undefined,
          nextQueueRoute: input.formData.next_queue_route || undefined,
          completionNotes: input.formData.completion_notes || note || undefined,
          referralType: input.formData.referral_type || undefined,
          referralFacility: input.formData.referral_facility || undefined,
          referToIpd: routeToIpd,
          consultationFee: input.formData.consultation_fee || undefined,
          consultationFeePaid: asBool(input.formData.consultation_fee_paid),
          paymentCategory: input.formData.payment_category || undefined,
          bloodPressure: input.formData.blood_pressure || input.formData.bp || undefined,
          temperature: input.formData.temperature || undefined,
          pulseRate: input.formData.pulse_rate || input.formData.pulse || undefined,
          respiratoryRate: input.formData.respiratory_rate || undefined,
          oxygenSaturation: input.formData.oxygen_saturation || undefined,
          weight: input.formData.weight || undefined,
          height: input.formData.height || undefined,
        });
      }

      return post("/visits", {
        patientId: input.patientId,
        visitType: "CONSULTATION",
        status: "CONSULTATION",
        reason: note || "Doctor consultation",
      });
    },
    37: async () => {
      const toNumber = (value: unknown) => {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : undefined;
      };
      const toText = (value: unknown) => {
        const normalized = String(value ?? "").trim();
        return normalized || undefined;
      };

      if (formId === "maternity_pregnancy_registration") {
        return post("/maternity/pregnancy", {
          motherPatientId:
            input.formData.mother_patient_id ||
            input.patientId ||
            undefined,
          lmpDate: toText(input.formData.lmp_date),
          estimatedDueDate: toText(input.formData.estimated_due_date),
          gestationalAgeWeeks: toNumber(input.formData.gestational_age_weeks),
          gravidity: toNumber(input.formData.gravidity),
          parity: toNumber(input.formData.parity),
          riskLevel: toText(input.formData.risk_level),
          riskFactors: toText(input.formData.risk_factors),
          doctorId: toText(input.formData.doctor_id),
          notes: toText(input.formData.notes),
        });
      }

      if (formId === "maternity_anc_visit") {
        return post("/maternity/anc-visit", {
          pregnancyId: toText(input.formData.pregnancy_id),
          visitDate: toText(input.formData.visit_date),
          gestationalAgeWeeks: toNumber(input.formData.gestational_age_weeks),
          weightKg: toNumber(input.formData.weight_kg),
          bpSystolic: toNumber(input.formData.bp_systolic),
          bpDiastolic: toNumber(input.formData.bp_diastolic),
          fundalHeightCm: toNumber(input.formData.fundal_height_cm),
          fetalHeartRate: toNumber(input.formData.fetal_heart_rate),
          labSummary: toText(input.formData.lab_summary),
          ultrasoundSummary: toText(input.formData.ultrasound_summary),
          supplements: toText(input.formData.supplements),
          riskLevel: toText(input.formData.risk_level),
          riskFactors: toText(input.formData.risk_factors),
          notes: toText(input.formData.notes),
        });
      }

      if (formId === "maternity_labor_delivery") {
        const hasDeliveryFields = Boolean(
          toText(input.formData.delivery_date_time) ||
            toText(input.formData.mode_of_delivery) ||
            toText(input.formData.newborn_first_name) ||
            toText(input.formData.newborn_last_name),
        );
        if (hasDeliveryFields) {
          return post("/maternity/delivery", {
            pregnancyId: toText(input.formData.pregnancy_id),
            laborId: toText(input.formData.labor_id),
            deliveryDateTime: toText(input.formData.delivery_date_time),
            modeOfDelivery: toText(input.formData.mode_of_delivery),
            deliveringDoctorId: toText(input.formData.delivering_doctor_id),
            midwifeName: toText(input.formData.midwife_name),
            complications: toText(input.formData.complications),
            estimatedBloodLossMl: toNumber(input.formData.estimated_blood_loss_ml),
            newbornFirstName: toText(input.formData.newborn_first_name),
            newbornLastName: toText(input.formData.newborn_last_name),
            newbornSex: toText(input.formData.newborn_sex),
            birthWeightKg: toNumber(input.formData.birth_weight_kg),
            newbornLengthCm: toNumber(input.formData.newborn_length_cm),
            headCircumferenceCm: toNumber(input.formData.head_circumference_cm),
            apgar1: toNumber(input.formData.apgar1),
            apgar5: toNumber(input.formData.apgar5),
            nicuTransfer: asBool(input.formData.nicu_transfer),
            newbornNotes: toText(input.formData.newborn_notes),
          });
        }
        return post("/maternity/labor-record", {
          pregnancyId: toText(input.formData.pregnancy_id),
          admissionTime: toText(input.formData.admission_time),
          laborOnsetTime: toText(input.formData.labor_onset_time),
          membraneRuptureTime: toText(input.formData.membrane_rupture_time),
          midwifeName: toText(input.formData.midwife_name),
          doctorId: toText(input.formData.delivering_doctor_id),
          notes: toText(input.formData.notes),
        });
      }

      if (formId === "maternity_postnatal_complication") {
        const hasComplicationFields = Boolean(
          toText(input.formData.complication_subject) ||
            toText(input.formData.complication_type) ||
            toText(input.formData.complication_severity) ||
            toText(input.formData.complication_occurred_at),
        );
        if (hasComplicationFields) {
          return post("/maternity/complication", {
            pregnancyId: toText(input.formData.pregnancy_id),
            motherPatientId: toText(input.formData.mother_patient_id),
            babyPatientId: toText(input.formData.baby_patient_id),
            subject: toText(input.formData.complication_subject),
            type: toText(input.formData.complication_type),
            severity: toText(input.formData.complication_severity),
            occurredAt: toText(input.formData.complication_occurred_at),
            notes: toText(input.formData.notes),
          });
        }
        return post("/maternity/postnatal-record", {
          pregnancyId: toText(input.formData.pregnancy_id),
          motherPatientId: toText(input.formData.mother_patient_id),
          babyPatientId: toText(input.formData.baby_patient_id),
          reviewDateTime: toText(input.formData.review_date_time),
          uterineStatus: toText(input.formData.uterine_status),
          bleedingStatus: toText(input.formData.bleeding_status),
          breastfeedingStatus: toText(input.formData.breastfeeding_status),
          maternalVitals: toText(input.formData.maternal_vitals),
          neonatalVitals: toText(input.formData.neonatal_vitals),
          dischargeReady: asBool(input.formData.discharge_ready),
          followUpDate: toText(input.formData.follow_up_date),
          notes: toText(input.formData.notes),
        });
      }

      return post("/maternity/pregnancy", {
        motherPatientId:
          input.formData.mother_patient_id ||
          input.patientId ||
          undefined,
        notes: note || undefined,
      });
    },
    38: async () => {
      const toNumber = (value: unknown) => {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : undefined;
      };
      const toText = (value: unknown) => {
        const normalized = String(value ?? '').trim();
        return normalized || undefined;
      };

      if (formId === 'icu_admission') {
        return post('/icu/admission', {
          patientId: toText(input.formData.patient_id) || input.patientId || undefined,
          inpatientId: toText(input.formData.inpatient_id),
          source: toText(input.formData.source),
          primaryDiagnosis: toText(input.formData.primary_diagnosis),
          reasonForAdmission: toText(input.formData.reason_for_admission),
          severityScore: toText(input.formData.severity_score),
          severityValue: toNumber(input.formData.severity_value),
          mechanicalVentilation: asBool(input.formData.mechanical_ventilation),
          ventilationStatus: toText(input.formData.ventilation_status),
          infectionStatus: toText(input.formData.infection_status),
          isolationRequired: asBool(input.formData.isolation_required),
          bedLocation: toText(input.formData.bed_location),
          admittedAt: toText(input.formData.admitted_at),
        });
      }

      if (formId === 'icu_vitals_monitoring') {
        return post('/icu/vital', {
          icuAdmissionId: toText(input.formData.icu_admission_id),
          heartRate: toNumber(input.formData.heart_rate),
          bpSystolic: toNumber(input.formData.bp_systolic),
          bpDiastolic: toNumber(input.formData.bp_diastolic),
          respiratoryRate: toNumber(input.formData.respiratory_rate),
          oxygenSaturation: toNumber(input.formData.oxygen_saturation),
          temperature: toNumber(input.formData.temperature),
          cvp: toNumber(input.formData.cvp),
          icp: toNumber(input.formData.icp),
          urineOutput: toNumber(input.formData.urine_output),
          bloodGlucose: toNumber(input.formData.blood_glucose),
          painScore: toNumber(input.formData.pain_score),
          recordedAt: toText(input.formData.recorded_at),
          notes: toText(input.formData.notes || note),
        });
      }

      if (formId === 'icu_ventilator_management') {
        return post('/icu/ventilator-setting', {
          icuAdmissionId: toText(input.formData.icu_admission_id),
          ventilationStatus: toText(input.formData.ventilation_status),
          mode: toText(input.formData.mode),
          fio2: toNumber(input.formData.fio2),
          peep: toNumber(input.formData.peep),
          tidalVolume: toNumber(input.formData.tidal_volume),
          respiratoryRate: toNumber(input.formData.respiratory_rate),
          peakPressure: toNumber(input.formData.peak_pressure),
          plateauPressure: toNumber(input.formData.plateau_pressure),
          weaningPlan: toText(input.formData.weaning_plan),
          recordedAt: toText(input.formData.recorded_at),
          notes: toText(input.formData.notes || note),
        });
      }

      if (formId === 'icu_infusion_management') {
        return post('/icu/infusion', {
          icuAdmissionId: toText(input.formData.icu_admission_id),
          medication: toText(input.formData.medication),
          infusionType: toText(input.formData.infusion_type),
          rate: toNumber(input.formData.rate),
          unit: toText(input.formData.unit),
          startedAt: toText(input.formData.start_time),
          stopTime: toText(input.formData.stop_time),
          doseChangeReason: toText(input.formData.dose_change_reason),
          pumpType: toText(input.formData.pump_type),
          notes: toText(input.formData.notes || note),
        });
      }

      if (formId === 'icu_scoring') {
        return post('/icu/score', {
          icuAdmissionId: toText(input.formData.icu_admission_id),
          scoreType: toText(input.formData.score_type),
          scoreValue: toNumber(input.formData.score_value),
          recordedAt: toText(input.formData.recorded_at),
          notes: toText(input.formData.notes || note),
        });
      }

      if (formId === 'icu_progress_note') {
        return post('/icu/progress-note', {
          icuAdmissionId: toText(input.formData.icu_admission_id),
          progressNote: toText(input.formData.progress_note),
          labSummary: toText(input.formData.lab_summary),
          imagingSummary: toText(input.formData.imaging_summary),
          organReview: toText(input.formData.organ_review),
          medicationChanges: toText(input.formData.medication_changes),
          nutritionPlan: toText(input.formData.nutrition_plan),
          dvtProphylaxis: toText(input.formData.dvt_prophylaxis),
          pressureSoreRisk: toText(input.formData.pressure_sore_risk),
          codeStatus: toText(input.formData.code_status),
          consultantNote: toText(input.formData.consultant_note),
          noteTime: toText(input.formData.note_time),
        });
      }

      if (formId === 'icu_disposition') {
        return post('/icu/disposition', {
          icuAdmissionId: toText(input.formData.icu_admission_id),
          outcome: toText(input.formData.outcome),
          conditionAtDischarge: toText(input.formData.condition_at_discharge),
          finalDiagnosis: toText(input.formData.final_diagnosis),
          transferDestination: toText(input.formData.transfer_destination),
          disposedAt: toText(input.formData.disposed_at),
          notes: toText(input.formData.notes || note),
        });
      }

      return post('/icu/admission', {
        patientId: input.patientId || undefined,
        reasonForAdmission: note || undefined,
      });
    },
    39: () => {
      if (formId === "finance_coa_account") {
        return post("/finance-accounting/accounts", {
          accountCode: toText(input.formData.account_code),
          accountName: toText(input.formData.account_name),
          accountType: toText(input.formData.account_type),
          parentAccountCode: toText(input.formData.parent_account_code),
          costCenter: toText(input.formData.cost_center),
          isActive:
            input.formData.is_active === undefined
              ? true
              : asBool(input.formData.is_active),
          sharedCorporate: asBool(input.formData.shared_corporate),
        });
      }

      if (formId === "finance_journal_entry") {
        return post("/finance-accounting/journals", {
          journalNumber: toText(input.formData.journal_number),
          journalDate: toText(input.formData.journal_date),
          description: toText(input.formData.description || note),
          referenceModule: toText(input.formData.reference_module),
          referenceId: toText(input.formData.reference_id),
          status: toText(input.formData.status),
          amount: toNum(input.formData.amount),
          debitAccountCode: toText(input.formData.debit_account_code),
          creditAccountCode: toText(input.formData.credit_account_code),
          costCenter: toText(input.formData.cost_center),
        });
      }

      if (formId === "finance_ap_invoice") {
        return post("/finance-accounting/ap/invoices", {
          supplierId: toText(input.formData.supplier_id),
          supplierName: toText(input.formData.supplier_name),
          invoiceNumber: toText(input.formData.invoice_number),
          amount: toNum(input.formData.amount),
          dueDate: toText(input.formData.due_date),
          currency: toText(input.formData.currency),
          costCenter: toText(input.formData.cost_center),
          status: toText(input.formData.status),
          description: toText(input.formData.description || note),
        });
      }

      if (formId === "finance_ap_payment") {
        const invoiceId = toText(input.formData.invoice_id);
        if (!invoiceId) {
          throw new Error("Invoice ID is required for AP payment posting.");
        }
        return post(`/finance-accounting/ap/payments/${encodeURIComponent(invoiceId)}`, {
          amount: toNum(input.formData.amount),
          method: toText(input.formData.method),
          transactionRef: toText(input.formData.transaction_ref),
          paidAt: toText(input.formData.paid_at),
          allowOverPayment: asBool(input.formData.allow_over_payment),
        });
      }

      if (formId === "finance_ar_record") {
        return post("/finance-accounting/ar/records", {
          patientId: toText(input.formData.patient_id) || input.patientId || undefined,
          billId: toText(input.formData.bill_id),
          payerType: toText(input.formData.payer_type),
          payerName: toText(input.formData.payer_name),
          amount: toNum(input.formData.amount),
          status: toText(input.formData.status),
          dueDate: toText(input.formData.due_date),
          notes: toText(input.formData.notes || note),
        });
      }

      if (formId === "finance_budget_plan") {
        return post("/finance-accounting/budgets", {
          budgetName: toText(input.formData.budget_name),
          fiscalYear: toNum(input.formData.fiscal_year),
          amount: toNum(input.formData.amount),
          costCenter: toText(input.formData.cost_center),
          departmentId: toText(input.formData.department_id),
          status: toText(input.formData.status),
          notes: toText(input.formData.notes || note),
        });
      }

      if (formId === "finance_bank_account") {
        return post("/finance-accounting/bank/accounts", {
          accountName: toText(input.formData.account_name),
          accountNumber: toText(input.formData.account_number),
          bankName: toText(input.formData.bank_name),
          currency: toText(input.formData.currency),
          isCashDrawer: asBool(input.formData.is_cash_drawer),
          isActive:
            input.formData.is_active === undefined
              ? true
              : asBool(input.formData.is_active),
        });
      }

      if (formId === "finance_bank_transaction") {
        return post("/finance-accounting/bank/transactions", {
          bankAccountId: toText(input.formData.bank_account_id),
          transactionType: toText(input.formData.transaction_type),
          amount: toNum(input.formData.amount),
          method: toText(input.formData.method),
          referenceNo: toText(input.formData.reference_no),
          description: toText(input.formData.description || note),
          fromAccountId: toText(input.formData.from_account_id),
          toAccountId: toText(input.formData.to_account_id),
          transactionDate: toText(input.formData.transaction_date),
        });
      }

      if (formId === "finance_fiscal_period_lock") {
        return post("/finance-accounting/fiscal-period/lock", {
          fromDate: toText(input.formData.from_date),
          toDate: toText(input.formData.to_date),
          locked:
            input.formData.locked === undefined
              ? true
              : asBool(input.formData.locked),
          reason: toText(input.formData.reason || note),
        });
      }

      return post("/reporting/log", {
        eventName: "finance.accounting.form.unmapped",
        eventData: {
          moduleId: input.moduleId,
          formId: input.formId,
          formData: input.formData,
          note: toText(note),
          recordedAt: nowIso,
        },
      });
    },
    40: () => {
      const recordTypeByForm: Record<string, string> = {
        workforce_shift_template: "workforce_shift_template",
        workforce_shift_assignment: "workforce_shift_assignment",
        workforce_demand_forecast: "workforce_demand_forecast",
        workforce_utilization_record: "workforce_utilization_record",
        workforce_skill_allocation: "workforce_skill_allocation",
        workforce_burnout_risk: "workforce_burnout_risk",
        workforce_performance_snapshot: "workforce_performance_snapshot",
        workforce_cost_analysis: "workforce_cost_analysis",
      };

      const defaultTitleByForm: Record<string, string> = {
        workforce_shift_template: "Shift template",
        workforce_shift_assignment: "Shift assignment",
        workforce_demand_forecast: "Staffing demand forecast",
        workforce_utilization_record: "Utilization record",
        workforce_skill_allocation: "Skill allocation",
        workforce_burnout_risk: "Burnout risk assessment",
        workforce_performance_snapshot: "Performance snapshot",
        workforce_cost_analysis: "Workforce cost analysis",
      };

      const inferredTitle =
        toText(input.formData.template_name) ||
        toText(input.formData.staff_id) ||
        toText(input.formData.department_id) ||
        defaultTitleByForm[formId] ||
        "Workforce planning record";

      const inferredEffectiveDate =
        toText(input.formData.assignment_date) ||
        toText(input.formData.forecast_date) ||
        toText(input.formData.shift_date) ||
        toText(input.formData.assessment_date) ||
        toText(input.formData.analysis_period_start) ||
        toText(input.formData.period_start) ||
        dateOnly;

      const tags = [
        "workforce_planning",
        toText(input.formData.department_id)?.toLowerCase(),
        toText(input.formData.shift_type)?.toLowerCase(),
        toText(input.formData.risk_level)?.toLowerCase(),
      ].filter(Boolean) as string[];

      return post("/hr/records", {
        recordType: recordTypeByForm[formId] || "workforce_planning",
        title: inferredTitle,
        staffId: toText(input.formData.staff_id),
        status: toText(input.formData.status) || "ACTIVE",
        effectiveDate: inferredEffectiveDate,
        tags,
        data: {
          moduleId: input.moduleId,
          formId: input.formId,
          patientId: input.patientId || null,
          capturedAt: nowIso,
          note: toText(note),
          payload: input.formData,
        },
      });
    },
    43: () => {
      if (formId === "medical_director_doctor_profile") {
        return post("/medical-director/doctor-profiles", {
          staffId: toText(input.formData.staff_id),
          specialization: toText(input.formData.specialization),
          licenseNumber: toText(input.formData.license_number),
          licenseValidUntil: toText(input.formData.license_valid_until),
          credentialVerified: asBool(input.formData.credential_verified),
          privilegeScope: toText(input.formData.privilege_scope),
          isHeadDoctor: asBool(input.formData.is_head_doctor),
          status: toText(input.formData.status) || "ACTIVE",
          workloadScore: toNum(input.formData.workload_score),
        });
      }

      if (formId === "medical_director_doctor_privilege") {
        return post("/medical-director/doctor-privileges", {
          doctorProfileId: toText(input.formData.doctor_profile_id),
          staffId: toText(input.formData.staff_id),
          privilegeCode: toText(input.formData.privilege_code),
          privilegeName: toText(input.formData.privilege_name),
          scope: toText(input.formData.scope),
          canOperate: asBool(input.formData.can_operate),
          canPrescribeRestricted: asBool(input.formData.can_prescribe_restricted),
          validUntil: toText(input.formData.valid_until),
          status: toText(input.formData.status) || "ACTIVE",
        });
      }

      if (formId === "medical_director_clinical_protocol") {
        return post("/medical-director/clinical-protocols", {
          departmentId: toText(input.formData.department_id),
          protocolCode: toText(input.formData.protocol_code),
          title: toText(input.formData.title),
          category: toText(input.formData.category),
          status: toText(input.formData.status) || "DRAFT",
          currentVersion: toNum(input.formData.current_version),
          effectiveFrom: toText(input.formData.effective_from),
          effectiveTo: toText(input.formData.effective_to),
        });
      }

      if (formId === "medical_director_protocol_version") {
        return post("/medical-director/protocol-versions", {
          protocolId: toText(input.formData.protocol_id),
          versionLabel: toText(input.formData.version_label),
          contentUrl: toText(input.formData.content_url),
          summary: toText(input.formData.summary),
          changeLog: toText(input.formData.change_log),
          isCurrent:
            input.formData.is_current === undefined ? true : asBool(input.formData.is_current),
          approvedAt: toText(input.formData.approved_at),
        });
      }

      if (formId === "medical_director_mortality_review") {
        return post("/medical-director/mortality-reviews", {
          patientId: input.patientId || toText(input.formData.patient_id),
          visitId: toText(input.formData.visit_id),
          departmentId: toText(input.formData.department_id),
          primaryDoctorId: toText(input.formData.primary_doctor_id),
          reviewerStaffId: toText(input.formData.reviewer_staff_id),
          deathDate: toText(input.formData.death_date),
          outcomeCategory: toText(input.formData.outcome_category),
          reviewStatus: toText(input.formData.review_status) || "OPEN",
          caseSummary: toText(input.formData.case_summary),
          recommendations: toText(input.formData.recommendations),
          actionItems: toText(input.formData.action_items),
          mmrMeetingId: toText(input.formData.mmr_meeting_id),
        });
      }

      if (formId === "medical_director_complication_report") {
        return post("/medical-director/complication-reports", {
          patientId: input.patientId || toText(input.formData.patient_id),
          doctorId: toText(input.formData.doctor_id),
          departmentId: toText(input.formData.department_id),
          complicationType: toText(input.formData.complication_type),
          severity: toText(input.formData.severity) || "MEDIUM",
          status: toText(input.formData.status) || "OPEN",
          occurredAt: toText(input.formData.occurred_at),
          caseSummary: toText(input.formData.case_summary),
          actionTaken: toText(input.formData.action_taken),
          resolvedAt: toText(input.formData.resolved_at),
        });
      }

      if (formId === "medical_director_clinical_risk_alert") {
        return post("/medical-director/clinical-risk-alerts", {
          patientId: input.patientId || toText(input.formData.patient_id),
          doctorId: toText(input.formData.doctor_id),
          departmentId: toText(input.formData.department_id),
          alertType: toText(input.formData.alert_type),
          severity: toText(input.formData.severity) || "HIGH",
          riskScore: toNum(input.formData.risk_score),
          sourceModule: toText(input.formData.source_module),
          description: toText(input.formData.description),
          status: toText(input.formData.status) || "OPEN",
          detectedAt: toText(input.formData.detected_at),
        });
      }

      if (formId === "medical_director_restricted_drug_approval") {
        return post("/medical-director/restricted-drug-approvals", {
          prescriptionId: toText(input.formData.prescription_id),
          patientId: input.patientId || toText(input.formData.patient_id),
          requestingDoctorId: toText(input.formData.requesting_doctor_id),
          drugName: toText(input.formData.drug_name),
          reason: toText(input.formData.reason),
          status: toText(input.formData.status) || "PENDING",
          decisionNote: toText(input.formData.decision_note),
          requestedAt: toText(input.formData.requested_at),
          decidedAt: toText(input.formData.decided_at),
        });
      }

      if (formId === "medical_director_mmr_meeting") {
        return post("/medical-director/mmr-meetings", {
          meetingDate: toText(input.formData.meeting_date),
          title: toText(input.formData.title),
          status: toText(input.formData.status) || "SCHEDULED",
          chairStaffId: toText(input.formData.chair_staff_id),
          minutes: toText(input.formData.minutes),
          recommendations: toText(input.formData.recommendations),
        });
      }

      if (formId === "medical_director_performance_score") {
        return post("/medical-director/doctor-performance-scores", {
          doctorProfileId: toText(input.formData.doctor_profile_id),
          staffId: toText(input.formData.staff_id),
          metricPeriod: toText(input.formData.metric_period),
          metricDate: toText(input.formData.metric_date),
          diagnosisAccuracy: toNum(input.formData.diagnosis_accuracy),
          treatmentOutcomeScore: toNum(input.formData.treatment_outcome_score),
          readmissionRate: toNum(input.formData.readmission_rate),
          complicationRate: toNum(input.formData.complication_rate),
          mortalityRate: toNum(input.formData.mortality_rate),
          prescriptionComplianceScore: toNum(input.formData.prescription_compliance_score),
          overallScore: toNum(input.formData.overall_score),
          riskFlag: toText(input.formData.risk_flag),
        });
      }

      if (formId === "medical_director_outcome_metric") {
        return post("/medical-director/outcome-metrics", {
          departmentId: toText(input.formData.department_id),
          doctorId: toText(input.formData.doctor_id),
          metricDate: toText(input.formData.metric_date),
          metricType: toText(input.formData.metric_type),
          metricValue: toNum(input.formData.metric_value),
          metricUnit: toText(input.formData.metric_unit),
          periodType: toText(input.formData.period_type),
          notes: toText(input.formData.notes || note),
        });
      }

      if (formId === "medical_director_critical_case_alert") {
        return post("/medical-director/critical-case-alerts", {
          patientId: input.patientId || toText(input.formData.patient_id),
          visitId: toText(input.formData.visit_id),
          alertType: toText(input.formData.alert_type),
          severity: toText(input.formData.severity) || "HIGH",
          sourceModule: toText(input.formData.source_module),
          description: toText(input.formData.description),
          status: toText(input.formData.status) || "OPEN",
          assignedToStaffId: toText(input.formData.assigned_to_staff_id),
          triggeredAt: toText(input.formData.triggered_at),
        });
      }

      return post("/medical-director/clinical-governance-logs", {
        actionType: "FORM_SUBMIT",
        entityType: formId || "MEDICAL_DIRECTOR",
        entityId: toText(input.formData.id),
        notes: toText(note) || "Medical director workflow submission",
        newValue: {
          moduleId: input.moduleId,
          formId: input.formId,
          patientId: input.patientId || null,
          capturedAt: nowIso,
          payload: input.formData,
        },
      });
    },
    44: async () => {
      if (formId === "rcm_insurance_policy") {
        return post("/revenue-cycle/insurance-policies", {
          patientId: input.patientId || toText(input.formData.patient_id),
          insuranceProvider: toText(input.formData.insurance_provider),
          policyNumber: toText(input.formData.policy_number),
          coverageType: toText(input.formData.coverage_type),
          status: toText(input.formData.status) || "ACTIVE",
          validFrom: toText(input.formData.valid_from),
          validTo: toText(input.formData.valid_to),
          copayPercent: toNum(input.formData.copay_percent),
          deductibleAmount: toNum(input.formData.deductible_amount),
        });
      }

      if (formId === "rcm_eligibility_check") {
        return post("/revenue-cycle/eligibility-checks", {
          patientId: input.patientId || toText(input.formData.patient_id),
          policyId: toText(input.formData.policy_id),
          checkStatus: toText(input.formData.check_status),
          warningMessage: toText(input.formData.warning_message),
          requestPayload: toText(input.formData.request_payload),
          responsePayload: toText(input.formData.response_payload),
          checkedAt: toText(input.formData.checked_at),
        });
      }

      if (formId === "rcm_pre_authorization") {
        return post("/revenue-cycle/pre-authorizations", {
          patientId: input.patientId || toText(input.formData.patient_id),
          policyId: toText(input.formData.policy_id),
          visitId: toText(input.formData.visit_id),
          requestNumber: toText(input.formData.request_number),
          requestStatus: toText(input.formData.request_status) || "REQUESTED",
          serviceCode: toText(input.formData.service_code),
          procedureCode: toText(input.formData.procedure_code),
          reason: toText(input.formData.reason),
          requestedAmount: toNum(input.formData.requested_amount),
          approvedAmount: toNum(input.formData.approved_amount),
          requestedAt: toText(input.formData.requested_at),
          approvedAt: toText(input.formData.approved_at),
          expiresAt: toText(input.formData.expires_at),
        });
      }

      if (formId === "rcm_captured_charge") {
        return post("/revenue-cycle/captured-charges", {
          patientId: input.patientId || toText(input.formData.patient_id),
          visitId: toText(input.formData.visit_id),
          moduleSource: toText(input.formData.module_source),
          serviceCode: toText(input.formData.service_code),
          department: toText(input.formData.department),
          payerType: toText(input.formData.payer_type),
          quantity: toNum(input.formData.quantity) || 1,
          unitAmount: toNum(input.formData.unit_amount),
          totalAmount: toNum(input.formData.total_amount),
          chargeStatus: toText(input.formData.charge_status) || "CAPTURED",
          eventPayload: toText(input.formData.event_payload) || JSON.stringify(input.formData),
        });
      }

      if (formId === "rcm_coding_assignment") {
        return post("/revenue-cycle/coding-assignments", {
          patientId: input.patientId || toText(input.formData.patient_id),
          visitId: toText(input.formData.visit_id),
          claimId: toText(input.formData.claim_id),
          primaryDiagnosisCode: toText(input.formData.primary_diagnosis_code),
          secondaryDiagnosisCodes: toText(input.formData.secondary_diagnosis_codes),
          procedureCodes: toText(input.formData.procedure_codes),
          codingStatus: toText(input.formData.coding_status) || "DRAFT",
          medicalNecessityNote: toText(input.formData.medical_necessity_note),
          coderId: toText(input.formData.coder_id),
        });
      }

      if (formId === "rcm_claim") {
        const capturedChargeIds = String(input.formData.captured_charge_ids || "")
          .split(",")
          .map((entry) => entry.trim())
          .filter(Boolean);

        return post("/revenue-cycle/claims", {
          patientId: input.patientId || toText(input.formData.patient_id),
          visitId: toText(input.formData.visit_id),
          policyId: toText(input.formData.policy_id),
          claimNumber: toText(input.formData.claim_number),
          payerName: toText(input.formData.payer_name),
          payerType: toText(input.formData.payer_type),
          capturedChargeIds,
          totalBilled: toNum(input.formData.total_billed),
          denialRiskScore: toNum(input.formData.denial_risk_score),
        });
      }

      if (formId === "rcm_claim_transition") {
        const claimId = toText(input.formData.claim_id);
        if (!claimId) {
          throw new Error("Claim ID is required for claim status transition.");
        }
        return patch(`/revenue-cycle/claims/${encodeURIComponent(claimId)}/status`, {
          status: toText(input.formData.status),
          reason: toText(input.formData.reason),
          overrideTransition: asBool(input.formData.override_transition),
        });
      }

      if (formId === "rcm_claim_denial") {
        return post("/revenue-cycle/claim-denials", {
          claimId: toText(input.formData.claim_id),
          responseId: toText(input.formData.response_id),
          denialReasonId: toText(input.formData.denial_reason_id),
          denialCategory: toText(input.formData.denial_category),
          denialDetails: toText(input.formData.denial_details),
          deniedAmount: toNum(input.formData.denied_amount),
          deniedAt: toText(input.formData.denied_at),
        });
      }

      if (formId === "rcm_appeal") {
        return post("/revenue-cycle/appeals", {
          claimId: toText(input.formData.claim_id),
          denialId: toText(input.formData.denial_id),
          appealStatus: toText(input.formData.appeal_status) || "OPEN",
          appealNotes: toText(input.formData.appeal_notes),
          filedAt: toText(input.formData.filed_at),
          resolvedAt: toText(input.formData.resolved_at),
        });
      }

      if (formId === "rcm_remittance_payment") {
        const remittance = await post("/revenue-cycle/remittances", {
          claimId: toText(input.formData.claim_id),
          payerName: toText(input.formData.payer_name),
          remittanceNumber: toText(input.formData.remittance_number),
          paymentDate: toText(input.formData.payment_date),
          totalPaidAmount: toNum(input.formData.total_paid_amount),
          remittancePayload: toText(input.formData.notes),
        });

        const allocationAmount = toNum(input.formData.allocation_amount);
        const claimId = toText(input.formData.claim_id);
        if (!claimId || allocationAmount === undefined || allocationAmount <= 0) {
          return remittance;
        }

        const remittanceBody = await parseJsonSafe(remittance.clone());
        const remittanceId = toText((remittanceBody as any)?.id) || toText((remittanceBody as any)?.data?.id);
        if (!remittanceId) {
          return remittance;
        }

        return post("/revenue-cycle/payment-allocations", {
          claimId,
          remittanceId,
          allocationAmount,
          allocationStatus: toText(input.formData.allocation_status) || "POSTED",
          notes: toText(input.formData.notes),
        });
      }

      if (formId === "rcm_revenue_metric") {
        return post("/revenue-cycle/metrics", {
          metricDate: toText(input.formData.metric_date),
          metricKey: toText(input.formData.metric_key),
          metricValue: toNum(input.formData.metric_value),
          metricUnit: toText(input.formData.metric_unit),
          notes: toText(input.formData.notes || note),
        });
      }

      return post("/revenue-cycle/leakage-flags", {
        flagType: "UNMAPPED_FORM_SUBMISSION",
        severity: "LOW",
        status: "OPEN",
        details: `Unmapped RCM form submission for formId=${formId || "unknown"}`,
      });
    },
    45: () => {
      if (formId === "cost_center_setup") {
        return post("/cost-accounting/cost-centers", {
          code: toText(input.formData.code),
          name: toText(input.formData.name),
          departmentId: toText(input.formData.department_id),
          departmentName: toText(input.formData.department_name),
          type: toText(input.formData.type),
          status: toText(input.formData.status),
          description: toText(input.formData.description || note),
        });
      }

      if (formId === "cost_category_setup") {
        return post("/cost-accounting/cost-categories", {
          code: toText(input.formData.code),
          name: toText(input.formData.name),
          classification: toText(input.formData.classification),
          status: toText(input.formData.status),
          description: toText(input.formData.description || note),
        });
      }

      if (formId === "cost_entry") {
        return post("/cost-accounting/cost-entries", {
          periodDate: toText(input.formData.period_date),
          periodMonth: toNum(input.formData.period_month),
          periodYear: toNum(input.formData.period_year),
          costCenterId: toText(input.formData.cost_center_id),
          costCenterCode: toText(input.formData.cost_center_code),
          costCategoryId: toText(input.formData.cost_category_id),
          classification: toText(input.formData.classification),
          departmentId: toText(input.formData.department_id),
          departmentName: toText(input.formData.department_name),
          serviceCode: toText(input.formData.service_code),
          serviceName: toText(input.formData.service_name),
          quantity: toNum(input.formData.quantity),
          unitCost: toNum(input.formData.unit_cost),
          amount: toNum(input.formData.amount),
          vendorId: toText(input.formData.vendor_id),
          vendorName: toText(input.formData.vendor_name),
          notes: toText(input.formData.notes || note),
        });
      }

      if (formId === "overhead_allocation") {
        return post("/cost-accounting/overhead-allocations", {
          periodDate: toText(input.formData.period_date),
          sourceCostCenterId: toText(input.formData.source_cost_center_id),
          sourceCostCenterCode: toText(input.formData.source_cost_center_code),
          targetCostCenterId: toText(input.formData.target_cost_center_id),
          targetCostCenterCode: toText(input.formData.target_cost_center_code),
          departmentId: toText(input.formData.department_id),
          departmentName: toText(input.formData.department_name),
          driverType: toText(input.formData.driver_type),
          driverValue: toNum(input.formData.driver_value),
          allocationAmount: toNum(input.formData.allocation_amount),
          notes: toText(input.formData.notes || note),
        });
      }

      if (formId === "service_costing") {
        return post("/cost-accounting/service-costs", {
          periodDate: toText(input.formData.period_date),
          departmentId: toText(input.formData.department_id),
          departmentName: toText(input.formData.department_name),
          costCenterId: toText(input.formData.cost_center_id),
          serviceId: toText(input.formData.service_id),
          serviceCode: toText(input.formData.service_code),
          serviceName: toText(input.formData.service_name),
          volumeCount: toNum(input.formData.volume_count),
          billedAmount: toNum(input.formData.revenue_amount),
          directCost: toNum(input.formData.direct_cost),
          allocatedOverhead: toNum(input.formData.allocated_overhead),
          totalCost: toNum(input.formData.total_cost),
          notes: toText(input.formData.notes || note),
        });
      }

      if (formId === "department_profitability") {
        return post("/cost-accounting/department-profitability", {
          periodStart: toText(input.formData.period_start),
          periodEnd: toText(input.formData.period_end),
          departmentId: toText(input.formData.department_id),
          departmentName: toText(input.formData.department_name),
          costCenterId: toText(input.formData.cost_center_id),
          revenueAmount: toNum(input.formData.revenue_amount),
          directCost: toNum(input.formData.direct_cost),
          allocatedOverhead: toNum(input.formData.allocated_overhead),
          casesCount: toNum(input.formData.cases_count),
          costPerCase: toNum(input.formData.cost_per_case),
          revenuePerCase: toNum(input.formData.revenue_per_case),
          occupancyRate: toNum(input.formData.occupancy_rate),
          staffCostRatio: toNum(input.formData.staff_cost_ratio),
          notes: toText(input.formData.notes || note),
        });
      }

      if (formId === "pricing_recommendation") {
        return post("/cost-accounting/pricing-recommendations", {
          departmentId: toText(input.formData.department_id),
          departmentName: toText(input.formData.department_name),
          serviceCode: toText(input.formData.service_code),
          serviceName: toText(input.formData.service_name),
          currentPrice: toNum(input.formData.current_price),
          recommendedPrice: toNum(input.formData.recommended_price),
          expectedMarginImpactPercent: toNum(input.formData.expected_margin_impact_percent),
          confidenceScore: toNum(input.formData.confidence_score),
          reason: toText(input.formData.reason),
          status: toText(input.formData.status),
        });
      }

      return post("/cost-accounting/cost-entries", {
        periodDate: dateOnly,
        classification: "DIRECT",
        amount: toNum(input.formData.amount) || 1,
        notes: toText(note) || "Cost accounting unmapped form fallback",
      });
    },
    46: () => {
      if (formId === "strategic_kpi_definition") {
        return post("/strategic-planning/kpi-definitions", {
          code: toText(input.formData.code),
          name: toText(input.formData.name),
          category: toText(input.formData.category),
          domain: toText(input.formData.domain),
          unit: toText(input.formData.unit),
          targetDirection: toText(input.formData.target_direction),
          status: toText(input.formData.status),
          description: toText(input.formData.description || note),
        });
      }

      if (formId === "strategic_kpi_target") {
        return post("/strategic-planning/kpi-targets", {
          kpiDefinitionId: toText(input.formData.kpi_definition_id),
          periodStart: toText(input.formData.period_start),
          periodEnd: toText(input.formData.period_end),
          targetValue: toNum(input.formData.target_value),
          warningThreshold: toNum(input.formData.warning_threshold),
          criticalThreshold: toNum(input.formData.critical_threshold),
          status: toText(input.formData.status),
          notes: toText(input.formData.notes || note),
        });
      }

      if (formId === "strategic_kpi_value") {
        return post("/strategic-planning/kpi-values", {
          kpiDefinitionId: toText(input.formData.kpi_definition_id),
          metricDate: toText(input.formData.metric_date),
          departmentId: toText(input.formData.department_id),
          departmentName: toText(input.formData.department_name),
          currentValue: toNum(input.formData.current_value),
          targetValue: toNum(input.formData.target_value),
          trendDirection: toText(input.formData.trend_direction),
          riskLevel: toText(input.formData.risk_level),
          sourceModule: toText(input.formData.source_module),
          metadata: toText(input.formData.metadata),
        });
      }

      if (formId === "strategic_goal") {
        return post("/strategic-planning/strategic-goals", {
          goalCode: toText(input.formData.goal_code),
          title: toText(input.formData.title),
          domain: toText(input.formData.domain),
          ownerRole: toText(input.formData.owner_role),
          startDate: toText(input.formData.start_date),
          endDate: toText(input.formData.end_date),
          targetValue: toNum(input.formData.target_value),
          currentValue: toNum(input.formData.current_value),
          status: toText(input.formData.status),
          notes: toText(input.formData.notes || note),
        });
      }

      if (formId === "strategic_facility_ranking") {
        return post("/strategic-planning/facility-rankings", {
          rankingDate: toText(input.formData.ranking_date),
          metricKey: toText(input.formData.metric_key),
          rankPosition: toNum(input.formData.rank_position),
          score: toNum(input.formData.score),
          comparativeValue: toNum(input.formData.comparative_value),
          notes: toText(input.formData.notes || note),
        });
      }

      if (formId === "strategic_forecasting_model") {
        return post("/strategic-planning/forecasting-models", {
          modelName: toText(input.formData.model_name),
          metricKey: toText(input.formData.metric_key),
          forecastDate: toText(input.formData.forecast_date),
          horizonDays: toNum(input.formData.horizon_days),
          predictedValue: toNum(input.formData.predicted_value),
          confidenceScore: toNum(input.formData.confidence_score),
          status: toText(input.formData.status),
          notes: toText(input.formData.notes || note),
        });
      }

      if (formId === "strategic_scenario_simulation") {
        return post("/strategic-planning/scenario-simulations", {
          scenarioName: toText(input.formData.scenario_name),
          assumptionPayload: toText(input.formData.assumption_payload),
          projectedRevenueImpact: toNum(input.formData.projected_revenue_impact),
          projectedCostImpact: toNum(input.formData.projected_cost_impact),
          projectedMarginImpact: toNum(input.formData.projected_margin_impact),
          projectedRiskScore: toNum(input.formData.projected_risk_score),
          status: toText(input.formData.status),
        });
      }

      if (formId === "strategic_risk_alert") {
        return post("/strategic-planning/risk-alerts", {
          alertType: toText(input.formData.alert_type),
          severity: toText(input.formData.severity),
          status: toText(input.formData.status),
          description: toText(input.formData.description),
          sourceModule: toText(input.formData.source_module),
          riskScore: toNum(input.formData.risk_score),
          detectedAt: toText(input.formData.detected_at),
        });
      }

      if (formId === "executive_note") {
        return post("/strategic-planning/executive-notes", {
          noteType: toText(input.formData.note_type),
          title: toText(input.formData.title),
          message: toText(input.formData.message),
          linkedEntityType: toText(input.formData.linked_entity_type),
          linkedEntityId: toText(input.formData.linked_entity_id),
          priority: toText(input.formData.priority),
          status: toText(input.formData.status),
          authorRole: toText(input.formData.author_role),
        });
      }

      return post("/strategic-planning/executive-notes", {
        noteType: "STRATEGIC",
        title: `Module ${input.moduleId} fallback`,
        message: toText(note) || "Strategic planning unmapped form fallback",
        priority: "MEDIUM",
        status: "OPEN",
      });
    },
    47: async () => {
      if (formId === "orchestration_event_publish") {
        const parsePayload = () => {
          const raw = toText(input.formData.payload_json);
          if (!raw) return {};
          try {
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
              return parsed as Record<string, unknown>;
            }
            return { value: parsed };
          } catch {
            return { raw };
          }
        };

        return post("/orchestration/events", {
          facilityId: toText(input.formData.facility_id),
          tenantId: toText(input.formData.tenant_id),
          departmentId: toText(input.formData.department_id),
          eventType: toText(input.formData.event_type),
          sourceModule: toText(input.formData.source_module),
          dataOwner: toText(input.formData.data_owner),
          entityType: toText(input.formData.entity_type),
          entityId: toText(input.formData.entity_id),
          patientId: input.patientId || toText(input.formData.patient_id),
          visitId: toText(input.formData.visit_id),
          payload: parsePayload(),
          processAsync:
            input.formData.process_async === undefined
              ? false
              : asBool(input.formData.process_async),
          bypassOwnershipRule:
            input.formData.bypass_ownership_rule === undefined
              ? false
              : asBool(input.formData.bypass_ownership_rule),
        });
      }

      if (formId === "orchestration_process_pending") {
        return post("/orchestration/process-pending", {
          facilityId: toText(input.formData.facility_id),
          limit: toNum(input.formData.limit),
        });
      }

      if (formId === "orchestration_reprocess_event") {
        const eventId = toText(input.formData.event_id);
        if (!eventId) {
          throw new Error("Event ID is required for event reprocess.");
        }
        const facilityId = toText(input.formData.facility_id);
        const querySuffix = facilityId ? `?facilityId=${encodeURIComponent(facilityId)}` : "";
        return post(`/orchestration/events/${encodeURIComponent(eventId)}/reprocess${querySuffix}`, {});
      }

      if (formId === "orchestration_list_events") {
        const params = new URLSearchParams();
        const facilityId = toText(input.formData.facility_id);
        const eventType = toText(input.formData.event_type);
        const status = toText(input.formData.status);
        const limit = toNum(input.formData.limit);
        if (facilityId) params.set("facilityId", facilityId);
        if (eventType) params.set("eventType", eventType);
        if (status) params.set("status", status);
        if (limit !== undefined) params.set("limit", String(limit));
        const query = params.toString();
        return apiFetch(`/orchestration/events${query ? `?${query}` : ""}`);
      }

      return post("/orchestration/process-pending", {
        facilityId: toText(input.formData.facility_id),
        limit: toNum(input.formData.limit) || 100,
      });
    },
  };

  const handler = moduleHandlers[input.moduleId];
  let resolvedPatientId = input.patientId;
  let body: any = { ok: true };
  let usedFallbackMode = false;

  if (handler) {
    try {
      const response = await handler();
      body = await parseJsonSafe(response);
      if (!response.ok) {
        throw new Error(toErrorMessage(body, "Failed to submit module data"));
      }
    } catch (error: any) {
      try {
        const fallbackResponse = await logModuleEvent(`module_${input.moduleId}_submit_fallback`, {
          error: String(error?.message || "Unknown module submit error"),
          formData: input.formData,
          mode: "fallback_after_primary_failure",
        });
        const fallbackBody = await parseJsonSafe(fallbackResponse);
        if (!fallbackResponse.ok) {
          throw new Error(toErrorMessage(fallbackBody, "Failed to submit module fallback data"));
        }
        usedFallbackMode = true;
        body = { ...fallbackBody, _fallbackSaved: true };
      } catch {
        // preserve original error when fallback also fails
        throw error;
      }
    }
  } else {
    const fallbackResponse = await logModuleEvent(`module_${input.moduleId}_submit`, {
      mode: "fallback",
      formData: input.formData,
    });
    usedFallbackMode = true;
    body = await parseJsonSafe(fallbackResponse);
    if (!fallbackResponse.ok) {
      throw new Error(toErrorMessage(body, "Failed to submit module data"));
    }
  }

  if (!usedFallbackMode) {
    try {
      await logModuleEvent(`module_${input.moduleId}_submit`, {
        mode: "primary",
        formData: input.formData,
      });
    } catch {
      // telemetry shouldn't block primary flow
    }
  }

  if (!resolvedPatientId && input.moduleId === 1 && body?.id) {
    resolvedPatientId = String(body.id);
  }

  if (!usedFallbackMode) {
    emitAutoRcmCharge(body, resolvedPatientId);
  }

  const queueTo = extractQueueTargetFromForm(input.formData);
  if (!queueTo || !resolvedPatientId || !isPatientQueueModule(input.moduleId)) {
    return { ...body, _resolvedPatientId: resolvedPatientId };
  }

  const queueDestination = resolveQueueModuleId(queueTo);
  if (!queueDestination.isComplete && !queueDestination.moduleId) {
    throw new Error(
      "Queue destination not recognized. Choose a valid module from suggestions.",
    );
  }

  const status = queueDestination.isComplete
    ? "COMPLETED"
    : `MODULE_${queueDestination.moduleId}`;

  const queueRes = await post("/visits", {
    patientId: resolvedPatientId,
    visitType: "WORKFLOW_QUEUE",
    status,
  });
  if (!queueRes.ok) {
    const queueBody = await parseJsonSafe(queueRes);
    throw new Error(
      toErrorMessage(queueBody, "Saved core data but failed to update queue destination"),
    );
  }

  return { ...body, _resolvedPatientId: resolvedPatientId };
}
