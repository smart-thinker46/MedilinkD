// Ported from Medilink-Frontend/src/app/finance/journals/page.tsx for desktop parity.
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "../lib/navigation";
import { ArrowLeft } from "lucide-react";
import { SimpleModulePlaceholder } from "../components/layout/SimpleModulePlaceholder";
import { ModuleIcon } from "../components/layout/ModuleIcon";
import { api } from "../lib/api";

export default function FinanceJournalsView() {
  const router = useRouter();
  const [journals, setJournals] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [profitLoss, setProfitLoss] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [addModal, setAddModal] = useState(false);
  const [posting, setPosting] = useState(false);
  const [journalForm, setJournalForm] = useState({
    description: "",
    amount: "",
    debitAccountCode: "",
    creditAccountCode: ""
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [jRes, accRes, pnlRes] = await Promise.all([
        api.get("/finance-accounting/journals"),
        api.get("/finance-accounting/accounts"),
        api.get("/finance-accounting/statements/profit-loss")
      ]);
      setJournals(jRes.data || []);
      setAccounts(accRes.data || []);
      setProfitLoss(pnlRes.data || null);
    } catch (err) {
      console.error("Failed to load journals data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handlePostJournal = async (e: React.FormEvent) => {
    e.preventDefault();
    setPosting(true);
    try {
      await api.post("/finance-accounting/journals", {
        description: journalForm.description,
        amount: Number(journalForm.amount),
        debitAccountCode: journalForm.debitAccountCode,
        creditAccountCode: journalForm.creditAccountCode
      });
      alert("Journal entry posted successfully!");
      setAddModal(false);
      setJournalForm({ description: "", amount: "", debitAccountCode: "", creditAccountCode: "" });
      loadData();
    } catch (err: any) {
      alert(`Posting Failed: ${err.response?.data?.message || err.message}`);
    } finally {
      setPosting(false);
    }
  };

  const filteredJournals = useMemo(() => {
    if (!search) return journals;
    const q = search.toLowerCase();
    return journals.filter((j: any) => 
      j.journalNumber?.toLowerCase().includes(q) ||
      j.description?.toLowerCase().includes(q)
    );
  }, [journals, search]);

  const tableRows = filteredJournals.map((row: any) => {
    // Determine main accounts involved
    const debits = row.lines?.filter((l: any) => l.lineType === 'DEBIT').map((l: any) => l.accountCode).join(', ');
    const credits = row.lines?.filter((l: any) => l.lineType === 'CREDIT').map((l: any) => l.accountCode).join(', ');

    return {
      id: row.journalId,
      journalNumber: <span className="font-mono text-slate-700">{row.journalNumber}</span>,
      date: new Date(row.journalDate || row.postedAt).toLocaleDateString(),
      description: row.description,
      debits: <span className="text-sm font-medium text-green-700">{debits || "-"}</span>,
      credits: <span className="text-sm font-medium text-red-700">{credits || "-"}</span>,
      total: `Ksh ${row.debitTotal?.toLocaleString() || 0}`,
      status: (
        <span className={`px-2 py-1 rounded text-xs font-bold bg-blue-100 text-blue-700`}>
          {row.status || "POSTED"}
        </span>
      ),
    };
  });

  return (
    <>
      <SimpleModulePlaceholder
        title="Journal Entries & Statements"
        subtitle="Manage double-entry bookkeeping and view financial statements"
        icon={<ModuleIcon name="receipt_long" />}
        stats={[
          { label: "Net Profit / Loss", value: `Ksh ${profitLoss?.totals?.netIncome?.toLocaleString() || 0}`, color: (profitLoss?.totals?.netIncome >= 0) ? "#16a34a" : "#dc2626" },
          { label: "Total Revenue", value: `Ksh ${profitLoss?.totals?.revenue?.toLocaleString() || 0}`, color: "#1e3a8a" },
          { label: "Total Expenses", value: `Ksh ${profitLoss?.totals?.expenses?.toLocaleString() || 0}`, color: "#f59e0b" },
        ]}
        columns={[
          { label: "Journal No.", key: "journalNumber" },
          { label: "Date", key: "date" },
          { label: "Description", key: "description" },
          { label: "Debits", key: "debits" },
          { label: "Credits", key: "credits" },
          { label: "Amount", key: "total", className: "font-bold" },
          { label: "Status", key: "status" },
        ]}
        rows={tableRows}
        searchPlaceholder="Search journals by number or description..."
        searchKeys={["journalNumber", "description"]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => router.push('/finance')}
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-200 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              type="button"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Accounts
            </button>
            <button
              onClick={() => setAddModal(true)}
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              style={{ backgroundColor: "#7c3aed" }}
              type="button"
            >
              <ModuleIcon name="post_add" /> Post Journal Entry
            </button>
          </div>
        }
      />

      {addModal && (
        <div className="module-form-overlay" onClick={() => setAddModal(false)}>
          <form onSubmit={handlePostJournal} className="module-form-panel modal-panel" onClick={(e) => e.stopPropagation()}>
            <div className="module-form-header">
              <div className="module-form-heading">
                <div className="module-form-icon"><ModuleIcon name="post_add" /></div>
                <div>
                  <div className="module-form-kicker">Finance & Accounting</div>
                  <h2 className="module-form-title">Post Journal Entry</h2>
                  <p className="module-form-desc">Create a new balanced journal entry (Debit = Credit).</p>
                </div>
              </div>
              <button type="button" className="modal-close-btn" onClick={() => setAddModal(false)}>x</button>
            </div>
            <div className="module-form-body">
              <div className="module-form-grid">
                <div className="module-form-field is-wide">
                  <label className="form-label">Description / Narration</label>
                  <input required type="text" className="module-form-input"
                    value={journalForm.description} onChange={(e) => setJournalForm({...journalForm, description: e.target.value})} 
                    placeholder="e.g. Paid electricity bill for January" />
                </div>
                <div className="module-form-field is-wide">
                  <label className="form-label">Amount (Ksh)</label>
                  <input required type="number" min="1" className="module-form-input" 
                    value={journalForm.amount} onChange={(e) => setJournalForm({...journalForm, amount: e.target.value})} />
                </div>
                <div className="module-form-field">
                  <label className="form-label text-green-700">Debit Account</label>
                  <select required className="module-form-input"
                    value={journalForm.debitAccountCode} onChange={(e) => setJournalForm({...journalForm, debitAccountCode: e.target.value})}>
                    <option value="">Select Account...</option>
                    {accounts.map(a => (
                      <option key={a.id} value={a.accountCode}>{a.accountName} ({a.accountCode})</option>
                    ))}
                  </select>
                </div>
                <div className="module-form-field">
                  <label className="form-label text-red-700">Credit Account</label>
                  <select required className="module-form-input"
                    value={journalForm.creditAccountCode} onChange={(e) => setJournalForm({...journalForm, creditAccountCode: e.target.value})}>
                    <option value="">Select Account...</option>
                    {accounts.map(a => (
                      <option key={a.id} value={a.accountCode}>{a.accountName} ({a.accountCode})</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="module-form-footer">
                <button type="button" className="form-btn form-btn-cancel" onClick={() => setAddModal(false)}>Cancel</button>
                <button type="submit" disabled={posting || !journalForm.debitAccountCode || !journalForm.creditAccountCode} className="form-btn form-btn-primary module-form-submit">{posting ? "Posting..." : "Post Entry"}</button>
              </div>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
