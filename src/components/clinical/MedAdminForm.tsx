"use client";

import { useState, useEffect } from "react";
import { Pill, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { api } from "../../lib/api";

interface MedAdminFormProps {
  visitId: string;
  onSuccess?: () => void;
}

export function MedAdminForm({ visitId, onSuccess }: MedAdminFormProps) {
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [administered, setAdministered] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pRes, aRes] = await Promise.all([
        api.get(`/prescriptions/visit/${visitId}`).catch(() => ({ data: [] })),
        api
          .get(`/medication-administration/visit/${visitId}`)
          .catch(() => ({ data: [] })),
      ]);
      setPrescriptions(pRes.data);
      setAdministered(aRes.data);
    } catch (err) {
      console.error("Failed to fetch medication data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [visitId]);

  const handleAdminister = async (pId: string) => {
    setActionLoading(pId);
    try {
      await api.post("/medication-administration", {
        visitId,
        prescriptionId: pId,
        notes: "Dose administered as per schedule",
      });
      await fetchData();
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error("Failed to administer medication", err);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="nursing-clinical-card">
      <div className="form-title-block">
        <div>
          <h3 className="form-title">
            <Pill className="w-5 h-5 text-primary" />
            Medication Administration (MAR)
          </h3>
          <p className="form-title-note">
            Track dose administration and medication compliance.
          </p>
        </div>
      </div>

      <div className="nursing-mar-list">
        {loading ? (
          <p className="nursing-muted">
            Loading MAR...
          </p>
        ) : prescriptions.length === 0 ? (
          <div className="nursing-empty-card">
            <AlertCircle className="nursing-empty-icon" />
            <p>
              No prescriptions found for this visit.
            </p>
          </div>
        ) : (
          prescriptions.map((p) => {
            const lastAdmin = administered.find(
              (a) => a.prescriptionId === p.id,
            );
            return (
              <div
                key={p.id}
                className="nursing-mar-item"
              >
                <div className="nursing-mar-main">
                  <div
                    className={`nursing-mar-icon ${lastAdmin ? "is-given" : ""}`}
                  >
                    <Pill className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="nursing-mar-drug">
                      {p.drugName}
                    </p>
                    <p className="nursing-mar-dose">
                      {p.dosage} — {p.frequency}
                    </p>
                  </div>
                </div>

                <div className="nursing-mar-actions">
                  {lastAdmin && (
                    <div className="nursing-last-dose">
                      <p>
                        Last Dose Given
                      </p>
                      <span>
                        <Clock className="w-3 h-3" />
                        {new Date(lastAdmin.administeredAt).toLocaleTimeString(
                          [],
                          { hour: "2-digit", minute: "2-digit" },
                        )}
                      </span>
                    </div>
                  )}
                  <button
                    disabled={actionLoading === p.id}
                    onClick={() => handleAdminister(p.id)}
                    className={`nursing-dose-btn ${lastAdmin ? "is-repeat" : ""}`}
                  >
                    {actionLoading === p.id ? (
                      "Saving..."
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {lastAdmin ? "Give Dose" : "Administer"}
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
