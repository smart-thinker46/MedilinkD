# MEDILINK HMIS — FRONTEND TO DESKTOP PARITY AUDIT
**Reference Implementation:** `Medilink-Frontend` (Next.js 16 App Router, React 19, Tailwind CSS v4, Zustand)  
**Target Application:** `Medilink-Desktop` (Tauri v2, React 19, Vite 7, Zustand 5, Rust)  
**Authority Backend:** `Medilink-Backend` (NestJS 11, PostgreSQL, Prisma ORM 448 models)  
**Audit Date:** November 8, 2026  
**Status:** Baseline Comparative Audit Completed  

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

## 1. Executive Summary & Architecture Baseline

### 1.1 Objective
Establish complete functional, visual, architectural, and data parity between `Medilink-Desktop` and the updated `Medilink-Frontend` reference application without modifying `Medilink-Frontend` or compromising Tauri native capabilities.

### 1.2 Core Architectural Divergence
* **`Medilink-Frontend`:** Structured around modern Next.js 16 App Router (`src/app/*`) with 95 distinct route pages, a modular shell architecture (`AppShell`, `DashboardLayout`, `Sidebar`, `Topbar`, `OrderInbox`, `RecordDrawer`, `TableInteractionLayer`), Lucide React icons, Tailwind CSS v4 styling, and granular Axios API interceptors.
* **`Medilink-Desktop`:** Currently organized as a high-density single-file monolithic structure (`src/App.tsx` with 16,457 lines, and `WorkflowModuleView.tsx` with 31,380 lines) running on Tauri v2 + Vite 7. While it features working implementations of core workflows (Patient registration, Appointments, basic Billing, Pharmacy, Migration Center), over 50 specialized HMIS modules currently fall back to a generic multi-stage workflow runner instead of the dedicated, rich clinical dashboards present in the web reference.
* **Component Architecture:** Frontend uses reusable component libraries (`src/components/clinical/`, `src/components/diagnostics/`, `src/components/layout/`), whereas Desktop duplicates large blocks of JSX, form fields, and modal states inside `App.tsx`.

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
* **MATCH (M):** Exists in Desktop with visual and functional parity.
* **PARTIAL (P):** Exists in Desktop but has outdated layout, missing actions, or uses generic `WorkflowModuleView` fallback.
* **MISSING (X):** Route/screen does not exist or has no dedicated view in Desktop.

| # | Route in Frontend | Module ID | Screen Name & Purpose | Desktop Status | Existing Desktop Implementation | Required Action |
|---|---|---|---|---|---|---|
| 1 | `/` | — | Root landing redirect | M | `SplashScreen` -> `AuthLanding` | Preserve desktop boot flow & splash |
| 2 | `/landing` | — | Marketing / Auth landing | M | `AuthLanding` in `App.tsx` | Align typography & theme switcher |
| 3 | `/login` | — | Hospital Admin login | M | `HospitalLoginScreen` | Align form validation & token rotation |
| 4 | `/login/staff` | — | Clinical staff login | M | `StaffLoginScreen` | Align facility code selection & MFA |
| 5 | `/signup` | — | Self-registration portal | P | Handled via setup wizard | Reconcile registration workflow |
| 6 | `/setup` | — | Initial facility onboarding | M | `FirstTimeSetupScreen` | Match multi-step wizard fields |
| 7 | `/full-system-setup`| — | Complete enterprise setup | P | Partial in admin settings | Port full system configuration steps |
| 8 | `/patients` | 1 | Patient Registration & Registry | P | Dedicated `PatientsView` in `App.tsx` | Synchronize PatientDrawer, insurance verify, MPI merge |
| 9 | `/appointments` | 4 | Appointment Scheduling | P | Dedicated `AppointmentsView` in `App.tsx` | Add slot booking calendar & telemedicine link |
| 10| `/queue` | 28 | Central Queue Management | P | Dedicated `QueueManagementView` | Synchronize counter sessions & priority override |
| 11| `/opd` | 36 | Outpatient Consultation & Triage | P | Merged in `OPDOTView` / `WorkflowModuleView` | Build dedicated OPD Consultation dashboard with ICD-10 |
| 12| `/ipd` | 2 | Inpatient (IPD) Management | P | `WorkflowModuleView` fallback (ID 2) | Implement dedicated Inpatient bed board & care plan |
| 13| `/ipd/[id]` | 2 | Inpatient Admission Detail | X | None (generic table row click) | Build admission detail slide-over / drawer |
| 14| `/emergency` | 25 | Emergency & Trauma Unit | P | Dedicated `EmergencyView` in `App.tsx` | Synchronize triage acuity scoring (Manchester/ESI) |
| 15| `/ambulance` | 26 | Ambulance Fleet & Dispatch | P | Dedicated `AmbulanceView` in `App.tsx` | Add GPS log dispatch & fuel billing integration |
| 16| `/wards` | 5 | Wards & Bed Allocation | P | Dedicated `WardView` in `App.tsx` | Synchronize bed graphical grid & ward transfers |
| 17| `/maternity` | 37 | Maternity & Obstetrics | P | `WorkflowModuleView` fallback (ID 37) | Implement dedicated ANC, Labor & Delivery dashboard |
| 18| `/maternity/[pregnancyId]` | 37 | Pregnancy Episode Detail | X | None | Build pregnancy clinical timeline & APGAR logger |
| 19| `/icu` | 38 | Intensive Care Unit (ICU) | P | `WorkflowModuleView` fallback (ID 38) | Build dedicated ICU monitoring & APACHE score dashboard |
| 20| `/nicu` | 51 | Neonatal ICU (NICU) | P | `WorkflowModuleView` fallback (ID 51) | Build dedicated NICU incubator & phototherapy dashboard |
| 21| `/ot` | 11 | Operation Theatre Management | P | Merged in `OPDOTView` / `OTView` | Build dedicated OT surgical schedule & WHO checklist |
| 22| `/mortuary` | 27 | Mortuary & Deceased Tracking | P | Dedicated `MortuaryView` in `App.tsx` | Add freezer allocation & autopsy release flow |
| 23| `/referrals` | 55 | Inter-facility Referrals | P | `WorkflowModuleView` fallback (ID 55) | Build dedicated incoming/outgoing referral dashboard |
| 24| `/ehr` | 6 | EMR & Medical Records | P | Dedicated `EHRView` in `App.tsx` | Synchronize clinical note templates & allergy alerts |
| 25| `/ehr/[patientId]` | 6 | Patient Longitudinal Record | X | None (inline search modal) | Build full longitudinal patient timeline view |
| 26| `/cdss` | 48 | Clinical Decision Support | P | `WorkflowModuleView` fallback (ID 48) | Build dedicated rule monitor & alert action center |
| 27| `/nursing` | 7 | Nursing Care & Vitals | P | Dedicated `NursingView` in `App.tsx` | Synchronize MedAdmin 5-Rights & nursing care plans |
| 28| `/nursing-admin` | 42 | Nursing Administration / Matron| P | `WorkflowModuleView` fallback (ID 42) | Build staffing ratios & shift incident monitor |
| 29| `/lab` | 8 | Laboratory Diagnostics | P | Dedicated `LaboratoryView` in `App.tsx` | Synchronize specimen accessioning & critical values |
| 30| `/radiology` | 9 | Radiology & PACS Imaging | P | Dedicated `DiagnosticsView` in `App.tsx` | Add study timeline & critical radiology alerts |
| 31| `/pharmacy` | 10 | Pharmacy Operations | P | Dedicated `PharmacyView` in `App.tsx` | Synchronize prescription review & dispensing |
| 32| `/pharmacy/[sub]` | 10 | Pharmacy Sub-Inventories | X | None | Support satellite & floor pharmacy routing |
| 33| `/pharmacy/dispense/[id]`| 10 | Dispense Execution Screen | X | None (inline modal) | Build full prescription dispense verification screen |
| 34| `/pharmacy/pos` | 35 | Pharmacy Retail POS | P | Basic sale modal in `WorkflowModuleView` | Build retail checkout with barcode, cart & receipt print |
| 35| `/blood-bank` | 12 | Blood Bank & Transfusion | P | Dedicated `BloodBankView` in `App.tsx` | Synchronize donor registry & cross-match workflow |
| 36| `/clinical-research` | 32 | Clinical Trials & Research | P | `WorkflowModuleView` fallback (ID 32) | Build protocol registry & adverse event reporting |
| 37| `/quality-assurance` | 33 | Quality Assurance & Audits | P | Dedicated `QualityAssuranceView` | Add root cause analysis & accreditation checklist |
| 38| `/physiotherapy` | 49 | Physiotherapy & Rehab | P | `WorkflowModuleView` fallback (ID 49) | Build rehab assessment & range-of-motion charts |
| 39| `/nutrition` | 50 | Nutrition & Dietetics | P | `WorkflowModuleView` fallback (ID 50) | Build clinical nutrition plans & enteral feeding logs |
| 40| `/dental` | 52 | Dental Clinic & Odontogram | P | `WorkflowModuleView` fallback (ID 52) | Build interactive tooth chart (odontogram) & treatment plan |
| 41| `/infection-control` | 53 | Infection Control & CSSD | P | `WorkflowModuleView` fallback (ID 53) | Build autoclave sterilization & surveillance tracker |
| 42| `/paediatrics` | 59 | Paediatric Medicine | P | `WorkflowModuleView` fallback (ID 59) | Build WHO growth percentile charts & immunization |
| 43| `/billing` | 13 | Patient Billing & Invoicing | P | Dedicated `BillingView` in `App.tsx` | Add invoice lifecycle, discounts, and payment modal |
| 44| `/insurance` | 14 | Insurance Pre-auth & Claims | P | Dedicated `InsuranceView` in `App.tsx` | Synchronize claim submissions & pre-auth approvals |
| 45| `/revenue` | 44 | Revenue Cycle Management (RCM) | P | `WorkflowModuleView` fallback (ID 44) | Build claims scrubbing, denial tracking & AR aging |
| 46| `/accounting` | 39 | General Ledger & Accounting | P | `WorkflowModuleView` fallback (ID 39) | Build Chart of Accounts, Journal entries & Trial Balance |
| 47| `/finance` | 39 | Financial Overview Dashboard | P | Basic summary in `BillingView` | Build executive financial summary dashboard |
| 48| `/finance/journals` | 39 | Journal Voucher System | X | None | Build double-entry debit/credit ledger posting |
| 49| `/cost-accounting` | 45 | Cost Centers & Unit Costing | P | `WorkflowModuleView` fallback (ID 45) | Build departmental cost allocation & profitability |
| 50| `/inventory` | 15 | Central Inventory & Stores | P | Dedicated `InventoryView` in `App.tsx` | Synchronize stock movements, batch tracking & expiry |
| 51| `/inventory/purchase-orders` | 15 | Purchase Order Tracking | P | Merged in `ProcurementView` | Build dedicated PO lifecycle & approval dashboard |
| 52| `/procurement` | 15 | Procurement & Suppliers | P | Dedicated `ProcurementView` in `App.tsx` | Synchronize supplier evaluation & quotation bids |
| 53| `/hr` | 16 | Human Resources Operations | P | Dedicated `HRView` in `App.tsx` | Synchronize employee lifecycle, leaves & attendance |
| 54| `/hr/payroll` | 66 | Staff Payroll Calculation | P | Basic summary in `HRView` | Build Kenya statutory deduction (PAYE/SHA/NSSF) run |
| 55| `/payroll` | 66 | Payroll Management | P | Merged in `HRView` | Synchronize payslip generation & bank payment batch |
| 56| `/workforce-planning` | 40 | Workforce Shift Roster | P | `WorkflowModuleView` fallback (ID 40) | Build nurse shift scheduling & staffing ratio forecasts |
| 57| `/doctors` | 17 | Doctor Directory & Credentialing| P | Dedicated `DoctorView` in `App.tsx` | Synchronize CME credits, license renewal & OPD schedule |
| 58| `/facilities` | 18 | Multi-facility Asset Mgmt | P | Dedicated `FacilityView` in `App.tsx` | Synchronize equipment maintenance & compliance checks |
| 59| `/facilities/work-orders` | 18 | Maintenance Work Orders | X | None | Build work order assignment & SLA tracking |
| 60| `/facility` | 18 | Current Facility Settings | M | `SettingsView` facility tab | Preserve and synchronize facility metadata |
| 61| `/biomedical` | 61 | Biomedical Equipment Care | P | `WorkflowModuleView` fallback (ID 61) | Build equipment calibration logs & breakdown tickets |
| 62| `/governance` | 62 | Clinical Governance & DR | P | `WorkflowModuleView` fallback (ID 62) | Build DR runbook drill simulator & policy registry |
| 63| `/operations` | 63 | Operations & Vendor Support | P | `WorkflowModuleView` fallback (ID 63) | Build vendor ticket manager with SLA countdowns |
| 64| `/orchestration` | 47 | System Automation & HL7 | P | `WorkflowModuleView` fallback (ID 47) | Build hospital event bus & integration monitors |
| 65| `/telemedicine` | 21 | Telemedicine & Virtual Care | P | Dedicated `TelemedicineView` in `App.tsx` | Add Jitsi/Daily video room integration & chat log |
| 66| `/blockchain` | 22 | Blockchain Audit Trail | P | Dedicated `BlockchainView` in `App.tsx` | Synchronize immutable block verification & export |
| 67| `/ai-analytics` | 23 | AI Operational Analytics | P | Merged in `AISuiteView` | Build readmission risk, bed demand & clinical alerts |
| 68| `/ai-central` | 23 | Central AI Capability Center | P | Basic chatbot in `AISuiteView` | Build AI model registry & clinical documentation assistant |
| 69| `/ai-chat` | 23 | Interactive Clinical Assistant | P | Floating help widget | Build dedicated conversational clinical assistant page |
| 70| `/executive` | 46 | Executive & C-Suite Dashboard | P | Basic analytics in `AnalyticsView` | Build hospital KPI metrics (ALOS, BOR, Rev/Bed, EBITDA)|
| 71| `/reports` | 19 | Reporting & MOH Indicators | P | Dedicated `AnalyticsView` in `App.tsx` | Build MOH 705/711 statutory report generators |
| 72| `/users` | 20 | User Management & RBAC | P | Dedicated `UserManagementView` | Synchronize role catalog, permissions & MFA reset |
| 73| `/settings` | 12 | System & Branding Settings | M | Dedicated `SettingsView` in `App.tsx` | Align display density & live refresh configuration |
| 74| `/portal` | 24 | Staff/Patient Shared Portal | P | Dedicated `PatientPortalView` | Align portal access token & patient lookup |
| 75| `/portal/appointments`| 24 | Portal Appointment Booking | X | None | Synchronize self-service patient slot request |
| 76| `/patient-portal` | 24 | Patient Self-Service Portal | P | Merged with ID 24 | Synchronize lab results view & prescription history |
| 77| `/patient-portal/appointments`| 24| Self-Service Appointments | X | None | Synchronize patient appointment booking flow |
| 78| `/documents` | 57 | Document Management & OCR | P | `WorkflowModuleView` fallback (ID 57) | Build categorized document repository & tag search |
| 79| `/consent` | 54 | Digital Consent Management | P | `WorkflowModuleView` fallback (ID 54) | Build surgical consent templates & digital signatures |
| 80| `/communication` | 58 | Hospital Broadcasts & Alerts | P | Merged in announcements | Build patient communication campaigns (SMS/WhatsApp) |
| 81| `/messaging` | 58 | Messaging Notification Gateway | P | `WorkflowModuleView` fallback (ID 58) | Build delivery status tracker & SMS gateway balances |
| 82| `/community-health` | 56 | Community Health Workers (CHW) | P | `WorkflowModuleView` fallback (ID 56) | Build household register & disease surveillance |
| 83| `/home-care` | 60 | Home Care & Remote Monitoring | P | `WorkflowModuleView` fallback (ID 60) | Build patient visit checklist & vital logs |
| 84| `/canteen` | 30 | Canteen & Dietary Management | P | Dedicated `CanteenView` in `App.tsx` | Synchronize patient meal orders & kitchen prep board |
| 85| `/feedback` | 31 | Patient Feedback & Net Promoter| P | Dedicated `PatientFeedbackView` | Synchronize sentiment analysis & complaint resolution |
| 86| `/helpdesk` | 29 | Internal IT & Facility Helpdesk | P | Dedicated `HelpdeskView` in `App.tsx` | Synchronize ticket priorities, assignment & resolution |
| 87| `/integrations` | 34 | External Systems Integration | P | Dedicated `ExternalIntegrationsView` | Synchronize M-Pesa, Pusher, FHIR & Cloudinary configs |
| 88| `/migration` | 64 | Legacy Data Migration Center | M | Dedicated `MigrationCenterView.tsx` | Preserve existing CSV mapper, dry-run & batch import |
| 89| `/medical-director` | 43 | Medical Director Dashboard | P | `WorkflowModuleView` fallback (ID 43) | Build mortality audits, doctor credentialing & CDSS |
| 90| `/analytics` | 19 | General BI Analytics | P | Merged in `AnalyticsView` | Synchronize department utilization charts |
| 91| `/apps` | — | Module Launcher Grid | M | Default Dashboard (Nav 0) in `App.tsx` | Align card hover states, badges & category tabs |
| 92| `/[module]` | — | Dynamic Module Resolver | M | Handled via `activeNav = 99` | Ensure all 66 module IDs resolve properly |
| 93| `/cost-accounting` | 45 | Cost Category Tracking | P | `WorkflowModuleView` fallback (ID 45) | Synchronize overhead allocations & unit costing |
| 94| `/diagnostics/lab` | 8 | Lab Diagnostics Routing | M | Handled via `LaboratoryView` | Keep synchronized with central lab |
| 95| `/diagnostics/radiology`| 9 | Radiology Routing | M | Handled via `DiagnosticsView` | Keep synchronized with central radiology |

---

## 4. API Client & Networking Discrepancies

### 4.1 Comparison Summary
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

## 5. Desktop-Specific Native Capabilities to Preserve

During synchronization, the following native Desktop capabilities must remain intact:
1. **Tauri v2 Core Runtime:** Window controls, native min/max/close handlers, and process management.
2. **Rust Anti-Debugging Protection:** `has_suspicious_runtime_flags()` check in release builds.
3. **Signed In-App Auto-Updater:** GitHub Releases polling with Minisign public key verification (`tauri-plugin-updater`).
4. **Hardware Integrations:** Native thermal receipt printing for Pharmacy POS and Billing (`window.print` with Tauri fallback).
5. **Local Session Caching & Offline State:** Device ID fingerprinting, offline patient caching, and network recovery reconciliation.
6. **Live Inter-View Reactivity:** `HMIS_LIVE_REFRESH_EVENT` (`hmis:live-data-changed`) custom event and storage synchronization.
