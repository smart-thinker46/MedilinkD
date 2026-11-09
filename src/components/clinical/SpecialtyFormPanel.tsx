"use client";

import { useMemo } from "react";

type SpecialtyField = {
  key: string;
  label?: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  options?: Array<string | { label: string; value: string }>;
};

type SpecialtyTemplate = {
  id: string;
  specialty: string;
  title: string;
  description?: string | null;
  fields: SpecialtyField[];
};

type SpecialtyFormPanelProps = {
  templates: SpecialtyTemplate[];
  selectedTemplateId: string;
  values: Record<string, any>;
  loading?: boolean;
  error?: string;
  disabled?: boolean;
  onSelectTemplate: (templateId: string) => void;
  onChange: (key: string, value: any) => void;
  onSubmit: () => void;
};

const normalizeOptions = (options?: SpecialtyField["options"]) => {
  if (!options) return [];
  return options.map((opt) =>
    typeof opt === "string" ? { label: opt, value: opt } : opt
  );
};

export function SpecialtyFormPanel({
  templates,
  selectedTemplateId,
  values,
  loading,
  error,
  disabled,
  onSelectTemplate,
  onChange,
  onSubmit,
}: SpecialtyFormPanelProps) {
  const selectedTemplate = useMemo(
    () => templates.find((t) => t.id === selectedTemplateId),
    [templates, selectedTemplateId]
  );

  return (
    <div className="glass rounded-2xl border border-border bg-card/30 p-6 space-y-5">
      <div className="form-title-block">
        <div>
          <h3 className="form-title">Specialty Clinical Form</h3>
          <p className="form-title-note">
            Dynamic fields based on the selected specialty template.
          </p>
        </div>
        <div className="min-w-[220px]">
          <label className="form-label">
            Template
          </label>
          <select
            value={selectedTemplateId}
            onChange={(e) => onSelectTemplate(e.target.value)}
            className="w-full mt-2 rounded-xl border border-border bg-background px-3 py-2 text-sm"
          >
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.specialty} — {template.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedTemplate?.description ? (
        <div className="text-xs text-muted-foreground bg-muted/40 border border-border rounded-xl p-3">
          {selectedTemplate.description}
        </div>
      ) : null}

      {loading ? (
        <div className="text-xs text-muted-foreground">Loading template...</div>
      ) : null}

      {error ? (
        <div className="text-xs text-red-600 border border-red-200 bg-red-50 rounded-xl p-3">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(selectedTemplate?.fields || []).map((field) => {
          const fieldKey = field.key;
          const fieldValue = values?.[fieldKey] ?? "";
          const type = field.type || "text";
          const options = normalizeOptions(field.options);

          return (
            <div key={fieldKey} className="space-y-2">
              <label className="form-label">
                {field.label || fieldKey}
                {field.required ? " *" : ""}
              </label>
              {type === "textarea" ? (
                <textarea
                  className="w-full min-h-[120px] rounded-xl border border-border bg-background px-3 py-2 text-sm"
                  placeholder={field.placeholder || ""}
                  value={fieldValue}
                  onChange={(e) => onChange(fieldKey, e.target.value)}
                  disabled={disabled}
                />
              ) : type === "select" ? (
                <select
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                  value={fieldValue}
                  onChange={(e) => onChange(fieldKey, e.target.value)}
                  disabled={disabled}
                >
                  <option value="">Select...</option>
                  {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : type === "checkbox" ? (
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={Boolean(fieldValue)}
                    onChange={(e) => onChange(fieldKey, e.target.checked)}
                    disabled={disabled}
                  />
                  {field.placeholder || "Yes"}
                </label>
              ) : (
                <input
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                  type={type}
                  placeholder={field.placeholder || ""}
                  value={fieldValue}
                  onChange={(e) => onChange(fieldKey, e.target.value)}
                  disabled={disabled}
                />
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-end">
        <button
          onClick={onSubmit}
          disabled={disabled || !selectedTemplate}
          className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold uppercase tracking-widest disabled:opacity-60"
        >
          Save Specialty Note
        </button>
      </div>
    </div>
  );
}
