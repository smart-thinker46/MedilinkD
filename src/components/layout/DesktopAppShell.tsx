import React, { useEffect, useState } from "react";
import { OrderInbox } from "./OrderInbox";
import { TableInteractionLayer } from "./TableInteractionLayer";
import { FieldDescriptionLayer } from "./FieldDescriptionLayer";

type DesktopAppShellProps = {
  children: React.ReactNode;
  activeModuleId?: number | null;
};

export function DesktopAppShell({ children, activeModuleId }: DesktopAppShellProps) {
  const [orderDestination, setOrderDestination] = useState<string | null>(null);

  useEffect(() => {
    const open = (event: Event) =>
      setOrderDestination(
        (event as CustomEvent<{ destinationModule?: string }>).detail
          ?.destinationModule || null,
      );
    window.addEventListener("hmis:open-module-orders", open);
    return () => window.removeEventListener("hmis:open-module-orders", open);
  }, []);

  // Apply display preferences at the shell level so they affect every route
  useEffect(() => {
    const root = document.documentElement;
    const applyPreferences = () => {
      const theme =
        window.localStorage.getItem("hmis.theme") ||
        window.localStorage.getItem("hmis_app_mode") ||
        "system";
      const density =
        window.localStorage.getItem("hmis.density") ||
        (window.localStorage.getItem("hmis_compact_dashboard") === "false"
          ? "comfortable"
          : "compact");
      const language = window.localStorage.getItem("hmis.language") || "en";
      const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
      root.dataset.theme =
        theme === "system" ? (prefersDark ? "dark" : "light") : theme;
      root.dataset.themePreference = theme;
      root.dataset.density = density;
      root.lang = language;
    };

    applyPreferences();
    const onPreferenceChange = () => applyPreferences();
    const media = window.matchMedia?.("(prefers-color-scheme: dark)");
    window.addEventListener("hmis:preferences-changed", onPreferenceChange);
    media?.addEventListener?.("change", onPreferenceChange);
    return () => {
      window.removeEventListener("hmis:preferences-changed", onPreferenceChange);
      media?.removeEventListener?.("change", onPreferenceChange);
    };
  }, []);

  // Metric card click and keyboard selection -> scroll to worklist
  useEffect(() => {
    const selector = [
      ".pv-stat-card:not(button)",
      ".biomed-stat:not(button)",
      ".ai-stat:not(button)",
      ".canteen-stat:not(button)",
      ".cdss-stat:not(button)",
      ".consent-stat:not(button)",
      ".cost-stat:not(button)",
      ".facility-stat:not(button)",
      ".helpdesk-stat:not(button)",
      ".hr-stat:not(button)",
      ".inventory-stat:not(button)",
      ".nursing-admin-stat:not(button)",
      ".paeds-stat:not(button)",
      ".ot-stat:not(button)",
      ".icu-stat:not(button)",
      ".referrals-stat:not(button)",
      ".reports-stat:not(button)",
      ".exec-stat:not(button)",
      ".doctor-stat:not(button)",
      ".wf-stat:not(button)",
      ".stat-card:not(button)",
    ].join(",");

    const cards = Array.from(document.querySelectorAll<HTMLElement>(selector));
    cards.forEach((card) => {
      if (!card.hasAttribute("tabindex")) card.tabIndex = 0;
      if (!card.hasAttribute("role")) card.setAttribute("role", "button");
    });

    const selectCard = (card: HTMLElement) => {
      card.classList.add("is-active");
      const worklist = card
        .closest("main, .workflow-canvas, .desktop-main-scroll")
        ?.querySelector<HTMLElement>(
          ".pv-table-wrap, .module-dashboard-table-shell, [class*='table-wrap'], table",
        );
      worklist?.scrollIntoView({ behavior: "smooth", block: "start" });
      window.dispatchEvent(
        new CustomEvent("hmis:stat-card-selected", {
          detail: {
            label:
              card.querySelector(".pv-stat-label, span, p")?.textContent?.trim() ||
              "Metric",
          },
        }),
      );
    };

    const onClick = (event: MouseEvent) => {
      const card = (event.target as HTMLElement).closest<HTMLElement>(selector);
      if (card) selectCard(card);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      const card = (event.target as HTMLElement).closest<HTMLElement>(selector);
      if (!card) return;
      event.preventDefault();
      selectCard(card);
    };

    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [activeModuleId]);

  // Form keyboard navigation
  useEffect(() => {
    const onFormEnter = (event: KeyboardEvent) => {
      if (event.key !== "Enter" || event.shiftKey || event.isComposing) return;
      const target = event.target as HTMLElement | null;
      if (!target || target.closest("[data-enter-nav=off]")) return;
      if (target instanceof HTMLTextAreaElement || target.isContentEditable) return;
      if (!(target instanceof HTMLInputElement || target instanceof HTMLSelectElement))
        return;
      const form = target.closest("form");
      if (!form) return;

      const controls = Array.from(
        form.querySelectorAll<HTMLElement>(
          "input:not([type=hidden]):not([disabled]), select:not([disabled]), textarea:not([disabled])",
        ),
      ).filter(
        (control) =>
          control.offsetParent !== null && control.getAttribute("tabindex") !== "-1",
      );
      const index = controls.indexOf(target);
      if (index < 0) return;
      const next = controls[index + 1];
      if (next) {
        event.preventDefault();
        next.focus();
        if (next instanceof HTMLInputElement || next instanceof HTMLTextAreaElement)
          next.select();
        return;
      }

      const submit = form.querySelector<HTMLButtonElement>(
        "button[type=submit], input[type=submit]",
      );
      if (submit && !submit.disabled) {
        event.preventDefault();
        submit.click();
      }
    };

    document.addEventListener("keydown", onFormEnter);
    return () => document.removeEventListener("keydown", onFormEnter);
  }, []);

  return (
    <>
      <TableInteractionLayer activeModuleId={activeModuleId} />
      <FieldDescriptionLayer />
      {children}
      {orderDestination ? (
        <OrderInbox
          destinationModule={orderDestination}
          onClose={() => setOrderDestination(null)}
        />
      ) : null}
    </>
  );
}

