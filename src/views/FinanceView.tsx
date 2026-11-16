
import { useEffect, useState, useMemo } from "react";
const useRouter = () => ({ push: (path: string) => window.dispatchEvent(new CustomEvent("hmis:navigate", { detail: { path } })) });
import { SimpleModulePlaceholder } from "../components/layout/SimpleModulePlaceholder";
import { ModuleIcon } from "../components/layout/ModuleIcon";
import { api } from "../lib/api";

export default function FinanceView() {
  const router = useRouter();
  const [dashboard, setDashboard] = useState<any>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [addModal, setAddModal] = useState(false);
  const [adding, setAdding] = useState(false);
  const [accountForm, setAccountForm] = useState({
    accountCode: "",
    accountName: "",
    accountType: "REVENUE",
    costCenter: ""
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [dashRes, accRes] = await Promise.all([
        api.get("/finance-accounting/dashboard"),
        api.get("/finance-accounting/accounts")
      ]);
      setDashboard(dashRes.data);
      setAccounts(accRes.data || []);
    } catch (err) {
      console.error("Failed to load finance data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    try {
      await api.post("/finance-accounting/accounts", accountForm);
      alert("Account created successfully!");
      setAddModal(false);
      setAccountForm({ accountCode: "", accountName: "", accountType: "REVENUE", costCenter: "" });
      loadData();
    } catch (err: any) {
      alert(`Account Creation Failed: ${err.response?.data?.message || err.message}`);
    } finally {
      setAdding(false);
    }
  };

  const filteredAccounts = useMemo(() => {
    if (!search) return accounts;
    const q = search.toLowerCase();
    return accounts.filter((a: any) => 
      a.accountName?.toLowerCase().includes(q) ||
      a.accountCode?.toLowerCase().includes(q) ||
      a.accountType?.toLowerCase().includes(q)
    );
  }, [accounts, search]);

  const tableRows = filteredAccounts.map((row: any) => ({
    id: row.id,
    code: <span className="font-mono font-medium text-slate-700">{row.accountCode}</span>,
    name: row.accountName,
    type: (
      <span className={`px-2 py-1 rounded text-xs font-bold ${
        row.accountType === 'REVENUE' ? 'bg-green-100 text-green-700' :
        row.accountType === 'EXPENSE' ? 'bg-red-100 text-red-700' :
        row.accountType === 'ASSET' ? 'bg-blue-100 text-blue-700' :
        row.accountType === 'LIABILITY' ? 'bg-orange-100 text-orange-700' :
        'bg-purple-100 text-purple-700'
      }`}>
        {row.accountType}
      </span>
    ),
    costCenter: row.costCenter || "-",
    status: row.isActive ? (
       <span className="text-green-600 font-medium text-sm">Active</span>
    ) : (
       <span className="text-red-600 font-medium text-sm">Inactive</span>
    )
  }));

  // Assuming dashboard has some basic metrics, if not we fall back gracefully
  const revenue = dashboard?.revenueTotal || 0;
  const expense = dashboard?.expenseTotal || 0;
  const netIncome = revenue - expense;

  return (
    <>
      <SimpleModulePlaceholder
        title="Finance & Accounting"
        subtitle="General ledger, Chart of Accounts, and hospital financial health"
        icon={<ModuleIcon name="account_balance" />}
        stats={[
          { label: "Total Revenue", value: `Ksh ${revenue.toLocaleString()}`, color: "#16a34a" },
          { label: "Total Expenses", value: `Ksh ${expense.toLocaleString()}`, color: "#dc2626" },
          { label: "Net Income", value: `Ksh ${netIncome.toLocaleString()}`, color: netIncome >= 0 ? "#1e3a8a" : "#dc2626" },
        ]}
        columns={[
          { label: "Account Code", key: "code" },
          { label: "Account Name", key: "name", className: "font-bold" },
          { label: "Type", key: "type" },
          { label: "Cost Center", key: "costCenter" },
          { label: "Status", key: "status" },
        ]}
        rows={tableRows}
        searchPlaceholder="Search accounts by name or code..."
        searchKeys={["name", "code"]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => router.push('/finance/journals')}
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-200 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              type="button"
            >
              <ModuleIcon name="receipt_long" /> Journal Entries
            </button>
            <button
              onClick={() => setAddModal(true)}
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              style={{ backgroundColor: "#0284c7" }}
              type="button"
            >
              <ModuleIcon name="add_box" /> Add Account
            </button>
          </div>
        }
      />

      {addModal && (
        <div className="module-form-overlay" onClick={() => setAddModal(false)}>
          <form onSubmit={handleAddAccount} className="module-form-panel modal-panel" onClick={(e) => e.stopPropagation()}>
            <div className="module-form-header">
              <div className="module-form-heading">
                <div className="module-form-icon"><ModuleIcon name="account_balance" /></div>
                <div>
                  <div className="module-form-kicker">Finance & Accounting</div>
                  <h2 className="module-form-title">New Ledger Account</h2>
                  <p className="module-form-desc">Add a new account to the Chart of Accounts.</p>
                </div>
              </div>
              <button type="button" className="modal-close-btn" onClick={() => setAddModal(false)}>x</button>
            </div>
            <div className="module-form-body">
              <div className="module-form-grid">
                <div className="module-form-field">
                  <label className="form-label">Account Code</label>
                  <input required type="text" className="module-form-input uppercase"
                    value={accountForm.accountCode} onChange={(e) => setAccountForm({...accountForm, accountCode: e.target.value.toUpperCase()})} 
                    placeholder="e.g. 4000" />
                </div>
                <div className="module-form-field">
                  <label className="form-label">Account Type</label>
                  <select required className="module-form-input"
                    value={accountForm.accountType} onChange={(e) => setAccountForm({...accountForm, accountType: e.target.value})}>
                    <option value="REVENUE">Revenue</option>
                    <option value="EXPENSE">Expense</option>
                    <option value="ASSET">Asset</option>
                    <option value="LIABILITY">Liability</option>
                    <option value="EQUITY">Equity</option>
                  </select>
                </div>
                <div className="module-form-field is-wide">
                  <label className="form-label">Account Name</label>
                  <input required type="text" className="module-form-input" 
                    value={accountForm.accountName} onChange={(e) => setAccountForm({...accountForm, accountName: e.target.value})} 
                    placeholder="e.g. Outpatient Consultation Fees" />
                </div>
                <div className="module-form-field is-wide">
                  <label className="form-label">Cost Center (Optional)</label>
                  <input type="text" className="module-form-input" 
                    value={accountForm.costCenter} onChange={(e) => setAccountForm({...accountForm, costCenter: e.target.value})} 
                    placeholder="e.g. OPD" />
                </div>
              </div>
              <div className="module-form-footer">
                <button type="button" className="form-btn form-btn-cancel" onClick={() => setAddModal(false)}>Cancel</button>
                <button type="submit" disabled={adding} className="form-btn form-btn-primary module-form-submit">{adding ? "Saving..." : "Create Account"}</button>
              </div>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
