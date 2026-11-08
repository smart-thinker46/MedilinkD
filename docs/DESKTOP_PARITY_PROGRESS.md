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
| 7 | `/full-system-setup`| — | Full Enterprise Setup | NOT STARTED | Need to synchronize full setup parameters |
| 8 | `/patients` | 1 | Patient Registration | IN PROGRESS | Need MPI deduplication & insurance verify |
| 9 | `/appointments` | 4 | Appointments | IN PROGRESS | Need calendar slot picker and tele-link |
| 10| `/queue` | 28 | Queue Management | IN PROGRESS | Need priority overrides and transfers |
| 11| `/opd` | 36 | Outpatient Consultation | IN PROGRESS | Separate from OPDOTView; add ICD-10 notes |
| 12| `/ipd` | 2 | Inpatient (IPD) | NOT STARTED | Dedicated IPD bed board & admissions |
| 13| `/ipd/[id]` | 2 | Inpatient Admission Detail | NOT STARTED | Admission detail slide-over drawer |
| 14| `/emergency` | 25 | Emergency & Trauma | IN PROGRESS | Acuity scoring (ESI/Manchester) |
| 15| `/ambulance` | 26 | Ambulance Fleet & Dispatch | IN PROGRESS | GPS logs & fuel billing |
| 16| `/wards` | 5 | Wards & Bed Allocation | IN PROGRESS | Graphical bed allocation grid |
| 17| `/maternity` | 37 | Maternity & Obstetrics | NOT STARTED | ANC, Labor & Delivery tracking |
| 18| `/maternity/[pregnancyId]` | 37 | Pregnancy Episode Detail | NOT STARTED | Clinical timeline & APGAR logs |
| 19| `/icu` | 38 | Intensive Care Unit | NOT STARTED | Ventilator parameters & APACHE score |
| 20| `/nicu` | 51 | Neonatal ICU | NOT STARTED | Incubator logs & phototherapy tracker |
| 21| `/ot` | 11 | Operation Theatre | IN PROGRESS | Surgical schedule & WHO checklist |
| 22| `/mortuary` | 27 | Mortuary & Deceased | IN PROGRESS | Freezer allocation & release flow |
| 23| `/referrals` | 55 | Inter-facility Referrals | NOT STARTED | Incoming/outgoing referral tracker |
| 24| `/ehr` | 6 | EMR & Medical Records | IN PROGRESS | SOAP notes & clinical timeline |
| 25| `/ehr/[patientId]` | 6 | Longitudinal Patient Record| NOT STARTED | Dedicated longitudinal patient view |
| 26| `/cdss` | 48 | Clinical Decision Support | NOT STARTED | Rule monitor & drug-drug alerts |
| 27| `/nursing` | 7 | Nursing Care & Vitals | IN PROGRESS | eMAR 5-rights & care plans |
| 28| `/nursing-admin` | 42 | Nursing Admin / Matron | NOT STARTED | Staffing ratio calculations |
| 29| `/lab` | 8 | Laboratory Diagnostics | IN PROGRESS | Specimen accessioning & critical flags |
| 30| `/radiology` | 9 | Radiology & PACS Imaging | IN PROGRESS | PACS study viewer & critical alerts |
| 31| `/pharmacy` | 10 | Pharmacy Operations | IN PROGRESS | Prescription verification & dispensing |
| 32| `/pharmacy/[sub]` | 10 | Satellite Pharmacies | NOT STARTED | Satellite inventory routing |
| 33| `/pharmacy/dispense/[id]`| 10 | Dispense Execution Screen | NOT STARTED | Dedicated dispensing verification |
| 34| `/pharmacy/pos` | 35 | Pharmacy Retail POS | IN PROGRESS | Retail checkout, M-Pesa & receipt print |
| 35| `/blood-bank` | 12 | Blood Bank & Transfusion | IN PROGRESS | Donor registry & cross-matching |
| 36| `/clinical-research` | 32 | Clinical Research | NOT STARTED | Protocol registry & adverse events |
| 37| `/quality-assurance` | 33 | Quality Assurance | IN PROGRESS | Root cause analysis & audits |
| 38| `/physiotherapy` | 49 | Physiotherapy & Rehab | NOT STARTED | ROM charts & functional progress |
| 39| `/nutrition` | 50 | Nutrition & Dietetics | NOT STARTED | Nutritional plans & enteral logs |
| 40| `/dental` | 52 | Dental & Odontogram | NOT STARTED | Interactive tooth chart & treatments |
| 41| `/infection-control` | 53 | Infection Control & CSSD | NOT STARTED | Autoclave batches & HAI monitoring |
| 42| `/paediatrics` | 59 | Paediatric Medicine | NOT STARTED | WHO growth charts & immunizations |
| 43| `/billing` | 13 | Patient Billing | IN PROGRESS | Invoice lifecycle, waivers, M-Pesa |
| 44| `/insurance` | 14 | Insurance Pre-auth & Claims| IN PROGRESS | Claim submission & pre-auth |
| 45| `/revenue` | 44 | Revenue Cycle Management | NOT STARTED | Claims scrubbing & denial tracking |
| 46| `/accounting` | 39 | General Ledger | NOT STARTED | Chart of Accounts & Trial Balance |
| 47| `/finance` | 39 | Financial Dashboard | NOT STARTED | Financial KPI overview |
| 48| `/finance/journals` | 39 | Journal Vouchers | NOT STARTED | Double-entry debit/credit vouchers |
| 49| `/cost-accounting` | 45 | Cost Accounting | NOT STARTED | Cost center profitability |
| 50| `/inventory` | 15 | Central Inventory | IN PROGRESS | Multi-store inventory & batch tracking |
| 51| `/inventory/purchase-orders` | 15 | Purchase Orders | NOT STARTED | Dedicated PO lifecycle & approvals |
| 52| `/procurement` | 15 | Procurement | IN PROGRESS | Supplier bids & evaluations |
| 53| `/hr` | 16 | Human Resources | IN PROGRESS | Employee records, leave, attendance |
| 54| `/hr/payroll` | 66 | Payroll Calculation | NOT STARTED | Kenyan statutory deductions run |
| 55| `/payroll` | 66 | Payroll Management | NOT STARTED | Payslip generation & batch payments |
| 56| `/workforce-planning`| 40 | Workforce Shift Roster | NOT STARTED | Shift roster & staffing forecasts |
| 57| `/doctors` | 17 | Doctor Directory | IN PROGRESS | CME credits & OPD schedule |
| 58| `/facilities` | 18 | Multi-facility Asset Mgmt | IN PROGRESS | Maintenance requests & compliance |
| 59| `/facilities/work-orders` | 18 | Work Orders | NOT STARTED | Work order assignment & SLA |
| 60| `/facility` | 18 | Facility Metadata | IMPLEMENTED | Synchronized in SettingsView |
| 61| `/biomedical` | 61 | Biomedical Equipment | NOT STARTED | Calibration logs & breakdown tracking |
| 62| `/governance` | 62 | Clinical Governance & DR | NOT STARTED | DR runbook drill simulator |
| 63| `/operations` | 63 | Operations Support | NOT STARTED | Support ticketing & SLA counters |
| 64| `/orchestration` | 47 | System Automation & HL7 | NOT STARTED | HL7 monitors & event triggers |
| 65| `/telemedicine` | 21 | Telemedicine | IN PROGRESS | Jitsi/Daily room launcher & chat |
| 66| `/blockchain` | 22 | Blockchain Audit Trail | IN PROGRESS | Block verification & audit exports |
| 67| `/ai-analytics` | 23 | AI Operational Analytics | NOT STARTED | Readmission risk & bed demand |
| 68| `/ai-central` | 23 | Central AI Capability | NOT STARTED | Model registry & prompt workspace |
| 69| `/ai-chat` | 23 | Clinical AI Assistant | IN PROGRESS | Dedicated clinical chatbot |
| 70| `/executive` | 46 | Executive C-Suite Dashboard| NOT STARTED | ALOS, BOR, Rev/Bed, EBITDA KPIs |
| 71| `/reports` | 19 | MOH & Statutory Reports | IN PROGRESS | MOH 705/711 statutory reports |
| 72| `/users` | 20 | User Management & RBAC | IN PROGRESS | Permissions matrix & MFA reset |
| 73| `/settings` | 12 | System Settings | IMPLEMENTED | Theme, density, refresh preferences |
| 74| `/portal` | 24 | Shared Portal Gateway | IN PROGRESS | Portal lookup & credentials |
| 75| `/portal/appointments`| 24 | Portal Booking | NOT STARTED | Patient self-service booking |
| 76| `/patient-portal` | 24 | Patient Portal | IN PROGRESS | Online lab reports & bills |
| 77| `/patient-portal/appointments`| 24| Self-Service Appointments | NOT STARTED | Appointment request calendar |
| 78| `/documents` | 57 | Document Management | NOT STARTED | Categorized repository & tags |
| 79| `/consent` | 54 | Digital Consent | NOT STARTED | Surgical consent & digital sign |
| 80| `/communication` | 58 | Hospital Broadcasts | NOT STARTED | SMS & WhatsApp broadcast campaigns |
| 81| `/messaging` | 58 | Messaging Gateway | NOT STARTED | SMS balance & delivery logs |
| 82| `/community-health` | 56 | Community Health Workers | NOT STARTED | Household mapping & surveillance |
| 83| `/home-care` | 60 | Home Care | NOT STARTED | Field visit logs & remote vitals |
| 84| `/canteen` | 30 | Canteen & Dietary | IN PROGRESS | Patient meal orders & kitchen board |
| 85| `/feedback` | 31 | Patient Feedback & NPS | IN PROGRESS | Sentiment analysis & resolutions |
| 86| `/helpdesk` | 29 | Internal IT Helpdesk | IN PROGRESS | Support tickets & SLA tracking |
| 87| `/integrations` | 34 | External Integrations | IN PROGRESS | M-Pesa, Pusher, FHIR configs |
| 88| `/migration` | 64 | Data Migration Center | IMPLEMENTED | CSV mapper, dry-run, batch import |
| 89| `/medical-director` | 43 | Medical Director Dashboard | NOT STARTED | Mortality reviews & credentialing |
| 90| `/analytics` | 19 | BI Analytics | IN PROGRESS | Department utilization charts |
| 91| `/apps` | — | Module Launcher Grid | IMPLEMENTED | Categorized card grid |
| 92| `/[module]` | — | Dynamic Module Resolver | IMPLEMENTED | Fallback module resolver active |
| 93| `/cost-accounting` | 45 | Unit Costing | NOT STARTED | Activity-based costing tracker |
| 94| `/diagnostics/lab` | 8 | Lab Diagnostics Routing | IMPLEMENTED | Centralized lab router |
| 95| `/diagnostics/radiology`| 9 | Radiology Routing | IMPLEMENTED | Centralized radiology router |

