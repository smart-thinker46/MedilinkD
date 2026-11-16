// Ported from Medilink-Frontend/src/app/ai-central/page.tsx for desktop parity.
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Activity, BookOpen, Bot, ClipboardPenLine, FileText, HeartPulse, RefreshCw, Search, ShieldCheck, Sparkles, X } from "lucide-react";
import { getAccessToken } from "../lib/apiClient";

const AI_URL = String(((import.meta as any).env?.VITE_MEDILINK_AI_URL) || "http://127.0.0.1:8088").replace(/\/+$/, "");
type AiResult = { status: string; text?: string; issues?: string[]; sources?: Array<{ id: string; record_ref: string; date?: string }>; confidence?: string; evidence_count?: number };
type PatientMatch = { id: string; name: string; mrn?: string };

export default function AiCentralView() {
  const [health, setHealth] = useState<any>(null), [platform, setPlatform] = useState<any>(null);
  const [patientId, setPatientId] = useState(""), [patientQuery, setPatientQuery] = useState(""), [matches, setMatches] = useState<PatientMatch[]>([]), [searchingPatients, setSearchingPatients] = useState(false), [question, setQuestion] = useState(""), [dictation, setDictation] = useState("");
  const [result, setResult] = useState<AiResult | null>(null), [active, setActive] = useState<"summary" | "knowledge" | "draft">("summary");
  const [loading, setLoading] = useState(false), [notice, setNotice] = useState("");
  const request = async (path: string, options: RequestInit = {}) => {
    const token = getAccessToken();
    const response = await fetch(`${AI_URL}${path}`, { ...options, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(options.headers || {}) } });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.detail || body.message || "Medilink AI could not complete this request.");
    return body;
  };
  const loadStatus = async () => {
    try {
      const nextHealth = await request("/healthz");
      setHealth(nextHealth);
      try { setPlatform(await request("/v1/platform")); setNotice(""); }
      catch (error: any) { setPlatform(null); setNotice(error.message || "Sign in to Medilink to load approved AI capabilities."); }
    } catch (error: any) { setHealth(null); setPlatform(null); setNotice(error.message || "Medilink AI is unavailable."); }
  };
  useEffect(() => { void loadStatus(); }, []);
  useEffect(() => {
    const query = patientQuery.trim();
    if (query.length < 2 || patientId) { setMatches([]); return; }
    const timer = window.setTimeout(() => {
      setSearchingPatients(true);
      request(`/v1/patients/search?q=${encodeURIComponent(query)}`)
        .then((data) => setMatches(Array.isArray(data?.items) ? data.items : []))
        .catch((error: any) => { setMatches([]); setNotice(error.message || "Patient search is unavailable."); })
        .finally(() => setSearchingPatients(false));
    }, 300);
    return () => window.clearTimeout(timer);
  }, [patientQuery, patientId]);
  const run = async (event: FormEvent) => {
    event.preventDefault(); setResult(null); setNotice(""); setLoading(true);
    try {
      let next: AiResult;
      if (active === "summary") { if (!patientId.trim()) throw new Error("Enter the patient ID from the selected Medilink patient record."); next = await request(`/v1/summary/${encodeURIComponent(patientId.trim())}`); }
      else if (active === "knowledge") { if (!question.trim()) throw new Error("Enter a hospital policy or procedure question."); next = await request("/v1/knowledge", { method: "POST", body: JSON.stringify({ question }) }); }
      else { if (!patientId.trim() || !dictation.trim()) throw new Error("A patient ID and dictated clinical information are required."); next = await request("/v1/note-draft", { method: "POST", body: JSON.stringify({ patient_id: patientId.trim(), transcript: dictation }) }); }
      setResult(next);
    } catch (error: any) { setNotice(error.message || "Medilink AI request failed."); } finally { setLoading(false); }
  };
  const capabilities = useMemo(() => platform?.capabilities || [], [platform]);
  const selectedPatientLabel = patientQuery || patientId;
  return <main className="ai-central-page">
    <header className="ai-central-header"><div className="ai-central-brand"><span><Bot size={22} /></span><div><p>MEDILINK AI PLATFORM</p><h1>Private hospital intelligence</h1><small>Evidence-led assistance only. AI never executes a clinical, financial, or administrative action.</small></div></div><button type="button" className="ai-central-refresh" onClick={() => void loadStatus()}><RefreshCw size={16} /> Refresh status</button></header>
    <section className="ai-central-status"><article><Activity size={18} /><div><small>Gateway</small><strong className={health ? "is-online" : "is-offline"}>{health ? "Available" : "Unavailable"}</strong></div></article><article><ShieldCheck size={18} /><div><small>Operating mode</small><strong>{health?.mode || "Not connected"}</strong></div></article><article><Sparkles size={18} /><div><small>Local runtime</small><strong>{health?.model || "—"}</strong></div></article><article><FileText size={18} /><div><small>Audit chain</small><strong className={health?.audit_chain_intact ? "is-online" : "is-offline"}>{health?.audit_chain_intact ? "Verified" : "Awaiting check"}</strong></div></article></section>
    <section className="ai-central-grid"><section className="ai-workspace"><div className="ai-workspace-heading"><div><span>AI WORKSPACE</span><h2>Ask, summarise, or draft</h2></div><p>Requests run locally and retain Medilink access controls.</p></div><div className="ai-workspace-tabs"><button className={active === "summary" ? "is-active" : ""} onClick={() => setActive("summary")}><HeartPulse size={15} /> Patient summary</button><button className={active === "draft" ? "is-active" : ""} onClick={() => setActive("draft")}><ClipboardPenLine size={15} /> Note draft</button><button className={active === "knowledge" ? "is-active" : ""} onClick={() => setActive("knowledge")}><BookOpen size={15} /> Hospital knowledge</button></div><form className="ai-workspace-form" onSubmit={run}>{active !== "knowledge" && <label className="module-form-field"><span>Search patient</span><div className="ai-patient-search"><Search size={16} /><input className="module-form-input" value={patientQuery} onChange={(event) => { setPatientQuery(event.target.value); setPatientId(""); }} placeholder="Search by name, MRN, phone, or national ID" />{patientId && <button type="button" onClick={() => { setPatientId(""); setPatientQuery(""); }} aria-label="Clear selected patient"><X size={14} /></button>}</div>{searchingPatients && <small>Searching authorized patient records…</small>}{patientId && <small className="ai-selected-patient">Selected patient: {selectedPatientLabel}</small>}{matches.length > 0 && <div className="ai-patient-matches" role="listbox" aria-label="Matching patients">{matches.map((match) => <button type="button" role="option" key={match.id} onClick={() => { setPatientId(match.id); setPatientQuery(`${match.name}${match.mrn ? ` · ${match.mrn}` : ""}`); setMatches([]); setResult(null); }}><span><strong>{match.name}</strong><small>{match.mrn || "No medical record number"}</small></span><em>Select</em></button>)}</div>}</label>}{active === "knowledge" && <label className="module-form-field"><span>Policy or procedure question</span><textarea className="module-form-input" value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Example: What is the procedure for handling a critical laboratory result?" /></label>}{active === "draft" && <label className="module-form-field"><span>Dictated clinical information</span><textarea className="module-form-input" value={dictation} onChange={(event) => setDictation(event.target.value)} placeholder="AI produces a draft only; the clinician must review, edit and sign in the relevant module." /></label>}<button className="ai-central-run form-btn form-btn-primary module-form-submit" disabled={loading}>{loading ? "Working locally…" : active === "summary" ? "Generate summary" : active === "draft" ? "Create draft" : "Search approved knowledge"}</button></form>{notice && <p className="ai-central-notice"><X size={15} /> {notice}</p>}{result && <section className="ai-result"><header><div><span>{result.status === "ok" ? "AI RESPONSE" : "REQUEST STATUS"}</span><h3>{result.status === "ok" ? "For authorized human review" : result.status}</h3></div>{result.status === "ok" && <div className="ai-result-evidence">{result.confidence || "LOW"} evidence<br />{result.evidence_count || 0} source(s)</div>}</header><pre>{result.text || result.issues?.join("\n") || "No response was returned."}</pre>{result.sources?.length ? <footer>{result.sources.map((source) => <span key={source.id}>{source.id} · {source.record_ref}{source.date ? ` · ${source.date}` : ""}</span>)}</footer> : null}</section>}</section><aside className="ai-governance-panel"><span>GOVERNANCE</span><h2>Approved capabilities</h2><p>The authoritative action always remains in the relevant Medilink module.</p><div>{capabilities.length ? capabilities.map((capability: any) => <article key={capability.id}><strong>{capability.label}</strong><small>{capability.mode} · {capability.human_review ? "human review required" : "cited answer"}</small></article>) : <p className="ai-panel-empty">Connect the local AI gateway to view approved capabilities.</p>}</div><footer><ShieldCheck size={15} /> No direct write access</footer></aside></section>
  </main>;
}
