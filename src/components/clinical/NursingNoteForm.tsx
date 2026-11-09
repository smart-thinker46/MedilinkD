"use client";

import { useState } from "react";
import { ClipboardList, Save } from "lucide-react";
import { api } from "../../lib/api";

interface NursingNoteFormProps {
  visitId: string;
  onSuccess?: () => void;
}

export function NursingNoteForm({ visitId, onSuccess }: NursingNoteFormProps) {
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) return;
    setLoading(true);
    try {
      await api.post("/nursing-notes", {
        visitId,
        note,
      });
      setNote("");
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error("Failed to save nursing note", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="nursing-clinical-card"
    >
      <div className="form-title-block">
        <div>
          <h3 className="form-title">
            <ClipboardList className="w-5 h-5 text-primary" />
            Nursing Observation
          </h3>
          <p className="form-title-note">
            Record patient status updates and nursing interventions.
          </p>
        </div>
      </div>
      <textarea
        required
        className="nursing-note-input"
        placeholder="Enter nursing observations, care provided, or patient status changes..."
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
      <div className="nursing-card-actions">
        <button
          disabled={loading}
          type="submit"
          className="nursing-action-btn"
        >
          <Save className="w-4 h-4" />
          {loading ? "Saving..." : "Save Note"}
        </button>
      </div>
    </form>
  );
}
