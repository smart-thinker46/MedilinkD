
import { FormEvent, useEffect, useMemo, useState } from "react";
import { ModuleIcon } from "../components/layout/ModuleIcon";
import { api } from "../lib/api";
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";

const money = (value: unknown) =>
  `Ksh ${Number(value || 0).toLocaleString("en-KE", { maximumFractionDigits: 0 })}`;

const unwrap = (value: any) => value?.data?.data ?? value?.data ?? value ?? null;
const rowsFrom = (value: any): any[] => {
  const payload = unwrap(value);
  if (Array.isArray(payload)) return payload;
  return [payload?.items, payload?.rows, payload?.results, payload?.data].find(Array.isArray) || [];
};

const statusOptions = [
  "ALL",
  "DRAFT",
  "PENDING_PREAUTH",
  "SUBMITTED",
  "UNDER_REVIEW",
  "APPROVED",
  "REJECTED",
  "PARTIAL_PAYMENT",
  "PAID",
];

const initialClaim = {
  patientId: "",
  billId: "",
  provider: "SHA",
  policyNumber: "",
  claimAmount: "",
  diagnosisCodesVerified: false,
  procedureCodesVerified: false,
  documentsAttached: false,
  submitNow: true,
};

const initialPreauth = {
  claimId: "",
  patientId: "",
  procedureCode: "",
  procedureName: "",
  estimatedCost: "",
  urgency: "ROUTINE",
};

const initialPayment = {
  claimId: "",
  amount: "",
  method: "TRANSFER",
  referenceNumber: "",
  notes: "",
};

const initialCoverage = {
  patientId: "",
  provider: "SHA",
  policyNumber: "",
  schemeId: "",
  coverageType: "",
  expiryDate: "",
  employer: "",
  copayPercent: "",
  isPrincipal: true,
};

export default function InsuranceView() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [claims, setClaims] = useState<any[]>([]);
  const [preauths, setPreauths] = useState<any[]>([]);
  const [patientOptions, setPatientOptions] = useState<any[]>([]);
  const [billOptions, setBillOptions] = useState<any[]>([]);
  const [sourceErrors, setSourceErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [provider, setProvider] = useState("");
  const [selectedClaim, setSelectedClaim] = useState<any | null>(null);
  const [claimModal, setClaimModal] = useState(false);
  const [preauthModal, setPreauthModal] = useState(false);
  const [paymentModal, setPaymentModal] = useState(false);
  const [coverageModal, setCoverageModal] = useState(false);
  const [claimForm, setClaimForm] = useState(initialClaim);
  const [preauthForm, setPreauthForm] = useState(initialPreauth);
  const [paymentForm, setPaymentForm] = useState(initialPayment);
  const [coverageForm, setCoverageForm] = useState(initialCoverage);
  const [coverageResult, setCoverageResult] = useState<any>(null);
  const [coverageProfile, setCoverageProfile] = useState<any>(null);
  const [submitting, setSubmitting] = useState("");
  const [toast, setToast] = useState("");
  const [toastType, setToastType] = useState<"success" | "warning" | "error">("success");
  const [pollAlerts, setPollAlerts] = useState<any[]>([]);

  function showToast(message: string, type: "success" | "warning" | "error" = "success") {
    setToast(message);
    setToastType(type);
    window.setTimeout(() => setToast(""), type === "success" ? 2600 : 4200);
  }

  const loadData = async () => {
    setLoading(true);
    try {
      const results = await Promise.allSettled([
        api.get("/insurance/dashboard"),
        api.get("/insurance/claims", {
          params: {
            ...(status !== "ALL" ? { status } : {}),
            ...(provider.trim() ? { provider: provider.trim() } : {}),
            ...(search.trim() ? { search: search.trim() } : {}),
          },
        }),
        api.get("/insurance/pre-authorizations"),
        api.get("/tenant/patients", { params: { limit: 500 } }),
        api.get("/billing/bills", { params: { limit: 500 } }),
      ]);
      const labels = ["dashboard", "claims", "pre-authorisations", "patients", "invoices"];
      const failed = results.flatMap((result, index) => result.status === "rejected" ? [`${labels[index]}${result.reason?.response?.status ? ` (${result.reason.response.status})` : ""}`] : []);
      setSourceErrors(failed);
      const dashboardResult = results[0];
      const claimsResult = results[1];
      const preauthResult = results[2];
      const patientsResult = results[3];
      const billsResult = results[4];
      setDashboard(dashboardResult.status === "fulfilled" ? unwrap(dashboardResult.value) || null : null);
      const nextClaims = claimsResult.status === "fulfilled" ? rowsFrom(claimsResult.value) : [];
      setClaims(nextClaims);
      setSelectedClaim((current: any | null) =>
        current ? nextClaims.find((claim: any) => claim.id === current.id) || current : current,
      );
      setPreauths(preauthResult.status === "fulfilled" ? rowsFrom(preauthResult.value) : []);
      setPatientOptions(patientsResult.status === "fulfilled" ? rowsFrom(patientsResult.value) : []);
      setBillOptions(billsResult.status === "fulfilled" ? rowsFrom(billsResult.value) : []);
    } catch (err: any) {
      showToast(String(err?.response?.data?.message || err?.message || "Failed to load insurance data."), "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [status, provider]);

  const filteredClaims = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return claims;
    return claims.filter((claim) =>
      [
        claim.id,
        claim.claimNumber,
        claim.insurerClaimNumber,
        claim.patientId,
        claim.insuranceProvider,
        claim.policyNumber,
        claim.status,
      ]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [claims, search]);

  const stats = [
    { label: "Total Claims", value: dashboard?.totals?.totalClaims || claims.length, color: "#1e3a8a" },
    { label: "SHA / Insurer Pending", value: (dashboard?.totals?.submitted || 0) + (dashboard?.totals?.pending || 0), color: "#d97706" },
    { label: "Pre-Auth Open", value: dashboard?.totals?.openPreAuthorizations || 0, color: "#7c3aed" },
    { label: "Approved", value: dashboard?.totals?.approved || 0, color: "#16a34a" },
    { label: "Rejected", value: dashboard?.totals?.rejected || 0, color: "#dc2626" },
    { label: "Payments", value: dashboard?.totals?.paymentRecords || 0, color: "#2563eb" },
    { label: "Outstanding", value: money(dashboard?.totals?.outstandingAmount), color: "#0d9488" },
  ];

  const openClaimModal = (claim?: any) => {
    setClaimForm({
      ...initialClaim,
      patientId: claim?.patientId || "",
      billId: claim?.invoiceId && claim.invoiceId !== "UNKNOWN" ? claim.invoiceId : "",
      provider: claim?.insuranceProvider || "SHA",
      policyNumber: claim?.policyNumber || "",
      claimAmount: claim?.claimAmount ? String(claim.claimAmount) : "",
    });
    setClaimModal(true);
  };

  const openPreauthModal = (claim?: any) => {
    setPreauthForm({
      ...initialPreauth,
      claimId: claim?.id || "",
      patientId: claim?.patientId || "",
      estimatedCost: claim?.claimAmount ? String(claim.claimAmount) : "",
    });
    setPreauthModal(true);
  };

  const openPaymentModal = (claim?: any) => {
    const target = claim || selectedClaim;
    setPaymentForm({
      ...initialPayment,
      claimId: target?.id || "",
      amount: target?.outstanding ? String(target.outstanding) : target?.approvedAmount ? String(target.approvedAmount) : "",
    });
    setPaymentModal(true);
  };

  const openCoverageModal = (claim?: any) => {
    setCoverageForm({
      ...initialCoverage,
      patientId: claim?.patientId || selectedClaim?.patientId || "",
      provider: claim?.insuranceProvider || "SHA",
      policyNumber: claim?.policyNumber || "",
    });
    setCoverageResult(null);
    setCoverageProfile(null);
    setCoverageModal(true);
  };

  const verifyCoverage = async () => {
    if (!coverageForm.provider.trim() || !coverageForm.policyNumber.trim()) {
      showToast("Provider and policy/member number are required.", "warning");
      return;
    }
    setSubmitting("coverage-verify");
    try {
      const response = await api.post("/tenant/patients/insurance/eligibility", {
        provider: coverageForm.provider,
        policyNumber: coverageForm.policyNumber,
        expiryDate: coverageForm.expiryDate || undefined,
        visitType: coverageForm.coverageType || "OUTPATIENT",
      });
      setCoverageResult(unwrap(response));
      showToast("Eligibility verified against the configured payer gateway.", "success");
    } catch (err: any) {
      showToast(String(err?.response?.data?.message || err?.message || "Eligibility verification failed."), "error");
    } finally {
      setSubmitting("");
    }
  };

  const loadCoverageProfile = async () => {
    if (!coverageForm.patientId.trim()) {
      showToast("Patient ID is required to load coverage history.", "warning");
      return;
    }
    setSubmitting("coverage-load");
    try {
      const response = await api.get(`/insurance/patient/${encodeURIComponent(coverageForm.patientId.trim())}/profile`);
      const profile = unwrap(response);
      setCoverageProfile(profile);
      const active = profile?.activeInsurance;
      if (active) {
        setCoverageForm((current) => ({
          ...current,
          provider: active.provider || current.provider,
          policyNumber: active.policyNumber || current.policyNumber,
          schemeId: active.schemeId || current.schemeId,
          coverageType: active.coverageType || current.coverageType,
          expiryDate: active.expiryDate ? String(active.expiryDate).slice(0, 10) : current.expiryDate,
          employer: active.employer || current.employer,
          copayPercent: active.copayPercent == null ? current.copayPercent : String(active.copayPercent),
          isPrincipal: active.isPrincipal ?? current.isPrincipal,
        }));
      }
      showToast("Patient coverage profile loaded.", "success");
    } catch (err: any) {
      showToast(String(err?.response?.data?.message || err?.message || "Coverage profile could not be loaded."), "error");
    } finally {
      setSubmitting("");
    }
  };

  const saveCoverage = async () => {
    if (!coverageForm.patientId.trim() || !coverageForm.provider.trim()) {
      showToast("Patient ID and provider are required.", "warning");
      return;
    }
    setSubmitting("coverage-save");
    try {
      await api.post("/insurance/profile", {
        ...coverageForm,
        copayPercent: coverageForm.copayPercent === "" ? undefined : Number(coverageForm.copayPercent),
      });
      showToast("Patient insurance coverage saved.", "success");
      await loadCoverageProfile();
    } catch (err: any) {
      showToast(String(err?.response?.data?.message || err?.message || "Coverage could not be saved."), "error");
    } finally {
      setSubmitting("");
    }
  };

  const submitClaim = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting("claim");
    try {
      const response = await api.post("/insurance/claim", {
        ...claimForm,
        insuranceProvider: claimForm.provider,
        claimAmount: Number(claimForm.claimAmount),
        submitNow: false,
      });
      const claimId = response.data?.id;
      if (claimForm.submitNow && claimId) {
        await api.post(`/insurance/claim/${claimId}/submit`, {
          diagnosisCodesVerified: claimForm.diagnosisCodesVerified,
          procedureCodesVerified: claimForm.procedureCodesVerified,
          documentsAttached: claimForm.documentsAttached,
        });
      }
      showToast(claimForm.submitNow ? "Claim submitted electronically and acknowledged." : "Claim saved as draft.", "success");
      setClaimModal(false);
      setClaimForm(initialClaim);
      await loadData();
    } catch (err: any) {
      showToast(String(err?.response?.data?.message || err?.message || "Claim submission failed."), "error");
    } finally {
      setSubmitting("");
    }
  };

  const submitPreauth = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting("preauth");
    try {
      await api.post("/insurance/pre-authorization", {
        ...preauthForm,
        estimatedCost: Number(preauthForm.estimatedCost),
      });
      showToast("Pre-authorisation request submitted to insurer workflow.", "success");
      setPreauthModal(false);
      setPreauthForm(initialPreauth);
      await loadData();
    } catch (err: any) {
      showToast(String(err?.response?.data?.message || err?.message || "Pre-authorisation failed."), "error");
    } finally {
      setSubmitting("");
    }
  };

  const submitExistingClaim = async (claim: any) => {
    setSubmitting(`submit-${claim.id}`);
    try {
      const response = await api.post(`/insurance/claim/${claim.id}/submit`, {
        diagnosisCodesVerified: true,
        procedureCodesVerified: true,
        documentsAttached: true,
      });
      showToast(`Submitted. Tracking: ${response.data?.acknowledgement?.trackingNumber || "received"}`, "success");
      await loadData();
    } catch (err: any) {
      showToast(String(err?.response?.data?.message || err?.message || "Electronic submission failed."), "error");
    } finally {
      setSubmitting("");
    }
  };

  const updateClaimStatus = async (claim: any, nextStatus: string) => {
    const reason = nextStatus === "REJECTED" ? window.prompt("Rejection reason:") || "" : "";
    if (nextStatus === "REJECTED" && !reason.trim()) return;
    setSubmitting(`${nextStatus}-${claim.id}`);
    try {
      await api.patch(`/insurance/claim/${claim.id}/status`, {
        status: nextStatus,
        reason,
        approvedAmount: nextStatus === "APPROVED" ? claim.claimAmount : undefined,
      });
      showToast(`Claim moved to ${nextStatus}.`, nextStatus === "REJECTED" ? "warning" : "success");
      await loadData();
    } catch (err: any) {
      showToast(String(err?.response?.data?.message || err?.message || "Claim status update failed."), "error");
    } finally {
      setSubmitting("");
    }
  };

  const pollStatuses = async () => {
    setSubmitting("poll");
    try {
      const response = await api.post("/insurance/claims/poll-status", {
        provider: provider.trim(),
      });
      setPollAlerts(response.data?.alerts || []);
      showToast(
        `${response.data?.monitoredClaims || 0} claim(s) polled, ${response.data?.alertCount || response.data?.alerts?.length || 0} alert(s).`,
        response.data?.alerts?.length ? "warning" : "success",
      );
      await loadData();
    } catch (err: any) {
      showToast(String(err?.response?.data?.message || err?.message || "Claim status polling failed."), "error");
    } finally {
      setSubmitting("");
    }
  };

  const recordPayment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting("payment");
    try {
      if (!paymentForm.claimId.trim()) throw new Error("Claim ID is required.");
      await api.post(`/insurance/claim/${paymentForm.claimId}/payment`, {
        amount: Number(paymentForm.amount),
        method: paymentForm.method,
        referenceNumber: paymentForm.referenceNumber,
        notes: paymentForm.notes,
      });
      showToast("Insurer payment recorded and claim balance updated.", "success");
      setPaymentModal(false);
      setPaymentForm(initialPayment);
      await loadData();
    } catch (err: any) {
      showToast(String(err?.response?.data?.message || err?.message || "Payment recording failed."), "error");
    } finally {
      setSubmitting("");
    }
  };

  return (
    <div className="patients-view insurance-view">
      <header className="pv-header">
        <div>
          <h1 className="pv-title">Insurance Claims</h1>
          <p className="pv-subtitle">Electronic SHA and private insurer pre-authorisation, claim submission, and status monitoring.</p>
        </div>
        <div className="insurance-actions">
          <button className="insurance-btn is-muted" type="button" onClick={loadData}>Refresh</button>
          <button className="insurance-btn is-amber" type="button" disabled={submitting === "poll"} onClick={pollStatuses}>
            {submitting === "poll" ? "Polling..." : "Poll Status"}
          </button>
          <button className="insurance-btn is-purple" type="button" onClick={() => openPreauthModal(selectedClaim || undefined)}>
            <ModuleIcon name="shield" /> Pre-Auth Request
          </button>
          <button className="insurance-btn is-blue" type="button" onClick={() => openPaymentModal(selectedClaim || undefined)}>
            Record Payment
          </button>
          <button className="insurance-btn is-teal" type="button" onClick={() => openCoverageModal(selectedClaim || undefined)}>
            Coverage &amp; Eligibility
          </button>
          <button className="insurance-btn is-green" type="button" onClick={() => openClaimModal(selectedClaim || undefined)}>
            <ModuleIcon name="shield" /> New Claim
          </button>
        </div>
      </header>

      <section className="pv-stats insurance-stats">
        {stats.map((stat) => (
          <article key={stat.label} className="pv-stat-card" style={{ borderLeftColor: stat.color }}>
            <p className="pv-stat-label">{stat.label}</p>
            <p className="pv-stat-value">{stat.value}</p>
          </article>
        ))}
      </section>

      <section className="module-filter-panel insurance-filter">
        <label className="module-filter-field">
          <span>Search</span>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Claim, patient, SHA/private payer, policy..." />
        </label>
        <label className="module-filter-field">
          <span>Status</span>
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            {statusOptions.map((option) => <option key={option} value={option}>{option.replace("_", " ")}</option>)}
          </select>
        </label>
        <label className="module-filter-field">
          <span>Provider</span>
          <input value={provider} onChange={(event) => setProvider(event.target.value)} placeholder="SHA, Jubilee, AAR..." />
        </label>
      </section>

      {pollAlerts.length ? (
        <section className="insurance-alert-panel">
          <strong>Turnaround alerts</strong>
          {pollAlerts.slice(0, 4).map((alert) => (
            <span key={alert.claimId}>{alert.message} Claim {String(alert.claimId).slice(0, 8).toUpperCase()} is {alert.agingDays} days old.</span>
          ))}
        </section>
      ) : null}

      {sourceErrors.length ? (
        <section className="insurance-source-warning" role="status">
          <strong>Some insurance data sources need attention</strong>
          <span>{sourceErrors.join(", ")}. Available data remains visible; refresh after checking permissions or connectivity.</span>
        </section>
      ) : null}

      <main className="insurance-layout">
        <section className="pv-table-wrap insurance-table-wrap">
          <table className="pv-table">
            <thead>
              <tr>
                <th>Claim</th>
                <th>Patient</th>
                <th>Payer</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Age</th>
                <th>Tracking</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="pv-empty">Loading insurance claims...</td></tr>
              ) : filteredClaims.length === 0 ? (
                <tr><td colSpan={8} className="pv-empty">No insurance claims found.</td></tr>
              ) : filteredClaims.map((claim) => (
                <tr
                  key={claim.id}
                  className={`insurance-clickable-row${selectedClaim?.id === claim.id ? " is-selected" : ""}`}
                  tabIndex={0}
                  aria-selected={selectedClaim?.id === claim.id}
                  title="Click to view claim details"
                  onClick={() => setSelectedClaim(claim)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setSelectedClaim(claim);
                    }
                  }}
                >
                  <td className="pv-name">{String(claim.claimNumber || claim.id).slice(0, 12).toUpperCase()}</td>
                  <td>{claim.patientId}</td>
                  <td>{String(claim.insuranceProvider || "")}</td>
                  <td>{money(claim.claimAmount)}</td>
                  <td><span className={`insurance-status is-${String(claim.status).toLowerCase()}`}>{String(claim.status).replace("_", " ")}</span></td>
                  <td>{claim.agingDays || 0}d</td>
                  <td>{claim.insurerClaimNumber || "-"}</td>
                  <td>
                    <div className="insurance-row-actions" onClick={(event) => event.stopPropagation()}>
                      {["DRAFT", "PENDING"].includes(String(claim.status)) ? (
                        <button type="button" onClick={() => submitExistingClaim(claim)}>Submit</button>
                      ) : null}
                      <button type="button" onClick={() => openPreauthModal(claim)}>Pre-Auth</button>
                      {["UNDER_REVIEW", "SUBMITTED"].includes(String(claim.status)) ? (
                        <>
                          <button type="button" onClick={() => updateClaimStatus(claim, "APPROVED")}>Approve</button>
                          <button type="button" className="is-danger" onClick={() => updateClaimStatus(claim, "REJECTED")}>Reject</button>
                        </>
                      ) : null}
                      {["APPROVED", "PARTIAL_PAYMENT"].includes(String(claim.status)) ? (
                        <button type="button" onClick={() => openPaymentModal(claim)}>Payment</button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <aside className="insurance-detail">
          <div className="insurance-detail-head">
            <span>Selected Claim</span>
            <strong>{selectedClaim ? String(selectedClaim.id).slice(0, 8).toUpperCase() : "None"}</strong>
          </div>
          {selectedClaim ? (
            <>
              <div className="insurance-detail-grid">
                <span>Payer<strong>{String(selectedClaim.insuranceProvider || "")}</strong></span>
                <span>Status<strong>{String(selectedClaim.status).replace("_", " ")}</strong></span>
                <span>Claimed<strong>{money(selectedClaim.claimAmount)}</strong></span>
                <span>Approved<strong>{money(selectedClaim.approvedAmount)}</strong></span>
                <span>Paid<strong>{money(selectedClaim.totalPaid)}</strong></span>
                <span>Outstanding<strong>{money(selectedClaim.outstanding)}</strong></span>
              </div>
              <h3>Pre-Authorisations</h3>
              <div className="insurance-mini-list">
                {preauths.filter((row) => row.claimId === selectedClaim.id).slice(0, 4).map((row) => (
                  <p key={row.preAuthId || row.id}><strong>{row.status}</strong>{row.procedureName || row.procedureCode || "Procedure"} - {money(row.estimatedCost)}</p>
                ))}
                {!preauths.some((row) => row.claimId === selectedClaim.id) ? <p>No pre-authorisation recorded.</p> : null}
              </div>
              <h3>Line Items</h3>
              <div className="insurance-mini-list">
                {Array.isArray(selectedClaim.lineItems) && selectedClaim.lineItems.length ? selectedClaim.lineItems.slice(0, 5).map((item: any, index: number) => (
                  <p key={`${item.lineItemId || index}`}><strong>{item.description || item.code || "Item"}</strong>{money(item.total)}</p>
                )) : <p>No claim line items loaded.</p>}
              </div>
              <h3>Payments</h3>
              <div className="insurance-mini-list">
                {Array.isArray(selectedClaim.payments) && selectedClaim.payments.length ? selectedClaim.payments.slice(0, 5).map((payment: any, index: number) => (
                  <p key={`${payment.paymentId || index}`}><strong>{money(payment.amount)}</strong>{payment.method || "TRANSFER"} {payment.referenceNumber ? `- ${payment.referenceNumber}` : ""}</p>
                )) : <p>No insurer payments recorded.</p>}
              </div>
              <button className="insurance-detail-action" type="button" onClick={() => openCoverageModal(selectedClaim)}>
                Review patient coverage
              </button>
            </>
          ) : (
            <p className="pv-empty">Click a claim row to review submission, pre-auth, payment, and monitoring details.</p>
          )}
        </aside>
      </main>

      {claimModal ? (
        <InsuranceModal title="Electronic Claim Submission" tone="green" onClose={() => setClaimModal(false)} onSubmit={submitClaim} saving={submitting === "claim"} saveText={claimForm.submitNow ? "Submit Electronically" : "Save Draft"}>
          <Field label="Patient ID"><input required list="insurance-patient-options" value={claimForm.patientId} onChange={(e) => setClaimForm({ ...claimForm, patientId: e.target.value })} /></Field>
          <Field label="Bill / Invoice ID"><input list="insurance-bill-options" value={claimForm.billId} onChange={(e) => setClaimForm({ ...claimForm, billId: e.target.value })} /></Field>
          <Field label="Insurance Provider"><input required value={claimForm.provider} onChange={(e) => setClaimForm({ ...claimForm, provider: e.target.value })} placeholder="SHA / Jubilee / AAR" /></Field>
          <Field label="Policy / Member Number"><input required value={claimForm.policyNumber} onChange={(e) => setClaimForm({ ...claimForm, policyNumber: e.target.value })} /></Field>
          <Field label="Claim Amount"><input required type="number" min="1" value={claimForm.claimAmount} onChange={(e) => setClaimForm({ ...claimForm, claimAmount: e.target.value })} /></Field>
          <label className="insurance-check"><input type="checkbox" checked={claimForm.diagnosisCodesVerified} onChange={(e) => setClaimForm({ ...claimForm, diagnosisCodesVerified: e.target.checked })} /> Diagnosis codes verified</label>
          <label className="insurance-check"><input type="checkbox" checked={claimForm.procedureCodesVerified} onChange={(e) => setClaimForm({ ...claimForm, procedureCodesVerified: e.target.checked })} /> Procedure codes verified</label>
          <label className="insurance-check"><input type="checkbox" checked={claimForm.documentsAttached} onChange={(e) => setClaimForm({ ...claimForm, documentsAttached: e.target.checked })} /> Supporting documents attached</label>
          <label className="insurance-check is-wide"><input type="checkbox" checked={claimForm.submitNow} onChange={(e) => setClaimForm({ ...claimForm, submitNow: e.target.checked })} /> Submit to SHA/private insurer API immediately</label>
        </InsuranceModal>
      ) : null}

      {preauthModal ? (
        <InsuranceModal title="Pre-Authorisation Request" tone="purple" onClose={() => setPreauthModal(false)} onSubmit={submitPreauth} saving={submitting === "preauth"} saveText="Submit Pre-Auth">
          <Field label="Claim ID"><input value={preauthForm.claimId} onChange={(e) => setPreauthForm({ ...preauthForm, claimId: e.target.value })} /></Field>
          <Field label="Patient ID"><input required list="insurance-patient-options" value={preauthForm.patientId} onChange={(e) => setPreauthForm({ ...preauthForm, patientId: e.target.value })} /></Field>
          <Field label="Procedure Code"><input value={preauthForm.procedureCode} onChange={(e) => setPreauthForm({ ...preauthForm, procedureCode: e.target.value })} /></Field>
          <Field label="Procedure Name"><input required value={preauthForm.procedureName} onChange={(e) => setPreauthForm({ ...preauthForm, procedureName: e.target.value })} /></Field>
          <Field label="Estimated Cost"><input required type="number" min="1" value={preauthForm.estimatedCost} onChange={(e) => setPreauthForm({ ...preauthForm, estimatedCost: e.target.value })} /></Field>
          <Field label="Urgency"><select value={preauthForm.urgency} onChange={(e) => setPreauthForm({ ...preauthForm, urgency: e.target.value })}><option>ROUTINE</option><option>URGENT</option><option>EMERGENCY</option></select></Field>
        </InsuranceModal>
      ) : null}

      {paymentModal ? (
        <InsuranceModal title="Record Insurer Payment" tone="blue" onClose={() => setPaymentModal(false)} onSubmit={recordPayment} saving={submitting === "payment"} saveText="Record Payment">
          <Field label="Claim ID"><input required value={paymentForm.claimId} onChange={(e) => setPaymentForm({ ...paymentForm, claimId: e.target.value })} /></Field>
          <Field label="Amount Paid"><input required type="number" min="1" value={paymentForm.amount} onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })} /></Field>
          <Field label="Payment Method"><select value={paymentForm.method} onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value })}><option>TRANSFER</option><option>CHEQUE</option><option>MPESA</option><option>BANK</option></select></Field>
          <Field label="Reference Number"><input value={paymentForm.referenceNumber} onChange={(e) => setPaymentForm({ ...paymentForm, referenceNumber: e.target.value })} /></Field>
          <label className="insurance-field is-wide"><span>Notes</span><textarea value={paymentForm.notes} onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })} /></label>
        </InsuranceModal>
      ) : null}

      {coverageModal ? (
        <InsuranceModal
          title="Coverage & Eligibility"
          tone="teal"
          onClose={() => setCoverageModal(false)}
          onSubmit={(event) => { event.preventDefault(); void saveCoverage(); }}
          saving={submitting === "coverage-save"}
          saveText="Save Coverage"
        >
          <Field label="Patient ID"><input required list="insurance-patient-options" value={coverageForm.patientId} onChange={(e) => setCoverageForm({ ...coverageForm, patientId: e.target.value })} placeholder="Patient / MRN ID" /></Field>
          <Field label="Payer / Insurer"><input required value={coverageForm.provider} onChange={(e) => setCoverageForm({ ...coverageForm, provider: e.target.value })} placeholder="SHA / Jubilee / AAR" /></Field>
          <Field label="Policy / Member Number"><input required value={coverageForm.policyNumber} onChange={(e) => setCoverageForm({ ...coverageForm, policyNumber: e.target.value })} /></Field>
          <Field label="Scheme ID"><input value={coverageForm.schemeId} onChange={(e) => setCoverageForm({ ...coverageForm, schemeId: e.target.value })} /></Field>
          <Field label="Coverage Category"><select value={coverageForm.coverageType} onChange={(e) => setCoverageForm({ ...coverageForm, coverageType: e.target.value })}><option value="">Select category</option><option>OUTPATIENT</option><option>INPATIENT</option><option>MATERNITY</option><option>EMERGENCY</option><option>DENTAL</option><option>OPTICAL</option><option>PHARMACY</option></select></Field>
          <Field label="Expiry Date"><input type="date" value={coverageForm.expiryDate} onChange={(e) => setCoverageForm({ ...coverageForm, expiryDate: e.target.value })} /></Field>
          <Field label="Employer / Sponsor"><input value={coverageForm.employer} onChange={(e) => setCoverageForm({ ...coverageForm, employer: e.target.value })} /></Field>
          <Field label="Co-payment (%)"><input type="number" min="0" max="100" value={coverageForm.copayPercent} onChange={(e) => setCoverageForm({ ...coverageForm, copayPercent: e.target.value })} /></Field>
          <label className="insurance-check is-wide"><input type="checkbox" checked={coverageForm.isPrincipal} onChange={(e) => setCoverageForm({ ...coverageForm, isPrincipal: e.target.checked })} /> Principal member</label>
          <div className="insurance-coverage-actions is-wide">
            <button type="button" className="insurance-inline-btn" onClick={() => void loadCoverageProfile()} disabled={submitting === "coverage-load"}>{submitting === "coverage-load" ? "Loading..." : "Load saved profile"}</button>
            <button type="button" className="insurance-inline-btn is-verify" onClick={() => void verifyCoverage()} disabled={submitting === "coverage-verify"}>{submitting === "coverage-verify" ? "Verifying..." : "Verify eligibility"}</button>
          </div>
          {coverageResult ? <div className={`insurance-eligibility-result is-${String(coverageResult.status || "flagged").toLowerCase()}`}><strong>{coverageResult.status || "RESULT"}</strong><span>{coverageResult.reason || "Eligibility response received."}</span><span>Remaining benefit: {money(coverageResult.remainingBenefit)}</span><span>{coverageResult.preAuthorisationRequired ? "Pre-authorisation required" : "Pre-authorisation not indicated"}</span></div> : null}
          {coverageProfile ? <div className="insurance-profile-note is-wide"><strong>{coverageProfile.patient?.fullName || coverageForm.patientId}</strong><span>{coverageProfile.insurances?.length || 0} coverage record(s) · {coverageProfile.hasActiveInsurance ? "Active policy" : "No active policy"}</span></div> : null}
        </InsuranceModal>
      ) : null}

      <datalist id="insurance-patient-options">
        {patientOptions.slice(0, 500).map((patient: any) => <option key={patient.id} value={patient.id}>{[patient.patientCode, patient.firstName, patient.lastName].filter(Boolean).join(" · ")}</option>)}
      </datalist>
      <datalist id="insurance-bill-options">
        {billOptions.slice(0, 500).map((bill: any) => <option key={bill.id} value={bill.id}>{bill.invoiceNumber || bill.billNumber || bill.id}</option>)}
      </datalist>

      {toast ? (
        <div
          className={`module-toast insurance-toast is-${toastType}`}
          role={toastType === "error" ? "alert" : "status"}
          aria-live={toastType === "error" ? "assertive" : "polite"}
        >
          <span className="insurance-toast-icon" aria-hidden="true">
            {toastType === "success" ? <CheckCircle2 size={17} /> : toastType === "warning" ? <AlertTriangle size={17} /> : <Info size={17} />}
          </span>
          <div className="insurance-toast-copy">
            <strong>Insurance</strong>
            <span>{toast}</span>
          </div>
          <button type="button" className="insurance-toast-close" aria-label="Dismiss Insurance notification" onClick={() => setToast("")}>
            <X size={16} />
          </button>
        </div>
      ) : null}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="insurance-field"><span>{label}</span>{children}</label>;
}

function InsuranceModal({
  title,
  tone,
  children,
  onClose,
  onSubmit,
  saving,
  saveText,
}: {
  title: string;
  tone: "green" | "purple" | "blue" | "teal";
  children: React.ReactNode;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  saving: boolean;
  saveText: string;
}) {
  return (
    <div className="insurance-modal-backdrop" onClick={onClose}>
      <form className={`insurance-modal is-${tone}`} onSubmit={onSubmit} onClick={(event) => event.stopPropagation()}>
        <header>
          <h2>{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close form">x</button>
        </header>
        <div className="insurance-form-grid">{children}</div>
        <footer>
          <button type="button" className="insurance-cancel" onClick={onClose}>Cancel</button>
          <button type="submit" className="insurance-save" disabled={saving}>{saving ? "Saving..." : saveText}</button>
        </footer>
      </form>
    </div>
  );
}
