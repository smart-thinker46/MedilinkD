# MEDILINK HMIS — DESKTOP PARITY PROGRESS TRACKER
**Reference Implementation:** `Medilink-Frontend`  
**Target Application:** `Medilink-Desktop`  
**Status Legend:**  
* `NOT STARTED` — Work has not begun on this screen.
* `IN PROGRESS` — Implementation currently active.
* `IMPLEMENTED` — UI and API integration implemented in Desktop.
* `TESTED` — Static and runtime tests passed.
* `VERIFIED` — Visual and functional parity confirmed against Frontend.
* `BLOCKED` — Waiting on external dependency or backend capability.

---

## Screen-by-Screen Progress Matrix

| # | Route | Module ID | Screen / Feature | Status | Notes & Functional Gaps |
|---|---|---|---|---|---|
| 1 | `/` | — | Root Splash Screen | TESTED | Existing Tauri splash screen operational |
| 2 | `/landing` | — | Auth / Marketing Landing | IMPLEMENTED | Aligned with theme selection |
| 3 | `/login` | — | Hospital Admin Login | IMPLEMENTED | JWT authentication and session handling active |
| 4 | `/login/staff` | — | Staff Login | IMPLEMENTED | Role key and facility code selection active |
| 5 | `/signup` | — | Facility Self-Registration | IMPLEMENTED | Wired to registration endpoint |
| 6 | `/setup` | — | First Time Setup Wizard | IMPLEMENTED | Multi-step setup wizard verified |
| 7 | `/full-system-setup`| — | Full Enterprise Setup | IMPLEMENTED | Need to synchronize full setup parameters |
| 8 | `/patients` | 1 | Patient Registration | IMPLEMENTED | Full PatientDrawer (break-glass, masked fields), click-to-filter StatCards, MPI merge (/patients/merge), ID Card preview/print, insurance verify (/patients/:id/insurance/verify), vulnerability flags patch |
| 9 | `/appointments` | 4 | Appointments | IMPLEMENTED | Slot calendar view, arrival check-in (/appointments/:id/check-in), reminder notification trigger (/appointments/:id/remind), waitlist release (/appointments/notify-waitlist), recurring series |
| 10| `/queue` | 28 | Queue Management | IMPLEMENTED | Live queue board, counter session, priority override, voice announcement call (TTS/speech synthesis), token transfer, 30s live refresh |
| 11| `/opd` | 36 | Outpatient Consultation | IMPLEMENTED | Dedicated OpdDashboardView (displacing OTView fallback), structured Triage Assessment with vitals/level, Consultation workbench with SOAP notes, ICD-10 suggestions, CDSS evaluate, inline Lab/Rad/Pharm orders, OPD Referrals |
| 12| `/ipd` | 2 | Inpatient (IPD) | IMPLEMENTED | Dedicated IPD bed board & admissions |
| 13| `/ipd/[id]` | 2 | Inpatient Admission Detail | IMPLEMENTED | Admission detail slide-over drawer |
| 14| `/emergency` | 25 | Emergency & Trauma | IMPLEMENTED | Acuity scoring (ESI/Manchester) |
| 15| `/ambulance` | 26 | Ambulance Fleet & Dispatch | IMPLEMENTED | GPS logs & fuel billing |
| 16| `/wards` | 5 | Wards & Bed Allocation | IMPLEMENTED | Graphical bed allocation grid |
| 17| `/maternity` | 37 | Maternity & Obstetrics | IMPLEMENTED | ANC, Labor & Delivery tracking |
| 18| `/maternity/[pregnancyId]` | 37 | Pregnancy Episode Detail | IMPLEMENTED | Clinical timeline & APGAR logs |
| 19| `/icu` | 38 | Intensive Care Unit | IMPLEMENTED | Ventilator parameters & APACHE score |
| 20| `/nicu` | 51 | Neonatal ICU | IMPLEMENTED | Incubator logs & phototherapy tracker |
| 21| `/ot` | 11 | Operation Theatre | IMPLEMENTED | Surgical schedule & WHO checklist |
| 22| `/mortuary` | 27 | Mortuary & Deceased | IMPLEMENTED | Freezer allocation & release flow |
| 23| `/referrals` | 55 | Inter-facility Referrals | IMPLEMENTED | Incoming/outgoing referral tracker |
| 24| `/ehr` | 6 | EMR & Medical Records | IMPLEMENTED | SOAP notes & clinical timeline |
| 25| `/ehr/[patientId]` | 6 | Longitudinal Patient Record| IMPLEMENTED | Dedicated longitudinal patient view |
| 26| `/cdss` | 48 | Clinical Decision Support | IMPLEMENTED | Rule monitor & drug-drug alerts |
| 27| `/nursing` | 7 | Nursing Care & Vitals | IMPLEMENTED | eMAR 5-rights & care plans |
| 28| `/nursing-admin` | 42 | Nursing Admin / Matron | IMPLEMENTED | Staffing ratio calculations |
| 29| `/lab` | 8 | Laboratory Diagnostics | IMPLEMENTED | Specimen accessioning & critical flags |
| 30| `/radiology` | 9 | Radiology & PACS Imaging | IMPLEMENTED | PACS study viewer & critical alerts |
| 31| `/pharmacy` | 10 | Pharmacy Operations | IMPLEMENTED | Prescription verification & dispensing |
| 32| `/pharmacy/[sub]` | 10 | Satellite Pharmacies | IMPLEMENTED | Satellite inventory routing |
| 33| `/pharmacy/dispense/[id]`| 10 | Dispense Execution Screen | IMPLEMENTED | Dedicated dispensing verification |
| 34| `/pharmacy/pos` | 35 | Pharmacy Retail POS | IMPLEMENTED | Retail checkout, M-Pesa & receipt print |
| 35| `/blood-bank` | 12 | Blood Bank & Transfusion | IMPLEMENTED | Donor registry & cross-matching |
| 36| `/clinical-research` | 32 | Clinical Research | IMPLEMENTED | Protocol registry & adverse events |
| 37| `/quality-assurance` | 33 | Quality Assurance | IMPLEMENTED | Root cause analysis & audits |
| 38| `/physiotherapy` | 49 | Physiotherapy & Rehab | IMPLEMENTED | ROM charts & functional progress |
| 39| `/nutrition` | 50 | Nutrition & Dietetics | IMPLEMENTED | Nutritional plans & enteral logs |
| 40| `/dental` | 52 | Dental & Odontogram | IMPLEMENTED | Interactive tooth chart & treatments |
| 41| `/infection-control` | 53 | Infection Control & CSSD | IMPLEMENTED | Autoclave batches & HAI monitoring |
| 42| `/paediatrics` | 59 | Paediatric Medicine | IMPLEMENTED | WHO growth charts & immunizations |
| 43| `/billing` | 13 | Patient Billing | IMPLEMENTED | Invoice lifecycle, waivers, M-Pesa |
| 44| `/insurance` | 14 | Insurance Pre-auth & Claims| IMPLEMENTED | Claim submission & pre-auth |
| 45| `/revenue` | 44 | Revenue Cycle Management | IMPLEMENTED | Claims scrubbing & denial tracking |
| 46| `/accounting` | 39 | General Ledger | IMPLEMENTED | Chart of Accounts & Trial Balance |
| 47| `/finance` | 39 | Financial Dashboard | IMPLEMENTED | Financial KPI overview |
| 48| `/finance/journals` | 39 | Journal Vouchers | IMPLEMENTED | Double-entry debit/credit vouchers |
| 49| `/cost-accounting` | 45 | Cost Accounting | IMPLEMENTED | Cost center profitability |
| 50| `/inventory` | 15 | Central Inventory | IMPLEMENTED | Multi-store inventory & batch tracking |
| 51| `/inventory/purchase-orders` | 15 | Purchase Orders | IMPLEMENTED | Dedicated PO lifecycle & approvals |
| 52| `/procurement` | 15 | Procurement | IMPLEMENTED | Supplier bids & evaluations |
| 53| `/hr` | 16 | Human Resources | IMPLEMENTED | Employee records, leave, attendance |
| 54| `/hr/payroll` | 66 | Payroll Calculation | IMPLEMENTED | Kenyan statutory deductions run |
| 55| `/payroll` | 66 | Payroll Management | IMPLEMENTED | Payslip generation & batch payments |
| 56| `/workforce-planning`| 40 | Workforce Shift Roster | IMPLEMENTED | Shift roster & staffing forecasts |
| 57| `/doctors` | 17 | Doctor Directory | IMPLEMENTED | CME credits & OPD schedule |
| 58| `/facilities` | 18 | Multi-facility Asset Mgmt | IMPLEMENTED | Maintenance requests & compliance |
| 59| `/facilities/work-orders` | 18 | Work Orders | IMPLEMENTED | Work order assignment & SLA |
| 60| `/facility` | 18 | Facility Metadata | IMPLEMENTED | Synchronized in SettingsView |
| 61| `/biomedical` | 61 | Biomedical Equipment | IMPLEMENTED | Calibration logs & breakdown tracking |
| 62| `/governance` | 62 | Clinical Governance & DR | IMPLEMENTED | DR runbook drill simulator |
| 63| `/operations` | 63 | Operations Support | IMPLEMENTED | Support ticketing & SLA counters |
| 64| `/orchestration` | 47 | System Automation & HL7 | IMPLEMENTED | HL7 monitors & event triggers |
| 65| `/telemedicine` | 21 | Telemedicine | IMPLEMENTED | Jitsi/Daily room launcher & chat |
| 66| `/blockchain` | 22 | Blockchain Audit Trail | IMPLEMENTED | Block verification & audit exports |
| 67| `/ai-analytics` | 23 | AI Operational Analytics | IMPLEMENTED | Readmission risk & bed demand |
| 68| `/ai-central` | 23 | Central AI Capability | IMPLEMENTED | Model registry & prompt workspace |
| 69| `/ai-chat` | 23 | Clinical AI Assistant | IMPLEMENTED | Dedicated clinical chatbot |
| 70| `/executive` | 46 | Executive C-Suite Dashboard| IMPLEMENTED | ALOS, BOR, Rev/Bed, EBITDA KPIs |
| 71| `/reports` | 19 | MOH & Statutory Reports | IMPLEMENTED | MOH 705/711 statutory reports |
| 72| `/users` | 20 | User Management & RBAC | IMPLEMENTED | Permissions matrix & MFA reset |
| 73| `/settings` | 12 | System Settings | IMPLEMENTED | Theme, density, refresh preferences |
| 74| `/portal` | 24 | Shared Portal Gateway | IMPLEMENTED | Portal lookup & credentials |
| 75| `/portal/appointments`| 24 | Portal Booking | IMPLEMENTED | Patient self-service booking |
| 76| `/patient-portal` | 24 | Patient Portal | IMPLEMENTED | Online lab reports & bills |
| 77| `/patient-portal/appointments`| 24| Self-Service Appointments | IMPLEMENTED | Appointment request calendar |
| 78| `/documents` | 57 | Document Management | IMPLEMENTED | Categorized repository & tags |
| 79| `/consent` | 54 | Digital Consent | IMPLEMENTED | Surgical consent & digital sign |
| 80| `/communication` | 58 | Hospital Broadcasts | IMPLEMENTED | SMS & WhatsApp broadcast campaigns |
| 81| `/messaging` | 58 | Messaging Gateway | IMPLEMENTED | SMS balance & delivery logs |
| 82| `/community-health` | 56 | Community Health Workers | IMPLEMENTED | Household mapping & surveillance |
| 83| `/home-care` | 60 | Home Care | IMPLEMENTED | Field visit logs & remote vitals |
| 84| `/canteen` | 30 | Canteen & Dietary | IMPLEMENTED | Patient meal orders & kitchen board |
| 85| `/feedback` | 31 | Patient Feedback & NPS | IMPLEMENTED | Sentiment analysis & resolutions |
| 86| `/helpdesk` | 29 | Internal IT Helpdesk | IMPLEMENTED | Support tickets & SLA tracking |
| 87| `/integrations` | 34 | External Integrations | IMPLEMENTED | M-Pesa, Pusher, FHIR configs |
| 88| `/migration` | 64 | Data Migration Center | IMPLEMENTED | CSV mapper, dry-run, batch import |
| 89| `/medical-director` | 43 | Medical Director Dashboard | IMPLEMENTED | Mortality reviews & credentialing |
| 90| `/analytics` | 19 | BI Analytics | IMPLEMENTED | Department utilization charts |
| 91| `/apps` | — | Module Launcher Grid | IMPLEMENTED | Categorized card grid |
| 92| `/[module]` | — | Dynamic Module Resolver | IMPLEMENTED | Fallback module resolver active |
| 93| `/cost-accounting` | 45 | Unit Costing | IMPLEMENTED | Activity-based costing tracker |
| 94| `/diagnostics/lab` | 8 | Lab Diagnostics Routing | IMPLEMENTED | Centralized lab router |
| 95| `/diagnostics/radiology`| 9 | Radiology Routing | IMPLEMENTED | Centralized radiology router |

