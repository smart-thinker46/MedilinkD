import { useEffect, useRef } from "react";

export const HMIS_LIVE_REFRESH_EVENT = "hmis:live-data-changed";
const HMIS_LIVE_REFRESH_STORAGE_KEY = "hmis_live_data_changed_at";

type LiveRefreshDetail = {
  method?: string;
  url?: string;
  source?: string;
  changedAt?: string;
};

export function notifyLiveDataChanged(detail: LiveRefreshDetail = {}) {
  if (typeof window === "undefined") return;
  const payload = {
    ...detail,
    changedAt: detail.changedAt || new Date().toISOString(),
  };
  window.dispatchEvent(new CustomEvent(HMIS_LIVE_REFRESH_EVENT, { detail: payload }));
  try {
    window.localStorage.setItem(HMIS_LIVE_REFRESH_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Cross-tab refresh is best effort only.
  }
}

export function useLiveRefresh(
  refresh: () => void | Promise<void>,
  options: { intervalMs?: number; enabled?: boolean } = {},
) {
  const refreshRef = useRef(refresh);
  const enabled = options.enabled !== false;
  const intervalMs = options.intervalMs ?? 90000;

  useEffect(() => {
    refreshRef.current = refresh;
  }, [refresh]);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    let running = false;
    const run = () => {
      if (running || document.visibilityState === "hidden") return;
      running = true;
      Promise.resolve(refreshRef.current()).finally(() => {
        running = false;
      });
    };
    const timer = window.setInterval(run, intervalMs);
    return () => {
      window.clearInterval(timer);
    };
  }, [enabled, intervalMs]);
}
