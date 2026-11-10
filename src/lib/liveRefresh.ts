import { useEffect, useRef } from "react";

export const HMIS_LIVE_REFRESH_EVENT = "hmis:live-data-changed";
export const HMIS_LIVE_REFRESH_STORAGE_KEY = "hmis_live_data_changed_at";

export type LiveRefreshDetail = {
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
    source: detail.source || "desktop",
  };
  window.dispatchEvent(new CustomEvent(HMIS_LIVE_REFRESH_EVENT, { detail: payload }));
  try {
    window.localStorage.setItem(HMIS_LIVE_REFRESH_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Cross-tab / cross-process refresh is best effort.
  }
}

export function useLiveRefresh(
  refresh: () => void | Promise<void>,
  options: { intervalMs?: number; enabled?: boolean; triggerOnEvent?: boolean } = {},
) {
  const refreshRef = useRef(refresh);
  const enabled = options.enabled !== false;
  const intervalMs = options.intervalMs ?? 90000;
  const triggerOnEvent = options.triggerOnEvent !== false;
  const lastRunRef = useRef(0);

  useEffect(() => {
    refreshRef.current = refresh;
  }, [refresh]);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    let running = false;
    const run = (force = false) => {
      const now = Date.now();
      // Throttle rapid successive calls within 1.5 seconds unless forced
      if (!force && now - lastRunRef.current < 1500) return;
      if (running || (document.visibilityState === "hidden" && !force)) return;

      running = true;
      lastRunRef.current = now;
      Promise.resolve(refreshRef.current()).finally(() => {
        running = false;
      });
    };

    // 1. Recurring background interval
    const timer = window.setInterval(() => run(false), intervalMs);

    // 2. Window focus & visibility recovery
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        run(false);
      }
    };
    const handleFocus = () => run(false);

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);

    // 3. Custom event and cross-window storage event
    let handleLiveRefresh: ((e: Event) => void) | null = null;
    let handleStorage: ((e: StorageEvent) => void) | null = null;

    if (triggerOnEvent) {
      handleLiveRefresh = () => run(false);
      handleStorage = (e: StorageEvent) => {
        if (e.key === HMIS_LIVE_REFRESH_STORAGE_KEY && e.newValue) {
          run(false);
        }
      };
      window.addEventListener(HMIS_LIVE_REFRESH_EVENT, handleLiveRefresh);
      window.addEventListener("storage", handleStorage);
    }

    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
      if (handleLiveRefresh) {
        window.removeEventListener(HMIS_LIVE_REFRESH_EVENT, handleLiveRefresh);
      }
      if (handleStorage) {
        window.removeEventListener("storage", handleStorage);
      }
    };
  }, [enabled, intervalMs, triggerOnEvent]);
}
