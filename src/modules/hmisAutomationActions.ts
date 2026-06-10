export type HmisAutomationAction = {
  label: string;
  endpoint: string;
  method?: "POST" | "PATCH" | "PUT";
  payload?: Record<string, unknown>;
};

const nowIso = () => new Date().toISOString();

const ACTIONS: Array<HmisAutomationAction & { modules: string[] }> = [
  { modules: ["patients"], label: "Duplicate Match", endpoint: "/hmis-automation/patients/duplicate-match", payload: {} },
  { modules: ["patients", "insurance"], label: "Eligibility Check", endpoint: "/hmis-automation/patients/insurance-eligibility", payload: {} },
  { modules: ["queue", "opd"], label: "Refresh Display Board", endpoint: "/hmis-automation/queue/display-board-refresh", payload: {} },
  { modules: ["queue", "opd"], label: "Voice Call Token", endpoint: "/hmis-automation/queue/voice-announcement", payload: { tokenNumber: "NEXT", room: "Service point" } },
  { modules: ["ehr", "opd", "cdss"], label: "ICD-10 Search", endpoint: "/hmis-automation/clinical/ehr/icd10-search", payload: { q: "pneumonia" } },
  { modules: ["nursing"], label: "Missed Dose Scan", endpoint: "/hmis-automation/clinical/nursing/mar-missed-dose-scan", payload: {} },
  { modules: ["nursing-admin"], label: "Validate Roster", endpoint: "/hmis-automation/clinical/nursing-admin/roster-validate", payload: { shiftDate: nowIso(), startTime: nowIso(), endTime: nowIso(), maxWeeklyHours: 48 } },
  { modules: ["lab"], label: "HL7 ORU Ingest", endpoint: "/hmis-automation/diagnostics/lab/hl7-oru-ingest", payload: { message: "MSH|^~\\&|ANALYSER|LAB|MEDILINK|HMIS|202606021200||ORU^R01|1|P|2.3\rOBX|1|NM|HB^Haemoglobin||12.8|g/dL||N" } },
  { modules: ["lab"], label: "Westgard QC", endpoint: "/hmis-automation/diagnostics/lab/westgard-qc", payload: { value: 10, mean: 10, standardDeviation: 1 } },
  { modules: ["lab"], label: "Reject Specimen", endpoint: "/hmis-automation/diagnostics/lab/specimen-reject", payload: { reason: "Haemolysed" } },
  { modules: ["radiology"], label: "Record DICOM Dose", endpoint: "/hmis-automation/diagnostics/radiology/dicom-dose-record", payload: { modality: "CT", doseMgyCm: 0, threshold: 1000 } },
  { modules: ["pharmacy", "cdss"], label: "Verify Prescription", endpoint: "/hmis-automation/pharmacy/verify-prescription", payload: {} },
  { modules: ["pharmacy"], label: "Dispense Stock", endpoint: "/hmis-automation/pharmacy/dispense-stock", payload: { quantity: 1 } },
  { modules: ["pharmacy"], label: "Return Stock", endpoint: "/hmis-automation/pharmacy/return-stock", payload: { quantity: 1, resaleable: true } },
  { modules: ["billing", "ipd"], label: "Daily Bed Charges", endpoint: "/hmis-automation/finance/billing/daily-bed-charges", payload: {} },
  { modules: ["pharmacy-pos"], label: "Cash Reconcile", endpoint: "/hmis-automation/finance/pharmacy-pos/cash-reconcile", payload: { expectedCash: 0, actualCash: 0 } },
  { modules: ["emergency", "ambulance"], label: "Pre-Arrival Notify", endpoint: "/hmis-automation/support/emergency/pre-arrival-notify", payload: {} },
  { modules: ["wards"], label: "Cleaning Workflow", endpoint: "/hmis-automation/support/wards/cleaning-workflow", payload: {} },
  { modules: ["blood-bank"], label: "Unit Chain Audit", endpoint: "/hmis-automation/support/blood-bank/unit-chain-audit", payload: {} },
  { modules: ["ot"], label: "WHO Checklist", endpoint: "/hmis-automation/support/ot/who-checklist", payload: {} },
  { modules: ["icu"], label: "APACHE/SOFA", endpoint: "/hmis-automation/support/icu/severity-score", payload: {} },
  { modules: ["maternity"], label: "Partograph Check", endpoint: "/hmis-automation/support/maternity/partograph-check", payload: {} },
  { modules: ["reporting", "reports"], label: "MOH Report Run", endpoint: "/hmis-automation/support/reporting/moh-report-run", payload: {} },
  { modules: ["executive", "ai-analytics"], label: "KPI/AI Refresh", endpoint: "/hmis-automation/support/executive/kpi-ai-refresh", payload: {} },
  { modules: ["helpdesk"], label: "SLA Sweep", endpoint: "/hmis-automation/support/helpdesk/sla-sweep", payload: {} },
  { modules: ["canteen"], label: "Diet Sync", endpoint: "/hmis-automation/support/canteen/diet-sync", payload: {} },
  { modules: ["patient-feedback", "feedback"], label: "Survey Sweep", endpoint: "/hmis-automation/support/patient-feedback/survey-sweep", payload: {} },
  { modules: ["migration"], label: "Dry Run", endpoint: "/hmis-automation/support/migration/dry-run", payload: {} },
];

export const getHmisAutomationActions = (moduleKey?: string): HmisAutomationAction[] => {
  const key = String(moduleKey || "").trim().toLowerCase();
  if (!key) return [];
  return ACTIONS.filter((action) => action.modules.includes(key)).map(({ modules: _modules, ...action }) => ({
    method: "POST",
    ...action,
  }));
};
