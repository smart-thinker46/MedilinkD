import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

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

  // Best effort only: hides production logs from end users.
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

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
