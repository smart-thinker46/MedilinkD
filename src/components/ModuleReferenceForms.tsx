"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { api } from "../lib/api";
import {
  MODULE_ACTION_FORMS,
  type ModuleActionField,
  type ModuleActionFormDefinition,
} from "../lib/moduleActionForms";
import { useAppStore } from "../store/appStore";
import { ModuleIcon } from "./layout/ModuleIcon";

type ModuleReferenceFormsProps = {
  moduleKey: string;
  moduleTitle: string;
  onSaved?: () => void | Promise<void>;
  excludeFormNames?: string[];
};

type ActiveFormState = {
  title: string;
  description?: string;
  fields: ModuleActionField[];
  accentColor?: string;
};

const palette = [
  "#16a34a",
  "#2563eb",
  "#7c3aed",
  "#0891b2",
  "#f59e0b",
  "#0d9488",
  "#9333ea",
  "#475569",
];

const normalizeText = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

const formatFormTitle = (value: string) => value.replace(/\s+Form$/i, "").trim();

const pickIcon = (formTitle: string) => {
  const key = normalizeText(formTitle);
  if (key.includes("appointment") || key.includes("slot") || key.includes("roster") || key.includes("schedule")) return "event";
  if (key.includes("triage") || key.includes("assessment") || key.includes("vital")) return "fact_check";
  if (key.includes("consultation") || key.includes("encounter") || key.includes("clinical") || key.includes("doctor")) return "stethoscope";
  if (key.includes("admission") || key.includes("ward") || key.includes("bed")) return "hotel";
  if (key.includes("discharge") || key.includes("transfer") || key.includes("referral") || key.includes("dispatch")) return "sync_alt";
  if (key.includes("lab") || key.includes("specimen") || key.includes("result") || key.includes("blood")) return "biotech";
  if (key.includes("radiology") || key.includes("report") || key.includes("imaging")) return "description";
  if (key.includes("pharmacy") || key.includes("prescription") || key.includes("drug") || key.includes("medication")) return "medication";
  if (key.includes("billing") || key.includes("invoice") || key.includes("receipt") || key.includes("payment") || key.includes("claim") || key.includes("reconciliation")) return "receipt_long";
  if (key.includes("inventory") || key.includes("stock") || key.includes("purchase") || key.includes("supplier")) return "inventory_2";
  if (key.includes("security") || key.includes("risk") || key.includes("incident") || key.includes("audit") || key.includes("consent")) return "security";
  if (key.includes("configuration") || key.includes("setting") || key.includes("maintenance")) return "settings";
  if (key.includes("message") || key.includes("sms") || key.includes("whatsapp") || key.includes("feedback") || key.includes("complaint")) return "message";
  if (key.includes("analytics") || key.includes("kpi") || key.includes("forecast") || key.includes("dashboard") || key.includes("reporting")) return "insights";
  if (key.includes("upload") || key.includes("document") || key.includes("file")) return "upload";
  if (key.includes("user") || key.includes("patient") || key.includes("staff") || key.includes("household")) return "groups";
  return "edit_note";
};

const getSubmitLabel = (formTitle: string) => {
  const key = normalizeText(formTitle);
  if (key.includes("admission")) return "Save Admission";
  if (key.includes("discharge")) return "Save Discharge";
  if (key.includes("transfer")) return "Save Transfer";
  if (key.includes("appointment") || key.includes("booking")) return "Schedule Appointment";
  if (key.includes("slot") || key.includes("configuration")) return "Save Configuration";
  if (key.includes("cancel")) return "Cancel Appointment";
  if (key.includes("triage")) return "Save Triage";
  if (key.includes("consultation")) return "Save Consultation";
  if (key.includes("registration")) return "Register Record";
  if (key.includes("assessment")) return "Save Assessment";
  if (key.includes("visit")) return "Save Visit";
  if (key.includes("order")) return "Place Order";
  if (key.includes("request")) return "Submit Request";
  if (key.includes("result") || key.includes("report")) return "Save Report";
  if (key.includes("incident")) return "Submit Incident";
  if (key.includes("approval") || key.includes("authorisation") || key.includes("authorization")) return "Submit Approval";
  if (key.includes("prescription")) return "Save Prescription";
  if (key.includes("dispense")) return "Confirm Dispensing";
  if (key.includes("payment") || key.includes("receipt")) return "Post Payment";
  if (key.includes("claim")) return "Submit Claim";
  if (key.includes("supplier") || key.includes("vendor")) return "Save Supplier";
  if (key.includes("stock") || key.includes("inventory")) return "Save Stock Record";
  if (key.includes("message") || key.includes("sms") || key.includes("whatsapp")) return "Send Message";
  if (key.includes("feedback") || key.includes("complaint")) return "Submit Feedback";
  if (key.includes("document") || key.includes("upload")) return "Upload Document";
  if (key.includes("consent")) return "Record Consent";
  if (key.includes("referral")) return "Create Referral";
  return `Save ${formTitle.replace(/\s+Form$/i, "")}`;
};

export function ModuleReferenceForms({
  moduleKey,
  moduleTitle,
  onSaved,
  excludeFormNames = [],
}: ModuleReferenceFormsProps) {
  const { facility } = useAppStore();
  const excludedForms = useMemo(
    () => new Set(excludeFormNames.map((name) => normalizeText(name))),
    [excludeFormNames],
  );
  const forms = useMemo(
    () => (MODULE_ACTION_FORMS[moduleKey]?.forms ?? []).filter((form) => !excludedForms.has(normalizeText(form.name))),
    [excludedForms, moduleKey],
  );
  const [activeForm, setActiveForm] = useState<ActiveFormState | null>(null);
  const [values, setValues] = useState<Record<string, string | boolean | string[]>>({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const toastTimer = useRef<number | null>(null);

  if (forms.length === 0) return null;

  const updateValue = (name: string, value: string | boolean | string[]) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const openForm = (form: ModuleActionFormDefinition, index: number) => {
    setValues({});
    setActiveForm({
      title: formatFormTitle(form.name),
      description: form.description,
      fields: form.fields.map((field) => ({ ...field })),
      accentColor: palette[index % palette.length],
    });
  };

  useEffect(() => {
    const handleSidebarAction = (event: Event) => {
      const detail = (event as CustomEvent<{ moduleKey?: string; action?: string }>).detail;
      if (detail?.moduleKey && detail.moduleKey !== moduleKey) return;
      const actionNames: Record<string, string> = {
        setup: "Migration Job Setup",
        mapping: "Field Mapping",
        validation: "Validation Report Review",
        approval: "Migration Approval",
      };
      const target = normalizeText(actionNames[String(detail?.action || "")]);
      const index = forms.findIndex((form) => normalizeText(form.name).includes(target));
      if (index >= 0) openForm(forms[index], index);
    };
    window.addEventListener("hmis:migration-sidebar-action", handleSidebarAction);
    return () => window.removeEventListener("hmis:migration-sidebar-action", handleSidebarAction);
  }, [forms, moduleKey]);

  const renderField = (field: ModuleActionField) => {
    const value = values[field.name];
    const baseClass = "module-form-input";

    if (field.type === "textarea") {
      return (
        <textarea
          className={`${baseClass} min-h-[110px]`}
          placeholder={field.placeholder}
          value={typeof value === "string" ? value : ""}
          onChange={(event) => updateValue(field.name, event.target.value)}
          required={field.required}
          disabled={field.disabled}
        />
      );
    }

    if (field.type === "select") {
      return (
        <select
          className={baseClass}
          value={typeof value === "string" ? value : ""}
          onChange={(event) => updateValue(field.name, event.target.value)}
          required={field.required}
          disabled={field.disabled}
        >
          <option value="">{field.placeholder || "Select an option"}</option>
          {(field.options ?? []).map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      );
    }

    if (field.type === "checkbox" || field.type === "toggle") {
      return (
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(event) => updateValue(field.name, event.target.checked)}
            disabled={field.disabled}
          />
          {field.placeholder || "Yes"}
        </label>
      );
    }

    if (field.type === "file") {
      return (
        <input
          type="file"
          className={baseClass}
          onChange={(event) => updateValue(field.name, event.target.files?.[0]?.name || "")}
          required={field.required}
          disabled={field.disabled}
        />
      );
    }

    if (field.type === "radio") {
      const options = field.options ?? [];
      if (options.length > 0) {
        return (
          <div className="space-y-2">
            {options.map((option) => (
              <label key={option} className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="radio"
                  name={field.name}
                  value={option}
                  checked={value === option}
                  onChange={(event) => updateValue(field.name, event.target.value)}
                  disabled={field.disabled}
                />
                {option}
              </label>
            ))}
          </div>
        );
      }
    }

    const inputType =
      field.type === "datetime"
        ? "datetime-local"
        : field.type === "tel"
          ? "tel"
          : field.type === "radio"
            ? "text"
            : field.type || "text";

    return (
      <input
        type={inputType}
        className={baseClass}
        placeholder={field.placeholder}
        value={typeof value === "string" ? value : ""}
        onChange={(event) => updateValue(field.name, event.target.value)}
        required={field.required}
        disabled={field.disabled}
      />
    );
  };

  const submitForm = async (event: FormEvent) => {
    event.preventDefault();
    if (!activeForm) return;
    setSaving(true);
    try {
      await api.post("/module-actions", {
        facilityId: facility?.id,
        module: moduleKey,
        action: activeForm.title,
        data: values,
        context: { title: moduleTitle },
      });
      setActiveForm(null);
      await onSaved?.();
      setToast("Saved successfully.");
    } catch (error: any) {
      setToast(String(error?.response?.data?.message || "Failed to save. Please try again."));
    } finally {
      setSaving(false);
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
      toastTimer.current = window.setTimeout(() => setToast(""), 2200);
    }
  };

  const requiredCount = activeForm?.fields.filter((field) => field.required).length ?? 0;

  return (
    <>
      <div className="module-actions module-reference-actions">
        {forms.map((form, index) => {
          const color = palette[index % palette.length];
          return (
            <button
              key={form.name}
              type="button"
              onClick={() => openForm(form, index)}
              className="module-reference-action-btn"
              style={{
                backgroundColor: color,
                borderColor: color,
                boxShadow: `0 8px 18px ${color}33`,
              }}
            >
              <ModuleIcon name={pickIcon(form.name)} />
              {formatFormTitle(form.name)}
            </button>
          );
        })}
      </div>

      {activeForm ? (
        <div className="module-form-overlay" role="dialog" aria-modal="true" onClick={() => setActiveForm(null)}>
          <div
            className={`module-form-panel has-rail modal-panel module-form-panel-${moduleKey}`}
            style={{
              "--module-form-accent": activeForm.accentColor || "#16a34a",
              "--module-form-accent-dark": `${activeForm.accentColor || "#16a34a"}cc`,
              "--module-form-accent-soft": `${activeForm.accentColor || "#16a34a"}22`,
            } as any}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Left Rail / Sidebar: Black to button color gradient */}
            <aside
              className="module-form-rail"
              style={{
                background: `linear-gradient(180deg, #070a0f 0%, #0d1522 35%, ${activeForm.accentColor || "#16a34a"}44 70%, ${activeForm.accentColor || "#16a34a"} 100%)`,
              }}
            >
              <div className="module-form-rail-mark">
                <div className="module-form-rail-icon">
                  <ModuleIcon name={pickIcon(activeForm.title)} />
                </div>
                <div>
                  <b>Medilink HMIS</b>
                  <small>{moduleTitle}</small>
                </div>
              </div>

              <div className="module-form-rail-rule" />

              <div className="module-form-rail-steps">
                <div className="module-form-rail-step active">
                  <span className="module-form-rail-step-num">1</span>
                  <div>
                    <b>Form Data</b>
                    <small>{activeForm.fields.length} inputs</small>
                  </div>
                </div>
                {requiredCount > 0 ? (
                  <div className="module-form-rail-step">
                    <span className="module-form-rail-step-num">2</span>
                    <div>
                      <b>Required Checks</b>
                      <small>{requiredCount} mandatory</small>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="module-form-rail-banner">
                <small>Active Action</small>
                <div className="module-form-rail-bname">{activeForm.title}</div>
                <div className="module-form-rail-bmeta">
                  {Object.values(values).filter((v) => v !== "" && v !== undefined && v !== null && v !== false).length} of {activeForm.fields.length} fields filled
                </div>
                <span className="module-form-rail-chip ok">
                  In Progress
                </span>
              </div>
            </aside>

            {/* Right Main Area */}
            <div className="module-form-main">
              <header className="module-form-head">
                <div>
                  <small className="module-form-kicker">{moduleTitle} · Form Terminal</small>
                  <h2 className="module-form-title">{activeForm.title}</h2>
                  {activeForm.description ? (
                    <p className="module-form-desc">{activeForm.description}</p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => setActiveForm(null)}
                  className="module-form-x-btn"
                  aria-label="Close"
                >
                  ✕
                </button>
              </header>

              <form onSubmit={submitForm} className="module-form-content">
                <div className="module-form-body-scroll">
                  <div className="module-form-grid">
                    {activeForm.fields.map((field) => {
                      const wide = field.type === "textarea" || field.type === "file";
                      return (
                        <div key={field.name} className={`module-form-field ${wide ? "is-wide" : ""}`}>
                          <label className="form-label">
                            {field.label}
                            {field.required ? <span className="module-form-required">*</span> : null}
                          </label>
                          {field.helper ? <div className="form-helper">{field.helper}</div> : null}
                          {renderField(field)}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <footer className="module-form-foot">
                  <button
                    type="button"
                    onClick={() => setActiveForm(null)}
                    className="module-form-btn-cancel"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="module-form-btn-submit"
                    style={{ backgroundColor: activeForm.accentColor || "#16a34a" }}
                    disabled={saving}
                  >
                    {saving ? "Saving..." : getSubmitLabel(activeForm.title)}
                  </button>
                </footer>
              </form>
            </div>
          </div>
        </div>
      ) : null}

      {toast ? (
        <div className="module-toast" role="status" aria-live="polite">
          {toast}
        </div>
      ) : null}
    </>
  );
}
