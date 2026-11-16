import React, { useState } from "react";
import { PatientRegistrationForm } from "../components/patients/PatientRegistrationForm";
import { UserPlus, Users, ArrowLeft } from "lucide-react";
import { navigateToPath } from "../lib/navigation";
import { useAppStore } from "../store/appStore";

export function PatientRegistrationView() {
  const [formOpen, setFormOpen] = useState(true);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const { patients } = useAppStore();

  return (
    <div className="module-view-root p-6">
      <div className="pv-header flex justify-between items-center mb-6">
        <div>
          <h1 className="pv-title text-2xl font-bold flex items-center gap-2">
            <UserPlus className="text-teal-600 w-6 h-6" /> Patient Registration
          </h1>
          <p className="pv-subtitle text-sm text-slate-500">
            Enterprise Master Patient Index (MPI) registry & patient intake
          </p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            className="topbar-back-btn px-4 py-2 border rounded-lg text-sm flex items-center gap-2"
            onClick={() => navigateToPath("/patients")}
          >
            <Users className="w-4 h-4" /> View Patient List ({patients.length})
          </button>
          {!formOpen && (
            <button
              type="button"
              className="pf-btn pf-btn-submit px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-semibold flex items-center gap-2"
              onClick={() => {
                setSuccessNotice(null);
                setFormOpen(true);
              }}
            >
              <UserPlus className="w-4 h-4" /> Open Registration Form
            </button>
          )}
        </div>
      </div>

      {successNotice && (
        <div className="p-4 bg-teal-50 border border-teal-200 text-teal-800 rounded-lg mb-6 flex justify-between items-center">
          <span>{successNotice}</span>
          <button
            type="button"
            className="text-teal-600 hover:text-teal-900 font-semibold text-xs"
            onClick={() => setSuccessNotice(null)}
          >
            Dismiss
          </button>
        </div>
      )}

      {formOpen ? (
        <PatientRegistrationForm
          open={formOpen}
          onClose={() => setFormOpen(false)}
          onSaved={(patient) => {
            setFormOpen(false);
            setSuccessNotice(
              patient?.name
                ? `Patient "${patient.name}" registered successfully.`
                : "Patient registered successfully."
            );
          }}
        />
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center">
          <UserPlus className="w-12 h-12 text-teal-600 mx-auto mb-4 opacity-80" />
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2">
            Ready to Register a Patient
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6">
            Register new patients with demographics, contact, emergency contacts, clinical flags, and insurance coverage.
          </p>
          <button
            type="button"
            className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg shadow-sm text-sm"
            onClick={() => setFormOpen(true)}
          >
            Open Registration Wizard
          </button>
        </div>
      )}
    </div>
  );
}

export default PatientRegistrationView;
