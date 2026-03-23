import { useCallback, useEffect, useMemo, useState } from "react";
import { isTauriRuntime } from "../lib/isTauri";

type UpdaterState =
  | { status: "idle" }
  | { status: "checking" }
  | { status: "available"; version: string; date?: string | null; notes?: string | null }
  | { status: "downloading"; progress?: number | null }
  | { status: "installed" }
  | { status: "error"; message: string };

const LAST_CHECK_KEY = "hmis_last_update_check_ts";
const CHECK_COOLDOWN_MS = 1000 * 60 * 60 * 6; // 6 hours

export function DesktopUpdater() {
  const enabled = useMemo(() => isTauriRuntime() && Boolean(import.meta.env.PROD), []);
  const [state, setState] = useState<UpdaterState>({ status: "idle" });
  const [hidden, setHidden] = useState(false);

  const checkForUpdates = useCallback(async (force = false) => {
    if (!enabled) return;
    if (state.status === "checking" || state.status === "downloading") return;

    const now = Date.now();
    const last = Number(localStorage.getItem(LAST_CHECK_KEY) || "0");
    if (!force && last && now - last < CHECK_COOLDOWN_MS) return;
    localStorage.setItem(LAST_CHECK_KEY, String(now));

    setState({ status: "checking" });
    try {
      const mod = await import("@tauri-apps/plugin-updater");
      const update = await mod.check();
      if (!update) {
        setState({ status: "idle" });
        return;
      }
      setHidden(false);
      setState({
        status: "available",
        version: String(update.version || "new"),
        date: (update as any).date ? String((update as any).date) : null,
        notes: (update as any).body ? String((update as any).body) : null,
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

      // v2 updater currently does download+install in one step.
      // Some platforms may still require an app relaunch to finish.
      await update.downloadAndInstall();

      setState({ status: "installed" });

      try {
        const proc = await import("@tauri-apps/plugin-process");
        await proc.relaunch();
      } catch {
        // If relaunch isn't available, user can restart manually.
      }
    } catch (err: any) {
      setState({ status: "error", message: err?.message || "Update failed." });
    }
  }, [enabled, state.status]);

  useEffect(() => {
    // Check once at startup (with a cooldown) so users get update prompts automatically.
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

  return (
    <div className="hmis-update-banner" role="status" aria-live="polite">
      <div className="hmis-update-banner__text">
        <div className="hmis-update-banner__title">{title}</div>
        {message ? <div className="hmis-update-banner__message">{message}</div> : null}
      </div>
      <div className="hmis-update-banner__actions">
        {canInstall ? (
          <button className="hmis-update-banner__btn primary" onClick={downloadAndInstall}>
            Update now
          </button>
        ) : null}
        {canDismiss ? (
          <button className="hmis-update-banner__btn" onClick={() => setHidden(true)}>
            Dismiss
          </button>
        ) : null}
        {state.status === "error" ? (
          <button className="hmis-update-banner__btn" onClick={() => checkForUpdates(true)}>
            Retry
          </button>
        ) : null}
      </div>
    </div>
  );
}
