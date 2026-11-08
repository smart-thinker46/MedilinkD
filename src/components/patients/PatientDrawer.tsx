import { useEffect, useMemo, useState } from "react";
import {
  X,
  User,
  HeartPulse,
  Calendar,
  Phone,
  FileText,
  Shield,
  AlertTriangle,
  Lock,
  Edit2,
  MapPin,
  IdCard,
} from "lucide-react";
import { apiFetch } from "../../lib/apiClient";

interface PatientDrawerProps {
  patient: any;
  queueContext?: any;
  canEdit?: boolean;
  onClose: () => void;
  onEdit: () => void;
  onCheckIn?: (checkInDate: string) => void;
  checkInLabel?: string;
}

function InfoRow({ label, value }: { label: string; value?: any }) {
  if (value === null || value === undefined || value === "") return null;
  const isMasked =
    typeof value === "string" && (value.includes("•") || value.includes("●"));
  return (
    <div className="patient-drawer-info-row">
      <span>{label}</span>
      <strong>
        {value}
        {isMasked ? (
          <Lock style={{ width: "0.875rem", height: "0.875rem", display: "inline", verticalAlign: "middle", opacity: 0.5 }} />
        ) : null}
      </strong>
    </div>
  );
}

const resolveDateValue = (value: unknown) => {
  if (value instanceof Date) return Number.isFinite(value.getTime()) ? value : null;
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  // Date-only values must be parsed as local dates to avoid timezone shifts.
  const dateOnly = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnly) {
    const local = new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]));
    return Number.isFinite(local.getTime()) ? local : null;
  }
  const parsed = new Date(raw);
  return Number.isFinite(parsed.getTime()) ? parsed : null;
};

const patientDateOfBirth = (patient: any) =>
  patient?.dateOfBirth ?? patient?.date_of_birth ?? patient?.dob ?? null;

const formatDateOfBirth = (value: unknown) => {
  const date = resolveDateValue(value);
  return date ? date.toLocaleDateString() : "—";
};

const formatQueueDateTime = (value: unknown) => {
  const date = resolveDateValue(value);
  return date ? date.toLocaleString() : "—";
};

function calcAge(dob: unknown) {
  const date = resolveDateValue(dob);
  if (!date) return "—";
  const now = new Date();
  let years = now.getFullYear() - date.getFullYear();
  const beforeBirthday =
    now.getMonth() < date.getMonth() ||
    (now.getMonth() === date.getMonth() && now.getDate() < date.getDate());
  if (beforeBirthday) years -= 1;
  return years >= 0 ? `${years} years` : "—";
}

export function PatientDrawer({
  patient,
  queueContext,
  canEdit = false,
  onClose,
  onEdit,
  onCheckIn,
  checkInLabel = "Check In Patient",
}: PatientDrawerProps) {
  const [details, setDetails] = useState<any>(patient);
  const [currentRole, setCurrentRole] = useState("");
  const [breakGlassEntries, setBreakGlassEntries] = useState<any[]>([]);
  const [breakGlassError, setBreakGlassError] = useState("");
  const [breakGlassNotice, setBreakGlassNotice] = useState("");
  const [breakGlassLoading, setBreakGlassLoading] = useState(false);
  const [breakGlassOpen, setBreakGlassOpen] = useState(false);
  const [breakGlassReason, setBreakGlassReason] = useState("Emergency treatment");
  const [breakGlassJustification, setBreakGlassJustification] = useState("");
  const [breakGlassSubmitting, setBreakGlassSubmitting] = useState(false);
  const [breakGlassRevoking, setBreakGlassRevoking] = useState(false);
  const [checkInDate, setCheckInDate] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  });

  useEffect(() => {
    setDetails(patient);
  }, [patient]);

  useEffect(() => {
    if (!patient?.id) return;
    let cancelled = false;
    const load = async () => {
      try {
        const res = await apiFetch(`/patients/${patient.id}`);
        const data = await res.json();
        if (!cancelled) {
          setDetails(data?.data ?? data ?? patient);
        }
      } catch {
        // ignore fallback
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [patient?.id]);

  useEffect(() => {
    let cancelled = false;
    const loadCurrentRole = async () => {
      try {
        const res = await apiFetch("/security/me");
        const data = await res.json();
        const role = String(data?.role || "").trim().toLowerCase();
        if (!cancelled) {
          setCurrentRole(role);
        }
      } catch {
        if (!cancelled) {
          setCurrentRole("");
        }
      }
    };
    void loadCurrentRole();
    return () => {
      cancelled = true;
    };
  }, []);

  const loadBreakGlass = async () => {
    setBreakGlassError("");
    setBreakGlassLoading(true);
    try {
      const res = await apiFetch("/security/break-glass/active");
      const data = await res.json();
      const rows = Array.isArray(data) ? data : data?.data || [];
      setBreakGlassEntries(rows);
    } catch (err: any) {
      setBreakGlassError(String(err?.message || "Unable to check break-glass access."));
      setBreakGlassEntries([]);
    } finally {
      setBreakGlassLoading(false);
    }
  };

  useEffect(() => {
    if (!patient?.id) return;
    void loadBreakGlass();
  }, [patient?.id]);

  const activeBreakGlass = useMemo(() => {
    return breakGlassEntries.find((entry) => entry.patientId === details?.id);
  }, [breakGlassEntries, details?.id]);

  const canRevokeBreakGlass = useMemo(() => {
    const adminRoles = new Set(["medical_director", "hospital_admin", "super_admin"]);
    return adminRoles.has(String(currentRole || "").toLowerCase());
  }, [currentRole]);

  const isMasked = (value: any) =>
    typeof value === "string" && (value.includes("•") || value.includes("●"));

  const maskedFields = useMemo(() => {
    if (!details) return false;
    const values = [
      details.phone,
      details.phonePrimary,
      details.phoneSecondary,
      details.email,
      details.nationalId,
      details.idNumber,
      details.address,
      details.addressLine1,
      details.insuranceNumber,
      details.nhifNumber,
      details.shaNumber,
      details.nextOfKinPhone,
    ];
    return values.some((value) => isMasked(value));
  }, [details]);

  const submitBreakGlass = async () => {
    if (!details?.id) return;
    setBreakGlassSubmitting(true);
    setBreakGlassError("");
    setBreakGlassNotice("");
    try {
      await apiFetch("/security/break-glass", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: details.id,
          reason: breakGlassReason,
          justification: breakGlassJustification,
        }),
      });
      await loadBreakGlass();
      try {
        const res = await apiFetch(`/patients/${details.id}`);
        const data = await res.json();
        setDetails(data?.data ?? data ?? details);
      } catch {
        // ignore
      }
      setBreakGlassOpen(false);
      setBreakGlassJustification("");
      setBreakGlassNotice("Break-glass access granted.");
    } catch (err: any) {
      setBreakGlassError(String(err?.message || "Failed to request break-glass access."));
    } finally {
      setBreakGlassSubmitting(false);
    }
  };

  const revokeBreakGlass = async () => {
    if (!details?.id || !canRevokeBreakGlass) return;
    const confirmed = window.confirm(
      "Revoke active break-glass access for this patient? This action is logged for audit.",
    );
    if (!confirmed) return;
    setBreakGlassRevoking(true);
    setBreakGlassError("");
    setBreakGlassNotice("");
    try {
      const res = await apiFetch("/security/break-glass/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId: details.id }),
      });
      const data = await res.json();
      const revokedCount = Number(data?.revoked ?? 0);
      await loadBreakGlass();
      try {
        const pRes = await apiFetch(`/patients/${details.id}`);
        const pData = await pRes.json();
        setDetails(pData?.data ?? pData ?? details);
      } catch {
        // ignore
      }
      setBreakGlassNotice(
        revokedCount > 0
          ? `Break-glass access revoked (${revokedCount}).`
          : "No active break-glass access found to revoke.",
      );
    } catch (err: any) {
      setBreakGlassError(String(err?.message || "Failed to revoke break-glass access."));
    } finally {
      setBreakGlassRevoking(false);
    }
  };

  if (!patient) return null;
  const queue = queueContext || {};
  const fallbackQueueName = String(queue.patientName || "").replace(/^([^\s]+)\s-\s/, "").trim();
  const fullName =
    [details?.firstName, details?.middleName, details?.lastName].filter(Boolean).join(" ") ||
    fallbackQueueName;

  return (
    <>
      {/* Backdrop */}
      <div className="patient-drawer-backdrop" onClick={onClose} />

      {/* Drawer */}
      <div className="patient-drawer-shell">
        {/* Header */}
        <div className="patient-drawer-header">
          <div className="patient-drawer-head-row">
            <div className="patient-drawer-identity">
              <div className="patient-drawer-avatar">
                {details?.firstName?.[0]}
                {details?.lastName?.[0]}
              </div>
              <div>
                <p className="patient-drawer-kicker">Patient Profile</p>
                <h2>{fullName || "Unnamed Patient"}</h2>
                <p className="patient-drawer-mrn">
                  #{details?.patientCode || details?.id?.substring(0, 8).toUpperCase()}
                </p>
                <div className="patient-drawer-tags">
                  <span
                    className={`patient-drawer-tag ${
                      details?.gender === "MALE"
                        ? "is-male"
                        : details?.gender === "FEMALE"
                        ? "is-female"
                        : "is-neutral"
                    }`}
                  >
                    {details?.gender}
                  </span>
                  {details?.bloodGroup && (
                    <span className="patient-drawer-tag is-blood">{details?.bloodGroup}</span>
                  )}
                  <span
                    className={`patient-drawer-tag ${
                      canEdit ? "is-checked-in" : "is-not-checked-in"
                    }`}
                  >
                    {canEdit ? "Checked in" : "Not checked in"}
                  </span>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="patient-drawer-close">
              <X style={{ width: "1.25rem", height: "1.25rem" }} />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="patient-drawer-body">
          {activeBreakGlass ? (
            <div className="patient-drawer-alert is-success">
              <Shield style={{ width: "1rem", height: "1rem", marginTop: "0.125rem" }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>Break-glass access active</div>
                <div style={{ fontSize: "0.75rem", opacity: 0.8 }}>
                  Expires {new Date(activeBreakGlass.expiresAt).toLocaleString()}
                </div>
              </div>
              {canRevokeBreakGlass ? (
                <button
                  type="button"
                  style={{
                    padding: "0.375rem 0.75rem",
                    borderRadius: "0.5rem",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    background: "#047857",
                    color: "#fff",
                    border: "none",
                    cursor: "pointer",
                    opacity: breakGlassRevoking ? 0.7 : 1,
                  }}
                  onClick={revokeBreakGlass}
                  disabled={breakGlassRevoking}
                >
                  {breakGlassRevoking ? "Revoking..." : "Revoke Access"}
                </button>
              ) : null}
            </div>
          ) : null}

          {maskedFields && !activeBreakGlass ? (
            <div className="patient-drawer-alert is-warning">
              <AlertTriangle style={{ width: "1rem", height: "1rem", marginTop: "0.125rem" }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>Sensitive data masked</div>
                <div style={{ fontSize: "0.75rem", opacity: 0.8 }}>
                  Request break-glass access to view protected identifiers.
                </div>
              </div>
              <button
                type="button"
                style={{
                  padding: "0.375rem 0.75rem",
                  borderRadius: "0.5rem",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  background: "#d97706",
                  color: "#fff",
                  border: "none",
                  cursor: "pointer",
                }}
                onClick={() => setBreakGlassOpen(true)}
              >
                Request Access
              </button>
            </div>
          ) : null}

          {canRevokeBreakGlass && !activeBreakGlass ? (
            <div className="patient-drawer-alert">
              <Shield style={{ width: "1rem", height: "1rem", marginTop: "0.125rem" }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>Admin break-glass control</div>
                <div style={{ fontSize: "0.75rem", opacity: 0.8 }}>
                  Revoke any active break-glass access for this patient.
                </div>
              </div>
              <button
                type="button"
                style={{
                  padding: "0.375rem 0.75rem",
                  borderRadius: "0.5rem",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  background: "#334155",
                  color: "#fff",
                  border: "none",
                  cursor: "pointer",
                  opacity: breakGlassRevoking ? 0.7 : 1,
                }}
                onClick={revokeBreakGlass}
                disabled={breakGlassRevoking}
              >
                {breakGlassRevoking ? "Revoking..." : "Revoke Access"}
              </button>
            </div>
          ) : null}

          {breakGlassError ? (
            <div className="patient-drawer-message is-error">{breakGlassError}</div>
          ) : null}
          {breakGlassNotice ? (
            <div className="patient-drawer-message is-success">{breakGlassNotice}</div>
          ) : null}

          {/* Personal Info */}
          <section className="patient-drawer-card">
            <h3>
              <User style={{ width: "0.875rem", height: "0.875rem" }} />
              Personal Information
            </h3>
            <div className="patient-drawer-info-list">
              <InfoRow label="Age" value={calcAge(patientDateOfBirth(details))} />
              <InfoRow
                label="Date of Birth"
                value={formatDateOfBirth(patientDateOfBirth(details))}
              />
              <InfoRow label="Phone" value={details?.phone || details?.phonePrimary} />
              <InfoRow label="Email" value={details?.email} />
              <InfoRow label="National ID" value={details?.nationalId || details?.idNumber} />
              <InfoRow label="Address" value={details?.address || details?.addressLine1} />
            </div>
          </section>

          <section className="patient-drawer-summary">
            <div>
              <IdCard size={17} />
              <span>ID</span>
              <strong>{details?.nationalId || details?.idNumber || "Not captured"}</strong>
            </div>
            <div>
              <Phone size={17} />
              <span>Phone</span>
              <strong>{details?.phone || details?.phonePrimary || "Not captured"}</strong>
            </div>
            <div>
              <MapPin size={17} />
              <span>County</span>
              <strong>{details?.county || "Not captured"}</strong>
            </div>
          </section>

          {queueContext ? (
            <section className="patient-drawer-card queue-patient-context">
              <h3>
                <Calendar style={{ width: "0.875rem", height: "0.875rem" }} />
                Queue Details
              </h3>
              <div className="patient-drawer-info-list">
                <InfoRow label="Token" value={queue.tokenNumber || queue.queueToken} />
                <InfoRow label="Status" value={queue.status || queue.queueStatus} />
                <InfoRow label="Priority" value={queue.priority || queue.priorityLabel} />
                <InfoRow
                  label="Service"
                  value={
                    queue.queueLane ||
                    queue.queueService ||
                    queue.queueType ||
                    queue.departmentId
                  }
                />
                <InfoRow
                  label="Room / Counter"
                  value={queue.counterId || queue.room || queue.doctorName || "Not assigned"}
                />
                <InfoRow
                  label="Estimated wait"
                  value={
                    queue.estimatedWaitMinutes !== undefined
                      ? `${queue.estimatedWaitMinutes} minutes`
                      : undefined
                  }
                />
                <InfoRow
                  label="Position"
                  value={
                    queue.positionInWaiting
                      ? `${queue.positionInWaiting} in queue`
                      : undefined
                  }
                />
                <InfoRow
                  label="Issued"
                  value={formatQueueDateTime(queue.issuedAtIso || queue.issuedAt)}
                />
                <InfoRow
                  label="Called"
                  value={queue.calledAtIso ? formatQueueDateTime(queue.calledAtIso) : "Not called"}
                />
                <InfoRow
                  label="Last updated"
                  value={formatQueueDateTime(
                    queue.statusUpdatedAtIso || queue.updatedAt,
                  )}
                />
                <InfoRow label="Notes" value={queue.notes || queue.statusReason} />
              </div>
            </section>
          ) : null}

          {/* Medical Info */}
          <section className="patient-drawer-card">
            <h3>
              <HeartPulse style={{ width: "0.875rem", height: "0.875rem" }} />
              Medical Details
            </h3>
            <div className="patient-drawer-info-list">
              <InfoRow label="Blood Group" value={details?.bloodGroup} />
              <InfoRow label="Allergies" value={details?.allergies} />
              <InfoRow label="Insurance Provider" value={details?.insuranceProvider} />
              <InfoRow
                label="SHA / Insurance No."
                value={details?.insuranceNumber || details?.shaNumber}
              />
            </div>
          </section>

          {/* Next of Kin */}
          {(details?.nextOfKinName || details?.nextOfKinPhone) && (
            <section className="patient-drawer-card">
              <h3>
                <Phone style={{ width: "0.875rem", height: "0.875rem" }} />
                Next of Kin
              </h3>
              <div className="patient-drawer-info-list">
                <InfoRow label="Name" value={details?.nextOfKinName} />
                <InfoRow label="Phone" value={details?.nextOfKinPhone} />
              </div>
            </section>
          )}

          {/* Recent Visits */}
          <section className="patient-drawer-card">
            <h3>
              <Calendar style={{ width: "0.875rem", height: "0.875rem" }} />
              Recent Visits
            </h3>
            {details?.visits?.length > 0 ? (
              <div className="patient-drawer-visit-list">
                {details.visits.slice(0, 5).map((v: any) => (
                  <div key={v.id} className="patient-drawer-visit">
                    <div>
                      <p>{v.type || "General Visit"}</p>
                      <small>{new Date(v.createdAt).toLocaleDateString()}</small>
                    </div>
                    <span>{v.status || "ACTIVE"}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="patient-drawer-empty">
                <FileText
                  style={{
                    width: "2rem",
                    height: "2rem",
                    display: "block",
                    margin: "0 auto 0.5rem",
                    opacity: 0.2,
                  }}
                />
                <p>No visits recorded yet.</p>
              </div>
            )}
          </section>
        </div>

        {/* Footer actions */}
        <div className="patient-drawer-footer">
          {onCheckIn ? (
            <div className="patient-drawer-checkin-wrap">
              <label htmlFor="patient-check-in-date">Check-in date</label>
              <input
                id="patient-check-in-date"
                type="date"
                value={checkInDate}
                onChange={(event) => setCheckInDate(event.target.value)}
                className="patient-drawer-checkin-date"
                required
              />
              <button
                type="button"
                onClick={() => onCheckIn(checkInDate)}
                className="patient-drawer-checkin-btn"
                disabled={!checkInDate}
              >
                <User style={{ width: "1rem", height: "1rem" }} /> {checkInLabel}
              </button>
            </div>
          ) : null}
          <button
            onClick={canEdit ? onEdit : undefined}
            disabled={!canEdit}
            className="patient-drawer-edit-btn"
            title={canEdit ? "Edit checked-in patient" : "Check in this patient before editing"}
          >
            <Edit2 style={{ width: "1rem", height: "1rem" }} /> Edit Patient
          </button>
          <button onClick={onClose} className="patient-drawer-secondary-btn">
            Close
          </button>
        </div>
      </div>

      {breakGlassOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 60,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.4)",
            backdropFilter: "blur(4px)",
            padding: "1rem",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "28rem",
              borderRadius: "1rem",
              border: "1px solid var(--border, #e2e8f0)",
              background: "var(--card, #fff)",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
              padding: "1.5rem",
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
              <div>
                <h3 style={{ fontSize: "1.125rem", fontWeight: 700, margin: 0 }}>
                  Break-glass access
                </h3>
                <p style={{ fontSize: "0.75rem", opacity: 0.6, margin: "0.25rem 0 0" }}>
                  Emergency access is logged and reviewed.
                </p>
              </div>
              <button
                className="modal-close-btn"
                onClick={() => setBreakGlassOpen(false)}
                style={{ background: "none", border: "none", cursor: "pointer", padding: "0.25rem" }}
              >
                <X style={{ width: "1rem", height: "1rem" }} />
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <label style={{ fontSize: "0.75rem", fontWeight: 600, opacity: 0.7, display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                Reason
                <select
                  className="auth-input"
                  style={{ marginTop: "0.25rem" }}
                  value={breakGlassReason}
                  onChange={(e) => setBreakGlassReason(e.target.value)}
                >
                  <option>Emergency treatment</option>
                  <option>Life-threatening situation</option>
                  <option>Legal requirement</option>
                  <option>Coroner investigation</option>
                </select>
              </label>
              <label style={{ fontSize: "0.75rem", fontWeight: 600, opacity: 0.7, display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                Justification (min 50 characters)
                <textarea
                  className="auth-input"
                  style={{ marginTop: "0.25rem", minHeight: "110px" }}
                  value={breakGlassJustification}
                  onChange={(e) => setBreakGlassJustification(e.target.value)}
                  placeholder="Describe the clinical urgency requiring emergency access..."
                />
              </label>
            </div>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button
                style={{
                  flex: 1,
                  padding: "0.625rem",
                  border: "1px solid var(--border, #e2e8f0)",
                  borderRadius: "0.5rem",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  background: "transparent",
                  cursor: "pointer",
                }}
                onClick={() => setBreakGlassOpen(false)}
              >
                Cancel
              </button>
              <button
                style={{
                  flex: 1,
                  padding: "0.625rem",
                  background: "#d97706",
                  color: "#fff",
                  borderRadius: "0.5rem",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  border: "none",
                  cursor: "pointer",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                  opacity:
                    breakGlassSubmitting || breakGlassJustification.trim().length < 50
                      ? 0.6
                      : 1,
                }}
                onClick={submitBreakGlass}
                disabled={
                  breakGlassSubmitting || breakGlassJustification.trim().length < 50
                }
              >
                {breakGlassSubmitting ? "Requesting..." : "Confirm Access"}
              </button>
            </div>
            {breakGlassLoading ? (
              <div style={{ fontSize: "0.75rem", opacity: 0.6 }}>
                Checking access status...
              </div>
            ) : null}
          </div>
        </div>
      )}
    </>
  );
}
