"use client";

import { useState, useMemo, useEffect } from "react";
import { Pill, Calculator, AlertTriangle, Send } from "lucide-react";
import { api } from "../../lib/api";

interface PrescriptionFormProps {
  visitId: string;
  patientId: string;
  activeMedications?: string[]; // to check interactions
  allergies?: string;
  onSuccess?: () => void;
}

const FREQUENCY_MULTIPLIER: Record<string, number> = {
  "OD (Once a day)": 1,
  "BID (Twice a day)": 2,
  "TID (Three times a day)": 3,
  "QID (Four times a day)": 4,
  "PRN (As needed)": 1, // hard to calculate exactly, default 1/day
  "STAT (Immediately)": 1, // one-time dose
};

// Mock local DB for Interaction Checking
const DANGEROUS_INTERACTIONS: Array<[string, string]> = [
  ["warfarin", "aspirin"],
  ["sildenafil", "nitroglycerin"],
  ["clopidogrel", "omeprazole"],
  ["lisinopril", "spironolactone"]
];

export function PrescriptionForm({ visitId, patientId, activeMedications = [], allergies = "", onSuccess }: PrescriptionFormProps) {
  const [loading, setLoading] = useState(false);
  const [drugName, setDrugName] = useState("");
  const [route, setRoute] = useState("PO (Oral)");
  const [dosage, setDosage] = useState("1");
  const [frequency, setFrequency] = useState("BID (Twice a day)");
  const [durationDays, setDurationDays] = useState("5");
  const [notes, setNotes] = useState("");

  const [interactionWarning, setInteractionWarning] = useState<string | null>(null);
  const [allergyWarning, setAllergyWarning] = useState<string | null>(null);

  // Feature 4: Dosage & Frequency Calculator
  const calculatedQuantity = useMemo(() => {
    if (frequency === "STAT (Immediately)") return Number(dosage) || 1;
    const mult = FREQUENCY_MULTIPLIER[frequency] || 1;
    const dose = Number(dosage) || 0;
    const days = Number(durationDays) || 0;
    return dose * mult * days;
  }, [dosage, frequency, durationDays]);

  // Feature 2: Medication Interaction Checking
  useEffect(() => {
    if (!drugName) {
      setInteractionWarning(null);
      return;
    }
    
    let warning = null;
    let allergy = null;
    const currentDrug = drugName.toLowerCase();
    const allergyText = allergies.toLowerCase();

    if (allergyText && currentDrug) {
      const drugTokens = currentDrug.split(/[^a-z0-9]+/).filter((token) => token.length >= 4);
      if (drugTokens.some((token) => allergyText.includes(token)) || allergyText.includes(currentDrug)) {
        allergy = `HARD STOP: documented allergy risk for ${drugName}. Change the medicine or document a clinical override outside this quick prescription form.`;
      }
    }
    
    // Check against active meds
    for (const med of activeMedications) {
      const activeMed = med.toLowerCase();
      
      for (const pair of DANGEROUS_INTERACTIONS) {
        if ((pair[0] === currentDrug && pair[1] === activeMed) || 
            (pair[1] === currentDrug && pair[0] === activeMed)) {
          warning = `SEVERE INTERACTION: ${pair[0].toUpperCase()} and ${pair[1].toUpperCase()} can cause dangerous adverse effects. Please reconsider this prescription.`;
          break;
        }
      }
      if (warning) break;
    }
    
    setInteractionWarning(warning);
    setAllergyWarning(allergy);
  }, [drugName, activeMedications, allergies]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!drugName) return alert("Please enter a drug name.");

    setLoading(true);
    try {
      await api.post("/pharmacy/prescription", {
        visitId,
        patientId,
        items: [
          {
            drugName,
            dosage,
            frequency,
            route,
            durationDays: Number(durationDays),
            quantity: calculatedQuantity,
            notes
          }
        ]
      });
      alert("Prescription generated and routed to Pharmacy successfully!");
      setDrugName("");
      setDosage("1");
      setDurationDays("5");
      setNotes("");
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error("Failed to submit prescription", err);
      alert("Failed to submit prescription.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-card p-6 rounded-2xl border border-border shadow-sm space-y-6">
      <div className="form-title-block mb-4">
        <div>
          <h3 className="form-title">
            <Pill className="w-6 h-6 text-primary" />
            Computerized Provider Order Entry (CPOE)
          </h3>
          <p className="form-title-note">
            Prescribe medications digitally. Orders are routed to the Pharmacy automatically.
          </p>
        </div>
      </div>

      {(allergyWarning || interactionWarning) && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-900 flex gap-3 animate-in fade-in">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <div>
            <h4 className="font-bold text-sm">{allergyWarning ? "Drug-Allergy Hard Stop" : "Interaction Alert"}</h4>
            <p className="text-sm mt-1">{allergyWarning || interactionWarning}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-1.5 md:col-span-2">
          <label className="form-label">Drug Name *</label>
          <input
            type="text"
            className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/50"
            placeholder="e.g. Amoxicillin 500mg"
            value={drugName}
            onChange={(e) => setDrugName(e.target.value)}
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className="form-label">Dosage (per intake)</label>
          <input
            type="number"
            min="1"
            className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/50"
            value={dosage}
            onChange={(e) => setDosage(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <label className="form-label">Route</label>
          <select
            className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/50"
            value={route}
            onChange={(e) => setRoute(e.target.value)}
          >
            <option>PO (Oral)</option>
            <option>IV (Intravenous)</option>
            <option>IM (Intramuscular)</option>
            <option>SC (Subcutaneous)</option>
            <option>Topical</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="form-label">Frequency</label>
          <select
            className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/50"
            value={frequency}
            onChange={(e) => setFrequency(e.target.value)}
          >
            <option>OD (Once a day)</option>
            <option>BID (Twice a day)</option>
            <option>TID (Three times a day)</option>
            <option>QID (Four times a day)</option>
            <option>PRN (As needed)</option>
            <option>STAT (Immediately)</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="form-label">Duration (Days)</label>
          <input
            type="number"
            min="1"
            className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/50"
            value={durationDays}
            onChange={(e) => setDurationDays(e.target.value)}
            disabled={frequency === "STAT (Immediately)"}
          />
        </div>
      </div>

      <div className="p-4 bg-primary/5 border border-primary/10 rounded-xl flex items-center justify-between">
        <div className="flex items-center gap-2 text-primary font-medium">
          <Calculator className="w-5 h-5" />
          Auto-Calculated Quantity:
        </div>
        <div className="text-xl font-bold text-primary">
          {calculatedQuantity} {Number(calculatedQuantity) === 1 ? 'unit' : 'units'}
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="form-label">Pharmacy / Nursing Notes</label>
        <textarea
          className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/50 min-h-[80px]"
          placeholder="Special instructions..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      <div className="pt-4 flex justify-end">
        <button
          disabled={loading || !!interactionWarning || !!allergyWarning}
          type="submit"
          className="px-8 py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
        >
          <Send className="w-5 h-5" />
          {loading ? "Routing..." : "Sign & Route to Pharmacy"}
        </button>
      </div>
    </form>
  );
}
