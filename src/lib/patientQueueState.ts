export type PatientQueueStatus = {
  patientId: string;
  queueModule: string;
  departmentId?: string;
  tokenNumber?: string;
  checkedIn: boolean;
  checkedInAt?: string;
  updatedAt: string;
};

export const PATIENT_QUEUE_STATUS_STORAGE_KEY = "hmis_patient_queue_status";

export const readPatientQueueStatuses = (): Record<string, PatientQueueStatus> => {
  if (typeof window === "undefined") return {};
  try {
    const value = window.localStorage.getItem(PATIENT_QUEUE_STATUS_STORAGE_KEY);
    const parsed = value ? JSON.parse(value) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};

export const setPatientQueueStatus = (
  status: Omit<PatientQueueStatus, "updatedAt"> & { updatedAt?: string },
) => {
  if (typeof window === "undefined" || !status.patientId) return;
  const next = {
    ...readPatientQueueStatuses(),
    [status.patientId]: {
      ...status,
      updatedAt: status.updatedAt || new Date().toISOString(),
    },
  };
  window.localStorage.setItem(PATIENT_QUEUE_STATUS_STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent("hmis:patient-queue-status", { detail: next[status.patientId] }));
};
