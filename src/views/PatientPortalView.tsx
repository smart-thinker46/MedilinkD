import { useEffect, useState, useMemo } from "react";
import { ArrowLeft, Calendar, FileText, UserCheck } from "lucide-react";
import { SimpleModulePlaceholder } from "../components/layout/SimpleModulePlaceholder";
import { ModuleIcon } from "../components/layout/ModuleIcon";
import { api } from "../lib/api";

export default function PatientPortalView() {
  const [activeSubTab, setActiveSubTab] = useState<"accounts" | "appointments">("accounts");
  const [dashboard, setDashboard] = useState<any>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [bills, setBills] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [addModal, setAddModal] = useState(false);
  const [requestModal, setRequestModal] = useState(false);
  const [apptModal, setApptModal] = useState(false);
  const [granting, setGranting] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [booking, setBooking] = useState(false);

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
  const [apptForm, setApptForm] = useState({
    patientId: "",
    doctorId: "",
    dateTime: "",
    appointmentType: "PORTAL",
    chiefComplaint: ""
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [dashRes, accRes, patRes, billRes, requestRes, notificationRes, apptRes, docRes] = await Promise.all([
        api.get("/patient-portal/dashboard").catch(() => ({ data: {} })),
        api.get("/patient-portal/accounts").catch(() => ({ data: [] })),
        api.get("/patients").catch(() => ({ data: [] })),
        api.get("/patient-portal/bills").catch(() => ({ data: [] })),
        api.get("/patient-portal/requests").catch(() => ({ data: [] })),
        api.get("/patient-portal/notifications").catch(() => ({ data: [] })),
        api.get("/patient-portal/appointments").catch(() => ({ data: [] })),
        api.get("/hr/staff?role=DOCTOR").catch(() => ({ data: [] }))
      ]);
      setDashboard(dashRes.data || {});
      setAccounts(accRes.data || []);
      setPatients(patRes.data?.data || patRes.data || []);
      setBills(billRes.data?.data || billRes.data || []);
      setRequests(requestRes.data?.data || requestRes.data || []);
      setNotifications(notificationRes.data?.data || notificationRes.data || []);
      setAppointments(apptRes.data || []);
      setDoctors(docRes.data || []);
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

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setBooking(true);
    try {
      await api.post("/patient-portal/appointment", {
        ...apptForm,
        dateTime: new Date(apptForm.dateTime).toISOString()
      });
      alert("Portal appointment booked successfully!");
      setApptModal(false);
      setApptForm({ patientId: "", doctorId: "", dateTime: "", appointmentType: "PORTAL", chiefComplaint: "" });
      loadData();
    } catch (err: any) {
      alert(`Booking Failed: ${err.response?.data?.message || err.message}`);
    } finally {
      setBooking(false);
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

  const accountRows = filteredAccounts.map((row: any) => ({
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

  const filteredAppointments = useMemo(() => {
    if (!search) return appointments;
    const q = search.toLowerCase();
    return appointments.filter((a: any) => 
      a.patientName?.toLowerCase().includes(q) ||
      a.doctorName?.toLowerCase().includes(q)
    );
  }, [appointments, search]);

  const appointmentRows = filteredAppointments.map((row: any) => ({
    id: row.id,
    patient: (
      <div>
        <div className="font-bold">{row.patientName}</div>
        <div className="text-xs text-slate-500">{row.patientCode}</div>
      </div>
    ),
    doctor: row.doctorName || "Unassigned",
    dateTime: new Date(row.dateTime).toLocaleString(),
    status: (
      <span className={`px-2 py-1 rounded text-xs font-bold ${
        row.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-700' :
        row.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' :
        row.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
        'bg-slate-100 text-slate-700'
      }`}>
        {row.status}
      </span>
    ),
    created: new Date(row.createdAt).toLocaleDateString()
  }));

  return (
    <>
      <div className="mb-4 flex items-center justify-between border-b pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveSubTab("accounts")}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition ${
              activeSubTab === "accounts"
                ? "bg-[#123f56] text-white shadow-sm"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <UserCheck className="inline-block w-4 h-4 mr-1.5" /> Portal Accounts & Access
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab("appointments")}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition ${
              activeSubTab === "appointments"
                ? "bg-[#123f56] text-white shadow-sm"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <Calendar className="inline-block w-4 h-4 mr-1.5" /> Portal Appointments ({appointments.length})
          </button>
        </div>
      </div>

      {activeSubTab === "accounts" ? (
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
          rows={accountRows}
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
                onClick={() => setActiveSubTab("appointments")}
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
                <FileText className="w-4 h-4" /> Request Records
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
                <ModuleIcon name="add" /> Grant Portal Access
              </button>
            </div>
          }
        />
      ) : (
        <SimpleModulePlaceholder
          title="Portal Appointments"
          subtitle="Manage appointments booked by patients via the self-service portal"
          icon={<ModuleIcon name="event" />}
          stats={[
            { label: "Total Portal Bookings", value: appointments.length, color: "#1e3a8a" },
            { label: "Upcoming", value: appointments.filter(a => new Date(a.dateTime) > new Date() && a.status !== 'CANCELLED').length, color: "#16a34a" },
          ]}
          columns={[
            { label: "Patient", key: "patient" },
            { label: "Doctor", key: "doctor" },
            { label: "Date & Time", key: "dateTime" },
            { label: "Status", key: "status" },
            { label: "Booked On", key: "created" },
          ]}
          rows={appointmentRows}
          searchPlaceholder="Search by patient or doctor name..."
          searchKeys={["patient", "doctor"]}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setActiveSubTab("accounts")}
                className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-200 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                type="button"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Accounts
              </button>
              <button
                onClick={() => setApptModal(true)}
                className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                style={{ backgroundColor: "#4c1d95" }}
                type="button"
              >
                <ModuleIcon name="add_alert" /> Simulate Booking
              </button>
            </div>
          }
        />
      )}

      {addModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <form onSubmit={handleGrantAccess} className="bg-card p-6 rounded-none border border-border shadow-xl w-full max-w-sm portal-form-shell">
            <h2 className="portal-form-header text-xl font-bold mb-4 -mx-6 -mt-6 px-6 py-4 text-white flex items-center gap-2">
               <ModuleIcon name="language" /> {accountForm.password ? "Edit Access" : "Grant Portal Access"}
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Authorize a registered patient for digital self-service.
            </p>

            <div className="space-y-4">
              <div>
                <label className="form-label">Patient</label>
                <select required className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm mt-1"
                  value={accountForm.patientId} onChange={(e) => setAccountForm({...accountForm, patientId: e.target.value})}>
                  <option value="">Select Patient...</option>
                  {patients.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.firstName} {p.lastName} ({p.patientCode || p.mrn})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">Portal Login Email</label>
                <input required type="email" className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm mt-1" 
                  value={accountForm.email} onChange={(e) => setAccountForm({...accountForm, email: e.target.value})} 
                  placeholder="patient@example.com" />
              </div>

              <div>
                <label className="form-label">Password (Leave blank to keep existing)</label>
                <input type="password" minLength={6} className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm mt-1" 
                  value={accountForm.password} onChange={(e) => setAccountForm({...accountForm, password: e.target.value})} />
              </div>

              <div>
                <label className="form-label">Status</label>
                <select required className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm mt-1"
                  value={accountForm.status} onChange={(e) => setAccountForm({...accountForm, status: e.target.value})}>
                  <option value="ACTIVE">Active</option>
                  <option value="LOCKED">Locked</option>
                  <option value="SUSPENDED">Suspended</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t mt-4">
                <button
                  type="button"
                  onClick={() => setAddModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={granting}
                  className="px-4 py-2 bg-[#123f56] hover:bg-[#0d3447] text-white rounded-none font-medium disabled:opacity-50"
                >
                  {granting ? "Saving..." : "Save Access"}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {requestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <form onSubmit={handleRecordRequest} className="bg-card p-6 rounded-none border border-border shadow-xl w-full max-w-lg">
            <h2 className="portal-form-header text-xl font-bold mb-4 -mx-6 -mt-6 px-6 py-4 text-white flex items-center gap-2">
              <ModuleIcon name="description" /> Request Medical Records
            </h2>
            <p className="text-sm text-muted-foreground mb-4">Submit a patient record request for identity and Medical Records Officer review.</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="form-label">Patient
                <select required className="w-full px-4 py-3 bg-background border border-border rounded-none text-sm mt-1" value={requestForm.patientId} onChange={(e) => setRequestForm({ ...requestForm, patientId: e.target.value })}>
                  <option value="">Select patient...</option>
                  {patients.map((p: any) => <option key={p.id} value={p.id}>{p.firstName} {p.lastName} ({p.patientCode || p.mrn})</option>)}
                </select>
              </label>
              <label className="form-label">Date range
                <input className="w-full px-4 py-3 bg-background border border-border rounded-none text-sm mt-1" placeholder="e.g. Jan 2025 - Mar 2026" value={requestForm.dateRange} onChange={(e) => setRequestForm({ ...requestForm, dateRange: e.target.value })} />
              </label>
              <label className="form-label sm:col-span-2">Record categories
                <input required className="w-full px-4 py-3 bg-background border border-border rounded-none text-sm mt-1" value={requestForm.recordTypes} onChange={(e) => setRequestForm({ ...requestForm, recordTypes: e.target.value })} placeholder="LABORATORY, RADIOLOGY, DISCHARGE_SUMMARY" />
                <small className="mt-1 block text-xs text-slate-500">Separate categories with commas.</small>
              </label>
              <label className="form-label sm:col-span-2">Purpose
                <textarea required rows={3} className="w-full px-4 py-3 bg-background border border-border rounded-none text-sm mt-1" value={requestForm.purpose} onChange={(e) => setRequestForm({ ...requestForm, purpose: e.target.value })} />
              </label>
            </div>
            <div className="flex justify-end gap-3 pt-4 mt-4 border-t border-border">
              <button type="button" onClick={() => setRequestModal(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-none font-medium">Cancel</button>
              <button type="submit" disabled={requesting} className="px-4 py-2 bg-[#0f766e] hover:bg-[#115e59] text-white rounded-none font-medium disabled:opacity-50">{requesting ? "Submitting..." : "Submit Request"}</button>
            </div>
          </form>
        </div>
      )}

      {apptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <form onSubmit={handleBookAppointment} className="bg-card p-6 rounded-none border border-border shadow-xl w-full max-w-sm portal-form-shell">
            <h2 className="portal-form-header text-xl font-bold mb-4 -mx-6 -mt-6 px-6 py-4 text-white flex items-center gap-2">
               <ModuleIcon name="event" /> Simulate Portal Booking
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Test the portal appointment creation flow.
            </p>

            <div className="space-y-4">
              <div>
                <label className="form-label">Patient</label>
                <select required className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm mt-1"
                  value={apptForm.patientId} onChange={(e) => setApptForm({...apptForm, patientId: e.target.value})}>
                  <option value="">Select Patient...</option>
                  {patients.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.firstName} {p.lastName} ({p.patientCode || p.mrn})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">Preferred Doctor (Optional)</label>
                <select className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm mt-1"
                  value={apptForm.doctorId} onChange={(e) => setApptForm({...apptForm, doctorId: e.target.value})}>
                  <option value="">Any Available Doctor</option>
                  {doctors.map((d: any) => (
                    <option key={d.id} value={d.id}>Dr. {d.firstName} {d.lastName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">Date & Time</label>
                <input required type="datetime-local" className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm mt-1" 
                  value={apptForm.dateTime} onChange={(e) => setApptForm({...apptForm, dateTime: e.target.value})} />
              </div>

              <div>
                <label className="form-label">Chief Complaint / Reason</label>
                <textarea className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm mt-1" 
                  value={apptForm.chiefComplaint} onChange={(e) => setApptForm({...apptForm, chiefComplaint: e.target.value})} 
                  placeholder="e.g. Fever and chills" rows={2} />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t mt-4">
                <button
                  type="button"
                  onClick={() => setApptModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={booking}
                  className="px-4 py-2 bg-[#4c1d95] hover:bg-[#3b0764] text-white rounded-none font-medium disabled:opacity-50"
                >
                  {booking ? "Booking..." : "Book Appointment"}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
