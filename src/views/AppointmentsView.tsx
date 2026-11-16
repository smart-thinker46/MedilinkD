// Ported from Medilink-Frontend/src/app/appointments/page.tsx for desktop parity.
import { useEffect, useMemo, useState } from "react";
import { ModuleIcon } from "../components/layout/ModuleIcon";
import { SimpleModulePlaceholder } from "../components/layout/SimpleModulePlaceholder";
import { AppointmentForm } from "../components/appointments/AppointmentForm";
import { api } from "../lib/api";
import { setPatientQueueStatus } from "../lib/patientQueueState";
import { useLiveRefresh } from "../lib/liveRefresh";

const noticeTone = (message: string) => {
  const lower = message.toLowerCase();
  if (lower.includes("failed") || lower.includes("error")) return "error";
  if (lower.includes("no due") || lower.includes("enabled")) return "warning";
  if (lower.includes("notified") || lower.includes("offered")) return "info";
  return "success";
};

// Date inputs must use the browser's local calendar date. Using
// `toISOString().slice(0, 10)` directly can shift the displayed day for
// users outside UTC (including East Africa).
const toLocalDate = (value?: string) => {
  const date = value ? new Date(value) : new Date();
  if (!Number.isFinite(date.getTime())) return "";
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
};

export default function AppointmentsView() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"booking" | "slots" | "cancel">("booking");
  const [calendarDate, setCalendarDate] = useState(new Date().toISOString().slice(0, 10));
  const [calendarDoctor, setCalendarDoctor] = useState("All doctors");
  const [selectedSlot, setSelectedSlot] = useState<{ date: string; time: string } | null>(null);
  const [sidebarInitialData, setSidebarInitialData] = useState<any | null>(null);
  const [notice, setNotice] = useState("");
  const [waitingListOpen, setWaitingListOpen] = useState(false);
  const [waitingListLoading, setWaitingListLoading] = useState(false);
  const [waitingListRows, setWaitingListRows] = useState<any[]>([]);
  const [checkedInQueuePatients, setCheckedInQueuePatients] = useState<Record<string, boolean>>({});
  const [activeQueuePatient, setActiveQueuePatient] = useState<any | null>(null);
  const [appointmentStats, setAppointmentStats] = useState<any>({});

  const load = async () => {
    setLoading(true);
    try {
      const [res, statsRes] = await Promise.all([
        api.get("/appointments"),
        api.get("/appointments/stats").catch(() => ({ data: {} })),
      ]);
      setAppointments(Array.isArray(res.data) ? res.data : []);
      setAppointmentStats(statsRes.data || {});
    } catch {
      setAppointments([]);
      setAppointmentStats({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const loadWaitingList = async () => {
    setWaitingListLoading(true);
    try {
      const response = await api.get("/opd/queue/board", {
        params: { departmentId: "APPOINTMENTS" },
      });
      const tokens = Array.isArray(response.data?.tokens)
        ? response.data.tokens
        : Array.isArray(response.data?.data?.tokens)
          ? response.data.data.tokens
          : [];
      setWaitingListRows(tokens);
    } catch {
      setWaitingListRows([]);
    } finally {
      setWaitingListLoading(false);
    }
  };

  useEffect(() => {
    void loadWaitingList();
  }, []);

  useLiveRefresh(async () => {
    await Promise.all([load(), loadWaitingList()]);
  }, { intervalMs: 90000 });

  const appointmentDateTime = (item: any) => {
    const directValue = item?.dateTime || item?.scheduledAt;
    const directDate = directValue ? new Date(String(directValue)) : null;
    if (directDate && Number.isFinite(directDate.getTime())) return directDate;

    const dateValue = item?.scheduledDate || item?.appointmentDate || item?.date;
    const timeValue = item?.scheduledTime || item?.startTime || item?.time || item?.slotTime;
    if (dateValue && timeValue) {
      const datePart = String(dateValue).includes("T") ? String(dateValue).slice(0, 10) : String(dateValue);
      const timePart = String(timeValue).includes("T") ? String(timeValue).slice(11, 16) : String(timeValue).slice(0, 5);
      const combined = new Date(`${datePart}T${timePart || "00:00"}:00`);
      if (Number.isFinite(combined.getTime())) return combined;
    }

    const fallbackDate = dateValue ? new Date(String(dateValue)) : null;
    return fallbackDate && Number.isFinite(fallbackDate.getTime()) ? fallbackDate : null;
  };

  useEffect(() => {
    const handleWaitingListOpen = (event: Event) => {
      const detail = (event as CustomEvent).detail || {};
      if (detail?.departmentId !== "APPOINTMENTS" && detail?.moduleKey !== "appointments") return;
      setWaitingListOpen(true);
      void loadWaitingList();
    };
    const handleQueued = (event: Event) => {
      const detail = (event as CustomEvent).detail || {};
      const departmentId = detail?.destination?.departmentId || detail?.departmentId;
      if (departmentId && departmentId !== "APPOINTMENTS") return;
      void loadWaitingList();
    };
    window.addEventListener("hmis:open-module-waiting-list", handleWaitingListOpen);
    window.addEventListener("hmis:patient-queued", handleQueued);
    return () => {
      window.removeEventListener("hmis:open-module-waiting-list", handleWaitingListOpen);
      window.removeEventListener("hmis:patient-queued", handleQueued);
    };
  }, []);

  const rows = useMemo(() => {
    if (loading) return [];
    const appointmentRows = appointments.map((item) => {
      const patientName = item?.patient
        ? [item.patient.firstName, item.patient.middleName, item.patient.lastName].filter(Boolean).join(" ").trim() ||
          item.patient.name ||
          item.patient.fullName ||
          item.patient.displayName
        : "";
      const patient =
        patientName ||
        item?.patientName ||
        item?.patientFullName ||
        item?.patient?.patientCode ||
        item?.patient?.mrn ||
        item?.mrn ||
        item?.patientCode ||
        item?.patientId ||
        "Patient";
      const doctorName = item?.doctor
        ? [item.doctor.firstName, item.doctor.lastName].filter(Boolean).join(" ").trim() ||
          item.doctor.name ||
          item.doctor.fullName ||
          item.doctor.displayName
        : "";
      const doctor = doctorName
        ? (/^dr\.?\s/i.test(doctorName) ? doctorName : `Dr. ${doctorName}`)
        : item?.doctorName || item?.providerName || item?.clinicianName || item?.doctorId || "Doctor";
      const appointmentDate = item?.dateTime || item?.scheduledAt || item?.scheduledDate || item?.appointmentDate || item?.date || "";
      const parsedDate = appointmentDateTime(item);
      const formattedDate = parsedDate ? parsedDate.toLocaleString() : String(appointmentDate || "");
      const scheduledTime = item?.scheduledTime || item?.startTime || item?.time || item?.slotTime
        ? String(item?.scheduledTime || item?.startTime || item?.time || item?.slotTime).slice(0, 5)
        : "";
      const time = formattedDate ? (scheduledTime && !formattedDate.includes(scheduledTime) ? `${formattedDate} ${scheduledTime}` : formattedDate) : scheduledTime || "—";
      const status = String(item?.status || item?.appointmentStatus || "Scheduled").replace(/_/g, " ");
      const responseStatus = String(item?.responseStatus || item?.patientResponse || item?.response || "").toUpperCase();
      const statusCode = String(item?.status || item?.appointmentStatus || "").toUpperCase();
      const source = String(item?.source || item?.bookingSource || "").toLowerCase().includes("app")
        ? "Booked via Medilink App"
        : item?.source || item?.bookingSource || "Walk-in";
      const response =
        responseStatus === "CONFIRMED" || statusCode === "CONFIRMED"
          ? "Confirmed"
          : responseStatus === "CANCELLED" || statusCode === "CANCELLED"
            ? "Cancelled"
            : statusCode === "NO_SHOW" || statusCode === "NOSHOW"
              ? "No-show"
              : ["ARRIVED", "CHECKED_IN"].includes(statusCode)
                ? "Checked in"
                : "No response";
      return {
        id: item?.id,
        original: item,
        patient,
        doctor,
        time,
        status,
        source,
        response,
      };
    });
    const queuedRows = waitingListRows.map((row) => ({
      id: `queued-${row?.tokenId || row?.tokenNumber || row?.patientId}`,
      patient: String(row?.patientName || "Queued patient"),
      doctor: "Awaiting booking",
      time: String(row?.tokenNumber || "Queue"),
      status: checkedInQueuePatients[String(row?.patientId || "")] ? "Checked In" : "Queued",
      source: "Patient Registration Queue",
      response: "Waiting list",
    }));
    return [...queuedRows, ...appointmentRows];
  }, [appointments, checkedInQueuePatients, loading, waitingListRows]);

  const today = toLocalDate();
  const todayAppointments = appointments.filter((item) => {
    const date = appointmentDateTime(item);
    return date ? toLocalDate(date.toISOString()) === today : false;
  });
  const booked = appointments.filter((a) => !["CANCELLED", "NO_SHOW", "NOSHOW"].includes(String(a?.status || "").toUpperCase())).length;
  const cancelled = appointments.filter((a) => String(a?.status || "").toUpperCase() === "CANCELLED").length;
  const noShows = appointments.filter((a) => ["NO_SHOW", "NOSHOW"].includes(String(a?.status || "").toUpperCase())).length;
  const appBookings = appointments.filter((a) => String(a?.source || "").toLowerCase().includes("app")).length;
  const appointmentPatientName = (item: any) =>
    item?.patient
      ? `${item.patient.firstName || ""} ${item.patient.lastName || ""}`.trim() || "Patient"
      : item?.patientName || "Patient";
  const appointmentDoctorFirstName = (item: any) =>
    item?.doctor?.firstName || String(item?.doctorName || "Doctor").replace(/^Dr\.?\s+/i, "").split(" ")[0] || "Doctor";
  const doctorOptions = useMemo(
    () => Array.from(new Set(rows.map((row) => row.doctor).filter(Boolean))),
    [rows],
  );
  const calendarAppointments = appointments.filter((item) => {
    const date = String(item?.dateTime || item?.scheduledDate || "").slice(0, 10);
    const doctor = item?.doctor
      ? `Dr. ${item.doctor.firstName || ""} ${item.doctor.lastName || ""}`.trim()
      : item?.doctorName || "Doctor";
    return date === calendarDate && (calendarDoctor === "All doctors" || doctor === calendarDoctor);
  });
  const bookedByTime = calendarAppointments.reduce((map, item) => {
    if (["CANCELLED", "NO_SHOW", "NOSHOW"].includes(String(item?.status || "").toUpperCase())) {
      return map;
    }
    const time = new Date(item?.dateTime || item?.scheduledTime || Date.now()).toTimeString().slice(0, 5);
    const current = map.get(time) || [];
    current.push(item);
    map.set(time, current);
    return map;
  }, new Map<string, any[]>());
  const calendarSlots = Array.from({ length: 20 }, (_, index) => {
    const totalMinutes = 8 * 60 + index * 30;
    const hour = Math.floor(totalMinutes / 60);
    const minute = totalMinutes % 60;
    const time = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
    const slotAppointments = bookedByTime.get(time) || [];
    const appointment = slotAppointments[0];
    const blocked = hour === 12;
    return {
      time,
      appointment,
      appointments: slotAppointments,
      patientCount: slotAppointments.length,
      doctorFirstName: appointment ? appointmentDoctorFirstName(appointment) : "",
      status: blocked ? "blocked" : slotAppointments.length > 0 ? "booked" : "available",
    };
  }).filter((slot) => Number(slot.time.slice(0, 2)) < 18);
  const waitingList = rows
    .filter((row) => row.status === "WAITING_LIST" || String(row.source).toLowerCase().includes("waiting"))
    .slice(0, 5);

  const updateAppointmentStatus = async (id: string, status: string) => {
    try {
      if (status === "CONFIRMED") {
        await api.post(`/appointments/${id}/check-in`);
      } else {
        await api.patch(`/appointments/${id}`, { status });
      }
      setNotice(status === "NO_SHOW" ? "Appointment marked as no-show." : status === "CONFIRMED" ? "Patient arrival confirmed." : "Appointment updated.");
      await load();
    } catch (error: any) {
      setNotice(error?.response?.data?.message || "Appointment update failed.");
    }
  };

  useEffect(() => {
    const handleSidebarAction = async (event: Event) => {
      const action = String((event as CustomEvent<{ action?: string }>).detail?.action || "");
      if (action === "recurring") {
        setSidebarInitialData({
          repeatEnabled: true,
          repeatEvery: 6,
          repeatUnit: "weeks",
          repeatUntil: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        });
        setSelectedSlot(null);
        setFormMode("booking");
        setIsFormOpen(true);
        setNotice("Recurring series mode enabled.");
        return;
      }

      if (action === "waitlist") {
        try {
          const res = await api.post("/appointments/notify-waitlist");
          setNotice(res.data?.message || "Next waiting-list patient offered the available slot.");
          await Promise.all([load(), loadWaitingList()]);
        } catch (error: any) {
          setNotice(error?.response?.data?.message || "Waiting-list release failed.");
        }
        return;
      }

      if (action === "no-show") {
        const now = new Date();
        const candidate = appointments.find((item) => {
          const status = String(item?.status || item?.appointmentStatus || "SCHEDULED").toUpperCase();
          const time = appointmentDateTime(item);
          return ["SCHEDULED", "BOOKED", "CONFIRMED", "ARRIVED", "CHECKED_IN"].includes(status) && time !== null && time <= now;
        });
        if (!candidate?.id) {
          setNotice("No due appointment is ready to mark as no-show.");
          return;
        }
        await updateAppointmentStatus(candidate.id, "NO_SHOW");
      }
    };
    window.addEventListener("hmis:appointment-sidebar-action", handleSidebarAction);
    return () => window.removeEventListener("hmis:appointment-sidebar-action", handleSidebarAction);
  }, [appointments]);

  useEffect(() => {
    const handleAppointmentFormOpen = (event: Event) => {
      const formName = String((event as CustomEvent<{ formName?: string }>).detail?.formName || "").toLowerCase();
      if (!formName) return;
      setSelectedSlot(null);
      setSidebarInitialData(null);
      setActiveQueuePatient(null);
      if (formName.includes("slot configuration")) {
        setFormMode("slots");
      } else if (formName.includes("cancellation")) {
        setFormMode("cancel");
      } else {
        setFormMode("booking");
      }
      setIsFormOpen(true);
    };

    window.addEventListener("hmis:open-appointment-form", handleAppointmentFormOpen);
    return () => window.removeEventListener("hmis:open-appointment-form", handleAppointmentFormOpen);
  }, []);

  const [waitingCheckInDate, setWaitingCheckInDate] = useState(() => toLocalDate(new Date().toISOString()));

  const checkInQueuedAppointmentPatient = async (row: any, checkInDate = waitingCheckInDate) => {
    const patientId = String(row?.patientId || "").trim();
    if (!patientId) return;
    try {
      await api.patch("/opd/queue/token/status", {
        tokenId: row?.tokenId || row?.id,
        tokenNumber: row?.tokenNumber,
        patientId,
        visitId: row?.visitId,
        status: "IN_SERVICE",
        checkInDate,
        reason: "Checked in to Appointments",
      });
    } catch {
      // Local check-in still lets the receptionist book/serve the queued patient.
    }
    try {
      await api.post("/module-actions", {
        module: "appointments",
        action: "Queued Patient Check-In",
        data: {
          patientId,
          patientName: row?.patientName || "Patient",
          patient_mrn: row?.patientCode || row?.mrn || "",
          mrn: row?.patientCode || row?.mrn || "",
          queueToken: row?.tokenNumber || "",
          queueStatus: "IN_SERVICE",
          checkInDate,
          checkedInAt: new Date().toISOString(),
        },
        context: { title: "Appointments & Schedules", source: "appointment.waiting-list" },
      });
    } catch {
      // Do not block check-in if audit action logging is temporarily unavailable.
    }
    setCheckedInQueuePatients((current) => ({ ...current, [patientId]: true }));
    setPatientQueueStatus({
      patientId,
      queueModule: "Appointments & Schedules",
      departmentId: "APPOINTMENTS",
      tokenNumber: row?.tokenNumber || "",
      checkedIn: true,
      checkedInAt: new Date().toISOString(),
    });
    const checkedInState = {
      hasCheckedInPatient: true,
      id: patientId,
      patientId,
      patientName: row?.patientName || row?.name || "",
      name: row?.patientName || row?.name || "",
      mrn: row?.patientCode || row?.mrn || "",
      patientCode: row?.patientCode || row?.mrn || "",
      queueModule: "Appointments & Schedules",
      isQueued: false,
      checkInDate,
    };
    const states = JSON.parse(window.localStorage.getItem("hmis_patient_module_states") || "{}");
    states.appointments = checkedInState;
    window.localStorage.setItem("hmis_patient_module_states", JSON.stringify(states));
    window.dispatchEvent(new CustomEvent("hmis:patient-module-state", { detail: { moduleKey: "appointments", state: checkedInState } }));
    setActiveQueuePatient(row);
    setNotice(`${String(row?.patientName || "Patient")} checked in for Appointments.`);
    setWaitingListOpen(false);
    setFormMode("booking");
    setIsFormOpen(true);
    await loadWaitingList();
  };

  return (
    <>
      <SimpleModulePlaceholder
        title="Appointments & Schedules"
        subtitle="Consultation scheduling and visit coordination"
        icon={<ModuleIcon name="event" />}
        stats={[
          { label: "Today's Visits", value: appointmentStats.todayVisits ?? todayAppointments.length, color: "#1e3a8a" },
          { label: "Booked Slots", value: appointmentStats.bookedSlots ?? booked, color: "#16a34a" },
          { label: "Cancelled", value: appointmentStats.cancelled ?? cancelled, color: "#7c3aed" },
          { label: "No-Shows", value: appointmentStats.noShows ?? noShows, color: "#dc2626" },
          { label: "App Bookings", value: appointmentStats.appBookings ?? appBookings, color: "#0ea5e9" },
          { label: "Completed", value: appointmentStats.completed ?? appointments.filter((a) => a?.status === "COMPLETED").length, color: "#0d9488" },
        ]}
        columns={[
          { label: "Patient", key: "patient" },
          { label: "Doctor", key: "doctor" },
          { label: "Time", key: "time" },
          { label: "Source", key: "source" },
          { label: "Response", key: "response" },
          { label: "Status", key: "status" },
        ]}
        rows={rows}
        searchPlaceholder="Search patient"
        searchKeys={["patient", "doctor", "time", "source", "response", "status"]}
        captureActions={false}
        useProvidedStats
        onRowClick={(row) => {
          if (!row?.original) return;
          setSidebarInitialData(row.original);
          setSelectedSlot(null);
          setFormMode("booking");
          setIsFormOpen(true);
        }}
        afterSearchContent={
          <section className="appointment-calendar-board">
            <div className="appointment-calendar-toolbar">
              <div>
                <h3>Slot-Based Calendar View</h3>
                <p>Click a green slot to reserve it. Red slots are booked, grey slots are blocked.</p>
              </div>
              <div className="appointment-calendar-filters">
                <input type="date" value={calendarDate} onChange={(event) => setCalendarDate(event.target.value)} />
                <select value={calendarDoctor} onChange={(event) => setCalendarDoctor(event.target.value)}>
                  <option>All doctors</option>
                  {doctorOptions.map((doctor) => <option key={doctor}>{doctor}</option>)}
                </select>
              </div>
            </div>
            {notice ? <div className="appointment-calendar-notice">{notice}</div> : null}
            <div className="appointment-calendar-legend">
              <span><i className="slot-available" /> Available</span>
              <span><i className="slot-booked" /> Booked</span>
              <span><i className="slot-blocked" /> Blocked</span>
            </div>
            <div className="appointment-calendar-grid">
              {calendarSlots.map((slot) => (
                <button
                  key={slot.time}
                  type="button"
                  className={`appointment-calendar-slot is-${slot.status}`}
                  disabled={slot.status !== "available"}
                  onClick={() => {
                    setSelectedSlot({ date: calendarDate, time: slot.time });
                    setFormMode("booking");
                    setIsFormOpen(true);
                  }}
                >
                  <strong>{slot.time}</strong>
                  <span>
                    {slot.status === "available"
                      ? "Available"
                      : slot.status === "blocked"
                        ? "Blocked"
                        : `${slot.patientCount} patient${slot.patientCount === 1 ? "" : "s"} · Dr. ${slot.doctorFirstName}`}
                  </span>
                  {slot.appointment ? <small>{slot.appointment.source || "HMIS"} · {slot.appointment.status || "SCHEDULED"}</small> : null}
                </button>
              ))}
            </div>
            <div className="appointment-operations-grid">
              <div>
                <h4>Patient Response Tracking</h4>
                <p>Confirmed patients are prioritised. Cancelled slots are released to waiting-list patients.</p>
                <div className="appointment-mini-list">
                  {rows.slice(0, 5).map((row) => (
                    <div key={row.id || `${row.patient}-${row.time}`}>
                      <span>{row.patient}</span>
                      <strong>{row.response}</strong>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4>Waiting List Release</h4>
                <p>When cancellation happens, the next patient can be offered the newly available slot.</p>
                <div className="appointment-mini-list">
                  {waitingList.length > 0 ? waitingList.map((row) => (
                    <div key={row.id || `${row.patient}-wait`}>
                      <span>{row.patient}</span>
                      <button 
                        type="button" 
                        onClick={async () => {
                          try {
                            const res = await api.post('/appointments/notify-waitlist');
                            setNotice(res.data?.message || `${row.patient} notified for the next available slot.`);
                          } catch {
                            setNotice(`Failed to notify ${row.patient}`);
                          }
                        }}
                      >
                        Notify
                      </button>
                    </div>
                  )) : <div><span>No waiting-list patients.</span><strong>Ready</strong></div>}
                </div>
              </div>
              <div>
                <h4>Arrival, App Booking & No-Show</h4>
                <p>Confirm arrival for app bookings or mark DNA/no-show for dashboard tracking.</p>
                <div className="appointment-mini-list">
                  {appointments.slice(0, 5).map((item) => (
                    <div key={item.id}>
                      <span>{item?.source === "Medilink App" ? "Booked via Medilink App" : appointmentPatientName(item)}</span>
                      <span className="appointment-inline-actions">
                        <button type="button" onClick={() => updateAppointmentStatus(item.id, "CONFIRMED")}>Arrived</button>
                        <button type="button" onClick={() => updateAppointmentStatus(item.id, "NO_SHOW")}>No-show</button>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        }
      />

      <AppointmentForm
        key={`${formMode}-${selectedSlot?.date || "none"}-${selectedSlot?.time || "none"}`}
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedSlot(null);
          setSidebarInitialData(null);
        }}
        initialMode={formMode}
        initialData={
          selectedSlot
            ? {
                scheduledDate: selectedSlot.date,
                scheduledTime: `${selectedSlot.date}T${selectedSlot.time}:00`,
                dateTime: `${selectedSlot.date}T${selectedSlot.time}:00`,
                patientId: activeQueuePatient?.patientId || "",
                source: activeQueuePatient ? "Patient Registration Queue" : undefined,
              }
            : activeQueuePatient
              ? {
                  patientId: activeQueuePatient.patientId,
                  source: "Patient Registration Queue",
                  notes: `Queue token ${activeQueuePatient.tokenNumber || ""}`.trim(),
                }
              : sidebarInitialData || undefined
        }
        onError={(message) => setNotice(message)}
        onSubmit={async (payload) => {
          const res = await api.post("/appointments", {
            ...payload,
            patientId: payload.patientId || activeQueuePatient?.patientId,
            source: payload.source || (activeQueuePatient ? "Patient Registration Queue" : undefined),
          });
          
          if (payload.appointmentType === "Telemedicine" && res.data?.id) {
            await api.post(`/appointments/${res.data.id}/telemedicine-link`);
          }

          if (payload.reminderSent && res.data?.id) {
            await api.post(`/appointments/${res.data.id}/remind`).catch(() => {});
          }

          await load();
          await loadWaitingList();
        }}
      />

      {waitingListOpen ? (
        <div className="module-modal-backdrop" onClick={() => setWaitingListOpen(false)}>
          <aside className="workflow-waiting-panel" onClick={(event) => event.stopPropagation()}>
            <div className="workflow-waiting-panel-head">
              <div>
                <h3>Waiting List</h3>
                <p>{waitingListRows.length} patient{waitingListRows.length === 1 ? "" : "s"} queued to Appointments.</p>
                <label className="workflow-waiting-date">Check-in date
                  <input type="date" value={waitingCheckInDate} onChange={(event) => setWaitingCheckInDate(event.target.value)} />
                </label>
              </div>
              <button type="button" className="workflow-waiting-close" onClick={() => setWaitingListOpen(false)}>
                ×
              </button>
            </div>
            <div className="workflow-waiting-panel-body">
              {waitingListLoading ? (
                <div className="pv-empty">Loading queued patients...</div>
              ) : waitingListRows.length === 0 ? (
                <div className="pv-empty">No queued patients for Appointments.</div>
              ) : (
                waitingListRows.map((row) => (
                  <div key={String(row?.tokenId || row?.tokenNumber || row?.patientId)} className="workflow-waiting-item">
                    <div className="workflow-waiting-copy">
                      <strong>{String(row?.patientName || "Queued patient")}</strong>
                      <span>{String(row?.tokenNumber || "")} · {String(row?.priority || "WAITING")}</span>
                    </div>
                    <div className="workflow-waiting-actions">
                      <button
                        type="button"
                        className="patient-search-checkin workflow-waiting-checkin"
                        onClick={() => checkInQueuedAppointmentPatient(row, waitingCheckInDate)}
                      >
                        {checkedInQueuePatients[String(row?.patientId || "")] ? "Checked In" : "Check In"}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </aside>
        </div>
      ) : null}

      {notice ? (
        <div className={`module-notice-toast is-${noticeTone(notice)}`} role="status" aria-live="polite">
          <div>
            <strong>{noticeTone(notice)}</strong>
            <span>{notice}</span>
          </div>
          <button onClick={() => setNotice("")} className="module-notice-close" type="button" aria-label="Dismiss notification">x</button>
        </div>
      ) : null}
    </>
  );
}
