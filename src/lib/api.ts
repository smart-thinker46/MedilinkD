import { apiFetch, API_BASE_URL } from "./apiClient";

export { API_BASE_URL };

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
    const res = await apiFetch(url, {
      method: "GET",
      headers: options?.headers,
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      const err: any = new Error(data?.message || `Request failed with status ${res.status}`);
      err.response = { status: res.status, data };
      throw err;
    }
    return { data, status: res.status, ok: true };
  },

  post: async (path: string, body?: any, options?: { headers?: Record<string, string> }) => {
    const res = await apiFetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...options?.headers },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      const err: any = new Error(data?.message || `Request failed with status ${res.status}`);
      err.response = { status: res.status, data };
      throw err;
    }
    return { data, status: res.status, ok: true };
  },

  patch: async (path: string, body?: any, options?: { headers?: Record<string, string> }) => {
    const res = await apiFetch(path, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...options?.headers },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      const err: any = new Error(data?.message || `Request failed with status ${res.status}`);
      err.response = { status: res.status, data };
      throw err;
    }
    return { data, status: res.status, ok: true };
  },

  put: async (path: string, body?: any, options?: { headers?: Record<string, string> }) => {
    const res = await apiFetch(path, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...options?.headers },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      const err: any = new Error(data?.message || `Request failed with status ${res.status}`);
      err.response = { status: res.status, data };
      throw err;
    }
    return { data, status: res.status, ok: true };
  },

  delete: async (path: string, options?: { headers?: Record<string, string> }) => {
    const res = await apiFetch(path, {
      method: "DELETE",
      headers: options?.headers,
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      const err: any = new Error(data?.message || `Request failed with status ${res.status}`);
      err.response = { status: res.status, data };
      throw err;
    }
    return { data, status: res.status, ok: true };
  },
};

