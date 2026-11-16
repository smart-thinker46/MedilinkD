// Ported from Medilink-Frontend/src/app/community-health/page.tsx for desktop parity.
/* eslint-disable @typescript-eslint/no-explicit-any */

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  CloudOff,
  CloudUpload,
  Home,
  MapPin,
  MessageSquare,
  Maximize2,
  Minimize2,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  Smartphone,
  UsersRound,
  X,
} from "lucide-react";
import { api } from "../lib/api";
import { useLiveRefresh } from "../lib/liveRefresh";

const today = new Date().toISOString().slice(0, 10);
const OFFLINE_QUEUE_KEY = "medilink_community_health_offline_queue";

const emptyChw = {
  fullName: "",
  phone: "",
  idNumber: "",
  cadre: "CHW",
  village: "",
  subLocation: "",
  supervisorId: "",
};

const emptyHousehold = {
  chwId: "",
  householdNumber: "",
  headOfHousehold: "",
  phone: "",
  village: "",
  lat: "",
  lng: "",
  houseType: "Permanent",
  waterSource: "Piped",
  sanitation: "Improved latrine",
  cookingFuel: "LPG",
  under5: "0",
  fiveTo17: "0",
  adults: "0",
  elderly: "0",
  members: [{ name: "", gender: "UNKNOWN", relationshipToHead: "Head", dateOfBirth: "", patientId: "" }],
};

const emptyVisit = {
  chwId: "",
  householdId: "",
  visitDate: today,
  visitType: "ROUTINE",
  membersPresent: "1",
  servicesProvided: "Health education, screening",
  findings: "",
  referralsMade: "0",
  gpsLat: "",
  gpsLng: "",
  visitDurationMin: "30",
  nextVisitDate: "",
};

const emptyReferral = {
  chwId: "",
  householdMemberId: "",
  patientId: "",
  patientName: "",
  referralReason: "",
  urgency: "ROUTINE",
  referredToFacilityId: "",
};

const emptyAttendance = {
  referralCode: "",
  patientId: "",
  attendedFacility: "Medilink Hospital",
  diagnosis: "",
  followUpDue: "",
  outcomeNotes: "",
};

const emptySurveillance = {
  reportPeriod: today,
  preparedBy: "",
  catchmentArea: "",
  catchmentPopulation: "0",
  acute_febrile_illness: "0",
  acute_watery_diarrhoea: "0",
  acute_respiratory_illness: "0",
  skin_rash: "0",
  eye_disease: "0",
  animal_bite: "0",
};

const pretty = (value: unknown) =>
  String(value || "")
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());

const fmtDate = (value: unknown) => {
  const date = new Date(String(value || ""));
  if (!Number.isFinite(date.getTime())) return "-";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
};

const unwrapItems = (value: any) => {
  const data = value?.data ?? value;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  return [];
};

const makeClientId = () =>
  `offline-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export default function CommunityHealthView() {
  const [dashboard, setDashboard] = useState<any>({});
  const [chws, setChws] = useState<any[]>([]);
  const [households, setHouseholds] = useState<any[]>([]);
  const [visits, setVisits] = useState<any[]>([]);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [surveillance, setSurveillance] = useState<any[]>([]);
  const [operational, setOperational] = useState<Record<string, any[]>>({ units: [], programmes: [], campaigns: [], followups: [], tasks: [], screenings: [], interventions: [], devices: [] });
  const [syncStatus, setSyncStatus] = useState<any>({});
  const [offlineQueue, setOfflineQueue] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<"" | "chw" | "household" | "visit" | "referral" | "attendance" | "surveillance" | "offline" | "operation">("");
  const [operationType, setOperationType] = useState("units");
  const [operationForm, setOperationForm] = useState({ name: "", title: "", description: "", status: "ACTIVE", dueDate: "", householdId: "", chwId: "" });
  const [chwForm, setChwForm] = useState(emptyChw);
  const [householdForm, setHouseholdForm] = useState(emptyHousehold);
  const [visitForm, setVisitForm] = useState(emptyVisit);
  const [referralForm, setReferralForm] = useState(emptyReferral);
  const [attendanceForm, setAttendanceForm] = useState(emptyAttendance);
  const [surveillanceForm, setSurveillanceForm] = useState(emptySurveillance);
  const [notice, setNotice] = useState<{ tone: "success" | "warning" | "error"; text: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");
  const [expandedHouseholds, setExpandedHouseholds] = useState(false);

  const showNotice = (text: string, tone: "success" | "warning" | "error" = "success") => {
    setNotice({ text, tone });
    window.setTimeout(() => setNotice((current) => (current?.text === text ? null : current)), tone === "success" ? 3200 : 5200);
  };

  const saveOfflineQueue = (items: any[]) => {
    setOfflineQueue(items);
    window.localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(items));
  };

  const loadOfflineQueue = () => {
    try {
      const parsed = JSON.parse(window.localStorage.getItem(OFFLINE_QUEUE_KEY) || "[]");
      setOfflineQueue(Array.isArray(parsed) ? parsed : []);
    } catch {
      window.localStorage.removeItem(OFFLINE_QUEUE_KEY);
      setOfflineQueue([]);
    }
  };

  const load = async () => {
    setLoading(true);
    try {
      const sources = ["dashboard", "chws", "households", "visits", "referrals", "surveillance", "sync status", "units", "programmes", "campaigns", "followups", "tasks", "screenings", "interventions", "devices"];
      const results = await Promise.allSettled([
        api.get("/community-health/dashboard"),
        api.get("/community-health/chws", { params: { limit: 500 } }),
        api.get("/community-health/households", { params: { limit: 500, search: search.trim() || undefined } }),
        api.get("/community-health/visits", { params: { limit: 300 } }),
        api.get("/community-health/referrals", { params: { limit: 300 } }),
        api.get("/community-health/surveillance", { params: { limit: 120 } }),
        api.get("/community-health/sync/status", { params: { limit: 100 } }),
        ...["units", "programmes", "campaigns", "followups", "tasks", "screenings", "interventions", "devices"].map((resource) => api.get(`/community-health/${resource}`, { params: { limit: 200 } })),
      ]);
      const value = (index: number, fallback: any) => results[index]?.status === "fulfilled" ? (results[index] as any).value : { data: fallback };
      const failed = results.map((result, index) => result.status === "rejected" ? sources[index] : "").filter(Boolean);
      if (failed.length) showNotice(`Some Community Health data could not be loaded: ${failed.join(", ")}.`, "warning");
      const dashRes = value(0, {}), chwRes = value(1, { items: [] }), householdRes = value(2, { items: [] }), visitRes = value(3, { items: [] }), referralRes = value(4, { items: [] }), surveillanceRes = value(5, { items: [] }), syncRes = value(6, {});
      const operationResponses = results.slice(7).map((result) => result.status === "fulfilled" ? (result as any).value : { data: { items: [] } });
      setDashboard(dashRes.data || {});
      setChws(unwrapItems(chwRes.data));
      setHouseholds(unwrapItems(householdRes.data));
      setVisits(unwrapItems(visitRes.data));
      setReferrals(unwrapItems(referralRes.data));
      setSurveillance(unwrapItems(surveillanceRes.data));
      setSyncStatus(syncRes.data || {});
      const resources = ["units", "programmes", "campaigns", "followups", "tasks", "screenings", "interventions", "devices"];
      setOperational(Object.fromEntries(resources.map((resource, index) => [resource, unwrapItems(operationResponses[index]?.data)])));
    } catch (error: any) {
      showNotice(error?.response?.data?.message || "Community health data could not be loaded.", "error");
    } finally {
      setLoading(false);
    }
  };

  const saveOperation = async (event: FormEvent) => {
    event.preventDefault();
    setSaving("operation");
    try {
      const directResources = new Set(["units", "programmes", "campaigns", "followups", "tasks", "screenings", "interventions", "devices"]);
      const resourcePath = directResources.has(operationType) ? operationType : `operations/${operationType}`;
      await api.post(`/community-health/${resourcePath}`, { ...operationForm, recordedAt: new Date().toISOString() });
      setOperationForm({ name: "", title: "", description: "", status: "ACTIVE", dueDate: "", householdId: "", chwId: "" });
      setModal("");
      showNotice(`${pretty(operationType.slice(0, -1))} saved and added to the operational worklist.`);
      await load();
    } catch (error: any) {
      showNotice(error?.response?.data?.message || "Community operational record could not be saved.", "error");
    } finally { setSaving(""); }
  };

  useEffect(() => {
    loadOfflineQueue();
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    const handleSidebarAction = (event: Event) => {
      const action = String((event as CustomEvent<{ action?: string }>).detail?.action || "");
      if (["chw", "visit", "referral", "attendance"].includes(action)) setModal(action as typeof modal);
      else if (action === "surveillance") setModal("surveillance");
      else if (action === "operations") { setOperationType("tasks"); setModal("operation"); }
    };
    window.addEventListener("hmis:community-sidebar-action", handleSidebarAction);
    return () => window.removeEventListener("hmis:community-sidebar-action", handleSidebarAction);
  }, []);
  useLiveRefresh(load, { intervalMs: 60000 });

  const filteredHouseholds = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return households;
    return households.filter((row) =>
      [
        row.householdNumber,
        row.headOfHousehold,
        row.phone,
        row.village,
        row.waterSource,
        row.sanitation,
        row.metadata?.houseType,
        row.metadata?.cookingFuel,
      ]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [households, search]);

  const selectedChwId = chws[0]?.id || "";
  const selectedHouseholdId = households[0]?.id || "";
  const totals = dashboard?.totals || {};
  const stats = [
    { label: "CHWs", value: totals.chws ?? chws.length, icon: UsersRound },
    { label: "Households", value: totals.households ?? households.length, icon: Home },
    { label: "Members", value: totals.householdMembers ?? households.reduce((sum, row) => sum + Number(row.memberCount || 0), 0), icon: MapPin },
    { label: "Visits", value: totals.visits ?? visits.length, icon: Smartphone },
    { label: "Open Referrals", value: totals.openReferrals ?? referrals.filter((row) => !row.arrivedAtFacility).length, icon: MessageSquare },
    { label: "Offline Pending", value: offlineQueue.length, icon: CloudOff },
    { label: "Early Alerts", value: totals.outbreakAlerts ?? 0, icon: ShieldAlert },
  ];

  const queueOffline = (entityType: string, payload: any) => {
    const item = {
      clientRecordId: makeClientId(),
      entityType,
      operation: "CREATE",
      updatedAt: new Date().toISOString(),
      payload,
    };
    saveOfflineQueue([item, ...offlineQueue]);
    showNotice("Saved locally. It will sync when connectivity is available.", "warning");
    setModal("");
  };

  const syncOfflineQueue = async () => {
    if (offlineQueue.length === 0) return showNotice("There are no offline records waiting for sync.", "warning");
    setSaving("sync");
    try {
      const res = await api.post("/community-health/sync/batch", {
        clientId: "chw-mobile-browser",
        records: offlineQueue,
      });
      const failedIds = new Set((res.data?.results || []).filter((row: any) => row.status === "FAILED").map((row: any) => row.clientRecordId));
      const remaining = offlineQueue.filter((row) => failedIds.has(row.clientRecordId));
      saveOfflineQueue(remaining);
      showNotice(`Sync complete: ${res.data?.synced || 0} synced, ${res.data?.conflicts || 0} conflicts, ${res.data?.failed || 0} failed.`, res.data?.failed ? "warning" : "success");
      await load();
    } catch (error: any) {
      showNotice(error?.response?.data?.message || "Offline sync could not be completed.", "error");
    } finally {
      setSaving("");
    }
  };

  const saveChw = async (event: FormEvent) => {
    event.preventDefault();
    setSaving("chw");
    try {
      await api.post("/community-health/chws", chwForm);
      setChwForm(emptyChw);
      setModal("");
      showNotice("CHW profile saved with catchment supervisor details.");
      await load();
    } catch (error: any) {
      showNotice(error?.response?.data?.message || "CHW could not be saved.", "error");
    } finally {
      setSaving("");
    }
  };

  const saveHousehold = async (event: FormEvent) => {
    event.preventDefault();
    const payload = {
      ...householdForm,
      chwId: householdForm.chwId || selectedChwId,
      ageGroups: {
        under5: Number(householdForm.under5 || 0),
        fiveTo17: Number(householdForm.fiveTo17 || 0),
        adults: Number(householdForm.adults || 0),
        elderly: Number(householdForm.elderly || 0),
      },
      members: householdForm.members.filter((member) => member.name.trim()),
    };
    setSaving("household");
    try {
      await api.post("/community-health/households", payload);
      setHouseholdForm(emptyHousehold);
      setModal("");
      showNotice("Household mapped with GPS, environment data, and member records.");
      await load();
    } catch (error: any) {
      showNotice(error?.response?.data?.message || "Household could not be registered.", "error");
    } finally {
      setSaving("");
    }
  };

  const saveVisit = async (event: FormEvent) => {
    event.preventDefault();
    const payload = {
      ...visitForm,
      chwId: visitForm.chwId || selectedChwId,
      householdId: visitForm.householdId || selectedHouseholdId,
      servicesProvided: visitForm.servicesProvided.split(",").map((item) => item.trim()).filter(Boolean),
    };
    setSaving("visit");
    try {
      await api.post("/community-health/visits", payload);
      setVisitForm(emptyVisit);
      setModal("");
      showNotice("CHW visit recorded and linked to household follow-up.");
      await load();
    } catch (error: any) {
      showNotice(error?.response?.data?.message || "Visit could not be recorded.", "error");
    } finally {
      setSaving("");
    }
  };

  const saveReferral = async (event: FormEvent) => {
    event.preventDefault();
    setSaving("referral");
    try {
      const res = await api.post("/community-health/referrals", {
        ...referralForm,
        chwId: referralForm.chwId || selectedChwId,
      });
      setReferralForm(emptyReferral);
      setModal("");
      showNotice(`Referral issued. Slip/SMS code: ${res.data?.referralSlipNumber || "created"}.`);
      await load();
    } catch (error: any) {
      showNotice(error?.response?.data?.message || "Referral could not be issued.", "error");
    } finally {
      setSaving("");
    }
  };

  const closeReferral = async (event: FormEvent) => {
    event.preventDefault();
    setSaving("attendance");
    try {
      await api.patch(`/community-health/referrals/code/${encodeURIComponent(attendanceForm.referralCode)}/attendance`, attendanceForm);
      setAttendanceForm(emptyAttendance);
      setModal("");
      showNotice("Facility attendance linked and CHW feedback notification generated.");
      await load();
    } catch (error: any) {
      showNotice(error?.response?.data?.message || "Referral code could not be closed.", "error");
    } finally {
      setSaving("");
    }
  };

  const saveSurveillance = async (event: FormEvent) => {
    event.preventDefault();
    setSaving("surveillance");
    try {
      const diseaseCases = {
        acute_febrile_illness: Number(surveillanceForm.acute_febrile_illness || 0),
        acute_watery_diarrhoea: Number(surveillanceForm.acute_watery_diarrhoea || 0),
        acute_respiratory_illness: Number(surveillanceForm.acute_respiratory_illness || 0),
        skin_rash: Number(surveillanceForm.skin_rash || 0),
        eye_disease: Number(surveillanceForm.eye_disease || 0),
        animal_bite: Number(surveillanceForm.animal_bite || 0),
      };
      const res = await api.post("/community-health/surveillance", {
        ...surveillanceForm,
        diseaseCases,
        preparedBy: surveillanceForm.preparedBy || "CHW Supervisor",
      });
      setSurveillanceForm(emptySurveillance);
      setModal("");
      showNotice(res.data?.outbreakAlert ? "Surveillance return submitted and early warning alert fired." : "Weekly surveillance return submitted.");
      await load();
    } catch (error: any) {
      showNotice(error?.response?.data?.message || "Surveillance return could not be submitted.", "error");
    } finally {
      setSaving("");
    }
  };

  const updateMember = (index: number, key: string, value: string) => {
    setHouseholdForm((current) => ({
      ...current,
      members: current.members.map((member, idx) => (idx === index ? { ...member, [key]: value } : member)),
    }));
  };

  return (
    <main className="community-page">
      {notice ? (
        <div className={`community-toast ${notice.tone}`}>
          <strong>{notice.tone === "error" ? "Action blocked" : "Community Health"}</strong>
          <span>{notice.text}</span>
          <button type="button" onClick={() => setNotice(null)}><X size={14} /></button>
        </div>
      ) : null}

      <header className="community-header">
        <div>
          <span>Community Health & CHW</span>
          <h1>Community Health & CHW Operations</h1>
          <p>Household coverage, CHW field work, closed-loop referrals, follow-up coordination, and community surveillance.</p>
        </div>
        <div className="community-actions">
          <button type="button" className="community-btn ghost" onClick={() => void load()}><RefreshCw size={16} /> Refresh</button>
          <button type="button" className="community-btn green" onClick={() => setModal("chw")}><Plus size={16} /> Register CHW</button>
          <button type="button" className="community-btn green" onClick={() => setModal("household")}><Plus size={16} /> Household</button>
          <button type="button" className="community-btn orange" onClick={() => setModal("referral")}><MessageSquare size={16} /> Issue Referral</button>
          <button type="button" className="community-btn blue" onClick={() => void syncOfflineQueue()} disabled={saving === "sync"}><CloudUpload size={16} /> Sync</button>
        </div>
      </header>

      <section className="community-stats">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <article key={stat.label}>
              <Icon size={19} />
              <span>{stat.label}</span>
              <strong>{Number(stat.value || 0).toLocaleString()}</strong>
              <i>{index === 4 ? "mobile queue" : "live records"}</i>
            </article>
          );
        })}
      </section>

      <section className="community-toolbar">
        <label className="community-search">
          <Search size={16} />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search households, village, water source..." />
        </label>
        <select className="community-status-filter" aria-label="Filter community records"><option>All status</option><option>Active</option><option>Open</option><option>Pending</option><option>Completed</option></select>
        <button type="button" onClick={() => setModal("visit")}>Log Visit</button>
        <button type="button" onClick={() => setModal("surveillance")}>Surveillance</button>
        <span className="community-toolbar-hint">More tools are available in the workspace sidebar.</span>
      </section>

      <section className="community-grid">
        <div className="community-panel community-main">
          <div className="community-title">
            <div>
              <span>Household Registration & Mapping</span>
              <h2>Catchment Households</h2>
            </div>
            <b>{loading ? "Loading" : `${filteredHouseholds.length} records`}</b>
          </div>
          <div className={`community-table-wrap community-expandable-table ${expandedHouseholds ? "is-expanded" : ""}`}>
            <button
              type="button"
              className="community-expand-btn"
              aria-label={expandedHouseholds ? "Collapse household table" : "Expand household table"}
              title={expandedHouseholds ? "Collapse table" : "Expand table"}
              onClick={() => setExpandedHouseholds((current) => !current)}
            >
              {expandedHouseholds ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
            <table className="community-table">
              <thead>
                <tr>
                  <th>Household</th>
                  <th>Head</th>
                  <th>Village</th>
                  <th>Water / Sanitation</th>
                  <th>Members</th>
                  <th>GPS</th>
                </tr>
              </thead>
              <tbody>
                {filteredHouseholds.map((row) => (
                  <tr key={row.id}>
                    <td><strong>{row.householdNumber}</strong><small>{row.metadata?.houseType || "Household"}</small></td>
                    <td><strong>{row.headOfHousehold}</strong><small>{row.phone || "No phone"}</small></td>
                    <td>{row.village}</td>
                    <td><small>{row.waterSource || "-"} / {row.sanitation || "-"}</small></td>
                    <td>{row.memberCount || row.members?.length || 0}</td>
                    <td><span className={row.lat && row.lng ? "community-pill green" : "community-pill"}>{row.lat && row.lng ? "Mapped" : "Pending"}</span></td>
                  </tr>
                ))}
                {!filteredHouseholds.length ? <tr><td colSpan={6} className="community-empty">No households registered yet.</td></tr> : null}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="community-panel">
          <div className="community-title">
            <div>
              <span>Offline-First Mobile</span>
              <h2>Sync Queue</h2>
            </div>
            <Smartphone size={18} />
          </div>
          <div className="community-sync">
            <div><span>Local pending</span><strong>{offlineQueue.length}</strong></div>
            <div><span>Server synced</span><strong>{syncStatus.synced || 0}</strong></div>
            <div><span>Conflicts</span><strong>{syncStatus.conflicts || 0}</strong></div>
          </div>
          <div className="community-list">
            {offlineQueue.slice(0, 5).map((row) => (
              <article key={row.clientRecordId}>
                <strong>{pretty(row.entityType)}</strong>
                <small>{row.clientRecordId}</small>
              </article>
            ))}
            {!offlineQueue.length ? <p className="community-empty">All mobile records are synced.</p> : null}
          </div>
        </aside>
      </section>

      <section className="community-bottom-grid community-operations-grid">
        {["units", "programmes", "campaigns", "followups", "tasks"].map((resource) => (
          <article className="community-panel" key={resource}>
            <div className="community-title"><div><span>Operational register</span><h2>{pretty(resource)}</h2></div><CheckCircle2 size={18} /></div>
            <div className="community-list">
              {(operational[resource] || []).slice(0, 5).map((row) => <article key={row.id}><strong>{row.name || row.title || row.taskType || "Community record"}</strong><small>{row.description || row.householdId || row.chwId || "No details"}</small><span className="community-pill green">{pretty(row.status || "ACTIVE")}</span></article>)}
              {!(operational[resource] || []).length ? <p className="community-empty">No {resource} recorded yet.</p> : null}
            </div>
          </article>
        ))}
      </section>

      <section className="community-bottom-grid">
        <div className="community-panel">
          <div className="community-title">
            <div>
              <span>Closed-Loop Feedback</span>
              <h2>Community Referrals</h2>
            </div>
            <MessageSquare size={18} />
          </div>
          <div className="community-list">
            {referrals.slice(0, 8).map((row) => (
              <article key={row.id}>
                <strong>{row.referralSlipNumber || row.id}</strong>
                <small>{row.referralReason}</small>
                <span className={row.arrivedAtFacility ? "community-pill green" : "community-pill orange"}>{row.arrivedAtFacility ? "Attended" : row.status}</span>
              </article>
            ))}
            {!referrals.length ? <p className="community-empty">No community referrals yet.</p> : null}
          </div>
        </div>

        <div className="community-panel">
          <div className="community-title">
            <div>
              <span>Disease Surveillance</span>
              <h2>Weekly Returns</h2>
            </div>
            <ShieldAlert size={18} />
          </div>
          <div className="community-list">
            {surveillance.slice(0, 8).map((row) => (
              <article key={row.id}>
                <strong>{fmtDate(row.reportPeriod)}</strong>
                <small>{row.outbreakAlert ? `Alert: ${pretty(row.outbreakDisease)}` : "No threshold breach"}</small>
                <span className={row.outbreakAlert ? "community-pill red" : "community-pill green"}>{row.outbreakAlert ? "Early warning" : "Normal"}</span>
              </article>
            ))}
            {!surveillance.length ? <p className="community-empty">No weekly surveillance returns yet.</p> : null}
          </div>
        </div>

        <div className="community-panel">
          <div className="community-title">
            <div>
              <span>CHW Coverage</span>
              <h2>Field Workers</h2>
            </div>
            <UsersRound size={18} />
          </div>
          <div className="community-list">
            {chws.slice(0, 8).map((row) => (
              <article key={row.id}>
                <strong>{row.fullName}</strong>
                <small>{row.phone} - {row.village || "No village"}</small>
                <span className={row.isActive ? "community-pill green" : "community-pill"}>{row.isActive ? "Active" : "Inactive"}</span>
              </article>
            ))}
            {!chws.length ? <p className="community-empty">Register the first CHW to begin household mapping.</p> : null}
          </div>
        </div>
      </section>

      {modal === "chw" ? (
        <CommunityModal title="Register CHW" tone="green" onClose={() => setModal("")}>
          <form className="community-form" onSubmit={saveChw}>
            <label>Full Name<input required value={chwForm.fullName} onChange={(event) => setChwForm({ ...chwForm, fullName: event.target.value })} /></label>
            <label>Phone<input required value={chwForm.phone} onChange={(event) => setChwForm({ ...chwForm, phone: event.target.value })} /></label>
            <label>ID Number<input value={chwForm.idNumber} onChange={(event) => setChwForm({ ...chwForm, idNumber: event.target.value })} /></label>
            <label>Cadre<select value={chwForm.cadre} onChange={(event) => setChwForm({ ...chwForm, cadre: event.target.value })}><option>CHW</option><option>CHP</option><option>Supervisor</option></select></label>
            <label>Village<input value={chwForm.village} onChange={(event) => setChwForm({ ...chwForm, village: event.target.value })} /></label>
            <label>Sub-location<input value={chwForm.subLocation} onChange={(event) => setChwForm({ ...chwForm, subLocation: event.target.value })} /></label>
            <footer><button type="button" onClick={() => setModal("")}>Cancel</button><button disabled={saving === "chw"}>Save CHW</button></footer>
          </form>
        </CommunityModal>
      ) : null}

      {modal === "household" ? (
        <CommunityModal title="Register Household" tone="blue" onClose={() => setModal("")}>
          <form className="community-form" onSubmit={saveHousehold}>
            <label>CHW<select value={householdForm.chwId || selectedChwId} onChange={(event) => setHouseholdForm({ ...householdForm, chwId: event.target.value })}>{chws.map((row) => <option key={row.id} value={row.id}>{row.fullName}</option>)}</select></label>
            <label>Household Number<input value={householdForm.householdNumber} onChange={(event) => setHouseholdForm({ ...householdForm, householdNumber: event.target.value })} placeholder="Auto if blank" /></label>
            <label>Head of Household<input required value={householdForm.headOfHousehold} onChange={(event) => setHouseholdForm({ ...householdForm, headOfHousehold: event.target.value })} /></label>
            <label>Phone<input value={householdForm.phone} onChange={(event) => setHouseholdForm({ ...householdForm, phone: event.target.value })} /></label>
            <label>Village<input required value={householdForm.village} onChange={(event) => setHouseholdForm({ ...householdForm, village: event.target.value })} /></label>
            <label>House Type<input value={householdForm.houseType} onChange={(event) => setHouseholdForm({ ...householdForm, houseType: event.target.value })} /></label>
            <label>GPS Latitude<input value={householdForm.lat} onChange={(event) => setHouseholdForm({ ...householdForm, lat: event.target.value })} /></label>
            <label>GPS Longitude<input value={householdForm.lng} onChange={(event) => setHouseholdForm({ ...householdForm, lng: event.target.value })} /></label>
            <label>Water Source<input value={householdForm.waterSource} onChange={(event) => setHouseholdForm({ ...householdForm, waterSource: event.target.value })} /></label>
            <label>Sanitation<input value={householdForm.sanitation} onChange={(event) => setHouseholdForm({ ...householdForm, sanitation: event.target.value })} /></label>
            <label>Cooking Fuel<input value={householdForm.cookingFuel} onChange={(event) => setHouseholdForm({ ...householdForm, cookingFuel: event.target.value })} /></label>
            <label>Under 5<input type="number" min="0" value={householdForm.under5} onChange={(event) => setHouseholdForm({ ...householdForm, under5: event.target.value })} /></label>
            <label>Age 5-17<input type="number" min="0" value={householdForm.fiveTo17} onChange={(event) => setHouseholdForm({ ...householdForm, fiveTo17: event.target.value })} /></label>
            <label>Adults<input type="number" min="0" value={householdForm.adults} onChange={(event) => setHouseholdForm({ ...householdForm, adults: event.target.value })} /></label>
            <label>Elderly<input type="number" min="0" value={householdForm.elderly} onChange={(event) => setHouseholdForm({ ...householdForm, elderly: event.target.value })} /></label>
            <div className="community-form-section">
              <strong>Household Members</strong>
              {householdForm.members.map((member, index) => (
                <div className="community-member-row" key={index}>
                  <input value={member.name} onChange={(event) => updateMember(index, "name", event.target.value)} placeholder="Member name" />
                  <select value={member.gender} onChange={(event) => updateMember(index, "gender", event.target.value)}><option>UNKNOWN</option><option>MALE</option><option>FEMALE</option></select>
                  <input value={member.relationshipToHead} onChange={(event) => updateMember(index, "relationshipToHead", event.target.value)} placeholder="Relationship" />
                  <input value={member.patientId} onChange={(event) => updateMember(index, "patientId", event.target.value)} placeholder="Hospital MRN / patient id" />
                </div>
              ))}
              <button type="button" onClick={() => setHouseholdForm((current) => ({ ...current, members: [...current.members, { name: "", gender: "UNKNOWN", relationshipToHead: "", dateOfBirth: "", patientId: "" }] }))}>Add Member</button>
            </div>
            <footer><button type="button" onClick={() => queueOffline("HOUSEHOLD", { ...householdForm, chwId: householdForm.chwId || selectedChwId })}>Save Offline</button><button disabled={saving === "household"}>Register Household</button></footer>
          </form>
        </CommunityModal>
      ) : null}

      {modal === "visit" ? (
        <CommunityModal title="Log CHW Visit" tone="green" onClose={() => setModal("")}>
          <form className="community-form" onSubmit={saveVisit}>
            <label>CHW<select value={visitForm.chwId || selectedChwId} onChange={(event) => setVisitForm({ ...visitForm, chwId: event.target.value })}>{chws.map((row) => <option key={row.id} value={row.id}>{row.fullName}</option>)}</select></label>
            <label>Household<select value={visitForm.householdId || selectedHouseholdId} onChange={(event) => setVisitForm({ ...visitForm, householdId: event.target.value })}>{households.map((row) => <option key={row.id} value={row.id}>{row.householdNumber} - {row.headOfHousehold}</option>)}</select></label>
            <label>Visit Date<input type="date" value={visitForm.visitDate} onChange={(event) => setVisitForm({ ...visitForm, visitDate: event.target.value })} /></label>
            <label>Visit Type<input value={visitForm.visitType} onChange={(event) => setVisitForm({ ...visitForm, visitType: event.target.value })} /></label>
            <label>Members Present<input type="number" min="0" value={visitForm.membersPresent} onChange={(event) => setVisitForm({ ...visitForm, membersPresent: event.target.value })} /></label>
            <label>Services Provided<input value={visitForm.servicesProvided} onChange={(event) => setVisitForm({ ...visitForm, servicesProvided: event.target.value })} /></label>
            <label>GPS Latitude<input value={visitForm.gpsLat} onChange={(event) => setVisitForm({ ...visitForm, gpsLat: event.target.value })} /></label>
            <label>GPS Longitude<input value={visitForm.gpsLng} onChange={(event) => setVisitForm({ ...visitForm, gpsLng: event.target.value })} /></label>
            <label className="wide">Findings<textarea value={visitForm.findings} onChange={(event) => setVisitForm({ ...visitForm, findings: event.target.value })} /></label>
            <label>Referrals Made<input type="number" min="0" value={visitForm.referralsMade} onChange={(event) => setVisitForm({ ...visitForm, referralsMade: event.target.value })} /></label>
            <label>Next Visit<input type="date" value={visitForm.nextVisitDate} onChange={(event) => setVisitForm({ ...visitForm, nextVisitDate: event.target.value })} /></label>
            <footer><button type="button" onClick={() => queueOffline("VISIT", { ...visitForm, chwId: visitForm.chwId || selectedChwId, householdId: visitForm.householdId || selectedHouseholdId, servicesProvided: visitForm.servicesProvided.split(",") })}>Save Offline</button><button disabled={saving === "visit"}>Save Visit</button></footer>
          </form>
        </CommunityModal>
      ) : null}

      {modal === "referral" ? (
        <CommunityModal title="Issue Community Referral" tone="orange" onClose={() => setModal("")}>
          <form className="community-form" onSubmit={saveReferral}>
            <label>CHW<select value={referralForm.chwId || selectedChwId} onChange={(event) => setReferralForm({ ...referralForm, chwId: event.target.value })}>{chws.map((row) => <option key={row.id} value={row.id}>{row.fullName}</option>)}</select></label>
            <label>Patient / Member Name<input value={referralForm.patientName} onChange={(event) => setReferralForm({ ...referralForm, patientName: event.target.value })} /></label>
            <label>Hospital Patient ID<input value={referralForm.patientId} onChange={(event) => setReferralForm({ ...referralForm, patientId: event.target.value })} /></label>
            <label>Household Member ID<input value={referralForm.householdMemberId} onChange={(event) => setReferralForm({ ...referralForm, householdMemberId: event.target.value })} /></label>
            <label>Urgency<select value={referralForm.urgency} onChange={(event) => setReferralForm({ ...referralForm, urgency: event.target.value })}><option>ROUTINE</option><option>URGENT</option><option>EMERGENCY</option></select></label>
            <label>Facility ID<input value={referralForm.referredToFacilityId} onChange={(event) => setReferralForm({ ...referralForm, referredToFacilityId: event.target.value })} placeholder="Current facility if blank" /></label>
            <label className="wide">Reason<textarea required value={referralForm.referralReason} onChange={(event) => setReferralForm({ ...referralForm, referralReason: event.target.value })} placeholder="e.g. Pregnant woman overdue for ANC, malnutrition signs, uncontrolled hypertension" /></label>
            <footer><button type="button" onClick={() => queueOffline("REFERRAL", { ...referralForm, chwId: referralForm.chwId || selectedChwId })}>Save Offline</button><button disabled={saving === "referral"}>Issue Referral</button></footer>
          </form>
        </CommunityModal>
      ) : null}

      {modal === "attendance" ? (
        <CommunityModal title="Close Referral Feedback Loop" tone="blue" onClose={() => setModal("")}>
          <form className="community-form" onSubmit={closeReferral}>
            <label>Referral Slip / SMS Code<input required value={attendanceForm.referralCode} onChange={(event) => setAttendanceForm({ ...attendanceForm, referralCode: event.target.value })} /></label>
            <label>Patient ID<input value={attendanceForm.patientId} onChange={(event) => setAttendanceForm({ ...attendanceForm, patientId: event.target.value })} /></label>
            <label>Attended Facility<input value={attendanceForm.attendedFacility} onChange={(event) => setAttendanceForm({ ...attendanceForm, attendedFacility: event.target.value })} /></label>
            <label>Diagnosis<input value={attendanceForm.diagnosis} onChange={(event) => setAttendanceForm({ ...attendanceForm, diagnosis: event.target.value })} /></label>
            <label>Follow-up Due<input type="date" value={attendanceForm.followUpDue} onChange={(event) => setAttendanceForm({ ...attendanceForm, followUpDue: event.target.value })} /></label>
            <label className="wide">Outcome Notes<textarea value={attendanceForm.outcomeNotes} onChange={(event) => setAttendanceForm({ ...attendanceForm, outcomeNotes: event.target.value })} /></label>
            <footer><button type="button" onClick={() => setModal("")}>Cancel</button><button disabled={saving === "attendance"}>Send CHW Feedback</button></footer>
          </form>
        </CommunityModal>
      ) : null}

      {modal === "surveillance" ? (
        <CommunityModal title="Weekly Disease Surveillance Return" tone="red" onClose={() => setModal("")}>
          <form className="community-form" onSubmit={saveSurveillance}>
            <label>Report Week<input type="date" value={surveillanceForm.reportPeriod} onChange={(event) => setSurveillanceForm({ ...surveillanceForm, reportPeriod: event.target.value })} /></label>
            <label>Prepared By<input value={surveillanceForm.preparedBy} onChange={(event) => setSurveillanceForm({ ...surveillanceForm, preparedBy: event.target.value })} /></label>
            <label>Catchment Area<input value={surveillanceForm.catchmentArea} onChange={(event) => setSurveillanceForm({ ...surveillanceForm, catchmentArea: event.target.value })} /></label>
            <label>Catchment Population<input type="number" min="0" value={surveillanceForm.catchmentPopulation} onChange={(event) => setSurveillanceForm({ ...surveillanceForm, catchmentPopulation: event.target.value })} /></label>
            {(["acute_febrile_illness", "acute_watery_diarrhoea", "acute_respiratory_illness", "skin_rash", "eye_disease", "animal_bite"] as const).map((key) => (
              <label key={key}>{pretty(key)}<input type="number" min="0" value={surveillanceForm[key]} onChange={(event) => setSurveillanceForm({ ...surveillanceForm, [key]: event.target.value })} /></label>
            ))}
            <footer><button type="button" onClick={() => queueOffline("SURVEILLANCE", { ...surveillanceForm })}>Save Offline</button><button disabled={saving === "surveillance"}>Submit Return</button></footer>
          </form>
        </CommunityModal>
      ) : null}

      {modal === "offline" ? (
        <CommunityModal title="Offline Mobile Queue" tone="green" onClose={() => setModal("")}>
          <div className="community-offline-modal">
            <div className="community-sync">
              <div><span>Pending locally</span><strong>{offlineQueue.length}</strong></div>
              <div><span>Server synced</span><strong>{syncStatus.synced || 0}</strong></div>
              <div><span>Conflicts</span><strong>{syncStatus.conflicts || 0}</strong></div>
            </div>
            <div className="community-list">
              {offlineQueue.map((row) => (
                <article key={row.clientRecordId}>
                  <strong>{pretty(row.entityType)}</strong>
                  <small>{row.clientRecordId} - {fmtDate(row.updatedAt)}</small>
                </article>
              ))}
              {!offlineQueue.length ? <p className="community-empty"><CheckCircle2 size={16} /> No local records are pending.</p> : null}
            </div>
            <footer className="community-offline-actions">
              <button type="button" onClick={() => setModal("")}>Close</button>
              <button type="button" disabled={saving === "sync"} onClick={() => void syncOfflineQueue()}><CloudUpload size={15} /> Sync Now</button>
            </footer>
          </div>
        </CommunityModal>
      ) : null}

      {modal === "operation" ? (
        <CommunityModal title={`Create ${pretty(operationType.slice(0, -1))}`} tone="blue" onClose={() => setModal("")}>
          <form className="community-form" onSubmit={saveOperation}>
            <label>Name / title<input required value={operationForm.name || operationForm.title} onChange={(event) => setOperationForm({ ...operationForm, name: event.target.value, title: event.target.value })} placeholder="Enter a clear record name" /></label>
            <label>Status<select value={operationForm.status} onChange={(event) => setOperationForm({ ...operationForm, status: event.target.value })}><option>ACTIVE</option><option>OPEN</option><option>PLANNED</option><option>COMPLETED</option><option>CANCELLED</option></select></label>
            <label className="wide">Description / notes<textarea value={operationForm.description} onChange={(event) => setOperationForm({ ...operationForm, description: event.target.value })} /></label>
            {(operationType === "tasks" || operationType === "followups" || operationType === "campaigns") ? <label>Due / end date<input type="date" value={operationForm.dueDate} onChange={(event) => setOperationForm({ ...operationForm, dueDate: event.target.value })} /></label> : null}
            {(operationType === "tasks" || operationType === "followups") ? <><label>Household ID<input value={operationForm.householdId} onChange={(event) => setOperationForm({ ...operationForm, householdId: event.target.value })} /></label><label>CHW ID<input value={operationForm.chwId} onChange={(event) => setOperationForm({ ...operationForm, chwId: event.target.value })} /></label></> : null}
            <footer><button type="button" onClick={() => setModal("")}>Cancel</button><button disabled={saving === "operation"}>Save record</button></footer>
          </form>
        </CommunityModal>
      ) : null}
    </main>
  );
}

function CommunityModal({
  title,
  tone,
  children,
  onClose,
}: {
  title: string;
  tone: "green" | "blue" | "orange" | "red";
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="community-modal-backdrop">
      <section className={`community-modal is-${tone}`}>
        <header>
          <div>
            <span>Community Health</span>
            <h2>{title}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </header>
        {children}
      </section>
    </div>
  );
}
