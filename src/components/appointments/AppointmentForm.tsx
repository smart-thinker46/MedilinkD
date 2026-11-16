// Ported from Medilink-Frontend/src/components/appointments/AppointmentForm.tsx for desktop parity.
import { useEffect, useMemo, useState } from "react";
import {
  X,
  Calendar as CalendarIcon,
  Clock,
  User,
  UserPlus,
  Settings,
  Ban,
} from "lucide-react";
import { api } from "../../lib/api";
import { useAppStore } from "../../store/appStore";

interface AppointmentFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  onError?: (message: string) => void;
  initialData?: any;
  initialMode?: "booking" | "slots" | "cancel";
}

const INPUT_CLS =
  "appointment-form-input";

const rowsFromResponse = (payload: any): any[] => {
  const rows =
    Array.isArray(payload) ? payload :
    Array.isArray(payload?.data) ? payload.data :
    Array.isArray(payload?.data?.items) ? payload.data.items :
    Array.isArray(payload?.data?.patients) ? payload.data.patients :
    Array.isArray(payload?.patients) ? payload.patients :
    Array.isArray(payload?.items) ? payload.items :
    Array.isArray(payload?.results) ? payload.results : [];
  return rows.map((row: any) =>
    row?.patient && typeof row.patient === "object" && !row?.firstName
      ? { ...row.patient, ...row }
      : row,
  );
};

export function AppointmentForm({
  isOpen,
  onClose,
  onSubmit,
  onError,
  initialData,
  initialMode,
}: AppointmentFormProps) {
  const { facility } = useAppStore();
  const [patients, setPatients] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [configuredSlots, setConfiguredSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchPatient, setSearchPatient] = useState("");
  const [showPatientResults, setShowPatientResults] = useState(false);
  const [checkedInPatient, setCheckedInPatient] = useState<any>(null);
  const [mode, setMode] = useState<"booking" | "slots" | "cancel">(
    initialMode || "booking",
  );
  const fallbackPatients = useAppStore((state) => state.patients);

  const toLocalDate = (value?: string) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const pad = (num: number) => String(num).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
      date.getDate(),
    )}`;
  };

  const toLocalTime = (value?: string) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const pad = (num: number) => String(num).padStart(2, "0");
    return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  const baseDate =
    initialData?.scheduledDate || initialData?.dateTime || initialData?.date;
  const baseTime =
    initialData?.scheduledTime || initialData?.dateTime || initialData?.time;

  const [formData, setFormData] = useState({
    patientId: initialData?.patientId || "",
    doctorId: initialData?.doctorId || "",
    date: toLocalDate(baseDate),
    time: toLocalTime(baseTime),
    appointmentType: initialData?.appointmentType || "New",
    department: initialData?.departmentId || "",
    bookingSource: initialData?.source || "Walk-in",
    insuranceScheme: "",
    chiefComplaint: initialData?.chiefComplaint || "",
    notes: initialData?.notes || "",
    sendReminder: Boolean(initialData?.reminderSent),
    durationMinutes: initialData?.durationMinutes || 30,
    status: initialData?.status || "SCHEDULED",
    repeatEnabled: Boolean(initialData?.repeatEnabled),
    repeatEvery: initialData?.repeatEvery || 6,
    repeatUnit: initialData?.repeatUnit || "weeks",
    repeatUntil: initialData?.repeatUntil || "",
    reminder24Sms: true,
    reminder2WhatsApp: true,
    responseTracking: true,
    waitingListAllowed: true,
    requiredResources: "",
    noShowPolicy: "Track only",
    appBooking: initialData?.source === "Medilink App",
  });

  const [slotData, setSlotData] = useState({
    doctorId: "",
    department: "",
    date: "",
    startTime: "",
    endTime: "",
    slotDuration: 20,
    slotType: "OPD",
    maxPatients: 10,
  });

  const [cancelData, setCancelData] = useState({
    appointmentId: "",
    reason: "",
    notes: "",
    notifyPatient: false,
    reschedule: false,
  });

  useEffect(() => {
    const syncCheckedInPatient = () => {
      try {
        const states = JSON.parse(window.localStorage.getItem("hmis_patient_module_states") || "{}");
        setCheckedInPatient(states?.appointments || null);
      } catch {
        setCheckedInPatient(null);
      }
    };
    syncCheckedInPatient();
    window.addEventListener("hmis:patient-module-state", syncCheckedInPatient);
    window.addEventListener("storage", syncCheckedInPatient);
    return () => {
      window.removeEventListener("hmis:patient-module-state", syncCheckedInPatient);
      window.removeEventListener("storage", syncCheckedInPatient);
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode || "booking");
      setFormData((prev) => ({
        ...prev,
        patientId: initialData?.patientId || (mode === "booking" ? checkedInPatient?.patientId || checkedInPatient?.id : "") || prev.patientId || "",
        doctorId: initialData?.doctorId || prev.doctorId || "",
        date: toLocalDate(initialData?.scheduledDate || initialData?.dateTime || initialData?.date) || prev.date,
        time: toLocalTime(initialData?.scheduledTime || initialData?.dateTime || initialData?.time) || prev.time,
        bookingSource: initialData?.source || prev.bookingSource,
        chiefComplaint: initialData?.chiefComplaint || prev.chiefComplaint,
        notes: initialData?.notes || prev.notes,
        repeatEnabled: initialData?.repeatEnabled ?? prev.repeatEnabled,
        repeatEvery: initialData?.repeatEvery || prev.repeatEvery,
        repeatUnit: initialData?.repeatUnit || prev.repeatUnit,
        repeatUntil: initialData?.repeatUntil || prev.repeatUntil,
      }));
      if (!initialData?.patientId && (initialMode || mode) === "booking" && checkedInPatient?.patientId) {
        setSearchPatient(
          checkedInPatient.patientName || checkedInPatient.name || checkedInPatient.patientCode || checkedInPatient.mrn || "Checked-in patient",
        );
      }
    }
  }, [isOpen, initialMode, checkedInPatient]);

  useEffect(() => {
    if (isOpen) {
      fetchPatients();
    }
  }, [isOpen, searchPatient]);

  useEffect(() => {
    if (isOpen) {
      fetchDoctors();
      fetchDepartments();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && (mode === "booking" || mode === "cancel")) {
      fetchAppointments();
    }
  }, [isOpen, mode]);

  useEffect(() => {
    if (!isOpen || mode !== "booking" || !formData.date) {
      setConfiguredSlots([]);
      return;
    }
    api.get("/appointments/slots", {
      params: { doctorId: formData.doctorId || undefined, date: formData.date },
    }).then((response) => {
      const rows = rowsFromResponse(response.data);
      setConfiguredSlots(rows);
    }).catch(() => setConfiguredSlots([]));
  }, [isOpen, mode, formData.date, formData.doctorId]);

  const fetchPatients = async () => {
    try {
      const res = await api.get("/tenant/patients", { params: { search: searchPatient } }).catch((error) => {
        const status = (error as any)?.response?.status;
        if (status === 404 || status === 405) return api.get("/patients", { params: { search: searchPatient } });
        throw error;
      });
      setPatients(rowsFromResponse(res.data));
    } catch (err) {
      const status = (err as any)?.response?.status;
      if (status === 401) {
        setPatients(
          fallbackPatients.map((patient) => ({
            id: patient.id,
            firstName: patient.name.split(" ")[0] || patient.name,
            lastName: patient.name.split(" ").slice(1).join(" "),
            patientCode: patient.regNo,
          })),
        );
        return;
      }
      console.error("Failed to fetch patients", err);
    }
  };

  const fetchDoctors = async () => {
    try {
      // Staff is the source of truth for providers. Keep the doctor-profile
      // endpoint as a compatibility fallback for facilities that have already
      // migrated provider records there.
      let res;
      try {
        res = await api.get("/staff", { params: { role: "DOCTOR" } });
      } catch (error: any) {
        const status = error?.response?.status;
        if (status === 401 || status === 403 || status === 404 || status === 405) {
          res = await api.get("/doctor-management/profiles", { params: { status: "ACTIVE" } });
        } else {
          throw error;
        }
      }
      const rows = rowsFromResponse(res.data).map((row: any) => {
        const staff = row?.staff && typeof row.staff === "object" ? row.staff : row;
        return { ...staff, id: staff.id || row.staffId, doctorProfileId: row.id };
      });
      setDoctors(rows);
    } catch (err: any) {
      setDoctors([]);
      if (err?.response?.status === 401) {
        onError?.("Your session has expired. Please sign in again before selecting a doctor.");
      } else {
        onError?.("Unable to load doctors. Check the backend connection and try again.");
      }
    }
  };

  const fetchDepartments = async () => {
    try {
      const [directoryResult, snapshotResult] = await Promise.all([
        api.get("/staff/departments").catch(() => ({ data: [] })),
        api.get("/facilities/current/setup-snapshot").catch(() => ({ data: {} })),
      ]);
      const directoryRows = rowsFromResponse(directoryResult.data).map((row: any) => ({
        id: row.id,
        name: row.name,
        type: row.type,
      }));
      const snapshot = snapshotResult.data || {};
      const settingsDepartments = snapshot?.settings?.departments?.initial;
      const fullSetupDepartments = snapshot?.fullSetupValues?.departmentsCatalogue;
      const configuredRows = Array.isArray(settingsDepartments)
        ? settingsDepartments.map((row: any) => typeof row === "string" ? { name: row } : row)
        : String(fullSetupDepartments || "")
          .split(/\r?\n/)
          .map((line) => line.split("|").map((part) => part.trim()))
          .filter((parts) => parts[1])
          .map((parts) => ({ id: parts[0], name: parts[1], type: parts[2] || "Other" }));
      const merged = [...directoryRows, ...configuredRows].filter((row, index, rows) => {
        const key = String(row.id || row.name || "").trim().toLowerCase();
        return key && rows.findIndex((candidate) => String(candidate.id || candidate.name || "").trim().toLowerCase() === key) === index;
      });
      setDepartments(merged);
    } catch {
      setDepartments([]);
    }
  };

  const fetchAppointments = async () => {
    try {
      const res = await api.get("/appointments");
      setAppointments(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to load appointments", err);
      setAppointments([]);
    }
  };

  const filteredPatients = useMemo(() => searchPatient
      ? patients.filter((patient) => {
        const name = `${patient.firstName || ""} ${patient.middleName || ""} ${patient.lastName || ""}`.trim() || patient.fullName || patient.name || "";
        const code = `${patient.patientCode || patient.mrn || ""}`.trim();
        const identifiers = `${patient.nationalId || ""} ${patient.idNumber || ""} ${patient.phone || ""} ${patient.phonePrimary || ""} ${patient.phoneSecondary || ""} ${patient.email || ""}`;
        const needle = searchPatient.trim().toLowerCase();
        return (
          name.toLowerCase().includes(needle) ||
          code.toLowerCase().includes(needle) ||
          identifiers.toLowerCase().includes(needle)
        );
      })
    : patients, [patients, searchPatient]);

  useEffect(() => {
    if (!searchPatient && !checkedInPatient?.patientId) {
      setFormData((prev) => ({ ...prev, patientId: "" }));
      return;
    }
    if (filteredPatients.length === 1) {
      setFormData((prev) => ({
        ...prev,
        patientId: filteredPatients[0]?.id || "",
      }));
    }
  }, [searchPatient, filteredPatients, checkedInPatient]);

  if (!isOpen) return null;

  const modeConfig = {
    booking: {
      title: "Appointment Booking",
      note: "Book a patient visit with department, doctor, date, time, source, and reminder settings.",
      icon: User,
      panelClass: "appointment-mode-booking",
    },
    slots: {
      title: "Appointment Slot Configuration",
      note: "Configure clinician availability, session duration, slot type, and booking capacity.",
      icon: Settings,
      panelClass: "appointment-mode-slots",
    },
    cancel: {
      title: "Appointment Cancellation",
      note: "Cancel a scheduled appointment, notify the patient, and optionally move into rebooking.",
      icon: Ban,
      panelClass: "appointment-mode-cancel",
    },
  }[mode];
  const HeaderIcon = modeConfig.icon;
  const selectedDoctorName =
    doctors.find((doctor) => doctor.id === formData.doctorId)
      ? `Dr. ${doctors.find((doctor) => doctor.id === formData.doctorId)?.firstName || ""} ${doctors.find((doctor) => doctor.id === formData.doctorId)?.lastName || ""}`.trim()
      : "Selected doctor";
  const slotDuration = Math.max(15, Number(formData.durationMinutes) || 30);
  const selectedDateAppointments = appointments.filter((appointment) => {
    const aptDate = appointment?.dateTime || appointment?.scheduledDate;
    const doctorMatches = !formData.doctorId || appointment?.doctorId === formData.doctorId;
    return doctorMatches && toLocalDate(aptDate) === formData.date;
  });
  const bookedTimes = new Set(
    selectedDateAppointments
      .filter((appointment) => !["CANCELLED", "NO_SHOW", "NOSHOW"].includes(String(appointment?.status || "").toUpperCase()))
      .map((appointment) => toLocalTime(appointment?.dateTime || appointment?.scheduledTime)),
  );
  const calendarSlots = Array.from({ length: 20 }, (_, index) => {
    const totalMinutes = 8 * 60 + index * slotDuration;
    const hour = Math.floor(totalMinutes / 60);
    const minute = totalMinutes % 60;
    const time = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
    const blocked = hour === 12;
    const booked = bookedTimes.has(time);
    return {
      time,
      status: blocked ? "blocked" : booked ? "booked" : "available",
    };
  }).filter((slot) => Number(slot.time.slice(0, 2)) < 18);

  const displayedCalendarSlots = configuredSlots.length > 0
    ? configuredSlots.map((slot) => {
        const time = toLocalTime(slot.startTime || slot.slotDate);
        return {
          time,
          status: slot.isAvailable === false || slot.appointmentId ? "booked" : "available",
        };
      }).filter((slot) => slot.time)
    : calendarSlots;

  const buildRecurrenceDates = () => {
    if (!formData.repeatEnabled || !formData.repeatUntil) return [formData.date];
    const dates = [formData.date];
    const cursor = new Date(`${formData.date}T00:00:00`);
    const end = new Date(`${formData.repeatUntil}T00:00:00`);
    const step = Math.max(1, Number(formData.repeatEvery) || 1);
    while (dates.length < 32) {
      if (formData.repeatUnit === "months") {
        cursor.setMonth(cursor.getMonth() + step);
      } else {
        cursor.setDate(cursor.getDate() + step * 7);
      }
      if (cursor.getTime() > end.getTime()) break;
      const day = cursor.getDay();
      if (day !== 0) {
        dates.push(cursor.toISOString().slice(0, 10));
      }
    }
    return dates;
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!formData.patientId || !formData.doctorId || !formData.department || !formData.date || !formData.time) {
        onError?.("Patient, provider, department, appointment date, and appointment time are required.");
        setLoading(false);
        return;
      }
      const composedDate = new Date(`${formData.date}T${formData.time}:00`);
      const scheduledDate = new Date(`${formData.date}T00:00:00`);
      const scheduledTime = new Date(`${formData.date}T${formData.time}:00`);
      const notes = [
        formData.notes,
        formData.insuranceScheme
          ? `Insurance: ${formData.insuranceScheme}`
          : "",
      ]
        .filter(Boolean)
        .join("\n");

      const metadata = [
        notes,
        `Reminder policy: ${formData.reminder24Sms ? "SMS 24h" : "SMS off"}; ${formData.reminder2WhatsApp ? "WhatsApp 2h" : "WhatsApp off"}`,
        formData.responseTracking ? "Patient response tracking: CONFIRM/CANCEL enabled" : "Patient response tracking disabled",
        formData.waitingListAllowed ? "Waiting list release: enabled" : "Waiting list release: disabled",
        formData.requiredResources ? `Required resources: ${formData.requiredResources}` : "",
        `No-show policy: ${formData.noShowPolicy}`,
        formData.appBooking ? "Booked via Medilink App: one-click arrival check-in enabled" : "",
        formData.repeatEnabled ? `Recurring series: every ${formData.repeatEvery} ${formData.repeatUnit} until ${formData.repeatUntil}` : "",
      ].filter(Boolean).join("\n");

      await onSubmit({
        patientId: formData.patientId,
        doctorId: formData.doctorId || undefined,
        appointmentType: formData.appointmentType,
        departmentId: formData.department || undefined,
        scheduledDate: scheduledDate.toISOString(),
        scheduledTime: scheduledTime.toISOString(),
        durationMinutes: Number(formData.durationMinutes) || 30,
        source: formData.appBooking ? "Medilink App" : formData.bookingSource,
        chiefComplaint: formData.chiefComplaint || undefined,
        notes: metadata || undefined,
        reminderSent: Boolean(formData.sendReminder || formData.reminder24Sms || formData.reminder2WhatsApp),
        dateTime: composedDate.toISOString(),
        status: formData.status,
        repeatEnabled: formData.repeatEnabled,
        repeatEvery: Number(formData.repeatEvery) || 1,
        repeatUnit: formData.repeatUnit,
        repeatUntil: formData.repeatUntil || undefined,
        reminder24Sms: formData.reminder24Sms,
        reminder2WhatsApp: formData.reminder2WhatsApp,
        responseTracking: formData.responseTracking,
        waitingListAllowed: formData.waitingListAllowed,
        requiredResources: formData.requiredResources,
        noShowPolicy: formData.noShowPolicy,
        appBookingExternalId: formData.appBooking ? `APP-${Date.now()}` : undefined,
        locationInstructions: formData.department || undefined,
        arrivalInstructions: "Please arrive 15 minutes early.",
        facilityId: facility?.id || "default",
      });
      onClose();
    } catch (error) {
      console.error("Failed to save appointment", error);
      onError?.((error as any)?.response?.data?.message || "Appointment could not be booked. Check the patient, provider, and selected slot.");
    } finally {
      setLoading(false);
    }
  };

  const handleSlotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const dayOfWeek = new Date(slotData.date).getDay();
      await api.post("/appointments/schedules", {
        doctorId: slotData.doctorId,
        date: slotData.date,
        departmentId: slotData.department || "APPOINTMENTS",
        dayOfWeek: isNaN(dayOfWeek) ? 1 : dayOfWeek,
        startTime: slotData.startTime || "08:00",
        endTime: slotData.endTime || "17:00",
        slotDuration: Number(slotData.slotDuration) || 20,
        slotType: slotData.slotType,
        maxPatients: Number(slotData.maxPatients) || 10,
      });
      await api.post("/module-actions", {
        facilityId: facility?.id,
        module: "appointments",
        action: "Appointment Slot Configuration Form",
        data: slotData,
        context: { title: "Appointments" },
      });
      onClose();
    } catch (err) {
      console.error("Failed to save slot configuration", err);
      onError?.((err as any)?.response?.data?.message || "Schedule configuration could not be saved.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!cancelData.appointmentId) {
        setLoading(false);
        return;
      }
      await api.patch(`/appointments/${cancelData.appointmentId}`, {
        status: "CANCELLED",
        cancelledReason: cancelData.reason,
        notes: cancelData.notes || undefined,
      });
      if (cancelData.reschedule) {
        setMode("booking");
      } else {
        onClose();
      }
    } catch (err) {
      console.error("Failed to cancel appointment", err);
      onError?.((err as any)?.response?.data?.message || "Appointment cancellation failed.");
    } finally {
      setLoading(false);
    }
  };

  const modeColor = mode === "cancel" ? "#dc2626" : mode === "slots" ? "#7c3aed" : "#2563eb";

  return (
    <div className="module-form-overlay appointment-form-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div
        className={`module-form-panel has-rail appointment-form-panel ${modeConfig.panelClass}`}
        style={{
          "--module-form-accent": modeColor,
          "--module-form-accent-dark": `${modeColor}cc`,
          "--module-form-accent-soft": `${modeColor}22`,
        } as any}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left Rail / Sidebar: Black to mode color gradient */}
        <aside
          className="module-form-rail"
          style={{
            background: `linear-gradient(180deg, #070a0f 0%, #0d1522 35%, ${modeColor}44 70%, ${modeColor} 100%)`,
          }}
        >
          <div className="module-form-rail-mark">
            <div className="module-form-rail-icon">
              <HeaderIcon className="w-5 h-5" />
            </div>
            <div>
              <b>Medilink HMIS</b>
              <small>Appointments & Schedules</small>
            </div>
          </div>

          <div className="module-form-rail-rule" />

          <div className="module-form-rail-steps">
            <button
              type="button"
              onClick={() => setMode("booking")}
              className={`module-form-rail-step ${mode === "booking" ? "active" : ""}`}
            >
              <span className="module-form-rail-step-num">1</span>
              <div>
                <b>Booking</b>
                <small>Visit workflow</small>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setMode("slots")}
              className={`module-form-rail-step ${mode === "slots" ? "active" : ""}`}
            >
              <span className="module-form-rail-step-num">2</span>
              <div>
                <b>Slots</b>
                <small>Schedule setup</small>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setMode("cancel")}
              className={`module-form-rail-step ${mode === "cancel" ? "active" : ""}`}
            >
              <span className="module-form-rail-step-num">3</span>
              <div>
                <b>Cancel</b>
                <small>Cancellation</small>
              </div>
            </button>
          </div>

          <div className="module-form-rail-banner">
            <small>Active Mode</small>
            <div className="module-form-rail-bname">{initialData ? "Edit Appointment" : modeConfig.title}</div>
            <div className="module-form-rail-bmeta">
              {checkedInPatient ? (checkedInPatient.name || "Patient Selected") : "Appointments Terminal"}
            </div>
            <span className="module-form-rail-chip ok">
              {mode.toUpperCase()}
            </span>
          </div>
        </aside>

        {/* Right Main Area */}
        <div className="module-form-main">
          <header className="module-form-head">
            <div>
              <small className="module-form-kicker">Appointments & Schedules · {mode.toUpperCase()}</small>
              <h2 className="module-form-title">{initialData ? "Edit Appointment" : modeConfig.title}</h2>
              <p className="module-form-desc">{modeConfig.note}</p>
            </div>
            <button onClick={onClose} className="module-form-x-btn" aria-label="Close">
              ✕
            </button>
          </header>

          <div className="module-form-body-scroll">
            {mode === "booking" ? (
          <form onSubmit={handleBookingSubmit} className="appointment-form-body">
            <div className="space-y-1.5">
              <label className="form-label flex items-center gap-2">
                <User className="w-4 h-4" /> Patient Search *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="Search by MRN, name, or ID number..."
                  className={`${INPUT_CLS} mb-2`}
                  value={searchPatient}
                  onChange={(e) => {
                    setSearchPatient(e.target.value);
                    setShowPatientResults(true);
                  }}
                  onFocus={() => setShowPatientResults(true)}
                  onBlur={() => {
                    window.setTimeout(() => setShowPatientResults(false), 150);
                  }}
                />
                {showPatientResults && filteredPatients.length > 0 ? (
                  <ul className="absolute z-10 mt-2 w-full max-h-48 overflow-auto rounded-lg border border-border bg-white shadow-lg">
                    {filteredPatients.map((patient) => (
                      <li key={patient.id}>
                        <button
                          type="button"
                          className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100"
                          onMouseDown={() => {
                            setFormData({
                              ...formData,
                              patientId: patient.id,
                            });
                            setSearchPatient(
                              `${patient.firstName || ""} ${patient.lastName || ""}`.trim() ||
                                patient.fullName || patient.name || patient.patientCode || "",
                            );
                            setShowPatientResults(false);
                          }}
                        >
                          {patient.firstName} {patient.lastName}
                          {patient.patientCode ? ` (${patient.patientCode})` : ""}
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="form-label">Appointment Type *</label>
                <select
                  required
                  className={INPUT_CLS}
                  value={formData.appointmentType}
                  onChange={(e) =>
                    setFormData({ ...formData, appointmentType: e.target.value })
                  }
                >
                  {[
                    "New",
                    "Follow-up",
                    "General",
                    "Review",
                    "Second opinion",
                    "Routine check-up",
                    "Specialist",
                    "Cardiology",
                    "Oncology",
                    "Orthopaedics",
                    "Obstetrics",
                    "Paediatrics",
                    "Dental",
                    "Physiotherapy",
                    "Procedure",
                    "Surgery",
                    "Endoscopy",
                    "Dialysis",
                    "Imaging",
                    "Laboratory",
                    "Nutrition consultation",
                    "Mental health",
                    "Vaccination",
                    "Pre-operative assessment",
                    "Post-operative review",
                    "Telemedicine",
                    "Other",
                  ].map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="form-label">Department *</label>
                <select
                  required
                  className={INPUT_CLS}
                  value={formData.department}
                  onChange={(e) =>
                    setFormData({ ...formData, department: e.target.value })
                  }
                >
                  <option value="">Select Department</option>
                  {departments.map((dept) => (
                    <option key={dept.id || dept.name} value={dept.id || dept.name}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="form-label flex items-center gap-2">
                <UserPlus className="w-4 h-4" /> Provider / Doctor *
              </label>
              <select
                required
                className={INPUT_CLS}
                value={formData.doctorId}
                onChange={(e) =>
                  setFormData({ ...formData, doctorId: e.target.value })
                }
              >
                <option value="">-- Choose Doctor --</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    Dr. {d.firstName} {d.lastName} ({d.specialization || "General"})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="form-label flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4" /> Appointment Date
                </label>
                <input
                  required
                  type="date"
                  className={INPUT_CLS}
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <label className="form-label flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Appointment Time
                </label>
                <input
                  required
                  type="time"
                  className={INPUT_CLS}
                  value={formData.time}
                  onChange={(e) =>
                    setFormData({ ...formData, time: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="appointment-slot-calendar">
              <div className="appointment-slot-calendar-head">
                <div>
                  <strong>Slot-Based Calendar</strong>
                  <span>{formData.date ? `${selectedDoctorName} · ${formData.date}` : "Choose date and doctor to reserve a slot"}</span>
                </div>
                <div className="appointment-slot-legend">
                  <span><i className="slot-available" /> Available</span>
                  <span><i className="slot-booked" /> Booked</span>
                  <span><i className="slot-blocked" /> Blocked</span>
                </div>
              </div>
              <div className="appointment-slot-grid">
                {displayedCalendarSlots.map((slot) => (
                  <button
                    key={slot.time}
                    type="button"
                    className={`appointment-slot-cell is-${slot.status} ${formData.time === slot.time ? "is-selected" : ""}`}
                    disabled={slot.status !== "available"}
                    onClick={() => setFormData({ ...formData, time: slot.time })}
                    title={slot.status === "available" ? "Reserve this slot" : slot.status === "booked" ? "Slot already booked" : "Blocked time"}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    {slot.time}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="form-label">Booking Source *</label>
                <select
                  required
                  className={INPUT_CLS}
                  value={formData.bookingSource}
                  onChange={(e) =>
                    setFormData({ ...formData, bookingSource: e.target.value })
                  }
                >
                  {["Walk-in", "Phone", "Portal", "Referral"].map((source) => (
                    <option key={source} value={source}>
                      {source}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="form-label">Insurance to Use</label>
                <input
                  className={INPUT_CLS}
                  placeholder="Active insurance scheme"
                  value={formData.insuranceScheme}
                  onChange={(e) =>
                    setFormData({ ...formData, insuranceScheme: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="form-label">Chief Complaint</label>
              <input
                className={INPUT_CLS}
                placeholder="Patient's main reason for visit"
                value={formData.chiefComplaint}
                onChange={(e) =>
                  setFormData({ ...formData, chiefComplaint: e.target.value })
                }
              />
            </div>

            <div className="space-y-1.5">
              <label className="form-label">Notes</label>
              <textarea
                className={INPUT_CLS}
                placeholder="Special scheduling instructions or requests"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="form-label">Slot Duration (minutes) *</label>
                <input
                  type="number"
                  required
                  min={5}
                  max={240}
                  className={INPUT_CLS}
                  value={formData.durationMinutes}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      durationMinutes: Number(e.target.value),
                    })
                  }
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-700 pt-7">
                <input
                  type="checkbox"
                  checked={formData.sendReminder}
                  onChange={(e) =>
                    setFormData({ ...formData, sendReminder: e.target.checked })
                  }
                />
                Send Reminder
              </label>
            </div>

            <div className="appointment-feature-panel">
              <div className="appointment-feature-title">
                <Settings className="w-4 h-4" /> Advanced appointment controls
              </div>
              <div className="grid grid-cols-2 gap-4">
                <label className="appointment-check-row">
                  <input
                    type="checkbox"
                    checked={formData.repeatEnabled}
                    onChange={(e) => setFormData({ ...formData, repeatEnabled: e.target.checked })}
                  />
                  Recurring appointment series
                </label>
                <label className="appointment-check-row">
                  <input
                    type="checkbox"
                    checked={formData.appBooking}
                    onChange={(e) => setFormData({ ...formData, appBooking: e.target.checked })}
                  />
                  Booked via Medilink App
                </label>
              </div>
              {formData.repeatEnabled ? (
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="form-label">Repeat Every</label>
                    <input
                      type="number"
                      min={1}
                      className={INPUT_CLS}
                      value={formData.repeatEvery}
                      onChange={(e) => setFormData({ ...formData, repeatEvery: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="form-label">Repeat Unit</label>
                    <select
                      className={INPUT_CLS}
                      value={formData.repeatUnit}
                      onChange={(e) => setFormData({ ...formData, repeatUnit: e.target.value })}
                    >
                      <option value="weeks">Weeks</option>
                      <option value="months">Months</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Repeat Until</label>
                    <input
                      type="date"
                      className={INPUT_CLS}
                      value={formData.repeatUntil}
                      onChange={(e) => setFormData({ ...formData, repeatUntil: e.target.value })}
                    />
                  </div>
                </div>
              ) : null}
              <div className="grid grid-cols-2 gap-4">
                <label className="appointment-check-row">
                  <input
                    type="checkbox"
                    checked={formData.reminder24Sms}
                    onChange={(e) => setFormData({ ...formData, reminder24Sms: e.target.checked })}
                  />
                  SMS reminder 24 hours before
                </label>
                <label className="appointment-check-row">
                  <input
                    type="checkbox"
                    checked={formData.reminder2WhatsApp}
                    onChange={(e) => setFormData({ ...formData, reminder2WhatsApp: e.target.checked })}
                  />
                  WhatsApp reminder 2 hours before
                </label>
                <label className="appointment-check-row">
                  <input
                    type="checkbox"
                    checked={formData.responseTracking}
                    onChange={(e) => setFormData({ ...formData, responseTracking: e.target.checked })}
                  />
                  Track CONFIRM / CANCEL replies
                </label>
                <label className="appointment-check-row">
                  <input
                    type="checkbox"
                    checked={formData.waitingListAllowed}
                    onChange={(e) => setFormData({ ...formData, waitingListAllowed: e.target.checked })}
                  />
                  Release cancelled slots to waiting list
                </label>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Required Resources</label>
                  <input
                    className={INPUT_CLS}
                    placeholder="Theatre, anaesthetist, ultrasound, equipment..."
                    value={formData.requiredResources}
                    onChange={(e) => setFormData({ ...formData, requiredResources: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label">No-Show Policy</label>
                  <select
                    className={INPUT_CLS}
                    value={formData.noShowPolicy}
                    onChange={(e) => setFormData({ ...formData, noShowPolicy: e.target.value })}
                  >
                    <option>Track only</option>
                    <option>Require deposit after 3 no-shows</option>
                    <option>Supervisor approval after repeat no-show</option>
                  </select>
                </div>
              </div>
            </div>

            {initialData && (
              <div className="space-y-1.5">
                <label className="form-label">Status</label>
                <select
                  className={INPUT_CLS}
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value })
                  }
                >
                  <option value="SCHEDULED">Scheduled</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                  <option value="NOSHOW">No Show</option>
                </select>
              </div>
            )}

            <div className="module-form-footer">
              <button type="button" onClick={onClose} className="form-btn form-btn-cancel">
                Cancel
              </button>
              <button
                disabled={loading}
                type="submit"
                className="form-btn form-btn-primary disabled:opacity-70"
              >
                {loading
                  ? "Saving..."
                  : initialData
                    ? "Update Appointment"
                    : "Schedule"}
              </button>
            </div>
          </form>
        ) : mode === "slots" ? (
          <form onSubmit={handleSlotSubmit} className="appointment-form-body">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">Doctor *</label>
                <select
                  required
                  className={INPUT_CLS}
                  value={slotData.doctorId}
                  onChange={(e) =>
                    setSlotData({ ...slotData, doctorId: e.target.value })
                  }
                >
                  <option value="">Select Doctor</option>
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      Dr. {d.firstName} {d.lastName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">Department *</label>
                <select
                  required
                  className={INPUT_CLS}
                  value={slotData.department}
                  onChange={(e) =>
                    setSlotData({ ...slotData, department: e.target.value })
                  }
                >
                  <option value="">Select Department</option>
                  {departments.map((dept) => (
                    <option key={dept.id || dept.name} value={dept.id || dept.name}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="form-label">Date *</label>
                <input
                  required
                  type="date"
                  className={INPUT_CLS}
                  value={slotData.date}
                  onChange={(e) =>
                    setSlotData({ ...slotData, date: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="form-label">Start Time *</label>
                <input
                  required
                  type="time"
                  className={INPUT_CLS}
                  value={slotData.startTime}
                  onChange={(e) =>
                    setSlotData({ ...slotData, startTime: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="form-label">End Time *</label>
                <input
                  required
                  type="time"
                  className={INPUT_CLS}
                  value={slotData.endTime}
                  onChange={(e) =>
                    setSlotData({ ...slotData, endTime: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="form-label">Slot Duration (minutes) *</label>
                <input
                  required
                  type="number"
                  min={5}
                  max={240}
                  className={INPUT_CLS}
                  value={slotData.slotDuration}
                  onChange={(e) =>
                    setSlotData({
                      ...slotData,
                      slotDuration: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div>
                <label className="form-label">Slot Type *</label>
                <select
                  required
                  className={INPUT_CLS}
                  value={slotData.slotType}
                  onChange={(e) =>
                    setSlotData({ ...slotData, slotType: e.target.value })
                  }
                >
                  <option value="OPD">OPD</option>
                  <option value="Telemedicine">Telemedicine</option>
                  <option value="Procedure">Procedure</option>
                </select>
              </div>
              <div>
                <label className="form-label">Maximum Patients *</label>
                <input
                  required
                  type="number"
                  min={1}
                  max={1000}
                  className={INPUT_CLS}
                  value={slotData.maxPatients}
                  onChange={(e) =>
                    setSlotData({
                      ...slotData,
                      maxPatients: Number(e.target.value),
                    })
                  }
                />
              </div>
            </div>

            <div className="module-form-footer">
              <button type="button" onClick={onClose} className="form-btn form-btn-cancel">
                Cancel
              </button>
              <button
                disabled={loading}
                type="submit"
                className="form-btn form-btn-primary disabled:opacity-70"
              >
                {loading ? "Saving..." : "Save Slots"}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleCancelSubmit} className="appointment-form-body">
            <div>
              <label className="form-label">Select Appointment *</label>
              <select
                required
                className={INPUT_CLS}
                value={cancelData.appointmentId}
                onChange={(e) =>
                  setCancelData({ ...cancelData, appointmentId: e.target.value })
                }
              >
                <option value="">Choose appointment</option>
                {appointments.map((apt) => (
                  <option key={apt.id} value={apt.id}>
                    {apt.patient?.firstName} {apt.patient?.lastName} -{" "}
                    {new Date(apt.dateTime).toLocaleString()}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Cancellation Reason *</label>
              <select
                required
                className={INPUT_CLS}
                value={cancelData.reason}
                onChange={(e) =>
                  setCancelData({ ...cancelData, reason: e.target.value })
                }
              >
                <option value="">Select reason</option>
                <option value="Patient request">Patient request</option>
                <option value="Doctor unavailable">Doctor unavailable</option>
                <option value="Emergency">Emergency</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="form-label">Additional Notes</label>
              <textarea
                className={INPUT_CLS}
                placeholder="Details about the cancellation"
                value={cancelData.notes}
                onChange={(e) =>
                  setCancelData({ ...cancelData, notes: e.target.value })
                }
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={cancelData.notifyPatient}
                  onChange={(e) =>
                    setCancelData({
                      ...cancelData,
                      notifyPatient: e.target.checked,
                    })
                  }
                />
                Notify patient
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={cancelData.reschedule}
                  onChange={(e) =>
                    setCancelData({
                      ...cancelData,
                      reschedule: e.target.checked,
                    })
                  }
                />
                Reschedule immediately
              </label>
            </div>

            <div className="module-form-footer">
              <button type="button" onClick={onClose} className="form-btn form-btn-cancel">
                Cancel
              </button>
              <button
                disabled={loading}
                type="submit"
                className="form-btn form-btn-primary disabled:opacity-70"
              >
                {loading ? "Saving..." : "Cancel Appointment"}
              </button>
            </div>
          </form>
        )}
          </div>
        </div>
      </div>
    </div>
  );
}
