import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { ModuleIcon } from "../components/layout/ModuleIcon";
import { ModuleReferenceForms } from "../components/ModuleReferenceForms";
import { api } from "../lib/api";
import { useLiveRefresh } from "../lib/liveRefresh";

type BedStatus = "AVAILABLE" | "OCCUPIED" | "CLEANING" | "RESERVED" | "MAINTENANCE" | "BLOCKED" | "OUT_OF_SERVICE" | "TRANSFER_PENDING";

type BedRecord = {
  id?: string;
  bedNumber?: string;
  status?: string;
  bedType?: string;
  dailyRate?: number;
  allocations?: Array<{
    allocatedAt?: string;
    inpatient?: AdmissionRecord;
  }>;
};

type WardRecord = {
  id?: string;
  name: string;
  type?: string;
  wardType?: string;
  capacity?: number;
  totalBeds?: number;
  beds?: BedRecord[];
};

type AdmissionRecord = {
  id?: string;
  admissionDate?: string;
  status?: string;
  lengthOfStayDays?: number;
  patient?: {
    firstName?: string;
    middleName?: string;
    lastName?: string;
    patientCode?: string;
  };
  visit?: {
    chiefComplaint?: string;
  };
  currentBed?: BedRecord & { ward?: WardRecord };
  initialDiagnosis?: string;
  admissionReason?: string;
};

type TransferRow = {
  id?: string;
  transferDate?: string;
  reason?: string;
  fromBed?: BedRecord & { ward?: WardRecord };
  toBed?: BedRecord & { ward?: WardRecord };
};

type ModalState =
  | { type: "assign"; bed?: BedRecord; ward?: WardRecord }
  | { type: "status"; bed: BedRecord; ward: WardRecord };

const normalizeStatus = (status?: string): BedStatus => {
  const value = String(status || "AVAILABLE").toUpperCase();
  if (value === "OCCUPIED") return "OCCUPIED";
  if (value === "CLEANING" || value === "DIRTY") return "CLEANING";
  if (value === "RESERVED") return "RESERVED";
  if (value === "MAINTENANCE" || value === "CLOSED") return "MAINTENANCE";
  if (value === "BLOCKED") return "BLOCKED";
  if (value === "OUT_OF_SERVICE" || value === "DECOMMISSIONED") return "OUT_OF_SERVICE";
  if (value === "TRANSFER_PENDING") return "TRANSFER_PENDING";
  return "AVAILABLE";
};

const statusLabel = (status?: string) =>
  ({
    AVAILABLE: "Available",
    OCCUPIED: "Occupied",
    CLEANING: "Cleaning",
    RESERVED: "Reserved",
    MAINTENANCE: "Maintenance",
    BLOCKED: "Blocked",
    OUT_OF_SERVICE: "Out of service",
    TRANSFER_PENDING: "Transfer pending",
  })[normalizeStatus(status)];

const patientName = (row?: AdmissionRecord) => {
  const name = [row?.patient?.firstName, row?.patient?.middleName, row?.patient?.lastName]
    .map((part) => String(part || "").trim())
    .filter(Boolean)
    .join(" ");
  return name || "Unknown patient";
};

const bedPatient = (bed: BedRecord) => bed.allocations?.find((item) => item.inpatient)?.inpatient;
const hasActivePatient = (bed: BedRecord) => normalizeStatus(bed.status) === "OCCUPIED" && Boolean(bedPatient(bed));

const diagnosisText = (row?: AdmissionRecord) =>
  String(row?.initialDiagnosis || row?.admissionReason || row?.visit?.chiefComplaint || "Diagnosis not recorded");

const daysOccupied = (bed: BedRecord) => {
  const allocation = bed.allocations?.[0];
  const raw = allocation?.allocatedAt || allocation?.inpatient?.admissionDate;
  if (!raw) return 0;
  const start = new Date(raw).getTime();
  if (!Number.isFinite(start)) return 0;
  return Math.max(1, Math.ceil((Date.now() - start) / 86400000));
};

const bedLabel = (bed?: BedRecord & { ward?: WardRecord }) => {
  if (!bed) return "Unassigned";
  return `${bed.ward?.name || "Ward"} / ${bed.bedNumber || "Bed"}`;
};

const noticeTone = (message: string) => {
  const lower = message.toLowerCase();
  if (lower.includes("failed") || lower.includes("error")) return "error";
  if (lower.includes("warning") || lower.includes("90%") || lower.includes("100%")) return "warning";
  if (lower.includes("updated") || lower.includes("assigned") || lower.includes("available")) return "success";
  return "info";
};
const noticeIcon = (message: string) => {
  const tone = noticeTone(message);
  if (tone === "error") return "error";
  if (tone === "warning") return "warning";
  if (tone === "success") return "check_circle";
  return "notifications_active";
};

const isRealId = (id?: string) => Boolean(id && !id.startsWith("demo-"));

export default function WardView() {
  const [wards, setWards] = useState<WardRecord[]>([]);
  const [admissions, setAdmissions] = useState<AdmissionRecord[]>([]);
  const [transferHistory, setTransferHistory] = useState<TransferRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | BedStatus>("all");
  const [wardFilter, setWardFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [capabilityFilter, setCapabilityFilter] = useState("all");
  const [selectedAdmissionId, setSelectedAdmissionId] = useState("");
  const [statusValue, setStatusValue] = useState<BedStatus>("AVAILABLE");
  const [statusNote, setStatusNote] = useState("");
  const [modal, setModal] = useState<ModalState | null>(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!notice) return undefined;
    const timeout = window.setTimeout(() => setNotice(""), noticeTone(notice) === "error" ? 7000 : 4200);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [wardRes, admissionRes, transferRes] = await Promise.allSettled([
        api.get("/wards"),
        api.get("/ipd/active"),
        api.get("/wards/transfer-history"),
      ]);
      if (wardRes.status === "fulfilled") {
        const payload = wardRes.value.data;
        const rows = Array.isArray(payload) ? payload : Array.isArray(payload?.rows) ? payload.rows : Array.isArray(payload?.data) ? payload.data : [];
        setWards(rows);
      } else {
        setWards([]);
        const status = Number(wardRes.reason?.response?.status || 0);
        const serverMessage = String(wardRes.reason?.response?.data?.message || "").trim();
        if (status === 401) {
          setNotice("Your HMIS session has expired. Please log in again to load live ward and bed data.");
        } else if (status === 403) {
          setNotice("You do not have permission to view Bed & Ward data. Ask an administrator to enable the Bed & Ward module.");
        } else {
          setNotice(`Ward data failed to load${serverMessage ? `: ${serverMessage}` : ""}. No sample beds are shown because live bed status must remain authoritative.`);
        }
      }
      if (admissionRes.status === "fulfilled") {
        const payload = admissionRes.value.data;
        setAdmissions(Array.isArray(payload) ? payload : Array.isArray(payload?.rows) ? payload.rows : Array.isArray(payload?.data) ? payload.data : []);
      } else {
        setAdmissions([]);
        if (wardRes.status === "fulfilled") setNotice("Ward data loaded, but active IPD admissions could not be fetched.");
      }
      if (transferRes.status === "fulfilled") {
        const payload = transferRes.value.data;
        setTransferHistory(Array.isArray(payload) ? payload : Array.isArray(payload?.rows) ? payload.rows : Array.isArray(payload?.data) ? payload.data : []);
      } else {
        setTransferHistory([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  useLiveRefresh(loadData, { intervalMs: 30000 });

  const allBeds = useMemo(
    () => wards.flatMap((ward) => (ward.beds || []).map((bed) => ({ ...bed, ward }))),
    [wards],
  );

  const stats = useMemo(() => {
    const total = allBeds.length || wards.reduce((sum, ward) => sum + Number(ward.totalBeds || ward.capacity || 0), 0);
    const occupied = allBeds.filter((bed) => normalizeStatus(bed.status) === "OCCUPIED").length;
    const available = allBeds.filter((bed) => normalizeStatus(bed.status) === "AVAILABLE").length;
    const cleaning = allBeds.filter((bed) => normalizeStatus(bed.status) === "CLEANING").length;
    const reserved = allBeds.filter((bed) => normalizeStatus(bed.status) === "RESERVED").length;
    const maintenance = allBeds.filter((bed) => normalizeStatus(bed.status) === "MAINTENANCE").length;
    const blocked = allBeds.filter((bed) => ["BLOCKED", "OUT_OF_SERVICE"].includes(normalizeStatus(bed.status))).length;
    const occupancy = total ? Math.round((occupied / total) * 100) : 0;
    return { total, occupied, available, cleaning, reserved, maintenance, blocked, occupancy };
  }, [allBeds, wards]);

  const assignableAdmissions = useMemo(
    () => admissions.filter((row) => !row.currentBed && ["ADMITTED", "UNDER_TREATMENT", "TRANSFERRED", "DISCHARGE_REQUESTED"].includes(String(row.status || "ADMITTED").toUpperCase())),
    [admissions],
  );

  const filteredWards = useMemo(() => {
    const q = search.trim().toLowerCase();
    return wards
      .map((ward) => {
        const beds = ward.beds || [];
        const nextBeds = beds.filter((bed) => {
          const patient = bedPatient(bed);
          const text = `${ward.name} ${ward.type || ""} ${ward.wardType || ""} ${bed.bedNumber || ""} ${statusLabel(bed.status)} ${patientName(patient)} ${diagnosisText(patient)}`.toLowerCase();
          const statusMatch = filter === "all" || normalizeStatus(bed.status) === filter;
          const wardMatch = wardFilter === "all" || String(ward.id || ward.name) === wardFilter;
          const categoryMatch = categoryFilter === "all" || String(bed.bedType || "").toUpperCase() === categoryFilter;
          const capabilityMatch = capabilityFilter === "all" || Boolean((bed as any)?.[capabilityFilter] || (bed as any)?.capabilities?.[capabilityFilter]);
          return statusMatch && wardMatch && categoryMatch && capabilityMatch && (!q || text.includes(q));
        });
        return { ...ward, beds: nextBeds };
      })
      .filter((ward) => (ward.beds || []).length > 0 || !q);
  }, [wards, search, filter, wardFilter, categoryFilter, capabilityFilter]);

  const bedCategories = useMemo(() => Array.from(new Set(allBeds.map((bed) => String(bed.bedType || "").trim().toUpperCase()).filter(Boolean))).sort(), [allBeds]);

  const wardRows = useMemo(
    () =>
      wards.map((ward) => {
        const beds = ward.beds || [];
        const total = beds.length || Number(ward.totalBeds || ward.capacity || 0);
        const occupied = beds.filter((bed) => normalizeStatus(bed.status) === "OCCUPIED").length;
        const available = beds.filter((bed) => normalizeStatus(bed.status) === "AVAILABLE").length;
        const occupancy = total ? Math.round((occupied / total) * 100) : 0;
        return {
          id: ward.id || ward.name,
          name: ward.name,
          type: ward.type || ward.wardType || "General",
          total,
          occupied,
          available,
          cleaning: beds.filter((bed) => normalizeStatus(bed.status) === "CLEANING").length,
          occupancy,
        };
      }),
    [wards],
  );

  const openStatusModal = (ward: WardRecord, bed: BedRecord) => {
    setStatusValue(normalizeStatus(bed.status));
    setStatusNote("");
    setModal({ type: "status", ward, bed });
  };

  const openAssignModal = (ward?: WardRecord, bed?: BedRecord) => {
    setSelectedAdmissionId(assignableAdmissions[0]?.id || "");
    setModal({ type: "assign", ward, bed });
  };

  const saveStatus = async (event: FormEvent) => {
    event.preventDefault();
    if (!modal || modal.type !== "status") return;
    if (hasActivePatient(modal.bed) && statusValue !== "OCCUPIED") {
      setNotice("Occupied beds must be released through inpatient discharge or bed transfer.");
      return;
    }
    setSaving(true);
    try {
      if (isRealId(modal.bed.id)) {
        await api.patch(`/beds/${modal.bed.id}/status`, { status: statusValue });
      }
      try {
        await api.post("/module-actions", {
          module: "wards",
          action: statusValue === "AVAILABLE" ? "Cleaning Workflow Completed" : "Bed Status Update",
          data: {
            bedId: modal.bed.id,
            bedNumber: modal.bed.bedNumber,
            ward: modal.ward.name,
            status: statusValue,
            note: statusNote,
          },
          context: { title: "Bed & Ward" },
        });
      } catch {
        // Status update is the source of truth; action logging is best effort.
      }
      setNotice(statusValue === "AVAILABLE" ? "Bed marked available after cleaning." : "Bed status updated.");
      setModal(null);
      await loadData();
    } catch (err: any) {
      setNotice(`Bed status update failed: ${err?.response?.data?.message || err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const assignBed = async (event: FormEvent) => {
    event.preventDefault();
    if (!modal || modal.type !== "assign" || !modal.bed?.id || !selectedAdmissionId) {
      setNotice("Select an admission and an available bed before assigning.");
      return;
    }
    setSaving(true);
    try {
      if (!isRealId(modal.bed.id)) throw new Error("Sample beds cannot be assigned. Load live ward beds first.");
      await api.post(`/ipd/${selectedAdmissionId}/allocate-bed`, { bedId: modal.bed.id });
      try {
        await api.post("/module-actions", {
          module: "wards",
          action: "Bed Request and Assignment",
          data: {
            inpatientId: selectedAdmissionId,
            bedId: modal.bed.id,
            bedNumber: modal.bed.bedNumber,
            ward: modal.ward?.name,
          },
          context: { title: "Bed & Ward" },
        });
      } catch {
        // Assignment succeeded; action logging is best effort.
      }
      setNotice("Bed assigned. Patient and diagnosis now appear on the ward map.");
      setModal(null);
      await loadData();
    } catch (err: any) {
      setNotice(`Bed assignment failed: ${err?.response?.data?.message || err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const availableBeds = allBeds.filter((bed) => normalizeStatus(bed.status) === "AVAILABLE");

  return (
    <div className="patients-view bed-ward-view">
      <div className="pv-header">
        <div>
          <div className="pv-title flex items-center gap-2">
            <ModuleIcon name="hotel" />
            Bed & Ward Control
          </div>
          <div className="pv-subtitle">Real-time bed map, admissions assignment, cleaning, occupancy, and transfer history</div>
        </div>
        <div className="module-actions">
          <button type="button" onClick={() => openAssignModal(undefined, availableBeds[0])} disabled={availableBeds.length === 0}>
            <ModuleIcon name="add_circle" /> Assign Bed
          </button>
          <button type="button" onClick={loadData}>
            <ModuleIcon name="sync_alt" /> Refresh Map
          </button>
          <ModuleReferenceForms moduleKey="wards" moduleTitle="Bed & Ward Control" onSaved={loadData} />
        </div>
      </div>

      <div className="pv-stats bed-occupancy-stats">
        <div className="pv-stat-card" style={{ borderLeftColor: "#0f766e" }}>
          <p className="pv-stat-label">Total Beds</p>
          <p className="pv-stat-value">{stats.total}</p>
        </div>
        <div className="pv-stat-card" style={{ borderLeftColor: "#dc2626" }}>
          <p className="pv-stat-label">Occupied</p>
          <p className="pv-stat-value">{stats.occupied}</p>
        </div>
        <div className="pv-stat-card" style={{ borderLeftColor: "#16a34a" }}>
          <p className="pv-stat-label">Available</p>
          <p className="pv-stat-value">{stats.available}</p>
        </div>
        <div className="pv-stat-card" style={{ borderLeftColor: "#f59e0b" }}>
          <p className="pv-stat-label">Cleaning</p>
          <p className="pv-stat-value">{stats.cleaning}</p>
        </div>
        <div className="pv-stat-card" style={{ borderLeftColor: "#2563eb" }}>
          <p className="pv-stat-label">Reserved</p>
          <p className="pv-stat-value">{stats.reserved}</p>
        </div>
        <div className="pv-stat-card" style={{ borderLeftColor: "#475569" }}>
          <p className="pv-stat-label">Blocked / OOS</p>
          <p className="pv-stat-value">{stats.blocked}</p>
        </div>
        <div className="pv-stat-card" style={{ borderLeftColor: "#64748b" }}>
          <p className="pv-stat-label">Occupancy</p>
          <p className="pv-stat-value">{stats.occupancy}%</p>
        </div>
      </div>

      {stats.occupancy >= 90 ? (
        <div className={`bed-occupancy-alert ${stats.occupancy >= 100 ? "is-critical" : ""}`}>
          <ModuleIcon name="notifications_active" />
          {stats.occupancy >= 100
            ? "100% occupancy: alert the medical superintendent and admission desk."
            : "Occupancy is above 90%: bed management review is required."}
        </div>
      ) : null}

      <div className="pv-search-bar">
        <div className="pv-search-wrap">
          <ModuleIcon name="search" />
          <input
            className="pv-search"
            placeholder="Search wards, beds, patient names, diagnoses"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <div className="bed-map-filters" aria-label="Filter bed status">
          {[
            ["all", "All"],
            ["AVAILABLE", "Available"],
            ["OCCUPIED", "Occupied"],
            ["CLEANING", "Cleaning"],
            ["RESERVED", "Reserved"],
            ["MAINTENANCE", "Maintenance"],
            ["BLOCKED", "Blocked"],
            ["OUT_OF_SERVICE", "Out of service"],
            ["TRANSFER_PENDING", "Transfer pending"],
          ].map(([key, label]) => (
            <button key={key} type="button" className={filter === key ? "active" : ""} onClick={() => setFilter(key as typeof filter)}>
              {label}
            </button>
          ))}
        </div>
        <div className="bed-map-advanced-filters">
          <select value={wardFilter} onChange={(event) => setWardFilter(event.target.value)} aria-label="Filter by ward">
            <option value="all">All wards</option>
            {wards.map((ward) => <option key={ward.id || ward.name} value={String(ward.id || ward.name)}>{ward.name}</option>)}
          </select>
          <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} aria-label="Filter by bed category">
            <option value="all">All categories</option>
            {bedCategories.map((category) => <option key={category} value={category}>{category}</option>)}
          </select>
          <select value={capabilityFilter} onChange={(event) => setCapabilityFilter(event.target.value)} aria-label="Filter by bed capability">
            <option value="all">All capabilities</option>
            <option value="oxygenPort">Oxygen</option>
            <option value="suction">Suction</option>
            <option value="cardiacMonitor">Cardiac monitoring</option>
            <option value="negativePressure">Negative pressure</option>
            <option value="isolation">Isolation</option>
            <option value="bariatric">Bariatric</option>
          </select>
        </div>
      </div>

      <section className="bed-map-board">
        <div className="bed-map-toolbar">
          <div className="bed-map-legend">
            <span><i className="bed-dot empty" /> Available</span>
            <span><i className="bed-dot occupied" /> Occupied</span>
            <span><i className="bed-dot cleaning" /> Cleaning</span>
            <span><i className="bed-dot reserved" /> Reserved</span>
            <span><i className="bed-dot maintenance" /> Maintenance</span>
            <span><i className="bed-dot blocked" /> Blocked</span>
          </div>
          <div className="bed-map-live">
            <ModuleIcon name="my_location" /> Updates every 30 seconds
          </div>
        </div>

        <div className="bed-map-wards">
          {filteredWards.map((ward) => {
            const beds = ward.beds || [];
            return (
              <article key={ward.id || ward.name} className="bed-map-ward">
                <div className="bed-map-ward-head">
                  <div>
                    <h3>{ward.name}</h3>
                    <p>{ward.type || ward.wardType || "General ward"}</p>
                  </div>
                  <div className="bed-map-ward-actions">
                    <span>{beds.filter((bed) => normalizeStatus(bed.status) === "OCCUPIED").length}/{beds.length || ward.totalBeds || ward.capacity || 0} occupied</span>
                  </div>
                </div>
                <div className="bed-map-grid">
                  {beds.length === 0 ? (
                    <div className="bed-map-empty">No beds match this filter.</div>
                  ) : beds.map((bed) => {
                    const status = normalizeStatus(bed.status);
                    const patient = bedPatient(bed);
                    return (
                      <div key={bed.id || bed.bedNumber} className={`bed-tile ${status.toLowerCase()}`}>
                        <button type="button" className="bed-tile-main" onClick={() => openStatusModal(ward, bed)}>
                          <div className="bed-tile-top">
                            <strong><ModuleIcon name="hotel" /> {bed.bedNumber || "Bed"}</strong>
                            <span>{statusLabel(status)}</span>
                          </div>
                          {status === "OCCUPIED" ? (
                            <div className="bed-occupant">
                              <b>{patientName(patient)}</b>
                              <small>{diagnosisText(patient)}</small>
                              <small>{daysOccupied(bed)} day{daysOccupied(bed) === 1 ? "" : "s"} occupied</small>
                            </div>
                          ) : status === "CLEANING" ? (
                            <div className="bed-occupant muted">
                              <b>Housekeeping required</b>
                              <small>Mark available after cleaning</small>
                            </div>
                          ) : (
                            <div className="bed-occupant muted">
                              <b>{statusLabel(status)}</b>
                              <small>{status === "AVAILABLE" ? "Ready for allocation" : "Not assignable"}</small>
                            </div>
                          )}
                        </button>
                        <div className="bed-tile-actions">
                          {status === "AVAILABLE" ? (
                            <button type="button" onClick={() => openAssignModal(ward, bed)}>
                              <ModuleIcon name="add_circle" /> Assign
                            </button>
                          ) : status === "CLEANING" ? (
                            <button type="button" onClick={() => { setStatusValue("AVAILABLE"); setStatusNote("Housekeeping completed"); setModal({ type: "status", ward, bed }); }}>
                              <ModuleIcon name="cleaning_services" /> Available
                            </button>
                          ) : (
                            <button type="button" onClick={() => openStatusModal(ward, bed)}>
                              <ModuleIcon name="description" /> Status
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <div className="bed-ward-tables">
        <div className="pv-table-wrap">
          <div className="bed-table-title">
            <ModuleIcon name="analytics" /> Occupancy Dashboard
          </div>
          <table className="pv-table">
            <thead>
              <tr>
                <th>Ward</th>
                <th>Type</th>
                <th>Total</th>
                <th>Occupied</th>
                <th>Available</th>
                <th>Cleaning</th>
                <th>Occupancy</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="pv-empty">Loading bed and ward data...</td></tr>
              ) : wardRows.length === 0 ? (
                <tr><td colSpan={7} className="pv-empty">No wards found.</td></tr>
              ) : wardRows.map((row) => (
                <tr key={row.id}>
                  <td className="pv-name">{row.name}</td>
                  <td>{row.type}</td>
                  <td>{row.total}</td>
                  <td>{row.occupied}</td>
                  <td>{row.available}</td>
                  <td>{row.cleaning}</td>
                  <td><span className={`pv-badge ${row.occupancy >= 90 ? "is-critical" : ""}`}>{row.occupancy}%</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pv-table-wrap">
          <div className="bed-table-title">
            <ModuleIcon name="route" /> Bed Transfer History
          </div>
          <table className="pv-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>From</th>
                <th>To</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              {transferHistory.length === 0 ? (
                <tr><td colSpan={4} className="pv-empty">No transfer history recorded yet.</td></tr>
              ) : transferHistory.slice(0, 10).map((row) => (
                <tr key={row.id || `${row.fromBed?.id}-${row.toBed?.id}-${row.transferDate}`}>
                  <td>{row.transferDate ? new Date(row.transferDate).toLocaleString() : "Not recorded"}</td>
                  <td>{bedLabel(row.fromBed)}</td>
                  <td>{bedLabel(row.toBed)}</td>
                  <td>{row.reason || "Clinical transfer"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal?.type === "assign" ? (
        <div className="module-form-overlay">
          <form className="module-form-panel modal-panel module-form-panel-wards" onSubmit={assignBed}>
            <div className="module-form-header">
              <div className="module-form-heading">
                <div className="module-form-icon"><ModuleIcon name="add_circle" /></div>
                <div>
                  <div className="module-form-kicker">Bed request and assignment</div>
                  <h2 className="module-form-title">{modal.ward?.name || "Available beds"}</h2>
                </div>
              </div>
              <button type="button" className="modal-close-btn" onClick={() => setModal(null)} aria-label="Close">x</button>
            </div>
            <div className="module-form-body">
              <div className="module-form-grid">
                <label className="module-form-field">
                  <span className="form-label">Admission awaiting bed</span>
                  <select className="module-form-input" value={selectedAdmissionId} onChange={(event) => setSelectedAdmissionId(event.target.value)} required>
                    <option value="">Select admission</option>
                    {assignableAdmissions.map((row) => (
                      <option key={row.id} value={row.id}>
                        {patientName(row)} - {diagnosisText(row)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="module-form-field">
                  <span className="form-label">Available bed</span>
                  <select
                    className="module-form-input"
                    value={modal.bed?.id || ""}
                    onChange={(event) => {
                      const next = availableBeds.find((bed) => bed.id === event.target.value);
                      if (next) setModal({ type: "assign", bed: next, ward: next.ward });
                    }}
                    required
                  >
                    <option value="">Select bed</option>
                    {availableBeds.map((bed) => (
                      <option key={bed.id} value={bed.id}>{bedLabel(bed)}</option>
                    ))}
                  </select>
                </label>
              </div>
              {assignableAdmissions.length === 0 ? (
                <div className="bed-occupancy-alert">
                  <ModuleIcon name="description" /> No admitted patients are waiting for bed assignment.
                </div>
              ) : null}
            </div>
            <div className="module-form-footer">
              <button type="button" className="form-btn form-btn-cancel" onClick={() => setModal(null)}>Cancel</button>
              <button type="submit" className="form-btn form-btn-primary module-form-submit" disabled={saving || assignableAdmissions.length === 0}>
                {saving ? "Assigning..." : "Assign Bed"}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {modal?.type === "status" ? (
        <div className="module-form-overlay">
          <form className="module-form-panel modal-panel module-form-panel-wards" onSubmit={saveStatus}>
            <div className="module-form-header">
              <div className="module-form-heading">
                <div className="module-form-icon"><ModuleIcon name="hotel" /></div>
                <div>
                  <div className="module-form-kicker">{modal.ward.name}</div>
                  <h2 className="module-form-title">Bed {modal.bed.bedNumber || ""} Status</h2>
                </div>
              </div>
              <button type="button" className="modal-close-btn" onClick={() => setModal(null)} aria-label="Close">x</button>
            </div>
            <div className="module-form-body">
              {hasActivePatient(modal.bed) ? (
                <div className="bed-occupancy-alert">
                  <ModuleIcon name="description" />
                  {patientName(bedPatient(modal.bed))} is currently assigned to this bed. Use IPD discharge or transfer to release it.
                </div>
              ) : null}
              <div className="module-form-grid">
                <label className="module-form-field">
                  <span className="form-label">Status</span>
                  <select className="module-form-input" value={statusValue} onChange={(event) => setStatusValue(event.target.value as BedStatus)} required disabled={hasActivePatient(modal.bed)}>
                    {hasActivePatient(modal.bed) ? <option value="OCCUPIED">Occupied</option> : null}
                    {!hasActivePatient(modal.bed) ? <option value="AVAILABLE">Available</option> : null}
                    {!hasActivePatient(modal.bed) ? <option value="CLEANING">Cleaning</option> : null}
                    {!hasActivePatient(modal.bed) ? <option value="RESERVED">Reserved</option> : null}
                    {!hasActivePatient(modal.bed) ? <option value="MAINTENANCE">Maintenance</option> : null}
                    {!hasActivePatient(modal.bed) ? <option value="BLOCKED">Blocked</option> : null}
                    {!hasActivePatient(modal.bed) ? <option value="OUT_OF_SERVICE">Out of service</option> : null}
                    {!hasActivePatient(modal.bed) ? <option value="TRANSFER_PENDING">Transfer pending</option> : null}
                  </select>
                </label>
                <label className="module-form-field is-wide">
                  <span className="form-label">Housekeeping / status notes</span>
                  <textarea className="module-form-input min-h-[110px]" value={statusNote} onChange={(event) => setStatusNote(event.target.value)} placeholder="Cleaning acknowledged, maintenance reason, reservation note..." />
                </label>
              </div>
            </div>
            <div className="module-form-footer">
              <button type="button" className="form-btn form-btn-cancel" onClick={() => setModal(null)}>Cancel</button>
              <button type="submit" className="form-btn form-btn-primary module-form-submit" disabled={saving || hasActivePatient(modal.bed)}>
                {saving ? "Saving..." : "Save Status"}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {notice ? (
        <div className={`bed-ward-notification is-${noticeTone(notice)}`} role="status" aria-live="polite">
          <div className="bed-ward-notification-icon"><ModuleIcon name={noticeIcon(notice)} /></div>
          <div className="bed-ward-notification-copy">
            <strong>{noticeTone(notice) === "success" ? "Completed" : noticeTone(notice)}</strong>
            <span>{notice}</span>
          </div>
          <button onClick={() => setNotice("")} className="bed-ward-notification-close" type="button" aria-label="Dismiss notification">×</button>
          <div className="bed-ward-notification-progress" aria-hidden="true" />
        </div>
      ) : null}
    </div>
  );
}
