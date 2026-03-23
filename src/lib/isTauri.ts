export function isTauriRuntime() {
  try {
    return typeof window !== "undefined" && Boolean((window as any).__TAURI_INTERNALS__);
  } catch {
    return false;
  }
}

