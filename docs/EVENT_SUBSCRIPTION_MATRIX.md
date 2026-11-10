# Medilink HMIS — Event Subscription Matrix
**Scope:** Real-Time WebSocket, DOM CustomEvent, and Cross-Process Event Bus

---

## 1. Real-Time Channel Architecture

The Medilink HMIS real-time fabric operates primarily on tenant-isolated channels:
- **Tenant Channel Pattern:** `tenant-${tenantType}-${tenantId}` (e.g., `tenant-HOSPITAL-fac_kenya_001`)
- **User Notification Channel:** `user-${userId}`
- **Inter-Process Broadcast:** Window `storage` event key `hmis_live_data_changed_at`
- **In-Memory DOM Bus:** `window.dispatchEvent(new CustomEvent(eventName, { detail }))`

---

## 2. Event Routing Matrix

| Backend / Gateway Event | Channel Name | Inbound Client Handler | Dispatched DOM Event | Target Modules & Views |
|---|---|---|---|---|
| `patient_transfer_requested` | `tenant-HOSPITAL-{id}` | `SyncEngine.handleInboundRealtimeEvent` | `hmis:patient-transfer-event` | Referral Management, IPD, Emergency |
| `patient_transfer_autoaccepted` | `tenant-HOSPITAL-{id}` | `SyncEngine.handleInboundRealtimeEvent` | `hmis:patient-transfer-event` | Bed & Ward, Inpatient, Ambulance |
| `patient_transfer_accepted` | `tenant-HOSPITAL-{id}` | `SyncEngine.handleInboundRealtimeEvent` | `hmis:patient-transfer-event` | Admission Desk, Queue Management |
| `patient_transfer_rejected` | `tenant-HOSPITAL-{id}` | `SyncEngine.handleInboundRealtimeEvent` | `hmis:patient-transfer-event` | Referring Doctor, Emergency Desk |
| `patient_queued` | `tenant-HOSPITAL-{id}` | `SyncEngine.handleInboundRealtimeEvent` | `hmis:patient-queued` | OPD Dashboard, Triage, Nurse Desk, Sidebar Counter |
| `patient_triaged` | `tenant-HOSPITAL-{id}` | `SyncEngine.handleInboundRealtimeEvent` | `hmis:patient-queued` | Doctor Consultation Workbench |
| `patient_consulted` | `tenant-HOSPITAL-{id}` | `SyncEngine.handleInboundRealtimeEvent` | `hmis:patient-queued` | Pharmacy, Lab, Cashier Queue |
| `clinical_order_created` | `tenant-HOSPITAL-{id}` | `SyncEngine.handleInboundRealtimeEvent` | `hmis:clinical-order-created` | Lab, Radiology, OT, Sidebar Order Counter |
| `clinical_order_updated` | `tenant-HOSPITAL-{id}` | `SyncEngine.handleInboundRealtimeEvent` | `hmis:clinical-order-updated` | Doctor Consultation, Inpatient Chart |
| `prescription_dispensed` | `tenant-HOSPITAL-{id}` | `SyncEngine.handleInboundRealtimeEvent` | `hmis:prescription-dispensed`| Pharmacy POS, Inventory, Nursing Chart |
| `invoice_generated` | `tenant-HOSPITAL-{id}` | `SyncEngine.handleInboundRealtimeEvent` | `hmis:invoice-generated` | Billing & Accounts, Cashier Desk |
| `payment_confirmed` | `tenant-HOSPITAL-{id}` | `SyncEngine.handleInboundRealtimeEvent` | `hmis:payment-received` | Billing, Pharmacy Release, Discharge Desk |
| `bed_transferred` | `tenant-HOSPITAL-{id}` | `SyncEngine.handleInboundRealtimeEvent` | `hmis:bed-transferred` | Wards, ICU, NICU, Housekeeping |
| `general_data_changed` | `tenant-HOSPITAL-{id}` | `SyncEngine.handleInboundRealtimeEvent` | `hmis:live-data-changed` | All active subscriber views |

---

## 3. Client-Side DOM Event Catalog

| Event Name | Originating Trigger | Payload Schema | Subscribed Components |
|---|---|---|---|
| `hmis:live-data-changed` | Any successful REST mutation via `apiFetch` | `{ method, url, source, changedAt }` | All views utilizing `useLiveRefresh()` |
| `hmis:sync-status-changed` | Network state transition or queue mutation | `{ status, lastSyncedAt, queuedCount, activeChannel }` | `DesktopTopbar` (sync badge), Status Shell |
| `hmis:patient-queued` | Patient check-in or triage department transfer | `{ patientId, token, departmentId, priority }` | `DesktopSidebar` (waiting count), `OpdDashboardView` |
| `hmis:clinical-order-created` | Doctor issues lab / imaging order | `{ orderId, patientId, destination, priority }` | `DesktopSidebar` (order count), `LaboratoryView` |
| `hmis:patient-module-state` | Patient selected in active workspace | `{ selectedPatientId, patientName, mrn }` | `DesktopSidebar` (contextual action buttons) |
| `hmis:open-module-waiting-list` | User clicks waiting list in sidebar | `{ moduleKey, departmentId }` | Active clinical workbench (OPD/IPD/Lab) |

---

## 4. Cross-Platform Local Storage Sync Keys

| Storage Key | Data Format | Purpose |
|---|---|---|
| `hmis_live_data_changed_at` | JSON string `{ changedAt, source, url }` | Cross-window & cross-app event invalidation trigger |
| `hmis_offline_mutation_queue` | JSON array of `QueuedMutation` objects | Persistent FIFO store for offline mutations |
| `hmis_sync_state` | JSON string `SyncState` | Cached sync connection state across reloads |
| `hmis.notifications.read` | JSON string array of notice IDs | Synchronized read states for topbar alert notifications |
| `hmis.notifications.dismissed` | JSON string array of notice IDs | Synchronized dismissed states for topbar alert notifications |
| `hmis_first_setup` | JSON object containing facility branding | Synchronized hospital name, logo, MFL code |
