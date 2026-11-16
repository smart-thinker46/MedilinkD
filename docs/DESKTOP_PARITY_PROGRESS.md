# MEDILINK HMIS — DESKTOP PARITY PROGRESS TRACKER
**Reference Implementation:** `Medilink-Frontend`  
**Target Application:** `Medilink-Desktop`  
**Last Updated:** November 13, 2026 — Stub scaffold applied  

**Status Legend:**  
* `NOT STARTED` — Stub exists but work has not begun on this screen.
* `IN PROGRESS` — Implementation currently active.
* `IMPLEMENTED` — UI and API integration implemented in Desktop.
* `TESTED` — Static and runtime tests passed.
* `VERIFIED` — Visual and functional parity confirmed against Frontend.
* `BLOCKED` — Waiting on external dependency or backend capability.

> [!IMPORTANT]
> **Verification checkpoint (November 9, 2026):** Existing `IMPLEMENTED` entries are source-inventory assertions, not retrospective runtime sign-off. No entry may be changed to `TESTED` or `VERIFIED` until it has been exercised against the backend using synthetic, tenant-scoped data and compared with the matching Web route. See `DESKTOP_QA_REPORT.md` for the evidence currently available.

> [!NOTE]
> **Stub checkpoint (November 13, 2026):** 35 view files created as stubs by the audit agent. Entries previously claiming `IMPLEMENTED` status for modules that only had `WorkflowModuleView` fallback or no dedicated file are reset to `NOT STARTED` for honest tracking. Pre-existing substantive views retain their prior status.

---

## Screen-by-Screen Progress Matrix

| # | Route | Module ID | Screen / Feature | Status | View File | Notes & Functional Gaps |
|---|---|---|---|---|---|---|
| 1 | `/` | — | Root Splash Screen | TESTED | `App.tsx` | Existing Tauri splash screen operational |
| 2 | `/landing` | — | Auth / Marketing Landing | IMPLEMENTED | `App.tsx` | Aligned with theme selection |
| 3 | `/login` | — | Hospital Admin Login | IMPLEMENTED | `App.tsx` | JWT authentication and session handling active |
| 4 | `/login/staff` | — | Staff Login | IMPLEMENTED | `App.tsx` | Role key and facility code selection active |
| 5 | `/signup` | — | Facility Self-Registration | NOT STARTED | `SignupView.tsx` | Stub created; needs registration endpoint wiring |
| 6 | `/setup` | — | First Time Setup Wizard | IMPLEMENTED | `App.tsx` | Multi-step setup wizard verified |
| 7 | `/full-system-setup` | — | Full Enterprise Setup | NOT STARTED | `FullSystemSetupView.tsx` | Stub created; partial was in admin settings |
| 8 | `/patients` | 1 | Patient Registration | IMPLEMENTED | `App.tsx` PatientsView | Full PatientDrawer, MPI merge, insurance verify |
| 9 | `/appointments` | 4 | Appointments | NOT STARTED | `AppointmentsView.tsx` | Stub created; slot calendar & telemedicine link needed |
| 10 | `/queue` | 28 | Queue Management | IMPLEMENTED | `QueueManagementView.tsx` | Live queue board, counter session, priority override |
| 11 | `/opd` | 36 | Outpatient Consultation | IMPLEMENTED | `OpdDashboardView.tsx` | Triage, SOAP notes, ICD-10, CDSS, inline orders |
| 12 | `/ipd` | 2 | Inpatient (IPD) | IMPLEMENTED | `IpdView.tsx` | Dedicated IPD bed board & admissions |
| 13 | `/ipd/[id]` | 2 | Inpatient Admission Detail | IMPLEMENTED | `IpdView.tsx` | Admission detail slide-over drawer |
| 14 | `/emergency` | 25 | Emergency & Trauma | IMPLEMENTED | `EmergencyView.tsx` | Acuity scoring (ESI/Manchester) |
| 15 | `/ambulance` | 26 | Ambulance Fleet & Dispatch | IMPLEMENTED | `AmbulanceView.tsx` | GPS logs & fuel billing |
| 16 | `/wards` | 5 | Wards & Bed Allocation | IMPLEMENTED | `WardView.tsx` | Graphical bed allocation grid |
| 17 | `/maternity` | 37 | Maternity & Obstetrics | IMPLEMENTED | `MaternityView.tsx` | ANC, Labor & Delivery tracking |
| 18 | `/maternity/[pregnancyId]` | 37 | Pregnancy Episode Detail | IMPLEMENTED | `MaternityView.tsx` | Clinical timeline & APGAR logs |
| 19 | `/icu` | 38 | Intensive Care Unit | IMPLEMENTED | `IcuView.tsx` | Ventilator parameters & APACHE score |
| 20 | `/nicu` | 51 | Neonatal ICU | IMPLEMENTED | `NicuView.tsx` | Incubator logs & phototherapy tracker |
| 21 | `/ot` | 11 | Operation Theatre | IMPLEMENTED | `OtView.tsx` | Surgical schedule & WHO checklist |
| 22 | `/mortuary` | 27 | Mortuary & Deceased | IMPLEMENTED | `MortuaryView.tsx` | Freezer allocation & release flow |
| 23 | `/referrals` | 55 | Inter-facility Referrals | IMPLEMENTED | `ReferralsView.tsx` | Incoming/outgoing referral tracker |
| 24 | `/ehr` | 6 | EMR & Medical Records | IMPLEMENTED | `EhrView.tsx` | SOAP notes & clinical timeline |
| 25 | `/ehr/[patientId]` | 6 | Longitudinal Patient Record | IMPLEMENTED | `EhrView.tsx` | Dedicated longitudinal patient view |
| 26 | `/cdss` | 48 | Clinical Decision Support | IMPLEMENTED | `CdssView.tsx` | Rule monitor & drug-drug alerts |
| 27 | `/nursing` | 7 | Nursing Care & Vitals | IMPLEMENTED | `NursingView.tsx` | eMAR 5-rights & care plans |
| 28 | `/nursing-admin` | 42 | Nursing Admin / Matron | NOT STARTED | `NursingAdminView.tsx` | Stub created; staffing ratio calculations needed |
| 29 | `/lab` | 8 | Laboratory Diagnostics | IMPLEMENTED | `LaboratoryView.tsx` | Specimen accessioning & critical flags |
| 30 | `/radiology` | 9 | Radiology & PACS Imaging | IMPLEMENTED | `RadiologyView.tsx` | PACS study viewer & critical alerts |
| 31 | `/pharmacy` | 10 | Pharmacy Operations | IMPLEMENTED | `PharmacyView.tsx` | Prescription verification & dispensing |
| 32 | `/pharmacy/[sub]` | 10 | Satellite Pharmacies | IMPLEMENTED | `PharmacyView.tsx` | Satellite inventory routing |
| 33 | `/pharmacy/dispense/[id]` | 10 | Dispense Execution Screen | IMPLEMENTED | `PharmacyView.tsx` | Dedicated dispensing verification |
| 34 | `/pharmacy/pos` | 35 | Pharmacy Retail POS | IMPLEMENTED | `PharmacyPosView.tsx` | Retail checkout, M-Pesa & receipt print |
| 35 | `/blood-bank` | 12 | Blood Bank & Transfusion | IN PROGRESS | `BloodBankView.tsx` | Thin (154 lines); donor registry & cross-matching needed |
| 36 | `/clinical-research` | 32 | Clinical Research | NOT STARTED | `ClinicalResearchView.tsx` | Stub created; protocol registry needed |
| 37 | `/quality-assurance` | 33 | Quality Assurance | IMPLEMENTED | `QualityAssuranceView.tsx` | Root cause analysis & audits |
| 38 | `/physiotherapy` | 49 | Physiotherapy & Rehab | IMPLEMENTED | `PhysiotherapyView.tsx` | ROM charts & functional progress |
| 39 | `/nutrition` | 50 | Nutrition & Dietetics | IMPLEMENTED | `NutritionView.tsx` | Nutritional plans & enteral logs |
| 40 | `/dental` | 52 | Dental & Odontogram | IMPLEMENTED | `DentalView.tsx` | Interactive tooth chart & treatments |
| 41 | `/infection-control` | 53 | Infection Control & CSSD | IMPLEMENTED | `InfectionControlView.tsx` | Autoclave batches & HAI monitoring |
| 42 | `/paediatrics` | 59 | Paediatric Medicine | IMPLEMENTED | `PaediatricsView.tsx` | WHO growth charts & immunizations |
| 43 | `/billing` | 13 | Patient Billing | IMPLEMENTED | `BillingView.tsx` | Invoice lifecycle, waivers, M-Pesa |
| 44 | `/insurance` | 14 | Insurance Pre-auth & Claims | IMPLEMENTED | `InsuranceView.tsx` | Claim submission & pre-auth |
| 45 | `/revenue` | 44 | Revenue Cycle Management | NOT STARTED | `RevenueView.tsx` | Stub created; claims scrubbing & denial tracking needed |
| 46 | `/accounting` | 39 | General Ledger | NOT STARTED | `AccountingView.tsx` | Stub created; Chart of Accounts & Trial Balance needed |
| 47 | `/finance` | 39 | Financial Dashboard | IN PROGRESS | `FinanceView.tsx` | Thin (207 lines); full financial KPI overview needed |
| 48 | `/finance/journals` | 39 | Journal Vouchers | NOT STARTED | `FinanceJournalsView.tsx` | Stub created; double-entry debit/credit vouchers needed |
| 49 | `/cost-accounting` | 45 | Cost Accounting | NOT STARTED | `CostAccountingView.tsx` | Stub created; cost center profitability needed |
| 50 | `/inventory` | 15 | Central Inventory | IMPLEMENTED | `InventoryView.tsx` | Multi-store inventory & batch tracking |
| 51 | `/inventory/purchase-orders` | 15 | Purchase Orders | NOT STARTED | `InventoryPurchaseOrdersView.tsx` | Stub created; dedicated PO lifecycle needed |
| 52 | `/procurement` | 15 | Procurement | IN PROGRESS | `ProcurementView.tsx` | Very thin (45 lines); supplier bids & evaluations needed |
| 53 | `/hr` | 16 | Human Resources | IMPLEMENTED | `HrView.tsx` | Employee records, leave, attendance |
| 54 | `/hr/payroll` | 66 | Payroll Calculation | NOT STARTED | `PayrollView.tsx` | Stub created; Kenyan statutory deductions needed |
| 55 | `/payroll` | 66 | Payroll Management | NOT STARTED | `PayrollView.tsx` | Stub created; payslip generation & batch payments needed |
| 56 | `/workforce-planning` | 40 | Workforce Shift Roster | NOT STARTED | `WorkforcePlanningView.tsx` | Stub created; shift roster & staffing forecasts needed |
| 57 | `/doctors` | 17 | Doctor Directory | IMPLEMENTED | `DoctorsView.tsx` | CME credits & OPD schedule |
| 58 | `/facilities` | 18 | Multi-facility Asset Mgmt | IMPLEMENTED | `FacilitiesView.tsx` | Maintenance requests & compliance |
| 59 | `/facilities/work-orders` | 18 | Work Orders | NOT STARTED | `FacilitiesWorkOrdersView.tsx` | Stub created; work order assignment & SLA needed |
| 60 | `/facility` | 18 | Facility Metadata | IMPLEMENTED | `SettingsView.tsx` (stub+legacy) | Synchronized in SettingsView; facility tab |
| 61 | `/biomedical` | 61 | Biomedical Equipment | IMPLEMENTED | `BiomedicalView.tsx` | Calibration logs & breakdown tracking |
| 62 | `/governance` | 62 | Clinical Governance & DR | NOT STARTED | `GovernanceView.tsx` | Stub created; DR runbook drill simulator needed |
| 63 | `/operations` | 63 | Operations Support | NOT STARTED | `OperationsView.tsx` | Stub created; support ticketing & SLA counters needed |
| 64 | `/orchestration` | 47 | System Automation & HL7 | NOT STARTED | `OrchestrationView.tsx` | Stub created; HL7 monitors & event triggers needed |
| 65 | `/telemedicine` | 21 | Telemedicine | IMPLEMENTED | `TelemedicineView.tsx` | Jitsi/Daily room launcher & chat |
| 66 | `/blockchain` | 22 | Blockchain Audit Trail | IMPLEMENTED | `BlockchainView.tsx` | Block verification & audit exports |
| 67 | `/ai-analytics` | 23 | AI Operational Analytics | IMPLEMENTED | `AiAnalyticsView.tsx` | Ported; 8 dashboard endpoints, 3 pie charts, care-action + feedback mutations |
| 68 | `/ai-central` | 23 | Central AI Capability | IMPLEMENTED | `AiCentralView.tsx` | Ported; 3 tabs, 6 gateway endpoints, governance panel |
| 69 | `/ai-chat` | 23 | Clinical AI Assistant | IMPLEMENTED | `AiChatView.tsx` | Ported; message list, compose, read-only disclaimer |
| 70 | `/executive` | 46 | Executive C-Suite Dashboard | NOT STARTED | `ExecutiveView.tsx` | Stub created; ALOS, BOR, Rev/Bed, EBITDA KPIs needed |
| 71 | `/reports` | 19 | MOH & Statutory Reports | IMPLEMENTED | `ReportsView.tsx` | MOH 705/711 statutory reports |
| 72 | `/users` | 20 | User Management & RBAC | IMPLEMENTED | `UserManagementView.tsx` | Permissions matrix & MFA reset |
| 73 | `/settings` | — | System Settings | NOT STARTED | `SettingsView.tsx` | Stub created; theme, density, refresh preferences needed |
| 74 | `/portal` | 24 | Shared Portal Gateway | NOT STARTED | `PortalView.tsx` | Stub created; portal lookup & credentials needed |
| 75 | `/portal/appointments` | 24 | Portal Booking | NOT STARTED | `PortalAppointmentsView.tsx` | Stub created; patient self-service booking needed |
| 76 | `/patient-portal` | 24 | Patient Portal | IMPLEMENTED | `PatientPortalView.tsx` | Online lab reports & bills |
| 77 | `/patient-portal/appointments` | 24 | Self-Service Appointments | IMPLEMENTED | `PatientPortalView.tsx` | Appointment request calendar |
| 78 | `/documents` | 57 | Document Management | NOT STARTED | `DocumentsView.tsx` | Stub created; categorized repository & tags needed |
| 79 | `/consent` | 54 | Digital Consent | NOT STARTED | `ConsentView.tsx` | Stub created; surgical consent & digital sign needed |
| 80 | `/communication` | 58 | Hospital Broadcasts | NOT STARTED | `CommunicationView.tsx` | Stub created; SMS & WhatsApp broadcast needed |
| 81 | `/messaging` | 58 | Messaging Gateway | NOT STARTED | `MessagingView.tsx` | Stub created; SMS balance & delivery logs needed |
| 82 | `/community-health` | 56 | Community Health Workers | NOT STARTED | `CommunityHealthView.tsx` | Stub created; household mapping & surveillance needed |
| 83 | `/home-care` | 60 | Home Care | NOT STARTED | `HomeCareView.tsx` | Stub created; field visit logs & remote vitals needed |
| 84 | `/canteen` | 30 | Canteen & Dietary | IMPLEMENTED | `CanteenView.tsx` | Patient meal orders & kitchen board |
| 85 | `/feedback` | 31 | Patient Feedback & NPS | IMPLEMENTED | `PatientFeedbackView.tsx` | Sentiment analysis & resolutions |
| 86 | `/helpdesk` | 29 | Internal IT Helpdesk | IMPLEMENTED | `HelpdeskView.tsx` | Support tickets & SLA tracking |
| 87 | `/integrations` | 34 | External Integrations | IN PROGRESS | `IntegrationsView.tsx` | Thin (209 lines); M-Pesa, Pusher, FHIR configs needed |
| 88 | `/migration` | 64 | Data Migration Center | IMPLEMENTED | `MigrationCenterView.tsx` | CSV mapper, dry-run, batch import |
| 89 | `/medical-director` | 43 | Medical Director Dashboard | NOT STARTED | `MedicalDirectorView.tsx` | Stub created; mortality reviews & credentialing needed |
| 90 | `/analytics` | 19 | BI Analytics | IMPLEMENTED | `AnalyticsView.tsx` | Department utilization charts |
| 91 | `/apps` | — | Module Launcher Grid | NOT STARTED | `AppsView.tsx` | Stub created; categorized card grid needed |
| 92 | `/[module]` | — | Dynamic Module Resolver | IMPLEMENTED | `App.tsx` activeNav=99 | Fallback module resolver active |
| 93 | `/cost-accounting` | 45 | Unit Costing | NOT STARTED | `CostAccountingView.tsx` | Stub created; activity-based costing needed |
| 94 | `/diagnostics/lab` | 8 | Lab Diagnostics Routing | IMPLEMENTED | `LaboratoryView.tsx` | Centralized lab router |
| 95 | `/diagnostics/radiology` | 9 | Radiology Routing | IMPLEMENTED | `RadiologyView.tsx` | Centralized radiology router |
| 96 | `/ict` | 41 | ICT & Security Operations | NOT STARTED | `IctView.tsx` | Stub created; security dashboard & vulnerability tracking needed |
| 97 | `/signup` | — | Facility Registration | NOT STARTED | `SignupView.tsx` | Stub created; registration endpoint integration needed |
| 98 | `/patient-registration` | 1 | Patient Registration (dedicated) | NOT STARTED | `PatientRegistrationView.tsx` | Stub created; migrate from App.tsx PatientsView inline |

---

## Summary Counts (November 13, 2026)

| Status | Count |
|---|---|
| ✅ TESTED / VERIFIED | 1 |
| ✅ IMPLEMENTED | 42 |
| 🔄 IN PROGRESS | 4 |
| 🔧 NOT STARTED (new stubs) | 35 |
| ❌ BLOCKED | 0 |
| **Total routes tracked** | **98** |

---

## Wiring & port checkpoint — November 14, 2026

All dedicated view files are now reachable from the desktop shell through `src/lib/moduleViewRegistry.tsx` (65/65 `MODULE_CATALOG` ids). Statuses below change from `NOT STARTED` to `IMPLEMENTED` because the ported screen is wired to the module registry and uses the existing backend API client. `TESTED`/`VERIFIED` still require a synthetic-tenant runtime walkthrough.

| Route | Module | Screen | New status | Implementation |
|---|---|---|---|---|
| `/appointments` | 4 | Appointments | IMPLEMENTED | Ported `AppointmentsView.tsx` + `AppointmentForm.tsx` (replaces the inline legacy view) |
| `/accounting` | 39 | Financial Accounting | IMPLEMENTED | Ported `AccountingView.tsx` |
| `/revenue` | 44 | Revenue Cycle | IMPLEMENTED | Ported `RevenueView.tsx` |
| `/cost-accounting` | 45 | Cost Accounting | IMPLEMENTED | Ported `CostAccountingView.tsx` |
| `/hr/payroll`, `/payroll` | 66 | Payroll | IMPLEMENTED | Ported `PayrollView.tsx`; `/hr/payroll` resolves to module 66 |
| `/workforce-planning` | 40 | Workforce Planning | IMPLEMENTED | Ported `WorkforcePlanningView.tsx` |
| `/ai-analytics` | 23 | AI Analytics | IMPLEMENTED | Ported `AiAnalyticsView.tsx` |
| `/ai-central` | 23 | AI Central | IMPLEMENTED | Ported `AiCentralView.tsx`; dedicated sub-route |
| `/ai-chat` | 23 | AI Chat | IMPLEMENTED | Ported `AiChatView.tsx`; dedicated sub-route |
| `/executive` | 46 | Executive Dashboard | IMPLEMENTED | Uses `AnalyticsView.tsx`, matching the Web route re-export |
| `/apps` | — | Module launcher | IMPLEMENTED | Ported `AppsView.tsx`; links resolve through the navigation bridge |
| `/clinical-research` | 32 | Clinical Research | IMPLEMENTED | Ported `ClinicalResearchView.tsx` |
| `/communication` | 58 | Communication | IMPLEMENTED | Ported `CommunicationView.tsx`; dedicated sub-route |
| `/community-health` | 56 | Community Health | IMPLEMENTED | Ported `CommunityHealthView.tsx` |
| `/consent` | 54 | Consent Management | IMPLEMENTED | Ported `ConsentView.tsx` |
| `/documents` | 57 | Document Management | IMPLEMENTED | Ported `DocumentsView.tsx`; `api.delete` now accepts a request body |
| `/finance/journals` | 39 | Finance Journals | IMPLEMENTED | Ported `FinanceJournalsView.tsx`; dedicated sub-route |
| `/full-system-setup` | 65 | Full System Setup | IMPLEMENTED | Ported `FullSystemSetupView.tsx` |
| `/governance` | 62 | Governance | IMPLEMENTED | Ported `GovernanceView.tsx` |
| `/home-care` | 60 | Home Care | IMPLEMENTED | Ported `HomeCareView.tsx` |
| `/ict` | 41 | ICT & Security Operations | IMPLEMENTED | Ported `IctView.tsx` |
| `/inventory/purchase-orders` | 15 | Purchase Orders | IMPLEMENTED | Ported `InventoryPurchaseOrdersView.tsx`; dedicated sub-route |
| `/facilities/work-orders` | 18 | Work Orders | IMPLEMENTED | Ported `FacilitiesWorkOrdersView.tsx`; dedicated sub-route |
| `/medical-director` | 43 | Medical Director | IMPLEMENTED | Ported `MedicalDirectorView.tsx` |
| `/messaging` | 58 | Messaging | IMPLEMENTED | Ported `MessagingView.tsx` |
| `/nursing-admin` | 42 | Nursing Admin | IMPLEMENTED | Ported `NursingAdminView.tsx` |
| `/operations` | 63 | Operations | IMPLEMENTED | Ported `OperationsView.tsx` |
| `/orchestration` | 47 | Orchestration | IMPLEMENTED | Ported `OrchestrationView.tsx` |
| `/portal` | 24 | Portal | IMPLEMENTED | Ported `PortalView.tsx` |
| `/portal/appointments` | 24 | Portal Appointments | IMPLEMENTED | Ported `PortalAppointmentsView.tsx`; dedicated sub-route |
| `/settings` | — | Account & Security Settings | IMPLEMENTED | Ported `AccountSettingsView.tsx`, merged as nav 12 tab |
| `/signup` | — | Facility Signup | IN PROGRESS | Ported `SignupView.tsx`; native auth flow still uses inline screens |
| `/setup` | — | First-time Setup | IN PROGRESS | Ported `SetupView.tsx`; native wizard remains authoritative |

### Routing fixes

* `MODULE_ID_TO_NAV` was removed. It mapped module 36 to ICU, module 37 to blank, and module 42 (Nursing Admin) to Migration.
* Every catalogue module now opens `activeNav = 99` and renders through the registry.
* `MODULE_BY_PATH` plus explicit sub-route overrides translate ported `router.push()` calls.
* RBAC validation now uses `MODULE_CATALOG`, restoring backend module ids 23, 26, 27, 29, 30, 32, 33 and 35 for non-admin roles.
* The access guard accepts nav 99 when a module or sub-route is active, so opening a module no longer bounces back to the dashboard.

### Updated summary counts (November 14, 2026)

| Status | Count |
|---|---|
| ✅ TESTED / VERIFIED | 1 |
| ✅ IMPLEMENTED | 74 |
| 🔄 IN PROGRESS | 6 |
| 🔧 NOT STARTED | 17 |
| ❌ BLOCKED | 0 |
| **Total routes tracked** | **98** |

> Counts are route-level. The screen-by-screen matrix above retains its November 13 snapshot for history; use this checkpoint plus the audit for current status.

### AI screen parity fix — November 14, 2026

Comparison of the three AI routes against `Medilink-Frontend` found the dedicated views already faithful, plus two real divergences, both fixed inside `Medilink-Desktop`:

* **`submitAiAlertReview` was a fake-success stub** in the inline `AISuiteView` (`App.tsx`). It wrote `setNotice("AI alert review saved for clinical governance follow-up.")` with no API call. It now posts `/ai-analytics/feedback` (verified against the backend controller at `ai-analytics.controller.ts:75`) with `predictionId`, `insightId`, `decision`, `reason`, `notes`, maps the UI's "Agree - will act" / "Disagree - not at risk" / "Uncertain" choices to the backend's `ACCEPTED` / `DISMISSED` / `INSUFFICIENT_DATA` enum, and surfaces the real backend error message on failure.
* **Shell AI buttons diverged from the Web shell.** DesktopTopbar's `topbar-ai-btn` and DesktopSidebar's `sidebar-help-btn` opened the local `help-widget` instead of navigating. Topbar now calls `onNavigateAiCentral` → `/ai-central`; sidebar now calls `onNavigateAiChat` → `/ai-chat`, matching `Topbar.tsx:493` and `Sidebar.tsx:1134`. The local `help-widget` (a genuine desktop-only capability, `generateMedilinkAiReply` with local fallback) is retained as a separate collapsed `Help AI` affordance on the sidebar action stack — it is not removed.
* **`VITE_MEDILINK_AI_URL` was missing** from both `.env` and `.env.example`. Added with the default `http://127.0.0.1:8088` used by the views; the bare `.assistant` class gap is cosmetic and matches the Frontend (which also defines no bare `.assistant` rule — the compound `.ai-chat-message.assistant` covers it).

### Updated summary counts (November 14, 2026 — AI parity)

| Status | Count |
|---|---|
| ✅ TESTED / VERIFIED | 1 |
| ✅ IMPLEMENTED | 74 |
| 🔄 IN PROGRESS | 6 |
| 🔧 NOT STARTED | 17 |
| ❌ BLOCKED | 0 |
| **Total routes tracked** | **98** |
