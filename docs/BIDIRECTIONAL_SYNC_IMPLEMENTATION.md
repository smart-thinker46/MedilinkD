# Medilink HMIS — Bidirectional Synchronization Implementation Guide
**Platform:** Medilink-Desktop & Medilink-Frontend  
**Target Architecture:** Authoritative Backend Real-Time State Sync

---

## 1. Synchronization Architecture Overview

Medilink HMIS ensures complete data and workflow consistency across both web and native desktop applications. Rather than maintaining disparate data sets or competing client databases, the system uses a 4-tier bidirectional synchronization architecture:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Tier 1: Cloud Backend                           │
│  NestJS Controllers & Services • PostgreSQL Master • Pusher Realtime   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    │ WebSocket / REST API
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     Tier 2: Desktop Sync Engine                        │
│  Connection Monitor • Event Bus Router • Offline Mutation FIFO Queue   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    │ Local Events / IndexedDB Fallback
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                    Tier 3: UI State & Invalidation                     │
│  useLiveRefresh Hooks • CustomEvent Dispatcher • Zustand Global Store  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    │ Reactive DOM Rerender
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                  Tier 4: Visual Parity & Sync Badge                    │
│  Topbar Status Badge • Module Card Grids • Real-time Notification Hub  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Core Synchronization Components

### 2.1 SyncEngine (`src/lib/syncEngine.ts`)
The `SyncEngine` is a singleton service responsible for managing client-backend synchronization:
- **Connection State Machine:** Tracks `online`, `syncing`, `offline`, and `connecting` states based on `navigator.onLine` and WebSocket connectivity.
- **WebSocket Gateway:** Connects to the Pusher WebSocket gateway (`wss://ws-${cluster}.pusher.com/app/${key}`) and subscribes to the tenant channel (`tenant-${tenantType}-${tenantId}`).
- **Event Dispatcher:** Decodes inbound real-time frames into typed application events (`hmis:patient-transfer-event`, `hmis:patient-queued`, `hmis:clinical-order-created`, etc.).
- **Offline Mutation Queue:** Persists mutations (`POST`, `PUT`, `PATCH`, `DELETE`) executed during network outages to local storage.
- **Automatic Queue Replay:** When connectivity is restored, flushes pending mutations in FIFO order with automatic exponential backoff retry.

### 2.2 Live Refresh Hook (`src/lib/liveRefresh.ts`)
The enhanced `useLiveRefresh` hook provides multi-vector data invalidation:
1. **Background Polling Interval:** Safe fallback polling (e.g., 30s-90s) while the tab or desktop window is active.
2. **Window Focus / Visibility Change:** Triggers immediate reload when the user switches to the Medilink window after performing actions elsewhere.
3. **Cross-Tab / Cross-Process Broadcast:** Listens to `storage` events on key `hmis_live_data_changed_at`, ensuring that changes made in the Web app or a peer desktop instance immediately invalidate active views.
4. **Local Event Invalidation:** Listens to `hmis:live-data-changed` DOM events dispatched by mutation interceptors.
5. **Throttling:** Prevents duplicate concurrent fetches within a 1.5-second debounce window.

### 2.3 Mutation Interceptor in `apiClient.ts`
All HTTP write operations passing through `apiFetch`:
- Check CSRF token requirements.
- On successful HTTP 200/201 response, automatically trigger `notifyLiveDataChanged({ method, url: path, source: 'desktop' })`.
- If a mutation fails because the client is offline (`!navigator.onLine`), intercepts the call, enqueues the payload into `syncEngine.enqueueMutation(...)`, and returns a safe HTTP 202 Accepted response.

---

## 3. Workflow Synchronization Walkthroughs

### Workflow A: Patient Registration & Triage
1. **Frontend Action:** A nurse registers a new patient in Medilink-Frontend (`/patients`).
2. **Backend Execution:** Backend writes record to PostgreSQL, increments the facility patient count, and triggers event `patient_created`.
3. **Desktop Synchronization:**
   - Desktop receives Pusher event on `tenant-HOSPITAL-${facilityId}` or detects `hmis_live_data_changed_at` storage event.
   - Desktop `PatientsView` invalidates its query cache and re-fetches the latest patient register.
   - The new patient appears in Desktop's patient register without manual page refresh.
4. **Desktop Mutation:** Desktop user selects the patient and clicks "Queue Patient" to OPD.
5. **Sync Back:** Desktop dispatches POST to `/opd/queue`, which emits `hmis:patient-queued`.
6. **Frontend Update:** Frontend OPD Queue board instantly reflects the waiting patient.

### Workflow B: Clinical Orders & Diagnostics
1. **Doctor in Desktop:** Doctor issues a lab test order from the EHR consultation module.
2. **Backend Routing:** Order is created in `/orchestration/orders` with destination `LABORATORY`.
3. **Real-time Event:** Backend broadcasts `clinical_order_created`.
4. **Lab Workbench:** The laboratory technician working in Medilink-Frontend sees the order counter increment immediately on their sidebar (`Open Waiting List: 1`).
5. **Result Entry:** Lab technician enters hemoglobin results and marks test "COMPLETED".
6. **Instant Delivery:** Doctor's consultation window in Desktop receives the completed test result in real time.

---

## 4. Conflict Resolution & Idempotency Rules

1. **Idempotency Keys:** Clinical and financial mutations carry unique client-generated request tokens to prevent double-charging or duplicate order creation during retries.
2. **Optimistic Locking:** Entity updates carry `updatedAt` / `version` timestamps. If a concurrent modification occurs, the backend rejects the stale update with HTTP 409 Conflict, and the client displays the server's authoritative state.
3. **Financial Integrity:** Invoices, payments, and receipt numbers are exclusively generated by backend sequences; client applications never generate fiscal sequence numbers locally.

