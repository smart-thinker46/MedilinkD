
import { useEffect, useState, useMemo } from "react";
const useRouter = () => ({ push: (path: string) => window.dispatchEvent(new CustomEvent("hmis:navigate", { detail: { path } })) });
import { SimpleModulePlaceholder } from "../components/layout/SimpleModulePlaceholder";
import { ModuleIcon } from "../components/layout/ModuleIcon";
import { api } from "../lib/api";

export default function EmergencyView() {
  const router = useRouter();
  const [dashboard, setDashboard] = useState<any>(null);
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState("");

  const [registerModal, setRegisterModal] = useState(false);
  const [queueModal, setQueueModal] = useState(false);
  const [queueCaseId, setQueueCaseId] = useState("");
  const [queueDestination, setQueueDestination] = useState("INPATIENT");
  const [registering, setRegistering] = useState(false);
  const [formData, setFormData] = useState({
    patientId: "",
    identityType: "REGISTERED",
    temporaryId: "",
    unknownCategory: "",
    priority: "YELLOW",
    triageSystem: "SATS",
    chiefComplaint: "",
    mechanismOfInjury: "",
    avpu: "Alert",
    gcsTotal: "15",
    temperatureC: "",
    pulseBpm: "",
    respiratoryRate: "",
    bloodPressure: "",
    spo2: "",
    painScore: "",
    modeOfArrival: "AMBULANCE",
    disposition: "",
    notes: ""
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [dashRes, boardRes] = await Promise.all([
        api.get("/emergency/dashboard"),
        api.get("/emergency/board")
      ]);
      setDashboard(dashRes.data);
      setCases(boardRes.data || []);
    } catch (err) {
      console.error("Failed to load ER data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const handleSidebarAction = (event: Event) => {
      const action = (event as CustomEvent<{ action?: string }>).detail?.action;
      if (action === "monitor-patient") {
        window.setTimeout(() => document.querySelector(".pv-table-wrap")?.scrollIntoView({ behavior: "smooth", block: "center" }), 0);
        setNotice("Emergency patient monitoring board is ready.");
      }
      if (action === "queue-patient") {
        const candidate = cases.find((row) => ["WAITING_TRIAGE", "TRIAGED", "PRIORITIZED", "IN_TREATMENT", "UNDER_OBSERVATION", "AWAITING_DISPOSITION"].includes(String(row?.status || "")));
        setQueueCaseId(String(candidate?.id || ""));
        setQueueModal(true);
      }
      if (action === "pre-arrival-notify") {
        setFormData((current) => ({ ...current, modeOfArrival: "AMBULANCE", notes: "Pre-arrival notification received. " }));
        setRegisterModal(true);
        setNotice("Pre-arrival notification workflow opened.");
      }
    };
    window.addEventListener("hmis:emergency-sidebar-action", handleSidebarAction);
    return () => window.removeEventListener("hmis:emergency-sidebar-action", handleSidebarAction);
  }, [cases]);

  const queueEmergencyPatient = async (event: React.FormEvent) => {
    event.preventDefault();
    const emergencyCase = cases.find((row) => String(row.id) === queueCaseId);
    if (!emergencyCase) {
      setNotice("Select an active emergency case first.");
      return;
    }
    try {
      await api.post("/opd/queue/token", {
        patientId: emergencyCase.patientId || undefined,
        departmentId: queueDestination,
        queueType: queueDestination,
        priority: emergencyCase.triageLevel === "LEVEL_1" ? "URGENT" : "NORMAL",
        source: "emergency",
        notes: `Emergency case ${emergencyCase.temporaryId || emergencyCase.id} queued from Emergency`,
      });
      setQueueModal(false);
      setNotice(`Emergency case queued to ${queueDestination}.`);
    } catch (error: any) {
      setNotice(`Queue failed: ${error?.response?.data?.message || error?.message || "Unable to queue case."}`);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegistering(true);
    try {
      const caseResponse = await api.post("/emergency/case", {
        ...formData,
        patientId: formData.identityType === "TEMPORARY" ? undefined : formData.patientId || undefined,
        temporaryId: formData.identityType === "TEMPORARY" ? formData.temporaryId || `TEMP-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Date.now().toString().slice(-3)}` : undefined,
        triageCategory: formData.priority,
        triageSystem: formData.triageSystem,
        vitalSigns: {
          temperatureC: formData.temperatureC,
          pulseBpm: formData.pulseBpm,
          respiratoryRate: formData.respiratoryRate,
          bloodPressure: formData.bloodPressure,
          spo2: formData.spo2,
          painScore: formData.painScore,
        },
        neurological: { avpu: formData.avpu, gcsTotal: formData.gcsTotal },
      });
      const emergencyCase = caseResponse.data;
      const priorityToLevel: Record<string, string> = { RED: "LEVEL_1", ORANGE: "LEVEL_2", YELLOW: "LEVEL_3", GREEN: "LEVEL_4", BLUE: "LEVEL_5", BLACK: "LEVEL_1" };
      await api.post(`/emergency/case/${emergencyCase.id}/triage`, {
        triageLevel: priorityToLevel[formData.priority] || "LEVEL_3",
        triageSystem: formData.triageSystem,
        chiefComplaint: formData.chiefComplaint,
        gcs: Number(formData.gcsTotal) || undefined,
        pulseRate: Number(formData.pulseBpm) || undefined,
        respiratoryRate: Number(formData.respiratoryRate) || undefined,
        temperature: Number(formData.temperatureC) || undefined,
        bloodPressure: formData.bloodPressure,
        oxygenSaturation: Number(formData.spo2) || undefined,
        painScale: Number(formData.painScore) || undefined,
        disabilityAvpu: formData.avpu,
        notes: formData.notes,
      });
      setNotice("Emergency case registered. Triage and rapid-care workflow started.");
      setRegisterModal(false);
      setFormData({ identityType: "REGISTERED", patientId: "", temporaryId: "", unknownCategory: "", priority: "YELLOW", triageSystem: "SATS", chiefComplaint: "", mechanismOfInjury: "", avpu: "Alert", gcsTotal: "15", temperatureC: "", pulseBpm: "", respiratoryRate: "", bloodPressure: "", spo2: "", painScore: "", modeOfArrival: "AMBULANCE", disposition: "", notes: "" });
      loadData();
    } catch (err: any) {
      setNotice(`Registration failed: ${err.response?.data?.message || err.message}`);
    } finally {
      setRegistering(false);
    }
  };

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 3000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const filteredCases = useMemo(() => {
    if (!search) return cases;
    const q = search.toLowerCase();
    return cases.filter((c: any) => 
      c.patientName?.toLowerCase().includes(q) ||
      c.patientCode?.toLowerCase().includes(q) ||
      c.id?.toLowerCase().includes(q) ||
      c.temporaryId?.toLowerCase().includes(q) ||
      c.status?.toLowerCase().includes(q)
    );
  }, [cases, search]);

  const tableRows = filteredCases.map((row: any) => {
    // Determine Triage Color
    let colorClass = "bg-slate-100 text-slate-700";
    if (row.triageColor === 'RED' || row.triageLevel === 'LEVEL_1') colorClass = "bg-red-100 text-red-700 border-red-200";
    if (row.triageColor === 'ORANGE' || row.triageLevel === 'LEVEL_2') colorClass = "bg-orange-100 text-orange-700 border-orange-200";
    if (row.triageColor === 'YELLOW' || row.triageLevel === 'LEVEL_3') colorClass = "bg-yellow-100 text-yellow-700 border-yellow-200";
    if (row.triageColor === 'GREEN' || row.triageLevel === 'LEVEL_4') colorClass = "bg-green-100 text-green-700 border-green-200";

    return {
      id: row.id,
      patient: `${row.patientName || "Unknown Patient"} (${row.patientCode || row.temporaryId || "Temporary"})`,
      arrival: row.arrivedAt ? new Date(row.arrivedAt).toLocaleTimeString() : "-",
      complaint: row.chiefComplaint || "-",
      wait: row.waitingMinutes != null ? `${row.waitingMinutes} min` : row.waitMinutes != null ? `${row.waitMinutes} min` : "—",
      location: row.bedLocation || row.currentLocation || "Triage",
      vitals: row.vitalsSummary || (row.criticalFlags?.length ? row.criticalFlags.join(", ") : "Pending"),
      alerts: row.criticalFlags?.length ? row.criticalFlags.join(", ") : "—",
      triage: (
        <span className={`px-2 py-1 rounded text-xs font-bold border ${colorClass}`}>
          {row.triageLevel || "PENDING"}
        </span>
      ),
      status: row.status,
    };
  });

  return (
    <>
      {notice ? <div className={`module-toast patient-action-toast ${notice.toLowerCase().includes("failed") ? "is-error" : "is-success"}`} role="status"><span className="patient-action-toast-icon">{notice.toLowerCase().includes("failed") ? "!" : "✓"}</span><div className="patient-action-toast-content"><strong>{notice.toLowerCase().includes("failed") ? "Action needs attention" : "Action completed"}</strong><span>{notice}</span></div><button type="button" className="patient-action-toast-close" onClick={() => setNotice("")}>×</button></div> : null}
      <SimpleModulePlaceholder
        title="Emergency Room (ER) Board"
        subtitle="Live tracking of critical cases, triage levels, and rapid responses"
        icon={<ModuleIcon name="warning" />}
        stats={[
          { label: "Active ER Cases", value: dashboard?.totals?.activeCases || 0, color: "#1e3a8a" },
          { label: "Red / Resuscitation", value: dashboard?.totals?.level1 || 0, color: "#dc2626" },
          { label: "Yellow / Urgent", value: dashboard?.totals?.level3 || 0, color: "#f59e0b" },
          { label: "Green / Non-Urgent", value: dashboard?.totals?.level4 || 0, color: "#16a34a" },
        ]}
        columns={[
          { label: "Patient", key: "patient", className: "font-bold" },
          { label: "Acuity", key: "triage" },
          { label: "Arrival", key: "arrival" },
          { label: "Wait", key: "wait" },
          { label: "Location", key: "location" },
          { label: "Complaint", key: "complaint" },
          { label: "Vitals", key: "vitals" },
          { label: "Alerts", key: "alerts" },
          { label: "Status", key: "status" },
        ]}
        rows={tableRows}
        searchPlaceholder="Search ER cases by patient name..."
        searchKeys={["patient"]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setRegisterModal(true)}
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              style={{ backgroundColor: "#dc2626" }}
              type="button"
            >
              <ModuleIcon name="add_alert" /> Register ER Case
            </button>
            {[
              ["Emergency Triage Form", "Emergency Triage"],
              ["Emergency Encounter Form", "Emergency Encounter"],
              ["Trauma Documentation Form", "Trauma Documentation"],
              ["Emergency Triage Form", "Pre-Arrival Notify"],
            ].map(([formName, label]) => (
              <button
                key={label}
                type="button"
                className={`emergency-action-btn emergency-action-${label.toLowerCase().replace(/[^a-z]+/g, "-")}`}
                style={{
                  backgroundColor: label === "Emergency Triage" ? "#6b1111" : label === "Emergency Encounter" ? "#6b250f" : label === "Trauma Documentation" ? "#5f360d" : "#0f4654",
                  borderColor: label === "Emergency Triage" ? "#4c0b0b" : label === "Emergency Encounter" ? "#4b1a0b" : label === "Trauma Documentation" ? "#422607" : "#0b3540",
                  color: "#ffffff",
                }}
                onClick={() => {
                  if (label === "Emergency Triage" || label === "Pre-Arrival Notify") {
                    setFormData((current) => ({ ...current, modeOfArrival: label === "Pre-Arrival Notify" ? "AMBULANCE" : current.modeOfArrival }));
                    setRegisterModal(true);
                    return;
                  }
                  window.dispatchEvent(new CustomEvent("hmis:open-module-form", { detail: { moduleKey: "emergency", formName } }));
                }}
              >
                <ModuleIcon name={label.includes("Trauma") ? "personal_injury" : label.includes("Pre-") ? "campaign" : "assignment"} /> {label}
              </button>
            ))}
          </div>
        }
      />

      {registerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <form onSubmit={handleRegister} className="emergency-modal bg-card p-6 rounded-2xl border border-border shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-2 text-red-600 flex items-center gap-2">
               <ModuleIcon name="warning" /> ER Registration
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Rapidly admit a patient to the Emergency Board.
            </p>

            <div className="space-y-4">
              <div>
                <label className="form-label">Identity pathway</label>
                <select className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm mt-1" value={formData.identityType} onChange={(e) => setFormData({...formData, identityType: e.target.value})}>
                  <option value="REGISTERED">Registered patient / MRN</option>
                  <option value="TEMPORARY">Temporary or unknown patient</option>
                </select>
              </div>
              {formData.identityType === "REGISTERED" ? (
                <div>
                  <label className="form-label">Patient MRN / ID</label>
                  <input required type="text" className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm mt-1" value={formData.patientId} onChange={(e) => setFormData({...formData, patientId: e.target.value})} placeholder="Scan or enter patient MRN..." />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <label className="form-label">Temporary ID<input type="text" className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm mt-1" value={formData.temporaryId} onChange={(e) => setFormData({...formData, temporaryId: e.target.value})} placeholder="Auto-generated if blank" /></label>
                  <label className="form-label">Unknown category<select className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm mt-1" value={formData.unknownCategory} onChange={(e) => setFormData({...formData, unknownCategory: e.target.value})}><option value="">Select category</option><option>Unknown male</option><option>Unknown female</option><option>Unknown child</option><option>Unconscious patient</option><option>Police brought</option><option>Ambulance brought</option></select></label>
                </div>
              )}
              
              <div>
                <label className="form-label">Initial Triage Level</label>
                <select
                  required
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm mt-1"
                  value={formData.priority}
                  onChange={(e) => setFormData({...formData, priority: e.target.value})}
                >
                  <option value="RED">Red (Resuscitation / Immediate)</option>
                  <option value="YELLOW">Yellow (Urgent)</option>
                  <option value="GREEN">Green (Non-Urgent / Standard)</option>
                  <option value="BLACK">Black (Deceased / Expectant)</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="form-label">Triage system<select className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm mt-1" value={formData.triageSystem} onChange={(e) => setFormData({...formData, triageSystem: e.target.value})}><option>MTS</option><option>SATS</option><option>ESI</option><option>START</option></select></label>
                <label className="form-label">AVPU<select className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm mt-1" value={formData.avpu} onChange={(e) => setFormData({...formData, avpu: e.target.value})}><option>Alert</option><option>Voice</option><option>Pain</option><option>Unresponsive</option></select></label>
              </div>

              <div>
                <label className="form-label">Mode of Arrival</label>
                <select
                  required
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm mt-1"
                  value={formData.modeOfArrival}
                  onChange={(e) => setFormData({...formData, modeOfArrival: e.target.value})}
                >
                  <option value="AMBULANCE">Ambulance</option>
                  <option value="WALK_IN">Walk-in</option>
                  <option value="REFERRAL">Referral / Transfer</option>
                  <option value="POLICE">Police</option>
                </select>
              </div>

              <div>
                <label className="form-label">Chief Complaint</label>
                <textarea required className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm mt-1" 
                  value={formData.chiefComplaint} onChange={(e) => setFormData({...formData, chiefComplaint: e.target.value})} 
                  placeholder="Brief description of the emergency..." />
              </div>
              <div>
                <label className="form-label">Mechanism of injury / presenting condition</label>
                <input type="text" className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm mt-1" value={formData.mechanismOfInjury} onChange={(e) => setFormData({...formData, mechanismOfInjury: e.target.value})} placeholder="Trauma mechanism or presenting condition" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                {([["temperatureC", "Temp °C"], ["pulseBpm", "Pulse"], ["respiratoryRate", "Resp. rate"], ["bloodPressure", "BP"], ["spo2", "SpO₂ %"], ["painScore", "Pain 0–10"]] as const).map(([key, label]) => <label key={key} className="form-label">{label}<input type={key === "bloodPressure" ? "text" : "number"} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm mt-1" value={formData[key]} onChange={(e) => setFormData({...formData, [key]: e.target.value})} /></label>)}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="form-label">GCS total<input type="number" min="3" max="15" className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm mt-1" value={formData.gcsTotal} onChange={(e) => setFormData({...formData, gcsTotal: e.target.value})} /></label>
                <label className="form-label">Disposition<select className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm mt-1" value={formData.disposition} onChange={(e) => setFormData({...formData, disposition: e.target.value})}><option value="">Pending assessment</option><option>Admitted</option><option>ICU</option><option>Theatre</option><option>Discharged</option><option>Transferred</option><option>Deceased</option></select></label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setRegisterModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={registering}
                  className="px-4 py-2 bg-red-800 hover:bg-red-900 text-white rounded-lg font-medium disabled:opacity-50"
                >
                  {registering ? "Admitting..." : "Admit to ER"}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
      {queueModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <form onSubmit={queueEmergencyPatient} className="emergency-modal bg-card p-6 rounded-2xl border border-border shadow-xl w-full max-w-lg">
            <h2 className="text-xl font-bold mb-2 text-red-700 flex items-center gap-2"><ModuleIcon name="queue" /> Queue emergency patient</h2>
            <p className="text-sm text-muted-foreground mb-4">Route an active emergency case to the next operational service without recreating the patient.</p>
            <label className="form-label">Emergency case<select required className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm mt-1" value={queueCaseId} onChange={(event) => setQueueCaseId(event.target.value)}><option value="">Select active case</option>{cases.filter((row) => !["DISCHARGED", "DECEASED", "CANCELLED"].includes(String(row.status))).map((row) => <option key={row.id} value={row.id}>{row.patientName || "Unknown patient"} · {row.temporaryId || row.id}</option>)}</select></label>
            <label className="form-label mt-4">Destination<select required className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm mt-1" value={queueDestination} onChange={(event) => setQueueDestination(event.target.value)}><option value="INPATIENT">Inpatient</option><option value="ICU">ICU</option><option value="THEATRE">Operating Theatre</option><option value="LABORATORY">Laboratory</option><option value="RADIOLOGY">Radiology</option><option value="PHARMACY">Pharmacy</option><option value="REFERRAL">Referral</option></select></label>
            <div className="flex justify-end gap-3 pt-5 mt-5 border-t"><button type="button" onClick={() => setQueueModal(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium">Cancel</button><button type="submit" className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white rounded-lg font-medium">Queue Patient</button></div>
          </form>
        </div>
      ) : null}
    </>
  );
}
