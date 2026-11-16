// Ported from Medilink-Frontend/src/app/revenue/page.tsx for desktop parity.
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  CalendarClock,
  CheckCircle2,
  Download,
  FileSearch,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  X,
} from "lucide-react";
import { api } from "../lib/api";
import { useLiveRefresh } from "../lib/liveRefresh";

const money = (value: unknown) =>
  `KES ${Number(value || 0).toLocaleString("en-KE", { maximumFractionDigits: 0 })}`;

const percent = (value: unknown) => `${Number(value || 0).toFixed(1)}%`;
const unwrap = (value: any) => value?.data?.data ?? value?.data ?? value ?? null;
const rowsFrom = (value: any): any[] => {
  const payload = unwrap(value);
  if (Array.isArray(payload)) return payload;
  return [payload?.items, payload?.rows, payload?.results, payload?.data].find(Array.isArray) || [];
};

const emptyActionForm = {
  owner: "",
  dueDate: "",
  notes: "",
};

const csvCell = (value: unknown) => {
  const text = value === null || value === undefined ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
};

export default function RevenueView() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [arReport, setArReport] = useState<any>(null);
  const [firstPass, setFirstPass] = useState<any>(null);
  const [claims, setClaims] = useState<any[]>([]);
  const [operational, setOperational] = useState({ denials: [] as any[], appeals: [] as any[], leakage: [] as any[], remittances: [] as any[], reconciliations: [] as any[], charges: [] as any[] });
  const [sourceErrors, setSourceErrors] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [payer, setPayer] = useState("ALL");
  const [bucket, setBucket] = useState("ALL");
  const [selected, setSelected] = useState<any | null>(null);
  const [modal, setModal] = useState<"followup" | "denial" | "">("");
  const [actionForm, setActionForm] = useState(emptyActionForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ tone: "success" | "warning" | "error"; text: string } | null>(null);

  const showNotice = (text: string, tone: "success" | "warning" | "error" = "success") => {
    setNotice({ text, tone });
    window.setTimeout(() => setNotice(null), tone === "success" ? 2600 : 4200);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const params = {
        ...(search.trim() ? { search: search.trim() } : {}),
        ...(payer !== "ALL" ? { payerName: payer } : {}),
      };
      const results = await Promise.allSettled([
        api.get("/revenue-cycle/dashboard"),
        api.get("/revenue-cycle/days-in-ar", { params }),
        api.get("/revenue-cycle/first-pass-rate", { params: payer !== "ALL" ? { payerName: payer } : {} }),
        api.get("/revenue-cycle/claims", { params: { limit: 100, ...(search.trim() ? { search: search.trim() } : {}) } }),
        api.get("/revenue-cycle/claim-denials", { params: { limit: 100 } }),
        api.get("/revenue-cycle/appeals", { params: { limit: 100 } }),
        api.get("/revenue-cycle/leakage-flags", { params: { limit: 100 } }),
        api.get("/revenue-cycle/remittances", { params: { limit: 100 } }),
        api.get("/revenue-cycle/payer-reconciliations", { params: { limit: 100 } }),
        api.get("/revenue-cycle/captured-charges", { params: { limit: 100 } }),
      ]);
      const labels = ["dashboard", "AR report", "first-pass report", "claims", "denials", "appeals", "leakage flags", "remittances", "reconciliations", "captured charges"];
      setSourceErrors(results.flatMap((result, index) => result.status === "rejected" ? [`${labels[index]}${result.reason?.response?.status ? ` (${result.reason.response.status})` : ""}`] : []));
      const valueAt = (index: number) => results[index].status === "fulfilled" ? results[index].value : null;
      const dashData = valueAt(0);
      const arData = valueAt(1);
      const firstPassData = valueAt(2);
      const claimsData = valueAt(3);
      setDashboard(unwrap(dashData) || null);
      setArReport(unwrap(arData) || null);
      setFirstPass(unwrap(firstPassData) || null);
      const nextClaims = rowsFrom(claimsData);
      setClaims(nextClaims);
      setSelected((current: any | null) =>
        current ? unwrap(arData)?.items?.find((item: any) => item.id === current.id) || current : current,
      );
      setOperational({
        denials: rowsFrom(valueAt(4)),
        appeals: rowsFrom(valueAt(5)),
        leakage: rowsFrom(valueAt(6)),
        remittances: rowsFrom(valueAt(7)),
        reconciliations: rowsFrom(valueAt(8)),
        charges: rowsFrom(valueAt(9)),
      });
    } catch (error: any) {
      showNotice(String(error?.response?.data?.message || error?.message || "Revenue cycle data could not be loaded."), "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [payer]);
  useLiveRefresh(loadData, { intervalMs: 60000 });

  const payerOptions = useMemo(() => {
    const names = new Set<string>();
    (arReport?.payers || []).forEach((row: any) => names.add(String(row.payerName || "").trim()));
    (firstPass?.providerBreakdown || []).forEach((row: any) => names.add(String(row.payerName || "").trim()));
    return Array.from(names).filter(Boolean).sort();
  }, [arReport, firstPass]);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (arReport?.items || []).filter((item: any) => {
      const matchesSearch =
        !q ||
        [item.reference, item.payerName, item.patient, item.status, item.type]
          .join(" ")
          .toLowerCase()
          .includes(q);
      const matchesBucket =
        bucket === "ALL" ||
        (bucket === "CURRENT" && item.ageDays <= 30) ||
        (bucket === "31_60" && item.ageDays > 30 && item.ageDays <= 60) ||
        (bucket === "61_90" && item.ageDays > 60 && item.ageDays <= 90) ||
        (bucket === "OVER_90" && item.ageDays > 90);
      return matchesSearch && matchesBucket;
    });
  }, [arReport, search, bucket]);

  const filteredPayers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (arReport?.payers || []).filter((row: any) => {
      const matchesSearch = !q || String(row.payerName || "").toLowerCase().includes(q);
      const matchesBucket =
        bucket === "ALL" ||
        (bucket === "CURRENT" && Number(row.current || 0) > 0) ||
        (bucket === "31_60" && Number(row.days31To60 || 0) > 0) ||
        (bucket === "61_90" && Number(row.days61To90 || 0) > 0) ||
        (bucket === "OVER_90" && Number(row.over90 || 0) > 0);
      return matchesSearch && matchesBucket;
    });
  }, [arReport, search, bucket]);

  const filteredClaims = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return claims;
    return claims.filter((claim) =>
      [claim.claimNumber, claim.payerName, claim.patientId, claim.claimStatus]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [claims, search]);

  const stats = [
    { label: "Total AR", value: money(arReport?.totals?.total), color: "#1e40af", icon: <BarChart3 size={20} /> },
    { label: "0-30 Days", value: money(arReport?.totals?.current), color: "#16a34a", icon: <CheckCircle2 size={20} /> },
    { label: "31-60 Days", value: money(arReport?.totals?.days31To60), color: "#d97706", icon: <CalendarClock size={20} /> },
    { label: "61-90 Days", value: money(arReport?.totals?.days61To90), color: "#ea580c", icon: <AlertTriangle size={20} /> },
    { label: "Over 90 Days", value: money(arReport?.totals?.over90), color: "#dc2626", icon: <AlertTriangle size={20} /> },
    { label: "First Pass Rate", value: percent(firstPass?.firstPassRate), color: firstPass?.belowTarget ? "#dc2626" : "#059669", icon: <ShieldCheck size={20} /> },
    { label: "Open Appeals", value: dashboard?.openAppeals || 0, color: "#7c3aed", icon: <FileSearch size={20} /> },
    { label: "Denials", value: dashboard?.totalDenials || operational.denials.length, color: "#b91c1c", icon: <AlertTriangle size={20} /> },
    { label: "Unbilled Charges", value: dashboard?.capturedUnclaimed || operational.charges.filter((row: any) => ["CAPTURED", "PENDING_REVIEW"].includes(String(row.chargeStatus || "").toUpperCase())).length, color: "#d97706", icon: <BarChart3 size={20} /> },
  ];

  const openFollowup = (row?: any) => {
    const target = row || selected || filteredPayers[0] || filteredItems[0] || null;
    if (!target) {
      showNotice("No outstanding AR item is available for follow-up.", "warning");
      return;
    }
    setSelected(target);
    setActionForm(emptyActionForm);
    setModal("followup");
  };

  const openDenialAction = (row?: any) => {
    const target = row || selected || firstPass?.denialCauses?.[0] || null;
    if (!target) {
      showNotice("No denial pattern is available for correction yet.", "warning");
      return;
    }
    setSelected(target);
    setActionForm(emptyActionForm);
    setModal("denial");
  };

  const saveAction = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      await api.post("/revenue-cycle/metrics", {
        metricDate: new Date().toISOString(),
        metricKey: modal === "followup" ? "days_in_ar_follow_up" : "first_pass_denial_correction",
        metricValue:
          modal === "followup"
            ? Number(selected?.outstandingAmount || selected?.total || 0)
            : Number(selected?.count || firstPass?.reworkedClaims || 0),
        notes: JSON.stringify({
          owner: actionForm.owner,
          dueDate: actionForm.dueDate,
          notes: actionForm.notes,
          target: selected,
        }),
      });
      showNotice(modal === "followup" ? "AR follow-up action saved." : "Denial correction action saved.", "success");
      setModal("");
      setActionForm(emptyActionForm);
      await loadData();
    } catch (error: any) {
      showNotice(String(error?.response?.data?.message || error?.message || "Action could not be saved."), "error");
    } finally {
      setSaving(false);
    }
  };

  const exportRevenueReport = () => {
    const rows: string[][] = [
      ["MEDILINK REVENUE CYCLE REPORT"],
      ["Generated", new Date().toLocaleString()],
      ["Payer filter", payer],
      ["Age filter", bucket],
      ["Search", search || "All"],
      [],
      ["SUMMARY"],
      ["Metric", "Value"],
      ["Total AR", String(arReport?.totals?.total ?? 0)],
      ["Current 0-30", String(arReport?.totals?.current ?? 0)],
      ["31-60", String(arReport?.totals?.days31To60 ?? 0)],
      ["61-90", String(arReport?.totals?.days61To90 ?? 0)],
      ["Over 90", String(arReport?.totals?.over90 ?? 0)],
      ["First-pass rate", percent(firstPass?.firstPassRate)],
      ["Open appeals", String(dashboard?.openAppeals ?? 0)],
      ["Denials", String(dashboard?.totalDenials ?? operational.denials.length)],
      [],
      ["FIRST-PASS BY PAYER"],
      ["Payer", "Submitted", "First-pass approved", "Rate", "Reworked"],
      ...((firstPass?.providerBreakdown || []).map((row: any) => [row.payerName, String(row.totalSubmitted ?? 0), String(row.firstPassApproved ?? 0), percent(row.firstPassRate), String(row.reworkedClaims ?? 0)])),
      [],
      ["REVENUE TREND"],
      ["Date", "Claims", "Billed", "Paid", "Outstanding"],
      ...((dashboard?.trend || []).map((row: any) => [row.date, String(row.claims ?? 0), String(row.billed ?? 0), String(row.paid ?? 0), String(row.outstanding ?? 0)])),
      [],
      ["AGED RECEIVABLES BY PAYER"],
      ["Payer", "0-30", "31-60", "61-90", "Over 90", "Total", "Open items"],
      ...((arReport?.payers || []).map((row: any) => [row.payerName, String(row.current ?? 0), String(row.days31To60 ?? 0), String(row.days61To90 ?? 0), String(row.over90 ?? 0), String(row.total ?? 0), String(row.count ?? 0)])),
      [],
      ["AR ITEMS"],
      ["Reference", "Type", "Payer", "Patient", "Age days", "Outstanding", "Status"],
      ...filteredItems.map((row: any) => [row.reference, row.type, row.payerName, row.patient, String(row.ageDays ?? 0), String(row.outstandingAmount ?? 0), row.status]),
      [],
      ["CLAIMS"],
      ["Claim", "Payer", "Patient", "Status", "Billed", "Paid", "Outstanding"],
      ...filteredClaims.map((row: any) => [row.claimNumber, row.payerName || "Self Pay", row.patientId, row.claimStatus, String(row.totalBilled ?? 0), String(row.totalPaid ?? 0), String(row.outstandingAmount ?? 0)]),
      [],
      ["DENIALS / APPEALS / LEAKAGE / REMITTANCES"],
      ["Category", "Reference", "Status", "Amount", "Details"],
      ...operational.denials.map((row: any) => ["Denial", row.claimId, row.status || "OPEN", String(row.deniedAmount ?? 0), row.denialDetails || row.denialCategory || ""]),
      ...operational.appeals.map((row: any) => ["Appeal", row.claimId, row.appealStatus || "OPEN", String(row.recoveredAmount ?? 0), row.appealNotes || ""]),
      ...operational.leakage.map((row: any) => ["Leakage", row.claimId || row.capturedChargeId, row.status || "OPEN", String(row.amount ?? row.difference ?? 0), row.details || row.flagType || ""]),
      ...operational.remittances.map((row: any) => ["Remittance", row.remittanceNumber, row.status || "RECEIVED", String(row.totalPaidAmount ?? 0), row.payerName || ""]),
    ];
    const csv = rows.map((row) => row.map(csvCell).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `medilink-revenue-cycle-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    showNotice("Full Revenue Cycle report exported successfully.", "success");
  };

  return (
    <main className="rcm-page">
      <header className="rcm-header">
        <div>
          <h1>Revenue Cycle Management</h1>
          <p>Days-in-AR tracking, payer ageing, first-pass claim performance, and denial root-cause analysis.</p>
        </div>
        <div className="rcm-header-actions">
          <button className="rcm-btn ghost" type="button" onClick={() => void loadData()} disabled={loading}>
            <RefreshCw size={17} /> Refresh
          </button>
          <button className="rcm-btn export" type="button" onClick={exportRevenueReport} disabled={loading}>
            <Download size={17} /> Export Report
          </button>
          <button className="rcm-btn primary" type="button" onClick={() => openFollowup(filteredPayers[0] || filteredItems[0])}>
            <Send size={17} /> AR Follow-Up
          </button>
          <button className="rcm-btn purple" type="button" onClick={() => openDenialAction(firstPass?.denialCauses?.[0])}>
            <FileSearch size={17} /> Denial Analysis
          </button>
        </div>
      </header>

      <section className="rcm-stats">
        {stats.map((stat) => (
          <article className="rcm-card" style={{ borderLeftColor: stat.color }} key={stat.label}>
            <div>
              <span>{stat.label}</span>
              <strong>{stat.value}</strong>
            </div>
            <i style={{ color: stat.color }}>{stat.icon}</i>
          </article>
        ))}
      </section>

      {sourceErrors.length ? (
        <section className="rcm-source-warning" role="status">
          <strong>Some Revenue Cycle sources could not be loaded</strong>
          <span>{sourceErrors.join(", ")}. Available reports remain visible; refresh after checking permissions or connectivity.</span>
        </section>
      ) : null}

      <section className="rcm-grid">
        <div className="rcm-left">
          <div className="rcm-filter-panel">
            <label className="rcm-search">
              <Search size={18} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") void loadData();
                }}
                placeholder="Search payer, claim, invoice, patient..."
              />
            </label>
            <select value={payer} onChange={(event) => setPayer(event.target.value)}>
              <option value="ALL">All payers</option>
              {payerOptions.map((name) => (
                <option value={name} key={name}>{name}</option>
              ))}
            </select>
            <select value={bucket} onChange={(event) => setBucket(event.target.value)}>
              <option value="ALL">All ages</option>
              <option value="CURRENT">0-30 days</option>
              <option value="31_60">31-60 days</option>
              <option value="61_90">61-90 days</option>
              <option value="OVER_90">Over 90 days</option>
            </select>
            <button className="rcm-btn run-report" type="button" onClick={() => void loadData()} disabled={loading}>
              <BarChart3 size={16} aria-hidden="true" />
              {loading ? "Running..." : "Run Report"}
            </button>
          </div>

          <section className="rcm-panel">
            <div className="rcm-panel-title">
              <h2>Aged Accounts Receivable by Payer</h2>
              <span>{money(arReport?.totals?.total)} outstanding</span>
            </div>
            <div className="rcm-table-wrap">
              <table className="rcm-table">
                <thead>
                  <tr>
                    <th>Payer</th>
                    <th>0-30</th>
                    <th>31-60</th>
                    <th>61-90</th>
                    <th>Over 90</th>
                    <th>Total</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayers.length ? (
                    filteredPayers.map((row: any) => (
                      <tr key={row.payerName} onClick={() => setSelected(row)}>
                        <td><strong>{row.payerName}</strong><small>{row.count} open item(s)</small></td>
                        <td>{money(row.current)}</td>
                        <td>{money(row.days31To60)}</td>
                        <td>{money(row.days61To90)}</td>
                        <td className={row.over90 > 0 ? "is-danger" : ""}>{money(row.over90)}</td>
                        <td><strong>{money(row.total)}</strong></td>
                        <td>
                          <button className="rcm-mini-btn" type="button" onClick={(event) => { event.stopPropagation(); openFollowup(row); }}>
                            Follow up
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={7} className="rcm-empty">No aged receivables match the filters.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rcm-panel">
            <div className="rcm-panel-title">
              <h2>Outstanding Invoice and Claim Detail</h2>
              <span>{filteredItems.length} visible</span>
            </div>
            <div className="rcm-table-wrap">
              <table className="rcm-table">
                <thead>
                  <tr>
                    <th>Reference</th>
                    <th>Payer</th>
                    <th>Patient</th>
                    <th>Age</th>
                    <th>Outstanding</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.length ? (
                    filteredItems.map((item: any) => (
                      <tr key={`${item.type}-${item.id}`} onClick={() => setSelected(item)}>
                        <td><strong>{item.reference}</strong><small>{item.type}</small></td>
                        <td>{item.payerName}</td>
                        <td>{item.patient}</td>
                        <td className={item.ageDays > 90 ? "is-danger" : item.ageDays > 60 ? "is-warning" : ""}>{item.ageDays} days</td>
                        <td>{money(item.outstandingAmount)}</td>
                        <td><span className="rcm-pill">{item.status}</span></td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={6} className="rcm-empty">No invoices or claims match the filters.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <aside className="rcm-right">
          <section className="rcm-selected">
            <span>Selected Revenue Item</span>
            <h2>{selected?.reference || selected?.payerName || selected?.cause || "No item selected"}</h2>
            <dl>
              <div><dt>Outstanding</dt><dd>{money(selected?.outstandingAmount || selected?.total)}</dd></div>
              <div><dt>Age / Count</dt><dd>{selected?.ageDays ? `${selected.ageDays} days` : selected?.count || "-"}</dd></div>
              <div><dt>Status</dt><dd>{selected?.status || selected?.recommendation || "-"}</dd></div>
            </dl>
          </section>

          <section className="rcm-panel compact">
            <div className="rcm-panel-title">
              <h2>First-Pass Claim Rate</h2>
              <span className={firstPass?.belowTarget ? "rcm-alert" : "rcm-ok"}>Target {percent(firstPass?.targetRate || 85)}</span>
            </div>
            <div className="rcm-first-pass">
              <strong>{percent(firstPass?.firstPassRate)}</strong>
              <p>{firstPass?.firstPassApproved || 0} of {firstPass?.totalSubmitted || 0} claims approved first time.</p>
              <small>{firstPass?.reworkedClaims || 0} claims needed denial correction, appeal, or resubmission.</small>
            </div>
          </section>

          <section className="rcm-panel compact">
            <div className="rcm-panel-title"><h2>Denial Root Causes</h2></div>
            <div className="rcm-cause-list">
              {(firstPass?.denialCauses || []).length ? (
                firstPass.denialCauses.map((cause: any) => (
                  <button type="button" key={cause.cause} onClick={() => { setSelected(cause); openDenialAction(cause); }}>
                    <span><strong>{cause.cause}</strong><small>{cause.recommendation}</small></span>
                    <b>{cause.count}</b>
                  </button>
                ))
              ) : (
                <p>No denial patterns found.</p>
              )}
            </div>
          </section>

          <section className="rcm-panel compact">
            <div className="rcm-panel-title"><h2>Payer First-Pass Breakdown</h2></div>
            <div className="rcm-table-wrap">
              <table className="rcm-table slim">
                <thead>
                  <tr><th>Payer</th><th>Rate</th><th>Rework</th></tr>
                </thead>
                <tbody>
                  {(firstPass?.providerBreakdown || []).length ? (
                    firstPass.providerBreakdown.map((row: any) => (
                      <tr key={row.payerName}>
                        <td>{row.payerName}</td>
                        <td className={row.firstPassRate < 85 ? "is-danger" : ""}>{percent(row.firstPassRate)}</td>
                        <td>{row.reworkedClaims}</td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={3} className="rcm-empty">No submitted claims yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </aside>
      </section>

      <section className="rcm-panel">
        <div className="rcm-panel-title">
          <h2>Recent Claims</h2>
          <span>{claims.length} loaded</span>
        </div>
        <div className="rcm-table-wrap">
          <table className="rcm-table">
            <thead>
              <tr><th>Claim</th><th>Payer</th><th>Status</th><th>Billed</th><th>Paid</th><th>Outstanding</th></tr>
            </thead>
            <tbody>
              {filteredClaims.length ? (
                filteredClaims.map((claim) => (
                  <tr key={claim.id} onClick={() => setSelected(claim)}>
                    <td><strong>{claim.claimNumber}</strong><small>{claim.patientId || "No patient linked"}</small></td>
                    <td>{claim.payerName || "Self Pay"}</td>
                    <td><span className="rcm-pill">{claim.claimStatus}</span></td>
                    <td>{money(claim.totalBilled)}</td>
                    <td>{money(claim.totalPaid)}</td>
                    <td>{money(claim.outstandingAmount)}</td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={6} className="rcm-empty">No claims found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rcm-operational-grid">
        <section className="rcm-panel compact">
          <div className="rcm-panel-title"><h2>Leakage &amp; Unbilled Services</h2><span>{operational.leakage.length} flags</span></div>
          <div className="rcm-queue-list">
            {operational.leakage.length ? operational.leakage.slice(0, 5).map((row: any, index: number) => <button type="button" key={row.id || index} onClick={() => setSelected(row)}><span><strong>{row.flagType || row.sourceModule || "Potential leakage"}</strong><small>{row.details || row.status || "Review captured service"}</small></span><b>{String(row.severity || "MEDIUM")}</b></button>) : <p className="rcm-empty">No leakage flags detected.</p>}
          </div>
        </section>
        <section className="rcm-panel compact">
          <div className="rcm-panel-title"><h2>Denials &amp; Appeals</h2><span>{operational.denials.length} denials · {operational.appeals.length} appeals</span></div>
          <div className="rcm-queue-list">
            {operational.denials.slice(0, 4).map((row: any, index: number) => <button type="button" key={row.id || index} onClick={() => { setSelected(row); openDenialAction(row); }}><span><strong>{row.denialCategory || row.denialReason?.name || "Claim denial"}</strong><small>{row.denialDetails || row.claimId || "Unlinked claim"}</small></span><b>{money(row.deniedAmount)}</b></button>)}
            {!operational.denials.length && !operational.appeals.length ? <p className="rcm-empty">No denials or appeals require action.</p> : null}
            {operational.appeals.slice(0, 2).map((row: any, index: number) => <button type="button" key={`appeal-${row.id || index}`} onClick={() => setSelected(row)}><span><strong>Appeal {row.appealStatus || "OPEN"}</strong><small>{row.claimId || row.claimNumber || "Claim appeal"}</small></span><b>{money(row.recoveredAmount)}</b></button>)}
          </div>
        </section>
        <section className="rcm-panel compact">
          <div className="rcm-panel-title"><h2>Remittance Reconciliation</h2><span>{operational.remittances.length} remittances</span></div>
          <div className="rcm-queue-list">
            {operational.remittances.slice(0, 5).map((row: any, index: number) => <button type="button" key={row.id || index} onClick={() => setSelected(row)}><span><strong>{row.remittanceNumber || row.referenceNumber || "Remittance"}</strong><small>{row.payerName || row.payer || row.status || "Pending reconciliation"}</small></span><b>{money(row.totalPaidAmount ?? row.totalPaid ?? row.amount ?? row.remittanceAmount)}</b></button>)}
            {!operational.remittances.length ? <p className="rcm-empty">No remittances received.</p> : null}
          </div>
        </section>
      </section>

      {notice ? (
        <div className={`rcm-toast ${notice.tone}`} role={notice.tone === "error" ? "alert" : "status"} aria-live={notice.tone === "error" ? "assertive" : "polite"}>
          <span className="rcm-toast-icon" aria-hidden="true">
            {notice.tone === "success" ? <CheckCircle2 size={17} /> : notice.tone === "warning" ? <AlertTriangle size={17} /> : <AlertTriangle size={17} />}
          </span>
          <div className="rcm-toast-copy">
            <strong>Revenue Cycle</strong>
            <span>{notice.text}</span>
          </div>
          <button type="button" aria-label="Dismiss Revenue Cycle notification" onClick={() => setNotice(null)}><X size={16} /></button>
        </div>
      ) : null}

      {modal ? (
        <div className="rcm-modal-backdrop">
          <form className="rcm-modal" onSubmit={saveAction}>
            <div className={`rcm-modal-header ${modal}`}>
              <div>
                <span>{modal === "followup" ? "Days-in-AR" : "First-Pass Rate"}</span>
                <h2>{modal === "followup" ? "Record AR Follow-Up" : "Record Denial Correction"}</h2>
              </div>
              <button type="button" className="rcm-modal-close" onClick={() => setModal("")} aria-label="Close form">
                <X size={18} />
              </button>
            </div>
            <div className="rcm-modal-body">
              <label>
                Owner
                <input value={actionForm.owner} onChange={(event) => setActionForm((form) => ({ ...form, owner: event.target.value }))} required placeholder="Insurance officer or billing lead" />
              </label>
              <label>
                Due date
                <input type="date" value={actionForm.dueDate} onChange={(event) => setActionForm((form) => ({ ...form, dueDate: event.target.value }))} required />
              </label>
              <label className="wide">
                Action notes
                <textarea value={actionForm.notes} onChange={(event) => setActionForm((form) => ({ ...form, notes: event.target.value }))} required placeholder={modal === "followup" ? "Call payer, escalate over-90 balance, attach remittance trail..." : "Correct coding, attach missing documents, confirm pre-authorisation controls..."} />
              </label>
            </div>
            <div className="rcm-modal-footer">
              <button type="button" className="rcm-btn ghost" onClick={() => setModal("")}>Cancel</button>
              <button type="submit" className={modal === "followup" ? "rcm-btn primary" : "rcm-btn purple"} disabled={saving}>
                {saving ? "Saving..." : "Save Action"}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {loading ? <div className="rcm-loading">Loading revenue cycle reports...</div> : null}
    </main>
  );
}
