# MEDILINK HMIS — FRONTEND TO DESKTOP PARITY AUDIT
**Reference Implementation:** `Medilink-Frontend` (Next.js 16 App Router, React 19, Tailwind CSS v4, Zustand)  
**Target Application:** `Medilink-Desktop` (Tauri v2, React 19, Vite 7, Zustand 5, Rust)  
**Authority Backend:** `Medilink-Backend` (NestJS 11, PostgreSQL, Prisma ORM 448 models)  
**Audit Date:** November 13, 2026 — Revalidated & Stubs Created  
**Status:** Stub scaffold complete — implementation agents may now begin  

---

## Audit revalidation — November 9, 2026

The repository locations and source trees were rechecked before foundation work:

| Repository | Location | Write policy | Revalidation result |
|---|---|---|---|
| Web reference | `../Medilink-Frontend` | Read-only | 95 App Router pages identified; no changes made |
| Desktop target | `.` | Writable | Tauri/Vite client with 44 dedicated view files plus shared shell and workflow components |
| API authority | `../Medilink-Backend` | Read-only | 98 controllers identified; auth refresh and security contracts inspected directly |

The existing route matrix remains the implementation inventory, not functional proof. A route marked `IMPLEMENTED` in the progress tracker requires a live, synthetic-tenant flow and visual comparison before it can be promoted to `TESTED` or `VERIFIED`. This distinction is now reflected in the QA report. The initial foundation gap addressed in this checkpoint is native-client session recovery: Desktop now mirrors the Web client's cookie-capable, single-flight refresh behavior and only retries safe read requests after a transient network failure.

---

## Form parity checkpoint — November 10, 2026

The Web form inventory was compared with Desktop source before making changes. The shared form contracts are already synchronized: `formsDirectory.ts`, `moduleActionForms.ts`, `ModuleReferenceForms.tsx`, and the clinical form components use the same fields and validation behavior; the only differences in the clinical components are their project-relative API imports.

| Form area | Reference | Desktop finding | Action / status |
|---|---|---|---|
| Generic action forms across modules | `formsDirectory.ts` + `moduleActionForms.ts` | Same catalogue and field definitions | Aligned |
| Clinical: admission, notes, lab order, medication administration, nursing, prescriptions, vitals | `components/clinical/*` | Same component bodies, Desktop-relative API imports | Aligned |
| Specialty clinical templates | `SpecialtyFormPanel.tsx` | Byte-for-byte match | Aligned |
| Patient registration | `components/patients/PatientForm.tsx` | Desktop custom form lacked registration mode/source/estimated age, birth/language, guardian, portal, and communication fields | Updated November 10; live mutation verification pending |
| Appointments, lab result, radiology report, inventory, pharmacy dispensing | Dedicated Web components and Desktop module views | Desktop implements these in module-specific views rather than matching component files | Requires per-screen visual and synthetic-backend verification; do not mark verified from source review alone |

This audit does not treat source similarity as evidence that an endpoint accepts every field. All remaining forms must be exercised against a synthetic tenant and compared with their Web route before being marked `TESTED` or `VERIFIED`.

---

## Stub scaffold checkpoint — November 13, 2026

35 missing view stub files were created under `src/views/` to unblock implementation agents. Each stub exports a named React component with the standard `module-view-root` / `pv-header` / `pv-body` DOM structure and the `apiFetch` import already in scope.

**Pre-existing views (45 files):** AmbulanceView, AnalyticsView, BillingView, BiomedicalView, BlockchainView, BloodBankView (⚠️ thin), CanteenView, CdssView, DentalView, DoctorsView, EhrView, EmergencyView, FacilitiesView, FinanceView (⚠️ thin), HelpdeskView, HrView, IcuView, InfectionControlView, InsuranceView, IntegrationsView (⚠️ thin), InventoryView, IpdView, LaboratoryView, MaternityView, MortuaryView, NicuView, NursingView, NutritionView, OpdDashboardView, OtView, PaediatricsView, PatientFeedbackView, PatientPortalView, PharmacyPosView, PharmacyView, PhysiotherapyView, ProcurementView (⚠️ thin), QualityAssuranceView, QueueManagementView, RadiologyView, ReferralsView, ReportsView, TelemedicineView, UserManagementView, WardView

**New stubs created (35 files):** AccountingView, AiAnalyticsView, AiCentralView, AiChatView, AppointmentsView, AppsView, ClinicalResearchView, CommunicationView, CommunityHealthView, ConsentView, CostAccountingView, DocumentsView, ExecutiveView, FacilitiesWorkOrdersView, FinanceJournalsView, FullSystemSetupView, GovernanceView, HomeCareView, IctView, InventoryPurchaseOrdersView, MedicalDirectorView, MessagingView, MigrationView, NursingAdminView, OperationsView, OrchestrationView, PatientRegistrationView, PayrollView, PortalAppointmentsView, PortalView, RevenueView, SettingsView, SetupView, SignupView, WorkforcePlanningView

---

## 1. Executive Summary & Architecture Baseline

### 1.1 Objective
Establish complete functional, visual, architectural, and data parity between `Medilink-Desktop` and the updated `Medilink-Frontend` reference application without modifying `Medilink-Frontend` or compromising Tauri native capabilities.

### 1.2 Core Architectural Divergence
* **`Medilink-Frontend`:** Structured around modern Next.js 16 App Router (`src/app/*`) with 95 distinct route pages, a modular shell architecture (`AppShell`, `DashboardLayout`, `Sidebar`, `Topbar`, `OrderInbox`, `RecordDrawer`, `TableInteractionLayer`), Lucide React icons, Tailwind CSS v4 styling, and granular Axios API interceptors.
* **`Medilink-Desktop`:** Currently organized as a high-density single-file monolithic structure (`src/App.tsx` with ~10,000+ lines, and `WorkflowModuleView.tsx`) running on Tauri v2 + Vite 7. While it features working implementations of core workflows (Patient registration, Appointments, basic Billing, Pharmacy, Migration Center), over 50 specialized HMIS modules currently fall back to a generic multi-stage workflow runner instead of the dedicated, rich clinical dashboards present in the web reference.
* **Component Architecture:** Frontend uses reusable component libraries (`src/components/clinical/`, `src/components/diagnostics/`, `src/components/layout/`), whereas Desktop duplicates large blocks of JSX, form fields, and modal states inside `App.tsx`.

### 1.3 App.tsx Routing Findings
App.tsx uses a numeric `activeNav` index (0–42, 99) and a `moduleId` integer to dispatch views — **not** path-based routing. New dedicated views must be wired via additional `activeNav` cases or by extending the module dispatch in the existing `renderModuleView()` switch. The module IDs in `moduleCatalog.ts` are already synchronized between Frontend and Desktop; **no new module IDs are needed** — the missing views only need their `activeNav`/`moduleId` cases added to App.tsx.

---

## 2. Layout, Shell & Design System Discrepancies

| Area | Frontend Reference (`Medilink-Frontend`) | Desktop Current (`Medilink-Desktop`) | Discrepancy & Required Action |
| :--- | :--- | :--- | :--- |
| **Application Shell** | `AppShell.tsx` wraps all authenticated routes with SkipLink, PWA, preference manager (`hmis.theme`, `hmis.density`, `hmis.language`), and `OrderInbox`. | Monolithic wrapper inside `App.tsx` with fragmented local storage keys (`hmis_app_mode`, `hmis_landing_theme`). | Synchronize shell structure, unify storage keys, and add `OrderInbox`. |
| **Sidebar Navigation** | Categorized into 5 functional layers: Patient Journey, Clinical, Administration, Support, Advanced. Includes search filtering, collapsibility, active indicators, and notification badges. | Flat numeric index (`activeNav` 0-42, 99) with divergent categorizations and manual icon rendering. | Modernize navigation to match the 5 categorized groups while preserving desktop responsiveness. |
| **Topbar & Header** | High-density topbar with real-time digital clock, global search, facility branding badge, active order tray, notification drawer, and user profile popover. | Custom topbar in `App.tsx` with hardcoded icons, basic notification toggle, and separate search state. | Synchronize topbar layout, dimensions, and action buttons. |
| **Iconography** | `lucide-react` (~0.575) standard across all modules and buttons. | Inline SVG `Icon({ type, size })` switch statement with ~475 lines of hardcoded paths. | Adopt consistent icon representations matching Lucide icons. |
| **Styling & CSS** | Tailwind CSS v4 + `globals.css` (47,631 lines) with dedicated module prefixes (`.opd-page`, `.icu-page`, `.biomed-page`, `.rcm-page`). | `App.css` (23,836 lines). Only `.patient-table-page` exists from the new prefix system; missing 35+ module stylesheets. | Port missing module CSS rules and design tokens into Desktop design system. |
| **Display Density** | Supports `compact` (clinical default) and `comfortable` densities via CSS dataset attributes. | Custom `compactDashboard` boolean affecting only the home module grid. | Implement full shell-wide density control matching `data-density="compact"`. |
| **Order Routing Tray** | `OrderInbox.tsx` listens to `hmis:open-module-orders` and displays live clinical orders across departments. | Completely missing in Desktop. | Implement `OrderInbox` in Desktop shell. |
| **Table Interactions** | `TableInteractionLayer.tsx` provides high-density keyboard navigation, row highlighting, and export. | Raw HTML `<table>` elements with basic inline styles and divergent CSS classes. | Standardize table components and interaction layer. |
| **Field Descriptions** | `FieldDescriptionLayer.tsx` displays contextual tooltips and clinical documentation hints on focus. | Basic inline placeholder text. | Synchronize field tooltips and description layer. |

---

## 3. Screen-by-Screen Parity Audit (95 Frontend Routes vs Desktop)

### Legend
* **✅ EXISTS** — Dedicated view file found in `Desktop/src/views/` with substantive implementation.
* **⚠️ PARTIAL** — File exists but is thin/stub/minimal or falls back to `WorkflowModuleView`.
* **❌ MISSING** → **🔧 STUB** — No dedicated Desktop view existed; stub file now created by this audit run.

| # | Route in Frontend | Module ID | Screen Name & Purpose | Desktop Status | View File | Required Action |
|---|---|---|---|---|---|---|
| 1 | `/` | — | Root landing redirect | ✅ EXISTS | `App.tsx` SplashScreen | Preserve desktop boot flow & splash |
| 2 | `/landing` | — | Marketing / Auth landing | ✅ EXISTS | `App.tsx` AuthLanding | Align typography & theme switcher |
| 3 | `/login` | — | Hospital Admin login | ✅ EXISTS | `App.tsx` HospitalLoginScreen | Align form validation & token rotation |
| 4 | `/login/staff` | — | Clinical staff login | ✅ EXISTS | `App.tsx` StaffLoginScreen | Align facility code selection & MFA |
| 5 | `/signup` | — | Self-registration portal | 🔧 STUB | `SignupView.tsx` | Implement facility self-registration |
| 6 | `/setup` | — | Initial facility onboarding | ✅ EXISTS | `App.tsx` FirstTimeSetupScreen | Match multi-step wizard fields |
| 7 | `/full-system-setup` | — | Complete enterprise setup | 🔧 STUB | `FullSystemSetupView.tsx` | Port full system configuration steps |
| 8 | `/patients` | 1 | Patient Registration & Registry | ⚠️ PARTIAL | `App.tsx` PatientsView + `PatientRegistrationView.tsx` (stub) | Migrate to dedicated file; add MPI merge & insurance verify |
| 9 | `/appointments` | 4 | Appointment Scheduling | 🔧 STUB | `AppointmentsView.tsx` | Add slot booking calendar & telemedicine link |
| 10 | `/queue` | 28 | Central Queue Management | ✅ EXISTS | `QueueManagementView.tsx` | Synchronize counter sessions & priority override |
| 11 | `/opd` | 36 | Outpatient Consultation & Triage | ✅ EXISTS | `OpdDashboardView.tsx` | Build dedicated OPD Consultation dashboard with ICD-10 |
| 12 | `/ipd` | 2 | Inpatient (IPD) Management | ✅ EXISTS | `IpdView.tsx` | Implement dedicated Inpatient bed board & care plan |
| 13 | `/ipd/[id]` | 2 | Inpatient Admission Detail | ⚠️ PARTIAL | `IpdView.tsx` | Build admission detail slide-over / drawer |
| 14 | `/emergency` | 25 | Emergency & Trauma Unit | ✅ EXISTS | `EmergencyView.tsx` | Synchronize triage acuity scoring (Manchester/ESI) |
| 15 | `/ambulance` | 26 | Ambulance Fleet & Dispatch | ✅ EXISTS | `AmbulanceView.tsx` | Add GPS log dispatch & fuel billing integration |
| 16 | `/wards` | 5 | Wards & Bed Allocation | ✅ EXISTS | `WardView.tsx` | Synchronize bed graphical grid & ward transfers |
| 17 | `/maternity` | 37 | Maternity & Obstetrics | ✅ EXISTS | `MaternityView.tsx` | Implement dedicated ANC, Labor & Delivery dashboard |
| 18 | `/maternity/[pregnancyId]` | 37 | Pregnancy Episode Detail | ⚠️ PARTIAL | `MaternityView.tsx` | Build pregnancy clinical timeline & APGAR logger |
| 19 | `/icu` | 38 | Intensive Care Unit (ICU) | ✅ EXISTS | `IcuView.tsx` | Build dedicated ICU monitoring & APACHE score dashboard |
| 20 | `/nicu` | 51 | Neonatal ICU (NICU) | ✅ EXISTS | `NicuView.tsx` | Build dedicated NICU incubator & phototherapy dashboard |
| 21 | `/ot` | 11 | Operation Theatre Management | ✅ EXISTS | `OtView.tsx` | Build dedicated OT surgical schedule & WHO checklist |
| 22 | `/mortuary` | 27 | Mortuary & Deceased Tracking | ✅ EXISTS | `MortuaryView.tsx` | Add freezer allocation & autopsy release flow |
| 23 | `/referrals` | 55 | Inter-facility Referrals | ✅ EXISTS | `ReferralsView.tsx` | Build dedicated incoming/outgoing referral dashboard |
| 24 | `/ehr` | 6 | EMR & Medical Records | ✅ EXISTS | `EhrView.tsx` | Synchronize clinical note templates & allergy alerts |
| 25 | `/ehr/[patientId]` | 6 | Patient Longitudinal Record | ⚠️ PARTIAL | `EhrView.tsx` | Build full longitudinal patient timeline view |
| 26 | `/cdss` | 48 | Clinical Decision Support | ✅ EXISTS | `CdssView.tsx` | Build dedicated rule monitor & alert action center |
| 27 | `/nursing` | 7 | Nursing Care & Vitals | ✅ EXISTS | `NursingView.tsx` | Synchronize MedAdmin 5-Rights & nursing care plans |
| 28 | `/nursing-admin` | 42 | Nursing Administration / Matron | 🔧 STUB | `NursingAdminView.tsx` | Build staffing ratios & shift incident monitor |
| 29 | `/lab` | 8 | Laboratory Diagnostics | ✅ EXISTS | `LaboratoryView.tsx` | Synchronize specimen accessioning & critical values |
| 30 | `/radiology` | 9 | Radiology & PACS Imaging | ✅ EXISTS | `RadiologyView.tsx` | Add study timeline & critical radiology alerts |
| 31 | `/pharmacy` | 10 | Pharmacy Operations | ✅ EXISTS | `PharmacyView.tsx` | Synchronize prescription review & dispensing |
| 32 | `/pharmacy/[sub]` | 10 | Pharmacy Sub-Inventories | ⚠️ PARTIAL | `PharmacyView.tsx` | Support satellite & floor pharmacy routing |
| 33 | `/pharmacy/dispense/[id]` | 10 | Dispense Execution Screen | ⚠️ PARTIAL | `PharmacyView.tsx` | Build full prescription dispense verification screen |
| 34 | `/pharmacy/pos` | 35 | Pharmacy Retail POS | ✅ EXISTS | `PharmacyPosView.tsx` | Build retail checkout with barcode, cart & receipt print |
| 35 | `/blood-bank` | 12 | Blood Bank & Transfusion | ⚠️ PARTIAL | `BloodBankView.tsx` (154 lines) | Synchronize donor registry & cross-match workflow |
| 36 | `/clinical-research` | 32 | Clinical Trials & Research | 🔧 STUB | `ClinicalResearchView.tsx` | Build protocol registry & adverse event reporting |
| 37 | `/quality-assurance` | 33 | Quality Assurance & Audits | ✅ EXISTS | `QualityAssuranceView.tsx` | Add root cause analysis & accreditation checklist |
| 38 | `/physiotherapy` | 49 | Physiotherapy & Rehab | ✅ EXISTS | `PhysiotherapyView.tsx` | Build rehab assessment & range-of-motion charts |
| 39 | `/nutrition` | 50 | Nutrition & Dietetics | ✅ EXISTS | `NutritionView.tsx` | Build clinical nutrition plans & enteral feeding logs |
| 40 | `/dental` | 52 | Dental Clinic & Odontogram | ✅ EXISTS | `DentalView.tsx` | Build interactive tooth chart (odontogram) & treatment plan |
| 41 | `/infection-control` | 53 | Infection Control & CSSD | ✅ EXISTS | `InfectionControlView.tsx` | Build autoclave sterilization & surveillance tracker |
| 42 | `/paediatrics` | 59 | Paediatric Medicine | ✅ EXISTS | `PaediatricsView.tsx` | Build WHO growth percentile charts & immunization |
| 43 | `/billing` | 13 | Patient Billing & Invoicing | ✅ EXISTS | `BillingView.tsx` | Add invoice lifecycle, discounts, and payment modal |
| 44 | `/insurance` | 14 | Insurance Pre-auth & Claims | ✅ EXISTS | `InsuranceView.tsx` | Synchronize claim submissions & pre-auth approvals |
| 45 | `/revenue` | 44 | Revenue Cycle Management (RCM) | 🔧 STUB | `RevenueView.tsx` | Build claims scrubbing, denial tracking & AR aging |
| 46 | `/accounting` | 39 | General Ledger & Accounting | 🔧 STUB | `AccountingView.tsx` | Build Chart of Accounts, Journal entries & Trial Balance |
| 47 | `/finance` | 39 | Financial Overview Dashboard | ⚠️ PARTIAL | `FinanceView.tsx` (207 lines) | Build executive financial summary dashboard |
| 48 | `/finance/journals` | 39 | Journal Voucher System | 🔧 STUB | `FinanceJournalsView.tsx` | Build double-entry debit/credit ledger posting |
| 49 | `/cost-accounting` | 45 | Cost Centers & Unit Costing | 🔧 STUB | `CostAccountingView.tsx` | Build departmental cost allocation & profitability |
| 50 | `/inventory` | 15 | Central Inventory & Stores | ✅ EXISTS | `InventoryView.tsx` | Synchronize stock movements, batch tracking & expiry |
| 51 | `/inventory/purchase-orders` | 15 | Purchase Order Tracking | 🔧 STUB | `InventoryPurchaseOrdersView.tsx` | Build dedicated PO lifecycle & approval dashboard |
| 52 | `/procurement` | 15 | Procurement & Suppliers | ⚠️ PARTIAL | `ProcurementView.tsx` (45 lines) | Synchronize supplier evaluation & quotation bids |
| 53 | `/hr` | 16 | Human Resources Operations | ✅ EXISTS | `HrView.tsx` | Synchronize employee lifecycle, leaves & attendance |
| 54 | `/hr/payroll` | 66 | Staff Payroll Calculation | 🔧 STUB | `PayrollView.tsx` | Build Kenya statutory deduction (PAYE/SHA/NSSF) run |
| 55 | `/payroll` | 66 | Payroll Management | 🔧 STUB | `PayrollView.tsx` | Synchronize payslip generation & bank payment batch |
| 56 | `/workforce-planning` | 40 | Workforce Shift Roster | 🔧 STUB | `WorkforcePlanningView.tsx` | Build nurse shift scheduling & staffing ratio forecasts |
| 57 | `/doctors` | 17 | Doctor Directory & Credentialing | ✅ EXISTS | `DoctorsView.tsx` | Synchronize CME credits, license renewal & OPD schedule |
| 58 | `/facilities` | 18 | Multi-facility Asset Mgmt | ✅ EXISTS | `FacilitiesView.tsx` | Synchronize equipment maintenance & compliance checks |
| 59 | `/facilities/work-orders` | 18 | Maintenance Work Orders | 🔧 STUB | `FacilitiesWorkOrdersView.tsx` | Build work order assignment & SLA tracking |
| 60 | `/facility` | 18 | Current Facility Settings | ✅ EXISTS | `SettingsView.tsx` (stub — was inline) | Preserve and synchronize facility metadata |
| 61 | `/biomedical` | 61 | Biomedical Equipment Care | ✅ EXISTS | `BiomedicalView.tsx` | Build equipment calibration logs & breakdown tickets |
| 62 | `/governance` | 62 | Clinical Governance & DR | 🔧 STUB | `GovernanceView.tsx` | Build DR runbook drill simulator & policy registry |
| 63 | `/operations` | 63 | Operations & Vendor Support | 🔧 STUB | `OperationsView.tsx` | Build vendor ticket manager with SLA countdowns |
| 64 | `/orchestration` | 47 | System Automation & HL7 | 🔧 STUB | `OrchestrationView.tsx` | Build hospital event bus & integration monitors |
| 65 | `/telemedicine` | 21 | Telemedicine & Virtual Care | ✅ EXISTS | `TelemedicineView.tsx` | Add Jitsi/Daily video room integration & chat log |
| 66 | `/blockchain` | 22 | Blockchain Audit Trail | ✅ EXISTS | `BlockchainView.tsx` | Synchronize immutable block verification & export |
| 67 | `/ai-analytics` | 23 | AI Operational Analytics | 🔧 STUB | `AiAnalyticsView.tsx` | Build readmission risk, bed demand & clinical alerts |
| 68 | `/ai-central` | 23 | Central AI Capability Center | 🔧 STUB | `AiCentralView.tsx` | Build AI model registry & clinical documentation assistant |
| 69 | `/ai-chat` | 23 | Interactive Clinical Assistant | 🔧 STUB | `AiChatView.tsx` | Build dedicated conversational clinical assistant page |
| 70 | `/executive` | 46 | Executive & C-Suite Dashboard | 🔧 STUB | `ExecutiveView.tsx` | Build hospital KPI metrics (ALOS, BOR, Rev/Bed, EBITDA) |
| 71 | `/reports` | 19 | Reporting & MOH Indicators | ✅ EXISTS | `ReportsView.tsx` | Build MOH 705/711 statutory report generators |
| 72 | `/users` | 20 | User Management & RBAC | ✅ EXISTS | `UserManagementView.tsx` | Synchronize role catalog, permissions & MFA reset |
| 73 | `/settings` | — | System & Branding Settings | 🔧 STUB | `SettingsView.tsx` | Align display density & live refresh configuration |
| 74 | `/portal` | 24 | Staff/Patient Shared Portal | 🔧 STUB | `PortalView.tsx` | Align portal access token & patient lookup |
| 75 | `/portal/appointments` | 24 | Portal Appointment Booking | 🔧 STUB | `PortalAppointmentsView.tsx` | Synchronize self-service patient slot request |
| 76 | `/patient-portal` | 24 | Patient Self-Service Portal | ✅ EXISTS | `PatientPortalView.tsx` | Synchronize lab results view & prescription history |
| 77 | `/patient-portal/appointments` | 24 | Self-Service Appointments | ⚠️ PARTIAL | `PatientPortalView.tsx` | Synchronize patient appointment booking flow |
| 78 | `/documents` | 57 | Document Management & OCR | 🔧 STUB | `DocumentsView.tsx` | Build categorized document repository & tag search |
| 79 | `/consent` | 54 | Digital Consent Management | 🔧 STUB | `ConsentView.tsx` | Build surgical consent templates & digital signatures |
| 80 | `/communication` | 58 | Hospital Broadcasts & Alerts | 🔧 STUB | `CommunicationView.tsx` | Build patient communication campaigns (SMS/WhatsApp) |
| 81 | `/messaging` | 58 | Messaging Notification Gateway | 🔧 STUB | `MessagingView.tsx` | Build delivery status tracker & SMS gateway balances |
| 82 | `/community-health` | 56 | Community Health Workers (CHW) | 🔧 STUB | `CommunityHealthView.tsx` | Build household register & disease surveillance |
| 83 | `/home-care` | 60 | Home Care & Remote Monitoring | 🔧 STUB | `HomeCareView.tsx` | Build patient visit checklist & vital logs |
| 84 | `/canteen` | 30 | Canteen & Dietary Management | ✅ EXISTS | `CanteenView.tsx` | Synchronize patient meal orders & kitchen prep board |
| 85 | `/feedback` | 31 | Patient Feedback & Net Promoter | ✅ EXISTS | `PatientFeedbackView.tsx` | Synchronize sentiment analysis & complaint resolution |
| 86 | `/helpdesk` | 29 | Internal IT & Facility Helpdesk | ✅ EXISTS | `HelpdeskView.tsx` | Synchronize ticket priorities, assignment & resolution |
| 87 | `/integrations` | 34 | External Systems Integration | ⚠️ PARTIAL | `IntegrationsView.tsx` (209 lines) | Synchronize M-Pesa, Pusher, FHIR & Cloudinary configs |
| 88 | `/migration` | 64 | Legacy Data Migration Center | ✅ EXISTS | `MigrationView.tsx` (stub) + `MigrationCenterView.tsx` | Preserve existing CSV mapper, dry-run & batch import |
| 89 | `/medical-director` | 43 | Medical Director Dashboard | 🔧 STUB | `MedicalDirectorView.tsx` | Build mortality audits, doctor credentialing & CDSS |
| 90 | `/analytics` | 19 | General BI Analytics | ✅ EXISTS | `AnalyticsView.tsx` | Synchronize department utilization charts |
| 91 | `/apps` | — | Module Launcher Grid | 🔧 STUB | `AppsView.tsx` | Align card hover states, badges & category tabs |
| 92 | `/[module]` | — | Dynamic Module Resolver | ✅ EXISTS | `App.tsx` activeNav=99 | Ensure all 66 module IDs resolve properly |
| 93 | `/cost-accounting` | 45 | Cost Category Tracking | 🔧 STUB | `CostAccountingView.tsx` | Synchronize overhead allocations & unit costing |
| 94 | `/diagnostics/lab` | 8 | Lab Diagnostics Routing | ✅ EXISTS | `LaboratoryView.tsx` | Keep synchronized with central lab |
| 95 | `/diagnostics/radiology` | 9 | Radiology Routing | ✅ EXISTS | `RadiologyView.tsx` | Keep synchronized with central radiology |
| 96 | `/ict` | 41 | ICT & Security Operations | 🔧 STUB | `IctView.tsx` | Build security dashboard & vulnerability tracking |
| 97 | `/setup` | — | First-time Setup | ✅ EXISTS | `App.tsx` FirstTimeSetupScreen | Align wizard steps |
| 98 | `/signup` | — | Facility Registration | 🔧 STUB | `SignupView.tsx` | Implement registration endpoint integration |

---

## 4. App.tsx Routing Blocker Analysis

> [!IMPORTANT]
> App.tsx uses a **numeric `activeNav` index** (not path-based routing) to dispatch views. The 35 new stub files exist in `src/views/` but are **not yet imported or wired** into App.tsx. Implementation agents must:
> 1. Import each new View file at the top of `App.tsx`
> 2. Add the corresponding `case` branch in the view-dispatch switch/conditional
> 3. Map the correct `moduleId` from `moduleCatalog.ts` to the new `activeNav` index

**Module IDs already in sync** — both catalogs are identical. No new IDs needed. The routing gap is purely a wiring issue in `App.tsx`.

**Partial views needing upgrade (not just wiring):**
- `ProcurementView.tsx` (45 lines) — nearly empty, needs full implementation
- `BloodBankView.tsx` (154 lines) — thin, needs donor registry & cross-match
- `IntegrationsView.tsx` (209 lines) — partial, needs M-Pesa/FHIR configs
- `FinanceView.tsx` (207 lines) — partial, needs full financial KPI dashboard

---

## 5. API Client & Networking Discrepancies

### 5.1 Comparison Summary
* **Base URL Alignment:** Both default to `http://localhost:3000` (`VITE_API_BASE_URL` in Desktop, `NEXT_PUBLIC_API_URL` in Frontend).
* **Missing Endpoints in Desktop:**
  * In Frontend, specialized modules directly invoke 729 distinct endpoint paths against `Medilink-Backend`.
  * Desktop directly implements approximately 300 endpoints in `apiClient.ts` and `App.tsx`, leaving 429 endpoints currently invoked only through generic fallback forms or missing entirely.
  * Key missing areas in Desktop:
    * `/cdss/*` (Clinical decision alerts, evaluating drug rules).
    * `/canteen/*` (Kitchen preparation board, diet orders, consumption logs).
    * `/consent/*` (Consent templates, signature verification, withdrawal reviews).
    * `/cost-accounting/*` (Cost center allocations, unit service costs).
    * `/dental/*` (Odontogram tooth charts, periodontal charts, treatment plans).
    * `/finance-accounting/statements/*` (Trial balance, profit & loss, cash flow).
    * `/icu/*` and `/nicu/*` (Specialized admission boards, vitals timelines, scoring).
    * `/maternity/*` (Pregnancy registrations, ANC records, deliveries, APGAR logs).
    * `/revenue-cycle/*` (Denial tracking, claims scrubbing, payer reconciliations).
    * `/security/*` (Break-glass active grants, session revocation, identity cards).

---

## 6. Desktop-Specific Native Capabilities to Preserve

During synchronization, the following native Desktop capabilities must remain intact:
1. **Tauri v2 Core Runtime:** Window controls, native min/max/close handlers, and process management.
2. **Rust Anti-Debugging Protection:** `has_suspicious_runtime_flags()` check in release builds.
3. **Signed In-App Auto-Updater:** GitHub Releases polling with Minisign public key verification (`tauri-plugin-updater`).
4. **Hardware Integrations:** Native thermal receipt printing for Pharmacy POS and Billing (`window.print` with Tauri fallback).
5. **Local Session Caching & Offline State:** Device ID fingerprinting, offline patient caching, and network recovery reconciliation.
6. **Live Inter-View Reactivity:** `HMIS_LIVE_REFRESH_EVENT` (`hmis:live-data-changed`) custom event and storage synchronization.

---

## Module wiring parity checkpoint — November 14, 2026

This checkpoint closes the largest structural gap between the Web reference and the Desktop shell: the audit previously confirmed that many dedicated view files existed but were never reachable from the desktop navigation. Wiring is now complete end-to-end.

### 1. Authoritative module registry

| Item | Before | After |
|---|---|---|
| Module-to-screen routing | Legacy `MODULE_ID_TO_NAV` table misaligned with `MODULE_CATALOG` (e.g. module 36 → ICU, module 37 → blank, module 42 collided with Migration) | `src/lib/moduleViewRegistry.tsx` maps every `MODULE_CATALOG` id to its screen; 65/65 catalogue ids covered |
| Dynamic module case | `case 99` resolved only `WORKFLOW_MODULE_BY_ID` (IDs 5–20 and 37–47), so newer modules fell back to “no access” | `case 99` resolves `MODULE_BY_ID` first, checks RBAC, then renders the registry screen |
| Fixed sidebar entries | Numbered nav cases 0–42 retained for Dashboard, Patients, Settings, Super Admin, Migration | Retained unchanged; all catalogue modules now open through nav 99 |

### 2. Backend-aligned RBAC

* `normalizeModuleIds` and the super-admin CSV parser now validate against `MODULE_CATALOG` instead of the narrower legacy workflow catalogue. This fixes valid backend module ids 23, 26, 27, 29, 30, 32, 33 and 35 being silently dropped from `/security/access/me` responses.
* `getAdminAllowedModules` now returns all catalogue ids instead of the legacy `ROLE_ALLOWED_MODULES` subset.
* Role gating on the client remains advisory; the backend `TenantGuard` / module permissions stay authoritative. No permission checks were removed.

### 3. Web → Desktop navigation bridge

`src/lib/navigation.tsx` now keeps a small subscribable route store that mirrors the parts of `next/navigation`, `next/link`, `useSearchParams` and `usePathname` used by the ported pages.

`App.tsx` listens for `hmis:navigate-path` and resolves paths in this order:

1. Dedicated sub-route registry (`/finance/journals`, `/facilities/work-orders`, `/inventory/purchase-orders`, `/portal/appointments`, `/patient-portal/appointments`, `/payroll`, `/apps`, `/ai-central`, `/ai-chat`, `/communication`).
2. Exact catalogue path (`MODULE_BY_PATH`).
3. Longest matching catalogue prefix (for example `/pharmacy/pos/123` → module 35).

`/settings` opens nav 12. Unknown paths are ignored rather than navigating to a blank screen.

### 4. Settings merge

Nav 12 now exposes two tabs: **Appearance & behaviour** (the existing desktop theme/typography/layout controls) and **Account & security** (the ported Web settings page with profile, password, notifications, display and active sessions). The Web page remains separate from the desktop-only controls, so neither set of capabilities was lost.

### 5. Tailwind v4 utility layer

Several newer Web pages (`nursing-admin`, `full-system-setup`, `portal`, etc.) are written with Tailwind utilities. Desktop previously had no Tailwind runtime, so those classes were inert.

* Added `postcss.config.mjs` with `@tailwindcss/postcss`.
* Added `src/tailwind.css` importing `tailwindcss/theme.css` and `tailwindcss/utilities.css` (no preflight) plus the `@theme` design tokens used by the Web client.
* Imported from `src/main.tsx` after `App.css`, preserving the existing desktop shell styles.
* Added `tailwindcss` and `@tailwindcss/postcss` to `package.json` for reproducible installs.

### 6. CSS parity sync

`/tmp/opencode/append_missing_css.py` compared the Web `globals.css` with Desktop `App.css` and appended only rules that were missing from Desktop, excluding `html`, `body`, `:root`, `*` and `@theme` so the desktop shell base is not reset.

| Metric | Value |
|---|---|
| Missing plain rules appended | 2,409 |
| Missing rules appended inside `@media`/`@supports` blocks | 194 |
| Missing keyframes appended | 9 |
| Desktop `App.css` after sync | ~67,000 lines, balanced braces |

Differing rules (currently 282) are intentionally **not** overwritten in this pass; they are shell-adjacent variants where Desktop has deliberately customised the presentation. They remain on the visual-verification list.

### 7. Remaining parity work

| Area | Remaining work |
|---|---|
| Runtime verification | Every module still needs a synthetic-tenant walkthrough against the matching Web route; source parity is not runtime sign-off |
| Ported screen polish | Some Web pages use Tailwind arbitrary values that depend on tokens not yet defined in Desktop; visual review required |
| CSS differing rules | 282 rules share a selector with a different Desktop declaration — review individually |
| Patients module | Desktop keeps its locally-owned `PatientsView` (patient state is shared with the shell); a dedicated port of the Web `/patients` page is still pending |
| Migration | Desktop uses the existing `MigrationCenterView` for module 64; the Web `/migration` page was reviewed but not replaced because the desktop component is already backend-wired |
| Auth-adjacent pages | `SetupView` and `SignupView` are ported but the native first-run/auth flow still uses the existing inline screens |
