# MEDILINK HMIS — DESKTOP API PARITY & CONTRACT MAPPING
**Reference Application:** `Medilink-Frontend` (Axios API Client)  
**Target Application:** `Medilink-Desktop` (Native `fetch` API Client)  
**Authority Backend:** `Medilink-Backend` (NestJS 11 Controllers)  
**Date:** November 8, 2026  
**Status:** Audit & Contract Mapping  

---

## 1. Authentication, Headers & Security Contracts

| Concern | Backend Requirement | Frontend Client (`src/lib/api.ts`) | Desktop Client (`src/lib/apiClient.ts`) | Parity Status |
| :--- | :--- | :--- | :--- | :--- |
| **Base URL** | `PORT=3000` | `NEXT_PUBLIC_API_URL` (default: `http://localhost:3000`) | `VITE_API_BASE_URL` (default: `http://localhost:3000`) | ALIGNED |
| **Access Token** | `Authorization: Bearer <token>` | Injected via Axios request interceptor | Injected via `apiFetch()` helper | ALIGNED |
| **Refresh Token** | `POST /auth/refresh` | In-flight refresh queue; retries pending requests on 401 | Single-request refresh in `refreshAccessToken()` | IMPROVE (Queue pending calls) |
| **CSRF Protection** | `X-CSRF-Token` header for non-GET | `GET /security/csrf-token` with automatic retry on 403 `EBADCSRFTOKEN` | Cached CSRF token; bearer bypass allowed | ALIGNED (Preserve bearer bypass) |
| **Device Binding** | `X-Device-Id` / payload `deviceId` | Stored in `localStorage["hmis_device_id"]` | Generated in `getDeviceId()` and stored | ALIGNED |
| **Multi-Tenancy** | RLS tenant isolation (`TenantGuard`) | Bound via user session claims (`tenantId`) | Bound via user session claims (`tenantId`) | ALIGNED |

---

## 2. Core Functional Endpoint Mapping

### 2.1 Patients & Registration (Module 1)
| Endpoint | Method | Backend Controller | Desktop Implementation | Status |
| :--- | :---: | :--- | :--- | :--- |
| `/tenant/patients` | GET | `PatientsController.findAll` | `fetchTenantPatients()` | VERIFIED |
| `/tenant/patients/:id` | GET | `PatientsController.findOne` | `fetchTenantPatientById()` | VERIFIED |
| `/tenant/patients` | POST | `PatientsController.create` | `createTenantPatient()` | VERIFIED |
| `/tenant/patients/:id` | PATCH | `PatientsController.update` | `updateTenantPatient()` | VERIFIED |
| `/tenant/patients/duplicate-check` | POST | `PatientsController.duplicateCheck` | `fetchTenantPatientDuplicateCheck()` | VERIFIED |
| `/patients/:id/insurance/verify` | POST | `PatientsController.verifyInsurance` | Inline in `PatientsView` | VERIFIED |
| `/patients/merge` | POST | `PatientsController.mergePatients` | Direct `apiFetch()` in `PatientsView` | VERIFIED |
| `/security/break-glass` | POST | `SecurityController.grantBreakGlass` | Direct `apiFetch()` | VERIFIED |

### 2.2 Appointments & Central Queue (Modules 4 & 28)
| Endpoint | Method | Backend Controller | Desktop Implementation | Status |
| :--- | :---: | :--- | :--- | :--- |
| `/appointments` | GET | `AppointmentsController.findAll` | `fetchAppointments()` | VERIFIED |
| `/appointments` | POST | `AppointmentsController.create` | `createAppointment()` | VERIFIED |
| `/appointments/:id/check-in` | POST | `AppointmentsController.checkIn` | Direct `apiFetch()` | VERIFIED |
| `/queue/board` | GET | `QueueController.getBoard` | `fetchQueueBoard()` | VERIFIED |
| `/queue/token` | POST | `QueueController.createToken` | `createQueueToken()` | VERIFIED |
| `/queue/token/status` | PATCH | `QueueController.updateStatus` | `updateQueueTokenStatus()` | VERIFIED |
| `/queue/token/priority`| PATCH | `QueueController.overridePriority` | `overrideQueuePriority()` | VERIFIED |
| `/queue/counter/session`| POST | `QueueController.counterSession` | `queueCounterSession()` | VERIFIED |
| `/queue/token/call-next`| POST | `QueueController.callNext` | `callNextQueueToken()` | VERIFIED |

### 2.3 Outpatient (OPD) & Inpatient (IPD) (Modules 36 & 2)
| Endpoint | Method | Backend Controller | Desktop Implementation | Status |
| :--- | :---: | :--- | :--- | :--- |
| `/opd/dashboard` | GET | `OutpatientController.getDashboard` | `fetchOpdDashboard()` | VERIFIED |
| `/opd/queue` | GET | `OutpatientController.getQueue` | `fetchOpdQueue()` | VERIFIED |
| `/opd/triage` | POST | `OutpatientController.recordTriage` | In `WorkflowModuleView` | TO MODULARIZE |
| `/opd/consultations` | POST | `ConsultationsController.create` | In `WorkflowModuleView` | TO MODULARIZE |
| `/wards/in-patients` | GET | `InPatientsController.findAll` | `fetchInpatientAdmissions()` | VERIFIED |
| `/wards/in-patients/admit`| POST | `InPatientsController.admit` | `createAdmission()` | VERIFIED |
| `/wards/in-patients/:id/transfer`| POST | `InPatientsController.transfer` | Direct `apiFetch()` | VERIFIED |
| `/wards/in-patients/:id/discharge`| POST| `InPatientsController.discharge` | Direct `apiFetch()` | VERIFIED |

### 2.4 Diagnostics: Laboratory & Radiology (Modules 8 & 9)
| Endpoint | Method | Backend Controller | Desktop Implementation | Status |
| :--- | :---: | :--- | :--- | :--- |
| `/laboratory/dashboard`| GET | `LaboratoryController.getDashboard` | `fetchLaboratoryDashboard()` | VERIFIED |
| `/laboratory/requests` | GET | `LaboratoryController.getRequests` | `fetchLaboratoryRequests()` | VERIFIED |
| `/laboratory/requests` | POST | `LaboratoryController.createRequest`| Direct `apiFetch()` | VERIFIED |
| `/laboratory/results` | POST | `LaboratoryController.submitResult` | Direct `apiFetch()` | VERIFIED |
| `/radiology/dashboard` | GET | `RadiologyController.getDashboard` | `fetchRadiologyDashboard()` | VERIFIED |
| `/radiology/requests` | GET | `RadiologyController.getRequests` | `fetchRadiologyRequests()` | VERIFIED |
| `/radiology/reports` | GET/POST| `RadiologyController.reports` | `fetchRadiologyReports()` | VERIFIED |
| `/radiology/critical-alert`| POST | `RadiologyController.criticalAlert` | Direct `apiFetch()` | VERIFIED |

### 2.5 Pharmacy, Retail POS & Blood Bank (Modules 10, 35, 12)
| Endpoint | Method | Backend Controller | Desktop Implementation | Status |
| :--- | :---: | :--- | :--- | :--- |
| `/pharmacy/dashboard` | GET | `PharmacyController.getDashboard` | `fetchPharmacyDashboard()` | VERIFIED |
| `/pharmacy/prescriptions`| GET | `PharmacyController.getPrescriptions`| `fetchPharmacyPrescriptions()` | VERIFIED |
| `/pharmacy/dispense` | POST | `PharmacyController.dispense` | `dispensePharmacyMedication()` | VERIFIED |
| `/pharmacy-pos/sale` | POST | `PharmacyPosController.createSale` | `createPharmacyPosSale()` | VERIFIED |
| `/pharmacy-pos/receipt/:id`| GET | `PharmacyPosController.getReceipt` | `fetchPharmacyPosReceipt()` | VERIFIED |
| `/blood-bank/dashboard` | GET | `BloodBankController.getDashboard` | `fetchBloodBankDashboard()` | VERIFIED |
| `/blood-bank/stock` | GET | `BloodBankController.getStock` | `fetchBloodBankStock()` | VERIFIED |
| `/blood-bank/donors` | GET/POST| `BloodBankController.donors` | `fetchBloodBankDonors()` | VERIFIED |

### 2.6 Billing, Insurance & Financial Accounting (Modules 13, 14, 39, 44)
| Endpoint | Method | Backend Controller | Desktop Implementation | Status |
| :--- | :---: | :--- | :--- | :--- |
| `/billing/bills` | GET | `BillingController.getBills` | `fetchBillingBills()` | VERIFIED |
| `/billing/bills/:id` | GET | `BillingController.getBillById` | `fetchBillingBillById()` | VERIFIED |
| `/billing/payment` | POST | `BillingController.recordPayment` | `recordBillingPayment()` | VERIFIED |
| `/mpesa/stkpush` | POST | `MpesaController.initiateStkPush` | `initiateMpesaStkPush()` | VERIFIED |
| `/insurance/dashboard` | GET | `InsuranceController.getDashboard` | `fetchInsuranceDashboard()` | VERIFIED |
| `/insurance/claims` | GET/POST| `InsuranceController.claims` | `fetchInsuranceClaims()` | VERIFIED |
| `/finance-accounting/accounts`| GET | `AccountingController.getAccounts`| `fetchAccountingAccounts()` | VERIFIED |
| `/finance-accounting/journals`| GET/POST| `AccountingController.journals` | `fetchAccountingJournals()` | VERIFIED |
| `/finance-accounting/statements/trial-balance`| GET | `AccountingController.trialBalance` | Direct `apiFetch()` | VERIFIED |

---

## 3. Safe Error Handling & Retry Standardization

To match `Medilink-Frontend`:
1. **Network Retries:** Only safe idempotent operations (`GET`, `HEAD`) retry automatically on network timeout.
2. **Session Expiry (401):** Tokens refresh automatically via `refreshAccessToken()`; upon refresh failure, clear session and present `HospitalLoginScreen` or `StaffLoginScreen` cleanly with error context.
3. **CSRF Expiry (403):** If `code === 'EBADCSRFTOKEN'`, clear stored CSRF token, re-fetch via `/security/csrf-token`, and replay the failed request.
4. **Data Isolation:** Clear all memory token variables and active patient state upon logout to prevent cross-tenant data bleed.

