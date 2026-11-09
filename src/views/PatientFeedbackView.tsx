
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BellRing,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Mail,
  Maximize2,
  Minimize2,
  MessageSquare,
  Plus,
  RefreshCw,
  Send,
  Smartphone,
  X,
} from "lucide-react";
import { api } from "../lib/api";
import { useLiveRefresh } from "../lib/liveRefresh";

const CHANNELS = ["SMS", "WHATSAPP", "EMAIL"];
const COMPLAINT_CATEGORIES = ["CLINICAL", "STAFF_BEHAVIOUR", "FACILITY", "BILLING_ISSUE", "FOOD_QUALITY", "OTHER"];
const SOURCES = ["PORTAL", "APP", "PAPER_FORM", "PATIENT_RELATIONS_OFFICER"];

const unwrap = (value: any) => value?.data ?? value;
const rowsOf = (value: any) => {
  const data = unwrap(value);
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  return [];
};
const pretty = (value: any) => String(value || "").replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
const dateTime = (value: any) => {
  const date = new Date(String(value || ""));
  if (!Number.isFinite(date.getTime())) return "Not recorded";
  return date.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
};
const tone = (message: string) => (/failed|unable|required|overdue|breached|low/i.test(message) ? "warning" : "success");

export default function PatientFeedbackView() {
  const [dashboard, setDashboard] = useState<any>({});
  const [quality, setQuality] = useState<any>({});
  const [configuration, setConfiguration] = useState<any>({});
  const [dispatches, setDispatches] = useState<any[]>([]);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [responses, setResponses] = useState<any[]>([]);
  const [selectedComplaintId, setSelectedComplaintId] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [modal, setModal] = useState<"" | "complaint" | "response" | "artifact">("");
  const [expandedTable, setExpandedTable] = useState<"" | "dispatches" | "responses">("");
  const [artifactKind, setArtifactKind] = useState("COMPLIMENT");
  const [artifactForm, setArtifactForm] = useState({ patientId: "", department: "", title: "", description: "" });

  const [dispatchForm, setDispatchForm] = useState({ visitId: "", channel: "SMS", force: false });
  const [complaintForm, setComplaintForm] = useState({
    patientId: "",
    visitId: "",
    source: "PORTAL",
    category: "CLINICAL",
    department: "GENERAL",
    description: "",
  });
  const [responseForm, setResponseForm] = useState({ response: "", rootCauseIdentified: "", preventionMeasures: "", notificationChannel: "SMS" });

  const selectedComplaint = complaints.find((row) => row.id === selectedComplaintId) || complaints[0] || null;

  const setToast = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice((current) => (current === message ? "" : current)), 6500);
  };

  const load = async () => {
    setLoading(true);
    try {
      const [dashboardRes, qualityRes, dispatchRes, complaintRes, responseRes, configurationRes] = await Promise.all([
        api.get("/patient-feedback/dashboard").catch(() => ({ data: {} })),
        api.get("/patient-feedback/quality-summary").catch(() => ({ data: {} })),
        api.get("/patient-feedback/survey-dispatches?limit=200").catch(() => ({ data: [] })),
        api.get("/patient-feedback/complaints?limit=200").catch(() => ({ data: [] })),
        api.get("/patient-feedback/responses?limit=100").catch(() => ({ data: [] })),
        api.get("/patient-feedback/configuration").catch(() => ({ data: {} })),
      ]);
      const complaintRows = rowsOf(complaintRes.data);
      setDashboard(dashboardRes.data || {});
      setQuality(qualityRes.data || {});
      setDispatches(rowsOf(dispatchRes.data));
      setComplaints(complaintRows);
      setResponses(rowsOf(responseRes.data));
      setConfiguration(configurationRes.data || {});
      setSelectedComplaintId((current) => current || complaintRows[0]?.id || "");
    } catch (error: any) {
      setToast(error?.response?.data?.message || "Patient feedback data could not be loaded.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);
  useLiveRefresh(load, { intervalMs: 60000 });

  const filteredComplaints = useMemo(() => {
    if (filter === "ALL") return complaints;
    if (filter === "OVERDUE") return complaints.filter((row) => row.overdue);
    return complaints.filter((row) => String(row.status || "").toUpperCase() === filter);
  }, [complaints, filter]);

  const runDistribution = async () => {
    setSaving("distribution");
    try {
      const response = await api.post("/patient-feedback/survey-dispatches/run", { channel: dispatchForm.channel, maxVisits: "200" });
      setToast(`Survey automation scanned ${unwrap(response.data)?.visitsScanned || 0} visits.`);
      await load();
    } catch (error: any) {
      setToast(error?.response?.data?.message || "Survey distribution could not run.");
    } finally {
      setSaving("");
    }
  };

  const dispatchVisit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving("dispatch");
    try {
      await api.post("/patient-feedback/survey-dispatches/visit", dispatchForm);
      setDispatchForm((current) => ({ ...current, visitId: "" }));
      setToast("Survey dispatched or scheduled for this visit.");
      await load();
    } catch (error: any) {
      setToast(error?.response?.data?.message || "Survey could not be dispatched.");
    } finally {
      setSaving("");
    }
  };

  const reviewResponseRate = async () => {
    setSaving("rate");
    try {
      const response = await api.post("/patient-feedback/response-rate/review", { thresholdPercent: "25" });
      const data = unwrap(response.data);
      setToast(data?.lowResponseRate ? "Low response rate flagged for timing/channel review." : "Response rate is within target.");
      await load();
    } catch (error: any) {
      setToast(error?.response?.data?.message || "Response rate review failed.");
    } finally {
      setSaving("");
    }
  };

  const logComplaint = async (event: FormEvent) => {
    event.preventDefault();
    setSaving("complaint");
    try {
      const response = await api.post("/patient-feedback/complaints", complaintForm);
      setSelectedComplaintId(unwrap(response.data)?.id || "");
      setComplaintForm((current) => ({ ...current, description: "" }));
      setModal("");
      setToast("Complaint logged, routed, and SLA clock started.");
      await load();
    } catch (error: any) {
      setToast(error?.response?.data?.message || "Complaint could not be logged.");
    } finally {
      setSaving("");
    }
  };

  const respond = async () => {
    if (!selectedComplaint?.id) return setToast("Select a complaint first.");
    setSaving("respond");
    try {
      await api.patch(`/patient-feedback/complaints/${selectedComplaint.id}/respond`, responseForm);
      setToast("Management response saved against SLA.");
      setModal("");
      await load();
    } catch (error: any) {
      setToast(error?.response?.data?.message || "Response could not be saved.");
    } finally {
      setSaving("");
    }
  };

  const resolve = async () => {
    if (!selectedComplaint?.id) return setToast("Select a complaint first.");
    setSaving("resolve");
    try {
      await api.patch(`/patient-feedback/complaints/${selectedComplaint.id}/resolve`, responseForm);
      setToast("Complaint resolved, patient notified, and follow-up survey sent.");
      setModal("");
      setResponseForm({ response: "", rootCauseIdentified: "", preventionMeasures: "", notificationChannel: "SMS" });
      await load();
    } catch (error: any) {
      setToast(error?.response?.data?.message || "Complaint could not be resolved.");
    } finally {
      setSaving("");
    }
  };

  const runSla = async () => {
    setSaving("sla");
    try {
      const response = await api.post("/patient-feedback/complaints/escalations/run");
      setToast(`SLA escalation checked: ${unwrap(response.data)?.escalated || 0} alerts raised.`);
      await load();
    } catch (error: any) {
      setToast(error?.response?.data?.message || "SLA escalation check failed.");
    } finally {
      setSaving("");
    }
  };

  const createArtifact = async (event: FormEvent) => {
    event.preventDefault();
    if (artifactForm.description.trim().length < 5) return setToast("Please provide feedback details.");
    setSaving("artifact");
    try {
      await api.post(`/patient-feedback/artifacts/${artifactKind.toLowerCase()}`, { ...artifactForm, feedbackType: artifactKind });
      setArtifactForm({ patientId: "", department: "", title: "", description: "" });
      setModal("");
      setToast(`${pretty(artifactKind)} recorded successfully.`);
      await load();
    } catch (error: any) {
      setToast(error?.response?.data?.message || "Feedback entry could not be saved.");
    } finally {
      setSaving("");
    }
  };

  const totals = dashboard?.totals || {};
  const qualityIndex = quality?.qualityIndex || {};
  const stats = [
    { label: "Surveys", value: totals.surveys || 0, icon: ClipboardCheck },
    { label: "Responses", value: totals.responses || responses.length, icon: MessageSquare },
    { label: "Response Rate", value: `${qualityIndex.responseRate || 0}%`, icon: Smartphone },
    { label: "Open Complaints", value: totals.openComplaints || complaints.filter((row) => !["RESOLVED", "CLOSED"].includes(String(row.status).toUpperCase())).length, icon: AlertTriangle },
    { label: "Overdue SLA", value: complaints.filter((row) => row.overdue).length, icon: Clock3 },
    { label: "Avg Rating", value: totals.averageRating || 0, icon: CheckCircle2 },
  ];

  return (
    <main className="feedback-page">
      <header className="feedback-header">
        <div>
          <span>Patient Feedback</span>
          <h1>Survey Distribution & Complaint Response</h1>
          <p>Automated post-visit surveys, complaint routing, SLA response tracking, and closure follow-up.</p>
        </div>
        <div className="feedback-header-actions">
          <button className="feedback-btn green" onClick={() => setModal("complaint")}><Plus size={17} /> Log Complaint</button>
          <button className="feedback-btn blue" onClick={() => setModal("response")} disabled={!selectedComplaint}><MessageSquare size={17} /> Respond / Resolve</button>
          <button className="feedback-btn purple" onClick={() => setModal("artifact")}><Plus size={17} /> Other Feedback</button>
          <button className="feedback-btn ghost" onClick={() => void load()} disabled={loading}><RefreshCw size={17} /> Refresh</button>
        </div>
      </header>

      {notice ? <div className={`feedback-toast ${tone(notice)}`}>{notice}</div> : null}

      <section className="feedback-stats">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return <article key={stat.label}><Icon size={18} /><span>{stat.label}</span><strong>{stat.value}</strong></article>;
        })}
      </section>

      <section className="feedback-grid feedback-grid-top">
        <form className="feedback-panel feedback-form" onSubmit={dispatchVisit}>
          <div className="feedback-title"><Send size={18} /><div><h2>Automated Survey Distribution</h2><p>Send on inpatient discharge or schedule OPD feedback 24 hours after visit.</p></div></div>
          <label>Visit ID<input value={dispatchForm.visitId} onChange={(event) => setDispatchForm({ ...dispatchForm, visitId: event.target.value })} placeholder="Visit ID" /></label>
          <label>Channel<select value={dispatchForm.channel} onChange={(event) => setDispatchForm({ ...dispatchForm, channel: event.target.value })}>{CHANNELS.map((channel) => <option key={channel}>{channel}</option>)}</select></label>
          <label className="feedback-check"><input type="checkbox" checked={dispatchForm.force} onChange={(event) => setDispatchForm({ ...dispatchForm, force: event.target.checked })} /> Force send</label>
          <button disabled={saving === "dispatch"}><Send size={16} /> {saving === "dispatch" ? "Sending..." : "Dispatch Survey"}</button>
          <button type="button" className="secondary" onClick={runDistribution} disabled={saving === "distribution"}><BellRing size={16} /> Run Visit Sweep</button>
          <button type="button" className="secondary" onClick={reviewResponseRate} disabled={saving === "rate"}><Mail size={16} /> Review Response Rate</button>
        </form>

        <div className="feedback-panel feedback-summary">
          <div className="feedback-title"><AlertTriangle size={18} /><div><h2>Complaint Operations</h2><p>Complaints are routed by category and tracked until patient notification.</p></div></div>
          <div className="feedback-mini-grid">
            <button onClick={() => setModal("complaint")}><Plus size={18} /><strong>Complaint Intake</strong><span>Open routed complaint form</span></button>
            <button onClick={() => setModal("response")} disabled={!selectedComplaint}><MessageSquare size={18} /><strong>Response & Resolution</strong><span>{selectedComplaint ? pretty(selectedComplaint.status) : "Select a complaint"}</span></button>
          </div>
          <dl className="feedback-selected">
            <div><dt>Selected</dt><dd>{selectedComplaint ? pretty(selectedComplaint.category) : "None"}</dd></div>
            <div><dt>Owner</dt><dd>{selectedComplaint?.routedTo || "-"}</dd></div>
            <div><dt>SLA</dt><dd>{selectedComplaint ? dateTime(selectedComplaint.responseDueAt) : "-"}</dd></div>
          </dl>
        </div>
      </section>

      <section className="feedback-panel">
        <div className="feedback-toolbar">
          <div className="feedback-title"><Clock3 size={18} /><div><h2>Complaint SLA Queue</h2><p>{filteredComplaints.length} complaints in view.</p></div></div>
          <div className="feedback-actions">
            {["ALL", "OPEN", "RESPONDED", "OVERDUE", "RESOLVED"].map((item) => <button className={filter === item ? "active" : ""} key={item} onClick={() => setFilter(item)}>{pretty(item)}</button>)}
            <button onClick={runSla} disabled={saving === "sla"}>Run SLA</button>
          </div>
        </div>
        <div className="feedback-list">
          {filteredComplaints.length ? filteredComplaints.map((row) => (
            <button className={`feedback-complaint ${row.overdue ? "breached" : ""} ${selectedComplaint?.id === row.id ? "selected" : ""}`} key={row.id} onClick={() => setSelectedComplaintId(row.id)}>
              <span><strong>{pretty(row.category)}</strong><em>{pretty(row.status)}</em></span>
              <small>{row.description}</small>
              <small>{row.routedTo} | due {dateTime(row.responseDueAt)}</small>
            </button>
          )) : <div className="feedback-empty">No complaints found.</div>}
        </div>
      </section>

      <section className={`feedback-panel feedback-table-panel ${expandedTable === "dispatches" ? "is-expanded" : ""}`}>
        <div className="feedback-title"><Smartphone size={18} /><div><h2>Survey Dispatches</h2><p>Short-code SMS, WhatsApp buttons, and email links are tracked against visits.</p></div><button type="button" className="feedback-expand-btn" onClick={() => setExpandedTable((current) => current === "dispatches" ? "" : "dispatches")} aria-label={expandedTable === "dispatches" ? "Collapse survey dispatches" : "Expand survey dispatches"}>{expandedTable === "dispatches" ? <Minimize2 size={16} /> : <Maximize2 size={16} />}</button></div>
        <div className="feedback-table-wrap">
          <table className="feedback-table">
            <thead><tr><th>Visit</th><th>Trigger</th><th>Channel</th><th>Status</th><th>Response</th><th>Scheduled</th></tr></thead>
            <tbody>
              {dispatches.length ? dispatches.slice(0, 12).map((row) => (
                <tr key={row.id || row.dispatchRef}>
                  <td>{row.visitId}</td><td>{pretty(row.trigger)}</td><td>{row.channel}</td><td>{pretty(row.status)}</td><td>{row.responded ? "Received" : "Pending"}</td><td>{dateTime(row.scheduledFor)}</td>
                </tr>
              )) : <tr><td colSpan={6}>No survey dispatches recorded yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <section className={`feedback-panel feedback-table-panel ${expandedTable === "responses" ? "is-expanded" : ""}`}>
        <div className="feedback-title"><MessageSquare size={18} /><div><h2>Survey Responses</h2><p>Submitted ratings and comments linked to their survey and encounter context.</p></div><button type="button" className="feedback-expand-btn" onClick={() => setExpandedTable((current) => current === "responses" ? "" : "responses")} aria-label={expandedTable === "responses" ? "Collapse survey responses" : "Expand survey responses"}>{expandedTable === "responses" ? <Minimize2 size={16} /> : <Maximize2 size={16} />}</button></div>
        <div className="feedback-table-wrap">
          <table className="feedback-table">
            <thead><tr><th>Survey</th><th>Patient</th><th>Rating</th><th>NPS</th><th>Sentiment</th><th>Submitted</th></tr></thead>
            <tbody>
              {responses.length ? responses.slice(0, 20).map((row) => (
                <tr key={row.id}><td>{row.surveyTitle || row.surveyId || "Survey"}</td><td>{row.anonymous ? "Anonymous" : row.patientId || "Protected"}</td><td>{row.rating ?? row.overallScore ?? "-"}</td><td>{row.npsScore ?? "-"}</td><td>{pretty(row.sentiment || "-")}</td><td>{dateTime(row.submittedAt || row.submittedAtIso)}</td></tr>
              )) : <tr><td colSpan={6}>No survey responses recorded yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      {modal === "complaint" ? (
        <div className="feedback-modal-backdrop" role="dialog" aria-modal="true">
          <div className="feedback-modal is-green">
            <header>
              <div><span>Complaint Intake</span><h2>Log & Route Complaint</h2></div>
              <button onClick={() => setModal("")} aria-label="Close"><X size={18} /></button>
            </header>
            <form className="feedback-modal-form" onSubmit={logComplaint}>
              <label><span>Patient ID</span><input value={complaintForm.patientId} onChange={(event) => setComplaintForm({ ...complaintForm, patientId: event.target.value })} placeholder="Patient ID" /></label>
              <label><span>Visit ID</span><input value={complaintForm.visitId} onChange={(event) => setComplaintForm({ ...complaintForm, visitId: event.target.value })} placeholder="Visit ID" /></label>
              <label><span>Source</span><select value={complaintForm.source} onChange={(event) => setComplaintForm({ ...complaintForm, source: event.target.value })}>{SOURCES.map((source) => <option key={source} value={source}>{pretty(source)}</option>)}</select></label>
              <label><span>Category</span><select value={complaintForm.category} onChange={(event) => setComplaintForm({ ...complaintForm, category: event.target.value })}>{COMPLAINT_CATEGORIES.map((category) => <option key={category} value={category}>{pretty(category)}</option>)}</select></label>
              <label className="wide"><span>Department</span><input value={complaintForm.department} onChange={(event) => setComplaintForm({ ...complaintForm, department: event.target.value })} /></label>
              <label className="wide"><span>Complaint</span><textarea value={complaintForm.description} onChange={(event) => setComplaintForm({ ...complaintForm, description: event.target.value })} placeholder="Complaint details" /></label>
              <footer>
                <button type="button" onClick={() => setModal("")}>Cancel</button>
                <button disabled={saving === "complaint"}><Send size={16} /> {saving === "complaint" ? "Logging..." : "Log & Route"}</button>
              </footer>
            </form>
          </div>
        </div>
      ) : null}

      {modal === "response" ? (
        <div className="feedback-modal-backdrop" role="dialog" aria-modal="true">
          <div className="feedback-modal is-blue">
            <header>
              <div><span>Response & Resolution</span><h2>{selectedComplaint ? pretty(selectedComplaint.category) : "No complaint selected"}</h2></div>
              <button onClick={() => setModal("")} aria-label="Close"><X size={18} /></button>
            </header>
            <div className="feedback-modal-context">
              <strong>{selectedComplaint?.routedTo || "Select a complaint"}</strong>
              <span>{selectedComplaint ? `${pretty(selectedComplaint.status)} | due ${dateTime(selectedComplaint.responseDueAt)}` : "Choose a complaint from the SLA queue first."}</span>
            </div>
            <form className="feedback-modal-form compact" onSubmit={(event) => event.preventDefault()}>
              <label className="wide"><span>Management Response</span><textarea value={responseForm.response} onChange={(event) => setResponseForm({ ...responseForm, response: event.target.value })} placeholder="Response or outcome for patient" /></label>
              <label className="wide"><span>Root Cause</span><input value={responseForm.rootCauseIdentified} onChange={(event) => setResponseForm({ ...responseForm, rootCauseIdentified: event.target.value })} placeholder="Root cause identified" /></label>
              <label className="wide"><span>Prevention Measures</span><textarea value={responseForm.preventionMeasures} onChange={(event) => setResponseForm({ ...responseForm, preventionMeasures: event.target.value })} placeholder="Preventive action" /></label>
              <label className="notify-field"><span>Notify By</span><select value={responseForm.notificationChannel} onChange={(event) => setResponseForm({ ...responseForm, notificationChannel: event.target.value })}>{CHANNELS.map((channel) => <option key={channel}>{channel}</option>)}</select></label>
              <footer>
                <button type="button" onClick={() => setModal("")}>Cancel</button>
                <button type="button" onClick={respond} disabled={!selectedComplaint || saving === "respond"}><MessageSquare size={16} /> Save Response</button>
                <button type="button" className="green" onClick={resolve} disabled={!selectedComplaint || saving === "resolve"}><CheckCircle2 size={16} /> Resolve & Notify</button>
              </footer>
            </form>
          </div>
        </div>
      ) : null}

      {modal === "artifact" ? (
        <div className="feedback-modal-backdrop" role="dialog" aria-modal="true">
          <div className="feedback-modal is-purple">
            <header><div><span>Patient Experience</span><h2>Record Feedback</h2></div><button onClick={() => setModal("")} aria-label="Close"><X size={18} /></button></header>
            <form className="feedback-modal-form" onSubmit={createArtifact}>
              <label><span>Feedback type</span><select value={artifactKind} onChange={(event) => setArtifactKind(event.target.value)}><option value="COMPLIMENT">Compliment</option><option value="SUGGESTION">Suggestion</option><option value="SERVICE_RECOVERY">Service recovery</option><option value="ANONYMOUS">Anonymous feedback</option><option value="CAMPAIGN">Survey campaign</option></select></label>
              <label><span>Patient ID (optional)</span><input value={artifactForm.patientId} onChange={(event) => setArtifactForm({ ...artifactForm, patientId: event.target.value })} placeholder="Leave blank for anonymous" /></label>
              <label><span>Department</span><input value={artifactForm.department} onChange={(event) => setArtifactForm({ ...artifactForm, department: event.target.value })} placeholder="Department or service" /></label>
              <label><span>Title</span><input value={artifactForm.title} onChange={(event) => setArtifactForm({ ...artifactForm, title: event.target.value })} placeholder="Short summary" /></label>
              <label className="wide"><span>Details</span><textarea value={artifactForm.description} onChange={(event) => setArtifactForm({ ...artifactForm, description: event.target.value })} placeholder="Describe the feedback, suggestion, or recovery action" /></label>
              <footer><button type="button" onClick={() => setModal("")}>Cancel</button><button disabled={saving === "artifact"}><Send size={16} /> {saving === "artifact" ? "Saving..." : "Save Feedback"}</button></footer>
            </form>
          </div>
        </div>
      ) : null}
    </main>
  );
}
