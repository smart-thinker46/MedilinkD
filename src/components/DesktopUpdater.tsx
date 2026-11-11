import { useCallback, useEffect, useMemo, useState } from "react";
import { isTauriRuntime } from "../lib/isTauri";

// Constants for periodic checks and snooze handling
const UPDATE_CHECK_INTERVAL_MS = 1000 * 60 * 60 * 6; // 6 hours
const SNOOZE_KEY = "hmis_update_snooze_until";

type UpdaterState =
  | { status: "idle" }
  | { status: "checking" }
  | { status: "available"; version: string; date?: string | null; notes?: string | null; classification: "optional" | "recommended" | "mandatory" }
  | { status: "downloading"; progress?: number | null }
  | { status: "installed" }
  | { status: "error"; message: string };

const LAST_CHECK_KEY = "hmis_last_update_check_ts";
const CHECK_COOLDOWN_MS = 1000 * 60 * 60 * 6; // 6 hours

export function DesktopUpdater() {
  const enabled = useMemo(() => isTauriRuntime() && Boolean(import.meta.env.PROD), []);
  const [state, setState] = useState<UpdaterState>({ status: "idle" });
  const [hidden, setHidden] = useState(false);

  // Helper to parse classification from release notes – simple keyword based for now
  const parseClassification = (notes: string | null): "optional" | "recommended" | "mandatory" => {
    if (!notes) return "optional";
    const lower = notes.toLowerCase();
    if (lower.includes("[mandatory]") || lower.includes("mandatory update")) return "mandatory";
    if (lower.includes("[recommended]") || lower.includes("recommended update")) return "recommended";
    return "optional";
  };

  const checkForUpdates = useCallback(async (force = false) => {
    if (!enabled) return;
    if (state.status === "checking" || state.status === "downloading") return;

    const now = Date.now();
    const last = Number(localStorage.getItem(LAST_CHECK_KEY) || "0");
    const snoozedUntil = Number(localStorage.getItem(SNOOZE_KEY) || "0");
    if (!force && last && now - last < CHECK_COOLDOWN_MS) return;
    if (now < snoozedUntil) return; // user postponed

    localStorage.setItem(LAST_CHECK_KEY, String(now));
    setState({ status: "checking" });
    try {
      const mod = await import("@tauri-apps/plugin-updater");
      const update = await mod.check();
      if (!update) {
        setState({ status: "idle" });
        return;
      }
      const notes = (update as any).body ? String((update as any).body) : null;
      const classification = parseClassification(notes);
      setHidden(false);
      setState({
        status: "available",
        version: String(update.version || "new"),
        date: (update as any).date ? String((update as any).date) : null,
        notes,
        classification,
      });
    } catch (err: any) {
      setState({ status: "error", message: err?.message || "Update check failed." });
    }
  }, [enabled, state.status]);

  const downloadAndInstall = useCallback(async () => {
    if (!enabled) return;
    if (state.status !== "available") return;

    setState({ status: "downloading", progress: null });
    try {
      const mod = await import("@tauri-apps/plugin-updater");
      const update = await mod.check();
      if (!update) {
        setState({ status: "idle" });
        return;
      }
      await update.downloadAndInstall();
      setState({ status: "installed" });
      try {
        const proc = await import("@tauri-apps/plugin-process");
        await proc.relaunch();
      } catch { /* ignore */ }
    } catch (err: any) {
      setState({ status: "error", message: err?.message || "Update failed." });
    }
  }, [enabled, state.status]);

  // Periodic check using interval
  useEffect(() => {
    if (!enabled) return;
    const interval = setInterval(() => checkForUpdates(false), UPDATE_CHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [enabled, checkForUpdates]);

  // Listen for network reconnection (online event)
  useEffect(() => {
    if (!enabled) return;
    const handler = () => checkForUpdates(true);
    window.addEventListener("online", handler);
    return () => window.removeEventListener("online", handler);
  }, [enabled, checkForUpdates]);

  // Initial check on mount (respect cooldown)
  useEffect(() => {
    checkForUpdates(false);
  }, [checkForUpdates]);

  if (!enabled) return null;
  if (hidden) return null;
  if (state.status === "idle") return null;

  const title =
    state.status === "checking"
      ? "Checking for updates..."
      : state.status === "available"
        ? `Update available: v${state.version}`
        : state.status === "downloading"
          ? "Downloading update..."
          : state.status === "installed"
            ? "Update installed. Restarting..."
            : "Update error";

  const message =
    state.status === "available"
      ? state.notes || "A new version of Medilink HMIS is available."
      : state.status === "error"
        ? state.message
        : "";

  const canInstall = state.status === "available";
  const canDismiss = state.status === "available" || state.status === "error";

  const isMandatory = state.status === "available" && state.classification === "mandatory";

  const handleDismiss = () => {
    if (state.classification !== "mandatory") {
      const snoozeUntil = Date.now() + 1000 * 60 * 60 * 24; // 24h
      localStorage.setItem(SNOOZE_KEY, String(snoozeUntil));
    }
    setHidden(true);
  };

  return (
    <div className="hmis-update-banner" role="status" aria-live="polite">
      <div className="hmis-update-banner__text">
        <div className="hmis-update-banner__title">{title}</div>
        {message ? <div className="hmis-update-banner__message">{message}</div> : null}
      </div>
      <div className="hmis-update-banner__actions">
        {canInstall && (
          <button className="hmis-update-banner__btn primary" onClick={downloadAndInstall}>Update now</button>
        )}
        {canDismiss && (
          <button className="hmis-update-banner__btn" onClick={handleDismiss}>{isMandatory ? "Close" : "Remind me later"}</button>
        )}
        {state.status === "error" && (
          <button className="hmis-update-banner__btn" onClick={() => checkForUpdates(true)}>Retry</button>
        )}
      </div>
    </div>
  );
}
