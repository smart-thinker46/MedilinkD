import { useState } from "react";
import { FileText, Save, Info } from "lucide-react";
import { api } from "../../lib/api";

interface RadiologyReportFormProps {
  requestId: string;
  procedureName: string;
  onSuccess?: () => void;
}

export function RadiologyReportForm({
  requestId,
  procedureName,
  onSuccess,
}: RadiologyReportFormProps) {
  const [loading, setLoading] = useState(false);
  const [findings, setFindings] = useState("");
  const [conclusion, setConclusion] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!findings.trim()) return;
    setLoading(true);
    try {
      await api.post("/radiology/report", {
        requestId,
        findings,
        conclusion,
      });
      setFindings("");
      setConclusion("");
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error("Failed to save radiology report", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 bg-card p-8 rounded-3xl border border-border shadow-sm"
    >
      <div className="form-title-block">
        <div>
          <h3 className="form-title">
            <FileText className="w-6 h-6 text-primary" />
            Reporting: {procedureName}
          </h3>
          <p className="form-title-note">
            Provide findings and impressions for the requesting clinician.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="form-label">
            Clinical Findings
          </label>
          <textarea
            required
            className="w-full px-5 py-4 bg-background border border-border rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[200px] font-medium leading-relaxed"
            placeholder="Document detailed observations, measurements, and radiographic findings..."
            value={findings}
            onChange={(e) => setFindings(e.target.value)}
          />
        </div>

        <div>
          <label className="form-label">
            Impression / Conclusion
          </label>
          <textarea
            className="w-full px-5 py-4 bg-background border border-border rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[100px] font-bold leading-relaxed"
            placeholder="Summarize the primary diagnosis or clinical impression..."
            value={conclusion}
            onChange={(e) => setConclusion(e.target.value)}
          />
        </div>
      </div>

      <div className="form-info-banner bg-muted/30 flex items-start gap-3 border border-border">
        <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
        <p className="text-[10px] text-muted-foreground leading-normal font-medium">
          By submitting this report, you verify that the findings are accurate
          and complete according to facility standards. Electronic signature
          will be appended automatically.
        </p>
      </div>

      <div className="flex justify-end pt-2">
        <button
          disabled={loading}
          type="submit"
          className="px-8 py-3 bg-primary text-primary-foreground rounded-xl font-black uppercase tracking-widest text-xs hover:bg-primary/90 transition-all flex items-center gap-2 shadow-lg shadow-primary/20"
        >
          <Save className="w-4 h-4" />
          {loading ? "Saving Report..." : "Finalize Report"}
        </button>
      </div>
    </form>
  );
}

