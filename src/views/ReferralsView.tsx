import React, { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import {
  ArrowRightLeft,
  Building2,
  CheckCircle2,
  ClipboardList,
  FileSignature,
  Radio,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Timer,
  X,
} from "lucide-react";
import { api } from "../lib/api";
import { useLiveRefresh } from "../lib/liveRefresh";

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || "http://localhost:3000";

const emptyOutgoing = {
  patientId: "",
  encounterId: "",
  referringDoctorId: "",
  receivingFacilityName: "",
  receivingFacilityMfl: "",
  receivingSpecialist: "",
  urgency: "URGENT",
  reason: "",
  clinicalQuestion: "",
  selectedInvestigations: "",
  transportMode: "AMBULANCE",
  transmitNow: true,
  autoAccept: false,
  estimatedWaitMinutes: "30",
};

const emptyIncoming = {
  sendingFacilityName: "",
  sendingDoctor: "",
  sendingDoctorPhone: "",
  patientName: "",
  patientAge: "",
  patientGender: "UNKNOWN",
  referralReason: "",
  clinicalSummary: "",
  urgency: "URGENT",
  specialtyRequired: "",
  expectedArrival: "",
};

const emptyAvailability = {
  facilityId: "",
  neurosurgeryAccepting: true,
  acceptingReferrals: true,
  icuBedsAvailable: "2",
  oNegativeUnits: "4",
  bloodBankStatus: "AVAILABLE",
  availableSpecialists: "Neurosurgery, ICU, Trauma",
};

const fmtDateTime = (value: unknown) => {
  const date = new Date(String(value || ""));
  if (!Number.isFinite(date.getTime())) return "-";
  return date.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
};

const pretty = (value: unknown) =>
  String(value || "")
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());

const unwrapItems = (value: any) => {
  const data = value?.data ?? value;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  return [];
};

const backendHref = (path: string) => {
  if (!path) return "#";
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE_URL || ""}${path}`;
};

export default function ReferralsView() {
  const [dashboard, setDashboard] = useState<any>({});
  const [outgoing, setOutgoing] = useState<any[]>([]);
  const [incoming, setIncoming] = useState<any[]>([]);
  const [facilities, setFacilities] = useState<any[]>([]);
  const [arrivals, setArrivals] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<"" | "outgoing" | "incoming" | "availability">("");
  const [outgoingForm, setOutgoingForm] = useState(emptyOutgoing);
  const [incomingForm, setIncomingForm] = useState(emptyIncoming);
  const [availabilityForm, setAvailabilityForm] = useState(emptyAvailability);
  const [emrContext, setEmrContext] = useState<any>(null);
  const [lastLetter, setLastLetter] = useState<any>(null);
  const [lastRelay, setLastRelay] = useState<any>(null);
  const [notice, setNotice] = useState<{ tone: "success" | "warning" | "error"; text: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");

  const showNotice = (text: string, tone: "success" | "warning" | "error" = "success") => {
    setNotice({ tone, text });
    window.setTimeout(() => setNotice((current) => (current?.text === text ? null : current)), tone === "success" ? 3200 : 5200);
  };

  const load = async () => {
    setLoading(true);
    try {
      const params = { search: search.trim() || undefined, limit: 500 };
      const [dashResult, outResult, inResult, facilityResult, arrivalResult] = await Promise.allSettled([
        api.get("/referrals/dashboard", { params }),
        api.get("/referrals/outgoing", { params }),
        api.get("/referrals/incoming", { params }),
        api.get("/referrals/facilities", { params }),
        api.get("/referrals/expected-arrivals", { params }),
      ]);
      setDashboard(dashResult.status === "fulfilled" ? dashResult.value.data || {} : {});
      setOutgoing(outResult.status === "fulfilled" ? unwrapItems(outResult.value.data) : []);
      setIncoming(inResult.status === "fulfilled" ? unwrapItems(inResult.value.data) : []);
      setFacilities(facilityResult.status === "fulfilled" ? unwrapItems(facilityResult.value.data) : []);
      setArrivals(arrivalResult.status === "fulfilled" ? unwrapItems(arrivalResult.value.data) : []);
      const failed = [dashResult, outResult, inResult, facilityResult, arrivalResult].filter((result) => result.status === "rejected");
      if (failed.length) {
        const firstError = failed[0].status === "rejected" ? (failed[0] as PromiseRejectedResult).reason : null;
        showNotice(firstError?.response?.data?.message || "Some referral data could not be loaded. Refresh to retry.", "error");
      }
    } catch (error: any) {
      showNotice(error?.response?.data?.message || "Referral data could not be loaded.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);
  useLiveRefresh(load, { intervalMs: 30000 });

  const totals = dashboard?.totals || {};
  const selectedFacility = useMemo(
    () => facilities.find((row) => row.id === availabilityForm.facilityId) || facilities[0] || null,
    [availabilityForm.facilityId, facilities],
  );
  const stats = [
    { label: "Outgoing", value: totals.outgoing ?? outgoing.length, icon: Send },
    { label: "Incoming", value: totals.incoming ?? incoming.length, icon: ArrowRightLeft },
    { label: "Transmitted", value: totals.transmitted ?? 0, icon: Radio },
    { label: "Accepted", value: totals.accepted ?? 0, icon: CheckCircle2 },
    { label: "Expected", value: totals.expectedArrivals ?? arrivals.length, icon: Timer },
    { label: "Connected", value: totals.connectedFacilities ?? facilities.filter((row) => row.connected).length, icon: ShieldCheck },
  ];

  const openOutgoing = (facility?: any) => {
    setOutgoingForm({
      ...emptyOutgoing,
      receivingFacilityName: facility?.facilityName || "",
      receivingFacilityMfl: facility?.mflCode || "",
      receivingSpecialist: facility?.specialties?.[0] || "",
    });
    setEmrContext(null);
    setLastLetter(null);
    setLastRelay(null);
    setModal("outgoing");
  };

  const loadEmrContext = async () => {
    if (!outgoingForm.patientId.trim()) {
      showNotice("Enter a patient ID before loading EMR context.", "warning");
      return;
    }
    setSaving("emr");
    try {
      const res = await api.get(`/referrals/emr-context/${outgoingForm.patientId.trim()}`, {
        params: { encounterId: outgoingForm.encounterId || undefined, doctorId: outgoingForm.referringDoctorId || undefined },
      });
      const prefill = res.data?.prefill || {};
      setEmrContext(res.data);
      setOutgoingForm((current) => ({
        ...current,
        encounterId: current.encounterId || prefill.encounterId || "",
        referringDoctorId: current.referringDoctorId || prefill.referringDoctorId || "",
        selectedInvestigations: (prefill.investigations || []).map((row: any) => `${row.type}: ${row.label} ${row.value || ""}`.trim()).join("\n"),
      }));
      showNotice("EMR context loaded from diagnoses, investigations, and current medicines.");
    } catch (error: any) {
      showNotice(error?.response?.data?.message || "EMR context could not be loaded.", "error");
    } finally {
      setSaving("");
    }
  };

  const createOutgoing = async (event: FormEvent) => {
    event.preventDefault();
    setSaving("outgoing");
    try {
      const payload = {
        ...outgoingForm,
        selectedInvestigations: outgoingForm.selectedInvestigations.split("\n").map((row) => row.trim()).filter(Boolean),
        transmitNow: outgoingForm.transmitNow,
        autoAccept: outgoingForm.autoAccept,
        estimatedWaitMinutes: Number(outgoingForm.estimatedWaitMinutes) || 30,
      };
      const res = await api.post("/referrals/outgoing", payload);
      setLastLetter(res.data?.letter || null);
      setLastRelay(res.data?.relay || null);
      setOutgoingForm(emptyOutgoing);
      await load();
      showNotice(res.data?.relay ? "Referral letter generated and encrypted relay transmission completed." : "Referral letter generated.");
    } catch (error: any) {
      showNotice(error?.response?.data?.message || "Outgoing referral could not be created.", "error");
    } finally {
      setSaving("");
    }
  };

  const transmitReferral = async (row: any) => {
    setSaving(`tx-${row.id}`);
    try {
      const res = await api.post(`/referrals/outgoing/${row.id}/transmit`, { autoAccept: false, estimatedWaitMinutes: 30 });
      setLastRelay(res.data?.relay || null);
      await load();
      showNotice("Encrypted FHIR R4 relay package transmitted and status updated.");
    } catch (error: any) {
      showNotice(error?.response?.data?.message || "Relay transmission failed.", "error");
    } finally {
      setSaving("");
    }
  };

  const receiveIncoming = async (event: FormEvent) => {
    event.preventDefault();
    setSaving("incoming");
    try {
      await api.post("/referrals/incoming", incomingForm);
      setIncomingForm(emptyIncoming);
      setModal("");
      await load();
      showNotice("Incoming referral queued, specialist alert fired, and expected arrival created.");
    } catch (error: any) {
      showNotice(error?.response?.data?.message || "Incoming referral could not be created.", "error");
    } finally {
      setSaving("");
    }
  };

  const acknowledgeIncoming = async (row: any) => {
    setSaving(`ack-${row.id}`);
    try {
      await api.patch(`/referrals/incoming/${row.id}/acknowledge`, {
        status: "ACCEPTED",
        feedback: "Accepted. Referral coordinator and specialist notified.",
        estimatedWaitMinutes: 30,
      });
      await load();
      showNotice("Incoming referral accepted and feedback sent to sending facility.");
    } catch (error: any) {
      showNotice(error?.response?.data?.message || "Incoming referral could not be acknowledged.", "error");
    } finally {
      setSaving("");
    }
  };

  const updateAvailability = async (event: FormEvent) => {
    event.preventDefault();
    const facilityId = availabilityForm.facilityId || selectedFacility?.id;
    if (!facilityId) {
      showNotice("Select a facility before updating availability.", "warning");
      return;
    }
    setSaving("availability");
    try {
      await api.patch(`/referrals/facilities/${facilityId}/availability`, {
        ...availabilityForm,
        icuBedsAvailable: Number(availabilityForm.icuBedsAvailable) || 0,
        oNegativeUnits: Number(availabilityForm.oNegativeUnits) || 0,
        availableSpecialists: availabilityForm.availableSpecialists.split(",").map((item) => item.trim()).filter(Boolean),
      });
      setModal("");
      await load();
      showNotice("Real-time referral availability updated for connected facilities.");
    } catch (error: any) {
      showNotice(error?.response?.data?.message || "Availability could not be updated.", "error");
    } finally {
      setSaving("");
    }
  };

  return (
    <main className="referrals-page">
      <section className="referrals-header">
        <div>
          <span className="referrals-eyebrow"><ArrowRightLeft size={15} /> Referral Management</span>
          <h1>Inter-Facility Referral Workbench</h1>
          <p>Generate EMR-backed referral letters, transmit encrypted FHIR bundles, and track incoming expected arrivals.</p>
        </div>
        <div className="referrals-actions">
          <button type="button" className="referrals-btn is-muted" onClick={() => void load()} disabled={loading}><RefreshCw size={15} /> Refresh</button>
          <button type="button" className="referrals-btn is-blue" onClick={() => setModal("incoming")}><ClipboardList size={15} /> Receive</button>
          <button type="button" className="referrals-btn is-green" onClick={() => openOutgoing()}><FileSignature size={15} /> New Referral</button>
        </div>
      </section>

      {notice ? (
        <div className={`referrals-toast ${notice.tone}`} role="status" aria-live="polite">
          <span className="referrals-toast-mark" aria-hidden="true">{notice.tone === "success" ? "✓" : notice.tone === "error" ? "!" : "i"}</span>
          <div className="referrals-toast-content"><strong>Referral Management</strong><span>{notice.text}</span></div>
          <button type="button" className="referrals-toast-close" onClick={() => setNotice(null)} aria-label="Dismiss notification">×</button>
        </div>
      ) : null}

      <section className="referrals-stats">
        {stats.map((item) => {
          const Icon = item.icon;
          return (
            <article key={item.label} className="referrals-stat">
              <Icon size={18} />
              <span>{item.label}</span>
              <strong>{loading ? "..." : item.value}</strong>
            </article>
          );
        })}
      </section>

      <section className="referrals-toolbar">
        <label><Search size={16} /><input aria-label="Search referrals" placeholder="Search referrals, patients, facilities, specialties..." value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void load(); }} /></label>
        <button type="button" className="referrals-btn is-muted" onClick={() => void load()}>Apply Search</button>
      </section>

      <section className="referrals-grid">
        <Panel title="Outgoing Referrals" subtitle="Generated from EMR context with digital signature and relay state.">
          <div className="referrals-table-wrap">
            <table className="referrals-table">
              <thead><tr><th>Patient</th><th>Receiving Facility</th><th>Urgency</th><th>Status</th><th>Relay</th><th></th></tr></thead>
              <tbody>
                {loading ? <tr><td colSpan={6} className="referrals-empty">Loading outgoing referrals…</td></tr> : outgoing.length === 0 ? <tr><td colSpan={6} className="referrals-empty">No outgoing referrals found.</td></tr> : outgoing.map((row) => (
                  <tr key={row.id}>
                    <td><strong>{row.patientName || row.patientId}</strong><small>{row.reason}</small></td>
                    <td><strong>{row.receivingFacilityName}</strong><small>{row.receivingSpecialist || row.receivingFacilityMfl || "-"}</small></td>
                    <td><span className={`referrals-pill ${String(row.urgency).toLowerCase()}`}>{pretty(row.urgency)}</span></td>
                    <td>{pretty(row.status)}</td>
                    <td><small>{row.feedback || row.relayStatus || "Pending"}</small></td>
                    <td>
                      <div className="referrals-row-actions">
                        {row.pdfUrl ? <a className="referrals-mini-btn" href={backendHref(row.pdfUrl)} target="_blank" rel="noreferrer"><FileSignature size={13} /> Letter</a> : null}
                        <button type="button" className="referrals-mini-btn" onClick={() => void transmitReferral(row)} disabled={saving === `tx-${row.id}`}><Send size={13} /> Relay</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="Incoming Queue" subtitle="Receiving coordinator queue, specialist alerts, and feedback tracking.">
          <div className="referrals-list">
            {loading ? <p className="referrals-empty">Loading incoming referrals…</p> : incoming.length === 0 ? <p className="referrals-empty">No incoming referrals.</p> : incoming.map((row) => (
              <article key={row.id} className="referrals-list-item">
                <div>
                  <strong>{row.patientName || "Unnamed patient"}</strong>
                  <small>{row.sendingFacilityName || "External facility"} | {row.specialtyRequired || "General"}</small>
                  <p>{row.referralReason}</p>
                </div>
                <div>
                  <span className={`referrals-pill ${String(row.urgency).toLowerCase()}`}>{pretty(row.urgency)}</span>
                  <button type="button" className="referrals-mini-btn" onClick={() => void acknowledgeIncoming(row)} disabled={saving === `ack-${row.id}`}>Accept</button>
                </div>
              </article>
            ))}
          </div>
        </Panel>
      </section>

      <section className="referrals-grid is-three">
        <Panel title="Facility Directory" subtitle="MOH MFL directory plus Medilink-connected live availability.">
          <div className="referrals-list compact">
            {loading ? <p className="referrals-empty">Loading facility directory…</p> : facilities.length === 0 ? <p className="referrals-empty">No facilities loaded.</p> : facilities.slice(0, 8).map((facility) => (
              <article key={facility.id} className="referrals-directory-row">
                <Building2 size={18} />
                <div>
                  <strong>{facility.facilityName}</strong>
                  <small>{facility.county} | MFL {facility.mflCode || "-"} | {facility.connected ? "Medilink connected" : "Directory only"}</small>
                  <p>ICU beds: {facility.icuBedsAvailable ?? "-"} | O- units: {facility.oNegativeUnits ?? "-"} | Neuro: {facility.neurosurgeryAccepting === null ? "-" : facility.neurosurgeryAccepting ? "Accepting" : "Closed"}</p>
                </div>
                <button type="button" className="referrals-mini-btn" onClick={() => openOutgoing(facility)}>Refer</button>
              </article>
            ))}
          </div>
        </Panel>

        <Panel title="Expected Arrivals" subtitle="Accepted incoming referrals visible before the patient arrives.">
          <div className="referrals-list compact">
            {loading ? <p className="referrals-empty">Loading expected arrivals…</p> : arrivals.length === 0 ? <p className="referrals-empty">No expected arrivals.</p> : arrivals.slice(0, 8).map((row) => (
              <article key={row.id} className="referrals-list-item">
                <div>
                  <strong>{row.patientName || "Unnamed patient"}</strong>
                  <small>{fmtDateTime(row.expectedArrival)} | {row.specialtyRequired || "General"}</small>
                </div>
                <span className={`referrals-pill ${String(row.urgency).toLowerCase()}`}>{pretty(row.urgency)}</span>
              </article>
            ))}
          </div>
        </Panel>

        <Panel title="Relay Assurance" subtitle="FHIR R4 bundles are encrypted before leaving the sending facility.">
          <div className="referrals-assurance">
            <div><ShieldCheck size={18} /><strong>Encrypted FHIR R4</strong><span>{lastRelay?.encryptedPackage?.algorithm || "Ready for connected facilities"}</span></div>
            <div><Timer size={18} /><strong>5 second sender update</strong><span>{lastRelay?.estimatedWaitMinutes ? `${lastRelay.estimatedWaitMinutes} min estimated wait` : "Acceptance state appears here"}</span></div>
            <div><FileSignature size={18} /><strong>Digital signature</strong><span>{lastLetter?.pdfUrl || "Letter output appears after generation"}</span></div>
          </div>
          <button type="button" className="referrals-btn is-blue wide" onClick={() => {
            setAvailabilityForm((current) => ({ ...current, facilityId: selectedFacility?.id || "" }));
            setModal("availability");
          }}>Update Availability</button>
        </Panel>
      </section>

      {modal === "outgoing" ? (
        <ReferralModal title="Generate Electronic Referral Letter" tone="green" onClose={() => setModal("")}>
          <form className="referrals-form" onSubmit={createOutgoing}>
            <Field label="Patient ID"><input required value={outgoingForm.patientId} onChange={(event) => setOutgoingForm({ ...outgoingForm, patientId: event.target.value })} /></Field>
            <Field label="Encounter / Visit ID"><input value={outgoingForm.encounterId} onChange={(event) => setOutgoingForm({ ...outgoingForm, encounterId: event.target.value })} /></Field>
            <Field label="Referring Doctor ID"><input value={outgoingForm.referringDoctorId} onChange={(event) => setOutgoingForm({ ...outgoingForm, referringDoctorId: event.target.value })} /></Field>
            <div className="referrals-form-line"><button type="button" className="referrals-mini-btn" onClick={() => void loadEmrContext()} disabled={saving === "emr"}>Load EMR Context</button><small>{emrContext ? `${emrContext.diagnoses?.length || 0} diagnoses, ${emrContext.investigations?.length || 0} results, ${emrContext.medications?.length || 0} medicines loaded` : "Pulls demographics, diagnoses, results, and medication list."}</small></div>
            <Field label="Receiving Facility" wide><input required list="referral-facility-options" placeholder="Search connected facilities or enter a facility" value={outgoingForm.receivingFacilityName} onChange={(event) => {
              const facility = facilities.find((row) => row.facilityName === event.target.value);
              setOutgoingForm((current) => ({
                ...current,
                receivingFacilityName: event.target.value,
                receivingFacilityMfl: facility?.mflCode || current.receivingFacilityMfl,
                receivingSpecialist: facility?.specialties?.[0] || current.receivingSpecialist,
              }));
            }} /><datalist id="referral-facility-options">{facilities.map((facility) => <option key={facility.id} value={facility.facilityName}>{facility.mflCode || ""}</option>)}</datalist></Field>
            <Field label="MFL Code"><input value={outgoingForm.receivingFacilityMfl} onChange={(event) => setOutgoingForm({ ...outgoingForm, receivingFacilityMfl: event.target.value })} /></Field>
            <Field label="Specialist / Unit"><input value={outgoingForm.receivingSpecialist} onChange={(event) => setOutgoingForm({ ...outgoingForm, receivingSpecialist: event.target.value })} /></Field>
            <Field label="Urgency"><select value={outgoingForm.urgency} onChange={(event) => setOutgoingForm({ ...outgoingForm, urgency: event.target.value })}><option>ROUTINE</option><option>SOON</option><option>URGENT</option><option>EMERGENCY</option><option>CRITICAL</option></select></Field>
            <Field label="Clinical Reason" wide><textarea required value={outgoingForm.reason} onChange={(event) => setOutgoingForm({ ...outgoingForm, reason: event.target.value })} /></Field>
            <Field label="Clinical Question / Management Request" wide><textarea required value={outgoingForm.clinicalQuestion} onChange={(event) => setOutgoingForm({ ...outgoingForm, clinicalQuestion: event.target.value })} /></Field>
            <Field label="Selected Investigation Results" wide><textarea value={outgoingForm.selectedInvestigations} onChange={(event) => setOutgoingForm({ ...outgoingForm, selectedInvestigations: event.target.value })} /></Field>
            <Field label="Transport Mode"><select value={outgoingForm.transportMode} onChange={(event) => setOutgoingForm({ ...outgoingForm, transportMode: event.target.value })}><option>AMBULANCE</option><option>PRIVATE</option><option>PATIENT_OWN_TRANSPORT</option><option>AIR_AMBULANCE</option></select></Field>
            <Field label="Estimated Wait Minutes"><input type="number" min="0" value={outgoingForm.estimatedWaitMinutes} onChange={(event) => setOutgoingForm({ ...outgoingForm, estimatedWaitMinutes: event.target.value })} /></Field>
            <label className="referrals-check"><input type="checkbox" checked={outgoingForm.transmitNow} onChange={(event) => setOutgoingForm({ ...outgoingForm, transmitNow: event.target.checked })} /> Transmit immediately through Medilink Relay</label>
            <label className="referrals-check"><input type="checkbox" checked={outgoingForm.autoAccept} onChange={(event) => setOutgoingForm({ ...outgoingForm, autoAccept: event.target.checked })} /> Demo-only automatic acknowledgement (leave off in production)</label>
            <div className="referrals-modal-actions"><button type="button" className="referrals-btn is-muted" onClick={() => setModal("")}>Cancel</button><button type="submit" className="referrals-btn is-green" disabled={saving === "outgoing"}>{saving === "outgoing" ? "Saving..." : "Generate Letter"}</button></div>
          </form>
        </ReferralModal>
      ) : null}

      {modal === "incoming" ? (
        <ReferralModal title="Receive Incoming Referral" tone="blue" onClose={() => setModal("")}>
          <form className="referrals-form" onSubmit={receiveIncoming}>
            <Field label="Sending Facility"><input required value={incomingForm.sendingFacilityName} onChange={(event) => setIncomingForm({ ...incomingForm, sendingFacilityName: event.target.value })} /></Field>
            <Field label="Sending Doctor"><input value={incomingForm.sendingDoctor} onChange={(event) => setIncomingForm({ ...incomingForm, sendingDoctor: event.target.value })} /></Field>
            <Field label="Doctor Phone"><input value={incomingForm.sendingDoctorPhone} onChange={(event) => setIncomingForm({ ...incomingForm, sendingDoctorPhone: event.target.value })} /></Field>
            <Field label="Patient Name"><input required value={incomingForm.patientName} onChange={(event) => setIncomingForm({ ...incomingForm, patientName: event.target.value })} /></Field>
            <Field label="Patient Age"><input type="number" value={incomingForm.patientAge} onChange={(event) => setIncomingForm({ ...incomingForm, patientAge: event.target.value })} /></Field>
            <Field label="Gender"><select value={incomingForm.patientGender} onChange={(event) => setIncomingForm({ ...incomingForm, patientGender: event.target.value })}><option>UNKNOWN</option><option>MALE</option><option>FEMALE</option><option>OTHER</option></select></Field>
            <Field label="Urgency"><select value={incomingForm.urgency} onChange={(event) => setIncomingForm({ ...incomingForm, urgency: event.target.value })}><option>ROUTINE</option><option>SOON</option><option>URGENT</option><option>EMERGENCY</option><option>CRITICAL</option></select></Field>
            <Field label="Specialty Required"><input value={incomingForm.specialtyRequired} onChange={(event) => setIncomingForm({ ...incomingForm, specialtyRequired: event.target.value })} /></Field>
            <Field label="Expected Arrival"><input type="datetime-local" value={incomingForm.expectedArrival} onChange={(event) => setIncomingForm({ ...incomingForm, expectedArrival: event.target.value })} /></Field>
            <Field label="Referral Reason" wide><textarea required value={incomingForm.referralReason} onChange={(event) => setIncomingForm({ ...incomingForm, referralReason: event.target.value })} /></Field>
            <Field label="Clinical Summary" wide><textarea value={incomingForm.clinicalSummary} onChange={(event) => setIncomingForm({ ...incomingForm, clinicalSummary: event.target.value })} /></Field>
            <div className="referrals-modal-actions"><button type="button" className="referrals-btn is-muted" onClick={() => setModal("")}>Cancel</button><button type="submit" className="referrals-btn is-blue" disabled={saving === "incoming"}>{saving === "incoming" ? "Saving..." : "Queue Referral"}</button></div>
          </form>
        </ReferralModal>
      ) : null}

      {modal === "availability" ? (
        <ReferralModal title="Update Facility Availability" tone="blue" onClose={() => setModal("")}>
          <form className="referrals-form" onSubmit={updateAvailability}>
            <Field label="Facility" wide><select value={availabilityForm.facilityId || selectedFacility?.id || ""} onChange={(event) => setAvailabilityForm({ ...availabilityForm, facilityId: event.target.value })}>{facilities.map((facility) => <option key={facility.id} value={facility.id}>{facility.facilityName}</option>)}</select></Field>
            <Field label="ICU Beds Available"><input type="number" min="0" value={availabilityForm.icuBedsAvailable} onChange={(event) => setAvailabilityForm({ ...availabilityForm, icuBedsAvailable: event.target.value })} /></Field>
            <Field label="O-Negative Units"><input type="number" min="0" value={availabilityForm.oNegativeUnits} onChange={(event) => setAvailabilityForm({ ...availabilityForm, oNegativeUnits: event.target.value })} /></Field>
            <Field label="Blood Bank Status"><select value={availabilityForm.bloodBankStatus} onChange={(event) => setAvailabilityForm({ ...availabilityForm, bloodBankStatus: event.target.value })}><option>AVAILABLE</option><option>LOW_STOCK</option><option>OUT_OF_STOCK</option></select></Field>
            <Field label="Available Specialists" wide><input value={availabilityForm.availableSpecialists} onChange={(event) => setAvailabilityForm({ ...availabilityForm, availableSpecialists: event.target.value })} /></Field>
            <label className="referrals-check"><input type="checkbox" checked={availabilityForm.acceptingReferrals} onChange={(event) => setAvailabilityForm({ ...availabilityForm, acceptingReferrals: event.target.checked })} /> Facility accepting referrals</label>
            <label className="referrals-check"><input type="checkbox" checked={availabilityForm.neurosurgeryAccepting} onChange={(event) => setAvailabilityForm({ ...availabilityForm, neurosurgeryAccepting: event.target.checked })} /> Neurosurgery accepting referrals</label>
            <div className="referrals-modal-actions"><button type="button" className="referrals-btn is-muted" onClick={() => setModal("")}>Cancel</button><button type="submit" className="referrals-btn is-blue" disabled={saving === "availability"}>{saving === "availability" ? "Saving..." : "Update Availability"}</button></div>
          </form>
        </ReferralModal>
      ) : null}
    </main>
  );
}

function Panel({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <section className="referrals-panel">
      <header><h2>{title}</h2><p>{subtitle}</p></header>
      {children}
    </section>
  );
}

function Field({ label, wide, children }: { label: string; wide?: boolean; children: ReactNode }) {
  return <label className={`referrals-field ${wide ? "wide" : ""}`}><span>{label}</span>{children}</label>;
}

function ReferralModal({ title, tone, onClose, children }: { title: string; tone: "green" | "blue"; onClose: () => void; children: ReactNode }) {
  return (
    <div className="referrals-modal-backdrop" role="presentation">
      <section className={`referrals-modal ${tone}`}>
        <header>
          <div><span>Referral Management</span><h2>{title}</h2></div>
          <button type="button" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </header>
        {children}
      </section>
    </div>
  );
}
