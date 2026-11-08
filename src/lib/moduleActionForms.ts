import { FORMS_DIRECTORY } from "./formsDirectory";

export type ModuleActionFieldType =
  | "text"
  | "number"
  | "date"
  | "datetime"
  | "time"
  | "email"
  | "tel"
  | "password"
  | "url"
  | "search"
  | "textarea"
  | "select"
  | "radio"
  | "checkbox"
  | "toggle"
  | "file";

export type ModuleActionField = {
  name: string;
  label: string;
  type?: ModuleActionFieldType;
  placeholder?: string;
  helper?: string;
  required?: boolean;
  options?: string[];
  multiple?: boolean;
  disabled?: boolean;
};

export type ModuleActionFormDefinition = {
  name: string;
  description?: string;
  fields: ModuleActionField[];
};

export type ModuleActionFormConfig = {
  forms: ModuleActionFormDefinition[];
};

const LEGACY_ACTION_FORMS: Record<string, ModuleActionFormConfig> = {
  "ai-central": {
    forms: [
      {
        name: "Configure Assistant",
        fields: [
          { name: "assistant_name", label: "Assistant Name", required: true },
          { name: "module", label: "Module" },
          { name: "priority", label: "Priority" },
          { name: "notes", label: "Notes", type: "textarea" },
        ],
      },
    ],
  },
  analytics: {
    forms: [
      {
        name: "Create Analytics Report",
        fields: [
          { name: "report_name", label: "Report Name", required: true },
          { name: "period_start", label: "Period Start", type: "date" },
          { name: "period_end", label: "Period End", type: "date" },
          { name: "format", label: "Format" },
        ],
      },
    ],
  },
  "blood-bank": {
    forms: [
      {
        name: "Monitor Patient",
        description: "Open a blood bank patient monitoring workspace.",
        fields: [
          { name: "patient_id", label: "Patient ID / MRN", required: true, placeholder: "Patient ID or MRN" },
          { name: "notes", label: "Monitoring notes", type: "textarea" },
        ],
      },
      {
        name: "Queue Patient",
        description: "Queue a registered patient for blood bank service.",
        fields: [
          { name: "patient_id", label: "Patient ID", required: true, placeholder: "Registered patient ID" },
          { name: "priority", label: "Priority", type: "select", options: ["NORMAL", "URGENT", "STAT"], required: true },
          { name: "reason", label: "Reason", type: "textarea" },
        ],
      },
      {
        name: "Donor Registration",
        description: "Register a blood donor and capture donation eligibility details.",
        fields: [
          { name: "donor_id", label: "Donor ID / National ID", required: true },
          { name: "blood_group", label: "Blood Group", required: true },
          { name: "contact", label: "Contact" },
        ],
      },
      {
        name: "Record Donation",
        description: "Record a completed blood donation against a registered donor.",
        fields: [
          { name: "donor_id", label: "Donor ID", required: true },
          { name: "blood_group", label: "Blood Group", required: true },
          { name: "units", label: "Units Collected", type: "number", required: true },
          { name: "donated_at", label: "Donation Date", type: "date", required: true },
        ],
      },
      {
        name: "Blood Request",
        description: "Create a blood or component request for a patient.",
        fields: [
          { name: "patient_id", label: "Patient ID / MRN", required: true },
          { name: "blood_group", label: "Blood Group", required: true },
          { name: "component", label: "Component", required: true },
          { name: "units", label: "Units Required", type: "number", required: true },
        ],
      },
    ],
  },
  apps: {
    forms: [
      {
        name: "Register Application",
        fields: [
          { name: "app_name", label: "App Name", required: true },
          { name: "owner", label: "Owner", required: true },
          { name: "status", label: "Status" },
          { name: "notes", label: "Notes", type: "textarea" },
        ],
      },
    ],
  },
  diagnostics: {
    forms: [
      {
        name: "Run Diagnostic",
        fields: [
          { name: "diagnostic_name", label: "Diagnostic Name", required: true },
          { name: "scope", label: "Scope" },
          { name: "notes", label: "Notes", type: "textarea" },
        ],
      },
    ],
  },
  procurement: {
    forms: [
      {
        name: "Create Purchase Request",
        fields: [
          { name: "item_name", label: "Item Name", required: true },
          { name: "supplier", label: "Supplier" },
          { name: "quantity", label: "Quantity", type: "number" },
          { name: "expected_date", label: "Expected Date", type: "date" },
          { name: "status", label: "Status" },
        ],
      },
    ],
  },
  settings: {
    forms: [
      {
        name: "Update Setting",
        fields: [
          { name: "setting_key", label: "Setting Key", required: true },
          { name: "setting_value", label: "Setting Value", required: true },
          { name: "notes", label: "Notes", type: "textarea" },
        ],
      },
    ],
  },
  users: {
    forms: [
      {
        name: "Create User",
        fields: [
          { name: "user_name", label: "User Name", required: true },
          { name: "email", label: "Email", type: "email", required: true },
          { name: "role", label: "Role", required: true },
          { name: "status", label: "Status" },
        ],
      },
    ],
  },
  "medical-director": {
    forms: [
      {
        name: "Doctor Profile Governance Form",
        fields: [
          { name: "staff_id", label: "Staff ID", required: true },
          { name: "specialization", label: "Specialization" },
          { name: "license_number", label: "License Number" },
          { name: "license_valid_until", label: "License Valid Until", type: "date" },
          { name: "credential_verified", label: "Credential Verified", type: "checkbox" },
          { name: "privilege_scope", label: "Privilege Scope" },
          { name: "status", label: "Status", type: "select", options: ["ACTIVE", "SUSPENDED", "INACTIVE"] },
        ],
      },
      {
        name: "Doctor Privilege Assignment Form",
        fields: [
          { name: "staff_id", label: "Staff ID" },
          { name: "privilege_code", label: "Privilege Code", required: true },
          { name: "privilege_name", label: "Privilege Name", required: true },
          { name: "scope", label: "Scope" },
          { name: "can_operate", label: "Can Operate", type: "checkbox" },
          { name: "can_prescribe_restricted", label: "Can Prescribe Restricted Drugs", type: "checkbox" },
          { name: "valid_until", label: "Valid Until", type: "date" },
          { name: "status", label: "Status", type: "select", options: ["ACTIVE", "SUSPENDED", "EXPIRED"] },
        ],
      },
      {
        name: "Clinical Protocol Form",
        fields: [
          { name: "protocol_code", label: "Protocol Code", required: true },
          { name: "title", label: "Protocol Title", required: true },
          { name: "department_id", label: "Department ID" },
          { name: "category", label: "Category" },
          { name: "status", label: "Status", type: "select", options: ["DRAFT", "ACTIVE", "ARCHIVED"] },
          { name: "effective_from", label: "Effective From", type: "date" },
          { name: "effective_to", label: "Effective To", type: "date" },
        ],
      },
      {
        name: "Protocol Version Form",
        fields: [
          { name: "protocol_id", label: "Protocol ID", required: true },
          { name: "version_label", label: "Version Label", required: true },
          { name: "summary", label: "Summary", type: "textarea" },
          { name: "change_log", label: "Change Log", type: "textarea" },
          { name: "is_current", label: "Set As Current", type: "checkbox" },
          { name: "approved_at", label: "Approved At", type: "datetime" },
        ],
      },
      {
        name: "Mortality Review Form",
        fields: [
          { name: "patient", label: "Patient / MRN" },
          { name: "primary_doctor_id", label: "Primary Doctor ID" },
          { name: "death_date", label: "Death Date", type: "date" },
          { name: "review_status", label: "Review Status", type: "select", options: ["OPEN", "UNDER_REVIEW", "COMPLETED", "CLOSED"] },
          { name: "case_summary", label: "Case Summary", type: "textarea", required: true },
          { name: "recommendations", label: "Recommendations", type: "textarea" },
          { name: "action_items", label: "Action Items", type: "textarea" },
        ],
      },
      {
        name: "Complication Report Form",
        fields: [
          { name: "patient", label: "Patient / MRN" },
          { name: "doctor_id", label: "Doctor ID" },
          { name: "complication_type", label: "Complication Type", required: true },
          { name: "severity", label: "Severity", type: "select", options: ["LOW", "MEDIUM", "HIGH", "CRITICAL"], required: true },
          { name: "status", label: "Status", type: "select", options: ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"] },
          { name: "occurred_at", label: "Occurred At", type: "datetime" },
          { name: "case_summary", label: "Case Summary", type: "textarea", required: true },
          { name: "action_taken", label: "Action Taken", type: "textarea" },
        ],
      },
      {
        name: "Clinical Risk Alert Form",
        fields: [
          { name: "patient", label: "Patient / MRN" },
          { name: "alert_type", label: "Alert Type", required: true },
          { name: "severity", label: "Severity", type: "select", options: ["LOW", "MEDIUM", "HIGH", "CRITICAL"], required: true },
          { name: "risk_score", label: "Risk Score", type: "number" },
          { name: "source_module", label: "Source Module" },
          { name: "description", label: "Description", type: "textarea", required: true },
          { name: "status", label: "Status", type: "select", options: ["OPEN", "IN_PROGRESS", "ACKNOWLEDGED", "RESOLVED", "CLOSED"] },
        ],
      },
      {
        name: "Restricted Drug Approval Form",
        fields: [
          { name: "patient", label: "Patient / MRN" },
          { name: "prescription_id", label: "Prescription ID" },
          { name: "requesting_doctor_id", label: "Requesting Doctor ID" },
          { name: "drug_name", label: "Drug Name", required: true },
          { name: "reason", label: "Reason", type: "textarea" },
          { name: "status", label: "Status", type: "select", options: ["PENDING", "APPROVED", "REJECTED"], required: true },
          { name: "decision_note", label: "Decision Note", type: "textarea" },
        ],
      },
      {
        name: "M&M Review Meeting Form",
        fields: [
          { name: "meeting_date", label: "Meeting Date", type: "datetime", required: true },
          { name: "title", label: "Meeting Title", required: true },
          { name: "status", label: "Status", type: "select", options: ["SCHEDULED", "COMPLETED", "CANCELLED"] },
          { name: "chair_staff_id", label: "Chair Staff ID" },
          { name: "minutes", label: "Minutes", type: "textarea" },
          { name: "recommendations", label: "Recommendations", type: "textarea" },
        ],
      },
      {
        name: "Doctor Performance Score Form",
        fields: [
          { name: "doctor_profile_id", label: "Doctor Profile ID" },
          { name: "metric_period", label: "Metric Period" },
          { name: "diagnosis_accuracy", label: "Diagnosis Accuracy", type: "number" },
          { name: "treatment_outcome_score", label: "Treatment Outcome Score", type: "number" },
          { name: "readmission_rate", label: "Readmission Rate", type: "number" },
          { name: "complication_rate", label: "Complication Rate", type: "number" },
          { name: "overall_score", label: "Overall Score", type: "number" },
          { name: "risk_flag", label: "Risk Flag" },
        ],
      },
      {
        name: "Clinical Outcome Metric Form",
        fields: [
          { name: "department_id", label: "Department ID" },
          { name: "doctor_id", label: "Doctor ID" },
          { name: "metric_date", label: "Metric Date", type: "date" },
          { name: "metric_type", label: "Metric Type", required: true },
          { name: "metric_value", label: "Metric Value", type: "number", required: true },
          { name: "metric_unit", label: "Metric Unit" },
          { name: "notes", label: "Notes", type: "textarea" },
        ],
      },
      {
        name: "Critical Case Alert Form",
        fields: [
          { name: "patient", label: "Patient / MRN" },
          { name: "visit_id", label: "Visit ID" },
          { name: "alert_type", label: "Alert Type", required: true },
          { name: "severity", label: "Severity", type: "select", options: ["LOW", "MEDIUM", "HIGH", "CRITICAL"], required: true },
          { name: "source_module", label: "Source Module" },
          { name: "description", label: "Description", type: "textarea", required: true },
          { name: "status", label: "Status", type: "select", options: ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"] },
          { name: "assigned_to_staff_id", label: "Assigned To Staff ID" },
        ],
      },
    ],
  },
};

const FORMS_DIRECTORY_TYPED =
  FORMS_DIRECTORY as unknown as Record<string, ModuleActionFormConfig>;

export const MODULE_ACTION_FORMS: Record<string, ModuleActionFormConfig> = {
  ...LEGACY_ACTION_FORMS,
  ...FORMS_DIRECTORY_TYPED,
  reports: FORMS_DIRECTORY_TYPED.reporting,
  "blood-bank": {
    forms: [
      ...(FORMS_DIRECTORY_TYPED["blood-bank"]?.forms || []),
      {
        name: "Monitor Patient",
        description: "Open a blood bank patient monitoring workspace.",
        fields: [
          { name: "patient_id", label: "Patient ID / MRN", required: true, placeholder: "Patient ID or MRN" },
          { name: "notes", label: "Monitoring notes", type: "textarea" },
        ],
      },
      {
        name: "Queue Patient",
        description: "Queue a registered patient for blood bank service.",
        fields: [
          { name: "patient_id", label: "Patient ID", required: true, placeholder: "Registered patient ID" },
          { name: "priority", label: "Priority", type: "select", options: ["NORMAL", "URGENT", "STAT"], required: true },
          { name: "reason", label: "Reason", type: "textarea" },
        ],
      },
    ],
  },
};
