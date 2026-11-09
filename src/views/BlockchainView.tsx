"use client";

import type { FormEvent, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Copy,
  Database,
  ExternalLink,
  FileSearch,
  Hash,
  History,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";
import { api } from "../lib/api";
import { useLiveRefresh } from "../lib/liveRefresh";

type Modal = "" | "hash" | "submit" | "verify" | "incident";

type LedgerRow = {
  id: string;
  blockchainTxId?: string;
  moduleType?: string;
  entityType?: string;
  entityId?: string;
  entityHash?: string;
  previousHash?: string | null;
  network?: string;
  status?: string;
  signature?: string | null;
  actorId?: string | null;
  actorRole?: string | null;
  notes?: string | null;
  sourceModule?: string | null;
  timestamp?: string;
};

const unwrapRows = (value: any) => {
  const data = value?.data ?? value;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  return [];
};

const formatDateTime = (value: any) => {
  const date = new Date(String(value || ""));
  if (!Number.isFinite(date.getTime())) return "Unknown";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const noticeTone = (message: string) => {
  const lower = message.toLowerCase();
  if (/(fail|error|cannot|broken|tamper|mismatch|missing|invalid)/.test(lower)) return "error";
  if (/(warning|partial|delay|pending|slow)/.test(lower)) return "warning";
  return "success";
};

function ModalShell({
  modal,
  title,
  subtitle,
  icon,
  children,
  onClose,
  onSubmit,
  saving,
  saveText,
}: {
  modal: Modal;
  title: string;
  subtitle: string;
  icon: ReactNode;
  children: ReactNode;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  saving?: boolean;
  saveText: string;
}) {
  const tone = modal === "hash" ? "blue" : modal === "submit" ? "purple" : modal === "incident" ? "orange" : "green";
  return (
    <div className="module-form-backdrop blockchain-modal" onClick={onClose}>
      <section className={`module-form-panel blockchain-modal-panel blockchain-modal-${tone}`} onClick={(e) => e.stopPropagation()}>
        <header className="module-form-header">
          <div className="module-form-heading">
            <div className="module-form-icon">{icon}</div>
            <div>
              <p className="module-form-kicker">Blockchain audit trail</p>
              <h2 className="module-form-title">{title}</h2>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close form" className="module-form-close">
            <X size={18} />
          </button>
        </header>
        <form className="module-form-body blockchain-modal-body" onSubmit={onSubmit}>
          <div className="blockchain-modal-note">{subtitle}</div>
          <div className="module-form-grid blockchain-modal-grid">{children}</div>
          <footer className="module-form-footer blockchain-modal-footer">
            <button type="button" onClick={onClose} className="module-form-cancel">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="module-form-submit">
              {saving ? "Saving..." : saveText}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
  span = 1,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  span?: number;
}) {
  return (
    <label className={`module-form-field blockchain-field${span > 1 ? " is-wide" : ""}`}>
      <span>
        {label}
        {hint ? <small>({hint})</small> : null}
      </span>
      {children}
    </label>
  );
}

const defaultHashForm = {
  algorithm: "SHA-256",
  hashInput: "",
  payload: "",
};

const defaultSubmitForm = {
  moduleType: "EMR",
  entityType: "RECORD",
  entityId: "",
  hashInput: "",
  signature: "",
  network: "PRIVATE_MOCK",
  status: "CONFIRMED",
  sourceModule: "BLOCKCHAIN",
  notes: "",
  payload: "",
};

const defaultVerifyForm = {
  entityType: "RECORD",
  entityId: "",
  hashInput: "",
  payload: "",
};

const defaultIncidentForm = {
  title: "Blockchain integrity investigation",
  severity: "HIGH",
  description: "",
};

export default function BlockchainAuditPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [moduleFilter, setModuleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [modal, setModal] = useState<Modal>("");
  const [dashboard, setDashboard] = useState<any>({});
  const [ledger, setLedger] = useState<LedgerRow[]>([]);
  const [chainCheck, setChainCheck] = useState<any>(null);
  const [verificationHistory, setVerificationHistory] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [selectedLedgerId, setSelectedLedgerId] = useState("");
  const [hashForm, setHashForm] = useState(defaultHashForm);
  const [submitForm, setSubmitForm] = useState(defaultSubmitForm);
  const [verifyForm, setVerifyForm] = useState(defaultVerifyForm);
  const [incidentForm, setIncidentForm] = useState(defaultIncidentForm);

  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice((current) => (current === message ? "" : current)), 7000);
  };

  const load = async () => {
    setLoading(true);
    try {
      const [dashboardRes, ledgerRes, chainRes, historyRes, incidentRes] = await Promise.all([
        api.get("/blockchain/dashboard").catch(() => ({ data: {} })),
        api.get("/blockchain/ledger?limit=200").catch(() => ({ data: [] })),
        api.get("/blockchain/verify/chain?limit=1000").catch(() => ({ data: null })),
        api.get("/blockchain/verify/history?limit=10").catch(() => ({ data: [] })),
        api.get("/blockchain/incidents?limit=10").catch(() => ({ data: [] })),
      ]);
      const rows = unwrapRows(ledgerRes.data).map((row: any) => ({
        id: String(row.id || row.blockchainTxId || ""),
        blockchainTxId: String(row.blockchainTxId || row.id || ""),
        moduleType: String(row.moduleType || "GENERAL"),
        entityType: String(row.entityType || "RECORD"),
        entityId: String(row.entityId || ""),
        entityHash: String(row.entityHash || ""),
        previousHash: row.previousHash ? String(row.previousHash) : null,
        network: String(row.network || "PRIVATE_MOCK"),
        status: String(row.status || "CONFIRMED"),
        signature: row.signature ? String(row.signature) : null,
        actorId: row.actorId ? String(row.actorId) : null,
        actorRole: row.actorRole ? String(row.actorRole) : null,
        notes: row.notes ? String(row.notes) : null,
        sourceModule: row.sourceModule ? String(row.sourceModule) : null,
        timestamp: row.timestamp ? String(row.timestamp) : undefined,
      }));
      setDashboard(dashboardRes.data || {});
      setLedger(rows);
      setChainCheck(chainRes.data || null);
      setVerificationHistory(unwrapRows(historyRes.data));
      setIncidents(unwrapRows(incidentRes.data));
      setSelectedLedgerId((current) => current || rows[0]?.id || "");
    } catch (error: any) {
      showNotice(error?.response?.data?.message || "Blockchain audit trail could not be loaded.");
      setDashboard({});
      setLedger([]);
      setChainCheck(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  useLiveRefresh(load, { intervalMs: 60000 });

  const selectedLedger = ledger.find((row) => row.id === selectedLedgerId) || ledger[0] || null;

  const filteredLedger = useMemo(() => {
    const query = search.trim().toLowerCase();
    return ledger.filter((row) => {
      if (moduleFilter !== "ALL" && String(row.moduleType || "").toUpperCase() !== moduleFilter) return false;
      if (statusFilter !== "ALL" && String(row.status || "").toUpperCase() !== statusFilter) return false;
      if (dateFrom && row.timestamp && new Date(row.timestamp) < new Date(`${dateFrom}T00:00:00`)) return false;
      if (dateTo && row.timestamp && new Date(row.timestamp) > new Date(`${dateTo}T23:59:59`)) return false;
      if (!query) return true;
      return [
        row.blockchainTxId,
        row.moduleType,
        row.entityType,
        row.entityId,
        row.entityHash,
        row.status,
        row.actorId,
        row.actorRole,
        row.sourceModule,
        row.notes,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [ledger, moduleFilter, search, statusFilter]);

  const stats = [
    {
      label: "Total events",
      value: Number(dashboard?.totals?.totalTransactions || ledger.length || 0),
      color: "#2563eb",
    },
    {
      label: "Integrity score",
      value: chainCheck?.totals?.integrityScore || "100%",
      color: chainCheck?.verified === false ? "#dc2626" : "#16a34a",
    },
    {
      label: "Verified checks",
      value: Number(dashboard?.totals?.successfulVerifications || 0),
      color: "#0f766e",
    },
    {
      label: "Tamper alerts",
      value: Number(dashboard?.totals?.tamperingAttempts || 0),
      color: "#dc2626",
    },
    {
      label: "Unique entities",
      value: Number(dashboard?.totals?.uniqueEntities || 0),
      color: "#7c3aed",
    },
  ];

  const copyText = async (value: string, message: string) => {
    if (!value) return showNotice("Nothing to copy.");
    try {
      await navigator.clipboard.writeText(value);
      showNotice(message);
    } catch {
      showNotice("Unable to copy right now.");
    }
  };

  const runChainCheck = async () => {
    setSaving("chain");
    try {
      const response = await api.get("/blockchain/verify/chain?limit=1000");
      setChainCheck(response.data || null);
      showNotice(response.data?.verified ? "Blockchain chain integrity verified." : "Blockchain chain verification found a break.");
    } catch (error: any) {
      showNotice(error?.response?.data?.message || "Chain integrity verification failed.");
    } finally {
      setSaving("");
    }
  };

  const exportEvidence = async () => {
    setSaving("export");
    try {
      const response = await api.post("/blockchain/evidence/export", {
        moduleType: moduleFilter === "ALL" ? undefined : moduleFilter,
        entityType: undefined,
        purpose: "Authorized blockchain audit review",
      });
      const payload = JSON.stringify(response.data || {}, null, 2);
      const url = URL.createObjectURL(new Blob([payload], { type: "application/json" }));
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `medilink-blockchain-evidence-${new Date().toISOString().slice(0, 10)}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
      showNotice("Evidence package generated and downloaded.");
    } catch (error: any) {
      showNotice(error?.response?.data?.message || "Evidence export could not be generated.");
    } finally {
      setSaving("");
    }
  };

  const createCheckpoint = async () => {
    setSaving("checkpoint");
    try {
      const response = await api.post("/blockchain/checkpoint");
      showNotice(response.data?.independentlySigned ? "Signed chain checkpoint created." : "Checkpoint created; configure BLOCKCHAIN_CHECKPOINT_SECRET for independent signing.");
      await load();
    } catch (error: any) {
      showNotice(error?.response?.data?.message || "Checkpoint could not be created.");
    } finally { setSaving(""); }
  };

  const reconcileAudit = async () => {
    setSaving("reconcile");
    try {
      const response = await api.post("/blockchain/reconcile?limit=200");
      showNotice(`${response.data?.committed || 0} source audit events reconciled into the chain.`);
      await load();
    } catch (error: any) {
      showNotice(error?.response?.data?.message || "Audit reconciliation failed.");
    } finally { setSaving(""); }
  };

  const runHash = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving("hash");
    try {
      const payload = hashForm.payload.trim();
      const response = await api.post("/blockchain/hash", {
        algorithm: hashForm.algorithm,
        hashInput: hashForm.hashInput.trim() || undefined,
        payload: payload ? JSON.parse(payload) : undefined,
      });
      const data = response.data || {};
      showNotice("Payload hashed successfully.");
      setHashForm(defaultHashForm);
      setModal("");
      await load();
      if (data.hash) await copyText(String(data.hash), "Hash copied to clipboard.");
    } catch (error: any) {
      showNotice(error?.response?.data?.message || "Hash could not be generated.");
    } finally {
      setSaving("");
    }
  };

  const submitLedgerEntry = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving("submit");
    try {
      const payload = submitForm.payload.trim();
      const response = await api.post("/blockchain/submit", {
        moduleType: submitForm.moduleType,
        entityType: submitForm.entityType,
        entityId: submitForm.entityId.trim(),
        hashInput: submitForm.hashInput.trim() || undefined,
        signature: submitForm.signature.trim() || undefined,
        network: submitForm.network,
        status: submitForm.status,
        sourceModule: submitForm.sourceModule.trim() || undefined,
        notes: submitForm.notes.trim() || undefined,
        payload: payload ? JSON.parse(payload) : undefined,
      });
      showNotice("Blockchain transaction recorded and linked.");
      setSubmitForm(defaultSubmitForm);
      setModal("");
      await load();
      setSelectedLedgerId(String(response.data?.blockchainTxId || response.data?.id || selectedLedgerId));
    } catch (error: any) {
      showNotice(error?.response?.data?.message || "Blockchain transaction could not be recorded.");
    } finally {
      setSaving("");
    }
  };

  const verifyLedgerEntity = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving("verify");
    try {
      const payload = verifyForm.payload.trim();
      const response = await api.post("/blockchain/verify/entity", {
        entityType: verifyForm.entityType,
        entityId: verifyForm.entityId.trim(),
        hashInput: verifyForm.hashInput.trim() || undefined,
        payload: payload ? JSON.parse(payload) : undefined,
      });
      const data = response.data || {};
      showNotice(data.verified ? "Entity hash verified." : "Entity hash mismatch detected.");
      setModal("");
      await load();
    } catch (error: any) {
      showNotice(error?.response?.data?.message || "Entity verification could not be completed.");
    } finally {
      setSaving("");
    }
  };

  const openIncident = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving("incident");
    try {
      await api.post("/blockchain/incidents", { ...incidentForm, relatedEntry: selectedLedger?.blockchainTxId || null });
      setIncidentForm(defaultIncidentForm);
      setModal("");
      showNotice("Integrity incident opened and preserved in the audit trail.");
      await load();
    } catch (error: any) {
      showNotice(error?.response?.data?.message || "Incident could not be opened.");
    } finally {
      setSaving("");
    }
  };

  const ledgerTypeOptions = Array.from(new Set(ledger.map((row) => String(row.moduleType || "GENERAL").toUpperCase()))).sort();
  const statusOptions = Array.from(new Set(ledger.map((row) => String(row.status || "CONFIRMED").toUpperCase()))).sort();

  return (
    <div className="nursing-view blockchain-view">
      <div className="mx-auto flex w-full max-w-[1700px] flex-col gap-4">
        {notice ? (
          <div className={`hr-toast blockchain-toast ${noticeTone(notice)}`}>
            <div className="blockchain-toast-icon">
              {noticeTone(notice) === "error" ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
            </div>
            <div className="blockchain-toast-copy">
              <strong>{noticeTone(notice) === "error" ? "Error" : noticeTone(notice) === "warning" ? "Warning" : "Success"}</strong>
              <span>{notice}</span>
            </div>
            <button type="button" onClick={() => setNotice("")} aria-label="Dismiss notification">
              X
            </button>
          </div>
        ) : null}

        <div className="pv-header blockchain-header">
          <div>
            <p className="pv-kicker">Blockchain Audit Trail</p>
            <h2 className="pv-title">Immutable event ledger</h2>
            <p className="pv-subtitle">
              Every major system event is appended to a SHA-256 linked chain for tamper detection and medico-legal audit proof.
            </p>
          </div>
          <div className="nursing-header-actions blockchain-header-actions">
            <button type="button" className="blockchain-action-btn is-neutral" onClick={() => void load()}>
              <RefreshCw size={15} /> Refresh
            </button>
            <button type="button" className="blockchain-action-btn is-primary" onClick={() => void runChainCheck()} disabled={saving === "chain"}>
              <ShieldCheck size={15} /> Verify Chain
            </button>
            <button type="button" className="blockchain-action-btn is-info" onClick={() => setModal("hash")}>
              <Hash size={15} /> Hash Payload
            </button>
            <button type="button" className="blockchain-action-btn is-warning" onClick={() => setModal("submit")}>
              <Plus size={15} /> Record Event
            </button>
            <button type="button" className="blockchain-action-btn is-info" onClick={() => void exportEvidence()} disabled={saving === "export"}>
              <ExternalLink size={15} /> {saving === "export" ? "Exporting..." : "Export Evidence"}
            </button>
            <button type="button" className="blockchain-action-btn is-primary" onClick={() => void createCheckpoint()} disabled={saving === "checkpoint"}>
              <ShieldCheck size={15} /> {saving === "checkpoint" ? "Checkpointing..." : "Create Checkpoint"}
            </button>
            <button type="button" className="blockchain-action-btn is-neutral" onClick={() => void reconcileAudit()} disabled={saving === "reconcile"}>
              <History size={15} /> {saving === "reconcile" ? "Reconciling..." : "Reconcile Audit"}
            </button>
          </div>
        </div>

        <div className="pv-stats nursing-stats-grid blockchain-stats">
          {stats.map((stat) => (
            <button
              key={stat.label}
              type="button"
              className="pv-stat-card text-left transition hover:-translate-y-0.5 hover:shadow-lg"
              style={{ borderLeft: `4px solid ${stat.color}` }}
            >
              <div className="flex flex-1 flex-col justify-between">
                <span className="pv-stat-label">{stat.label}</span>
                <span className="pv-stat-value">
                  {typeof stat.value === "number" ? stat.value.toLocaleString() : stat.value}
                </span>
              </div>
              <div className="flex items-center">
                <div className="rounded-2xl p-2.5 text-white" style={{ background: stat.color }}>
                  <Database size={16} />
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="nursing-layout blockchain-layout">
          <section className="nursing-worklist blockchain-worklist">
      <div className="pv-search-bar blockchain-filterbar">
              <div className="pv-search-wrap">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search hash, module, entity, actor..."
                  className="pv-search"
                />
              </div>
              <select
                value={moduleFilter}
                onChange={(event) => setModuleFilter(event.target.value)}
                className="rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none focus:border-sky-500"
              >
                <option value="ALL">All modules</option>
                {ledgerTypeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
              <input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} aria-label="From date" className="blockchain-date-filter" />
              <input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} aria-label="To date" className="blockchain-date-filter" />
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none focus:border-sky-500"
              >
                <option value="ALL">All statuses</option>
                {statusOptions.map((option) => (
                  <option key={option} value={option}>
                    {option.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>

            <div className="pv-table-wrap blockchain-table-wrap">
              <table className="pv-table blockchain-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Module</th>
                    <th>Entity</th>
                    <th>Hash</th>
                    <th>Status</th>
                    <th>Actor</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="pv-empty">
                        Loading blockchain ledger...
                      </td>
                    </tr>
                  ) : filteredLedger.length ? (
                    filteredLedger.map((row) => {
                      const selected = row.id === selectedLedger?.id;
                      return (
                        <tr key={row.id} onClick={() => setSelectedLedgerId(row.id)} className={selected ? "selected" : ""}>
                          <td>{formatDateTime(row.timestamp)}</td>
                          <td>
                            <strong>{String(row.moduleType || "GENERAL").replace(/_/g, " ")}</strong>
                            <span>{row.sourceModule || "Module event"}</span>
                          </td>
                          <td>
                            <strong>{String(row.entityType || "RECORD").replace(/_/g, " ")}</strong>
                            <span>{row.entityId || "No entity"}</span>
                          </td>
                          <td>
                            <span className="blockchain-hash">{row.entityHash || "No hash"}</span>
                          </td>
                          <td>
                            <span className={`blockchain-status status-${String(row.status || "CONFIRMED").toLowerCase().replace(/_/g, "-")}`}>
                              {String(row.status || "CONFIRMED").replace(/_/g, " ")}
                            </span>
                          </td>
                          <td>
                            <strong>{row.actorRole || "SYSTEM"}</strong>
                            <span>{row.actorId || "Automated"}</span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="pv-empty">
                        No blockchain entries found for this filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="nursing-care-panel blockchain-case-panel">
            <div className="nursing-care-header blockchain-case-header">
              <div>
                <span>Selected ledger entry</span>
                <strong>{selectedLedger ? selectedLedger.blockchainTxId || selectedLedger.id : "No entry selected"}</strong>
              </div>
              <p>
                {selectedLedger
                  ? `${selectedLedger.moduleType} / ${selectedLedger.entityType} • ${formatDateTime(selectedLedger.timestamp)}`
                  : "Pick a ledger entry to inspect its hash chain proof and metadata."}
              </p>
              {chainCheck ? (
                <span className={`blockchain-pill ${chainCheck.verified ? "is-clear" : "is-warning"}`}>
                  {chainCheck.verified ? "Verified" : "Broken"}
                </span>
              ) : null}
            </div>

            <div className="blockchain-detail-stack">
              <div className="blockchain-detail-card">
                <p className="blockchain-detail-kicker">Chain integrity</p>
                <div className="blockchain-detail-grid">
                  <div>
                    <span>Entries</span>
                    <strong>{chainCheck?.totals?.chainEntries ?? ledger.length ?? 0}</strong>
                  </div>
                  <div>
                    <span>Integrity score</span>
                    <strong>{chainCheck?.totals?.integrityScore || "100%"}</strong>
                  </div>
                  <div>
                    <span>Broken link</span>
                    <strong>{chainCheck?.brokenAt ? `Entry ${chainCheck.brokenAt.index}` : "None"}</strong>
                  </div>
                  <div>
                    <span>Tamper alerts</span>
                    <strong>{Number(dashboard?.totals?.tamperingAttempts || 0).toLocaleString()}</strong>
                  </div>
                </div>
              </div>

              <div className="blockchain-detail-card">
                <p className="blockchain-detail-kicker">Selected entry</p>
                {selectedLedger ? (
                  <div className="blockchain-meta-list">
                    <div>
                      <span>Hash</span>
                      <strong>{selectedLedger.entityHash || "No hash"}</strong>
                    </div>
                    <div>
                      <span>Previous</span>
                      <strong>{selectedLedger.previousHash || "GENESIS"}</strong>
                    </div>
                    <div>
                      <span>Source</span>
                      <strong>{selectedLedger.sourceModule || "Unknown"}</strong>
                    </div>
                    <div>
                      <span>Notes</span>
                      <strong>{selectedLedger.notes || "No notes recorded"}</strong>
                    </div>
                  </div>
                ) : (
                  <div className="blockchain-empty">
                    <FileSearch size={24} />
                    <p>Select a ledger row to inspect its metadata and linked hash.</p>
                  </div>
                )}
                <div className="blockchain-detail-actions">
                  <button
                    type="button"
                    className="blockchain-action-btn is-info"
                    onClick={() => selectedLedger && void copyText(selectedLedger.entityHash || "", "Hash copied to clipboard.")}
                    disabled={!selectedLedger}
                  >
                    <Copy size={14} /> Copy Hash
                  </button>
                  <button
                    type="button"
                    className="blockchain-action-btn is-primary"
                    onClick={() => {
                      if (!selectedLedger) return showNotice("Select a ledger entry first.");
                      setVerifyForm({
                        entityType: selectedLedger.entityType || "RECORD",
                        entityId: selectedLedger.entityId || "",
                        hashInput: selectedLedger.entityHash || "",
                        payload: "",
                      });
                      setModal("verify");
                    }}
                    disabled={!selectedLedger}
                  >
                    <ShieldCheck size={14} /> Verify Entity
                  </button>
                  <button type="button" className="blockchain-action-btn is-neutral" onClick={() => void runChainCheck()}>
                    <History size={14} /> Recheck
                  </button>
                  <button type="button" className="blockchain-action-btn is-warning" onClick={() => setModal("incident")}>
                    <AlertTriangle size={14} /> Open Incident
                  </button>
                </div>
              </div>

              <div className="blockchain-detail-card">
                <p className="blockchain-detail-kicker">Recent verification</p>
                {chainCheck?.entries?.length ? (
                  <div className="blockchain-chain-list">
                    {chainCheck.entries.slice(0, 5).map((entry: any) => (
                      <div key={`${entry.blockchainTxId}-${entry.index}`} className={`blockchain-chain-row ${entry.chainStatus === "BROKEN" ? "is-warning" : ""}`}>
                        <div>
                          <strong>Entry {entry.index}</strong>
                          <span>{formatDateTime(entry.timestamp)}</span>
                        </div>
                        <code>{String(entry.entryHash || "").slice(0, 18)}...</code>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="blockchain-empty">
                    <CheckCircle2 size={24} />
                    <p>Run a chain verification to see the latest linked entries.</p>
                  </div>
                )}
                {verificationHistory.length ? (
                  <div className="blockchain-history-note">
                    Last run: {formatDateTime(verificationHistory[0]?.checkedAt)} · {verificationHistory[0]?.result || "UNKNOWN"}
                  </div>
                ) : null}
              </div>
              <div className="blockchain-detail-card">
                <p className="blockchain-detail-kicker">Investigation workspace</p>
                {incidents.length ? incidents.slice(0, 3).map((incident: any) => (
                  <div key={incident.incidentId} className="blockchain-chain-row is-warning">
                    <div><strong>{incident.title || "Integrity incident"}</strong><span>{incident.status || "OPEN"} · {formatDateTime(incident.openedAt)}</span></div>
                    <code>{String(incident.incidentId || "").slice(0, 12)}</code>
                  </div>
                )) : <div className="blockchain-empty"><p>No integrity incidents are currently open.</p></div>}
              </div>
            </div>
          </section>
        </div>
      </div>

      {modal === "hash" ? (
        <ModalShell
          modal="hash"
          title="Hash Payload"
          subtitle="Generate a SHA-256 hash from raw text or a JSON payload and keep the output ready for audit use."
          icon={<Hash size={20} />}
          onClose={() => setModal("")}
          onSubmit={runHash}
          saving={saving === "hash"}
          saveText="Generate Hash"
        >
          <Field label="Algorithm">
            <select value={hashForm.algorithm} onChange={(event) => setHashForm((current) => ({ ...current, algorithm: event.target.value }))}>
              <option value="SHA-256">SHA-256</option>
            </select>
          </Field>
          <Field label="Raw text" hint="Optional alternative to JSON payload" span={2}>
            <input
              value={hashForm.hashInput}
              onChange={(event) => setHashForm((current) => ({ ...current, hashInput: event.target.value }))}
              placeholder="Enter text to hash"
            />
          </Field>
          <Field label="JSON payload" hint="Optional structured content" span={2}>
            <textarea
              rows={8}
              value={hashForm.payload}
              onChange={(event) => setHashForm((current) => ({ ...current, payload: event.target.value }))}
              placeholder='{"module":"EMR","event":"note_signed"}'
            />
          </Field>
        </ModalShell>
      ) : null}

      {modal === "submit" ? (
        <ModalShell
          modal="submit"
          title="Record Blockchain Event"
          subtitle="Create a blockchain-backed audit submission for a clinical, billing, or security event."
          icon={<ClipboardList size={20} />}
          onClose={() => setModal("")}
          onSubmit={submitLedgerEntry}
          saving={saving === "submit"}
          saveText="Record Event"
        >
          <Field label="Module type">
            <input
              value={submitForm.moduleType}
              onChange={(event) => setSubmitForm((current) => ({ ...current, moduleType: event.target.value }))}
              placeholder="EMR"
            />
          </Field>
          <Field label="Entity type">
            <input
              value={submitForm.entityType}
              onChange={(event) => setSubmitForm((current) => ({ ...current, entityType: event.target.value }))}
              placeholder="RECORD"
            />
          </Field>
          <Field label="Entity ID" span={2}>
            <input
              value={submitForm.entityId}
              onChange={(event) => setSubmitForm((current) => ({ ...current, entityId: event.target.value }))}
              placeholder="Unique record identifier"
            />
          </Field>
          <Field label="Raw hash" hint="Optional; can be entered directly if already computed" span={2}>
            <input
              value={submitForm.hashInput}
              onChange={(event) => setSubmitForm((current) => ({ ...current, hashInput: event.target.value }))}
              placeholder="SHA-256 hash or source text"
            />
          </Field>
          <Field label="Signature / PKI ref">
            <input
              value={submitForm.signature}
              onChange={(event) => setSubmitForm((current) => ({ ...current, signature: event.target.value }))}
              placeholder="Digital signature reference"
            />
          </Field>
          <Field label="Network">
            <select value={submitForm.network} onChange={(event) => setSubmitForm((current) => ({ ...current, network: event.target.value }))}>
              <option value="PRIVATE_MOCK">Private mock</option>
              <option value="PRIVATE_LEDGER">Private ledger</option>
              <option value="CONSORTIUM">Consortium</option>
            </select>
          </Field>
          <Field label="Status">
            <select value={submitForm.status} onChange={(event) => setSubmitForm((current) => ({ ...current, status: event.target.value }))}>
              <option value="CONFIRMED">Confirmed</option>
              <option value="PENDING">Pending</option>
              <option value="REVIEWED">Reviewed</option>
            </select>
          </Field>
          <Field label="Source module">
            <input
              value={submitForm.sourceModule}
              onChange={(event) => setSubmitForm((current) => ({ ...current, sourceModule: event.target.value }))}
              placeholder="EMR / Billing / Security"
            />
          </Field>
          <Field label="Notes" span={2}>
            <textarea
              rows={5}
              value={submitForm.notes}
              onChange={(event) => setSubmitForm((current) => ({ ...current, notes: event.target.value }))}
              placeholder="Audit details, reviewer notes, or reason for recording."
            />
          </Field>
          <Field label="JSON payload" hint="Optional structured event content" span={2}>
            <textarea
              rows={8}
              value={submitForm.payload}
              onChange={(event) => setSubmitForm((current) => ({ ...current, payload: event.target.value }))}
              placeholder='{"event":"login","user":"demo.admin"}'
            />
          </Field>
        </ModalShell>
      ) : null}

      {modal === "verify" ? (
        <ModalShell
          modal="verify"
          title="Verify Entity"
          subtitle="Recompute the entity hash and compare it with the stored blockchain record to confirm integrity."
          icon={<ShieldCheck size={20} />}
          onClose={() => setModal("")}
          onSubmit={verifyLedgerEntity}
          saving={saving === "verify"}
          saveText="Verify Entity"
        >
          <Field label="Entity type">
            <input
              value={verifyForm.entityType}
              onChange={(event) => setVerifyForm((current) => ({ ...current, entityType: event.target.value }))}
              placeholder="RECORD"
            />
          </Field>
          <Field label="Entity ID">
            <input
              value={verifyForm.entityId}
              onChange={(event) => setVerifyForm((current) => ({ ...current, entityId: event.target.value }))}
              placeholder="Unique record identifier"
            />
          </Field>
          <Field label="Raw hash" span={2}>
            <input
              value={verifyForm.hashInput}
              onChange={(event) => setVerifyForm((current) => ({ ...current, hashInput: event.target.value }))}
              placeholder="SHA-256 hash or source text"
            />
          </Field>
          <Field label="JSON payload" span={2}>
            <textarea
              rows={8}
              value={verifyForm.payload}
              onChange={(event) => setVerifyForm((current) => ({ ...current, payload: event.target.value }))}
              placeholder='{"entity":"record","field":"value"}'
            />
          </Field>
        </ModalShell>
      ) : null}

      {modal === "incident" ? (
        <ModalShell
          modal="incident"
          title="Open Integrity Incident"
          subtitle="Preserve the finding and assign it for documented investigation and recovery review."
          icon={<AlertTriangle size={20} />}
          onClose={() => setModal("")}
          onSubmit={openIncident}
          saving={saving === "incident"}
          saveText="Open Incident"
        >
          <Field label="Incident title" span={2}>
            <input value={incidentForm.title} onChange={(event) => setIncidentForm((current) => ({ ...current, title: event.target.value }))} required />
          </Field>
          <Field label="Severity">
            <select value={incidentForm.severity} onChange={(event) => setIncidentForm((current) => ({ ...current, severity: event.target.value }))}>
              <option value="HIGH">High</option><option value="CRITICAL">Critical</option><option value="MEDIUM">Medium</option>
            </select>
          </Field>
          <Field label="Description" span={2}>
            <textarea rows={6} value={incidentForm.description} onChange={(event) => setIncidentForm((current) => ({ ...current, description: event.target.value }))} placeholder="Describe the mismatch, gap, or suspicious activity." required />
          </Field>
        </ModalShell>
      ) : null}
    </div>
  );
}

export { BlockchainAuditPage as BlockchainView };
