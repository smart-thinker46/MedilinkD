"use client";

import { useState } from "react";
import { BedDouble, Send } from "lucide-react";
import { api } from "../../lib/api";

interface AdmissionFormProps {
  visitId: string;
  patientId: string;
  onSuccess?: () => void;
}

export function AdmissionForm({ visitId, patientId, onSuccess }: AdmissionFormProps) {
  const [loading, setLoading] = useState(false);
  const [admissionType, setAdmissionType] = useState("ELECTIVE");
  const [initialDiagnosis, setInitialDiagnosis] = useState("");
  const [admissionReason, setAdmissionReason] = useState("");
  const [expectedLengthOfStayDays, setExpectedLengthOfStayDays] = useState("3");
  const [notes, setNotes] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!initialDiagnosis || !admissionReason) return alert("Please fill out all required clinical fields.");

    setLoading(true);
    try {
      await api.post("/ipd/admit", {
        visitId,
        patientId,
        admissionType,
        initialDiagnosis,
        admissionReason,
        expectedLengthOfStayDays: Number(expectedLengthOfStayDays),
        notes
      });
      alert("Patient successfully admitted and routed to IPD Ward queue!");
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error("Failed to admit patient", err);
      alert(`Admission Failed: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-card p-6 rounded-2xl border border-border shadow-sm space-y-6">
      <div className="form-title-block mb-4">
        <div>
          <h3 className="form-title">
            <BedDouble className="w-6 h-6 text-primary" />
            Inpatient Admission Request
          </h3>
          <p className="form-title-note">
            Request an IPD admission. This will alert the Nursing Station to allocate a bed.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-1.5 md:col-span-2">
          <label className="form-label">Admitting Diagnosis *</label>
          <input
            type="text"
            className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/50"
            placeholder="e.g. Acute Appendicitis"
            value={initialDiagnosis}
            onChange={(e) => setInitialDiagnosis(e.target.value)}
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className="form-label">Admission Type</label>
          <select
            className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/50"
            value={admissionType}
            onChange={(e) => setAdmissionType(e.target.value)}
          >
            <option value="ELECTIVE">Elective</option>
            <option value="EMERGENCY">Emergency</option>
            <option value="MATERNITY">Maternity</option>
            <option value="TRANSFER">Transfer</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="form-label">Expected Length of Stay (Days)</label>
          <input
            type="number"
            min="1"
            className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/50"
            value={expectedLengthOfStayDays}
            onChange={(e) => setExpectedLengthOfStayDays(e.target.value)}
          />
        </div>

        <div className="space-y-1.5 md:col-span-2">
          <label className="form-label">Reason for Admission / Instructions *</label>
          <textarea
            required
            className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/50 min-h-[80px]"
            placeholder="Detailed clinical reason, required continuous monitoring, surgery prep..."
            value={admissionReason}
            onChange={(e) => setAdmissionReason(e.target.value)}
          />
        </div>
        
        <div className="space-y-1.5 md:col-span-2">
          <label className="form-label">Nursing Notes</label>
          <textarea
            className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/50 min-h-[60px]"
            placeholder="Any specific requests for the ward nurses..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </div>

      <div className="pt-4 flex justify-end">
        <button
          disabled={loading}
          type="submit"
          className="px-8 py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
        >
          <Send className="w-5 h-5" />
          {loading ? "Processing..." : "Request Admission"}
        </button>
      </div>
    </form>
  );
}
