"use client";

import { useState } from "react";
import { FlaskConical, Send } from "lucide-react";
import { api } from "../../lib/api";

interface LabRequestFormProps {
  visitId: string;
  patientId: string;
  onSuccess?: () => void;
}

const COMMON_TESTS = [
  "Complete Blood Count (CBC)",
  "Urinalysis",
  "Basic Metabolic Panel (BMP)",
  "Lipid Panel",
  "Liver Function Test (LFT)",
  "Thyroid Panel (TSH)",
  "HbA1c",
  "Malaria Smear",
  "Widal Test",
];

export function LabRequestForm({ visitId, patientId, onSuccess }: LabRequestFormProps) {
  const [loading, setLoading] = useState(false);
  const [testName, setTestName] = useState("");
  const [priority, setPriority] = useState("ROUTINE");
  const [notes, setNotes] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testName) return alert("Please specify a test name.");

    setLoading(true);
    try {
      await api.post("/laboratory/request", {
        visitId,
        patientId,
        testName,
        priority,
        notes
      });
      alert("Lab request generated and routed successfully!");
      setTestName("");
      setPriority("ROUTINE");
      setNotes("");
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error("Failed to submit lab request", err);
      alert("Failed to submit lab request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-card p-6 rounded-2xl border border-border shadow-sm space-y-6">
      <div className="form-title-block mb-4">
        <div>
          <h3 className="form-title">
            <FlaskConical className="w-6 h-6 text-primary" />
            Laboratory Request (CPOE)
          </h3>
          <p className="form-title-note">
            Order diagnostic tests. Requests are immediately routed to the Laboratory queue.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-1.5 md:col-span-2">
          <label className="form-label">Test Name *</label>
          <div className="flex gap-2">
            <input
              type="text"
              list="common-tests"
              className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/50"
              placeholder="e.g. Complete Blood Count (CBC)"
              value={testName}
              onChange={(e) => setTestName(e.target.value)}
              required
            />
            <datalist id="common-tests">
              {COMMON_TESTS.map(t => <option key={t} value={t} />)}
            </datalist>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="form-label">Priority</label>
          <select
            className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/50 font-medium"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            <option value="ROUTINE">ROUTINE</option>
            <option value="URGENT" className="text-amber-600">URGENT</option>
            <option value="STAT" className="text-red-600">STAT (Immediate)</option>
          </select>
        </div>

        <div className="space-y-1.5 md:col-span-2">
          <label className="form-label">Clinical Notes / Indication</label>
          <textarea
            className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/50 min-h-[80px]"
            placeholder="Reason for test, relevant clinical history..."
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
          {loading ? "Routing..." : "Order Lab Test"}
        </button>
      </div>
    </form>
  );
}
