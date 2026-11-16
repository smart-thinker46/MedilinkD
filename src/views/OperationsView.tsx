// Ported from Medilink-Frontend/src/app/operations/page.tsx for desktop parity.
import { type FormEvent, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Building2,
  X,
  CheckCircle2,
  CreditCard,
  FileCheck2,
  HelpCircle,
  RefreshCw,
  ShieldCheck,
  TicketCheck,
  Plus,
  Maximize2,
  Minimize2,
  WifiOff,
} from "lucide-react";
import { api } from "../lib/api";
import { useLiveRefresh } from "../lib/liveRefresh";

type OperationsDashboard = {
  activeSubscriptions?: number;
  overdueInvoices?: number;
  openP1Tickets?: number;
  openTickets?: number;
  pendingOffline?: number;
  offlineConflicts?: number;
  vendor?: { vendors?: { total?: number; active?: number; highRisk?: number }; contracts?: { expiringSoon?: number }; service?: { openRequests?: number; expiringCompliance?: number } };
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const errorMessage = (error: unknown, fallback: string) => {
  if (!isRecord(error)) return fallback;
  const response = isRecord(error.response) ? error.response : null;
  const data = response && isRecord(response.data) ? response.data : null;
  return String(data?.message || error.message || fallback);
};

export default function OperationsView() {
  const [dashboard, setDashboard] = useState<OperationsDashboard>({});
  const [legalStatus, setLegalStatus] = useState<Record<string, unknown> | null>(null);
  const [activePanel, setActivePanel] = useState<"support" | "offline" | "legal" | "vendor" | null>(null);
  const [vendors, setVendors] = useState<any[]>([]);
  const [supportTickets, setSupportTickets] = useState<any[]>([]);
  const [vendorName, setVendorName] = useState("");
  const [vendorCategory, setVendorCategory] = useState("GENERAL");
  const [vendorPerformance, setVendorPerformance] = useState<any>(null);
  const [expandedVendorTable, setExpandedVendorTable] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<{ kind: "vendor" | "ticket"; row: any } | null>(null);
  const [recordForm, setRecordForm] = useState<any>({});
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      const [dashboardRes, legalRes, vendorsRes, performanceRes, supportRes] = await Promise.all([
        api.get("/operations/dashboard"),
        api.get("/operations/legal/compliance-status"),
        api.get("/operations/vendor/vendors").catch(() => ({ data: [] })),
        api.get("/operations/vendor-performance").catch(() => ({ data: null })),
        api.get("/operations/support/tickets?limit=100").catch(() => ({ data: [] })),
      ]);
      setDashboard(dashboardRes.data || {});
      setLegalStatus(legalRes.data || null);
      setVendors(Array.isArray(vendorsRes.data) ? vendorsRes.data : []);
      setVendorPerformance(performanceRes.data || null);
      setSupportTickets(Array.isArray(supportRes.data) ? supportRes.data : []);
    } catch (err: unknown) {
      setError(errorMessage(err, "Could not load operations dashboard."));
    }
  };

  const createVendor = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!vendorName.trim()) return;
    setBusy(true); setError(""); setNotice("");
    try {
      await api.post("/operations/vendor/vendors", { legalName: vendorName.trim(), category: vendorCategory, status: "VENDOR_PROPOSED" });
      setVendorName(""); setVendorCategory("GENERAL"); setActivePanel(null); setNotice("Vendor proposed for controlled onboarding."); await load();
    } catch (err: unknown) { setError(errorMessage(err, "Could not create vendor record.")); }
    finally { setBusy(false); }
  };

  const openRecord = (kind: "vendor" | "ticket", row: any) => {
    setSelectedRecord({ kind, row });
    setRecordForm({
      legalName: row.legalName || row.tradingName || "",
      category: row.category || "GENERAL",
      status: row.status || (kind === "ticket" ? "OPEN" : "VENDOR_PROPOSED"),
      subject: row.subject || "",
      description: row.description || "",
      priority: row.priority || "P3",
      assignedTo: row.assignedTo || "",
    });
  };

  const saveRecord = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedRecord) return;
    setBusy(true); setError(""); setNotice("");
    try {
      if (selectedRecord.kind === "vendor") {
        await api.patch(`/operations/vendor/vendors/${selectedRecord.row.id}`, recordForm);
      } else {
        await api.patch(`/operations/support/tickets/${selectedRecord.row.id}`, recordForm);
      }
      setSelectedRecord(null); setNotice("Record updated successfully."); await load();
    } catch (err: unknown) { setError(errorMessage(err, "Could not update record.")); }
    finally { setBusy(false); }
  };

  useEffect(() => {
    void load();
  }, []);

  useLiveRefresh(load, { intervalMs: 90000 });

  const createSupportTicket = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setNotice("");
    setError("");
    try {
      await api.post("/operations/support/tickets", {
        priority: "P2",
        category: "VENDOR_SUPPORT",
        subject,
        description,
      });
      setSubject("");
      setDescription("");
      setNotice("Support ticket created with SLA tracking.");
      setActivePanel(null);
      await load();
    } catch (err: unknown) {
      setError(errorMessage(err, "Could not create ticket."));
    } finally {
      setBusy(false);
    }
  };

  const createOfflineBatch = async () => {
    setBusy(true);
    setNotice("");
    setError("");
    try {
      await api.post("/operations/offline/sync-batches", {
        moduleCode: "CLINICAL_DOWNTIME",
        clientId: `web-${Date.now()}`,
        metadata: {
          policy: "Preserve every clinical action by timestamp and flag conflicts for review.",
        },
      });
      setNotice("Offline sync batch created for downtime reconciliation.");
      setActivePanel(null);
      await load();
    } catch (err: unknown) {
      setError(errorMessage(err, "Could not create offline batch."));
    } finally {
      setBusy(false);
    }
  };

  const stats = useMemo(
    () => [
      {
        label: "Active Subscriptions",
        value: dashboard.activeSubscriptions || 0,
        icon: CreditCard,
        color: "#16a34a",
      },
      {
        label: "Overdue Invoices",
        value: dashboard.overdueInvoices || 0,
        icon: AlertTriangle,
        color: "#dc2626",
      },
      {
        label: "Open P1 Tickets",
        value: dashboard.openP1Tickets || 0,
        icon: HelpCircle,
        color: "#f59e0b",
      },
      {
        label: "Open Tickets",
        value: dashboard.openTickets || 0,
        icon: TicketCheck,
        color: "#2563eb",
      },
      {
        label: "Pending Offline",
        value: dashboard.pendingOffline || 0,
        icon: WifiOff,
        color: "#7c3aed",
      },
      {
        label: "Offline Conflicts",
        value: dashboard.offlineConflicts || 0,
        icon: ShieldCheck,
        color: "#0891b2",
      },
      {
        label: "Legal Framework",
        value: legalStatus?.ready ? "Ready" : "Pending",
        icon: FileCheck2,
        color: legalStatus?.ready ? "#16a34a" : "#f59e0b",
      },
      { label: "Active Vendors", value: dashboard.vendor?.vendors?.active || 0, icon: Building2, color: "#0f766e" },
      { label: "Vendor Requests", value: dashboard.vendor?.service?.openRequests || 0, icon: TicketCheck, color: "#7c3aed" },
      { label: "Contracts Expiring", value: dashboard.vendor?.contracts?.expiringSoon || 0, icon: AlertTriangle, color: "#f59e0b" },
      { label: "High-Risk Vendors", value: dashboard.vendor?.vendors?.highRisk || 0, icon: ShieldCheck, color: "#dc2626" },
      { label: "Vendor SLA", value: `${vendorPerformance?.slaCompliance ?? 100}%`, icon: CheckCircle2, color: "#16a34a" },
    ],
    [dashboard, legalStatus, vendorPerformance],
  );

  const operationRows = [
    {
      event: "Vendor support SLA",
      status: `${dashboard.openP1Tickets || 0} P1 open`,
      owner: "Medilink Support",
      action: "30 min response",
    },
    {
      event: "Subscription safety",
      status: `${dashboard.overdueInvoices || 0} overdue`,
      owner: "Customer Success",
      action: "Grace-period review",
    },
    {
      event: "Offline reconciliation",
      status: `${dashboard.offlineConflicts || 0} conflicts`,
      owner: "ICT & Security",
      action: "Clinical review required",
    },
  ];

  return (
    <div className="patients-view operations-module-view">
      <section className="pv-header">
        <div>
          <h1 className="pv-title">Continuity, Subscription & Support</h1>
          <p className="pv-subtitle">
            Manage tenant billing safety, vendor support SLAs, legal readiness, onboarding, and
            offline reconciliation without interrupting active clinical care.
          </p>
        </div>
        <div className="module-actions">
          <button type="button" onClick={load} disabled={busy}>
            <RefreshCw size={16} />
            Refresh
          </button>
          <button type="button" onClick={() => setActivePanel("support")}>
            <HelpCircle size={16} />
            Vendor Support
          </button>
          <button type="button" onClick={() => setActivePanel("offline")}>
            <WifiOff size={16} />
            Downtime Batch
          </button>
          <button type="button" onClick={() => setActivePanel("legal")}>
            <ShieldCheck size={16} />
            Legal Readiness
          </button>
          <button type="button" onClick={() => setActivePanel("vendor")}>
            <Plus size={16} />
            Register Vendor
          </button>
        </div>
      </section>

      {notice ? <div className="platform-notice operations-notice">{notice}</div> : null}
      {error ? <div className="platform-error operations-notice">{error}</div> : null}

      <section className="pv-stats operations-stat-grid">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <article key={stat.label} className="pv-stat-card" style={{ borderLeftColor: stat.color }}>
              <div className="operations-stat-head">
                <p className="pv-stat-label">{stat.label}</p>
                <Icon size={17} />
              </div>
              <strong className="pv-stat-value">{stat.value}</strong>
            </article>
          );
        })}
      </section>

      <section className="operations-workspace">
        <section className="pv-table-wrap operations-table-wrap">
          <div className="operations-table-header">
            <div>
              <h3>Operations Control Register</h3>
              <p>Live continuity, support, and subscription controls.</p>
            </div>
            <span>{operationRows.length} controls</span>
          </div>
          <div className="operations-table-scroll">
            <table className="pv-table operations-table">
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Status</th>
                  <th>Owner</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {operationRows.map((row) => (
                  <tr key={row.event}>
                    <td>
                      <span className="operations-event-cell">
                        <ShieldCheck size={16} />
                        <strong>{row.event}</strong>
                      </span>
                    </td>
                    <td>
                      <span className="operations-status-pill">{row.status}</span>
                    </td>
                    <td>{row.owner}</td>
                    <td>
                      <span className="operations-action-pill">{row.action}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </section>

      <section className={`pv-table-wrap operations-table-wrap operations-vendor-table ${expandedVendorTable ? "operations-table-expanded" : ""}`}>
        <div className="operations-table-header"><div><h3>Vendor Relationship Register</h3><p>Authoritative vendor records and onboarding status.</p></div><div className="operations-table-heading-actions"><span>{vendors.length} vendors</span><button type="button" className="operations-expand-btn" onClick={() => setExpandedVendorTable((value) => !value)} aria-label={expandedVendorTable ? "Collapse vendor table" : "Expand vendor table"}>{expandedVendorTable ? <Minimize2 size={15} /> : <Maximize2 size={15} />}</button></div></div>
        <div className="operations-table-scroll"><table className="pv-table operations-table"><thead><tr><th>Vendor</th><th>Category</th><th>Status</th><th>Created</th></tr></thead><tbody>{vendors.length ? vendors.map((vendor) => <tr key={vendor.id} className="operations-clickable-row" onClick={() => openRecord("vendor", vendor)} tabIndex={0} onKeyDown={(event) => { if (event.key === "Enter") openRecord("vendor", vendor); }}><td><strong>{vendor.legalName || vendor.tradingName || "Unnamed vendor"}</strong></td><td>{String(vendor.category || "GENERAL").replace(/_/g, " ")}</td><td><span className="operations-status-pill">{vendor.status || "VENDOR_PROPOSED"}</span></td><td>{vendor.createdAt ? new Date(vendor.createdAt).toLocaleDateString() : "—"}</td></tr>) : <tr><td colSpan={4}>No vendor records found.</td></tr>}</tbody></table></div>
      </section>

      <section className="pv-table-wrap operations-table-wrap">
        <div className="operations-table-header"><div><h3>Vendor Support Requests</h3><p>Live support requests and vendor-related operational work.</p></div><span>{supportTickets.length} requests</span></div>
        <div className="operations-table-scroll"><table className="pv-table operations-table"><thead><tr><th>Ticket</th><th>Subject</th><th>Priority</th><th>Status</th><th>Created</th></tr></thead><tbody>{supportTickets.length ? supportTickets.map((ticket) => <tr key={ticket.id} className="operations-clickable-row" onClick={() => openRecord("ticket", ticket)} tabIndex={0} onKeyDown={(event) => { if (event.key === "Enter") openRecord("ticket", ticket); }}><td><strong>{ticket.ticketNo || ticket.id}</strong></td><td>{ticket.subject || "—"}</td><td>{ticket.priority || "P3"}</td><td><span className="operations-status-pill">{ticket.status || "OPEN"}</span></td><td>{ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString() : "—"}</td></tr>) : <tr><td colSpan={5}>No vendor support requests found.</td></tr>}</tbody></table></div>
      </section>

      {selectedRecord && (
        <div className="module-modal-backdrop" onClick={() => setSelectedRecord(null)}>
          <form className="module-modal operations-modal operations-record-modal" onClick={(event) => event.stopPropagation()} onSubmit={saveRecord}>
            <div className="operations-form-header support"><Building2 size={20} /><div><h2>{selectedRecord.kind === "vendor" ? "Vendor Details" : "Support Ticket Details"}</h2><p>Review and update this operational record.</p></div><button type="button" className="modal-close-btn" onClick={() => setSelectedRecord(null)} aria-label="Close record"><X size={16} /></button></div>
            <div className="operations-form-grid">
              {selectedRecord.kind === "vendor" ? <><label><span>Legal / trading name</span><input value={recordForm.legalName} onChange={(event) => setRecordForm((current: any) => ({ ...current, legalName: event.target.value }))} required /></label><label><span>Classification</span><input value={recordForm.category} onChange={(event) => setRecordForm((current: any) => ({ ...current, category: event.target.value }))} /></label><label><span>Status</span><select value={recordForm.status} onChange={(event) => setRecordForm((current: any) => ({ ...current, status: event.target.value }))}><option>VENDOR_PROPOSED</option><option>DOCUMENTS_PENDING</option><option>DUE_DILIGENCE</option><option>APPROVED</option><option>ACTIVE</option><option>SUSPENDED</option><option>BLOCKED</option><option>EXPIRED</option><option>TERMINATED</option></select></label></> : <><label><span>Subject</span><input value={recordForm.subject} onChange={(event) => setRecordForm((current: any) => ({ ...current, subject: event.target.value }))} required /></label><label><span>Priority</span><select value={recordForm.priority} onChange={(event) => setRecordForm((current: any) => ({ ...current, priority: event.target.value }))}><option>P1</option><option>P2</option><option>P3</option><option>P4</option></select></label><label><span>Status</span><select value={recordForm.status} onChange={(event) => setRecordForm((current: any) => ({ ...current, status: event.target.value }))}><option>OPEN</option><option>IN_PROGRESS</option><option>PENDING</option><option>ESCALATED</option><option>RESOLVED</option><option>CLOSED</option><option>CANCELLED</option></select></label><label><span>Assigned to</span><input value={recordForm.assignedTo} onChange={(event) => setRecordForm((current: any) => ({ ...current, assignedTo: event.target.value }))} /></label><label className="full"><span>Description</span><textarea value={recordForm.description} onChange={(event) => setRecordForm((current: any) => ({ ...current, description: event.target.value }))} rows={4} /></label></>}
            </div>
            <div className="operations-form-footer"><button type="button" className="operations-cancel-btn" onClick={() => setSelectedRecord(null)}>Cancel</button><button type="submit" disabled={busy}><CheckCircle2 size={16} /> Save changes</button></div>
          </form>
        </div>
      )}

      {activePanel && (
        <div className="module-modal-backdrop" onClick={() => setActivePanel(null)}>
          <div
            className="module-modal operations-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            {activePanel === "support" && (
              <form onSubmit={createSupportTicket}>
                <div className="operations-form-header support">
                  <HelpCircle size={20} />
                  <div>
                    <h2>Vendor Support Ticket</h2>
                    <p>Open a tracked ticket for software, integration, licensing, migration, or training support.</p>
                  </div>
                  <button type="button" className="modal-close-btn" onClick={() => setActivePanel(null)} aria-label="Close form">
                    <X size={16} />
                  </button>
                </div>
                <div className="operations-form-grid">
                  <label>
                    <span>Subject *</span>
                    <input value={subject} onChange={(event) => setSubject(event.target.value)} required />
                  </label>
                  <label className="full">
                    <span>Description *</span>
                    <textarea value={description} onChange={(event) => setDescription(event.target.value)} required />
                  </label>
                </div>
                <div className="operations-form-footer">
                  <button type="button" className="operations-cancel-btn" onClick={() => setActivePanel(null)}>
                    Cancel
                  </button>
                  <button type="submit" disabled={busy}>
                    <TicketCheck size={16} />
                    Create Ticket
                  </button>
                </div>
              </form>
            )}

            {activePanel === "offline" && (
              <>
                <div className="operations-form-header offline">
                  <WifiOff size={20} />
                  <div>
                    <h2>Offline Reconciliation</h2>
                    <p>Start a controlled downtime batch where clinical records sync back without last-write-wins.</p>
                  </div>
                  <button type="button" className="modal-close-btn" onClick={() => setActivePanel(null)} aria-label="Close form">
                    <X size={16} />
                  </button>
                </div>
                <div className="operations-offline-copy">
                  <CheckCircle2 size={18} />
                  <span>
                    Clinical sync keeps every record with timestamps and flags conflicts for clinical review.
                  </span>
                </div>
                <div className="operations-form-footer">
                  <button type="button" className="operations-cancel-btn" onClick={() => setActivePanel(null)}>
                    Cancel
                  </button>
                  <button type="button" onClick={createOfflineBatch} disabled={busy}>
                    <WifiOff size={16} />
                    Start Downtime Batch
                  </button>
                </div>
              </>
            )}

            {activePanel === "legal" && (
              <>
                <div className="operations-form-header legal">
                  <ShieldCheck size={20} />
                  <div>
                    <h2>Legal Readiness</h2>
                    <p>Track DPA, terms, compliance evidence, and safe service-suspension governance.</p>
                  </div>
                  <button type="button" className="modal-close-btn" onClick={() => setActivePanel(null)} aria-label="Close form">
                    <X size={16} />
                  </button>
                </div>
                <div className="operations-legal-state">
                  <strong>{legalStatus?.ready ? "Ready" : "Pending"}</strong>
                  <span>Legal framework status</span>
                </div>
                <div className="operations-form-footer">
                  <button type="button" onClick={() => setActivePanel(null)}>
                    Close Legal Readiness
                  </button>
                </div>
              </>
            )}

            {activePanel === "vendor" && (
              <form onSubmit={createVendor}>
                <div className="operations-form-header support"><Building2 size={20} /><div><h2>Register Vendor</h2><p>Create a controlled vendor record before contracts, compliance, and service requests are attached.</p></div><button type="button" className="modal-close-btn" onClick={() => setActivePanel(null)} aria-label="Close form"><X size={16} /></button></div>
                <div className="operations-form-grid"><label><span>Legal / trading name *</span><input value={vendorName} onChange={(event) => setVendorName(event.target.value)} required placeholder="Vendor legal name" /></label><label><span>Classification</span><select value={vendorCategory} onChange={(event) => setVendorCategory(event.target.value)}><option>GENERAL</option><option>BIOMEDICAL</option><option>ICT</option><option>FACILITY_MAINTENANCE</option><option>LABORATORY</option><option>SECURITY</option><option>WASTE_MANAGEMENT</option></select></label></div>
                <div className="operations-form-footer"><button type="button" className="operations-cancel-btn" onClick={() => setActivePanel(null)}>Cancel</button><button type="submit" disabled={busy}><Building2 size={16} /> Propose Vendor</button></div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
