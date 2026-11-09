
import { useEffect, useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { ModuleIcon } from "../components/layout/ModuleIcon";
import { api } from "../lib/api";
import { useLiveRefresh } from "../lib/liveRefresh";

type MortuaryRecord = {
  id: string;
  mortuaryNumber?: string;
  source?: string;
  patientId?: string | null;
  patientCode?: string;
  deceasedName?: string;
  gender?: string;
  age?: number | null;
  nationalId?: string;
  nextOfKinName?: string;
  nextOfKinPhone?: string;
  certifyingDoctor?: string;
  placeOfDeath?: string;
  deathClassification?: string;
  attendingDepartment?: string;
  ward?: string;
  room?: string;
  bed?: string;
  bodyTag?: string;
  identityVerified?: boolean;
  dateOfDeath?: string;
  causeOfDeath?: string;
  bodyReleased?: boolean;
  status?: string;
  daysInMortuary?: number;
  policeHold?: boolean;
  policeCaseNumber?: string;
  holdReason?: string;
  storage?: { unit?: string; room?: string; rack?: string; tray?: string };
  certificate?: { certificateSerial?: string; issuedAt?: string; receivedBy?: string; signed?: boolean } | null;
  police?: { policeCaseNumber?: string; clearanceReceived?: boolean; investigatingOfficer?: string; policeStation?: string } | null;
  embalming?: { embalmedAt?: string; fluidType?: string; feeAmount?: number; billing?: any } | null;
  release?: any;
  billing?: { outstandingAmount?: number; totalAmount?: number; paidAmount?: number };
  notes?: string;
};

type Dashboard = {
  totals?: {
    capacity?: number;
    activeBodies?: number;
    availableSpaces?: number;
    releasesToday?: number;
    policeHolds?: number;
    overstayCount?: number;
    unclaimedBodies?: number;
  };
  storageMap?: Array<{ unit: string; total: number; holds: number; overstay: number }>;
};

type Modal = "reception" | "allocate" | "certificate" | "police" | "embalming" | "release" | null;

const nowLocal = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);
const today = () => new Date().toISOString().slice(0, 10);
const MORTUARY_API = "/tenant/mortuary";

const readCheckedInPatient = () => {
  if (typeof window === "undefined") return {};
  try {
    const states = JSON.parse(window.localStorage.getItem("hmis_patient_module_states") || "{}");
    return states?.mortuary || {};
  } catch {
    return {};
  }
};

const numberValue = (value: unknown, fallback = 0) => {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
};

const noticeTone = (message: string) => {
  const lower = message.toLowerCase();
  if (lower.includes("failed") || lower.includes("cannot") || lower.includes("requires")) return "error";
  if (lower.includes("hold") || lower.includes("maternal") || lower.includes("alert")) return "warning";
  if (lower.includes("saved") || lower.includes("issued") || lower.includes("released") || lower.includes("assigned")) return "success";
  return "info";
};

const patientNameFromState = (state: any) =>
  String(state?.patientName || state?.name || [state?.firstName, state?.lastName].filter(Boolean).join(" ")).trim();

const storageKey = (row: MortuaryRecord) =>
  [row.storage?.unit, row.storage?.room, row.storage?.rack, row.storage?.tray].map((part) => String(part || "").trim()).filter(Boolean).join("-");

const formatDate = (value?: string) => {
  if (!value) return "Not recorded";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "Not recorded";
  return date.toLocaleDateString();
};

export default function MortuaryView() {
  const [dashboard, setDashboard] = useState<Dashboard>({});
  const [records, setRecords] = useState<MortuaryRecord[]>([]);
  const [selected, setSelected] = useState<MortuaryRecord | null>(null);
  const [modal, setModal] = useState<Modal>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [checkedInPatient, setCheckedInPatient] = useState<any>({});
  const [storageCollapsed, setStorageCollapsed] = useState(false);
  const [detailRecord, setDetailRecord] = useState<MortuaryRecord | null>(null);

  const [reception, setReception] = useState({
    source: "INTERNAL",
    patientId: "",
    deceasedName: "",
    dateOfDeath: nowLocal(),
    causeOfDeath: "",
    gender: "",
    age: "",
    nationalId: "",
    nextOfKinName: "",
    nextOfKinPhone: "",
    certifyingDoctor: "",
    placeOfDeath: "Hospital",
    deathClassification: "UNKNOWN_CAUSE",
    attendingDepartment: "",
    ward: "",
    room: "",
    bed: "",
    bodyTag: "",
    identityVerified: false,
    bodyReceivedFrom: "Ward",
    bodyCondition: "Fresh",
    belongingsReceived: "No",
    storageUnit: "STANDARD-4C",
    storageRoom: "Cold Room A",
    storageRack: "Rack 1",
    storageTray: "C-001",
    policeHold: false,
    policeCaseNumber: "",
    holdReason: "",
    notes: "",
  });
  const [allocation, setAllocation] = useState({ storageUnit: "STANDARD-4C", storageRoom: "Cold Room A", storageRack: "Rack 1", storageTray: "C-001", policeHold: false, holdReason: "", notes: "" });
  const [certificate, setCertificate] = useState({ certificateSerial: "", issuedAt: today(), receivedBy: "", placeOfDeath: "Hospital", immediateCause: "", underlyingCause: "", certifyingDoctor: "", doctorSignature: "", hospitalStamp: true, notes: "" });
  const [police, setPolice] = useState({ policeCaseNumber: "", investigatingOfficer: "", policeStation: "", policeSurgeonExamDate: today(), p3Reference: "", clearanceReceived: false, clearanceDocument: "", notes: "" });
  const [embalming, setEmbalming] = useState({ embalmedAt: nowLocal(), fluidType: "Formalin based arterial fluid", fluidVolumeMl: "4000", bodyConditionBefore: "Fresh", techniqueUsed: "Arterial embalming", durationMinutes: "90", contractorName: "", contractorCharge: "0", feeAmount: "0", notes: "" });
  const [release, setRelease] = useState({ releaseDate: nowLocal(), releasedToName: "", releasedToNationalId: "", releasedToPhone: "", relationship: "", paymentVerified: false, docsVerified: false, signatureCaptured: false, legalClearanceVerified: false, policeClearanceVerified: false, deathCertificateIssued: false, releaseCertificateNo: "", billAmount: "0", paidAmount: "0", notes: "" });

  const loadData = async () => {
    setLoading(true);
    try {
      const [dashboardResult, recordsResult] = await Promise.allSettled([
        api.get(`${MORTUARY_API}/dashboard`),
        api.get(`${MORTUARY_API}/records`, { params: { limit: 300, search: search.trim() || undefined, status: status === "ALL" ? undefined : status } }),
      ]);
      setDashboard(dashboardResult.status === "fulfilled" ? dashboardResult.value.data || {} : {});
      if (recordsResult.status === "fulfilled") {
        const payload = recordsResult.value.data;
        setRecords(Array.isArray(payload) ? payload : Array.isArray(payload?.items) ? payload.items : []);
      }
      const failed = [dashboardResult, recordsResult].filter((result) => result.status === "rejected");
      if (failed.length) {
        const firstError = failed[0].status === "rejected" ? failed[0].reason : null;
        setNotice(`Mortuary data partially unavailable: ${firstError?.response?.data?.message || firstError?.message || "refresh to retry"}`);
      }
    } catch (err: any) {
      setNotice(`Mortuary data failed to load: ${err?.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const patient = readCheckedInPatient();
    setCheckedInPatient(patient);
    setReception((prev) => ({
      ...prev,
      patientId: String(patient?.patientId || patient?.id || ""),
      deceasedName: patientNameFromState(patient),
      gender: String(patient?.gender || ""),
      nationalId: String(patient?.idNumber || patient?.nationalId || ""),
      nextOfKinName: String(patient?.nextOfKinName || ""),
      nextOfKinPhone: String(patient?.nextOfKinPhone || ""),
      causeOfDeath: String(patient?.diagnosis || patient?.admittingDiagnosis || ""),
      source: patient?.patientId || patient?.id ? "INTERNAL" : "EXTERNAL",
    }));
    void loadData();
  }, []);

  useLiveRefresh(loadData, { intervalMs: 30000 });

  useEffect(() => {
    const timer = window.setTimeout(() => void loadData(), 250);
    return () => window.clearTimeout(timer);
    // Search and status are authoritative backend filters; refresh the register when either changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, status]);

  const filteredRecords = useMemo(() => {
    const q = search.trim().toLowerCase();
    return records.filter((row) => {
      if (status !== "ALL" && String(row.status || "").toUpperCase() !== status) return false;
      if (!q) return true;
      return [
        row.mortuaryNumber,
        row.deceasedName,
        row.patientCode,
        row.patientId,
        row.nationalId,
        row.nextOfKinName,
        row.nextOfKinPhone,
        row.causeOfDeath,
        row.certifyingDoctor,
        row.status,
        row.storage?.unit,
        row.storage?.room,
        row.storage?.rack,
        row.storage?.tray,
        row.policeCaseNumber,
        row.police?.policeCaseNumber,
        row.police?.investigatingOfficer,
        row.police?.policeStation,
        row.certificate?.certificateSerial,
        row.certificate?.receivedBy,
        row.release?.releasedToName,
        row.release?.releasedToNationalId,
      ].join(" ").toLowerCase().includes(q);
    });
  }, [records, search, status]);

  const activeRecords = records.filter((row) => !row.bodyReleased);
  const stats = dashboard.totals || {};
  const capacity = numberValue(stats.capacity, 24);
  const liveStats = {
    capacity,
    activeBodies: numberValue(stats.activeBodies, activeRecords.length),
    availableSpaces: numberValue(stats.availableSpaces, Math.max(0, capacity - activeRecords.length)),
    releasesToday: numberValue(stats.releasesToday, records.filter((row) => row.bodyReleased && String(row.release?.releaseDate || "").slice(0, 10) === today()).length),
    policeHolds: numberValue(stats.policeHolds, activeRecords.filter((row) => row.policeHold).length),
    overstayCount: numberValue(stats.overstayCount, activeRecords.filter((row) => numberValue(row.daysInMortuary) >= 14).length),
  };
  const compartments = Array.from({ length: 24 }, (_, index) => {
    const tray = `C-${String(index + 1).padStart(3, "0")}`;
    const key = `STANDARD-4C-Cold Room A-Rack ${Math.floor(index / 8) + 1}-${tray}`;
    const occupant = activeRecords.find((row) => storageKey(row) === key);
    return { tray, key, rack: `Rack ${Math.floor(index / 8) + 1}`, occupant, maintenance: index === 23 && !occupant };
  });

  const mohStats = useMemo(() => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthRecords = records.filter((row) => String(row.dateOfDeath || "").slice(0, 7) === currentMonth);
    const maternal = monthRecords.filter((row) => /maternal|pregnan|postpartum|delivery/i.test(`${row.causeOfDeath} ${row.notes || ""}`)).length;
    const neonatal = monthRecords.filter((row) => numberValue(row.age, 999) === 0).length;
    const under5 = monthRecords.filter((row) => numberValue(row.age, 999) < 5).length;
    const autopsy = monthRecords.filter((row) => /autopsy|post.?mortem/i.test(`${row.causeOfDeath} ${row.notes || ""}`)).length;
    return { month: currentMonth, total: monthRecords.length, maternal, neonatal, under5, autopsy };
  }, [records]);

  const openModal = (next: Modal, row?: MortuaryRecord) => {
    setSelected(row || null);
    if (next === "allocate" && row) {
      setAllocation({
        storageUnit: row.storage?.unit || "STANDARD-4C",
        storageRoom: row.storage?.room || "Cold Room A",
        storageRack: row.storage?.rack || "Rack 1",
        storageTray: row.storage?.tray || "C-001",
        policeHold: Boolean(row.policeHold),
        holdReason: row.holdReason || "",
        notes: "",
      });
    }
    if (next === "certificate" && row) {
      setCertificate((prev) => ({ ...prev, immediateCause: row.causeOfDeath || "", certifyingDoctor: row.certifyingDoctor || "", receivedBy: row.nextOfKinName || "" }));
    }
    if (next === "police" && row) {
      setPolice((prev) => ({ ...prev, policeCaseNumber: row.police?.policeCaseNumber || row.policeCaseNumber || "" }));
    }
    if (next === "release" && row) {
      const bill = numberValue(row.billing?.totalAmount || 0);
      setRelease({
        releaseDate: nowLocal(),
        releasedToName: row.nextOfKinName || "",
        releasedToNationalId: "",
        releasedToPhone: row.nextOfKinPhone || "",
        relationship: "",
        paymentVerified: false,
        docsVerified: Boolean(row.certificate?.certificateSerial),
        deathCertificateIssued: Boolean(row.certificate?.certificateSerial),
        legalClearanceVerified: !row.policeHold || Boolean(row.police?.clearanceReceived),
        policeClearanceVerified: !row.policeHold || Boolean(row.police?.clearanceReceived),
        signatureCaptured: false,
        releaseCertificateNo: "",
        billAmount: String(bill),
        paidAmount: String(bill),
        notes: "",
      });
    }
    setModal(next);
  };

  const openReceptionForCompartment = (slot: { tray: string; rack: string }) => {
    setReception((prev) => ({
      ...prev,
      storageUnit: "STANDARD-4C",
      storageRoom: "Cold Room A",
      storageRack: slot.rack,
      storageTray: slot.tray,
    }));
    setSelected(null);
    setModal("reception");
  };

  const submitReception = async (event: FormEvent) => {
    event.preventDefault();
    if (reception.source === "INTERNAL" && !reception.identityVerified) {
      setNotice("Reception blocked: verify the patient identity before receiving an internal body.");
      return;
    }
    setSaving(true);
    try {
      await api.post(`${MORTUARY_API}/records`, {
        ...reception,
        patientId: reception.source === "INTERNAL" ? reception.patientId || undefined : undefined,
        dateOfDeath: new Date(reception.dateOfDeath).toISOString(),
        age: reception.age ? Number(reception.age) : undefined,
        policeHold: Boolean(reception.policeHold),
        notes: `Received from: ${reception.bodyReceivedFrom}. Body condition: ${reception.bodyCondition}. Personal belongings: ${reception.belongingsReceived}. ${reception.notes}`.trim(),
      });
      setNotice("Body reception registered. Mortuary reference number generated and storage assigned.");
      setModal(null);
      await loadData();
    } catch (err: any) {
      setNotice(`Reception failed: ${err?.response?.data?.message || err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const submitForRecord = async (event: FormEvent, action: "allocate" | "certificate" | "police" | "embalming" | "release") => {
    event.preventDefault();
    if (!selected?.id) return setNotice("Select a mortuary record first.");
    setSaving(true);
    try {
      if (action === "allocate") {
        await api.post(`${MORTUARY_API}/records/${selected.id}/allocate`, allocation);
        setNotice("Cold storage compartment assigned and map updated.");
      } else if (action === "certificate") {
        await api.post(`${MORTUARY_API}/records/${selected.id}/certificate`, certificate);
        setNotice("Death certificate issued and chain of custody recorded.");
      } else if (action === "police") {
        await api.post(`${MORTUARY_API}/records/${selected.id}/police-case`, police);
        setNotice(police.clearanceReceived ? "Police case updated with clearance." : "Medico-legal case recorded and release locked.");
      } else if (action === "embalming") {
        await api.post(`${MORTUARY_API}/records/${selected.id}/embalming`, {
          ...embalming,
          fluidVolumeMl: Number(embalming.fluidVolumeMl || 0),
          durationMinutes: Number(embalming.durationMinutes || 0),
          contractorCharge: Number(embalming.contractorCharge || 0),
          feeAmount: Number(embalming.feeAmount || 0),
          embalmedAt: new Date(embalming.embalmedAt).toISOString(),
        });
        setNotice("Embalming record saved and fee posted where applicable.");
      } else {
        await api.post(`${MORTUARY_API}/records/${selected.id}/release`, {
          ...release,
          releaseDate: new Date(release.releaseDate).toISOString(),
          billAmount: Number(release.billAmount || 0),
          paidAmount: Number(release.paidAmount || 0),
        });
        setNotice("Body released. Clearance document and billing chain recorded.");
      }
      setModal(null);
      await loadData();
    } catch (err: any) {
      setNotice(`${action} failed: ${err?.response?.data?.message || err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="patients-view mortuary-view">
      <div className="pv-header">
        <div>
          <div className="pv-title flex items-center gap-2"><ModuleIcon name="fact_check" /> Mortuary</div>
          <div className="pv-subtitle">Body reception, cold storage, certificates, medico-legal holds, release, embalming, and MOH reporting</div>
        </div>
        <div className="module-actions">
          <button type="button" onClick={() => openModal("reception")}><ModuleIcon name="add_circle" /> Body Reception</button>
          <button type="button" className="mortuary-release-header-btn" disabled={!detailRecord || Boolean(detailRecord.bodyReleased)} onClick={() => { if (!detailRecord) return; setDetailRecord(null); openModal("release", detailRecord); }}><ModuleIcon name="verified" /> Release Body</button>
          <button type="button" onClick={loadData}><ModuleIcon name="sync_alt" /> Refresh</button>
        </div>
      </div>

      <div className="pv-stats">
        <div className="pv-stat-card" style={{ borderLeftColor: "#0f766e" }}><p className="pv-stat-label">Capacity</p><p className="pv-stat-value">{liveStats.capacity}</p></div>
        <div className="pv-stat-card" style={{ borderLeftColor: "#dc2626" }}><p className="pv-stat-label">Bodies In Care</p><p className="pv-stat-value">{liveStats.activeBodies}</p></div>
        <div className="pv-stat-card" style={{ borderLeftColor: "#16a34a" }}><p className="pv-stat-label">Available</p><p className="pv-stat-value">{liveStats.availableSpaces}</p></div>
        <div className="pv-stat-card" style={{ borderLeftColor: "#d97706" }}><p className="pv-stat-label">Police Holds</p><p className="pv-stat-value">{liveStats.policeHolds}</p></div>
        <div className="pv-stat-card" style={{ borderLeftColor: "#2563eb" }}><p className="pv-stat-label">Releases Today</p><p className="pv-stat-value">{liveStats.releasesToday}</p></div>
        <div className="pv-stat-card" style={{ borderLeftColor: "#7c3aed" }}><p className="pv-stat-label">Overstay</p><p className="pv-stat-value">{liveStats.overstayCount}</p></div>
      </div>

      {mohStats.maternal > 0 ? (
        <div className="mortuary-alert"><ModuleIcon name="notifications_active" /> Maternal death alert: notify Medical Director, Nursing Director, and county health office within 24 hours.</div>
      ) : null}

      <div className="pv-search-bar">
        <div className="pv-search-wrap"><ModuleIcon name="search" /><input className="pv-search" placeholder="Search mortuary number, deceased, MRN, storage, police case" value={search} onChange={(event) => setSearch(event.target.value)} /></div>
        <select className="module-form-input mortuary-status-filter" value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="ALL">All statuses</option>
          <option value="REGISTERED">Registered</option>
          <option value="STORED">Stored</option>
          <option value="POLICE_HOLD">Police hold</option>
          <option value="READY_FOR_RELEASE">Ready for release</option>
          <option value="RELEASED">Released</option>
        </select>
      </div>

      <section className="mortuary-storage-board">
        <div className="bed-map-toolbar">
          <div>
            <div className="bed-table-title mortuary-storage-title"><ModuleIcon name="hotel" /> Cold Storage Map</div>
            <div className="bed-map-legend">
              <span><i className="bed-dot occupied" /> Occupied</span>
              <span><i className="bed-dot empty" /> Empty</span>
              <span><i className="bed-dot maintenance" /> Maintenance</span>
            </div>
          </div>
          <div className="mortuary-storage-actions">
            <div className="bed-map-live"><ModuleIcon name="my_location" /> Updates every 30 seconds</div>
            <button type="button" className="mortuary-collapse-btn" onClick={() => setStorageCollapsed((prev) => !prev)} aria-expanded={!storageCollapsed}>
              <ModuleIcon name="sync_alt" /> {storageCollapsed ? "Show Map" : "Hide Map"}
            </button>
          </div>
        </div>
        {!storageCollapsed ? <div className="mortuary-compartment-grid">
          {compartments.map((slot) => (
            <button
              key={slot.key}
              type="button"
              className={`mortuary-compartment ${slot.occupant ? "is-occupied" : slot.maintenance ? "is-maintenance" : "is-empty"}`}
              onClick={() => slot.occupant ? openModal("allocate", slot.occupant) : openReceptionForCompartment(slot)}
            >
              <strong>{slot.tray}</strong>
              <span>{slot.occupant ? slot.occupant.deceasedName : slot.maintenance ? "Maintenance" : "Empty"}</span>
              <small>{slot.occupant ? `${slot.occupant.daysInMortuary || 0} days held` : slot.rack}</small>
            </button>
          ))}
        </div> : null}
      </section>

      <div className="mortuary-panels">
        <div className="pv-table-wrap">
          <div className="bed-table-title"><ModuleIcon name="description" /> Mortuary Register</div>
          <table className="pv-table mortuary-register-table">
            <thead><tr><th>Mortuary Ref</th><th>Deceased</th><th>Storage</th><th>Clearance</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={6} className="pv-empty">Loading mortuary records...</td></tr> : null}
              {!loading && filteredRecords.length === 0 ? <tr><td colSpan={6} className="pv-empty">No mortuary records found.</td></tr> : null}
              {filteredRecords.map((row) => (
                <tr key={row.id} className="mortuary-click-row" onClick={() => setDetailRecord(row)} tabIndex={0} onKeyDown={(event) => { if (event.key === "Enter") setDetailRecord(row); }}>
                  <td>
                    <strong className="mortuary-ref">{row.mortuaryNumber || row.id.slice(0, 8)}</strong>
                    <small>{row.source || "EXTERNAL"}</small>
                  </td>
                  <td className="pv-name">
                    {row.deceasedName || "Unnamed body"}
                    <small>{row.patientCode || row.nationalId || "No MRN / ID"}</small>
                  </td>
                  <td>
                    <span>{storageKey(row) || "Unassigned"}</span>
                    <small>{row.daysInMortuary || 0} day{Number(row.daysInMortuary || 0) === 1 ? "" : "s"} held</small>
                  </td>
                  <td>
                    <div className="mortuary-clearance-stack">
                      <span className={`mortuary-pill ${row.certificate?.certificateSerial ? "is-ok" : "is-warn"}`}>Cert: {row.certificate?.certificateSerial || "Pending"}</span>
                      <span className={`mortuary-pill ${row.policeHold ? row.police?.clearanceReceived ? "is-ok" : "is-hold" : "is-ok"}`}>Police: {row.policeHold ? row.police?.clearanceReceived ? "Cleared" : "Hold" : "N/A"}</span>
                      <span className={`mortuary-pill ${numberValue(row.billing?.outstandingAmount, 0) > 0 ? "is-warn" : "is-ok"}`}>Bill: {numberValue(row.billing?.outstandingAmount, 0) > 0 ? "Outstanding" : "Clear"}</span>
                    </div>
                  </td>
                  <td><span className={`mortuary-pill ${row.bodyReleased ? "is-ok" : row.policeHold ? "is-hold" : "is-info"}`}>{row.status || "REGISTERED"}</span></td>
                  <td>
                    <div className="mortuary-row-actions" onClick={(event) => event.stopPropagation()}>
                      <button type="button" onClick={() => setDetailRecord(row)}><ModuleIcon name="description" /> View</button>
                      <button type="button" onClick={() => openModal("allocate", row)} disabled={Boolean(row.bodyReleased)}><ModuleIcon name="hotel" /> Store</button>
                      <button type="button" onClick={() => openModal("release", row)} disabled={Boolean(row.bodyReleased)}><ModuleIcon name="verified" /> Release</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pv-table-wrap">
          <div className="bed-table-title"><ModuleIcon name="analytics" /> MOH Statistics</div>
          <table className="pv-table">
            <tbody>
              <tr><td>Reporting month</td><td>{mohStats.month}</td></tr>
              <tr><td>Total deaths</td><td>{mohStats.total}</td></tr>
              <tr><td>Maternal deaths</td><td>{mohStats.maternal}</td></tr>
              <tr><td>Neonatal deaths</td><td>{mohStats.neonatal}</td></tr>
              <tr><td>Under-5 deaths</td><td>{mohStats.under5}</td></tr>
              <tr><td>Autopsy indicators</td><td>{mohStats.autopsy}</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      {modal === "reception" ? (
        <div className="module-form-overlay"><form className="module-form-panel modal-panel mortuary-modal" onSubmit={submitReception}>
          <MortuaryModalHeader title="Body Reception" icon="add_circle" onClose={() => setModal(null)} />
          <div className="module-form-body">
            {checkedInPatient?.patientId || checkedInPatient?.id ? <div className="mortuary-alert is-info"><ModuleIcon name="verified" /> Checked-in patient details were pre-filled for reception.</div> : null}
            <div className="module-form-grid">
              <MortuarySelect label="Source" value={reception.source} onChange={(v) => setReception({ ...reception, source: v })} options={["INTERNAL", "EXTERNAL"]} />
              <MortuaryInput label="Patient ID" value={reception.patientId} onChange={(v) => setReception({ ...reception, patientId: v })} disabled={reception.source === "EXTERNAL"} />
              <MortuaryInput label="Deceased name" value={reception.deceasedName} onChange={(v) => setReception({ ...reception, deceasedName: v })} required />
              <MortuaryInput label="Date/time of death" type="datetime-local" value={reception.dateOfDeath} onChange={(v) => setReception({ ...reception, dateOfDeath: v })} required />
              <MortuaryInput label="Cause/admitting diagnosis" value={reception.causeOfDeath} onChange={(v) => setReception({ ...reception, causeOfDeath: v })} />
              <MortuarySelect label="Death classification" value={reception.deathClassification} onChange={(v) => setReception({ ...reception, deathClassification: v })} options={["NATURAL", "EXPECTED", "UNEXPECTED", "SUDDEN", "TRAUMA", "SUSPECTED_POISONING", "SUSPECTED_SUICIDE", "SUSPECTED_HOMICIDE", "MATERNAL", "NEONATAL", "STILLBIRTH", "PAEDIATRIC", "UNKNOWN_CAUSE", "MEDICO_LEGAL", "OTHER"]} />
              <MortuaryInput label="Place of death" value={reception.placeOfDeath} onChange={(v) => setReception({ ...reception, placeOfDeath: v })} />
              <MortuaryInput label="Certifying doctor" value={reception.certifyingDoctor} onChange={(v) => setReception({ ...reception, certifyingDoctor: v })} />
              <MortuaryInput label="Attending department" value={reception.attendingDepartment} onChange={(v) => setReception({ ...reception, attendingDepartment: v })} />
              <MortuaryInput label="Ward" value={reception.ward} onChange={(v) => setReception({ ...reception, ward: v })} />
              <MortuaryInput label="Room" value={reception.room} onChange={(v) => setReception({ ...reception, room: v })} />
              <MortuaryInput label="Bed" value={reception.bed} onChange={(v) => setReception({ ...reception, bed: v })} />
              <MortuarySelect label="Received from" value={reception.bodyReceivedFrom} onChange={(v) => setReception({ ...reception, bodyReceivedFrom: v })} options={["Ward", "ICU", "Theatre", "Emergency", "Police", "Home", "Scene"]} />
              <MortuarySelect label="Body condition" value={reception.bodyCondition} onChange={(v) => setReception({ ...reception, bodyCondition: v })} options={["Fresh", "Early decomposition", "Advanced decomposition", "Embalmed", "Trauma"]} />
              <MortuaryInput label="Storage tray" value={reception.storageTray} onChange={(v) => setReception({ ...reception, storageTray: v })} required />
              <MortuaryInput label="Storage room" value={reception.storageRoom} onChange={(v) => setReception({ ...reception, storageRoom: v })} />
              <MortuaryInput label="Storage rack" value={reception.storageRack} onChange={(v) => setReception({ ...reception, storageRack: v })} />
              <MortuaryInput label="Personal belongings" value={reception.belongingsReceived} onChange={(v) => setReception({ ...reception, belongingsReceived: v })} />
              <MortuaryInput label="Body tag / barcode" value={reception.bodyTag} onChange={(v) => setReception({ ...reception, bodyTag: v })} placeholder="Optional tag or QR reference" />
              <MortuaryCheckbox label="Clinical identity verified against death documentation" checked={reception.identityVerified} onChange={(v) => setReception({ ...reception, identityVerified: v })} />
              <MortuaryCheckbox label="Medico-legal / police hold" checked={reception.policeHold} onChange={(v) => setReception({ ...reception, policeHold: v })} />
              <MortuaryInput label="Police case number" value={reception.policeCaseNumber} onChange={(v) => setReception({ ...reception, policeCaseNumber: v })} />
              <MortuaryTextarea label="Notes" value={reception.notes} onChange={(v) => setReception({ ...reception, notes: v })} />
            </div>
          </div>
          <MortuaryFooter saving={saving} label="Register Body" onCancel={() => setModal(null)} />
        </form></div>
      ) : null}

      {modal === "allocate" && selected ? (
        <MortuaryFormShell title="Cold Storage Assignment" icon="hotel" saving={saving} submitLabel="Assign Compartment" onClose={() => setModal(null)} onSubmit={(e) => submitForRecord(e, "allocate")}>
          <div className="module-form-grid">
            <MortuaryInput label="Storage unit" value={allocation.storageUnit} onChange={(v) => setAllocation({ ...allocation, storageUnit: v })} required />
            <MortuaryInput label="Room" value={allocation.storageRoom} onChange={(v) => setAllocation({ ...allocation, storageRoom: v })} />
            <MortuaryInput label="Rack" value={allocation.storageRack} onChange={(v) => setAllocation({ ...allocation, storageRack: v })} />
            <MortuaryInput label="Tray / compartment" value={allocation.storageTray} onChange={(v) => setAllocation({ ...allocation, storageTray: v })} required />
            <MortuaryCheckbox label="Police hold" checked={allocation.policeHold} onChange={(v) => setAllocation({ ...allocation, policeHold: v })} />
            <MortuaryTextarea label="Hold reason / notes" value={allocation.holdReason || allocation.notes} onChange={(v) => setAllocation({ ...allocation, holdReason: v, notes: v })} />
          </div>
        </MortuaryFormShell>
      ) : null}

      {modal === "certificate" && selected ? (
        <MortuaryFormShell title="Death Certificate" icon="badge" saving={saving} submitLabel="Issue Certificate" onClose={() => setModal(null)} onSubmit={(e) => submitForRecord(e, "certificate")}>
          <div className="module-form-grid">
            <MortuaryInput label="Certificate serial" value={certificate.certificateSerial} onChange={(v) => setCertificate({ ...certificate, certificateSerial: v })} required />
            <MortuaryInput label="Issued date" type="date" value={certificate.issuedAt} onChange={(v) => setCertificate({ ...certificate, issuedAt: v })} />
            <MortuaryInput label="Received by" value={certificate.receivedBy} onChange={(v) => setCertificate({ ...certificate, receivedBy: v })} required />
            <MortuaryInput label="Place of death" value={certificate.placeOfDeath} onChange={(v) => setCertificate({ ...certificate, placeOfDeath: v })} />
            <MortuaryInput label="Immediate cause" value={certificate.immediateCause} onChange={(v) => setCertificate({ ...certificate, immediateCause: v })} />
            <MortuaryInput label="Certifying doctor" value={certificate.certifyingDoctor} onChange={(v) => setCertificate({ ...certificate, certifyingDoctor: v })} />
            <MortuaryInput label="Doctor signature reference" value={certificate.doctorSignature} onChange={(v) => setCertificate({ ...certificate, doctorSignature: v })} />
            <MortuaryCheckbox label="Hospital stamp applied" checked={certificate.hospitalStamp} onChange={(v) => setCertificate({ ...certificate, hospitalStamp: v })} />
          </div>
        </MortuaryFormShell>
      ) : null}

      {modal === "police" && selected ? (
        <MortuaryFormShell title="Police / Coroner Case" icon="shield" saving={saving} submitLabel="Save Police Case" onClose={() => setModal(null)} onSubmit={(e) => submitForRecord(e, "police")}>
          <div className="module-form-grid">
            <MortuaryInput label="Police case / OB number" value={police.policeCaseNumber} onChange={(v) => setPolice({ ...police, policeCaseNumber: v })} required />
            <MortuaryInput label="Investigating officer" value={police.investigatingOfficer} onChange={(v) => setPolice({ ...police, investigatingOfficer: v })} />
            <MortuaryInput label="Police station" value={police.policeStation} onChange={(v) => setPolice({ ...police, policeStation: v })} />
            <MortuaryInput label="Police surgeon exam date" type="date" value={police.policeSurgeonExamDate} onChange={(v) => setPolice({ ...police, policeSurgeonExamDate: v })} />
            <MortuaryInput label="P3 / coroner reference" value={police.p3Reference} onChange={(v) => setPolice({ ...police, p3Reference: v })} />
            <MortuaryCheckbox label="Police clearance received" checked={police.clearanceReceived} onChange={(v) => setPolice({ ...police, clearanceReceived: v })} />
            <MortuaryInput label="Clearance document ref" value={police.clearanceDocument} onChange={(v) => setPolice({ ...police, clearanceDocument: v })} />
          </div>
        </MortuaryFormShell>
      ) : null}

      {modal === "embalming" && selected ? (
        <MortuaryFormShell title="Embalming Record" icon="clinical_clipboard" saving={saving} submitLabel="Save Embalming" onClose={() => setModal(null)} onSubmit={(e) => submitForRecord(e, "embalming")}>
          <div className="module-form-grid">
            <MortuaryInput label="Date/time" type="datetime-local" value={embalming.embalmedAt} onChange={(v) => setEmbalming({ ...embalming, embalmedAt: v })} />
            <MortuaryInput label="Fluid type" value={embalming.fluidType} onChange={(v) => setEmbalming({ ...embalming, fluidType: v })} required />
            <MortuaryInput label="Fluid volume ml" type="number" value={embalming.fluidVolumeMl} onChange={(v) => setEmbalming({ ...embalming, fluidVolumeMl: v })} />
            <MortuaryInput label="Technique" value={embalming.techniqueUsed} onChange={(v) => setEmbalming({ ...embalming, techniqueUsed: v })} />
            <MortuaryInput label="Duration minutes" type="number" value={embalming.durationMinutes} onChange={(v) => setEmbalming({ ...embalming, durationMinutes: v })} />
            <MortuaryInput label="External contractor" value={embalming.contractorName} onChange={(v) => setEmbalming({ ...embalming, contractorName: v })} />
            <MortuaryInput label="Embalming fee" type="number" value={embalming.feeAmount} onChange={(v) => setEmbalming({ ...embalming, feeAmount: v })} />
          </div>
        </MortuaryFormShell>
      ) : null}

      {modal === "release" && selected ? (
        <MortuaryFormShell title="Body Release Clearance" icon="verified" saving={saving} submitLabel="Release Body" onClose={() => setModal(null)} onSubmit={(e) => submitForRecord(e, "release")}>
          <div className="mortuary-clearance-grid">
            <MortuaryCheckbox label="Financial clearance" checked={release.paymentVerified} onChange={(v) => setRelease({ ...release, paymentVerified: v })} />
            <MortuaryCheckbox label="Death certificate issued" checked={release.deathCertificateIssued} onChange={(v) => setRelease({ ...release, deathCertificateIssued: v, docsVerified: v })} />
            <MortuaryCheckbox label="Legal clearance" checked={release.legalClearanceVerified} onChange={(v) => setRelease({ ...release, legalClearanceVerified: v })} />
            <MortuaryCheckbox label="Identity verified" checked={release.signatureCaptured} onChange={(v) => setRelease({ ...release, signatureCaptured: v })} />
            {selected.policeHold ? <MortuaryCheckbox label="Police release verified" checked={release.policeClearanceVerified} onChange={(v) => setRelease({ ...release, policeClearanceVerified: v })} /> : null}
          </div>
          <div className="module-form-grid">
            <MortuaryInput label="Released to" value={release.releasedToName} onChange={(v) => setRelease({ ...release, releasedToName: v })} required />
            <MortuaryInput label="Collector national ID" value={release.releasedToNationalId} onChange={(v) => setRelease({ ...release, releasedToNationalId: v })} />
            <MortuaryInput label="Phone" value={release.releasedToPhone} onChange={(v) => setRelease({ ...release, releasedToPhone: v })} />
            <MortuaryInput label="Relationship" value={release.relationship} onChange={(v) => setRelease({ ...release, relationship: v })} />
            <MortuaryInput label="Release document no." value={release.releaseCertificateNo} onChange={(v) => setRelease({ ...release, releaseCertificateNo: v })} />
            <MortuaryInput label="Bill amount" type="number" value={release.billAmount} onChange={(v) => setRelease({ ...release, billAmount: v })} />
            <MortuaryInput label="Paid amount" type="number" value={release.paidAmount} onChange={(v) => setRelease({ ...release, paidAmount: v })} />
          </div>
        </MortuaryFormShell>
      ) : null}

      {detailRecord ? (
        <div className="mortuary-detail-backdrop" onClick={() => setDetailRecord(null)}>
          <aside className="mortuary-detail-panel" onClick={(event) => event.stopPropagation()}>
            <div className="mortuary-detail-header">
              <div>
                <span>Mortuary Record</span>
                <h2>{detailRecord.deceasedName || "Unnamed body"}</h2>
                <p>{detailRecord.mortuaryNumber || detailRecord.id.slice(0, 8)}</p>
              </div>
              <button type="button" onClick={() => setDetailRecord(null)} aria-label="Close detail panel">x</button>
            </div>
            <div className="mortuary-detail-actions">
              <button type="button" onClick={() => { setDetailRecord(null); openModal("allocate", detailRecord); }} disabled={Boolean(detailRecord.bodyReleased)}><ModuleIcon name="hotel" /> Storage</button>
              <button type="button" onClick={() => { setDetailRecord(null); openModal("certificate", detailRecord); }} disabled={Boolean(detailRecord.bodyReleased)}><ModuleIcon name="badge" /> Certificate</button>
              <button type="button" onClick={() => { setDetailRecord(null); openModal("police", detailRecord); }} disabled={Boolean(detailRecord.bodyReleased)}><ModuleIcon name="shield" /> Police</button>
              <button type="button" onClick={() => { setDetailRecord(null); openModal("embalming", detailRecord); }} disabled={Boolean(detailRecord.bodyReleased)}><ModuleIcon name="clinical_clipboard" /> Embalming</button>
              <button type="button" onClick={() => { setDetailRecord(null); openModal("release", detailRecord); }} disabled={Boolean(detailRecord.bodyReleased)}><ModuleIcon name="verified" /> Release</button>
            </div>
            <div className="mortuary-detail-body">
              <MortuaryDetailSection title="Identity" rows={[
                ["Mortuary ref", detailRecord.mortuaryNumber || detailRecord.id],
                ["Source", detailRecord.source || "EXTERNAL"],
                ["MRN / Patient code", detailRecord.patientCode || "Not recorded"],
                ["Patient ID", detailRecord.patientId || "Not linked"],
                ["National ID", detailRecord.nationalId || "Not recorded"],
                ["Gender / age", `${detailRecord.gender || "Unknown"} / ${detailRecord.age ?? "Unknown"}`],
              ]} />
              <MortuaryDetailSection title="Reception & Certification" rows={[
                ["Date of death", formatDate(detailRecord.dateOfDeath)],
                ["Place of death", detailRecord.placeOfDeath || "Not recorded"],
                ["Death classification", detailRecord.deathClassification || "Unknown"],
                ["Cause of death", detailRecord.causeOfDeath || "Not recorded"],
                ["Certifying doctor", detailRecord.certifyingDoctor || "Not recorded"],
                ["Identity verified", detailRecord.identityVerified ? "Yes" : "Not recorded"],
                ["Body tag", detailRecord.bodyTag || "Not recorded"],
                ["Days in mortuary", `${detailRecord.daysInMortuary || 0}`],
                ["Notes", detailRecord.notes || "None"],
              ]} />
              <MortuaryDetailSection title="Next of Kin" rows={[
                ["Name", detailRecord.nextOfKinName || "Not recorded"],
                ["Phone", detailRecord.nextOfKinPhone || "Not recorded"],
              ]} />
              <MortuaryDetailSection title="Storage" rows={[
                ["Unit", detailRecord.storage?.unit || "Unassigned"],
                ["Room", detailRecord.storage?.room || "Unassigned"],
                ["Rack", detailRecord.storage?.rack || "Unassigned"],
                ["Tray", detailRecord.storage?.tray || "Unassigned"],
              ]} />
              <MortuaryDetailSection title="Clearance" rows={[
                ["Death certificate", detailRecord.certificate?.certificateSerial || "Pending"],
                ["Certificate receiver", detailRecord.certificate?.receivedBy || "Not recorded"],
                ["Police status", detailRecord.policeHold ? detailRecord.police?.clearanceReceived ? "Cleared" : "On hold" : "Not applicable"],
                ["Police case", detailRecord.police?.policeCaseNumber || detailRecord.policeCaseNumber || "Not recorded"],
                ["Investigating officer", detailRecord.police?.investigatingOfficer || "Not recorded"],
                ["Police station", detailRecord.police?.policeStation || "Not recorded"],
                ["Billing", numberValue(detailRecord.billing?.outstandingAmount, 0) > 0 ? `Outstanding ${detailRecord.billing?.outstandingAmount}` : "Clear"],
              ]} />
              <MortuaryDetailSection title="Embalming & Release" rows={[
                ["Embalming", detailRecord.embalming?.embalmedAt ? `${formatDate(detailRecord.embalming.embalmedAt)} - ${detailRecord.embalming.fluidType || "Fluid not recorded"}` : "Not recorded"],
                ["Embalming fee", String(detailRecord.embalming?.feeAmount || 0)],
                ["Released", detailRecord.bodyReleased ? "Yes" : "No"],
                ["Released to", detailRecord.release?.releasedToName || "Not released"],
                ["Release date", detailRecord.release?.releaseDate ? formatDate(detailRecord.release.releaseDate) : "Not released"],
              ]} />
            </div>
          </aside>
        </div>
      ) : null}

      {notice ? <div className={`module-notice-toast is-${noticeTone(notice)}`}><div><strong>Mortuary</strong><span>{notice}</span></div><button type="button" className="module-notice-close" onClick={() => setNotice("")}>x</button></div> : null}
    </div>
  );
}

function MortuaryModalHeader({ title, icon, onClose }: { title: string; icon: string; onClose: () => void }) {
  return <div className="module-form-header"><div className="module-form-heading"><div className="module-form-icon"><ModuleIcon name={icon} /></div><div><div className="module-form-kicker">Mortuary</div><h2 className="module-form-title">{title}</h2></div></div><button type="button" className="modal-close-btn" onClick={onClose}>x</button></div>;
}

function MortuaryFooter({ saving, label, onCancel }: { saving: boolean; label: string; onCancel: () => void }) {
  return <div className="module-form-footer"><button type="button" className="form-btn form-btn-cancel" onClick={onCancel}>Cancel</button><button type="submit" className="form-btn form-btn-primary module-form-submit" disabled={saving}>{saving ? "Saving..." : label}</button></div>;
}

function MortuaryFormShell({ title, icon, saving, submitLabel, onClose, onSubmit, children }: { title: string; icon: string; saving: boolean; submitLabel: string; onClose: () => void; onSubmit: (event: FormEvent) => void; children: ReactNode }) {
  return <div className="module-form-overlay"><form className="module-form-panel modal-panel mortuary-modal" onSubmit={onSubmit}><MortuaryModalHeader title={title} icon={icon} onClose={onClose} /><div className="module-form-body">{children}</div><MortuaryFooter saving={saving} label={submitLabel} onCancel={onClose} /></form></div>;
}

function MortuaryInput({ label, value, onChange, type = "text", required, disabled, placeholder }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean; disabled?: boolean; placeholder?: string }) {
  return <label className="module-form-field"><span className="form-label">{label}</span><input className="module-form-input" type={type} value={value} onChange={(event) => onChange(event.target.value)} required={required} disabled={disabled} placeholder={placeholder} /></label>;
}

function MortuaryTextarea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="module-form-field is-wide"><span className="form-label">{label}</span><textarea className="module-form-input min-h-[100px]" value={value} onChange={(event) => onChange(event.target.value)} /></label>;
}

function MortuarySelect({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) {
  return <label className="module-form-field"><span className="form-label">{label}</span><select className="module-form-input" value={value} onChange={(event) => onChange(event.target.value)}>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>;
}

function MortuaryCheckbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return <label className="mortuary-check"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} /><span>{label}</span></label>;
}

function MortuaryDetailSection({ title, rows }: { title: string; rows: Array<[string, string]> }) {
  return (
    <section className="mortuary-detail-section">
      <h3>{title}</h3>
      <dl>
        {rows.map(([label, value], index) => (
          <div key={`${label}-${index}`}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
