# Medilink HMIS — Data Consistency Report
**Focus:** Schema Alignment, Field Mapping, Data Integrity, and Invariance Validation

---

## 1. Domain Schema Verification

To guarantee that a patient record, consultation note, or invoice created in `Medilink-Frontend` is identical in structure and validation when accessed in `Medilink-Desktop`, the shared domain schemas were audited against `Medilink-Backend` Prisma definitions.

### 1.1 Patient Identity & Master Patient Index (MPI)
- **Backend Model:** `Patient` (`id`, `facilityId`, `mrn`, `nationalId`, `firstName`, `middleName`, `lastName`, `dob`, `gender`, `phone`, `email`, `address`, `createdAt`, `updatedAt`)
- **Frontend Representation:** `Patient` interface in `store/appStore.ts`.
- **Desktop Representation:** `Patient` interface in `store/appStore.ts` & `toFrontendPatient` mapping function.
- **Consistency Verification:** Both clients normalize `mrn` (fallback to `id.slice(0, 8)`), combine names into `name`, and support both Kenyan National ID and Passport formats.

### 1.2 Outpatient & Inpatient Clinical Consultations
- **Backend Model:** `Encounter` (`id`, `patientId`, `facilityId`, `type`, `status`, `triageLevel`, `vitals`, `chiefComplaint`, `diagnosisCodes`, `notes`)
- **Field Consistency:**
  - `triageLevel`: `EMERGENCY` (Red), `VERY_URGENT` (Orange), `URGENT` (Yellow), `STANDARD` (Green), `NON_URGENT` (Blue). Both clients render identical color-coded badges.
  - `vitals`: systolic/diastolic blood pressure (mmHg), heart rate (bpm), respiratory rate (bpm), SpO2 (%), temperature (°C). Units of measurement are 100% unified.

### 1.3 Laboratory & Radiology Diagnostics
- **Backend Model:** `DiagnosticOrder` (`id`, `orderNumber`, `patientId`, `destinationModule`, `testCode`, `testName`, `priority`, `status`, `results`, `technicianNotes`)
- **Status Lifecycle:** `ORDERED` ➔ `RECEIVED` ➔ `IN_PROGRESS` ➔ `READY` ➔ `COMPLETED`. Both clients utilize the same status lifecycle and filter options.

### 1.4 Pharmacy & Inventory
- **Backend Model:** `PrescriptionItem` & `InventoryItem` (`id`, `facilityId`, `drugName`, `genericName`, `dosage`, `frequency`, `duration`, `quantity`, `unitPrice`, `stockOnHand`, `reorderLevel`)
- **Stock Depletion Invariant:** When a dispense transaction is submitted in `PharmacyPosView`, inventory stock on hand is decremented on the backend and immediately reflected in `InventoryView` on both Frontend and Desktop.

### 1.5 Billing, Payments & Invoices
- **Backend Model:** `Invoice` & `PaymentTransaction` (`id`, `invoiceNumber`, `patientId`, `totalAmount`, `paidAmount`, `balance`, `paymentMethod`, `status`, `shaClaimId`)
- **Payment Methods:** `CASH`, `MPESA`, `CARD`, `INSURANCE_SHA`, `INSURANCE_PRIVATE`, `WAIVER`. Unified receipt formatting across both web and native desktop print pipelines.

---

## 2. Invariance & Concurrency Checks

| Invariant Rule | Enforcement Mechanism | Verification Result |
|---|---|---|
| Single Active Queue Token per Department | Backend database unique constraint on `(patientId, departmentId, ACTIVE)` | PASSED — Prevents duplicate queue tokens across clients |
| Bed Occupancy Mutual Exclusion | Atomic PostgreSQL transaction on bed allocation | PASSED — Double-booking a bed from concurrent clients is rejected with HTTP 409 |
| Non-Reversible Invoice Numbering | Sequences generated strictly by PostgreSQL sequence generator | PASSED — Desktop and Web receive monotonically increasing invoice numbers |
| Drug Batch Expiry Enforcement | Backend rejection of expired batch allocations | PASSED — Consistent warning and block on dispensing expired medications |

---

## 3. Data Integrity Summary
The data model across `Medilink-Desktop` and `Medilink-Frontend` has zero schema drift. All shared REST endpoints accept and return identical JSON structures, ensuring transparent interoperability and data integrity.

