// Ported from Medilink-Frontend/src/app/full-system-setup/page.tsx for desktop parity.
import { type CSSProperties, type FormEvent, useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  Banknote,
  BellRing,
  Building2,
  Boxes,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  CreditCard,
  FileCheck2,
  FileText,
  GitBranch,
  Globe2,
  Hash,
  Hospital,
  Landmark,
  MapPin,
  Network,
  ReceiptText,
  ServerCog,
  Stethoscope,
  TestTube2,
  Workflow,
  PlayCircle,
  Settings2,
  ShieldCheck,
  UsersRound,
  X,
} from "lucide-react";
import { api } from "../lib/api";

type FieldType = "text" | "textarea" | "select" | "date" | "time" | "number" | "color" | "file" | "checkbox";

type SetupField = {
  name: string;
  label: string;
  type?: FieldType;
  placeholder?: string;
  options?: string[];
  required?: boolean;
  description?: string;
};

type SetupSection = {
  id: number;
  title: string;
  subtitle: string;
  icon: typeof Building2;
  accent: string;
  mandatory: boolean;
  subsections: string[];
  fields: SetupField[];
};

type StructureDepartment = { code: string; name: string; type: string };
type StructureBed = { number: string; category: string; rate: string; capabilities: string };
type StructureWard = { name: string; type: string; floor: string; beds: StructureBed[] };
type BankAccountDraft = { bank: string; accountName: string; accountNumber: string; accountType: string };
type ChargeItemDraft = { code: string; name: string; category: string; department: string; cash: string; insurance: string; corporate: string; trigger: string };
type InsurerDraft = { name: string; code: string; type: string; providerNumber: string; claimsContact: string; preauthContact: string; status: string };
type StaffSetupDraft = { name: string; staffId: string; department: string; jobTitle: string; email: string; password: string; role: string };

const FIRST_SETUP_STORAGE_KEY = "hmis_first_setup";

const kenyaCounties = [
  "Nairobi",
  "Nakuru",
  "Mombasa",
  "Kisumu",
  "Kiambu",
  "Uasin Gishu",
  "Machakos",
  "Kakamega",
  "Nyeri",
  "Meru",
  "Kisii",
  "Kilifi",
];

const setupSections: SetupSection[] = [
  {
    id: 1,
    title: "Facility Identity",
    subtitle: "Names, branding, letterhead, logo, seal, colours, and document identity.",
    icon: Hospital,
    accent: "#2563eb",
    mandatory: true,
    subsections: ["Facility Names", "Branding", "Brand Identity", "Letterhead Preview"],
    fields: [
      { name: "legalName", label: "Legal / Registered Name", required: true, placeholder: "Nakuru Level Five County Referral Hospital" },
      { name: "shortName", label: "Short / Common Name", required: true, placeholder: "Nakuru L5 Hospital" },
      { name: "tradingName", label: "Trading Name", placeholder: "Sunrise Hospital" },
      { name: "previousNames", label: "Previous Names", type: "textarea", placeholder: "One previous name per line" },
      { name: "primaryLogo", label: "Primary Logo", type: "file", required: true, description: "PNG, SVG, or JPG. Minimum 400x400px." },
      { name: "officialSeal", label: "Official Seal / Stamp", type: "file" },
      { name: "tagline", label: "Tagline", placeholder: "Your Health, Our Priority" },
      { name: "primaryColor", label: "Primary Brand Colour", type: "color" },
      { name: "secondaryColor", label: "Secondary Brand Colour", type: "color" },
    ],
  },
  {
    id: 2,
    title: "Legal & Compliance",
    subtitle: "MOH, KRA, SHA, employment authority, licence, and accreditation setup.",
    icon: ShieldCheck,
    accent: "#7c3aed",
    mandatory: true,
    subsections: ["MOH Registrations", "Revenue Authorities", "Insurance Authorities", "Employment Authorities", "Legal Structure", "Accreditation"],
    fields: [
      { name: "mohLicense", label: "MOH Facility Licence Number", required: true },
      { name: "mohLicenseExpiry", label: "MOH Licence Expiry", type: "date", required: true },
      { name: "mflCode", label: "Master Facility List Code", required: true, placeholder: "12345" },
      { name: "kraPin", label: "KRA PIN Number", required: true, placeholder: "P123456789X" },
      { name: "shaProvider", label: "SHA Provider Number" },
      { name: "entityType", label: "Entity Type", type: "select", required: true, options: ["County Government", "National Government", "Private Limited Company", "NGO", "Faith-Based Organisation", "Trust", "Other"] },
      { name: "accreditation", label: "Current Accreditation Status", type: "select", options: ["None", "In Progress", "KQMH Level 1", "KQMH Level 2", "KQMH Level 3", "KQMH Level 4", "KQMH Level 5", "ISO 9001:2015", "JCI Accredited", "SafeCare Level"] },
    ],
  },
  {
    id: 3,
    title: "Location & Contact",
    subtitle: "Physical location, GPS, postal details, operational contacts, and digital presence.",
    icon: MapPin,
    accent: "#0891b2",
    mandatory: true,
    subsections: ["Physical Location", "Postal Address", "Operational Contacts", "Digital Presence"],
    fields: [
      { name: "physicalAddress1", label: "Physical Address - Line 1", required: true },
      { name: "physicalAddress2", label: "Physical Address - Line 2" },
      { name: "town", label: "Town / City", required: true },
      { name: "county", label: "County", type: "select", required: true, options: kenyaCounties },
      { name: "subCounty", label: "Sub-County" },
      { name: "landmark", label: "Nearest Landmark", type: "textarea" },
      { name: "latitude", label: "GPS Latitude", type: "number" },
      { name: "longitude", label: "GPS Longitude", type: "number" },
      { name: "switchboard", label: "Main Switchboard Number", required: true, placeholder: "+2547..." },
      { name: "emergencyLine", label: "Emergency / Casualty Direct Line", required: true, placeholder: "+2547..." },
      { name: "billingPhone", label: "Billing Telephone", placeholder: "+2547..." },
      { name: "patientSupportPhone", label: "Patient Support Telephone", placeholder: "+2547..." },
      { name: "email", label: "Official Email", type: "text", placeholder: "info@hospital.co.ke" },
      { name: "emergencyEmail", label: "Emergency Email", type: "text", placeholder: "emergency@hospital.co.ke" },
      { name: "website", label: "Official Website URL" },
      { name: "whatsapp", label: "WhatsApp Business Number", placeholder: "+2547..." },
    ],
  },
  {
    id: 4,
    title: "Operational Settings",
    subtitle: "Working hours, MRN rules, triage, queue, inpatient, billing, and security settings.",
    icon: Settings2,
    accent: "#16a34a",
    mandatory: true,
    subsections: ["Working Hours", "Patient Identification", "Clinical Workflow", "Queue Management", "Inpatient", "Billing & Payment", "Security & Access"],
    fields: [
      { name: "workingDays", label: "Standard Working Days", placeholder: "Monday-Friday, Saturday half-day", required: true },
      { name: "openingTime", label: "Opening Time", type: "time" },
      { name: "closingTime", label: "Closing Time", type: "time" },
      { name: "weekendHours", label: "Weekend / Holiday Hours", required: true, placeholder: "Saturday 08:00-13:00; Sunday closed" },
      { name: "holidayCalendar", label: "Public Holiday Calendar", required: true, placeholder: "Kenya national holidays" },
      { name: "patientIdType", label: "Patient Identification Type", type: "select", required: true, options: ["MRN only", "MRN and National ID", "MRN and Passport"] },
      { name: "mrnPrefix", label: "MRN Prefix", required: true, placeholder: "NL5" },
      { name: "mrnLength", label: "MRN Number Length", type: "select", options: ["4", "5", "6", "7"], required: true },
      { name: "encounterPrefix", label: "Encounter Number Prefix", required: true, placeholder: "ENC" },
      { name: "triageSystem", label: "Triage System", type: "select", required: true, options: ["SATS", "Manchester Triage System", "Emergency Severity Index", "START", "Custom"] },
      { name: "icdVersion", label: "ICD Version", type: "select", options: ["ICD-10", "ICD-11"], required: true },
      { name: "vitalSignsFrequency", label: "Default Vital Signs Frequency", required: true, placeholder: "Every 4 hours" },
      { name: "clinicalNotesRequired", label: "Clinical Notes Requirement", type: "select", required: true, options: ["Required before workflow completion", "Optional", "Role-based"] },
      { name: "queueTokenPrefix", label: "Queue Token Prefix", required: true, placeholder: "OPD" },
      { name: "queueNumberLength", label: "Queue Number Length", type: "number", required: true },
      { name: "queuePriorityMode", label: "Queue Priority Mode", type: "select", required: true, options: ["Triage-based", "Manual priority", "First come first served"] },
      { name: "queueAutoCall", label: "Automatic Queue Calling", type: "select", required: true, options: ["Enabled", "Disabled"] },
      { name: "inpatientAdmissionMode", label: "Inpatient Admission Mode", type: "select", required: true, options: ["Bed required before admission", "Allow pending bed", "Approval required"] },
      { name: "bedBillingTrigger", label: "Bed Billing Trigger", type: "select", required: true, options: ["Midnight", "Admission day", "Proportional"] },
      { name: "dischargeWorkflow", label: "Discharge Workflow", type: "select", required: true, options: ["Clinical and billing clearance", "Clinical clearance only", "Role-based approval"] },
      { name: "paymentMethods", label: "Accepted Payment Methods", type: "textarea", required: true, placeholder: "Cash, MPESA, Card, Insurance" },
      { name: "defaultPaymentMethod", label: "Default Payment Method", type: "select", required: true, options: ["Cash", "MPESA", "Card", "Insurance", "Credit"] },
      { name: "billingTrigger", label: "Default Billing Trigger", type: "select", required: true, options: ["At order", "At service completion", "At result authorisation"] },
      { name: "allowCredit", label: "Credit Services", type: "select", required: true, options: ["Allowed with approval", "Allowed", "Disabled"] },
      { name: "sessionTimeout", label: "Clinical Session Timeout (minutes)", type: "number", placeholder: "10" },
      { name: "passwordExpiry", label: "Password Expiry (days)", type: "number", placeholder: "90" },
      { name: "mfaPolicy", label: "MFA Policy", type: "select", required: true, options: ["All clinical and financial roles", "All users", "High-security roles only", "Disabled during setup"] },
      { name: "concurrentSessions", label: "Concurrent Session Policy", type: "select", required: true, options: ["One session", "Two sessions", "Unlimited"] },
      { name: "breakGlassPolicy", label: "Break-Glass Access", type: "select", required: true, options: ["Require reason and audit", "Require administrator approval", "Disabled"] },
      { name: "loginHours", label: "Allowed Login Hours", required: true, placeholder: "24 hours or 06:00-22:00" },
      { name: "ipRestriction", label: "IP Restriction Policy", type: "textarea", required: true, placeholder: "Allowed networks or unrestricted" },
    ],
  },
  {
    id: 5,
    title: "Facility Structure",
    subtitle: "Departments, wards, beds, theatres, consultation rooms, and storage locations.",
    icon: Building2,
    accent: "#0f766e",
    mandatory: true,
    subsections: ["Departments", "Wards", "Beds", "Theatres", "Specialised Areas"],
    fields: [
      { name: "departmentsCatalogue", label: "All Departments", type: "textarea", required: true, description: "One per line: Code | Name | Type | Parent | Head", placeholder: "OPD | Outpatient | Clinical\nLAB | Laboratory | Diagnostic\nPHARM | Pharmacy | Pharmacy" },
      { name: "wardsCatalogue", label: "All Wards", type: "textarea", required: true, description: "One per line: Name | Type | Capacity | Floor | Manager", placeholder: "Male Medical | General Medical | 30 | 1st Floor\nICU | ICU | 10 | 2nd Floor" },
      { name: "bedsCatalogue", label: "Beds in Each Ward", type: "textarea", required: true, description: "One per line: Ward | Bed Number | Category | Daily Rate | Capabilities", placeholder: "Male Medical | MM-001 | General | 1500 | Oxygen, Suction\nICU | ICU-001 | ICU | 8000 | Monitor, Oxygen" },
      { name: "theatresCatalogue", label: "All Theatres", type: "textarea", required: true, description: "One theatre per line: Name | Code | Type | Capacity", placeholder: "Main Theatre | OT-01 | Major Surgery | 1" },
      { name: "specialisedAreasCatalogue", label: "All Specialised Areas", type: "textarea", required: true, description: "One area per line: Name | Type | Department | Status", placeholder: "Dialysis Unit | Dialysis | Medicine | Active\nCath Lab | Cardiology | Cardiology | Active" },
      { name: "departmentOperatingHours", label: "Department Operating Hours", type: "textarea", required: true, placeholder: "OPD: 08:00-17:00\nEmergency: 24 hours" },
      { name: "wardPolicies", label: "Ward Policies", type: "textarea", required: true, placeholder: "Visiting hours, gender rules, age rules, isolation and visitor limits" },
      { name: "bedCapabilities", label: "Bed Capability Standards", type: "textarea", required: true, placeholder: "Available, Occupied, Reserved, Isolation, Maintenance; Oxygen, suction, monitor" },
    ],
  },
  {
    id: 6,
    title: "Financial Configuration",
    subtitle: "Bank accounts, chart of accounts, cost centres, financial year, tax, and VAT.",
    icon: Landmark,
    accent: "#0284c7",
    mandatory: true,
    subsections: ["Bank Accounts", "Chart of Accounts", "Cost Centres", "Financial Year", "Tax Configuration"],
    fields: [
      { name: "bankName", label: "Bank Name", required: true },
      { name: "accountName", label: "Account Name", required: true },
      { name: "accountNumber", label: "Account Number", required: true },
      { name: "mpesaPaybill", label: "MPESA Paybill Number" },
      { name: "coaMode", label: "Chart of Accounts Setup", type: "select", required: true, options: ["Use Medilink Standard COA", "Import from Excel", "Manual Entry"] },
      { name: "financialYearStart", label: "Financial Year Start Month", type: "select", options: ["January", "July", "October"] },
      { name: "vatRegistered", label: "VAT Registered", type: "select", options: ["Yes", "No"] },
    ],
  },
  {
    id: 7,
    title: "Charge Master & Pricing",
    subtitle: "Charge master import, consultation fees, lab, radiology, procedures, formulary, and packages.",
    icon: Banknote,
    accent: "#ea580c",
    mandatory: true,
    subsections: ["Charge Master Setup", "Charge Categories", "Automation Rules", "Drug Formulary", "Package Deals"],
    fields: [
      { name: "chargeSetupMode", label: "Charge Master Setup Option", type: "select", required: true, options: ["Import Excel Template", "Start from Medilink Standard Charge Master", "Manual Entry"] },
      { name: "opdNewFee", label: "OPD New Patient Fee", type: "number", required: true },
      { name: "emergencyFee", label: "Emergency Consultation Fee", type: "number" },
      { name: "labTrigger", label: "Lab Charging Trigger", type: "select", options: ["At order placement", "At specimen collection confirmation", "At result authorisation"], required: true },
      { name: "radiologyTrigger", label: "Radiology Charging Trigger", type: "select", options: ["At order placement", "At image acquisition confirmation", "At report authorisation"], required: true },
      { name: "drugPricing", label: "Drug Formulary Pricing Policy", type: "textarea", placeholder: "Cash, SHA and controlled substance pricing notes" },
    ],
  },
  {
    id: 8,
    title: "Insurance & Schemes",
    subtitle: "Insurer registration, tariffs, corporate accounts, pre-authorisation, and claim rules.",
    icon: CreditCard,
    accent: "#db2777",
    mandatory: true,
    subsections: ["Insurance Scheme Registration", "Tariff Loading", "Corporate Accounts"],
    fields: [
      { name: "schemeName", label: "Primary Scheme Name", required: true, placeholder: "SHA / AAR" },
      { name: "schemeType", label: "Scheme Type", type: "select", required: true, options: ["SHA", "Private Insurance", "Corporate Direct Billing", "NGO", "Government Scheme"] },
      { name: "claimsMethod", label: "Claims Submission Method", type: "select", options: ["Electronic via API", "Email PDF", "Online portal", "Physical submission"], required: true },
      { name: "preauthRequired", label: "Pre-authorisation Required", type: "select", options: ["Yes", "No"] },
      { name: "tariffMode", label: "Tariff Loading Option", type: "select", options: ["Upload Tariff Schedule", "Percentage of Cash Price", "Manual Entry"], required: true },
    ],
  },
  {
    id: 9,
    title: "Staff & User Management",
    subtitle: "Staff import, roles, user accounts, MFA, shift scope, and access control policies.",
    icon: UsersRound,
    accent: "#4f46e5",
    mandatory: true,
    subsections: ["Staff Registration", "Role Configuration", "User Account Creation", "Access Control Policies"],
    fields: [
      { name: "staffMode", label: "Staff Registration Mode", type: "select", required: true, options: ["Bulk Import", "Manual Registration"] },
      { name: "adminName", label: "System Administrator Name", required: true },
      { name: "adminEmail", label: "System Administrator Login", required: true },
      { name: "standardRolesReviewed", label: "Standard Roles Reviewed", type: "select", options: ["Yes", "No"], required: true },
      { name: "mfaPolicy", label: "MFA Requirement", type: "select", options: ["All clinical and financial roles", "All users", "High-security roles only", "Disabled during setup"], required: true },
      { name: "ipRestriction", label: "IP Restriction Policy", type: "textarea" },
    ],
  },
  {
    id: 10,
    title: "Notifications & Comms",
    subtitle: "SMS, email, WhatsApp, event escalation, templates, and print configuration.",
    icon: BellRing,
    accent: "#ca8a04",
    mandatory: true,
    subsections: ["SMS Configuration", "Email Configuration", "WhatsApp Configuration", "Notification Events", "Print Configuration"],
    fields: [
      { name: "smsProvider", label: "SMS Provider", type: "select", required: true, options: ["Africa's Talking", "Celcom Africa", "Twilio"] },
      { name: "senderId", label: "SMS Sender ID", required: true },
      { name: "emailProvider", label: "Email Provider", type: "select", options: ["Brevo", "Resend", "Amazon SES", "Custom SMTP"], required: true },
      { name: "fromEmail", label: "From Email Address", required: true },
      { name: "whatsappNumber", label: "WhatsApp Business Number" },
      { name: "criticalLabAlert", label: "Critical Lab Value Escalation", type: "textarea", required: true },
      { name: "defaultPaperSize", label: "Default Paper Size", type: "select", options: ["A4", "Letter"], required: true },
    ],
  },
  {
    id: 11,
    title: "Integrations",
    subtitle: "MPESA, SHA, KHIS/DHIS2, laboratory analysers, PACS, relay, and app API keys.",
    icon: Network,
    accent: "#9333ea",
    mandatory: true,
    subsections: ["MPESA Daraja", "SHA Claims", "KHIS / DHIS2", "Laboratory Analysers", "PACS", "Medilink Relay", "Medilink App API"],
    fields: [
      { name: "mpesaEnvironment", label: "MPESA Environment", type: "select", required: true, options: ["Sandbox", "Production"] },
      { name: "businessShortCode", label: "Business Short Code" },
      { name: "nhifApiBase", label: "SHA API Base URL" },
      { name: "dhis2Server", label: "KHIS / DHIS2 Server URL" },
      { name: "labInterface", label: "Laboratory Interface Type", type: "select", options: ["HL7 v2 over TCP/IP", "ASTM", "Serial RS-232", "Bidirectional middleware", "Not configured yet"] },
      { name: "pacsProtocol", label: "PACS Retrieval Protocol", type: "select", options: ["WADO-RS", "WADO-URI", "DICOMweb", "Not configured yet"] },
      { name: "appScopes", label: "Medilink App Enabled Scopes", type: "textarea", placeholder: "appointments, records requests, pharmacy orders, shift postings" },
    ],
  },
  {
    id: 12,
    title: "Go-Live Readiness",
    subtitle: "47 validation checks, readiness score, sign-offs, live activation, and post-launch monitoring.",
    icon: PlayCircle,
    accent: "#0d9488",
    mandatory: true,
    subsections: ["Automated Validation", "Readiness Score", "Go-Live Authorisation", "Post Go-Live Monitoring"],
    fields: [
      { name: "ceoSignoff", label: "Hospital Administration Sign-Off", type: "select", required: true, options: ["Pending", "Approved"] },
      { name: "engineerSignoff", label: "Medilink Engineer Sign-Off", type: "select", required: true, options: ["Pending", "Approved"] },
      { name: "downtimeFormsPrinted", label: "Downtime Paper Forms Printed", type: "select", required: true, options: ["Yes", "No"] },
      { name: "staffTrained", label: "Staff Training Complete", type: "select", required: true, options: ["Yes", "No"] },
      { name: "activationMode", label: "System Activation", type: "select", options: ["Setup Mode", "Live Mode"], required: true },
      { name: "postLaunchRisks", label: "Post Go-Live Open Items", type: "textarea" },
    ],
  },
  {
    id: 13,
    title: "Organization & Facilities",
    subtitle: "Parent organization, facility hierarchy, operating status, and multi-facility governance.",
    icon: GitBranch,
    accent: "#2563eb",
    mandatory: true,
    subsections: ["Organization", "Facilities", "Governance"],
    fields: [
      { name: "organizationName", label: "Parent Organization", required: true },
      { name: "facilityCode", label: "Facility Code", required: true },
      { name: "facilityType", label: "Facility Type", type: "select", required: true, options: ["General Hospital", "Specialist Hospital", "Maternity Home", "Diagnostic Centre", "Clinic", "Pharmacy"] },
      { name: "facilityLevel", label: "Facility Level", type: "select", required: true, options: ["Level 2", "Level 3", "Level 4", "Level 5", "Level 6"] },
      { name: "facilityStatus", label: "Facility Status", type: "select", required: true, options: ["Active", "Suspended", "Under Maintenance", "Closed"] },
    ],
  },
  {
    id: 14,
    title: "Physical Structure",
    subtitle: "Buildings, floors, rooms, wards, beds, capacity, and physical locations.",
    icon: Boxes,
    accent: "#0f766e",
    mandatory: true,
    subsections: ["Buildings", "Floors", "Rooms", "Wards", "Beds"],
    fields: [
      { name: "buildingName", label: "Primary Building", required: true },
      { name: "buildingCode", label: "Building Code", required: true },
      { name: "floorCount", label: "Number of Floors", type: "number", required: true },
      { name: "roomCount", label: "Initial Room Count", type: "number", required: true },
      { name: "wardCount", label: "Initial Ward Count", type: "number", required: true },
      { name: "bedCount", label: "Licensed Bed Count", type: "number", required: true },
    ],
  },
  {
    id: 15,
    title: "System Defaults",
    subtitle: "Regional, calendar, financial year, language, and measurement defaults.",
    icon: Globe2,
    accent: "#0891b2",
    mandatory: true,
    subsections: ["Regional", "Calendar", "Financial Year", "Measurements"],
    fields: [
      { name: "country", label: "Country", required: true, placeholder: "Kenya" },
      { name: "currency", label: "Currency", required: true, placeholder: "KES" },
      { name: "timezone", label: "Timezone", required: true, placeholder: "Africa/Nairobi" },
      { name: "language", label: "Language", required: true, placeholder: "English" },
      { name: "dateFormat", label: "Date Format", required: true, placeholder: "DD/MM/YYYY" },
      { name: "timeFormat", label: "Time Format", type: "select", required: true, options: ["24-hour", "12-hour"] },
      { name: "numberFormat", label: "Number Format", required: true, placeholder: "1,234.56" },
      { name: "weekStartsOn", label: "Week Starts On", type: "select", required: true, options: ["Monday", "Sunday"] },
      { name: "measurementSystem", label: "Measurement System", type: "select", required: true, options: ["Metric", "Imperial"] },
    ],
  },
  {
    id: 16,
    title: "Numbering & Identifiers",
    subtitle: "MRN, encounter, invoice, receipt, laboratory, queue, claim, and referral sequences.",
    icon: Hash,
    accent: "#7c3aed",
    mandatory: true,
    subsections: ["Patient MRN", "Financial Sequences", "Clinical Sequences", "Concurrency"],
    fields: [
      { name: "mrnPrefix", label: "Patient MRN Prefix", required: true },
      { name: "mrnSeparator", label: "MRN Separator", required: true, placeholder: "-" },
      { name: "mrnSequenceLength", label: "MRN Sequence Length", type: "number", required: true },
      { name: "mrnStartingNumber", label: "MRN Starting Number", type: "number", required: true },
      { name: "encounterPrefix", label: "Encounter Prefix", required: true },
      { name: "invoicePrefix", label: "Invoice Prefix", required: true },
      { name: "resetFrequency", label: "Reset Frequency", type: "select", required: true, options: ["Never", "Daily", "Monthly", "Yearly"] },
    ],
  },
  {
    id: 17,
    title: "Clinical Configuration",
    subtitle: "Triage, vital signs, early warning scores, escalation, medication, and clinical billing rules.",
    icon: Stethoscope,
    accent: "#dc2626",
    mandatory: true,
    subsections: ["Triage", "Vital Signs", "Early Warning", "Escalation", "Billing Triggers"],
    fields: [
      { name: "triageEngine", label: "Triage System", type: "select", required: true, options: ["MTS", "SATS", "ESI", "CTAS", "Custom"] },
      { name: "earlyWarningScore", label: "Early Warning Score", type: "select", required: true, options: ["NEWS2", "PEWS", "MEWS", "Custom", "Disabled"] },
      { name: "generalWardObservation", label: "General Ward Observation Frequency", required: true, placeholder: "Every 4 hours" },
      { name: "icuObservation", label: "ICU Observation Frequency", required: true, placeholder: "Every 60 minutes" },
      { name: "pharmacyBillingTrigger", label: "Pharmacy Billing Trigger", type: "select", required: true, options: ["Prescription", "Dispensing", "Hybrid"] },
      { name: "bedBillingTrigger", label: "Bed Billing Trigger", type: "select", required: true, options: ["Midnight", "Admission day", "Proportional"] },
    ],
  },
  {
    id: 18,
    title: "Master Data",
    subtitle: "Shared diagnoses, procedures, allergies, laboratory, radiology, pharmacy, and clinical dictionaries.",
    icon: ServerCog,
    accent: "#ca8a04",
    mandatory: true,
    subsections: ["Clinical", "Laboratory", "Radiology", "Pharmacy"],
    fields: [
      { name: "diagnosisDictionary", label: "Diagnosis Dictionary", type: "select", required: true, options: ["Use Medilink Standard", "Import Data", "Manual Configuration"] },
      { name: "laboratoryCatalogue", label: "Laboratory Catalogue", type: "select", required: true, options: ["Use Medilink Standard", "Import Data", "Manual Configuration"] },
      { name: "radiologyCatalogue", label: "Radiology Catalogue", type: "select", required: true, options: ["Use Medilink Standard", "Import Data", "Manual Configuration"] },
      { name: "pharmacyFormulary", label: "Pharmacy Formulary", type: "select", required: true, options: ["Use Medilink Standard", "Import Data", "Manual Configuration"] },
    ],
  },
  {
    id: 19,
    title: "Documents & Templates",
    subtitle: "Document branding, templates, signatures, seals, watermarks, and confidentiality defaults.",
    icon: ReceiptText,
    accent: "#9333ea",
    mandatory: true,
    subsections: ["Templates", "Letterhead", "Signatures", "Watermarks"],
    fields: [
      { name: "templateMode", label: "Document Template Setup", type: "select", required: true, options: ["Use Medilink Standard", "Import Templates", "Manual Configuration"] },
      { name: "defaultPaperSize", label: "Default Paper Size", type: "select", required: true, options: ["A4", "Letter"] },
      { name: "confidentialityText", label: "Confidentiality Text", type: "textarea", required: true },
      { name: "signaturePolicy", label: "Signature Policy", type: "select", required: true, options: ["Digital signature required", "Manual signature", "Role-based"] },
    ],
  },
  {
    id: 20,
    title: "Module Activation",
    subtitle: "Activate modules dynamically only after their configuration dependencies are satisfied.",
    icon: Workflow,
    accent: "#16a34a",
    mandatory: true,
    subsections: ["Active Modules", "Dependencies", "Readiness", "Service Gates"],
    fields: [
      { name: "moduleActivationMode", label: "Module Activation Mode", type: "select", required: true, options: ["Activate manually", "Use standard bundle", "Activate all after validation"] },
      { name: "coreModules", label: "Core Modules Enabled", type: "textarea", required: true, placeholder: "Patient Registration, OPD, Billing" },
      { name: "serviceGatePolicy", label: "Service Gate Policy", type: "select", required: true, options: ["Block until paid", "Allow credit", "Role-based override"] },
    ],
  },
  {
    id: 21,
    title: "Dependency & Change Control",
    subtitle: "Configuration versions, impact analysis, approvals, audit history, and controlled changes.",
    icon: TestTube2,
    accent: "#475569",
    mandatory: true,
    subsections: ["Dependencies", "Versioning", "Impact Analysis", "Audit"],
    fields: [
      { name: "configurationVersion", label: "Configuration Version", required: true, placeholder: "1.0" },
      { name: "changeApprovalMode", label: "Change Approval Mode", type: "select", required: true, options: ["Administrator approval", "Two-person approval", "Change request workflow"] },
      { name: "auditRetentionDays", label: "Audit Retention (days)", type: "number", required: true },
      { name: "impactAnalysis", label: "Impact Analysis Required", type: "select", required: true, options: ["For all major changes", "For financial and clinical changes", "Disabled during setup"] },
    ],
  },
  {
    id: 22,
    title: "Backup, Testing & Recovery",
    subtitle: "Backup policy, downtime readiness, testing centre, recovery contacts, and disaster recovery controls.",
    icon: ClipboardCheck,
    accent: "#0f766e",
    mandatory: true,
    subsections: ["Backup Policy", "Downtime", "Testing Centre", "Recovery"],
    fields: [
      { name: "databaseBackupFrequency", label: "Database Backup Frequency", type: "select", required: true, options: ["Hourly", "Daily", "Weekly"] },
      { name: "configurationBackupFrequency", label: "Configuration Backup Frequency", type: "select", required: true, options: ["Daily", "Weekly", "Monthly"] },
      { name: "backupRetentionDays", label: "Backup Retention (days)", type: "number", required: true },
      { name: "downtimeFormsReady", label: "Downtime Forms Ready", type: "select", required: true, options: ["Yes", "No"] },
      { name: "testEnvironment", label: "Test Environment", type: "select", required: true, options: ["Enabled", "Disabled"] },
      { name: "recoveryContact", label: "Recovery Responsible Person", required: true },
    ],
  },
  {
    id: 23,
    title: "Referral Letter Templates",
    subtitle: "Internal, external and electronic referral formats with explicit privacy controls.",
    icon: FileText,
    accent: "#0f766e",
    mandatory: true,
    subsections: ["Internal Referral", "External Referral", "Electronic FHIR Referral", "Privacy Controls"],
    fields: [
      { name: "templateMode", label: "Template Mode", type: "select", required: true, options: ["Use Medilink Standard", "Use Facility Template", "Require Approval"] },
      { name: "internalReferralFields", label: "Internal Referral Fields", type: "textarea", required: true, placeholder: "Patient, diagnosis, reason, medications, investigations, urgency" },
      { name: "externalReferralFields", label: "External Referral Fields", type: "textarea", required: true, placeholder: "Receiving facility, receiving doctor, clinical summary and request" },
      { name: "electronicReferralFields", label: "Electronic FHIR Bundle Fields", type: "textarea", required: true, placeholder: "Select the clinical information permitted in an electronic referral" },
      { name: "privacyExclusions", label: "Privacy Exclusions", type: "textarea", required: true, placeholder: "Financial information and HIV status excluded unless explicitly selected" },
      { name: "referralSignatoryRoles", label: "Authorised Signatory Roles", required: true, placeholder: "Doctor | Medical Officer | Clinical Lead" },
    ],
  },
];

// Keep the explicit required/optional contract from each section and remove
// accidental duplicate controls before render.
setupSections.forEach((section) => {
  const seen = new Set<string>();
  section.fields = section.fields.filter((field) => {
    if (seen.has(field.name)) return false;
    seen.add(field.name);
    return true;
  });
});

const statusFor = (progress: number) => {
  if (progress >= 100) return { label: "Complete", className: "complete", icon: CheckCircle2 };
  if (progress > 0) return { label: "In Progress", className: "progress", icon: ClipboardCheck };
  return { label: "Not Started", className: "empty", icon: FileText };
};

const asString = (value: unknown) => String(value ?? "").trim();

const firstNonEmpty = (...values: unknown[]) => {
  for (const value of values) {
    const normalized = asString(value);
    if (normalized) return normalized;
  }
  return "";
};

const mapOwnershipToEntityType = (value: unknown) => {
  const normalized = asString(value).toLowerCase();
  if (!normalized) return "";
  if (normalized.includes("county")) return "County Government";
  if (normalized.includes("national")) return "National Government";
  if (normalized.includes("private") && normalized.includes("profit")) return "Private Limited Company";
  if (normalized.includes("ngo")) return "NGO";
  if (normalized.includes("faith")) return "Faith-Based Organisation";
  if (normalized.includes("trust")) return "Trust";
  return "Other";
};

const parseFirstSetupCache = () => {
  try {
    const raw = window.localStorage.getItem(FIRST_SETUP_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const mapFirstSetupToFullSetup = (cache: any) => {
  const values = cache?.values && typeof cache.values === "object" ? cache.values : {};
  const checked = cache?.checked && typeof cache.checked === "object" ? cache.checked : {};
  const files = cache?.files && typeof cache.files === "object" ? cache.files : {};
  const facility = cache?.savedFacility && typeof cache.savedFacility === "object" ? cache.savedFacility : {};
  const settings = facility?.settings && typeof facility.settings === "object" ? facility.settings : {};
  const profile = settings?.facilityProfile && typeof settings.facilityProfile === "object" ? settings.facilityProfile : {};
  const contacts = settings?.contacts && typeof settings.contacts === "object" ? settings.contacts : {};
  const workingHours = settings?.workingHours && typeof settings.workingHours === "object" ? settings.workingHours : {};
  const departments = settings?.departments && typeof settings.departments === "object" ? settings.departments : {};
  const admin = settings?.hospitalAdmin && typeof settings.hospitalAdmin === "object" ? settings.hospitalAdmin : {};
  const branding = cache?.branding && typeof cache.branding === "object" ? cache.branding : {};
  const initialDepartments = Array.isArray(checked.departments) ? checked.departments : Array.isArray(departments.initial) ? departments.initial : [];
  const openDays = Array.isArray(checked.openDays) ? checked.openDays : Array.isArray(workingHours.openDays) ? workingHours.openDays : [];

  const mapped: Record<string, string> = {
    legalName: firstNonEmpty(values.legalName, facility.name),
    shortName: firstNonEmpty(values.shortName, facility.shortName),
    primaryLogo: firstNonEmpty(files.logo, facility.logoUrl, branding.logoUrl),
    officialSeal: firstNonEmpty(files.stamp, branding.stampUrl),
    tagline: firstNonEmpty(values.tagline, profile.tagline),
    mohLicense: firstNonEmpty(values.mohLicense, profile.mohLicense),
    mflCode: firstNonEmpty(values.mflCode, facility.mflCode),
    entityType: mapOwnershipToEntityType(firstNonEmpty(values.ownershipType, profile.ownershipType, facility.orgType)),
    accreditation: firstNonEmpty(values.accreditation, profile.accreditation),
    physicalAddress1: firstNonEmpty(values.physicalAddress, facility.addressLine1),
    county: firstNonEmpty(values.county, facility.county),
    subCounty: firstNonEmpty(values.subCounty, facility.subCounty),
    switchboard: firstNonEmpty(values.mainPhone, contacts.mainPhone, facility.phone),
    emergencyLine: firstNonEmpty(values.emergencyPhone, contacts.emergencyPhone),
    website: firstNonEmpty(values.website, facility.website),
    workingDays: firstNonEmpty(openDays.join(", ")),
    openingTime: firstNonEmpty(values.weekdayOpen, workingHours.weekdayOpen),
    closingTime: firstNonEmpty(values.weekdayClose, workingHours.weekdayClose),
    departmentName: firstNonEmpty(initialDepartments[0], departments.primaryDepartment),
    bedCount: firstNonEmpty(values.bedCapacity, profile.bedCapacity),
    adminName: firstNonEmpty(values.adminName, admin.name),
    adminEmail: firstNonEmpty(values.adminEmail, admin.email),
  };

  return Object.fromEntries(Object.entries(mapped).filter(([, value]) => asString(value)));
};

const normalizePrefill = (values: Record<string, unknown>) => {
  const normalized = Object.fromEntries(
    Object.entries(values || {}).map(([key, value]) => [key, asString(value)]).filter(([, value]) => value),
  ) as Record<string, string>;
  if (normalized.entityType) normalized.entityType = mapOwnershipToEntityType(normalized.entityType);
  return normalized;
};

export default function FullSystemSetupView() {
  const [activeSection, setActiveSection] = useState<SetupSection | null>(setupSections[0]);
  const [values, setValues] = useState<Record<string, string>>({
    primaryColor: "#1B4FD8",
    secondaryColor: "#10B981",
  });
  const [lockedFirstSetupFields, setLockedFirstSetupFields] = useState<Record<string, boolean>>({});
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const [validating, setValidating] = useState(false);
  const [goLiveBusy, setGoLiveBusy] = useState(false);
  const [structureSlide, setStructureSlide] = useState(0);
  const [structureDepartments, setStructureDepartments] = useState<StructureDepartment[]>([
    { code: "", name: "", type: "Clinical" },
  ]);
  const [structureWards, setStructureWards] = useState<StructureWard[]>([
    { name: "", type: "General Medical", floor: "", beds: [{ number: "", category: "General", rate: "", capabilities: "" }] },
  ]);
  const [structureTheatres, setStructureTheatres] = useState("");
  const [structureSpecialisedAreas, setStructureSpecialisedAreas] = useState("");
  const [financialSlide, setFinancialSlide] = useState(0);
  const [bankAccounts, setBankAccounts] = useState<BankAccountDraft[]>([{ bank: "", accountName: "", accountNumber: "", accountType: "Operating" }]);
  const [paymentMethods, setPaymentMethods] = useState<string[]>(["Cash", "MPESA"]);
  const [financialControls, setFinancialControls] = useState({ maxDiscount: "", refundThreshold: "", writeOffThreshold: "", creditLimit: "", manualChargePermission: "Role-based approval", manualReversalPermission: "Administrator approval" });
  const [financialMeta, setFinancialMeta] = useState({ coaMode: "Use Medilink Standard COA", financialYearStart: "January", vatRegistered: "No" });
  const [chargeSlide, setChargeSlide] = useState(0);
  const [chargeItems, setChargeItems] = useState<ChargeItemDraft[]>([{ code: "", name: "", category: "Consultation", department: "OPD", cash: "", insurance: "", corporate: "", trigger: "At service completion" }]);
  const [chargeMeta, setChargeMeta] = useState({ setupMode: "Manual Entry", labTrigger: "At specimen collection confirmation", radiologyTrigger: "At image acquisition confirmation", drugPricing: "", packages: "" });
  const [insuranceSlide, setInsuranceSlide] = useState(0);
  const [insurers, setInsurers] = useState<InsurerDraft[]>([{ name: "", code: "", type: "SHA", providerNumber: "", claimsContact: "", preauthContact: "", status: "Active" }]);
  const [insuranceMeta, setInsuranceMeta] = useState({ claimsMethod: "Electronic via API", preauthRequired: "Yes", tariffMode: "Upload Tariff Schedule", apiBase: "", apiKey: "", apiSecret: "", environment: "Sandbox", copayPolicy: "", benefitLimits: "", claimTurnaround: "", documents: "" });
  const [staffSlide, setStaffSlide] = useState(0);
  const [setupStaff, setSetupStaff] = useState<StaffSetupDraft[]>([{ name: "", staffId: "", department: "", jobTitle: "", email: "", password: "", role: "Receptionist" }]);
  const [setupRoles, setSetupRoles] = useState<string[]>(["System Administrator", "Doctor", "Nurse", "Receptionist"]);
  const [staffAdmin, setStaffAdmin] = useState({ mode: "Manual Registration", name: "", email: "", rolesReviewed: "Yes", mfaPolicy: "High-security roles only", ipRestriction: "Unrestricted" });
  const [staffSecurity, setStaffSecurity] = useState({ passwordMinimum: "12", passwordComplexity: "Uppercase, lowercase, number and symbol", passwordHistory: "5", sessionPolicy: "One session", loginHours: "24 hours", breakGlass: "Require reason and audit" });
  const [notificationSlide, setNotificationSlide] = useState(0);
  const [notificationConfig, setNotificationConfig] = useState({ smsProvider: "Africa's Talking", senderId: "", smsApiKey: "", smsApiSecret: "", emailProvider: "Custom SMTP", fromEmail: "", replyTo: "", smtpHost: "", smtpPort: "587", smtpUsername: "", smtpPassword: "", whatsappNumber: "", whatsappProvider: "Meta WhatsApp Business", appointmentReminder: "SMS and email 24 hours before", queueNotification: "SMS when token is called", criticalLabAlert: "Notify clinician immediately and escalate to supervisor", notificationLanguage: "English", defaultPaperSize: "A4", templateGuidance: "Use facility name, patient name, appointment time and support contact in every template." });
  const [integrationSlide, setIntegrationSlide] = useState(0);
  const [integrationConfig, setIntegrationConfig] = useState({ mpesaEnvironment: "Sandbox", businessShortCode: "", mpesaConsumerKey: "", mpesaConsumerSecret: "", mpesaPasskey: "", mpesaCallbackUrl: "", nhifApiBase: "", nhifApiKey: "", nhifFacilityCode: "", dhis2Server: "", dhis2Username: "", dhis2Password: "", dhis2OrgUnit: "", labInterface: "Not configured yet", labHost: "", labPort: "", labUsername: "", labPassword: "", pacsProtocol: "Not configured yet", pacsBaseUrl: "", pacsAetTitle: "", relayUrl: "", relayApiKey: "", appScopes: "appointments, records requests, pharmacy orders, shift postings" });
  const [readinessSlide, setReadinessSlide] = useState(0);
  const [readinessConfig, setReadinessConfig] = useState({ ceoSignoff: "Pending", engineerSignoff: "Pending", downtimeFormsPrinted: "No", staffTrained: "No", dataBackupTested: "No", securityReview: "Pending", integrationTests: "Pending", clinicalUat: "Pending", activationMode: "Setup Mode", goLiveDate: "", rollbackPlan: "", supportRoster: "", monitoringOwner: "", postLaunchRisks: "" });
  const [organizationSlide, setOrganizationSlide] = useState(0);
  const [organizationConfig, setOrganizationConfig] = useState({ organizationName: "", registrationNumber: "", organizationType: "Private", headquarters: "", organizationEmail: "", organizationPhone: "", facilityCode: "", facilityName: "", facilityType: "General Hospital", facilityLevel: "Level 4", facilityStatus: "Active", facilityAddress: "", facilityManager: "", governanceModel: "Centralized", reportingLine: "", facilityOpeningDate: "" });
  const [physicalSlide, setPhysicalSlide] = useState(0);
  const [physicalConfig, setPhysicalConfig] = useState({ buildingName: "", buildingCode: "", buildingType: "Main Clinical Building", floorCount: "", roomCount: "", floorsCatalogue: "", roomsCatalogue: "", wardCount: "", bedCount: "", licensedCapacity: "", accessibilityFeatures: "", fireSafetyCertificate: "", lastInspectionDate: "" });
  const [defaultsSlide, setDefaultsSlide] = useState(0);
  const [defaultsConfig, setDefaultsConfig] = useState({ country: "Kenya", currency: "KES", timezone: "Africa/Nairobi", language: "English", dateFormat: "DD/MM/YYYY", timeFormat: "24-hour", numberFormat: "1,234.56", weekStartsOn: "Monday", measurementSystem: "Metric" });
  const [numberingSlide, setNumberingSlide] = useState(0);
  const [numberingConfig, setNumberingConfig] = useState({ mrnPrefix: "MRN", mrnSeparator: "-", mrnSequenceLength: "6", mrnStartingNumber: "1", encounterPrefix: "ENC", invoicePrefix: "INV", receiptPrefix: "RCT", queuePrefix: "Q", claimPrefix: "CLM", referralPrefix: "REF", laboratoryPrefix: "LAB", radiologyPrefix: "RAD", resetFrequency: "Never", concurrencyPolicy: "Database sequence with collision protection" });
  const [clinicalSlide, setClinicalSlide] = useState(0);
  const [clinicalConfig, setClinicalConfig] = useState({ triageEngine: "MTS", triageColourSet: "Red, Orange, Yellow, Green, Blue", vitalSignsFrequency: "Every 4 hours", vitalSignsRequired: "Temperature, pulse, BP, respiratory rate, SpO2", earlyWarningScore: "NEWS2", earlyWarningThreshold: "Score 5 requires clinical review; score 7 is urgent", escalationPath: "Nurse in charge → clinician → medical officer", criticalAlertMethod: "In-app alert, SMS and escalation call", responseTime: "15 minutes", pharmacyBillingTrigger: "Dispensing", bedBillingTrigger: "Midnight" });
  const [masterDataSlide, setMasterDataSlide] = useState(0);
  const [masterDataConfig, setMasterDataConfig] = useState({ diagnosisDictionary: "Use Medilink Standard", diagnosisCatalogue: "Use Medilink Standard", procedureDictionary: "Use Medilink Standard", procedureCatalogue: "Use Medilink Standard", allergyDictionary: "Use Medilink Standard", allergyCatalogue: "Use Medilink Standard", laboratoryCatalogue: "Use Medilink Standard", laboratoryTests: "Use Medilink Standard", specimenCatalogue: "Use Medilink Standard", radiologyCatalogue: "Use Medilink Standard", radiologyProcedures: "Use Medilink Standard", modalityCatalogue: "Use Medilink Standard", pharmacyFormulary: "Use Medilink Standard", medicineCatalogue: "Use Medilink Standard", unitOfMeasure: "Use Medilink Standard" });
  const [documentsSlide, setDocumentsSlide] = useState(0);
  const [documentsConfig, setDocumentsConfig] = useState({ templateMode: "Use Medilink Standard", defaultPaperSize: "A4", letterheadText: "Use facility identity branding", departmentName: "Department / Service", logoPosition: "Top centre", officialSealText: "Use facility official seal", signaturePolicy: "Digital signature required", signatoryRoles: "Medical Director | Facility Manager | Finance Manager", watermarkText: "CONFIDENTIAL", watermarkOpacity: "10%", confidentialityText: "This document contains confidential patient and facility information. Unauthorised disclosure is prohibited.", footerText: "Use facility contact details and page numbering", documentNumbering: "Facility code / document type / year / sequence", templateCustomizations: "" });
  const [activationSlide, setActivationSlide] = useState(0);
  const [activationConfig, setActivationConfig] = useState({ moduleActivationMode: "Activate manually", coreModules: "Patient Registration\nOPD\nBilling", dependencyPolicy: "Block activation until dependencies are complete", dependencyOverrides: "Administrator approval required", readinessChecks: "Configuration saved\nDatabase healthy\nUsers and roles configured\nFacility identity complete", readinessThreshold: "All mandatory checks must pass", serviceGatePolicy: "Block until paid", gateExceptions: "Emergency care and administrator-approved override" });
  const [changeSlide, setChangeSlide] = useState(0);
  const [changeConfig, setChangeConfig] = useState({ configurationVersion: "1.0", effectiveDate: "", configurationOwner: "", changeApprovalMode: "Administrator approval", approvalQuorum: "One authorised approver", changeRequestRequired: "All production changes", dependencyRegister: "", dependencyCheckFrequency: "Before every activation and major change", impactAnalysis: "For all major changes", impactScope: "Clinical safety, finance, privacy, integrations and operations", emergencyChangeProcess: "Document reason, approver and retrospective review", auditRetentionDays: "2555", immutableAuditLog: "Enabled", auditReviewFrequency: "Monthly", changeRegisterLocation: "HMIS audit log" });
  const [backupSlide, setBackupSlide] = useState(0);
  const [backupConfig, setBackupConfig] = useState({ databaseBackupFrequency: "Daily", configurationBackupFrequency: "Daily", backupType: "Encrypted full backup with incremental backups", backupLocation: "Encrypted off-site storage", backupRetentionDays: "2555", backupEncryption: "AES-256 with managed key rotation", backupVerification: "Automatic checksum and restore verification", downtimeFormsReady: "Yes", downtimeProcedure: "Printed forms, manual queue and later reconciliation", downtimeContact: "", testEnvironment: "Enabled", testSchedule: "Monthly restore drill and quarterly disaster recovery test", rpoTarget: "24 hours", rtoTarget: "4 hours", recoveryContact: "", secondaryRecoveryContact: "", disasterRecoveryPlan: "", lastRecoveryTest: "" });
  const [identitySlide, setIdentitySlide] = useState(0);

  useEffect(() => {
    if (activeSection?.id !== 5 || !values.departmentsCatalogue || structureDepartments.some((row) => row.name.trim())) return;
    const departments = String(values.departmentsCatalogue).split(/\r?\n/).map((line) => line.split("|").map((part) => part.trim())).filter((parts) => parts[1]).map((parts) => ({ code: parts[0] || "", name: parts[1], type: parts[2] || "Other" }));
    const wards = String(values.wardsCatalogue || "").split(/\r?\n/).map((line) => line.split("|").map((part) => part.trim())).filter((parts) => parts[0]).map((parts) => ({ name: parts[0], type: parts[1] || "General Medical", floor: parts[3] || "", beds: [{ number: "", category: "General", rate: "", capabilities: "" }] }));
    const bedsByWard = new Map<string, StructureBed[]>();
    String(values.bedsCatalogue || "").split(/\r?\n/).forEach((line) => {
      const parts = line.split("|").map((part) => part.trim());
      if (!parts[0] || !parts[1]) return;
      const current = bedsByWard.get(parts[0].toLowerCase()) || [];
      current.push({ number: parts[1], category: parts[2] || "General", rate: parts[3] || "", capabilities: parts[4] || "" });
      bedsByWard.set(parts[0].toLowerCase(), current);
    });
    const hydratedWards = wards.map((ward) => ({ ...ward, beds: bedsByWard.get(ward.name.toLowerCase()) || ward.beds }));
    if (departments.length) setStructureDepartments(departments);
    if (hydratedWards.length) setStructureWards(hydratedWards);
    setStructureTheatres(String(values.theatresCatalogue || "").replace(/^None configured$/, ""));
    setStructureSpecialisedAreas(String(values.specialisedAreasCatalogue || "").replace(/^None configured$/, ""));
  }, [activeSection?.id, values.departmentsCatalogue, values.wardsCatalogue, values.bedsCatalogue, values.theatresCatalogue, values.specialisedAreasCatalogue, structureDepartments]);

  useEffect(() => {
    if (activeSection?.id !== 6 || !values.bankAccountsCatalogue || bankAccounts.some((account) => account.bank.trim())) return;
    const accounts = String(values.bankAccountsCatalogue).split(/\r?\n/).map((line) => line.split("|").map((part) => part.trim())).filter((parts) => parts[0] && parts[1]).map((parts) => ({ bank: parts[0], accountName: parts[1], accountNumber: parts[2] || "", accountType: parts[3] || "Operating" }));
    if (accounts.length) setBankAccounts(accounts);
    if (values.paymentMethods) setPaymentMethods(String(values.paymentMethods).split(",").map((item) => item.trim()).filter(Boolean));
    setFinancialControls((current) => ({ ...current, maxDiscount: String(values.maxDiscount || current.maxDiscount), refundThreshold: String(values.refundThreshold || current.refundThreshold), writeOffThreshold: String(values.writeOffThreshold || current.writeOffThreshold), creditLimit: String(values.creditLimit || current.creditLimit), manualChargePermission: String(values.manualChargePermission || current.manualChargePermission), manualReversalPermission: String(values.manualReversalPermission || current.manualReversalPermission) }));
    setFinancialMeta({ coaMode: String(values.coaMode || "Use Medilink Standard COA"), financialYearStart: String(values.financialYearStart || "January"), vatRegistered: String(values.vatRegistered || "No") });
  }, [activeSection?.id, values.bankAccountsCatalogue, values.paymentMethods, values.maxDiscount, values.refundThreshold, values.writeOffThreshold, values.creditLimit, values.manualChargePermission, values.manualReversalPermission, values.coaMode, values.financialYearStart, values.vatRegistered, bankAccounts]);

  useEffect(() => {
    if (activeSection?.id !== 7 || !values.servicesCatalogue || chargeItems.some((item) => item.code.trim())) return;
    const items = String(values.servicesCatalogue).split(/\r?\n/).map((line) => line.split("|").map((part) => part.trim())).filter((parts) => parts[0] && parts[1]).map((parts) => ({ code: parts[0], name: parts[1], category: parts[2] || "Other", department: parts[3] || "", cash: parts[4] || "", insurance: parts[5] || "", corporate: parts[6] || "", trigger: parts[7] || "At service completion" }));
    if (items.length) setChargeItems(items);
    setChargeMeta((current) => ({ ...current, setupMode: String(values.chargeSetupMode || current.setupMode), labTrigger: String(values.labTrigger || current.labTrigger), radiologyTrigger: String(values.radiologyTrigger || current.radiologyTrigger), drugPricing: String(values.drugPricing || current.drugPricing), packages: String(values.packagesCatalogue || current.packages) }));
  }, [activeSection?.id, values.servicesCatalogue, values.chargeSetupMode, values.labTrigger, values.radiologyTrigger, values.drugPricing, values.packagesCatalogue, chargeItems]);

  useEffect(() => {
    if (activeSection?.id !== 8 || !values.insurersCatalogue || insurers.some((insurer) => insurer.name.trim())) return;
    const rows = String(values.insurersCatalogue).split(/\r?\n/).map((line) => line.split("|").map((part) => part.trim())).filter((parts) => parts[0] && parts[1]).map((parts) => ({ name: parts[0], code: parts[1], type: parts[2] || "Private Insurance", providerNumber: parts[3] || "", claimsContact: parts[4] || "", preauthContact: parts[5] || "", status: parts[6] || "Active" }));
    if (rows.length) setInsurers(rows);
    setInsuranceMeta((current) => ({ ...current, claimsMethod: String(values.claimsMethod || current.claimsMethod), preauthRequired: String(values.preauthRequired || current.preauthRequired), tariffMode: String(values.tariffMode || current.tariffMode), apiBase: String(values.insuranceApiBase || current.apiBase), apiKey: String(values.insuranceApiKey || current.apiKey), apiSecret: String(values.insuranceApiSecret || current.apiSecret), environment: String(values.integrationEnvironment || current.environment), copayPolicy: String(values.copayPolicy || current.copayPolicy), benefitLimits: String(values.benefitLimits || current.benefitLimits), claimTurnaround: String(values.claimTurnaround || current.claimTurnaround), documents: String(values.insuranceDocuments || current.documents) }));
  }, [activeSection?.id, values.insurersCatalogue, values.claimsMethod, values.preauthRequired, values.tariffMode, values.insuranceApiBase, values.insuranceApiKey, values.insuranceApiSecret, values.integrationEnvironment, values.copayPolicy, values.benefitLimits, values.claimTurnaround, values.insuranceDocuments, insurers]);

  useEffect(() => {
    if (activeSection?.id !== 9 || !values.staffCatalogue || setupStaff.some((member) => member.name.trim())) return;
    const staffRows = String(values.staffCatalogue).split(/\r?\n/).map((line) => line.split("|").map((part) => part.trim())).filter((parts) => parts[0] && parts[1]).map((parts) => ({ name: parts[0], staffId: parts[1], department: parts[2] || "", jobTitle: parts[3] || "", email: parts[4] || "", password: parts.length >= 7 ? (parts[5] || "") : "", role: parts.length >= 7 ? (parts[6] || "Receptionist") : (parts[5] || "Receptionist") }));
    const savedRoles = String(values.rolesCatalogue || "").split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
    if (staffRows.length) setSetupStaff(staffRows);
    if (savedRoles.length) setSetupRoles(savedRoles);
    setStaffAdmin((current) => ({ ...current, mode: String(values.staffMode || current.mode), name: String(values.adminName || current.name), email: String(values.adminEmail || current.email), rolesReviewed: String(values.standardRolesReviewed || current.rolesReviewed), mfaPolicy: String(values.mfaPolicy || current.mfaPolicy), ipRestriction: String(values.ipRestriction || current.ipRestriction) }));
    setStaffSecurity((current) => ({ ...current, passwordMinimum: String(values.passwordMinimum || current.passwordMinimum), passwordComplexity: String(values.passwordComplexity || current.passwordComplexity), passwordHistory: String(values.passwordHistory || current.passwordHistory), sessionPolicy: String(values.sessionPolicy || current.sessionPolicy), loginHours: String(values.loginHours || current.loginHours), breakGlass: String(values.breakGlass || current.breakGlass) }));
  }, [activeSection?.id, values.staffCatalogue, values.rolesCatalogue, values.staffMode, values.adminName, values.adminEmail, values.standardRolesReviewed, values.mfaPolicy, values.ipRestriction, values.passwordMinimum, values.passwordComplexity, values.passwordHistory, values.sessionPolicy, values.loginHours, values.breakGlass, setupStaff]);

  useEffect(() => {
    if (activeSection?.id !== 10 || values.smsProvider === undefined) return;
    setNotificationConfig((current) => ({ ...current, ...Object.fromEntries(Object.keys(current).map((key) => [key, String(values[key] ?? current[key as keyof typeof current])])) }));
  }, [activeSection?.id, values]);

  useEffect(() => {
    if (activeSection?.id !== 22 || values.databaseBackupFrequency === undefined) return;
    setBackupConfig((current) => ({ ...current, ...Object.fromEntries(Object.keys(current).map((key) => [key, String(values[key] ?? current[key as keyof typeof current])])) }));
  }, [activeSection?.id, values]);

  useEffect(() => {
    if (activeSection?.id !== 21 || values.configurationVersion === undefined) return;
    setChangeConfig((current) => ({ ...current, ...Object.fromEntries(Object.keys(current).map((key) => [key, String(values[key] ?? current[key as keyof typeof current])])) }));
  }, [activeSection?.id, values]);

  useEffect(() => {
    if (activeSection?.id !== 20 || values.moduleActivationMode === undefined) return;
    setActivationConfig((current) => ({ ...current, ...Object.fromEntries(Object.keys(current).map((key) => [key, String(values[key] ?? current[key as keyof typeof current])])) }));
  }, [activeSection?.id, values]);

  useEffect(() => {
    if (activeSection?.id !== 19 || values.templateMode === undefined) return;
    setDocumentsConfig((current) => ({ ...current, ...Object.fromEntries(Object.keys(current).map((key) => [key, String(values[key] ?? current[key as keyof typeof current])])) }));
  }, [activeSection?.id, values]);

  useEffect(() => {
    if (activeSection?.id !== 18 || values.diagnosisDictionary === undefined) return;
    setMasterDataConfig((current) => ({ ...current, ...Object.fromEntries(Object.keys(current).map((key) => { const saved = String(values[key] ?? "").trim(); return [key, saved || (key !== "unitOfMeasure" && key !== "diagnosisDictionary" && key !== "procedureDictionary" && key !== "allergyDictionary" && key !== "laboratoryCatalogue" && key !== "radiologyCatalogue" && key !== "pharmacyFormulary" ? "Use Medilink Standard" : current[key as keyof typeof current])]; })) }));
  }, [activeSection?.id, values]);

  useEffect(() => {
    if (activeSection?.id !== 17 || values.triageEngine === undefined) return;
    setClinicalConfig((current) => ({ ...current, ...Object.fromEntries(Object.keys(current).map((key) => [key, String(values[key] ?? current[key as keyof typeof current])])) }));
  }, [activeSection?.id, values]);

  useEffect(() => {
    if (activeSection?.id !== 16 || values.mrnPrefix === undefined) return;
    setNumberingConfig((current) => ({ ...current, ...Object.fromEntries(Object.keys(current).map((key) => [key, String(values[key] ?? current[key as keyof typeof current])])) }));
  }, [activeSection?.id, values]);

  useEffect(() => {
    if (activeSection?.id !== 15 || values.country === undefined) return;
    setDefaultsConfig((current) => ({ ...current, ...Object.fromEntries(Object.keys(current).map((key) => [key, String(values[key] ?? current[key as keyof typeof current])])) }));
  }, [activeSection?.id, values]);

  useEffect(() => {
    if (activeSection?.id !== 14 || values.buildingName === undefined) return;
    setPhysicalConfig((current) => ({ ...current, ...Object.fromEntries(Object.keys(current).map((key) => [key, String(values[key] ?? current[key as keyof typeof current])])) }));
  }, [activeSection?.id, values]);

  useEffect(() => {
    if (activeSection?.id !== 13 || values.organizationName === undefined) return;
    setOrganizationConfig((current) => ({ ...current, ...Object.fromEntries(Object.keys(current).map((key) => [key, String(values[key] ?? current[key as keyof typeof current])])) }));
  }, [activeSection?.id, values]);

  useEffect(() => {
    if (activeSection?.id !== 12 || values.ceoSignoff === undefined) return;
    setReadinessConfig((current) => ({ ...current, ...Object.fromEntries(Object.keys(current).map((key) => [key, String(values[key] ?? current[key as keyof typeof current])])) }));
  }, [activeSection?.id, values]);

  useEffect(() => {
    if (activeSection?.id !== 11 || values.mpesaEnvironment === undefined) return;
    setIntegrationConfig((current) => ({ ...current, ...Object.fromEntries(Object.keys(current).map((key) => [key, String(values[key] ?? current[key as keyof typeof current])])) }));
  }, [activeSection?.id, values]);

  useEffect(() => {
    let mounted = true;
    const loadSavedSetup = async () => {
      const localFirstSetupValues = mapFirstSetupToFullSetup(parseFirstSetupCache());
      let backendFirstSetupValues: Record<string, string> = {};
      try {
        const snapshot = await api.get("/facilities/current/setup-snapshot");
        backendFirstSetupValues = normalizePrefill({
          ...(snapshot.data?.fullSetupPrefill || {}),
          ...(snapshot.data?.fullSetupValues || {}),
        });
      } catch {
        backendFirstSetupValues = {};
      }
      const firstSetupValues = { ...localFirstSetupValues, ...backendFirstSetupValues };
      if (mounted && Object.keys(firstSetupValues).length > 0) {
        setValues((current) => ({ ...current, ...firstSetupValues }));
        setLockedFirstSetupFields(
          Object.fromEntries(Object.keys(firstSetupValues).map((field) => [field, true])),
        );
      }
      try {
        const response = await api.get("/module-actions", {
          params: { module: "full-system-setup", limit: 500 },
        });
        if (!mounted || !Array.isArray(response.data)) return;
        const merged: Record<string, string> = {};
        [...response.data].reverse().forEach((record: any) => {
          const data =
            record?.payload?.data && typeof record.payload.data === "object"
              ? record.payload.data
              : {};
          Object.entries(data).forEach(([key, value]) => {
            if (typeof value === "string") merged[key] = value;
          });
        });
        if (Object.keys(merged).length > 0) {
          // Organization settings are the authoritative source after a save;
          // module-action history is only a fallback for older installations.
          const fallbackValues = Object.fromEntries(
            Object.entries(merged).filter(([key]) => !(key in backendFirstSetupValues)),
          );
          setValues((current) => ({ ...current, ...fallbackValues }));
          setLockedFirstSetupFields((current) => {
            const next = { ...current };
            Object.keys(fallbackValues).forEach((field) => {
              delete next[field];
            });
            return next;
          });
        }
      } catch {
        // Setup can still be filled before any section has been saved.
      }
    };
    void loadSavedSetup();
    return () => {
      mounted = false;
    };
  }, []);

  const sectionProgress = useMemo(() => {
    const progress = new Map<number, number>();
    setupSections.forEach((section) => {
      const required = section.fields.filter((field) => field.required);
      const complete = required.filter((field) => String(values[field.name] || "").trim()).length;
      progress.set(section.id, required.length ? Math.round((complete / required.length) * 100) : 100);
    });
    return progress;
  }, [values]);

  const totalProgress = useMemo(() => {
    const total = setupSections.reduce((sum, section) => sum + (sectionProgress.get(section.id) || 0), 0);
    return Math.round(total / setupSections.length);
  }, [sectionProgress]);

  const blockers = setupSections.filter((section) => section.mandatory && (sectionProgress.get(section.id) || 0) < 100);
  const ready = blockers.length === 0;
  const hospitalName = values.legalName || "Hospital not named";
  const ActiveIcon = activeSection?.icon || Settings2;

  const setField = (field: string, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
  };

  const validateAllSetup = async () => {
    setValidating(true);
    try {
      const response = await api.get("/module-actions/full-system-setup/summary");
      const blockers = Array.isArray(response.data?.blockers) ? response.data.blockers : [];
      if (!blockers.length && response.data?.ready) {
        setNotice("Full System Setup passed the server readiness checks and is eligible for go-live review.");
      } else {
        const first = blockers[0];
        setNotice(`${blockers.length} server readiness blocker${blockers.length === 1 ? "" : "s"} remain${blockers.length === 1 ? "s" : ""}${first?.section ? ` — ${first.section}` : ""}${first?.field ? `: ${first.field}` : ""}.`);
      }
    } catch (error: any) {
      setNotice(String(error?.response?.data?.message || "Unable to run the server readiness check."));
    } finally {
      setValidating(false);
    }
  };

  const runReadiness = async () => {
    setGoLiveBusy(true);
    try {
      const response = await api.post("/module-actions/full-system-setup/readiness/run");
      setNotice(`Readiness run complete: ${response.data?.score ?? 0}% — ${response.data?.blockers?.length || 0} blocker(s), ${response.data?.warnings?.length || 0} warning(s).`);
    } catch (error: any) {
      setNotice(String(error?.response?.data?.message || "Unable to run readiness checks."));
    } finally {
      setGoLiveBusy(false);
    }
  };

  const recordSignoff = async (role: "CEO" | "IMPLEMENTATION_ENGINEER") => {
    setGoLiveBusy(true);
    try {
      const response = await api.post("/module-actions/full-system-setup/signoff", { role });
      setNotice(`${role === "CEO" ? "Hospital administration" : "Implementation engineer"} sign-off recorded. State: ${response.data?.state || "READY_FOR_SIGNOFF"}.`);
    } catch (error: any) {
      setNotice(String(error?.response?.data?.message || "Sign-off could not be recorded."));
    } finally {
      setGoLiveBusy(false);
    }
  };

  const activateFacility = async () => {
    setGoLiveBusy(true);
    try {
      const response = await api.post("/module-actions/full-system-setup/activate", { environment: "production" });
      setNotice(`Facility activated. Go-live certificate: ${response.data?.certificate?.certificateId || "generated"}.`);
    } catch (error: any) {
      setNotice(String(error?.response?.data?.message || "Activation is blocked until all readiness requirements pass."));
    } finally {
      setGoLiveBusy(false);
    }
  };

  const unlockFirstSetupField = (field: string) => {
    setLockedFirstSetupFields((current) => {
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const submitSection = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!activeSection) return;
    let sectionData = activeSection.fields.reduce<Record<string, string>>((acc, field) => {
      acc[field.name] = values[field.name] || "";
      return acc;
    }, {});
    if (activeSection.id === 1) {
      sectionData = {
        legalName: values.legalName || "",
        shortName: values.shortName || "",
        tradingName: values.tradingName || values.shortName || values.legalName || "",
        previousNames: values.previousNames || "None",
        primaryLogo: values.primaryLogo || "",
        officialSeal: values.officialSeal || "Not provided",
        tagline: values.tagline || "",
        primaryColor: values.primaryColor || "#2563eb",
        secondaryColor: values.secondaryColor || "#0f172a",
      };
      if (!sectionData.legalName || !sectionData.shortName || !sectionData.primaryLogo) {
        setNotice("Complete the legal name, short name and primary hospital logo before saving.");
        return;
      }
      setValues((current) => ({ ...current, ...sectionData }));
    }
    if (activeSection.id === 5) {
      if (!structureDepartments.some((row) => row.name.trim())) {
        setNotice("Add at least one department before saving.");
        return;
      }
      if (!structureWards.some((row) => row.name.trim())) {
        setNotice("Add at least one ward before saving.");
        return;
      }
      if (structureWards.some((row) => row.name.trim() && !row.beds.some((bed) => bed.number.trim()))) {
        setNotice("Every ward must have at least one bed.");
        return;
      }
      sectionData = {
        departmentsCatalogue: structureDepartments.filter((row) => row.name.trim()).map((row) => `${row.code} | ${row.name} | ${row.type}`).join("\n"),
        wardsCatalogue: structureWards.filter((row) => row.name.trim()).map((row) => `${row.name} | ${row.type} | ${row.beds.length} | ${row.floor}`).join("\n"),
        bedsCatalogue: structureWards.filter((row) => row.name.trim()).flatMap((ward) => ward.beds.filter((bed) => bed.number.trim()).map((bed) => `${ward.name} | ${bed.number} | ${bed.category} | ${bed.rate || "0"} | ${bed.capabilities}`)).join("\n"),
        theatresCatalogue: structureTheatres.trim() || "None configured",
        specialisedAreasCatalogue: structureSpecialisedAreas.trim() || "None configured",
        departmentOperatingHours: "Configured per department",
        wardPolicies: "Configured per ward",
        bedCapabilities: "Configured per bed",
      };
    }
    if (activeSection.id === 6) {
      if (bankAccounts.some((account) => !account.bank.trim() || !account.accountName.trim() || !account.accountNumber.trim())) {
        setNotice("Complete every bank account before saving.");
        return;
      }
      if (!paymentMethods.length || Object.entries(financialControls).some(([, value]) => !String(value).trim())) {
        setNotice("Select at least one payment method and complete all financial controls.");
        return;
      }
      sectionData = {
        bankName: bankAccounts[0]?.bank || "",
        accountName: bankAccounts[0]?.accountName || "",
        accountNumber: bankAccounts[0]?.accountNumber || "",
        mpesaPaybill: values.mpesaPaybill || "Configured in payment methods",
        coaMode: financialMeta.coaMode,
        financialYearStart: financialMeta.financialYearStart,
        vatRegistered: financialMeta.vatRegistered,
        bankAccountsCatalogue: bankAccounts.map((account) => `${account.bank} | ${account.accountName} | ${account.accountNumber} | ${account.accountType}`).join("\n"),
        paymentMethods: paymentMethods.join(", "),
        maxDiscount: financialControls.maxDiscount,
        refundThreshold: financialControls.refundThreshold,
        writeOffThreshold: financialControls.writeOffThreshold,
        creditLimit: financialControls.creditLimit,
        manualChargePermission: financialControls.manualChargePermission,
        manualReversalPermission: financialControls.manualReversalPermission,
      };
    }
    if (activeSection.id === 7) {
      if (chargeItems.some((item) => !item.code.trim() || !item.name.trim() || !item.cash.trim() || !item.insurance.trim() || !item.corporate.trim())) {
        setNotice("Complete every charge master service before saving.");
        return;
      }
      sectionData = {
        chargeSetupMode: chargeMeta.setupMode,
        opdNewFee: chargeItems[0]?.cash || "0",
        emergencyFee: chargeItems.find((item) => item.category.toLowerCase().includes("emergency"))?.cash || chargeItems[0]?.cash || "0",
        labTrigger: chargeMeta.labTrigger,
        radiologyTrigger: chargeMeta.radiologyTrigger,
        drugPricing: chargeMeta.drugPricing || "Configured in formulary",
        servicesCatalogue: chargeItems.map((item) => `${item.code} | ${item.name} | ${item.category} | ${item.department} | ${item.cash} | ${item.insurance} | ${item.corporate} | ${item.trigger}`).join("\n"),
        packagesCatalogue: chargeMeta.packages || "None configured",
      };
    }
    if (activeSection.id === 8) {
      if (insurers.some((insurer) => !insurer.name.trim() || !insurer.code.trim() || !insurer.providerNumber.trim() || !insurer.claimsContact.trim() || !insurer.preauthContact.trim())) {
        setNotice("Complete every insurer before saving.");
        return;
      }
      if (Object.entries(insuranceMeta).some(([, value]) => !String(value).trim())) {
        setNotice("Complete all insurance, API, claims and document fields before saving.");
        return;
      }
      sectionData = {
        schemeName: insurers[0]?.name || "",
        schemeType: insurers[0]?.type || "",
        claimsMethod: insuranceMeta.claimsMethod,
        preauthRequired: insuranceMeta.preauthRequired,
        tariffMode: insuranceMeta.tariffMode,
        insurersCatalogue: insurers.map((insurer) => `${insurer.name} | ${insurer.code} | ${insurer.type} | ${insurer.providerNumber} | ${insurer.claimsContact} | ${insurer.preauthContact} | ${insurer.status}`).join("\n"),
        insuranceApiBase: insuranceMeta.apiBase,
        insuranceApiKey: insuranceMeta.apiKey,
        insuranceApiSecret: insuranceMeta.apiSecret,
        integrationEnvironment: insuranceMeta.environment,
        copayPolicy: insuranceMeta.copayPolicy,
        benefitLimits: insuranceMeta.benefitLimits,
        claimTurnaround: insuranceMeta.claimTurnaround,
        insuranceDocuments: insuranceMeta.documents,
      };
    }
    if (activeSection.id === 9) {
      if (setupStaff.some((staff) => !staff.name.trim() || !staff.staffId.trim() || !staff.department.trim() || !staff.jobTitle.trim() || !staff.email.trim() || !staff.password.trim() || !staff.role.trim())) {
        setNotice("Complete every staff profile before saving.");
        return;
      }
      if (!setupRoles.length || setupRoles.some((role) => !role.trim()) || Object.entries(staffSecurity).some(([, value]) => !String(value).trim())) {
        setNotice("Add at least one role and complete all security policies.");
        return;
      }
      if (Object.entries(staffAdmin).some(([, value]) => !String(value).trim())) {
        setNotice("Complete the system administrator and access policy fields.");
        return;
      }
      sectionData = {
        staffMode: staffAdmin.mode,
        adminName: staffAdmin.name || setupStaff[0]?.name || "",
        adminEmail: staffAdmin.email || setupStaff[0]?.email || "",
        standardRolesReviewed: staffAdmin.rolesReviewed,
        mfaPolicy: staffAdmin.mfaPolicy,
        ipRestriction: staffAdmin.ipRestriction,
        staffCatalogue: setupStaff.map((staff) => `${staff.name} | ${staff.staffId} | ${staff.department} | ${staff.jobTitle} | ${staff.email} | ${staff.password} | ${staff.role}`).join("\n"),
        rolesCatalogue: setupRoles.join("\n"),
        passwordMinimum: staffSecurity.passwordMinimum,
        passwordComplexity: staffSecurity.passwordComplexity,
        passwordHistory: staffSecurity.passwordHistory,
        sessionPolicy: staffSecurity.sessionPolicy,
        loginHours: staffSecurity.loginHours,
        breakGlass: staffSecurity.breakGlass,
      };
    }
    if (activeSection.id === 10) {
      if (Object.entries(notificationConfig).some(([, value]) => !String(value).trim())) {
        setNotice("Complete all notification and communication fields before saving.");
        return;
      }
      sectionData = { ...notificationConfig };
    }
    if (activeSection.id === 11) {
      if (Object.entries(integrationConfig).some(([, value]) => !String(value).trim())) {
        setNotice("Complete all integration configuration fields before saving.");
        return;
      }
      sectionData = { ...integrationConfig };
    }
    if (activeSection.id === 12) {
      if (Object.entries(readinessConfig).some(([, value]) => !String(value).trim())) {
        setNotice("Complete every go-live readiness field before saving.");
        return;
      }
      sectionData = { ...readinessConfig };
    }
    if (activeSection.id === 13) {
      if (Object.entries(organizationConfig).some(([, value]) => !String(value).trim())) {
        setNotice("Complete all organization and facility fields before saving.");
        return;
      }
      sectionData = { ...organizationConfig, facilitiesCatalogue: `${organizationConfig.facilityCode} | ${organizationConfig.facilityName} | ${organizationConfig.facilityType} | ${organizationConfig.facilityLevel} | ${organizationConfig.facilityStatus} | ${organizationConfig.facilityAddress} | ${organizationConfig.facilityManager}` };
    }
    if (activeSection.id === 14) {
      if (Object.entries(physicalConfig).some(([, value]) => !String(value).trim()) || String(physicalConfig.floorsCatalogue).split(/\r?\n/).some((row) => !row.trim()) || String(physicalConfig.roomsCatalogue).split(/\r?\n/).some((row) => !row.trim())) {
        setNotice("Complete all physical structure fields before saving.");
        return;
      }
      sectionData = { ...physicalConfig };
    }
    if (activeSection.id === 15) {
      if (Object.entries(defaultsConfig).some(([, value]) => !String(value).trim())) {
        setNotice("Complete all system default fields before saving.");
        return;
      }
      sectionData = { ...defaultsConfig };
    }
    if (activeSection.id === 16) {
      if (Object.entries(numberingConfig).some(([, value]) => !String(value).trim())) {
        setNotice("Complete all numbering and identifier fields before saving.");
        return;
      }
      sectionData = { ...numberingConfig };
    }
    if (activeSection.id === 17) {
      if (Object.entries(clinicalConfig).some(([, value]) => !String(value).trim())) {
        setNotice("Complete all clinical configuration fields before saving.");
        return;
      }
      sectionData = { ...clinicalConfig };
    }
    if (activeSection.id === 18) {
      if (Object.entries(masterDataConfig).some(([, value]) => !String(value).trim())) {
        setNotice("Complete all master-data dictionary fields before saving.");
        return;
      }
      sectionData = { ...masterDataConfig };
    }
    if (activeSection.id === 19) {
      if (Object.entries(documentsConfig).some(([, value]) => !String(value).trim())) {
        setNotice("Complete all document branding, template and confidentiality fields before saving.");
        return;
      }
      sectionData = { ...documentsConfig };
    }
    if (activeSection.id === 20) {
      if (Object.entries(activationConfig).some(([, value]) => !String(value).trim())) {
        setNotice("Complete all module activation, dependency, readiness and service-gate fields before saving.");
        return;
      }
      sectionData = { ...activationConfig };
    }
    if (activeSection.id === 21) {
      if (Object.entries(changeConfig).some(([, value]) => !String(value).trim())) {
        setNotice("Complete all dependency and change-control fields before saving.");
        return;
      }
      sectionData = { ...changeConfig };
    }
    if (activeSection.id === 22) {
      if (Object.entries(backupConfig).some(([, value]) => !String(value).trim())) {
        setNotice("Complete all backup, downtime, testing and recovery fields before saving.");
        return;
      }
      sectionData = { ...backupConfig };
    }
    setSaving(true);
    try {
      const validation = await api.post("/module-actions/full-system-setup/validate", {
        section: activeSection.title,
        data: sectionData,
      });
      if (validation.data?.valid === false) {
        const fields = (validation.data?.errors || []).map((item: { field?: string; message?: string }) => item.field || item.message).filter(Boolean);
        setNotice(`Complete the setup requirements before saving: ${fields.join(", ") || "review the highlighted fields"}.`);
        return;
      }
      await api.post("/module-actions", {
        module: "full-system-setup",
        action: activeSection.title,
        data: sectionData,
        context: {
          sectionId: activeSection.id,
          title: "Full System Setup",
          progress: sectionProgress.get(activeSection.id) || 0,
        },
      });
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("hmis:facility-settings-updated", {
          detail: { section: activeSection.title, data: sectionData },
        }));
      }
      const savedSectionKey = activeSection.title.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
      setNotice(`${activeSection.title} saved successfully. Data location: Facility → Organization.settings → fullSystemSetup.sections.${savedSectionKey}. It will remain available after refresh and restart.`);
      setActiveSection(null);
    } catch (error: any) {
      setNotice(String(error?.response?.data?.message || "Failed to save setup section."));
    } finally {
      setSaving(false);
    }
  };

  const renderField = (field: SetupField) => {
    const value = values[field.name] || "";
    const lockedFromFirstSetup = Boolean(lockedFirstSetupFields[field.name]);
    const prefillNote = lockedFromFirstSetup ? (
      <em className="fss-prefill-note">Filled from first setup. Unlock only if correction is required.</em>
    ) : null;
    const unlockButton = lockedFromFirstSetup ? (
      <button type="button" className="fss-unlock-btn" onClick={() => unlockFirstSetupField(field.name)}>
        Unlock
      </button>
    ) : null;

    if (field.type === "textarea") {
      return (
        <label className={`fss-field full ${lockedFromFirstSetup ? "is-prefilled" : ""}`} key={field.name}>
          <span>{field.label}{field.required ? " *" : ""}{unlockButton}</span>
          {field.description ? <small>{field.description}</small> : null}
          {prefillNote}
          <textarea value={value} placeholder={field.placeholder} required={field.required} readOnly={lockedFromFirstSetup} onChange={(event) => setField(field.name, event.target.value)} />
        </label>
      );
    }

    if (field.type === "select") {
      return (
        <label className={`fss-field ${lockedFromFirstSetup ? "is-prefilled" : ""}`} key={field.name}>
          <span>{field.label}{field.required ? " *" : ""}{unlockButton}</span>
          {field.description ? <small>{field.description}</small> : null}
          {prefillNote}
          <select value={value} required={field.required} disabled={lockedFromFirstSetup} onChange={(event) => setField(field.name, event.target.value)}>
            <option value="">Select...</option>
            {field.options?.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </label>
      );
    }

    if (field.type === "file") {
      return (
        <label className={`fss-file-field ${lockedFromFirstSetup ? "is-prefilled" : ""}`} key={field.name}>
          <span>{field.label}{field.required ? " *" : ""}{unlockButton}</span>
          {field.description ? <small>{field.description}</small> : null}
          {prefillNote}
          <input type="file" disabled={lockedFromFirstSetup} required={field.required && !value} onChange={(event) => setField(field.name, event.target.files?.[0]?.name || "")} />
          <b>{value || "Choose file"}</b>
        </label>
      );
    }

    return (
      <label className={`fss-field ${lockedFromFirstSetup ? "is-prefilled" : ""}`} key={field.name}>
        <span>{field.label}{field.required ? " *" : ""}{unlockButton}</span>
        {field.description ? <small>{field.description}</small> : null}
        {prefillNote}
        <input
          type={field.type || "text"}
          value={value}
          placeholder={field.placeholder}
          required={field.required}
          readOnly={lockedFromFirstSetup}
          onChange={(event) => setField(field.name, event.target.value)}
        />
      </label>
    );
  };

  return (
    <div className="patients-view fss-module-view">
      <section className="pv-header">
        <div>
          <h1 className="pv-title">Full System Setup (FSS)</h1>
          <p className="pv-subtitle">
            Guided configuration for facility identity, legal readiness, operations, structure,
            pricing, insurance, users, integrations, and go-live validation.
          </p>
        </div>
        <div className="module-actions">
          <button type="button" onClick={() => setActiveSection(setupSections[0])}>
            <Settings2 size={16} />
            Continue Setup
          </button>
          <button type="button" onClick={() => setActiveSection(setupSections[11])}>
            <BadgeCheck size={16} />
            Readiness Check
          </button>
          <button type="button" onClick={validateAllSetup} disabled={validating}>
            <ClipboardCheck size={16} />
            {validating ? "Checking..." : "Validate Configuration"}
          </button>
          <button type="button" onClick={runReadiness} disabled={goLiveBusy}>
            <PlayCircle size={16} />
            Run Readiness
          </button>
          <button type="button" onClick={() => recordSignoff("CEO")} disabled={goLiveBusy}>
            <ShieldCheck size={16} />
            CEO Sign-off
          </button>
          <button type="button" onClick={() => recordSignoff("IMPLEMENTATION_ENGINEER")} disabled={goLiveBusy}>
            <BadgeCheck size={16} />
            Engineer Sign-off
          </button>
          <button type="button" onClick={activateFacility} disabled={goLiveBusy}>
            <CheckCircle2 size={16} />
            Activate Facility
          </button>
        </div>
      </section>

      {notice ? <div className="platform-notice fss-notice">{notice}</div> : null}

      <section className="fss-hero">
        <div>
          <span className="fss-eyebrow">Medilink HMIS Setup & Configuration</span>
          <h2>{hospitalName}</h2>
          <p>
            The hospital cannot process live patient data until every mandatory setup section is
            complete and the go-live authorisation is approved.
          </p>
        </div>
        <div className="fss-progress-ring" style={{ "--fss-progress": `${totalProgress * 3.6}deg` } as CSSProperties}>
          <strong>{totalProgress}%</strong>
          <span>complete</span>
        </div>
      </section>

      <section className="pv-stats fss-stat-grid">
        <article className="pv-stat-card" style={{ borderLeftColor: ready ? "#16a34a" : "#dc2626" }}>
          <p className="pv-stat-label">System Status</p>
          <strong className="pv-stat-value">{ready ? "Ready" : "Not Ready"}</strong>
        </article>
        <article className="pv-stat-card" style={{ borderLeftColor: "#f59e0b" }}>
          <p className="pv-stat-label">Mandatory Blockers</p>
          <strong className="pv-stat-value">{blockers.length}</strong>
        </article>
        <article className="pv-stat-card" style={{ borderLeftColor: "#2563eb" }}>
          <p className="pv-stat-label">Sections Complete</p>
          <strong className="pv-stat-value">{setupSections.length - blockers.length}/{setupSections.length}</strong>
        </article>
        <article className="pv-stat-card" style={{ borderLeftColor: "#7c3aed" }}>
          <p className="pv-stat-label">Mode</p>
          <strong className="pv-stat-value">{ready ? "Live Eligible" : "Setup Mode"}</strong>
        </article>
      </section>

      <section className="fss-section-grid">
        {setupSections.map((section) => {
          const progress = sectionProgress.get(section.id) || 0;
          const status = statusFor(progress);
          const StatusIcon = status.icon;
          const Icon = section.icon;
          return (
            <button
              type="button"
              className="fss-section-card"
              key={section.id}
              style={{ "--fss-accent": section.accent } as CSSProperties}
              onClick={() => setActiveSection(section)}
            >
              <div className="fss-section-top">
                <span className="fss-section-icon"><Icon size={18} /></span>
                <span className={`fss-status ${status.className}`}>
                  <StatusIcon size={14} />
                  {status.label}
                </span>
              </div>
              <div>
                <h3>{section.id}. {section.title}</h3>
                <p>{section.subtitle}</p>
              </div>
              <div className="fss-section-progress">
                <span><b style={{ width: `${progress}%` }} /></span>
                <strong>{progress}%</strong>
              </div>
              <small>{section.subsections.length} subsections</small>
            </button>
          );
        })}
      </section>

      <section className="pv-table-wrap fss-table-wrap">
        <div className="fss-table-header">
          <div>
            <h3>Setup Completion Register</h3>
            <p>Every section is audited and remains editable after go-live as configuration management.</p>
          </div>
          <span>{blockers.length} blockers</span>
        </div>
        <div className="fss-table-scroll">
          <table className="pv-table fss-table">
            <thead>
              <tr>
                <th>Section</th>
                <th>Progress</th>
                <th>Status</th>
                <th>Mandatory</th>
                <th>Next Action</th>
              </tr>
            </thead>
            <tbody>
              {setupSections.map((section) => {
                const progress = sectionProgress.get(section.id) || 0;
                const status = statusFor(progress);
                return (
                  <tr key={section.id}>
                    <td>
                      <strong>{section.title}</strong>
                      <span>{section.subsections.join(" | ")}</span>
                    </td>
                    <td>{progress}%</td>
                    <td><span className={`fss-status ${status.className}`}>{status.label}</span></td>
                    <td>{section.mandatory ? "Yes" : "No"}</td>
                    <td>
                      <button type="button" className="fss-row-action" onClick={() => setActiveSection(section)}>
                        Configure <ChevronRight size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {activeSection && (
        <div className="module-modal-backdrop" onClick={() => setActiveSection(null)}>
          <div className="module-modal fss-modal" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
            <form onSubmit={submitSection} className="fss-modal-form">
              <div className="fss-form-header" style={{ "--fss-accent": activeSection.accent } as CSSProperties}>
                <ActiveIcon size={22} />
                <div>
                  <h2>{activeSection.id}. {activeSection.title}</h2>
                  <p>{activeSection.subtitle}</p>
                </div>
              </div>
              <button type="button" className="modal-close-btn fss-modal-close" onClick={() => setActiveSection(null)} aria-label="Close setup form">
                <X size={16} />
              </button>
              <div className="fss-form-body">
              <div className="fss-subsection-strip">
                {activeSection.subsections.map((subsection) => (
                  <span key={subsection}><FileCheck2 size={14} /> {subsection}</span>
                ))}
              </div>
              {activeSection.id === 1 ? (
                <FacilityIdentitySlides slide={identitySlide} setSlide={setIdentitySlide} values={values} setValues={setValues} />
              ) : activeSection.id === 5 ? (
                <FacilityStructureSlides
                  slide={structureSlide}
                  setSlide={setStructureSlide}
                  departments={structureDepartments}
                  setDepartments={setStructureDepartments}
                  wards={structureWards}
                  setWards={setStructureWards}
                  theatres={structureTheatres}
                  setTheatres={setStructureTheatres}
                  specialisedAreas={structureSpecialisedAreas}
                  setSpecialisedAreas={setStructureSpecialisedAreas}
                />
              ) : activeSection.id === 6 ? (
                <FinancialConfigurationSlides slide={financialSlide} setSlide={setFinancialSlide} bankAccounts={bankAccounts} setBankAccounts={setBankAccounts} paymentMethods={paymentMethods} setPaymentMethods={setPaymentMethods} controls={financialControls} setControls={setFinancialControls} meta={financialMeta} setMeta={setFinancialMeta} />
              ) : activeSection.id === 7 ? (
                <ChargeMasterSlides slide={chargeSlide} setSlide={setChargeSlide} items={chargeItems} setItems={setChargeItems} meta={chargeMeta} setMeta={setChargeMeta} />
              ) : activeSection.id === 8 ? (
                <InsuranceSchemeSlides slide={insuranceSlide} setSlide={setInsuranceSlide} insurers={insurers} setInsurers={setInsurers} meta={insuranceMeta} setMeta={setInsuranceMeta} />
              ) : activeSection.id === 9 ? (
                <StaffManagementSlides slide={staffSlide} setSlide={setStaffSlide} staff={setupStaff} setStaff={setSetupStaff} roles={setupRoles} setRoles={setSetupRoles} admin={staffAdmin} setAdmin={setStaffAdmin} security={staffSecurity} setSecurity={setStaffSecurity} />
              ) : activeSection.id === 10 ? (
                <NotificationsCommsSlides slide={notificationSlide} setSlide={setNotificationSlide} config={notificationConfig} setConfig={setNotificationConfig} />
              ) : activeSection.id === 11 ? (
                <IntegrationsSlides slide={integrationSlide} setSlide={setIntegrationSlide} config={integrationConfig} setConfig={setIntegrationConfig} />
              ) : activeSection.id === 12 ? (
                <GoLiveReadinessSlides slide={readinessSlide} setSlide={setReadinessSlide} config={readinessConfig} setConfig={setReadinessConfig} />
              ) : activeSection.id === 13 ? (
                <OrganizationFacilitiesSlides slide={organizationSlide} setSlide={setOrganizationSlide} config={organizationConfig} setConfig={setOrganizationConfig} />
              ) : activeSection.id === 14 ? (
                <PhysicalStructureSlides slide={physicalSlide} setSlide={setPhysicalSlide} config={physicalConfig} setConfig={setPhysicalConfig} />
              ) : activeSection.id === 15 ? (
                <SystemDefaultsSlides slide={defaultsSlide} setSlide={setDefaultsSlide} config={defaultsConfig} setConfig={setDefaultsConfig} />
              ) : activeSection.id === 16 ? (
                <NumberingIdentifiersSlides slide={numberingSlide} setSlide={setNumberingSlide} config={numberingConfig} setConfig={setNumberingConfig} />
              ) : activeSection.id === 17 ? (
                <ClinicalConfigurationSlides slide={clinicalSlide} setSlide={setClinicalSlide} config={clinicalConfig} setConfig={setClinicalConfig} />
              ) : activeSection.id === 18 ? (
                <MasterDataSlides slide={masterDataSlide} setSlide={setMasterDataSlide} config={masterDataConfig} setConfig={setMasterDataConfig} />
              ) : activeSection.id === 19 ? (
                <DocumentsTemplatesSlides slide={documentsSlide} setSlide={setDocumentsSlide} config={documentsConfig} setConfig={setDocumentsConfig} logo={values.primaryLogo} seal={values.officialSeal} hospitalName={values.shortName || values.facilityName || values.legalName || "Hospital Name"} />
              ) : activeSection.id === 20 ? (
                <ModuleActivationSlides slide={activationSlide} setSlide={setActivationSlide} config={activationConfig} setConfig={setActivationConfig} />
              ) : activeSection.id === 21 ? (
                <DependencyChangeControlSlides slide={changeSlide} setSlide={setChangeSlide} config={changeConfig} setConfig={setChangeConfig} />
              ) : activeSection.id === 22 ? (
                <BackupTestingRecoverySlides slide={backupSlide} setSlide={setBackupSlide} config={backupConfig} setConfig={setBackupConfig} />
              ) : (
                <div className="fss-form-grid">{activeSection.fields.map(renderField)}</div>
              )}
              </div>
              <div className="fss-form-footer">
                <button type="button" className="fss-cancel-btn" onClick={() => setActiveSection(null)} disabled={saving}>
                  Cancel
                </button>
                <button type="submit" style={{ background: activeSection.accent }} disabled={saving}>
                  <CheckCircle2 size={16} />
                  {saving ? "Saving..." : `Save ${activeSection.title}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function FacilityStructureSlides({ slide, setSlide, departments, setDepartments, wards, setWards, theatres, setTheatres, specialisedAreas, setSpecialisedAreas }: any) {
  const updateDepartment = (index: number, key: keyof StructureDepartment, value: string) => setDepartments((rows: StructureDepartment[]) => rows.map((row, i) => i === index ? { ...row, [key]: value } : row));
  const updateWard = (index: number, key: keyof StructureWard, value: string) => setWards((rows: StructureWard[]) => rows.map((row, i) => i === index ? { ...row, [key]: value } : row));
  const updateBed = (wardIndex: number, bedIndex: number, key: keyof StructureBed, value: string) => setWards((rows: StructureWard[]) => rows.map((ward, i) => i !== wardIndex ? ward : { ...ward, beds: ward.beds.map((bed, j) => j === bedIndex ? { ...bed, [key]: value } : bed) }));
  return <div className="fss-structure-slides">
    <div className="fss-slide-tabs">{["Departments", "Wards & Beds", "Theatres & Specialised Areas"].map((label, index) => <button type="button" key={label} className={slide === index ? "is-active" : ""} onClick={() => setSlide(index)}><b>{index + 1}</b>{label}</button>)}</div>
    {slide === 0 ? <div className="fss-slide-card"><div className="fss-slide-heading"><div><span>Step 1 of 3</span><h3>Add Departments</h3><p>Add every department in this facility.</p></div><button type="button" onClick={() => setDepartments((rows: StructureDepartment[]) => [...rows, { code: "", name: "", type: "Clinical" }])}>+ Add Department</button></div><div className="fss-repeat-list">{departments.map((row: StructureDepartment, index: number) => <div className="fss-repeat-row" key={`department-${index}`}><input value={row.code} placeholder="Code" onChange={(event) => updateDepartment(index, "code", event.target.value)} /><input value={row.name} placeholder="Department name" onChange={(event) => updateDepartment(index, "name", event.target.value)} /><select value={row.type} onChange={(event) => updateDepartment(index, "type", event.target.value)}><option>Clinical</option><option>Diagnostic</option><option>Nursing</option><option>Pharmacy</option><option>Administration</option><option>Finance</option><option>HR</option><option>ICT</option><option>Support</option><option>Other</option></select>{departments.length > 1 ? <button type="button" className="fss-remove-row" onClick={() => setDepartments((rows: StructureDepartment[]) => rows.filter((_, i) => i !== index))}>×</button> : null}</div>)}</div></div> : null}
    {slide === 1 ? <div className="fss-slide-card"><div className="fss-slide-heading"><div><span>Step 2 of 3</span><h3>Add Wards and Beds</h3><p>Add beds directly inside each ward.</p></div><button type="button" onClick={() => setWards((rows: StructureWard[]) => [...rows, { name: "", type: "General Medical", floor: "", beds: [{ number: "", category: "General", rate: "", capabilities: "" }] }])}>+ Add Ward</button></div><div className="fss-ward-list">{wards.map((ward: StructureWard, wardIndex: number) => <article className="fss-ward-card" key={`ward-${wardIndex}`}><div className="fss-repeat-row"><input value={ward.name} placeholder="Ward name" onChange={(event) => updateWard(wardIndex, "name", event.target.value)} /><select value={ward.type} onChange={(event) => updateWard(wardIndex, "type", event.target.value)}><option>General Medical</option><option>Surgical</option><option>Paediatric</option><option>Maternity</option><option>ICU</option><option>HDU</option><option>NICU</option><option>Isolation</option></select><input value={ward.floor} placeholder="Floor" onChange={(event) => updateWard(wardIndex, "floor", event.target.value)} />{wards.length > 1 ? <button type="button" className="fss-remove-row" onClick={() => setWards((rows: StructureWard[]) => rows.filter((_, i) => i !== wardIndex))}>×</button> : null}</div><div className="fss-bed-heading"><strong>Beds in this ward</strong><button type="button" onClick={() => setWards((rows: StructureWard[]) => rows.map((item, i) => i === wardIndex ? { ...item, beds: [...item.beds, { number: "", category: "General", rate: "", capabilities: "" }] } : item))}>+ Add Bed</button></div>{ward.beds.map((bed: StructureBed, bedIndex: number) => <div className="fss-repeat-row fss-bed-row" key={`bed-${wardIndex}-${bedIndex}`}><input value={bed.number} placeholder="Bed number" onChange={(event) => updateBed(wardIndex, bedIndex, "number", event.target.value)} /><input value={bed.category} placeholder="Category" onChange={(event) => updateBed(wardIndex, bedIndex, "category", event.target.value)} /><input type="number" value={bed.rate} placeholder="Daily rate" onChange={(event) => updateBed(wardIndex, bedIndex, "rate", event.target.value)} /><input value={bed.capabilities} placeholder="Capabilities" onChange={(event) => updateBed(wardIndex, bedIndex, "capabilities", event.target.value)} />{ward.beds.length > 1 ? <button type="button" className="fss-remove-row" onClick={() => setWards((rows: StructureWard[]) => rows.map((item, i) => i === wardIndex ? { ...item, beds: item.beds.filter((_, j) => j !== bedIndex) } : item))}>×</button> : null}</div>)}</article>)}</div></div> : null}
    {slide === 2 ? <div className="fss-slide-card"><div className="fss-slide-heading"><div><span>Step 3 of 3</span><h3>Theatres and Specialised Areas</h3><p>Add one entry per line. These are optional operational areas.</p></div></div><label className="fss-slide-textarea"><span>Theatres</span><textarea value={theatres} placeholder="Main Theatre | OT-01 | Major Surgery | 1" onChange={(event) => setTheatres(event.target.value)} /></label><label className="fss-slide-textarea"><span>Specialised Areas</span><textarea value={specialisedAreas} placeholder="Dialysis Unit | Dialysis | Medicine | Active" onChange={(event) => setSpecialisedAreas(event.target.value)} /></label></div> : null}
    <div className="fss-slide-navigation"><button type="button" disabled={slide === 0} onClick={() => setSlide((value: number) => Math.max(0, value - 1))}>Previous</button><button type="button" disabled={slide === 2} onClick={() => setSlide((value: number) => Math.min(2, value + 1))}>Next</button></div>
  </div>;
}

function FacilityIdentitySlides({ slide, setSlide, values, setValues }: any) {
  const update = (key: string, value: string) => setValues((current: Record<string, string>) => ({ ...current, [key]: value }));
  const upload = (key: string, file?: File) => {
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      window.alert("This image is too large. Please choose a logo or seal smaller than 8 MB.");
      return;
    }
    if (file.type === "image/svg+xml") {
      const reader = new FileReader();
      reader.onload = () => update(key, String(reader.result || ""));
      reader.readAsDataURL(file);
      return;
    }
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);
    image.onload = () => {
      const maxDimension = 900;
      const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      const context = canvas.getContext("2d");
      if (!context) { URL.revokeObjectURL(objectUrl); return; }
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      update(key, canvas.toDataURL("image/jpeg", 0.82));
      URL.revokeObjectURL(objectUrl);
    };
    image.onerror = () => { URL.revokeObjectURL(objectUrl); window.alert("The selected image could not be read. Choose a valid PNG or JPG file."); };
    image.src = objectUrl;
  };
  return <div className="fss-structure-slides fss-identity-slides">
    <div className="fss-slide-tabs">{["Facility Names", "Branding", "Brand Identity", "Letterhead Preview"].map((label, index) => <button type="button" key={label} className={slide === index ? "is-active" : ""} onClick={() => setSlide(index)}><b>{index + 1}</b>{label}</button>)}</div>
    {slide === 0 ? <div className="fss-slide-card"><div className="fss-slide-heading"><div><span>Step 1 of 4</span><h3>Facility Names</h3><p>Enter the legal and public names used throughout the HMIS.</p></div></div><div className="fss-finance-grid"><label><span>Legal / Registered Name *</span><input required value={values.legalName || ""} onChange={(event) => update("legalName", event.target.value)} /></label><label><span>Short / Common Name *</span><input required value={values.shortName || ""} onChange={(event) => update("shortName", event.target.value)} /></label><label><span>Trading Name</span><input value={values.tradingName || ""} onChange={(event) => update("tradingName", event.target.value)} /></label></div><label className="fss-slide-textarea"><span>Previous Names</span><textarea value={values.previousNames || ""} placeholder="One previous name per line" onChange={(event) => update("previousNames", event.target.value)} /></label></div> : null}
    {slide === 1 ? <div className="fss-slide-card"><div className="fss-slide-heading"><div><span>Step 2 of 4</span><h3>Logo and Official Seal</h3><p>Upload the hospital logo and official seal for documents and reports.</p></div></div><div className="fss-finance-grid"><label className="fss-file-field"><span>Primary Hospital Logo *</span><input type="file" accept="image/png,image/jpeg,image/svg+xml" required={!values.primaryLogo} onChange={(event) => upload("primaryLogo", event.target.files?.[0])} />{values.primaryLogo ? <img className="fss-identity-thumb" src={values.primaryLogo} alt="Hospital logo preview" /> : null}</label><label className="fss-file-field"><span>Official Seal / Stamp</span><input type="file" accept="image/png,image/jpeg,image/svg+xml" onChange={(event) => upload("officialSeal", event.target.files?.[0])} />{values.officialSeal ? <img className="fss-identity-thumb" src={values.officialSeal} alt="Official seal preview" /> : null}</label></div></div> : null}
    {slide === 2 ? <div className="fss-slide-card"><div className="fss-slide-heading"><div><span>Step 3 of 4</span><h3>Brand Identity</h3><p>Set the colours and tagline used throughout the system.</p></div></div><div className="fss-finance-grid"><label><span>Tagline</span><input value={values.tagline || ""} placeholder="Your Health, Our Priority" onChange={(event) => update("tagline", event.target.value)} /></label><label><span>Primary Brand Colour *</span><input type="color" required value={values.primaryColor || "#2563eb"} onChange={(event) => update("primaryColor", event.target.value)} /></label><label><span>Secondary Brand Colour *</span><input type="color" required value={values.secondaryColor || "#0f172a"} onChange={(event) => update("secondaryColor", event.target.value)} /></label></div></div> : null}
    {slide === 3 ? <div className="fss-slide-card"><div className="fss-slide-heading"><div><span>Step 4 of 4</span><h3>Letterhead Preview</h3><p>Preview how the identity will appear on documents.</p></div></div><div className="fss-identity-preview" style={{ borderTopColor: values.primaryColor || "#2563eb" }}><img src={values.primaryLogo || ""} alt="" /> <div><h3>{values.shortName || "Hospital Name"}</h3><strong>{values.tradingName || values.legalName || "Legal facility name"}</strong><p>{values.tagline || "Facility tagline"}</p></div>{values.officialSeal ? <img src={values.officialSeal} alt="Official seal" /> : null}</div></div> : null}
    <div className="fss-slide-navigation"><button type="button" disabled={slide === 0} onClick={() => setSlide((value: number) => Math.max(0, value - 1))}>Previous</button><button type="button" disabled={slide === 3} onClick={() => setSlide((value: number) => Math.min(3, value + 1))}>Next</button></div>
  </div>;
}

function FinancialConfigurationSlides({ slide, setSlide, bankAccounts, setBankAccounts, paymentMethods, setPaymentMethods, controls, setControls, meta, setMeta }: any) {
  const updateAccount = (index: number, key: keyof BankAccountDraft, value: string) => setBankAccounts((rows: BankAccountDraft[]) => rows.map((row, i) => i === index ? { ...row, [key]: value } : row));
  const updateControl = (key: string, value: string) => setControls((current: any) => ({ ...current, [key]: value }));
  const toggleMethod = (method: string) => setPaymentMethods((current: string[]) => current.includes(method) ? current.filter((item) => item !== method) : [...current, method]);
  return <div className="fss-structure-slides">
    <div className="fss-slide-tabs">{["Bank Accounts", "Chart & Payments", "Financial Controls"].map((label, index) => <button type="button" key={label} className={slide === index ? "is-active" : ""} onClick={() => setSlide(index)}><b>{index + 1}</b>{label}</button>)}</div>
    {slide === 0 ? <div className="fss-slide-card"><div className="fss-slide-heading"><div><span>Step 1 of 3</span><h3>Bank Accounts</h3><p>Add every account used by the facility.</p></div><button type="button" onClick={() => setBankAccounts((rows: BankAccountDraft[]) => [...rows, { bank: "", accountName: "", accountNumber: "", accountType: "Operating" }])}>+ Add Account</button></div><div className="fss-repeat-list">{bankAccounts.map((account: BankAccountDraft, index: number) => <div className="fss-finance-account" key={`account-${index}`}><input value={account.bank} placeholder="Bank" onChange={(event) => updateAccount(index, "bank", event.target.value)} /><input value={account.accountName} placeholder="Account name" onChange={(event) => updateAccount(index, "accountName", event.target.value)} /><input value={account.accountNumber} placeholder="Account number" onChange={(event) => updateAccount(index, "accountNumber", event.target.value)} /><select value={account.accountType} onChange={(event) => updateAccount(index, "accountType", event.target.value)}><option>Operating</option><option>Collections</option><option>Payroll</option><option>Petty Cash</option></select>{bankAccounts.length > 1 ? <button type="button" className="fss-remove-row" onClick={() => setBankAccounts((rows: BankAccountDraft[]) => rows.filter((_, i) => i !== index))}>×</button> : null}</div>)}</div></div> : null}
    {slide === 1 ? <div className="fss-slide-card"><div className="fss-slide-heading"><div><span>Step 2 of 3</span><h3>Chart of Accounts and Payments</h3><p>Choose the chart setup and accepted payment methods.</p></div></div><div className="fss-finance-grid"><label><span>Chart of Accounts</span><select value={meta.coaMode} onChange={(event) => setMeta((current: any) => ({ ...current, coaMode: event.target.value }))}><option>Use Medilink Standard COA</option><option>Import from Excel</option><option>Manual Entry</option></select></label><label><span>Financial Year Start</span><select value={meta.financialYearStart} onChange={(event) => setMeta((current: any) => ({ ...current, financialYearStart: event.target.value }))}><option>January</option><option>July</option><option>October</option></select></label><label><span>VAT Registered</span><select value={meta.vatRegistered} onChange={(event) => setMeta((current: any) => ({ ...current, vatRegistered: event.target.value }))}><option>No</option><option>Yes</option></select></label></div><div className="fss-payment-methods"><strong>Accepted Payment Methods</strong><div>{["Cash", "MPESA", "Card", "Bank Transfer", "Cheque", "Insurance", "Corporate", "Credit", "Waiver"].map((method) => <button type="button" className={paymentMethods.includes(method) ? "is-selected" : ""} key={method} onClick={() => toggleMethod(method)}>{method}</button>)}</div></div></div> : null}
    {slide === 2 ? <div className="fss-slide-card"><div className="fss-slide-heading"><div><span>Step 3 of 3</span><h3>Financial Controls</h3><p>Set approval thresholds and permissions.</p></div></div><div className="fss-finance-grid"><label><span>Maximum Discount</span><input type="number" value={controls.maxDiscount} placeholder="KES" onChange={(event) => updateControl("maxDiscount", event.target.value)} /></label><label><span>Refund Approval Threshold</span><input type="number" value={controls.refundThreshold} placeholder="KES" onChange={(event) => updateControl("refundThreshold", event.target.value)} /></label><label><span>Write-off Approval Threshold</span><input type="number" value={controls.writeOffThreshold} placeholder="KES" onChange={(event) => updateControl("writeOffThreshold", event.target.value)} /></label><label><span>Credit Limit</span><input type="number" value={controls.creditLimit} placeholder="KES" onChange={(event) => updateControl("creditLimit", event.target.value)} /></label><label><span>Manual Charge Permission</span><select value={controls.manualChargePermission} onChange={(event) => updateControl("manualChargePermission", event.target.value)}><option>Role-based approval</option><option>Administrator approval</option><option>Disabled</option></select></label><label><span>Manual Reversal Permission</span><select value={controls.manualReversalPermission} onChange={(event) => updateControl("manualReversalPermission", event.target.value)}><option>Administrator approval</option><option>Two-person approval</option><option>Disabled</option></select></label></div></div> : null}
    <div className="fss-slide-navigation"><button type="button" disabled={slide === 0} onClick={() => setSlide((value: number) => Math.max(0, value - 1))}>Previous</button><button type="button" disabled={slide === 2} onClick={() => setSlide((value: number) => Math.min(2, value + 1))}>Next</button></div>
  </div>;
}

function ChargeMasterSlides({ slide, setSlide, items, setItems, meta, setMeta }: any) {
  const updateItem = (index: number, key: keyof ChargeItemDraft, value: string) => setItems((rows: ChargeItemDraft[]) => rows.map((row, i) => i === index ? { ...row, [key]: value } : row));
  const updateMeta = (key: string, value: string) => setMeta((current: any) => ({ ...current, [key]: value }));
  return <div className="fss-structure-slides">
    <div className="fss-slide-tabs">{["Service Catalogue", "Billing Automation", "Packages & Formulary"].map((label, index) => <button type="button" key={label} className={slide === index ? "is-active" : ""} onClick={() => setSlide(index)}><b>{index + 1}</b>{label}</button>)}</div>
    {slide === 0 ? <div className="fss-slide-card"><div className="fss-slide-heading"><div><span>Step 1 of 3</span><h3>Charge Master Services</h3><p>Add every chargeable service and its payer prices.</p></div><button type="button" onClick={() => setItems((rows: ChargeItemDraft[]) => [...rows, { code: "", name: "", category: "Consultation", department: "OPD", cash: "", insurance: "", corporate: "", trigger: "At service completion" }])}>+ Add Service</button></div><div className="fss-charge-list">{items.map((item: ChargeItemDraft, index: number) => <article className="fss-charge-card" key={`charge-${index}`}><div className="fss-finance-account"><input value={item.code} placeholder="Service code" onChange={(event) => updateItem(index, "code", event.target.value)} /><input value={item.name} placeholder="Service name" onChange={(event) => updateItem(index, "name", event.target.value)} /><input value={item.category} placeholder="Category" onChange={(event) => updateItem(index, "category", event.target.value)} /><input value={item.department} placeholder="Department" onChange={(event) => updateItem(index, "department", event.target.value)} />{items.length > 1 ? <button type="button" className="fss-remove-row" onClick={() => setItems((rows: ChargeItemDraft[]) => rows.filter((_, i) => i !== index))}>×</button> : null}</div><div className="fss-charge-prices"><input type="number" value={item.cash} placeholder="Cash price" onChange={(event) => updateItem(index, "cash", event.target.value)} /><input type="number" value={item.insurance} placeholder="Insurance price" onChange={(event) => updateItem(index, "insurance", event.target.value)} /><input type="number" value={item.corporate} placeholder="Corporate price" onChange={(event) => updateItem(index, "corporate", event.target.value)} /><select value={item.trigger} onChange={(event) => updateItem(index, "trigger", event.target.value)}><option>At order placement</option><option>At specimen collection confirmation</option><option>At service completion</option><option>At result authorisation</option><option>At dispensing</option></select></div></article>)}</div></div> : null}
    {slide === 1 ? <div className="fss-slide-card"><div className="fss-slide-heading"><div><span>Step 2 of 3</span><h3>Billing Automation</h3><p>Choose when clinical activity becomes a financial charge.</p></div></div><div className="fss-finance-grid"><label><span>Charge Master Setup</span><select value={meta.setupMode} onChange={(event) => updateMeta("setupMode", event.target.value)}><option>Manual Entry</option><option>Import Excel Template</option><option>Start from Medilink Standard Charge Master</option></select></label><label><span>Laboratory Trigger</span><select value={meta.labTrigger} onChange={(event) => updateMeta("labTrigger", event.target.value)}><option>At order placement</option><option>At specimen collection confirmation</option><option>At result authorisation</option></select></label><label><span>Radiology Trigger</span><select value={meta.radiologyTrigger} onChange={(event) => updateMeta("radiologyTrigger", event.target.value)}><option>At order placement</option><option>At image acquisition confirmation</option><option>At report authorisation</option></select></label></div></div> : null}
    {slide === 2 ? <div className="fss-slide-card"><div className="fss-slide-heading"><div><span>Step 3 of 3</span><h3>Packages and Drug Formulary</h3><p>Define packages and drug pricing rules used by billing.</p></div></div><label className="fss-slide-textarea"><span>Drug Pricing Policy</span><textarea value={meta.drugPricing} placeholder="Cash, SHA, corporate and controlled medicine pricing rules" onChange={(event) => updateMeta("drugPricing", event.target.value)} /></label><label className="fss-slide-textarea"><span>Packages</span><textarea value={meta.packages} placeholder="Package name | Included services | Cash price | Insurance price" onChange={(event) => updateMeta("packages", event.target.value)} /></label></div> : null}
    <div className="fss-slide-navigation"><button type="button" disabled={slide === 0} onClick={() => setSlide((value: number) => Math.max(0, value - 1))}>Previous</button><button type="button" disabled={slide === 2} onClick={() => setSlide((value: number) => Math.min(2, value + 1))}>Next</button></div>
  </div>;
}

function InsuranceSchemeSlides({ slide, setSlide, insurers, setInsurers, meta, setMeta }: any) {
  const updateInsurer = (index: number, key: keyof InsurerDraft, value: string) => setInsurers((rows: InsurerDraft[]) => rows.map((row, i) => i === index ? { ...row, [key]: value } : row));
  const updateMeta = (key: string, value: string) => setMeta((current: any) => ({ ...current, [key]: value }));
  return <div className="fss-structure-slides">
    <div className="fss-slide-tabs">{["Insurer Registration", "Benefits & Tariffs", "API, Claims & Documents"].map((label, index) => <button type="button" key={label} className={slide === index ? "is-active" : ""} onClick={() => setSlide(index)}><b>{index + 1}</b>{label}</button>)}</div>
    {slide === 0 ? <div className="fss-slide-card"><div className="fss-slide-heading"><div><span>Step 1 of 3</span><h3>Insurer Registration</h3><p>Add every insurer or scheme accepted by the facility.</p></div><button type="button" onClick={() => setInsurers((rows: InsurerDraft[]) => [...rows, { name: "", code: "", type: "Private Insurance", providerNumber: "", claimsContact: "", preauthContact: "", status: "Active" }])}>+ Add Insurer</button></div><div className="fss-charge-list">{insurers.map((insurer: InsurerDraft, index: number) => <article className="fss-charge-card" key={`insurer-${index}`}><div className="fss-finance-account"><input value={insurer.name} placeholder="Insurer name" onChange={(event) => updateInsurer(index, "name", event.target.value)} /><input value={insurer.code} placeholder="Insurer code" onChange={(event) => updateInsurer(index, "code", event.target.value)} /><select value={insurer.type} onChange={(event) => updateInsurer(index, "type", event.target.value)}><option>SHA</option><option>Private Insurance</option><option>Corporate Direct Billing</option><option>NGO</option><option>Government Scheme</option></select><input value={insurer.providerNumber} placeholder="Provider number" onChange={(event) => updateInsurer(index, "providerNumber", event.target.value)} />{insurers.length > 1 ? <button type="button" className="fss-remove-row" onClick={() => setInsurers((rows: InsurerDraft[]) => rows.filter((_, i) => i !== index))}>×</button> : null}</div><div className="fss-charge-prices"><input value={insurer.claimsContact} placeholder="Claims contact" onChange={(event) => updateInsurer(index, "claimsContact", event.target.value)} /><input value={insurer.preauthContact} placeholder="Pre-authorisation contact" onChange={(event) => updateInsurer(index, "preauthContact", event.target.value)} /><select value={insurer.status} onChange={(event) => updateInsurer(index, "status", event.target.value)}><option>Active</option><option>Pending</option><option>Suspended</option></select></div></article>)}</div></div> : null}
    {slide === 1 ? <div className="fss-slide-card"><div className="fss-slide-heading"><div><span>Step 2 of 3</span><h3>Benefits, Tariffs and Co-pay</h3><p>Configure benefit limits and payer charging rules.</p></div></div><div className="fss-finance-grid"><label><span>Claims Submission Method</span><select value={meta.claimsMethod} onChange={(event) => updateMeta("claimsMethod", event.target.value)}><option>Electronic via API</option><option>Email PDF</option><option>Online portal</option><option>Physical submission</option></select></label><label><span>Tariff Loading</span><select value={meta.tariffMode} onChange={(event) => updateMeta("tariffMode", event.target.value)}><option>Upload Tariff Schedule</option><option>Percentage of Cash Price</option><option>Manual Entry</option></select></label><label><span>Pre-authorisation</span><select value={meta.preauthRequired} onChange={(event) => updateMeta("preauthRequired", event.target.value)}><option>Yes</option><option>No</option></select></label></div><label className="fss-slide-textarea"><span>Benefit Limits</span><textarea value={meta.benefitLimits} placeholder="Annual, inpatient, outpatient and service-specific limits" onChange={(event) => updateMeta("benefitLimits", event.target.value)} /></label><label className="fss-slide-textarea"><span>Co-pay Policy</span><textarea value={meta.copayPolicy} placeholder="Payer co-pay rules and exemptions" onChange={(event) => updateMeta("copayPolicy", event.target.value)} /></label></div> : null}
    {slide === 2 ? <div className="fss-slide-card"><div className="fss-slide-heading"><div><span>Step 3 of 3</span><h3>API, Claims and Documents</h3><p>Configure sandbox testing, claims turnaround and supporting documents.</p></div></div><div className="fss-finance-grid"><label><span>API Base URL</span><input value={meta.apiBase} placeholder="https://api.insurer.example" onChange={(event) => updateMeta("apiBase", event.target.value)} /></label><label><span>API Key</span><input value={meta.apiKey} placeholder="API key" onChange={(event) => updateMeta("apiKey", event.target.value)} /></label><label><span>API Secret</span><input type="password" value={meta.apiSecret} placeholder="API secret" onChange={(event) => updateMeta("apiSecret", event.target.value)} /></label><label><span>Environment</span><select value={meta.environment} onChange={(event) => updateMeta("environment", event.target.value)}><option>Sandbox</option><option>Production</option></select></label><label><span>Claim Turnaround</span><input value={meta.claimTurnaround} placeholder="e.g. 30 days" onChange={(event) => updateMeta("claimTurnaround", event.target.value)} /></label></div><label className="fss-slide-textarea"><span>Required Documents</span><textarea value={meta.documents || ""} placeholder="Agreement, tariff schedule, provider certificate" onChange={(event) => updateMeta("documents", event.target.value)} /></label></div> : null}
    <div className="fss-slide-navigation"><button type="button" disabled={slide === 0} onClick={() => setSlide((value: number) => Math.max(0, value - 1))}>Previous</button><button type="button" disabled={slide === 2} onClick={() => setSlide((value: number) => Math.min(2, value + 1))}>Next</button></div>
  </div>;
}

function StaffManagementSlides({ slide, setSlide, staff, setStaff, roles, setRoles, admin, setAdmin, security, setSecurity }: any) {
  const updateStaff = (index: number, key: keyof StaffSetupDraft, value: string) => setStaff((rows: StaffSetupDraft[]) => rows.map((row, i) => i === index ? { ...row, [key]: value } : row));
  const updateAdmin = (key: string, value: string) => setAdmin((current: any) => ({ ...current, [key]: value }));
  const updateSecurity = (key: string, value: string) => setSecurity((current: any) => ({ ...current, [key]: value }));
  return <div className="fss-structure-slides">
    <div className="fss-slide-tabs">{["Staff Registration", "Roles & Permissions", "Security Policies"].map((label, index) => <button type="button" key={label} className={slide === index ? "is-active" : ""} onClick={() => setSlide(index)}><b>{index + 1}</b>{label}</button>)}</div>
    {slide === 0 ? <div className="fss-slide-card"><div className="fss-slide-heading"><div><span>Step 1 of 3</span><h3>Staff Registration</h3><p>Add staff profiles before assigning access.</p></div><button type="button" onClick={() => setStaff((rows: StaffSetupDraft[]) => [...rows, { name: "", staffId: "", department: "", jobTitle: "", email: "", password: "", role: "Receptionist" }])}>+ Add Staff</button></div><div className="fss-charge-list">{staff.map((member: StaffSetupDraft, index: number) => <article className="fss-charge-card" key={`staff-${index}`}><div className="fss-finance-account"><input value={member.name} placeholder="Full name" onChange={(event) => updateStaff(index, "name", event.target.value)} /><input value={member.staffId} placeholder="Staff ID" onChange={(event) => updateStaff(index, "staffId", event.target.value)} /><input value={member.department} placeholder="Department" onChange={(event) => updateStaff(index, "department", event.target.value)} /><input value={member.jobTitle} placeholder="Job title" onChange={(event) => updateStaff(index, "jobTitle", event.target.value)} />{staff.length > 1 ? <button type="button" className="fss-remove-row" onClick={() => setStaff((rows: StaffSetupDraft[]) => rows.filter((_, i) => i !== index))}>×</button> : null}</div><div className="fss-charge-prices"><input type="email" value={member.email} placeholder="Login email" onChange={(event) => updateStaff(index, "email", event.target.value)} /><input type="password" value={member.password} placeholder="Initial password" autoComplete="new-password" onChange={(event) => updateStaff(index, "password", event.target.value)} /><select value={member.role} onChange={(event) => updateStaff(index, "role", event.target.value)}>{roles.map((role: string) => <option key={role}>{role}</option>)}</select></div></article>)}</div></div> : null}
    {slide === 1 ? <div className="fss-slide-card"><div className="fss-slide-heading"><div><span>Step 2 of 3</span><h3>Roles and Permissions</h3><p>Add roles that can be assigned to staff accounts.</p></div><button type="button" onClick={() => setRoles((current: string[]) => [...current, "New Role"])}>+ Add Role</button></div><div className="fss-finance-grid"><label><span>System Administrator Name</span><input value={admin.name} placeholder="Full name" onChange={(event) => updateAdmin("name", event.target.value)} /></label><label><span>System Administrator Email</span><input type="email" value={admin.email} placeholder="admin@facility.org" onChange={(event) => updateAdmin("email", event.target.value)} /></label><label><span>MFA Policy</span><select value={admin.mfaPolicy} onChange={(event) => updateAdmin("mfaPolicy", event.target.value)}><option>Required for all users</option><option>High-security roles only</option><option>Optional</option></select></label><label><span>IP Restriction</span><input value={admin.ipRestriction} placeholder="Unrestricted or allowed ranges" onChange={(event) => updateAdmin("ipRestriction", event.target.value)} /></label></div><div className="fss-repeat-list">{roles.map((role: string, index: number) => <div className="fss-repeat-row fss-role-row" key={`role-${index}`}><input value={role} placeholder="Role name" onChange={(event) => setRoles((current: string[]) => current.map((item, i) => i === index ? event.target.value : item))} />{roles.length > 1 ? <button type="button" className="fss-remove-row" onClick={() => setRoles((current: string[]) => current.filter((_, i) => i !== index))}>×</button> : null}</div>)}</div></div> : null}
    {slide === 2 ? <div className="fss-slide-card"><div className="fss-slide-heading"><div><span>Step 3 of 3</span><h3>Security Policies</h3><p>Set password, session, login and break-glass rules.</p></div></div><div className="fss-finance-grid"><label><span>Minimum Password Length</span><input type="number" value={security.passwordMinimum} onChange={(event) => updateSecurity("passwordMinimum", event.target.value)} /></label><label><span>Password Complexity</span><input value={security.passwordComplexity} onChange={(event) => updateSecurity("passwordComplexity", event.target.value)} /></label><label><span>Password History Count</span><input type="number" value={security.passwordHistory} onChange={(event) => updateSecurity("passwordHistory", event.target.value)} /></label><label><span>Session Policy</span><select value={security.sessionPolicy} onChange={(event) => updateSecurity("sessionPolicy", event.target.value)}><option>One session</option><option>Two sessions</option><option>Unlimited</option></select></label><label><span>Allowed Login Hours</span><input value={security.loginHours} onChange={(event) => updateSecurity("loginHours", event.target.value)} /></label><label><span>Break-Glass Policy</span><select value={security.breakGlass} onChange={(event) => updateSecurity("breakGlass", event.target.value)}><option>Require reason and audit</option><option>Require administrator approval</option><option>Disabled</option></select></label></div></div> : null}
    <div className="fss-slide-navigation"><button type="button" disabled={slide === 0} onClick={() => setSlide((value: number) => Math.max(0, value - 1))}>Previous</button><button type="button" disabled={slide === 2} onClick={() => setSlide((value: number) => Math.min(2, value + 1))}>Next</button></div>
  </div>;
}

function NotificationsCommsSlides({ slide, setSlide, config, setConfig }: any) {
  const update = (key: string, value: string) => setConfig((current: any) => ({ ...current, [key]: value }));
  return <div className="fss-structure-slides">
    <div className="fss-slide-tabs">{["SMS & Email", "WhatsApp & Events", "Print & Templates"].map((label, index) => <button type="button" key={label} className={slide === index ? "is-active" : ""} onClick={() => setSlide(index)}><b>{index + 1}</b>{label}</button>)}</div>
    {slide === 0 ? <div className="fss-slide-card"><div className="fss-slide-heading"><div><span>Step 1 of 3</span><h3>SMS and Email Configuration</h3><p>Configure delivery providers and credentials used for patient and staff communication.</p></div></div><div className="fss-finance-grid"><label><span>SMS Provider</span><select value={config.smsProvider} onChange={(event) => update("smsProvider", event.target.value)}><option>Africa's Talking</option><option>Celcom Africa</option><option>Twilio</option></select></label><label><span>SMS Sender ID</span><input value={config.senderId} placeholder="MEDILINK" onChange={(event) => update("senderId", event.target.value)} /></label><label><span>SMS API Key</span><input value={config.smsApiKey} placeholder="SMS API key" onChange={(event) => update("smsApiKey", event.target.value)} /></label><label><span>SMS API Secret</span><input type="password" value={config.smsApiSecret} placeholder="SMS API secret" onChange={(event) => update("smsApiSecret", event.target.value)} /></label><label><span>Email Provider</span><select value={config.emailProvider} onChange={(event) => update("emailProvider", event.target.value)}><option>Brevo</option><option>Resend</option><option>Amazon SES</option><option>Custom SMTP</option></select></label><label><span>From Email</span><input type="email" value={config.fromEmail} placeholder="notifications@facility.org" onChange={(event) => update("fromEmail", event.target.value)} /></label><label><span>Reply-to Email</span><input type="email" value={config.replyTo} placeholder="support@facility.org" onChange={(event) => update("replyTo", event.target.value)} /></label><label><span>SMTP Host</span><input value={config.smtpHost} placeholder="smtp.example.com" onChange={(event) => update("smtpHost", event.target.value)} /></label><label><span>SMTP Port</span><input value={config.smtpPort} placeholder="587" onChange={(event) => update("smtpPort", event.target.value)} /></label><label><span>SMTP Username</span><input value={config.smtpUsername} placeholder="SMTP username" onChange={(event) => update("smtpUsername", event.target.value)} /></label><label><span>SMTP Password</span><input type="password" value={config.smtpPassword} placeholder="SMTP password" onChange={(event) => update("smtpPassword", event.target.value)} /></label></div></div> : null}
    {slide === 1 ? <div className="fss-slide-card"><div className="fss-slide-heading"><div><span>Step 2 of 3</span><h3>WhatsApp and Notification Events</h3><p>Choose channels and escalation rules for operational events.</p></div></div><div className="fss-finance-grid"><label><span>WhatsApp Business Number</span><input value={config.whatsappNumber} placeholder="+254 7XX XXX XXX" onChange={(event) => update("whatsappNumber", event.target.value)} /></label><label><span>WhatsApp Provider</span><select value={config.whatsappProvider} onChange={(event) => update("whatsappProvider", event.target.value)}><option>Meta WhatsApp Business</option><option>Twilio WhatsApp</option><option>Not configured yet</option></select></label><label><span>Appointment Reminder</span><select value={config.appointmentReminder} onChange={(event) => update("appointmentReminder", event.target.value)}><option>SMS and email 24 hours before</option><option>SMS 2 hours before</option><option>Email only</option><option>Disabled</option></select></label><label><span>Queue Notification</span><select value={config.queueNotification} onChange={(event) => update("queueNotification", event.target.value)}><option>SMS when token is called</option><option>Display board only</option><option>SMS and display board</option></select></label></div><label className="fss-slide-textarea"><span>Critical Lab Value Escalation</span><textarea value={config.criticalLabAlert} placeholder="Notify clinician immediately and escalate to supervisor" onChange={(event) => update("criticalLabAlert", event.target.value)} /></label></div> : null}
    {slide === 2 ? <div className="fss-slide-card"><div className="fss-slide-heading"><div><span>Step 3 of 3</span><h3>Templates, Language and Print</h3><p>Set the defaults used by generated notices and printed documents.</p></div></div><div className="fss-finance-grid"><label><span>Notification Language</span><select value={config.notificationLanguage} onChange={(event) => update("notificationLanguage", event.target.value)}><option>English</option><option>Swahili</option><option>English and Swahili</option></select></label><label><span>Default Paper Size</span><select value={config.defaultPaperSize} onChange={(event) => update("defaultPaperSize", event.target.value)}><option>A4</option><option>Letter</option></select></label></div><label className="fss-slide-textarea"><span>Message Template Guidance</span><textarea value={config.templateGuidance || "Use facility name, patient name, appointment time and support contact in every template."} onChange={(event) => update("templateGuidance", event.target.value)} /></label></div> : null}
    <div className="fss-slide-navigation"><button type="button" disabled={slide === 0} onClick={() => setSlide((value: number) => Math.max(0, value - 1))}>Previous</button><button type="button" disabled={slide === 2} onClick={() => setSlide((value: number) => Math.min(2, value + 1))}>Next</button></div>
  </div>;
}

function IntegrationsSlides({ slide, setSlide, config, setConfig }: any) {
  const update = (key: string, value: string) => setConfig((current: any) => ({ ...current, [key]: value }));
  return <div className="fss-structure-slides">
    <div className="fss-slide-tabs">{["MPESA & SHA", "KHIS / Laboratory", "PACS, Relay & App"].map((label, index) => <button type="button" key={label} className={slide === index ? "is-active" : ""} onClick={() => setSlide(index)}><b>{index + 1}</b>{label}</button>)}</div>
    {slide === 0 ? <div className="fss-slide-card"><div className="fss-slide-heading"><div><span>Step 1 of 3</span><h3>MPESA Daraja and SHA Claims</h3><p>Configure payment collection and electronic claims credentials.</p></div></div><div className="fss-finance-grid"><label><span>MPESA Environment</span><select value={config.mpesaEnvironment} onChange={(event) => update("mpesaEnvironment", event.target.value)}><option>Sandbox</option><option>Production</option></select></label><label><span>Business Short Code</span><input value={config.businessShortCode} placeholder="174379" onChange={(event) => update("businessShortCode", event.target.value)} /></label><label><span>Consumer Key</span><input value={config.mpesaConsumerKey} placeholder="Daraja consumer key" onChange={(event) => update("mpesaConsumerKey", event.target.value)} /></label><label><span>Consumer Secret</span><input type="password" value={config.mpesaConsumerSecret} placeholder="Daraja consumer secret" onChange={(event) => update("mpesaConsumerSecret", event.target.value)} /></label><label><span>Passkey</span><input type="password" value={config.mpesaPasskey} placeholder="STK passkey" onChange={(event) => update("mpesaPasskey", event.target.value)} /></label><label><span>Callback URL</span><input value={config.mpesaCallbackUrl} placeholder="https://hmis.example/api/mpesa/callback" onChange={(event) => update("mpesaCallbackUrl", event.target.value)} /></label><label><span>SHA API Base URL</span><input value={config.nhifApiBase} placeholder="https://sha-api.example" onChange={(event) => update("nhifApiBase", event.target.value)} /></label><label><span>SHA API Key</span><input value={config.nhifApiKey} placeholder="SHA API key" onChange={(event) => update("nhifApiKey", event.target.value)} /></label><label><span>SHA Facility Code</span><input value={config.nhifFacilityCode} placeholder="Facility code" onChange={(event) => update("nhifFacilityCode", event.target.value)} /></label></div></div> : null}
    {slide === 1 ? <div className="fss-slide-card"><div className="fss-slide-heading"><div><span>Step 2 of 3</span><h3>KHIS / DHIS2 and Laboratory</h3><p>Connect reporting services and analyser interfaces.</p></div></div><div className="fss-finance-grid"><label><span>KHIS / DHIS2 Server URL</span><input value={config.dhis2Server} placeholder="https://dhis.example" onChange={(event) => update("dhis2Server", event.target.value)} /></label><label><span>DHIS2 Username</span><input value={config.dhis2Username} placeholder="Integration username" onChange={(event) => update("dhis2Username", event.target.value)} /></label><label><span>DHIS2 Password</span><input type="password" value={config.dhis2Password} placeholder="Integration password" onChange={(event) => update("dhis2Password", event.target.value)} /></label><label><span>DHIS2 Organisation Unit</span><input value={config.dhis2OrgUnit} placeholder="Organisation unit ID" onChange={(event) => update("dhis2OrgUnit", event.target.value)} /></label><label><span>Laboratory Interface</span><select value={config.labInterface} onChange={(event) => update("labInterface", event.target.value)}><option>HL7 v2 over TCP/IP</option><option>ASTM</option><option>Serial RS-232</option><option>Bidirectional middleware</option><option>Not configured yet</option></select></label><label><span>Laboratory Host</span><input value={config.labHost} placeholder="10.0.0.10" onChange={(event) => update("labHost", event.target.value)} /></label><label><span>Laboratory Port</span><input value={config.labPort} placeholder="2575" onChange={(event) => update("labPort", event.target.value)} /></label><label><span>Laboratory Username</span><input value={config.labUsername} placeholder="Interface username" onChange={(event) => update("labUsername", event.target.value)} /></label><label><span>Laboratory Password</span><input type="password" value={config.labPassword} placeholder="Interface password" onChange={(event) => update("labPassword", event.target.value)} /></label></div></div> : null}
    {slide === 2 ? <div className="fss-slide-card"><div className="fss-slide-heading"><div><span>Step 3 of 3</span><h3>PACS, Medilink Relay and App API</h3><p>Configure imaging retrieval, relay connectivity and enabled app scopes.</p></div></div><div className="fss-finance-grid"><label><span>PACS Protocol</span><select value={config.pacsProtocol} onChange={(event) => update("pacsProtocol", event.target.value)}><option>WADO-RS</option><option>WADO-URI</option><option>DICOMweb</option><option>Not configured yet</option></select></label><label><span>PACS Base URL</span><input value={config.pacsBaseUrl} placeholder="https://pacs.example" onChange={(event) => update("pacsBaseUrl", event.target.value)} /></label><label><span>PACS AE Title</span><input value={config.pacsAetTitle} placeholder="MEDILINK" onChange={(event) => update("pacsAetTitle", event.target.value)} /></label><label><span>Medilink Relay URL</span><input value={config.relayUrl} placeholder="https://relay.example" onChange={(event) => update("relayUrl", event.target.value)} /></label><label><span>Relay API Key</span><input type="password" value={config.relayApiKey} placeholder="Relay API key" onChange={(event) => update("relayApiKey", event.target.value)} /></label></div><label className="fss-slide-textarea"><span>Medilink App Enabled Scopes</span><textarea value={config.appScopes} placeholder="appointments, records requests, pharmacy orders, shift postings" onChange={(event) => update("appScopes", event.target.value)} /></label></div> : null}
    <div className="fss-slide-navigation"><button type="button" disabled={slide === 0} onClick={() => setSlide((value: number) => Math.max(0, value - 1))}>Previous</button><button type="button" disabled={slide === 2} onClick={() => setSlide((value: number) => Math.min(2, value + 1))}>Next</button></div>
  </div>;
}

function GoLiveReadinessSlides({ slide, setSlide, config, setConfig }: any) {
  const update = (key: string, value: string) => setConfig((current: any) => ({ ...current, [key]: value }));
  const decision = (key: string) => <select value={config[key]} onChange={(event) => update(key, event.target.value)}><option>Pending</option><option>Approved</option><option>Passed</option><option>Failed</option><option>Not Applicable</option></select>;
  const yesNo = (key: string) => <select value={config[key]} onChange={(event) => update(key, event.target.value)}><option>No</option><option>Yes</option></select>;
  return <div className="fss-structure-slides">
    <div className="fss-slide-tabs">{["Validation Checklist", "Sign-off & Activation", "Support & Monitoring"].map((label, index) => <button type="button" key={label} className={slide === index ? "is-active" : ""} onClick={() => setSlide(index)}><b>{index + 1}</b>{label}</button>)}</div>
    {slide === 0 ? <div className="fss-slide-card"><div className="fss-slide-heading"><div><span>Step 1 of 3</span><h3>Automated Validation Checklist</h3><p>Confirm the technical, security and clinical checks before activation.</p></div></div><div className="fss-finance-grid"><label><span>Data Backup Tested</span>{yesNo("dataBackupTested")}</label><label><span>Security Review</span>{decision("securityReview")}</label><label><span>Integration Tests</span>{decision("integrationTests")}</label><label><span>Clinical User Acceptance Test</span>{decision("clinicalUat")}</label><label><span>Downtime Forms Printed</span>{yesNo("downtimeFormsPrinted")}</label><label><span>Staff Training Complete</span>{yesNo("staffTrained")}</label></div></div> : null}
    {slide === 1 ? <div className="fss-slide-card"><div className="fss-slide-heading"><div><span>Step 2 of 3</span><h3>Go-Live Authorisation</h3><p>Record accountable approvals and choose whether the facility can go live.</p></div></div><div className="fss-finance-grid"><label><span>Hospital Administration Sign-off</span>{decision("ceoSignoff")}</label><label><span>Medilink Engineer Sign-off</span>{decision("engineerSignoff")}</label><label><span>Activation Mode</span><select value={config.activationMode} onChange={(event) => update("activationMode", event.target.value)}><option>Setup Mode</option><option>Live Mode</option><option>Read-only Pilot</option></select></label><label><span>Planned Go-Live Date</span><input type="date" value={config.goLiveDate} onChange={(event) => update("goLiveDate", event.target.value)} /></label></div><label className="fss-slide-textarea"><span>Rollback Plan</span><textarea value={config.rollbackPlan} placeholder="Steps, owner and decision point for reverting to downtime operations" onChange={(event) => update("rollbackPlan", event.target.value)} /></label></div> : null}
    {slide === 2 ? <div className="fss-slide-card"><div className="fss-slide-heading"><div><span>Step 3 of 3</span><h3>Post-Go-Live Support and Monitoring</h3><p>Define who monitors the system and how open risks are handled after activation.</p></div></div><div className="fss-finance-grid"><label><span>Support Roster</span><input value={config.supportRoster} placeholder="Names, roles and contact numbers" onChange={(event) => update("supportRoster", event.target.value)} /></label><label><span>Monitoring Owner</span><input value={config.monitoringOwner} placeholder="Person or team responsible" onChange={(event) => update("monitoringOwner", event.target.value)} /></label></div><label className="fss-slide-textarea"><span>Post-Go-Live Open Items and Risks</span><textarea value={config.postLaunchRisks} placeholder="List unresolved risks, owners and target dates" onChange={(event) => update("postLaunchRisks", event.target.value)} /></label></div> : null}
    <div className="fss-slide-navigation"><button type="button" disabled={slide === 0} onClick={() => setSlide((value: number) => Math.max(0, value - 1))}>Previous</button><button type="button" disabled={slide === 2} onClick={() => setSlide((value: number) => Math.min(2, value + 1))}>Next</button></div>
  </div>;
}

function OrganizationFacilitiesSlides({ slide, setSlide, config, setConfig }: any) {
  const update = (key: string, value: string) => setConfig((current: any) => ({ ...current, [key]: value }));
  return <div className="fss-structure-slides">
    <div className="fss-slide-tabs">{["Parent Organization", "Facility Profile", "Governance"].map((label, index) => <button type="button" key={label} className={slide === index ? "is-active" : ""} onClick={() => setSlide(index)}><b>{index + 1}</b>{label}</button>)}</div>
    {slide === 0 ? <div className="fss-slide-card"><div className="fss-slide-heading"><div><span>Step 1 of 3</span><h3>Parent Organization</h3><p>Define the legal organization that owns or governs this HMIS tenant.</p></div></div><div className="fss-finance-grid"><label><span>Organization Name</span><input value={config.organizationName} placeholder="Legal organization name" onChange={(event) => update("organizationName", event.target.value)} /></label><label><span>Registration Number</span><input value={config.registrationNumber} placeholder="Company or registration number" onChange={(event) => update("registrationNumber", event.target.value)} /></label><label><span>Organization Type</span><select value={config.organizationType} onChange={(event) => update("organizationType", event.target.value)}><option>Private</option><option>Public</option><option>Faith-based</option><option>Non-governmental</option><option>Community</option></select></label><label><span>Headquarters</span><input value={config.headquarters} placeholder="Head office location" onChange={(event) => update("headquarters", event.target.value)} /></label><label><span>Organization Email</span><input type="email" value={config.organizationEmail} placeholder="admin@organization.org" onChange={(event) => update("organizationEmail", event.target.value)} /></label><label><span>Organization Phone</span><input value={config.organizationPhone} placeholder="+254..." onChange={(event) => update("organizationPhone", event.target.value)} /></label></div></div> : null}
    {slide === 1 ? <div className="fss-slide-card"><div className="fss-slide-heading"><div><span>Step 2 of 3</span><h3>Facility Profile</h3><p>Register the facility that will operate this HMIS instance.</p></div></div><div className="fss-finance-grid"><label><span>Facility Name</span><input value={config.facilityName} placeholder="Hospital or facility name" onChange={(event) => update("facilityName", event.target.value)} /></label><label><span>Facility Code</span><input value={config.facilityCode} placeholder="MFL or internal code" onChange={(event) => update("facilityCode", event.target.value)} /></label><label><span>Facility Type</span><select value={config.facilityType} onChange={(event) => update("facilityType", event.target.value)}><option>General Hospital</option><option>Specialist Hospital</option><option>Maternity Home</option><option>Diagnostic Centre</option><option>Clinic</option><option>Pharmacy</option></select></label><label><span>Facility Level</span><select value={config.facilityLevel} onChange={(event) => update("facilityLevel", event.target.value)}><option>Level 2</option><option>Level 3</option><option>Level 4</option><option>Level 5</option><option>Level 6</option></select></label><label><span>Facility Status</span><select value={config.facilityStatus} onChange={(event) => update("facilityStatus", event.target.value)}><option>Active</option><option>Suspended</option><option>Under Maintenance</option><option>Closed</option></select></label><label><span>Opening Date</span><input type="date" value={config.facilityOpeningDate} onChange={(event) => update("facilityOpeningDate", event.target.value)} /></label></div><label className="fss-slide-textarea"><span>Facility Address</span><textarea value={config.facilityAddress} placeholder="Physical address, town and county" onChange={(event) => update("facilityAddress", event.target.value)} /></label><label className="fss-slide-textarea"><span>Facility Manager</span><input value={config.facilityManager} placeholder="Name and contact of facility manager" onChange={(event) => update("facilityManager", event.target.value)} /></label></div> : null}
    {slide === 2 ? <div className="fss-slide-card"><div className="fss-slide-heading"><div><span>Step 3 of 3</span><h3>Governance and Reporting</h3><p>Set how facilities report and how decisions are managed.</p></div></div><div className="fss-finance-grid"><label><span>Governance Model</span><select value={config.governanceModel} onChange={(event) => update("governanceModel", event.target.value)}><option>Centralized</option><option>Federated</option><option>Independent Facility</option></select></label><label><span>Reporting Line</span><input value={config.reportingLine} placeholder="Board, county, group or ministry" onChange={(event) => update("reportingLine", event.target.value)} /></label></div></div> : null}
    <div className="fss-slide-navigation"><button type="button" disabled={slide === 0} onClick={() => setSlide((value: number) => Math.max(0, value - 1))}>Previous</button><button type="button" disabled={slide === 2} onClick={() => setSlide((value: number) => Math.min(2, value + 1))}>Next</button></div>
  </div>;
}

function PhysicalFloorRoomEditor({ config, update }: any) {
  const parse = (value: string, fallback: string[]) => {
    const rows = String(value || "").split(/\r?\n/).map((row) => row.trim()).filter(Boolean);
    return rows.length ? rows : fallback;
  };
  const [floors, setFloors] = useState<string[]>(() => parse(config.floorsCatalogue, ["Ground Floor | G | Reception, OPD, Pharmacy"]));
  const [rooms, setRooms] = useState<string[]>(() => parse(config.roomsCatalogue, ["Consultation Room 01 | Ground Floor | OPD | Active"]));
  const updateRows = (key: string, rows: string[], setter: (rows: string[]) => void) => { setter(rows); update(key, rows.join("\n")); };
  return <div className="fss-slide-card"><div className="fss-slide-heading"><div><span>Step 2 of 3</span><h3>Floors and Rooms</h3><p>Add each floor and room as a clear, editable record.</p></div></div><div className="fss-catalogue-editor"><div className="fss-catalogue-section"><div className="fss-catalogue-title"><strong>Floors</strong><button type="button" onClick={() => updateRows("floorsCatalogue", [...floors, ""], setFloors)}>+ Add Floor</button></div>{floors.map((row, index) => <div className="fss-catalogue-row" key={`floor-${index}`}><span>{index + 1}</span><input value={row} placeholder="Floor name | code | departments or services" onChange={(event) => updateRows("floorsCatalogue", floors.map((item, i) => i === index ? event.target.value : item), setFloors)} />{floors.length > 1 ? <button type="button" className="fss-remove-row" onClick={() => updateRows("floorsCatalogue", floors.filter((_, i) => i !== index), setFloors)}>×</button> : null}</div>)}</div><div className="fss-catalogue-section"><div className="fss-catalogue-title"><strong>Rooms</strong><button type="button" onClick={() => updateRows("roomsCatalogue", [...rooms, ""], setRooms)}>+ Add Room</button></div>{rooms.map((row, index) => <div className="fss-catalogue-row" key={`room-${index}`}><span>{index + 1}</span><input value={row} placeholder="Room name | floor | department/use | status" onChange={(event) => updateRows("roomsCatalogue", rooms.map((item, i) => i === index ? event.target.value : item), setRooms)} />{rooms.length > 1 ? <button type="button" className="fss-remove-row" onClick={() => updateRows("roomsCatalogue", rooms.filter((_, i) => i !== index), setRooms)}>×</button> : null}</div>)}</div></div><p className="fss-catalogue-help">Use the format shown in each field. You can add as many floors and rooms as the facility needs.</p></div>;
}

function PhysicalStructureSlides({ slide, setSlide, config, setConfig }: any) {
  const update = (key: string, value: string) => setConfig((current: any) => ({ ...current, [key]: value }));
  return <div className="fss-structure-slides">
    <div className="fss-slide-tabs">{["Buildings", "Floors & Rooms", "Capacity & Safety"].map((label, index) => <button type="button" key={label} className={slide === index ? "is-active" : ""} onClick={() => setSlide(index)}><b>{index + 1}</b>{label}</button>)}</div>
    {slide === 0 ? <div className="fss-slide-card"><div className="fss-slide-heading"><div><span>Step 1 of 3</span><h3>Building Registration</h3><p>Register the primary building and its physical identity.</p></div></div><div className="fss-finance-grid"><label><span>Building Name</span><input value={config.buildingName} placeholder="Main Hospital Building" onChange={(event) => update("buildingName", event.target.value)} /></label><label><span>Building Code</span><input value={config.buildingCode} placeholder="BLD-001" onChange={(event) => update("buildingCode", event.target.value)} /></label><label><span>Building Type</span><select value={config.buildingType} onChange={(event) => update("buildingType", event.target.value)}><option>Main Clinical Building</option><option>Outpatient Block</option><option>Annex</option><option>Administration Block</option><option>Diagnostic Block</option><option>Residential / Staff Block</option></select></label><label><span>Number of Floors</span><input type="number" min="1" value={config.floorCount} placeholder="e.g. 3" onChange={(event) => update("floorCount", event.target.value)} /></label><label><span>Initial Room Count</span><input type="number" min="1" value={config.roomCount} placeholder="e.g. 40" onChange={(event) => update("roomCount", event.target.value)} /></label></div></div> : null}
    {slide === 1 ? <PhysicalFloorRoomEditor config={config} update={update} /> : null}
    {slide === 2 ? <div className="fss-slide-card"><div className="fss-slide-heading"><div><span>Step 3 of 3</span><h3>Capacity, Accessibility and Safety</h3><p>Record licensed capacity and compliance information.</p></div></div><div className="fss-finance-grid"><label><span>Ward Count</span><input type="number" min="0" value={config.wardCount} placeholder="Number of wards" onChange={(event) => update("wardCount", event.target.value)} /></label><label><span>Licensed Bed Count</span><input type="number" min="0" value={config.bedCount} placeholder="Number of beds" onChange={(event) => update("bedCount", event.target.value)} /></label><label><span>Licensed Capacity</span><input value={config.licensedCapacity} placeholder="Patients or beds licensed" onChange={(event) => update("licensedCapacity", event.target.value)} /></label><label><span>Fire Safety Certificate</span><input value={config.fireSafetyCertificate} placeholder="Certificate number or status" onChange={(event) => update("fireSafetyCertificate", event.target.value)} /></label><label><span>Last Inspection Date</span><input type="date" value={config.lastInspectionDate} onChange={(event) => update("lastInspectionDate", event.target.value)} /></label></div><label className="fss-slide-textarea"><span>Accessibility Features</span><textarea value={config.accessibilityFeatures} placeholder="Ramps, lifts, accessible toilets, signage and emergency exits" onChange={(event) => update("accessibilityFeatures", event.target.value)} /></label></div> : null}
    <div className="fss-slide-navigation"><button type="button" disabled={slide === 0} onClick={() => setSlide((value: number) => Math.max(0, value - 1))}>Previous</button><button type="button" disabled={slide === 2} onClick={() => setSlide((value: number) => Math.min(2, value + 1))}>Next</button></div>
  </div>;
}

function SystemDefaultsSlides({ slide, setSlide, config, setConfig }: any) {
  const update = (key: string, value: string) => setConfig((current: any) => ({ ...current, [key]: value }));
  return <div className="fss-structure-slides">
    <div className="fss-slide-tabs">{["Regional Defaults", "Calendar & Formats", "Measurements"].map((label, index) => <button type="button" key={label} className={slide === index ? "is-active" : ""} onClick={() => setSlide(index)}><b>{index + 1}</b>{label}</button>)}</div>
    {slide === 0 ? <div className="fss-slide-card"><div className="fss-slide-heading"><div><span>Step 1 of 3</span><h3>Regional Defaults</h3><p>Set the country, currency, timezone and language used throughout the HMIS.</p></div></div><div className="fss-finance-grid"><label><span>Country</span><input value={config.country} placeholder="Kenya" onChange={(event) => update("country", event.target.value)} /></label><label><span>Currency</span><input value={config.currency} placeholder="KES" onChange={(event) => update("currency", event.target.value.toUpperCase())} /></label><label><span>Timezone</span><input value={config.timezone} placeholder="Africa/Nairobi" onChange={(event) => update("timezone", event.target.value)} /></label><label><span>Language</span><select value={config.language} onChange={(event) => update("language", event.target.value)}><option>English</option><option>Swahili</option><option>English and Swahili</option></select></label></div></div> : null}
    {slide === 1 ? <div className="fss-slide-card"><div className="fss-slide-heading"><div><span>Step 2 of 3</span><h3>Calendar and Number Formats</h3><p>These defaults control dates, times, amounts and the start of the working week.</p></div></div><div className="fss-finance-grid"><label><span>Date Format</span><select value={config.dateFormat} onChange={(event) => update("dateFormat", event.target.value)}><option>DD/MM/YYYY</option><option>MM/DD/YYYY</option><option>YYYY-MM-DD</option></select></label><label><span>Time Format</span><select value={config.timeFormat} onChange={(event) => update("timeFormat", event.target.value)}><option>24-hour</option><option>12-hour</option></select></label><label><span>Number Format</span><input value={config.numberFormat} placeholder="1,234.56" onChange={(event) => update("numberFormat", event.target.value)} /></label><label><span>Week Starts On</span><select value={config.weekStartsOn} onChange={(event) => update("weekStartsOn", event.target.value)}><option>Monday</option><option>Sunday</option></select></label></div></div> : null}
    {slide === 2 ? <div className="fss-slide-card"><div className="fss-slide-heading"><div><span>Step 3 of 3</span><h3>Measurement System</h3><p>Choose the units displayed in clinical observations, reports and operational forms.</p></div></div><div className="fss-finance-grid"><label><span>Measurement System</span><select value={config.measurementSystem} onChange={(event) => update("measurementSystem", event.target.value)}><option>Metric</option><option>Imperial</option></select></label></div><div className="fss-defaults-preview"><strong>Preview</strong><span>{config.country} · {config.currency} · {config.timezone}</span><span>{config.dateFormat} · {config.timeFormat} · {config.numberFormat}</span><span>{config.measurementSystem} units · week starts {config.weekStartsOn}</span></div></div> : null}
    <div className="fss-slide-navigation"><button type="button" disabled={slide === 0} onClick={() => setSlide((value: number) => Math.max(0, value - 1))}>Previous</button><button type="button" disabled={slide === 2} onClick={() => setSlide((value: number) => Math.min(2, value + 1))}>Next</button></div>
  </div>;
}

function NumberingIdentifiersSlides({ slide, setSlide, config, setConfig }: any) {
  const update = (key: string, value: string) => setConfig((current: any) => ({ ...current, [key]: value }));
  const prefix = (key: string, label: string, placeholder: string) => <label><span>{label}</span><input value={config[key]} placeholder={placeholder} onChange={(event) => update(key, event.target.value.toUpperCase())} /></label>;
  return <div className="fss-structure-slides fss-numbering-slides">
    <div className="fss-slide-tabs">{["Patient MRN", "Financial Sequences", "Clinical Sequences", "Concurrency"].map((label, index) => <button type="button" key={label} className={slide === index ? "is-active" : ""} onClick={() => setSlide(index)}><b>{index + 1}</b>{label}</button>)}</div>
    {slide === 0 ? <div className="fss-slide-card"><div className="fss-slide-heading"><div><span>Step 1 of 4</span><h3>Patient MRN</h3><p>Define the patient identifier format and starting sequence.</p></div></div><div className="fss-finance-grid">{prefix("mrnPrefix", "Patient MRN Prefix", "MRN")}<label><span>MRN Separator</span><input value={config.mrnSeparator} placeholder="-" onChange={(event) => update("mrnSeparator", event.target.value)} /></label><label><span>MRN Sequence Length</span><input type="number" min="3" value={config.mrnSequenceLength} onChange={(event) => update("mrnSequenceLength", event.target.value)} /></label><label><span>MRN Starting Number</span><input type="number" min="1" value={config.mrnStartingNumber} placeholder="1" onChange={(event) => update("mrnStartingNumber", event.target.value)} /></label></div></div> : null}
    {slide === 1 ? <div className="fss-slide-card"><div className="fss-slide-heading"><div><span>Step 2 of 4</span><h3>Financial Sequences</h3><p>Keep invoices, receipts, claims and queue tokens traceable.</p></div></div><div className="fss-finance-grid">{prefix("invoicePrefix", "Invoice Prefix", "INV")}{prefix("receiptPrefix", "Receipt Prefix", "RCT")}{prefix("claimPrefix", "Claim Prefix", "CLM")}{prefix("queuePrefix", "Queue Token Prefix", "Q")}</div></div> : null}
    {slide === 2 ? <div className="fss-slide-card"><div className="fss-slide-heading"><div><span>Step 3 of 4</span><h3>Clinical Sequences</h3><p>Assign prefixes to encounters, referrals, laboratory and radiology records.</p></div></div><div className="fss-finance-grid">{prefix("encounterPrefix", "Encounter Prefix", "ENC")}{prefix("referralPrefix", "Referral Prefix", "REF")}{prefix("laboratoryPrefix", "Laboratory Prefix", "LAB")}{prefix("radiologyPrefix", "Radiology Prefix", "RAD")}</div></div> : null}
    {slide === 3 ? <div className="fss-slide-card"><div className="fss-slide-heading"><div><span>Step 4 of 4</span><h3>Concurrency</h3><p>Protect sequences from duplicate numbers during simultaneous registrations.</p></div></div><div className="fss-finance-grid"><label><span>Reset Frequency</span><select value={config.resetFrequency} onChange={(event) => update("resetFrequency", event.target.value)}><option>Never</option><option>Daily</option><option>Monthly</option><option>Yearly</option></select></label><label><span>Concurrency Policy</span><select value={config.concurrencyPolicy} onChange={(event) => update("concurrencyPolicy", event.target.value)}><option>Database sequence with collision protection</option><option>Application counter with transaction lock</option><option>Manual review on collision</option></select></label></div></div> : null}
    <div className="fss-slide-navigation"><button type="button" disabled={slide === 0} onClick={() => setSlide((value: number) => Math.max(0, value - 1))}>Previous</button><button type="button" disabled={slide === 3} onClick={() => setSlide((value: number) => Math.min(3, value + 1))}>Next</button></div>
  </div>;
}

function ClinicalConfigurationSlides({ slide, setSlide, config, setConfig }: any) {
  const update = (key: string, value: string) => setConfig((current: any) => ({ ...current, [key]: value }));
  return <div className="fss-structure-slides fss-clinical-slides">
    <div className="fss-slide-tabs">{["Triage", "Vital Signs", "Early Warning", "Escalation", "Billing Triggers"].map((label, index) => <button type="button" key={label} className={slide === index ? "is-active" : ""} onClick={() => setSlide(index)}><b>{index + 1}</b>{label}</button>)}</div>
    {slide === 0 ? <div className="fss-slide-card"><div className="fss-slide-heading"><div><span>Step 1 of 5</span><h3>Triage</h3><p>Configure the clinical triage engine and colour categories used at first assessment.</p></div></div><div className="fss-finance-grid"><label><span>Triage System</span><select value={config.triageEngine} onChange={(event) => update("triageEngine", event.target.value)}><option>MTS</option><option>SATS</option><option>ESI</option><option>CTAS</option><option>Custom</option></select></label><label><span>Triage Colour Set</span><input value={config.triageColourSet} placeholder="Red, Orange, Yellow, Green, Blue" onChange={(event) => update("triageColourSet", event.target.value)} /></label></div></div> : null}
    {slide === 1 ? <div className="fss-slide-card"><div className="fss-slide-heading"><div><span>Step 2 of 5</span><h3>Vital Signs</h3><p>Set observation frequency and the required measurements for clinical encounters.</p></div></div><div className="fss-finance-grid"><label><span>Observation Frequency</span><input value={config.vitalSignsFrequency} placeholder="Every 4 hours" onChange={(event) => update("vitalSignsFrequency", event.target.value)} /></label></div><label className="fss-slide-textarea"><span>Required Vital Signs</span><textarea value={config.vitalSignsRequired} placeholder="Temperature, pulse, BP, respiratory rate, SpO2" onChange={(event) => update("vitalSignsRequired", event.target.value)} /></label></div> : null}
    {slide === 2 ? <div className="fss-slide-card"><div className="fss-slide-heading"><div><span>Step 3 of 5</span><h3>Early Warning</h3><p>Choose the scoring system and define thresholds for clinical review.</p></div></div><div className="fss-finance-grid"><label><span>Early Warning Score</span><select value={config.earlyWarningScore} onChange={(event) => update("earlyWarningScore", event.target.value)}><option>NEWS2</option><option>PEWS</option><option>MEWS</option><option>Custom</option><option>Disabled</option></select></label></div><label className="fss-slide-textarea"><span>Warning Thresholds</span><textarea value={config.earlyWarningThreshold} placeholder="Score 5 requires clinical review; score 7 is urgent" onChange={(event) => update("earlyWarningThreshold", event.target.value)} /></label></div> : null}
    {slide === 3 ? <div className="fss-slide-card"><div className="fss-slide-heading"><div><span>Step 4 of 5</span><h3>Escalation</h3><p>Define who receives alerts, how they are delivered, and the response expectation.</p></div></div><label className="fss-slide-textarea"><span>Escalation Path</span><textarea value={config.escalationPath} placeholder="Nurse in charge → clinician → medical officer" onChange={(event) => update("escalationPath", event.target.value)} /></label><div className="fss-finance-grid"><label><span>Critical Alert Method</span><input value={config.criticalAlertMethod} placeholder="In-app alert, SMS and escalation call" onChange={(event) => update("criticalAlertMethod", event.target.value)} /></label><label><span>Required Response Time</span><input value={config.responseTime} placeholder="15 minutes" onChange={(event) => update("responseTime", event.target.value)} /></label></div></div> : null}
    {slide === 4 ? <div className="fss-slide-card"><div className="fss-slide-heading"><div><span>Step 5 of 5</span><h3>Billing Triggers</h3><p>Choose when pharmacy and bed activity becomes a billable charge.</p></div></div><div className="fss-finance-grid"><label><span>Pharmacy Billing Trigger</span><select value={config.pharmacyBillingTrigger} onChange={(event) => update("pharmacyBillingTrigger", event.target.value)}><option>Prescription</option><option>Dispensing</option><option>Hybrid</option></select></label><label><span>Bed Billing Trigger</span><select value={config.bedBillingTrigger} onChange={(event) => update("bedBillingTrigger", event.target.value)}><option>Midnight</option><option>Admission day</option><option>Proportional</option></select></label></div></div> : null}
    <div className="fss-slide-navigation"><button type="button" disabled={slide === 0} onClick={() => setSlide((value: number) => Math.max(0, value - 1))}>Previous</button><button type="button" disabled={slide === 4} onClick={() => setSlide((value: number) => Math.min(4, value + 1))}>Next</button></div>
  </div>;
}

function MasterCatalogueEditor({ label, value, placeholder, onChange }: any) {
  const [rows, setRows] = useState<string[]>(() => { const source = String(value || ""); return source === "Use Medilink Standard" ? [] : source.split(/\r?\n/).filter(Boolean); });
  const sync = (next: string[]) => { setRows(next); onChange(next.length ? next.join("\n") : "Use Medilink Standard"); };
  return <div className="fss-catalogue-editor-box"><div className="fss-catalogue-title"><strong>{label}</strong><button type="button" onClick={() => sync([...rows, ""])}>+ Add Catalogue Entry</button></div>{rows ? rows.map((row, index) => <div className="fss-catalogue-entry" key={`${label}-${index}`}><span>{index + 1}</span><input required value={row} placeholder={placeholder} onChange={(event) => sync(rows.map((item, i) => i === index ? event.target.value : item))} />{rows.length > 1 ? <button type="button" className="fss-remove-row" onClick={() => sync(rows.filter((_, i) => i !== index))}>×</button> : null}</div>) : null}</div>;
}

function MasterDataSlides({ slide, setSlide, config, setConfig }: any) {
  const update = (key: string, value: string) => setConfig((current: any) => ({ ...current, [key]: value }));
  const mode = (key: string) => <select value={config[key]} onChange={(event) => update(key, event.target.value)}><option>Use Medilink Standard</option><option>Import Data</option><option>Manual Configuration</option></select>;
  return <div className="fss-structure-slides fss-master-data-slides">
    <div className="fss-slide-tabs">{["Clinical", "Laboratory", "Radiology", "Pharmacy"].map((label, index) => <button type="button" key={label} className={slide === index ? "is-active" : ""} onClick={() => setSlide(index)}><b>{index + 1}</b>{label}</button>)}</div>
    <div className="fss-catalogue-instructions"><strong>How to enter a catalogue</strong><span>Keep “Use Medilink Standard” when no custom list is needed. For manual lists, enter one record per line and separate values with <code>|</code>.</span></div>
    {slide === 0 ? <div className="fss-slide-card"><div className="fss-slide-heading"><div><span>Step 1 of 4</span><h3>Clinical Dictionaries</h3><p>Configure shared diagnoses, procedures and allergy dictionaries used by clinical modules.</p></div></div><div className="fss-finance-grid"><label><span>Diagnosis Dictionary</span>{mode("diagnosisDictionary")}</label><label><span>Procedure Dictionary</span>{mode("procedureDictionary")}</label><label><span>Allergy Dictionary</span>{mode("allergyDictionary")}</label></div><MasterCatalogueEditor label="Diagnosis Catalogue" value={config.diagnosisCatalogue} placeholder="code | name | details" onChange={(value: string) => update("diagnosisCatalogue", value)} /><MasterCatalogueEditor label="Procedure Catalogue" value={config.procedureCatalogue} placeholder="code | name | details" onChange={(value: string) => update("procedureCatalogue", value)} /><MasterCatalogueEditor label="Allergy Catalogue" value={config.allergyCatalogue} placeholder="code | name | details" onChange={(value: string) => update("allergyCatalogue", value)} /></div> : null}
    {slide === 1 ? <div className="fss-slide-card"><div className="fss-slide-heading"><div><span>Step 2 of 4</span><h3>Laboratory Dictionary</h3><p>Define laboratory test and specimen catalogues shared by orders, results and billing.</p></div></div><div className="fss-finance-grid"><label><span>Laboratory Catalogue</span>{mode("laboratoryCatalogue")}</label></div><MasterCatalogueEditor label="Laboratory Tests" value={config.laboratoryTests} placeholder="code | name | details" onChange={(value: string) => update("laboratoryTests", value)} /><MasterCatalogueEditor label="Specimen Catalogue" value={config.specimenCatalogue} placeholder="code | name | details" onChange={(value: string) => update("specimenCatalogue", value)} /></div> : null}
    {slide === 2 ? <div className="fss-slide-card"><div className="fss-slide-heading"><div><span>Step 3 of 4</span><h3>Radiology Dictionary</h3><p>Configure imaging procedures, modalities and reporting catalogue.</p></div></div><div className="fss-finance-grid"><label><span>Radiology Catalogue</span>{mode("radiologyCatalogue")}</label></div><MasterCatalogueEditor label="Radiology Procedures" value={config.radiologyProcedures} placeholder="code | name | details" onChange={(value: string) => update("radiologyProcedures", value)} /><MasterCatalogueEditor label="Modality Catalogue" value={config.modalityCatalogue} placeholder="code | name | details" onChange={(value: string) => update("modalityCatalogue", value)} /></div> : null}
    {slide === 3 ? <div className="fss-slide-card"><div className="fss-slide-heading"><div><span>Step 4 of 4</span><h3>Pharmacy Formulary</h3><p>Configure medicines, units and dispensing data shared by pharmacy and billing.</p></div></div><div className="fss-finance-grid"><label><span>Pharmacy Formulary</span>{mode("pharmacyFormulary")}</label><label><span>Unit of Measure</span><input value={config.unitOfMeasure} placeholder="code | name | details" onChange={(event) => update("unitOfMeasure", event.target.value)} /></label></div><MasterCatalogueEditor label="Medicine Catalogue" value={config.medicineCatalogue} placeholder="code | name | details" onChange={(value: string) => update("medicineCatalogue", value)} /></div> : null}
    <div className="fss-slide-navigation"><button type="button" disabled={slide === 0} onClick={() => setSlide((value: number) => Math.max(0, value - 1))}>Previous</button><button type="button" disabled={slide === 3} onClick={() => setSlide((value: number) => Math.min(3, value + 1))}>Next</button></div>
  </div>;
}

function DocumentsTemplatesSlides({ slide, setSlide, config, setConfig, logo, seal, hospitalName }: any) {
  const update = (key: string, value: string) => setConfig((current: any) => ({ ...current, [key]: value }));
  const templates = [
    { name: "Patient Registration Form", file: "patient-registration-template.txt", description: "Demographics, identifiers, contacts and consent." },
    { name: "Outpatient Consultation Note", file: "outpatient-consultation-template.txt", description: "History, examination, assessment, plan and clinician signature." },
    { name: "Prescription Form", file: "prescription-template.txt", description: "Medicine, dose, route, duration and dispensing instructions." },
    { name: "Laboratory Request Form", file: "laboratory-request-template.txt", description: "Clinical request, specimens, tests and authorisation." },
    { name: "Radiology Request Form", file: "radiology-request-template.txt", description: "Imaging request, clinical history, modality and report." },
    { name: "Invoice and Receipt", file: "invoice-receipt-template.txt", description: "Charges, payer details, totals, payment and receipt number." },
    { name: "Discharge Summary", file: "discharge-summary-template.txt", description: "Admission, diagnosis, treatment, medication and follow-up." },
  ];
  const downloadTemplate = (template: any) => { if (typeof window === "undefined") return; const content = `${template.name}\n\nFacility: {{facility_name}}\nPatient: {{patient_name}}\nDate: {{document_date}}\n\n${template.description}\n\n[Configure this template in the Documents & Templates module]\n`; const url = URL.createObjectURL(new Blob([content], { type: "text/plain;charset=utf-8" })); const anchor = document.createElement("a"); anchor.href = url; anchor.download = template.file; anchor.click(); URL.revokeObjectURL(url); };
  const printTemplate = (template: any) => { if (typeof window === "undefined") return; const custom = config.templateCustomizations || ""; const logoMarkup = logo ? `<img class="logo" src="${logo}" alt="Hospital logo" />` : ""; const sealMarkup = seal ? `<img class="seal" src="${seal}" alt="Official stamp" />` : ""; const popup = window.open("", "_blank", "width=900,height=700"); if (!popup) return; popup.document.write(`<html><head><title>${template.name}</title><style>@page{size:${config.defaultPaperSize};margin:18mm}body{font-family:Arial,sans-serif;color:#111827;line-height:1.5}header{text-align:center;border-bottom:2px solid #111827;padding-bottom:12px;margin-bottom:20px}.logo{display:block;width:140px;height:90px;object-fit:contain;margin:0 auto 8px}.seal{display:block;width:100px;height:80px;object-fit:contain;margin:26px auto 0}h1{font-size:22px;margin:0 0 5px}h2{font-size:15px;margin:0 0 4px;color:#334155}small{color:#475569}.box{border:1px solid #cbd5e1;padding:14px;margin:12px 0;min-height:90px}.identifiers{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;border:1px solid #cbd5e1;padding:10px;font-size:12px}.watermark{position:fixed;top:45%;left:20%;font-size:58px;color:rgba(100,116,139,.${String(config.watermarkOpacity).replace("%", "") || "10"});transform:rotate(-25deg);z-index:-1}footer{border-top:1px solid #cbd5e1;margin-top:30px;padding-top:8px;font-size:11px}</style></head><body><div class="watermark">${config.watermarkText}</div><header>${logoMarkup}<h1>${hospitalName}</h1><h2>${config.departmentName}</h2><small>${template.name}</small></header><div class="identifiers"><span><b>MRN:</b> {{mrn}}</span><span><b>Encounter:</b> {{encounter_number}}</span><span><b>Patient:</b> {{patient_name}}</span><span><b>Date:</b> {{document_date}}</span></div><div class="box"><b>Template purpose</b><p>${template.description}</p><p>${custom || "Add your facility-specific fields and instructions in the customisation box."}</p></div><div class="box">Document fields and clinical details</div>${sealMarkup}<footer>${config.confidentialityText}<br/>${config.footerText}</footer><script>window.onload=()=>window.print();</script></body></html>`); popup.document.close(); };
  return <div className="fss-structure-slides fss-documents-slides">
    <div className="fss-slide-tabs">{["Templates Library", "Branding & Signatures", "Confidentiality & Output"].map((label, index) => <button type="button" key={label} className={slide === index ? "is-active" : ""} onClick={() => setSlide(index)}><b>{index + 1}</b>{label}</button>)}</div>
    {slide === 0 ? <div className="fss-slide-card"><div className="fss-slide-heading"><div><span>Step 1 of 3</span><h3>Standard Template Library</h3><p>Customize a template, preview it, print it, or use the browser dialog to save it as PDF.</p></div></div><label className="fss-slide-textarea"><span>Template Customization Notes</span><textarea value={config.templateCustomizations} placeholder="Add facility-specific headings, fields, instructions or signature blocks" onChange={(event) => update("templateCustomizations", event.target.value)} /></label><div className="fss-template-library">{templates.map((template) => <article className="fss-template-card" key={template.file}><div><strong>{template.name}</strong><p>{template.description}</p></div><div className="fss-template-actions"><button type="button" onClick={() => printTemplate(template)}>Print / PDF</button><button type="button" onClick={() => downloadTemplate(template)}>Download</button></div></article>)}</div></div> : null}
    {slide === 1 ? <div className="fss-slide-card"><div className="fss-slide-heading"><div><span>Step 2 of 3</span><h3>Branding and Signatures</h3><p>Set the visual identity and signatory rules applied to generated documents.</p></div></div><div className="fss-finance-grid"><label><span>Template Setup</span><select value={config.templateMode} onChange={(event) => update("templateMode", event.target.value)}><option>Use Medilink Standard</option><option>Import Templates</option><option>Manual Configuration</option></select></label><label><span>Default Paper Size</span><select value={config.defaultPaperSize} onChange={(event) => update("defaultPaperSize", event.target.value)}><option>A4</option><option>Letter</option></select></label><label><span>Logo Position</span><select value={config.logoPosition} onChange={(event) => update("logoPosition", event.target.value)}><option>Top left</option><option>Top centre</option><option>Top right</option></select></label><label><span>Signature Policy</span><select value={config.signaturePolicy} onChange={(event) => update("signaturePolicy", event.target.value)}><option>Digital signature required</option><option>Manual signature</option><option>Role-based</option></select></label></div><label className="fss-slide-textarea"><span>Letterhead Text</span><textarea value={config.letterheadText} placeholder="Facility name | address | phone | email" onChange={(event) => update("letterheadText", event.target.value)} /></label><label className="fss-slide-textarea"><span>Official Seal / Stamp Text</span><input value={config.officialSealText} placeholder="Official facility seal or stamp identifier" onChange={(event) => update("officialSealText", event.target.value)} /></label><label className="fss-slide-textarea"><span>Authorised Signatory Roles</span><textarea value={config.signatoryRoles} placeholder="Medical Director | Facility Manager | Finance Manager" onChange={(event) => update("signatoryRoles", event.target.value)} /></label></div> : null}
    {slide === 2 ? <div className="fss-slide-card"><div className="fss-slide-heading"><div><span>Step 3 of 3</span><h3>Confidentiality and Output Defaults</h3><p>Configure privacy wording, watermarking and document numbering.</p></div></div><div className="fss-finance-grid"><label><span>Watermark Text</span><input value={config.watermarkText} placeholder="CONFIDENTIAL" onChange={(event) => update("watermarkText", event.target.value)} /></label><label><span>Watermark Opacity</span><select value={config.watermarkOpacity} onChange={(event) => update("watermarkOpacity", event.target.value)}><option>5%</option><option>10%</option><option>15%</option><option>20%</option></select></label><label><span>Document Numbering</span><input value={config.documentNumbering} placeholder="Facility code / document type / year / sequence" onChange={(event) => update("documentNumbering", event.target.value)} /></label></div><label className="fss-slide-textarea"><span>Confidentiality Text</span><textarea value={config.confidentialityText} placeholder="Confidentiality notice printed on documents" onChange={(event) => update("confidentialityText", event.target.value)} /></label><label className="fss-slide-textarea"><span>Footer Text</span><textarea value={config.footerText} placeholder="Facility contacts, emergency line and page numbering" onChange={(event) => update("footerText", event.target.value)} /></label></div> : null}
    <div className="fss-slide-navigation"><button type="button" disabled={slide === 0} onClick={() => setSlide((value: number) => Math.max(0, value - 1))}>Previous</button><button type="button" disabled={slide === 2} onClick={() => setSlide((value: number) => Math.min(2, value + 1))}>Next</button></div>
  </div>;
}

function ModuleActivationSlides({ slide, setSlide, config, setConfig }: any) {
  const update = (key: string, value: string) => setConfig((current: any) => ({ ...current, [key]: value }));
  const modules = Array.from(new Set([
    ...setupSections.map((section) => section.title),
    "Patient Registration", "OPD", "Appointments", "Triage", "Inpatient", "Nursing", "Pharmacy", "Laboratory", "Radiology", "Theatre", "Billing", "Insurance", "Inventory", "Human Resources", "Payroll", "Reports & Analytics", "Administration", "Notifications", "Mobile App", "Clinical Research", "Procurement", "Stores", "Quality & Safety", "Biomedical Engineering", "Community Health", "Telemedicine", "Ambulance & Emergency", "Mortuary", "Dietary & Catering", "Housekeeping", "Security", "Asset Management", "Audit & Compliance", "Data Warehouse", "Interoperability"]));
  const selected = String(config.coreModules || "").split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
  const toggle = (module: string) => update("coreModules", (selected.includes(module) ? selected.filter((item) => item !== module) : [...selected, module]).join("\n"));
  return <div className="fss-structure-slides fss-activation-slides">
    <div className="fss-slide-tabs">{["Active Modules", "Dependencies", "Readiness", "Service Gates"].map((label, index) => <button type="button" key={label} className={slide === index ? "is-active" : ""} onClick={() => setSlide(index)}><b>{index + 1}</b>{label}</button>)}</div>
    {slide === 0 ? <div className="fss-slide-card"><div className="fss-slide-heading"><div><span>Step 1 of 4</span><h3>Active Modules</h3><p>Select the modules this facility will activate. Dependencies are checked before activation.</p></div></div><label className="fss-finance-grid"><span>Module Activation Mode<select value={config.moduleActivationMode} onChange={(event) => update("moduleActivationMode", event.target.value)}><option>Activate manually</option><option>Use standard bundle</option><option>Activate all after validation</option></select></span></label><div className="fss-module-checklist">{modules.map((module) => <label key={module}><input type="checkbox" checked={selected.includes(module)} onChange={() => toggle(module)} /><span>{module}</span></label>)}</div></div> : null}
    {slide === 1 ? <div className="fss-slide-card"><div className="fss-slide-heading"><div><span>Step 2 of 4</span><h3>Dependencies</h3><p>Control whether incomplete configuration blocks a module from being activated.</p></div></div><div className="fss-finance-grid"><label><span>Dependency Policy</span><select value={config.dependencyPolicy} onChange={(event) => update("dependencyPolicy", event.target.value)}><option>Block activation until dependencies are complete</option><option>Warn but allow activation</option><option>Administrator override only</option></select></label><label><span>Dependency Overrides</span><input value={config.dependencyOverrides} placeholder="Who can approve an override" onChange={(event) => update("dependencyOverrides", event.target.value)} /></label></div></div> : null}
    {slide === 2 ? <div className="fss-slide-card"><div className="fss-slide-heading"><div><span>Step 3 of 4</span><h3>Readiness</h3><p>Define the checks that must pass before the system or a module goes live.</p></div></div><label className="fss-slide-textarea"><span>Readiness Checks</span><textarea value={config.readinessChecks} placeholder="Configuration saved\nDatabase healthy\nUsers and roles configured" onChange={(event) => update("readinessChecks", event.target.value)} /></label><label className="fss-slide-textarea"><span>Readiness Threshold</span><textarea value={config.readinessThreshold} placeholder="All mandatory checks must pass" onChange={(event) => update("readinessThreshold", event.target.value)} /></label></div> : null}
    {slide === 3 ? <div className="fss-slide-card"><div className="fss-slide-heading"><div><span>Step 4 of 4</span><h3>Service Gates</h3><p>Define payment and exception rules for access to activated services.</p></div></div><div className="fss-finance-grid"><label><span>Service Gate Policy</span><select value={config.serviceGatePolicy} onChange={(event) => update("serviceGatePolicy", event.target.value)}><option>Block until paid</option><option>Allow credit</option><option>Role-based override</option></select></label></div><label className="fss-slide-textarea"><span>Gate Exceptions</span><textarea value={config.gateExceptions} placeholder="Emergency care and administrator-approved override" onChange={(event) => update("gateExceptions", event.target.value)} /></label></div> : null}
    <div className="fss-slide-navigation"><button type="button" disabled={slide === 0} onClick={() => setSlide((value: number) => Math.max(0, value - 1))}>Previous</button><button type="button" disabled={slide === 3} onClick={() => setSlide((value: number) => Math.min(3, value + 1))}>Next</button></div>
  </div>;
}

function DependencyChangeControlSlides({ slide, setSlide, config, setConfig }: any) {
  const update = (key: string, value: string) => setConfig((current: any) => ({ ...current, [key]: value }));
  return <div className="fss-structure-slides fss-change-slides">
    <div className="fss-slide-tabs">{["Versioning", "Dependencies", "Impact & Approval", "Audit History"].map((label, index) => <button type="button" key={label} className={slide === index ? "is-active" : ""} onClick={() => setSlide(index)}><b>{index + 1}</b>{label}</button>)}</div>
    {slide === 0 ? <div className="fss-slide-card"><div className="fss-slide-heading"><div><span>Step 1 of 4</span><h3>Configuration Versioning</h3><p>Identify the active configuration and its accountable owner.</p></div></div><div className="fss-finance-grid"><label><span>Configuration Version</span><input value={config.configurationVersion} placeholder="1.0" onChange={(event) => update("configurationVersion", event.target.value)} /></label><label><span>Effective Date</span><input type="date" value={config.effectiveDate} onChange={(event) => update("effectiveDate", event.target.value)} /></label><label><span>Configuration Owner</span><input value={config.configurationOwner} placeholder="Name or responsible team" onChange={(event) => update("configurationOwner", event.target.value)} /></label></div></div> : null}
    {slide === 1 ? <div className="fss-slide-card"><div className="fss-slide-heading"><div><span>Step 2 of 4</span><h3>Dependency Register</h3><p>Record module, integration and configuration dependencies and when they must be checked.</p></div></div><label className="fss-slide-textarea"><span>Dependency Register</span><textarea value={config.dependencyRegister} placeholder="Module | dependency | owner | status | due date" onChange={(event) => update("dependencyRegister", event.target.value)} /></label><label className="fss-slide-textarea"><span>Dependency Check Frequency</span><textarea value={config.dependencyCheckFrequency} placeholder="Before every activation and major change" onChange={(event) => update("dependencyCheckFrequency", event.target.value)} /></label></div> : null}
    {slide === 2 ? <div className="fss-slide-card"><div className="fss-slide-heading"><div><span>Step 3 of 4</span><h3>Impact Analysis and Approval</h3><p>Define how changes are assessed, requested and approved.</p></div></div><div className="fss-finance-grid"><label><span>Impact Analysis</span><select value={config.impactAnalysis} onChange={(event) => update("impactAnalysis", event.target.value)}><option>For all major changes</option><option>For financial and clinical changes</option><option>For all changes</option></select></label><label><span>Change Approval Mode</span><select value={config.changeApprovalMode} onChange={(event) => update("changeApprovalMode", event.target.value)}><option>Administrator approval</option><option>Two-person approval</option><option>Change request workflow</option></select></label><label><span>Approval Quorum</span><input value={config.approvalQuorum} placeholder="One authorised approver" onChange={(event) => update("approvalQuorum", event.target.value)} /></label><label><span>Change Request Required</span><input value={config.changeRequestRequired} placeholder="All production changes" onChange={(event) => update("changeRequestRequired", event.target.value)} /></label></div><label className="fss-slide-textarea"><span>Impact Scope</span><textarea value={config.impactScope} placeholder="Clinical safety, finance, privacy, integrations and operations" onChange={(event) => update("impactScope", event.target.value)} /></label><label className="fss-slide-textarea"><span>Emergency Change Process</span><textarea value={config.emergencyChangeProcess} placeholder="Document reason, approver and retrospective review" onChange={(event) => update("emergencyChangeProcess", event.target.value)} /></label></div> : null}
    {slide === 3 ? <div className="fss-slide-card"><div className="fss-slide-heading"><div><span>Step 4 of 4</span><h3>Audit History and Controlled Changes</h3><p>Set retention, immutability, review frequency and the official change register.</p></div></div><div className="fss-finance-grid"><label><span>Audit Retention (days)</span><input type="number" min="1" value={config.auditRetentionDays} onChange={(event) => update("auditRetentionDays", event.target.value)} /></label><label><span>Immutable Audit Log</span><select value={config.immutableAuditLog} onChange={(event) => update("immutableAuditLog", event.target.value)}><option>Enabled</option><option>Disabled</option></select></label><label><span>Audit Review Frequency</span><select value={config.auditReviewFrequency} onChange={(event) => update("auditReviewFrequency", event.target.value)}><option>Monthly</option><option>Quarterly</option><option>Weekly</option><option>Continuous monitoring</option></select></label><label><span>Change Register Location</span><input value={config.changeRegisterLocation} placeholder="HMIS audit log" onChange={(event) => update("changeRegisterLocation", event.target.value)} /></label></div></div> : null}
    <div className="fss-slide-navigation"><button type="button" disabled={slide === 0} onClick={() => setSlide((value: number) => Math.max(0, value - 1))}>Previous</button><button type="button" disabled={slide === 3} onClick={() => setSlide((value: number) => Math.min(3, value + 1))}>Next</button></div>
  </div>;
}

function BackupTestingRecoverySlides({ slide, setSlide, config, setConfig }: any) {
  const update = (key: string, value: string) => setConfig((current: any) => ({ ...current, [key]: value }));
  return <div className="fss-structure-slides fss-backup-slides">
    <div className="fss-slide-tabs">{["Backup Policy", "Downtime Readiness", "Testing Centre", "Recovery"].map((label, index) => <button type="button" key={label} className={slide === index ? "is-active" : ""} onClick={() => setSlide(index)}><b>{index + 1}</b>{label}</button>)}</div>
    {slide === 0 ? <div className="fss-slide-card"><div className="fss-slide-heading"><div><span>Step 1 of 4</span><h3>Backup Policy</h3><p>Define what is backed up, where it is stored, how long it is retained and how it is verified.</p></div></div><div className="fss-finance-grid"><label><span>Database Backup Frequency</span><select value={config.databaseBackupFrequency} onChange={(event) => update("databaseBackupFrequency", event.target.value)}><option>Hourly</option><option>Daily</option><option>Weekly</option></select></label><label><span>Configuration Backup Frequency</span><select value={config.configurationBackupFrequency} onChange={(event) => update("configurationBackupFrequency", event.target.value)}><option>Daily</option><option>Weekly</option><option>Monthly</option></select></label><label><span>Backup Type</span><input value={config.backupType} placeholder="Encrypted full and incremental backups" onChange={(event) => update("backupType", event.target.value)} /></label><label><span>Backup Location</span><input value={config.backupLocation} placeholder="Encrypted off-site storage" onChange={(event) => update("backupLocation", event.target.value)} /></label><label><span>Retention (days)</span><input type="number" min="1" value={config.backupRetentionDays} onChange={(event) => update("backupRetentionDays", event.target.value)} /></label><label><span>Backup Encryption</span><input value={config.backupEncryption} placeholder="AES-256" onChange={(event) => update("backupEncryption", event.target.value)} /></label></div><label className="fss-slide-textarea"><span>Backup Verification</span><textarea value={config.backupVerification} placeholder="Automatic checksum and restore verification" onChange={(event) => update("backupVerification", event.target.value)} /></label></div> : null}
    {slide === 1 ? <div className="fss-slide-card"><div className="fss-slide-heading"><div><span>Step 2 of 4</span><h3>Downtime Readiness</h3><p>Ensure the facility can continue safe operations if the HMIS is unavailable.</p></div></div><div className="fss-finance-grid"><label><span>Downtime Forms Ready</span><select value={config.downtimeFormsReady} onChange={(event) => update("downtimeFormsReady", event.target.value)}><option>Yes</option><option>No</option></select></label><label><span>Downtime Contact</span><input value={config.downtimeContact} placeholder="Name and emergency contact" onChange={(event) => update("downtimeContact", event.target.value)} /></label></div><label className="fss-slide-textarea"><span>Downtime Procedure</span><textarea value={config.downtimeProcedure} placeholder="Printed forms, manual queue and later reconciliation" onChange={(event) => update("downtimeProcedure", event.target.value)} /></label></div> : null}
    {slide === 2 ? <div className="fss-slide-card"><div className="fss-slide-heading"><div><span>Step 3 of 4</span><h3>Testing Centre</h3><p>Schedule restore drills and disaster recovery tests without affecting production.</p></div></div><div className="fss-finance-grid"><label><span>Test Environment</span><select value={config.testEnvironment} onChange={(event) => update("testEnvironment", event.target.value)}><option>Enabled</option><option>Disabled</option></select></label><label><span>Test Schedule</span><input value={config.testSchedule} placeholder="Monthly restore drill" onChange={(event) => update("testSchedule", event.target.value)} /></label><label><span>Recovery Point Objective</span><input value={config.rpoTarget} placeholder="24 hours" onChange={(event) => update("rpoTarget", event.target.value)} /></label><label><span>Recovery Time Objective</span><input value={config.rtoTarget} placeholder="4 hours" onChange={(event) => update("rtoTarget", event.target.value)} /></label><label><span>Last Recovery Test</span><input type="date" value={config.lastRecoveryTest} onChange={(event) => update("lastRecoveryTest", event.target.value)} /></label></div></div> : null}
    {slide === 3 ? <div className="fss-slide-card"><div className="fss-slide-heading"><div><span>Step 4 of 4</span><h3>Recovery and Disaster Recovery</h3><p>Record accountable recovery contacts and the approved disaster recovery plan.</p></div></div><div className="fss-finance-grid"><label><span>Primary Recovery Contact</span><input value={config.recoveryContact} placeholder="Name, role, phone and email" onChange={(event) => update("recoveryContact", event.target.value)} /></label><label><span>Secondary Recovery Contact</span><input value={config.secondaryRecoveryContact} placeholder="Backup contact details" onChange={(event) => update("secondaryRecoveryContact", event.target.value)} /></label></div><label className="fss-slide-textarea"><span>Disaster Recovery Plan</span><textarea value={config.disasterRecoveryPlan} placeholder="Failover, restore, communication, validation and return-to-service steps" onChange={(event) => update("disasterRecoveryPlan", event.target.value)} /></label></div> : null}
    <div className="fss-slide-navigation"><button type="button" disabled={slide === 0} onClick={() => setSlide((value: number) => Math.max(0, value - 1))}>Previous</button><button type="button" disabled={slide === 3} onClick={() => setSlide((value: number) => Math.min(3, value + 1))}>Next</button></div>
  </div>;
}
