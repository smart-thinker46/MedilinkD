// Ported from Medilink-Frontend/src/app/portal/page.tsx for desktop parity.
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "../lib/navigation";
import { SimpleModulePlaceholder } from "../components/layout/SimpleModulePlaceholder";
import { ModuleIcon } from "../components/layout/ModuleIcon";
import { api } from "../lib/api";

export default function PortalView() {
  const router = useRouter();
  const [dashboard, setDashboard] = useState<any>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]); // For dropdown
  const [bills, setBills] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [addModal, setAddModal] = useState(false);
  const [requestModal, setRequestModal] = useState(false);
  const [granting, setGranting] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [accountForm, setAccountForm] = useState({
    patientId: "",
    email: "",
    password: "",
    status: "ACTIVE"
  });
  const [requestForm, setRequestForm] = useState({
    patientId: "",
    recordTypes: "LABORATORY,DISCHARGE_SUMMARY",
    dateRange: "",
    purpose: "Patient portal record request",
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [dashRes, accRes, patRes, billRes, requestRes, notificationRes] = await Promise.all([
        api.get("/patient-portal/dashboard"),
        api.get("/patient-portal/accounts"),
        api.get("/patients"),
        api.get("/patient-portal/bills"),
        api.get("/patient-portal/requests"),
        api.get("/patient-portal/notifications"),
      ]);
      setDashboard(dashRes.data);
      setAccounts(accRes.data || []);
      setPatients(patRes.data?.data || patRes.data || []);
      setBills(billRes.data?.data || billRes.data || []);
      setRequests(requestRes.data?.data || requestRes.data || []);
      setNotifications(notificationRes.data?.data || notificationRes.data || []);
    } catch (err) {
      console.error("Failed to load portal data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const refresh = () => void loadData();
    window.addEventListener("hmis:patient-portal-refresh", refresh);
    return () => window.removeEventListener("hmis:patient-portal-refresh", refresh);
  }, []);

  const handleGrantAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    setGranting(true);
    try {
      await api.post("/patient-portal/account", accountForm);
      alert("Portal access granted successfully!");
      setAddModal(false);
      setAccountForm({ patientId: "", email: "", password: "", status: "ACTIVE" });
      loadData();
    } catch (err: any) {
      alert(`Failed to grant access: ${err.response?.data?.message || err.message}`);
    } finally {
      setGranting(false);
    }
  };

  const handleRecordRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setRequesting(true);
    try {
      await api.post("/patient-portal/records/request", {
        ...requestForm,
        recordTypes: requestForm.recordTypes.split(",").map((item) => item.trim()).filter(Boolean),
      });
      alert("Medical-record request submitted for review.");
      setRequestModal(false);
      setRequestForm({ patientId: "", recordTypes: "LABORATORY,DISCHARGE_SUMMARY", dateRange: "", purpose: "Patient portal record request" });
      await loadData();
    } catch (err: any) {
      alert(`Record request failed: ${err.response?.data?.message || err.message}`);
    } finally {
      setRequesting(false);
    }
  };

  const filteredAccounts = useMemo(() => {
    if (!search) return accounts;
    const q = search.toLowerCase();
    return accounts.filter((a: any) => 
      a.patientName?.toLowerCase().includes(q) ||
      a.email?.toLowerCase().includes(q) ||
      a.patientCode?.toLowerCase().includes(q)
    );
  }, [accounts, search]);

  const tableRows = filteredAccounts.map((row: any) => ({
    id: row.id,
    original: row,
    patient: (
      <div>
        <div className="font-bold">{row.patientName}</div>
        <div className="text-xs text-slate-500">{row.patientCode}</div>
      </div>
    ),
    email: row.email,
    lastLogin: row.lastLogin ? new Date(row.lastLogin).toLocaleString() : "Never",
    status: (
      <span className={`px-2 py-1 rounded text-xs font-bold ${
        row.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
        row.status === 'LOCKED' ? 'bg-red-100 text-red-700' :
        'bg-slate-100 text-slate-700'
      }`}>
        {row.status}
      </span>
    ),
    action: (
      <button 
        onClick={() => {
           setAccountForm({ patientId: row.patientId, email: row.email, password: "", status: row.status === 'ACTIVE' ? 'LOCKED' : 'ACTIVE' });
           setAddModal(true);
        }}
        className="px-3 py-1 bg-slate-200 text-slate-700 rounded text-sm hover:bg-slate-300 font-medium"
      >
        Edit Access
      </button>
    )
  }));

  return (
    <>
      <SimpleModulePlaceholder
        title="Patient Portal Administration"
        subtitle="Manage patient access to the self-service web & mobile portal"
        icon={<ModuleIcon name="language" />}
        stats={[
          { label: "Active Portal Accounts", value: dashboard?.totals?.activeAccounts ?? accounts.filter((account: any) => account.status === "ACTIVE").length, color: "#1e3a8a" },
          { label: "Portal Logins (Last 30d)", value: dashboard?.totals?.activeUsers30Days ?? 0, color: "#16a34a" },
          { label: "Portal Appointments", value: dashboard?.totals?.appointments ?? 0, color: "#7c3aed" },
          { label: "Unread Notifications", value: dashboard?.totals?.unreadNotifications ?? notifications.filter((item: any) => String(item.status).toUpperCase() === "UNREAD").length, color: "#d97706" },
          { label: "Outstanding Balance", value: `KES ${Number(dashboard?.totals?.outstanding ?? bills.reduce((sum: number, bill: any) => sum + Number(bill.balance || 0), 0)).toLocaleString()}`, color: "#dc2626" },
          { label: "Pending Requests", value: dashboard?.totals?.pendingRequests ?? requests.filter((item: any) => ["PENDING", "IN_REVIEW", "PENDING_SCAN"].includes(String(item.status).toUpperCase())).length, color: "#0f766e" },
        ]}
        columns={[
          { label: "Patient", key: "patient" },
          { label: "Portal Email", key: "email" },
          { label: "Last Login", key: "lastLogin" },
          { label: "Status", key: "status" },
          { label: "Action", key: "action" },
        ]}
        rows={tableRows}
        searchPlaceholder="Search portal accounts by name, code, or email..."
        searchKeys={["patient", "email"]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => void loadData()}
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              type="button"
            >
              <ModuleIcon name="refresh" /> Refresh
            </button>
            <button
              onClick={() => router.push('/portal/appointments')}
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-200 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              type="button"
            >
              <ModuleIcon name="event" /> Portal Appointments
            </button>
            <button
              onClick={() => setRequestModal(true)}
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              style={{ backgroundColor: "#0f766e" }}
              type="button"
            >
              <ModuleIcon name="description" /> Request Records
            </button>
            <button
              onClick={() => {
                setAccountForm({ patientId: "", email: "", password: "", status: "ACTIVE" });
                setAddModal(true);
              }}
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              style={{ backgroundColor: "#123f56" }}
              type="button"
            >
              <ModuleIcon name="vpn_key" /> Grant Access
            </button>
          </div>
        }
      />

      {addModal && (
        <div className="module-form-overlay" onClick={() => setAddModal(false)}>
          <form onSubmit={handleGrantAccess} className="module-form-panel modal-panel" onClick={(e) => e.stopPropagation()}>
            <div className="module-form-header">
              <div className="module-form-heading">
                <div className="module-form-icon"><ModuleIcon name="vpn_key" /></div>
                <div>
                  <div className="module-form-kicker">Patient Portal</div>
                  <h2 className="module-form-title">Manage Portal Access</h2>
                  <p className="module-form-desc">Grant or update a patient's access to the patient portal.</p>
                </div>
              </div>
              <button type="button" className="modal-close-btn" onClick={() => setAddModal(false)}>x</button>
            </div>
            <div className="module-form-body">
              <div className="module-form-grid">
                <div className="module-form-field is-wide">
                  <label className="form-label">Patient</label>
                  <select required className="module-form-input"
                    value={accountForm.patientId} onChange={(e) => setAccountForm({...accountForm, patientId: e.target.value})}>
                    <option value="">Select Patient...</option>
                    {patients.map((p: any) => (
                      <option key={p.id} value={p.id}>{p.firstName} {p.lastName} ({p.patientCode})</option>
                    ))}
                  </select>
                </div>
                <div className="module-form-field is-wide">
                  <label className="form-label">Portal Email</label>
                  <input required type="email" className="module-form-input" 
                    value={accountForm.email} onChange={(e) => setAccountForm({...accountForm, email: e.target.value})} 
                    placeholder="patient@example.com" />
                </div>
                <div className="module-form-field is-wide">
                  <label className="form-label">Password (Leave blank to keep existing)</label>
                  <input type="password" minLength={6} className="module-form-input" 
                    value={accountForm.password} onChange={(e) => setAccountForm({...accountForm, password: e.target.value})} />
                </div>
                <div className="module-form-field">
                  <label className="form-label">Status</label>
                  <select required className="module-form-input"
                    value={accountForm.status} onChange={(e) => setAccountForm({...accountForm, status: e.target.value})}>
                    <option value="ACTIVE">Active</option>
                    <option value="LOCKED">Locked</option>
                    <option value="SUSPENDED">Suspended</option>
                  </select>
                </div>
              </div>
              <div className="module-form-footer">
                <button type="button" className="form-btn form-btn-cancel" onClick={() => setAddModal(false)}>Cancel</button>
                <button type="submit" disabled={granting} className="form-btn form-btn-primary module-form-submit">{granting ? "Saving..." : "Save Access"}</button>
              </div>
            </div>
          </form>
        </div>
      )}

      {requestModal && (
        <div className="module-form-overlay" onClick={() => setRequestModal(false)}>
          <form onSubmit={handleRecordRequest} className="module-form-panel modal-panel" onClick={(e) => e.stopPropagation()}>
            <div className="module-form-header">
              <div className="module-form-heading">
                <div className="module-form-icon"><ModuleIcon name="description" /></div>
                <div>
                  <div className="module-form-kicker">Patient Portal</div>
                  <h2 className="module-form-title">Request Medical Records</h2>
                  <p className="module-form-desc">Submit a patient record request for identity and Medical Records Officer review.</p>
                </div>
              </div>
              <button type="button" className="modal-close-btn" onClick={() => setRequestModal(false)}>x</button>
            </div>
            <div className="module-form-body">
              <div className="module-form-grid">
                <div className="module-form-field">
                  <label className="form-label">Patient</label>
                  <select required className="module-form-input" value={requestForm.patientId} onChange={(e) => setRequestForm({ ...requestForm, patientId: e.target.value })}>
                    <option value="">Select patient...</option>
                    {patients.map((p: any) => <option key={p.id} value={p.id}>{p.firstName} {p.lastName} ({p.patientCode || p.mrn})</option>)}
                  </select>
                </div>
                <div className="module-form-field">
                  <label className="form-label">Date range</label>
                  <input className="module-form-input" placeholder="e.g. Jan 2025 - Mar 2026" value={requestForm.dateRange} onChange={(e) => setRequestForm({ ...requestForm, dateRange: e.target.value })} />
                </div>
                <div className="module-form-field is-wide">
                  <label className="form-label">Record categories</label>
                  <input required className="module-form-input" value={requestForm.recordTypes} onChange={(e) => setRequestForm({ ...requestForm, recordTypes: e.target.value })} placeholder="LABORATORY, RADIOLOGY, DISCHARGE_SUMMARY" />
                  <small className="mt-1 block text-xs text-slate-500">Separate categories with commas.</small>
                </div>
                <div className="module-form-field is-wide">
                  <label className="form-label">Purpose</label>
                  <textarea required rows={3} className="module-form-input" value={requestForm.purpose} onChange={(e) => setRequestForm({ ...requestForm, purpose: e.target.value })} />
                </div>
              </div>
              <div className="module-form-footer">
                <button type="button" className="form-btn form-btn-cancel" onClick={() => setRequestModal(false)}>Cancel</button>
                <button type="submit" disabled={requesting} className="form-btn form-btn-primary module-form-submit">{requesting ? "Submitting..." : "Submit Request"}</button>
              </div>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
