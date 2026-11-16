// Ported from Medilink-Frontend/src/app/hr/payroll/page.tsx for desktop parity.
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "../lib/navigation";
import { ArrowLeft } from "lucide-react";
import { SimpleModulePlaceholder } from "../components/layout/SimpleModulePlaceholder";
import { ModuleIcon } from "../components/layout/ModuleIcon";
import { api } from "../lib/api";
import { useLiveRefresh } from "../lib/liveRefresh";

const unwrapRows = (value: any): any[] => {
  const data = value?.data ?? value;
  if (Array.isArray(data)) return data;
  for (const candidate of [data?.items, data?.rows, data?.results, data?.data]) {
    if (Array.isArray(candidate)) return candidate;
  }
  return [];
};

export default function PayrollView() {
  const router = useRouter();
  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [payments, setPayments] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [generateModal, setGenerateModal] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [formData, setFormData] = useState({
    staffId: "",
    month: new Date().toLocaleString('default', { month: 'long' }),
    year: new Date().getFullYear().toString(),
    basicSalary: "",
    allowances: "0",
    deductions: "0",
    overtimePay: "0",
    performanceBonus: "0",
    pension: "0",
    insurance: "0",
    loanDeduction: "0",
    nhif: "0",
    tax: "0"
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [payrollRes, staffRes, paymentRes] = await Promise.allSettled([api.get("/hr/payrolls"), api.get("/staff"), api.get("/hr/payroll/payments")]);
      if (payrollRes.status === "fulfilled") setPayrolls(unwrapRows(payrollRes.value.data));
      if (staffRes.status === "fulfilled") setStaff(unwrapRows(staffRes.value.data));
      if (paymentRes.status === "fulfilled") setPayments(Object.fromEntries(unwrapRows(paymentRes.value.data).map((row: any) => [row.payrollId, row])));
    } catch (err) {
      console.error("Failed to load payroll data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useLiveRefresh(() => loadData(), { intervalMs: 60000 });

  const updatePayment = async (payrollId: string, status: string) => {
    try {
      await api.post(`/hr/payroll/${payrollId}/payment`, { status });
      await loadData();
    } catch (err: any) {
      alert(`Payment update failed: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    try {
      await api.post("/hr/payroll/generate", {
        ...formData,
        year: Number(formData.year),
        basicSalary: Number(formData.basicSalary),
        allowances: Number(formData.allowances),
        deductions: Number(formData.deductions),
        overtimePay: Number(formData.overtimePay),
        performanceBonus: Number(formData.performanceBonus),
        pension: Number(formData.pension),
        insurance: Number(formData.insurance),
        loanDeduction: Number(formData.loanDeduction),
        nhif: Number(formData.nhif),
        tax: Number(formData.tax)
      });
      alert("Payroll generated successfully!");
      setGenerateModal(false);
      setFormData({ ...formData, staffId: "", basicSalary: "" });
      loadData();
    } catch (err: any) {
      alert(`Generation Failed: ${err.response?.data?.message || err.message}`);
    } finally {
      setGenerating(false);
    }
  };

  const filteredPayrolls = useMemo(() => {
    if (!search) return payrolls;
    const q = search.toLowerCase();
    return payrolls.filter((p: any) => 
      p.staffId?.toLowerCase().includes(q) ||
      p.staff?.firstName?.toLowerCase().includes(q) ||
      p.staff?.lastName?.toLowerCase().includes(q)
    );
  }, [payrolls, search]);

  const tableRows = filteredPayrolls.map((row: any) => {
    const paymentStatus = payments[row.id]?.status || "PAYMENT_PENDING";
    const nextPaymentStatus = paymentStatus === "PAYMENT_SUBMITTED" ? "PAYMENT_CONFIRMED" : "PAYMENT_SUBMITTED";
    const paymentActionLabel = paymentStatus === "PAYMENT_SUBMITTED" ? "Confirm payment" : "Submit payment";
    return ({
    id: row.id,
    staff: `${row.staff?.firstName || ''} ${row.staff?.lastName || ''} (${row.staffId})`,
    period: `${row.month} ${row.year}`,
    basic: `Ksh ${row.basicSalary?.toLocaleString()}`,
    allowances: `Ksh ${row.allowances?.toLocaleString()}`,
    deductions: `Ksh ${row.deductions?.toLocaleString()}`,
    netPay: <span className="font-bold text-green-700">Ksh {row.netPay?.toLocaleString()}</span>,
    status: <div className="flex items-center gap-2"><span className="px-2 py-1 rounded text-xs font-bold bg-purple-100 text-purple-700">{paymentStatus}</span>{paymentStatus !== "PAYMENT_CONFIRMED" ? <button type="button" className="px-2 py-1 rounded text-xs font-bold bg-teal-700 text-white" onClick={(event) => { event.stopPropagation(); void updatePayment(row.id, nextPaymentStatus); }}>{paymentActionLabel}</button> : null}</div>
    });
  });

  const totalPayrollCost = payrolls.reduce((sum, p) => sum + Number(p.netPay || 0), 0);

  return (
    <>
      <SimpleModulePlaceholder
        className="payroll-module"
        title="Payroll & Compensation"
        subtitle="Manage salary disbursements, allowances, and statutory deductions"
        captureActions={false}
        icon={<ModuleIcon name="payments" />}
        stats={[
          { label: "Total Disbursed", value: `Ksh ${totalPayrollCost.toLocaleString()}`, color: "#16a34a" },
          { label: "Payslips Generated", value: payrolls.length, color: "#7c3aed" },
        ]}
        columns={[
          { label: "Staff", key: "staff", className: "font-bold" },
          { label: "Period", key: "period" },
          { label: "Basic Salary", key: "basic" },
          { label: "Allowances", key: "allowances" },
          { label: "Deductions", key: "deductions" },
          { label: "Net Pay", key: "netPay" },
          { label: "Status", key: "status" },
        ]}
        rows={tableRows}
        searchPlaceholder="Search payroll by Staff Name or ID..."
        searchKeys={["staff"]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => router.push('/hr')}
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-200 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              type="button"
            >
              <ArrowLeft className="w-4 h-4" /> Back to HR
            </button>
            <button
              onClick={() => setGenerateModal(true)}
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              style={{ backgroundColor: "#7c3aed" }}
              type="button"
            >
              <ModuleIcon name="payments" /> Generate Payslip
            </button>
          </div>
        }
      />

      {generateModal && (
        <div className="module-form-overlay payroll-modal-backdrop">
          <form onSubmit={handleGenerate} className="module-form-panel payroll-form">
            <div className="module-form-header payroll-form-header">
              <div>
                <span>Payroll &amp; Compensation</span>
                <h2 className="module-form-title"><ModuleIcon name="payments" /> Generate Payslip</h2>
              </div>
              <button type="button" className="modal-close-btn payroll-form-close" onClick={() => setGenerateModal(false)} aria-label="Close payroll form">×</button>
            </div>
            <div className="module-form-body payroll-form-body">
              <p className="text-sm text-muted-foreground mb-4">
                Calculate and generate a payroll record for a staff member.
              </p>

              <div className="module-form-grid">
                <label className="module-form-field">
                  <span className="form-label">Staff ID</span>
                  <select required className="module-form-input" value={formData.staffId} onChange={(e) => setFormData({...formData, staffId: e.target.value})}>
                    <option value="">Select employee</option>
                    {staff.map((row: any) => <option key={row.id} value={row.id}>{`${row.firstName || ""} ${row.lastName || ""}`.trim() || row.staffNumber || row.id} · {row.staffNumber || row.jobTitle || "Staff"}</option>)}
                  </select>
                </label>
                <label className="module-form-field">
                  <span className="form-label">Basic Salary (Ksh)</span>
                  <input required type="number" min="0" className="module-form-input" value={formData.basicSalary} onChange={(e) => setFormData({...formData, basicSalary: e.target.value})} />
                </label>
                <label className="module-form-field">
                  <span className="form-label">Month</span>
                  <select required className="module-form-input" value={formData.month} onChange={(e) => setFormData({...formData, month: e.target.value})}>
                    {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </label>
                <label className="module-form-field">
                  <span className="form-label">Year</span>
                  <input required type="number" min="2020" className="module-form-input" value={formData.year} onChange={(e) => setFormData({...formData, year: e.target.value})} />
                </label>
                <label className="module-form-field">
                  <span className="form-label text-green-700">Total Allowances (Ksh)</span>
                  <input type="number" className="module-form-input" value={formData.allowances} onChange={(e) => setFormData({...formData, allowances: e.target.value})} />
                </label>
                <label className="module-form-field">
                  <span className="form-label text-red-700">Total Deductions (Ksh)</span>
                  <input type="number" className="module-form-input" value={formData.deductions} onChange={(e) => setFormData({...formData, deductions: e.target.value})} />
                </label>
                <label className="module-form-field">
                  <span className="form-label text-green-700">Approved Overtime (Ksh)</span>
                  <input type="number" min="0" className="module-form-input" value={formData.overtimePay} onChange={(e) => setFormData({...formData, overtimePay: e.target.value})} />
                </label>
                <label className="module-form-field">
                  <span className="form-label text-green-700">Performance Bonus (Ksh)</span>
                  <input type="number" min="0" className="module-form-input" value={formData.performanceBonus} onChange={(e) => setFormData({...formData, performanceBonus: e.target.value})} />
                </label>
                <label className="module-form-field">
                  <span className="form-label text-red-700">Pension (Ksh)</span>
                  <input type="number" min="0" className="module-form-input" value={formData.pension} onChange={(e) => setFormData({...formData, pension: e.target.value})} />
                </label>
                <label className="module-form-field">
                  <span className="form-label text-red-700">Insurance (Ksh)</span>
                  <input type="number" min="0" className="module-form-input" value={formData.insurance} onChange={(e) => setFormData({...formData, insurance: e.target.value})} />
                </label>
                <label className="module-form-field">
                  <span className="form-label text-red-700">Loan repayment (Ksh)</span>
                  <input type="number" min="0" className="module-form-input" value={formData.loanDeduction} onChange={(e) => setFormData({...formData, loanDeduction: e.target.value})} />
                </label>
                <label className="module-form-field">
                  <span className="form-label text-red-700">SHA (Ksh)</span>
                  <input type="number" className="module-form-input" value={formData.nhif} onChange={(e) => setFormData({...formData, nhif: e.target.value})} />
                </label>
                <label className="module-form-field">
                  <span className="form-label text-red-700">PAYE Tax (Ksh)</span>
                  <input type="number" className="module-form-input" value={formData.tax} onChange={(e) => setFormData({...formData, tax: e.target.value})} />
                </label>
              </div>

              <div className="module-form-footer payroll-form-footer">
                <button type="button" onClick={() => setGenerateModal(false)} className="form-btn form-btn-cancel payroll-cancel">Cancel</button>
                <button type="submit" disabled={generating || !formData.staffId} className="form-btn form-btn-primary module-form-submit payroll-submit disabled:opacity-50">{generating ? "Processing..." : "Generate Payslip"}</button>
              </div>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
