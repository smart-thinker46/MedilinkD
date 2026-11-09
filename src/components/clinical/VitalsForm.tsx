"use client";

import { useState } from "react";
import { Activity, Thermometer, Weight, Zap, AlertTriangle, User, Wind } from "lucide-react";
import { api } from "../../lib/api";

interface VitalsFormProps {
  visitId: string;
  patientId: string;
  onSuccess?: () => void;
}

export function VitalsForm({ visitId, patientId, onSuccess }: VitalsFormProps) {
  const [loading, setLoading] = useState(false);
  const [vitals, setVitals] = useState({
    temperature: "",
    bloodPressure: "",
    heartRate: "",
    respiratoryRate: "",
    oxygenSaturation: "",
    weight: "",
    height: "",
  });
  
  const [triageResult, setTriageResult] = useState<{ ewsScore: number; triageCategory: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTriageResult(null);
    try {
      let sys = 0, dia = 0;
      if (vitals.bloodPressure.includes('/')) {
        const parts = vitals.bloodPressure.split('/');
        sys = parseInt(parts[0]);
        dia = parseInt(parts[1]);
      } else {
        sys = parseInt(vitals.bloodPressure);
      }

      const res = await api.post("/vitals", {
        temperature: parseFloat(vitals.temperature),
        bpSystolic: sys,
        bpDiastolic: dia,
        bloodPressure: vitals.bloodPressure,
        heartRate: parseInt(vitals.heartRate),
        respiratoryRate: parseInt(vitals.respiratoryRate),
        oxygenSaturation: parseInt(vitals.oxygenSaturation),
        weight: parseFloat(vitals.weight),
        height: parseFloat(vitals.height),
        visitId,
        patientId,
      });

      setTriageResult({
        ewsScore: res.data.ewsScore,
        triageCategory: res.data.triageCategory,
      });

      if (onSuccess) onSuccess();
    } catch (err) {
      console.error("Failed to save vitals", err);
    } finally {
      setLoading(false);
    }
  };

  const getTriageColor = (category: string) => {
    switch (category) {
      case 'RED': return 'bg-red-100 text-red-800 border-red-300';
      case 'YELLOW': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'GREEN': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 bg-card p-6 rounded-2xl border border-border shadow-sm"
    >
      <div className="form-title-block">
        <div>
          <h3 className="form-title">
            <Activity className="w-5 h-5 text-primary" />
            Clinical Triage & Vitals
          </h3>
          <p className="form-title-note">
            Standard vitals capture with automatic Early Warning Scoring (EWS).
          </p>
        </div>
      </div>

      {triageResult && (
        <div className={`p-4 rounded-lg border flex items-center gap-3 ${getTriageColor(triageResult.triageCategory)}`}>
          <AlertTriangle className="w-5 h-5" />
          <div>
            <strong className="block text-sm">Early Warning Score: {triageResult.ewsScore}</strong>
            <span className="text-xs">Triage Category: {triageResult.triageCategory}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="form-label flex items-center gap-1.5">
            <Thermometer className="w-3.5 h-3.5" /> Temp (°C)
          </label>
          <input
            type="number"
            step="0.1"
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
            value={vitals.temperature}
            onChange={(e) => setVitals({ ...vitals, temperature: e.target.value })}
            placeholder="36.5"
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className="form-label flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5" /> BP (mmHg)
          </label>
          <input
            type="text"
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
            value={vitals.bloodPressure}
            onChange={(e) => setVitals({ ...vitals, bloodPressure: e.target.value })}
            placeholder="120/80"
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className="form-label flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5" /> Heart Rate (bpm)
          </label>
          <input
            type="number"
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
            value={vitals.heartRate}
            onChange={(e) => setVitals({ ...vitals, heartRate: e.target.value })}
            placeholder="72"
            required
          />
        </div>
        
        <div className="space-y-1.5">
          <label className="form-label flex items-center gap-1.5">
            <Wind className="w-3.5 h-3.5" /> Respiratory Rate (bpm)
          </label>
          <input
            type="number"
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
            value={vitals.respiratoryRate}
            onChange={(e) => setVitals({ ...vitals, respiratoryRate: e.target.value })}
            placeholder="16"
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className="form-label flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5" /> SpO2 (%)
          </label>
          <input
            type="number"
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
            value={vitals.oxygenSaturation}
            onChange={(e) => setVitals({ ...vitals, oxygenSaturation: e.target.value })}
            placeholder="98"
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className="form-label flex items-center gap-1.5">
            <Weight className="w-3.5 h-3.5" /> Weight (kg) / Height (cm)
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              step="0.1"
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
              value={vitals.weight}
              onChange={(e) => setVitals({ ...vitals, weight: e.target.value })}
              placeholder="Kg"
            />
            <input
              type="number"
              step="0.1"
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
              value={vitals.height}
              onChange={(e) => setVitals({ ...vitals, height: e.target.value })}
              placeholder="Cm"
            />
          </div>
        </div>
      </div>

      <div className="border border-border rounded-xl p-4 bg-slate-50">
        <h4 className="text-sm font-semibold flex items-center gap-2 mb-2">
          <User className="w-4 h-4" /> Visual Body Mass Mapping
        </h4>
        <p className="text-xs text-muted-foreground mb-4">Click areas to log trauma or localized pain.</p>
        <div className="flex justify-center items-center h-48 bg-white border border-dashed rounded-lg text-slate-400 text-sm hover:bg-slate-100 cursor-pointer transition">
          [ Interactive Graphical Body Map Mockup ]
        </div>
      </div>

      <button
        disabled={loading}
        type="submit"
        className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-70 mt-4"
      >
        {loading ? "Computing EWS..." : "Compute Triage & Save Vitals"}
      </button>
    </form>
  );
}
