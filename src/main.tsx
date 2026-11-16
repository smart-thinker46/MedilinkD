import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { LoadingProvider } from "./components/loading/LoadingContext";
import { LoadingOverlay } from "./components/loading/LoadingOverlay";
import "./App.css";
import "./tailwind.css";
import "./components/loading/loading.css";

if (import.meta.env.PROD) {
  const blockedCombo = (event: KeyboardEvent) => {
    const key = event.key.toLowerCase();
    const ctrlOrMeta = event.ctrlKey || event.metaKey;
    const isDevtoolsCombo =
      key === "f12" ||
      (ctrlOrMeta && event.shiftKey && (key === "i" || key === "j" || key === "c")) ||
      (ctrlOrMeta && key === "u");
    if (isDevtoolsCombo) {
      event.preventDefault();
      event.stopPropagation();
    }
  };
  window.addEventListener("keydown", blockedCombo, { capture: true });
  window.addEventListener("contextmenu", (event) => event.preventDefault());
  const noop = () => undefined;
  window.console.log = noop;
  window.console.info = noop;
  window.console.debug = noop;
  window.console.warn = noop;
  Object.defineProperty(window, "__REACT_DEVTOOLS_GLOBAL_HOOK__", {
    value: { isDisabled: true },
    configurable: false,
    writable: false,
  });
}

const rootEl = document.getElementById("root") as HTMLElement;

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <LoadingProvider>
      <App />
      <LoadingOverlay />
    </LoadingProvider>
  </React.StrictMode>
);

// The single unified splash screen with App Icon and circular spinner is shown
// until React finishes bootstrapping and transitions beyond authScreen 'splash'.
// As a fallback to prevent hanging, hide it after 2 seconds if still visible.
setTimeout(() => {
  const splash = document.getElementById("preload-splash");
  if (splash && !splash.classList.contains("hidden")) {
    splash.classList.add("hidden");
    setTimeout(() => {
      try {
        splash.remove();
      } catch {
        // ignore
      }
    }, 260);
  }
}, 2000);
