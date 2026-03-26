import React from "react";
import {
  migrationDryRun,
  migrationGetErrors,
  migrationGetMappings,
  type MigrationMappingRow,
  type MigrationEntity,
  migrationListRuns,
  migrationReplaceMappings,
  migrationRun,
  migrationSuggestMappings,
  migrationUpload,
  type MigrationStagingResult,
  type MigrationDryRunResult,
} from "../lib/apiClient";

const TRANSFORMS = [
  { value: "", label: "None" },
  { value: "trim", label: "trim" },
  { value: "uppercase", label: "uppercase" },
  { value: "lowercase", label: "lowercase" },
  { value: "normalize_phone", label: "normalize_phone" },
  { value: "map_gender", label: "map_gender" },
  { value: "format_date", label: "format_date" },
  { value: "format_datetime", label: "format_datetime" },
  { value: "split_name", label: "split_name" },
] as const;

const TARGET_FIELDS: Record<MigrationEntity, string[]> = {
  PATIENTS: [
    "firstName",
    "lastName",
    "gender",
    "dateOfBirth",
    "phone",
    "email",
    "address",
    "nationalId",
    "bloodGroup",
    "allergies",
    "nextOfKinName",
    "nextOfKinPhone",
    "insuranceNumber",
    "insuranceProvider",
    "patientCode",
    "__source_id",
  ],
  VISITS: [
    "visitType",
    "visitDate",
    "status",
    "doctorId",
    "doctorEmail",
    "__source_id",
    "__patient_source_id",
    "__patient_code",
    "__patient_national_id",
    "__patient_email",
    "__patient_phone",
  ],
  PRESCRIPTIONS: [
    "medication",
    "dosage",
    "frequency",
    "duration",
    "notes",
    "status",
    "doctorId",
    "doctorEmail",
    "__source_id",
    "__visit_source_id",
    "__visit_id",
    "__patient_source_id",
    "__patient_code",
    "__patient_national_id",
    "__patient_email",
    "__patient_phone",
  ],
};

const requiredTargets = (entity: MigrationEntity) => {
  if (entity === "PATIENTS") return ["firstName", "lastName", "gender", "dateOfBirth"];
  if (entity === "VISITS") return ["visitType", "visitDate"];
  return ["medication", "dosage", "frequency", "duration"];
};

const hasAnyTarget = (rows: MigrationMappingRow[], targets: string[]) =>
  rows.some((r) => targets.includes(String(r.targetField || "").trim()));

const normalizeMappings = (rows: MigrationMappingRow[]) =>
  rows
    .map((m) => ({
      sourceField: String(m.sourceField || "").trim(),
      targetField: String(m.targetField || "").trim(),
      transformFunction: String(m.transformFunction || "").trim() || null,
      params: m.params ?? null,
    }))
    .filter((m) => m.sourceField && m.targetField);

export function MigrationCenterView() {
  const [entity, setEntity] = React.useState<MigrationEntity>("PATIENTS");
  const [file, setFile] = React.useState<File | null>(null);
  const [batchSize, setBatchSize] = React.useState<number>(500);

  const [busy, setBusy] = React.useState(false);
  const [notice, setNotice] = React.useState<string>("");
  const [error, setError] = React.useState<string>("");

  const [staged, setStaged] = React.useState<MigrationStagingResult | null>(null);
  const [dryRun, setDryRun] = React.useState<MigrationDryRunResult | null>(null);
  const [runResult, setRunResult] = React.useState<any>(null);
  const [failedRows, setFailedRows] = React.useState<Array<{ row: number; message: string }>>([]);

  const [mappings, setMappings] = React.useState<MigrationMappingRow[]>([]);
  const [mappingsDirty, setMappingsDirty] = React.useState(false);
  const [mappingsBusy, setMappingsBusy] = React.useState(false);

  const [recentRuns, setRecentRuns] = React.useState<any[]>([]);

  const canUpload = Boolean(file) && !busy;
  const canAct = Boolean(staged?.migrationId) && !busy;

  const loadRuns = React.useCallback(async () => {
    try {
      const rows = await migrationListRuns(20);
      setRecentRuns(rows);
    } catch {
      setRecentRuns([]);
    }
  }, []);

  React.useEffect(() => {
    void loadRuns();
  }, [loadRuns]);

  const resetState = () => {
    setStaged(null);
    setDryRun(null);
    setRunResult(null);
    setFailedRows([]);
    setMappings([]);
    setMappingsDirty(false);
    setNotice("");
    setError("");
  };

  const loadMappings = async (migrationId: string) => {
    setMappingsBusy(true);
    try {
      const rows = await migrationGetMappings(migrationId);
      setMappings(rows);
      setMappingsDirty(false);
    } finally {
      setMappingsBusy(false);
    }
  };

  const resetToSuggested = async (migrationId: string) => {
    setMappingsBusy(true);
    try {
      await migrationSuggestMappings(migrationId);
      await loadMappings(migrationId);
    } finally {
      setMappingsBusy(false);
    }
  };

  const saveMappings = async () => {
    if (!staged?.migrationId) return;
    setMappingsBusy(true);
    setError("");
    setNotice("");
    try {
      await migrationReplaceMappings(staged.migrationId, normalizeMappings(mappings));
      await loadMappings(staged.migrationId);
      setNotice("Mappings saved.");
    } catch (e: any) {
      setError(String(e?.message || "Failed to save mappings"));
    } finally {
      setMappingsBusy(false);
    }
  };

  const upload = async () => {
    if (!file) return;
    setBusy(true);
    resetState();
    try {
      const stagedRes = await migrationUpload(entity, file);
      setStaged(stagedRes);
      await resetToSuggested(stagedRes.migrationId);
      setNotice("File staged successfully. Review mappings before running.");
      await loadRuns();
    } catch (e: any) {
      setError(String(e?.message || "Failed to stage file"));
    } finally {
      setBusy(false);
    }
  };

  const runDry = async () => {
    if (!staged?.migrationId) return;
    setBusy(true);
    setError("");
    setNotice("");
    setDryRun(null);
    try {
      const res = await migrationDryRun(staged.migrationId);
      setDryRun(res);
      if (res.invalid > 0) {
        setNotice("Dry-run completed. Fix mapping/data issues before running.");
      } else {
        setNotice("Dry-run passed. You can run the migration.");
      }
    } catch (e: any) {
      setError(String(e?.message || "Dry-run failed"));
    } finally {
      setBusy(false);
    }
  };

  const runMigration = async () => {
    if (!staged?.migrationId) return;
    const confirmed = window.confirm("Run migration now? This will insert records into HMIS.");
    if (!confirmed) return;
    setBusy(true);
    setError("");
    setNotice("");
    setRunResult(null);
    try {
      const res = await migrationRun(staged.migrationId, batchSize);
      setRunResult(res);
      setNotice("Migration started. Check recent runs for progress.");
      await loadRuns();
    } catch (e: any) {
      setError(String(e?.message || "Failed to start migration"));
    } finally {
      setBusy(false);
    }
  };

  const loadErrors = async () => {
    if (!staged?.migrationId) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const rows = await migrationGetErrors(staged.migrationId, 200);
      setFailedRows(
        rows.map((r: any) => ({
          row: Number(r.sourceRow || 0),
          message: String(r.error || ""),
        })),
      );
      if (rows.length === 0) setNotice("No failed rows yet.");
    } catch (e: any) {
      setError(String(e?.message || "Failed to load errors"));
    } finally {
      setBusy(false);
    }
  };

  const missingRequired = staged
    ? requiredTargets(staged.entity).filter(
        (t) => !mappings.some((m) => String(m.targetField || "").trim() === t),
      )
    : [];

  const missingVisitLink =
    staged?.entity === "PRESCRIPTIONS" &&
    !hasAnyTarget(mappings, ["__visit_source_id", "__visit_id"]);

  const missingPatientIdentifier =
    staged?.entity === "VISITS" &&
    !hasAnyTarget(mappings, [
      "__patient_source_id",
      "__patient_code",
      "__patient_national_id",
      "__patient_email",
      "__patient_phone",
    ]);

  return (
    <div className="migration-view">
      <div className="pv-header">
        <div>
          <h2 className="pv-title">Migration Center</h2>
          <p className="pv-subtitle">
            Safe staging → mapping → validation → batch insert (no direct writes from uploads).
          </p>
        </div>
        <button type="button" className="btn-cancel" onClick={loadRuns} disabled={busy}>
          Refresh runs
        </button>
      </div>

      {notice ? <div className="workflow-notice is-success">{notice}</div> : null}
      {error ? <div className="workflow-notice is-danger">{error}</div> : null}

      <div className="settings-grid migration-grid">
        <section className="settings-card">
          <h3 className="settings-card-title">1) Upload to staging</h3>

          <label className="settings-label">Dataset</label>
          <select
            className="mig-input"
            value={entity}
            onChange={(e) => {
              setEntity(e.target.value as MigrationEntity);
              resetState();
              setFile(null);
            }}
            disabled={busy}
          >
            <option value="PATIENTS">Patients</option>
            <option value="VISITS">Visits</option>
            <option value="PRESCRIPTIONS">Prescriptions</option>
          </select>

          <label className="settings-label" style={{ marginTop: 12 }}>
            File (CSV / Excel / JSON)
          </label>
          <input
            className="mig-file"
            type="file"
            accept=".csv,.xlsx,.xls,.json,text/csv,application/json,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
            onChange={(e) => {
              resetState();
              setFile(e.target.files?.[0] || null);
            }}
            disabled={busy}
          />

          <div className="mig-row" style={{ marginTop: 12 }}>
            <label className="mig-inline">
              <span className="settings-label">Batch size</span>
              <input
                className="mig-input mig-number"
                type="number"
                min={100}
                max={1000}
                value={batchSize}
                onChange={(e) => {
                  const v = Number(e.target.value || 500);
                  setBatchSize(Math.max(100, Math.min(1000, Number.isFinite(v) ? v : 500)));
                }}
                disabled={busy}
              />
            </label>
            <button type="button" className="btn-primary" onClick={upload} disabled={!canUpload}>
              {busy ? "Working..." : "Upload to Staging"}
            </button>
          </div>

          {staged ? (
            <div className="mig-summary">
              <div className="mig-chip">Entity: {staged.entity}</div>
              <div className="mig-chip">Total: {staged.totalRecords}</div>
              <div className="mig-chip mig-chip-good">Staged: {staged.stagedRecords}</div>
              <div className="mig-chip">Run: {staged.migrationId.slice(0, 8)}…</div>
            </div>
          ) : null}
        </section>

        <section className="settings-card" style={{ gridColumn: "1 / -1" }}>
          <h3 className="settings-card-title">2) Field Mapping Editor</h3>
          <p className="mig-hint">
            Map your source fields to MediLink fields. Save mappings before dry-run/run.
          </p>

          {!staged ? (
            <div className="pv-empty">Upload a file to start editing mappings.</div>
          ) : (
            <>
              <div className="mig-row">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => resetToSuggested(staged.migrationId)}
                  disabled={!canAct || mappingsBusy}
                >
                  Reset to Suggested
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={saveMappings}
                  disabled={!canAct || mappingsBusy || !mappingsDirty}
                >
                  {mappingsBusy ? "Saving..." : "Save Mappings"}
                </button>
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => {
                    setMappings((prev) => [
                      ...prev,
                      { sourceField: "", targetField: "", transformFunction: "", params: null },
                    ]);
                    setMappingsDirty(true);
                  }}
                  disabled={!canAct || mappingsBusy}
                >
                  + Add row
                </button>
              </div>

              <div className="mig-warnings">
                {missingRequired.length > 0 ? (
                  <div className="workflow-notice is-danger">
                    Missing required target fields: {missingRequired.join(", ")}
                  </div>
                ) : (
                  <div className="workflow-notice is-success">Required fields mapped.</div>
                )}
                {missingPatientIdentifier ? (
                  <div className="workflow-notice is-danger">
                    VISITS require at least one patient identifier mapping (e.g. __patient_source_id or
                    __patient_national_id).
                  </div>
                ) : null}
                {missingVisitLink ? (
                  <div className="workflow-notice is-danger">
                    PRESCRIPTIONS require a visit link mapping (__visit_source_id or __visit_id).
                  </div>
                ) : null}
              </div>

              <div className="pv-table-wrap mig-table-wrap">
                <table className="pv-table mig-table">
                  <thead>
                    <tr>
                      <th>Source field</th>
                      <th>Target field</th>
                      <th>Transform</th>
                      <th>Params</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {mappings.length === 0 ? (
                      <tr>
                        <td className="pv-empty" colSpan={5}>
                          No mappings yet. Click “Reset to Suggested”.
                        </td>
                      </tr>
                    ) : null}
                    {mappings.map((row, idx) => {
                      const transform = String(row.transformFunction || "");
                      const needsSplit = transform === "split_name";
                      const splitPart = String((row.params as any)?.part || "first");
                      return (
                        <tr key={row.id || idx}>
                          <td>
                            <input
                              className="mig-input mig-table-input"
                              list="mig-headers"
                              value={String(row.sourceField || "")}
                              onChange={(e) => {
                                const next = [...mappings];
                                next[idx] = { ...next[idx], sourceField: e.target.value };
                                setMappings(next);
                                setMappingsDirty(true);
                              }}
                              placeholder="e.g. first_name"
                              disabled={mappingsBusy}
                            />
                          </td>
                          <td>
                            <input
                              className="mig-input mig-table-input"
                              list="mig-targets"
                              value={String(row.targetField || "")}
                              onChange={(e) => {
                                const next = [...mappings];
                                next[idx] = { ...next[idx], targetField: e.target.value };
                                setMappings(next);
                                setMappingsDirty(true);
                              }}
                              placeholder="e.g. firstName"
                              disabled={mappingsBusy}
                            />
                          </td>
                          <td>
                            <select
                              className="mig-input mig-table-input"
                              value={transform}
                              onChange={(e) => {
                                const value = e.target.value;
                                const next = [...mappings];
                                next[idx] = {
                                  ...next[idx],
                                  transformFunction: value,
                                  params: value === "split_name" ? { part: "first" } : null,
                                };
                                setMappings(next);
                                setMappingsDirty(true);
                              }}
                              disabled={mappingsBusy}
                            >
                              {TRANSFORMS.map((t) => (
                                <option key={t.value} value={t.value}>
                                  {t.label}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td>
                            {needsSplit ? (
                              <select
                                className="mig-input mig-table-input"
                                value={splitPart}
                                onChange={(e) => {
                                  const next = [...mappings];
                                  next[idx] = { ...next[idx], params: { part: e.target.value } };
                                  setMappings(next);
                                  setMappingsDirty(true);
                                }}
                                disabled={mappingsBusy}
                              >
                                <option value="first">first</option>
                                <option value="last">last</option>
                              </select>
                            ) : (
                              <span style={{ color: "#94a3b8", fontStyle: "italic" }}>—</span>
                            )}
                          </td>
                          <td style={{ width: 92 }}>
                            <button
                              type="button"
                              className="btn-danger mig-remove"
                              onClick={() => {
                                setMappings((prev) => prev.filter((_, i) => i !== idx));
                                setMappingsDirty(true);
                              }}
                              disabled={mappingsBusy}
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <datalist id="mig-headers">
                {(staged.headers || []).map((h) => (
                  <option key={h} value={h} />
                ))}
              </datalist>
              <datalist id="mig-targets">
                {(TARGET_FIELDS[staged.entity] || []).map((t) => (
                  <option key={t} value={t} />
                ))}
              </datalist>
            </>
          )}
        </section>

        <section className="settings-card">
          <h3 className="settings-card-title">3) Dry-run & Run</h3>
          <p className="mig-hint">Dry-run validates formats + foreign keys. Run inserts in batches.</p>

          <div className="mig-row">
            <button type="button" className="btn-cancel" onClick={runDry} disabled={!canAct}>
              Dry-run Validate
            </button>
            <button type="button" className="btn-primary" onClick={runMigration} disabled={!canAct}>
              Run Migration
            </button>
            <button type="button" className="btn-cancel" onClick={loadErrors} disabled={!canAct}>
              View Failed Rows
            </button>
          </div>

          {dryRun ? (
            <div className="mig-summary" style={{ marginTop: 12 }}>
              <div className="mig-chip">Checked: {dryRun.totalChecked}</div>
              <div className="mig-chip mig-chip-good">Valid: {dryRun.valid}</div>
              <div className="mig-chip mig-chip-bad">Invalid: {dryRun.invalid}</div>
            </div>
          ) : null}

          {dryRun?.sampleErrors?.length ? (
            <div className="mig-errors">
              <p style={{ fontWeight: 800, marginBottom: 6 }}>Sample issues</p>
              <ul>
                {dryRun.sampleErrors.slice(0, 10).map((e, i) => (
                  <li key={i}>
                    Row {e.row}: {e.message}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {runResult ? (
            <div className="mig-hint" style={{ marginTop: 10 }}>
              {runResult.queued
                ? `Queued job ${String(runResult.jobId || "")}`.trim()
                : "Migration started."}
            </div>
          ) : null}

          {failedRows.length > 0 ? (
            <div className="mig-errors">
              <p style={{ fontWeight: 800, marginBottom: 6 }}>Failed rows (first 10)</p>
              <ul>
                {failedRows.slice(0, 10).map((e, i) => (
                  <li key={i}>
                    Row {e.row}: {e.message}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>

        <section className="settings-card">
          <h3 className="settings-card-title">Recent runs</h3>
          {recentRuns.length === 0 ? (
            <div className="pv-empty">No runs yet.</div>
          ) : (
            <div className="mig-runs">
              {recentRuns.map((r) => (
                <div key={r.id} className="mig-run-card">
                  <div className="mig-run-title">
                    <strong>{String(r.entity || "—")}</strong> • {String(r.status || "—")}
                  </div>
                  <div className="mig-run-sub">
                    {String(r.originalFilename || "—")} ({String(r.fileType || "—")})
                  </div>
                  <div className="mig-run-meta">
                    Staged {Number(r.stagedRecords || 0)} • Processed{" "}
                    {Number(r.processedRecords || 0)} • Failed {Number(r.failedRecords || 0)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

