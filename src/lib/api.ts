import {
  apiFetch,
  API_BASE_URL,
  getAccessToken,
  setTokens,
  clearTokens,
} from "./apiClient";

export { API_BASE_URL, getAccessToken };

export const setAccessToken = (token?: string | null) => {
  if (token) {
    setTokens({ accessToken: token });
  } else {
    clearTokens();
  }
};

export const clearAccessToken = () => {
  clearTokens();
};

function sanitizeErrorMessage(status: number, rawMessage?: string | null): string {
  const msg = String(rawMessage || "").trim();
  if (!msg || /failed to fetch/i.test(msg) || /network\s?error/i.test(msg) || /load failed/i.test(msg)) {
    return "Hospital service is synchronizing. Please check connectivity.";
  }
  if (status === 401 || /status 401/i.test(msg) || /unauthorized/i.test(msg)) {
    return "Session verification in progress. Please re-authenticate if prompted.";
  }
  return msg;
}

export const api = {
  get: async (path: string, options?: { params?: Record<string, any>; headers?: Record<string, string> }) => {
    let url = path;
    if (options?.params) {
      const sp = new URLSearchParams();
      for (const [k, v] of Object.entries(options.params)) {
        if (v !== undefined && v !== null && v !== "") {
          sp.append(k, String(v));
        }
      }
      const qs = sp.toString();
      if (qs) url += (url.includes("?") ? "&" : "?") + qs;
    }
    try {
      const res = await apiFetch(url, {
        method: "GET",
        headers: options?.headers,
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        const safeMsg = sanitizeErrorMessage(res.status, data?.message || data?.error);
        const err: any = new Error(safeMsg);
        err.response = { status: res.status, data };
        throw err;
      }
      return { data, status: res.status, ok: true };
    } catch (err: any) {
      if (!err.response) {
        err.message = sanitizeErrorMessage(0, err.message);
      }
      throw err;
    }
  },

  post: async (path: string, body?: any, options?: { headers?: Record<string, string> }) => {
    try {
      const res = await apiFetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...options?.headers },
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        const safeMsg = sanitizeErrorMessage(res.status, data?.message || data?.error);
        const err: any = new Error(safeMsg);
        err.response = { status: res.status, data };
        throw err;
      }
      return { data, status: res.status, ok: true };
    } catch (err: any) {
      if (!err.response) {
        err.message = sanitizeErrorMessage(0, err.message);
      }
      throw err;
    }
  },

  patch: async (path: string, body?: any, options?: { headers?: Record<string, string> }) => {
    try {
      const res = await apiFetch(path, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...options?.headers },
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        const safeMsg = sanitizeErrorMessage(res.status, data?.message || data?.error);
        const err: any = new Error(safeMsg);
        err.response = { status: res.status, data };
        throw err;
      }
      return { data, status: res.status, ok: true };
    } catch (err: any) {
      if (!err.response) {
        err.message = sanitizeErrorMessage(0, err.message);
      }
      throw err;
    }
  },

  put: async (path: string, body?: any, options?: { headers?: Record<string, string> }) => {
    try {
      const res = await apiFetch(path, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...options?.headers },
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        const safeMsg = sanitizeErrorMessage(res.status, data?.message || data?.error);
        const err: any = new Error(safeMsg);
        err.response = { status: res.status, data };
        throw err;
      }
      return { data, status: res.status, ok: true };
    } catch (err: any) {
      if (!err.response) {
        err.message = sanitizeErrorMessage(0, err.message);
      }
      throw err;
    }
  },

  delete: async (path: string, options?: { headers?: Record<string, string>; data?: any }) => {
    try {
      const res = await apiFetch(path, {
        method: "DELETE",
        headers: options?.data !== undefined
          ? { "Content-Type": "application/json", ...options?.headers }
          : options?.headers,
        body: options?.data !== undefined ? JSON.stringify(options.data) : undefined,
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        const safeMsg = sanitizeErrorMessage(res.status, data?.message || data?.error);
        const err: any = new Error(safeMsg);
        err.response = { status: res.status, data };
        throw err;
      }
      return { data, status: res.status, ok: true };
    } catch (err: any) {
      if (!err.response) {
        err.message = sanitizeErrorMessage(0, err.message);
      }
      throw err;
    }
  },
};

// Automation endpoints for HMIS parity with Medilink-Frontend
export const transferQueueToken = async (payload: {
  tokenNumber?: string;
  tokenId?: string;
  departmentId: string;
  queueType?: string;
  tokenPrefix?: string;
  reason?: string;
  priority?: string | number;
}) => {
  const res = await api.patch("/opd/queue/token/transfer", payload || {});
  return (res.data as any)?.data ?? res.data;
};

export type HmisAutomationArea =
  | "patients"
  | "appointments"
  | "queue"
  | "pharmacy";

export const runHmisAutomation = async (
  area: HmisAutomationArea,
  action: string,
  payload: Record<string, unknown> = {},
) => {
  const res = await api.post(`/hmis-automation/${area}/${action}`, payload);
  return (res.data as any)?.data ?? res.data;
};

export const runClinicalAutomation = async (
  module: string,
  action: string,
  payload: Record<string, unknown> = {},
) => {
  const res = await api.post(`/hmis-automation/clinical/${module}/${action}`, payload);
  return (res.data as any)?.data ?? res.data;
};

export const runDiagnosticsAutomation = async (
  module: "lab" | "radiology",
  action: string,
  payload: Record<string, unknown> = {},
) => {
  const res = await api.post(`/hmis-automation/diagnostics/${module}/${action}`, payload);
  return (res.data as any)?.data ?? res.data;
};

export const runFinanceAutomation = async (
  module: string,
  action: string,
  payload: Record<string, unknown> = {},
) => {
  const res = await api.post(`/hmis-automation/finance/${module}/${action}`, payload);
  return (res.data as any)?.data ?? res.data;
};

export const runSupportAutomation = async (
  module: string,
  action: string,
  payload: Record<string, unknown> = {},
) => {
  const res = await api.post(`/hmis-automation/support/${module}/${action}`, payload);
  return (res.data as any)?.data ?? res.data;
};
