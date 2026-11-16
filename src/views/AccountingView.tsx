// Ported from Medilink-Frontend/src/app/accounting/page.tsx for desktop parity.
import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import { SimpleModulePlaceholder } from "../components/layout/SimpleModulePlaceholder";
import { ModuleIcon } from "../components/layout/ModuleIcon";
import { api } from "../lib/api";
import { useLiveRefresh } from "../lib/liveRefresh";

const unwrapRows = (value: any) => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.items)) return value.items;
  return [];
};

const unwrapData = (value: any) => value?.data ?? value ?? {};

const formatKes = (value: number) =>
  new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const percent = (value: number, total: number) =>
  total > 0 ? Math.max(0, Math.min(100, (value / total) * 100)) : 0;

const emptyJournalForm = {
  journalDate: new Date().toISOString().slice(0, 10),
  description: "",
  referenceModule: "BILLING",
  referenceId: "",
  debitAccountCode: "1000",
  debitAccountName: "Cash at Till",
  debitAccountType: "ASSET",
  creditAccountCode: "4000",
  creditAccountName: "Patient Service Revenue",
  creditAccountType: "REVENUE",
  amount: "",
};

const emptyPeriodForm = {
  fromDate: "",
  toDate: "",
  reason: "",
};

const emptyStatementForm = {
  reportType: "PROFIT_LOSS",
  fromDate: "",
  toDate: "",
  boardPack: true,
};

export default function AccountingView() {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [accountType, setAccountType] = useState("ALL");
  const [budgetStatus, setBudgetStatus] = useState("ALL");
  const [journalModule, setJournalModule] = useState("ALL");
  const [accountSearch, setAccountSearch] = useState("");
  const [journalSearch, setJournalSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dashboard, setDashboard] = useState<any | null>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [journals, setJournals] = useState<any[]>([]);
  const [budgets, setBudgets] = useState<any[]>([]);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [trialBalance, setTrialBalance] = useState<any | null>(null);
  const [profitLoss, setProfitLoss] = useState<any | null>(null);
  const [balanceSheet, setBalanceSheet] = useState<any | null>(null);
  const [cashFlow, setCashFlow] = useState<any | null>(null);
  const [modal, setModal] = useState<"journal" | "period" | "statement" | "">("");
  const [journalForm, setJournalForm] = useState(emptyJournalForm);
  const [periodForm, setPeriodForm] = useState(emptyPeriodForm);
  const [statementForm, setStatementForm] = useState(emptyStatementForm);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ tone: "success" | "warning" | "error"; text: string } | null>(null);
  const [sourceErrors, setSourceErrors] = useState<string[]>([]);

  const showNotice = (text: string, tone: "success" | "warning" | "error" = "success") => {
    setNotice({ text, tone });
    window.setTimeout(() => setNotice(null), tone === "success" ? 2600 : 4200);
  };

  const loadAccountingData = async (isMounted = () => true) => {
    const params = {
      ...(fromDate ? { fromDate } : {}),
      ...(toDate ? { toDate } : {}),
    };
    setLoading(true);
    setError("");
    return Promise.allSettled([
      api.get("/finance-accounting/dashboard", { params }),
      api.get("/finance-accounting/accounts", {
        params: {
          ...(accountType !== "ALL" ? { accountType } : {}),
          ...(accountSearch.trim() ? { search: accountSearch.trim() } : {}),
        },
      }),
      api.get("/finance-accounting/journals", {
        params: {
          ...params,
          ...(journalModule !== "ALL" ? { referenceModule: journalModule } : {}),
          ...(journalSearch.trim() ? { search: journalSearch.trim() } : {}),
        },
      }),
      api.get("/finance-accounting/budgets", {
        params: {
          ...(budgetStatus !== "ALL" ? { status: budgetStatus } : {}),
        },
      }),
      api.get("/finance-accounting/bank/accounts"),
      api.get("/finance-accounting/statements/trial-balance", { params }),
      api.get("/finance-accounting/statements/profit-loss", { params }),
      api.get("/finance-accounting/statements/balance-sheet", { params }),
      api.get("/finance-accounting/statements/cash-flow", { params }),
    ])
      .then((results) => {
        if (!isMounted()) return;
        const [
          dashboardRes,
          accountsRes,
          journalsRes,
          budgetsRes,
          bankAccountsRes,
          trialBalanceRes,
          profitLossRes,
          balanceSheetRes,
          cashFlowRes,
        ] = results;

        if (dashboardRes.status === "fulfilled") setDashboard(unwrapData(dashboardRes.value.data));
        if (accountsRes.status === "fulfilled") setAccounts(unwrapRows(accountsRes.value.data));
        if (journalsRes.status === "fulfilled") setJournals(unwrapRows(journalsRes.value.data));
        if (budgetsRes.status === "fulfilled") setBudgets(unwrapRows(budgetsRes.value.data));
        if (bankAccountsRes.status === "fulfilled") setBankAccounts(unwrapRows(bankAccountsRes.value.data));
        if (trialBalanceRes.status === "fulfilled") setTrialBalance(unwrapData(trialBalanceRes.value.data));
        if (profitLossRes.status === "fulfilled") setProfitLoss(unwrapData(profitLossRes.value.data));
        if (balanceSheetRes.status === "fulfilled") setBalanceSheet(unwrapData(balanceSheetRes.value.data));
        if (cashFlowRes.status === "fulfilled") setCashFlow(unwrapData(cashFlowRes.value.data));

        const labels = ["dashboard", "chart of accounts", "journals", "budgets", "bank accounts", "trial balance", "profit & loss", "balance sheet", "cash flow"];
        const failures = results
          .map((result: any, index) => result.status === "rejected" ? `${labels[index]}${result.reason?.response?.status ? ` (${result.reason.response.status})` : ""}` : "")
          .filter(Boolean);
        setSourceErrors(failures);
        setError(failures.length === results.length ? "Financial Accounting data could not be loaded." : "");
      })
      .finally(() => {
        if (isMounted()) setLoading(false);
      });
  };

  useEffect(() => {
    let mounted = true;
    void loadAccountingData(() => mounted);
    return () => {
      mounted = false;
    };
  }, [fromDate, toDate, accountType, budgetStatus, journalModule, accountSearch, journalSearch]);
  useLiveRefresh(() => loadAccountingData(), { intervalMs: 60000 });

  const summary = useMemo(() => {
    const totals = dashboard?.totals || {};
    const dashboardStatements = dashboard?.statements || {};
    const trialTotals = trialBalance?.totals || dashboardStatements?.trialBalance || {};
    const plTotals = profitLoss?.totals || dashboardStatements?.profitLoss || {};
    const bsTotals = balanceSheet?.totals || dashboardStatements?.balanceSheet || {};
    return {
      chartOfAccounts: Number(totals?.chartOfAccounts || accounts.length || 0),
      journalEntries: Number(totals?.journalEntries || journals.length || 0),
      openPayables: Number(totals?.openPayables || 0),
      openReceivables: Number(totals?.openReceivables || 0),
      bankAccounts: Number(totals?.bankAccounts || bankAccounts.length || 0),
      bankNetFlow: Number(totals?.bankNetFlow || 0),
      budgetEnvelope: Number(totals?.budgetEnvelope || budgets.reduce((sum, row) => sum + Number(row?.amount || row?.budgetAmount || 0), 0)),
      trialDebit: Number(trialTotals?.debit || 0),
      trialCredit: Number(trialTotals?.credit || 0),
      revenue: Number(plTotals?.revenue || 0),
      expense: Number(plTotals?.expense || 0),
      netProfit: Number(plTotals?.netProfit || 0),
      assets: Number(bsTotals?.assets || 0),
      liabilities: Number(bsTotals?.liabilities || 0),
      equity: Number(bsTotals?.equity || 0),
      liabilitiesPlusEquity: Number(bsTotals?.liabilitiesPlusEquity || 0),
      cashClosing: Number(cashFlow?.totals?.closingBalance || 0),
      cashNetChange: Number(cashFlow?.totals?.netChange || 0),
    };
  }, [accounts.length, balanceSheet, bankAccounts.length, budgets, cashFlow, dashboard, journals.length, profitLoss, trialBalance]);

  const stats = [
    { label: "COA Accounts", value: summary.chartOfAccounts, color: "#16a34a" },
    { label: "Journal Entries", value: summary.journalEntries, color: "#2563eb" },
    { label: "Open Payables", value: formatKes(summary.openPayables), color: "#f59e0b" },
    { label: "Open Receivables", value: formatKes(summary.openReceivables), color: "#0d9488" },
    { label: "Net Bank Flow", value: formatKes(summary.bankNetFlow), color: "#0891b2" },
    { label: "Budget Envelope", value: formatKes(summary.budgetEnvelope), color: "#475569" },
    { label: "Trial Debit", value: formatKes(summary.trialDebit), color: "#1d4ed8" },
    { label: "Trial Credit", value: formatKes(summary.trialCredit), color: "#4338ca" },
    { label: "Revenue", value: formatKes(summary.revenue), color: "#059669" },
    { label: "Expense", value: formatKes(summary.expense), color: "#dc2626" },
    { label: "Net Profit", value: formatKes(summary.netProfit), color: "#16a34a" },
    { label: "Assets", value: formatKes(summary.assets), color: "#0284c7" },
    { label: "Liabilities", value: formatKes(summary.liabilities), color: "#be123c" },
    { label: "Equity", value: formatKes(summary.equity), color: "#7c3aed" },
    { label: "Liabilities + Equity", value: formatKes(summary.liabilitiesPlusEquity), color: "#0f766e" },
    { label: "Cash Closing", value: formatKes(summary.cashClosing), color: "#0284c7" },
    { label: "Cash Net Change", value: formatKes(summary.cashNetChange), color: "#0891b2" },
  ];

  const rows = accounts.map((row, index) => ({
    code: String(row?.accountCode || row?.code || `ACC-${index + 1}`),
    name: String(row?.accountName || row?.name || "-"),
    type: String(row?.accountType || row?.type || "-"),
    costCenter: String(row?.costCenter || "-"),
    parent: String(row?.parentAccountCode || "-"),
    status: row?.isActive === false ? "INACTIVE" : "ACTIVE",
  }));

  const recentJournals = journals.slice(0, 8);
  const statementCards = [
    { label: "Income Statement", value: formatKes(summary.netProfit), note: `Revenue ${formatKes(summary.revenue)}`, tone: "green" },
    { label: "Balance Sheet", value: formatKes(summary.assets), note: `L + E ${formatKes(summary.liabilitiesPlusEquity)}`, tone: "blue" },
    { label: "Cash Flow", value: formatKes(summary.cashClosing), note: `Net change ${formatKes(summary.cashNetChange)}`, tone: "purple" },
    { label: "Trial Balance", value: formatKes(summary.trialDebit), note: `Credit ${formatKes(summary.trialCredit)}`, tone: summary.trialDebit === summary.trialCredit ? "green" : "red" },
  ];

  const statementMax = Math.max(summary.revenue, summary.expense, Math.abs(summary.netProfit), 1);
  const balanceTotal = Math.max(
    Math.abs(summary.assets) + Math.abs(summary.liabilities) + Math.abs(summary.equity),
    1,
  );
  const liabilitySlice = percent(Math.abs(summary.liabilities), balanceTotal);
  const equitySlice = percent(Math.abs(summary.equity), balanceTotal);
  const assetSlice = percent(Math.abs(summary.assets), balanceTotal);
  const pieGradient = `conic-gradient(#0284c7 0 ${assetSlice}%, #be123c ${assetSlice}% ${
    assetSlice + liabilitySlice
  }%, #7c3aed ${assetSlice + liabilitySlice}% ${assetSlice + liabilitySlice + equitySlice}%, #e2e8f0 ${
    assetSlice + liabilitySlice + equitySlice
  }% 100%)`;

  const submitJournal = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      const amount = Number(journalForm.amount || 0);
      if (!Number.isFinite(amount) || amount <= 0) throw new Error("Journal amount must be greater than zero.");
      await api.post("/finance-accounting/journals", {
        journalDate: journalForm.journalDate,
        description: journalForm.description,
        referenceModule: journalForm.referenceModule,
        referenceId: journalForm.referenceId,
        lines: [
          {
            lineType: "DEBIT",
            accountCode: journalForm.debitAccountCode,
            accountName: journalForm.debitAccountName,
            accountType: journalForm.debitAccountType,
            amount,
            description: journalForm.description,
          },
          {
            lineType: "CREDIT",
            accountCode: journalForm.creditAccountCode,
            accountName: journalForm.creditAccountName,
            accountType: journalForm.creditAccountType,
            amount,
            description: journalForm.description,
          },
        ],
      });
      showNotice("Balanced journal entry posted to the General Ledger.");
      setModal("");
      setJournalForm(emptyJournalForm);
      await loadAccountingData();
    } catch (err: any) {
      showNotice(String(err?.response?.data?.message || err?.message || "Journal entry could not be posted."), "error");
    } finally {
      setSaving(false);
    }
  };

  const submitPeriodClose = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      if (periodForm.fromDate > periodForm.toDate) throw new Error("Period end date must be on or after the start date.");
      await api.post("/finance-accounting/fiscal-period/lock", {
        fromDate: periodForm.fromDate,
        toDate: periodForm.toDate,
        locked: true,
        reason: periodForm.reason || "Monthly period close after finance manager review and reconciliation.",
      });
      showNotice("Accounting period closed. Backdated journals into this period are now blocked.");
      setModal("");
      setPeriodForm(emptyPeriodForm);
      await loadAccountingData();
    } catch (err: any) {
      showNotice(String(err?.response?.data?.message || err?.message || "Period could not be closed."), "error");
    } finally {
      setSaving(false);
    }
  };

  const submitStatement = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      if (statementForm.fromDate && statementForm.toDate && statementForm.fromDate > statementForm.toDate) throw new Error("Statement end date must be on or after the start date.");
      const params = {
        ...(statementForm.fromDate ? { fromDate: statementForm.fromDate } : {}),
        ...(statementForm.toDate ? { toDate: statementForm.toDate } : {}),
      };
      const endpoint =
        statementForm.reportType === "BALANCE_SHEET"
          ? "/finance-accounting/statements/balance-sheet"
          : statementForm.reportType === "CASH_FLOW"
            ? "/finance-accounting/statements/cash-flow"
            : "/finance-accounting/statements/profit-loss";
      await Promise.all([
        api.get(endpoint, { params }),
        api.post("/finance-accounting/reports/queue", {
          reportType: statementForm.reportType,
          fromDate: statementForm.fromDate || fromDate || undefined,
          toDate: statementForm.toDate || toDate || undefined,
          format: statementForm.boardPack ? "BOARD_PACK" : "STANDARD",
          params: {
            presentationReady: statementForm.boardPack,
            includeTrialBalance: true,
            includeComparatives: true,
          },
        }),
      ]);
      showNotice("Financial statement generated and queued for board/auditor pack.");
      setModal("");
      await loadAccountingData();
    } catch (err: any) {
      showNotice(String(err?.response?.data?.message || err?.message || "Statement could not be generated."), "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {error ? <div className="workflow-notice is-error">{error}</div> : null}
      {sourceErrors.length ? <div className="accounting-source-warning" role="status"><strong>Some accounting sources need attention</strong><span>{sourceErrors.join(", ")}. Available ledger data remains visible; refresh after checking permissions or connectivity.</span></div> : null}
      {notice ? (
        <div className={`accounting-toast is-${notice.tone}`}>
          <strong>{notice.tone === "error" ? "Error" : notice.tone === "warning" ? "Attention" : "Success"}</strong>
          <span>{notice.text}</span>
          <button type="button" onClick={() => setNotice(null)}>x</button>
        </div>
      ) : null}
      <SimpleModulePlaceholder
        className="accounting-view"
        title="Financial Accounting"
        subtitle={loading ? "Loading ledger, bank, and statement data..." : "Accounting & GL control center: chart of accounts, journal integrity, AP/AR aging, bank flow, budget envelope, and financial statements."}
        icon={<ModuleIcon name="receipt_long" />}
        filters={
          <div className="module-filter-grid">
            <label className="module-filter-field">
              <span>Date From</span>
              <input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
            </label>
            <label className="module-filter-field">
              <span>Date To</span>
              <input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} />
            </label>
            <label className="module-filter-field">
              <span>Account Type</span>
              <select value={accountType} onChange={(event) => setAccountType(event.target.value)}>
                <option value="ALL">All</option>
                <option value="ASSET">ASSET</option>
                <option value="LIABILITY">LIABILITY</option>
                <option value="EQUITY">EQUITY</option>
                <option value="REVENUE">REVENUE</option>
                <option value="EXPENSE">EXPENSE</option>
              </select>
            </label>
            <label className="module-filter-field">
              <span>Budget Status</span>
              <select value={budgetStatus} onChange={(event) => setBudgetStatus(event.target.value)}>
                <option value="ALL">All</option>
                <option value="DRAFT">DRAFT</option>
                <option value="APPROVED">APPROVED</option>
                <option value="LOCKED">LOCKED</option>
                <option value="CLOSED">CLOSED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </label>
            <label className="module-filter-field is-wide">
              <span>Journal Module</span>
              <input
                value={journalModule === "ALL" ? "" : journalModule}
                onChange={(event) => setJournalModule(event.target.value.trim() ? event.target.value.toUpperCase() : "ALL")}
                placeholder="BILLING, INSURANCE, PROCUREMENT..."
              />
            </label>
            <label className="module-filter-field is-wide">
              <span>Search Accounts</span>
              <input value={accountSearch} onChange={(event) => setAccountSearch(event.target.value)} placeholder="Account code/name/cost center" />
            </label>
            <label className="module-filter-field is-wide">
              <span>Search Journals</span>
              <input value={journalSearch} onChange={(event) => setJournalSearch(event.target.value)} placeholder="Journal number, reference ID, description" />
            </label>
          </div>
        }
        stats={stats}
        columns={[
          { label: "Code", key: "code" },
          { label: "Name", key: "name" },
          { label: "Type", key: "type" },
          { label: "Cost Center", key: "costCenter" },
          { label: "Parent", key: "parent" },
          { label: "Status", key: "status" },
        ]}
        rows={rows}
        showSearch={false}
        afterSearchContent={
          <div className="accounting-module-body">
            <div className="accounting-chart-grid">
              <section className="accounting-chart-card">
                <div>
                  <h3>Statement Snapshot</h3>
                  <p>Revenue, expense, and net profit comparison</p>
                </div>
                <div className="accounting-bar-list">
                  {[
                    { label: "Revenue", value: summary.revenue, color: "#16a34a" },
                    { label: "Expense", value: summary.expense, color: "#dc2626" },
                    { label: "Net Profit", value: summary.netProfit, color: "#2563eb" },
                  ].map((item) => (
                    <div className="accounting-bar-row" key={item.label}>
                      <div className="accounting-bar-meta">
                        <span>{item.label}</span>
                        <strong>{formatKes(item.value)}</strong>
                      </div>
                      <div className="accounting-bar-track">
                        <div
                          className="accounting-bar-fill"
                          style={{
                            width: `${percent(Math.abs(item.value), statementMax)}%`,
                            backgroundColor: item.color,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="accounting-chart-card accounting-pie-card">
                <div>
                  <h3>Balance Sheet Mix</h3>
                  <p>Assets, liabilities, and equity distribution</p>
                </div>
                <div className="accounting-pie-wrap">
                  <div className="accounting-pie" style={{ background: pieGradient }} />
                  <div className="accounting-pie-legend">
                    <span><i style={{ backgroundColor: "#0284c7" }} /> Assets {assetSlice.toFixed(0)}%</span>
                    <span><i style={{ backgroundColor: "#be123c" }} /> Liabilities {liabilitySlice.toFixed(0)}%</span>
                    <span><i style={{ backgroundColor: "#7c3aed" }} /> Equity {equitySlice.toFixed(0)}%</span>
                  </div>
                </div>
              </section>
            </div>

            <div className="accounting-statement-grid">
              {statementCards.map((card) => (
                <article className={`accounting-statement-card is-${card.tone}`} key={card.label}>
                  <span>{card.label}</span>
                  <strong>{card.value}</strong>
                  <small>{card.note}</small>
                </article>
              ))}
            </div>

            <div className="accounting-ops-grid">
              <section className="accounting-data-panel">
                <div className="accounting-panel-title">
                  <div>
                    <h3>Recent General Ledger Journals</h3>
                    <p>Automatic and manual double-entry postings.</p>
                  </div>
                  <button type="button" onClick={() => setModal("journal")}>Post journal</button>
                </div>
                <div className="accounting-table-wrap">
                  <table className="accounting-table">
                    <thead>
                      <tr><th>Journal</th><th>Date</th><th>Source</th><th>Debit</th><th>Credit</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                      {recentJournals.length ? (
                        recentJournals.map((journal, index) => (
                          <tr key={journal?.journalId || journal?.journalNumber || index}>
                            <td><strong>{journal?.journalNumber || `JRN-${index + 1}`}</strong><small>{journal?.description || "-"}</small></td>
                            <td>{String(journal?.journalDate || journal?.postedAt || "").slice(0, 10) || "-"}</td>
                            <td>{journal?.referenceModule || "-"}</td>
                            <td>{formatKes(Number(journal?.debitTotal || 0))}</td>
                            <td>{formatKes(Number(journal?.creditTotal || 0))}</td>
                            <td><span className="accounting-status-pill">{journal?.status || "POSTED"}</span></td>
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan={6} className="accounting-empty">No journal entries found for this filter.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="accounting-data-panel">
                <div className="accounting-panel-title">
                  <div>
                    <h3>Close and Reporting Controls</h3>
                    <p>Period locks, board reports, and audit-ready statements.</p>
                  </div>
                  <button type="button" onClick={() => setModal("statement")}>Generate</button>
                </div>
                <div className="accounting-control-list">
                  <button type="button" onClick={() => setModal("period")}>
                    <strong>Monthly period close</strong>
                    <span>Lock reviewed periods and force adjustments into current period.</span>
                  </button>
                  <button type="button" onClick={() => setModal("statement")}>
                    <strong>Board statement pack</strong>
                    <span>Queue income statement, balance sheet, or cash flow output.</span>
                  </button>
                  <button type="button" onClick={() => void loadAccountingData()} disabled={loading}>
                    <strong>Refresh accounting data</strong>
                    <span>{loading ? "Refreshing ledger..." : "Reload accounts, journals, and statement totals."}</span>
                  </button>
                </div>
              </section>
            </div>
          </div>
        }
        actions={
          <div className="accounting-action-bar">
            <button className="accounting-action-btn is-refresh" type="button" onClick={() => void loadAccountingData()} disabled={loading}>
              <ModuleIcon name="refresh" /> Refresh
            </button>
            <button className="accounting-action-btn is-journal" type="button" onClick={() => setModal("journal")}>
              <ModuleIcon name="description" /> Journal Entry
            </button>
            <button className="accounting-action-btn is-period" type="button" onClick={() => setModal("period")}>
              <ModuleIcon name="lock" /> Close Period
            </button>
            <button className="accounting-action-btn is-statement" type="button" onClick={() => setModal("statement")}>
              <ModuleIcon name="receipt_long" /> Generate Statements
            </button>
          </div>
        }
      />
      {modal === "journal" ? (
        <AccountingModal title="Automatic Journal Entry" tone="journal" onClose={() => setModal("")}>
          <form className="accounting-modal-form" onSubmit={submitJournal}>
            <label><span>Journal date</span><input type="date" value={journalForm.journalDate} onChange={(event) => setJournalForm((form) => ({ ...form, journalDate: event.target.value }))} required /></label>
            <label><span>Source module</span><select value={journalForm.referenceModule} onChange={(event) => setJournalForm((form) => ({ ...form, referenceModule: event.target.value }))}><option>BILLING</option><option>PHARMACY</option><option>INVENTORY</option><option>PAYROLL</option><option>BANK</option><option>MANUAL_ADJUSTMENT</option></select></label>
            <label><span>Reference ID</span><input value={journalForm.referenceId} onChange={(event) => setJournalForm((form) => ({ ...form, referenceId: event.target.value }))} placeholder="Payment, bill, payroll, or inventory ID" /></label>
            <label><span>Amount</span><input type="number" min="1" step="0.01" value={journalForm.amount} onChange={(event) => setJournalForm((form) => ({ ...form, amount: event.target.value }))} required /></label>
            <label><span>Debit account code</span><input value={journalForm.debitAccountCode} onChange={(event) => setJournalForm((form) => ({ ...form, debitAccountCode: event.target.value }))} required /></label>
            <label><span>Debit account name</span><input value={journalForm.debitAccountName} onChange={(event) => setJournalForm((form) => ({ ...form, debitAccountName: event.target.value }))} required /></label>
            <label><span>Debit account type</span><select value={journalForm.debitAccountType} onChange={(event) => setJournalForm((form) => ({ ...form, debitAccountType: event.target.value }))}><option>ASSET</option><option>EXPENSE</option><option>LIABILITY</option><option>EQUITY</option><option>REVENUE</option></select></label>
            <label><span>Credit account code</span><input value={journalForm.creditAccountCode} onChange={(event) => setJournalForm((form) => ({ ...form, creditAccountCode: event.target.value }))} required /></label>
            <label><span>Credit account name</span><input value={journalForm.creditAccountName} onChange={(event) => setJournalForm((form) => ({ ...form, creditAccountName: event.target.value }))} required /></label>
            <label><span>Credit account type</span><select value={journalForm.creditAccountType} onChange={(event) => setJournalForm((form) => ({ ...form, creditAccountType: event.target.value }))}><option>REVENUE</option><option>LIABILITY</option><option>EQUITY</option><option>ASSET</option><option>EXPENSE</option></select></label>
            <label className="is-wide"><span>Description</span><textarea value={journalForm.description} onChange={(event) => setJournalForm((form) => ({ ...form, description: event.target.value }))} required placeholder="Example: Cash receipt split to Lab, Pharmacy, and Theatre revenue accounts." /></label>
            <footer><button type="button" onClick={() => setModal("")}>Cancel</button><button type="submit" disabled={saving}>{saving ? "Posting..." : "Post Journal"}</button></footer>
          </form>
        </AccountingModal>
      ) : null}
      {modal === "period" ? (
        <AccountingModal title="Period Close Management" tone="period" onClose={() => setModal("")}>
          <form className="accounting-modal-form" onSubmit={submitPeriodClose}>
            <label><span>Period from</span><input type="date" value={periodForm.fromDate} onChange={(event) => setPeriodForm((form) => ({ ...form, fromDate: event.target.value }))} required /></label>
            <label><span>Period to</span><input type="date" value={periodForm.toDate} onChange={(event) => setPeriodForm((form) => ({ ...form, toDate: event.target.value }))} required /></label>
            <label className="is-wide"><span>Close reason / review note</span><textarea value={periodForm.reason} onChange={(event) => setPeriodForm((form) => ({ ...form, reason: event.target.value }))} placeholder="Reconciliations reviewed, all journals posted, finance manager approved close." required /></label>
            <div className="accounting-lock-warning">Closed periods are locked. Corrections must be posted as current-period adjusting journals with clear references.</div>
            <footer><button type="button" onClick={() => setModal("")}>Cancel</button><button type="submit" disabled={saving}>{saving ? "Closing..." : "Close Period"}</button></footer>
          </form>
        </AccountingModal>
      ) : null}
      {modal === "statement" ? (
        <AccountingModal title="Financial Statement Generation" tone="statement" onClose={() => setModal("")}>
          <form className="accounting-modal-form" onSubmit={submitStatement}>
            <label><span>Statement type</span><select value={statementForm.reportType} onChange={(event) => setStatementForm((form) => ({ ...form, reportType: event.target.value }))}><option value="PROFIT_LOSS">Income Statement</option><option value="BALANCE_SHEET">Balance Sheet</option><option value="CASH_FLOW">Cash Flow Statement</option></select></label>
            <label><span>From</span><input type="date" value={statementForm.fromDate} onChange={(event) => setStatementForm((form) => ({ ...form, fromDate: event.target.value }))} /></label>
            <label><span>To</span><input type="date" value={statementForm.toDate} onChange={(event) => setStatementForm((form) => ({ ...form, toDate: event.target.value }))} /></label>
            <label className="accounting-check"><input type="checkbox" checked={statementForm.boardPack} onChange={(event) => setStatementForm((form) => ({ ...form, boardPack: event.target.checked }))} /> Board/auditor presentation pack</label>
            <div className="accounting-statement-preview">
              <strong>Current snapshot</strong>
              <span>Revenue {formatKes(summary.revenue)}</span>
              <span>Assets {formatKes(summary.assets)}</span>
              <span>Cash closing {formatKes(summary.cashClosing)}</span>
            </div>
            <footer><button type="button" onClick={() => setModal("")}>Cancel</button><button type="submit" disabled={saving}>{saving ? "Generating..." : "Generate Statement"}</button></footer>
          </form>
        </AccountingModal>
      ) : null}
    </>
  );
}

function AccountingModal({ title, tone, onClose, children }: { title: string; tone: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="accounting-modal-backdrop">
      <section className={`accounting-modal is-${tone}`}>
        <header>
          <div className="accounting-modal-heading">
            <div className="accounting-modal-icon">
              <ModuleIcon name={tone === "journal" ? "description" : tone === "period" ? "lock" : "receipt_long"} />
            </div>
            <div>
              <span>Financial Accounting</span>
              <h2>{title}</h2>
            </div>
          </div>
          <button type="button" className="accounting-modal-close" onClick={onClose} aria-label="Close form">x</button>
        </header>
        {children}
      </section>
    </div>
  );
}
