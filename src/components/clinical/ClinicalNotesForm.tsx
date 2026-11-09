"use client";

import { useState } from "react";
import { FileText, Save, Lock } from "lucide-react";
import { api } from "../../lib/api";

interface ClinicalNotesFormProps {
  visitId: string;
  initialData?: any;
  isReadOnly?: boolean;
}

export function ClinicalNotesForm({
  visitId,
  initialData,
  isReadOnly,
}: ClinicalNotesFormProps) {
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState({
    chiefComplaint: initialData?.chiefComplaint || "",
    history: initialData?.history || "",
    examination: initialData?.examination || "",
    assessment: initialData?.assessment || "",
    plan: initialData?.plan || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/medical-records", {
        ...notes,
        visitId,
      });
      alert("Notes saved successfully!");
    } catch (err) {
      console.error("Failed to save clinical notes", err);
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    {
      key: "chiefComplaint",
      label: "Chief Complaint",
      placeholder: "Reason for visit...",
    },
    {
      key: "history",
      label: "History of Presenting Illness",
      placeholder: "Detailed history...",
    },
    {
      key: "examination",
      label: "Physical Examination",
      placeholder: "Findings from exam...",
    },
    {
      key: "assessment",
      label: "Clinical Assessment / Diagnosis",
      placeholder: "ICD-10 or clinical diagnosis...",
    },
    {
      key: "plan",
      label: "Management Plan",
      placeholder: "Medications, tests, follow-up...",
    },
  ];

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 bg-card p-8 rounded-2xl border border-border shadow-sm"
    >
      <div className="form-title-block">
        <div>
          <h3 className="form-title">
            <FileText className="w-6 h-6 text-primary" />
            Clinical Consultation Notes
          </h3>
          <p className="form-title-note">
            Document assessment, diagnosis, and management plan for this visit.
          </p>
        </div>
        {isReadOnly && (
          <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-600 rounded-lg text-sm font-medium">
            <Lock className="w-4 h-4" /> Finalized Record
          </span>
        )}
      </div>

      <div className="space-y-5">
        {fields.map((f) => (
          <div key={f.key} className="space-y-1.5">
            <label className="form-label">
              {f.label}
            </label>
            <textarea
              readOnly={isReadOnly}
              className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all min-h-[100px]"
              value={(notes as any)[f.key]}
              onChange={(e) => setNotes({ ...notes, [f.key]: e.target.value })}
              placeholder={f.placeholder}
            />
          </div>
        ))}
      </div>

      {!isReadOnly && (
        <div className="pt-6 flex justify-end">
          <button
            disabled={loading}
            type="submit"
            className="px-8 py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 transition-all shadow-md flex items-center gap-2 active:scale-95"
          >
            <Save className="w-5 h-5" />
            {loading ? "Saving..." : "Save Clinical Record"}
          </button>
        </div>
      )}
    </form>
  );
}
