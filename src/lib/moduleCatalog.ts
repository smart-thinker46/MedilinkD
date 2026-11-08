import type { LucideIcon } from "lucide-react";
import {
  Activity,
  ArrowRightLeft,
  Baby,
  Brain,
  Calendar,
  ClipboardCheck,
  Crown,
  CreditCard,
  DollarSign,
  FileText,
  FlaskConical,
  HelpCircle,
  HeartPulse,
  Home,
  Hospital,
  MessageCircle,
  Pill,
  Settings2,
  ShieldAlert,
  Stethoscope,
  TestTube,
  Upload,
  Users,
  UsersRound,
  UserCheck,
  UtensilsCrossed,
} from "lucide-react";

export type ModuleLayer =
  | "Patient Journey"
  | "Clinical"
  | "Administration"
  | "Technology & Intelligence"
  | "Support Services";

export type ModuleCatalogItem = {
  id: number;
  name: string;
  path: string;
  layer: ModuleLayer;
  premium: boolean;
  icon: LucideIcon;
};

export const MODULE_CATALOG: ModuleCatalogItem[] = [
  // Patient Journey (Layer 1)
  { id: 1, name: "Patient Registration", path: "/patients", layer: "Patient Journey", premium: false, icon: Users },
  { id: 4, name: "Appointments", path: "/appointments", layer: "Patient Journey", premium: false, icon: Calendar },
  { id: 28, name: "Queue Management", path: "/queue", layer: "Patient Journey", premium: true, icon: UsersRound },
  { id: 36, name: "Outpatient", path: "/opd", layer: "Patient Journey", premium: false, icon: Stethoscope },
  { id: 2, name: "Inpatient", path: "/ipd", layer: "Patient Journey", premium: true, icon: HeartPulse },
  { id: 25, name: "Emergency", path: "/emergency", layer: "Patient Journey", premium: true, icon: Activity },
  { id: 26, name: "Ambulance", path: "/ambulance", layer: "Patient Journey", premium: true, icon: ArrowRightLeft },
  { id: 5, name: "Bed & Ward", path: "/wards", layer: "Patient Journey", premium: true, icon: Hospital },
  { id: 37, name: "Maternity", path: "/maternity", layer: "Patient Journey", premium: true, icon: HeartPulse },
  { id: 38, name: "ICU", path: "/icu", layer: "Patient Journey", premium: true, icon: HeartPulse },
  { id: 51, name: "NICU", path: "/nicu", layer: "Patient Journey", premium: true, icon: Baby },
  { id: 11, name: "Operating Theatre", path: "/ot", layer: "Patient Journey", premium: true, icon: Activity },
  { id: 27, name: "Mortuary", path: "/mortuary", layer: "Patient Journey", premium: true, icon: ClipboardCheck },
  { id: 55, name: "Referral Management", path: "/referrals", layer: "Patient Journey", premium: true, icon: ArrowRightLeft },

  // Clinical (Layer 2)
  { id: 6, name: "EMR & Clinical Notes", path: "/ehr", layer: "Clinical", premium: true, icon: FileText },
  { id: 48, name: "Clinical Decision Support", path: "/cdss", layer: "Clinical", premium: true, icon: Brain },
  { id: 7, name: "Nursing", path: "/nursing", layer: "Clinical", premium: true, icon: UserCheck },
  { id: 42, name: "Nursing Admin", path: "/nursing-admin", layer: "Clinical", premium: true, icon: ShieldAlert },
  { id: 8, name: "Laboratory", path: "/lab", layer: "Clinical", premium: true, icon: TestTube },
  { id: 9, name: "Radiology", path: "/radiology", layer: "Clinical", premium: true, icon: Activity },
  { id: 10, name: "Pharmacy", path: "/pharmacy", layer: "Clinical", premium: false, icon: Pill },
  { id: 35, name: "Pharmacy POS", path: "/pharmacy/pos", layer: "Clinical", premium: true, icon: CreditCard },
  { id: 12, name: "Blood Bank", path: "/blood-bank", layer: "Clinical", premium: true, icon: FlaskConical },
  { id: 32, name: "Clinical Research", path: "/clinical-research", layer: "Clinical", premium: true, icon: Brain },
  { id: 33, name: "Quality Assurance", path: "/quality-assurance", layer: "Clinical", premium: true, icon: ClipboardCheck },
  { id: 49, name: "Physiotherapy & Rehabilitation", path: "/physiotherapy", layer: "Clinical", premium: true, icon: Activity },
  { id: 50, name: "Nutrition & Dietetics", path: "/nutrition", layer: "Clinical", premium: true, icon: UtensilsCrossed },
  { id: 52, name: "Dental", path: "/dental", layer: "Clinical", premium: true, icon: Stethoscope },
  { id: 53, name: "Infection Control & CSSD", path: "/infection-control", layer: "Clinical", premium: true, icon: ShieldAlert },
  { id: 59, name: "Paediatrics", path: "/paediatrics", layer: "Clinical", premium: true, icon: HeartPulse },

  // Administration (Layer 3)
  { id: 13, name: "Billing", path: "/billing", layer: "Administration", premium: false, icon: CreditCard },
  { id: 14, name: "Insurance", path: "/insurance", layer: "Administration", premium: true, icon: ShieldAlert },
  { id: 44, name: "Revenue Cycle", path: "/revenue", layer: "Administration", premium: true, icon: DollarSign },
  { id: 39, name: "Financial Accounting", path: "/accounting", layer: "Administration", premium: true, icon: DollarSign },
  { id: 45, name: "Cost Accounting", path: "/cost-accounting", layer: "Administration", premium: true, icon: DollarSign },
  { id: 15, name: "Inventory", path: "/inventory", layer: "Administration", premium: true, icon: Hospital },
  { id: 16, name: "Human Resources", path: "/hr", layer: "Administration", premium: true, icon: Users },
  { id: 66, name: "Payroll & Compensation", path: "/payroll", layer: "Administration", premium: true, icon: CreditCard },
  { id: 40, name: "Workforce Planning", path: "/workforce-planning", layer: "Administration", premium: true, icon: UsersRound },
  { id: 17, name: "Doctor Management", path: "/doctors", layer: "Administration", premium: true, icon: UserCheck },
  { id: 18, name: "Facility Management", path: "/facility", layer: "Administration", premium: true, icon: Hospital },
  { id: 61, name: "Biomedical Equipment", path: "/biomedical", layer: "Administration", premium: true, icon: Hospital },

  // Technology & Intelligence (Layer 4)
  { id: 19, name: "Reporting", path: "/reports", layer: "Technology & Intelligence", premium: true, icon: FileText },
  { id: 46, name: "Executive Dashboard", path: "/executive", layer: "Technology & Intelligence", premium: true, icon: Crown },
  { id: 23, name: "AI Analytics", path: "/ai-analytics", layer: "Technology & Intelligence", premium: true, icon: Brain },
  { id: 21, name: "Telemedicine", path: "/telemedicine", layer: "Technology & Intelligence", premium: true, icon: Activity },
  { id: 24, name: "Patient Portal", path: "/patient-portal", layer: "Technology & Intelligence", premium: true, icon: Users },
  { id: 22, name: "Blockchain Audit", path: "/blockchain", layer: "Technology & Intelligence", premium: true, icon: ShieldAlert },
  { id: 20, name: "User & Security", path: "/users", layer: "Technology & Intelligence", premium: true, icon: ShieldAlert },
  { id: 41, name: "ICT & Security Operations", path: "/ict", layer: "Technology & Intelligence", premium: true, icon: Activity },
  { id: 34, name: "External Integrations", path: "/integrations", layer: "Technology & Intelligence", premium: true, icon: ArrowRightLeft },
  { id: 47, name: "Orchestration & Automation", path: "/orchestration", layer: "Technology & Intelligence", premium: true, icon: ArrowRightLeft },
  { id: 54, name: "Consent Management", path: "/consent", layer: "Technology & Intelligence", premium: true, icon: FileText },
  { id: 57, name: "Document Management", path: "/documents", layer: "Technology & Intelligence", premium: true, icon: FileText },
  { id: 58, name: "SMS & WhatsApp Messaging", path: "/messaging", layer: "Technology & Intelligence", premium: true, icon: MessageCircle },
  { id: 62, name: "Governance & Safety Controls", path: "/governance", layer: "Technology & Intelligence", premium: true, icon: ShieldAlert },
  { id: 65, name: "Full System Setup (FSS)", path: "/full-system-setup", layer: "Technology & Intelligence", premium: true, icon: Settings2 },
  { id: 64, name: "Migration", path: "/migration", layer: "Technology & Intelligence", premium: true, icon: Upload },

  // Support Services (Layer 5)
  { id: 29, name: "Helpdesk", path: "/helpdesk", layer: "Support Services", premium: true, icon: HelpCircle },
  { id: 63, name: "Operations & Vendor Support", path: "/operations", layer: "Support Services", premium: true, icon: HelpCircle },
  { id: 30, name: "Canteen", path: "/canteen", layer: "Support Services", premium: true, icon: UtensilsCrossed },
  { id: 31, name: "Patient Feedback", path: "/feedback", layer: "Support Services", premium: true, icon: ClipboardCheck },
  { id: 43, name: "Medical Director Dashboard", path: "/medical-director", layer: "Support Services", premium: true, icon: Crown },
  { id: 56, name: "Community Health & CHW", path: "/community-health", layer: "Support Services", premium: true, icon: UsersRound },
  { id: 60, name: "Home Care", path: "/home-care", layer: "Support Services", premium: true, icon: Home },
];

export const LAYER_ORDER: ModuleLayer[] = [
  "Patient Journey",
  "Clinical",
  "Administration",
  "Technology & Intelligence",
  "Support Services",
];

export const MODULE_SECTIONS = LAYER_ORDER.map((layer) => ({
  layer,
  items: MODULE_CATALOG.filter((item) => item.layer === layer),
}));

export const MODULE_BY_ID = new Map<number, ModuleCatalogItem>(
  MODULE_CATALOG.map((item) => [item.id, item]),
);

export const MODULE_BY_PATH = new Map<string, ModuleCatalogItem>(
  MODULE_CATALOG.map((item) => [item.path, item]),
);

