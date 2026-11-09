
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  LifeBuoy,
  Maximize2,
  MessageSquarePlus,
  Minimize2,
  RefreshCw,
  Send,
  ShieldAlert,
  Wrench,
} from "lucide-react";
import { api } from "../lib/api";
import { useLiveRefresh } from "../lib/liveRefresh";

type HelpdeskTicket = {
  id: string;
  ticketCode: string;
  subject: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: string;
  category: string;
  team: "IT" | "MAINTENANCE" | "BIOMEDICAL" | "HOUSEKEEPING";
  queue: string;
  assignedTo: string;
  description: string;
  requestType?: string;
  subcategory?: string;
  location?: string;
  assetId?: string;
  patientId?: string;
  impact?: string;
  urgency?: string;
  createdAt: string;
  responseDueAt: string;
  resolutionDueAt: string;
  slaState: "ON_TARGET" | "APPROACHING" | "BREACHED";
  slaColor: "green" | "yellow" | "red";
  responseBreached: boolean;
  resolutionBreached: boolean;
  responseRemainingMinutes: number;
  resolutionRemainingMinutes: number;
  firstResponseAt?: string | null;
  resolutionSummary?: string;
  comments?: Array<{ id: string; at: string; author: string; message: string; internal: boolean }>;
};

const CATEGORY_OPTIONS = [
  { value: "INCIDENT", label: "Incident" },
  { value: "SERVICE_REQUEST", label: "Service request" },
  { value: "PROBLEM", label: "Problem" },
  { value: "INFORMATION", label: "Information" },
  { value: "ACCESS_REQUEST", label: "Access request" },
  { value: "IT", label: "IT" },
  { value: "MAINTENANCE", label: "Maintenance" },
  { value: "BIOMEDICAL", label: "Biomedical" },
  { value: "HOUSEKEEPING", label: "Housekeeping" },
  { value: "LOGIN_ISSUE", label: "Login issue" },
  { value: "NETWORK_ISSUE", label: "Network issue" },
  { value: "HARDWARE_FAILURE", label: "Hardware failure" },
  { value: "MAINTENANCE_REQUEST", label: "Maintenance request" },
];

const TEAM_OPTIONS = ["ALL", "IT", "MAINTENANCE", "BIOMEDICAL", "HOUSEKEEPING"];
const PRIORITY_OPTIONS = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
const STATUS_OPTIONS = ["ALL", "OPEN", "ASSIGNED", "IN_PROGRESS", "ON_HOLD", "WAITING_VENDOR", "ESCALATED", "PENDING_USER", "RESOLVED", "CLOSED", "REOPENED", "CANCELLED"];

const formatDateTime = (value?: string) => {
  const date = new Date(String(value || ""));
  if (!Number.isFinite(date.getTime())) return "Not available";
  return date.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
};

const formatDuration = (minutes: number) => {
  const abs = Math.abs(Math.round(minutes || 0));
  const hours = Math.floor(abs / 60);
  const mins = abs % 60;
  const text = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  return minutes < 0 ? `${text} late` : text;
};

const toastTone = (message: string) => {
  const lower = message.toLowerCase();
  if (/(failed|error|unable|required|breach|blocked|not allowed)/.test(lower)) return "error";
  if (/(warning|approaching|pending)/.test(lower)) return "warning";
  return "success";
};

export default function HelpdeskView() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [report, setReport] = useState<any>(null);
  const [catalog, setCatalog] = useState<any>(null);
  const [queues, setQueues] = useState<any>(null);
  const [tickets, setTickets] = useState<HelpdeskTicket[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");
  const [notice, setNotice] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [expandedTickets, setExpandedTickets] = useState(false);
  const [filters, setFilters] = useState({ team: "ALL", priority: "ALL", status: "ALL", search: "" });
  const [form, setForm] = useState({
    subject: "",
    category: "INCIDENT",
    priority: "MEDIUM",
    requestType: "INCIDENT",
    subcategory: "",
    location: "",
    assetId: "",
    patientId: "",
    impact: "MEDIUM",
    description: "",
  });
  const [commentForm, setCommentForm] = useState({ message: "", internal: false });
  const [statusForm, setStatusForm] = useState({ status: "IN_PROGRESS", reason: "", resolutionSummary: "" });

  const categoryOptions = useMemo(() => {
    const values = Array.isArray(catalog?.data) && catalog.data.length ? catalog.data : CATEGORY_OPTIONS.map((row) => row.value);
    return values.map((value: string) => ({ value, label: value.replace(/_/g, " ") }));
  }, [catalog]);
  const teamOptions = useMemo(() => Array.isArray(catalog?.teams) && catalog.teams.length ? ["ALL", ...catalog.teams] : TEAM_OPTIONS, [catalog]);
  const priorityOptions = useMemo(() => Array.isArray(catalog?.priorities) && catalog.priorities.length ? catalog.priorities : PRIORITY_OPTIONS, [catalog]);
  const statusOptions = useMemo(() => Array.isArray(catalog?.statuses) && catalog.statuses.length ? ["ALL", ...catalog.statuses] : STATUS_OPTIONS, [catalog]);

  const selectedTicket = useMemo(
    () => tickets.find((ticket) => ticket.id === selectedId) || tickets[0] || null,
    [selectedId, tickets],
  );

  const loadData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "250" });
      if (filters.status !== "ALL") params.set("status", filters.status);
      if (filters.priority !== "ALL") params.set("priority", filters.priority);
      if (filters.team !== "ALL") params.set("team", filters.team);
      if (filters.search.trim()) params.set("search", filters.search.trim());
      const [dashboardRes, ticketsRes, reportRes, catalogRes, queuesRes] = await Promise.all([
        api.get("/helpdesk/dashboard").catch(() => ({ data: null })),
        api.get(`/helpdesk/tickets?${params.toString()}`),
        api.get("/helpdesk/reports").catch(() => ({ data: null })),
        api.get("/helpdesk/categories").catch(() => ({ data: null })),
        api.get("/helpdesk/queues").catch(() => ({ data: null })),
      ]);
      const rows = Array.isArray(ticketsRes.data) ? ticketsRes.data : [];
      setDashboard(dashboardRes.data);
      setReport(reportRes.data);
      if (catalogRes.data) setCatalog(catalogRes.data);
      if (queuesRes.data) setQueues(queuesRes.data);
      setTickets(rows);
      if (rows.length > 0 && !rows.some((row: HelpdeskTicket) => row.id === selectedId)) {
        setSelectedId(rows[0].id);
      }
    } catch (error: any) {
      setNotice(error?.response?.data?.message || "Unable to load helpdesk tickets.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  useLiveRefresh(loadData, { intervalMs: 60000 });

  const createTicket = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.subject.trim() || !form.description.trim()) {
      setNotice("Subject and description are required.");
      return;
    }
    setSaving("create");
    try {
      const response = await api.post("/helpdesk/tickets", form);
      setNotice("Ticket created and routed to the correct team queue.");
      setForm({ subject: "", category: categoryOptions[0]?.value || "INCIDENT", priority: priorityOptions.includes("MEDIUM") ? "MEDIUM" : priorityOptions[0] || "MEDIUM", requestType: "INCIDENT", subcategory: "", location: "", assetId: "", patientId: "", impact: "MEDIUM", description: "" });
      setShowCreate(false);
      await loadData();
      if (response.data?.id) setSelectedId(response.data.id);
    } catch (error: any) {
      setNotice(error?.response?.data?.message || "Unable to create ticket.");
    } finally {
      setSaving("");
    }
  };

  const addComment = async () => {
    if (!selectedTicket || !commentForm.message.trim()) {
      setNotice("Select a ticket and enter a response.");
      return;
    }
    setSaving("comment");
    try {
      await api.post(`/helpdesk/tickets/${selectedTicket.id}/comments`, commentForm);
      setCommentForm({ message: "", internal: false });
      setNotice("Response added to the ticket.");
      await loadData();
    } catch (error: any) {
      setNotice(error?.response?.data?.message || "Unable to add response.");
    } finally {
      setSaving("");
    }
  };

  const updateStatus = async () => {
    if (!selectedTicket || !statusForm.reason.trim()) {
      setNotice("Select a ticket and enter a status reason.");
      return;
    }
    setSaving("status");
    try {
      await api.patch(`/helpdesk/tickets/${selectedTicket.id}/status`, statusForm);
      setNotice("Ticket status updated.");
      setStatusForm({ status: "IN_PROGRESS", reason: "", resolutionSummary: "" });
      await loadData();
    } catch (error: any) {
      setNotice(error?.response?.data?.message || "Unable to update ticket status.");
    } finally {
      setSaving("");
    }
  };

  const runTicketAction = async (action: "escalate" | "handover" | "feedback") => {
    if (!selectedTicket) return;
    const body = action === "feedback" ? { rating: 5, resolved: true, comment: "Confirmed from Helpdesk workspace" } : { reason: "Recorded from Helpdesk workspace" };
    setSaving(action);
    try {
      await api.post(`/helpdesk/tickets/${selectedTicket.id}/${action}`, body);
      setNotice(action === "escalate" ? "Ticket escalated and audit recorded." : action === "handover" ? "Ticket handover recorded." : "Requester feedback recorded.");
      await loadData();
    } catch (error: any) {
      setNotice(error?.response?.data?.message || `Unable to ${action} ticket.`);
    } finally {
      setSaving("");
    }
  };

  const totals = dashboard?.totals || {};
  const byTeam = dashboard?.byTeam || {};

  return (
    <div className="helpdesk-view">
      {notice ? (
        <div className={`helpdesk-toast ${toastTone(notice)}`}>
          <div className="helpdesk-toast-icon">
            {toastTone(notice) === "error" ? <AlertTriangle size={15} /> : <CheckCircle2 size={15} />}
          </div>
          <strong>{toastTone(notice) === "error" ? "Action blocked" : "Helpdesk"}</strong>
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice("")}>X</button>
        </div>
      ) : null}

      <div className="helpdesk-header">
        <div>
          <p>Support Services</p>
          <h1>Helpdesk</h1>
          <span>Priority queues, SLA clocks, team routing, response handling, and resolution tracking.</span>
        </div>
        <div className="helpdesk-header-actions">
          <button type="button" onClick={() => void loadData()} className="helpdesk-action-btn"><RefreshCw size={16} /> Refresh</button>
          <button type="button" onClick={() => setShowCreate(true)} className="helpdesk-action-btn primary"><LifeBuoy size={16} /> Create Routed Ticket</button>
        </div>
      </div>

      <div className="helpdesk-stats">
        {[
          ["Open", totals.open ?? 0, "#2563eb"],
          ["On Target", totals.onTarget ?? 0, "#16a34a"],
          ["Approaching", totals.approaching ?? 0, "#f59e0b"],
          ["Breached", totals.overdue ?? 0, "#dc2626"],
          ["Critical", totals.critical ?? 0, "#7f1d1d"],
          ["SLA Compliance", `${dashboard?.sla?.complianceRate ?? 100}%`, "#0f766e"],
        ].map(([label, value, color]) => (
          <div key={label} className="helpdesk-stat" style={{ borderLeftColor: String(color) }}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>

      <section className="helpdesk-report-strip">
        <div><span>Tickets in period</span><strong>{report?.totals?.total ?? totals.all ?? 0}</strong></div>
        <div><span>Resolved</span><strong>{report?.totals?.resolved ?? totals.resolved ?? 0}</strong></div>
        <div><span>Escalated</span><strong>{report?.totals?.escalated ?? queues?.escalated?.length ?? 0}</strong></div>
        <div><span>Reopened</span><strong>{report?.totals?.reopened ?? 0}</strong></div>
        <div><span>Resolution SLA</span><strong>{report?.slaCompliance ?? dashboard?.sla?.complianceRate ?? 100}%</strong></div>
      </section>

      <div className="helpdesk-team-grid">
        {teamOptions.filter((team: string) => team !== "ALL").map((team: string) => (
          <button
            type="button"
            key={team}
            className={`helpdesk-team-card ${filters.team === team ? "active" : ""}`}
            onClick={() => setFilters((current) => ({ ...current, team }))}
          >
            <Wrench size={16} />
            <span>{team.replace(/_/g, " ")}</span>
            <strong>{byTeam[team] ?? 0}</strong>
          </button>
        ))}
      </div>

      {showCreate ? (<div className="helpdesk-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowCreate(false); }}>
      <section className="helpdesk-create-panel helpdesk-create-modal">
        <div className="helpdesk-panel-title">
          <LifeBuoy size={18} />
          <div>
            <h2>Create Routed Ticket</h2>
            <p>Category selection automatically places the ticket into the right team queue.</p>
          </div>
          <button type="button" className="helpdesk-modal-close" onClick={() => setShowCreate(false)} aria-label="Close create ticket form">×</button>
        </div>
        <form onSubmit={createTicket} className="helpdesk-form">
          <label>
            <span>Subject</span>
            <input value={form.subject} onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))} placeholder="Short issue summary" />
          </label>
          <label>
            <span>Category</span>
            <select value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}>
              {categoryOptions.map((option: { value: string; label: string }) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <label>
            <span>Request type</span>
            <select value={form.requestType} onChange={(event) => setForm((current) => ({ ...current, requestType: event.target.value }))}>
              {categoryOptions.slice(0, 5).map((option: { value: string; label: string }) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <label>
            <span>Priority</span>
            <select value={form.priority} onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value }))}>
              {priorityOptions.map((priority: string) => <option key={priority} value={priority}>{priority}</option>)}
            </select>
          </label>
          <label className="wide">
            <span>Location / department</span>
            <input value={form.location} onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))} placeholder="Ward, clinic, office, or facility location" />
          </label>
          <label>
            <span>Asset / equipment ID</span>
            <input value={form.assetId} onChange={(event) => setForm((current) => ({ ...current, assetId: event.target.value }))} placeholder="Optional asset or biomedical equipment" />
          </label>
          <label>
            <span>Patient context</span>
            <input value={form.patientId} onChange={(event) => setForm((current) => ({ ...current, patientId: event.target.value }))} placeholder="Optional patient/MRN reference" />
          </label>
          <label className="wide">
            <span>Description</span>
            <textarea rows={3} value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} placeholder="Describe the issue, location, asset, user, or impacted workflow" />
          </label>
          <div className="helpdesk-form-footer">
            <button type="submit" className="helpdesk-action-btn primary" disabled={saving === "create"}>
              <Send size={16} /> {saving === "create" ? "Creating..." : "Create Ticket"}
            </button>
          </div>
        </form>
      </section>
      </div>) : null}

      <div className="helpdesk-workspace">
        <section className={`helpdesk-list-panel ${expandedTickets ? "expanded" : ""}`}>
          <div className="helpdesk-table-heading">
            <div><h2>Support Tickets</h2><span>{tickets.length} ticket{tickets.length === 1 ? "" : "s"} in view</span></div>
            <button type="button" className="helpdesk-expand-btn" onClick={() => setExpandedTickets((value) => !value)} aria-label={expandedTickets ? "Collapse ticket table" : "Expand ticket table"} title={expandedTickets ? "Collapse" : "Expand"}>
              {expandedTickets ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
          </div>
          <div className="helpdesk-filters">
            <input value={filters.search} onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))} placeholder="Search tickets..." />
            <select value={filters.team} onChange={(event) => setFilters((current) => ({ ...current, team: event.target.value }))}>
              {teamOptions.map((team: string) => <option key={team} value={team}>{team}</option>)}
            </select>
            <select value={filters.priority} onChange={(event) => setFilters((current) => ({ ...current, priority: event.target.value }))}>
              <option value="ALL">ALL PRIORITIES</option>
              {priorityOptions.map((priority: string) => <option key={priority} value={priority}>{priority}</option>)}
            </select>
            <select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}>
              {statusOptions.map((status: string) => <option key={status} value={status}>{status}</option>)}
            </select>
            <button type="button" onClick={() => void loadData()} className="helpdesk-action-btn">Apply</button>
          </div>

          <div className="helpdesk-ticket-list">
            {loading ? (
              <div className="helpdesk-empty">Loading tickets...</div>
            ) : tickets.length ? tickets.map((ticket) => (
              <button
                type="button"
                key={ticket.id}
                className={`helpdesk-ticket-row ${selectedTicket?.id === ticket.id ? "selected" : ""}`}
                onClick={() => setSelectedId(ticket.id)}
              >
                <div className="helpdesk-ticket-main">
                  <span className={`helpdesk-sla-dot ${ticket.slaColor}`} />
                  <div>
                    <strong>{ticket.subject}</strong>
                    <small>{ticket.ticketCode} • {ticket.team} • {ticket.queue}</small>
                  </div>
                </div>
                <div className="helpdesk-ticket-meta">
                  <span className={`helpdesk-priority ${ticket.priority.toLowerCase()}`}>{ticket.priority}</span>
                  <span>{ticket.status}</span>
                  <span>{formatDuration(ticket.resolutionRemainingMinutes)}</span>
                </div>
              </button>
            )) : (
              <div className="helpdesk-empty">No tickets match the current filters.</div>
            )}
          </div>
        </section>

        <aside className="helpdesk-detail-panel">
          {selectedTicket ? (
            <>
              <div className="helpdesk-detail-head">
                <div>
                  <p>{selectedTicket.ticketCode}</p>
                  <h2>{selectedTicket.subject}</h2>
                  <span>{selectedTicket.category.replace(/_/g, " ")} • {selectedTicket.team} queue</span>
                </div>
                <span className={`helpdesk-sla-badge ${selectedTicket.slaColor}`}>
                  {selectedTicket.slaState.replace(/_/g, " ")}
                </span>
              </div>

              <div className="helpdesk-sla-grid">
                <div>
                  <span>Response Due</span>
                  <strong>{formatDateTime(selectedTicket.responseDueAt)}</strong>
                  <small>{selectedTicket.firstResponseAt ? "Responded" : formatDuration(selectedTicket.responseRemainingMinutes)}</small>
                </div>
                <div>
                  <span>Resolution Due</span>
                  <strong>{formatDateTime(selectedTicket.resolutionDueAt)}</strong>
                  <small>{formatDuration(selectedTicket.resolutionRemainingMinutes)}</small>
                </div>
              </div>

              <div className="helpdesk-description">
                <span>Description</span>
                <p>{selectedTicket.description || "No description recorded."}</p>
              </div>

              <div className="helpdesk-response-grid">
                <label>
                  <span>Response</span>
                  <textarea rows={3} value={commentForm.message} onChange={(event) => setCommentForm((current) => ({ ...current, message: event.target.value }))} placeholder="Add response or internal note" />
                </label>
                <label className="helpdesk-check">
                  <input type="checkbox" checked={commentForm.internal} onChange={(event) => setCommentForm((current) => ({ ...current, internal: event.target.checked }))} />
                  Internal note
                </label>
                <button type="button" onClick={() => void addComment()} className="helpdesk-action-btn" disabled={saving === "comment"}>
                  <MessageSquarePlus size={16} /> {saving === "comment" ? "Saving..." : "Add Response"}
                </button>
              </div>

              <div className="helpdesk-status-box">
                <label>
                  <span>Status</span>
                  <select value={statusForm.status} onChange={(event) => setStatusForm((current) => ({ ...current, status: event.target.value }))}>
                    {statusOptions.filter((status: string) => status !== "ALL").map((status: string) => <option key={status} value={status}>{status}</option>)}
                  </select>
                </label>
                <label>
                  <span>Reason</span>
                  <input value={statusForm.reason} onChange={(event) => setStatusForm((current) => ({ ...current, reason: event.target.value }))} placeholder="Why the status changed" />
                </label>
                <label className="wide">
                  <span>Resolution Summary</span>
                  <textarea rows={3} value={statusForm.resolutionSummary} onChange={(event) => setStatusForm((current) => ({ ...current, resolutionSummary: event.target.value }))} placeholder="Required when resolving or closing" />
                </label>
                <button type="button" onClick={() => void updateStatus()} className="helpdesk-action-btn primary" disabled={saving === "status"}>
                  <ShieldAlert size={16} /> {saving === "status" ? "Updating..." : "Update Status"}
                </button>
              </div>

              <div className="helpdesk-ticket-actions">
                <button type="button" className="helpdesk-action-btn" onClick={() => void runTicketAction("escalate")} disabled={Boolean(saving)}><ShieldAlert size={15} /> Escalate</button>
                <button type="button" className="helpdesk-action-btn" onClick={() => void runTicketAction("handover")} disabled={Boolean(saving)}><Clock3 size={15} /> Handover</button>
                <button type="button" className="helpdesk-action-btn" onClick={() => void runTicketAction("feedback")} disabled={Boolean(saving)}><CheckCircle2 size={15} /> Confirm resolved</button>
              </div>

              <div className="helpdesk-comments">
                <h3>Conversation</h3>
                {(selectedTicket.comments || []).slice(-6).map((comment) => (
                  <div key={comment.id} className="helpdesk-comment">
                    <strong>{comment.author || "Support"}</strong>
                    <span>{formatDateTime(comment.at)}{comment.internal ? " • Internal" : ""}</span>
                    <p>{comment.message}</p>
                  </div>
                ))}
                {(selectedTicket.comments || []).length === 0 ? <div className="helpdesk-empty">No responses yet.</div> : null}
              </div>
            </>
          ) : (
            <div className="helpdesk-empty">Select a ticket to review SLA and responses.</div>
          )}
        </aside>
      </div>
    </div>
  );
}
