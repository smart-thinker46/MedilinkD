
import { useMemo, useRef, useState, useEffect } from "react";
import { ModuleIcon } from "./ModuleIcon";
import { PatientDrawer } from "../patients/PatientDrawer";
import { RecordDrawer } from "./RecordDrawer";
import type { ReactNode } from "react";
const usePathname = () => (typeof window !== "undefined" ? window.location.pathname : "/");
import { api } from "../../lib/api";
import { setPatientQueueStatus } from "../../lib/patientQueueState";
import { getHmisAutomationActions } from "../../modules/hmisAutomationActions";
import { useLiveRefresh } from "../../lib/liveRefresh";
import { MODULE_CATALOG } from "../../lib/moduleCatalog";
import { useAppStore } from "../../store/appStore";
import {
  MODULE_ACTION_FORMS,
  type ModuleActionField,
  type ModuleActionFormDefinition,
} from "../../lib/moduleActionForms";

type Stat = {
  label: string;
  value: string | number;
  color?: string;
  note?: string;
};

type Column = {
  label: string;
  key: string;
  className?: string;
};

type RowFilter = {
  label: string;
  key: string;
  options: string[];
};

type TableCellValue = ReactNode;
type TableRow = Record<string, TableCellValue>;

type SimpleModulePlaceholderProps = {
  className?: string;
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  stats?: Stat[];
  filters?: ReactNode;
  columns: Column[];
  rows: TableRow[];
  searchPlaceholder?: string;
  searchKeys?: string[];
  showSearch?: boolean;
  rowFilters?: RowFilter[];
  actions?: ReactNode;
  captureActions?: boolean;
  afterSearchContent?: ReactNode;
  useProvidedStats?: boolean;
  useProvidedRows?: boolean;
  useProvidedActions?: boolean;
  onRowClick?: (row: TableRow) => void;
};

type FormField = ModuleActionField;

type ActiveFormState = {
  title: string;
  description?: string;
  fields: FormField[];
  accentColor?: string;
};

type CheckedInPatientState = {
  hasCheckedInPatient?: boolean;
  patientId?: string;
  id?: string;
  patientName?: string;
  name?: string;
  mrn?: string;
  patientCode?: string;
  nationalId?: string;
  idNumber?: string;
  phone?: string;
  queueModule?: string;
  isQueued?: boolean;
  checkInDate?: string;
};

const currentDateInput = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
};

const iconTokenPattern = /\b[a-z_]+(?:_[a-z_]+)+\b/g;
const PATIENT_REGISTRATION_MODULE_KEYS = new Set(["patients"]);

const CHECKED_IN_STATES_KEY = "hmis_patient_module_states";

const readCheckedInPatientState = (moduleKey = ""): CheckedInPatientState => {
  if (typeof window === "undefined") return { hasCheckedInPatient: false };
  try {
    const states = JSON.parse(window.localStorage.getItem(CHECKED_IN_STATES_KEY) || "{}");
    if (moduleKey && states?.[moduleKey]) return states[moduleKey];
    const legacy = JSON.parse(window.localStorage.getItem("hmis_patient_module_state") || "null");
    return legacy?.queueModule === moduleKey ? legacy : { hasCheckedInPatient: false };
  } catch {
    return { hasCheckedInPatient: false };
  }
};

const normalizeCheckedInPatient = (patient: any): CheckedInPatientState => {
  // Persist only scalar patient fields. Queue rows can contain React elements and
  // provider references, which must never be passed to JSON.stringify/localStorage.
  const id = String(patient?.id || patient?.patientId || "").trim();
  const patientId = String(patient?.patientId || patient?.id || "").trim();
  const patientName = String(
    patient?.patientName || patient?.name || [patient?.firstName, patient?.middleName, patient?.lastName].filter(Boolean).join(" ") || "",
  ).trim();
  const name = String(patient?.name || patientName || "").trim();
  const mrn = String(patient?.mrn || patient?.patientCode || patient?.regNo || "").trim();
  const patientCode = String(patient?.patientCode || patient?.mrn || patient?.regNo || "").trim();
  const nationalId = String(patient?.nationalId || patient?.idNumber || patient?.national_id || "").trim();
  const idNumber = String(patient?.idNumber || patient?.nationalId || patient?.national_id || "").trim();
  const phone = String(patient?.phone || patient?.phoneNumber || patient?.mobile || "").trim();
  return {
    hasCheckedInPatient: Boolean(patient?.hasCheckedInPatient || id || patientId),
    id,
    patientId,
    patientName,
    name,
    mrn,
    patientCode,
    nationalId,
    idNumber,
    phone,
    queueModule: String(patient?.queueModule || "").trim(),
    isQueued: Boolean(patient?.isQueued),
    checkInDate: String(patient?.checkInDate || "").trim(),
  };
};

const normalizeQueueDepartmentId = (value: string) =>
  value
    .toUpperCase()
    .replace(/&/g, " AND ")
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 48);

const moduleQueueDepartmentOverride: Record<string, string> = {
  appointments: "APPOINTMENTS",
  outpatient: "OPD",
  "outpatient / opd": "OPD",
  emergency: "EMERGENCY",
  laboratory: "LABORATORY",
  radiology: "RADIOLOGY",
  pharmacy: "PHARMACY",
  billing: "BILLING",
  inpatient: "INPATIENT",
  maternity: "MATERNITY",
  icu: "ICU",
  nursing: "NURSING",
  "nursing admin": "NURSING",
  dental: "DENTAL",
  physiotherapy: "PHYSIOTHERAPY",
  "physiotherapy & rehabilitation": "PHYSIOTHERAPY",
  "nutrition & dietetics": "NUTRITION",
  "operating theatre": "THEATRE",
};

const moduleQueueConfig: Record<string, { departmentId: string }> = MODULE_CATALOG
  .filter((module) => module.id !== 1)
  .reduce<Record<string, { departmentId: string }>>((acc, module) => {
    const moduleKey = module.path.replace(/^\//, "").replace(/\//g, "-");
    const nameKey = module.name.toLowerCase();
    acc[moduleKey] = {
      departmentId: moduleQueueDepartmentOverride[nameKey] || normalizeQueueDepartmentId(module.name),
    };
    return acc;
  }, {});

export function SimpleModulePlaceholder({
  className = "",
  title,
  subtitle,
  icon,
  stats = [],
  filters,
  columns,
  rows,
  searchPlaceholder = "Search...",
  searchKeys = [],
  showSearch = true,
  rowFilters = [],
  actions,
  captureActions = true,
  afterSearchContent,
  useProvidedStats = false,
  useProvidedRows = false,
  useProvidedActions = false,
  onRowClick,
}: SimpleModulePlaceholderProps) {
  const pathname = usePathname();
  const { facility } = useAppStore();
  const [search, setSearch] = useState("");
  const [rowFilterValues, setRowFilterValues] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<string | null>(null);
  const [activeForm, setActiveForm] = useState<ActiveFormState | null>(null);
  const [savedRows, setSavedRows] = useState<TableRow[]>([]);
  const [domainRows, setDomainRows] = useState<TableRow[]>([]);
  const [domainRowsLoaded, setDomainRowsLoaded] = useState(false);
  const [domainSummary, setDomainSummary] = useState<any>(null);
  const [formValues, setFormValues] = useState<
    Record<string, string | boolean | string[]>
  >({});
  const [waitingListOpen, setWaitingListOpen] = useState(false);
  const [waitingListLoading, setWaitingListLoading] = useState(false);
  const [waitingListRows, setWaitingListRows] = useState<any[]>([]);
  const [completedQueueRows, setCompletedQueueRows] = useState<any[]>([]);
  const [waitingListSearch, setWaitingListSearch] = useState("");
  const [waitingCheckInId, setWaitingCheckInId] = useState("");
  const [waitingCheckInDate, setWaitingCheckInDate] = useState(currentDateInput);
  const [selectedQueuedPatient, setSelectedQueuedPatient] = useState<any>(null);
  const [selectedTablePatient, setSelectedTablePatient] = useState<any>(null);
  const [selectedTableRecord, setSelectedTableRecord] = useState<any>(null);
  const [checkedInQueuedPatientId, setCheckedInQueuedPatientId] = useState("");
  const [checkedInPatientState, setCheckedInPatientState] = useState<CheckedInPatientState>(() =>
    normalizeCheckedInPatient({}),
  );
  const [submitting, setSubmitting] = useState(false);
  const [automationOutput, setAutomationOutput] = useState<any>(null);
  const [activeStat, setActiveStat] = useState("");
  const toastTimer = useRef<number | null>(null);
  useEffect(() => {
    if (toastTimer.current) {
      window.clearTimeout(toastTimer.current);
      toastTimer.current = null;
    }
    if (!toast) return;
    toastTimer.current = window.setTimeout(() => {
      setToast(null);
      toastTimer.current = null;
    }, 3000);
    return () => {
      if (toastTimer.current) {
        window.clearTimeout(toastTimer.current);
        toastTimer.current = null;
      }
    };
  }, [toast]);
  const moduleKey = useMemo(
    () => {
      const parts = pathname?.split("/").filter(Boolean) || [];
      if (parts[0] === "pharmacy" && parts[1] === "pos") return "pharmacy-pos";
      return parts[0] || "";
    },
    [pathname],
  );
  const configuredForms = MODULE_ACTION_FORMS[moduleKey]?.forms ?? [];
  const automationActions = useMemo(
    () => getHmisAutomationActions(moduleKey),
    [moduleKey],
  );
  const waitingConfig = moduleQueueConfig[moduleKey];
  const requiresCheckedInPatient = Boolean(
    moduleKey &&
      !PATIENT_REGISTRATION_MODULE_KEYS.has(moduleKey) &&
      moduleKey !== "blood-bank" &&
      configuredForms.length > 0,
  );
  const activeCheckedInPatient = normalizeCheckedInPatient(
    checkedInQueuedPatientId && selectedQueuedPatient?.id === checkedInQueuedPatientId
      ? selectedQueuedPatient
      : checkedInPatientState,
  );

  useEffect(() => {
    const syncCheckedInPatient = () => setCheckedInPatientState(normalizeCheckedInPatient(readCheckedInPatientState(moduleKey)));
    const handlePatientState = (event: Event) => {
      const detail = (event as CustomEvent<{ moduleKey?: string; state?: any }>).detail;
      if (detail?.moduleKey && detail.moduleKey !== moduleKey) return;
      const nextState = normalizeCheckedInPatient(detail?.state || readCheckedInPatientState(moduleKey));
      setCheckedInPatientState(nextState);
      if (!nextState.hasCheckedInPatient || !nextState.patientId) {
        setActiveForm(null);
        setFormValues({});
      }
    };
    window.addEventListener("hmis:patient-module-state", handlePatientState);
    window.addEventListener("storage", syncCheckedInPatient);
    syncCheckedInPatient();
    return () => {
      window.removeEventListener("hmis:patient-module-state", handlePatientState);
      window.removeEventListener("storage", syncCheckedInPatient);
    };
  }, []);

  const prefillQueuePatientFields = (
    patient: any,
    fields: FormField[],
  ): Record<string, string> => {
    if (!patient) return {};
    const fullName =
      `${String(patient?.firstName || "").trim()} ${String(patient?.lastName || "").trim()}`.trim() ||
      String(patient?.patientName || patient?.name || "").replace(/^[^-]+-\s*/, "").trim();
    const patientCode = String(patient?.patientCode || patient?.mrn || patient?.patient_code || patient?.regNo || "").trim();
    const phone = String(patient?.phone || "").trim();
    const patientId = String(patient?.id || patient?.patientId || "").trim();
    const idNumber = String(patient?.idNumber || patient?.nationalId || patient?.national_id || "").trim();
    return fields.reduce<Record<string, string>>((acc, field) => {
      const key = field.name.toLowerCase().replace(/[^a-z0-9]/g, "");
      const label = String(field.label || "").toLowerCase();
      if ((key.includes("patientid") || key === "id") && patientId) acc[field.name] = patientId;
      if ((key.includes("patientname") || (key === "name" && label.includes("patient"))) && fullName) acc[field.name] = fullName;
      if ((key.includes("mrn") || key.includes("patientcode") || key.includes("patientnumber")) && patientCode) acc[field.name] = patientCode;
      if ((key.includes("nationalid") || key.includes("idnumber") || key.includes("passport")) && idNumber) acc[field.name] = idNumber;
      if ((key.includes("phone") || key.includes("mobile")) && phone && label.includes("patient")) acc[field.name] = phone;
      return acc;
    }, {});
  };

  const normalizeQueuedPatient = (row: any) => ({
    ...row,
    id: String(row?.patientId || row?.id || "").trim(),
    patientId: String(row?.patientId || row?.id || "").trim(),
    patientName: String(row?.patientName || row?.name || "Queued patient").trim(),
    firstName: String(row?.firstName || "").trim(),
    lastName: String(row?.lastName || "").trim(),
    patientCode: String(row?.patientCode || row?.mrn || "").trim(),
    mrn: String(row?.mrn || row?.patientCode || "").trim(),
    phone: String(row?.patientPhone || row?.phone || "").trim(),
  });

  const checkInQueuedPatient = async (row: any, checkInDate = currentDateInput()) => {
    const patientId = String(row?.patientId || row?.id || "").trim();
    if (!patientId) return;
    let patient = normalizeQueuedPatient(row);
    try {
      const response = await api.get(`/tenant/patients/${patientId}`).catch((error) => {
        const status = error?.response?.status;
        if (status === 404 || status === 405) {
          return api.get(`/patients/${patientId}`);
        }
        throw error;
      });
      patient = normalizeQueuedPatient({
        ...row,
        ...(response.data?.data || response.data?.patient || response.data || {}),
        patientId,
      });
    } catch {
      patient = normalizeQueuedPatient(row);
    }
    setWaitingCheckInId(String(row?.tokenId || row?.tokenNumber || patientId));
    try {
      await api.patch("/opd/queue/token/status", {
        tokenId: row?.tokenId || row?.id,
        tokenNumber: row?.tokenNumber,
        patientId,
        visitId: row?.visitId,
        status: "IN_SERVICE",
        checkInDate,
        reason: `Checked in to ${title}`,
      });
      await loadWaitingList();
      setCompletedQueueRows((previous) => [
        { ...row, status: "COMPLETED" },
        ...previous.filter((item) => String(item?.tokenId || item?.id) !== String(row?.tokenId || row?.id)),
      ]);
    } catch (error: any) {
      setToast(error?.response?.data?.message || "This patient could not be checked in. Please try again.");
      setWaitingCheckInId("");
      return;
    }
    try {
      await api.post("/module-actions", {
        facilityId: facility?.id,
        module: moduleKey || title,
        action: "Queued Patient Check-In",
        data: {
          patientId,
          patientName: patient.patientName,
          patient_mrn: patient.patientCode || patient.mrn,
          mrn: patient.patientCode || patient.mrn,
          queueToken: row?.tokenNumber || "",
          queueStatus: "IN_SERVICE",
          checkInDate,
          checkedInAt: new Date().toISOString(),
        },
        context: { title, source: "module.waiting-list" },
      });
    } catch {
      // The queue token is the source of truth; action logging should not block care.
    }
    setSelectedQueuedPatient(patient);
    setCheckedInQueuedPatientId(patientId);
    const checkedInState = normalizeCheckedInPatient({
      ...patient,
      hasCheckedInPatient: true,
      patientId,
      id: patientId,
      queueModule: moduleKey || title,
      isQueued: false,
      checkInDate,
    });
    setPatientQueueStatus({
      patientId,
      queueModule: moduleKey || title,
      departmentId: waitingConfig?.departmentId,
      tokenNumber: row?.tokenNumber || "",
      checkedIn: true,
      checkedInAt: new Date().toISOString(),
    });
    const states = JSON.parse(window.localStorage.getItem(CHECKED_IN_STATES_KEY) || "{}");
    states[moduleKey || title] = checkedInState;
    window.localStorage.setItem(CHECKED_IN_STATES_KEY, JSON.stringify(states));
    window.dispatchEvent(new CustomEvent("hmis:patient-module-state", { detail: { moduleKey: moduleKey || title, state: checkedInState } }));
    setWaitingListOpen(false);
    setWaitingCheckInId("");
    setSelectedTablePatient(null);
    setToast(`${patient.patientName || "Patient"} checked in successfully for ${checkInDate}.`);
  };

  const checkOutQueuedPatient = async (row: any) => {
    const patientId = String(row?.patientId || row?.id || "").trim();
    const tokenId = String(row?.tokenId || row?.id || "").trim();
    if (!patientId || waitingCheckInId) return;
    setWaitingCheckInId(tokenId || patientId);
    try {
      await api.patch("/opd/queue/token/status", {
        tokenId: row?.tokenId,
        tokenNumber: row?.tokenNumber,
        patientId,
        visitId: row?.visitId,
        status: "COMPLETED",
        reason: `Checked out from ${title}`,
      });
      await loadWaitingList();
      const states = JSON.parse(window.localStorage.getItem(CHECKED_IN_STATES_KEY) || "{}");
      delete states[moduleKey || title];
      window.localStorage.setItem(CHECKED_IN_STATES_KEY, JSON.stringify(states));
      const legacyState = JSON.parse(window.localStorage.getItem("hmis_patient_module_state") || "null");
      if (!legacyState || legacyState.queueModule === moduleKey || legacyState.queueModule === title) {
        window.localStorage.removeItem("hmis_patient_module_state");
      }
      setCheckedInQueuedPatientId("");
      setSelectedQueuedPatient(null);
      setCheckedInPatientState(normalizeCheckedInPatient({}));
      window.dispatchEvent(new CustomEvent("hmis:patient-module-state", { detail: { moduleKey: moduleKey || title, state: {} } }));
      setToast(`${row?.patientName || "Patient"} checked out successfully.`);
    } catch (error: any) {
      setToast(error?.response?.data?.message || "This patient could not be checked out.");
    } finally {
      setWaitingCheckInId("");
    }
  };

  const visibleWaitingRows = useMemo(() => {
    const needle = waitingListSearch.trim().toLowerCase();
    if (!needle) return waitingListRows;
    return waitingListRows.filter((row) => [row?.patientName, row?.patientCode, row?.mrn, row?.tokenNumber, row?.priority, row?.source]
      .some((value) => String(value || "").toLowerCase().includes(needle)));
  }, [waitingListRows, waitingListSearch]);

  const openTablePatient = async (row: any) => {
    const source = row?.original && typeof row.original === "object" ? row.original : row;
    const patientId = String(source?.patientId || source?.patient?.id || row?.patientId || row?.id || "").trim();
    let patient = { ...source, ...row, recordId: source?.id, id: patientId, patientId };
    if (patientId) {
      try {
        const response = await api.get(`/tenant/patients/${patientId}`).catch((error) => {
          if ([404, 405].includes(error?.response?.status)) return api.get(`/patients/${patientId}`);
          throw error;
        });
        patient = { ...patient, ...(response.data?.data || response.data?.patient || response.data || {}) };
      } catch {
        // Keep the row data available when a detail endpoint is unavailable.
      }
    }
    setSelectedTablePatient(patient);
  };

  const checkInTablePatient = async (checkInDate = currentDateInput()) => {
    if (!selectedTablePatient) return;
    if (selectedTablePatient.tokenId || selectedTablePatient.tokenNumber) {
      await checkInQueuedPatient(selectedTablePatient, checkInDate);
    } else if (selectedTablePatient.recordId) {
      try {
        await api.post(`/appointments/${selectedTablePatient.recordId}/check-in`);
        setSelectedTablePatient(null);
        setToast("Patient checked in successfully.");
        await loadDomainRows();
      } catch (error: any) {
        setToast(String(error?.response?.data?.message || "Patient check-in failed."));
      }
    }
  };

  const formatSavedValue = (value: unknown) => {
    const cleanDuplicatePipes = (text: string) => {
      const parts = text
        .split("|")
        .map((part) => part.trim())
        .filter(Boolean);
      if (parts.length > 1 && parts.every((part) => part.toLowerCase() === parts[0].toLowerCase())) {
        return parts[0];
      }
      return text;
    };
    if (Array.isArray(value)) return cleanDuplicatePipes(value.join(", "));
    if (typeof value === "boolean") return value ? "Yes" : "No";
    if (value === null || value === undefined) return "";
    if (typeof value === "number") return value;
    return cleanDuplicatePipes(String(value));
  };

  const normalizeSavedRow = (record: any): TableRow => {
    const row: TableRow = {
      id: record?.id || "",
      action: record?.action || "",
      createdAt: record?.createdAt
        ? new Date(record.createdAt).toLocaleString()
        : "",
    };
    const payloadData = record?.payload?.data || {};
    const data = { ...payloadData, ...record };

    if (moduleKey === "ict") {
      return {
        id: record?.id || "",
        event: formatFormTitle(record?.action || payloadData?.form || "ICT operation"),
        severity: formatSavedValue(payloadData?.severity || payloadData?.risk_assessment || payloadData?.risk_level || ""),
        status: formatSavedValue(payloadData?.change_status || payloadData?.status || "Open"),
        owner: formatSavedValue(payloadData?.approved_by || payloadData?.reported_by || payloadData?.assigned_to || "ICT Security Officer"),
        logged: record?.createdAt ? new Date(record.createdAt).toLocaleString() : "",
      };
    }

    columns.forEach((column) => {
      const direct = data[column.key];
      if (direct !== undefined) {
        row[column.key] = formatSavedValue(direct);
        return;
      }
      const lowerKey = column.key.toLowerCase();
      const matchedKey = Object.keys(data).find(
        (key) => key.toLowerCase() === lowerKey || key.toLowerCase().includes(lowerKey),
      );
      row[column.key] = matchedKey ? formatSavedValue(data[matchedKey]) : "";
    });

    if (columns.length > 0 && !row[columns[0].key]) {
      row[columns[0].key] = record?.action || record?.id || "Saved record";
    }
    return row;
  };

  const normalizeDomainRow = (record: any): TableRow => {
    const row: TableRow = {
      id: formatSavedValue(record?.id || ""),
      action: formatFormTitle(String(record?.action || record?.model || "Record")),
      createdAt: record?.createdAt
        ? new Date(record.createdAt).toLocaleString()
        : record?.updatedAt
          ? new Date(record.updatedAt).toLocaleString()
          : "",
    };
    const data = { ...record };

    columns.forEach((column) => {
      const direct = data[column.key];
      if (direct !== undefined) {
        row[column.key] = formatSavedValue(direct);
        return;
      }
      const lowerKey = column.key.toLowerCase();
      const matchedKey = Object.keys(data).find((key) => {
        const normalized = key.toLowerCase();
        return normalized === lowerKey || normalized.includes(lowerKey) || lowerKey.includes(normalized);
      });
      row[column.key] = matchedKey ? formatSavedValue(data[matchedKey]) : "";
    });

    if (columns.length > 0 && !row[columns[0].key]) {
      row[columns[0].key] =
        formatSavedValue(record?.name || record?.title || record?.patientName || record?.action || record?.id) ||
        "Record";
    }
    return row;
  };

  const loadDomainRows = async () => {
    if (!moduleKey) return;
    try {
      const response = await api.get("/module-actions/domain-records", {
        params: {
          module: moduleKey,
          limit: 100,
          ...(facility?.id ? { facilityId: facility.id } : {}),
        },
      });
      const rows = Array.isArray(response.data) ? response.data : [];
      setDomainRows(rows.map(normalizeDomainRow));
      setDomainRowsLoaded(true);
    } catch {
      setDomainRows([]);
      setDomainRowsLoaded(true);
    }
  };

  const loadDomainSummary = async () => {
    if (!moduleKey) return;
    try {
      const response = await api.get("/module-actions/domain-summary", {
        params: {
          module: moduleKey,
          limit: 500,
          ...(facility?.id ? { facilityId: facility.id } : {}),
        },
      });
      setDomainSummary(response.data || null);
    } catch {
      setDomainSummary(null);
    }
  };

  const loadSavedRows = async () => {
    if (!moduleKey) return;
    try {
      const response = await api.get("/module-actions", {
        params: {
          module: moduleKey,
          limit: 100,
          ...(facility?.id ? { facilityId: facility.id } : {}),
        },
      });
      const rows = Array.isArray(response.data) ? response.data : [];
      setSavedRows(rows.map(normalizeSavedRow));
    } catch {
      setSavedRows([]);
    }
  };

  useEffect(() => {
    return () => {
      if (toastTimer.current) {
        window.clearTimeout(toastTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    void loadDomainRows();
    void loadDomainSummary();
    void loadSavedRows();
  }, [moduleKey, facility?.id]);

  useLiveRefresh(async () => {
    await Promise.all([loadDomainRows(), loadDomainSummary(), loadSavedRows()]);
  }, { intervalMs: 90000, enabled: Boolean(moduleKey) });

  const loadWaitingList = async () => {
    if (!waitingConfig) return;
    setWaitingListLoading(true);
    try {
      const response = await api.get("/opd/queue/board", {
        params: { departmentId: waitingConfig.departmentId, includeCompleted: "true" },
      });
      const payload = response.data?.data || response.data || {};
      const allRows = Array.isArray(payload?.tokens) ? payload.tokens : [];
      const nextRows = allRows.filter((row: any) => String(row?.status || "").toUpperCase() !== "COMPLETED");
      setCompletedQueueRows(allRows.filter((row: any) => String(row?.status || "").toUpperCase() === "COMPLETED"));
      setWaitingListRows(nextRows);
      const activeState = readCheckedInPatientState(moduleKey);
      if (activeState?.patientId && !nextRows.some((row: any) => String(row?.patientId || "") === String(activeState.patientId))) {
        const states = JSON.parse(window.localStorage.getItem(CHECKED_IN_STATES_KEY) || "{}");
        delete states[moduleKey];
        window.localStorage.setItem(CHECKED_IN_STATES_KEY, JSON.stringify(states));
        setCheckedInPatientState(normalizeCheckedInPatient({}));
        setActiveForm(null);
        setFormValues({});
        window.dispatchEvent(new CustomEvent("hmis:patient-module-state", { detail: { moduleKey, state: {} } }));
      }
    } catch {
      setWaitingListRows([]);
    } finally {
      setWaitingListLoading(false);
    }
  };

  useEffect(() => {
    const handleWaitingListOpen = (event: Event) => {
      const detail = (event as CustomEvent<{ moduleKey?: string }>).detail;
      if (!detail?.moduleKey || detail.moduleKey !== moduleKey || !waitingConfig) return;
      setWaitingListOpen(true);
      void loadWaitingList();
    };
    const handleQueued = () => {
      if (!waitingConfig) return;
      void loadWaitingList();
    };
    window.addEventListener("hmis:open-module-waiting-list", handleWaitingListOpen);
    window.addEventListener("hmis:patient-queued", handleQueued);
    return () => {
      window.removeEventListener("hmis:open-module-waiting-list", handleWaitingListOpen);
      window.removeEventListener("hmis:patient-queued", handleQueued);
    };
  }, [moduleKey, waitingConfig?.departmentId]);

  useEffect(() => {
    if (!waitingConfig) return;
    void loadWaitingList();
  }, [moduleKey, waitingConfig?.departmentId]);

  const combinedRows = useMemo(() => {
    if (useProvidedRows) return rows;
    const baseRows = domainRowsLoaded && domainRows.length > 0 ? domainRows : rows;
    const existingIds = new Set(baseRows.map((row) => String(row.id || row[columns[0]?.key] || "")));
    const uniqueSaved = savedRows.filter((row) => !existingIds.has(String(row.id || row[columns[0]?.key] || "")));
    const queuedRows = waitingConfig
      ? waitingListRows.map((row) => {
          const normalized = normalizeQueuedPatient(row);
          return columns.reduce<TableRow>((acc, column) => {
            const key = column.key.toLowerCase();
            if (key.includes("patient") || key.includes("name")) acc[column.key] = normalized.patientName;
            else if (key.includes("mrn") || key.includes("code") || key.includes("id")) acc[column.key] = normalized.patientCode || normalized.patientId;
            else if (key.includes("phone") || key.includes("contact")) acc[column.key] = normalized.phone;
            else if (key.includes("status")) acc[column.key] = row?.status || "Queued";
            else if (key.includes("time") || key.includes("date")) acc[column.key] = row?.issuedAt ? new Date(row.issuedAt).toLocaleString() : "";
            else if (key.includes("source")) acc[column.key] = row?.source || row?.queueSource || row?.notes || "Queue";
            else acc[column.key] = "";
            acc.id = `queued-${row?.tokenId || row?.tokenNumber || normalized.patientId}`;
            return acc;
          }, {});
        })
      : [];
    const historyRows = waitingConfig
      ? completedQueueRows.map((row) => columns.reduce<TableRow>((acc, column) => {
          const key = column.key.toLowerCase();
          if (key.includes("patient") || key.includes("name")) acc[column.key] = row?.patientName || row?.name || "Completed patient";
          else if (key.includes("mrn") || key.includes("code") || key.includes("id")) acc[column.key] = row?.patientCode || row?.mrn || row?.patientId || "";
          else if (key.includes("status")) acc[column.key] = "COMPLETED";
          else if (key.includes("time") || key.includes("date")) acc[column.key] = row?.completedAt || row?.issuedAt ? new Date(row.completedAt || row.issuedAt).toLocaleString() : "";
          else acc[column.key] = "";
          acc.id = `completed-${row?.tokenId || row?.tokenNumber || row?.patientId}`;
          return acc;
        }, {}))
      : [];
    return [...queuedRows, ...historyRows, ...uniqueSaved, ...baseRows];
  }, [rows, savedRows, domainRows, domainRowsLoaded, columns, waitingConfig, waitingListRows, completedQueueRows, useProvidedRows]);

  const filteredRows = useMemo(() => {
    const filterMatchedRows = combinedRows.filter((row) =>
      rowFilters.every((filter) => {
        const selected = rowFilterValues[filter.key];
        if (!selected || selected === "ALL") return true;
        return String(row[filter.key] ?? "").toLowerCase() === selected.toLowerCase();
      }),
    );
    if (!search.trim() || searchKeys.length === 0) return filterMatchedRows;
    const needle = search.toLowerCase();
    return filterMatchedRows.filter((row) =>
      searchKeys.some((key) =>
        String(row[key] ?? "")
          .toLowerCase()
          .includes(needle),
      ),
    );
  }, [combinedRows, rowFilters, rowFilterValues, search, searchKeys]);

  const normalizeText = (value: string) =>
    value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

  const formatFormTitle = (value: string) => value.replace(/\s+Form$/i, "").trim();

  const formatStatValue = (label: string, value: number) => {
    const normalized = normalizeText(label);
    if (
      normalized.includes("revenue") ||
      normalized.includes("cost") ||
      normalized.includes("paid") ||
      normalized.includes("outstanding") ||
      normalized.includes("expense") ||
      normalized.includes("profit") ||
      normalized.includes("billed") ||
      normalized.includes("collected")
    ) {
      return `Ksh ${Number(value || 0).toLocaleString()}`;
    }
    if (
      normalized.includes("percent") ||
      normalized.includes("rate") ||
      normalized.includes("occupancy") ||
      normalized.includes("efficiency") ||
      normalized.includes("ratio")
    ) {
      return `${Number(value || 0).toFixed(2)}%`;
    }
    return Number(value || 0).toLocaleString();
  };

  const valueForStatLabel = (label: string) => {
    const summary = domainSummary || {};
    const normalized = normalizeText(label);
    const total = Number(summary.total || 0);
    const completed = Number(summary.completed || 0);
    if (normalized.includes("today")) return summary.today;
    if (normalized.includes("30d") || normalized.includes("30 d")) return summary.last30Days;
    if (normalized.includes("critical") || normalized.includes("high") || normalized.includes("overdue")) return summary.critical;
    if (normalized.includes("failure") || normalized.includes("incident") || normalized.includes("backup")) return summary.critical ?? summary.open;
    if (normalized.includes("open") || normalized.includes("pending") || normalized.includes("requested") || normalized.includes("scheduled")) return summary.pending ?? summary.open;
    if (normalized.includes("approval") || normalized.includes("role") || normalized.includes("appointment")) return summary.total;
    if (normalized.includes("capacity")) return summary.total;
    if (normalized.includes("occupied")) return summary.active ?? summary.open;
    if (normalized.includes("available")) return Math.max(0, Number(summary.total || 0) - Number(summary.active ?? summary.open ?? 0));
    if (normalized.includes("completed") || normalized.includes("resolved") || normalized.includes("released")) return summary.completed;
    if (normalized.includes("active") || normalized.includes("assigned")) return summary.active ?? summary.open ?? summary.total;
    if (normalized.includes("outstanding") || normalized.includes("balance") || normalized.includes("receivable")) return summary.outstanding;
    if (normalized.includes("revenue") || normalized.includes("billed")) return summary.revenue;
    if (normalized.includes("cost") || normalized.includes("expense")) return summary.expense;
    if (normalized.includes("paid") || normalized.includes("collected")) return summary.paid ?? summary.revenue;
    if (normalized.includes("profit") || normalized.includes("margin")) return summary.net;
    if (normalized.includes("percent") || normalized.includes("rate") || normalized.includes("ratio") || normalized.includes("occupancy") || normalized.includes("compliance")) {
      return total > 0 ? (completed / total) * 100 : undefined;
    }
    if (
      normalized.includes("total") ||
      normalized.includes("orders") ||
      normalized.includes("patients") ||
      normalized.includes("records") ||
      normalized.includes("tickets") ||
      normalized.includes("requests") ||
      normalized.includes("donors") ||
      normalized.includes("invoices")
    ) {
      return summary.total;
    }
    return undefined;
  };

  const liveStats = useMemo(
    () => {
      if (useProvidedStats) return stats;
      return (
      stats.map((stat) => {
        const liveValue = valueForStatLabel(stat.label);
        if (liveValue === undefined || liveValue === null || Number.isNaN(Number(liveValue))) return stat;
        return { ...stat, value: formatStatValue(stat.label, Number(liveValue)) };
      })
      );
    },
    [stats, domainSummary, useProvidedStats],
  );

  const chartSeries = useMemo(() => {
    const statusMix = Array.isArray(domainSummary?.charts?.statusMix)
      ? domainSummary.charts.statusMix
      : [];
    const actionMix = Array.isArray(domainSummary?.charts?.actionMix)
      ? domainSummary.charts.actionMix
      : [];
    return statusMix.length > 0 ? statusMix : actionMix;
  }, [domainSummary]);

  const chartTotal = useMemo(
    () => chartSeries.reduce((sum: number, item: any) => sum + Number(item.value || 0), 0),
    [chartSeries],
  );

  const getActiveFormIcon = (formTitle: string) => {
    const normalized = normalizeText(formTitle);
    if (moduleKey === "accounting") {
      if (normalized.includes("journal")) return "description";
      if (normalized.includes("chart")) return "insights";
      if (normalized.includes("bank")) return "receipt_long";
    }
    if (moduleKey === "ict") {
      if (normalized.includes("incident")) return "shield";
      if (normalized.includes("configuration") || normalized.includes("change")) return "settings";
    }
    if (moduleKey === "nursing-admin") {
      if (normalized.includes("roster")) return "event";
      if (normalized.includes("competency")) return "fact_check";
    }
    if (moduleKey === "medical-director") {
      if (normalized.includes("profile") || normalized.includes("privilege")) return "badge";
      if (normalized.includes("protocol")) return "description";
      if (normalized.includes("mortality") || normalized.includes("complication") || normalized.includes("m&m")) return "fact_check";
      if (normalized.includes("risk") || normalized.includes("critical")) return "shield";
      if (normalized.includes("drug")) return "medication";
      if (normalized.includes("performance") || normalized.includes("outcome")) return "insights";
    }
    if (moduleKey === "icu") {
      if (normalized.includes("admission")) return "local_hospital";
      if (normalized.includes("daily")) return "fact_check";
      if (normalized.includes("ventilator")) return "activity";
    }
    if (normalized.includes("pregnancy")) return "heart";
    if (normalized.includes("anc")) return "fact_check";
    if (normalized.includes("delivery") || normalized.includes("birth record")) return "local_hospital";
    if (normalized.includes("newborn")) return "baby";
    if (normalized.includes("partograph")) return "activity";
    if (normalized.includes("triage")) return "fact_check";
    if (normalized.includes("consultation")) return "stethoscope";
    if (normalized.includes("referral")) return "sync_alt";
    if (normalized.includes("admission")) return "person_add";
    if (normalized.includes("discharge")) return "logout";
    if (normalized.includes("transfer")) return "sync_alt";
    return "fact_check";
  };

  const getActiveFormModeClass = (formTitle: string) => {
    const normalized = normalizeText(formTitle);
    if (moduleKey === "opd") {
      if (normalized.includes("triage")) return "opd-mode-triage";
      if (normalized.includes("consultation")) return "opd-mode-consultation";
      if (normalized.includes("referral")) return "opd-mode-referral";
    }
    if (moduleKey === "maternity") {
      if (normalized.includes("pregnancy")) return "maternity-mode-pregnancy";
      if (normalized.includes("anc")) return "maternity-mode-anc";
      if (normalized.includes("delivery") || normalized.includes("birth record")) return "maternity-mode-delivery";
      if (normalized.includes("newborn")) return "maternity-mode-newborn";
      if (normalized.includes("partograph")) return "maternity-mode-partograph";
    }
    if (moduleKey === "icu") {
      if (normalized.includes("admission")) return "icu-mode-admission";
      if (normalized.includes("daily")) return "icu-mode-daily";
      if (normalized.includes("ventilator")) return "icu-mode-ventilator";
    }
    if (moduleKey === "accounting") {
      if (normalized.includes("journal")) return "accounting-mode-journal";
      if (normalized.includes("chart")) return "accounting-mode-chart";
      if (normalized.includes("bank")) return "accounting-mode-bank";
    }
    if (moduleKey === "ict") {
      if (normalized.includes("incident")) return "ict-mode-incident";
      if (normalized.includes("configuration") || normalized.includes("change")) return "ict-mode-config";
    }
    if (moduleKey === "nursing-admin") {
      if (normalized.includes("roster")) return "matron-mode-roster";
      if (normalized.includes("competency")) return "matron-mode-competency";
    }
    if (moduleKey === "medical-director") {
      if (normalized.includes("profile") || normalized.includes("privilege")) return "medical-director-mode-doctor";
      if (normalized.includes("protocol")) return "medical-director-mode-protocol";
      if (normalized.includes("mortality") || normalized.includes("complication") || normalized.includes("m&m")) return "medical-director-mode-review";
      if (normalized.includes("risk") || normalized.includes("critical")) return "medical-director-mode-alert";
      if (normalized.includes("drug")) return "medical-director-mode-drug";
      if (normalized.includes("performance") || normalized.includes("outcome")) return "medical-director-mode-score";
    }
    return "";
  };

  const getSubmitLabel = (formTitle: string) => {
    const normalized = normalizeText(formTitle);
    if (moduleKey === "opd") {
      if (normalized.includes("triage")) return "Save Triage Assessment";
      if (normalized.includes("consultation")) return "Save Consultation";
      if (normalized.includes("referral")) return "Create Referral";
    }
    if (moduleKey === "maternity") {
      if (normalized.includes("pregnancy")) return "Register Pregnancy";
      if (normalized.includes("anc")) return "Save ANC Visit";
      if (normalized.includes("delivery") || normalized.includes("birth record")) return "Save Delivery Record";
      if (normalized.includes("newborn")) return "Save Newborn Assessment";
      if (normalized.includes("partograph")) return "Save Partograph";
    }
    if (moduleKey === "icu") {
      if (normalized.includes("admission")) return "Save ICU Admission Assessment";
      if (normalized.includes("daily")) return "Save ICU Daily Assessment";
      if (normalized.includes("ventilator")) return "Save Ventilator Record";
    }
    if (moduleKey === "accounting") {
      if (normalized.includes("journal")) return "Post Journal Entry";
      if (normalized.includes("chart")) return "Save Account";
      if (normalized.includes("bank")) return "Reconcile Bank";
    }
    if (moduleKey === "ict") {
      if (normalized.includes("incident")) return "Submit Incident Report";
      if (normalized.includes("configuration") || normalized.includes("change")) return "Submit Configuration Change";
    }
    if (moduleKey === "nursing-admin") {
      if (normalized.includes("roster")) return "Save Duty Roster";
      if (normalized.includes("competency")) return "Save Competency Assessment";
    }
    if (moduleKey === "medical-director") {
      if (normalized.includes("approval")) return "Submit Approval";
      if (normalized.includes("alert")) return "Submit Alert";
      if (normalized.includes("review")) return "Save Review";
      if (normalized.includes("protocol")) return "Save Protocol";
      if (normalized.includes("score") || normalized.includes("metric")) return "Save Score";
      return "Save Governance Record";
    }
    if (moduleKey === "reports" || moduleKey === "reporting") {
      if (normalized.includes("builder") || normalized.includes("template")) return "Save Report Template";
      if (normalized.includes("run") || normalized.includes("parameter")) return "Generate Report";
      if (normalized.includes("export")) return "Export Report";
      return "Save Reporting Setup";
    }
    if (normalized.includes("admission")) return "Admit Patient";
    if (normalized.includes("discharge")) return "Discharge Patient";
    if (normalized.includes("transfer")) return "Transfer Ward";
    if (normalized.includes("registration")) return "Register Record";
    if (normalized.includes("assessment")) return "Save Assessment";
    if (normalized.includes("visit")) return "Save Visit";
    if (normalized.includes("booking") || normalized.includes("appointment")) return "Schedule Appointment";
    if (normalized.includes("slot") || normalized.includes("configuration")) return "Save Configuration";
    if (normalized.includes("cancel")) return "Cancel Appointment";
    if (normalized.includes("request")) return "Submit Request";
    if (normalized.includes("order")) return "Place Order";
    if (normalized.includes("result")) return "Enter Result";
    if (normalized.includes("report")) return "Submit Report";
    if (normalized.includes("prescription")) return "Save Prescription";
    if (normalized.includes("dispense")) return "Confirm Dispensing";
    if (normalized.includes("receipt") || normalized.includes("payment")) return "Post Payment";
    if (normalized.includes("claim")) return "Submit Claim";
    if (normalized.includes("supplier") || normalized.includes("vendor")) return "Save Supplier";
    if (normalized.includes("stock") || normalized.includes("inventory")) return "Save Stock Record";
    if (normalized.includes("message") || normalized.includes("sms") || normalized.includes("whatsapp")) return "Send Message";
    if (normalized.includes("feedback") || normalized.includes("complaint")) return "Submit Feedback";
    if (normalized.includes("document") || normalized.includes("upload")) return "Upload Document";
    if (normalized.includes("consent")) return "Record Consent";
    if (normalized.includes("referral")) return "Create Referral";
    return `Save ${formatFormTitle(formTitle)}`;
  };
  const getGeneratedActionIcon = (formTitle: string) => {
    const normalized = normalizeText(formTitle);
    if (normalized.includes("appointment") || normalized.includes("slot") || normalized.includes("roster") || normalized.includes("schedule")) return "event";
    if (normalized.includes("triage") || normalized.includes("assessment") || normalized.includes("vital")) return "fact_check";
    if (normalized.includes("consultation") || normalized.includes("encounter") || normalized.includes("clinical") || normalized.includes("doctor")) return "stethoscope";
    if (normalized.includes("admission") || normalized.includes("ward") || normalized.includes("bed")) return "hotel";
    if (normalized.includes("discharge") || normalized.includes("transfer") || normalized.includes("referral") || normalized.includes("dispatch")) return "sync_alt";
    if (normalized.includes("lab") || normalized.includes("specimen") || normalized.includes("result") || normalized.includes("blood")) return "biotech";
    if (normalized.includes("radiology") || normalized.includes("report") || normalized.includes("imaging")) return "description";
    if (normalized.includes("pharmacy") || normalized.includes("prescription") || normalized.includes("drug") || normalized.includes("medication")) return "medication";
    if (normalized.includes("billing") || normalized.includes("invoice") || normalized.includes("receipt") || normalized.includes("payment") || normalized.includes("claim") || normalized.includes("reconciliation")) return "receipt_long";
    if (normalized.includes("inventory") || normalized.includes("stock") || normalized.includes("purchase") || normalized.includes("supplier")) return "inventory_2";
    if (normalized.includes("security") || normalized.includes("risk") || normalized.includes("incident") || normalized.includes("audit") || normalized.includes("consent")) return "security";
    if (normalized.includes("configuration") || normalized.includes("setting") || normalized.includes("maintenance")) return "settings";
    if (normalized.includes("message") || normalized.includes("sms") || normalized.includes("whatsapp") || normalized.includes("feedback") || normalized.includes("complaint")) return "message";
    if (normalized.includes("analytics") || normalized.includes("kpi") || normalized.includes("forecast") || normalized.includes("dashboard") || normalized.includes("reporting")) return "insights";
    if (normalized.includes("upload") || normalized.includes("document") || normalized.includes("file")) return "upload";
    if (normalized.includes("user") || normalized.includes("patient") || normalized.includes("staff") || normalized.includes("household")) return "groups";
    return "edit_note";
  };

  const pickFormForAction = (
    forms: ModuleActionFormDefinition[] | undefined,
    actionLabel: string,
  ) => {
    if (!forms || forms.length === 0) return null;
    const target = normalizeText(actionLabel);
    if (!target) return forms[0];
    const exact = forms.find((form) => normalizeText(form.name) === target);
    if (exact) return exact;
    const partial = forms.find((form) => {
      const name = normalizeText(form.name);
      return name.includes(target) || target.includes(name);
    });
    return partial || forms[0];
  };

  const openConfiguredForm = (
    selectedForm: ModuleActionFormDefinition | null,
    fallbackLabel: string,
    accentColor?: string,
  ) => {
    const baseFields: FormField[] = selectedForm
      ? selectedForm.fields.map((field) => ({ ...field }))
      : columns.map((col) => ({
          name: col.key,
          label: col.label,
          type: "text",
        }));
    if (!selectedForm) {
      baseFields.push({
        name: "notes",
        label: "Notes",
        type: "textarea",
        placeholder: "Add any supporting details",
      });
    }
    setFormValues({});
    const queuePrefill =
      activeCheckedInPatient?.hasCheckedInPatient
        ? prefillQueuePatientFields(activeCheckedInPatient, baseFields as ModuleActionField[])
        : {};
    setActiveForm({
      title: formatFormTitle(selectedForm?.name || fallbackLabel || `New ${title}`),
      description:
        selectedForm?.description || `Capture details for ${title.toLowerCase()} workflow.`,
      fields: baseFields as ModuleActionField[],
      accentColor,
    });
    if (Object.keys(queuePrefill).length > 0) {
      setFormValues(queuePrefill);
    }
  };

  useEffect(() => {
    const handleSidebarFormOpen = (event: Event) => {
      const detail = (event as CustomEvent<{ moduleKey?: string; formName?: string }>).detail;
      if (!detail?.formName || detail.moduleKey !== moduleKey) return;
      // Appointments owns a native form with patient/slot workflow logic.
      // Do not open the generic directory form for its three actions.
      if (moduleKey === "appointments") return;
      const selectedForm =
        MODULE_ACTION_FORMS[moduleKey]?.forms.find((form) => form.name === detail.formName) ||
        null;
      if (!selectedForm) return;
      const index = MODULE_ACTION_FORMS[moduleKey]?.forms.findIndex((form) => form.name === detail.formName) ?? 0;
      openConfiguredForm(selectedForm, detail.formName, actionPalette[Math.max(index, 0) % actionPalette.length]);
    };

    window.addEventListener("hmis:open-module-form", handleSidebarFormOpen);
    return () => window.removeEventListener("hmis:open-module-form", handleSidebarFormOpen);
  }, [moduleKey, columns, title]);

  const handleActionClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    const button = target.closest("button");
    if (!button || button.hasAttribute("disabled")) return;
    if (button.dataset.automationAction === "true") return;
    const rawLabel = button.textContent || "";
    const cleanedLabel = rawLabel.replace(iconTokenPattern, "").replace(/\s+/g, " ").trim();
    const configured = MODULE_ACTION_FORMS[moduleKey];
    const selectedForm = pickFormForAction(configured?.forms, cleanedLabel);
    if (moduleKey === "appointments" && selectedForm) {
      window.dispatchEvent(
        new CustomEvent("hmis:open-appointment-form", {
          detail: { formName: selectedForm.name },
        }),
      );
      return;
    }
    const selectedIndex = selectedForm && configured?.forms
      ? configured.forms.findIndex((form) => form.name === selectedForm.name)
      : 0;
    openConfiguredForm(
      selectedForm,
      cleanedLabel,
      actionPalette[Math.max(selectedIndex, 0) % actionPalette.length],
    );
  };

  const runAutomationAction = async (action: { label: string; endpoint: string; method?: string; payload?: Record<string, unknown> }) => {
    try {
      const searchTerm = action.label === "ICD-10 Search"
        ? window.prompt("Search ICD-10 code or diagnosis", String(action.payload?.q || ""))?.trim()
        : "";
      if (action.label === "ICD-10 Search" && !searchTerm) return;
      setSubmitting(true);
      const response = await api.request({
        method: action.method || "post",
        url: action.endpoint,
        data: {
          facilityId: facility?.id,
          ...(action.payload || {}),
          ...(searchTerm ? { q: searchTerm } : {}),
        },
      });
      if (action.label === "ICD-10 Search") {
        setAutomationOutput({ label: action.label, query: searchTerm, data: response.data });
      }
      setToast(`${action.label} completed.`);
      await Promise.all([loadDomainRows(), loadSavedRows()]);
    } catch (error: any) {
      setToast(String(error?.response?.data?.message || error?.message || `${action.label} failed.`));
    } finally {
      setSubmitting(false);
    }
  };

  const handleFormChange = (name: string, value: string | boolean | string[]) => {
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const renderFieldInput = (field: FormField) => {
    const value = formValues[field.name];
    const baseClass = "module-form-input";
    if (field.type === "textarea") {
      return (
        <textarea
          className={`${baseClass} ${/symptom/i.test(field.name) ? "min-h-[160px]" : "min-h-[110px]"}`}
          placeholder={field.placeholder}
          value={typeof value === "string" ? value : ""}
          onChange={(event) => handleFormChange(field.name, event.target.value)}
          required={field.required}
          disabled={field.disabled}
        />
      );
    }

    if (field.type === "select") {
      const options = field.options ?? [];
      if (field.multiple) {
        const selected = Array.isArray(value) ? value : [];
        return (
          <select
            multiple
            className={baseClass}
            value={selected}
            onChange={(event) =>
              handleFormChange(
                field.name,
                Array.from(event.target.selectedOptions).map((opt) => opt.value),
              )
            }
            required={field.required}
            disabled={field.disabled}
          >
            {options.length === 0 ? (
              <option value="">No options configured</option>
            ) : null}
            {options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );
      }
      return (
        <select
          className={baseClass}
          value={typeof value === "string" ? value : ""}
          onChange={(event) => handleFormChange(field.name, event.target.value)}
          required={field.required}
          disabled={field.disabled}
        >
          <option value="">
            {field.placeholder || "Select an option"}
          </option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      );
    }

    if (field.type === "radio") {
      const options = field.options ?? [];
      if (options.length === 0) {
        return (
          <input
            type="text"
            className={baseClass}
            placeholder={field.placeholder}
            value={typeof value === "string" ? value : ""}
            onChange={(event) => handleFormChange(field.name, event.target.value)}
            required={field.required}
            disabled={field.disabled}
          />
        );
      }
      return (
        <div className="space-y-2">
          {options.map((option) => (
            <label key={option} className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="radio"
                name={field.name}
                value={option}
                checked={value === option}
                onChange={(event) =>
                  handleFormChange(field.name, event.target.value)
                }
                disabled={field.disabled}
              />
              {option}
            </label>
          ))}
        </div>
      );
    }

    if (field.type === "checkbox") {
      const options = field.options ?? [];
      if (field.multiple && options.length > 0) {
        const selected = Array.isArray(value) ? value : [];
        return (
          <div className="space-y-2">
            {options.map((option) => (
              <label key={option} className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  value={option}
                  checked={selected.includes(option)}
                  onChange={(event) => {
                    if (event.target.checked) {
                      handleFormChange(field.name, [...selected, option]);
                    } else {
                      handleFormChange(
                        field.name,
                        selected.filter((item) => item !== option),
                      );
                    }
                  }}
                  disabled={field.disabled}
                />
                {option}
              </label>
            ))}
          </div>
        );
      }
      return (
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(event) => handleFormChange(field.name, event.target.checked)}
            disabled={field.disabled}
          />
          {field.placeholder || "Yes"}
        </label>
      );
    }

    if (field.type === "toggle") {
      return (
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(event) => handleFormChange(field.name, event.target.checked)}
            disabled={field.disabled}
          />
          {field.placeholder || "Enabled"}
        </label>
      );
    }

    if (field.type === "file") {
      return (
        <input
          type="file"
          className={baseClass}
          onChange={(event) =>
            handleFormChange(field.name, event.target.files?.[0]?.name || "")
          }
          required={field.required}
          disabled={field.disabled}
        />
      );
    }

    const inputType =
      field.type === "number"
        ? "number"
        : field.type === "date"
          ? "date"
          : field.type === "datetime"
            ? "datetime-local"
            : field.type === "time"
              ? "time"
              : field.type === "email"
                ? "email"
                : field.type === "tel"
                  ? "tel"
                  : field.type === "password"
                    ? "password"
                    : field.type === "url"
                      ? "url"
                      : field.type === "search"
                        ? "search"
                        : "text";

    return (
      <input
        type={inputType}
        className={baseClass}
        placeholder={field.placeholder}
        value={typeof value === "string" ? value : ""}
        onChange={(event) => handleFormChange(field.name, event.target.value)}
        required={field.required}
        disabled={field.disabled}
      />
    );
  };

  const handleFormSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!activeForm) return;
    const checkedInPatient = normalizeCheckedInPatient(activeCheckedInPatient);
    if (requiresCheckedInPatient && !checkedInPatient.hasCheckedInPatient) {
      setToast("Check in a patient first. Module form records must be attached to a checked-in patient.");
      return;
    }
    const checkedInPatientName = String(checkedInPatient.patientName || checkedInPatient.name || "").trim();
    const checkedInMrn = String(checkedInPatient.patientCode || checkedInPatient.mrn || "").trim();
    const checkedInIdNumber = String(checkedInPatient.idNumber || checkedInPatient.nationalId || "").trim();
    setSubmitting(true);
    try {
      if (moduleKey === "blood-bank" && activeForm.title !== "Queue Patient" && activeForm.title !== "Monitor Patient") {
        const data = formValues as Record<string, any>;
        let endpoint = "";
        let body: Record<string, any> = { ...data };
        if (activeForm.title === "Donor Registration Form") endpoint = "/blood-bank/donor";
        else if (activeForm.title === "Blood Unit Collection Form") {
          const donorId = String(data.donor || data.donor_id || "").trim();
          if (!donorId) throw new Error("Donor ID is required for blood collection.");
          endpoint = `/blood-bank/donation/${encodeURIComponent(donorId)}`;
          body = { ...data, donorId, units_collected: data.units_collected || 1, donation_date: data.collection_time };
        } else if (activeForm.title === "Blood Request Form") {
          endpoint = "/blood-bank/request";
          body = { ...data, patientId: data.patientId || data.patient_id || data.patient, productType: data.productType || data.product_type, unitsRequested: data.unitsRequested || data.units_requested };
        } else if (activeForm.title === "Crossmatch Form") {
          endpoint = "/blood-bank/crossmatch";
          body = { ...data, patientId: data.patientId || data.patient_id || data.patient, patientBloodGroup: data.patientBloodGroup || data.patient_blood_group, donorBloodGroup: data.donorBloodGroup || data.unit_blood_group };
        } else if (activeForm.title === "Transfusion Reaction Report") {
          endpoint = "/blood-bank/reaction";
          body = { ...data, patientId: data.patientId || data.patient_id || data.patient, symptoms: data.symptoms || data.reaction_symptoms };
        }
        if (endpoint) {
          await api.post(endpoint, body);
          setActiveForm(null);
          setToast(`${activeForm.title} saved successfully.`);
          window.dispatchEvent(new CustomEvent("hmis:blood-bank-refresh"));
          setSubmitting(false);
          return;
        }
      }
      if (moduleKey === "blood-bank" && activeForm.title === "Queue Patient") {
        const patientId = String(formValues.patient_id || "").trim();
        if (!patientId) throw new Error("Patient ID is required to queue a patient.");
        await api.post("/opd/queue/token", {
          patientId,
          departmentId: "BLOOD_BANK",
          queueType: "BLOOD_BANK",
          priority: String(formValues.priority || "NORMAL").toUpperCase(),
          notes: formValues.reason || undefined,
        }).catch((error) => {
          if ([404, 405].includes(error?.response?.status)) return api.post("/queue/token", {
            patientId,
            departmentId: "BLOOD_BANK",
            queueType: "BLOOD_BANK",
            priority: String(formValues.priority || "NORMAL").toUpperCase(),
            notes: formValues.reason || undefined,
          });
          throw error;
        });
        setActiveForm(null);
        setToast("Patient queued for Blood Bank.");
        window.dispatchEvent(new CustomEvent("hmis:patient-queued", { detail: { moduleKey: "blood-bank", patientId } }));
        setSubmitting(false);
        return;
      }
      if (moduleKey === "ehr" && ["Clinical Encounter", "Diagnosis Entry", "Vital Signs", "Progress Note"].includes(activeForm.title)) {
        const patientId = String(checkedInPatient.patientId || checkedInPatient.id || "").trim();
        if (!patientId) throw new Error("Check in a patient before saving an EMR clinical form.");
        const data = formValues as Record<string, any>;
        const title = activeForm.title;
        if (title === "Clinical Encounter") {
          await api.post("/medical-records/visit-entry", {
            patientId,
            visitType: "OPD",
            chiefComplaint: data.chief_complaint,
            history: data.history_of_presenting_illness,
            pastMedicalHistory: data.past_medical_history,
            pastSurgicalHistory: data.past_surgical_history,
            familyHistory: data.family_history,
            socialHistory: data.social_history,
            reviewOfSystems: data.review_of_systems,
            examination: data.physical_examination,
            assessment: data.assessment_impression,
            plan: data.plan,
          });
        } else if (title === "Diagnosis Entry") {
          await api.post("/medical-records/visit-entry", {
            patientId,
            visitType: "OPD",
            chiefComplaint: "Diagnosis entry",
            assessment: data.notes || data.icd_10_code,
            diagnosis: [{ label: data.icd_10_code, code: data.icd_10_code, type: data.diagnosis_type, chronic: Boolean(data.is_chronic) }],
            plan: data.status || "CONFIRMED",
          });
        } else if (title === "Vital Signs") {
          await api.post("/medical-records/visit-entry", {
            patientId,
            visitType: "OPD",
            chiefComplaint: "Vital signs recording",
            vitals: {
              temperature: data.temperature_c,
              pulseRate: data.pulse_bpm,
              bpSystolic: data.systolic_bp_mmhg,
              bpDiastolic: data.diastolic_bp_mmhg,
              respiratoryRate: data.respiratory_rate,
              oxygenSaturation: data.spo2,
              weight: data.weight_kg,
              height: data.height_cm,
              painScore: data.pain_score_0_10,
              bloodGlucose: data.blood_glucose_mmol_l,
            },
          });
        } else {
          await api.post("/medical-records/visit-entry", {
            patientId,
            visitType: "OPD",
            chiefComplaint: "Progress note",
            history: data.soap_subjective,
            examination: data.soap_objective,
            assessment: data.soap_assessment,
            plan: data.soap_plan,
          });
        }
        setActiveForm(null);
        await Promise.all([loadDomainRows(), loadDomainSummary(), loadSavedRows()]);
        setToast(`${activeForm.title} saved to the patient's EMR.`);
        setSubmitting(false);
        return;
      }
      if (moduleKey === "patient-portal") {
        const data = formValues as Record<string, any>;
        const patientId = String(checkedInPatient.patientId || checkedInPatient.id || data.patient_id || "").trim();
        if (!patientId) throw new Error("Check in or select a patient before saving a portal form.");
        if (activeForm.title === "Portal Account Registration Form") {
          if (String(data.create_password || "") !== String(data.confirm_password || "")) {
            throw new Error("Password and confirmation do not match.");
          }
          await api.post("/patient-portal/account", {
            patientId,
            email: data.email_address,
            password: data.create_password,
            status: "ACTIVE",
            twoFactorEnabled: Boolean(data.two_factor_enabled),
          });
        } else if (activeForm.title === "Appointment Booking (Portal)") {
          const preferredDate = String(data.preferred_date || "").trim();
          const slot = String(data.available_slot || "09:00").trim();
          const dateTime = new Date(`${preferredDate}T${slot.length === 5 ? `${slot}:00` : slot}`);
          if (!preferredDate || Number.isNaN(dateTime.getTime())) throw new Error("Select a valid appointment date and time.");
          await api.post("/patient-portal/appointment", {
            patientId,
            dateTime: dateTime.toISOString(),
            appointmentType: String(data.appointment_type || "PORTAL").toUpperCase(),
            departmentId: data.department,
            chiefComplaint: data.chief_complaint,
            notes: data.insurance_to_use ? `Insurance: ${data.insurance_to_use}` : undefined,
            source: "PATIENT_PORTAL",
          });
        } else if (activeForm.title === "Patient Feedback Form (Portal)") {
          await api.post("/patient-portal/feedback", {
            patientId,
            feedbackType: "PATIENT_SATISFACTION",
            message: JSON.stringify(data),
          });
        } else {
          throw new Error(`No Patient Portal endpoint is configured for ${activeForm.title}.`);
        }
        setActiveForm(null);
        setToast(`${activeForm.title} saved successfully.`);
        window.dispatchEvent(new CustomEvent("hmis:patient-portal-refresh"));
        setSubmitting(false);
        return;
      }
      await api.post("/module-actions", {
        facilityId: facility?.id,
        module: moduleKey || title,
        action: activeForm.title,
        data: {
          ...formValues,
          ...(checkedInPatient.hasCheckedInPatient
            ? {
                patientId: checkedInPatient.patientId || checkedInPatient.id,
                patient_id: checkedInPatient.patientId || checkedInPatient.id,
                patientName: checkedInPatientName,
                patient_name: checkedInPatientName,
                patient_mrn: checkedInMrn,
                mrn: checkedInMrn,
                patientCode: checkedInMrn,
                nationalId: checkedInIdNumber,
                idNumber: checkedInIdNumber,
              }
            : {}),
        },
        context: {
          title,
          subtitle,
          checkedInPatientId: checkedInPatient.patientId || checkedInPatient.id || "",
        },
      });
      setActiveForm(null);
      await loadDomainRows();
      await loadDomainSummary();
      await loadSavedRows();
      setToast("Saved successfully.");
    } catch (error: any) {
      setToast(
        String(error?.response?.data?.message || "Failed to save. Please try again."),
      );
    }
    setSubmitting(false);
  };

  const requiredFieldCount = activeForm?.fields.filter((field) => field.required).length ?? 0;
  const actionPalette = [
    "#16a34a",
    "#2563eb",
    "#7c3aed",
    "#0891b2",
    "#f59e0b",
    "#0d9488",
    "#9333ea",
    "#475569",
  ];
  const getAutomationActionMeta = (label: string, index: number) => {
    const normalized = normalizeText(label);
    if (normalized.includes("refresh") && normalized.includes("display")) {
      return { color: "#0891b2", icon: "monitoring" };
    }
    if (normalized.includes("voice") || normalized.includes("call token")) {
      return { color: "#7c3aed", icon: "message" };
    }
    return { color: actionPalette[index % actionPalette.length], icon: "auto_awesome" };
  };

  return (
    <div className={`patients-view ${className}`.trim()}>
      <div className="pv-header">
        <div>
          <div className="pv-title flex items-center gap-2">
            {icon}
            {title}
          </div>
          {subtitle ? <div className="pv-subtitle">{subtitle}</div> : null}
        </div>
        {useProvidedActions && actions ? (
          captureActions ? (
            <div className="pv-actions" onClick={handleActionClick}>{actions}</div>
          ) : (
            actions
          )
        ) : configuredForms.length > 0 || automationActions.length > 0 ? (
          <div className="module-actions" onClick={handleActionClick}>
            {configuredForms.map((form, index) => {
              const color = actionPalette[index % actionPalette.length];
              return (
              <button
                key={form.name}
                className={`topbar-logout-btn ${moduleKey === "ehr" ? "emr-action-btn" : ""}`.trim()}
                data-emr-action={moduleKey === "ehr" ? form.name : undefined}
                style={{
                  backgroundColor: color,
                  borderColor: color,
                  boxShadow: `0 8px 18px ${color}33`,
                }}
              >
                <ModuleIcon name={getGeneratedActionIcon(form.name)} /> {formatFormTitle(form.name)}
              </button>
            );
            })}
            {automationActions.map((action, index) => {
              const actionMeta = getAutomationActionMeta(action.label, index);
              return (
              <button
                key={action.label}
                type="button"
                className={`topbar-logout-btn ${moduleKey === "ehr" ? "emr-action-btn" : ""}`.trim()}
                data-emr-action={moduleKey === "ehr" ? action.label : undefined}
                data-automation-action="true"
                style={{
                  backgroundColor: actionMeta.color,
                  borderColor: actionMeta.color,
                  boxShadow: `0 8px 18px ${actionMeta.color}33`,
                }}
                disabled={submitting}
                onClick={() => void runAutomationAction(action)}
              >
                <ModuleIcon name={actionMeta.icon} /> {action.label}
              </button>
              );
            })}
          </div>
        ) : actions ? (
          captureActions ? (
            <div className="module-actions" onClick={handleActionClick}>
              {actions}
            </div>
          ) : (
            <div className="module-actions">{actions}</div>
          )
        ) : null}
      </div>

      {filters ? <div className="module-filter-panel">{filters}</div> : null}

      {automationOutput?.label === "ICD-10 Search" && moduleKey === "ehr" ? (
        <section className="emr-automation-results" aria-live="polite">
          <div><strong>ICD-10 results for “{automationOutput.query}”</strong><button type="button" onClick={() => setAutomationOutput(null)}>Close</button></div>
          {Array.isArray(automationOutput.data) && automationOutput.data.length > 0 ? automationOutput.data.slice(0, 25).map((row: any) => (
            <span key={`${row.code}-${row.description}`}><b>{row.code}</b> {row.description}</span>
          )) : <span>No matching ICD-10 codes found.</span>}
        </section>
      ) : null}

      {stats.length > 0 ? (
        <div className="pv-stats">
          {liveStats.map((stat) => (
            <button
              type="button"
              key={stat.label}
              className={`pv-stat-card is-clickable ${activeStat === stat.label ? "is-active" : ""}`}
              style={{ borderLeftColor: stat.color || "#1e3a8a" }}
              aria-pressed={activeStat === stat.label}
              onClick={() => {
                setActiveStat(stat.label);
                document.querySelector(".pv-table-wrap")?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
            >
              <p className="pv-stat-label">{stat.label}</p>
              <p className="pv-stat-value">{stat.value}</p>
              {stat.note ? <p className="pv-stat-note">{stat.note}</p> : null}
            </button>
          ))}
        </div>
      ) : null}

      {chartSeries.length > 0 && chartTotal > 0 ? (
        <div className="pv-section">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                Live Record Mix
              </h3>
              <p className="pv-subtitle">Distribution from backend domain records.</p>
            </div>
            <span className="text-xs font-semibold text-slate-500">
              {chartTotal.toLocaleString()} records
            </span>
          </div>
          <div className="mt-5 flex flex-col md:flex-row md:items-center gap-6">
            <div
              className="w-32 h-32 rounded-full"
              style={{
                background: `conic-gradient(${chartSeries
                  .map((item: any, index: number) => {
                    const colors = ["#22c55e", "#f59e0b", "#ef4444", "#3b82f6", "#06b6d4", "#a855f7"];
                    const start = chartSeries
                      .slice(0, index)
                      .reduce((sum: number, current: any) => sum + (Number(current.value || 0) / chartTotal) * 100, 0);
                    const end = start + (Number(item.value || 0) / chartTotal) * 100;
                    return `${colors[index % colors.length]} ${start}% ${end}%`;
                  })
                  .join(", ")})`,
              }}
            />
            <div className="space-y-2">
              {chartSeries.map((item: any, index: number) => {
                const colors = ["#22c55e", "#f59e0b", "#ef4444", "#3b82f6", "#06b6d4", "#a855f7"];
                const value = Number(item.value || 0);
                const pct = chartTotal > 0 ? ((value / chartTotal) * 100).toFixed(1) : "0.0";
                return (
                  <div key={`${item.label}-${index}`} className="flex items-center gap-3 text-xs">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ background: colors[index % colors.length] }}
                    />
                    <span className="text-slate-500">{item.label || "Record"}</span>
                    <span className="font-semibold text-slate-900">{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}

      {showSearch ? (
        <div className="pv-search-bar">
          <div className="pv-search-wrap">
            <ModuleIcon name="search" />
            <input
              className="pv-search"
              placeholder={searchPlaceholder}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          {rowFilters.length > 0 ? (
            <div className="pv-inline-filters">
              {rowFilters.map((filter) => (
                <label key={filter.key} className="pv-inline-filter">
                  <span>{filter.label}</span>
                  <select
                    value={rowFilterValues[filter.key] || "ALL"}
                    onChange={(event) =>
                      setRowFilterValues((prev) => ({
                        ...prev,
                        [filter.key]: event.target.value,
                      }))
                    }
                  >
                    <option value="ALL">All</option>
                    {filter.options.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {afterSearchContent ? afterSearchContent : null}

      {waitingConfig && selectedQueuedPatient && checkedInQueuedPatientId === String(selectedQueuedPatient.id || "") ? (
        <div className="workflow-queue-active-banner">
          <strong>
            Active patient:
            {" "}
            {`${String(selectedQueuedPatient?.firstName || "").trim()} ${String(selectedQueuedPatient?.lastName || "").trim()}`.trim() ||
              String(selectedQueuedPatient?.patientName || "").replace(/^[^-]+-\s*/, "").trim()}
          </strong>
          <span>{String(selectedQueuedPatient?.patientCode || selectedQueuedPatient?.mrn || "").trim() || "No MRN"}</span>
        </div>
      ) : null}

      <div className="pv-table-wrap">
        <table className="pv-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key} className={col.className}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredRows.length === 0 ? (
              <tr>
                <td className="pv-empty" colSpan={columns.length}>
                  No records found.
                </td>
              </tr>
            ) : (
                filteredRows.map((row, index) => (
                <tr
                  key={`${row[columns[0].key]}-${index}`}
                  onClick={(event) => {
                    if ((event.target as HTMLElement).closest("button, a, input, select, textarea")) return;
                    const candidate = row as any;
                    const source = candidate?.original && typeof candidate.original === "object" ? candidate.original : candidate;
                    const hasPatient = Boolean(source?.patientId || source?.patient?.id || candidate?.patientId);
                    if (!hasPatient) {
                      setSelectedTableRecord(row);
                      return;
                    }
                    void openTablePatient(row);
                  }}
                  className="cursor-pointer hover:bg-slate-50"
                >
                  {columns.map((col) => (
                    <td key={col.key} className={col.className}>
                      {row[col.key] ?? "-"}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedTablePatient ? (
        <PatientDrawer
          patient={selectedTablePatient}
          canEdit={false}
          onClose={() => setSelectedTablePatient(null)}
          onEdit={() => undefined}
          onCheckIn={(checkInDate) => void checkInTablePatient(checkInDate)}
        />
      ) : null}
      {selectedTableRecord ? (
        <RecordDrawer record={selectedTableRecord} title={title} onClose={() => setSelectedTableRecord(null)} />
      ) : null}

      {waitingListOpen ? (
        <div className="module-modal-backdrop" onClick={() => setWaitingListOpen(false)}>
          <aside className={`workflow-waiting-panel ${moduleKey === "blood-bank" ? "blood-bank-waiting-panel" : ""}`.trim()} onClick={(event) => event.stopPropagation()}>
            <div className="workflow-waiting-panel-head">
              <div>
                <span className="workflow-waiting-kicker">{title} · QUEUE DESK</span>
                <h3>Open waiting list</h3>
                <p>Review arrivals and check patients into this service point.</p>
              </div>
              <button type="button" className="workflow-waiting-close" onClick={() => setWaitingListOpen(false)}>
                ×
              </button>
            </div>
            <div className="workflow-waiting-summary">
              <div><span>Waiting</span><strong>{waitingListRows.length}</strong></div>
              <div><span>Showing</span><strong>{visibleWaitingRows.length}</strong></div>
              <label className="workflow-waiting-date">Check-in date
                <input type="date" value={waitingCheckInDate} onChange={(event) => setWaitingCheckInDate(event.target.value)} />
              </label>
            </div>
            <div className="workflow-waiting-toolbar">
              <input type="search" value={waitingListSearch} onChange={(event) => setWaitingListSearch(event.target.value)} placeholder="Search patient, MRN or token" aria-label="Search waiting list" />
              <button type="button" onClick={() => void loadWaitingList()} disabled={waitingListLoading}>{waitingListLoading ? "Loading..." : "Refresh"}</button>
            </div>
            <div className="workflow-waiting-panel-body">
              {waitingListLoading ? (
                <div className="pv-empty">Loading queued patients...</div>
              ) : waitingListRows.length === 0 ? (
                <div className="pv-empty">No queued patients for this module.</div>
              ) : visibleWaitingRows.length === 0 ? (
                <div className="pv-empty">No waiting patients match your search.</div>
              ) : (
                visibleWaitingRows.map((row, index) => {
                  const selected = String(selectedQueuedPatient?.id || "") === String(row?.patientId || "");
                  const rowStatus = String(row?.status || "").toUpperCase();
                  const checkedIn = checkedInQueuedPatientId === String(row?.patientId || "") || rowStatus === "IN_SERVICE" || rowStatus === "CHECKED_IN";
                  const rowKey = String(row?.tokenId || row?.tokenNumber || row?.patientId || index);
                  const actionKey = String(row?.tokenId || row?.tokenNumber || row?.patientId || "");
                  return (
                    <div
                      key={rowKey}
                      className={`workflow-waiting-item ${selected ? "is-selected" : ""}`}
                    >
                      <button
                        type="button"
                        className="workflow-waiting-select"
                        onClick={async () => {
                          const patientId = String(row?.patientId || "").trim();
                          if (!patientId) return;
                          try {
                          const response = await api.get(`/tenant/patients/${patientId}`).catch((error) => {
                            const status = error?.response?.status;
                            if (status === 404 || status === 405) {
                              return api.get(`/patients/${patientId}`);
                            }
                            throw error;
                          });
                          setSelectedQueuedPatient(response.data?.data || response.data?.patient || response.data || row);
                        } catch {
                          setSelectedQueuedPatient({
                            id: patientId,
                            patientId,
                            patientName: row?.patientName,
                            patientCode: String(row?.patientName || "").split(" - ")[0] || "",
                          });
                        }
                        }}
                      >
                        <div className="workflow-waiting-copy">
                          <strong>{String(row?.patientName || "Queued patient")}</strong>
                          <span className="workflow-waiting-meta"><b>{String(row?.tokenNumber || "No token")}</b><em>{String(row?.priority || "GENERAL")}</em><i>{String(row?.status || "WAITING")}</i></span>
                          <small className="workflow-waiting-source">Queued from: {String(row?.source || row?.queueSource || row?.notes || "another module").replace(/^Queued from\s+/i, "")}</small>
                        </div>
                      </button>
                      <div className="workflow-waiting-actions">
                        <button
                          type="button"
                          className="patient-search-checkin workflow-waiting-checkin"
                          disabled={waitingCheckInId === actionKey}
                          onClick={() => void (checkedIn ? checkOutQueuedPatient(row) : checkInQueuedPatient(row, waitingCheckInDate))}
                        >
                          {waitingCheckInId === actionKey ? "Updating..." : checkedIn ? "Check out" : "Check in"}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </aside>
        </div>
      ) : null}

      {activeForm ? (
        <div className="module-form-overlay">
          <div
            className={`module-form-panel modal-panel module-form-panel-${moduleKey} ${getActiveFormModeClass(activeForm.title)}`}
            style={{
              "--module-form-accent": activeForm.accentColor || "#16a34a",
              "--module-form-accent-dark": activeForm.accentColor || "#15803d",
              "--module-form-accent-soft": `${activeForm.accentColor || "#16a34a"}22`,
            } as any}
          >
            <div className="module-form-header">
              <div className="module-form-heading">
                <div className="module-form-icon">
                  <ModuleIcon name={getActiveFormIcon(activeForm.title)} />
                </div>
                <div>
                  <div className="module-form-kicker">{title}</div>
                  <h2 className="module-form-title">{activeForm.title}</h2>
                </div>
              </div>
              <div className="module-form-header-actions">
                <div className="module-form-meta">
                  <span>{activeForm.fields.length} fields</span>
                  <span>{requiredFieldCount} required</span>
                </div>
                <button
                  onClick={() => setActiveForm(null)}
                  className="modal-close-btn"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="module-form-intro">
              <div>
                {activeForm.description ? (
                  <p className="module-form-note">
                    {activeForm.description}
                  </p>
                ) : null}
              </div>
            </div>

            <form onSubmit={handleFormSubmit} className="module-form-body">
              <div className="module-form-grid">
                {activeForm.fields.map((field) => {
                  const wide =
                    field.type === "textarea" ||
                    field.type === "file" ||
                    ((field.type === "checkbox" || field.type === "radio") &&
                      Array.isArray(field.options) &&
                      field.options.length > 0);
                  return (
                    <div key={field.name} className={`module-form-field ${wide ? "is-wide" : ""}`}>
                      <label className="form-label">
                        {field.label}
                        {field.required ? <span className="module-form-required">*</span> : null}
                      </label>
                      {field.helper ? (
                        <div className="form-helper">{field.helper}</div>
                      ) : null}
                      {renderFieldInput(field)}
                    </div>
                  );
                })}
              </div>
              <div className="module-form-footer">
                <button
                  type="button"
                  onClick={() => setActiveForm(null)}
                  className="form-btn form-btn-cancel"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="form-btn form-btn-primary module-form-submit"
                  disabled={submitting}
                >
                  {submitting ? "Saving..." : getSubmitLabel(activeForm.title)}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {toast ? (
        <div className={`module-toast ${["ehr", "ot", "maternity"].includes(moduleKey) ? "module-toast-classic" : ""}`} role="status" aria-live="polite">
          <span className="module-toast-mark" aria-hidden="true">✓</span>
          <span className="module-toast-message">{toast}</span>
          <button type="button" className="module-toast-close" onClick={() => setToast(null)} aria-label="Dismiss notification">×</button>
        </div>
      ) : null}
    </div>
  );
}
