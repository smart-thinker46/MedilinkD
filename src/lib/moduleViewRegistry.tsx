import type { ComponentType } from "react";

/**
 * Authoritative screen registry for the desktop shell.
 *
 * The desktop application is not URL-addressable, so every entry in
 * `MODULE_CATALOG` is mapped to the React screen that implements it. The
 * registry keys intentionally match the backend RBAC module ids (see
 * `Medilink-Backend/src/security/rbac.catalog.ts`).
 */
import AccountingView from "../views/AccountingView";
import AccountSettingsView from "../views/AccountSettingsView";
import AiAnalyticsView from "../views/AiAnalyticsView";
import AiCentralView from "../views/AiCentralView";
import AiChatView from "../views/AiChatView";
import AmbulanceView from "../views/AmbulanceView";
import AnalyticsView from "../views/AnalyticsView";
import AppointmentsView from "../views/AppointmentsView";
import AppsView from "../views/AppsView";
import BillingView from "../views/BillingView";
import BiomedicalView from "../views/BiomedicalView";
import BlockchainView from "../views/BlockchainView";
import BloodBankView from "../views/BloodBankView";
import CanteenView from "../views/CanteenView";
import CdssView from "../views/CdssView";
import ClinicalResearchView from "../views/ClinicalResearchView";
import CommunicationView from "../views/CommunicationView";
import CommunityHealthView from "../views/CommunityHealthView";
import ConsentView from "../views/ConsentView";
import CostAccountingView from "../views/CostAccountingView";
import DentalView from "../views/DentalView";
import DoctorsView from "../views/DoctorsView";
import DocumentsView from "../views/DocumentsView";
import EhrView from "../views/EhrView";
import EmergencyView from "../views/EmergencyView";
import FacilitiesView from "../views/FacilitiesView";
import FacilitiesWorkOrdersView from "../views/FacilitiesWorkOrdersView";
import FinanceJournalsView from "../views/FinanceJournalsView";
import FullSystemSetupView from "../views/FullSystemSetupView";
import GovernanceView from "../views/GovernanceView";
import HelpdeskView from "../views/HelpdeskView";
import HomeCareView from "../views/HomeCareView";
import HrView from "../views/HrView";
import IctView from "../views/IctView";
import IcuView from "../views/IcuView";
import InfectionControlView from "../views/InfectionControlView";
import InsuranceView from "../views/InsuranceView";
import { ExternalIntegrationsView } from "../views/IntegrationsView";
import InventoryPurchaseOrdersView from "../views/InventoryPurchaseOrdersView";
import InventoryView from "../views/InventoryView";
import IpdView from "../views/IpdView";
import LaboratoryView from "../views/LaboratoryView";
import MaternityView from "../views/MaternityView";
import MedicalDirectorView from "../views/MedicalDirectorView";
import MessagingView from "../views/MessagingView";
import { MigrationCenterView } from "../components/MigrationCenterView";
import MortuaryView from "../views/MortuaryView";
import NicuView from "../views/NicuView";
import NursingAdminView from "../views/NursingAdminView";
import NursingView from "../views/NursingView";
import NutritionView from "../views/NutritionView";
import { OpdDashboardView } from "../views/OpdDashboardView";
import OperationsView from "../views/OperationsView";
import OrchestrationView from "../views/OrchestrationView";
import OtView from "../views/OtView";
import PaediatricsView from "../views/PaediatricsView";
import PatientFeedbackView from "../views/PatientFeedbackView";
import PatientRegistrationView from "../views/PatientRegistrationView";
import PayrollView from "../views/PayrollView";
import PharmacyPosView from "../views/PharmacyPosView";
import PharmacyView from "../views/PharmacyView";
import PhysiotherapyView from "../views/PhysiotherapyView";
import PortalAppointmentsView from "../views/PortalAppointmentsView";
import PortalView from "../views/PortalView";
import QualityAssuranceView from "../views/QualityAssuranceView";
import QueueManagementView from "../views/QueueManagementView";
import RadiologyView from "../views/RadiologyView";
import ReferralsView from "../views/ReferralsView";
import ReportsView from "../views/ReportsView";
import RevenueView from "../views/RevenueView";
import TelemedicineView from "../views/TelemedicineView";
import UserManagementView from "../views/UserManagementView";
import WardView from "../views/WardView";
import WorkforcePlanningView from "../views/WorkforcePlanningView";

const MODULE_VIEW_REGISTRY: Record<number, ComponentType> = {
  // Patient Journey
  1: () => null, // handled by the shell (local PatientsView owns patient state)
  4: AppointmentsView,
  28: QueueManagementView,
  36: OpdDashboardView,
  2: IpdView,
  25: EmergencyView,
  26: AmbulanceView,
  5: WardView,
  37: MaternityView,
  38: IcuView,
  51: NicuView,
  11: OtView,
  27: MortuaryView,
  55: ReferralsView,

  // Clinical
  6: EhrView,
  48: CdssView,
  7: NursingView,
  42: NursingAdminView,
  8: LaboratoryView,
  9: RadiologyView,
  10: PharmacyView,
  35: PharmacyPosView,
  12: BloodBankView,
  32: ClinicalResearchView,
  33: QualityAssuranceView,
  49: PhysiotherapyView,
  50: NutritionView,
  52: DentalView,
  53: InfectionControlView,
  59: PaediatricsView,

  // Administration
  13: BillingView,
  14: InsuranceView,
  44: RevenueView,
  39: AccountingView,
  45: CostAccountingView,
  15: InventoryView,
  16: HrView,
  66: PayrollView,
  40: WorkforcePlanningView,
  17: DoctorsView,
  18: FacilitiesView,
  61: BiomedicalView,

  // Technology & Intelligence
  19: ReportsView,
  46: AnalyticsView,
  23: AiAnalyticsView,
  21: TelemedicineView,
  24: PortalView,
  22: BlockchainView,
  20: UserManagementView,
  41: IctView,
  34: ExternalIntegrationsView,
  47: OrchestrationView,
  54: ConsentView,
  57: DocumentsView,
  58: MessagingView,
  62: GovernanceView,
  65: FullSystemSetupView,
  64: MigrationCenterView,

  // Support Services
  29: HelpdeskView,
  63: OperationsView,
  30: CanteenView,
  31: PatientFeedbackView,
  43: MedicalDirectorView,
  56: CommunityHealthView,
  60: HomeCareView,
};

export function getModuleView(moduleId: number): ComponentType | null {
  return MODULE_VIEW_REGISTRY[moduleId] || null;
}

/**
 * Sub-routes that render a dedicated screen while the parent module stays the
 * navigation context (e.g. `/finance/journals` inside Financial Accounting).
 */
const PATH_VIEW_REGISTRY: Record<string, ComponentType> = {
  "/settings": AccountSettingsView,
  "/apps": AppsView,
  "/ai-central": AiCentralView,
  "/ai-chat": AiChatView,
  "/communication": CommunicationView,
  "/finance/journals": FinanceJournalsView,
  "/facilities/work-orders": FacilitiesWorkOrdersView,
  "/inventory/purchase-orders": InventoryPurchaseOrdersView,
  "/patients/registration": PatientRegistrationView,
  "/patient-registration": PatientRegistrationView,
  "/executive": AnalyticsView,
  "/migration": MigrationCenterView,
  "/portal/appointments": PortalAppointmentsView,
  "/patient-portal/appointments": PortalAppointmentsView,
  "/payroll": PayrollView,
  "/full-system-setup": FullSystemSetupView,
  "/helpdesk": HelpdeskView,
};

const PATH_PARENT_MODULE: Record<string, number> = {
  "/ai-central": 23,
  "/ai-chat": 23,
  "/communication": 58,
  "/finance/journals": 39,
  "/facilities/work-orders": 18,
  "/inventory/purchase-orders": 15,
  "/patients/registration": 1,
  "/patient-registration": 1,
  "/executive": 46,
  "/migration": 64,
  "/portal/appointments": 24,
  "/patient-portal/appointments": 24,
  "/payroll": 66,
  "/full-system-setup": 65,
  "/helpdesk": 29,
};

export function getPathView(path: string): ComponentType | null {
  const normalized = String(path || "").split("?")[0].replace(/\/+$/, "") || "/";
  return PATH_VIEW_REGISTRY[normalized] || null;
}

export function getPathParentModule(path: string): number | null {
  const normalized = String(path || "").split("?")[0].replace(/\/+$/, "") || "/";
  return PATH_PARENT_MODULE[normalized] ?? null;
}
