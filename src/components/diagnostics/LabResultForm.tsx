import { useState } from "react";
import { Beaker, Save, AlertCircle, CheckCircle } from "lucide-react";
import { api } from "../../lib/api";

interface LabResultFormProps {
  requestId: string;
  testName: string;
  onSuccess?: () => void;
}

export function LabResultForm({
  requestId,
  testName,
  onSuccess,
}: LabResultFormProps) {
  const [loading, setLoading] = useState(false);
  const [resultData, setResultData] = useState("");
  const [publishToPortal, setPublishToPortal] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resultData.trim()) return;
    setLoading(true);
    try {
      // Feature 3: Results Entry
      const res = await api.post("/laboratory/result", {
        requestId,
        resultData,
      });

      // Feature 4: Patient Portal Integration (Verification & Publishing)
      if (publishToPortal && res.data?.resultId) {
         await api.post("/laboratory/result/verify", {
           requestId,
           resultId: res.data.resultId,
           verificationNotes: "Verified and published to Patient Portal",
           releaseNow: true
         });
      }

      setResultData("");
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error("Failed to save lab result", err);
      alert("Failed to save result.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 bg-card p-6 rounded-2xl border border-border shadow-sm"
    >
      <div className="form-title-block">
        <div>
          <h3 className="form-title">
            <Beaker className="w-5 h-5 text-primary" />
            Result for: {testName}
          </h3>
          <p className="form-title-note">
            Document findings carefully and include critical values if present.
          </p>
        </div>
      </div>

      <div className="form-info-banner bg-primary/5 border border-primary/10 mb-4 flex gap-3">
        <AlertCircle className="w-5 h-5 text-primary shrink-0" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          Ensure all reference ranges and critical values are clearly
          documented. Finalizing this result will notify the requesting
          clinician.
        </p>
      </div>

      <textarea
        required
        className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[150px]"
        placeholder="Enter lab findings, values, and interpretations..."
        value={resultData}
        onChange={(e) => setResultData(e.target.value)}
      />

      <div className="flex items-center gap-2 p-4 bg-slate-50 border border-slate-200 rounded-xl">
         <input 
            type="checkbox" 
            id="publish" 
            checked={publishToPortal}
            onChange={(e) => setPublishToPortal(e.target.checked)}
            className="w-4 h-4 text-primary"
         />
         <label htmlFor="publish" className="text-sm font-bold text-slate-700 cursor-pointer select-none">
           Verify & Publish to Patient Portal
         </label>
      </div>

      <div className="flex justify-end pt-2">
        <button
          disabled={loading}
          type="submit"
          className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-bold hover:bg-primary/90 transition-all flex items-center gap-2"
        >
          {loading ? "Processing..." : publishToPortal ? <><CheckCircle className="w-4 h-4" /> Verify & Submit</> : <><Save className="w-4 h-4" /> Submit Result</>}
        </button>
      </div>
    </form>
  );
}

