// Ported from Medilink-Frontend/src/app/portal/appointments/page.tsx for desktop parity.
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "../lib/navigation";
import { ArrowLeft } from "lucide-react";
import { SimpleModulePlaceholder } from "../components/layout/SimpleModulePlaceholder";
import { ModuleIcon } from "../components/layout/ModuleIcon";
import { api } from "../lib/api";

export default function PortalAppointmentsView() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]); 
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [addModal, setAddModal] = useState(false);
  const [booking, setBooking] = useState(false);
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
      const [apptRes, patRes, docRes] = await Promise.all([
        api.get("/patient-portal/appointments"),
        api.get("/patients"),
        api.get("/hr/staff?role=DOCTOR") 
      ]);
      setAppointments(apptRes.data || []);
      setPatients(patRes.data?.data || patRes.data || []);
      setDoctors(docRes.data || []);
    } catch (err) {
      console.error("Failed to load portal appointments", err);
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

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setBooking(true);
    try {
      await api.post("/patient-portal/appointment", {
        ...apptForm,
        dateTime: new Date(apptForm.dateTime).toISOString()
      });
      alert("Portal appointment booked successfully!");
      setAddModal(false);
      setApptForm({ patientId: "", doctorId: "", dateTime: "", appointmentType: "PORTAL", chiefComplaint: "" });
      loadData();
    } catch (err: any) {
      alert(`Booking Failed: ${err.response?.data?.message || err.message}`);
    } finally {
      setBooking(false);
    }
  };

  const filteredAppointments = useMemo(() => {
    if (!search) return appointments;
    const q = search.toLowerCase();
    return appointments.filter((a: any) => 
      a.patientName?.toLowerCase().includes(q) ||
      a.doctorName?.toLowerCase().includes(q)
    );
  }, [appointments, search]);

  const tableRows = filteredAppointments.map((row: any) => ({
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
        rows={tableRows}
        searchPlaceholder="Search by patient or doctor name..."
        searchKeys={["patient", "doctor"]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => router.push('/portal')}
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-200 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              type="button"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Accounts
            </button>
            <button
              onClick={() => setAddModal(true)}
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              style={{ backgroundColor: "#4c1d95" }}
              type="button"
            >
              <ModuleIcon name="add_alert" /> Simulate Booking
            </button>
          </div>
        }
      />

      {addModal && (
        <div className="module-form-overlay" onClick={() => setAddModal(false)}>
          <form onSubmit={handleBookAppointment} className="module-form-panel modal-panel" onClick={(e) => e.stopPropagation()}>
            <div className="module-form-header">
              <div className="module-form-heading">
                <div className="module-form-icon"><ModuleIcon name="event" /></div>
                <div>
                  <div className="module-form-kicker">Patient Portal</div>
                  <h2 className="module-form-title">Simulate Portal Booking</h2>
                  <p className="module-form-desc">Test the portal appointment creation flow.</p>
                </div>
              </div>
              <button type="button" className="modal-close-btn" onClick={() => setAddModal(false)}>x</button>
            </div>
            <div className="module-form-body">
              <div className="module-form-grid">
                <div className="module-form-field is-wide">
                  <label className="form-label">Patient</label>
                  <select required className="module-form-input"
                    value={apptForm.patientId} onChange={(e) => setApptForm({...apptForm, patientId: e.target.value})}>
                    <option value="">Select Patient...</option>
                    {patients.map((p: any) => (
                      <option key={p.id} value={p.id}>{p.firstName} {p.lastName} ({p.patientCode})</option>
                    ))}
                  </select>
                </div>
                <div className="module-form-field is-wide">
                  <label className="form-label">Preferred Doctor (Optional)</label>
                  <select className="module-form-input"
                    value={apptForm.doctorId} onChange={(e) => setApptForm({...apptForm, doctorId: e.target.value})}>
                    <option value="">Any Available Doctor</option>
                    {doctors.map((d: any) => (
                      <option key={d.id} value={d.id}>Dr. {d.firstName} {d.lastName}</option>
                    ))}
                  </select>
                </div>
                <div className="module-form-field">
                  <label className="form-label">Date & Time</label>
                  <input required type="datetime-local" className="module-form-input" 
                    value={apptForm.dateTime} onChange={(e) => setApptForm({...apptForm, dateTime: e.target.value})} />
                </div>
                <div className="module-form-field is-wide">
                  <label className="form-label">Chief Complaint / Reason</label>
                  <textarea className="module-form-input" 
                    value={apptForm.chiefComplaint} onChange={(e) => setApptForm({...apptForm, chiefComplaint: e.target.value})} 
                    placeholder="e.g. Fever and chills" rows={2} />
                </div>
              </div>
              <div className="module-form-footer">
                <button type="button" className="form-btn form-btn-cancel" onClick={() => setAddModal(false)}>Cancel</button>
                <button type="submit" disabled={booking} className="form-btn form-btn-primary module-form-submit">{booking ? "Booking..." : "Book Appointment"}</button>
              </div>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
