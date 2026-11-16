// Ported from Medilink-Frontend/src/app/orchestration/page.tsx for desktop parity.
import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BellRing,
  CalendarClock,
  CheckCircle2,
  GitBranch,
  Maximize2,
  Minimize2,
  Play,
  Pause,
  RefreshCw,
  Route,
  Search,
  Send,
  Settings2,
  X,
} from "lucide-react";
import { api } from "../lib/api";

const emptyWorkflow = {
  name: "Critical inpatient lab result communication",
  description: "Alert clinical teams and log the critical value communication trail.",
  triggerModule: "LABORATORY",
  triggerEvent: "LAB_RESULT_COMPLETED",
  conditionField: "criticalValue",
  conditionOperator: "eq",
  conditionValue: "true",
  actionOne: "SEND_SMS",
  actionOneRole: "ORDERING_DOCTOR",
  actionTwo: "IN_APP_NOTIFICATION",
  actionTwoRole: "WARD_NURSE_IN_CHARGE",
};

const emptyTask = {
  name: "Monthly stock reconciliation",
  taskCode: "MONTHLY_STOCK_RECONCILIATION",
  cron: "0 7 1 * *",
  ownerRole: "PHARMACY_MANAGER",
  category: "PHARMACY",
  description: "Reconcile high-value inventory at the start of each month.",
  timezone: "Africa/Nairobi",
  scheduleType: "CRON",
  criticality: "STANDARD",
  slaMinutes: "60",
  enabled: true,
};

const emptyEscalation = {
  chainCode: "PREAUTH_DELAY",
  subjectType: "PRE_AUTHORISATION_REQUEST",
  subjectId: "",
  patientId: "",
};

const emptyEvent = {
  eventType: "LAB_RESULT_COMPLETED",
  sourceModule: "LABORATORY",
  entityType: "LAB_RESULT",
  entityId: "",
  patientId: "",
  payload: "{}",
  processAsync: false,
};
const emptyChain = {
  chainCode: "PREAUTH_DELAY",
  name: "Pre-authorisation delay escalation",
  triggerType: "PRE_AUTHORISATION_REQUEST",
  status: "ACTIVE",
  steps: '[{"afterMinutes":30,"recipientRole":"INSURANCE_OFFICER","channels":["IN_APP"],"action":"ESCALATE"}]',
};
const orchestrationModules = ["LABORATORY", "PATIENT_REGISTRATION", "NURSING", "INPATIENT", "BED_WARD", "INSURANCE", "BILLING", "PHARMACY", "EMERGENCY", "HELPDESK", "EXTERNAL_INTEGRATIONS"];
const orchestrationEvents = ["LAB_RESULT_COMPLETED", "PATIENT_REGISTERED", "PATIENT_ADMITTED", "PATIENT_DISCHARGED", "PREAUTH_SUBMITTED", "INVOICE_OVERDUE", "PHARMACY_DISPENSED", "MOVEMENT_REQUESTED", "TICKET_CREATED", "PAYMENT_RECEIVED"];
const orchestrationRoles = ["ORDERING_DOCTOR", "WARD_NURSE_IN_CHARGE", "INSURANCE_OFFICER", "BILLING_MANAGER", "FINANCE_MANAGER", "PHARMACY_MANAGER", "IT_MANAGER", "CIO", "HOSPITAL_ADMIN"];
const orchestrationTaskCategories = ["CLINICAL", "BILLING", "INSURANCE", "PHARMACY", "INPATIENT", "IT", "FINANCE", "BACKUP", "GENERAL"];
const orchestrationTimezones = ["Africa/Nairobi", "UTC", "Africa/Kampala", "Africa/Dar_es_Salaam", "Europe/London"];
const orchestrationEntityTypes = ["LAB_RESULT", "PATIENT", "VISIT", "ADMISSION", "INVOICE", "CLAIM", "PHARMACY_ORDER", "HELPDESK_TICKET", "WORKFLOW_TASK"];

const fmtDateTime = (value?: string) => {
  if (!value) return "-";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "-" : parsed.toLocaleString();
};

const cellValue = (row: any, column: string) => {
  const snakeCase = column.replace(/[A-Z]/g, (character) => `_${character.toLowerCase()}`);
  const aliases = column === "status" ? ["state", "statusCode"] : column === "startedAt" ? ["createdAt", "started_at"] : [];
  const value = [column, snakeCase, column.toLowerCase(), ...aliases]
    .map((key) => row?.[key])
    .find((candidate) => candidate !== undefined && candidate !== null && candidate !== "");
  if (column.toLowerCase().includes("at")) return fmtDateTime(value);
  if (typeof value === "object") return JSON.stringify(value);
  return String(value ?? "-");
};

const unwrap = (value: any) => value?.data?.data ?? value?.data ?? value;

export default function OrchestrationView() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [query, setQuery] = useState("");
  const [modal, setModal] = useState<"" | "workflow" | "task" | "escalation" | "event" | "chain" | "detail">("");
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null);
  const [selectedTaskCode, setSelectedTaskCode] = useState<string | null>(null);
  const [detailRow, setDetailRow] = useState<any>(null);
  const [workflowForm, setWorkflowForm] = useState(emptyWorkflow);
  const [taskForm, setTaskForm] = useState(emptyTask);
  const [escalationForm, setEscalationForm] = useState(emptyEscalation);
  const [eventForm, setEventForm] = useState(emptyEvent);
  const [chainForm, setChainForm] = useState(emptyChain);
  const [saving, setSaving] = useState("");
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<{ tone: "success" | "warning" | "error"; text: string } | null>(null);

  const showNotice = (text: string, tone: "success" | "warning" | "error" = "success") => {
    setNotice({ text, tone });
    window.setTimeout(() => setNotice(null), tone === "success" ? 2600 : 4600);
  };

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const response = await api.get("/orchestration/dashboard");
      setDashboard(unwrap(response));
    } catch (error: any) {
      showNotice(error?.response?.data?.message || "Orchestration dashboard could not be loaded.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDashboard();
  }, []);

  const stats = dashboard?.stats || {};
  const workflows = Array.isArray(dashboard?.workflows) ? dashboard.workflows : [];
  const tasks = Array.isArray(dashboard?.scheduledTasks) ? dashboard.scheduledTasks : [];
  const chains = Array.isArray(dashboard?.escalationChains) ? dashboard.escalationChains : [];
  const events = Array.isArray(dashboard?.recentEvents) ? dashboard.recentEvents : [];
  const executions = Array.isArray(dashboard?.executions) ? dashboard.executions : [];
  const runs = Array.isArray(dashboard?.recentTaskRuns) ? dashboard.recentTaskRuns : [];

  const filteredWorkflows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return workflows;
    return workflows.filter((row: any) =>
      [row.name, row.triggerModule, row.triggerEvent, row.description].some((value) => String(value || "").toLowerCase().includes(needle)),
    );
  }, [query, workflows]);

  const seedDefaults = async () => {
    setSaving("seed");
    try {
      const response = await api.post("/orchestration/seed-defaults", {});
      const data = unwrap(response);
      showNotice(`Defaults ready: ${data?.workflowsCreated || 0} new workflow(s), scheduled tasks and escalation chains loaded.`);
      await loadDashboard();
    } catch (error: any) {
      showNotice(error?.response?.data?.message || "Default orchestration setup failed.", "error");
    } finally {
      setSaving("");
    }
  };

  const openNewWorkflow = () => {
    setSelectedWorkflowId(null);
    setWorkflowForm(emptyWorkflow);
    setModal("workflow");
  };

  const openWorkflow = (row: any) => {
    setExpandedSection(null);
    const conditions = row?.triggerConditions || row?.trigger_conditions || {};
    const condition = Array.isArray(conditions?.all) ? conditions.all[0] : conditions;
    const actions = Array.isArray(row?.actions) ? row.actions : [];
    setSelectedWorkflowId(row?.id || null);
    setWorkflowForm({
      ...emptyWorkflow,
      name: row?.name || emptyWorkflow.name,
      description: row?.description || "",
      triggerModule: row?.triggerModule || row?.trigger_module || emptyWorkflow.triggerModule,
      triggerEvent: row?.triggerEvent || row?.trigger_event || emptyWorkflow.triggerEvent,
      conditionField: condition?.field || emptyWorkflow.conditionField,
      conditionOperator: condition?.operator || emptyWorkflow.conditionOperator,
      conditionValue: String(condition?.value ?? emptyWorkflow.conditionValue),
      actionOne: actions[0]?.type || emptyWorkflow.actionOne,
      actionOneRole: actions[0]?.recipientRole || actions[0]?.recipient_role || emptyWorkflow.actionOneRole,
      actionTwo: actions[1]?.type || emptyWorkflow.actionTwo,
      actionTwoRole: actions[1]?.recipientRole || actions[1]?.recipient_role || emptyWorkflow.actionTwoRole,
    });
    setModal("workflow");
  };

  const openTask = (row: any) => {
    setExpandedSection(null);
    setSelectedTaskCode(row?.taskCode || row?.task_code || null);
    setTaskForm({ ...emptyTask, ...row, taskCode: row?.taskCode || row?.task_code || emptyTask.taskCode, cron: row?.cron || emptyTask.cron });
    setModal("task");
  };

  const openChain = (row: any) => {
    setExpandedSection(null);
    setChainForm({
      ...emptyChain,
      ...row,
      chainCode: row?.chainCode || row?.chain_code || emptyChain.chainCode,
      steps: JSON.stringify(row?.steps || [], null, 2) || "[]",
    });
    setModal("chain");
  };

  const createWorkflow = async (event: FormEvent) => {
    event.preventDefault();
    setSaving("workflow");
    try {
      const payload = {
        name: workflowForm.name,
        description: workflowForm.description,
        triggerModule: workflowForm.triggerModule,
        triggerEvent: workflowForm.triggerEvent,
        triggerConditions: {
          all: [
            {
              field: workflowForm.conditionField,
              operator: workflowForm.conditionOperator,
              value: workflowForm.conditionValue === "true" ? true : workflowForm.conditionValue,
            },
          ],
        },
        actions: [
          { type: workflowForm.actionOne, recipientRole: workflowForm.actionOneRole, message: "Primary workflow action dispatched." },
          { type: workflowForm.actionTwo, recipientRole: workflowForm.actionTwoRole, message: "Secondary workflow action dispatched." },
          { type: "AUDIT_LOG", message: "Workflow audit trail recorded." },
        ],
      };
      if (selectedWorkflowId) await api.patch(`/orchestration/workflows/${encodeURIComponent(selectedWorkflowId)}`, payload);
      else await api.post("/orchestration/workflows", payload);
      showNotice(selectedWorkflowId ? "Workflow definition updated." : "Workflow definition saved and activated.");
      setModal("");
      setSelectedWorkflowId(null);
      await loadDashboard();
    } catch (error: any) {
      showNotice(error?.response?.data?.message || "Workflow could not be saved.", "error");
    } finally {
      setSaving("");
    }
  };

  const createTask = async (event: FormEvent) => {
    event.preventDefault();
    setSaving("task");
    try {
      await api.post("/orchestration/scheduled-tasks", taskForm);
      showNotice(selectedTaskCode ? "Scheduled task updated." : "Scheduled task saved with next run tracking.");
      setModal("");
      setSelectedTaskCode(null);
      await loadDashboard();
    } catch (error: any) {
      showNotice(error?.response?.data?.message || "Scheduled task could not be saved.", "error");
    } finally {
      setSaving("");
    }
  };

  const saveChain = async (event: FormEvent) => {
    event.preventDefault();
    setSaving("chain");
    let steps: any[];
    try {
      steps = JSON.parse(chainForm.steps || "[]");
      if (!Array.isArray(steps) || !steps.length) throw new Error("At least one step is required.");
    } catch (error: any) {
      showNotice(error?.message || "Escalation steps must be valid JSON array.", "error");
      setSaving("");
      return;
    }
    try {
      await api.post("/orchestration/escalation-chains", { ...chainForm, steps });
      showNotice("Escalation chain saved.");
      setModal("");
      await loadDashboard();
    } catch (error: any) {
      showNotice(error?.response?.data?.message || "Escalation chain could not be saved.", "error");
    } finally {
      setSaving("");
    }
  };

  const runTask = async (taskCode: string) => {
    setExpandedSection(null);
    setSaving(taskCode);
    try {
      await api.post(`/orchestration/scheduled-tasks/${encodeURIComponent(taskCode)}/run`, {});
      showNotice(`${taskCode} executed and logged.`);
      await loadDashboard();
    } catch (error: any) {
      showNotice(error?.response?.data?.message || "Scheduled task run failed.", "error");
    } finally {
      setSaving("");
    }
  };

  const startEscalation = async (event: FormEvent) => {
    event.preventDefault();
    setSaving("escalation");
    try {
      await api.post("/orchestration/escalations", escalationForm);
      const processed = await api.post("/orchestration/escalations/process-due", {});
      showNotice(`Escalation opened. Due processor dispatched ${unwrap(processed)?.dispatched || 0} step(s).`);
      setModal("");
      await loadDashboard();
    } catch (error: any) {
      showNotice(error?.response?.data?.message || "Escalation could not be started.", "error");
    } finally {
      setSaving("");
    }
  };

  const publishCriticalLabEvent = async () => {
    setSaving("event");
    try {
      await api.post("/orchestration/events", {
        eventType: "LAB_RESULT_COMPLETED",
        sourceModule: "LABORATORY",
        entityType: "LAB_RESULT",
        entityId: `LAB-${Date.now()}`,
        payload: {
          patientId: "DEMO-INPATIENT",
          visitId: "VISIT-DEMO",
          patientClass: "INPATIENT",
          criticalValue: true,
          testName: "Potassium",
          resultValue: "6.7 mmol/L",
        },
      });
      showNotice("Critical lab event published and matching workflows processed.");
      await loadDashboard();
    } catch (error: any) {
      showNotice(error?.response?.data?.message || "Test event could not be published.", "error");
    } finally {
      setSaving("");
    }
  };

  const publishEvent = async (event: FormEvent) => {
    event.preventDefault();
    setSaving("event");
    let payload: Record<string, unknown> = {};
    try {
      payload = JSON.parse(eventForm.payload || "{}");
    } catch {
      showNotice("Event payload must be valid JSON.", "error");
      setSaving("");
      return;
    }
    try {
      await api.post("/orchestration/events", { ...eventForm, payload });
      showNotice("Domain event published to the orchestration outbox.");
      setModal("");
      await loadDashboard();
    } catch (error: any) {
      showNotice(error?.response?.data?.message || "Event could not be published.", "error");
    } finally {
      setSaving("");
    }
  };

  const processPendingEvents = async () => {
    setSaving("pending");
    try {
      const response = await api.post("/orchestration/process-pending", { limit: 100 });
      const result = unwrap(response);
      showNotice(`Pending events processed: ${result?.processed || 0}; failed: ${result?.failed || 0}.`, result?.failed ? "warning" : "success");
      await loadDashboard();
    } catch (error: any) {
      showNotice(error?.response?.data?.message || "Pending events could not be processed.", "error");
    } finally {
      setSaving("");
    }
  };

  const interveneWorkflow = async (execution: any, action: string) => {
    setExpandedSection(null);
    const executionId = execution?.id;
    if (!executionId) return;
    setSaving(`execution:${executionId}`);
    try {
      await api.patch(`/orchestration/workflow-executions/${encodeURIComponent(executionId)}/${action.toLowerCase()}`, { reason: `Manual ${action.toLowerCase()} from orchestration console` });
      showNotice(`Workflow execution ${action.toLowerCase()} request completed.`);
      await loadDashboard();
    } catch (error: any) {
      showNotice(error?.response?.data?.message || "Workflow intervention failed.", "error");
    } finally {
      setSaving("");
    }
  };

  return (
    <main className="orch-page">
      <section className="orch-hero">
        <div>
          <p className="orch-kicker">System orchestration</p>
          <h1>Orchestration & Automation</h1>
          <p>Workflow rules, scheduled jobs, and escalation chains running behind clinical and administrative operations.</p>
        </div>
        <div className="orch-actions">
          <button className="orch-btn subtle" type="button" onClick={() => void loadDashboard()} disabled={loading}>
            <RefreshCw size={16} /> Refresh
          </button>
          <button className="orch-btn blue" type="button" onClick={() => void seedDefaults()} disabled={saving === "seed"}>
            <Settings2 size={16} /> Load Defaults
          </button>
          <button className="orch-btn green" type="button" onClick={openNewWorkflow}>
            <GitBranch size={16} /> New Workflow
          </button>
          <button className="orch-btn orange" type="button" onClick={() => void processPendingEvents()} disabled={saving === "pending"}>
            <Route size={16} /> {saving === "pending" ? "Processing..." : "Process Pending"}
          </button>
        </div>
      </section>

      {notice ? <div className={`orch-toast ${notice.tone}`}>{notice.text}</div> : null}
      {expandedSection ? <button className="orch-expand-backdrop" type="button" aria-label="Close expanded section" onClick={() => setExpandedSection(null)} /> : null}

      <section className="orch-stats">
        <Stat icon={GitBranch} label="Active Workflows" value={stats.activeWorkflows || 0} tone="blue" />
        <Stat icon={CalendarClock} label="Scheduled Tasks" value={stats.scheduledTasks || 0} tone="green" />
        <Stat icon={AlertTriangle} label="Failed Tasks" value={stats.failedTasks || 0} tone="red" />
        <Stat icon={BellRing} label="Open Escalations" value={stats.openEscalations || 0} tone="orange" />
        <Stat icon={Route} label="Pending Events" value={stats.pendingEvents || 0} tone="teal" />
        <Stat icon={Play} label="Running Workflows" value={stats.runningWorkflows || 0} tone="blue" />
        <Stat icon={CalendarClock} label="Waiting Workflows" value={stats.waitingWorkflows || 0} tone="orange" />
        <Stat icon={CheckCircle2} label="Completed Today" value={stats.completedToday || 0} tone="green" />
        <Stat icon={AlertTriangle} label="Stuck / Attention" value={stats.stuckWorkflows || 0} tone="red" />
        <Stat icon={Route} label="Dead-Lettered" value={stats.deadLetteredExecutions || 0} tone="teal" />
      </section>

      <section className="orch-toolbar">
        <div className="orch-search"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search workflows, triggers, actions..." /></div>
        <button className="orch-btn red" type="button" onClick={() => void publishCriticalLabEvent()} disabled={saving === "event"}>
          <Play size={16} /> Test Critical Lab
        </button>
        <button className="orch-btn blue" type="button" onClick={() => { setSelectedTaskCode(null); setTaskForm(emptyTask); setModal("task"); }}>
          <CalendarClock size={16} /> Add Task
        </button>
        <button className="orch-btn green" type="button" onClick={() => setModal("escalation")}>
          <BellRing size={16} /> Start Escalation
        </button>
        <button className="orch-btn orange" type="button" onClick={() => { setChainForm(emptyChain); setModal("chain"); }}>
          <BellRing size={16} /> New Chain
        </button>
        <button className="orch-btn blue" type="button" onClick={() => setModal("event")}>
          <Send size={16} /> Publish Event
        </button>
      </section>

      <section className="orch-grid">
        <Panel title="Workflow Definition Engine" icon={GitBranch} meta={`${filteredWorkflows.length} configured`} expanded={expandedSection === "workflows"} onToggle={() => setExpandedSection((current) => current === "workflows" ? null : "workflows")}>
          <div className="orch-list">
            {filteredWorkflows.map((row: any) => (
              <article className="orch-row orch-clickable" key={row.id} role="button" tabIndex={0} onClick={() => openWorkflow(row)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") openWorkflow(row); }}>
                <div><strong>{row.name}</strong><span>{row.triggerModule} → {row.triggerEvent}</span></div>
                <Badge tone={row.isActive === false ? "muted" : "green"}>{row.isActive === false ? "Inactive" : "Active"}</Badge>
              </article>
            ))}
            {!filteredWorkflows.length ? <Empty text={loading ? "Loading workflow definitions..." : "No workflow definitions configured yet."} /> : null}
          </div>
        </Panel>

        <Panel title="Scheduled Task Management" icon={CalendarClock} meta={`${tasks.length} cron jobs`} expanded={expandedSection === "tasks"} onToggle={() => setExpandedSection((current) => current === "tasks" ? null : "tasks")}>
          <div className="orch-list">
            {tasks.map((task: any) => (
              <article className="orch-task orch-clickable" key={task.taskCode} role="button" tabIndex={0} onClick={() => openTask(task)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") openTask(task); }}>
                <div><strong>{task.name}</strong><span>{task.cron} · next {fmtDateTime(task.nextRunAt)}</span><small>Last: {task.lastStatus || "NEVER_RUN"} at {fmtDateTime(task.lastRunAt)}</small></div>
                <button className="orch-icon-btn" type="button" onClick={(event) => { event.stopPropagation(); void runTask(task.taskCode); }} disabled={saving === task.taskCode} title="Run now"><Play size={15} /></button>
              </article>
            ))}
            {!tasks.length ? <Empty text="No scheduled tasks available. Load defaults to configure core jobs." /> : null}
          </div>
        </Panel>

        <Panel title="Automated Escalation Chains" icon={BellRing} meta={`${chains.length} cascades`} expanded={expandedSection === "chains"} onToggle={() => setExpandedSection((current) => current === "chains" ? null : "chains")}>
          <div className="orch-list">
            {chains.map((chain: any) => (
              <article className="orch-row orch-clickable" key={chain.chainCode} role="button" tabIndex={0} onClick={() => openChain(chain)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") openChain(chain); }}>
                <div><strong>{chain.name}</strong><span>{chain.chainCode} · {chain.steps?.length || 0} step(s) · {chain.openInstances || 0} open</span></div>
                <Badge tone={chain.status === "ACTIVE" ? "green" : "muted"}>{chain.status || "ACTIVE"}</Badge>
              </article>
            ))}
            {!chains.length ? <Empty text="No escalation chains configured yet." /> : null}
          </div>
        </Panel>
      </section>

      <section className="orch-grid lower">
        <Panel title="Execution History" icon={CheckCircle2} meta={`${executions.length} workflow runs`} expanded={expandedSection === "executions"} onToggle={() => setExpandedSection((current) => current === "executions" ? null : "executions")}>
          <DataTable rows={executions} columns={["workflowName", "triggerEvent", "status", "startedAt"]} onAction={interveneWorkflow} onRowClick={(row) => { setExpandedSection(null); setDetailRow(row); setModal("detail"); }} />
        </Panel>
        <Panel title="Recent Orchestration Events" icon={Route} meta={`${events.length} events`} expanded={expandedSection === "events"} onToggle={() => setExpandedSection((current) => current === "events" ? null : "events")}>
          <DataTable rows={events} columns={["eventType", "sourceModule", "status", "occurredAt"]} onRowClick={(row) => { setExpandedSection(null); setDetailRow(row); setModal("detail"); }} />
        </Panel>
        <Panel title="Scheduler Run Log" icon={CalendarClock} meta={`${runs.length} runs`} expanded={expandedSection === "runs"} onToggle={() => setExpandedSection((current) => current === "runs" ? null : "runs")}>
          <DataTable rows={runs} columns={["taskCode", "status", "recordsProcessed", "completedAt"]} onRowClick={(row) => { setExpandedSection(null); setDetailRow(row); setModal("detail"); }} />
        </Panel>
      </section>

      {modal === "workflow" ? (
        <OrchModal title="Create Workflow Definition" tone="green" onClose={() => setModal("")}>
          <form className="orch-form" onSubmit={createWorkflow}>
            <label><span>Name</span><input value={workflowForm.name} onChange={(event) => setWorkflowForm((current) => ({ ...current, name: event.target.value }))} required /></label>
            <label><span>Trigger Module</span><select value={workflowForm.triggerModule} onChange={(event) => setWorkflowForm((current) => ({ ...current, triggerModule: event.target.value }))} required>{orchestrationModules.map((module) => <option key={module}>{module}</option>)}</select></label>
            <label><span>Trigger Event</span><select value={workflowForm.triggerEvent} onChange={(event) => setWorkflowForm((current) => ({ ...current, triggerEvent: event.target.value }))} required>{orchestrationEvents.map((eventType) => <option key={eventType}>{eventType}</option>)}</select></label>
            <label><span>Condition Field</span><input value={workflowForm.conditionField} onChange={(event) => setWorkflowForm((current) => ({ ...current, conditionField: event.target.value }))} /></label>
            <label><span>Operator</span><select value={workflowForm.conditionOperator} onChange={(event) => setWorkflowForm((current) => ({ ...current, conditionOperator: event.target.value }))}><option>eq</option><option>neq</option><option>includes</option><option>gt</option><option>gte</option><option>lt</option><option>lte</option><option>exists</option></select></label>
            <label><span>Condition Value</span><input value={workflowForm.conditionValue} onChange={(event) => setWorkflowForm((current) => ({ ...current, conditionValue: event.target.value }))} /></label>
            <label><span>Primary Action</span><select value={workflowForm.actionOne} onChange={(event) => setWorkflowForm((current) => ({ ...current, actionOne: event.target.value }))}><option>SEND_SMS</option><option>IN_APP_NOTIFICATION</option><option>AUDIT_LOG</option><option>UPDATE_RECORD_STATUS</option><option>ESCALATE</option></select></label>
            <label><span>Primary Role</span><select value={workflowForm.actionOneRole} onChange={(event) => setWorkflowForm((current) => ({ ...current, actionOneRole: event.target.value }))}>{orchestrationRoles.map((role) => <option key={role}>{role}</option>)}</select></label>
            <label><span>Secondary Action</span><select value={workflowForm.actionTwo} onChange={(event) => setWorkflowForm((current) => ({ ...current, actionTwo: event.target.value }))}><option>IN_APP_NOTIFICATION</option><option>SEND_SMS</option><option>AUDIT_LOG</option><option>UPDATE_RECORD_STATUS</option><option>ESCALATE</option></select></label>
            <label><span>Secondary Role</span><select value={workflowForm.actionTwoRole} onChange={(event) => setWorkflowForm((current) => ({ ...current, actionTwoRole: event.target.value }))}>{orchestrationRoles.map((role) => <option key={role}>{role}</option>)}</select></label>
            <label className="wide"><span>Description</span><textarea rows={3} value={workflowForm.description} onChange={(event) => setWorkflowForm((current) => ({ ...current, description: event.target.value }))} /></label>
            <footer><button type="button" onClick={() => setModal("")}>Cancel</button><button disabled={saving === "workflow"}>{saving === "workflow" ? "Saving..." : "Save Workflow"}</button></footer>
          </form>
        </OrchModal>
      ) : null}

      {modal === "task" ? (
        <OrchModal title="Scheduled Task" tone="blue" onClose={() => setModal("")}>
          <form className="orch-form" onSubmit={createTask}>
            <label><span>Name</span><input value={taskForm.name} onChange={(event) => setTaskForm((current) => ({ ...current, name: event.target.value }))} required /></label>
            <label><span>Task Code</span><input value={taskForm.taskCode} onChange={(event) => setTaskForm((current) => ({ ...current, taskCode: event.target.value.toUpperCase() }))} required /></label>
            <label><span>Cron</span><input value={taskForm.cron} onChange={(event) => setTaskForm((current) => ({ ...current, cron: event.target.value }))} required /></label>
            <label><span>Owner Role</span><select value={taskForm.ownerRole} onChange={(event) => setTaskForm((current) => ({ ...current, ownerRole: event.target.value }))}>{orchestrationRoles.map((role) => <option key={role}>{role}</option>)}</select></label>
            <label><span>Category</span><select value={taskForm.category} onChange={(event) => setTaskForm((current) => ({ ...current, category: event.target.value }))}>{orchestrationTaskCategories.map((category) => <option key={category}>{category}</option>)}</select></label>
            <label><span>Schedule type</span><select value={taskForm.scheduleType ?? "CRON"} onChange={(event) => setTaskForm((current) => ({ ...current, scheduleType: event.target.value }))}><option>CRON</option><option>ONE_TIME</option><option>INTERVAL</option><option>EVENT_DELAY</option></select></label>
            <label><span>Time zone</span><select value={taskForm.timezone ?? "Africa/Nairobi"} onChange={(event) => setTaskForm((current) => ({ ...current, timezone: event.target.value }))}>{orchestrationTimezones.map((timezone) => <option key={timezone}>{timezone}</option>)}</select></label>
            <label><span>Criticality</span><select value={taskForm.criticality ?? "STANDARD"} onChange={(event) => setTaskForm((current) => ({ ...current, criticality: event.target.value }))}><option>STANDARD</option><option>CRITICAL</option><option>HIGH</option></select></label>
            <label><span>SLA (minutes)</span><input type="number" min="1" value={taskForm.slaMinutes ?? "60"} onChange={(event) => setTaskForm((current) => ({ ...current, slaMinutes: event.target.value }))} /></label>
            <label className="orch-check"><input type="checkbox" checked={taskForm.enabled ?? true} onChange={(event) => setTaskForm((current) => ({ ...current, enabled: event.target.checked }))} /> Job enabled</label>
            <label className="wide"><span>Description</span><textarea rows={3} value={taskForm.description} onChange={(event) => setTaskForm((current) => ({ ...current, description: event.target.value }))} /></label>
            <footer><button type="button" onClick={() => setModal("")}>Cancel</button><button disabled={saving === "task"}>{saving === "task" ? "Saving..." : "Save Task"}</button></footer>
          </form>
        </OrchModal>
      ) : null}

      {modal === "escalation" ? (
        <OrchModal title="Start Escalation Chain" tone="red" onClose={() => setModal("")}>
          <form className="orch-form" onSubmit={startEscalation}>
            <label><span>Chain Code</span><select value={escalationForm.chainCode} onChange={(event) => setEscalationForm((current) => ({ ...current, chainCode: event.target.value }))}>{Array.from(new Set([...chains.map((chain: any) => chain.chainCode), "PREAUTH_DELAY", "HELPDESK_SLA"].filter(Boolean))).map((chainCode) => <option key={chainCode}>{chainCode}</option>)}</select></label>
            <label><span>Subject Type</span><select value={escalationForm.subjectType} onChange={(event) => setEscalationForm((current) => ({ ...current, subjectType: event.target.value }))}><option>PRE_AUTHORISATION_REQUEST</option><option>HELPDESK_TICKET</option><option>CLAIM</option><option>WORKFLOW_TASK</option></select></label>
            <label><span>Subject ID</span><input value={escalationForm.subjectId} onChange={(event) => setEscalationForm((current) => ({ ...current, subjectId: event.target.value }))} placeholder="Ticket, request, or claim ID" required /></label>
            <label><span>Patient ID</span><input value={escalationForm.patientId} onChange={(event) => setEscalationForm((current) => ({ ...current, patientId: event.target.value }))} /></label>
            <footer><button type="button" onClick={() => setModal("")}>Cancel</button><button disabled={saving === "escalation"}>{saving === "escalation" ? "Starting..." : "Start Chain"}</button></footer>
          </form>
        </OrchModal>
      ) : null}

      {modal === "chain" ? (
        <OrchModal title="Escalation Chain Definition" tone="red" onClose={() => setModal("")}>
          <form className="orch-form" onSubmit={saveChain}>
            <label><span>Chain Code</span><input value={chainForm.chainCode} onChange={(event) => setChainForm((current) => ({ ...current, chainCode: event.target.value.toUpperCase() }))} required /></label>
            <label><span>Name</span><input value={chainForm.name} onChange={(event) => setChainForm((current) => ({ ...current, name: event.target.value }))} required /></label>
            <label><span>Trigger Type</span><select value={chainForm.triggerType} onChange={(event) => setChainForm((current) => ({ ...current, triggerType: event.target.value }))}><option>PRE_AUTHORISATION_REQUEST</option><option>HELPDESK_TICKET</option><option>CLAIM</option><option>WORKFLOW_TASK</option></select></label>
            <label><span>Status</span><select value={chainForm.status} onChange={(event) => setChainForm((current) => ({ ...current, status: event.target.value }))}><option>ACTIVE</option><option>INACTIVE</option></select></label>
            <label className="wide"><span>Steps (JSON array)</span><textarea rows={8} value={chainForm.steps} onChange={(event) => setChainForm((current) => ({ ...current, steps: event.target.value }))} required placeholder='[{"afterMinutes":30,"recipientRole":"HOSPITAL_ADMIN","channels":["IN_APP"],"action":"ESCALATE"}]' /></label>
            <footer><button type="button" onClick={() => setModal("")}>Cancel</button><button disabled={saving === "chain"}>{saving === "chain" ? "Saving..." : "Save Chain"}</button></footer>
          </form>
        </OrchModal>
      ) : null}

      {modal === "event" ? (
        <OrchModal title="Publish Domain Event" tone="blue" onClose={() => setModal("")}>
          <form className="orch-form" onSubmit={publishEvent}>
            <label><span>Event Type</span><select value={eventForm.eventType} onChange={(event) => setEventForm((current) => ({ ...current, eventType: event.target.value }))} required>{orchestrationEvents.map((eventType) => <option key={eventType}>{eventType}</option>)}</select></label>
            <label><span>Source Module</span><select value={eventForm.sourceModule} onChange={(event) => setEventForm((current) => ({ ...current, sourceModule: event.target.value }))} required>{orchestrationModules.map((module) => <option key={module}>{module}</option>)}</select></label>
            <label><span>Entity Type</span><select value={eventForm.entityType} onChange={(event) => setEventForm((current) => ({ ...current, entityType: event.target.value }))} required>{orchestrationEntityTypes.map((entityType) => <option key={entityType}>{entityType}</option>)}</select></label>
            <label><span>Entity ID</span><input value={eventForm.entityId} onChange={(event) => setEventForm((current) => ({ ...current, entityId: event.target.value }))} placeholder="Source record ID" /></label>
            <label><span>Patient ID</span><input value={eventForm.patientId} onChange={(event) => setEventForm((current) => ({ ...current, patientId: event.target.value }))} placeholder="Optional patient context" /></label>
            <label className="wide"><span>Payload (JSON)</span><textarea rows={7} value={eventForm.payload} onChange={(event) => setEventForm((current) => ({ ...current, payload: event.target.value }))} placeholder='{"criticalValue":true}' /></label>
            <label className="orch-check wide"><input type="checkbox" checked={eventForm.processAsync} onChange={(event) => setEventForm((current) => ({ ...current, processAsync: event.target.checked }))} /> Queue for durable worker processing</label>
            <footer><button type="button" onClick={() => setModal("")}>Cancel</button><button disabled={saving === "event"}>{saving === "event" ? "Publishing..." : "Publish Event"}</button></footer>
          </form>
        </OrchModal>
      ) : null}

      {modal === "detail" && detailRow ? (
        <OrchModal title="Record Details" tone="blue" onClose={() => { setModal(""); setDetailRow(null); }}>
          <div className="orch-detail-view"><p>Select an editable definition above to change configuration. Execution history, events, and scheduler runs are immutable audit records.</p><DetailRecord value={detailRow} /></div>
        </OrchModal>
      ) : null}
    </main>
  );
}

function Stat({ icon: Icon, label, value, tone }: { icon: any; label: string; value: unknown; tone: string }) {
  return <article className={`orch-stat ${tone}`}><Icon size={18} /><span>{label}</span><strong>{String(value)}</strong></article>;
}

function Panel({ title, icon: Icon, meta, children, expanded, onToggle }: { title: string; icon: any; meta: string; children: ReactNode; expanded?: boolean; onToggle?: () => void }) {
  return <section className={`orch-panel${expanded ? " orch-panel-expanded" : ""}`}><header><div><Icon size={18} /><h2>{title}</h2></div><div className="orch-panel-header-tools"><span>{meta}</span>{onToggle ? <button className="orch-expand-btn" type="button" aria-label={expanded ? `Collapse ${title}` : `Expand ${title}`} title={expanded ? "Collapse section" : "Expand section"} onClick={onToggle}>{expanded ? <Minimize2 size={15} /> : <Maximize2 size={15} />}</button> : null}</div></header>{children}</section>;
}

function Badge({ tone, children }: { tone: string; children: ReactNode }) {
  return <span className={`orch-badge ${tone}`}>{children}</span>;
}

function Empty({ text }: { text: string }) {
  return <div className="orch-empty">{text}</div>;
}

const detailLabel = (value: string) => value.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[_-]/g, " ").replace(/\b\w/g, (character) => character.toUpperCase());

function PrettyValue({ value }: { value: any }) {
  if (value === null || value === undefined || value === "") return <span className="orch-detail-muted">Not available</span>;
  if (Array.isArray(value)) {
    return <div className="orch-detail-list">{value.length ? value.map((item, index) => <div className="orch-detail-nested" key={index}><span className="orch-detail-index">{index + 1}</span><PrettyValue value={item} /></div>) : <span className="orch-detail-muted">None</span>}</div>;
  }
  if (typeof value === "object") {
    return <div className="orch-detail-list">{Object.entries(value).map(([key, item]) => <div className="orch-detail-nested" key={key}><strong>{detailLabel(key)}</strong><PrettyValue value={item} /></div>)}</div>;
  }
  return <span>{String(value)}</span>;
}

function DetailRecord({ value }: { value: any }) {
  return <div className="orch-detail-record">{Object.entries(value || {}).map(([key, item]) => <div className="orch-detail-field" key={key}><strong>{detailLabel(key)}</strong><PrettyValue value={item} /></div>)}</div>;
}

function DataTable({ rows, columns, onAction, onRowClick }: { rows: any[]; columns: string[]; onAction?: (row: any, action: string) => void; onRowClick?: (row: any) => void }) {
  const [page, setPage] = useState(0);
  const pageSize = 10;
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const visibleRows = rows.slice(page * pageSize, (page + 1) * pageSize);
  useEffect(() => setPage((current) => Math.min(current, pageCount - 1)), [pageCount]);
  if (!rows.length) return <Empty text="No records yet." />;
  return (
    <div className="orch-table-wrap">
      <table className="orch-table">
        <thead><tr>{columns.map((column) => <th key={column}>{column.replace(/([A-Z])/g, " $1")}</th>)}{onAction ? <th>Actions</th> : null}</tr></thead>
        <tbody>
          {visibleRows.map((row, index) => (
            <tr className={onRowClick ? "orch-clickable" : undefined} key={row.id || index} tabIndex={onRowClick ? 0 : undefined} onClick={() => onRowClick?.(row)} onKeyDown={(event) => { if (onRowClick && (event.key === "Enter" || event.key === " ")) onRowClick(row); }}>{columns.map((column) => <td key={column}>{cellValue(row, column)}</td>)}{onAction ? <td><div className="orch-table-actions">{["RUNNING", "WAITING", "VALIDATING"].includes(String(row.status).toUpperCase()) ? <button type="button" title="Pause" onClick={(event) => { event.stopPropagation(); onAction(row, "PAUSE"); }}><Pause size={13} /></button> : null}{String(row.status).toUpperCase() === "PAUSED" ? <button type="button" title="Resume" onClick={(event) => { event.stopPropagation(); onAction(row, "RESUME"); }}><Play size={13} /></button> : null}{["FAILED", "TIMED_OUT", "DEAD_LETTERED"].includes(String(row.status).toUpperCase()) ? <button type="button" title="Retry" onClick={(event) => { event.stopPropagation(); onAction(row, "RETRY"); }}><RefreshCw size={13} /></button> : null}{!["COMPLETED", "CANCELLED", "ABORTED"].includes(String(row.status).toUpperCase()) ? <button type="button" title="Cancel" onClick={(event) => { event.stopPropagation(); onAction(row, "CANCEL"); }}><X size={13} /></button> : null}</div></td> : null}</tr>
          ))}
        </tbody>
      </table>
      {pageCount > 1 ? <div className="orch-table-pagination"><span>Showing {page * pageSize + 1}-{Math.min((page + 1) * pageSize, rows.length)} of {rows.length}</span><div><button type="button" disabled={page === 0} onClick={() => setPage((current) => Math.max(0, current - 1))}>Back</button><button type="button" disabled={page >= pageCount - 1} onClick={() => setPage((current) => Math.min(pageCount - 1, current + 1))}>Next</button></div></div> : null}
    </div>
  );
}

function OrchModal({ title, tone, onClose, children }: { title: string; tone: "green" | "blue" | "red"; onClose: () => void; children: ReactNode }) {
  return (
    <div className="orch-modal-backdrop" role="dialog" aria-modal="true">
      <section className={`orch-modal ${tone}`}>
        <header><div><span className="orch-modal-mark" /><h2>{title}</h2></div><button type="button" onClick={onClose} aria-label="Close"><X size={18} /></button></header>
        {children}
      </section>
    </div>
  );
}
